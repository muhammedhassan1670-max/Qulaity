import type { DefectLogData } from '@/api/unified-api';
import { getDefectRecordType, type DefectRecordType, type ExtendedDefectLog } from '@/services/defectAnalytics';
import { buildMasterDataSnapshot } from '@/services/qualityMasterData';
import { evaluateAdvancedDefectRules } from '@/services/qualityRulesEngine';

export type DefectFormTemplateId =
  | 'general'
  | 'process-ppm'
  | 'defect-cost'
  | 'outgoing-quality'
  | 'customer-return'
  | 'welding-leakage'
  | 'incoming-material'
  | 'final-inspection';

export type RecordQualityStatus = 'Ready' | 'Partial' | 'Weak';

export interface DefectFormTemplate {
  id: DefectFormTemplateId;
  name: string;
  description: string;
  defaultValues: Partial<DefectLogData> & Record<string, unknown>;
  focus: string[];
  dashboardImpact: string[];
}

export interface DefectRecordIntelligence {
  route: DefectRecordType;
  routeLabel: string;
  affectedModules: string[];
  missingRequiredFields: string[];
  warnings: string[];
  recordQualityScore: number;
  recordQuality: RecordQualityStatus;
  ppmPreview: number | null;
  copqPreview: number;
  costImpactLevel: 'Low' | 'Medium' | 'High';
  outgoingImpact: string;
  releaseStatus: string;
  externalFailureImpact: string;
  predictionReady: boolean;
  ncrSuggested: boolean;
  ncrReason: string;
  repeatedDefectCount: number;
  managementNote: string;
  masterDataMatchStatus: string;
  snapshotStatus: string;
  repeatedDefectWarning: string;
  ruleWarnings: string[];
  approvalRequired: boolean;
  approvalReasons: string[];
  auditStatus: string;
  suggestedNextAction: string;
}

export type MasterDataTable = 'parts' | 'models' | 'defects' | 'lines' | 'suppliers' | 'customers' | 'cost-rules' | 'escalation-rules' | 'inspection-points';

const MASTER_DATA_PREFIX = 'qms_master_data_';
const MASTER_DATA_SUFFIX = '_v1';

const routeLabels: Record<DefectRecordType, string> = {
  'process-ppm': 'Process PPM',
  'defect-cost': 'Defect Cost / COPQ',
  'outgoing-quality': 'Outgoing Quality',
  'customer-return': 'Customer Return',
};

const commonRequired = ['date', 'shift', 'productionLine', 'recordType', 'defectType', 'quantity'];

const conditionalRequired: Record<DefectRecordType, string[]> = {
  'process-ppm': ['inspectedQuantity'],
  'defect-cost': ['estimatedCost', 'costCategory'],
  'outgoing-quality': ['outgoingResult', 'shipmentId', 'releaseTimeHrs'],
  'customer-return': ['returnReference', 'customerName', 'estimatedCost'],
};

