import type { DefectLogData } from '@/api/unified-api';

export const DEFECT_LOG_STORAGE_KEY = 'qms_local_defect-logs';
export const DEFECT_LOG_BACKUP_LATEST_KEY = 'qms_local_defect-logs_backup_latest';
export const DEFECT_LOG_BACKUP_PREFIX = 'qms_local_defect-logs_backup_';
export const DEFECT_LOG_DIAGNOSTICS_KEY = 'qms_local_defect-logs_persistence_diagnostics_v1';

export type DefectStorageHealth = 'OK' | 'Warning' | 'Error';

export interface DefectPersistenceDiagnostics {
  storageKey: string;
  recordCount: number;
  lastSavedAt?: string;
  lastBackupAt?: string;
  latestBackupExists: boolean;
  latestBackupCount: number;
  lastMigrationStatus: string;
  storageHealth: DefectStorageHealth;
  warnings: string[];
}

export interface SafeDefectWriteOptions {
  reason?: string;
  allowEmptyOverwrite?: boolean;
  createBackup?: boolean;
}

export interface SafeDefectWriteResult {
  ok: boolean;
  blocked: boolean;
  reason: string;
  count: number;
  backupKey?: string;
}

export interface DefectPersistenceSafetyCheck {
  localCount: number;
  analyticsSourceCount: number;
  analyticsFilteredCount: number;
  latestBackupExists: boolean;
  backupCount: number;
  consistent: boolean;
  checkedAt: string;
  warnings: string[];
}

