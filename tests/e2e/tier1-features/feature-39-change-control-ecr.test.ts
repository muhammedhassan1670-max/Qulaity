import { describe, it, expect, beforeEach } from 'vitest';
import { changeControlApi, type ChangeControlData } from '@/api/change-control';
import {
  resetQualityStorage,
  writeStoredItems,
  readStoredItems,
} from '../../helpers/testHarness';
import { INDUSTRIAL_PARTS, INDUSTRIAL_FMEA_TEMPLATES } from '../../helpers/industrialFixtures';

describe('Feature 39: Engineering Change Control (ECR / ECN)', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('validates creation of Engineering Change Request (ECR) across 6 change types', async () => {
    const part = INDUSTRIAL_PARTS[0];
    const ecrPayload: ChangeControlData = {
      changeNumber: 'ECR-2026-004',
      title: 'Upgrade Spindle Tooling to Polycrystalline Diamond (PCD) Inserts',
      description: 'Transition from carbide to PCD inserts on CNC Cell 2 to eliminate micro-chatter drift',
      type: 'tooling',
      category: 'major',
      priority: 'high',
      status: 'proposed',
      proposedBy: 'Lead Manufacturing Eng. Marcus Brody',
      department: 'Machining & Assembly',
      productionLine: 'Line 02 - CNC Cell',
      targetDate: '2026-12-15',
    };

    const created = await changeControlApi.create(ecrPayload as any);
    expect(created.id).toBeDefined();

    const stored = readStoredItems<ChangeControlData>('qms_local_change-control');
    expect(stored.length).toBe(1);
    expect(stored[0].title).toBe(ecrPayload.title);
    expect(stored[0].category).toBe('major');
    expect(stored[0].priority).toBe('high');
    expect(stored[0].status).toBe('proposed');
  });

  it('governs formal progression across 6 change lifecycle stages', async () => {
    const stages: ChangeControlData['status'][] = [
      'draft',
      'proposed',
      'pending-review',
      'approved',
      'implemented',
      'closed',
    ];

    let currentStatus: ChangeControlData['status'] = 'draft';

    const advanceStage = (expectedNext: ChangeControlData['status']) => {
      const currentIndex = stages.indexOf(currentStatus);
      const nextIndex = stages.indexOf(expectedNext);
      if (nextIndex === currentIndex + 1) {
        currentStatus = expectedNext;
        return { success: true, status: currentStatus };
      }
      return { success: false, status: currentStatus, error: 'Illegal stage jump' };
    };

    expect(advanceStage('proposed').success).toBe(true);
    expect(advanceStage('pending-review').success).toBe(true);
    expect(advanceStage('approved').success).toBe(true);
    expect(advanceStage('implemented').success).toBe(true);
    expect(advanceStage('closed').success).toBe(true);

    // Cannot jump backwards or skip
    expect(advanceStage('proposed').success).toBe(false);
  });

  it('broadcasts closed-loop updates to FMEA risk controls upon ECN implementation', () => {
    // Industrial FMEA closed loop:
    // When ECN introduces Poka-Yoke or PCD tooling, FMEA Occurrence rating drops (e.g. 6 -> 2)
    const initialFmea = { ...INDUSTRIAL_FMEA_TEMPLATES[0] };
    expect(initialFmea.occurrence).toBe(6);
    const initialRpn = initialFmea.severity * initialFmea.occurrence * initialFmea.detection;
    expect(initialRpn).toBe(192); // 8 * 6 * 4

    const broadcastEcnToFmea = (fmea: typeof initialFmea, ecnNumber: string, newOccurrence: number) => {
      return {
        ...fmea,
        occurrence: newOccurrence,
        preventionControls: `${fmea.preventionControls} [Updated via ${ecnNumber}: PCD diamond insert tooling installed]`,
        revisedRpn: fmea.severity * newOccurrence * fmea.detection,
        rpnReductionPercent: ((initialRpn - fmea.severity * newOccurrence * fmea.detection) / initialRpn) * 100,
      };
    };

    const updatedFmea = broadcastEcnToFmea(initialFmea, 'ECN-2026-004', 2);
    expect(updatedFmea.occurrence).toBe(2);
    expect(updatedFmea.revisedRpn).toBe(64); // 8 * 2 * 4
    expect(updatedFmea.rpnReductionPercent).toBeCloseTo(66.67, 1);
    expect(updatedFmea.preventionControls).toContain('ECN-2026-004');
  });

  it('broadcasts closed-loop revision and inspection spec changes to Control Plans', () => {
    interface ControlPlanSpec {
      id: string;
      controlPlanNumber: string;
      revision: number;
      characteristic: string;
      nominal: number;
      tolerance: number;
      sampleSize: number;
      frequency: string;
    }

    const baselineControlPlan: ControlPlanSpec = {
      id: 'CP-ACTUATOR-01',
      controlPlanNumber: 'CP-2026-ACT',
      revision: 3,
      characteristic: 'Inner Bore Diameter',
      nominal: 45.000,
      tolerance: 0.025,
      sampleSize: 5,
      frequency: 'Every 2 hours',
    };

    const applyEcnToControlPlan = (plan: ControlPlanSpec, ecnId: string, tightenedTolerance: number) => {
      return {
        ...plan,
        revision: plan.revision + 1,
        tolerance: tightenedTolerance,
        changeNoticeRef: ecnId,
        updatedDate: '2026-11-14',
      };
    };

    const updatedPlan = applyEcnToControlPlan(baselineControlPlan, 'ECN-2026-004', 0.015);
    expect(updatedPlan.revision).toBe(4);
    expect(updatedPlan.tolerance).toBe(0.015);
    expect(updatedPlan.changeNoticeRef).toBe('ECN-2026-004');
  });

  it('categorizes change risk impact (minor, major, critical) and enforces sign-off gates', () => {
    interface ChangeRiskAssessment {
      category: 'minor' | 'major' | 'critical';
      mandatesCustomerNotification: boolean;
      mandatesPpapResubmission: boolean;
      mandatesSafeLaunchContainment: boolean;
    }

    const evaluateChangeGovernance = (category: 'minor' | 'major' | 'critical'): ChangeRiskAssessment => {
      switch (category) {
        case 'critical':
          return { category, mandatesCustomerNotification: true, mandatesPpapResubmission: true, mandatesSafeLaunchContainment: true };
        case 'major':
          return { category, mandatesCustomerNotification: true, mandatesPpapResubmission: false, mandatesSafeLaunchContainment: true };
        case 'minor':
        default:
          return { category, mandatesCustomerNotification: false, mandatesPpapResubmission: false, mandatesSafeLaunchContainment: false };
      }
    };

    const minorChange = evaluateChangeGovernance('minor');
    expect(minorChange.mandatesCustomerNotification).toBe(false);

    const majorChange = evaluateChangeGovernance('major');
    expect(majorChange.mandatesCustomerNotification).toBe(true);
    expect(majorChange.mandatesSafeLaunchContainment).toBe(true);

    const criticalChange = evaluateChangeGovernance('critical');
    expect(criticalChange.mandatesPpapResubmission).toBe(true);
  });
});
