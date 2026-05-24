import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, LineChart as LineChartIcon, Plus, Trash2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';
import QualityDashboardFilterBar from '@/components/QualityDashboardFilterBar';
import QualityAnalyticsConsistencyBadge from '@/components/QualityAnalyticsConsistencyBadge';
import type { ExtendedDefectLog } from '@/services/defectAnalytics';
import {
  loadQualityAnalyticsSnapshot,
  loadQualityDashboardFilters,
  type QualityAnalyticsSnapshot,
  type QualityDashboardFilters,
  type QualitySpcNumericPoint,
} from '@/services/qualityAnalyticsHub';

type SpcMetric = 'quantity' | 'ppm' | 'cost' | 'inspection-numeric';
type SpcChartType = 'line' | 'bar';

interface SpcChartConfig {
  id: string;
  name: string;
  metric: SpcMetric;
  chartType: SpcChartType;
  productionLine: string;
  lcl: number;
  ucl: number;
}

const STORAGE_KEY = 'qms_spc_charts';

const defaultDraft: Omit<SpcChartConfig, 'id'> = {
  name: '',
  metric: 'quantity',
  chartType: 'line',
  productionLine: '',
  lcl: 0,
  ucl: 0,
};

function toNumber(value: unknown): number {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dayKey(value?: string): string {
  if (!value) return new Date().toISOString().split('T')[0];
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.split('T')[0] : date.toISOString().split('T')[0];
}

function loadSavedCharts(): SpcChartConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCharts(charts: SpcChartConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
}

function buildChartData(chart: SpcChartConfig | null, records: ExtendedDefectLog[], numericPoints: QualitySpcNumericPoint[]) {
  if (!chart) return [];
  if (chart.metric === 'inspection-numeric') {
    return numericPoints
      .filter((point) => !chart.productionLine || point.productionLine === chart.productionLine)
      .map((point) => ({
        date: point.date,
        value: point.measuredValue,
        lcl: point.lowerSpecLimit ?? chart.lcl,
        ucl: point.upperSpecLimit ?? chart.ucl,
        outOfSpec: point.outOfSpec,
      }));
  }
  const filtered = records.filter((record) => !chart.productionLine || record.productionLine === chart.productionLine);
  const byDay = new Map<string, ExtendedDefectLog[]>();
  filtered.forEach((record) => {
    const key = dayKey(record.date || record.createdAt);
    byDay.set(key, [...(byDay.get(key) || []), record]);
  });

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rows]) => {
      const defects = rows.reduce((sum, record) => sum + toNumber(record.quantity), 0);
      const inspected = rows.reduce((sum, record) => sum + toNumber(record.inspectedQuantity || record.productionQuantity), 0);
      const cost = rows.reduce((sum, record) => sum + toNumber(record.estimatedCost), 0);
      const value = chart.metric === 'ppm'
        ? inspected > 0 ? Math.round((defects / inspected) * 1_000_000) : 0
        : chart.metric === 'cost'
          ? cost
          : defects;

      return {
        date,
        value,
        lcl: chart.lcl,
        ucl: chart.ucl,
      };
    });
}

