import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { LocationLog, AreaEntryLog, Area } from '../../entities';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

@Processor('location-processing', {
  concurrency: parseInt(process.env.QUEUE_CONCURRENCY ?? '5', 10),
})
export class LocationProcessor extends WorkerHost implements OnModuleDestroy {
  private redis: Redis;

  constructor(
    @InjectRepository(LocationLog)
    private readonly locationLogRepository: Repository<LocationLog>,

    @InjectRepository(AreaEntryLog)
    private readonly areaEntryLogRepository: Repository<AreaEntryLog>,

    @InjectRepository(Area)
    private readonly areaRepository: Repository<Area>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    super();
    this.redis = new Redis({
      host: this.configService.get('redis.host'),
      port: this.configService.get('redis.port'),
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  async process(job: Job): Promise<void> {
    const { userId, latitude, longitude, timestamp } = job.data;

    await this.dataSource.transaction(async (manager) => {
      // DB writes are inside the transaction — all or nothing
      await manager.save(LocationLog, {
        userId,
        latitude,
        longitude,
        timestamp,
      });

      const areas: Area[] = await manager.query(
        `SELECT id, name FROM areas WHERE ST_Contains(boundary, ST_SetSRID(ST_MakePoint($1, $2), 4326))`,
        [longitude, latitude],
      );

      const logMode = this.configService.get<string>('app.logMode');
      const ttl = this.configService.get<number>('app.entryTtlSeconds') ?? 300;
      const currentAreaIds = new Set(areas.map((a) => a.id));

      if (logMode === 'entry_only') {
        const setKey = `user-areas:${userId}`;
        const previousAreaIds = await this.redis.smembers(setKey);

        // Remove areas the user has left
        const leftAreas = previousAreaIds.filter(
          (id) => !currentAreaIds.has(id),
        );
        if (leftAreas.length > 0) {
          await this.redis.srem(setKey, ...leftAreas);
        }

        // Find newly entered areas and log them
        for (const area of areas) {
          const isNew = await this.redis.sadd(setKey, area.id);
          if (isNew === 0) continue;

          await this.redis.expire(setKey, ttl);
          await manager.save(AreaEntryLog, {
            userId,
            areaId: area.id,
            enteredAt: timestamp,
          });
        }

        // Refresh TTL if user is in any area
        if (currentAreaIds.size > 0) {
          await this.redis.expire(setKey, ttl);
        }
      } else {
        for (const area of areas) {
          await manager.save(AreaEntryLog, {
            userId,
            areaId: area.id,
            enteredAt: timestamp,
          });
        }
      }
    });
  }
}
