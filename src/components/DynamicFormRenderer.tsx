/**
 * QMS Enterprise 4.0 - Dynamic Form Renderer
 * Professional Quality 4.0 Component
 * 
 * Renders dynamic forms based on configuration from configStore
 * Supports all field types, validation, conditional logic
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Info,
  AlertCircle,
  Check,
  Upload,
  Barcode,
  Calculator,
  RefreshCw,
} from 'lucide-react';
import { useConfigStore } from '../stores/configStore';
import type { DynamicForm, DynamicField } from '../stores/configStore';
import { FormulaEvaluator } from '../utils/formulaEvaluator';
import { unifiedApiRegistry } from '../api/unified-api';
import { loadQualityMasterTable } from '@/services/qualityMasterData';
import {
  loadActiveQualityFormTemplate,
  qualityTemplateToDynamicForm,
} from '@/services/qualityFormTemplates';
import type { ActiveQualityFormContext, QualityFormMode } from '@/services/qualityFormTemplates';
import { 
  TextField, NumberField, TextAreaField, SelectField, MultiSelectField, RadioField, 
  ButtonGroupField, CheckboxGroupField, DateField, BarcodeField, SignatureField
} from "./FormFields";
import { DataEntryGrid } from "./DataEntryGrid";
import type { FieldComponentProps } from "./FormFields/types";
import { SmartFormCopilot } from "./SmartFormCopilot";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const ChartField: React.FC<
  FieldComponentProps & { formValues: Record<string, unknown> }
> = ({ field, value, onChange, error, disabled, formValues }) => {
  const cfg = field.chart;
  const points = Array.isArray(value) ? (value as any[]) : (cfg?.manualData || []);

  const chartData = ((): Array<{ x: string; y: number }> => {
    if (!cfg) return [];
    if (cfg.dataMode === 'bind' && cfg.bind?.xField && cfg.bind?.yField) {
      const xVal = formValues[cfg.bind.xField];
      const yVal = formValues[cfg.bind.yField];
      if (xVal === undefined || yVal === undefined) return [];
      return [{ x: String(xVal), y: Number(yVal) || 0 }];
    }
    return (points || []).map((p: any) => ({ x: String(p?.x ?? ''), y: Number(p?.y ?? 0) || 0 }));
  })();

  const updatePoint = (idx: number, patch: Partial<{ x: string; y: number }>) => {
    const next = [...chartData];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const addPoint = () => {
    const next = [...chartData, { x: `Item ${chartData.length + 1}`, y: 0 }];
    onChange(next);
  };

  const removePoint = (idx: number) => {
    const next = chartData.filter((_, i) => i !== idx);
    onChange(next);
  };

  const colors = ['#00A3E0', '#0066CC', '#22C55E', '#F59E0B', '#EF4444', '#A855F7'];

  return (
    <div className="space-y-3 w-full">
      <div className="rounded-lg border border-white/10 bg-white/5 p-3 h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {cfg?.chartType === 'bar' ? (
            <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="y" fill="#00A3E0" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : cfg?.chartType === 'line' ? (
            <LineChart data={chartData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="y" stroke="#00A3E0" strokeWidth={3} dot />
            </LineChart>
          ) : (
            <PieChart>
              <Tooltip />
              <Pie data={chartData} dataKey="y" nameKey="x" cx="50%" cy="50%" outerRadius={80}>
                {chartData.map((_, idx) => (
                  <Cell key={idx} fill={colors[idx % colors.length]} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {cfg?.dataMode !== 'bind' && (
        <div className="space-y-2">
          {chartData.map((pt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={pt.x}
                disabled={disabled}
                onChange={(e) => updatePoint(idx, { x: e.target.value })}
                className="flex-1 px-3 py-2 rounded border border-white/10 bg-transparent text-white text-sm"
              />
              <input
                type="number"
                value={pt.y}
                disabled={disabled}
                onChange={(e) => updatePoint(idx, { y: Number(e.target.value) || 0 })}
                className="w-40 px-3 py-2 rounded border border-white/10 bg-transparent text-white text-sm"
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => removePoint(idx)}
                className="px-3 py-2 rounded border border-white/10 bg-white/5 text-gray-300 text-sm hover:bg-white/10 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            disabled={disabled}
            onClick={addPoint}
            className="px-3 py-2 rounded border border-white/10 bg-white/5 text-gray-300 text-sm hover:bg-white/10 disabled:opacity-50"
          >
            Add Point
          </button>
        </div>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
};

// ============================================================================
// VALIDATION SCHEMA BUILDER
// ============================================================================

function buildValidationSchema(fields: DynamicField[]): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  fields.forEach((field) => {
    const { validation, type } = field;
    let schema: z.ZodTypeAny;

    switch (type) {
      case 'text':
      case 'textarea':
      case 'barcode': {
        let strSchema = z.string();
        if (validation?.minLength) strSchema = strSchema.min(validation.minLength);
        if (validation?.maxLength) strSchema = strSchema.max(validation.maxLength);
        if (validation?.pattern) strSchema = strSchema.regex(new RegExp(validation.pattern));
        schema = strSchema;
        break;
      }

      case 'number':
      case 'calculated': {
        let numSchema = z.number({ message: 'Must be a number' });
        if (validation?.min !== undefined) numSchema = numSchema.min(validation.min);
        if (validation?.max !== undefined) numSchema = numSchema.max(validation.max);
        schema = numSchema;
        break;
      }

      case 'formula':
        schema = z.union([z.number(), z.string(), z.boolean()]).nullable().optional();
        break;

      case 'select':
      case 'radio':
      case 'button-group':
        schema = z.string();
        break;

      case 'multiselect':
      case 'checkbox-group':
        schema = z.array(z.string());
        if (validation?.required) schema = (schema as z.ZodArray<z.ZodString>).min(1, 'Required');
        break;

      case 'checkbox':
        schema = z.boolean();
        if (validation?.required) {
          schema = z.boolean().refine((val) => val === true, { message: 'This field is required' });
        }
        break;

      case 'date':
      case 'datetime':
      case 'relation':
        schema = z.string();
        break;

      case 'file':
      case 'signature':
        schema = z.any();
        break;

      case 'chart':
        schema = z.array(
          z.object({
            x: z.string(),
            y: z.number(),
          })
        );
        break;

      default:
        schema = z.any();
    }

    // Handle Required vs Optional/Nullable
    if (validation?.required) {
      if (type === 'text' || type === 'textarea' || type === 'barcode' || type === 'select' || type === 'radio' || type === 'button-group' || type === 'date' || type === 'datetime' || type === 'relation') {
        schema = (schema as z.ZodString).min(1, 'Required');
      } else if (type === 'file' || type === 'signature') {
        schema = schema.refine((val) => val !== null && val !== undefined, { message: 'Required' });
      }
      // Numbers are already required by default in Zod if not made nullable/optional
    } else {
      // Make optional or nullable if not required
      if (type === 'number' || type === 'calculated' || type === 'formula' || type === 'date' || type === 'datetime' || type === 'relation' || type === 'file' || type === 'signature') {
        schema = schema.nullable().optional();
      } else {
        schema = schema.optional();
      }
    }

    shape[field.name] = schema;
  });

  return z.object(shape);
}

// ============================================================================
// CONDITIONAL LOGIC EVALUATOR
// ============================================================================

function evaluateCondition(
  fieldValue: unknown,
  operator: string,
  compareValue: unknown
): boolean {
  switch (operator) {
    case 'equals':
      return fieldValue === compareValue;
    case 'notEquals':
      return fieldValue !== compareValue;
    case 'contains':
      return String(fieldValue).includes(String(compareValue));
    case 'greaterThan':
      return Number(fieldValue) > Number(compareValue);
    case 'lessThan':
      return Number(fieldValue) < Number(compareValue);
    case 'isEmpty':
      return fieldValue === null || fieldValue === undefined || fieldValue === '';
    case 'isNotEmpty':
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
    default:
      return true;
  }
}

function checkFieldVisibility(
  field: DynamicField,
  formValues: Record<string, unknown>
): { visible: boolean; disabled: boolean; required: boolean } {
  if (!field.conditionalLogic || field.conditionalLogic.length === 0) {
    return { visible: field.visible, disabled: !field.editable, required: field.validation?.required || false };
  }

  let visible = field.visible;
  let disabled = !field.editable;
  let required = field.validation?.required || false;

  field.conditionalLogic.forEach((rule) => {
    const fieldValue = formValues[rule.field];
    const conditionMet = evaluateCondition(fieldValue, rule.operator, rule.value);

    if (conditionMet) {
      switch (rule.action) {
        case 'show':
          visible = true;
          break;
        case 'hide':
          visible = false;
          break;
        case 'require':
          required = true;
          break;
        case 'disable':
          disabled = true;
          break;
      }
    }
  });

  return { visible, disabled, required };
}

function isFieldAllowedForRoleAndMode(
  field: DynamicField,
  role?: string,
  mode: QualityFormMode = 'create'
): { visible: boolean; editable: boolean } {
  const normalizedRole = String(role || '').trim();
  const visibleRoles = field.roleVisibility?.visibleTo || [];
  const editableRoles = field.roleVisibility?.editableBy || [];
  const modeVisible = field.modeVisibility?.[mode === 'mobile' ? 'create' : mode];
  const visible = (modeVisible !== false) && (visibleRoles.length === 0 || visibleRoles.includes(normalizedRole));
  const editable = editableRoles.length === 0 || editableRoles.includes(normalizedRole);
  return { visible, editable };
}

// ============================================================================
// MAIN FORM RENDERER
// ============================================================================

export interface DynamicFormRendererProps {
  formId?: string;
  formType?: DynamicForm['type'];
  config?: DynamicForm;
  initialValues?: Record<string, unknown>;
  qualityTemplateContext?: ActiveQualityFormContext & { role?: string; mode?: QualityFormMode };
  onSubmit?: (data: Record<string, unknown>) => void | Promise<void>;
  onChange?: (data: Record<string, unknown>) => void;
  readOnly?: boolean;
  showSubmitButton?: boolean;
  submitLabel?: string;
  submitActions?: Array<{ id: string; label: string; value: string; description?: string }>;
  compactMode?: 'shopfloor';
  className?: string;
}

// FIELD COMPONENTS
// ============================================================================

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  formId,
  formType,
  config: propConfig,
  initialValues = {},
  qualityTemplateContext,
  onSubmit,
  onChange,
  readOnly = false,
  showSubmitButton = true,
  submitLabel = 'Submit',
  submitActions = [],
  compactMode,
  className = '',
}) => {
  const { forms, getFormByType } = useConfigStore();

  const formConfig = useMemo(() => {
    if (propConfig) return propConfig;
    if (formType === 'defect-log') {
      const activeQualityTemplate = loadActiveQualityFormTemplate({
        entityType: 'defect-log',
        recordType: qualityTemplateContext?.recordType || String(initialValues.recordType || ''),
        factory: qualityTemplateContext?.factory || String(initialValues.factory || ''),
        workshop: qualityTemplateContext?.workshop || String(initialValues.workshop || ''),
        line: qualityTemplateContext?.line || String(initialValues.productionLine || ''),
        inspectionPoint: qualityTemplateContext?.inspectionPoint || String(initialValues.defaultInspectionPoint || ''),
        product: qualityTemplateContext?.product || String(initialValues.productFamily || ''),
        model: qualityTemplateContext?.model || String(initialValues.model || ''),
      });
      if (activeQualityTemplate) return qualityTemplateToDynamicForm(activeQualityTemplate);
    }
    if (formId) return forms.find((f) => f.id === formId);
    if (formType) return getFormByType(formType);
    return null;
  }, [forms, formId, formType, propConfig, getFormByType, qualityTemplateContext, initialValues]);

  // Merge field default values into initialValues
  const mergedInitialValues = useMemo(() => {
    if (!formConfig) return initialValues;
    const defaults: Record<string, unknown> = {};
    formConfig.fields.forEach((field) => {
      if (field.defaultValue !== undefined && initialValues[field.name] === undefined) {
        defaults[field.name] = field.defaultValue;
      }
    });
    return { ...defaults, ...initialValues };
  }, [formConfig, initialValues]);

  if (!formConfig) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-gray-500 mb-4" />
        <p className="text-gray-400">Form configuration not found</p>
      </div>
    );
  }

  return (
    <DynamicFormContent
      formConfig={formConfig}
      initialValues={mergedInitialValues}
      onSubmit={onSubmit}
      onChange={onChange}
      readOnly={readOnly}
      showSubmitButton={showSubmitButton}
      submitLabel={submitLabel}
      submitActions={submitActions}
      role={qualityTemplateContext?.role}
      mode={qualityTemplateContext?.mode || 'create'}
      compactMode={compactMode}
      className={className}
    />
  );
};

interface DynamicFormContentProps {
  formConfig: DynamicForm;
  initialValues: Record<string, unknown>;
  onSubmit?: (data: Record<string, unknown>) => void | Promise<void>;
  onChange?: (data: Record<string, unknown>) => void;
  readOnly: boolean;
  showSubmitButton: boolean;
  submitLabel: string;
  submitActions: Array<{ id: string; label: string; value: string; description?: string }>;
  role?: string;
  mode: QualityFormMode;
  compactMode?: 'shopfloor';
  className: string;
}

const DynamicFormContent: React.FC<DynamicFormContentProps> = ({
  formConfig,
  initialValues,
  onSubmit,
  onChange,
  readOnly,
  showSubmitButton,
  submitLabel,
  submitActions,
  role: propRole,
  mode: propMode,
  compactMode,
  className,
}) => {
  const [focusedFieldId, setFocusedFieldId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'form' | 'grid'>('form');
  const [currentStep, setCurrentStep] = useState(0);
  const [useWizard, setUseWizard] = useState(true);

  const role = propRole || 'admin';
  const mode = propMode || 'create';

  const effectiveFields = useMemo(() => (
    formConfig.fields.filter((field) => isFieldAllowedForRoleAndMode(field, role, mode).visible)
  ), [formConfig.fields, role, mode]);
  const validationSchema = buildValidationSchema(effectiveFields);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAction, setSubmitAction] = useState('submit');
  const submitActionRef = useRef('submit');
  const [activeLookups, setActiveLookups] = useState<Record<string, boolean>>({});
  const [lookupErrors, setLookupErrors] = useState<Record<string, string>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [aiFilledFields, setAiFilledFields] = useState<string[]>([]);

  // Initialize draft from localStorage if formId exists
  const draftKey = formConfig.id ? `qms_draft_${formConfig.id}` : null;
  const initialData = useMemo(() => {
    if (draftKey && !readOnly && (!initialValues || Object.keys(initialValues).length === 0)) {
      try {
        const saved = localStorage.getItem(draftKey);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse draft', e);
      }
    }
    return initialValues as any;
  }, [draftKey, initialValues, readOnly]);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
    watch,
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: initialData,
    mode: 'all',
  });

  // Sync initialData when parent updates and form is clean (prevents overwriting parent state)
  useEffect(() => {
    if (initialData && !isDirty) {
      reset(initialData);
    }
  }, [initialData, isDirty, reset]);

  const formValues = watch();
  const { externalDataSources, forms } = useConfigStore();

  // Auto-Save Draft
  useEffect(() => {
    if (readOnly || !draftKey) return;
    const timer = setTimeout(() => {
      if (Object.keys(formValues).length > 0) {
        localStorage.setItem(draftKey, JSON.stringify(formValues));
        setLastSaved(new Date());
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [formValues, readOnly, draftKey]);

  // Keyboard shortcut for Submit & Save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(onSubmit as any)();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!readOnly && draftKey) {
          localStorage.setItem(draftKey, JSON.stringify(formValues));
          setLastSaved(new Date());
          toast.success('Draft saved successfully', { position: 'bottom-center' });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit, onSubmit, formValues, readOnly, draftKey]);

  const handleAutoAdvance = useCallback((currentFieldId: string) => {
    if (!formConfig) return;
    const allVisibleFields = formConfig.fields.filter(f => {
      const state = checkFieldVisibility(f, formValues as Record<string, unknown>);
      const roleModeState = isFieldAllowedForRoleAndMode(f, role, mode);
      return state.visible && roleModeState.visible;
    });
    
    const currentIndex = allVisibleFields.findIndex(f => f.id === currentFieldId);
    if (currentIndex >= 0 && currentIndex < allVisibleFields.length - 1) {
      setFocusedFieldId(allVisibleFields[currentIndex + 1].id);
    }
  }, [formConfig, formValues, role, mode]);

  // Handle formula calculations and field visibilityc
  useEffect(() => {
    let hasChanged = false;
    const newValues = { ...formValues };

    formConfig.fields.forEach((field) => {
      // Skip if not formula or calculated
      if (field.type !== 'formula' && field.type !== 'calculated') return;
      if (!field.formula?.expression) return;

      const evaluator = new FormulaEvaluator({
        ...newValues,
        __dataSources: externalDataSources,
      });
      const result = evaluator.evaluate(field.formula.expression);
      
      if (result !== undefined && result !== null && result !== newValues[field.name]) {
        newValues[field.name] = result;
        hasChanged = true;
      }
    });

    if (hasChanged) {
      Object.entries(newValues).forEach(([key, val]) => {
        if (val !== formValues[key]) {
          setValue(key, val, { shouldValidate: true, shouldDirty: true });
        }
      });
    }
  }, [formValues, formConfig.fields, externalDataSources, setValue]);

  // 2. Lookup-based linking (Sync for Store Data)
  useEffect(() => {
    let hasChanged = false;
    const newValues = { ...formValues };

    formConfig.fields.forEach((field) => {
      if (field.lookup && field.dependsOn) {
        const triggerValue = newValues[field.dependsOn];
        if (triggerValue !== undefined && triggerValue !== null && triggerValue !== '') {
          const cfg = field.lookup;
          
          // External/Excel Lookup (Synchronous from store)
          if (cfg.sourceType === 'external' || cfg.sourceType === 'excel') {
            const ds = externalDataSources.find(
              (s) => s.id === cfg.externalSourceId || s.name === cfg.externalSourceId
            );
            if (ds && ds.data) {
              const row = ds.data.find((r) => r[cfg.matchField || 'id'] == triggerValue);
              const result = row ? row[cfg.sourceField || 'name'] : null;
              const existingValue = newValues[field.name];
              const canAutoFill = field.type === 'lookup' || field.editable === false || existingValue === undefined || existingValue === null || String(existingValue).trim() === '';
              if (canAutoFill && result !== undefined && result !== null && result !== newValues[field.name]) {
                newValues[field.name] = result;
                hasChanged = true;
              }
            }
          }
        }
      }
    });

    if (hasChanged) {
      Object.entries(newValues).forEach(([key, val]) => {
        if (val !== formValues[key]) {
          setValue(key, val, { shouldValidate: true, shouldDirty: true });
        }
      });
    }
  }, [formValues, formConfig.fields, externalDataSources, setValue]);

  // 3. Async Lookup Handler (Debounced & Loading state)
  useEffect(() => {
    const lookupFields = formConfig.fields.filter(
      (f) => f.type === 'lookup' && f.lookup?.sourceType === 'internal' && f.dependsOn
    );

    const timeouts: Record<string, number> = {};

    lookupFields.forEach((field) => {
      const triggerValue = formValues[field.dependsOn!];
      if (!triggerValue) return;

      const cfg = field.lookup!;
      const sourceForm = forms.find((f) => f.id === cfg.sourceFormId);
      if (!sourceForm) return;

      const moduleKeyMap: Record<string, string> = {
        ncr: 'ncr',
        capa: 'capa',
        '8d': 'eight-d',
        fmea: 'fmea',
        complaint: 'complaints',
        supplier: 'suppliers',
        audit: 'audits',
        inspection: 'inspections',
        calibration: 'calibrations',
        'defect-log': 'defect-logs',
      };

      const apiKey = moduleKeyMap[sourceForm.type] as any;
      const api = apiKey ? (unifiedApiRegistry as any)[apiKey] : null;

      if (api) {
        // Debounce: wait 500ms after user stops typing
          timeouts[field.name] = window.setTimeout(async () => {
            setActiveLookups(prev => ({ ...prev, [field.name]: true }));
            setLookupErrors(prev => ({ ...prev, [field.name]: '' }));
            try {
              const res = await api.getAll({
                search: String(triggerValue),
                limit: 10,
              });

              if (res.data && res.data.length > 0) {
                const row = res.data.find(
                  (r: any) => String(r[cfg.matchField || 'id']) === String(triggerValue)
                );
                if (row) {
                  const result = row[cfg.sourceField || 'name'];
                  if (result !== undefined && result !== null && result !== formValues[field.name]) {
                    setValue(field.name, result, { shouldValidate: true, shouldDirty: true });
                  }
                } else {
                  setLookupErrors(prev => ({ ...prev, [field.name]: 'No exact match found' }));
                }
              } else {
                setLookupErrors(prev => ({ ...prev, [field.name]: 'No data found' }));
              }
            } catch (e) {
              console.error(`Lookup failed for field ${field.name}`, e);
              setLookupErrors(prev => ({ ...prev, [field.name]: 'Connection failed' }));
            } finally {
              setActiveLookups(prev => ({ ...prev, [field.name]: false }));
            }
          }, 500);
      }
    });

    return () => {
      Object.values(timeouts).forEach(t => window.clearTimeout(t));
    };
  }, [formValues, formConfig.fields, forms, setValue]);

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    const currentSubmitAction = submitActionRef.current || submitAction;
    try {
      setIsSubmitting(true);
      const missingConditional = effectiveFields
        .filter((field) => {
          const state = checkFieldVisibility(field, data);
          if (!state.visible || !state.required || currentSubmitAction === 'draft') return false;
          const value = data[field.name];
          if (value === null || value === undefined) return true;
          if (typeof value === 'string') return value.trim() === '';
          if (typeof value === 'number') return !Number.isFinite(value) || value <= 0;
          if (Array.isArray(value)) return value.length === 0;
          return false;
        })
        .map((field) => field.label);

      if (missingConditional.length > 0) {
        toast.error('Required routing fields are missing', {
          description: `Please complete: ${missingConditional.join(', ')}`,
        });
        return;
      }

      await onSubmit?.({ ...data, __submitAction: submitActionRef.current });
    } catch (e: any) {
      toast.error('Failed to submit', { description: e?.message || 'Unknown error' });
      throw e;
    } finally {
      setIsSubmitting(false);
      submitActionRef.current = 'submit';
      setSubmitAction('submit');
    }
  };

  // 3. Quality master-data lookup auto-fill from the local offline master tables.
  useEffect(() => {
    let hasChanged = false;
    const newValues = { ...formValues };

    formConfig.fields.forEach((field) => {
      if (!field.qualityLookup) return;
      const selectedValue = newValues[field.name];
      if (selectedValue === undefined || selectedValue === null || String(selectedValue).trim() === '') return;

      const cfg = field.qualityLookup;
      const rows = loadQualityMasterTable(cfg.sourceTable).filter((row) => row.isActive !== false);
      const selectedText = String(selectedValue).trim().toLowerCase();
      const row = rows.find((candidate) => {
        const keyValue = String(candidate[cfg.keyColumn] ?? '').trim().toLowerCase();
        const displayValue = String(candidate[cfg.displayColumn] ?? '').trim().toLowerCase();
        return keyValue === selectedText || displayValue === selectedText;
      });
      if (!row) return;

      cfg.autoFillMappings?.forEach((mapping) => {
        const nextValue = row[mapping.sourceColumn];
        if (nextValue === undefined || nextValue === null) return;
        const currentValue = newValues[mapping.targetField];
        const isEmpty = currentValue === undefined || currentValue === null || String(currentValue).trim() === '';
        const targetField = formConfig.fields.find((candidate) => candidate.name === mapping.targetField);
        const targetIsReadonly = mapping.readOnly || targetField?.editable === false;
        const behavior = cfg.overwriteBehavior || (cfg.fillEmptyOnly === false ? 'ask-before-overwrite' : 'fill-empty-only');
        const canFill = behavior === 'always-overwrite'
          || (behavior === 'read-only-only' && targetIsReadonly)
          || (behavior === 'fill-empty-only' && isEmpty)
          || (behavior === 'ask-before-overwrite' && (isEmpty || targetIsReadonly));
        if (behavior === 'ask-before-overwrite' && !isEmpty && !targetIsReadonly && String(currentValue ?? '') !== String(nextValue ?? '')) {
          const approved = window.confirm(`Overwrite ${targetField?.label || mapping.targetField} with lookup value from ${field.label}?`);
          if (!approved) return;
        }
        if (canFill && String(currentValue ?? '') !== String(nextValue ?? '')) {
          newValues[mapping.targetField] = nextValue;
          hasChanged = true;
        }
      });
    });

    if (hasChanged) {
      Object.entries(newValues).forEach(([key, val]) => {
        if (val !== formValues[key]) {
          setValue(key, val, { shouldValidate: true, shouldDirty: true });
        }
      });
    }
  }, [formValues, formConfig.fields, setValue]);


  const onInvalid = (errors: any) => {
    console.error('Form Validation Errors:', errors);
    const errorFields = Object.keys(errors);
    const firstError = Object.values(errors)[0] as any;
    
    toast.error('Validation Error', {
      description: `Please check: ${errorFields.join(', ')}. ${firstError?.message || ''}`,
    });
  };

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (isDirty) {
      onChangeRef.current?.(formValues as Record<string, unknown>);
    }
  }, [formValues, isDirty]);

  const renderField = useCallback(
    (field: DynamicField) => {
      const state = checkFieldVisibility(field, formValues as Record<string, unknown>);
      const roleModeState = isFieldAllowedForRoleAndMode(field, role, mode);
      if (!state.visible || !roleModeState.visible) return null;

      const commonProps = {
        field,
        value: formValues[field.name],
        onChange: (val: unknown) => {
          setValue(field.name, val, { shouldValidate: true, shouldDirty: true });
        },
        error: lookupErrors[field.name] || (errors[field.name]?.message as string),
        disabled: readOnly || state.disabled || !roleModeState.editable,
        required: state.required,
        isFocused: focusedFieldId === field.id,
        onFocus: () => setFocusedFieldId(field.id),
        onAutoAdvance: () => handleAutoAdvance(field.id),
      };

      const hasFloatingLabel = ['text', 'textarea', 'number', 'calculated', 'select'].includes(field.type);
      const isFocused = focusedFieldId === field.id;
      const isDimmed = focusedFieldId !== null && !isFocused;
      const errorMsg = ((errors as any)?.[field.name]?.message as string | undefined) || lookupErrors[field.name];
      const isAiFilled = aiFilledFields.includes(field.name);

      return (
        <motion.div 
          key={field.id}
          initial={{ opacity: 0, y: 20 }}
          animate={
            errorMsg 
              ? { opacity: 1, y: 0, x: [-5, 5, -5, 5, 0], scale: 1 } 
              : isAiFilled
                ? { opacity: 1, y: 0, scale: [1, 1.05, 1], boxShadow: ["0 0 0px rgba(0,163,224,0)", "0 0 20px rgba(0,163,224,0.6)", "0 0 0px rgba(0,163,224,0)"] }
                : { opacity: isDimmed ? 0.4 : 1, y: 0, scale: isFocused ? 1.02 : 1 }
          }
          exit={{ opacity: 0, height: 0, margin: 0 }}
          transition={{ duration: errorMsg ? 0.4 : isAiFilled ? 1 : 0.3, ease: "easeOut" }}
          className={`space-y-3 group/field transition-all duration-300 ${isFocused ? 'ring-2 ring-[#00A3E0]/50 rounded-xl p-2 bg-white/5' : ''} ${errorMsg ? 'ring-2 ring-red-500/50 rounded-xl p-2 bg-red-500/5' : ''} ${isAiFilled ? 'ring-2 ring-[#00A3E0] rounded-xl p-2 bg-[#00A3E0]/5' : ''}`}
          onClick={() => {
            setFocusedFieldId(field.id);
            if (isAiFilled) {
              setAiFilledFields(prev => prev.filter(f => f !== field.name));
            }
          }}
        >
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              {!hasFloatingLabel && (
                <label className="text-sm font-black text-white/60 group-hover/field:text-[#00A3E0] transition-colors uppercase tracking-wider flex items-center gap-2">
                  {field.label}
                  {state.required && <span className="text-red-500">*</span>}
                </label>
              )}
              {activeLookups[field.name] && (
                <RefreshCw className="w-3 h-3 text-[#00A3E0] animate-spin" />
              )}
            </div>
            {field.helpText && (
              <div className="relative group/help">
                <Info className="w-4 h-4 text-white/20 hover:text-white/60 cursor-help transition-colors" />
                <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-900 border border-white/10 rounded-lg text-[10px] text-white/80 opacity-0 group-hover/help:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                  {field.helpText}
                </div>
              </div>
            )}
          </div>

          <Controller
            name={field.name}
            control={control}
            render={({ field: rhfField }) => {
              const props = {
                ...commonProps,
                value: rhfField.value,
                onChange: rhfField.onChange,
                error: errorMsg,
              };

              switch (field.type) {
                case 'textarea':
                  return <TextAreaField {...props} />;
                case 'number':
                case 'calculated':
                  return <NumberField {...props} />;
                case 'select':
                  return <SelectField {...props} />;
                case 'multiselect':
                  return <MultiSelectField {...props} />;
                case 'checkbox-group':
                  return <CheckboxGroupField {...props} />;
                case 'checkbox':
                  return (
                    <div className="flex items-center gap-3 p-4 pro-input group/check cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!props.value}
                        onChange={(e) => props.onChange(e.target.checked)}
                        disabled={props.disabled}
                        className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#0066CC] focus:ring-[#0066CC]/20"
                      />
                      <span className="text-sm font-bold text-white/70 group-hover/check:text-white transition-colors">
                        {field.label}
                      </span>
                    </div>
                  );
                case 'radio':
                  return <RadioField {...props} />;
                case 'button-group':
                  return <ButtonGroupField {...props} />;
                case 'date':
                case 'datetime':
                  return <DateField {...props} />;
                case 'file':
                  return (
                    <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-white/10 rounded-2xl bg-white/2 hover:bg-white/5 hover:border-[#0066CC]/50 transition-all cursor-pointer group/file">
                      <Upload className="w-10 h-10 text-white/20 group-hover/file:text-[#0066CC] group-hover/file:scale-110 transition-all duration-300 mb-4" />
                      <p className="text-sm font-black text-white/40 group-hover/file:text-white/60">Drag and drop files here or click to browse</p>
                      <p className="text-[10px] text-white/20 uppercase tracking-widest mt-2">Max size: 10MB</p>
                    </div>
                  );
                case 'signature':
                  return <SignatureField {...props} />;
                case 'barcode':
                  return <BarcodeField {...props} />;
                case 'formula':
                  return (
                    <div className="flex items-center gap-4 px-6 py-4 bg-[#0066CC]/5 border border-[#0066CC]/20 rounded-xl">
                      <Calculator className="w-5 h-5 text-[#00A3E0]" />
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-tighter text-[#00A3E0] font-black">Calculated Result</span>
                        <span className="text-lg font-black text-white">{String(props.value || '---')}</span>
                      </div>
                    </div>
                  );
                case 'lookup':
                  return (
                    <div className="flex items-center gap-4 px-6 py-4 bg-[#00A3E0]/5 border border-[#00A3E0]/20 rounded-xl">
                      <Barcode className="w-5 h-5 text-[#00A3E0]" />
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-tighter text-[#00A3E0] font-black">Linked Data</span>
                        <span className="text-lg font-black text-white">{String(props.value || '---')}</span>
                      </div>
                    </div>
                  );
                case 'chart':
                  return <ChartField {...props} formValues={formValues as Record<string, unknown>} />;
                default:
                  return <TextField {...props} />;
              }
            }}
          />
        </motion.div>
      );
    },
    [activeLookups, control, errors, formValues, lookupErrors, mode, readOnly, role, aiFilledFields]
  );

  const isShopfloor = compactMode === 'shopfloor';

  const handleAiAutoFill = useCallback((data: Record<string, any>) => {
    const filledNames: string[] = [];
    Object.entries(data).forEach(([key, val]) => {
      setValue(key, val, { shouldValidate: true, shouldDirty: true });
      filledNames.push(key);
    });
    setAiFilledFields(filledNames);
    
    // Clear the highlight after 3 seconds
    setTimeout(() => {
      setAiFilledFields([]);
    }, 3000);
  }, [setValue]);

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit, onInvalid)}
      className={`${isShopfloor ? 'space-y-5' : 'space-y-12'} animate-in fade-in duration-700 ${className}`}
    >
      {/* Form Header */}
      {!isShopfloor && <div className="relative overflow-hidden p-10 rounded-[2rem] pro-card border-none bg-gradient-to-br from-[#0066CC]/20 via-[#0066CC]/5 to-transparent">
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0066CC]/20 border border-[#0066CC]/30 text-[#00A3E0] text-[10px] font-bold uppercase tracking-widest">
            Industrial Form System
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight leading-none">
            {formConfig.name}
          </h2>
          {formConfig.description && (
            <p className="text-white/60 text-lg max-w-3xl font-medium leading-relaxed">
              {formConfig.description}
            </p>
          )}
        </div>
        
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00A3E0]/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#0066CC]/10 rounded-full blur-[80px] -ml-32 -mb-32" />
        <div className="absolute top-1/2 right-10 -translate-y-1/2 opacity-10">
          <Barcode className="w-32 h-32 text-white" />
        </div>
      </div>}

      {!readOnly && mode !== 'detail' && viewMode === 'form' && (
        <div className="flex justify-center -mt-4 mb-4">
          <SmartFormCopilot 
            onAutoFill={handleAiAutoFill} 
            fields={formConfig.fields.map(f => ({ name: f.name, label: f.label, type: f.type }))} 
          />
        </div>
      )}

      {mode === 'create' && !readOnly && (
        <div className="flex justify-end px-2">
          <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
            <button
              type="button"
              onClick={() => setViewMode('form')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'form' ? 'bg-[#00A3E0] text-white shadow-lg' : 'text-white/40 hover:text-white/80'
              }`}
            >
              Form View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'grid' ? 'bg-green-500 text-white shadow-lg' : 'text-white/40 hover:text-white/80'
              }`}
            >
              Grid View (Mass Entry)
            </button>
          </div>
        </div>
      )}

      {viewMode === 'grid' ? (
        <DataEntryGrid 
          formConfig={formConfig} 
          role={role} 
          mode={mode}
          onSubmitAll={async (records) => {
            if (records.length > 0) {
              try {
                toast.success(`Simulating mass submission of ${records.length} records!`);
                await onSubmit?.({ ...records[0], __submitAction: 'submit' });
              } catch (e) {
                console.error(e);
              }
            }
          }}
        />
      ) : (
      <>
        {/* Wizard Progress Bar */}
        {useWizard && formConfig.sections && formConfig.sections.length > 1 && !isShopfloor && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-white/60">
                Step {currentStep + 1} of {formConfig.sections.length + (formConfig.fields.some(f => !f.section) ? 1 : 0)}
              </span>
              <span className="text-sm font-bold text-[#00A3E0]">
                {Math.round(((currentStep + 1) / (formConfig.sections.length + (formConfig.fields.some(f => !f.section) ? 1 : 0))) * 100)}% Completed
              </span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#0066CC] to-[#00A3E0]"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / (formConfig.sections.length + (formConfig.fields.some(f => !f.section) ? 1 : 0))) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => setUseWizard(false)}
                className="text-[10px] text-white/30 hover:text-white/60 uppercase tracking-widest transition-colors"
              >
                Disable Wizard Mode
              </button>
            </div>
          </div>
        )}

        {!useWizard && formConfig.sections && formConfig.sections.length > 1 && !isShopfloor && (
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={() => {
                setUseWizard(true);
                setCurrentStep(0);
              }}
              className="text-[10px] text-white/30 hover:text-white/60 uppercase tracking-widest transition-colors"
            >
              Enable Wizard Mode
            </button>
          </div>
        )}

        {/* Form Sections */}
        <div className={isShopfloor ? 'space-y-4' : 'space-y-8 md:space-y-16'}>
        <AnimatePresence mode="wait">
          {formConfig.sections?.map((section, idx) => {
            if (useWizard && formConfig.sections && formConfig.sections.length > 1 && !isShopfloor && currentStep !== idx) return null;

            return (
              <motion.div 
                key={section.id} 
                initial={useWizard ? { opacity: 0, x: 20 } : undefined}
                animate={useWizard ? { opacity: 1, x: 0 } : undefined}
                exit={useWizard ? { opacity: 0, x: -20 } : undefined}
                transition={{ duration: 0.3 }}
                className={`${isShopfloor ? 'rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4' : 'pro-card p-4 md:p-8 space-y-6 md:space-y-8 border-white/5'}`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className={`${isShopfloor ? 'h-6 w-1' : 'h-8 md:h-10 w-1.5 md:w-2'} bg-gradient-to-b from-[#0066CC] to-[#00A3E0] rounded-full shadow-[0_0_20px_rgba(0,163,224,0.4)]`} />
                    <h3 className={`${isShopfloor ? 'text-base' : 'text-xl md:text-2xl'} font-black text-white tracking-tight`}>
                      {section.title}
                    </h3>
                    <div className="flex-1 h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
                  </div>
                  {section.description && (
                    <p className="text-white/40 text-xs md:text-sm font-medium ml-4 md:ml-6 italic">{section.description}</p>
                  )}
                </div>

                <div className={`grid grid-cols-1 ${isShopfloor ? 'gap-4' : 'md:grid-cols-2 gap-x-6 md:gap-x-10 gap-y-6 md:gap-y-8'}`}>
                  <AnimatePresence mode="popLayout">
                    {section.fields.map((fieldId) => {
                      const field = formConfig.fields.find((f) => f.id === fieldId);
                      if (!field) return null;
                      
                      // Determine if field should take full width
                      const isFullWidth = field.type === 'textarea' || field.type === 'chart' || field.type === 'file' || field.type === 'signature' || field.type === 'checkbox-group';
                      
                      return (
                        <div key={field.id} className={`${isFullWidth ? 'md:col-span-2' : ''} group/field`}>
                          {renderField(field)}
                        </div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}

          {/* Fields not in any section */}
          {formConfig.fields.filter(f => !f.section || !formConfig.sections?.find(s => s.id === f.section)).length > 0 && (
            (!useWizard || isShopfloor || !formConfig.sections || currentStep === formConfig.sections.length) && (
              <motion.div 
                key="additional-details"
                initial={useWizard ? { opacity: 0, x: 20 } : undefined}
                animate={useWizard ? { opacity: 1, x: 0 } : undefined}
                exit={useWizard ? { opacity: 0, x: -20 } : undefined}
                transition={{ duration: 0.3 }}
                className={`${isShopfloor ? 'rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 space-y-4' : 'pro-card p-8 space-y-8 border-dashed border-white/10'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-2 bg-slate-600 rounded-full" />
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase">Additional Details</h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
                </div>
                <div className={`grid grid-cols-1 ${isShopfloor ? 'gap-4' : 'md:grid-cols-2 gap-x-10 gap-y-8'}`}>
                  <AnimatePresence mode="popLayout">
                    {formConfig.fields
                      .filter(f => !f.section || !formConfig.sections?.find(s => s.id === f.section))
                      .map((field) => {
                        const isFullWidth = field.type === 'textarea' || field.type === 'chart' || field.type === 'file' || field.type === 'signature' || field.type === 'checkbox-group';
                        return (
                          <div key={field.id} className={`${isFullWidth ? 'md:col-span-2' : ''} group/field`}>
                            {renderField(field)}
                          </div>
                        );
                      })}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
        </div>

        {showSubmitButton && !readOnly && (
          <div className="pt-12 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              {lastSaved && (
                <motion.span 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-medium text-white/50 flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Draft saved {lastSaved.toLocaleTimeString()}
                </motion.span>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 w-full sm:w-auto">
              {useWizard && formConfig.sections && formConfig.sections.length > 1 && !isShopfloor && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={currentStep === 0}
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="w-full sm:w-auto px-6 py-4 sm:px-8 sm:py-6 border-white/10 text-white hover:bg-white/10 font-black rounded-2xl"
                  >
                    Previous Step
                  </Button>
                  
                  {currentStep < (formConfig.sections.length - 1 + (formConfig.fields.some(f => !f.section) ? 1 : 0)) ? (
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(prev => prev + 1)}
                      className="group relative w-full sm:w-auto px-8 py-4 sm:px-12 sm:py-6 bg-[#0066CC] hover:bg-[#00A3E0] text-white text-base sm:text-lg font-black rounded-2xl shadow-xl transition-all duration-300"
                    >
                      Next Step
                    </Button>
                  ) : (
                    // Final Submit Button
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      {submitActions.map((action) => (
                        <Button
                          key={action.id}
                          type="submit"
                          variant="outline"
                          disabled={isSubmitting}
                          onClick={() => {
                            submitActionRef.current = action.value;
                            setSubmitAction(action.value);
                          }}
                          className="w-full sm:w-auto px-6 py-4 sm:px-8 sm:py-6 border-white/10 text-white hover:bg-white/10 font-black rounded-2xl"
                          title={action.description}
                        >
                          {action.label}
                        </Button>
                      ))}
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        onClick={() => {
                          submitActionRef.current = 'submit';
                          setSubmitAction('submit');
                        }}
                        className="group relative w-full sm:w-auto px-8 py-4 sm:px-16 sm:py-7 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white text-base sm:text-xl font-black rounded-2xl shadow-2xl shadow-green-500/40 hover:scale-[1.02] sm:hover:scale-[1.05] active:scale-[0.95] transition-all duration-300 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <div className="relative z-10 flex items-center justify-center gap-3">
                          {isSubmitting ? (
                            <>
                              <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Check className="w-5 h-5 sm:w-7 sm:h-7" />
                              {submitLabel}
                            </>
                          )}
                        </div>
                      </Button>
                    </div>
                  )}
                </>
              )}

              {(!useWizard || !(formConfig.sections && formConfig.sections.length > 1) || isShopfloor) && (
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  {submitActions.map((action) => (
                    <Button
                      key={action.id}
                      type="submit"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => {
                        submitActionRef.current = action.value;
                        setSubmitAction(action.value);
                      }}
                      className="w-full sm:w-auto px-6 py-4 sm:px-8 sm:py-6 border-white/10 text-white hover:bg-white/10 font-black rounded-2xl"
                      title={action.description}
                    >
                      {action.label}
                    </Button>
                  ))}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={() => {
                      submitActionRef.current = 'submit';
                      setSubmitAction('submit');
                    }}
                    className="group relative w-full sm:w-auto px-8 py-4 sm:px-16 sm:py-7 bg-gradient-to-r from-[#0066CC] to-[#00A3E0] hover:from-[#0052a3] hover:to-[#008cc2] text-white text-base sm:text-xl font-black rounded-2xl shadow-2xl shadow-[#0066CC]/40 hover:scale-[1.02] sm:hover:scale-[1.05] active:scale-[0.95] transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <div className="relative z-10 flex items-center justify-center gap-3">
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5 sm:w-7 sm:h-7" />
                          {submitLabel}
                        </>
                      )}
                    </div>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </>
      )}
    </form>
  );
};

export default DynamicFormRenderer;
