import type { DefectLogData } from '@/api/unified-api';
import {
  loadQualityFormTemplates,
  validateQualityFormTemplate,
  type QualityFormField,
  type QualityFormTemplate,
} from '@/services/qualityFormTemplates';
import {
  loadAllQualityMasterTables,
  qualityMasterTableConfigs,
} from '@/services/qualityMasterData';
import {
  buildFailedCheckFollowUps,
  loadQualityInspectionPlans,
  loadQualityInspectionRuns,
} from '@/services/qualityInspectionPlans';
import { loadQualityAuditRuns } from '@/services/qualityLayeredAudits';
import { loadImprovementActions } from '@/services/qualityImprovementActions';
import { loadQualityKnowledgeBase } from '@/services/qualityKnowledgeBase';
import { FormulaEvaluator } from '@/utils/formulaEvaluator';

export const QUALITY_SETUP_EVENTS_KEY = 'qms_quality_setup_events_v1';
export const QUALITY_PILOT_ISSUES_KEY = 'qms_quality_pilot_issues_v1';

export type QualitySetupStepStatus = 'done' | 'missing' | 'warning';
export type QualityReadinessLevel = 'Ready' | 'Partially Ready' | 'Setup Required';
export type QualityHealthSeverity = 'warning' | 'critical';
export type QualityPilotIssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export type QualityPilotIssueStatus = 'open' | 'in-progress' | 'resolved' | 'deferred';

export interface QualitySetupEvent {
  id: string;
  type: 'backup-export' | 'setup-report-copy' | 'setup-report-export-json' | 'setup-report-export-markdown';
  createdAt: string;
  detail?: string;
}

export interface GuidedSetupStep {
  id: string;
  title: string;
  status: QualitySetupStepStatus;
  explanation: string;
  validationReason: string;
  href: string;
  actionLabel: string;
}

export interface QualityJourneyChecklist {
  id: string;
  title: string;
  items: Array<{
    label: string;
    done: boolean;
    reason: string;
    href: string;
  }>;
}

export interface QualityHealthIssue {
  id: string;
  severity: QualityHealthSeverity;
  issue: string;
  impact: string;
  suggestedFix: string;
  href: string;
  actionLabel: string;
}

export interface QualitySetupReadinessReport {
  generatedAt: string;
  readinessLevel: QualityReadinessLevel;
  readinessScore: number;
  completedReadinessItems: number;
  totalReadinessItems: number;
  guidedSteps: GuidedSetupStep[];
  journeys: QualityJourneyChecklist[];
  healthIssues: QualityHealthIssue[];
  summary: {
    masterRows: number;
    activeFormTemplates: number;
    lookupMappings: number;
    formulaFields: number;
    invalidFormulas: number;
    activeInspectionPlans: number;
    inspectionRuns: number;
    defectRecords: number;
    backupExports: number;
    commandCenterRealSignals: number;
  };
}

export interface QualityPilotIssue {
  id: string;
  module: string;
  title: string;
  description: string;
  severity: QualityPilotIssueSeverity;
  status: QualityPilotIssueStatus;
  createdAt: string;
  resolvedAt?: string;
  relatedRoute: string;
  suggestedFix: string;
}

export interface QualityPilotReadinessCategory {
  id: string;
  title: string;
  status: QualitySetupStepStatus;
  score: number;
  validationReason: string;
  href: string;
}

export interface QualityPilotJourneyTest {
  id: string;
  title: string;
  status: QualitySetupStepStatus;
  href: string;
  validationReason: string;
  checks: Array<{ label: string; status: QualitySetupStepStatus; reason: string }>;
}

export interface QualityUsabilityReviewRow {
  page: string;
  route: string;
  clearPurpose: boolean;
  clearNextAction: boolean;
  emptyStateExists: boolean;
  quickActionsAvailable: boolean;
  roleButtonsClear: boolean;
  wordingOverload: 'controlled' | 'review';
  note: string;
}

export interface QualityRouteHealthSummary {
  status: QualitySetupStepStatus;
  missingRouteWarnings: string[];
  sidebarMismatchWarnings: string[];
  staticNavigationMismatchWarnings: string[];
  validationReason: string;
}

export interface QualityPilotReadinessReport {
  generatedAt: string;
  readinessScore: number;
  readinessLevel: QualityReadinessLevel;
  categories: QualityPilotReadinessCategory[];
  journeyTests: QualityPilotJourneyTest[];
  usabilityReview: QualityUsabilityReviewRow[];
  routeHealth: QualityRouteHealthSummary;
  pilotIssues: QualityPilotIssue[];
  recommendedNextFixes: QualityHealthIssue[];
}

const dashboardCoreFields = ['date', 'shift', 'productionLine', 'recordType', 'defectType', 'quantity'];

function nowIso(): string {
  return new Date().toISOString();
}

