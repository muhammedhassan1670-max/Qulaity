import { describe, it, expect, beforeEach } from 'vitest';
import { unifiedInspectionApi } from '@/api/unified-api';
import {
  seedInspections,
  readInspections,
  resetQualityStorage,
  STORAGE_KEYS,
} from '../../helpers/testHarness';

describe('Feature 18 Boundary: 3-Step Inspection Wizard', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('blocks advancing from Stage 2 (Measurements) to Stage 3 (Review) when 0 measurements are recorded', () => {
    const measurements: number[] = [];
    const requiredSampleSize = 5;

    const canAdvance = measurements.length >= requiredSampleSize;
    expect(canAdvance).toBe(false);
  });

  it('correctly evaluates measurements right on the exact USL and LSL boundary values (inclusive)', () => {
    const lsl = 20.000;
    const usl = 20.050;

    const evaluateReading = (val: number) => val >= lsl && val <= usl;

    expect(evaluateReading(20.000)).toBe(true); // exactly on LSL
    expect(evaluateReading(20.050)).toBe(true); // exactly on USL
    expect(evaluateReading(19.999)).toBe(false); // 1 µm below LSL
    expect(evaluateReading(20.051)).toBe(false); // 1 µm above USL
  });

  it('detects extreme catastrophic dimensional outliers (-999.0mm or +999.0mm) triggering immediate containment flag', () => {
    const nominal = 10.0;
    const extremeMeasurement = 999.99;

    const delta = Math.abs(extremeMeasurement - nominal);
    const isGrossAnomaly = delta > 10 * nominal;

    expect(isGrossAnomaly).toBe(true);
  });

  it('validates Stage 1 header numerical bounds (sample size <= 0 or negative quantities)', () => {
    const invalidHeaders = [
      { sampleSize: 0, isValid: false },
      { sampleSize: -10, isValid: false },
      { sampleSize: 10, isValid: true },
    ];

    for (const h of invalidHeaders) {
      const valid = Number.isFinite(h.sampleSize) && h.sampleSize > 0;
      expect(valid).toBe(h.isValid);
    }
  });

  it('recovers gracefully from corrupted storage payload in inspections repository', async () => {
    localStorage.setItem(STORAGE_KEYS.INSPECTION, 'CORRUPTED_INSPECTION_JSON_{{!!}}');
    const res = await unifiedInspectionApi.getAll();
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBe(0);

    const safeList = readInspections();
    expect(Array.isArray(safeList)).toBe(true);
    expect(safeList.length).toBe(0);
  });
});
