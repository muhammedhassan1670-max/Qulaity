import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
  BookOpen,
  BarChart3,
  TrendingUp,
  Sparkles,
  ArrowLeft,
  Maximize2,
  Cpu,
  Search,
  Play,
  RotateCcw,
  Network,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Link2,
  type LucideIcon,
} from 'lucide-react';

interface BlueprintNode {
  id: string;
  nameAr: string;
  path: string;
  icon: LucideIcon;
  badgeAr: string;
  descriptionAr: string;
  phaseId: string;
  x: number;
  y: number;
}

interface PhaseZone {
  id: string;
  phaseNumber: string;
  titleAr: string;
  subtitleAr: string;
  color: string;
  borderColor: string;
  bgGradient: string;
  x: number;
  width: number;
  icon: LucideIcon;
}

interface CableRelation {
  id: string;
  source: string;
  target: string;
  labelAr: string;
  category: 'defect' | 'governance' | 'prevention' | 'supplier' | 'intelligence';
  color: string;
}

// =========================================================================
// 1. أبعاد الشبكة والمراحل الـ 6 (مرتبة من اليمين إلى اليسار RTL)
// =========================================================================

const NODE_WIDTH = 250;
const NODE_HEIGHT = 156;
const CANVAS_WIDTH = 1960;
const CANVAS_HEIGHT = 870;

const PHASES: PhaseZone[] = [
  {
    id: 'supply_chain',
    phaseNumber: '٠١',
    titleAr: 'سلاسل الإمداد والخامات',
    subtitleAr: 'الرقابة القبلية وتأهيل الموردين',
    color: '#10B981',
    borderColor: 'border-emerald-500/30',
    bgGradient: 'from-emerald-950/30 via-emerald-950/10 to-transparent',
    x: 1640,
    width: 280,
    icon: Truck,
  },
  {
    id: 'shopfloor',
    phaseNumber: '٠٢',
    titleAr: 'خطوط الإنتاج والتصنيع',
    subtitleAr: 'الرقابة المرحلية أثناء التشغيل',
    color: '#0EA5E9',
    borderColor: 'border-sky-500/30',
    bgGradient: 'from-sky-950/30 via-sky-950/10 to-transparent',
    x: 1320,
    width: 280,
    icon: Factory,
  },
  {
    id: 'nonconformance',
    phaseNumber: '٠٣',
    titleAr: 'الحجز وعدم المطابقة',
    subtitleAr: 'عزل المنتجات وحساب الخسائر',
    color: '#EF4444',
    borderColor: 'border-red-500/30',
    bgGradient: 'from-red-950/30 via-red-950/10 to-transparent',
    x: 1000,
    width: 280,
    icon: AlertTriangle,
  },
  {
    id: 'root_cause',
    phaseNumber: '٠٤',
    titleAr: 'الحل الجذري والتحسين',
    subtitleAr: 'منهجية 8D والإجراءات التصحيحية',
    color: '#8B5CF6',
    borderColor: 'border-purple-500/30',
    bgGradient: 'from-purple-950/30 via-purple-950/10 to-transparent',
    x: 680,
    width: 280,
    icon: Workflow,
  },
  {
    id: 'engineering',
    phaseNumber: '٠٥',
    titleAr: 'الوقاية والهندسة',
    subtitleAr: 'تحليل المخاطر وخطط الضبط',
    color: '#F59E0B',
    borderColor: 'border-amber-500/30',
    bgGradient: 'from-amber-950/30 via-amber-950/10 to-transparent',
    x: 360,
    width: 280,
    icon: ShieldCheck,
  },
  {
    id: 'intelligence',
    phaseNumber: '٠٦',
    titleAr: 'الرقابة الذكية و SPC',
    subtitleAr: 'الضبط الإحصائي والذكاء الاصطناعي',
    color: '#06B6D4',
    borderColor: 'border-cyan-500/30',
    bgGradient: 'from-cyan-950/30 via-cyan-950/10 to-transparent',
    x: 40,
    width: 280,
    icon: Cpu,
  },
];

