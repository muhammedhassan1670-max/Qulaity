import { Request, Response } from 'express';
import { prisma } from '../server';
import { ApiError, badRequest } from '../middleware/error.middleware';
import { getTenantId } from '../middleware/tenant.middleware';

export class AuditController {
  getLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const { page = '1', limit = '50', action, entityType } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = { tenantId };
      if (action) where.action = action;
      if (entityType) where.entityType = entityType;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.json({
        success: true,
        data: logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch audit logs');
    }
  };

  getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);

      const [total, today, byAction] = await Promise.all([
        prisma.auditLog.count({ where: { tenantId } }),
        prisma.auditLog.count({
          where: {
            tenantId,
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
        prisma.auditLog.groupBy({
          by: ['action'],
          where: { tenantId },
          _count: { action: true },
        }),
      ]);

      res.json({
        success: true,
        data: { total, today, byAction },
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch audit stats');
    }
  };
}
