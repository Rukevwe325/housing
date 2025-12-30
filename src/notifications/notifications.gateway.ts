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
    origin: '*', // In production, replace with your frontend URL (e.g., 'http://localhost:3000')
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationsGateway');

  /**
   * Handle user connection
   * Frontend should connect with: io('url', { query: { userId: '123' } })
   */
  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (!userId) {
      this.logger.warn(`Connection denied: No userId provided. Client ID: ${client.id}`);
      client.disconnect();
      return;
    }

    // Join a unique room for this specific user
    const roomName = `user_${userId}`;
    client.join(roomName);
    
    this.logger.log(`Client connected: ${client.id} joined room: ${roomName}`);
  }

  /**
   * Handle user disconnection
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Pushes a notification to a specific user's room
   * This is called by the NotificationsService
   */
  sendNotificationToUser(userId: string, payload: any) {
    const roomName = `user_${userId}`;
    this.server.to(roomName).emit('notification_received', payload);
    this.logger.log(`Notification emitted to room: ${roomName}`);
  }
}