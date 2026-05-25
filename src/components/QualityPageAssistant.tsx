import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Gauge,
  HelpCircle,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';

interface AssistantLink {
  labelEn: string;
  labelAr: string;
  path: string;
}

interface UserIntent extends AssistantLink {
  descriptionEn: string;
  descriptionAr: string;
}

interface PageGuide {
  match: (path: string) => boolean;
  stageEn: string;
  stageAr: string;
  titleEn: string;
  titleAr: string;
  purposeEn: string;
  purposeAr: string;
  primary: AssistantLink;
  next?: AssistantLink;
  related: AssistantLink[];
  icon: React.ComponentType<{ className?: string }>;
}

type PageMode = 'simple' | 'advanced';

const PAGE_MODE_STORAGE_KEY = 'qms_quality_page_mode_v1';

function readPageMode(): PageMode {
  try {
    return localStorage.getItem(PAGE_MODE_STORAGE_KEY) === 'advanced' ? 'advanced' : 'simple';
  } catch {
    return 'simple';
  }
}

const userIntentActions: UserIntent[] = [
  {
    labelEn: 'Register a defect',
    labelAr: 'أسجل عيب',
    descriptionEn: 'Use when you found a real defect and need it to update dashboards.',
    descriptionAr: 'لما تلاقي عيب حقيقي وعايزه يسمع في الداش بورد.',
    path: '/defect-log',
  },
  {
    labelEn: 'Fast shopfloor entry',
    labelAr: 'تسجيل سريع من الإنتاج',
    descriptionEn: 'Fast mobile-friendly entry for inspectors and operators.',
    descriptionAr: 'تسجيل سريع للمفتش أو المشغل بأقل كتابة.',
    path: '/quality-shopfloor',
  },
  {
    labelEn: 'Check today quality status',
    labelAr: 'أتابع حالة الجودة',
    descriptionEn: 'Open the management view for risks, open work, and data health.',
    descriptionAr: 'شوف المخاطر والمشاكل المفتوحة وصحة البيانات.',
    path: '/quality-command-center',
  },
  {
    labelEn: 'Track inspection execution',
    labelAr: 'أتابع تنفيذ الفحص',
    descriptionEn: 'Review inspection runs, failed checks, and missing evidence.',
    descriptionAr: 'تابع الفحوصات والفشل والأدلة الناقصة.',
    path: '/quality-execution-board',
  },
  {
    labelEn: 'Escalate a problem',
    labelAr: 'أصعّد مشكلة',
    descriptionEn: 'Start NCR/CAPA/8D when the issue needs controlled follow-up.',
    descriptionAr: 'ابدأ NCR/CAPA/8D لما المشكلة تحتاج متابعة رسمية.',
    path: '/quality/records/ncr',
  },
  {
    labelEn: 'Search similar cases',
    labelAr: 'أبحث عن حالة مشابهة',
    descriptionEn: 'Search defects, actions, knowledge, and linked records.',
    descriptionAr: 'ابحث في العيوب والإجراءات والدروس والعلاقات.',
    path: '/quality-search',
  },
  {
    labelEn: 'Configure the system',
    labelAr: 'أظبط النظام',
    descriptionEn: 'Open master data, forms, inspection plans, and setup checks.',
    descriptionAr: 'افتح البيانات الرئيسية والنماذج وخطط الفحص.',
    path: '/quality-home',
  },
];

