import { Router } from 'express';
import { prisma } from '../server';

const router = Router();

// GET /api/v1/fmea - Get all FMEA records
router.get('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    const items = await prisma.fMEA.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });

    res.json({
      success: true,
      data: items,
      total: items.length,
      page: 1,
      limit: items.length,
      totalPages: 1,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch FMEA records' });
  }
});

// GET /api/v1/fmea/:id - Get single FMEA
router.get('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const item = await prisma.fMEA.findFirst({
      where: { id: req.params.id, tenantId },
      include: { items: true },
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'FMEA not found' });
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch FMEA record' });
  }
});

// POST /api/v1/fmea - Create FMEA
router.post('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const fmeaNumber = req.body.fmeaNumber || `FMEA-${Date.now()}`;

    const created = await prisma.fMEA.create({
      data: {
        tenantId,
        fmeaNumber,
        title: req.body.title,
        status: req.body.status || 'draft',
        type: req.body.type || 'process',
        productName: req.body.productName,
        processName: req.body.processName,
        teamMembers: req.body.teamMembers || [],
        items: req.body.items
          ? {
              create: (req.body.items as any[]).map((it) => ({
                stepNumber: it.stepNumber || 1,
                function: it.function || it.processStep || 'Process step',
                failureMode: it.failureMode,
                failureEffect: it.failureEffect || it.potentialEffect || it.effects || 'Effect TBD',
                severity: it.severity || it.severityRating || 1,
                cause: it.cause || it.causes || 'Cause TBD',
                occurrence: it.occurrence || it.occurrenceRating || 1,
                currentControls: it.currentControls,
                detection: it.detection || it.detectionRating || 1,
                rpn: it.rpn,
                recommendedAction: it.recommendedAction,
                responsibility: it.responsibility || it.responsibleParty,
                targetDate: it.targetDate ? new Date(it.targetDate) : undefined,
              })),
            }
          : undefined,
      },
      include: { items: true },
    });

    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create FMEA record' });
  }
});

// PATCH /api/v1/fmea/:id - Update FMEA
router.patch('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const id = req.params.id;

    const existing = await prisma.fMEA.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'FMEA not found' });
    }

    const updated = await prisma.fMEA.update({
      where: { id },
      data: {
        title: req.body.title ?? existing.title,
        status: req.body.status ?? existing.status,
        type: req.body.type ?? existing.type,
        productName: req.body.productName ?? existing.productName,
        processName: req.body.processName ?? existing.processName,
        teamMembers: req.body.teamMembers ?? existing.teamMembers,
      },
      include: { items: true },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update FMEA record' });
  }
});

// DELETE /api/v1/fmea/:id - Delete FMEA
router.delete('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const id = req.params.id;

    await prisma.fMEAItem.deleteMany({ where: { fmeaId: id } });
    await prisma.fMEA.deleteMany({ where: { id, tenantId } });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete FMEA record' });
  }
});

export default router;
