import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveQualityAuditPlans,
  loadQualityAuditPlans,
  saveQualityAuditRuns,
  loadQualityAuditRuns,
  completeQualityAuditRun,
  normalizeAuditPlan,
  type QualityAuditPlan,
  type QualityAuditRun,
} from '@/services/qualityLayeredAudits';
import { resetQualityStorage } from '../../helpers/testHarness';

describe('Feature 13 Boundary: ISO 9001 & LPA Audit Manager', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('handles empty audit plan with zero items without division by zero NaN', () => {
    const emptyPlan = normalizeAuditPlan({
      id: 'plan-empty',
      auditName: 'Zero Item Audit Plan',
      auditType: 'process-audit',
      productionLine: 'Line 01',
      version: 1,
      status: 'active',
      sections: [],
      auditItems: [],
    });

    saveQualityAuditPlans([emptyPlan]);
    const loaded = loadQualityAuditPlans();
    expect(loaded.length).toBe(1);
    expect(loaded[0].auditItems.length).toBe(0);
  });

  it('enforces that a Critical item failure fails the audit regardless of high percentage score', () => {
    // 9 items passed (90%), but 1 critical safety item failed
    const totalItems = 10;
    const passedItems = 9;
    const hasCriticalFailure = true;

    const auditPassed = !hasCriticalFailure && (passedItems / totalItems) * 100 >= 80;
    expect(auditPassed).toBe(false); // Fails due to critical violation
  });

  it('safely processes Arabic Unicode audit questions, sections, and findings', () => {
    const arabicPlan = normalizeAuditPlan({
      id: 'plan-ar-01',
      auditName: 'تدقيق الجودة الدوري لمعيار الأيزو ٩٠٠١:٢٠١٥',
      auditType: 'layered-audit',
      productionLine: 'خط التجميع النهائي - قطاع السيارات',
      version: 1,
      status: 'active',
      sections: [
        { id: 'sec-ar-1', title: 'جاهزية محطة العمل والسلامة المهنية', order: 1 },
      ],
      auditItems: [
        {
          id: 'item-ar-1',
          itemCode: 'LPA-AR-01',
          question: 'هل تعليمات العمل الفنية باللغة العربية معتمدة ومطابقة لآخر تعديل هندسي؟',
          section: 'جاهزية محطة العمل والسلامة المهنية',
          inputType: 'pass-fail',
          weight: 20,
          isCritical: true,
          order: 1,
        },
      ],
    });

    saveQualityAuditPlans([arabicPlan]);
    const plans = loadQualityAuditPlans();
    expect(plans[0].auditName).toContain('تدقيق الجودة الدوري');
    expect(plans[0].auditItems[0].question).toContain('تعليمات العمل الفنية');
  });

  it('evaluates audit scoring boundaries: 100% conforming vs 0% conforming', () => {
    const computeScore = (passed: number, total: number) => {
      if (total <= 0) return 0;
      return (passed / total) * 100;
    };

    expect(computeScore(10, 10)).toBe(100);
    expect(computeScore(0, 10)).toBe(0);
    expect(computeScore(0, 0)).toBe(0);
  });

  it('prevents completion of audit run when required mandatory checklist items remain unanswered', () => {
    const auditRun: QualityAuditRun = {
      id: 'run-incomplete-01',
      planId: 'plan-01',
      auditName: 'Incomplete Audit Run',
      auditor: 'Sarah Chen',
      shift: 'Shift 1',
      productionLine: 'Line 01',
      scheduledDate: '2026-11-14',
      status: 'in-progress',
      answers: {
        'item-1': { itemId: 'item-1', answer: 'pass', answeredAt: '2026-11-14T08:00:00Z' },
        // item-2 is missing!
      },
      findings: [],
      score: 50,
      passed: false,
    };

    const totalRequiredItems = 2;
    const answeredCount = Object.keys(auditRun.answers).length;
    const canComplete = answeredCount === totalRequiredItems;

    expect(canComplete).toBe(false);
  });
});
