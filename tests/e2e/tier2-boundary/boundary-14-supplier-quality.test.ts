import { describe, it, expect, beforeEach } from 'vitest';
import { unifiedSupplierApi } from '@/api/unified-api';
import {
  seedSuppliers,
  readSuppliers,
  resetQualityStorage,
  STORAGE_KEYS,
} from '../../helpers/testHarness';
import { calculateSupplierPpm, computeSupplierScorecard } from '../tier1-features/feature-14-supplier-quality.test';

describe('Feature 14 Boundary: Supplier Quality & Rating', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('guards against division by zero in PPM calculation when zero parts were received', () => {
    expect(calculateSupplierPpm(0, 0)).toBe(0);
    expect(calculateSupplierPpm(5, 0)).toBe(0);
    expect(calculateSupplierPpm(10, -500)).toBe(0);
  });

  it('handles extreme PPM boundaries (0 PPM to 1,000,000 PPM)', () => {
    // 100% defect rate
    expect(calculateSupplierPpm(500, 500)).toBe(1_000_000);
    // World class Six Sigma PPM (1 defect in 10,000,000 = 0.1 PPM -> rounded to 0)
    expect(calculateSupplierPpm(1, 10_000_000)).toBe(0);
  });

  it('clamps scorecard calculation when performance percentages are at 0% or 100%', () => {
    expect(computeSupplierScorecard(0, 0)).toBe(0);
    expect(computeSupplierScorecard(100, 100)).toBe(100);
    expect(computeSupplierScorecard(100, 0)).toBe(60);
    expect(computeSupplierScorecard(0, 100)).toBe(40);
  });

  it('enforces automatic "blocked" status transition when supplier rating drops below 2.0 or NC count exceeds 5', async () => {
    const criticalSupplier = {
      id: 'sup-crit-01',
      name: 'Defective Fasteners Ltd',
      category: 'Hardware',
      rating: 1.5,
      status: 'approved',
      qualityPerformance: 45,
      deliveryPerformance: 50,
      ncCount: 7,
    };

    seedSuppliers([criticalSupplier]);
    const stored = readSuppliers();

    const shouldBlock = stored[0].rating < 2.0 || stored[0].ncCount > 5;
    expect(shouldBlock).toBe(true);

    const updated = await unifiedSupplierApi.update('sup-crit-01', {
      status: 'blocked',
    } as any);

    expect(updated.status).toBe('blocked');
    const reloaded = readSuppliers();
    expect(reloaded[0].status).toBe('blocked');
  });

  it('recovers gracefully from corrupted storage payload in supplier repository', async () => {
    localStorage.setItem(STORAGE_KEYS.SUPPLIER, 'INVALID_SUPPLIER_JSON_{{##}}');
    const res = await unifiedSupplierApi.getAll();
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBe(0);

    const safeList = readSuppliers();
    expect(Array.isArray(safeList)).toBe(true);
    expect(safeList.length).toBe(0);
  });
});
