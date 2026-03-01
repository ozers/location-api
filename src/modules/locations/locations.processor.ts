import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { LocationLog, AreaEntryLog, Area } from '../../entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Processor('location-processing')
export class LocationProcessor extends WorkerHost {
  private redis: Redis;

  constructor(
    @InjectRepository(LocationLog)
    private readonly locationLogRepository: Repository<LocationLog>,

    @InjectRepository(AreaEntryLog)
    private readonly areaEntryLogRepository: Repository<AreaEntryLog>,

    @InjectRepository(Area)
    private readonly areaRepository: Repository<Area>,
    private readonly configService: ConfigService,
  ) {
    super();
    this.redis = new Redis({
      host: this.configService.get('redis.host'),
      port: this.configService.get('redis.port'),
    });
  }

  async process(job: Job): Promise<void> {
    const { userId, latitude, longitude, timestamp } = job.data;

    await this.locationLogRepository.save({
      userId,
      latitude,
      longitude,
      timestamp,
    });

    const areas: Area[] = await this.areaRepository.query(
      `SELECT id, name FROM areas WHERE ST_Contains(boundary, ST_SetSRID(ST_MakePoint($1, $2), 4326))`,
      [longitude, latitude],
    );

    const logMode = this.configService.get<string>('app.logMode');
    const ttl = this.configService.get<number>('app.entryTtlSeconds') ?? 300;

    for (const area of areas) {
      if (logMode === 'entry_only') {
        const key = `entry:${userId}:${area.id}`;
        const exists = await this.redis.get(key);

        if (exists) continue;

        await this.redis.setex(key, ttl, '1');
      }

      await this.areaEntryLogRepository.save({
        userId,
        areaId: area.id,
        enteredAt: timestamp,
      });
    }
  }
}
