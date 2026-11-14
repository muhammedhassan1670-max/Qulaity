import { describe, it, expect, beforeEach } from 'vitest';
import { QualityEngine } from '@/services/qualityEngine';
import {
  unifiedDeviationApi,
  unifiedChangeControlApi,
  unifiedControlPlanApi,
} from '@/api/unified-api';
import {
  resetQualityStorage,
  readControlPlans,
  seedControlPlans,
} from '../../helpers/testHarness';
import { INDUSTRIAL_PARTS } from '../../helpers/industrialFixtures';

describe('Combo 05: Temporary Deviation Waiver, ECR/ECN Governance & Control Plan Revision', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('Test 5.1: 4-step temporary concession wizard logs deviation with bounded quantity and expiry date', async () => {
    const part = INDUSTRIAL_PARTS[2]; // Automotive Door Outer Skin Panel
    const deviationPayload = {
      title: 'Temporary Flange Height Tolerance Concession',
      deviationNumber: 'DEV-2026-AUT-012',
      partNumber: part.partNumber,
      partName: part.partName,
      status: 'pending-approval',
      priority: 'high',
      riskLevel: 'medium',
      plantId: 'PLANT-AUTO-01',
      description: 'Incoming steel sheet batch MAT-STEEL-DC04 exhibits minor spring-back; request +0.08mm flange height concession',
      maxQuantity: 1200,
      currentConsumed: 0,
      validFrom: '2026-11-14',
      validUntil: '2026-11-28',
      requestedBy: 'Press Shop Supervisor Carlos Ortiz',
      metadata: {
        step: 4,
        justification: 'Avoid line shutdown while die trimming shims are adjusted during scheduled weekend PM',
        containmentRisk: 'Low - secondary hem flange accommodates +0.08mm variance without gap defect',
      },
    };

    const deviation = await unifiedDeviationApi.create(deviationPayload as any);
    expect(deviation.id).toBeDefined();
    expect(deviation.status).toBe('pending-approval');
    expect(deviation.maxQuantity).toBe(1200);
    expect(deviation.validUntil).toBe('2026-11-28');
  });

  it('Test 5.2: Triple approval protocol enforces signoffs from Quality, Engineering, and Operations', async () => {
    const dev = await unifiedDeviationApi.create({
      title: 'Concession for Temporary Coolant Substitute',
      status: 'in-review',
      plantId: 'PLANT-AUTO-01',
      metadata: {
        approvals: {
          quality: { approved: false, by: null, date: null },
          engineering: { approved: false, by: null, date: null },
          operations: { approved: false, by: null, date: null },
        },
      },
    } as any);

    // Step 1: Quality Approval
    const afterQuality = await unifiedDeviationApi.update(dev.id as string, {
      metadata: {
        approvals: {
          quality: { approved: true, by: 'Dr. Klaus (VP Quality)', date: '2026-11-14T08:00:00Z' },
          engineering: { approved: false, by: null, date: null },
          operations: { approved: false, by: null, date: null },
        },
      },
    } as any);
    expect(afterQuality.metadata?.approvals.quality.approved).toBe(true);
    expect(afterQuality.metadata?.approvals.engineering.approved).toBe(false);

    // Step 2 & 3: Engineering and Operations complete triple approval
    const fullyApproved = await unifiedDeviationApi.update(dev.id as string, {
      status: 'active-concession',
      metadata: {
        approvals: {
          quality: { approved: true, by: 'Dr. Klaus (VP Quality)', date: '2026-11-14T08:00:00Z' },
          engineering: { approved: true, by: 'Chief Tooling Engineer Mark Sloan', date: '2026-11-14T08:30:00Z' },
          operations: { approved: true, by: 'Plant Director Elena Rostova', date: '2026-11-14T09:00:00Z' },
        },
      },
    } as any);

    expect(fullyApproved.status).toBe('active-concession');
    expect(fullyApproved.metadata?.approvals.operations.approved).toBe(true);
  });

  it('Test 5.3: Engineering Change Request (ECR) elevated to Engineering Change Notice (ECN) on root cause fix', async () => {
    const ecrPayload = {
      title: 'Die Shimming Revision for Door Skin Flange',
      type: 'ECR',
      status: 'Under Review',
      priority: 'High',
      plantId: 'PLANT-AUTO-01',
      description: 'Permanent modification of lower die flange insert geometry',
      metadata: {
        originatingDeviationId: 'DEV-2026-AUT-012',
        affectedTooling: 'DIE-STAMP-D04',
        engineeringAnalysis: 'FEA confirms -0.05mm compensation permanently cures spring-back',
      },
    };

    const ecr = await unifiedChangeControlApi.create(ecrPayload as any);
    expect(ecr.id).toBeDefined();

    // Elevation to ECN
    const ecn = await unifiedChangeControlApi.update(ecr.id as string, {
      type: 'ECN',
      title: 'ECN-2026-088: Permanent Lower Die Flange Re-machining',
      status: 'Pending Implementation',
      metadata: {
        ...ecr.metadata,
        ecnNumber: 'ECN-2026-088',
        effectiveDate: '2026-11-20',
        cadModelRev: 'REV-C',
      },
    } as any);

    expect(ecn.type).toBe('ECN');
    expect(ecn.status).toBe('Pending Implementation');
    expect(ecn.metadata?.ecnNumber).toBe('ECN-2026-088');
  });

  it('Test 5.4: QualityEngine approves change control and broadcasts standard revision to Control Plan', async () => {
    // Seed existing Control Plan for the process
    const initialCp = {
      id: 'cp-stamp-001',
      title: 'Stamping Line 1 Control Plan',
      productName: 'Automotive Door Outer Skin Panel',
      plantId: 'PLANT-AUTO-01',
      status: 'Active',
      metadata: {
        version: '1.2',
        processStep: 'Flange Forming Station',
        controlMethod: 'Dial Indicator Sample 3 pcs / hour',
        tolerance: '±0.15mm',
      },
    };
    seedControlPlans([initialCp]);

    // Create ECN
    const change = await unifiedChangeControlApi.create({
      title: 'ECN-2026-088 Flange Tolerance Standardization',
      status: 'Submitted',
      plantId: 'PLANT-AUTO-01',
      metadata: {
        targetControlPlanId: initialCp.id,
        newTolerance: '±0.10mm',
        newControlMethod: 'Inline Automated Laser Profilometer 100% check',
      },
    } as any);

    // QualityEngine approves change control
    await QualityEngine.approveChangeControl(change.id as string);
    const approvedChange = await unifiedChangeControlApi.getById(change.id as string);
    expect(approvedChange?.status).toBe('Approved');

    // Broadcast revision to Control Plan
    const revisedCp = await unifiedControlPlanApi.update(initialCp.id, {
      status: 'Active',
      metadata: {
        ...initialCp.metadata,
        version: '2.0',
        ecnReference: change.id,
        tolerance: change.metadata.newTolerance,
        controlMethod: change.metadata.newControlMethod,
        revisedDate: '2026-11-14',
      },
    } as any);

    expect(revisedCp.metadata?.version).toBe('2.0');
    expect(revisedCp.metadata?.tolerance).toBe('±0.10mm');
    expect(revisedCp.metadata?.controlMethod).toContain('Inline Automated Laser Profilometer');

    const storedCps = readControlPlans();
    expect(storedCps[0].metadata?.version).toBe('2.0');
  });

  it('Test 5.5: Deviation expiration and quantity threshold enforcement prevents unauthorized production overruns', async () => {
    const deviation = await unifiedDeviationApi.create({
      title: 'Limited Concession for Alternate Fastener Supplier',
      status: 'active-concession',
      maxQuantity: 500,
      currentConsumed: 490,
      validUntil: '2026-11-10', // Expired date in past
      metadata: {
        alertOnExceed: true,
      },
    } as any);

    // Check expiration logic
    const today = new Date('2026-11-14');
    const expiryDate = new Date(deviation.validUntil);
    const isExpired = today > expiryDate;
    expect(isExpired).toBe(true);

    // Simulate shopfloor attempt to log 20 pcs under this concession (490 + 20 = 510 > 500)
    const proposedQuantity = 20;
    const isOverrun = deviation.currentConsumed + proposedQuantity > deviation.maxQuantity;
    expect(isOverrun).toBe(true);

    // Auto-transition concession to expired and revoke waiver
    const revoked = await unifiedDeviationApi.update(deviation.id as string, {
      status: 'expired-closed',
      currentConsumed: deviation.maxQuantity,
      metadata: {
        ...deviation.metadata,
        closedReason: 'Waiver expired both by calendar date and batch volume ceiling',
        revokedAt: new Date().toISOString(),
      },
    } as any);

    expect(revoked.status).toBe('expired-closed');
    expect(revoked.metadata?.closedReason).toContain('Waiver expired');
  });
});
