import { Request, Response } from 'express';
import { prisma } from '../server';
import { ApiError, badRequest, notFound } from '../middleware/error.middleware';
import { getTenantId } from '../middleware/tenant.middleware';

export class WorkflowController {
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const workflows = await prisma.workflow.findMany({
        where: { tenantId },
        include: { steps: true },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: workflows });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch workflows');
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);
      const workflow = await prisma.workflow.findFirst({
        where: { id, tenantId },
        include: { steps: true },
      });
      if (!workflow) throw notFound('Workflow');
      res.json({ success: true, data: workflow });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch workflow');
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const { name, description, entityType, steps } = req.body;
      const workflow = await prisma.workflow.create({
        data: {
          tenantId,
          name,
          description,
          entityType,
          steps: {
            create: steps,
          },
        },
        include: { steps: true },
      });
      res.status(201).json({ success: true, message: 'Workflow created', data: workflow });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to create workflow');
    }
  };

  trigger = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);
      const { entityType, entityId } = req.body;

      const workflow = await prisma.workflow.findFirst({
        where: { id, tenantId },
        include: { steps: { orderBy: { stepNumber: 'asc' } } },
      });

      if (!workflow) throw notFound('Workflow');

      const instance = await prisma.workflowInstance.create({
        data: {
          workflowId: id,
          entityType,
          entityId,
          currentStepId: workflow.steps[0]?.id,
          status: 'active',
        },
      });

      res.json({ success: true, message: 'Workflow triggered', data: instance });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to trigger workflow');
    }
  };
}
