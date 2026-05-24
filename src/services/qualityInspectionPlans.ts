import type { DefectLogData } from '@/api/unified-api';
import {
  buildLocalWorkflowUser,
  loadLocalWorkflowRole,
  roleLabel,
  type QualityWorkflowRole,
} from '@/services/defectWorkflowGovernance';
import { enqueueQualitySyncItem } from '@/services/qualitySyncQueue';

export const QUALITY_INSPECTION_PLANS_KEY = 'qms_quality_inspection_plans_v1';
export const QUALITY_INSPECTION_RUNS_KEY = 'qms_quality_inspection_runs_v1';

export type QualityInspectionPlanStatus = 'draft' | 'active' | 'archived';
export type QualityInspectionRunStatus = 'in-progress' | 'completed' | 'partially-completed';
export type QualityInspectionResultValue = 'pass' | 'fail' | 'na';
export type QualityInspectionMethod =
  | 'visual'
  | 'measurement'
  | 'functional'
  | 'barcode'
  | 'document'
  | 'leak-test'
  | 'performance-test';
export type QualityInspectionInputType =
  | 'pass-fail'
  | 'numeric'
  | 'text'
  | 'select'
  | 'photo-required'
  | 'checklist';

export interface QualityInspectionPlanSection {
  id: string;
  title: string;
  description?: string;
  order: number;
}

export interface QualityInspectionCheckItem {
  id: string;
  checkCode: string;
  checkName: string;
  description?: string;
  section: string;
  inspectionMethod: QualityInspectionMethod;
  standard?: string;
  acceptanceCriteria?: string;
  inputType: QualityInspectionInputType;
  lowerSpecLimit?: number;
  upperSpecLimit?: number;
  targetValue?: number;
  unit?: string;
  sampleSize?: number;
  frequency?: string;
  defectTypeIfNG?: string;
  severityIfNG?: string;
  recordTypeIfNG?: string;
  requiredEvidence?: boolean;
  relatedPartNumber?: string;
  relatedImage?: string;
  guidanceText?: string;
  order: number;
  isRequired: boolean;
}

export interface QualityInspectionPlanVersionSnapshot {
  version: number;
  status: QualityInspectionPlanStatus;
  sections: QualityInspectionPlanSection[];
  checkItems: QualityInspectionCheckItem[];
  createdAt: string;
  note: string;
}

