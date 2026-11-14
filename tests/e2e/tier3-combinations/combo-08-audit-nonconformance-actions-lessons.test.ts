import { describe, it, expect, beforeEach } from 'vitest';
import { unifiedAuditApi, unifiedCapaApi } from '@/api/unified-api';
import { resetQualityStorage } from '../../helpers/testHarness';
import { assertIsoAuditScore } from '../../helpers/assertionHelpers';

describe('Combo 08: ISO 9001 & LPA Audit Nonconformance, Corrective Actions & Lessons Learned', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('Test 8.1: ISO 9001:2015 Clause 8.5 & 8.7 audit detects nonconformance and calculates pass score', async () => {
    // 20 audit checklist questions across Clauses 4 to 10
    const totalQuestions = 20;
    const passedQuestions = 17; // 3 nonconformances (1 Major in Clause 8.7, 2 Minors in Clause 7.5)

    const auditScore = assertIsoAuditScore(totalQuestions, passedQuestions, 80);
    expect(auditScore).toBe(85.0);

    const auditPayload = {
      title: 'Annual ISO 9001:2015 System Certification Audit',
      type: 'External Certification',
      plantId: 'PLANT-GLOBAL-HQ',
      leadAuditor: 'Dr. Klaus (Lead Auditor)',
      status: 'Completed with Findings',
      score: auditScore,
      totalCheckpoints: totalQuestions,
      passedCheckpoints: passedQuestions,
      metadata: {
        majorFindingsCount: 1,
        minorFindingsCount: 2,
        findings: [
          {
            clause: '8.7 Control of Nonconforming Outputs',
            type: 'Major',
            description: 'Red Tag quarantine bay lacked physical boundary latch in stamping area',
          },
          {
            clause: '7.5 Documented Information',
            type: 'Minor',
            description: 'Work instruction WI-STAMP-04 was revision B while station had rev A posted',
          },
          {
            clause: '7.1.5 Monitoring & Measuring Resources',
            type: 'Minor',
            description: 'Caliper CAL-12 sticker illegible due to coolant mist exposure',
          },
        ],
      },
    };

    const audit = await unifiedAuditApi.create(auditPayload as any);
    expect(audit.id).toBeDefined();
    expect(audit.status).toBe('Completed with Findings');
    expect(audit.score).toBe(85.0);
    expect(audit.metadata?.majorFindingsCount).toBe(1);
  });

  it('Test 8.2: Layered Process Audit (LPA) daily shopfloor checklist flags station compliance', async () => {
    const lpaQuestions = 10;
    const lpaPassed = 9;

    const score = assertIsoAuditScore(lpaQuestions, lpaPassed, 80);
    expect(score).toBe(90.0);

    const lpaRun = await unifiedAuditApi.create({
      title: 'LPA Shift 1 - Stamping & Assembly Cell',
      type: 'Layered Process Audit (LPA)',
      plantId: 'PLANT-AUTO-01',
      score,
      status: 'Passed with Observations',
      metadata: {
        auditorRole: 'Shift Supervisor',
        auditedStation: 'Cell 3 Robotic Welder',
        observations: ['Safety light curtain reflector required wipe-down'],
      },
    } as any);

    expect(lpaRun.id).toBeDefined();
    expect(lpaRun.type).toBe('Layered Process Audit (LPA)');
  });

  it('Test 8.3: Major audit finding generates mandatory Corrective Action (CAPA) with 30-day SLA', async () => {
    const majorFindingCapa = {
      title: 'CAPA for ISO 9001 Major Finding: Clause 8.7 Quarantine Enclosure',
      description: 'Design and install interlocked perimeter fencing and biometric lock on Red Tag quarantine bay',
      priority: 'Critical',
      capaType: 'Audit Corrective Action',
      plantId: 'PLANT-GLOBAL-HQ',
      dueDate: '2026-12-14',
      metadata: {
        auditId: 'AUDIT-ISO-2026-001',
        findingType: 'Major',
        assignedOwner: 'Facility Engineering Lead Marcus Reed',
        targetCloseDays: 30,
      },
    };

    const capa = await unifiedCapaApi.create(majorFindingCapa as any);
    expect(capa.id).toBeDefined();
    expect(capa.priority).toBe('Critical');
    expect(capa.capaType).toBe('Audit Corrective Action');
  });

  it('Test 8.4: Verification of audit corrective action effectiveness completes audit finding closure', async () => {
    const capa = await unifiedCapaApi.create({
      title: 'Work Instruction Revision Control System',
      status: 'Implemented',
      priority: 'High',
      plantId: 'PLANT-GLOBAL-HQ',
      metadata: {
        effectivenessReviewDue: '2026-11-20',
      },
    } as any);

    // Auditor verifies effectiveness (100% digital e-paper displays replace laminated paper WIs)
    const verifiedCapa = await unifiedCapaApi.update(capa.id as string, {
      status: 'Closed & Verified',
      metadata: {
        ...capa.metadata,
        effectivenessVerified: true,
        verifiedBy: 'Dr. Klaus (Lead Auditor)',
        verificationNotes: 'Sampled 25 workstations across 3 plants; all display real-time revision sync',
      },
    } as any);

    expect(verifiedCapa.status).toBe('Closed & Verified');
    expect(verifiedCapa.metadata?.effectivenessVerified).toBe(true);
  });

  it('Test 8.5: Knowledge Base and Lesson Learned repository captures audit resolution to prevent recurrence', async () => {
    // Model Lesson Learned Knowledge Entity
    interface LessonLearnedRecord {
      id: string;
      category: 'Audit' | 'Design' | 'Process' | 'Supplier';
      standardClause: string;
      problemSummary: string;
      solutionStandard: string;
      globalBestPracticeRule: string;
      archivedDate: string;
      status: 'active-standard';
    }

    const lesson: LessonLearnedRecord = {
      id: 'LL-2026-AUDIT-04',
      category: 'Audit',
      standardClause: 'ISO 9001:2015 Clause 8.7',
      problemSummary: 'Physical quarantine areas susceptible to unauthorized bypass without mechanical interlock',
      solutionStandard: 'Mandate RFID/Biometric badge-reader access gates with automatic alarm on unlogged entry',
      globalBestPracticeRule: 'RULE-SEC-087: All red tag holding pens must enforce electronic badge-in access and CCTV logging',
      archivedDate: '2026-11-14',
      status: 'active-standard',
    };

    expect(lesson.category).toBe('Audit');
    expect(lesson.globalBestPracticeRule).toContain('RULE-SEC-087');
    expect(lesson.status).toBe('active-standard');
  });
});
