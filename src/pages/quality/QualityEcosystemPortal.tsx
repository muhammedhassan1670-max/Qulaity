import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Building,
  Wrench,
  Layers,
  Factory,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileWarning,
  DollarSign,
  Workflow,
  CheckCheck,
  RefreshCw,
  Sliders,
  ShieldCheck,
  GitFork,
  BookOpen,
  BarChart3,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Maximize2,
  Compass,
  Cpu,
  Search,
  Zap,
  type LucideIcon,
} from 'lucide-react';

interface SubNode {
  id: string;
  nameAr: string;
  nameEn: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: string;
  descriptionAr: string;
}

interface Cluster {
  id: string;
  titleAr: string;
  titleEn: string;
  icon: LucideIcon;
  themeColor: string;
  glowClass: string;
  borderClass: string;
  bgGradient: string;
  subNodes: SubNode[];
}

interface RelationLink {
  source: string;
  target: string;
  labelAr: string;
  type: 'flow' | 'escalation' | 'governance' | 'feedback';
}

const CLUSTERS: Cluster[] = [
  {
    id: 'inbound',
    titleAr: 'سلاسل الإمداد والتوريد',
    titleEn: 'Supply Chain & IQC',
    icon: Truck,
    themeColor: '#10B981',
    glowClass: 'shadow-[0_0_20px_rgba(16,185,129,0.25)]',
    borderClass: 'border-emerald-500/40 hover:border-emerald-400',
    bgGradient: 'from-emerald-950/40 via-emerald-900/10 to-transparent',
    subNodes: [
      {
        id: 'iqc',
        nameAr: 'فحص الوارد (IQC)',
        nameEn: 'Incoming Inspection',
        path: '/inspection',
        icon: Truck,
        badge: 'فحص خامات',
        badgeColor: 'bg-emerald-500/20 text-emerald-300',
        descriptionAr: 'فحص ومطابقة الشحنات والخامات الموردة',
      },
      {
        id: 'suppliers',
        nameAr: 'سجل وتقييم الموردين',
        nameEn: 'Supplier Quality',
        path: '/supplier-quality',
        icon: Building,
        badge: 'أداء الموردين',
        badgeColor: 'bg-emerald-500/20 text-emerald-300',
        descriptionAr: 'تقييم جودة الموردين وحيود الشحنات',
      },
      {
        id: 'calibration',
        nameAr: 'معايرة أجهزة القياس',
        nameEn: 'Metrology & Calibration',
        path: '/calibration',
        icon: Wrench,
        badge: 'دقة القياس',
        badgeColor: 'bg-emerald-500/20 text-emerald-300',
        descriptionAr: 'شهادات وصلاحية أدوات القياس والفحص',
      },
      {
        id: 'plans',
        nameAr: 'خطط الفحص والعينات',
        nameEn: 'Inspection Plans',
        path: '/quality-inspection-plans',
        icon: Layers,
        badge: 'AQL Plans',
        badgeColor: 'bg-emerald-500/20 text-emerald-300',
        descriptionAr: 'خطط سحب العينات ومستويات القبول',
      },
    ],
  },
  {
    id: 'shopfloor',
    titleAr: 'أرضية المصنع والتشغيل',
    titleEn: 'Shopfloor Execution',
    icon: Factory,
    themeColor: '#00A3E0',
    glowClass: 'shadow-[0_0_20px_rgba(0,163,224,0.25)]',
    borderClass: 'border-sky-500/40 hover:border-sky-400',
    bgGradient: 'from-sky-950/40 via-sky-900/10 to-transparent',
    subNodes: [
      {
        id: 'daily_defects',
        nameAr: 'مسجل العيوب اللحظي',
        nameEn: 'Daily Defect Log',
        path: '/defect-log',
        icon: Activity,
        badge: 'العيوب اليومية',
        badgeColor: 'bg-sky-500/20 text-sky-300',
        descriptionAr: 'تسجيل العيوب الميداني بالمايكروفون والخطوط',
      },
      {
        id: 'ipqc',
        nameAr: 'فحص أثناء التشغيل',
        nameEn: 'In-Process Quality',
        path: '/inspection',
        icon: CheckCircle2,
        badge: 'فحص مرحلي',
        badgeColor: 'bg-sky-500/20 text-sky-300',
        descriptionAr: 'فحوصات الجودة الدورية أثناء الإنتاج',
      },
      {
        id: 'shopfloor_fast',
        nameAr: 'محطة المشغل السريعة',
        nameEn: 'Fast Defect Entry',
        path: '/quality-shopfloor',
        icon: Cpu,
        badge: 'تسجيل سريع',
        badgeColor: 'bg-sky-500/20 text-sky-300',
        descriptionAr: 'واجهة مخصصة لشاشات اللمس بجانب الماكينات',
      },
      {
        id: 'digital_twin',
        nameAr: 'التوأم وخريطة المصنع',
        nameEn: 'Plant Control Tower',
        path: '/quality-control-tower',
        icon: Compass,
        badge: 'توأم 3D',
        badgeColor: 'bg-sky-500/20 text-sky-300',
        descriptionAr: 'خريطة المصنع التفاعلية ونقاط أندون الحية',
      },
    ],
  },
  {
    id: 'nonconformance',
    titleAr: 'عدم المطابقة والتصعيد',
    titleEn: 'Discrepancy & NCR',
    icon: AlertTriangle,
    themeColor: '#EF4444',
    glowClass: 'shadow-[0_0_20px_rgba(239,68,68,0.25)]',
    borderClass: 'border-red-500/40 hover:border-red-400',
    bgGradient: 'from-red-950/40 via-red-900/10 to-transparent',
    subNodes: [
      {
        id: 'ncr',
        nameAr: 'تقارير عدم المطابقة',
        nameEn: 'NCR Management',
        path: '/quality/records/ncr',
        icon: AlertTriangle,
        badge: 'NCR مفتوح',
        badgeColor: 'bg-red-500/20 text-red-300',
        descriptionAr: 'حصر وحجز المنتجات والخامات غير المطابقة',
      },
      {
        id: 'deviation',
        nameAr: 'تصاريح الحيود المؤقت',
        nameEn: 'Process Deviations',
        path: '/deviation',
        icon: FileWarning,
        badge: 'حيود معتمد',
        badgeColor: 'bg-red-500/20 text-red-300',
        descriptionAr: 'تصاريح قبول الخامات أو التشغيل المشروط',
      },
      {
        id: 'complaints',
        nameAr: 'شكاوى ومردودات العملاء',
        nameEn: 'Customer Complaints',
        path: '/complaints',
        icon: Building,
        badge: 'صوت العميل',
        badgeColor: 'bg-red-500/20 text-red-300',
        descriptionAr: 'تتبع شكاوى وملاحظات الجودة الخارجية',
      },
      {
        id: 'defect_cost',
        nameAr: 'تكلفة رداءة الجودة',
        nameEn: 'COPQ Defect Cost',
        path: '/defect-cost',
        icon: DollarSign,
        badge: 'تكلفة الخردة',
        badgeColor: 'bg-red-500/20 text-red-300',
        descriptionAr: 'حساب خسائر العيوب وتكلفة إعادة التشغيل',
      },
    ],
  },
  {
    id: 'capa',
    titleAr: 'التحسين والحلول الجذرية',
    titleEn: 'Corrective Action & 8D',
    icon: Workflow,
    themeColor: '#8B5CF6',
    glowClass: 'shadow-[0_0_20px_rgba(139,92,246,0.25)]',
    borderClass: 'border-purple-500/40 hover:border-purple-400',
    bgGradient: 'from-purple-950/40 via-purple-900/10 to-transparent',
    subNodes: [
      {
        id: 'capa_records',
        nameAr: 'خطط التحسين (CAPA)',
        nameEn: 'Corrective Actions',
        path: '/quality/records/capa',
        icon: CheckCheck,
        badge: 'حلول وقائية',
        badgeColor: 'bg-purple-500/20 text-purple-300',
        descriptionAr: 'إجراءات تصحيحية وقائية لمنع تكرار المشكلة',
      },
      {
        id: 'eight_d',
        nameAr: 'منهجية حل المشكلات 8D',
        nameEn: '8D Problem Solving',
        path: '/quality/records/8d',
        icon: RefreshCw,
        badge: 'فريق 8D',
        badgeColor: 'bg-purple-500/20 text-purple-300',
        descriptionAr: 'تحليل الأسباب الجذرية عبر منهجية 8D الصناعية',
      },
      {
        id: 'change_control',
        nameAr: 'إدارة التغيير الهندسي',
        nameEn: 'Change Control',
        path: '/change-control',
        icon: Sliders,
        badge: 'توثيق التغيير',
        badgeColor: 'bg-purple-500/20 text-purple-300',
        descriptionAr: 'حوكمة وتتبع أي تعديل في خامات أو ماكينات',
      },
      {
        id: 'command_center',
        nameAr: 'غرفة عمليات الإجراءات',
        nameEn: 'Command Center',
        path: '/quality-command-center',
        icon: Workflow,
        badge: 'إغلاق الدورة',
        badgeColor: 'bg-purple-500/20 text-purple-300',
        descriptionAr: 'متابعة سرعة وفاعلية إغلاق خطط التحسين',
      },
    ],
  },
  {
    id: 'prevention',
    titleAr: 'الهندسة والوقاية والتدقيق',
    titleEn: 'Engineering & Prevention',
    icon: ShieldCheck,
    themeColor: '#06B6D4',
    glowClass: 'shadow-[0_0_20px_rgba(6,182,212,0.25)]',
    borderClass: 'border-cyan-500/40 hover:border-cyan-400',
    bgGradient: 'from-cyan-950/40 via-cyan-900/10 to-transparent',
    subNodes: [
      {
        id: 'fmea',
        nameAr: 'تحليل المخاطر (FMEA)',
        nameEn: 'Failure Mode & Effects',
        path: '/fmea',
        icon: GitFork,
        badge: 'مؤشر RPN',
        badgeColor: 'bg-cyan-500/20 text-cyan-300',
        descriptionAr: 'تحليل استباقي لمخاطر التصميم والعمليات',
      },
      {
        id: 'control_plan',
        nameAr: 'خطة المراقبة والضبط',
        nameEn: 'Control Plan',
        path: '/control-plan',
        icon: Sliders,
        badge: 'معايير الضبط',
        badgeColor: 'bg-cyan-500/20 text-cyan-300',
        descriptionAr: 'محددات الجودة لكل مرحلة إنتاجية',
      },
      {
        id: 'audits',
        nameAr: 'التدقيق الداخلي والطبقي',
        nameEn: 'Layered Audits & LPA',
        path: '/audit',
        icon: ShieldCheck,
        badge: 'التدقيق ISO',
        badgeColor: 'bg-cyan-500/20 text-cyan-300',
        descriptionAr: 'جداول تدقيق العمليات ومطابقة المواصفات',
      },
      {
        id: 'knowledge_base',
        nameAr: 'بنك الدروس المستفادة',
        nameEn: 'Lessons Learned KB',
        path: '/quality-knowledge-base',
        icon: BookOpen,
        badge: 'خبرات موثقة',
        badgeColor: 'bg-cyan-500/20 text-cyan-300',
        descriptionAr: 'ذاكرة الجودة المعرفية لتفادي تكرار الأخطاء',
      },
    ],
  },
  {
    id: 'intelligence',
    titleAr: 'التحكم الإحصائي والذكاء',
    titleEn: 'SPC & Industrial AI',
    icon: BarChart3,
    themeColor: '#EC4899',
    glowClass: 'shadow-[0_0_20px_rgba(236,72,153,0.25)]',
    borderClass: 'border-pink-500/40 hover:border-pink-400',
    bgGradient: 'from-pink-950/40 via-pink-900/10 to-transparent',
    subNodes: [
      {
        id: 'spc',
        nameAr: 'خرائط التحكم (SPC)',
        nameEn: 'Statistical Process Control',
        path: '/spc',
        icon: BarChart3,
        badge: 'Cpk / Ppk',
        badgeColor: 'bg-pink-500/20 text-pink-300',
        descriptionAr: 'مخططات X-bar/R والاستقرار الإحصائي للعمليات',
      },
      {
        id: 'ppm',
        nameAr: 'معدل الجودة (PPM)',
        nameEn: 'Process PPM Tracking',
        path: '/process-ppm',
        icon: TrendingUp,
        badge: 'أجزاء المليون',
        badgeColor: 'bg-pink-500/20 text-pink-300',
        descriptionAr: 'معدل المعيب لكل مليون قطعة على مستوى الخطوط',
      },
      {
        id: 'outgoing',
        nameAr: 'إفراج الجودة النهائي (OQC)',
        nameEn: 'Outgoing Release',
        path: '/outgoing-quality',
        icon: CheckCircle2,
        badge: 'تصريح الشحن',
        badgeColor: 'bg-pink-500/20 text-pink-300',
        descriptionAr: 'الفحص النهائي قبل الشحن للعملاء',
      },
      {
        id: 'ai_copilot',
        nameAr: 'ذكاء الجودة التنبؤي (AI)',
        nameEn: 'AI Intelligence & Voice',
        path: '/ai',
        icon: Sparkles,
        badge: 'مساعد AI',
        badgeColor: 'bg-pink-500/20 text-pink-300',
        descriptionAr: 'التنبؤ بالأعطال والتعبئة الذكية بالصوت',
      },
    ],
  },
];

