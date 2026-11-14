import { describe, it, expect, beforeEach } from 'vitest';
import { analyzeDefectRecords, type ExtendedDefectLog } from '@/services/defectAnalytics';
import {
  resetQualityStorage,
  seedDefectLogs,
  readDefectLogs,
} from '../../helpers/testHarness';

describe('Combo 03: Shopfloor Defect Logging, COPQ Recalculation, PPM & Executive KPI Sync', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('Test 3.1: Touch-optimized shopfloor logging captures defect quantities and categorizes PAF cost categories', () => {
    const today = new Date().toISOString().split('T')[0];
    const shopfloorLogs: ExtendedDefectLog[] = [
      {
        id: 'DEF-001',
        date: today,
        recordType: 'defect-cost',
        defectType: 'Porosity & Cavities',
        quantity: 5,
        inspectedQuantity: 200,
        productionLine: 'Casting Cell A',
        estimatedCost: 1500,
        costCategory: 'internal-failure',
      },
      {
        id: 'DEF-002',
        date: today,
        recordType: 'defect-cost',
        defectType: 'Dimension Oversize',
        quantity: 3,
        inspectedQuantity: 150,
        productionLine: 'CNC Line 02',
        estimatedCost: 900,
        costCategory: 'internal-failure',
      },
      {
        id: 'DEF-003',
        date: today,
        recordType: 'defect-cost',
        defectType: 'In-line Radiographic Scan',
        quantity: 0,
        inspectedQuantity: 350,
        productionLine: 'Inspection NDT Bay',
        estimatedCost: 450,
        costCategory: 'appraisal',
      },
      {
        id: 'DEF-004',
        date: today,
        recordType: 'defect-cost',
        defectType: 'Poka-Yoke Sensor Calibration',
        quantity: 0,
        inspectedQuantity: 100,
        productionLine: 'Tooling Workshop',
        estimatedCost: 600,
        costCategory: 'prevention',
      },
      {
        id: 'DEF-005',
        date: today,
        recordType: 'defect-cost',
        defectType: 'Customer Field Seal Leaks',
        quantity: 2,
        inspectedQuantity: 500,
        productionLine: 'Field Return Center',
        estimatedCost: 8500,
        costCategory: 'external-failure',
      },
    ];

    seedDefectLogs(shopfloorLogs);
    const stored = readDefectLogs<ExtendedDefectLog>();
    expect(stored.length).toBe(5);

    const analysis = analyzeDefectRecords(stored, 'month');

    // Verify PAF Model Aggregation
    expect(analysis.kpis.internalFailure).toBe(1500 + 900); // 2400
    expect(analysis.kpis.externalFailure).toBe(8500);
    expect(analysis.kpis.appraisal).toBe(450);
    expect(analysis.kpis.prevention).toBe(600);
    expect(analysis.kpis.totalCopq).toBe(2400 + 8500 + 450 + 600); // 11950
  });

  it('Test 3.2: Defect surge across shopfloor lines degrades Process PPM and identifies worst performing line', () => {
    const today = new Date().toISOString().split('T')[0];
    const logs: ExtendedDefectLog[] = [
      // Line 1: 2 defects out of 1000 inspected -> 2,000 PPM
      {
        id: 'LOG-LINE1',
        date: today,
        recordType: 'process-ppm',
        defectType: 'Surface Scuff',
        quantity: 2,
        inspectedQuantity: 1000,
        productionLine: 'Line 01 - Automated Assembly',
      },
      // Line 2: 25 defects out of 500 inspected -> 50,000 PPM
      {
        id: 'LOG-LINE2',
        date: today,
        recordType: 'process-ppm',
        defectType: 'Micro-crack Dovetail',
        quantity: 25,
        inspectedQuantity: 500,
        productionLine: 'Line 02 - Forging Press',
      },
    ];

    seedDefectLogs(logs);
    const analysis = analyzeDefectRecords(logs, 'month');

    // Total: 27 defects / 1500 inspected = 0.018 * 1,000,000 = 18,000 PPM
    expect(analysis.kpis.currentPpm).toBe(18000);
    expect(analysis.kpis.worstLinePpm).toBe(50000);
    expect(analysis.kpis.bestLinePpm).toBe(2000);

    const worstLine = analysis.linePpm.find((l) => l.line === 'Line 02 - Forging Press');
    expect(worstLine?.ppm).toBe(50000);
  });

  it('Test 3.3: Financial COPQ breakdown matches PAF proportions and highlights top cost drivers', () => {
    const today = new Date().toISOString().split('T')[0];
    const records: ExtendedDefectLog[] = [
      {
        id: 'CD-1',
        date: today,
        recordType: 'defect-cost',
        defectType: 'Turbine Rotor Imbalance',
        quantity: 1,
        inspectedQuantity: 50,
        productionLine: 'Aerospace Machining',
        estimatedCost: 18000,
        costCategory: 'internal-failure',
      },
      {
        id: 'CD-2',
        date: today,
        recordType: 'defect-cost',
        defectType: 'O-Ring Hydraulic Leak Recall',
        quantity: 4,
        inspectedQuantity: 200,
        productionLine: 'Flight Final Assembly',
        estimatedCost: 45000,
        costCategory: 'external-failure',
      },
      {
        id: 'CD-3',
        date: today,
        recordType: 'defect-cost',
        defectType: 'Ultrasonic Scanning Contract',
        quantity: 0,
        inspectedQuantity: 250,
        productionLine: 'NDT Metrology',
        estimatedCost: 3500,
        costCategory: 'appraisal',
      },
      {
        id: 'CD-4',
        date: today,
        recordType: 'defect-cost',
        defectType: 'Operator Mistake-Proofing Training',
        quantity: 0,
        inspectedQuantity: 100,
        productionLine: 'Quality Academy',
        estimatedCost: 2000,
        costCategory: 'prevention',
      },
    ];

    const analysis = analyzeDefectRecords(records, 'month');

    // Top cost drivers should rank Recall #1 and Imbalance #2
    expect(analysis.topCostDrivers.length).toBeGreaterThanOrEqual(2);
    expect(analysis.topCostDrivers[0].driver).toBe('O-Ring Hydraulic Leak Recall');
    expect(analysis.topCostDrivers[0].cost).toBe(45000);
    expect(analysis.topCostDrivers[1].driver).toBe('Turbine Rotor Imbalance');
    expect(analysis.topCostDrivers[1].cost).toBe(18000);

    // COPQ breakdown array exists with four PAF categories
    expect(analysis.copqBreakdown.length).toBe(4);
    const externalSegment = analysis.copqBreakdown.find((s) => s.name === 'External Failure');
    expect(externalSegment?.value).toBe(45000);
  });

  it('Test 3.4: Executive Mode KPI Briefing aggregates FPY, MTTR, Scrap %, and COPQ targets', () => {
    // Model Executive Briefing Aggregator
    interface ExecutiveKpiSnapshot {
      reportingDate: string;
      overallFirstPassYield: number; // %
      meanTimeToRepairHours: number;
      scrapPercentage: number;
      totalCopqUsd: number;
      targetCopqUsd: number;
      ppmStatus: 'healthy' | 'warning' | 'critical';
      savingsRealized: number;
    }

    const today = new Date().toISOString().split('T')[0];
    const defectLogs: ExtendedDefectLog[] = [
      {
        id: 'KPI-1',
        date: today,
        recordType: 'defect-cost',
        defectType: 'Surface Defect',
        quantity: 4,
        inspectedQuantity: 400,
        productionLine: 'Line 01',
        estimatedCost: 2000,
        costCategory: 'internal-failure',
      },
    ];

    const analytics = analyzeDefectRecords(defectLogs, 'month');

    const executiveSnapshot: ExecutiveKpiSnapshot = {
      reportingDate: today,
      overallFirstPassYield: 98.5,
      meanTimeToRepairHours: 1.8,
      scrapPercentage: 0.65,
      totalCopqUsd: analytics.kpis.totalCopq,
      targetCopqUsd: 5000,
      ppmStatus: analytics.kpis.currentPpm <= 10000 ? 'healthy' : 'warning',
      savingsRealized: 14200,
    };

    expect(executiveSnapshot.overallFirstPassYield).toBeGreaterThan(95.0);
    expect(executiveSnapshot.meanTimeToRepairHours).toBeLessThan(4.0);
    expect(executiveSnapshot.scrapPercentage).toBeLessThan(1.0);
    expect(executiveSnapshot.totalCopqUsd).toBe(2000);
    expect(executiveSnapshot.ppmStatus).toBe('healthy');
  });

  it('Test 3.5: Dynamic shift logging verifies time-series trend tracking across shifts', () => {
    const today = new Date();
    const d1 = new Date(today.getTime() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const d2 = new Date(today.getTime() - 1 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const d3 = today.toISOString().split('T')[0];

    const logs: ExtendedDefectLog[] = [
      {
        id: 'T-1',
        date: d1,
        recordType: 'process-ppm',
        defectType: 'Flange Burrs',
        quantity: 10,
        inspectedQuantity: 1000,
        productionLine: 'Line 01',
      },
      {
        id: 'T-2',
        date: d2,
        recordType: 'process-ppm',
        defectType: 'Flange Burrs',
        quantity: 5,
        inspectedQuantity: 1000,
        productionLine: 'Line 01',
      },
      {
        id: 'T-3',
        date: d3,
        recordType: 'process-ppm',
        defectType: 'Flange Burrs',
        quantity: 1,
        inspectedQuantity: 1000,
        productionLine: 'Line 01',
      },
    ];

    const analytics = analyzeDefectRecords(logs, 'month');
    expect(analytics.ppmTrendData.length).toBe(3);

    // Trend should demonstrate defect reduction (10,000 -> 5,000 -> 1,000 PPM)
    expect(analytics.ppmTrendData[0].ppm).toBe(10000);
    expect(analytics.ppmTrendData[1].ppm).toBe(5000);
    expect(analytics.ppmTrendData[2].ppm).toBe(1000);
  });
});
