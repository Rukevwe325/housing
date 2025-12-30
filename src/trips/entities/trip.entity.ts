import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Adjust path based on your actual structure
import { Match } from '../../matches/entities/match.entity'; // 🎯 NEW: Import the Match Entity (Adjust path if needed)

@Entity('trips') // Maps this class to the 'trips' table
export class Trip {
    
    // Primary Key (Auto-incremented Integer)
    @PrimaryGeneratedColumn('increment')
    id: number;

    // Foreign Key to the User entity (The Carrier)
    @Column({ name: 'carrierId', type: 'uuid' }) 
    carrierId: string;
    
    // Relationship Definition
    @ManyToOne(() => User, user => user.trips, { 
        onDelete: 'CASCADE', 
        eager: true       
    })
    @JoinColumn({ name: 'carrierId' }) 
    carrier: User;

    // =========================================================
    // 🎯 REFACTORED LOCATION FIELDS (UNCHANGED)
    // =========================================================

    // --- ORIGIN (Replaces 'from') ---
    @Column({ length: 100 })
    fromCountry: string;

    @Column({ length: 100 })
    fromState: string;

    @Column({ length: 255 })
    fromCity: string;
    
    // --- DESTINATION (Replaces 'to') ---
    @Column({ length: 100 })
    toCountry: string;

    @Column({ length: 100 })
    toState: string;

    @Column({ length: 255 })
    toCity: string;
    
    // =========================================================

    @Column({ type: 'date' })
    departureDate: Date; // 🎯 CRITICAL FIX: Changed from string to Date

    @Column({ type: 'date', nullable: true })
    returnDate: Date | null; // 🎯 CRITICAL FIX: Changed from string to Date | null

    @Column({ 
        type: 'decimal', 
        precision: 5, 
        scale: 2 
    })
    availableLuggageSpace: number;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ default: 'active' })
    status: string; 

    // 🎯 NEW: Add the inverse relationship to the Match entity
    // One Trip can be associated with many Match records
    @OneToMany(() => Match, match => match.trip)
    matches: Match[];

    // Timestamps
    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}