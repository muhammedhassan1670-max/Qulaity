import { describe, it, expect } from 'vitest';
import {
  calculateGageRR,
  mathHelper,
  type GageRRObservation,
} from '@/services/spcEngine';

describe('Feature 11 Boundary: Gage R&R & Normality Test', () => {
  it('handles zero equipment variation (EV=0) and zero appraiser variation (AV=0) without division by zero', () => {
    // Perfect measurements: every operator and trial gives exactly the exact same number per part
    const perfectObs: GageRRObservation[] = [
      { operator: 'Op1', part: 'P1', trial: 1, measurement: 10.0 },
      { operator: 'Op1', part: 'P1', trial: 2, measurement: 10.0 },
      { operator: 'Op1', part: 'P2', trial: 1, measurement: 20.0 },
      { operator: 'Op1', part: 'P2', trial: 2, measurement: 20.0 },
      { operator: 'Op2', part: 'P1', trial: 1, measurement: 10.0 },
      { operator: 'Op2', part: 'P1', trial: 2, measurement: 10.0 },
      { operator: 'Op2', part: 'P2', trial: 1, measurement: 20.0 },
      { operator: 'Op2', part: 'P2', trial: 2, measurement: 20.0 },
    ];

    const result = calculateGageRR(perfectObs);
    expect(Number.isFinite(result.equipmentVariationEV)).toBe(true);
    expect(Number.isFinite(result.appraiserVariationAV)).toBe(true);
    expect(result.percentGRR).toBeLessThanOrEqual(5);
    expect(result.status).toBe('acceptable');
  });

  it('detects catastrophic measurement system where gage error swamps true part variation (%GRR >= 50%)', () => {
    // Operators measuring almost identically nominal parts with wild noise
    const noisyObs: GageRRObservation[] = [
      { operator: 'Op1', part: 'P1', trial: 1, measurement: 10.0 },
      { operator: 'Op1', part: 'P1', trial: 2, measurement: 18.0 },
      { operator: 'Op1', part: 'P2', trial: 1, measurement: 10.2 },
      { operator: 'Op1', part: 'P2', trial: 2, measurement: 19.5 },
      { operator: 'Op2', part: 'P1', trial: 1, measurement: 2.0 },
      { operator: 'Op2', part: 'P1', trial: 2, measurement: 25.0 },
      { operator: 'Op2', part: 'P2', trial: 1, measurement: 3.5 },
      { operator: 'Op2', part: 'P2', trial: 2, measurement: 24.0 },
    ];

    const result = calculateGageRR(noisyObs);
    expect(result.percentGRR).toBeGreaterThan(30);
    expect(result.status).toBe('unacceptable');
    expect(result.ndc).toBeLessThanOrEqual(4);
  });

  it('correctly handles negative measurement values in relative deviation Gage R&R studies', () => {
    const negativeObs: GageRRObservation[] = [
      { operator: 'Op1', part: 'P1', trial: 1, measurement: -5.02 },
      { operator: 'Op1', part: 'P1', trial: 2, measurement: -5.01 },
      { operator: 'Op1', part: 'P2', trial: 1, measurement: -15.00 },
      { operator: 'Op1', part: 'P2', trial: 2, measurement: -15.01 },
      { operator: 'Op2', part: 'P1', trial: 1, measurement: -5.01 },
      { operator: 'Op2', part: 'P1', trial: 2, measurement: -5.02 },
      { operator: 'Op2', part: 'P2', trial: 1, measurement: -15.02 },
      { operator: 'Op2', part: 'P2', trial: 2, measurement: -15.00 },
    ];

    const result = calculateGageRR(negativeObs);
    expect(Number.isFinite(result.gageRR)).toBe(true);
    expect(result.percentGRR).toBeLessThan(10);
  });

  it('tests Anderson-Darling normality on non-normal bimodal and skewed datasets', () => {
    // Strongly bimodal mixture
    const bimodalData = [
      1, 1.1, 1.2, 0.9, 1.05, 0.95,
      10, 10.2, 9.8, 10.1, 9.9, 10.3,
    ];

    const result = mathHelper.andersonDarlingNormality(bimodalData);
    expect(result).toBeDefined();
    expect(Number.isFinite(result.adStatistic)).toBe(true);
    // Bimodal data fails normality: p-value < 0.05
    expect(result.pValue).toBeLessThan(0.05);
    expect(result.isNormal).toBe(false);
  });

  it('tests Anderson-Darling normality boundary on small samples (n=5) and identical samples', () => {
    const identicalData = [42, 42, 42, 42, 42];
    const result = mathHelper.andersonDarlingNormality(identicalData);

    expect(result).toBeDefined();
    // Identical data has 0 variance; must not crash with NaN or throw
    expect(Number.isNaN(result.adStatistic)).toBe(false);
  });
});
