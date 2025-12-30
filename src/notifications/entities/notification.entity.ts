import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
    MATCH_UPDATE = 'match_update',
    NEW_TRIP_MATCH = 'new_trip_match',
    SYSTEM = 'system'
}

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'uuid' }) // Matches the UUID type in your migration
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    title: string;

    @Column({ type: 'text' })
    message: string;

    @Column({
        type: 'enum',
        enum: NotificationType,
        default: NotificationType.SYSTEM
    })
    type: NotificationType;

    @Column({ default: false })
    isRead: boolean;

    @Column({ nullable: true })
    relatedId: string; // Used to store matchId for frontend navigation

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
}