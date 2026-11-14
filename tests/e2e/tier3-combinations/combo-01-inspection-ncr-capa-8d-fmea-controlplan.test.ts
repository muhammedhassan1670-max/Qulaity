import { describe, it, expect, beforeEach } from 'vitest';
import { QualityEngine } from '@/services/qualityEngine';
import {
  unifiedNcrApi,
  unifiedCapaApi,
  unifiedEightDApi,
  unifiedFmeaApi,
  unifiedControlPlanApi,
  unifiedInspectionApi,
} from '@/api/unified-api';
import {
  resetQualityStorage,
  seedNcrRecords,
  seedCapaRecords,
  seed8dRecords,
  seedFmeaRecords,
  seedControlPlans,
  readNcrRecords,
  readCapaRecords,
  read8dRecords,
  readFmeaRecords,
  readControlPlans,
} from '../../helpers/testHarness';
import { INDUSTRIAL_PARTS, INDUSTRIAL_MATERIALS } from '../../helpers/industrialFixtures';
import { assertRpnCalculation } from '../../helpers/assertionHelpers';

describe('Combo 01: Full Closed-Loop Defect Lifecycle', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('Test 1.1: Inspection failure generates NCR with full part, lot, and dimensional defect context', async () => {
    const part = INDUSTRIAL_PARTS[0]; // Hydraulic Flight Actuator Housing
    const inspectionPayload = {
      title: 'Incoming CMM Inspection - Actuator Housing',
      type: 'Dimensional Inspection',
      plantId: 'PLANT-AERO-01',
      departmentId: 'DEPT-INSPECT',
      result: 'Failed',
      metadata: {
        partNumber: part.partNumber,
        partName: part.partName,
        lotNumber: 'LOT-2026-ACT-554',
        inspector: 'Senior Inspector David Vance',
        characteristicsChecked: [
          { name: 'Bore Diameter', measured: 45.062, usl: 45.025, lsl: 44.975, pass: false },
        ],
      },
    };

    const inspection = await unifiedInspectionApi.create(inspectionPayload as any);
    expect(inspection.id).toBeDefined();

    // Handoff from failed inspection to NCR creation
    const ncrData = {
      ncrNumber: 'NCR-2026-ACT-001',
      title: 'Cylinder Bore Diameter Out of Tolerance',
      description: `Bore diameter measured 45.062mm exceeding USL (45.025mm) during ${inspectionPayload.title}`,
      defectType: 'Dimensional / Geometry',
      severity: 'critical',
      priority: 'Critical',
      status: 'open',
      plantId: inspectionPayload.plantId,
      departmentId: inspectionPayload.departmentId,
      affectedQuantity: 30,
      lotNumber: 'LOT-2026-ACT-554',
      containmentAction: 'Immediate stop-order on machining line 2, physical Red Tag quarantine applied',
      metadata: {
        inspectionId: inspection.id,
        partNumber: part.partNumber,
        product: 'Cylinder Bore Diameter Out of Tolerance',
        line: 'Machining Line 2',
      },
    };

    const ncr = await unifiedNcrApi.create(ncrData as any);
    expect(ncr.id).toBeDefined();

    const storedNcrs = readNcrRecords();
    expect(storedNcrs.length).toBe(1);
    expect(storedNcrs[0].metadata?.inspectionId).toBe(inspection.id);
    expect(storedNcrs[0].affectedQuantity).toBe(30);
    expect(storedNcrs[0].priority).toBe('Critical');
  });

  it('Test 1.2: Enforces quarantine status and MRB holding containment for out-of-spec lot', async () => {
    const ncr = await unifiedNcrApi.create({
      title: 'Titanium Rotor Blade Dovetail Root Crack',
      severity: 'critical',
      priority: 'Critical',
      status: 'quarantined',
      plantId: 'PLANT-AERO-01',
      affectedQuantity: 15,
      lotNumber: 'LOT-TI-BLD-882',
      containmentAction: 'Hold parts in Segregated Quarantine Bay 3 with Red Tag Studio label #QT-882',
      metadata: {
        quarantineTagId: 'QT-882',
        quarantineLocation: 'Bay 3 - Secured Lockbox',
        mrbReviewDate: '2026-11-15',
      },
    } as any);

    expect(ncr.status).toBe('quarantined');
    expect(ncr.metadata.quarantineTagId).toBe('QT-882');

    // Update with MRB Disposition
    const updated = await unifiedNcrApi.update(ncr.id as string, {
      status: 'mrb-review',
      disposition: 'Scrap',
      dispositionNotes: 'Metallurgical cross-section confirms micro-fissure; full lot condemned to scrap',
    } as any);

    expect(updated.status).toBe('mrb-review');
    expect(updated.disposition).toBe('Scrap');
  });

  it('Test 1.3: QualityEngine escalates NCR to CAPA preventing duplicate records', async () => {
    const ncr = await unifiedNcrApi.create({
      title: 'Shrinkage Porosity in Valve Body Casting',
      description: 'Sub-surface gas cavity detected by radiographic inspection',
      priority: 'Critical',
      severity: 'critical',
      status: 'open',
      plantId: 'PLANT-FOUNDRY-01',
      departmentId: 'DEPT-CAST',
      metadata: {
        product: 'Shrinkage Porosity in Valve Body Casting',
        line: 'Die Cast Cell 4',
        rootCause: 'Low molten aluminum degassing temperature',
      },
    } as any);

    // Initial escalation to CAPA
    const capa = await QualityEngine.escalateNcrToCapa(ncr.id as string);
    expect(capa).toBeDefined();
    expect(capa.sourceNcrId).toBe(ncr.id);
    expect(capa.priority).toBe('Critical');

    // Verify NCR status updated to 'Escalated to CAPA'
    const refreshedNcr = await unifiedNcrApi.getById(ncr.id as string);
    expect(refreshedNcr?.status).toBe('Escalated to CAPA');

    // Attempt duplicate escalation; QualityEngine must return the existing CAPA
    const duplicateCapa = await QualityEngine.escalateNcrToCapa(ncr.id as string);
    expect(duplicateCapa.id).toBe(capa.id);

    const allCapas = readCapaRecords();
    expect(allCapas.length).toBe(1);
  });

  it('Test 1.4: QualityEngine triggers 8D problem-solving discipline for Critical CAPA', async () => {
    const capa = await unifiedCapaApi.create({
      title: 'CAPA for Critical Flight Control Hydraulic Defect',
      description: 'Severe cavitation and metal particle release in flight control block',
      priority: 'Critical',
      capaType: 'Corrective Action',
      plantId: 'PLANT-AERO-01',
      sourceNcrId: 'NCR-2026-CRIT-99',
      metadata: {
        rootCause: 'Improper surface honing angle on CNC bore station',
        actionPlan: 'Recalibrate honing tool and replace spindle bearings',
      },
    } as any);

    // Trigger 8D from Critical CAPA
    const eightD = await QualityEngine.trigger8dFromCapa(capa.id as string, false);
    expect(eightD).toBeDefined();
    expect(eightD.status).toBe('D1: Team Formation');
    expect(eightD.ncrReportId).toBe('NCR-2026-CRIT-99');

    // Re-triggering 8D returns existing 8D record via metadata link
    const duplicate8d = await QualityEngine.trigger8dFromCapa(capa.id as string, false);
    expect(duplicate8d.id).toBe(eightD.id);

    const stored8d = read8dRecords();
    expect(stored8d.length).toBe(1);
  });

  it('Test 1.5: FMEA occurrence sync and autonomous Control Plan generation on high RPN', async () => {
    // Seed existing PFMEA record matching defect title
    const fmeaRecord = await unifiedFmeaApi.create({
      title: 'Structural Porosity in Flight Actuator Wall',
      type: 'PFMEA',
      plantId: 'PLANT-AERO-01',
      departmentId: 'DEPT-CASTING',
      metadata: {
        processStep: 'High Pressure Die Casting',
        severity: 8,
        occurrence: 4,
        detection: 3,
        rpn: 8 * 4 * 3, // 96 (< 100)
      },
    } as any);

    // Create NCR with matching title
    const ncr = await unifiedNcrApi.create({
      title: 'Structural Porosity in Flight Actuator Wall',
      description: 'Defect recurring in cell 3',
      priority: 'Critical',
      plantId: 'PLANT-AERO-01',
      metadata: { product: 'Structural Porosity in Flight Actuator Wall' },
    } as any);

    // Escalating NCR to CAPA invokes checkAndUpdateFmeaRecord
    // Occurrence should increase from 4 to 5, new RPN = 8 * 5 * 3 = 120 (>= 100)
    // This should trigger automated Control Plan generation!
    await QualityEngine.escalateNcrToCapa(ncr.id as string);

    const updatedFmea = await unifiedFmeaApi.getById(fmeaRecord.id as string);
    expect(updatedFmea?.metadata?.occurrence).toBe(5);
    expect(updatedFmea?.metadata?.rpn).toBe(120);
    assertRpnCalculation(8, 5, 3, 120);

    // Verify Control Plan was autonomously generated
    const controlPlans = readControlPlans();
    expect(controlPlans.length).toBeGreaterThanOrEqual(1);
    const generatedCp = controlPlans.find(
      (cp: any) => cp.metadata?.inheritedFromFmea === fmeaRecord.id
    );
    expect(generatedCp).toBeDefined();
    expect(generatedCp.metadata?.controlMethod).toContain('100% Automated Inspection + SPC');
    expect(generatedCp.metadata?.reactionPlan).toContain('Hold product -> Auto Create NCR');
  });

  it('Test 1.6: Complete closed-loop workflow verification from Inspection to Control Plan', async () => {
    // 1. Initial Baseline PFMEA
    const fmea = await unifiedFmeaApi.create({
      title: 'Bore Micro-Cracking Defect',
      plantId: 'PLANT-GEN-01',
      metadata: { severity: 9, occurrence: 4, detection: 3, rpn: 108 },
    } as any);

    // 2. Inspection failure
    const insp = await unifiedInspectionApi.create({
      title: 'Bore Surface Inspection',
      result: 'Failed',
      plantId: 'PLANT-GEN-01',
    } as any);

    // 3. NCR creation
    const ncr = await unifiedNcrApi.create({
      title: 'Bore Micro-Cracking Defect',
      priority: 'Critical',
      plantId: 'PLANT-GEN-01',
      metadata: { inspectionId: insp.id },
    } as any);

    // 4. Escalate to CAPA (which syncs to FMEA and auto-generates Control Plan)
    const capa = await QualityEngine.escalateNcrToCapa(ncr.id as string);
    expect(capa).toBeDefined();

    // 5. Trigger 8D
    const eightD = await QualityEngine.trigger8dFromCapa(capa.id as string, false);
    expect(eightD).toBeDefined();

    // Verify full link chain
    const storedNcrs = readNcrRecords();
    const storedCapas = readCapaRecords();
    const stored8ds = read8dRecords();
    const storedCps = readControlPlans();

    expect(storedNcrs[0].status).toBe('Escalated to CAPA');
    expect(storedCapas[0].sourceNcrId).toBe(ncr.id);
    expect(stored8ds[0].ncrReportId).toBe(ncr.id);
    expect(storedCps.some((cp: any) => cp.metadata?.inheritedFromFmea === fmea.id)).toBe(true);
  });
});
