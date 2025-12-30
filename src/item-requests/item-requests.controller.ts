import { 
    Controller, 
    Post, 
    Get, 
    Body, 
    UseGuards, 
    Req, 
    Query, // 👈 Added for pagination params
    HttpCode, 
    HttpStatus,
    UnauthorizedException,
} from '@nestjs/common';
import { ItemRequestsService } from './item-requests.service';
import { CreateItemRequestDto } from './dto/create-item-request.dto';
import { ItemRequestResponseDto, PaginatedItemRequestResponseDto } from './dto/item-request-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 

@Controller('item-requests') 
@UseGuards(JwtAuthGuard) 
export class ItemRequestsController {
    constructor(private readonly itemRequestsService: ItemRequestsService) {}

    /**
     * POST /item-requests
     * Creates a new item request for the authenticated user.
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() createItemRequestDto: CreateItemRequestDto,
        @Req() req: any, 
    ): Promise<ItemRequestResponseDto> {
        const requesterId = req.user?.id; 

        if (!requesterId) {
            throw new UnauthorizedException('Authentication details missing for item request creation.');
        }

        return this.itemRequestsService.create(createItemRequestDto, requesterId);
    }

    /**
 * GET /item-requests/count
 * Returns the count of active requests for the logged-in user.
 */
@Get('count')
@HttpCode(HttpStatus.OK)
async getRequestCount(@Req() req: any): Promise<{ count: number }> {
    const requesterId = req.user?.id;

    if (!requesterId) {
        throw new UnauthorizedException('User authentication missing.');
    }

    return await this.itemRequestsService.countMyRequests(requesterId);
}

    /**
     * GET /item-requests/my
     * ✅ UPDATED: Fetches paginated item requests for the authenticated user.
     * Fixes error TS2740 by matching the Paginated DTO return type.
     */
    @Get('my') 
    @HttpCode(HttpStatus.OK)
    async getMyRequests(
        @Req() req: any,
        @Query('page') page: number = 1,  // 👈 Default page 1
        @Query('limit') limit: number = 10 // 👈 Default limit 10
    ): Promise<PaginatedItemRequestResponseDto> { 
        
        const requesterId = req.user?.id; 

        if (!requesterId) {
            throw new UnauthorizedException('User authentication token is invalid or missing user ID.');
        }

        // Convert query params to numbers and pass to service
        return this.itemRequestsService.findMyRequests(
            requesterId, 
            Number(page), 
            Number(limit)
        );
    }
}