import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('complaints')
@UseGuards(JwtAuthGuard)
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  create(@Body() data: any, @Request() req) {
    return this.complaintsService.create(req.user.userId, data);
  }

  @Get()
  findAll(@Query() query: any, @Request() req) {
    return this.complaintsService.findAll(query, req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.complaintsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any, @Request() req) {
    return this.complaintsService.update(id, req.user.userId, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.complaintsService.remove(id, req.user.userId);
  }
}
