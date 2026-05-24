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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CalendarIcon,
  ChevronDown,
  Info,
  AlertCircle,
  Check,
  Upload,
  ScanLine,
  Calculator,
  RefreshCw,
  X,
} from 'lucide-react';
import { useConfigStore, type DynamicForm, type DynamicField } from '../stores/configStore';
import { FormulaEvaluator } from '../utils/formulaEvaluator';
import { unifiedApiRegistry } from '../api/unified-api';
import { loadQualityMasterTable } from '@/services/qualityMasterData';
import {
  loadActiveQualityFormTemplate,
  qualityTemplateToDynamicForm,
  type ActiveQualityFormContext,
  type QualityFormMode,
} from '@/services/qualityFormTemplates';
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
    <div className="space-y-3">
      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
        {cfg?.chartType === 'bar' && (
          <BarChart width={600} height={240} data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="y" fill="#00A3E0" radius={[6, 6, 0, 0]} />
          </BarChart>
        )}

        {cfg?.chartType === 'line' && (
          <LineChart width={600} height={240} data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="y" stroke="#00A3E0" strokeWidth={3} dot />
          </LineChart>
        )}

        {cfg?.chartType === 'pie' && (
          <PieChart width={600} height={240}>
            <Tooltip />
            <Pie data={chartData} dataKey="y" nameKey="x" cx="50%" cy="50%" outerRadius={90}>
              {chartData.map((_, idx) => (
                <Cell key={idx} fill={colors[idx % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        )}
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
// FIELD COMPONENTS
// ============================================================================

interface FieldComponentProps {
  field: DynamicField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
}

const TextField: React.FC<FieldComponentProps> = ({ field, value, onChange, error, disabled }) => (
  <div className="space-y-3">
    <div className="relative group/input">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0066CC] to-[#00A3E0] rounded-xl blur opacity-0 group-hover/input:opacity-10 transition duration-500" />
      <input
        type="text"
        value={value as string || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled}
        className={`
          pro-input relative w-full px-5 py-4 text-base transition-all duration-300
          ${error ? 'border-red-500/50 bg-red-500/5' : ''}
          placeholder:text-gray-600
        `}
      />
    </div>
    {error && (
      <p className="text-red-400 text-xs font-bold flex items-center gap-1.5 px-1 animate-in slide-in-from-top-1">
        <AlertCircle className="w-3.5 h-3.5" />
        {error}
      </p>
    )}
  </div>
);

const NumberField: React.FC<FieldComponentProps> = ({ field, value, onChange, error, disabled }) => (
  <div className="space-y-3">
    <div className="relative group/input">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0066CC] to-[#00A3E0] rounded-xl blur opacity-0 group-hover/input:opacity-10 transition duration-500" />
      <input
        type="number"
        value={value === undefined || value === null ? '' : Number(value)}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === '' ? null : Number(val));
        }}
        placeholder={field.placeholder}
        disabled={disabled}
        className={`
          pro-input relative w-full px-5 py-4 text-base transition-all duration-300
          ${error ? 'border-red-500/50 bg-red-500/5' : ''}
          placeholder:text-gray-600
        `}
      />
    </div>
    {error && (
      <p className="text-red-400 text-xs font-bold flex items-center gap-1.5 px-1 animate-in slide-in-from-top-1">
        <AlertCircle className="w-3.5 h-3.5" />
        {error}
      </p>
    )}
  </div>
);

const TextAreaField: React.FC<FieldComponentProps> = ({ field, value, onChange, error, disabled }) => (
  <div className="space-y-3">
    <div className="relative group/input">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0066CC] to-[#00A3E0] rounded-xl blur opacity-0 group-hover/input:opacity-10 transition duration-500" />
      <textarea
        value={value as string || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled}
        rows={5}
        className={`
          pro-input relative w-full px-5 py-4 text-base transition-all duration-300 resize-none
          ${error ? 'border-red-500/50 bg-red-500/5' : ''}
          placeholder:text-gray-600
        `}
      />
    </div>
    {error && (
      <p className="text-red-400 text-xs font-bold flex items-center gap-1.5 px-1 animate-in slide-in-from-top-1">
        <AlertCircle className="w-3.5 h-3.5" />
        {error}
      </p>
    )}
  </div>
);

const SelectField: React.FC<FieldComponentProps> = ({ field, value, onChange, error, disabled }) => {
  const { optionSets } = useConfigStore();
  const options = field.optionSetId ? optionSets.find(s => s.id === field.optionSetId)?.items : field.options;

  return (
    <div className="space-y-3">
      <div className="relative group/input">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0066CC] to-[#00A3E0] rounded-xl blur opacity-0 group-hover/input:opacity-10 transition duration-500" />
        <select
          value={value as string || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`
            pro-input relative w-full px-5 py-4 text-base transition-all duration-300 appearance-none
            bg-[#1a1a1f] text-white border-white/10
            ${error ? 'border-red-500/50 bg-red-500/5' : ''}
          `}
        >
          <option value="" className="bg-[#1a1a1f] text-white/50">{field.placeholder || 'Choose an option...'}</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#1a1a1f] text-white">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 group-hover/input:text-[#00A3E0] transition-colors">
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>
      {error && (
        <p className="text-red-400 text-xs font-bold flex items-center gap-1.5 px-1 animate-in slide-in-from-top-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
};

const MultiSelectField: React.FC<FieldComponentProps> = ({ field, value, onChange, error, disabled }) => {
  const { optionSets } = useConfigStore();
  const options = field.optionSetId ? optionSets.find(s => s.id === field.optionSetId)?.items : field.options;
  const selectedValues = Array.isArray(value) ? value : [];

  const toggleOption = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter((v) => v !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 min-h-[56px] p-3 pro-input">
        {selectedValues.map((val) => {
          const opt = options?.find((o) => o.value === val);
          return (
            <Badge
              key={val}
              className="bg-[#0066CC] text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-none shadow-lg shadow-[#0066CC]/20 animate-in zoom-in-95 duration-200"
            >
              {opt?.label || val}
              <button
                type="button"
                onClick={() => !disabled && toggleOption(val)}
                className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </Badge>
          );
        })}
        <select
          value=""
          onChange={(e) => e.target.value && toggleOption(e.target.value)}
          disabled={disabled}
          className="flex-1 bg-transparent border-none focus:ring-0 text-sm min-w-[120px] outline-none text-white cursor-pointer appearance-none"
          style={{ colorScheme: 'dark' }}
        >
          <option value="" className="bg-[#1a1a1f] text-white/50" disabled>{selectedValues.length === 0 ? (field.placeholder || 'Select multiple...') : 'Add more...'}</option>
          {options
            ?.filter((opt) => !selectedValues.includes(opt.value))
            .map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#1a1a1f] text-white">
                {opt.label}
              </option>
            ))}
        </select>
      </div>
      {error && (
        <p className="text-red-400 text-xs font-bold flex items-center gap-1.5 px-1 animate-in slide-in-from-top-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
};

const RadioField: React.FC<FieldComponentProps> = ({ field, value, onChange, error, disabled }) => {
  const { optionSets } = useConfigStore();
  const options = field.optionSetId ? optionSets.find(s => s.id === field.optionSetId)?.items : field.options;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options?.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <label
              key={opt.value}
              className={`
                relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden group/radio
                ${isSelected 
                  ? 'bg-[#0066CC]/10 border-[#0066CC]/50 shadow-[0_0_20px_rgba(0,102,204,0.1)]' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-r from-[#0066CC]/5 to-transparent animate-in fade-in duration-500" />
              )}
              <div className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                ${isSelected ? 'border-[#0066CC] scale-110' : 'border-white/20 group-hover/radio:border-white/40'}
              `}>
                {isSelected && (
                  <div className="w-3 h-3 rounded-full bg-[#0066CC] shadow-[0_0_10px_rgba(0,102,204,0.8)]" />
                )}
              </div>
              <input
                type="radio"
                name={field.name}
                value={opt.value}
                checked={isSelected}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="hidden"
              />
              <span className={`text-sm font-bold transition-colors ${isSelected ? 'text-white' : 'text-gray-400 group-hover/radio:text-gray-200'}`}>
                {opt.label}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p className="text-red-400 text-xs font-bold flex items-center gap-1.5 px-1 animate-in slide-in-from-top-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
};

const ButtonGroupField: React.FC<FieldComponentProps> = ({ field, value, onChange, error, disabled }) => {
  const { optionSets } = useConfigStore();
  const options = field.optionSetId ? optionSets.find(s => s.id === field.optionSetId)?.items : field.options;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 p-2 bg-white/5 rounded-2xl border border-white/10">
        {options?.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={`
                flex-1 min-w-[120px] px-6 py-4 rounded-xl text-sm font-black transition-all duration-300 relative overflow-hidden group/btn
                ${isSelected 
                  ? 'bg-[#0066CC] text-white shadow-xl shadow-[#0066CC]/30 scale-[1.05] z-10' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
              )}
              <span className="relative z-10 tracking-wide uppercase">{opt.label}</span>
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-red-400 text-xs font-bold flex items-center gap-1.5 px-1 animate-in slide-in-from-top-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
};

const CheckboxGroupField: React.FC<FieldComponentProps> = ({ field, value, onChange, error, disabled }) => {
  const { optionSets } = useConfigStore();
  const options = field.optionSetId ? optionSets.find(s => s.id === field.optionSetId)?.items : field.options;
  const selectedValues = Array.isArray(value) ? value : [];

  const toggleOption = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter((v) => v !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options?.map((opt) => {
          const isSelected = selectedValues.includes(opt.value);
          return (
            <label
              key={opt.value}
              className={`
                relative flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden group/check
                ${isSelected 
                  ? 'bg-[#00A3E0]/10 border-[#00A3E0]/50 shadow-[0_0_20px_rgba(0,163,224,0.1)]' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-br from-[#00A3E0]/5 to-transparent" />
              )}
              <div className={`
                w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all duration-300
                ${isSelected ? 'bg-[#00A3E0] border-[#00A3E0] scale-110 shadow-[0_0_10px_rgba(0,163,224,0.5)]' : 'border-white/20 group-hover/check:border-white/40'}
              `}>
                {isSelected && <Check className="w-4 h-4 text-white stroke-[4]" />}
              </div>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => !disabled && toggleOption(opt.value)}
                disabled={disabled}
                className="hidden"
              />
              <span className={`text-sm font-black transition-colors ${isSelected ? 'text-white' : 'text-gray-500 group-hover/check:text-gray-300'}`}>
                {opt.label}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p className="text-red-400 text-xs font-bold flex items-center gap-1.5 px-1 animate-in slide-in-from-top-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
};

const DateField: React.FC<FieldComponentProps> = ({ field, value, onChange, error, disabled }) => (
  <div className="space-y-3">
    <div className="relative group/input">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0066CC] to-[#00A3E0] rounded-xl blur opacity-0 group-hover/input:opacity-10 transition duration-500" />
      <input
        type={field.type === 'datetime' ? 'datetime-local' : 'date'}
        value={String(value || '')}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
        className={`
          pro-input relative w-full px-5 py-4 text-base transition-all duration-300
          ${error ? 'border-red-500/50 bg-red-500/5' : ''}
          [color-scheme:dark]
        `}
      />
      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 group-hover/input:text-[#00A3E0] transition-colors">
        <CalendarIcon className="w-5 h-5" />
      </div>
    </div>
    {error && (
      <p className="text-red-400 text-xs font-bold flex items-center gap-1.5 px-1 animate-in slide-in-from-top-1">
        <AlertCircle className="w-3.5 h-3.5" />
        {error}
      </p>
    )}
  </div>
);

const FileField: React.FC<FieldComponentProps> = ({ field, value, onChange, error, disabled }) => (
  <div className="space-y-2">
    <div
      className={`
        border-2 border-dashed rounded-lg p-6 text-center
        ${error ? 'border-red-500' : 'border-white/20'}
        ${disabled ? 'opacity-50' : 'hover:border-[#00A3E0] cursor-pointer'}
        transition-colors
      `}
      onClick={() => !disabled && document.getElementById(`file-${field.name}`)?.click()}
    >
      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
      <p className="text-sm text-gray-300">
        {value ? (value as File).name : 'Click to upload or drag and drop'}
      </p>
      <input
        id={`file-${field.name}`}
        type="file"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        disabled={disabled}
        className="hidden"
      />
    </div>
    {error && <p className="text-red-400 text-xs">{error}</p>}
  </div>
);

const BarcodeField: React.FC<FieldComponentProps> = ({ value, onChange, error, disabled }) => (
  <div className="space-y-2">
    <div className="flex gap-2">
      <input
        type="text"
        value={String(value || '')}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Scan or enter barcode..."
        disabled={disabled}
        className={`
          flex-1 px-4 py-2.5 rounded-lg border bg-transparent
          ${error ? 'border-red-500' : 'border-white/10'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          focus:outline-none focus:border-[#00A3E0] focus:ring-1 focus:ring-[#00A3E0]
          text-white placeholder-gray-500
        `}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => toast.info('Scan', { description: 'Barcode scanner integration coming soon' })}
        className="px-3 py-2 bg-[#0066CC]/20 rounded-lg text-[#00A3E0] hover:bg-[#0066CC]/30 disabled:opacity-50"
      >
        <ScanLine className="w-5 h-5" />
      </button>
    </div>
    {error && <p className="text-red-400 text-xs">{error}</p>}
  </div>
);

// ============================================================================
// MAIN FORM RENDERER
// ============================================================================

interface DynamicFormRendererProps {
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
  role,
  mode,
  compactMode,
  className,
}) => {
  const effectiveFields = useMemo(() => (
    formConfig.fields.filter((field) => isFieldAllowedForRoleAndMode(field, role, mode).visible)
  ), [formConfig.fields, role, mode]);
  const validationSchema = buildValidationSchema(effectiveFields);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAction, setSubmitAction] = useState('submit');
  const submitActionRef = useRef('submit');
  const [activeLookups, setActiveLookups] = useState<Record<string, boolean>>({});
  const [lookupErrors, setLookupErrors] = useState<Record<string, string>>({});

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: initialValues as any,
    mode: 'all',
  });

  const formValues = watch();
  const { externalDataSources, forms } = useConfigStore();

  // 1. Formula / Calculated Fields Logic
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

      await onSubmit?.({ ...data, __submitAction: currentSubmitAction });
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

  const setNextSubmitAction = useCallback((action: string) => {
    submitActionRef.current = action;
    setSubmitAction(action);
  }, []);

  const onInvalid = (errors: any) => {
    console.error('Form Validation Errors:', errors);
    const errorFields = Object.keys(errors);
    const firstError = Object.values(errors)[0] as any;
    
    toast.error('Validation Error', {
      description: `Please check: ${errorFields.join(', ')}. ${firstError?.message || ''}`,
    });
  };

  useEffect(() => {
    onChange?.(formValues as Record<string, unknown>);
  }, [formValues, onChange]);

  const renderField = useCallback(
    (field: DynamicField) => {
      const state = checkFieldVisibility(field, formValues as Record<string, unknown>);
      const roleModeState = isFieldAllowedForRoleAndMode(field, role, mode);
      if (!state.visible || !roleModeState.visible) return null;

      const commonProps = {
        field,
        disabled: readOnly || state.disabled || !roleModeState.editable,
      };

      return (
        <div key={field.id} className="space-y-3 group/field">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <label className="text-sm font-black text-white/60 group-hover/field:text-[#00A3E0] transition-colors uppercase tracking-wider flex items-center gap-2">
                {field.label}
                {state.required && <span className="text-red-500">*</span>}
              </label>
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
              const errorMsg = ((errors as any)?.[field.name]?.message as string | undefined) || lookupErrors[field.name];
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
                  return <FileField {...props} />;
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
                      <ScanLine className="w-5 h-5 text-[#00A3E0]" />
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
        </div>
      );
    },
    [activeLookups, control, errors, formValues, lookupErrors, mode, readOnly, role]
  );

  const isShopfloor = compactMode === 'shopfloor';

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
          <ScanLine className="w-32 h-32 text-white" />
        </div>
      </div>}

      {/* Form Sections */}
      <div className={isShopfloor ? 'space-y-4' : 'space-y-8 md:space-y-16'}>
        {formConfig.sections?.map((section) => (
          <div key={section.id} className={`${isShopfloor ? 'rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4' : 'pro-card p-4 md:p-8 space-y-6 md:space-y-8 animate-in slide-in-from-bottom-8 duration-1000 border-white/5'}`}>
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
              {section.fields.map((fieldId) => {
                const field = formConfig.fields.find((f) => f.id === fieldId);
                if (!field) return null;
                
                // Determine if field should take full width
                const isFullWidth = field.type === 'textarea' || field.type === 'chart' || field.type === 'file' || field.type === 'checkbox-group';
                
                return (
                  <div key={field.id} className={`${isFullWidth ? 'md:col-span-2' : ''} group/field`}>
                    {renderField(field)}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Fields not in any section */}
        {formConfig.fields.filter(f => !f.section || !formConfig.sections?.find(s => s.id === f.section)).length > 0 && (
          <div className={`${isShopfloor ? 'rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 space-y-4' : 'pro-card p-8 space-y-8 border-dashed border-white/10'}`}>
            <div className="flex items-center gap-4">
              <div className="h-10 w-2 bg-slate-600 rounded-full" />
              <h3 className="text-2xl font-black text-white tracking-tight uppercase">Additional Details</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
            </div>
            <div className={`grid grid-cols-1 ${isShopfloor ? 'gap-4' : 'md:grid-cols-2 gap-x-10 gap-y-8'}`}>
              {formConfig.fields
                .filter(f => !f.section || !formConfig.sections?.find(s => s.id === f.section))
                .map((field) => {
                  const isFullWidth = field.type === 'textarea' || field.type === 'chart' || field.type === 'file' || field.type === 'checkbox-group';
                  return (
                    <div key={field.id} className={`${isFullWidth ? 'md:col-span-2' : ''} group/field`}>
                      {renderField(field)}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {showSubmitButton && !readOnly && (
        <div className="pt-12 flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3">
          {submitActions.map((action) => (
            <Button
              key={action.id}
              type="submit"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setNextSubmitAction(action.value)}
              className="px-8 py-6 border-white/10 text-white hover:bg-white/10 font-black rounded-2xl"
              title={action.description}
            >
              {action.label}
            </Button>
          ))}
          <Button
            type="submit"
            disabled={isSubmitting}
            onClick={() => setNextSubmitAction('submit')}
            className="group relative px-16 py-8 bg-gradient-to-r from-[#0066CC] to-[#00A3E0] hover:from-[#0052a3] hover:to-[#008cc2] text-white text-xl font-black rounded-2xl shadow-2xl shadow-[#0066CC]/40 hover:scale-[1.05] active:scale-[0.95] transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <div className="relative z-10 flex items-center gap-3">
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-7 h-7" />
                  {submitLabel}
                </>
              )}
            </div>
          </Button>
        </div>
      )}
    </form>
  );
};

export default DynamicFormRenderer;
