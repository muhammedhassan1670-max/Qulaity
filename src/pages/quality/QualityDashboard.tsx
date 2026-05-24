// QMS Enterprise 4.0 - Quality Dashboard Page - Professional Edition
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, PageContainer, PageSection } from '../../components/PageHeader';
import { toast } from 'sonner';
import { 
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  Users,
  Target,
  ShieldCheck,
  Package,
  FileText,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Line, Area, ComposedChart
} from 'recharts';

interface DashboardKPIs {
  openNCRs: number;
  activeCAPAs: number;
  open8Ds: number;
  pendingAudits: number;
  activeDeviations: number;
  newComplaints: number;
  pendingChanges: number;
  activeControlPlans: number;
  ncrTrend: number;
  capaTrend: number;
  complaintTrend: number;
  auditTrend: number;
}

interface ModuleStats {
  name: string;
  count: number;
  trend: number;
  status: 'good' | 'warning' | 'critical';
  icon: any;
  color: string;
}

const mockKPIs: DashboardKPIs = {
  openNCRs: 0,
  activeCAPAs: 0,
  open8Ds: 0,
  pendingAudits: 0,
  activeDeviations: 0,
  newComplaints: 0,
  pendingChanges: 0,
  activeControlPlans: 0,
  ncrTrend: 0,
  capaTrend: 0,
  complaintTrend: 0,
  auditTrend: 0
};

import QualityDashboardFilterBar from '@/components/QualityDashboardFilterBar';
import QualityAnalyticsConsistencyBadge from '@/components/QualityAnalyticsConsistencyBadge';
import {
  loadQualityAnalyticsSnapshot,
  loadQualityDashboardFilters,
  type QualityAnalyticsSnapshot,
  type QualityDashboardFilters,
} from '@/services/qualityAnalyticsHub';
import { buildDashboardDrilldownUrl, recordDashboardDrilldown } from '@/services/qualityDashboardSnapshots';

// ... (keep constants like trendData, statusDistribution, etc. as fallbacks)

