// src/item-requests/dto/item-request-response.dto.ts

/**
 * 1. Base DTO for a single Item Request.
 * This represents the detailed data for one specific item.
 */
export class ItemRequestResponseDto {
    id: number;
    itemName: string;
    quantity: number;
    weightKg: number;
    
    // Structured Location Fields
    fromCountry: string;
    fromState: string;
    fromCity: string;

    toCountry: string;
    toState: string;
    toCity: string;
    
    desiredDeliveryDate: Date;
    
    notes?: string;
    status: string;
    
    potentialMatches: number; // Count of matches found by the matching engine
    createdAt: Date;
}

/**
 * 2. ✅ NEW: Wrapper DTO for Paginated Item Requests
 * Use this as the return type for your "findMyRequests" controller method.
 */
export class PaginatedItemRequestResponseDto {
    data: ItemRequestResponseDto[]; // The list of requests for the current page
    total: number;                 // Total number of requests in the database for this user
    page: number;                  // The current page number
    lastPage: number;              // The final page number available
}