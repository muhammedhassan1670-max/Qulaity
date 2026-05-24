export type QualitySyncEntityType =
  | 'defect-logs'
  | 'inspection-plans'
  | 'inspection-runs'
  | 'audit-plans'
  | 'audit-runs'
  | 'master-data'
  | 'workflow-governance-settings'
  | 'audit-events'
  | 'notifications'
  | 'tasks'
  | 'dashboard'
  | 'quality-search'
  | 'form-templates'
  | 'improvement-actions'
  | 'knowledge-base'
  | 'ncr'
  | 'capa'
  | 'eight-d';

export type QualitySyncOperation =
  | 'create'
  | 'update'
  | 'delete'
  | 'create-ncr'
  | 'update-ncr'
  | 'create-capa'
  | 'update-capa'
  | 'create-8d'
  | 'update-8d'
  | 'link-action'
  | 'link-record'
  | 'unlink-record'
  | 'update-relationship-note'
  | 'create-knowledge'
  | 'update-knowledge'
  | 'archive-knowledge'
  | 'apply-knowledge'
  | 'feedback-knowledge'
  | 'search-export'
  | 'quality-search-export'
  | 'quality-search-filter-toggle-updated'
  | 'assistant-summary-created'
  | 'apply-search-result-action'
  | 'create-form-template'
  | 'update-form-template'
  | 'publish-form-template'
  | 'archive-form-template'
  | 'import-form-template'
  | 'export-form-template'
  | 'form-lookup-tested'
  | 'form-formula-tested'
  | 'form-publish-checklist-run'
  | 'form-compact-version-created'
  | 'create-inspection-plan'
  | 'update-inspection-plan'
  | 'publish-inspection-plan'
  | 'archive-inspection-plan'
  | 'create-inspection-run'
  | 'update-inspection-run'
  | 'create-defect-from-check'
  | 'execution-board-export'
  | 'create-defect-from-execution-board'
  | 'create-action-from-failed-check'
  | 'create-audit-plan'
  | 'update-audit-plan'
  | 'publish-audit-plan'
  | 'archive-audit-plan'
  | 'create-audit-run'
  | 'complete-audit-run'
  | 'create-action-from-audit'
  | 'create-ncr-from-audit'
  | 'dashboard-filter-updated'
  | 'dashboard-export'
  | 'dashboard-snapshot-export'
  | 'dashboard-summary-copied'
  | 'management-report-export'
  | 'dashboard-drilldown-opened'
  | 'effectiveness-update'
  | 'workflow-transition'
  | 'add-comment'
  | 'add-evidence'
  | 'elevate-to-ncr'
  | 'escalate-to-8d'
  | 'update-settings';

export type QualitySyncStatus = 'pending' | 'synced' | 'failed' | 'conflict';

export interface QualitySyncItem {
  id: string;
  entityType: QualitySyncEntityType;
  entityId: string;
  operation: QualitySyncOperation;
  payloadSummary: string;
  createdAt: string;
  status: QualitySyncStatus;
  retryCount: number;
  lastError?: string;
}

const SYNC_QUEUE_KEY = 'qms_quality_sync_queue_v1';

function nowIso(): string {
  return new Date().toISOString();
}

function readQueue(): QualitySyncItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QualitySyncItem[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(items));
}

export function loadQualitySyncQueue(): QualitySyncItem[] {
  return readQueue().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function enqueueQualitySyncItem(input: Omit<QualitySyncItem, 'id' | 'createdAt' | 'status' | 'retryCount'> & Partial<Pick<QualitySyncItem, 'status' | 'retryCount' | 'lastError'>>): QualitySyncItem {
  const item: QualitySyncItem = {
    id: `sync-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    entityType: input.entityType,
    entityId: input.entityId,
    operation: input.operation,
    payloadSummary: input.payloadSummary,
    createdAt: nowIso(),
    status: input.status || 'pending',
    retryCount: input.retryCount || 0,
    lastError: input.lastError,
  };
  writeQueue([item, ...readQueue()].slice(0, 500));
  return item;
}

export function updateQualitySyncItemStatus(id: string, status: QualitySyncStatus, lastError?: string): void {
  const next = readQueue().map((item) => (
    item.id === id
      ? { ...item, status, lastError, retryCount: status === 'failed' ? item.retryCount + 1 : item.retryCount }
      : item
  ));
  writeQueue(next);
}

export function clearSyncedQualitySyncItems(): void {
  writeQueue(readQueue().filter((item) => item.status !== 'synced'));
}

export function clearQualitySyncQueue(): void {
  writeQueue([]);
}

export const QUALITY_SYNC_QUEUE_KEY = SYNC_QUEUE_KEY;
