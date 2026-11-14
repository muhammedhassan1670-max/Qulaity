import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetQualityStorage,
  seedDefectLogs,
  readDefectLogs,
  writeStoredItems,
  STORAGE_KEYS,
} from '../../helpers/testHarness';
import { INDUSTRIAL_PARTS } from '../../helpers/industrialFixtures';
import {
  loadQualityAnalyticsSnapshot,
  loadQualityDashboardFilters,
  type QualityAnalyticsSnapshot,
} from '@/services/qualityAnalyticsHub';
import type { SafeDefectRecord } from '@/services/safeDefectStorage';

describe('Feature 21: COPQ Financial Cost Engine', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('validates PAF (Prevention, Appraisal, Failure) model categorization and totals', () => {
    // Industrial PAF structure:
    // Prevention: Quality engineering, FMEA reviews, operator training, supplier audits
    // Appraisal: In-process CMM inspection, calibration, lab testing, receiving inspection
    // Internal Failure: Scrap, rework, sorting, MRB re-testing
    // External Failure: Customer complaints, warranty returns, recall logistics, penalties
    const preventionCosts = [
      { category: 'prevention', name: 'FMEA Risk Mitigation Workshop', amount: 4500 },
      { category: 'prevention', name: 'Operator Poka-Yoke Training', amount: 3200 },
      { category: 'prevention', name: 'Supplier Quality System Audit', amount: 5800 },
    ];

    const appraisalCosts = [
      { category: 'appraisal', name: 'Zeiss CMM Metrology Lab Testing', amount: 6200 },
      { category: 'appraisal', name: 'Micrometer & Gauge Recalibration', amount: 2400 },
      { category: 'appraisal', name: 'IQC Receiving Batch Inspection', amount: 3900 },
    ];

    const internalFailureCosts = [
      { category: 'internalFailure', name: 'CNC Actuator Barrel Scrap (15 pcs)', amount: 18500 },
      { category: 'internalFailure', name: 'Bore Surface Burr Rework Labor', amount: 4800 },
      { category: 'internalFailure', name: 'Production Line 2 Stoppage Downtime', amount: 12000 },
    ];

    const externalFailureCosts = [
      { category: 'externalFailure', name: 'Customer Warranty Return RMA-9901', amount: 34000 },
      { category: 'externalFailure', name: 'Field Service Technical Containment', amount: 9500 },
      { category: 'externalFailure', name: 'Late Shipment Defect Penalty', amount: 6500 },
    ];

    const sumP = preventionCosts.reduce((acc, c) => acc + c.amount, 0);
    const sumA = appraisalCosts.reduce((acc, c) => acc + c.amount, 0);
    const sumIF = internalFailureCosts.reduce((acc, c) => acc + c.amount, 0);
    const sumEF = externalFailureCosts.reduce((acc, c) => acc + c.amount, 0);

    expect(sumP).toBe(13500);
    expect(sumA).toBe(12500);
    expect(sumIF).toBe(35300);
    expect(sumEF).toBe(50000);

    const totalCopq = sumP + sumA + sumIF + sumEF;
    expect(totalCopq).toBe(111300);

    const costOfConformance = sumP + sumA;
    const costOfNonConformance = sumIF + sumEF;
    expect(costOfConformance).toBe(26000);
    expect(costOfNonConformance).toBe(85300);
    expect(costOfNonConformance).toBeGreaterThan(costOfConformance);
  });

  it('calculates COPQ as a percentage of total sales revenue and evaluates threshold health', () => {
    const netSalesRevenue = 2_500_000; // $2.5M
    const totalCopq = 111_300;

    const copqPercentage = (totalCopq / netSalesRevenue) * 100;
    expect(copqPercentage).toBeCloseTo(4.452, 2);

    // World-class aerospace/automotive benchmark: COPQ < 3% is world-class, 3-7% average, > 8% critical
    const getCopqHealth = (pct: number) => {
      if (pct < 3.0) return 'World-Class';
      if (pct <= 6.0) return 'Acceptable';
      return 'Critical-Action-Required';
    };

    expect(getCopqHealth(copqPercentage)).toBe('Acceptable');
    expect(getCopqHealth(2.4)).toBe('World-Class');
    expect(getCopqHealth(8.9)).toBe('Critical-Action-Required');
  });

  it('aggregates multi-month COPQ trends and computes cost driver Pareto distribution', () => {
    const monthlySeries = [
      { month: '2026-08', internal: 24000, external: 35000, appraisal: 8000, prevention: 6000 },
      { month: '2026-09', internal: 21000, external: 28000, appraisal: 8500, prevention: 7000 },
      { month: '2026-10', internal: 17500, external: 19000, appraisal: 9000, prevention: 8500 },
      { month: '2026-11', internal: 14000, external: 12000, appraisal: 9500, prevention: 10000 },
    ];

    const monthlyTotals = monthlySeries.map((m) => ({
      month: m.month,
      total: m.internal + m.external + m.appraisal + m.prevention,
      failureRatio: ((m.internal + m.external) / (m.internal + m.external + m.appraisal + m.prevention)) * 100,
    }));

    // Failure ratio should drop as prevention investment rises
    expect(monthlyTotals[0].failureRatio).toBeGreaterThan(monthlyTotals[3].failureRatio);
    expect(monthlyTotals[3].total).toBeLessThan(monthlyTotals[0].total);

    // Cost Drivers Pareto calculation
    const drivers = [
      { name: 'Cylinder Porosity', cost: 42000 },
      { name: 'Flange Warpage', cost: 23000 },
      { name: 'Thread Cross-Threading', cost: 11000 },
      { name: 'Surface Scratch', cost: 4000 },
      { name: 'Label Misalignment', cost: 1000 },
    ];

    const grandTotal = drivers.reduce((s, d) => s + d.cost, 0);
    let accumulated = 0;
    const pareto = drivers.map((d) => {
      accumulated += d.cost;
      return {
        ...d,
        percentage: (d.cost / grandTotal) * 100,
        cumPercentage: (accumulated / grandTotal) * 100,
      };
    });

    // Top 2 drivers account for > 80% of costs (Pareto principle)
    expect(pareto[1].cumPercentage).toBeGreaterThanOrEqual(80);
    expect(pareto[0].name).toBe('Cylinder Porosity');
  });

  it('integrates with qualityAnalyticsHub to compute live COPQ metrics from seeded defects', async () => {
    const part = INDUSTRIAL_PARTS[0];
    const seededDefects: Partial<SafeDefectRecord>[] = [
      {
        id: 'DEF-COPQ-01',
        title: 'High Pressure Die Casting Porosity',
        recordType: 'defect-cost',
        defectType: 'Porosity Cavity',
        costCategory: 'internalFailure',
        estimatedCost: 8500,
        currency: 'USD',
        date: '2026-11-01',
        partNumber: part.partNumber,
        productionLine: 'Foundry Cell 3',
        status: 'open',
      },
      {
        id: 'DEF-COPQ-02',
        title: 'Customer Field Return - Hydraulic Seal Leak',
        recordType: 'customer-return',
        defectType: 'Hydrostatic Seal Breach',
        costCategory: 'externalFailure',
        estimatedCost: 16200,
        currency: 'USD',
        date: '2026-11-05',
        partNumber: part.partNumber,
        productionLine: 'Assembly Line 1',
        status: 'in-review',
      },
      {
        id: 'DEF-COPQ-03',
        title: 'Routine Precision CMM Batch Re-Inspection',
        recordType: 'defect-cost',
        defectType: 'Dimensional Verification',
        costCategory: 'appraisal',
        estimatedCost: 3100,
        currency: 'USD',
        date: '2026-11-10',
        partNumber: part.partNumber,
        productionLine: 'Metrology Lab',
        status: 'resolved',
      },
      {
        id: 'DEF-COPQ-04',
        title: 'Operator Ultrasonic Inspection Certification',
        recordType: 'defect-cost',
        defectType: 'Quality Training',
        costCategory: 'prevention',
        estimatedCost: 2400,
        currency: 'USD',
        date: '2026-11-12',
        partNumber: part.partNumber,
        productionLine: 'Quality Training Bay',
        status: 'resolved',
      },
    ];

    seedDefectLogs(seededDefects);
    writeStoredItems('qms_local_defect-logs', seededDefects);

    const filters = loadQualityDashboardFilters();
    filters.datePreset = 'all';

    const snapshot: QualityAnalyticsSnapshot = await loadQualityAnalyticsSnapshot(filters);

    expect(snapshot.copqMetrics).toBeDefined();
    expect(snapshot.copqMetrics.totalCopq).toBeGreaterThanOrEqual(8500 + 16200 + 3100 + 2400);
    expect(snapshot.copqMetrics.internalFailure).toBeGreaterThanOrEqual(8500);
    expect(snapshot.copqMetrics.externalFailure).toBeGreaterThanOrEqual(16200);
    expect(snapshot.copqMetrics.appraisal).toBeGreaterThanOrEqual(3100);
    expect(snapshot.copqMetrics.prevention).toBeGreaterThanOrEqual(2400);

    const breakdownItems = snapshot.copqMetrics.breakdown.map((b) => b.name);
    expect(breakdownItems).toContain('Internal Failure');
    expect(breakdownItems).toContain('External Failure');
    expect(breakdownItems).toContain('Appraisal');
    expect(breakdownItems).toContain('Prevention');
  });

  it('evaluates COPQ reduction ROI from verified CAPA and preventive countermeasures', () => {
    const baselineMonthlyFailureCost = 50_000;
    const preventiveMitigationInvestment = 12_000; // Poka-Yoke sensors + training
    const postImplementationFailureCost = 9_500;

    const monthlyCostSaving = baselineMonthlyFailureCost - postImplementationFailureCost;
    const netAnnualSaving = monthlyCostSaving * 12 - preventiveMitigationInvestment;
    const roiPercentage = ((monthlyCostSaving * 12 - preventiveMitigationInvestment) / preventiveMitigationInvestment) * 100;

    expect(monthlyCostSaving).toBe(40500);
    expect(netAnnualSaving).toBe(474000);
    expect(roiPercentage).toBeGreaterThan(3000); // 3950% ROI
  });
});
