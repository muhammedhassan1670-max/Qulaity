import { useState, useMemo, useEffect } from 'react';
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
  Play,
  RotateCcw,
  Network,
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
  colIndex: number; // 0 to 5
  rowIndex: number; // 0 to 3
}

interface Cluster {
  id: string;
  titleAr: string;
  titleEn: string;
  phaseNumber: string;
  icon: LucideIcon;
  themeColor: string;
  glowColor: string;
  borderClass: string;
  bgGradient: string;
  subNodes: SubNode[];
}

interface RelationLink {
  id: string;
  source: string;
  target: string;
  labelAr: string;
  category: 'escalation' | 'flow' | 'governance' | 'feedback';
  color: string;
  sourceCol: number;
  sourceRow: number;
  targetCol: number;
  targetRow: number;
}

const CLUSTERS: Cluster[] = [
  {
    id: 'inbound',
    titleAr: 'التوريد وسلاسل الإمداد',
    titleEn: 'Supply Chain & IQC',
    phaseNumber: '01',
    icon: Truck,
    themeColor: '#10B981',
    glowColor: 'rgba(16,185,129,0.3)',
    borderClass: 'border-emerald-500/40 hover:border-emerald-400',
    bgGradient: 'from-emerald-950/30 via-emerald-900/10 to-transparent',
    subNodes: [
      {
        id: 'iqc',
        nameAr: 'فحص الوارد (IQC)',
        nameEn: 'Incoming Inspection',
        path: '/inspection',
        icon: Truck,
        badge: 'فحص خامات',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        descriptionAr: 'فحص مطابقة الشحنات والخامات الموردة مع خطط القبول',
        colIndex: 0,
        rowIndex: 0,
      },
      {
        id: 'suppliers',
        nameAr: 'سجل وتقييم الموردين',
        nameEn: 'Supplier Scorecard',
        path: '/supplier-quality',
        icon: Building,
        badge: 'تقييم أداء',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        descriptionAr: 'تحديث تقييم جودة الموردين آلياً بناءً على حيود الشحنات',
        colIndex: 0,
        rowIndex: 1,
      },
      {
        id: 'calibration',
        nameAr: 'معايرة أجهزة القياس',
        nameEn: 'Metrology & Calibration',
        path: '/calibration',
        icon: Wrench,
        badge: 'دقة القياس',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        descriptionAr: 'شهادات وصلاحية أدوات القياس لضمان دقة قرارات الفحص',
        colIndex: 0,
        rowIndex: 2,
      },
      {
        id: 'plans',
        nameAr: 'خطط الفحص والعينات',
        nameEn: 'AQL Inspection Plans',
        path: '/quality-inspection-plans',
        icon: Layers,
        badge: 'معايير AQL',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        descriptionAr: 'جداول سحب العينات ومستويات التفتيش المقبولة',
        colIndex: 0,
        rowIndex: 3,
      },
    ],
  },
  {
    id: 'shopfloor',
    titleAr: 'أرضية المصنع والتشغيل',
    titleEn: 'Shopfloor Execution',
    phaseNumber: '02',
    icon: Factory,
    themeColor: '#00A3E0',
    glowColor: 'rgba(0,163,224,0.3)',
    borderClass: 'border-sky-500/40 hover:border-sky-400',
    bgGradient: 'from-sky-950/30 via-sky-900/10 to-transparent',
    subNodes: [
      {
        id: 'daily_defects',
        nameAr: 'مسجل العيوب اللحظي',
        nameEn: 'Daily Defect Log',
        path: '/defect-log',
        icon: Activity,
        badge: 'تسجيل الوردية',
        badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
        descriptionAr: 'رصد العيوب الفوري من خطوط الإنتاج بالمايكروفون واللمس',
        colIndex: 1,
        rowIndex: 0,
      },
      {
        id: 'ipqc',
        nameAr: 'فحص أثناء التشغيل (IPQC)',
        nameEn: 'In-Process Quality',
        path: '/inspection',
        icon: CheckCircle2,
        badge: 'فحص مرحلي',
        badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
        descriptionAr: 'الفحص الدوري عند محطات التشغيل لمطابقة المواصفات',
        colIndex: 1,
        rowIndex: 1,
      },
      {
        id: 'shopfloor_fast',
        nameAr: 'محطة المشغل السريعة',
        nameEn: 'Fast Defect Station',
        path: '/quality-shopfloor',
        icon: Cpu,
        badge: 'محطة أندون',
        badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
        descriptionAr: 'واجهة مبسطة تعمل باللمس السريع عند ماكينات الإنتاج',
        colIndex: 1,
        rowIndex: 2,
      },
      {
        id: 'digital_twin',
        nameAr: 'خريطة المصنع والتوأم 3D',
        nameEn: 'Plant Control Tower',
        path: '/quality-control-tower',
        icon: Compass,
        badge: 'توأم 3D',
        badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
        descriptionAr: 'خريطة الخطوط التفاعلية وتحديد نقاط التوقف الحية',
        colIndex: 1,
        rowIndex: 3,
      },
    ],
  },
  {
    id: 'nonconformance',
    titleAr: 'عدم المطابقة والتصعيد',
    titleEn: 'Discrepancy & NCR',
    phaseNumber: '03',
    icon: AlertTriangle,
    themeColor: '#EF4444',
    glowColor: 'rgba(239,68,68,0.3)',
    borderClass: 'border-red-500/40 hover:border-red-400',
    bgGradient: 'from-red-950/30 via-red-900/10 to-transparent',
    subNodes: [
      {
        id: 'ncr',
        nameAr: 'تقارير عدم المطابقة (NCR)',
        nameEn: 'NCR Reports',
        path: '/quality/records/ncr',
        icon: AlertTriangle,
        badge: 'حجز المنتجات',
        badgeColor: 'bg-red-500/20 text-red-300 border border-red-500/30',
        descriptionAr: 'إصدار عدم المطابقة وحجز المنتجات وربطها برقم التشغيلة',
        colIndex: 2,
        rowIndex: 0,
      },
      {
        id: 'deviation',
        nameAr: 'تصاريح الحيود المؤقت',
        nameEn: 'Process Deviations',
        path: '/deviation',
        icon: FileWarning,
        badge: 'حيود معتمد',
        badgeColor: 'bg-red-500/20 text-red-300 border border-red-500/30',
        descriptionAr: 'تصاريح قبول الخامات أو التشغيل المشروط لحالات الطوارئ',
        colIndex: 2,
        rowIndex: 1,
      },
      {
        id: 'complaints',
        nameAr: 'شكاوى ومردودات العملاء',
        nameEn: 'Customer Complaints',
        path: '/complaints',
        icon: Building,
        badge: 'صوت العميل',
        badgeColor: 'bg-red-500/20 text-red-300 border border-red-500/30',
        descriptionAr: 'تتبع شكاوى ومردودات الجودة وربطها فوراً بـ NCR',
        colIndex: 2,
        rowIndex: 2,
      },
      {
        id: 'defect_cost',
        nameAr: 'تكلفة رداءة الجودة (COPQ)',
        nameEn: 'Cost of Poor Quality',
        path: '/defect-cost',
        icon: DollarSign,
        badge: 'حساب الخردة',
        badgeColor: 'bg-red-500/20 text-red-300 border border-red-500/30',
        descriptionAr: 'حساب مالي لخسائر العيوب وتكلفة إعادة التشغيل والمردودات',
        colIndex: 2,
        rowIndex: 3,
      },
    ],
  },
  {
    id: 'capa',
    titleAr: 'التحسين والحلول الجذرية',
    titleEn: 'Corrective Action & 8D',
    phaseNumber: '04',
    icon: Workflow,
    themeColor: '#8B5CF6',
    glowColor: 'rgba(139,92,246,0.3)',
    borderClass: 'border-purple-500/40 hover:border-purple-400',
    bgGradient: 'from-purple-950/30 via-purple-900/10 to-transparent',
    subNodes: [
      {
        id: 'capa_records',
        nameAr: 'خطط التحسين (CAPA)',
        nameEn: 'Corrective Actions',
        path: '/quality/records/capa',
        icon: CheckCheck,
        badge: 'حلول وقائية',
        badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
        descriptionAr: 'خطط تصحيحية ووقائية معتمدة لمنع تكرار المشكلة نهائياً',
        colIndex: 3,
        rowIndex: 0,
      },
      {
        id: 'eight_d',
        nameAr: 'منهجية حل المشكلات (8D)',
        nameEn: '8D Root Cause',
        path: '/quality/records/8d',
        icon: RefreshCw,
        badge: 'فرق حل 8D',
        badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
        descriptionAr: 'تحليل السبب الجذري عبر منهجية التخصصات الثمانية',
        colIndex: 3,
        rowIndex: 1,
      },
      {
        id: 'change_control',
        nameAr: 'إدارة التغيير الهندسي',
        nameEn: 'Engineering Change',
        path: '/change-control',
        icon: Sliders,
        badge: 'ضبط التغيير',
        badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
        descriptionAr: 'حوكمة وتتبع أي تعديل في التصميم أو الماكينات أو الخامات',
        colIndex: 3,
        rowIndex: 2,
      },
      {
        id: 'command_center',
        nameAr: 'غرفة عمليات الإجراءات',
        nameEn: 'Command Center',
        path: '/quality-command-center',
        icon: Workflow,
        badge: 'إغلاق الدورة',
        badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
        descriptionAr: 'متابعة سرعة وفاعلية إغلاق خطط التحسين والـ Action Items',
        colIndex: 3,
        rowIndex: 3,
      },
    ],
  },
  {
    id: 'prevention',
    titleAr: 'الهندسة والوقاية والتدقيق',
    titleEn: 'Engineering & Prevention',
    phaseNumber: '05',
    icon: ShieldCheck,
    themeColor: '#06B6D4',
    glowColor: 'rgba(6,182,212,0.3)',
    borderClass: 'border-cyan-500/40 hover:border-cyan-400',
    bgGradient: 'from-cyan-950/30 via-cyan-900/10 to-transparent',
    subNodes: [
      {
        id: 'fmea',
        nameAr: 'تحليل المخاطر (FMEA)',
        nameEn: 'Process & Design FMEA',
        path: '/fmea',
        icon: GitFork,
        badge: 'معامل RPN',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
        descriptionAr: 'تحديث مؤشرات أولوية المخاطر RPN تلقائياً بعد حل المشكلات',
        colIndex: 4,
        rowIndex: 0,
      },
      {
        id: 'control_plan',
        nameAr: 'خطة المراقبة والضبط',
        nameEn: 'Control Plan',
        path: '/control-plan',
        icon: Sliders,
        badge: 'معايير الضبط',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
        descriptionAr: 'محددات الجودة وعينات الفحص لكل مرحلة إنتاجية',
        colIndex: 4,
        rowIndex: 1,
      },
      {
        id: 'audits',
        nameAr: 'التدقيق الداخلي والطبقي',
        nameEn: 'LPA & ISO Audits',
        path: '/audit',
        icon: ShieldCheck,
        badge: 'تدقيق ISO',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
        descriptionAr: 'جداول تدقيق العمليات ومطابقة مواصفات ISO 9001 و IATF',
        colIndex: 4,
        rowIndex: 2,
      },
      {
        id: 'knowledge_base',
        nameAr: 'بنك الدروس المستفادة',
        nameEn: 'Lessons Learned KB',
        path: '/quality-knowledge-base',
        icon: BookOpen,
        badge: 'ذاكرة الجودة',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
        descriptionAr: 'توثيق الحلول كدروس مستفادة لمنع تكرار الخطأ مستقبلاً',
        colIndex: 4,
        rowIndex: 3,
      },
    ],
  },
  {
    id: 'intelligence',
    titleAr: 'التحكم الإحصائي والذكاء',
    titleEn: 'SPC & Industrial AI',
    phaseNumber: '06',
    icon: BarChart3,
    themeColor: '#EC4899',
    glowColor: 'rgba(236,72,153,0.3)',
    borderClass: 'border-pink-500/40 hover:border-pink-400',
    bgGradient: 'from-pink-950/30 via-pink-900/10 to-transparent',
    subNodes: [
      {
        id: 'spc',
        nameAr: 'خرائط التحكم (SPC)',
        nameEn: 'Statistical Process Control',
        path: '/spc',
        icon: BarChart3,
        badge: 'Cpk / Ppk',
        badgeColor: 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
        descriptionAr: 'تحليل الاستقرار الإحصائي ومؤشرات كفاءة العمليات',
        colIndex: 5,
        rowIndex: 0,
      },
      {
        id: 'ppm',
        nameAr: 'معدل المعيب (PPM)',
        nameEn: 'Process PPM Tracking',
        path: '/process-ppm',
        icon: TrendingUp,
        badge: 'أجزاء المليون',
        badgeColor: 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
        descriptionAr: 'تتبع معدل المعيب لكل مليون قطعة على مستوى المصنع',
        colIndex: 5,
        rowIndex: 1,
      },
      {
        id: 'outgoing',
        nameAr: 'إفراج الجودة النهائي (OQC)',
        nameEn: 'Outgoing Release',
        path: '/outgoing-quality',
        icon: CheckCircle2,
        badge: 'إفراج الشحن',
        badgeColor: 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
        descriptionAr: 'الفحص النهائي قبل الشحن لحماية العميل من أي عيوب',
        colIndex: 5,
        rowIndex: 2,
      },
      {
        id: 'ai_copilot',
        nameAr: 'ذكاء الجودة التنبؤي (AI)',
        nameEn: 'AI Intelligence & Voice',
        path: '/ai',
        icon: Sparkles,
        badge: 'مساعد AI',
        badgeColor: 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
        descriptionAr: 'التنبؤ بالأعطال والتعبئة الذكية للفحوصات بالصوت',
        colIndex: 5,
        rowIndex: 3,
      },
    ],
  },
];

