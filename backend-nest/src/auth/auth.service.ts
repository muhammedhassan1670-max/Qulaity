import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async refresh(refreshToken: string) {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!payload?.sub || payload?.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        status: true,
        roleId: true,
        plantId: true,
      },
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User not found');
    }

    const nextPayload = {
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
      plantId: user.plantId,
    };

    const accessToken = await this.jwtService.signAsync(nextPayload, { expiresIn: '15m' });
    const nextRefreshToken = await this.jwtService.signAsync(
      { sub: user.id, type: 'refresh' },
      { expiresIn: '7d' },
    );

    return {
      success: true,
      data: {
        accessToken,
        refreshToken: nextRefreshToken,
        expiresIn: '15m',
      },
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        status: true,
        passwordHash: true,
        roleId: true,
        plantId: true,
      },
    });

    if (!user) return null;
    if (user.status !== 'active') return null;

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async login(email: string, password: string) {
    const userWithRole = await this.validateUser(email, password);
    if (!userWithRole) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get user with role and permissions for proper response format
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        status: true,
        roleId: true,
        plantId: true,
        role: {
          select: {
            id: true,
            name: true,
            rolePermissions: {
              select: {
                permission: {
                  select: { code: true },
                },
              },
            },
          },
        },
        plant: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
      plantId: user.plantId,
    };

    const accessToken = await this.jwtService.signAsync(payload, { expiresIn: '15m' });
    const refreshToken = await this.jwtService.signAsync({ sub: user.id, type: 'refresh' }, { expiresIn: '7d' });

    // Format user for frontend expectations
    const permissions = user.role?.rolePermissions.map(rp => rp.permission.code) || [];
    const roles = user.role ? [user.role.name] : [];

    const formattedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      roleId: user.roleId,
      plantId: user.plantId,
      plant: user.plant,
      roles,
      permissions,
      tenant: { id: 'default', name: 'Default Tenant', code: 'DEFAULT' },
    };

    return {
      success: true,
      data: {
        user: formattedUser,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: '15m',
        },
      },
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        status: true,
        roleId: true,
        plantId: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
            rolePermissions: {
              select: {
                permission: {
                  select: { code: true },
                },
              },
            },
          },
        },
        plant: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Format user for frontend expectations
    const permissions = user.role?.rolePermissions.map(rp => rp.permission.code) || [];
    const roles = user.role ? [user.role.name] : [];

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        status: user.status,
        roleId: user.roleId,
        plantId: user.plantId,
        plant: user.plant,
        roles,
        permissions,
        tenant: { id: 'default', name: 'Default Tenant', code: 'DEFAULT' },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
