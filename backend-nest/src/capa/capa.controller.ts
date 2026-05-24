import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CapaService } from './capa.service';
import { CreateCapaDto, UpdateCapaDto, CapaQueryDto } from './dto/capa.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('capa')
@UseGuards(JwtAuthGuard)
export class CapaController {
  constructor(private readonly capaService: CapaService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCapaDto: CreateCapaDto, @Request() req) {
    return this.capaService.create(req.user.userId, createCapaDto);
  }

  @Get()
  async findAll(@Query() query: CapaQueryDto, @Request() req) {
    return this.capaService.findAll(query, req.user.userId);
  }

  @Get('stats')
  async getStats(@Query('plantId') plantId: string, @Request() req) {
    return this.capaService.getStats(req.user.userId, plantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.capaService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCapaDto: UpdateCapaDto,
    @Request() req,
  ) {
    return this.capaService.update(id, req.user.userId, updateCapaDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Request() req) {
    return this.capaService.remove(id, req.user.userId);
  }
}
