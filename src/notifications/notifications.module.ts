// src/notifications/notifications.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway'; // 👈 Added
import { Notification } from './entities/notification.entity';

@Module({
  imports: [
    // Registers the Notification entity repository
    TypeOrmModule.forFeature([Notification]) 
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService, 
    NotificationsGateway // 👈 Added to handle real-time WebSockets
  ],
  exports: [
    NotificationsService // Exported so MatchesService can trigger notifications
  ],
})
export class NotificationsModule {}