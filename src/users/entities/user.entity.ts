import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    // 👈 Imports for relationships
    OneToMany 
} from 'typeorm';

// 👈 Corrected Import paths for related entities
import { Trip } from '../../trips/entities/trip.entity'; 
// 🟢 FIX: The filename is 'item-request.ts', so we remove the '.entity' suffix.
import { ItemRequest } from '../../item-requests/entities/item-request/item-request'; 

@Entity('users') // Maps this class to the 'users' table
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    // Authentication Fields
    @Column({ nullable: true, select: false }) 
    passwordHash: string; 

    @Column({ nullable: true })
    googleId: string; 

    @Column({ default: 'local' }) 
    authStrategy: string; 

    // Role
    @Column({ default: 'standard' })
    role: string;

    // Timestamps
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
    
    @Column({ type: 'timestamp', default: () => 'CURRENT-TIMESTAMP' })
    updatedAt: Date;

    // 🟢 EXISTING: Relationship to Trips (User is the carrier)
    // Links to the 'carrier' property in the Trip entity.
    @OneToMany(() => Trip, trip => trip.carrier)
    trips: Trip[];
    
    // 🟢 NEW: Relationship to ItemRequests (User is the requester)
    // Links to the 'requester' property in the ItemRequest entity.
    @OneToMany(() => ItemRequest, itemRequest => itemRequest.requester)
    itemRequests: ItemRequest[];
}