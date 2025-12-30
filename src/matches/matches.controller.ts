// src/matches/matches.controller.ts

import { 
    Controller, 
    Get, 
    Patch, 
    Body, 
    Param, 
    ParseIntPipe, 
    UseGuards, 
    Request, 
    Query, 
    HttpCode, 
    HttpStatus, 
    UnauthorizedException,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchResponseDto, PaginatedMatchResponseDto } from './dto/match-response.dto';
import { UpdateMatchStatusDto } from './dto/update-match-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 

@Controller('matches')
@UseGuards(JwtAuthGuard) 
export class MatchesController {
    constructor(private readonly matchesService: MatchesService) {}

    /**
     * Helper to safely retrieve userId from the request object.
     */
    private getUserId(req: any): string {
        const userId = req.user?.id;
        if (!userId) {
            throw new UnauthorizedException('Authentication token is missing user ID.');
        }
        return userId;
    }

    /**
     * GET /matches/count/pending
     * Returns the number of matches awaiting action for the logged-in user.
     */
    @Get('count/pending')
    @HttpCode(HttpStatus.OK)
    async getPendingCount(@Request() req: any): Promise<{ count: number }> {
        const userId = this.getUserId(req);
        return await this.matchesService.countPendingMatches(userId);
    }

    /**
     * GET /matches
     * Retrieves paginated matches with support for:
     * 1. Status Toggles (pending, accepted, rejected)
     * 2. Contextual Views (tripId, itemRequestId)
     * 3. Pagination (page, limit)
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    async findMyMatches(
        @Request() req: any,
        @Query('page') page: number = 1,  
        @Query('limit') limit: number = 10,
        @Query('status') status?: string,
        @Query('tripId') tripId?: number,             // 👈 NEW: Filter by specific Trip
        @Query('itemRequestId') itemRequestId?: number // 👈 NEW: Filter by specific Item
    ): Promise<PaginatedMatchResponseDto> { 
        const userId = this.getUserId(req);
        
        return this.matchesService.findMatchesByUserId(
            userId, 
            +page, 
            +limit, 
            status,
            tripId ? +tripId : undefined,
            itemRequestId ? +itemRequestId : undefined
        );
    }
    
    /**
     * GET /matches/:id
     * Retrieves full details of a specific match with security check.
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async getMatchDetails(
        @Param('id', ParseIntPipe) id: number,
        @Request() req: any
    ): Promise<MatchResponseDto> {
        const userId = this.getUserId(req);
        return await this.matchesService.findOne(id, userId);
    }

    /**
     * PATCH /matches/:id/status
     * Updates the status of a specific match (e.g., ACCEPTED, REJECTED).
     * Handles weight deduction and notifications internally.
     */
    @Patch(':id/status')
    @HttpCode(HttpStatus.OK)
    async updateStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateMatchStatusDto,
        @Request() req: any,
    ): Promise<MatchResponseDto> {
        const userId = this.getUserId(req); 
        return this.matchesService.updateMatchStatus(id, updateDto, userId);
    }
}