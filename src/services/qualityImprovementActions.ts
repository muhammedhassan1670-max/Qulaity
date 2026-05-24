import type { DefectLogData } from '@/api/unified-api';
import {
  buildLocalWorkflowUser,
  loadLocalWorkflowRole,
  type DefectWorkflowNotification,
  type DefectWorkflowTask,
  type QualityWorkflowRole,
} from '@/services/defectWorkflowGovernance';
import { enqueueQualitySyncItem } from '@/services/qualitySyncQueue';

export type ImprovementActionSourceType = 'defect' | 'ncr' | 'capa' | 'eightD' | 'audit' | 'intelligence' | 'manual';
export type ImprovementActionType =
  | 'containment'
  | 'correction'
  | 'corrective'
  | 'preventive'
  | 'verification'
  | 'audit'
  | 'training'
  | 'supplier-action'
  | 'process-control';
export type ImprovementActionStatus =
  | 'draft'
  | 'open'
  | 'in-progress'
  | 'pending-verification'
  | 'effective'
  | 'not-effective'
  | 'closed'
  | 'cancelled';
export type ImprovementEffectivenessStatus =
  | 'Effective'
  | 'Partially Effective'
  | 'Not Effective'
  | 'Insufficient Data'
  | 'Monitoring Required';
export type ImprovementConfidenceLabel = 'Strong Signal' | 'Moderate Signal' | 'Weak Signal' | 'Insufficient Data';

export interface QualityImprovementAction {
  id: string;
  title: string;
  description: string;
  sourceType: ImprovementActionSourceType;
  sourceId?: string;
  actionType: ImprovementActionType;
  owner: string;
  ownerRole: QualityWorkflowRole;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: ImprovementActionStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  verificationStartDate?: string;
  verificationEndDate?: string;
  verificationMethod?: string;
  effectivenessResult?: ImprovementEffectivenessStatus;
  effectivenessNotes?: string;
  linkedDefectType?: string;
  linkedProductionLine?: string;
  linkedModel?: string;
  linkedPartNumber?: string;
  linkedSupplier?: string;
  linkedCustomer?: string;
  linkedRecordType?: string;
  linkedSeverity?: string;
  relatedDefectId?: string;
  relatedNcrId?: string;
  relatedCapaId?: string;
  relatedEightDId?: string;
  beforeMetric?: number;
  afterMetric?: number;
  improvementPercent?: number;
  confidenceLabel?: ImprovementConfidenceLabel;
  auditTrail?: ImprovementActionAuditEntry[];
}

export interface ImprovementActionAuditEntry {
  id: string;
  action: string;
  timestamp: string;
  user: string;
  role: QualityWorkflowRole;
  previousStatus?: ImprovementActionStatus;
  newStatus?: ImprovementActionStatus;
  comment?: string;
}

export interface ImprovementMetricComparison {
  metric: 'defectQuantity' | 'ppm' | 'copq' | 'outgoingFailures' | 'customerReturns' | 'repeatedDefectCount' | 'overdueActions' | 'closureTime';
  label: string;
  before: number;
  after: number;
  improvementPercent: number | null;
  trendDirection: 'improved' | 'worsened' | 'stable' | 'no-data';
}

export interface ImprovementEffectivenessResult {
  actionId: string;
  beforeRecords: number;
  afterRecords: number;
  comparisonWindowDays: number;
  primaryMetric: ImprovementMetricComparison;
  comparisons: ImprovementMetricComparison[];
  effectivenessStatus: ImprovementEffectivenessStatus;
  confidenceLabel: ImprovementConfidenceLabel;
  interpretation: string;
  verificationRecommendation: string;
}

export interface ImprovementEffectivenessDashboard {
  totalActions: number;
  openActions: number;
  overdueActions: number;
  pendingVerification: number;
  effectiveActions: number;
  notEffectiveActions: number;
  averageTimeToCompleteDays: number;
  averageVerificationTimeDays: number;
  estimatedCopqReduction: number;
  topActionsByImprovement: Array<{ action: QualityImprovementAction; result: ImprovementEffectivenessResult }>;
  actionsBySourceType: Array<{ label: string; count: number; percentage: number }>;
  actionsByOwner: Array<{ label: string; count: number; percentage: number }>;
  actionsByStatus: Array<{ label: string; count: number; percentage: number }>;
  effectivenessDistribution: Array<{ label: ImprovementEffectivenessStatus; count: number; percentage: number }>;
  overdueActionList: QualityImprovementAction[];
}

