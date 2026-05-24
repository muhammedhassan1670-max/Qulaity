import { Request, Response } from 'express';
import { prisma } from '../server';
import { ApiError, badRequest } from '../middleware/error.middleware';
import { getTenantId, getPlantId } from '../middleware/tenant.middleware';
import type { IoTDevice } from '@prisma/client';

export class DashboardController {
  /**
   * Get KPI data
   */
  getKPIs = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const plantId = getPlantId(req);

      const where: any = {
        tenantId,
        deletedAt: null,
      };

      if (plantId) {
        where.plantId = plantId;
      }

      // Get NCR stats
      const [
        openNCRs,
        closedNCRsThisMonth,
        activeCAPAs,
        totalMachines,
        onlineMachines,
      ] = await Promise.all([
        prisma.nCR.count({
          where: { ...where, status: { in: ['open', 'in_review', 'pending_capa'] } },
        }),
        prisma.nCR.count({
          where: {
            ...where,
            status: 'closed',
            closedAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
        prisma.cAPA.count({
          where: {
            tenantId,
            status: { in: ['open', 'in_progress'] },
          },
        }),
        prisma.machine.count({
          where: plantId ? { plantId } : { plant: { tenantId } },
        }),
        prisma.ioTDevice.count({
          where: {
            tenantId,
            status: 'online',
            ...(plantId && { plantId }),
          },
        }),
      ]);

      // Calculate OEE (simplified)
      const oee = 84.5; // This would be calculated from real machine data

      // Calculate quality score
      const totalNCRs = await prisma.nCR.count({ where });
      const qualityScore = totalNCRs > 0
        ? Math.round((closedNCRsThisMonth / (totalNCRs + closedNCRsThisMonth)) * 100)
        : 95;

      res.json({
        success: true,
        data: {
          openNCRs,
          activeCAPAs,
          oee,
          qualityScore,
          totalMachines,
          onlineMachines,
          closedNCRsThisMonth,
        },
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch KPIs');
    }
  };

  /**
   * Get quality trend data
   */
  getQualityTrend = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const plantId = getPlantId(req);
      const months = parseInt(req.query.months as string) || 6;

      const data = [];
      const now = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        const where: any = {
          tenantId,
          createdAt: {
            gte: month,
            lt: nextMonth,
          },
          deletedAt: null,
        };

        if (plantId) {
          where.plantId = plantId;
        }

        const [ncrCount, capaCount, closedCount] = await Promise.all([
          prisma.nCR.count({ where }),
          prisma.cAPA.count({
            where: {
              tenantId,
              createdAt: {
                gte: month,
                lt: nextMonth,
              },
            },
          }),
          prisma.nCR.count({
            where: {
              ...where,
              status: 'closed',
              closedAt: {
                gte: month,
                lt: nextMonth,
              },
            },
          }),
        ]);

        data.push({
          name: month.toLocaleString('default', { month: 'short' }),
          ncr: ncrCount,
          capa: capaCount,
          closed: closedCount,
        });
      }

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch quality trend');
    }
  };

