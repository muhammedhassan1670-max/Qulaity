import { describe, it, expect, beforeEach } from 'vitest';
import { unifiedFmeaApi } from '@/api/unified-api';
import {
  seedFmeaRecords,
  readFmeaRecords,
  resetQualityStorage,
} from '../../helpers/testHarness';
import { assertRpnCalculation } from '../../helpers/assertionHelpers';

describe('Feature 05: Closed-Loop FMEA Sync', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('establishes baseline FMEA entry with initial Severity, Occurrence, Detection and RPN', async () => {
    const fmeaPayload = {
      title: 'Die Casting Porosity Failure Mode',
      type: 'PFMEA',
      plantId: 'PLANT-FOUNDRY-01',
      departmentId: 'DEPT-CASTING',
      metadata: {
        processStep: 'High Pressure Die Casting',
        failureMode: 'Sub-surface gas porosity',
        failureEffect: 'Pressure containment leak during final hydrostatic test',
        severity: 8,
        occurrence: 6,
        detection: 4,
        rpn: 8 * 6 * 4, // 192
        preventionControls: 'Standard shot sleeve fill profile',
        detectionControls: 'Manual visual inspection and periodic water dunk test',
      },
    };

    const created = await unifiedFmeaApi.create(fmeaPayload as any);
    expect(created.id).toBeDefined();

    const stored = readFmeaRecords();
    expect(stored.length).toBe(1);
    expect(stored[0].metadata.rpn).toBe(192);
    assertRpnCalculation(8, 6, 4, 192);
  });

  it('updates Occurrence rating (O: 6 -> 2) when CAPA corrective action is verified', async () => {
    const initialFmea = {
      id: 'fmea-sync-01',
      title: 'Die Casting Porosity Failure Mode',
      type: 'PFMEA',
      plantId: 'PLANT-FOUNDRY-01',
      departmentId: 'DEPT-CASTING',
      metadata: {
        processStep: 'High Pressure Die Casting',
        failureMode: 'Sub-surface gas porosity',
        severity: 8,
        occurrence: 6,
        detection: 4,
        rpn: 192,
      },
    };
    seedFmeaRecords([initialFmea]);

    // CAPA verified: Vacuum-assisted casting installed, reducing defect occurrence rate from 4.5% to 0.05%
    const newOccurrence = 2;
    const severity = initialFmea.metadata.severity;
    const detection = initialFmea.metadata.detection;
    const newRpn = severity * newOccurrence * detection; // 8 * 2 * 4 = 64

    const updated = await unifiedFmeaApi.update('fmea-sync-01', {
      metadata: {
        ...initialFmea.metadata,
        occurrence: newOccurrence,
        rpn: newRpn,
        closedLoopCapaId: 'CAPA-2026-101',
        improvementNote: 'Occurrence dropped from 6 to 2 following vacuum evacuation upgrade',
      },
    });

    expect(updated.metadata.occurrence).toBe(2);
    expect(updated.metadata.rpn).toBe(64);
    expect(updated.metadata.closedLoopCapaId).toBe('CAPA-2026-101');
    assertRpnCalculation(8, 2, 4, 64);
  });

  it('updates Detection rating (D: 4 -> 1) when automated Poka-Yoke / inline inspection is deployed', async () => {
    const fmea = {
      id: 'fmea-sync-02',
      title: 'Missing Fastener on Chassis Assembly',
      type: 'PFMEA',
      plantId: 'PLANT-AUTO-01',
      departmentId: 'DEPT-ASSEMBLY',
      metadata: {
        processStep: 'Torque Fastening Station',
        failureMode: 'Omitted M10 structural bolt',
        severity: 8,
        occurrence: 3,
        detection: 5,
        rpn: 8 * 3 * 5, // 120
      },
    };
    seedFmeaRecords([fmea]);

    // CAPA verified: Smart torque tool with vision interlock will not release part until all 4 bolts torqued
    const newDetection = 1;
    const revisedRpn = fmea.metadata.severity * fmea.metadata.occurrence * newDetection; // 8 * 3 * 1 = 24

    const updated = await unifiedFmeaApi.update('fmea-sync-02', {
      metadata: {
        ...fmea.metadata,
        detection: newDetection,
        rpn: revisedRpn,
        detectionControls: 'Poka-Yoke vision interlock smart tool (100% automated shutoff)',
        closedLoopCapaId: 'CAPA-2026-POKA-01',
      },
    });

    expect(updated.metadata.detection).toBe(1);
    expect(updated.metadata.rpn).toBe(24);
    expect(updated.metadata.detectionControls).toContain('Poka-Yoke vision interlock');
    assertRpnCalculation(8, 3, 1, 24);
  });

  it('re-evaluates risk classification when RPN drops below critical threshold (100)', async () => {
    const highRiskFmea = {
      id: 'fmea-sync-03',
      title: 'Sterile Barrier Seal Wrinkle',
      type: 'PFMEA',
      plantId: 'PLANT-MED-01',
      departmentId: 'DEPT-PACKAGING',
      metadata: {
        severity: 9,
        occurrence: 4,
        detection: 4,
        rpn: 144, // High risk (>= 100)
        riskCategory: 'High',
      },
    };
    seedFmeaRecords([highRiskFmea]);

    // Apply verification updates
    const revisedO = 2;
    const revisedD = 2;
    const revisedRpn = 9 * revisedO * revisedD; // 36
    const revisedCategory = revisedRpn >= 100 ? 'High' : revisedRpn >= 50 ? 'Moderate' : 'Low';

    const updated = await unifiedFmeaApi.update('fmea-sync-03', {
      metadata: {
        ...highRiskFmea.metadata,
        occurrence: revisedO,
        detection: revisedD,
        rpn: revisedRpn,
        riskCategory: revisedCategory,
      },
    });

    expect(updated.metadata.rpn).toBe(36);
    expect(updated.metadata.riskCategory).toBe('Low');
    expect(updated.metadata.rpn).toBeLessThan(100);
  });

  it('records chronological audit trail of multiple continuous improvement syncs', async () => {
    const fmea = {
      id: 'fmea-sync-04',
      title: 'Stamping Hole Centerline Offset',
      type: 'PFMEA',
      plantId: 'PLANT-STAMP-01',
      metadata: {
        severity: 7,
        occurrence: 7,
        detection: 4,
        rpn: 196,
        revisionHistory: [
          { rev: 'Rev A', date: '2026-01-10', rpn: 196, note: 'Initial PFMEA release' },
        ],
      },
    };
    seedFmeaRecords([fmea]);

    // Revision B after die re-grind
    const revBHistory = [
      ...fmea.metadata.revisionHistory,
      { rev: 'Rev B', date: '2026-06-15', rpn: 112, note: 'Die guide pins refurbished (O: 7 -> 4)' },
    ];
    const updatedRevB = await unifiedFmeaApi.update('fmea-sync-04', {
      metadata: {
        ...fmea.metadata,
        occurrence: 4,
        rpn: 7 * 4 * 4, // 112
        revisionHistory: revBHistory,
      },
    });

    // Revision C after in-die sensor installation
    const revCHistory = [
      ...updatedRevB.metadata.revisionHistory,
      { rev: 'Rev C', date: '2026-11-14', rpn: 28, note: 'In-die laser sensor deployed (D: 4 -> 1)' },
    ];
    const updatedRevC = await unifiedFmeaApi.update('fmea-sync-04', {
      metadata: {
        ...updatedRevB.metadata,
        detection: 1,
        rpn: 7 * 4 * 1, // 28
        revisionHistory: revCHistory,
      },
    });

    expect(updatedRevC.metadata.revisionHistory.length).toBe(3);
    expect(updatedRevC.metadata.rpn).toBe(28);
    expect(updatedRevC.metadata.revisionHistory[2].note).toContain('In-die laser sensor deployed');
  });
});
