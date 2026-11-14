/**
 * QualityOps 4.0 Test Harness
 * Storage resets, mock seeding, and client environment control.
 */

export const STORAGE_KEYS = {
  NCR: 'qms_local_ncr',
  CAPA: 'qms_local_capa',
  EIGHT_D: 'qms_local_eight-d',
  FMEA: 'qms_local_fmea',
  CONTROL_PLAN: 'qms_local_control-plans',
  SUPPLIER: 'qms_local_suppliers',
  CALIBRATION: 'qms_local_calibrations',
  INSPECTION: 'qms_local_inspections',
  COMPLAINT: 'qms_local_complaints',
  DEFECT_LOG: 'qms_safe_local_defects_v1',
  SYNC_QUEUE: 'qms_sync_queue_v1',
  AUDIT_PLANS: 'qms_quality_audit_plans_v1',
  AUDIT_RUNS: 'qms_quality_audit_runs_v1',
} as const;

export function resetQualityStorage(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear();
  }
}

export function writeStoredItems<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

export function readStoredItems<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function seedNcrRecords<T = any>(records: T[]): void {
  writeStoredItems(STORAGE_KEYS.NCR, records);
}

export function readNcrRecords<T = any>(): T[] {
  return readStoredItems<T>(STORAGE_KEYS.NCR);
}

export function seedCapaRecords<T = any>(records: T[]): void {
  writeStoredItems(STORAGE_KEYS.CAPA, records);
}

export function readCapaRecords<T = any>(): T[] {
  return readStoredItems<T>(STORAGE_KEYS.CAPA);
}

export function seed8dRecords<T = any>(records: T[]): void {
  writeStoredItems(STORAGE_KEYS.EIGHT_D, records);
}

export function read8dRecords<T = any>(): T[] {
  return readStoredItems<T>(STORAGE_KEYS.EIGHT_D);
}

export function seedFmeaRecords<T = any>(records: T[]): void {
  writeStoredItems(STORAGE_KEYS.FMEA, records);
}

export function readFmeaRecords<T = any>(): T[] {
  return readStoredItems<T>(STORAGE_KEYS.FMEA);
}

export function seedControlPlans<T = any>(records: T[]): void {
  writeStoredItems(STORAGE_KEYS.CONTROL_PLAN, records);
}

export function readControlPlans<T = any>(): T[] {
  return readStoredItems<T>(STORAGE_KEYS.CONTROL_PLAN);
}

export function seedSuppliers<T = any>(records: T[]): void {
  writeStoredItems(STORAGE_KEYS.SUPPLIER, records);
}

export function readSuppliers<T = any>(): T[] {
  return readStoredItems<T>(STORAGE_KEYS.SUPPLIER);
}

export function seedCalibrations<T = any>(records: T[]): void {
  writeStoredItems(STORAGE_KEYS.CALIBRATION, records);
}

export function readCalibrations<T = any>(): T[] {
  return readStoredItems<T>(STORAGE_KEYS.CALIBRATION);
}

export function seedInspections<T = any>(records: T[]): void {
  writeStoredItems(STORAGE_KEYS.INSPECTION, records);
}

export function readInspections<T = any>(): T[] {
  return readStoredItems<T>(STORAGE_KEYS.INSPECTION);
}

export function seedComplaints<T = any>(records: T[]): void {
  writeStoredItems(STORAGE_KEYS.COMPLAINT, records);
}

export function readComplaints<T = any>(): T[] {
  return readStoredItems<T>(STORAGE_KEYS.COMPLAINT);
}

export function seedDefectLogs<T = any>(records: T[]): void {
  writeStoredItems(STORAGE_KEYS.DEFECT_LOG, records);
}

export function readDefectLogs<T = any>(): T[] {
  return readStoredItems<T>(STORAGE_KEYS.DEFECT_LOG);
}

export function setWindowLocation(urlString: string): void {
  try {
    const url = new URL(urlString, 'http://localhost:3000');
    (window as any).location = {
      href: url.href,
      protocol: url.protocol,
      host: url.host,
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      assign: (target: string) => setWindowLocation(target),
      replace: (target: string) => setWindowLocation(target),
      reload: () => {},
    };
  } catch {
    // fallback if URL fails
  }
}

export function createIsoDateOffset(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}
