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
import { AuditService } from './audit.service';
import { AuditQueryDto, CreateAuditDto, UpdateAuditDto } from './dto/audit.dto';

@Controller('audits')
@UseGuards(JwtAuthGuard)
export class AuditsAliasController {
  constructor(private readonly auditService: AuditService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAuditDto: CreateAuditDto, @Request() req) {
    return this.auditService.create(req.user.userId, createAuditDto);
  }

  @Get()
  async findAll(@Query() query: AuditQueryDto, @Request() req) {
    return this.auditService.findAll(query, req.user.userId);
  }

  @Get('stats')
  async getStats(@Query('plantId') plantId: string, @Request() req) {
    return this.auditService.getStats(req.user.userId, plantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.auditService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAuditDto: UpdateAuditDto,
    @Request() req,
  ) {
    return this.auditService.update(id, req.user.userId, updateAuditDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Request() req) {
    return this.auditService.remove(id, req.user.userId);
  }
}