interface BackupPayload {
  backupType: 'defect-records-local-backup';
  version: 1;
  createdAt: string;
  reason: string;
  storageKey: string;
  count: number;
  records: DefectLogData[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function timestampKey(date = new Date()): string {
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0'),
  ].join('');
  return `${DEFECT_LOG_BACKUP_PREFIX}${stamp}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeText(value: unknown): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function toNumberOrUndefined(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toNumberOrDefault(value: unknown, fallback = 0): number {
  return toNumberOrUndefined(value) ?? fallback;
}

function normalizeStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (value === null || value === undefined || value === '') return undefined;
  return [String(value)];
}

function readJson(key: string): unknown {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

function updateDiagnostics(patch: Partial<DefectPersistenceDiagnostics>): void {
  if (typeof localStorage === 'undefined') return;
  const current = getDefectPersistenceDiagnostics();
  const next: DefectPersistenceDiagnostics = {
    ...current,
    ...patch,
    warnings: patch.warnings ?? current.warnings,
  };
  writeJson(DEFECT_LOG_DIAGNOSTICS_KEY, next);
}

export function normalizeDefectRecord(input: unknown, index = 0): DefectLogData {
  const source = isRecord(input) ? input : {};
  const existingId = normalizeText(source.id);
  const id = existingId || `local-migrated-${Date.now()}-${index}`;
  const next = {
    ...source,
    id,
    date: normalizeText(source.date),
    shift: normalizeText(source.shift),
    productionLine: normalizeText(source.productionLine),
    partId: normalizeText(source.partId),
    partNumber: normalizeText(source.partNumber),
    recordType: normalizeText(source.recordType) || 'process-ppm',
    defectType: normalizeText(source.defectType),
    quantity: toNumberOrDefault(source.quantity, 0),
    severity: normalizeText(source.severity),
    description: normalizeText(source.description),
    operatorName: normalizeText(source.operatorName),
    actionTaken: normalizeText(source.actionTaken),
    status: normalizeText(source.status) || 'logged',
  } as DefectLogData;

  const optionalNumberFields: Array<keyof DefectLogData> = [
    'inspectedQuantity',
    'productionQuantity',
    'estimatedCost',
    'releaseTimeHrs',
    'unitCost',
    'capacity',
    'unitCostAtTime',
    'slaTargetHours',
    'formTemplateVersion',
    'relatedInspectionPlanVersion',
  ];

  optionalNumberFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      const parsed = toNumberOrUndefined(source[field as string]);
      if (parsed === undefined) {
        delete (next as unknown as Record<string, unknown>)[field];
      } else {
        (next as unknown as Record<string, unknown>)[field] = parsed;
      }
    }
  });

  ([
    'relatedActionIds',
    'relatedDefectIds',
    'relatedNcrIds',
    'relatedCapaIds',
    'relatedEightDIds',
  ] as Array<keyof DefectLogData>).forEach((field) => {
    const normalized = normalizeStringArray(source[field as string]);
    if (normalized) (next as unknown as Record<string, unknown>)[field] = normalized;
  });

  if (isRecord(source.customFields)) next.customFields = source.customFields as Record<string, unknown>;
  if (Array.isArray(source.evidence)) next.evidence = source.evidence as Array<Record<string, unknown>>;
  if (Array.isArray(source.auditTrail)) next.auditTrail = source.auditTrail as Array<Record<string, unknown>>;
  if (Array.isArray(source.comments)) next.comments = source.comments as Array<Record<string, unknown>>;

  return next;
}

export function normalizeDefectRecords(rows: unknown): DefectLogData[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row, index) => normalizeDefectRecord(row, index));
}

export function loadSafeLocalDefectRecords(): DefectLogData[] {
  const parsed = readJson(DEFECT_LOG_STORAGE_KEY);
  if (!Array.isArray(parsed)) {
    if (parsed !== null) {
      updateDiagnostics({
        lastMigrationStatus: 'Invalid defect storage payload was ignored.',
        storageHealth: 'Error',
        warnings: ['Defect local storage payload is not an array.'],
      });
    }
    return [];
  }

  const normalized = normalizeDefectRecords(parsed);
  const migrationNeeded = JSON.stringify(parsed) !== JSON.stringify(normalized);
  updateDiagnostics({
    recordCount: normalized.length,
    lastMigrationStatus: migrationNeeded
      ? `Normalized ${normalized.length} defect record(s) during read.`
      : 'No migration needed.',
    storageHealth: 'OK',
  });
  return normalized;
}

export function createDefectRecordsBackup(reason = 'safe-write', records = loadSafeLocalDefectRecords()): BackupPayload | null {
  if (typeof localStorage === 'undefined') return null;
  const createdAt = nowIso();
  const normalized = normalizeDefectRecords(records);
  const payload: BackupPayload = {
    backupType: 'defect-records-local-backup',
    version: 1,
    createdAt,
    reason,
    storageKey: DEFECT_LOG_STORAGE_KEY,
    count: normalized.length,
    records: normalized,
  };
  const key = timestampKey(new Date(createdAt));
  writeJson(DEFECT_LOG_BACKUP_LATEST_KEY, payload);
  writeJson(key, payload);
  updateDiagnostics({
    lastBackupAt: createdAt,
    latestBackupExists: true,
    latestBackupCount: normalized.length,
  });
  return payload;
}

export function safeWriteLocalDefectRecords(rows: unknown, options: SafeDefectWriteOptions = {}): SafeDefectWriteResult {
  const reason = options.reason || 'safe-write';
  if (!Array.isArray(rows)) {
    const message = 'Blocked defect storage write because payload is not an array.';
    console.warn(message, { reason });
    updateDiagnostics({ storageHealth: 'Error', warnings: [message] });
    return { ok: false, blocked: true, reason: message, count: 0 };
  }

  const existing = loadSafeLocalDefectRecords();
  const normalized = normalizeDefectRecords(rows);
  if (existing.length > 0 && normalized.length === 0 && !options.allowEmptyOverwrite) {
    const message = 'Blocked destructive defect storage overwrite: non-empty records would be replaced with an empty array.';
    console.warn(message, { reason, existingCount: existing.length });
    updateDiagnostics({
      storageHealth: 'Warning',
      warnings: [message],
      recordCount: existing.length,
    });
    return { ok: false, blocked: true, reason: message, count: existing.length };
  }

  let backup: BackupPayload | null = null;
  if (options.createBackup !== false) {
    backup = createDefectRecordsBackup(reason, existing);
  }

  writeJson(DEFECT_LOG_STORAGE_KEY, normalized);
  updateDiagnostics({
    recordCount: normalized.length,
    lastSavedAt: nowIso(),
    lastMigrationStatus: `Wrote ${normalized.length} normalized defect record(s).`,
    storageHealth: 'OK',
    warnings: [],
  });

  return {
    ok: true,
    blocked: false,
    reason,
    count: normalized.length,
    backupKey: backup ? DEFECT_LOG_BACKUP_LATEST_KEY : undefined,
  };
}

export function mergeDefectRecordSets(primary: unknown, secondary: unknown): DefectLogData[] {
  const map = new Map<string, DefectLogData>();
  normalizeDefectRecords(secondary).forEach((record) => map.set(record.id, record));
  normalizeDefectRecords(primary).forEach((record) => map.set(record.id, record));
  return [...map.values()];
}

export function restoreSafeLocalDefectRecords(rows: unknown, mode: 'merge' | 'replace' = 'merge'): SafeDefectWriteResult {
  const incoming = normalizeDefectRecords(rows);
  const existing = loadSafeLocalDefectRecords();
  createDefectRecordsBackup('pre-restore-backup', existing);
  const nextRows = mode === 'replace' ? incoming : mergeDefectRecordSets(incoming, existing);
  return safeWriteLocalDefectRecords(nextRows, {
    reason: `restore-${mode}`,
    allowEmptyOverwrite: mode === 'replace',
  });
}

export function getDefectPersistenceDiagnostics(): DefectPersistenceDiagnostics {
  const stored = readJson(DEFECT_LOG_DIAGNOSTICS_KEY);
  const latestBackup = readJson(DEFECT_LOG_BACKUP_LATEST_KEY) as Partial<BackupPayload> | null;
  const rawRecords = readJson(DEFECT_LOG_STORAGE_KEY);
  const recordCount = Array.isArray(rawRecords) ? rawRecords.length : 0;
  const fromStored = isRecord(stored) ? stored as Partial<DefectPersistenceDiagnostics> : {};
  return {
    storageKey: DEFECT_LOG_STORAGE_KEY,
    recordCount,
    lastSavedAt: fromStored.lastSavedAt,
    lastBackupAt: fromStored.lastBackupAt || latestBackup?.createdAt,
    latestBackupExists: Boolean(latestBackup && latestBackup.backupType === 'defect-records-local-backup'),
    latestBackupCount: Number(latestBackup?.count || 0),
    lastMigrationStatus: fromStored.lastMigrationStatus || 'No migration has run yet.',
    storageHealth: fromStored.storageHealth || (Array.isArray(rawRecords) || rawRecords === null ? 'OK' : 'Error'),
    warnings: Array.isArray(fromStored.warnings) ? fromStored.warnings : [],
  };
}

export async function runDefectPersistenceSafetyCheck(): Promise<DefectPersistenceSafetyCheck> {
  const localRecords = loadSafeLocalDefectRecords();
  const diagnostics = getDefectPersistenceDiagnostics();
  const warnings: string[] = [...diagnostics.warnings];
  let analyticsSourceCount = 0;
  let analyticsFilteredCount = 0;

  try {
    const { loadQualityAnalyticsSnapshot } = await import('@/services/qualityAnalyticsHub');
    const snapshot = await loadQualityAnalyticsSnapshot();
    analyticsSourceCount = snapshot.sourceCounts.defectRecords;
    analyticsFilteredCount = snapshot.filteredDefectRecords.length;
    if (analyticsSourceCount !== localRecords.length) {
      warnings.push('Analytics hub source count differs from local defect storage count.');
    }
  } catch (error) {
    warnings.push(`Analytics hub check could not run: ${error instanceof Error ? error.message : 'unknown error'}.`);
  }

  return {
    localCount: localRecords.length,
    analyticsSourceCount,
    analyticsFilteredCount,
    latestBackupExists: diagnostics.latestBackupExists,
    backupCount: diagnostics.latestBackupCount,
    consistent: localRecords.length === analyticsSourceCount && diagnostics.latestBackupExists,
    checkedAt: nowIso(),
    warnings,
  };
}
