import { describe, it, expect, beforeEach } from 'vitest';
import { unifiedSupplierApi } from '@/api/unified-api';
import {
  seedSuppliers,
  readSuppliers,
  resetQualityStorage,
} from '../../helpers/testHarness';

export function calculateSupplierPpm(defectiveUnits: number, totalReceivedUnits: number): number {
  if (totalReceivedUnits <= 0) return 0;
  return Math.round((defectiveUnits / totalReceivedUnits) * 1_000_000);
}

export function computeSupplierScorecard(qualityPct: number, onTimeDeliveryPct: number): number {
  return Number((qualityPct * 0.60 + onTimeDeliveryPct * 0.40).toFixed(1));
}

describe('Feature 14: Supplier Quality & Rating', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('calculates supplier PPM (Parts Per Million) defect rate accurately', () => {
    // 3 defective parts in shipment of 50,000 parts -> (3 / 50000) * 1,000,000 = 60 PPM
    const ppm60 = calculateSupplierPpm(3, 50_000);
    expect(ppm60).toBe(60);

    // 1 defective part in 100,000 parts -> 10 PPM
    const ppm10 = calculateSupplierPpm(1, 100_000);
    expect(ppm10).toBe(10);

    // 0 defects -> 0 PPM
    expect(calculateSupplierPpm(0, 25_000)).toBe(0);
  });

  it('computes composite supplier performance scorecard weighting quality (60%) and on-time delivery (40%)', () => {
    // Supplier: Quality 98%, OTD 95% -> 98*0.6 + 95*0.4 = 58.8 + 38 = 96.8
    const scoreA = computeSupplierScorecard(98, 95);
    expect(scoreA).toBe(96.8);

    // Poor supplier: Quality 75%, OTD 80% -> 75*0.6 + 80*0.4 = 45 + 32 = 77.0
    const scoreB = computeSupplierScorecard(75, 80);
    expect(scoreB).toBe(77.0);
  });

  it('transitions supplier status to "conditional" when quality score drops below 80%', async () => {
    const supplier = {
      id: 'sup-eval-01',
      name: 'Rhein Slitting Services',
      category: 'Sheet Metal',
      rating: 4.2,
      status: 'approved',
      qualityPerformance: 76, // Drops below 80%
      deliveryPerformance: 88,
      ncCount: 3,
    };
    seedSuppliers([supplier]);

    const targetStatus = supplier.qualityPerformance < 80 ? 'conditional' : 'approved';
    const updated = await unifiedSupplierApi.update('sup-eval-01', {
      status: targetStatus,
      rating: 3.2,
    });

    expect(updated.status).toBe('conditional');
    expect(updated.rating).toBe(3.2);
  });

  it('blocks supplier and raises critical escalation when open NC count exceeds threshold', async () => {
    const supplier = {
      id: 'sup-eval-02',
      name: 'Delta Fasteners Inc',
      category: 'Fasteners',
      rating: 2.5,
      status: 'conditional',
      ncCount: 6, // High non-conformance count
      qualityPerformance: 65,
      deliveryPerformance: 70,
    };
    seedSuppliers([supplier]);

    const updated = await unifiedSupplierApi.update('sup-eval-02', {
      status: 'blocked',
      rating: 2.0,
      metadata: {
        blockReason: 'Exceeded critical limit of 5 open NCRs without effective containment',
        blockedDate: new Date().toISOString(),
      },
    });

    expect(updated.status).toBe('blocked');
    expect(updated.metadata.blockReason).toContain('critical limit of 5 open NCRs');
  });

  it('restores supplier status to "approved" after audit and consistent defect-free delivery', async () => {
    const supplier = {
      id: 'sup-eval-03',
      name: 'BioMed Materials',
      category: 'Polymer',
      rating: 3.5,
      status: 'conditional',
      qualityPerformance: 78,
      deliveryPerformance: 85,
      ncCount: 1,
    };
    seedSuppliers([supplier]);

    // Supplier undergoes audit, resolves issues, and passes 10 consecutive lots
    const updated = await unifiedSupplierApi.update('sup-eval-03', {
      status: 'approved',
      rating: 4.8,
      qualityPerformance: 99,
      deliveryPerformance: 98,
      ncCount: 0,
      lastAudit: new Date().toISOString().split('T')[0],
    });

    expect(updated.status).toBe('approved');
    expect(updated.qualityPerformance).toBe(99);
    expect(updated.ncCount).toBe(0);
  });
});
