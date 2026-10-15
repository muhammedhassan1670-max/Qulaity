/**
 * QMS Enterprise 4.0 - Clean Demo / Mock Data Utility
 * Safely purges only explicitly flagged simulation test records.
 * NEVER deletes or alters genuine user-recorded reports.
 */

function isDemoRecord(item: any): boolean {
  if (!item || typeof item !== 'object') return false;
  // ONLY match records explicitly marked as simulated/mock seed test data.
  // Never match on product codes, lot numbers, or standard user data fields.
  if (
    item._isDemo === true ||
    item._isSimulation === true ||
    item.isSimulationRecord === true ||
    item._demoSeed === true
  ) {
    return true;
  }
  if (
    typeof item.id === 'string' &&
    (item.id.startsWith('mock-seed-') || item.id.startsWith('demo-simulation-'))
  ) {
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
    'qms_local_8ds',
    'qms_local_eight_d',
    'qms_local_complaints',
    'qms_local_inspections',
    'qms_local_control-plans',
    'qms_quality_relationships_v1',
    'qms_suppliers_list',
    'qms_spc_charts_v2'
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
