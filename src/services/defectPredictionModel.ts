import {
  getDefectRecordType,
  loadDefectRecords,
  type DefectRecordType,
  type ExtendedDefectLog,
} from '@/services/defectAnalytics';

export type DefectPredictionFeature = string;
export type DefectPredictionColumnType = 'categorical' | 'numeric' | 'date' | 'identifier' | 'text' | 'boolean' | 'empty';
export type DefectPredictionColumnRole = 'target' | 'feature' | 'ignored';
export type DefectPredictionWarningSeverity = 'info' | 'warning' | 'danger';
export type DefectPredictionReliabilityStatus =
  | 'Reliable Decision Support'
  | 'Moderate Decision Support'
  | 'Weak Learning Signal'
  | 'Insufficient Learning';

export interface DefectPredictionFieldHint {
  label?: string;
  type?: string;
}

export type DefectPredictionFieldHints = Record<string, DefectPredictionFieldHint>;

export interface DefectPredictionColumnOverride {
  type?: DefectPredictionColumnType;
  role?: DefectPredictionColumnRole;
  label?: string;
}

export type DefectPredictionColumnOverrides = Record<string, DefectPredictionColumnOverride>;

export type DefectPredictionRow = Partial<ExtendedDefectLog> & Record<string, unknown> & {
  defectType?: string;
  quantity?: number | string;
  inspectedQuantity?: number | string;
  estimatedCost?: number | string;
};

export interface DefectPredictionColumnWarning {
  code: string;
  message: string;
  severity: DefectPredictionWarningSeverity;
}

export interface DefectPredictionTopValue {
  value: string;
  count: number;
  percentage: number;
}

export interface DefectPredictionNumericBucket {
  label: string;
  min: number;
  max: number;
  count: number;
}

export interface DefectPredictionNumericStats {
  min: number;
  max: number;
  average: number;
  median: number;
  nullCount: number;
  outlierCount: number;
  lowerOutlierBound?: number;
  upperOutlierBound?: number;
  buckets: DefectPredictionNumericBucket[];
}

export interface DefectPredictionDateStats {
  earliest?: string;
  latest?: string;
  years: string[];
  quarters: string[];
  months: string[];
  weekdays: string[];
  hours: string[];
  mayBePostEvent: boolean;
}

export interface DefectPredictionCategoricalStats {
  cardinality: number;
  topValues: DefectPredictionTopValue[];
  rareValuesPercentage: number;
  unknownValuesPercentage: number;
  rareValues: string[];
}

export interface DefectPredictionColumnProfile {
  feature: string;
  label: string;
  displayName?: string;
  internalKey?: string;
  originalColumns?: string[];
  normalizedColumnName?: string;
  columnNameNormalized?: boolean;
  duplicateNormalizedColumn?: boolean;
  type: DefectPredictionColumnType;
  detectedType: DefectPredictionColumnType;
  role: DefectPredictionColumnRole;
  fillRate: number;
  nullCount: number;
  distinctCount: number;
  sampleValues: string[];
  reason: string;
  warnings: DefectPredictionColumnWarning[];
  numericStats?: DefectPredictionNumericStats;
  dateStats?: DefectPredictionDateStats;
  categoricalStats?: DefectPredictionCategoricalStats;
  valueVocabulary?: string[];
  manualOverride?: DefectPredictionColumnOverride;
}

export interface DefectPredictionValidationSummary {
  accuracy?: number;
  baselineAccuracy?: number;
  validationRows: number;
  trainRows: number;
  topClassLabel?: string;
  topClassShare: number;
}

export interface DefectPredictionModel {
  version: 3;
  trainedAt: string;
  targetField: string;
  targetLabel: string;
  totalRows: number;
  eligibleRows: number;
  excludedRows: number;
  labels: string[];
  activeFeatures: DefectPredictionFeature[];
  featureLabels: Record<DefectPredictionFeature, string>;
  columnProfiles: DefectPredictionColumnProfile[];
  labelCounts: Record<string, number>;
  featureCounts: Record<string, Record<string, Record<string, number>>>;
  featureImportance: Array<{
    feature: DefectPredictionFeature;
    value: string;
    label: string;
    confidence: number;
    sampleSize: number;
  }>;
  dataQuality: 'empty' | 'learning' | 'ready';
  trainingWarnings: string[];
  validation: DefectPredictionValidationSummary;
}

export interface DefectPredictionContribution {
  feature: string;
  label: string;
  value: string;
  effect: string;
  sampleSize: number;
  matchingCount: number;
  confidence: number;
}

export interface DefectPredictionConfidenceDetails {
  rawConfidence: number;
  calibratedConfidence: number;
  activeInputFields: number;
  unknownFields: number;
  ignoredInputFields: number;
  matchedSampleSize: number;
  reliabilityFactors: string[];
}

export interface DefectPredictionIgnoredField {
  feature: string;
  label: string;
  reason: string;
  value?: string;
}

export interface DefectPredictionResult {
  defectType: string;
  confidence: number;
  dataQuality: DefectPredictionModel['dataQuality'];
  riskLevel: 'low' | 'medium' | 'high';
  reliabilityStatus: DefectPredictionReliabilityStatus;
  actionPermissionMessage: string;
  probabilities: Array<{ label: string; probability: number }>;
  explanation: string[];
  recommendedActions: string[];
  insufficientLearning: boolean;
  dataQualityWarnings: string[];
  confidenceDetails: DefectPredictionConfidenceDetails;
  topContributors: DefectPredictionContribution[];
  ignoredFields: DefectPredictionIgnoredField[];
  unknownFields: DefectPredictionIgnoredField[];
}

export interface DefectPredictionTrainingSummary {
  totalRows: number;
  eligibleRows: number;
  labels: string[];
  routeCounts: Record<DefectRecordType, number>;
}

export interface DefectPredictionPreset {
  id: string;
  name: string;
  description: string;
  targetField: string;
  targetLabel: string;
  overrides: DefectPredictionColumnOverrides;
  matchedColumns: string[];
}

export interface DefectPredictionColumnHygieneEntry {
  displayName: string;
  internalKey: string;
  originalColumns: string[];
  normalizedColumnName: string;
  aliasMapped: boolean;
  nameChanged: boolean;
  duplicateNormalizedColumn: boolean;
  duplicateMerged: boolean;
  duplicateConflict: boolean;
}

export interface DefectPredictionColumnHygieneSummary {
  normalizedColumns: DefectPredictionColumnHygieneEntry[];
  duplicateColumns: DefectPredictionColumnHygieneEntry[];
  mergedDuplicateColumns: DefectPredictionColumnHygieneEntry[];
}

type CountBuildResult = {
  labelCounts: Record<string, number>;
  featureCounts: DefectPredictionModel['featureCounts'];
  eligibleRows: number;
};

type ColumnProfileCacheEntry = {
  key: string;
  profiles: DefectPredictionColumnProfile[];
};

const MODEL_STORAGE_KEY = 'qms_defect_prediction_model_v1';
const COLUMN_OVERRIDES_STORAGE_KEY = 'qms_defect_prediction_column_overrides_v1';
const columnProfileCache = new WeakMap<object, ColumnProfileCacheEntry>();

const DATA_XLSX_TARGET_FIELD = 'اصل العيب';
const DATA_XLSX_RECOMMENDED_FEATURES: Array<{ feature: string; type?: DefectPredictionColumnType }> = [
  { feature: 'الموديل', type: 'categorical' },
  { feature: 'رقم الكود', type: 'categorical' },
  { feature: 'part code', type: 'categorical' },
  { feature: 'model type', type: 'categorical' },
  { feature: 'type', type: 'categorical' },
  { feature: 'القسم', type: 'categorical' },
  { feature: 'الوردية', type: 'categorical' },
  { feature: 'الساعه', type: 'date' },
  { feature: 'المنطقة', type: 'categorical' },
  { feature: 'العملية', type: 'categorical' },
  { feature: 'الجزء', type: 'categorical' },
  { feature: 'منطقة الاكتشاف', type: 'categorical' },
  { feature: 'متسبب العيب', type: 'categorical' },
  { feature: 'درجة حرارة الغرفة', type: 'numeric' },
  { feature: 'فنى التوصيل', type: 'categorical' },
  { feature: 'نظام الورادى', type: 'categorical' },
  { feature: 'New Catageory', type: 'categorical' },
  { feature: 'نوع الاكسبانشن', type: 'categorical' },
  { feature: 'اعادة شحن الفريون', type: 'categorical' },
];

const DATA_XLSX_RECOMMENDED_IGNORED: Array<{ feature: string; type?: DefectPredictionColumnType }> = [
  { feature: 'الباركود', type: 'identifier' },
  { feature: 'رقم العربة', type: 'identifier' },
  { feature: 'Column22', type: 'empty' },
  { feature: 'Column23', type: 'empty' },
  { feature: 'Column24', type: 'empty' },
  { feature: 'Column25', type: 'empty' },
  { feature: 'وصف المشكلة', type: 'text' },
  { feature: 'السبب الجذري', type: 'text' },
  { feature: 'الاجراء المتخذ', type: 'text' },
  { feature: 'الاجراء التصحيحي', type: 'text' },
  { feature: 'مسئول التنفيذ', type: 'categorical' },
  { feature: 'ميعاد التنفيذ', type: 'date' },
];

const CORE_FEATURE_FIELDS = [
  'productionLine',
  'shift',
  'partId',
  'partNumber',
  'recordType',
  'severity',
  'quantity',
  'inspectedQuantity',
  'estimatedCost',
  'costCategory',
  'outgoingResult',
  'customerName',
  'shipmentId',
  'returnReference',
  'القسم',
  'الوردية',
  'الموديل',
  'رقم الكود',
  'part code',
  'model type',
  'type',
  'المنطقة',
  'العملية',
  'الجزء',
  'منطقة الاكتشاف',
  'نوع العيب',
  'تصنيف العيب',
  'متسبب العيب',
  'New Catageory',
];

const EXCLUDED_FEATURE_FIELDS = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'defectType',
  'description',
  'actionTaken',
  'operatorName',
  'relatedNcrId',
]);

