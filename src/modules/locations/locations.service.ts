import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { CreateLocationDto } from './dto/create.location.dto';

@Injectable()
export class LocationsService {
  constructor(
    @InjectQueue('location-processing')
    private readonly locationProcessingQueue: Queue,
  ) {}

  async addToQueue(dto: CreateLocationDto) {
    await this.locationProcessingQueue.add('process-location', dto, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
}
