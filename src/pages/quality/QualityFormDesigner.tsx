import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  Calculator,
  CheckCircle2,
  Copy,
  Database,
  Download,
  Eye,
  FileJson,
  GitBranch,
  LayoutTemplate,
  Link2,
  Lock,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  Smartphone,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer, PageHeader } from '@/components/PageHeader';
import { QualityGuidedEmptyState } from '@/components/QualityGuidedEmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DynamicFormRenderer from '@/components/DynamicFormRenderer';
import { useConfigStore } from '@/stores/configStore';
import {
  QUALITY_FORM_TEMPLATES_KEY,
  archiveQualityFormTemplate,
  canManageQualityFormTemplates,
  createBlankQualityFormTemplate,
  currentFormDesignerUser,
  duplicateQualityFormTemplate,
  dynamicFormToQualityTemplate,
  exportQualityFormTemplate,
  importQualityFormTemplate,
  loadQualityFormTemplates,
  publishQualityFormTemplate,
  qualityTemplateToDynamicForm,
  rollbackQualityFormTemplate,
  upsertQualityFormTemplate,
  validateQualityFormTemplate,
  type QualityConditionalRule,
  type QualityDesignerFieldType,
  type QualityFormField,
  type QualityFormMode,
  type QualityFormSection,
  type QualityFormTemplate,
  type QualityLookupOverwriteBehavior,
  type QualityLookupMapping,
  type QualityRuleActionType,
  type QualityRuleOperator,
} from '@/services/qualityFormTemplates';
import {
  QUALITY_WORKFLOW_ROLES,
  roleLabel,
  type QualityWorkflowRole,
} from '@/services/defectWorkflowGovernance';
import { loadQualityMasterTable, qualityMasterTableConfigs, type QualityMasterTableId } from '@/services/qualityMasterData';
import type { QualityMasterRecord } from '@/services/qualityMasterData';
import { enqueueQualitySyncItem } from '@/services/qualitySyncQueue';
import { FormulaEvaluator } from '@/utils/formulaEvaluator';

const fieldTypes: QualityDesignerFieldType[] = [
  'text',
  'number',
  'date',
  'time',
  'select',
  'multi-select',
  'lookup',
  'barcode',
  'textarea',
  'boolean',
  'attachment',
  'image',
  'calculated',
  'formula',
  'user',
  'status',
  'linked-record',
];

const operators: QualityRuleOperator[] = ['equals', 'not equals', 'greater than', 'less than', 'contains', 'in list', 'is empty', 'is not empty'];
const actions: QualityRuleActionType[] = ['show field', 'hide field', 'require field', 'make read-only', 'set default value', 'show warning', 'suggest NCR', 'route dashboard', 'calculate value'];
const modes: Array<Exclude<QualityFormMode, 'mobile'>> = ['create', 'edit', 'detail'];

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function downloadJson(payload: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function emptySection(order = 1): QualityFormSection {
  return {
    id: newId('section'),
    title: `Section ${order}`,
    order,
    collapsible: true,
    collapsedByDefault: false,
  };
}

function emptyField(sectionId: string, order = 1): QualityFormField {
  return {
    id: newId('field'),
    fieldKey: `customField${order}`,
    label: `Custom Field ${order}`,
    type: 'text',
    sectionId,
    order,
    required: false,
    readOnly: false,
    hidden: false,
    helperText: '',
    roleVisibility: {
      visibleTo: [],
      editableBy: [],
    },
    modeVisibility: {
      create: true,
      edit: true,
      detail: true,
    },
  };
}

function emptyRule(fields: QualityFormField[]): QualityConditionalRule {
  const fieldKey = fields[0]?.fieldKey || '';
  return {
    id: newId('rule'),
    sourceField: fieldKey,
    operator: 'equals',
    value: '',
    action: 'show field',
    targetField: fieldKey,
    warningMessage: '',
  };
}

function parseOptions(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawValue, rawLabel] = line.split('|').map((item) => item.trim());
      return { value: rawValue, label: rawLabel || rawValue };
    });
}

function optionsText(field: QualityFormField): string {
  return (field.options || []).map((option) => `${option.value}|${option.label}`).join('\n');
}

function mappingText(field: QualityFormField): string {
  return (field.lookup?.autoFillMappings || []).map((mapping) => `${mapping.sourceColumn}>${mapping.targetField}${mapping.readOnly ? ':readonly' : ''}`).join('\n');
}

function parseMappings(value: string): QualityLookupMapping[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [pair, flag] = line.split(':').map((item) => item.trim());
      const [sourceColumn, targetField] = pair.split('>').map((item) => item.trim());
      return { sourceColumn, targetField, readOnly: flag === 'readonly' };
    })
    .filter((mapping) => mapping.sourceColumn && mapping.targetField);
}

function defaultLookupConfig(sourceTable: QualityMasterTableId) {
  const table = qualityMasterTableConfigs.find((config) => config.id === sourceTable) || qualityMasterTableConfigs[0];
  return {
    sourceTable,
    keyColumn: table.primaryKey,
    displayColumn: table.primaryKey,
    searchColumns: [table.primaryKey],
    autoFillMappings: [],
    fillEmptyFieldsOnly: true,
    preventOverwriteWithoutConfirmation: true,
    overwriteBehavior: 'fill-empty-only' as QualityLookupOverwriteBehavior,
  };
}

function fieldLabel(fields: QualityFormField[], fieldKey?: string): string {
  return fields.find((field) => field.fieldKey === fieldKey)?.label || fieldKey || 'field';
}

function ruleSummary(rule: QualityConditionalRule, fields: QualityFormField[]): string {
  const source = fieldLabel(fields, rule.sourceField);
  const target = fieldLabel(fields, rule.targetField);
  const value = ['is empty', 'is not empty'].includes(rule.operator) ? '' : ` "${String(rule.value ?? '')}"`;
  const thenTarget = rule.targetField ? ` ${target}` : '';
  const suffix = rule.action === 'show warning' && rule.warningMessage ? `: ${rule.warningMessage}` : '';
  return `IF ${source} ${rule.operator}${value} THEN ${rule.action}${thenTarget}${suffix}`;
}

function sampleValueToFormulaContext(value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : trimmed;
}

function statusBadge(status: QualityFormTemplate['status']) {
  if (status === 'active') return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20';
  if (status === 'archived') return 'bg-slate-500/15 text-slate-300 border-slate-400/20';
  return 'bg-amber-500/15 text-amber-300 border-amber-400/20';
}

const formulaPresets = [
  { name: 'PPM', expression: '@quantity / @inspectedQuantity * 1000000', fields: ['quantity', 'inspectedQuantity'] },
  { name: 'Estimated Cost', expression: '@quantity * @unitCost', fields: ['quantity', 'unitCost'] },
  { name: 'Defect Rate %', expression: '@quantity / @inspectedQuantity * 100', fields: ['quantity', 'inspectedQuantity'] },
  { name: 'Release Delay', expression: '@releaseTimeHrs - @targetReleaseTimeHrs', fields: ['releaseTimeHrs', 'targetReleaseTimeHrs'] },
  { name: 'Record Quality Score', expression: '@completedRequiredFields / @totalRequiredFields * 100', fields: ['completedRequiredFields', 'totalRequiredFields'] },
];

const dashboardReadinessProfiles = [
  {
    name: 'Process PPM',
    required: ['date', 'recordType', 'defectType', 'quantity', 'inspectedQuantity', 'productionLine'],
    optional: ['model', 'partNumber', 'shift', 'inspectionPoint'],
    impact: 'PPM confidence may be weak when inspected quantity or line context is missing.',
  },
  {
    name: 'COPQ',
    required: ['recordType', 'defectType', 'estimatedCost', 'costCategory'],
    optional: ['quantity', 'unitCost', 'supplierName', 'model', 'partNumber'],
    impact: 'Cost dashboards may understate COPQ when estimated cost or category is missing.',
  },
  {
    name: 'Outgoing Quality',
    required: ['recordType', 'outgoingResult', 'shipmentId', 'releaseTimeHrs'],
    optional: ['customerName', 'model', 'partNumber', 'defectType'],
    impact: 'Outgoing dashboards may miss holds, failures, or release delay without outgoing result fields.',
  },
  {
    name: 'Customer Return',
    required: ['recordType', 'returnReference', 'customerName', 'defectType'],
    optional: ['estimatedCost', 'quantity', 'model', 'partNumber'],
    impact: 'External failure reporting is weaker without customer and return reference fields.',
  },
  {
    name: 'SPC / Numeric Checks',
    required: ['date', 'defectType'],
    optional: ['measuredValue', 'lowerSpecLimit', 'upperSpecLimit', 'targetValue', 'inspectionPoint'],
    impact: 'SPC numeric analysis needs measurable values and specification limits.',
  },
  {
    name: 'Defect Prediction',
    required: ['defectType', 'productionLine', 'partNumber', 'model'],
    optional: ['shift', 'severity', 'inspectionPoint', 'supplierName', 'recordType'],
    impact: 'Prediction learning is stronger when stable categorical signals are captured consistently.',
  },
];

const essentialShopfloorKeys = new Set([
  'date',
  'shift',
  'productionLine',
  'partNumber',
  'partId',
  'barcode',
  'defectType',
  'quantity',
  'severity',
  'evidence',
  'attachment',
  'image',
  'photo',
  'notes',
  'description',
]);

