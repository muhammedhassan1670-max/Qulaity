import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server';

/**
 * Tenant Middleware
 * Ensures multi-tenant data isolation by validating tenant access
 */
export const tenantMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    // Get tenant ID from header or use user's tenant
    const headerTenantId = req.headers['x-tenant-id'] as string;
    const userTenantId = req.user.tenantId;

    // If header tenant is provided, verify user has access to it
    if (headerTenantId && headerTenantId !== userTenantId) {
      // Check if user has cross-tenant access (for super admins)
      const hasCrossTenantAccess = req.user.roles.includes('super_admin');

      if (!hasCrossTenantAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied for this tenant',
          code: 'TENANT_ACCESS_DENIED',
        });
        return;
      }

      // Verify tenant exists
      const tenant = await prisma.tenant.findUnique({
        where: { id: headerTenantId },
      });

      if (!tenant || tenant.status !== 'active') {
        res.status(404).json({
          success: false,
          message: 'Tenant not found or inactive',
          code: 'TENANT_NOT_FOUND',
        });
        return;
      }

      // Override tenant ID for this request
      (req as any).effectiveTenantId = headerTenantId;
    } else {
      (req as any).effectiveTenantId = userTenantId;
    }

    // Backward-compatible aliases used by existing route handlers
    (req as any).tenantId = (req as any).effectiveTenantId;

    // Get plant ID from header (optional)
    const plantId = req.headers['x-plant-id'] as string;
    if (plantId) {
      // Verify plant belongs to tenant
      const plant = await prisma.plant.findFirst({
        where: {
          id: plantId,
          tenantId: (req as any).effectiveTenantId,
        },
      });

      if (!plant) {
        res.status(404).json({
          success: false,
          message: 'Plant not found',
          code: 'PLANT_NOT_FOUND',
        });
        return;
      }

      (req as any).effectivePlantId = plantId;
      (req as any).plantId = plantId;
    }

    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Tenant validation error',
      code: 'TENANT_ERROR',
    });
  }
};

/**
 * Helper function to get effective tenant ID from request
 */
export const getTenantId = (req: Request): string => {
  return (req as any).effectiveTenantId || req.user?.tenantId;
};

/**
 * Helper function to get effective plant ID from request
 */
export const getPlantId = (req: Request): string | undefined => {
  return (req as any).effectivePlantId || req.user?.plantId;
};

/**
 * Plant access middleware
 * Ensures user has access to the specified plant
 */
export const requirePlantAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const plantId = req.params.plantId || req.body.plantId;

    if (!plantId) {
      res.status(400).json({
        success: false,
        message: 'Plant ID is required',
        code: 'PLANT_ID_REQUIRED',
      });
      return;
    }

    const tenantId = getTenantId(req);

    // Verify plant exists and belongs to tenant
    const plant = await prisma.plant.findFirst({
      where: {
        id: plantId,
        tenantId,
      },
    });

    if (!plant) {
      res.status(404).json({
        success: false,
        message: 'Plant not found',
        code: 'PLANT_NOT_FOUND',
      });
      return;
    }

    // Check if user has plant-specific access
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { plantId: true },
    });

    // If user is assigned to a specific plant, they can only access that plant
    if (user?.plantId && user.plantId !== plantId) {
      // Check if user has cross-plant access
      const hasCrossPlantAccess = req.user!.roles.includes('plant_manager') ||
                                   req.user!.roles.includes('super_admin');

      if (!hasCrossPlantAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied for this plant',
          code: 'PLANT_ACCESS_DENIED',
        });
        return;
      }
    }

    next();
  } catch (error) {
    console.error('Plant access middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Plant access validation error',
      code: 'PLANT_ACCESS_ERROR',
    });
  }
};
