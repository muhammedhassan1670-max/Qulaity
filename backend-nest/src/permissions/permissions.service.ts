import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.permission.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        module: true,
        description: true,
      },
      orderBy: { code: 'asc' },
    });
  }
}
