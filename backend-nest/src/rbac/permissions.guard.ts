import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: any }>();

    const user = req.user;
    if (!user) throw new UnauthorizedException();

    const roleId = user.roleId;
    if (!roleId) throw new ForbiddenException('User has no role');

    const cached = (req as any).__permissions as string[] | undefined;
    let permissions: string[];
    if (cached) {
      permissions = cached;
    } else {
      const rows = await this.prisma.rolePermission.findMany({
        where: { roleId },
        select: { permission: { select: { code: true } } },
      });
      permissions = rows.map((r) => r.permission.code);
    }

    (req as any).__permissions = permissions;

    const ok = required.every((p) => permissions.includes(p));
    if (!ok) {
      throw new ForbiddenException('Missing required permissions');
    }

    return true;
  }
}
