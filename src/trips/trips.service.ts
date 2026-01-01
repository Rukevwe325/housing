import { 
    Injectable, 
    NotFoundException, 
    Inject, 
    forwardRef, 
    BadRequestException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, FindOptionsWhere, Between } from 'typeorm';

// Entities and DTOs
import { Trip } from './entities/trip.entity';
import { CreateTripDto } from './dto/create-trip.dto';
import { TripResponseDto, PaginatedTripResponseDto } from './dto/trip-response.dto'; 

// Services
import { MatchesService } from '../matches/matches.service';
import { ItemRequestsService } from '../item-requests/item-requests.service';
import { ItemRequest } from '../item-requests/entities/item-request/item-request';

@Injectable()
export class TripsService {
    constructor(
        @InjectRepository(Trip)
        private tripsRepository: Repository<Trip>,
        
        private readonly matchesService: MatchesService,
        
        @Inject(forwardRef(() => ItemRequestsService))
        private readonly itemRequestsService: ItemRequestsService,
    ) {}

    /**
     * Creates a new trip with comprehensive date validation and duplicate check.
     */
    async create(createTripDto: CreateTripDto, carrierId: string): Promise<TripResponseDto> {
        const departureDate = new Date(createTripDto.departureDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Strip time for date-only comparison

        // 1. Validation: Prevent past dates
        if (departureDate < today) {
            throw new BadRequestException("Departure date cannot be in the past.");
        }

        // 2. Validation: Prevent return date being before departure
        if (createTripDto.returnDate) {
            const returnDate = new Date(createTripDto.returnDate);
            if (returnDate < departureDate) {
                throw new BadRequestException(
                    `Invalid Timeline: Return date (${createTripDto.returnDate}) cannot be before Departure date (${createTripDto.departureDate}).`
                );
            }
        }

        const normalizedDepartureDate = departureDate.toISOString().split('T')[0];

        // 3. Duplicate Check for active trips on the same day/route
        const existingTrip = await this.tripsRepository
            .createQueryBuilder('trip')
            .where('trip.carrierId = :carrierId', { carrierId })
            .andWhere('LOWER(TRIM(trip.fromCity)) = LOWER(TRIM(:fromCity))', { fromCity: createTripDto.fromCity })
            .andWhere('LOWER(TRIM(trip.toCity)) = LOWER(TRIM(:toCity))', { toCity: createTripDto.toCity })
            .andWhere('trip.departureDate = :departureDate', { departureDate: normalizedDepartureDate })
            .andWhere('trip.status = :status', { status: 'active' })
            .getOne();

        if (existingTrip) {
            throw new BadRequestException(
                `Duplicate Error: You already have an active trip from ${createTripDto.fromCity} to ${createTripDto.toCity} on this date.`
            );
        }

        const newTrip = this.tripsRepository.create({
            ...createTripDto,
            carrierId: carrierId, 
            status: 'active',
        });

        const savedTrip = await this.tripsRepository.save(newTrip);

        // Run matching in background
        this.triggerMatchingProcess(savedTrip).catch(error => {
            console.error(`Matching error for trip ${savedTrip.id}:`, error);
        }); 

        return this.mapToResponseDto(savedTrip);
    }

    /**
     * Internal trigger for matching engine.
     * FIX: Wraps dates in new Date() to prevent ".toISOString is not a function" error.
     */
    private async triggerMatchingProcess(newTrip: Trip): Promise<void> {
        // Ensure we are working with Date objects (DB sometimes returns strings)
        const depDate = new Date(newTrip.departureDate);
        const retDate = newTrip.returnDate ? new Date(newTrip.returnDate) : undefined;

        const potentialRequests = await this.itemRequestsService.findPotentialMatches({
            fromCountry: newTrip.fromCountry,
            toCountry: newTrip.toCountry,
            departureDate: depDate.toISOString(), 
            returnDate: retDate ? retDate.toISOString() : undefined,
        });

        if (potentialRequests.length === 0) return;
        
        for (const request of potentialRequests) {
            // Safety: Cast to Number to ensure mathematical comparison
            if (Number(request.weightKg) <= Number(newTrip.availableLuggageSpace)) {
                await this.matchesService.createMatchRecord(newTrip, request as ItemRequest);
            }
        }
    }

    /**
     * Inverse Matching: Finds trips that can carry a specific item request.
     */
    public async findMatchingTripsForRequest(request: ItemRequest): Promise<Trip[]> {
        const desiredDate = new Date(request.desiredDeliveryDate); 
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return await this.tripsRepository.find({
            where: {
                fromCountry: request.fromCountry,
                toCountry: request.toCountry,
                status: 'active',
                departureDate: Between(today, desiredDate), 
                availableLuggageSpace: MoreThanOrEqual(request.weightKg),
            },
            order: { departureDate: 'ASC' },
        });
    }

    /**
     * Paginated "My Trips"
     */
    async findMyTrips(
        carrierId: string, 
        page: number = 1, 
        limit: number = 10
    ): Promise<PaginatedTripResponseDto> {
        const skip = (page - 1) * limit;

        const [myTrips, total] = await this.tripsRepository.findAndCount({
            where: { carrierId },
            relations: ['matches'], 
            order: { departureDate: 'ASC' }, 
            take: limit,
            skip: skip,
        });

        return {
            data: myTrips.map(trip => this.mapToResponseDto(trip)),
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }

    /**
     * Active trip count for badge icons.
     */
    async countMyTrips(carrierId: string): Promise<{ count: number }> {
        const count = await this.tripsRepository.count({
            where: { 
                carrierId,
                status: 'active' 
            },
        });
        return { count };
    }

    /**
     * Paginated Global Trip Search
     */
    async findAll(
        page: number = 1, 
        limit: number = 10
    ): Promise<PaginatedTripResponseDto> {
        const skip = (page - 1) * limit;

        const [trips, total] = await this.tripsRepository.findAndCount({
            where: { status: 'active' },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: skip,
        });

        return {
            data: trips.map(trip => this.mapToResponseDto(trip)),
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }

    private mapToResponseDto(trip: Trip): TripResponseDto {
        return {
            id: trip.id,
            fromCountry: trip.fromCountry,
            fromState: trip.fromState,
            fromCity: trip.fromCity,
            toCountry: trip.toCountry,
            toState: trip.toState,
            toCity: trip.toCity,
            departureDate: trip.departureDate, 
            returnDate: trip.returnDate,
            availableLuggageSpace: trip.availableLuggageSpace,
            notes: trip.notes,
            status: trip.status,
            matches: trip.matches ? trip.matches.length : 0, 
        };
    }
}