import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveQualityAuditPlans,
  loadQualityAuditPlans,
  saveQualityAuditRuns,
  loadQualityAuditRuns,
  completeQualityAuditRun,
  addAuditRunNcrLink,
  normalizeAuditPlan,
  type QualityAuditPlan,
  type QualityAuditRun,
} from '@/services/qualityLayeredAudits';
import { resetQualityStorage } from '../../helpers/testHarness';
import { assertIsoAuditScore } from '../../helpers/assertionHelpers';

describe('Feature 13: ISO 9001 & LPA Audit Manager', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('creates structured ISO 9001 / Layered Process Audit (LPA) checklist plan', () => {
    const auditPlan: QualityAuditPlan = normalizeAuditPlan({
      id: 'plan-iso-01',
      auditName: 'ISO 9001:2015 Clause 8.5 Production & Service Provision Audit',
      auditType: 'layered-audit',
      productionLine: 'Line 01 - Machining',
      version: 1,
      status: 'active',
      sections: [
        { id: 'sec-1', title: 'Workstation Readiness', order: 1 },
        { id: 'sec-2', title: 'Process Control & Tooling', order: 2 },
      ],
      auditItems: [
        {
          id: 'item-1',
          itemCode: 'LPA-01',
          question: 'Is the current revision Work Instruction displayed and followed by the operator?',
          section: 'Workstation Readiness',
          inputType: 'pass-fail',
          weight: 10,
          isCritical: true,
          requiredEvidence: false,
          order: 1,
        },
        {
          id: 'item-2',
          itemCode: 'LPA-02',
          question: 'Are all measuring gauges currently within valid calibration dates?',
          section: 'Process Control & Tooling',
          inputType: 'pass-fail',
          weight: 15,
          isCritical: true,
          findingTypeIfFail: 'Calibration non-conformance',
          severityIfFail: 'critical',
          suggestedAction: 'Immediate stop of line and gauge quarantine',
          requiredEvidence: true,
          order: 2,
        },
      ],
    });

    saveQualityAuditPlans([auditPlan]);
    const plans = loadQualityAuditPlans();

    expect(plans.length).toBe(1);
    expect(plans[0].auditName).toContain('ISO 9001:2015');
    expect(plans[0].auditItems.length).toBe(2);
    expect(plans[0].auditItems[1].isCritical).toBe(true);
  });

  it('records audit execution answers and computes compliance score percentage', () => {
    const totalQuestions = 10;
    const passedQuestions = 9;
    const score = assertIsoAuditScore(totalQuestions, passedQuestions, 80);

    expect(score).toBe(90.0);
  });

  it('creates audit findings with severity classification when checklist questions fail', () => {
    const plan: QualityAuditPlan = normalizeAuditPlan({
      id: 'plan-lpa-02',
      auditName: 'Tier 2 Supervisor Layered Audit',
      auditType: 'layered-audit',
      auditItems: [
        {
          id: 'item-10',
          itemCode: 'LPA-10',
          question: 'Are first-piece inspection tags signed off?',
          section: 'Inspection',
          inputType: 'pass-fail',
          weight: 10,
          isCritical: true,
          severityIfFail: 'major',
          findingTypeIfFail: 'Missing Quality Gate Signoff',
          suggestedAction: 'Hold batch until verified',
          requiredEvidence: true,
          order: 1,
        },
      ],
    });
    saveQualityAuditPlans([plan]);

    const run: QualityAuditRun = {
      id: 'run-lpa-001',
      auditPlanId: 'plan-lpa-02',
      auditPlanVersion: 1,
      auditType: 'layered-audit',
      auditor: 'Lead Auditor Davis',
      startedAt: new Date().toISOString(),
      status: 'in-progress',
      answers: [
        {
          auditItemId: 'item-10',
          result: 'fail',
          notes: 'First piece produced without sign-off stamp',
          finding: {
            id: 'find-01',
            auditItemId: 'item-10',
            itemCode: 'LPA-10',
            question: 'Are first-piece inspection tags signed off?',
            findingType: 'Missing Quality Gate Signoff',
            severity: 'major',
            suggestedAction: 'Hold batch until verified',
            evidenceMissing: true,
            repeatedCount: 1,
          },
        },
      ],
      findings: [
        {
          id: 'find-01',
          auditItemId: 'item-10',
          itemCode: 'LPA-10',
          question: 'Are first-piece inspection tags signed off?',
          findingType: 'Missing Quality Gate Signoff',
          severity: 'major',
          suggestedAction: 'Hold batch until verified',
          evidenceMissing: true,
          repeatedCount: 1,
        },
      ],
      auditScore: 0,
      createdActionIds: [],
      createdNcrIds: [],
    };

    saveQualityAuditRuns([run]);
    const storedRuns = loadQualityAuditRuns();

    expect(storedRuns.length).toBe(1);
    expect(storedRuns[0].findings.length).toBe(1);
    expect(storedRuns[0].findings[0].severity).toBe('major');
    expect(storedRuns[0].findings[0].findingType).toBe('Missing Quality Gate Signoff');
  });

  it('completes audit run updating run status and final audit score', () => {
    const plan: QualityAuditPlan = normalizeAuditPlan({
      id: 'plan-lpa-03',
      auditName: 'Daily 5S & Quality Audit',
      auditType: 'layered-audit',
      auditItems: [
        {
          id: 'it-1',
          itemCode: 'Q1',
          question: 'Check 1',
          section: 'S1',
          inputType: 'pass-fail',
          weight: 10,
          isCritical: false,
          requiredEvidence: false,
          order: 1,
        },
      ],
    });
    saveQualityAuditPlans([plan]);

    const run: QualityAuditRun = {
      id: 'run-lpa-002',
      auditPlanId: 'plan-lpa-03',
      auditPlanVersion: 1,
      auditType: 'layered-audit',
      startedAt: new Date().toISOString(),
      status: 'in-progress',
      answers: [
        { auditItemId: 'it-1', result: 'pass' },
      ],
      findings: [],
      auditScore: 100,
      createdActionIds: [],
      createdNcrIds: [],
    };

    const completed = completeQualityAuditRun(run);
    expect(completed.status).toBe('completed');
    expect(completed.completedAt).toBeDefined();
    expect(completed.auditScore).toBe(100);
  });

  it('links auto-generated NCR to failed audit finding', () => {
    const run: QualityAuditRun = {
      id: 'run-lpa-003',
      auditPlanId: 'plan-lpa-03',
      auditPlanVersion: 1,
      auditType: 'layered-audit',
      startedAt: new Date().toISOString(),
      status: 'completed',
      answers: [],
      findings: [
        {
          id: 'f-101',
          auditItemId: 'it-1',
          itemCode: 'Q1',
          question: 'Gauge accuracy check',
          findingType: 'Calibration failure',
          severity: 'critical',
          evidenceMissing: false,
          repeatedCount: 1,
        },
      ],
      auditScore: 0,
      createdActionIds: [],
      createdNcrIds: [],
    };
    saveQualityAuditRuns([run]);

    const updated = addAuditRunNcrLink('run-lpa-003', 'f-101', 'NCR-2026-AUDIT-99');
    expect(updated).not.toBeNull();
    expect(updated?.createdNcrIds).toContain('NCR-2026-AUDIT-99');
  });
});