const FIELD_ALIASES: Record<string, string[]> = {
  date: ['date', 'defect date', 'created at', 'التاريخ'],
  shift: ['shift', 'الوردية', 'نظام الورادى', 'نظام الورادي'],
  productionLine: ['productionLine', 'line', 'production line', 'process line', 'machine', 'station', 'القسم'],
  partId: ['partId', 'part id', 'partid', 'part code', 'part no', 'part number id', 'رقم الكود', 'الكود', 'كود الاكسبانشن'],
  partNumber: ['partNumber', 'part name', 'part number', 'part', 'item', 'product', 'الموديل', 'model type', 'type', 'نوع الاكسبانشن'],
  recordType: ['recordType', 'dashboard routing', 'record type', 'routing', 'route', 'category'],
  defectType: ['defectType', 'defect type', 'defect', 'defect category', 'failure mode', 'issue', 'العيب', 'وصف العيب'],
  quantity: ['quantity', 'qty', 'defect quantity', 'defects', 'عدد المعيب', 'عدد العيوب'],
  inspectedQuantity: ['inspectedQuantity', 'inspected quantity', 'inspection quantity', 'checked quantity', 'production quantity', 'inspected', 'انتاج اليوم', 'انتاج الوردية', 'pdn outgiong', 'عدد العينات المسحوبة'],
  estimatedCost: ['estimatedCost', 'estimated cost', 'cost', 'defect cost', 'copq'],
  costCategory: ['costCategory', 'cost category', 'cost type', 'copq category'],
  outgoingResult: ['outgoingResult', 'outgoing result', 'release result', 'result'],
  shipmentId: ['shipmentId', 'shipment id', 'shipment', 'delivery id'],
  customerName: ['customerName', 'customer', 'customer name', 'client'],
  releaseTimeHrs: ['releaseTimeHrs', 'release time hrs', 'release time', 'release hours', 'زمن العيب على serial checker'],
  returnReference: ['returnReference', 'return reference', 'return ref', 'rma'],
  severity: ['severity', 'priority', 'criticality', 'تصنيف العيب'],
  description: ['description', 'details', 'notes', 'وصف المشكلة', 'وصف العيب'],
  operatorName: ['operatorName', 'operator', 'operator name', 'inspector', 'الفني المتسبب', 'فنى التوصيل', 'فنى لم الشحنة'],
  actionTaken: ['actionTaken', 'action taken', 'action', 'containment', 'الاجراء المتخذ', 'الاجراء التصحيحي'],
  status: ['status', 'state'],
};

const COLUMN_KEY_ALIASES: Array<{ canonical: string; aliases: string[] }> = [
  {
    canonical: 'متسبب العيب',
    aliases: ['متسبب العيب', 'متسبب العيب '],
  },
  {
    canonical: 'رقم الكود',
    aliases: ['رقم الكود', 'رقم الكود '],
  },
  {
    canonical: 'الموديل',
    aliases: ['الموديل', 'الموديل '],
  },
  {
    canonical: 'part code',
    aliases: ['part code', 'Part Code', 'partcode', 'part_code', 'part-code'],
  },
  {
    canonical: 'model type',
    aliases: ['model type', 'Model Type', 'modeltype', 'model_type', 'model-type'],
  },
  {
    canonical: 'defectType',
    aliases: ['Defect Type', 'defect type', 'defecttype', 'defect_type', 'defect-type'],
  },
];

const NUMERIC_FIELDS = new Set([
  'quantity',
  'inspectedQuantity',
  'productionQuantity',
  'estimatedCost',
  'releaseTimeHrs',
  'عدد المعيب',
  'عدد العيوب',
  'درجة حرارة الغرفة',
  'درجة حرارة الجو',
  'OUTGOING PPM',
  'TARGET B S C',
]);

const IDENTIFIER_HINTS = [
  'id',
  'uuid',
  'serial',
  'reference',
  'ref',
  'shipment',
  'batch',
  'lot',
  'barcode',
  'باركود',
  'الباركود',
  'رقم العربة',
  'رقم الطلمبة',
];

const CODE_HINTS = ['code', 'number', 'كود', 'الكود', 'رقم'];
const TEXT_HINTS = ['description', 'notes', 'note', 'comment', 'comments', 'details', 'remark', 'وصف', 'مشكلة', 'ملاحظات'];
const LEAKAGE_HINTS = [
  'root cause',
  'corrective',
  'correction',
  'containment',
  'action taken',
  'investigation',
  'repair',
  'final decision',
  'disposition',
  'implementation',
  'execution',
  'validation',
  'السبب الجذري',
  'سبب جذري',
  'الاجراء المتخذ',
  'الاجراء التصحيحي',
  'الاجراءات التصحيحة',
  'اجراءات التسريب',
  'مسئول التنفيذ',
  'ميعاد التنفيذ',
  'تاريخ التنفيذ',
  'وصف المشكلة',
  'قرار نهائي',
  'نتيجة التحقيق',
];

const DATE_HINTS = ['date', 'time', 'year', 'month', 'week', 'quarter', 'التاريخ', 'الساعه', 'الساعة', 'ميعاد', 'تاريخ', 'الشهر', 'الأسبوع', 'الاسبوع', 'الربع', 'year'];

const PROTECTED_CATEGORICAL_FIELDS = new Set([
  'partId',
  'partNumber',
  'productionLine',
  'customerName',
  'shift',
  'severity',
  'recordType',
  'costCategory',
  'outgoingResult',
  'part code',
  'model type',
  'type',
  'رقم الكود',
  'الموديل',
  'القسم',
  'الوردية',
  'المنطقة',
  'العملية',
  'الجزء',
  'تصنيف العيب',
  'اصل العيب',
  'نوع العيب',
  'منطقة الاكتشاف',
  'متسبب العيب',
  'New Catageory',
]);

const COMMON_VALUE_NORMALIZATION: Record<string, string> = {
  process: 'Process',
  material: 'Material',
  design: 'Design',
  machine: 'Machine',
  method: 'Method',
  man: 'Man',
  'b series': 'B Series',
  'z series': 'Z Series',
  'old series': 'Old Series',
  '2025_q4': '2025_Q4',
  'q4': 'Q4',
  normal: 'Normal',
  inverter: 'Inverter',
  outdoor: 'Outdoor',
  indoor: 'Indoor',
  tcl: 'TCL',
  duct: 'Duct',
  false: 'False',
  true: 'True',
};

export const DEFECT_PREDICTION_FEATURE_LABELS: Record<string, string> = {
  productionLine: 'Line',
  shift: 'Shift',
  partId: 'Part ID',
  partNumber: 'Part Name',
  recordType: 'Record Type',
  severity: 'Severity',
  quantity: 'Quantity',
  inspectedQuantity: 'Inspected Quantity',
  estimatedCost: 'Estimated Cost',
  costCategory: 'Cost Category',
  outgoingResult: 'Outgoing Result',
  customerName: 'Customer',
  shipmentId: 'Shipment',
  returnReference: 'Return Reference',
  'اصل العيب': 'اصل العيب',
  'العيب': 'العيب',
  'تصنيف العيب': 'تصنيف العيب',
  'نوع العيب': 'نوع العيب',
  'منطقة الاكتشاف': 'منطقة الاكتشاف',
  'متسبب العيب': 'متسبب العيب',
  'القسم': 'القسم',
  'الوردية': 'الوردية',
  'الموديل': 'الموديل',
  'رقم الكود': 'رقم الكود',
  'part code': 'Part Code',
  'model type': 'Model Type',
  type: 'Type',
  'المنطقة': 'المنطقة',
  'العملية': 'العملية',
  'الجزء': 'الجزء',
  'New Catageory': 'New Category',
};

export function emptyDefectPredictionSummary(): DefectPredictionTrainingSummary {
  return {
    totalRows: 0,
    eligibleRows: 0,
    labels: [],
    routeCounts: {
      'process-ppm': 0,
      'defect-cost': 0,
      'outgoing-quality': 0,
      'customer-return': 0,
    },
  };
}

function normalizeArabicDigits(value: string): string {
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return value
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)));
}

function stripArabicMarks(value: string): string {
  return value
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/\u0640/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي');
}

