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
import { NcrService } from './ncr.service';
import { CreateNcrDto, UpdateNcrDto, NcrQueryDto } from './dto/ncr.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ncr')
@UseGuards(JwtAuthGuard)
export class NcrController {
  constructor(private readonly ncrService: NcrService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createNcrDto: CreateNcrDto, @Request() req) {
    return this.ncrService.create(req.user.userId, createNcrDto);
  }

  @Get()
  async findAll(@Query() query: NcrQueryDto, @Request() req) {
    return this.ncrService.findAll(query, req.user.userId);
  }

  @Get('stats')
  async getStats(@Query('plantId') plantId: string, @Request() req) {
    return this.ncrService.getStats(req.user.userId, plantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.ncrService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateNcrDto: UpdateNcrDto,
    @Request() req,
  ) {
    return this.ncrService.update(id, req.user.userId, updateNcrDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Request() req) {
    return this.ncrService.remove(id, req.user.userId);
  }
}