const RELATIONSHIPS: RelationLink[] = [
  // 1. Inbound links
  { id: 'l1', source: 'iqc', target: 'suppliers', labelAr: 'يحدث تقييم المورد المباشر في سجل الموردين', category: 'feedback', color: '#10B981', sourceCol: 0, sourceRow: 0, targetCol: 0, targetRow: 1 },
  { id: 'l2', source: 'iqc', target: 'ncr', labelAr: 'يولد تقرير عدم مطابقة موردين فوراً', category: 'escalation', color: '#EF4444', sourceCol: 0, sourceRow: 0, targetCol: 2, targetRow: 0 },
  { id: 'l3', source: 'calibration', target: 'plans', labelAr: 'معايرة الأدوات تضمن مصداقية خطط الفحص', category: 'governance', color: '#10B981', sourceCol: 0, sourceRow: 2, targetCol: 0, targetRow: 3 },

  // 2. Shopfloor links
  { id: 'l4', source: 'daily_defects', target: 'ncr', labelAr: 'العيوب الحرجة والمتكررة تصعد لتقرير عدم مطابقة', category: 'escalation', color: '#EF4444', sourceCol: 1, sourceRow: 0, targetCol: 2, targetRow: 0 },
  { id: 'l5', source: 'daily_defects', target: 'spc', labelAr: 'تغذية لحظية لعينات خرائط التحكم الإحصائي', category: 'flow', color: '#00A3E0', sourceCol: 1, sourceRow: 0, targetCol: 5, targetRow: 0 },
  { id: 'l6', source: 'daily_defects', target: 'defect_cost', labelAr: 'حساب تكلفة الخردة وإعادة التشغيل (COPQ)', category: 'flow', color: '#EF4444', sourceCol: 1, sourceRow: 0, targetCol: 2, targetRow: 3 },
  { id: 'l7', source: 'ipqc', target: 'digital_twin', labelAr: 'نتائج الفحص المرحلي تُظهر حالة الخط بالتوأم 3D', category: 'flow', color: '#00A3E0', sourceCol: 1, sourceRow: 1, targetCol: 1, targetRow: 3 },

  // 3. Non-conformance links
  { id: 'l8', source: 'complaints', target: 'ncr', labelAr: 'شكاوى العملاء تفتح ملف NCR للتحقيق الفوري', category: 'escalation', color: '#EF4444', sourceCol: 2, sourceRow: 2, targetCol: 2, targetRow: 0 },
  { id: 'l9', source: 'ncr', target: 'capa_records', labelAr: 'الحالات الحرجة تتطلب إجراء تصحيحي ووقائي CAPA', category: 'escalation', color: '#8B5CF6', sourceCol: 2, sourceRow: 0, targetCol: 3, targetRow: 0 },
  { id: 'l10', source: 'ncr', target: 'eight_d', labelAr: 'العيوب المعقدة تُحال لفريق حل المشكلات 8D', category: 'escalation', color: '#8B5CF6', sourceCol: 2, sourceRow: 0, targetCol: 3, targetRow: 1 },

  // 4. CAPA / 8D closed loop
  { id: 'l11', source: 'capa_records', target: 'fmea', labelAr: 'الإجراء الناجح يخفض معامل المخاطر RPN في FMEA', category: 'governance', color: '#06B6D4', sourceCol: 3, sourceRow: 0, targetCol: 4, targetRow: 0 },
  { id: 'l12', source: 'eight_d', target: 'control_plan', labelAr: 'الحل الجذري يُحدّث خطة المراقبة لمنع التكرار', category: 'governance', color: '#06B6D4', sourceCol: 3, sourceRow: 1, targetCol: 4, targetRow: 1 },
  { id: 'l13', source: 'eight_d', target: 'knowledge_base', labelAr: 'توثيق الحل كدرس مستفاد للرجوع المستقبلي', category: 'governance', color: '#06B6D4', sourceCol: 3, sourceRow: 1, targetCol: 4, targetRow: 3 },
  { id: 'l14', source: 'control_plan', target: 'ipqc', labelAr: 'خطة المراقبة تحدد معايير ونقاط الفحص المرحلي', category: 'flow', color: '#00A3E0', sourceCol: 4, sourceRow: 1, targetCol: 1, targetRow: 1 },

  // 5. Intelligence & AI
  { id: 'l15', source: 'ai_copilot', target: 'daily_defects', labelAr: 'الذكاء الاصطناعي والتعبئة الصوتية لبيانات العيوب', category: 'flow', color: '#EC4899', sourceCol: 5, sourceRow: 3, targetCol: 1, targetRow: 0 },
  { id: 'l16', source: 'outgoing', target: 'complaints', labelAr: 'الإفراج النهائي يحمي العميل من وصول أي معيب', category: 'feedback', color: '#10B981', sourceCol: 5, sourceRow: 2, targetCol: 2, targetRow: 2 },
];

