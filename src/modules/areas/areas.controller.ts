import { Body, Controller, Get, Post } from '@nestjs/common';
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';

@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Post()
  async create(@Body() dto: CreateAreaDto) {
    return this.areasService.create(dto);
  }

  @Get()
  async findAll() {
    return this.areasService.findAll();
  }
}
