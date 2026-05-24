import type {
  ConditionalRule,
  DynamicField,
  DynamicForm,
  FieldOption,
  FieldType,
  FormSection,
} from '@/stores/configStore';
import {
  loadQualityMasterTable,
  qualityMasterTableConfigs,
  type QualityMasterTableId,
} from '@/services/qualityMasterData';
import {
  buildLocalWorkflowUser,
  loadLocalWorkflowRole,
  roleLabel,
  type QualityWorkflowRole,
} from '@/services/defectWorkflowGovernance';
import { enqueueQualitySyncItem } from '@/services/qualitySyncQueue';
import { FormulaEvaluator } from '@/utils/formulaEvaluator';

export const QUALITY_FORM_TEMPLATES_KEY = 'qms_quality_form_templates_v1';

export type QualityFormTemplateStatus = 'draft' | 'active' | 'archived';
export type QualityFormEntityType = 'defect-log' | 'quality-form' | 'ncr' | 'capa' | 'eight-d' | 'custom';
export type QualityFormMode = 'create' | 'edit' | 'detail' | 'mobile';
export type QualityDesignerFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'time'
  | 'select'
  | 'multi-select'
  | 'lookup'
  | 'barcode'
  | 'textarea'
  | 'boolean'
  | 'attachment'
  | 'image'
  | 'calculated'
  | 'formula'
  | 'user'
  | 'status'
  | 'linked-record';

export type QualityRuleOperator =
  | 'equals'
  | 'not equals'
  | 'greater than'
  | 'less than'
  | 'contains'
  | 'in list'
  | 'is empty'
  | 'is not empty';

export type QualityRuleActionType =
  | 'show field'
  | 'hide field'
  | 'require field'
  | 'make read-only'
  | 'set default value'
  | 'show warning'
  | 'suggest NCR'
  | 'route dashboard'
  | 'calculate value';

export interface QualityFormSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  collapsible?: boolean;
  collapsedByDefault?: boolean;
}

export interface QualityLookupMapping {
  sourceColumn: string;
  targetField: string;
  readOnly?: boolean;
}

export type QualityLookupOverwriteBehavior =
  | 'fill-empty-only'
  | 'read-only-only'
  | 'ask-before-overwrite'
  | 'always-overwrite';

export interface QualityLookupConfig {
  sourceTable: QualityMasterTableId;
  keyColumn: string;
  displayColumn: string;
  searchColumns: string[];
  autoFillMappings: QualityLookupMapping[];
  fillEmptyFieldsOnly: boolean;
  preventOverwriteWithoutConfirmation: boolean;
  overwriteBehavior?: QualityLookupOverwriteBehavior;
}

export interface QualityFormulaConfig {
  expression: string;
  precision?: number;
}

export interface QualityFieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface QualityRoleFieldControl {
  visibleTo: QualityWorkflowRole[];
  editableBy: QualityWorkflowRole[];
}

export interface QualityModeVisibility {
  create: boolean;
  edit: boolean;
  detail: boolean;
}

export interface QualityFormField {
  id: string;
  fieldKey: string;
  label: string;
  type: QualityDesignerFieldType;
  sectionId: string;
  order: number;
  required: boolean;
  readOnly: boolean;
  hidden: boolean;
  defaultValue?: unknown;
  placeholder?: string;
  helperText?: string;
  validation?: QualityFieldValidation;
  options?: FieldOption[];
  roleVisibility?: QualityRoleFieldControl;
  modeVisibility?: QualityModeVisibility;
  lookup?: QualityLookupConfig;
  formula?: QualityFormulaConfig;
}

export interface QualityConditionalRule {
  id: string;
  sourceField: string;
  operator: QualityRuleOperator;
  value?: unknown;
  action: QualityRuleActionType;
  targetField?: string;
  setValue?: unknown;
  warningMessage?: string;
  dashboardRoute?: string;
}

