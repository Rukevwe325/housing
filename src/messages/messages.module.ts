// src/messages/messages.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { Message } from './entities/message.entity';
import { Match } from '../matches/entities/match.entity';

// 🟢 Import the NotificationsModule to access the Gateway
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Match]),
    NotificationsModule, // 👈 This makes NotificationsGateway available to MessagesService
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}