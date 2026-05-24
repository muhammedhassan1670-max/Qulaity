import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpi')
  async getKPIs() {
    return this.dashboardService.getKPIs();
  }

  @Get('quality-trend')
  async getQualityTrend() {
    return this.dashboardService.getQualityTrend();
  }

  @Get('defect-distribution')
  async getDefectDistribution() {
    return this.dashboardService.getDefectDistribution();
  }

  @Get('plant-performance')
  async getPlantPerformance() {
    return this.dashboardService.getPlantPerformance();
  }

  @Get('recent-activities')
  async getRecentActivities() {
    return this.dashboardService.getRecentActivities();
  }

  @Get('alerts')
  async getAlerts() {
    return this.dashboardService.getAlerts();
  }

  @Get('summary')
  async getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('copq')
  async getCopqStats() {
    return this.dashboardService.getCopqStats();
  }

  @Get('complaints')
  async getComplaintsStats() {
    return this.dashboardService.getComplaintsStats();
  }

  @Get('ppm')
  async getPpmStats() {
    return this.dashboardService.getPpmStats();
  }

  @Get('outgoing-quality')
  async getOutgoingQualityStats() {
    return this.dashboardService.getOutgoingQualityStats();
  }
}
