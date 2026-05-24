import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuditDto, UpdateAuditDto, AuditQueryDto } from './dto/audit.dto';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createAuditDto: CreateAuditDto) {
    const audit = await this.prisma.audit.create({
      data: {
        auditNumber: createAuditDto.auditNumber,
        title: createAuditDto.title,
        scope: createAuditDto.scope,
        type: createAuditDto.type,
        status: createAuditDto.status || 'scheduled',
        plantId: createAuditDto.plantId,
        departmentId: createAuditDto.departmentId,
        supplierId: createAuditDto.supplierId,
        scheduledAt: createAuditDto.scheduledAt ? new Date(createAuditDto.scheduledAt) : undefined,
        leadAuditorUserId: createAuditDto.leadAuditorUserId,
        createdById: userId,
        metadata: (createAuditDto.metadata ?? {}) as any,
      },
      include: {
        plant: true,
        department: true,
        supplier: true,
        leadAuditor: { select: { id: true, name: true, email: true } },
      },
    });

    await this.logActivity(userId, 'create', audit.id, audit.plantId ?? undefined, audit.departmentId ?? undefined);
    return audit;
  }

  async findAll(query: AuditQueryDto, userId: string) {
    const where: any = { deletedAt: null };

    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.plantId) where.plantId = query.plantId;
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.leadAuditorUserId) where.leadAuditorUserId = query.leadAuditorUserId;

    if (query.search) {
      where.OR = [
        { auditNumber: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
        { scope: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.from || query.to) {
      where.scheduledAt = {};
      if (query.from) where.scheduledAt.gte = new Date(query.from);
      if (query.to) where.scheduledAt.lte = new Date(query.to);
    }

    const orderBy: any = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.order || 'desc';
    } else {
      orderBy.scheduledAt = 'desc';
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.audit.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          plant: { select: { id: true, code: true, name: true } },
          department: { select: { id: true, code: true, name: true } },
          supplier: { select: { id: true, code: true, name: true } },
          leadAuditor: { select: { id: true, name: true, email: true } },
          _count: { select: { findings: true } },
        },
      }),
      this.prisma.audit.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, userId: string) {
    const audit = await this.prisma.audit.findFirst({
      where: { id, deletedAt: null },
      include: {
        plant: true,
        department: true,
        supplier: true,
        leadAuditor: { select: { id: true, name: true, email: true } },
        findings: {
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
            capaActions: {
              select: { id: true, capaNumber: true, title: true, status: true },
            },
          },
        },
      },
    });

    if (!audit) {
      throw new NotFoundException(`Audit with ID ${id} not found`);
    }

    return audit;
  }

  async update(id: string, userId: string, updateAuditDto: UpdateAuditDto) {
    const existing = await this.findOne(id, userId);

    const data: any = { ...updateAuditDto, updatedById: userId };

    if (updateAuditDto.scheduledAt) data.scheduledAt = new Date(updateAuditDto.scheduledAt);
    if (updateAuditDto.startedAt) data.startedAt = new Date(updateAuditDto.startedAt);
    if (updateAuditDto.completedAt) data.completedAt = new Date(updateAuditDto.completedAt);
    if (updateAuditDto.score) data.score = Number(updateAuditDto.score);

    const audit = await this.prisma.audit.update({
      where: { id },
      data,
      include: {
        plant: true,
        department: true,
        supplier: true,
        leadAuditor: { select: { id: true, name: true, email: true } },
      },
    });

    await this.logActivity(userId, 'update', audit.id, audit.plantId ?? undefined, audit.departmentId ?? undefined, updateAuditDto);
    return audit;
  }

  async remove(id: string, userId: string) {
    const existing = await this.findOne(id, userId);

    const audit = await this.prisma.audit.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: userId },
      include: {
        plant: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });

    await this.logActivity(userId, 'delete', audit.id, audit.plantId ?? undefined, audit.departmentId ?? undefined);
    return { message: 'Audit deleted successfully', id };
  }

  async getStats(userId: string, plantId?: string) {
    const where: any = { deletedAt: null };
    if (plantId) where.plantId = plantId;

    const [total, byStatus, byType, upcoming, overdue] = await Promise.all([
      this.prisma.audit.count({ where }),
      this.prisma.audit.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      this.prisma.audit.groupBy({
        by: ['type'],
        where,
        _count: { type: true },
      }),
      this.prisma.audit.count({
        where: {
          ...where,
          scheduledAt: { gte: new Date(), lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.audit.count({
        where: {
          ...where,
          scheduledAt: { lt: new Date() },
          status: { not: 'completed' },
        },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count.status }), {}),
      byType: byType.reduce((acc, item) => ({ ...acc, [item.type]: item._count.type }), {}),
      upcoming,
      overdue,
    };
  }

  private async logActivity(
    userId: string,
    action: string,
    entityId: string,
    plantId?: string,
    departmentId?: string,
    changes?: any,
  ) {
    await this.prisma.activityLog.create({
      data: {
        actorUserId: userId,
        action,
        entityType: 'audit',
        entityId,
        plantId,
        departmentId,
        changes: changes || {},
      },
    });
  }
}
