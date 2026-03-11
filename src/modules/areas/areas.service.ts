import { Injectable } from '@nestjs/common';
import { Area } from '../../entities/area.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAreaDto } from './dto/create-area.dto';

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
       RETURNING id`,
      [dto.name, JSON.stringify(dto.boundary)],
    );

    const [inserted]: [{ id: string }] = result;
    return this.findOne(inserted.id);
  }

  async findAll(): Promise<any[]> {
    return this.areaRepository
      .createQueryBuilder('area')
      .select([
        'area.id AS id',
        'area.name AS name',
        'ST_AsGeoJSON(area.boundary)::json AS boundary',
        'area.created_at AS "createdAt"',
      ])
      .where('area.deleted_at IS NULL')
      .getRawMany();
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
}
