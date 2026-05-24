import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';

const router = Router();
const auditController = new AuditController();

router.get('/logs', auditController.getLogs);
router.get('/logs/stats', auditController.getStats);

export default router;
