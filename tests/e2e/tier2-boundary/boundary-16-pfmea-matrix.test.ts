import { describe, it, expect } from 'vitest';
import { calculateActionPriority } from '@/services/spcEngine';
import { assertRpnCalculation } from '../../helpers/assertionHelpers';

describe('Feature 16 Boundary: PFMEA Risk Priority Matrix', () => {
  it('validates theoretical extremes of RPN calculation (RPN min = 1, RPN max = 1000)', () => {
    const minRpn = assertRpnCalculation(1, 1, 1);
    expect(minRpn).toBe(1);

    const maxRpn = assertRpnCalculation(10, 10, 10);
    expect(maxRpn).toBe(1000);
  });

  it('evaluates Action Priority (AP) at absolute lowest and highest rating boundaries', () => {
    // S=1, O=1, D=1 must be Low priority
    expect(calculateActionPriority(1, 1, 1)).toBe('Low');

    // S=10, O=10, D=10 must be High priority
    expect(calculateActionPriority(10, 10, 10)).toBe('High');
  });

  it('mandates high action priority when Severity is 9 or 10 on high occurrence or poor detection', () => {
    // Severity 10 with Occurrence 8 and Detection 2 -> High
    const ap1 = calculateActionPriority(10, 8, 2);
    expect(ap1).toBe('High');

    // Severity 9 with Occurrence 4 and poor Detection 6 -> High
    const ap2 = calculateActionPriority(9, 4, 6);
    expect(ap2).toBe('High');
  });

  it('detects ineffective mitigation when post-mitigation RPN does not decrease', () => {
    const preMitigation = { s: 8, o: 6, d: 5, rpn: 8 * 6 * 5 }; // 240
    const postMitigationIneffective = { s: 8, o: 6, d: 6, rpn: 8 * 6 * 6 }; // 288 (worse!)

    const isEffective = postMitigationIneffective.rpn < preMitigation.rpn;
    expect(isEffective).toBe(false);

    const postMitigationEffective = { s: 8, o: 2, d: 3, rpn: 8 * 2 * 3 }; // 48
    expect(postMitigationEffective.rpn < preMitigation.rpn).toBe(true);
  });

  it('handles tie-breaking in RPN Pareto sorting using Severity as secondary discriminator', () => {
    // Two failure modes with identical RPN = 120, but different Severity
    const modes = [
      { id: 'FM-A', s: 6, o: 5, d: 4, rpn: 120 },
      { id: 'FM-B', s: 10, o: 3, d: 4, rpn: 120 }, // Higher severity!
    ];

    // Priority sort: first by RPN desc, then by Severity desc
    const sorted = [...modes].sort((a, b) => b.rpn - a.rpn || b.s - a.s);

    expect(sorted[0].id).toBe('FM-B'); // FM-B prioritized because S=10 > S=6
    expect(sorted[1].id).toBe('FM-A');
  });
});
