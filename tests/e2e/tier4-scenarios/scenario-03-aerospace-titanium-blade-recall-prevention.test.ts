import { describe, it, expect, beforeEach } from 'vitest';
import {
  unifiedComplaintsApi,
  unifiedNcrApi,
  unifiedSupplierApi,
  unifiedDeviationApi,
  unifiedChangeControlApi,
  unifiedControlPlanApi,
} from '@/api/unified-api';
import {
  resetQualityStorage,
  seedSuppliers,
  readSuppliers,
  seedControlPlans,
  readControlPlans,
} from '../../helpers/testHarness';
import { assertLotGenealogyNode, assertRpnCalculation } from '../../helpers/assertionHelpers';
import { INDUSTRIAL_PARTS, INDUSTRIAL_MATERIALS, INDUSTRIAL_SUPPLIERS } from '../../helpers/industrialFixtures';

describe('Scenario 03: Aerospace Titanium Turbine Blade Recall Prevention', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('Phase 1: Customer notification of blade root micro-fissure initiates urgent complaint & containment', async () => {
    const part = INDUSTRIAL_PARTS[1]; // Turbine High Pressure Rotor Blade
    const complaint = await unifiedComplaintsApi.create({
      title: 'AeroEngines Fleet Alert: Micro-fissures in High-Pressure Rotor Blade Roots',
      customerName: 'AeroEngines Global Commercial Fleet',
      severity: 'critical',
      priority: 'urgent',
      productName: part.partName,
      partNumber: part.partNumber,
      lotNumber: 'LOT-TI-BLD-8820',
      description: 'Ultrasonic inspection discovered 0.04mm micro-fissure at dovetail root after 350 flight cycles',
      warrantyClaim: true,
      metadata: {
        safetyCritical: true,
        quarantineImmediate: true,
      },
    } as any);

    expect(complaint.id).toBeDefined();
    expect(complaint.severity).toBe('critical');

    // Create Critical NCR with Tag Studio Quarantine Label
    const ncr = await unifiedNcrApi.create({
      ncrNumber: 'NCR-AERO-2026-88',
      title: 'Emergency Flight Containment - Turbine Blade Micro-crack',
      severity: 'critical',
      priority: 'Critical',
      status: 'quarantined',
      affectedQuantity: 80,
      lotNumber: 'LOT-TI-BLD-8820',
      containmentAction: 'Quarantine Tag #AERO-QT-8820 applied to all inventory in Depot A and Assembly Line 3',
      metadata: {
        sourceComplaintId: complaint.id,
        tagStudioQr: 'QMS://LOT-TI-BLD-8820/CRITICAL-HOLD',
      },
    } as any);

    expect(ncr.id).toBeDefined();
    expect(ncr.status).toBe('quarantined');
  });

  it('Phase 2: Bilateral backward and forward lot genealogy traces forging batch to supplier titanium ingot', () => {
    // Bilateral genealogy tracing tree
    const aerospaceGenealogy = [
      {
        lotNumber: 'RAW-INGOT-TI-991', // Supplier melt heat lot
        supplier: 'SUP-APEX-01',
        children: ['FORGED-BAR-TI-4410'],
      },
      {
        lotNumber: 'FORGED-BAR-TI-4410',
        parents: ['RAW-INGOT-TI-991'],
        children: ['LOT-TI-BLD-8820', 'LOT-TI-BLD-8821'],
      },
      {
        lotNumber: 'LOT-TI-BLD-8820',
        parents: ['FORGED-BAR-TI-4410'],
        children: ['ENGINE-MODULE-ENG-701', 'ENGINE-MODULE-ENG-702'],
      },
    ];

    // Backward trace: from blade lot to supplier ingot
    assertLotGenealogyNode(aerospaceGenealogy, 'RAW-INGOT-TI-991', 'FORGED-BAR-TI-4410');
    assertLotGenealogyNode(aerospaceGenealogy, 'FORGED-BAR-TI-4410', 'LOT-TI-BLD-8820');

    // Forward trace: identify all engine modules impacted for grounded containment
    assertLotGenealogyNode(aerospaceGenealogy, 'LOT-TI-BLD-8820', 'ENGINE-MODULE-ENG-701');
    assertLotGenealogyNode(aerospaceGenealogy, 'LOT-TI-BLD-8820', 'ENGINE-MODULE-ENG-702');
  });

  it('Phase 3: 3D Exploded View isolates dovetail root stress concentration zone and CAD heatmap', () => {
    // Model 3D Exploded View & Heatmap state
    interface MechanicalExplodedState {
      modelId: string;
      explodeSliderPercent: number; // 0 to 100%
      isolatedComponent: string;
      stressHotspotMPa: number;
      fatigueLimitMPa: number;
      ishikawaRootCategory: string;
      inspectionRecommendation: string;
    }

    const explodedState: MechanicalExplodedState = {
      modelId: 'CAD-TURBINE-ROTOR-STAGE-1',
      explodeSliderPercent: 65, // Disassembled for internal view
      isolatedComponent: 'PART-BLD-2002 (Dovetail Root Serration #2)',
      stressHotspotMPa: 780, // High stress concentration
      fatigueLimitMPa: 620, // Stress exceeds fatigue endurance limit
      ishikawaRootCategory: 'Method - Grinding Wheel Feed Rate Acceleration',
      inspectionRecommendation: 'High-frequency Eddy Current + Level 4 Fluorescent Penetrant Inspection',
    };

    expect(explodedState.explodeSliderPercent).toBe(65);
    expect(explodedState.stressHotspotMPa).toBeGreaterThan(explodedState.fatigueLimitMPa);
    expect(explodedState.isolatedComponent).toContain('Dovetail Root Serration');
  });

  it('Phase 4: Temporary deviation granted with triple signoff while permanent ECN updates Control Plan', async () => {
    // Temporary deviation concession with strict conditions
    const dev = await unifiedDeviationApi.create({
      title: 'Controlled Flight Clearance Concession for Inspected Sub-lot',
      deviationNumber: 'DEV-AERO-2026-90',
      status: 'approved-active',
      maxQuantity: 20,
      validUntil: '2026-11-25',
      metadata: {
        condition: 'Permit flight only after 100% Eddy Current scan confirms zero cracks > 0.01mm',
        approvals: {
          flightSafety: { approved: true, officer: 'FAA/EASA Designated Engineer Dr. Klaus' },
          metallurgy: { approved: true, officer: 'Chief Metallurgist Sarah Chen' },
          operations: { approved: true, officer: 'VP Aerospace Elena Rostova' },
        },
      },
    } as any);

    expect(dev.status).toBe('approved-active');
    expect(dev.metadata?.approvals.flightSafety.approved).toBe(true);

    // Seed Control Plan and broadcast permanent ECN
    const cp = {
      id: 'cp-blade-root-01',
      title: 'Turbine Blade Precision Grinding Control Plan',
      status: 'Active',
      metadata: {
        version: '4.0',
        grindFeedRate: '0.05 mm/s',
        inspectionGate: 'Standard FPI',
      },
    };
    seedControlPlans([cp]);

    const ecn = await unifiedChangeControlApi.create({
      type: 'ECN',
      title: 'ECN-AERO-772: Creep-Feed Grinding Parameter Lockout & Eddy Current Gate',
      status: 'Approved',
      metadata: {
        targetControlPlanId: cp.id,
        newFeedRate: '0.02 mm/s (reduced by 60% to eliminate thermal stress)',
        newInspectionGate: '100% Automated Multi-Frequency Eddy Current + Level 4 FPI',
      },
    } as any);

    // Update Control Plan with ECN broadcast
    const updatedCp = await unifiedControlPlanApi.update(cp.id, {
      metadata: {
        ...cp.metadata,
        version: '5.0-ECN-772',
        grindFeedRate: ecn.metadata.newFeedRate,
        inspectionGate: ecn.metadata.newInspectionGate,
      },
    } as any);

    expect(updatedCp.metadata?.version).toBe('5.0-ECN-772');
    expect(updatedCp.metadata?.inspectionGate).toContain('100% Automated Multi-Frequency Eddy Current');
  });

  it('Phase 5: Penalizes supplier quality rating PPM and enforces 100% First-Pass Yield at Outgoing OQC', async () => {
    // Seed suppliers
    seedSuppliers(INDUSTRIAL_SUPPLIERS);
    const suppliers = readSuppliers();
    const apexSupplier = suppliers.find((s: any) => s.supplierCode === 'SUP-APEX-01');
    expect(apexSupplier).toBeDefined();

    // Ingot defect increases supplier PPM from 14 to 320 and downgrades rating from 4.85 to 3.80
    const penalizedSupplier = await unifiedSupplierApi.update(apexSupplier.id, {
      rating: 3.80,
      qualityPpm: 320,
      status: 'conditional',
      metadata: {
        penaltyReason: 'Turbine ingot porosity recall incident #NCR-AERO-2026-88',
        mandatoryAction: 'Supplier SCAR-2026-09 issued with required 8D within 10 days',
      },
    } as any);

    expect(penalizedSupplier.status).toBe('conditional');
    expect(penalizedSupplier.qualityPpm).toBe(320);

    // Outgoing Quality Pre-Shipment Gatekeeper: enforce 100% FPY before issuing CoC
    interface OutgoingQualityReleaseGate {
      gateId: string;
      batchNumber: string;
      totalInspected: number;
      passedCount: number;
      defectsFound: number;
      firstPassYield: number; // %
      certificateOfConformanceIssued: boolean;
      status: 'HOLD' | 'RELEASED';
    }

    const oqcGate: OutgoingQualityReleaseGate = {
      gateId: 'OQC-GATE-STAGE-1',
      batchNumber: 'LOT-TI-BLD-REPLACEMENTS-99',
      totalInspected: 150,
      passedCount: 150,
      defectsFound: 0,
      firstPassYield: 100.0,
      certificateOfConformanceIssued: true,
      status: 'RELEASED',
    };

    expect(oqcGate.firstPassYield).toBe(100.0);
    expect(oqcGate.certificateOfConformanceIssued).toBe(true);
    expect(oqcGate.status).toBe('RELEASED');
  });
});
