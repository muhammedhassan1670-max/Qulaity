import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';

const router = Router();
const dashboardController = new DashboardController();

// Dashboard data
router.get('/kpi', dashboardController.getKPIs);
router.get('/quality-trend', dashboardController.getQualityTrend);
router.get('/plant-performance', dashboardController.getPlantPerformance);
router.get('/recent-activities', dashboardController.getRecentActivities);
router.get('/alerts', dashboardController.getAlerts);
router.get('/defect-distribution', dashboardController.getDefectDistribution);

export default router;
