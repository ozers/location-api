import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationLog } from '../../entities';
import { LocationProcessor } from './locations.processor';
import { AreasModule } from '../areas/areas.module';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LocationLog]),
    BullModule.registerQueue({
      name: 'location-processing',
    }),
    AreasModule,
    LogsModule,
  ],
  controllers: [LocationsController],
  providers: [LocationsService, LocationProcessor],
})
export class LocationsModule {}
