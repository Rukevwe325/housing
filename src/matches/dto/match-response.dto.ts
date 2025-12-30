import { MatchStatus } from '../entities/match.entity';

/**
 * 1. Base DTO for a single Match record.
 * Includes nested summary objects for the associated Item and Trip.
 */
export class MatchResponseDto {
    id: number;
    
    // Foreign Keys
    itemRequestId: number;
    tripId: number;

    // Core Match Data
    status: MatchStatus;
    agreedWeightKg: number | null;
    createdAt: Date;

    /**
     * Nested Item Request Details
     * Marked as "| null" to prevent TS errors when relations aren't joined.
     */
    itemRequest: {
        id: number;
        itemName: string;
        fromCity: string;
        toCity: string;
        weightKg: number;
        requesterId: string;
    } | null;

    /**
     * Nested Trip Details
     * Marked as "| null" to prevent TS errors when relations aren't joined.
     */
    trip: {
        id: number;
        fromCity: string;
        toCity: string;
        departureDate: Date;
        carrierId: string;
    } | null;
}

/**
 * 2. ✅ NEW: Wrapper DTO for Paginated Results
 * This is what your "findMatchesByUserId" service and controller will return.
 */
export class PaginatedMatchResponseDto {
    data: MatchResponseDto[]; // The actual list of matches
    total: number;             // Total count in database
    page: number;              // Current page number
    lastPage: number;          // Total number of pages available
}