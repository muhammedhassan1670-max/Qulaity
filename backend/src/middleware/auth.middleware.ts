import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        userId: string;
        email: string;
        tenantId: string;
        plantId?: string;
        roles: string[];
        permissions: string[];
      };
    }
  }
}

interface TokenPayload {
  userId: string;
  email: string;
  tenantId: string;
  plantId?: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required',
        code: 'TOKEN_MISSING',
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({
        success: false,
        message: 'User account is not active',
        code: 'USER_INACTIVE',
      });
      return;
    }

    const roles = user.userRoles.map(ur => ur.role.name);
    const permissions = Array.from(
      new Set(
        user.userRoles.flatMap(ur => {
          const perms = (ur.role as any)?.permissions;
          return Array.isArray(perms) ? perms : [];
        })
      )
    );

    // Attach user to request (authoritative roles/permissions from DB)
    req.user = {
      id: decoded.userId,
      userId: decoded.userId,
      email: decoded.email,
      tenantId: user.tenantId,
      plantId: user.plantId || undefined,
      roles,
      permissions,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'TOKEN_INVALID',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Authentication error',
      code: 'AUTH_ERROR',
    });
  }
};

// Role-based access control middleware
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));

    if (!hasRole) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'FORBIDDEN',
        required: allowedRoles,
        current: req.user.roles,
      });
      return;
    }

    next();
  };
};

// Permission-based access control middleware
export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    // Global override for system admins
    const isSystemAdmin =
      req.user.roles.includes('super_admin') ||
      req.user.roles.includes('Quality Director') ||
      req.user.roles.includes('Quality Manager') ||
      req.user.permissions.includes('admin.access') ||
      req.user.permissions.includes('quality.manage');

    if (isSystemAdmin) {
      next();
      return;
    }

    const hasPermissions = requiredPermissions.every(perm =>
      req.user!.permissions.includes(perm)
    );

    if (!hasPermissions) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'FORBIDDEN',
        required: requiredPermissions,
      });
      return;
    }

    next();
  };
};
