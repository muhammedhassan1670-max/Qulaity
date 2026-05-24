import type { ExtendedDefectLog } from '@/services/defectAnalytics';
import { getDefectRecordType } from '@/services/defectAnalytics';
import {
  loadQualityMasterTable,
  type QualityMasterRecord,
} from '@/services/qualityMasterData';

export type RuleOperator = 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'inList' | 'isEmpty' | 'isNotEmpty';
export type RuleActionType = 'showWarning' | 'requireField' | 'suggestNcr' | 'setCalculatedValue' | 'increaseRisk' | 'routeDashboard' | 'requireApproval';

export interface QualityRule {
  id: string;
  ruleName: string;
  field: string;
  operator: RuleOperator;
  value?: unknown;
  action: RuleActionType;
  message?: string;
  setField?: string;
  setValue?: unknown;
  isActive?: boolean;
}

export interface RepeatedDefectResult {
  repeated: boolean;
  count: number;
  similarRecordIds: string[];
  message: string;
}

export interface AdvancedRulesResult {
  warnings: string[];
  requiredFields: string[];
  ncrSuggested: boolean;
  ncrReasons: string[];
  calculatedValues: Record<string, unknown>;
  riskScore: number;
  affectedDashboards: string[];
  approvalRequired: boolean;
  approvalReasons: string[];
  repeatedDefect: RepeatedDefectResult;
  suggestedNextAction: string;
}

