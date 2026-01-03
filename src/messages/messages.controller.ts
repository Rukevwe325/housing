// src/messages/messages.controller.ts

import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * GET /messages/inbox
   * Retrieves the list of all active conversations (chats) for the logged-in user.
   */
  @Get('inbox')
  getInbox(@Req() req) {
    return this.messagesService.getMyConversations(req.user.id);
  }

  /**
   * POST /messages
   * Sends a new message within an accepted match.
   */
  @Post()
  create(@Req() req, @Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(req.user.id, createMessageDto);
  }

  /**
   * GET /messages/match/:matchId
   * Retrieves the full chat history for a specific match.
   */
  @Get('match/:matchId')
  findAll(@Param('matchId') matchId: string, @Req() req) {
    return this.messagesService.findAllByMatch(+matchId, req.user.id);
  }
}