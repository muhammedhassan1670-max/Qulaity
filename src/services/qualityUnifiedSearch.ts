import type { DefectLogData } from '@/api/unified-api';
import type { QualityDataSnapshot } from '@/services/qualityDataProvider';
import type { QualityMasterRecord, QualityMasterTableId } from '@/services/qualityMasterData';
import {
  applyQualityKnowledgeItem,
  buildStandardActionLibrary,
  type QualityKnowledgeItem,
} from '@/services/qualityKnowledgeBase';
import {
  createImprovementAction,
  prefillActionFromDefect,
} from '@/services/qualityImprovementActions';
import {
  loadQualityRelationships,
  relationshipsForEntity,
  type QualityRelationshipEntityType,
} from '@/services/qualityRelationships';
import type { QualityDashboardFilters } from '@/services/qualityAnalyticsHub';
import { enqueueQualitySyncItem } from '@/services/qualitySyncQueue';

export const QUALITY_SEARCH_SETTINGS_KEY = 'qms_quality_search_settings_v1';
export const QUALITY_SEARCH_APPLY_DASHBOARD_FILTERS_KEY = 'qms_quality_search_apply_dashboard_filters_v1';

export type UnifiedSearchRecordType =
  | 'defect'
  | 'ncr'
  | 'capa'
  | 'eightD'
  | 'improvement-action'
  | 'knowledge'
  | 'master-data'
  | 'relationship'
  | 'audit';

export type SearchConfidenceLabel = 'Strong Signal' | 'Moderate Signal' | 'Weak Signal' | 'Insufficient Data';
export type SearchSummaryMode = 'management' | 'technical' | 'action' | 'training';

export interface ParsedQualityQuery {
  originalQuery: string;
  normalizedQuery: string;
  detectedEntities: string[];
  filters: {
    recordTypes: UnifiedSearchRecordType[];
    keywords: string[];
    defectType?: string;
    model?: string;
    partNumber?: string;
    productionLine?: string;
    shift?: string;
    supplier?: string;
    customer?: string;
    severity?: 'high' | 'critical';
    customerReturn?: boolean;
    outgoingFailure?: boolean;
    repeated?: boolean;
    overdue?: boolean;
    effective?: boolean;
    notEffective?: boolean;
    dateRange?: {
      label: string;
      from: string;
      to: string;
    };
  };
  confidence: number;
  confidenceLabel: SearchConfidenceLabel;
  explanation: string[];
}

export interface UnifiedSearchResult {
  id: string;
  recordType: UnifiedSearchRecordType;
  sourceId: string;
  title: string;
  summary: string;
  status?: string;
  severity?: string;
  priority?: string;
  date?: string;
  openPath?: string;
  raw: unknown;
  searchableText: string;
  matchedFields: string[];
  dashboardFilterMatches: string[];
  ignoredDashboardFilters: string[];
  matchReason: string;
  score: number;
  confidenceLabel: SearchConfidenceLabel;
  relatedRecords: Array<{
    type: string;
    id: string;
    label: string;
    status?: string;
  }>;
  relationshipContext: string[];
  knowledgeSuggestions: Array<{
    id: string;
    title: string;
    type: string;
    suggestedFocus: string;
    beforeAfter?: string;
  }>;
}

export interface QualitySearchDashboardFilterSummary {
  enabled: boolean;
  activeFilters: Array<{ key: keyof QualityDashboardFilters; label: string; value: string }>;
  appliedFilters: string[];
  ignoredFilters: string[];
  ignoredFiltersByEntity: Partial<Record<UnifiedSearchRecordType, string[]>>;
  resultCountBeforeFilters: number;
  resultCountAfterFilters: number;
}

export interface UnifiedQualitySearchResponse {
  parsed: ParsedQualityQuery;
  results: UnifiedSearchResult[];
  totalIndexed: number;
  filterSummary: QualitySearchDashboardFilterSummary;
}

export interface UnifiedQualitySearchOptions {
  limit?: number;
  dashboardFilters?: QualityDashboardFilters;
  applyDashboardFilters?: boolean;
}

export interface LocalAssistantAnswer {
  query: string;
  answer: string;
  supportingRecordsCount: number;
  topRelatedRecords: UnifiedSearchResult[];
  suggestedFocus: string;
  dataLimitations: string[];
  confidenceLabel: SearchConfidenceLabel;
  parsedQuery: ParsedQualityQuery;
}

export interface SearchSummary {
  mode: SearchSummaryMode;
  generatedAt: string;
  markdown: string;
  json: Record<string, unknown>;
}

interface IndexedRecord {
  result: UnifiedSearchResult;
  fieldValues: Record<string, string>;
}

const dashboardFilterLabels: Record<keyof QualityDashboardFilters, string> = {
  datePreset: 'Date range',
  fromDate: 'From date',
  toDate: 'To date',
  factory: 'Factory',
  workshop: 'Workshop',
  productionLine: 'Production line',
  model: 'Model',
  partNumber: 'Part number',
  defectType: 'Defect type',
  severity: 'Severity',
  recordType: 'Record type',
  shift: 'Shift',
  supplier: 'Supplier',
  customer: 'Customer',
  inspectionPoint: 'Inspection point',
  actionStatus: 'Action status',
  effectivenessStatus: 'Effectiveness status',
  ncrStatus: 'NCR status',
  capaStatus: 'CAPA status',
  eightDStatus: '8D status',
};

const dashboardFilterAliases: Record<keyof QualityDashboardFilters, string[]> = {
  datePreset: [],
  fromDate: [],
  toDate: [],
  factory: ['factory'],
  workshop: ['workshop'],
  productionLine: ['productionLine', 'linkedProductionLine', 'line', 'defaultProductionLine'],
  model: ['model', 'linkedModel', 'productModel', 'modelName'],
  partNumber: ['partNumber', 'partId', 'partCode', 'linkedPartNumber', 'relatedPartNumber'],
  defectType: ['defectType', 'linkedDefectType', 'defectCategory', 'defectCategoryAtTime', 'issueType', 'findingTypeIfFail'],
  severity: ['severity', 'priority', 'defaultSeverity', 'severityIfFail'],
  recordType: ['recordType', 'sourceType', 'type'],
  shift: ['shift'],
  supplier: ['supplier', 'supplierName', 'supplierNameAtTime', 'linkedSupplier'],
  customer: ['customer', 'customerName', 'linkedCustomer'],
  inspectionPoint: ['inspectionPoint', 'defaultInspectionPoint', 'inspectionArea'],
  actionStatus: ['status', 'actionStatus'],
  effectivenessStatus: ['effectivenessResult', 'effectivenessStatus', 'status'],
  ncrStatus: ['status'],
  capaStatus: ['status'],
  eightDStatus: ['status'],
};

function stringifyFieldValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return text(value);
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(' ');
  return '';
}

