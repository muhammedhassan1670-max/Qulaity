import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProductionLayoutDto,
  ProductionLayoutQueryDto,
  UpdateProductionLayoutDto,
} from './dto/production-layout.dto';

@Injectable()
export class ProductionLayoutService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateProductionLayoutDto) {
    return this.prisma.productionLayout.create({
      data: {
        name: dto.name,
        plantId: dto.plantId,
        isPublished: dto.isPublished ?? false,
        version: dto.version,
        layout: (dto.layout ?? {}) as any,
        metadata: (dto.metadata ?? {}) as any,
        createdById: userId,
      },
    });
  }

  async findAll(query: ProductionLayoutQueryDto) {
    const where: any = { deletedAt: null };

    if (query.plantId) where.plantId = query.plantId;
    if (query.isPublished !== undefined) where.isPublished = query.isPublished;

    if (query.search) {
      where.OR = [{ name: { contains: query.search, mode: 'insensitive' } }];
    }

    const orderBy: any = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.order || 'desc';
    } else {
      orderBy.updatedAt = 'desc';
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.productionLayout.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.productionLayout.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const item = await this.prisma.productionLayout.findFirst({
      where: { id, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Production layout not found');
    return item;
  }

  async update(id: string, userId: string, dto: UpdateProductionLayoutDto) {
    await this.findOne(id);

    return this.prisma.productionLayout.update({
      where: { id },
      data: {
        name: dto.name,
        plantId: dto.plantId,
        isPublished: dto.isPublished,
        version: dto.version,
        layout: dto.layout ? ((dto.layout ?? {}) as any) : undefined,
        metadata: dto.metadata ? ((dto.metadata ?? {}) as any) : undefined,
        updatedById: userId,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id);

    return this.prisma.productionLayout.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedById: userId,
      },
    });
  }
}
