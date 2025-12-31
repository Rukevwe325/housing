// src/matches/matches.service.ts

import { 
    Injectable, 
    NotFoundException, 
    BadRequestException, 
    UnauthorizedException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Entities and Enums
import { Match, MatchStatus } from './entities/match.entity';
import { Trip } from '../trips/entities/trip.entity';
import { ItemRequest } from '../item-requests/entities/item-request/item-request';
import { NotificationType } from '../notifications/entities/notification.entity';

// Services
import { NotificationsService } from '../notifications/notifications.service';

// DTOs
import { MatchResponseDto } from './dto/match-response.dto';
import { UpdateMatchStatusDto } from './dto/update-match-status.dto';

@Injectable()
export class MatchesService {
    constructor(
        @InjectRepository(Match)
        private matchesRepository: Repository<Match>,

        @InjectRepository(Trip)
        private tripsRepository: Repository<Trip>,

        private readonly notificationsService: NotificationsService,
    ) {}

    /**
     * Maps entity to DTO with User-Centric Display Logic
     */
    private mapToResponseDto(match: Match, currentUserId?: string): MatchResponseDto {
        const isRequester = match.itemRequest?.requesterId === currentUserId;
        const isCarrier = match.trip?.carrierId === currentUserId;

        let displayStatus = match.status.toString();
        let canAction = false;

        if (match.status === MatchStatus.PENDING) {
            displayStatus = 'New Match - Pending';
            canAction = true;
        } 
        else if (match.status === MatchStatus.CARRIER_ACCEPTED) {
            displayStatus = isCarrier ? 'Waiting for requester...' : 'Traveler accepted! Your turn.';
            canAction = !isCarrier;
        } 
        else if (match.status === MatchStatus.REQUESTER_ACCEPTED) {
            displayStatus = isRequester ? 'Waiting for traveler...' : 'Requester accepted! Your turn.';
            canAction = !isRequester;
        } 
        else if (match.status === MatchStatus.ACCEPTED) {
            displayStatus = 'Matched! Coordinate now.';
            canAction = false;
        } 
        else if (match.status === MatchStatus.REJECTED) {
            displayStatus = 'Declined';
            canAction = false;
        }

        return {
            id: match.id,
            itemRequestId: match.itemRequestId,
            tripId: match.tripId,
            status: match.status,
            displayStatus,
            canAction,
            agreedWeightKg: match.agreedWeightKg,
            createdAt: match.createdAt,
            itemRequest: match.itemRequest ? {
                id: match.itemRequest.id,
                itemName: match.itemRequest.itemName,
                fromCity: match.itemRequest.fromCity,
                toCity: match.itemRequest.toCity,
                weightKg: match.itemRequest.weightKg,
                requesterId: match.itemRequest.requesterId,
            } : null,
            trip: match.trip ? {
                id: match.trip.id,
                fromCity: match.trip.fromCity,
                toCity: match.trip.toCity,
                departureDate: match.trip.departureDate,
                carrierId: match.trip.carrierId,
            } : null,
        } as any;
    }

    /**
     * Paginated fetch for User Matches with Status AND Contextual Filtering (Trip/Request).
     */
    async findMatchesByUserId(
        userId: string, 
        page: number = 1, 
        limit: number = 10,
        statusFilter?: string,
        tripId?: number,        // 👈 Filter by specific Trip
        itemRequestId?: number  // 👈 Filter by specific Item Request
    ): Promise<{ data: MatchResponseDto[], total: number, page: number, lastPage: number }> {
        
        const skip = (page - 1) * limit;
        const query = this.matchesRepository
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.itemRequest', 'request')
            .leftJoinAndSelect('match.trip', 'trip')
            .where('(request.requesterId = :userId OR trip.carrierId = :userId)', { userId });

        // --- Contextual Filters ---
        if (tripId) {
            query.andWhere('match.tripId = :tripId', { tripId });
        }
        if (itemRequestId) {
            query.andWhere('match.itemRequestId = :itemRequestId', { itemRequestId });
        }

        // --- Status Toggle Filters ---
        if (statusFilter) {
            const filter = statusFilter.toUpperCase();
            if (filter === 'PENDING') {
                query.andWhere('match.status = :fStatus', { fStatus: MatchStatus.PENDING });
            } else if (filter === 'REJECTED') {
                query.andWhere('match.status = :fStatus', { fStatus: MatchStatus.REJECTED });
            } else if (filter === 'ACCEPTED') {
                query.andWhere('match.status IN (:...statuses)', { 
                    statuses: [MatchStatus.ACCEPTED, MatchStatus.CARRIER_ACCEPTED, MatchStatus.REQUESTER_ACCEPTED] 
                });
            }
        }

        // --- Apply Weight Constraint only for PENDING matches ---
        query.andWhere(`(
                match.status != :pStatus OR 
                CAST(request.weightKg AS DECIMAL) <= CAST(trip.availableLuggageSpace AS DECIMAL)
            )`, { pStatus: MatchStatus.PENDING });

        const [matches, total] = await query
            .orderBy('match.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();
            
        return {
            data: matches.map(match => this.mapToResponseDto(match, userId)),
            total,
            page,
            lastPage: Math.ceil(total / limit)
        };
    }

    /**
     * Gets PENDING count.
     */
    async countPendingMatches(userId: string): Promise<{ count: number }> {
        const count = await this.matchesRepository
            .createQueryBuilder('match')
            .leftJoin('match.itemRequest', 'request')
            .leftJoin('match.trip', 'trip')
            .where('match.status = :status', { status: MatchStatus.PENDING })
            .andWhere('(request.requesterId = :userId OR trip.carrierId = :userId)', { userId })
            .andWhere('CAST(request.weightKg AS DECIMAL) <= CAST(trip.availableLuggageSpace AS DECIMAL)')
            .getCount();

        return { count };
    }

    /**
     * Creates a match record.
     */
    async createMatchRecord(trip: Trip, request: ItemRequest): Promise<MatchResponseDto | null> {
        if (trip.carrierId === request.requesterId) return null; 
        if (Number(request.weightKg) > Number(trip.availableLuggageSpace)) return null;

        const existingMatch = await this.matchesRepository.findOne({
            where: { tripId: trip.id, itemRequestId: request.id },
            relations: ['itemRequest', 'trip'],
        });
        
        if (existingMatch) return this.mapToResponseDto(existingMatch, trip.carrierId);

        const newMatch = this.matchesRepository.create({
            itemRequestId: request.id,
            tripId: trip.id,
            status: MatchStatus.PENDING,
        });
        
        const savedMatch = await this.matchesRepository.save(newMatch);
        const fullMatch = await this.matchesRepository.findOne({
            where: { id: savedMatch.id },
            relations: ['itemRequest', 'trip'],
        });

        return fullMatch ? this.mapToResponseDto(fullMatch, trip.carrierId) : null;
    }

    /**
     * Gets a single match.
     */
    async findOne(matchId: number, currentUserId: string): Promise<MatchResponseDto> {
        const match = await this.matchesRepository.findOne({
            where: { id: matchId },
            relations: ['itemRequest', 'trip'],
        });

        if (!match) throw new NotFoundException(`Match ${matchId} not found.`);
        return this.mapToResponseDto(match, currentUserId);
    }

    /**
     * Double Handshake Status Updates.
     */
    async updateMatchStatus(
        matchId: number, 
        updateDto: UpdateMatchStatusDto, 
        currentUserId: string
    ): Promise<MatchResponseDto> {
        
        const match = await this.matchesRepository.findOne({
            where: { id: matchId },
            relations: ['itemRequest', 'trip'], 
        });

        if (!match) throw new NotFoundException(`Match ${matchId} not found.`);

        const isRequester = match.itemRequest.requesterId === currentUserId;
        const isCarrier = match.trip.carrierId === currentUserId;
        if (!isRequester && !isCarrier) throw new UnauthorizedException('Not authorized.');
        
        const oldStatus = match.status;
        const requestedAction = updateDto.status;
        const recipientId = isRequester ? match.trip.carrierId : match.itemRequest.requesterId;

        if (oldStatus === MatchStatus.REJECTED || oldStatus === MatchStatus.COMPLETED) {
            throw new BadRequestException(`Cannot modify match in ${oldStatus} state.`);
        }

        if (requestedAction === MatchStatus.REJECTED) {
            if (oldStatus !== MatchStatus.PENDING) await this.handleWeightRefund(match);
            match.status = MatchStatus.REJECTED;
            await this.notificationsService.notify(recipientId, 'Match Declined', 'The other party declined.', NotificationType.MATCH_UPDATE, matchId.toString());
        } 
        else if (requestedAction === MatchStatus.ACCEPTED) {
            if (isCarrier) {
                if (oldStatus === MatchStatus.PENDING) {
                    await this.handleWeightDeduction(match);
                    match.status = MatchStatus.CARRIER_ACCEPTED;
                } else if (oldStatus === MatchStatus.REQUESTER_ACCEPTED) {
                    await this.handleWeightDeduction(match);
                    match.status = MatchStatus.ACCEPTED;
                }
            } 
            else if (isRequester) {
                if (oldStatus === MatchStatus.PENDING) {
                    match.status = MatchStatus.REQUESTER_ACCEPTED;
                } else if (oldStatus === MatchStatus.CARRIER_ACCEPTED) {
                    match.status = MatchStatus.ACCEPTED;
                }
            }
            await this.notificationsService.notify(recipientId, 'Match Update', 'The status of your match has changed.', NotificationType.MATCH_UPDATE, matchId.toString());
        }

        const updatedMatch = await this.matchesRepository.save(match);
        return this.mapToResponseDto(updatedMatch, currentUserId);
    }

    private async handleWeightDeduction(match: Match): Promise<void> {
        const itemWeight = Number(match.itemRequest.weightKg);
        const availableSpace = Number(match.trip.availableLuggageSpace);
        if (availableSpace < itemWeight) throw new BadRequestException(`Insufficient luggage space.`);
        match.trip.availableLuggageSpace = availableSpace - itemWeight;
        match.agreedWeightKg = itemWeight;
        await this.tripsRepository.save(match.trip);
    }

    private async handleWeightRefund(match: Match): Promise<void> {
        const refund = Number(match.agreedWeightKg || match.itemRequest.weightKg);
        match.trip.availableLuggageSpace = Number(match.trip.availableLuggageSpace) + refund;
        await this.tripsRepository.save(match.trip);
    }
}