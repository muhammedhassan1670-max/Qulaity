import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getKPIs() {
    const [openNCRs, activeCAPAs, totalAudits] = await Promise.all([
      this.prisma.ncrReport.count({ where: { status: { not: 'closed' } } }),
      this.prisma.capaAction.count({ where: { status: { not: 'closed' } } }),
      this.prisma.audit.count(),
    ]);

    return {
      success: true,
      data: {
        openNCRs,
        activeCAPAs,
        oee: 84.5,
        qualityScore: 92.8,
        ncrChange: -12,
        capaChange: 8,
        oeeChange: 3.2,
        qualityChange: 1.5,
        totalAudits,
      },
    };
  }

  async getQualityTrend() {
    const data = [
      { name: 'Jan', ncr: 12, capa: 8, closed: 15 },
      { name: 'Feb', ncr: 15, capa: 10, closed: 18 },
      { name: 'Mar', ncr: 10, capa: 12, closed: 20 },
      { name: 'Apr', ncr: 18, capa: 15, closed: 22 },
      { name: 'May', ncr: 14, capa: 11, closed: 19 },
      { name: 'Jun', ncr: 11, capa: 9, closed: 16 },
      { name: 'Jul', ncr: 16, capa: 13, closed: 21 },
    ];
    return { success: true, data };
  }

  async getDefectDistribution() {
    const data = [
      { name: 'Dimensional', value: 35, color: '#0066CC' },
      { name: 'Surface', value: 25, color: '#00A3E0' },
      { name: 'Material', value: 20, color: '#FF6B35' },
      { name: 'Assembly', value: 15, color: '#00C853' },
      { name: 'Other', value: 5, color: '#9E9E9E' },
    ];
    return { success: true, data };
  }

  async getPlantPerformance() {
    const data = [
      { name: 'Plant A', oee: 85, quality: 92, availability: 88 },
      { name: 'Plant B', oee: 78, quality: 89, availability: 82 },
      { name: 'Plant C', oee: 82, quality: 94, availability: 85 },
      { name: 'Plant D', oee: 75, quality: 87, availability: 80 },
    ];
    return { success: true, data };
  }

  async getRecentActivities() {
    const data = [
      { id: 1, type: 'NCR', code: 'NCR-2024-0018', description: 'Dimensional deviation in Line 3', status: 'Open', time: '10 min ago', priority: 'High' },
      { id: 2, type: 'CAPA', code: 'CAPA-2024-0045', description: 'Root cause analysis completed', status: 'Pending', time: '25 min ago', priority: 'Medium' },
      { id: 3, type: '8D', code: '8D-2024-0012', description: 'Customer complaint resolution', status: 'Closed', time: '1 hour ago', priority: 'High' },
      { id: 4, type: 'Audit', code: 'AUD-2024-0089', description: 'Internal audit scheduled', status: 'Scheduled', time: '2 hours ago', priority: 'Low' },
      { id: 5, type: 'Inspection', code: 'INSP-2024-0234', description: 'Incoming material inspection', status: 'In Progress', time: '3 hours ago', priority: 'Medium' },
    ];
    return { success: true, data };
  }

  async getAlerts() {
    const data = [
      { id: 1, severity: 'critical', message: 'SPC Alert: Process Line 3 out of control', time: '5 min ago' },
      { id: 2, severity: 'warning', message: 'Calibration due for Equipment #45', time: '15 min ago' },
      { id: 3, severity: 'info', message: 'New supplier evaluation completed', time: '30 min ago' },
      { id: 4, severity: 'warning', message: 'Training certification expiring soon', time: '1 hour ago' },
    ];
    return { success: true, data };
  }

  async getSummary() {
    const [kpi, qualityTrend, defectDistribution, plantPerformance, recentActivity, alerts] = await Promise.all([
      this.getKPIs(),
      this.getQualityTrend(),
      this.getDefectDistribution(),
      this.getPlantPerformance(),
      this.getRecentActivities(),
      this.getAlerts(),
    ]);

    return {
      success: true,
      data: {
        kpi: kpi.data,
        ncrTrend: qualityTrend.data,
        spcDefects: defectDistribution.data,
        auditScores: plantPerformance.data,
        approvalBottlenecks: recentActivity.data,
        alerts: alerts.data,
      },
    };
  }

  async getCopqStats() {
    // COPQ = Cost of Poor Quality (placeholder values until a dedicated cost ledger exists)
    const data = {
      total: 125000,
      internalFailure: 52000,
      externalFailure: 33000,
      appraisal: 21000,
      prevention: 19000,
      currency: 'USD',
    };

    return { success: true, data };
  }

  async getComplaintsStats() {
    // If complaint entity exists in prisma, you can replace this with real aggregation.
    const data = {
      total: 42,
      open: 11,
      closed: 31,
      avgResolutionDays: 6.4,
      trend: -5,
    };

    return { success: true, data };
  }

  async getPpmStats() {
    // PPM = defects per million. We currently expose KPI card values used by ProcessPPMPage.
    const data = {
      kpis: {
        currentPpm: 1850,
        targetPpm: 1200,
        bestLinePpm: 980,
        worstLinePpm: 2650,
        ppmTrend: -7,
      },
    };

    return { success: true, data };
  }

  async getOutgoingQualityStats() {
    const data = {
      shipments: 128,
      rejects: 3,
      rejectRate: 2.3,
      topCustomer: 'Customer A',
      trend: 1,
    };

    return { success: true, data };
  }
}
