import { describe, it, expect } from 'vitest';

describe('Feature 27: Executive Mode KPI Briefing Engine', () => {
  it('computes First Pass Yield (FPY) across multi-stage production lines', () => {
    // Overall FPY = FPY(Stage 1) * FPY(Stage 2) * FPY(Stage 3) * FPY(Stage 4)
    // Individual Stage FPY = Passed without Rework / Total Units Processed
    const stageData = [
      { stage: 'IQC Receiving', total: 10000, passedClean: 9940 },
      { stage: 'CNC Machining', total: 9940, passedClean: 9810 },
      { stage: 'Assembly & Torque', total: 9810, passedClean: 9750 },
      { stage: 'Final OQC Test', total: 9750, passedClean: 9720 },
    ];

    const yields = stageData.map((s) => s.passedClean / s.total);
    const rolledThroughputYield = yields.reduce((acc, y) => acc * y, 1.0);

    expect(yields[0]).toBeCloseTo(0.994, 3);
    expect(yields[1]).toBeCloseTo(0.9869, 3);
    expect(rolledThroughputYield * 100).toBeCloseTo(97.2, 1);

    // Executive target: RTY >= 95.0%
    const isExecutiveFpyTargetMet = rolledThroughputYield >= 0.95;
    expect(isExecutiveFpyTargetMet).toBe(true);
  });

  it('calculates Mean Time To Repair (MTTR) and Mean Time Between Failures (MTBF)', () => {
    // Total Operating Time: 720 hours (1 month continuous)
    // Number of Machine Breakdowns: 6 events
    // Downtime per breakdown: [1.5, 2.0, 0.75, 3.25, 1.0, 1.5] hours
    const downtimeHours = [1.5, 2.0, 0.75, 3.25, 1.0, 1.5];
    const totalDowntimeHours = downtimeHours.reduce((sum, h) => sum + h, 0); // 10.0 hours
    const totalOperatingHours = 720;
    const failureCount = downtimeHours.length;

    const mttr = totalDowntimeHours / failureCount; // hours to repair
    const uptimeHours = totalOperatingHours - totalDowntimeHours; // 710 hours
    const mtbf = uptimeHours / failureCount; // hours between failures

    expect(totalDowntimeHours).toBe(10.0);
    expect(mttr).toBeCloseTo(1.67, 2); // 1.67 hours MTTR
    expect(mtbf).toBeCloseTo(118.33, 2); // 118.33 hours MTBF

    // Availability = MTBF / (MTBF + MTTR)
    const operationalAvailability = (mtbf / (mtbf + mttr)) * 100;
    expect(operationalAvailability).toBeCloseTo(98.61, 2);
  });

  it('evaluates scrap rate percentage against industrial tolerance thresholds', () => {
    interface ProductionRunScrap {
      runId: string;
      productName: string;
      totalUnitsProduced: number;
      scrapUnits: number;
      reworkUnits: number;
    }

    const runs: ProductionRunScrap[] = [
      { runId: 'RUN-01', productName: 'Actuator Barrel', totalUnitsProduced: 5000, scrapUnits: 45, reworkUnits: 80 },
      { runId: 'RUN-02', productName: 'Turbine Rotor Blade', totalUnitsProduced: 2400, scrapUnits: 12, reworkUnits: 25 },
      { runId: 'RUN-03', productName: 'Door Outer Skin', totalUnitsProduced: 8000, scrapUnits: 195, reworkUnits: 110 },
    ];

    const scrapRates = runs.map((r) => ({
      runId: r.runId,
      scrapPercentage: (r.scrapUnits / r.totalUnitsProduced) * 100,
      reworkPercentage: (r.reworkUnits / r.totalUnitsProduced) * 100,
    }));

    expect(scrapRates[0].scrapPercentage).toBeCloseTo(0.9, 2); // 0.9%
    expect(scrapRates[1].scrapPercentage).toBeCloseTo(0.5, 2); // 0.5%
    expect(scrapRates[2].scrapPercentage).toBeCloseTo(2.44, 2); // 2.44%

    // Executive Scrap Threshold: Alert if scrap exceeds 2.0%
    const scrapAlertRuns = scrapRates.filter((r) => r.scrapPercentage > 2.0);
    expect(scrapAlertRuns.length).toBe(1);
    expect(scrapAlertRuns[0].runId).toBe('RUN-03');
  });

  it('compares multi-plant performance benchmarks across OEE, FPY, and Quality Score', () => {
    interface PlantBenchmark {
      plantId: string;
      plantName: string;
      oeePercentage: number;
      fpyPercentage: number;
      safetyIncidents: number;
      copqSalesRatio: number;
      overallQualityScore: number;
    }

    const plants: PlantBenchmark[] = [
      { plantId: 'PLANT-STUTTGART', plantName: 'Stuttgart Advanced Aero Hub', oeePercentage: 88.4, fpyPercentage: 99.1, safetyIncidents: 0, copqSalesRatio: 1.8, overallQualityScore: 96.5 },
      { plantId: 'PLANT-DETROIT', plantName: 'Detroit Automotive Stamping', oeePercentage: 81.2, fpyPercentage: 96.8, safetyIncidents: 1, copqSalesRatio: 3.4, overallQualityScore: 88.0 },
      { plantId: 'PLANT-CAIRO', plantName: 'Cairo Precision Foundry', oeePercentage: 79.5, fpyPercentage: 95.2, safetyIncidents: 0, copqSalesRatio: 4.1, overallQualityScore: 84.5 },
    ];

    const rankedByQuality = [...plants].sort((a, b) => b.overallQualityScore - a.overallQualityScore);
    expect(rankedByQuality[0].plantId).toBe('PLANT-STUTTGART');
    expect(rankedByQuality[0].copqSalesRatio).toBeLessThan(2.0);

    const averagePlantOee = plants.reduce((sum, p) => sum + p.oeePercentage, 0) / plants.length;
    expect(averagePlantOee).toBeCloseTo(83.03, 2);
  });

  it('triggers executive threshold alerts for critical quality exceptions', () => {
    interface ExecutiveAlertRule {
      id: string;
      kpi: string;
      condition: 'below' | 'above';
      threshold: number;
      severity: 'critical' | 'high' | 'warning';
      action: string;
    }

    const executiveRules: ExecutiveAlertRule[] = [
      { id: 'R-FPY', kpi: 'FPY', condition: 'below', threshold: 96.0, severity: 'critical', action: 'Notify VP of Operations & Stop Line' },
      { id: 'R-SCRAP', kpi: 'ScrapRate', condition: 'above', threshold: 2.0, severity: 'high', action: 'Trigger Emergency MRB Review' },
      { id: 'R-COPQ', kpi: 'CopqPercentage', condition: 'above', threshold: 5.0, severity: 'high', action: 'Schedule Executive Review' },
      { id: 'R-ESCAPES', kpi: 'CustomerEscapes', condition: 'above', threshold: 0, severity: 'critical', action: 'Issue Global Containment Hold' },
    ];

    const currentShiftTelemetry = {
      FPY: 94.8, // Violated (below 96.0)
      ScrapRate: 2.3, // Violated (above 2.0)
      CopqPercentage: 3.8, // Normal (below 5.0)
      CustomerEscapes: 0, // Normal
    };

    const triggeredAlerts = executiveRules.filter((rule) => {
      const val = (currentShiftTelemetry as any)[rule.kpi];
      if (rule.condition === 'below') return val < rule.threshold;
      if (rule.condition === 'above') return val > rule.threshold;
      return false;
    });

    expect(triggeredAlerts.length).toBe(2);
    const alertKpis = triggeredAlerts.map((a) => a.kpi);
    expect(alertKpis).toContain('FPY');
    expect(alertKpis).toContain('ScrapRate');
    expect(triggeredAlerts[0].severity).toBe('critical');
  });
});
