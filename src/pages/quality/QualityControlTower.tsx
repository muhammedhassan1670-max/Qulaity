// @ts-nocheck
// QMS Enterprise 4.0 - Live Quality Plant Floor Layout & Control Tower
// A real industrial plant map / 2D shopfloor layout with live stop-point beacons & deep navigation
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Network, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Clock, 
  ShieldAlert, ShieldCheck, Search, RefreshCw, ExternalLink, Eye, 
  Building, Cpu, Wrench, PackageCheck, Users, Truck, Sparkles, Check, 
  ChevronRight, X, Info, Zap, Layers, Activity, FileText, Maximize2, Minimize2,
  ZoomIn, ZoomOut, RotateCcw, HelpCircle, Factory, Compass, MapPin, Gauge, Box, Radio
} from 'lucide-react';
import { seedComprehensiveQualityLifecycle } from '../../services/seedLifecycleDemo';
import { useTranslation } from '../../utils/translations';

export type PresetJourney = 'all' | 'batch-901' | 'seal-lot-02' | 'valve-lot-03' | 'complaint-101';
export type ViewMode = 'plant-layout' | 'flow-blueprint';

export interface PlantEntity {
  id: string;
  zone: 'receiving' | 'assembly' | 'lab' | 'oqc' | 'shipping';
  zoneNameAr: string;
  zoneNameEn: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  code: string;
  lotOrBatch?: string;
  status: 'pass' | 'fail' | 'conditional' | 'investigation' | 'quarantine';
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
  // Plant Layout Coordinates (1400 x 860)
  lx: number;
  ly: number;
  lw: number;
  lh: number;
  iconType: string;
}

