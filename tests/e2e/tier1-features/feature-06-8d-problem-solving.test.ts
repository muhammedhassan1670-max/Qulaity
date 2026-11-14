import { describe, it, expect, beforeEach } from 'vitest';
import { unifiedEightDApi } from '@/api/unified-api';
import {
  seed8dRecords,
  read8dRecords,
  resetQualityStorage,
} from '../../helpers/testHarness';
import type { D8Report } from '@/pages/quality/D8';

describe('Feature 06: 8D Problem Solving Suite', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('initializes 8D case spanning D0 (Emergency Response) and D1 (Team Formation)', async () => {
    const reportPayload: Omit<D8Report, 'id'> = {
      eightDNumber: '8D-2026-001',
      symptomDescription: 'Hydraulic flight actuator fluid leakage under proof pressure test',
      emergencyResponse: 'Production line paused; 45 finished actuators segregated in quarantine buffer',
      dateDetected: '2026-11-14',
      teamLeader: 'Dr. Klaus - Lead Materials Engineer',
      teamMembers: ['Sarah Chen (QC)', 'Carlos Mendez (Manufacturing)', 'Alan Turing (Design)'],
      department: 'Aerospace Hydraulics',
      champion: 'VP of Quality Engineering',
      problemTitle: 'Dynamic Seal Extrusion Failure',
      productName: 'Flight Actuator 3000-PSI',
      productionLine: 'Cell 4 - Cleanroom Assembly',
      lotNumber: 'LOT-2026-ACT-44',
      problemDescription: 'Seal ring extrusion through 0.08mm backup ring clearance gap',
      customerImpact: 'Severe - potential loss of secondary flight control redundancy',
      immediateAction: 'Swapped tooling fixture; quarantined affected seal batch',
      containmentResponsible: 'Sarah Chen',
      containmentDate: '2026-11-14',
      quantityContained: 45,
      analysisMethod: '5why',
      whyAnalysis: '',
      rootCauseDescription: '',
      correctiveActionDesc: '',
      correctiveResponsible: '',
      targetDateCorrective: '',
      effectivenessCheck: 'pending',
      status: 'd1',
    };

    const created = await unifiedEightDApi.create(reportPayload as any);
    expect(created.id).toBeDefined();

    const stored = read8dRecords<D8Report>();
    expect(stored.length).toBe(1);
    expect(stored[0].symptomDescription).toContain('Hydraulic flight actuator');
    expect(stored[0].emergencyResponse).toContain('Production line paused');
    expect(stored[0].teamLeader).toBe('Dr. Klaus - Lead Materials Engineer');
    expect(stored[0].teamMembers.length).toBe(3);
    expect(stored[0].status).toBe('d1');
  });

  it('executes D2 (Problem Description) and D3 (Interim Containment Actions)', async () => {
    const d8: D8Report = {
      id: '8d-step-02',
      eightDNumber: '8D-2026-002',
      symptomDescription: 'Stamping dimensional drift',
      emergencyResponse: 'Line halted',
      dateDetected: '2026-11-14',
      teamLeader: 'Marcus Brody',
      teamMembers: ['Eng 1', 'Eng 2'],
      department: 'Press Shop',
      problemTitle: 'Sheet Metal Flange Drift',
      productName: 'Door Outer Panel',
      problemDescription: 'TBD',
      immediateAction: 'TBD',
      containmentResponsible: '',
      containmentDate: '',
      analysisMethod: '5why',
      rootCauseDescription: '',
      correctiveActionDesc: '',
      correctiveResponsible: '',
      targetDateCorrective: '',
      effectivenessCheck: 'pending',
      status: 'd1',
    };
    seed8dRecords([d8]);

    const updated = await unifiedEightDApi.update('8d-step-02', {
      status: 'd3',
      problemDescription: 'Flange height measured 14.85mm vs 14.00 ± 0.20mm nominal across 100 consecutive press strokes',
      customerImpact: 'Door assembly weld robot will fail alignment with B-pillar fixture',
      immediateAction: 'Installed 100% CMM gauge check on all parts prior to packaging; sorting in progress',
      containmentResponsible: 'Marcus Brody',
      containmentDate: '2026-11-14',
      quantityContained: 120,
    });

    expect(updated.status).toBe('d3');
    expect(updated.problemDescription).toContain('Flange height measured 14.85mm');
    expect(updated.quantityContained).toBe(120);
    expect(updated.containmentResponsible).toBe('Marcus Brody');
  });

  it('completes D4 (Root Cause Analysis) utilizing 5-Why and Fishbone methodology', async () => {
    const d8: D8Report = {
      id: '8d-step-04',
      eightDNumber: '8D-2026-003',
      symptomDescription: 'Surface porosity in turbine blade root',
      emergencyResponse: 'Quarantine pallet',
      dateDetected: '2026-11-14',
      teamLeader: 'Dr. Helen Vance',
      teamMembers: ['Metallurgist A', 'Casting Tech B'],
      department: 'Foundry',
      problemTitle: 'Turbine Blade Root Porosity',
      productName: 'Stage 1 Turbine Blade',
      problemDescription: 'Gas porosity clustered near dovetail root',
      immediateAction: '100% X-Ray scan',
      containmentResponsible: 'Helen Vance',
      containmentDate: '2026-11-14',
      analysisMethod: 'fishbone',
      rootCauseDescription: '',
      correctiveActionDesc: '',
      correctiveResponsible: '',
      targetDateCorrective: '',
      effectivenessCheck: 'pending',
      status: 'd3',
    };
    seed8dRecords([d8]);

    const updated = await unifiedEightDApi.update('8d-step-04', {
      status: 'd4',
      analysisMethod: '5why',
      whyAnalysis: '1. Why porosity? Gas entrapment. 2. Why gas? Moisture on ceramic shell. 3. Why moisture? Shell pre-heat oven conveyor speed increased by 25%. 4. Why increased? Unapproved cycle time shortcut. 5. Why shortcut? Operator lacked documented standard operating procedure.',
      fishboneAnalysis: 'Method: unverified conveyor speed; Machine: oven sensor calibration intact; Material: ceramic slurry compliant; Measurement: X-ray verified.',
      rootCauseDescription: 'Pre-heat drying duration reduced below 120 minutes due to lack of tamper-proof interlock on oven conveyor speed controller',
    });

    expect(updated.status).toBe('d4');
    expect(updated.whyAnalysis).toContain('pre-heat oven conveyor speed');
    expect(updated.rootCauseDescription).toContain('tamper-proof interlock');
  });

  it('formulates D5 (Permanent Corrective Actions) and validates D6 (Implementation & Verification)', async () => {
    const d8: D8Report = {
      id: '8d-step-05',
      eightDNumber: '8D-2026-004',
      symptomDescription: 'Electronic module conformal coating bubbles',
      emergencyResponse: 'Visual sort',
      dateDetected: '2026-11-14',
      teamLeader: 'Kevin Miller',
      teamMembers: ['Process Eng', 'Operator Lead'],
      department: 'SMT Cleanroom',
      problemTitle: 'Conformal Coating Micro-Bubbles',
      productName: 'ECU Main Board',
      problemDescription: 'Bubbles over microcontroller leads',
      immediateAction: 'Hand-inspect 100%',
      containmentResponsible: 'Kevin Miller',
      containmentDate: '2026-11-14',
      analysisMethod: '5why',
      rootCauseDescription: 'Viscosity increased due to solvent evaporation in open reservoir',
      correctiveActionDesc: '',
      correctiveResponsible: '',
      targetDateCorrective: '',
      effectivenessCheck: 'pending',
      status: 'd4',
    };
    seed8dRecords([d8]);

    const updated = await unifiedEightDApi.update('8d-step-05', {
      status: 'd6',
      correctiveActionDesc: 'Replaced open dip tank with automated closed-loop dispensing needle system with active viscosity monitor',
      correctiveResponsible: 'Kevin Miller',
      targetDateCorrective: '2026-11-20',
      implementationDate: '2026-11-18',
      validationResults: 'Evaluated 2,000 continuous ECUs over 14 days under 10x optical inspection: Zero bubbles detected.',
      effectivenessCheck: 'effective',
    });

    expect(updated.status).toBe('d6');
    expect(updated.correctiveActionDesc).toContain('automated closed-loop dispensing needle');
    expect(updated.validationResults).toContain('Zero bubbles detected');
    expect(updated.effectivenessCheck).toBe('effective');
  });

  it('concludes D7 (Prevent Recurrence) and D8 (Congratulate Team & Close)', async () => {
    const d8: D8Report = {
      id: '8d-step-07',
      eightDNumber: '8D-2026-005',
      symptomDescription: 'Packaging leak',
      emergencyResponse: '100% burst test',
      dateDetected: '2026-11-01',
      teamLeader: 'Dr. Sarah Connor',
      teamMembers: ['Eng 1', 'Eng 2'],
      department: 'Packaging',
      problemTitle: 'Blister Seal Leak',
      productName: 'Sterile Pack',
      problemDescription: 'Seal void',
      immediateAction: 'Hold pallet',
      containmentResponsible: 'Sarah Connor',
      containmentDate: '2026-11-01',
      analysisMethod: '5why',
      rootCauseDescription: 'Heater element hotspot',
      correctiveActionDesc: 'Replaced element with ceramic heater',
      correctiveResponsible: 'Sarah Connor',
      targetDateCorrective: '2026-11-10',
      effectivenessCheck: 'effective',
      status: 'd6',
    };
    seed8dRecords([d8]);

    const updated = await unifiedEightDApi.update('8d-step-07', {
      status: 'closed',
      preventiveActionPlan: 'Updated PFMEA #PFMEA-MED-03 (Occurrence: 3 -> 1); revised Control Plan #CP-MED-02 with continuous thermal imaging',
      lessonsLearned: 'Standardized ceramic heater replacement intervals across all four manufacturing facilities',
      closureDate: '2026-11-14',
    });

    expect(updated.status).toBe('closed');
    expect(updated.preventiveActionPlan).toContain('Updated PFMEA #PFMEA-MED-03');
    expect(updated.lessonsLearned).toContain('Standardized ceramic heater');
    expect(updated.closureDate).toBe('2026-11-14');
  });
});
