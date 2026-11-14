import { describe, it, expect } from 'vitest';
import { calculateCapability } from '@/services/spcEngine';
import { assertCpkThreshold } from '../../helpers/assertionHelpers';

describe('Feature 10: Process Capability Indices (Cp, Cpk, Pp, Ppk)', () => {
  it('computes bilateral capability for well-centered process achieving aerospace grade (Cpk >= 1.67)', () => {
    // Nominal 50.00, USL 50.30, LSL 49.70 (Tolerance width = 0.60)
    // Generating tightly clustered data around 50.00 with sigma ~ 0.045
    // 6 * 0.045 = 0.27 -> Cp = 0.60 / 0.27 ~ 2.22
    const centeredValues = [
      49.98, 50.02, 50.01, 49.99, 50.00,
      50.03, 49.97, 50.01, 50.00, 50.02,
      49.99, 50.01, 50.00, 49.98, 50.02,
      50.01, 49.99, 50.00, 50.03, 49.97,
    ];

    const result = calculateCapability(centeredValues, 50.30, 49.70, 50.00);

    expect(result.cp).toBeGreaterThan(2.0);
    expect(result.cpk).toBeGreaterThan(1.67);
    assertCpkThreshold(result.cpk, 1.67, 'Aerospace Centered Cpk');
  });

  it('detects process off-center shift: Cp remains high while Cpk degrades below 1.33 threshold', () => {
    // Shifted data toward USL (Mean ~ 50.27, USL 50.30, LSL 49.70)
    const shiftedValues = [
      50.26, 50.27, 50.28, 50.26, 50.27,
      50.27, 50.28, 50.26, 50.27, 50.27,
      50.28, 50.26, 50.27, 50.28, 50.27,
    ];

    const result = calculateCapability(shiftedValues, 50.30, 49.70, 50.00);

    // Spread is still tight, so potential capability Cp is high
    expect(result.cp).toBeGreaterThan(2.0);
    // But distance to USL is only 0.03, so Cpk is heavily degraded (< 1.33)
    expect(result.cpk).toBeLessThan(1.33);
  });

  it('evaluates unilateral specification limits (upper-spec only and lower-spec only)', () => {
    const roughnessValues = [0.42, 0.45, 0.39, 0.48, 0.41, 0.44]; // USL = 0.80 µm (Lower limit not applicable)
    const upperResult = calculateCapability(roughnessValues, 0.80, null);
    expect(upperResult.cpk).toBeGreaterThan(1.5);
    expect(upperResult.usl).toBe(0.80);
    expect(upperResult.lsl).toBe(0);

    const tensileValues = [620, 635, 615, 640, 625]; // LSL = 550 MPa (Upper limit not applicable)
    const lowerResult = calculateCapability(tensileValues, null, 550);
    expect(lowerResult.cpk).toBeGreaterThan(1.5);
    expect(lowerResult.lsl).toBe(550);
    expect(lowerResult.usl).toBe(0);
  });

  it('computes Taguchi Cpm index evaluating financial loss against nominal target', () => {
    // Target 25.00
    const onTargetValues = [25.01, 24.99, 25.00, 25.02, 24.98];
    const offTargetValues = [25.15, 25.18, 25.14, 25.16, 25.17];

    const resOnTarget = calculateCapability(onTargetValues, 25.50, 24.50, 25.00);
    const resOffTarget = calculateCapability(offTargetValues, 25.50, 24.50, 25.00);

    expect(resOnTarget.cpm).toBeDefined();
    expect(resOffTarget.cpm).toBeDefined();
    expect(resOnTarget.cpm!).toBeGreaterThan(resOffTarget.cpm!);
  });

  it('calculates long-term overall capability (Pp, Ppk) alongside confidence intervals', () => {
    const sample = Array.from({ length: 30 }, (_, i) => 10.0 + 0.1 * Math.sin(i));
    const result = calculateCapability(sample, 10.5, 9.5, 10.0);

    expect(result.pp).toBeGreaterThan(0);
    expect(result.ppk).toBeGreaterThan(0);
    expect(result.ciCp).toBeDefined();
    expect(result.ciCp.lower).toBeLessThan(result.cp);
    expect(result.ciCp.upper).toBeGreaterThan(result.cp);
  });
});