function normalize(value: unknown): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = Number(normalize(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function evaluateCondition(actual: unknown, operator: RuleOperator, expected: unknown): boolean {
  const actualText = normalize(actual).toLowerCase();
  const expectedText = normalize(expected).toLowerCase();
  switch (operator) {
    case 'equals':
      return actualText === expectedText;
    case 'notEquals':
      return actualText !== expectedText;
    case 'greaterThan':
      return toNumber(actual) > toNumber(expected);
    case 'lessThan':
      return toNumber(actual) < toNumber(expected);
    case 'contains':
      return actualText.includes(expectedText);
    case 'inList':
      return expectedText.split(',').map((item) => item.trim()).includes(actualText);
    case 'isEmpty':
      return actualText === '';
    case 'isNotEmpty':
      return actualText !== '';
    default:
      return false;
  }
}

function normalizeConfiguredRules(records: QualityMasterRecord[]): QualityRule[] {
  return records
    .filter((record) => record.isActive !== false)
    .map((record, index) => ({
      id: normalize(record.id) || `rule-${index + 1}`,
      ruleName: normalize(record.ruleName) || `Rule ${index + 1}`,
      field: normalize(record.field),
      operator: (normalize(record.operator) || 'equals') as RuleOperator,
      value: record.value,
      action: (normalize(record.action) || 'showWarning') as RuleActionType,
      message: normalize(record.message),
      setField: normalize(record.setField),
      setValue: record.setValue,
      isActive: record.isActive !== false,
    }))
    .filter((rule) => rule.field && rule.action);
}

function builtInRules(): QualityRule[] {
  return [
    {
      id: 'builtin-critical-ncr',
      ruleName: 'Critical severity suggests NCR',
      field: 'severity',
      operator: 'equals',
      value: 'critical',
      action: 'suggestNcr',
      message: 'Critical severity is a quality signal that should be reviewed for NCR escalation.',
    },
    {
      id: 'builtin-high-cost-approval',
      ruleName: 'High estimated cost requires review',
      field: 'estimatedCost',
      operator: 'greaterThan',
      value: 5000,
      action: 'requireApproval',
      message: 'High estimated cost requires supervisor review before closure.',
    },
    {
      id: 'builtin-outgoing-fail',
      ruleName: 'Outgoing failure warning',
      field: 'outgoingResult',
      operator: 'equals',
      value: 'fail',
      action: 'requireApproval',
      message: 'Outgoing failure is a release risk and requires verification before final disposition.',
    },
    {
      id: 'builtin-customer-return',
      ruleName: 'Customer return escalation',
      field: 'recordType',
      operator: 'equals',
      value: 'customer-return',
      action: 'requireApproval',
      message: 'Customer return records require supervisor review and external failure verification.',
    },
  ];
}

export function loadQualityRules(): QualityRule[] {
  return [...builtInRules(), ...normalizeConfiguredRules(loadQualityMasterTable('escalation-rules'))];
}

export function detectRepeatedDefect(values: Record<string, unknown>, records: ExtendedDefectLog[] = []): RepeatedDefectResult {
  const defectType = normalize(values.defectType).toLowerCase();
  if (!defectType) {
    return { repeated: false, count: 0, similarRecordIds: [], message: 'No defect type entered yet.' };
  }

  const currentDate = new Date(normalize(values.date) || new Date().toISOString());
  const keys = ['partNumber', 'partId', 'model', 'productionLine', 'shift', 'supplierName', 'recordType'];
  const similar = records.filter((record) => {
    const recordDate = new Date(record.date || record.createdAt || '');
    const days = Number.isNaN(recordDate.getTime()) ? 0 : Math.abs(currentDate.getTime() - recordDate.getTime()) / 86_400_000;
    if (days > 30) return false;
    if (normalize(record.defectType).toLowerCase() !== defectType) return false;
    const matches = keys.reduce((count, key) => {
      const left = normalize((values as Record<string, unknown>)[key]).toLowerCase();
      const right = normalize((record as unknown as Record<string, unknown>)[key]).toLowerCase();
      if (!left || !right) return count;
      return left === right ? count + 1 : count;
    }, 0);
    return matches >= 2;
  });

  return {
    repeated: similar.length >= 2,
    count: similar.length,
    similarRecordIds: similar.map((record) => record.id).filter(Boolean),
    message: similar.length >= 2
      ? 'This defect has been historically repeated in similar records and should be prioritized for verification.'
      : 'No strong recent repetition signal from similar records.',
  };
}

export function evaluateAdvancedDefectRules(
  values: Record<string, unknown>,
  records: ExtendedDefectLog[] = [],
): AdvancedRulesResult {
  const warnings: string[] = [];
  const requiredFields: string[] = [];
  const calculatedValues: Record<string, unknown> = {};
  const affectedDashboards = new Set<string>(['Main Dashboard', 'Defect Prediction']);
  const ncrReasons: string[] = [];
  const approvalReasons: string[] = [];
  let ncrSuggested = false;
  let approvalRequired = false;
  let riskScore = 0;

  const route = getDefectRecordType(values as unknown as ExtendedDefectLog);
  if (route === 'process-ppm') affectedDashboards.add('Process PPM');
  if (route === 'defect-cost') affectedDashboards.add('Defect Cost / COPQ');
  if (route === 'outgoing-quality') affectedDashboards.add('Outgoing Quality');
  if (route === 'customer-return') affectedDashboards.add('Customer Returns');

  const repeatedDefect = detectRepeatedDefect(values, records);
  if (repeatedDefect.repeated) {
    warnings.push(repeatedDefect.message);
    approvalRequired = true;
    approvalReasons.push('Repeated defect signal requires review.');
    riskScore += 20;
  }

  loadQualityRules().forEach((rule) => {
    if (!rule.isActive) return;
    if (!evaluateCondition(values[rule.field], rule.operator, rule.value)) return;

    const message = rule.message || rule.ruleName;
    switch (rule.action) {
      case 'showWarning':
        warnings.push(message);
        break;
      case 'requireField':
        if (rule.setField) requiredFields.push(rule.setField);
        warnings.push(message);
        break;
      case 'suggestNcr':
        ncrSuggested = true;
        ncrReasons.push(message);
        riskScore += 25;
        break;
      case 'setCalculatedValue':
        if (rule.setField) calculatedValues[rule.setField] = rule.setValue;
        break;
      case 'increaseRisk':
        riskScore += toNumber(rule.setValue || 10);
        warnings.push(message);
        break;
      case 'routeDashboard':
        if (rule.setValue) affectedDashboards.add(normalize(rule.setValue));
        break;
      case 'requireApproval':
        approvalRequired = true;
        approvalReasons.push(message);
        riskScore += 15;
        break;
      default:
        break;
    }
  });

  const quantity = toNumber(values.quantity);
  const estimatedCost = toNumber(values.estimatedCost);
  if (quantity >= 10) {
    ncrSuggested = true;
    ncrReasons.push('Defect quantity exceeds the configured practical escalation threshold.');
  }
  if (estimatedCost >= 5000) {
    approvalRequired = true;
    approvalReasons.push('Estimated cost is high and should be reviewed before closure.');
  }

  const suggestedNextAction = approvalRequired
    ? 'Prioritize supervisor review and verify the strongest quality signals before final disposition.'
    : ncrSuggested
      ? 'Review NCR escalation and confirm the defect evidence before escalation.'
      : warnings.length
        ? 'Verify the warnings and complete missing context before closure.'
        : 'Continue standard quality verification and save the record when complete.';

  return {
    warnings: [...new Set(warnings)],
    requiredFields: [...new Set(requiredFields)],
    ncrSuggested,
    ncrReasons: [...new Set(ncrReasons)],
    calculatedValues,
    riskScore,
    affectedDashboards: Array.from(affectedDashboards),
    approvalRequired,
    approvalReasons: [...new Set(approvalReasons)],
    repeatedDefect,
    suggestedNextAction,
  };
}
