import { describe, it, expect, beforeEach } from 'vitest';
import {
  unifiedComplaintsApi,
  unifiedEightDApi,
  unifiedCapaApi,
  unifiedCalibrationApi,
  unifiedInspectionApi,
} from '@/api/unified-api';
import {
  resetQualityStorage,
  seedCalibrations,
  readCalibrations,
} from '../../helpers/testHarness';
import { INDUSTRIAL_PARTS, INDUSTRIAL_INSPECTION_SPECS, INDUSTRIAL_CALIBRATION_TOOLS } from '../../helpers/industrialFixtures';

describe('Scenario 04: Medical Device Packaging Seal Leakage Recertification', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('Phase 1: Hospital customer complaint intake logs sterile blister packaging seal channel breach', async () => {
    const part = INDUSTRIAL_PARTS[3]; // Sterile Syringe Blister Chamber
    const complaint = await unifiedComplaintsApi.create({
      title: 'Sterile Barrier Breach - Syringe Blister Seal Channel Leak',
      customerName: 'St. Jude University Medical Center',
      customerContact: 'biomedical.safety@stjude-hospital.org',
      severity: 'critical',
      priority: 'urgent',
      productName: part.partName,
      partNumber: part.partNumber,
      lotNumber: 'LOT-MED-2026-BLIST-404',
      description: 'Sterile syringe blister pouch opened with sub-nominal seal burst pressure (< 180 kPa vs 220 kPa min)',
      warrantyClaim: true,
      metadata: {
        regulatoryReportable: true,
        fdaMedicalDeviceReport: 'MDR-2026-MED-0991',
        iso13485Clause: '8.2.2 Complaint Handling',
      },
    } as any);

    expect(complaint.id).toBeDefined();
    expect(complaint.severity).toBe('critical');
    expect(complaint.metadata?.fdaMedicalDeviceReport).toBe('MDR-2026-MED-0991');
  });

  it('Phase 2: 8D emergency containment isolates cleanroom lots and begins root cause 5-Whys', async () => {
    const eightD = await unifiedEightDApi.create({
      subject: '8D-MED-2026-SEAL: Blister Pack Seal Integrity Resolution',
      status: 'D3: Containment Implemented',
      plantId: 'PLANT-MED-CLEANROOM-04',
      description: 'Sterile packaging seal channel breach investigation under ISO 11607 & ISO 13485',
      metadata: {
        d3_quarantineCount: 15000, // 15,000 units quarantined in Cleanroom Bay 4
        d3_dyePenetrationTestResult: 'Methylene blue dye test revealed intermittent micro-channel at corner radius',
        targetResolutionDays: 14,
      },
    } as any);

    expect(eightD.id).toBeDefined();
    expect(eightD.metadata?.d3_quarantineCount).toBe(15000);

    // Advance to D4: Root Cause verified
    const advanced8d = await unifiedEightDApi.update(eightD.id, {
      status: 'D4: Root Cause Verified',
      metadata: {
        ...eightD.metadata,
        rootCause: 'Heater sealing bar thermocouple temperature sensor drifted low by 14°C, resulting in incomplete polymer fusion',
        fishboneFactor: 'Measurement - Thermocouple calibration past interval',
      },
    } as any);

    expect(advanced8d.status).toBe('D4: Root Cause Verified');
    expect(advanced8d.metadata?.fishboneFactor).toContain('Measurement');
  });

  it('Phase 3: Pressure sensor & thermal seal tester calibration audit verifies measurement system bias', async () => {
    // Seed Mocon burst tester
    seedCalibrations(INDUSTRIAL_CALIBRATION_TOOLS.map((t) => ({ id: t.toolId, ...t })));

    // Recalibrate Mocon burst tester with certified pressure standard
    const msaResult = await unifiedCalibrationApi.create({
      toolId: 'TOOL-BURST-03',
      title: 'Mocon Lippke 5000 Package Seal Tester Gage R&R & Bias Study',
      status: 'Recalibrated & Validated',
      plantId: 'PLANT-MED-CLEANROOM-04',
      metadata: {
        standardReference: 'ASTM F1140 & ASTM F2054',
        pressureRangeKPa: '0 - 500 kPa',
        temperatureSensorReplaced: 'HEATER-PID-ZONE-B',
        newSensorCalibrationCert: 'NIST-TRACEABLE-CERT-9901',
        calibrationIntervalDays: 90, // Shortened from 180 to 90 days for higher assurance
      },
    } as any);

    expect(msaResult.status).toBe('Recalibrated & Validated');
    expect(msaResult.metadata?.calibrationIntervalDays).toBe(90);
  });

  it('Phase 4: Medical device CAPA verification validates thermal profile and zero dye penetration leaks', async () => {
    const capa = await unifiedCapaApi.create({
      title: 'CAPA-MED-2026-088: Thermoforming Heat Sealer PID Temperature Interlock',
      capaType: 'Corrective Action',
      priority: 'Critical',
      plantId: 'PLANT-MED-CLEANROOM-04',
      status: 'Verification in Progress',
      metadata: {
        rootCause: 'Thermocouple drift led to localized seal temperature dropping to 142°C (minimum fusion is 155°C)',
        actionPlan: 'Install dual redundant RTD sensors with automatic cycle abort if zone variance > 2°C',
      },
    } as any);

    expect(capa.id).toBeDefined();

    // Verify CAPA effectiveness: 200 consecutive test samples pass 0% dye penetration leak test
    const verifiedCapa = await unifiedCapaApi.update(capa.id, {
      status: 'Closed & Effective',
      metadata: {
        ...capa.metadata,
        validationRunsPassed: 200,
        dyePenetrationFailureCount: 0,
        averageBurstPressureKPa: 284.5, // Nominal is 280.0 kPa
        verificationSignoff: 'VP Medical Regulatory Affairs Dr. Klaus',
        verificationDate: '2026-11-14',
      },
    } as any);

    expect(verifiedCapa.status).toBe('Closed & Effective');
    expect(verifiedCapa.metadata?.dyePenetrationFailureCount).toBe(0);
    expect(verifiedCapa.metadata?.averageBurstPressureKPa).toBeGreaterThan(220.0);
  });

  it('Phase 5: Outgoing Pre-Shipment Gatekeeper enforces 100% First-Pass Yield before Certificate of Conformance', async () => {
    const spec = INDUSTRIAL_INSPECTION_SPECS.blisterSealBurst; // nominal 280.0, lsl 220.0, usl 350.0 kPa

    // Post-CAPA qualification inspection batch
    const outgoingInspection = await unifiedInspectionApi.create({
      title: 'Pre-Shipment Sterility & Seal Integrity OQC Inspection',
      plantId: 'PLANT-MED-CLEANROOM-04',
      result: 'Passed - 100% FPY',
      metadata: {
        batchId: 'BATCH-MED-STERILE-RELEASE-01',
        totalSamplesTested: 100,
        defectsIdentified: 0,
        minBurstPressureKPa: 268.0, // Above LSL 220.0
        maxBurstPressureKPa: 295.0, // Below USL 350.0
        fpyPercentage: 100.0,
      },
    } as any);

    expect(outgoingInspection.result).toBe('Passed - 100% FPY');
    expect(outgoingInspection.metadata?.fpyPercentage).toBe(100.0);

    // Gatekeeper release condition: 100% FPY mandatory before Certificate of Conformance (CoC)
    interface MedicalCertificateOfConformance {
      cocNumber: string;
      batchNumber: string;
      productName: string;
      standardConformity: string[];
      oqcGateStatus: 'CLEARED' | 'BLOCKED';
      releasedForClinicalUse: boolean;
      approvedBy: string;
    }

    const coc: MedicalCertificateOfConformance = {
      cocNumber: 'COC-MED-2026-9901',
      batchNumber: 'BATCH-MED-STERILE-RELEASE-01',
      productName: 'Sterile Syringe Blister Chamber',
      standardConformity: ['ISO 13485:2016', 'ISO 11607-1:2019', 'USP Class VI'],
      oqcGateStatus: outgoingInspection.metadata?.fpyPercentage === 100.0 ? 'CLEARED' : 'BLOCKED',
      releasedForClinicalUse: true,
      approvedBy: 'Director of Medical Quality & Regulatory Affairs',
    };

    expect(coc.oqcGateStatus).toBe('CLEARED');
    expect(coc.releasedForClinicalUse).toBe(true);
    expect(coc.standardConformity).toContain('ISO 13485:2016');
  });
});