  /**
   * Get plant performance data
   */
  getPlantPerformance = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);

      const plants = await prisma.plant.findMany({
        where: { tenantId, status: 'active' },
        include: {
          machines: {
            include: {
              dataPoints: {
                orderBy: { timestamp: 'desc' },
                take: 100,
              },
            },
          },
        },
      });

      const data = plants.map(plant => {
        // Calculate metrics from machine data
        const totalOEE = plant.machines.reduce((sum, m) => {
          const latestData = m.dataPoints[0];
          return sum + (latestData?.value || 80);
        }, 0);

        const avgOEE = plant.machines.length > 0
          ? Math.round(totalOEE / plant.machines.length)
          : 80;

        return {
          name: plant.name,
          oee: avgOEE,
          quality: Math.round(85 + Math.random() * 10),
          availability: Math.round(80 + Math.random() * 15),
        };
      });

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch plant performance');
    }
  };

  /**
   * Get recent activities
   */
  getRecentActivities = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const limit = parseInt(req.query.limit as string) || 10;

      // Get recent NCRs
      const recentNCRs = await prisma.nCR.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          reportedBy: {
            select: { firstName: true, lastName: true },
          },
          plant: {
            select: { name: true },
          },
        },
      });

      // Get recent CAPAs
      const recentCAPAs = await prisma.cAPA.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          createdBy: {
            select: { firstName: true, lastName: true },
          },
        },
      });

      // Combine and format activities
      const activities = [
        ...recentNCRs.map(ncr => ({
          id: ncr.id,
          type: 'NCR',
          code: ncr.ncrNumber,
          description: ncr.title,
          status: ncr.status,
          time: ncr.createdAt,
          priority: ncr.severity,
        })),
        ...recentCAPAs.map(capa => ({
          id: capa.id,
          type: 'CAPA',
          code: capa.capaNumber,
          description: capa.title,
          status: capa.status,
          time: capa.createdAt,
          priority: capa.priority,
        })),
      ]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, limit);

      res.json({
        success: true,
        data: activities,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch recent activities');
    }
  };

  /**
   * Get alerts
   */
  getAlerts = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const plantId = getPlantId(req);

      const alerts: Array<{
        id: string;
        severity: 'critical' | 'warning' | 'info';
        message: string;
        time: Date;
        entityType: string;
        entityId: string;
      }> = [];

      // Check for critical NCRs
      const criticalNCRs = await prisma.nCR.findMany({
        where: {
          tenantId,
          severity: 'critical',
          status: { in: ['open', 'in_review'] },
          ...(plantId && { plantId }),
        },
        take: 5,
      });

      criticalNCRs.forEach(ncr => {
        alerts.push({
          id: `ncr-${ncr.id}`,
          severity: 'critical',
          message: `Critical NCR: ${ncr.title}`,
          time: ncr.createdAt,
          entityType: 'ncr',
          entityId: ncr.id,
        });
      });

      // Check for overdue CAPAs
      const overdueCAPAs = await prisma.cAPA.findMany({
        where: {
          tenantId,
          dueDate: { lt: new Date() },
          status: { in: ['open', 'in_progress'] },
        },
        take: 5,
      });

      overdueCAPAs.forEach(capa => {
        alerts.push({
          id: `capa-${capa.id}`,
          severity: 'warning',
          message: `Overdue CAPA: ${capa.title}`,
          time: capa.dueDate!,
          entityType: 'capa',
          entityId: capa.id,
        });
      });

      // Check for offline IoT devices
      const offlineDevices: IoTDevice[] = await prisma.ioTDevice.findMany({
        where: {
          tenantId,
          status: 'offline',
          ...(plantId && { plantId }),
        },
        take: 5,
      });

      offlineDevices.forEach((device) => {
        alerts.push({
          id: `device-${device.id}`,
          severity: 'warning',
          message: `Device offline: ${device.name}`,
          time: device.lastReadingAt || device.createdAt,
          entityType: 'iot_device',
          entityId: device.id,
        });
      });

      res.json({
        success: true,
        data: alerts.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()),
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch alerts');
    }
  };

  /**
   * Get defect distribution
   */
  getDefectDistribution = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = getTenantId(req);
      const plantId = getPlantId(req);

      const where: any = {
        tenantId,
        deletedAt: null,
      };

      if (plantId) {
        where.plantId = plantId;
      }

      // Group NCRs by category
      const ncrsByCategory = await prisma.nCR.groupBy({
        by: ['category'],
        where,
        _count: { id: true },
      });

      const categories: Record<string, string> = {
        dimensional: 'Dimensional',
        surface: 'Surface',
        material: 'Material',
        assembly: 'Assembly',
        other: 'Other',
      };

      const colors: Record<string, string> = {
        dimensional: '#0066CC',
        surface: '#00A3E0',
        material: '#FF6B35',
        assembly: '#00C853',
        other: '#9E9E9E',
      };

      const total = ncrsByCategory.reduce((sum, item) => sum + item._count.id, 0);

      const data = ncrsByCategory.map(item => ({
        name: categories[item.category] || item.category,
        value: total > 0 ? Math.round((item._count.id / total) * 100) : 0,
        count: item._count.id,
        color: colors[item.category] || '#9E9E9E',
      }));

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw badRequest('Failed to fetch defect distribution');
    }
  };
}
