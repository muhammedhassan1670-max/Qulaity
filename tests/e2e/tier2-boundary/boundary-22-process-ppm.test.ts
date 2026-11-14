import { describe, it, expect } from 'vitest';

export function calculateProcessPpm(defects: number, totalUnits: number): number {
  if (!Number.isFinite(totalUnits) || totalUnits <= 0) return 0;
  const d = Math.max(0, Math.min(totalUnits, defects || 0));
  return Math.round((d / totalUnits) * 1_000_000);
}

export function calculateDpmo(defects: number, units: number, opportunitiesPerUnit: number): number {
  if (!Number.isFinite(units) || units <= 0 || !Number.isFinite(opportunitiesPerUnit) || opportunitiesPerUnit <= 0) {
    return 0;
  }
  const totalOpportunities = units * opportunitiesPerUnit;
  const d = Math.max(0, defects || 0);
  return Math.round((d / totalOpportunities) * 1_000_000);
}

describe('Feature 22 Boundary: Process PPM Tracking', () => {
  it('guards against division by zero when total units or opportunities are zero or negative', () => {
    expect(calculateProcessPpm(10, 0)).toBe(0);
    expect(calculateProcessPpm(5, -100)).toBe(0);
    expect(calculateProcessPpm(0, 0)).toBe(0);

    expect(calculateDpmo(10, 0, 5)).toBe(0);
    expect(calculateDpmo(10, 100, 0)).toBe(0);
    expect(calculateDpmo(10, -50, -2)).toBe(0);
  });

  it('handles absolute perfection: 0 defects across 10,000,000 units (0 PPM, 0 DPMO)', () => {
    const ppm = calculateProcessPpm(0, 10_000_000);
    const dpmo = calculateDpmo(0, 10_000_000, 10);

    expect(ppm).toBe(0);
    expect(dpmo).toBe(0);
  });

  it('handles 100% defect rate boundary (PPM = 1,000,000)', () => {
    const ppm = calculateProcessPpm(5000, 5000);
    expect(ppm).toBe(1_000_000);

    // Defects greater than total units clamped to 100%
    const clampedPpm = calculateProcessPpm(6000, 5000);
    expect(clampedPpm).toBe(1_000_000);
  });

  it('clamps negative defect counts to 0 PPM', () => {
    const ppm = calculateProcessPpm(-25, 100_000);
    expect(ppm).toBe(0);

    const dpmo = calculateDpmo(-50, 10_000, 4);
    expect(dpmo).toBe(0);
  });

  it('calculates single unit batch boundaries (n=1 unit tested)', () => {
    // 1 unit passed
    expect(calculateProcessPpm(0, 1)).toBe(0);
    // 1 unit failed
    expect(calculateProcessPpm(1, 1)).toBe(1_000_000);
  });
});
