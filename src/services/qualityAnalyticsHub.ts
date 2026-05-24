import type { CapaData, DefectLogData, EightDData, NcrData } from '@/api/unified-api';
import { createQualityDataProvider, type QualityDataSnapshot } from '@/services/qualityDataProvider';
import {
  buildExecutiveRiskBoard,
  buildQualityCommandCenterSummary,
  buildQualityDataHealth,
  type DataConfidenceLabel,
  type QualityRiskItem,
} from '@/services/qualityRepository';
import {
  buildInspectionAnalytics,
  buildQualityExecutionBoardSummary,
  loadQualityInspectionPlans,
  loadQualityInspectionRuns,
  type QualityInspectionCheckItem,
  type QualityInspectionPlan,
  type QualityInspectionRun,
} from '@/services/qualityInspectionPlans';
import {
  buildLayeredAuditAnalytics,
  loadQualityAuditPlans,
  loadQualityAuditRuns,
  type QualityAuditRun,
} from '@/services/qualityLayeredAudits';
import {
  buildImprovementEffectivenessDashboard,
  type QualityImprovementAction,
} from '@/services/qualityImprovementActions';
import {
  buildQualityKnowledgeCommandSummary,
  type QualityKnowledgeItem,
} from '@/services/qualityKnowledgeBase';
import { loadQualityRelationships } from '@/services/qualityRelationships';
import { enqueueQualitySyncItem } from '@/services/qualitySyncQueue';

export const QUALITY_DASHBOARD_FILTERS_KEY = 'qms_quality_dashboard_filters_v1';

export type QualityDashboardDatePreset = 'all' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface QualityDashboardFilters {
  datePreset: QualityDashboardDatePreset;
  fromDate?: string;
  toDate?: string;
  factory?: string;
  workshop?: string;
  productionLine?: string;
  model?: string;
  partNumber?: string;
  defectType?: string;
  severity?: string;
  recordType?: string;
  shift?: string;
  supplier?: string;
  customer?: string;
  inspectionPoint?: string;
  actionStatus?: string;
  effectivenessStatus?: string;
  ncrStatus?: string;
  capaStatus?: string;
  eightDStatus?: string;
}

export interface QualityAnalyticsBarRow {
  label: string;
  count: number;
  value: number;
  percentage: number;
  route?: string;
}

export interface QualityAnalyticsTrendRow {
  period: string;
  name: string;
  defects: number;
  inspected: number;
  ppm: number;
  cost: number;
  open: number;
  target?: number;
}

export interface QualityAnalyticsWarning {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  route?: string;
}

export interface QualityPpmContributor {
  defect: string;
  line: string;
  model: string;
  inspectionPoint: string;
  defects: number;
  inspected: number;
  ppm: number;
  trend: number;
  route?: string;
}

export interface QualityCopqBreakdownRow {
  name: string;
  value: number;
  color: string;
}

export interface QualityOutgoingRecentRow {
  id?: string;
  shipment: string;
  customer: string;
  result: 'pass' | 'fail' | 'hold' | 'escape' | 'unknown';
  defects: number;
  holds: boolean;
  date: string;
}

export interface QualitySpcNumericPoint {
  date: string;
  planName: string;
  checkName: string;
  productionLine: string;
  inspectionPoint: string;
  measuredValue: number;
  lowerSpecLimit?: number;
  upperSpecLimit?: number;
  targetValue?: number;
  outOfSpec: boolean;
  linkedDefectId?: string;
}

