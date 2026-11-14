import { describe, it, expect } from 'vitest';
import { calculateActionPriority } from '@/services/spcEngine';
import { assertRpnCalculation } from '../../helpers/assertionHelpers';

describe('Feature 16: PFMEA Risk Priority Matrix', () => {
  it('calculates classic RPN = S x O x D and categorizes risk levels correctly', () => {
    // Critical: S=10, O=6, D=4 -> RPN = 240
    const rpnCrit = assertRpnCalculation(10, 6, 4, 240);
    expect(rpnCrit).toBeGreaterThanOrEqual(200);

    // High: S=8, O=4, D=4 -> RPN = 128
    const rpnHigh = assertRpnCalculation(8, 4, 4, 128);
    expect(rpnHigh).toBeGreaterThanOrEqual(100);
    expect(rpnHigh).toBeLessThan(200);

    // Moderate: S=6, O=3, D=4 -> RPN = 72
    const rpnMod = assertRpnCalculation(6, 3, 4, 72);
    expect(rpnMod).toBeGreaterThanOrEqual(50);
    expect(rpnMod).toBeLessThan(100);

    // Low: S=4, O=2, D=3 -> RPN = 24
    const rpnLow = assertRpnCalculation(4, 2, 3, 24);
    expect(rpnLow).toBeLessThan(50);
  });

  it('evaluates AIAG-VDA Action Priority (AP) for high-severity hazards (Severity 9-10)', () => {
    // Severity 10 (Safety hazard), Occurrence 8, Detection 6 -> Must be AP: High
    expect(calculateActionPriority(10, 8, 6)).toBe('High');

    // Severity 9, Occurrence 4, Detection 6 -> AP: High
    expect(calculateActionPriority(9, 4, 6)).toBe('High');

    // Severity 9, Occurrence 2, Detection 1 (Poka-Yoke + low occurrence) -> AP: Low
    expect(calculateActionPriority(9, 2, 1)).toBe('Low');
  });

  it('evaluates AIAG-VDA Action Priority (AP) across intermediate severity ratings (Severity 5-8)', () => {
    // Severity 8, Occurrence 7, Detection 5 -> AP: High
    expect(calculateActionPriority(8, 7, 5)).toBe('High');

    // Severity 7, Occurrence 3, Detection 5 -> AP: Medium
    expect(calculateActionPriority(7, 3, 5)).toBe('Medium');

    // Severity 5, Occurrence 2, Detection 2 -> AP: Low
    expect(calculateActionPriority(5, 2, 2)).toBe('Low');
  });

  it('ranks multiple failure modes in descending RPN Pareto order', () => {
    const failureModes = [
      { id: 'FM-1', title: 'Flange Burrs', s: 4, o: 3, d: 2, rpn: 24 },
      { id: 'FM-2', title: 'Hydraulic Cylinder Crack', s: 10, o: 5, d: 4, rpn: 200 },
      { id: 'FM-3', title: 'Paint Discoloration', s: 3, o: 4, d: 3, rpn: 36 },
      { id: 'FM-4', title: 'Main Bore Ovality', s: 8, o: 4, d: 4, rpn: 128 },
    ];

    const sorted = [...failureModes].sort((a, b) => b.rpn - a.rpn);

    expect(sorted[0].id).toBe('FM-2'); // RPN 200
    expect(sorted[1].id).toBe('FM-4'); // RPN 128
    expect(sorted[2].id).toBe('FM-3'); // RPN 36
    expect(sorted[3].id).toBe('FM-1'); // RPN 24
  });

  it('clamps out-of-range ratings into valid 1-10 integer boundaries', () => {
    // Value > 10 clamped to 10
    expect(calculateActionPriority(15, 12, 11)).toBe(calculateActionPriority(10, 10, 10));

    // Value < 1 clamped to 1
    expect(calculateActionPriority(-5, 0, 0.5)).toBe(calculateActionPriority(1, 1, 1));
  });
});
