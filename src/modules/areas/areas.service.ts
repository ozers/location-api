import { Injectable } from '@nestjs/common';
import { Area } from '../../entities/area.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CreateAreaDto } from './dto/create-area.dto';
import { FindAreasDto } from './dto/find-areas.dto';

@Injectable()
export class AreasService {
  constructor(
    @InjectRepository(Area)
    private readonly areaRepository: Repository<Area>,
  ) {}

  async create(dto: CreateAreaDto): Promise<Area> {
    const result = await this.areaRepository.query(
      `INSERT INTO areas (name, boundary)
       VALUES ($1, ST_SetSRID(ST_GeomFromGeoJSON($2), 4326))
       RETURNING id, name, ST_AsGeoJSON(boundary)::json AS boundary, created_at AS "createdAt"`,
      [dto.name, JSON.stringify(dto.boundary)],
    );
    const [resultArea] = result;

    return resultArea;
  }

  async findAll(dto: FindAreasDto) {
    const limit = dto.limit ?? 20;

    const qb = this.areaRepository
      .createQueryBuilder('area')
      .select([
        'area.id AS id',
        'area.name AS name',
        'ST_AsGeoJSON(area.boundary)::json AS boundary',
        'area.created_at AS "createdAt"',
      ])
      .where('area.deleted_at IS NULL')
      .orderBy('area.created_at', 'DESC')
      .limit(limit + 1);

    if (dto.page) {
      qb.andWhere(
        'area.created_at <= (SELECT a.created_at FROM areas a WHERE a.id = :page)',
        { page: dto.page },
      );
    }

    const results: { id: string }[] = await qb.getRawMany();

    const hasNext = results.length > limit;
    const items = hasNext ? results.slice(0, limit) : results;
    const nextPage = hasNext ? items[items.length - 1].id : null;

    return { items, nextPage };
  }

  async delete(id: string): Promise<void> {
    await this.areaRepository.softDelete(id);
  }

  async findOne(id: string): Promise<Area> {
    const result = await this.areaRepository
      .createQueryBuilder('area')
      .select([
        'area.id AS id',
        'area.name AS name',
        'ST_AsGeoJSON(area.boundary)::json AS boundary',
        'area.created_at AS "createdAt"',
      ])
      .where('area.id = :id', { id })
      .andWhere('area.deleted_at IS NULL')
      .getRawOne();

    return result as Area;
  }

  async findContainingAreas(
    latitude: number,
    longitude: number,
    manager?: EntityManager,
  ): Promise<{ id: string; name: string }[]> {
    const repo = manager?.getRepository(Area) ?? this.areaRepository;
    return repo.query(
      `SELECT id, name FROM areas
       WHERE deleted_at IS NULL
         AND ST_Contains(boundary, ST_SetSRID(ST_MakePoint($1, $2), 4326))`,
      [longitude, latitude],
    );
  }

}
