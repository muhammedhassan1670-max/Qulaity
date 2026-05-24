import type { CapaData, DefectLogData, EightDData, NcrData } from '@/api/unified-api';
import {
  buildLocalWorkflowUser,
  loadLocalWorkflowRole,
  type QualityWorkflowRole,
} from '@/services/defectWorkflowGovernance';
import {
  calculateActionEffectiveness,
  type ImprovementConfidenceLabel,
  type QualityImprovementAction,
} from '@/services/qualityImprovementActions';
import { enqueueQualitySyncItem } from '@/services/qualitySyncQueue';

export const QUALITY_KNOWLEDGE_BASE_KEY = 'qms_quality_knowledge_base_v1';

export type QualityKnowledgeType =
  | 'lesson-learned'
  | 'known-issue'
  | 'best-practice'
  | 'standard-action'
  | 'inspection-alert'
  | 'training-point';

export type QualityKnowledgeStatus = 'draft' | 'active' | 'archived';
export type QualityKnowledgeSourceType = 'defect' | 'ncr' | 'capa' | 'eightD' | 'improvement-action' | 'manual' | 'intelligence' | 'management-report';
export type QualityKnowledgeFeedback = 'useful' | 'not-useful' | 'needs-update';
export type KnowledgeMatchConfidence = 'Strong Signal' | 'Moderate Signal' | 'Weak Signal' | 'Insufficient Data';

export interface QualityKnowledgeItem {
  id: string;
  title: string;
  type: QualityKnowledgeType;
  status: QualityKnowledgeStatus;
  sourceType: QualityKnowledgeSourceType;
  sourceId?: string;
  relatedDefectIds: string[];
  relatedNcrIds: string[];
  relatedCapaIds: string[];
  relatedEightDIds: string[];
  relatedActionIds: string[];
  defectType?: string;
  defectCategory?: string;
  productionLine?: string;
  model?: string;
  partNumber?: string;
  supplier?: string;
  customer?: string;
  severity?: string;
  problemSummary: string;
  historicalPattern?: string;
  effectiveActions?: string;
  ineffectiveActions?: string;
  verificationResult?: string;
  beforeMetric?: number;
  afterMetric?: number;
  improvementPercent?: number | null;
  confidenceLabel?: ImprovementConfidenceLabel | KnowledgeMatchConfidence;
  recommendedContainment?: string;
  recommendedVerification?: string;
  recommendedCorrectiveAction?: string;
  recommendedPreventiveAction?: string;
  inspectionStandardUpdate?: string;
  trainingNeed?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByRole: QualityWorkflowRole;
  timesSuggested?: number;
  timesApplied?: number;
  timesConvertedToAction?: number;
  feedbackScore?: number;
  feedback?: Array<{
    id: string;
    value: QualityKnowledgeFeedback;
    note?: string;
    createdAt: string;
    createdBy: string;
    createdByRole: QualityWorkflowRole;
  }>;
}

export interface QualityKnowledgeContext {
  sourceType?: QualityKnowledgeSourceType;
  sourceId?: string;
  defectType?: string;
  defectCategory?: string;
  productionLine?: string;
  model?: string;
  partNumber?: string;
  supplier?: string;
  customer?: string;
  severity?: string;
  recordType?: string;
  tags?: string[];
  title?: string;
  description?: string;
}

export interface QualityKnowledgeSuggestion {
  item: QualityKnowledgeItem;
  score: number;
  confidence: KnowledgeMatchConfidence;
  matchReasons: string[];
  suggestedFocus: string;
  relatedEffectiveAction?: string;
}

export interface StandardActionLibraryEntry {
  key: string;
  defectTypeOrCategory: string;
  recommendedContainment: string;
  recommendedVerification: string;
  recommendedCorrectiveAction: string;
  recommendedPreventiveAction: string;
  dataFollowUp: string;
  inspectionUpdate: string;
  trainingRecommendation: string;
  sourceKnowledgeIds: string[];
}

