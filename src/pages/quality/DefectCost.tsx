// QMS Enterprise 4.0 - Defect Cost (COPQ) Page
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, PageContainer, PageSection } from '../../components/PageHeader';
import { toast } from 'sonner';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Wrench,
  Truck,
  BarChart3,
  Calendar
} from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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

interface DefectCostKpis {
  totalCopq: number;
  internalFailure: number;
  externalFailure: number;
  appraisal: number;
  prevention: number;
  copqPercentSales: number;
}

const defaultKpis: DefectCostKpis = {
  totalCopq: 0,
  internalFailure: 0,
  externalFailure: 0,
  appraisal: 0,
  prevention: 0,
  copqPercentSales: 0
};

export function DefectCostPage() {
  const [kpis, setKpis] = useState<DefectCostKpis>(defaultKpis);
  const [monthlyCost, setMonthlyCost] = useState<any[]>([]);
  const [copqBreakdown, setCopqBreakdown] = useState<any[]>([]);
  const [topDrivers, setTopDrivers] = useState<any[]>([]);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<QualityDashboardFilters>(() => periodToQualityDashboardFilters('month', loadQualityDashboardFilters()));
  const [snapshot, setSnapshot] = useState<QualityAnalyticsSnapshot | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await loadQualityAnalyticsSnapshot(filters);
        setSnapshot(data);
        setKpis({
          totalCopq: data.copqMetrics.totalCopq,
          internalFailure: data.copqMetrics.internalFailure,
          externalFailure: data.copqMetrics.externalFailure,
          appraisal: data.copqMetrics.appraisal,
          prevention: data.copqMetrics.prevention,
          copqPercentSales: 0,
        });
        setMonthlyCost(data.copqMetrics.trend);
        setCopqBreakdown(data.copqMetrics.breakdown);
        setTopDrivers(data.copqMetrics.topCostDrivers);
      } catch (e) {
        toast.error('Failed to load defect cost data');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [filters]);

  const cards = useMemo(() => {
    if (!kpis) return [];
    return [
      { label: 'Total COPQ', value: `$${kpis.totalCopq.toLocaleString()}`, icon: DollarSign, color: '#00A3E0', hint: `${kpis.copqPercentSales}% of sales` },
      { label: 'Internal Failure', value: `$${kpis.internalFailure.toLocaleString()}`, icon: Wrench, color: '#F97316', hint: 'Scrap + Rework' },
      { label: 'External Failure', value: `$${kpis.externalFailure.toLocaleString()}`, icon: Truck, color: '#DC2626', hint: 'Returns + Warranty' },
      { label: 'Prevention', value: `$${kpis.prevention.toLocaleString()}`, icon: TrendingUp, color: '#22C55E', hint: 'Training + Controls' }
    ];
  }, [kpis]);

  if (isLoading || !kpis) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-72">
          <div className="text-gray-400">Loading defect cost...</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Defect Cost (COPQ)"
        subtitle="Cost of Poor Quality breakdown and key cost drivers"
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'Defect Cost' }]}
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
        <QualityAnalyticsConsistencyBadge dashboardName="Defect Cost COPQ" snapshot={snapshot} compact />
      </div>

      {snapshot?.copqMetrics.warnings.length ? (
        <PageSection>
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
            <p className="text-sm font-black text-amber-100">COPQ data quality warnings</p>
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
              {snapshot.copqMetrics.warnings.map((warning) => (
                <p key={warning.id} className="text-xs text-amber-100/75">{warning.message}</p>
              ))}
            </div>
            <p className="mt-2 text-xs text-amber-100/55">Confidence: {snapshot.copqMetrics.confidence}. Missing costs are shown as warnings, not estimated fake values.</p>
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
              <h3 className="text-sm font-semibold text-white">Monthly COPQ Trend</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <TrendingDown className="w-4 h-4 text-green-400" />
                No comparison data
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyCost} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(10,10,15,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="internal" stackId="a" fill="#F97316" />
                  <Bar dataKey="external" stackId="a" fill="#DC2626" />
                  <Bar dataKey="appraisal" stackId="a" fill="#3B82F6" />
                  <Bar dataKey="prevention" stackId="a" fill="#22C55E" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">COPQ Breakdown</h3>
              <div className="text-xs text-gray-500">This period</div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={copqBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {copqBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(10,10,15,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      color: '#fff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-3">
              {copqBreakdown.map((c: any) => (
                <div key={c.name} className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  <span className="truncate">{c.name}</span>
                  <span className="ml-auto text-gray-200">${c.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection>
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Top Cost Drivers</h3>
              <p className="text-xs text-gray-500 mt-1">Largest contributors to COPQ</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Focus improvement projects here
            </div>
          </div>
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Driver</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Category</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Cost</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {topDrivers.map((d: any) => {
                const TrendIcon = d.trend <= 0 ? TrendingDown : TrendingUp;
                const trendClass = d.trend <= 0 ? 'text-green-400' : 'text-red-400';
                return (
                  <tr key={d.driver} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm">
                      <Link
                        to={buildDashboardDrilldownUrl('/defect-cost', { defectType: d.driver })}
                        onClick={() => recordDashboardDrilldown('/defect-cost', { defectType: d.driver }, 'COPQ driver')}
                        className="font-bold text-[#8be3ff] hover:underline"
                      >
                        {d.driver}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{d.category}</td>
                    <td className="px-6 py-4 text-gray-200 text-sm font-medium">${d.cost.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-sm ${trendClass}`}>
                        <TrendIcon className="w-4 h-4" />
                        {Math.abs(d.trend)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {topDrivers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">
                    No defect cost records yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PageSection>

      <PageSection>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Target COPQ%</h3>
              <BarChart3 className="w-4 h-4 text-[#00A3E0]" />
            </div>
            <p className="text-3xl font-semibold text-white mt-3">&lt;= 2.0%</p>
            <p className="text-xs text-gray-500 mt-1">Current: {kpis.copqPercentSales}%</p>
          </div>
          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">External Failures</h3>
              <Truck className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-3xl font-semibold text-white mt-3">$ {kpis.externalFailure.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Reduce customer escapes</p>
          </div>
          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Prevention Spend</h3>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-3xl font-semibold text-white mt-3">$ {kpis.prevention.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Increase to reduce failure costs</p>
          </div>
          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">COPQ Reduction Signal</h3>
              <TrendingDown className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-3xl font-semibold text-white mt-3">$ {(snapshot?.copqMetrics.copqReductionFromEffectiveActions || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">From effective improvement actions</p>
          </div>
        </div>
      </PageSection>
    </PageContainer>
  );
}

export default DefectCostPage;
