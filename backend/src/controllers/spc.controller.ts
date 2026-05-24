import { Request, Response } from 'express';
import { prisma } from '../server';
import { ApiError, badRequest, notFound } from '../middleware/error.middleware';
import { getTenantId } from '../middleware/tenant.middleware';

export class SPCController {
  /**
   * Get all SPC records
   */
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const { chartType, status } = req.query;

      const where: any = { tenantId };
      if (chartType) where.chartType = chartType;
      if (status) where.status = status;

      const records = await prisma.sPCRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: records,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch SPC records');
    }
  };

  /**
   * Get SPC statistics
   */
  getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);

      const [total, active, withViolations] = await Promise.all([
        prisma.sPCRecord.count({ where: { tenantId } }),
        prisma.sPCRecord.count({ where: { tenantId, status: 'active' } }),
        prisma.sPCRuleViolation.count({
          where: {
            spcRecord: { tenantId },
            acknowledgedAt: null,
          },
        }),
      ]);

      res.json({
        success: true,
        data: { total, active, withViolations },
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch SPC stats');
    }
  };

  /**
   * Get SPC record by ID
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);

      const record = await prisma.sPCRecord.findFirst({
        where: { id, tenantId },
        include: {
          dataPoints: {
            orderBy: { sampleDate: 'desc' },
            take: 100,
          },
          ruleViolations: {
            where: { acknowledgedAt: null },
          },
        },
      });

      if (!record) {
        throw notFound('SPC record');
      }

      res.json({
        success: true,
        data: record,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch SPC record');
    }
  };

  /**
   * Create SPC record
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const {
        chartType,
        characteristic,
        partNumber,
        processName,
        sampleSize,
        ucl,
        lcl,
        centerLine,
        usl,
        lsl,
      } = req.body;

      const record = await prisma.sPCRecord.create({
        data: {
          tenantId,
          chartType,
          characteristic,
          partNumber,
          processName,
          sampleSize,
          ucl,
          lcl,
          centerLine,
          usl,
          lsl,
          sampleFrequency: req.body.sampleFrequency || 'daily',
          status: 'active',
        },
      });

      res.status(201).json({
        success: true,
        message: 'SPC record created',
        data: record,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to create SPC record');
    }
  };

  /**
   * Add data point
   */
  addDataPoint = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);
      const { sampleNumber, sampleDate, value, values, notes } = req.body;

      const record = await prisma.sPCRecord.findFirst({
        where: { id, tenantId },
      });

      if (!record) {
        throw notFound('SPC record');
      }

      // Check if out of control
      const isOutOfControl = value > record.ucl || value < record.lcl;

      const dataPoint = await prisma.sPCDataPoint.create({
        data: {
          spcRecordId: id,
          sampleNumber,
          sampleDate: new Date(sampleDate),
          value,
          values: values || [],
          isOutOfControl,
          notes,
        },
      });

      // Recalculate Cp and Cpk
      await this.recalculateCapability(id);

      res.status(201).json({
        success: true,
        message: 'Data point added',
        data: dataPoint,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to add data point');
    }
  };

  /**
   * Get data points
   */
  getDataPoints = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);
      const { limit = '100' } = req.query;

      const record = await prisma.sPCRecord.findFirst({
        where: { id, tenantId },
      });

      if (!record) {
        throw notFound('SPC record');
      }

      const dataPoints = await prisma.sPCDataPoint.findMany({
        where: { spcRecordId: id },
        orderBy: { sampleDate: 'desc' },
        take: parseInt(limit as string),
      });

      res.json({
        success: true,
        data: dataPoints,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch data points');
    }
  };

  /**
   * Get rule violations
   */
  getViolations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = getTenantId(req);

      const record = await prisma.sPCRecord.findFirst({
        where: { id, tenantId },
      });

      if (!record) {
        throw notFound('SPC record');
      }

      const violations = await prisma.sPCRuleViolation.findMany({
        where: { spcRecordId: id },
        orderBy: { detectedAt: 'desc' },
      });

      res.json({
        success: true,
        data: violations,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch violations');
    }
  };

  /**
   * Recalculate capability indices
   */
  private recalculateCapability = async (spcRecordId: string): Promise<void> => {
    const dataPoints = await prisma.sPCDataPoint.findMany({
      where: { spcRecordId },
    });

    if (dataPoints.length < 2) return;

    const values = dataPoints.map(dp => dp.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;

    // Calculate standard deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
    const stdDev = Math.sqrt(variance);

    const record = await prisma.sPCRecord.findUnique({
      where: { id: spcRecordId },
    });

    if (!record || !record.usl || !record.lsl) return;

    // Calculate Cp
    const cp = (record.usl - record.lsl) / (6 * stdDev);

    // Calculate Cpk
    const cpu = (record.usl - mean) / (3 * stdDev);
    const cpl = (mean - record.lsl) / (3 * stdDev);
    const cpk = Math.min(cpu, cpl);

    await prisma.sPCRecord.update({
      where: { id: spcRecordId },
      data: { cp, cpk },
    });
  };
}