export interface QualityFormTemplateVersionSnapshot {
  version: number;
  status: QualityFormTemplateStatus;
  sections: QualityFormSection[];
  fields: QualityFormField[];
  rules: QualityConditionalRule[];
  createdAt: string;
  note: string;
}

export interface QualityFormTemplate {
  id: string;
  name: string;
  description: string;
  entityType: QualityFormEntityType;
  recordType?: string;
  applicableFactory?: string;
  applicableWorkshop?: string;
  applicableLine?: string;
  applicableInspectionPoint?: string;
  applicableProduct?: string;
  applicableModel?: string;
  version: number;
  status: QualityFormTemplateStatus;
  sections: QualityFormSection[];
  fields: QualityFormField[];
  rules: QualityConditionalRule[];
  history?: QualityFormTemplateVersionSnapshot[];
  createdAt: string;
  updatedAt: string;
}

export interface ActiveQualityFormContext {
  entityType?: string;
  recordType?: string;
  factory?: string;
  workshop?: string;
  line?: string;
  inspectionPoint?: string;
  product?: string;
  model?: string;
}

export interface QualityFormValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

const managerRoles: QualityWorkflowRole[] = ['SYSTEM', 'ADMIN', 'QUALITY_MANAGER', 'QUALITY_SUPERVISOR'];

function nowIso(): string {
  return new Date().toISOString();
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readTemplates(): QualityFormTemplate[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUALITY_FORM_TEMPLATES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeTemplate) : [];
  } catch {
    return [];
  }
}

