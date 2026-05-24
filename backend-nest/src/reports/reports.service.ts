import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseDate(value: unknown): Date | undefined {
    if (!value) return undefined;
    const d = new Date(String(value));
    return Number.isNaN(d.getTime()) ? undefined : d;
  }

  private getRange(params: { from?: string; to?: string; weekly?: string }) {
    const weekly = String(params.weekly ?? '').toLowerCase() === 'true';

    const from = this.parseDate(params.from);
    const to = this.parseDate(params.to);

    if (weekly) {
      const end = to ?? new Date();
      const start = new Date(end);
      start.setDate(start.getDate() - 7);
      return { from: start, to: end };
    }

    return { from, to };
  }

  private buildWhereCreatedAt(range: { from?: Date; to?: Date }) {
    if (!range.from && !range.to) return undefined;
    return {
      createdAt: {
        ...(range.from ? { gte: range.from } : {}),
        ...(range.to ? { lte: range.to } : {}),
      },
    };
  }

  private toXlsxBuffer(sheetName: string, rows: Record<string, any>[]) {
    let xlsx: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      xlsx = require('xlsx');
    } catch {
      return null;
    }

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(rows);
    xlsx.utils.book_append_sheet(wb, ws, sheetName);
    const buf: Buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return buf;
  }

  async summary(params: { from?: string; to?: string; weekly?: string }) {
    const range = this.getRange(params);
    const where = this.buildWhereCreatedAt(range);

    const [
      ncrByStatus,
      capaByStatus,
      auditByStatus,
      ncrByPlant,
      capaByPlant,
      auditByPlant,
      ncrByDept,
      capaByDept,
      auditByDept,
    ] = await Promise.all([
      this.prisma.ncrReport.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      this.prisma.capaAction.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      this.prisma.audit.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      this.prisma.ncrReport.groupBy({
        by: ['plantId'],
        where,
        _count: { _all: true },
      }),
      this.prisma.capaAction.groupBy({
        by: ['plantId'],
        where,
        _count: { _all: true },
      }),
      this.prisma.audit.groupBy({
        by: ['plantId'],
        where,
        _count: { _all: true },
      }),
      this.prisma.ncrReport.groupBy({
        by: ['departmentId'],
        where,
        _count: { _all: true },
      }),
      this.prisma.capaAction.groupBy({
        by: ['departmentId'],
        where,
        _count: { _all: true },
      }),
      this.prisma.audit.groupBy({
        by: ['departmentId'],
        where,
        _count: { _all: true },
      }),
    ]);

    const sumCounts = (rows: Array<{ _count: { _all: number } }>) =>
      rows.reduce((acc, r) => acc + r._count._all, 0);

    return {
      range: {
        from: range.from ?? null,
        to: range.to ?? null,
      },
      totals: {
        ncr: sumCounts(ncrByStatus),
        capa: sumCounts(capaByStatus),
        audit: sumCounts(auditByStatus),
      },
      byStatus: {
        ncr: ncrByStatus.map((r) => ({ status: r.status, count: r._count._all })),
        capa: capaByStatus.map((r) => ({ status: r.status, count: r._count._all })),
        audit: auditByStatus.map((r) => ({ status: r.status, count: r._count._all })),
      },
      byPlant: {
        ncr: ncrByPlant.map((r) => ({ plantId: r.plantId, count: r._count._all })),
        capa: capaByPlant.map((r) => ({ plantId: r.plantId, count: r._count._all })),
        audit: auditByPlant.map((r) => ({ plantId: r.plantId, count: r._count._all })),
      },
      byDepartment: {
        ncr: ncrByDept.map((r) => ({ departmentId: r.departmentId, count: r._count._all })),
        capa: capaByDept.map((r) => ({ departmentId: r.departmentId, count: r._count._all })),
        audit: auditByDept.map((r) => ({ departmentId: r.departmentId, count: r._count._all })),
      },
    };
  }

  async summaryXlsx(params: { from?: string; to?: string; weekly?: string }) {
    const data = await this.summary(params);

    const rows: Record<string, any>[] = [];
    rows.push({ section: 'totals', metric: 'ncr', count: data.totals.ncr });
    rows.push({ section: 'totals', metric: 'capa', count: data.totals.capa });
    rows.push({ section: 'totals', metric: 'audit', count: data.totals.audit });

    for (const r of data.byStatus.ncr) rows.push({ section: 'ncr_by_status', ...r });
    for (const r of data.byStatus.capa) rows.push({ section: 'capa_by_status', ...r });
    for (const r of data.byStatus.audit) rows.push({ section: 'audit_by_status', ...r });

    for (const r of data.byPlant.ncr) rows.push({ section: 'ncr_by_plant', ...r });
    for (const r of data.byPlant.capa) rows.push({ section: 'capa_by_plant', ...r });
    for (const r of data.byPlant.audit) rows.push({ section: 'audit_by_plant', ...r });

    for (const r of data.byDepartment.ncr) rows.push({ section: 'ncr_by_department', ...r });
    for (const r of data.byDepartment.capa) rows.push({ section: 'capa_by_department', ...r });
    for (const r of data.byDepartment.audit) rows.push({ section: 'audit_by_department', ...r });

    return this.toXlsxBuffer('SUMMARY', rows);
  }

  async ncrXlsx(params: { from?: string; to?: string; weekly?: string }) {
    const range = this.getRange(params);
    const where = this.buildWhereCreatedAt(range);

    const items = await this.prisma.ncrReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 2000,
      select: {
        ncrNumber: true,
        title: true,
        status: true,
        severity: true,
        priority: true,
        createdAt: true,
        dueDate: true,
      },
    });

    const rows = items.map((x) => ({
      ncrNumber: x.ncrNumber,
      title: x.title,
      status: x.status,
      severity: x.severity,
      priority: x.priority,
      createdAt: x.createdAt,
      dueDate: x.dueDate,
    }));

    return this.toXlsxBuffer('NCR', rows);
  }

  async capaXlsx(params: { from?: string; to?: string; weekly?: string }) {
    const range = this.getRange(params);
    const where = this.buildWhereCreatedAt(range);

    const items = await this.prisma.capaAction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 2000,
      select: {
        capaNumber: true,
        title: true,
        status: true,
        type: true,
        priority: true,
        createdAt: true,
        dueDate: true,
      },
    });

    const rows = items.map((x) => ({
      capaNumber: x.capaNumber,
      title: x.title,
      status: x.status,
      type: x.type,
      priority: x.priority,
      createdAt: x.createdAt,
      dueDate: x.dueDate,
    }));

    return this.toXlsxBuffer('CAPA', rows);
  }

  async auditXlsx(params: { from?: string; to?: string; weekly?: string }) {
    const range = this.getRange(params);
    const where = this.buildWhereCreatedAt(range);

    const items = await this.prisma.audit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 2000,
      select: {
        auditNumber: true,
        title: true,
        type: true,
        status: true,
        scheduledAt: true,
        createdAt: true,
        completedAt: true,
      },
    });

    const rows = items.map((x) => ({
      auditNumber: x.auditNumber,
      title: x.title,
      type: x.type,
      status: x.status,
      scheduledAt: x.scheduledAt,
      createdAt: x.createdAt,
      completedAt: x.completedAt,
    }));

    return this.toXlsxBuffer('AUDIT', rows);
  }
}