function normalizeSpaces(value: string): string {
  return value
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeColumnName(value: string): string {
  return normalizeSpaces(stripArabicMarks(normalizeArabicDigits(String(value))));
}

function cleanKey(value: string): string {
  return normalizeColumnName(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

const COLUMN_META_PROPERTY = '__qmsPredictionColumnMeta';
const NORMALIZED_ROW_PROPERTY = '__qmsPredictionNormalizedRow';

type ColumnNameMetaMap = Record<string, DefectPredictionColumnHygieneEntry>;

type ColumnNormalizationPlanItem = DefectPredictionColumnHygieneEntry & {
  sourceKey: string;
  fillCount: number;
};

function columnAliasLookup(): Map<string, string> {
  const lookup = new Map<string, string>();
  COLUMN_KEY_ALIASES.forEach(({ canonical, aliases }) => {
    const normalizedCanonical = normalizeColumnName(canonical);
    lookup.set(cleanKey(normalizedCanonical), normalizedCanonical);
    aliases.forEach((alias) => lookup.set(cleanKey(alias), normalizedCanonical));
  });
  return lookup;
}

const COLUMN_ALIAS_LOOKUP = columnAliasLookup();

function canonicalColumnKey(value: string): string {
  const normalized = normalizeColumnName(value);
  return COLUMN_ALIAS_LOOKUP.get(cleanKey(normalized)) || normalized;
}

function getColumnMeta(row: Record<string, unknown>): ColumnNameMetaMap {
  const meta = (row as Record<string, unknown>)[COLUMN_META_PROPERTY];
  return meta && typeof meta === 'object' ? meta as ColumnNameMetaMap : {};
}

function isNormalizedPredictionRow(row: Record<string, unknown>): boolean {
  return Boolean((row as Record<string, unknown>)[NORMALIZED_ROW_PROPERTY]);
}

function attachColumnMeta(row: DefectPredictionRow, meta: ColumnNameMetaMap): DefectPredictionRow {
  Object.defineProperty(row, COLUMN_META_PROPERTY, {
    value: meta,
    enumerable: false,
    configurable: true,
  });
  Object.defineProperty(row, NORMALIZED_ROW_PROPERTY, {
    value: true,
    enumerable: false,
    configurable: true,
  });
  return row;
}

function hasFilledColumnValue(value: unknown): boolean {
  if (typeof value === 'number') return Number.isFinite(value);
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  return Boolean(cleanText(value));
}

function cleanText(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString().split('T')[0];
  }

  const cleaned = normalizeSpaces(stripArabicMarks(normalizeArabicDigits(String(value))));
  const lowered = cleaned.toLowerCase();
  if (!cleaned || ['---', '--', '-', 'n/a', 'na', 'null', 'undefined', 'blank'].includes(lowered)) {
    return '';
  }
  return cleaned;
}

function normalizeCategoricalValue(value: unknown): string {
  const cleaned = cleanText(value);
  if (!cleaned) return '';
  const lowered = cleaned.toLowerCase().replace(/\s+/g, ' ');
  const mapped = COMMON_VALUE_NORMALIZATION[lowered];
  if (mapped) return mapped;

  if (/^[a-z0-9\s_\-./]+$/i.test(cleaned) && /\d/.test(cleaned)) {
    return cleaned.replace(/\s+/g, '').toUpperCase();
  }

  if (/^[a-z\s]+$/i.test(cleaned)) {
    return cleaned
      .toLowerCase()
      .split(' ')
      .map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : part)
      .join(' ');
  }

  return cleaned;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = cleanText(value).replace(/,/g, '');
  if (!cleaned) return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseNumberish(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const cleaned = cleanText(value).replace(/,/g, '').replace(/%$/, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function pickValue(row: Record<string, unknown>, candidates: string[]): unknown {
  const lookup = new Map<string, unknown>();
  Object.entries(row).forEach(([key, value]) => lookup.set(cleanKey(key), value));

  for (const candidate of candidates) {
    const value = lookup.get(cleanKey(candidate));
    if (cleanText(value) || typeof value === 'number') return value;
  }

  return undefined;
}

function buildColumnNormalizationPlan(rows: Array<Record<string, unknown>>): Map<string, ColumnNormalizationPlanItem> {
  const candidates = new Map<string, ColumnNormalizationPlanItem>();

  rows.forEach((row) => {
    const inheritedMeta = getColumnMeta(row);

    Object.entries(row).forEach(([sourceKey, value]) => {
      if (!sourceKey || sourceKey === COLUMN_META_PROPERTY) return;

      const inherited = inheritedMeta[sourceKey];
      const displayName = inherited?.displayName || inherited?.originalColumns?.[0] || sourceKey;
      const originalColumns = inherited?.originalColumns?.length ? inherited.originalColumns : [displayName];
      const normalizedColumnName = inherited?.normalizedColumnName || normalizeColumnName(displayName);
      const canonicalKey = normalizeFeatureName(inherited?.internalKey || sourceKey);
      const existing = candidates.get(sourceKey);
      const fillCount = (existing?.fillCount || 0) + (hasFilledColumnValue(value) ? 1 : 0);

      candidates.set(sourceKey, {
        sourceKey,
        displayName,
        internalKey: canonicalKey,
        originalColumns: [...new Set([...(existing?.originalColumns || []), ...originalColumns])],
        normalizedColumnName,
        aliasMapped: inherited?.aliasMapped ?? cleanKey(normalizedColumnName) !== cleanKey(canonicalKey),
        nameChanged: inherited?.nameChanged ?? normalizedColumnName !== displayName,
        duplicateNormalizedColumn: inherited?.duplicateNormalizedColumn || false,
        duplicateMerged: inherited?.duplicateMerged || false,
        duplicateConflict: inherited?.duplicateConflict || false,
        fillCount,
      });
    });
  });

  const groups = new Map<string, ColumnNormalizationPlanItem[]>();
  candidates.forEach((candidate) => {
    const key = cleanKey(candidate.internalKey);
    groups.set(key, [...(groups.get(key) || []), candidate]);
  });

  groups.forEach((group) => {
    if (group.length <= 1) return;

    const sortedByFill = [...group].sort((a, b) => b.fillCount - a.fillCount);
    const primary = sortedByFill[0];
    const canMerge = sortedByFill.slice(1).every((item) => (
      item.fillCount === 0 || item.fillCount <= Math.max(1, Math.round(primary.fillCount * 0.05))
    ));

    if (canMerge) {
      group.forEach((item) => {
        item.internalKey = primary.internalKey;
        item.duplicateNormalizedColumn = true;
        item.duplicateMerged = true;
        item.duplicateConflict = false;
        item.originalColumns = [...new Set(group.flatMap((entry) => entry.originalColumns))];
      });
      return;
    }

    group.forEach((item, index) => {
      item.duplicateNormalizedColumn = true;
      item.duplicateMerged = false;
      item.duplicateConflict = true;
      item.originalColumns = [...new Set(group.flatMap((entry) => entry.originalColumns))];
      if (index > 0) {
        item.internalKey = `${item.internalKey}__duplicate_${index + 1}`;
      }
    });
  });

  return candidates;
}

function mergeColumnMeta(current: DefectPredictionColumnHygieneEntry | undefined, next: DefectPredictionColumnHygieneEntry): DefectPredictionColumnHygieneEntry {
  return {
    displayName: current?.displayName || next.displayName,
    internalKey: next.internalKey,
    originalColumns: [...new Set([...(current?.originalColumns || []), ...next.originalColumns])],
    normalizedColumnName: current?.normalizedColumnName || next.normalizedColumnName,
    aliasMapped: Boolean(current?.aliasMapped || next.aliasMapped),
    nameChanged: Boolean(current?.nameChanged || next.nameChanged),
    duplicateNormalizedColumn: Boolean(current?.duplicateNormalizedColumn || next.duplicateNormalizedColumn),
    duplicateMerged: Boolean(current?.duplicateMerged || next.duplicateMerged),
    duplicateConflict: Boolean(current?.duplicateConflict || next.duplicateConflict),
  };
}

function normalizeRecordType(row: DefectPredictionRow): DefectRecordType {
  const raw = cleanText(row.recordType).toLowerCase();
  if (['defect-cost', 'defect cost', 'cost', 'copq'].includes(raw)) return 'defect-cost';
  if (['outgoing-quality', 'outgoing quality', 'outgoing', 'oqc', 'release'].includes(raw)) return 'outgoing-quality';
  if (['customer-return', 'customer return', 'return', 'returns'].includes(raw)) return 'customer-return';
  if (raw.includes('cost')) return 'defect-cost';
  if (raw.includes('outgoing') || raw.includes('release')) return 'outgoing-quality';
  if (raw.includes('return')) return 'customer-return';
  return getDefectRecordType(row as ExtendedDefectLog);
}

function normalizeLabel(value: unknown): string {
  return normalizeCategoricalValue(value);
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function percentile(sorted: number[], ratio: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * ratio)));
  return sorted[index];
}

function createNumericBuckets(values: number[]): DefectPredictionNumericBucket[] {
  if (values.length === 0) return [];
  const sorted = [...values].sort((a, b) => a - b);
  const unique = [...new Set(sorted)];
  const cuts = unique.length >= 4
    ? [percentile(sorted, 0.25), percentile(sorted, 0.5), percentile(sorted, 0.75)]
    : unique.slice(0, -1);
  const boundaries = [...new Set(cuts)].sort((a, b) => a - b);

  if (boundaries.length === 0) {
    return [{ label: `value:${round(sorted[0])}`, min: sorted[0], max: sorted[sorted.length - 1], count: values.length }];
  }

  const ranges: Array<{ min: number; max: number; label: string }> = [];
  let min = sorted[0];
  boundaries.forEach((boundary, index) => {
    ranges.push({
      min,
      max: boundary,
      label: index === 0 ? `<=${round(boundary)}` : `${round(min)}-${round(boundary)}`,
    });
    min = boundary;
  });
  ranges.push({ min, max: sorted[sorted.length - 1], label: `>${round(boundaries[boundaries.length - 1])}` });

  return ranges.map((range) => ({
    ...range,
    count: values.filter((value) => value >= range.min && value <= range.max).length,
  }));
}

function numericStats(values: number[], nullCount: number): DefectPredictionNumericStats | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = percentile(sorted, 0.25);
  const q3 = percentile(sorted, 0.75);
  const iqr = q3 - q1;
  const low = q1 - (1.5 * iqr);
  const high = q3 + (1.5 * iqr);

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    average: round(values.reduce((sum, value) => sum + value, 0) / values.length),
    median: round(percentile(sorted, 0.5)),
    nullCount,
    outlierCount: iqr > 0 ? values.filter((value) => value < low || value > high).length : 0,
    lowerOutlierBound: iqr > 0 ? round(low) : undefined,
    upperOutlierBound: iqr > 0 ? round(high) : undefined,
    buckets: createNumericBuckets(values),
  };
}

function parseDateValue(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'number' && value > 20_000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + (value * 86_400_000));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const raw = cleanText(value);
  if (!raw || looksNumeric(raw)) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function quarterOf(date: Date): string {
  return `${date.getFullYear()}_Q${Math.floor(date.getMonth() / 3) + 1}`;
}

function monthOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function weekdayOf(date: Date): string {
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
}

function hourOf(date: Date): string {
  return String(date.getHours()).padStart(2, '0');
}

function dayPeriod(value: unknown): string {
  const raw = cleanText(value).toLowerCase();
  if (!raw) return '';
  let hours: number | null = null;

  const decimalTime = Number(raw);
  if (Number.isFinite(decimalTime) && decimalTime > 0 && decimalTime < 1) {
    hours = Math.floor(decimalTime * 24);
  } else {
    const match = raw.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (match) {
      hours = Number(match[1]);
      const marker = match[3];
      if (marker === 'pm' && hours < 12) hours += 12;
      if (marker === 'am' && hours === 12) hours = 0;
    }
  }

  if (hours === null || !Number.isFinite(hours)) return '';
  if (hours >= 5 && hours < 12) return 'morning';
  if (hours >= 12 && hours < 17) return 'afternoon';
  if (hours >= 17 && hours < 22) return 'evening';
  return 'night';
}

function dateStats(values: unknown[], feature: string): DefectPredictionDateStats | undefined {
  const dates = values
    .map(parseDateValue)
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length === 0) return undefined;

  const years = [...new Set(dates.map((date) => String(date.getFullYear())))];
  const quarters = [...new Set(dates.map(quarterOf))];
  const months = [...new Set(dates.map(monthOf))];
  const weekdays = [...new Set(dates.map(weekdayOf))];
  const hours = [...new Set(dates.map(hourOf))];
  const key = cleanKey(feature);
  const mayBePostEvent = ['execution', 'implementation', 'validation', 'ميعادالتنفيذ', 'تاريخالتنفيذ'].some((token) => key.includes(cleanKey(token)));

  return {
    earliest: dates[0].toISOString().split('T')[0],
    latest: dates[dates.length - 1].toISOString().split('T')[0],
    years,
    quarters,
    months,
    weekdays,
    hours,
    mayBePostEvent,
  };
}

function dateBucket(value: unknown): string {
  const date = parseDateValue(value);
  const period = dayPeriod(value);
  if (!date) return period ? `period:${period}` : '';

  return [
    `quarter:${quarterOf(date)}`,
    `month:${monthOf(date)}`,
    `weekday:${weekdayOf(date)}`,
    `hour:${hourOf(date)}`,
    period ? `period:${period}` : '',
  ].filter(Boolean).join('|');
}

function looksNumeric(value: unknown): boolean {
  return parseNumberish(value) !== null;
}

function booleanValue(value: unknown): string {
  const cleaned = cleanText(value).toLowerCase();
  if (!cleaned) return '';
  if (['true', 'yes', 'y', '1', 'pass', 'ok', 'نعم', 'صحيح'].includes(cleaned)) return 'true';
  if (['false', 'no', 'n', '0', 'fail', 'ng', 'لا', 'خطا', 'خطأ'].includes(cleaned)) return 'false';
  return '';
}

