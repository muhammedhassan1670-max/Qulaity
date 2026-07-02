import { useEffect, useMemo, useState } from 'react';
import { Filter, RotateCcw, Save, ChevronDown, ChevronUp, X } from 'lucide-react';
import {
  loadQualityDashboardFilters,
  resetQualityDashboardFilters,
  saveQualityDashboardFilters,
  type QualityDashboardDatePreset,
  type QualityDashboardFilters,
} from '@/services/qualityAnalyticsHub';
import { loadQualityMasterTable } from '@/services/qualityMasterData';
import { AnimatePresence, motion } from 'framer-motion';

interface QualityDashboardFilterBarProps {
  value?: QualityDashboardFilters;
  onChange: (filters: QualityDashboardFilters) => void;
  compact?: boolean;
}

const datePresets: Array<{ value: QualityDashboardDatePreset; label: string }> = [
  { value: 'all', label: 'All dates' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
  { value: 'custom', label: 'Custom' },
];

export interface DashboardFilterField {
  key: keyof QualityDashboardFilters;
  label: string;
  placeholder: string;
  options?: string[]; // If provided, renders a select instead of input
}

const severityOptions = ['Critical', 'High', 'Medium', 'Low'];
const statusOptions = ['Open', 'In Progress', 'Pending Review', 'Closed', 'Cancelled'];
const recordTypeOptions = ['process-ppm', 'defect-cost', 'scrap', 'rework', 'audit-finding'];
const shiftOptions = ['Shift A', 'Shift B', 'Shift C', 'Night Shift'];

const getFilterFields = (): DashboardFilterField[] => {
  // Extract master data options
  const modelsMaster = loadQualityMasterTable('models');
  const partsMaster = loadQualityMasterTable('parts');

  const uniqueFactories = Array.from(new Set(modelsMaster.map(m => m.factory as string).filter(Boolean)));
  const uniqueLines = Array.from(new Set(modelsMaster.map(m => m.productionLine as string).filter(Boolean)));
  const uniqueWorkshops = Array.from(new Set(modelsMaster.map(m => m.workshop as string).filter(Boolean)));
  const uniqueModels = Array.from(new Set(modelsMaster.map(m => m.model as string).filter(Boolean)));
  const uniqueParts = Array.from(new Set(partsMaster.map(p => p.partNumber as string).filter(Boolean)));
  const uniqueSuppliers = Array.from(new Set(partsMaster.map(p => p.supplierName as string).filter(Boolean)));

  return [
    { key: 'factory', label: 'Factory', placeholder: 'Select Factory', options: uniqueFactories },
    { key: 'productionLine', label: 'Line', placeholder: 'Select Line', options: uniqueLines },
    { key: 'severity', label: 'Severity', placeholder: 'Select Severity', options: severityOptions },
    { key: 'workshop', label: 'Workshop', placeholder: 'Select Workshop', options: uniqueWorkshops },
    { key: 'model', label: 'Model', placeholder: 'Select Model', options: uniqueModels },
    { key: 'partNumber', label: 'Part', placeholder: 'Select Part', options: uniqueParts },
    { key: 'defectType', label: 'Defect', placeholder: 'Defect type' },
    { key: 'recordType', label: 'Record Type', placeholder: 'Select Type', options: recordTypeOptions },
    { key: 'shift', label: 'Shift', placeholder: 'Select Shift', options: shiftOptions },
    { key: 'supplier', label: 'Supplier', placeholder: 'Select Supplier', options: uniqueSuppliers },
    { key: 'customer', label: 'Customer', placeholder: 'Customer' },
    { key: 'inspectionPoint', label: 'Inspection Point', placeholder: 'Inspection point' },
    { key: 'actionStatus', label: 'Action Status', placeholder: 'Select Status', options: statusOptions },
    { key: 'effectivenessStatus', label: 'Effectiveness', placeholder: 'Effective / Not Effective' },
    { key: 'ncrStatus', label: 'NCR Status', placeholder: 'Select Status', options: statusOptions },
    { key: 'capaStatus', label: 'CAPA Status', placeholder: 'Select Status', options: statusOptions },
    { key: 'eightDStatus', label: '8D Status', placeholder: 'Select Status', options: statusOptions },
  ];
};

function countActive(filters: QualityDashboardFilters): number {
  return Object.entries(filters).filter(([key, value]) => {
    if (key === 'datePreset') return value && value !== 'all';
    return String(value ?? '').trim() !== '';
  }).length;
}

export function QualityDashboardFilterBar({ value, onChange, compact = false }: QualityDashboardFilterBarProps) {
  const [draft, setDraft] = useState<QualityDashboardFilters>(() => value || loadQualityDashboardFilters());
  const [isExpanded, setIsExpanded] = useState(false);
  const activeCount = useMemo(() => countActive(draft), [draft]);

  useEffect(() => {
    if (value) setDraft(value);
  }, [value]);

  const filterFields = useMemo(() => getFilterFields(), []);

  const update = (patch: Partial<QualityDashboardFilters>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const removeFilter = (key: keyof QualityDashboardFilters) => {
    update({ [key]: undefined });
    // Auto apply when removing a chip to make it feel responsive
    setTimeout(() => {
      setDraft(current => {
        onChange(current);
        saveQualityDashboardFilters(current);
        return current;
      });
    }, 50);
  };

  const apply = () => {
    const saved = saveQualityDashboardFilters(draft);
    onChange(saved);
  };

  const reset = () => {
    const next = resetQualityDashboardFilters();
    setDraft(next);
    onChange(next);
  };

  const gridClass = compact ? 'md:grid-cols-4' : 'md:grid-cols-3 xl:grid-cols-6';
  const primaryFields = filterFields.slice(0, 3);
  const advancedFields = filterFields.slice(3);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-white/5 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#00A3E0]/25 bg-[#00A3E0]/10">
            <Filter className="h-4 w-4 text-[#8be3ff]" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Dashboard Filters</h3>
            <p className="text-xs text-white/40">
              {activeCount ? `${activeCount} filter(s) active across quality dashboards.` : 'No shared filters active.'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            type="button" 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-transparent hover:bg-white/5 px-4 py-2 text-xs font-bold text-white transition-colors"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {isExpanded ? 'Hide Advanced' : 'Advanced Filters'}
          </button>
          <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-black text-white/60 transition-colors">
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button type="button" onClick={apply} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0066CC] to-[#00A3E0] hover:brightness-110 px-4 py-2 text-xs font-black text-white transition-all shadow-md">
            <Save className="h-4 w-4" />
            Apply Filters
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-3 ${gridClass}`}>
        <label className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Date Range</span>
          <select
            value={draft.datePreset}
            onChange={(event) => update({ datePreset: event.target.value as QualityDashboardDatePreset })}
            className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white focus:border-[#00A3E0]/50 outline-none transition-colors"
          >
            {datePresets.map((preset) => <option key={preset.value} value={preset.value}>{preset.label}</option>)}
          </select>
        </label>
        {draft.datePreset === 'custom' && (
          <>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">From</span>
              <input type="date" value={draft.fromDate || ''} onChange={(event) => update({ fromDate: event.target.value })} className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white focus:border-[#00A3E0]/50 outline-none transition-colors" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">To</span>
              <input type="date" value={draft.toDate || ''} onChange={(event) => update({ toDate: event.target.value })} className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white focus:border-[#00A3E0]/50 outline-none transition-colors" />
            </label>
          </>
        )}
        
        {/* Primary Fields */}
        {primaryFields.map((field) => (
          <label key={field.key} className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{field.label}</span>
            <input
              value={String(draft[field.key] || '')}
              onChange={(event) => update({ [field.key]: event.target.value })}
              placeholder={field.placeholder}
              className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white placeholder:text-white/20 focus:border-[#00A3E0]/50 outline-none transition-colors"
            />
          </label>
        ))}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={`grid grid-cols-1 gap-4 mt-4 pt-4 border-t border-white/5 ${gridClass}`}>
              {advancedFields.map((field) => (
                <label key={field.key} className="space-y-1 block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{field.label}</span>
                  {field.options && field.options.length > 0 ? (
                    <select
                      value={String(draft[field.key] || '')}
                      onChange={(event) => update({ [field.key]: event.target.value })}
                      className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white focus:border-[#00A3E0]/50 outline-none transition-colors appearance-none"
                    >
                      <option value="" className="text-black">Any {field.label}</option>
                      {field.options.map(opt => (
                        <option key={opt} value={opt} className="text-black">{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={String(draft[field.key] || '')}
                      onChange={(event) => update({ [field.key]: event.target.value })}
                      placeholder={field.placeholder}
                      className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white placeholder:text-white/20 focus:border-[#00A3E0]/50 outline-none transition-colors"
                    />
                  )}
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filter Chips */}
      {activeCount > 0 && (
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center flex-wrap gap-2">
          <span className="text-xs font-bold text-white/40 mr-2">ACTIVE:</span>
          <AnimatePresence>
            {Object.entries(draft).map(([key, value]) => {
              if (key === 'datePreset') {
                if (!value || value === 'all') return null;
                const label = datePresets.find(p => p.value === value)?.label || value;
                return (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    key="datePreset"
                    className="flex items-center gap-2 bg-[#00A3E0]/20 border border-[#00A3E0]/30 text-[#00A3E0] px-3 py-1 rounded-full text-xs font-bold"
                  >
                    Date: {label}
                    <button type="button" onClick={() => removeFilter('datePreset')} className="hover:text-white transition-colors"><RotateCcw className="w-3 h-3" /></button>
                  </motion.div>
                );
              }
              if (!value || String(value).trim() === '') return null;
              
              // Skip from/to dates as they belong to datePreset custom
              if (key === 'fromDate' || key === 'toDate') return null;

              const fieldDef = filterFields.find(f => f.key === key);
              const label = fieldDef?.label || key;

              return (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  key={key}
                  className="flex items-center gap-2 bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-xs font-medium"
                >
                  <span className="text-white/50">{label}:</span> {String(value)}
                  <button type="button" onClick={() => removeFilter(key as keyof QualityDashboardFilters)} className="hover:text-red-400 transition-colors ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      
      <p className="mt-4 text-xs text-white/30 flex items-center justify-end">
        Filters are saved locally and persist across your session.
      </p>
    </section>
  );
}

export default QualityDashboardFilterBar;