const templates: DefectFormTemplate[] = [
  {
    id: 'general',
    name: 'General Defect Log',
    description: 'Flexible shopfloor record with routing selected by the quality engineer.',
    defaultValues: { recordType: 'process-ppm', severity: 'minor', quantity: 1, status: 'logged' },
    focus: ['Common production fields', 'Defect details', 'Dashboard routing'],
    dashboardImpact: ['Main Dashboard', 'Defect Prediction'],
  },
  {
    id: 'process-ppm',
    name: 'Process PPM Defect',
    description: 'Use for in-process defects that should update PPM, line performance, SPC, and prediction training.',
    defaultValues: { recordType: 'process-ppm', severity: 'minor', quantity: 1, status: 'logged' },
    focus: ['Quantity', 'Inspected quantity', 'Line', 'Defect type'],
    dashboardImpact: ['Process PPM', 'Main Dashboard', 'SPC', 'Defect Prediction'],
  },
  {
    id: 'defect-cost',
    name: 'COPQ Defect',
    description: 'Use when the record carries internal, external, appraisal, or prevention cost impact.',
    defaultValues: { recordType: 'defect-cost', costCategory: 'internal-failure', severity: 'major', quantity: 1, status: 'logged' },
    focus: ['Estimated cost', 'Cost category', 'Defect type'],
    dashboardImpact: ['Defect Cost / COPQ', 'Main Dashboard', 'Defect Prediction'],
  },
  {
    id: 'outgoing-quality',
    name: 'Outgoing Quality Record',
    description: 'Use for final release, shipment hold, pass/fail, and outgoing escape signals.',
    defaultValues: { recordType: 'outgoing-quality', outgoingResult: 'hold', severity: 'major', quantity: 1, status: 'logged' },
    focus: ['Outgoing result', 'Shipment ID', 'Release time'],
    dashboardImpact: ['Outgoing Quality', 'Main Dashboard', 'Defect Prediction'],
  },
  {
    id: 'customer-return',
    name: 'Customer Return Record',
    description: 'Use for returned units or external failures that should affect returns and external COPQ.',
    defaultValues: { recordType: 'customer-return', costCategory: 'external-failure', severity: 'critical', quantity: 1, status: 'logged' },
    focus: ['Return reference', 'Customer', 'Cost', 'Quantity'],
    dashboardImpact: ['Returns', 'Defect Cost / COPQ', 'Main Dashboard', 'Defect Prediction'],
  },
  {
    id: 'welding-leakage',
    name: 'Welding / Leakage Defect',
    description: 'Focused template for leakage and welding station defects.',
    defaultValues: { recordType: 'process-ppm', defectType: 'Leak / Welding', severity: 'major', quantity: 1, status: 'logged' },
    focus: ['Process line', 'Part number', 'Leak/welding defect', 'Immediate action'],
    dashboardImpact: ['Process PPM', 'SPC', 'Defect Prediction'],
  },
  {
    id: 'incoming-material',
    name: 'Incoming Material Defect',
    description: 'Focused template for supplier/material related quality signals.',
    defaultValues: { recordType: 'defect-cost', defectType: 'Material / Component', costCategory: 'internal-failure', severity: 'major', quantity: 1, status: 'logged' },
    focus: ['Part', 'Supplier', 'Cost', 'Defect type'],
    dashboardImpact: ['Defect Cost / COPQ', 'Supplier Quality', 'Defect Prediction'],
  },
  {
    id: 'final-inspection',
    name: 'Final Inspection Defect',
    description: 'Focused template for inspection before release or shipment.',
    defaultValues: { recordType: 'outgoing-quality', outgoingResult: 'hold', severity: 'major', quantity: 1, status: 'logged' },
    focus: ['Inspection result', 'Shipment / batch', 'Release time', 'Defect type'],
    dashboardImpact: ['Outgoing Quality', 'Main Dashboard', 'Defect Prediction'],
  },
];

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  return true;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function costLevel(cost: number): 'Low' | 'Medium' | 'High' {
  if (cost >= 5000) return 'High';
  if (cost >= 1000) return 'Medium';
  return 'Low';
}

function dayDiff(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / 86_400_000;
}

function countRepeatedDefects(values: Record<string, unknown>, records: ExtendedDefectLog[]): number {
  const defectType = String(values.defectType || '').trim().toLowerCase();
  if (!defectType) return 0;
  const part = String(values.partId || values.partNumber || '').trim().toLowerCase();
  const line = String(values.productionLine || '').trim().toLowerCase();
  const currentDate = new Date(String(values.date || new Date().toISOString()));

  return records.filter((record) => {
    const recordDate = new Date(record.date || record.createdAt || '');
    const sameDefect = String(record.defectType || '').trim().toLowerCase() === defectType;
    const samePart = !part || String(record.partId || record.partNumber || '').trim().toLowerCase() === part;
    const sameLine = !line || String(record.productionLine || '').trim().toLowerCase() === line;
    const recent = Number.isNaN(recordDate.getTime()) || dayDiff(currentDate, recordDate) <= 30;
    return sameDefect && samePart && sameLine && recent;
  }).length;
}

export function getDefectFormTemplates(): DefectFormTemplate[] {
  return templates;
}

export function getDefectFormTemplate(id: string): DefectFormTemplate {
  return templates.find((template) => template.id === id) || templates[0];
}

export function buildDefectTemplateValues(templateId: string, base: Record<string, unknown> = {}): Record<string, unknown> {
  const template = getDefectFormTemplate(templateId);
  return {
    date: new Date().toISOString().split('T')[0],
    ...template.defaultValues,
    ...base,
  };
}