const guides: PageGuide[] = [
  {
    match: (path) => path === '/quality-home' || path === '/quality/workspace',
    stageEn: 'Start',
    stageAr: 'البداية',
    titleEn: 'Quality Workspace',
    titleAr: 'مساحة عمل الجودة',
    purposeEn: 'Use this page to understand setup readiness, next steps, and the full quality journey.',
    purposeAr: 'استخدم الصفحة دي لفهم جاهزية النظام والخطوة التالية ورحلة الجودة كاملة.',
    primary: { labelEn: 'Log a defect', labelAr: 'سجل عيب', path: '/defect-log' },
    next: { labelEn: 'Review quality status', labelAr: 'راجع موقف الجودة', path: '/quality-command-center' },
    related: [
      { labelEn: 'Master Data', labelAr: 'البيانات الرئيسية', path: '/quality-master-data' },
      { labelEn: 'Form Designer', labelAr: 'مصمم النماذج', path: '/quality-form-designer' },
    ],
    icon: HelpCircle,
  },
  {
    match: (path) => path === '/defect-log' || path.startsWith('/quality/defect-log') || path.startsWith('/quality/defect-logs'),
    stageEn: '1. Record',
    stageAr: '1. التسجيل',
    titleEn: 'Defect Recorder',
    titleAr: 'تسجيل العيوب',
    purposeEn: 'Register real defects, route them to dashboards, and start the problem lifecycle when needed.',
    purposeAr: 'سجل العيب الحقيقي، اربطه بالداش بورد، وابدأ دورة المشكلة عند الحاجة.',
    primary: { labelEn: 'Quick shopfloor entry', labelAr: 'تسجيل سريع', path: '/quality-shopfloor' },
    next: { labelEn: 'Open NCR/CAPA/8D cycle', labelAr: 'افتح دورة المشكلة', path: '/quality/records/ncr' },
    related: [
      { labelEn: 'Process PPM', labelAr: 'Process PPM', path: '/process-ppm' },
      { labelEn: 'FMEA / RPN', labelAr: 'FMEA / RPN', path: '/fmea' },
      { labelEn: 'Prediction', labelAr: 'توقع العيوب', path: '/ai/defect-prediction' },
    ],
    icon: AlertCircle,
  },
  {
    match: (path) => path === '/quality-shopfloor' || path === '/quality/mobile-defect-entry',
    stageEn: '1. Record',
    stageAr: '1. التسجيل',
    titleEn: 'Shopfloor Entry',
    titleAr: 'تسجيل سريع من أرضية الإنتاج',
    purposeEn: 'Fast mobile-friendly defect entry for inspectors and operators.',
    purposeAr: 'تسجيل سريع مناسب للمفتش أو المشغل بأقل كتابة ممكنة.',
    primary: { labelEn: 'Open defect log', labelAr: 'افتح سجل العيوب', path: '/defect-log' },
    next: { labelEn: 'Track execution', labelAr: 'تابع التنفيذ', path: '/quality-execution-board' },
    related: [
      { labelEn: 'Inspection Plans', labelAr: 'خطط الفحص', path: '/quality-inspection-plans' },
      { labelEn: 'Command Center', labelAr: 'مركز القيادة', path: '/quality-command-center' },
    ],
    icon: Smartphone,
  },
  {
    match: (path) => path === '/quality-inspection-plans' || path === '/quality/inspection-plans',
    stageEn: 'Setup / Execute',
    stageAr: 'إعداد / تنفيذ',
    titleEn: 'Inspection Plans',
    titleAr: 'خطط الفحص',
    purposeEn: 'Define checksheets by model, line, part, or inspection point before execution.',
    purposeAr: 'جهز خطط الفحص حسب الموديل أو الخط أو الجزء أو نقطة الفحص.',
    primary: { labelEn: 'Start shopfloor inspection', labelAr: 'ابدأ فحص من الأرضية', path: '/quality-shopfloor' },
    next: { labelEn: 'View execution board', labelAr: 'تابع لوحة التنفيذ', path: '/quality-execution-board' },
    related: [
      { labelEn: 'Form Designer', labelAr: 'مصمم النماذج', path: '/quality-form-designer' },
      { labelEn: 'Master Data', labelAr: 'البيانات الرئيسية', path: '/quality-master-data' },
    ],
    icon: ClipboardCheck,
  },
  {
    match: (path) => path === '/quality-execution-board' || path === '/quality/execution-board',
    stageEn: '2. Monitor',
    stageAr: '2. المتابعة',
    titleEn: 'Execution Board',
    titleAr: 'متابعة تنفيذ الفحص',
    purposeEn: 'Monitor inspection runs, failed checks, missing evidence, and defects created from checks.',
    purposeAr: 'تابع الفحوصات، الفشل، الأدلة الناقصة، والعيوب الناتجة من الفحص.',
    primary: { labelEn: 'Create defect', labelAr: 'سجل عيب', path: '/defect-log' },
    next: { labelEn: 'Open layered audits', labelAr: 'افتح مراجعات المشرف', path: '/quality-audits' },
    related: [
      { labelEn: 'Command Center', labelAr: 'مركز القيادة', path: '/quality-command-center' },
      { labelEn: 'Search similar cases', labelAr: 'ابحث عن حالات مشابهة', path: '/quality-search' },
    ],
    icon: BarChart3,
  },
  {
    match: (path) => path === '/quality-audits' || path === '/quality/layered-audits',
    stageEn: '2. Verify',
    stageAr: '2. التحقق',
    titleEn: 'Layered Audits',
    titleAr: 'مراجعات المشرف',
    purposeEn: 'Audit process and inspection compliance, then create actions for real gaps.',
    purposeAr: 'راجع الالتزام بالفحص والعملية، وحول الفجوات الحقيقية لإجراءات.',
    primary: { labelEn: 'Open execution board', labelAr: 'لوحة تنفيذ الفحص', path: '/quality-execution-board' },
    next: { labelEn: 'Create action', labelAr: 'إجراء تحسين', path: '/quality-command-center' },
    related: [
      { labelEn: 'Knowledge Base', labelAr: 'الدروس المستفادة', path: '/quality-knowledge-base' },
      { labelEn: 'NCR', labelAr: 'NCR', path: '/quality/records/ncr' },
    ],
    icon: ShieldCheck,
  },
  {
    match: (path) => path.startsWith('/quality/records/ncr') || path === '/ncr',
    stageEn: '3. Problem Cycle',
    stageAr: '3. دورة المشكلة',
    titleEn: 'NCR',
    titleAr: 'NCR عدم مطابقة',
    purposeEn: 'Use NCR for verified nonconformities that need controlled review and escalation.',
    purposeAr: 'استخدم NCR لحالات عدم المطابقة التي تحتاج مراجعة وتصعيد منظم.',
    primary: { labelEn: 'Open defect records', labelAr: 'افتح العيوب', path: '/defect-log' },
    next: { labelEn: 'Create CAPA', labelAr: 'أنشئ CAPA', path: '/quality/records/capa' },
    related: [
      { labelEn: '8D', labelAr: '8D', path: '/quality/records/8d' },
      { labelEn: 'Actions', labelAr: 'إجراءات التحسين', path: '/quality-command-center' },
    ],
    icon: AlertCircle,
  },
  {
    match: (path) => path.startsWith('/quality/records/capa') || path === '/capa',
    stageEn: '3. Problem Cycle',
    stageAr: '3. دورة المشكلة',
    titleEn: 'CAPA',
    titleAr: 'CAPA إجراء تصحيحي',
    purposeEn: 'Plan corrective and preventive actions, then verify effectiveness from real records.',
    purposeAr: 'خطط الإجراء التصحيحي والوقائي ثم تحقق من الفاعلية من البيانات الحقيقية.',
    primary: { labelEn: 'Review actions', labelAr: 'راجع الإجراءات', path: '/quality-command-center' },
    next: { labelEn: 'Knowledge Base', labelAr: 'الدروس المستفادة', path: '/quality-knowledge-base' },
    related: [
      { labelEn: 'NCR', labelAr: 'NCR', path: '/quality/records/ncr' },
      { labelEn: '8D', labelAr: '8D', path: '/quality/records/8d' },
    ],
    icon: CheckCircle2,
  },
  {
    match: (path) => path.startsWith('/quality/records/8d') || path === '/8d',
    stageEn: '3. Problem Cycle',
    stageAr: '3. دورة المشكلة',
    titleEn: '8D',
    titleAr: '8D حل مشكلة',
    purposeEn: 'Use 8D for complex or repeated issues that need structured team problem solving.',
    purposeAr: 'استخدم 8D للمشاكل المتكررة أو المعقدة التي تحتاج حل جماعي منظم.',
    primary: { labelEn: 'Open CAPA', labelAr: 'افتح CAPA', path: '/quality/records/capa' },
    next: { labelEn: 'Verify effectiveness', labelAr: 'تحقق من الفاعلية', path: '/quality-command-center' },
    related: [
      { labelEn: 'Knowledge Base', labelAr: 'الدروس المستفادة', path: '/quality-knowledge-base' },
      { labelEn: 'Search', labelAr: 'بحث الجودة', path: '/quality-search' },
    ],
    icon: FileText,
  },
  {
    match: (path) => path === '/fmea' || path.startsWith('/fmea/') || path.startsWith('/quality/fmea'),
    stageEn: 'Risk',
    stageAr: 'المخاطر',
    titleEn: 'FMEA / RPN',
    titleAr: 'FMEA / RPN',
    purposeEn: 'Review risk signals from high-risk defects and keep prevention/detection controls current.',
    purposeAr: 'راجع إشارات المخاطر الناتجة من العيوب العالية وحدّث وسائل المنع والكشف.',
    primary: { labelEn: 'Log high-risk defect', labelAr: 'سجل عيب عالي الخطورة', path: '/defect-log' },
    next: { labelEn: 'Open control plan', labelAr: 'افتح Control Plan', path: '/control-plan' },
    related: [
      { labelEn: 'SPC', labelAr: 'SPC', path: '/spc' },
      { labelEn: 'CAPA', labelAr: 'CAPA', path: '/quality/records/capa' },
    ],
    icon: Gauge,
  },
  {
    match: (path) => path === '/quality-command-center' || path === '/quality/command-center',
    stageEn: '4. Decide',
    stageAr: '4. القرار',
    titleEn: 'Command Center',
    titleAr: 'مركز قيادة الجودة',
    purposeEn: 'Management view for open defects, risks, actions, effectiveness, data health, and backup.',
    purposeAr: 'منظر إداري للمشاكل المفتوحة والمخاطر والإجراءات والفاعلية وصحة البيانات.',
    primary: { labelEn: 'Log defect', labelAr: 'سجل عيب', path: '/defect-log' },
    next: { labelEn: 'Search quality memory', labelAr: 'ابحث في ذاكرة الجودة', path: '/quality-search' },
    related: [
      { labelEn: 'Reports', labelAr: 'التقارير', path: '/quality-dashboard' },
      { labelEn: 'Knowledge Base', labelAr: 'الدروس المستفادة', path: '/quality-knowledge-base' },
    ],
    icon: ShieldCheck,
  },
  {
    match: (path) => path === '/quality-search' || path === '/quality/intelligence-search',
    stageEn: 'Analyze',
    stageAr: 'تحليل',
    titleEn: 'Quality Search',
    titleAr: 'بحث الجودة',
    purposeEn: 'Search across real local defects, actions, NCR/CAPA/8D, knowledge, and relationships.',
    purposeAr: 'ابحث في العيوب والإجراءات وNCR/CAPA/8D والدروس والعلاقات من البيانات المحلية.',
    primary: { labelEn: 'Open command center', labelAr: 'مركز القيادة', path: '/quality-command-center' },
    next: { labelEn: 'Knowledge Base', labelAr: 'الدروس المستفادة', path: '/quality-knowledge-base' },
    related: [
      { labelEn: 'Prediction', labelAr: 'توقع العيوب', path: '/ai/defect-prediction' },
      { labelEn: 'Defect Log', labelAr: 'سجل العيوب', path: '/defect-log' },
    ],
    icon: Search,
  },
  {
    match: (path) => path === '/ai/defect-prediction' || path === '/defect-prediction',
    stageEn: 'Predict',
    stageAr: 'توقع',
    titleEn: 'Defect Prediction',
    titleAr: 'توقع العيوب',
    purposeEn: 'Train locally from imported Excel and registered defects, then use predictions as decision support.',
    purposeAr: 'درّب محليًا من الإكسيل والعيوب المسجلة واستخدم النتائج كمساعدة لاتخاذ القرار.',
    primary: { labelEn: 'Open defect records', labelAr: 'افتح العيوب المسجلة', path: '/defect-log' },
    next: { labelEn: 'Command Center', labelAr: 'مركز القيادة', path: '/quality-command-center' },
    related: [
      { labelEn: 'SPC', labelAr: 'SPC', path: '/spc' },
      { labelEn: 'FMEA / RPN', labelAr: 'FMEA / RPN', path: '/fmea' },
    ],
    icon: Brain,
  },
  {
    match: (path) => ['/quality-dashboard', '/process-ppm', '/defect-cost', '/outgoing-quality', '/spc'].some((route) => path === route),
    stageEn: 'Reports',
    stageAr: 'التقارير',
    titleEn: 'Quality Reports',
    titleAr: 'تقارير الجودة',
    purposeEn: 'Read real dashboard metrics and drill back to source records when something needs action.',
    purposeAr: 'اقرأ مؤشرات حقيقية وارجع للسجلات الأصلية لما يظهر شيء يحتاج متابعة.',
    primary: { labelEn: 'Open defect log', labelAr: 'افتح سجل العيوب', path: '/defect-log' },
    next: { labelEn: 'Command Center', labelAr: 'مركز القيادة', path: '/quality-command-center' },
    related: [
      { labelEn: 'Process PPM', labelAr: 'Process PPM', path: '/process-ppm' },
      { labelEn: 'COPQ', labelAr: 'COPQ', path: '/defect-cost' },
      { labelEn: 'Outgoing', labelAr: 'Outgoing', path: '/outgoing-quality' },
    ],
    icon: BarChart3,
  },
  {
    match: (path) => ['/quality-master-data', '/quality-form-designer'].some((route) => path === route || path.startsWith(`${route}/`)),
    stageEn: 'Setup',
    stageAr: 'الإعداد',
    titleEn: 'System Setup',
    titleAr: 'إعداد النظام',
    purposeEn: 'Configure master data, forms, lookups, formulas, and field behavior before daily use.',
    purposeAr: 'اضبط البيانات الرئيسية والنماذج والربط والمعادلات قبل الاستخدام اليومي.',
    primary: { labelEn: 'Open Quality Home', labelAr: 'افتح البداية', path: '/quality-home' },
    next: { labelEn: 'Start entry', labelAr: 'ابدأ تسجيل', path: '/defect-log' },
    related: [
      { labelEn: 'Inspection Plans', labelAr: 'خطط الفحص', path: '/quality-inspection-plans' },
      { labelEn: 'Shopfloor Entry', labelAr: 'تسجيل سريع', path: '/quality-shopfloor' },
    ],
    icon: Settings,
  },
];

