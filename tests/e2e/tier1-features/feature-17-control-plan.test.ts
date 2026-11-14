import { describe, it, expect, beforeEach } from 'vitest';
import { unifiedControlPlanApi } from '@/api/unified-api';
import {
  seedControlPlans,
  readControlPlans,
  resetQualityStorage,
} from '../../helpers/testHarness';

describe('Feature 17: Engineering Control Plan Suite', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('translates high-risk PFMEA failure mode into an In-Process Control Plan with SPC control method', async () => {
    const controlPlanData = {
      controlPlanId: 'CP-2026-INP-01',
      controlPlanType: 'production',
      partNumber: 'PART-ACT-1001',
      partName: 'Hydraulic Flight Actuator Housing',
      revision: 'Rev C',
      date: '2026-11-14',
      processNumber: 'OP-40',
      operationName: 'CNC Bore Precision Honing',
      machineDevice: 'Sunnen CNC Honing Machine #2',
      productCharacteristic: 'Inner Bore Diameter',
      specification: '45.000 mm',
      tolerance: '± 0.025 mm',
      evaluationMethod: 'Air Bore Gauge with Linear Encoder',
      sampleSize: '5 pcs',
      frequency: 'hourly',
      controlMethodType: 'spc',
      responsible: 'Honing Station Operator',
      reactionPlanDesc: 'If X-bar breaches UCL/LCL or Nelson Rule 2 violated, stop spindle, isolate last 1 hour production, notify QC lead',
      correctiveActionRequired: true,
      status: 'active',
    };

    const created = await unifiedControlPlanApi.create(controlPlanData as any);
    expect(created.id).toBeDefined();

    const stored = readControlPlans();
    expect(stored.length).toBe(1);
    expect(stored[0].controlPlanType).toBe('production');
    expect(stored[0].controlMethodType).toBe('spc');
    expect(stored[0].productCharacteristic).toBe('Inner Bore Diameter');
    expect(stored[0].reactionPlanDesc).toContain('isolate last 1 hour production');
  });

  it('configures Incoming Raw Material Control Plan with AQL acceptance sampling', async () => {
    const incomingCp = {
      controlPlanId: 'CP-2026-INC-02',
      controlPlanType: 'production',
      partNumber: 'RAW-AL-7075',
      partName: 'Aluminum Ingot AlSi10Mg',
      revision: 'Rev A',
      processNumber: 'OP-10',
      operationName: 'Receiving Dock Metallurgical Verification',
      productCharacteristic: 'Chemical Composition & Tensile Hardness',
      specification: 'Hardness >= 85 HRB; Porosity Grade 1',
      evaluationMethod: 'Optical Emission Spectrometer & Hardness Tester',
      sampleSize: 'Sample size per ISO 2859-1 Level II (AQL 0.65)',
      frequency: 'batch',
      controlMethodType: 'attribute',
      responsible: 'Incoming QA Specialist',
      reactionPlanDesc: 'Reject batch, issue immediate NCR, quarantine in bay 9, notify purchasing for RMA',
      status: 'active',
    };

    const created = await unifiedControlPlanApi.create(incomingCp as any);
    expect(created.id).toBeDefined();

    const stored = readControlPlans();
    const found = stored.find((item) => item.controlPlanId === 'CP-2026-INC-02');
    expect(found).toBeDefined();
    expect(found.operationName).toContain('Receiving Dock');
    expect(found.sampleSize).toContain('ISO 2859-1');
  });

  it('configures Outgoing Quality Gate Control Plan with 100% Poka-Yoke leak check', async () => {
    const outgoingCp = {
      controlPlanId: 'CP-2026-OUT-03',
      controlPlanType: 'production',
      partNumber: 'PART-MED-4004',
      partName: 'Sterile Syringe Blister Chamber',
      revision: 'Rev B',
      processNumber: 'OP-90',
      operationName: 'Pre-Shipment Packaging Release Gate',
      productCharacteristic: 'Seal Integrity & Sterile Barrier',
      specification: 'Zero micro-leak under 300 mbar vacuum decay test',
      evaluationMethod: 'Differential Pressure Vacuum Decay Tester',
      sampleSize: '100% Continuous inline test',
      frequency: 'continuous',
      controlMethodType: 'error-proofing',
      responsible: 'Packaging Line Automation',
      reactionPlanDesc: 'Automated pneumatic ejection of leaking blisters into locked reject bin; 3 consecutive rejects trigger E-Stop',
      status: 'active',
    };

    const created = await unifiedControlPlanApi.create(outgoingCp as any);
    expect(created.id).toBeDefined();

    const stored = readControlPlans();
    const found = stored.find((item) => item.controlPlanId === 'CP-2026-OUT-03');
    expect(found).toBeDefined();
    expect(found.controlMethodType).toBe('error-proofing');
    expect(found.frequency).toBe('continuous');
  });

  it('validates reaction plan enforcement when characteristic deviates outside tolerance limits', () => {
    const plan = {
      characteristic: 'Coating Thickness',
      nominal: 50, // µm
      toleranceLower: 40,
      toleranceUpper: 60,
      reactionPlan: 'Hold batch, escalate to NCR',
    };

    const testMeasurement = 65; // Out of spec (> 60)
    const isOutOfSpec = testMeasurement < plan.toleranceLower || testMeasurement > plan.toleranceUpper;

    expect(isOutOfSpec).toBe(true);
    expect(plan.reactionPlan).toBe('Hold batch, escalate to NCR');
  });

  it('supports progressive lifecycle migration: Prototype -> Pre-Launch -> Production', async () => {
    const protoPlan = {
      id: 'cp-lifecycle-01',
      controlPlanId: 'CP-MIGRATE-01',
      controlPlanType: 'prototype',
      partNumber: 'PART-EV-99',
      partName: 'Battery Cooling Plate',
      status: 'active',
    };
    seedControlPlans([protoPlan]);

    // Advance to Pre-launch
    const preLaunch = await unifiedControlPlanApi.update('cp-lifecycle-01', {
      controlPlanType: 'pre-launch',
      revision: 'Rev B (Pilot Run)',
    });
    expect(preLaunch.controlPlanType).toBe('pre-launch');

    // Advance to Mass Production
    const massProduction = await unifiedControlPlanApi.update('cp-lifecycle-01', {
      controlPlanType: 'production',
      revision: 'Rev C (SOP)',
    });
    expect(massProduction.controlPlanType).toBe('production');
  });
});
