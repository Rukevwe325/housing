// src/messages/messages.service.ts

import { 
    Injectable, 
    NotFoundException, 
    ForbiddenException, 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Entities
import { Message } from './entities/message.entity';
import { Match, MatchStatus } from '../matches/entities/match.entity';

// DTOs
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
    constructor(
        @InjectRepository(Message)
        private readonly messageRepo: Repository<Message>,

        @InjectRepository(Match)
        private readonly matchRepo: Repository<Match>,
    ) {}

    /**
     * 1. GET ALL CONVERSATIONS (The Inbox List)
     * Shows a list of accepted matches with the other person's name and last message.
     */
    async getMyConversations(userId: string) {
        const activeMatches = await this.matchRepo.find({
            where: [
                { status: MatchStatus.ACCEPTED, trip: { carrierId: userId } },
                { status: MatchStatus.ACCEPTED, itemRequest: { requesterId: userId } },
            ],
            relations: [
                'itemRequest', 
                'trip', 
                'itemRequest.requester', 
                'trip.carrier'
            ],
        });

        const inbox = await Promise.all(
            activeMatches.map(async (match) => {
                const lastMessage = await this.messageRepo.findOne({
                    where: { matchId: match.id },
                    order: { createdAt: 'DESC' },
                });

                const isCarrier = match.trip?.carrierId === userId;
                const otherParty = isCarrier 
                    ? match.itemRequest?.requester 
                    : match.trip?.carrier;

                return {
                    matchId: match.id,
                    lastMessage: lastMessage?.content || "No messages yet",
                    lastMessageDate: lastMessage?.createdAt || match.createdAt,
                    otherParty: {
                        id: otherParty?.id,
                        firstName: otherParty?.firstName,
                        lastName: otherParty?.lastName,
                    },
                    tripInfo: {
                        from: match.trip?.fromCity,
                        to: match.trip?.toCity,
                    }
                };
            })
        );

        // Sort: newest messages at the top
        return inbox.sort((a, b) => 
            new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
        );
    }

    /**
     * 2. SEND MESSAGE
     * Guarded by MatchStatus.ACCEPTED
     */
    async create(senderId: string, createMessageDto: CreateMessageDto) {
        const { matchId, content } = createMessageDto;

        const match = await this.matchRepo.findOne({
            where: { id: matchId },
            relations: ['itemRequest', 'trip'],
        });

        if (!match) throw new NotFoundException(`Match ${matchId} not found.`);

        if (match.status !== MatchStatus.ACCEPTED) {
            throw new ForbiddenException('Messaging is locked. Handshake not complete.');
        }

        const isParticipant = 
            match.itemRequest?.requesterId === senderId || 
            match.trip?.carrierId === senderId;

        if (!isParticipant) throw new ForbiddenException('Unauthorized.');

        const newMessage = this.messageRepo.create({
            matchId,
            senderId,
            content,
        });

        return await this.messageRepo.save(newMessage);
    }

    /**
     * 3. GET CHAT HISTORY (Rich Data)
     * Returns match metadata + message list in one go.
     */
    async findAllByMatch(matchId: number, userId: string) {
        // Fetch match with all user relations to identify the other party
        const match = await this.matchRepo.findOne({
            where: { id: matchId },
            relations: [
                'itemRequest', 
                'trip', 
                'itemRequest.requester', 
                'trip.carrier'
            ],
        });

        if (!match) throw new NotFoundException(`Match ${matchId} not found.`);

        // Security Check & Identification
        const isCarrier = match.trip?.carrierId === userId;
        const isRequester = match.itemRequest?.requesterId === userId;

        if (!isCarrier && !isRequester) {
            throw new ForbiddenException('You do not have permission to view this chat.');
        }

        // Fetch the actual messages
        const messages = await this.messageRepo.find({
            where: { matchId },
            order: { createdAt: 'ASC' },
        });

        // Determine the Other Party details
        const otherParty = isCarrier ? match.itemRequest?.requester : match.trip?.carrier;

        return {
            chatInfo: {
                matchId: match.id,
                status: match.status,
                otherParty: {
                    id: otherParty?.id,
                    firstName: otherParty?.firstName,
                    lastName: otherParty?.lastName,
                },
                tripDetails: {
                    from: match.trip?.fromCity,
                    to: match.trip?.toCity,
                }
            },
            messages: messages
        };
    }
}