import { Controller, Get, UseGuards, Param, Query, Put } from '@nestjs/common';
import { IoTService } from './iot.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('iot/devices')
@UseGuards(JwtAuthGuard)
export class IoTController {
  constructor(private readonly iotService: IoTService) {}

  @Get()
  async getAll() {
    return this.iotService.getAll();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.iotService.getById(id);
  }

  @Get(':id/readings')
  async getReadings(@Param('id') id: string, @Query('hours') hours: string) {
    return this.iotService.getReadings(id, parseInt(hours) || 24);
  }

  @Put(':id/thresholds')
  async updateThresholds(@Param('id') id: string, @Query() thresholds: Record<string, number>) {
    return this.iotService.updateThresholds(id, thresholds);
  }
}
