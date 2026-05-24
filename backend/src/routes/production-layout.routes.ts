import { Router } from 'express';
import { prisma } from '../server';
import { requirePermission } from '../middleware/auth.middleware';

const router = Router();

// Get all production layouts
router.get('/', async (req, res) => {
  try {
    const { search, plantId, isPublished, page = '1', limit = '20' } = req.query;
    const tenantId = (req as any).tenantId;

    const where: any = { tenantId, deletedAt: null };

    if (plantId) where.plantId = plantId;
    if (isPublished !== undefined) {
      where.isPublished = String(isPublished) === 'true';
    }
    if (search) {
      where.OR = [{ name: { contains: search as string, mode: 'insensitive' } }];
    }

    const [items, total] = await Promise.all([
      (prisma as any).productionLayout.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      (prisma as any).productionLayout.count({ where }),
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

// Get production layout by ID
router.get('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    const item = await (prisma as any).productionLayout.findFirst({
      where: { id: req.params.id, tenantId, deletedAt: null },
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Production layout not found' });
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create production layout
router.post('/', requirePermission('production-layout.create'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    const created = await (prisma as any).productionLayout.create({
      data: {
        tenantId,
        plantId: req.body.plantId ?? null,
        name: req.body.name ?? 'New Layout',
        version: req.body.version ?? 1,
        isPublished: Boolean(req.body.isPublished ?? false),
        layout: req.body.layout ?? {},
        metadata: req.body.metadata ?? {},
      },
    });

    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update production layout
router.put('/:id', requirePermission('production-layout.update'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    const result = await (prisma as any).productionLayout.updateMany({
      where: { id: req.params.id, tenantId, deletedAt: null },
      data: {
        plantId: req.body.plantId,
        name: req.body.name,
        version: req.body.version,
        isPublished: req.body.isPublished,
        layout: req.body.layout,
        metadata: req.body.metadata,
        updatedAt: new Date(),
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ success: false, message: 'Production layout not found' });
    }

    res.json({ success: true, message: 'Production layout updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Patch production layout (alias for update)
router.patch('/:id', requirePermission('production-layout.update'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    const result = await (prisma as any).productionLayout.updateMany({
      where: { id: req.params.id, tenantId, deletedAt: null },
      data: {
        plantId: req.body.plantId,
        name: req.body.name,
        version: req.body.version,
        isPublished: req.body.isPublished,
        layout: req.body.layout,
        metadata: req.body.metadata,
        updatedAt: new Date(),
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ success: false, message: 'Production layout not found' });
    }

    res.json({ success: true, message: 'Production layout updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete production layout (soft)
router.delete('/:id', requirePermission('production-layout.delete'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    await (prisma as any).productionLayout.updateMany({
      where: { id: req.params.id, tenantId },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    });

    res.json({ success: true, message: 'Production layout deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
