import { describe, it, expect } from 'vitest';

export function calculateMttr(totalDowntimeMinutes: number, failureCount: number): number {
  if (!Number.isFinite(failureCount) || failureCount <= 0) return 0;
  return Number((totalDowntimeMinutes / failureCount).toFixed(2));
}

export function calculateRty(stages: { total: number; passed: number }[]): number {
  if (!stages || stages.length === 0) return 0;
  let rty = 1.0;
  for (const s of stages) {
    if (s.total <= 0) return 0;
    const yieldRatio = Math.max(0, Math.min(1, s.passed / s.total));
    rty *= yieldRatio;
  }
  return Number((rty * 100).toFixed(2));
}

describe('Feature 27 Boundary: Executive Mode KPI Briefing', () => {
  it('guards against division by zero in MTTR when failure count is zero (0 breakdowns)', () => {
    expect(calculateMttr(0, 0)).toBe(0);
    expect(calculateMttr(120, 0)).toBe(0);
    expect(calculateMttr(0, 5)).toBe(0);
  });

  it('handles complete stage failure in Rolled Throughput Yield (RTY = 0%)', () => {
    const catastrophicStages = [
      { total: 1000, passed: 1000 },
      { total: 1000, passed: 0 }, // Catastrophic stage drop
      { total: 1000, passed: 1000 },
    ];

    expect(calculateRty(catastrophicStages)).toBe(0);
  });

  it('handles empty stages array in RTY calculation without throwing', () => {
    expect(calculateRty([])).toBe(0);
  });

  it('evaluates month-over-month trend delta with single data point (no prior period baseline)', () => {
    const calculateTrendDelta = (current: number, previous?: number): number => {
      if (previous === undefined || previous === 0) return 0;
      return Number((((current - previous) / previous) * 100).toFixed(2));
    };

    expect(calculateTrendDelta(98.5)).toBe(0);
    expect(calculateTrendDelta(98.5, 0)).toBe(0);
    expect(calculateTrendDelta(98.5, 95.0)).toBe(3.68);
  });

  it('safely handles scrap rate when total units produced is zero', () => {
    const computeScrapRate = (scrap: number, total: number): number => {
      if (!Number.isFinite(total) || total <= 0) return 0;
      return Number(((scrap / total) * 100).toFixed(2));
    };

    expect(computeScrapRate(0, 0)).toBe(0);
    expect(computeScrapRate(50, 0)).toBe(0);
    expect(computeScrapRate(50, 1000)).toBe(5.0);
  });
});
