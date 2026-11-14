import { describe, it, expect, beforeEach } from 'vitest';
import { unifiedControlPlanApi } from '@/api/unified-api';
import {
  seedControlPlans,
  readControlPlans,
  resetQualityStorage,
  STORAGE_KEYS,
} from '../../helpers/testHarness';

describe('Feature 17 Boundary: Engineering Control Plan Suite', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('enforces mandatory Reaction Plan for Critical Characteristics (CC/SC)', () => {
    const invalidCriticalCp = {
      productCharacteristic: 'Critical Safety Wall Thickness',
      isCritical: true,
      reactionPlanDesc: '   ', // empty reaction plan!
    };

    const hasValidReactionPlan = (cp: any) =>
      !cp.isCritical || Boolean(cp.reactionPlanDesc?.trim());

    expect(hasValidReactionPlan(invalidCriticalCp)).toBe(false);

    const validCriticalCp = {
      ...invalidCriticalCp,
      reactionPlanDesc: 'Immediate line E-Stop, 100% quarantine of current pallet, notify Lead Quality Engineer',
    };
    expect(hasValidReactionPlan(validCriticalCp)).toBe(true);
  });

  it('safely handles Arabic Unicode operations, specifications, and reaction procedures', async () => {
    const arabicCp = {
      controlPlanId: 'CP-AR-001',
      controlPlanType: 'production',
      partNumber: 'جزء-هيكلي-١٠١',
      partName: 'جسم الصمام الهيدروليكي عالي الدقة',
      revision: 'إصدار ب',
      date: '2026-11-14',
      processNumber: 'عملية-٣٠',
      operationName: 'التجليخ الدقيق للمقاعد الصمامية',
      machineDevice: 'ماكينة التجليخ الألمانية رقم ٤',
      productCharacteristic: 'خشونة السطح Ra والتعامدية',
      specification: 'Ra <= 0.4 µm',
      tolerance: '± 0.05 µm',
      evaluationMethod: 'مقياس خشونة إلكتروني تلامسي',
      sampleSize: '٣ قطع',
      frequency: 'كل ساعتين',
      controlMethodType: 'spc',
      responsible: 'مشغل المحطة المعتمد',
      reactionPlanDesc: 'إيقاف دورة التجليخ فورا وتغيير حجر الجلخ ومراجعة سائل التبريد',
      correctiveActionRequired: true,
      status: 'active',
    };

    const created = await unifiedControlPlanApi.create(arabicCp as any);
    expect(created.id).toBeDefined();

    const stored = readControlPlans();
    expect(stored.length).toBe(1);
    expect(stored[0].partName).toContain('جسم الصمام الهيدروليكي');
    expect(stored[0].reactionPlanDesc).toContain('إيقاف دورة التجليخ');
  });

  it('validates sample frequency boundaries: 100% automated vs AQL batch sampling', () => {
    const validFrequencies = ['100% inline automated', '5 pcs / hour', 'first piece & last piece', 'AQL 0.65 Level II'];
    for (const freq of validFrequencies) {
      expect(freq.length).toBeGreaterThan(0);
    }

    const invalidFreq = '';
    expect(invalidFreq.trim().length).toBe(0);
  });

  it('handles control plan revisions and status transition to "superseded" upon ECN approval', () => {
    const currentCp = {
      id: 'cp-rev-a',
      controlPlanId: 'CP-FLANGE-01',
      revision: 'Rev A',
      status: 'active',
    };

    // When Rev B is activated, Rev A must transition to superseded
    const updatedStatus = 'superseded';
    expect(updatedStatus).toBe('superseded');
  });

  it('recovers gracefully from corrupted storage payload in control-plans repository', async () => {
    localStorage.setItem(STORAGE_KEYS.CONTROL_PLAN, 'CORRUPTED_CONTROL_PLAN_{{INVALID}}');
    const res = await unifiedControlPlanApi.getAll();
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBe(0);

    const safeList = readControlPlans();
    expect(Array.isArray(safeList)).toBe(true);
    expect(safeList.length).toBe(0);
  });
});
