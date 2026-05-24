import { Request, Response } from 'express';
import { prisma } from '../server';
import { ApiError, badRequest, notFound, forbidden } from '../middleware/error.middleware';
import { getTenantId, getPlantId } from '../middleware/tenant.middleware';

export class NCRController {
  /**
   * Get all NCRs with filtering and pagination
   */
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const plantId = getPlantId(req);

      const {
        page = '1',
        limit = '20',
        status,
        severity,
        category,
        assignedToId,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build filter conditions
      const where: any = {
        tenantId,
        deletedAt: null,
      };

      if (plantId) {
        where.plantId = plantId;
      }

      if (status) {
        where.status = status;
      }

      if (severity) {
        where.severity = severity;
      }

      if (category) {
        where.category = category;
      }

      if (assignedToId) {
        where.assignedToId = assignedToId;
      }

      if (search) {
        where.OR = [
          { ncrNumber: { contains: search as string, mode: 'insensitive' } },
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      // Get total count
      const total = await prisma.nCR.count({ where });

      // Get NCRs
      const ncrs = await prisma.nCR.findMany({
        where,
        include: {
          reportedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          plant: {
            select: { id: true, name: true, code: true },
          },
          _count: {
            select: { comments: true, approvals: true },
          },
        },
        orderBy: { [sortBy as string]: sortOrder },
        skip,
        take: limitNum,
      });

      res.json({
        success: true,
        data: ncrs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch NCRs');
    }
  };

  /**
   * Get NCR statistics
   */
  getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const plantId = getPlantId(req);

      const where: any = {
        tenantId,
        deletedAt: null,
      };

      if (plantId) {
        where.plantId = plantId;
      }

      const [
        total,
        open,
        inReview,
        pendingCAPA,
        closed,
        critical,
        major,
        minor,
      ] = await Promise.all([
        prisma.nCR.count({ where }),
        prisma.nCR.count({ where: { ...where, status: 'open' } }),
        prisma.nCR.count({ where: { ...where, status: 'in_review' } }),
        prisma.nCR.count({ where: { ...where, status: 'pending_capa' } }),
        prisma.nCR.count({ where: { ...where, status: 'closed' } }),
        prisma.nCR.count({ where: { ...where, severity: 'critical' } }),
        prisma.nCR.count({ where: { ...where, severity: 'major' } }),
        prisma.nCR.count({ where: { ...where, severity: 'minor' } }),
      ]);

      // Get trend (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const trend = await prisma.nCR.groupBy({
        by: ['status'],
        where: {
          ...where,
          createdAt: { gte: sixMonthsAgo },
        },
        _count: { id: true },
      });

      res.json({
        success: true,
        data: {
          total,
          byStatus: {
            open,
            inReview,
            pendingCAPA,
            closed,
          },
          bySeverity: {
            critical,
            major,
            minor,
          },
          trend,
        },
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch NCR statistics');
    }
  };

  /**
   * Get NCR by ID
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);

      const ncr = await prisma.nCR.findFirst({
        where: { id, tenantId, deletedAt: null },
        include: {
          reportedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          plant: {
            select: { id: true, name: true, code: true },
          },
          comments: {
            orderBy: { createdAt: 'desc' },
          },
          approvals: {
            orderBy: { step: 'asc' },
          },
        },
      });

      if (!ncr) {
        throw notFound('NCR');
      }

      res.json({
        success: true,
        data: ncr,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch NCR');
    }
  };

  /**
   * Create new NCR
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const plantId = getPlantId(req) || req.body.plantId;

      const {
        title,
        description,
        category,
        severity,
        detectedDate,
        department,
        productCode,
        lotNumber,
        quantityAffected,
        assignedToId,
      } = req.body;

      // Validate required fields
      if (!title || !description || !category || !severity || !plantId) {
        throw badRequest('Missing required fields');
      }

      // Generate NCR number
      const ncrNumber = await this.generateNCRNumber(tenantId);

      // Create NCR
      const ncr = await prisma.nCR.create({
        data: {
          tenantId,
          plantId,
          ncrNumber,
          title,
          description,
          category,
          severity,
          status: 'open',
          detectedDate: detectedDate ? new Date(detectedDate) : new Date(),
          reportedById: req.user!.userId,
          assignedToId,
          department,
          productCode,
          lotNumber,
          quantityAffected,
          attachments: [],
        },
        include: {
          reportedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          plant: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      // TODO: Trigger workflow if configured
      // await this.triggerWorkflow(ncr.id, 'ncr_created');

      res.status(201).json({
        success: true,
        message: 'NCR created successfully',
        data: ncr,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to create NCR');
    }
  };

  /**
   * Update NCR
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);

      const ncr = await prisma.nCR.findFirst({
        where: { id, tenantId, deletedAt: null },
      });

      if (!ncr) {
        throw notFound('NCR');
      }

      // Check if NCR can be updated
      if (ncr.status === 'closed' || ncr.status === 'cancelled') {
        throw forbidden('Cannot update closed or cancelled NCR');
      }

      const {
        title,
        description,
        category,
        severity,
        detectedDate,
        department,
        productCode,
        lotNumber,
        quantityAffected,
        assignedToId,
        rootCause,
        containmentAction,
        correctiveAction,
        preventiveAction,
      } = req.body;

      const updatedNCR = await prisma.nCR.update({
        where: { id },
        data: {
          title,
          description,
          category,
          severity,
          detectedDate: detectedDate ? new Date(detectedDate) : undefined,
          department,
          productCode,
          lotNumber,
          quantityAffected,
          assignedToId,
          rootCause,
          containmentAction,
          correctiveAction,
          preventiveAction,
          updatedAt: new Date(),
        },
        include: {
          reportedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          plant: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      res.json({
        success: true,
        message: 'NCR updated successfully',
        data: updatedNCR,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to update NCR');
    }
  };

  /**
   * Update NCR status
   */
  updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);
      const { status, closureNotes } = req.body;

