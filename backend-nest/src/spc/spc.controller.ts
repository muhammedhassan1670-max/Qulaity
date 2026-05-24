import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { SpcService } from './spc.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('spc')
@UseGuards(JwtAuthGuard)
export class SpcController {
  constructor(private readonly spcService: SpcService) {}

  @Get()
  async getAll() {
    return this.spcService.getAll();
  }

  @Get('characteristics')
  async getAllCharacteristics() {
    return this.spcService.getAll();
  }

  @Post('characteristics')
  @HttpCode(HttpStatus.CREATED)
  async createCharacteristic(@Body() body: Record<string, unknown>) {
    return {
      success: true,
      data: {
        ...body,
        id: typeof body.id === 'string' ? body.id : `spc-${Date.now()}`,
        status: body.status ?? 'Active',
      },
    };
  }

  @Post('data-points')
  @HttpCode(HttpStatus.CREATED)
  async addDataPoint(@Body() body: Record<string, unknown>) {
    return {
      success: true,
      data: {
        ...body,
        id: typeof body.id === 'string' ? body.id : `spc-point-${Date.now()}`,
        sampleDate: body.sampleDate ?? new Date().toISOString(),
      },
    };
  }

  @Get('characteristics/:id')
  async getCharacteristic(@Param('id') id: string) {
    return this.spcService.getById(id);
  }

  @Get('characteristics/:id/data-points')
  async getCharacteristicDataPoints(@Param('id') id: string, @Query('limit') limit?: string) {
    void limit;
    return this.spcService.getDataPoints(id);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.spcService.getById(id);
  }

  @Get(':id/data-points')
  async getDataPoints(@Param('id') id: string) {
    return this.spcService.getDataPoints(id);
  }
}
