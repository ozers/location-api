import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AreaEntryLog } from '../../entities';
import { QueryLogsDto } from './dto/query-logs.dto';

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(AreaEntryLog)
    private readonly areaEntryLogRepository: Repository<AreaEntryLog>,
  ) {}

  async logEntry(
    userId: string,
    areaId: string,
    enteredAt: Date,
    manager?: EntityManager,
  ): Promise<void> {
    const repo =
      manager?.getRepository(AreaEntryLog) ?? this.areaEntryLogRepository;
    await repo.save({ userId, areaId, enteredAt });
  }

  async findAll(query: QueryLogsDto) {
    const { userId, areaId, startDate, endDate, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const qb = this.areaEntryLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.area', 'area')
      .select([
        'log.id AS id',
        'log.user_id AS "userId"',
        'log.area_id AS "areaId"',
        'area.name AS "areaName"',
        'log.entered_at AS "enteredAt"',
      ]);

    if (userId) qb.andWhere('log.user_id = :userId', { userId });
    if (areaId) qb.andWhere('log.area_id = :areaId', { areaId });
    if (startDate) qb.andWhere('log.entered_at >= :startDate', { startDate });
    if (endDate) qb.andWhere('log.entered_at <= :endDate', { endDate });

    const total = await qb.getCount();
    const data = await qb
      .orderBy('log.entered_at', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany();

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
