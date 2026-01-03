import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateMessageDto {
    @IsNumber()
    @IsNotEmpty()
    matchId: number;

    @IsString()
    @IsNotEmpty()
    content: string;
}