function recordFieldValues(record: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(record)
      .map(([key, value]) => [key, stringifyFieldValue(value)])
      .filter(([, value]) => value),
  );
}

function normalize(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/\s+/g, ' ');
}

function text(value: unknown): string {
  return String(value ?? '').trim();
}

function toDate(value: unknown): Date | null {
  const raw = text(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function iso(date: Date): string {
  return date.toISOString();
}

function parseDashboardDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dashboardDateRange(filters?: QualityDashboardFilters): { from?: string; to?: string; label: string } | null {
  if (!filters || !filters.datePreset || filters.datePreset === 'all') return null;
  if (filters.datePreset === 'custom') {
    if (!filters.fromDate && !filters.toDate) return null;
    return { from: filters.fromDate, to: filters.toDate, label: 'Custom date range' };
  }
  const days = filters.datePreset === 'week' ? 7 : filters.datePreset === 'month' ? 30 : filters.datePreset === 'quarter' ? 90 : 365;
  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  return {
    from: from.toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
    label: `Last ${days} days`,
  };
}

function dashboardDateMatches(value: string | undefined, filters?: QualityDashboardFilters): boolean {
  const range = dashboardDateRange(filters);
  if (!range) return true;
  const parsed = parseDashboardDate(value);
  if (!parsed) return false;
  if (range.from) {
    const from = parseDashboardDate(range.from);
    if (from && parsed < from) return false;
  }
  if (range.to) {
    const to = parseDashboardDate(range.to);
    if (to) {
      to.setHours(23, 59, 59, 999);
      if (parsed > to) return false;
    }
  }
  return true;
}

function confidenceForScore(score: number): SearchConfidenceLabel {
  if (score >= 60) return 'Strong Signal';
  if (score >= 32) return 'Moderate Signal';
  if (score > 0) return 'Weak Signal';
  return 'Insufficient Data';
}

function pathFor(type: UnifiedSearchRecordType, id: string): string {
  if (type === 'defect') return `/quality/defect-log/${id}`;
  if (type === 'ncr') return `/ncr/${id}`;
  if (type === 'capa') return `/capa/${id}`;
  if (type === 'eightD') return `/8d/${id}`;
  if (type === 'knowledge') return '/quality-knowledge-base';
  if (type === 'master-data') return '/quality-master-data';
  if (type === 'improvement-action') return '/quality-command-center';
  return '/quality-command-center';
}

function relationshipTypeFor(type: UnifiedSearchRecordType): QualityRelationshipEntityType | null {
  if (type === 'defect' || type === 'ncr' || type === 'capa' || type === 'eightD' || type === 'improvement-action') return type;
  return null;
}

function entityDate(record: Record<string, unknown>): string | undefined {
  return text(record.date || record.createdAt || record.updatedAt || record.detectedDate || record.targetCloseDate || record.dueDate || record.lastUpdatedAt) || undefined;
}

function relationLabel(type: string, id: string): string {
  if (type === 'eightD') return `8D ${id}`;
  if (type === 'improvement-action') return `Action ${id}`;
  return `${type.toUpperCase()} ${id}`;
}

function compact(values: unknown[]): string {
  return values.map(text).filter(Boolean).join(' | ');
}

function activeDashboardFilters(filters?: QualityDashboardFilters): Array<{ key: keyof QualityDashboardFilters; label: string; value: string }> {
  if (!filters) return [];
  const active: Array<{ key: keyof QualityDashboardFilters; label: string; value: string }> = [];
  const range = dashboardDateRange(filters);
  if (range) {
    active.push({
      key: 'datePreset',
      label: dashboardFilterLabels.datePreset,
      value: range.label === 'Custom date range'
        ? `${filters.fromDate || 'Start'} -> ${filters.toDate || 'End'}`
        : range.label,
    });
  }
  (Object.keys(dashboardFilterLabels) as Array<keyof QualityDashboardFilters>).forEach((key) => {
    if (key === 'datePreset' || key === 'fromDate' || key === 'toDate') return;
    const value = text(filters[key]);
    if (value) active.push({ key, label: dashboardFilterLabels[key], value });
  });
  return active;
}

function valuesForFilter(item: IndexedRecord, key: keyof QualityDashboardFilters): string[] {
  if (key === 'datePreset' || key === 'fromDate' || key === 'toDate') return item.result.date ? [item.result.date] : [];
  const aliases = dashboardFilterAliases[key] || [];
  const normalizedAliases = new Set(aliases.map((alias) => normalize(alias)));
  return Object.entries(item.fieldValues)
    .filter(([field, value]) => value && normalizedAliases.has(normalize(field)))
    .map(([, value]) => value)
    .filter(Boolean);
}

function statusFilterAppliesToType(key: keyof QualityDashboardFilters, type: UnifiedSearchRecordType): boolean {
  if (key === 'actionStatus') return type === 'improvement-action';
  if (key === 'ncrStatus') return type === 'ncr';
  if (key === 'capaStatus') return type === 'capa';
  if (key === 'eightDStatus') return type === 'eightD';
  return true;
}

function dashboardValueMatches(actual: string, expected: string): boolean {
  if (!expected) return true;
  const normalizedActual = normalize(actual);
  const normalizedExpected = normalize(expected);
  return normalizedActual.includes(normalizedExpected) || normalizedExpected.includes(normalizedActual);
}

function dashboardFilterApplies(
  item: IndexedRecord,
  filters?: QualityDashboardFilters,
): { keep: boolean; matched: string[]; ignored: string[] } {
  const active = activeDashboardFilters(filters);
  if (active.length === 0) return { keep: true, matched: [], ignored: [] };

  const matched: string[] = [];
  const ignored: string[] = [];

  for (const filter of active) {
    if (!statusFilterAppliesToType(filter.key, item.result.recordType)) {
      ignored.push(`${filter.label}: filter not applicable to ${item.result.recordType}`);
      continue;
    }
    if (filter.key === 'datePreset') {
      if (!item.result.date) {
        ignored.push(`${filter.label}: no date field on ${item.result.recordType}`);
        continue;
      }
      if (!dashboardDateMatches(item.result.date, filters)) return { keep: false, matched, ignored };
      matched.push(`${filter.label}: ${filter.value}`);
      continue;
    }
    const values = valuesForFilter(item, filter.key);
    if (values.length === 0) {
      ignored.push(`${filter.label}: filter not applicable to ${item.result.recordType}`);
      continue;
    }
    if (!values.some((value) => dashboardValueMatches(value, filter.value))) return { keep: false, matched, ignored };
    matched.push(`${filter.label}: ${filter.value}`);
  }

  return { keep: true, matched: Array.from(new Set(matched)), ignored: Array.from(new Set(ignored)) };
}

function emptyFilterSummary(enabled: boolean, filters?: QualityDashboardFilters): QualitySearchDashboardFilterSummary {
  return {
    enabled,
    activeFilters: activeDashboardFilters(filters),
    appliedFilters: [],
    ignoredFilters: [],
    ignoredFiltersByEntity: {},
    resultCountBeforeFilters: 0,
    resultCountAfterFilters: 0,
  };
}

function readAuditEvents(): Array<Record<string, unknown>> {
  if (typeof localStorage === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem('qms_defect_record_audit_trail_v1') || '{}');
    if (!parsed || typeof parsed !== 'object') return [];
    return Object.entries(parsed as Record<string, unknown>).flatMap(([recordId, value]) => (
      Array.isArray(value)
        ? value.map((entry) => ({ ...(entry as Record<string, unknown>), relatedRecordId: recordId }))
        : []
    ));
  } catch {
    return [];
  }
}

function dateRangeFor(query: string): ParsedQualityQuery['filters']['dateRange'] | undefined {
  const now = new Date();
  const lower = normalize(query);
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  if (/this month|الشهر|هذا الشهر|الشهر الحالي/.test(lower)) {
    return { label: 'this month', from: iso(startOfCurrentMonth), to: iso(now) };
  }
  if (/last month|الشهر الماضي|الشهر السابق/.test(lower)) {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 1);
    return { label: 'last month', from: iso(from), to: iso(to) };
  }
  if (/this week|الاسبوع|الأسبوع|هذا الاسبوع|هذا الأسبوع/.test(lower)) {
    const from = new Date(now);
    const day = from.getDay();
    const diff = from.getDate() - day + (day === 0 ? -6 : 1);
    from.setDate(diff);
    from.setHours(0, 0, 0, 0);
    return { label: 'this week', from: iso(from), to: iso(now) };
  }
  return undefined;
}

