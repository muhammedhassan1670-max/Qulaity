/**
 * QMS Enterprise 4.0 - Clean Demo / Mock Data Utility
 * Purges automatically generated simulation records to maintain data integrity.
 */

const DEMO_PATTERNS = [
  '2026-901',
  'LOT-2026-',
  'SUP-2026-',
  'INS-2026-RM',
  'INS-2026-OQC',
  'NCR-SUP-2026',
  'NCR-2026-901',
  'CAPA-2026-901',
  'EIGHTD-2026-901',
  'CMP-2026-101',
  'DEV-2026-04',
  'CP-PUMP-01',
  'AUD-2026-901',
  'ASSY-PUMP-400'
];

function isDemoRecord(item: any): boolean {
  if (!item || typeof item !== 'object') return false;
  const str = JSON.stringify(item);
  return DEMO_PATTERNS.some(pattern => str.includes(pattern));
}

function cleanStorageKey(key: string): number {
  if (typeof localStorage === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return 0;

    const filtered = data.filter(item => !isDemoRecord(item));
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
    'qms_local_ncrs',
    'qms_local_capas',
    'qms_local_eight_d',
    'qms_local_complaints',
    'qms_local_inspections',
    'qms_quality_relationships_v1',
    'qms_suppliers_list'
  ];

  const details: Record<string, number> = {};
  let totalRemoved = 0;

  for (const key of keys) {
    const count = cleanStorageKey(key);
    details[key] = count;
    totalRemoved += count;
  }

  // Remove the seeded flag permanently
  localStorage.removeItem('qms_comprehensive_seeded_v1');

  return { totalRemoved, details };
}