export interface QualityAnalyticsSnapshot {
  filters: QualityDashboardFilters;
  dateRange: { from?: string; to?: string; label: string };
  loadedAt: string;
  sourceCounts: {
    defectRecords: number;
    inspectionPlans: number;
    inspectionRuns: number;
    auditPlans: number;
    auditRuns: number;
    ncr: number;
    capa: number;
    eightD: number;
    improvementActions: number;
    relationships: number;
    knowledgeItems: number;
    masterDataRows: number;
    syncQueueItems: number;
  };
  filteredDefectRecords: DefectLogData[];
  filteredInspectionRuns: QualityInspectionRun[];
  filteredAuditRuns: QualityAuditRun[];
  filteredActions: QualityImprovementAction[];
  defectMetrics: {
    totalRecords: number;
    totalDefectQuantity: number;
    openDefects: number;
    highSeverityOpen: number;
    repeatedDefects: number;
    trendData: QualityAnalyticsTrendRow[];
    distribution: QualityAnalyticsBarRow[];
    byLine: QualityAnalyticsBarRow[];
    byModel: QualityAnalyticsBarRow[];
    byDefectType: QualityAnalyticsBarRow[];
    byInspectionPoint: QualityAnalyticsBarRow[];
    topRisks: QualityRiskItem[];
  };
  ppmMetrics: {
    currentPpm: number;
    defectQuantity: number;
    inspectedQuantity: number;
    inspectedQuantityCompleteness: number;
    byLine: QualityAnalyticsBarRow[];
    byModel: QualityAnalyticsBarRow[];
    byDefectType: QualityAnalyticsBarRow[];
    byInspectionPoint: QualityAnalyticsBarRow[];
    trend: QualityAnalyticsTrendRow[];
    topContributors: QualityPpmContributor[];
    defectsCreatedFromFailedChecks: number;
    failedChecksWithoutDefect: number;
    confidence: DataConfidenceLabel;
    warnings: QualityAnalyticsWarning[];
  };
  copqMetrics: {
    totalCopq: number;
    internalFailure: number;
    externalFailure: number;
    appraisal: number;
    prevention: number;
    customerReturnCost: number;
    copqReductionFromEffectiveActions: number;
    breakdown: QualityCopqBreakdownRow[];
    trend: Array<{ month: string; internal: number; external: number; appraisal: number; prevention: number }>;
    byDefectType: QualityAnalyticsBarRow[];
    byLine: QualityAnalyticsBarRow[];
    byModel: QualityAnalyticsBarRow[];
    bySupplier: QualityAnalyticsBarRow[];
    topCostDrivers: Array<{ driver: string; category: string; cost: number; trend: number; route?: string }>;
    missingCostRecords: number;
    confidence: DataConfidenceLabel;
    warnings: QualityAnalyticsWarning[];
  };
  outgoingMetrics: {
    outgoingInspections: number;
    shipments: number;
    passRate: number;
    holds: number;
    failures: number;
    escapes: number;
    customerReturns: number;
    averageReleaseTimeHrs: number;
    byCustomer: QualityAnalyticsBarRow[];
    byModel: QualityAnalyticsBarRow[];
    releaseTrend: Array<{ day: string; releaseHrs: number; passRate: number; holds: number; failures: number }>;
    recent: QualityOutgoingRecentRow[];
    linkedEscalations: number;
    holdsWithoutAction: number;
    missingOutgoingResult: number;
    confidence: DataConfidenceLabel;
    warnings: QualityAnalyticsWarning[];
  };
  inspectionExecutionMetrics: ReturnType<typeof buildInspectionAnalytics> & {
    activePlans: number;
    failedChecksWithoutDefect: number;
    evidenceMissingCount: number;
    overdueIncompleteRuns: number;
    lineStatus: ReturnType<typeof buildQualityExecutionBoardSummary>['lineStatus'];
  };
  auditMetrics: ReturnType<typeof buildLayeredAuditAnalytics>;
  escalationMetrics: {
    openNcrs: number;
    openCapas: number;
    openEightD: number;
    ncrsWaitingCapa: number;
    capasPendingVerification: number;
    notEffectiveCapas: number;
    linkedEscalationActions: number;
  };
  actionEffectivenessMetrics: ReturnType<typeof buildImprovementEffectivenessDashboard> & {
    ppmReduction: number;
    defectReduction: number;
    customerReturnReduction: number;
    auditFindingReduction: number;
    confidence: DataConfidenceLabel;
  };
  knowledgeMetrics: ReturnType<typeof buildQualityKnowledgeCommandSummary> & {
    repeatedDefectsWithoutLessons: QualityAnalyticsBarRow[];
    mostUsedLessons: QualityAnalyticsBarRow[];
    feedbackScore: number;
  };
  spcMetrics: {
    defectQuantitySeries: QualityAnalyticsTrendRow[];
    ppmSeries: QualityAnalyticsTrendRow[];
    numericInspectionSeries: QualitySpcNumericPoint[];
    outOfSpecPoints: number;
    linkedDefectRecords: number;
  };
  riskMetrics: {
    topRisks: QualityRiskItem[];
    openHighSeverity: number;
    repeatedDefects: number;
    overdueSla: number;
    notEffectiveActions: number;
    knowledgeGaps: number;
  };
  dataQualityMetrics: {
    missingInspectedQuantity: number;
    missingEstimatedCost: number;
    missingRecordType: number;
    missingOutgoingResult: number;
    missingMasterDataSnapshot: number;
    failedChecksWithoutDefect: number;
    actionsWithoutOwner: number;
    actionsWithoutDueDate: number;
    knowledgeGapsForRepeatedDefects: number;
    warnings: QualityAnalyticsWarning[];
  };
  dashboardConfidenceLabels: Record<string, DataConfidenceLabel>;
  managementSummary: string;
}

const emptyFilters: QualityDashboardFilters = {
  datePreset: 'all',
};

const colors = ['#00A3E0', '#EF4444', '#F59E0B', '#8B5CF6', '#10B981', '#F97316', '#06B6D4', '#84CC16'];

