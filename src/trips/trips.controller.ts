// src/trips/trips.controller.ts

import { 
    Controller, 
    Post, 
    Body, 
    Req, 
    UseGuards, 
    HttpStatus, 
    HttpCode,
    UnauthorizedException,
    Get, 
    Query, 
} from '@nestjs/common';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { TripResponseDto, PaginatedTripResponseDto } from './dto/trip-response.dto'; // 👈 Updated Imports
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 

@Controller('trips')
@UseGuards(JwtAuthGuard) 
export class TripsController {
    constructor(private readonly tripsService: TripsService) {}

    /**
     * POST /trips
     * Creates a new trip for the traveler (carrier).
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createTrip(
        @Body() createTripDto: CreateTripDto,
        @Req() req: any, 
    ): Promise<TripResponseDto> {
        const carrierId = req.user?.id; 

        if (!carrierId) {
            throw new UnauthorizedException('Authentication details missing for trip creation.');
        }
        
        return await this.tripsService.create(createTripDto, carrierId);
    }

    /**
     * GET /trips/my-trips
     * Fetches paginated trips posted by the authenticated user.
     */
    @Get('my-trips')
    @HttpCode(HttpStatus.OK)
    async getMyTrips(
        @Req() req: any,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
    ): Promise<PaginatedTripResponseDto> { // 👈 Use the formal Paginated DTO type
        
        const carrierId = req.user?.id; 

        if (!carrierId) {
            throw new UnauthorizedException('User authentication token is invalid or missing user ID.');
        }

        return await this.tripsService.findMyTrips(
            carrierId, 
            Number(page), 
            Number(limit)
        );
    }


    /**
 * GET /trips/count
 * Returns the total number of active trips for the logged-in user.
 */
@Get('count')
@HttpCode(HttpStatus.OK)
async getTripCount(@Req() req: any): Promise<{ count: number }> {
    const carrierId = req.user?.id;

    if (!carrierId) {
        throw new UnauthorizedException('User ID missing from token.');
    }

    return await this.tripsService.countMyTrips(carrierId);
}

    /**
     * GET /trips
     * General discovery endpoint to see all active trips (Paginated).
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    async findAll(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
    ): Promise<PaginatedTripResponseDto> {
        return await this.tripsService.findAll(Number(page), Number(limit));
    }
}