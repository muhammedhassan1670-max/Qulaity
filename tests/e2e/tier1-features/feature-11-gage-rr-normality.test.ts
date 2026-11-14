import { describe, it, expect } from 'vitest';
import {
  calculateGageRR,
  mathHelper,
  type GageRRObservation,
} from '@/services/spcEngine';

describe('Feature 11: Gage R&R & Normality Test', () => {
  it('confirms capable measurement system when %GRR < 10% and ndc >= 5', () => {
    // 2 operators, 3 parts, 2 trials with very low measurement error compared to part variation
    const observations: GageRRObservation[] = [
      // Operator A - Part 1 (nominal 10)
      { operator: 'OpA', part: 'P1', trial: 1, measurement: 10.01 },
      { operator: 'OpA', part: 'P1', trial: 2, measurement: 10.02 },
      // Operator A - Part 2 (nominal 20)
      { operator: 'OpA', part: 'P2', trial: 1, measurement: 20.00 },
      { operator: 'OpA', part: 'P2', trial: 2, measurement: 20.01 },
      // Operator A - Part 3 (nominal 30)
      { operator: 'OpA', part: 'P3', trial: 1, measurement: 30.02 },
      { operator: 'OpA', part: 'P3', trial: 2, measurement: 30.01 },

      // Operator B - Part 1
      { operator: 'OpB', part: 'P1', trial: 1, measurement: 10.02 },
      { operator: 'OpB', part: 'P1', trial: 2, measurement: 10.01 },
      // Operator B - Part 2
      { operator: 'OpB', part: 'P2', trial: 1, measurement: 20.01 },
      { operator: 'OpB', part: 'P2', trial: 2, measurement: 20.00 },
      // Operator B - Part 3
      { operator: 'OpB', part: 'P3', trial: 1, measurement: 30.01 },
      { operator: 'OpB', part: 'P3', trial: 2, measurement: 30.02 },
    ];

    const result = calculateGageRR(observations);

    expect(result.status).toBe('acceptable');
    expect(result.percentGRR).toBeLessThan(10);
    expect(result.ndc).toBeGreaterThanOrEqual(5);
    expect(result.recommendation).toContain('%GRR < 10%');
  });

  it('identifies marginal measurement system when 10% <= %GRR <= 30%', () => {
    // 2 operators, 2 parts, 2 trials with moderate appraiser variation
    const observations: GageRRObservation[] = [
      { operator: 'Op1', part: 'P1', trial: 1, measurement: 50.1 },
      { operator: 'Op1', part: 'P1', trial: 2, measurement: 50.2 },
      { operator: 'Op1', part: 'P2', trial: 1, measurement: 52.0 },
      { operator: 'Op1', part: 'P2', trial: 2, measurement: 52.1 },

      { operator: 'Op2', part: 'P1', trial: 1, measurement: 50.5 },
      { operator: 'Op2', part: 'P1', trial: 2, measurement: 50.6 },
      { operator: 'Op2', part: 'P2', trial: 1, measurement: 52.4 },
      { operator: 'Op2', part: 'P2', trial: 2, measurement: 52.5 },
    ];

    const result = calculateGageRR(observations);
    expect(result.percentGRR).toBeGreaterThanOrEqual(10);
    expect(result.percentGRR).toBeLessThanOrEqual(30);
    expect(result.status).toBe('marginal');
  });

  it('rejects measurement system as unacceptable when %GRR > 30%', () => {
    // High measurement jitter masking part difference
    const observations: GageRRObservation[] = [
      { operator: 'OpA', part: 'P1', trial: 1, measurement: 10.0 },
      { operator: 'OpA', part: 'P1', trial: 2, measurement: 11.5 },
      { operator: 'OpA', part: 'P2', trial: 1, measurement: 10.2 },
      { operator: 'OpA', part: 'P2', trial: 2, measurement: 11.8 },

      { operator: 'OpB', part: 'P1', trial: 1, measurement: 12.0 },
      { operator: 'OpB', part: 'P1', trial: 2, measurement: 9.8 },
      { operator: 'OpB', part: 'P2', trial: 1, measurement: 12.5 },
      { operator: 'OpB', part: 'P2', trial: 2, measurement: 10.1 },
    ];

    const result = calculateGageRR(observations);
    expect(result.status).toBe('unacceptable');
    expect(result.percentGRR).toBeGreaterThan(30);
    expect(result.recommendation).toContain('unacceptable');
  });

  it('verifies Anderson-Darling normality for bell-curve distributed measurements (p > 0.05)', () => {
    // 20 points from a symmetric normal distribution around 50
    const normalSample = [
      48.2, 48.9, 49.3, 49.6, 49.8, 50.0, 50.1, 50.2, 50.3, 50.4,
      50.5, 50.6, 50.7, 50.9, 51.1, 51.3, 51.5, 51.8, 49.0, 50.0
    ];

    const result = mathHelper.andersonDarlingNormality(normalSample);
    expect(result.isNormal).toBe(true);
    expect(result.pValue).toBeGreaterThan(0.05);
    expect(result.adStatistic).toBeLessThan(1.5);
    expect(result.verdict).toContain('normal');
  });

  it('detects departure from normality for highly skewed or outlier contaminated dataset (p < 0.05)', () => {
    // Severely skewed distribution with extreme positive tail
    const skewedSample = [
      10.0, 10.1, 10.0, 10.2, 10.1, 10.0, 10.1, 10.2, 10.0, 10.1,
      10.1, 10.2, 10.0, 10.1, 10.2, 10.0, 10.1, 10.2, 55.0, 95.0
    ];

    const result = mathHelper.andersonDarlingNormality(skewedSample);
    expect(result.isNormal).toBe(false);
    expect(result.pValue).toBeLessThan(0.05);
    expect(result.verdict).toContain('departs significantly from normality');
  });
});