function writeTemplates(templates: QualityFormTemplate[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(QUALITY_FORM_TEMPLATES_KEY, JSON.stringify(templates));
}

function normalizeTemplate(input: Partial<QualityFormTemplate>): QualityFormTemplate {
  const createdAt = input.createdAt || nowIso();
  return {
    id: input.id || newId('form-template'),
    name: input.name || 'Untitled Quality Form',
    description: input.description || '',
    entityType: input.entityType || 'defect-log',
    recordType: input.recordType || '',
    applicableFactory: input.applicableFactory || '',
    applicableWorkshop: input.applicableWorkshop || '',
    applicableLine: input.applicableLine || '',
    applicableInspectionPoint: input.applicableInspectionPoint || '',
    applicableProduct: input.applicableProduct || '',
    applicableModel: input.applicableModel || '',
    version: Number(input.version || 1),
    status: input.status || 'draft',
    sections: Array.isArray(input.sections) ? input.sections : [],
    fields: Array.isArray(input.fields) ? input.fields : [],
    rules: Array.isArray(input.rules) ? input.rules : [],
    history: Array.isArray(input.history) ? input.history : [],
    createdAt,
    updatedAt: input.updatedAt || createdAt,
  };
}

function snapshotTemplate(template: QualityFormTemplate, note: string): QualityFormTemplateVersionSnapshot {
  return {
    version: template.version,
    status: template.status,
    sections: template.sections,
    fields: template.fields,
    rules: template.rules,
    createdAt: nowIso(),
    note,
  };
}

function enqueueTemplate(operation: 'create-form-template' | 'update-form-template' | 'publish-form-template' | 'archive-form-template' | 'import-form-template' | 'export-form-template', template: QualityFormTemplate, summary: string): void {
  enqueueQualitySyncItem({
    entityType: 'form-templates',
    entityId: template.id,
    operation,
    payloadSummary: summary,
  });
}

function fieldTypeToDynamic(type: QualityDesignerFieldType): FieldType {
  const map: Record<QualityDesignerFieldType, FieldType> = {
    text: 'text',
    number: 'number',
    date: 'date',
    time: 'text',
    select: 'select',
    'multi-select': 'multiselect',
    lookup: 'select',
    barcode: 'barcode',
    textarea: 'textarea',
    boolean: 'checkbox',
    attachment: 'file',
    image: 'file',
    calculated: 'formula',
    formula: 'formula',
    user: 'text',
    status: 'select',
    'linked-record': 'relation',
  };
  return map[type] || 'text';
}

function toDynamicOperator(operator: QualityRuleOperator): ConditionalRule['operator'] {
  const map: Record<QualityRuleOperator, ConditionalRule['operator']> = {
    equals: 'equals',
    'not equals': 'notEquals',
    'greater than': 'greaterThan',
    'less than': 'lessThan',
    contains: 'contains',
    'in list': 'contains',
    'is empty': 'isEmpty',
    'is not empty': 'isNotEmpty',
  };
  return map[operator] || 'equals';
}

function toDynamicAction(action: QualityRuleActionType): ConditionalRule['action'] | null {
  if (action === 'show field') return 'show';
  if (action === 'hide field') return 'hide';
  if (action === 'require field') return 'require';
  if (action === 'make read-only') return 'disable';
  return null;
}

function lookupOptions(field: QualityFormField): FieldOption[] | undefined {
  if (field.type !== 'lookup' || !field.lookup) return field.options;
  const rows = loadQualityMasterTable(field.lookup.sourceTable).filter((row) => row.isActive !== false);
  const key = field.lookup.keyColumn;
  const display = field.lookup.displayColumn;
  return rows.slice(0, 500).map((row) => {
    const value = String(row[key] ?? row[display] ?? row.id ?? '');
    const label = [row[display], row[key]].filter(Boolean).map(String).filter((item, index, array) => array.indexOf(item) === index).join(' - ');
    return { value, label: label || value };
  }).filter((item) => item.value);
}

function qualityFieldToDynamic(field: QualityFormField, rules: QualityConditionalRule[]): DynamicField {
  const conditionalLogic: ConditionalRule[] = rules
    .filter((rule) => rule.targetField === field.fieldKey)
    .map((rule) => {
      const action = toDynamicAction(rule.action);
      if (!action) return null;
      return {
        field: rule.sourceField,
        operator: toDynamicOperator(rule.operator),
        value: rule.value,
        action,
      };
    })
    .filter((rule): rule is ConditionalRule => Boolean(rule));

  const dynamicType = fieldTypeToDynamic(field.type);
  const formulaExpression = field.formula?.expression || (field.type === 'calculated' ? String(field.defaultValue || '') : '');
  const variables = formulaExpression ? FormulaEvaluator.extractVariables(formulaExpression) : [];

  return {
    id: field.id,
    name: field.fieldKey,
    label: field.label,
    type: dynamicType,
    description: field.helperText,
    placeholder: field.placeholder,
    defaultValue: field.defaultValue,
    options: field.type === 'lookup' ? lookupOptions(field) : field.options,
    validation: {
      required: field.required,
      min: field.validation?.min,
      max: field.validation?.max,
      minLength: field.validation?.minLength,
      maxLength: field.validation?.maxLength,
      pattern: field.validation?.pattern,
    },
    conditionalLogic,
    visible: !field.hidden,
    editable: !field.readOnly && field.type !== 'calculated' && field.type !== 'formula',
    order: field.order,
    section: field.sectionId,
    helpText: field.helperText,
    formula: formulaExpression ? { expression: formulaExpression, variables, precision: field.formula?.precision } : undefined,
    qualityLookup: field.lookup ? {
      sourceTable: field.lookup.sourceTable,
      keyColumn: field.lookup.keyColumn,
      displayColumn: field.lookup.displayColumn,
      searchColumns: field.lookup.searchColumns,
      autoFillMappings: (field.lookup.autoFillMappings || []).map((mapping) => ({
        sourceColumn: mapping.sourceColumn,
        targetField: mapping.targetField,
        readOnly: mapping.readOnly,
      })),
      fillEmptyOnly: field.lookup.fillEmptyFieldsOnly,
      overwriteBehavior: field.lookup.overwriteBehavior || (field.lookup.fillEmptyFieldsOnly ? 'fill-empty-only' : 'ask-before-overwrite'),
    } : undefined,
    roleVisibility: field.roleVisibility ? {
      visibleTo: field.roleVisibility.visibleTo,
      editableBy: field.roleVisibility.editableBy,
    } : undefined,
    modeVisibility: field.modeVisibility ? {
      create: field.modeVisibility.create,
      edit: field.modeVisibility.edit,
      detail: field.modeVisibility.detail,
    } : undefined,
  };
}

export function loadQualityFormTemplates(): QualityFormTemplate[] {
  return readTemplates().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function saveQualityFormTemplates(templates: QualityFormTemplate[]): void {
  writeTemplates(templates.map(normalizeTemplate));
}

export function validateQualityFormTemplate(template: QualityFormTemplate): QualityFormValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!template.name.trim()) errors.push('Template name is required.');
  if (template.sections.length === 0) errors.push('At least one section is required.');
  if (template.fields.length === 0) errors.push('At least one field is required.');

  const fieldKeys = template.fields.map((field) => field.fieldKey.trim()).filter(Boolean);
  const duplicateFieldKeys = fieldKeys.filter((key, index) => fieldKeys.indexOf(key) !== index);
  if (duplicateFieldKeys.length) errors.push(`Duplicate field keys: ${[...new Set(duplicateFieldKeys)].join(', ')}.`);

  template.fields.forEach((field) => {
    if (!field.fieldKey.trim()) errors.push(`Field "${field.label || field.id}" needs a field key.`);
    if (!field.label.trim()) warnings.push(`Field "${field.fieldKey}" has no label.`);
    if ((field.type === 'formula' || field.type === 'calculated') && !field.formula?.expression) {
      warnings.push(`Formula field "${field.label}" has no expression.`);
    }
    if (field.formula?.expression) {
      const formulaValidation = FormulaEvaluator.validate(field.formula.expression);
      if (!formulaValidation.valid) errors.push(`Formula field "${field.label}" is invalid: ${formulaValidation.error || 'syntax error'}.`);
      FormulaEvaluator.extractVariables(field.formula.expression).forEach((reference) => {
        if (!template.fields.some((candidate) => candidate.fieldKey === reference)) {
          errors.push(`Formula field "${field.label}" references missing field "${reference}".`);
        }
      });
    }
    if (field.lookup) {
      const config = qualityMasterTableConfigs.find((table) => table.id === field.lookup?.sourceTable);
      if (!config) errors.push(`Lookup field "${field.label}" uses an unsupported master table.`);
      if (!field.lookup.keyColumn) errors.push(`Lookup field "${field.label}" needs a key column.`);
      if (!field.lookup.displayColumn) warnings.push(`Lookup field "${field.label}" has no display column.`);
      if (config && field.lookup.keyColumn && !config.fields.some((sourceField) => sourceField.key === field.lookup?.keyColumn)) {
        errors.push(`Lookup field "${field.label}" key column "${field.lookup.keyColumn}" does not exist in ${config.name}.`);
      }
      if (config && field.lookup.displayColumn && !config.fields.some((sourceField) => sourceField.key === field.lookup?.displayColumn)) {
        warnings.push(`Lookup field "${field.label}" display column "${field.lookup.displayColumn}" does not exist in ${config.name}.`);
      }
      field.lookup.autoFillMappings?.forEach((mapping) => {
        if (config && !config.fields.some((sourceField) => sourceField.key === mapping.sourceColumn)) {
          errors.push(`Auto-fill source "${mapping.sourceColumn}" in "${field.label}" does not exist in ${config.name}.`);
        }
        if (!template.fields.some((target) => target.fieldKey === mapping.targetField)) {
          errors.push(`Auto-fill target "${mapping.targetField}" in "${field.label}" is not a template field.`);
        }
      });
    }
  });

  template.rules.forEach((rule) => {
    if (!template.fields.some((field) => field.fieldKey === rule.sourceField)) {
      errors.push(`Conditional rule "${rule.id}" references missing source field "${rule.sourceField}".`);
    }
    if (rule.targetField && !template.fields.some((field) => field.fieldKey === rule.targetField)) {
      errors.push(`Conditional rule "${rule.id}" references missing target field "${rule.targetField}".`);
    }
  });

  if (template.entityType === 'defect-log') {
    const keys = new Set(template.fields.map((field) => field.fieldKey));
    ['date', 'defectType', 'quantity'].forEach((coreField) => {
      if (!keys.has(coreField)) warnings.push(`Core dashboard field "${coreField}" is missing. Dashboards may have weaker data.`);
    });
  }

  const dependencyGraph = new Map<string, string[]>();
  template.fields.forEach((field) => {
    field.lookup?.autoFillMappings?.forEach((mapping) => {
      dependencyGraph.set(field.fieldKey, [...(dependencyGraph.get(field.fieldKey) || []), mapping.targetField]);
    });
    if (field.formula?.expression) {
      FormulaEvaluator.extractVariables(field.formula.expression).forEach((reference) => {
        dependencyGraph.set(reference, [...(dependencyGraph.get(reference) || []), field.fieldKey]);
      });
    }
  });
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (node: string): boolean => {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    const hasCycle = (dependencyGraph.get(node) || []).some(visit);
    visiting.delete(node);
    visited.add(node);
    return hasCycle;
  };
  if ([...dependencyGraph.keys()].some(visit)) {
    errors.push('Circular dependency detected between lookup or formula fields.');
  }

  return { valid: errors.length === 0, warnings, errors };
}

