import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../../users/entities/user.entity'; // **Verify this relative path is correct**
import { Match } from '../../../matches/entities/match.entity'; // 🎯 NEW: Import the Match Entity

@Entity('item_requests')
export class ItemRequest {
    
    // Primary Key (Auto-incremented integer for simplicity)
    @PrimaryGeneratedColumn('increment')
    id: number; 
    
    // --- Relationship to the Requester (User) ---
    @Column({ name: 'requesterId', type: 'uuid' }) // Store the foreign key
    requesterId: string;

    // Defines the ManyToOne relationship to the User entity
    @ManyToOne(() => User, user => user.itemRequests, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'requesterId' }) // Specify the column used for the join
    requester: User;
    // ---------------------------------------------
    
    @Column()
    itemName: string;

    @Column()
    quantity: number;
    
    // TypeORM 'decimal' type, matching precision/scale from your migration
    @Column({ type: 'decimal', precision: 5, scale: 2 })
    weightKg: number;

    // =========================================================
    // 🎯 FIX: NEW Structured Location Fields (Replacing 'destination')
    // =========================================================

    // --- ORIGIN (Where the item is sourced/bought from) ---
    @Column({ length: 100 })
    fromCountry: string;

    @Column({ length: 100 })
    fromState: string;

    @Column({ length: 255 })
    fromCity: string;

    // --- DESTINATION (Where the item needs to be delivered) ---
    @Column({ length: 100 })
    toCountry: string;

    @Column({ length: 100 })
    toState: string;

    @Column({ length: 255 })
    toCity: string;
    
    // =========================================================

    @Column({ type: 'date' })
    desiredDeliveryDate: Date; // 🎯 CRITICAL FIX: Changed from string to Date for TypeORM date operators

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ default: 'active' })
    status: string; // The status column

    // 🎯 NEW: Add the inverse relationship to the Match entity
    // One ItemRequest can have many Match records (matches)
    @OneToMany(() => Match, match => match.itemRequest)
    matches: Match[];

    // Automatically set the creation timestamp
    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}