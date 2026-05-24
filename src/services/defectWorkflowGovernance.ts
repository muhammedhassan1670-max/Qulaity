import type { DefectLogData } from '@/api/unified-api';
import {
  buildSlaMetrics,
  getAllowedTransitions,
  normalizeDefectLifecycleStatus,
  type DefectLifecycleStatus,
  type DefectWorkflowAction,
  type DefectWorkflowActionId,
} from '@/services/defectLifecycleWorkflow';
import { evaluateAdvancedDefectRules } from '@/services/qualityRulesEngine';
import type { ExtendedDefectLog } from '@/services/defectAnalytics';

export type QualityWorkflowRole =
  | 'SYSTEM'
  | 'ADMIN'
  | 'PLANT_MANAGER'
  | 'QUALITY_MANAGER'
  | 'QUALITY_SUPERVISOR'
  | 'QUALITY_ENGINEER'
  | 'PRODUCTION_ENGINEER'
  | 'INSPECTOR'
  | 'OPERATOR';

export type DefectPermission =
  | 'defect.create'
  | 'defect.edit'
  | 'defect.delete'
  | 'defect.submitReview'
  | 'defect.review'
  | 'defect.approve'
  | 'defect.reject'
  | 'defect.startInvestigation'
  | 'defect.elevateNcr'
  | 'defect.createCapa'
  | 'defect.escalate8d'
  | 'defect.close'
  | 'defect.reopen'
  | 'masterData.edit'
  | 'rules.edit'
  | 'records.export'
  | 'executiveDashboard.view';

export interface LocalWorkflowUser {
  id: string;
  name: string;
  role: QualityWorkflowRole;
  permissions: DefectPermission[];
}

export interface ApprovalMatrixSettings {
  lowSeverityRole: QualityWorkflowRole;
  highSeverityRole: QualityWorkflowRole;
  customerReturnRole: QualityWorkflowRole;
  highCostRole: QualityWorkflowRole;
  outgoingFailureRole: QualityWorkflowRole;
  managementAttentionRole: QualityWorkflowRole;
  highCostThreshold: number;
  repeatedDefectThreshold: number;
  highQuantityThreshold: number;
}

export interface DefectWorkflowTransitionSetting {
  id: string;
  fromStatus: DefectLifecycleStatus;
  toStatus: DefectLifecycleStatus;
  allowedRoles: QualityWorkflowRole[];
  requiresComment: boolean;
  requiresEvidence: boolean;
  requiresApproval: boolean;
  slaTargetHours?: number;
  warningMessage?: string;
}

export interface DefectSlaSettings {
  timeToReviewHrs: number;
  timeToContainmentHrs: number;
  timeToEscalationHrs: number;
  timeToCloseHrs: number;
  overdueWarningThresholdHrs: number;
  severityOverrides: Partial<Record<string, Partial<Record<'review' | 'containment' | 'escalation' | 'close', number>>>>;
  recordTypeOverrides: Partial<Record<string, Partial<Record<'review' | 'containment' | 'escalation' | 'close', number>>>>;
}

export interface DefectWorkflowGovernanceSettings {
  version: 1;
  updatedAt: string;
  sla: DefectSlaSettings;
  approvalMatrix: ApprovalMatrixSettings;
  transitions: DefectWorkflowTransitionSetting[];
}

export interface ApprovalRequirement {
  required: boolean;
  requiredRole: QualityWorkflowRole;
  label: string;
  reasons: string[];
  managementAttention: boolean;
}

export interface GovernedSlaStatus {
  label: string;
  status: 'within' | 'warning' | 'overdue' | 'closed';
  targetHours: number;
  elapsedHours: number;
  overdueByHours: number;
  metric: 'review' | 'containment' | 'escalation' | 'close';
}

export interface WorkflowActionAccess {
  allowed: boolean;
  reason: string;
  permission: DefectPermission;
  requiredRoles: QualityWorkflowRole[];
  transition?: DefectWorkflowTransitionSetting;
}

