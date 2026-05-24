// QMS Enterprise 4.0 - Outgoing Quality Page
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, PageContainer, PageSection } from '../../components/PageHeader';
import { toast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  PackageCheck,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Calendar
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
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

interface OutgoingKpis {
  shipments: number;
  outgoingInspections: number;
  passRate: number;
  holds: number;
  escapes: number;
  avgReleaseTimeHrs: number;
}

const defaultKpis: OutgoingKpis = {
  shipments: 0,
  outgoingInspections: 0,
  passRate: 0,
  holds: 0,
  escapes: 0,
  avgReleaseTimeHrs: 0
};

const resultConfig: Record<string, { label: string; color: string; icon: any }> = {
  pass: { label: 'Passed', color: 'bg-green-500/20 text-green-400', icon: CheckCircle2 },
  fail: { label: 'Failed', color: 'bg-red-500/20 text-red-400', icon: XCircle },
  hold: { label: 'On Hold', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
  escape: { label: 'Escape', color: 'bg-red-500/20 text-red-400', icon: AlertTriangle },
  unknown: { label: 'Unknown', color: 'bg-white/5 text-gray-400', icon: AlertTriangle },
};

export function OutgoingQualityPage() {
  const [kpis, setKpis] = useState<OutgoingKpis>(defaultKpis);
  const [releaseTrend, setReleaseTrend] = useState<any[]>([]);
  const [recentOutgoing, setRecentOutgoing] = useState<any[]>([]);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('week');
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<QualityDashboardFilters>(() => periodToQualityDashboardFilters('week', loadQualityDashboardFilters()));
  const [snapshot, setSnapshot] = useState<QualityAnalyticsSnapshot | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await loadQualityAnalyticsSnapshot(filters);
        setSnapshot(data);
        setKpis({
          shipments: data.outgoingMetrics.shipments,
          outgoingInspections: data.outgoingMetrics.outgoingInspections,
          passRate: data.outgoingMetrics.passRate,
          holds: data.outgoingMetrics.holds,
          escapes: data.outgoingMetrics.escapes,
          avgReleaseTimeHrs: data.outgoingMetrics.averageReleaseTimeHrs,
        });
        setReleaseTrend(data.outgoingMetrics.releaseTrend);
        setRecentOutgoing(data.outgoingMetrics.recent);
      } catch (e) {
        toast.error('Failed to load outgoing quality');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [filters]);

  const cards = useMemo(() => {
    if (!kpis) return [];
    return [
      { label: 'Shipments', value: kpis.shipments, icon: Truck, color: '#00A3E0', hint: 'Total shipped units/batches' },
      { label: 'Outgoing Inspections', value: kpis.outgoingInspections, icon: PackageCheck, color: '#3B82F6', hint: 'Inspected before shipping' },
      { label: 'Pass Rate', value: `${kpis.passRate}%`, icon: CheckCircle2, color: '#22C55E', hint: 'Outgoing inspection pass rate' },
      { label: 'Holds', value: kpis.holds, icon: AlertTriangle, color: '#F59E0B', hint: 'Shipments blocked/held' }
    ];
  }, [kpis]);

  if (isLoading || !kpis) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-72">
          <div className="text-gray-400">Loading outgoing quality...</div>
        </div>
      </PageContainer>
    );
  }

  const EscapeTrendIcon = kpis.escapes <= 1 ? TrendingDown : TrendingUp;

  return (
    <PageContainer>
      <PageHeader
        title="Outgoing Quality"
        subtitle="Final release readiness, holds, and customer escape prevention"
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'Outgoing Quality' }]}
        actions={{
          refresh: () => setPeriod((p) => p)
        }}
      />

      <div className="flex gap-2 mb-6">
        {([
          { id: 'week', label: 'Week' },
          { id: 'month', label: 'Month' },
          { id: 'quarter', label: 'Quarter' }
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
        <QualityAnalyticsConsistencyBadge dashboardName="Outgoing Quality" snapshot={snapshot} compact />
      </div>

      {snapshot?.outgoingMetrics.warnings.length ? (
        <PageSection>
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
            <p className="text-sm font-black text-amber-100">Outgoing data quality warnings</p>
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
              {snapshot.outgoingMetrics.warnings.map((warning) => (
                <p key={warning.id} className="text-xs text-amber-100/75">{warning.message}</p>
              ))}
            </div>
            <p className="mt-2 text-xs text-amber-100/55">Confidence: {snapshot.outgoingMetrics.confidence}. Holds and failures are based on saved outgoing records only.</p>
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
                <p className="text-2xl font-semibold text-white mb-1">{c.value as any}</p>
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
              <h3 className="text-sm font-semibold text-white">Release Time & Pass Rate</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <TrendingDown className="w-4 h-4 text-green-400" />
                {releaseTrend.length ? 'Based on registered releases' : 'No release records'}
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={releaseTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="day" stroke="#6B7280" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#6B7280" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke="#6B7280" fontSize={12} domain={[95, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(10,10,15,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      color: '#fff'
                    }}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="releaseHrs" stroke="#00A3E0" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="passRate" stroke="#22C55E" strokeWidth={2} dot={false} strokeDasharray="6 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Customer Escapes</h3>
              <div className="text-xs text-gray-500">This period</div>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Escapes</p>
                    <p className="text-3xl font-semibold text-white mt-1">{kpis.escapes}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${kpis.escapes <= 1 ? 'text-green-400' : 'text-red-400'}`}>
                    <EscapeTrendIcon className="w-4 h-4" />
                    {kpis.escapes <= 1 ? 'Controlled' : 'Rising'}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Target: 0</p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-gray-500">Avg Release Time</p>
                <p className="text-3xl font-semibold text-white mt-1">{kpis.avgReleaseTimeHrs}h</p>
                <p className="text-xs text-gray-500 mt-2">Target: &lt;= 3h</p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-gray-500">Holds Open</p>
                <p className="text-3xl font-semibold text-white mt-1">{kpis.holds}</p>
                <p className="text-xs text-gray-500 mt-2">Review blocked shipments</p>
              </div>
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection>
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="p-5 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">Recent Outgoing Inspections</h3>
            <p className="text-xs text-gray-500 mt-1">Latest shipping release records</p>
          </div>
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">ID</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Shipment</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Customer</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Result</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Defects</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Hold</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentOutgoing.map((r: any) => {
                const cfg = resultConfig[r.result];
                const Icon = cfg.icon;
                return (
                  <tr key={r.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-[#00A3E0] font-mono text-sm">{r.id}</td>
                    <td className="px-6 py-4 text-gray-200 text-sm">{r.shipment}</td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        to={buildDashboardDrilldownUrl('/outgoing-quality', { customer: r.customer, recordType: 'outgoing-quality' })}
                        onClick={() => recordDashboardDrilldown('/outgoing-quality', { customer: r.customer, recordType: 'outgoing-quality' }, 'Outgoing customer issue')}
                        className="font-bold text-[#8be3ff] hover:underline"
                      >
                        {r.customer}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-200 text-sm">{r.defects}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${r.holds ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-400'}`}>
                        {r.holds ? 'Hold' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{r.date}</td>
                  </tr>
                );
              })}
              {recentOutgoing.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                    No outgoing quality records yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PageSection>
    </PageContainer>
  );
}

export default OutgoingQualityPage;