const NODES: BlueprintNode[] = [
  // المرحلة 1: سلاسل الإمداد (العمود الأيمن x: 1655)
  {
    id: 'iqc',
    nameAr: 'فحص الواردات (IQC)',
    path: '/inspection',
    icon: Truck,
    badgeAr: 'فحص الخامات',
    descriptionAr: 'فحص مطابقة الشحنات والخامات الموردة مع خطط القبول وسحب العينات القياسية',
    phaseId: 'supply_chain',
    x: 1655,
    y: 110,
  },
  {
    id: 'suppliers',
    nameAr: 'سجل وتقييم الموردين',
    path: '/supplier-quality',
    icon: Building,
    badgeAr: 'تقييم الأداء',
    descriptionAr: 'تحديث تقييم جودة الموردين آلياً وربط نقاط الأداء بقرارات التوريد',
    phaseId: 'supply_chain',
    x: 1655,
    y: 295,
  },
  {
    id: 'calibration',
    nameAr: 'معايرة أجهزة القياس',
    path: '/calibration',
    icon: Wrench,
    badgeAr: 'دقة القياس',
    descriptionAr: 'شهادات وصلاحية أدوات القياس لضمان دقة الفحص وصحة قرارات القبول',
    phaseId: 'supply_chain',
    x: 1655,
    y: 480,
  },
  {
    id: 'inbound_audit',
    nameAr: 'تدقيق جودة الموردين',
    path: '/audits',
    icon: ShieldCheck,
    badgeAr: 'تأهيل المورد',
    descriptionAr: 'مراجعات ميدانية لمنشآت الموردين واعتماد خطوط إنتاجهم دورياً',
    phaseId: 'supply_chain',
    x: 1655,
    y: 665,
  },

  // المرحلة 2: خطوط الإنتاج (x: 1335)
  {
    id: 'daily_defects',
    nameAr: 'تسجيل العيوب اللحظي',
    path: '/shopfloor/defects',
    icon: Activity,
    badgeAr: 'صالة الإنتاج',
    descriptionAr: 'التقاط العيوب الفوري من المشغلين مع التصوير وربط الماكينة والوردية',
    phaseId: 'shopfloor',
    x: 1335,
    y: 110,
  },
  {
    id: 'inspection_plans',
    nameAr: 'خطط الفحص المرحلي',
    path: '/inspection-plans',
    icon: CheckCircle2,
    badgeAr: 'فحص التشغيل',
    descriptionAr: 'قوائم فحص الجودة أثناء التشغيل والتحقق الإلزامي من العينات الأولى',
    phaseId: 'shopfloor',
    x: 1335,
    y: 295,
  },
  {
    id: 'lpa',
    nameAr: 'التدقيق الطبقي (LPA)',
    path: '/audits/layered',
    icon: Layers,
    badgeAr: 'رقابة ميدانية',
    descriptionAr: 'تأكيد التزام المشغلين والمشرفين بالمعايير القياسية لمنع حيود العمليات',
    phaseId: 'shopfloor',
    x: 1335,
    y: 480,
  },
  {
    id: 'setup_readiness',
    nameAr: 'جاهزية الماكينات والبدء',
    path: '/setup-readiness',
    icon: Sliders,
    badgeAr: 'تصريح إنتاج',
    descriptionAr: 'اعتماد مطابقة المعايير الفنية وتصريح بدء الخطوط لتفادي الهدر الأولي',
    phaseId: 'shopfloor',
    x: 1335,
    y: 665,
  },

  // المرحلة 3: عدم المطابقة والحجز (x: 1015)
  {
    id: 'ncr',
    nameAr: 'تقارير عدم المطابقة (NCR)',
    path: '/quality/records/ncr',
    icon: AlertTriangle,
    badgeAr: 'حجز وعزل',
    descriptionAr: 'إصدار أوامر الحجز والفرز وتوثيق العيب وربطه برقم التشغيلة ومسار التصعيد',
    phaseId: 'nonconformance',
    x: 1015,
    y: 110,
  },
  {
    id: 'deviation',
    nameAr: 'تصاريح الحيود المؤقت',
    path: '/deviation',
    icon: FileWarning,
    badgeAr: 'قبول مشروط',
    descriptionAr: 'تصاريح قبول الخامات أو التشغيل المشروط لحالات الطوارئ المعتمدة',
    phaseId: 'nonconformance',
    x: 1015,
    y: 295,
  },
  {
    id: 'complaints',
    nameAr: 'شكاوى ومردودات العملاء',
    path: '/complaints',
    icon: Building,
    badgeAr: 'صوت العميل',
    descriptionAr: 'تتبع شكاوى ومردودات الجودة وتحليل أسبابها وربطها فورياً بـ NCR',
    phaseId: 'nonconformance',
    x: 1015,
    y: 480,
  },
  {
    id: 'defect_cost',
    nameAr: 'تكلفة رداءة الجودة',
    path: '/defect-cost',
    icon: DollarSign,
    badgeAr: 'حساب الخردة',
    descriptionAr: 'حساب مالي لخسائر العيوب وتكلفة الفرز وإعادة التشغيل وهدر المواد',
    phaseId: 'nonconformance',
    x: 1015,
    y: 665,
  },

  // المرحلة 4: الحل الجذري والتحسين (x: 695)
  {
    id: 'capa_records',
    nameAr: 'خطط التحسين (CAPA)',
    path: '/quality/records/capa',
    icon: CheckCheck,
    badgeAr: 'إجراء وقائي',
    descriptionAr: 'خطط تصحيحية ووقائية محكمة لمنع تكرار المشكلات عبر فرق العمل',
    phaseId: 'root_cause',
    x: 695,
    y: 110,
  },
  {
    id: 'eight_d',
    nameAr: 'منهجية حل المشكلات (8D)',
    path: '/quality/records/8d',
    icon: RefreshCw,
    badgeAr: 'تحليل جذري',
    descriptionAr: 'التحقيق المنهجي الشامل للسبب الجذري باستخدام عظمة السمكة و 5 لماذا',
    phaseId: 'root_cause',
    x: 695,
    y: 295,
  },
  {
    id: 'change_control',
    nameAr: 'إدارة التغيير الهندسي',
    path: '/change-control',
    icon: Sliders,
    badgeAr: 'ضبط التعديل',
    descriptionAr: 'حوكمة وتوثيق أي تعديل على القوالب أو الماكينات أو المواد الخام',
    phaseId: 'root_cause',
    x: 695,
    y: 480,
  },
  {
    id: 'command_center',
    nameAr: 'غرفة متابعة الإجراءات',
    path: '/quality-command-center',
    icon: Workflow,
    badgeAr: 'متابعة الإغلاق',
    descriptionAr: 'مركز قيادة فوري لمتابعة المهام المعلقة وسرعة إنجاز خطط التحسين',
    phaseId: 'root_cause',
    x: 695,
    y: 665,
  },

  // المرحلة 5: الوقاية والهندسة (x: 375)
  {
    id: 'fmea',
    nameAr: 'تحليل المخاطر (FMEA)',
    path: '/fmea',
    icon: ShieldCheck,
    badgeAr: 'مصفوفة المخاطر',
    descriptionAr: 'تقييم درجات الشدة والتكرار والكشف لمنع الفشل المحتمل قبل وقوعه',
    phaseId: 'engineering',
    x: 375,
    y: 110,
  },
  {
    id: 'control_plan',
    nameAr: 'خطة المراقبة والضبط',
    path: '/control-plan',
    icon: Sliders,
    badgeAr: 'ضبط المعايير',
    descriptionAr: 'توثيق مواصفات الفحص وطرق القياس والحدود الحرجة لكل مرحلة تصنيع',
    phaseId: 'engineering',
    x: 375,
    y: 295,
  },
  {
    id: 'knowledge_base',
    nameAr: 'بنك المعرفة والدروس',
    path: '/quality/library',
    icon: BookOpen,
    badgeAr: 'الدروس المستفادة',
    descriptionAr: 'مستودع الخبرات التراكمية وسوابق الحلول لتفادي تكرار الأخطاء السابقة',
    phaseId: 'engineering',
    x: 375,
    y: 480,
  },
  {
    id: 'form_designer',
    nameAr: 'مصمم النماذج الذكية',
    path: '/forms/designer',
    icon: Layers,
    badgeAr: 'أتمتة الفحص',
    descriptionAr: 'بناء وتخصيص استمارات الجودة الميدانية وربطها بالمحطات والماكينات',
    phaseId: 'engineering',
    x: 375,
    y: 665,
  },

  // المرحلة 6: الرقابة الذكية و SPC (العمود الأيسر x: 55)
  {
    id: 'spc',
    nameAr: 'الضبط الإحصائي (SPC)',
    path: '/spc',
    icon: TrendingUp,
    badgeAr: 'خرائط التحكم',
    descriptionAr: 'خرائط التحكم الإحصائية وحساب مؤشرات القدرة للكشف المبكر عن الحيود',
    phaseId: 'intelligence',
    x: 55,
    y: 110,
  },
  {
    id: 'control_tower',
    nameAr: 'برج المراقبة المركزي',
    path: '/quality/control-tower',
    icon: BarChart3,
    badgeAr: 'غرفة القيادة',
    descriptionAr: 'رؤية مركزية موحدة لكافة مؤشرات الجودة ومقارنة الخطوط ومستويات الهدر',
    phaseId: 'intelligence',
    x: 55,
    y: 295,
  },
  {
    id: 'ai_copilot',
    nameAr: 'مساعد الجودة الذكي',
    path: '/ai-intelligence',
    icon: Sparkles,
    badgeAr: 'الذكاء الاصطناعي',
    descriptionAr: 'تحليل أنماط العيوب واقتراح الأسباب الجذرية وصياغة التقارير آلياً',
    phaseId: 'intelligence',
    x: 55,
    y: 480,
  },
  {
    id: 'audits',
    nameAr: 'التدقيق والمراجعات الشاملة',
    path: '/audits',
    icon: ShieldCheck,
    badgeAr: 'مطابقة النظم',
    descriptionAr: 'جدولة ومتابعة تدقيقات الجودة الشاملة وتوثيق الملاحظات وإغلاقها',
    phaseId: 'intelligence',
    x: 55,
    y: 665,
  },
];