export interface DefectWorkflowNotification {
  id: string;
  type:
    | 'pending-review'
    | 'pending-approval'
    | 'overdue-sla'
    | 'repeated-defect'
    | 'ncr-suggested'
    | 'capa-suggested'
    | 'eight-d-suggested'
    | 'action-due-soon'
    | 'action-overdue'
    | 'customer-return-escalation';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  relatedDefectId: string;
  createdAt: string;
  read: boolean;
  suggestedAction: string;
}

export interface DefectWorkflowTask {
  id: string;
  title: string;
  category: 'assigned' | 'review' | 'approval' | 'action' | 'verification' | 'follow-up';
  relatedDefectId: string;
  status: string;
  dueDate?: string;
  overdue: boolean;
  message: string;
}

const SETTINGS_KEY = 'qms_defect_workflow_governance_settings_v1';
const LOCAL_ROLE_KEY = 'qms_defect_workflow_current_role_v1';
const READ_NOTIFICATIONS_KEY = 'qms_defect_workflow_read_notifications_v1';

export const QUALITY_WORKFLOW_ROLES: QualityWorkflowRole[] = [
  'SYSTEM',
  'ADMIN',
  'PLANT_MANAGER',
  'QUALITY_MANAGER',
  'QUALITY_SUPERVISOR',
  'QUALITY_ENGINEER',
  'PRODUCTION_ENGINEER',
  'INSPECTOR',
  'OPERATOR',
];

const permissionByRole: Record<QualityWorkflowRole, DefectPermission[]> = {
  SYSTEM: [
    'defect.create', 'defect.edit', 'defect.delete', 'defect.submitReview', 'defect.review', 'defect.approve',
    'defect.reject', 'defect.startInvestigation', 'defect.elevateNcr', 'defect.createCapa', 'defect.escalate8d',
    'defect.close', 'defect.reopen', 'masterData.edit', 'rules.edit', 'records.export', 'executiveDashboard.view',
  ],
  ADMIN: [
    'defect.create', 'defect.edit', 'defect.delete', 'defect.submitReview', 'defect.review', 'defect.approve',
    'defect.reject', 'defect.startInvestigation', 'defect.elevateNcr', 'defect.createCapa', 'defect.escalate8d',
    'defect.close', 'defect.reopen', 'masterData.edit', 'rules.edit', 'records.export', 'executiveDashboard.view',
  ],
  PLANT_MANAGER: [
    'defect.review', 'defect.approve', 'defect.reject', 'defect.elevateNcr', 'defect.createCapa', 'defect.escalate8d',
    'defect.close', 'defect.reopen', 'records.export', 'executiveDashboard.view',
  ],
  QUALITY_MANAGER: [
    'defect.create', 'defect.edit', 'defect.review', 'defect.approve', 'defect.reject', 'defect.startInvestigation',
    'defect.elevateNcr', 'defect.createCapa', 'defect.escalate8d', 'defect.close', 'defect.reopen',
    'masterData.edit', 'rules.edit', 'records.export', 'executiveDashboard.view',
  ],
  QUALITY_SUPERVISOR: [
    'defect.create', 'defect.edit', 'defect.submitReview', 'defect.review', 'defect.approve', 'defect.reject',
    'defect.startInvestigation', 'defect.elevateNcr', 'defect.createCapa', 'defect.close', 'records.export',
  ],
  QUALITY_ENGINEER: [
    'defect.create', 'defect.edit', 'defect.submitReview', 'defect.review', 'defect.startInvestigation',
    'defect.elevateNcr', 'defect.createCapa', 'defect.close', 'records.export',
  ],
  PRODUCTION_ENGINEER: [
    'defect.create', 'defect.edit', 'defect.submitReview', 'defect.startInvestigation', 'defect.close', 'records.export',
  ],
  INSPECTOR: ['defect.create', 'defect.edit', 'defect.submitReview', 'records.export'],
  OPERATOR: ['defect.create', 'defect.submitReview'],
};

const workflowActionPermission: Record<DefectWorkflowActionId, DefectPermission> = {
  'submit-review': 'defect.submitReview',
  review: 'defect.review',
  approve: 'defect.approve',
  reject: 'defect.reject',
  'start-investigation': 'defect.startInvestigation',
  'elevate-ncr': 'defect.elevateNcr',
  'create-capa': 'defect.createCapa',
  'escalate-8d': 'defect.escalate8d',
  'verify-action': 'defect.close',
  close: 'defect.close',
  reopen: 'defect.reopen',
};

