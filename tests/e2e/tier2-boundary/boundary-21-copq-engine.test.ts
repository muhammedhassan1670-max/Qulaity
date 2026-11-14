import { describe, it, expect } from 'vitest';

export function calculateCopqMetrics(costs: {
  prevention: number;
  appraisal: number;
  internalFailure: number;
  externalFailure: number;
  salesRevenue?: number;
}) {
  const p = Math.max(0, costs.prevention || 0);
  const a = Math.max(0, costs.appraisal || 0);
  const ifail = Math.max(0, costs.internalFailure || 0);
  const efail = Math.max(0, costs.externalFailure || 0);

  const totalFailure = ifail + efail;
  const totalConformance = p + a;
  const totalCopq = totalFailure + totalConformance;

  const revenue = costs.salesRevenue || 0;
  const copqPercentRevenue = revenue > 0 ? (totalCopq / revenue) * 100 : 0;
  const failureToCopqRatio = totalCopq > 0 ? (totalFailure / totalCopq) * 100 : 0;

  return {
    prevention: p,
    appraisal: a,
    internalFailure: ifail,
    externalFailure: efail,
    totalFailure,
    totalConformance,
    totalCopq,
    copqPercentRevenue,
    failureToCopqRatio,
  };
}

describe('Feature 21 Boundary: COPQ Financial Cost Engine', () => {
  it('guards against division by zero when all cost categories are zero ($0 total COPQ)', () => {
    const res = calculateCopqMetrics({
      prevention: 0,
      appraisal: 0,
      internalFailure: 0,
      externalFailure: 0,
      salesRevenue: 0,
    });

    expect(res.totalCopq).toBe(0);
    expect(res.copqPercentRevenue).toBe(0);
    expect(res.failureToCopqRatio).toBe(0);
    expect(Number.isNaN(res.copqPercentRevenue)).toBe(false);
    expect(Number.isNaN(res.failureToCopqRatio)).toBe(false);
  });

  it('safely handles astronomical monetary amounts ($500M) without precision loss', () => {
    const massiveCosts = {
      prevention: 15_000_000,
      appraisal: 25_000_000,
      internalFailure: 60_000_000,
      externalFailure: 400_000_000, // Massive aerospace recall
      salesRevenue: 5_000_000_000, // $5 Billion revenue
    };

    const res = calculateCopqMetrics(massiveCosts);
    expect(res.totalCopq).toBe(500_000_000);
    expect(res.copqPercentRevenue).toBe(10.0); // 500M / 5B = 10%
    expect(res.totalFailure).toBe(460_000_000);
  });

  it('clamps negative expense inputs or treats offsets safely', () => {
    const negativeInputs = {
      prevention: -5000,
      appraisal: 10000,
      internalFailure: -2000,
      externalFailure: 50000,
    };

    const res = calculateCopqMetrics(negativeInputs);
    expect(res.prevention).toBe(0);
    expect(res.internalFailure).toBe(0);
    expect(res.totalCopq).toBe(60000);
  });

  it('evaluates industry benchmark thresholds: world class (< 2.5% of revenue) vs catastrophic (> 15%)', () => {
    const classifyCopqHealth = (pct: number) => {
      if (pct < 2.5) return 'World-Class';
      if (pct < 7.0) return 'Average';
      if (pct < 15.0) return 'Poor';
      return 'Catastrophic';
    };

    expect(classifyCopqHealth(1.8)).toBe('World-Class');
    expect(classifyCopqHealth(2.5)).toBe('Average');
    expect(classifyCopqHealth(6.9)).toBe('Average');
    expect(classifyCopqHealth(14.9)).toBe('Poor');
    expect(classifyCopqHealth(22.0)).toBe('Catastrophic');
  });

  it('computes 100% failure scenario (zero prevention or appraisal investment)', () => {
    const uninspectedCrisis = {
      prevention: 0,
      appraisal: 0,
      internalFailure: 100000,
      externalFailure: 900000,
    };

    const res = calculateCopqMetrics(uninspectedCrisis);
    expect(res.totalConformance).toBe(0);
    expect(res.failureToCopqRatio).toBe(100);
  });
});
