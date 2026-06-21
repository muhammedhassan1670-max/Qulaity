import {
  buildLocalWorkflowUser,
  loadLocalWorkflowRole,
  type QualityWorkflowRole,
} from '@/services/defectWorkflowGovernance';
import { enqueueQualitySyncItem } from '@/services/qualitySyncQueue';
import {
  QUALITY_IMPROVEMENT_ACTIONS_KEY,
  loadImprovementActions,
  saveImprovementActions,
  type QualityImprovementAction,
} from '@/services/qualityImprovementActions';
import {
  DEFECT_LOG_STORAGE_KEY,
  loadSafeLocalDefectRecords,
  safeWriteLocalDefectRecords,
} from '@/services/safeDefectStorage';

export type QualityRelationshipEntityType =
  | 'defect'
  | 'ncr'
  | 'capa'
  | 'eightD'
  | 'improvement-action'
  | 'inspection'
  | 'supplier'
  | 'complaint'
  | 'control-plan'
  | 'change-control'
  | 'deviation'
  | 'audit'
  | 'calibration'
  | 'fmea';
export type QualityRelationshipStatus = 'active' | 'removed';

export interface QualityRelationshipRecord {
  id: string;
  sourceType: QualityRelationshipEntityType;
  sourceId: string;
  targetType: QualityRelationshipEntityType;
  targetId: string;
  relationshipType: string;
  createdAt: string;
  createdBy: string;
  createdByRole: QualityWorkflowRole;
  notes?: string;
  status: QualityRelationshipStatus;
  removedAt?: string;
  removedBy?: string;
  removedByRole?: QualityWorkflowRole;
}

export const QUALITY_RELATIONSHIPS_KEY = 'qms_quality_relationships_v1';

const localKeyByType: Partial<Record<QualityRelationshipEntityType, string>> = {
  defect: DEFECT_LOG_STORAGE_KEY,
  ncr: 'qms_local_ncr',
  capa: 'qms_local_capa',
  eightD: 'qms_local_eight-d',
  'improvement-action': QUALITY_IMPROVEMENT_ACTIONS_KEY,
  inspection: 'qms_local_inspections',
  supplier: 'qms_local_suppliers',
  complaint: 'qms_local_complaints',
  'control-plan': 'qms_local_control-plans',
  'change-control': 'qms_local_change-control',
  deviation: 'qms_local_deviations',
  audit: 'qms_local_audits',
  calibration: 'qms_local_calibrations',
  fmea: 'qms_local_fmea',
};

function nowIso(): string {
  return new Date().toISOString();
}