function nowIso(): string {
  return new Date().toISOString();
}

function parseNumber(value: unknown): number {
  const parsed = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function hoursBetween(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (Number.isNaN(s) || Number.isNaN(e)) return 0;
  return Math.max(0, Math.round(((e - s) / 3_600_000) * 10) / 10);
}

function normalizeRole(value?: string): QualityWorkflowRole {
  const normalized = String(value || '')
    .trim()
    .replace(/[\s-]+/g, '_')
    .toUpperCase();
  if (normalized === 'ADMIN' || normalized === 'SYSTEM_ADMINISTRATOR') return 'ADMIN';
  if (normalized === 'QUALITY_DIRECTOR' || normalized === 'QUALITY_MANAGER') return 'QUALITY_MANAGER';
  if (normalized === 'QUALITY_SUPERVISOR') return 'QUALITY_SUPERVISOR';
  if (normalized === 'QUALITY_ENGINEER') return 'QUALITY_ENGINEER';
  if (normalized === 'PRODUCTION_ENGINEER') return 'PRODUCTION_ENGINEER';
  if (normalized === 'PLANT_MANAGER') return 'PLANT_MANAGER';
  if (normalized === 'INSPECTOR') return 'INSPECTOR';
  if (normalized === 'OPERATOR' || normalized === 'USER') return 'OPERATOR';
  if (QUALITY_WORKFLOW_ROLES.includes(normalized as QualityWorkflowRole)) return normalized as QualityWorkflowRole;
  return 'QUALITY_ENGINEER';
}

export function getDefaultGovernanceSettings(): DefectWorkflowGovernanceSettings {
  return {
    version: 1,
    updatedAt: nowIso(),
    sla: {
      timeToReviewHrs: 24,
      timeToContainmentHrs: 8,
      timeToEscalationHrs: 24,
      timeToCloseHrs: 120,
      overdueWarningThresholdHrs: 4,
      severityOverrides: {
        critical: { review: 4, containment: 2, escalation: 8, close: 72 },
        high: { review: 8, containment: 4, escalation: 16, close: 96 },
      },
      recordTypeOverrides: {
        'customer-return': { review: 4, containment: 4, escalation: 8, close: 96 },
        'outgoing-quality': { review: 8, containment: 4, escalation: 12, close: 96 },
      },
    },
    approvalMatrix: {
      lowSeverityRole: 'QUALITY_ENGINEER',
      highSeverityRole: 'QUALITY_SUPERVISOR',
      customerReturnRole: 'QUALITY_MANAGER',
      highCostRole: 'QUALITY_MANAGER',
      outgoingFailureRole: 'QUALITY_MANAGER',
      managementAttentionRole: 'PLANT_MANAGER',
      highCostThreshold: 10000,
      repeatedDefectThreshold: 3,
      highQuantityThreshold: 10,
    },
    transitions: [
      { id: 'draft-logged', fromStatus: 'draft', toStatus: 'logged', allowedRoles: ['OPERATOR', 'INSPECTOR', 'QUALITY_ENGINEER', 'QUALITY_SUPERVISOR', 'QUALITY_MANAGER', 'ADMIN', 'SYSTEM'], requiresComment: false, requiresEvidence: false, requiresApproval: false, slaTargetHours: 24 },
      { id: 'logged-reviewed', fromStatus: 'logged', toStatus: 'reviewed', allowedRoles: ['QUALITY_ENGINEER', 'QUALITY_SUPERVISOR', 'QUALITY_MANAGER', 'ADMIN', 'SYSTEM'], requiresComment: true, requiresEvidence: false, requiresApproval: false, slaTargetHours: 24 },
      { id: 'logged-rejected', fromStatus: 'logged', toStatus: 'rejected', allowedRoles: ['QUALITY_ENGINEER', 'QUALITY_SUPERVISOR', 'QUALITY_MANAGER', 'ADMIN', 'SYSTEM'], requiresComment: true, requiresEvidence: false, requiresApproval: false },
      { id: 'reviewed-approved', fromStatus: 'reviewed', toStatus: 'approved', allowedRoles: ['QUALITY_SUPERVISOR', 'QUALITY_MANAGER', 'PLANT_MANAGER', 'ADMIN', 'SYSTEM'], requiresComment: true, requiresEvidence: false, requiresApproval: true, slaTargetHours: 24 },
      { id: 'reviewed-investigating', fromStatus: 'reviewed', toStatus: 'investigating', allowedRoles: ['QUALITY_ENGINEER', 'QUALITY_SUPERVISOR', 'QUALITY_MANAGER', 'ADMIN', 'SYSTEM'], requiresComment: false, requiresEvidence: false, requiresApproval: false },
      { id: 'reviewed-escalated', fromStatus: 'reviewed', toStatus: 'escalated', allowedRoles: ['QUALITY_SUPERVISOR', 'QUALITY_MANAGER', 'PLANT_MANAGER', 'ADMIN', 'SYSTEM'], requiresComment: true, requiresEvidence: false, requiresApproval: true },
      { id: 'investigating-escalated', fromStatus: 'investigating', toStatus: 'escalated', allowedRoles: ['QUALITY_ENGINEER', 'QUALITY_SUPERVISOR', 'QUALITY_MANAGER', 'ADMIN', 'SYSTEM'], requiresComment: true, requiresEvidence: false, requiresApproval: false },
      { id: 'investigating-closed', fromStatus: 'investigating', toStatus: 'closed', allowedRoles: ['QUALITY_ENGINEER', 'QUALITY_SUPERVISOR', 'QUALITY_MANAGER', 'ADMIN', 'SYSTEM'], requiresComment: true, requiresEvidence: false, requiresApproval: false, slaTargetHours: 120 },
      { id: 'escalated-closed', fromStatus: 'escalated', toStatus: 'closed', allowedRoles: ['QUALITY_SUPERVISOR', 'QUALITY_MANAGER', 'PLANT_MANAGER', 'ADMIN', 'SYSTEM'], requiresComment: true, requiresEvidence: false, requiresApproval: false, slaTargetHours: 120 },
      { id: 'closed-reopened', fromStatus: 'closed', toStatus: 'reopened', allowedRoles: ['QUALITY_MANAGER', 'PLANT_MANAGER', 'ADMIN', 'SYSTEM'], requiresComment: true, requiresEvidence: false, requiresApproval: true },
      { id: 'reopened-investigating', fromStatus: 'reopened', toStatus: 'investigating', allowedRoles: ['QUALITY_ENGINEER', 'QUALITY_SUPERVISOR', 'QUALITY_MANAGER', 'ADMIN', 'SYSTEM'], requiresComment: false, requiresEvidence: false, requiresApproval: false },
    ],
  };
}

export function loadDefectWorkflowGovernanceSettings(): DefectWorkflowGovernanceSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const defaults = getDefaultGovernanceSettings();
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<DefectWorkflowGovernanceSettings>;
    return {
      ...defaults,
      ...parsed,
      sla: { ...defaults.sla, ...(parsed.sla || {}) },
      approvalMatrix: { ...defaults.approvalMatrix, ...(parsed.approvalMatrix || {}) },
      transitions: Array.isArray(parsed.transitions) && parsed.transitions.length > 0 ? parsed.transitions : defaults.transitions,
      version: 1,
    };
  } catch {
    return getDefaultGovernanceSettings();
  }
}