const RELATIONSHIPS: RelationLink[] = [
  { source: 'iqc', target: 'suppliers', labelAr: 'يحدث تقييم المورد المباشر في سجل الموردين', type: 'feedback' },
  { source: 'iqc', target: 'ncr', labelAr: 'يولد تقرير عدم مطابقة موردين فوراً', type: 'escalation' },
  { source: 'daily_defects', target: 'ncr', labelAr: 'العيوب الحرجة والمتكررة تصعد كتقرير عدم مطابقة', type: 'escalation' },
  { source: 'daily_defects', target: 'spc', labelAr: 'تغذية لحظية لعينات خرائط التحكم الإحصائي', type: 'flow' },
  { source: 'daily_defects', target: 'defect_cost', labelAr: 'حساب تكلفة الخردة وإعادة التشغيل (COPQ)', type: 'flow' },
  { source: 'complaints', target: 'ncr', labelAr: 'شكاوى العملاء تفتح ملف NCR للتحقيق الفوري', type: 'escalation' },
  { source: 'ncr', target: 'capa_records', labelAr: 'الحالات الحرجة تتطلب إجراء تصحيحي ووقائي CAPA', type: 'escalation' },
  { source: 'ncr', target: 'eight_d', labelAr: 'العيوب المعقدة تُحال لفريق حل المشكلات 8D', type: 'escalation' },
  { source: 'capa_records', target: 'fmea', labelAr: 'الإجراء الناجح يخفض معامل المخاطر RPN في FMEA', type: 'governance' },
  { source: 'eight_d', target: 'control_plan', labelAr: 'الحل الجذري يُحدّث خطة المراقبة لمنع التكرار', type: 'governance' },
  { source: 'eight_d', target: 'knowledge_base', labelAr: 'توثيق الحل كدرس مستفاد للرجوع المستقبلي', type: 'governance' },
  { source: 'control_plan', target: 'ipqc', labelAr: 'خطة المراقبة تحدد معايير ونقاط الفحص المرحلي', type: 'flow' },
  { source: 'calibration', target: 'plans', labelAr: 'دقة أجهزة القياس تضمن مصداقية خطط الفحص', type: 'governance' },
  { source: 'ai_copilot', target: 'daily_defects', labelAr: 'الذكاء الاصطناعي والتعبئة الصوتية لبيانات العيوب', type: 'flow' },
  { source: 'outgoing', target: 'complaints', labelAr: 'الإفراج النهائي يحمي العميل من وصول أي معيب', type: 'feedback' },
];