// =========================================================================
// 2. شبكة العلاقات وخطوط الربط بين الأقسام
// =========================================================================

const CABLES: CableRelation[] = [
  // مسار العيوب والتصعيد
  { id: 'c1', source: 'daily_defects', target: 'ncr', labelAr: 'تصعيد عيب حرج إلى تقرير عدم مطابقة', category: 'defect', color: '#EF4444' },
  { id: 'c2', source: 'daily_defects', target: 'spc', labelAr: 'تغذية القراءات في خرائط الضبط الإحصائي', category: 'intelligence', color: '#0EA5E9' },
  { id: 'c3', source: 'ncr', target: 'capa_records', labelAr: 'إصدار خطة تصحيحية ووقائية', category: 'defect', color: '#EF4444' },
  { id: 'c4', source: 'ncr', target: 'eight_d', labelAr: 'تفعيل منهجية التحليل الجذري 8D', category: 'defect', color: '#8B5CF6' },
  { id: 'c5', source: 'ncr', target: 'defect_cost', labelAr: 'احتساب تكلفة الخردة والفرز', category: 'defect', color: '#EF4444' },
  
  // مسار الموردين والواردات
  { id: 'c6', source: 'iqc', target: 'suppliers', labelAr: 'تحديث تقييم المورد آلياً', category: 'supplier', color: '#10B981' },
  { id: 'c7', source: 'iqc', target: 'ncr', labelAr: 'حجز شحنة خامات غير مطابقة', category: 'supplier', color: '#F59E0B' },
  { id: 'c8', source: 'calibration', target: 'iqc', labelAr: 'اعتماد دقة أجهزة الفحص والقياس', category: 'governance', color: '#10B981' },
  
  // الشكاوى والحيود
  { id: 'c9', source: 'complaints', target: 'ncr', labelAr: 'تحويل شكوى العميل لتقرير عدم مطابقة', category: 'defect', color: '#EF4444' },
  { id: 'c10', source: 'deviation', target: 'inspection_plans', labelAr: 'تحديث معايير القبول المؤقت بالصالة', category: 'governance', color: '#F59E0B' },
  
  // مسار الإغلاق والوقاية
  { id: 'c11', source: 'eight_d', target: 'control_plan', labelAr: 'تحديث خطة الضبط بالضوابط الجديدة', category: 'prevention', color: '#10B981' },
  { id: 'c12', source: 'eight_d', target: 'fmea', labelAr: 'تحديث مصفوفة تحليل المخاطر', category: 'prevention', color: '#F59E0B' },
  { id: 'c13', source: 'eight_d', target: 'knowledge_base', labelAr: 'توثيق الحل في بنك المعرفة والدروس', category: 'prevention', color: '#10B981' },
  { id: 'c14', source: 'capa_records', target: 'change_control', labelAr: 'طلب تعديل هندسي معتمد', category: 'governance', color: '#8B5CF6' },
  
  // مسار الهندسة إلى خطوط الإنتاج
  { id: 'c15', source: 'fmea', target: 'control_plan', labelAr: 'ربط النقاط الحرجة بخطة المراقبة', category: 'prevention', color: '#F59E0B' },
  { id: 'c16', source: 'control_plan', target: 'inspection_plans', labelAr: 'تغذية قوائم الفحص المرحلي بالمعايير', category: 'governance', color: '#0EA5E9' },
  { id: 'c17', source: 'control_plan', target: 'spc', labelAr: 'تحديد حدود المواصفات العليا والدنيا', category: 'intelligence', color: '#06B6D4' },
  
  // الذكاء الاصطناعي والرقابة
  { id: 'c18', source: 'spc', target: 'ai_copilot', labelAr: 'تحليل اتجاهات الحيود والتنبؤ المبكر', category: 'intelligence', color: '#06B6D4' },
  { id: 'c19', source: 'knowledge_base', target: 'ai_copilot', labelAr: 'تزويد المساعد الذكي بالخبرات السابقة', category: 'intelligence', color: '#06B6D4' },
  { id: 'c20', source: 'control_tower', target: 'command_center', labelAr: 'مراقبة سرعة إغلاق خطط التحسين', category: 'intelligence', color: '#0EA5E9' },
];

