import { Router } from 'express';
import { prisma } from '../server';
import { requirePermission } from '../middleware/auth.middleware';

const router = Router();

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    const { status, category, search, page = '1', limit = '20' } = req.query;
    const tenantId = (req as any).tenantId;

    const where: any = { tenantId, deletedAt: null };
    if (status) where.status = status;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { supplierCode: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      (prisma as any).supplier.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      (prisma as any).supplier.count({ where }),
    ]);

    res.json({
      success: true,
      data: suppliers,
      pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get supplier by ID
router.get('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const supplier = await (prisma as any).supplier.findFirst({
      where: { id: req.params.id, tenantId, deletedAt: null },
    });

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    res.json({ success: true, data: supplier });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create supplier
router.post('/', requirePermission('supplier.create'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const supplierCode = req.body.supplierCode || `SUP-${Date.now()}`;

    const supplier = await (prisma as any).supplier.create({
      data: {
        ...req.body,
        supplierCode,
        tenantId,
      },
    });

    res.status(201).json({ success: true, data: supplier });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update supplier
router.put('/:id', requirePermission('supplier.update'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const result = await (prisma as any).supplier.updateMany({
      where: { id: req.params.id, tenantId, deletedAt: null },
      data: { ...req.body, updatedAt: new Date() },
    });

    if (result.count === 0) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    res.json({ success: true, message: 'Supplier updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete supplier (soft)
router.delete('/:id', requirePermission('supplier.delete'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    await (prisma as any).supplier.updateMany({
      where: { id: req.params.id, tenantId },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    });

    res.json({ success: true, message: 'Supplier deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