export function saveDefectWorkflowGovernanceSettings(settings: DefectWorkflowGovernanceSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings, updatedAt: nowIso(), version: 1 }));
}

export function loadLocalWorkflowRole(): QualityWorkflowRole {
  try {
    return normalizeRole(localStorage.getItem(LOCAL_ROLE_KEY) || '');
  } catch {
    return 'QUALITY_ENGINEER';
  }
}

export function saveLocalWorkflowRole(role: QualityWorkflowRole): void {
  localStorage.setItem(LOCAL_ROLE_KEY, role);
}

export function buildLocalWorkflowUser(authUser?: { id?: string; name?: string; firstName?: string; lastName?: string; email?: string; role?: string; permissions?: string[] } | null, roleOverride?: QualityWorkflowRole): LocalWorkflowUser {
  const role = roleOverride || normalizeRole(authUser?.role);
  return {
    id: authUser?.id || 'local-user',
    name: authUser?.name || [authUser?.firstName, authUser?.lastName].filter(Boolean).join(' ') || authUser?.email || 'Local Quality User',
    role,
    permissions: permissionByRole[role],
  };
}

export function hasDefectPermission(user: LocalWorkflowUser, permission: DefectPermission): boolean {
  return user.role === 'SYSTEM' || user.role === 'ADMIN' || user.permissions.includes(permission);
}

