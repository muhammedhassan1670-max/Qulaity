// @ts-nocheck
// QMS Enterprise 4.0 - Live Quality Blueprint Map & Control Tower
// Interactive Single-Screen Traceability Map matching the exact 7-block factory architecture
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Network, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Clock, 
  ShieldAlert, ShieldCheck, Search, RefreshCw, ExternalLink, Eye, 
  Building, Cpu, Wrench, PackageCheck, Users, Truck, Sparkles, Check, 
  ChevronRight, X, Info, Zap, Layers, Activity, FileText, Maximize2, Minimize2,
  ZoomIn, ZoomOut, RotateCcw, HelpCircle
} from 'lucide-react';
import { seedComprehensiveQualityLifecycle } from '../../services/seedLifecycleDemo';
import { useTranslation } from '../../utils/translations';

// ============================================================================
// DATA TYPES
// ============================================================================
export type PresetJourney = 'all' | 'batch-901' | 'seal-lot-02' | 'valve-lot-03' | 'complaint-101';

export interface BlueprintNode {
  id: string;
  category: 'raw-material' | 'supplier-ncr' | 'assembly' | 'defect' | 'control-plan' | 'audit' | 'internal-ncr' | 'capa' | 'oqc' | 'customer' | 'complaint';
  containerId: number; // 1 to 7 matching the 7 blocks
  titleAr: string;
  titleEn: string;
  subtitleAr?: string;
  subtitleEn?: string;
  code: string;
  lotOrBatch?: string;
  status: 'pass' | 'fail' | 'conditional' | 'investigation' | 'completed' | 'in-progress' | 'quarantine';
  statusLabelAr: string;
  statusLabelEn: string;
  statusColor: string;
  isStopPoint?: boolean;
  stopReasonAr?: string;
  nextStepAr?: string;
  assignedTo?: string;
  location?: string;
  moduleUrl: string;
  moduleLabelAr: string;
  details: Record<string, string | number>;
  // Position in 1400x860 canvas
  x: number;
  y: number;
  w: number;
  h: number;
}

