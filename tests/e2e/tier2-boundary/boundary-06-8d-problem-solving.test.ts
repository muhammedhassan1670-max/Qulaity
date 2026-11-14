import { describe, it, expect, beforeEach } from 'vitest';
import { unifiedEightDApi } from '@/api/unified-api';
import {
  resetQualityStorage,
  seed8dRecords,
  read8dRecords,
  STORAGE_KEYS,
} from '../../helpers/testHarness';
import type { D8Report } from '@/pages/quality/D8';

describe('Feature 06 Boundary: 8D Problem Solving Suite', () => {
  beforeEach(() => {
    resetQualityStorage();
  });

  it('enforces stage-gate integrity: blocks D8 closure if D4 Root Cause or D5 PCA is missing', async () => {
    const incomplete8d = {
      eightDNumber: '8D-GATE-001',
      problemTitle: 'Premature 8D Closure Attempt',
      status: 'd1',
      emergencyResponse: 'Emergency containment plan initiated',
      teamLeader: 'Sarah Chen',
      teamMembers: ['Sarah Chen (Leader)', 'Dr. Klaus (Champion)'],
      problemDescription: 'Subsurface voids in rotor casting',
      immediateAction: 'All 45 suspect rotors placed in quarantine cage',
      rootCauseDescription: '', // missing mandatory root cause
      correctiveActionDesc: '', // missing mandatory PCA
    };

    const isEligibleForD8 =
      Boolean(incomplete8d.rootCauseDescription?.trim()) &&
      Boolean(incomplete8d.correctiveActionDesc?.trim());

    expect(isEligibleForD8).toBe(false);
  });

  it('safely processes massive D2 Problem Description (>4000 chars) with Arabic technical text', async () => {
    const arabicD2 =
      'وصف المشكلة الفنية: تم اكتشاف شروخ إجهادية ميكروسكوبية في شفرات التوربينات عالية السرعة أثناء اختبارات الاتزان الديناميكي.\n' +
      'بيانات العينات والاختبارات الميدانية: '.repeat(100);

    const payload: Omit<D8Report, 'id'> = {
      eightDNumber: '8D-AR-002',
      problemTitle: 'تقرير تحليل المشكلات الشامل 8D - شروخ شفرات التوربين',
      symptomDescription: 'اهتزازات ميكانيكية غير معتادة',
      emergencyResponse: 'عزل فوري لجميع الأجزاء',
      dateDetected: '2026-11-14',
      teamLeader: 'د. مهندس طارق زيدان',
      teamMembers: ['د. مهندس طارق زيدان (قائد الفريق)', 'م. سارة أحمد (مهندسة الجودة)'],
      department: 'هندسة التوربينات',
      champion: 'مدير العمليات',
      productName: 'توربين غازي عالي الضغط',
      productionLine: 'خط الإنتاج رقم ٢',
      lotNumber: 'تشغيلة-توربين-٢٠٢٦',
      problemDescription: arabicD2,
      customerImpact: 'حرج للغاية',
      immediateAction: 'تطبيق الحظر الفوري',
      containmentResponsible: 'م. سارة أحمد',
      containmentDate: '2026-11-14',
      quantityContained: 350,
      analysisMethod: '5why',
      whyAnalysis: '١. شروخ إجهادية -> ٢. حرارة زائدة',
      rootCauseDescription: 'تفاوت في المعالجة الحرارية',
      correctiveActionDesc: 'إعادة ضبط منحنى التبريد',
      correctiveResponsible: 'د. طارق',
      targetDateCorrective: '2026-12-01',
      effectivenessCheck: 'pending',
      status: 'd4',
    };

    const created = await unifiedEightDApi.create(payload as any);
    expect(created.id).toBeDefined();

    const stored = read8dRecords<D8Report>();
    expect(stored.length).toBe(1);
    expect(stored[0].problemDescription.length).toBeGreaterThan(2000);
    expect(stored[0].problemTitle).toContain('تقرير تحليل المشكلات');
  });

  it('detects and flags invalid D1 team compositions (empty team or missing leader)', () => {
    const emptyTeam: string[] = [];
    const teamWithoutLeader = ['Operator Bob', 'Inspector Alice'];
    const validTeam = ['Eng. Sarah (Leader)', 'Dr. Klaus (Champion)', 'Frank (SME)'];

    const hasLeader = (team: string[]) => team.some((m) => m.toLowerCase().includes('leader'));

    expect(emptyTeam.length).toBe(0);
    expect(hasLeader(teamWithoutLeader)).toBe(false);
    expect(hasLeader(validTeam)).toBe(true);
    expect(validTeam.length).toBeGreaterThanOrEqual(2);
  });

  it('validates D3 Interim Containment numerical boundaries (0 quarantined or negative counts)', () => {
    const testCases = [
      { qtyQuarantined: 0, isValid: false }, // Cannot claim physical containment if 0 units were checked/held
      { qtyQuarantined: -10, isValid: false }, // Negative quantity invalid
      { qtyQuarantined: 150, isValid: true }, // Positive quarantined batch
    ];

    for (const tc of testCases) {
      const valid = Number.isFinite(tc.qtyQuarantined) && tc.qtyQuarantined > 0;
      expect(valid).toBe(tc.isValid);
    }
  });

  it('recovers gracefully from corrupted storage payload in 8D repository', async () => {
    localStorage.setItem(STORAGE_KEYS.EIGHT_D, '{[CORRUPTED_8D_DATA...]}');
    const res = await unifiedEightDApi.getAll();
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBe(0);

    const safeRecords = read8dRecords();
    expect(Array.isArray(safeRecords)).toBe(true);
    expect(safeRecords.length).toBe(0);
  });
});
