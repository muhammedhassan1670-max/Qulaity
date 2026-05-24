/**
 * QMS Enterprise 4.0 - Dynamic Configuration Store
 * Professional Quality 4.0 Architecture
 * 
 * Features:
 * - Dynamic Forms & Fields
 * - Workflow Templates
 * - KPI Definitions
 * - Plant Configurations
 * - Notification Rules
 * - Industry Standards (ISO, FDA, AS9100)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ============================================================================
// TYPES - Dynamic Configuration System
// ============================================================================

export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'select' 
  | 'multiselect'
  | 'date' 
  | 'datetime' 
  | 'checkbox' 
  | 'checkbox-group'
  | 'radio'
  | 'file'
  | 'signature'
  | 'barcode'
  | 'relation'
  | 'calculated'
  | 'formula'
  | 'lookup'
  | 'button-group'
  | 'chart';

export type ChartType = 'bar' | 'line' | 'pie' | 'pareto';

export interface ChartDataPoint {
  x: string;
  y: number;
}

export interface ChartConfig {
  id: string;
  chartType: ChartType;
  title: string;
  xLabel?: string;
  yLabel?: string;
  seriesLabel?: string;
  dataMode: 'manual' | 'bind';
  manualData?: ChartDataPoint[];
  bind?: {
    xField?: string;
    yField?: string;
  };
  order: number;
}

export interface AnalyticsConfig {
  enabled: boolean;
  dashboardTitle?: string;
  charts: ChartConfig[];
}

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  customValidation?: string;
}

export interface FieldOption {
  value: string;
  label: string;
  color?: string;
  icon?: string;
}

export interface OptionSet {
  id: string;
  name: string;
  items: FieldOption[];
}

export interface FormulaConfig {
  expression: string;
  variables: string[];
  precision?: number;
}

export interface LookupConfig {
  sourceType: 'internal' | 'external' | 'excel';
  sourceFormId?: string; // For internal
  sourceField?: string;
  externalSourceId?: string; // For external/excel
  matchField?: string; // Field to match current value
  filterField?: string;
  filterValue?: string;
  multiple?: boolean;
  displayFields?: string[];
  excelUrl?: string;
}

export interface ExternalDataSource {
  id: string;
  name: string;
  type: 'excel' | 'csv' | 'json' | 'api';
  url?: string;
  data?: any[];
  lastUpdated?: string;
}

export interface FieldDependency {
  fieldId: string;
  dependsOnField: string;
  expression?: string;
  condition?: {
    operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains';
    value: unknown;
  };
}

export interface DynamicField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  description?: string;
  placeholder?: string;
  defaultValue?: unknown;
  options?: FieldOption[];
  optionSetId?: string;
  validation?: FieldValidation;
  conditionalLogic?: ConditionalRule[];
  dependsOn?: string;
  visible: boolean;
  editable: boolean;
  order: number;
  section?: string;
  helpText?: string;
  tooltip?: string;
  apiEndpoint?: string; // For dynamic data fetching
  // Formula field
  formula?: FormulaConfig;
  // Lookup field
  lookup?: LookupConfig;
  qualityLookup?: {
    sourceTable: 'parts' | 'models' | 'defects' | 'lines' | 'suppliers' | 'customers' | 'cost-rules' | 'escalation-rules' | 'inspection-points';
    keyColumn: string;
    displayColumn: string;
    searchColumns?: string[];
    autoFillMappings?: Array<{ sourceColumn: string; targetField: string; readOnly?: boolean }>;
    fillEmptyOnly?: boolean;
    overwriteBehavior?: 'fill-empty-only' | 'read-only-only' | 'ask-before-overwrite' | 'always-overwrite';
  };
  roleVisibility?: {
    visibleTo?: string[];
    editableBy?: string[];
  };
  modeVisibility?: {
    create?: boolean;
    edit?: boolean;
    detail?: boolean;
  };
  // Chart field
  chart?: ChartConfig;
  // Field dependencies
  dependencies?: FieldDependency[];
  // Computed field (auto-calculated based on other fields)
  computed?: {
    expression: string;
    watchFields: string[];
  };
}

export interface ConditionalRule {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty';
  value: unknown;
  action: 'show' | 'hide' | 'require' | 'disable';
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  collapsible?: boolean;
  collapsedByDefault?: boolean;
  fields: string[]; // Field IDs
}

export interface DynamicForm {
  id: string;
  name: string;
  description?: string;
  type: 'ncr' | 'capa' | '8d' | 'deviation' | 'change-control' | 'control-plan' | 'complaint' | 'audit' | 'fmea' | 'supplier' | 'inspection' | 'calibration' | 'defect-log' | 'custom';
  version: number;
  isActive: boolean;
  industryStandard?: 'ISO9001' | 'ISO13485' | 'AS9100' | 'FDA' | 'IATF16949' | 'custom';
  sections: FormSection[];
  fields: DynamicField[];
  analytics?: AnalyticsConfig;
  workflowId?: string;
  autoNumbering?: {
    enabled: boolean;
    prefix: string;
    suffix?: string;
    startingNumber: number;
  };
  approvals?: {
    required: boolean;
    levels: ApprovalLevel[];
  };
  notifications?: NotificationRule[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ApprovalLevel {
  level: number;
  name: string;
  approvers: string[]; // Role IDs or User IDs
  condition?: string; // Conditional logic
  autoApproveAfter?: number; // Hours
  escalationEnabled?: boolean;
}

export interface NotificationRule {
  id: string;
  name: string;
  trigger: 'create' | 'update' | 'delete' | 'statusChange' | 'approval' | 'escalation' | 'schedule';
  conditions?: ConditionalRule[];
  recipients: {
    type: 'user' | 'role' | 'department' | 'creator' | 'assignee' | 'manager';
    id: string;
  }[];
  channels: ('email' | 'sms' | 'push' | 'inApp' | 'webhook')[];
  template: string;
  enabled: boolean;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'start' | 'task' | 'approval' | 'decision' | 'automation' | 'end';
  position: { x: number; y: number };
  config: {
    assignee?: string;
    dueDate?: number; // Hours from start
    autoActions?: string[];
    conditions?: ConditionalRule[];
  };
}

export interface WorkflowConnection {
  id: string;
  from: string;
  to: string;
  condition?: string;
  label?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'quality' | 'admin' | 'custom';
  isActive: boolean;
  steps: WorkflowStep[];
  connections: WorkflowConnection[];
  applicableForms: string[]; // Form IDs
  createdAt: string;
  updatedAt: string;
}

export interface KPIDefinition {
  id: string;
  name: string;
  description?: string;
  category: 'quality' | 'efficiency' | 'compliance' | 'safety' | 'cost';
  formula: string;
  dataSource: {
    type: 'form' | 'api' | 'database' | 'iot';
    sourceId: string;
    filters?: Record<string, unknown>;
  };
  target?: {
    value: number;
    operator: 'greaterThan' | 'lessThan' | 'equals' | 'between';
    range?: [number, number];
  };
  threshold?: {
    warning: number;
    critical: number;
  };
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  visualization: 'gauge' | 'chart' | 'number' | 'trend';
  isActive: boolean;
}

export interface PlantConfig {
  id: string;
  name: string;
  code: string;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  timezone: string;
  currency: string;
  departments: DepartmentConfig[];
  shifts: ShiftConfig[];
  iotEnabled: boolean;
  activeFormIds: string[];
  activeWorkflowIds: string[];
  customSettings?: Record<string, unknown>;
  isActive: boolean;
}

export interface DepartmentConfig {
  id: string;
  name: string;
  code: string;
  manager?: string;
  parentId?: string;
}

export interface ShiftConfig {
  id: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string;
  days: number[]; // 0-6 (Sunday-Saturday)
}

export interface ChartSettings {
  dashboard: {
    seriesEnabled: Record<string, boolean>;
    seriesColors: Record<string, string>;
  };
  executive: {
    seriesEnabled: Record<string, boolean>;
    seriesColors: Record<string, string>;
  };
  iot: {
    refreshInterval: number;
    maxDataPoints: number;
    showSPC: boolean;
    showAnomalies: boolean;
  };
  spc: {
    showZones: boolean;
    controlLimits: {
      ucl: number;
      cl: number;
      lcl: number;
    };
    specLimits: {
      usl: number;
      lsl: number;
    };
    enabledRules: Record<string, boolean>;
    characteristics: Array<{
      id: number;
      name: string;
      process: string;
      cpk: number;
      status: string;
      samples: number;
      controlLimits?: {
        ucl: number;
        cl: number;
        lcl: number;
      };
      specLimits?: {
        usl: number;
        lsl: number;
      };
    }>;
  };
}

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface ConfigState {
  // Forms
  forms: DynamicForm[];
  activeForm: DynamicForm | null;

  externalDataSources: ExternalDataSource[];
  optionSets: OptionSet[];

  chartSettings: ChartSettings;
  
  // Workflows
  workflows: WorkflowTemplate[];
  activeWorkflow: WorkflowTemplate | null;
  
  // KPIs
  kpis: KPIDefinition[];
  
  // Plants
  plants: PlantConfig[];
  currentPlantId: string | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions - Forms
  setActiveForm: (form: DynamicForm | null) => void;
  addForm: (form: Omit<DynamicForm, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateForm: (id: string, updates: Partial<DynamicForm>) => void;
  deleteForm: (id: string) => void;
  cloneForm: (id: string, newName: string) => void;
  getFormByType: (type: DynamicForm['type']) => DynamicForm | undefined;

  // Actions - External Data Sources
  addExternalDataSource: (source: Omit<ExternalDataSource, 'id' | 'lastUpdated'>) => void;
  updateExternalDataSource: (id: string, updates: Partial<ExternalDataSource>) => void;
  deleteExternalDataSource: (id: string) => void;
  refreshExternalDataSource: (id: string) => Promise<void>;

  reinitializeDefaults: () => void;
  upsertOptionSet: (set: OptionSet) => void;
  updateOptionSetItems: (id: string, items: FieldOption[]) => void;
  deleteOptionSet: (id: string) => void;
  getOptionSet: (id: string) => OptionSet | undefined;
  
  // Actions - Workflows
  setActiveWorkflow: (workflow: WorkflowTemplate | null) => void;
  addWorkflow: (workflow: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateWorkflow: (id: string, updates: Partial<WorkflowTemplate>) => void;
  deleteWorkflow: (id: string) => void;
  
  // Actions - KPIs
  addKPI: (kpi: Omit<KPIDefinition, 'id'>) => void;
  updateKPI: (id: string, updates: Partial<KPIDefinition>) => void;
  deleteKPI: (id: string) => void;
  
  // Actions - Plants
  setCurrentPlant: (plantId: string) => void;
  addPlant: (plant: Omit<PlantConfig, 'id'>) => void;
  updatePlant: (id: string, updates: Partial<PlantConfig>) => void;
  deletePlant: (id: string) => void;
  getCurrentPlant: () => PlantConfig | undefined;

  setChartSettings: (updates: Partial<ChartSettings>) => void;
  
  // Utility
  loadDefaultConfigs: () => void;
  exportConfig: () => string;
  importConfig: (json: string) => void;
  resetToDefaults: () => void;
}

// ============================================================================
// DEFAULT CONFIGURATIONS - Industry Standards
// ============================================================================

const defaultNCRForm: DynamicForm = {
  id: 'ncr-default',
  name: 'Non-Conformance Report (NCR)',
  description: 'Standard NCR form for documenting quality issues',
  type: 'ncr',
  version: 1,
  isActive: true,
  industryStandard: 'ISO9001',
  sections: [
    {
      id: 'basic-info',
      title: 'Basic Information',
      order: 1,
      collapsible: false,
      fields: ['ncr-number', 'date', 'plant', 'department', 'reporter']
    },
    {
      id: 'issue-details',
      title: 'Issue Details',
      order: 2,
      collapsible: true,
      fields: ['product', 'lot-number', 'quantity', 'defect-type', 'severity', 'description']
    },
    {
      id: 'investigation',
      title: 'Investigation',
      order: 3,
      collapsible: true,
      collapsedByDefault: true,
      fields: ['root-cause', 'containment', 'responsible']
    }
  ],
  fields: [
    {
      id: 'ncr-number',
      name: 'ncrNumber',
      label: 'NCR Number',
      type: 'text',
      validation: { required: true },
      visible: true,
      editable: false,
      order: 1,
      section: 'basic-info'
    },
    {
      id: 'date',
      name: 'date',
      label: 'Date',
      type: 'datetime',
      defaultValue: new Date().toISOString(),
      validation: { required: true },
      visible: true,
      editable: true,
      order: 2,
      section: 'basic-info'
    },
    {
      id: 'plant',
      name: 'plantId',
      label: 'Plant',
      type: 'select',
      optionSetId: 'factories',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 3,
      section: 'basic-info'
    },
    {
      id: 'department',
      name: 'departmentId',
      label: 'Department',
      type: 'select',
      optionSetId: 'departments',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 4,
      section: 'basic-info',
      dependsOn: 'plant'
    },
    {
      id: 'reporter',
      name: 'reporterId',
      label: 'Reported By',
      type: 'select',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 5,
      section: 'basic-info'
    },
    {
      id: 'product',
      name: 'productId',
      label: 'Product / Part Number',
      type: 'relation',
      apiEndpoint: '/api/products',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 6,
      section: 'issue-details'
    },
    {
      id: 'lot-number',
      name: 'lotNumber',
      label: 'Lot / Batch Number',
      type: 'text',
      validation: { required: true, maxLength: 50 },
      visible: true,
      editable: true,
      order: 7,
      section: 'issue-details'
    },
    {
      id: 'quantity',
      name: 'quantity',
      label: 'Quantity Affected',
      type: 'number',
      validation: { required: true, min: 1 },
      visible: true,
      editable: true,
      order: 8,
      section: 'issue-details'
    },
    {
      id: 'defect-type',
      name: 'defectType',
      label: 'Defect Type',
      type: 'select',
      options: [
        { value: 'dimensional', label: 'Dimensional', color: '#F59E0B' },
        { value: 'visual', label: 'Visual / Cosmetic', color: '#EF4444' },
        { value: 'functional', label: 'Functional', color: '#DC2626' },
        { value: 'material', label: 'Material', color: '#7C3AED' },
        { value: 'documentation', label: 'Documentation', color: '#3B82F6' },
        { value: 'packaging', label: 'Packaging', color: '#10B981' }
      ],
      validation: { required: true },
      visible: true,
      editable: true,
      order: 9,
      section: 'issue-details'
    },
    {
      id: 'severity',
      name: 'severity',
      label: 'Severity Level',
      type: 'select',
      options: [
        { value: 'critical', label: 'Critical - Stop Production', color: '#DC2626' },
        { value: 'major', label: 'Major - Customer Impact', color: '#F59E0B' },
        { value: 'minor', label: 'Minor - Internal Only', color: '#3B82F6' },
        { value: 'observation', label: 'Observation', color: '#10B981' }
      ],
      validation: { required: true },
      visible: true,
      editable: true,
      order: 10,
      section: 'issue-details'
    },
    {
      id: 'description',
      name: 'description',
      label: 'Problem Description',
      type: 'textarea',
      placeholder: 'Describe the non-conformance in detail...',
      validation: { required: true, minLength: 20 },
      visible: true,
      editable: true,
      order: 11,
      section: 'issue-details'
    },
    {
      id: 'root-cause',
      name: 'rootCause',
      label: 'Root Cause Analysis',
      type: 'select',
      options: [
        { value: 'man', label: 'Man (Operator Error)' },
        { value: 'machine', label: 'Machine (Equipment)' },
        { value: 'material', label: 'Material' },
        { value: 'method', label: 'Method (Process)' },
        { value: 'measurement', label: 'Measurement' },
        { value: 'environment', label: 'Environment (5M+E)' }
      ],
      visible: true,
      editable: true,
      order: 12,
      section: 'investigation'
    },
    {
      id: 'containment',
      name: 'containment',
      label: 'Immediate Containment Action',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 13,
      section: 'investigation'
    },
    {
      id: 'responsible',
      name: 'responsibleId',
      label: 'Responsible Person',
      type: 'select',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 14,
      section: 'investigation'
    }
  ],
  autoNumbering: {
    enabled: true,
    prefix: 'NCR-',
    startingNumber: 1000
  },
  approvals: {
    required: true,
    levels: [
      { level: 1, name: 'Department Manager', approvers: ['dept-manager'] },
      { level: 2, name: 'Quality Manager', approvers: ['quality-manager'], condition: 'severity !== "minor"' }
    ]
  },
  notifications: [
    {
      id: 'ncr-create',
      name: 'NCR Created',
      trigger: 'create',
      recipients: [{ type: 'role', id: 'quality-manager' }],
      channels: ['email', 'inApp'],
      template: 'ncr-created',
      enabled: true
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system'
};

const defaultCAPAForm: DynamicForm = {
  id: 'capa-default',
  name: 'Corrective & Preventive Action (CAPA)',
  description: 'CAPA form for systematic problem solving',
  type: 'capa',
  version: 1,
  isActive: true,
  industryStandard: 'ISO9001',
  sections: [
    {
      id: 'capa-info',
      title: 'CAPA Information',
      order: 1,
      collapsible: false,
      fields: ['capa-number', 'source-ncr', 'title', 'category']
    },
    {
      id: 'problem-analysis',
      title: 'Problem Analysis',
      order: 2,
      fields: ['problem-statement', 'fishbone-analysis', '5-why']
    },
    {
      id: 'actions',
      title: 'Actions',
      order: 3,
      fields: ['corrective-action', 'preventive-action', 'implementation-date']
    },
    {
      id: 'verification',
      title: 'Verification & Closure',
      order: 4,
      collapsedByDefault: true,
      fields: ['effectiveness-check', 'evidence', 'closed-by']
    }
  ],
  fields: [
    {
      id: 'capa-number',
      name: 'capaNumber',
      label: 'CAPA Number',
      type: 'text',
      validation: { required: true },
      visible: true,
      editable: false,
      order: 1,
      section: 'capa-info'
    },
    {
      id: 'source-ncr',
      name: 'sourceNCRId',
      label: 'Source NCR',
      type: 'relation',
      apiEndpoint: '/api/ncr',
      visible: true,
      editable: true,
      order: 2,
      section: 'capa-info'
    },
    {
      id: 'title',
      name: 'title',
      label: 'CAPA Title',
      type: 'text',
      validation: { required: true, maxLength: 100 },
      visible: true,
      editable: true,
      order: 3,
      section: 'capa-info'
    },
    {
      id: 'category',
      name: 'category',
      label: 'CAPA Category',
      type: 'select',
      options: [
        { value: 'product', label: 'Product Quality' },
        { value: 'process', label: 'Process' },
        { value: 'system', label: 'QMS System' },
        { value: 'supplier', label: 'Supplier' },
        { value: 'customer', label: 'Customer Complaint' }
      ],
      validation: { required: true },
      visible: true,
      editable: true,
      order: 4,
      section: 'capa-info'
    },
    {
      id: 'problem-statement',
      name: 'problemStatement',
      label: 'Problem Statement',
      type: 'textarea',
      validation: { required: true, minLength: 30 },
      visible: true,
      editable: true,
      order: 5,
      section: 'problem-analysis'
    },
    {
      id: 'fishbone-analysis',
      name: 'fishboneAnalysis',
      label: 'Fishbone (Ishikawa) Analysis',
      type: 'textarea',
      placeholder: 'Identify causes in each category: Man, Machine, Material, Method, Measurement, Environment',
      visible: true,
      editable: true,
      order: 6,
      section: 'problem-analysis'
    },
    {
      id: '5-why',
      name: 'fiveWhy',
      label: '5-Why Analysis',
      type: 'textarea',
      placeholder: 'Why? → Why? → Why? → Why? → Why? → Root Cause',
      visible: true,
      editable: true,
      order: 7,
      section: 'problem-analysis'
    },
    {
      id: 'corrective-action',
      name: 'correctiveAction',
      label: 'Corrective Action',
      type: 'textarea',
      helpText: 'Action to eliminate the detected non-conformity',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 8,
      section: 'actions'
    },
    {
      id: 'preventive-action',
      name: 'preventiveAction',
      label: 'Preventive Action',
      type: 'textarea',
      helpText: 'Action to prevent recurrence or occurrence',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 9,
      section: 'actions'
    },
    {
      id: 'implementation-date',
      name: 'implementationDate',
      label: 'Target Implementation Date',
      type: 'date',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 10,
      section: 'actions'
    },
    {
      id: 'effectiveness-check',
      name: 'effectivenessCheck',
      label: 'Effectiveness Verification',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending', color: '#F59E0B' },
        { value: 'effective', label: 'Effective', color: '#10B981' },
        { value: 'ineffective', label: 'Ineffective - Reopen CAPA', color: '#DC2626' }
      ],
      visible: true,
      editable: true,
      order: 11,
      section: 'verification'
    },
    {
      id: 'evidence',
      name: 'evidence',
      label: 'Evidence of Effectiveness',
      type: 'file',
      visible: true,
      editable: true,
      order: 12,
      section: 'verification'
    },
    {
      id: 'closed-by',
      name: 'closedBy',
      label: 'Closed By',
      type: 'select',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 13,
      section: 'verification'
    }
  ],
  autoNumbering: {
    enabled: true,
    prefix: 'CAPA-',
    startingNumber: 1000
  },
  approvals: {
    required: true,
    levels: [
      { level: 1, name: 'Team Leader', approvers: ['team-lead'] },
      { level: 2, name: 'Quality Manager', approvers: ['quality-manager'] },
      { level: 3, name: 'Effectiveness Review', approvers: ['quality-director'], autoApproveAfter: 720 }
    ]
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system'
};

const defaultAuditForm: DynamicForm = {
  id: 'audit-default',
  name: 'Internal Quality Audit',
  description: 'Standard audit form for conducting quality audits',
  type: 'audit',
  version: 1,
  isActive: true,
  industryStandard: 'ISO9001',
  sections: [
    {
      id: 'audit-info',
      title: 'Audit Information',
      order: 1,
      collapsible: false,
      fields: ['audit-number', 'audit-type', 'scheduled-date', 'auditor', 'auditee']
    },
    {
      id: 'audit-scope',
      title: 'Scope & Criteria',
      order: 2,
      fields: ['scope', 'standard', 'department']
    },
    {
      id: 'findings',
      title: 'Audit Findings',
      order: 3,
      collapsedByDefault: true,
      fields: ['findings-summary', 'nc-identified', 'recommendations']
    }
  ],
  fields: [
    {
      id: 'audit-number',
      name: 'auditNumber',
      label: 'Audit Number',
      type: 'text',
      validation: { required: true },
      visible: true,
      editable: false,
      order: 1,
      section: 'audit-info'
    },
    {
      id: 'audit-type',
      name: 'auditType',
      label: 'Audit Type',
      type: 'select',
      options: [
        { value: 'internal', label: 'Internal Audit' },
        { value: 'external', label: 'External Audit' },
        { value: 'supplier', label: 'Supplier Audit' },
        { value: 'regulatory', label: 'Regulatory Audit' }
      ],
      validation: { required: true },
      visible: true,
      editable: true,
      order: 2,
      section: 'audit-info'
    },
    {
      id: 'scheduled-date',
      name: 'scheduledDate',
      label: 'Scheduled Date',
      type: 'date',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 3,
      section: 'audit-info'
    },
    {
      id: 'auditor',
      name: 'auditor',
      label: 'Auditor',
      type: 'select',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 4,
      section: 'audit-info'
    },
    {
      id: 'auditee',
      name: 'auditee',
      label: 'Auditee',
      type: 'select',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 5,
      section: 'audit-info'
    },
    {
      id: 'scope',
      name: 'scope',
      label: 'Audit Scope',
      type: 'textarea',
      placeholder: 'Define the scope of this audit...',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 6,
      section: 'audit-scope'
    },
    {
      id: 'standard',
      name: 'standard',
      label: 'Standard / Reference',
      type: 'select',
      options: [
        { value: 'ISO9001', label: 'ISO 9001:2015' },
        { value: 'ISO13485', label: 'ISO 13485' },
        { value: 'AS9100', label: 'AS9100' },
        { value: 'FDA', label: 'FDA 21 CFR' },
        { value: 'Internal', label: 'Internal Procedures' }
      ],
      validation: { required: true },
      visible: true,
      editable: true,
      order: 7,
      section: 'audit-scope'
    },
    {
      id: 'department',
      name: 'department',
      label: 'Department to Audit',
      type: 'select',
      options: [],
      validation: { required: true },
      visible: true,
      editable: true,
      order: 8,
      section: 'audit-scope'
    },
    {
      id: 'findings-summary',
      name: 'findingsSummary',
      label: 'Findings Summary',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 9,
      section: 'findings'
    },
    {
      id: 'nc-identified',
      name: 'ncIdentified',
      label: 'Non-Conformances Identified',
      type: 'number',
      defaultValue: 0,
      visible: true,
      editable: true,
      order: 10,
      section: 'findings'
    },
    {
      id: 'recommendations',
      name: 'recommendations',
      label: 'Recommendations',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 11,
      section: 'findings'
    }
  ],
  autoNumbering: {
    enabled: true,
    prefix: 'AUD-',
    startingNumber: 100
  },
  approvals: {
    required: true,
    levels: [
      { level: 1, name: 'Audit Lead', approvers: ['auditor'] },
      { level: 2, name: 'Quality Manager', approvers: ['quality-manager'] }
    ]
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system'
};

// ============================================================================
// 8D REPORT FORM - Complete 8 Disciplines
// ============================================================================

const default8DForm: DynamicForm = {
  id: '8d-default',
  name: '8D Problem Solving Report',
  description: 'Eight Disciplines methodology for problem solving',
  type: '8d',
  version: 1,
  isActive: true,
  industryStandard: 'ISO9001',
  sections: [
    {
      id: 'd0-preparation',
      title: 'D0: Emergency Response & Preparation',
      order: 1,
      collapsible: false,
      fields: ['8d-number', 'symptom-description', 'emergency-response', 'date-detected']
    },
    {
      id: 'd1-team',
      title: 'D1: Establish the Team',
      order: 2,
      fields: ['team-leader', 'team-members', 'department', 'champion']
    },
    {
      id: 'd2-problem',
      title: 'D2: Describe the Problem',
      order: 3,
      fields: ['problem-title', 'product-name', 'production-line', 'lot-number', 'problem-description', 'customer-impact']
    },
    {
      id: 'd3-containment',
      title: 'D3: Containment Actions',
      order: 4,
      fields: ['immediate-action', 'containment-responsible', 'containment-date', 'quantity-contained']
    },
    {
      id: 'd4-root-cause',
      title: 'D4: Root Cause Analysis',
      order: 5,
      fields: ['analysis-method', 'why-analysis', 'fishbone-analysis', 'root-cause-description', 'supporting-evidence']
    },
    {
      id: 'd5-corrective',
      title: 'D5: Corrective Actions',
      order: 6,
      fields: ['corrective-action-desc', 'corrective-responsible', 'target-date-corrective', 'verification-plan']
    },
    {
      id: 'd6-implementation',
      title: 'D6: Implementation & Validation',
      order: 7,
      fields: ['implementation-date', 'implementation-notes', 'validation-results', 'effectiveness-check']
    },
    {
      id: 'd7-prevention',
      title: 'D7: Prevent Recurrence',
      order: 8,
      fields: ['preventive-action-plan', 'process-changes', 'training-required', 'documentation-updates']
    },
    {
      id: 'd8-closure',
      title: 'D8: Team Recognition & Closure',
      order: 9,
      fields: ['verification-result', 'closure-date', 'closed-by', 'lessons-learned', 'team-recognition']
    }
  ],
  fields: [
    {
      id: '8d-number',
      name: 'eightDNumber',
      label: '8D Report Number',
      type: 'text',
      validation: { required: true },
      visible: true,
      editable: false,
      order: 1,
      section: 'd0-preparation'
    },
    {
      id: 'symptom-description',
      name: 'symptomDescription',
      label: 'Symptom Description',
      type: 'textarea',
      validation: { required: true, minLength: 20 },
      visible: true,
      editable: true,
      order: 2,
      section: 'd0-preparation'
    },
    {
      id: 'emergency-response',
      name: 'emergencyResponse',
      label: 'Emergency Response Action',
      type: 'textarea',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 3,
      section: 'd0-preparation'
    },
    {
      id: 'date-detected',
      name: 'dateDetected',
      label: 'Date Detected',
      type: 'date',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 4,
      section: 'd0-preparation'
    },
    {
      id: 'team-leader',
      name: 'teamLeader',
      label: 'Team Leader',
      type: 'select',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 5,
      section: 'd1-team'
    },
    {
      id: 'team-members',
      name: 'teamMembers',
      label: 'Team Members',
      type: 'multiselect',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 6,
      section: 'd1-team'
    },
    {
      id: 'department',
      name: 'department',
      label: 'Department',
      type: 'select',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 7,
      section: 'd1-team'
    },
    {
      id: 'champion',
      name: 'champion',
      label: 'Process Champion',
      type: 'select',
      visible: true,
      editable: true,
      order: 8,
      section: 'd1-team'
    },
    {
      id: 'problem-title',
      name: 'problemTitle',
      label: 'Problem Title',
      type: 'text',
      validation: { required: true, maxLength: 100 },
      visible: true,
      editable: true,
      order: 9,
      section: 'd2-problem'
    },
    {
      id: 'product-name',
      name: 'productName',
      label: 'Product Name',
      type: 'text',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 10,
      section: 'd2-problem'
    },
    {
      id: 'production-line',
      name: 'productionLine',
      label: 'Production Line',
      type: 'select',
      visible: true,
      editable: true,
      order: 11,
      section: 'd2-problem'
    },
    {
      id: 'lot-number',
      name: 'lotNumber',
      label: 'Lot/Batch Number',
      type: 'text',
      visible: true,
      editable: true,
      order: 12,
      section: 'd2-problem'
    },
    {
      id: 'problem-description',
      name: 'problemDescription',
      label: 'Detailed Problem Description (What, Where, When, How)',
      type: 'textarea',
      validation: { required: true, minLength: 30 },
      placeholder: 'Describe the problem with 5W2H methodology...',
      visible: true,
      editable: true,
      order: 13,
      section: 'd2-problem'
    },
    {
      id: 'customer-impact',
      name: 'customerImpact',
      label: 'Customer Impact',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 14,
      section: 'd2-problem'
    },
    {
      id: 'immediate-action',
      name: 'immediateAction',
      label: 'Immediate Containment Action',
      type: 'textarea',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 15,
      section: 'd3-containment'
    },
    {
      id: 'containment-responsible',
      name: 'containmentResponsible',
      label: 'Responsible Person',
      type: 'select',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 16,
      section: 'd3-containment'
    },
    {
      id: 'containment-date',
      name: 'containmentDate',
      label: 'Containment Date',
      type: 'date',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 17,
      section: 'd3-containment'
    },
    {
      id: 'quantity-contained',
      name: 'quantityContained',
      label: 'Quantity Contained',
      type: 'number',
      visible: true,
      editable: true,
      order: 18,
      section: 'd3-containment'
    },
    {
      id: 'analysis-method',
      name: 'analysisMethod',
      label: 'Analysis Method',
      type: 'select',
      options: [
        { value: '5why', label: '5 Why Analysis' },
        { value: 'fishbone', label: 'Fishbone (Ishikawa)' },
        { value: 'fmea', label: 'FMEA' },
        { value: 'fault-tree', label: 'Fault Tree Analysis' },
        { value: 'pareto', label: 'Pareto Analysis' },
        { value: 'scatter', label: 'Scatter Diagram' }
      ],
      validation: { required: true },
      visible: true,
      editable: true,
      order: 19,
      section: 'd4-root-cause'
    },
    {
      id: 'why-analysis',
      name: 'whyAnalysis',
      label: '5-Why Analysis',
      type: 'textarea',
      placeholder: 'Why? → Why? → Why? → Why? → Why? → Root Cause',
      visible: true,
      editable: true,
      order: 20,
      section: 'd4-root-cause'
    },
    {
      id: 'fishbone-analysis',
      name: 'fishboneAnalysis',
      label: 'Fishbone Analysis',
      type: 'textarea',
      placeholder: 'Man, Machine, Material, Method, Measurement, Environment...',
      visible: true,
      editable: true,
      order: 21,
      section: 'd4-root-cause'
    },
    {
      id: 'root-cause-description',
      name: 'rootCauseDescription',
      label: 'Root Cause Description',
      type: 'textarea',
      validation: { required: true, minLength: 20 },
      visible: true,
      editable: true,
      order: 22,
      section: 'd4-root-cause'
    },
    {
      id: 'supporting-evidence',
      name: 'supportingEvidence',
      label: 'Supporting Evidence',
      type: 'file',
      visible: true,
      editable: true,
      order: 23,
      section: 'd4-root-cause'
    },
    {
      id: 'corrective-action-desc',
      name: 'correctiveActionDesc',
      label: 'Corrective Action Description',
      type: 'textarea',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 24,
      section: 'd5-corrective'
    },
    {
      id: 'corrective-responsible',
      name: 'correctiveResponsible',
      label: 'Responsible Person',
      type: 'select',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 25,
      section: 'd5-corrective'
    },
    {
      id: 'target-date-corrective',
      name: 'targetDateCorrective',
      label: 'Target Completion Date',
      type: 'date',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 26,
      section: 'd5-corrective'
    },
    {
      id: 'verification-plan',
      name: 'verificationPlan',
      label: 'Verification Plan',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 27,
      section: 'd5-corrective'
    },
    {
      id: 'implementation-date',
      name: 'implementationDate',
      label: 'Implementation Date',
      type: 'date',
      visible: true,
      editable: true,
      order: 28,
      section: 'd6-implementation'
    },
    {
      id: 'implementation-notes',
      name: 'implementationNotes',
      label: 'Implementation Notes',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 29,
      section: 'd6-implementation'
    },
    {
      id: 'validation-results',
      name: 'validationResults',
      label: 'Validation Results',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 30,
      section: 'd6-implementation'
    },
    {
      id: 'effectiveness-check',
      name: 'effectivenessCheck',
      label: 'Effectiveness Check',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending', color: '#F59E0B' },
        { value: 'effective', label: 'Effective', color: '#10B981' },
        { value: 'ineffective', label: 'Ineffective', color: '#DC2626' }
      ],
      visible: true,
      editable: true,
      order: 31,
      section: 'd6-implementation'
    },
    {
      id: 'preventive-action-plan',
      name: 'preventiveActionPlan',
      label: 'Preventive Action Plan',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 32,
      section: 'd7-prevention'
    },
    {
      id: 'process-changes',
      name: 'processChanges',
      label: 'Process Changes',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 33,
      section: 'd7-prevention'
    },
    {
      id: 'training-required',
      name: 'trainingRequired',
      label: 'Training Required',
      type: 'checkbox',
      visible: true,
      editable: true,
      order: 34,
      section: 'd7-prevention'
    },
    {
      id: 'documentation-updates',
      name: 'documentationUpdates',
      label: 'Documentation Updates',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 35,
      section: 'd7-prevention'
    },
    {
      id: 'verification-result',
      name: 'verificationResult',
      label: 'Final Verification Result',
      type: 'select',
      options: [
        { value: 'pass', label: 'Pass - Problem Resolved', color: '#10B981' },
        { value: 'fail', label: 'Fail - Needs Reopening', color: '#DC2626' }
      ],
      validation: { required: true },
      visible: true,
      editable: true,
      order: 36,
      section: 'd8-closure'
    },
    {
      id: 'closure-date',
      name: 'closureDate',
      label: 'Closure Date',
      type: 'date',
      visible: true,
      editable: true,
      order: 37,
      section: 'd8-closure'
    },
    {
      id: 'closed-by',
      name: 'closedBy',
      label: 'Closed By',
      type: 'select',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 38,
      section: 'd8-closure'
    },
    {
      id: 'lessons-learned',
      name: 'lessonsLearned',
      label: 'Lessons Learned',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 39,
      section: 'd8-closure'
    },
    {
      id: 'team-recognition',
      name: 'teamRecognition',
      label: 'Team Recognition',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 40,
      section: 'd8-closure'
    }
  ],
  autoNumbering: {
    enabled: true,
    prefix: '8D-',
    startingNumber: 1000
  },
  approvals: {
    required: true,
    levels: [
      { level: 1, name: 'Team Leader', approvers: ['team-leader'] },
      { level: 2, name: 'Department Manager', approvers: ['dept-manager'] },
      { level: 3, name: 'Quality Manager', approvers: ['quality-manager'] },
      { level: 4, name: 'Final Closure', approvers: ['quality-director'] }
    ]
  },
  notifications: [
    {
      id: '8d-create',
      name: '8D Created',
      trigger: 'create',
      recipients: [{ type: 'role', id: 'quality-manager' }],
      channels: ['email', 'inApp'],
      template: '8d-created',
      enabled: true
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system'
};

// ============================================================================
// DEVIATION REQUEST FORM
// ============================================================================

const defaultDeviationForm: DynamicForm = {
  id: 'deviation-default',
  name: 'Deviation Request',
  description: 'Request for temporary or permanent deviation from standard requirements',
  type: 'deviation',
  version: 1,
  isActive: true,
  industryStandard: 'ISO9001',
  sections: [
    {
      id: 'dev-info',
      title: 'Deviation Information',
      order: 1,
      collapsible: false,
      fields: ['deviation-id', 'deviation-type', 'status', 'requestor', 'request-date']
    },
    {
      id: 'request-details',
      title: 'Request Details',
      order: 2,
      fields: ['process-name', 'product-name', 'deviation-description', 'reason', 'affected-products']
    },
    {
      id: 'risk-assessment',
      title: 'Risk Assessment',
      order: 3,
      fields: ['risk-level', 'quality-impact', 'risk-analysis', 'mitigation-plan']
    },
    {
      id: 'approval-section',
      title: 'Approval Section',
      order: 4,
      fields: ['production-manager-approval', 'quality-manager-approval', 'engineering-manager-approval', 'effective-date', 'expiry-date']
    }
  ],
  fields: [
    {
      id: 'deviation-id',
      name: 'deviationId',
      label: 'Deviation ID',
      type: 'text',
      validation: { required: true },
      visible: true,
      editable: false,
      order: 1,
      section: 'dev-info'
    },
    {
      id: 'deviation-type',
      name: 'deviationType',
      label: 'Deviation Type',
      type: 'select',
      options: [
        { value: 'temporary', label: 'Temporary' },
        { value: 'permanent', label: 'Permanent' },
        { value: 'emergency', label: 'Emergency' }
      ],
      validation: { required: true },
      visible: true,
      editable: true,
      order: 2,
      section: 'dev-info'
    },
    {
      id: 'status',
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'under-review', label: 'Under Review' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'expired', label: 'Expired' }
      ],
      defaultValue: 'draft',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 3,
      section: 'dev-info'
    },
    {
      id: 'requestor',
      name: 'requestor',
      label: 'Requestor',
      type: 'select',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 4,
      section: 'dev-info'
    },
    {
      id: 'request-date',
      name: 'requestDate',
      label: 'Request Date',
      type: 'date',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 5,
      section: 'dev-info'
    },
    {
      id: 'process-name',
      name: 'processName',
      label: 'Process/Procedure Name',
      type: 'text',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 6,
      section: 'request-details'
    },
    {
      id: 'product-name',
      name: 'productName',
      label: 'Product Name',
      type: 'text',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 7,
      section: 'request-details'
    },
    {
      id: 'deviation-description',
      name: 'deviationDescription',
      label: 'Deviation Description',
      type: 'textarea',
      validation: { required: true, minLength: 20 },
      visible: true,
      editable: true,
      order: 8,
      section: 'request-details'
    },
    {
      id: 'reason',
      name: 'reason',
      label: 'Reason for Deviation',
      type: 'textarea',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 9,
      section: 'request-details'
    },
    {
      id: 'affected-products',
      name: 'affectedProducts',
      label: 'Affected Products/Lots',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 10,
      section: 'request-details'
    },
    {
      id: 'risk-level',
      name: 'riskLevel',
      label: 'Risk Level',
      type: 'select',
      options: [
        { value: 'low', label: 'Low', color: '#10B981' },
        { value: 'medium', label: 'Medium', color: '#F59E0B' },
        { value: 'high', label: 'High', color: '#DC2626' }
      ],
      validation: { required: true },
      visible: true,
      editable: true,
      order: 11,
      section: 'risk-assessment'
    },
    {
      id: 'quality-impact',
      name: 'qualityImpact',
      label: 'Impact on Quality',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 12,
      section: 'risk-assessment'
    },
    {
      id: 'risk-analysis',
      name: 'riskAnalysis',
      label: 'Risk Analysis',
      type: 'textarea',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 13,
      section: 'risk-assessment'
    },
    {
      id: 'mitigation-plan',
      name: 'mitigationPlan',
      label: 'Risk Mitigation Plan',
      type: 'textarea',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 14,
      section: 'risk-assessment'
    },
    {
      id: 'production-manager-approval',
      name: 'productionManagerApproval',
      label: 'Production Manager Approval',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved', color: '#10B981' },
        { value: 'rejected', label: 'Rejected', color: '#DC2626' }
      ],
      validation: { required: true },
      visible: true,
      editable: true,
      order: 15,
      section: 'approval-section'
    },
    {
      id: 'quality-manager-approval',
      name: 'qualityManagerApproval',
      label: 'Quality Manager Approval',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved', color: '#10B981' },
        { value: 'rejected', label: 'Rejected', color: '#DC2626' }
      ],
      validation: { required: true },
      visible: true,
      editable: true,
      order: 16,
      section: 'approval-section'
    },
    {
      id: 'engineering-manager-approval',
      name: 'engineeringManagerApproval',
      label: 'Engineering Manager Approval',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved', color: '#10B981' },
        { value: 'rejected', label: 'Rejected', color: '#DC2626' }
      ],
      validation: { required: true },
      visible: true,
      editable: true,
      order: 17,
      section: 'approval-section'
    },
    {
      id: 'effective-date',
      name: 'effectiveDate',
      label: 'Effective From',
      type: 'date',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 18,
      section: 'approval-section'
    },
    {
      id: 'expiry-date',
      name: 'expiryDate',
      label: 'Valid Until',
      type: 'date',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 19,
      section: 'approval-section'
    }
  ],
  autoNumbering: {
    enabled: true,
    prefix: 'DEV-',
    startingNumber: 1000
  },
  approvals: {
    required: true,
    levels: [
      { level: 1, name: 'Production Manager', approvers: ['production-manager'] },
      { level: 2, name: 'Quality Manager', approvers: ['quality-manager'] },
      { level: 3, name: 'Engineering Manager', approvers: ['engineering-manager'] }
    ]
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system'
};

// ============================================================================
// CHANGE CONTROL FORM
// ============================================================================

const defaultChangeControlForm: DynamicForm = {
  id: 'change-control-default',
  name: 'Change Control Request',
  description: 'Manage changes to processes, products, documents, and systems',
  type: 'change-control',
  version: 1,
  isActive: true,
  industryStandard: 'ISO9001',
  sections: [
    {
      id: 'change-info',
      title: 'Change Information',
      order: 1,
      collapsible: false,
      fields: ['change-request-id', 'change-type', 'change-category', 'status', 'proposed-by', 'proposed-date']
    },
    {
      id: 'change-details',
      title: 'Change Details',
      order: 2,
      fields: ['change-title', 'current-state', 'proposed-change', 'reason-for-change']
    },
    {
      id: 'impact-assessment',
      title: 'Impact Assessment',
      order: 3,
      fields: ['affected-product', 'affected-process', 'affected-documents', 'quality-impact', 'regulatory-impact', 'customer-impact']
    },
    {
      id: 'implementation',
      title: 'Implementation Plan',
      order: 4,
      fields: ['implementation-plan', 'validation-requirements', 'training-required', 'target-date']
    },
    {
      id: 'approval-workflow',
      title: 'Approval Workflow',
      order: 5,
      fields: ['reviewer', 'review-date', 'approver', 'approval-date', 'approval-comments']
    }
  ],
  fields: [
    {
      id: 'change-request-id',
      name: 'changeRequestId',
      label: 'Change Request ID',
      type: 'text',
      validation: { required: true },
      visible: true,
      editable: false,
      order: 1,
      section: 'change-info'
    },
    {
      id: 'change-type',
      name: 'changeType',
      label: 'Change Type',
      type: 'select',
      options: [
        { value: 'process', label: 'Process' },
        { value: 'product', label: 'Product' },
        { value: 'document', label: 'Document' },
        { value: 'system', label: 'System' },
        { value: 'supplier', label: 'Supplier' },
        { value: 'equipment', label: 'Equipment' }
      ],
      validation: { required: true },
      visible: true,
      editable: true,
      order: 2,
      section: 'change-info'
    },
    {
      id: 'change-category',
      name: 'changeCategory',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'minor', label: 'Minor' },
        { value: 'major', label: 'Major' },
        { value: 'critical', label: 'Critical' }
      ],
      validation: { required: true },
      visible: true,
      editable: true,
      order: 3,
      section: 'change-info'
    },
    {
      id: 'status',
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'proposed', label: 'Proposed' },
        { value: 'pending-review', label: 'Pending Review' },
        { value: 'approved', label: 'Approved' },
        { value: 'implemented', label: 'Implemented' },
        { value: 'closed', label: 'Closed' },
        { value: 'rejected', label: 'Rejected' }
      ],
      defaultValue: 'draft',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 4,
      section: 'change-info'
    },
    {
      id: 'proposed-by',
      name: 'proposedBy',
      label: 'Proposed By',
      type: 'select',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 5,
      section: 'change-info'
    },
    {
      id: 'proposed-date',
      name: 'proposedDate',
      label: 'Proposed Date',
      type: 'date',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 6,
      section: 'change-info'
    },
    {
      id: 'change-title',
      name: 'changeTitle',
      label: 'Change Title',
      type: 'text',
      validation: { required: true, maxLength: 100 },
      visible: true,
      editable: true,
      order: 7,
      section: 'change-details'
    },
    {
      id: 'current-state',
      name: 'currentState',
      label: 'Current State',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 8,
      section: 'change-details'
    },
    {
      id: 'proposed-change',
      name: 'proposedChange',
      label: 'Proposed Change',
      type: 'textarea',
      validation: { required: true, minLength: 20 },
      visible: true,
      editable: true,
      order: 9,
      section: 'change-details'
    },
    {
      id: 'reason-for-change',
      name: 'reasonForChange',
      label: 'Reason for Change',
      type: 'textarea',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 10,
      section: 'change-details'
    },
    {
      id: 'affected-product',
      name: 'affectedProduct',
      label: 'Affected Product',
      type: 'text',
      visible: true,
      editable: true,
      order: 11,
      section: 'impact-assessment'
    },
    {
      id: 'affected-process',
      name: 'affectedProcess',
      label: 'Affected Process',
      type: 'text',
      visible: true,
      editable: true,
      order: 12,
      section: 'impact-assessment'
    },
    {
      id: 'affected-documents',
      name: 'affectedDocuments',
      label: 'Affected Documents',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 13,
      section: 'impact-assessment'
    },
    {
      id: 'quality-impact',
      name: 'qualityImpact',
      label: 'Quality Impact',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 14,
      section: 'impact-assessment'
    },
    {
      id: 'regulatory-impact',
      name: 'regulatoryImpact',
      label: 'Regulatory Impact',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 15,
      section: 'impact-assessment'
    },
    {
      id: 'customer-impact',
      name: 'customerImpact',
      label: 'Customer Impact',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 16,
      section: 'impact-assessment'
    },
    {
      id: 'implementation-plan',
      name: 'implementationPlan',
      label: 'Implementation Plan',
      type: 'textarea',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 17,
      section: 'implementation'
    },
    {
      id: 'validation-requirements',
      name: 'validationRequirements',
      label: 'Validation Requirements',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 18,
      section: 'implementation'
    },
    {
      id: 'training-required',
      name: 'trainingRequired',
      label: 'Training Required',
      type: 'checkbox',
      visible: true,
      editable: true,
      order: 19,
      section: 'implementation'
    },
    {
      id: 'target-date',
      name: 'targetDate',
      label: 'Target Implementation Date',
      type: 'date',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 20,
      section: 'implementation'
    },
    {
      id: 'reviewer',
      name: 'reviewer',
      label: 'Reviewer',
      type: 'select',
      visible: true,
      editable: true,
      order: 21,
      section: 'approval-workflow'
    },
    {
      id: 'review-date',
      name: 'reviewDate',
      label: 'Review Date',
      type: 'date',
      visible: true,
      editable: true,
      order: 22,
      section: 'approval-workflow'
    },
    {
      id: 'approver',
      name: 'approver',
      label: 'Approver',
      type: 'select',
      visible: true,
      editable: true,
      order: 23,
      section: 'approval-workflow'
    },
    {
      id: 'approval-date',
      name: 'approvalDate',
      label: 'Approval Date',
      type: 'date',
      visible: true,
      editable: true,
      order: 24,
      section: 'approval-workflow'
    },
    {
      id: 'approval-comments',
      name: 'approvalComments',
      label: 'Approval Comments',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 25,
      section: 'approval-workflow'
    }
  ],
  autoNumbering: {
    enabled: true,
    prefix: 'CC-',
    startingNumber: 1000
  },
  approvals: {
    required: true,
    levels: [
      { level: 1, name: 'Department Manager', approvers: ['dept-manager'] },
      { level: 2, name: 'Quality Manager', approvers: ['quality-manager'] },
      { level: 3, name: 'Plant Manager', approvers: ['plant-manager'] }
    ]
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system'
};

// ============================================================================
// CUSTOMER COMPLAINT FORM
// ============================================================================

const defaultComplaintForm: DynamicForm = {
  id: 'complaint-default',
  name: 'Customer Complaint',
  description: 'Track and manage customer feedback and complaints',
  type: 'complaint',
  version: 1,
  isActive: true,
  industryStandard: 'ISO9001',
  sections: [
    {
      id: 'complaint-info',
      title: 'Complaint Information',
      order: 1,
      collapsible: false,
      fields: ['complaint-id', 'received-date', 'complaint-source', 'status', 'priority']
    },
    {
      id: 'customer-info',
      title: 'Customer Information',
      order: 2,
      fields: ['customer-name', 'customer-contact', 'customer-phone', 'customer-email']
    },
    {
      id: 'product-info',
      title: 'Product Information',
      order: 3,
      fields: ['product-model', 'serial-number', 'batch-number', 'quantity']
    },
    {
      id: 'complaint-details',
      title: 'Complaint Details',
      order: 4,
      fields: ['complaint-description', 'severity', 'assigned-to', 'response-due']
    },
    {
      id: 'investigation',
      title: 'Investigation & Resolution',
      order: 5,
      fields: ['investigation-result', 'root-cause', 'corrective-action', 'preventive-action', 'closure-date']
    }
  ],
  fields: [
    {
      id: 'complaint-id',
      name: 'complaintId',
      label: 'Complaint ID',
      type: 'text',
      validation: { required: true },
      visible: true,
      editable: false,
      order: 1,
      section: 'complaint-info'
    },
    {
      id: 'received-date',
      name: 'receivedDate',
      label: 'Date Received',
      type: 'date',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 2,
      section: 'complaint-info'
    },
    {
      id: 'complaint-source',
      name: 'complaintSource',
      label: 'Source',
      type: 'select',
      options: [
        { value: 'phone', label: 'Phone' },
        { value: 'email', label: 'Email' },
        { value: 'web', label: 'Web Portal' },
        { value: 'visit', label: 'Customer Visit' },
        { value: 'letter', label: 'Letter' }
      ],
      validation: { required: true },
      visible: true,
      editable: true,
      order: 3,
      section: 'complaint-info'
    },
    {
      id: 'status',
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'new', label: 'New', color: '#DC2626' },
        { value: 'investigating', label: 'Investigating', color: '#F59E0B' },
        { value: 'resolved', label: 'Resolved', color: '#3B82F6' },
        { value: 'closed', label: 'Closed', color: '#10B981' }
      ],
      defaultValue: 'new',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 4,
      section: 'complaint-info'
    },
    {
      id: 'priority',
      name: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { value: 'low', label: 'Low', color: '#6B7280' },
        { value: 'medium', label: 'Medium', color: '#3B82F6' },
        { value: 'high', label: 'High', color: '#F59E0B' },
        { value: 'critical', label: 'Critical', color: '#DC2626' }
      ],
      validation: { required: true },
      visible: true,
      editable: true,
      order: 5,
      section: 'complaint-info'
    },
    {
      id: 'customer-name',
      name: 'customerName',
      label: 'Customer Name',
      type: 'text',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 6,
      section: 'customer-info'
    },
    {
      id: 'customer-contact',
      name: 'customerContact',
      label: 'Contact Person',
      type: 'text',
      visible: true,
      editable: true,
      order: 7,
      section: 'customer-info'
    },
    {
      id: 'customer-phone',
      name: 'customerPhone',
      label: 'Phone Number',
      type: 'text',
      visible: true,
      editable: true,
      order: 8,
      section: 'customer-info'
    },
    {
      id: 'customer-email',
      name: 'customerEmail',
      label: 'Email',
      type: 'text',
      visible: true,
      editable: true,
      order: 9,
      section: 'customer-info'
    },
    {
      id: 'product-model',
      name: 'productModel',
      label: 'Product Model',
      type: 'text',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 10,
      section: 'product-info'
    },
    {
      id: 'serial-number',
      name: 'serialNumber',
      label: 'Serial Number',
      type: 'text',
      visible: true,
      editable: true,
      order: 11,
      section: 'product-info'
    },
    {
      id: 'batch-number',
      name: 'batchNumber',
      label: 'Batch Number',
      type: 'text',
      visible: true,
      editable: true,
      order: 12,
      section: 'product-info'
    },
    {
      id: 'quantity',
      name: 'quantity',
      label: 'Quantity Affected',
      type: 'number',
      visible: true,
      editable: true,
      order: 13,
      section: 'product-info'
    },
    {
      id: 'complaint-description',
      name: 'complaintDescription',
      label: 'Complaint Description',
      type: 'textarea',
      validation: { required: true, minLength: 20 },
      visible: true,
      editable: true,
      order: 14,
      section: 'complaint-details'
    },
    {
      id: 'severity',
      name: 'severity',
      label: 'Severity',
      type: 'select',
      options: [
        { value: 'minor', label: 'Minor', color: '#F59E0B' },
        { value: 'major', label: 'Major', color: '#F97316' },
        { value: 'critical', label: 'Critical', color: '#DC2626' }
      ],
      validation: { required: true },
      visible: true,
      editable: true,
      order: 15,
      section: 'complaint-details'
    },
    {
      id: 'assigned-to',
      name: 'assignedTo',
      label: 'Assigned To',
      type: 'select',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 16,
      section: 'complaint-details'
    },
    {
      id: 'response-due',
      name: 'responseDue',
      label: 'Response Due Date',
      type: 'date',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 17,
      section: 'complaint-details'
    },
    {
      id: 'investigation-result',
      name: 'investigationResult',
      label: 'Investigation Result',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 18,
      section: 'investigation'
    },
    {
      id: 'root-cause',
      name: 'rootCause',
      label: 'Root Cause',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 19,
      section: 'investigation'
    },
    {
      id: 'corrective-action',
      name: 'correctiveAction',
      label: 'Corrective Action',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 20,
      section: 'investigation'
    },
    {
      id: 'preventive-action',
      name: 'preventiveAction',
      label: 'Preventive Action',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 21,
      section: 'investigation'
    },
    {
      id: 'closure-date',
      name: 'closureDate',
      label: 'Closure Date',
      type: 'date',
      visible: true,
      editable: true,
      order: 22,
      section: 'investigation'
    }
  ],
  autoNumbering: {
    enabled: true,
    prefix: 'COMP-',
    startingNumber: 1000
  },
  approvals: {
    required: true,
    levels: [
      { level: 1, name: 'Quality Engineer', approvers: ['quality-engineer'] },
      { level: 2, name: 'Quality Manager', approvers: ['quality-manager'] }
    ]
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system'
};

// ============================================================================
// CONTROL PLAN FORM
// ============================================================================

const defaultControlPlanForm: DynamicForm = {
  id: 'control-plan-default',
  name: 'Control Plan',
  description: 'Define and manage process controls for quality assurance',
  type: 'control-plan',
  version: 1,
  isActive: true,
  industryStandard: 'IATF16949',
  sections: [
    {
      id: 'cp-info',
      title: 'Control Plan Information',
      order: 1,
      collapsible: false,
      fields: ['control-plan-id', 'cp-type', 'part-number', 'part-name', 'revision', 'date']
    },
    {
      id: 'process-step',
      title: 'Process Step',
      order: 2,
      fields: ['process-number', 'operation-name', 'machine-device', 'characteristic-number']
    },
    {
      id: 'characteristics',
      title: 'Characteristics',
      order: 3,
      fields: ['product-characteristic', 'process-characteristic', 'specification', 'tolerance']
    },
    {
      id: 'control-method',
      title: 'Control Method',
      order: 4,
      fields: ['evaluation-method', 'sample-size', 'frequency', 'control-method-type', 'responsible']
    },
    {
      id: 'reaction-plan',
      title: 'Reaction Plan',
      order: 5,
      fields: ['reaction-plan-desc', 'corrective-action-required', 'escalation-procedure']
    }
  ],
  fields: [
    {
      id: 'control-plan-id',
      name: 'controlPlanId',
      label: 'Control Plan ID',
      type: 'text',
      validation: { required: true },
      visible: true,
      editable: false,
      order: 1,
      section: 'cp-info'
    },
    {
      id: 'cp-type',
      name: 'cpType',
      label: 'Control Plan Type',
      type: 'select',
      options: [
        { value: 'prototype', label: 'Prototype' },
        { value: 'pre-launch', label: 'Pre-Launch' },
        { value: 'production', label: 'Production' }
      ],
      validation: { required: true },
      visible: true,
      editable: true,
      order: 2,
      section: 'cp-info'
    },
    {
      id: 'part-number',
      name: 'partNumber',
      label: 'Part Number',
      type: 'text',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 3,
      section: 'cp-info'
    },
    {
      id: 'part-name',
      name: 'partName',
      label: 'Part Name',
      type: 'text',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 4,
      section: 'cp-info'
    },
    {
      id: 'revision',
      name: 'revision',
      label: 'Revision Level',
      type: 'text',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 5,
      section: 'cp-info'
    },
    {
      id: 'date',
      name: 'date',
      label: 'Control Plan Date',
      type: 'date',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 6,
      section: 'cp-info'
    },
    {
      id: 'process-number',
      name: 'processNumber',
      label: 'Process Number',
      type: 'text',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 7,
      section: 'process-step'
    },
    {
      id: 'operation-name',
      name: 'operationName',
      label: 'Operation Name',
      type: 'text',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 8,
      section: 'process-step'
    },
    {
      id: 'machine-device',
      name: 'machineDevice',
      label: 'Machine / Device',
      type: 'text',
      visible: true,
      editable: true,
      order: 9,
      section: 'process-step'
    },
    {
      id: 'characteristic-number',
      name: 'characteristicNumber',
      label: 'Characteristic Number',
      type: 'text',
      visible: true,
      editable: true,
      order: 10,
      section: 'process-step'
    },
    {
      id: 'product-characteristic',
      name: 'productCharacteristic',
      label: 'Product Characteristic',
      type: 'textarea',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 11,
      section: 'characteristics'
    },
    {
      id: 'process-characteristic',
      name: 'processCharacteristic',
      label: 'Process Characteristic',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 12,
      section: 'characteristics'
    },
    {
      id: 'specification',
      name: 'specification',
      label: 'Specification',
      type: 'text',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 13,
      section: 'characteristics'
    },
    {
      id: 'tolerance',
      name: 'tolerance',
      label: 'Tolerance',
      type: 'text',
      visible: true,
      editable: true,
      order: 14,
      section: 'characteristics'
    },
    {
      id: 'evaluation-method',
      name: 'evaluationMethod',
      label: 'Evaluation / Measurement Method',
      type: 'text',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 15,
      section: 'control-method'
    },
    {
      id: 'sample-size',
      name: 'sampleSize',
      label: 'Sample Size',
      type: 'text',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 16,
      section: 'control-method'
    },
    {
      id: 'frequency',
      name: 'frequency',
      label: 'Frequency',
      type: 'select',
      options: [
        { value: 'continuous', label: 'Continuous' },
        { value: 'every-unit', label: 'Every Unit' },
        { value: 'hourly', label: 'Hourly' },
        { value: 'shift', label: 'Per Shift' },
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'batch', label: 'Per Batch' }
      ],
      validation: { required: true },
      visible: true,
      editable: true,
      order: 17,
      section: 'control-method'
    },
    {
      id: 'control-method-type',
      name: 'controlMethodType',
      label: 'Control Method',
      type: 'select',
      options: [
        { value: 'spc', label: 'SPC Chart' },
        { value: 'checklist', label: 'Checklist' },
        { value: 'error-proofing', label: 'Error-proofing (Poka-Yoke)' },
        { value: 'gauge', label: 'Gauge' },
        { value: 'visual', label: 'Visual' },
        { value: 'attribute', label: 'Attribute' },
        { value: 'variable', label: 'Variable' }
      ],
      validation: { required: true },
      visible: true,
      editable: true,
      order: 18,
      section: 'control-method'
    },
    {
      id: 'responsible',
      name: 'responsible',
      label: 'Responsible Person',
      type: 'select',
      validation: { required: true },
      visible: true,
      editable: true,
      order: 19,
      section: 'control-method'
    },
    {
      id: 'reaction-plan-desc',
      name: 'reactionPlanDesc',
      label: 'Reaction Plan (When Out-of-Control)',
      type: 'textarea',
      validation: { required: true, minLength: 10 },
      visible: true,
      editable: true,
      order: 20,
      section: 'reaction-plan'
    },
    {
      id: 'corrective-action-required',
      name: 'correctiveActionRequired',
      label: 'Corrective Action Required',
      type: 'checkbox',
      visible: true,
      editable: true,
      order: 21,
      section: 'reaction-plan'
    },
    {
      id: 'escalation-procedure',
      name: 'escalationProcedure',
      label: 'Escalation Procedure',
      type: 'textarea',
      visible: true,
      editable: true,
      order: 22,
      section: 'reaction-plan'
    }
  ],
  autoNumbering: {
    enabled: true,
    prefix: 'CP-',
    startingNumber: 1000
  },
  approvals: {
    required: true,
    levels: [
      { level: 1, name: 'Process Engineer', approvers: ['process-engineer'] },
      { level: 2, name: 'Quality Manager', approvers: ['quality-manager'] }
    ]
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system'
};

const defaultSupplierForm: DynamicForm = {
  id: 'supplier-default',
  name: 'Supplier',
  description: 'Manage supplier master data',
  type: 'supplier',
  version: 1,
  isActive: true,
  industryStandard: 'ISO9001',
  sections: [
    {
      id: 'supplier_basic',
      title: 'Basic Information',
      order: 1,
      fields: ['supplierCode', 'name', 'category', 'status', 'rating']
    },
    {
      id: 'supplier_contact',
      title: 'Contact',
      order: 2,
      fields: ['primaryContact', 'email', 'phone']
    }
  ],
  fields: [
    { id: 'supplierCode', name: 'supplierCode', label: 'Supplier Code', type: 'text', validation: { required: false }, visible: true, editable: true, order: 1 },
    { id: 'name', name: 'name', label: 'Name', type: 'text', validation: { required: true }, visible: true, editable: true, order: 2 },
    { id: 'category', name: 'category', label: 'Category', type: 'text', visible: true, editable: true, order: 3 },
    { id: 'status', name: 'status', label: 'Status', type: 'select', options: [
      { value: 'approved', label: 'Approved' },
      { value: 'conditional', label: 'Conditional' },
      { value: 'blocked', label: 'Blocked' },
    ], visible: true, editable: true, order: 4 },
    { id: 'rating', name: 'rating', label: 'Rating', type: 'number', visible: true, editable: true, order: 5 },
    { id: 'primaryContact', name: 'primaryContact', label: 'Primary Contact', type: 'text', visible: true, editable: true, order: 6 },
    { id: 'email', name: 'email', label: 'Email', type: 'text', visible: true, editable: true, order: 7 },
    { id: 'phone', name: 'phone', label: 'Phone', type: 'text', visible: true, editable: true, order: 8 },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system'
};

const defaultInspectionForm: DynamicForm = {
  id: 'inspection-default',
  name: 'Inspection',
  description: 'Log inspection records',
  type: 'inspection',
  version: 1,
  isActive: true,
  industryStandard: 'ISO9001',
  sections: [
    {
      id: 'inspection_basic',
      title: 'Inspection Details',
      order: 1,
      fields: ['type', 'productName', 'batchNumber', 'inspectionDate', 'result']
    },
    {
      id: 'inspection_measure',
      title: 'Measurements',
      order: 2,
      fields: ['sampleSize', 'defectCount', 'inspectionPoints', 'inspectedBy']
    }
  ],
  fields: [
    { id: 'type', name: 'type', label: 'Type', type: 'select', validation: { required: true }, options: [
      { value: 'incoming', label: 'Incoming' },
      { value: 'in-process', label: 'In-Process' },
      { value: 'final', label: 'Final' },
      { value: 'shipping', label: 'Shipping' },
    ], visible: true, editable: true, order: 1 },
    { id: 'productName', name: 'productName', label: 'Product', type: 'text', validation: { required: true }, visible: true, editable: true, order: 2 },
    { id: 'batchNumber', name: 'batchNumber', label: 'Batch', type: 'text', visible: true, editable: true, order: 3 },
    { id: 'inspectionDate', name: 'inspectionDate', label: 'Inspection Date', type: 'date', visible: true, editable: true, order: 4 },
    { id: 'result', name: 'result', label: 'Result', type: 'select', options: [
      { value: 'pass', label: 'Pass' },
      { value: 'fail', label: 'Fail' },
      { value: 'pending', label: 'Pending' },
    ], visible: true, editable: true, order: 5 },
    { id: 'sampleSize', name: 'sampleSize', label: 'Sample Size', type: 'number', visible: true, editable: true, order: 6 },
    { id: 'defectCount', name: 'defectCount', label: 'Defect Count', type: 'number', visible: true, editable: true, order: 7 },
    { id: 'inspectionPoints', name: 'inspectionPoints', label: 'Inspection Points', type: 'number', visible: true, editable: true, order: 8 },
    { id: 'inspectedBy', name: 'inspectedBy', label: 'Inspected By', type: 'text', visible: true, editable: true, order: 9 },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system'
};

const defaultCalibrationForm: DynamicForm = {
  id: 'calibration-default',
  name: 'Calibration',
  description: 'Manage calibration records',
  type: 'calibration',
  version: 1,
  isActive: true,
  industryStandard: 'ISO9001',
  sections: [
    {
      id: 'cal_basic',
      title: 'Equipment',
      order: 1,
      fields: ['equipment', 'model', 'serialNumber', 'location']
    },
    {
      id: 'cal_schedule',
      title: 'Schedule',
      order: 2,
      fields: ['status', 'lastCalibration', 'nextCalibration', 'calibratedBy', 'uncertainty']
    }
  ],
  fields: [
    { id: 'equipment', name: 'equipment', label: 'Equipment', type: 'text', validation: { required: true }, visible: true, editable: true, order: 1 },
    { id: 'model', name: 'model', label: 'Model', type: 'text', visible: true, editable: true, order: 2 },
    { id: 'serialNumber', name: 'serialNumber', label: 'Serial Number', type: 'text', validation: { required: true }, visible: true, editable: true, order: 3 },
    { id: 'location', name: 'location', label: 'Location', type: 'text', visible: true, editable: true, order: 4 },
    { id: 'status', name: 'status', label: 'Status', type: 'select', options: [
      { value: 'calibrated', label: 'Calibrated' },
      { value: 'due', label: 'Due' },
      { value: 'overdue', label: 'Overdue' },
      { value: 'maintenance', label: 'Maintenance' },
    ], visible: true, editable: true, order: 5 },
    { id: 'lastCalibration', name: 'lastCalibration', label: 'Last Calibration', type: 'date', visible: true, editable: true, order: 6 },
    { id: 'nextCalibration', name: 'nextCalibration', label: 'Next Calibration', type: 'date', visible: true, editable: true, order: 7 },
    { id: 'calibratedBy', name: 'calibratedBy', label: 'Calibrated By', type: 'text', visible: true, editable: true, order: 8 },
    { id: 'uncertainty', name: 'uncertainty', label: 'Uncertainty', type: 'text', visible: true, editable: true, order: 9 },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system'
};

const defaultDefectLogForm: DynamicForm = {
  id: 'defect-log-default',
  name: 'Smart Daily Defect Recorder',
  description: 'Dynamic shopfloor defect recorder with routing, lookup linking, calculated previews, and dashboard impact support.',
  type: 'defect-log',
  version: 5,
  isActive: true,
  industryStandard: 'custom',
  sections: [
    {
      id: 'production-info',
      title: 'Production Information',
      description: 'Barcode-friendly identifiers and production context used by dashboards and prediction training.',
      order: 1,
      fields: ['date', 'shift', 'model', 'production-line', 'factory', 'workshop', 'capacity', 'inspection-plan', 'part-id', 'part-number', 'supplier-name', 'unit-cost', 'product-family', 'default-inspection-point']
    },
    {
      id: 'classification',
      title: 'Dashboard Routing',
      description: 'Record type controls which quality pages and KPIs this record updates.',
      order: 2,
      fields: ['record-type', 'inspected-quantity', 'estimated-cost', 'cost-category', 'outgoing-result', 'shipment-id', 'customer-name', 'customer-code', 'customer-market', 'default-return-handling', 'release-time', 'return-reference']
    },
    {
      id: 'defect-details',
      title: 'Defect Details',
      description: 'The core defect signal used by Daily Defects, dashboards, SPC, NCR escalation, and local prediction.',
      order: 3,
      fields: ['defect-type', 'defect-category', 'suggested-containment', 'quantity', 'severity', 'description']
    },
    {
      id: 'smart-calculations',
      title: 'Smart Calculations',
      order: 4,
      fields: ['ppm-preview', 'total-cost-preview', 'cost-impact-level', 'release-status', 'outgoing-impact', 'external-failure-impact', 'ncr-suggested']
    },
    {
      id: 'actions',
      title: 'Immediate Actions',
      description: 'Action and investigation fields are saved for reporting, but excluded from prediction inputs by default.',
      order: 5,
      fields: ['action-taken', 'operator-name', 'status']
    }
  ],
  fields: [
    { id: 'date', name: 'date', label: 'Date', type: 'date', defaultValue: new Date().toISOString().split('T')[0], validation: { required: true }, visible: true, editable: true, order: 1, section: 'production-info', helpText: 'Required for trend, dashboard, SPC, and recurrence checks.' },
    { id: 'shift', name: 'shift', label: 'Shift', type: 'button-group', options: [{ value: 'morning', label: 'Morning' }, { value: 'afternoon', label: 'Afternoon' }, { value: 'night', label: 'Night' }], validation: { required: true }, visible: true, editable: true, order: 2, section: 'production-info', helpText: 'Used for line and shift performance analysis.' },
    { id: 'model', name: 'model', label: 'Model', type: 'text', visible: true, editable: true, order: 3, section: 'production-info', helpText: 'Model master data can auto-fill product, workshop, line, capacity, and inspection plan.' },
    { id: 'production-line', name: 'productionLine', label: 'Production Line', type: 'text', dependsOn: 'model', lookup: { sourceType: 'external', externalSourceId: 'models-db', matchField: 'model', sourceField: 'productionLine' }, validation: { required: true }, visible: true, editable: true, order: 4, section: 'production-info', helpText: 'Controls line-level PPM, SPC grouping, and dashboard breakdown.' },
    { id: 'factory', name: 'factory', label: 'Factory', type: 'lookup', dependsOn: 'productionLine', lookup: { sourceType: 'external', externalSourceId: 'lines-db', matchField: 'productionLine', sourceField: 'factory' }, visible: true, editable: false, order: 5, section: 'production-info', helpText: 'Auto-filled from line/workshop master data.' },
    { id: 'workshop', name: 'workshop', label: 'Workshop', type: 'lookup', dependsOn: 'productionLine', lookup: { sourceType: 'external', externalSourceId: 'lines-db', matchField: 'productionLine', sourceField: 'workshop' }, visible: true, editable: false, order: 6, section: 'production-info', helpText: 'Auto-filled from line/workshop master data.' },
    { id: 'capacity', name: 'capacity', label: 'Model Capacity', type: 'lookup', dependsOn: 'model', lookup: { sourceType: 'external', externalSourceId: 'models-db', matchField: 'model', sourceField: 'capacity' }, visible: true, editable: false, order: 7, section: 'production-info', helpText: 'Auto-filled from model master data.' },
    { id: 'inspection-plan', name: 'inspectionPlan', label: 'Inspection Plan', type: 'lookup', dependsOn: 'model', lookup: { sourceType: 'external', externalSourceId: 'models-db', matchField: 'model', sourceField: 'inspectionPlan' }, visible: true, editable: false, order: 8, section: 'production-info', helpText: 'Auto-filled from model master data.' },
    { 
      id: 'part-id', 
      name: 'partId', 
      label: 'Part Number / Barcode', 
      type: 'barcode', 
      visible: true, 
      editable: true, 
      order: 9, 
      section: 'production-info',
      helpText: 'Scan or type the part code. Imported part master data can auto-fill linked fields.'
    },
    { 
      id: 'part-number', 
      name: 'partNumber', 
      label: 'Part Name', 
      type: 'text', 
      dependsOn: 'partId',
      lookup: { sourceType: 'external', externalSourceId: 'products-db', matchField: 'partId', sourceField: 'partName' },
      visible: true, 
      editable: true, 
      order: 10, 
      section: 'production-info',
      helpText: 'Part display name. This remains editable if no master data match exists.'
    },
    { id: 'supplier-name', name: 'supplierName', label: 'Supplier', type: 'lookup', dependsOn: 'partId', lookup: { sourceType: 'external', externalSourceId: 'products-db', matchField: 'partId', sourceField: 'supplierName' }, visible: true, editable: false, order: 11, section: 'production-info', helpText: 'Auto-filled from imported master data when the part code matches.' },
    { id: 'unit-cost', name: 'unitCost', label: 'Unit Cost', type: 'lookup', dependsOn: 'partId', lookup: { sourceType: 'external', externalSourceId: 'products-db', matchField: 'partId', sourceField: 'unitCost' }, visible: true, editable: false, order: 12, section: 'production-info', helpText: 'Used to estimate COPQ when estimated cost is not entered.' },
    { id: 'product-family', name: 'productFamily', label: 'Product Family', type: 'lookup', dependsOn: 'partId', lookup: { sourceType: 'external', externalSourceId: 'products-db', matchField: 'partId', sourceField: 'productFamily' }, visible: true, editable: false, order: 13, section: 'production-info', helpText: 'Linked product/model family for analysis and prediction training.' },
    { id: 'default-inspection-point', name: 'defaultInspectionPoint', label: 'Default Inspection Point', type: 'lookup', dependsOn: 'partId', lookup: { sourceType: 'external', externalSourceId: 'products-db', matchField: 'partId', sourceField: 'defaultInspectionPoint' }, visible: true, editable: false, order: 14, section: 'production-info', helpText: 'Auto-filled from part or line master data when available.' },
    { id: 'record-type', name: 'recordType', label: 'Record Routing', type: 'select', defaultValue: 'process-ppm', options: [
      { value: 'process-ppm', label: 'Process PPM' },
      { value: 'defect-cost', label: 'Defect Cost / COPQ' },
      { value: 'outgoing-quality', label: 'Outgoing Quality' },
      { value: 'customer-return', label: 'Customer Return' },
    ], validation: { required: true }, visible: true, editable: true, order: 9, section: 'classification', helpText: 'Select where this record should update: PPM, COPQ, outgoing, or customer returns.' },
    { id: 'inspected-quantity', name: 'inspectedQuantity', label: 'Inspected / Produced Quantity', type: 'number', visible: false, editable: true, order: 10, section: 'classification', helpText: 'Required for Process PPM calculation.', conditionalLogic: [{ field: 'recordType', operator: 'equals', value: 'process-ppm', action: 'show' }, { field: 'recordType', operator: 'equals', value: 'process-ppm', action: 'require' }] },
    { id: 'estimated-cost', name: 'estimatedCost', label: 'Estimated Cost', type: 'number', visible: false, editable: true, order: 11, section: 'classification', helpText: 'Required for COPQ and customer return impact. If empty, the engine can preview quantity x unit cost.', conditionalLogic: [{ field: 'recordType', operator: 'equals', value: 'defect-cost', action: 'show' }, { field: 'recordType', operator: 'equals', value: 'defect-cost', action: 'require' }, { field: 'recordType', operator: 'equals', value: 'customer-return', action: 'show' }, { field: 'recordType', operator: 'equals', value: 'customer-return', action: 'require' }] },
    { id: 'cost-category', name: 'costCategory', label: 'Cost Category', type: 'select', options: [
      { value: 'internal-failure', label: 'Internal Failure' },
      { value: 'external-failure', label: 'External Failure' },
      { value: 'appraisal', label: 'Appraisal' },
      { value: 'prevention', label: 'Prevention' },
    ], dependsOn: 'defectType', lookup: { sourceType: 'external', externalSourceId: 'defects-db', matchField: 'defectType', sourceField: 'defaultCostCategory' }, visible: false, editable: true, order: 12, section: 'classification', helpText: 'Required for COPQ routing.', conditionalLogic: [{ field: 'recordType', operator: 'equals', value: 'defect-cost', action: 'show' }, { field: 'recordType', operator: 'equals', value: 'defect-cost', action: 'require' }] },
    { id: 'outgoing-result', name: 'outgoingResult', label: 'Outgoing Result', type: 'select', options: [
      { value: 'pass', label: 'Pass' },
      { value: 'fail', label: 'Fail' },
      { value: 'hold', label: 'Hold' },
    ], visible: false, editable: true, order: 13, section: 'classification', helpText: 'Required for outgoing quality release decisions.', conditionalLogic: [{ field: 'recordType', operator: 'equals', value: 'outgoing-quality', action: 'show' }, { field: 'recordType', operator: 'equals', value: 'outgoing-quality', action: 'require' }] },
    { id: 'shipment-id', name: 'shipmentId', label: 'Shipment / Batch ID', type: 'text', visible: false, editable: true, order: 14, section: 'classification', helpText: 'Required for outgoing quality records.', conditionalLogic: [{ field: 'recordType', operator: 'equals', value: 'outgoing-quality', action: 'show' }, { field: 'recordType', operator: 'equals', value: 'outgoing-quality', action: 'require' }] },
    { id: 'customer-name', name: 'customerName', label: 'Customer Name', type: 'text', visible: false, editable: true, order: 15, section: 'classification', helpText: 'Required for customer return records.', conditionalLogic: [{ field: 'recordType', operator: 'equals', value: 'outgoing-quality', action: 'show' }, { field: 'recordType', operator: 'equals', value: 'customer-return', action: 'show' }, { field: 'recordType', operator: 'equals', value: 'customer-return', action: 'require' }] },
    { id: 'customer-code', name: 'customerCode', label: 'Customer Code', type: 'lookup', dependsOn: 'customerName', lookup: { sourceType: 'external', externalSourceId: 'customers-db', matchField: 'customerName', sourceField: 'customerCode' }, visible: false, editable: false, order: 16, section: 'classification', helpText: 'Auto-filled from customer master data.', conditionalLogic: [{ field: 'recordType', operator: 'equals', value: 'customer-return', action: 'show' }] },
    { id: 'customer-market', name: 'market', label: 'Market', type: 'lookup', dependsOn: 'customerName', lookup: { sourceType: 'external', externalSourceId: 'customers-db', matchField: 'customerName', sourceField: 'market' }, visible: false, editable: false, order: 17, section: 'classification', helpText: 'Auto-filled from customer master data.', conditionalLogic: [{ field: 'recordType', operator: 'equals', value: 'customer-return', action: 'show' }] },
    { id: 'default-return-handling', name: 'defaultReturnHandling', label: 'Default Return Handling', type: 'lookup', dependsOn: 'customerName', lookup: { sourceType: 'external', externalSourceId: 'customers-db', matchField: 'customerName', sourceField: 'defaultReturnHandling' }, visible: false, editable: false, order: 18, section: 'classification', helpText: 'Auto-filled from customer master data.', conditionalLogic: [{ field: 'recordType', operator: 'equals', value: 'customer-return', action: 'show' }] },
    { id: 'release-time', name: 'releaseTimeHrs', label: 'Release Time (Hours)', type: 'number', visible: false, editable: true, order: 19, section: 'classification', helpText: 'Required for outgoing release status.', conditionalLogic: [{ field: 'recordType', operator: 'equals', value: 'outgoing-quality', action: 'show' }, { field: 'recordType', operator: 'equals', value: 'outgoing-quality', action: 'require' }] },
    { id: 'return-reference', name: 'returnReference', label: 'Return Reference', type: 'text', visible: false, editable: true, order: 20, section: 'classification', helpText: 'Required for customer returns and external failure tracking.', conditionalLogic: [{ field: 'recordType', operator: 'equals', value: 'customer-return', action: 'show' }, { field: 'recordType', operator: 'equals', value: 'customer-return', action: 'require' }] },
    { id: 'defect-type', name: 'defectType', label: 'Defect Type', type: 'text', validation: { required: true }, visible: true, editable: true, order: 21, section: 'defect-details', helpText: 'Use stable defect names where possible. This field trains Defect Prediction.' },
    { id: 'defect-category', name: 'defectCategory', label: 'Defect Category', type: 'lookup', dependsOn: 'defectType', lookup: { sourceType: 'external', externalSourceId: 'defects-db', matchField: 'defectType', sourceField: 'defectCategory' }, visible: true, editable: false, order: 22, section: 'defect-details', helpText: 'Auto-filled from defect master data.' },
    { id: 'suggested-containment', name: 'suggestedContainment', label: 'Suggested Containment', type: 'lookup', dependsOn: 'defectType', lookup: { sourceType: 'external', externalSourceId: 'defects-db', matchField: 'defectType', sourceField: 'suggestedContainment' }, visible: true, editable: false, order: 23, section: 'defect-details', helpText: 'Decision-support suggestion from defect master data.' },
    { id: 'quantity', name: 'quantity', label: 'Defect Quantity', type: 'number', validation: { required: true, min: 1 }, defaultValue: 1, visible: true, editable: true, order: 24, section: 'defect-details', helpText: 'Used by PPM, COPQ, recurrence, and NCR suggestion logic.' },
    { id: 'severity', name: 'severity', label: 'Severity', type: 'button-group', options: [{ value: 'minor', label: 'Minor' }, { value: 'major', label: 'Major' }, { value: 'critical', label: 'Critical' }], defaultValue: 'minor', dependsOn: 'defectType', lookup: { sourceType: 'external', externalSourceId: 'defects-db', matchField: 'defectType', sourceField: 'defaultSeverity' }, visible: true, editable: true, order: 25, section: 'defect-details', helpText: 'Critical severity may suggest NCR escalation but does not auto-create an NCR.' },
    { id: 'description', name: 'description', label: 'Defect Description', type: 'textarea', visible: true, editable: true, order: 26, section: 'defect-details', helpText: 'Free text is useful for reporting, but excluded from default prediction features to avoid leakage.' },
    { id: 'ppm-preview', name: 'ppmPreview', label: 'PPM Preview', type: 'formula', formula: { expression: '(@inspectedQuantity > 0 ? Math.round((@quantity / @inspectedQuantity) * 1000000) : 0)', variables: ['quantity', 'inspectedQuantity'], precision: 0 }, visible: false, editable: false, order: 22, section: 'smart-calculations', helpText: 'Preview only. Final dashboard values are calculated from saved records.', conditionalLogic: [{ field: 'recordType', operator: 'equals', value: 'process-ppm', action: 'show' }] },
    { id: 'total-cost-preview', name: 'totalCostPreview', label: 'Total Cost Preview', type: 'formula', formula: { expression: '(@estimatedCost > 0 ? @estimatedCost : (@quantity * @unitCost))', variables: ['estimatedCost', 'quantity', 'unitCost'], precision: 2 }, visible: false, editable: false, order: 23, section: 'smart-calculations', helpText: 'Uses entered estimated cost first, otherwise quantity x linked unit cost.', conditionalLogic: [{ field: 'recordType', operator: 'equals', value: 'defect-cost', action: 'show' }, { field: 'recordType', operator: 'equals', value: 'customer-return', action: 'show' }] },
    { id: 'cost-impact-level', name: 'costImpactLevel', label: 'Cost Impact Level', type: 'formula', formula: { expression: '((@estimatedCost > 0 ? @estimatedCost : (@quantity * @unitCost)) >= 5000 ? "High" : (((@estimatedCost > 0 ? @estimatedCost : (@quantity * @unitCost)) >= 1000) ? "Medium" : "Low"))', variables: ['estimatedCost', 'quantity', 'unitCost'] }, visible: false, editable: false, order: 24, section: 'smart-calculations', helpText: 'Decision-support cost band for prioritization.', conditionalLogic: [{ field: 'recordType', operator: 'equals', value: 'defect-cost', action: 'show' }, { field: 'recordType', operator: 'equals', value: 'customer-return', action: 'show' }] },
    { id: 'release-status', name: 'releaseStatus', label: 'Release Status', type: 'formula', formula: { expression: '(@releaseTimeHrs > 24 ? "Release delay risk" : (@releaseTimeHrs > 0 ? "Within release target" : "Pending release time"))', variables: ['releaseTimeHrs'] }, visible: false, editable: false, order: 25, section: 'smart-calculations', helpText: 'Release timing indicator for outgoing quality.', conditionalLogic: [{ field: 'recordType', operator: 'equals', value: 'outgoing-quality', action: 'show' }] },
    { id: 'outgoing-impact', name: 'outgoingImpact', label: 'Outgoing Impact', type: 'formula', formula: { expression: '(@outgoingResult === "fail" ? "Potential outgoing escape" : (@outgoingResult === "hold" ? "Release hold signal" : (@outgoingResult === "pass" ? "Release pass signal" : "Pending outgoing result")))', variables: ['outgoingResult'] }, visible: false, editable: false, order: 26, section: 'smart-calculations', helpText: 'Decision-support wording for outgoing records.', conditionalLogic: [{ field: 'recordType', operator: 'equals', value: 'outgoing-quality', action: 'show' }] },
    { id: 'external-failure-impact', name: 'externalFailureImpact', label: 'External Failure Impact', type: 'formula', formula: { expression: '(@estimatedCost >= 5000 ? "High external failure signal" : (@estimatedCost >= 1000 ? "Medium external failure signal" : "Low external failure signal"))', variables: ['estimatedCost'] }, visible: false, editable: false, order: 27, section: 'smart-calculations', helpText: 'Decision-support wording for customer returns.', conditionalLogic: [{ field: 'recordType', operator: 'equals', value: 'customer-return', action: 'show' }] },
    { id: 'ncr-suggested', name: 'ncrSuggested', label: 'NCR Suggestion Preview', type: 'formula', formula: { expression: '(@severity === "critical" || @quantity >= 10 || @recordType === "customer-return" || @outgoingResult === "fail" ? "Suggested" : "Not suggested")', variables: ['severity', 'quantity', 'recordType', 'outgoingResult'] }, visible: true, editable: false, order: 28, section: 'smart-calculations', helpText: 'Preview only. NCR is never created automatically.' },
    { id: 'action-taken', name: 'actionTaken', label: 'Immediate Action Taken', type: 'textarea', visible: true, editable: true, order: 29, section: 'actions', helpText: 'Saved for reporting and NCR context. Not used as a default prediction feature.' },
    { id: 'operator-name', name: 'operatorName', label: 'Operator Name', type: 'text', visible: true, editable: true, order: 30, section: 'actions' },
    { id: 'status', name: 'status', label: 'Status', type: 'select', options: [{ value: 'draft', label: 'Draft' }, { value: 'logged', label: 'Logged' }, { value: 'reviewed', label: 'Reviewed' }, { value: 'approved', label: 'Approved' }, { value: 'investigating', label: 'Investigating' }, { value: 'escalated', label: 'Escalated' }, { value: 'closed', label: 'Closed' }, { value: 'rejected', label: 'Rejected' }], defaultValue: 'logged', visible: true, editable: true, order: 31, section: 'actions' },
  ],
  analytics: {
    enabled: true,
    dashboardTitle: 'Defect Analysis Dashboard',
    charts: [
      {
        id: 'pareto-defect-type',
        chartType: 'pareto',
        title: 'Defect Type Pareto',
        dataMode: 'bind',
        bind: { xField: 'defectType', yField: 'quantity' },
        order: 1
      },
      {
        id: 'pareto-line',
        chartType: 'pareto',
        title: 'Production Line Analysis',
        dataMode: 'bind',
        bind: { xField: 'productionLine', yField: 'quantity' },
        order: 2
      }
    ]
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system'
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useConfigStore = create<ConfigState>()(
  immer(
    persist(
      (set, get) => ({
        // Initial State
        forms: [],
        activeForm: null,
        externalDataSources: [],
        optionSets: [],
        chartSettings: {
          dashboard: {
            seriesEnabled: {
              ncr: true,
              capa: true,
              inspection: true,
              closed: true,
              oee: true,
              quality: true,
              availability: true,
              value: true,
              target: true,
              delivery: true,
              cost: true,
              safety: true
            },
            seriesColors: {
              ncr: '#00A3E0',
              capa: '#0066CC',
              inspection: '#00C853',
              closed: '#FFD600',
              oee: '#0066CC',
              quality: '#00A3E0',
              availability: '#00C853',
              value: '#00A3E0',
              target: '#00C853',
              delivery: '#00A3E0',
              cost: '#FFD600',
              safety: '#00C853'
            }
          },
          executive: {
            seriesEnabled: {
              quality: true,
              delivery: true,
              cost: true,
              safety: true
            },
            seriesColors: {
              quality: '#00A3E0',
              delivery: '#00C853',
              cost: '#FFD600',
              safety: '#9C27B0'
            }
          },
          iot: {
            refreshInterval: 1000,
            maxDataPoints: 100,
            showSPC: true,
            showAnomalies: true
          },
          spc: {
            showZones: true,
            controlLimits: {
              ucl: 55,
              cl: 50,
              lcl: 45
            },
            specLimits: {
              usl: 58,
              lsl: 42
            },
            enabledRules: {
              rule1: true,
              rule2: true,
              rule3: true,
              rule4: true,
              rule5: true,
              rule6: true,
              rule7: true,
              rule8: true
            },
            characteristics: []
          }
        },
        workflows: [],
        activeWorkflow: null,
        kpis: [],
        plants: [],
        currentPlantId: null,
        isLoading: false,
        error: null,

        // Forms Actions
        setActiveForm: (form) => set({ activeForm: form }),
        
        addForm: (form) => {
          const id = `${form.type}-${Date.now()}`;
          const newForm: DynamicForm = {
            ...form,
            id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          set((state) => {
            state.forms.push(newForm);
          });
        },

        updateForm: (id, updates) => {
          set((state) => {
            const form = state.forms.find((f: DynamicForm) => f.id === id);
            if (form) {
              Object.assign(form, updates, { updatedAt: new Date().toISOString() });
            }
          });
        },

        deleteForm: (id) => {
          set((state) => {
            state.forms = state.forms.filter((f: DynamicForm) => f.id !== id);
          });
        },

        cloneForm: (id, newName) => {
          const original = get().forms.find((f: DynamicForm) => f.id === id);
          if (original) {
            get().addForm({
              ...original,
              name: newName,
              isActive: false,
              version: 1
            });
          }
        },

        addExternalDataSource: (source) => {
          const id = `ds-${Date.now()}`;
          set((state) => {
            state.externalDataSources.push({
              ...source,
              id,
              lastUpdated: new Date().toISOString()
            });
          });
        },

        updateExternalDataSource: (id, updates) => {
          set((state) => {
            const ds = state.externalDataSources.find((s: ExternalDataSource) => s.id === id);
            if (ds) {
              Object.assign(ds, updates, { lastUpdated: new Date().toISOString() });
            } else {
              state.externalDataSources.push({
                id,
                name: updates.name || id,
                type: updates.type || 'json',
                url: updates.url,
                data: updates.data,
                lastUpdated: new Date().toISOString()
              });
            }
          });
        },

        deleteExternalDataSource: (id) => {
          set((state) => {
            state.externalDataSources = state.externalDataSources.filter((s: ExternalDataSource) => s.id !== id);
          });
        },

        refreshExternalDataSource: async (id) => {
          const ds = get().externalDataSources.find((s: ExternalDataSource) => s.id === id);
          if (!ds || !ds.url) return;
          
          try {
            const response = await fetch(ds.url);
            const data = await response.json();
            get().updateExternalDataSource(id, { data });
          } catch (error) {
            console.error('Failed to refresh data source:', error);
          }
        },

        getFormByType: (type) => {
          const active = get().forms.find((f: DynamicForm) => f.type === type && f.isActive);
          if (active) return active;
          return get().forms.find((f: DynamicForm) => f.type === type);
        },

        upsertOptionSet: (setArg) => {
          set((state) => {
            const idx = state.optionSets.findIndex((s: OptionSet) => s.id === setArg.id);
            if (idx >= 0) state.optionSets[idx] = setArg;
            else state.optionSets.push(setArg);
          });
        },

        updateOptionSetItems: (id, items) => {
          set((state) => {
            const s = state.optionSets.find((x: OptionSet) => x.id === id);
            if (s) s.items = items;
          });
        },

        deleteOptionSet: (id) => {
          set((state) => {
            state.optionSets = state.optionSets.filter((s: OptionSet) => s.id !== id);
          });
        },

        getOptionSet: (id) => get().optionSets.find((s: OptionSet) => s.id === id),

        // Workflows Actions
        setActiveWorkflow: (workflow) => set({ activeWorkflow: workflow }),
        
        addWorkflow: (workflow) => {
          const id = `wf-${Date.now()}`;
          const newWorkflow: WorkflowTemplate = {
            ...workflow,
            id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          set((state) => {
            state.workflows.push(newWorkflow);
          });
        },

        updateWorkflow: (id, updates) => {
          set((state) => {
            const workflow = state.workflows.find((w: WorkflowTemplate) => w.id === id);
            if (workflow) {
              Object.assign(workflow, updates, { updatedAt: new Date().toISOString() });
            }
          });
        },

        deleteWorkflow: (id) => {
          set((state) => {
            state.workflows = state.workflows.filter((w: WorkflowTemplate) => w.id !== id);
          });
        },

        // KPIs Actions
        addKPI: (kpi) => {
          const id = `kpi-${Date.now()}`;
          set((state) => {
            state.kpis.push({ ...kpi, id });
          });
        },

        updateKPI: (id, updates) => {
          set((state) => {
            const kpi = state.kpis.find((k: KPIDefinition) => k.id === id);
            if (kpi) {
              Object.assign(kpi, updates);
            }
          });
        },

        deleteKPI: (id) => {
          set((state) => {
            state.kpis = state.kpis.filter((k: KPIDefinition) => k.id !== id);
          });
        },

        // Plants Actions
        setCurrentPlant: (plantId) => set({ currentPlantId: plantId }),
        
        addPlant: (plant) => {
          const id = `plant-${Date.now()}`;
          set((state) => {
            state.plants.push({ ...plant, id });
          });
        },

        updatePlant: (id, updates) => {
          set((state) => {
            const plant = state.plants.find((p: PlantConfig) => p.id === id);
            if (plant) {
              Object.assign(plant, updates);
            }
          });
        },

        deletePlant: (id) => {
          set((state) => {
            state.plants = state.plants.filter((p: PlantConfig) => p.id !== id);
          });
        },

        getCurrentPlant: () => {
          const { plants, currentPlantId } = get();
          return plants.find((p: PlantConfig) => p.id === currentPlantId);
        },

        reinitializeDefaults: () => {
          set((state) => {
            // 1. Ensure externalDataSources exists
            if (!state.externalDataSources) {
              state.externalDataSources = [];
            }

            state.optionSets = state.optionSets || [];

            // 2. Ensure defect-log form exists and is up to date
            const existingLogForm = state.forms.find(f => f.type === 'defect-log');
            if (!existingLogForm) {
              state.forms.push(defaultDefectLogForm);
            } else if ((existingLogForm.version || 0) < 5) {
              // Update to latest default if it's an old version
              const idx = state.forms.findIndex(f => f.type === 'defect-log');
              state.forms[idx] = defaultDefectLogForm;
            }
          });
        },

        // Utility Actions
        loadDefaultConfigs: () => {
          set({
            forms: [
              defaultNCRForm,
              defaultCAPAForm,
              defaultAuditForm,
              default8DForm,
              defaultDeviationForm,
              defaultChangeControlForm,
              defaultComplaintForm,
              defaultControlPlanForm,
              defaultSupplierForm,
              defaultInspectionForm,
              defaultCalibrationForm,
              defaultDefectLogForm
            ],
            optionSets: [],
            chartSettings: get().chartSettings,
            workflows: [],
            kpis: [],
            plants: [],
            currentPlantId: null
          });
        },

        exportConfig: () => {
          const { forms, workflows, kpis, plants, optionSets } = get();
          return JSON.stringify({ forms, workflows, kpis, plants, optionSets }, null, 2);
        },

        importConfig: (json) => {
          try {
            const config = JSON.parse(json);
            set({
              forms: config.forms || [],
              optionSets: config.optionSets || [],
              workflows: config.workflows || [],
              kpis: config.kpis || [],
              plants: config.plants || []
            });
          } catch (e) {
            set({ error: 'Invalid configuration JSON' });
          }
        },

        resetToDefaults: () => {
          get().loadDefaultConfigs();
        },
        setChartSettings: (updates) => {
          set((state) => {
            state.chartSettings = {
              ...state.chartSettings,
              ...updates,
              dashboard: {
                ...state.chartSettings.dashboard,
                ...(updates.dashboard || {}),
                seriesEnabled: {
                  ...state.chartSettings.dashboard.seriesEnabled,
                  ...(updates.dashboard?.seriesEnabled || {})
                },
                seriesColors: {
                  ...state.chartSettings.dashboard.seriesColors,
                  ...(updates.dashboard?.seriesColors || {})
                }
              },
              executive: {
                ...state.chartSettings.executive,
                ...(updates.executive || {}),
                seriesEnabled: {
                  ...state.chartSettings.executive.seriesEnabled,
                  ...(updates.executive?.seriesEnabled || {})
                },
                seriesColors: {
                  ...state.chartSettings.executive.seriesColors,
                  ...(updates.executive?.seriesColors || {})
                }
              },
              iot: {
                ...state.chartSettings.iot,
                ...(updates.iot || {})
              },
              spc: {
                ...state.chartSettings.spc,
                ...(updates.spc || {}),
                controlLimits: {
                  ...state.chartSettings.spc.controlLimits,
                  ...(updates.spc?.controlLimits || {})
                },
                specLimits: {
                  ...state.chartSettings.spc.specLimits,
                  ...(updates.spc?.specLimits || {})
                },
                enabledRules: {
                  ...state.chartSettings.spc.enabledRules,
                  ...(updates.spc?.enabledRules || {})
                },
                characteristics: updates.spc?.characteristics || state.chartSettings.spc.characteristics
              }
            };
          });
        }
      }),
      {
        name: 'qms-config-store',
        partialize: (state) => ({
          forms: state.forms,
          externalDataSources: state.externalDataSources,
          optionSets: state.optionSets,
          workflows: state.workflows,
          kpis: state.kpis,
          plants: state.plants,
          currentPlantId: state.currentPlantId,
          chartSettings: state.chartSettings
        })
      }
    )
  )
);

// ============================================================================
// SELECTORS & UTILITIES
// ============================================================================

export const selectActiveForms = (state: ConfigState) => 
  state.forms.filter((f: DynamicForm) => f.isActive);

export const selectFormsByType = (state: ConfigState, type: DynamicForm['type']) =>
  state.forms.filter((f: DynamicForm) => f.type === type);

export const selectActiveWorkflows = (state: ConfigState) =>
  state.workflows.filter((w: WorkflowTemplate) => w.isActive);

export const selectKPIsByCategory = (state: ConfigState, category: KPIDefinition['category']) =>
  state.kpis.filter((k: KPIDefinition) => k.category === category && k.isActive);

// ============================================================================
// INDUSTRY STANDARD PRESETS
// ============================================================================

export const industryPresets = {
  ISO9001: {
    forms: ['ncr-default', 'capa-default', 'audit-default', '8d-default', 'deviation-default', 'change-control-default', 'complaint-default', 'control-plan-default'],
    requiredFields: ['document-control', 'management-review', 'internal-audit']
  },
  ISO13485: {
    forms: ['ncr-medical', 'capa-medical', 'complaint-medical', 'risk-analysis'],
    requiredFields: ['risk-management', 'clinical-evaluation', 'post-market']
  },
  AS9100: {
    forms: ['ncr-aerospace', 'capa-aerospace', 'fmea-aerospace'],
    requiredFields: ['configuration-management', 'special-requirements', 'key-characteristics']
  },
  FDA: {
    forms: ['ncr-fda', 'capa-fda', 'complaint-fda', 'mdev-report'],
    requiredFields: ['21cfr11', 'electronic-signatures', 'audit-trail']
  },
  IATF16949: {
    forms: ['ncr-default', 'capa-default', '8d-default', 'control-plan-default', 'deviation-default'],
    requiredFields: ['customer-specific-requirements', 'product-safety', 'embedded-software']
  }
};

export default useConfigStore;
