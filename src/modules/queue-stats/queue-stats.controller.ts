import { Controller, Get } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('queue')
export class QueueStatsController {
  constructor(
    @InjectQueue('location-processing')
    private readonly locationQueue: Queue,
  ) {}

  @Get('stats')
  async getStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.locationQueue.getWaitingCount(),
      this.locationQueue.getActiveCount(),
      this.locationQueue.getCompletedCount(),
      this.locationQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }
}
