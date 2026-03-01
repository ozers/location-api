import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create.location.dto';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @HttpCode(202)
  async create(@Body() dto: CreateLocationDto) {
    await this.locationsService.addToQueue(dto);

    return {
      status: 'queued',
      message: 'Location processing has been queued successfully.',
    };
  }
}
