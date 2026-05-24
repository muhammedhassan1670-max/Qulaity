import type { DefectLogData } from '@/api/unified-api';
import type { QualityDataSnapshot } from '@/services/qualityDataProvider';
import {
  buildGovernedSlaStatus,
  evaluateApprovalRequirement,
} from '@/services/defectWorkflowGovernance';
import { buildWorkflowMetrics, normalizeDefectLifecycleStatus } from '@/services/defectLifecycleWorkflow';
import { evaluateAdvancedDefectRules } from '@/services/qualityRulesEngine';
import {
  detectMasterDuplicates,
  qualityMasterTableConfigs,
} from '@/services/qualityMasterData';
import { QUALITY_SYNC_QUEUE_KEY } from '@/services/qualitySyncQueue';
import {
  QUALITY_IMPROVEMENT_ACTIONS_KEY,
  buildImprovementEffectivenessDashboard,
} from '@/services/qualityImprovementActions';
import { buildClosedLoopCommandSummary } from '@/services/qualityClosedLoopIntegration';
import { QUALITY_RELATIONSHIPS_KEY } from '@/services/qualityRelationships';
import {
  QUALITY_KNOWLEDGE_BASE_KEY,
  buildQualityKnowledgeCommandSummary,
} from '@/services/qualityKnowledgeBase';
import {
  QUALITY_SEARCH_APPLY_DASHBOARD_FILTERS_KEY,
  QUALITY_SEARCH_SETTINGS_KEY,
} from '@/services/qualityUnifiedSearch';
import { QUALITY_FORM_TEMPLATES_KEY } from '@/services/qualityFormTemplates';
import {
  QUALITY_INSPECTION_PLANS_KEY,
  QUALITY_INSPECTION_RUNS_KEY,
} from '@/services/qualityInspectionPlans';
import {
  QUALITY_AUDIT_PLANS_KEY,
  QUALITY_AUDIT_RUNS_KEY,
} from '@/services/qualityLayeredAudits';
import {
  DEFECT_LOG_STORAGE_KEY,
  loadSafeLocalDefectRecords,
  restoreSafeLocalDefectRecords,
} from '@/services/safeDefectStorage';

export interface QualityCommandCenterSummary {
  openDefects: number;
  pendingReview: number;
  pendingApproval: number;
  investigating: number;
  escalated: number;
  closedThisMonth: number;
  overdueSla: number;
  highSeverityOpen: number;
  repeatedDefects: number;
  customerReturns: number;
  outgoingFailures: number;
  copqImpact: number;
  processPpm: number;
  ncrEscalations: number;
  capaPending: number;
  eightDActive: number;
  myTasks: number;
  unreadNotifications: number;
  openImprovementActions: number;
  overdueImprovementActions: number;
  pendingImprovementVerification: number;
  effectiveImprovementActions: number;
  notEffectiveImprovementActions: number;
  openNcrs: number;
  ncrsWaitingCapa: number;
  openCapas: number;
  capasPendingVerification: number;
  notEffectiveCapas: number;
  openEightD: number;
  overdueEightD: number;
  actionsLinkedToEscalations: number;
  activeKnowledgeLessons: number;
  standardActionsAvailable: number;
  trainingPoints: number;
}

export interface QualityRiskItem {
  id: string;
  title: string;
  relatedDefectId: string;
  riskScore: number;
  affectedContext: string;
  reasonSignals: string[];
  suggestedNextAction: string;
  owner: string;
  nextRequiredRole: string;
  slaStatus: string;
}

export interface QualityDataHealth {
  totalDefectRecords: number;
  masterDataTablesCount: number;
  missingMandatoryFields: number;
  recordsWithoutMasterDataMatch: number;
  recordsWithoutSnapshot: number;
  duplicateMasterDataEntries: number;
  conflictingRules: number;
  largeAttachmentsSkipped: number;
  localStorageUsageBytes: number;
  localStorageUsagePercent: number;
  recordsReadyForPrediction: number;
  recordsRequiringReview: number;
  overdueActions: number;
  improvementActionsCount: number;
  actionsPendingVerification: number;
  recommendations: string[];
}

export interface QualityBackupPayload {
  backupType: 'quality-command-center-backup';
  version: 1;
  exportedAt: string;
  includedScopes: string[];
  data: Record<string, unknown>;
}

export interface QualityBackupValidation {
  valid: boolean;
  message: string;
  scopes: string[];
  itemCounts: Record<string, number>;
}

export type DataConfidenceLabel = 'Strong Signal' | 'Moderate Signal' | 'Weak Signal' | 'Insufficient Data';

export interface QualityInsightFact {
  label: string;
  value: string;
  description: string;
  confidence: DataConfidenceLabel;
}

export interface QualityIntelligenceSummary {
  overallQualityStatus: QualityInsightFact;
  topCurrentQualitySignal: QualityInsightFact;
  highestRiskArea: QualityInsightFact;
  topRepeatedDefect: QualityInsightFact;
  biggestCopqContributor: QualityInsightFact;
  mostAffectedProductionLine: QualityInsightFact;
  mostAffectedModelOrPart: QualityInsightFact;
  overdueWorkflowConcern: QualityInsightFact;
  suggestedManagementFocus: string;
  confidence: DataConfidenceLabel;
}

export interface ParetoInsightRow {
  label: string;
  quantity: number;
  records: number;
  percentage: number;
  cumulativePercentage: number;
}

export interface AutoParetoInsights {
  rows: ParetoInsightRow[];
  narrative: string;
  focusRecommendation: string;
  previousPeriodNote: string;
  confidence: DataConfidenceLabel;
}

export interface TrendMetric {
  name: string;
  current: number;
  previous: number;
  movementPercent: number | null;
  direction: 'increase' | 'decrease' | 'stable' | 'no-baseline';
  interpretation: string;
  confidence: DataConfidenceLabel;
}

export interface PatternInsight {
  id: string;
  title: string;
  affectedField: string;
  affectedValue: string;
  count: number;
  percentage: number;
  riskImpact: string;
  suggestedVerificationArea: string;
  confidence: DataConfidenceLabel;
}

export interface RootCauseHypothesis {
  id: string;
  possibleFocusArea: string;
  supportingSignals: string[];
  missingDataNeeded: string[];
  recommendedVerificationStep: string;
  confidence: DataConfidenceLabel;
}

