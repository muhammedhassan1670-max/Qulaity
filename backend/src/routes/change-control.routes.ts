import { Router } from 'express';
import { prisma } from '../server';
import { requirePermission } from '../middleware/auth.middleware';

const router = Router();

// Get all change controls with filtering
router.get('/', async (req, res) => {
  try {
    const { status, type, priority, search, page = '1', limit = '20' } = req.query;
    const tenantId = (req as any).tenantId;

    const where: any = { tenantId, deletedAt: null };
    if (status) where.status = status;
    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { changeNumber: { contains: search as string, mode: 'insensitive' } },
        { title: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [changes, total] = await Promise.all([
      prisma.changeControl.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
        include: { approvals: true }
      }),
      prisma.changeControl.count({ where })
    ]);

    res.json({
      success: true,
      data: changes,
      pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get change control by ID
router.get('/:id', async (req, res) => {
  try {
    const change = await prisma.changeControl.findFirst({
      where: { id: req.params.id, tenantId: (req as any).tenantId, deletedAt: null },
      include: { approvals: true }
    });

    if (!change) {
      return res.status(404).json({ success: false, message: 'Change Control not found' });
    }

    res.json({ success: true, data: change });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create change control
router.post('/', requirePermission('change-control.create'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const changeNumber = `CHG-${Date.now()}`;

    const change = await prisma.changeControl.create({
      data: {
        ...req.body,
        changeNumber,
        tenantId,
        requestedById: (req as any).user.id,
        requestDate: new Date()
      }
    });

    res.status(201).json({ success: true, data: change });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update change control
router.put('/:id', requirePermission('change-control.update'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const change = await prisma.changeControl.updateMany({
      where: { id: req.params.id, tenantId, deletedAt: null },
      data: { ...req.body, updatedAt: new Date() }
    });

    if (change.count === 0) {
      return res.status(404).json({ success: false, message: 'Change Control not found' });
    }

    res.json({ success: true, message: 'Change Control updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete change control
router.delete('/:id', requirePermission('change-control.delete'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    await prisma.changeControl.updateMany({
      where: { id: req.params.id, tenantId },
      data: { deletedAt: new Date(), updatedAt: new Date() }
    });

    res.json({ success: true, message: 'Change Control deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