export interface QualityInspectionPlan {
  id: string;
  planName: string;
  description?: string;
  factory?: string;
  workshop?: string;
  productionLine?: string;
  inspectionPoint?: string;
  product?: string;
  model?: string;
  partNumber?: string;
  customer?: string;
  supplier?: string;
  version: number;
  status: QualityInspectionPlanStatus;
  effectiveDate?: string;
  sections: QualityInspectionPlanSection[];
  checkItems: QualityInspectionCheckItem[];
  history?: QualityInspectionPlanVersionSnapshot[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  createdByRole?: QualityWorkflowRole;
}

export interface QualityInspectionEvidence {
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

export interface QualityInspectionCheckResult {
  checkItemId: string;
  result: QualityInspectionResultValue;
  measuredValue?: string | number;
  notes?: string;
  evidence?: QualityInspectionEvidence[];
  createdDefectId?: string;
}

export interface QualityInspectionRun {
  id: string;
  inspectionPlanId: string;
  inspectionPlanVersion: number;
  model?: string;
  productionLine?: string;
  inspectionPoint?: string;
  inspector?: string;
  startedAt: string;
  completedAt?: string;
  status: QualityInspectionRunStatus;
  checkResults: QualityInspectionCheckResult[];
  createdDefectIds: string[];
}

export interface QualityInspectionMatchContext {
  factory?: string;
  workshop?: string;
  productionLine?: string;
  inspectionPoint?: string;
  product?: string;
  model?: string;
  partNumber?: string;
  customer?: string;
  supplier?: string;
}

export interface QualityInspectionAnalytics {
  totalInspections: number;
  completedInspections: number;
  passRate: number;
  failedChecks: number;
  defectsCreatedFromChecks: number;
  planCompliance: number;
  incompleteInspections: number;
  topFailedCheckItems: Array<{ checkItemId: string; checkName: string; count: number }>;
}

export interface QualityExecutionOverview {
  totalRunsToday: number;
  completedRuns: number;
  inProgressRuns: number;
  partiallyCompletedRuns: number;
  failedChecks: number;
  defectsCreatedFromChecks: number;
  failedChecksWithoutDefect: number;
  planCompliance: number;
  evidenceMissingCount: number;
  overdueIncompleteRuns: number;
}

export interface QualityLineExecutionStatus {
  productionLine: string;
  activeInspectionPlans: number;
  totalRuns: number;
  completionPercent: number;
  failedChecks: number;
  defectsCreated: number;
  topFailedCheck: string;
  status: 'OK' | 'Attention' | 'Critical';
  reason: string;
}

export interface QualityFailedCheckFollowUp {
  id: string;
  run: QualityInspectionRun;
  plan?: QualityInspectionPlan;
  checkItem?: QualityInspectionCheckItem;
  result: QualityInspectionCheckResult;
  missingDefect: boolean;
  missingEvidence: boolean;
  requiredCheck: boolean;
  repeatedCount: number;
}

export interface QualityPlanComplianceRow {
  planId: string;
  planName: string;
  runs: number;
  requiredChecksCompletedPercent: number;
  runsCompletedAccordingToPlan: number;
  skippedRequiredChecks: number;
  naRate: number;
  evidenceCompliance: number;
}

export interface QualityHeatmapRow {
  dimension: string;
  value: string;
  count: number;
  percentage: number;
}

export interface QualityInspectorWorkload {
  inspector: string;
  completedRuns: number;
  openRuns: number;
  failedChecksFound: number;
  defectsCreated: number;
  averageCompletionRate: number;
}

export interface QualityExecutionBoardSummary {
  overview: QualityExecutionOverview;
  lineStatus: QualityLineExecutionStatus[];
  followUps: QualityFailedCheckFollowUp[];
  planComplianceRows: QualityPlanComplianceRow[];
  heatmap: QualityHeatmapRow[];
  inspectorWorkload: QualityInspectorWorkload[];
}

const managerRoles: QualityWorkflowRole[] = ['SYSTEM', 'ADMIN', 'QUALITY_MANAGER', 'QUALITY_SUPERVISOR', 'QUALITY_ENGINEER'];
const executorRoles: QualityWorkflowRole[] = ['SYSTEM', 'ADMIN', 'QUALITY_MANAGER', 'QUALITY_SUPERVISOR', 'QUALITY_ENGINEER', 'INSPECTOR'];

function nowIso(): string {
  return new Date().toISOString();
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cleanText(value: unknown): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function sameText(a: unknown, b: unknown): boolean {
  const left = cleanText(a).toLowerCase();
  const right = cleanText(b).toLowerCase();
  return Boolean(left && right && left === right);
}

function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

function localDateKey(value?: string): string {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isToday(value?: string): boolean {
  return localDateKey(value) === localDateKey();
}

function planById(plans: QualityInspectionPlan[]): Map<string, QualityInspectionPlan> {
  return new Map(plans.map((plan) => [plan.id, plan]));
}

function checkById(plans: QualityInspectionPlan[]): Map<string, QualityInspectionCheckItem> {
  return new Map(plans.flatMap((plan) => plan.checkItems.map((item) => [item.id, item] as const)));
}

function resultNeedsEvidence(item?: QualityInspectionCheckItem, result?: QualityInspectionCheckResult): boolean {
  if (!item || !result || result.result !== 'fail') return false;
  if (!item.requiredEvidence && item.inputType !== 'photo-required') return false;
  return !(result.evidence?.length);
}

function runRequiredCompletion(run: QualityInspectionRun, plan?: QualityInspectionPlan): { required: number; completed: number; skipped: number; completionPercent: number } {
  const requiredItems = plan?.checkItems.filter((item) => item.isRequired) || [];
  const required = requiredItems.length;
  const resultMap = new Map(run.checkResults.map((result) => [result.checkItemId, result]));
  const completed = requiredItems.filter((item) => {
    const result = resultMap.get(item.id);
    return Boolean(result && result.result !== 'na');
  }).length;
  const skipped = Math.max(0, required - completed);
  return {
    required,
    completed,
    skipped,
    completionPercent: required ? Math.round((completed / required) * 100) : 100,
  };
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

function normalizeSection(raw: Partial<QualityInspectionPlanSection>, index: number): QualityInspectionPlanSection {
  return {
    id: raw.id || newId('inspection-section'),
    title: cleanText(raw.title) || `Section ${index + 1}`,
    description: cleanText(raw.description),
    order: Number(raw.order || index + 1),
  };
}

function normalizeCheckItem(raw: Partial<QualityInspectionCheckItem>, index: number): QualityInspectionCheckItem {
  return {
    id: raw.id || newId('inspection-check'),
    checkCode: cleanText(raw.checkCode) || `CHK-${String(index + 1).padStart(3, '0')}`,
    checkName: cleanText(raw.checkName) || `Check ${index + 1}`,
    description: cleanText(raw.description),
    section: cleanText(raw.section) || 'General',
    inspectionMethod: raw.inspectionMethod || 'visual',
    standard: cleanText(raw.standard),
    acceptanceCriteria: cleanText(raw.acceptanceCriteria),
    inputType: raw.inputType || 'pass-fail',
    lowerSpecLimit: toNumber(raw.lowerSpecLimit),
    upperSpecLimit: toNumber(raw.upperSpecLimit),
    targetValue: toNumber(raw.targetValue),
    unit: cleanText(raw.unit),
    sampleSize: toNumber(raw.sampleSize),
    frequency: cleanText(raw.frequency),
    defectTypeIfNG: cleanText(raw.defectTypeIfNG),
    severityIfNG: cleanText(raw.severityIfNG) || 'major',
    recordTypeIfNG: cleanText(raw.recordTypeIfNG) || 'process-ppm',
    requiredEvidence: Boolean(raw.requiredEvidence),
    relatedPartNumber: cleanText(raw.relatedPartNumber),
    relatedImage: cleanText(raw.relatedImage),
    guidanceText: cleanText(raw.guidanceText),
    order: Number(raw.order || index + 1),
    isRequired: raw.isRequired !== false,
  };
}

export function normalizeInspectionPlan(raw: Partial<QualityInspectionPlan>): QualityInspectionPlan {
  const createdAt = raw.createdAt || nowIso();
  const sections = Array.isArray(raw.sections) && raw.sections.length
    ? raw.sections.map(normalizeSection)
    : [normalizeSection({ title: 'General', order: 1 }, 0)];
  const knownSections = new Set(sections.map((section) => section.title));
  const checkItems = Array.isArray(raw.checkItems)
    ? raw.checkItems.map(normalizeCheckItem)
    : [];
  checkItems.forEach((item) => {
    if (!knownSections.has(item.section)) {
      sections.push(normalizeSection({ title: item.section, order: sections.length + 1 }, sections.length));
      knownSections.add(item.section);
    }
  });
  return {
    id: raw.id || newId('inspection-plan'),
    planName: cleanText(raw.planName) || 'Untitled Inspection Plan',
    description: cleanText(raw.description),
    factory: cleanText(raw.factory),
    workshop: cleanText(raw.workshop),
    productionLine: cleanText(raw.productionLine),
    inspectionPoint: cleanText(raw.inspectionPoint),
    product: cleanText(raw.product),
    model: cleanText(raw.model),
    partNumber: cleanText(raw.partNumber),
    customer: cleanText(raw.customer),
    supplier: cleanText(raw.supplier),
    version: Number(raw.version || 1),
    status: raw.status || 'draft',
    effectiveDate: cleanText(raw.effectiveDate),
    sections: sections.sort((a, b) => a.order - b.order),
    checkItems: checkItems.sort((a, b) => a.order - b.order),
    history: Array.isArray(raw.history) ? raw.history : [],
    createdAt,
    updatedAt: raw.updatedAt || createdAt,
    createdBy: cleanText(raw.createdBy),
    createdByRole: raw.createdByRole,
  };
}

function normalizeRun(raw: Partial<QualityInspectionRun>): QualityInspectionRun {
  const startedAt = raw.startedAt || nowIso();
  return {
    id: raw.id || newId('inspection-run'),
    inspectionPlanId: cleanText(raw.inspectionPlanId),
    inspectionPlanVersion: Number(raw.inspectionPlanVersion || 1),
    model: cleanText(raw.model),
    productionLine: cleanText(raw.productionLine),
    inspectionPoint: cleanText(raw.inspectionPoint),
    inspector: cleanText(raw.inspector),
    startedAt,
    completedAt: cleanText(raw.completedAt),
    status: raw.status || 'in-progress',
    checkResults: Array.isArray(raw.checkResults) ? raw.checkResults.map((result) => ({
      checkItemId: cleanText(result.checkItemId),
      result: result.result || 'na',
      measuredValue: result.measuredValue,
      notes: cleanText(result.notes),
      evidence: Array.isArray(result.evidence) ? result.evidence : [],
      createdDefectId: cleanText(result.createdDefectId),
    })) : [],
    createdDefectIds: Array.isArray(raw.createdDefectIds) ? raw.createdDefectIds.filter(Boolean) : [],
  };
}

function enqueueInspection(operation: 'create-inspection-plan' | 'update-inspection-plan' | 'publish-inspection-plan' | 'archive-inspection-plan', plan: QualityInspectionPlan, summary: string): void {
  enqueueQualitySyncItem({
    entityType: 'inspection-plans',
    entityId: plan.id,
    operation,
    payloadSummary: summary,
  });
}

function enqueueRun(operation: 'create-inspection-run' | 'update-inspection-run', run: QualityInspectionRun, summary: string): void {
  enqueueQualitySyncItem({
    entityType: 'inspection-runs',
    entityId: run.id,
    operation,
    payloadSummary: summary,
  });
}

export function loadQualityInspectionPlans(includeArchived = false): QualityInspectionPlan[] {
  return readJsonArray<Partial<QualityInspectionPlan>>(QUALITY_INSPECTION_PLANS_KEY)
    .map(normalizeInspectionPlan)
    .filter((plan) => includeArchived || plan.status !== 'archived')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function saveQualityInspectionPlans(plans: QualityInspectionPlan[]): void {
  writeJsonArray(QUALITY_INSPECTION_PLANS_KEY, plans.map(normalizeInspectionPlan));
}

export function loadQualityInspectionRuns(): QualityInspectionRun[] {
  return readJsonArray<Partial<QualityInspectionRun>>(QUALITY_INSPECTION_RUNS_KEY)
    .map(normalizeRun)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

export function saveQualityInspectionRuns(runs: QualityInspectionRun[]): void {
  writeJsonArray(QUALITY_INSPECTION_RUNS_KEY, runs.map(normalizeRun));
}

export function currentInspectionUser() {
  const role = loadLocalWorkflowRole();
  return buildLocalWorkflowUser(null, role);
}

export function canManageInspectionPlans(role: QualityWorkflowRole): { allowed: boolean; reason: string } {
  return managerRoles.includes(role)
    ? { allowed: true, reason: 'Allowed to manage inspection plans.' }
    : { allowed: false, reason: `${roleLabel(role)} cannot create, edit, publish, or archive inspection plans.` };
}

export function canExecuteInspection(role: QualityWorkflowRole): { allowed: boolean; reason: string } {
  return executorRoles.includes(role)
    ? { allowed: true, reason: 'Allowed to execute inspection checks.' }
    : { allowed: false, reason: `${roleLabel(role)} cannot execute shopfloor inspection checks.` };
}

export function createBlankInspectionPlan(): QualityInspectionPlan {
  const user = currentInspectionUser();
  const createdAt = nowIso();
  return normalizeInspectionPlan({
    id: newId('inspection-plan'),
    planName: 'New Inspection Plan',
    description: '',
    version: 1,
    status: 'draft',
    sections: [{ id: newId('inspection-section'), title: 'General', order: 1 }],
    checkItems: [],
    createdAt,
    updatedAt: createdAt,
    createdBy: user.name,
    createdByRole: user.role,
  });
}

export function createBlankCheckItem(section = 'General', order = 1): QualityInspectionCheckItem {
  return normalizeCheckItem({
    id: newId('inspection-check'),
    checkCode: `CHK-${String(order).padStart(3, '0')}`,
    checkName: `Check ${order}`,
    section,
    order,
    inspectionMethod: 'visual',
    inputType: 'pass-fail',
    severityIfNG: 'major',
    recordTypeIfNG: 'process-ppm',
    isRequired: true,
  }, order - 1);
}

export function upsertQualityInspectionPlan(plan: QualityInspectionPlan, enqueue = true): QualityInspectionPlan {
  const normalized = normalizeInspectionPlan({ ...plan, updatedAt: nowIso() });
  const plans = loadQualityInspectionPlans(true);
  const exists = plans.some((item) => item.id === normalized.id);
  const next = exists
    ? plans.map((item) => (item.id === normalized.id ? normalized : item))
    : [normalized, ...plans];
  saveQualityInspectionPlans(next);
  if (enqueue) {
    enqueueInspection(exists ? 'update-inspection-plan' : 'create-inspection-plan', normalized, `${normalized.planName} ${exists ? 'updated' : 'created'} locally.`);
  }
  return normalized;
}

export function duplicateQualityInspectionPlan(id: string): QualityInspectionPlan | null {
  const original = loadQualityInspectionPlans(true).find((plan) => plan.id === id);
  if (!original) return null;
  const copy = normalizeInspectionPlan({
    ...original,
    id: newId('inspection-plan'),
    planName: `${original.planName} Copy`,
    version: 1,
    status: 'draft',
    history: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  return upsertQualityInspectionPlan(copy);
}

export function publishQualityInspectionPlan(id: string): QualityInspectionPlan | null {
  const plans = loadQualityInspectionPlans(true);
  const plan = plans.find((item) => item.id === id);
  if (!plan) return null;
  const scopeMatches = (candidate: QualityInspectionPlan) => (
    candidate.id !== id
    && candidate.status === 'active'
    && sameText(candidate.productionLine, plan.productionLine)
    && sameText(candidate.inspectionPoint, plan.inspectionPoint)
    && sameText(candidate.model, plan.model)
    && sameText(candidate.partNumber, plan.partNumber)
  );
  const published = normalizeInspectionPlan({
    ...plan,
    status: 'active',
    version: plan.version + 1,
    effectiveDate: plan.effectiveDate || new Date().toISOString().split('T')[0],
    history: [
      ...(plan.history || []),
      {
        version: plan.version,
        status: plan.status,
        sections: plan.sections,
        checkItems: plan.checkItems,
        createdAt: nowIso(),
        note: 'Snapshot before publish.',
      },
    ],
    updatedAt: nowIso(),
  });
  saveQualityInspectionPlans(plans.map((item) => {
    if (item.id === id) return published;
    if (scopeMatches(item)) return normalizeInspectionPlan({ ...item, status: 'archived', updatedAt: nowIso() });
    return item;
  }));
  enqueueInspection('publish-inspection-plan', published, `${published.planName} published as active version ${published.version}.`);
  return published;
}

export function archiveQualityInspectionPlan(id: string): QualityInspectionPlan | null {
  const plan = loadQualityInspectionPlans(true).find((item) => item.id === id);
  if (!plan) return null;
  const archived = upsertQualityInspectionPlan({ ...plan, status: 'archived' }, false);
  enqueueInspection('archive-inspection-plan', archived, `${archived.planName} archived locally.`);
  return archived;
}

export function rollbackQualityInspectionPlan(id: string, version: number): QualityInspectionPlan | null {
  const plan = loadQualityInspectionPlans(true).find((item) => item.id === id);
  const snapshot = plan?.history?.find((item) => item.version === version);
  if (!plan || !snapshot) return null;
  return upsertQualityInspectionPlan({
    ...plan,
    version: plan.version + 1,
    status: 'draft',
    sections: snapshot.sections,
    checkItems: snapshot.checkItems,
  });
}

export function importQualityInspectionPlan(input: unknown): QualityInspectionPlan {
  const rawInput = (input && typeof input === 'object' && 'plan' in input)
    ? (input as { plan: Partial<QualityInspectionPlan> }).plan
    : input as Partial<QualityInspectionPlan>;
  const raw = rawInput && typeof rawInput === 'object' ? rawInput : {};
  const imported = normalizeInspectionPlan({
    ...raw,
    id: raw.id || newId('inspection-plan'),
    status: raw.status || 'draft',
    updatedAt: nowIso(),
  });
  return upsertQualityInspectionPlan(imported);
}

export function exportQualityInspectionPlan(plan: QualityInspectionPlan): Record<string, unknown> {
  enqueueInspection('update-inspection-plan', plan, `${plan.planName} exported locally.`);
  return {
    exportType: 'quality-inspection-plan',
    exportedAt: nowIso(),
    storageKey: QUALITY_INSPECTION_PLANS_KEY,
    plan,
  };
}

function scorePlan(plan: QualityInspectionPlan, context: QualityInspectionMatchContext): number {
  let score = 0;
  const fields: Array<keyof QualityInspectionMatchContext> = ['factory', 'workshop', 'productionLine', 'inspectionPoint', 'product', 'model', 'partNumber', 'customer', 'supplier'];
  fields.forEach((field) => {
    const planValue = plan[field];
    const contextValue = context[field];
    if (!cleanText(planValue)) return;
    score += sameText(planValue, contextValue) ? 10 : -25;
  });
  if (!fields.some((field) => cleanText(plan[field]))) score += 1;
  return score;
}

export function findMatchingActiveInspectionPlan(context: QualityInspectionMatchContext): QualityInspectionPlan | null {
  const candidates = loadQualityInspectionPlans()
    .filter((plan) => plan.status === 'active')
    .map((plan) => ({ plan, score: scorePlan(plan, context) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.plan.version - a.plan.version);
  return candidates[0]?.plan || null;
}

export function upsertQualityInspectionRun(run: QualityInspectionRun, enqueue = true): QualityInspectionRun {
  const normalized = normalizeRun(run);
  const runs = loadQualityInspectionRuns();
  const exists = runs.some((item) => item.id === normalized.id);
  const next = exists ? runs.map((item) => (item.id === normalized.id ? normalized : item)) : [normalized, ...runs];
  saveQualityInspectionRuns(next);
  if (enqueue) {
    enqueueRun(exists ? 'update-inspection-run' : 'create-inspection-run', normalized, `Inspection run ${normalized.status} for plan ${normalized.inspectionPlanId}.`);
  }
  return normalized;
}

export function buildInspectionRunFromPlan(plan: QualityInspectionPlan, context: QualityInspectionMatchContext, inspector?: string): QualityInspectionRun {
  return normalizeRun({
    id: newId('inspection-run'),
    inspectionPlanId: plan.id,
    inspectionPlanVersion: plan.version,
    model: context.model || plan.model,
    productionLine: context.productionLine || plan.productionLine,
    inspectionPoint: context.inspectionPoint || plan.inspectionPoint,
    inspector,
    startedAt: nowIso(),
    status: 'in-progress',
    checkResults: [],
    createdDefectIds: [],
  });
}

export function evaluateNumericCheck(item: QualityInspectionCheckItem, measuredValue: unknown): QualityInspectionResultValue | null {
  if (item.inputType !== 'numeric') return null;
  const measured = toNumber(measuredValue);
  if (measured === undefined) return null;
  if (item.lowerSpecLimit !== undefined && measured < item.lowerSpecLimit) return 'fail';
  if (item.upperSpecLimit !== undefined && measured > item.upperSpecLimit) return 'fail';
  return 'pass';
}

export function buildInspectionAnalytics(runs = loadQualityInspectionRuns(), plans = loadQualityInspectionPlans(true)): QualityInspectionAnalytics {
  const totalResults = runs.flatMap((run) => run.checkResults);
  const completedRequired = runs.filter((run) => {
    const plan = plans.find((item) => item.id === run.inspectionPlanId);
    if (!plan) return false;
    const required = plan.checkItems.filter((item) => item.isRequired).length;
    const answered = run.checkResults.filter((result) => result.result !== 'na').length;
    return required > 0 && answered >= required;
  }).length;
  const failed = totalResults.filter((result) => result.result === 'fail');
  const failedCounts = new Map<string, number>();
  failed.forEach((result) => failedCounts.set(result.checkItemId, (failedCounts.get(result.checkItemId) || 0) + 1));
  const allItems = plans.flatMap((plan) => plan.checkItems);
  return {
    totalInspections: runs.length,
    completedInspections: runs.filter((run) => run.status === 'completed').length,
    passRate: totalResults.length ? Math.round((totalResults.filter((result) => result.result === 'pass').length / totalResults.length) * 100) : 0,
    failedChecks: failed.length,
    defectsCreatedFromChecks: new Set(runs.flatMap((run) => run.createdDefectIds)).size,
    planCompliance: runs.length ? Math.round((completedRequired / runs.length) * 100) : 0,
    incompleteInspections: runs.filter((run) => run.status !== 'completed').length,
    topFailedCheckItems: [...failedCounts.entries()]
      .map(([checkItemId, count]) => ({
        checkItemId,
        checkName: allItems.find((item) => item.id === checkItemId)?.checkName || checkItemId,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
  };
}

export function buildFailedCheckFollowUps(
  runs = loadQualityInspectionRuns(),
  plans = loadQualityInspectionPlans(true),
): QualityFailedCheckFollowUp[] {
  const plansMap = planById(plans);
  const checksMap = checkById(plans);
  const failedOccurrences = new Map<string, number>();
  runs.forEach((run) => {
    run.checkResults.filter((result) => result.result === 'fail').forEach((result) => {
      failedOccurrences.set(result.checkItemId, (failedOccurrences.get(result.checkItemId) || 0) + 1);
    });
  });
  return runs.flatMap((run) => run.checkResults
    .filter((result) => result.result === 'fail')
    .map((result) => {
      const plan = plansMap.get(run.inspectionPlanId);
      const checkItem = checksMap.get(result.checkItemId);
      return {
        id: `${run.id}-${result.checkItemId}`,
        run,
        plan,
        checkItem,
        result,
        missingDefect: !result.createdDefectId,
        missingEvidence: resultNeedsEvidence(checkItem, result),
        requiredCheck: checkItem?.isRequired !== false,
        repeatedCount: failedOccurrences.get(result.checkItemId) || 1,
      };
    }))
    .sort((a, b) => Number(b.missingDefect) - Number(a.missingDefect)
      || Number(b.missingEvidence) - Number(a.missingEvidence)
      || b.repeatedCount - a.repeatedCount);
}

export function buildQualityExecutionBoardSummary(input?: {
  plans?: QualityInspectionPlan[];
  runs?: QualityInspectionRun[];
  defects?: DefectLogData[];
  currentUserName?: string;
  currentRole?: QualityWorkflowRole;
}): QualityExecutionBoardSummary {
  const plans = input?.plans || loadQualityInspectionPlans(true);
  const activePlans = plans.filter((plan) => plan.status === 'active');
  const allRuns = input?.runs || loadQualityInspectionRuns();
  const canViewAll = !input?.currentRole || ['SYSTEM', 'ADMIN', 'PLANT_MANAGER', 'QUALITY_MANAGER', 'QUALITY_SUPERVISOR', 'QUALITY_ENGINEER'].includes(input.currentRole);
  const runs = canViewAll
    ? allRuns
    : allRuns.filter((run) => !input?.currentUserName || cleanText(run.inspector).toLowerCase().includes(cleanText(input.currentUserName).toLowerCase()));
  const plansMap = planById(plans);
  const checksMap = checkById(plans);
  const todayRuns = runs.filter((run) => isToday(run.startedAt));
  const failedResults = runs.flatMap((run) => run.checkResults.map((result) => ({ run, result }))).filter(({ result }) => result.result === 'fail');
  const evidenceMissingCount = failedResults.filter(({ result }) => resultNeedsEvidence(checksMap.get(result.checkItemId), result)).length;
  const overdueIncompleteRuns = runs.filter((run) => {
    if (run.status === 'completed') return false;
    const started = new Date(run.startedAt).getTime();
    if (Number.isNaN(started)) return false;
    return Date.now() - started > 8 * 60 * 60 * 1000;
  }).length;
  const requiredCompletions = runs.map((run) => runRequiredCompletion(run, plansMap.get(run.inspectionPlanId)));
  const planCompliance = requiredCompletions.length
    ? Math.round(requiredCompletions.reduce((sum, item) => sum + item.completionPercent, 0) / requiredCompletions.length)
    : 0;
  const followUps = buildFailedCheckFollowUps(runs, plans);

  const lineMap = new Map<string, QualityInspectionRun[]>();
  runs.forEach((run) => {
    const line = cleanText(run.productionLine) || plansMap.get(run.inspectionPlanId)?.productionLine || 'Unassigned line';
    lineMap.set(line, [...(lineMap.get(line) || []), run]);
  });
  activePlans.forEach((plan) => {
    const line = cleanText(plan.productionLine) || 'Unassigned line';
    if (!lineMap.has(line)) lineMap.set(line, []);
  });
  const lineStatus = [...lineMap.entries()].map(([line, lineRuns]) => {
    const lineFailed = lineRuns.flatMap((run) => run.checkResults).filter((result) => result.result === 'fail');
    const lineDefects = new Set(lineRuns.flatMap((run) => run.createdDefectIds || [])).size;
    const lineCompletions = lineRuns.map((run) => runRequiredCompletion(run, plansMap.get(run.inspectionPlanId)));
    const completionPercent = lineCompletions.length
      ? Math.round(lineCompletions.reduce((sum, item) => sum + item.completionPercent, 0) / lineCompletions.length)
      : 0;
    const failedNoDefect = lineFailed.filter((result) => !result.createdDefectId).length;
    const missingEvidence = lineFailed.filter((result) => resultNeedsEvidence(checksMap.get(result.checkItemId), result)).length;
    const checkCounts = new Map<string, number>();
    lineFailed.forEach((result) => {
      const name = checksMap.get(result.checkItemId)?.checkName || result.checkItemId;
      checkCounts.set(name, (checkCounts.get(name) || 0) + 1);
    });
    const topFailedCheck = [...checkCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'No failed checks';
    const status: QualityLineExecutionStatus['status'] = missingEvidence > 0 || failedNoDefect >= 3 || lineFailed.length >= 8
      ? 'Critical'
      : completionPercent < 80 || failedNoDefect > 0 || lineFailed.length >= 3
        ? 'Attention'
        : 'OK';
    const reason = status === 'Critical'
      ? 'High failed-check follow-up, missing evidence, or unrecorded defects require verification.'
      : status === 'Attention'
        ? 'Incomplete checks or repeated failed checks should be reviewed.'
        : 'Current inspection execution signal is controlled.';
    return {
      productionLine: line,
      activeInspectionPlans: activePlans.filter((plan) => cleanText(plan.productionLine) === line || (!cleanText(plan.productionLine) && line === 'Unassigned line')).length,
      totalRuns: lineRuns.length,
      completionPercent,
      failedChecks: lineFailed.length,
      defectsCreated: lineDefects,
      topFailedCheck,
      status,
      reason,
    };
  }).sort((a, b) => {
    const weight = { Critical: 3, Attention: 2, OK: 1 };
    return weight[b.status] - weight[a.status] || b.failedChecks - a.failedChecks;
  });

  const planComplianceRows = plans.filter((plan) => plan.status !== 'archived').map((plan) => {
    const planRuns = runs.filter((run) => run.inspectionPlanId === plan.id);
    const completions = planRuns.map((run) => runRequiredCompletion(run, plan));
    const requiredChecks = plan.checkItems.filter((item) => item.isRequired);
    const allResults = planRuns.flatMap((run) => run.checkResults);
    const evidenceRequiredFailures = allResults.filter((result) => result.result === 'fail' && resultNeedsEvidence(checksMap.get(result.checkItemId), result));
    const failuresRequiringEvidence = allResults.filter((result) => {
      const item = checksMap.get(result.checkItemId);
      return result.result === 'fail' && Boolean(item?.requiredEvidence || item?.inputType === 'photo-required');
    });
    return {
      planId: plan.id,
      planName: plan.planName,
      runs: planRuns.length,
      requiredChecksCompletedPercent: completions.length
        ? Math.round(completions.reduce((sum, item) => sum + item.completionPercent, 0) / completions.length)
        : 0,
      runsCompletedAccordingToPlan: completions.filter((item) => item.required === 0 || item.skipped === 0).length,
      skippedRequiredChecks: completions.reduce((sum, item) => sum + item.skipped, 0),
      naRate: allResults.length ? Math.round((allResults.filter((result) => result.result === 'na').length / allResults.length) * 100) : 0,
      evidenceCompliance: failuresRequiringEvidence.length
        ? Math.round(((failuresRequiringEvidence.length - evidenceRequiredFailures.length) / failuresRequiringEvidence.length) * 100)
        : 100,
      requiredChecksCompletedCount: requiredChecks.length,
    };
  }).sort((a, b) => a.requiredChecksCompletedPercent - b.requiredChecksCompletedPercent || b.skippedRequiredChecks - a.skippedRequiredChecks);

  const heatGroups: Array<[string, (entry: { run: QualityInspectionRun; result: QualityInspectionCheckResult }) => string]> = [
    ['productionLine', ({ run }) => cleanText(run.productionLine) || 'Unassigned line'],
    ['inspectionPoint', ({ run }) => cleanText(run.inspectionPoint) || plansMap.get(run.inspectionPlanId)?.inspectionPoint || 'Unassigned point'],
    ['checkItem', ({ result }) => checksMap.get(result.checkItemId)?.checkName || result.checkItemId],
    ['model', ({ run }) => cleanText(run.model) || 'Unassigned model'],
  ];
  const heatmap = heatGroups.flatMap(([dimension, getValue]) => {
    const groups = new Map<string, number>();
    failedResults.forEach((entry) => {
      const value = getValue(entry);
      groups.set(value, (groups.get(value) || 0) + 1);
    });
    return [...groups.entries()].map(([value, count]) => ({
      dimension,
      value,
      count,
      percentage: failedResults.length ? Math.round((count / failedResults.length) * 100) : 0,
    }));
  }).sort((a, b) => b.count - a.count).slice(0, 16);

  const inspectorMap = new Map<string, QualityInspectionRun[]>();
  runs.forEach((run) => {
    const inspector = cleanText(run.inspector) || 'Unassigned inspector';
    inspectorMap.set(inspector, [...(inspectorMap.get(inspector) || []), run]);
  });
  const inspectorWorkload = [...inspectorMap.entries()].map(([inspector, inspectorRuns]) => {
    const completions = inspectorRuns.map((run) => runRequiredCompletion(run, plansMap.get(run.inspectionPlanId)));
    return {
      inspector,
      completedRuns: inspectorRuns.filter((run) => run.status === 'completed').length,
      openRuns: inspectorRuns.filter((run) => run.status !== 'completed').length,
      failedChecksFound: inspectorRuns.flatMap((run) => run.checkResults).filter((result) => result.result === 'fail').length,
      defectsCreated: new Set(inspectorRuns.flatMap((run) => run.createdDefectIds)).size,
      averageCompletionRate: completions.length
        ? Math.round(completions.reduce((sum, item) => sum + item.completionPercent, 0) / completions.length)
        : 0,
    };
  }).sort((a, b) => b.openRuns - a.openRuns || b.failedChecksFound - a.failedChecksFound);

  return {
    overview: {
      totalRunsToday: todayRuns.length,
      completedRuns: todayRuns.filter((run) => run.status === 'completed').length,
      inProgressRuns: todayRuns.filter((run) => run.status === 'in-progress').length,
      partiallyCompletedRuns: todayRuns.filter((run) => run.status === 'partially-completed').length,
      failedChecks: todayRuns.flatMap((run) => run.checkResults).filter((result) => result.result === 'fail').length,
      defectsCreatedFromChecks: new Set(todayRuns.flatMap((run) => run.createdDefectIds)).size,
      failedChecksWithoutDefect: todayRuns.flatMap((run) => run.checkResults).filter((result) => result.result === 'fail' && !result.createdDefectId).length,
      planCompliance,
      evidenceMissingCount,
      overdueIncompleteRuns,
    },
    lineStatus,
    followUps,
    planComplianceRows,
    heatmap,
    inspectorWorkload,
  };
}

export function enqueueExecutionBoardExport(summary: string): void {
  enqueueQualitySyncItem({
    entityType: 'inspection-runs',
    entityId: 'quality-execution-board',
    operation: 'execution-board-export',
    payloadSummary: summary,
  });
}