export interface CorrectiveActionRecommendation {
  trigger: string;
  immediateContainment: string[];
  processVerification: string[];
  correctiveAction: string[];
  preventiveAction: string[];
  dataFollowUp: string[];
}

export interface ManagementReport {
  generatedAt: string;
  title: string;
  markdown: string;
  json: Record<string, unknown>;
}

const DEFECT_AUDIT_KEY = 'qms_defect_record_audit_trail_v1';
const PREDICTION_MODEL_KEY = 'qms_defect_prediction_model_v1';
const PREDICTION_OVERRIDES_KEY = 'qms_defect_prediction_column_overrides_v1';
const WORKFLOW_SETTINGS_KEY = 'qms_defect_workflow_governance_settings_v1';
const READ_NOTIFICATIONS_KEY = 'qms_defect_workflow_read_notifications_v1';
const DASHBOARD_FILTERS_KEY = 'qms_quality_dashboard_filters_v1';

function toNumber(value: unknown): number {
  const parsed = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function statusIsOpen(record: DefectLogData): boolean {
  return normalizeDefectLifecycleStatus(record.status) !== 'closed' && normalizeDefectLifecycleStatus(record.status) !== 'rejected';
}

function monthKey(value?: string): string {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function recordHasSnapshot(record: DefectLogData): boolean {
  return Boolean(record.masterDataVersion || record.partNameAtTime || record.defectCategoryAtTime || record.productionLineAtTime);
}

function mandatoryMissing(record: DefectLogData): string[] {
  const required = ['date', 'shift', 'productionLine', 'recordType', 'defectType', 'quantity'];
  const missing = required.filter((field) => {
    const value = (record as unknown as Record<string, unknown>)[field];
    return value === null || value === undefined || String(value).trim() === '' || Number.isNaN(value);
  });
  if (!record.partId && !record.partNumber) missing.push('partId/partNumber');
  return missing;
}

function localStorageUsageBytes(): number {
  if (typeof localStorage === 'undefined') return 0;
  let total = 0;
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index) || '';
    const value = localStorage.getItem(key) || '';
    total += key.length + value.length;
  }
  return total * 2;
}

