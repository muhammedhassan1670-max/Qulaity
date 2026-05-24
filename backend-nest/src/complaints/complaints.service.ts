import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComplaintsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: any, userId: string) {
    const where: any = { deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.plantId) where.plantId = query.plantId;
    if (query.complaintType) where.complaintType = query.complaintType;

    if (query.search) {
      where.OR = [
        { complaintNumber: { contains: query.search, mode: 'insensitive' } },
        { customerName: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        skip,
        take: limit,
        include: {
          plant: { select: { id: true, code: true, name: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          relatedCapa: { select: { id: true, capaNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.complaint.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, userId: string) {
    const complaint = await this.prisma.complaint.findFirst({
      where: { id, deletedAt: null },
      include: {
        plant: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        relatedNcr: true,
        relatedCapa: true,
      },
    });

    if (!complaint) throw new NotFoundException(`Complaint with ID ${id} not found`);
    return complaint;
  }

  async create(userId: string, data: any) {
    const complaint = await this.prisma.complaint.create({
      data: {
        complaintNumber: data.complaintNumber,
        title: data.title,
        description: data.description,
        status: data.status || 'open',
        priority: data.priority,
        customerName: data.customerName,
        customerContact: data.customerContact,
        plantId: data.plantId,
        departmentId: data.departmentId,
        assignedToId: data.assignedToId || null,
        relatedNcrId: data.relatedNcrId || null,
        relatedCapaId: data.relatedCapaId || null,
        receivedAt: data.receivedAt ? new Date(data.receivedAt) : new Date(),
        closedAt: data.closedAt ? new Date(data.closedAt) : null,
        createdById: userId,
        metadata: (data.metadata ?? {}) as any,
      },
      include: {
        plant: { select: { id: true, code: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });
    return complaint;
  }

  async update(id: string, userId: string, data: any) {
    await this.findOne(id, userId);
    const complaint = await this.prisma.complaint.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId,
        receivedAt: data.receivedAt ? new Date(data.receivedAt) : undefined,
        closedAt: data.closedAt ? new Date(data.closedAt) : undefined,
      },
      include: {
        plant: { select: { id: true, code: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });
    return complaint;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.complaint.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: userId },
    });
    return { message: 'Complaint deleted successfully', id };
  }
}
