import { describe, it, expect } from 'vitest';
import { checkNelsonRules } from '@/services/spcEngine';
import { assertNelsonRuleViolation } from '../../helpers/assertionHelpers';

describe('Feature 09: Nelson Rules 1–8 Engine', () => {
  const CL = 50.0;
  const SIGMA = 2.0;

  it('detects Rule 1: One point beyond 3 sigma from center line (Outlier)', () => {
    // Normal points with one beyond 3*2.0 = 6.0 (CL + 6 = 56.0)
    const points = [50.1, 49.8, 50.3, 56.5, 49.9, 50.2];
    const violations = checkNelsonRules(points, CL, SIGMA);

    assertNelsonRuleViolation(violations, 1);
    const rule1 = violations.find((v) => v.rule === 1)!;
    expect(rule1.index).toBe(3);
    expect(rule1.description).toContain('Rule 1');
  });

  it('detects Rule 2: 9 consecutive points on same side of center line (Process Shift)', () => {
    // 9 consecutive points above CL (50.0)
    const shiftPoints = [51.2, 51.5, 52.0, 50.8, 51.1, 51.9, 52.3, 51.4, 51.0];
    const violations = checkNelsonRules(shiftPoints, CL, SIGMA);

    assertNelsonRuleViolation(violations, 2);
    const rule2 = violations.find((v) => v.rule === 2)!;
    expect(rule2.index).toBe(8);
    expect(rule2.description).toContain('Shift');
  });

  it('detects Rule 3: 6 consecutive points steadily increasing or decreasing (Trend)', () => {
    // 6 strictly increasing points
    const trendPoints = [48.0, 48.5, 49.2, 49.8, 50.5, 51.2];
    const violations = checkNelsonRules(trendPoints, CL, SIGMA);

    assertNelsonRuleViolation(violations, 3);
    const rule3 = violations.find((v) => v.rule === 3)!;
    expect(rule3.index).toBe(5);
    expect(rule3.description).toContain('Trend');
  });

  it('detects Rule 4: 14 consecutive points alternating up and down (Over-control / Sawtooth)', () => {
    // 14 strictly alternating points: up, down, up, down...
    const alternating = [
      49, 51, 49, 51, 49, 51, 49, 51, 49, 51, 49, 51, 49, 51,
    ];
    const violations = checkNelsonRules(alternating, CL, SIGMA);

    assertNelsonRuleViolation(violations, 4);
    const rule4 = violations.find((v) => v.rule === 4)!;
    expect(rule4.index).toBe(13);
    expect(rule4.description).toContain('alternating');
  });

  it('detects Rule 5 & Rule 6 (Zone A and Zone B warnings)', () => {
    // Rule 5: 2 out of 3 points > 2σ (CL + 2*2 = 54.0)
    const zoneAPoints = [50.0, 54.5, 54.8];
    const violationsR5 = checkNelsonRules(zoneAPoints, CL, SIGMA);
    assertNelsonRuleViolation(violationsR5, 5);

    // Rule 6: 4 out of 5 points > 1σ (CL + 1*2 = 52.0)
    const zoneBPoints = [52.5, 52.8, 50.2, 53.0, 52.9];
    const violationsR6 = checkNelsonRules(zoneBPoints, CL, SIGMA);
    assertNelsonRuleViolation(violationsR6, 6);
  });

  it('detects Rule 7 (Stratification) and Rule 8 (Mixture Pattern)', () => {
    // Rule 7: 15 consecutive points within 1σ (|p - CL| < 2.0)
    const stratificationPoints = Array.from({ length: 15 }, () => 50.2);
    const violationsR7 = checkNelsonRules(stratificationPoints, CL, SIGMA);
    assertNelsonRuleViolation(violationsR7, 7);

    // Rule 8: 8 consecutive points with none within 1σ
    const mixturePoints = [53.5, 46.2, 53.8, 45.9, 54.0, 46.1, 53.6, 45.8];
    const violationsR8 = checkNelsonRules(mixturePoints, CL, SIGMA);
    assertNelsonRuleViolation(violationsR8, 8);
  });
});
