import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { prisma } from '../server';
import { ApiError, badRequest, unauthorized, conflict } from '../middleware/error.middleware';
import { logAudit } from '../middleware/audit.middleware';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

// Token payload interface
interface TokenPayload {
  userId: string;
  email: string;
  tenantId: string;
  plantId?: string;
  roles: string[];
  permissions: string[];
}

export class AuthController {
  /**
   * Register a new user
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        tenantId: bodyTenantId,
        tenantCode,
        plantId,
        departmentId,
        phone,
      } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        throw badRequest('Missing required fields');
      }

      let tenantId = bodyTenantId as string | undefined;
      if (!tenantId && tenantCode) {
        const code = String(tenantCode).trim();
        const byCode = await prisma.tenant.findFirst({
          where: { code: { equals: code, mode: 'insensitive' } },
        });
        if (byCode) tenantId = byCode.id;
      }

      if (!tenantId) {
        throw badRequest('tenantId or tenantCode is required');
      }

      // Check if tenant exists
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant || tenant.status !== 'active') {
        throw badRequest('Invalid or inactive tenant');
      }

      // Check if email already exists in tenant
      const existingUser = await prisma.user.findFirst({
        where: { email, tenantId },
      });

      if (existingUser) {
        throw conflict('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          firstName,
          lastName,
          tenantId,
          plantId,
          departmentId,
          phone,
          status: 'active',
          createdById: 'system',
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          tenantId: true,
          plantId: true,
          status: true,
          createdAt: true,
        },
      });

      // Assign default role if specified
      const defaultRole = await prisma.role.findFirst({
        where: { tenantId, name: 'Operator' },
      });

      if (defaultRole) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: defaultRole.id,
          },
        });
      }

      // Log audit
      await logAudit({
        tenantId,
        userId: user.id,
        action: 'create',
        entityType: 'user',
        entityId: user.id,
        newValues: { email, firstName, lastName },
        ipAddress: req.ip ?? undefined,
        userAgent: req.headers['user-agent'] ?? undefined,
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Registration failed');
    }
  };

  /**
   * Login user
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, tenantCode } = req.body;

      // Validate required fields
      if (!email || !password) {
        throw badRequest('Email and password are required');
      }

      // Find tenant if code provided
      let tenantId: string | undefined;
      if (tenantCode) {
        const tenant = await prisma.tenant.findUnique({
          where: { code: tenantCode },
        });
        if (tenant) {
          tenantId = tenant.id;
        }
      }

      // Find user
      const whereClause: any = { email: email.toLowerCase() };
      if (tenantId) {
        whereClause.tenantId = tenantId;
      }

      const user = await prisma.user.findFirst({
        where: whereClause,
        include: {
          tenant: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        throw unauthorized('Invalid credentials');
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw unauthorized('Account is temporarily locked. Please try again later.');
      }

      // Check if account is active
      if (user.status !== 'active') {
        throw unauthorized('Account is not active');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        // Increment login attempts
        const loginAttempts = user.loginAttempts + 1;
        const updates: any = { loginAttempts };

        // Lock account after 5 failed attempts
        if (loginAttempts >= 5) {
          updates.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
          updates.loginAttempts = 0;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: updates,
        });

        throw unauthorized('Invalid credentials');
      }

      // Reset login attempts on successful login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
          lastLoginIp: req.ip || null,
        },
      });

      // Extract roles and permissions
      const roles = user.userRoles.map(ur => ur.role.name);
      const permissions = user.userRoles.flatMap(ur =>
        Array.isArray(ur.role.permissions)
          ? ur.role.permissions.filter((permission): permission is string => typeof permission === 'string')
          : []
      );

      // Generate tokens
      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        tenantId: user.tenantId,
        plantId: user.plantId || undefined,
        roles,
        permissions,
      };

      const accessToken = this.generateAccessToken(tokenPayload);
      const refreshToken = await this.generateRefreshToken(
        user.id,
        req.ip || null,
        req.headers['user-agent'] || null
      );

      // Log audit
      await logAudit({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'login',
        entityType: 'user',
        entityId: user.id,
        ipAddress: req.ip ?? undefined,
        userAgent: req.headers['user-agent'] ?? undefined,
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            tenant: {
              id: user.tenant.id,
              name: user.tenant.name,
              code: user.tenant.code,
            },
            plantId: user.plantId,
            roles,
            permissions,
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: JWT_EXPIRES_IN,
          },
        },
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw unauthorized('Login failed');
    }
  };

  /**
   * Refresh access token
   */
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw badRequest('Refresh token is required');
      }

      // Find refresh token in database
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: { include: { userRoles: { include: { role: true } } } } },
      });

      if (!tokenRecord) {
        throw unauthorized('Invalid refresh token');
      }

      // Check if token is expired or revoked
      if (tokenRecord.revokedAt || tokenRecord.expiresAt < new Date()) {
        throw unauthorized('Refresh token has expired');
      }

      const user = tokenRecord.user;

      // Check if user is still active
      if (user.status !== 'active') {
        throw unauthorized('User account is not active');
      }

      // Extract roles and permissions
      const roles = user.userRoles.map(ur => ur.role.name);
      const permissions = user.userRoles.flatMap(ur =>
        Array.isArray(ur.role.permissions)
          ? ur.role.permissions.filter((permission): permission is string => typeof permission === 'string')
          : []
      );

      // Generate new access token
      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        tenantId: user.tenantId,
        plantId: user.plantId || undefined,
        roles,
        permissions,
      };

      const newAccessToken = this.generateAccessToken(tokenPayload);

      // Optionally rotate refresh token
      const newRefreshToken = await this.generateRefreshToken(
        user.id,
        req.ip || null,
        req.headers['user-agent'] || null
      );

      // Revoke old refresh token
      await prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revokedAt: new Date() },
      });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: JWT_EXPIRES_IN,
        },
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw unauthorized('Token refresh failed');
    }
  };

  /**
   * Logout user
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      // Revoke refresh token if provided
      if (refreshToken) {
        await prisma.refreshToken.updateMany({
          where: { token: refreshToken },
          data: { revokedAt: new Date() },
        });
      }

      // Log audit
      if (req.user) {
        await logAudit({
          tenantId: req.user.tenantId,
          userId: req.user.id,
          action: 'logout',
          entityType: 'user',
          entityId: req.user.id,
          ipAddress: req.ip ?? undefined,
          userAgent: req.headers['user-agent'] ?? undefined,
        });
      }

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      throw badRequest('Logout failed');
    }
  };

  /**
   * Get current user
   */
  getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        throw unauthorized('Not authenticated');
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          tenant: {
            select: { id: true, name: true, code: true },
          },
          plant: {
            select: { id: true, name: true, code: true },
          },
          department: {
            select: { id: true, name: true },
          },
          userRoles: {
            include: {
              role: {
                select: { id: true, name: true, permissions: true },
              },
            },
          },
        },
      });

      if (!user) {
        throw unauthorized('User not found');
      }

      const roles = user.userRoles.map(ur => ur.role.name);
      const permissions = user.userRoles.flatMap(ur =>
        Array.isArray(ur.role.permissions)
          ? ur.role.permissions.filter((permission): permission is string => typeof permission === 'string')
          : []
      );

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: `${user.firstName} ${user.lastName}`,
          avatar: user.avatar,
          phone: user.phone,
          status: user.status,
          tenant: user.tenant,
          plant: user.plant,
          department: user.department,
          roles,
          permissions,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to get user');
    }
  };

  /**
   * Change password
   */
  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!req.user) {
        throw unauthorized('Not authenticated');
      }

      if (!currentPassword || !newPassword) {
        throw badRequest('Current password and new password are required');
      }

      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        throw unauthorized('User not found');
      }

      // Verify current password
      const isCurrentValid = await bcrypt.compare(currentPassword, user.password);

      if (!isCurrentValid) {
        throw unauthorized('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword },
      });

      // Revoke all refresh tokens
      await prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      // Log audit
      await logAudit({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'change_password',
        entityType: 'user',
        entityId: user.id,
        ipAddress: req.ip ?? undefined,
        userAgent: req.headers['user-agent'] ?? undefined,
      });

      res.json({
        success: true,
        message: 'Password changed successfully. Please login again.',
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to change password');
    }
  };

  /**
   * Forgot password
   */
  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        throw badRequest('Email is required');
      }

      // Find user
      const user = await prisma.user.findFirst({
        where: { email: email.toLowerCase() },
      });

      // Always return success to prevent email enumeration
      if (!user) {
        res.json({
          success: true,
          message: 'If an account exists with this email, you will receive password reset instructions.',
        });
        return;
      }

      // TODO: Implement password reset token generation and email sending
      // For now, just return success message

      res.json({
        success: true,
        message: 'If an account exists with this email, you will receive password reset instructions.',
      });
    } catch (error) {
      throw badRequest('Failed to process forgot password request');
    }
  };

  /**
   * Reset password
   */
  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        throw badRequest('Token and new password are required');
      }

      // TODO: Implement password reset token verification
      // For now, return error

      throw badRequest('Invalid or expired reset token');
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to reset password');
    }
  };

  /**
   * Verify email
   */
  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        throw badRequest('Verification token is required');
      }

      // TODO: Implement email verification token verification
      // For now, return error

      throw badRequest('Invalid or expired verification token');
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to verify email');
    }
  };

  /**
   * Generate access token
   */
  private generateAccessToken(payload: TokenPayload): string {
    const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] };
    return jwt.sign(payload, JWT_SECRET, options);
  }

  /**
   * Generate refresh token
   */
  private async generateRefreshToken(
    userId: string,
    ipAddress: string | null,
    userAgent: string | null
  ): Promise<string> {
    const options: SignOptions = { expiresIn: JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] };
    const token = jwt.sign({ userId }, JWT_REFRESH_SECRET, options);

    // Calculate expiration date
    const expiresInDays = parseInt(JWT_REFRESH_EXPIRES_IN) || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Store in database
    await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return token;
  }
}
