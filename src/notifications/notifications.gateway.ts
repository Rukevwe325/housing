// src/notifications/notifications.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, replace with your frontend URL
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationsGateway');

  /**
   * Handle user connection
   */
  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (!userId) {
      this.logger.warn(`Connection denied: No userId provided. Client ID: ${client.id}`);
      client.disconnect();
      return;
    }

    const roomName = `user_${userId}`;
    client.join(roomName);
    
    this.logger.log(`Client connected: ${client.id} joined room: ${roomName}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * 1. General Notifications
   * Used for "New Match", "Trip Accepted", etc.
   */
  sendNotificationToUser(userId: string, payload: any) {
    const roomName = `user_${userId}`;
    this.server.to(roomName).emit('notification_received', payload);
    this.logger.log(`Notification emitted to room: ${roomName}`);
  }

  /**
   * 2. Real-Time Chat Messages
   * Pushes the new message bubble directly to the recipient
   */
  sendMessageToUser(userId: string, messagePayload: any) {
    const roomName = `user_${userId}`;
    this.server.to(roomName).emit('new_message', messagePayload);
    this.logger.log(`Chat message pushed to user: ${userId}`);
  }

  /**
   * 3. Typing Indicators
   * Tells the recipient: "The other person is typing..."
   */
  sendTypingStatus(userId: string, payload: { matchId: number; isTyping: boolean }) {
    const roomName = `user_${userId}`;
    this.server.to(roomName).emit('user_typing', payload);
  }
}