function matchAfterKeyword(query: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match?.[1]) return match[1].trim().replace(/[،,.;]+$/, '');
  }
  return undefined;
}

export function parseLocalQualityQuery(query: string): ParsedQualityQuery {
  const normalizedQuery = normalize(query);
  const filters: ParsedQualityQuery['filters'] = {
    recordTypes: [],
    keywords: [],
  };
  const detectedEntities: string[] = [];
  const explanation: string[] = [];

  const addType = (type: UnifiedSearchRecordType, reason: string) => {
    if (!filters.recordTypes.includes(type)) filters.recordTypes.push(type);
    detectedEntities.push(type);
    explanation.push(reason);
  };

  if (/\bncr\b|عدم المطابقة|non conform|non-conform/.test(normalizedQuery)) addType('ncr', 'Detected NCR / non-conformance keyword.');
  if (/\bcapa\b|corrective|preventive|تصحيحي|وقائي/.test(normalizedQuery)) addType('capa', 'Detected CAPA / corrective action keyword.');
  if (/\b8d\b|eight d|8 d/.test(normalizedQuery)) addType('eightD', 'Detected 8D keyword.');
  if (/action|اجراء|إجراء|تحسين/.test(normalizedQuery)) addType('improvement-action', 'Detected action/improvement keyword.');
  if (/lesson|learned|knowledge|training|standard action|درس|معرفة|تدريب/.test(normalizedQuery)) addType('knowledge', 'Detected knowledge or lesson learned keyword.');
  if (/defect|عيب|عيوب|تسريب|leak|weld|لحام/.test(normalizedQuery)) addType('defect', 'Detected defect keyword.');

  if (/leak|leakage|تسريب|لحام|weld|welding/.test(normalizedQuery)) {
    filters.defectType = /leak|leakage|تسريب/.test(normalizedQuery) ? 'leakage تسريب' : 'welding لحام';
    filters.keywords.push('leakage', 'تسريب', 'welding', 'لحام');
    detectedEntities.push('leakage/welding');
    explanation.push('Detected leakage/welding defect family.');
  }
  if (/customer return|return|مرتجع|مرتجعات/.test(normalizedQuery)) {
    filters.customerReturn = true;
    filters.recordTypes.push('defect');
    explanation.push('Detected customer return filter.');
  }
  if (/outgoing|escape|hold|failure|خروج|نهائي|افراج|حجز|فشل/.test(normalizedQuery)) {
    filters.outgoingFailure = true;
    explanation.push('Detected outgoing failure/hold filter.');
  }
  if (/high severity|critical|major|خطير|حرج|عالي/.test(normalizedQuery)) {
    filters.severity = /critical|حرج/.test(normalizedQuery) ? 'critical' : 'high';
    explanation.push('Detected high severity filter.');
  }
  if (/repeated|repeat|recurrence|متكرر|تكرار/.test(normalizedQuery)) {
    filters.repeated = true;
    explanation.push('Detected repeated/recurrence filter.');
  }
  if (/overdue|late|متأخر|تأخير|متاخر/.test(normalizedQuery)) {
    filters.overdue = true;
    explanation.push('Detected overdue filter.');
  }
  if (/not effective|ineffective|غير فعال|غير مؤثر/.test(normalizedQuery)) {
    filters.notEffective = true;
    explanation.push('Detected not-effective filter.');
  } else if (/effective|فعال|مؤثر/.test(normalizedQuery)) {
    filters.effective = true;
    explanation.push('Detected effective filter.');
  }

  filters.model = matchAfterKeyword(query, [/(?:model|موديل)\s*[:=]?\s*([^\n,،]+)/i]);
  filters.partNumber = matchAfterKeyword(query, [/(?:part number|part code|رقم الكود|كود)\s*[:=]?\s*([^\n,،]+)/i]);
  filters.productionLine = matchAfterKeyword(query, [/(?:line|production line|خط)\s*[:=]?\s*([^\n,،]+)/i]);
  filters.shift = matchAfterKeyword(query, [/(?:shift|وردية|الوردية)\s*[:=]?\s*([^\n,،]+)/i]);
  filters.supplier = matchAfterKeyword(query, [/(?:supplier|مورد)\s*[:=]?\s*([^\n,،]+)/i]);
  filters.customer = matchAfterKeyword(query, [/(?:customer|عميل)\s*[:=]?\s*([^\n,،]+)/i]);

  (['model', 'partNumber', 'productionLine', 'shift', 'supplier', 'customer'] as const).forEach((key) => {
    if (filters[key]) {
      detectedEntities.push(`${key}: ${filters[key]}`);
      explanation.push(`Detected ${key} value "${filters[key]}".`);
    }
  });

  filters.dateRange = dateRangeFor(query);
  if (filters.dateRange) {
    detectedEntities.push(filters.dateRange.label);
    explanation.push(`Detected date range: ${filters.dateRange.label}.`);
  }

  filters.keywords.push(...normalizedQuery.split(/\s+/).filter((token) => token.length >= 3 && ![
    'show', 'what', 'which', 'are', 'the', 'this', 'that', 'with', 'for', 'and', 'من', 'في', 'على', 'ايه', 'ما', 'هو',
  ].includes(token)).slice(0, 12));
  filters.keywords = Array.from(new Set(filters.keywords));

  const confidence = Math.min(95, Math.max(20, detectedEntities.length * 13 + filters.keywords.length * 3));
  return {
    originalQuery: query,
    normalizedQuery,
    detectedEntities: Array.from(new Set(detectedEntities)),
    filters,
    confidence,
    confidenceLabel: confidence >= 70 ? 'Strong Signal' : confidence >= 45 ? 'Moderate Signal' : confidence >= 25 ? 'Weak Signal' : 'Insufficient Data',
    explanation: explanation.length > 0 ? explanation : ['No specific quality filters were detected. Running broad local text search.'],
  };
}