export function QualityDashboardPage() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(mockKPIs);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [filters, setFilters] = useState<QualityDashboardFilters>(() => ({ ...loadQualityDashboardFilters(), datePreset: 'month' }));
  const [analytics, setAnalytics] = useState<QualityAnalyticsSnapshot | null>(null);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const data = await loadQualityAnalyticsSnapshot(filters);
      setAnalytics(data);
      setKpis({
        openNCRs: data.escalationMetrics.openNcrs,
        activeCAPAs: data.escalationMetrics.openCapas,
        open8Ds: data.escalationMetrics.openEightD,
        pendingAudits: data.auditMetrics.auditsDueToday,
        activeDeviations: data.defectMetrics.openDefects,
        newComplaints: data.outgoingMetrics.customerReturns,
        pendingChanges: data.actionEffectivenessMetrics.openActions,
        activeControlPlans: data.inspectionExecutionMetrics.activePlans,
        ncrTrend: 0,
        capaTrend: 0,
        complaintTrend: 0,
        auditTrend: 0,
      });
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod, filters]);

  const trendData = useMemo(() => analytics?.defectMetrics.trendData.map((row) => ({
    month: row.period,
    ncr: analytics.escalationMetrics.openNcrs,
    capa: analytics.escalationMetrics.openCapas,
    complaint: analytics.outgoingMetrics.customerReturns,
    audit: analytics.auditMetrics.completedRuns,
  })) || [], [analytics]);
  const statusDistribution = useMemo(() => analytics ? [
    { name: 'Open Defects', value: analytics.defectMetrics.openDefects, color: '#EF4444' },
    { name: 'Open NCRs', value: analytics.escalationMetrics.openNcrs, color: '#F97316' },
    { name: 'Open CAPAs', value: analytics.escalationMetrics.openCapas, color: '#F59E0B' },
    { name: 'Open 8Ds', value: analytics.escalationMetrics.openEightD, color: '#8B5CF6' },
    { name: 'Open Actions', value: analytics.actionEffectivenessMetrics.openActions, color: '#00A3E0' },
  ].filter((item) => item.value > 0) : [], [analytics]);
  const priorityDistribution = useMemo(() => analytics ? [
    { name: 'High Severity', value: analytics.defectMetrics.highSeverityOpen, color: '#EF4444' },
    { name: 'Overdue Actions', value: analytics.actionEffectivenessMetrics.overdueActions, color: '#F59E0B' },
    { name: 'Failed Checks', value: analytics.inspectionExecutionMetrics.failedChecksWithoutDefect, color: '#F97316' },
    { name: 'Knowledge Gaps', value: analytics.knowledgeMetrics.repeatedDefectsWithoutLessons.length, color: '#8B5CF6' },
  ].filter((item) => item.value > 0) : [], [analytics]);
  const recentActivities = useMemo(() => analytics?.defectMetrics.topRisks.slice(0, 6).map((risk) => ({
    id: risk.id,
    type: 'Risk',
    code: risk.relatedDefectId,
    status: risk.slaStatus,
    description: risk.title,
    user: risk.owner || risk.nextRequiredRole || 'Quality',
    time: 'Current filter',
  })) || [], [analytics]);
  const alerts = useMemo(() => analytics?.dataQualityMetrics.warnings.slice(0, 6).map((warning) => ({
    id: warning.id,
    severity: warning.severity,
    message: warning.message,
    module: warning.title,
  })) || [], [analytics]);

  const moduleStats: ModuleStats[] = useMemo(() => [
    { name: 'NCRs', count: kpis?.openNCRs || 0, trend: kpis?.ncrTrend || 0, status: 'warning', icon: AlertCircle, color: '#EF4444' },
    { name: 'CAPAs', count: kpis?.activeCAPAs || 0, trend: kpis?.capaTrend || 0, status: 'good', icon: Target, color: '#F59E0B' },
    { name: '8D Reports', count: kpis?.open8Ds || 0, trend: 0, status: 'warning', icon: Activity, color: '#8B5CF6' },
    { name: 'Audits', count: kpis?.pendingAudits || 0, trend: kpis?.auditTrend || 0, status: 'good', icon: ShieldCheck, color: '#10B981' },
    { name: 'Deviations', count: kpis?.activeDeviations || 0, trend: 0, status: 'warning', icon: AlertTriangle, color: '#F97316' },
    { name: 'Complaints', count: kpis?.newComplaints || 0, trend: kpis?.complaintTrend || 0, status: 'good', icon: Users, color: '#3B82F6' },
    { name: 'Change Requests', count: kpis?.pendingChanges || 0, trend: 0, status: 'good', icon: FileText, color: '#06B6D4' },
    { name: 'Control Plans', count: kpis?.activeControlPlans || 0, trend: 0, status: 'good', icon: Package, color: '#22C55E' }
  ], [kpis]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-[#00A3E0] animate-spin" />
          <span className="ml-3 text-gray-400">Loading dashboard...</span>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Quality Dashboard"
        subtitle="Real-time overview of Quality Management System performance"
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'Dashboard' }]}
        actions={{
          refresh: loadDashboardData
        }}
      />

      {/* Period Selector */}
      <div className="flex gap-2 mb-6">
        {['day', 'week', 'month', 'quarter', 'year'].map((period) => (
          <button
            key={period}
            onClick={() => {
              setSelectedPeriod(period);
              setFilters((current) => ({ ...current, datePreset: period === 'day' ? 'week' : period as QualityDashboardFilters['datePreset'] }));
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPeriod === period
                ? 'bg-[#0066CC] text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <QualityDashboardFilterBar value={filters} onChange={setFilters} compact />
      </div>

      <div className="mb-6">
        <QualityAnalyticsConsistencyBadge dashboardName="Quality Dashboard" snapshot={analytics} compact />
      </div>

      {/* Module Stats Grid */}
      <PageSection>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {moduleStats.map((stat) => {
            const Icon = stat.icon;
            const isPositive = stat.trend > 0;
            const TrendIcon = isPositive ? TrendingUp : TrendingDown;
            const targetRoute = stat.name === 'NCRs' ? '/quality/records/ncr'
              : stat.name === 'CAPAs' ? '/quality/records/capa'
                : stat.name === '8D Reports' ? '/quality/records/8d'
                  : stat.name === 'Audits' ? '/quality-audits'
                    : '/defect-log';
            const targetFilters = stat.name === 'NCRs' ? { ncrStatus: 'open' }
              : stat.name === 'CAPAs' ? { capaStatus: 'open' }
                : stat.name === '8D Reports' ? { eightDStatus: 'open' }
                  : {};
            return (
              <Link
                key={stat.name}
                to={buildDashboardDrilldownUrl(targetRoute, targetFilters)}
                onClick={() => recordDashboardDrilldown(targetRoute, targetFilters, stat.name)}
                className="glass-panel rounded-xl p-4 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}20` }}>
                    <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    <TrendIcon className="w-3 h-3" />
                    <span>{Math.abs(stat.trend)}%</span>
                  </div>
                </div>
                <p className="text-2xl font-semibold text-white mb-1">{stat.count}</p>
                <p className="text-sm text-gray-400">{stat.name}</p>
              </Link>
            );
          })}
        </div>
      </PageSection>

      {/* Charts Row */}
      <PageSection>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Trend Chart */}
          <div className="lg:col-span-2 glass-panel rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Quality Trends</h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-gray-400">
                  <span className="w-3 h-3 rounded-full bg-red-500" /> NCR
                </span>
                <span className="flex items-center gap-1 text-gray-400">
                  <span className="w-3 h-3 rounded-full bg-yellow-500" /> CAPA
                </span>
                <span className="flex items-center gap-1 text-gray-400">
                  <span className="w-3 h-3 rounded-full bg-blue-500" /> Complaints
                </span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Area type="monotone" dataKey="ncr" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} name="NCR" />
                  <Area type="monotone" dataKey="capa" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} name="CAPA" />
                  <Area type="monotone" dataKey="complaint" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} name="Complaints" />
                  <Line type="monotone" dataKey="audit" stroke="#10B981" strokeWidth={2} name="Audits" dot={{ fill: '#10B981' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Status Distribution</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {statusDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-300">{item.name}</span>
                  <span className="text-gray-500 ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageSection>

      {/* Priority & Activity Row */}
      <PageSection>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Priority Distribution */}
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Priority Distribution</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                  <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#9CA3AF" fontSize={12} width={70} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {priorityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2 glass-panel rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
              <button className="text-[#00A3E0] text-sm hover:text-white transition-colors">
                View All
              </button>
            </div>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    activity.type === 'NCR' ? 'bg-red-500/20 text-red-400' :
                    activity.type === 'CAPA' ? 'bg-yellow-500/20 text-yellow-400' :
                    activity.type === '8D' ? 'bg-purple-500/20 text-purple-400' :
                    activity.type === 'Audit' ? 'bg-green-500/20 text-green-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {activity.type[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[#00A3E0] font-mono text-sm">{activity.code}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        activity.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        activity.status === 'open' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm truncate">{activity.description}</p>
                    <p className="text-gray-500 text-xs">{activity.user} • {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageSection>

      {/* Alerts Section */}
      <PageSection>
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            Alerts & Notifications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`flex items-start gap-3 p-4 rounded-lg border-l-4 ${
                  alert.severity === 'critical' ? 'bg-red-500/10 border-red-500' :
                  alert.severity === 'warning' ? 'bg-yellow-500/10 border-yellow-500' :
                  'bg-blue-500/10 border-blue-500'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                  alert.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {alert.severity === 'critical' ? <AlertTriangle className="w-4 h-4" /> :
                   alert.severity === 'warning' ? <Clock className="w-4 h-4" /> :
                   <CheckCircle className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{alert.message}</p>
                  <p className="text-gray-400 text-xs mt-1">{alert.module}</p>
                </div>
                <button className="text-[#00A3E0] text-xs hover:text-white transition-colors">
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      </PageSection>
    </PageContainer>
  );
}

export default QualityDashboardPage;
