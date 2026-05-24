import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FmeaService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: any, userId: string) {
    const where: any = { deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.plantId) where.plantId = query.plantId;
    if (query.departmentId) where.departmentId = query.departmentId;

    if (query.search) {
      where.OR = [
        { fmeaNumber: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.fmea.findMany({
        where,
        skip,
        take: limit,
        include: {
          plant: { select: { id: true, code: true, name: true } },
          department: { select: { id: true, code: true, name: true } },
          ownerUser: { select: { id: true, name: true, email: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.fmea.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, userId: string) {
    const fmea = await this.prisma.fmea.findFirst({
      where: { id, deletedAt: null },
      include: {
        plant: true,
        department: true,
        ownerUser: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            ownerUser: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!fmea) throw new NotFoundException(`FMEA with ID ${id} not found`);
    return fmea;
  }

  async create(userId: string, data: any) {
    const fmea = await this.prisma.fmea.create({
      data: {
        fmeaNumber: data.fmeaNumber,
        title: data.title,
        type: data.type,
        plantId: data.plantId,
        departmentId: data.departmentId,
        ownerUserId: data.ownerUserId,
        createdById: userId,
        metadata: (data.metadata ?? {}) as any,
      },
      include: {
        plant: true,
        department: true,
        ownerUser: { select: { id: true, name: true, email: true } },
      },
    });
    return fmea;
  }

  async update(id: string, userId: string, data: any) {
    await this.findOne(id, userId);
    const fmea = await this.prisma.fmea.update({
      where: { id },
      data: { ...data, updatedById: userId },
      include: {
        plant: true,
        department: true,
        ownerUser: { select: { id: true, name: true, email: true } },
      },
    });
    return fmea;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.fmea.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: userId },
    });
    return { message: 'FMEA deleted successfully', id };
  }
}
