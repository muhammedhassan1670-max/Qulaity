import { Router } from 'express';
import { prisma } from '../server';
import { requirePermission } from '../middleware/auth.middleware';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { status, search, page = '1', limit = '20' } = req.query;
    const tenantId = (req as any).tenantId;

    const where: any = { tenantId, deletedAt: null };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { calibrationNumber: { contains: search as string, mode: 'insensitive' } },
        { equipment: { contains: search as string, mode: 'insensitive' } },
        { serialNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      (prisma as any).calibrationRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      (prisma as any).calibrationRecord.count({ where }),
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
    const item = await (prisma as any).calibrationRecord.findFirst({
      where: { id: req.params.id, tenantId, deletedAt: null },
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Calibration record not found' });
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', requirePermission('calibration.create'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const calibrationNumber = req.body.calibrationNumber || `CAL-${Date.now()}`;

    const created = await (prisma as any).calibrationRecord.create({
      data: {
        ...req.body,
        calibrationNumber,
        tenantId,
        lastCalibration: req.body.lastCalibration ? new Date(req.body.lastCalibration) : undefined,
        nextCalibration: req.body.nextCalibration ? new Date(req.body.nextCalibration) : undefined,
      },
    });

    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', requirePermission('calibration.update'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const result = await (prisma as any).calibrationRecord.updateMany({
      where: { id: req.params.id, tenantId, deletedAt: null },
      data: {
        ...req.body,
        lastCalibration: req.body.lastCalibration ? new Date(req.body.lastCalibration) : undefined,
        nextCalibration: req.body.nextCalibration ? new Date(req.body.nextCalibration) : undefined,
        updatedAt: new Date(),
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ success: false, message: 'Calibration record not found' });
    }

    res.json({ success: true, message: 'Calibration updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', requirePermission('calibration.delete'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    await (prisma as any).calibrationRecord.updateMany({
      where: { id: req.params.id, tenantId },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    });

    res.json({ success: true, message: 'Calibration deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
