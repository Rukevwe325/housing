export class MessageResponseDto {
    id: number;
    matchId: number;
    senderId: string;
    content: string;
    isRead: boolean;
    createdAt: Date;
}