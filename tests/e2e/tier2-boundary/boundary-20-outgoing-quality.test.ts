import { describe, it, expect } from 'vitest';
import {
  evaluateOutgoingGate,
  type PreShipmentBatch,
} from '../tier1-features/feature-20-outgoing-quality.test';

describe('Feature 20 Boundary: Outgoing Quality & Pre-Shipment', () => {
  it('blocks Certificate of Conformance (CoC) and release when FPY is 99.99% (< 100.0%)', () => {
    // 9,999 passed, 1 failed out of 10,000 inspected -> FPY = 99.99%
    const nearPerfectBatch: PreShipmentBatch = {
      batchId: 'BATCH-9999',
      partNumber: 'AERO-BLADE-01',
      totalQuantity: 10_000,
      inspectedQuantity: 10_000,
      passedQuantity: 9_999,
      failedQuantity: 1,
      activeHolds: 0,
      activeEscapes: 0,
      status: 'inspecting',
      certificateOfConformanceIssued: false,
    };

    const gate = evaluateOutgoingGate(nearPerfectBatch);
    expect(gate.firstPassYieldPct).toBe(99.99);
    expect(gate.canRelease).toBe(false);
    expect(gate.canIssueCoc).toBe(false);
    expect(gate.rejectionReason).toContain('First Pass Yield (99.99%) is below mandatory 100%');
  });

  it('blocks release when zero units were inspected (inspectedQuantity = 0)', () => {
    const uninspectedBatch: PreShipmentBatch = {
      batchId: 'BATCH-UNINSPECTED',
      partNumber: 'SEAL-01',
      totalQuantity: 500,
      inspectedQuantity: 0,
      passedQuantity: 0,
      failedQuantity: 0,
      activeHolds: 0,
      activeEscapes: 0,
      status: 'inspecting',
      certificateOfConformanceIssued: false,
    };

    const gate = evaluateOutgoingGate(uninspectedBatch);
    expect(gate.firstPassYieldPct).toBe(0);
    expect(gate.canRelease).toBe(false);
    expect(gate.canIssueCoc).toBe(false);
  });

  it('strictly blocks release if activeHolds > 0 even when FPY is 100.0%', () => {
    const onHoldBatch: PreShipmentBatch = {
      batchId: 'BATCH-ON-HOLD',
      partNumber: 'VALVE-02',
      totalQuantity: 100,
      inspectedQuantity: 100,
      passedQuantity: 100,
      failedQuantity: 0,
      activeHolds: 1, // Pending regulatory audit signoff
      activeEscapes: 0,
      status: 'on-hold',
      certificateOfConformanceIssued: false,
    };

    const gate = evaluateOutgoingGate(onHoldBatch);
    expect(gate.firstPassYieldPct).toBe(100.0);
    expect(gate.canRelease).toBe(false);
    expect(gate.canIssueCoc).toBe(false);
    expect(gate.rejectionReason).toContain('Blocked by 1 active quality hold(s)');
  });

  it('strictly blocks release if activeEscapes > 0 regardless of inspected quantities', () => {
    const escapedBatch: PreShipmentBatch = {
      batchId: 'BATCH-ESCAPE-ALERT',
      partNumber: 'ROTOR-09',
      totalQuantity: 200,
      inspectedQuantity: 200,
      passedQuantity: 200,
      failedQuantity: 0,
      activeHolds: 0,
      activeEscapes: 2, // 2 escapes notified by assembly plant
      status: 'inspecting',
      certificateOfConformanceIssued: false,
    };

    const gate = evaluateOutgoingGate(escapedBatch);
    expect(gate.canRelease).toBe(false);
    expect(gate.canIssueCoc).toBe(false);
    expect(gate.rejectionReason).toContain('2 defect escape(s) reported');
  });

  it('permits clean release and CoC generation only when FPY = 100%, 0 holds, 0 escapes', () => {
    const perfectBatch: PreShipmentBatch = {
      batchId: 'BATCH-GOLD-STANDARD',
      partNumber: 'TURBINE-DISC-01',
      totalQuantity: 50,
      inspectedQuantity: 50,
      passedQuantity: 50,
      failedQuantity: 0,
      activeHolds: 0,
      activeEscapes: 0,
      status: 'inspecting',
      certificateOfConformanceIssued: false,
    };

    const gate = evaluateOutgoingGate(perfectBatch);
    expect(gate.firstPassYieldPct).toBe(100.0);
    expect(gate.canRelease).toBe(true);
    expect(gate.canIssueCoc).toBe(true);
    expect(gate.rejectionReason).toBeUndefined();
  });
});
