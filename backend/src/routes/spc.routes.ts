import { Router } from 'express';
import { SPCController } from '../controllers/spc.controller';

const router = Router();
const spcController = new SPCController();

router.get('/', spcController.getAll);
router.get('/stats', spcController.getStats);
router.get('/:id', spcController.getById);
router.post('/', spcController.create);
router.post('/:id/data-points', spcController.addDataPoint);
router.get('/:id/data-points', spcController.getDataPoints);
router.get('/:id/violations', spcController.getViolations);

export default router;
