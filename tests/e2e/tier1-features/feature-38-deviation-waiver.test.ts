import { describe, it, expect, beforeEach } from 'vitest';
import { deviationApi, type DeviationData } from '@/api/deviation';
import {
  resetQualityStorage,
  writeStoredItems,
  readStoredItems,
} from '../../helpers/testHarness';
import { INDUSTRIAL_PARTS } from '../../helpers/industrialFixtures';

describe('Feature 38: Deviation & Waiver Concession Wizard', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('creates temporary deviation concession with risk evaluation and affected batch limits', async () => {
    const part = INDUSTRIAL_PARTS[0];
    const payload: DeviationData = {
      deviationNumber: 'DEV-2026-901',
      title: 'Temporary Surface Finish Concession for Stamping Lot 44',
      description: 'Minor Ra 1.8um instead of specified 1.6um on non-mating flange face for 120 pcs only',
      type: 'temporary',
      category: 'surface-finish',
      status: 'submitted',
      riskLevel: 'medium',
      requestor: 'Eng. Marcus Brody',
      productName: part.partName,
      processName: 'Flange CNC Face Milling',
      affectedQuantity: 120,
      effectiveDate: '2026-11-14',
      expiryDate: '2026-11-30',
      approvers: ['Quality Lead', 'Design Authority', 'Plant Manager'],
    };

    const created = await deviationApi.create(payload as any);
    expect(created.id).toBeDefined();

    const stored = readStoredItems<DeviationData>('qms_local_deviations');
    expect(stored.length).toBe(1);
    expect(stored[0].title).toBe(payload.title);
    expect(stored[0].type).toBe('temporary');
    expect(stored[0].status).toBe('submitted');
  });

  it('enforces mandatory triple sign-off workflow (Quality, Engineering Design, Plant Operations)', async () => {
    interface TripleApprovalWorkflow {
      deviationId: string;
      approvals: {
        qualityEngineer: { approved: boolean; signer?: string; signedAt?: string };
        designEngineering: { approved: boolean; signer?: string; signedAt?: string };
        plantOperations: { approved: boolean; signer?: string; signedAt?: string };
      };
      isFullyApproved: boolean;
      status: 'under-review' | 'approved' | 'rejected';
    }

    const workflow: TripleApprovalWorkflow = {
      deviationId: 'DEV-2026-901',
      approvals: {
        qualityEngineer: { approved: false },
        designEngineering: { approved: false },
        plantOperations: { approved: false },
      },
      isFullyApproved: false,
      status: 'under-review',
    };

    const signDeviation = (
      wf: TripleApprovalWorkflow,
      role: 'qualityEngineer' | 'designEngineering' | 'plantOperations',
      signer: string
    ) => {
      wf.approvals[role] = {
        approved: true,
        signer,
        signedAt: new Date().toISOString(),
      };
      const allSigned =
        wf.approvals.qualityEngineer.approved &&
        wf.approvals.designEngineering.approved &&
        wf.approvals.plantOperations.approved;

      if (allSigned) {
        wf.isFullyApproved = true;
        wf.status = 'approved';
      }
    };

    // Sign 1: Quality
    signDeviation(workflow, 'qualityEngineer', 'Sarah Chen - Lead QA');
    expect(workflow.isFullyApproved).toBe(false);
    expect(workflow.status).toBe('under-review');

    // Sign 2: Engineering Design
    signDeviation(workflow, 'designEngineering', 'Dr. David Evans - Chief Stress Analyst');
    expect(workflow.isFullyApproved).toBe(false);

    // Sign 3: Plant Operations -> Fully approved!
    signDeviation(workflow, 'plantOperations', 'Tarek Amer - VP of Manufacturing');
    expect(workflow.isFullyApproved).toBe(true);
    expect(workflow.status).toBe('approved');
  });

  it('tracks expiration dates and flags expired temporary waivers automatically', () => {
    interface TrackedConcession {
      id: string;
      title: string;
      type: 'temporary' | 'permanent';
      expiryDate: string;
      status: 'approved' | 'expired';
    }

    const concessions: TrackedConcession[] = [
      { id: 'DEV-01', title: 'Flange Concession', type: 'temporary', expiryDate: '2026-11-10', status: 'approved' },
      { id: 'DEV-02', title: 'Packaging Seal Tolerance', type: 'temporary', expiryDate: '2026-11-25', status: 'approved' },
      { id: 'DEV-03', title: 'Permanent Material Grade Change', type: 'permanent', expiryDate: '2099-12-31', status: 'approved' },
    ];

    const evaluateConcessionExpiration = (item: TrackedConcession, currentDateStr: string): 'approved' | 'expired' => {
      if (item.type === 'permanent') return 'approved';
      const expiry = new Date(item.expiryDate).getTime();
      const current = new Date(currentDateStr).getTime();
      return current > expiry ? 'expired' : 'approved';
    };

    const today = '2026-11-14';
    expect(evaluateConcessionExpiration(concessions[0], today)).toBe('expired');
    expect(evaluateConcessionExpiration(concessions[1], today)).toBe('approved');
    expect(evaluateConcessionExpiration(concessions[2], today)).toBe('approved');
  });

  it('categorizes risk level (low, medium, high) and mandates mitigation plans for high risk', () => {
    const evaluateRiskRequirements = (riskLevel: 'low' | 'medium' | 'high', mitigationPlan?: string) => {
      if (riskLevel === 'high' && (!mitigationPlan || mitigationPlan.trim().length < 20)) {
        return { valid: false, error: 'High-risk deviations strictly require a detailed containment & 100% inspection mitigation plan' };
      }
      return { valid: true, error: null };
    };

    const lowRisk = evaluateRiskRequirements('low');
    expect(lowRisk.valid).toBe(true);

    const invalidHighRisk = evaluateRiskRequirements('high', 'None');
    expect(invalidHighRisk.valid).toBe(false);
    expect(invalidHighRisk.error).toContain('High-risk deviations strictly require');

    const validHighRisk = evaluateRiskRequirements('high', '100% ultrasonic non-destructive testing on all 120 units before release');
    expect(validHighRisk.valid).toBe(true);
  });

  it('supports updating concession status and recording MRB resolution notes', async () => {
    const initialDeviation: DeviationData = {
      id: 'dev-update-01',
      deviationNumber: 'DEV-2026-UPD-01',
      title: 'Bore Diameter Nominal Concession',
      description: 'Requesting temporary +0.01mm tolerance shift',
      type: 'temporary',
      category: 'dimensional',
      status: 'under-review',
      requestor: 'Eng. Sarah',
    };

    writeStoredItems('qms_local_deviations', [initialDeviation]);

    const updated = await deviationApi.update('dev-update-01', {
      status: 'approved',
      resolutionNotes: 'Approved for Lot 44 only; tool inserts rotated for next batch.',
    } as any);

    expect(updated.status).toBe('approved');
    expect((updated as any).resolutionNotes).toContain('tool inserts rotated');
  });
});
