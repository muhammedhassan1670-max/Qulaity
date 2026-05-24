import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer, PageHeader, PageSection } from '../../components/PageHeader';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  MessageSquareWarning,
  TrendingDown,
  TrendingUp,
  Users
} from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { dashboardApi } from '../../api/unified-api';

interface ComplaintKpis {
  totalComplaints: number;
  openComplaints: number;
  criticalComplaints: number;
  avgResponseTimeHrs: number;
  onTimeResponseRate: number;
  customerSatisfaction: number;
}

const defaultKpis: ComplaintKpis = {
  totalComplaints: 0,
  openComplaints: 0,
  criticalComplaints: 0,
  avgResponseTimeHrs: 0,
  onTimeResponseRate: 0,
  customerSatisfaction: 0
};

const trendData = [] as any[];

const sourceData = [] as any[];

const topCustomers = [] as any[];

export function ComplaintsDashboardPage() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<ComplaintKpis>(defaultKpis);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await dashboardApi.getComplaintsStats();
        if (data) {
          setKpis({
            ...defaultKpis,
            ...data.kpis
          });
          // Update other data if available in data
        }
      } catch (e) {
        toast.error('Failed to load complaints dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [period]);

  const stats = useMemo(() => {
    if (!kpis) return [];
    const cards = [
      {
        label: 'Total Complaints',
        value: kpis.totalComplaints,
        icon: MessageSquareWarning,
        color: '#00A3E0',
        hint: 'All complaints logged'
      },
      {
        label: 'Open',
        value: kpis.openComplaints,
        icon: Clock,
        color: '#F59E0B',
        hint: 'New + Investigating'
      },
      {
        label: 'Critical',
        value: kpis.criticalComplaints,
        icon: AlertTriangle,
        color: '#DC2626',
        hint: 'Requires escalation'
      },
      {
        label: 'On-Time Response',
        value: `${kpis.onTimeResponseRate}%`,
        icon: CheckCircle,
        color: '#22C55E',
        hint: 'SLA performance'
      }
    ];
    return cards;
  }, [kpis]);

  if (isLoading || !kpis) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-72">
          <div className="text-gray-400">Loading complaints dashboard...</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Customer Complaints Dashboard"
        subtitle="KPI overview, trends, and customer impact"
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'Complaints Dashboard' }]}
        actions={{
          refresh: () => setPeriod((p) => p),
          create: () => navigate('/complaints?create=1')
        }}
      />

      <div className="flex gap-2 mb-6">
        {([
          { id: 'month', label: 'Month' },
          { id: 'quarter', label: 'Quarter' },
          { id: 'year', label: 'Year' }
        ] as const).map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p.id ? 'bg-[#0066CC] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <PageSection>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="glass-panel rounded-xl p-4 hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => navigate('/complaints')}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}20` }}>
                    <Icon className="w-5 h-5" style={{ color: s.color }} />
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {period}
                  </div>
                </div>
                <p className="text-2xl font-semibold text-white mb-1">{s.value}</p>
                <p className="text-sm text-gray-400">{s.label}</p>
                <p className="text-xs text-gray-500 mt-2">{s.hint}</p>
              </div>
            );
          })}
        </div>
      </PageSection>

      <PageSection>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-panel rounded-xl p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Complaints Trend</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <TrendingDown className="w-4 h-4 text-green-400" />
                No comparison data
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="week" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(10,10,15,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      color: '#fff'
                    }}
                  />
                  <Line type="monotone" dataKey="complaints" stroke="#00A3E0" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="closed" stroke="#22C55E" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="critical" stroke="#DC2626" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Sources</h3>
              <div className="text-xs text-gray-500">Distribution</div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {sourceData.map((entry: any, index: number) => (
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
            <div className="grid grid-cols-2 gap-2 mt-3">
              {sourceData.map((s: any) => {
                const Icon = s.icon;
                return (
                  <div key={s.name} className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                    <span className="truncate">{s.name}</span>
                    <span className="ml-auto text-gray-300">{s.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection>
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Top Customers</h3>
              <p className="text-xs text-gray-500 mt-1">Customers contributing most complaints (period)</p>
            </div>
            <button
              onClick={() => navigate('/complaints')}
              className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-200"
            >
              View Complaints List
            </button>
          </div>
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Customer</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Complaints</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Open</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Critical</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Last</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {topCustomers.map((c: any) => (
                <tr key={c.customer} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => navigate('/complaints')}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#0066CC]/20 flex items-center justify-center">
                        <Users className="w-4 h-4 text-[#00A3E0]" />
                      </div>
                      <span className="text-gray-200 text-sm">{c.customer}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-200 text-sm">{c.complaints}</td>
                  <td className="px-6 py-4 text-gray-200 text-sm">{c.open}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${c.critical > 0 ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-400'}`}>
                      {c.critical}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">{c.last}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageSection>

      <PageSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Avg Response</h3>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-3xl font-semibold text-white mt-3">{kpis.avgResponseTimeHrs}h</p>
            <p className="text-xs text-gray-500 mt-1">Target: ≤ 24h</p>
          </div>
          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Satisfaction</h3>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-3xl font-semibold text-white mt-3">{kpis.customerSatisfaction}/5</p>
            <p className="text-xs text-gray-500 mt-1">From post-closure surveys</p>
          </div>
          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Escalations</h3>
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
            </div>
            <p className="text-3xl font-semibold text-white mt-3">3</p>
            <p className="text-xs text-gray-500 mt-1">Open escalations this period</p>
          </div>
        </div>
      </PageSection>
    </PageContainer>
  );
}

export default ComplaintsDashboardPage;
