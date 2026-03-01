import { Controller, Get, Query } from '@nestjs/common';
import { LogsService } from './logs.service';
import { QueryLogsDto } from './dto/query-logs.dto';

@Controller('logs')
export class LogsController {
  constructor(private readonly logService: LogsService) {}

  @Get()
  findAll(@Query() query: QueryLogsDto) {
    return this.logService.findAll(query);
  }
}
