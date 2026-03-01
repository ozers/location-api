import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueStatsController } from './queue-stats.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'location-processing',
    }),
  ],
  controllers: [QueueStatsController],
})
export class QueueStatsModule {}
