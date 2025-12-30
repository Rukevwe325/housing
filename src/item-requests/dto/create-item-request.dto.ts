import { IsNotEmpty, IsNumber, IsString, IsOptional, Min, IsDateString, MaxLength } from 'class-validator';

export class CreateItemRequestDto {
    
    @IsString()
    @IsNotEmpty()
    itemName: string; // Item Name / Description

    @IsNumber()
    @Min(1)
    @IsNotEmpty()
    quantity: number;

    // Weight must be a number with up to 2 decimal places and at least 0.01 kg
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0.01)
    @IsNotEmpty()
    weightKg: number; // Weight (kg)


    // =========================================================
    // 🎯 UPDATED: ORIGIN FIELDS (Where the item is sourced/bought from)
    // =========================================================
    // Note: We enforce IsNotEmpty for mandatory location data.

    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    fromCountry: string; 

    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    fromState: string; 

    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    fromCity: string; 


    // =========================================================
    // 🎯 UPDATED: DESTINATION FIELDS (Replaces 'destination')
    // =========================================================

    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    toCountry: string; 

    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    toState: string; 

    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    toCity: string; 

    // =========================================================

    // Ensures the date string is in a valid format (e.g., YYYY-MM-DD)
    @IsDateString()
    @IsNotEmpty()
    desiredDeliveryDate: string; 

    @IsString()
    @IsOptional()
    notes?: string; // Notes / Special Instructions
}