function relationshipContext(type: UnifiedSearchRecordType, id: string): { relatedRecords: UnifiedSearchResult['relatedRecords']; context: string[] } {
  const relationshipType = relationshipTypeFor(type);
  if (!relationshipType) return { relatedRecords: [], context: [] };
  const rows = relationshipsForEntity(relationshipType, id);
  const relatedRecords = rows.map((row) => {
    const isSource = row.sourceType === relationshipType && normalize(row.sourceId) === normalize(id);
    const otherType = isSource ? row.targetType : row.sourceType;
    const otherId = isSource ? row.targetId : row.sourceId;
    return {
      type: otherType,
      id: otherId,
      label: relationLabel(otherType, otherId),
      status: row.status,
    };
  });
  return {
    relatedRecords,
    context: relatedRecords.map((record) => `Linked to ${record.label}.`),
  };
}

function knowledgeForRecord(record: UnifiedSearchResult, knowledge: QualityKnowledgeItem[]): UnifiedSearchResult['knowledgeSuggestions'] {
  const active = knowledge.filter((item) => item.status === 'active');
  return active.filter((item) => {
    const textToMatch = normalize(`${record.title} ${record.summary} ${record.searchableText}`);
    return [item.defectType, item.defectCategory, item.productionLine, item.model, item.partNumber, ...item.tags]
      .filter(Boolean)
      .some((value) => textToMatch.includes(normalize(value)));
  }).slice(0, 3).map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type,
    suggestedFocus: item.recommendedVerification || item.recommendedContainment || item.recommendedCorrectiveAction || 'Use as a similar historical reference.',
    beforeAfter: item.beforeMetric !== undefined || item.afterMetric !== undefined
      ? `Before ${item.beforeMetric ?? 'N/A'} -> After ${item.afterMetric ?? 'N/A'}`
      : undefined,
  }));
}

function buildResult(input: {
  type: UnifiedSearchRecordType;
  id: string;
  title: string;
  summary: string;
  status?: string;
  severity?: string;
  priority?: string;
  date?: string;
  raw: unknown;
  fields: Record<string, string>;
  knowledge: QualityKnowledgeItem[];
}): IndexedRecord {
  const searchableText = normalize(Object.entries(input.fields).map(([key, value]) => `${key} ${value}`).join(' '));
  const relations = relationshipContext(input.type, input.id);
  const result: UnifiedSearchResult = {
    id: `${input.type}-${input.id}`,
    recordType: input.type,
    sourceId: input.id,
    title: input.title,
    summary: input.summary,
    status: input.status,
    severity: input.severity,
    priority: input.priority,
    date: input.date,
    openPath: pathFor(input.type, input.id),
    raw: input.raw,
    searchableText,
    matchedFields: [],
    dashboardFilterMatches: [],
    ignoredDashboardFilters: [],
    matchReason: 'Included in broad local quality search.',
    score: 0,
    confidenceLabel: 'Insufficient Data',
    relatedRecords: relations.relatedRecords,
    relationshipContext: relations.context,
    knowledgeSuggestions: [],
  };
  result.knowledgeSuggestions = knowledgeForRecord(result, input.knowledge);
  return { result, fieldValues: input.fields };
}

function masterDataResults(snapshot: QualityDataSnapshot): IndexedRecord[] {
  return Object.entries(snapshot.masterData).flatMap(([table, rows]) => (rows as QualityMasterRecord[]).map((record) => {
    const title = compact([record.partNumber, record.model, record.defectType, record.productionLine, record.supplierName, record.customerName, record.ruleName, record.inspectionPoint, record.id]) || `${table} record`;
    const fields = Object.fromEntries(Object.entries(record).map(([key, value]) => [key, text(value)]));
    return buildResult({
      type: 'master-data',
      id: `${table}-${record.id}`,
      title,
      summary: `${table} master data record`,
      status: record.isActive === false ? 'inactive' : 'active',
      date: record.lastUpdatedAt || record.createdAt,
      raw: { table: table as QualityMasterTableId, record },
      fields: { ...fields, table },
      knowledge: snapshot.qualityKnowledge,
    });
  }));
}

