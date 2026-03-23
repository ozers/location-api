import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { FindAreasDto } from './dto/find-areas.dto';

@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateAreaDto) {
    return this.areasService.create(dto);
  }

  @Get()
  async findAll(@Query() dto: FindAreasDto) {
    return this.areasService.findAll(dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.areasService.delete(id);
  }
}
