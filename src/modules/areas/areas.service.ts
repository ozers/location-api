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
    const result = await this.areaRepository
      .createQueryBuilder()
      .insert()
      .into(Area)
      .values({
        name: dto.name,
        boundary: () =>
          `ST_SetSRID(ST_GeomFromGeoJSON('${JSON.stringify(dto.boundary)}'), 4326)`,
      })
      .returning('*')
      .execute();

    return this.findOne(result.identifiers[0].id as string);
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
      .getRawMany();
  }

  async delete(id: string): Promise<void> {
    await this.areaRepository.delete(id);
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
      .where('area.id =:id', { id })
      .getRawOne();

    return result as Area;
  }
}