function columnTypeFromHint(type?: string): DefectPredictionColumnType | null {
  if (!type) return null;
  if (['number', 'calculated', 'formula'].includes(type)) return 'numeric';
  if (['date', 'datetime'].includes(type)) return 'date';
  if (type === 'checkbox') return 'boolean';
  if (['textarea', 'file', 'signature'].includes(type)) return 'text';
  if (['barcode', 'relation', 'lookup'].includes(type)) return 'identifier';
  if (['select', 'multiselect', 'radio', 'button-group', 'checkbox-group'].includes(type)) return 'categorical';
  return null;
}

function includesAnyToken(feature: string, tokens: string[]): boolean {
  const key = cleanKey(feature);
  return tokens.some((token) => key.includes(cleanKey(token)));
}

function countValues(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return counts;
}

function topValues(counts: Map<string, number>, total: number, limit = 8): DefectPredictionTopValue[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({
      value,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
}

function createCategoricalStats(values: string[], totalRows: number): DefectPredictionCategoricalStats {
  const counts = countValues(values);
  const rareThreshold = values.length >= 100 ? 3 : 2;
  const rareValues = [...counts.entries()]
    .filter(([, count]) => count < rareThreshold)
    .map(([value]) => value);
  const rareCount = rareValues.reduce((sum, value) => sum + (counts.get(value) || 0), 0);

  return {
    cardinality: counts.size,
    topValues: topValues(counts, values.length),
    rareValuesPercentage: values.length > 0 ? Math.round((rareCount / values.length) * 100) : 0,
    unknownValuesPercentage: totalRows > 0 ? Math.round(((totalRows - values.length) / totalRows) * 100) : 0,
    rareValues,
  };
}

function normalizeFeatureName(feature: string): string {
  return canonicalColumnKey(feature);
}

function normalizeColumnOverrides(overrides: DefectPredictionColumnOverrides = {}): DefectPredictionColumnOverrides {
  return Object.entries(overrides).reduce((acc, [feature, override]) => {
    const normalizedFeature = normalizeFeatureName(feature);
    if (!normalizedFeature) return acc;
    acc[normalizedFeature] = { ...(acc[normalizedFeature] || {}), ...override };
    return acc;
  }, {} as DefectPredictionColumnOverrides);
}

function normalizeFieldHints(fieldHints: DefectPredictionFieldHints = {}): DefectPredictionFieldHints {
  return Object.entries(fieldHints).reduce((acc, [feature, hint]) => {
    const normalizedFeature = normalizeFeatureName(feature);
    if (!normalizedFeature) return acc;
    acc[normalizedFeature] = { ...(acc[normalizedFeature] || {}), ...hint };
    return acc;
  }, {} as DefectPredictionFieldHints);
}

function stableProfileCacheKey(
  targetField: string,
  targetLabel: string,
  fieldHints: DefectPredictionFieldHints,
  overrides: DefectPredictionColumnOverrides,
): string {
  const hints = Object.entries(fieldHints)
    .map(([feature, hint]) => [normalizeFeatureName(feature), hint.label || '', hint.type || ''])
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  const overrideEntries = Object.entries(overrides)
    .map(([feature, override]) => [normalizeFeatureName(feature), override.type || '', override.role || '', override.label || ''])
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])));

  return JSON.stringify({
    targetField: normalizeFeatureName(targetField),
    targetLabel,
    hints,
    overrides: overrideEntries,
  });
}

function collectColumnMetaFromRows(rows: Array<Record<string, unknown>>): ColumnNameMetaMap {
  return rows.reduce<ColumnNameMetaMap>((acc, row) => {
    const meta = getColumnMeta(row);
    (Object.entries(meta) as Array<[string, DefectPredictionColumnHygieneEntry]>).forEach(([feature, entry]) => {
      const normalizedFeature = normalizeFeatureName(feature);
      acc[normalizedFeature] = mergeColumnMeta(acc[normalizedFeature], {
        ...entry,
        internalKey: normalizedFeature,
      });
    });
    return acc;
  }, {} as ColumnNameMetaMap);
}

export function getDefectPredictionColumnDisplayLabels(rows: DefectPredictionRow[]): Record<string, string> {
  const normalizedRows = normalizePredictionRows(rows);
  const meta = collectColumnMetaFromRows(normalizedRows);
  return Object.entries(meta).reduce((acc, [feature, entry]) => {
    acc[feature] = entry.displayName || DEFECT_PREDICTION_FEATURE_LABELS[feature] || feature;
    return acc;
  }, {} as Record<string, string>);
}

export function summarizeDefectPredictionColumnHygiene(rows: DefectPredictionRow[]): DefectPredictionColumnHygieneSummary {
  const normalizedRows = normalizePredictionRows(rows);
  const entries = Object.values(collectColumnMetaFromRows(normalizedRows));
  const normalizedColumns = entries.filter((entry) => entry.nameChanged || entry.aliasMapped);
  const duplicateColumns = entries.filter((entry) => entry.duplicateNormalizedColumn);
  const mergedDuplicateColumns = entries.filter((entry) => entry.duplicateMerged);

  return {
    normalizedColumns,
    duplicateColumns,
    mergedDuplicateColumns,
  };
}

function isProtectedCategorical(feature: string): boolean {
  const normalized = normalizeFeatureName(feature);
  return PROTECTED_CATEGORICAL_FIELDS.has(normalized)
    || [...PROTECTED_CATEGORICAL_FIELDS].some((field) => cleanKey(field) === cleanKey(normalized));
}

function numericBucket(value: unknown, profile?: DefectPredictionColumnProfile): string {
  const amount = parseNumberish(value);
  if (amount === null) return '';
  const stats = profile?.numericStats;

  if (stats?.lowerOutlierBound !== undefined && amount < stats.lowerOutlierBound) return '__outlier_low__';
  if (stats?.upperOutlierBound !== undefined && amount > stats.upperOutlierBound) return '__outlier_high__';

  const buckets = profile?.numericStats?.buckets || [];
  const bucket = buckets.find((item, index) => (
    index === buckets.length - 1
      ? amount >= item.min && amount <= item.max
      : amount >= item.min && amount <= item.max
  ));
  if (bucket) return bucket.label;

  if (amount <= 0) return 'value:0';
  if (amount <= 1) return 'low:1';
  if (amount <= 5) return 'low:2-5';
  if (amount <= 20) return 'medium:6-20';
  if (amount <= 100) return 'high:21-100';
  return 'very-high:100+';
}

function categoricalFeatureValue(value: unknown, profile?: DefectPredictionColumnProfile): string {
  const normalized = normalizeCategoricalValue(value);
  if (!normalized) return '';

  const rareValues = profile?.categoricalStats?.rareValues || [];
  if (rareValues.includes(normalized)) return '__rare__';

  const vocabulary = profile?.valueVocabulary || [];
  if (vocabulary.length > 0 && !vocabulary.includes(normalized)) return '__unknown__';

  return normalized;
}

function featureValue(row: DefectPredictionRow, feature: DefectPredictionFeature, profile?: DefectPredictionColumnProfile): string {
  if (feature === 'recordType') return normalizeRecordType(row);
  const value = row[feature];
  if (profile?.role === 'ignored' || profile?.role === 'target') return '';
  if (profile?.type === 'numeric' || NUMERIC_FIELDS.has(feature)) return numericBucket(value, profile);
  if (profile?.type === 'date') return dateBucket(value);
  if (profile?.type === 'boolean') return booleanValue(value);
  if (profile?.type === 'identifier' || profile?.type === 'text' || profile?.type === 'empty') return '';
  return categoricalFeatureValue(value, profile);
}

