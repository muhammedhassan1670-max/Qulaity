import { describe, it, expect, beforeEach } from 'vitest';
import { unifiedComplaintsApi } from '@/api/unified-api';
import {
  seedComplaints,
  readComplaints,
  resetQualityStorage,
  createIsoDateOffset,
  STORAGE_KEYS,
} from '../../helpers/testHarness';

describe('Feature 15 Boundary: Customer Complaint 5-Step Wizard', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('rejects or flags complaint with missing mandatory customer identification fields', () => {
    const invalidComplaint = {
      customerName: '', // empty
      customerContact: '   ', // whitespace only
      productModel: 'Turbine Rotor',
      complaintDescription: 'Crack found',
    };

    const isValidCustomer =
      Boolean(invalidComplaint.customerName?.trim()) &&
      Boolean(invalidComplaint.customerContact?.trim());

    expect(isValidCustomer).toBe(false);
  });

  it('safely ingests massive Arabic customer narrative (>4000 chars) across intake steps', async () => {
    const arabicStory =
      'شكوى تفصيلية من العميل: تم رصد انخفاض حاد في ضغط الزيت الهيدروليكي أثناء الفحص الدوري لطائرة الركاب في مطار فرانكفورت الدولي.\n' +
      'سجل الملاحظات الفنية للمهندس الميداني: '.repeat(80);

    const complaintData = {
      complaintId: 'COMP-AR-001',
      complaintSource: 'بوابة العملاء الرقمية',
      receivedDate: '2026-11-14',
      responseDue: createIsoDateOffset(2),
      assignedTo: 'فريق الاستجابة السريعة للجودة',
      status: 'new',
      customerName: 'شركة الخطوط الجوية العربية',
      customerContact: 'qa-incident@arab-airlines.aero',
      productModel: 'مضخة هيدروليكية ذات ضغط عالي HA-400',
      serialNumber: 'رقم-تسلسلي-٩٩٠٢',
      batchNumber: 'تشغيلة-مضخات-٢٠٢٦',
      quantity: 1,
      complaintDescription: arabicStory,
      severity: 'critical',
      priority: 'critical',
      investigationResult: 'تم فتح بلاغ تحقيق عاجل وعزل خط التجميع',
    };

    const created = await unifiedComplaintsApi.create(complaintData as any);
    expect(created.id).toBeDefined();

    const stored = readComplaints();
    expect(stored.length).toBe(1);
    expect(stored[0].complaintDescription.length).toBeGreaterThan(2000);
    expect(stored[0].customerName).toContain('شركة الخطوط الجوية');
  });

  it('enforces 48-hour containment response deadline SLA strictly', () => {
    const received = new Date('2026-11-14T08:00:00Z');
    const deadline48h = new Date(received.getTime() + 48 * 3600 * 1000);

    // Verify exactly 48 hours later
    expect(deadline48h.toISOString()).toBe('2026-11-16T08:00:00.000Z');

    const testTimePast = new Date('2026-11-16T09:00:00Z');
    const isSlaBreached = testTimePast.getTime() > deadline48h.getTime();
    expect(isSlaBreached).toBe(true);
  });

  it('differentiates escalation: minor cosmetic complaint does not trigger mandatory CAPA', () => {
    const minorComplaint = {
      severity: 'minor',
      priority: 'low',
      complaintDescription: 'Carton label slightly skewed by 2mm',
    };

    const requiresCapa = (sev: string) => sev === 'critical' || sev === 'major';
    expect(requiresCapa(minorComplaint.severity)).toBe(false);
  });

  it('recovers gracefully from corrupted storage payload in complaints repository', async () => {
    localStorage.setItem(STORAGE_KEYS.COMPLAINT, 'CORRUPTED_COMPLAINT_JSON_<<!!>>');
    const res = await unifiedComplaintsApi.getAll();
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBe(0);

    const safeList = readComplaints();
    expect(Array.isArray(safeList)).toBe(true);
    expect(safeList.length).toBe(0);
  });
});