// =========================================================================
// 3. المكون الرئيسي لشبكة المنظومة التفاعلية
// =========================================================================

export default function QualityEcosystemPortal() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // حالة التحريك والتكبير (Pan & Zoom)
  const [zoom, setZoom] = useState<number>(0.75);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 20, y: 20 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);

  // حالة التفاعل والاختيار
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSimulation, setActiveSimulation] = useState<'none' | 'defect' | 'supplier' | 'prevention'>('none');
  const [activePhaseFilter, setActivePhaseFilter] = useState<string | null>(null);

  // ملاءمة الشاشة تلقائياً عند الفتح بحيث تظهر الكروت بحجم كبير وواضح
  const fitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    const padding = 20;
    const scaleX = (clientWidth - padding * 2) / CANVAS_WIDTH;
    const scaleY = (clientHeight - padding * 2) / CANVAS_HEIGHT;
    const optimalZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.45), 1.05);

    const centerX = (clientWidth - CANVAS_WIDTH * optimalZoom) / 2;
    const centerY = (clientHeight - CANVAS_HEIGHT * optimalZoom) / 2;

    setZoom(optimalZoom);
    setPan({ x: centerX, y: centerY });
  }, []);

  useEffect(() => {
    fitToScreen();
    window.addEventListener('resize', fitToScreen);
    return () => window.removeEventListener('resize', fitToScreen);
  }, [fitToScreen]);

  // التمركز التلقائي حول قسم محدد
  const centerOnNode = useCallback((nodeId: string) => {
    const targetNode = NODES.find((n) => n.id === nodeId);
    if (!targetNode || !containerRef.current) return;

    const { clientWidth, clientHeight } = containerRef.current;
    const targetZoom = Math.max(zoom, 0.85);
    const nodeCenterX = targetNode.x + NODE_WIDTH / 2;
    const nodeCenterY = targetNode.y + NODE_HEIGHT / 2;

    const targetPanX = clientWidth / 2 - nodeCenterX * targetZoom;
    const targetPanY = clientHeight / 2 - nodeCenterY * targetZoom;

    setZoom(targetZoom);
    setPan({ x: targetPanX, y: targetPanY });
    setSelectedNodeId(nodeId);
  }, [zoom]);

  // تحريك الكاميرا عند تشغيل المحاكاة
  useEffect(() => {
    if (activeSimulation === 'defect') {
      centerOnNode('ncr');
    } else if (activeSimulation === 'supplier') {
      centerOnNode('suppliers');
    } else if (activeSimulation === 'prevention') {
      centerOnNode('eight_d');
    }
  }, [activeSimulation, centerOnNode]);

  // التحكم بالسحب (Pan)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setHasMoved(false);
    setStartPoint({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const newX = e.clientX - startPoint.x;
    const newY = e.clientY - startPoint.y;
    if (Math.abs(newX - pan.x) > 3 || Math.abs(newY - pan.y) > 3) {
      setHasMoved(true);
    }
    setPan({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // التحكم بالتكبير والتصغير بعجلة الماوس
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.4), 1.6);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const activeNodeId = hoveredNodeId || selectedNodeId;

  // تحديد الخطوط النشطة
  const highlightedCableIds = useMemo(() => {
    const set = new Set<string>();

    if (activeSimulation === 'defect') {
      ['c1', 'c2', 'c3', 'c4', 'c5', 'c11', 'c12', 'c18'].forEach((id) => set.add(id));
      return set;
    }
    if (activeSimulation === 'supplier') {
      ['c6', 'c7', 'c4', 'c8'].forEach((id) => set.add(id));
      return set;
    }
    if (activeSimulation === 'prevention') {
      ['c11', 'c12', 'c13', 'c15', 'c16', 'c17', 'c19'].forEach((id) => set.add(id));
      return set;
    }

    if (activeNodeId) {
      CABLES.forEach((c) => {
        if (c.source === activeNodeId || c.target === activeNodeId) {
          set.add(c.id);
        }
      });
      return set;
    }

    return set;
  }, [activeNodeId, activeSimulation]);

  // تحديد الكروت المتصلة لتسليط الضوء عليها
  const activeConnectedNodeIds = useMemo(() => {
    const set = new Set<string>();
    if (activeNodeId) set.add(activeNodeId);

    if (activeSimulation === 'defect') {
      ['daily_defects', 'ncr', 'capa_records', 'eight_d', 'defect_cost', 'control_plan', 'fmea', 'spc', 'ai_copilot'].forEach((id) => set.add(id));
      return set;
    }
    if (activeSimulation === 'supplier') {
      ['iqc', 'suppliers', 'ncr', 'eight_d', 'calibration'].forEach((id) => set.add(id));
      return set;
    }
    if (activeSimulation === 'prevention') {
      ['eight_d', 'control_plan', 'fmea', 'knowledge_base', 'inspection_plans', 'spc', 'ai_copilot'].forEach((id) => set.add(id));
      return set;
    }

    highlightedCableIds.forEach((cId) => {
      const c = CABLES.find((item) => item.id === cId);
      if (c) {
        set.add(c.source);
        set.add(c.target);
      }
    });

    return set;
  }, [activeNodeId, activeSimulation, highlightedCableIds]);

  // حساب عدد الارتباطات لكل كارت
  const nodeConnectionsCount = useMemo(() => {
    const counts: Record<string, number> = {};
    NODES.forEach((n) => {
      counts[n.id] = CABLES.filter((c) => c.source === n.id || c.target === n.id).length;
    });
    return counts;
  }, []);

  // نتائج البحث الفوري
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return NODES.filter(
      (n) => n.nameAr.toLowerCase().includes(q) || n.badgeAr.toLowerCase().includes(q) || n.descriptionAr.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // بيانات الكارت المحدد لعرضها في الشريط السفلي
  const activeNodeInfo = useMemo(() => {
    if (!activeNodeId) return null;
    const node = NODES.find((n) => n.id === activeNodeId);
    if (!node) return null;
    const phase = PHASES.find((p) => p.id === node.phaseId);

    const incoming = CABLES.filter((c) => c.target === node.id).map((c) => {
      const srcNode = NODES.find((n) => n.id === c.source);
      return { cable: c, sourceName: srcNode?.nameAr || c.source };
    });

    const outgoing = CABLES.filter((c) => c.source === node.id).map((c) => {
      const tgtNode = NODES.find((n) => n.id === c.target);
      return { cable: c, targetName: tgtNode?.nameAr || c.target };
    });

    return { node, phase, incoming, outgoing };
  }, [activeNodeId]);

  return (
    <div className="h-full max-h-full overflow-hidden flex flex-col select-none relative w-full text-white bg-[#040812] font-sans" dir="rtl">
      
      {/* ========================================================================= */}
      {/* 1. الشريط العلوي للتحكم والبحث ومحاكاة المسارات */}
      {/* ========================================================================= */}
      <header className="h-14 px-3 sm:px-6 border-b border-white/10 bg-[#070d19]/90 backdrop-blur-2xl flex items-center justify-between shrink-0 z-30 gap-2">
        
        {/* عنوان المنصة */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0066CC] to-[#00A3E0] flex items-center justify-center shadow-[0_0_25px_rgba(0,163,224,0.45)] border border-sky-400/40">
            <Network className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white">
                منظومة الترابط الشامل لإدارة الجودة
              </h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ٢٤ قسماً متصلاً
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              مرر المؤشر على أي قسم لإضاءة مسارات الارتباط • اضغط لفتح القسم مباشرة
            </p>
          </div>
        </div>

        {/* أزرار محاكاة السيناريوهات الحية */}
        <div className="hidden lg:flex items-center gap-1.5 p-1 bg-white/[0.04] border border-white/10 rounded-2xl">
          <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
            <Play className="w-3 h-3 text-sky-400" />
            <span>محاكاة المسار:</span>
          </span>

          <button
            type="button"
            onClick={() => setActiveSimulation(activeSimulation === 'defect' ? 'none' : 'defect')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSimulation === 'defect'
                ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-105'
                : 'bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/25'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            <span>عيب إنتاج ⬅ عدم مطابقة ⬅ 8D</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSimulation(activeSimulation === 'supplier' ? 'none' : 'supplier')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSimulation === 'supplier'
                ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-105'
                : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/25'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>رفض خامة ⬅ تقييم المورد</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSimulation(activeSimulation === 'prevention' ? 'none' : 'prevention')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSimulation === 'prevention'
                ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-105'
                : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/25'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>إغلاق 8D ⬅ خطة الضبط ⬅ الدروس</span>
          </button>

          {activeSimulation !== 'none' && (
            <button
              type="button"
              onClick={() => setActiveSimulation('none')}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              title="إعادة التعيين"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* البحث وأدوات التكبير */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* تصفية سريعة للمراحل */}
          <div className="hidden 2xl:flex items-center gap-1 bg-white/[0.04] border border-white/10 rounded-xl p-1">
            <button
              type="button"
              onClick={() => {
                setActivePhaseFilter(null);
                fitToScreen();
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                !activePhaseFilter ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              الكل
            </button>
            {PHASES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  if (activePhaseFilter === p.id) {
                    setActivePhaseFilter(null);
                    fitToScreen();
                  } else {
                    setActivePhaseFilter(p.id);
                    const firstNode = NODES.find((n) => n.phaseId === p.id);
                    if (firstNode) centerOnNode(firstNode.id);
                  }
                }}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  activePhaseFilter === p.id
                    ? 'bg-white/15 text-white border border-white/30 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={{ color: activePhaseFilter === p.id ? p.color : undefined }}
              >
                {p.titleAr.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* مربع البحث عن قسم */}
          <div className="relative">
            <div className="flex items-center gap-1.5 bg-white/[0.05] border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-sky-400/60 transition-colors w-36 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث عن قسم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white placeholder:text-slate-500 w-full"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0c1424] border border-white/15 rounded-xl shadow-2xl p-1.5 z-50 max-h-60 overflow-y-auto">
                {searchResults.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => {
                      centerOnNode(res.id);
                      setSearchQuery('');
                    }}
                    className="w-full text-right px-3 py-2 rounded-lg text-xs hover:bg-white/10 flex items-center justify-between gap-2 transition-colors"
                  >
                    <span className="font-bold text-white">{res.nameAr}</span>
                    <span className="text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md">{res.badgeAr}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* أزرار التكبير والملاءمة */}
          <div className="flex items-center gap-1 bg-white/[0.05] border border-white/10 rounded-xl p-1" dir="ltr">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(z + 0.12, 1.5))}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
              title="تكبير"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-bold text-slate-300 px-1 min-w-[38px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(z - 0.12, 0.45))}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
              title="تصغير"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3.5 bg-white/10 mx-0.5" />
            <button
              type="button"
              onClick={fitToScreen}
              className="p-1.5 rounded-lg hover:bg-white/10 text-sky-400 hover:text-sky-300"
              title="احتواء كامل الشاشة"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. لوحة الشبكة التفاعلية الحرة (Canvas) */}
      {/* ========================================================================= */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        dir="ltr"
        className={`flex-1 overflow-hidden relative w-full h-full ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        } bg-[radial-gradient(ellipse_at_center,#0a1326_0%,#040812_100%)]`}
      >
        {/* خلفية نقاط الشبكة الهندسية */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage: `radial-gradient(rgba(56, 189, 248, 0.35) 1px, transparent 1px)`,
            backgroundSize: `${28 * zoom}px ${28 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        />

        {/* الطبقة المتحركة التي تضم المراحل والخطوط والكروت */}
        <div
          className="absolute top-0 left-0 transition-transform duration-75 origin-top-left pointer-events-auto"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
          }}
        >
          {/* ------------------------------------------------------------- */}
          {/* أعمدة المراحل الـ 6 */}
          {/* ------------------------------------------------------------- */}
          {PHASES.map((phase) => {
            const isPhaseActive = !activePhaseFilter || activePhaseFilter === phase.id;
            return (
              <div
                key={phase.id}
                dir="rtl"
                style={{
                  left: `${phase.x}px`,
                  top: '20px',
                  width: `${phase.width}px`,
                  height: '830px',
                }}
                className={`absolute rounded-3xl border ${phase.borderColor} bg-gradient-to-b ${phase.bgGradient} p-4 pointer-events-none transition-all duration-300 ${
                  isPhaseActive ? 'opacity-100' : 'opacity-20'
                }`}
              >
                {/* رأس المرحلة بالعربية */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg border border-white/15"
                      style={{
                        backgroundColor: phase.color + '25',
                        color: phase.color,
                        boxShadow: `0 0 20px ${phase.color}30`,
                      }}
                    >
                      <phase.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[11px] font-black px-2 py-0.5 rounded-md"
                          style={{ backgroundColor: phase.color + '20', color: phase.color }}
                        >
                          المرحلة {phase.phaseNumber}
                        </span>
                      </div>
                      <h3 className="text-[15px] font-black text-white mt-0.5">{phase.titleAr}</h3>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* ------------------------------------------------------------- */}
          {/* خطوط الليزر والارتباط التفاعلية (SVG Cables) */}
          {/* ------------------------------------------------------------- */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}
          >
            <defs>
              <filter id="laserGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              <linearGradient id="laserPulseRed" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#FCA5A5" stopOpacity="1" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0.2" />
              </linearGradient>

              <linearGradient id="laserPulseEmerald" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#6EE7B7" stopOpacity="1" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.2" />
              </linearGradient>

              <linearGradient id="laserPulseCyan" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#BAE6FD" stopOpacity="1" />
                <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.2" />
              </linearGradient>

              <linearGradient id="laserPulsePurple" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#DDD6FE" stopOpacity="1" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {CABLES.map((cable) => {
              const src = NODES.find((n) => n.id === cable.source);
              const tgt = NODES.find((n) => n.id === cable.target);
              if (!src || !tgt) return null;

              const isSameColumn = src.x === tgt.x;
              const isForwardRtl = tgt.x < src.x; // التدفق الطبيعي من اليمين إلى اليسار

              let x1 = src.x;
              const y1 = src.y + NODE_HEIGHT / 2;
              let x2 = tgt.x + NODE_WIDTH;
              const y2 = tgt.y + NODE_HEIGHT / 2;

              let pathD = '';

              if (isSameColumn) {
                // ارتباط داخل نفس العمود: يخرج من اليمين ويدخل لليمين بقوس أنيق
                x1 = src.x + NODE_WIDTH;
                x2 = tgt.x + NODE_WIDTH;
                const curveOffset = 45;
                pathD = `M ${x1} ${y1} C ${x1 + curveOffset} ${y1}, ${x2 + curveOffset} ${y2}, ${x2} ${y2}`;
              } else if (isForwardRtl) {
                // انتقال من اليمين إلى اليسار (من مخرج اليسار للكارت الأول إلى مدخل اليمين للكارت الثاني)
                x1 = src.x;
                x2 = tgt.x + NODE_WIDTH;
                const dx = Math.max(55, (x1 - x2) * 0.45);
                pathD = `M ${x1} ${y1} C ${x1 - dx} ${y1}, ${x2 + dx} ${y2}, ${x2} ${y2}`;
              } else {
                // تغذية راجعة من اليسار إلى اليمين
                x1 = src.x + NODE_WIDTH;
                x2 = tgt.x;
                const archOffset = y1 > 450 ? 110 : -110;
                pathD = `M ${x1} ${y1} C ${x1 + 80} ${y1 + archOffset}, ${x2 - 80} ${y2 + archOffset}, ${x2} ${y2}`;
              }

              const isHighlighted = highlightedCableIds.has(cable.id);

              return (
                <g key={cable.id}>
                  {/* الخط الأساسي */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isHighlighted ? cable.color : 'rgba(148, 163, 184, 0.14)'}
                    strokeWidth={isHighlighted ? '3' : '1.5'}
                    strokeDasharray={isHighlighted ? 'none' : '5, 5'}
                    filter={isHighlighted ? 'url(#laserGlow)' : 'none'}
                    className="transition-all duration-300"
                  />

                  {/* نبضة الليزر المتحركة */}
                  {isHighlighted && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke={
                        cable.color === '#EF4444'
                          ? 'url(#laserPulseRed)'
                          : cable.color === '#10B981'
                          ? 'url(#laserPulseEmerald)'
                          : cable.color === '#8B5CF6'
                          ? 'url(#laserPulsePurple)'
                          : 'url(#laserPulseCyan)'
                      }
                      strokeWidth="4.5"
                      strokeDasharray="18, 26"
                      className="animate-laser-flow"
                      filter="url(#laserGlow)"
                      style={{ animationDuration: '0.75s' }}
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* ------------------------------------------------------------- */}
          {/* 4. التصميم الجديد الفاخر للكروت (١٠٠٪ عربي، واضح، أنيق، بدون زحام) */}
          {/* ------------------------------------------------------------- */}
          {NODES.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isHovered = hoveredNodeId === node.id;
            const isConnected = activeConnectedNodeIds.has(node.id);
            const isDimmed = activeNodeId && !isConnected && activeSimulation === 'none';
            const phase = PHASES.find((p) => p.id === node.phaseId);
            const themeColor = phase?.color || '#0EA5E9';
            const linksCount = nodeConnectionsCount[node.id] || 0;

            return (
              <div
                key={node.id}
                dir="rtl"
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: `${NODE_WIDTH}px`,
                  height: `${NODE_HEIGHT}px`,
                  boxShadow:
                    isSelected || isHovered
                      ? `0 14px 35px -5px ${themeColor}45, 0 0 0 2px ${themeColor}`
                      : isConnected
                      ? `0 8px 25px -5px ${themeColor}30, 0 0 0 1.5px ${themeColor}90`
                      : '0 10px 30px -10px rgba(0, 0, 0, 0.7)',
                }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={() => {
                  if (hasMoved) return;
                  setSelectedNodeId(node.id === selectedNodeId ? null : node.id);
                }}
                onDoubleClick={() => {
                  navigate(node.path);
                }}
                className={`absolute rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-200 z-20 group backdrop-blur-xl ${
                  isSelected
                    ? 'bg-[#111c33] scale-[1.04]'
                    : isHovered
                    ? 'bg-[#0f192d] scale-[1.03]'
                    : isConnected
                    ? 'bg-[#0d1627]'
                    : 'bg-[#09101d]/95 border border-white/10 hover:border-white/25'
                } ${isDimmed ? 'opacity-25' : 'opacity-100'}`}
              >
                {/* شريط الإضاءة العلوي بلون المرحلة */}
                <div
                  className="h-1.5 w-full shrink-0"
                  style={{
                    background: `linear-gradient(90deg, ${themeColor}, ${themeColor}55)`,
                  }}
                />

                {/* هالة ضوئية خلفية ناعمة في زاوية الكارت */}
                <div
                  className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity"
                  style={{ backgroundColor: themeColor }}
                />

                {/* نقاط التوصيل الجانبية المدمجة */}
                <div
                  className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#040812] transition-transform group-hover:scale-125"
                  style={{
                    backgroundColor: isConnected ? themeColor : '#334155',
                    boxShadow: isConnected ? `0 0 10px ${themeColor}` : 'none',
                  }}
                />
                <div
                  className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#040812] transition-transform group-hover:scale-125"
                  style={{
                    backgroundColor: isConnected ? themeColor : '#334155',
                    boxShadow: isConnected ? `0 0 10px ${themeColor}` : 'none',
                  }}
                />

                {/* محتوى الكارت الداخلي */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  
                  {/* الصف الأول: الأيقونة الفاخرة + شارة التخصص */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/15 transition-transform group-hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, ${themeColor}35, ${themeColor}10)`,
                          color: themeColor,
                          boxShadow: `inset 0 1px 1px rgba(255,255,255,0.2)`,
                        }}
                      >
                        <node.icon className="w-5 h-5" />
                      </div>

                      <div>
                        <h4 className="text-[14px] font-black text-white group-hover:text-sky-300 transition-colors leading-snug">
                          {node.nameAr}
                        </h4>
                        <span
                          className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-1"
                          style={{
                            backgroundColor: `${themeColor}18`,
                            color: themeColor,
                          }}
                        >
                          {node.badgeAr}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* الصف الأوسط: وصف مختصر وواضح للقسم */}
                  <p className="text-[11px] text-slate-300/80 leading-relaxed line-clamp-2 my-1.5">
                    {node.descriptionAr}
                  </p>

                  {/* الصف السفلي: عدد الارتباطات + زر الدخول السريع */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                      <Link2 className="w-3 h-3" style={{ color: themeColor }} />
                      <span>{linksCount} ارتباطات نشطة</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(node.path);
                      }}
                      style={{
                        backgroundColor: isHovered ? themeColor : 'rgba(255,255,255,0.06)',
                        color: isHovered ? '#ffffff' : '#e2e8f0',
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm hover:shadow-md"
                    >
                      <span>فتح القسم</span>
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* 5. شريط استكشاف العلاقات السفلي عند اختيار أي كارت */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {activeNodeInfo && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ duration: 0.2 }}
              dir="rtl"
              className="absolute bottom-3 right-4 left-4 z-30 pointer-events-auto max-w-6xl mx-auto"
            >
              <div className="bg-[#0b1324]/95 backdrop-blur-2xl border border-sky-500/40 rounded-2xl p-3.5 sm:px-5 shadow-[0_15px_50px_rgba(0,0,0,0.85)] flex flex-col md:flex-row items-center justify-between gap-3 text-white">
                
                {/* معلومات القسم المحدد */}
                <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center border border-white/20 shrink-0 shadow-lg"
                    style={{
                      backgroundColor: activeNodeInfo.phase?.color + '25',
                      color: activeNodeInfo.phase?.color,
                    }}
                  >
                    <activeNodeInfo.node.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: activeNodeInfo.phase?.color + '20',
                          color: activeNodeInfo.phase?.color,
                        }}
                      >
                        {activeNodeInfo.phase?.titleAr}
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-white">
                        {activeNodeInfo.node.nameAr}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 max-w-md line-clamp-1 mt-0.5">
                      {activeNodeInfo.node.descriptionAr}
                    </p>
                  </div>
                </div>

                {/* مسارات التغذية والمخرجات */}
                <div className="hidden lg:flex items-center gap-3 text-xs shrink-0">
                  <div className="flex items-center gap-1.5 bg-white/[0.04] px-3 py-1.5 rounded-xl border border-white/10">
                    <span className="text-[11px] text-slate-400">يستقبل من:</span>
                    {activeNodeInfo.incoming.length > 0 ? (
                      <div className="flex items-center gap-1 flex-wrap">
                        {activeNodeInfo.incoming.map((item, i) => (
                          <span
                            key={i}
                            className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300"
                          >
                            {item.sourceName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500">نقطة انطلاق أولية</span>
                    )}
                  </div>

                  <ArrowLeft className="w-4 h-4 text-slate-500" />

                  <div className="flex items-center gap-1.5 bg-white/[0.04] px-3 py-1.5 rounded-xl border border-white/10">
                    <span className="text-[11px] text-slate-400">يُغذي:</span>
                    {activeNodeInfo.outgoing.length > 0 ? (
                      <div className="flex items-center gap-1 flex-wrap">
                        {activeNodeInfo.outgoing.map((item, i) => (
                          <span
                            key={i}
                            className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300"
                          >
                            {item.targetName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500">محطة ختامية</span>
                    )}
                  </div>
                </div>

                {/* زر الانتقال المباشر */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedNodeId(null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10"
                  >
                    إغلاق
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(activeNodeInfo.node.path)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0066CC] to-[#00A3E0] hover:from-[#0055b3] hover:to-[#008ec2] text-white text-xs font-black shadow-[0_0_20px_rgba(0,163,224,0.4)] flex items-center gap-2 transition-all hover:scale-105"
                  >
                    <span>الانتقال إلى القسم الآن</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
