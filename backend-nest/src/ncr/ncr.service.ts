import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNcrDto, UpdateNcrDto, NcrQueryDto } from './dto/ncr.dto';
import { RecordStatus } from '../generated/enums';
import { NotificationsGateway } from '../websocket/notifications.gateway';

@Injectable()
export class NcrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsGateway,
  ) {}

  async create(userId: string, createNcrDto: CreateNcrDto) {
    const ncr = await this.prisma.ncrReport.create({
      data: {
        ncrNumber: createNcrDto.ncrNumber,
        title: createNcrDto.title,
        description: createNcrDto.description,
        category: createNcrDto.category,
        severity: createNcrDto.severity,
        priority: createNcrDto.priority,
        plantId: createNcrDto.plantId,
        departmentId: createNcrDto.departmentId,
        supplierId: createNcrDto.supplierId,
        reportedById: createNcrDto.reportedById,
        assignedToId: createNcrDto.assignedToId,
        createdById: userId,
        detectedAt: createNcrDto.detectedAt ? new Date(createNcrDto.detectedAt) : new Date(),
        dueDate: createNcrDto.dueDate ? new Date(createNcrDto.dueDate) : undefined,
        rootCause: createNcrDto.rootCause,
        containmentAction: createNcrDto.containmentAction,
        correctiveActionSummary: createNcrDto.correctiveActionSummary,
        costImpact: createNcrDto.costImpact ? Number(createNcrDto.costImpact) : undefined,
        currency: createNcrDto.currency,
        metadata: (createNcrDto.metadata ?? {}) as any,
      },
      include: {
        plant: true,
        department: true,
        supplier: true,
        reportedBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    await this.logActivity(userId, 'create', ncr.id, ncr.plantId, ncr.departmentId ?? undefined);

    // 🔔 Broadcast real-time alert for critical/major NCRs
    const severity = ncr.severity as string;
    if (severity === 'critical' || severity === 'major') {
      this.notifications.broadcastAlert({
        id: ncr.id,
        severity: severity === 'critical' ? 'critical' : 'warning',
        title: `New NCR: ${ncr.ncrNumber}`,
        message: `${ncr.title} — Plant: ${ncr.plant?.name ?? ncr.plantId}`,
        source: 'NCR System',
      });
    }

    return ncr;
  }

  async findAll(query: NcrQueryDto, userId: string) {
    const where: any = { deletedAt: null };

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.plantId) where.plantId = query.plantId;
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.assignedToId) where.assignedToId = query.assignedToId;

    if (query.search) {
      where.OR = [
        { ncrNumber: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const orderBy: any = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.order || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.ncrReport.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          plant: { select: { id: true, code: true, name: true } },
          department: { select: { id: true, code: true, name: true } },
          supplier: { select: { id: true, code: true, name: true } },
          reportedBy: { select: { id: true, name: true, email: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.ncrReport.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, userId: string) {
    const ncr = await this.prisma.ncrReport.findFirst({
      where: { id, deletedAt: null },
      include: {
        plant: true,
        department: true,
        supplier: true,
        reportedBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        capaActions: {
          select: { id: true, capaNumber: true, title: true, status: true },
        },
        complaints: {
          select: { id: true, complaintNumber: true, title: true, status: true },
        },
      },
    });

    if (!ncr) {
      throw new NotFoundException(`NCR with ID ${id} not found`);
    }

    return ncr;
  }

  async update(id: string, userId: string, updateNcrDto: UpdateNcrDto) {
    const existing = await this.findOne(id, userId);

    const data: any = { ...updateNcrDto, updatedById: userId };

    if (updateNcrDto.detectedAt) data.detectedAt = new Date(updateNcrDto.detectedAt);
    if (updateNcrDto.dueDate) data.dueDate = new Date(updateNcrDto.dueDate);
    if (updateNcrDto.closedAt) data.closedAt = new Date(updateNcrDto.closedAt);
    if (updateNcrDto.costImpact) data.costImpact = Number(updateNcrDto.costImpact);

    const ncr = await this.prisma.ncrReport.update({
      where: { id },
      data,
      include: {
        plant: true,
        department: true,
        supplier: true,
        reportedBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    await this.logActivity(userId, 'update', ncr.id, ncr.plantId, ncr.departmentId ?? undefined, updateNcrDto);
    return ncr;
  }

  async remove(id: string, userId: string) {
    const existing = await this.findOne(id, userId);

    const ncr = await this.prisma.ncrReport.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: userId },
      include: {
        plant: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });

    await this.logActivity(userId, 'delete', ncr.id, ncr.plantId, ncr.departmentId ?? undefined);
    return { message: 'NCR deleted successfully', id };
  }

  async getStats(userId: string, plantId?: string) {
    const where: any = { deletedAt: null };
    if (plantId) where.plantId = plantId;

    const [total, byStatus, byPriority, overdue] = await Promise.all([
      this.prisma.ncrReport.count({ where }),
      this.prisma.ncrReport.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      this.prisma.ncrReport.groupBy({
        by: ['priority'],
        where,
        _count: { priority: true },
      }),
      this.prisma.ncrReport.count({
        where: {
          ...where,
          dueDate: { lt: new Date() },
          status: { not: RecordStatus.closed },
        },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count.status }), {}),
      byPriority: byPriority.reduce((acc, item) => ({ ...acc, [item.priority]: item._count.priority }), {}),
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
        entityType: 'ncr',
        entityId,
        plantId,
        departmentId,
        changes: changes || {},
      },
    });
  }
}
