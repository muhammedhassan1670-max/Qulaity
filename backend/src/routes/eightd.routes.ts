import { Router } from 'express';
import { prisma } from '../server';

const router = Router();

// GET /api/v1/eight-d - Get all 8D reports
router.get('/', async (req, res) => {
  try {
    const eightDs = await prisma.eightD.findMany({
      where: { tenantId: req.user!.tenantId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: eightDs, total: eightDs.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch 8D reports' });
  }
});

// GET /api/v1/eight-d/:id - Get single 8D report
router.get('/:id', async (req, res) => {
  try {
    const eightD = await prisma.eightD.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId },
    });
    if (!eightD) {
      return res.status(404).json({ success: false, message: '8D report not found' });
    }
    res.json({ success: true, data: eightD });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch 8D report' });
  }
});

// POST /api/v1/eight-d - Create new 8D report
router.post('/', async (req, res) => {
  try {
    const { dNumber, title, customerName, customerRef } = req.body;
    
    const eightD = await prisma.eightD.create({
      data: {
        tenantId: req.user!.tenantId,
        dNumber,
        title,
        customerName,
        customerRef,
        currentStep: 1,
        status: 'open',
        teamLeadId: req.user!.id,
      },
    });
    
    res.status(201).json({ success: true, data: eightD });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create 8D report' });
  }
});

// PUT /api/v1/eight-d/:id - Update 8D report
router.put('/:id', async (req, res) => {
  try {
    const eightD = await prisma.eightD.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: eightD });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update 8D report' });
  }
});

// PUT /api/v1/eight-d/:id/step/:step - Update specific step
router.put('/:id/step/:step', async (req, res) => {
  try {
    const { step } = req.params;
    const stepNum = parseInt(step);
    
    const updateData: any = { currentStep: stepNum };
    
    // Update specific step fields based on step number
    if (stepNum === 1) updateData.teamMembers = req.body.teamMembers;
    if (stepNum === 2) updateData.problemDescription = req.body.problemDescription;
    if (stepNum === 3) updateData.containmentActions = req.body.containmentActions;
    if (stepNum === 4) updateData.rootCause = req.body.rootCause;
    if (stepNum === 5) updateData.correctiveActions = req.body.correctiveActions;
    if (stepNum === 6) updateData.implementationDate = req.body.implementationDate;
    if (stepNum === 7) updateData.preventiveActions = req.body.preventiveActions;
    if (stepNum === 8) {
      updateData.lessonsLearned = req.body.lessonsLearned;
      updateData.completedAt = new Date();
      updateData.status = 'completed';
    }
    
    const eightD = await prisma.eightD.update({
      where: { id: req.params.id },
      data: updateData,
    });
    
    res.json({ success: true, data: eightD });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update 8D step' });
  }
});

export default router;
