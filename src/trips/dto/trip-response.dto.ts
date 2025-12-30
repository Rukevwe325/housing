// src/trips/dto/trip-response.dto.ts

/**
 * 1. Base DTO for a single Trip record.
 * Reflects the structured location fields and fixed Date types.
 */
export class TripResponseDto {
    id: number;

    // Structured Location Fields
    fromCountry: string;
    fromState: string;
    fromCity: string;

    toCountry: string;
    toState: string;
    toCity: string;
    
    // Fixed Date types to resolve compilation errors
    departureDate: Date;
    returnDate: Date | null; 

    availableLuggageSpace: number;
    status: string;
    
    notes: string; 

    // Used for showing the number of potential matches to the traveler
    matches: number; 
}

/**
 * 2. ✅ NEW: Wrapper DTO for Paginated Trip Results
 * This matches the object returned by the findAndCount method in your service.
 */
export class PaginatedTripResponseDto {
    data: TripResponseDto[]; // Array of trips for the current page
    total: number;           // Total count of trips for this user/query
    page: number;            // Current page number
    lastPage: number;        // Total number of pages
}