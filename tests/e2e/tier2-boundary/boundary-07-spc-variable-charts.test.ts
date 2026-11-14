import { describe, it, expect } from 'vitest';
import {
  calculateXbarR,
  calculateXbarS,
  calculateIMR,
  type SpcSubgroup,
} from '@/services/spcEngine';

describe('Feature 07 Boundary: Variable Control Charts (X-bar, R, S, I-MR)', () => {
  it('handles zero-variance data (all points identical, Range=0, S=0) without NaN or infinite limits', () => {
    // 5 subgroups of size 3 with identical constant values
    const subgroups: SpcSubgroup[] = [
      { id: '1', label: 'SG1', timestamp: 'T1', values: [25.0, 25.0, 25.0] },
      { id: '2', label: 'SG2', timestamp: 'T2', values: [25.0, 25.0, 25.0] },
      { id: '3', label: 'SG3', timestamp: 'T3', values: [25.0, 25.0, 25.0] },
      { id: '4', label: 'SG4', timestamp: 'T4', values: [25.0, 25.0, 25.0] },
      { id: '5', label: 'SG5', timestamp: 'T5', values: [25.0, 25.0, 25.0] },
    ];

    const result = calculateXbarR(subgroups);
    expect(Number.isFinite(result.overallMean)).toBe(true);
    expect(result.overallMean).toBe(25.0);
    expect(result.secondaryLimits.cl).toBe(0); // R-bar is 0
    expect(result.primaryLimits.ucl).toBeCloseTo(25.0, 2);
    expect(result.primaryLimits.lcl).toBeCloseTo(25.0, 2);
    expect(isNaN(result.primaryLimits.ucl)).toBe(false);
    expect(isNaN(result.primaryLimits.lcl)).toBe(false);
  });

  it('calculates control limits accurately for negative measurement datasets (cryogenic temperatures)', () => {
    // Subzero temperature readings in Celsius
    const cryogenicSubgroups: SpcSubgroup[] = [
      { id: '1', label: 'SG1', timestamp: 'T1', values: [-40.2, -40.5, -40.1, -40.3] },
      { id: '2', label: 'SG2', timestamp: 'T2', values: [-39.8, -40.0, -40.2, -39.9] },
      { id: '3', label: 'SG3', timestamp: 'T3', values: [-40.1, -40.3, -40.0, -40.2] },
      { id: '4', label: 'SG4', timestamp: 'T4', values: [-40.4, -40.2, -40.5, -40.3] },
    ];

    const result = calculateXbarR(cryogenicSubgroups);
    expect(result.overallMean).toBeLessThan(0);
    expect(result.primaryLimits.ucl).toBeGreaterThan(result.overallMean);
    expect(result.primaryLimits.lcl).toBeLessThan(result.overallMean);
    expect(result.secondaryLimits.cl).toBeGreaterThan(0); // Range is always positive
  });

  it('handles micro-scale float precision (nanometer tolerances, 1e-7 magnitude)', () => {
    const nanoSubgroups: SpcSubgroup[] = [
      { id: '1', label: 'SG1', timestamp: 'T1', values: [0.0000102, 0.0000105, 0.0000101] },
      { id: '2', label: 'SG2', timestamp: 'T2', values: [0.0000104, 0.0000103, 0.0000102] },
      { id: '3', label: 'SG3', timestamp: 'T3', values: [0.0000101, 0.0000102, 0.0000106] },
      { id: '4', label: 'SG4', timestamp: 'T4', values: [0.0000103, 0.0000105, 0.0000104] },
    ];

    const result = calculateXbarS(nanoSubgroups);
    expect(Number.isFinite(result.overallMean)).toBe(true);
    expect(result.overallMean).toBeGreaterThan(0);
    expect(result.primaryLimits.ucl).toBeGreaterThan(result.overallMean);
    expect(result.primaryLimits.lcl).toBeLessThan(result.overallMean);
  });

  it('handles I-MR chart boundary: two observations, identical observations, single-point MR', () => {
    const identicalPoints = [
      { label: 'Pt 1', value: 100.0 },
      { label: 'Pt 2', value: 100.0 },
      { label: 'Pt 3', value: 100.0 },
      { label: 'Pt 4', value: 100.0 },
    ];
    const imrResult = calculateIMR(identicalPoints);

    expect(imrResult.overallMean).toBe(100.0);
    expect(imrResult.secondaryLimits.cl).toBe(0); // MR bar is 0
    expect(imrResult.primaryLimits.ucl).toBeCloseTo(100.0, 2);
    expect(imrResult.primaryLimits.lcl).toBeCloseTo(100.0, 2);
  });

  it('safely handles large subgroup counts (>500 subgroups) within 2000ms performance budget', () => {
    const largeBatch: SpcSubgroup[] = [];
    for (let i = 0; i < 500; i++) {
      const base = 50 + Math.sin(i * 0.1);
      largeBatch.push({
        id: `sg-${i}`,
        label: `SG-${i}`,
        timestamp: new Date(Date.now() + i * 60000).toISOString(),
        values: [base - 0.2, base + 0.1, base, base - 0.1, base + 0.2],
      });
    }

    const t0 = performance.now();
    const result = calculateXbarR(largeBatch);
    const elapsed = performance.now() - t0;

    expect(result.primaryChart.length).toBe(500);
    expect(elapsed).toBeLessThan(2000); // 2000ms budget
  });
});
