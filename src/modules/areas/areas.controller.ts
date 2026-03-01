import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
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

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.areasService.delete(id);
  }
}