      const ncr = await prisma.nCR.findFirst({
        where: { id, tenantId, deletedAt: null },
      });

      if (!ncr) {
        throw notFound('NCR');
      }

      // Validate status transition
      const validTransitions: Record<string, string[]> = {
        draft: ['open', 'cancelled'],
        open: ['in_review', 'cancelled'],
        in_review: ['pending_capa', 'open', 'cancelled'],
        pending_capa: ['closed', 'open'],
        closed: [],
        cancelled: [],
      };

      if (!validTransitions[ncr.status]?.includes(status)) {
        throw badRequest(`Invalid status transition from ${ncr.status} to ${status}`);
      }

      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      if (status === 'closed') {
        updateData.closedAt = new Date();
        updateData.closedById = req.user!.userId;
        updateData.closureNotes = closureNotes;
      }

      const updatedNCR = await prisma.nCR.update({
        where: { id },
        data: updateData,
        include: {
          reportedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      res.json({
        success: true,
        message: `NCR status updated to ${status}`,
        data: updatedNCR,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to update NCR status');
    }
  };

  /**
   * Delete NCR (soft delete)
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);

      const ncr = await prisma.nCR.findFirst({
        where: { id, tenantId, deletedAt: null },
      });

      if (!ncr) {
        throw notFound('NCR');
      }

      // Soft delete
      await prisma.nCR.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: 'NCR deleted successfully',
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to delete NCR');
    }
  };

  /**
   * Get NCR comments
   */
  getComments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);

      const ncr = await prisma.nCR.findFirst({
        where: { id, tenantId, deletedAt: null },
      });

      if (!ncr) {
        throw notFound('NCR');
      }

      const comments = await prisma.nCRComment.findMany({
        where: { ncrId: id },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: comments,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch comments');
    }
  };

  /**
   * Add comment to NCR
   */
  addComment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);
      const { content, isInternal } = req.body;

      if (!content) {
        throw badRequest('Comment content is required');
      }

      const ncr = await prisma.nCR.findFirst({
        where: { id, tenantId, deletedAt: null },
      });

      if (!ncr) {
        throw notFound('NCR');
      }

      const comment = await prisma.nCRComment.create({
        data: {
          ncrId: id,
          userId: req.user!.userId,
          content,
          isInternal: isInternal || false,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: comment,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to add comment');
    }
  };

  /**
   * Get NCR approvals
   */
  getApprovals = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);

      const ncr = await prisma.nCR.findFirst({
        where: { id, tenantId, deletedAt: null },
      });

      if (!ncr) {
        throw notFound('NCR');
      }

      const approvals = await prisma.nCRApproval.findMany({
        where: { ncrId: id },
        orderBy: { step: 'asc' },
      });

      res.json({
        success: true,
        data: approvals,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch approvals');
    }
  };

  /**
   * Approve NCR
   */
  approve = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);
      const { comments } = req.body;

