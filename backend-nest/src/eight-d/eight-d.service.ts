import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EightDService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: any, userId: string) {
    const where: any = { deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.plantId) where.plantId = query.plantId;

    if (query.search) {
      where.OR = [
        { dNumber: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.eightD.findMany({
        where,
        skip,
        take: limit,
        include: {
          plant: { select: { id: true, code: true, name: true } },
          ownerUser: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.eightD.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, userId: string) {
    const eightD = await this.prisma.eightD.findFirst({
      where: { id, deletedAt: null },
      include: {
        plant: true,
        ownerUser: { select: { id: true, name: true, email: true } },
      },
    });

    if (!eightD) throw new NotFoundException(`8D with ID ${id} not found`);
    return eightD;
  }

  async create(userId: string, data: any) {
    const eightD = await this.prisma.eightD.create({
      data: {
        dNumber: data.dNumber,
        title: data.title,
        problemDescription: data.problemDescription,
        plantId: data.plantId,
        ownerUserId: data.ownerUserId,
        createdById: userId,
        metadata: (data.metadata ?? {}) as any,
      },
      include: {
        plant: { select: { id: true, code: true, name: true } },
        ownerUser: { select: { id: true, name: true, email: true } },
      },
    });
    return eightD;
  }

  async update(id: string, userId: string, data: any) {
    await this.findOne(id, userId);
    const eightD = await this.prisma.eightD.update({
      where: { id },
      data: { ...data, updatedById: userId },
      include: {
        plant: { select: { id: true, code: true, name: true } },
        ownerUser: { select: { id: true, name: true, email: true } },
      },
    });
    return eightD;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.eightD.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: userId },
    });
    return { message: '8D deleted successfully', id };
  }
}
