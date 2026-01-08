// src/notifications/notifications.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepo: Repository<Notification>,
        
        private readonly notificationsGateway: NotificationsGateway,
    ) {}

    /**
     * Get count of unread notifications for the badge icon.
     */
    async getUnreadCount(userId: string): Promise<{ count: number }> {
        const count = await this.notificationRepo.count({
            where: { 
                userId, 
                isRead: false 
            }
        });
        return { count };
    }

    /**
     * Create a new notification, save to DB, and push via WebSockets.
     */
    async notify(
        userId: string, 
        title: string, 
        message: string, 
        type: NotificationType, 
        relatedId?: string
    ) {
        const notification = this.notificationRepo.create({
            userId,
            title,
            message,
            type,
            relatedId,
            isRead: false,
        });
        
        const savedNotification = await this.notificationRepo.save(notification);

        // Get updated unread count to push to the UI
        const { count } = await this.getUnreadCount(userId);

        // Trigger Real-Time WebSocket Push
        this.notificationsGateway.sendNotificationToUser(userId, {
            ...savedNotification,
            unreadCount: count
        });

        return savedNotification;
    }

    /**
     * Retrieves notifications with Pagination.
     * Hydrates generic notifications with real Match/Trip details.
     */
    async getMyNotifications(userId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        // 1. Fetch the raw notification history (DESC order = newest first)
        const [notifications, total] = await this.notificationRepo.findAndCount({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: skip,
        });

        // 2. REAL-WORLD LOGIC: Reset badge count when the user views the first page
        if (page === 1 && notifications.length > 0) {
            await this.markAllAsRead(userId);
        }

        // 3. ENRICH DATA: Fetch details so the JSON isn't generic
        const detailedData = await Promise.all(notifications.map(async (notif) => {
            let details: any = null; // ': any' fixes the TypeScript error 2322

            if (notif.type === NotificationType.MATCH_UPDATE && notif.relatedId) {
                // Look up Match details using the global manager (avoids circular dependency)
                const match = await this.notificationRepo.manager.getRepository('Match').findOne({
                    where: { id: parseInt(notif.relatedId) },
                    relations: ['itemRequest', 'trip']
                }) as any;

                if (match) {
                    details = {
                        itemName: match.itemRequest?.itemName,
                        toCity: match.trip?.toCity,
                        departureDate: match.trip?.departureDate,
                        matchStatus: match.status
                    };
                }
            }

            return {
                ...notif,
                details // Adds the item/trip context to each notification
            };
        }));

        return {
            data: detailedData,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }

    /**
     * Mark a specific notification as- read.
     */
    async markAsRead(id: number, userId: string) {
        const notification = await this.notificationRepo.findOne({ 
            where: { id, userId } 
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        notification.isRead = true;
        return await this.notificationRepo.save(notification);
    }

    /**
     * Mark ALL notifications as read for a user.
     */
    async markAllAsRead(userId: string) {
        await this.notificationRepo.update(
            { userId, isRead: false }, 
            { isRead: true }
        );
        return { success: true };
    }
}