import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCapaDto, UpdateCapaDto, CapaQueryDto } from './dto/capa.dto';
import { RecordStatus } from '../generated/enums';

@Injectable()
export class CapaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createCapaDto: CreateCapaDto) {
    const capa = await this.prisma.capaAction.create({
      data: {
        capaNumber: createCapaDto.capaNumber,
        title: createCapaDto.title,
        description: createCapaDto.description,
        type: createCapaDto.type,
        priority: createCapaDto.priority,
        sourceType: createCapaDto.sourceType,
        sourceNcrId: createCapaDto.sourceNcrId,
        sourceAuditFindingId: createCapaDto.sourceAuditFindingId,
        ownerUserId: createCapaDto.ownerUserId,
        assignedToId: createCapaDto.assignedToId,
        plantId: createCapaDto.plantId,
        departmentId: createCapaDto.departmentId,
        dueDate: createCapaDto.dueDate ? new Date(createCapaDto.dueDate) : undefined,
        createdById: userId,
        metadata: (createCapaDto.metadata ?? {}) as any,
      },
      include: {
        plant: true,
        department: true,
        sourceNcr: { select: { id: true, ncrNumber: true, title: true } },
        ownerUser: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    await this.logActivity(userId, 'create', capa.id, capa.plantId, capa.departmentId ?? undefined);
    return capa;
  }

  async findAll(query: CapaQueryDto, userId: string) {
    const where: any = { deletedAt: null };

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.type) where.type = query.type;
    if (query.plantId) where.plantId = query.plantId;
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.assignedToId) where.assignedToId = query.assignedToId;
    if (query.sourceNcrId) where.sourceNcrId = query.sourceNcrId;

    if (query.search) {
      where.OR = [
        { capaNumber: { contains: query.search, mode: 'insensitive' } },
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
      this.prisma.capaAction.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          plant: { select: { id: true, code: true, name: true } },
          department: { select: { id: true, code: true, name: true } },
          sourceNcr: { select: { id: true, ncrNumber: true, title: true } },
          ownerUser: { select: { id: true, name: true, email: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.capaAction.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, userId: string) {
    const capa = await this.prisma.capaAction.findFirst({
      where: { id, deletedAt: null },
      include: {
        plant: true,
        department: true,
        sourceNcr: { select: { id: true, ncrNumber: true, title: true, status: true } },
        sourceAuditFinding: { select: { id: true, findingNumber: true, title: true, status: true } },
        ownerUser: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    if (!capa) {
      throw new NotFoundException(`CAPA with ID ${id} not found`);
    }

    return capa;
  }

  async update(id: string, userId: string, updateCapaDto: UpdateCapaDto) {
    const existing = await this.findOne(id, userId);

    const data: any = { ...updateCapaDto, updatedById: userId };

    if (updateCapaDto.dueDate) data.dueDate = new Date(updateCapaDto.dueDate);
    if (updateCapaDto.closedAt) data.closedAt = new Date(updateCapaDto.closedAt);

    const capa = await this.prisma.capaAction.update({
      where: { id },
      data,
      include: {
        plant: true,
        department: true,
        sourceNcr: { select: { id: true, ncrNumber: true, title: true } },
        ownerUser: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    await this.logActivity(userId, 'update', capa.id, capa.plantId, capa.departmentId ?? undefined, updateCapaDto);
    return capa;
  }

  async remove(id: string, userId: string) {
    const existing = await this.findOne(id, userId);

    const capa = await this.prisma.capaAction.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: userId },
      include: {
        plant: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });

    await this.logActivity(userId, 'delete', capa.id, capa.plantId, capa.departmentId ?? undefined);
    return { message: 'CAPA deleted successfully', id };
  }

  async getStats(userId: string, plantId?: string) {
    const where: any = { deletedAt: null };
    if (plantId) where.plantId = plantId;

    const [total, byStatus, byPriority, byType, overdue] = await Promise.all([
      this.prisma.capaAction.count({ where }),
      this.prisma.capaAction.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      this.prisma.capaAction.groupBy({
        by: ['priority'],
        where,
        _count: { priority: true },
      }),
      this.prisma.capaAction.groupBy({
        by: ['type'],
        where,
        _count: { type: true },
      }),
      this.prisma.capaAction.count({
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
      byType: byType.reduce((acc, item) => ({ ...acc, [item.type]: item._count.type }), {}),
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
        entityType: 'capa',
        entityId,
        plantId,
        departmentId,
        changes: changes || {},
      },
    });
  }
}
