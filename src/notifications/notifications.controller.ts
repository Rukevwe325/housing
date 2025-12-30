// src/notifications/notifications.controller.ts

import { 
    Controller, 
    Get, 
    Patch, 
    Param, 
    Query, // 👈 Added for pagination
    Request, 
    UseGuards, 
    ParseIntPipe 
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    /**
     * GET /notifications/unread-count
     * Returns the count of notifications where isRead = false.
     * Placed at the top to avoid conflict with /:id.
     */
    @Get('unread-count')
    async getUnreadCount(@Request() req) {
        return await this.notificationsService.getUnreadCount(req.user.id);
    }

    /**
     * GET /notifications
     * Retrieves paginated notifications for the user.
     * Usage: /notifications?page=1&limit=20
     */
    @Get()
    async getMine(
        @Request() req,
        @Query('page') page: number = 1,  // 👈 Default to page 1
        @Query('limit') limit: number = 20 // 👈 Default to 20 items
    ) {
        // We use +page and +limit to ensure they are treated as numbers
        return await this.notificationsService.getMyNotifications(
            req.user.id, 
            +page, 
            +limit
        );
    }

    /**
     * PATCH /notifications/mark-all-read
     * Sets isRead = true for all notifications belonging to the user.
     */
    @Patch('mark-all-read')
    async markAllRead(@Request() req) {
        return await this.notificationsService.markAllAsRead(req.user.id);
    }

    /**
     * PATCH /notifications/:id/read
     * Marks a specific notification as read.
     */
    @Patch(':id/read')
    async markRead(
        @Param('id', ParseIntPipe) id: number, 
        @Request() req
    ) {
        return await this.notificationsService.markAsRead(id, req.user.id);
    }
}