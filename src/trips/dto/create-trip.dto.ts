// src/trips/dto/create-trip.dto.ts

import { 
    IsNotEmpty, 
    IsString, 
    IsDateString, 
    IsNumber, 
    IsOptional, 
    Min,
    Max,
    IsDecimal
} from 'class-validator';

export class CreateTripDto {
    
    // =========================================================
    // 🎯 UPDATED: ORIGIN FIELDS (Replaces 'from')
    // =========================================================
    @IsNotEmpty()
    @IsString()
    fromCountry: string; // Country of origin

    @IsNotEmpty()
    @IsString()
    fromState: string; // State/Province of origin

    @IsNotEmpty()
    @IsString()
    fromCity: string; // City of origin


    // =========================================================
    // 🎯 UPDATED: DESTINATION FIELDS (Replaces 'to')
    // =========================================================
    @IsNotEmpty()
    @IsString()
    toCountry: string; // Destination country

    @IsNotEmpty()
    @IsString()
    toState: string; // Destination State/Province

    @IsNotEmpty()
    @IsString()
    toCity: string; // Destination city
    
    // =========================================================


    @IsNotEmpty()
    @IsDateString()
    departureDate: string;

    @IsOptional()
    @IsDateString()
    returnDate?: string; // Optional: Only for round trips

    @IsNotEmpty()
    @IsNumber()
    @Min(0.1) // Must have at least a small amount of space
    @Max(100) // Sanity check max luggage space
    availableLuggageSpace: number;

    @IsOptional()
    @IsString()
    notes?: string;
}