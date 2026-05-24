import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { requirePermission } from '../middleware/auth.middleware';

const router = Router();
const userController = new UserController();

router.get('/', userController.getAll);
router.get('/me', userController.getMe);
router.get('/:id', userController.getById);
router.post('/', requirePermission('user.create'), userController.create);
router.put('/:id', requirePermission('user.update'), userController.update);
router.patch('/:id/status', requirePermission('user.update'), userController.updateStatus);
router.delete('/:id', requirePermission('user.delete'), userController.delete);

export default router;
