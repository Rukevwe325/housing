import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';

// Entities
import { Match } from './entities/match.entity';
import { Trip } from '../trips/entities/trip.entity';

// Modules
import { TripsModule } from '../trips/trips.module';
import { ItemRequestsModule } from '../item-requests/item-requests.module';
import { NotificationsModule } from '../notifications/notifications.module'; // 👈 1. Import the new module

@Module({
  imports: [
    TypeOrmModule.forFeature([Match, Trip]), 
    
    forwardRef(() => TripsModule),
    forwardRef(() => ItemRequestsModule),
    
    NotificationsModule, // 👈 2. Add it to the imports array
  ],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService], 
})
export class MatchesModule {}