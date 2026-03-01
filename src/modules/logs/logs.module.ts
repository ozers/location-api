import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreaEntryLog } from '../../entities';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';

@Module({
  imports: [TypeOrmModule.forFeature([AreaEntryLog])],
  controllers: [LogsController],
  providers: [LogsService],
})
export class LogsModule {}
