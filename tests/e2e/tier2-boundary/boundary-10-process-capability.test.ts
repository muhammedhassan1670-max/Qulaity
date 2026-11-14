import { describe, it, expect } from 'vitest';
import { calculateCapability } from '@/services/spcEngine';

describe('Feature 10 Boundary: Process Capability Indices (Cp, Cpk, Pp, Ppk)', () => {
  it('guards against division by zero when standard deviation is zero (all measurements identical)', () => {
    const identicalValues = [50.0, 50.0, 50.0, 50.0, 50.0];
    const usl = 50.5;
    const lsl = 49.5;

    const result = calculateCapability(identicalValues, usl, lsl, 50.0);
    expect(result).toBeDefined();
    expect(Number.isFinite(result.overallMean)).toBe(true);
    expect(result.overallSigma).toBeLessThanOrEqual(0.001);
    // Cp should be finite rather than crashing with Infinity / NaN
    expect(Number.isNaN(result.cp)).toBe(false);
    expect(Number.isNaN(result.cpk)).toBe(false);
  });

  it('correctly reports negative Cpk when process mean is shifted outside specification limits', () => {
    // USL = 10.0, LSL = 5.0, but process mean is at 12.5 (completely out of spec on upper side)
    const shiftedOutValues = [12.4, 12.5, 12.6, 12.5, 12.4];
    const result = calculateCapability(shiftedOutValues, 10.0, 5.0, 7.5);

    expect(result.overallMean).toBeGreaterThan(10.0); // mean > USL
    expect(result.cpk).toBeLessThan(0); // Cpk must be negative when mean is outside spec
  });

  it('handles extremely tight micro-tolerances (USL-LSL = 0.0002mm) with high precision', () => {
    const microValues = [1.00009, 1.00011, 1.00010, 1.00008, 1.00012];
    const usl = 1.00020;
    const lsl = 1.00000;

    const result = calculateCapability(microValues, usl, lsl, 1.00010);
    expect(Number.isFinite(result.cp)).toBe(true);
    expect(Number.isFinite(result.cpk)).toBe(true);
    expect(result.cp).toBeGreaterThan(1.0);
  });

  it('handles single sample (n=1) or minimal sample size gracefully', () => {
    const singleValue = [25.0];
    const result = calculateCapability(singleValue, 26.0, 24.0, 25.0);

    expect(result).toBeDefined();
    expect(result.overallMean).toBe(25.0);
    expect(Number.isNaN(result.overallMean)).toBe(false);
  });

  it('handles inverted specification limits (USL <= LSL) boundary safely', () => {
    const values = [10.0, 10.2, 9.8, 10.1];
    const usl = 8.0;
    const lsl = 12.0; // Inverted: USL < LSL

    const result = calculateCapability(values, usl, lsl, 10.0);
    expect(result).toBeDefined();
    // Tolerance width is negative or zero, Cpk should reflect catastrophic incapability
    expect(result.cpk).toBeLessThanOrEqual(0);
  });
});
