import {
  buildLocalWorkflowUser,
  loadLocalWorkflowRole,
  roleLabel,
  type QualityWorkflowRole,
} from '@/services/defectWorkflowGovernance';
import { loadImprovementActions } from '@/services/qualityImprovementActions';
import { enqueueQualitySyncItem } from '@/services/qualitySyncQueue';

export const QUALITY_AUDIT_PLANS_KEY = 'qms_quality_audit_plans_v1';
export const QUALITY_AUDIT_RUNS_KEY = 'qms_quality_audit_runs_v1';

export type QualityAuditType = 'process-audit' | 'inspection-audit' | 'product-audit' | 'layered-audit' | 'supervisor-audit';
export type QualityAuditPlanStatus = 'draft' | 'active' | 'archived';
export type QualityAuditRunStatus = 'in-progress' | 'completed' | 'partially-completed';
export type QualityAuditInputType = 'pass-fail' | 'score' | 'text' | 'select' | 'photo-required';
export type QualityAuditResultValue = 'pass' | 'fail' | 'na';
export type QualityAuditFindingSeverity = 'minor' | 'major' | 'critical';

export interface QualityAuditSection {
  id: string;
  title: string;
  description?: string;
  order: number;
}

export interface QualityAuditItem {
  id: string;
  itemCode: string;
  question: string;
  section: string;
  expectedCondition?: string;
  inputType: QualityAuditInputType;
  weight: number;
  isCritical: boolean;
  requiredEvidence: boolean;
  linkedCheckItemId?: string;
  findingTypeIfFail?: string;
  severityIfFail?: QualityAuditFindingSeverity;
  suggestedAction?: string;
  order: number;
}

export interface QualityAuditPlanVersionSnapshot {
  version: number;
  status: QualityAuditPlanStatus;
  sections: QualityAuditSection[];
  auditItems: QualityAuditItem[];
  createdAt: string;
  note: string;
}

