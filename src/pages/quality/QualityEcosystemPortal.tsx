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
  ArrowRight,
  Maximize2,
  Cpu,
  Search,
  Play,
  RotateCcw,
  Network,
  ZoomIn,
  ZoomOut,
  Radio,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';

interface BlueprintNode {
  id: string;
  nameAr: string;
  nameEn: string;
  path: string;
  icon: LucideIcon;
  badge: string;
  badgeColor: string;
  descriptionAr: string;
  phaseId: string;
  x: number;
  y: number;
  metricLabel: string;
  metricValue: string;
  metricPositive: boolean;
}

interface PhaseZone {
  id: string;
  phaseNumber: string;
  titleAr: string;
  titleEn: string;
  color: string;
  glowColor: string;
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
// 1. ARCHITECTURE DEFINITIONS: 6 PHASES & 24 INDUSTRIAL NODES
// =========================================================================

const NODE_WIDTH = 260;
const NODE_HEIGHT = 125;
const CANVAS_WIDTH = 2620;
const CANVAS_HEIGHT = 960;

const PHASES: PhaseZone[] = [
  {
    id: 'supply_chain',
    phaseNumber: '01',
    titleAr: 'سلاسل الإمداد والخامات',
    titleEn: 'Supply Chain & Inbound',
    color: '#10B981',
    glowColor: 'rgba(16,185,129,0.25)',
    borderColor: 'border-emerald-500/30',
    bgGradient: 'from-emerald-950/20 to-transparent',
    x: 60,
    width: 320,
    icon: Truck,
  },
  {
    id: 'shopfloor',
    phaseNumber: '02',
    titleAr: 'خطوط الإنتاج والتصنيع',
    titleEn: 'Shopfloor Execution',
    color: '#00A3E0',
    glowColor: 'rgba(0,163,224,0.25)',
    borderColor: 'border-sky-500/30',
    bgGradient: 'from-sky-950/20 to-transparent',
    x: 480,
    width: 320,
    icon: Factory,
  },
  {
    id: 'nonconformance',
    phaseNumber: '03',
    titleAr: 'الحجز وعدم المطابقة',
    titleEn: 'Containment & NCR',
    color: '#EF4444',
    glowColor: 'rgba(239,68,68,0.25)',
    borderColor: 'border-red-500/30',
    bgGradient: 'from-red-950/20 to-transparent',
    x: 900,
    width: 320,
    icon: AlertTriangle,
  },
  {
    id: 'root_cause',
    phaseNumber: '04',
    titleAr: 'الحل الجذري والتحسين',
    titleEn: '8D & Corrective Action',
    color: '#8B5CF6',
    glowColor: 'rgba(139,92,246,0.25)',
    borderColor: 'border-purple-500/30',
    bgGradient: 'from-purple-950/20 to-transparent',
    x: 1320,
    width: 320,
    icon: Workflow,
  },
  {
    id: 'engineering',
    phaseNumber: '05',
    titleAr: 'الوقاية والهندسة',
    titleEn: 'Engineering & Prevention',
    color: '#F59E0B',
    glowColor: 'rgba(245,158,11,0.25)',
    borderColor: 'border-amber-500/30',
    bgGradient: 'from-amber-950/20 to-transparent',
    x: 1740,
    width: 320,
    icon: ShieldCheck,
  },
  {
    id: 'intelligence',
    phaseNumber: '06',
    titleAr: 'الرقابة الذكية و SPC',
    titleEn: 'Control Tower & AI',
    color: '#06B6D4',
    glowColor: 'rgba(6,182,212,0.25)',
    borderColor: 'border-cyan-500/30',
    bgGradient: 'from-cyan-950/20 to-transparent',
    x: 2160,
    width: 320,
    icon: Cpu,
  },
];

const NODES: BlueprintNode[] = [
  // Phase 1: Supply Chain
  {
    id: 'iqc',
    nameAr: 'فحص الوارد (IQC)',
    nameEn: 'Incoming Inspection',
    path: '/inspection',
    icon: Truck,
    badge: 'فحص خامات',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    descriptionAr: 'فحص مطابقة الشحنات والخامات الموردة مع خطط القبول ومعايير AQL',
    phaseId: 'supply_chain',
    x: 90,
    y: 130,
    metricLabel: 'نسبة القبول',
    metricValue: '99.4%',
    metricPositive: true,
  },
  {
    id: 'suppliers',
    nameAr: 'سجل وتقييم الموردين',
    nameEn: 'Supplier Scorecard',
    path: '/supplier-quality',
    icon: Building,
    badge: 'تقييم أداء',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    descriptionAr: 'تحديث تقييم جودة الموردين آلياً وحساب معدلات الرفض والحيود',
    phaseId: 'supply_chain',
    x: 90,
    y: 330,
    metricLabel: 'مورد معتمد',
    metricValue: '48 مورد',
    metricPositive: true,
  },
  {
    id: 'calibration',
    nameAr: 'معايرة أجهزة القياس',
    nameEn: 'Metrology & Calibration',
    path: '/calibration',
    icon: Wrench,
    badge: 'دقة القياس',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    descriptionAr: 'شهادات وصلاحية أدوات القياس لضمان دقة قرارات التفتيش والرفض',
    phaseId: 'supply_chain',
    x: 90,
    y: 530,
    metricLabel: 'جاهزية الأجهزة',
    metricValue: '100%',
    metricPositive: true,
  },
  {
    id: 'inbound_audit',
    nameAr: 'تدقيق جودة الموردين',
    nameEn: 'Supplier Audits',
    path: '/audits',
    icon: ShieldCheck,
    badge: 'تأهيل المورد',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    descriptionAr: 'مراجعات ميدانية لمنشآت الموردين واعتماد خطوط إنتاجهم',
    phaseId: 'supply_chain',
    x: 90,
    y: 730,
    metricLabel: 'مراجعات مجدولة',
    metricValue: '4 زيارات',
    metricPositive: true,
  },

  // Phase 2: Shopfloor
  {
    id: 'daily_defects',
    nameAr: 'تسجيل العيوب اللحظي',
    nameEn: 'Defect Capture',
    path: '/shopfloor/defects',
    icon: Activity,
    badge: 'صالة الإنتاج',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    descriptionAr: 'تسجيل العيوب الفوري من المشغلين مع التصوير وربط الماكينة والوردية',
    phaseId: 'shopfloor',
    x: 510,
    y: 130,
    metricLabel: 'معدل اليوم',
    metricValue: '0.18%',
    metricPositive: true,
  },
  {
    id: 'inspection_plans',
    nameAr: 'خطط الفحص المرحلي (IPQC)',
    nameEn: 'In-Process Inspection',
    path: '/inspection-plans',
    icon: CheckCircle2,
    badge: 'فحص دوري',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    descriptionAr: 'قوائم فحص الجودة أثناء التشغيل والتحقق من العينات الأولى First Piece',
    phaseId: 'shopfloor',
    x: 510,
    y: 330,
    metricLabel: 'مطابقة العينات',
    metricValue: '99.8%',
    metricPositive: true,
  },
  {
    id: 'lpa',
    nameAr: 'التدقيق الطبقي (LPA)',
    nameEn: 'Layered Process Audits',
    path: '/audits/layered',
    icon: Layers,
    badge: 'رقابة قيادية',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    descriptionAr: 'تأكيد التزام المشغلين والمشرفين بالمعايير القياسية لمنع الحيود',
    phaseId: 'shopfloor',
    x: 510,
    y: 530,
    metricLabel: 'التزام الإجراءات',
    metricValue: '98.5%',
    metricPositive: true,
  },
  {
    id: 'setup_readiness',
    nameAr: 'جاهزية الماكينات والبدء',
    nameEn: 'Line Setup Readiness',
    path: '/setup-readiness',
    icon: Sliders,
    badge: 'تصريح بدء',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    descriptionAr: 'اعتماد مطابقة المعايير الفنية وتصريح بدء الإنتاج لتفادي الهدر',
    phaseId: 'shopfloor',
    x: 510,
    y: 730,
    metricLabel: 'خطوط جاهزة',
    metricValue: '6 خطوط',
    metricPositive: true,
  },

  // Phase 3: Containment & NCR
  {
    id: 'ncr',
    nameAr: 'تقارير عدم المطابقة (NCR)',
    nameEn: 'Non-Conformance Reports',
    path: '/quality/records/ncr',
    icon: AlertTriangle,
    badge: 'حجز المنتجات',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    descriptionAr: 'إصدار أوامر الحجز والفرز وتوثيق العيب وربطه برقم التشغيلة والخط',
    phaseId: 'nonconformance',
    x: 930,
    y: 130,
    metricLabel: 'حالات مفتوحة',
    metricValue: '2 نشطة',
    metricPositive: false,
  },
  {
    id: 'deviation',
    nameAr: 'تصاريح الحيود المؤقت',
    nameEn: 'Process Deviations',
    path: '/deviation',
    icon: FileWarning,
    badge: 'حيود مشروط',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    descriptionAr: 'تصاريح قبول الخامات أو التشغيل المشروط لحالات الطوارئ المعتمدة',
    phaseId: 'nonconformance',
    x: 930,
    y: 330,
    metricLabel: 'ساري المفعول',
    metricValue: '1 تصريح',
    metricPositive: true,
  },
  {
    id: 'complaints',
    nameAr: 'شكاوى ومردودات العملاء',
    nameEn: 'Customer Complaints',
    path: '/complaints',
    icon: Building,
    badge: 'صوت العميل',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    descriptionAr: 'تتبع شكاوى العملاء وتحليل أسبابها مع ربط فوري بـ NCR و CAPA',
    phaseId: 'nonconformance',
    x: 930,
    y: 530,
    metricLabel: 'معدل الرضا',
    metricValue: '99.1%',
    metricPositive: true,
  },
  {
    id: 'defect_cost',
    nameAr: 'تكلفة رداءة الجودة (COPQ)',
    nameEn: 'Cost of Poor Quality',
    path: '/defect-cost',
    icon: DollarSign,
    badge: 'حساب الخردة',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    descriptionAr: 'حساب مالي لخسائر العيوب وتكلفة الفرز وإعادة التشغيل والمردودات',
    phaseId: 'nonconformance',
    x: 930,
    y: 730,
    metricLabel: 'توفير محقق',
    metricValue: '-\$12.4k',
    metricPositive: true,
  },

  // Phase 4: 8D & Improvement
  {
    id: 'capa_records',
    nameAr: 'خطط التحسين (CAPA)',
    nameEn: 'Corrective Actions',
    path: '/quality/records/capa',
    icon: CheckCheck,
    badge: 'حلول وقائية',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    descriptionAr: 'خطط تصحيحية ووقائية محكمة لمنع تكرار المشكلات عبر فرق العمل',
    phaseId: 'root_cause',
    x: 1350,
    y: 130,
    metricLabel: 'فاعلية الإغلاق',
    metricValue: '96.2%',
    metricPositive: true,
  },
  {
    id: 'eight_d',
    nameAr: 'منهجية حل المشكلات (8D)',
    nameEn: '8D Root Cause Engine',
    path: '/quality/records/8d',
    icon: RefreshCw,
    badge: 'تحليل جذري',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    descriptionAr: 'التحقيق المنهجي الشامل للسبب الجذري باستخدام عظمة السمكة و 5Why',
    phaseId: 'root_cause',
    x: 1350,
    y: 330,
    metricLabel: 'تقارير مكتملة',
    metricValue: '18 ملف',
    metricPositive: true,
  },
  {
    id: 'change_control',
    nameAr: 'إدارة التغيير الهندسي',
    nameEn: 'Engineering Change (ECN)',
    path: '/change-control',
    icon: Sliders,
    badge: 'ضبط التغيير',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    descriptionAr: 'حوكمة وتوثيق أي تعديل على القوالب أو الماكينات أو المواد الخام',
    phaseId: 'root_cause',
    x: 1350,
    y: 530,
    metricLabel: 'تغييرات معتمدة',
    metricValue: '5 ECN',
    metricPositive: true,
  },
  {
    id: 'command_center',
    nameAr: 'غرفة متابعة الإجراءات',
    nameEn: 'Action Command Center',
    path: '/quality-command-center',
    icon: Workflow,
    badge: 'سرعة الإغلاق',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    descriptionAr: 'برج مراقبة فوري لمتابعة المهام المعلقة ومعدلات الإنجاز بين الأقسام',
    phaseId: 'root_cause',
    x: 1350,
    y: 730,
    metricLabel: 'معدل الالتزام',
    metricValue: '98%',
    metricPositive: true,
  },

  // Phase 5: Prevention & Engineering
  {
    id: 'fmea',
    nameAr: 'تحليل المخاطر (FMEA)',
    nameEn: 'Risk Matrix (FMEA)',
    path: '/fmea',
    icon: ShieldCheck,
    badge: 'أولوية الخطر',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    descriptionAr: 'تقييم درجات الشدة والتكرار والكشف RPN لمنع الفشل قبل وقوعه',
    phaseId: 'engineering',
    x: 1770,
    y: 130,
    metricLabel: 'أقصى RPN',
    metricValue: '72 (آمن)',
    metricPositive: true,
  },
  {
    id: 'control_plan',
    nameAr: 'خطة المراقبة والضبط (CP)',
    nameEn: 'Dynamic Control Plan',
    path: '/control-plan',
    icon: Sliders,
    badge: 'معايير العمليات',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    descriptionAr: 'توثيق مواصفات الفحص وطرق القياس والحدود الحرجة لكل مرحلة',
    phaseId: 'engineering',
    x: 1770,
    y: 330,
    metricLabel: 'نقاط ضبط مفعلة',
    metricValue: '124 نقطة',
    metricPositive: true,
  },
  {
    id: 'knowledge_base',
    nameAr: 'بنك المعرفة والدروس',
    nameEn: 'Lessons Learned Hub',
    path: '/quality/library',
    icon: BookOpen,
    badge: 'الذاكرة المؤسسية',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    descriptionAr: 'مستودع الخبرات التراكمية وسوابق الحلول لتفادي إعادة ابتكار العجلة',
    phaseId: 'engineering',
    x: 1770,
    y: 530,
    metricLabel: 'حل موثق',
    metricValue: '340 درس',
    metricPositive: true,
  },
  {
    id: 'form_designer',
    nameAr: 'مصمم النماذج الذكية',
    nameEn: 'Dynamic Form Studio',
    path: '/forms/designer',
    icon: Layers,
    badge: 'أتمتة الفحص',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    descriptionAr: 'بناء وتخصيص استمارات الجودة الميدانية بدون برمجة وربطها بالمحطات',
    phaseId: 'engineering',
    x: 1770,
    y: 730,
    metricLabel: 'نموذج رقمي',
    metricValue: '32 نموذج',
    metricPositive: true,
  },

  // Phase 6: SPC, Tower & AI
  {
    id: 'spc',
    nameAr: 'الضبط الإحصائي (SPC)',
    nameEn: 'Statistical Process Control',
    path: '/spc',
    icon: TrendingUp,
    badge: 'مؤشرات القدرة',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    descriptionAr: 'خرائط التحكم X-Bar R وحساب Cp/Cpk للكشف المبكر عن انحراف الماكينات',
    phaseId: 'intelligence',
    x: 2190,
    y: 130,
    metricLabel: 'مؤشر Cpk',
    metricValue: '1.67 (عالي)',
    metricPositive: true,
  },
  {
    id: 'control_tower',
    nameAr: 'برج المراقبة والتحكم 360°',
    nameEn: 'Executive Control Tower',
    path: '/quality/control-tower',
    icon: BarChart3,
    badge: 'غرفة العمليات',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    descriptionAr: 'رؤية مركزية موحدة لكافة مؤشرات الجودة ومقارنة الخطوط ومستويات الهدر',
    phaseId: 'intelligence',
    x: 2190,
    y: 330,
    metricLabel: 'صحة المنظومة',
    metricValue: '98.8%',
    metricPositive: true,
  },
  {
    id: 'ai_copilot',
    nameAr: 'مساعد الجودة الذكي (AI)',
    nameEn: 'QMS Neural Copilot',
    path: '/ai-intelligence',
    icon: Sparkles,
    badge: 'ذكاء توليدي',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    descriptionAr: 'تحليل أنماط العيوب واقتراح الأسباب الجذرية وصياغة مسودات 8D آلياً',
    phaseId: 'intelligence',
    x: 2190,
    y: 530,
    metricLabel: 'تنبؤ استباقي',
    metricValue: '99.9%',
    metricPositive: true,
  },
  {
    id: 'audits',
    nameAr: 'التدقيق والمراجعات الشاملة',
    nameEn: 'Quality Audits Hub',
    path: '/audits',
    icon: ShieldCheck,
    badge: 'شهادات الآيزو',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    descriptionAr: 'جدولة ومتابعة تدقيقات النظم والعمليات وتوثيق حالات عدم المطابقة',
    phaseId: 'intelligence',
    x: 2190,
    y: 730,
    metricLabel: 'جاهزية الآيزو',
    metricValue: '100%',
    metricPositive: true,
  },
];

// =========================================================================
// 2. LASER RELATIONS (CABLE WIRING ACROSS NODES)
// =========================================================================

const CABLES: CableRelation[] = [
  // Defect flow
  { id: 'c1', source: 'daily_defects', target: 'ncr', labelAr: 'تصعيد عيب حرج إلى NCR', category: 'defect', color: '#EF4444' },
  { id: 'c2', source: 'daily_defects', target: 'spc', labelAr: 'تغذية بيانات العيوب في SPC', category: 'intelligence', color: '#00A3E0' },
  { id: 'c3', source: 'ncr', target: 'capa_records', labelAr: 'إصدار خطة تصحيحية CAPA', category: 'defect', color: '#EF4444' },
  { id: 'c4', source: 'ncr', target: 'eight_d', labelAr: 'تفعيل فريق حل مشكلات 8D', category: 'defect', color: '#8B5CF6' },
  { id: 'c5', source: 'ncr', target: 'defect_cost', labelAr: 'احتساب تكلفة الخردة COPQ', category: 'defect', color: '#EF4444' },
  
  // Supplier flow
  { id: 'c6', source: 'iqc', target: 'suppliers', labelAr: 'تحديث تقييم المورد آلياً', category: 'supplier', color: '#10B981' },
  { id: 'c7', source: 'iqc', target: 'ncr', labelAr: 'إصدار NCR لخامات مرفوضة', category: 'supplier', color: '#F59E0B' },
  { id: 'c8', source: 'calibration', target: 'iqc', labelAr: 'صلاحية أدوات القياس للفحص', category: 'governance', color: '#10B981' },
  
  // Complaints & Deviations
  { id: 'c9', source: 'complaints', target: 'ncr', labelAr: 'تسجيل شكوى العميل كـ NCR', category: 'defect', color: '#EF4444' },
  { id: 'c10', source: 'deviation', target: 'inspection_plans', labelAr: 'تحديث معايير القبول المؤقت', category: 'governance', color: '#F59E0B' },
  
  // Closed loop & Prevention
  { id: 'c11', source: 'eight_d', target: 'control_plan', labelAr: 'تحديث خطة الضبط بالحل الجذري', category: 'prevention', color: '#10B981' },
  { id: 'c12', source: 'eight_d', target: 'fmea', labelAr: 'خفض مؤشر RPN في مصفوفة المخاطر', category: 'prevention', color: '#F59E0B' },
  { id: 'c13', source: 'eight_d', target: 'knowledge_base', labelAr: 'توثيق الحل في الدروس المستفادة', category: 'prevention', color: '#10B981' },
  { id: 'c14', source: 'capa_records', target: 'change_control', labelAr: 'طلب تعديل هندسي ECN', category: 'governance', color: '#8B5CF6' },
  
  // Engineering to Shopfloor
  { id: 'c15', source: 'fmea', target: 'control_plan', labelAr: 'نقل الخصائص الحرجة إلى خطة الضبط', category: 'prevention', color: '#F59E0B' },
  { id: 'c16', source: 'control_plan', target: 'inspection_plans', labelAr: 'تغذية تعليمات الفحص للصالة', category: 'governance', color: '#00A3E0' },
  { id: 'c17', source: 'control_plan', target: 'spc', labelAr: 'تحديد حدود المواصفات USL/LSL', category: 'intelligence', color: '#06B6D4' },
  
  // Intelligence & AI
  { id: 'c18', source: 'spc', target: 'ai_copilot', labelAr: 'تنبؤ الانحراف قبل خروج العيب', category: 'intelligence', color: '#06B6D4' },
  { id: 'c19', source: 'knowledge_base', target: 'ai_copilot', labelAr: 'تغذية بنك الحلول للمساعد الذكي', category: 'intelligence', color: '#06B6D4' },
  { id: 'c20', source: 'control_tower', target: 'command_center', labelAr: 'إدارة مؤشرات الأداء الحية', category: 'intelligence', color: '#00A3E0' },
];

export default function QualityEcosystemPortal() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom Canvas State
  const [zoom, setZoom] = useState<number>(0.55);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);

  // Active / Selected State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSimulation, setActiveSimulation] = useState<'none' | 'defect' | 'supplier' | 'prevention'>('none');
  const [activePhaseFilter, setActivePhaseFilter] = useState<string | null>(null);

  // Auto-center and fit to screen on initial mount
  const fitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    const padding = 30;
    const scaleX = (clientWidth - padding * 2) / CANVAS_WIDTH;
    const scaleY = (clientHeight - padding * 2) / CANVAS_HEIGHT;
    const optimalZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 0.95);

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

  // Center on a specific node
  const centerOnNode = useCallback((nodeId: string) => {
    const targetNode = NODES.find((n) => n.id === nodeId);
    if (!targetNode || !containerRef.current) return;

    const { clientWidth, clientHeight } = containerRef.current;
    const targetZoom = Math.max(zoom, 0.75);
    const nodeCenterX = targetNode.x + NODE_WIDTH / 2;
    const nodeCenterY = targetNode.y + NODE_HEIGHT / 2;

    const targetPanX = clientWidth / 2 - nodeCenterX * targetZoom;
    const targetPanY = clientHeight / 2 - nodeCenterY * targetZoom;

    setZoom(targetZoom);
    setPan({ x: targetPanX, y: targetPanY });
    setSelectedNodeId(nodeId);
  }, [zoom]);

  // Handle Simulation Selection
  useEffect(() => {
    if (activeSimulation === 'defect') {
      centerOnNode('ncr');
    } else if (activeSimulation === 'supplier') {
      centerOnNode('suppliers');
    } else if (activeSimulation === 'prevention') {
      centerOnNode('eight_d');
    }
  }, [activeSimulation, centerOnNode]);

  // Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking on the background canvas
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

  // Wheel Zoom (smooth and clamped)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.35), 1.6);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom towards mouse pointer
    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Active Cables calculation
  const activeNodeId = hoveredNodeId || selectedNodeId;

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

  // Connected Node IDs for focus effect
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

  // Filtered search list
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return NODES.filter(
      (n) => n.nameAr.toLowerCase().includes(q) || n.nameEn.toLowerCase().includes(q) || n.badge.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Selected Node Metadata for Bottom Inspector HUD
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
    <div className="h-full max-h-full overflow-hidden flex flex-col select-none relative w-full text-white bg-[#03060c] font-sans">
      
      {/* ========================================================================= */}
      {/* 1. TOP COMMAND BAR (HUD CONTROLS, SIMULATIONS & SMART SEARCH) */}
      {/* ========================================================================= */}
      <header className="h-14 px-3 sm:px-6 border-b border-white/10 bg-black/70 backdrop-blur-2xl flex items-center justify-between shrink-0 z-30 gap-2">
        
        {/* Brand & Ecosystem Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0066CC] to-[#00A3E0] flex items-center justify-center shadow-[0_0_25px_rgba(0,163,224,0.4)] border border-sky-400/40">
            <Network className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-white tracking-wide flex items-center gap-1.5">
                <span>شبكة الترابط الرقمي</span>
                <span className="text-[10px] text-sky-400 font-mono hidden sm:inline">QMS NODE GRAPH</span>
              </h1>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                24 عقدة متصلة
              </span>
            </div>
            <p className="text-[10px] text-white/50 hidden md:block">
              مخطط تفاعلي حر • اسحب للتنقل وزوّم للاستكشاف • اضغط على أي عقدة للدخول المباشر
            </p>
          </div>
        </div>

        {/* 2. LIVE SIMULATION PLAYBOOK BUTTONS */}
        <div className="hidden lg:flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl">
          <span className="text-[10px] font-bold text-white/40 px-2 flex items-center gap-1">
            <Play className="w-3 h-3 text-sky-400" />
            <span>محاكاة السيناريو:</span>
          </span>

          <button
            type="button"
            onClick={() => setActiveSimulation(activeSimulation === 'defect' ? 'none' : 'defect')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
              activeSimulation === 'defect'
                ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)] scale-105'
                : 'bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            <span>عيب إنتاج ➔ NCR ➔ 8D</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSimulation(activeSimulation === 'supplier' ? 'none' : 'supplier')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
              activeSimulation === 'supplier'
                ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.6)] scale-105'
                : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>رفض خامة ➔ تقييم مورد</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSimulation(activeSimulation === 'prevention' ? 'none' : 'prevention')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
              activeSimulation === 'prevention'
                ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.6)] scale-105'
                : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>إغلاق 8D ➔ خطة الضبط ➔ الدروس</span>
          </button>

          {activeSimulation !== 'none' && (
            <button
              type="button"
              onClick={() => setActiveSimulation('none')}
              className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10"
              title="إعادة التعيين"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 3. PHASE SELECTOR, SEARCH & ZOOM CONTROLS */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Quick Phase Navigation Filter */}
          <div className="hidden 2xl:flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setActivePhaseFilter(null)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                !activePhaseFilter ? 'bg-sky-500 text-white shadow' : 'text-white/40 hover:text-white'
              }`}
            >
              كافة المراحل
            </button>
            {PHASES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  if (activePhaseFilter === p.id) {
                    setActivePhaseFilter(null);
                  } else {
                    setActivePhaseFilter(p.id);
                    const firstNode = NODES.find((n) => n.phaseId === p.id);
                    if (firstNode) centerOnNode(firstNode.id);
                  }
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  activePhaseFilter === p.id
                    ? 'bg-white/20 text-white border border-white/30 shadow'
                    : 'text-white/40 hover:text-white'
                }`}
                style={{ color: activePhaseFilter === p.id ? p.color : undefined }}
              >
                {p.titleAr.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Quick Node Search */}
          <div className="relative">
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 focus-within:border-sky-400/60 transition-colors w-36 sm:w-52">
              <Search className="w-3.5 h-3.5 text-white/40" />
              <input
                type="text"
                placeholder="بحث عن قسم أو وحدة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/30 w-full"
              />
            </div>

            {/* Search Autocomplete dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0b101d] border border-white/15 rounded-xl shadow-2xl p-1 z-50 max-h-60 overflow-y-auto">
                {searchResults.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => {
                      centerOnNode(res.id);
                      setSearchQuery('');
                    }}
                    className="w-full text-right px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/10 flex items-center justify-between gap-2"
                  >
                    <span className="font-bold text-white">{res.nameAr}</span>
                    <span className="text-[10px] text-white/40">{res.badge}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Canvas Zoom & Reset Controls */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(z + 0.15, 1.6))}
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
              title="تكبير (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-white/60 px-1 min-w-[34px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(z - 0.15, 0.35))}
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
              title="تصغير (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3.5 bg-white/10 mx-0.5" />
            <button
              type="button"
              onClick={fitToScreen}
              className="p-1 rounded-lg hover:bg-white/10 text-sky-400 hover:text-sky-300"
              title="ملاءمة الشاشة (Fit All)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. INFINITE INTERACTIVE CANVAS (PAN & ZOOM CONTAINER) */}
      {/* ========================================================================= */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`flex-1 overflow-hidden relative w-full h-full ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        } bg-[#040711]`}
      >
        {/* Background Subtle Cyber Grid Texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(rgba(0, 163, 224, 0.4) 1px, transparent 1px)`,
            backgroundSize: `${32 * zoom}px ${32 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        />

        {/* TRANSFORMS LAYER: NODES, PHASES & SVG CABLES */}
        <div
          className="absolute top-0 left-0 transition-transform duration-75 origin-top-left pointer-events-auto"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
          }}
        >
          {/* ------------------------------------------------------------- */}
          {/* PHASE ZONES BACKGROUND WATERMARKS & BANNERS */}
          {/* ------------------------------------------------------------- */}
          {PHASES.map((phase) => {
            const isPhaseActive = !activePhaseFilter || activePhaseFilter === phase.id;
            return (
              <div
                key={phase.id}
                style={{
                  left: `${phase.x}px`,
                  top: '40px',
                  width: `${phase.width}px`,
                  height: '840px',
                }}
                className={`absolute rounded-3xl border ${phase.borderColor} bg-gradient-to-b ${phase.bgGradient} p-4 pointer-events-none transition-all duration-300 ${
                  isPhaseActive ? 'opacity-100' : 'opacity-20'
                }`}
              >
                {/* Stage Header Tag */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: phase.color + '25', color: phase.color }}
                    >
                      <phase.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold" style={{ color: phase.color }}>
                          STAGE {phase.phaseNumber}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-white">{phase.titleAr}</h3>
                    </div>
                  </div>
                </div>

                {/* Vertical Stage Guide Watermark */}
                <div
                  className="absolute bottom-6 left-4 text-4xl font-black font-mono select-none opacity-5 tracking-widest pointer-events-none"
                  style={{ color: phase.color }}
                >
                  {phase.titleEn.toUpperCase()}
                </div>
              </div>
            );
          })}

          {/* ------------------------------------------------------------- */}
          {/* SVG DYNAMIC LASER CABLES OVERLAY */}
          {/* ------------------------------------------------------------- */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}
          >
            <defs>
              <filter id="laserGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              <linearGradient id="laserPulseRed" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#FCA5A5" stopOpacity="1" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0.2" />
              </linearGradient>

              <linearGradient id="laserPulseEmerald" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#6EE7B7" stopOpacity="1" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.2" />
              </linearGradient>

              <linearGradient id="laserPulseCyan" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00A3E0" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#BAE6FD" stopOpacity="1" />
                <stop offset="100%" stopColor="#00A3E0" stopOpacity="0.2" />
              </linearGradient>

              <linearGradient id="laserPulsePurple" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#DDD6FE" stopOpacity="1" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {CABLES.map((cable) => {
              const src = NODES.find((n) => n.id === cable.source);
              const tgt = NODES.find((n) => n.id === cable.target);
              if (!src || !tgt) return null;

              // Source Pin (Right side of source node)
              const x1 = src.x + NODE_WIDTH;
              const y1 = src.y + NODE_HEIGHT / 2;

              // Target Pin (Left side of target node)
              const x2 = tgt.x;
              const y2 = tgt.y + NODE_HEIGHT / 2;

              const isHighlighted = highlightedCableIds.has(cable.id);
              const isBackwards = x2 <= x1;

              // Bezier Path Generation
              let pathD = '';
              if (!isBackwards) {
                const dx = Math.max(70, (x2 - x1) * 0.45);
                pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
              } else {
                // Backward loop arc
                const archOffset = y1 > 500 ? 120 : -120;
                pathD = `M ${x1} ${y1} C ${x1 + 100} ${y1 + archOffset}, ${x2 - 100} ${y2 + archOffset}, ${x2} ${y2}`;
              }

              return (
                <g key={cable.id}>
                  {/* Subtle conduit wire */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isHighlighted ? cable.color : 'rgba(255,255,255,0.06)'}
                    strokeWidth={isHighlighted ? '2.5' : '1.2'}
                    strokeDasharray={isHighlighted ? 'none' : '4, 4'}
                    filter={isHighlighted ? 'url(#laserGlow)' : 'none'}
                    className="transition-all duration-300"
                  />

                  {/* High voltage animated laser pulse */}
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
                      strokeWidth="3.5"
                      strokeDasharray="16, 24"
                      className="animate-laser-flow"
                      filter="url(#laserGlow)"
                      style={{ animationDuration: '0.8s' }}
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* ------------------------------------------------------------- */}
          {/* HIGH-TECH HARDWARE BLADE NODES */}
          {/* ------------------------------------------------------------- */}
          {NODES.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isHovered = hoveredNodeId === node.id;
            const isConnected = activeConnectedNodeIds.has(node.id);
            const isDimmed = activeNodeId && !isConnected && activeSimulation === 'none';
            const phase = PHASES.find((p) => p.id === node.phaseId);

            return (
              <div
                key={node.id}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: `${NODE_WIDTH}px`,
                  height: `${NODE_HEIGHT}px`,
                }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={() => {
                  if (hasMoved) return; // Prevent navigation when user was dragging canvas
                  setSelectedNodeId(node.id);
                }}
                onDoubleClick={() => {
                  navigate(node.path);
                }}
                className={`absolute rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition-all duration-200 z-20 group ${
                  isSelected
                    ? 'bg-[#0f172a] border-2 border-sky-400 shadow-[0_0_30px_rgba(0,163,224,0.5)] scale-105'
                    : isHovered
                    ? 'bg-[#0c162b] border-2 border-sky-400/80 shadow-[0_0_20px_rgba(0,163,224,0.35)] scale-[1.03]'
                    : isConnected
                    ? 'bg-[#0b1222] border-2 border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                    : 'bg-[#080d19]/90 border border-white/10 hover:border-white/30 hover:bg-[#0c1426]'
                } ${isDimmed ? 'opacity-30' : 'opacity-100'}`}
              >
                {/* WIRING PORTS (MAGNETIC CONNECTORS) */}
                {/* Left Input Port */}
                <div
                  className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white/60 transition-transform ${
                    isConnected ? 'bg-sky-400 shadow-[0_0_10px_#00A3E0] scale-125' : 'bg-slate-700'
                  }`}
                  title="نقطة تغذية بيانات (Input)"
                />

                {/* Right Output Port */}
                <div
                  className={`absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white/60 transition-transform ${
                    isConnected ? 'bg-emerald-400 shadow-[0_0_10px_#10B981] scale-125' : 'bg-slate-700'
                  }`}
                  title="نقطة إخراج بيانات (Output)"
                />

                {/* Node Header: Icon & Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center border border-white/10"
                      style={{
                        backgroundColor: (phase?.color || '#00A3E0') + '20',
                        color: phase?.color || '#00A3E0',
                      }}
                    >
                      <node.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white tracking-wide group-hover:text-sky-300 transition-colors">
                        {node.nameAr}
                      </h4>
                      <p className="text-[9px] text-white/40 font-mono leading-none">{node.nameEn}</p>
                    </div>
                  </div>

                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${node.badgeColor}`}>
                    {node.badge}
                  </span>
                </div>

                {/* Node Body: Real-time Metric & Quick Launch */}
                <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1">
                  <div>
                    <span className="text-[9px] text-white/40 block leading-tight">{node.metricLabel}</span>
                    <span
                      className={`text-xs font-black font-mono ${
                        node.metricPositive ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {node.metricValue}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(node.path);
                    }}
                    className="px-2 py-1 rounded-lg bg-white/5 hover:bg-sky-500 hover:text-white text-white/60 text-[10px] font-bold flex items-center gap-1 transition-all border border-white/10 hover:border-sky-400 shadow-sm"
                  >
                    <span>دخول</span>
                    <ArrowRight className="w-2.5 h-2.5 rtl:rotate-180" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* 3. RADAR MINIMAP (BOTTOM-LEFT CORNER) */}
        {/* ========================================================================= */}
        <div className="absolute bottom-4 left-4 z-30 hidden sm:block">
          <div className="w-48 h-24 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/15 p-2 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-sky-400 font-bold flex items-center gap-1">
                <Radio className="w-3 h-3 text-sky-400 animate-pulse" />
                RADAR MINIMAP
              </span>
              <span className="text-[8px] font-mono text-white/40">2620x960</span>
            </div>

            {/* Radar miniature dots */}
            <div className="relative w-full h-14 bg-white/5 rounded-lg overflow-hidden border border-white/5">
              {NODES.map((n) => {
                const rx = (n.x / CANVAS_WIDTH) * 100;
                const ry = (n.y / CANVAS_HEIGHT) * 100;
                const phase = PHASES.find((p) => p.id === n.phaseId);
                return (
                  <div
                    key={n.id}
                    style={{
                      left: `${rx}%`,
                      top: `${ry}%`,
                      backgroundColor: phase?.color || '#00A3E0',
                    }}
                    className="absolute w-1 h-1 rounded-full"
                  />
                );
              })}

              {/* Viewport indicator box */}
              {containerRef.current && (
                <div
                  style={{
                    left: `${Math.max(0, (-pan.x / (CANVAS_WIDTH * zoom)) * 100)}%`,
                    top: `${Math.max(0, (-pan.y / (CANVAS_HEIGHT * zoom)) * 100)}%`,
                    width: `${Math.min(100, (containerRef.current.clientWidth / (CANVAS_WIDTH * zoom)) * 100)}%`,
                    height: `${Math.min(100, (containerRef.current.clientHeight / (CANVAS_HEIGHT * zoom)) * 100)}%`,
                  }}
                  className="absolute border border-sky-400 bg-sky-400/10 rounded pointer-events-none"
                />
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. LIVE RELATIONSHIP INSPECTOR HUD (BOTTOM DRAWER) */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {activeNodeInfo && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-3 right-3 left-3 sm:left-56 sm:right-6 z-30 pointer-events-auto"
            >
              <div className="bg-[#0b101d]/95 backdrop-blur-2xl border border-sky-500/40 rounded-2xl p-3 sm:p-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col md:flex-row items-center justify-between gap-3 text-white">
                
                {/* Node Summary */}
                <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/20 shrink-0"
                    style={{
                      backgroundColor: activeNodeInfo.phase?.color + '25',
                      color: activeNodeInfo.phase?.color,
                    }}
                  >
                    <activeNodeInfo.node.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-sky-400">
                        STAGE {activeNodeInfo.phase?.phaseNumber}
                      </span>
                      <h3 className="text-sm font-black text-white">{activeNodeInfo.node.nameAr}</h3>
                    </div>
                    <p className="text-[11px] text-white/60 max-w-md line-clamp-1">
                      {activeNodeInfo.node.descriptionAr}
                    </p>
                  </div>
                </div>

                {/* Connection Pathways (Inputs & Outputs) */}
                <div className="hidden lg:flex items-center gap-4 text-xs shrink-0">
                  {/* Incoming */}
                  <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-white/40">تغذية من:</span>
                    {activeNodeInfo.incoming.length > 0 ? (
                      <div className="flex items-center gap-1">
                        {activeNodeInfo.incoming.map((item, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300"
                          >
                            {item.sourceName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-white/30">نقطة بداية الدورة</span>
                    )}
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-white/30 rtl:rotate-180" />

                  {/* Outgoing */}
                  <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-white/40">مخرجات إلى:</span>
                    {activeNodeInfo.outgoing.length > 0 ? (
                      <div className="flex items-center gap-1">
                        {activeNodeInfo.outgoing.map((item, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300"
                          >
                            {item.targetName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-white/30">محطة ختامية</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedNodeId(null)}
                    className="px-3 py-1.5 rounded-xl text-xs text-white/50 hover:text-white hover:bg-white/10"
                  >
                    إغلاق
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(activeNodeInfo.node.path)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0066CC] to-[#00A3E0] hover:from-[#0055b3] hover:to-[#008ec2] text-white text-xs font-black shadow-[0_0_20px_rgba(0,163,224,0.4)] flex items-center gap-2 transition-all scale-100 hover:scale-105"
                  >
                    <span>دخول القسم الآن</span>
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