export interface QualityKnowledgeCommandSummary {
  activeLessons: number;
  newLessonsThisMonth: number;
  topRepeatedKnownIssues: Array<{ label: string; count: number }>;
  lessonsLinkedToEffectiveActions: number;
  trainingPoints: number;
  standardActionsAvailable: number;
  knowledgeGaps: Array<{ label: string; repeatedCount: number; suggestedAction: string }>;
}

function nowIso(): string {
  return new Date().toISOString();
}

function currentUser() {
  return buildLocalWorkflowUser(null, loadLocalWorkflowRole());
}

function normalize(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function text(value: unknown): string {
  return String(value ?? '').trim();
}

function compactText(values: unknown[]): string {
  return values.map(text).filter(Boolean).join(' | ');
}

function readRows(): QualityKnowledgeItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(QUALITY_KNOWLEDGE_BASE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.map(migrateKnowledgeItem).filter(Boolean) as QualityKnowledgeItem[] : [];
  } catch {
    return [];
  }
}

function writeRows(rows: QualityKnowledgeItem[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(QUALITY_KNOWLEDGE_BASE_KEY, JSON.stringify(rows));
}

function migrateKnowledgeItem(raw: unknown): QualityKnowledgeItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Partial<QualityKnowledgeItem>;
  const user = currentUser();
  return {
    id: row.id || `kb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: row.title || 'Untitled knowledge item',
    type: row.type || 'lesson-learned',
    status: row.status || 'draft',
    sourceType: row.sourceType || 'manual',
    sourceId: row.sourceId,
    relatedDefectIds: Array.isArray(row.relatedDefectIds) ? row.relatedDefectIds.map(String) : [],
    relatedNcrIds: Array.isArray(row.relatedNcrIds) ? row.relatedNcrIds.map(String) : [],
    relatedCapaIds: Array.isArray(row.relatedCapaIds) ? row.relatedCapaIds.map(String) : [],
    relatedEightDIds: Array.isArray(row.relatedEightDIds) ? row.relatedEightDIds.map(String) : [],
    relatedActionIds: Array.isArray(row.relatedActionIds) ? row.relatedActionIds.map(String) : [],
    defectType: row.defectType,
    defectCategory: row.defectCategory,
    productionLine: row.productionLine,
    model: row.model,
    partNumber: row.partNumber,
    supplier: row.supplier,
    customer: row.customer,
    severity: row.severity,
    problemSummary: row.problemSummary || '',
    historicalPattern: row.historicalPattern,
    effectiveActions: row.effectiveActions,
    ineffectiveActions: row.ineffectiveActions,
    verificationResult: row.verificationResult,
    beforeMetric: row.beforeMetric,
    afterMetric: row.afterMetric,
    improvementPercent: row.improvementPercent,
    confidenceLabel: row.confidenceLabel || 'Insufficient Data',
    recommendedContainment: row.recommendedContainment,
    recommendedVerification: row.recommendedVerification,
    recommendedCorrectiveAction: row.recommendedCorrectiveAction,
    recommendedPreventiveAction: row.recommendedPreventiveAction,
    inspectionStandardUpdate: row.inspectionStandardUpdate,
    trainingNeed: row.trainingNeed,
    tags: Array.isArray(row.tags) ? row.tags.map(String).filter(Boolean) : [],
    createdAt: row.createdAt || nowIso(),
    updatedAt: row.updatedAt || nowIso(),
    createdBy: row.createdBy || user.name,
    createdByRole: row.createdByRole || user.role,
    timesSuggested: Number(row.timesSuggested || 0),
    timesApplied: Number(row.timesApplied || 0),
    timesConvertedToAction: Number(row.timesConvertedToAction || 0),
    feedbackScore: Number(row.feedbackScore || 0),
    feedback: Array.isArray(row.feedback) ? row.feedback : [],
  };
}

function enqueueKnowledge(operation: 'create-knowledge' | 'update-knowledge' | 'archive-knowledge' | 'apply-knowledge' | 'feedback-knowledge', item: QualityKnowledgeItem, extra?: string): void {
  enqueueQualitySyncItem({
    entityType: 'knowledge-base',
    entityId: item.id,
    operation,
    payloadSummary: `${operation}: ${item.title}${extra ? ` | ${extra}` : ''}`,
  });
}

export function loadQualityKnowledgeBase(includeArchived = false): QualityKnowledgeItem[] {
  return readRows()
    .filter((item) => includeArchived || item.status !== 'archived')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function saveQualityKnowledgeBase(items: QualityKnowledgeItem[]): void {
  writeRows(items);
}

export function createQualityKnowledgeItem(input: Partial<QualityKnowledgeItem>): QualityKnowledgeItem {
  const user = currentUser();
  const item: QualityKnowledgeItem = {
    id: input.id || `kb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title || 'New lesson learned',
    type: input.type || 'lesson-learned',
    status: input.status || 'draft',
    sourceType: input.sourceType || 'manual',
    sourceId: input.sourceId,
    relatedDefectIds: input.relatedDefectIds || [],
    relatedNcrIds: input.relatedNcrIds || [],
    relatedCapaIds: input.relatedCapaIds || [],
    relatedEightDIds: input.relatedEightDIds || [],
    relatedActionIds: input.relatedActionIds || [],
    defectType: input.defectType,
    defectCategory: input.defectCategory,
    productionLine: input.productionLine,
    model: input.model,
    partNumber: input.partNumber,
    supplier: input.supplier,
    customer: input.customer,
    severity: input.severity,
    problemSummary: input.problemSummary || '',
    historicalPattern: input.historicalPattern,
    effectiveActions: input.effectiveActions,
    ineffectiveActions: input.ineffectiveActions,
    verificationResult: input.verificationResult,
    beforeMetric: input.beforeMetric,
    afterMetric: input.afterMetric,
    improvementPercent: input.improvementPercent,
    confidenceLabel: input.confidenceLabel || 'Insufficient Data',
    recommendedContainment: input.recommendedContainment,
    recommendedVerification: input.recommendedVerification,
    recommendedCorrectiveAction: input.recommendedCorrectiveAction,
    recommendedPreventiveAction: input.recommendedPreventiveAction,
    inspectionStandardUpdate: input.inspectionStandardUpdate,
    trainingNeed: input.trainingNeed,
    tags: input.tags || [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    createdBy: user.name,
    createdByRole: user.role,
    timesSuggested: 0,
    timesApplied: 0,
    timesConvertedToAction: 0,
    feedbackScore: 0,
    feedback: [],
  };
  writeRows([item, ...readRows()]);
  enqueueKnowledge('create-knowledge', item);
  return item;
}

export function updateQualityKnowledgeItem(id: string, patch: Partial<QualityKnowledgeItem>): QualityKnowledgeItem | null {
  let updated: QualityKnowledgeItem | null = null;
  const rows = readRows().map((item) => {
    if (item.id !== id) return item;
    updated = { ...item, ...patch, id: item.id, updatedAt: nowIso() };
    return updated;
  });
  writeRows(rows);
  if (updated) enqueueKnowledge('update-knowledge', updated);
  return updated;
}

export function archiveQualityKnowledgeItem(id: string): QualityKnowledgeItem | null {
  const item = updateQualityKnowledgeItem(id, { status: 'archived' });
  if (item) enqueueKnowledge('archive-knowledge', item);
  return item;
}

export function applyQualityKnowledgeItem(id: string, convertedToAction = false): QualityKnowledgeItem | null {
  const current = readRows().find((item) => item.id === id);
  if (!current) return null;
  const item = updateQualityKnowledgeItem(id, {
    timesApplied: Number(current.timesApplied || 0) + 1,
    timesConvertedToAction: Number(current.timesConvertedToAction || 0) + (convertedToAction ? 1 : 0),
  });
  if (item) enqueueKnowledge('apply-knowledge', item, convertedToAction ? 'converted to action' : 'used as reference');
  return item;
}

export function markKnowledgeSuggested(ids: string[]): void {
  if (ids.length === 0) return;
  const wanted = new Set(ids);
  writeRows(readRows().map((item) => (
    wanted.has(item.id)
      ? { ...item, timesSuggested: Number(item.timesSuggested || 0) + 1, updatedAt: nowIso() }
      : item
  )));
}

export function recordQualityKnowledgeFeedback(id: string, value: QualityKnowledgeFeedback, note?: string): QualityKnowledgeItem | null {
  const user = currentUser();
  const current = readRows().find((item) => item.id === id);
  if (!current) return null;
  const delta = value === 'useful' ? 1 : value === 'not-useful' ? -1 : 0;
  const item = updateQualityKnowledgeItem(id, {
    feedbackScore: Number(current.feedbackScore || 0) + delta,
    feedback: [
      ...(current.feedback || []),
      {
        id: `kbf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        value,
        note,
        createdAt: nowIso(),
        createdBy: user.name,
        createdByRole: user.role,
      },
    ],
  });
  if (item) enqueueKnowledge('feedback-knowledge', item, value);
  return item;
}

export function blockedQualityKnowledgeAudit(action: string, reason: string, itemId = 'knowledge-action'): void {
  const user = currentUser();
  enqueueQualitySyncItem({
    entityType: 'knowledge-base',
    entityId: itemId,
    operation: 'update-knowledge',
    status: 'failed',
    lastError: reason,
    payloadSummary: `Blocked knowledge action "${action}" by ${user.role}: ${reason}`,
  });
}

export function buildKnowledgeContextFromDefect(record: DefectLogData): QualityKnowledgeContext {
  return {
    sourceType: 'defect',
    sourceId: record.id,
    defectType: record.defectType,
    defectCategory: record.defectCategory || record.defectCategoryAtTime,
    productionLine: record.productionLine,
    model: record.model,
    partNumber: record.partNumber || record.partId,
    supplier: record.supplierNameAtTime || record.supplierName,
    customer: record.customerName,
    severity: record.severity,
    recordType: record.recordType,
    title: record.defectType,
    description: record.description,
    tags: [record.recordType, record.shift, record.defaultInspectionPoint].filter(Boolean) as string[],
  };
}

export function buildKnowledgeContextFromSource(sourceType: QualityKnowledgeSourceType, source: NcrData | CapaData | EightDData | QualityImprovementAction): QualityKnowledgeContext {
  if (sourceType === 'improvement-action') {
    const action = source as QualityImprovementAction;
    return {
      sourceType,
      sourceId: action.id,
      defectType: action.linkedDefectType,
      productionLine: action.linkedProductionLine,
      model: action.linkedModel,
      partNumber: action.linkedPartNumber,
      supplier: action.linkedSupplier,
      customer: action.linkedCustomer,
      severity: action.priority,
      recordType: action.linkedRecordType,
      title: action.title,
      description: action.description,
      tags: [action.actionType, action.sourceType, action.status].filter(Boolean),
    };
  }
  const record = source as NcrData | CapaData | EightDData;
  const metadata = record.metadata && typeof record.metadata === 'object' ? record.metadata as Record<string, unknown> : {};
  return {
    sourceType,
    sourceId: String(record.id || ''),
    defectType: text(metadata.defectType),
    defectCategory: text(metadata.defectCategory),
    productionLine: text(metadata.productionLine),
    model: text(metadata.model),
    partNumber: text(metadata.partNumber),
    supplier: text(metadata.supplierName || metadata.supplier),
    customer: text(metadata.customerName || metadata.customer),
    severity: text((record as NcrData | CapaData).priority || metadata.severity),
    title: text((record as NcrData).title || (record as CapaData).title || (record as EightDData).subject),
    description: text(record.description || (record as CapaData).problemStatement || (record as CapaData).rootCause),
    tags: [sourceType, text(record.status)].filter(Boolean),
  };
}

export function prefillKnowledgeFromDefect(record: DefectLogData): Partial<QualityKnowledgeItem> {
  return {
    title: `${record.defectType || 'Defect'} lesson learned`,
    type: 'lesson-learned',
    status: normalize(record.status) === 'closed' ? 'active' : 'draft',
    sourceType: 'defect',
    sourceId: record.id,
    relatedDefectIds: record.id ? [record.id] : [],
    relatedNcrIds: [record.relatedNcrId, ...(record.relatedNcrIds || [])].filter(Boolean) as string[],
    relatedCapaIds: [record.relatedCapaId, ...(record.relatedCapaIds || [])].filter(Boolean) as string[],
    relatedEightDIds: [record.relatedEightDId, ...(record.relatedEightDIds || [])].filter(Boolean) as string[],
    relatedActionIds: record.relatedActionIds || [],
    defectType: record.defectType,
    defectCategory: record.defectCategory || record.defectCategoryAtTime,
    productionLine: record.productionLine,
    model: record.model,
    partNumber: record.partNumber || record.partId,
    supplier: record.supplierNameAtTime || record.supplierName,
    customer: record.customerName,
    severity: record.severity,
    problemSummary: record.description || record.defectType || '',
    historicalPattern: compactText([record.recordType, record.productionLine, record.model, record.partNumber]),
    effectiveActions: compactText([record.actionTaken, record.correctiveAction, record.preventiveAction]),
    verificationResult: record.verificationResult,
    recommendedContainment: record.containmentAction || record.suggestedContainment,
    recommendedCorrectiveAction: record.correctiveAction,
    recommendedPreventiveAction: record.preventiveAction,
    tags: [record.recordType, record.defectType, record.productionLine, record.model].filter(Boolean) as string[],
  };
}

export function prefillKnowledgeFromAction(action: QualityImprovementAction, defects: DefectLogData[] = []): Partial<QualityKnowledgeItem> {
  const effectiveness = calculateActionEffectiveness(action, defects);
  return {
    title: `${action.title} lesson learned`,
    type: action.actionType === 'training' ? 'training-point' : 'lesson-learned',
    status: action.status === 'effective' || action.status === 'closed' ? 'active' : 'draft',
    sourceType: 'improvement-action',
    sourceId: action.id,
    relatedDefectIds: action.relatedDefectId ? [action.relatedDefectId] : [],
    relatedNcrIds: action.relatedNcrId ? [action.relatedNcrId] : [],
    relatedCapaIds: action.relatedCapaId ? [action.relatedCapaId] : [],
    relatedEightDIds: action.relatedEightDId ? [action.relatedEightDId] : [],
    relatedActionIds: [action.id],
    defectType: action.linkedDefectType,
    productionLine: action.linkedProductionLine,
    model: action.linkedModel,
    partNumber: action.linkedPartNumber,
    supplier: action.linkedSupplier,
    customer: action.linkedCustomer,
    severity: action.priority,
    problemSummary: action.description,
    historicalPattern: `Action scoped to ${compactText([action.linkedDefectType, action.linkedProductionLine, action.linkedModel, action.linkedPartNumber]) || 'available linked records'}.`,
    effectiveActions: action.title,
    verificationResult: effectiveness.effectivenessStatus,
    beforeMetric: effectiveness.primaryMetric.before,
    afterMetric: effectiveness.primaryMetric.after,
    improvementPercent: effectiveness.primaryMetric.improvementPercent,
    confidenceLabel: effectiveness.confidenceLabel,
    recommendedContainment: action.actionType === 'containment' ? action.description : undefined,
    recommendedVerification: action.verificationMethod || effectiveness.verificationRecommendation,
    recommendedCorrectiveAction: ['correction', 'corrective'].includes(action.actionType) ? action.description : undefined,
    recommendedPreventiveAction: action.actionType === 'preventive' ? action.description : undefined,
    trainingNeed: action.actionType === 'training' ? action.description : undefined,
    tags: [action.actionType, action.sourceType, action.linkedDefectType, action.linkedProductionLine].filter(Boolean) as string[],
  };
}

function fieldMatch(label: string, left?: string, right?: string): string | null {
  return left && right && normalize(left) === normalize(right) ? `${label}: ${right}` : null;
}

function confidenceForScore(score: number): KnowledgeMatchConfidence {
  if (score >= 65) return 'Strong Signal';
  if (score >= 38) return 'Moderate Signal';
  if (score >= 14) return 'Weak Signal';
  return 'Insufficient Data';
}

export function suggestQualityKnowledge(context: QualityKnowledgeContext, limit = 5): QualityKnowledgeSuggestion[] {
  const contextTags = new Set((context.tags || []).map(normalize).filter(Boolean));
  return loadQualityKnowledgeBase()
    .filter((item) => item.status === 'active')
    .map((item) => {
      const reasons = [
        fieldMatch('Defect type', context.defectType, item.defectType),
        fieldMatch('Category', context.defectCategory, item.defectCategory),
        fieldMatch('Line', context.productionLine, item.productionLine),
        fieldMatch('Model', context.model, item.model),
        fieldMatch('Part', context.partNumber, item.partNumber),
        fieldMatch('Supplier', context.supplier, item.supplier),
        fieldMatch('Customer', context.customer, item.customer),
        fieldMatch('Severity', context.severity, item.severity),
      ].filter(Boolean) as string[];
      const tagMatches = item.tags.filter((tag) => contextTags.has(normalize(tag)));
      const score = reasons.length * 12
        + tagMatches.length * 6
        + (normalize(context.description).includes(normalize(item.defectType)) && item.defectType ? 8 : 0)
        + (item.confidenceLabel === 'Strong Signal' ? 10 : item.confidenceLabel === 'Moderate Signal' ? 6 : 0)
        + Math.max(-5, Math.min(10, Number(item.feedbackScore || 0)));
      return {
        item,
        score,
        confidence: confidenceForScore(score),
        matchReasons: [...reasons, ...tagMatches.map((tag) => `Tag: ${tag}`)],
        suggestedFocus: item.recommendedVerification || item.recommendedContainment || item.recommendedCorrectiveAction || 'Use this similar historical case as a verification reference.',
        relatedEffectiveAction: item.effectiveActions,
      };
    })
    .filter((suggestion) => suggestion.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function buildStandardActionLibrary(items = loadQualityKnowledgeBase()): StandardActionLibraryEntry[] {
  const groups = new Map<string, QualityKnowledgeItem[]>();
  items.filter((item) => item.status === 'active' && ['lesson-learned', 'best-practice', 'standard-action', 'inspection-alert', 'training-point'].includes(item.type)).forEach((item) => {
    const key = item.defectType || item.defectCategory || item.tags[0] || 'General Quality Signal';
    groups.set(key, [...(groups.get(key) || []), item]);
  });
  return [...groups.entries()].map(([key, rows]) => ({
    key,
    defectTypeOrCategory: key,
    recommendedContainment: rows.find((item) => item.recommendedContainment)?.recommendedContainment || 'Review similar historical cases and define containment before release.',
    recommendedVerification: rows.find((item) => item.recommendedVerification)?.recommendedVerification || 'Verify with standard quality checks before applying any action.',
    recommendedCorrectiveAction: rows.find((item) => item.recommendedCorrectiveAction)?.recommendedCorrectiveAction || 'Define corrective action based on verified process evidence.',
    recommendedPreventiveAction: rows.find((item) => item.recommendedPreventiveAction)?.recommendedPreventiveAction || 'Update controls, checklist, or audit frequency where recurrence is observed.',
    dataFollowUp: 'Track recurrence by line, model, part, shift, supplier, and customer where available.',
    inspectionUpdate: rows.find((item) => item.inspectionStandardUpdate)?.inspectionStandardUpdate || 'Review whether inspection standards need an update.',
    trainingRecommendation: rows.find((item) => item.trainingNeed)?.trainingNeed || 'Use lesson learned in quality awareness if the pattern repeats.',
    sourceKnowledgeIds: rows.map((item) => item.id),
  })).sort((a, b) => a.defectTypeOrCategory.localeCompare(b.defectTypeOrCategory));
}

export function buildTrainingSuggestions(items = loadQualityKnowledgeBase()): Array<{
  topic: string;
  reason: string;
  targetRole: string;
  suggestedAudience: string;
  linkedRecords: string[];
  priority: string;
}> {
  return items
    .filter((item) => item.status === 'active' && (item.type === 'training-point' || Boolean(item.trainingNeed)))
    .map((item) => ({
      topic: item.title,
      reason: item.trainingNeed || item.problemSummary || 'Active lesson learned marked for capability development.',
      targetRole: item.severity === 'critical' || item.severity === 'high' ? 'QUALITY_SUPERVISOR' : 'QUALITY_ENGINEER',
      suggestedAudience: compactText([item.productionLine, item.defectType, item.defectCategory]) || 'Quality and production team',
      linkedRecords: [...item.relatedDefectIds, ...item.relatedNcrIds, ...item.relatedCapaIds, ...item.relatedEightDIds, ...item.relatedActionIds],
      priority: item.severity || (item.confidenceLabel === 'Strong Signal' ? 'high' : 'medium'),
    }));
}

export function buildQualityKnowledgeCommandSummary(input: {
  knowledge: QualityKnowledgeItem[];
  defects: DefectLogData[];
  actions: QualityImprovementAction[];
}): QualityKnowledgeCommandSummary {
  const active = input.knowledge.filter((item) => item.status === 'active');
  const currentMonth = new Date().toISOString().slice(0, 7);
  const defectCounts = new Map<string, number>();
  input.defects.forEach((record) => {
    const key = record.defectType || record.defectCategory || '';
    if (!key) return;
    defectCounts.set(key, (defectCounts.get(key) || 0) + Math.max(1, Number(record.quantity || 1)));
  });
  const knownKeys = new Set(active.flatMap((item) => [item.defectType, item.defectCategory, ...item.tags]).map(normalize).filter(Boolean));
  const gaps = [...defectCounts.entries()]
    .filter(([label, count]) => count >= 2 && !knownKeys.has(normalize(label)))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, repeatedCount]) => ({
      label,
      repeatedCount,
      suggestedAction: 'Create a lesson learned after verification or link an effective action to this repeated signal.',
    }));
  const effectiveActionIds = new Set(input.actions.filter((action) => action.status === 'effective' || action.status === 'closed' || action.effectivenessResult === 'Effective').map((action) => action.id));
  return {
    activeLessons: active.filter((item) => item.type === 'lesson-learned').length,
    newLessonsThisMonth: input.knowledge.filter((item) => item.createdAt.slice(0, 7) === currentMonth).length,
    topRepeatedKnownIssues: [...defectCounts.entries()]
      .filter(([label]) => knownKeys.has(normalize(label)))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({ label, count })),
    lessonsLinkedToEffectiveActions: active.filter((item) => item.relatedActionIds.some((id) => effectiveActionIds.has(id))).length,
    trainingPoints: active.filter((item) => item.type === 'training-point' || Boolean(item.trainingNeed)).length,
    standardActionsAvailable: buildStandardActionLibrary(active).length,
    knowledgeGaps: gaps,
  };
}
