// src/messages/messages.service.ts

import { 
    Injectable, 
    NotFoundException, 
    ForbiddenException, 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Message } from './entities/message.entity';
import { Match, MatchStatus } from '../matches/entities/match.entity';
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
     * 1. GET ALL CONVERSATIONS (Inbox)
     * Includes all matches that have a message history, regardless of current status.
     */
    async getMyConversations(userId: string) {
        const activeMatches = await this.matchRepo.find({
            where: [
                { 
                    status: In([MatchStatus.ACCEPTED, 'rejected', 'canceled', 'completed']), 
                    trip: { carrierId: userId } 
                },
                { 
                    status: In([MatchStatus.ACCEPTED, 'rejected', 'canceled', 'completed']), 
                    itemRequest: { requesterId: userId } 
                },
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
                    status: match.status,
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

        return inbox.sort((a, b) => 
            new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
        );
    }

    /**
     * 2. SEND MESSAGE
     * STRICT: Only allowed if status is currently ACCEPTED.
     */
    async create(senderId: string, createMessageDto: CreateMessageDto) {
        const { matchId, content } = createMessageDto;

        const match = await this.matchRepo.findOne({
            where: { id: matchId },
            relations: ['itemRequest', 'trip'],
        });

        if (!match) throw new NotFoundException(`Match ${matchId} not found.`);

        // Safety: Block new messages if the deal is no longer active
        if (match.status !== MatchStatus.ACCEPTED) {
            throw new ForbiddenException(
                `Messaging is disabled because this match is currently ${match.status}.`
            );
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
     * 3. GET CHAT HISTORY
     * Returns rich data including metadata to help the frontend lock/unlock the UI.
     */
    async findAllByMatch(matchId: number, userId: string) {
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

        const isCarrier = match.trip?.carrierId === userId;
        const isRequester = match.itemRequest?.requesterId === userId;

        if (!isCarrier && !isRequester) {
            throw new ForbiddenException('You do not have permission to view this chat.');
        }

        const messages = await this.messageRepo.find({
            where: { matchId },
            order: { createdAt: 'ASC' },
        });

        const otherParty = isCarrier ? match.itemRequest?.requester : match.trip?.carrier;

        return {
            chatInfo: {
                matchId: match.id,
                status: match.status,
                // UI HELPER: Frontend uses this to enable/disable the input box
                canSendMessage: match.status === MatchStatus.ACCEPTED,
                isLocked: match.status !== MatchStatus.ACCEPTED,
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