function firstRowValue(row: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined && String(value).trim() !== '') return value;
  }
  return undefined;
}

export function evaluateDefectRecordIntelligence(
  values: Record<string, unknown>,
  records: ExtendedDefectLog[] = [],
): DefectRecordIntelligence {
  const route = getDefectRecordType(values as unknown as ExtendedDefectLog);
  const required = [...commonRequired, ...conditionalRequired[route]];
  const missing = required.filter((field) => !isFilled(values[field]));
  const hasPart = isFilled(values.partId) || isFilled(values.partNumber);
  if (!hasPart) missing.push('partId or partNumber');

  const completed = Math.max(0, required.length + 1 - missing.length);
  const recordQualityScore = Math.round((completed / Math.max(1, required.length + 1)) * 100);
  const recordQuality: RecordQualityStatus = recordQualityScore >= 85 ? 'Ready' : recordQualityScore >= 55 ? 'Partial' : 'Weak';

  const quantity = toNumber(values.quantity);
  const inspected = toNumber(values.inspectedQuantity || values.productionQuantity);
  const unitCost = toNumber(values.unitCost);
  const enteredCost = toNumber(values.estimatedCost);
  const copqPreview = enteredCost > 0 ? enteredCost : quantity * unitCost;
  const ppmPreview = route === 'process-ppm' && inspected > 0 ? Math.round((quantity / inspected) * 1_000_000) : null;
  const releaseTime = toNumber(values.releaseTimeHrs);
  const targetRelease = toNumber(values.targetReleaseTimeHrs) || 24;
  const outgoingResult = String(values.outgoingResult || '').toLowerCase();
  const severity = String(values.severity || '').toLowerCase();
  const repeatedDefectCount = countRepeatedDefects(values, records);
  const masterSnapshot = buildMasterDataSnapshot(values);
  const rules = evaluateAdvancedDefectRules(values, records);

  const affectedModules = ['Main Dashboard', 'Defect Prediction'];
  if (route === 'process-ppm') affectedModules.push('Process PPM', 'SPC');
  if (route === 'defect-cost') affectedModules.push('Defect Cost / COPQ');
  if (route === 'outgoing-quality') affectedModules.push('Outgoing Quality');
  if (route === 'customer-return') affectedModules.push('Returns', 'Defect Cost / COPQ');

  const warnings: string[] = [];
  if (missing.length) warnings.push('Some required routing fields are incomplete.');
  warnings.push(...rules.warnings);
  if (route === 'process-ppm' && inspected <= 0) warnings.push('Inspected quantity is needed for a reliable PPM preview.');
  if ((route === 'defect-cost' || route === 'customer-return') && copqPreview <= 0) warnings.push('Cost impact is not yet available.');
  if (route === 'outgoing-quality' && !outgoingResult) warnings.push('Outgoing result is needed to classify release impact.');

  const ncrSuggested = rules.ncrSuggested || (
    severity === 'critical' ||
    severity === 'high' ||
    quantity >= 10 ||
    repeatedDefectCount >= 3 ||
    route === 'customer-return' ||
    outgoingResult === 'fail'
  );

  const ncrReason = ncrSuggested
    ? [...rules.ncrReasons, 'NCR escalation is suggested based on severity, quantity, recurrence, customer return, or outgoing escape signals.'].filter(Boolean).join(' ')
    : 'NCR escalation is not suggested yet from the current fields. Continue standard quality verification.';

  return {
    route,
    routeLabel: routeLabels[route],
    affectedModules: [...new Set([...affectedModules, ...rules.affectedDashboards])],
    missingRequiredFields: [...new Set(missing)],
    warnings: [...new Set(warnings)],
    recordQualityScore,
    recordQuality,
    ppmPreview,
    copqPreview,
    costImpactLevel: costLevel(copqPreview),
    outgoingImpact: route === 'outgoing-quality'
      ? outgoingResult === 'fail' ? 'Potential outgoing escape'
        : outgoingResult === 'hold' ? 'Release hold signal'
          : outgoingResult === 'pass' ? 'Release pass signal'
            : 'Outgoing result pending'
      : 'Not routed to outgoing quality',
    releaseStatus: route === 'outgoing-quality'
      ? releaseTime > targetRelease ? 'Release delay risk' : releaseTime > 0 ? 'Within target release time' : 'Release time pending'
      : 'Not applicable',
    externalFailureImpact: route === 'customer-return' ? `${costLevel(copqPreview)} external failure signal` : 'No customer return routing',
    predictionReady: recordQualityScore >= 70 && isFilled(values.defectType),
    ncrSuggested,
    ncrReason,
    repeatedDefectCount: Math.max(repeatedDefectCount, rules.repeatedDefect.count),
    managementNote: `This record will update ${[...new Set([...affectedModules, ...rules.affectedDashboards])].join(', ')}. This is a quality signal and requires verification before final decisions.`,
    masterDataMatchStatus: masterSnapshot.masterDataMatchStatus,
    snapshotStatus: masterSnapshot.masterDataMatched ? 'Master data snapshot will be saved with the record.' : 'No master data snapshot match yet.',
    repeatedDefectWarning: rules.repeatedDefect.message,
    ruleWarnings: rules.warnings,
    approvalRequired: rules.approvalRequired,
    approvalReasons: rules.approvalReasons,
    auditStatus: 'Create, update, delete, and NCR actions are tracked in local audit history.',
    suggestedNextAction: rules.suggestedNextAction,
  };
}

