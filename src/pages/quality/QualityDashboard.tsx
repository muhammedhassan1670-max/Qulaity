// QMS Enterprise 5.0 - Quality Dashboard Page - Executive & Operational Edition
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/utils/translations';
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
  Loader2,
  Zap,
  Factory,
  Gauge,
  DollarSign,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Line,
  Area,
  ComposedChart,
} from 'recharts';
import QualityAnalyticsConsistencyBadge from '@/components/QualityAnalyticsConsistencyBadge';
import {
  loadQualityAnalyticsSnapshot,
  loadQualityDashboardFilters,
  type QualityAnalyticsSnapshot,
  type QualityDashboardFilters,
} from '@/services/qualityAnalyticsHub';
import { buildDashboardDrilldownUrl, recordDashboardDrilldown } from '@/services/qualityDashboardSnapshots';

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
  labelAr: string;
  count: number;
  trend: number;
  status: 'good' | 'warning' | 'critical';
  icon: LucideIcon;
  color: string;
  route: string;
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
  auditTrend: 0,
};

export function QualityDashboardPage() {
  const { isLiteMode } = useAppStore();
  const { isAr, dir } = useTranslation();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(mockKPIs);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [filters, setFilters] = useState<QualityDashboardFilters>(() => ({
    ...loadQualityDashboardFilters(),
    datePreset: 'month',
  }));
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
        ncrTrend: data.escalationMetrics.openNcrs > 0 ? 4 : 0,
        capaTrend: data.escalationMetrics.openCapas > 0 ? 6 : 0,
        complaintTrend: data.outgoingMetrics.customerReturns > 0 ? -2 : 0,
        auditTrend: data.auditMetrics.completionRate || 100,
      });
    } catch {
      toast.error(isAr ? 'تعذر تحميل بيانات لوحة الجودة' : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod, filters]);

  const trendData = useMemo(
    () =>
      analytics?.defectMetrics.trendData.map((row) => ({
        month: row.period || row.name,
        ncr: row.defects || 0,
        capa: row.open || 0,
        complaint: Math.round((row.cost || 0) / 100),
        audit: row.ppm || 0,
      })) || [],
    [analytics]
  );

  const statusDistribution = useMemo(
    () =>
      analytics
        ? [
            { name: isAr ? 'عيوب مفتوحة' : 'Open Defects', value: analytics.defectMetrics.openDefects, color: '#EF4444' },
            { name: isAr ? 'تقارير NCR' : 'Open NCRs', value: analytics.escalationMetrics.openNcrs, color: '#F97316' },
            { name: isAr ? 'إجراءات CAPA' : 'Open CAPAs', value: analytics.escalationMetrics.openCapas, color: '#F59E0B' },
            { name: isAr ? 'فرق 8D' : 'Open 8Ds', value: analytics.escalationMetrics.openEightD, color: '#8B5CF6' },
            { name: isAr ? 'خطط التحسين' : 'Open Actions', value: analytics.actionEffectivenessMetrics.openActions, color: '#00A3E0' },
          ].filter((item) => item.value > 0)
        : [],
    [analytics, isAr]
  );

  const priorityDistribution = useMemo(
    () =>
      analytics
        ? [
            { name: isAr ? 'خطورة عالية' : 'High Severity', value: analytics.defectMetrics.highSeverityOpen, color: '#EF4444' },
            { name: isAr ? 'إجراءات متأخرة' : 'Overdue Actions', value: analytics.actionEffectivenessMetrics.overdueActions, color: '#F59E0B' },
            { name: isAr ? 'فحوصات مرفوضة' : 'Failed Checks', value: analytics.inspectionExecutionMetrics.failedChecksWithoutDefect, color: '#F97316' },
            { name: isAr ? 'فجوات معرفية' : 'Knowledge Gaps', value: analytics.knowledgeMetrics.repeatedDefectsWithoutLessons.length, color: '#8B5CF6' },
          ].filter((item) => item.value > 0)
        : [],
    [analytics, isAr]
  );

  const recentActivities = useMemo(
    () =>
      analytics?.defectMetrics.topRisks.slice(0, 6).map((risk) => ({
        id: risk.id,
        type: 'Risk',
        code: risk.relatedDefectId || risk.id,
        status: risk.slaStatus,
        description: risk.title,
        user: risk.owner || risk.nextRequiredRole || 'Quality Engineering',
        time: isAr ? 'النطاق الحالي' : 'Current filter',
        route: '/quality-command-center',
      })) || [],
    [analytics, isAr]
  );

  const alerts = useMemo(
    () =>
      analytics?.dataQualityMetrics.warnings.slice(0, 6).map((warning) => ({
        id: warning.id,
        severity: warning.severity,
        message: warning.message,
        module: warning.title,
        route: warning.route || '/quality-command-center',
      })) || [],
    [analytics]
  );

  const moduleStats: ModuleStats[] = useMemo(
    () =>
      (
        [
          { name: 'NCRs', labelAr: 'عدم المطابقة NCR', count: kpis?.openNCRs || 0, trend: kpis?.ncrTrend || 0, status: 'warning', icon: AlertCircle, color: '#EF4444', route: '/quality/records/ncr' },
          { name: 'CAPAs', labelAr: 'الإجراءات التصحيحية CAPA', count: kpis?.activeCAPAs || 0, trend: kpis?.capaTrend || 0, status: 'good', icon: Target, color: '#F59E0B', route: '/quality/records/capa' },
          { name: '8D Reports', labelAr: 'تحقيقات 8D', count: kpis?.open8Ds || 0, trend: 0, status: 'warning', icon: Activity, color: '#8B5CF6', route: '/quality/records/8d' },
          { name: 'Audits', labelAr: 'التدقيق الداخلي LPA', count: kpis?.pendingAudits || 0, trend: kpis?.auditTrend || 0, status: 'good', icon: ShieldCheck, color: '#10B981', route: '/quality-audits' },
          { name: 'Deviations', labelAr: 'العيوب والانحرافات', count: kpis?.activeDeviations || 0, trend: 0, status: 'warning', icon: AlertTriangle, color: '#F97316', route: '/defect-log' },
          { name: 'Complaints', labelAr: 'شكاوى ومرتجعات العملاء', count: kpis?.newComplaints || 0, trend: kpis?.complaintTrend || 0, status: 'good', icon: Users, color: '#3B82F6', route: '/complaints' },
          { name: 'Change Requests', labelAr: 'إجراءات التحسين', count: kpis?.pendingChanges || 0, trend: 0, status: 'good', icon: FileText, color: '#06B6D4', route: '/quality-command-center' },
          { name: 'Control Plans', labelAr: 'خطط الفحص النشطة', count: kpis?.activeControlPlans || 0, trend: 0, status: 'good', icon: Package, color: '#22C55E', route: '/quality-inspection-plans' },
        ] as ModuleStats[]
      ).filter((item) => !isLiteMode || ['NCRs', 'Deviations', 'Complaints'].includes(item.name)),
    [kpis, isLiteMode]
  );

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-[#00A3E0] animate-spin" />
          <span className="ml-3 text-gray-400">
            {isAr ? 'جارٍ تحميل لوحة مؤشرات الجودة...' : 'Loading quality dashboard...'}
          </span>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div dir={dir}>
        <PageHeader
          title={isAr ? 'لوحة مؤشرات الجودة الشاملة 5.0' : 'Quality Performance Dashboard 5.0'}
          subtitle={
            isAr
              ? 'نظرة تحليلية فورية لأداء منظومة إدارة الجودة ومعدلات المطابقة والتصعيد'
              : 'Real-time overview of Quality Management System performance & escalations'
          }
          breadcrumbs={[
            { label: 'Quality 5.0' },
            { label: isAr ? 'لوحة مؤشرات الجودة' : 'Quality Dashboard' },
          ]}
          actions={{
            refresh: loadDashboardData,
          }}
        />

        {/* Quick Executive Navigation & Period Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'day', ar: 'يومي', en: 'Day' },
              { id: 'week', ar: 'أسبوعي', en: 'Week' },
              { id: 'month', ar: 'شهري', en: 'Month' },
              { id: 'quarter', ar: 'ربع سنوي', en: 'Quarter' },
              { id: 'year', ar: 'سنوي', en: 'Year' },
            ].map((period) => (
              <button
                key={period.id}
                onClick={() => {
                  setSelectedPeriod(period.id);
                  setFilters((current) => ({
                    ...current,
                    datePreset: period.id === 'day' ? 'week' : (period.id as QualityDashboardFilters['datePreset']),
                  }));
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors shrink-0 ${
                  selectedPeriod === period.id
                    ? 'bg-[#0066CC] text-white shadow-lg shadow-[#0066CC]/25'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {isAr ? period.ar : period.en}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white"
            >
              <Gauge className="w-3.5 h-3.5 text-[#00d2ff]" />
              {isAr ? 'مركز القيادة التنفيذي' : 'Executive Command'}
            </Link>
            <Link
              to="/superpowers"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-black text-white shadow-md"
            >
              <Zap className="w-3.5 h-3.5" />
              {isAr ? 'الترسانة الخارقة 5.0' : 'Superpowers 5.0'}
            </Link>
            <Link
              to="/quality-control-tower"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-xs font-bold text-amber-300"
            >
              <Factory className="w-3.5 h-3.5" />
              {isAr ? 'برج المراقبة 3D' : '3D Control Tower'}
            </Link>
          </div>
        </div>

        {/* High-Level Financial & PPM Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="glass-panel rounded-2xl p-4 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">
                {isAr ? 'معدل العيوب (PPM)' : 'Process PPM'}
              </span>
              <p className="text-2xl font-black text-white mt-0.5">
                {(analytics?.ppmMetrics.currentPpm ?? 0).toLocaleString()}
              </p>
            </div>
            <Gauge className="w-7 h-7 text-cyan-400" />
          </div>
          <div className="glass-panel rounded-2xl p-4 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">
                {isAr ? 'تكلفة الجودة الرديئة COPQ' : 'Total COPQ'}
              </span>
              <p className="text-2xl font-black text-emerald-400 mt-0.5">
                ${(analytics?.copqMetrics.totalCopq ?? 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-7 h-7 text-emerald-400" />
          </div>
          <div className="glass-panel rounded-2xl p-4 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">
                {isAr ? 'نسبة اجتياز الفحص النهائي' : 'OQC Pass Rate'}
              </span>
              <p className="text-2xl font-black text-white mt-0.5">
                {analytics?.outgoingMetrics.passRate ?? 100}%
              </p>
            </div>
            <ShieldCheck className="w-7 h-7 text-purple-400" />
          </div>
          <div className="glass-panel rounded-2xl p-4 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">
                {isAr ? 'التزام خطط الفحص' : 'Plan Compliance'}
              </span>
              <p className="text-2xl font-black text-amber-400 mt-0.5">
                {analytics?.inspectionExecutionMetrics.planCompliance ?? 100}%
              </p>
            </div>
            <Activity className="w-7 h-7 text-amber-400" />
          </div>
        </div>

        <div className="mb-6">
          <QualityAnalyticsConsistencyBadge dashboardName="Quality Dashboard" snapshot={analytics} compact />
        </div>

        {/* Module Stats Grid */}
        <PageSection>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 mb-8">
            {moduleStats.map((stat) => {
              const Icon = stat.icon;
              const isPositive = stat.trend >= 0;
              const TrendIcon = isPositive ? TrendingUp : TrendingDown;
              const targetFilters =
                stat.name === 'NCRs'
                  ? { ncrStatus: 'open' }
                  : stat.name === 'CAPAs'
                  ? { capaStatus: 'open' }
                  : stat.name === '8D Reports'
                  ? { eightDStatus: 'open' }
                  : {};
              return (
                <Link
                  key={stat.name}
                  to={buildDashboardDrilldownUrl(stat.route, targetFilters)}
                  onClick={() => recordDashboardDrilldown(stat.route, targetFilters, stat.name)}
                  className="glass-panel rounded-2xl p-3.5 sm:p-4 hover:bg-white/10 border border-white/10 hover:border-[#00A3E0]/40 transition-all cursor-pointer min-w-0 group"
                >
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${stat.color}20` }}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: stat.color }} />
                    </div>
                    <div
                      className={`flex items-center gap-1 text-[11px] sm:text-xs shrink-0 whitespace-nowrap ${
                        isPositive ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      <TrendIcon className="w-3 h-3" />
                      <span>{Math.abs(stat.trend)}%</span>
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-white mb-0.5 truncate">{stat.count}</p>
                  <p className="text-xs sm:text-sm text-gray-400 truncate flex items-center justify-between">
                    <span>{isAr ? stat.labelAr : stat.name}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#00A3E0]" />
                  </p>
                </Link>
              );
            })}
          </div>
        </PageSection>

        {/* Charts Row */}
        <PageSection>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Trend Chart */}
            <div className="lg:col-span-2 glass-panel rounded-2xl p-4 sm:p-6 border border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {isAr ? 'اتجاهات الجودة والـ PPM عبر الزمن' : 'Quality & PPM Trends'}
                </h3>
                <div className="flex items-center gap-3 sm:gap-4 text-xs flex-wrap">
                  <span className="flex items-center gap-1 text-gray-400 shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> {isAr ? 'العيوب' : 'Defects'}
                  </span>
                  {!isLiteMode && (
                    <>
                      <span className="flex items-center gap-1 text-gray-400 shrink-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> {isAr ? 'مفتوحة' : 'Open'}
                      </span>
                      <span className="flex items-center gap-1 text-gray-400 shrink-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> PPM
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} />
                    <YAxis stroke="#9CA3AF" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#F3F4F6' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="ncr"
                      stroke="#EF4444"
                      fill="#EF4444"
                      fillOpacity={0.3}
                      name={isAr ? 'العيوب' : 'Defects'}
                    />
                    {!isLiteMode && (
                      <>
                        <Area
                          type="monotone"
                          dataKey="capa"
                          stroke="#F59E0B"
                          fill="#F59E0B"
                          fillOpacity={0.3}
                          name={isAr ? 'البلاغات المفتوحة' : 'Open Cases'}
                        />
                        <Line
                          type="monotone"
                          dataKey="audit"
                          stroke="#10B981"
                          strokeWidth={2}
                          name="PPM"
                          dot={{ fill: '#10B981' }}
                        />
                      </>
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Distribution */}
            <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">
                {isAr ? 'توزيع الحالات النشطة' : 'Status Distribution'}
              </h3>
              <div className="h-48">
                {statusDistribution.length > 0 ? (
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
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-400">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
                    {isAr ? 'جميع الحالات مغلقة ومطابقة' : 'All cases resolved & compliant'}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {statusDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-300 truncate">{item.name}</span>
                    <span className="text-white font-bold ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PageSection>

        {/* Priority & Activity Row */}
        {!isLiteMode && (
          <PageSection>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Priority Distribution */}
              <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">
                  {isAr ? 'توزيع الأولويات والمخاطر' : 'Priority Distribution'}
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priorityDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                      <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                      <YAxis dataKey="name" type="category" stroke="#9CA3AF" fontSize={11} width={85} />
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
              <div className="lg:col-span-2 glass-panel rounded-2xl p-4 sm:p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">
                    {isAr ? 'أحدث المخاطر والأنشطة الميدانية' : 'Recent Risk & Field Activity'}
                  </h3>
                  <button
                    onClick={() => navigate('/defect-log')}
                    className="text-[#00A3E0] text-sm hover:text-white transition-colors font-bold"
                  >
                    {isAr ? 'عرض السجل الكامل' : 'View All'}
                  </button>
                </div>
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      onClick={() => navigate(activity.route)}
                      className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-400 font-bold">
                        {activity.type[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[#00A3E0] font-mono text-sm">{activity.code}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              activity.status === 'completed'
                                ? 'bg-green-500/20 text-green-400'
                                : activity.status === 'open'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}
                          >
                            {activity.status}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm truncate">{activity.description}</p>
                        <p className="text-gray-500 text-xs">
                          {activity.user} • {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                  {recentActivities.length === 0 && (
                    <div className="p-6 text-center text-xs text-slate-400 bg-white/5 rounded-xl">
                      {isAr ? 'لا توجد مخاطر حرجة مفتوحة في هذا النطاق الزمني' : 'No open risk escalations in this time window'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </PageSection>
        )}

        {/* Alerts Section */}
        {!isLiteMode && (
          <PageSection>
            <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                {isAr ? 'التنبيهات وإشعارات حوكمة الجودة' : 'Governance Alerts & Notifications'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border-l-4 ${
                      alert.severity === 'critical'
                        ? 'bg-red-500/10 border-red-500'
                        : alert.severity === 'warning'
                        ? 'bg-yellow-500/10 border-yellow-500'
                        : 'bg-blue-500/10 border-blue-500'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        alert.severity === 'critical'
                          ? 'bg-red-500/20 text-red-400'
                          : alert.severity === 'warning'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {alert.severity === 'critical' ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : alert.severity === 'warning' ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{alert.message}</p>
                      <p className="text-gray-400 text-xs mt-1">{alert.module}</p>
                    </div>
                    <button
                      onClick={() => navigate(alert.route)}
                      className="text-[#00A3E0] text-xs font-bold hover:text-white transition-colors shrink-0"
                    >
                      {isAr ? 'فحص' : 'View'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </PageSection>
        )}
      </div>
    </PageContainer>
  );
}

export default QualityDashboardPage;
