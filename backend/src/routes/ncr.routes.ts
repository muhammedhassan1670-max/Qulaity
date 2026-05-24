import { Router } from 'express';
import { NCRController } from '../controllers/ncr.controller';
import { requirePermission } from '../middleware/auth.middleware';

const router = Router();
const ncrController = new NCRController();

// NCR CRUD operations
router.get('/', ncrController.getAll);
router.get('/stats', ncrController.getStats);
router.get('/:id', ncrController.getById);
router.post('/', requirePermission('ncr.create'), ncrController.create);
router.put('/:id', requirePermission('ncr.update'), ncrController.update);
router.patch('/:id/status', requirePermission('ncr.update'), ncrController.updateStatus);
router.delete('/:id', requirePermission('ncr.delete'), ncrController.delete);

// NCR Comments
router.get('/:id/comments', ncrController.getComments);
router.post('/:id/comments', requirePermission('ncr.comment'), ncrController.addComment);

// NCR Approvals
router.get('/:id/approvals', ncrController.getApprovals);
router.post('/:id/approve', requirePermission('ncr.approve'), ncrController.approve);
router.post('/:id/reject', requirePermission('ncr.approve'), ncrController.reject);

// NCR Attachments
router.post('/:id/attachments', requirePermission('ncr.update'), ncrController.addAttachment);
router.delete('/:id/attachments/:attachmentId', requirePermission('ncr.update'), ncrController.removeAttachment);

// Link CAPA
router.post('/:id/link-capa', requirePermission('ncr.update'), ncrController.linkCAPA);

export default router;