export function getWorkflowActionPermission(actionId: DefectWorkflowActionId): DefectPermission {
  return workflowActionPermission[actionId];
}

export function evaluateApprovalRequirement(record: DefectLogData | Record<string, unknown>, records: ExtendedDefectLog[] = [], settings = loadDefectWorkflowGovernanceSettings()): ApprovalRequirement {
  const data = record as DefectLogData & Record<string, unknown>;
  const matrix = settings.approvalMatrix;
  const rules = evaluateAdvancedDefectRules(data, records);
  const severity = String(data.severity || '').toLowerCase();
  const recordType = String(data.recordType || '').toLowerCase();
  const quantity = parseNumber(data.quantity);
  const estimatedCost = parseNumber(data.estimatedCost);
  const outgoingFailure = String(data.outgoingResult || '').toLowerCase() === 'fail';
  const customerReturn = recordType === 'customer-return' || Boolean(data.returnReference);
  const supplierRelated = Boolean(data.supplierName || data.supplierNameAtTime);
  const criticalPart = severity === 'critical' || String(data.defaultInspectionPoint || '').toLowerCase().includes('critical');
  const reasons: string[] = [];
  let requiredRole = matrix.lowSeverityRole;
  let managementAttention = false;

  if (severity === 'high' || severity === 'major' || quantity >= matrix.highQuantityThreshold) {
    requiredRole = matrix.highSeverityRole;
    reasons.push('High severity or quantity requires supervisor approval.');
  }
  if (customerReturn) {
    requiredRole = matrix.customerReturnRole;
    reasons.push('Customer return requires quality manager approval.');
  }
  if (estimatedCost >= matrix.highCostThreshold) {
    requiredRole = matrix.highCostRole;
    reasons.push('High COPQ value requires quality manager review.');
  }
  if (outgoingFailure) {
    requiredRole = matrix.outgoingFailureRole;
    reasons.push('Outgoing failure requires controlled quality approval.');
  }
  if (rules.repeatedDefect.similarRecordIds.length >= matrix.repeatedDefectThreshold) {
    requiredRole = matrix.highSeverityRole;
    reasons.push('Repeated similar defects require verification before closure.');
  }
  if (criticalPart || severity === 'critical') {
    requiredRole = matrix.managementAttentionRole;
    managementAttention = true;
    reasons.push('Critical quality signal suggests management attention.');
  }
  if (supplierRelated && severity !== 'low') {
    reasons.push('Supplier-related issue should be verified against master data and incoming quality history.');
  }

  const required = reasons.length > 0 || Boolean((data as DefectLogData).approvalRequired);
  return {
    required,
    requiredRole: required ? requiredRole : matrix.lowSeverityRole,
    label: required ? `${requiredRole.replace(/_/g, ' ')} approval required` : 'Standard quality review',
    reasons: reasons.length > 0 ? reasons : ['No elevated approval condition from current governance settings.'],
    managementAttention,
  };
}

export function buildOwnerPatch(record: DefectLogData | Record<string, unknown>, settings = loadDefectWorkflowGovernanceSettings()): Partial<DefectLogData> {
  const approval = evaluateApprovalRequirement(record, [], settings);
  const status = normalizeDefectLifecycleStatus(String((record as DefectLogData).status || 'logged'));
  const nextRoleByStatus: Partial<Record<DefectLifecycleStatus, QualityWorkflowRole>> = {
    draft: 'OPERATOR',
    logged: 'QUALITY_ENGINEER',
    reviewed: approval.requiredRole,
    approved: 'QUALITY_ENGINEER',
    investigating: 'QUALITY_ENGINEER',
    escalated: approval.managementAttention ? 'PLANT_MANAGER' : 'QUALITY_MANAGER',
    reopened: 'QUALITY_ENGINEER',
  };
  const nextRequiredRole = nextRoleByStatus[status] || approval.requiredRole;
  return {
    approvalRequired: approval.required,
    approvalReasons: approval.reasons,
    currentOwner: nextRequiredRole,
    nextRequiredRole,
    assignedRole: String((record as DefectLogData).assignedRole || nextRequiredRole),
  };
}