export function QualityControlTower() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [viewMode, setViewMode] = useState<ViewMode>('plant-layout');
  const [activePreset, setActivePreset] = useState<PresetJourney>('all');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>('STATION-PRESSURE-TEST');
  const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Seed lifecycle demo data on mount
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

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // ============================================================================
  // REAL FACTORY FLOOR ENTITIES (MACHINES, STATIONS, BAYS, ROOMS)
  // ============================================================================
  const entities: PlantEntity[] = useMemo(() => [
    // ------------------------------------------------------------------------
    // ZONE A: رصيف الاستلام وفحص المواد الخام (RECEIVING & RAW MATERIALS BAY)
    // ------------------------------------------------------------------------
    {
      id: 'PALLET-SEAL-FAIL',
      zone: 'receiving',
      zoneNameAr: 'رصيف الاستلام 01 - قفص الحجز',
      zoneNameEn: 'Receiving Dock 01 - Quarantine Cage',
      titleAr: 'قفص الحجز: خامة مانع التسرب (LOT-OR-02)',
      titleEn: 'Quarantine Cage: Rubber O-Ring (LOT-OR-02)',
      subtitleAr: 'لوت مرفوض ومحجوز برقم QR-88 - تشوه القطر الداخلي',
      code: 'LOT-2026-OR-02',
      lotOrBatch: 'LOT-2026-OR-02',
      status: 'fail',
      statusLabelAr: 'مرفوض ومحجوز (IQC)',
      statusLabelEn: 'IQC Rejected',
      statusColor: '#EF4444',
      isStopPoint: true,
      stopReasonAr: '🚨 نقطة توقف في رصيف الاستلام! الشحنة محجوزة داخل قفص العزل الأحمر وغير مصرح بدخولها لصالة الإنتاج.',
      nextStepAr: 'استكمال إشعار رفض المورد NCR-SUP-2026-001 وشحن المرتجع.',
      assignedTo: 'م. أحمد شكري (مهندس فحص الاستلام)',
      location: 'رصيف 01 - قفص العزل الفولاذي',
      moduleUrl: '/compliance/hub/inspection',
      moduleLabelAr: 'فحص الاستلام (IQC)',
      details: {
        'المورد': 'شركة المطاط الحديثة',
        'العينة المفحوصة': '125 قطعة AQL 1.0',
        'العيوب': '11 عينة غير مطابقة للصلادة',
        'رقم تقرير المورد': 'NCR-SUP-2026-001'
      },
      lx: 70, ly: 100, lw: 165, lh: 75,
      iconType: 'quarantine'
    },
    {
      id: 'PALLET-VALVES-PASS',
      zone: 'receiving',
      zoneNameAr: 'مستودع الخامات - رفوف الصمامات',
      zoneNameEn: 'Raw Materials - Valves Rack',
      titleAr: 'باليت الصمامات: صمامات أمان (LOT-VL-03)',
      titleEn: 'Valves Pallet: Safety Valves (LOT-VL-03)',
      subtitleAr: 'شحنة مطابقة 100% ومصرح بصرفها لخط التجميع',
      code: 'LOT-2026-VL-03',
      lotOrBatch: 'LOT-2026-VL-03',
      status: 'pass',
      statusLabelAr: 'مطابق 100% (معتمد)',
      statusLabelEn: '100% Passed',
      statusColor: '#10B981',
      isStopPoint: false,
      stopReasonAr: 'لا يوجد عائق. الشحنة معتمدة وصالحة للتشغيل.',
      nextStepAr: 'تغذية محطة تجميع الصمامات 02.',
      assignedTo: 'فني الفحص طارق حسام',
      location: 'مستودع الخامات رف A-14',
      moduleUrl: '/compliance/hub/inspection',
      moduleLabelAr: 'فحص الاستلام (IQC)',
      details: {
        'الكمية المعتمدة': '1,200 صمام',
        'ضغط الفتح': '250 بار مطابق تماماً'
      },
      lx: 250, ly: 100, lw: 165, lh: 75,
      iconType: 'pallet'
    },
    {
      id: 'PALLET-BOLTS-CLEAN',
      zone: 'receiving',
      zoneNameAr: 'محطة الغسيل والتنظيف الكيميائي',
      zoneNameEn: 'Chemical Degreasing Station',
      titleAr: 'باليت المسامير: مسامير صلب M8 (LOT-BL-04)',
      titleEn: 'Fasteners Pallet: M8 Bolts (LOT-BL-04)',
      subtitleAr: 'خضعت لفرز وتطهير بالموجات فوق الصوتية',
      code: 'LOT-2026-BL-04',
      lotOrBatch: 'LOT-2026-BL-04',
      status: 'conditional',
      statusLabelAr: 'تم الفرز والتطهير',
      statusLabelEn: 'Cleaned & Sorted',
      statusColor: '#F59E0B',
      isStopPoint: false,
      stopReasonAr: 'تمت إزالة الشوائب الزيتية بنجاح وتجهيز الباليت للصرف.',
      nextStepAr: 'صرف المسامير إلى محطة ربط الغطاء.',
      assignedTo: 'م. حسام بدر',
      location: 'محطة الغسيل الصناعي',
      moduleUrl: '/compliance/hub/inspection',
      moduleLabelAr: 'فحص الاستلام (IQC)',
      details: {
        'الكمية': '10,000 مسمار M8',
        'نسبة النظافة': '100% بعد الموجات الصوتية'
      },
      lx: 70, ly: 195, lw: 165, lh: 75,
      iconType: 'pallet'
    },
    {
      id: 'PALLET-ALUM-CNC',
      zone: 'receiving',
      zoneNameAr: 'ساحة تشغيل سبائك الألومنيوم',
      zoneNameEn: 'Raw Material - Billet Staging',
      titleAr: 'سبائك الألومنيوم 7075 (LOT-AL-01)',
      titleEn: 'Aluminum 7075 Billets (LOT-AL-01)',
      subtitleAr: 'قبول مشروط بتصريح تشغيل DEV-04 للتحكم بالخشونة',
      code: 'LOT-2026-AL-01',
      lotOrBatch: 'LOT-2026-AL-01',
      status: 'conditional',
      statusLabelAr: 'تصريح تشغيل مشروط',
      statusLabelEn: 'Concession Approved',
      statusColor: '#F59E0B',
      isStopPoint: false,
      stopReasonAr: 'تم منح تصريح لتشغيل السطح بسرعة دوران منخفضة بالـ CNC.',
      nextStepAr: 'فحص أول قطعة على ماكينة الخراطة (FAI).',
      assignedTo: 'م. مصطفى رفعت',
      location: 'مدخل ماكينة CNC-01',
      moduleUrl: '/compliance/hub/inspection',
      moduleLabelAr: 'فحص الاستلام (IQC)',
      details: {
        'تصريح انحراف': 'DEV-2026-04',
        'الكمية': '500 سبيكة'
      },
      lx: 250, ly: 195, lw: 165, lh: 75,
      iconType: 'pallet'
    },

    // ------------------------------------------------------------------------
    // ZONE B: صالة الإنتاج وخط التجميع 02 (ASSEMBLY LINE 02)
    // ------------------------------------------------------------------------
    {
      id: 'STATION-CNC-MILLING',
      zone: 'assembly',
      zoneNameAr: 'خط الإنتاج - محطة الخراطة الآلية CNC',
      zoneNameEn: 'Production - Station 01: CNC Machining',
      titleAr: 'محطة 1: ماكينة الخراطة CNC (جسم المضخة)',
      titleEn: 'Station 01: 5-Axis CNC Mill (Pump Housing)',
      subtitleAr: 'تشغيل جسم المضخة وتطبيق معايير التصريح DEV-04',
      code: 'CNC-MCH-01',
      lotOrBatch: 'BATCH-2026-901',
      status: 'pass',
      statusLabelAr: 'تشغيل آلي نشط',
      statusLabelEn: 'Running',
      statusColor: '#10B981',
      isStopPoint: false,
      stopReasonAr: 'الماكينة تعمل بكفاءة ضمن حدود الأبعاد المقررة.',
      nextStepAr: 'تمرير الأجسام المشغلة إلى السير الناقل لمحطة التجميع 02.',
      assignedTo: 'فني التشغيل عاصم ممدوح',
      location: 'خط التجميع - البداية',
      moduleUrl: '/quality-shopfloor',
      moduleLabelAr: 'شاشة صالة الإنتاج',
      details: {
        'سرعة الدوران': '3,200 RPM',
        'زمن الدورة': '4.5 دقيقة/قطعة'
      },
      lx: 500, ly: 110, lw: 175, lh: 95,
      iconType: 'machine'
    },
    {
      id: 'STATION-VALVE-ASSEMBLY',
      zone: 'assembly',
      zoneNameAr: 'خط الإنتاج - محطة تركيب الصمامات',
      zoneNameEn: 'Production - Station 02: Valve Assembly',
      titleAr: 'محطة 2: تركيب الصمامات وموانع التسرب',
      titleEn: 'Station 02: Valve & Seal Assembly',
      subtitleAr: 'تركيب صمامات الأمان وإحكام حلقات المانع الداخلية',
      code: 'ST-ASM-02',
      lotOrBatch: 'BATCH-2026-901',
      status: 'pass',
      statusLabelAr: 'تجميع مطابق',
      statusLabelEn: 'Assembly OK',
      statusColor: '#00A3E0',
      isStopPoint: false,
      stopReasonAr: 'التركيب يتم بسلاسة وفق تعليمات العمل القياسية (SOP).',
      nextStepAr: 'تحريك المضخة على السير إلى محطة ربط الغطاء 03.',
      assignedTo: 'فني التجميع عادل منصور',
      location: 'خط التجميع 02 - المنتصف',
      moduleUrl: '/quality-shopfloor',
      moduleLabelAr: 'شاشة صالة الإنتاج',
      details: {
        'الوحدات المجمعة': '180 مضخة',
        'معدل الإنجاز': '72%'
      },
      lx: 710, ly: 110, lw: 175, lh: 95,
      iconType: 'station'
    },
    {
      id: 'STATION-TORQUE-SCREW',
      zone: 'assembly',
      zoneNameAr: 'خط الإنتاج - محطة ربط مسامير الغطاء',
      zoneNameEn: 'Production - Station 03: Torque Tightening',
      titleAr: 'محطة 3: ربط المسامير بالمفك الذكي (Poka-Yoke)',
      titleEn: 'Station 03: Smart Torque Fastening',
      subtitleAr: 'موقع عيب عزم الزائد DEF-901A والتحسين الجذري CAPA-901',
      code: 'ST-TRQ-03',
      lotOrBatch: 'BATCH-2026-901',
      status: 'conditional',
      statusLabelAr: 'تم تركيب المفك الذكي PLC',
      statusLabelEn: 'Poka-Yoke Active',
      statusColor: '#10B981',
      isStopPoint: false,
      stopReasonAr: 'تم حل مشكلة تفويت القلاووظ بتطبيق مفك رقمي مقفل إلكترونياً.',
      nextStepAr: 'مراقبة منحنى عزم الربط في شاشات SPC.',
      assignedTo: 'م. حازم القاضي',
      location: 'خط التجميع 02 - محطة الربط',
      moduleUrl: '/quality/records/capa',
      moduleLabelAr: 'الإجراءات التصحيحية (CAPA)',
      details: {
        'العزم المحدد': '45 N.m ± 1.5',
        'نوع الحماية': 'Poka-Yoke مقفل مع PLC'
      },
      lx: 920, ly: 110, lw: 185, lh: 95,
      iconType: 'station'
    },
    {
      id: 'STATION-PRESSURE-TEST',
      zone: 'assembly',
      zoneNameAr: 'خط الإنتاج - كابينة اختبار الضغط الهيدروليكي',
      zoneNameEn: 'Production - Station 04: Hydrostatic Test Cell',
      titleAr: 'محطة 4: كابينة اختبار الضغط 280 بار (🚨 توقف الخط)',
      titleEn: 'Station 04: Pressure Test Cell (🚨 STOP POINT)',
      subtitleAr: 'رصد تسريب هيدروليكي DEF-901B وتجميد 12 مضخة معيبة',
      code: 'CELL-HYD-04',
      lotOrBatch: 'BATCH-2026-901',
      status: 'fail',
      statusLabelAr: '🚨 إيقاف فوري للخط (Stop Point)',
      statusLabelEn: 'Line Stoppage (Stop Point)',
      statusColor: '#EF4444',
      isStopPoint: true,
      stopReasonAr: '⚠️ نقطة توقف رئيسية على خط الإنتاج! تم إيقاف تمرير الوحدات بعد رصد تسريب زيت عند ضغط اختبار 250 بار. تم عزل 12 مضخة في صندوق الحظر وإبلاغ إدارة الجودة لفتح NCR داخلي.',
      nextStepAr: 'فحص عزم ربط المسامير وحالة موانع التسرب مع مهندس العمليات قبل تحرير الخط.',
      assignedTo: 'م. ياسر القاضي (فاحص الجودة بالمحطة)',
      location: 'كابينة الضغط المغلقة رقم 04',
      moduleUrl: '/defect-log',
      moduleLabelAr: 'مسجل العيوب الصناعي',
      details: {
        'ضغط الاختبار': '250 - 280 بار',
        'المضخات المحتجزة': '12 مضخة',
        'كود العيب': 'DEF-2026-901B (حرج)',
        'حالة الخط': 'حظر محلي وتصعيد للتحقيق'
      },
      lx: 1140, ly: 110, lw: 200, lh: 115,
      iconType: 'alert-cell'
    },

    // ------------------------------------------------------------------------
    // ZONE C: مختبر المعايرة والجودة وغرفة توكيد الجودة (METROLOGY & QA LAB)
    // ------------------------------------------------------------------------
    {
      id: 'LAB-CALIBRATION-BENCH',
      zone: 'lab',
      zoneNameAr: 'مختبر المعايرة - منصة فحص العزم',
      zoneNameEn: 'Metrology Lab - Torque Calibrator',
      titleAr: 'طاولة معايرة المفكات: تدقيق AUD-2026-901',
      titleEn: 'Calibration Bench: Audit Finding AUD-901',
      subtitleAr: 'رصد انتهاء ملصق معايرة مفك المحطة 03 أثناء تدقيق LPA',
      code: 'AUD-2026-901',
      lotOrBatch: 'LPA-Audit',
      status: 'fail',
      statusLabelAr: 'عدم مطابقة تدقيق عملية',
      statusLabelEn: 'Audit Non-Conformance',
      statusColor: '#EF4444',
      isStopPoint: false,
      stopReasonAr: 'كشف التدقيق انتهاء صلاحية معايرة المفك الهوائي القديم منذ 5 أيام.',
      nextStepAr: 'إلزام المعايرة الشفتية وتحديث خطة المراقبة CP-PUMP-01.',
      assignedTo: 'م. إيهاب سلامة (مدقق الجودة)',
      location: 'المختبر المركزي - الغرفة المعقمة',
      moduleUrl: '/compliance/hub/audit',
      moduleLabelAr: 'تدقيق العمليات (LPA)',
      details: {
        'خطة المراقبة': 'CP-PUMP-01 Rev 04',
        'أداة الفحص': 'مقياس عزم رقمي معتمد'
      },
      lx: 70, ly: 390, lw: 175, lh: 85,
      iconType: 'lab'
    },
    {
      id: 'LAB-MRB-ROOM',
      zone: 'lab',
      zoneNameAr: 'غرفة لجنة الجودة ومراجعة المواد (MRB)',
      zoneNameEn: 'MRB & Quality Engineering War Room',
      titleAr: 'غرفة تحليل الأسباب الجذرية: NCR-901 & CAPA-901',
      titleEn: 'Root-Cause Analysis: NCR-901 & CAPA-901',
      subtitleAr: 'حلقة التحسين المغلقة: اعتماد خطة الصيانة وتغيير الأغطية',
      code: 'NCR-2026-901',
      lotOrBatch: 'CAPA-2026-901',
      status: 'investigation',
      statusLabelAr: 'حلقة معالجة مغلقة نشطة',
      statusLabelEn: 'Active Closed-Loop CAPA',
      statusColor: '#8B5CF6',
      isStopPoint: false,
      stopReasonAr: 'اللجنة منعقدة لتحديد الإجراء التصحيحي وإعادة تشغيل الوحدات المعزولة.',
      nextStepAr: 'اعتماد محضر MRB وإعادة إدخال المضخات الـ 12 للاختبار.',
      assignedTo: 'م. وائل ناصر (مدير توكيد الجودة)',
      location: 'مكتب إدارة الجودة الصناعية',
      moduleUrl: '/quality/records/ncr',
      moduleLabelAr: 'سجلات عدم المطابقة (NCR)',
      details: {
        'رقم الـ NCR': 'NCR-2026-901',
        'رقم الـ CAPA': 'CAPA-2026-901',
        'طريقة التحليل': '5-Whys + Ishikawa Fishbone'
      },
      lx: 260, ly: 390, lw: 175, lh: 85,
      iconType: 'office'
    },

    // ------------------------------------------------------------------------
    // ZONE D: الفحص الصادر والشحن والتصدير (OQC & SHIPPING DOCKS)
    // ------------------------------------------------------------------------
    {
      id: 'STATION-OQC-RELEASE',
      zone: 'oqc',
      zoneNameAr: 'محطة الفحص النهائي الصادر والتغليف',
      zoneNameEn: 'Final Outgoing QC & Packaging Bench',
      titleAr: 'طاولة الفحص الصادر: INS-2026-OQC-901',
      titleEn: 'OQC Inspection Bench: INS-OQC-901',
      subtitleAr: 'اعتماد شحن عينة 50 مضخة بعد عزل المعيب بنجاح',
      code: 'INS-2026-OQC-901',
      lotOrBatch: 'BATCH-2026-901',
      status: 'pass',
      statusLabelAr: 'إفراج نهائي معتمد (PASS)',
      statusLabelEn: 'OQC Clearance Passed',
      statusColor: '#10B981',
      isStopPoint: false,
      stopReasonAr: 'اجتازت عينة الـ 50 مضخة الفحص النهائي وصدر إذن الإفراج.',
      nextStepAr: 'تغليف الدفعة وطباعة الباركود ونقلها لرصيف الشحن 03.',
      assignedTo: 'م. مروان صلاح',
      location: 'محطة الفحص النهائي OQC',
      moduleUrl: '/outgoing-quality',
      moduleLabelAr: 'الفحص الصادر (OQC)',
      details: {
        'خطة الفحص': 'AQL 0.65 عينة 50 مضخة',
        'المطابقة': '100% بدون أي تسريب ظاهري'
      },
      lx: 550, ly: 570, lw: 220, lh: 85,
      iconType: 'station'
    },
    {
      id: 'DOCK-SHIPPING-TRUCK',
      zone: 'shipping',
      zoneNameAr: 'رصيف الشحن 03 - شاحنة تسليم العميل',
      zoneNameEn: 'Shipping Dock 03 - Customer Delivery Truck',
      titleAr: 'شاحنة التسليم: شركة الأمل للمعدات الصناعية',
      titleEn: 'Delivery Truck: Al-Amal Industrial Equipment',
      subtitleAr: 'تسليم 238 مضخة وتتبع شكوى تسريب الزيت CMP-2026-101',
      code: 'CMP-2026-101',
      lotOrBatch: 'BATCH-2026-901',
      status: 'investigation',
      statusLabelAr: 'تتبع عكسي لشكوى العميل',
      statusLabelEn: 'Reverse Traceability Active',
      statusColor: '#8B5CF6',
      isStopPoint: true,
      stopReasonAr: '⚡ تتبع عكسي ميداني! العميل أبلغ عن تسريب زيت عند ضغط 280 بار في موقع العمل. تم تتبع الشحنة عكسياً على أرضية المصنع من رصيف الشحن حتى كابينة الضغط وعزم المفك.',
      nextStepAr: 'استبدال المضخة للعميل واسترداد القطعة المعيبة للتشريح المعملي.',
      assignedTo: 'م. إيناس فوزي (جودة العملاء)',
      location: 'رصيف الشحن والتصدير 03',
      moduleUrl: '/quality/records/complaints',
      moduleLabelAr: 'شكاوى العملاء والمردودات',
      details: {
        'العميل': 'شركة الأمل للمعدات الصناعية',
        'رقم الشكوى': 'CMP-2026-101',
        'حالة التتبع': 'مسار التتبع العكسي نشط'
      },
      lx: 820, ly: 555, lw: 260, lh: 100,
      iconType: 'truck'
    }
  ], []);

  // Currently selected entity
  const activeEntity = useMemo(() => {
    return entities.find(e => e.id === selectedEntityId) || entities[0];
  }, [entities, selectedEntityId]);

  // Highlight logic for floorplan based on presets
  const floorHighlights = useMemo(() => {
    if (activePreset === 'all') {
      return {
        activeIds: entities.map(e => e.id),
        focusStopId: null
      };
    }
    if (activePreset === 'seal-lot-02') {
      return {
        activeIds: ['PALLET-SEAL-FAIL'],
        focusStopId: 'PALLET-SEAL-FAIL'
      };
    }
    if (activePreset === 'batch-901') {
      return {
        activeIds: ['STATION-CNC-MILLING', 'STATION-VALVE-ASSEMBLY', 'STATION-TORQUE-SCREW', 'STATION-PRESSURE-TEST', 'LAB-MRB-ROOM'],
        focusStopId: 'STATION-PRESSURE-TEST'
      };
    }
    if (activePreset === 'complaint-101') {
      return {
        activeIds: ['DOCK-SHIPPING-TRUCK', 'STATION-OQC-RELEASE', 'STATION-PRESSURE-TEST', 'STATION-TORQUE-SCREW', 'LAB-CALIBRATION-BENCH'],
        focusStopId: 'DOCK-SHIPPING-TRUCK'
      };
    }
    if (activePreset === 'valve-lot-03') {
      return {
        activeIds: ['PALLET-VALVES-PASS', 'STATION-VALVE-ASSEMBLY', 'STATION-OQC-RELEASE', 'DOCK-SHIPPING-TRUCK'],
        focusStopId: null
      };
    }
    return { activeIds: entities.map(e => e.id), focusStopId: null };
  }, [activePreset, entities]);

  const applyPreset = (preset: PresetJourney, defaultId?: string) => {
    setActivePreset(preset);
    if (defaultId) setSelectedEntityId(defaultId);
    const msgs = {
      'all': 'عرض لاي أوت المصنع التفاعلي بالكامل',
      'seal-lot-02': 'تتبع رصيف الاستلام: حظر لوت مانع التسرب داخل قفص العزل',
      'batch-901': 'تتبع خط التجميع: إيقاف الخط عند كابينة اختبار الضغط الهيدروليكي',
      'complaint-101': 'تتبع عكسي ميداني: من رصيف الشحن عبر صالة المصنع للمصدر',
      'valve-lot-03': 'تتبع المسار الأخضر المعتمد: من الاستلام حتى الشحن النهائي'
    };
    toast.info(msgs[preset]);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full ${isFullscreen ? 'h-screen fixed inset-0 z-50 bg-[#070b14]' : 'h-[calc(100vh-80px)] min-h-[640px] max-h-[960px]'} bg-[#070b14] text-white flex flex-col font-sans overflow-hidden select-none`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* ==================================================================== */}
      {/* TOP INDUSTRIAL TOOLBAR                                               */}
      {/* ==================================================================== */}
      <header className="flex-none px-4 py-2.5 bg-slate-900/95 border-b border-white/10 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-30">
        {/* Left / Title & Plant Identifier */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Factory className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-black text-white tracking-wide">
                {isAr ? 'لاي أوت صالة المصنع التفاعلي (Live Plant Floor Map)' : 'Live Factory Floorplan & Quality Map'}
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                {isAr ? 'مصنع رقم 01 - خط 02' : 'PLANT 01 - LINE 02'}
              </span>
            </div>
            <p className="text-[11px] text-white/45 hidden sm:block">
              {isAr ? 'مسقط أفقي حقيقي لأرضية المصنع، الماكينات، مناطق الحظر، ومسارات النقل ونقاط التوقف' : 'Real 2D physical floorplan: machines, quarantine cages, test cells, and live Andon stops'}
            </p>
          </div>
        </div>

        {/* Center: Presets & Focus Filters */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto max-w-full">
          <button
            onClick={() => applyPreset('all', 'STATION-PRESSURE-TEST')}
            className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activePreset === 'all' 
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{isAr ? 'كامل صالة المصنع' : 'Full Floor'}</span>
          </button>

          <button
            onClick={() => applyPreset('seal-lot-02', 'PALLET-SEAL-FAIL')}
            className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activePreset === 'seal-lot-02' 
                ? 'bg-red-500 text-white shadow-md shadow-red-500/30 animate-pulse' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
            <span>{isAr ? '🚨 قفص الحجز (الاستلام)' : 'Quarantine Cage'}</span>
          </button>

          <button
            onClick={() => applyPreset('batch-901', 'STATION-PRESSURE-TEST')}
            className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activePreset === 'batch-901' 
                ? 'bg-red-500 text-white shadow-md shadow-red-500/30 animate-pulse' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-white animate-spin" />
            <span>{isAr ? '🚨 توقف كابينة الضغط' : 'Pressure Cell Stop'}</span>
          </button>

          <button
            onClick={() => applyPreset('complaint-101', 'DOCK-SHIPPING-TRUCK')}
            className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activePreset === 'complaint-101' 
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-300"></span>
            <span>{isAr ? 'تتبع رصيف الشحن' : 'Shipping Dock Trace'}</span>
          </button>

          <button
            onClick={() => applyPreset('valve-lot-03', 'PALLET-VALVES-PASS')}
            className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activePreset === 'valve-lot-03' 
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-950" />
            <span>{isAr ? 'مسار سالك 100%' : '100% Pass Flow'}</span>
          </button>
        </div>

        {/* Right: Zoom & Layout View Mode Switcher */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`p-2 rounded-xl text-xs font-bold transition-all border ${
              showLegend ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-white/5 text-white/70 border-white/10 hover:text-white'
            }`}
            title={isAr ? 'مفتاح رموز المصنع' : 'Factory Legend'}
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
            title={isAr ? 'إعادة الضبط لملء الشاشة' : 'Reset Fit'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-amber-400 hover:text-amber-300 transition-all"
            title={isAr ? 'ملء كامل الشاشة' : 'Toggle Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2D ARCHITECTURAL PLANT FLOOR CANVAS (SINGLE SCREEN LAYOUT)           */}
      {/* ==================================================================== */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center p-2 bg-[#060a12] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]">
        {/* Scalable Factory Viewport */}
        <div 
          className="relative w-full h-full max-w-[1400px] max-h-[860px] transition-transform duration-300 origin-center rounded-3xl border-2 border-slate-700/80 bg-[#09101d] overflow-hidden shadow-2xl shadow-black/80"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* ------------------------------------------------------------------ */}
          {/* FLOOR ARCHITECTURAL CAD GRAPHICS (WALLS, DOORS, CONVEYORS, LANES)  */}
          {/* ------------------------------------------------------------------ */}
          <svg 
            viewBox="0 0 1400 860" 
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Safety Floor Stripe Pattern */}
              <pattern id="safety-stripes" width="20" height="20" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="20" stroke="#F59E0B" strokeWidth="6" opacity="0.3" />
                <line x1="10" y1="0" x2="10" y2="20" stroke="#1E293B" strokeWidth="6" opacity="0.3" />
              </pattern>

              {/* Red Hazard Stripes for Quarantine Area */}
              <pattern id="quarantine-stripes" width="16" height="16" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="16" stroke="#EF4444" strokeWidth="5" opacity="0.4" />
                <line x1="8" y1="0" x2="8" y2="16" stroke="#0F172A" strokeWidth="5" opacity="0.4" />
              </pattern>

              {/* Conveyor Belt Roller Pattern */}
              <pattern id="conveyor-rollers" width="14" height="40" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="14" height="40" fill="#1e293b" />
                <line x1="0" y1="0" x2="14" y2="0" stroke="#334155" strokeWidth="1.5" />
                <line x1="0" y1="20" x2="14" y2="20" stroke="#475569" strokeWidth="2" />
                <circle cx="7" cy="10" r="1.5" fill="#94a3b8" />
                <circle cx="7" cy="30" r="1.5" fill="#94a3b8" />
              </pattern>

              <marker id="flow-arrow-yellow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#F59E0B" />
              </marker>

              <marker id="flow-arrow-green" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#10B981" />
              </marker>

              <marker id="flow-arrow-red" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#EF4444" />
              </marker>

              <marker id="flow-arrow-purple" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#A855F7" />
              </marker>
            </defs>

            {/* 1. OUTER FACTORY WALLS & STRUCTURAL COLUMNS */}
            <rect x="20" y="20" width="1360" height="820" fill="none" stroke="#334155" strokeWidth="6" rx="16" />

            {/* Concrete Columns */}
            {[200, 440, 700, 920, 1140].map((cx, i) => (
              <React.Fragment key={i}>
                <rect x={cx} y="25" width="16" height="16" fill="#475569" stroke="#64748b" strokeWidth="1" />
                <rect x={cx} y="330" width="16" height="16" fill="#475569" stroke="#64748b" strokeWidth="1" />
                <rect x={cx} y="490" width="16" height="16" fill="#475569" stroke="#64748b" strokeWidth="1" />
                <rect x={cx} y="800" width="16" height="16" fill="#475569" stroke="#64748b" strokeWidth="1" />
              </React.Fragment>
            ))}

            {/* 2. ARCHITECTURAL ZONE SEPARATORS & INTERIOR WALLS */}
            {/* Receiving Zone Left Boundary */}
            <line x1="440" y1="20" x2="440" y2="840" stroke="#334155" strokeWidth="4" strokeDasharray="16,8" />
            
            {/* Receiving / Lab Divider */}
            <line x1="20" y1="330" x2="440" y2="330" stroke="#334155" strokeWidth="4" />

            {/* Assembly / OQC Divider */}
            <line x1="440" y1="490" x2="1380" y2="490" stroke="#334155" strokeWidth="4" strokeDasharray="16,8" />

            {/* 3. SAFETY PEDESTRIAN WALKWAYS (YELLOW STRIPES) */}
            <rect x="445" y="240" width="920" height="35" fill="url(#safety-stripes)" stroke="#F59E0B" strokeWidth="1" opacity="0.7" />
            <rect x="410" y="20" width="25" height="820" fill="url(#safety-stripes)" stroke="#F59E0B" strokeWidth="1" opacity="0.7" />

            {/* 4. REAL SHOPFLOOR CONVEYOR BELT (LINE 02) */}
            {/* The Conveyor running horizontally through Assembly Stations */}
            <rect x="490" y="145" width="650" height="25" fill="url(#conveyor-rollers)" stroke="#64748b" strokeWidth="2" rx="4" />
            <path d="M 520 157 L 1120 157" stroke="#38bdf8" strokeWidth="2" strokeDasharray="8,6" />

            {/* 5. RED QUARANTINE HAZARD FLOOR IN RECEIVING */}
            <rect x="60" y="90" width="185" height="95" fill="url(#quarantine-stripes)" stroke="#EF4444" strokeWidth="2" rx="8" />

            {/* 6. DOCKS ROLLER SHUTTER GATES (BAY DOORS) */}
            {/* Receiving Gate 01 */}
            <rect x="25" y="60" width="12" height="60" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
            <text x="45" y="55" fill="#f59e0b" fontSize="9" fontWeight="bold">بوابة استلام 01 (Gate 01)</text>

            {/* Shipping Gate 03 */}
            <rect x="1363" y="570" width="12" height="70" fill="#10b981" stroke="#064e3b" strokeWidth="1.5" />
            <text x="1350" y="560" fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="end">بوابة شحن 03 (Shipping Gate)</text>

            {/* 7. LIVE MATERIAL FLOW PATHWAY (TRANSIT PATHS THROUGH PLANT) */}
            {/* Path from Receiving to Assembly CNC */}
            <path 
              d="M 330 232 L 390 232 L 390 155 L 490 155" 
              fill="none" 
              stroke={activePreset === 'batch-901' || activePreset === 'valve-lot-03' ? '#10B981' : '#F59E0B'} 
              strokeWidth="3" 
              strokeDasharray="6,4" 
              markerEnd="url(#flow-arrow-green)" 
            />

            {/* Path from Pressure Cell (Fail) to Quarantine & Lab (Red Transit) */}
            <path 
              d="M 1240 225 L 1240 360 L 440 360 L 350 390" 
              fill="none" 
              stroke="#EF4444" 
              strokeWidth="2.5" 
              strokeDasharray="6,4" 
              markerEnd="url(#flow-arrow-red)" 
            />
            {/* Red Stop Point Label on the Floor */}
            <rect x="1135" y="240" width="145" height="22" rx="4" fill="#450A0A" stroke="#EF4444" strokeWidth="1.5" />
            <text x="1207.5" y="255" fill="#FCA5A5" fontSize="10" fontWeight="black" textAnchor="middle">🚨 محطة توقف الخط (Andon)</text>

            {/* Path from Assembly to OQC and Shipping Dock */}
            <path 
              d="M 1140 180 L 1290 180 L 1290 520 L 770 520 L 770 570" 
              fill="none" 
              stroke="#10B981" 
              strokeWidth="2.5" 
              markerEnd="url(#flow-arrow-green)" 
            />

            {/* Reverse Traceability Flow (Purple dashed line from Shipping back to Line 02) */}
            <path 
              d="M 820 605 L 470 605 L 470 290 L 1140 290 L 1140 225" 
              fill="none" 
              stroke="#A855F7" 
              strokeWidth="2.5" 
              strokeDasharray="8,5" 
              markerEnd="url(#flow-arrow-purple)" 
            />
            <rect x="620" y="595" width="130" height="20" rx="4" fill="#2E1065" stroke="#A855F7" strokeWidth="1.5" />
            <text x="685" y="609" fill="#E9D5FF" fontSize="9" fontWeight="black" textAnchor="middle">مسار التتبع العكسي الميداني 8D</text>
          </svg>

          {/* ------------------------------------------------------------------ */}
          {/* PLANT ZONE OVERLAY HEADERS (PHYSICAL INDUSTRIAL ZONES)             */}
          {/* ------------------------------------------------------------------ */}

          {/* ZONE 1: رصيف الاستلام والمواد الخام */}
          <div className="absolute top-8 right-8 z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-xl shadow-md">
            <Truck className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider block">المنطقة A: رصيف الاستلام ومستودع الخامات</span>
              <span className="text-[9px] text-white/50 block">Receiving Bay, IQC Inspection & Quarantine Area</span>
            </div>
          </div>

          {/* ZONE 2: صالة التجميع وخط الإنتاج */}
          <div className="absolute top-8 left-8 z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-xl shadow-md">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-[11px] font-black text-cyan-400 uppercase tracking-wider block">المنطقة B: خط التجميع الآلي الرئيسي (Line 02)</span>
              <span className="text-[9px] text-white/50 block">CNC Milling, Assembly, Torque & Pressure Cell</span>
            </div>
          </div>

          {/* ZONE 3: مختبر المعايرة والجودة */}
          <div className="absolute top-[345px] right-8 z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-xl shadow-md">
            <Wrench className="w-4 h-4 text-purple-400" />
            <div>
              <span className="text-[11px] font-black text-purple-400 uppercase tracking-wider block">المنطقة C: مختبر المعايرة وغرفة مراجعة الجودة (MRB)</span>
              <span className="text-[9px] text-white/50 block">Metrology Lab, LPA Auditing & CAPA War Room</span>
            </div>
          </div>

          {/* ZONE 4: الفحص النهائي ورصيف الشحن */}
          <div className="absolute top-[505px] left-8 z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-xl shadow-md">
            <PackageCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider block">المنطقة D: الفحص الصادر ورصيف شحن العملاء (Docks 03)</span>
              <span className="text-[9px] text-white/50 block">OQC Clearance, Packaging & Outgoing Shipping</span>
            </div>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* THE PHYSICAL SHOPFLOOR ENTITIES (MACHINES, BAYS, CAGES, CELLS)    */}
          {/* ------------------------------------------------------------------ */}
          {entities.map((entity) => {
            const isSelected = selectedEntityId === entity.id;
            const isHovered = hoveredEntityId === entity.id;
            const isHighlighted = floorHighlights.activeIds.includes(entity.id);
            const isStopPoint = entity.isStopPoint;

            return (
              <div
                key={entity.id}
                onClick={() => setSelectedEntityId(entity.id)}
                onMouseEnter={() => setHoveredEntityId(entity.id)}
                onMouseLeave={() => setHoveredEntityId(null)}
                style={{
                  left: entity.lx,
                  top: entity.ly,
                  width: entity.lw,
                  height: entity.lh,
                }}
                className={`absolute z-20 rounded-2xl cursor-pointer transition-all duration-200 select-none flex flex-col justify-between p-2.5 border ${
                  isSelected 
                    ? 'ring-4 ring-cyan-400 border-cyan-400 bg-cyan-950/90 shadow-2xl shadow-cyan-500/50 scale-105 z-30'
                    : isStopPoint
                    ? 'border-red-500 bg-red-950/85 shadow-xl shadow-red-600/40 animate-pulse'
                    : isHighlighted
                    ? 'border-white/20 bg-slate-900/95 hover:border-amber-400/80 hover:bg-slate-800 shadow-lg'
                    : 'border-white/5 bg-slate-950/70 opacity-40 hover:opacity-100'
                }`}
              >
                {/* Flashing Andon Warning Beacon for Stop Points */}
                {isStopPoint && (
                  <div className="absolute -top-3 -right-2 flex items-center gap-1 bg-red-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full border border-white shadow-lg animate-bounce">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                    <span>توقف Andon</span>
                  </div>
                )}

                {/* Entity Header: Icon + Title */}
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <div 
                      className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${entity.statusColor}33`, color: entity.statusColor }}
                    >
                      {entity.iconType === 'quarantine' && <ShieldAlert className="w-3 h-3" />}
                      {entity.iconType === 'pallet' && <Box className="w-3 h-3" />}
                      {entity.iconType === 'machine' && <Cpu className="w-3 h-3" />}
                      {entity.iconType === 'station' && <Wrench className="w-3 h-3" />}
                      {entity.iconType === 'alert-cell' && <Gauge className="w-3 h-3 text-red-400 animate-pulse" />}
                      {entity.iconType === 'lab' && <Activity className="w-3 h-3" />}
                      {entity.iconType === 'office' && <Building className="w-3 h-3" />}
                      {entity.iconType === 'truck' && <Truck className="w-3 h-3" />}
                    </div>
                    <h3 className="text-[11px] font-black text-white leading-tight truncate">
                      {entity.titleAr}
                    </h3>
                  </div>

                  <span 
                    className="text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: `${entity.statusColor}22`,
                      color: entity.statusColor,
                      border: `1px solid ${entity.statusColor}55`
                    }}
                  >
                    {entity.status === 'pass' ? 'PASS' : entity.status === 'fail' ? 'STOP' : 'ACTIVE'}
                  </span>
                </div>

                {/* Subtitle / Floor Note */}
                <p className="text-[9px] text-white/60 line-clamp-2 leading-tight">
                  {entity.subtitleAr}
                </p>

                {/* Bottom ID & Click Cue */}
                <div className="flex items-center justify-between text-[8px] border-t border-white/10 pt-1 text-white/40">
                  <span className="font-mono">{entity.code}</span>
                  <span className="text-amber-300 font-bold hover:underline">فحص وتوجيه ↗</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================================================================== */}
        {/* SLIDE-OVER COCKPIT INSPECTOR (SIDE DRAWER ON SELECT)               */}
        {/* ================================================================== */}
        {selectedEntityId && activeEntity && (
          <aside 
            className="absolute top-0 bottom-0 left-0 w-full sm:w-[420px] bg-slate-950/95 border-r border-white/15 backdrop-blur-2xl shadow-2xl z-40 flex flex-col transition-all duration-300 animate-in slide-in-from-left"
          >
            {/* Header */}
            <div className="flex-none p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-md"
                  style={{ backgroundColor: activeEntity.statusColor }}
                >
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white">تشخيص موقع المصنع</h2>
                  <p className="text-[10px] text-amber-400 font-bold">{activeEntity.zoneNameAr}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedEntityId(null)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Title & Status */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  كود المحطة: {activeEntity.code}
                </span>
                <h3 className="text-sm font-black text-white mt-1 leading-snug">
                  {activeEntity.titleAr}
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  {activeEntity.subtitleAr}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <span 
                    className="px-2.5 py-1 rounded-xl text-xs font-black"
                    style={{
                      backgroundColor: `${activeEntity.statusColor}22`,
                      color: activeEntity.statusColor,
                      border: `1px solid ${activeEntity.statusColor}55`
                    }}
                  >
                    {activeEntity.statusLabelAr}
                  </span>
                  {activeEntity.lotOrBatch && (
                    <span className="px-2 py-1 rounded-xl text-[11px] font-mono bg-white/5 text-white/70 border border-white/10">
                      {activeEntity.lotOrBatch}
                    </span>
                  )}
                </div>
              </div>

              {/* STOP POINT / STATUS REASON */}
              <div className={`p-3.5 rounded-2xl border ${
                activeEntity.isStopPoint 
                  ? 'bg-red-500/10 border-red-500/40' 
                  : 'bg-emerald-500/10 border-emerald-500/40'
              }`}>
                <div className="flex items-center gap-2">
                  {activeEntity.isStopPoint ? (
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <h4 className={`font-black text-xs ${activeEntity.isStopPoint ? 'text-red-300' : 'text-emerald-300'}`}>
                    {activeEntity.isStopPoint ? '⚠️ توقف نشط في أرضية المصنع (Stop Point)' : 'المحطة تعمل بانتظام وسلاسة'}
                  </h4>
                </div>
                <p className="mt-2 text-white/80 leading-relaxed text-[11px]">
                  {activeEntity.stopReasonAr}
                </p>

                {activeEntity.nextStepAr && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 text-[11px]">
                    <span className="font-black text-amber-300">الإجراء المطلوب بالموقع: </span>
                    <span className="text-white/90">{activeEntity.nextStepAr}</span>
                  </div>
                )}
              </div>

              {/* Physical Location & Assigned Person */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-white/40 block text-[10px]">المسؤول بالمحطة</span>
                  <span className="font-bold text-white mt-0.5 block truncate">{activeEntity.assignedTo || 'مشرف الوردية'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-white/40 block text-[10px]">الموقع الفيزيائي</span>
                  <span className="font-bold text-white mt-0.5 block truncate">{activeEntity.location || 'صالة الإنتاج'}</span>
                </div>
              </div>

              {/* Technical Inspection Specs */}
              {activeEntity.details && Object.keys(activeEntity.details).length > 0 && (
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="font-black text-white/60 text-[10px] uppercase tracking-wider mb-2">بيانات الموقع والمعدات</h4>
                  <div className="space-y-1.5 text-[11px]">
                    {Object.entries(activeEntity.details).map(([k, v]) => (
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
                  toast.success(`جاري فتح شاشة ${activeEntity.moduleLabelAr}...`);
                  navigate(activeEntity.moduleUrl);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-orange-500/30 transition-all uppercase tracking-wider"
              >
                <ExternalLink className="w-4 h-4 text-slate-950" />
                الانتقال المباشر لشاشة {activeEntity.moduleLabelAr} ↗
              </button>

              <button
                onClick={() => {
                  toast.success(`تم استخراج تقرير تتبع الموقع ${activeEntity.code}`, {
                    description: 'شهادة مسار التصنيع جاهزة للمطابقة.'
                  });
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold text-xs rounded-xl transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                تصدير تقرير تتبع المحطة (Station Audit Log)
              </button>
            </div>
          </aside>
        )}

        {/* ================================================================== */}
        {/* FACTORY LEGEND                                                     */}
        {/* ================================================================== */}
        {showLegend && (
          <div className="absolute bottom-4 right-4 bg-slate-900/95 border border-white/15 rounded-2xl p-3.5 shadow-2xl z-30 max-w-xs text-xs space-y-2 backdrop-blur-md">
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <h4 className="font-black text-white text-xs">مفتاح لاي أوت المصنع</h4>
              <button onClick={() => setShowLegend(false)} className="text-white/40 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 bg-[#10B981]"></span>
                <span className="text-white/80">مسار السير الناقل المعتمد (Conveyor)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 bg-[#EF4444]"></span>
                <span className="text-white/80">مسار العزل والتحويل لمنطقة الحظر</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 border-t border-dashed border-purple-400"></span>
                <span className="text-white/80">مسار التتبع العكسي الميداني (8D Trace)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-600 rounded-sm animate-ping"></span>
                <span className="text-red-300 font-bold">إشارة توقف المحطة (Andon Tower)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-2 bg-amber-500/30 border border-amber-500"></span>
                <span className="text-white/80">ممرات المشاة وعربات النقل الآلي</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QualityControlTower;
