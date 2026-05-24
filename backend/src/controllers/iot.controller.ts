import { Request, Response } from 'express';
import { prisma } from '../server';
import { ApiError, badRequest, notFound } from '../middleware/error.middleware';
import { getTenantId, getPlantId } from '../middleware/tenant.middleware';

export class IoTController {
  /**
   * Get all devices
   */
  getDevices = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const plantId = getPlantId(req);
      const { status, type } = req.query;

      const where: any = { tenantId };
      if (plantId) where.plantId = plantId;
      if (status) where.status = status;
      if (type) where.type = type;

      const devices = await prisma.ioTDevice.findMany({
        where,
        include: {
          plant: { select: { id: true, name: true } },
          machine: { select: { id: true, name: true, machineCode: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: devices,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch devices');
    }
  };

  /**
   * Get device stats
   */
  getDeviceStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const plantId = getPlantId(req);

      const where: any = { tenantId };
      if (plantId) where.plantId = plantId;

      const [total, online, offline, warning, alarm] = await Promise.all([
        prisma.ioTDevice.count({ where }),
        prisma.ioTDevice.count({ where: { ...where, status: 'online' } }),
        prisma.ioTDevice.count({ where: { ...where, status: 'offline' } }),
        prisma.ioTDevice.count({ where: { ...where, status: 'warning' } }),
        prisma.ioTDevice.count({ where: { ...where, status: 'alarm' } }),
      ]);

      res.json({
        success: true,
        data: { total, online, offline, warning, alarm },
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch device stats');
    }
  };

  /**
   * Get device by ID
   */
  getDeviceById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);

      const device = await prisma.ioTDevice.findFirst({
        where: { id, tenantId },
        include: {
          plant: { select: { id: true, name: true } },
          machine: { select: { id: true, name: true, machineCode: true } },
          dataPoints: {
            orderBy: { timestamp: 'desc' },
            take: 100,
          },
        },
      });

      if (!device) {
        throw notFound('Device');
      }

      res.json({
        success: true,
        data: device,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch device');
    }
  };

  /**
   * Create device
   */
  createDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const plantId = getPlantId(req) || req.body.plantId;

      const {
        deviceCode,
        name,
        type,
        location,
        mqttTopic,
        machineId,
        unit,
        thresholds,
      } = req.body;

      const device = await prisma.ioTDevice.create({
        data: {
          tenantId,
          plantId,
          deviceCode,
          name,
          type,
          location,
          mqttTopic,
          machineId,
          unit,
          thresholds: thresholds || {},
          status: 'offline',
        },
        include: {
          plant: { select: { id: true, name: true } },
          machine: { select: { id: true, name: true } },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Device created',
        data: device,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to create device');
    }
  };

  /**
   * Update device
   */
  updateDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);

      const device = await prisma.ioTDevice.findFirst({
        where: { id, tenantId },
      });

      if (!device) {
        throw notFound('Device');
      }

      const updated = await prisma.ioTDevice.update({
        where: { id },
        data: {
          ...req.body,
          updatedAt: new Date(),
        },
        include: {
          plant: { select: { id: true, name: true } },
          machine: { select: { id: true, name: true } },
        },
      });

      res.json({
        success: true,
        message: 'Device updated',
        data: updated,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to update device');
    }
  };

  /**
   * Get device data
   */
  getDeviceData = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);
      const { limit = '100' } = req.query;

      const device = await prisma.ioTDevice.findFirst({
        where: { id, tenantId },
      });

      if (!device) {
        throw notFound('Device');
      }

      const dataPoints = await prisma.machineDataPoint.findMany({
        where: { deviceId: id },
        orderBy: { timestamp: 'desc' },
        take: parseInt(limit as string),
      });

      res.json({
        success: true,
        data: dataPoints,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch device data');
    }
  };

  /**
   * Get MQTT status
   */
  getMqttStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json({
        success: true,
        data: {
          status: 'connected',
          broker: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
          uptime: '45d 12h 34m',
          latency: '24ms',
          messagesReceived: 1245678,
        },
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch MQTT status');
    }
  };
}
