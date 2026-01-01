import { 
    Injectable, 
    forwardRef, 
    Inject, 
    BadRequestException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, FindOptionsWhere } from 'typeorm';

// Entities and DTOs
import { ItemRequest } from './entities/item-request/item-request'; 
import { CreateItemRequestDto } from './dto/create-item-request.dto'; 
import { ItemRequestResponseDto, PaginatedItemRequestResponseDto } from './dto/item-request-response.dto'; 

// Services
import { MatchesService } from '../matches/matches.service';
import { TripsService } from '../trips/trips.service'; 

/**
 * Interface used for matching logic between Trips and Item Requests.
 */
export interface TripMatchCriteria {
    fromCountry: string;
    toCountry: string;
    departureDate: string; 
    returnDate?: string;
}

@Injectable()
export class ItemRequestsService {
    constructor(
        @InjectRepository(ItemRequest)
        private itemRequestsRepository: Repository<ItemRequest>,
        
        private readonly matchesService: MatchesService, 

        @Inject(forwardRef(() => TripsService))
        private readonly tripsService: TripsService, 
    ) {}

    /**
     * Creates a new item request with date validation, duplicate check, and matching trigger.
     */
    async create(
        createItemRequestDto: CreateItemRequestDto, 
        requesterId: string
    ): Promise<ItemRequestResponseDto> {
        
        // 1. 📅 Date Validation: Prevent past dates
        const desiredDate = new Date(createItemRequestDto.desiredDeliveryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Strip time for date-only comparison

        if (desiredDate < today) {
            throw new BadRequestException(
                `Invalid Date: Desired delivery date (${createItemRequestDto.desiredDeliveryDate}) cannot be in the past.`
            );
        }

        // 2. 🔍 Duplicate Check
        const existingRequest = await this.itemRequestsRepository
            .createQueryBuilder('request')
            .where('request.requesterId = :requesterId', { requesterId })
            .andWhere('LOWER(TRIM(request.itemName)) = LOWER(TRIM(:itemName))', { 
                itemName: createItemRequestDto.itemName 
            })
            .andWhere('request.desiredDeliveryDate = :deliveryDate', { 
                deliveryDate: createItemRequestDto.desiredDeliveryDate 
            })
            .andWhere('request.status = :status', { status: 'active' })
            .getOne();

        if (existingRequest) {
            throw new BadRequestException(
                `Duplicate Error: You already have an active request for '${createItemRequestDto.itemName}' on this date.`
            );
        }

        const newItemRequest = this.itemRequestsRepository.create({
            ...createItemRequestDto,
            requesterId: requesterId,
            status: 'active',
        });

        const savedRequest = await this.itemRequestsRepository.save(newItemRequest);
        
        // 🔔 Matching Logic Trigger (Async)
        this.triggerMatchingProcess(savedRequest).catch(error => {
             console.error(`Matching error for request ${savedRequest.id}:`, error);
        });
        
        return this.mapToResponseDto(savedRequest);
    }
    
    /**
     * Paginated "My Requests"
     */
    async findMyRequests(
        requesterId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<PaginatedItemRequestResponseDto> {
        
        const skip = (page - 1) * limit;

        const [requests, total] = await this.itemRequestsRepository.findAndCount({
            where: { requesterId },
            relations: ['matches'], 
            order: { createdAt: 'DESC' }, 
            skip: skip,
            take: limit,
        });

        const data = requests.map(request => this.mapToResponseDto(request));

        return {
            data,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }

    /**
     * Gets the total number of active item requests for a specific user.
     */
    async countMyRequests(requesterId: string): Promise<{ count: number }> {
        const count = await this.itemRequestsRepository.count({
            where: { 
                requesterId,
                status: 'active' 
            },
        });
        return { count };
    }

    /**
     * Logic for TripsService to find requests that match a Trip.
     */
    async findPotentialMatches(criteria: TripMatchCriteria): Promise<ItemRequest[]> {
        const tripDepartureDate = new Date(criteria.departureDate); 
        
        const whereClause: FindOptionsWhere<ItemRequest> = {
            fromCountry: criteria.fromCountry,
            toCountry: criteria.toCountry, 
            status: 'active',
            desiredDeliveryDate: MoreThanOrEqual(tripDepartureDate),
        };
        
        return await this.itemRequestsRepository.find({
            where: whereClause,
            order: { createdAt: 'ASC' }, 
        });
    }

    /**
     * Internal trigger for the matching engine.
     * UPDATED: Added self-matching prevention check.
     */
    private async triggerMatchingProcess(newRequest: ItemRequest): Promise<void> {
        try {
            const matchingTrips = await this.tripsService.findMatchingTripsForRequest(newRequest);
            
            if (matchingTrips.length === 0) return;

            for (const trip of matchingTrips) {
                // LOOPHOLE FIX: Don't match the requester with their own trips
                if (trip.carrierId === newRequest.requesterId) continue;

                if (Number(newRequest.weightKg) <= Number(trip.availableLuggageSpace)) {
                    await this.matchesService.createMatchRecord(trip, newRequest);
                }
            }
        } catch (error) {
            console.error(`Matching process failed: ${error.message}`);
        }
    }

    /**
     * DTO Mapping Helper.
     */
    private mapToResponseDto(request: ItemRequest): ItemRequestResponseDto {
        return {
            id: request.id,
            itemName: request.itemName,
            quantity: request.quantity,
            weightKg: request.weightKg,
            fromCountry: request.fromCountry,
            fromState: request.fromState,
            fromCity: request.fromCity,
            toCountry: request.toCountry,
            toState: request.toState,
            toCity: request.toCity,
            desiredDeliveryDate: request.desiredDeliveryDate,
            notes: request.notes,
            status: request.status,
            potentialMatches: request.matches ? request.matches.length : 0, 
            createdAt: request.createdAt,
        };
    }
}