export function upsertQualityFormTemplate(template: QualityFormTemplate, enqueue = true): QualityFormTemplate {
  const normalized = normalizeTemplate({ ...template, updatedAt: nowIso() });
  const existing = readTemplates();
  const found = existing.find((item) => item.id === normalized.id);
  const next = found
    ? existing.map((item) => item.id === normalized.id ? normalized : item)
    : [normalized, ...existing];
  writeTemplates(next);
  if (enqueue) {
    enqueueTemplate(found ? 'update-form-template' : 'create-form-template', normalized, `${normalized.name} ${found ? 'updated' : 'created'} locally.`);
  }
  return normalized;
}

export function createBlankQualityFormTemplate(partial: Partial<QualityFormTemplate> = {}): QualityFormTemplate {
  const id = partial.id || newId('form-template');
  const sectionId = 'general';
  const template = normalizeTemplate({
    id,
    name: partial.name || 'New Defect Recorder Template',
    description: partial.description || 'Configurable quality form template.',
    entityType: partial.entityType || 'defect-log',
    recordType: partial.recordType || 'process-ppm',
    sections: partial.sections || [{ id: sectionId, title: 'General Information', order: 1, collapsible: true }],
    fields: partial.fields || [
      {
        id: newId('field'),
        fieldKey: 'date',
        label: 'Date',
        type: 'date',
        sectionId,
        order: 1,
        required: true,
        readOnly: false,
        hidden: false,
      },
      {
        id: newId('field'),
        fieldKey: 'defectType',
        label: 'Defect Type',
        type: 'text',
        sectionId,
        order: 2,
        required: true,
        readOnly: false,
        hidden: false,
      },
      {
        id: newId('field'),
        fieldKey: 'quantity',
        label: 'Quantity',
        type: 'number',
        sectionId,
        order: 3,
        required: true,
        readOnly: false,
        hidden: false,
        defaultValue: 1,
      },
    ],
    rules: partial.rules || [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    status: partial.status || 'draft',
    version: partial.version || 1,
  });
  return template;
}

export function duplicateQualityFormTemplate(id: string): QualityFormTemplate | null {
  const original = readTemplates().find((template) => template.id === id);
  if (!original) return null;
  const copy = normalizeTemplate({
    ...original,
    id: newId('form-template'),
    name: `${original.name} Copy`,
    status: 'draft',
    version: 1,
    history: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  writeTemplates([copy, ...readTemplates()]);
  enqueueTemplate('create-form-template', copy, `${copy.name} duplicated locally from ${original.name}.`);
  return copy;
}

export function publishQualityFormTemplate(id: string, note = 'Published version'): QualityFormTemplate | null {
  const templates = readTemplates();
  const template = templates.find((item) => item.id === id);
  if (!template) return null;
  const nextVersion = template.status === 'active' ? template.version : template.version + 1;
  const published = normalizeTemplate({
    ...template,
    status: 'active',
    version: nextVersion,
    history: [...(template.history || []), snapshotTemplate(template, note || 'Published version')],
    updatedAt: nowIso(),
  });
  const next = templates.map((item) => {
    if (item.id === id) return published;
    const sameScope = item.entityType === published.entityType
      && String(item.recordType || '') === String(published.recordType || '')
      && item.status === 'active';
    return sameScope ? { ...item, status: 'archived' as const, updatedAt: nowIso() } : item;
  });
  writeTemplates(next);
  enqueueTemplate('publish-form-template', published, `${published.name} published as active version ${published.version}. ${note ? `Note: ${note}` : ''}`);
  return published;
}

export function archiveQualityFormTemplate(id: string): QualityFormTemplate | null {
  const templates = readTemplates();
  const template = templates.find((item) => item.id === id);
  if (!template) return null;
  const archived = normalizeTemplate({
    ...template,
    status: 'archived',
    history: [...(template.history || []), snapshotTemplate(template, 'Archived version')],
    updatedAt: nowIso(),
  });
  writeTemplates(templates.map((item) => item.id === id ? archived : item));
  enqueueTemplate('archive-form-template', archived, `${archived.name} archived locally.`);
  return archived;
}

export function rollbackQualityFormTemplate(id: string, version: number): QualityFormTemplate | null {
  const templates = readTemplates();
  const template = templates.find((item) => item.id === id);
  const snapshot = template?.history?.find((item) => item.version === version);
  if (!template || !snapshot) return null;
  const rolledBack = normalizeTemplate({
    ...template,
    version: template.version + 1,
    status: 'draft',
    sections: snapshot.sections,
    fields: snapshot.fields,
    rules: snapshot.rules,
    history: [...(template.history || []), snapshotTemplate(template, `Rolled back from version ${version}`)],
    updatedAt: nowIso(),
  });
  writeTemplates(templates.map((item) => item.id === id ? rolledBack : item));
  enqueueTemplate('update-form-template', rolledBack, `${rolledBack.name} rolled back from version ${version}.`);
  return rolledBack;
}

export function importQualityFormTemplate(input: unknown): QualityFormTemplate {
  const template = normalizeTemplate(input as Partial<QualityFormTemplate>);
  const imported = normalizeTemplate({
    ...template,
    id: template.id || newId('form-template'),
    status: template.status === 'active' ? 'draft' : template.status,
    updatedAt: nowIso(),
  });
  upsertQualityFormTemplate(imported, false);
  enqueueTemplate('import-form-template', imported, `${imported.name} imported locally.`);
  return imported;
}

export function exportQualityFormTemplate(template: QualityFormTemplate): Record<string, unknown> {
  enqueueTemplate('export-form-template', template, `${template.name} exported locally.`);
  return {
    exportType: 'quality-form-template',
    exportedAt: nowIso(),
    storageKey: QUALITY_FORM_TEMPLATES_KEY,
    template,
  };
}

function contextScore(template: QualityFormTemplate, context: ActiveQualityFormContext): number {
  let score = template.status === 'active' ? 100 : 0;
  if (context.entityType && template.entityType === context.entityType) score += 20;
  if (context.recordType && template.recordType === context.recordType) score += 15;
  if (context.factory && template.applicableFactory === context.factory) score += 5;
  if (context.workshop && template.applicableWorkshop === context.workshop) score += 5;
  if (context.line && template.applicableLine === context.line) score += 5;
  if (context.inspectionPoint && template.applicableInspectionPoint === context.inspectionPoint) score += 5;
  if (context.product && template.applicableProduct === context.product) score += 5;
  if (context.model && template.applicableModel === context.model) score += 5;
  return score;
}

export function loadActiveQualityFormTemplate(context: ActiveQualityFormContext = {}): QualityFormTemplate | null {
  const candidates = readTemplates().filter((template) => {
    if (template.status !== 'active') return false;
    if (context.entityType && template.entityType !== context.entityType) return false;
    if (context.recordType && template.recordType && template.recordType !== context.recordType) return false;
    return true;
  });
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => contextScore(b, context) - contextScore(a, context) || b.version - a.version)[0];
}

export function qualityTemplateToDynamicForm(template: QualityFormTemplate): DynamicForm {
  const sections: FormSection[] = template.sections
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      order: section.order,
      collapsible: section.collapsible,
      collapsedByDefault: section.collapsedByDefault,
      fields: template.fields
        .filter((field) => field.sectionId === section.id)
        .sort((a, b) => a.order - b.order)
        .map((field) => field.id),
    }));

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    type: template.entityType === 'defect-log' ? 'defect-log' : 'custom',
    version: template.version,
    isActive: template.status === 'active',
    industryStandard: 'custom',
    sections,
    fields: template.fields
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((field) => qualityFieldToDynamic(field, template.rules)),
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    createdBy: 'local-form-designer',
  };
}