function inferColumnType(
  feature: string,
  rows: DefectPredictionRow[],
  hint?: DefectPredictionFieldHint,
  override?: DefectPredictionColumnOverride,
  columnMeta?: DefectPredictionColumnHygieneEntry,
): DefectPredictionColumnProfile {
  const rawValues = rows.map((row) => row[feature]);
  const values = rawValues.map(cleanText).filter(Boolean);
  const normalizedValues = values.map(normalizeCategoricalValue).filter(Boolean);
  const totalRows = Math.max(1, rows.length);
  const nullCount = rows.length - values.length;
  const fillRate = Math.round((values.length / totalRows) * 100);
  const distinctValues = [...new Set(normalizedValues)];
  const distinctCount = distinctValues.length;
  const uniqueRatio = values.length ? distinctCount / values.length : 0;
  const hintedType = columnTypeFromHint(hint?.type);
  const numericValues = rawValues
    .map(parseNumberish)
    .filter((value): value is number => value !== null);
  const numericRatio = values.length ? numericValues.length / values.length : 0;
  const dateValues = rawValues
    .map(parseDateValue)
    .filter((date): date is Date => Boolean(date));
  const dateRatio = values.length ? dateValues.length / values.length : 0;
  const booleanRatio = values.length ? values.filter((value) => Boolean(booleanValue(value))).length / values.length : 0;
  const avgLength = values.length ? values.reduce((sum, value) => sum + value.length, 0) / values.length : 0;
  const hasIdentifierName = includesAnyToken(feature, IDENTIFIER_HINTS);
  const hasCodeName = includesAnyToken(feature, CODE_HINTS);
  const hasTextName = includesAnyToken(feature, TEXT_HINTS);
  const hasDateName = includesAnyToken(feature, DATE_HINTS);
  const hasLeakageName = includesAnyToken(feature, LEAKAGE_HINTS);
  const protectedCategorical = isProtectedCategorical(feature);
  const warnings: DefectPredictionColumnWarning[] = [];
  const categoricalStats = createCategoricalStats(normalizedValues, rows.length);
  const stats = numericStats(numericValues, nullCount);
  const dates = dateStats(rawValues, feature);

  let type: DefectPredictionColumnType = hintedType || 'categorical';
  let role: DefectPredictionColumnRole = 'feature';
  let reason = 'usable categorical signal';

  if (values.length === 0) {
    type = 'empty';
    role = 'ignored';
    reason = 'empty column';
  } else if (EXCLUDED_FEATURE_FIELDS.has(feature)) {
    type = hasTextName ? 'text' : 'identifier';
    role = 'ignored';
    reason = 'system or narrative column';
  } else if (hasLeakageName) {
    type = avgLength > 30 || hasTextName ? 'text' : 'categorical';
    role = 'ignored';
    reason = 'Possible target leakage - this field may be known only after defect investigation.';
    warnings.push({
      code: 'target-leakage',
      severity: 'danger',
      message: 'Possible target leakage. Excluded by default because it may be written after investigation.',
    });
  } else if (hintedType) {
    type = hintedType;
    reason = `form field type: ${hint?.type}`;
  } else if (numericRatio >= 0.8) {
    type = hasDateName && dateRatio >= 0.5 ? 'date' : 'numeric';
    reason = type === 'date' ? 'date/time pattern' : 'mostly numeric values';
  } else if (dateRatio >= 0.7 || hasDateName) {
    type = 'date';
    reason = 'date/time pattern';
  } else if (booleanRatio >= 0.8) {
    type = 'boolean';
    reason = 'boolean-like values';
  } else if (hasTextName || avgLength > 55) {
    type = 'text';
    role = 'ignored';
    reason = 'long narrative text';
  } else if ((hasIdentifierName || hasCodeName) && uniqueRatio > 0.35 && values.length > 20 && !protectedCategorical) {
    type = 'identifier';
    role = 'ignored';
    reason = 'mostly unique identifier';
  } else if (uniqueRatio > 0.85 && values.length > 30 && !protectedCategorical) {
    type = 'identifier';
    role = 'ignored';
    reason = 'too many unique values';
  }

  if (type === 'categorical' && fillRate < 10 && !protectedCategorical) {
    role = 'ignored';
    reason = 'too sparse for reliable learning';
    warnings.push({
      code: 'sparse-column',
      severity: 'warning',
      message: 'Sparse column. Include it manually only if it is operationally important.',
    });
  }

  if (fillRate > 0 && fillRate < 40 && role !== 'ignored') {
    warnings.push({
      code: 'low-fill-rate',
      severity: 'warning',
      message: `Low fill rate (${fillRate}%). Predictions may be weak when this field is missing.`,
    });
  }

  if (type === 'categorical' && distinctCount > Math.max(50, rows.length * 0.2) && !protectedCategorical) {
    warnings.push({
      code: 'high-cardinality',
      severity: 'warning',
      message: 'High cardinality may overfit. Rare values will be grouped.',
    });
  }

  if (stats?.outlierCount) {
    warnings.push({
      code: 'numeric-outliers',
      severity: 'info',
      message: `${stats.outlierCount} numeric outliers detected.`,
    });
  }

  if (type === 'identifier') {
    warnings.push({
      code: 'identifier-field',
      severity: 'info',
      message: 'Identifier-like column. Excluded by default to avoid memorizing rows.',
    });
  }

  if (dates?.mayBePostEvent) {
    warnings.push({
      code: 'post-event-date',
      severity: 'warning',
      message: 'Date may happen after defect discovery.',
    });
  }

  if (columnMeta?.nameChanged || columnMeta?.aliasMapped) {
    warnings.push({
      code: columnMeta.aliasMapped ? 'column-alias-mapped' : 'column-normalized',
      severity: 'info',
      message: `Column name normalized internally: "${columnMeta.displayName}" → "${columnMeta.internalKey}". Raw data values were not changed.`,
    });
  }

  if (columnMeta?.duplicateNormalizedColumn) {
    warnings.push({
      code: 'duplicate-normalized-column',
      severity: columnMeta.duplicateConflict ? 'warning' : 'info',
      message: columnMeta.duplicateConflict
        ? 'Duplicate normalized column detected. Data was preserved using a separate internal key.'
        : 'Duplicate normalized column detected. Mostly empty duplicate columns were merged safely.',
    });
  }

  if ((type === 'text' || type === 'identifier' || type === 'empty') && role !== 'ignored') {
    role = 'ignored';
  }

  const detectedType = type;
  if (override?.type) {
    type = override.type;
    reason = `${reason}; manual type override`;
  }
  if (override?.role) {
    role = override.role;
    reason = `${reason}; manual role override`;
  }

  return {
    feature: normalizeFeatureName(feature),
    label: override?.label || hint?.label || columnMeta?.displayName || DEFECT_PREDICTION_FEATURE_LABELS[normalizeFeatureName(feature)] || normalizeFeatureName(feature),
    displayName: columnMeta?.displayName,
    internalKey: normalizeFeatureName(feature),
    originalColumns: columnMeta?.originalColumns,
    normalizedColumnName: columnMeta?.normalizedColumnName,
    columnNameNormalized: Boolean(columnMeta?.nameChanged || columnMeta?.aliasMapped),
    duplicateNormalizedColumn: Boolean(columnMeta?.duplicateNormalizedColumn),
    type,
    detectedType,
    role,
    fillRate,
    nullCount,
    distinctCount,
    sampleValues: distinctValues.slice(0, 4),
    reason,
    warnings,
    numericStats: type === 'numeric' || detectedType === 'numeric' ? stats : undefined,
    dateStats: type === 'date' || detectedType === 'date' ? dates : undefined,
    categoricalStats,
    valueVocabulary: distinctValues,
    manualOverride: override,
  };
}

export function inferDefectPredictionColumnProfiles(
  rows: DefectPredictionRow[],
  targetField = 'defectType',
  targetLabel = 'Defect Type',
  fieldHints: DefectPredictionFieldHints = {},
  overrides: DefectPredictionColumnOverrides = {},
): DefectPredictionColumnProfile[] {
  const cacheKey = stableProfileCacheKey(targetField, targetLabel, fieldHints, overrides);
  const cached = columnProfileCache.get(rows);
  if (cached?.key === cacheKey) return cached.profiles;

  const normalizedRows = normalizePredictionRows(rows);
  const normalizedFieldHints = normalizeFieldHints(fieldHints);
  const normalizedOverrides = normalizeColumnOverrides(overrides);
  const columnMeta = collectColumnMetaFromRows(normalizedRows);
  const discovered = new Set<string>();
  const normalizedTargetField = normalizeFeatureName(targetField);

  [...CORE_FEATURE_FIELDS, normalizedTargetField, ...Object.keys(normalizedFieldHints), ...Object.keys(normalizedOverrides)].forEach((feature) => {
    discovered.add(normalizeFeatureName(feature));
  });
  normalizedRows.forEach((row) => {
    Object.keys(row).forEach((feature) => discovered.add(normalizeFeatureName(feature)));
  });

  const profiles = [...discovered]
    .map((feature) => {
      const isTarget = cleanKey(feature) === cleanKey(normalizedTargetField);
      const profile = inferColumnType(feature, normalizedRows, normalizedFieldHints[feature], normalizedOverrides[feature], columnMeta[feature]);

      if (isTarget) {
        const detectedType: DefectPredictionColumnType = profile.detectedType === 'empty' ? 'empty' : 'categorical';
        return {
          ...profile,
          type: 'categorical' as const,
          detectedType,
          role: 'target' as const,
          label: targetLabel || profile.label,
          reason: 'selected prediction target',
        };
      }

      return profile;
    })
    .sort((a, b) => {
      const roleOrder = { target: 0, feature: 1, ignored: 2 };
      return roleOrder[a.role] - roleOrder[b.role] || a.label.localeCompare(b.label);
    });
  columnProfileCache.set(rows, { key: cacheKey, profiles });
  return profiles;
}

export function getDefectPredictionFeatures(
  rows: DefectPredictionRow[],
  preferredFeatures: string[] = [],
  excludedFeatures: string[] = [],
  fieldHints: DefectPredictionFieldHints = {},
  overrides: DefectPredictionColumnOverrides = {},
): string[] {
  const targetField = excludedFeatures[0] || 'defectType';
  const excluded = new Set([...excludedFeatures, 'defectType'].map(normalizeFeatureName));
  const profiles = inferDefectPredictionColumnProfiles(rows, targetField, DEFECT_PREDICTION_FEATURE_LABELS[targetField] || targetField, fieldHints, overrides);
  const preferred = new Set(preferredFeatures.map(normalizeFeatureName));
  return profiles
    .filter((profile) => profile.role === 'feature' && !excluded.has(profile.feature))
    .filter((profile) => preferred.size === 0 || preferred.has(profile.feature) || CORE_FEATURE_FIELDS.some((feature) => cleanKey(feature) === cleanKey(profile.feature)))
    .map((profile) => profile.feature);
}

export function getDefectPredictionRecommendedPreset(rows: DefectPredictionRow[]): DefectPredictionPreset | null {
  const normalizedRows = normalizePredictionRows(rows);
  const availableColumns = new Set<string>();

  normalizedRows.forEach((row) => {
    Object.keys(row).forEach((key) => availableColumns.add(cleanKey(key)));
  });

  const mustHave = ['اصل العيب', 'العيب', 'تصنيف العيب', 'الموديل', 'رقم الكود'];
  const matchedColumns = mustHave.filter((column) => availableColumns.has(cleanKey(column)));
  if (matchedColumns.length < 4) return null;

  const overrides: DefectPredictionColumnOverrides = {
    [normalizeFeatureName(DATA_XLSX_TARGET_FIELD)]: { role: 'target', type: 'categorical' },
  };

  DATA_XLSX_RECOMMENDED_FEATURES.forEach(({ feature, type }) => {
    const normalizedFeature = normalizeFeatureName(feature);
    if (availableColumns.has(cleanKey(normalizedFeature))) {
      overrides[normalizedFeature] = { role: 'feature', type };
    }
  });

  DATA_XLSX_RECOMMENDED_IGNORED.forEach(({ feature, type }) => {
    const normalizedFeature = normalizeFeatureName(feature);
    if (availableColumns.has(cleanKey(normalizedFeature))) {
      overrides[normalizedFeature] = { role: 'ignored', type };
    }
  });

  return {
    id: 'data-xlsx-hvac-defects',
    name: 'data.xlsx HVAC Defects',
    description: 'Recommended setup for the imported HVAC/AC defect history file.',
    targetField: normalizeFeatureName(DATA_XLSX_TARGET_FIELD),
    targetLabel: DATA_XLSX_TARGET_FIELD,
    overrides,
    matchedColumns,
  };
}

function createFeatureCounts(features: DefectPredictionFeature[]): Record<string, Record<string, Record<string, number>>> {
  return features.reduce((acc, feature) => {
    acc[feature] = {};
    return acc;
  }, {} as Record<string, Record<string, Record<string, number>>>);
}

function buildCounts(
  rows: DefectPredictionRow[],
  activeFeatures: DefectPredictionFeature[],
  profileByFeature: Map<string, DefectPredictionColumnProfile>,
): CountBuildResult {
  const labelCounts: Record<string, number> = {};
  const featureCounts = createFeatureCounts(activeFeatures);

  rows.forEach((row) => {
    const label = normalizeLabel(row.defectType);
    if (!label) return;

    labelCounts[label] = (labelCounts[label] || 0) + 1;

    activeFeatures.forEach((feature) => {
      const value = featureValue(row, feature, profileByFeature.get(feature));
      if (!value) return;

      featureCounts[feature][value] ||= {};
      featureCounts[feature][value][label] = (featureCounts[feature][value][label] || 0) + 1;
    });
  });

  return {
    labelCounts,
    featureCounts,
    eligibleRows: Object.values(labelCounts).reduce((sum, count) => sum + count, 0),
  };
}

