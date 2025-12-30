import { Module, forwardRef } from '@nestjs/common'; 
import { TypeOrmModule } from '@nestjs/typeorm'; 

// Services and Controllers
import { ItemRequestsService } from './item-requests.service';
import { ItemRequestsController } from './item-requests.controller';

// Entities
import { ItemRequest } from './entities/item-request/item-request'; 

// Modules
import { MatchesModule } from '../matches/matches.module';
import { TripsModule } from '../trips/trips.module';

@Module({
  imports: [
    // [0] Register ItemRequest entity
    TypeOrmModule.forFeature([ItemRequest]), 
    
    // [1] 🎯 FIX: Use forwardRef for MatchesModule too
    // This resolves the 'index [1] is undefined' error
    forwardRef(() => MatchesModule), 
    
    // [2] 🎯 FIX: Keep forwardRef for TripsModule
    forwardRef(() => TripsModule), 
  ],
  controllers: [ItemRequestsController],
  providers: [ItemRequestsService],
  
  // Export the service so other modules can use it
  exports: [ItemRequestsService], 
})
export class ItemRequestsModule {}