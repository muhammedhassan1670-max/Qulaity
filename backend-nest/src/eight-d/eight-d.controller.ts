import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { EightDService } from './eight-d.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('eight-d')
@UseGuards(JwtAuthGuard)
export class EightDController {
  constructor(private readonly eightDService: EightDService) {}

  @Post()
  create(@Body() data: any, @Request() req) {
    return this.eightDService.create(req.user.userId, data);
  }

  @Get()
  findAll(@Query() query: any, @Request() req) {
    return this.eightDService.findAll(query, req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.eightDService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any, @Request() req) {
    return this.eightDService.update(id, req.user.userId, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.eightDService.remove(id, req.user.userId);
  }
}
