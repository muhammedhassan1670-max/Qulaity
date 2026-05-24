import {
  Controller,
  Get,
  InternalServerErrorException,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  async summary(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('weekly') weekly: string | undefined,
    @Query('format') format: string | undefined,
    @Res() res: Response,
  ) {
    if (String(format ?? '').toLowerCase() === 'xlsx') {
      const buf = await this.reportsService.summaryXlsx({ from, to, weekly });
      if (!buf) {
        throw new InternalServerErrorException(
          'xlsx dependency is missing. Install it with: npm install xlsx',
        );
      }

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', 'attachment; filename="summary-report.xlsx"');
      res.send(buf);
      return;
    }

    const data = await this.reportsService.summary({ from, to, weekly });
    res.json(data);
  }

  @Get('ncr')
  async ncr(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('weekly') weekly: string | undefined,
    @Res() res: Response,
  ) {
    const buf = await this.reportsService.ncrXlsx({ from, to, weekly });
    if (!buf) {
      throw new InternalServerErrorException(
        'xlsx dependency is missing. Install it with: npm install xlsx',
      );
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="ncr-report.xlsx"');
    res.send(buf);
  }

  @Get('capa')
  async capa(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('weekly') weekly: string | undefined,
    @Res() res: Response,
  ) {
    const buf = await this.reportsService.capaXlsx({ from, to, weekly });
    if (!buf) {
      throw new InternalServerErrorException(
        'xlsx dependency is missing. Install it with: npm install xlsx',
      );
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="capa-report.xlsx"');
    res.send(buf);
  }

  @Get('audit')
  async audit(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('weekly') weekly: string | undefined,
    @Res() res: Response,
  ) {
    const buf = await this.reportsService.auditXlsx({ from, to, weekly });
    if (!buf) {
      throw new InternalServerErrorException(
        'xlsx dependency is missing. Install it with: npm install xlsx',
      );
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="audit-report.xlsx"');
    res.send(buf);
  }
}
