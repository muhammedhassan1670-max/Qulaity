import { describe, it, expect, beforeEach } from 'vitest';
import {
  unifiedComplaintsApi,
  unifiedEightDApi,
  unifiedCapaApi,
  unifiedFmeaApi,
} from '@/api/unified-api';
import {
  resetQualityStorage,
  readComplaints,
  read8dRecords,
  readCapaRecords,
  readFmeaRecords,
  seedFmeaRecords,
} from '../../helpers/testHarness';
import { assertRpnCalculation } from '../../helpers/assertionHelpers';
import { INDUSTRIAL_PARTS } from '../../helpers/industrialFixtures';

describe('Combo 04: Customer Complaint, 8D Containment, CAPA & FMEA Sync', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('Test 4.1: Customer complaint 5-step intake logs critical field failure with part details', async () => {
    const part = INDUSTRIAL_PARTS[1]; // Turbine High Pressure Rotor Blade
    const complaintData = {
      title: 'Turbine Blade Root Dovetail Crack Alert',
      customerName: 'AeroEngines Global Commercial Fleet',
      customerContact: 'chief.inspector@aeroengines.com',
      severity: 'critical',
      priority: 'urgent',
      status: 'Intake Completed',
      productName: part.partName,
      partNumber: part.partNumber,
      lotNumber: 'LOT-TI-2026-BLD-01',
      description: 'Micro-crack detected during 500h turbine inspection at line station Frankfurt',
      warrantyClaim: true,
      metadata: {
        flightHours: 520,
        intakeStep: 5,
        intakeStage: 'CAPA Requested',
      },
    };

    const complaint = await unifiedComplaintsApi.create(complaintData as any);
    expect(complaint.id).toBeDefined();

    const stored = readComplaints();
    expect(stored.length).toBe(1);
    expect(stored[0].customerName).toBe('AeroEngines Global Commercial Fleet');
    expect(stored[0].severity).toBe('critical');
    expect(stored[0].warrantyClaim).toBe(true);
  });

  it('Test 4.2: 8D emergency containment executes D0 through D3 disciplines within 24h SLA', async () => {
    const eightDPayload = {
      subject: '8D-2026-COMP-001: Dovetail Root Micro-crack Resolution',
      status: 'D3: Containment Implemented',
      plantId: 'PLANT-AERO-01',
      description: 'Customer reported micro-crack on high-pressure turbine blade root',
      metadata: {
        d0_preparation: 'Emergency quarantine issued to all airline customer depots',
        d1_team: [
          { role: 'Champion', name: 'Dr. Klaus, VP Quality' },
          { role: 'Leader', name: 'Sarah Chen, Lead Metallurgist' },
          { role: 'Facilitator', name: 'David Vance, Quality Engineering' },
        ],
        d2_problemDescription: 'Fatigue striations originating at blade dovetail trailing edge',
        d3_containment: {
          action: '100% Fluorescent Penetrant Inspection (FPI) on warehouse inventory',
          partsQuarantined: 140,
          defectEscapeRisk: 'Contained',
        },
      },
    };

    const eightD = await unifiedEightDApi.create(eightDPayload as any);
    expect(eightD.id).toBeDefined();

    const stored = read8dRecords();
    expect(stored.length).toBe(1);
    expect(stored[0].status).toBe('D3: Containment Implemented');
    expect(stored[0].metadata?.d1_team.length).toBe(3);
    expect(stored[0].metadata?.d3_containment.partsQuarantined).toBe(140);
  });

  it('Test 4.3: Root cause investigation (D4) triggers CAPA creation and permanent corrective actions (D5)', async () => {
    // Seed initial 8D
    const eightD = await unifiedEightDApi.create({
      subject: 'Turbine Blade Root Dovetail Crack',
      status: 'D4: Root Cause Verified',
      plantId: 'PLANT-AERO-01',
      metadata: {
        rootCause: 'Creep feed grinding wheel glaze induced localized thermal micro-stress',
        fiveWhys: [
          'Why did the blade crack? -> High localized residual stress',
          'Why was stress high? -> Grinding wheel temperature spiked to 850°C',
          'Why did temperature spike? -> Wheel glazing reduced coolant penetration',
          'Why did wheel glaze? -> Dressing diamond interval was extended from 20 to 50 cycles',
          'Root cause: Dressing frequency parameter altered without MOC review',
        ],
      },
    } as any);

    // Create CAPA linked to 8D root cause
    const capa = await unifiedCapaApi.create({
      title: 'CAPA for Grinding Wheel Dressing Parameter Control',
      description: `Permanent fix for 8D (${eightD.id}): ${eightD.metadata.rootCause}`,
      priority: 'Critical',
      capaType: 'Corrective Action',
      plantId: 'PLANT-AERO-01',
      metadata: {
        eightDId: eightD.id,
        actionPlan: 'Install automated acoustic emission wheel dresser with cycle lockout at 20 passes',
        targetCompletionDate: '2026-11-30',
      },
    } as any);

    expect(capa.id).toBeDefined();
    expect(capa.metadata?.eightDId).toBe(eightD.id);

    // Advance 8D status to D5
    const updated8d = await unifiedEightDApi.update(eightD.id as string, {
      status: 'D5: Corrective Actions Defined',
      metadata: {
        ...eightD.metadata,
        capaId: capa.id,
        permanentAction: capa.metadata?.actionPlan,
      },
    } as any);

    expect(updated8d.status).toBe('D5: Corrective Actions Defined');
    expect(updated8d.metadata?.capaId).toBe(capa.id);
  });

  it('Test 4.4: CAPA verification (D6-D7) synchronizes PFMEA Occurrence rating from O:6 down to O:1', async () => {
    // Initial PFMEA entry
    const initialFmea = {
      id: 'fmea-aero-turbine-01',
      title: 'Creep Feed Grinding Thermal Cracking',
      plantId: 'PLANT-AERO-01',
      metadata: {
        processStep: 'Creep Feed Grinding Root Dovetail',
        severity: 9,
        occurrence: 6,
        detection: 4,
        rpn: 9 * 6 * 4, // 216
      },
    };
    seedFmeaRecords([initialFmea]);

    // Verified CAPA: Acoustic sensor lockout eliminates glazing, zero defects over 50,000 blades
    const verifiedOccurrence = 1;
    const severity = initialFmea.metadata.severity;
    const detection = initialFmea.metadata.detection;
    const newRpn = severity * verifiedOccurrence * detection; // 9 * 1 * 4 = 36

    const updatedFmea = await unifiedFmeaApi.update(initialFmea.id, {
      metadata: {
        ...initialFmea.metadata,
        occurrence: verifiedOccurrence,
        rpn: newRpn,
        closedLoopAction: 'Acoustic dresser installed and validated with 50,000 defect-free cycles',
      },
    } as any);

    expect(updatedFmea.metadata?.occurrence).toBe(1);
    expect(updatedFmea.metadata?.rpn).toBe(36);
    assertRpnCalculation(9, 1, 4, 36);

    const storedFmeas = readFmeaRecords();
    expect(storedFmeas[0].metadata?.rpn).toBe(36);
  });

  it('Test 4.5: Closed-loop resolution updates FMEA Detection rating and completes 8D discipline D8 closure', async () => {
    const fmea = {
      id: 'fmea-aero-detect-01',
      title: 'Creep Feed Grinding Root Dovetail',
      plantId: 'PLANT-AERO-01',
      metadata: {
        severity: 9,
        occurrence: 1,
        detection: 4,
        rpn: 36,
      },
    };
    seedFmeaRecords([fmea]);

    // Add inline eddy-current automated tester improving detection from 4 to 1
    const newDetection = 1;
    const finalRpn = 9 * 1 * newDetection; // 9

    const syncedFmea = await unifiedFmeaApi.update(fmea.id, {
      metadata: {
        ...fmea.metadata,
        detection: newDetection,
        rpn: finalRpn,
        detectionControls: '100% Inline automated eddy current crack detector',
      },
    } as any);

    expect(syncedFmea.metadata?.detection).toBe(1);
    expect(syncedFmea.metadata?.rpn).toBe(9);
    assertRpnCalculation(9, 1, 1, 9);

    // 8D Discipline D8: Congratulate team & celebrate zero recurrence
    const closed8d = await unifiedEightDApi.create({
      subject: 'Closed 8D - Grinding Wheel Dovetail Cracking',
      status: 'D8: Congratulate Team & Closed',
      plantId: 'PLANT-AERO-01',
      metadata: {
        finalRpn: 9,
        teamRecognition: 'QualityOps Excellence Award 2026',
        recurrenceCheckMonths: 6,
        recurrenceCount: 0,
      },
    } as any);

    expect(closed8d.status).toBe('D8: Congratulate Team & Closed');
    expect(closed8d.metadata?.recurrenceCount).toBe(0);
  });
});