export default function SPCSystem() {
  const [records, setRecords] = useState<ExtendedDefectLog[]>([]);
  const [analytics, setAnalytics] = useState<QualityAnalyticsSnapshot | null>(null);
  const [charts, setCharts] = useState<SpcChartConfig[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [draft, setDraft] = useState(defaultDraft);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<QualityDashboardFilters>(() => loadQualityDashboardFilters());

  const selectedChart = charts.find((chart) => chart.id === selectedId) || charts[0] || null;
  const chartData = useMemo(
    () => buildChartData(selectedChart, records, analytics?.spcMetrics.numericInspectionSeries || []),
    [analytics?.spcMetrics.numericInspectionSeries, selectedChart, records],
  );
  const lines = useMemo(() => [...new Set([
    ...records.map((record) => record.productionLine).filter(Boolean),
    ...(analytics?.spcMetrics.numericInspectionSeries.map((point) => point.productionLine).filter(Boolean) || []),
  ])], [analytics?.spcMetrics.numericInspectionSeries, records]);

  const reload = async () => {
    try {
      setIsLoading(true);
      const nextAnalytics = await loadQualityAnalyticsSnapshot(filters);
      const nextCharts = loadSavedCharts();
      setAnalytics(nextAnalytics);
      setRecords(nextAnalytics.filteredDefectRecords as ExtendedDefectLog[]);
      setCharts(nextCharts);
      setSelectedId((current) => current || nextCharts[0]?.id || '');
    } catch {
      toast.error('Failed to load SPC data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [filters]);

  const createChart = () => {
    if (!draft.name.trim()) {
      toast.error('Enter a chart name');
      return;
    }

    const next: SpcChartConfig = {
      ...draft,
      id: `spc-${Date.now()}`,
      name: draft.name.trim(),
      lcl: toNumber(draft.lcl),
      ucl: toNumber(draft.ucl),
    };
    const nextCharts = [next, ...charts];
    setCharts(nextCharts);
    setSelectedId(next.id);
    saveCharts(nextCharts);
    setDraft(defaultDraft);
    toast.success('SPC chart created');
  };

  const deleteChart = (id: string) => {
    const nextCharts = charts.filter((chart) => chart.id !== id);
    setCharts(nextCharts);
    setSelectedId(nextCharts[0]?.id || '');
    saveCharts(nextCharts);
  };

  const ChartComponent = selectedChart?.chartType === 'bar' ? BarChart : LineChart;

  if (isLoading) {
    return <div className="p-20 text-white">Loading SPC workspace...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0066CC]/20 border border-[#0066CC]/30 flex items-center justify-center">
            <Activity className="text-[#00A3E0] w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white uppercase italic">SPC Workspace</h1>
            <p className="text-sm text-gray-500">Create control charts from registered defect records</p>
          </div>
        </div>
        <button
          onClick={reload}
          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-bold text-white hover:bg-white/10"
        >
          Refresh Data
        </button>
      </div>

      <QualityDashboardFilterBar value={filters} onChange={setFilters} compact />
      <QualityAnalyticsConsistencyBadge dashboardName="SPC Workspace" snapshot={analytics} compact />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Records', value: analytics?.defectMetrics.totalRecords || 0 },
          { label: 'Defects', value: analytics?.defectMetrics.totalDefectQuantity || 0 },
          { label: 'Process PPM', value: analytics?.ppmMetrics.currentPpm || 0 },
          { label: 'Numeric Points', value: analytics?.spcMetrics.numericInspectionSeries.length || 0 },
          { label: 'Out of Spec', value: analytics?.spcMetrics.outOfSpecPoints || 0 },
          { label: 'Charts', value: charts.length },
        ].map((card) => (
          <div key={card.label} className="glass-panel rounded-xl p-4 border border-white/10">
            <p className="text-xs text-gray-500 uppercase font-black">{card.label}</p>
            <p className="text-2xl font-black text-white mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="glass-panel rounded-2xl p-5 border border-white/10 xl:col-span-1 space-y-4">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#00A3E0]" />
            <h2 className="text-sm font-black text-white uppercase tracking-widest">New Chart</h2>
          </div>

          <input
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            placeholder="Chart name"
            className="w-full h-11 px-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-600"
          />

          <select
            value={draft.metric}
            onChange={(event) => setDraft({ ...draft, metric: event.target.value as SpcMetric })}
            className="w-full h-11 px-3 rounded-lg bg-[#1a1a1f] border border-white/10 text-white"
          >
            <option value="quantity">Defect Quantity</option>
            <option value="ppm">Process PPM</option>
            <option value="cost">Defect Cost</option>
            <option value="inspection-numeric">Numeric Inspection Check</option>
          </select>

          <select
            value={draft.chartType}
            onChange={(event) => setDraft({ ...draft, chartType: event.target.value as SpcChartType })}
            className="w-full h-11 px-3 rounded-lg bg-[#1a1a1f] border border-white/10 text-white"
          >
            <option value="line">Line Chart</option>
            <option value="bar">Bar Chart</option>
          </select>

          <select
            value={draft.productionLine}
            onChange={(event) => setDraft({ ...draft, productionLine: event.target.value })}
            className="w-full h-11 px-3 rounded-lg bg-[#1a1a1f] border border-white/10 text-white"
          >
            <option value="">All production lines</option>
            {lines.map((line) => (
              <option key={line} value={line}>{line}</option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={draft.lcl}
              onChange={(event) => setDraft({ ...draft, lcl: Number(event.target.value) })}
              placeholder="LCL"
              className="w-full h-11 px-3 rounded-lg bg-white/5 border border-white/10 text-white"
            />
            <input
              type="number"
              value={draft.ucl}
              onChange={(event) => setDraft({ ...draft, ucl: Number(event.target.value) })}
              placeholder="UCL"
              className="w-full h-11 px-3 rounded-lg bg-white/5 border border-white/10 text-white"
            />
          </div>

          <button
            onClick={createChart}
            className="w-full h-11 rounded-lg bg-[#0066CC] text-white font-bold hover:bg-[#005BB5]"
          >
            Create Chart
          </button>

          <div className="pt-4 border-t border-white/10 space-y-2">
            {charts.map((chart) => {
              const Icon = chart.chartType === 'bar' ? BarChart3 : LineChartIcon;
              return (
                <button
                  key={chart.id}
                  onClick={() => setSelectedId(chart.id)}
                  className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-colors ${
                    selectedChart?.id === chart.id ? 'bg-[#0066CC]/20 border-[#0066CC]/40' : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Icon className="w-4 h-4 text-[#00A3E0] shrink-0" />
                    <span className="text-sm text-white font-bold truncate">{chart.name}</span>
                  </span>
                  <Trash2
                    className="w-4 h-4 text-gray-500 hover:text-red-400 shrink-0"
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteChart(chart.id);
                    }}
                  />
                </button>
              );
            })}
            {charts.length === 0 && <p className="text-xs text-gray-500 text-center py-6">No SPC charts yet</p>}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-white/10 xl:col-span-3">
          {selectedChart ? (
            <>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-black text-white">{selectedChart.name}</h2>
                  <p className="text-xs text-gray-500 uppercase font-bold">{selectedChart.metric} - {selectedChart.productionLine || 'All lines'}</p>
                </div>
                <div className="text-xs text-gray-500">LCL {selectedChart.lcl} - UCL {selectedChart.ucl}</div>
              </div>
              {selectedChart.metric === 'inspection-numeric' && (
                <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-100">
                  Numeric inspection points come from real inspection runs and check-item LSL/USL limits. Missing numeric data shows as an empty state.
                </div>
              )}
              <div className="h-[420px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ChartComponent data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                      <YAxis stroke="#6B7280" fontSize={12} />
                      <Tooltip contentStyle={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                      {selectedChart.chartType === 'bar' ? (
                        <Bar dataKey="value" fill="#00A3E0" radius={[8, 8, 0, 0]} />
                      ) : (
                        <>
                          <Line type="monotone" dataKey="value" stroke="#00A3E0" strokeWidth={3} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="ucl" stroke="#EF4444" strokeDasharray="6 4" dot={false} />
                          <Line type="monotone" dataKey="lcl" stroke="#F59E0B" strokeDasharray="6 4" dot={false} />
                        </>
                      )}
                    </ChartComponent>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center rounded-2xl border border-dashed border-white/10 text-gray-500">
                    No matching defect or numeric inspection records for this chart
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-[420px] flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 text-center">
              <Activity className="w-12 h-12 text-white/10 mb-4" />
              <h2 className="text-xl font-black text-white/30 uppercase">Create your first SPC chart</h2>
              <p className="text-sm text-gray-600 mt-2">Charts will populate from records entered in the defect recorder.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
