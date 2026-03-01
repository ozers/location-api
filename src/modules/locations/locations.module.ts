import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationLog, AreaEntryLog, Area } from '../../entities';
import { LocationProcessor } from './locations.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([LocationLog, AreaEntryLog, Area]),
    BullModule.registerQueue({
      name: 'location-processing',
    }),
  ],
  controllers: [LocationsController],
  providers: [LocationsService, LocationProcessor],
})
export class LocationsModule {}
