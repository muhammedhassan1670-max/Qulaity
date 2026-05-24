import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, PageContainer, PageSection } from '../../components/PageHeader';
import { toast } from 'sonner';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Calendar,
  Factory,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar
} from 'recharts';

import QualityDashboardFilterBar from '@/components/QualityDashboardFilterBar';
import QualityAnalyticsConsistencyBadge from '@/components/QualityAnalyticsConsistencyBadge';
import {
  loadQualityAnalyticsSnapshot,
  loadQualityDashboardFilters,
  periodToQualityDashboardFilters,
  type QualityAnalyticsSnapshot,
  type QualityDashboardFilters,
} from '@/services/qualityAnalyticsHub';
import { buildDashboardDrilldownUrl, recordDashboardDrilldown } from '@/services/qualityDashboardSnapshots';

interface PpmKpis {
  currentPpm: number;
  targetPpm: number;
  bestLinePpm: number;
  worstLinePpm: number;
  ppmTrend: number;
}

const defaultKpis: PpmKpis = {
  currentPpm: 0,
  targetPpm: 0,
  bestLinePpm: 0,
  worstLinePpm: 0,
  ppmTrend: 0
};

export function ProcessPPMPage() {
  const [kpis, setKpis] = useState<PpmKpis>(defaultKpis);
  const [ppmTrendData, setPpmTrendData] = useState<any[]>([]);
  const [linePpm, setLinePpm] = useState<any[]>([]);
  const [topDefects, setTopDefects] = useState<any[]>([]);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<QualityDashboardFilters>(() => periodToQualityDashboardFilters('month', loadQualityDashboardFilters()));
  const [snapshot, setSnapshot] = useState<QualityAnalyticsSnapshot | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await loadQualityAnalyticsSnapshot(filters);
        const lineRows = data.ppmMetrics.byLine.map((line) => ({
          line: line.label,
          defects: line.count,
          inspected: 0,
          ppm: line.value,
        }));
        const bestLine = lineRows.length ? [...lineRows].sort((a, b) => a.ppm - b.ppm)[0] : null;
        const worstLine = lineRows.length ? [...lineRows].sort((a, b) => b.ppm - a.ppm)[0] : null;
        setSnapshot(data);
        setKpis({
          currentPpm: data.ppmMetrics.currentPpm,
          targetPpm: 0,
          bestLinePpm: bestLine?.ppm || 0,
          worstLinePpm: worstLine?.ppm || 0,
          ppmTrend: 0,
        });
        setPpmTrendData(data.ppmMetrics.trend.map((row) => ({ ...row, open: row.defects })));
        setLinePpm(lineRows);
        setTopDefects(data.ppmMetrics.topContributors.map((item) => ({
          defect: item.defect,
          line: item.line,
          ppm: item.ppm,
          trend: item.trend,
          defects: item.defects,
          inspectionPoint: item.inspectionPoint,
        })));
      } catch (e) {
        toast.error('Failed to load PPM data');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [filters]);

  const cards = useMemo(() => {
    if (!kpis) return [];
    return [
      { label: 'Current PPM', value: kpis.currentPpm.toLocaleString(), icon: Activity, color: '#00A3E0', hint: `Target: ${kpis.targetPpm.toLocaleString()}` },
      { label: 'Target PPM', value: kpis.targetPpm.toLocaleString(), icon: BarChart3, color: '#22C55E', hint: 'Quality objective' },
      { label: 'Best Line', value: kpis.bestLinePpm.toLocaleString(), icon: Factory, color: '#3B82F6', hint: 'Lowest defects rate' },
      { label: 'Worst Line', value: kpis.worstLinePpm.toLocaleString(), icon: AlertTriangle, color: '#DC2626', hint: 'Highest defects rate' }
    ];
  }, [kpis]);

  if (isLoading || !kpis) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-72">
          <div className="text-gray-400">Loading process PPM...</div>
        </div>
      </PageContainer>
    );
  }

  const TrendIcon = kpis.ppmTrend <= 0 ? TrendingDown : TrendingUp;
  const trendClass = kpis.ppmTrend <= 0 ? 'text-green-400' : 'text-red-400';
  const bestLine = linePpm.length ? [...linePpm].sort((a, b) => a.ppm - b.ppm)[0] : null;
  const priorityLine = linePpm.length ? [...linePpm].sort((a, b) => b.ppm - a.ppm)[0] : null;

  return (
    <PageContainer>
      <PageHeader
        title="Process PPM"
        subtitle="Defects per million parts by line, trend and top defect contributors"
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'Process PPM' }]}
        actions={{ refresh: () => setPeriod((p) => p) }}
      />

      <div className="flex gap-2 mb-6">
        {([
          { id: 'month', label: 'Month' },
          { id: 'quarter', label: 'Quarter' },
          { id: 'year', label: 'Year' }
        ] as const).map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setPeriod(p.id);
              setFilters(periodToQualityDashboardFilters(p.id, filters));
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p.id ? 'bg-[#0066CC] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <QualityDashboardFilterBar value={filters} onChange={setFilters} compact />
      </div>

      <div className="mb-6">
        <QualityAnalyticsConsistencyBadge dashboardName="Process PPM" snapshot={snapshot} compact />
      </div>

      {snapshot?.ppmMetrics.warnings.length ? (
        <PageSection>
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
            <p className="text-sm font-black text-amber-100">PPM data quality warnings</p>
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
              {snapshot.ppmMetrics.warnings.map((warning) => (
                <p key={warning.id} className="text-xs text-amber-100/75">{warning.message}</p>
              ))}
            </div>
            <p className="mt-2 text-xs text-amber-100/55">Confidence: {snapshot.ppmMetrics.confidence}. Failed checks are not counted as defects unless a defect record exists.</p>
          </div>
        </PageSection>
      ) : null}

      <PageSection>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="glass-panel rounded-xl p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${c.color}20` }}>
                    <Icon className="w-5 h-5" style={{ color: c.color }} />
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {period}
                  </div>
                </div>
                <p className="text-2xl font-semibold text-white mb-1">{c.value}</p>
                <p className="text-sm text-gray-400">{c.label}</p>
                <p className="text-xs text-gray-500 mt-2">{c.hint}</p>
              </div>
            );
          })}
        </div>
      </PageSection>

      <PageSection>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-panel rounded-xl p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">PPM Trend</h3>
              <div className={`flex items-center gap-2 text-xs ${trendClass}`}>
                <TrendIcon className="w-4 h-4" />
                {kpis.ppmTrend ? `${Math.abs(kpis.ppmTrend)}% vs last period` : 'No comparison data'}
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ppmTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="period" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(10,10,15,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      color: '#fff'
                    }}
                  />
                  <Line type="monotone" dataKey="ppm" stroke="#00A3E0" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="target" stroke="#22C55E" strokeWidth={2} dot={false} strokeDasharray="6 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">PPM by Line</h3>
              <div className="text-xs text-gray-500">This period</div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={linePpm} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="line" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(10,10,15,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="ppm" fill="#0066CC" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection>
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Top Defect Contributors</h3>
              <p className="text-xs text-gray-500 mt-1">Defects contributing most to PPM</p>
            </div>
            <div className="text-xs text-gray-500">Focus improvement projects</div>
          </div>
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Defect</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Line</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">PPM</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Trend</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Failed Check Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {topDefects.map((d: any) => {
                const TI = d.trend <= 0 ? TrendingDown : TrendingUp;
                const tc = d.trend <= 0 ? 'text-green-400' : 'text-red-400';
                return (
                  <tr key={`${d.defect}-${d.line}-${d.inspectionPoint}`} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm">
                      <Link
                        to={buildDashboardDrilldownUrl('/defect-log', { defectType: d.defect, productionLine: d.line, recordType: 'process-ppm' })}
                        onClick={() => recordDashboardDrilldown('/defect-log', { defectType: d.defect, productionLine: d.line, recordType: 'process-ppm' }, 'PPM contributor')}
                        className="font-bold text-[#8be3ff] hover:underline"
                      >
                        {d.defect}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{d.line}</td>
                    <td className="px-6 py-4 text-gray-200 text-sm font-medium">{d.ppm.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-sm ${tc}`}>
                        <TI className="w-4 h-4" />
                        {Math.abs(d.trend)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{d.inspectionPoint || '---'}</td>
                  </tr>
                );
              })}
              {topDefects.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                    No process PPM records yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PageSection>

      <PageSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Gap to Target</h3>
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
            </div>
            <p className="text-3xl font-semibold text-white mt-3">{Math.max(0, kpis.currentPpm - kpis.targetPpm).toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">PPM above target</p>
          </div>
          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Best Line</h3>
              <TrendingDown className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-3xl font-semibold text-white mt-3">{bestLine?.line || '--'}</p>
            <p className="text-xs text-gray-500 mt-1">{linePpm.length ? 'Lowest PPM line' : 'No comparison data'}</p>
          </div>
          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Priority Line</h3>
              <Factory className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-3xl font-semibold text-white mt-3">{priorityLine?.line || '--'}</p>
            <p className="text-xs text-gray-500 mt-1">{linePpm.length ? 'Highest PPM line' : 'No line data'}</p>
          </div>
        </div>
      </PageSection>
    </PageContainer>
  );
}

export default ProcessPPMPage;