export function QualityControlTower() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [activePreset, setActivePreset] = useState<PresetJourney>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('DEF-901B');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Seed data on initial load if needed
  useEffect(() => {
    if (typeof localStorage !== 'undefined' && !localStorage.getItem('qms_comprehensive_seeded_v1')) {
      try {
        seedComprehensiveQualityLifecycle();
        localStorage.setItem('qms_comprehensive_seeded_v1', 'true');
      } catch (e) {
        console.warn('Seeding failed', e);
      }
    }
  }, []);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // ============================================================================
  // THE 15 EXACT NODES FROM THE USER'S BLUEPRINT SCHEMATIC
  // ============================================================================
  const nodes: BlueprintNode[] = useMemo(() => [
    // ------------------------------------------------------------------------
    // CONTAINER 1: 1. الخامات الواردة (IQC) - 5 Raw Materials (Horizontal Layout)
    // ------------------------------------------------------------------------
    {
      id: 'RM-ORING-02',
      containerId: 1,
      category: 'raw-material',
      titleAr: 'FAIL مرفوض - (LOT-OR-02) خامة 2: مانع تسرب',
      titleEn: 'FAIL Rejected - (LOT-OR-02) RM 2: Rubber O-Ring Seal',
      subtitleAr: 'تشوه القطر الداخلي وعدم مطابقة الصلادة 75 Shore-A',
      subtitleEn: 'ID deformation & non-compliant hardness',
      code: 'LOT-2026-OR-02',
      lotOrBatch: 'LOT-2026-OR-02',
      status: 'fail',
      statusLabelAr: 'مرفوض ومحجوز (IQC)',
      statusLabelEn: 'IQC Rejected & Quarantined',
      statusColor: '#EF4444',
      isStopPoint: true,
      stopReasonAr: 'شحنة موقوفة عند بوابة الاستلام IQC. تم حظر الدفعة بالكامل برقم حجز QR-2026-88 وتصعيدها لتقرير عدم مطابقة مورد.',
      nextStepAr: 'استكمال إرجاع الشحنة ومطالبة المورد بالتقرير الثماني 8D واستبدال اللوت.',
      assignedTo: 'م. أحمد شكري (مهندس فحص الاستلام)',
      location: 'رصيف الاستلام 01 - منطقة الحجز والعزل',
      moduleUrl: '/compliance/hub/inspection',
      moduleLabelAr: 'فحص المواد الخام (IQC)',
      details: {
        'رقم الشحنة': 'LOT-2026-OR-02',
        'المورد': 'شركة المطاط الحديثة',
        'كمية العينة': '125 قطعة (مستوى II AQL 1.0)',
        'العيوب المرصودة': '11 قطعة بقطر غير منتظم',
        'قرار اللجنة': 'رفض تام وحجز فوري'
      },
      x: 50, y: 50, w: 235, h: 68
    },
    {
      id: 'RM-VALV-03',
      containerId: 1,
      category: 'raw-material',
      titleAr: 'PASS مطابق - (LOT-VL-03) خامة 3: صمامات',
      titleEn: 'PASS - (LOT-VL-03) RM 3: Safety Valves',
      subtitleAr: 'اجتياز اختبار ضغط الفتح 250 بار بنجاح تام',
      subtitleEn: 'Passed cracking pressure test 250 bar',
      code: 'LOT-2026-VL-03',
      lotOrBatch: 'LOT-2026-VL-03',
      status: 'pass',
      statusLabelAr: 'مطابق 100% (معتمد)',
      statusLabelEn: '100% Passed (Approved)',
      statusColor: '#10B981',
      isStopPoint: false,
      stopReasonAr: 'لا يوجد توقف. الشحنة اجتازت الفحص وتم صرفها لخط التجميع.',
      nextStepAr: 'صرف رصيد اللوت لأوامر تشغيل التجميع.',
      assignedTo: 'فني الفحص طارق حسام',
      location: 'مستودع الخامات المعتمدة - رف A-14',
      moduleUrl: '/compliance/hub/inspection',
      moduleLabelAr: 'فحص الاستلام (IQC)',
      details: {
        'الكمية المستلمة': '1,200 صمام',
        'صلادة السطح': 'HRC 42 (مطابق)',
        'شهادة المنشأ': 'EN 10204 3.1 معتمدة'
      },
      x: 320, y: 50, w: 235, h: 68
    },
    {
      id: 'RM-BOLT-04',
      containerId: 1,
      category: 'raw-material',
      titleAr: 'فرز وتنظيف - (LOT-BL-04) خامة 4: مسامير',
      titleEn: 'Sorting & Cleaning - (LOT-BL-04) RM 4: M8 Bolts',
      subtitleAr: 'شوائب زيتية على سن القلاووظ تتطلب غسيل وتجفيف',
      subtitleEn: 'Oil residues on threads requiring degreasing',
      code: 'LOT-2026-BL-04',
      lotOrBatch: 'LOT-2026-BL-04',
      status: 'conditional',
      statusLabelAr: 'فرز وتطهير مشروط',
      statusLabelEn: 'Conditional Sorting',
      statusColor: '#F59E0B',
      isStopPoint: false,
      stopReasonAr: 'تم فرز وتطهير الشحنة في محطة الغسيل بالموجات فوق الصوتية وصرفها للتشغيل.',
      nextStepAr: 'فحص عينة عشوائية بعد الغسيل للتأكد من نظافة السن.',
      assignedTo: 'م. حسام بدر (مراقب جودة)',
      location: 'محطة التنظيف الكيميائي',
      moduleUrl: '/compliance/hub/inspection',
      moduleLabelAr: 'فحص الاستلام (IQC)',
      details: {
        'كمية اللوت': '10,000 مسمار M8',
        'إجراء الفرز': 'تنظيف 100% بالموجات الصوتية',
        'الحالة الحالية': 'تم التطهير وصالح للاستخدام'
      },
      x: 590, y: 50, w: 235, h: 68
    },
    {
      id: 'RM-ALUM-01',
      containerId: 1,
      category: 'raw-material',
      titleAr: 'قبول مشروط - (LOT-AL-01) خامة 1: ألومنيوم',
      titleEn: 'Conditional Pass - (LOT-AL-01) RM 1: Aluminum 7075',
      subtitleAr: 'ارتفاع طفيف بخشونة السطح Ra 3.8 مع تصريح تشغيل',
      subtitleEn: 'Slight surface roughness Ra 3.8 with deviation concession',
      code: 'LOT-2026-AL-01',
      lotOrBatch: 'LOT-2026-AL-01',
      status: 'conditional',
      statusLabelAr: 'تصريح تشغيل مشروط',
      statusLabelEn: 'Approved under Concession',
      statusColor: '#F59E0B',
      isStopPoint: false,
      stopReasonAr: 'تم منح تصريح تشغيل استثنائي DEV-2026-04 مع تعديل سرعة الخراطة بالورشة.',
      nextStepAr: 'التحقق من أبعاد أول قطعة بعد التشغيل الآلي (First Article Inspection).',
      assignedTo: 'م. مصطفى رفعت',
      location: 'خط الخراطة CNC',
      moduleUrl: '/compliance/hub/inspection',
      moduleLabelAr: 'فحص الاستلام (IQC)',
      details: {
        'رقم تصريح الانحراف': 'DEV-2026-04',
        'الكمية المصرح بها': '500 سبيكة',
        'تأثير الجودة': 'لا يؤثر على وظيفة المنتج النهائية'
      },
      x: 860, y: 50, w: 235, h: 68
    },
    {
      id: 'RM-OIL-05',
      containerId: 1,
      category: 'raw-material',
      titleAr: 'PASS مطابق - (LOT-OL-05) خامة 5: زيت هيدروليك',
      titleEn: 'PASS - (LOT-OL-05) RM 5: Hydraulic Oil ISO-VG46',
      subtitleAr: 'لزوجة ونقاء مطابق لمعايير ISO 4406 (16/14/11)',
      subtitleEn: 'Viscosity and cleanliness compliant with ISO 4406',
      code: 'LOT-2026-OL-05',
      lotOrBatch: 'LOT-2026-OL-05',
      status: 'pass',
      statusLabelAr: 'مطابق 100% (معتمد)',
      statusLabelEn: '100% Passed (Approved)',
      statusColor: '#10B981',
      isStopPoint: false,
      stopReasonAr: 'لا يوجد توقف. الزيت جاهز لاختبارات الضغط في خط التجميع.',
      nextStepAr: 'تغذية وحدة الاختبار الهيدروليكي بالزيت المعتمد.',
      assignedTo: 'كيميائي المختبر سامح عادل',
      location: 'مختبر فحص السوائل',
      moduleUrl: '/compliance/hub/inspection',
      moduleLabelAr: 'فحص الاستلام (IQC)',
      details: {
        'معامل اللزوجة': '46.2 cSt @ 40°C',
        'محتوى الماء': '< 50 ppm',
        'رقم التقرير المعملي': 'LAB-HYD-9902'
      },
      x: 1125, y: 50, w: 225, h: 68
    },

    // ------------------------------------------------------------------------
    // CONTAINER 2: 2. عدم مطابقة مورد (Supplier NCR) - Middle Left
    // ------------------------------------------------------------------------
    {
      id: 'NCR-SUP-2026-001',
      containerId: 2,
      category: 'supplier-ncr',
      titleAr: 'Supplier NCR: NCR-SUP-2026-001',
      titleEn: 'Supplier NCR: NCR-SUP-2026-001',
      subtitleAr: 'حجز وإرجاع لوت مانع التسرب (شركة المطاط الحديثة)',
      subtitleEn: 'Quarantine & Return of Seal Lot (Modern Rubber Co.)',
      code: 'NCR-SUP-2026-001',
      lotOrBatch: 'LOT-2026-OR-02',
      status: 'quarantine',
      statusLabelAr: 'لوت محجوز للإرجاع',
      statusLabelEn: 'Quarantine for Return',
      statusColor: '#EF4444',
      isStopPoint: true,
      stopReasonAr: 'تم إيقاف دخول الشحنة لخط الإنتاج نهائياً ووضع علامة الرفض الحمراء وخصم درجات تقييم المورد بنسبة 15%.',
      nextStepAr: 'استلام رد 8D الأولي (D3 احتواء) من المورد خلال 24 ساعة.',
      assignedTo: 'م. كمال عبد العزيز (مدير جودة الموردين)',
      location: 'منطقة المرتجعات والحجز',
      moduleUrl: '/supplier-quality',
      moduleLabelAr: 'جودة الموردين (SQE)',
      details: {
        'المورد المعني': 'شركة المطاط الحديثة',
        'كود المورد': 'SUP-EG-440',
        'حالة الـ NCR': 'مفتوح بانتظار الشحنة البديلة',
        'تاريخ الحظر': '2026-10-14'
      },
      x: 65, y: 500, w: 205, h: 65
    },

    // ------------------------------------------------------------------------
    // CONTAINER 3: 3. خط التجميع ومسجل العيوب (Assembly & Defects) - Middle Right
    // ------------------------------------------------------------------------
    {
      id: 'BATCH-2026-901',
      containerId: 3,
      category: 'assembly',
      titleAr: 'BATCH-2026-901 تشغيلة التجميع',
      titleEn: 'BATCH-2026-901 Assembly Production Batch',
      subtitleAr: 'تجميع 250 مضخة هيدروليكية - خط التجميع الرئيسي 02',
      subtitleEn: 'Assembly of 250 Hydraulic Pumps - Main Line 02',
      code: 'BATCH-2026-901',
      lotOrBatch: 'BATCH-2026-901',
      status: 'in-progress',
      statusLabelAr: 'قيد التجميع والمراقبة',
      statusLabelEn: 'In-Progress Assembly',
      statusColor: '#00A3E0',
      isStopPoint: false,
      stopReasonAr: 'التشغيلة مستمرة لكن تم تجميد 12 وحدة منها بسبب عيب التسريب المرصود.',
      nextStepAr: 'فحص محطة عزم الربط واختبار الضغط قبل الإفراج عن باقي الدفعة.',
      assignedTo: 'م. محمود جاد (مشرف إنتاج الخط)',
      location: 'خط التجميع الرئيسي Line-02',
      moduleUrl: '/quality-shopfloor',
      moduleLabelAr: 'شاشة صالة الإنتاج',
      details: {
        'أمر التشغيل': 'WO-2026-PUMP-901',
        'إجمالي الدفعة': '250 مضخة',
        'الوحدات المكتملة': '180 مضخة',
        'الوحدات تحت الحظر': '12 مضخة'
      },
      x: 575, y: 195, w: 230, h: 42
    },
    {
      id: 'DEF-901B',
      containerId: 3,
      category: 'defect',
      titleAr: 'DEF-901B: تسريب ضغط هيدروليكي',
      titleEn: 'DEF-901B: Hydraulic Pressure Leak',
      subtitleAr: 'تسريب زيت عند ضغط اختبار 250 بار في 8 مضخات',
      subtitleEn: 'Oil leakage at 250 bar test on 8 pumps',
      code: 'DEF-2026-901B',
      lotOrBatch: 'BATCH-2026-901',
      status: 'fail',
      statusLabelAr: 'عيب حرج (نقطة توقف)',
      statusLabelEn: 'Critical Defect (Stop Point)',
      statusColor: '#EF4444',
      isStopPoint: true,
      stopReasonAr: '⚠️ نقطة توقف خط التجميع! رصد تسريب زيت هيدروليكي أثناء الاختبار النهائي على المحطة رقم 4. تم إيقاف تمرير الوحدات المعيبة وتصعيدها فوراً إلى NCR داخلي.',
      nextStepAr: 'استكمال تحقيق السبب الجذري وفحص عزم ربط المسامير مع مهندس العمليات.',
      assignedTo: 'م. ياسر القاضي (فاحص الجودة بالمحطة)',
      location: 'محطة اختبار الضغط رقم 4',
      moduleUrl: '/defect-log',
      moduleLabelAr: 'مسجل العيوب الصناعي',
      details: {
        'شدة العيب': 'حرج (Critical Severity)',
        'عدد القطع المعيبة': '8 مضخات',
        'طريقة الاكتشاف': 'اختبار هيدروستاتيكي 100%',
        'الإجراء الفوري': 'عزل وتجميد المضخات في صندوق الحظر'
      },
      x: 370, y: 265, w: 195, h: 54
    },
    {
      id: 'DEF-901C',
      containerId: 3,
      category: 'defect',
      titleAr: 'DEF-901C: تفاوت خلوص الصمام',
      titleEn: 'DEF-901C: Valve Clearance Variance',
      subtitleAr: 'تفاوت بسيط في الخلوص الميكانيكي (2 مضخة)',
      subtitleEn: 'Minor clearance variance (2 pumps)',
      code: 'DEF-2026-901C',
      lotOrBatch: 'BATCH-2026-901',
      status: 'conditional',
      statusLabelAr: 'تم ضبط الخلوص',
      statusLabelEn: 'Clearance Re-adjusted',
      statusColor: '#F59E0B',
      isStopPoint: false,
      stopReasonAr: 'تم إعادة وزن وضبط الخلوص بالمحطة واجتياز الفحص.',
      nextStepAr: 'المراقبة المستمرة لمؤشر Cpk للعملية.',
      assignedTo: 'فني التجميع عادل منصور',
      location: 'محطة ضبط الصمامات 02',
      moduleUrl: '/defect-log',
      moduleLabelAr: 'مسجل العيوب',
      details: {
        'القطع المتأثرة': '2 مضخة',
        'حالة المعالجة': 'تمت إعادة الضبط وإعادة الفحص'
      },
      x: 590, y: 265, w: 200, h: 54
    },
    {
      id: 'DEF-901A',
      containerId: 3,
      category: 'defect',
      titleAr: 'DEF-901A: تفويت قلاووظ (عزم زائد)',
      titleEn: 'DEF-901A: Stripped Thread (Over-Torque)',
      subtitleAr: 'تفويت في سن ربط الغطاء نتيجة تجاوز عزم المفك الهوائي',
      subtitleEn: 'Stripped housing thread due to pneumatic torque overshoot',
      code: 'DEF-2026-901A',
      lotOrBatch: 'BATCH-2026-901',
      status: 'fail',
      statusLabelAr: 'انحراف عزم مفك',
      statusLabelEn: 'Torque Tool Deviation',
      statusColor: '#EF4444',
      isStopPoint: false,
      stopReasonAr: 'السبب المباشر لعيب التسريب! مفك العزم الهوائي عياره منتهي وأعطى عزم ربط غير متطابق تسبب في تآكل القلاووظ.',
      nextStepAr: 'استبدال المفك فوراً بمفك ذكي رقمي مزود بـ Poka-Yoke.',
      assignedTo: 'م. فادي سمير (مهندس الصيانة)',
      location: 'محطة ربط الغطاء 03',
      moduleUrl: '/defect-log',
      moduleLabelAr: 'مسجل العيوب',
      details: {
        'العزم المقاس': '62 N.m (المطلوب 45 N.m)',
        'نسبة الانحراف': '+37% فوق الحد المسموح',
        'الإجراء المتخذ': 'سحب المفك الهوائي من الخدمة'
      },
      x: 815, y: 265, w: 195, h: 54
    },

    // ------------------------------------------------------------------------
    // CONTAINER 4: 4. خطة المراقبة والتدقيق الداخلي (Control Plan & Audit) - Lower Middle Left
    // ------------------------------------------------------------------------
    {
      id: 'CP-PUMP-01',
      containerId: 4,
      category: 'control-plan',
      titleAr: 'CP-PUMP-01 خطة المراقبة',
      titleEn: 'CP-PUMP-01 Control Plan',
      subtitleAr: 'معيار عزم الربط 45±3 N.m وضغط الاختبار 250 بار',
      subtitleEn: 'Torque spec 45±3 N.m & test pressure 250 bar',
      code: 'CP-PUMP-01',
      lotOrBatch: 'Rev 04',
      status: 'pass',
      statusLabelAr: 'خطة سارية ومحدثة',
      statusLabelEn: 'Active Control Plan',
      statusColor: '#10B981',
      isStopPoint: false,
      stopReasonAr: 'الخطة معتمدة وسارية، لكن تم رصد عدم التزام بمعايرة المفك أثناء التدقيق.',
      nextStepAr: 'تحديث خطة المراقبة لإضافة فحص المعايرة الشفتي اليومي.',
      assignedTo: 'م. شريف عثمان (رئيس قسم توكيد الجودة)',
      location: 'مكتب هندسة الجودة',
      moduleUrl: '/control-plan',
      moduleLabelAr: 'خطط المراقبة (Control Plans)',
      details: {
        'خاصية حرجة 1': 'عزم ربط مسامير الغطاء (45 N.m)',
        'خاصية حرجة 2': 'ضغط التحمل الهيدروليكي (250 بار لمدة دقيقتين)',
        'فترة المراجعة': 'سنوية أو عند حدوث CAPA'
      },
      x: 390, y: 600, w: 195, h: 48
    },
    {
      id: 'AUD-2026-901',
      containerId: 4,
      category: 'audit',
      titleAr: 'AUD-2026-901 تدقيق العملية',
      titleEn: 'AUD-2026-901 Process Layered Audit',
      subtitleAr: 'رصد انتهاء صلاحية ملصق معايرة مفك العزم بالمحطة 03',
      subtitleEn: 'Identified expired calibration tag on torque wrench',
      code: 'AUD-2026-901',
      lotOrBatch: 'LPA-Shift-A',
      status: 'fail',
      statusLabelAr: 'عدم مطابقة تدقيق عملية',
      statusLabelEn: 'Audit Finding Non-Conformance',
      statusColor: '#EF4444',
      isStopPoint: false,
      stopReasonAr: 'كشف التدقيق التراتبي (LPA) أن مفك العزم المستخدم قد انتهت صلاحية معايرته منذ 5 أيام دون إشعار للنظام.',
      nextStepAr: 'تحويل نتيجة التدقيق تلقائياً إلى سجل عدم مطابقة داخلي NCR-2026-901.',
      assignedTo: 'م. إيهاب سلامة (مدقق جودة العمليات)',
      location: 'خط التجميع 02',
      moduleUrl: '/compliance/hub/audit',
      moduleLabelAr: 'تدقيق العمليات (LPA)',
      details: {
        'نوع التدقيق': 'Layered Process Audit (LPA)',
        'البند غير المطابق': 'معايرة أدوات التجميع الحرجة',
        'مستوى الخطورة': 'مرتفع (High Risk)'
      },
      x: 390, y: 672, w: 195, h: 52
    },

    // ------------------------------------------------------------------------
    // CONTAINER 5: 5. حلقة المعالجة والتحسين المغلقة (NCR & CAPA) - Bottom Center
    // ------------------------------------------------------------------------
    {
      id: 'NCR-2026-901',
      containerId: 5,
      category: 'internal-ncr',
      titleAr: 'NCR-2026-901: داخلي NCR',
      titleEn: 'NCR-2026-901: Internal NCR',
      subtitleAr: 'حظر تشغيل 12 مضخة وتجميد محطة الربط لحين المعايرة',
      subtitleEn: 'Quarantine 12 pumps & freeze station pending calibration',
      code: 'NCR-2026-901',
      lotOrBatch: 'BATCH-2026-901',
      status: 'investigation',
      statusLabelAr: 'قيد التحقيق والمعالجة',
      statusLabelEn: 'Under Investigation',
      statusColor: '#8B5CF6',
      isStopPoint: false,
      stopReasonAr: 'سجل عدم المطابقة الداخلي فتح لمعالجة عيب التسريب وانتهاء معايرة أداة الربط.',
      nextStepAr: 'اعتماد خطة المعالجة وتفعيل الإجراء التصحيحي CAPA-2026-901.',
      assignedTo: 'م. وائل ناصر (مدير توكيد الجودة)',
      location: 'لجنة مراجعة عدم المطابقة (MRB)',
      moduleUrl: '/quality/records/ncr',
      moduleLabelAr: 'سجلات عدم المطابقة (NCR)',
      details: {
        'تاريخ الفتح': '2026-10-14',
        'القرار': 'إعادة تشغيل (Rework) مع فك واستبدال الأغطية التالفة',
        'تكلفة عدم الجودة': '4,800 ج.م'
      },
      x: 550, y: 748, w: 280, h: 42
    },
    {
      id: 'CAPA-2026-901',
      containerId: 5,
      category: 'capa',
      titleAr: 'CAPA-2026-901 إجراء تصحيحي',
      titleEn: 'CAPA-2026-901 Corrective Action',
      subtitleAr: 'متصل بـ Poka-Yoke تركيب مفك ذكي رقمي مع ربط PLC',
      subtitleEn: 'Poka-Yoke implementation: Smart Digital Torque Tool with PLC interlock',
      code: 'CAPA-2026-901',
      lotOrBatch: '8D Root-Cause',
      status: 'pass',
      statusLabelAr: 'تم التطبيق (Poka-Yoke)',
      statusLabelEn: 'Implemented (Poka-Yoke)',
      statusColor: '#10B981',
      isStopPoint: false,
      stopReasonAr: 'التحسين الجذري المكتمل! تم تركيب مفك إلكتروني ذكي يمنع خروج القطعة ما لم يتحقق العزم الدقيق 45 N.m بالضبط (مستحيل الخطأ).',
      nextStepAr: 'التحقق من الفعالية بعد تشغيل 500 وحدة قادمة.',
      assignedTo: 'م. حازم القاضي (رئيس هندسة العمليات)',
      location: 'محطة التجميع الذكية 03',
      moduleUrl: '/quality/records/capa',
      moduleLabelAr: 'الإجراءات التصحيحية (CAPA)',
      details: {
        'السبب الجذري': 'اعتماد العامل على الصوت بمفك هوائي غير مقيد',
        'الحل الجذري المطبق': 'Poka-Yoke كهربائي ذكي مقفل بـ PLC',
        'حالة الإغلاق': 'مطبق وموثق في خطة المراقبة'
      },
      x: 550, y: 800, w: 280, h: 48
    },

    // ------------------------------------------------------------------------
    // CONTAINER 6: 6. الفحص الصادر (OQC) - Middle Right
    // ------------------------------------------------------------------------
    {
      id: 'INS-2026-OQC-901',
      containerId: 6,
      category: 'oqc',
      titleAr: 'INS-2026-OQC-901 فحص العينة الصادرة',
      titleEn: 'INS-2026-OQC-901 Outgoing Sample Inspection',
      subtitleAr: 'PASS عينة 50 مضخة - اعتماد الشحن والتسليم للعميل',
      subtitleEn: 'PASS 50 pumps sample - Shipping clearance approved',
      code: 'INS-2026-OQC-901',
      lotOrBatch: 'BATCH-2026-901',
      status: 'pass',
      statusLabelAr: 'إفراج نهائي معتمد (PASS)',
      statusLabelEn: 'OQC Clearance Passed',
      statusColor: '#10B981',
      isStopPoint: false,
      stopReasonAr: 'تم اجتياز الفحص الظاهري والوظيفي لـ 50 مضخة بعد عزل الوحدات المعيبة.',
      nextStepAr: 'إصدار شهادة المطابقة النهائية CoC وتسليم العميل.',
      assignedTo: 'م. مروان صلاح (مدير فحص الجودة النهائية OQC)',
      location: 'رصيف الشحن والتصدير 04',
      moduleUrl: '/outgoing-quality',
      moduleLabelAr: 'جودة الفحص النهائي (OQC)',
      details: {
        'خطة المعاينة': 'AQL 0.65 عينة 50 مضخة',
        'نتيجة الفحص': 'صفر عيوب في العينة المعتمدة',
        'تاريخ الإفراج': '2026-10-14'
      },
      x: 725, y: 395, w: 260, h: 60
    },

    // ------------------------------------------------------------------------
    // CONTAINER 7: 7. العميل والشكوى والتتبع العكسي - Bottom Right
    // ------------------------------------------------------------------------
    {
      id: 'CUST-AL-AMAL',
      containerId: 7,
      category: 'customer',
      titleAr: 'العميل: شركة الأمل للمعدات الصناعية',
      titleEn: 'Customer: Al-Amal Industrial Equipment Co.',
      subtitleAr: 'استلام دفعة المضخات بعقد توريد سنوي رقم CON-2026-99',
      subtitleEn: 'Received pump batch under contract CON-2026-99',
      code: 'CUST-EG-088',
      lotOrBatch: 'BATCH-2026-901',
      status: 'pass',
      statusLabelAr: 'عميل معتمد',
      statusLabelEn: 'Approved Customer',
      statusColor: '#00A3E0',
      isStopPoint: false,
      stopReasonAr: 'تم تسليم الشحنة للعميل بنجاح.',
      nextStepAr: 'المتابعة الميدانية للتشغيل لدى العميل.',
      assignedTo: 'أحمد نبيل (إدارة خدمة العملاء)',
      location: 'موقع العميل - المنطقة الصناعية بالعاشر',
      moduleUrl: '/quality/records/complaints',
      moduleLabelAr: 'سجلات العملاء',
      details: {
        'الكمية المسلمة': '238 مضخة',
        'تاريخ التسليم': '2026-10-14'
      },
      x: 725, y: 555, w: 260, h: 48
    },
    {
      id: 'CMP-2026-101',
      containerId: 7,
      category: 'complaint',
      titleAr: 'CMP-2026-101: شكوى عميل',
      titleEn: 'CMP-2026-101: Customer Complaint',
      subtitleAr: 'تسريب زيت عند ضغط تشغيل 280 بار في موقع العميل',
      subtitleEn: 'Oil leakage at 280 bar during field operation',
      code: 'CMP-2026-101',
      lotOrBatch: 'BATCH-2026-901',
      status: 'investigation',
      statusLabelAr: 'تتبع عكسي شامل وتحقيق',
      statusLabelEn: 'Reverse Traceability Active',
      statusColor: '#8B5CF6',
      isStopPoint: true,
      stopReasonAr: '⚡ تتبع عكسي فوري! أبلغ العميل عن تسريب في وحدة واحدة تعمل تحت ضغط استثنائي 280 بار. تم تفعيل التتبع العكسي في الخريطة للرجوع إلى شحنة التجميع وعزم الربط والمواد الخام الأصلية.',
      nextStepAr: 'إرسال وحدة بديلة فوراً واسترداد القطعة المعيبة للتحليل المعملي.',
      assignedTo: 'م. إيناس فوزي (مهندسة جودة العملاء)',
      location: 'مختبر تحليل مرتجعات العملاء',
      moduleUrl: '/quality/records/complaints',
      moduleLabelAr: 'شكاوى العملاء والمردودات',
      details: {
        'الرقم المرجعي للعميل': 'TICKET-AMAL-774',
        'نوع الضرر': 'تسريب زيت هيدروليكي ميداني',
        'الإجراء المتخذ': 'تفعيل مسار التتبع العكسي الكامل 8D'
      },
      x: 725, y: 625, w: 260, h: 60
    }
  ], []);

  // Currently selected node object
  const activeNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || nodes[0];
  }, [nodes, selectedNodeId]);

  // Determine which nodes and connections are highlighted based on activePreset
  const highlightInfo = useMemo(() => {
    if (activePreset === 'all') {
      return {
        activeNodeIds: nodes.map(n => n.id),
        focusStopPointId: null
      };
    }
    if (activePreset === 'seal-lot-02') {
      return {
        activeNodeIds: ['RM-ORING-02', 'NCR-SUP-2026-001'],
        focusStopPointId: 'RM-ORING-02'
      };
    }
    if (activePreset === 'batch-901') {
      return {
        activeNodeIds: ['RM-ALUM-01', 'RM-BOLT-04', 'RM-OIL-05', 'BATCH-2026-901', 'DEF-901B', 'DEF-901A', 'AUD-2026-901', 'NCR-2026-901', 'CAPA-2026-901'],
        focusStopPointId: 'DEF-901B'
      };
    }
    if (activePreset === 'complaint-101') {
      return {
        activeNodeIds: ['CMP-2026-101', 'CUST-AL-AMAL', 'INS-2026-OQC-901', 'BATCH-2026-901', 'DEF-901B', 'NCR-2026-901', 'CAPA-2026-901'],
        focusStopPointId: 'CMP-2026-101'
      };
    }
    if (activePreset === 'valve-lot-03') {
      return {
        activeNodeIds: ['RM-VALV-03', 'BATCH-2026-901', 'INS-2026-OQC-901', 'CUST-AL-AMAL'],
        focusStopPointId: null
      };
    }
    return { activeNodeIds: nodes.map(n => n.id), focusStopPointId: null };
  }, [activePreset, nodes]);

  // Preset Selection Action
  const applyPreset = (preset: PresetJourney, defaultNodeId?: string) => {
    setActivePreset(preset);
    if (defaultNodeId) {
      setSelectedNodeId(defaultNodeId);
    }
    const titles = {
      'all': 'عرض خريطة المصنع التتبعية الكاملة',
      'batch-901': 'تتبع تشغيلة التجميع BATCH-901 (توقف بالتجميع ومعالجة CAPA)',
      'seal-lot-02': 'تتبع خامة مانع التسرب LOT-02 (توقف حظر الاستلام IQC ومطابقة مورد)',
      'complaint-101': 'تتبع عكسي لشكوى العميل CMP-101 إلى جذر المشكلة والتجميع',
      'valve-lot-03': 'تتبع مسار مطابق 100% لخامة الصمامات LOT-03 حتى التسليم'
    };
    toast.info(titles[preset]);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full ${isFullscreen ? 'h-screen fixed inset-0 z-50 bg-[#070b14]' : 'h-[calc(100vh-80px)] min-h-[640px] max-h-[960px]'} bg-[#070b14] text-white flex flex-col font-sans overflow-hidden select-none`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* ==================================================================== */}
      {/* TOP CONTROL BAR: TITLE, JOURNEY PRESETS, ZOOM, SCREEN CONTROLS */}
      {/* ==================================================================== */}
      <header className="flex-none px-4 py-2.5 bg-slate-900/90 border-b border-white/10 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-30">
        {/* Left / Start: Title & Live Beacon */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0066CC] to-[#00A3E0] flex items-center justify-center shadow-lg shadow-[#0066CC]/30">
            <Network className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-black text-white tracking-wide">
                {isAr ? 'خريطة الجودة التتبعية الحية (Single-Screen Blueprint)' : 'Live Quality Blueprint & Stop-Point Map'}
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                {isAr ? 'خريطة حية موحدة' : 'LIVE MAP'}
              </span>
            </div>
            <p className="text-[11px] text-white/45 hidden sm:block">
              {isAr ? 'عرض بصري متكامل للهيكل الصناعي الـ 7 كتل - تتبع نقاط التوقف ومسارات التدفق في شاشة واحدة' : 'Single-screen factory flow: inspect stop points and navigate anywhere with 1 click'}
            </p>
          </div>
        </div>

        {/* Center: 5 Interactive Journey Presets */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto max-w-full">
          <button
            onClick={() => applyPreset('all', 'DEF-901B')}
            className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activePreset === 'all' 
                ? 'bg-[#00A3E0] text-slate-950 shadow-md shadow-[#00A3E0]/30' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isAr ? 'الخريطة الكاملة' : 'Full Map'}</span>
          </button>

          <button
            onClick={() => applyPreset('seal-lot-02', 'RM-ORING-02')}
            className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activePreset === 'seal-lot-02' 
                ? 'bg-red-500 text-white shadow-md shadow-red-500/30 animate-pulse' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
            <span>{isAr ? '1. حظر لوت مانع تسرب (IQC)' : '1. IQC Stop (Seal Lot)'}</span>
          </button>

          <button
            onClick={() => applyPreset('batch-901', 'DEF-901B')}
            className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activePreset === 'batch-901' 
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>{isAr ? '2. تشغيلة تجميع BATCH-901' : '2. Assembly Batch 901'}</span>
          </button>

          <button
            onClick={() => applyPreset('complaint-101', 'CMP-2026-101')}
            className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activePreset === 'complaint-101' 
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-300"></span>
            <span>{isAr ? '3. تتبع عكسي لشكوى عميل' : '3. Reverse Traceability'}</span>
          </button>

          <button
            onClick={() => applyPreset('valve-lot-03', 'RM-VALV-03')}
            className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activePreset === 'valve-lot-03' 
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-950" />
            <span>{isAr ? '4. مسار مطابق 100%' : '4. 100% Pass Flow'}</span>
          </button>
        </div>

        {/* Right / End: Zoom & Screen Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`p-2 rounded-xl text-xs font-bold transition-all border ${
              showLegend ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-white/5 text-white/70 border-white/10 hover:text-white'
            }`}
            title={isAr ? 'مفتاح الخريطة' : 'Map Legend'}
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={() => setZoomLevel(prev => Math.max(0.7, prev - 0.1))}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
            title={isAr ? 'تصغير' : 'Zoom Out'}
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-[11px] font-mono px-1.5 text-white/50">{Math.round(zoomLevel * 100)}%</span>

          <button
            onClick={() => setZoomLevel(prev => Math.min(1.5, prev + 0.1))}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
            title={isAr ? 'تكبير' : 'Zoom In'}
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => setZoomLevel(1)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
            title={isAr ? 'إعادة الضبط لملء الشاشة' : 'Reset to Fit'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-400 hover:text-cyan-300 transition-all"
            title={isAr ? 'ملء كامل الشاشة (Presentation Mode)' : 'Toggle Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* MAIN VIEWPORT: THE BLUEPRINT CANVAS (EXACT TOPOLOGY ON SINGLE SCREEN) */}
      {/* ==================================================================== */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center p-2 bg-[#060a12] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]">
        {/* Transformable Canvas Container with Zoom */}
        <div 
          className="relative w-full h-full max-w-[1400px] max-h-[860px] transition-transform duration-300 origin-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* ------------------------------------------------------------------ */}
          {/* SVG LAYER: CONNECTORS, BUS LINES, DASHED LOOPS, ARROWS & BADGES     */}
          {/* ------------------------------------------------------------------ */}
          <svg 
            viewBox="0 0 1400 860" 
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Standard Cyan Arrow */}
              <marker id="arrow-cyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#00A3E0" />
              </marker>

              {/* Red Warning Arrow */}
              <marker id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#EF4444" />
              </marker>

              {/* Purple Reverse Arrow */}
              <marker id="arrow-purple" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#A855F7" />
              </marker>

              {/* Green Success Arrow */}
              <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#10B981" />
              </marker>
            </defs>

            {/* 1. PATH: Raw Material 2 (FAIL) ➔ Supplier NCR (Downwards) */}
            <g className={activePreset === 'seal-lot-02' ? 'stroke-red-500' : 'stroke-red-500/70'}>
              <line 
                x1="167.5" y1="118" 
                x2="167.5" y2="500" 
                strokeWidth="2.5" 
                strokeDasharray={activePreset === 'seal-lot-02' ? '6,4' : 'none'}
                markerEnd="url(#arrow-red)" 
              />
              {/* Badge label on the path: تصعيد إلى */}
              <rect x="135" y="300" width="65" height="20" rx="4" fill="#1E293B" stroke="#EF4444" strokeWidth="1" />
              <text x="167.5" y="314" fill="#FCA5A5" fontSize="10" fontWeight="bold" textAnchor="middle">تصعيد إلى</text>
            </g>

            {/* 2. PATH: Supplier NCR ➔ Origin Root Cause Loop (Dashed Back Up) */}
            <g className={activePreset === 'seal-lot-02' ? 'stroke-red-400' : 'stroke-white/30'}>
              <path 
                d="M 65 532 L 30 532 L 30 20 L 167.5 20 L 167.5 50" 
                fill="none" 
                strokeWidth="1.5" 
                strokeDasharray="5,4" 
                markerEnd="url(#arrow-red)" 
              />
              <rect x="35" y="420" width="65" height="18" rx="4" fill="#0F172A" stroke="#EF4444" strokeWidth="1" />
              <text x="67.5" y="433" fill="#F87171" fontSize="9" fontWeight="bold" textAnchor="middle">أصل المشكلة</text>
            </g>

            {/* 3. PATH: Passing Raw Materials ➔ Assembly Batch BATCH-901 Bus Line */}
            <g className={activePreset === 'batch-901' || activePreset === 'valve-lot-03' ? 'stroke-emerald-400' : 'stroke-white/40'}>
              {/* Horizontal collector bar */}
              <path d="M 437.5 118 L 437.5 145 L 1237.5 145 L 1237.5 118" fill="none" strokeWidth="2" />
              <line x1="707.5" y1="118" x2="707.5" y2="145" strokeWidth="2" />
              <line x1="977.5" y1="118" x2="977.5" y2="145" strokeWidth="2" />
              {/* Central drop into BATCH-2026-901 */}
              <line x1="690" y1="145" x2="690" y2="195" strokeWidth="2.5" markerEnd="url(#arrow-green)" />
            </g>

            {/* 4. PATH: Assembly Batch ➔ 3 Defects Branching */}
            <g className={activePreset === 'batch-901' ? 'stroke-cyan-400' : 'stroke-white/40'}>
              <path d="M 690 237 L 690 252 L 467.5 252 L 467.5 265" fill="none" strokeWidth="2" markerEnd="url(#arrow-red)" />
              <path d="M 690 237 L 690 265" fill="none" strokeWidth="2" markerEnd="url(#arrow-cyan)" />
              <path d="M 690 237 L 690 252 L 912.5 252 L 912.5 265" fill="none" strokeWidth="2" markerEnd="url(#arrow-red)" />
            </g>

            {/* 5. PATH: Defect 901B (Leak) ➔ Internal NCR-901 */}
            <g className={activePreset === 'batch-901' ? 'stroke-red-500' : 'stroke-red-500/50'}>
              <path d="M 467.5 319 L 467.5 770 L 550 770" fill="none" strokeWidth="2" markerEnd="url(#arrow-red)" />
            </g>

            {/* 6. PATH: Defect 901A (Over-torque) ➔ Control Plan / LPA Audit (Container 4) */}
            <g className={activePreset === 'batch-901' ? 'stroke-amber-400' : 'stroke-white/30'}>
              <path d="M 912.5 319 L 912.5 345 L 610 345 L 610 595 L 585 595" fill="none" strokeWidth="1.5" strokeDasharray="5,4" markerEnd="url(#arrow-cyan)" />
            </g>

            {/* 7. PATH: Control Plan CP-PUMP-01 ➔ Process Audit AUD-901 */}
            <g stroke="#00A3E0" strokeWidth="2">
              <line x1="487.5" y1="648" x2="487.5" y2="672" markerEnd="url(#arrow-cyan)" />
            </g>

            {/* 8. PATH: Process Audit AUD-901 ➔ Internal NCR-901 */}
            <g stroke="#EF4444" strokeWidth="2">
              <path d="M 487.5 724 L 487.5 770 L 550 770" fill="none" markerEnd="url(#arrow-red)" />
            </g>

            {/* 9. PATH: Internal NCR ➔ CAPA Corrective Action */}
            <g stroke="#10B981" strokeWidth="2.5">
              <line x1="690" y1="790" x2="690" y2="800" markerEnd="url(#arrow-green)" />
            </g>

            {/* 10. PATH: CAPA Loop ➔ Root Cause feedback to DEF-901A (Dashed) */}
            <g className={activePreset === 'batch-901' ? 'stroke-cyan-300' : 'stroke-white/30'}>
              <path 
                d="M 550 824 L 330 824 L 330 292 L 370 292" 
                fill="none" 
                strokeWidth="1.5" 
                strokeDasharray="5,4" 
                markerEnd="url(#arrow-cyan)" 
              />
              <rect x="335" y="813" width="75" height="18" rx="4" fill="#0F172A" stroke="#00A3E0" strokeWidth="1" />
              <text x="372.5" y="826" fill="#8BE3FF" fontSize="9" fontWeight="bold" textAnchor="middle">السبب الجذري</text>
            </g>

            {/* 11. PATH: Assembly Container 3 ➔ Outgoing Quality (OQC) */}
            <g stroke="#00A3E0" strokeWidth="2">
              <line x1="855" y1="335" x2="855" y2="395" markerEnd="url(#arrow-cyan)" />
            </g>

            {/* 12. PATH: OQC ➔ Customer Delivery */}
            <g stroke="#10B981" strokeWidth="2">
              <line x1="855" y1="455" x2="855" y2="555" markerEnd="url(#arrow-green)" />
            </g>

            {/* 13. PATH: Customer ➔ Customer Complaint CMP-101 */}
            <g stroke="#EF4444" strokeWidth="2">
              <line x1="855" y1="603" x2="855" y2="625" markerEnd="url(#arrow-red)" />
            </g>

            {/* 14. PATH: Customer Complaint ➔ Reverse Traceability UP into OQC & Assembly (Dashed) */}
            <g className={activePreset === 'complaint-101' ? 'stroke-purple-400' : 'stroke-purple-500/50'}>
              <path 
                d="M 985 655 L 1025 655 L 1025 425 L 985 425" 
                fill="none" 
                strokeWidth="2" 
                strokeDasharray="6,4" 
                markerEnd="url(#arrow-purple)" 
              />
              <rect x="990" y="530" width="85" height="20" rx="4" fill="#1E1B4B" stroke="#A855F7" strokeWidth="1" />
              <text x="1032.5" y="544" fill="#D8B4FE" fontSize="9" fontWeight="bold" textAnchor="middle">تتبع عكسي شامل</text>
            </g>

            {/* 15. PATH: Complaint ➔ Quality Investigation (NCR/CAPA) (Dashed) */}
            <g className={activePreset === 'complaint-101' ? 'stroke-purple-400' : 'stroke-purple-500/50'}>
              <path 
                d="M 725 655 L 690 655 L 690 748" 
                fill="none" 
                strokeWidth="1.5" 
                strokeDasharray="5,4" 
                markerEnd="url(#arrow-purple)" 
              />
              <rect x="670" y="695" width="70" height="18" rx="4" fill="#1E1B4B" stroke="#A855F7" strokeWidth="1" />
              <text x="705" y="708" fill="#D8B4FE" fontSize="9" fontWeight="bold" textAnchor="middle">تحقيق الجودة</text>
            </g>
          </svg>

          {/* ------------------------------------------------------------------ */}
          {/* THE 7 FACTORY CONTAINER FRAMES (BORDERED BOXES MATCHING DIAGRAM)   */}
          {/* ------------------------------------------------------------------ */}

          {/* CONTAINER 1: 1. الخامات الواردة (IQC) */}
          <div 
            className="absolute rounded-2xl border border-slate-700/80 bg-slate-900/40 backdrop-blur-sm p-2 transition-all hover:border-cyan-500/40"
            style={{ left: 30, top: 15, width: 1340, height: 115 }}
          >
            <div className="flex items-center justify-between px-2 pb-1 text-[11px] font-black text-cyan-400 border-b border-white/5 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-cyan-400" />
                1. الخامات الواردة (IQC)
              </span>
              <span className="text-[10px] text-white/40">5 شحنات واردة ومطابقة المواصفات</span>
            </div>
          </div>

          {/* CONTAINER 2: 2. عدم مطابقة مورد */}
          <div 
            className="absolute rounded-2xl border border-red-500/40 bg-red-950/20 backdrop-blur-sm p-2 transition-all"
            style={{ left: 50, top: 465, width: 235, height: 115 }}
          >
            <div className="flex items-center justify-between px-1 pb-1 text-[11px] font-black text-red-400 border-b border-red-500/20 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                2. عدم مطابقة مورد
              </span>
            </div>
          </div>

          {/* CONTAINER 3: 3. خط التجميع ومسجل العيوب */}
          <div 
            className="absolute rounded-2xl border border-slate-700/80 bg-slate-900/40 backdrop-blur-sm p-2 transition-all hover:border-cyan-500/40"
            style={{ left: 350, top: 160, width: 680, height: 175 }}
          >
            <div className="flex items-center justify-between px-2 pb-1 text-[11px] font-black text-cyan-400 border-b border-white/5 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                3. خط التجميع ومسجل العيوب
              </span>
              <span className="text-[10px] text-white/40">خط التجميع 02 ورصد الانحرافات اللحظية</span>
            </div>
          </div>

          {/* CONTAINER 4: 4. خطة المراقبة والتدقيق الداخلي */}
          <div 
            className="absolute rounded-2xl border border-slate-700/80 bg-slate-900/40 backdrop-blur-sm p-2 transition-all hover:border-amber-500/40"
            style={{ left: 370, top: 565, width: 235, height: 175 }}
          >
            <div className="flex items-center justify-between px-1 pb-1 text-[11px] font-black text-amber-400 border-b border-white/5 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                4. خطة المراقبة والتدقيق الداخلي
              </span>
            </div>
          </div>

          {/* CONTAINER 5: 5. حلقة المعالجة والتحسين المغلقة */}
          <div 
            className="absolute rounded-2xl border border-purple-500/40 bg-purple-950/20 backdrop-blur-sm p-2 transition-all"
            style={{ left: 525, top: 715, width: 330, height: 140 }}
          >
            <div className="flex items-center justify-between px-1 pb-1 text-[11px] font-black text-purple-300 border-b border-purple-500/20 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                5. حلقة المعالجة والتحسين المغلقة
              </span>
            </div>
          </div>

          {/* CONTAINER 6: 6. الفحص الصادر (OQC) */}
          <div 
            className="absolute rounded-2xl border border-slate-700/80 bg-slate-900/40 backdrop-blur-sm p-2 transition-all hover:border-emerald-500/40"
            style={{ left: 710, top: 360, width: 290, height: 110 }}
          >
            <div className="flex items-center justify-between px-1 pb-1 text-[11px] font-black text-emerald-400 border-b border-white/5 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                6. الفحص الصادر (OQC)
              </span>
            </div>
          </div>

          {/* CONTAINER 7: 7. العميل والشكوى والتتبع العكسي */}
          <div 
            className="absolute rounded-2xl border border-slate-700/80 bg-slate-900/40 backdrop-blur-sm p-2 transition-all hover:border-purple-500/40"
            style={{ left: 710, top: 520, width: 290, height: 180 }}
          >
            <div className="flex items-center justify-between px-1 pb-1 text-[11px] font-black text-purple-400 border-b border-white/5 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                7. العميل والشكوى والتتبع العكسي
              </span>
            </div>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* THE 15 INTERACTIVE CARD NODES OVERLAY                               */}
          {/* ------------------------------------------------------------------ */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isHovered = hoveredNodeId === node.id;
            const isHighlighted = highlightInfo.activeNodeIds.includes(node.id);
            const isFocusStop = highlightInfo.focusStopPointId === node.id || (node.isStopPoint && activePreset === 'all');

            return (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                style={{
                  left: node.x,
                  top: node.y,
                  width: node.w,
                  height: node.h,
                }}
                className={`absolute z-20 rounded-xl cursor-pointer transition-all duration-200 select-none flex flex-col justify-center px-3 py-1.5 border ${
                  isSelected 
                    ? 'ring-2 ring-cyan-400 border-cyan-400 bg-cyan-950/80 shadow-lg shadow-cyan-500/30 scale-105 z-30'
                    : isFocusStop
                    ? 'border-red-500 bg-red-950/70 shadow-lg shadow-red-500/30 animate-pulse'
                    : isHighlighted
                    ? 'border-white/20 bg-slate-900/90 hover:border-cyan-400/80 hover:bg-slate-800'
                    : 'border-white/5 bg-slate-950/60 opacity-40 hover:opacity-100'
                }`}
              >
                {/* Stop Point Beacon Light */}
                {node.isStopPoint && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 border border-white text-[9px] font-black text-white items-center justify-center">
                      !
                    </span>
                  </span>
                )}

                {/* Node Title & Status Badge */}
                <div className="flex items-center justify-between gap-1">
                  <h3 className="text-[11px] font-black text-white leading-tight truncate">
                    {node.titleAr}
                  </h3>
                  <span 
                    className="text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: `${node.statusColor}22`,
                      color: node.statusColor,
                      border: `1px solid ${node.statusColor}55`
                    }}
                  >
                    {node.status === 'pass' ? 'PASS' : node.status === 'fail' ? 'FAIL' : node.statusLabelAr.split(' ')[0]}
                  </span>
                </div>

                {/* Subtitle / Key Spec */}
                {node.subtitleAr && (
                  <p className="text-[9px] text-white/50 truncate mt-0.5">
                    {node.subtitleAr}
                  </p>
                )}

                {/* Hover Quick Action Cue */}
                {(isHovered || isSelected) && (
                  <div className="mt-0.5 flex items-center justify-between text-[8px] text-cyan-300 font-bold border-t border-white/10 pt-0.5">
                    <span>انقر لمعاينة التفاصيل ↗</span>
                    <span className="text-white/40">{node.code}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ================================================================== */}
        {/* SLIDE-OVER COCKPIT INSPECTOR (SIDE DRAWER WHEN A NODE IS CLICKED) */}
        {/* ================================================================== */}
        {selectedNodeId && activeNode && (
          <aside 
            className="absolute top-0 bottom-0 left-0 w-full sm:w-[420px] bg-slate-950/95 border-r border-white/15 backdrop-blur-xl shadow-2xl z-40 flex flex-col transition-all duration-300 animate-in slide-in-from-left"
          >
            {/* Header */}
            <div className="flex-none p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2">
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white"
                  style={{ backgroundColor: activeNode.statusColor }}
                >
                  {activeNode.containerId}
                </div>
                <div>
                  <h2 className="text-sm font-black text-white">فحص سجل الجودة التفاعلي</h2>
                  <p className="text-[10px] text-white/45 font-mono">{activeNode.code}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedNodeId(null)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Details Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Title & Status */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  المحطة: {activeNode.containerId}. {activeNode.moduleLabelAr}
                </span>
                <h3 className="text-sm font-black text-white mt-1 leading-snug">
                  {activeNode.titleAr}
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  {activeNode.subtitleAr}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <span 
                    className="px-2.5 py-1 rounded-xl text-xs font-black"
                    style={{
                      backgroundColor: `${activeNode.statusColor}22`,
                      color: activeNode.statusColor,
                      border: `1px solid ${activeNode.statusColor}55`
                    }}
                  >
                    {activeNode.statusLabelAr}
                  </span>
                  {activeNode.lotOrBatch && (
                    <span className="px-2 py-1 rounded-xl text-[11px] font-mono bg-white/5 text-white/70 border border-white/10">
                      {activeNode.lotOrBatch}
                    </span>
                  )}
                </div>
              </div>

              {/* STOP POINT DIAGNOSTICS CARD */}
              <div className={`p-3.5 rounded-2xl border ${
                activeNode.isStopPoint 
                  ? 'bg-red-500/10 border-red-500/40' 
                  : 'bg-emerald-500/10 border-emerald-500/40'
              }`}>
                <div className="flex items-center gap-2">
                  {activeNode.isStopPoint ? (
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <h4 className={`font-black text-xs ${activeNode.isStopPoint ? 'text-red-300' : 'text-emerald-300'}`}>
                    {activeNode.isStopPoint ? 'نقطة توقف نشطة (Stop Point)' : 'مسار سالك ومطابق'}
                  </h4>
                </div>
                <p className="mt-2 text-white/80 leading-relaxed text-[11px]">
                  {activeNode.stopReasonAr}
                </p>

                {activeNode.nextStepAr && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 text-[11px]">
                    <span className="font-black text-cyan-300">الخطوة التالية المطلوبة: </span>
                    <span className="text-white/90">{activeNode.nextStepAr}</span>
                  </div>
                )}
              </div>

              {/* Location & Assigned Engineer */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-white/40 block text-[10px]">المسؤول الحالي</span>
                  <span className="font-bold text-white mt-0.5 block truncate">{activeNode.assignedTo || 'فريق الجودة'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-white/40 block text-[10px]">الموقع الصناعي</span>
                  <span className="font-bold text-white mt-0.5 block truncate">{activeNode.location || 'خط الإنتاج'}</span>
                </div>
              </div>

              {/* Technical Attributes Table */}
              {activeNode.details && Object.keys(activeNode.details).length > 0 && (
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="font-black text-white/60 text-[10px] uppercase tracking-wider mb-2">بيانات الفحص والتشغيلة</h4>
                  <div className="space-y-1.5 text-[11px]">
                    {Object.entries(activeNode.details).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between py-1 border-b border-white/5">
                        <span className="text-white/50">{k}</span>
                        <span className="font-bold text-white font-mono">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions: ONE-CLICK JUMP TO SYSTEM TAB */}
            <div className="flex-none p-4 border-t border-white/10 bg-slate-900/90 space-y-2">
              <button
                onClick={() => {
                  toast.success(`جاري الانتقال إلى ${activeNode.moduleLabelAr}...`);
                  navigate(activeNode.moduleUrl);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-[#0066CC] to-[#00A3E0] hover:brightness-110 active:scale-95 text-white font-black text-xs rounded-xl shadow-lg shadow-[#0066CC]/30 transition-all uppercase tracking-wider"
              >
                <ExternalLink className="w-4 h-4" />
                الانتقال المباشر لشاشة {activeNode.moduleLabelAr} ↗
              </button>

              <button
                onClick={() => {
                  toast.success(`تم استخراج تقرير التتبع للسجل ${activeNode.code}`, {
                    description: 'شهادة التتبع المغلقة جاهزة للتدقيق الخارجي.'
                  });
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold text-xs rounded-xl transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                تصدير شهادة التتبع الشاملة (Traceability)
              </button>
            </div>
          </aside>
        )}

        {/* ================================================================== */}
        {/* MAP LEGEND OVERLAY (WHEN TOGGLED)                                  */}
        {/* ================================================================== */}
        {showLegend && (
          <div className="absolute bottom-4 right-4 bg-slate-900/95 border border-white/15 rounded-2xl p-3.5 shadow-2xl z-30 max-w-xs text-xs space-y-2 backdrop-blur-md">
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <h4 className="font-black text-white text-xs">مفتاح مسارات الخريطة</h4>
              <button onClick={() => setShowLegend(false)} className="text-white/40 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-4 h-0.5 bg-[#00A3E0]"></span>
                <span className="text-white/80">مسار تدفق المواد والتشغيل</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-0.5 bg-red-500"></span>
                <span className="text-white/80">تصعيد عدم المطابقة ونقاط التوقف</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-0.5 border-t border-dashed border-purple-400"></span>
                <span className="text-white/80">مسار التتبع العكسي والتحقيق الميداني</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-0.5 border-t border-dashed border-cyan-300"></span>
                <span className="text-white/80">حلقة المعالجة الجذرية (CAPA Poka-Yoke)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                <span className="text-red-300 font-bold">نقطة توقف حرجة بالخط</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QualityControlTower;
