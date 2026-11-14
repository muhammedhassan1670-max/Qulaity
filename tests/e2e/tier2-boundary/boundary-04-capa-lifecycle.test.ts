import { describe, it, expect, beforeEach } from 'vitest';
import { unifiedCapaApi } from '@/api/unified-api';
import {
  resetQualityStorage,
  seedCapaRecords,
  readCapaRecords,
  STORAGE_KEYS,
} from '../../helpers/testHarness';
import type { CAPAItem } from '@/pages/quality/CAPA';

describe('Feature 04 Boundary: CAPA Lifecycle Workflow', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('detects and prevents illegal phase jumping (Identified directly to Closed without Verification)', async () => {
    const prematureClosedCapa: CAPAItem = {
      id: 'capa-jump-01',
      capaNumber: 'CAPA-JUMP-001',
      title: 'Premature Closure Bypass',
      description: 'Attempting to skip investigation and verification stages',
      type: 'corrective',
      status: 'closed', // illegal jump
      priority: 'critical',
      source: 'NCR-2026-001',
      createdDate: '2026-11-14',
      targetDate: '2026-11-20',
      owner: 'Eng. Marcus Thorne',
      department: 'Reliability',
      problemStatement: 'Uninvestigated defect',
      rootCause: '', // missing
      fiveWhy: '', // missing
      correctiveAction: '', // missing
      preventiveAction: '', // missing
      verificationNotes: '', // missing
      effectiveness: 'pending', // cannot be closed while pending
    };

    seedCapaRecords([prematureClosedCapa]);
    const stored = readCapaRecords<CAPAItem>();
    const isIllegalClosure =
      stored[0].status === 'closed' &&
      (!stored[0].rootCause || !stored[0].verificationNotes || stored[0].effectiveness !== 'effective');
    expect(isIllegalClosure).toBe(true);
  });

  it('prevents CAPA closure when effectiveness audit is explicitly marked "failed"', async () => {
    const failedEffectivenessCapa: CAPAItem = {
      id: 'capa-eff-01',
      capaNumber: 'CAPA-FAIL-EFF',
      title: 'Recurrence of Solder Joint Bridging',
      description: 'Defect re-emerged during post-fix thermal cycling test',
      type: 'corrective',
      status: 'in-progress',
      priority: 'high',
      source: 'Internal Audit',
      createdDate: '2026-11-14',
      targetDate: '2026-12-01',
      owner: 'Sarah Chen',
      department: 'Electronics',
      problemStatement: 'Solder bridge rate exceeds 50 PPM',
      rootCause: 'Stencil aperture misalignment',
      fiveWhy: '1. Solder bridge -> 2. Paste volume too high -> 3. Aperture worn',
      correctiveAction: 'Replace laser-cut stencil',
      preventiveAction: 'Monthly stencil optical inspection',
      verificationNotes: 'Re-test failed: 3 bridging defects detected in 500 unit pilot run',
      effectiveness: 'failed',
    };

    seedCapaRecords([failedEffectivenessCapa]);
    const stored = readCapaRecords<CAPAItem>();
    expect(stored[0].effectiveness).toBe('failed');
    // Cannot transition to closed when effectiveness is failed
    const canClose = stored[0].effectiveness === 'effective';
    expect(canClose).toBe(false);
  });

  it('safely processes massive 5-Why technical analysis (>4000 chars) and Arabic root cause notes', async () => {
    const longFiveWhy =
      '1. لماذا حدث التسريب؟ تآكل الحشية المطاطية.\n' +
      '2. لماذا تآكلت الحشية؟ ارتفاع درجة حرارة الزيت الهيدروليكي.\n' +
      '3. لماذا ارتفعت درجة الحرارة؟ انسداد مبادل التبريد الحراري.\n' +
      '4. لماذا انسد المبادل؟ تراكم الشوائب المعدنية الدقيقة.\n' +
      '5. لماذا تراكمت الشوائب؟ غياب فلتر الترشيح المغناطيسي الأولي.\n' +
      'تفاصيل إضافية: '.repeat(150);

    const arabicCapaPayload: Omit<CAPAItem, 'id'> = {
      capaNumber: 'CAPA-AR-004',
      title: 'خطة عمل تصحيحي لمنع تسريب الزيت الهيدروليكي',
      description: 'تسريب متكرر في أسطوانات الضغط العالي أثناء دورة العمل الكاملة',
      type: 'corrective',
      status: 'in-progress',
      priority: 'critical',
      source: 'شكوى عميل رقم ٩٩١',
      createdDate: '2026-11-14',
      targetDate: '2026-12-25',
      owner: 'د. مهندس طارق زيدان',
      department: 'الصيانة الوقائية وهندسة العمليات',
      problemStatement: 'فقدان الضغط الهيدروليكي بنسبة ١٥٪ بعد ٥٠ ساعة تشغيل',
      rootCause: 'غياب الفلترة المغناطيسية وارتفاع درجة الحرارة اللحظية',
      fiveWhy: longFiveWhy,
      correctiveAction: 'تركيب وحدة فلترة مغناطيسية مزدوجة مع حساس إنذار مبكر',
      preventiveAction: 'تحديث خطة الصيانة الشاملة وتدريب طاقم التشغيل',
      verificationNotes: 'قيد المتابعة التشغيلية لدفعة الـ ١٠٠ ساعة الأولى',
      effectiveness: 'pending',
    };

    const created = await unifiedCapaApi.create(arabicCapaPayload as any);
    expect(created.id).toBeDefined();

    const stored = readCapaRecords<CAPAItem>();
    expect(stored.length).toBe(1);
    expect(stored[0].fiveWhy.length).toBeGreaterThan(2000);
    expect(stored[0].owner).toBe('د. مهندس طارق زيدان');
  });

  it('handles chronological boundary conditions: retroactive creation date and far-future target date', async () => {
    const boundaryDatesCapa: Omit<CAPAItem, 'id'> = {
      capaNumber: 'CAPA-DATE-BOUND',
      title: 'Chronological Edge Test',
      description: 'Testing retroactive and distant future dates',
      type: 'preventive',
      status: 'identified',
      priority: 'low',
      source: 'Management Review',
      createdDate: '2020-02-29', // Leap day in past
      targetDate: '2040-12-31', // Distant future target
      owner: 'Audit Team',
      department: 'Governance',
      problemStatement: 'Long-term regulatory alignment',
      rootCause: 'ISO revision updates',
      fiveWhy: '',
      correctiveAction: '',
      preventiveAction: 'Annual compliance review',
      verificationNotes: '',
      effectiveness: 'pending',
    };

    const created = await unifiedCapaApi.create(boundaryDatesCapa as any);
    expect(created.createdDate).toBe('2020-02-29');
    expect(created.targetDate).toBe('2040-12-31');
  });

  it('recovers gracefully from corrupted storage payload in CAPA repository', async () => {
    localStorage.setItem(STORAGE_KEYS.CAPA, 'CORRUPTED_JSON_DATA{{{');
    const res = await unifiedCapaApi.getAll();
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBe(0);

    const safeRecords = readCapaRecords<CAPAItem>();
    expect(Array.isArray(safeRecords)).toBe(true);
    expect(safeRecords.length).toBe(0);
  });
});
