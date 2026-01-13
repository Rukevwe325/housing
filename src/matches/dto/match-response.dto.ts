import { MatchStatus } from '../entities/match.entity';

export class MatchResponseDto {
    id: number;
    
    // Foreign Keys
    itemRequestId: number;
    tripId: number;

    // Core Match Data
    status: MatchStatus;
    displayStatus: string; // 👈 Add this for the custom UI text
    canAction: boolean;    // 👈 Add this to enable/disable buttons
    agreedWeightKg: number | null;
    createdAt: Date;

    itemRequest: {
        id: number;
        itemName: string;
        fromCity: string;
        toCity: string;
        weightKg: number;
        requesterId: string;
        desiredDeliveryDate?: Date; // Optional but good to have
    } | null;

    trip: {
        id: number;
        fromCity: string;
        toCity: string;
        departureDate: Date;
        carrierId: string;
        availableLuggageSpace: number; // 👈 Add this to match service
    } | null;
}

export class PaginatedMatchResponseDto {
    data: MatchResponseDto[];
    total: number;
    page: number;
    lastPage: number;
}