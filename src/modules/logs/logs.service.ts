import { Injectable } from '@nestjs/common';
import { AreaEntryLog } from '../../entities';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryLogsDto } from './dto/query-logs.dto';

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(AreaEntryLog)
    private readonly areaEntryLogRepository: Repository<AreaEntryLog>,
  ) {}

  async findAll(query: QueryLogsDto) {
    const { userId, areaId, startDate, endDate, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.areaEntryLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.area', 'area')
      .select([
        'log.id AS id',
        'log.user_id AS "userId"',
        'log.area_id AS "areaId"',
        'area.name AS "areaName"',
        'log.entered_at AS "enteredAt"',
      ]);

    if (userId) queryBuilder.andWhere('log.user_id = :userId', { userId });
    if (areaId) queryBuilder.andWhere('log.area_id = :areaId', { areaId });
    if (startDate)
      queryBuilder.andWhere('log.entered_at >= :startDate', { startDate });
    if (endDate)
      queryBuilder.andWhere('log.entered_at <= :endDate', { endDate });

    const total = await queryBuilder.getCount();
    const data = await queryBuilder
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