export function buildUnifiedQualitySearchIndex(snapshot: QualityDataSnapshot): IndexedRecord[] {
  const knowledge = snapshot.qualityKnowledge;
  const defects = snapshot.defectRecords.map((record) => buildResult({
    type: 'defect',
    id: String(record.id || ''),
    title: record.defectType || record.description || 'Defect record',
    summary: compact([record.description, record.productionLine, record.model, record.partNumber || record.partId]),
    status: record.status,
    severity: record.severity,
    date: record.date || record.createdAt || record.updatedAt,
    raw: record,
    fields: {
      ...recordFieldValues(record as unknown as Record<string, unknown>),
      id: String(record.id || ''),
      defectType: text(record.defectType),
      defectCategory: text(record.defectCategory || record.defectCategoryAtTime),
      productionLine: text(record.productionLine),
      model: text(record.model),
      partNumber: text(record.partNumber || record.partId),
      supplier: text(record.supplierNameAtTime || record.supplierName),
      customer: text(record.customerName),
      shift: text(record.shift),
      severity: text(record.severity),
      status: text(record.status),
      recordType: text(record.recordType),
      outgoingResult: text(record.outgoingResult),
      description: text(record.description),
      actionTaken: text(record.actionTaken),
    },
    knowledge,
  }));

  const ncrs = snapshot.ncr.map((record) => buildResult({
    type: 'ncr',
    id: String(record.id || ''),
    title: record.title || record.ncrNumber || 'NCR',
    summary: record.description || record.source || '',
    status: record.status,
    priority: record.priority,
    date: record.detectedDate || record.createdAt || record.updatedAt,
    raw: record,
    fields: {
      ...recordFieldValues(record as unknown as Record<string, unknown>),
      id: String(record.id || ''),
      ncrNumber: text(record.ncrNumber),
      title: text(record.title),
      description: text(record.description),
      status: text(record.status),
      priority: text(record.priority),
      source: text(record.source),
      sourceDefectId: text(record.sourceDefectId),
      effectivenessResult: text(record.effectivenessResult),
      owner: text(record.owner),
    },
    knowledge,
  }));

  const capas = snapshot.capa.map((record) => buildResult({
    type: 'capa',
    id: String(record.id || ''),
    title: record.title || record.capaNumber || 'CAPA',
    summary: compact([record.description, record.problemStatement, record.rootCause]),
    status: record.status,
    priority: record.priority,
    date: record.createdAt || record.updatedAt || record.targetCloseDate,
    raw: record,
    fields: {
      ...recordFieldValues(record as unknown as Record<string, unknown>),
      id: String(record.id || ''),
      capaNumber: text(record.capaNumber),
      title: text(record.title),
      description: text(record.description),
      problemStatement: text(record.problemStatement),
      rootCause: text(record.rootCause),
      status: text(record.status),
      priority: text(record.priority),
      sourceNcrId: text(record.sourceNcrId),
      effectivenessResult: text(record.effectivenessResult),
      owner: text(record.owner),
    },
    knowledge,
  }));

  const eightDs = snapshot.eightD.map((record) => buildResult({
    type: 'eightD',
    id: String(record.id || ''),
    title: record.subject || record.eightDNumber || '8D',
    summary: record.description || '',
    status: record.status,
    date: record.createdAt || record.updatedAt,
    raw: record,
    fields: {
      ...recordFieldValues(record as unknown as Record<string, unknown>),
      id: String(record.id || ''),
      eightDNumber: text(record.eightDNumber),
      subject: text(record.subject),
      description: text(record.description),
      status: text(record.status),
      ncrReportId: text(record.ncrReportId),
      effectivenessResult: text(record.effectivenessResult),
      dSections: text(JSON.stringify(record.dSections || {})),
    },
    knowledge,
  }));

  const actions = snapshot.improvementActions.map((action) => buildResult({
    type: 'improvement-action',
    id: action.id,
    title: action.title,
    summary: action.description,
    status: action.status,
    priority: action.priority,
    date: action.createdAt || action.updatedAt || action.dueDate,
    raw: action,
    fields: {
      ...recordFieldValues(action as unknown as Record<string, unknown>),
      id: action.id,
      title: action.title,
      description: action.description,
      status: action.status,
      sourceType: action.sourceType,
      actionType: action.actionType,
      owner: action.owner,
      priority: action.priority,
      dueDate: text(action.dueDate),
      effectivenessResult: text(action.effectivenessResult),
      linkedDefectType: text(action.linkedDefectType),
      linkedProductionLine: text(action.linkedProductionLine),
      linkedModel: text(action.linkedModel),
      linkedPartNumber: text(action.linkedPartNumber),
    },
    knowledge,
  }));

  const knowledgeResults = knowledge.map((item) => buildResult({
    type: 'knowledge',
    id: item.id,
    title: item.title,
    summary: item.problemSummary,
    status: item.status,
    severity: item.severity,
    date: item.createdAt || item.updatedAt,
    raw: item,
    fields: {
      ...recordFieldValues(item as unknown as Record<string, unknown>),
      id: item.id,
      title: item.title,
      type: item.type,
      status: item.status,
      defectType: text(item.defectType),
      defectCategory: text(item.defectCategory),
      productionLine: text(item.productionLine),
      model: text(item.model),
      partNumber: text(item.partNumber),
      supplier: text(item.supplier),
      customer: text(item.customer),
      severity: text(item.severity),
      problemSummary: item.problemSummary,
      historicalPattern: text(item.historicalPattern),
      effectiveActions: text(item.effectiveActions),
      recommendedContainment: text(item.recommendedContainment),
      recommendedVerification: text(item.recommendedVerification),
      tags: item.tags.join(' '),
    },
    knowledge,
  }));

  const relationships = loadQualityRelationships(true).map((relationship) => buildResult({
    type: 'relationship',
    id: relationship.id,
    title: `${relationship.sourceType}:${relationship.sourceId} -> ${relationship.targetType}:${relationship.targetId}`,
    summary: relationship.notes || 'Linked quality relationship for traceability.',
    status: relationship.status,
    date: relationship.createdAt,
    raw: relationship,
    fields: {
      ...recordFieldValues(relationship as unknown as Record<string, unknown>),
      id: relationship.id,
      sourceType: relationship.sourceType,
      sourceId: relationship.sourceId,
      targetType: relationship.targetType,
      targetId: relationship.targetId,
      relationshipType: relationship.relationshipType,
      notes: text(relationship.notes),
      status: relationship.status,
    },
    knowledge,
  }));

  const audit = readAuditEvents().map((event, index) => buildResult({
    type: 'audit',
    id: text(event.id || `audit-${index}`),
    title: text(event.action || 'Audit event'),
    summary: compact([event.reasonForChange, event.comment, event.permissionReason, event.relatedRecordId]),
    status: text(event.permissionResult || event.status),
    date: entityDate(event),
    raw: event,
    fields: Object.fromEntries(Object.entries(event).map(([key, value]) => [key, text(value)])),
    knowledge,
  }));

  return [...defects, ...ncrs, ...capas, ...eightDs, ...actions, ...knowledgeResults, ...masterDataResults(snapshot), ...relationships, ...audit]
    .filter((item) => item.result.sourceId);
}

function dateMatches(result: UnifiedSearchResult, range?: ParsedQualityQuery['filters']['dateRange']): boolean {
  if (!range) return true;
  const date = toDate(result.date);
  if (!date) return false;
  return date.getTime() >= new Date(range.from).getTime() && date.getTime() <= new Date(range.to).getTime();
}