export function getTransitionSetting(fromStatus: string | undefined, toStatus: DefectLifecycleStatus, settings = loadDefectWorkflowGovernanceSettings()): DefectWorkflowTransitionSetting | undefined {
  const normalizedFrom = normalizeDefectLifecycleStatus(fromStatus);
  return settings.transitions.find((item) => item.fromStatus === normalizedFrom && item.toStatus === toStatus);
}

export function evaluateWorkflowActionAccess(record: DefectLogData, action: DefectWorkflowAction, user: LocalWorkflowUser, settings = loadDefectWorkflowGovernanceSettings()): WorkflowActionAccess {
  const permission = getWorkflowActionPermission(action.id);
  const transition = action.nextStatus ? getTransitionSetting(record.status, action.nextStatus, settings) : undefined;
  const requiredRoles = transition?.allowedRoles || (permissionByRole[user.role].includes(permission) ? [user.role] : []);

  if (!hasDefectPermission(user, permission)) {
    return {
      allowed: false,
      reason: `${user.role.replace(/_/g, ' ')} does not have ${permission}.`,
      permission,
      requiredRoles: transition?.allowedRoles || [],
      transition,
    };
  }
  if (action.nextStatus && !getAllowedTransitions(record.status).includes(action.nextStatus)) {
    return {
      allowed: false,
      reason: 'This status transition is not allowed by the safe state machine.',
      permission,
      requiredRoles: transition?.allowedRoles || [],
      transition,
    };
  }
  if (transition && !transition.allowedRoles.includes(user.role) && user.role !== 'ADMIN' && user.role !== 'SYSTEM') {
    return {
      allowed: false,
      reason: `Requires one of: ${transition.allowedRoles.map((role) => role.replace(/_/g, ' ')).join(', ')}.`,
      permission,
      requiredRoles: transition.allowedRoles,
      transition,
    };
  }
  if (transition?.requiresEvidence && (!Array.isArray(record.evidence) || record.evidence.length === 0)) {
    return {
      allowed: false,
      reason: 'Evidence is required before this transition.',
      permission,
      requiredRoles: transition.allowedRoles,
      transition,
    };
  }
  if (transition?.requiresApproval) {
    const approval = evaluateApprovalRequirement(record, [], settings);
    if (approval.required && user.role !== approval.requiredRole && user.role !== 'ADMIN' && user.role !== 'SYSTEM') {
      return {
        allowed: false,
        reason: `Approval requires ${approval.requiredRole.replace(/_/g, ' ')}.`,
        permission,
        requiredRoles: [approval.requiredRole],
        transition,
      };
    }
  }

  return {
    allowed: true,
    reason: transition?.warningMessage || 'Allowed for the current role and workflow status.',
    permission,
    requiredRoles,
    transition,
  };
}

export function getSlaTargetHours(record: DefectLogData, metric: 'review' | 'containment' | 'escalation' | 'close', settings = loadDefectWorkflowGovernanceSettings()): number {
  const severity = String(record.severity || '').toLowerCase();
  const recordType = String(record.recordType || '').toLowerCase();
  const severityOverride = settings.sla.severityOverrides[severity]?.[metric];
  const typeOverride = settings.sla.recordTypeOverrides[recordType]?.[metric];
  if (typeof severityOverride === 'number') return severityOverride;
  if (typeof typeOverride === 'number') return typeOverride;
  if (metric === 'review') return settings.sla.timeToReviewHrs;
  if (metric === 'containment') return settings.sla.timeToContainmentHrs;
  if (metric === 'escalation') return settings.sla.timeToEscalationHrs;
  return settings.sla.timeToCloseHrs;
}