function readJsonArray<T>(key: string): T[] {
  if (typeof localStorage === 'undefined') return [];
  if (key === DEFECT_LOG_STORAGE_KEY) return loadSafeLocalDefectRecords() as T[];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJsonArray<T>(key: string, rows: T[]): void {
  if (typeof localStorage === 'undefined') return;
  if (key === DEFECT_LOG_STORAGE_KEY) {
    safeWriteLocalDefectRecords(rows, { reason: 'relationship-field-update' });
    return;
  }
  localStorage.setItem(key, JSON.stringify(rows));
}

function normalize(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function sameLink(a: Pick<QualityRelationshipRecord, 'sourceType' | 'sourceId' | 'targetType' | 'targetId'>, b: Pick<QualityRelationshipRecord, 'sourceType' | 'sourceId' | 'targetType' | 'targetId'>): boolean {
  const direct = a.sourceType === b.sourceType && normalize(a.sourceId) === normalize(b.sourceId) && a.targetType === b.targetType && normalize(a.targetId) === normalize(b.targetId);
  const reverse = a.sourceType === b.targetType && normalize(a.sourceId) === normalize(b.targetId) && a.targetType === b.sourceType && normalize(a.targetId) === normalize(b.sourceId);
  return direct || reverse;
}

function appendUnique(values: unknown, id: string): string[] {
  const existing = Array.isArray(values) ? values.map(String).filter(Boolean) : [];
  return Array.from(new Set([...existing, id]));
}

function removeValue(values: unknown, id: string): string[] {
  return Array.isArray(values) ? values.map(String).filter(Boolean).filter((item) => normalize(item) !== normalize(id)) : [];
}

function relationshipAuditEntry(input: {
  entityType: QualityRelationshipEntityType;
  entityId: string;
  targetType: QualityRelationshipEntityType;
  targetId: string;
  mode: 'link' | 'unlink';
}): Record<string, unknown> {
  const user = buildLocalWorkflowUser(null, loadLocalWorkflowRole());
  return {
    id: `rel-audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action: input.mode === 'link' ? 'relationship-linked' : 'relationship-unlinked',
    timestamp: nowIso(),
    changedBy: user.name,
    user: user.name,
    role: user.role,
    changedFields: [relationshipArrayField(input.targetType)],
    newValue: { [relationshipArrayField(input.targetType)]: input.targetId },
    reasonForChange: `${input.entityType}:${input.entityId} ${input.mode === 'link' ? 'linked to' : 'unlinked from'} ${input.targetType}:${input.targetId} for traceability.`,
    permissionResult: 'allowed',
  };
}

function relationshipArrayField(targetType: QualityRelationshipEntityType): string {
  if (targetType === 'defect') return 'relatedDefectIds';
  if (targetType === 'ncr') return 'relatedNcrIds';
  if (targetType === 'capa') return 'relatedCapaIds';
  if (targetType === 'eightD') return 'relatedEightDIds';
  if (targetType === 'improvement-action') return 'relatedActionIds';
  if (targetType === 'inspection') return 'relatedInspectionIds';
  if (targetType === 'supplier') return 'relatedSupplierIds';
  if (targetType === 'complaint') return 'relatedComplaintIds';
  if (targetType === 'control-plan') return 'relatedControlPlanIds';
  if (targetType === 'change-control') return 'relatedChangeControlIds';
  if (targetType === 'deviation') return 'relatedDeviationIds';
  if (targetType === 'audit') return 'relatedAuditIds';
  if (targetType === 'calibration') return 'relatedCalibrationIds';
  if (targetType === 'fmea') return 'relatedFmeaIds';
  return 'relatedOtherIds';
}

function legacySingleField(targetType: QualityRelationshipEntityType): string | null {
  if (targetType === 'ncr') return 'relatedNcrId';
  if (targetType === 'capa') return 'relatedCapaId';
  if (targetType === 'eightD') return 'relatedEightDId';
  return null;
}

function updateEntityLocalFields(entityType: QualityRelationshipEntityType, entityId: string, targetType: QualityRelationshipEntityType, targetId: string, mode: 'link' | 'unlink'): void {
  const key = localKeyByType[entityType];
  if (!key) return;
  if (entityType === 'improvement-action') {
    const actions = loadImprovementActions().map((action) => {
      if (normalize(action.id) !== normalize(entityId)) return action;
      const patch: Partial<QualityImprovementAction> = {};
      if (targetType === 'defect') patch.relatedDefectId = mode === 'link' ? targetId : action.relatedDefectId === targetId ? undefined : action.relatedDefectId;
      if (targetType === 'ncr') patch.relatedNcrId = mode === 'link' ? targetId : action.relatedNcrId === targetId ? undefined : action.relatedNcrId;
      if (targetType === 'capa') patch.relatedCapaId = mode === 'link' ? targetId : action.relatedCapaId === targetId ? undefined : action.relatedCapaId;
      if (targetType === 'eightD') patch.relatedEightDId = mode === 'link' ? targetId : action.relatedEightDId === targetId ? undefined : action.relatedEightDId;
      const audit = relationshipAuditEntry({ entityType, entityId, targetType, targetId, mode });
      return {
        ...action,
        ...patch,
        auditTrail: [...(action.auditTrail || []), {
          id: String(audit.id),
          action: String(audit.action),
          timestamp: String(audit.timestamp),
          user: String(audit.user),
          role: audit.role as QualityWorkflowRole,
          comment: String(audit.reasonForChange),
        }],
        updatedAt: nowIso(),
      };
    });
    saveImprovementActions(actions);
    return;
  }

  const rows = readJsonArray<Record<string, unknown>>(key).map((row) => {
    if (normalize(row.id) !== normalize(entityId)) return row;
    const arrayField = relationshipArrayField(targetType);
    const legacyField = legacySingleField(targetType);
    const next = {
      ...row,
      [arrayField]: mode === 'link' ? appendUnique(row[arrayField], targetId) : removeValue(row[arrayField], targetId),
      auditTrail: [
        ...(Array.isArray(row.auditTrail) ? row.auditTrail as Record<string, unknown>[] : []),
        relationshipAuditEntry({ entityType, entityId, targetType, targetId, mode }),
      ],
      updatedAt: nowIso(),
    };
    if (legacyField) {
      next[legacyField] = mode === 'link'
        ? (row[legacyField] || targetId)
        : normalize(row[legacyField]) === normalize(targetId)
          ? undefined
          : row[legacyField];
    }
    if (entityType === 'ncr' && targetType === 'defect') next.linkedDefectIds = next.relatedDefectIds;
    if (entityType === 'capa' && targetType === 'defect') next.linkedDefectIds = next.relatedDefectIds;
    if (entityType === 'eightD' && targetType === 'defect') next.linkedDefectIds = next.relatedDefectIds;
    if (entityType === 'capa' && targetType === 'ncr') next.sourceNcrId = mode === 'link' ? (row.sourceNcrId || targetId) : normalize(row.sourceNcrId) === normalize(targetId) ? undefined : row.sourceNcrId;
    if (entityType === 'eightD' && targetType === 'ncr') next.ncrReportId = mode === 'link' ? (row.ncrReportId || targetId) : normalize(row.ncrReportId) === normalize(targetId) ? undefined : row.ncrReportId;
    return next;
  });
  writeJsonArray(key, rows);
}

function syncBothSides(record: QualityRelationshipRecord, mode: 'link' | 'unlink'): void {
  updateEntityLocalFields(record.sourceType, record.sourceId, record.targetType, record.targetId, mode);
  updateEntityLocalFields(record.targetType, record.targetId, record.sourceType, record.sourceId, mode);
}

export function loadQualityRelationships(includeRemoved = false): QualityRelationshipRecord[] {
  const rows = readJsonArray<QualityRelationshipRecord>(QUALITY_RELATIONSHIPS_KEY);
  return rows
    .filter((row) => includeRemoved || row.status !== 'removed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function saveQualityRelationships(rows: QualityRelationshipRecord[]): void {
  writeJsonArray(QUALITY_RELATIONSHIPS_KEY, rows);
}

export function relationshipExists(sourceType: QualityRelationshipEntityType, sourceId: string, targetType: QualityRelationshipEntityType, targetId: string): boolean {
  return loadQualityRelationships().some((row) => sameLink(row, { sourceType, sourceId, targetType, targetId }));
}

export function createQualityRelationship(input: {
  sourceType: QualityRelationshipEntityType;
  sourceId: string;
  targetType: QualityRelationshipEntityType;
  targetId: string;
  relationshipType?: string;
  notes?: string;
}): { relationship?: QualityRelationshipRecord; duplicate?: boolean } {
  const rows = loadQualityRelationships(true);
  const existing = rows.find((row) => row.status !== 'removed' && sameLink(row, input));
  if (existing) return { relationship: existing, duplicate: true };
  const user = buildLocalWorkflowUser(null, loadLocalWorkflowRole());
  const relationship: QualityRelationshipRecord = {
    id: `rel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    targetType: input.targetType,
    targetId: input.targetId,
    relationshipType: input.relationshipType || 'traceability',
    createdAt: nowIso(),
    createdBy: user.name,
    createdByRole: user.role,
    notes: input.notes,
    status: 'active',
  };
  saveQualityRelationships([relationship, ...rows]);
  syncBothSides(relationship, 'link');
  enqueueQualitySyncItem({
    entityType: 'audit-events',
    entityId: relationship.id,
    operation: 'link-record',
    payloadSummary: `${relationship.sourceType}:${relationship.sourceId} linked to ${relationship.targetType}:${relationship.targetId}`,
  });
  return { relationship };
}

export function removeQualityRelationship(id: string): QualityRelationshipRecord | null {
  const user = buildLocalWorkflowUser(null, loadLocalWorkflowRole());
  let removed: QualityRelationshipRecord | null = null;
  const rows = loadQualityRelationships(true).map((row) => {
    if (row.id !== id) return row;
    removed = {
      ...row,
      status: 'removed',
      removedAt: nowIso(),
      removedBy: user.name,
      removedByRole: user.role,
    };
    return removed;
  });
  saveQualityRelationships(rows);
  const removedRelationship = removed as QualityRelationshipRecord | null;
  if (removedRelationship) {
    syncBothSides(removedRelationship, 'unlink');
    enqueueQualitySyncItem({
      entityType: 'audit-events',
      entityId: removedRelationship.id,
      operation: 'unlink-record',
      payloadSummary: `${removedRelationship.sourceType}:${removedRelationship.sourceId} unlinked from ${removedRelationship.targetType}:${removedRelationship.targetId}`,
    });
  }
  return removedRelationship;
}

export function updateQualityRelationshipNote(id: string, notes: string): QualityRelationshipRecord | null {
  let updated: QualityRelationshipRecord | null = null;
  const rows = loadQualityRelationships(true).map((row) => {
    if (row.id !== id) return row;
    updated = { ...row, notes };
    return updated;
  });
  saveQualityRelationships(rows);
  if (updated) {
    enqueueQualitySyncItem({
      entityType: 'audit-events',
      entityId: id,
      operation: 'update-relationship-note',
      payloadSummary: `Relationship note updated for ${id}`,
    });
  }
  return updated;
}

export function relationshipsForEntity(type: QualityRelationshipEntityType, id: string): QualityRelationshipRecord[] {
  return loadQualityRelationships().filter((row) => (
    (row.sourceType === type && normalize(row.sourceId) === normalize(id))
    || (row.targetType === type && normalize(row.targetId) === normalize(id))
  ));
}

export function relatedIdsForEntity(type: QualityRelationshipEntityType, id: string, targetType?: QualityRelationshipEntityType): string[] {
  return relationshipsForEntity(type, id)
    .flatMap((row) => {
      if (row.sourceType === type && normalize(row.sourceId) === normalize(id)) {
        return !targetType || row.targetType === targetType ? [row.targetId] : [];
      }
      return !targetType || row.sourceType === targetType ? [row.sourceId] : [];
    });
}

export function blockedRelationshipAudit(input: {
  sourceType: QualityRelationshipEntityType;
  sourceId: string;
  targetType: QualityRelationshipEntityType;
  targetId: string;
  reason: string;
}): void {
  const user = buildLocalWorkflowUser(null, loadLocalWorkflowRole());
  enqueueQualitySyncItem({
    entityType: 'audit-events',
    entityId: `blocked-${Date.now()}`,
    operation: 'link-record',
    status: 'failed',
    lastError: input.reason,
    payloadSummary: `Blocked relationship by ${user.role}: ${input.sourceType}:${input.sourceId} -> ${input.targetType}:${input.targetId}`,
  });
}
