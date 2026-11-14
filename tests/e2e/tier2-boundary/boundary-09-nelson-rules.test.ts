import { describe, it, expect } from 'vitest';
import { checkNelsonRules } from '@/services/spcEngine';

describe('Feature 09 Boundary: Nelson Rules 1–8 Engine', () => {
  const CL = 100.0;
  const SIGMA = 5.0;

  it('handles empty points array and single point without throwing', () => {
    const emptyResult = checkNelsonRules([], CL, SIGMA);
    expect(Array.isArray(emptyResult)).toBe(true);
    expect(emptyResult.length).toBe(0);

    const singleResult = checkNelsonRules([100.0], CL, SIGMA);
    expect(Array.isArray(singleResult)).toBe(true);
    expect(singleResult.length).toBe(0);
  });

  it('prevents false positive rule triggers on short sequences below rule sample requirements', () => {
    // 8 consecutive points on same side: Rule 2 requires 9 points -> should NOT trigger Rule 2
    const eightPoints = [102, 103, 101, 104, 102, 103, 102, 101];
    const res8 = checkNelsonRules(eightPoints, CL, SIGMA);
    expect(res8.some((v) => v.rule === 2)).toBe(false);

    // 5 consecutive increasing points: Rule 3 requires 6 points -> should NOT trigger Rule 3
    const fiveIncreasing = [98, 99, 100, 101, 102];
    const res5 = checkNelsonRules(fiveIncreasing, CL, SIGMA);
    expect(res5.some((v) => v.rule === 3)).toBe(false);

    // 13 alternating points: Rule 4 requires 14 points -> should NOT trigger Rule 4
    const thirteenAlternating = [99, 101, 99, 101, 99, 101, 99, 101, 99, 101, 99, 101, 99];
    const res13 = checkNelsonRules(thirteenAlternating, CL, SIGMA);
    expect(res13.some((v) => v.rule === 4)).toBe(false);
  });

  it('handles zero sigma (all points identical and equal to center line) without division by zero', () => {
    const identicalPoints = [100.0, 100.0, 100.0, 100.0, 100.0];
    const res = checkNelsonRules(identicalPoints, CL, 0);

    expect(Array.isArray(res)).toBe(true);
    // When sigma is 0 and points equal CL, no point should be an outlier
    expect(res.some((v) => v.rule === 1)).toBe(false);
  });

  it('tests exact boundary tolerances at 3-sigma limit (Rule 1 boundary)', () => {
    // Points exactly at or just inside/outside 3*sigma = 15.0 (CL=100 -> boundary = 115.0)
    const exactBoundary = 115.0; // exactly at 3-sigma
    const justOutside = 115.001; // just beyond 3-sigma

    const insideRes = checkNelsonRules([100, 100, exactBoundary], CL, SIGMA);
    const outsideRes = checkNelsonRules([100, 100, justOutside], CL, SIGMA);

    expect(outsideRes.some((v) => v.rule === 1)).toBe(true);
  });

  it('handles negative measurements and negative center line in Nelson rule evaluation', () => {
    const negCL = -50.0;
    const negSIGMA = 2.0;

    // 9 consecutive points on same side of negative CL (all greater than -50.0, e.g. -48.0)
    const negShift = [-48, -47, -48.5, -46, -48, -47.5, -48, -47, -48];
    const res = checkNelsonRules(negShift, negCL, negSIGMA);

    expect(res.some((v) => v.rule === 2)).toBe(true);
  });
});
