import { describe, it, expect } from 'vitest';
import {
  calculatePChart,
  calculateNpChart,
  calculateCChart,
  calculateUChart,
} from '@/services/spcEngine';

describe('Feature 08: Attribute Control Charts (P, U, C, Np)', () => {
  it('calculates P-Chart (fraction non-conforming) with binomial limits', () => {
    // 5 daily lots, varying sample sizes, defect counts
    const data = [
      { label: 'D1', sampleSize: 100, defective: 3 }, // p = 0.03
      { label: 'D2', sampleSize: 100, defective: 5 }, // p = 0.05
      { label: 'D3', sampleSize: 100, defective: 2 }, // p = 0.02
      { label: 'D4', sampleSize: 100, defective: 4 }, // p = 0.04
      { label: 'D5', sampleSize: 100, defective: 6 }, // p = 0.06
    ];

    const chart = calculatePChart(data);
    const totalDefects = 3 + 5 + 2 + 4 + 6; // 20
    const totalInspected = 500;
    const pBar = totalDefects / totalInspected; // 0.04

    expect(chart.overallMean).toBeCloseTo(pBar, 4);
    expect(chart.primaryChart.length).toBe(5);

    // Each point in primaryChart has its own UCL/LCL
    chart.primaryChart.forEach((pt) => {
      expect(pt.ucl).toBeGreaterThan(chart.overallMean);
      expect(pt.lcl).toBeGreaterThanOrEqual(0);
      expect(typeof pt.outOfControl).toBe('boolean');
    });
  });

  it('calculates Np-Chart (number of non-conforming items) for fixed sample size', () => {
    const fixedSampleSize = 200;
    const data = [
      { label: 'L1', sampleSize: fixedSampleSize, defective: 4 },
      { label: 'L2', sampleSize: fixedSampleSize, defective: 6 },
      { label: 'L3', sampleSize: fixedSampleSize, defective: 5 },
      { label: 'L4', sampleSize: fixedSampleSize, defective: 3 },
      { label: 'L5', sampleSize: fixedSampleSize, defective: 7 },
    ];

    const chart = calculateNpChart(data);
    const npBar = (4 + 6 + 5 + 3 + 7) / 5; // 5.0
    expect(chart.overallMean).toBeCloseTo(npBar, 3);
    expect(chart.primaryLimits.ucl).toBeGreaterThan(chart.overallMean);
    expect(chart.primaryLimits.lcl).toBeGreaterThanOrEqual(0);

    // Standard error for np: sqrt(np(1-p))
    const p = npBar / fixedSampleSize;
    const sigma = Math.sqrt(npBar * (1 - p));
    expect(chart.primaryLimits.ucl).toBeCloseTo(npBar + 3 * sigma, 2);
  });

  it('calculates C-Chart (Poisson defect count per inspection unit)', () => {
    // Surface defect counts on 6 inspected door panels
    const panelDefects = [
      { label: 'P1', defects: 2 },
      { label: 'P2', defects: 4 },
      { label: 'P3', defects: 1 },
      { label: 'P4', defects: 3 },
      { label: 'P5', defects: 5 },
      { label: 'P6', defects: 3 },
    ];

    const chart = calculateCChart(panelDefects);
    const cBar = (2 + 4 + 1 + 3 + 5 + 3) / 6; // 3.0
    expect(chart.overallMean).toBeCloseTo(cBar, 3);

    // C chart limits: cBar ± 3 * sqrt(cBar)
    const expectedUcl = cBar + 3 * Math.sqrt(cBar);
    const expectedLcl = Math.max(0, cBar - 3 * Math.sqrt(cBar));

    expect(chart.primaryLimits.ucl).toBeCloseTo(expectedUcl, 3);
    expect(chart.primaryLimits.lcl).toBeCloseTo(expectedLcl, 3);
  });

  it('calculates U-Chart (defects per unit) for variable inspection quantities', () => {
    // SMT solder joint defect inspection on varying lot sizes
    const data = [
      { label: 'L1', units: 10, defects: 15 }, // u = 1.5
      { label: 'L2', units: 20, defects: 25 }, // u = 1.25
      { label: 'L3', units: 15, defects: 18 }, // u = 1.20
      { label: 'L4', units: 25, defects: 32 }, // u = 1.28
    ];

    const chart = calculateUChart(data);
    const totalDefects = 15 + 25 + 18 + 32; // 90
    const totalUnits = 10 + 20 + 15 + 25; // 70
    const uBar = totalDefects / totalUnits; // 1.2857

    expect(chart.overallMean).toBeCloseTo(uBar, 3);
    expect(chart.primaryChart.length).toBe(4);

    // Larger sample size yields narrower control limits
    const ptSmall = chart.primaryChart.find((p) => p.label === 'L1')!;
    const ptLarge = chart.primaryChart.find((p) => p.label === 'L4')!;
    const widthSmall = ptSmall.ucl - ptSmall.lcl;
    const widthLarge = ptLarge.ucl - ptLarge.lcl;

    expect(widthSmall).toBeGreaterThan(widthLarge);
  });

  it('enforces non-negative truncation for lower control limits (LCL >= 0)', () => {
    // When defect rates are low, 3-sigma theoretical limit is negative; must clamp to 0
    const lowDefectData = [
      { label: 'S1', defects: 1 },
      { label: 'S2', defects: 0 },
      { label: 'S3', defects: 1 },
      { label: 'S4', defects: 0 },
    ];

    const chart = calculateCChart(lowDefectData);
    expect(chart.overallMean).toBe(0.5);
    // 0.5 - 3 * sqrt(0.5) is negative (-1.621), must be 0
    expect(chart.primaryLimits.lcl).toBe(0);
  });
});
