import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../server';
import { ApiError, badRequest, notFound, conflict } from '../middleware/error.middleware';
import { getTenantId } from '../middleware/tenant.middleware';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

export class UserController {
  /**
   * Get all users
   */
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const { page = '1', limit = '20', search, status, plantId } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {
        tenantId,
        deletedAt: null,
      };

      if (status) {
        where.status = status;
      }

      if (plantId) {
        where.plantId = plantId as string;
      }

      if (search) {
        where.OR = [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            phone: true,
            status: true,
            lastLoginAt: true,
            plant: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
            userRoles: {
              include: {
                role: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        success: true,
        data: users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch users');
    }
  };

  /**
   * Get current user
   */
  getMe = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        throw badRequest('Not authenticated');
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          phone: true,
          status: true,
          tenant: { select: { id: true, name: true, code: true } },
          plant: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          userRoles: {
            include: {
              role: { select: { id: true, name: true, permissions: true } },
            },
          },
        },
      });

      if (!user) {
        throw notFound('User');
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch user');
    }
  };

  /**
   * Get user by ID
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);

      const user = await prisma.user.findFirst({
        where: { id, tenantId, deletedAt: null },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          phone: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          plant: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          userRoles: {
            include: {
              role: { select: { id: true, name: true, permissions: true } },
            },
          },
        },
      });

      if (!user) {
        throw notFound('User');
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch user');
    }
  };

  /**
   * Create user
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const {
        email,
        password,
        firstName,
        lastName,
        plantId,
        departmentId,
        phone,
        roleIds,
      } = req.body;

      if (!email || !password || !firstName || !lastName) {
        throw badRequest('Missing required fields');
      }

      // Check if email exists
      const existingUser = await prisma.user.findFirst({
        where: { email: email.toLowerCase(), tenantId },
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
          createdById: req.user?.id || 'system',
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          phone: true,
          status: true,
          plant: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
      });

      // Assign roles
      if (roleIds && roleIds.length > 0) {
        await prisma.userRole.createMany({
          data: roleIds.map((roleId: string) => ({
            userId: user.id,
            roleId,
          })),
        });
      }

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to create user');
    }
  };

  /**
   * Update user
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);
      const {
        firstName,
        lastName,
        plantId,
        departmentId,
        phone,
        avatar,
        roleIds,
      } = req.body;

      const user = await prisma.user.findFirst({
        where: { id, tenantId, deletedAt: null },
      });

      if (!user) {
        throw notFound('User');
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          firstName,
          lastName,
          plantId,
          departmentId,
          phone,
          avatar,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          phone: true,
          status: true,
          plant: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
      });

      // Update roles if provided
      if (roleIds) {
        // Remove existing roles
        await prisma.userRole.deleteMany({
          where: { userId: id },
        });

        // Add new roles
        if (roleIds.length > 0) {
          await prisma.userRole.createMany({
            data: roleIds.map((roleId: string) => ({
              userId: id,
              roleId,
            })),
          });
        }
      }

      res.json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to update user');
    }
  };

  /**
   * Update user status
   */
  updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);
      const { status } = req.body;

      const user = await prisma.user.findFirst({
        where: { id, tenantId, deletedAt: null },
      });

      if (!user) {
        throw notFound('User');
      }

      await prisma.user.update({
        where: { id },
        data: { status, updatedAt: new Date() },
      });

      res.json({
        success: true,
        message: `User status updated to ${status}`,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to update user status');
    }
  };

  /**
   * Delete user (soft delete)
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);

      const user = await prisma.user.findFirst({
        where: { id, tenantId, deletedAt: null },
      });

      if (!user) {
        throw notFound('User');
      }

      await prisma.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: 'inactive',
          updatedAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to delete user');
    }
  };
}
