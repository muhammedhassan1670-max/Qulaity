import { describe, it, expect, beforeEach } from 'vitest';
import { unifiedNcrApi } from '@/api/unified-api';
import {
  resetQualityStorage,
  seedNcrRecords,
  readNcrRecords,
  STORAGE_KEYS,
} from '../../helpers/testHarness';
import { INDUSTRIAL_PARTS } from '../../helpers/industrialFixtures';
import type { NCRItem } from '@/pages/quality/NCR';

describe('Feature 01 Boundary: Create New NCR Wizard', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('handles extremely large technical descriptions (>4000 chars) without truncation or storage failure', async () => {
    const longDescription = 'DEFECT-TRACE-START: ' + 'A'.repeat(4500) + ' :DEFECT-TRACE-END';
    const longContainment = 'CONTAINMENT: ' + 'X'.repeat(4200);

    const payload: Omit<NCRItem, 'id'> = {
      ncrNumber: 'NCR-BOUND-001',
      title: 'Massive Radiographic Scan Data Log',
      description: longDescription,
      defectType: 'Metallurgical Defect',
      severity: 'critical',
      status: 'open',
      priority: 'critical',
      department: 'Foundry & Heat Treatment',
      productionLine: 'Line 01 - High Vacuum Casting',
      affectedQuantity: 10,
      lotNumber: 'LOT-OVERFLOW-01',
      containmentAction: longContainment,
      disposition: 'scrap',
      assignedTo: 'Lead Metallurgist Sarah Chen',
      dueDate: '2026-12-01',
      source: 'X-Ray CT Inspection',
    };

    const created = await unifiedNcrApi.create(payload as any);
    expect(created.id).toBeDefined();

    const stored = readNcrRecords<NCRItem>();
    expect(stored.length).toBe(1);
    expect(stored[0].description.length).toBeGreaterThan(4500);
    expect(stored[0].description).toBe(longDescription);
    expect(stored[0].containmentAction).toBe(longContainment);
  });

  it('safely handles Arabic Unicode strings across all textual metadata fields', async () => {
    const arabicPayload: Omit<NCRItem, 'id'> = {
      ncrNumber: 'NCR-AR-002',
      title: 'تقرير عيب عدم مطابقة هيكلي في جسم التوربين',
      description: 'تم رصد مسامية وشروخ ميكروسكوبية أثناء الفحص غير الإتلافي بالموجات فوق الصوتية',
      defectType: 'عيب سباكة ومعادن',
      severity: 'critical',
      status: 'under-review',
      priority: 'critical',
      department: 'قسم المعالجة الحرارية والتشغيل الدقيق',
      productionLine: 'خط الإنتاج رقم ٤ - خلايا التحكم الرقمي',
      affectedQuantity: 15,
      lotNumber: 'تشغيلة-٢٠٢٦-أ-٩٩',
      containmentAction: 'عزل فوري لجميع القطع ووضع بطاقة حمراء مع قفل بالرمز الرقمي',
      disposition: 'pending',
      dispositionNotes: 'بانتظار موافقة مهندس الجودة المعتمد ومراجعة مجلس المواد',
      rootCauseNotes: 'تذبذب في ضغط حقن الصهارة وارتفاع درجة الحرارة اللحظية',
      assignedTo: 'دكتور مهندس أحمد محمود - مدير ضمان الجودة',
      dueDate: '2026-11-30',
      source: 'فحص الجودة الواردة',
    };

    const created = await unifiedNcrApi.create(arabicPayload as any);
    expect(created.id).toBeDefined();

    const stored = readNcrRecords<NCRItem>();
    expect(stored.length).toBe(1);
    expect(stored[0].title).toBe(arabicPayload.title);
    expect(stored[0].lotNumber).toBe('تشغيلة-٢٠٢٦-أ-٩٩');
    expect(stored[0].containmentAction).toContain('عزل فوري');
  });

  it('validates numerical edge values: zero quantity, negative quantities, and large batches', async () => {
    // Zero quantity
    const zeroQuantityPayload: Omit<NCRItem, 'id'> = {
      ncrNumber: 'NCR-QTY-ZERO',
      title: 'Procedure Violation without physical parts rejected',
      description: 'Audit finding: Calibration tag missing on machine 04',
      defectType: 'Documentation',
      severity: 'minor',
      status: 'open',
      priority: 'low',
      affectedQuantity: 0,
      department: 'Quality Assurance',
      disposition: 'use-as-is',
    };

    const zeroCreated = await unifiedNcrApi.create(zeroQuantityPayload as any);
    expect(zeroCreated.affectedQuantity).toBe(0);

    // Negative quantity boundary: should either clamp to 0 or record sanitized magnitude
    const negativeQtyPayload: Omit<NCRItem, 'id'> = {
      ncrNumber: 'NCR-QTY-NEG',
      title: 'Negative quantity test',
      description: 'Edge case negative count',
      defectType: 'Dimensional',
      severity: 'minor',
      status: 'open',
      priority: 'low',
      affectedQuantity: -12,
      department: 'Assembly',
      disposition: 'pending',
    };

    const negCreated = await unifiedNcrApi.create(negativeQtyPayload as any);
    expect(negCreated.affectedQuantity).toBeDefined();

    // Astronomical quantity boundary
    const massiveBatchPayload: Omit<NCRItem, 'id'> = {
      ncrNumber: 'NCR-QTY-MAX',
      title: 'Bulk Fastener Surface Defect',
      description: 'Coating peeling across entire bulk fastener production batch',
      defectType: 'Surface Defect',
      severity: 'major',
      status: 'open',
      priority: 'high',
      affectedQuantity: 10000000,
      department: 'Plating',
      disposition: 'return-to-vendor',
    };

    const massiveCreated = await unifiedNcrApi.create(massiveBatchPayload as any);
    expect(massiveCreated.affectedQuantity).toBe(10000000);
  });

  it('recovers gracefully when localStorage contains corrupted JSON payload', async () => {
    // Seed corrupted JSON directly into localStorage
    localStorage.setItem(STORAGE_KEYS.NCR, '{"corrupted_payload: [unclosed_string... %%%}');

    // Read or GetAll should not crash with uncaught SyntaxError
    const res = await unifiedNcrApi.getAll();
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBe(0);

    // Also verify readNcrRecords() helper handles corruption safely
    const raw = readNcrRecords<NCRItem>();
    expect(Array.isArray(raw)).toBe(true);
    expect(raw.length).toBe(0);

    // Should still allow creating a fresh record after corruption
    const newRecord: Omit<NCRItem, 'id'> = {
      ncrNumber: 'NCR-RECOVER-01',
      title: 'Post Corruption Record',
      description: 'System safely self-healed after storage corruption',
      defectType: 'System Recovery',
      severity: 'minor',
      status: 'open',
      priority: 'low',
      affectedQuantity: 1,
      department: 'QA',
      disposition: 'use-as-is',
    };

    const created = await unifiedNcrApi.create(newRecord as any);
    expect(created.id).toBeDefined();
    const stored = readNcrRecords<NCRItem>();
    expect(stored.length).toBe(1);
    expect(stored[0].ncrNumber).toBe('NCR-RECOVER-01');
  });

  it('handles calendar edge dates: leap day, end-of-month, retroactive dates', async () => {
    // Leap day date
    const leapDayPayload: Omit<NCRItem, 'id'> = {
      ncrNumber: 'NCR-DATE-LEAP',
      title: 'Leap Year Audit Finding',
      description: 'Scheduled re-test date falls on February 29th',
      defectType: 'Calibration',
      severity: 'minor',
      status: 'open',
      priority: 'medium',
      affectedQuantity: 5,
      department: 'Metrology',
      createdDate: '2024-02-29',
      dueDate: '2028-02-29',
      disposition: 'pending',
    };

    const leapCreated = await unifiedNcrApi.create(leapDayPayload as any);
    expect(leapCreated.createdDate).toBe('2024-02-29');
    expect(leapCreated.dueDate).toBe('2028-02-29');

    // Retroactive past date
    const retroactivePayload: Omit<NCRItem, 'id'> = {
      ncrNumber: 'NCR-DATE-RETRO',
      title: 'Retroactive Defect Entry from Historical Log',
      description: 'Historical non-conformance imported for statistical baseline',
      defectType: 'Machining',
      severity: 'minor',
      status: 'closed',
      priority: 'low',
      affectedQuantity: 2,
      department: 'Machining',
      createdDate: '2019-12-31',
      dueDate: '2020-01-15',
      disposition: 'rework',
    };

    const retroCreated = await unifiedNcrApi.create(retroactivePayload as any);
    expect(retroCreated.createdDate).toBe('2019-12-31');
    expect(retroCreated.status).toBe('closed');
  });
});