      const ncr = await prisma.nCR.findFirst({
        where: { id, tenantId, deletedAt: null },
      });

      if (!ncr) {
        throw notFound('NCR');
      }

      // Get pending approval
      const pendingApproval = await prisma.nCRApproval.findFirst({
        where: { ncrId: id, status: 'pending' },
        orderBy: { step: 'asc' },
      });

      if (!pendingApproval) {
        throw badRequest('No pending approval found');
      }

      // Update approval
      await prisma.nCRApproval.update({
        where: { id: pendingApproval.id },
        data: {
          status: 'approved',
          comments,
          decidedAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: 'NCR approved successfully',
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to approve NCR');
    }
  };

  /**
   * Reject NCR
   */
  reject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);
      const { comments } = req.body;

      const ncr = await prisma.nCR.findFirst({
        where: { id, tenantId, deletedAt: null },
      });

      if (!ncr) {
        throw notFound('NCR');
      }

      // Get pending approval
      const pendingApproval = await prisma.nCRApproval.findFirst({
        where: { ncrId: id, status: 'pending' },
        orderBy: { step: 'asc' },
      });

      if (!pendingApproval) {
        throw badRequest('No pending approval found');
      }

      // Update approval
      await prisma.nCRApproval.update({
        where: { id: pendingApproval.id },
        data: {
          status: 'rejected',
          comments,
          decidedAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: 'NCR rejected',
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to reject NCR');
    }
  };

  /**
   * Add attachment to NCR
   */
  addAttachment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);
      const { name, url, type, size } = req.body;

      const ncr = await prisma.nCR.findFirst({
        where: { id, tenantId, deletedAt: null },
      });

      if (!ncr) {
        throw notFound('NCR');
      }

      const attachment = { id: Date.now().toString(), name, url, type, size, uploadedAt: new Date() };
      const attachments = [...(ncr.attachments as any[]), attachment];

      await prisma.nCR.update({
        where: { id },
        data: { attachments },
      });

      res.status(201).json({
        success: true,
        message: 'Attachment added successfully',
        data: attachment,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to add attachment');
    }
  };

  /**
   * Remove attachment from NCR
   */
  removeAttachment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, attachmentId } = req.params;
      const tenantId = getTenantId(req);

      const ncr = await prisma.nCR.findFirst({
        where: { id, tenantId, deletedAt: null },
      });

      if (!ncr) {
        throw notFound('NCR');
      }

      const attachments = (ncr.attachments as any[]).filter(a => a.id !== attachmentId);

      await prisma.nCR.update({
        where: { id },
        data: { attachments },
      });

      res.json({
        success: true,
        message: 'Attachment removed successfully',
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to remove attachment');
    }
  };

  /**
   * Link CAPA to NCR
   */
  linkCAPA = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);
      const { capaId } = req.body;

      const ncr = await prisma.nCR.findFirst({
        where: { id, tenantId, deletedAt: null },
      });

      if (!ncr) {
        throw notFound('NCR');
      }

      // Verify CAPA exists
      const capa = await prisma.cAPA.findFirst({
        where: { id: capaId, tenantId },
      });

      if (!capa) {
        throw notFound('CAPA');
      }

      await prisma.nCR.update({
        where: { id },
        data: { capaId },
      });

      res.json({
        success: true,
        message: 'CAPA linked successfully',
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to link CAPA');
    }
  };

  /**
   * Generate NCR number
   */
  private generateNCRNumber = async (tenantId: string): Promise<string> => {
    const year = new Date().getFullYear();

    // Get count of NCRs for this tenant this year
    const count = await prisma.nCR.count({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
    });

    return `NCR-${year}-${String(count + 1).padStart(4, '0')}`;
  };
}