function semanticMatches(result: UnifiedSearchResult, parsed: ParsedQualityQuery): { score: number; fields: string[]; reasons: string[] } {
  const fields: string[] = [];
  const reasons: string[] = [];
  let score = 0;
  const record = result.raw as Record<string, unknown>;
  const searchText = result.searchableText;
  const add = (points: number, field: string, reason: string) => {
    score += points;
    fields.push(field);
    reasons.push(reason);
  };

  if (parsed.filters.recordTypes.length > 0 && parsed.filters.recordTypes.includes(result.recordType)) add(18, 'recordType', `Matched requested record type ${result.recordType}.`);
  if (parsed.filters.defectType && /leak|weld|تسريب|لحام/.test(searchText)) add(20, 'defectType', 'Matched leakage/welding family.');
  if (parsed.filters.model && searchText.includes(normalize(parsed.filters.model))) add(16, 'model', `Matched model ${parsed.filters.model}.`);
  if (parsed.filters.partNumber && searchText.includes(normalize(parsed.filters.partNumber))) add(16, 'partNumber', `Matched part/code ${parsed.filters.partNumber}.`);
  if (parsed.filters.productionLine && searchText.includes(normalize(parsed.filters.productionLine))) add(16, 'productionLine', `Matched production line ${parsed.filters.productionLine}.`);
  if (parsed.filters.shift && searchText.includes(normalize(parsed.filters.shift))) add(12, 'shift', `Matched shift ${parsed.filters.shift}.`);
  if (parsed.filters.supplier && searchText.includes(normalize(parsed.filters.supplier))) add(12, 'supplier', `Matched supplier ${parsed.filters.supplier}.`);
  if (parsed.filters.customer && searchText.includes(normalize(parsed.filters.customer))) add(12, 'customer', `Matched customer ${parsed.filters.customer}.`);
  if (parsed.filters.severity && searchText.includes(parsed.filters.severity)) add(14, 'severity', `Matched severity ${parsed.filters.severity}.`);
  if (parsed.filters.customerReturn && (searchText.includes('customer-return') || searchText.includes('return') || searchText.includes('مرتجع'))) add(18, 'recordType', 'Matched customer return signal.');
  if (parsed.filters.outgoingFailure && (searchText.includes('outgoing') || searchText.includes('hold') || searchText.includes('fail') || searchText.includes('escape'))) add(18, 'outgoingResult', 'Matched outgoing hold/failure/escape signal.');
  if (parsed.filters.overdue && (
    searchText.includes('overdue')
    || (record.dueDate && new Date(String(record.dueDate)).getTime() < Date.now() && !['closed', 'effective', 'cancelled'].includes(normalize(record.status)))
  )) add(16, 'dueDate', 'Matched overdue signal.');
  if (parsed.filters.notEffective && (searchText.includes('not effective') || searchText.includes('not-effective') || searchText.includes('غير فعال'))) add(18, 'effectivenessResult', 'Matched not-effective signal.');
  if (parsed.filters.effective && !parsed.filters.notEffective && (searchText.includes('effective') || searchText.includes('فعال'))) add(12, 'effectivenessResult', 'Matched effective signal.');
  if (parsed.filters.repeated && result.relationshipContext.length > 0) add(8, 'relationships', 'Record has relationship context for recurrence review.');

  parsed.filters.keywords.forEach((keyword) => {
    if (searchText.includes(normalize(keyword))) add(4, 'text', `Matched keyword "${keyword}".`);
  });

  if (!dateMatches(result, parsed.filters.dateRange)) return { score: -1, fields, reasons: ['Excluded by date range.'] };
  if (result.knowledgeSuggestions.length > 0) add(4, 'knowledge', 'Related active knowledge item found.');
  if (result.relatedRecords.length > 0) add(4, 'relationships', 'Relationship registry has linked records.');

  return { score, fields: Array.from(new Set(fields)), reasons };
}

export function runUnifiedQualitySearch(
  snapshot: QualityDataSnapshot,
  query: string,
  limitOrOptions: number | UnifiedQualitySearchOptions = 80,
): UnifiedQualitySearchResponse {
  const options: UnifiedQualitySearchOptions = typeof limitOrOptions === 'number' ? { limit: limitOrOptions } : limitOrOptions;
  const limit = options.limit ?? 80;
  const applyDashboardFilters = options.applyDashboardFilters ?? false;
  const parsed = parseLocalQualityQuery(query);
  const indexed = buildUnifiedQualitySearchIndex(snapshot);
  const broad = parsed.filters.keywords.length === 0 && parsed.filters.recordTypes.length === 0 && !parsed.filters.dateRange;
  const scored = indexed
    .map((item) => {
      const matched = semanticMatches(item.result, parsed);
      return {
        ...item,
        result: {
          ...item.result,
          matchedFields: matched.fields,
          matchReason: matched.reasons[0] || (broad ? 'Broad local search result.' : 'Matched local quality text.'),
          score: matched.score,
          confidenceLabel: confidenceForScore(matched.score),
        },
      };
    })
    .filter((item) => broad ? true : item.result.score > 0);

  const filterSummary = emptyFilterSummary(applyDashboardFilters, options.dashboardFilters);
  filterSummary.resultCountBeforeFilters = scored.length;

  const filtered = applyDashboardFilters && filterSummary.activeFilters.length > 0
    ? scored.filter((item) => {
      const applied = dashboardFilterApplies(item, options.dashboardFilters);
      item.result.dashboardFilterMatches = applied.matched;
      item.result.ignoredDashboardFilters = applied.ignored;
      applied.matched.forEach((label) => {
        if (!filterSummary.appliedFilters.includes(label)) filterSummary.appliedFilters.push(label);
      });
      applied.ignored.forEach((label) => {
        if (!filterSummary.ignoredFilters.includes(label)) filterSummary.ignoredFilters.push(label);
        const current = filterSummary.ignoredFiltersByEntity[item.result.recordType] || [];
        if (!current.includes(label)) {
          filterSummary.ignoredFiltersByEntity[item.result.recordType] = [...current, label];
        }
      });
      return applied.keep;
    })
    : scored.map((item) => ({
      ...item,
      result: {
        ...item.result,
        dashboardFilterMatches: [],
        ignoredDashboardFilters: filterSummary.activeFilters.length > 0 ? ['Shared dashboard filters are currently off for Quality Search.'] : [],
      },
    }));

  filterSummary.resultCountAfterFilters = filtered.length;
  if (applyDashboardFilters) {
    parsed.explanation = [
      ...parsed.explanation,
      filterSummary.activeFilters.length > 0
        ? `Applied shared dashboard filters to searchable entities where matching fields exist (${filterSummary.resultCountBeforeFilters} -> ${filterSummary.resultCountAfterFilters} results).`
        : 'No active shared dashboard filters were found.',
    ];
  } else if (filterSummary.activeFilters.length > 0) {
    parsed.explanation = [...parsed.explanation, 'Shared dashboard filters are available but turned off for this search.'];
  }

  const results = filtered
    .map((item) => item.result)
    .sort((a, b) => b.score - a.score || new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
    .slice(0, limit);
  return { parsed, results, totalIndexed: indexed.length, filterSummary };
}

function groupTopDefects(records: DefectLogData[], dateRange?: ParsedQualityQuery['filters']['dateRange']): Array<{ label: string; count: number }> {
  const groups = new Map<string, number>();
  records.filter((record) => dateMatches({
    id: '',
    recordType: 'defect',
    sourceId: String(record.id || ''),
    title: '',
    summary: '',
    raw: record,
    searchableText: '',
    matchedFields: [],
    dashboardFilterMatches: [],
    ignoredDashboardFilters: [],
    matchReason: '',
    score: 0,
    confidenceLabel: 'Insufficient Data',
    relatedRecords: [],
    relationshipContext: [],
    knowledgeSuggestions: [],
    date: record.date || record.createdAt,
  }, dateRange)).forEach((record) => {
    const label = record.defectType || record.defectCategory || 'Unclassified defect';
    groups.set(label, (groups.get(label) || 0) + Math.max(1, Number(record.quantity || 1)));
  });
  return [...groups.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, count]) => ({ label, count }));
}