function buildFeatureImportance(
  featureCounts: DefectPredictionModel['featureCounts'],
  features: DefectPredictionFeature[],
): DefectPredictionModel['featureImportance'] {
  return features.flatMap((feature) =>
    Object.entries(featureCounts[feature] || {}).map(([value, labelMap]) => {
      const entries = Object.entries(labelMap).sort((a, b) => b[1] - a[1]);
      const sampleSize = entries.reduce((sum, [, count]) => sum + count, 0);
      const [label, count] = entries[0] || ['', 0];

      return {
        feature,
        value,
        label,
        confidence: sampleSize > 0 ? Math.round((count / sampleSize) * 100) : 0,
        sampleSize,
      };
    }),
  )
    .filter((item) => item.label && item.sampleSize > 0)
    .sort((a, b) => (b.confidence * b.sampleSize) - (a.confidence * a.sampleSize))
    .slice(0, 20);
}

function determineDataQuality(eligibleRows: number, labels: number): DefectPredictionModel['dataQuality'] {
  if (eligibleRows === 0 || labels === 0) return 'empty';
  if (eligibleRows < 30 || labels < 2) return 'learning';
  return 'ready';
}

function classShare(labelCounts: Record<string, number>): { label?: string; share: number; count: number } {
  const entries = Object.entries(labelCounts).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const [label, count] = entries[0] || [undefined, 0];
  return {
    label,
    count,
    share: total > 0 ? Math.round((count / total) * 100) : 0,
  };
}

function scoreLabels(
  labels: string[],
  labelCounts: Record<string, number>,
  featureCounts: DefectPredictionModel['featureCounts'],
  activeFeatures: DefectPredictionFeature[],
  profileByFeature: Map<string, DefectPredictionColumnProfile>,
  input: DefectPredictionRow,
): Array<{ label: string; score: number }> {
  const labelTotal = Object.values(labelCounts).reduce((sum, count) => sum + count, 0);
  const labelCount = Math.max(1, labels.length);

  return labels.map((label) => {
    const prior = ((labelCounts[label] || 0) + 1) / (labelTotal + labelCount);
    let score = Math.log(prior);

    activeFeatures.forEach((feature) => {
      const value = featureValue(input, feature, profileByFeature.get(feature));
      if (!value) return;

      const uniqueValues = Math.max(1, Object.keys(featureCounts[feature] || {}).length);
      const matchingCount = featureCounts[feature]?.[value]?.[label] || 0;
      score += Math.log((matchingCount + 1) / ((labelCounts[label] || 0) + uniqueValues));
    });

    return { label, score };
  });
}

function softmax(scores: Array<{ label: string; score: number }>): Array<{ label: string; probability: number }> {
  if (scores.length === 0) return [];
  const maxScore = Math.max(...scores.map((item) => item.score));
  const expScores = scores.map((item) => ({
    label: item.label,
    value: Math.exp(item.score - maxScore),
  }));
  const total = expScores.reduce((sum, item) => sum + item.value, 0) || 1;

  return expScores
    .map((item) => ({
      label: item.label,
      probability: Math.round((item.value / total) * 100),
    }))
    .sort((a, b) => b.probability - a.probability);
}

function evaluateValidation(
  rows: DefectPredictionRow[],
  activeFeatures: DefectPredictionFeature[],
  profileByFeature: Map<string, DefectPredictionColumnProfile>,
  fullLabelCounts: Record<string, number>,
): DefectPredictionValidationSummary {
  const eligible = rows.filter((row) => normalizeLabel(row.defectType));
  const top = classShare(fullLabelCounts);

  if (eligible.length < 50 || Object.keys(fullLabelCounts).length < 2) {
    return {
      validationRows: 0,
      trainRows: eligible.length,
      topClassLabel: top.label,
      topClassShare: top.share,
    };
  }

  const validationRows = eligible.filter((_, index) => index % 5 === 0);
  const trainRows = eligible.filter((_, index) => index % 5 !== 0);
  const trainCounts = buildCounts(trainRows, activeFeatures, profileByFeature);
  const labels = Object.keys(trainCounts.labelCounts).sort((a, b) => trainCounts.labelCounts[b] - trainCounts.labelCounts[a]);
  const majority = classShare(trainCounts.labelCounts).label;
  let correct = 0;
  let baselineCorrect = 0;

  validationRows.forEach((row) => {
    const actual = normalizeLabel(row.defectType);
    const prediction = softmax(scoreLabels(labels, trainCounts.labelCounts, trainCounts.featureCounts, activeFeatures, profileByFeature, row))[0]?.label;
    if (prediction === actual) correct += 1;
    if (majority === actual) baselineCorrect += 1;
  });

  return {
    accuracy: validationRows.length ? Math.round((correct / validationRows.length) * 100) : undefined,
    baselineAccuracy: validationRows.length ? Math.round((baselineCorrect / validationRows.length) * 100) : undefined,
    validationRows: validationRows.length,
    trainRows: trainRows.length,
    topClassLabel: top.label,
    topClassShare: top.share,
  };
}

function trainingWarnings(
  eligibleRows: number,
  labelCounts: Record<string, number>,
  activeFeatures: DefectPredictionFeature[],
  validation: DefectPredictionValidationSummary,
): string[] {
  const warnings: string[] = [];
  const labels = Object.keys(labelCounts);
  const top = classShare(labelCounts);

  if (eligibleRows < 30) {
    warnings.push('Insufficient learning data. Add more rows before trusting predictions.');
  }
  if (labels.length < 2) {
    warnings.push('Only one target class was found. The model cannot compare alternatives yet.');
  }
  const lowSampleLabels = labels.filter((label) => labelCounts[label] < 5);
  if (lowSampleLabels.length > 0) {
    warnings.push(`${lowSampleLabels.length} target classes have fewer than 5 samples.`);
  }
  if (top.share > 70 && top.label) {
    warnings.push(`Class imbalance: "${top.label}" represents ${top.share}% of training rows.`);
  }
  if (labels.length > 30) {
    warnings.push('High complexity target: this target has many detailed classes. Prediction may be unstable unless each class has enough examples.');
  }
  if (labels.length > 0 && eligibleRows / labels.length < 10) {
    warnings.push('Low average samples per target class.');
  }
  if (activeFeatures.length < 3) {
    warnings.push('Too few usable feature columns. Include more operational columns before relying on predictions.');
  }
  if (validation.accuracy !== undefined && validation.baselineAccuracy !== undefined && validation.accuracy <= validation.baselineAccuracy) {
    warnings.push('Validation score is not better than majority-class baseline yet.');
  }

  return warnings;
}

export function normalizePredictionRows(rows: unknown[]): DefectPredictionRow[] {
  const sourceRows = rows.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object');
  if (sourceRows.length > 0 && sourceRows.every(isNormalizedPredictionRow)) {
    return sourceRows as DefectPredictionRow[];
  }

  const columnPlan = buildColumnNormalizationPlan(sourceRows);

  return sourceRows
    .map((row) => {
      const normalized: DefectPredictionRow = {
        date: cleanText(pickValue(row, FIELD_ALIASES.date)),
        shift: normalizeCategoricalValue(pickValue(row, FIELD_ALIASES.shift)),
        productionLine: normalizeCategoricalValue(pickValue(row, FIELD_ALIASES.productionLine)),
        partId: normalizeCategoricalValue(pickValue(row, FIELD_ALIASES.partId)),
        partNumber: normalizeCategoricalValue(pickValue(row, FIELD_ALIASES.partNumber)),
        recordType: normalizeCategoricalValue(pickValue(row, FIELD_ALIASES.recordType)),
        defectType: normalizeLabel(pickValue(row, FIELD_ALIASES.defectType)),
        quantity: toNumber(pickValue(row, FIELD_ALIASES.quantity)),
        inspectedQuantity: toNumber(pickValue(row, FIELD_ALIASES.inspectedQuantity)),
        estimatedCost: toNumber(pickValue(row, FIELD_ALIASES.estimatedCost)),
        costCategory: normalizeCategoricalValue(pickValue(row, FIELD_ALIASES.costCategory)),
        outgoingResult: normalizeCategoricalValue(pickValue(row, FIELD_ALIASES.outgoingResult)),
        shipmentId: normalizeCategoricalValue(pickValue(row, FIELD_ALIASES.shipmentId)),
        customerName: normalizeCategoricalValue(pickValue(row, FIELD_ALIASES.customerName)),
        releaseTimeHrs: toNumber(pickValue(row, FIELD_ALIASES.releaseTimeHrs)),
        returnReference: normalizeCategoricalValue(pickValue(row, FIELD_ALIASES.returnReference)),
        severity: normalizeCategoricalValue(pickValue(row, FIELD_ALIASES.severity)),
        description: cleanText(pickValue(row, FIELD_ALIASES.description)),
        operatorName: normalizeCategoricalValue(pickValue(row, FIELD_ALIASES.operatorName)),
        actionTaken: cleanText(pickValue(row, FIELD_ALIASES.actionTaken)),
        status: normalizeCategoricalValue(pickValue(row, FIELD_ALIASES.status)),
      };
      const columnMeta: ColumnNameMetaMap = {};

      Object.entries(row).forEach(([key, value]) => {
        const planItem = columnPlan.get(key);
        const normalizedKey = planItem?.internalKey || normalizeFeatureName(key);
        if (!normalizedKey) return;

        if (planItem) {
          const metaEntry: DefectPredictionColumnHygieneEntry = {
            displayName: planItem.displayName,
            internalKey: planItem.internalKey,
            originalColumns: planItem.originalColumns,
            normalizedColumnName: planItem.normalizedColumnName,
            aliasMapped: planItem.aliasMapped,
            nameChanged: planItem.nameChanged,
            duplicateNormalizedColumn: planItem.duplicateNormalizedColumn,
            duplicateMerged: planItem.duplicateMerged,
            duplicateConflict: planItem.duplicateConflict,
          };
          columnMeta[normalizedKey] = mergeColumnMeta(columnMeta[normalizedKey], metaEntry);
        }

        const existingValue = normalized[normalizedKey];
        if (hasFilledColumnValue(existingValue)) return;

        if (typeof value === 'number') {
          normalized[normalizedKey] = Number.isFinite(value) ? value : '';
          return;
        }
        if (value instanceof Date) {
          normalized[normalizedKey] = cleanText(value);
          return;
        }

        const cleaned = cleanText(value);
        if (cleaned) normalized[normalizedKey] = normalizeCategoricalValue(cleaned);
      });

      normalized.recordType = normalizeRecordType(normalized);
      return attachColumnMeta(normalized, columnMeta);
    });
}

export function applyDefectPredictionTarget(rows: DefectPredictionRow[], targetField = 'defectType'): DefectPredictionRow[] {
  const normalizedTargetField = normalizeFeatureName(targetField);
  return normalizePredictionRows(rows).map((row) => ({
    ...row,
    defectType: normalizeLabel(row[normalizedTargetField] ?? row.defectType),
  }));
}

