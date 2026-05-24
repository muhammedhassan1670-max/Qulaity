import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { FmeaService } from './fmea.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('fmea')
@UseGuards(JwtAuthGuard)
export class FmeaController {
  constructor(private readonly fmeaService: FmeaService) {}

  @Post()
  create(@Body() data: any, @Request() req) {
    return this.fmeaService.create(req.user.userId, data);
  }

  @Get()
  findAll(@Query() query: any, @Request() req) {
    return this.fmeaService.findAll(query, req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.fmeaService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any, @Request() req) {
    return this.fmeaService.update(id, req.user.userId, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.fmeaService.remove(id, req.user.userId);
  }
}
