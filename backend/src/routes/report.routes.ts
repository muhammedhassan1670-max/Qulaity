import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';

const router = Router();
const reportController = new ReportController();

router.get('/', reportController.getAll);
router.get('/:id', reportController.getById);
router.post('/', reportController.create);

export default router;