export interface QualityAuditPlan {
  id: string;
  auditName: string;
  auditType: QualityAuditType;
  factory?: string;
  workshop?: string;
  productionLine?: string;
  inspectionPoint?: string;
  relatedInspectionPlanId?: string;
  frequency?: string;
  ownerRole?: QualityWorkflowRole;
  version: number;
  status: QualityAuditPlanStatus;
  sections: QualityAuditSection[];
  auditItems: QualityAuditItem[];
  history?: QualityAuditPlanVersionSnapshot[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  createdByRole?: QualityWorkflowRole;
}

export interface QualityAuditEvidence {
  id: string;
  name: string;
  type: string;
  size: number;
  note?: string;
  dataUrl?: string;
  storedLocally: boolean;
  warning?: string;
  uploadedAt: string;
}

export interface QualityAuditFinding {
  id: string;
  auditItemId: string;
  itemCode: string;
  question: string;
  findingType: string;
  severity: QualityAuditFindingSeverity;
  suggestedAction?: string;
  evidenceMissing: boolean;
  repeatedCount: number;
  createdActionId?: string;
  createdNcrId?: string;
  trainingPointCreated?: boolean;
}

export interface QualityAuditAnswer {
  auditItemId: string;
  result: QualityAuditResultValue;
  score?: number;
  textValue?: string;
  notes?: string;
  evidence?: QualityAuditEvidence[];
  finding?: QualityAuditFinding;
}

export interface QualityAuditRun {
  id: string;
  auditPlanId: string;
  auditPlanVersion: number;
  auditType: QualityAuditType;
  productionLine?: string;
  inspectionPoint?: string;
  relatedInspectionRunId?: string;
  auditor?: string;
  startedAt: string;
  completedAt?: string;
  status: QualityAuditRunStatus;
  answers: QualityAuditAnswer[];
  findings: QualityAuditFinding[];
  auditScore: number;
  createdActionIds: string[];
  createdNcrIds: string[];
}

export interface QualityLayeredAuditAnalytics {
  totalPlans: number;
  activePlans: number;
  totalRuns: number;
  completedRuns: number;
  auditsDueToday: number;
  completionRate: number;
  averageAuditScore: number;
  failedAuditItems: number;
  criticalFindings: number;
  repeatFindings: number;
  actionsCreatedFromAudits: number;
  overdueAuditActions: number;
  lowestComplianceLine: string;
  lowestComplianceScore: number;
  lineCompliance: Array<{ line: string; runs: number; averageScore: number; criticalFindings: number }>;
  repeatedFindings: Array<{ key: string; count: number; severity: QualityAuditFindingSeverity; suggestedAction: string }>;
  recentRuns: QualityAuditRun[];
}

export interface QualityAuditCommandSummary {
  auditsDueToday: number;
  completedAudits: number;
  criticalFindings: number;
  repeatAuditFindings: number;
  auditActionsOverdue: number;
  lowestComplianceLine: string;
}

const planManagerRoles: QualityWorkflowRole[] = ['SYSTEM', 'ADMIN', 'PLANT_MANAGER', 'QUALITY_MANAGER', 'QUALITY_SUPERVISOR'];
const executionRoles: QualityWorkflowRole[] = ['SYSTEM', 'ADMIN', 'QUALITY_MANAGER', 'QUALITY_SUPERVISOR', 'QUALITY_ENGINEER'];
const viewAllRoles: QualityWorkflowRole[] = ['SYSTEM', 'ADMIN', 'PLANT_MANAGER', 'QUALITY_MANAGER', 'QUALITY_SUPERVISOR', 'QUALITY_ENGINEER'];

function nowIso(): string {
  return new Date().toISOString();
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cleanText(value: unknown): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function toNumber(value: unknown, fallback = 0): number {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function localDateKey(value?: string): string {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isToday(value?: string): boolean {
  return localDateKey(value) === localDateKey();
}

function sameText(a: unknown, b: unknown): boolean {
  const left = cleanText(a).toLowerCase();
  const right = cleanText(b).toLowerCase();
  return Boolean(left && right && left === right);
}

function readJsonArray<T>(key: string): T[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJsonArray<T>(key: string, rows: T[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(rows));
}

function normalizeAuditType(value: unknown): QualityAuditType {
  const allowed: QualityAuditType[] = ['process-audit', 'inspection-audit', 'product-audit', 'layered-audit', 'supervisor-audit'];
  return allowed.includes(value as QualityAuditType) ? value as QualityAuditType : 'layered-audit';
}

function normalizeStatus(value: unknown): QualityAuditPlanStatus {
  const allowed: QualityAuditPlanStatus[] = ['draft', 'active', 'archived'];
  return allowed.includes(value as QualityAuditPlanStatus) ? value as QualityAuditPlanStatus : 'draft';
}

function normalizeRunStatus(value: unknown): QualityAuditRunStatus {
  const allowed: QualityAuditRunStatus[] = ['in-progress', 'completed', 'partially-completed'];
  return allowed.includes(value as QualityAuditRunStatus) ? value as QualityAuditRunStatus : 'in-progress';
}

function normalizeInputType(value: unknown): QualityAuditInputType {
  const allowed: QualityAuditInputType[] = ['pass-fail', 'score', 'text', 'select', 'photo-required'];
  return allowed.includes(value as QualityAuditInputType) ? value as QualityAuditInputType : 'pass-fail';
}

function normalizeSeverity(value: unknown, isCritical = false): QualityAuditFindingSeverity {
  const severity = cleanText(value).toLowerCase();
  if (severity === 'critical' || isCritical) return 'critical';
  if (severity === 'major' || severity === 'high') return 'major';
  return 'minor';
}

function normalizeSection(raw: Partial<QualityAuditSection>, index: number): QualityAuditSection {
  return {
    id: raw.id || newId('audit-section'),
    title: cleanText(raw.title) || `Section ${index + 1}`,
    description: cleanText(raw.description),
    order: Number(raw.order || index + 1),
  };
}

function normalizeAuditItem(raw: Partial<QualityAuditItem>, index: number): QualityAuditItem {
  const isCritical = Boolean(raw.isCritical);
  return {
    id: raw.id || newId('audit-item'),
    itemCode: cleanText(raw.itemCode) || `AUD-${String(index + 1).padStart(3, '0')}`,
    question: cleanText(raw.question) || `Audit question ${index + 1}`,
    section: cleanText(raw.section) || 'General',
    expectedCondition: cleanText(raw.expectedCondition),
    inputType: normalizeInputType(raw.inputType),
    weight: Math.max(1, toNumber(raw.weight, 1)),
    isCritical,
    requiredEvidence: Boolean(raw.requiredEvidence),
    linkedCheckItemId: cleanText(raw.linkedCheckItemId),
    findingTypeIfFail: cleanText(raw.findingTypeIfFail) || 'Audit gap',
    severityIfFail: normalizeSeverity(raw.severityIfFail, isCritical),
    suggestedAction: cleanText(raw.suggestedAction),
    order: Number(raw.order || index + 1),
  };
}

export function normalizeAuditPlan(raw: Partial<QualityAuditPlan>): QualityAuditPlan {
  const createdAt = raw.createdAt || nowIso();
  const sections = Array.isArray(raw.sections) && raw.sections.length
    ? raw.sections.map(normalizeSection)
    : [normalizeSection({ title: 'General', order: 1 }, 0)];
  const knownSections = new Set(sections.map((section) => section.title));
  const auditItems = Array.isArray(raw.auditItems) ? raw.auditItems.map(normalizeAuditItem) : [];
  auditItems.forEach((item) => {
    if (!knownSections.has(item.section)) {
      sections.push(normalizeSection({ title: item.section, order: sections.length + 1 }, sections.length));
      knownSections.add(item.section);
    }
  });
  return {
    id: raw.id || newId('audit-plan'),
    auditName: cleanText(raw.auditName) || 'New Layered Audit Plan',
    auditType: normalizeAuditType(raw.auditType),
    factory: cleanText(raw.factory),
    workshop: cleanText(raw.workshop),
    productionLine: cleanText(raw.productionLine),
    inspectionPoint: cleanText(raw.inspectionPoint),
    relatedInspectionPlanId: cleanText(raw.relatedInspectionPlanId),
    frequency: cleanText(raw.frequency) || 'daily',
    ownerRole: raw.ownerRole || 'QUALITY_SUPERVISOR',
    version: Number(raw.version || 1),
    status: normalizeStatus(raw.status),
    sections: sections.sort((a, b) => a.order - b.order),
    auditItems: auditItems.sort((a, b) => a.order - b.order),
    history: Array.isArray(raw.history) ? raw.history : [],
    createdAt,
    updatedAt: raw.updatedAt || createdAt,
    createdBy: cleanText(raw.createdBy),
    createdByRole: raw.createdByRole,
  };
}

function normalizeFinding(raw: Partial<QualityAuditFinding>, item?: QualityAuditItem): QualityAuditFinding {
  const severity = normalizeSeverity(raw.severity || item?.severityIfFail, item?.isCritical);
  return {
    id: raw.id || newId('audit-finding'),
    auditItemId: cleanText(raw.auditItemId) || item?.id || '',
    itemCode: cleanText(raw.itemCode) || item?.itemCode || '',
    question: cleanText(raw.question) || item?.question || '',
    findingType: cleanText(raw.findingType) || item?.findingTypeIfFail || 'Audit gap',
    severity,
    suggestedAction: cleanText(raw.suggestedAction) || item?.suggestedAction,
    evidenceMissing: Boolean(raw.evidenceMissing),
    repeatedCount: Math.max(1, Number(raw.repeatedCount || 1)),
    createdActionId: cleanText(raw.createdActionId),
    createdNcrId: cleanText(raw.createdNcrId),
    trainingPointCreated: Boolean(raw.trainingPointCreated),
  };
}

function normalizeAnswer(raw: Partial<QualityAuditAnswer>): QualityAuditAnswer {
  const result = ['pass', 'fail', 'na'].includes(raw.result || '') ? raw.result as QualityAuditResultValue : 'na';
  return {
    auditItemId: cleanText(raw.auditItemId),
    result,
    score: raw.score === undefined ? undefined : toNumber(raw.score),
    textValue: cleanText(raw.textValue),
    notes: cleanText(raw.notes),
    evidence: Array.isArray(raw.evidence) ? raw.evidence : [],
    finding: raw.finding ? normalizeFinding(raw.finding) : undefined,
  };
}

function normalizeRun(raw: Partial<QualityAuditRun>): QualityAuditRun {
  const startedAt = raw.startedAt || nowIso();
  const answers = Array.isArray(raw.answers) ? raw.answers.map(normalizeAnswer) : [];
  const findings = Array.isArray(raw.findings)
    ? raw.findings.map((finding) => normalizeFinding(finding))
    : answers.map((answer) => answer.finding).filter(Boolean) as QualityAuditFinding[];
  return {
    id: raw.id || newId('audit-run'),
    auditPlanId: cleanText(raw.auditPlanId),
    auditPlanVersion: Number(raw.auditPlanVersion || 1),
    auditType: normalizeAuditType(raw.auditType),
    productionLine: cleanText(raw.productionLine),
    inspectionPoint: cleanText(raw.inspectionPoint),
    relatedInspectionRunId: cleanText(raw.relatedInspectionRunId),
    auditor: cleanText(raw.auditor),
    startedAt,
    completedAt: cleanText(raw.completedAt),
    status: normalizeRunStatus(raw.status),
    answers,
    findings,
    auditScore: Math.max(0, Math.min(100, Math.round(toNumber(raw.auditScore)))),
    createdActionIds: Array.isArray(raw.createdActionIds) ? raw.createdActionIds.filter(Boolean) : [],
    createdNcrIds: Array.isArray(raw.createdNcrIds) ? raw.createdNcrIds.filter(Boolean) : [],
  };
}

function enqueueAuditPlan(operation: 'create-audit-plan' | 'update-audit-plan' | 'publish-audit-plan' | 'archive-audit-plan', plan: QualityAuditPlan, summary: string): void {
  enqueueQualitySyncItem({
    entityType: 'audit-plans',
    entityId: plan.id,
    operation,
    payloadSummary: summary,
  });
}

function enqueueAuditRun(operation: 'create-audit-run' | 'complete-audit-run', run: QualityAuditRun, summary: string): void {
  enqueueQualitySyncItem({
    entityType: 'audit-runs',
    entityId: run.id,
    operation,
    payloadSummary: summary,
  });
}

export function loadQualityAuditPlans(includeArchived = false): QualityAuditPlan[] {
  return readJsonArray<Partial<QualityAuditPlan>>(QUALITY_AUDIT_PLANS_KEY)
    .map(normalizeAuditPlan)
    .filter((plan) => includeArchived || plan.status !== 'archived')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function saveQualityAuditPlans(plans: QualityAuditPlan[]): void {
  writeJsonArray(QUALITY_AUDIT_PLANS_KEY, plans.map(normalizeAuditPlan));
}

export function loadQualityAuditRuns(): QualityAuditRun[] {
  return readJsonArray<Partial<QualityAuditRun>>(QUALITY_AUDIT_RUNS_KEY)
    .map(normalizeRun)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

export function saveQualityAuditRuns(runs: QualityAuditRun[]): void {
  writeJsonArray(QUALITY_AUDIT_RUNS_KEY, runs.map(normalizeRun));
}

export function currentAuditUser() {
  const role = loadLocalWorkflowRole();
  return buildLocalWorkflowUser(null, role);
}

export function canManageAuditPlans(role: QualityWorkflowRole): { allowed: boolean; reason: string } {
  return planManagerRoles.includes(role)
    ? { allowed: true, reason: 'Allowed to manage layered audit plans.' }
    : { allowed: false, reason: `${roleLabel(role)} cannot create, edit, publish, or archive audit plans.` };
}

export function canExecuteAudit(role: QualityWorkflowRole): { allowed: boolean; reason: string } {
  return executionRoles.includes(role)
    ? { allowed: true, reason: 'Allowed to execute layered audits.' }
    : { allowed: false, reason: `${roleLabel(role)} cannot execute layered or supervisor audits.` };
}

export function canViewAllAudits(role: QualityWorkflowRole): boolean {
  return viewAllRoles.includes(role);
}

export function createBlankAuditPlan(): QualityAuditPlan {
  const user = currentAuditUser();
  const createdAt = nowIso();
  return normalizeAuditPlan({
    id: newId('audit-plan'),
    auditName: 'New Layered Audit Plan',
    auditType: 'layered-audit',
    frequency: 'daily',
    ownerRole: 'QUALITY_SUPERVISOR',
    version: 1,
    status: 'draft',
    sections: [{ id: newId('audit-section'), title: 'General', order: 1 }],
    auditItems: [],
    createdAt,
    updatedAt: createdAt,
    createdBy: user.name,
    createdByRole: user.role,
  });
}

export function createBlankAuditItem(section = 'General', order = 1): QualityAuditItem {
  return normalizeAuditItem({
    id: newId('audit-item'),
    itemCode: `AUD-${String(order).padStart(3, '0')}`,
    question: `Audit question ${order}`,
    section,
    expectedCondition: '',
    inputType: 'pass-fail',
    weight: 1,
    isCritical: false,
    requiredEvidence: false,
    severityIfFail: 'major',
    findingTypeIfFail: 'Audit gap',
    suggestedAction: '',
    order,
  }, order - 1);
}

export function upsertQualityAuditPlan(plan: QualityAuditPlan, enqueue = true): QualityAuditPlan {
  const normalized = normalizeAuditPlan({ ...plan, updatedAt: nowIso() });
  const plans = loadQualityAuditPlans(true);
  const exists = plans.some((item) => item.id === normalized.id);
  saveQualityAuditPlans(exists ? plans.map((item) => (item.id === normalized.id ? normalized : item)) : [normalized, ...plans]);
  if (enqueue) {
    enqueueAuditPlan(exists ? 'update-audit-plan' : 'create-audit-plan', normalized, `${normalized.auditName} ${exists ? 'updated' : 'created'} locally.`);
  }
  return normalized;
}

export function duplicateQualityAuditPlan(id: string): QualityAuditPlan | null {
  const original = loadQualityAuditPlans(true).find((plan) => plan.id === id);
  if (!original) return null;
  return upsertQualityAuditPlan(normalizeAuditPlan({
    ...original,
    id: newId('audit-plan'),
    auditName: `${original.auditName} Copy`,
    version: 1,
    status: 'draft',
    history: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }));
}

export function publishQualityAuditPlan(id: string): QualityAuditPlan | null {
  const plans = loadQualityAuditPlans(true);
  const plan = plans.find((item) => item.id === id);
  if (!plan) return null;
  const published = normalizeAuditPlan({
    ...plan,
    status: 'active',
    version: plan.version + 1,
    history: [
      ...(plan.history || []),
      {
        version: plan.version,
        status: plan.status,
        sections: plan.sections,
        auditItems: plan.auditItems,
        createdAt: nowIso(),
        note: 'Snapshot before publish.',
      },
    ],
    updatedAt: nowIso(),
  });
  saveQualityAuditPlans(plans.map((item) => {
    if (item.id === id) return published;
    const sameScope = item.status === 'active'
      && sameText(item.productionLine, plan.productionLine)
      && sameText(item.inspectionPoint, plan.inspectionPoint)
      && sameText(item.auditType, plan.auditType);
    return sameScope ? normalizeAuditPlan({ ...item, status: 'archived', updatedAt: nowIso() }) : item;
  }));
  enqueueAuditPlan('publish-audit-plan', published, `${published.auditName} published as active version ${published.version}.`);
  return published;
}

export function archiveQualityAuditPlan(id: string): QualityAuditPlan | null {
  const plan = loadQualityAuditPlans(true).find((item) => item.id === id);
  if (!plan) return null;
  const archived = upsertQualityAuditPlan({ ...plan, status: 'archived' }, false);
  enqueueAuditPlan('archive-audit-plan', archived, `${archived.auditName} archived locally.`);
  return archived;
}

export function buildAuditRunFromPlan(
  plan: QualityAuditPlan,
  context: { productionLine?: string; inspectionPoint?: string; relatedInspectionRunId?: string },
  auditor?: string,
): QualityAuditRun {
  return normalizeRun({
    id: newId('audit-run'),
    auditPlanId: plan.id,
    auditPlanVersion: plan.version,
    auditType: plan.auditType,
    productionLine: context.productionLine || plan.productionLine,
    inspectionPoint: context.inspectionPoint || plan.inspectionPoint,
    relatedInspectionRunId: context.relatedInspectionRunId,
    auditor,
    startedAt: nowIso(),
    status: 'in-progress',
    answers: [],
    findings: [],
    auditScore: 0,
    createdActionIds: [],
    createdNcrIds: [],
  });
}

export function buildFindingFromAuditItem(item: QualityAuditItem, answer?: QualityAuditAnswer, repeatedCount = 1): QualityAuditFinding {
  return normalizeFinding({
    auditItemId: item.id,
    itemCode: item.itemCode,
    question: item.question,
    findingType: item.findingTypeIfFail || 'Audit gap',
    severity: item.severityIfFail || (item.isCritical ? 'critical' : 'major'),
    suggestedAction: item.suggestedAction,
    evidenceMissing: Boolean(item.requiredEvidence && !(answer?.evidence?.length)),
    repeatedCount,
  }, item);
}

export function scoreAuditRun(run: QualityAuditRun, plan?: QualityAuditPlan): number {
  if (!plan || plan.auditItems.length === 0) return 0;
  const answerMap = new Map(run.answers.map((answer) => [answer.auditItemId, answer]));
  let totalWeight = 0;
  let earned = 0;
  plan.auditItems.forEach((item) => {
    const weight = Math.max(1, item.weight || 1);
    totalWeight += weight;
    const answer = answerMap.get(item.id);
    if (!answer || answer.result === 'na') return;
    if (answer.result === 'pass') {
      earned += weight;
      return;
    }
    if (item.inputType === 'score') {
      earned += weight * Math.max(0, Math.min(100, Number(answer.score || 0))) / 100;
    }
  });
  return totalWeight ? Math.round((earned / totalWeight) * 100) : 0;
}

export function enrichAuditRun(run: QualityAuditRun, plan?: QualityAuditPlan, priorRuns = loadQualityAuditRuns()): QualityAuditRun {
  const itemMap = new Map((plan?.auditItems || []).map((item) => [item.id, item]));
  const priorFindingCounts = new Map<string, number>();
  priorRuns.forEach((prior) => {
    prior.findings.forEach((finding) => {
      const key = finding.itemCode || finding.auditItemId || finding.question;
      priorFindingCounts.set(key, (priorFindingCounts.get(key) || 0) + 1);
    });
  });
  const answers = run.answers.map((answer) => {
    const item = itemMap.get(answer.auditItemId);
    if (!item || answer.result !== 'fail') return { ...answer, finding: undefined };
    const key = item.itemCode || item.id;
    const finding = buildFindingFromAuditItem(item, answer, Math.max(1, priorFindingCounts.get(key) || 0));
    return { ...answer, finding };
  });
  const findings = answers.map((answer) => answer.finding).filter(Boolean) as QualityAuditFinding[];
  return normalizeRun({
    ...run,
    answers,
    findings,
    auditScore: scoreAuditRun({ ...run, answers }, plan),
  });
}

export function upsertQualityAuditRun(run: QualityAuditRun, enqueue = true): QualityAuditRun {
  const plan = loadQualityAuditPlans(true).find((item) => item.id === run.auditPlanId);
  const normalized = enrichAuditRun(run, plan);
  const runs = loadQualityAuditRuns();
  const exists = runs.some((item) => item.id === normalized.id);
  saveQualityAuditRuns(exists ? runs.map((item) => (item.id === normalized.id ? normalized : item)) : [normalized, ...runs]);
  if (enqueue) {
    enqueueAuditRun(exists && normalized.status !== 'completed' ? 'create-audit-run' : 'create-audit-run', normalized, `Layered audit run saved for ${normalized.productionLine || normalized.auditPlanId}.`);
  }
  return normalized;
}

export function completeQualityAuditRun(run: QualityAuditRun): QualityAuditRun {
  const plan = loadQualityAuditPlans(true).find((item) => item.id === run.auditPlanId);
  const enriched = enrichAuditRun({
    ...run,
    completedAt: nowIso(),
    status: run.answers.length >= (plan?.auditItems.length || 0) ? 'completed' : 'partially-completed',
  }, plan);
  const runs = loadQualityAuditRuns();
  saveQualityAuditRuns(runs.some((item) => item.id === enriched.id) ? runs.map((item) => (item.id === enriched.id ? enriched : item)) : [enriched, ...runs]);
  enqueueAuditRun('complete-audit-run', enriched, `Layered audit completed with score ${enriched.auditScore}% and ${enriched.findings.length} finding(s).`);
  return enriched;
}

export function updateAuditRunFinding(runId: string, findingId: string, patch: Partial<QualityAuditFinding>): QualityAuditRun | null {
  let updated: QualityAuditRun | null = null;
  const runs = loadQualityAuditRuns();
  const next = runs.map((run) => {
    if (run.id !== runId) return run;
    const findings = run.findings.map((finding) => (finding.id === findingId ? normalizeFinding({ ...finding, ...patch }) : finding));
    const answers = run.answers.map((answer) => (
      answer.finding?.id === findingId
        ? { ...answer, finding: normalizeFinding({ ...answer.finding, ...patch }) }
        : answer
    ));
    updated = normalizeRun({ ...run, findings, answers });
    return updated;
  });
  saveQualityAuditRuns(next);
  return updated;
}

export function addAuditRunActionLink(runId: string, findingId: string, actionId: string): QualityAuditRun | null {
  const run = updateAuditRunFinding(runId, findingId, { createdActionId: actionId });
  if (!run) return null;
  const runs = loadQualityAuditRuns().map((item) => (
    item.id === run.id ? normalizeRun({ ...run, createdActionIds: [...new Set([...(run.createdActionIds || []), actionId])] }) : item
  ));
  saveQualityAuditRuns(runs);
  enqueueQualitySyncItem({
    entityType: 'audit-runs',
    entityId: runId,
    operation: 'create-action-from-audit',
    payloadSummary: `Improvement action ${actionId} linked to audit finding ${findingId}.`,
  });
  return loadQualityAuditRuns().find((item) => item.id === runId) || null;
}

export function addAuditRunNcrLink(runId: string, findingId: string, ncrId: string): QualityAuditRun | null {
  const run = updateAuditRunFinding(runId, findingId, { createdNcrId: ncrId });
  if (!run) return null;
  const runs = loadQualityAuditRuns().map((item) => (
    item.id === run.id ? normalizeRun({ ...run, createdNcrIds: [...new Set([...(run.createdNcrIds || []), ncrId])] }) : item
  ));
  saveQualityAuditRuns(runs);
  enqueueQualitySyncItem({
    entityType: 'audit-runs',
    entityId: runId,
    operation: 'create-ncr-from-audit',
    payloadSummary: `NCR ${ncrId} linked to audit finding ${findingId}.`,
  });
  return loadQualityAuditRuns().find((item) => item.id === runId) || null;
}

export function markAuditFindingTrainingPoint(runId: string, findingId: string): QualityAuditRun | null {
  return updateAuditRunFinding(runId, findingId, { trainingPointCreated: true });
}

export function findMatchingAuditPlans(context: { productionLine?: string; inspectionPoint?: string; relatedInspectionPlanId?: string }): QualityAuditPlan[] {
  return loadQualityAuditPlans()
    .filter((plan) => plan.status === 'active')
    .map((plan) => {
      let score = 1;
      if (cleanText(plan.productionLine)) score += sameText(plan.productionLine, context.productionLine) ? 10 : -20;
      if (cleanText(plan.inspectionPoint)) score += sameText(plan.inspectionPoint, context.inspectionPoint) ? 10 : -10;
      if (cleanText(plan.relatedInspectionPlanId)) score += sameText(plan.relatedInspectionPlanId, context.relatedInspectionPlanId) ? 8 : -8;
      return { plan, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.plan.version - a.plan.version)
    .map(({ plan }) => plan);
}

export function buildLayeredAuditAnalytics(
  plans = loadQualityAuditPlans(true),
  runs = loadQualityAuditRuns(),
): QualityLayeredAuditAnalytics {
  const activePlans = plans.filter((plan) => plan.status === 'active');
  const completedRuns = runs.filter((run) => run.status === 'completed');
  const findings = runs.flatMap((run) => run.findings.map((finding) => ({ run, finding })));
  const todayCompletedKeys = new Set(runs.filter((run) => isToday(run.completedAt || run.startedAt)).map((run) => run.auditPlanId));
  const auditsDueToday = activePlans.filter((plan) => {
    const frequency = cleanText(plan.frequency).toLowerCase();
    if (!['daily', 'shift', 'today', 'per shift', 'per-shift'].some((token) => frequency.includes(token))) return false;
    return !todayCompletedKeys.has(plan.id);
  }).length;
  const repeatedMap = new Map<string, { count: number; severity: QualityAuditFindingSeverity; suggestedAction: string }>();
  findings.forEach(({ finding }) => {
    const key = finding.itemCode || finding.question || finding.auditItemId;
    const current = repeatedMap.get(key) || { count: 0, severity: finding.severity, suggestedAction: finding.suggestedAction || '' };
    repeatedMap.set(key, {
      count: current.count + 1,
      severity: current.severity === 'critical' || finding.severity === 'critical' ? 'critical' : current.severity,
      suggestedAction: current.suggestedAction || finding.suggestedAction || '',
    });
  });
  const lineMap = new Map<string, QualityAuditRun[]>();
  runs.forEach((run) => {
    const line = cleanText(run.productionLine) || 'Unassigned line';
    lineMap.set(line, [...(lineMap.get(line) || []), run]);
  });
  const lineCompliance = [...lineMap.entries()].map(([line, lineRuns]) => {
    const averageScore = lineRuns.length ? Math.round(lineRuns.reduce((sum, run) => sum + run.auditScore, 0) / lineRuns.length) : 0;
    return {
      line,
      runs: lineRuns.length,
      averageScore,
      criticalFindings: lineRuns.flatMap((run) => run.findings).filter((finding) => finding.severity === 'critical').length,
    };
  }).sort((a, b) => a.averageScore - b.averageScore || b.criticalFindings - a.criticalFindings);
  const actions = loadImprovementActions();
  const overdueAuditActions = actions.filter((action) => (
    action.sourceType === 'audit'
    && action.dueDate
    && !['effective', 'closed', 'cancelled'].includes(action.status)
    && new Date(action.dueDate).getTime() < Date.now()
  )).length;
  const repeatedFindings = [...repeatedMap.entries()]
    .filter(([, value]) => value.count > 1)
    .map(([key, value]) => ({ key, count: value.count, severity: value.severity, suggestedAction: value.suggestedAction }))
    .sort((a, b) => b.count - a.count);

  return {
    totalPlans: plans.length,
    activePlans: activePlans.length,
    totalRuns: runs.length,
    completedRuns: completedRuns.length,
    auditsDueToday,
    completionRate: runs.length ? Math.round((completedRuns.length / runs.length) * 100) : 0,
    averageAuditScore: runs.length ? Math.round(runs.reduce((sum, run) => sum + run.auditScore, 0) / runs.length) : 0,
    failedAuditItems: findings.length,
    criticalFindings: findings.filter(({ finding }) => finding.severity === 'critical').length,
    repeatFindings: repeatedFindings.reduce((sum, item) => sum + item.count, 0),
    actionsCreatedFromAudits: new Set(runs.flatMap((run) => run.createdActionIds)).size,
    overdueAuditActions,
    lowestComplianceLine: lineCompliance[0]?.line || 'No audit runs yet',
    lowestComplianceScore: lineCompliance[0]?.averageScore || 0,
    lineCompliance,
    repeatedFindings,
    recentRuns: runs.slice(0, 20),
  };
}

export function buildLayeredAuditCommandSummary(): QualityAuditCommandSummary {
  const analytics = buildLayeredAuditAnalytics();
  return {
    auditsDueToday: analytics.auditsDueToday,
    completedAudits: analytics.completedRuns,
    criticalFindings: analytics.criticalFindings,
    repeatAuditFindings: analytics.repeatFindings,
    auditActionsOverdue: analytics.overdueAuditActions,
    lowestComplianceLine: analytics.lowestComplianceLine,
  };
}
