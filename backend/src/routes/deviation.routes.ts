import { Router } from 'express';
import { prisma } from '../server';
import { requirePermission } from '../middleware/auth.middleware';

const router = Router();

// Get all deviations with filtering
router.get('/', async (req, res) => {
  try {
    const { status, type, search, page = '1', limit = '20' } = req.query;
    const tenantId = (req as any).tenantId;

    const where: any = { tenantId, deletedAt: null };
    if (status) where.status = status;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { deviationNumber: { contains: search as string, mode: 'insensitive' } },
        { title: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [deviations, total] = await Promise.all([
      prisma.deviation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string)
      }),
      prisma.deviation.count({ where })
    ]);

    res.json({
      success: true,
      data: deviations,
      pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get deviation by ID
router.get('/:id', async (req, res) => {
  try {
    const deviation = await prisma.deviation.findFirst({
      where: { id: req.params.id, tenantId: (req as any).tenantId, deletedAt: null }
    });

    if (!deviation) {
      return res.status(404).json({ success: false, message: 'Deviation not found' });
    }

    res.json({ success: true, data: deviation });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create deviation
router.post('/', requirePermission('deviation.create'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const deviationNumber = `DEV-${Date.now()}`;

    const deviation = await prisma.deviation.create({
      data: {
        ...req.body,
        deviationNumber,
        tenantId,
        requestedById: (req as any).user.id
      }
    });

    res.status(201).json({ success: true, data: deviation });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update deviation
router.put('/:id', requirePermission('deviation.update'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const deviation = await prisma.deviation.updateMany({
      where: { id: req.params.id, tenantId, deletedAt: null },
      data: { ...req.body, updatedAt: new Date() }
    });

    if (deviation.count === 0) {
      return res.status(404).json({ success: false, message: 'Deviation not found' });
    }

    res.json({ success: true, message: 'Deviation updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete deviation
router.delete('/:id', requirePermission('deviation.delete'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    await prisma.deviation.updateMany({
      where: { id: req.params.id, tenantId },
      data: { deletedAt: new Date(), updatedAt: new Date() }
    });

    res.json({ success: true, message: 'Deviation deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