function findGuide(path: string): PageGuide | null {
  return guides.find((guide) => guide.match(path)) || null;
}

export function QualityPageAssistant() {
  const location = useLocation();
  const language = useAppStore((state) => state.language);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pageMode, setPageMode] = useState<PageMode>(() => readPageMode());
  const [isIntentOpen, setIsIntentOpen] = useState(false);

  const guide = useMemo(() => findGuide(location.pathname), [location.pathname]);
  const actionItems = useMemo(() => {
    if (!guide) return [];

    const items = [guide.primary, ...(guide.next ? [guide.next] : []), ...guide.related];
    const uniqueItems = items.filter(
      (item, index, list) => list.findIndex((candidate) => candidate.path === item.path) === index,
    );

    return pageMode === 'simple' ? uniqueItems.slice(0, 3) : uniqueItems.slice(0, 6);
  }, [guide, pageMode]);

  useEffect(() => {
    try {
      localStorage.setItem(PAGE_MODE_STORAGE_KEY, pageMode);
      document.documentElement.dataset.qualityPageMode = pageMode;
    } catch {
      // Local UI preference only. Ignore storage errors so page guidance never blocks work.
    }
  }, [pageMode]);

  useEffect(() => {
    setIsIntentOpen(false);
  }, [location.pathname]);

  if (!guide) return null;

  const isArabic = language === 'ar';
  const Icon = guide.icon;
  const title = isArabic ? guide.titleAr : guide.titleEn;
  const stage = isArabic ? guide.stageAr : guide.stageEn;
  const purpose = isArabic ? guide.purposeAr : guide.purposeEn;
  const primary = isArabic ? guide.primary.labelAr : guide.primary.labelEn;
  const next = guide.next ? (isArabic ? guide.next.labelAr : guide.next.labelEn) : '';
  const modeLabel = pageMode === 'simple'
    ? (isArabic ? 'عرض بسيط' : 'Simple view')
    : (isArabic ? 'عرض متقدم' : 'Advanced view');

  return (
    <>
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <button
          type="button"
          onClick={() => setIsCollapsed((value) => !value)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-[#00A3E0]/15 dark:text-[#00A3E0]">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-blue-700 dark:border-[#00A3E0]/25 dark:bg-[#00A3E0]/10 dark:text-[#00A3E0]">
                {stage}
              </span>
              <h2 className="truncate text-sm font-black text-slate-900 dark:text-white">{title}</h2>
            </div>
            {!isCollapsed && (
              <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-white/50">{purpose}</p>
            )}
          </div>
        </button>

        <div className="flex flex-wrap gap-2">
          <div className="flex h-9 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-[11px] font-black dark:border-white/10 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setPageMode('simple')}
              className={`px-3 transition ${
                pageMode === 'simple'
                  ? 'bg-blue-600 text-white dark:bg-[#0066CC]'
                  : 'text-slate-500 hover:text-slate-900 dark:text-white/45 dark:hover:text-white'
              }`}
              aria-pressed={pageMode === 'simple'}
            >
              {isArabic ? 'بسيط' : 'Simple'}
            </button>
            <button
              type="button"
              onClick={() => setPageMode('advanced')}
              className={`px-3 transition ${
                pageMode === 'advanced'
                  ? 'bg-blue-600 text-white dark:bg-[#0066CC]'
                  : 'text-slate-500 hover:text-slate-900 dark:text-white/45 dark:hover:text-white'
              }`}
              aria-pressed={pageMode === 'advanced'}
            >
              {isArabic ? 'متقدم' : 'Advanced'}
            </button>
          </div>
          <Link
            to={guide.primary.path}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-3 text-xs font-black text-white transition hover:bg-blue-700 dark:bg-[#0066CC] dark:hover:bg-[#0052a3]"
          >
            {primary}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {guide.next && (
            <Link
              to={guide.next.path}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
            >
              {next}
            </Link>
          )}
        </div>
      </div>

      {!isCollapsed && actionItems.length > 0 && (
        <div className="mt-3 border-t border-slate-200 pt-3 dark:border-white/10">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">
              {isArabic ? 'ماذا أفعل هنا؟' : 'What should I do here?'}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500 dark:bg-white/5 dark:text-white/40">
              {modeLabel}
            </span>
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            {actionItems.map((item, index) => (
              <Link
                key={`${item.path}-${item.labelEn}`}
                to={item.path}
                className="group flex min-h-[54px] items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:border-[#00A3E0]/40 dark:hover:bg-[#00A3E0]/10 dark:hover:text-[#00A3E0]"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white text-[10px] font-black text-slate-500 shadow-sm dark:bg-black/20 dark:text-white/50">
                    {index + 1}
                  </span>
                  <span className="truncate">{isArabic ? item.labelAr : item.labelEn}</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {!isCollapsed && pageMode === 'advanced' && guide.related.length > actionItems.length && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">
            {isArabic ? 'روابط مرتبطة' : 'Related'}
          </span>
          {guide.related.map((item) => (
            <Link
              key={`${item.path}-${item.labelEn}`}
              to={item.path}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 transition hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:text-white/45 dark:hover:border-[#00A3E0]/40 dark:hover:text-[#00A3E0]"
            >
              {isArabic ? item.labelAr : item.labelEn}
            </Link>
          ))}
        </div>
      )}
    </section>

    {pageMode === 'simple' && (
      <>
      {isIntentOpen && (
        <div className="fixed inset-x-3 bottom-28 z-50 mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white/98 p-3 shadow-2xl shadow-slate-900/20 backdrop-blur dark:border-white/10 dark:bg-[#0f172a]/98 lg:bottom-24">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {isArabic ? 'أنا عايز أعمل إيه؟' : 'What do you want to do?'}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-white/45">
                {isArabic
                  ? 'اختار هدفك بلغة بسيطة، والنظام هيفتح الصفحة الصح.'
                  : 'Choose the plain-language goal and the system opens the right page.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsIntentOpen(false)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-500 transition hover:text-slate-900 dark:border-white/10 dark:text-white/45 dark:hover:text-white"
            >
              {isArabic ? 'إغلاق' : 'Close'}
            </button>
          </div>

          <div className="grid max-h-[55vh] gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
            {userIntentActions.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsIntentOpen(false)}
                className="group rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-blue-300 hover:bg-blue-50 dark:border-white/10 dark:bg-white/5 dark:hover:border-[#00A3E0]/40 dark:hover:bg-[#00A3E0]/10"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {isArabic ? item.labelAr : item.labelEn}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600 dark:group-hover:text-[#00A3E0]" />
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-white/45">
                  {isArabic ? item.descriptionAr : item.descriptionEn}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-2xl shadow-slate-900/15 backdrop-blur dark:border-white/10 dark:bg-[#0f172a]/95 lg:bottom-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 px-1">
            <p className="truncate text-xs font-black text-slate-900 dark:text-white">
              {isArabic ? 'الوضع البسيط' : 'Simple mode'}: {title}
            </p>
            <p className="truncate text-[11px] text-slate-500 dark:text-white/45">
              {isArabic ? 'اختار الإجراء الأساسي أو انتقل للخطوة التالية.' : 'Pick the main action or move to the next step.'}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsIntentOpen((value) => !value)}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-emerald-600 px-3 text-xs font-black text-white transition hover:bg-emerald-700"
              aria-expanded={isIntentOpen}
            >
              {isArabic ? 'أنا عايز...' : 'I want to...'}
            </button>
            <Link
              to={guide.primary.path}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 text-xs font-black text-white transition hover:bg-blue-700 dark:bg-[#0066CC] dark:hover:bg-[#0052a3]"
            >
              {primary}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            {guide.next && (
              <Link
                to={guide.next.path}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
              >
                {next}
              </Link>
            )}
            <button
              type="button"
              onClick={() => setPageMode('advanced')}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-500 transition hover:text-slate-900 dark:border-white/10 dark:text-white/45 dark:hover:text-white"
            >
              {isArabic ? 'متقدم' : 'Advanced'}
            </button>
          </div>
        </div>
      </div>
      </>
    )}
    </>
  );
}

export default QualityPageAssistant;