export function dynamicFormToQualityTemplate(form: DynamicForm, partial: Partial<QualityFormTemplate> = {}): QualityFormTemplate {
  const sections = form.sections.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    order: section.order,
    collapsible: section.collapsible,
    collapsedByDefault: section.collapsedByDefault,
  }));
  const fields: QualityFormField[] = form.fields.map((field) => ({
    id: field.id,
    fieldKey: field.name,
    label: field.label,
    type: field.type === 'multiselect' ? 'multi-select' : field.type === 'checkbox' ? 'boolean' : field.type === 'file' ? 'attachment' : field.type === 'relation' ? 'linked-record' : field.type === 'formula' ? 'formula' : field.type as QualityDesignerFieldType,
    sectionId: field.section || sections[0]?.id || 'general',
    order: field.order,
    required: Boolean(field.validation?.required),
    readOnly: !field.editable,
    hidden: !field.visible,
    defaultValue: field.defaultValue,
    placeholder: field.placeholder,
    helperText: field.helpText || field.description,
    validation: {
      min: field.validation?.min,
      max: field.validation?.max,
      minLength: field.validation?.minLength,
      maxLength: field.validation?.maxLength,
      pattern: field.validation?.pattern,
    },
    options: field.options,
    formula: field.formula ? { expression: field.formula.expression, precision: field.formula.precision } : undefined,
  }));
  return normalizeTemplate({
    id: newId('form-template'),
    name: partial.name || form.name,
    description: partial.description || form.description || '',
    entityType: partial.entityType || (form.type === 'defect-log' ? 'defect-log' : 'custom'),
    recordType: partial.recordType || 'process-ppm',
    version: 1,
    status: 'draft',
    sections,
    fields,
    rules: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
}

export function canManageQualityFormTemplates(role: QualityWorkflowRole = loadLocalWorkflowRole()): { allowed: boolean; reason: string } {
  if (managerRoles.includes(role)) return { allowed: true, reason: 'Allowed to manage quality form templates.' };
  return { allowed: false, reason: `${roleLabel(role)} can preview forms, but editing and publishing require Quality Supervisor, Quality Manager, Admin, or System role.` };
}

export function currentFormDesignerUser() {
  return buildLocalWorkflowUser(null, loadLocalWorkflowRole());
}
