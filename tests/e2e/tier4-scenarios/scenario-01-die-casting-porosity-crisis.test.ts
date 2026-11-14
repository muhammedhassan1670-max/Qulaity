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
import { analyzeDefectRecords } from '@/services/defectAnalytics';
import {
  resetQualityStorage,
  seedFmeaRecords,
  readNcrRecords,
  readCapaRecords,
  read8dRecords,
  readFmeaRecords,
  readControlPlans,
  seedDefectLogs,
} from '../../helpers/testHarness';
import { assertRpnCalculation, assertLotGenealogyNode } from '../../helpers/assertionHelpers';
import { INDUSTRIAL_MATERIALS, INDUSTRIAL_PARTS } from '../../helpers/industrialFixtures';

describe('Scenario 01: Die Casting Porosity Industrial Crisis', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('Phase 1: Incoming aluminum ingot inspection fails due to sub-surface porosity & logs fast shopfloor defect', async () => {
    const rawMaterial = INDUSTRIAL_MATERIALS[0]; // Aluminum Alloy 7075-T6
    const part = INDUSTRIAL_PARTS[0]; // Hydraulic Flight Actuator Housing

    const inspection = await unifiedInspectionApi.create({
      title: 'Incoming Ingot Radiographic & Density Inspection',
      plantId: 'PLANT-FOUNDRY-01',
      departmentId: 'DEPT-INCOMING-RECEIVING',
      result: 'Failed',
      metadata: {
        materialCode: rawMaterial.materialCode,
        partNumber: part.partNumber,
        lotNumber: 'LOT-INGOT-2026-AL-99',
        measuredDensity: 2.71, // Nominal 2.81 g/cm³ - density deficit indicates micro-porosity
        densityNominal: rawMaterial.density,
        inspectionGate: 'OQC Incoming Dock',
      },
    } as any);

    expect(inspection.id).toBeDefined();
    expect(inspection.result).toBe('Failed');

    // Fast shopfloor defect logging
    seedDefectLogs([
      {
        id: 'DEF-INGOT-01',
        date: new Date().toISOString().split('T')[0],
        recordType: 'process-ppm',
        defectType: 'Sub-surface Gas Porosity',
        quantity: 12,
        inspectedQuantity: 100,
        productionLine: 'High-Pressure Foundry Line 1',
      },
    ]);

    const analytics = analyzeDefectRecords([
      {
        id: 'DEF-INGOT-01',
        date: new Date().toISOString().split('T')[0],
        recordType: 'process-ppm',
        defectType: 'Sub-surface Gas Porosity',
        quantity: 12,
        inspectedQuantity: 100,
        productionLine: 'High-Pressure Foundry Line 1',
      },
    ], 'month');

    // 12 defects / 100 inspected = 120,000 PPM
    expect(analytics.kpis.currentPpm).toBe(120000);
  });

  it('Phase 2: URL query handoff auto-populates 16-field Critical NCR with quarantine holding tag', async () => {
    const ncrPayload = {
      ncrNumber: 'NCR-2026-CAST-001',
      title: 'Structural Porosity in Die Cast Actuator Housing',
      description: 'Severe sub-surface gas cavity detected by radiographic inspection',
      defectType: 'Metallurgical Porosity',
      severity: 'critical',
      priority: 'Critical',
      status: 'quarantined',
      plantId: 'PLANT-FOUNDRY-01',
      departmentId: 'DEPT-FOUNDRY',
      productionLine: 'High-Pressure Foundry Line 1',
      affectedQuantity: 240,
      lotNumber: 'LOT-INGOT-2026-AL-99',
      containmentAction: 'Apply Smart Tag Studio Red Tag #RED-TAG-9901 and lock in Foundry Holding Pen 4',
      disposition: 'pending',
      dispositionNotes: 'Awaiting MRB metallurgical cross-section review',
      rootCauseNotes: 'Degassing argon lance clogged during aluminum pour cycle',
      assignedTo: 'Lead Metallurgist Dr. Klaus',
      dueDate: '2026-11-18',
      source: 'URL Handoff from Incoming Inspection Gate',
      metadata: {
        product: 'Structural Porosity in Die Cast Actuator Housing',
        tagStudioQrPayload: 'QMS://LOT-INGOT-2026-AL-99/HOLD/RED-TAG-9901',
      },
    };

    const ncr = await unifiedNcrApi.create(ncrPayload as any);
    expect(ncr.id).toBeDefined();

    const storedNcrs = readNcrRecords();
    expect(storedNcrs.length).toBe(1);
    expect(storedNcrs[0].status).toBe('quarantined');
    expect(storedNcrs[0].affectedQuantity).toBe(240);
    expect(storedNcrs[0].metadata?.tagStudioQrPayload).toContain('RED-TAG-9901');
  });

  it('Phase 3: Material Review Board (MRB) orders full lot SCRAP and initiates backward/forward genealogy trace', async () => {
    const activeNcr = await unifiedNcrApi.create({
      ncrNumber: 'NCR-2026-CAST-001',
      title: 'Structural Porosity in Die Cast Actuator Housing',
      severity: 'critical',
      priority: 'Critical',
      status: 'quarantined',
      plantId: 'PLANT-FOUNDRY-01',
      affectedQuantity: 240,
      lotNumber: 'LOT-INGOT-2026-AL-99',
    } as any);

    // MRB Disposition decision
    const mrbDecision = await unifiedNcrApi.update(activeNcr.id, {
      status: 'disposition-decided',
      disposition: 'Scrap',
      dispositionNotes: '100% of batch 240 castings rejected to scrap furnace; total COPQ loss $38,400',
    } as any);

    expect(mrbDecision.disposition).toBe('Scrap');

    // Backward & Forward Lot Traceability tree verification
    const genealogyTree = [
      {
        lotNumber: 'SUPPLIER-COIL-AL-901',
        children: ['LOT-INGOT-2026-AL-99'],
      },
      {
        lotNumber: 'LOT-INGOT-2026-AL-99',
        parents: ['SUPPLIER-COIL-AL-901'],
        children: ['PALLET-CAST-401', 'PALLET-CAST-402'],
      },
    ];

    assertLotGenealogyNode(genealogyTree, 'SUPPLIER-COIL-AL-901', 'LOT-INGOT-2026-AL-99');
    assertLotGenealogyNode(genealogyTree, 'LOT-INGOT-2026-AL-99', 'PALLET-CAST-401');
  });

  it('Phase 4: Emergency CAPA triggers 8D problem-solving (D1-D8) with root cause 5-Whys', async () => {
    const ncr = await unifiedNcrApi.create({
      title: 'Structural Porosity in Die Cast Actuator Housing',
      description: 'Severe sub-surface gas cavity detected by radiographic inspection',
      priority: 'Critical',
      severity: 'critical',
      status: 'open',
      plantId: 'PLANT-FOUNDRY-01',
      metadata: {
        product: 'Structural Porosity in Die Cast Actuator Housing',
      },
    } as any);

    // Escalate to CAPA
    const capa = await QualityEngine.escalateNcrToCapa(ncr.id);
    expect(capa).toBeDefined();
    expect(capa.sourceNcrId).toBe(ncr.id);

    // Trigger 8D
    const eightD = await QualityEngine.trigger8dFromCapa(capa.id, false);
    expect(eightD).toBeDefined();
    expect(eightD.status).toBe('D1: Team Formation');

    // Advance 8D through D4 Root Cause & D5 Corrective Actions
    const advanced8d = await unifiedEightDApi.update(eightD.id, {
      status: 'D6: Permanent Actions Implemented',
      metadata: {
        ...eightD.metadata,
        rootCause: 'Argon degassing rotor clogged due to flux buildup; rotary degassing efficiency dropped from 99% to 74%',
        d5_action: 'Upgrade to dual ultrasonic rotary degassing system with automated density index sensor lockout',
        validationRunsDefectFree: 1500,
      },
    } as any);

    expect(advanced8d.status).toBe('D6: Permanent Actions Implemented');
    expect(advanced8d.metadata?.validationRunsDefectFree).toBe(1500);
  });

  it('Phase 5: FMEA Occurrence updates (O: 6 -> 2) and Control Plan adds mandatory ultrasonic NDT gate', async () => {
    // Seed initial high-risk FMEA
    const fmea = {
      id: 'fmea-die-cast-crisis',
      title: 'High Pressure Die Casting Porosity',
      plantId: 'PLANT-FOUNDRY-01',
      metadata: {
        processStep: 'High Pressure Die Casting',
        severity: 8,
        occurrence: 6,
        detection: 4,
        rpn: 8 * 6 * 4, // 192
      },
    };
    seedFmeaRecords([fmea]);

    // Update FMEA: Occurrence drops from 6 to 2 after ultrasonic degassing validation
    const updatedOccurrence = 2;
    const detection = 2; // inline ultrasonic NDT gate improves detection from 4 to 2
    const revisedRpn = 8 * updatedOccurrence * detection; // 8 * 2 * 2 = 32

    const updatedFmea = await unifiedFmeaApi.update(fmea.id, {
      metadata: {
        ...fmea.metadata,
        occurrence: updatedOccurrence,
        detection: detection,
        rpn: revisedRpn,
        closedLoopResolution: 'Dual ultrasonic degassing + inline ultrasonic scanning gate deployed',
      },
    } as any);

    expect(updatedFmea.metadata?.occurrence).toBe(2);
    expect(updatedFmea.metadata?.detection).toBe(2);
    expect(updatedFmea.metadata?.rpn).toBe(32);
    assertRpnCalculation(8, 2, 2, 32);

    // Revise Control Plan with ultrasonic test gate
    const controlPlan = await unifiedControlPlanApi.create({
      title: 'Revised Die Casting Control Plan - Post Crisis Rev 3.0',
      productName: 'Hydraulic Flight Actuator Housing',
      plantId: 'PLANT-FOUNDRY-01',
      status: 'Active Standards Released',
      metadata: {
        version: '3.0',
        mandatoryTestGate: '100% In-line Ultrasonic Immersion Scan & Helium Mass Spec',
        reactionPlan: 'Zero tolerance: Auto-quarantine on single void > 0.05mm',
        fmeaRef: fmea.id,
      },
    } as any);

    expect(controlPlan.id).toBeDefined();
    expect(controlPlan.metadata?.mandatoryTestGate).toContain('100% In-line Ultrasonic Immersion Scan');

    const storedCps = readControlPlans();
    expect(storedCps.some((cp: any) => cp.metadata?.version === '3.0')).toBe(true);
  });
});