export function summarizePredictionRows(rows: DefectPredictionRow[], targetField = 'defectType'): DefectPredictionTrainingSummary {
  const summary = emptyDefectPredictionSummary();
  const labels = new Set<string>();

  applyDefectPredictionTarget(rows, targetField).forEach((row) => {
    summary.totalRows += 1;
    summary.routeCounts[normalizeRecordType(row)] += 1;

    const label = normalizeLabel(row.defectType);
    if (label) {
      summary.eligibleRows += 1;
      labels.add(label);
    }
  });

  summary.labels = [...labels].sort((a, b) => a.localeCompare(b));
  return summary;
}

export async function loadDefectPredictionTrainingRows(importedRows: DefectPredictionRow[] = []): Promise<DefectPredictionRow[]> {
  const storedRows = await loadDefectRecords();
  return [...normalizePredictionRows(storedRows), ...normalizePredictionRows(importedRows)];
}

export function trainDefectPredictionModel(
  rows: DefectPredictionRow[],
  preferredFeatures: string[] = [],
  targetField = 'defectType',
  targetLabel = 'Defect Type',
  fieldHints: DefectPredictionFieldHints = {},
  overrides: DefectPredictionColumnOverrides = {},
): DefectPredictionModel {
  const normalizedRows = applyDefectPredictionTarget(rows, targetField);
  const normalizedTargetField = normalizeFeatureName(targetField);
  const columnProfiles = inferDefectPredictionColumnProfiles(normalizedRows, normalizedTargetField, targetLabel, fieldHints, overrides);
  const profileByFeature = new Map(columnProfiles.map((profile) => [profile.feature, profile]));
  const preferred = new Set(preferredFeatures.map(normalizeFeatureName));
  const activeFeatures = columnProfiles
    .filter((profile) => profile.role === 'feature')
    .filter((profile) => preferred.size === 0 || preferred.has(profile.feature) || CORE_FEATURE_FIELDS.some((feature) => cleanKey(feature) === cleanKey(profile.feature)))
    .map((profile) => profile.feature);

  const counts = buildCounts(normalizedRows, activeFeatures, profileByFeature);
  const labels = Object.keys(counts.labelCounts).sort((a, b) => counts.labelCounts[b] - counts.labelCounts[a]);
  const validation = evaluateValidation(normalizedRows, activeFeatures, profileByFeature, counts.labelCounts);

  return {
    version: 3,
    trainedAt: new Date().toISOString(),
    targetField: normalizedTargetField,
    targetLabel,
    totalRows: normalizedRows.length,
    eligibleRows: counts.eligibleRows,
    excludedRows: Math.max(0, normalizedRows.length - counts.eligibleRows),
    labels,
    activeFeatures,
    featureLabels: activeFeatures.reduce((acc, feature) => {
      acc[feature] = profileByFeature.get(feature)?.label || DEFECT_PREDICTION_FEATURE_LABELS[feature] || feature;
      return acc;
    }, {} as Record<string, string>),
    columnProfiles,
    labelCounts: counts.labelCounts,
    featureCounts: counts.featureCounts,
    featureImportance: buildFeatureImportance(counts.featureCounts, activeFeatures),
    dataQuality: determineDataQuality(counts.eligibleRows, labels.length),
    trainingWarnings: trainingWarnings(counts.eligibleRows, counts.labelCounts, activeFeatures, validation),
    validation,
  };
}

function collectPredictionDiagnostics(
  model: DefectPredictionModel,
  input: DefectPredictionRow,
  predictedLabel: string,
): {
  topContributors: DefectPredictionContribution[];
  unknownFields: DefectPredictionIgnoredField[];
  ignoredFields: DefectPredictionIgnoredField[];
  activeInputCount: number;
  matchedSampleTotal: number;
} {
  const profileByFeature = new Map((model.columnProfiles || []).map((profile) => [profile.feature, profile]));
  const topContributors: DefectPredictionContribution[] = [];
  const unknownFields: DefectPredictionIgnoredField[] = [];
  const ignoredFields: DefectPredictionIgnoredField[] = [];
  let activeInputCount = 0;
  let matchedSampleTotal = 0;

  model.activeFeatures.forEach((feature) => {
    const profile = profileByFeature.get(feature);
    const value = featureValue(input, feature, profile);
    if (!value) return;
    activeInputCount += 1;

    const counts = model.featureCounts[feature]?.[value];
    if (!counts || value === '__unknown__') {
      unknownFields.push({
        feature,
        label: model.featureLabels[feature] || profile?.label || feature,
        reason: 'Unseen value in training data',
        value,
      });
      return;
    }

    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const matching = counts[predictedLabel] || 0;
    matchedSampleTotal += total;
    if (matching === 0 || total === 0) return;

    topContributors.push({
      feature,
      label: model.featureLabels[feature] || profile?.label || feature,
      value,
      effect: `Historically associated with "${predictedLabel}"`,
      sampleSize: total,
      matchingCount: matching,
      confidence: Math.round((matching / total) * 100),
    });
  });

  (model.columnProfiles || []).forEach((profile) => {
    if (profile.role !== 'ignored') return;
    const value = cleanText(input[profile.feature]);
    if (!value) return;
    ignoredFields.push({
      feature: profile.feature,
      label: profile.label,
      reason: profile.reason,
      value,
    });
  });

  topContributors.sort((a, b) => (b.confidence * b.sampleSize) - (a.confidence * a.sampleSize));

  return {
    topContributors: topContributors.slice(0, 6),
    unknownFields: unknownFields.slice(0, 6),
    ignoredFields: ignoredFields.slice(0, 6),
    activeInputCount,
    matchedSampleTotal,
  };
}

function calibratedConfidence(
  model: DefectPredictionModel,
  rawProbability: number,
  activeInputCount: number,
  matchedSampleTotal: number,
  unknownCount: number,
  ignoredInputCount = 0,
): DefectPredictionConfidenceDetails {
  let confidence = rawProbability;
  const reliabilityFactors: string[] = [];

  if (model.dataQuality === 'learning') {
    confidence *= 0.65;
    reliabilityFactors.push('model is still learning');
  }
  if (model.eligibleRows < 30) {
    confidence *= 0.55;
    reliabilityFactors.push('fewer than 30 eligible rows');
  } else if (model.eligibleRows < 100) {
    confidence *= 0.82;
    reliabilityFactors.push('limited training rows');
  }
  if (activeInputCount < 3) {
    confidence *= 0.75;
    reliabilityFactors.push('too few active input fields');
  }
  if (matchedSampleTotal < 5) {
    confidence *= 0.7;
    reliabilityFactors.push('very small historical match sample');
  } else if (matchedSampleTotal < 20) {
    confidence *= 0.85;
    reliabilityFactors.push('small historical match sample');
  }

  const unknownRatio = activeInputCount > 0 ? unknownCount / activeInputCount : 1;
  if (unknownRatio > 0.35) reliabilityFactors.push('many unseen input values');
  confidence *= Math.max(0.55, 1 - (unknownRatio * 0.45));

  if (ignoredInputCount > activeInputCount) {
    confidence *= 0.9;
    reliabilityFactors.push('many filled inputs were ignored');
  }

  if (model.validation.topClassShare > 70) {
    confidence *= 0.88;
    reliabilityFactors.push('target class imbalance');
  }
  if (model.activeFeatures.length < 3) {
    confidence *= 0.85;
    reliabilityFactors.push('too few active model features');
  }
  if (model.validation.accuracy !== undefined && model.validation.baselineAccuracy !== undefined && model.validation.accuracy <= model.validation.baselineAccuracy) {
    confidence *= 0.9;
    reliabilityFactors.push('validation is not above baseline yet');
  }

  if (model.labels.length > 30) {
    confidence *= 0.82;
    reliabilityFactors.push('high complexity target');
  } else if (model.labels.length > 25) {
    confidence *= 0.9;
    reliabilityFactors.push('selected target has many classes');
  }
  if (model.labels.length > 0 && model.eligibleRows / model.labels.length < 10) {
    confidence *= 0.85;
    reliabilityFactors.push('low average samples per target class');
  }

  const capped = model.dataQuality === 'learning' ? Math.min(confidence, 58) : confidence;
  const calibratedConfidenceValue = Math.max(0, Math.min(99, Math.round(capped)));

  return {
    rawConfidence: rawProbability,
    calibratedConfidence: calibratedConfidenceValue,
    activeInputFields: activeInputCount,
    unknownFields: unknownCount,
    ignoredInputFields: ignoredInputCount,
    matchedSampleSize: matchedSampleTotal,
    reliabilityFactors,
  };
}

function riskFromPrediction(label: string, confidence: number): DefectPredictionResult['riskLevel'] {
  const normalized = cleanText(label).toLowerCase();
  const highSeverity = ['critical', 'major', 'تسريب', 'لحام', 'عيب اداء', 'اداء', 'performance', 'safety'].some((token) => normalized.includes(token));
  if (highSeverity && confidence >= 45) return 'high';
  if (confidence >= 75) return 'high';
  if (confidence >= 45) return 'medium';
  return 'low';
}

function actionPermissionMessage(status: DefectPredictionReliabilityStatus): string {
  if (status === 'Reliable Decision Support') {
    return 'Use this result to prioritize checks, while confirming with standard quality verification.';
  }
  if (status === 'Moderate Decision Support') {
    return 'Use this as a supporting signal. Verify the top contributors before taking action.';
  }
  if (status === 'Weak Learning Signal') {
    return 'Use caution. The model found limited historical similarity.';
  }
  return 'Do not rely on this prediction yet. Add more records or select a more stable target.';
}

function predictionReliabilityStatus(
  model: DefectPredictionModel,
  confidenceDetails: DefectPredictionConfidenceDetails,
  contributors: DefectPredictionContribution[],
): DefectPredictionReliabilityStatus {
  const confidence = confidenceDetails.calibratedConfidence;
  const activeInputs = Math.max(1, confidenceDetails.activeInputFields);
  const unknownRatio = confidenceDetails.unknownFields / activeInputs;
  const averageSamplesPerClass = model.labels.length > 0 ? model.eligibleRows / model.labels.length : 0;
  const severeImbalance = model.validation.topClassShare > 70;
  const highComplexityTarget = model.labels.length > 30;
  const reliesOnOneStrongFeature = contributors.length === 1 && contributors[0].confidence >= 70;
  const fewActiveFeatures = model.activeFeatures.length < 3;

  if (
    confidence < 25
    || model.eligibleRows < 30
    || unknownRatio > 0.6
    || contributors.length === 0
    || (highComplexityTarget && averageSamplesPerClass < 10)
  ) {
    return 'Insufficient Learning';
  }

  if (
    confidence >= 70
    && model.eligibleRows >= 100
    && confidenceDetails.matchedSampleSize >= 20
    && unknownRatio <= 0.25
    && contributors.length >= 3
    && !severeImbalance
    && !highComplexityTarget
    && !fewActiveFeatures
    && !reliesOnOneStrongFeature
  ) {
    return 'Reliable Decision Support';
  }

  if (
    confidence >= 45
    && model.eligibleRows >= 30
    && contributors.length >= 2
    && unknownRatio <= 0.5
  ) {
    return 'Moderate Decision Support';
  }

  return 'Weak Learning Signal';
}

