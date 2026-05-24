import { Router } from 'express';
import { CAPAController } from '../controllers/capa.controller';
import { requirePermission } from '../middleware/auth.middleware';

const router = Router();
const capaController = new CAPAController();

router.get('/', capaController.getAll);
router.get('/stats', capaController.getStats);
router.get('/:id', capaController.getById);
router.post('/', requirePermission('capa.create'), capaController.create);
router.put('/:id', requirePermission('capa.update'), capaController.update);
router.patch('/:id/status', requirePermission('capa.update'), capaController.updateStatus);
router.delete('/:id', requirePermission('capa.delete'), capaController.delete);

export default router;
