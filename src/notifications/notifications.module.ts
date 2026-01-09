// src/notifications/notifications.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { Notification } from './entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]) 
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService, 
    NotificationsGateway 
  ],
  exports: [
    NotificationsService, 
    NotificationsGateway // 👈 EXPORT THIS so MessagesService can use it!
  ],
})
export class NotificationsModule {}