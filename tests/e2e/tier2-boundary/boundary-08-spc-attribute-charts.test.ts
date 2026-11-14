import { describe, it, expect } from 'vitest';
import {
  calculatePChart,
  calculateNpChart,
  calculateCChart,
  calculateUChart,
} from '@/services/spcEngine';

describe('Feature 08 Boundary: Attribute Control Charts (P, U, C, Np)', () => {
  it('handles zero defects across all subgroups (p=0, c=0) with LCL clamped to 0', () => {
    const perfectLots = [
      { label: 'Lot 1', sampleSize: 100, defective: 0 },
      { label: 'Lot 2', sampleSize: 100, defective: 0 },
      { label: 'Lot 3', sampleSize: 100, defective: 0 },
      { label: 'Lot 4', sampleSize: 100, defective: 0 },
    ];

    const pChart = calculatePChart(perfectLots);
    expect(pChart.overallMean).toBe(0);
    pChart.primaryChart.forEach((pt) => {
      expect(pt.lcl).toBe(0); // LCL must never be negative
      expect(pt.ucl).toBeLessThanOrEqual(0.001);
      expect(pt.outOfControl).toBe(false);
    });

    const cChart = calculateCChart([0, 0, 0, 0, 0]);
    expect(cChart.overallMean).toBe(0);
    expect(cChart.primaryLimits.lcl).toBe(0);
    expect(cChart.primaryLimits.ucl).toBe(0);
  });

  it('handles 100% defect rate (p=1.0) boundary condition', () => {
    const catastrophicLots = [
      { label: 'Cat 1', sampleSize: 50, defective: 50 },
      { label: 'Cat 2', sampleSize: 50, defective: 50 },
      { label: 'Cat 3', sampleSize: 50, defective: 50 },
    ];

    const pChart = calculatePChart(catastrophicLots);
    expect(pChart.overallMean).toBe(1.0);
    pChart.primaryChart.forEach((pt) => {
      expect(pt.ucl).toBeLessThanOrEqual(1.0); // UCL cannot exceed 100%
      expect(pt.lcl).toBeGreaterThanOrEqual(0);
    });
  });

  it('enforces lower control limit clamping (LCL >= 0) when 3-sigma lower limit is negative', () => {
    // Low defect rate where mean - 3*sigma would be mathematically negative
    const lowRateLots = [
      { label: 'L1', sampleSize: 100, defective: 1 },
      { label: 'L2', sampleSize: 100, defective: 0 },
      { label: 'L3', sampleSize: 100, defective: 1 },
      { label: 'L4', sampleSize: 100, defective: 0 },
    ];

    const pChart = calculatePChart(lowRateLots);
    pChart.primaryChart.forEach((pt) => {
      expect(pt.lcl).toBeGreaterThanOrEqual(0);
    });

    // C-Chart with small count (c-bar = 1.0 -> 1 - 3*sqrt(1) = -2 -> clamped to 0)
    const cChart = calculateCChart([1, 1, 1, 1]);
    expect(cChart.primaryLimits.lcl).toBe(0);
  });

  it('safely handles variable inspection unit sizes in U-Chart (units from 0.1 to 1000)', () => {
    const variableUnits = [
      { label: 'U1', units: 0.5, defects: 1 },
      { label: 'U2', units: 50.0, defects: 45 },
      { label: 'U3', units: 1000.0, defects: 800 },
    ];

    const uChart = calculateUChart(variableUnits);
    expect(Number.isFinite(uChart.overallMean)).toBe(true);
    expect(uChart.overallMean).toBeGreaterThan(0);
    uChart.primaryChart.forEach((pt) => {
      expect(pt.lcl).toBeGreaterThanOrEqual(0);
      expect(pt.ucl).toBeGreaterThan(0);
    });
  });

  it('handles Np-chart with large batch sizes (n=50,000) without numerical overflow', () => {
    const hugeLots = [
      { label: 'HL-1', sampleSize: 50000, defective: 25 },
      { label: 'HL-2', sampleSize: 50000, defective: 30 },
      { label: 'HL-3', sampleSize: 50000, defective: 28 },
    ];

    const npChart = calculateNpChart(hugeLots);
    expect(npChart.overallMean).toBeGreaterThan(20);
    expect(npChart.primaryLimits.ucl).toBeGreaterThan(npChart.overallMean);
    expect(npChart.primaryLimits.lcl).toBeGreaterThanOrEqual(0);
  });
});
