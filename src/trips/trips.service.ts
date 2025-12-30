import { 
    Injectable, 
    NotFoundException, 
    Inject, 
    forwardRef, 
    BadRequestException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, FindOptionsWhere } from 'typeorm';

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
     * Creates a new trip with duplicate check.
     */
    async create(createTripDto: CreateTripDto, carrierId: string): Promise<TripResponseDto> {
        const normalizedDepartureDate = new Date(createTripDto.departureDate)
            .toISOString()
            .split('T')[0];

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
                `Duplicate Error: You already have an active trip from ${createTripDto.fromCity} on this date.`
            );
        }

        const newTrip = this.tripsRepository.create({
            ...createTripDto,
            carrierId: carrierId, 
            status: 'active',
        });

        const savedTrip = await this.tripsRepository.save(newTrip);

        this.triggerMatchingProcess(savedTrip).catch(error => {
            console.error(`Matching error for trip ${savedTrip.id}:`, error);
        }); 

        return this.mapToResponseDto(savedTrip);
    }

    /**
     * Internal trigger for matching engine.
     */
    private async triggerMatchingProcess(newTrip: Trip): Promise<void> {
        const potentialRequests = await this.itemRequestsService.findPotentialMatches({
            fromCountry: newTrip.fromCountry,
            toCountry: newTrip.toCountry,
            departureDate: newTrip.departureDate.toISOString(), 
            returnDate: newTrip.returnDate ? newTrip.returnDate.toISOString() : undefined,
        });

        if (potentialRequests.length === 0) return;
        
        for (const request of potentialRequests) {
            if (request.weightKg <= newTrip.availableLuggageSpace) {
                await this.matchesService.createMatchRecord(newTrip, request as ItemRequest);
            }
        }
    }

    /**
     * Inverse Matching logic for ItemRequestsService.
     */
    public async findMatchingTripsForRequest(request: ItemRequest): Promise<Trip[]> {
        const desiredDate = new Date(request.desiredDeliveryDate); 

        const whereClause: FindOptionsWhere<Trip> = {
            fromCountry: request.fromCountry,
            toCountry: request.toCountry,
            status: 'active',
            departureDate: LessThanOrEqual(desiredDate), 
            availableLuggageSpace: MoreThanOrEqual(request.weightKg),
        };
        
        return await this.tripsRepository.find({
            where: whereClause,
            order: { departureDate: 'ASC' },
        });
    }

    /**
     * ✅ Paginated "My Trips"
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
 * Gets only the total count of active trips for a specific carrier.
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
     * ✅ Paginated Global Trip Search
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