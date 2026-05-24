import { useEffect, useMemo, useState } from 'react';
import { Filter, RotateCcw, Save } from 'lucide-react';
import {
  loadQualityDashboardFilters,
  resetQualityDashboardFilters,
  saveQualityDashboardFilters,
  type QualityDashboardDatePreset,
  type QualityDashboardFilters,
} from '@/services/qualityAnalyticsHub';

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

const filterFields: Array<{ key: keyof QualityDashboardFilters; label: string; placeholder: string }> = [
  { key: 'factory', label: 'Factory', placeholder: 'Factory' },
  { key: 'workshop', label: 'Workshop', placeholder: 'Workshop' },
  { key: 'productionLine', label: 'Line', placeholder: 'Production line' },
  { key: 'model', label: 'Model', placeholder: 'Model' },
  { key: 'partNumber', label: 'Part', placeholder: 'Part number' },
  { key: 'defectType', label: 'Defect', placeholder: 'Defect type' },
  { key: 'severity', label: 'Severity', placeholder: 'Severity' },
  { key: 'recordType', label: 'Record Type', placeholder: 'process-ppm / defect-cost...' },
  { key: 'shift', label: 'Shift', placeholder: 'Shift' },
  { key: 'supplier', label: 'Supplier', placeholder: 'Supplier' },
  { key: 'customer', label: 'Customer', placeholder: 'Customer' },
  { key: 'inspectionPoint', label: 'Inspection Point', placeholder: 'Inspection point' },
  { key: 'actionStatus', label: 'Action Status', placeholder: 'open / pending...' },
  { key: 'effectivenessStatus', label: 'Effectiveness', placeholder: 'Effective / Not Effective' },
  { key: 'ncrStatus', label: 'NCR Status', placeholder: 'NCR status' },
  { key: 'capaStatus', label: 'CAPA Status', placeholder: 'CAPA status' },
  { key: 'eightDStatus', label: '8D Status', placeholder: '8D status' },
];

function countActive(filters: QualityDashboardFilters): number {
  return Object.entries(filters).filter(([key, value]) => {
    if (key === 'datePreset') return value && value !== 'all';
    return String(value ?? '').trim() !== '';
  }).length;
}

export function QualityDashboardFilterBar({ value, onChange, compact = false }: QualityDashboardFilterBarProps) {
  const [draft, setDraft] = useState<QualityDashboardFilters>(() => value || loadQualityDashboardFilters());
  const activeCount = useMemo(() => countActive(draft), [draft]);

  useEffect(() => {
    if (value) setDraft(value);
  }, [value]);

  const update = (patch: Partial<QualityDashboardFilters>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
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

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#00A3E0]/25 bg-[#00A3E0]/10">
            <Filter className="h-4 w-4 text-[#8be3ff]" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Shared Dashboard Filters</h3>
            <p className="text-xs text-white/40">
              {activeCount ? `${activeCount} filter(s) active across quality dashboards.` : 'No shared filters active. Dashboards use all real local records.'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={apply} className="inline-flex items-center gap-2 rounded-xl bg-[#0066CC] px-4 py-2 text-xs font-black text-white">
            <Save className="h-4 w-4" />
            Apply
          </button>
          <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-white/60">
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>

      <div className={`mt-4 grid grid-cols-1 gap-3 ${compact ? 'md:grid-cols-4' : 'md:grid-cols-3 xl:grid-cols-6'}`}>
        <label className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/35">Date Range</span>
          <select
            value={draft.datePreset}
            onChange={(event) => update({ datePreset: event.target.value as QualityDashboardDatePreset })}
            className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white"
          >
            {datePresets.map((preset) => <option key={preset.value} value={preset.value}>{preset.label}</option>)}
          </select>
        </label>
        {draft.datePreset === 'custom' && (
          <>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/35">From</span>
              <input type="date" value={draft.fromDate || ''} onChange={(event) => update({ fromDate: event.target.value })} className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/35">To</span>
              <input type="date" value={draft.toDate || ''} onChange={(event) => update({ toDate: event.target.value })} className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white" />
            </label>
          </>
        )}
        {filterFields.map((field) => (
          <label key={field.key} className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/35">{field.label}</span>
            <input
              value={String(draft[field.key] || '')}
              onChange={(event) => update({ [field.key]: event.target.value })}
              placeholder={field.placeholder}
              className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white placeholder:text-white/20"
            />
          </label>
        ))}
      </div>
      <p className="mt-3 text-xs text-white/35">
        Filters are saved locally in qms_quality_dashboard_filters_v1 and never require a backend.
      </p>
    </section>
  );
}

export default QualityDashboardFilterBar;
