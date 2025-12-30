import { Module, forwardRef } from '@nestjs/common'; // 🎯 Added forwardRef
import { TypeOrmModule } from '@nestjs/typeorm'; 
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { Trip } from './entities/trip.entity'; 

// 🎯 NEW: Import the MatchesModule
import { MatchesModule } from '../matches/matches.module'; 
// 🎯 NEW: Import the ItemRequestsModule
import { ItemRequestsModule } from '../item-requests/item-requests.module';

@Module({
  imports: [
    // 🟢 Register the Trip entity
    TypeOrmModule.forFeature([Trip]), 
    
    // 🎯 CRITICAL FIX: Use forwardRef for MatchesModule
    forwardRef(() => MatchesModule),
    
    // 🎯 CRITICAL FIX: Use forwardRef for ItemRequestsModule
    forwardRef(() => ItemRequestsModule), 
  ],
  controllers: [TripsController],
  providers: [TripsService],
  // 🟢 Exporting the service so other modules can use it
  exports: [TripsService] 
})
export class TripsModule {}