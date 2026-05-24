import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupplierService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: any, userId: string) {
    const where: any = {};
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: { select: { ncrReports: true, audits: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, userId: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        ncrReports: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        audits: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!supplier) throw new NotFoundException(`Supplier with ID ${id} not found`);
    return supplier;
  }

  async create(userId: string, data: any) {
    const supplier = await this.prisma.supplier.create({
      data: {
        name: data.name,
        code: data.code,
        email: data.email,
        phone: data.phone,
        address: data.address,
        rating: data.rating ? Number(data.rating) : null,
        isActive: data.isActive ?? true,
        metadata: (data.metadata ?? {}) as any,
      },
    });
    return supplier;
  }

  async update(id: string, userId: string, data: any) {
    await this.findOne(id, userId);
    const supplier = await this.prisma.supplier.update({
      where: { id },
      data: {
        ...data,
        rating: data.rating ? Number(data.rating) : undefined,
      },
    });
    return supplier;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    // Since Supplier doesn't have deletedAt, we do a hard delete
    await this.prisma.supplier.delete({
      where: { id },
    });
    return { message: 'Supplier deleted successfully', id };
  }
}