export function answerLocalQualityQuestion(
  snapshot: QualityDataSnapshot,
  query: string,
  options: UnifiedQualitySearchOptions = {},
): LocalAssistantAnswer {
  const search = runUnifiedQualitySearch(snapshot, query, { ...options, limit: options.limit ?? 20 });
  const normalized = search.parsed.normalizedQuery;
  let answer = '';
  let suggestedFocus = 'Review the top related records and verify with standard quality evidence before action.';
  const limitations: string[] = [];
  let supportingCount = search.results.length;

  if (/top|repeated|repeat|recurrence|متكرر|تكرار/.test(normalized)) {
    const top = groupTopDefects(snapshot.defectRecords, search.parsed.filters.dateRange);
    supportingCount = top.reduce((sum, item) => sum + item.count, 0);
    answer = top.length
      ? `Top repeated defect signals are ${top.map((item) => `${item.label} (${item.count})`).join(', ')} based on stored records.`
      : 'No repeated defect pattern is available from current stored records.';
    suggestedFocus = 'Prioritize the highest repeated categories, then verify by line, model, part, shift, and supplier.';
  } else if (/not effective|ineffective|غير فعال/.test(normalized)) {
    const notEffectiveActions = snapshot.improvementActions.filter((action) => action.status === 'not-effective' || action.effectivenessResult === 'Not Effective');
    const notEffectiveCapas = snapshot.capa.filter((capa) => normalize(capa.effectivenessResult).includes('not effective'));
    supportingCount = notEffectiveActions.length + notEffectiveCapas.length;
    answer = supportingCount
      ? `${supportingCount} stored CAPA/action record(s) show not-effective status or result.`
      : 'No not-effective CAPA or improvement action is currently stored.';
    suggestedFocus = 'Review scope, owner, verification method, and whether CAPA/8D follow-up is needed.';
  } else if (/lesson|knowledge|training|standard action|درس|معرفة|تدريب/.test(normalized)) {
    const activeKnowledge = snapshot.qualityKnowledge.filter((item) => item.status === 'active');
    supportingCount = search.results.filter((item) => item.recordType === 'knowledge').length || activeKnowledge.length;
    answer = supportingCount
      ? `${supportingCount} knowledge reference(s) are available from active stored lessons, standard actions, or training points.`
      : 'No active knowledge items match this question yet.';
    suggestedFocus = 'Use matching lessons as references only and confirm applicability to the current process.';
  } else if (/customer return|مرتجع|مرتجعات/.test(normalized)) {
    const returns = snapshot.defectRecords.filter((record) => normalize(record.recordType) === 'customer-return' || Boolean(record.returnReference));
    supportingCount = returns.length;
    answer = returns.length
      ? `${returns.length} customer return record(s) are stored. Top signals: ${groupTopDefects(returns).map((item) => `${item.label} (${item.count})`).join(', ')}.`
      : 'No customer return defect records are currently stored.';
    suggestedFocus = 'Review return reference, containment, customer, model, and outgoing release evidence.';
  } else if (/overdue|late|متأخر|متاخر/.test(normalized)) {
    const overdueActions = snapshot.improvementActions.filter((action) => action.dueDate && new Date(action.dueDate).getTime() < Date.now() && !['closed', 'effective', 'cancelled'].includes(action.status));
    supportingCount = overdueActions.length;
    answer = overdueActions.length
      ? `${overdueActions.length} improvement action(s) appear overdue based on local due dates.`
      : 'No overdue improvement actions are currently found in local records.';
    suggestedFocus = 'Prioritize overdue actions by severity, customer impact, and linkage to NCR/CAPA/8D.';
  } else {
    answer = search.results.length
      ? `Found ${search.results.length} matching local quality record(s). The strongest matches are ${search.results.slice(0, 3).map((item) => item.title).join(', ')}.`
      : 'No local records matched this question.';
  }

  if (snapshot.defectRecords.length === 0) limitations.push('No defect records are currently stored locally.');
  if (search.results.length === 0) limitations.push('The answer is limited because no matching local results were found.');
  if (search.parsed.confidenceLabel === 'Weak Signal' || search.parsed.confidenceLabel === 'Insufficient Data') limitations.push('The query parser found limited specific filters.');
  if (limitations.length === 0) limitations.push('This answer is decision-support only and requires quality verification.');

  const confidenceLabel = supportingCount >= 20 ? 'Strong Signal' : supportingCount >= 5 ? 'Moderate Signal' : supportingCount > 0 ? 'Weak Signal' : 'Insufficient Data';
  return {
    query,
    answer,
    supportingRecordsCount: supportingCount,
    topRelatedRecords: search.results.slice(0, 5),
    suggestedFocus,
    dataLimitations: limitations,
    confidenceLabel,
    parsedQuery: search.parsed,
  };
}

export function generateQualitySearchSummary(input: {
  query: string;
  parsed: ParsedQualityQuery;
  results: UnifiedSearchResult[];
  mode: SearchSummaryMode;
  assistant?: LocalAssistantAnswer;
  filterSummary?: QualitySearchDashboardFilterSummary;
}): SearchSummary {
  const generatedAt = new Date().toISOString();
  const top = input.results.slice(0, 8);
  const relationCount = input.results.reduce((sum, result) => sum + result.relatedRecords.length, 0);
  const knowledgeCount = input.results.reduce((sum, result) => sum + result.knowledgeSuggestions.length, 0);
  const modeTitle = input.mode === 'management' ? 'Management Summary'
    : input.mode === 'technical' ? 'Technical Summary'
      : input.mode === 'action' ? 'Action-Focused Summary'
        : 'Training-Focused Summary';
  const actionLine = input.mode === 'training'
    ? 'Training focus: review active lessons, training points, and repeated patterns before capability sessions.'
    : input.mode === 'action'
      ? 'Action focus: prioritize overdue, high severity, not-effective, and relationship-linked records.'
      : 'Suggested focus: verify top matching records and relationship context before taking action.';
  const filterSummary = input.filterSummary;
  const filterLines = filterSummary
    ? [
      `Shared dashboard filters: ${filterSummary.enabled ? 'On' : 'Off'}.`,
      `Active filters: ${filterSummary.activeFilters.length ? filterSummary.activeFilters.map((item) => `${item.label}=${item.value}`).join(', ') : 'None'}.`,
      `Result count before/after dashboard filters: ${filterSummary.resultCountBeforeFilters} -> ${filterSummary.resultCountAfterFilters}.`,
      filterSummary.ignoredFilters.length ? `Ignored where not applicable: ${filterSummary.ignoredFilters.slice(0, 8).join('; ')}.` : 'No ignored dashboard filters.',
    ]
    : ['Shared dashboard filters: not included in this summary.'];
  const markdown = [
    `# ${modeTitle}`,
    `Generated: ${new Date(generatedAt).toLocaleString()}`,
    `Query: ${input.query || 'Broad local quality search'}`,
    '',
    '## Interpretation',
    ...input.parsed.explanation.map((item) => `- ${item}`),
    '',
    '## Dashboard Filter Context',
    ...filterLines.map((item) => `- ${item}`),
    '',
    '## Result Overview',
    `Results: ${input.results.length}. Relationship links shown: ${relationCount}. Knowledge suggestions: ${knowledgeCount}. Parser confidence: ${input.parsed.confidenceLabel}.`,
    input.assistant ? `Assistant answer: ${input.assistant.answer}` : '',
    '',
    '## Top Records',
    ...(top.map((result, index) => `${index + 1}. [${result.recordType}] ${result.title} | ${result.status || 'no status'} | ${result.matchReason}`)),
    top.length === 0 ? 'No matching stored local records.' : '',
    '',
    '## Suggested Focus',
    input.assistant?.suggestedFocus || actionLine,
    '',
    '## Data Limitations',
    ...(input.assistant?.dataLimitations || ['Decision-support only. Requires quality verification.']),
    '',
    'Note: This summary uses stored local QMS data only. It does not confirm root cause or make automatic final decisions.',
  ].filter(Boolean).join('\n');
  return {
    mode: input.mode,
    generatedAt,
    markdown,
    json: {
      generatedAt,
      mode: input.mode,
      query: input.query,
      parsed: input.parsed,
      dashboardFilters: filterSummary || null,
      filterToggleStatus: filterSummary?.enabled ?? false,
      resultCount: input.results.length,
      topResults: top.map((result) => ({
        recordType: result.recordType,
        id: result.sourceId,
        title: result.title,
        status: result.status,
        matchReason: result.matchReason,
        matchedFields: result.matchedFields,
        matchedDashboardFilters: result.dashboardFilterMatches,
        relatedRecords: result.relatedRecords,
        knowledgeSuggestions: result.knowledgeSuggestions,
      })),
      assistant: input.assistant,
      safetyNote: 'Decision-support only. Requires verification.',
    },
  };
}

