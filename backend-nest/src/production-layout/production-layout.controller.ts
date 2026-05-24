import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateProductionLayoutDto,
  ProductionLayoutQueryDto,
  UpdateProductionLayoutDto,
} from './dto/production-layout.dto';
import { ProductionLayoutService } from './production-layout.service';

@Controller('production-layout')
@UseGuards(JwtAuthGuard)
export class ProductionLayoutController {
  constructor(private readonly service: ProductionLayoutService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateProductionLayoutDto, @Request() req) {
    return this.service.create(req.user.userId, dto);
  }

  @Get()
  async findAll(@Query() query: ProductionLayoutQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductionLayoutDto, @Request() req) {
    return this.service.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Request() req) {
    return this.service.remove(id, req.user.userId);
  }
}