export function normalizePartMasterRows(rows: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return rows.map((row, index) => {
    const aliasPartId = firstRowValue(row, ['part code', 'Part Code', 'partCode', 'partcode', 'رقم الكود']);
    const aliasPartNumber = firstRowValue(row, ['part number', 'Part Number', 'partName', 'Part Name', 'الجزء', 'الموديل']);
    const aliasSupplierName = firstRowValue(row, ['supplierName', 'Supplier', 'supplier', 'المورد']);
    const aliasUnitCost = firstRowValue(row, ['unitCost', 'UnitCost', 'cost', 'Cost', 'تكلفة', 'السعر']);
    const aliasProductFamily = firstRowValue(row, ['productFamily', 'family', 'model type', 'Model Type', 'الموديل']);
    const aliasProductionLine = firstRowValue(row, ['productionLine', 'line', 'Line', 'خط الانتاج', 'القسم', 'العملية']);
    if (aliasSupplierName !== undefined) row.supplierName = aliasSupplierName;
    if (aliasUnitCost !== undefined) row.unitCost = aliasUnitCost;
    if (aliasProductFamily !== undefined) row.productFamily = aliasProductFamily;
    if (aliasProductionLine !== undefined) row.productionLine = aliasProductionLine;
    const partId = row.partId ?? row.PartID ?? row['Part ID'] ?? row.id ?? row.code ?? row['رقم الكود'] ?? '';
    const partNumber = row.partNumber ?? row.partName ?? row['Part Name'] ?? row.name ?? row.description ?? row['الجزء'] ?? partId;
    return {
      ...row,
      id: String(aliasPartId || partId || `part-${index + 1}`),
      partId: String(aliasPartId || partId || '').trim(),
      partNumber: String(aliasPartNumber || partNumber || '').trim(),
      partName: String(aliasPartNumber || partNumber || '').trim(),
      supplierName: String(row.supplierName ?? row.Supplier ?? row.supplier ?? row['المورد'] ?? '').trim(),
      unitCost: toNumber(row.unitCost ?? row.UnitCost ?? row.cost ?? row.Cost ?? row['تكلفة'] ?? 0),
      productFamily: String(row.productFamily ?? row.family ?? row['model type'] ?? row['الموديل'] ?? '').trim(),
      productionLine: String(row.productionLine ?? row.line ?? row.Line ?? row['خط الانتاج'] ?? '').trim(),
    };
  });
}

export function loadDefectMasterData(table: MasterDataTable): Array<Record<string, unknown>> {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${MASTER_DATA_PREFIX}${table}${MASTER_DATA_SUFFIX}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDefectMasterData(table: MasterDataTable, rows: Array<Record<string, unknown>>): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(`${MASTER_DATA_PREFIX}${table}${MASTER_DATA_SUFFIX}`, JSON.stringify(rows));
}