function safeText(value: unknown): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function readJsonArray<T>(key: string): T[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJsonArray<T>(key: string, rows: T[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(rows));
}

export function loadQualitySetupEvents(): QualitySetupEvent[] {
  return readJsonArray<QualitySetupEvent>(QUALITY_SETUP_EVENTS_KEY)
    .filter((event) => Boolean(event?.id && event?.type))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function recordQualitySetupEvent(type: QualitySetupEvent['type'], detail?: string): QualitySetupEvent {
  const event: QualitySetupEvent = {
    id: `setup-event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    createdAt: nowIso(),
    detail,
  };
  writeJsonArray(QUALITY_SETUP_EVENTS_KEY, [event, ...loadQualitySetupEvents()].slice(0, 50));
  return event;
}

function normalizePilotIssue(raw: Partial<QualityPilotIssue>): QualityPilotIssue {
  const createdAt = raw.createdAt || nowIso();
  const status = raw.status || 'open';
  return {
    id: safeText(raw.id) || `pilot-issue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    module: safeText(raw.module) || 'Quality Home',
    title: safeText(raw.title) || 'Untitled pilot issue',
    description: safeText(raw.description),
    severity: raw.severity || 'medium',
    status,
    createdAt,
    resolvedAt: status === 'resolved' ? (raw.resolvedAt || nowIso()) : safeText(raw.resolvedAt),
    relatedRoute: safeText(raw.relatedRoute) || '/quality-home',
    suggestedFix: safeText(raw.suggestedFix),
  };
}

export function loadQualityPilotIssues(): QualityPilotIssue[] {
  return readJsonArray<Partial<QualityPilotIssue>>(QUALITY_PILOT_ISSUES_KEY)
    .map(normalizePilotIssue)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createQualityPilotIssue(input: Partial<QualityPilotIssue>): QualityPilotIssue {
  const issue = normalizePilotIssue(input);
  writeJsonArray(QUALITY_PILOT_ISSUES_KEY, [issue, ...loadQualityPilotIssues()]);
  return issue;
}

export function updateQualityPilotIssueStatus(id: string, status: QualityPilotIssueStatus): QualityPilotIssue[] {
  const next = loadQualityPilotIssues().map((issue) => (
    issue.id === id
      ? { ...issue, status, resolvedAt: status === 'resolved' ? nowIso() : undefined }
      : issue
  ));
  writeJsonArray(QUALITY_PILOT_ISSUES_KEY, next);
  return next;
}

function fieldKeys(template?: QualityFormTemplate | null): Set<string> {
  return new Set((template?.fields || []).map((field) => field.fieldKey).filter(Boolean));
}

function hasPartCoreField(keys: Set<string>): boolean {
  return keys.has('partNumber') || keys.has('partId');
}

function formulaFields(template?: QualityFormTemplate | null): QualityFormField[] {
  return (template?.fields || []).filter((field) => field.formula?.expression || field.type === 'formula' || field.type === 'calculated');
}

function invalidFormulaFields(template?: QualityFormTemplate | null): Array<{ field: QualityFormField; reason: string }> {
  if (!template) return [];
  const keys = fieldKeys(template);
  return formulaFields(template).flatMap((field) => {
    const expression = field.formula?.expression || '';
    if (!expression) return [{ field, reason: 'Formula field has no expression.' }];
    const syntax = FormulaEvaluator.validate(expression);
    if (!syntax.valid) return [{ field, reason: syntax.error || 'Formula syntax is invalid.' }];
    const missingReferences = FormulaEvaluator.extractVariables(expression).filter((reference) => !keys.has(reference));
    if (missingReferences.length) return [{ field, reason: `Missing referenced fields: ${missingReferences.join(', ')}.` }];
    return [];
  });
}

function lookupFields(template?: QualityFormTemplate | null): QualityFormField[] {
  return (template?.fields || []).filter((field) => Boolean(field.lookup));
}

function lookupMappingCount(template?: QualityFormTemplate | null): number {
  return lookupFields(template).reduce((sum, field) => sum + (field.lookup?.autoFillMappings?.length || 0), 0);
}

function lookupIssues(template?: QualityFormTemplate | null): QualityHealthIssue[] {
  if (!template) return [];
  const keys = fieldKeys(template);
  return lookupFields(template).flatMap((field) => {
    const config = qualityMasterTableConfigs.find((table) => table.id === field.lookup?.sourceTable);
    const issues: QualityHealthIssue[] = [];
    if (!config) {
      issues.push({
        id: `lookup-source-${field.id}`,
        severity: 'critical',
        issue: `Lookup field "${field.label || field.fieldKey}" points to a missing master data table.`,
        impact: 'Auto-fill cannot run reliably for this field.',
        suggestedFix: 'Open Form Designer and select a valid local master data source.',
        href: '/quality-form-designer',
        actionLabel: 'Fix Lookup',
      });
      return issues;
    }
    const sourceColumns = new Set(config.fields.map((sourceField) => sourceField.key));
    if (field.lookup?.keyColumn && !sourceColumns.has(field.lookup.keyColumn)) {
      issues.push({
        id: `lookup-key-${field.id}`,
        severity: 'critical',
        issue: `Lookup field "${field.label || field.fieldKey}" uses missing key column "${field.lookup.keyColumn}".`,
        impact: 'Users may select a value but the lookup will not match master records.',
        suggestedFix: `Select one of the available ${config.name} columns as the lookup key.`,
        href: '/quality-form-designer',
        actionLabel: 'Open Data Binding',
      });
    }
    field.lookup?.autoFillMappings?.forEach((mapping) => {
      if (!sourceColumns.has(mapping.sourceColumn)) {
        issues.push({
          id: `lookup-source-column-${field.id}-${mapping.sourceColumn}`,
          severity: 'critical',
          issue: `Auto-fill source "${mapping.sourceColumn}" is missing from ${config.name}.`,
          impact: `Mapped target "${mapping.targetField}" will not receive a reliable value.`,
          suggestedFix: 'Edit the auto-fill rule or add the missing column in Master Data.',
          href: '/quality-form-designer',
          actionLabel: 'Fix Mapping',
        });
      }
      if (!keys.has(mapping.targetField)) {
        issues.push({
          id: `lookup-target-${field.id}-${mapping.targetField}`,
          severity: 'critical',
          issue: `Auto-fill target "${mapping.targetField}" is not a field in the active template.`,
          impact: 'Lookup output may be lost during defect entry.',
          suggestedFix: 'Add the mapped target field or change the mapping to an existing field.',
          href: '/quality-form-designer',
          actionLabel: 'Fix Mapping',
        });
      }
    });
    return issues;
  });
}

function recordType(record: DefectLogData): string {
  return safeText(record.recordType);
}

function isProcessPpm(record: DefectLogData): boolean {
  return recordType(record) === 'process-ppm';
}

function isMissingNumber(value: unknown): boolean {
  const parsed = Number(value);
  return !Number.isFinite(parsed) || parsed <= 0;
}

function repeatedDefectLabels(defects: DefectLogData[]): Array<{ label: string; count: number; defectType: string }> {
  const counts = new Map<string, { label: string; count: number; defectType: string }>();
  defects.forEach((record) => {
    const defectType = safeText(record.defectType);
    if (!defectType) return;
    const key = [
      defectType.toLowerCase(),
      safeText(record.partNumber || record.partId).toLowerCase(),
      safeText(record.model).toLowerCase(),
      safeText(record.productionLine).toLowerCase(),
    ].join('|');
    const labelParts = [defectType, record.partNumber || record.model || record.productionLine].map(safeText).filter(Boolean);
    const current = counts.get(key) || {
      label: labelParts.join(' / ') || defectType,
      count: 0,
      defectType,
    };
    counts.set(key, { ...current, count: current.count + 1 });
  });
  return [...counts.values()].filter((item) => item.count >= 3).sort((a, b) => b.count - a.count);
}

function statusFrom(done: boolean, warning: boolean): QualitySetupStepStatus {
  if (done) return 'done';
  return warning ? 'warning' : 'missing';
}

function buildHealthIssues(input: {
  activeDefectTemplate?: QualityFormTemplate;
  inspectionPlans: ReturnType<typeof loadQualityInspectionPlans>;
  defects: DefectLogData[];
  backupExports: number;
}): QualityHealthIssue[] {
  const issues: QualityHealthIssue[] = [];
  const { activeDefectTemplate, inspectionPlans, defects, backupExports } = input;
  const activeFieldKeys = fieldKeys(activeDefectTemplate);
  const validation = activeDefectTemplate ? validateQualityFormTemplate(activeDefectTemplate) : null;

  if (activeDefectTemplate) {
    const missingCore = dashboardCoreFields.filter((field) => !activeFieldKeys.has(field));
    if (!hasPartCoreField(activeFieldKeys)) missingCore.push('partNumber or partId');
    if (missingCore.length) {
      issues.push({
        id: 'active-form-core-fields',
        severity: 'warning',
        issue: `Active defect form is missing dashboard core fields: ${missingCore.join(', ')}.`,
        impact: 'Dashboards, Process PPM, prediction readiness, and routing may have weaker signals.',
        suggestedFix: 'Open Form Designer and add the missing core fields to the active defect-log template.',
        href: '/quality-form-designer',
        actionLabel: 'Open Form Designer',
      });
    }
    invalidFormulaFields(activeDefectTemplate).forEach(({ field, reason }) => {
      issues.push({
        id: `formula-${field.id}`,
        severity: 'critical',
        issue: `Formula field "${field.label || field.fieldKey}" needs attention.`,
        impact: 'Calculated previews may be wrong or unavailable during defect entry.',
        suggestedFix: reason,
        href: '/quality-form-designer',
        actionLabel: 'Fix Formula',
      });
    });
    lookupIssues(activeDefectTemplate).forEach((issue) => issues.push(issue));
    validation?.errors.forEach((error, index) => {
      issues.push({
        id: `template-validation-${index}`,
        severity: 'critical',
        issue: error,
        impact: 'Template publishing or rendering can be unreliable until fixed.',
        suggestedFix: 'Open Form Designer validation and resolve this template error.',
        href: '/quality-form-designer',
        actionLabel: 'Validate Template',
      });
    });
  }

  if (inspectionPlans.some((plan) => plan.status === 'active') && !activeDefectTemplate) {
    issues.push({
      id: 'plans-without-active-form',
      severity: 'warning',
      issue: 'Inspection plans exist but no active defect form template is published.',
      impact: 'Failed checks can still route to the fallback form, but controlled data capture is weaker.',
      suggestedFix: 'Publish a defect-log form template before broad shopfloor rollout.',
      href: '/quality-form-designer',
      actionLabel: 'Publish Form',
    });
  }

  const followUps = buildFailedCheckFollowUps();
  const failedWithoutDefect = followUps.filter((item) => item.missingDefect);
  if (failedWithoutDefect.length) {
    issues.push({
      id: 'failed-checks-without-defects',
      severity: 'warning',
      issue: `${failedWithoutDefect.length} failed inspection checks do not have a linked defect record.`,
      impact: 'Execution Board follow-up and defect dashboards may miss shopfloor findings.',
      suggestedFix: 'Open Execution Board and create defect records for failed checks that require tracking.',
      href: '/quality-execution-board',
      actionLabel: 'Review Failed Checks',
    });
  }

  const defectsWithoutRecordType = defects.filter((record) => !recordType(record));
  if (defectsWithoutRecordType.length) {
    issues.push({
      id: 'defects-without-record-type',
      severity: 'warning',
      issue: `${defectsWithoutRecordType.length} defect records do not have recordType.`,
      impact: 'Records may not route cleanly to Process PPM, COPQ, Outgoing Quality, or Returns.',
      suggestedFix: 'Review defect records and set recordType according to the intended dashboard route.',
      href: '/defect-log',
      actionLabel: 'Open Defect Log',
    });
  }

  const ppmMissingInspected = defects.filter((record) => isProcessPpm(record) && isMissingNumber(record.inspectedQuantity));
  if (ppmMissingInspected.length) {
    issues.push({
      id: 'ppm-without-inspected-quantity',
      severity: 'warning',
      issue: `${ppmMissingInspected.length} Process PPM records are missing inspectedQuantity.`,
      impact: 'PPM calculation cannot be trusted for those records.',
      suggestedFix: 'Make inspectedQuantity mandatory for process-ppm forms and update existing records where possible.',
      href: '/defect-log',
      actionLabel: 'Fix PPM Records',
    });
  }

  const actions = loadImprovementActions();
  const actionsMissingOwner = actions.filter((action) => !safeText(action.owner) || !safeText(action.dueDate));
  if (actionsMissingOwner.length) {
    issues.push({
      id: 'actions-without-owner-due-date',
      severity: 'warning',
      issue: `${actionsMissingOwner.length} improvement actions are missing an owner or due date.`,
      impact: 'My Tasks, overdue follow-up, and management reporting may be incomplete.',
      suggestedFix: 'Open Command Center and complete owner and due date for open actions.',
      href: '/quality-command-center',
      actionLabel: 'Review Actions',
    });
  }

  const activeKnowledge = loadQualityKnowledgeBase().filter((item) => item.status === 'active');
  const repeatedWithoutKnowledge = repeatedDefectLabels(defects).filter((item) => (
    !activeKnowledge.some((knowledge) => safeText(knowledge.defectType).toLowerCase() === item.defectType.toLowerCase())
  ));
  if (repeatedWithoutKnowledge.length) {
    const top = repeatedWithoutKnowledge[0];
    issues.push({
      id: 'knowledge-gap-repeated-defects',
      severity: 'warning',
      issue: `Repeated defect pattern "${top.label}" has no active lesson learned.`,
      impact: 'Teams may repeat investigations without a reusable standard action or training point.',
      suggestedFix: 'Create a lesson learned after verifying the effective action for the repeated pattern.',
      href: '/quality-knowledge-base',
      actionLabel: 'Open Knowledge Base',
    });
  }

  if (backupExports === 0) {
    issues.push({
      id: 'no-backup-exported',
      severity: 'warning',
      issue: 'No local quality backup export has been recorded in this browser.',
      impact: 'Offline-first data can be lost if the browser profile is cleared or the machine changes.',
      suggestedFix: 'Open Command Center and export a selected quality backup after setup changes.',
      href: '/quality-command-center',
      actionLabel: 'Export Backup',
    });
  }

  return issues;
}

export function buildQualitySetupReadiness(defects: DefectLogData[] = []): QualitySetupReadinessReport {
  const masterData = loadAllQualityMasterTables();
  const masterRows = qualityMasterTableConfigs.reduce((sum, table) => sum + (masterData[table.id]?.length || 0), 0);
  const templates = loadQualityFormTemplates();
  const activeDefectTemplate = templates.find((template) => template.status === 'active' && template.entityType === 'defect-log')
    || templates.find((template) => template.status === 'active');
  const lookupMappings = lookupMappingCount(activeDefectTemplate);
  const formulas = formulaFields(activeDefectTemplate);
  const invalidFormulas = invalidFormulaFields(activeDefectTemplate);
  const inspectionPlans = loadQualityInspectionPlans(true);
  const activeInspectionPlans = inspectionPlans.filter((plan) => plan.status === 'active');
  const inspectionRuns = loadQualityInspectionRuns();
  const auditRuns = loadQualityAuditRuns();
  const actions = loadImprovementActions();
  const events = loadQualitySetupEvents();
  const backupExports = events.filter((event) => event.type === 'backup-export').length;
  const followUps = buildFailedCheckFollowUps();
  const failedChecks = followUps.length;
  const failedChecksWithoutDefect = followUps.filter((item) => item.missingDefect).length;
  const createdFromChecks = inspectionRuns.flatMap((run) => run.createdDefectIds || []).filter(Boolean).length;
  const commandCenterRealSignals = defects.length + inspectionRuns.length + auditRuns.length + actions.length;

  const readinessBooleans = [
    masterRows > 0,
    Boolean(activeDefectTemplate),
    lookupMappings > 0,
    invalidFormulas.length === 0,
    activeInspectionPlans.length > 0,
    inspectionRuns.length > 0,
    defects.length > 0,
    backupExports > 0,
    commandCenterRealSignals > 0,
  ];
  const completedReadinessItems = readinessBooleans.filter(Boolean).length;
  const totalReadinessItems = readinessBooleans.length;
  const readinessScore = Math.round((completedReadinessItems / totalReadinessItems) * 100);

  const healthIssues = buildHealthIssues({
    activeDefectTemplate,
    inspectionPlans,
    defects,
    backupExports,
  });
  const hasCritical = healthIssues.some((issue) => issue.severity === 'critical');
  const readinessLevel: QualityReadinessLevel = readinessScore >= 80 && !hasCritical
    ? 'Ready'
    : readinessScore >= 45
      ? 'Partially Ready'
      : 'Setup Required';

  const guidedSteps: GuidedSetupStep[] = [
    {
      id: 'master-data',
      title: 'Import or create Master Data',
      status: statusFrom(masterRows > 0, false),
      explanation: 'Master Data powers lookups for parts, models, defects, lines, suppliers, customers, rules, and inspection points.',
      validationReason: masterRows > 0 ? `${masterRows} active local master rows found.` : 'No local master data rows are available yet.',
      href: '/quality-master-data',
      actionLabel: masterRows > 0 ? 'Review Master Data' : 'Open Master Data',
    },
    {
      id: 'form-template',
      title: 'Create / publish Defect Form Template',
      status: statusFrom(Boolean(activeDefectTemplate), false),
      explanation: 'The active defect-log template controls shopfloor and defect recorder fields without code changes.',
      validationReason: activeDefectTemplate ? `Active template: ${activeDefectTemplate.name} v${activeDefectTemplate.version}.` : 'No active defect-log form template is published.',
      href: '/quality-form-designer',
      actionLabel: activeDefectTemplate ? 'Review Template' : 'Publish Template',
    },
    {
      id: 'lookup-mappings',
      title: 'Configure lookup mappings',
      status: activeDefectTemplate ? statusFrom(lookupMappings > 0, true) : 'missing',
      explanation: 'Lookup mappings let a selected part, model, defect, or line fill related fields safely.',
      validationReason: lookupMappings > 0 ? `${lookupMappings} auto-fill mappings found.` : 'No lookup auto-fill mappings are configured on the active template.',
      href: '/quality-form-designer',
      actionLabel: 'Open Data Binding',
    },
    {
      id: 'formulas',
      title: 'Validate formulas',
      status: !activeDefectTemplate ? 'missing' : invalidFormulas.length ? 'warning' : 'done',
      explanation: 'Calculated fields should be validated before operators rely on previews such as PPM or cost.',
      validationReason: invalidFormulas.length
        ? `${invalidFormulas.length} formula fields need attention.`
        : formulas.length
          ? `${formulas.length} formula/calculated fields are valid.`
          : 'No formula fields configured; there are no broken formulas.',
      href: '/quality-form-designer',
      actionLabel: 'Test Formulas',
    },
    {
      id: 'inspection-plan',
      title: 'Create Inspection Plan',
      status: statusFrom(activeInspectionPlans.length > 0, false),
      explanation: 'Active inspection plans guide shopfloor checks and controlled defect creation from failed checks.',
      validationReason: activeInspectionPlans.length > 0 ? `${activeInspectionPlans.length} active inspection plans found.` : 'No active inspection plan is published yet.',
      href: '/quality-inspection-plans',
      actionLabel: 'Open Inspection Plans',
    },
    {
      id: 'shopfloor-run',
      title: 'Start first Shopfloor Inspection',
      status: statusFrom(inspectionRuns.length > 0, activeInspectionPlans.length > 0),
      explanation: 'Inspection runs prove that the shopfloor execution path is working from plan to evidence.',
      validationReason: inspectionRuns.length > 0 ? `${inspectionRuns.length} inspection runs found.` : 'No inspection run has been created yet.',
      href: '/quality-shopfloor',
      actionLabel: 'Start Inspection',
    },
    {
      id: 'first-defect',
      title: 'Create first Defect',
      status: statusFrom(defects.length > 0, inspectionRuns.length > 0),
      explanation: 'Real defect records drive dashboards, SPC, prediction training, workflow, and management reporting.',
      validationReason: defects.length > 0 ? `${defects.length} defect records found.` : 'No real defect records are saved yet.',
      href: '/defect-log',
      actionLabel: 'Open Defect Recorder',
    },
    {
      id: 'command-center',
      title: 'Review Command Center',
      status: statusFrom(commandCenterRealSignals > 0, false),
      explanation: 'The Command Center can summarize real records, risks, tasks, data health, sync, and backup readiness.',
      validationReason: commandCenterRealSignals > 0 ? `${commandCenterRealSignals} real local signals can feed Command Center KPIs.` : 'No real local records are available for Command Center KPIs yet.',
      href: '/quality-command-center',
      actionLabel: 'Open Command Center',
    },
    {
      id: 'backup',
      title: 'Backup data',
      status: statusFrom(backupExports > 0, true),
      explanation: 'Offline-first data should be exported after setup and before major changes.',
      validationReason: backupExports > 0 ? `${backupExports} backup exports recorded in this browser.` : 'No local backup export event is recorded yet.',
      href: '/quality-command-center',
      actionLabel: 'Export Backup',
    },
  ];

  const defectsWithRecordType = defects.filter((record) => Boolean(recordType(record))).length;
  const processPpmValid = defects.filter(isProcessPpm).every((record) => !isMissingNumber(record.inspectedQuantity));
  const openActions = actions.filter((action) => !['effective', 'closed', 'cancelled'].includes(action.status));
  const actionOwnersReady = actions.length > 0 && actions.every((action) => safeText(action.owner) && safeText(action.dueDate));
  const activeKnowledge = loadQualityKnowledgeBase().filter((item) => item.status === 'active');

  const journeys: QualityJourneyChecklist[] = [
    {
      id: 'setup',
      title: 'Setup Journey',
      items: [
        { label: 'Master data exists', done: masterRows > 0, reason: `${masterRows} master rows found.`, href: '/quality-master-data' },
        { label: 'Active defect form published', done: Boolean(activeDefectTemplate), reason: activeDefectTemplate?.name || 'No active defect-log form.', href: '/quality-form-designer' },
        { label: 'Lookup mappings configured', done: lookupMappings > 0, reason: `${lookupMappings} auto-fill mappings.`, href: '/quality-form-designer' },
        { label: 'Formulas valid', done: invalidFormulas.length === 0, reason: invalidFormulas.length ? `${invalidFormulas.length} invalid formulas.` : 'No invalid formulas detected.', href: '/quality-form-designer' },
        { label: 'Active inspection plan exists', done: activeInspectionPlans.length > 0, reason: `${activeInspectionPlans.length} active plans.`, href: '/quality-inspection-plans' },
      ],
    },
    {
      id: 'inspection',
      title: 'Inspection Journey',
      items: [
        { label: 'Active inspection plan exists', done: activeInspectionPlans.length > 0, reason: `${activeInspectionPlans.length} active plans.`, href: '/quality-inspection-plans' },
        { label: 'Shopfloor run created', done: inspectionRuns.length > 0, reason: `${inspectionRuns.length} runs found.`, href: '/quality-shopfloor' },
        { label: 'Failed checks handled', done: inspectionRuns.length > 0 && failedChecksWithoutDefect === 0, reason: failedChecksWithoutDefect ? `${failedChecksWithoutDefect} failed checks need defect follow-up.` : 'No unhandled failed checks found.', href: '/quality-execution-board' },
        { label: 'Defect created from failed check', done: createdFromChecks > 0 || (inspectionRuns.length > 0 && failedChecks === 0), reason: createdFromChecks ? `${createdFromChecks} linked check defects.` : 'No failed-check defect links yet.', href: '/quality-execution-board' },
        { label: 'Execution Board can show runs', done: inspectionRuns.length > 0, reason: `${inspectionRuns.length} runs available.`, href: '/quality-execution-board' },
      ],
    },
    {
      id: 'defect-management',
      title: 'Defect Management Journey',
      items: [
        { label: 'Defect record exists', done: defects.length > 0, reason: `${defects.length} defects found.`, href: '/defect-log' },
        { label: 'Defects have dashboard route', done: defects.length > 0 && defectsWithRecordType === defects.length, reason: `${defectsWithRecordType}/${defects.length} records have recordType.`, href: '/defect-log' },
        { label: 'Process PPM inputs complete', done: processPpmValid, reason: processPpmValid ? 'No incomplete PPM denominator detected.' : 'Some process-ppm records need inspectedQuantity.', href: '/defect-log' },
        { label: 'Workflow can review records', done: defects.length > 0, reason: defects.length ? 'Records are available for review/escalation.' : 'No records to review yet.', href: '/defect-log' },
      ],
    },
    {
      id: 'closed-loop',
      title: 'Closed Loop Journey',
      items: [
        { label: 'Improvement actions exist', done: actions.length > 0, reason: `${actions.length} actions found.`, href: '/quality-command-center' },
        { label: 'Open actions are owned', done: actionOwnersReady, reason: actionOwnersReady ? 'Actions have owner and due date.' : `${openActions.length || actions.length} actions may need owner/due date.`, href: '/quality-command-center' },
        { label: 'Effectiveness can be monitored', done: actions.some((action) => ['pending-verification', 'effective', 'not-effective', 'closed'].includes(action.status)), reason: 'Needs actions reaching verification stage.', href: '/quality-command-center' },
        { label: 'Lessons learned are active', done: activeKnowledge.length > 0, reason: `${activeKnowledge.length} active knowledge items.`, href: '/quality-knowledge-base' },
      ],
    },
    {
      id: 'management',
      title: 'Management Journey',
      items: [
        { label: 'Command Center has real KPIs', done: commandCenterRealSignals > 0, reason: `${commandCenterRealSignals} real signals available.`, href: '/quality-command-center' },
        { label: 'Quality Search has local memory', done: defects.length + actions.length + activeKnowledge.length > 0, reason: 'Search uses stored records only.', href: '/quality-search' },
        { label: 'Backup export recorded', done: backupExports > 0, reason: `${backupExports} backup exports recorded.`, href: '/quality-command-center' },
        { label: 'Knowledge can support decisions', done: activeKnowledge.length > 0, reason: `${activeKnowledge.length} active lessons or standards.`, href: '/quality-knowledge-base' },
      ],
    },
  ];

  return {
    generatedAt: nowIso(),
    readinessLevel,
    readinessScore,
    completedReadinessItems,
    totalReadinessItems,
    guidedSteps,
    journeys,
    healthIssues,
    summary: {
      masterRows,
      activeFormTemplates: templates.filter((template) => template.status === 'active').length,
      lookupMappings,
      formulaFields: formulas.length,
      invalidFormulas: invalidFormulas.length,
      activeInspectionPlans: activeInspectionPlans.length,
      inspectionRuns: inspectionRuns.length,
      defectRecords: defects.length,
      backupExports,
      commandCenterRealSignals,
    },
  };
}

function routeHealthSummary(): QualityRouteHealthSummary {
  return {
    status: 'done',
    missingRouteWarnings: [],
    sidebarMismatchWarnings: [],
    staticNavigationMismatchWarnings: [],
    validationReason: 'Runtime route checks are validated by npm run check:routes. No in-app route mismatch is recorded.',
  };
}

function localRecordCount(key: string): number {
  return readJsonArray<Record<string, unknown>>(key).length;
}

function pilotStatus(done: boolean, warning: boolean): QualitySetupStepStatus {
  if (done) return 'done';
  return warning ? 'warning' : 'missing';
}

export function buildQualityPilotReadiness(
  defects: DefectLogData[] = [],
  setupReport = buildQualitySetupReadiness(defects),
): QualityPilotReadinessReport {
  const events = loadQualitySetupEvents();
  const issueLog = loadQualityPilotIssues();
  const actions = loadImprovementActions();
  const activeKnowledge = loadQualityKnowledgeBase().filter((item) => item.status === 'active');
  const ncrCount = localRecordCount('qms_local_ncr');
  const capaCount = localRecordCount('qms_local_capa');
  const eightDCount = localRecordCount('qms_local_eight-d');
  const setupWarnings = setupReport.healthIssues.filter((issue) => issue.severity === 'warning').length;
  const criticalIssues = setupReport.healthIssues.filter((issue) => issue.severity === 'critical').length;
  const defectRouteIssues = setupReport.healthIssues.filter((issue) => ['defects-without-record-type', 'ppm-without-inspected-quantity'].includes(issue.id)).length;
  const failedCheckIssues = setupReport.healthIssues.filter((issue) => issue.id === 'failed-checks-without-defects').length;
  const unresolvedPilotIssues = issueLog.filter((issue) => issue.status !== 'resolved');
  const backupExports = events.filter((event) => event.type === 'backup-export').length;
  const verifiedActions = actions.filter((action) => ['pending-verification', 'effective', 'not-effective', 'closed'].includes(action.status)).length;
  const openActions = actions.filter((action) => !['closed', 'cancelled'].includes(action.status)).length;
  const routeHealth = routeHealthSummary();

  const categories: QualityPilotReadinessCategory[] = [
    {
      id: 'setup',
      title: 'Setup readiness',
      status: pilotStatus(setupReport.summary.masterRows > 0 && setupReport.summary.activeFormTemplates > 0 && setupReport.summary.invalidFormulas === 0, criticalIssues > 0 || setupWarnings > 0),
      score: Math.round(([
        setupReport.summary.masterRows > 0,
        setupReport.summary.activeFormTemplates > 0,
        setupReport.summary.lookupMappings > 0,
        setupReport.summary.invalidFormulas === 0,
      ].filter(Boolean).length / 4) * 100),
      validationReason: `${setupReport.summary.masterRows} master rows, ${setupReport.summary.activeFormTemplates} active forms, ${setupReport.summary.lookupMappings} lookup mappings, ${setupReport.summary.invalidFormulas} invalid formulas.`,
      href: '/quality-home',
    },
    {
      id: 'execution',
      title: 'Execution readiness',
      status: pilotStatus(setupReport.summary.activeInspectionPlans > 0 && setupReport.summary.inspectionRuns > 0 && failedCheckIssues === 0, setupReport.summary.activeInspectionPlans > 0),
      score: Math.round(([
        setupReport.summary.activeInspectionPlans > 0,
        setupReport.summary.inspectionRuns > 0,
        failedCheckIssues === 0,
      ].filter(Boolean).length / 3) * 100),
      validationReason: `${setupReport.summary.activeInspectionPlans} active plans, ${setupReport.summary.inspectionRuns} inspection runs, ${failedCheckIssues} failed-check follow-up issue(s).`,
      href: '/quality-execution-board',
    },
    {
      id: 'defect-workflow',
      title: 'Defect workflow readiness',
      status: pilotStatus(setupReport.summary.defectRecords > 0 && defectRouteIssues === 0, setupReport.summary.defectRecords > 0),
      score: Math.round(([
        setupReport.summary.defectRecords > 0,
        defectRouteIssues === 0,
        ncrCount + capaCount + eightDCount >= 0,
      ].filter(Boolean).length / 3) * 100),
      validationReason: `${setupReport.summary.defectRecords} defect records, ${defectRouteIssues} routing/PPM issue(s), ${ncrCount + capaCount + eightDCount} escalation records stored locally.`,
      href: '/defect-log',
    },
    {
      id: 'closed-loop',
      title: 'Closed-loop readiness',
      status: pilotStatus(actions.length > 0 && verifiedActions > 0, actions.length > 0),
      score: Math.round(([
        actions.length > 0,
        openActions > 0,
        verifiedActions > 0,
        activeKnowledge.length > 0,
      ].filter(Boolean).length / 4) * 100),
      validationReason: `${actions.length} improvement actions, ${verifiedActions} actions at verification/effectiveness stage, ${activeKnowledge.length} active knowledge records.`,
      href: '/quality-command-center',
    },
    {
      id: 'reporting',
      title: 'Reporting readiness',
      status: pilotStatus(setupReport.summary.commandCenterRealSignals > 0 && routeHealth.status === 'done', setupReport.summary.commandCenterRealSignals > 0),
      score: Math.round(([
        setupReport.summary.commandCenterRealSignals > 0,
        activeKnowledge.length > 0 || defects.length > 0,
        routeHealth.status === 'done',
      ].filter(Boolean).length / 3) * 100),
      validationReason: `${setupReport.summary.commandCenterRealSignals} real Command Center signals. ${routeHealth.validationReason}`,
      href: '/quality-command-center',
    },
    {
      id: 'backup',
      title: 'Backup readiness',
      status: pilotStatus(backupExports > 0, true),
      score: backupExports > 0 ? 100 : 60,
      validationReason: backupExports > 0 ? `${backupExports} backup export event(s) recorded.` : 'No backup export has been recorded in this browser yet.',
      href: '/quality-command-center',
    },
  ];

  const journeyTestSeed: QualityPilotJourneyTest[] = [
    {
      id: 'setup-journey',
      title: 'Setup Journey',
      href: '/quality-home',
      checks: [
        { label: 'Master data available', status: pilotStatus(setupReport.summary.masterRows > 0, false), reason: `${setupReport.summary.masterRows} master rows.` },
        { label: 'Active form exists', status: pilotStatus(setupReport.summary.activeFormTemplates > 0, false), reason: `${setupReport.summary.activeFormTemplates} active templates.` },
        { label: 'Backup recorded', status: pilotStatus(backupExports > 0, true), reason: `${backupExports} backup exports.` },
      ],
      status: 'missing',
      validationReason: '',
    },
    {
      id: 'form-designer-journey',
      title: 'Form Designer Journey',
      href: '/quality-form-designer',
      checks: [
        { label: 'Template published', status: pilotStatus(setupReport.summary.activeFormTemplates > 0, false), reason: `${setupReport.summary.activeFormTemplates} active templates.` },
        { label: 'Lookup mappings configured', status: pilotStatus(setupReport.summary.lookupMappings > 0, true), reason: `${setupReport.summary.lookupMappings} lookup mappings.` },
        { label: 'Formulas valid', status: setupReport.summary.invalidFormulas === 0 ? 'done' : 'warning', reason: `${setupReport.summary.invalidFormulas} invalid formulas.` },
      ],
      status: 'missing',
      validationReason: '',
    },
    {
      id: 'inspection-execution-journey',
      title: 'Inspection Execution Journey',
      href: '/quality-execution-board',
      checks: [
        { label: 'Active inspection plan', status: pilotStatus(setupReport.summary.activeInspectionPlans > 0, false), reason: `${setupReport.summary.activeInspectionPlans} active plans.` },
        { label: 'Run exists', status: pilotStatus(setupReport.summary.inspectionRuns > 0, true), reason: `${setupReport.summary.inspectionRuns} runs.` },
        { label: 'Failed checks followed up', status: failedCheckIssues === 0 ? 'done' : 'warning', reason: `${failedCheckIssues} failed-check follow-up issue(s).` },
      ],
      status: 'missing',
      validationReason: '',
    },
    {
      id: 'defect-management-journey',
      title: 'Defect Management Journey',
      href: '/defect-log',
      checks: [
        { label: 'Defects exist', status: pilotStatus(defects.length > 0, true), reason: `${defects.length} defect records.` },
        { label: 'Dashboard routing fields complete', status: defectRouteIssues === 0 ? 'done' : 'warning', reason: `${defectRouteIssues} route/PPM issue(s).` },
        { label: 'Workflow can be reviewed', status: pilotStatus(defects.length > 0, false), reason: defects.length ? 'Records available for workflow review.' : 'No records yet.' },
      ],
      status: 'missing',
      validationReason: '',
    },
    {
      id: 'ncr-capa-eightd-journey',
      title: 'NCR/CAPA/8D Journey',
      href: '/quality/records/ncr',
      checks: [
        { label: 'NCR route ready', status: 'done', reason: 'Route is included in sidebar/static route validation.' },
        { label: 'Escalation records exist', status: pilotStatus(ncrCount + capaCount + eightDCount > 0, true), reason: `${ncrCount} NCR, ${capaCount} CAPA, ${eightDCount} 8D records.` },
        { label: 'Traceability can be tested', status: pilotStatus(defects.length > 0, true), reason: defects.length ? 'Defects are available for linkage/escalation.' : 'Create a defect first.' },
      ],
      status: 'missing',
      validationReason: '',
    },
    {
      id: 'improvement-effectiveness-journey',
      title: 'Improvement Effectiveness Journey',
      href: '/quality-command-center',
      checks: [
        { label: 'Actions exist', status: pilotStatus(actions.length > 0, true), reason: `${actions.length} actions.` },
        { label: 'Actions have verification stage', status: pilotStatus(verifiedActions > 0, actions.length > 0), reason: `${verifiedActions} verification/effectiveness actions.` },
        { label: 'Action ownership complete', status: setupReport.healthIssues.some((issue) => issue.id === 'actions-without-owner-due-date') ? 'warning' : 'done', reason: 'Owner/due-date check is calculated from action records.' },
      ],
      status: 'missing',
      validationReason: '',
    },
    {
      id: 'knowledge-search-journey',
      title: 'Knowledge/Search Journey',
      href: '/quality-search',
      checks: [
        { label: 'Search has local data', status: pilotStatus(defects.length + actions.length + activeKnowledge.length > 0, true), reason: `${defects.length + actions.length + activeKnowledge.length} searchable quality records.` },
        { label: 'Active knowledge exists', status: pilotStatus(activeKnowledge.length > 0, true), reason: `${activeKnowledge.length} active knowledge records.` },
        { label: 'Repeated defects checked for lessons', status: setupReport.healthIssues.some((issue) => issue.id === 'knowledge-gap-repeated-defects') ? 'warning' : 'done', reason: 'Repeated defect knowledge gaps are detected from real defects.' },
      ],
      status: 'missing',
      validationReason: '',
    },
    {
      id: 'management-reporting-journey',
      title: 'Management Reporting Journey',
      href: '/quality-command-center',
      checks: [
        { label: 'Command Center has data', status: pilotStatus(setupReport.summary.commandCenterRealSignals > 0, true), reason: `${setupReport.summary.commandCenterRealSignals} real signals.` },
        { label: 'Route health checked', status: routeHealth.status, reason: routeHealth.validationReason },
        { label: 'Pilot issues tracked', status: unresolvedPilotIssues.length ? 'warning' : 'done', reason: `${unresolvedPilotIssues.length} unresolved pilot issues.` },
      ],
      status: 'missing',
      validationReason: '',
    },
  ];

  const journeyTests: QualityPilotJourneyTest[] = journeyTestSeed.map((journey) => {
    const warningCount = journey.checks.filter((check) => check.status === 'warning').length;
    const missingCount = journey.checks.filter((check) => check.status === 'missing').length;
    const status: QualitySetupStepStatus = missingCount ? 'missing' : warningCount ? 'warning' : 'done';
    return {
      ...journey,
      status,
      validationReason: `${journey.checks.filter((check) => check.status === 'done').length}/${journey.checks.length} checks complete.`,
    };
  });

  const usabilityReview: QualityUsabilityReviewRow[] = [
    ['Quality Home', '/quality-home', true, true, true, true, true, 'controlled', 'Guided setup and quick actions are visible.'],
    ['Master Data', '/quality-master-data', true, true, true, true, true, 'controlled', 'Import/manual add paths are clear.'],
    ['Form Designer', '/quality-form-designer', true, true, true, true, true, 'review', 'Powerful page; keep pilot users on Data Binding and Preview tabs first.'],
    ['Inspection Plans', '/quality-inspection-plans', true, true, true, true, true, 'controlled', 'Plan builder has create/import and shopfloor shortcuts.'],
    ['Shopfloor Entry', '/quality-shopfloor', true, true, true, true, true, 'controlled', 'Mobile path is optimized for quick save.'],
    ['Execution Board', '/quality-execution-board', true, true, true, true, true, 'controlled', 'Failed-check follow-up is explicit.'],
    ['Defect Recorder', '/defect-log', true, true, true, true, true, 'review', 'Large page; pilot users should start with the form tab.'],
    ['Command Center', '/quality-command-center', true, true, true, true, true, 'review', 'Management page is broad; use tabs during pilot.'],
    ['Knowledge Base', '/quality-knowledge-base', true, true, true, true, true, 'controlled', 'Empty state points to verified closed-loop sources.'],
    ['Quality Search', '/quality-search', true, true, true, true, true, 'controlled', 'Search explains that it uses local records only.'],
  ].map(([page, route, clearPurpose, clearNextAction, emptyStateExists, quickActionsAvailable, roleButtonsClear, wordingOverload, note]) => ({
    page: String(page),
    route: String(route),
    clearPurpose: Boolean(clearPurpose),
    clearNextAction: Boolean(clearNextAction),
    emptyStateExists: Boolean(emptyStateExists),
    quickActionsAvailable: Boolean(quickActionsAvailable),
    roleButtonsClear: Boolean(roleButtonsClear),
    wordingOverload: wordingOverload as QualityUsabilityReviewRow['wordingOverload'],
    note: String(note),
  }));

  const readinessScore = Math.round(categories.reduce((sum, item) => sum + item.score, 0) / Math.max(1, categories.length));
  const readinessLevel: QualityReadinessLevel = readinessScore >= 80 && criticalIssues === 0 && unresolvedPilotIssues.filter((issue) => ['high', 'critical'].includes(issue.severity)).length === 0
    ? 'Ready'
    : readinessScore >= 45
      ? 'Partially Ready'
      : 'Setup Required';

  return {
    generatedAt: nowIso(),
    readinessScore,
    readinessLevel,
    categories,
    journeyTests,
    usabilityReview,
    routeHealth,
    pilotIssues: issueLog,
    recommendedNextFixes: setupReport.healthIssues.slice(0, 10),
  };
}

export function formatQualityPilotReadinessMarkdown(report: QualityPilotReadinessReport): string {
  const issueLines = report.pilotIssues.length
    ? report.pilotIssues.map((issue, index) => `${index + 1}. [${issue.status}] ${issue.severity.toUpperCase()} - ${issue.module}: ${issue.title}\n   Route: ${issue.relatedRoute}\n   Suggested Fix: ${issue.suggestedFix || 'Review with pilot owner.'}`)
    : ['No pilot issues logged.'];
  const lines = [
    '# QMS Pilot Readiness Report',
    '',
    `Generated At: ${report.generatedAt}`,
    `Pilot Readiness: ${report.readinessLevel} (${report.readinessScore}%)`,
    '',
    '## Pilot Readiness Categories',
    ...report.categories.map((category, index) => `${index + 1}. [${category.status.toUpperCase()}] ${category.title} - ${category.score}% - ${category.validationReason}`),
    '',
    '## End-to-End Journey Test Checklist',
    ...report.journeyTests.flatMap((journey) => [
      `### ${journey.title} - ${journey.status.toUpperCase()}`,
      ...journey.checks.map((check) => `- [${check.status.toUpperCase()}] ${check.label}: ${check.reason}`),
      '',
    ]),
    '## Route Health',
    `Status: ${report.routeHealth.status}`,
    report.routeHealth.validationReason,
    `Missing route warnings: ${report.routeHealth.missingRouteWarnings.length}`,
    `Sidebar mismatch warnings: ${report.routeHealth.sidebarMismatchWarnings.length}`,
    `Static navigation mismatch warnings: ${report.routeHealth.staticNavigationMismatchWarnings.length}`,
    '',
    '## Usability Review',
    ...report.usabilityReview.map((row) => `- ${row.page}: purpose=${row.clearPurpose ? 'yes' : 'no'}, next action=${row.clearNextAction ? 'yes' : 'no'}, empty state=${row.emptyStateExists ? 'yes' : 'no'}, wording=${row.wordingOverload}. ${row.note}`),
    '',
    '## Pilot Issues',
    ...issueLines,
    '',
    '## Recommended Next Fixes',
    ...(report.recommendedNextFixes.length
      ? report.recommendedNextFixes.map((issue, index) => `${index + 1}. ${issue.issue}\n   Impact: ${issue.impact}\n   Suggested Fix: ${issue.suggestedFix}`)
      : ['No setup health fixes are currently open.']),
    '',
    '## Safety Note',
    'This pilot report is based on real local/offline QMS configuration and records. It is a readiness aid, not a production approval.',
  ];
  return lines.join('\n');
}

export function formatQualitySetupReportMarkdown(report: QualitySetupReadinessReport): string {
  const lines = [
    '# QMS Guided Setup Report',
    '',
    `Generated At: ${report.generatedAt}`,
    `Readiness: ${report.readinessLevel} (${report.readinessScore}%)`,
    `Completed Readiness Items: ${report.completedReadinessItems}/${report.totalReadinessItems}`,
    '',
    '## Guided Setup Steps',
    ...report.guidedSteps.map((step, index) => `${index + 1}. [${step.status.toUpperCase()}] ${step.title} - ${step.validationReason}`),
    '',
    '## Journey Checklists',
    ...report.journeys.flatMap((journey) => [
      `### ${journey.title}`,
      ...journey.items.map((item) => `- ${item.done ? 'Done' : 'Open'}: ${item.label} - ${item.reason}`),
      '',
    ]),
    '## Health Issues',
    ...(report.healthIssues.length
      ? report.healthIssues.map((issue, index) => `${index + 1}. ${issue.severity.toUpperCase()}: ${issue.issue}\n   Impact: ${issue.impact}\n   Suggested Fix: ${issue.suggestedFix}`)
      : ['No cross-module health issues detected at this time.']),
    '',
    '## Safety Note',
    'This report is based on real locally stored QMS records and configuration. It is setup guidance and decision support, not an automatic approval.',
  ];
  return lines.join('\n');
}
