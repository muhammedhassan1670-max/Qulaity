import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('suppliers')
@UseGuards(JwtAuthGuard)
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  create(@Body() data: any, @Request() req) {
    return this.supplierService.create(req.user.userId, data);
  }

  @Get()
  findAll(@Query() query: any, @Request() req) {
    return this.supplierService.findAll(query, req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.supplierService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any, @Request() req) {
    return this.supplierService.update(id, req.user.userId, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.supplierService.remove(id, req.user.userId);
  }
}
