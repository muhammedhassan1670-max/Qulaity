import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Truck, 
  Cpu, 
  AlertOctagon, 
  PackageCheck, 
  Users, 
  ChevronRight, 
  ChevronLeft, 
  Activity, 
  Workflow
} from 'lucide-react';
import { useTranslation } from '../utils/translations';
import { unifiedNcrApi, unifiedDefectLogApi, unifiedCapaApi, unifiedEightDApi, unifiedComplaintsApi } from '../api/unified-api';
import { useAppStore } from '../stores/appStore';
import { hasPermission } from '../services/userService';

interface StageCard {
  id: string;
  stepNumber: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  countLabelEn: string;
  countLabelAr: string;
  count: number;
  permission?: string | string[];
  tools: Array<{ labelEn: string; labelAr: string; path: string; permission?: string | string[] }>;
}

export function FactoryQualityStream() {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const { user } = useAppStore();

  const [counts, setCounts] = useState({
    defectsToday: 0,
    openNcr: 0,
    activeCapa: 0,
    active8D: 0,
    complaints: 0
  });

  useEffect(() => {
    async function loadLiveMetrics() {
      try {
        const [defectsRes, ncrRes, capaRes, eightDRes, complaintsRes] = await Promise.all([
          unifiedDefectLogApi.getAll().catch(() => ({ data: [] })),
          unifiedNcrApi.getAll().catch(() => ({ data: [] })),
          unifiedCapaApi.getAll().catch(() => ({ data: [] })),
          unifiedEightDApi.getAll().catch(() => ({ data: [] })),
          unifiedComplaintsApi.getAll().catch(() => ({ data: [] })),
        ]);

        const todayStr = new Date().toISOString().split('T')[0];
        const defectsToday = (defectsRes.data || []).filter((d: any) => 
          (d.date || d.createdAt || '').startsWith(todayStr)
        ).length;

        const openNcr = (ncrRes.data || []).filter((n: any) => 
          n.status !== 'Closed' && n.status !== 'Resolved'
        ).length;

        const activeCapa = (capaRes.data || []).filter((c: any) => 
          c.status !== 'Closed' && c.status !== 'Completed'
        ).length;

        const active8D = (eightDRes.data || []).filter((e: any) => 
          e.status !== 'D8: Sign-off & Closure' && e.status !== 'Closed'
        ).length;

        const complaints = (complaintsRes.data || []).filter((c: any) => 
          c.status !== 'Closed'
        ).length;

        setCounts({
          defectsToday: defectsToday || (defectsRes.data || []).length,
          openNcr,
          activeCapa,
          active8D,
          complaints
        });
      } catch (err) {
        console.error('Failed to load quality stream metrics', err);
      }
    }

    loadLiveMetrics();
  }, []);

  const stages: StageCard[] = useMemo(() => [
    {
      id: 'incoming',
      stepNumber: '01',
      titleEn: 'Incoming & Supplier (IQC)',
      titleAr: '1. استلام الخامات والموردين',
      subtitleEn: 'Raw materials receipt, inspection & supplier ratings',
      subtitleAr: 'استلام المواد الخام وفحص الشحنات واعتماد الموردين',
      href: '/supplier-quality',
      icon: Truck,
      accentColor: 'from-emerald-500 to-teal-600',
      countLabelEn: 'Suppliers Monitored',
      countLabelAr: 'موردين تحت المتابعة',
      count: 12,
      permission: ['iqc.inspect', 'supplier.manage', 'iqc.plans'],
      tools: [
        { labelEn: 'Inspection Run', labelAr: 'فحص الشحنات', path: '/compliance/hub/inspection', permission: 'iqc.inspect' },
        { labelEn: 'Suppliers', labelAr: 'الموردين', path: '/supplier-quality', permission: 'supplier.manage' },
        { labelEn: 'Raw Material Plans', labelAr: 'خطط فحص الخام', path: '/quality-inspection-plans', permission: ['iqc.plans', 'iqc.inspect'] }
      ]
    },
    {
      id: 'inprocess',
      stepNumber: '02',
      titleEn: 'In-Process Quality (IPQC)',
      titleAr: '2. جودة التصنيع والعمليات',
      subtitleEn: 'Shopfloor logging, SPC charts & station audits',
      subtitleAr: 'تسجيل الورشة وكارتات السيطرة الإحصائية وفحص الخطوط',
      href: '/quality-shopfloor',
      icon: Cpu,
      accentColor: 'from-blue-500 to-cyan-600',
      countLabelEn: 'Defects Logged',
      countLabelAr: 'عيوب مسجلة اليوم',
      count: counts.defectsToday,
      permission: ['shopfloor.fast_entry', 'shopfloor.log_defect', 'spc.view', 'shopfloor.clearance'],
      tools: [
        { labelEn: 'Fast Entry', labelAr: 'تسجيل سريع', path: '/quality-shopfloor', permission: ['shopfloor.fast_entry', 'shopfloor.log_defect'] },
        { labelEn: 'Defect Log', labelAr: 'مسجل العيوب', path: '/defect-log', permission: 'shopfloor.log_defect' },
        { labelEn: 'Live SPC', labelAr: 'كارتات SPC', path: '/spc', permission: 'spc.view' },
        { labelEn: 'Checkpoints', labelAr: 'محطات الفحص', path: '/quality-execution-board', permission: ['shopfloor.clearance', 'shopfloor.log_defect'] }
      ]
    },
    {
      id: 'resolution',
      stepNumber: '03',
      titleEn: 'Non-Conformance & 8D Loop',
      titleAr: '3. عدم المطابقة وحل المشكلات',
      subtitleEn: 'Closed-loop escalation: NCR ➔ CAPA ➔ 8D root-cause',
      subtitleAr: 'دورة الحل الجذري المغلقة: NCR ➔ CAPA ➔ 8D',
      href: '/quality/records/ncr',
      icon: AlertOctagon,
      accentColor: 'from-amber-500 to-orange-600',
      countLabelEn: 'Active Issues',
      countLabelAr: 'حالات مفتوحة',
      count: counts.openNcr + counts.activeCapa + counts.active8D,
      permission: ['ncr.create', 'capa.manage', 'eight_d.solve', 'ncr.disposition', 'change.control'],
      tools: [
        { labelEn: 'NCR Reports', labelAr: 'تقارير NCR', path: '/quality/records/ncr', permission: 'ncr.create' },
        { labelEn: 'CAPA Actions', labelAr: 'إجراءات CAPA', path: '/quality/records/capa', permission: 'capa.manage' },
        { labelEn: '8D Problem Solving', labelAr: 'تقارير 8D', path: '/quality/records/8d', permission: 'eight_d.solve' },
        { labelEn: 'Deviations', labelAr: 'تصاريح الحيود', path: '/quality/records/deviation', permission: ['ncr.disposition', 'ncr.create'] }
      ]
    },
    {
      id: 'outgoing',
      stepNumber: '04',
      titleEn: 'Final & Outgoing Quality (OQC)',
      titleAr: '4. فحص وخروج المنتج النهائي',
      subtitleEn: 'Pre-shipment verification, COA & lot release',
      subtitleAr: 'فحص ما قبل الشحن وشهادات المطابقة والإفراج التام',
      href: '/outgoing-quality',
      icon: PackageCheck,
      accentColor: 'from-indigo-500 to-purple-600',
      countLabelEn: 'Ready for Release',
      countLabelAr: 'جاهز للإفراج',
      count: 8,
      permission: ['fqc.release', 'ppm.track'],
      tools: [
        { labelEn: 'Outgoing Check', labelAr: 'فحص الشحن', path: '/outgoing-quality', permission: 'fqc.release' },
        { labelEn: 'PPM Tracking', labelAr: 'معدل PPM', path: '/process-ppm', permission: 'ppm.track' }
      ]
    },
    {
      id: 'customer',
      stepNumber: '05',
      titleEn: 'Customer Complaints & Field',
      titleAr: '5. خدمة العميل ومتابعة الميدان',
      subtitleEn: 'Customer returns, RMA, satisfaction & warranty',
      subtitleAr: 'شكاوى العملاء، المرتجعات، وتحليل الضمان ورضا العميل',
      href: '/quality/records/complaints',
      icon: Users,
      accentColor: 'from-rose-500 to-pink-600',
      countLabelEn: 'Open Complaints',
      countLabelAr: 'شكاوى جارية',
      count: counts.complaints,
      permission: ['complaints.manage', 'copq.view'],
      tools: [
        { labelEn: 'Complaints Log', labelAr: 'سجل الشكاوى', path: '/quality/records/complaints', permission: 'complaints.manage' },
        { labelEn: 'COPQ Impact', labelAr: 'تكلفة العيوب COPQ', path: '/defect-cost', permission: ['copq.view', 'complaints.manage'] }
      ]
    }
  ], [counts]);

  const visibleStages = useMemo(() => {
    return stages
      .filter(stage => !stage.permission || hasPermission(user, stage.permission))
      .map(stage => ({
        ...stage,
        tools: stage.tools.filter(tool => !tool.permission || hasPermission(user, tool.permission))
      }));
  }, [stages, user]);

  if (visibleStages.length === 0) {
    return null;
  }

  return (
    <div className="w-full my-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--industrial-primary)] to-[var(--industrial-secondary)] flex items-center justify-center shadow-md text-white">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              {isAr ? 'شريان الجودة الصناعي المغلق' : 'Closed-Loop Quality Value Stream'}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {isAr ? 'متصل وحي' : 'LIVE PIPELINE'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr 
                ? 'تتبع دورة حياة جودة المنتج خطوة بخطوة من وصول المواد الخام حتى تسليم العميل'
                : 'End-to-end product quality flow from raw material receipt to customer delivery'}
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-2 text-xs">
          {hasPermission(user, 'spc.view') && (
            <Link 
              to="/spc" 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[var(--industrial-primary)]/50 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors font-bold text-slate-700 dark:text-slate-300"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-500" />
              <span>{isAr ? 'مختبر SPC' : 'SPC Lab'}</span>
            </Link>
          )}
          {hasPermission(user, ['command_center.view', 'capa.manage', 'admin.access']) && (
            <Link 
              to="/quality-command-center" 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[var(--industrial-primary)]/50 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors font-bold text-slate-700 dark:text-slate-300"
            >
              <Activity className="w-3.5 h-3.5 text-amber-500" />
              <span>{isAr ? 'مركز القيادة' : 'Command Center'}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Grid of Sequential Stations */}
      <div className={`grid grid-cols-1 md:grid-cols-${Math.min(visibleStages.length, 5)} gap-3.5 relative`}>
        {visibleStages.map((stage, idx) => {
          const Icon = stage.icon;
          const isLast = idx === stages.length - 1;

          return (
            <div 
              key={stage.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 backdrop-blur-md p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[var(--industrial-primary)]/40"
            >
              {/* Connector Arrow (Desktop Only) */}
              {!isLast && (
                <div 
                  className="hidden md:flex absolute -right-3.5 top-8 z-10 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-white/10 items-center justify-center text-slate-400 group-hover:text-[var(--industrial-primary)] transition-colors"
                  style={{ transform: isAr ? 'rotate(180deg)' : 'none' }}
                >
                  {isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </div>
              )}

              <div>
                {/* Top Row: Icon + Step Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stage.accentColor} flex items-center justify-center text-white shadow-md shadow-black/10 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-black text-slate-400 dark:text-white/30 tracking-wider">
                    {stage.stepNumber}
                  </span>
                </div>

                {/* Title & Subtitle */}
                <Link to={stage.href} className="block group-hover:text-[var(--industrial-primary)] transition-colors">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight mb-1">
                    {isAr ? stage.titleAr : stage.titleEn}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {isAr ? stage.subtitleAr : stage.subtitleEn}
                  </p>
                </Link>

                {/* Live Count Pill */}
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 mb-3">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    {isAr ? stage.countLabelAr : stage.countLabelEn}
                  </span>
                  <span className="text-xs font-black text-slate-800 dark:text-white px-2 py-0.5 rounded-md bg-white dark:bg-white/10 shadow-sm">
                    {stage.count}
                  </span>
                </div>
              </div>

              {/* Bottom Quick Action Chips */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex flex-wrap gap-1.5">
                {stage.tools.map((tool, tIdx) => (
                  <Link
                    key={tIdx}
                    to={tool.path}
                    className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-[var(--industrial-primary)]/10 hover:text-[var(--industrial-primary)] dark:hover:text-[var(--industrial-primary)] text-slate-600 dark:text-slate-400 transition-colors"
                  >
                    {isAr ? tool.labelAr : tool.labelEn}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
