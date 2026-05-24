import { Router } from 'express';
import { PlantController } from '../controllers/plant.controller';

const router = Router();
const plantController = new PlantController();

router.get('/', plantController.getAll);
router.get('/:id', plantController.getById);
router.post('/', plantController.create);
router.put('/:id', plantController.update);
router.get('/:id/machines', plantController.getMachines);
router.post('/:id/machines', plantController.createMachine);

export default router;