export const QUALITY_IMPROVEMENT_ACTIONS_KEY = 'qms_quality_improvement_actions_v1';

const validTransitions: Record<ImprovementActionStatus, ImprovementActionStatus[]> = {
  draft: ['open', 'cancelled'],
  open: ['in-progress', 'cancelled'],
  'in-progress': ['pending-verification', 'cancelled'],
  'pending-verification': ['effective', 'not-effective'],
  effective: ['closed'],
  'not-effective': ['open', 'in-progress', 'cancelled'],
  closed: [],
  cancelled: [],
};

function nowIso(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return `impr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toNumber(value: unknown): number {
  const parsed = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalize(value: unknown): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysBetween(start?: string, end?: string): number {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (!startDate || !endDate) return 0;
  return Math.max(0, Math.round(((endDate.getTime() - startDate.getTime()) / 86_400_000) * 10) / 10);
}

function readActions(): QualityImprovementAction[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(QUALITY_IMPROVEMENT_ACTIONS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeActions(actions: QualityImprovementAction[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(QUALITY_IMPROVEMENT_ACTIONS_KEY, JSON.stringify(actions));
}

function actionAudit(action: string, previousStatus?: ImprovementActionStatus, newStatus?: ImprovementActionStatus, comment?: string): ImprovementActionAuditEntry {
  const user = buildLocalWorkflowUser(null, loadLocalWorkflowRole());
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    timestamp: nowIso(),
    user: user.name,
    role: user.role,
    previousStatus,
    newStatus,
    comment,
  };
}

function confidenceFor(beforeRecords: number, afterRecords: number, missingSignals: number): ImprovementConfidenceLabel {
  const total = beforeRecords + afterRecords;
  if (beforeRecords < 3 || afterRecords < 3 || total < 8) return 'Insufficient Data';
  if (total < 20 || missingSignals >= 4) return 'Weak Signal';
  if (total >= 60 && missingSignals <= 1) return 'Strong Signal';
  return 'Moderate Signal';
}

function distribution<T extends string>(values: T[]): Array<{ label: T; count: number; percentage: number }> {
  const counts = new Map<T, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count, percentage: values.length ? Math.round((count / values.length) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);
}

function recordDate(record: DefectLogData): Date | null {
  return parseDate(record.date || record.createdAt || record.updatedAt);
}

function matchesActionScope(action: QualityImprovementAction, record: DefectLogData): boolean {
  const checks: Array<[string | undefined, unknown]> = [
    [action.linkedDefectType, record.defectType],
    [action.linkedProductionLine, record.productionLine],
    [action.linkedModel, record.model],
    [action.linkedPartNumber, record.partNumber || record.partId],
    [action.linkedSupplier, record.supplierNameAtTime || record.supplierName],
    [action.linkedCustomer, record.customerName],
    [action.linkedRecordType, record.recordType],
    [action.linkedSeverity, record.severity],
  ];
  const activeChecks = checks.filter(([expected]) => normalize(expected));
  if (activeChecks.length === 0 && action.relatedDefectId) return record.id === action.relatedDefectId;
  if (activeChecks.length === 0) return false;
  return activeChecks.every(([expected, actual]) => normalize(expected) === normalize(actual));
}

function scopedRecordsByWindow(action: QualityImprovementAction, records: DefectLogData[]): { before: DefectLogData[]; after: DefectLogData[]; windowDays: number } {
  const anchor = parseDate(action.verificationStartDate || action.completedAt || action.updatedAt || action.createdAt) || new Date();
  const windowDays = Math.max(14, Math.min(90, Math.round(daysBetween(action.createdAt, action.dueDate) || 30)));
  const beforeStart = new Date(anchor.getTime() - windowDays * 86_400_000);
  const afterEnd = parseDate(action.verificationEndDate) || new Date(anchor.getTime() + windowDays * 86_400_000);

  const scoped = records.filter((record) => matchesActionScope(action, record));
  return {
    before: scoped.filter((record) => {
      const date = recordDate(record);
      return Boolean(date && date >= beforeStart && date < anchor);
    }),
    after: scoped.filter((record) => {
      const date = recordDate(record);
      return Boolean(date && date >= anchor && date <= afterEnd);
    }),
    windowDays,
  };
}

function metricValue(records: DefectLogData[], metric: ImprovementMetricComparison['metric']): number {
  const defectQty = records.reduce((sum, record) => sum + Math.max(1, toNumber(record.quantity) || 1), 0);
  const inspected = records.reduce((sum, record) => sum + toNumber(record.inspectedQuantity || record.productionQuantity), 0);
  if (metric === 'defectQuantity') return defectQty;
  if (metric === 'ppm') return inspected > 0 ? Math.round((defectQty / inspected) * 1_000_000) : 0;
  if (metric === 'copq') return Math.round(records.reduce((sum, record) => sum + toNumber(record.estimatedCost), 0));
  if (metric === 'outgoingFailures') return records.filter((record) => String(record.outgoingResult || '').toLowerCase() === 'fail' || String(record.recordType || '').toLowerCase() === 'outgoing-quality').length;
  if (metric === 'customerReturns') return records.filter((record) => String(record.recordType || '').toLowerCase() === 'customer-return' || Boolean(record.returnReference)).length;
  if (metric === 'repeatedDefectCount') return records.length;
  if (metric === 'overdueActions') return records.filter((record) => {
    const due = parseDate(record.dueDate);
    return Boolean(due && due.getTime() < Date.now() && String(record.status || '').toLowerCase() !== 'closed');
  }).length;
  if (metric === 'closureTime') {
    const closed = records.map((record) => daysBetween(record.createdAt || record.loggedAt || record.date, record.closedAt || record.updatedAt)).filter((days) => days > 0);
    return closed.length ? Math.round(closed.reduce((sum, days) => sum + days, 0) / closed.length) : 0;
  }
  return 0;
}

function compareMetric(before: DefectLogData[], after: DefectLogData[], metric: ImprovementMetricComparison['metric'], label: string): ImprovementMetricComparison {
  const beforeValue = metricValue(before, metric);
  const afterValue = metricValue(after, metric);
  const improvementPercent = beforeValue > 0 ? Math.round(((beforeValue - afterValue) / beforeValue) * 100) : null;
  const trendDirection = improvementPercent === null
    ? 'no-data'
    : improvementPercent > 5
      ? 'improved'
      : improvementPercent < -5
        ? 'worsened'
        : 'stable';
  return { metric, label, before: beforeValue, after: afterValue, improvementPercent, trendDirection };
}

export function loadImprovementActions(): QualityImprovementAction[] {
  return readActions().sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
}

export function saveImprovementActions(actions: QualityImprovementAction[]): void {
  writeActions(actions);
}

export function createImprovementAction(input: Partial<QualityImprovementAction>): QualityImprovementAction {
  const user = buildLocalWorkflowUser(null, loadLocalWorkflowRole());
  const timestamp = nowIso();
  const action: QualityImprovementAction = {
    id: generateId(),
    title: input.title || 'Improvement action',
    description: input.description || '',
    sourceType: input.sourceType || 'manual',
    sourceId: input.sourceId,
    actionType: input.actionType || 'corrective',
    owner: input.owner || user.name,
    ownerRole: input.ownerRole || user.role,
    priority: input.priority || 'medium',
    status: input.status || 'draft',
    dueDate: input.dueDate,
    createdAt: timestamp,
    updatedAt: timestamp,
    verificationStartDate: input.verificationStartDate,
    verificationEndDate: input.verificationEndDate,
    verificationMethod: input.verificationMethod,
    linkedDefectType: input.linkedDefectType,
    linkedProductionLine: input.linkedProductionLine,
    linkedModel: input.linkedModel,
    linkedPartNumber: input.linkedPartNumber,
    linkedSupplier: input.linkedSupplier,
    linkedCustomer: input.linkedCustomer,
    linkedRecordType: input.linkedRecordType,
    linkedSeverity: input.linkedSeverity,
    relatedDefectId: input.relatedDefectId,
    relatedNcrId: input.relatedNcrId,
    relatedCapaId: input.relatedCapaId,
    relatedEightDId: input.relatedEightDId,
    auditTrail: [actionAudit('created', undefined, input.status || 'draft', 'Action created with user confirmation.')],
  };
  writeActions([action, ...readActions()]);
  enqueueQualitySyncItem({
    entityType: 'improvement-actions',
    entityId: action.id,
    operation: 'create',
    payloadSummary: `${action.title} | ${action.actionType} | ${action.sourceType}`,
  });
  return action;
}

export function updateImprovementAction(id: string, patch: Partial<QualityImprovementAction>, comment?: string): QualityImprovementAction | null {
  let updated: QualityImprovementAction | null = null;
  const next = readActions().map((action) => {
    if (action.id !== id) return action;
    updated = {
      ...action,
      ...patch,
      id: action.id,
      updatedAt: nowIso(),
      auditTrail: [...(action.auditTrail || []), actionAudit('updated', action.status, patch.status || action.status, comment)],
    };
    return updated;
  });
  writeActions(next);
  const updatedAction = updated as QualityImprovementAction | null;
  if (updatedAction) {
    enqueueQualitySyncItem({
      entityType: 'improvement-actions',
      entityId: id,
      operation: 'update',
      payloadSummary: `${updatedAction.title} updated locally`,
    });
  }
  return updatedAction;
}

export function transitionImprovementAction(id: string, nextStatus: ImprovementActionStatus, comment?: string): { action?: QualityImprovementAction; error?: string } {
  const action = readActions().find((item) => item.id === id);
  if (!action) return { error: 'Improvement action was not found.' };
  if (!validTransitions[action.status]?.includes(nextStatus)) {
    return { error: `Transition ${action.status} -> ${nextStatus} is not available for this action.` };
  }
  const patch: Partial<QualityImprovementAction> = { status: nextStatus };
  if (nextStatus === 'pending-verification') {
    patch.completedAt = nowIso();
    patch.verificationStartDate = action.verificationStartDate || nowIso();
  }
  if (nextStatus === 'effective' || nextStatus === 'not-effective' || nextStatus === 'closed' || nextStatus === 'cancelled') {
    patch.completedAt = action.completedAt || nowIso();
  }
  const updated = updateImprovementAction(id, patch, comment || `Status moved to ${nextStatus}.`);
  if (updated) {
    enqueueQualitySyncItem({
      entityType: 'improvement-actions',
      entityId: id,
      operation: 'workflow-transition',
      payloadSummary: `${action.status} -> ${nextStatus}`,
    });
  }
  return { action: updated || undefined };
}

export function prefillActionFromDefect(record: DefectLogData): Partial<QualityImprovementAction> {
  return {
    title: `Reduce recurrence of ${record.defectType || 'quality issue'}`,
    description: 'Suggested improvement action created from a real defect record. Review scope and ownership before saving.',
    sourceType: 'defect',
    sourceId: record.id,
    actionType: String(record.recordType || '').toLowerCase() === 'customer-return' ? 'corrective' : 'process-control',
    priority: ['critical', 'high'].includes(String(record.severity || '').toLowerCase()) ? 'high' : 'medium',
    relatedDefectId: record.id,
    relatedNcrId: record.relatedNcrId,
    relatedCapaId: record.relatedCapaId,
    relatedEightDId: record.relatedEightDId,
    linkedDefectType: record.defectType,
    linkedProductionLine: record.productionLine,
    linkedModel: record.model,
    linkedPartNumber: record.partNumber || record.partId,
    linkedSupplier: record.supplierNameAtTime || record.supplierName,
    linkedCustomer: record.customerName,
    linkedRecordType: record.recordType,
    linkedSeverity: record.severity,
  };
}

export function calculateActionEffectiveness(action: QualityImprovementAction, records: DefectLogData[]): ImprovementEffectivenessResult {
  const { before, after, windowDays } = scopedRecordsByWindow(action, records);
  const comparisons = [
    compareMetric(before, after, 'defectQuantity', 'Defect quantity'),
    compareMetric(before, after, 'ppm', 'PPM'),
    compareMetric(before, after, 'copq', 'COPQ'),
    compareMetric(before, after, 'outgoingFailures', 'Outgoing failures / holds'),
    compareMetric(before, after, 'customerReturns', 'Customer returns'),
    compareMetric(before, after, 'repeatedDefectCount', 'Repeated defect count'),
    compareMetric(before, after, 'overdueActions', 'Overdue actions'),
    compareMetric(before, after, 'closureTime', 'Closure time'),
  ];
  const preferredMetric = action.linkedRecordType === 'defect-cost'
    ? 'copq'
    : action.linkedRecordType === 'outgoing-quality'
      ? 'outgoingFailures'
      : action.linkedRecordType === 'customer-return'
        ? 'customerReturns'
        : 'defectQuantity';
  const primaryMetric = comparisons.find((item) => item.metric === preferredMetric) || comparisons[0];
  const missingSignals = [
    !action.linkedDefectType,
    !action.linkedProductionLine,
    !action.linkedPartNumber,
    !action.linkedModel,
    !action.verificationStartDate && !action.completedAt,
  ].filter(Boolean).length;
  const confidenceLabel = confidenceFor(before.length, after.length, missingSignals);
  const effectivenessStatus: ImprovementEffectivenessStatus = confidenceLabel === 'Insufficient Data'
    ? 'Insufficient Data'
    : primaryMetric.trendDirection === 'improved' && (primaryMetric.improvementPercent || 0) >= 30
      ? 'Effective'
      : primaryMetric.trendDirection === 'improved'
        ? 'Partially Effective'
        : primaryMetric.trendDirection === 'worsened'
          ? 'Not Effective'
          : 'Monitoring Required';
  const interpretation = effectivenessStatus === 'Effective'
    ? `${primaryMetric.label} indicates improvement after the action, based on matching real records.`
    : effectivenessStatus === 'Partially Effective'
      ? `${primaryMetric.label} suggests reduction, but continued monitoring is required.`
      : effectivenessStatus === 'Not Effective'
        ? `${primaryMetric.label} did not improve in the after window and requires follow-up.`
        : effectivenessStatus === 'Monitoring Required'
          ? `${primaryMetric.label} is stable or unclear. Keep monitoring before closure.`
          : 'There is not enough matching before/after data to judge action effectiveness.';

  return {
    actionId: action.id,
    beforeRecords: before.length,
    afterRecords: after.length,
    comparisonWindowDays: windowDays,
    primaryMetric,
    comparisons,
    effectivenessStatus,
    confidenceLabel,
    interpretation,
    verificationRecommendation: 'Use this as decision-support. Confirm evidence, containment, recurrence trend, and engineering verification before closure.',
  };
}

export function refreshActionEffectiveness(actionId: string, records: DefectLogData[]): QualityImprovementAction | null {
  const action = readActions().find((item) => item.id === actionId);
  if (!action) return null;
  const result = calculateActionEffectiveness(action, records);
  return updateImprovementAction(actionId, {
    beforeMetric: result.primaryMetric.before,
    afterMetric: result.primaryMetric.after,
    improvementPercent: result.primaryMetric.improvementPercent ?? undefined,
    effectivenessResult: result.effectivenessStatus,
    confidenceLabel: result.confidenceLabel,
  }, 'Effectiveness refreshed from real defect records.');
}

export function buildImprovementEffectivenessDashboard(actions: QualityImprovementAction[], records: DefectLogData[]): ImprovementEffectivenessDashboard {
  const results = actions.map((action) => ({ action, result: calculateActionEffectiveness(action, records) }));
  const openStatuses: ImprovementActionStatus[] = ['draft', 'open', 'in-progress', 'pending-verification', 'not-effective'];
  const overdueActionList = actions.filter((action) => {
    const due = parseDate(action.dueDate);
    return Boolean(due && due.getTime() < Date.now() && openStatuses.includes(action.status));
  });
  const completed = actions.filter((action) => action.completedAt);
  const verificationDurations = actions
    .map((action) => daysBetween(action.verificationStartDate, action.verificationEndDate || action.completedAt))
    .filter((days) => days > 0);
  const copqReductions = results
    .map(({ result }) => result.comparisons.find((item) => item.metric === 'copq'))
    .filter((item): item is ImprovementMetricComparison => Boolean(item))
    .reduce((sum, item) => sum + Math.max(0, item.before - item.after), 0);
  return {
    totalActions: actions.length,
    openActions: actions.filter((action) => openStatuses.includes(action.status)).length,
    overdueActions: overdueActionList.length,
    pendingVerification: actions.filter((action) => action.status === 'pending-verification').length,
    effectiveActions: actions.filter((action) => action.status === 'effective' || action.status === 'closed' || action.effectivenessResult === 'Effective').length,
    notEffectiveActions: actions.filter((action) => action.status === 'not-effective' || action.effectivenessResult === 'Not Effective').length,
    averageTimeToCompleteDays: completed.length ? Math.round(completed.reduce((sum, action) => sum + daysBetween(action.createdAt, action.completedAt), 0) / completed.length) : 0,
    averageVerificationTimeDays: verificationDurations.length ? Math.round(verificationDurations.reduce((sum, days) => sum + days, 0) / verificationDurations.length) : 0,
    estimatedCopqReduction: Math.round(copqReductions),
    topActionsByImprovement: results
      .filter(({ result }) => result.primaryMetric.improvementPercent !== null)
      .sort((a, b) => (b.result.primaryMetric.improvementPercent || 0) - (a.result.primaryMetric.improvementPercent || 0))
      .slice(0, 8),
    actionsBySourceType: distribution(actions.map((action) => action.sourceType)),
    actionsByOwner: distribution(actions.map((action) => action.owner || 'Unassigned')),
    actionsByStatus: distribution(actions.map((action) => action.status)),
    effectivenessDistribution: distribution(results.map(({ result }) => result.effectivenessStatus)),
    overdueActionList,
  };
}

export function buildImprovementActionNotifications(actions: QualityImprovementAction[], readIds: string[] = []): DefectWorkflowNotification[] {
  const today = Date.now();
  return actions.flatMap((action) => {
    const notifications: DefectWorkflowNotification[] = [];
    const due = parseDate(action.dueDate);
    const open = !['closed', 'cancelled', 'effective'].includes(action.status);
    if (due && open) {
      const daysToDue = Math.ceil((due.getTime() - today) / 86_400_000);
      if (daysToDue < 0) {
        const id = `improvement-overdue-${action.id}`;
        notifications.push({
          id,
          type: 'action-overdue',
          title: 'Improvement action overdue',
          message: `${action.title} is overdue and should be prioritized for review.`,
          severity: 'critical',
          relatedDefectId: action.relatedDefectId || action.sourceId || action.id,
          createdAt: action.updatedAt,
          read: readIds.includes(id),
          suggestedAction: 'Review owner, containment status, and next verification step.',
        });
      } else if (daysToDue <= 3) {
        const id = `improvement-due-${action.id}`;
        notifications.push({
          id,
          type: 'action-due-soon',
          title: 'Improvement action due soon',
          message: `${action.title} is due within ${daysToDue} day(s).`,
          severity: 'warning',
          relatedDefectId: action.relatedDefectId || action.sourceId || action.id,
          createdAt: action.updatedAt,
          read: readIds.includes(id),
          suggestedAction: 'Confirm progress and prepare effectiveness evidence.',
        });
      }
    }
    if (action.status === 'pending-verification') {
      const id = `improvement-verification-${action.id}`;
      notifications.push({
        id,
        type: 'action-due-soon',
        title: 'Effectiveness check ready',
        message: `${action.title} is pending verification using matching defect records.`,
        severity: 'info',
        relatedDefectId: action.relatedDefectId || action.sourceId || action.id,
        createdAt: action.updatedAt,
        read: readIds.includes(id),
        suggestedAction: 'Run an effectiveness refresh and verify engineering evidence.',
      });
    }
    if (action.status === 'not-effective') {
      const id = `improvement-not-effective-${action.id}`;
      notifications.push({
        id,
        type: 'capa-suggested',
        title: 'Improvement action not effective',
        message: `${action.title} needs follow-up because the result is not effective.`,
        severity: 'critical',
        relatedDefectId: action.relatedDefectId || action.sourceId || action.id,
        createdAt: action.updatedAt,
        read: readIds.includes(id),
        suggestedAction: 'Review scope, containment, CAPA/8D linkage, and recurrence signals.',
      });
    }
    return notifications;
  });
}

export function buildImprovementActionTasks(actions: QualityImprovementAction[]): DefectWorkflowTask[] {
  return actions
    .filter((action) => !['closed', 'cancelled'].includes(action.status))
    .map((action) => ({
      id: `task-improvement-${action.id}`,
      title: action.status === 'pending-verification' ? `Verify ${action.title}` : action.title,
      category: action.status === 'pending-verification' ? 'verification' : 'action',
      relatedDefectId: action.relatedDefectId || action.sourceId || action.id,
      status: action.status,
      dueDate: action.dueDate,
      overdue: Boolean(action.dueDate && new Date(action.dueDate).getTime() < Date.now()),
      message: action.status === 'pending-verification'
        ? 'Effectiveness verification is required before closure.'
        : 'Improvement action is assigned and should be progressed.',
    }));
}