export function QualityEcosystemPortal() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'matrix' | 'radial'>('matrix');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Find all nodes directly connected to hoveredNodeId
  const activeRelationships = useMemo(() => {
    if (!hoveredNodeId) return [];
    return RELATIONSHIPS.filter(
      (r) => r.source === hoveredNodeId || r.target === hoveredNodeId
    );
  }, [hoveredNodeId]);

  const connectedNodeIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const ids = new Set<string>();
    ids.add(hoveredNodeId);
    activeRelationships.forEach((r) => {
      ids.add(r.source);
      ids.add(r.target);
    });
    return ids;
  }, [hoveredNodeId, activeRelationships]);

  // Find active node metadata
  const activeNode = useMemo(() => {
    if (!hoveredNodeId) return null;
    for (const cluster of CLUSTERS) {
      const found = cluster.subNodes.find((n) => n.id === hoveredNodeId);
      if (found) return { ...found, clusterTitle: cluster.titleAr, clusterColor: cluster.themeColor };
    }
    return null;
  }, [hoveredNodeId]);

  const handleNodeClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="h-full max-h-full overflow-hidden flex flex-col select-none relative w-full text-white">
      {/* 1. TOP CONTROL BAR */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-2 border-b border-white/10 bg-black/40 backdrop-blur-md shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0066CC] to-[#00A3E0] flex items-center justify-center shadow-[0_0_15px_rgba(0,163,224,0.4)]">
            <Zap className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-black text-white tracking-wide flex items-center gap-1.5">
              <span>خريطة المنظومة المترابطة</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00A3E0]/20 text-[#8be3ff] border border-[#00A3E0]/40 hidden sm:inline">
                QMS 4.0 ECOSYSTEM
              </span>
            </h1>
            <p className="text-[10px] text-white/50 hidden md:block">
              جميع أقسام المنصة مترابطة برقم التشغيلة ودورة الجودة المغلقة • انقر على أي قسم للدخول الفوري
            </p>
          </div>
        </div>

        {/* Center / Search Filter */}
        <div className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-[#00A3E0]/60 transition-colors w-64">
          <Search className="w-3.5 h-3.5 text-white/40" />
          <input
            type="text"
            placeholder="ابحث عن قسم أو وحدة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/30 w-full"
          />
        </div>

        {/* View Mode Toggle Switch */}
        <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveView('matrix')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'matrix'
                ? 'bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white shadow-md'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">مصفوفة التدفق</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('radial')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'radial'
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#00A3E0] text-white shadow-md'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">الشبكة العصبية</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN INTERACTIVE CANVAS (ZERO SCROLL FIT) */}
      <div className="flex-1 overflow-hidden relative p-2 sm:p-4 bg-gradient-to-b from-[#080c14]/90 via-[#070a0f] to-[#04060a]">
        
        {/* Subtle Ambient Background Grids */}
        <div className="absolute inset-0 bg-[radial-gradient(#00A3E0_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.07] pointer-events-none" />

        {/* VIEW A: LIFECYCLE MATRIX PIPELINE */}
        {activeView === 'matrix' && (
          <div className="h-full w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3.5 relative z-10">
            {CLUSTERS.map((cluster, colIdx) => (
              <div
                key={cluster.id}
                className={`flex flex-col h-full rounded-2xl border ${cluster.borderClass} bg-gradient-to-b ${cluster.bgGradient} p-2 sm:p-2.5 backdrop-blur-md transition-all duration-300 relative overflow-hidden group`}
              >
                {/* Cluster Header */}
                <div className="flex items-center gap-2 pb-2 border-b border-white/10 shrink-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cluster.themeColor}25`, border: `1px solid ${cluster.themeColor}50` }}
                  >
                    <cluster.icon className="w-4 h-4" style={{ color: cluster.themeColor }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-white/40 block font-mono">
                      PHASE 0{colIdx + 1}
                    </span>
                    <h2 className="text-xs font-bold text-white truncate leading-tight">
                      {cluster.titleAr}
                    </h2>
                  </div>
                </div>

                {/* Sub-Nodes Stack in this Cluster */}
                <div className="flex-1 flex flex-col justify-around gap-1.5 pt-2">
                  {cluster.subNodes.map((node) => {
                    const isHovered = hoveredNodeId === node.id;
                    const isConnected = connectedNodeIds.has(node.id);
                    const isDimmed = hoveredNodeId && !isConnected;
                    const matchesSearch = !searchQuery || node.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) || node.nameEn.toLowerCase().includes(searchQuery.toLowerCase());

                    return (
                      <motion.div
                        key={node.id}
                        whileHover={{ scale: 1.02, x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        onClick={() => handleNodeClick(node.path)}
                        className={`flex-1 flex flex-col justify-center p-2 rounded-xl border cursor-pointer transition-all duration-200 relative overflow-hidden ${
                          isHovered
                            ? 'bg-white/15 border-[#00A3E0] shadow-[0_0_20px_rgba(0,163,224,0.35)] ring-1 ring-[#00A3E0]'
                            : isConnected && hoveredNodeId
                            ? 'bg-white/10 border-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.25)]'
                            : isDimmed || !matchesSearch
                            ? 'opacity-30 border-white/5 bg-black/20'
                            : 'bg-white/5 hover:bg-white/10 border-white/10'
                        }`}
                      >
                        {/* Top Line of Node: Icon + Name */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <node.icon
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isHovered ? 'text-[#00A3E0]' : isConnected && hoveredNodeId ? 'text-amber-400' : 'text-white/70'
                              }`}
                            />
                            <span className="text-[11px] sm:text-xs font-bold truncate text-white leading-tight">
                              {node.nameAr}
                            </span>
                          </div>
                          <ArrowRight className="w-3 h-3 text-white/30 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                        </div>

                        {/* Badge / Subtitle */}
                        <div className="flex items-center justify-between mt-1 pt-0.5">
                          <span className="text-[9px] text-white/40 truncate font-mono">
                            {node.nameEn}
                          </span>
                          {node.badge && (
                            <span
                              className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                node.badgeColor || 'bg-white/10 text-white/70'
                              }`}
                            >
                              {node.badge}
                            </span>
                          )}
                        </div>

                        {/* Interactive Connection Dot */}
                        {isConnected && hoveredNodeId && (
                          <span className="absolute top-1 left-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VIEW B: RADIAL NEURAL CONSTELLATION */}
        {activeView === 'radial' && (
          <div className="h-full w-full flex items-center justify-center relative z-10 overflow-hidden">
            {/* Center Core Node */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
              className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full border border-[#00A3E0]/30 border-dashed pointer-events-none"
            />
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-[#0066CC] to-[#00A3E0] p-1 shadow-[0_0_50px_rgba(0,163,224,0.5)] z-20 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-105 transition-transform"
              onClick={() => handleNodeClick('/quality-command-center')}
            >
              <div className="w-full h-full rounded-full bg-[#0a0f1d] flex flex-col items-center justify-center p-2">
                <Sparkles className="w-6 h-6 text-[#00A3E0] animate-pulse mb-1" />
                <span className="text-[10px] font-black uppercase text-white tracking-widest">
                  QMS 4.0
                </span>
                <span className="text-[8px] text-[#8be3ff]">نواة الجودة</span>
              </div>
            </motion.div>

            {/* Orbiting Radial Clusters */}
            <div className="w-full h-full grid grid-cols-2 sm:grid-cols-3 gap-3 p-2 sm:p-4 relative">
              {CLUSTERS.map((cluster) => (
                <div
                  key={cluster.id}
                  className={`rounded-2xl border ${cluster.borderClass} bg-black/40 backdrop-blur-md p-2.5 flex flex-col justify-between`}
                >
                  <div className="flex items-center gap-2 pb-1.5 border-b border-white/10">
                    <cluster.icon className="w-4 h-4" style={{ color: cluster.themeColor }} />
                    <span className="text-xs font-bold text-white truncate">{cluster.titleAr}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 py-1">
                    {cluster.subNodes.map((node) => {
                      const isHovered = hoveredNodeId === node.id;
                      const isConnected = connectedNodeIds.has(node.id);
                      return (
                        <div
                          key={node.id}
                          onMouseEnter={() => setHoveredNodeId(node.id)}
                          onMouseLeave={() => setHoveredNodeId(null)}
                          onClick={() => handleNodeClick(node.path)}
                          className={`p-1.5 rounded-lg border text-left rtl:text-right cursor-pointer transition-all ${
                            isHovered
                              ? 'bg-[#00A3E0]/20 border-[#00A3E0] shadow-[0_0_12px_rgba(0,163,224,0.4)]'
                              : isConnected && hoveredNodeId
                              ? 'bg-amber-500/20 border-amber-400'
                              : 'bg-white/5 hover:bg-white/10 border-white/5'
                          }`}
                        >
                          <span className="text-[10px] font-semibold text-white block truncate">
                            {node.nameAr}
                          </span>
                          <span className="text-[8px] text-white/40 block truncate">
                            {node.nameEn}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. DYNAMIC BOTTOM RELATIONSHIP INSPECTOR (NO FOOTER, ZERO SCROLL) */}
      <div className="border-t border-white/10 bg-black/80 backdrop-blur-lg px-3 sm:px-6 py-2 shrink-0 z-30 flex items-center justify-between text-xs">
        <AnimatePresence mode="wait">
          {activeNode ? (
            <motion.div
              key={activeNode.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-2 sm:gap-3 flex-wrap flex-1 min-w-0"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00A3E0] animate-ping" />
                <span className="font-bold text-[#8be3ff] text-xs">
                  {activeNode.nameAr} ({activeNode.clusterTitle})
                </span>
                <span className="text-white/40 text-[10px]">|</span>
                <span className="text-white/70 text-[11px] truncate">
                  {activeNode.descriptionAr}
                </span>
              </div>

              {/* Relationship Badges */}
              {activeRelationships.length > 0 && (
                <div className="hidden md:flex items-center gap-2 mr-auto rtl:ml-auto">
                  <span className="text-[10px] text-amber-300 font-medium">
                    ⚡ {activeRelationships.length} ارتباطات حية:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {activeRelationships.slice(0, 2).map((rel, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-200 text-[10px]"
                      >
                        {rel.labelAr}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleNodeClick(activeNode.path)}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white text-[11px] font-bold shadow hover:scale-105 active:scale-95 transition-all mr-auto rtl:mr-0 rtl:ml-auto shrink-0 flex items-center gap-1"
              >
                <span>دخول القسم</span>
                <Maximize2 className="w-3 h-3" />
              </button>
            </motion.div>
          ) : (
            <div className="flex items-center justify-between w-full text-white/50 text-[11px]">
              <div className="flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-[#00A3E0] animate-spin" style={{ animationDuration: '8s' }} />
                <span>
                  حرّك الماوس فوق أي قسم لرؤية شبكة ارتباطاته اللحظية • انقر على أي كارت للدخول المباشر
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> توريد
                </span>
                <span className="flex items-center gap-1 text-sky-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> تشغيل
                </span>
                <span className="flex items-center gap-1 text-red-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> عدم مطابقة
                </span>
                <span className="flex items-center gap-1 text-purple-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> حل جذري
                </span>
                <span className="flex items-center gap-1 text-cyan-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> وقاية
                </span>
                <span className="flex items-center gap-1 text-pink-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400" /> تحكم وذكاء
                </span>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default QualityEcosystemPortal;
