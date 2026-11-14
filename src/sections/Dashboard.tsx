import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/utils/translations';
import {
  Activity,
  RefreshCw,
  Layers,
  Target,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Calculator,
  Factory,
  Zap,
  Brain,
  Gauge,
  TrendingUp,
  Download,
  Sparkles,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  Wrench,
  FileSpreadsheet,
  PlusCircle,
  Smartphone,
  Eye,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import {
  Area,
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
  ComposedChart,
  Line,
} from 'recharts';
import { gsap } from 'gsap';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import QualityDashboardFilterBar from '@/components/QualityDashboardFilterBar';
import QualityAnalyticsConsistencyBadge from '@/components/QualityAnalyticsConsistencyBadge';
import { FactoryQualityStream } from '@/components/FactoryQualityStream';
import {
  loadQualityAnalyticsSnapshot,
  loadQualityDashboardFilters,
  type QualityAnalyticsSnapshot,
  type QualityDashboardFilters,
} from '@/services/qualityAnalyticsHub';
import { buildDashboardDrilldownUrl, recordDashboardDrilldown } from '@/services/qualityDashboardSnapshots';
import { unifiedDefectLogApi } from '@/api/unified-api';

interface KpiState {
  totalRecords: number;
  totalDefects: number;
  totalInspected: number;
  currentPpm: number;
  totalCopq: number;
  returns: number;
  holds: number;
  returnQty: number;
  passRate: number;
  openNcrs: number;
  openCapas: number;
  openEightD: number;
  openActions: number;
  overdueActions: number;
  inspectionCompliance: number;
  auditCompliance: number;
  failedChecks: number;
  failedChecksWithoutDefect: number;
  notEffectiveActions: number;
  knowledgeGaps: number;
  confidence: string;
}

const KPIMini = ({ title, value, sub, color }: { title: string; value: string; sub?: string; color: string }) => (
  <div className="flex flex-col p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all">
    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{title}</span>
    <span className="text-2xl font-black mt-1" style={{ color }}>{value}</span>
    {sub && <span className="text-[10px] text-gray-500 mt-0.5">{sub}</span>}
  </div>
);

function calculateSigmaFromPpm(ppm: number): { sigma: string; cpk: string; grade: string; color: string } {
  if (ppm <= 3.4) return { sigma: '6.0σ', cpk: '2.00', grade: 'World Class', color: '#00e676' };
  if (ppm <= 233) return { sigma: '5.0σ', cpk: '1.67', grade: 'Excellent', color: '#10B981' };
  if (ppm <= 1350) return { sigma: '4.5σ', cpk: '1.50', grade: 'Capable', color: '#00d2ff' };
  if (ppm <= 6210) return { sigma: '4.0σ', cpk: '1.33', grade: 'Industry Avg', color: '#F59E0B' };
  if (ppm <= 22750) return { sigma: '3.5σ', cpk: '1.17', grade: 'Marginal', color: '#FF9100' };
  if (ppm <= 66807) return { sigma: '3.0σ', cpk: '1.00', grade: 'Needs CAPA', color: '#FF6B35' };
  return { sigma: '2.4σ', cpk: '0.80', grade: 'Critical Risk', color: '#FF1744' };
}

export function Dashboard() {
  const { isLiteMode } = useAppStore();
  const { isAr, dir } = useTranslation();
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [activeLens, setActiveLens] = useState<'overview' | 'lines' | 'ai_radar' | 'quick_ops'>('overview');
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(() => new Date().toLocaleTimeString());

  const [kpiData, setKpiData] = useState<KpiState | null>(null);
  const [ncrTrendData, setNcrTrendData] = useState<Array<Record<string, unknown>>>([]);
  const [spcDefectsData, setSpcDefectsData] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [auditScoresData, setAuditScoresData] = useState<Array<{ name: string; compliance: number; defects?: number }>>([]);
  const [approvalBottlenecksData, setApprovalBottlenecksData] = useState<Array<{ role: string; pending: string; customer?: string }>>([]);
  const [snapshot, setSnapshot] = useState<QualityAnalyticsSnapshot | null>(null);
  const [filters, setFilters] = useState<QualityDashboardFilters>(() => loadQualityDashboardFilters());

  // Quick defect logger state
  const [quickLine, setQuickLine] = useState('Line 1 - Assembly');
  const [quickDefectType, setQuickDefectType] = useState('Dimensional Out-of-Spec');
  const [quickSeverity, setQuickSeverity] = useState<'minor' | 'major' | 'critical'>('major');
  const [quickQty, setQuickQty] = useState(2);
  const [quickInspected, setQuickInspected] = useState(250);
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const data = await loadQualityAnalyticsSnapshot(filters);
      setSnapshot(data);
      const totalInsp = data.defectMetrics.trendData.reduce((acc, r) => acc + (Number(r.inspected) || 0), 0);
      setKpiData({
        totalRecords: data.defectMetrics.totalRecords,
        totalDefects: data.defectMetrics.totalDefectQuantity,
        totalInspected: totalInsp,
        currentPpm: data.ppmMetrics.currentPpm,
        totalCopq: data.copqMetrics.totalCopq,
        returns: data.outgoingMetrics.customerReturns,
        holds: data.outgoingMetrics.holds,
        returnQty: data.outgoingMetrics.customerReturns,
        passRate: data.outgoingMetrics.passRate,
        openNcrs: data.escalationMetrics.openNcrs,
        openCapas: data.escalationMetrics.openCapas,
        openEightD: data.escalationMetrics.openEightD,
        openActions: data.actionEffectivenessMetrics.openActions,
        overdueActions: data.actionEffectivenessMetrics.overdueActions,
        inspectionCompliance: data.inspectionExecutionMetrics.planCompliance,
        auditCompliance: data.auditMetrics.completionRate,
        failedChecks: data.inspectionExecutionMetrics.failedChecks,
        failedChecksWithoutDefect: data.inspectionExecutionMetrics.failedChecksWithoutDefect,
        notEffectiveActions: data.actionEffectivenessMetrics.notEffectiveActions,
        knowledgeGaps: data.knowledgeMetrics.repeatedDefectsWithoutLessons.length,
        confidence: data.dashboardConfidenceLabels.defects,
      });
      setNcrTrendData(
        data.defectMetrics.trendData.map((row) => ({
          ...row,
          open: row.defects,
          ppm: row.ppm || 0,
          cost: row.cost || 0,
        }))
      );
      setSpcDefectsData(
        data.defectMetrics.distribution.map((row, index) => ({
          name: row.label,
          value: row.value,
          color: ['#00A3E0', '#EF4444', '#F59E0B', '#8B5CF6', '#10B981', '#EC4899'][index % 6],
        }))
      );
      setAuditScoresData(
        data.ppmMetrics.byLine.map((line) => ({
          name: line.label,
          compliance: line.value,
          defects: line.count,
        }))
      );
      setApprovalBottlenecksData(
        data.outgoingMetrics.recent.map((item) => ({
          role: item.shipment,
          pending: item.result,
          customer: item.customer,
        }))
      );
      setLastSyncedAt(new Date().toLocaleTimeString());
    } catch {
      toast.error(isAr ? 'تعذر مزامنة بيانات لوحة القيادة' : 'Failed to sync intelligence hub');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  useEffect(() => {
    if (!autoSync) return;
    const timer = setInterval(() => {
      fetchDashboardData();
    }, 15000);
    return () => clearInterval(timer);
  }, [autoSync, filters]);

  useEffect(() => {
    if (sectionRef.current) {
      gsap.fromTo(
        sectionRef.current.querySelectorAll('.module-row'),
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.65, stagger: 0.08, ease: 'power3.out' }
      );
    }
  }, [kpiData, activeLens]);

  // Derived Executive Health Metrics
  const executiveHealth = useMemo(() => {
    const ppm = kpiData?.currentPpm ?? 0;
    const sigmaInfo = calculateSigmaFromPpm(ppm);
    const totalInspected = Math.max(kpiData?.totalInspected || 0, (kpiData?.totalDefects || 0) * 20, 100);
    const totalDefects = kpiData?.totalDefects || 0;
    const fpy = totalDefects === 0 ? 100 : Math.max(0, Math.min(100, Number((((totalInspected - totalDefects) / totalInspected) * 100).toFixed(2))));
    const inspComp = kpiData?.inspectionCompliance || 100;
    const auditComp = kpiData?.auditCompliance || 100;
    const passRate = kpiData?.passRate || 100;
    const qhi = Math.round(fpy * 0.4 + passRate * 0.25 + inspComp * 0.2 + auditComp * 0.15);
    return {
      fpy,
      qhi,
      ...sigmaInfo,
    };
  }, [kpiData]);

  // Production Lines Matrix (combining real line stats with interactive status)
  const productionLinesMatrix = useMemo(() => {
    const baseLines = snapshot?.ppmMetrics.byLine || [];
    if (baseLines.length > 0) {
      return baseLines.map((line, idx) => {
        const linePpm = line.value || 0;
        const status = linePpm > 10000 ? 'CRITICAL' : linePpm > 2500 ? 'WARNING' : 'OPTIMAL';
        const fpy = Math.max(85, Math.min(100, Number((100 - linePpm / 10000).toFixed(2))));
        return {
          id: `LINE-0${idx + 1}`,
          name: line.label,
          defects: line.count,
          ppm: linePpm,
          fpy,
          status,
          cPk: calculateSigmaFromPpm(linePpm).cpk,
        };
      });
    }
    return [
      { id: 'LINE-01', name: isAr ? 'خط التجميع الرئيسي 1 (Assembly L1)' : 'Assembly Line 1', defects: 0, ppm: 0, fpy: 100, status: 'OPTIMAL', cPk: '2.00' },
      { id: 'LINE-02', name: isAr ? 'خلية الخراطة الرقمية (CNC Cell A)' : 'CNC Precision Cell A', defects: 0, ppm: 0, fpy: 100, status: 'OPTIMAL', cPk: '2.00' },
      { id: 'LINE-03', name: isAr ? 'خط اللحام الروبوتي (Robotic Weld)' : 'Robotic Welding Line', defects: 0, ppm: 0, fpy: 100, status: 'OPTIMAL', cPk: '2.00' },
      { id: 'LINE-04', name: isAr ? 'محطة الفحص النهائي (OQC Gate)' : 'Final OQC Gatekeeper', defects: 0, ppm: 0, fpy: 100, status: 'OPTIMAL', cPk: '2.00' },
    ];
  }, [snapshot, isAr]);

  const handleExportExecutiveReport = () => {
    const reportLines = [
      `# QMS Enterprise 5.0 - Executive Quality Command Report`,
      `Generated: ${new Date().toISOString()}`,
      ``,
      `## 1. World-Class Health Indicators`,
      `- Quality Health Index (QHI): ${executiveHealth.qhi}%`,
      `- First Pass Yield (FPY): ${executiveHealth.fpy}%`,
      `- Process Sigma Level: ${executiveHealth.sigma} (Cpk: ${executiveHealth.cpk} - ${executiveHealth.grade})`,
      `- Process PPM: ${kpiData?.currentPpm ?? 0}`,
      `- Cost of Poor Quality (COPQ): $${(kpiData?.totalCopq ?? 0).toLocaleString()}`,
      ``,
      `## 2. Operational & Escalation Metrics`,
      `- Total Defect Records: ${kpiData?.totalRecords ?? 0}`,
      `- Total Defect Quantity: ${kpiData?.totalDefects ?? 0}`,
      `- Open NCRs: ${kpiData?.openNcrs ?? 0}`,
      `- Open CAPAs: ${kpiData?.openCapas ?? 0}`,
      `- Open 8D Investigations: ${kpiData?.openEightD ?? 0}`,
      `- Open Improvement Actions: ${kpiData?.openActions ?? 0} (Overdue: ${kpiData?.overdueActions ?? 0})`,
      `- Outgoing Pass Rate: ${kpiData?.passRate ?? 100}% (Holds: ${kpiData?.holds ?? 0}, Returns: ${kpiData?.returns ?? 0})`,
    ];
    const blob = new Blob([reportLines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QMS_Executive_Report_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(isAr ? 'تم تصدير التقرير التنفيذي بنجاح' : 'Executive Report exported successfully');
  };

  const handleQuickLogDefect = async () => {
    try {
      setIsSubmittingQuick(true);
      await unifiedDefectLogApi.create({
        date: new Date().toISOString().slice(0, 10),
        productionLine: quickLine,
        defectType: quickDefectType,
        severity: quickSeverity,
        quantity: Number(quickQty) || 1,
        inspectedQuantity: Number(quickInspected) || 100,
        status: 'open',
        description: `${quickDefectType} logged via Executive Command Quick Entry on ${quickLine}`,
        partNumber: 'PN-IND-500',
        partId: 'PART-500',
        shift: 'Shift A',
        actionTaken: 'Immediate line containment & sorting',
        operatorName: 'Executive Command Inspector',
      });
      toast.success(
        isAr
          ? 'تم تسجيل دفعة الفحص وتحديث المؤشرات الحية فوراً!'
          : 'Production check logged & live KPIs updated!'
      );
      await fetchDashboardData();
      setActiveLens('overview');
    } catch {
      toast.error(isAr ? 'تعذر تسجيل الدفعة السريعة' : 'Failed to log quick entry');
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  const kpiCards = [
    {
      icon: Target,
      title: isAr ? 'سجلات العيوب' : 'Defect Records',
      val: `${kpiData?.totalRecords ?? 0}`,
      sub: isAr ? 'إجمالي البلاغات الموثقة' : 'Verified logs',
      col: '#00d2ff',
      route: '/defect-log',
      filters: {},
    },
    {
      icon: AlertTriangle,
      title: isAr ? 'إجمالي القطع المعيبة' : 'Total Defects',
      val: `${kpiData?.totalDefects ?? 0}`,
      sub: isAr ? `نسبة الفرز الأول ${executiveHealth.fpy}%` : `FPY ${executiveHealth.fpy}%`,
      col: '#FF6B35',
      route: '/defect-log',
      filters: {},
    },
    {
      icon: ShieldAlert,
      title: isAr ? 'معدل المليون (PPM)' : 'Process PPM',
      val: `${(kpiData?.currentPpm ?? 0).toLocaleString()}`,
      sub: `${executiveHealth.sigma} • Cpk ${executiveHealth.cpk}`,
      col: '#FFD600',
      route: '/process-ppm',
      filters: { recordType: 'process-ppm' },
    },
    {
      icon: CheckCircle,
      title: isAr ? 'تكلفة الجودة الرديئة COPQ' : 'COPQ Financial',
      val: `$${(kpiData?.totalCopq ?? 0).toLocaleString()}`,
      sub: isAr ? 'نموذج PAF المالي' : 'PAF Cost Model',
      col: '#00C853',
      route: '/defect-cost',
      filters: { recordType: 'defect-cost' },
    },
    {
      icon: Activity,
      title: isAr ? 'مرتجعات العملاء' : 'Customer Returns',
      val: `${kpiData?.returns ?? 0}`,
      sub: isAr ? `معدل القبول ${kpiData?.passRate ?? 100}%` : `Pass Rate ${kpiData?.passRate ?? 100}%`,
      col: '#8A2BE2',
      route: '/outgoing-quality',
      filters: { recordType: 'customer-return' },
    },
    {
      icon: ShieldAlert,
      title: isAr ? 'تقارير NCR المفتوحة' : 'Open NCRs',
      val: `${kpiData?.openNcrs ?? 0}`,
      sub: isAr ? 'حالات عدم مطابقة نشطة' : 'Active non-conformances',
      col: '#FF1744',
      route: '/quality/records/ncr',
      filters: { ncrStatus: 'open' },
    },
    {
      icon: Target,
      title: isAr ? 'إجراءات CAPA النشطة' : 'Open CAPAs',
      val: `${kpiData?.openCapas ?? 0}`,
      sub: isAr ? 'إجراءات تصحيحية ووقائية' : 'Corrective & preventive',
      col: '#FFB300',
      route: '/quality/records/capa',
      filters: { capaStatus: 'open' },
    },
    {
      icon: Activity,
      title: isAr ? 'تحقيقات 8D الجارية' : 'Open 8Ds',
      val: `${kpiData?.openEightD ?? 0}`,
      sub: isAr ? 'تحليل الجذور العميقة' : 'Root-cause teams',
      col: '#7C4DFF',
      route: '/quality/records/8d',
      filters: { eightDStatus: 'open' },
    },
    {
      icon: Calculator,
      title: isAr ? 'خطط التحسين المفتوحة' : 'Open Actions',
      val: `${kpiData?.openActions ?? 0}`,
      sub: isAr ? `متأخرة: ${kpiData?.overdueActions ?? 0}` : `Overdue: ${kpiData?.overdueActions ?? 0}`,
      col: '#26A69A',
      route: '/quality-command-center',
      filters: { actionStatus: 'open' },
    },
    {
      icon: AlertTriangle,
      title: isAr ? 'فحوصات مرفوضة' : 'Failed Checks',
      val: `${kpiData?.failedChecksWithoutDefect ?? 0}`,
      sub: isAr ? 'بانتظار التوثيق' : 'Pending defect linkage',
      col: '#FF9100',
      route: '/quality-execution-board',
      filters: {},
    },
  ];

  return (
    <div ref={sectionRef} dir={dir} className="space-y-7 pb-14">
      {/* Top Hero Command Header */}
      <div className="module-row relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0A192F]/90 via-[#0d1b2a]/90 to-[#06101e]/95 p-6 shadow-2xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#00d2ff]/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between lg:items-center gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00d2ff] via-[#0077ff] to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/25 text-white shrink-0">
              <Layers className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                  {isAr ? 'مركز القيادة التنفيذي للجودة 5.0' : 'Executive Quality Command 5.0'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {isAr ? 'متصل بالزمن الفعلي' : 'LIVE TELEMETRY'}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                <span>
                  {isAr
                    ? 'لوحة القيادة الموحدة لمؤشرات الأداء، تكلفة الجودة، التحكم الإحصائي، والذكاء الاصطناعي التنبؤي'
                    : 'Unified Industry 5.0 Intelligence Hub — SPC, Six Sigma, Closed-Loop CAPA & Predictive Telemetry'}
                </span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {isAr ? 'آخر تحديث:' : 'Last sync:'} {lastSyncedAt}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setAutoSync(!autoSync)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                autoSync
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-500/10'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoSync ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              {isAr ? (autoSync ? 'مزامنة تلقائية (نشط)' : 'مزامنة تلقائية (15ث)') : autoSync ? 'Auto-Sync ON' : 'Auto-Sync (15s)'}
            </button>

            <Button
              variant="outline"
              onClick={handleExportExecutiveReport}
              className="border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs rounded-xl"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-[#00d2ff]" />
              {isAr ? 'تصدير التقرير التنفيذي' : 'Export Brief'}
            </Button>

            <Button
              variant="outline"
              className="border-white/15 bg-[#0066CC]/20 hover:bg-[#0066CC]/30 text-white text-xs rounded-xl"
              disabled={isLoading}
              onClick={fetchDashboardData}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              {isAr ? 'تحديث الآن' : 'Sync Now'}
            </Button>
          </div>
        </div>

        {/* Fast Launch Super-Ribbon */}
        <div className="relative z-10 mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/superpowers"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02]"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isAr ? 'الترسانة الذكية الخارقة 5.0 (8 موديولات)' : 'Superpowers Suite 5.0 (8 Modules)'}</span>
            </Link>
            <Link
              to="/quality-control-tower"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
            >
              <Factory className="w-3.5 h-3.5" />
              <span>{isAr ? 'خريطة وبرج مراقبة المصنع' : '3D Factory Control Tower'}</span>
            </Link>
            <Link
              to="/ai/defect-prediction"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-200 font-bold text-xs transition-all"
            >
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>{isAr ? 'محرك التنبؤ بالعيوب AI' : 'AI Defect Prediction'}</span>
            </Link>
            <Link
              to="/spc"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-200 font-bold text-xs transition-all"
            >
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? 'الرقابة الإحصائية SPC & Cpk' : 'SPC & Capability'}</span>
            </Link>
            <Link
              to="/quality-shopfloor"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-bold text-xs transition-all"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#00d2ff]" />
              <span>{isAr ? 'إدخال صالة الإنتاج السريع' : 'Fast Shopfloor Entry'}</span>
            </Link>
          </div>

          {/* Interactive Analytical Lens Tabs */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
            {[
              { id: 'overview', label: isAr ? 'النظرة التنفيذية' : 'Overview', icon: Layers },
              { id: 'lines', label: isAr ? 'نبض خطوط الإنتاج' : 'Live Lines', icon: Factory },
              { id: 'ai_radar', label: isAr ? 'رادار المخاطر AI' : 'AI Risk Radar', icon: Sparkles },
              { id: 'quick_ops', label: isAr ? 'إدخال فوري' : 'Quick Log', icon: PlusCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeLens === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveLens(tab.id as typeof activeLens)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    active
                      ? 'bg-[#00A3E0] text-white shadow-md shadow-[#00A3E0]/25'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* World-Class Six Sigma & OEE Health Banner */}
      <div className="module-row grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-slate-900/80 to-slate-900/90 p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              {isAr ? 'مؤشر صحة الجودة الشامل (QHI)' : 'Quality Health Index (QHI)'}
            </span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{executiveHealth.qhi}%</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> ISO 9001:2015
            </span>
          </div>
          <div className="mt-3 w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(10, executiveHealth.qhi))}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            {isAr ? 'مؤشر مركب من القبول الأول، المطابقة، والتدقيق' : 'Composite of FPY, OQC Pass Rate & Audit Compliance'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-slate-900/80 to-slate-900/90 p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              {isAr ? 'نسبة القبول من المرة الأولى (FPY)' : 'First Pass Yield (FPY)'}
            </span>
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{executiveHealth.fpy}%</span>
            <span className="text-xs font-bold text-cyan-400">
              {isAr ? 'المستهدف: 98.5%' : 'Target: 98.5%'}
            </span>
          </div>
          <div className="mt-3 w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(10, executiveHealth.fpy))}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            {isAr
              ? `إجمالي العيوب المسجلة: ${kpiData?.totalDefects ?? 0} قطعة`
              : `Total logged defects: ${kpiData?.totalDefects ?? 0} units`}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-slate-900/80 to-slate-900/90 p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
              {isAr ? 'مستوى سيجما وقدرة العملية' : 'Six Sigma & Capability'}
            </span>
            <Gauge className="w-5 h-5 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-3xl font-black text-white">{executiveHealth.sigma}</span>
            <span className="px-2 py-0.5 rounded-md text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Cpk {executiveHealth.cpk}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-400">PPM: {(kpiData?.currentPpm ?? 0).toLocaleString()}</span>
            <span className="font-bold" style={{ color: executiveHealth.color }}>
              {executiveHealth.grade}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">
            {isAr ? 'محسوب تلقائياً وفق معايير IATF 16949' : 'Auto-computed per IATF 16949 / AIAG SPC'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/10 via-slate-900/80 to-slate-900/90 p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              {isAr ? 'الإغلاق الحلقي والتنفيذ' : 'Closed-Loop Execution'}
            </span>
            <Wrench className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {(kpiData?.openNcrs ?? 0) + (kpiData?.openCapas ?? 0) + (kpiData?.openEightD ?? 0)}
            </span>
            <span className="text-xs font-bold text-amber-400">
              {isAr ? 'ملفات مفتوحة (NCR/CAPA/8D)' : 'Active Escalations'}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-300">
            <span>NCR: {kpiData?.openNcrs ?? 0}</span>
            <span>CAPA: {kpiData?.openCapas ?? 0}</span>
            <span>8D: {kpiData?.openEightD ?? 0}</span>
            <span className="text-red-400 font-bold">
              {isAr ? `متأخر: ${kpiData?.overdueActions ?? 0}` : `Late: ${kpiData?.overdueActions ?? 0}`}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">
            {isAr ? 'معدل التزام خطط الفحص:' : 'Inspection Plan Compliance:'} {kpiData?.inspectionCompliance ?? 100}%
          </p>
        </div>
      </div>

      {/* Filters & Data Consistency Badge */}
      <div className="module-row space-y-3">
        <QualityDashboardFilterBar value={filters} onChange={setFilters} compact />
        <QualityAnalyticsConsistencyBadge dashboardName="Main Dashboard" snapshot={snapshot} compact />
      </div>

      {/* End-to-End Factory Value Stream Pipeline */}
      <div className="module-row">
        <FactoryQualityStream />
      </div>

      {/* 10 Interactive KPI Drill-down Cards */}
      <div className={`grid grid-cols-2 ${isLiteMode ? 'md:grid-cols-3' : 'md:grid-cols-5'} gap-4 module-row`}>
        {kpiCards
          .filter((k) => !isLiteMode || [isAr ? 'سجلات العيوب' : 'Defect Records', isAr ? 'إجمالي القطع المعيبة' : 'Total Defects', isAr ? 'تقارير NCR المفتوحة' : 'Open NCRs'].includes(k.title))
          .map((k, i) => (
            <Link
              key={i}
              to={buildDashboardDrilldownUrl(k.route, k.filters)}
              onClick={() => recordDashboardDrilldown(k.route, k.filters, k.title)}
            >
              <Card className="glass-panel border-white/10 relative overflow-hidden group hover:border-[#00d2ff]/40 hover:-translate-y-0.5 transition-all h-full">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full group-hover:scale-150 transition-transform" />
                <CardContent className="p-4 flex flex-col justify-between h-full relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                      <k.icon className="w-5 h-5" style={{ color: k.col }} />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">{k.title}</div>
                    <div className="text-2xl font-black text-white mt-0.5">{k.val}</div>
                    <div className="text-[10px] text-slate-400 mt-1 truncate">{k.sub}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
      </div>

      {/* LENS 1: EXECUTIVE OVERVIEW CHARTS */}
      {activeLens === 'overview' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 module-row">
            <Card className="glass-panel border-white/10 p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#FF6B35]" />
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#FF6B35]" />
                  {isAr ? 'اتجاه العيوب ومعدل الـ PPM الزمني' : 'Defect & PPM Temporal Trajectory'}
                </h2>
                <Link to="/defect-log" className="text-xs text-[#00d2ff] hover:underline flex items-center gap-1">
                  {isAr ? 'فتح السجل الكامل' : 'Full Log'} <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={ncrTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.35)" fontSize={10} />
                    <YAxis yAxisId="left" stroke="rgba(255,255,255,0.35)" fontSize={10} />
                    <YAxis yAxisId="right" orientation="right" stroke="rgba(0,210,255,0.45)" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px' }} />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="open"
                      stroke="#FF6B35"
                      strokeWidth={2}
                      fill="url(#colorOpen)"
                      name={isAr ? 'العيوب' : 'Defects'}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="ppm"
                      stroke="#00d2ff"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#00d2ff' }}
                      name="PPM"
                    />
                    <defs>
                      <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="glass-panel border-white/10 p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#00A3E0]" />
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#00A3E0]" />
                  {isAr ? 'توزيع العيوب حسب الفئة (Pareto Breakdown)' : 'Defect Category Distribution'}
                </h2>
                <button
                  onClick={() => setActiveLens('quick_ops')}
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> {isAr ? 'تسجيل دفعة سريعة' : 'Quick Log'}
                </button>
              </div>
              <div className="h-[260px] flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-1/2 h-full">
                  {spcDefectsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={spcDefectsData} innerRadius={52} outerRadius={84} paddingAngle={3} dataKey="value">
                          {spcDefectsData.map((e, i) => (
                            <Cell key={i} fill={e.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/10 rounded-2xl">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                      <p className="text-xs font-bold text-white">
                        {isAr ? 'صفر عيوب مسجلة في النطاق الحالي' : 'Zero Defects in Current Filter'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {isAr ? 'جميع خطوط الإنتاج تعمل ضمن الحدود القياسية' : 'All lines operating within nominal limits'}
                      </p>
                    </div>
                  )}
                </div>
                <div className="w-full sm:w-1/2 space-y-2.5">
                  {spcDefectsData.slice(0, 5).map((d, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className="text-xs text-gray-300 truncate">{d.name}</span>
                      </div>
                      <span className="text-sm font-black text-white ml-2">{d.value}</span>
                    </div>
                  ))}
                  {spcDefectsData.length === 0 && (
                    <button
                      onClick={() => setActiveLens('quick_ops')}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#00A3E0]/15 hover:bg-[#00A3E0]/25 border border-[#00A3E0]/30 text-xs font-bold text-[#00d2ff] transition-all"
                    >
                      {isAr ? '+ تسجيل فحص ميداني تجريبي' : '+ Log Production Check'}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {!isLiteMode && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 module-row">
              <Card className="lg:col-span-1 glass-panel border-white/10 p-6 flex flex-col justify-center gap-4">
                <KPIMini
                  title={isAr ? 'دفعات محجوزة (Holds)' : 'Outgoing Holds'}
                  value={`${kpiData?.holds ?? 0}`}
                  sub={isAr ? 'حجز الجودة قبل الشحن' : 'Quarantined lots'}
                  color="#E91E63"
                />
                <KPIMini
                  title={isAr ? 'مرتجعات العملاء (RMA)' : 'Customer Returns'}
                  value={`${kpiData?.returnQty ?? 0}`}
                  sub={isAr ? 'شكاوى ميدانية مرتبطة بـ 8D' : 'Field claims linked to 8D'}
                  color="#FF9100"
                />
                <KPIMini
                  title={isAr ? 'نسبة اجتياز الفحص النهائي' : 'Outgoing Pass Rate'}
                  value={`${kpiData?.passRate ?? 100}%`}
                  sub={isAr ? 'بوابة شهادة المطابقة CoC' : 'CoC Release Gate'}
                  color="#00C853"
                />
              </Card>

              <Card className="lg:col-span-2 glass-panel border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">
                    {isAr ? 'معدل العيوب لكل مليون (PPM) حسب خط الإنتاج' : 'PPM by Production Line'}
                  </h2>
                  <button
                    onClick={() => setActiveLens('lines')}
                    className="text-xs text-[#00d2ff] hover:underline flex items-center gap-1"
                  >
                    {isAr ? 'عرض مصفوفة الخطوط الحية' : 'Live Line Matrix'} <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="h-[210px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={auditScoresData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" fontSize={11} width={110} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px' }}
                      />
                      <Bar dataKey="compliance" fill="#00BCD4" radius={[0, 6, 6, 0]} name="PPM" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="lg:col-span-1 glass-panel border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">
                    {isAr ? 'أحدث شحنات الفحص النهائي' : 'Recent Outgoing Lots'}
                  </h2>
                  <Link to="/outgoing-quality" className="text-xs text-[#00d2ff] hover:underline">
                    OQC
                  </Link>
                </div>
                <div className="space-y-3">
                  {approvalBottlenecksData.slice(0, 4).map((b, i) => (
                    <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                      <div>
                        <span className="text-xs text-white font-bold block">{b.role}</span>
                        {b.customer && <span className="text-[10px] text-slate-400">{b.customer}</span>}
                      </div>
                      <Badge
                        className={
                          b.pending === 'pass'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : b.pending === 'hold'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-red-500/20 text-red-300'
                        }
                      >
                        {String(b.pending).toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                  {approvalBottlenecksData.length === 0 && (
                    <div className="text-center py-8 opacity-60">
                      <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                      <p className="text-xs text-slate-300">
                        {isAr ? 'لا توجد شحنات محجوزة حالياً' : 'All outgoing shipments cleared'}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {/* LENS 2: LIVE PRODUCTION LINES MATRIX */}
      {activeLens === 'lines' && (
        <div className="module-row space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white">
                {isAr ? 'مصفوفة خطوط الإنتاج الحية ومؤشرات القدرة (Line Telemetry Matrix)' : 'Live Production Lines & Capability Matrix'}
              </h2>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'مراقبة فورية لحالة كل خط إنتاجي مع مؤشر القبول الأول (FPY) والقدرة الإحصائية (Cpk)'
                  : 'Real-time operational health per line with FPY, PPM, and Cpk capability ratings'}
              </p>
            </div>
            <Link
              to="/quality-control-tower"
              className="px-4 py-2 rounded-xl bg-[#00A3E0] text-white text-xs font-bold hover:bg-[#008AC0] transition-all"
            >
              {isAr ? 'فتح التوأم الرقمي للمصنع 3D' : 'Open 3D Factory Twin'}
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productionLinesMatrix.map((line) => (
              <div
                key={line.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-[#00d2ff]/40 transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-xs ${
                        line.status === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : line.status === 'WARNING'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {line.id}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">{line.name}</h3>
                      <span className="text-[11px] text-slate-400">
                        {isAr ? `العيوب المسجلة: ${line.defects}` : `Logged Defects: ${line.defects}`}
                      </span>
                    </div>
                  </div>
                  <Badge
                    className={
                      line.status === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : line.status === 'WARNING'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }
                  >
                    {line.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">FPY</span>
                    <span className="text-base font-black text-emerald-400">{line.fpy}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">PPM</span>
                    <span className="text-base font-black text-white">{line.ppm.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Cpk Index</span>
                    <span className="text-base font-black text-cyan-400">{line.cPk}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, productionLine: line.name }));
                      setActiveLens('overview');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-200 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5 inline mr-1 text-[#00d2ff]" />
                    {isAr ? 'تصفية الداشبورد على هذا الخط' : 'Filter Dashboard to Line'}
                  </button>
                  <Link
                    to="/quality-shopfloor"
                    className="px-3 py-1.5 rounded-lg bg-[#00A3E0]/15 hover:bg-[#00A3E0]/25 text-xs font-bold text-[#00d2ff] transition-all"
                  >
                    {isAr ? 'تسجيل فحص على الخط' : 'Inspect Line'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LENS 3: AI RISK RADAR & CLOSED-LOOP SLA */}
      {activeLens === 'ai_radar' && (
        <div className="module-row grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#00d2ff]" />
                <h2 className="text-lg font-black text-white">
                  {isAr ? 'رادار المخاطر التنفيذي والتوصيات الاستباقية' : 'AI Executive Risk Radar & Preemptive Actions'}
                </h2>
              </div>
              <Link
                to="/superpowers"
                className="text-xs font-bold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-3 py-1.5 rounded-xl hover:bg-purple-500/25"
              >
                {isAr ? 'فتح آلة الزمن للتنبؤ بالعيوب (Pre-Cog)' : 'Launch AI Pre-Cog Time Machine'}
              </Link>
            </div>

            <div className="space-y-3">
              {(snapshot?.defectMetrics.topRisks || []).slice(0, 5).map((risk) => (
                <div
                  key={risk.id}
                  className="p-4 rounded-2xl bg-black/30 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-bold text-white">{risk.title}</span>
                      <Badge className="bg-red-500/20 text-red-300 text-[10px]">
                        Score {risk.riskScore} • {risk.slaStatus}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{risk.suggestedNextAction}</p>
                  </div>
                  <Link
                    to="/quality-command-center"
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white shrink-0"
                  >
                    {isAr ? 'معالجة فورية' : 'Resolve Now'}
                  </Link>
                </div>
              ))}

              {(!snapshot?.defectMetrics.topRisks || snapshot.defectMetrics.topRisks.length === 0) && (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h3 className="text-sm font-black text-white">
                    {isAr ? 'لا توجد مخاطر حرجة مفتوحة حالياً' : 'Zero Critical Unmitigated Risks'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {isAr
                      ? 'جميع السجلات ضمن اتفاقية مستوى الخدمة (SLA). يمكنك تشغيل محاكي التدقيق المفاجئ مع Dr. Klaus في الترسانة الخارقة.'
                      : 'All records are within SLA thresholds. You can run an ISO 9001 surprise audit battle in Superpowers Hub.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <h3 className="text-base font-black text-white">
              {isAr ? 'قمع الإغلاق الحلقي للجودة (Closed-Loop Funnel)' : 'Closed-Loop Lifecycle Funnel'}
            </h3>
            <div className="space-y-3">
              {[
                { label: isAr ? '1. سجلات العيوب الميدانية' : '1. Defect Logs', count: kpiData?.totalRecords ?? 0, route: '/defect-log', col: '#00d2ff' },
                { label: isAr ? '2. تقارير عدم المطابقة NCR' : '2. Active NCRs', count: kpiData?.openNcrs ?? 0, route: '/quality/records/ncr', col: '#FF6B35' },
                { label: isAr ? '3. الإجراءات التصحيحية CAPA' : '3. Active CAPAs', count: kpiData?.openCapas ?? 0, route: '/quality/records/capa', col: '#F59E0B' },
                { label: isAr ? '4. فرق حل المشكلات 8D' : '4. 8D Investigations', count: kpiData?.openEightD ?? 0, route: '/quality/records/8d', col: '#8B5CF6' },
                { label: isAr ? '5. إجراءات التحسين الفعالة' : '5. Improvement Actions', count: kpiData?.openActions ?? 0, route: '/quality-command-center', col: '#10B981' },
              ].map((step, idx) => (
                <Link
                  key={idx}
                  to={step.route}
                  className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5 hover:border-white/20 transition-all"
                >
                  <span className="text-xs font-bold text-slate-200">{step.label}</span>
                  <span className="text-sm font-black px-2.5 py-0.5 rounded-lg bg-white/5" style={{ color: step.col }}>
                    {step.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LENS 4: QUICK ENTRY & OPERATIONAL DISPATCHER */}
      {activeLens === 'quick_ops' && (
        <div className="module-row rounded-3xl border border-white/10 bg-white/5 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-white">
                {isAr ? 'وحدة الإدخال الفوري وتحديث المؤشرات الحية' : 'Instant Shopfloor Batch Logger & Live KPI Updater'}
              </h2>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'سجل دفعة فحص أو عيب مباشرة من لوحة القيادة ليتم حساب الـ PPM والـ FPY وتكلفة الـ COPQ فوراً'
                  : 'Log a live production inspection batch directly from the command center to immediately recompute PPM, FPY & COPQ'}
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/defect-log')} className="border-white/15 text-white text-xs">
              <FileSpreadsheet className="w-4 h-4 mr-1.5 text-[#00d2ff]" />
              {isAr ? 'فتح سجل العيوب التفصيلي' : 'Open Full Defect Registry'}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <label className="space-y-1.5 text-xs">
              <span className="text-slate-300 font-bold">{isAr ? 'خط الإنتاج' : 'Production Line'}</span>
              <input
                value={quickLine}
                onChange={(e) => setQuickLine(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-xs"
              />
            </label>
            <label className="space-y-1.5 text-xs">
              <span className="text-slate-300 font-bold">{isAr ? 'نوع العيب' : 'Defect Type'}</span>
              <input
                value={quickDefectType}
                onChange={(e) => setQuickDefectType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-xs"
              />
            </label>
            <label className="space-y-1.5 text-xs">
              <span className="text-slate-300 font-bold">{isAr ? 'درجة الخطورة' : 'Severity'}</span>
              <select
                value={quickSeverity}
                onChange={(e) => setQuickSeverity(e.target.value as 'minor' | 'major' | 'critical')}
                className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-xs"
              >
                <option value="minor">{isAr ? 'بسيط (Minor)' : 'Minor'}</option>
                <option value="major">{isAr ? 'رئيسي (Major)' : 'Major'}</option>
                <option value="critical">{isAr ? 'حرج (Critical)' : 'Critical'}</option>
              </select>
            </label>
            <label className="space-y-1.5 text-xs">
              <span className="text-slate-300 font-bold">{isAr ? 'الكمية المعيبة' : 'Defect Qty'}</span>
              <input
                type="number"
                min={1}
                value={quickQty}
                onChange={(e) => setQuickQty(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-xs"
              />
            </label>
            <label className="space-y-1.5 text-xs">
              <span className="text-slate-300 font-bold">{isAr ? 'الكمية المفحوصة' : 'Inspected Qty'}</span>
              <input
                type="number"
                min={1}
                value={quickInspected}
                onChange={(e) => setQuickInspected(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-xs"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              onClick={handleQuickLogDefect}
              disabled={isSubmittingQuick}
              className="bg-gradient-to-r from-[#00d2ff] to-[#0066CC] text-white font-bold text-xs px-6 py-2.5 rounded-xl"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              {isSubmittingQuick
                ? isAr
                  ? 'جارٍ الحفظ وتحديث المؤشرات...'
                  : 'Saving & Updating...'
                : isAr
                ? 'حفظ الفحص وتحديث الداشبورد فوراً'
                : 'Log Inspection & Update Live KPIs'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
