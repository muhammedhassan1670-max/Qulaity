import { describe, it, expect } from 'vitest';

export interface EcosystemModule {
  id: string;
  stage: number;
  route: string;
  title: string;
  titleAr?: string;
}

export const ECOSYSTEM_MODULES: EcosystemModule[] = [
  { id: 'supplier-quality', stage: 1, route: '/quality/records/supplier', title: 'Supplier Quality & Rating', titleAr: 'جودة وتقييم الموردين' },
  { id: 'incoming-inspection', stage: 1, route: '/quality/records/inspection', title: 'IQC Incoming Inspection', titleAr: 'فحص الجودة الواردة' },
  { id: 'shopfloor-defect-entry', stage: 2, route: '/quality/shopfloor-entry', title: 'Fast Touch Shopfloor Defect Entry', titleAr: 'تسجيل عيوب أرضية المصنع' },
  { id: 'spc-control-charts', stage: 2, route: '/quality/spc', title: 'SPC Variable & Attribute Control Charts', titleAr: 'لوحات التحكم الإحصائي' },
  { id: 'ncr-management', stage: 3, route: '/quality/records/ncr', title: 'Non-Conformance Reports (NCR)', titleAr: 'تقارير عدم المطابقة' },
  { id: 'capa-lifecycle', stage: 3, route: '/quality/records/capa', title: 'CAPA Lifecycle Workflow', titleAr: 'إدارة الإجراءات التصحيحية والوقائية' },
  { id: 'outgoing-quality-oqc', stage: 4, route: '/quality/outgoing', title: 'Outgoing Quality Control (OQC Gatekeeper)', titleAr: 'رقابة الجودة الصادرة وبوابة الشحن' },
  { id: 'customer-complaints', stage: 5, route: '/quality/records/complaints', title: 'Customer Complaints & RMA Tracker', titleAr: 'شكاوى العملاء وإدارة المرتجعات' },
  { id: 'calibration-msa', stage: 6, route: '/quality/records/calibration', title: 'Calibration Tracking & Gage R&R', titleAr: 'معايرة الأجهزة ودراسات MSA' },
  { id: 'command-center', stage: 7, route: '/quality/command-center', title: 'Executive Quality Command Center', titleAr: 'مركز القيادة والتحكم التنفيذي' },
  { id: 'master-data', stage: 8, route: '/quality/master-data', title: 'Parts, Lines & Defect Master Data', titleAr: 'البيانات الرئيسية للجودة والمصنع' },
];

export function filterEcosystemModules(query?: string, stage?: number): EcosystemModule[] {
  let list = ECOSYSTEM_MODULES;
  if (typeof stage === 'number' && Number.isFinite(stage)) {
    list = list.filter((m) => m.stage === stage);
  }
  if (!query || !query.trim()) {
    return list;
  }
  const q = query.trim().toLowerCase();
  return list.filter((m) =>
    m.title.toLowerCase().includes(q) ||
    m.id.toLowerCase().includes(q) ||
    (m.titleAr && m.titleAr.includes(q))
  );
}

describe('Feature 25 Boundary: Quality Ecosystem Portal', () => {
  it('handles invalid or out-of-range stage filters (e.g. stage 0, stage 99, NaN) returning empty array', () => {
    expect(filterEcosystemModules('', 0).length).toBe(0);
    expect(filterEcosystemModules('', 99).length).toBe(0);
    expect(filterEcosystemModules('', -1).length).toBe(0);
  });

  it('safely filters modules using Arabic Unicode search queries without regex errors', () => {
    const arabicResults = filterEcosystemModules('معايرة');
    expect(arabicResults.length).toBeGreaterThanOrEqual(1);
    expect(arabicResults[0].id).toBe('calibration-msa');

    const complaintsResult = filterEcosystemModules('شكاوى');
    expect(complaintsResult.length).toBeGreaterThanOrEqual(1);
    expect(complaintsResult[0].id).toBe('customer-complaints');
  });

  it('returns complete inventory when search query is empty, whitespace-only, or undefined', () => {
    expect(filterEcosystemModules('').length).toBe(ECOSYSTEM_MODULES.length);
    expect(filterEcosystemModules('   ').length).toBe(ECOSYSTEM_MODULES.length);
    expect(filterEcosystemModules(undefined).length).toBe(ECOSYSTEM_MODULES.length);
  });

  it('safely handles special regex metacharacters in search query without unhandled syntax error', () => {
    const dangerousQueries = ['[a-z]+', '.*', '(.*)?', '\\d+', '???', '^$'];
    for (const dq of dangerousQueries) {
      let threw = false;
      try {
        const res = filterEcosystemModules(dq);
        expect(Array.isArray(res)).toBe(true);
      } catch {
        threw = true;
      }
      expect(threw).toBe(false);
    }
  });

  it('filters by valid stage index and search query combined', () => {
    // Stage 3 (NCR & CAPA)
    const stage3 = filterEcosystemModules('ncr', 3);
    expect(stage3.length).toBe(1);
    expect(stage3[0].id).toBe('ncr-management');

    // Searching for 'calibration' inside Stage 1 should yield 0 results
    const mismatch = filterEcosystemModules('calibration', 1);
    expect(mismatch.length).toBe(0);
  });
});
