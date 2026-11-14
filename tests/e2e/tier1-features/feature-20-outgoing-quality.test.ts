import { describe, it, expect, beforeEach } from 'vitest';
import { resetQualityStorage } from '../../helpers/testHarness';

export interface PreShipmentBatch {
  batchId: string;
  partNumber: string;
  totalQuantity: number;
  inspectedQuantity: number;
  passedQuantity: number;
  failedQuantity: number;
  activeHolds: number;
  activeEscapes: number;
  status: 'inspecting' | 'on-hold' | 'released' | 'shipped';
  certificateOfConformanceIssued: boolean;
}

export function evaluateOutgoingGate(batch: PreShipmentBatch): {
  canRelease: boolean;
  canIssueCoc: boolean;
  firstPassYieldPct: number;
  rejectionReason?: string;
} {
  const fpy = batch.inspectedQuantity > 0
    ? Number(((batch.passedQuantity / batch.inspectedQuantity) * 100).toFixed(2))
    : 0;

  if (batch.activeHolds > 0) {
    return {
      canRelease: false,
      canIssueCoc: false,
      firstPassYieldPct: fpy,
      rejectionReason: `Blocked by ${batch.activeHolds} active quality hold(s)`,
    };
  }

  if (batch.activeEscapes > 0) {
    return {
      canRelease: false,
      canIssueCoc: false,
      firstPassYieldPct: fpy,
      rejectionReason: `Critical: ${batch.activeEscapes} defect escape(s) reported`,
    };
  }

  if (batch.failedQuantity > 0 || fpy < 100.0) {
    return {
      canRelease: false,
      canIssueCoc: false,
      firstPassYieldPct: fpy,
      rejectionReason: `First Pass Yield (${fpy}%) is below mandatory 100% pre-shipment gate requirement`,
    };
  }

  return {
    canRelease: true,
    canIssueCoc: true,
    firstPassYieldPct: fpy,
  };
}

describe('Feature 20: Outgoing Quality & Pre-Shipment', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('allows release and generates Certificate of Conformance (CoC) when 100% First Pass Yield is achieved', () => {
    const perfectBatch: PreShipmentBatch = {
      batchId: 'BATCH-2026-OUT-01',
      partNumber: 'PART-ACT-1001',
      totalQuantity: 50,
      inspectedQuantity: 50,
      passedQuantity: 50,
      failedQuantity: 0,
      activeHolds: 0,
      activeEscapes: 0,
      status: 'inspecting',
      certificateOfConformanceIssued: false,
    };

    const evaluation = evaluateOutgoingGate(perfectBatch);
    expect(evaluation.canRelease).toBe(true);
    expect(evaluation.canIssueCoc).toBe(true);
    expect(evaluation.firstPassYieldPct).toBe(100.0);
    expect(evaluation.rejectionReason).toBeUndefined();
  });

  it('blocks shipment and CoC generation if any unit fails outgoing inspection (FPY < 100%)', () => {
    const imperfectBatch: PreShipmentBatch = {
      batchId: 'BATCH-2026-OUT-02',
      partNumber: 'PART-PNL-3003',
      totalQuantity: 100,
      inspectedQuantity: 100,
      passedQuantity: 99,
      failedQuantity: 1, // 1 scratch defect
      activeHolds: 0,
      activeEscapes: 0,
      status: 'inspecting',
      certificateOfConformanceIssued: false,
    };

    const evaluation = evaluateOutgoingGate(imperfectBatch);
    expect(evaluation.canRelease).toBe(false);
    expect(evaluation.canIssueCoc).toBe(false);
    expect(evaluation.firstPassYieldPct).toBe(99.0);
    expect(evaluation.rejectionReason).toContain('below mandatory 100%');
  });

  it('strictly blocks release when batch has an active engineering or quality hold', () => {
    const onHoldBatch: PreShipmentBatch = {
      batchId: 'BATCH-2026-OUT-03',
      partNumber: 'PART-MED-4004',
      totalQuantity: 500,
      inspectedQuantity: 500,
      passedQuantity: 500,
      failedQuantity: 0,
      activeHolds: 1, // Quality hold pending lab bioburden test results
      activeEscapes: 0,
      status: 'on-hold',
      certificateOfConformanceIssued: false,
    };

    const evaluation = evaluateOutgoingGate(onHoldBatch);
    expect(evaluation.canRelease).toBe(false);
    expect(evaluation.canIssueCoc).toBe(false);
    expect(evaluation.rejectionReason).toContain('Blocked by 1 active quality hold');
  });

  it('triggers emergency containment when defect escape is detected at outgoing dock', () => {
    const escapedBatch: PreShipmentBatch = {
      batchId: 'BATCH-2026-OUT-04',
      partNumber: 'PART-BLD-2002',
      totalQuantity: 20,
      inspectedQuantity: 20,
      passedQuantity: 20,
      failedQuantity: 0,
      activeHolds: 0,
      activeEscapes: 1, // Customer notified of defect escape in sister lot
      status: 'inspecting',
      certificateOfConformanceIssued: false,
    };

    const evaluation = evaluateOutgoingGate(escapedBatch);
    expect(evaluation.canRelease).toBe(false);
    expect(evaluation.canIssueCoc).toBe(false);
    expect(evaluation.rejectionReason).toContain('Critical: 1 defect escape');
  });

  it('completes transition cycle: Inspecting -> Released -> CoC Issued -> Shipped', () => {
    const batch: PreShipmentBatch = {
      batchId: 'BATCH-2026-OUT-05',
      partNumber: 'PART-ACT-1001',
      totalQuantity: 30,
      inspectedQuantity: 30,
      passedQuantity: 30,
      failedQuantity: 0,
      activeHolds: 0,
      activeEscapes: 0,
      status: 'inspecting',
      certificateOfConformanceIssued: false,
    };

    // Step 1: Pre-shipment gate evaluation
    const evaluation = evaluateOutgoingGate(batch);
    expect(evaluation.canRelease).toBe(true);

    // Step 2: Release batch and issue CoC
    batch.status = 'released';
    batch.certificateOfConformanceIssued = true;
    expect(batch.status).toBe('released');
    expect(batch.certificateOfConformanceIssued).toBe(true);

    // Step 3: Dispatch to freight forwarder
    batch.status = 'shipped';
    expect(batch.status).toBe('shipped');
  });
});