export function enqueueQualitySearchExport(summary: SearchSummary): void {
  enqueueQualitySyncItem({
    entityType: 'quality-search',
    entityId: `search-export-${Date.now()}`,
    operation: 'quality-search-export',
    payloadSummary: `${summary.mode} search summary exported`,
  });
}

export function enqueueAssistantSummary(answer: LocalAssistantAnswer): void {
  enqueueQualitySyncItem({
    entityType: 'quality-search',
    entityId: `assistant-${Date.now()}`,
    operation: 'assistant-summary-created',
    payloadSummary: `Local assistant summary created for query: ${answer.query}`,
  });
}

export function createActionFromSearchResult(result: UnifiedSearchResult): { id?: string; error?: string } {
  if (result.recordType === 'defect') {
    const action = createImprovementAction({
      ...prefillActionFromDefect(result.raw as DefectLogData),
      status: 'draft',
    });
    enqueueQualitySyncItem({
      entityType: 'quality-search',
      entityId: action.id,
      operation: 'apply-search-result-action',
      payloadSummary: `Improvement action created from search result ${result.recordType}:${result.sourceId}`,
    });
    return { id: action.id };
  }
  const title = `Follow-up: ${result.title}`;
  const action = createImprovementAction({
    title,
    description: `Action created from quality search result ${result.recordType}:${result.sourceId}. Verify scope before use.`,
    sourceType: result.recordType === 'ncr' || result.recordType === 'capa' || result.recordType === 'eightD' ? result.recordType : 'manual',
    sourceId: result.sourceId,
    actionType: 'corrective',
    priority: result.severity === 'critical' || result.priority === 'critical' ? 'critical' : result.severity === 'high' || result.priority === 'high' ? 'high' : 'medium',
    status: 'draft',
    owner: '',
    ownerRole: 'QUALITY_ENGINEER',
    dueDate: '',
    verificationMethod: 'Verify using linked records and before/after local quality data.',
  });
  enqueueQualitySyncItem({
    entityType: 'quality-search',
    entityId: action.id,
    operation: 'apply-search-result-action',
    payloadSummary: `Improvement action created from search result ${result.recordType}:${result.sourceId}`,
  });
  return { id: action.id };
}

export function applyKnowledgeFromSearchResult(result: UnifiedSearchResult): { applied: boolean; message: string } {
  if (result.recordType !== 'knowledge') return { applied: false, message: 'Result is not a knowledge item.' };
  applyQualityKnowledgeItem(result.sourceId);
  enqueueQualitySyncItem({
    entityType: 'quality-search',
    entityId: result.sourceId,
    operation: 'apply-search-result-action',
    payloadSummary: `Knowledge search result applied: ${result.sourceId}`,
  });
  return { applied: true, message: 'Knowledge reference applied.' };
}

export function buildQualitySearchSettingsSnapshot(): Record<string, unknown> {
  if (typeof localStorage === 'undefined') return {};
  try {
    return {
      ...(JSON.parse(localStorage.getItem(QUALITY_SEARCH_SETTINGS_KEY) || '{}') as Record<string, unknown>),
      applyDashboardFilters: loadQualitySearchApplyDashboardFilters(),
    };
  } catch {
    return {};
  }
}

export function saveQualitySearchSettings(settings: Record<string, unknown>): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(QUALITY_SEARCH_SETTINGS_KEY, JSON.stringify({ ...settings, updatedAt: new Date().toISOString() }));
}

export function loadQualitySearchApplyDashboardFilters(): boolean {
  if (typeof localStorage === 'undefined') return true;
  const raw = localStorage.getItem(QUALITY_SEARCH_APPLY_DASHBOARD_FILTERS_KEY);
  if (raw === null) return true;
  return raw !== 'false' && raw !== '"false"';
}

export function saveQualitySearchApplyDashboardFilters(enabled: boolean): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(QUALITY_SEARCH_APPLY_DASHBOARD_FILTERS_KEY, enabled ? 'true' : 'false');
  }
  enqueueQualitySyncItem({
    entityType: 'quality-search',
    entityId: `search-filter-toggle-${Date.now()}`,
    operation: 'quality-search-filter-toggle-updated',
    payloadSummary: `Quality Search shared dashboard filters ${enabled ? 'enabled' : 'disabled'}`,
  });
}

export function standardActionsForQuery(query: string, knowledge: QualityKnowledgeItem[]): string[] {
  const normalized = normalize(query);
  return buildStandardActionLibrary(knowledge)
    .filter((entry) => normalize(`${entry.defectTypeOrCategory} ${entry.recommendedVerification} ${entry.trainingRecommendation}`).includes(normalized) || normalized.includes(normalize(entry.defectTypeOrCategory)))
    .slice(0, 3)
    .flatMap((entry) => [entry.recommendedContainment, entry.recommendedVerification, entry.recommendedCorrectiveAction])
    .filter(Boolean);
}
