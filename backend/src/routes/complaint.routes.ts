import { Router } from 'express';
import { prisma } from '../server';
import { requirePermission } from '../middleware/auth.middleware';

const router = Router();

// Get all complaints with filtering
router.get('/', async (req, res) => {
  try {
    const { status, priority, category, search, page = '1', limit = '20' } = req.query;
    const tenantId = (req as any).tenantId;

    const where: any = { tenantId, deletedAt: null };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { complaintId: { contains: search as string, mode: 'insensitive' } },
        { customerName: { contains: search as string, mode: 'insensitive' } },
        { subject: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string)
      }),
      prisma.complaint.count({ where })
    ]);

    res.json({
      success: true,
      data: complaints,
      pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get complaint by ID
router.get('/:id', async (req, res) => {
  try {
    const complaint = await prisma.complaint.findFirst({
      where: { id: req.params.id, tenantId: (req as any).tenantId, deletedAt: null }
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    res.json({ success: true, data: complaint });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create complaint
router.post('/', requirePermission('complaint.create'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const complaintId = `CMP-${Date.now()}`;

    const complaint = await prisma.complaint.create({
      data: {
        ...req.body,
        complaintId,
        tenantId,
        receivedDate: new Date()
      }
    });

    res.status(201).json({ success: true, data: complaint });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update complaint
router.put('/:id', requirePermission('complaint.update'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const complaint = await prisma.complaint.updateMany({
      where: { id: req.params.id, tenantId, deletedAt: null },
      data: { ...req.body, updatedAt: new Date() }
    });

    if (complaint.count === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    res.json({ success: true, message: 'Complaint updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete complaint
router.delete('/:id', requirePermission('complaint.delete'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    await prisma.complaint.updateMany({
      where: { id: req.params.id, tenantId },
      data: { deletedAt: new Date(), updatedAt: new Date() }
    });

    res.json({ success: true, message: 'Complaint deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
