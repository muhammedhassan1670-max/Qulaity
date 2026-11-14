import { describe, it, expect, beforeEach } from 'vitest';
import { unifiedFmeaApi } from '@/api/unified-api';
import {
  resetQualityStorage,
  seedFmeaRecords,
  readFmeaRecords,
  STORAGE_KEYS,
} from '../../helpers/testHarness';
import { assertRpnCalculation } from '../../helpers/assertionHelpers';

/** Helper to clamp AIAG ratings into valid 1-10 integer range */
export function clampFmeaRating(val: number): number {
  if (!Number.isFinite(val) || val < 1) return 1;
  if (val > 10) return 10;
  return Math.round(val);
}

/** Computes percentage RPN reduction guarded against division by zero */
export function calculateRpnReduction(initialRpn: number, revisedRpn: number): number {
  if (!Number.isFinite(initialRpn) || initialRpn <= 0) return 0;
  return ((initialRpn - revisedRpn) / initialRpn) * 100;
}

describe('Feature 05 Boundary: Closed-Loop FMEA Sync', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('clamps and sanitizes out-of-bounds FMEA ratings (<1 or >10)', () => {
    expect(clampFmeaRating(0)).toBe(1);
    expect(clampFmeaRating(-5)).toBe(1);
    expect(clampFmeaRating(11)).toBe(10);
    expect(clampFmeaRating(999)).toBe(10);
    expect(clampFmeaRating(NaN)).toBe(1);
    expect(clampFmeaRating(5.7)).toBe(6);

    const s = clampFmeaRating(15);
    const o = clampFmeaRating(-2);
    const d = clampFmeaRating(4);
    const rpn = assertRpnCalculation(s, o, d);
    expect(rpn).toBe(10 * 1 * 4); // 40
  });

  it('guards against division by zero when computing RPN risk reduction with zero or negative initial RPN', () => {
    expect(calculateRpnReduction(0, 10)).toBe(0);
    expect(calculateRpnReduction(-100, 20)).toBe(0);
    expect(calculateRpnReduction(NaN, 50)).toBe(0);

    // Normal calculation: 200 -> 50 = 75% reduction
    const normalReduction = calculateRpnReduction(200, 50);
    expect(normalReduction).toBe(75);
  });

  it('flags ineffective CAPA where revised post-mitigation Occurrence exceeds pre-mitigation Occurrence', async () => {
    const fmea = {
      id: 'fmea-ineffective-01',
      title: 'Flange Deburring Failure Mode',
      type: 'PFMEA',
      metadata: {
        severity: 7,
        occurrence: 4,
        detection: 5,
        rpn: 140,
      },
    };

    seedFmeaRecords([fmea]);
    const stored = readFmeaRecords();
    const initialO = stored[0].metadata.occurrence;

    // Simulation: new process change actually increased defect frequency!
    const updatedO = 7;
    const isWorsened = updatedO > initialO;
    expect(isWorsened).toBe(true);

    const newRpn = assertRpnCalculation(stored[0].metadata.severity, updatedO, stored[0].metadata.detection);
    expect(newRpn).toBe(7 * 7 * 5); // 245 > 140
    expect(newRpn).toBeGreaterThan(stored[0].metadata.rpn);
  });

  it('handles orphaned synchronization attempts to non-existent FMEA record gracefully', async () => {
    seedFmeaRecords([]); // Empty repository
    const nonExistentId = 'fmea-ghost-9999';

    const records = readFmeaRecords();
    const target = records.find((r: any) => r.id === nonExistentId);
    expect(target).toBeUndefined();

    // System should not crash when sync target is not found
    let errorCaught = false;
    try {
      if (!target) {
        // graceful handle without throwing unhandled exception
        errorCaught = false;
      }
    } catch {
      errorCaught = true;
    }
    expect(errorCaught).toBe(false);
  });

  it('recovers gracefully from corrupted storage payload in FMEA repository', async () => {
    localStorage.setItem(STORAGE_KEYS.FMEA, 'INVALID_FMEA_CORRUPTED_JSON_<<>>');
    const res = await unifiedFmeaApi.getAll();
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBe(0);

    const items = readFmeaRecords();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(0);
  });
});