function explanationFromContributors(contributors: DefectPredictionContribution[]): string[] {
  return contributors.slice(0, 4).map((item) => (
    `${item.label}: ${item.value} matched ${item.matchingCount}/${item.sampleSize} training rows for ${item.effect.replace('Historically associated with ', '')}`
  ));
}

function labelRecommendationActions(label: string): string[] {
  const normalized = cleanText(label).toLowerCase();
  const actions: string[] = [];

  if (['تسريب', 'لحام', 'leak', 'weld'].some((token) => normalized.includes(token))) {
    actions.push('Check welding parameters and verify clamp condition');
    actions.push('Review leak test process and leak checker calibration');
    actions.push('Check operator handling angle around welding and pipe joints');
  }

  if (['مكون', 'خامة', 'material', 'component'].some((token) => normalized.includes(token))) {
    actions.push('Check supplier or material batch and verify the part code');
    actions.push('Inspect incoming quality records and storage/handling conditions');
  }

  if (['تجميع', 'assembly'].some((token) => normalized.includes(token))) {
    actions.push('Check station work instructions and operator training status');
    actions.push('Review jig, fixture condition, and first-off approval records');
  }

  if (['اداء', 'أداء', 'performance'].some((token) => normalized.includes(token))) {
    actions.push('Check performance test parameters, sensors, and test equipment');
    actions.push('Review refrigerant charge, airflow, and room temperature conditions');
  }

  if (['تداول', 'handling', 'transport'].some((token) => normalized.includes(token))) {
    actions.push('Check handling route, trolley condition, and packaging contact points');
    actions.push('Audit transfer method between stations and storage locations');
  }

  return actions;
}

function recommendActions(resultLabel: string, input: DefectPredictionRow, confidence: number, insufficientLearning: boolean): string[] {
  if (insufficientLearning) {
    return [
      'Add more rows for the selected target before trusting the model.',
      'Review column setup and exclude leakage/action fields before retraining.',
    ];
  }

  const line = cleanText(input.productionLine || input['القسم'] || input['المنطقة']) || 'the selected line';
  const part = cleanText(input.partId || input.partNumber || input['رقم الكود'] || input['الموديل']) || 'the selected part';
  const actions = [
    `Check recent ${resultLabel} history on ${line}`,
    `Review process settings and inspection notes for ${part}`,
    ...labelRecommendationActions(resultLabel),
  ];

  if (confidence >= 70) {
    actions.push('Start containment before the next release if the same signal appears again');
  }

  if (normalizeRecordType(input) === 'customer-return') {
    actions.push('Compare with outgoing inspection and customer return references');
  }

  return actions;
}

export function predictDefect(model: DefectPredictionModel, input: DefectPredictionRow): DefectPredictionResult {
  if (model.labels.length === 0 || model.eligibleRows === 0) {
    return {
      defectType: 'Insufficient learning',
      confidence: 0,
      dataQuality: 'empty',
      riskLevel: 'low',
      reliabilityStatus: 'Insufficient Learning',
      actionPermissionMessage: actionPermissionMessage('Insufficient Learning'),
      probabilities: [],
      explanation: [],
      recommendedActions: ['Train the model with rows that include the selected target.'],
      insufficientLearning: true,
      dataQualityWarnings: ['No trained target classes were found.'],
      confidenceDetails: {
        rawConfidence: 0,
        calibratedConfidence: 0,
        activeInputFields: 0,
        unknownFields: 0,
        ignoredInputFields: 0,
        matchedSampleSize: 0,
        reliabilityFactors: ['no trained target classes'],
      },
      topContributors: [],
      ignoredFields: [],
      unknownFields: [],
    };
  }

  const normalizedInput = normalizePredictionRows([input])[0] || {};
  const profileByFeature = new Map((model.columnProfiles || []).map((profile) => [profile.feature, profile]));
  const activeFeatures = model.activeFeatures.length ? model.activeFeatures : Object.keys(model.featureCounts);
  const scores = scoreLabels(model.labels, model.labelCounts, model.featureCounts, activeFeatures, profileByFeature, normalizedInput);
  const probabilities = softmax(scores);
  const top = probabilities[0];
  const diagnostics = top
    ? collectPredictionDiagnostics(model, normalizedInput, top.label)
    : { topContributors: [], unknownFields: [], ignoredFields: [], activeInputCount: 0, matchedSampleTotal: 0 };
  const confidenceDetails = top
    ? calibratedConfidence(
      model,
      top.probability,
      diagnostics.activeInputCount,
      diagnostics.matchedSampleTotal,
      diagnostics.unknownFields.length,
      diagnostics.ignoredFields.length,
    )
    : {
      rawConfidence: 0,
      calibratedConfidence: 0,
      activeInputFields: 0,
      unknownFields: 0,
      ignoredInputFields: 0,
      matchedSampleSize: 0,
      reliabilityFactors: ['no probability score'],
    };
  const confidence = confidenceDetails.calibratedConfidence;
  const predictedLabel = top?.label || 'Unclassified';
  const reliabilityStatus = predictionReliabilityStatus(model, confidenceDetails, diagnostics.topContributors);
  const insufficientLearning = model.dataQuality !== 'ready' || model.eligibleRows < 30 || confidence < 25 || reliabilityStatus === 'Insufficient Learning';

  return {
    defectType: insufficientLearning && confidence < 15 ? 'Insufficient learning' : predictedLabel,
    confidence,
    dataQuality: model.dataQuality,
    riskLevel: riskFromPrediction(predictedLabel, confidence),
    reliabilityStatus,
    actionPermissionMessage: actionPermissionMessage(reliabilityStatus),
    probabilities,
    explanation: explanationFromContributors(diagnostics.topContributors),
    recommendedActions: recommendActions(predictedLabel, normalizedInput, confidence, insufficientLearning),
    insufficientLearning,
    dataQualityWarnings: model.trainingWarnings || [],
    confidenceDetails,
    topContributors: diagnostics.topContributors,
    ignoredFields: diagnostics.ignoredFields,
    unknownFields: diagnostics.unknownFields,
  };
}

export function saveDefectPredictionModel(model: DefectPredictionModel): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(MODEL_STORAGE_KEY, JSON.stringify(model));
}

function emptyValidation(labelCounts: Record<string, number> = {}): DefectPredictionValidationSummary {
  const top = classShare(labelCounts);
  return {
    validationRows: 0,
    trainRows: Object.values(labelCounts).reduce((sum, count) => sum + count, 0),
    topClassLabel: top.label,
    topClassShare: top.share,
  };
}

function normalizeFeatureLabels(labels: Record<string, string> = {}): Record<string, string> {
  return Object.entries(labels).reduce((acc, [feature, label]) => {
    acc[normalizeFeatureName(feature)] = label;
    return acc;
  }, {} as Record<string, string>);
}

function normalizeFeatureCounts(
  featureCounts: DefectPredictionModel['featureCounts'] = {},
): DefectPredictionModel['featureCounts'] {
  return Object.entries(featureCounts).reduce((acc, [feature, valueCounts]) => {
    const normalizedFeature = normalizeFeatureName(feature);
    acc[normalizedFeature] = acc[normalizedFeature] || {};
    Object.entries(valueCounts || {}).forEach(([value, labelCounts]) => {
      acc[normalizedFeature][value] = acc[normalizedFeature][value] || {};
      Object.entries(labelCounts || {}).forEach(([label, count]) => {
        acc[normalizedFeature][value][label] = (acc[normalizedFeature][value][label] || 0) + count;
      });
    });
    return acc;
  }, {} as DefectPredictionModel['featureCounts']);
}

function normalizeStoredColumnProfiles(profiles: DefectPredictionColumnProfile[] = []): DefectPredictionColumnProfile[] {
  return profiles.map((profile) => {
    const normalizedFeature = normalizeFeatureName(profile.feature);
    return {
      ...profile,
      feature: normalizedFeature,
      internalKey: profile.internalKey || normalizedFeature,
    };
  });
}

export function loadDefectPredictionModel(): DefectPredictionModel | null {
  if (typeof localStorage === 'undefined') return null;

  try {
    const raw = localStorage.getItem(MODEL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DefectPredictionModel> & { version?: number } | null;
    if (!parsed || !Array.isArray(parsed.labels) || !parsed.featureCounts || !parsed.labelCounts) return null;
    const featureCounts = normalizeFeatureCounts(parsed.featureCounts || {});
    const activeFeatures = [...new Set((parsed.activeFeatures || Object.keys(featureCounts)).map(normalizeFeatureName))];
    const featureLabels = normalizeFeatureLabels(parsed.featureLabels || {});

    return {
      version: 3,
      trainedAt: parsed.trainedAt || new Date().toISOString(),
      targetField: normalizeFeatureName(parsed.targetField || 'defectType'),
      targetLabel: parsed.targetLabel || 'Defect Type',
      totalRows: parsed.totalRows || 0,
      eligibleRows: parsed.eligibleRows || 0,
      excludedRows: parsed.excludedRows || Math.max(0, (parsed.totalRows || 0) - (parsed.eligibleRows || 0)),
      labels: parsed.labels || [],
      activeFeatures,
      featureLabels,
      columnProfiles: normalizeStoredColumnProfiles(parsed.columnProfiles || []),
      labelCounts: parsed.labelCounts || {},
      featureCounts,
      featureImportance: (parsed.featureImportance || []).map((item) => ({ ...item, feature: normalizeFeatureName(item.feature) })),
      dataQuality: parsed.dataQuality || determineDataQuality(parsed.eligibleRows || 0, parsed.labels?.length || 0),
      trainingWarnings: parsed.trainingWarnings || [],
      validation: parsed.validation || emptyValidation(parsed.labelCounts || {}),
    };
  } catch {
    return null;
  }
}

export function clearDefectPredictionModel(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(MODEL_STORAGE_KEY);
}

export function saveDefectPredictionColumnOverrides(overrides: DefectPredictionColumnOverrides): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(COLUMN_OVERRIDES_STORAGE_KEY, JSON.stringify(normalizeColumnOverrides(overrides)));
}

export function loadDefectPredictionColumnOverrides(): DefectPredictionColumnOverrides {
  if (typeof localStorage === 'undefined') return {};

  try {
    const raw = localStorage.getItem(COLUMN_OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as DefectPredictionColumnOverrides;
    return parsed && typeof parsed === 'object' ? normalizeColumnOverrides(parsed) : {};
  } catch {
    return {};
  }
}

export function clearDefectPredictionColumnOverrides(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(COLUMN_OVERRIDES_STORAGE_KEY);
}
