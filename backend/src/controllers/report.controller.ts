import { Request, Response } from 'express';
import { prisma } from '../server';
import { ApiError, badRequest, notFound } from '../middleware/error.middleware';
import { getTenantId } from '../middleware/tenant.middleware';

export class ReportController {
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const reports = await prisma.report.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: reports });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch reports');
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);
      const report = await prisma.report.findFirst({
        where: { id, tenantId },
      });
      if (!report) throw notFound('Report');
      res.json({ success: true, data: report });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch report');
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const { name, description, type, parameters, schedule } = req.body;
      const report = await prisma.report.create({
        data: {
          tenantId,
          name,
          description,
          type,
          parameters,
          schedule,
          createdById: req.user!.userId,
        },
      });
      res.status(201).json({ success: true, message: 'Report created', data: report });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to create report');
    }
  };
}
