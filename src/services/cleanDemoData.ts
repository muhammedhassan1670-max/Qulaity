/**
 * QMS Enterprise 4.0 - Clean Demo / Mock Data Utility
 * Safely purges only fake/demo/simulation seed records.
 * NEVER deletes or alters genuine user-recorded reports.
 */

export function isDemoRecord(item: any): boolean {
  if (!item || typeof item !== 'object') return false;

  // 1. Explicit mock flags
  if (
    item._isDemo === true ||
    item._isSimulation === true ||
    item.isSimulationRecord === true ||
    item._demoSeed === true
  ) {
    return true;
  }

  const id = String(item.id || '');
  const num = String(item.inspectionNumber || item.ncrNumber || item.capaNumber || item.auditNumber || item.controlPlanNumber || item.complaintNumber || item.supplierCode || item.code || '');
  const lot = String(item.batchNumber || item.batch || item.lotNumber || item.lot || '');
  const prod = String(item.productName || item.product || item.title || item.name || item.materialNameAr || item.materialNameEn || '');
  const supplier = String(item.supplierName || item.supplier || item.supplierId || item.vendor || '');
  const inspector = String(item.inspectedBy || item.auditor || item.createdByUser || '');

  // 2. Mock ID patterns
  if (
    id.startsWith('mock-seed-') ||
    id.startsWith('demo-simulation-') ||
    id.startsWith('INS-2026-RM-') ||
    id.startsWith('INS-2026-OQC-') ||
    id.startsWith('NCR-SUP-') ||
    id.startsWith('DEF-2026-901') ||
    id === 'NCR-2026-901' ||
    id === 'CAPA-2026-901' ||
    id === 'AUD-2026-901' ||
    id === 'CP-PUMP-01' ||
    id === 'CMP-2026-101' ||
    id === 'SUP-001' || id === 'SUP-002' || id === 'SUP-003' || id === 'SUP-004' || id === 'SUP-005'
  ) {
    return true;
  }

  // 3. Mock numbers
  if (
    num.startsWith('INS-2026-RM-') ||
    num.startsWith('INS-2026-OQC-') ||
    num.startsWith('NCR-SUP-') ||
    num.startsWith('DEF-2026-901') ||
    num === 'NCR-2026-901' ||
    num === 'CAPA-2026-901' ||
    num === 'AUD-2026-901' ||
    num === 'CP-PUMP-01' ||
    num === 'CMP-2026-101' ||
    num === 'SUP-001' || num === 'SUP-002' || num === 'SUP-003' || num === 'SUP-004' || num === 'SUP-005'
  ) {
    return true;
  }

  // 4. Mock lot numbers
  if (
    lot === 'LOT-2026-AL-01' ||
    lot === 'LOT-2026-OR-02' ||
    lot === 'LOT-2026-VL-03' ||
    lot === 'LOT-2026-OL-05' ||
    lot === 'BATCH-2026-901'
  ) {
    return true;
  }

  // 5. Mock product names
  if (
    prod.includes('سبائك ألمونيوم') ||
    prod.includes('حلقات إحكام مطاطية') ||
    prod.includes('صمامات بلانجر') ||
    prod.includes('مضخات هيدروليكية') ||
    prod.includes('مجموعات تروس صناعية')
  ) {
    return true;
  }

  // 6. Mock supplier names
  if (
    supplier.includes('Precision Metals') ||
    supplier.includes('Apex Polymer') ||
    supplier.includes('Delta Precision') ||
    supplier.includes('Titan Fasteners') ||
    supplier.includes('Precision Castings') ||
    supplier.includes('Global Fasteners') ||
    supplier.includes('Apex Electronics') ||
    supplier.includes('بريسيجن ميتالز') ||
    supplier.includes('إيلاستومر تكنولوجيز')
  ) {
    return true;
  }

  // 7. Mock inspector
  if (inspector === 'م. مصطفى رفعت') {
    return true;
  }

  return false;
}

function cleanStorageKey(key: string): number {
  if (typeof localStorage === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return 0;

    const filtered = data.filter((item) => !isDemoRecord(item));
    const removedCount = data.length - filtered.length;
    if (removedCount > 0) {
      localStorage.setItem(key, JSON.stringify(filtered));
    }
    return removedCount;
  } catch {
    return 0;
  }
}

export function purgeAllDemoSimulationData(): { totalRemoved: number; details: Record<string, number> } {
  if (typeof localStorage === 'undefined') return { totalRemoved: 0, details: {} };

  const keys = [
    'qms_local_defect-logs',
    'qms_local_ncr',
    'qms_local_ncrs',
    'qms_local_capa',
    'qms_local_capas',
    'qms_local_eight-d',
    'qms_local_8d',
    'qms_local_8ds',
    'qms_local_eight_d',
    'qms_local_complaints',
    'qms_local_inspections',
    'qms_local_control-plans',
    'qms_local_audits',
    'qms_local_calibrations',
    'qms_local_deviations',
    'qms_local_change-control',
    'qms_local_suppliers',
    'qms_suppliers_list',
    'qms_quality_relationships_v1',
    'qms_spc_charts_v2',
    'qms_defect_record_audit_trail_v1',
  ];

  const details: Record<string, number> = {};
  let totalRemoved = 0;

  for (const key of keys) {
    const count = cleanStorageKey(key);
    details[key] = count;
    totalRemoved += count;
  }

  // Clear legacy mock seed flags
  localStorage.removeItem('qms_local_seeded');
  localStorage.removeItem('qms_comprehensive_seeded_v1');

  return { totalRemoved, details };
}
