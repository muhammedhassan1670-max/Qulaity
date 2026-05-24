import { Router } from 'express';
import { prisma } from '../server';
import { requirePermission } from '../middleware/auth.middleware';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { type, result, search, page = '1', limit = '20' } = req.query;
    const tenantId = (req as any).tenantId;

    const where: any = { tenantId, deletedAt: null };
    if (type) where.type = type;
    if (result) where.result = result;
    if (search) {
      where.OR = [
        { inspectionNumber: { contains: search as string, mode: 'insensitive' } },
        { productName: { contains: search as string, mode: 'insensitive' } },
        { batchNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      (prisma as any).inspectionRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      (prisma as any).inspectionRecord.count({ where }),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const item = await (prisma as any).inspectionRecord.findFirst({
      where: { id: req.params.id, tenantId, deletedAt: null },
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Inspection record not found' });
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', requirePermission('inspection.create'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const inspectionNumber = req.body.inspectionNumber || `INS-${Date.now()}`;

    const created = await (prisma as any).inspectionRecord.create({
      data: {
        ...req.body,
        inspectionNumber,
        tenantId,
        inspectionDate: req.body.inspectionDate ? new Date(req.body.inspectionDate) : new Date(),
      },
    });

    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', requirePermission('inspection.update'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const result = await (prisma as any).inspectionRecord.updateMany({
      where: { id: req.params.id, tenantId, deletedAt: null },
      data: {
        ...req.body,
        inspectionDate: req.body.inspectionDate ? new Date(req.body.inspectionDate) : undefined,
        updatedAt: new Date(),
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ success: false, message: 'Inspection record not found' });
    }

    res.json({ success: true, message: 'Inspection updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', requirePermission('inspection.delete'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    await (prisma as any).inspectionRecord.updateMany({
      where: { id: req.params.id, tenantId },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    });

    res.json({ success: true, message: 'Inspection deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
