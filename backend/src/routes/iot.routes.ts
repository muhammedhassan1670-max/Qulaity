import { Router } from 'express';
import { IoTController } from '../controllers/iot.controller';

const router = Router();
const iotController = new IoTController();

router.get('/devices', iotController.getDevices);
router.get('/devices/stats', iotController.getDeviceStats);
router.get('/devices/:id', iotController.getDeviceById);
router.post('/devices', iotController.createDevice);
router.put('/devices/:id', iotController.updateDevice);
router.get('/devices/:id/data', iotController.getDeviceData);
router.get('/mqtt/status', iotController.getMqttStatus);

export default router;