type SimulationType = 'none' | 'defect' | 'supplier' | 'prevention';

export function QualityEcosystemPortal() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'matrix' | 'radial'>('matrix');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSimulation, setActiveSimulation] = useState<SimulationType>('none');

  // Simulation timer to cycle or reset
  useEffect(() => {
    if (activeSimulation === 'none') return;
    const timer = setTimeout(() => {
      // Keep simulation on for 8 seconds then reset
      setActiveSimulation('none');
    }, 8000);
    return () => clearTimeout(timer);
  }, [activeSimulation]);

  // Determine active highlighted links based on hover OR simulation
  const highlightedLinks = useMemo(() => {
    if (activeSimulation === 'defect') {
      return new Set(['l4', 'l5', 'l6', 'l9', 'l10', 'l11']);
    }
    if (activeSimulation === 'supplier') {
      return new Set(['l1', 'l2', 'l10']);
    }
    if (activeSimulation === 'prevention') {
      return new Set(['l12', 'l13', 'l14', 'l5']);
    }
    if (hoveredNodeId) {
      const set = new Set<string>();
      RELATIONSHIPS.forEach((r) => {
        if (r.source === hoveredNodeId || r.target === hoveredNodeId) {
          set.add(r.id);
        }
      });
      return set;
    }
    return new Set<string>();
  }, [hoveredNodeId, activeSimulation]);

  // Connected node IDs
  const connectedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    if (hoveredNodeId) ids.add(hoveredNodeId);

    if (activeSimulation === 'defect') {
      ['daily_defects', 'ncr', 'capa_records', 'eight_d', 'fmea', 'spc'].forEach((id) => ids.add(id));
      return ids;
    }
    if (activeSimulation === 'supplier') {
      ['iqc', 'suppliers', 'ncr', 'eight_d'].forEach((id) => ids.add(id));
      return ids;
    }
    if (activeSimulation === 'prevention') {
      ['eight_d', 'control_plan', 'knowledge_base', 'ipqc', 'spc'].forEach((id) => ids.add(id));
      return ids;
    }

    highlightedLinks.forEach((linkId) => {
      const rel = RELATIONSHIPS.find((r) => r.id === linkId);
      if (rel) {
        ids.add(rel.source);
        ids.add(rel.target);
      }
    });
    return ids;
  }, [hoveredNodeId, activeSimulation, highlightedLinks]);

  // Find active node metadata
  const activeNode = useMemo(() => {
    if (!hoveredNodeId) return null;
    for (const cluster of CLUSTERS) {
      const found = cluster.subNodes.find((n) => n.id === hoveredNodeId);
      if (found) return { ...found, clusterTitle: cluster.titleAr, clusterColor: cluster.themeColor };
    }
    return null;
  }, [hoveredNodeId]);

  const activeRelationships = useMemo(() => {
    if (!hoveredNodeId) return [];
    return RELATIONSHIPS.filter(
      (r) => r.source === hoveredNodeId || r.target === hoveredNodeId
    );
  }, [hoveredNodeId]);

  const handleNodeClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="h-full max-h-full overflow-hidden flex flex-col select-none relative w-full text-white bg-[#05070d]">
      
      {/* 1. TOP INTERACTIVE COMMAND & SIMULATION BAR */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-2 border-b border-white/10 bg-black/60 backdrop-blur-xl shrink-0 z-30 gap-2">
        
        {/* Brand & Status */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0066CC] to-[#00A3E0] flex items-center justify-center shadow-[0_0_20px_rgba(0,163,224,0.4)]">
            <Network className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-black text-white tracking-wide">
                خريطة الترابط الرقمي للمنصة
              </h1>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#00A3E0]/20 text-[#8be3ff] border border-[#00A3E0]/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                CLOSED-LOOP ACTIVE
              </span>
            </div>
            <p className="text-[10px] text-white/50 hidden md:block">
              شبكة حية تربط 24 قسماً ومساراً صناعياً • خطوط الليزر تمثل تدفق البيانات الفعلي
            </p>
          </div>
        </div>

        {/* 2. LIVE SIMULATION BUTTONS (محاكاة سريان البيانات الحية) */}
        <div className="hidden lg:flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl">
          <span className="text-[10px] font-bold text-white/50 px-2 flex items-center gap-1">
            <Play className="w-3 h-3 text-[#00A3E0]" />
            <span>محاكاة المسار:</span>
          </span>

          <button
            type="button"
            onClick={() => setActiveSimulation(activeSimulation === 'defect' ? 'none' : 'defect')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
              activeSimulation === 'defect'
                ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] scale-105'
                : 'bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            <span>عيب إنتاج ➔ NCR</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSimulation(activeSimulation === 'supplier' ? 'none' : 'supplier')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
              activeSimulation === 'supplier'
                ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105'
                : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>رفض خامة ➔ تقييم مورد</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSimulation(activeSimulation === 'prevention' ? 'none' : 'prevention')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
              activeSimulation === 'prevention'
                ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-105'
                : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>إغلاق 8D ➔ خطة الضبط</span>
          </button>

          {activeSimulation !== 'none' && (
            <button
              type="button"
              onClick={() => setActiveSimulation('none')}
              className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
              title="إعادة التعيين"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Switcher & Search */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden xl:flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 focus-within:border-[#00A3E0]/60 transition-colors w-48">
            <Search className="w-3 h-3 text-white/40" />
            <input
              type="text"
              placeholder="تصفية وحدة أو قسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-[11px] text-white placeholder:text-white/30 w-full"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveView('matrix')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'matrix'
                  ? 'bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white shadow-md'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span className="hidden sm:inline">مسار التدفق</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('radial')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'radial'
                  ? 'bg-gradient-to-r from-[#8B5CF6] to-[#00A3E0] text-white shadow-md'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Compass className="w-3 h-3" />
              <span className="hidden sm:inline">الشبكة العصبية</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN INTERACTIVE CANVAS WITH SVG LASER CONNECTORS (ZERO SCROLL FIT) */}
      <div className="flex-1 overflow-hidden relative p-2 sm:p-3 bg-gradient-to-b from-[#060912] via-[#05070d] to-[#030408]">
        
        {/* Industrial Cyber Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#00A3E0_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.08] pointer-events-none" />

        {/* ========================================================================= */}
        {/* SVG LASER WIRES OVERLAY (DYNAMIC CONNECTIONS DRAWN ACROSS SCREEN) */}
        {/* ========================================================================= */}
        {activeView === 'matrix' && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="laserPulseCyan" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00A3E0" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#8be3ff" stopOpacity="1" />
                <stop offset="100%" stopColor="#00A3E0" stopOpacity="0.2" />
              </linearGradient>

              <linearGradient id="laserPulseRed" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#FCA5A5" stopOpacity="1" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0.3" />
              </linearGradient>

              <linearGradient id="laserPulseGold" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#FDE68A" stopOpacity="1" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.3" />
              </linearGradient>

              <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="0.6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Draw Relationship Lines */}
            {RELATIONSHIPS.map((rel) => {
              const isHighlighted = highlightedLinks.has(rel.id);
              
              // Normalized percentage positions for 6 columns and 4 rows
              // In RTL: col 0 is on the right! (x = 100% - (colIndex + 0.5) * 16.66%)
              // Or LTR/RTL normalized:
              const isRtl = document.documentElement.dir === 'rtl';
              
              const calcX = (col: number) => {
                if (isRtl) {
                  return 100 - ((col + 0.5) / 6) * 100;
                }
                return ((col + 0.5) / 6) * 100;
              };

              // Vertically: 4 rows centered between 14% and 90%
              const calcY = (row: number) => 16 + row * 22;

              const x1 = calcX(rel.sourceCol);
              const y1 = calcY(rel.sourceRow);
              const x2 = calcX(rel.targetCol);
              const y2 = calcY(rel.targetRow);

              // Control points for bezier curve
              const dx = (x2 - x1) * 0.5;
              const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

              return (
                <g key={rel.id}>
                  {/* Base background line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isHighlighted ? rel.color : 'rgba(255,255,255,0.06)'}
                    strokeWidth={isHighlighted ? '0.7' : '0.15'}
                    strokeDasharray={isHighlighted ? 'none' : '1, 1'}
                    filter={isHighlighted ? 'url(#glowFilter)' : 'none'}
                    className="transition-all duration-300"
                  />

                  {/* High voltage animated laser pulse along the line */}
                  {isHighlighted && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke={rel.color === '#EF4444' ? 'url(#laserPulseRed)' : rel.color === '#F59E0B' ? 'url(#laserPulseGold)' : 'url(#laserPulseCyan)'}
                      strokeWidth="1.1"
                      strokeDasharray="2, 6"
                      filter="url(#glowFilter)"
                      className="animate-laser-flow"
                      style={{ animationDuration: '1s' }}
                    />
                  )}
                </g>
              );
            })}
          </svg>
        )}

        {/* ========================================================================= */}
        {/* VIEW A: LIFECYCLE MATRIX PIPELINE (6 COLUMNS FULL SCREEN FIT) */}
        {/* ========================================================================= */}
        {activeView === 'matrix' && (
          <div className="h-full w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 relative z-10">
            {CLUSTERS.map((cluster) => (
              <div
                key={cluster.id}
                className={`flex flex-col h-full rounded-2xl border ${cluster.borderClass} bg-gradient-to-b ${cluster.bgGradient} p-2 sm:p-2.5 backdrop-blur-xl transition-all duration-300 relative overflow-hidden group`}
              >
                {/* Cluster Header */}
                <div className="flex items-center gap-2 pb-2 border-b border-white/10 shrink-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-lg"
                    style={{ backgroundColor: `${cluster.themeColor}20`, border: `1px solid ${cluster.themeColor}50` }}
                  >
                    <cluster.icon className="w-4 h-4" style={{ color: cluster.themeColor }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] text-white/40 block font-mono font-bold">
                      STAGE {cluster.phaseNumber}
                    </span>
                    <h2 className="text-xs font-black text-white truncate leading-tight">
                      {cluster.titleAr}
                    </h2>
                  </div>
                </div>

                {/* Sub-Nodes Stack in this Stage */}
                <div className="flex-1 flex flex-col justify-between gap-1.5 pt-2">
                  {cluster.subNodes.map((node) => {
                    const isHovered = hoveredNodeId === node.id;
                    const isConnected = connectedNodeIds.has(node.id);
                    const isDimmed = (hoveredNodeId || activeSimulation !== 'none') && !isConnected;
                    const matchesSearch = !searchQuery || node.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) || node.nameEn.toLowerCase().includes(searchQuery.toLowerCase());

                    return (
                      <motion.div
                        key={node.id}
                        whileHover={{ scale: 1.025, x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        onClick={() => handleNodeClick(node.path)}
                        className={`flex-1 flex flex-col justify-center p-2 rounded-xl border cursor-pointer transition-all duration-300 relative overflow-hidden ${
                          isHovered
                            ? 'bg-white/20 border-[#00A3E0] shadow-[0_0_25px_rgba(0,163,224,0.45)] ring-1 ring-[#00A3E0]'
                            : isConnected && (hoveredNodeId || activeSimulation !== 'none')
                            ? 'bg-white/15 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.35)] ring-1 ring-amber-400/50'
                            : isDimmed || !matchesSearch
                            ? 'opacity-25 border-white/5 bg-black/30'
                            : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/10'
                        }`}
                      >
                        {/* Port Connectors (Left & Right Wiring Sockets) */}
                        <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/30 border border-white/50" />
                        <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/30 border border-white/50" />

                        {/* Top Line of Node: Icon + Name */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div
                              className={`p-1 rounded-md transition-colors ${
                                isHovered ? 'bg-[#00A3E0]/20 text-[#00A3E0]' : isConnected ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-white/70'
                              }`}
                            >
                              <node.icon className="w-3.5 h-3.5 shrink-0" />
                            </div>
                            <span className="text-[11px] sm:text-xs font-bold truncate text-white leading-tight">
                              {node.nameAr}
                            </span>
                          </div>
                          <ArrowRight className="w-3 h-3 text-white/30 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                        </div>

                        {/* Badge / Subtitle */}
                        <div className="flex items-center justify-between mt-1 pt-0.5 border-t border-white/5">
                          <span className="text-[8.5px] text-white/40 truncate font-mono">
                            {node.nameEn}
                          </span>
                          {node.badge && (
                            <span
                              className={`text-[8px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                node.badgeColor || 'bg-white/10 text-white/70'
                              }`}
                            >
                              {node.badge}
                            </span>
                          )}
                        </div>

                        {/* Interactive Connection Dot */}
                        {isConnected && (hoveredNodeId || activeSimulation !== 'none') && (
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

        {/* ========================================================================= */}
        {/* VIEW B: RADIAL NEURAL CONSTELLATION */}
        {/* ========================================================================= */}
        {activeView === 'radial' && (
          <div className="h-full w-full flex items-center justify-center relative z-10 overflow-hidden">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 75, repeat: Infinity, ease: 'linear' }}
              className="absolute w-52 h-52 sm:w-64 sm:h-64 rounded-full border border-[#00A3E0]/30 border-dashed pointer-events-none"
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

            <div className="w-full h-full grid grid-cols-2 sm:grid-cols-3 gap-3 p-2 sm:p-4 relative">
              {CLUSTERS.map((cluster) => (
                <div
                  key={cluster.id}
                  className={`rounded-2xl border ${cluster.borderClass} bg-black/50 backdrop-blur-md p-2.5 flex flex-col justify-between`}
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

      {/* 3. DYNAMIC BOTTOM RELATIONSHIP INSPECTOR & HUD (ZERO SCROLL, NO FOOTER) */}
      <div className="border-t border-white/10 bg-black/90 backdrop-blur-xl px-3 sm:px-6 py-2 shrink-0 z-30 flex items-center justify-between text-xs">
        <AnimatePresence mode="wait">
          {activeSimulation !== 'none' ? (
            <motion.div
              key={activeSimulation}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-3 w-full"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
                <span className="font-bold text-amber-300 text-xs">
                  {activeSimulation === 'defect' && '⚡ مسار المحاكاة النشط: رصد عيب الإنتاج ➔ NCR ➔ CAPA ➔ FMEA'}
                  {activeSimulation === 'supplier' && '⚡ مسار المحاكاة النشط: خامات غير مطابقة ➔ خفض تقييم المورد ➔ NCR ➔ 8D'}
                  {activeSimulation === 'prevention' && '⚡ مسار المحاكاة النشط: إغلاق فريق 8D ➔ تحديث خطة الضبط ➔ الدروس المستفادة'}
                </span>
              </div>
              <span className="text-white/60 text-[11px] truncate hidden md:inline">
                الخطوط الليزرية المتوهجة بالأعلى تبين تدفق الإجراءات آلياً لمنع تكرار الخطأ
              </span>
              <button
                type="button"
                onClick={() => setActiveSimulation('none')}
                className="px-2.5 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold mr-auto rtl:mr-0 rtl:ml-auto shrink-0"
              >
                إيقاف المحاكاة
              </button>
            </motion.div>
          ) : activeNode ? (
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
                <span className="text-white/80 text-[11px] truncate">
                  {activeNode.descriptionAr}
                </span>
              </div>

              {/* Connected Relationships Badges */}
              {activeRelationships.length > 0 && (
                <div className="hidden md:flex items-center gap-2 mr-auto rtl:ml-auto">
                  <span className="text-[10px] text-amber-300 font-medium">
                    ⚡ {activeRelationships.length} مسارات متصلة:
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
                <span>دخول القسم الآن</span>
                <Maximize2 className="w-3 h-3" />
              </button>
            </motion.div>
          ) : (
            <div className="flex items-center justify-between w-full text-white/50 text-[11px]">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[#00A3E0] animate-pulse" />
                <span>
                  حرّك الماوس فوق أي قسم لرؤية شبكة خطوط الليزر ومسار تدفق البيانات • أو اضغط أزرار المحاكاة بالأعلى
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 01. توريد
                </span>
                <span className="flex items-center gap-1 text-sky-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> 02. تشغيل
                </span>
                <span className="flex items-center gap-1 text-red-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> 03. عدم مطابقة
                </span>
                <span className="flex items-center gap-1 text-purple-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> 04. حل جذري
                </span>
                <span className="flex items-center gap-1 text-cyan-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> 05. وقاية
                </span>
                <span className="flex items-center gap-1 text-pink-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400" /> 06. تحكم وذكاء
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
