import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { MatchStatus } from '../entities/match.entity';

/**
 * DTO for updating a match record's status.
 */
export class UpdateMatchStatusDto {
    
    // Only allow status changes to ACCEPTED, REJECTED, or COMPLETED via API call
    // PENDING is the initial state, and INTERESTED is often internal or managed differently.
    @IsEnum(MatchStatus)
    status: MatchStatus;

    // The agreed weight may be updated when the match is accepted
    @IsOptional()
    @IsNumber()
    agreedWeightKg?: number;
}