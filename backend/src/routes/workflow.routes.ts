import { Router } from 'express';
import { WorkflowController } from '../controllers/workflow.controller';

const router = Router();
const workflowController = new WorkflowController();

router.get('/', workflowController.getAll);
router.get('/:id', workflowController.getById);
router.post('/', workflowController.create);
router.post('/:id/trigger', workflowController.trigger);

export default router;
