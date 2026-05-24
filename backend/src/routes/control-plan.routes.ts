import { Router } from 'express';
import { prisma } from '../server';
import { requirePermission } from '../middleware/auth.middleware';

const router = Router();

// Get all control plans with filtering
router.get('/', async (req, res) => {
  try {
    const { status, search, page = '1', limit = '20' } = req.query;
    const tenantId = (req as any).tenantId;

    const where: any = { tenantId, deletedAt: null };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { controlPlanId: { contains: search as string, mode: 'insensitive' } },
        { title: { contains: search as string, mode: 'insensitive' } },
        { productName: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [plans, total] = await Promise.all([
      prisma.controlPlan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
        include: { characteristics: true }
      }),
      prisma.controlPlan.count({ where })
    ]);

    res.json({
      success: true,
      data: plans,
      pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get control plan by ID
router.get('/:id', async (req, res) => {
  try {
    const plan = await prisma.controlPlan.findFirst({
      where: { id: req.params.id, tenantId: (req as any).tenantId, deletedAt: null },
      include: { characteristics: true }
    });

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Control Plan not found' });
    }

    res.json({ success: true, data: plan });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create control plan
router.post('/', requirePermission('control-plan.create'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const controlPlanId = `CP-${Date.now()}`;

    const plan = await prisma.controlPlan.create({
      data: {
        ...req.body,
        controlPlanId,
        tenantId,
        preparedById: (req as any).user.id
      }
    });

    res.status(201).json({ success: true, data: plan });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update control plan
router.put('/:id', requirePermission('control-plan.update'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const plan = await prisma.controlPlan.updateMany({
      where: { id: req.params.id, tenantId, deletedAt: null },
      data: { ...req.body, updatedAt: new Date() }
    });

    if (plan.count === 0) {
      return res.status(404).json({ success: false, message: 'Control Plan not found' });
    }

    res.json({ success: true, message: 'Control Plan updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete control plan
router.delete('/:id', requirePermission('control-plan.delete'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    await prisma.controlPlan.updateMany({
      where: { id: req.params.id, tenantId },
      data: { deletedAt: new Date(), updatedAt: new Date() }
    });

    res.json({ success: true, message: 'Control Plan deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
