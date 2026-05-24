import { Request, Response } from 'express';
import { prisma } from '../server';
import { ApiError, badRequest, notFound, forbidden } from '../middleware/error.middleware';
import { getTenantId, getPlantId } from '../middleware/tenant.middleware';

export class CAPAController {
  /**
   * Get all CAPAs
   */
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const {
        page = '1',
        limit = '20',
        status,
        type,
        priority,
        assignedToId,
        search,
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = { tenantId };

      if (status) where.status = status;
      if (type) where.type = type;
      if (priority) where.priority = priority;
      if (assignedToId) where.assignedToId = assignedToId;

      if (search) {
        where.OR = [
          { capaNumber: { contains: search as string, mode: 'insensitive' } },
          { title: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [capas, total] = await Promise.all([
        prisma.cAPA.findMany({
          where,
          include: {
            createdBy: { select: { id: true, firstName: true, lastName: true } },
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
            plant: { select: { id: true, name: true } },
            _count: { select: { actions: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.cAPA.count({ where }),
      ]);

      res.json({
        success: true,
        data: capas,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch CAPAs');
    }
  };

  /**
   * Get CAPA statistics
   */
  getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);

      const [total, open, inProgress, pendingVerification, closed, overdue] = await Promise.all([
        prisma.cAPA.count({ where: { tenantId } }),
        prisma.cAPA.count({ where: { tenantId, status: 'open' } }),
        prisma.cAPA.count({ where: { tenantId, status: 'in_progress' } }),
        prisma.cAPA.count({ where: { tenantId, status: 'pending_verification' } }),
        prisma.cAPA.count({ where: { tenantId, status: 'closed' } }),
        prisma.cAPA.count({
          where: {
            tenantId,
            dueDate: { lt: new Date() },
            status: { in: ['open', 'in_progress'] },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          total,
          byStatus: { open, inProgress, pendingVerification, closed },
          overdue,
        },
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch CAPA statistics');
    }
  };

  /**
   * Get CAPA by ID
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);

      const capa = await prisma.cAPA.findFirst({
        where: { id, tenantId },
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          plant: { select: { id: true, name: true } },
          actions: { orderBy: { createdAt: 'asc' } },
        },
      });

      if (!capa) {
        throw notFound('CAPA');
      }

      res.json({
        success: true,
        data: capa,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch CAPA');
    }
  };

  /**
   * Create CAPA
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const plantId = getPlantId(req) || req.body.plantId;

      const {
        title,
        description,
        type,
        source,
        sourceId,
        priority,
        assignedToId,
        dueDate,
      } = req.body;

      if (!title || !description || !type || !plantId) {
        throw badRequest('Missing required fields');
      }

      const capaNumber = await this.generateCAPANumber(tenantId);

      const capa = await prisma.cAPA.create({
        data: {
          tenantId,
          plantId,
          capaNumber,
          title,
          description,
          type,
          source,
          sourceId,
          priority: priority || 'medium',
          status: 'open',
          assignedToId,
          dueDate: dueDate ? new Date(dueDate) : null,
          createdById: req.user!.userId,
          updatedById: req.user!.userId,
          attachments: [],
        },
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          plant: { select: { id: true, name: true } },
        },
      });

      res.status(201).json({
        success: true,
        message: 'CAPA created successfully',
        data: capa,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to create CAPA');
    }
  };

  /**
   * Update CAPA
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);

      const capa = await prisma.cAPA.findFirst({
        where: { id, tenantId },
      });

      if (!capa) {
        throw notFound('CAPA');
      }

      if (capa.status === 'closed') {
        throw forbidden('Cannot update closed CAPA');
      }

      const {
        title,
        description,
        type,
        priority,
        assignedToId,
        dueDate,
      } = req.body;

      const updatedCAPA = await prisma.cAPA.update({
        where: { id },
        data: {
          title,
          description,
          type,
          priority,
          assignedToId,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          updatedById: req.user!.userId,
          updatedAt: new Date(),
        },
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          actions: true,
        },
      });

      res.json({
        success: true,
        message: 'CAPA updated successfully',
        data: updatedCAPA,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to update CAPA');
    }
  };

  /**
   * Update CAPA status
   */
  updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);
      const { status, effectiveness, verificationNotes } = req.body;

      const capa = await prisma.cAPA.findFirst({
        where: { id, tenantId },
      });

      if (!capa) {
        throw notFound('CAPA');
      }

      const validTransitions: Record<string, string[]> = {
        draft: ['open'],
        open: ['in_progress', 'cancelled'],
        in_progress: ['pending_verification', 'open'],
        pending_verification: ['closed', 'in_progress'],
        closed: [],
        cancelled: [],
      };

      if (!validTransitions[capa.status]?.includes(status)) {
        throw badRequest(`Invalid status transition from ${capa.status} to ${status}`);
      }

      const updateData: any = {
        status,
        updatedById: req.user!.userId,
        updatedAt: new Date(),
      };

      if (status === 'closed') {
        updateData.completedDate = new Date();
        updateData.effectiveness = effectiveness;
        updateData.verifiedById = req.user!.userId;
        updateData.verifiedAt = new Date();
        updateData.verificationNotes = verificationNotes;
      }

      const updatedCAPA = await prisma.cAPA.update({
        where: { id },
        data: updateData,
      });

      res.json({
        success: true,
        message: `CAPA status updated to ${status}`,
        data: updatedCAPA,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to update CAPA status');
    }
  };

  /**
   * Delete CAPA
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);

      const capa = await prisma.cAPA.findFirst({
        where: { id, tenantId },
      });

      if (!capa) {
        throw notFound('CAPA');
      }

      await prisma.cAPA.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'CAPA deleted successfully',
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to delete CAPA');
    }
  };

  /**
   * Generate CAPA number
   */
  private generateCAPANumber = async (tenantId: string): Promise<string> => {
    const year = new Date().getFullYear();

    const count = await prisma.cAPA.count({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
    });

    return `CAPA-${year}-${String(count + 1).padStart(4, '0')}`;
  };
}