export function buildGovernedSlaStatus(record: DefectLogData, settings = loadDefectWorkflowGovernanceSettings()): GovernedSlaStatus {
  const status = normalizeDefectLifecycleStatus(record.status);
  const data = record as unknown as Record<string, unknown>;
  const loggedAt = String(data.loggedAt || record.createdAt || record.date || nowIso());
  const now = nowIso();
  const lifecycleSla = buildSlaMetrics(record);
  let metric: GovernedSlaStatus['metric'] = 'review';
  let elapsedHours = hoursBetween(loggedAt, now);

  if (status === 'logged') {
    metric = 'review';
    elapsedHours = lifecycleSla.timeToReviewHrs ?? hoursBetween(loggedAt, now);
  } else if (status === 'reviewed' || status === 'approved') {
    metric = 'containment';
    elapsedHours = lifecycleSla.timeToContainmentHrs ?? hoursBetween(loggedAt, now);
  } else if (status === 'investigating') {
    metric = 'escalation';
    elapsedHours = lifecycleSla.timeToEscalationHrs ?? hoursBetween(loggedAt, now);
  } else if (status === 'closed') {
    metric = 'close';
    elapsedHours = lifecycleSla.timeToCloseHrs ?? 0;
  } else {
    metric = 'close';
  }

  const targetHours = getSlaTargetHours(record, metric, settings);
  const overdueByHours = Math.max(0, Math.round((elapsedHours - targetHours) * 10) / 10);
  if (status === 'closed') {
    return { label: 'Closed workflow', status: 'closed', targetHours, elapsedHours, overdueByHours: 0, metric };
  }
  if (overdueByHours > 0) {
    return { label: `Overdue by ${overdueByHours}h`, status: 'overdue', targetHours, elapsedHours, overdueByHours, metric };
  }
  if (targetHours - elapsedHours <= settings.sla.overdueWarningThresholdHrs) {
    return { label: 'Approaching SLA target', status: 'warning', targetHours, elapsedHours, overdueByHours: 0, metric };
  }
  return { label: 'Within configured SLA', status: 'within', targetHours, elapsedHours, overdueByHours: 0, metric };
}