function normalizeKey(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function templateFieldKeys(template: QualityFormTemplate): Set<string> {
  return new Set(template.fields.map((field) => field.fieldKey));
}

function readinessForTemplate(template: QualityFormTemplate) {
  const keys = templateFieldKeys(template);
  return dashboardReadinessProfiles.map((profile) => {
    const requiredPresent = profile.required.filter((key) => keys.has(key));
    const optionalPresent = profile.optional.filter((key) => keys.has(key));
    const denominator = profile.required.length * 2 + profile.optional.length;
    const score = Math.round(((requiredPresent.length * 2 + optionalPresent.length) / Math.max(1, denominator)) * 100);
    return {
      ...profile,
      score,
      requiredPresent,
      optionalPresent,
      missingRequired: profile.required.filter((key) => !keys.has(key)),
      missingOptional: profile.optional.filter((key) => !keys.has(key)),
    };
  });
}

function complexityForTemplate(template: QualityFormTemplate) {
  const required = template.fields.filter((field) => field.required).length;
  const lookup = template.fields.filter((field) => field.type === 'lookup').length;
  const formula = template.fields.filter((field) => field.type === 'formula' || field.type === 'calculated').length;
  const score = template.fields.length + required * 2 + lookup * 2 + formula * 2 + template.rules.length * 2 + template.sections.length;
  const level = score >= 45 ? 'High' : score >= 22 ? 'Medium' : 'Low';
  const recommendations: string[] = [];
  if (template.fields.length > 18) recommendations.push('Split the form into clear sections or create a compact shopfloor version.');
  if (required > 8) recommendations.push('Reduce required fields for shopfloor users where possible.');
  if (lookup === 0 && template.fields.length > 8) recommendations.push('Use lookup fields to reduce manual typing.');
  if (formula === 0 && template.fields.some((field) => ['quantity', 'unitCost', 'inspectedQuantity'].includes(field.fieldKey))) recommendations.push('Add formula fields for PPM, COPQ, or quality score previews.');
  if (recommendations.length === 0) recommendations.push('Current complexity is suitable for pilot testing.');
  return { score, level, required, lookup, formula, recommendations };
}

function mobilePreviewForTemplate(template: QualityFormTemplate, role: QualityWorkflowRole, mode: QualityFormMode) {
  const visibleFields = template.fields.filter((field) => {
    const visibleByRole = !field.roleVisibility?.visibleTo?.length || field.roleVisibility.visibleTo.includes(role);
    const visibleByMode = mode === 'mobile' ? field.modeVisibility?.create !== false : field.modeVisibility?.[mode as Exclude<QualityFormMode, 'mobile'>] !== false;
    return visibleByRole && visibleByMode && !field.hidden;
  });
  const requiredFields = visibleFields.filter((field) => field.required);
  const hiddenByRole = template.fields.length - template.fields.filter((field) => !field.roleVisibility?.visibleTo?.length || field.roleVisibility.visibleTo.includes(role)).length;
  const warnings: string[] = [];
  if (requiredFields.length > 7) warnings.push('Too many required fields for fast shopfloor entry.');
  if (visibleFields.length > 16) warnings.push('Visible field count is high for mobile use.');
  if (!visibleFields.some((field) => ['barcode', 'lookup'].includes(field.type) || ['partNumber', 'partId', 'barcode'].includes(field.fieldKey))) warnings.push('Consider barcode or part lookup for shopfloor speed.');
  return { visibleFields, requiredFields, hiddenByRole, warnings };
}

function publishChecklistForTemplate(template: QualityFormTemplate, mobileChecked: boolean) {
  const validation = validateQualityFormTemplate(template);
  const keys = templateFieldKeys(template);
  const canSubmit = template.fields.some((field) => !field.hidden && (!field.roleVisibility?.editableBy?.length || field.roleVisibility.editableBy.length > 0));
  const readiness = readinessForTemplate(template);
  const criticalDashboardMissing = ['date', 'defectType', 'quantity'].filter((key) => !keys.has(key));
  const items = [
    { label: 'No duplicate field keys', ok: !validation.errors.some((error) => error.includes('Duplicate field keys')), critical: true },
    { label: 'Required labels and field keys are present', ok: !validation.errors.some((error) => error.includes('field key')) && !validation.warnings.some((warning) => warning.includes('has no label')), critical: true },
    { label: 'Lookup sources and key columns are valid', ok: !validation.errors.some((error) => error.includes('Lookup field')), critical: true },
    { label: 'Auto-fill mappings point to real source and target fields', ok: !validation.errors.some((error) => error.includes('Auto-fill')), critical: true },
    { label: 'Formula references are valid', ok: !validation.errors.some((error) => error.includes('Formula field')), critical: true },
    { label: 'No circular dependencies detected', ok: !validation.errors.some((error) => error.includes('Circular dependency')), critical: true },
    { label: 'Core dashboard fields are present', ok: criticalDashboardMissing.length === 0, critical: false, detail: criticalDashboardMissing.length ? `Missing: ${criticalDashboardMissing.join(', ')}` : '' },
    { label: 'At least one role can submit/edit fields', ok: canSubmit, critical: true },
    { label: 'Mobile/shopfloor preview checked', ok: mobileChecked, critical: false },
    { label: 'At least one dashboard readiness profile is 70%+', ok: readiness.some((item) => item.score >= 70), critical: false },
  ];
  return {
    items,
    criticalErrors: [...validation.errors, ...items.filter((item) => item.critical && !item.ok).map((item) => item.label)],
    warnings: [...validation.warnings, ...items.filter((item) => !item.critical && !item.ok).map((item) => item.detail ? `${item.label}: ${item.detail}` : item.label)],
  };
}

export default function QualityFormDesigner() {
  const { getFormByType } = useConfigStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [templates, setTemplates] = useState<QualityFormTemplate[]>(() => loadQualityFormTemplates());
  const [selectedId, setSelectedId] = useState<string>(() => loadQualityFormTemplates()[0]?.id || '');
  const [draft, setDraft] = useState<QualityFormTemplate>(() => loadQualityFormTemplates()[0] || createBlankQualityFormTemplate());
  const [selectedFieldId, setSelectedFieldId] = useState<string>(() => draft.fields[0]?.id || '');
  const [previewRole, setPreviewRole] = useState<QualityWorkflowRole>('INSPECTOR');
  const [previewMode, setPreviewMode] = useState<QualityFormMode>('create');
  const [search, setSearch] = useState('');
  const [bindingFieldId, setBindingFieldId] = useState<string>('');
  const [mappingSourceColumn, setMappingSourceColumn] = useState('');
  const [mappingTargetField, setMappingTargetField] = useState('');
  const [lookupTestValue, setLookupTestValue] = useState('');
  const [lookupTestResult, setLookupTestResult] = useState<{
    row: QualityMasterRecord | null;
    preview: Array<{ targetField: string; sourceColumn: string; value: string; status: 'valid' | 'warning' | 'broken'; warning?: string }>;
    warnings: string[];
  } | null>(null);
  const [formulaFieldId, setFormulaFieldId] = useState<string>('');
  const [formulaSamples, setFormulaSamples] = useState<Record<string, string>>({});
  const [selectedFormulaPreset, setSelectedFormulaPreset] = useState('');
  const [conditionalSamples, setConditionalSamples] = useState<Record<string, string>>({});
  const [mobilePreviewChecked, setMobilePreviewChecked] = useState(false);
  const [publishNote, setPublishNote] = useState('');

  const user = currentFormDesignerUser();
  const manageAccess = canManageQualityFormTemplates(user.role);
  const selectedField = draft.fields.find((field) => field.id === selectedFieldId) || draft.fields[0];
  const lookupFields = useMemo(() => draft.fields.filter((field) => field.type === 'lookup'), [draft.fields]);
  const formulaFields = useMemo(() => draft.fields.filter((field) => field.type === 'formula' || field.type === 'calculated'), [draft.fields]);
  const bindingField = draft.fields.find((field) => field.id === bindingFieldId) || lookupFields[0] || selectedField;
  const formulaField = draft.fields.find((field) => field.id === formulaFieldId) || formulaFields[0] || selectedField;
  const validation = useMemo(() => validateQualityFormTemplate(draft), [draft]);
  const dashboardReadiness = useMemo(() => readinessForTemplate(draft), [draft]);
  const complexity = useMemo(() => complexityForTemplate(draft), [draft]);
  const mobilePreview = useMemo(() => mobilePreviewForTemplate(draft, previewRole, previewMode), [draft, previewRole, previewMode]);
  const publishChecklist = useMemo(() => publishChecklistForTemplate(draft, mobilePreviewChecked), [draft, mobilePreviewChecked]);
  const dynamicPreview = useMemo(() => qualityTemplateToDynamicForm(draft), [draft]);
  const filteredTemplates = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return templates.filter((template) => !needle || `${template.name} ${template.description} ${template.recordType}`.toLowerCase().includes(needle));
  }, [templates, search]);
  const bindingTable = qualityMasterTableConfigs.find((table) => table.id === (bindingField?.lookup?.sourceTable || 'parts')) || qualityMasterTableConfigs[0];
  const bindingRowsCount = useMemo(
    () => bindingField?.lookup?.sourceTable ? loadQualityMasterTable(bindingField.lookup.sourceTable).filter((row) => row.isActive !== false).length : 0,
    [bindingField?.lookup?.sourceTable],
  );
  const bindingRows = useMemo(
    () => bindingField?.lookup?.sourceTable ? loadQualityMasterTable(bindingField.lookup.sourceTable).filter((row) => row.isActive !== false) : [],
    [bindingField?.lookup?.sourceTable],
  );
  const dependencyMap = useMemo(() => {
    const lookupDependencies = draft.fields.flatMap((field) => (field.lookup?.autoFillMappings || []).map((mapping) => ({
      source: field.fieldKey,
      target: mapping.targetField,
      label: `${field.label} -> ${fieldLabel(draft.fields, mapping.targetField)}`,
      type: 'lookup' as const,
      detail: `${mapping.sourceColumn} from ${qualityMasterTableConfigs.find((table) => table.id === field.lookup?.sourceTable)?.name || field.lookup?.sourceTable}`,
    })));
    const formulaDependencies = draft.fields.flatMap((field) => {
      const expression = field.formula?.expression || '';
      return FormulaEvaluator.extractVariables(expression).map((variable) => ({
        source: variable,
        target: field.fieldKey,
        label: `${fieldLabel(draft.fields, variable)} -> ${field.label}`,
        type: 'formula' as const,
        detail: expression,
      }));
    });
    return [...lookupDependencies, ...formulaDependencies];
  }, [draft.fields]);
  const formulaTest = useMemo(() => {
    const expression = formulaField?.formula?.expression || '';
    const variables = FormulaEvaluator.extractVariables(expression);
    const missingFields = variables.filter((variable) => !draft.fields.some((field) => field.fieldKey === variable));
    const context = Object.fromEntries(variables.map((variable) => [variable, sampleValueToFormulaContext(formulaSamples[variable] || '')]));
    const divideByZeroFields = variables.filter((variable) => Number(context[variable]) === 0 && expression.includes(`/ @${variable}`));
    const syntax = expression ? FormulaEvaluator.validate(expression) : { valid: false, error: 'No formula expression configured.' };
    const result = expression && syntax.valid ? new FormulaEvaluator(context).evaluate(expression) : null;
    const missingSampleValues = variables.filter((variable) => !String(formulaSamples[variable] || '').trim());
    const nonFiniteResult = typeof result === 'number' && !Number.isFinite(result);
    const invalidResult = expression && syntax.valid && result === null;
    return { expression, variables, missingFields, missingSampleValues, divideByZeroFields, syntax, result, nonFiniteResult, invalidResult };
  }, [draft.fields, formulaField?.formula?.expression, formulaSamples]);
  const conditionalPreview = useMemo(() => {
    const hidden = new Set(draft.fields.filter((field) => field.hidden).map((field) => field.fieldKey));
    const required = new Set(draft.fields.filter((field) => field.required).map((field) => field.fieldKey));
    const warnings: string[] = [];
    const matchesRule = (rule: QualityConditionalRule): boolean => {
      const actual = conditionalSamples[rule.sourceField] ?? '';
      const expected = String(rule.value ?? '');
      const actualNumber = Number(actual);
      const expectedNumber = Number(expected);
      if (rule.operator === 'equals') return String(actual) === expected;
      if (rule.operator === 'not equals') return String(actual) !== expected;
      if (rule.operator === 'contains') return String(actual).toLowerCase().includes(expected.toLowerCase());
      if (rule.operator === 'in list') return expected.split(',').map((item) => item.trim()).includes(String(actual));
      if (rule.operator === 'is empty') return !String(actual).trim();
      if (rule.operator === 'is not empty') return Boolean(String(actual).trim());
      if (rule.operator === 'greater than') return Number.isFinite(actualNumber) && Number.isFinite(expectedNumber) && actualNumber > expectedNumber;
      if (rule.operator === 'less than') return Number.isFinite(actualNumber) && Number.isFinite(expectedNumber) && actualNumber < expectedNumber;
      return false;
    };
    draft.rules.forEach((rule) => {
      if (!matchesRule(rule)) return;
      if (rule.action === 'hide field' && rule.targetField) hidden.add(rule.targetField);
      if (rule.action === 'show field' && rule.targetField) hidden.delete(rule.targetField);
      if (rule.action === 'require field' && rule.targetField) required.add(rule.targetField);
      if (rule.action === 'show warning' && rule.warningMessage) warnings.push(rule.warningMessage);
      if (rule.action === 'suggest NCR') warnings.push(rule.warningMessage || 'NCR suggestion rule would trigger.');
    });
    return {
      shown: draft.fields.filter((field) => !hidden.has(field.fieldKey)).map((field) => field.fieldKey),
      hidden: [...hidden],
      required: [...required],
      warnings,
    };
  }, [conditionalSamples, draft.fields, draft.rules]);

  const refreshTemplates = (nextSelectedId?: string) => {
    const next = loadQualityFormTemplates();
    setTemplates(next);
    const selected = next.find((template) => template.id === (nextSelectedId || selectedId)) || next[0];
    if (selected) {
      setSelectedId(selected.id);
      setDraft(selected);
      setSelectedFieldId(selected.fields[0]?.id || '');
    }
  };

  const blocked = () => {
    toast.error('Form governance blocked', { description: manageAccess.reason });
  };

  const ensureCanManage = () => {
    if (manageAccess.allowed) return true;
    blocked();
    return false;
  };

  const updateDraft = (updates: Partial<QualityFormTemplate>) => {
    setDraft((prev) => ({ ...prev, ...updates, updatedAt: new Date().toISOString() }));
  };

  const saveDraft = () => {
    if (!ensureCanManage()) return;
    const saved = upsertQualityFormTemplate(draft);
    refreshTemplates(saved.id);
    toast.success('Template saved', { description: `${saved.name} is stored locally under ${QUALITY_FORM_TEMPLATES_KEY}.` });
  };

  const createTemplate = () => {
    if (!ensureCanManage()) return;
    const template = createBlankQualityFormTemplate();
    const saved = upsertQualityFormTemplate(template);
    refreshTemplates(saved.id);
    toast.success('Template created', { description: 'Start configuring sections, fields, rules, and preview behavior.' });
  };

  const createFromCurrentDefectForm = () => {
    if (!ensureCanManage()) return;
    const current = getFormByType('defect-log');
    if (!current) {
      toast.error('Current defect form not found');
      return;
    }
    const template = dynamicFormToQualityTemplate(current, {
      name: 'Configurable Defect Recorder Template',
      description: 'Created from the current defect recorder configuration for UI-based editing.',
      entityType: 'defect-log',
      recordType: 'process-ppm',
    });
    const saved = upsertQualityFormTemplate(template);
    refreshTemplates(saved.id);
    toast.success('Template created from current form', { description: 'It is saved as draft. Publish when ready.' });
  };

  const duplicateTemplate = () => {
    if (!ensureCanManage()) return;
    const copy = duplicateQualityFormTemplate(draft.id);
    if (copy) {
      refreshTemplates(copy.id);
      toast.success('Template duplicated', { description: `${copy.name} is ready for editing.` });
    }
  };

  const publishTemplate = () => {
    if (!ensureCanManage()) return;
    if (publishChecklist.criticalErrors.length) {
      toast.error('Template cannot be published yet', { description: publishChecklist.criticalErrors.slice(0, 3).join(' ') });
      return;
    }
    upsertQualityFormTemplate(draft, false);
    const published = publishQualityFormTemplate(draft.id, publishNote || 'Published after pilot readiness checklist');
    if (published) {
      refreshTemplates(published.id);
      toast.success('Template published', { description: 'DynamicFormRenderer will use this active template for matching defect records.' });
    }
  };

  const archiveTemplate = () => {
    if (!ensureCanManage()) return;
    const archived = archiveQualityFormTemplate(draft.id);
    if (archived) {
      refreshTemplates(archived.id);
      toast.success('Template archived', { description: 'Historical records keep their saved template version.' });
    }
  };

  const rollback = (version: number) => {
    if (!ensureCanManage()) return;
    const rolledBack = rollbackQualityFormTemplate(draft.id, version);
    if (rolledBack) {
      refreshTemplates(rolledBack.id);
      toast.success('Template rolled back', { description: `Version ${version} was restored into a new draft version.` });
    }
  };

  const addSection = () => {
    if (!ensureCanManage()) return;
    const section = emptySection(draft.sections.length + 1);
    updateDraft({ sections: [...draft.sections, section] });
  };

  const updateSection = (id: string, patch: Partial<QualityFormSection>) => {
    updateDraft({ sections: draft.sections.map((section) => section.id === id ? { ...section, ...patch } : section) });
  };

  const addField = () => {
    if (!ensureCanManage()) return;
    const sectionId = draft.sections[0]?.id || 'general';
    const field = emptyField(sectionId, draft.fields.length + 1);
    updateDraft({ fields: [...draft.fields, field] });
    setSelectedFieldId(field.id);
  };

  const updateField = (id: string, patch: Partial<QualityFormField>) => {
    updateDraft({ fields: draft.fields.map((field) => field.id === id ? { ...field, ...patch } : field) });
  };

  const addRule = () => {
    if (!ensureCanManage()) return;
    updateDraft({ rules: [...draft.rules, emptyRule(draft.fields)] });
  };

  const updateRule = (id: string, patch: Partial<QualityConditionalRule>) => {
    updateDraft({ rules: draft.rules.map((rule) => rule.id === id ? { ...rule, ...patch } : rule) });
  };

  const updateBindingField = (patch: Partial<QualityFormField>) => {
    if (!bindingField) return;
    updateField(bindingField.id, patch);
  };

  const ensureLookupBinding = (sourceTable: QualityMasterTableId = bindingField?.lookup?.sourceTable || 'parts') => {
    if (!bindingField) return;
    updateBindingField({
      type: 'lookup',
      lookup: {
        ...defaultLookupConfig(sourceTable),
        ...(bindingField.lookup || {}),
        sourceTable,
      },
    });
    setBindingFieldId(bindingField.id);
  };

  const addAutoFillMapping = () => {
    if (!bindingField) return;
    ensureLookupBinding();
    if (!mappingSourceColumn || !mappingTargetField) {
      toast.error('Select source and target columns first.');
      return;
    }
    const lookup = bindingField.lookup || defaultLookupConfig(bindingTable.id);
    if (lookup.autoFillMappings.some((mapping) => mapping.sourceColumn === mappingSourceColumn && mapping.targetField === mappingTargetField)) {
      toast.info('Mapping already exists');
      return;
    }
    updateField(bindingField.id, {
      type: 'lookup',
      lookup: {
        ...lookup,
        autoFillMappings: [...lookup.autoFillMappings, { sourceColumn: mappingSourceColumn, targetField: mappingTargetField }],
      },
    });
    setMappingSourceColumn('');
    setMappingTargetField('');
  };

  const removeAutoFillMapping = (index: number) => {
    if (!bindingField?.lookup) return;
    updateField(bindingField.id, {
      lookup: {
        ...bindingField.lookup,
        autoFillMappings: bindingField.lookup.autoFillMappings.filter((_, itemIndex) => itemIndex !== index),
      },
    });
  };

  const runLookupTest = () => {
    if (!bindingField?.lookup) {
      toast.error('Configure this field as a lookup first.');
      return;
    }
    const lookup = bindingField.lookup;
    const config = qualityMasterTableConfigs.find((table) => table.id === lookup.sourceTable);
    const row = bindingRows.find((item) => String(item[lookup.keyColumn] ?? item[lookup.displayColumn] ?? '').trim() === lookupTestValue)
      || bindingRows.find((item) => Object.values(item).some((value) => String(value ?? '').trim() === lookupTestValue))
      || null;
    const warnings: string[] = [];
    if (!lookupTestValue) warnings.push('Select a real source value before testing.');
    if (!row) warnings.push('No source row resolved for the selected test value.');
    if (!config) warnings.push('Lookup source table is not configured.');
    const preview = (lookup.autoFillMappings || []).map((mapping) => {
      const sourceExists = Boolean(config?.fields.some((field) => field.key === mapping.sourceColumn));
      const targetExists = draft.fields.some((field) => field.fieldKey === mapping.targetField);
      const value = row ? String(row[mapping.sourceColumn] ?? '') : '';
      const missing: string[] = [];
      if (!sourceExists) missing.push('missing source column');
      if (!targetExists) missing.push('missing target field');
      return {
        targetField: mapping.targetField,
        sourceColumn: mapping.sourceColumn,
        value,
        status: missing.length ? 'broken' as const : value ? 'valid' as const : 'warning' as const,
        warning: missing.length ? missing.join(', ') : value ? undefined : 'source value is empty',
      };
    });
    if (preview.length === 0) warnings.push('No auto-fill mappings are configured for this lookup.');
    setLookupTestResult({ row, preview, warnings });
    enqueueQualitySyncItem({
      entityType: 'form-templates',
      entityId: draft.id,
      operation: 'form-lookup-tested',
      payloadSummary: `Lookup tested for ${bindingField.fieldKey} using ${lookup.sourceTable}.${lookup.keyColumn}`,
    });
    toast.success('Lookup test completed', { description: row ? 'Resolved one local master data row.' : 'Review warnings before publishing.' });
  };

  const updateFormulaExpression = (expression: string) => {
    if (!formulaField) return;
    updateField(formulaField.id, { type: formulaField.type === 'calculated' ? 'calculated' : 'formula', formula: { ...(formulaField.formula || {}), expression } });
  };

  const insertFormulaToken = (token: string) => {
    updateFormulaExpression(`${formulaField?.formula?.expression || ''}${token}`);
  };

  const applyFormulaPreset = () => {
    if (!formulaField || !selectedFormulaPreset) return;
    const preset = formulaPresets.find((item) => item.name === selectedFormulaPreset);
    if (!preset) return;
    updateFormulaExpression(preset.expression);
    const nextSamples = { ...formulaSamples };
    preset.fields.forEach((field) => {
      if (!nextSamples[field]) nextSamples[field] = field.toLowerCase().includes('quantity') ? '100' : '1';
    });
    setFormulaSamples(nextSamples);
    enqueueQualitySyncItem({
      entityType: 'form-templates',
      entityId: draft.id,
      operation: 'form-formula-tested',
      payloadSummary: `Formula preset ${preset.name} applied to ${formulaField.fieldKey}`,
    });
    toast.success('Formula preset applied', { description: 'Adjust @field references if your template uses different field keys.' });
  };

  const runFormulaTest = () => {
    enqueueQualitySyncItem({
      entityType: 'form-templates',
      entityId: draft.id,
      operation: 'form-formula-tested',
      payloadSummary: `Formula sandbox tested for ${formulaField?.fieldKey || 'unknown field'}`,
    });
    if (!formulaTest.syntax.valid || formulaTest.missingFields.length || formulaTest.invalidResult) {
      toast.error('Formula needs review', { description: formulaTest.syntax.error || formulaTest.missingFields.join(', ') || 'Result could not be calculated.' });
      return;
    }
    toast.success('Formula test completed', { description: `Preview result: ${String(formulaTest.result ?? '---')}` });
  };

  const runPublishChecklist = () => {
    enqueueQualitySyncItem({
      entityType: 'form-templates',
      entityId: draft.id,
      operation: 'form-publish-checklist-run',
      payloadSummary: `Publish checklist run for ${draft.name}`,
    });
    if (publishChecklist.criticalErrors.length) {
      toast.error('Publish checklist has critical issues', { description: publishChecklist.criticalErrors.slice(0, 2).join(' ') });
      return;
    }
    toast.success('Publish checklist completed', { description: publishChecklist.warnings.length ? 'Warnings remain, but no critical blockers.' : 'No blockers found.' });
  };

  const createCompactVersion = () => {
    if (!ensureCanManage()) return;
    const compactFields = draft.fields.map((field) => {
      const key = normalizeKey(field.fieldKey);
      const label = normalizeKey(field.label);
      const essential = [...essentialShopfloorKeys].some((item) => key === normalizeKey(item) || key.includes(normalizeKey(item)) || label.includes(normalizeKey(item)));
      return {
        ...field,
        hidden: !essential,
        required: essential && ['date', 'shift', 'productionline', 'partnumber', 'barcode', 'defecttype', 'quantity'].some((item) => key.includes(item)),
      };
    });
    const compactTemplate: QualityFormTemplate = {
      ...draft,
      id: newId('form-template'),
      name: `${draft.name} - Shopfloor Compact`,
      description: `${draft.description || 'Quality form template'} Compact draft optimized for mobile shopfloor defect entry.`,
      status: 'draft',
      version: 1,
      history: [],
      fields: compactFields,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const saved = upsertQualityFormTemplate(compactTemplate, false);
    enqueueQualitySyncItem({
      entityType: 'form-templates',
      entityId: saved.id,
      operation: 'form-compact-version-created',
      payloadSummary: `Compact shopfloor draft created from ${draft.name}`,
    });
    refreshTemplates(saved.id);
    toast.success('Compact version created', { description: 'Created as draft. Review hidden fields before publishing.' });
  };

  const exportTemplate = () => {
    if (!ensureCanManage()) return;
    downloadJson(exportQualityFormTemplate(draft), `${draft.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}_template.json`);
    toast.success('Template exported', { description: 'Export contains form configuration only, not defect records.' });
  };

  const importTemplateFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ensureCanManage()) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const parsed = JSON.parse(String(loadEvent.target?.result || '{}'));
        const imported = importQualityFormTemplate(parsed.template || parsed);
        refreshTemplates(imported.id);
        toast.success('Template imported', { description: `${imported.name} is available as a local template.` });
      } catch {
        toast.error('Invalid template JSON');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const selectedTable = selectedField?.lookup?.sourceTable || 'parts';
  const selectedTableConfig = qualityMasterTableConfigs.find((table) => table.id === selectedTable) || qualityMasterTableConfigs[0];

  return (
    <PageContainer>
      <PageHeader
        title="Quality Form Designer"
        subtitle="AppSheet-like local designer for defect recorder and future quality forms"
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-[#00A3E0]/20 bg-[#00A3E0]/10 p-3">
            <LayoutTemplate className="h-5 w-5 text-[#00A3E0]" />
          </div>
          <div>
            <p className="text-sm font-black text-white">Local Form Governance</p>
            <p className="text-xs text-white/45">Configure templates locally. Publish only when ready for real defect recording.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-white/10 bg-white/5 text-white/70">{roleLabel(user.role)}</Badge>
          <Button variant="outline" onClick={createTemplate} disabled={!manageAccess.allowed} title={manageAccess.reason}>
            <Plus className="mr-2 h-4 w-4" /> New Template
          </Button>
          <Button onClick={saveDraft} disabled={!manageAccess.allowed} title={manageAccess.reason}>
            <Save className="mr-2 h-4 w-4" /> Save
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Link to="/quality-master-data" className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-black text-white/70 hover:bg-white/10">
          <Database className="mb-2 h-5 w-5 text-[#00A3E0]" /> Open Master Data
        </Link>
        <Link to="/defect-log" className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-black text-white/70 hover:bg-white/10">
          <Eye className="mb-2 h-5 w-5 text-[#00A3E0]" /> Preview in Defect Recorder
        </Link>
        <Link to="/quality-shopfloor" className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-black text-white/70 hover:bg-white/10">
          <LayoutTemplate className="mb-2 h-5 w-5 text-[#00A3E0]" /> Open Shopfloor Mode
        </Link>
      </div>

      {!manageAccess.allowed && (
        <div className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          <Lock className="mr-2 inline h-4 w-4" />
          {manageAccess.reason}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search templates..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-[#00A3E0]/60"
            />
            <div className="mt-4 space-y-2">
              {filteredTemplates.length === 0 ? (
                <QualityGuidedEmptyState
                  title="No local form templates"
                  purpose="Form templates define fields, sections, lookups, formulas, role visibility, and publishing for the Defect Recorder and Shopfloor Entry."
                  firstAction="Create a template from the current defect form or import a controlled template JSON."
                  actionHref="/quality-form-designer"
                  actionLabel="Create Template"
                />
              ) : filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(template.id);
                    setDraft(template);
                    setSelectedFieldId(template.fields[0]?.id || '');
                  }}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selectedId === template.id ? 'border-[#00A3E0]/50 bg-[#00A3E0]/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-black text-white">{template.name}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${statusBadge(template.status)}`}>
                      {template.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-white/45">v{template.version} / {template.recordType || template.entityType}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-white/60">Template Actions</h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={createFromCurrentDefectForm} disabled={!manageAccess.allowed}>
                <RefreshCw className="mr-2 h-4 w-4" /> From Current
              </Button>
              <Button variant="outline" size="sm" onClick={duplicateTemplate} disabled={!manageAccess.allowed}>
                <Copy className="mr-2 h-4 w-4" /> Duplicate
              </Button>
              <Button variant="outline" size="sm" onClick={createCompactVersion} disabled={!manageAccess.allowed}>
                <Smartphone className="mr-2 h-4 w-4" /> Compact
              </Button>
              <Button variant="outline" size="sm" onClick={publishTemplate} disabled={!manageAccess.allowed}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Publish
              </Button>
              <Button variant="outline" size="sm" onClick={archiveTemplate} disabled={!manageAccess.allowed}>
                <Archive className="mr-2 h-4 w-4" /> Archive
              </Button>
              <Button variant="outline" size="sm" onClick={exportTemplate} disabled={!manageAccess.allowed}>
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={!manageAccess.allowed}>
                <Upload className="mr-2 h-4 w-4" /> Import
              </Button>
            </div>
            <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={importTemplateFile} />
          </div>
        </aside>

        <main className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {[
              ['Status', draft.status],
              ['Version', `v${draft.version}`],
              ['Sections', draft.sections.length],
              ['Fields', draft.fields.length],
              ['Complexity', complexity.level],
              ['Required', complexity.required],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/35">{label}</p>
                <p className="mt-2 text-2xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>

          <Tabs defaultValue="template" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-9">
              <TabsTrigger value="template">Template Info</TabsTrigger>
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="fields">Fields</TabsTrigger>
              <TabsTrigger value="binding">Lookups</TabsTrigger>
              <TabsTrigger value="formulas">Formulas</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="visibility">Visibility</TabsTrigger>
              <TabsTrigger value="preview">Publish</TabsTrigger>
              <TabsTrigger value="governance">History</TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="mb-4 text-lg font-black text-white">Template Setup</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs font-bold text-white/50">Name</span>
                    <input value={draft.name} onChange={(event) => updateDraft({ name: event.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-bold text-white/50">Entity Type</span>
                    <select value={draft.entityType} onChange={(event) => updateDraft({ entityType: event.target.value as QualityFormTemplate['entityType'] })} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white">
                      {['defect-log', 'quality-form', 'ncr', 'capa', 'eight-d', 'custom'].map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-xs font-bold text-white/50">Description</span>
                    <textarea value={draft.description} onChange={(event) => updateDraft({ description: event.target.value })} className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
                  </label>
                  {[
                    ['recordType', 'Record Type'],
                    ['applicableFactory', 'Factory'],
                    ['applicableWorkshop', 'Workshop'],
                    ['applicableLine', 'Line'],
                    ['applicableInspectionPoint', 'Inspection Point'],
                    ['applicableProduct', 'Product'],
                    ['applicableModel', 'Model'],
                  ].map(([key, label]) => (
                    <label key={key} className="space-y-2">
                      <span className="text-xs font-bold text-white/50">{label}</span>
                      <input value={String((draft as unknown as Record<string, unknown>)[key] || '')} onChange={(event) => updateDraft({ [key]: event.target.value } as Partial<QualityFormTemplate>)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
                    </label>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sections" className="space-y-4">
              <div className="flex justify-between">
                <h2 className="text-lg font-black text-white">Section Designer</h2>
                <Button variant="outline" onClick={addSection} disabled={!manageAccess.allowed}><Plus className="mr-2 h-4 w-4" /> Add Section</Button>
              </div>
              {draft.sections.map((section) => (
                <div key={section.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px_160px]">
                    <input value={section.title} onChange={(event) => updateSection(section.id, { title: event.target.value })} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
                    <input type="number" value={section.order} onChange={(event) => updateSection(section.id, { order: Number(event.target.value) || 1 })} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
                    <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white/60">
                      <input type="checkbox" checked={!!section.collapsible} onChange={(event) => updateSection(section.id, { collapsible: event.target.checked })} />
                      Collapsible
                    </label>
                  </div>
                  <textarea value={section.description || ''} onChange={(event) => updateSection(section.id, { description: event.target.value })} placeholder="Section helper text" className="mt-3 min-h-20 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="fields" className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-black uppercase tracking-widest text-white/50">Fields</h2>
                  <Button variant="outline" size="sm" onClick={addField} disabled={!manageAccess.allowed}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-2">
                  {draft.fields.map((field) => (
                    <button key={field.id} type="button" onClick={() => setSelectedFieldId(field.id)} className={`w-full rounded-xl border p-3 text-left ${selectedFieldId === field.id ? 'border-[#00A3E0]/50 bg-[#00A3E0]/10' : 'border-white/10 bg-white/5'}`}>
                      <div className="text-sm font-black text-white">{field.label}</div>
                      <div className="text-[11px] text-white/40">{field.fieldKey} / {field.type}</div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedField && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h2 className="mb-4 text-lg font-black text-white">Field Designer</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-bold text-white/50">Field Key</span>
                      <input value={selectedField.fieldKey} onChange={(event) => updateField(selectedField.id, { fieldKey: event.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold text-white/50">Label</span>
                      <input value={selectedField.label} onChange={(event) => updateField(selectedField.id, { label: event.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold text-white/50">Type</span>
                      <select value={selectedField.type} onChange={(event) => updateField(selectedField.id, { type: event.target.value as QualityDesignerFieldType })} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white">
                        {fieldTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold text-white/50">Section</span>
                      <select value={selectedField.sectionId} onChange={(event) => updateField(selectedField.id, { sectionId: event.target.value })} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white">
                        {draft.sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold text-white/50">Order</span>
                      <input type="number" value={selectedField.order} onChange={(event) => updateField(selectedField.id, { order: Number(event.target.value) || 1 })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold text-white/50">Placeholder</span>
                      <input value={selectedField.placeholder || ''} onChange={(event) => updateField(selectedField.id, { placeholder: event.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
                    </label>
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-xs font-bold text-white/50">Helper Text</span>
                      <textarea value={selectedField.helperText || ''} onChange={(event) => updateField(selectedField.id, { helperText: event.target.value })} className="min-h-20 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
                    </label>
                    <div className="flex flex-wrap gap-3 md:col-span-2">
                      {[
                        ['required', 'Required'],
                        ['readOnly', 'Read-only'],
                        ['hidden', 'Hidden'],
                      ].map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                          <input type="checkbox" checked={Boolean((selectedField as unknown as Record<string, unknown>)[key])} onChange={(event) => updateField(selectedField.id, { [key]: event.target.checked } as Partial<QualityFormField>)} />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                      <h3 className="mb-3 text-sm font-black text-white">Visible To Roles</h3>
                      <p className="mb-3 text-xs text-white/40">Leave empty to allow all roles.</p>
                      <div className="grid grid-cols-1 gap-2">
                        {QUALITY_WORKFLOW_ROLES.filter((role) => ['ADMIN', 'QUALITY_MANAGER', 'QUALITY_SUPERVISOR', 'QUALITY_ENGINEER', 'INSPECTOR', 'OPERATOR'].includes(role)).map((role) => {
                          const selected = selectedField.roleVisibility?.visibleTo?.includes(role) || false;
                          return (
                            <label key={role} className="flex items-center gap-2 text-xs text-white/65">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(event) => {
                                  const current = selectedField.roleVisibility?.visibleTo || [];
                                  const visibleTo = event.target.checked ? [...current, role] : current.filter((item) => item !== role);
                                  updateField(selectedField.id, { roleVisibility: { ...(selectedField.roleVisibility || { editableBy: [] }), visibleTo } });
                                }}
                              />
                              {roleLabel(role)}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                      <h3 className="mb-3 text-sm font-black text-white">Editable By Roles</h3>
                      <p className="mb-3 text-xs text-white/40">Leave empty to allow all visible roles.</p>
                      <div className="grid grid-cols-1 gap-2">
                        {QUALITY_WORKFLOW_ROLES.filter((role) => ['ADMIN', 'QUALITY_MANAGER', 'QUALITY_SUPERVISOR', 'QUALITY_ENGINEER', 'INSPECTOR', 'OPERATOR'].includes(role)).map((role) => {
                          const selected = selectedField.roleVisibility?.editableBy?.includes(role) || false;
                          return (
                            <label key={role} className="flex items-center gap-2 text-xs text-white/65">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(event) => {
                                  const current = selectedField.roleVisibility?.editableBy || [];
                                  const editableBy = event.target.checked ? [...current, role] : current.filter((item) => item !== role);
                                  updateField(selectedField.id, { roleVisibility: { ...(selectedField.roleVisibility || { visibleTo: [] }), editableBy } });
                                }}
                              />
                              {roleLabel(role)}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                      <h3 className="mb-3 text-sm font-black text-white">Mode Visibility</h3>
                      <div className="grid grid-cols-1 gap-2">
                        {modes.map((mode) => (
                          <label key={mode} className="flex items-center gap-2 text-xs text-white/65">
                            <input
                              type="checkbox"
                              checked={selectedField.modeVisibility?.[mode] !== false}
                              onChange={(event) => updateField(selectedField.id, {
                                modeVisibility: {
                                  create: selectedField.modeVisibility?.create !== false,
                                  edit: selectedField.modeVisibility?.edit !== false,
                                  detail: selectedField.modeVisibility?.detail !== false,
                                  [mode]: event.target.checked,
                                },
                              })}
                            />
                            {mode}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {(selectedField.type === 'select' || selectedField.type === 'multi-select' || selectedField.type === 'status') && (
                    <div className="mt-5 rounded-xl border border-white/10 bg-black/10 p-4">
                      <h3 className="text-sm font-black text-white">Options</h3>
                      <p className="mb-2 text-xs text-white/40">One option per line: value|label</p>
                      <textarea value={optionsText(selectedField)} onChange={(event) => updateField(selectedField.id, { options: parseOptions(event.target.value) })} className="min-h-28 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-white" />
                    </div>
                  )}

                  {selectedField.type === 'lookup' && (
                    <div className="mt-5 rounded-xl border border-white/10 bg-black/10 p-4">
                      <h3 className="mb-3 text-sm font-black text-white">Lookup Builder</h3>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <select
                          value={selectedTable}
                          onChange={(event) => updateField(selectedField.id, {
                            lookup: {
                              sourceTable: event.target.value as QualityMasterTableId,
                              keyColumn: qualityMasterTableConfigs.find((table) => table.id === event.target.value)?.primaryKey || 'id',
                              displayColumn: qualityMasterTableConfigs.find((table) => table.id === event.target.value)?.primaryKey || 'id',
                              searchColumns: [],
                              autoFillMappings: [],
                              fillEmptyFieldsOnly: true,
                              preventOverwriteWithoutConfirmation: true,
                            },
                          })}
                          className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
                        >
                          {qualityMasterTableConfigs.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}
                        </select>
                        <select value={selectedField.lookup?.keyColumn || selectedTableConfig.primaryKey} onChange={(event) => updateField(selectedField.id, { lookup: { ...(selectedField.lookup || { sourceTable: selectedTable, displayColumn: selectedTableConfig.primaryKey, searchColumns: [], autoFillMappings: [], fillEmptyFieldsOnly: true, preventOverwriteWithoutConfirmation: true }), keyColumn: event.target.value } })} className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white">
                          {selectedTableConfig.fields.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}
                        </select>
                        <select value={selectedField.lookup?.displayColumn || selectedTableConfig.primaryKey} onChange={(event) => updateField(selectedField.id, { lookup: { ...(selectedField.lookup || { sourceTable: selectedTable, keyColumn: selectedTableConfig.primaryKey, searchColumns: [], autoFillMappings: [], fillEmptyFieldsOnly: true, preventOverwriteWithoutConfirmation: true }), displayColumn: event.target.value } })} className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white">
                          {selectedTableConfig.fields.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}
                        </select>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_260px]">
                        <input
                          value={(selectedField.lookup?.searchColumns || []).join(', ')}
                          onChange={(event) => updateField(selectedField.id, { lookup: { ...(selectedField.lookup || { sourceTable: selectedTable, keyColumn: selectedTableConfig.primaryKey, displayColumn: selectedTableConfig.primaryKey, autoFillMappings: [], fillEmptyFieldsOnly: true, preventOverwriteWithoutConfirmation: true }), searchColumns: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) } })}
                          placeholder="Search columns: partNumber, partName"
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                        />
                        <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white/65">
                          <input
                            type="checkbox"
                            checked={selectedField.lookup?.fillEmptyFieldsOnly !== false}
                            onChange={(event) => updateField(selectedField.id, { lookup: { ...(selectedField.lookup || { sourceTable: selectedTable, keyColumn: selectedTableConfig.primaryKey, displayColumn: selectedTableConfig.primaryKey, searchColumns: [], autoFillMappings: [], preventOverwriteWithoutConfirmation: true }), fillEmptyFieldsOnly: event.target.checked } })}
                          />
                          Fill empty fields only
                        </label>
                      </div>
                      <p className="mb-2 mt-4 text-xs text-white/40">Auto-fill mappings, one per line: sourceColumn&gt;targetField or sourceColumn&gt;targetField:readonly</p>
                      <textarea value={mappingText(selectedField)} onChange={(event) => updateField(selectedField.id, { lookup: { ...(selectedField.lookup || { sourceTable: selectedTable, keyColumn: selectedTableConfig.primaryKey, displayColumn: selectedTableConfig.primaryKey, searchColumns: [], fillEmptyFieldsOnly: true, preventOverwriteWithoutConfirmation: true }), autoFillMappings: parseMappings(event.target.value) } })} className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-white" />
                    </div>
                  )}

                  {(selectedField.type === 'formula' || selectedField.type === 'calculated') && (
                    <div className="mt-5 rounded-xl border border-white/10 bg-black/10 p-4">
                      <h3 className="text-sm font-black text-white">Formula Builder</h3>
                      <p className="mb-2 text-xs text-white/40">Use @field references. Supported helpers include IF, ROUND, MIN, MAX, ABS through the local evaluator.</p>
                      <input value={selectedField.formula?.expression || ''} onChange={(event) => updateField(selectedField.id, { formula: { ...(selectedField.formula || {}), expression: event.target.value } })} placeholder="@quantity / @inspectedQuantity * 1000000" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-white" />
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="binding" className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-black text-white">
                      <Link2 className="h-5 w-5 text-[#00A3E0]" /> Data Binding Studio
                    </h2>
                    <p className="mt-1 text-sm text-white/45">
                      Configure “select from one table, then fill matching fields” behavior. Default overwrite behavior is safe: fill empty fields only.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => selectedField && setBindingFieldId(selectedField.id)} disabled={!selectedField}>
                    Use Selected Field
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <h3 className="mb-3 text-sm font-black uppercase tracking-widest text-white/45">Lookup Fields</h3>
                    {draft.fields.length === 0 ? (
                      <p className="text-sm text-white/40">Create fields first, then bind them to master data.</p>
                    ) : (
                      <div className="space-y-2">
                        {draft.fields.map((field) => (
                          <button
                            key={field.id}
                            type="button"
                            onClick={() => setBindingFieldId(field.id)}
                            className={`block w-full rounded-xl border p-3 text-left ${bindingField?.id === field.id ? 'border-[#00A3E0]/40 bg-[#00A3E0]/10' : 'border-white/10 bg-white/5'}`}
                          >
                            <p className="text-sm font-black text-white">{field.label}</p>
                            <p className="mt-1 text-[11px] text-white/40">{field.fieldKey} / {field.type}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    {!bindingField ? (
                      <div className="rounded-xl border border-dashed border-white/10 p-6 text-sm text-white/40">Select a field to configure lookup mapping.</div>
                    ) : (
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                          <label className="space-y-2">
                            <span className="text-xs font-bold text-white/50">1. Source Table</span>
                            <select
                              value={bindingField.lookup?.sourceTable || bindingTable.id}
                              onChange={(event) => {
                                const sourceTable = event.target.value as QualityMasterTableId;
                                updateBindingField({ type: 'lookup', lookup: defaultLookupConfig(sourceTable) });
                              }}
                              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white"
                            >
                              {qualityMasterTableConfigs.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}
                            </select>
                          </label>
                          <label className="space-y-2">
                            <span className="text-xs font-bold text-white/50">2. Key Column</span>
                            <select
                              value={bindingField.lookup?.keyColumn || bindingTable.primaryKey}
                              onChange={(event) => updateBindingField({ type: 'lookup', lookup: { ...(bindingField.lookup || defaultLookupConfig(bindingTable.id)), keyColumn: event.target.value } })}
                              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white"
                            >
                              {bindingTable.fields.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}
                            </select>
                          </label>
                          <label className="space-y-2">
                            <span className="text-xs font-bold text-white/50">3. Display Column</span>
                            <select
                              value={bindingField.lookup?.displayColumn || bindingTable.primaryKey}
                              onChange={(event) => updateBindingField({ type: 'lookup', lookup: { ...(bindingField.lookup || defaultLookupConfig(bindingTable.id)), displayColumn: event.target.value } })}
                              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white"
                            >
                              {bindingTable.fields.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}
                            </select>
                          </label>
                          <label className="space-y-2">
                            <span className="text-xs font-bold text-white/50">5. Overwrite</span>
                            <select
                              value={bindingField.lookup?.overwriteBehavior || 'fill-empty-only'}
                              onChange={(event) => updateBindingField({
                                type: 'lookup',
                                lookup: {
                                  ...(bindingField.lookup || defaultLookupConfig(bindingTable.id)),
                                  overwriteBehavior: event.target.value as QualityLookupOverwriteBehavior,
                                  fillEmptyFieldsOnly: event.target.value === 'fill-empty-only',
                                  preventOverwriteWithoutConfirmation: event.target.value === 'ask-before-overwrite',
                                },
                              })}
                              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white"
                            >
                              <option value="fill-empty-only">Fill empty fields only</option>
                              <option value="read-only-only">Fill read-only mapped fields only</option>
                              <option value="ask-before-overwrite">Ask before overwrite</option>
                              <option value="always-overwrite">Always overwrite</option>
                            </select>
                          </label>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <h3 className="text-sm font-black text-white">4. Auto-Fill Mappings</h3>
                              <p className="text-xs text-white/40">{bindingRowsCount} active local rows available from {bindingTable.name}.</p>
                            </div>
                            <Button variant="outline" onClick={addAutoFillMapping} disabled={!manageAccess.allowed}>Add Mapping</Button>
                          </div>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <select value={mappingSourceColumn} onChange={(event) => setMappingSourceColumn(event.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white">
                              <option value="">Source column</option>
                              {bindingTable.fields.map((field) => <option key={field.key} value={field.key}>{field.label} ({field.key})</option>)}
                            </select>
                            <select value={mappingTargetField} onChange={(event) => setMappingTargetField(event.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white">
                              <option value="">Target form field</option>
                              {draft.fields.filter((field) => field.id !== bindingField.id).map((field) => <option key={field.id} value={field.fieldKey}>{field.label} ({field.fieldKey})</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <h3 className="text-sm font-black text-white">Lookup Test</h3>
                              <p className="text-xs text-white/40">Select a real source value and preview the row and auto-fill outcome before publishing.</p>
                            </div>
                            <Button variant="outline" onClick={runLookupTest} disabled={!bindingField.lookup || !manageAccess.allowed}>Test Lookup</Button>
                          </div>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                            <select value={lookupTestValue} onChange={(event) => setLookupTestValue(event.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white">
                              <option value="">Select test value from {bindingTable.name}</option>
                              {bindingRows.slice(0, 300).map((row) => {
                                const key = bindingField.lookup?.keyColumn || bindingTable.primaryKey;
                                const display = bindingField.lookup?.displayColumn || key;
                                const value = String(row[key] ?? row.id ?? '');
                                const label = [row[display], row[key]].filter(Boolean).map(String).filter((item, index, array) => array.indexOf(item) === index).join(' - ');
                                return value ? <option key={`${row.id}-${value}`} value={value}>{label || value}</option> : null;
                              })}
                            </select>
                            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-xs text-white/50">
                              Overwrite: {bindingField.lookup?.overwriteBehavior || 'fill-empty-only'}
                            </div>
                          </div>
                          {lookupTestResult && (
                            <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                              <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                                <p className="mb-2 text-xs font-black uppercase tracking-widest text-white/40">Resolved Source Row</p>
                                {lookupTestResult.row ? (
                                  <div className="max-h-48 overflow-auto text-xs text-white/55">
                                    {Object.entries(lookupTestResult.row).slice(0, 18).map(([key, value]) => (
                                      <p key={key}><span className="text-white/35">{key}:</span> {String(value ?? '')}</p>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-amber-300">No matching source row found.</p>
                                )}
                              </div>
                              <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                                <p className="mb-2 text-xs font-black uppercase tracking-widest text-white/40">Auto-Fill Preview</p>
                                {lookupTestResult.preview.length === 0 ? (
                                  <p className="text-xs text-white/35">No mappings configured.</p>
                                ) : lookupTestResult.preview.map((item) => (
                                  <p key={`${item.sourceColumn}-${item.targetField}`} className={`text-xs ${item.status === 'valid' ? 'text-emerald-200' : item.status === 'warning' ? 'text-amber-200' : 'text-red-200'}`}>
                                    {item.targetField} from {item.sourceColumn} = {item.value || 'empty'} {item.warning ? `(${item.warning})` : ''}
                                  </p>
                                ))}
                                {lookupTestResult.warnings.map((warning) => <p key={warning} className="mt-1 text-xs text-amber-300">{warning}</p>)}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <h3 className="mb-3 text-sm font-black text-white">Readable Auto-Fill Rules</h3>
                          {!(bindingField.lookup?.autoFillMappings?.length) ? (
                            <p className="text-sm text-white/40">No mappings yet. Add mappings so the lookup can fill related fields.</p>
                          ) : (
                            <div className="space-y-2">
                              {(bindingField.lookup?.autoFillMappings || []).map((mapping, index) => {
                                const sourceValid = bindingTable.fields.some((field) => field.key === mapping.sourceColumn);
                                const targetValid = draft.fields.some((field) => field.fieldKey === mapping.targetField);
                                const valid = sourceValid && targetValid;
                                return (
                                <div key={`${mapping.sourceColumn}-${mapping.targetField}-${index}`} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/10 p-3 md:flex-row md:items-center md:justify-between">
                                  <div>
                                    <p className="text-sm text-white/65">
                                      When <b className="text-white">{bindingField.fieldKey}</b> is selected from <b className="text-white">{bindingTable.name}</b>, fill <b className="text-white">{mapping.targetField}</b> from <b className="text-white">{mapping.sourceColumn}</b>.
                                    </p>
                                    <p className={`mt-1 text-xs ${valid ? 'text-emerald-300' : 'text-red-300'}`}>
                                      {valid ? `Valid mapping / overwrite: ${bindingField.lookup?.overwriteBehavior || 'fill-empty-only'}` : `Broken mapping${!sourceValid ? ' / missing source column' : ''}${!targetValid ? ' / missing target field' : ''}`}
                                    </p>
                                  </div>
                                  <button type="button" onClick={() => removeAutoFillMapping(index)} className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-black text-red-200">
                                    Delete
                                  </button>
                                </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="mb-4 text-lg font-black text-white">Field Dependency Map</h2>
                {dependencyMap.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-white/40">No lookup or formula dependencies yet.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {dependencyMap.map((item, index) => (
                      <div key={`${item.source}-${item.target}-${index}`} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                        <p className="text-sm font-black text-white">{item.label}</p>
                        <p className="mt-1 text-xs text-white/40">{item.type} / {item.detail}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="formulas" className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <Calculator className="h-5 w-5 text-[#00A3E0]" />
                  <div>
                    <h2 className="text-lg font-black text-white">Formula Builder & Test Sandbox</h2>
                    <p className="text-sm text-white/45">Build formulas visually, enter sample values, and verify result preview before publishing.</p>
                  </div>
                </div>

                {formulaFields.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-white/40">
                    No formula/calculated fields yet. Add a field with type formula or calculated from the Fields tab.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="space-y-2">
                      {formulaFields.map((field) => (
                        <button
                          key={field.id}
                          type="button"
                          onClick={() => setFormulaFieldId(field.id)}
                          className={`block w-full rounded-xl border p-3 text-left ${formulaField?.id === field.id ? 'border-[#00A3E0]/40 bg-[#00A3E0]/10' : 'border-white/10 bg-black/10'}`}
                        >
                          <p className="text-sm font-black text-white">{field.label}</p>
                          <p className="mt-1 text-xs text-white/40">{field.fieldKey}</p>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                        <h3 className="text-sm font-black text-white">Formula Library</h3>
                        <p className="mb-3 mt-1 text-xs text-white/40">Choose a common quality formula. You can edit field references if your template uses different names.</p>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                          <select value={selectedFormulaPreset} onChange={(event) => setSelectedFormulaPreset(event.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white">
                            <option value="">Select formula preset</option>
                            {formulaPresets.map((preset) => <option key={preset.name} value={preset.name}>{preset.name} - {preset.expression}</option>)}
                          </select>
                          <Button variant="outline" onClick={applyFormulaPreset} disabled={!selectedFormulaPreset || !manageAccess.allowed}>Apply Preset</Button>
                        </div>
                        {selectedFormulaPreset && (
                          <p className="mt-2 text-xs text-white/40">
                            Required references: {formulaPresets.find((item) => item.name === selectedFormulaPreset)?.fields.map((field) => draft.fields.some((item) => item.fieldKey === field) ? field : `${field} (missing)`).join(', ')}
                          </p>
                        )}
                      </div>
                      <textarea
                        value={formulaField?.formula?.expression || ''}
                        onChange={(event) => updateFormulaExpression(event.target.value)}
                        placeholder="@quantity / @inspectedQuantity * 1000000"
                        rows={3}
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-sm text-white"
                      />
                      <div className="flex flex-wrap gap-2">
                        {draft.fields.filter((field) => field.id !== formulaField?.id).slice(0, 12).map((field) => (
                          <button key={field.id} type="button" onClick={() => insertFormulaToken(` @${field.fieldKey} `)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/60">
                            @{field.fieldKey}
                          </button>
                        ))}
                        {[' + ', ' - ', ' * ', ' / ', 'ROUND(', 'IF(', 'MIN(', 'MAX(', 'ABS('].map((token) => (
                          <button key={token} type="button" onClick={() => insertFormulaToken(token)} className="rounded-lg border border-[#00A3E0]/20 bg-[#00A3E0]/10 px-3 py-2 text-xs font-black text-[#8be3ff]">
                            {token.trim() || token}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {formulaTest.variables.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-white/40">Use @field references to test with sample values.</div>
                        ) : formulaTest.variables.map((variable) => (
                          <label key={variable} className="space-y-2">
                            <span className="text-xs font-bold text-white/50">{fieldLabel(draft.fields, variable)} sample</span>
                            <input
                              value={formulaSamples[variable] || ''}
                              onChange={(event) => setFormulaSamples((prev) => ({ ...prev, [variable]: event.target.value }))}
                              placeholder="0"
                              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-white"
                            />
                          </label>
                        ))}
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <p className={`text-sm font-black ${formulaTest.syntax.valid && formulaTest.missingFields.length === 0 && !formulaTest.invalidResult ? 'text-emerald-300' : 'text-red-300'}`}>
                            {formulaTest.syntax.valid && formulaTest.missingFields.length === 0 && !formulaTest.invalidResult ? 'Formula valid' : `Formula needs review: ${formulaTest.syntax.error || formulaTest.missingFields.join(', ') || 'invalid result'}`}
                          </p>
                          <Button variant="outline" size="sm" onClick={runFormulaTest} disabled={!manageAccess.allowed}>Test Formula</Button>
                        </div>
                        {formulaTest.missingSampleValues.length > 0 && <p className="mt-2 text-sm text-amber-300">Missing sample values: {formulaTest.missingSampleValues.join(', ')}</p>}
                        {formulaTest.divideByZeroFields.length > 0 && <p className="mt-2 text-sm text-amber-300">Divide by zero warning: {formulaTest.divideByZeroFields.join(', ')}</p>}
                        {formulaTest.nonFiniteResult && <p className="mt-2 text-sm text-amber-300">Non-finite result warning. Check divisor fields and numeric inputs.</p>}
                        {formulaTest.invalidResult && <p className="mt-2 text-sm text-red-300">Invalid formula result. Review syntax and referenced fields.</p>}
                        <p className="mt-3 text-sm text-white/55">Result preview: <b className="text-white">{String(formulaTest.result ?? '---')}</b></p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="rules" className="space-y-4">
              <div className="flex justify-between">
                <h2 className="text-lg font-black text-white">Conditional Rule Builder</h2>
                <Button variant="outline" onClick={addRule} disabled={!manageAccess.allowed}><GitBranch className="mr-2 h-4 w-4" /> Add Rule</Button>
              </div>
              {draft.rules.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-white/45">No rules yet. Rules are evaluated locally by the dynamic renderer where compatible.</div>
              ) : draft.rules.map((rule) => (
                <div key={rule.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                    <select value={rule.sourceField} onChange={(event) => updateRule(rule.id, { sourceField: event.target.value })} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white">
                      {draft.fields.map((field) => <option key={field.id} value={field.fieldKey}>{field.label}</option>)}
                    </select>
                    <select value={rule.operator} onChange={(event) => updateRule(rule.id, { operator: event.target.value as QualityRuleOperator })} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white">
                      {operators.map((operator) => <option key={operator} value={operator}>{operator}</option>)}
                    </select>
                    <input value={String(rule.value || '')} onChange={(event) => updateRule(rule.id, { value: event.target.value })} placeholder="Value" className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white" />
                    <select value={rule.action} onChange={(event) => updateRule(rule.id, { action: event.target.value as QualityRuleActionType })} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white">
                      {actions.map((action) => <option key={action} value={action}>{action}</option>)}
                    </select>
                    <select value={rule.targetField || ''} onChange={(event) => updateRule(rule.id, { targetField: event.target.value })} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white">
                      {draft.fields.map((field) => <option key={field.id} value={field.fieldKey}>{field.label}</option>)}
                    </select>
                  </div>
                  <input value={rule.warningMessage || ''} onChange={(event) => updateRule(rule.id, { warningMessage: event.target.value })} placeholder="Safe warning or helper wording" className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white" />
                  <div className="mt-3 rounded-xl border border-[#00A3E0]/20 bg-[#00A3E0]/10 p-3 text-sm text-[#8be3ff]">
                    {ruleSummary(rule, draft.fields)}
                  </div>
                </div>
              ))}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-black text-white">Conditional Logic Live Preview</h2>
                <p className="mt-1 text-sm text-white/45">Enter sample values and review which fields become shown, hidden, required, or warning-triggered.</p>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {draft.fields.slice(0, 12).map((field) => (
                    <label key={field.id} className="space-y-2">
                      <span className="text-xs font-bold text-white/50">{field.label}</span>
                      <input
                        value={conditionalSamples[field.fieldKey] || ''}
                        onChange={(event) => setConditionalSamples((prev) => ({ ...prev, [field.fieldKey]: event.target.value }))}
                        placeholder={field.fieldKey}
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white"
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                    <p className="text-xs font-black uppercase tracking-widest text-white/35">Shown</p>
                    <p className="mt-2 text-xs text-white/55">{conditionalPreview.shown.slice(0, 12).join(', ') || 'None'}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                    <p className="text-xs font-black uppercase tracking-widest text-white/35">Hidden</p>
                    <p className="mt-2 text-xs text-white/55">{conditionalPreview.hidden.slice(0, 12).join(', ') || 'None'}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                    <p className="text-xs font-black uppercase tracking-widest text-white/35">Required</p>
                    <p className="mt-2 text-xs text-white/55">{conditionalPreview.required.slice(0, 12).join(', ') || 'None'}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                    <p className="text-xs font-black uppercase tracking-widest text-white/35">Warnings</p>
                    <p className="mt-2 text-xs text-amber-200">{conditionalPreview.warnings.slice(0, 6).join(' | ') || 'None'}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="visibility" className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="mb-2 text-lg font-black text-white">Role Visibility Summary</h2>
                <p className="mb-4 text-sm text-white/45">Fine tune field-level role controls in the Fields tab. This view helps non-developers review who can see or edit each field.</p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-widest text-white/35">
                      <tr>{['Field', 'Visible To', 'Editable By', 'Create', 'Edit', 'Detail'].map((header) => <th key={header} className="px-3 py-3">{header}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {draft.fields.map((field) => (
                        <tr key={field.id} className="text-white/60">
                          <td className="px-3 py-3 font-black text-white">{field.label}<br /><span className="text-xs font-normal text-white/35">{field.fieldKey}</span></td>
                          <td className="px-3 py-3">{field.roleVisibility?.visibleTo?.length ? field.roleVisibility.visibleTo.map(roleLabel).join(', ') : 'All roles'}</td>
                          <td className="px-3 py-3">{field.roleVisibility?.editableBy?.length ? field.roleVisibility.editableBy.map(roleLabel).join(', ') : 'All visible roles'}</td>
                          <td className="px-3 py-3">{field.modeVisibility?.create === false ? 'Hidden' : 'Visible'}</td>
                          <td className="px-3 py-3">{field.modeVisibility?.edit === false ? 'Hidden' : 'Visible'}</td>
                          <td className="px-3 py-3">{field.modeVisibility?.detail === false ? 'Hidden' : 'Visible'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h2 className="text-lg font-black text-white">Dashboard Readiness Panel</h2>
                  <p className="mt-1 text-sm text-white/45">Checks whether this form captures the fields needed by core dashboards and analytics.</p>
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {dashboardReadiness.map((item) => (
                      <div key={item.name} className="rounded-xl border border-white/10 bg-black/10 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-black text-white">{item.name}</p>
                          <span className={`rounded-full border px-2 py-1 text-xs font-black ${item.score >= 80 ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : item.score >= 50 ? 'border-amber-400/20 bg-amber-400/10 text-amber-200' : 'border-red-400/20 bg-red-500/10 text-red-200'}`}>
                            {item.score}%
                          </span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-[#00A3E0]" style={{ width: `${item.score}%` }} />
                        </div>
                        <p className="mt-3 text-xs text-white/45">Missing required: {item.missingRequired.join(', ') || 'None'}</p>
                        <p className="mt-1 text-xs text-white/35">Optional missing: {item.missingOptional.join(', ') || 'None'}</p>
                        {item.missingRequired.length > 0 && <p className="mt-2 text-xs text-amber-300">Impact: {item.impact}</p>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h2 className="text-lg font-black text-white">Form Complexity Score</h2>
                  <p className={`mt-3 text-4xl font-black ${complexity.level === 'Low' ? 'text-emerald-300' : complexity.level === 'Medium' ? 'text-amber-300' : 'text-red-300'}`}>{complexity.level}</p>
                  <p className="text-xs text-white/40">Score: {complexity.score} / Fields: {draft.fields.length} / Required: {complexity.required} / Lookup: {complexity.lookup} / Formula: {complexity.formula}</p>
                  <div className="mt-4 space-y-2">
                    {complexity.recommendations.map((item) => <p key={item} className="text-xs text-white/55">{item}</p>)}
                  </div>
                  <Button variant="outline" onClick={createCompactVersion} disabled={!manageAccess.allowed} className="mt-4 w-full">
                    <Smartphone className="mr-2 h-4 w-4" /> Create Compact Version
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h2 className="mb-2 text-lg font-black text-white">Preview & Publish Checklist</h2>
                  <p className="text-sm text-white/45">Validate the template before publishing. Existing local templates stay compatible; new binding fields are optional.</p>
                  <div className="mt-4 space-y-2">
                    {publishChecklist.items.map((item) => (
                      <div key={item.label} className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-black/10 p-3">
                        <div>
                          <p className="text-sm font-black text-white">{item.label}</p>
                          {item.detail && <p className="text-xs text-white/40">{item.detail}</p>}
                        </div>
                        <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${item.ok ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : item.critical ? 'border-red-400/20 bg-red-500/10 text-red-200' : 'border-amber-400/20 bg-amber-400/10 text-amber-200'}`}>
                          {item.ok ? 'OK' : item.critical ? 'Blocker' : 'Warning'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white/40">Publish Controls</h3>
                  <textarea
                    value={publishNote}
                    onChange={(event) => setPublishNote(event.target.value)}
                    placeholder="Version notes: what changed and why?"
                    className="mt-4 min-h-24 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white"
                  />
                  <Button variant="outline" onClick={runPublishChecklist} disabled={!manageAccess.allowed} className="mt-3 w-full rounded-xl">
                    Run Checklist
                  </Button>
                  <Button onClick={publishTemplate} disabled={!manageAccess.allowed || publishChecklist.criticalErrors.length > 0} className="mt-3 w-full rounded-xl">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Publish Template
                  </Button>
                  <p className="mt-3 text-xs text-white/40">Only critical errors block publishing. Warnings stay visible for pilot governance.</p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Eye className="h-5 w-5 text-[#00A3E0]" />
                  <span className="text-sm font-black uppercase tracking-widest text-white/50">Preview As</span>
                  <select value={previewRole} onChange={(event) => setPreviewRole(event.target.value as QualityWorkflowRole)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white">
                    {QUALITY_WORKFLOW_ROLES.filter((role) => ['ADMIN', 'QUALITY_MANAGER', 'QUALITY_SUPERVISOR', 'QUALITY_ENGINEER', 'INSPECTOR', 'OPERATOR'].includes(role)).map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}
                  </select>
                  <select value={previewMode} onChange={(event) => setPreviewMode(event.target.value as QualityFormMode)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white">
                    {['create', 'edit', 'detail', 'mobile'].map((mode) => <option key={mode} value={mode}>{mode}</option>)}
                  </select>
                  <button type="button" onClick={() => setMobilePreviewChecked(true)} className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-200">
                    Mark Mobile Preview Checked
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div className="rounded-xl border border-white/10 bg-black/10 p-3"><p className="text-xs text-white/35">Visible fields</p><p className="text-2xl font-black text-white">{mobilePreview.visibleFields.length}</p></div>
                  <div className="rounded-xl border border-white/10 bg-black/10 p-3"><p className="text-xs text-white/35">Required fields</p><p className="text-2xl font-black text-white">{mobilePreview.requiredFields.length}</p></div>
                  <div className="rounded-xl border border-white/10 bg-black/10 p-3"><p className="text-xs text-white/35">Hidden by role</p><p className="text-2xl font-black text-white">{mobilePreview.hiddenByRole}</p></div>
                  <div className="rounded-xl border border-white/10 bg-black/10 p-3"><p className="text-xs text-white/35">Preview checked</p><p className="text-lg font-black text-white">{mobilePreviewChecked ? 'Yes' : 'No'}</p></div>
                </div>
                {mobilePreview.warnings.length > 0 && (
                  <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3">
                    {mobilePreview.warnings.map((warning) => <p key={warning} className="text-xs text-amber-200">{warning}</p>)}
                  </div>
                )}
              </div>
              <DynamicFormRenderer
                config={dynamicPreview}
                readOnly={previewMode === 'detail'}
                showSubmitButton={false}
                qualityTemplateContext={{ role: previewRole, mode: previewMode }}
              />
            </TabsContent>

            <TabsContent value="governance" className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-white"><Settings2 className="h-5 w-5 text-[#00A3E0]" /> Validation & Governance</h2>
                {validation.errors.length === 0 && validation.warnings.length === 0 ? (
                  <p className="text-sm text-emerald-300">Template is ready for local decision-support use.</p>
                ) : (
                  <div className="space-y-2">
                    {validation.errors.map((error) => <p key={error} className="text-sm text-red-300">{error}</p>)}
                    {validation.warnings.map((warning) => <p key={warning} className="text-sm text-amber-300">{warning}</p>)}
                  </div>
                )}
                <p className="mt-4 text-sm text-white/45">
                  Publishing changes the active renderer configuration for matching records. Existing saved defects keep their saved formTemplateId and formTemplateVersion for traceability.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="mb-3 text-lg font-black text-white">Rollback History</h2>
                {draft.history?.length ? (
                  <div className="space-y-2">
                    {draft.history.slice().reverse().map((item) => (
                      <div key={`${item.version}-${item.createdAt}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                        <div>
                          <p className="text-sm font-black text-white">Version {item.version}</p>
                          <p className="text-xs text-white/40">{item.note} / {new Date(item.createdAt).toLocaleString()}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => rollback(item.version)} disabled={!manageAccess.allowed}>Rollback</Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/45">No published history yet.</p>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="mb-2 flex items-center gap-2 text-lg font-black text-white"><FileJson className="h-5 w-5 text-[#00A3E0]" /> Storage</h2>
                <p className="text-sm text-white/50">Templates are stored locally in <code>{QUALITY_FORM_TEMPLATES_KEY}</code>. Backups include this key when Form Templates are selected.</p>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </PageContainer>
  );
}