function localStorageJson(key: string): unknown {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function countBackupItems(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') return Object.keys(value as Record<string, unknown>).length;
  return value ? 1 : 0;
}

function normalizeText(value: unknown): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function recordDate(record: DefectLogData): Date | null {
  const candidate = record.date || record.createdAt || record.updatedAt;
  if (!candidate) return null;
  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function currentAndPreviousMonthKeys(records: DefectLogData[]): { current: string; previous: string } {
  const dates = records.map(recordDate).filter((date): date is Date => Boolean(date));
  const latest = dates.length ? new Date(Math.max(...dates.map((date) => date.getTime()))) : new Date();
  const current = `${latest.getFullYear()}-${String(latest.getMonth() + 1).padStart(2, '0')}`;
  const previousDate = new Date(latest.getFullYear(), latest.getMonth() - 1, 1);
  const previous = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}`;
  return { current, previous };
}

function confidenceFor(records: number, concentrationPercent = 0, completenessPercent = 100, hasBaseline = true): DataConfidenceLabel {
  if (records < 5 || completenessPercent < 30) return 'Insufficient Data';
  if (records < 15 || !hasBaseline) return 'Weak Signal';
  if (records >= 50 && concentrationPercent >= 35 && completenessPercent >= 70) return 'Strong Signal';
  return 'Moderate Signal';
}

function topGroup(records: DefectLogData[], field: string, useQuantity = false): { value: string; count: number; quantity: number; percentage: number } | null {
  const groups = new Map<string, { count: number; quantity: number }>();
  records.forEach((record) => {
    const value = normalizeText((record as unknown as Record<string, unknown>)[field]);
    if (!value) return;
    const current = groups.get(value) || { count: 0, quantity: 0 };
    groups.set(value, { count: current.count + 1, quantity: current.quantity + Math.max(1, toNumber(record.quantity) || 1) });
  });
  const entries = [...groups.entries()].sort((a, b) => (useQuantity ? b[1].quantity - a[1].quantity : b[1].count - a[1].count));
  const top = entries[0];
  if (!top) return null;
  const denominator = useQuantity
    ? [...groups.values()].reduce((sum, item) => sum + item.quantity, 0)
    : records.length;
  return {
    value: top[0],
    count: top[1].count,
    quantity: top[1].quantity,
    percentage: denominator ? Math.round(((useQuantity ? top[1].quantity : top[1].count) / denominator) * 100) : 0,
  };
}

function buildFact(label: string, value: string, description: string, records: number, concentration = 0, completeness = 100, hasBaseline = true): QualityInsightFact {
  return {
    label,
    value: value || 'No signal yet',
    description,
    confidence: confidenceFor(records, concentration, completeness, hasBaseline),
  };
}

export function buildQualityCommandCenterSummary(snapshot: QualityDataSnapshot): QualityCommandCenterSummary {
  const records = snapshot.defectRecords;
  const workflow = buildWorkflowMetrics(records);
  const improvement = buildImprovementEffectivenessDashboard(snapshot.improvementActions, records);
  const closedLoop = buildClosedLoopCommandSummary({ ncrs: snapshot.ncr, capas: snapshot.capa, eightDs: snapshot.eightD, actions: snapshot.improvementActions });
  const knowledge = buildQualityKnowledgeCommandSummary({ knowledge: snapshot.qualityKnowledge, defects: records, actions: snapshot.improvementActions });
  const currentMonth = monthKey();
  const inspected = records.reduce((sum, record) => sum + toNumber(record.inspectedQuantity || record.productionQuantity), 0);
  const defectQty = records.reduce((sum, record) => sum + toNumber(record.quantity), 0);
  return {
    openDefects: workflow.totalOpen,
    pendingReview: workflow.pendingReview,
    pendingApproval: workflow.pendingApproval,
    investigating: workflow.investigating,
    escalated: workflow.escalated,
    closedThisMonth: records.filter((record) => normalizeDefectLifecycleStatus(record.status) === 'closed' && monthKey(record.closedAt || record.updatedAt) === currentMonth).length,
    overdueSla: records.filter((record) => buildGovernedSlaStatus(record, snapshot.workflowSettings).status === 'overdue').length,
    highSeverityOpen: workflow.highSeverityOpen,
    repeatedDefects: workflow.repeatedDefects,
    customerReturns: records.filter((record) => String(record.recordType || '').toLowerCase() === 'customer-return' || Boolean(record.returnReference)).length,
    outgoingFailures: records.filter((record) => String(record.recordType || '').toLowerCase() === 'outgoing-quality' && ['fail', 'hold', 'escape'].includes(String(record.outgoingResult || '').toLowerCase())).length,
    copqImpact: Math.round(records.reduce((sum, record) => sum + toNumber(record.estimatedCost), 0) * 100) / 100,
    processPpm: inspected > 0 ? Math.round((defectQty / inspected) * 1_000_000) : 0,
    ncrEscalations: records.filter((record) => Boolean(record.relatedNcrId)).length || snapshot.ncr.length,
    capaPending: snapshot.capa.filter((record) => !['closed', 'completed', 'verified'].includes(String(record.status || '').toLowerCase())).length,
    eightDActive: snapshot.eightD.filter((record) => !['closed', 'completed'].includes(String(record.status || '').toLowerCase())).length,
    myTasks: snapshot.tasks.length,
    unreadNotifications: snapshot.notifications.filter((item) => !item.read).length,
    openImprovementActions: improvement.openActions,
    overdueImprovementActions: improvement.overdueActions,
    pendingImprovementVerification: improvement.pendingVerification,
    effectiveImprovementActions: improvement.effectiveActions,
    notEffectiveImprovementActions: improvement.notEffectiveActions,
    openNcrs: closedLoop.openNcrs,
    ncrsWaitingCapa: closedLoop.ncrsWaitingCapa,
    openCapas: closedLoop.openCapas,
    capasPendingVerification: closedLoop.capasPendingVerification,
    notEffectiveCapas: closedLoop.notEffectiveCapas,
    openEightD: closedLoop.openEightD,
    overdueEightD: closedLoop.overdueEightD,
    actionsLinkedToEscalations: closedLoop.actionsLinkedToEscalations,
    activeKnowledgeLessons: knowledge.activeLessons,
    standardActionsAvailable: knowledge.standardActionsAvailable,
    trainingPoints: knowledge.trainingPoints,
  };
}

export function buildExecutiveRiskBoard(snapshot: QualityDataSnapshot): QualityRiskItem[] {
  return snapshot.defectRecords
    .filter(statusIsOpen)
    .map((record) => {
      const rules = evaluateAdvancedDefectRules(record as unknown as Record<string, unknown>, snapshot.defectRecords);
      const approval = evaluateApprovalRequirement(record, snapshot.defectRecords, snapshot.workflowSettings);
      const sla = buildGovernedSlaStatus(record, snapshot.workflowSettings);
      const severity = String(record.severity || '').toLowerCase();
      const signals: string[] = [];
      let score = 0;

      if (severity === 'critical') { score += 35; signals.push('Critical severity quality signal.'); }
      else if (['high', 'major'].includes(severity)) { score += 24; signals.push('High severity issue requires review.'); }
      else if (severity) score += 8;
      if (rules.repeatedDefect.repeated) { score += Math.min(25, rules.repeatedDefect.similarRecordIds.length * 5); signals.push('Historically repeated in similar records.'); }
      if (toNumber(record.estimatedCost) > 0) { score += Math.min(20, Math.round(toNumber(record.estimatedCost) / 1000)); signals.push(`COPQ impact: ${toNumber(record.estimatedCost).toLocaleString()}.`); }
      if (String(record.recordType || '').toLowerCase() === 'customer-return' || record.returnReference) { score += 25; signals.push('Customer return requires controlled verification.'); }
      if (String(record.outgoingResult || '').toLowerCase() === 'fail') { score += 20; signals.push('Outgoing failure or hold signal.'); }
      if (sla.status === 'overdue') { score += 20; signals.push(sla.label); }
      if (record.relatedNcrId || record.relatedCapaId || record.relatedEightDId) { score += 10; signals.push('Linked NCR/CAPA/8D follow-up exists.'); }
      if (String(record.defaultInspectionPoint || (record as unknown as Record<string, unknown>).defaultInspectionPointAtTime || '').toLowerCase().includes('critical')) { score += 10; signals.push('Critical part or inspection point signal.'); }
      if (record.supplierName || record.supplierNameAtTime) { score += 6; signals.push('Supplier involvement should be verified.'); }
      if (approval.managementAttention) signals.push('Management attention suggested by approval matrix.');

      return {
        id: `risk-${record.id}`,
        title: record.defectType || record.description || 'Open quality risk',
        relatedDefectId: record.id,
        riskScore: Math.min(100, score),
        affectedContext: [record.productionLine, record.model, record.partId || record.partNumber].filter(Boolean).join(' | ') || 'No line/model/part context',
        reasonSignals: signals.length ? signals : ['Open defect requires standard quality verification.'],
        suggestedNextAction: approval.required ? `Prioritize ${approval.requiredRole.replace(/_/g, ' ')} review.` : 'Prioritize review of evidence, containment, and next owner.',
        owner: String(record.currentOwner || record.assignedRole || '---').replace(/_/g, ' '),
        nextRequiredRole: String(record.nextRequiredRole || approval.requiredRole || '---').replace(/_/g, ' '),
        slaStatus: sla.label,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 12);
}

export function buildQualityIntelligenceSummary(snapshot: QualityDataSnapshot): QualityIntelligenceSummary {
  const records = snapshot.defectRecords;
  const summary = buildQualityCommandCenterSummary(snapshot);
  const riskBoard = buildExecutiveRiskBoard(snapshot);
  const dataHealth = buildQualityDataHealth(snapshot);
  const topDefect = topGroup(records, 'defectType', true);
  const topLine = topGroup(records, 'productionLine');
  const topModel = topGroup(records, 'model') || topGroup(records, 'partNumber') || topGroup(records, 'partId');
  const topRepeated = records
    .map((record) => ({
      record,
      repeated: evaluateAdvancedDefectRules(record as unknown as Record<string, unknown>, records).repeatedDefect.similarRecordIds.length,
    }))
    .sort((a, b) => b.repeated - a.repeated)[0];
  const biggestCopq = records
    .filter((record) => toNumber(record.estimatedCost) > 0)
    .sort((a, b) => toNumber(b.estimatedCost) - toNumber(a.estimatedCost))[0];
  const completeness = records.length ? Math.round((dataHealth.recordsReadyForPrediction / records.length) * 100) : 0;
  const topRisk = riskBoard[0];
  const statusText = records.length === 0
    ? 'No registered defect records yet'
    : summary.overdueSla > 0 || summary.highSeverityOpen > 0 || summary.customerReturns > 0
      ? 'Elevated quality attention suggested'
      : 'Stable local quality signal';
  const managementFocus = topRisk
    ? `Prioritize review of ${topRisk.title} around ${topRisk.affectedContext}. Verify evidence, containment, owner, and SLA before management escalation.`
    : records.length > 0
      ? 'Prioritize completing mandatory fields and monitoring recurring quality signals.'
      : 'Start by logging real defect records and importing master data.';

  return {
    overallQualityStatus: buildFact('Overall Quality Status', statusText, 'Based on open defects, high severity records, overdue SLA, customer returns, and current workflow status.', records.length, 0, completeness),
    topCurrentQualitySignal: buildFact('Top Current Quality Signal', topRisk?.title || topDefect?.value || 'No active risk signal', topRisk?.reasonSignals.slice(0, 2).join(' ') || 'Uses top defect quantity and risk board ranking from real records.', records.length, topRisk?.riskScore || topDefect?.percentage || 0, completeness),
    highestRiskArea: buildFact('Highest Risk Area', topRisk?.affectedContext || topLine?.value || 'No area concentration', 'The most visible line/model/part context from active risk and record concentration.', records.length, topLine?.percentage || 0, completeness),
    topRepeatedDefect: buildFact('Top Repeated Defect', topRepeated?.repeated ? `${topRepeated.record.defectType || 'Defect'} (${topRepeated.repeated} similar signals)` : 'No repeated signal yet', 'Repeated defect logic compares similar part, line, shift, supplier, record type, and defect information.', records.length, topRepeated?.repeated ? Math.min(60, topRepeated.repeated * 10) : 0, completeness),
    biggestCopqContributor: buildFact('Biggest COPQ Contributor', biggestCopq ? `${biggestCopq.defectType || biggestCopq.partNumber || biggestCopq.id} | ${toNumber(biggestCopq.estimatedCost).toLocaleString()}` : 'No COPQ values recorded', 'Largest estimated cost value among real defect records.', records.length, biggestCopq ? 40 : 0, completeness),
    mostAffectedProductionLine: buildFact('Most Affected Production Line', topLine ? `${topLine.value} (${topLine.percentage}%)` : 'No line data', 'Highest record concentration by production line.', records.length, topLine?.percentage || 0, completeness),
    mostAffectedModelOrPart: buildFact('Most Affected Model / Part', topModel ? `${topModel.value} (${topModel.percentage}%)` : 'No model or part concentration', 'Highest concentration among model, part number, or part id fields.', records.length, topModel?.percentage || 0, completeness),
    overdueWorkflowConcern: buildFact('Overdue Workflow Concern', summary.overdueSla > 0 ? `${summary.overdueSla} SLA item(s) require review` : 'No overdue SLA signal', 'Uses configured SLA settings and defect lifecycle status.', records.length, summary.overdueSla > 0 ? 50 : 0, completeness),
    suggestedManagementFocus: managementFocus,
    confidence: confidenceFor(records.length, topRisk?.riskScore || topDefect?.percentage || 0, completeness),
  };
}

export function buildAutoParetoInsights(snapshot: QualityDataSnapshot): AutoParetoInsights {
  const records = snapshot.defectRecords;
  const totalQty = records.reduce((sum, record) => sum + Math.max(1, toNumber(record.quantity) || 1), 0);
  const groups = new Map<string, { records: number; quantity: number }>();
  records.forEach((record) => {
    const label = normalizeText(record.defectType) || 'Unclassified defect';
    const current = groups.get(label) || { records: 0, quantity: 0 };
    groups.set(label, { records: current.records + 1, quantity: current.quantity + Math.max(1, toNumber(record.quantity) || 1) });
  });
  let cumulative = 0;
  const rows = [...groups.entries()]
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 10)
    .map(([label, item]) => {
      const percentage = totalQty ? Math.round((item.quantity / totalQty) * 100) : 0;
      cumulative += percentage;
      return { label, quantity: item.quantity, records: item.records, percentage, cumulativePercentage: Math.min(100, cumulative) };
    });
  const topThree = rows.slice(0, 3);
  const topThreeContribution = topThree.length ? topThree[topThree.length - 1].cumulativePercentage : 0;
  const period = currentAndPreviousMonthKeys(records);
  const currentCount = records.filter((record) => monthKey(record.date || record.createdAt) === period.current).length;
  const previousCount = records.filter((record) => monthKey(record.date || record.createdAt) === period.previous).length;
  const previousPeriodNote = previousCount > 0
    ? `Current period has ${currentCount} records vs ${previousCount} in the previous period.`
    : 'Previous period comparison is limited because there are no earlier records in storage.';

  return {
    rows,
    narrative: rows.length
      ? `Top ${Math.min(3, rows.length)} defects represent ${topThreeContribution}% of total defect quantity. Prioritizing these categories may provide the highest improvement impact.`
      : 'No defect records are available for Pareto insight yet.',
    focusRecommendation: rows[0]
      ? `Suggested focus: review ${rows[0].label} first, then verify the next highest categories before broad action planning.`
      : 'Log real defect records to generate Pareto focus recommendations.',
    previousPeriodNote,
    confidence: confidenceFor(records.length, topThreeContribution, records.length ? 80 : 0, previousCount > 0),
  };
}

export function buildTrendChangeDetection(snapshot: QualityDataSnapshot): TrendMetric[] {
  const records = snapshot.defectRecords;
  const { current, previous } = currentAndPreviousMonthKeys(records);
  const currentRecords = records.filter((record) => monthKey(record.date || record.createdAt) === current);
  const previousRecords = records.filter((record) => monthKey(record.date || record.createdAt) === previous);
  const metricValue = (items: DefectLogData[], metric: string) => {
    const inspected = items.reduce((sum, record) => sum + toNumber(record.inspectedQuantity || record.productionQuantity), 0);
    const defectQty = items.reduce((sum, record) => sum + toNumber(record.quantity), 0);
    if (metric === 'quantity') return defectQty;
    if (metric === 'ppm') return inspected > 0 ? Math.round((defectQty / inspected) * 1_000_000) : 0;
    if (metric === 'copq') return Math.round(items.reduce((sum, record) => sum + toNumber(record.estimatedCost), 0));
    if (metric === 'outgoing') return items.filter((record) => String(record.outgoingResult || '').toLowerCase() === 'fail' || String(record.recordType || '').toLowerCase() === 'outgoing-quality').length;
    if (metric === 'returns') return items.filter((record) => String(record.recordType || '').toLowerCase() === 'customer-return' || record.returnReference).length;
    if (metric === 'overdue') return items.filter((record) => buildGovernedSlaStatus(record, snapshot.workflowSettings).status === 'overdue').length;
    if (metric === 'escalations') return items.filter((record) => record.relatedNcrId || record.relatedCapaId || record.relatedEightDId).length;
    return 0;
  };
  const names: Array<[string, string, string]> = [
    ['Defect Quantity', 'quantity', 'defect quantity'],
    ['Process PPM', 'ppm', 'PPM'],
    ['COPQ', 'copq', 'estimated cost'],
    ['Outgoing Hold / Failure', 'outgoing', 'outgoing quality signals'],
    ['Customer Return', 'returns', 'customer return signals'],
    ['Overdue Action / SLA', 'overdue', 'overdue workflow signals'],
    ['NCR / CAPA / 8D Escalation', 'escalations', 'formal escalation signals'],
  ];

  return names.map(([name, key, noun]) => {
    const currentValue = metricValue(currentRecords, key);
    const previousValue = metricValue(previousRecords, key);
    const hasBaseline = previousRecords.length > 0;
    const movementPercent = hasBaseline && previousValue !== 0 ? Math.round(((currentValue - previousValue) / previousValue) * 100) : null;
    const direction = !hasBaseline
      ? 'no-baseline'
      : currentValue > previousValue
        ? 'increase'
        : currentValue < previousValue
          ? 'decrease'
          : 'stable';
    const interpretation = direction === 'no-baseline'
      ? `No previous-period baseline for ${noun}.`
      : direction === 'increase'
        ? `${noun} increased and should be reviewed before treating it as a confirmed trend.`
        : direction === 'decrease'
          ? `${noun} decreased compared with the previous period. Continue verification before drawing conclusions.`
          : `${noun} is stable compared with the previous period.`;
    return {
      name,
      current: currentValue,
      previous: previousValue,
      movementPercent,
      direction,
      interpretation,
      confidence: confidenceFor(currentRecords.length + previousRecords.length, Math.abs(movementPercent || 0), 80, hasBaseline),
    };
  });
}

export function buildPatternInsights(snapshot: QualityDataSnapshot): PatternInsight[] {
  const records = snapshot.defectRecords;
  const fields = [
    ['productionLine', 'Production line', 'Verify line process conditions, station standards, and local handling.'],
    ['shift', 'Shift', 'Verify handover, staffing, and shift-specific process discipline.'],
    ['model', 'Model', 'Verify model-specific routing, fixtures, and test settings.'],
    ['partNumber', 'Part number', 'Verify part code, supplier batch, and incoming quality evidence.'],
    ['defectType', 'Defect type', 'Verify repeated process, material, or inspection pattern.'],
    ['supplierNameAtTime', 'Supplier', 'Verify supplier batch, storage, and incoming inspection history.'],
    ['customerName', 'Customer', 'Verify customer impact, return handling, and containment communication.'],
    ['defaultInspectionPoint', 'Inspection point', 'Verify inspection point standard and evidence quality.'],
    ['recordType', 'Record type', 'Verify routing impact and dashboard-specific follow-up.'],
  ];

  return fields.flatMap(([field, label, verification]) => {
    const top = topGroup(records, field);
    if (!top || top.count < 2) return [];
    const confidence = confidenceFor(records.length, top.percentage, 80);
    const impact = top.percentage >= 50
      ? 'High concentration quality signal'
      : top.percentage >= 25
        ? 'Moderate concentration quality signal'
        : 'Early concentration signal';
    return [{
      id: `pattern-${field}-${top.value}`,
      title: `${label}: ${top.value}`,
      affectedField: label,
      affectedValue: top.value,
      count: top.count,
      percentage: top.percentage,
      riskImpact: impact,
      suggestedVerificationArea: verification,
      confidence,
    }];
  }).sort((a, b) => b.percentage - a.percentage).slice(0, 12);
}

export function buildRootCauseHypotheses(snapshot: QualityDataSnapshot): RootCauseHypothesis[] {
  const patterns = buildPatternInsights(snapshot);
  const pareto = buildAutoParetoInsights(snapshot);
  const health = buildQualityDataHealth(snapshot);
  const topDefect = pareto.rows[0];
  return patterns.slice(0, 5).map((pattern) => {
    const missing: string[] = [];
    if (health.missingMandatoryFields > 0) missing.push('complete mandatory defect fields');
    if (health.recordsWithoutSnapshot > 0) missing.push('master data snapshots');
    if (health.recordsReadyForPrediction < health.totalDefectRecords) missing.push('consistent line, part, quantity, and defect type data');
    if (!missing.length) missing.push('more repeated observations before confirming a cause');
    return {
      id: `hypothesis-${pattern.id}`,
      possibleFocusArea: `${topDefect?.label || 'Current defect signal'} around ${pattern.affectedField} ${pattern.affectedValue}`,
      supportingSignals: [
        `${pattern.count} records (${pattern.percentage}%) are concentrated in ${pattern.affectedField}.`,
        pattern.riskImpact,
        pareto.narrative,
      ],
      missingDataNeeded: missing,
      recommendedVerificationStep: `Suggested focus: ${pattern.suggestedVerificationArea} This is a hypothesis for verification, not a confirmed root cause.`,
      confidence: pattern.confidence,
    };
  });
}

export function buildCorrectiveActionRecommendations(snapshot: QualityDataSnapshot): CorrectiveActionRecommendation[] {
  const pareto = buildAutoParetoInsights(snapshot);
  const records = snapshot.defectRecords;
  const topDefect = pareto.rows[0]?.label || '';
  const topRecord = records.find((record) => record.defectType === topDefect) || records[0];
  const label = `${topDefect} ${topRecord?.defectCategory || topRecord?.severity || ''} ${topRecord?.recordType || ''}`.toLowerCase();
  const repeated = topDefect ? records.filter((record) => record.defectType === topDefect).length >= 3 : false;
  const customerReturn = topRecord ? String(topRecord.recordType || '').toLowerCase() === 'customer-return' || Boolean(topRecord.returnReference) : false;
  const outgoingFailure = topRecord ? String(topRecord.outgoingResult || '').toLowerCase() === 'fail' : false;
  const recommendations: CorrectiveActionRecommendation[] = [];
  const add = (trigger: string, immediateContainment: string[], processVerification: string[], correctiveAction: string[], preventiveAction: string[], dataFollowUp: string[]) => {
    recommendations.push({ trigger, immediateContainment, processVerification, correctiveAction, preventiveAction, dataFollowUp });
  };

  if (/leak|weld|تسريب|لحام/.test(label)) {
    add('Leakage / welding signal', ['Verify leak test result.', 'Check welding point condition.', 'Confirm clamp/contact condition.'], ['Review welding parameter stability.', 'Check operator handling angle.', 'Verify leak tester calibration.'], ['Correct abnormal weld setting or fixture condition after verification.'], ['Review fixture maintenance frequency.', 'Add focused audit on welding station.'], ['Track recurrence by model, part code, operator, and shift.']);
  }
  if (/material|component|مكون|خامة|نقص/.test(label)) {
    add('Material / component signal', ['Verify part code and supplier batch.', 'Inspect component condition.'], ['Review incoming inspection result.', 'Check storage and handling condition.'], ['Escalate repeated part issues to supplier quality after verification.'], ['Strengthen incoming controls for repeated suppliers or part families.'], ['Track defect by supplier, part number, model, and batch.']);
  }
  if (/assembly|تجميع/.test(label)) {
    add('Assembly signal', ['Verify assembly sequence.', 'Check station work instruction.'], ['Review jig and fixture condition.', 'Confirm operator training status.'], ['Correct station method gaps after process verification.'], ['Update visual standard or checklist.'], ['Track recurrence by station, operator, and shift.']);
  }
  if (/performance|اداء|أداء/.test(label)) {
    add('Performance signal', ['Verify performance test readings.', 'Check sensor/test equipment status.'], ['Review refrigerant charge, airflow, and electrical readings.'], ['Correct test setup or product condition after confirmation.'], ['Add focused audit on performance test parameters.'], ['Track recurrence by model, test room, and shift.']);
  }
  if (/handling|تداول|خدش|كسر/.test(label)) {
    add('Handling signal', ['Inspect unit for dents, scratches, or handling damage.'], ['Review transport route and trolley condition.'], ['Correct handling route or protection gap after verification.'], ['Improve handling separation and protection points.'], ['Track recurrence by area, line, and handling route.']);
  }
  if (customerReturn) {
    add('Customer return signal', ['Confirm customer return reference and containment status.', 'Verify stock and shipment exposure.'], ['Review outgoing inspection evidence and customer complaint details.'], ['Open formal follow-up only after evidence review.'], ['Strengthen release checklist for similar product/customer.'], ['Track recurrence by customer, model, market, and return reference.']);
  }
  if (outgoingFailure) {
    add('Outgoing quality signal', ['Hold affected shipment if still under control.', 'Verify outgoing result and release evidence.'], ['Review final inspection and release process.'], ['Correct release control gap after verification.'], ['Add focused audit on outgoing inspection gates.'], ['Track outgoing failures by shipment, line, product, and inspector.']);
  }
  if (repeated) {
    add('Repeated defect signal', ['Contain current occurrences and separate suspect stock if needed.'], ['Compare repeated records by part, line, model, shift, and supplier.'], ['Define corrective action only after pattern verification.'], ['Add recurrence review in daily quality meeting.'], ['Make recurrence fields mandatory for reliable trend monitoring.']);
  }
  if (!recommendations.length) {
    add('General quality signal', ['Verify the defect record and evidence.', 'Confirm affected quantity and containment status.'], ['Review line, part, model, shift, and inspection point context.'], ['Assign corrective action after engineering verification.'], ['Improve mandatory data capture for repeatable learning.'], ['Track recurrence by defect type, line, model, and part.']);
  }
  return recommendations.slice(0, 5);
}

export function buildManagementReport(snapshot: QualityDataSnapshot): ManagementReport {
  const generatedAt = new Date().toISOString();
  const summary = buildQualityCommandCenterSummary(snapshot);
  const intelligence = buildQualityIntelligenceSummary(snapshot);
  const pareto = buildAutoParetoInsights(snapshot);
  const trends = buildTrendChangeDetection(snapshot);
  const patterns = buildPatternInsights(snapshot);
  const riskBoard = buildExecutiveRiskBoard(snapshot);
  const health = buildQualityDataHealth(snapshot);
  const improvement = buildImprovementEffectivenessDashboard(snapshot.improvementActions, snapshot.defectRecords);
  const closedLoop = buildClosedLoopCommandSummary({ ncrs: snapshot.ncr, capas: snapshot.capa, eightDs: snapshot.eightD, actions: snapshot.improvementActions });
  const knowledge = buildQualityKnowledgeCommandSummary({ knowledge: snapshot.qualityKnowledge, defects: snapshot.defectRecords, actions: snapshot.improvementActions });
  const markdown = [
    '# Quality Management Summary',
    `Generated: ${new Date(generatedAt).toLocaleString()}`,
    '',
    '## Executive Overview',
    `${intelligence.overallQualityStatus.value}. ${intelligence.suggestedManagementFocus}`,
    '',
    '## Top Quality Risks',
    ...(riskBoard.slice(0, 5).map((risk, index) => `${index + 1}. ${risk.title} | Score ${risk.riskScore} | ${risk.suggestedNextAction}`)),
    riskBoard.length === 0 ? 'No active quality risk items from current records.' : '',
    '',
    '## PPM / COPQ / Outgoing Movement',
    ...trends.map((trend) => `- ${trend.name}: current ${trend.current}, previous ${trend.previous}, movement ${trend.movementPercent ?? 'N/A'}%. ${trend.interpretation}`),
    '',
    '## Pareto and Repeated Defects',
    pareto.narrative,
    pareto.focusRecommendation,
    '',
    '## Overdue Actions and Escalations',
    `Overdue SLA: ${summary.overdueSla}. NCR escalations: ${summary.ncrEscalations}. CAPA pending: ${summary.capaPending}. 8D active: ${summary.eightDActive}.`,
    `Open NCRs: ${closedLoop.openNcrs}. NCRs waiting CAPA: ${closedLoop.ncrsWaitingCapa}. Open CAPAs: ${closedLoop.openCapas}. CAPAs pending verification: ${closedLoop.capasPendingVerification}. Open 8Ds: ${closedLoop.openEightD}. Overdue 8Ds: ${closedLoop.overdueEightD}.`,
    '',
    '## Closed-Loop Improvement Actions',
    `Open actions: ${improvement.openActions}. Overdue actions: ${improvement.overdueActions}. Pending verification: ${improvement.pendingVerification}. Effective: ${improvement.effectiveActions}. Not effective: ${improvement.notEffectiveActions}. Estimated COPQ reduction: ${improvement.estimatedCopqReduction}.`,
    ...(improvement.topActionsByImprovement.slice(0, 5).map(({ action, result }, index) => `${index + 1}. ${action.title}: ${result.effectivenessStatus}, ${result.primaryMetric.improvementPercent ?? 'N/A'}% on ${result.primaryMetric.label}.`)),
    improvement.totalActions === 0 ? 'No improvement actions have been registered yet.' : '',
    '',
    '## Lessons Learned and Knowledge Reuse',
    `Active lessons: ${knowledge.activeLessons}. New lessons this month: ${knowledge.newLessonsThisMonth}. Standard actions available: ${knowledge.standardActionsAvailable}. Training points: ${knowledge.trainingPoints}.`,
    ...(knowledge.knowledgeGaps.slice(0, 5).map((gap) => `- Knowledge gap: ${gap.label} has ${gap.repeatedCount} repeated signal(s). ${gap.suggestedAction}`)),
    knowledge.activeLessons === 0 ? 'No active lessons learned are available yet.' : '',
    '',
    '## Recommended Focus Areas',
    ...patterns.slice(0, 5).map((pattern) => `- ${pattern.title}: ${pattern.suggestedVerificationArea}`),
    '',
    '## Data Quality Limitations',
    ...health.recommendations.map((item) => `- ${item}`),
    '',
    'Note: This report is decision-support based on real stored quality records. It does not confirm root cause or make automatic final decisions.',
  ].filter(Boolean).join('\n');

  return {
    generatedAt,
    title: 'Quality Management Summary',
    markdown,
    json: {
      generatedAt,
      summary,
      intelligence,
      pareto,
      trends,
      topPatterns: patterns.slice(0, 5),
      topRisks: riskBoard.slice(0, 5),
      improvement,
      closedLoop,
      knowledge,
      dataHealth: health,
      safetyNote: 'Decision-support only. Requires engineering verification.',
    },
  };
}

export function buildQualityDataHealth(snapshot: QualityDataSnapshot): QualityDataHealth {
  const records = snapshot.defectRecords;
  const duplicates = qualityMasterTableConfigs.flatMap((config) => detectMasterDuplicates(config.id, snapshot.masterData[config.id]));
  const missingMandatoryFields = records.reduce((sum, record) => sum + mandatoryMissing(record).length, 0);
  const recordsWithoutSnapshot = records.filter((record) => !recordHasSnapshot(record)).length;
  const recordsWithoutMasterDataMatch = records.filter((record) => String(record.masterDataMatchStatus || '').toLowerCase().includes('no master') || (!record.masterDataMatchStatus && !recordHasSnapshot(record))).length;
  const largeAttachmentsSkipped = records.reduce((sum, record) => {
    const evidence = Array.isArray(record.evidence) ? record.evidence : [];
    return sum + evidence.filter((item) => {
      const attachment = item as Record<string, unknown>;
      return attachment.storedLocally === false || Boolean(attachment.warning);
    }).length;
  }, 0);
  const recordsReadyForPrediction = records.filter((record) => (
    Boolean(record.defectType)
    && Boolean(record.productionLine)
    && Boolean(record.partId || record.partNumber)
    && toNumber(record.quantity) > 0
  )).length;
  const recordsRequiringReview = records.filter((record) => record.approvalRequired || ['logged', 'reviewed'].includes(normalizeDefectLifecycleStatus(record.status))).length;
  const improvement = buildImprovementEffectivenessDashboard(snapshot.improvementActions, records);
  const overdueActions = records.filter((record) => {
    const due = record.dueDate ? new Date(record.dueDate).getTime() : 0;
    return due > 0 && due < Date.now() && normalizeDefectLifecycleStatus(record.status) !== 'closed';
  }).length;
  const usageBytes = localStorageUsageBytes();
  const recommendations: string[] = [];

  if (records.some((record) => toNumber(record.inspectedQuantity || record.productionQuantity) === 0)) recommendations.push('Complete missing inspected quantity for accurate PPM.');
  if (duplicates.some((item) => item.field.toLowerCase().includes('part'))) recommendations.push('Review duplicate part numbers in Parts Master.');
  if (recordsWithoutSnapshot > 0) recommendations.push('Some records do not have master data snapshots.');
  if (recordsReadyForPrediction < records.length) recommendations.push('Prediction readiness can improve by completing key fields.');
  if (largeAttachmentsSkipped > 0) recommendations.push('Review evidence files stored as metadata only because of localStorage size limits.');
  if (overdueActions > 0) recommendations.push('Prioritize overdue action tracking before closure.');
  if (improvement.pendingVerification > 0) recommendations.push('Run effectiveness checks for improvement actions pending verification.');
  if (improvement.notEffectiveActions > 0) recommendations.push('Review not-effective actions and consider CAPA/8D follow-up where justified.');
  if (missingMandatoryFields > 0) recommendations.push('Complete missing mandatory fields before relying on management dashboards.');
  if (recommendations.length === 0) recommendations.push('Current local quality data health is acceptable for decision-support review.');

  return {
    totalDefectRecords: records.length,
    masterDataTablesCount: qualityMasterTableConfigs.filter((config) => snapshot.masterData[config.id]?.length > 0).length,
    missingMandatoryFields,
    recordsWithoutMasterDataMatch,
    recordsWithoutSnapshot,
    duplicateMasterDataEntries: duplicates.length,
    conflictingRules: duplicates.filter((item) => item.field.toLowerCase().includes('rule')).length,
    largeAttachmentsSkipped,
    localStorageUsageBytes: usageBytes,
    localStorageUsagePercent: Math.min(100, Math.round((usageBytes / (5 * 1024 * 1024)) * 100)),
    recordsReadyForPrediction,
    recordsRequiringReview,
    overdueActions,
    improvementActionsCount: snapshot.improvementActions.length,
    actionsPendingVerification: improvement.pendingVerification,
    recommendations,
  };
}

export function buildQualityBackup(scopes: string[]): QualityBackupPayload {
  const data: Record<string, unknown> = {};
  const includeAll = scopes.includes('all');
  const include = (scope: string) => includeAll || scopes.includes(scope);

  if (include('defect-records')) data[DEFECT_LOG_STORAGE_KEY] = loadSafeLocalDefectRecords();
  if (include('escalation-records')) {
    data['qms_local_ncr'] = localStorageJson('qms_local_ncr') || [];
    data['qms_local_capa'] = localStorageJson('qms_local_capa') || [];
    data['qms_local_eight-d'] = localStorageJson('qms_local_eight-d') || [];
  }
  if (include('master-data')) {
    qualityMasterTableConfigs.forEach((config) => {
      data[`qms_quality_master_data_${config.id}_v1`] = localStorageJson(`qms_quality_master_data_${config.id}_v1`) || [];
    });
  }
  if (include('workflow-settings')) data[WORKFLOW_SETTINGS_KEY] = localStorageJson(WORKFLOW_SETTINGS_KEY);
  if (include('improvement-actions')) data[QUALITY_IMPROVEMENT_ACTIONS_KEY] = localStorageJson(QUALITY_IMPROVEMENT_ACTIONS_KEY) || [];
  if (include('relationships')) data[QUALITY_RELATIONSHIPS_KEY] = localStorageJson(QUALITY_RELATIONSHIPS_KEY) || [];
  if (include('knowledge-base')) data[QUALITY_KNOWLEDGE_BASE_KEY] = localStorageJson(QUALITY_KNOWLEDGE_BASE_KEY) || [];
  if (include('form-templates')) data[QUALITY_FORM_TEMPLATES_KEY] = localStorageJson(QUALITY_FORM_TEMPLATES_KEY) || [];
  if (include('inspection-plans')) {
    data[QUALITY_INSPECTION_PLANS_KEY] = localStorageJson(QUALITY_INSPECTION_PLANS_KEY) || [];
    data[QUALITY_INSPECTION_RUNS_KEY] = localStorageJson(QUALITY_INSPECTION_RUNS_KEY) || [];
  }
  if (include('layered-audits')) {
    data[QUALITY_AUDIT_PLANS_KEY] = localStorageJson(QUALITY_AUDIT_PLANS_KEY) || [];
    data[QUALITY_AUDIT_RUNS_KEY] = localStorageJson(QUALITY_AUDIT_RUNS_KEY) || [];
  }
  if (include('search-settings')) {
    data[QUALITY_SEARCH_SETTINGS_KEY] = localStorageJson(QUALITY_SEARCH_SETTINGS_KEY) || {};
    data[QUALITY_SEARCH_APPLY_DASHBOARD_FILTERS_KEY] = localStorage.getItem(QUALITY_SEARCH_APPLY_DASHBOARD_FILTERS_KEY) !== 'false';
  }
  if (include('audit-trail')) data[DEFECT_AUDIT_KEY] = localStorageJson(DEFECT_AUDIT_KEY) || {};
  if (include('prediction-settings')) {
    data[PREDICTION_MODEL_KEY] = localStorageJson(PREDICTION_MODEL_KEY);
    data[PREDICTION_OVERRIDES_KEY] = localStorageJson(PREDICTION_OVERRIDES_KEY);
  }
  if (include('dashboard-filters')) data[DASHBOARD_FILTERS_KEY] = localStorageJson(DASHBOARD_FILTERS_KEY) || {};
  if (include('sync-queue')) data[QUALITY_SYNC_QUEUE_KEY] = localStorageJson(QUALITY_SYNC_QUEUE_KEY) || [];
  data[READ_NOTIFICATIONS_KEY] = localStorageJson(READ_NOTIFICATIONS_KEY) || [];

  return {
    backupType: 'quality-command-center-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    includedScopes: includeAll ? ['all'] : scopes,
    data,
  };
}

export function validateQualityBackup(input: unknown): QualityBackupValidation {
  if (!input || typeof input !== 'object') {
    return { valid: false, message: 'Backup is not a JSON object.', scopes: [], itemCounts: {} };
  }
  const backup = input as Partial<QualityBackupPayload>;
  if (backup.backupType !== 'quality-command-center-backup' || backup.version !== 1 || !backup.data || typeof backup.data !== 'object') {
    return { valid: false, message: 'Unsupported backup format.', scopes: [], itemCounts: {} };
  }
  const data = backup.data as Record<string, unknown>;
  return {
    valid: true,
    message: 'Backup is valid. Review the preview before restoring.',
    scopes: backup.includedScopes || [],
    itemCounts: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, countBackupItems(value)])),
  };
}

export function restoreQualityBackup(backup: QualityBackupPayload): void {
  const validation = validateQualityBackup(backup);
  if (!validation.valid) throw new Error(validation.message);
  Object.entries(backup.data).forEach(([key, value]) => {
    if (key === DEFECT_LOG_STORAGE_KEY) {
      restoreSafeLocalDefectRecords(Array.isArray(value) ? value : [], 'merge');
      return;
    }
    localStorage.setItem(key, JSON.stringify(value ?? null));
  });
}

export function downloadJsonFile(payload: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