export function loadReadWorkflowNotificationIds(): string[] {
  try {
    const raw = localStorage.getItem(READ_NOTIFICATIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function saveReadWorkflowNotificationIds(ids: string[]): void {
  localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify([...new Set(ids)]));
}

export function buildWorkflowNotifications(records: DefectLogData[], user: LocalWorkflowUser, settings = loadDefectWorkflowGovernanceSettings(), readIds = loadReadWorkflowNotificationIds()): DefectWorkflowNotification[] {
  const read = new Set(readIds);
  const notifications: DefectWorkflowNotification[] = [];
  records.forEach((record) => {
    const status = normalizeDefectLifecycleStatus(record.status);
    const sla = buildGovernedSlaStatus(record, settings);
    const approval = evaluateApprovalRequirement(record, records as ExtendedDefectLog[], settings);
    const rules = evaluateAdvancedDefectRules(record as unknown as Record<string, unknown>, records as ExtendedDefectLog[]);
    const baseCreatedAt = String(record.updatedAt || record.createdAt || record.date || nowIso());
    const add = (type: DefectWorkflowNotification['type'], title: string, message: string, severity: DefectWorkflowNotification['severity'], suggestedAction: string) => {
      const id = `${type}-${record.id}`;
      notifications.push({ id, type, title, message, severity, relatedDefectId: record.id, createdAt: baseCreatedAt, read: read.has(id), suggestedAction });
    };

    if (status === 'logged' && ['QUALITY_ENGINEER', 'QUALITY_SUPERVISOR', 'QUALITY_MANAGER', 'ADMIN', 'SYSTEM'].includes(user.role)) {
      add('pending-review', 'Pending review', `${record.defectType || 'Defect'} requires quality review.`, 'info', 'Open the defect details and review the record.');
    }
    if (approval.required && status === 'reviewed' && (user.role === approval.requiredRole || user.role === 'ADMIN' || user.role === 'SYSTEM')) {
      add('pending-approval', 'Pending approval', approval.label, approval.managementAttention ? 'critical' : 'warning', 'Verify contributors, evidence, and approve only if quality checks are sufficient.');
    }
    if (sla.status === 'overdue') {
      add('overdue-sla', 'SLA overdue', `${record.defectType || 'Defect'} is ${sla.label.toLowerCase()}.`, 'critical', 'Prioritize workflow action and document the reason.');
    }
    if (rules.repeatedDefect.repeated) {
      add('repeated-defect', 'Repeated defect signal', rules.repeatedDefect.message, 'warning', 'Compare similar records before deciding escalation.');
    }
    if (rules.ncrSuggested) {
      add('ncr-suggested', 'NCR suggested', 'Governance rules suggest NCR review.', 'warning', 'Use Elevate to NCR only after engineering verification.');
    }
    if (approval.required && approval.requiredRole === 'QUALITY_MANAGER') {
      add('capa-suggested', 'CAPA may be useful', 'Formal corrective action may be useful if verified.', 'warning', 'Review containment and recurrence before creating CAPA.');
    }
    if (approval.managementAttention) {
      add('eight-d-suggested', 'Management attention', 'Critical or high-impact defect may require structured investigation.', 'critical', 'Consider 8D only by explicit user action.');
    }
    const dueDate = record.dueDate ? new Date(record.dueDate).getTime() : 0;
    if (dueDate > 0 && status !== 'closed') {
      const hoursToDue = Math.round(((dueDate - Date.now()) / 3_600_000) * 10) / 10;
      if (hoursToDue < 0) {
        add('action-overdue', 'Action overdue', 'Assigned action due date has passed.', 'critical', 'Update action tracking and verify next step.');
      } else if (hoursToDue <= 24) {
        add('action-due-soon', 'Action due soon', 'Assigned action is due within 24 hours.', 'warning', 'Follow up with the responsible owner.');
      }
    }
    if (String(record.recordType || '').toLowerCase() === 'customer-return' || record.returnReference) {
      add('customer-return-escalation', 'Customer return escalation', 'Customer return record requires controlled review.', 'critical', 'Confirm customer impact and containment plan.');
    }
  });
  return notifications.sort((a, b) => Number(a.read) - Number(b.read) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function buildMyWorkflowTasks(records: DefectLogData[], user: LocalWorkflowUser, settings = loadDefectWorkflowGovernanceSettings()): DefectWorkflowTask[] {
  const tasks: DefectWorkflowTask[] = [];
  records.forEach((record) => {
    const status = normalizeDefectLifecycleStatus(record.status);
    const sla = buildGovernedSlaStatus(record, settings);
    const approval = evaluateApprovalRequirement(record, records as ExtendedDefectLog[], settings);
    const assignedToMe = record.assignedTo === user.id || record.currentOwner === user.role || record.assignedRole === user.role || record.nextRequiredRole === user.role;
    const add = (category: DefectWorkflowTask['category'], title: string, message: string, dueDate?: string) => {
      const due = dueDate ? new Date(dueDate).getTime() : 0;
      tasks.push({
        id: `${category}-${record.id}`,
        title,
        category,
        relatedDefectId: record.id,
        status,
        dueDate,
        overdue: sla.status === 'overdue' || (due > 0 && due < Date.now()),
        message,
      });
    };

    if (assignedToMe && status !== 'closed') add('assigned', record.defectType || 'Assigned defect', 'This defect is assigned to your user or role.', record.dueDate);
    if (status === 'logged' && hasDefectPermission(user, 'defect.review')) add('review', 'Review defect record', 'Review required before approval or investigation.');
    if (status === 'reviewed' && approval.required && (user.role === approval.requiredRole || user.role === 'ADMIN' || user.role === 'SYSTEM')) add('approval', 'Approval required', approval.label);
    if (['investigating', 'escalated'].includes(status) && (record.responsiblePerson || assignedToMe)) add('action', 'Open action tracking', 'Containment or corrective action is still open.', record.dueDate);
    if (record.actionStatus === 'completed' && hasDefectPermission(user, 'defect.close')) add('verification', 'Verification pending', 'Completed action needs verification before closure.');
    if (record.relatedNcrId || record.relatedCapaId || record.relatedEightDId) add('follow-up', 'Linked record follow-up', 'NCR/CAPA/8D linkage exists and should remain aligned.');
  });
  return tasks.sort((a, b) => Number(b.overdue) - Number(a.overdue));
}

export function roleLabel(role: QualityWorkflowRole): string {
  return role.replace(/_/g, ' ');
}
