import type { DefectLogData } from '@/api/unified-api';
import { evaluateAdvancedDefectRules } from '@/services/qualityRulesEngine';
import type { ExtendedDefectLog } from '@/services/defectAnalytics';

export type DefectLifecycleStatus =
  | 'draft'
  | 'logged'
  | 'reviewed'
  | 'approved'
  | 'rejected'
  | 'investigating'
  | 'escalated'
  | 'closed'
  | 'reopened';

export type DefectWorkflowActionId =
  | 'submit-review'
  | 'review'
  | 'approve'
  | 'reject'
  | 'start-investigation'
  | 'elevate-ncr'
  | 'create-capa'
  | 'escalate-8d'
  | 'verify-action'
  | 'close'
  | 'reopen';

export type DefectActivityType = 'comment' | 'system' | 'review' | 'rejection' | 'verification' | 'escalation';

export interface DefectLifecycleComment {
  id: string;
  text: string;
  createdAt: string;
  createdBy?: string;
  type: DefectActivityType;
}

export interface DefectActionTracking {
  containmentAction?: string;
  correction?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  responsiblePerson?: string;
  dueDate?: string;
  actionStatus?: 'not-started' | 'in-progress' | 'completed' | 'verified';
  verificationResult?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface DefectWorkflowAction {
  id: DefectWorkflowActionId;
  label: string;
  nextStatus?: DefectLifecycleStatus;
  requiresComment?: boolean;
  commentType?: DefectActivityType;
  description: string;
}

export interface DefectSlaMetrics {
  loggedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
  investigationStartedAt?: string;
  escalatedAt?: string;
  containedAt?: string;
  closedAt?: string;
  reopenedAt?: string;
  timeToReviewHrs: number | null;
  timeToContainmentHrs: number | null;
  timeToEscalationHrs: number | null;
  timeToCloseHrs: number | null;
  overdueStatus: string;
}

export interface SmartEscalationMatrix {
  level: 'no-escalation' | 'supervisor-review' | 'ncr-required' | 'capa-suggested' | 'eight-d-suggested' | 'management-attention';
  label: string;
  reasons: string[];
}

export interface DefectWorkflowMetrics {
  totalOpen: number;
  pendingReview: number;
  pendingApproval: number;
  investigating: number;
  escalated: number;
  overdueActions: number;
  highSeverityOpen: number;
  repeatedDefects: number;
  averageTimeToReviewHrs: number | null;
  averageTimeToCloseHrs: number | null;
  closureRate: number;
  ncrEscalationCount: number;
}

const allowedTransitions: Record<DefectLifecycleStatus, DefectLifecycleStatus[]> = {
  draft: ['logged'],
  logged: ['reviewed', 'rejected'],
  reviewed: ['approved', 'investigating', 'escalated'],
  approved: ['investigating', 'closed'],
  rejected: ['draft', 'reopened'],
  investigating: ['escalated', 'closed'],
  escalated: ['closed'],
  closed: ['reopened'],
  reopened: ['investigating'],
};

const workflowActions: DefectWorkflowAction[] = [
  { id: 'submit-review', label: 'Submit for Review', nextStatus: 'logged', requiresComment: false, commentType: 'system', description: 'Move a draft record into logged status for review.' },
  { id: 'review', label: 'Review', nextStatus: 'reviewed', requiresComment: true, commentType: 'review', description: 'Mark the record as reviewed after initial quality check.' },
  { id: 'approve', label: 'Approve', nextStatus: 'approved', requiresComment: true, commentType: 'review', description: 'Approve the reviewed record for investigation or closure.' },
  { id: 'reject', label: 'Reject', nextStatus: 'rejected', requiresComment: true, commentType: 'rejection', description: 'Reject the record and return it for correction.' },
  { id: 'start-investigation', label: 'Start Investigation', nextStatus: 'investigating', requiresComment: false, commentType: 'system', description: 'Start investigation and action tracking.' },
  { id: 'elevate-ncr', label: 'Elevate to NCR', nextStatus: 'escalated', requiresComment: true, commentType: 'escalation', description: 'Create/link an NCR and mark the defect as escalated.' },
  { id: 'create-capa', label: 'Create CAPA', requiresComment: true, commentType: 'escalation', description: 'Create/link a CAPA when corrective action needs formal tracking.' },
  { id: 'escalate-8d', label: 'Escalate to 8D', requiresComment: true, commentType: 'escalation', description: 'Create/link an 8D investigation for severe or repeated issues.' },
  { id: 'verify-action', label: 'Verify Action', requiresComment: true, commentType: 'verification', description: 'Record verification result for containment/corrective actions.' },
  { id: 'close', label: 'Close', nextStatus: 'closed', requiresComment: true, commentType: 'verification', description: 'Close after verification and required checks.' },
  { id: 'reopen', label: 'Reopen', nextStatus: 'reopened', requiresComment: true, commentType: 'system', description: 'Reopen a closed record for renewed investigation.' },
];

function normalizeStatus(status?: string): DefectLifecycleStatus {
  const value = String(status || 'logged').toLowerCase();
  if (value === 'open') return 'logged';
  if (value === 'in-progress') return 'investigating';
  if (value === 'completed') return 'closed';
  if (value === 'cancelled') return 'rejected';
  if (value in allowedTransitions) return value as DefectLifecycleStatus;
  return 'logged';
}

function hoursBetween(start?: string, end?: string): number | null {
  if (!start || !end) return null;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (Number.isNaN(s) || Number.isNaN(e)) return null;
  return Math.max(0, Math.round(((e - s) / 3_600_000) * 10) / 10);
}

function nowIso(): string {
  return new Date().toISOString();
}

function toNumber(value: unknown): number {
  const parsed = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getAllowedTransitions(status?: string): DefectLifecycleStatus[] {
  return allowedTransitions[normalizeStatus(status)] || [];
}

export function canTransitionDefect(status: string | undefined, nextStatus: DefectLifecycleStatus): boolean {
  return getAllowedTransitions(status).includes(nextStatus);
}

export function getAvailableWorkflowActions(record: DefectLogData): DefectWorkflowAction[] {
  const status = normalizeStatus(record.status);
  return workflowActions.filter((action) => {
    if (action.id === 'submit-review') return status === 'draft';
    if (action.id === 'review') return status === 'logged';
    if (action.id === 'reject') return status === 'logged';
    if (action.id === 'approve') return status === 'reviewed';
    if (action.id === 'start-investigation') return status === 'reviewed' || status === 'approved' || status === 'reopened';
    if (action.id === 'elevate-ncr') return status === 'reviewed' || status === 'investigating';
    if (action.id === 'create-capa') return status === 'investigating' || status === 'escalated' || status === 'approved';
    if (action.id === 'escalate-8d') return status === 'investigating' || status === 'escalated';
    if (action.id === 'verify-action') return status === 'investigating' || status === 'escalated';
    if (action.id === 'close') return status === 'investigating' || status === 'escalated' || status === 'approved';
    if (action.id === 'reopen') return status === 'closed';
    return false;
  });
}

export function buildLifecycleComment(text: string, type: DefectActivityType = 'comment', user = 'local-user'): DefectLifecycleComment {
  return {
    id: `comment-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text,
    createdAt: nowIso(),
    createdBy: user,
    type,
  };
}

export function buildSystemComment(action: DefectWorkflowAction, nextStatus?: string, user = 'local-user', extraText?: string): DefectLifecycleComment {
  return buildLifecycleComment(
    extraText || `${action.label}${nextStatus ? ` -> ${nextStatus}` : ''}`,
    action.commentType || 'system',
    user,
  );
}

export function applyStatusTimestamp(record: Record<string, unknown>, nextStatus: DefectLifecycleStatus): Record<string, unknown> {
  const timestamp = nowIso();
  const patch: Record<string, unknown> = {};
  if (!record.loggedAt && nextStatus === 'logged') patch.loggedAt = timestamp;
  if (nextStatus === 'reviewed') patch.reviewedAt = timestamp;
  if (nextStatus === 'approved') patch.approvedAt = timestamp;
  if (nextStatus === 'investigating') patch.investigationStartedAt = timestamp;
  if (nextStatus === 'escalated') patch.escalatedAt = timestamp;
  if (nextStatus === 'closed') patch.closedAt = timestamp;
  if (nextStatus === 'reopened') patch.reopenedAt = timestamp;
  return patch;
}

export function buildSlaMetrics(record: DefectLogData): DefectSlaMetrics {
  const data = record as unknown as Record<string, unknown>;
  const loggedAt = String(data.loggedAt || record.createdAt || record.date || '');
  const reviewedAt = String(data.reviewedAt || '');
  const approvedAt = String(data.approvedAt || '');
  const investigationStartedAt = String(data.investigationStartedAt || '');
  const escalatedAt = String(data.escalatedAt || '');
  const containedAt = String(data.containedAt || '');
  const closedAt = String(data.closedAt || '');
  const reopenedAt = String(data.reopenedAt || '');
  const now = nowIso();

  const timeToReviewHrs = hoursBetween(loggedAt, reviewedAt);
  const timeToContainmentHrs = hoursBetween(loggedAt, containedAt);
  const timeToEscalationHrs = hoursBetween(loggedAt, escalatedAt);
  const timeToCloseHrs = hoursBetween(loggedAt, closedAt);
  const openAge = normalizeStatus(record.status) === 'closed' ? 0 : hoursBetween(loggedAt, now) || 0;
  const actionDueDate = String(data.dueDate || '');
  const dueTime = actionDueDate ? new Date(actionDueDate).getTime() : 0;
  const overdueAction = dueTime > 0 && dueTime < Date.now() && normalizeStatus(record.status) !== 'closed';

  const overdueStatus = overdueAction
    ? 'Action overdue'
    : openAge > 72
      ? 'Workflow review overdue'
      : 'Within practical SLA';

  return {
    loggedAt,
    reviewedAt,
    approvedAt,
    investigationStartedAt,
    escalatedAt,
    containedAt,
    closedAt,
    reopenedAt,
    timeToReviewHrs,
    timeToContainmentHrs,
    timeToEscalationHrs,
    timeToCloseHrs,
    overdueStatus,
  };
}

export function buildSmartEscalationMatrix(record: DefectLogData, records: ExtendedDefectLog[] = []): SmartEscalationMatrix {
  const rules = evaluateAdvancedDefectRules(record as unknown as Record<string, unknown>, records);
  const reasons = [...rules.warnings, ...rules.ncrReasons, ...rules.approvalReasons];
  const severity = String(record.severity || '').toLowerCase();
  const quantity = toNumber(record.quantity);
  const estimatedCost = toNumber(record.estimatedCost);
  const customerReturn = String(record.recordType || '').toLowerCase() === 'customer-return' || Boolean(record.returnReference);
  const outgoingEscape = String(record.outgoingResult || '').toLowerCase() === 'fail';
  const supplierRelated = Boolean(record.supplierName || (record as unknown as Record<string, unknown>).supplierNameAtTime);

  if (severity === 'critical' || estimatedCost >= 10_000 || customerReturn || outgoingEscape) {
    return {
      level: 'management-attention',
      label: 'Management attention suggested',
      reasons: [...new Set([...reasons, 'High impact quality signal requires verification and prioritization.'])],
    };
  }
  if (rules.repeatedDefect.repeated && quantity >= 5) {
    return {
      level: 'eight-d-suggested',
      label: '8D suggested',
      reasons: [...new Set([...reasons, 'Repeated defect pattern may need structured investigation.'])],
    };
  }
  if (rules.ncrSuggested || severity === 'major' || quantity >= 10) {
    return {
      level: 'ncr-required',
      label: 'NCR review suggested',
      reasons: [...new Set([...reasons, 'NCR escalation should be reviewed by quality.'])],
    };
  }
  if (supplierRelated || estimatedCost >= 5_000) {
    return {
      level: 'capa-suggested',
      label: 'CAPA suggested',
      reasons: [...new Set([...reasons, 'Corrective/preventive action may be useful if verified.'])],
    };
  }
  if (rules.approvalRequired) {
    return {
      level: 'supervisor-review',
      label: 'Supervisor review suggested',
      reasons: [...new Set(reasons)],
    };
  }
  return {
    level: 'no-escalation',
    label: 'No escalation suggested yet',
    reasons: ['Continue standard quality verification and close only after evidence is sufficient.'],
  };
}

export function buildWorkflowMetrics(records: DefectLogData[]): DefectWorkflowMetrics {
  const openStatuses = new Set(['draft', 'logged', 'reviewed', 'approved', 'investigating', 'escalated', 'reopened']);
  const statusCounts = records.reduce((acc, record) => {
    const status = normalizeStatus(record.status);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const reviewTimes = records.map(buildSlaMetrics).map((sla) => sla.timeToReviewHrs).filter((value): value is number => value !== null);
  const closeTimes = records.map(buildSlaMetrics).map((sla) => sla.timeToCloseHrs).filter((value): value is number => value !== null);
  const closed = statusCounts.closed || 0;

  return {
    totalOpen: records.filter((record) => openStatuses.has(normalizeStatus(record.status))).length,
    pendingReview: statusCounts.logged || 0,
    pendingApproval: statusCounts.reviewed || 0,
    investigating: statusCounts.investigating || 0,
    escalated: statusCounts.escalated || 0,
    overdueActions: records.filter((record) => buildSlaMetrics(record).overdueStatus !== 'Within practical SLA').length,
    highSeverityOpen: records.filter((record) => openStatuses.has(normalizeStatus(record.status)) && ['critical', 'high'].includes(String(record.severity || '').toLowerCase())).length,
    repeatedDefects: records.filter((record) => evaluateAdvancedDefectRules(record as unknown as Record<string, unknown>, records as ExtendedDefectLog[]).repeatedDefect.repeated).length,
    averageTimeToReviewHrs: reviewTimes.length ? Math.round((reviewTimes.reduce((sum, value) => sum + value, 0) / reviewTimes.length) * 10) / 10 : null,
    averageTimeToCloseHrs: closeTimes.length ? Math.round((closeTimes.reduce((sum, value) => sum + value, 0) / closeTimes.length) * 10) / 10 : null,
    closureRate: records.length ? Math.round((closed / records.length) * 100) : 0,
    ncrEscalationCount: records.filter((record) => Boolean(record.relatedNcrId)).length,
  };
}

export function buildActivityTimeline(record: DefectLogData, globalAudit: unknown[] = []): Array<{
  id: string;
  type: string;
  text: string;
  timestamp: string;
  by?: string;
}> {
  const recordData = record as unknown as Record<string, unknown>;
  const comments = Array.isArray(recordData.comments)
    ? (record as unknown as { comments: DefectLifecycleComment[] }).comments
    : [];
  const audit = [
    ...(Array.isArray(record.auditTrail) ? record.auditTrail : []),
    ...globalAudit,
  ].map((entry) => entry as Record<string, unknown>);

  return [
    ...comments.map((comment) => ({
      id: comment.id,
      type: comment.type,
      text: comment.text,
      timestamp: comment.createdAt,
      by: comment.createdBy,
    })),
    ...audit.map((entry, index) => ({
      id: String(entry.id || `audit-${index}`),
      type: String(entry.action || 'system'),
      text: `${entry.action || 'system'}: ${Array.isArray(entry.changedFields) ? entry.changedFields.join(', ') : 'record updated'}`,
      timestamp: String(entry.timestamp || record.updatedAt || record.createdAt || ''),
      by: String(entry.changedBy || ''),
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export { normalizeStatus as normalizeDefectLifecycleStatus };
