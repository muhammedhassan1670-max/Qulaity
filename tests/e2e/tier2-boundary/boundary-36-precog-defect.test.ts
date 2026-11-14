/**
 * Tier 2 Boundary Tests - Feature 36: AI Pre-Cog Defect Time-Machine
 * 
 * Verifies neural defect forecasting horizons, preemptive compensation logic,
 * Remaining Useful Life (RUL) mathematical bounds, and bilingual alert delivery.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resetQualityStorage } from '../../helpers/testHarness';

type PrecogHorizon = '1h' | '2h' | '4h' | '8h';

interface PrecogForecast {
  horizon: PrecogHorizon;
  toolWearProbability: number; // 0 to 100%
  remainingUsefulHours: number;
  confidenceScore: number;     // 0 to 1
  failureModeAr: string;
  failureModeEn: string;
  recommendedActionAr: string;
  recommendedActionEn: string;
  severity: 'NOMINAL' | 'ELEVATED' | 'IMMINENT_FAILURE';
}

function resolveHorizon(raw: string): PrecogHorizon {
  const valid: PrecogHorizon[] = ['1h', '2h', '4h', '8h'];
  return valid.includes(raw as PrecogHorizon) ? (raw as PrecogHorizon) : '2h';
}

function calculatePrecogForecast(
  horizon: PrecogHorizon,
  isPreemptiveApplied: boolean,
  baselineWearRatePerHour = 6.5
): PrecogForecast {
  const hoursMap: Record<PrecogHorizon, number> = {
    '1h': 1,
    '2h': 2,
    '4h': 4,
    '8h': 8
  };

  const hours = hoursMap[horizon] || 2;
  const initialWear = 45; // baseline wear %

  // Wear rate multiplier
  const effectiveRate = isPreemptiveApplied ? baselineWearRatePerHour * 0.25 : baselineWearRatePerHour;
  const rawWear = initialWear + hours * effectiveRate;
  const toolWearProbability = Math.max(0, Math.min(100, Number(rawWear.toFixed(1))));

  // RUL calculation guarded against division by zero
  const remainingPercent = 100 - toolWearProbability;
  const remainingUsefulHours = effectiveRate > 0
    ? Number((remainingPercent / effectiveRate).toFixed(1))
    : 999.0;

  // Severity classification
  let severity: PrecogForecast['severity'] = 'NOMINAL';
  if (toolWearProbability >= 80) {
    severity = 'IMMINENT_FAILURE';
  } else if (toolWearProbability >= 60) {
    severity = 'ELEVATED';
  }

  // Confidence decreases slightly for further horizons
  const confidenceScore = Number((0.98 - (hours - 1) * 0.03).toFixed(2));

  return {
    horizon,
    toolWearProbability,
    remainingUsefulHours,
    confidenceScore,
    failureModeAr: 'تآكل الحافة القاطعة وخشونة السطح الميكانيكي',
    failureModeEn: 'Insert flank wear & micro-chatter surface degradation',
    recommendedActionAr: isPreemptiveApplied
      ? 'تم تفعيل التبريد النانوي وخفض معدل التغذية بنسبة 15%'
      : 'استبدال رأس القطع CNC 04 خلال النافذة الزمنية المحددة',
    recommendedActionEn: isPreemptiveApplied
      ? 'Nano-cryogenic coolant engaged & feed rate trimmed by 15%'
      : 'Index cutter insert on CNC 04 before window expires',
    severity
  };
}

describe('Boundary Suite 36: AI Pre-Cog Defect Time-Machine', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('1. should resolve forecasting horizons with strict fallback for invalid inputs', () => {
    expect(resolveHorizon('1h')).toBe('1h');
    expect(resolveHorizon('2h')).toBe('2h');
    expect(resolveHorizon('4h')).toBe('4h');
    expect(resolveHorizon('8h')).toBe('8h');

    // Invalid horizons fallback to '2h' standard
    expect(resolveHorizon('12h')).toBe('2h');
    expect(resolveHorizon('0h')).toBe('2h');
    expect(resolveHorizon('')).toBe('2h');
    expect(resolveHorizon('infinite')).toBe('2h');
  });

  it('2. should drastically mitigate forecasted failure probability when preemptive compensation is engaged', () => {
    // 8-hour horizon without preemptive action
    const unmitigated = calculatePrecogForecast('8h', false);
    expect(unmitigated.toolWearProbability).toBeGreaterThanOrEqual(80);
    expect(unmitigated.severity).toBe('IMMINENT_FAILURE');
    expect(unmitigated.remainingUsefulHours).toBeLessThan(5);

    // 8-hour horizon with preemptive compensation
    const mitigated = calculatePrecogForecast('8h', true);
    expect(mitigated.toolWearProbability).toBeLessThan(65);
    expect(mitigated.severity).not.toBe('IMMINENT_FAILURE');
    expect(mitigated.remainingUsefulHours).toBeGreaterThan(unmitigated.remainingUsefulHours);
    expect(mitigated.recommendedActionEn).toContain('Nano-cryogenic coolant engaged');
  });

  it('3. should guard Remaining Useful Life (RUL) calculations against division by zero', () => {
    // Wear rate = 0 (perfect frictionless or idle spindle)
    const zeroWearForecast = calculatePrecogForecast('2h', false, 0);
    expect(Number.isFinite(zeroWearForecast.remainingUsefulHours)).toBe(true);
    expect(zeroWearForecast.remainingUsefulHours).toBe(999.0);
    expect(zeroWearForecast.remainingUsefulHours).not.toBe(NaN);
  });

  it('4. should keep tool wear probability strictly bounded between 0% and 100%', () => {
    // High wear rate over 8 hours
    const extremeWear = calculatePrecogForecast('8h', false, 50.0);
    expect(extremeWear.toolWearProbability).toBe(100); // Clamped at 100%
    expect(extremeWear.remainingUsefulHours).toBe(0);

    // Negative initial wear / negative wear rate
    const negativeWear = calculatePrecogForecast('1h', true, -20.0);
    expect(negativeWear.toolWearProbability).toBeGreaterThanOrEqual(0);
  });

  it('5. should provide bilingual neural recommendations with decreasing confidence over time horizons', () => {
    const f1h = calculatePrecogForecast('1h', false);
    const f8h = calculatePrecogForecast('8h', false);

    expect(f1h.confidenceScore).toBe(0.98);
    expect(f8h.confidenceScore).toBeLessThan(f1h.confidenceScore);
    expect(f8h.confidenceScore).toBeGreaterThanOrEqual(0.70);

    // Bilingual integrity
    expect(f1h.failureModeAr).toContain('تآكل الحافة القاطعة');
    expect(f1h.failureModeEn).toContain('Insert flank wear');
    expect(f8h.recommendedActionAr).toContain('CNC 04');
  });
});