function clean(value: unknown): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function lower(value: unknown): string {
  return clean(value).toLowerCase();
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function quantityOf(record: DefectLogData): number {
  return Math.max(0, toNumber(record.quantity));
}

function inspectedOf(record: DefectLogData): number {
  return Math.max(0, toNumber(record.inspectedQuantity || record.productionQuantity));
}

function costOf(record: DefectLogData): number {
  const explicit = toNumber(record.estimatedCost);
  const unitCost = toNumber(record.unitCostAtTime || record.unitCost);
  return Math.max(0, explicit || (unitCost > 0 ? unitCost * Math.max(1, quantityOf(record)) : 0));
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dayKey(value?: string): string {
  const parsed = parseDate(value);
  return parsed ? parsed.toISOString().split('T')[0] : clean(value) || 'No date';
}

function monthKey(value?: string): string {
  return dayKey(value).slice(0, 7);
}

function recordDate(record: DefectLogData): string | undefined {
  return record.date || record.createdAt || record.loggedAt || record.updatedAt;
}

function runDate(run: QualityInspectionRun | QualityAuditRun): string | undefined {
  return run.startedAt || run.completedAt;
}

function dateRangeFromPreset(preset: QualityDashboardDatePreset): { from?: string; to?: string; label: string } {
  if (preset === 'all') return { label: 'All available dates' };
  if (preset === 'custom') return { label: 'Custom date range' };
  const days = preset === 'week' ? 7 : preset === 'month' ? 30 : preset === 'quarter' ? 90 : 365;
  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  return {
    from: from.toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
    label: `Last ${days} days`,
  };
}

function normalizedFilters(filters?: Partial<QualityDashboardFilters>): QualityDashboardFilters {
  return {
    ...emptyFilters,
    ...(filters || {}),
    datePreset: filters?.datePreset || 'all',
  };
}

function matchesText(actual: unknown, expected?: string): boolean {
  if (!clean(expected)) return true;
  return lower(actual).includes(lower(expected));
}

function matchesDate(value: string | undefined, filters: QualityDashboardFilters): boolean {
  const range = filters.datePreset === 'custom'
    ? { from: filters.fromDate, to: filters.toDate }
    : dateRangeFromPreset(filters.datePreset);
  if (!range.from && !range.to) return true;
  const parsed = parseDate(value);
  if (!parsed) return false;
  if (range.from) {
    const from = parseDate(range.from);
    if (from && parsed < from) return false;
  }
  if (range.to) {
    const to = parseDate(range.to);
    if (to) {
      to.setHours(23, 59, 59, 999);
      if (parsed > to) return false;
    }
  }
  return true;
}

function recordType(record: DefectLogData): string {
  const raw = lower(record.recordType);
  if (raw === 'defect-cost' || raw === 'copq') return 'defect-cost';
  if (raw === 'outgoing-quality' || raw === 'outgoing') return 'outgoing-quality';
  if (raw === 'customer-return' || raw === 'returns' || raw === 'return') return 'customer-return';
  if (record.returnReference) return 'customer-return';
  if (record.outgoingResult) return 'outgoing-quality';
  if (toNumber(record.estimatedCost) > 0 || record.costCategory) return 'defect-cost';
  return 'process-ppm';
}

function isOpenStatus(status: unknown): boolean {
  const value = lower(status || 'open');
  return !['closed', 'completed', 'done', 'cancelled', 'rejected', 'effective'].includes(value);
}

function statusMatches(rowStatus: unknown, filterStatus?: string): boolean {
  return !clean(filterStatus) || lower(rowStatus).includes(lower(filterStatus));
}

function filterDefects(records: DefectLogData[], filters: QualityDashboardFilters): DefectLogData[] {
  return records.filter((record) => (
    matchesDate(recordDate(record), filters)
    && matchesText(record.factory, filters.factory)
    && matchesText(record.workshop, filters.workshop)
    && matchesText(record.productionLine, filters.productionLine)
    && matchesText(record.model, filters.model)
    && matchesText(record.partNumber || record.partId, filters.partNumber)
    && matchesText(record.defectType, filters.defectType)
    && matchesText(record.severity, filters.severity)
    && matchesText(recordType(record), filters.recordType)
    && matchesText(record.shift, filters.shift)
    && matchesText(record.supplierNameAtTime || record.supplierName, filters.supplier)
    && matchesText(record.customerName, filters.customer)
    && matchesText(record.defaultInspectionPoint, filters.inspectionPoint)
  ));
}

function filterInspectionRuns(runs: QualityInspectionRun[], filters: QualityDashboardFilters): QualityInspectionRun[] {
  return runs.filter((run) => (
    matchesDate(runDate(run), filters)
    && matchesText(run.productionLine, filters.productionLine)
    && matchesText(run.model, filters.model)
    && matchesText(run.inspectionPoint, filters.inspectionPoint)
  ));
}

function filterAuditRuns(runs: QualityAuditRun[], filters: QualityDashboardFilters): QualityAuditRun[] {
  return runs.filter((run) => (
    matchesDate(runDate(run), filters)
    && matchesText(run.productionLine, filters.productionLine)
    && matchesText(run.inspectionPoint, filters.inspectionPoint)
  ));
}

function filterActions(actions: QualityImprovementAction[], filters: QualityDashboardFilters): QualityImprovementAction[] {
  return actions.filter((action) => (
    matchesDate(action.createdAt || action.updatedAt, filters)
    && statusMatches(action.status, filters.actionStatus)
    && statusMatches(action.effectivenessResult, filters.effectivenessStatus)
    && matchesText(action.linkedProductionLine, filters.productionLine)
    && matchesText(action.linkedModel, filters.model)
    && matchesText(action.linkedPartNumber, filters.partNumber)
    && matchesText(action.linkedDefectType, filters.defectType)
    && matchesText(action.linkedSupplier, filters.supplier)
    && matchesText(action.linkedCustomer, filters.customer)
  ));
}

function filterNcr(rows: NcrData[], filters: QualityDashboardFilters): NcrData[] {
  return rows.filter((row) => matchesDate(row.detectedDate || row.createdAt, filters) && statusMatches(row.status, filters.ncrStatus));
}

function filterCapa(rows: CapaData[], filters: QualityDashboardFilters): CapaData[] {
  return rows.filter((row) => matchesDate(row.createdAt || row.targetCloseDate, filters) && statusMatches(row.status, filters.capaStatus));
}

function filterEightD(rows: EightDData[], filters: QualityDashboardFilters): EightDData[] {
  return rows.filter((row) => matchesDate(row.createdAt || row.updatedAt, filters) && statusMatches(row.status, filters.eightDStatus));
}

function groupRows<T>(rows: T[], labeler: (row: T) => string, valuer: (row: T) => number = () => 1): QualityAnalyticsBarRow[] {
  const map = new Map<string, { count: number; value: number }>();
  rows.forEach((row) => {
    const label = clean(labeler(row)) || 'Unassigned';
    const current = map.get(label) || { count: 0, value: 0 };
    map.set(label, { count: current.count + 1, value: current.value + valuer(row) });
  });
  const total = [...map.values()].reduce((sum, item) => sum + item.value, 0);
  return [...map.entries()]
    .map(([label, value]) => ({
      label,
      count: value.count,
      value: Math.round(value.value * 100) / 100,
      percentage: total > 0 ? Math.round((value.value / total) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value || b.count - a.count);
}

function buildTrend(records: DefectLogData[]): QualityAnalyticsTrendRow[] {
  const byDay = new Map<string, DefectLogData[]>();
  records.forEach((record) => {
    const key = dayKey(recordDate(record));
    byDay.set(key, [...(byDay.get(key) || []), record]);
  });
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, rows]) => {
      const defects = rows.reduce((sum, row) => sum + quantityOf(row), 0);
      const inspected = rows.reduce((sum, row) => sum + inspectedOf(row), 0);
      return {
        period,
        name: period,
        defects,
        inspected,
        ppm: inspected > 0 ? Math.round((defects / inspected) * 1_000_000) : 0,
        cost: rows.reduce((sum, row) => sum + costOf(row), 0),
        open: defects,
        target: 0,
      };
    });
}

function confidenceFor(records: number, completeness = 100, warnings = 0): DataConfidenceLabel {
  if (records < 5 || completeness < 30) return 'Insufficient Data';
  if (records < 20 || completeness < 60 || warnings >= 4) return 'Weak Signal';
  if (records >= 80 && completeness >= 80 && warnings <= 1) return 'Strong Signal';
  return 'Moderate Signal';
}

function normalizeCostCategory(record: DefectLogData): 'internalFailure' | 'externalFailure' | 'appraisal' | 'prevention' {
  const category = lower(record.costCategory);
  if (recordType(record) === 'customer-return' || category.includes('external')) return 'externalFailure';
  if (category.includes('appraisal')) return 'appraisal';
  if (category.includes('prevention')) return 'prevention';
  return 'internalFailure';
}

function repeatedDefectGroups(records: DefectLogData[]): QualityAnalyticsBarRow[] {
  return groupRows(
    records,
    (record) => [record.defectType, record.productionLine, record.partNumber || record.partId, record.model].map(clean).filter(Boolean).join(' / '),
    () => 1,
  ).filter((item) => item.count > 1);
}

function activeKnowledgeDefectKeys(items: QualityKnowledgeItem[]): Set<string> {
  return new Set(items
    .filter((item) => item.status === 'active')
    .flatMap((item) => [item.defectType, item.defectCategory, ...(item.tags || [])])
    .map(lower)
    .filter(Boolean));
}

function hasMasterSnapshot(record: DefectLogData): boolean {
  return Boolean(record.masterDataVersion || record.partNameAtTime || record.defectCategoryAtTime || record.productionLineAtTime);
}

function buildNumericInspectionSeries(
  runs: QualityInspectionRun[],
  plans: QualityInspectionPlan[],
): QualitySpcNumericPoint[] {
  const planMap = new Map(plans.map((plan) => [plan.id, plan]));
  const checkMap = new Map<string, QualityInspectionCheckItem>();
  plans.forEach((plan) => plan.checkItems.forEach((item) => checkMap.set(item.id, item)));
  return runs.flatMap((run) => run.checkResults.flatMap((result) => {
    const measuredValue = toNumber(result.measuredValue);
    const item = checkMap.get(result.checkItemId);
    if (!item || item.inputType !== 'numeric' || !Number.isFinite(measuredValue) || clean(result.measuredValue) === '') return [];
    const plan = planMap.get(run.inspectionPlanId);
    const outOfSpec = (item.lowerSpecLimit !== undefined && measuredValue < item.lowerSpecLimit)
      || (item.upperSpecLimit !== undefined && measuredValue > item.upperSpecLimit);
    return [{
      date: dayKey(run.startedAt),
      planName: plan?.planName || run.inspectionPlanId,
      checkName: item.checkName,
      productionLine: run.productionLine || plan?.productionLine || 'Unassigned',
      inspectionPoint: run.inspectionPoint || plan?.inspectionPoint || 'Unassigned',
      measuredValue,
      lowerSpecLimit: item.lowerSpecLimit,
      upperSpecLimit: item.upperSpecLimit,
      targetValue: item.targetValue,
      outOfSpec,
      linkedDefectId: result.createdDefectId,
    }];
  })).sort((a, b) => a.date.localeCompare(b.date));
}

function buildPpmContributors(records: DefectLogData[]): QualityPpmContributor[] {
  const groups = new Map<string, DefectLogData[]>();
  records.forEach((record) => {
    const key = [
      record.defectType || 'Unclassified',
      record.productionLine || 'Unassigned line',
      record.model || 'Unassigned model',
      record.defaultInspectionPoint || 'Unassigned point',
    ].join('|');
    groups.set(key, [...(groups.get(key) || []), record]);
  });
  return [...groups.entries()]
    .map(([key, rows]) => {
      const [defect, line, model, inspectionPoint] = key.split('|');
      const defects = rows.reduce((sum, row) => sum + quantityOf(row), 0);
      const inspected = rows.reduce((sum, row) => sum + inspectedOf(row), 0);
      return {
        defect,
        line,
        model,
        inspectionPoint,
        defects,
        inspected,
        ppm: inspected > 0 ? Math.round((defects / inspected) * 1_000_000) : 0,
        trend: 0,
        route: `/process-ppm?defectType=${encodeURIComponent(defect)}&productionLine=${encodeURIComponent(line)}`,
      };
    })
    .sort((a, b) => b.ppm - a.ppm || b.defects - a.defects)
    .slice(0, 12);
}

export function loadQualityDashboardFilters(): QualityDashboardFilters {
  if (typeof localStorage === 'undefined') return emptyFilters;
  try {
    const parsed = JSON.parse(localStorage.getItem(QUALITY_DASHBOARD_FILTERS_KEY) || '{}') as Partial<QualityDashboardFilters>;
    return normalizedFilters(parsed);
  } catch {
    return emptyFilters;
  }
}

export function saveQualityDashboardFilters(filters: QualityDashboardFilters, enqueue = true): QualityDashboardFilters {
  const normalized = normalizedFilters(filters);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(QUALITY_DASHBOARD_FILTERS_KEY, JSON.stringify(normalized));
  }
  if (enqueue) {
    enqueueQualitySyncItem({
      entityType: 'dashboard',
      entityId: 'quality-dashboard-filters',
      operation: 'dashboard-filter-updated',
      payloadSummary: 'Shared quality dashboard filters updated locally.',
    });
  }
  return normalized;
}

export function resetQualityDashboardFilters(): QualityDashboardFilters {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(QUALITY_DASHBOARD_FILTERS_KEY);
  enqueueQualitySyncItem({
    entityType: 'dashboard',
    entityId: 'quality-dashboard-filters',
    operation: 'dashboard-filter-updated',
    payloadSummary: 'Shared quality dashboard filters reset locally.',
  });
  return emptyFilters;
}

export function periodToQualityDashboardFilters(
  period: Exclude<QualityDashboardDatePreset, 'custom' | 'all'>,
  base: QualityDashboardFilters = loadQualityDashboardFilters(),
): QualityDashboardFilters {
  const range = dateRangeFromPreset(period);
  return {
    ...base,
    datePreset: period,
    fromDate: range.from,
    toDate: range.to,
  };
}

export async function loadQualityAnalyticsSnapshot(filters = loadQualityDashboardFilters()): Promise<QualityAnalyticsSnapshot> {
  const provider = createQualityDataProvider('local');
  const source = await provider.loadSnapshot();
  return buildQualityAnalyticsSnapshot(source, filters);
}

export function buildQualityAnalyticsSnapshot(
  source: QualityDataSnapshot,
  inputFilters: Partial<QualityDashboardFilters> = {},
): QualityAnalyticsSnapshot {
  const filters = normalizedFilters(inputFilters);
  const dateRange = filters.datePreset === 'custom'
    ? { from: filters.fromDate, to: filters.toDate, label: 'Custom date range' }
    : dateRangeFromPreset(filters.datePreset);
  const inspectionPlans = loadQualityInspectionPlans(true);
  const inspectionRuns = filterInspectionRuns(loadQualityInspectionRuns(), filters);
  const auditPlans = loadQualityAuditPlans(true);
  const auditRuns = filterAuditRuns(loadQualityAuditRuns(), filters);
  const relationships = loadQualityRelationships(true);
  const defects = filterDefects(source.defectRecords, filters);
  const ncr = filterNcr(source.ncr, filters);
  const capa = filterCapa(source.capa, filters);
  const eightD = filterEightD(source.eightD, filters);
  const actions = filterActions(source.improvementActions, filters);
  const processRecords = defects.filter((record) => recordType(record) === 'process-ppm');
  const costRecords = defects.filter((record) => costOf(record) > 0 || ['defect-cost', 'customer-return'].includes(recordType(record)));
  const outgoingRecords = defects.filter((record) => recordType(record) === 'outgoing-quality');
  const returnRecords = defects.filter((record) => recordType(record) === 'customer-return');
  const failedChecks = inspectionRuns.flatMap((run) => run.checkResults.map((result) => ({ run, result }))).filter(({ result }) => result.result === 'fail');
  const failedChecksWithoutDefect = failedChecks.filter(({ result }) => !result.createdDefectId).length;
  const execution = buildQualityExecutionBoardSummary({ plans: inspectionPlans, runs: inspectionRuns, defects });
  const inspectionAnalytics = buildInspectionAnalytics(inspectionRuns, inspectionPlans);
  const auditAnalytics = buildLayeredAuditAnalytics(auditPlans, auditRuns);
  const improvement = buildImprovementEffectivenessDashboard(actions, defects);
  const commandSummary = buildQualityCommandCenterSummary({
    ...source,
    defectRecords: defects,
    ncr,
    capa,
    eightD,
    improvementActions: actions,
  });
  const dataHealth = buildQualityDataHealth({
    ...source,
    defectRecords: defects,
    ncr,
    capa,
    eightD,
    improvementActions: actions,
  });
  const riskBoard = buildExecutiveRiskBoard({
    ...source,
    defectRecords: defects,
    ncr,
    capa,
    eightD,
    improvementActions: actions,
  });
  const totalDefectQuantity = defects.reduce((sum, record) => sum + quantityOf(record), 0);
  const inspectedQuantity = processRecords.reduce((sum, record) => sum + inspectedOf(record), 0);
  const currentPpm = inspectedQuantity > 0 ? Math.round((processRecords.reduce((sum, record) => sum + quantityOf(record), 0) / inspectedQuantity) * 1_000_000) : 0;
  const missingInspectedQuantity = processRecords.filter((record) => inspectedOf(record) <= 0).length;
  const inspectedCompleteness = processRecords.length ? Math.round(((processRecords.length - missingInspectedQuantity) / processRecords.length) * 100) : 0;
  const costBuckets = { internalFailure: 0, externalFailure: 0, appraisal: 0, prevention: 0 };
  costRecords.forEach((record) => {
    costBuckets[normalizeCostCategory(record)] += costOf(record);
  });
  const totalCopq = costBuckets.internalFailure + costBuckets.externalFailure + costBuckets.appraisal + costBuckets.prevention;
  const passedOutgoing = outgoingRecords.filter((record) => lower(record.outgoingResult) === 'pass').length;
  const holds = outgoingRecords.filter((record) => lower(record.outgoingResult) === 'hold').length;
  const failures = outgoingRecords.filter((record) => lower(record.outgoingResult) === 'fail').length;
  const escapes = failures + returnRecords.length + outgoingRecords.filter((record) => lower(record.outgoingResult) === 'escape').length;
  const repeatedGroups = repeatedDefectGroups(defects);
  const knowledgeKeys = activeKnowledgeDefectKeys(source.qualityKnowledge);
  const repeatedWithoutLessons = repeatedGroups.filter((group) => !knowledgeKeys.has(lower(group.label.split('/')[0])));
  const missingEstimatedCost = costRecords.filter((record) => costOf(record) <= 0).length;
  const missingRecordType = defects.filter((record) => !clean(record.recordType)).length;
  const missingOutgoingResult = outgoingRecords.filter((record) => !clean(record.outgoingResult)).length;
  const missingMasterDataSnapshot = defects.filter((record) => !hasMasterSnapshot(record)).length;
  const actionsWithoutOwner = actions.filter((action) => !clean(action.owner)).length;
  const actionsWithoutDueDate = actions.filter((action) => !clean(action.dueDate)).length;
  const numericInspectionSeries = buildNumericInspectionSeries(inspectionRuns, inspectionPlans);
  const warnings: QualityAnalyticsWarning[] = [];

  if (missingInspectedQuantity > 0) warnings.push({ id: 'missing-inspected', severity: 'warning', title: 'Missing inspected quantity', message: `${missingInspectedQuantity} process record(s) cannot fully support PPM accuracy.`, route: '/process-ppm' });
  if (missingEstimatedCost > 0) warnings.push({ id: 'missing-cost', severity: 'warning', title: 'Missing estimated cost', message: `${missingEstimatedCost} cost-related record(s) have no usable cost value.`, route: '/defect-cost' });
  if (missingRecordType > 0) warnings.push({ id: 'missing-record-type', severity: 'warning', title: 'Missing record type', message: `${missingRecordType} defect record(s) need recordType for routing consistency.`, route: '/defect-log' });
  if (missingOutgoingResult > 0) warnings.push({ id: 'missing-outgoing-result', severity: 'warning', title: 'Missing outgoing result', message: `${missingOutgoingResult} outgoing record(s) need pass/hold/fail result.`, route: '/outgoing-quality' });
  if (failedChecksWithoutDefect > 0) warnings.push({ id: 'failed-checks-no-defect', severity: 'critical', title: 'Failed checks without defect', message: `${failedChecksWithoutDefect} failed inspection check(s) are not linked to defect records yet.`, route: '/quality-execution-board' });
  if (actionsWithoutOwner > 0 || actionsWithoutDueDate > 0) warnings.push({ id: 'action-ownership', severity: 'warning', title: 'Action ownership gaps', message: `${actionsWithoutOwner} action(s) lack owner and ${actionsWithoutDueDate} action(s) lack due date.`, route: '/quality-command-center' });
  if (repeatedWithoutLessons.length > 0) warnings.push({ id: 'knowledge-gaps', severity: 'info', title: 'Knowledge gap', message: `${repeatedWithoutLessons.length} repeated defect signal(s) do not have an active lesson yet.`, route: '/quality-knowledge-base' });

  const sourceCounts = {
    defectRecords: source.defectRecords.length,
    inspectionPlans: inspectionPlans.length,
    inspectionRuns: loadQualityInspectionRuns().length,
    auditPlans: auditPlans.length,
    auditRuns: loadQualityAuditRuns().length,
    ncr: source.ncr.length,
    capa: source.capa.length,
    eightD: source.eightD.length,
    improvementActions: source.improvementActions.length,
    relationships: relationships.length,
    knowledgeItems: source.qualityKnowledge.length,
    masterDataRows: Object.values(source.masterData).reduce((sum, rows) => sum + rows.length, 0),
    syncQueueItems: source.syncQueue.length,
  };

  const confidenceLabels = {
    defects: confidenceFor(defects.length, defects.length ? Math.round(((defects.length - missingRecordType) / defects.length) * 100) : 100, warnings.length),
    ppm: confidenceFor(processRecords.length, inspectedCompleteness, missingInspectedQuantity),
    copq: confidenceFor(costRecords.length, costRecords.length ? Math.round(((costRecords.length - missingEstimatedCost) / costRecords.length) * 100) : 100, missingEstimatedCost),
    outgoing: confidenceFor(outgoingRecords.length, outgoingRecords.length ? Math.round(((outgoingRecords.length - missingOutgoingResult) / outgoingRecords.length) * 100) : 100, missingOutgoingResult),
    inspection: confidenceFor(inspectionRuns.length, inspectionAnalytics.planCompliance, failedChecksWithoutDefect),
    audit: confidenceFor(auditRuns.length, auditAnalytics.completionRate, auditAnalytics.criticalFindings),
    actions: confidenceFor(actions.length, actions.length ? Math.round(((actions.length - actionsWithoutOwner - actionsWithoutDueDate) / actions.length) * 100) : 100, actionsWithoutOwner + actionsWithoutDueDate),
    knowledge: confidenceFor(source.qualityKnowledge.length, repeatedWithoutLessons.length ? 50 : 100, repeatedWithoutLessons.length),
  } satisfies Record<string, DataConfidenceLabel>;

  const knowledgeSummary = buildQualityKnowledgeCommandSummary({
    knowledge: source.qualityKnowledge,
    defects,
    actions,
  });
  const topDefectLabels = groupRows(defects, (record) => record.defectType || 'Unclassified', quantityOf);
  const topLine = groupRows(defects, (record) => record.productionLine || 'Unassigned', quantityOf)[0];
  const topRisk = riskBoard[0];
  const managementSummary = defects.length
    ? `Largest defect signal is ${topDefectLabels[0]?.label || 'not classified'} with ${topDefectLabels[0]?.percentage || 0}% of defect quantity. ${topLine ? `Top affected line is ${topLine.label}. ` : ''}${topRisk ? `Suggested management focus: ${topRisk.title} requires verification.` : 'Prioritize data completion and daily review.'}`
    : 'No real defect records are available yet. Start with master data, form setup, inspection execution, and defect registration.';

  return {
    filters,
    dateRange,
    loadedAt: new Date().toISOString(),
    sourceCounts,
    filteredDefectRecords: defects,
    filteredInspectionRuns: inspectionRuns,
    filteredAuditRuns: auditRuns,
    filteredActions: actions,
    defectMetrics: {
      totalRecords: defects.length,
      totalDefectQuantity,
      openDefects: defects.filter((record) => isOpenStatus(record.status)).length,
      highSeverityOpen: commandSummary.highSeverityOpen,
      repeatedDefects: repeatedGroups.length,
      trendData: buildTrend(defects),
      distribution: topDefectLabels.map((item, index) => ({ ...item, route: `/quality-search?q=${encodeURIComponent(item.label)}`, color: colors[index % colors.length] } as QualityAnalyticsBarRow)),
      byLine: groupRows(defects, (record) => record.productionLine || 'Unassigned', quantityOf),
      byModel: groupRows(defects, (record) => record.model || 'Unassigned', quantityOf),
      byDefectType: topDefectLabels,
      byInspectionPoint: groupRows(defects, (record) => record.defaultInspectionPoint || 'Unassigned', quantityOf),
      topRisks: riskBoard,
    },
    ppmMetrics: {
      currentPpm,
      defectQuantity: processRecords.reduce((sum, record) => sum + quantityOf(record), 0),
      inspectedQuantity,
      inspectedQuantityCompleteness: inspectedCompleteness,
      byLine: groupRows(processRecords, (record) => record.productionLine || 'Unassigned', quantityOf).map((row) => {
        const rows = processRecords.filter((record) => clean(record.productionLine || 'Unassigned') === row.label);
        const inspected = rows.reduce((sum, record) => sum + inspectedOf(record), 0);
        return { ...row, value: inspected > 0 ? Math.round((row.value / inspected) * 1_000_000) : 0 };
      }),
      byModel: groupRows(processRecords, (record) => record.model || 'Unassigned', quantityOf),
      byDefectType: groupRows(processRecords, (record) => record.defectType || 'Unclassified', quantityOf),
      byInspectionPoint: groupRows(processRecords, (record) => record.defaultInspectionPoint || 'Unassigned', quantityOf),
      trend: buildTrend(processRecords),
      topContributors: buildPpmContributors(processRecords),
      defectsCreatedFromFailedChecks: new Set(inspectionRuns.flatMap((run) => run.createdDefectIds || [])).size,
      failedChecksWithoutDefect,
      confidence: confidenceLabels.ppm,
      warnings: warnings.filter((warning) => ['missing-inspected', 'failed-checks-no-defect'].includes(warning.id)),
    },
    copqMetrics: {
      totalCopq,
      internalFailure: costBuckets.internalFailure,
      externalFailure: costBuckets.externalFailure,
      appraisal: costBuckets.appraisal,
      prevention: costBuckets.prevention,
      customerReturnCost: returnRecords.reduce((sum, record) => sum + costOf(record), 0),
      copqReductionFromEffectiveActions: improvement.estimatedCopqReduction,
      breakdown: [
        { name: 'Internal Failure', value: costBuckets.internalFailure, color: '#F97316' },
        { name: 'External Failure', value: costBuckets.externalFailure, color: '#DC2626' },
        { name: 'Appraisal', value: costBuckets.appraisal, color: '#3B82F6' },
        { name: 'Prevention', value: costBuckets.prevention, color: '#22C55E' },
      ].filter((item) => item.value > 0),
      trend: groupRows(costRecords, (record) => monthKey(recordDate(record)), costOf)
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((month) => {
          const rows = costRecords.filter((record) => monthKey(recordDate(record)) === month.label);
          return {
            month: month.label,
            internal: rows.filter((record) => normalizeCostCategory(record) === 'internalFailure').reduce((sum, record) => sum + costOf(record), 0),
            external: rows.filter((record) => normalizeCostCategory(record) === 'externalFailure').reduce((sum, record) => sum + costOf(record), 0),
            appraisal: rows.filter((record) => normalizeCostCategory(record) === 'appraisal').reduce((sum, record) => sum + costOf(record), 0),
            prevention: rows.filter((record) => normalizeCostCategory(record) === 'prevention').reduce((sum, record) => sum + costOf(record), 0),
          };
        }),
      byDefectType: groupRows(costRecords, (record) => record.defectType || 'Unclassified', costOf),
      byLine: groupRows(costRecords, (record) => record.productionLine || 'Unassigned', costOf),
      byModel: groupRows(costRecords, (record) => record.model || 'Unassigned', costOf),
      bySupplier: groupRows(costRecords, (record) => record.supplierNameAtTime || record.supplierName || 'Unassigned', costOf),
      topCostDrivers: groupRows(costRecords, (record) => record.defectType || record.costCategory || 'Unclassified cost', costOf).slice(0, 12).map((item) => ({
        driver: item.label,
        category: 'COPQ',
        cost: item.value,
        trend: 0,
        route: `/defect-cost?driver=${encodeURIComponent(item.label)}`,
      })),
      missingCostRecords: missingEstimatedCost,
      confidence: confidenceLabels.copq,
      warnings: warnings.filter((warning) => warning.id === 'missing-cost'),
    },
    outgoingMetrics: {
      outgoingInspections: outgoingRecords.length,
      shipments: outgoingRecords.length,
      passRate: outgoingRecords.length ? Math.round((passedOutgoing / outgoingRecords.length) * 100) : 0,
      holds,
      failures,
      escapes,
      customerReturns: returnRecords.length,
      averageReleaseTimeHrs: outgoingRecords.length ? Number((outgoingRecords.reduce((sum, record) => sum + toNumber(record.releaseTimeHrs), 0) / outgoingRecords.length).toFixed(1)) : 0,
      byCustomer: groupRows([...outgoingRecords, ...returnRecords], (record) => record.customerName || 'Unassigned customer', () => 1),
      byModel: groupRows([...outgoingRecords, ...returnRecords], (record) => record.model || 'Unassigned model', () => 1),
      releaseTrend: groupRows(outgoingRecords, (record) => dayKey(recordDate(record)), () => 1)
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((day) => {
          const rows = outgoingRecords.filter((record) => dayKey(recordDate(record)) === day.label);
          return {
            day: day.label,
            releaseHrs: rows.length ? Number((rows.reduce((sum, record) => sum + toNumber(record.releaseTimeHrs), 0) / rows.length).toFixed(1)) : 0,
            passRate: rows.length ? Math.round((rows.filter((record) => lower(record.outgoingResult) === 'pass').length / rows.length) * 100) : 0,
            holds: rows.filter((record) => lower(record.outgoingResult) === 'hold').length,
            failures: rows.filter((record) => lower(record.outgoingResult) === 'fail').length,
          };
        }),
      recent: outgoingRecords.slice(0, 12).map((record) => {
        const result = lower(record.outgoingResult);
        const normalizedResult = ['pass', 'fail', 'hold', 'escape'].includes(result) ? result as QualityOutgoingRecentRow['result'] : 'unknown';
        return {
          id: record.id,
          shipment: record.shipmentId || record.partId || record.partNumber || '--',
          customer: record.customerName || '--',
          result: normalizedResult,
          defects: quantityOf(record),
          holds: normalizedResult === 'hold',
          date: dayKey(recordDate(record)),
        };
      }),
      linkedEscalations: outgoingRecords.filter((record) => record.relatedNcrId || record.relatedCapaId || record.relatedEightDId).length,
      holdsWithoutAction: outgoingRecords.filter((record) => lower(record.outgoingResult) === 'hold' && !(record.relatedActionIds || []).length).length,
      missingOutgoingResult,
      confidence: confidenceLabels.outgoing,
      warnings: warnings.filter((warning) => warning.id === 'missing-outgoing-result'),
    },
    inspectionExecutionMetrics: {
      ...inspectionAnalytics,
      activePlans: inspectionPlans.filter((plan) => plan.status === 'active').length,
      failedChecksWithoutDefect,
      evidenceMissingCount: execution.overview.evidenceMissingCount,
      overdueIncompleteRuns: execution.overview.overdueIncompleteRuns,
      lineStatus: execution.lineStatus,
    },
    auditMetrics: auditAnalytics,
    escalationMetrics: {
      openNcrs: ncr.filter((row) => isOpenStatus(row.status)).length,
      openCapas: capa.filter((row) => isOpenStatus(row.status)).length,
      openEightD: eightD.filter((row) => isOpenStatus(row.status)).length,
      ncrsWaitingCapa: ncr.filter((row) => isOpenStatus(row.status) && !row.relatedCapaId && !(row.relatedCapaIds || []).length).length,
      capasPendingVerification: capa.filter((row) => lower(row.status).includes('pending') || lower(row.status).includes('verification')).length,
      notEffectiveCapas: capa.filter((row) => lower(row.effectivenessResult).includes('not')).length,
      linkedEscalationActions: actions.filter((action) => action.relatedNcrId || action.relatedCapaId || action.relatedEightDId).length,
    },
    actionEffectivenessMetrics: {
      ...improvement,
      ppmReduction: improvement.topActionsByImprovement.reduce((sum, item) => sum + Math.max(0, item.result.comparisons.find((metric) => metric.metric === 'ppm')?.improvementPercent || 0), 0),
      defectReduction: improvement.topActionsByImprovement.reduce((sum, item) => sum + Math.max(0, item.result.comparisons.find((metric) => metric.metric === 'defectQuantity')?.improvementPercent || 0), 0),
      customerReturnReduction: improvement.topActionsByImprovement.reduce((sum, item) => sum + Math.max(0, item.result.comparisons.find((metric) => metric.metric === 'customerReturns')?.improvementPercent || 0), 0),
      auditFindingReduction: auditAnalytics.repeatFindings > 0 && improvement.effectiveActions > 0 ? Math.min(100, improvement.effectiveActions * 10) : 0,
      confidence: confidenceLabels.actions,
    },
    knowledgeMetrics: {
      ...knowledgeSummary,
      repeatedDefectsWithoutLessons: repeatedWithoutLessons,
      mostUsedLessons: groupRows(source.qualityKnowledge, (item) => item.title, (item) => toNumber(item.timesApplied || item.timesSuggested || item.feedbackScore || 1)).slice(0, 10),
      feedbackScore: source.qualityKnowledge.reduce((sum, item) => sum + toNumber(item.feedbackScore), 0),
    },
    spcMetrics: {
      defectQuantitySeries: buildTrend(defects),
      ppmSeries: buildTrend(processRecords),
      numericInspectionSeries,
      outOfSpecPoints: numericInspectionSeries.filter((point) => point.outOfSpec).length,
      linkedDefectRecords: defects.filter((record) => record.relatedInspectionRunId || record.relatedInspectionPlanId).length,
    },
    riskMetrics: {
      topRisks: riskBoard,
      openHighSeverity: commandSummary.highSeverityOpen,
      repeatedDefects: repeatedGroups.length,
      overdueSla: commandSummary.overdueSla,
      notEffectiveActions: improvement.notEffectiveActions,
      knowledgeGaps: repeatedWithoutLessons.length,
    },
    dataQualityMetrics: {
      missingInspectedQuantity,
      missingEstimatedCost,
      missingRecordType,
      missingOutgoingResult,
      missingMasterDataSnapshot,
      failedChecksWithoutDefect,
      actionsWithoutOwner,
      actionsWithoutDueDate,
      knowledgeGapsForRepeatedDefects: repeatedWithoutLessons.length,
      warnings: [...warnings, ...dataHealth.recommendations.slice(0, 6).map((message, index) => ({
        id: `data-health-${index}`,
        severity: 'info' as const,
        title: 'Data health recommendation',
        message,
      }))],
    },
    dashboardConfidenceLabels: confidenceLabels,
    managementSummary,
  };
}
