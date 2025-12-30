import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ItemRequest } from '../../item-requests/entities/item-request/item-request'; 
import { Trip } from '../../trips/entities/trip.entity';

export enum MatchStatus {
    PENDING = 'pending',
    CARRIER_ACCEPTED = 'carrier_accepted',   // 🆕 Added for handshake
    REQUESTER_ACCEPTED = 'requester_accepted', // 🆕 Added for handshake
    ACCEPTED = 'accepted',                   // Fully confirmed by both
    REJECTED = 'rejected',
    COMPLETED = 'completed',
    CANCELED = 'canceled',
}

@Entity('matches')
export class Match {
    @PrimaryGeneratedColumn('increment')
    id: number; 

    @Column({ name: 'itemRequestId', type: 'int' })
    itemRequestId: number;

    @ManyToOne(() => ItemRequest, request => request.matches)
    @JoinColumn({ name: 'itemRequestId' })
    itemRequest: ItemRequest;
    
    @Column({ name: 'tripId', type: 'int' })
    tripId: number;

    @ManyToOne(() => Trip, trip => trip.matches)
    @JoinColumn({ name: 'tripId' })
    trip: Trip;

    @Column({ type: 'enum', enum: MatchStatus, default: MatchStatus.PENDING })
    status: MatchStatus;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    agreedWeightKg: number; 

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}