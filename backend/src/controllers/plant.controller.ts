import { Request, Response } from 'express';
import { prisma } from '../server';
import { ApiError, badRequest, notFound } from '../middleware/error.middleware';
import { getTenantId } from '../middleware/tenant.middleware';

export class PlantController {
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const plants = await prisma.plant.findMany({
        where: { tenantId, deletedAt: null },
        include: {
          _count: { select: { users: true, machines: true } },
        },
      });
      res.json({ success: true, data: plants });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch plants');
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);
      const plant = await prisma.plant.findFirst({
        where: { id, tenantId },
        include: {
          departments: true,
          machines: true,
          _count: { select: { users: true } },
        },
      });
      if (!plant) throw notFound('Plant');
      res.json({ success: true, data: plant });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch plant');
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const { name, code, location, timezone } = req.body;
      const plant = await prisma.plant.create({
        data: { tenantId, name, code, location, timezone },
      });
      res.status(201).json({ success: true, message: 'Plant created', data: plant });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to create plant');
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);
      const plant = await prisma.plant.update({
        where: { id },
        data: { ...req.body, updatedAt: new Date() },
      });
      res.json({ success: true, message: 'Plant updated', data: plant });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to update plant');
    }
  };

  getMachines = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);
      const machines = await prisma.machine.findMany({
        where: { plantId: id, plant: { tenantId } },
      });
      res.json({ success: true, data: machines });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch machines');
    }
  };

  createMachine = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);
      const machine = await prisma.machine.create({
        data: { ...req.body, plantId: id },
      });
      res.status(201).json({ success: true, message: 'Machine created', data: machine });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to create machine');
    }
  };
}
