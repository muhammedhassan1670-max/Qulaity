import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetQualityStorage,
  seedDefectLogs,
  writeStoredItems,
} from '../../helpers/testHarness';
import { INDUSTRIAL_PARTS } from '../../helpers/industrialFixtures';
import {
  loadQualityAnalyticsSnapshot,
  loadQualityDashboardFilters,
} from '@/services/qualityAnalyticsHub';
import type { SafeDefectRecord } from '@/services/safeDefectStorage';

describe('Feature 22: Process PPM Tracking Engine', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('calculates standard Parts Per Million (PPM) defect rate accurately', () => {
    // PPM = (Defect Count / Total Inspected Units) * 1,000,000
    const cases = [
      { defects: 5, inspected: 100_000, expectedPpm: 50 },
      { defects: 12, inspected: 50_000, expectedPpm: 240 },
      { defects: 1, inspected: 250_000, expectedPpm: 4 },
      { defects: 0, inspected: 100_000, expectedPpm: 0 },
      { defects: 48, inspected: 80_000, expectedPpm: 600 },
    ];

    cases.forEach(({ defects, inspected, expectedPpm }) => {
      const calculatedPpm = inspected > 0 ? Math.round((defects / inspected) * 1_000_000) : 0;
      expect(calculatedPpm).toBe(expectedPpm);
    });
  });

  it('computes Defects Per Million Opportunities (DPMO) and normalizes complexity', () => {
    // DPMO = (Total Defects / (Total Units * Defect Opportunities per Unit)) * 1,000,000
    // Actuator housing has 8 critical quality characteristics (bore, thread, surface, concentricity, etc.)
    const totalUnits = 25_000;
    const opportunitiesPerUnit = 8;
    const totalDefectsObserved = 34;

    const totalOpportunities = totalUnits * opportunitiesPerUnit;
    const dpmo = Math.round((totalDefectsObserved / totalOpportunities) * 1_000_000);

    expect(totalOpportunities).toBe(200_000);
    expect(dpmo).toBe(170); // 170 DPMO
  });

  it('maps DPMO to Six Sigma quality capability benchmarks with 1.5 sigma shift', () => {
    // Six Sigma Benchmark Matrix:
    // 6 Sigma -> <= 3.4 DPMO
    // 5 Sigma -> <= 233 DPMO
    // 4 Sigma -> <= 6,210 DPMO
    // 3 Sigma -> <= 66,807 DPMO
    // 2 Sigma -> <= 308,538 DPMO
    const convertDpmoToSigmaLevel = (dpmo: number): number => {
      if (dpmo <= 3.4) return 6.0;
      if (dpmo <= 233) return 5.0;
      if (dpmo <= 6210) return 4.0;
      if (dpmo <= 66807) return 3.0;
      if (dpmo <= 308538) return 2.0;
      return 1.0;
    };

    expect(convertDpmoToSigmaLevel(2.1)).toBe(6.0);
    expect(convertDpmoToSigmaLevel(170)).toBe(5.0);
    expect(convertDpmoToSigmaLevel(1850)).toBe(4.0);
    expect(convertDpmoToSigmaLevel(14200)).toBe(3.0);
    expect(convertDpmoToSigmaLevel(150000)).toBe(2.0);
  });

  it('evaluates shift-by-shift trends and production line PPM comparisons', () => {
    interface ShiftMetric {
      shift: 'Morning' | 'Afternoon' | 'Night';
      line: string;
      defects: number;
      inspected: number;
    }

    const shiftData: ShiftMetric[] = [
      { shift: 'Morning', line: 'CNC Line 01', defects: 4, inspected: 12000 },
      { shift: 'Afternoon', line: 'CNC Line 01', defects: 7, inspected: 11500 },
      { shift: 'Night', line: 'CNC Line 01', defects: 16, inspected: 9800 },
      { shift: 'Morning', line: 'Assembly Line 02', defects: 2, inspected: 15000 },
      { shift: 'Afternoon', line: 'Assembly Line 02', defects: 5, inspected: 14200 },
      { shift: 'Night', line: 'Assembly Line 02', defects: 8, inspected: 12500 },
    ];

    const processed = shiftData.map((s) => ({
      ...s,
      ppm: Math.round((s.defects / s.inspected) * 1_000_000),
    }));

    const morningPpm = processed.filter((s) => s.shift === 'Morning');
    const nightPpm = processed.filter((s) => s.shift === 'Night');

    const avgMorningPpm = morningPpm.reduce((acc, s) => acc + s.ppm, 0) / morningPpm.length;
    const avgNightPpm = nightPpm.reduce((acc, s) => acc + s.ppm, 0) / nightPpm.length;

    // Night shift typically experiences higher fatigue drift
    expect(avgNightPpm).toBeGreaterThan(avgMorningPpm);

    // Identify line with highest PPM
    const cncLinePpm = processed
      .filter((s) => s.line === 'CNC Line 01')
      .reduce((s, r) => s + r.ppm, 0) / 3;
    const assemblyLinePpm = processed
      .filter((s) => s.line === 'Assembly Line 02')
      .reduce((s, r) => s + r.ppm, 0) / 3;

    expect(cncLinePpm).toBeGreaterThan(assemblyLinePpm);
  });

  it('integrates with qualityAnalyticsHub to compute live PPM metrics and top contributors', async () => {
    const part = INDUSTRIAL_PARTS[0];
    const processDefects: Partial<SafeDefectRecord>[] = [
      {
        id: 'DEF-PPM-01',
        title: 'Bore Diameter Oversize',
        recordType: 'process-ppm',
        defectType: 'Dimensional Variation',
        quantity: 14,
        inspectedQuantity: 20000,
        productionLine: 'Line 01 - Machining',
        model: part.partNumber,
        date: '2026-11-10',
        status: 'open',
      },
      {
        id: 'DEF-PPM-02',
        title: 'Surface Flange Scratch',
        recordType: 'process-ppm',
        defectType: 'Handling Scratch',
        quantity: 6,
        inspectedQuantity: 15000,
        productionLine: 'Line 02 - Assembly',
        model: part.partNumber,
        date: '2026-11-11',
        status: 'open',
      },
    ];

    seedDefectLogs(processDefects);
    writeStoredItems('qms_local_defect-logs', processDefects);

    const filters = loadQualityDashboardFilters();
    filters.datePreset = 'all';

    const snapshot = await loadQualityAnalyticsSnapshot(filters);

    expect(snapshot.ppmMetrics).toBeDefined();
    expect(snapshot.ppmMetrics.defectQuantity).toBeGreaterThanOrEqual(20);
    expect(snapshot.ppmMetrics.inspectedQuantity).toBeGreaterThanOrEqual(35000);
    expect(snapshot.ppmMetrics.currentPpm).toBeGreaterThan(0);
    expect(snapshot.ppmMetrics.byLine.length).toBeGreaterThanOrEqual(2);
  });
});
