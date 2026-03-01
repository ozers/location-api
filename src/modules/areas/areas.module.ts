import { Module } from '@nestjs/common';
import { Area } from '../../entities/area.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreasController } from './areas.controller';
import { AreasService } from './areas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Area])],
  providers: [AreasService],
  controllers: [AreasController],
  exports: [AreasService],
})
export class AreasModule {}
