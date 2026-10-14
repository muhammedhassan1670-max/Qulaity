// @ts-nocheck
// QMS Enterprise 4.0 - Quality Control Tower & Interactive Traceability Stream
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, PageContainer, PageSection } from '../../components/PageHeader';
import { toast } from 'sonner';
import { 
  Network, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Clock, 
  ShieldAlert, ShieldCheck, Search, RefreshCw, ExternalLink, Eye, 
  Building, Cpu, Wrench, PackageCheck, Users, Truck, Sparkles, Check, 
  ChevronRight, X, Info, Zap, Layers, Activity, FileText, ArrowDown
} from 'lucide-react';
import { seedComprehensiveQualityLifecycle } from '../../services/seedLifecycleDemo';
import { loadQualityRelationships, relatedIdsForEntity } from '../../services/qualityRelationships';
import { useTranslation } from '../../utils/translations';

// ============================================================================
// TYPES & DATA STRUCTURES
// ============================================================================

export type TowerNodeCategory = 
  | 'raw-material'
  | 'supplier-ncr'
  | 'assembly'
  | 'defect'
  | 'control-plan'
  | 'audit'
  | 'internal-ncr'
  | 'capa'
  | 'oqc'
  | 'customer-complaint';

export interface TowerNode {
  id: string;
  category: TowerNodeCategory;
  titleEn: string;
  titleAr: string;
  code: string;
  lotOrBatch?: string;
  status: 'pass' | 'fail' | 'conditional' | 'investigation' | 'completed' | 'in-progress' | 'logged' | 'quarantine';
  statusLabelEn: string;
  statusLabelAr: string;
  isStopPoint?: boolean;
  stopReasonAr?: string;
  nextStepAr?: string;
  assignedTo?: string;
  location?: string;
  timestamp?: string;
  details: Record<string, string | number>;
  linkedToIds: string[];
  moduleUrl: string;
  moduleLabelAr: string;
}

export type PresetJourney = 'batch-901' | 'seal-lot-02' | 'valve-lot-03' | 'complaint-101';

export function QualityControlTower() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isAr = language === 'ar';

  // Active Journey Preset
  const [activePreset, setActivePreset] = useState<PresetJourney>('batch-901');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('DEF-2026-901B');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Ensure data is seeded in localStorage on mount
  useEffect(() => {
    if (typeof localStorage !== 'undefined' && !localStorage.getItem('qms_comprehensive_seeded_v1')) {
      try {
        seedComprehensiveQualityLifecycle();
        localStorage.setItem('qms_comprehensive_seeded_v1', 'true');
      } catch (e) {
        console.warn('Seeding failed in tower', e);
      }
    }
  }, []);

  // ============================================================================
  // ALL NODES IN THE QUALITY JOURNEY STREAM
  // ============================================================================
  const nodes: TowerNode[] = useMemo(() => [
    // ------------------------------------------------------------------------
    // 1. INCOMING RAW MATERIALS (5 Materials)
    // ------------------------------------------------------------------------
    {
      id: 'INS-2026-RM-01',
      category: 'raw-material',
      titleEn: 'Aluminum 7075-T6 Billets (Pump Body)',
      titleAr: 'خامة 1: ألومنيوم 7075-T6 (جسم المضخة)',
      code: 'RM-ALUM-7075',
      lotOrBatch: 'LOT-2026-AL-01',
      status: 'conditional',
      statusLabelEn: 'Conditional Pass',
      statusLabelAr: 'قبول مشروط بتصريح تشغيل',
      isStopPoint: false,
      stopReasonAr: 'ارتفاع طفيف في خشونة السطح Ra 3.8 µm. تم السماح بالمرور للتجميع بتصريح تشغيل داخلي.',
      nextStepAr: 'تعديل بارامترات الخراطة الدقيقة في خط التجميع.',
      assignedTo: 'م. مصطفى رفعت (IQC)',
      location: 'مستودع الخامات الواردة - Bay A1',
      timestamp: '2026-10-01',
      details: {
        'المورد': 'Precision Metals Co. (SUP-001)',
        'الكمية المستلمة': '1,500 كجم',
        'العينة المفحوصة': '32 عينة (MIL-STD-105E)',
        'عدد الملاحظات': '3 قطع خشونة زائدة',
        'شهادة التحليل CoC': 'معتمدة برقم COC-AL-881'
      },
      linkedToIds: ['BATCH-2026-901'],
      moduleUrl: '/compliance/hub/inspection',
      moduleLabelAr: 'فحص الشحنات (IQC)'
    },
    {
      id: 'INS-2026-RM-02',
      category: 'raw-material',
      titleEn: 'High-Pressure NBR O-Rings 25x3mm',
      titleAr: 'خامة 2: مانع تسرب كوتشوك NBR 25x3mm',
      code: 'RM-SEAL-NBR',
      lotOrBatch: 'LOT-2026-OR-02',
      status: 'fail',
      statusLabelEn: 'REJECTED (0% Accept)',
      statusLabelAr: 'مرفوض بالكامل (FAIL)',
      isStopPoint: true,
      stopReasonAr: 'انخفاض صلادة Shore A (62 مقابل 75 المطلوبة) وانكماش في القطر. خطر تسريب مؤكد عند ضغط 200+ بار!',
      nextStepAr: 'حجر اللوت فوراً في منطقة الحجر الأصفر، وإصدار إشعار إرجاع للمورد RTV.',
      assignedTo: 'م. مصطفى رفعت (IQC)',
      location: 'منطقة الحجر الصحي - Quarantine Bay 4',
      timestamp: '2026-10-02',
      details: {
        'المورد': 'Apex Polymer & Seals Ltd. (SUP-002)',
        'الكمية المستلمة': '5,000 قطعة',
        'العينة المفحوصة': '80 عينة',
        'عدد العيوب': '28 عينة غير مطابقة (35%)',
        'حالة اللوت': 'محجوز 100% - مُنع من دخول خط التجميع'
      },
      linkedToIds: ['NCR-SUP-2026-001'],
      moduleUrl: '/compliance/hub/inspection',
      moduleLabelAr: 'فحص الشحنات (IQC)'
    },
    {
      id: 'INS-2026-RM-03',
      category: 'raw-material',
      titleEn: 'Stainless Steel 316 Valve Plungers',
      titleAr: 'خامة 3: صمامات ستانلس 316 عالية الإجهاد',
      code: 'RM-VALV-SS316',
      lotOrBatch: 'LOT-2026-VL-03',
      status: 'pass',
      statusLabelEn: 'Conforming (PASS)',
      statusLabelAr: 'مطابق للمواصفات 100% (PASS)',
      isStopPoint: false,
      stopReasonAr: 'لا يوجد. تم اجتياز كافة اختبارات الأبعاد والموجات فوق الصوتية بنجاح.',
      nextStepAr: 'تم الصرف الفوري لمحطة التجميع 2.',
      assignedTo: 'تامر عادل (IQC)',
      location: 'مستودع الخامات - Bay B2',
      timestamp: '2026-10-02',
      details: {
        'المورد': 'Delta Precision Components (SUP-003)',
        'الكمية المستلمة': '2,000 قطعة',
        'العينة المفحوصة': '50 عينة',
        'نسبة العيوب': '0% (مطابقة تامة)',
        'الميكروميتر المستخدم': 'Mitutoyo CAL-GAUGE-042'
      },
      linkedToIds: ['BATCH-2026-901'],
      moduleUrl: '/compliance/hub/inspection',
      moduleLabelAr: 'فحص الشحنات (IQC)'
    },
    {
      id: 'INS-2026-RM-04',
      category: 'raw-material',
      titleEn: 'M8x45 Grade 10.9 Zinc Coated Bolts',
      titleAr: 'خامة 4: مسامير ربط M8 إجهاد 10.9 مجلفنة',
      code: 'RM-BOLT-M8GR10',
      lotOrBatch: 'LOT-2026-BL-04',
      status: 'conditional',
      statusLabelEn: 'Sorted & Cleaned',
      statusLabelAr: 'تم الفرز والتنظيف (PASS)',
      isStopPoint: false,
      stopReasonAr: 'رايش في بداية قلاووظ 12 مسماراً. تم فرز وتشذيب المسامير موضعياً وقبول اللوت.',
      nextStepAr: 'إرسال ملاحظة جودة للمورد لمنع تكرار رايش القلاووظ.',
      assignedTo: 'تامر عادل (IQC)',
      location: 'مستودع المكونات - رف C3',
      timestamp: '2026-10-03',
      details: {
        'المورد': 'Titan Fasteners Global (SUP-004)',
        'الكمية المستلمة': '10,000 قطعة',
        'العينة المفحوصة': '200 مسمار',
        'إجراء الفرز': 'فرز 100% للمسامير المستخدمة بالتشغيلة',
        'عزم الشد الاسمي': '25 Nm'
      },
      linkedToIds: ['BATCH-2026-901'],
      moduleUrl: '/compliance/hub/inspection',
      moduleLabelAr: 'فحص الشحنات (IQC)'
    },
    {
      id: 'INS-2026-RM-05',
      category: 'raw-material',
      titleEn: 'ISO VG 46 Anti-Wear Hydraulic Oil',
      titleAr: 'خامة 5: زيت هيدروليكي اختباري ISO 46',
      code: 'RM-OIL-ISO46',
      lotOrBatch: 'LOT-2026-OL-05',
      status: 'pass',
      statusLabelEn: 'Conforming (PASS)',
      statusLabelAr: 'مطابق للمواصفة القياسية (PASS)',
      isStopPoint: false,
      stopReasonAr: 'لا يوجد. اللزوجة والشوائب مطابقة لمعيار DIN 51524.',
      nextStepAr: 'تغذية خزانات اختبار الضغط في خط التجميع.',
      assignedTo: 'كيميائية سلمى (مختبر الزيوت)',
      location: 'خزانات الاختبار - محطة الضغط الهيدروليكي',
      timestamp: '2026-10-03',
      details: {
        'المورد': 'Gulf Lubricants & Fluids (SUP-005)',
        'الكمية المستلمة': '8 براميل (1,600 لتر)',
        'معامل اللزوجة VI': '102 (المعيار > 95)',
        'مستوى النقاء': 'ISO 4406 Class 16/14/11',
        'الاستخدام': 'اختبارات الضغط حتى 400 بار'
      },
      linkedToIds: ['BATCH-2026-901'],
      moduleUrl: '/compliance/hub/inspection',
      moduleLabelAr: 'فحص الشحنات (IQC)'
    },

    // ------------------------------------------------------------------------
    // 2. SUPPLIER NCR (Rejected Seal)
    // ------------------------------------------------------------------------
    {
      id: 'NCR-SUP-2026-001',
      category: 'supplier-ncr',
      titleEn: 'Supplier NCR: Rejected O-Ring Lot LOT-2026-OR-02',
      titleAr: '2. عدم مطابقة مورد: حجز وإرجاع لوت مانع التسرب',
      code: 'NCR-SUP-2026-001',
      lotOrBatch: 'LOT-2026-OR-02',
      status: 'quarantine',
      statusLabelEn: 'Quarantined & RTV Pending',
      statusLabelAr: 'محجوز بالحجر - بانتظار الإرجاع RTV',
      isStopPoint: true,
      stopReasonAr: 'تم عزل الشحنة كاملة لمنع تسربها لخطوط الإنتاج. المورد أُخطر رسمياً بطلب شحنة بديلة مطابقة.',
      nextStepAr: 'اعتماد شحنة السيلات البديلة وإلزام المورد بتحليل 8D.',
      assignedTo: 'م. طارق عامر (مدير جودة الموردين)',
      location: 'الحجر الصحي الأصفر - مستودع الموردين',
      timestamp: '2026-10-02',
      details: {
        'المورد المتسبب': 'Apex Polymer & Seals Ltd.',
        'تكلفة الحجر': '3,500 ج.م على حساب المورد',
        'الإجراء الاحترازي': 'تجميد تقييم المورد مؤقتاً',
        'السجل المرتبط': 'IQC Run: INS-2026-RM-02',
        'رقم تقرير عدم المطابقة': 'NCR-SUP-2026-001'
      },
      linkedToIds: ['INS-2026-RM-02'],
      moduleUrl: '/quality/records/ncr',
      moduleLabelAr: 'عدم المطابقة (NCR)'
    },

    // ------------------------------------------------------------------------
    // 3. ASSEMBLY BATCH & SHOPFLOOR DEFECTS
    // ------------------------------------------------------------------------
    {
      id: 'BATCH-2026-901',
      category: 'assembly',
      titleEn: 'Hydraulic Pump Assembly Run (500 units)',
      titleAr: '3. تشغيلة التجميع BATCH-2026-901 (500 مضخة)',
      code: 'ASSY-PUMP-400',
      lotOrBatch: 'BATCH-2026-901',
      status: 'investigation',
      statusLabelEn: 'Under Assembly & Testing',
      statusLabelAr: 'جاري التجميع والاختبار الميداني',
      isStopPoint: false,
      stopReasonAr: 'رُصدت عيوب تفويت قلاووظ وتسريب أثناء التجميع، وتم التدخل المباشر لإعادة ضبط الشد.',
      nextStepAr: 'إكمال الفحص النهائي 100% لعزم الربط والضغط الهيدروليكي.',
      assignedTo: 'مشرف الخط إبراهيم توفيق',
      location: 'خط التجميع 1 - محطة 2 و 4',
      timestamp: '2026-10-06',
      details: {
        'الكمية المخططة': '500 مضخة هيدروليكية 400 بار',
        'الخامات المستخدمة': '4 خامات معتمدة + سيلات بديلة معتمدة',
        'العيوب المرصودة': '17 وحدة متأثرة تم فرزها',
        'الوحدات المقبولة': '483 مضخة جاهزة للفحص الصادر',
        'معدل العيوب': '3.4% (الهدف أقل من 1.5%)'
      },
      linkedToIds: ['DEF-2026-901A', 'DEF-2026-901B', 'DEF-2026-901C', 'INS-2026-OQC-901'],
      moduleUrl: '/shopfloor-entry',
      moduleLabelAr: 'تسجيل الورشة والمحطات'
    },
    {
      id: 'DEF-2026-901A',
      category: 'defect',
      titleEn: 'Bolt Cross-Threading (Torque Mismatch)',
      titleAr: 'عيب: تفويت وتلف قلاووظ المسامير (عزم زائد)',
      code: 'DEF-2026-901A',
      lotOrBatch: 'BATCH-2026-901',
      status: 'logged',
      statusLabelEn: 'Logged & Reworked',
      statusLabelAr: 'مرصود في المسجل - أُصلح بالهيلي كويل',
      isStopPoint: false,
      stopReasonAr: 'عزم شد الماكينة تجاوز 31 Nm بدلاً من 25 Nm المحددة، مما تسبب في تلف سن القلاووظ.',
      nextStepAr: 'استدعاء الصيانة لمعايرة مفك العزم وضبط نظام الفصل الآلي.',
      assignedTo: 'فني التجميع محمود سعيد',
      location: 'خط التجميع 1 - محطة ربط المسامير',
      timestamp: '2026-10-06',
      details: {
        'الكمية المتأثرة': '8 مضخات',
        'درجة الخطورة': 'Major (خلل تشغيلي)',
        'الإجراء الفوري': 'تركيب سلك تعويض قلاووظ Heli-Coil',
        'الارتباط بالـ NCR': 'مرتبط بـ NCR-2026-901 الداخلي'
      },
      linkedToIds: ['NCR-2026-901'],
      moduleUrl: '/defect-log',
      moduleLabelAr: 'مسجل العيوب (Daily Defects)'
    },
    {
      id: 'DEF-2026-901B',
      category: 'defect',
      titleEn: 'Hydrostatic Seal Micro-Leakage',
      titleAr: 'عيب: تسريب ضغط هيدروليكي في فحص 250 بار',
      code: 'DEF-2026-901B',
      lotOrBatch: 'BATCH-2026-901',
      status: 'logged',
      statusLabelEn: 'Critical Defect',
      statusLabelAr: 'عيب حرج (Critical) - فك واستبدال',
      isStopPoint: false,
      stopReasonAr: 'رصد رشح زيت عند الضغط العالي بسبب عدم إحكام استقرار مانع التسرب في مجراه.',
      nextStepAr: 'فك الوحدات واستبدال الحلقات وإعادة اختبار الضغط بنجاح.',
      assignedTo: 'فني الاختبار علي جمال',
      location: 'منصة الاختبار الهيدروليكي Rig #2',
      timestamp: '2026-10-06',
      details: {
        'الكمية المتأثرة': '5 مضخات',
        'درجة الخطورة': 'Critical (خطر أمان وتسريب)',
        'ضغط الاختبار': '250 Bar لمدة 3 دقائق',
        'الإجراء الفوري': 'تفكيك وإعادة تركيب بحلقات بديلة'
      },
      linkedToIds: ['NCR-2026-901'],
      moduleUrl: '/defect-log',
      moduleLabelAr: 'مسجل العيوب (Daily Defects)'
    },
    {
      id: 'DEF-2026-901C',
      category: 'defect',
      titleEn: 'Plunger Stroke Clearance Out-of-Spec',
      titleAr: 'عيب: تفاوت خلوص حركة الصمام (Clearance)',
      code: 'DEF-2026-901C',
      lotOrBatch: 'BATCH-2026-901',
      status: 'logged',
      statusLabelEn: 'Minor Variance',
      statusLabelAr: 'تفاوت بسيط - تم الضبط بالشيمز',
      isStopPoint: false,
      stopReasonAr: 'خلوص الصمام تجاوز 0.05 مم في 4 قطع.',
      nextStepAr: 'استبدال حزمة الشيمز لتحقيق الخلوص القياسي 0.025 مم.',
      assignedTo: 'فني التجميع أحمد فتحي',
      location: 'محطة تجميع الصمامات Station 3',
      timestamp: '2026-10-07',
      details: {
        'الكمية المتأثرة': '4 مضخات',
        'درجة الخطورة': 'Medium',
        'الإجراء المتخذ': 'ضبط دقيق وإعادة القياس بالميكروميتر'
      },
      linkedToIds: ['BATCH-2026-901'],
      moduleUrl: '/defect-log',
      moduleLabelAr: 'مسجل العيوب (Daily Defects)'
    },

    // ------------------------------------------------------------------------
    // 4. CONTROL PLAN & AUDIT
    // ------------------------------------------------------------------------
    {
      id: 'CP-PUMP-01',
      category: 'control-plan',
      titleEn: 'Control Plan: Hydraulic Pump Assembly',
      titleAr: '4. خطة المراقبة CP-PUMP-01 (عزم 25Nm وضغط 250Bar)',
      code: 'CP-PUMP-01',
      lotOrBatch: 'ASSY-PUMP-400',
      status: 'pass',
      statusLabelEn: 'Standard Active',
      statusLabelAr: 'خطة مراقبة قياسية نشطة',
      isStopPoint: false,
      stopReasonAr: 'تحدد خطة المراقبة التفتيش الدوري على عزم الربط واختبار الضغط 250 بار 0 تسريب.',
      nextStepAr: 'تحديث الخطة لتضمين نظام Poka-Yoke الذكي الجديد.',
      assignedTo: 'م. وليد فوزي (مهندس الجودة)',
      location: 'مكتب هندسة الجودة والعمليات',
      timestamp: '2026-10-07',
      details: {
        'الخاصية الحرجة CTQ': 'Torque: 25 ± 2 Nm | Proof Pressure: 250 Bar',
        'تكرار الفحص': '5 عينات كل ساعة على كارت SPC',
        'طريقة الفحص': 'مفتاح عزم رقمي معاير + منصة اختبار',
        'خطة رد الفعل': 'إيقاف الخط فوراً وحجز إنتاج آخر ساعة'
      },
      linkedToIds: ['AUD-2026-901'],
      moduleUrl: '/control-plans',
      moduleLabelAr: 'خطط المراقبة (Control Plans)'
    },
    {
      id: 'AUD-2026-901',
      category: 'audit',
      titleEn: 'Process Audit: Assembly Line 1 Torquing',
      titleAr: 'تدقيق العملية AUD-2026-901: انتهاء معايرة مفك العزم',
      code: 'AUD-2026-901',
      lotOrBatch: 'Line 1 Station 2',
      status: 'completed',
      statusLabelEn: 'Audit Finding Issued',
      statusLabelAr: 'رُصدت حالة عدم مطابقة كبرى (NC)',
      isStopPoint: false,
      stopReasonAr: 'كشف التدقيق انتهاء كارت معايرة مفك العزم الهوائي منذ 14 يوماً وتفاوت القراءات بين 22 و 31 Nm.',
      nextStepAr: 'تصعيد الملاحظة فوراً لإصدار NCR وكابا لمنع تكرار الخطأ.',
      assignedTo: 'مدقق الجودة حازم شاكر',
      location: 'خط التجميع 1',
      timestamp: '2026-10-07',
      details: {
        'نوع التدقيق': 'Layered Process Audit (LPA)',
        'المعيار': 'IATF 16949 البند 8.5.1',
        'عدد الملاحظات': '2 ملاحظات (منها 1 حالة عدم مطابقة كبرى)',
        'الإجراء المتخذ': 'إيقاف الأداة الهوائية وتصعيد تقرير عدم مطابقة'
      },
      linkedToIds: ['NCR-2026-901'],
      moduleUrl: '/compliance/hub/audit',
      moduleLabelAr: 'التدقيق والمراجعات (Audits)'
    },

    // ------------------------------------------------------------------------
    // 5. INTERNAL NCR & CAPA
    // ------------------------------------------------------------------------
    {
      id: 'NCR-2026-901',
      category: 'internal-ncr',
      titleEn: 'Internal NCR: Uncontrolled Bolting Torque',
      titleAr: '5. تقرير عدم مطابقة داخلي: انحراف عزم الربط والتسريب',
      code: 'NCR-2026-901',
      lotOrBatch: 'BATCH-2026-901',
      status: 'investigation',
      statusLabelEn: 'Active Investigation',
      statusLabelAr: 'قيد التحقيق والاحتواء 100%',
      isStopPoint: false,
      stopReasonAr: 'تأكيد انحراف عزم الربط في 8 مضخات وتسريب 5 مضخات أثناء تشغيلة الإنتاج.',
      nextStepAr: 'فحص عزم 100% لكامل الـ 500 مضخة وتصعيد خطة كابا للمعدات.',
      assignedTo: 'م. وليد فوزي (مهندس الجودة)',
      location: 'قسم الجودة والتحكم',
      timestamp: '2026-10-07',
      details: {
        'المصدر': 'تدقيق العملية AUD-901 وعيوب DEF-901A/B',
        'إجراء الاحتواء': 'إعادة ربط وتأكيد عزم 500 مضخة بنسبة 100%',
        'النتيجة': 'استبعاد 17 قطعة تالفة وإجازة 483 مضخة سليمة',
        'الحالة': 'مربوط بإجراء تصحيحي CAPA-2026-901'
      },
      linkedToIds: ['CAPA-2026-901'],
      moduleUrl: '/quality/records/ncr',
      moduleLabelAr: 'عدم المطابقة (NCR)'
    },
    {
      id: 'CAPA-2026-901',
      category: 'capa',
      titleEn: 'CAPA: Smart Poka-Yoke Angle-Torque Nutrunner',
      titleAr: 'إجراء تصحيحي CAPA-901: تركيب مفك ذكي متصل بـ PLC',
      code: 'CAPA-2026-901',
      lotOrBatch: 'Line 1 Station 2',
      status: 'in-progress',
      statusLabelEn: 'Implementation Phase',
      statusLabelAr: 'جاري التنفيذ والتركيب الفني',
      isStopPoint: false,
      stopReasonAr: 'السبب الجذري (5-Whys): اعتماد الأداة القديمة على التقدير اليدوي دون نظام فصل كهربي آلي.',
      nextStepAr: 'توريد وربط مفك العزم الذكي المزود بحساس زاوية وعزم مع إنترلوك كهربي مع ماكينة التجميع.',
      assignedTo: 'م. وليد فوزي & فريق الصيانة الكهربية',
      location: 'خط التجميع 1',
      timestamp: '2026-10-08',
      details: {
        'السبب الجذري 5-Whys': 'غياب الحماية من الخطأ البشري (Poka-Yoke)',
        'الحل المعتمد': 'Atlas Copco Smart Transducer Nutrunner',
        'تاريخ الإنهاء المخطط': '2026-10-25',
        'مرحلة التحقق': 'متابعة أول 3 تشغيلات بعد التركيب'
      },
      linkedToIds: ['INS-2026-OQC-901'],
      moduleUrl: '/quality/records/capa',
      moduleLabelAr: 'الإجراءات التصحيحية (CAPA)'
    },

    // ------------------------------------------------------------------------
    // 6. OUTGOING QUALITY CONTROL (OQC)
    // ------------------------------------------------------------------------
    {
      id: 'INS-2026-OQC-901',
      category: 'oqc',
      titleEn: 'Final Outgoing Inspection: 50 Samples Approved',
      titleAr: '6. الفحص الصادر INS-OQC-901: اعتماد الشحن بنجاح (PASS)',
      code: 'INS-2026-OQC-901',
      lotOrBatch: 'BATCH-2026-901 (480 مضخة جاهزة)',
      status: 'pass',
      statusLabelEn: 'Released & CoC Certified',
      statusLabelAr: 'تم الإفراج التام مع شهادة المطابقة',
      isStopPoint: false,
      stopReasonAr: 'لا يوجد. العينة العشوائية (50 مضخة) اجتازت اختبار الضغط 280 بار لمدة 5 دقائق بنجاح تام.',
      nextStepAr: 'تغليف وتوسيم الباركود وتسليم الشحنة لمستودع الشحن النهائي.',
      assignedTo: 'كبير مفتشي الجودة شريف منصور',
      location: 'منطقة الفحص النهائي والإفراج OQC',
      timestamp: '2026-10-09',
      details: {
        'الكمية المعتمدة': '480 مضخة هيدروليكية',
        'خطة المعاينة': 'MIL-STD-105E Level II (AQL 0.65)',
        'اختبار الضغط النهائي': '280 Bar (0% هبوط ضغط)',
        'شهادة الإفراج': 'Certificate of Conformity #COC-2026-442',
        'فاتورة التسليم': 'INV-2026-442'
      },
      linkedToIds: ['CMP-2026-101'],
      moduleUrl: '/outgoing-quality',
      moduleLabelAr: 'فحص الشحن النهائي (OQC)'
    },

    // ------------------------------------------------------------------------
    // 7. CUSTOMER & FIELD COMPLAINT
    // ------------------------------------------------------------------------
    {
      id: 'CMP-2026-101',
      category: 'customer-complaint',
      titleEn: 'Customer Complaint: Hydraulic Leakage at Max Pressure',
      titleAr: '7. شكوى العميل CMP-101: تسريب زيت عند ضغط 280 بار',
      code: 'CMP-2026-101',
      lotOrBatch: 'Serials PUMP-901-042 & 043',
      status: 'investigation',
      statusLabelEn: 'Under Metallurgical Teardown',
      statusLabelAr: 'قيد فحص التفكيك المعملي المسترجع',
      isStopPoint: true,
      stopReasonAr: 'العميل أبلغ عن رشح زيت من مجمع المضخة بعد 40 ساعة عمل في حفار ميداني.',
      nextStepAr: 'تم إرسال مضختين بديلتين للعميل فوراً، وجاري فك المضختين المعيوبتين لفحص مانع التسرب وعزم الربط.',
      assignedTo: 'م. عمرو خالد (خدمة ما بعد البيع والجودة)',
      location: 'موقع العميل: شركة الأمل للمعدات الصناعية',
      timestamp: '2026-10-12',
      details: {
        'العميل الشاكي': 'شركة الأمل للمعدات الصناعية',
        'القطع المتأثرة': 'مضختان (Serial # PUMP-901-042 & 043)',
        'الإجراء الفوري': 'صرف بديل مجاني فوري من رصيد الأمان',
        'التتبع العكسي': 'يرجع للتشغيلة BATCH-2026-901 وعيب DEF-901B',
        'حالة الشكوى': 'مفتوحة قيد التحليل الجذري 8D'
      },
      linkedToIds: ['INS-2026-OQC-901', 'NCR-2026-901'],
      moduleUrl: '/quality/records/complaints',
      moduleLabelAr: 'شكاوى العملاء (Complaints)'
    }
  ], []);

  // Find currently selected node object
  const activeNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || nodes[0];
  }, [nodes, selectedNodeId]);

  // Handle Preset Selection and Set Selected Node
  const handleSelectPreset = (preset: PresetJourney) => {
    setActivePreset(preset);
    if (preset === 'batch-901') {
      setSelectedNodeId('BATCH-2026-901');
      toast.info('تم تحميل مسار تشغيلة التجميع الكاملة (500 مضخة)');
    } else if (preset === 'seal-lot-02') {
      setSelectedNodeId('INS-2026-RM-02');
      toast.error('تم تحديد لوت السيل المرفوض: توقف كامل عند فحص IQC');
    } else if (preset === 'complaint-101') {
      setSelectedNodeId('CMP-2026-101');
      toast.warning('تم تفعيل التتبع العكسي من شكوى العميل إلى المورد');
    } else if (preset === 'valve-lot-03') {
      setSelectedNodeId('INS-2026-RM-03');
      toast.success('تم تحديد لوت الصمامات: مسار مطابق بنسبة 100%');
    }
  };

  // Determine Metro Subway-Line progress based on active selection
  const metroStations = useMemo(() => {
    if (activePreset === 'seal-lot-02' || selectedNodeId === 'INS-2026-RM-02' || selectedNodeId === 'NCR-SUP-2026-001') {
      return [
        { name: '1. استلام الخامة', status: 'done', label: 'تم الاستلام' },
        { name: '2. فحص الاستلام IQC', status: 'failed', label: '🛑 نقطة التوقف (رفض)' },
        { name: '3. حجر و Supplier NCR', status: 'current', label: 'حجر صحي وإرجاع' },
        { name: '4. خط التجميع', status: 'blocked', label: 'مُنع من الدخول' },
        { name: '5. فحص الخروج OQC', status: 'blocked', label: 'غير مشمول' },
        { name: '6. تسليم العميل', status: 'blocked', label: 'غير مشمول' },
      ];
    }

    if (activePreset === 'valve-lot-03' || selectedNodeId === 'INS-2026-RM-03') {
      return [
        { name: '1. استلام الخامة', status: 'done', label: 'مطابق 100%' },
        { name: '2. فحص الاستلام IQC', status: 'done', label: 'تم الاعتماد PASS' },
        { name: '3. سحب للتجميع', status: 'done', label: 'دمج بالكامل' },
        { name: '4. فحص الخروج OQC', status: 'done', label: 'معتمد 280 بار' },
        { name: '5. تسليم العميل', status: 'done', label: 'تسليم بنجاح ✅' },
      ];
    }

    // Default: BATCH-2026-901 & Customer Complaint Trace
    return [
      { name: '1. الخامات الواردة', status: 'done', label: '5 خامات واردة' },
      { name: '2. فحص IQC والحجر', status: 'done', label: 'استبعاد لوت السيل' },
      { name: '3. خط التجميع 1', status: 'done', label: 'رصد 3 عيوب' },
      { name: '4. التدقيق والكابا', status: 'done', label: 'مفك Poka-Yoke' },
      { name: '5. فحص الخروج OQC', status: 'done', label: 'اعتماد 480 مضخة' },
      { name: '6. تسليم العميل', status: 'investigation', label: '⚠️ نقطة التوقف: شكوى تسريب' },
    ];
  }, [activePreset, selectedNodeId]);

  // Overall journey headline
  const journeyHeadline = useMemo(() => {
    if (activePreset === 'seal-lot-02' || selectedNodeId === 'INS-2026-RM-02') {
      return {
        badge: '🛑 نقطة توقف: اللوت محجوز بالحجر الصحي',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        progress: 25,
        location: 'منطقة الحجر الصحي - Quarantine Bay 4',
        responsible: 'م. مصطفى رفعت & م. طارق عامر (Supplier Quality)',
        actionRequired: 'اعتماد إشعار إرجاع المورد RTV وتوريد دفعة بديلة',
      };
    }
    if (activePreset === 'complaint-101' || selectedNodeId === 'CMP-2026-101') {
      return {
        badge: '⚠️ تتبع عكسي: معلق عند تحقيق شكوى العميل',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        progress: 88,
        location: 'موقع العميل + معمل الفحص المعدني بالمصنع',
        responsible: 'م. عمرو خالد (خدمة ما بعد البيع) & م. وليد فوزي',
        actionRequired: 'إكمال تقرير فك العينات المسترجعة وتأكيد عزم الربط',
      };
    }
    if (activePreset === 'valve-lot-03') {
      return {
        badge: '✅ مسار مكتمل بنسبة 100% بدون أي عوائق',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        progress: 100,
        location: 'تم التسليم بنجاح في موقع العميل',
        responsible: 'شريف منصور (إفراج الجودة النهائي)',
        actionRequired: 'لا يوجد إجراء معلق - الدورة مغلقة',
      };
    }
    return {
      badge: '🔄 تشغيلة نشطة: اكتمل التجميع ومتبقي إغلاق الكابا',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      progress: 75,
      location: 'خط التجميع 1 + محطة الفحص النهائي OQC',
      responsible: 'م. وليد فوزي & إبراهيم توفيق',
      actionRequired: 'تركيب وتشغيل مفك العزم الذكي ومتابعة الشكوى',
    };
  }, [activePreset, selectedNodeId]);

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Quality Control Tower"
        subtitle="برج المراقبة وتتبع دورة الجودة المغلقة: اكتشاف نقطة التوقف، التتبع العكسي، والانتقال الفوري لأي شاشة"
        breadcrumbs={[{ label: 'الجودة الذكية' }, { label: 'برج المراقبة والتتبع' }]}
        actions={{
          refresh: () => {
            seedComprehensiveQualityLifecycle();
            toast.success('تم تحديث شجرة البيانات الحية بنجاح');
          },
          custom: [
            {
              label: 'إعادة تهيئة التجربة',
              variant: 'secondary',
              onClick: () => {
                seedComprehensiveQualityLifecycle();
                toast.success('تمت إعادة تهيئة رحلة الـ 5 خامات والـ 7 مراحل');
              }
            }
          ]
        }}
      />

      {/* ========================================================================= */}
      {/* 1. UNIVERSAL SELECTOR & SEARCH BAR                                        */}
      {/* ========================================================================= */}
      <section className="glass-panel p-5 rounded-[2rem] border border-white/10 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-white/50">مسارات التجربة النموذجية:</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleSelectPreset('batch-901')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activePreset === 'batch-901'
                    ? 'bg-[#0066CC] text-white shadow-lg shadow-[#0066CC]/30 ring-2 ring-[#00A3E0]/40'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <span>⚙️</span> تشغيلة المضخة BATCH-901 (الدورة الكاملة)
              </button>

              <button
                onClick={() => handleSelectPreset('seal-lot-02')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activePreset === 'seal-lot-02'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-400/40'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <span>🛑</span> لوت موانع التسرب LOT-02 (حالة توقف)
              </button>

              <button
                onClick={() => handleSelectPreset('complaint-101')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activePreset === 'complaint-101'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-2 ring-amber-400/40'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <span>⚠️</span> شكوى العميل CMP-101 (تتبع عكسي)
              </button>

              <button
                onClick={() => handleSelectPreset('valve-lot-03')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activePreset === 'valve-lot-03'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <span>✅</span> لوت الصمامات LOT-03 (مطابق 100%)
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="ابحث بكود أو لوت أو سيريال..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-[#00A3E0] focus:outline-none"
            />
          </div>
        </div>

        {/* Live Headline Status Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3 border-t border-white/5">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-black border ${journeyHeadline.badgeColor}`}>
              {journeyHeadline.badge}
            </span>
            <div className="text-xs text-white/70">
              <span className="text-white/40">الموقع الحالي: </span>
              <strong className="text-white">{journeyHeadline.location}</strong>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-white/40">المسؤول: </span>
              <strong className="text-[#00A3E0]">{journeyHeadline.responsible}</strong>
            </div>
            <div className="w-24 bg-white/10 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  journeyHeadline.progress === 100 
                    ? 'bg-emerald-500' 
                    : (journeyHeadline.progress <= 30 ? 'bg-rose-500' : 'bg-[#00A3E0]')
                }`}
                style={{ width: `${journeyHeadline.progress}%` }}
              />
            </div>
            <span className="font-mono font-bold text-white/80">{journeyHeadline.progress}%</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. METRO SUBWAY-LINE JOURNEY TRACKER                                      */}
      {/* Shows which stations passed, and where the record stopped or stalled      */}
      {/* ========================================================================= */}
      <section className="glass-panel p-6 rounded-[2rem] border border-white/10 shadow-xl overflow-x-auto">
        <div className="min-w-[700px] flex items-center justify-between relative px-6 py-2">
          {/* Track Line behind stations */}
          <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-1 bg-white/10 z-0" />

          {metroStations.map((station, idx) => {
            const isDone = station.status === 'done';
            const isFailed = station.status === 'failed';
            const isCurrent = station.status === 'current';
            const isInvestigation = station.status === 'investigation';
            const isBlocked = station.status === 'blocked';

            return (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center group cursor-pointer">
                {/* Station Node Badge */}
                <div 
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition-all shadow-md ${
                    isDone 
                      ? 'bg-emerald-500 text-white shadow-emerald-500/25 ring-4 ring-emerald-500/20' 
                      : (isFailed 
                          ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-600/30' 
                          : (isCurrent 
                              ? 'bg-[#0066CC] text-white ring-4 ring-[#00A3E0]/30 animate-pulse'
                              : (isInvestigation
                                  ? 'bg-amber-500 text-white ring-4 ring-amber-500/20 animate-pulse'
                                  : 'bg-slate-800 text-white/30 border border-white/10'
                                )
                            )
                        )
                  }`}
                >
                  {isDone ? <Check className="w-5 h-5" /> : (isFailed ? <X className="w-5 h-5" /> : idx + 1)}
                </div>

                {/* Station Titles */}
                <span className="text-[11px] font-bold text-white mt-2 max-w-[90px] leading-tight">
                  {station.name}
                </span>
                <span className={`text-[10px] font-mono mt-0.5 ${
                  isFailed ? 'text-rose-400 font-bold' : (isInvestigation ? 'text-amber-400 font-bold' : (isDone ? 'text-emerald-400' : 'text-white/30'))
                }`}>
                  {station.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. DUAL-PANE COCKPIT: VISUAL MAP (65%) + INSPECTION COCKPIT (35%)         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT / CENTER: THE VISUAL STREAM DIAGRAM (65% width) */}
        <div className="lg:col-span-8 space-y-6">
          {/* SECTION 1: INCOMING RAW MATERIALS (5 Material Cards) */}
          <div className="glass-panel p-6 rounded-[2.5rem] border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-[#00A3E0] flex items-center justify-center font-bold text-xs">1</div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">الخامات الواردة وفحص الاستلام (IQC)</h3>
                  <p className="text-[11px] text-white/40">5 خامات بأكواد ولوتات وفحوصات جودة منفصلة</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/5 text-white/60">
                MIL-STD-105E
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {nodes.filter(n => n.category === 'raw-material').map((rm) => {
                const isSelected = selectedNodeId === rm.id;
                const isFail = rm.status === 'fail';
                const isCond = rm.status === 'conditional';

                return (
                  <div
                    key={rm.id}
                    onClick={() => setSelectedNodeId(rm.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-gradient-to-b from-[#0066CC]/30 to-[#00A3E0]/10 border-[#00A3E0] ring-2 ring-[#00A3E0]/40 shadow-xl'
                        : (isFail 
                            ? 'bg-rose-500/10 border-rose-500/30 hover:border-rose-400' 
                            : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.08]')
                    }`}
                  >
                    {isFail && (
                      <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-rose-600 text-white text-[9px] font-black rounded-full shadow animate-bounce">
                        🛑 STOP
                      </span>
                    )}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] font-bold text-[#00A3E0]">{rm.code}</span>
                      <div className={`w-2 h-2 rounded-full ${isFail ? 'bg-rose-500' : (isCond ? 'bg-amber-500' : 'bg-emerald-500')}`} />
                    </div>
                    <p className="text-[11px] font-bold text-white line-clamp-1">{rm.titleAr.replace(/^خامة \d+: /, '')}</p>
                    <p className="font-mono text-[9px] text-white/40 mt-1">{rm.lotOrBatch}</p>

                    <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className={`text-[9px] font-black uppercase ${isFail ? 'text-rose-400' : (isCond ? 'text-amber-400' : 'text-emerald-400')}`}>
                        {isFail ? 'FAIL مرفوض' : (isCond ? 'مشروط' : 'PASS مطابق')}
                      </span>
                      <ChevronRight className="w-3 h-3 text-white/30 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CONNECTOR ARROWS & SUPPLIER NCR */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Direct Flow Arrow */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-3 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center">
              <span className="text-[10px] text-white/40 mb-1">الخامات المقبولة (4 خامات)</span>
              <ArrowDown className="w-5 h-5 text-emerald-400 animate-bounce" />
              <span className="text-[9px] text-emerald-400 font-bold">صرف لخط التجميع 1</span>
            </div>

            {/* Red Escalation to Supplier NCR */}
            <div className="md:col-span-8">
              {nodes.filter(n => n.category === 'supplier-ncr').map((sncr) => {
                const isSelected = selectedNodeId === sncr.id;
                return (
                  <div
                    key={sncr.id}
                    onClick={() => setSelectedNodeId(sncr.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/40 shadow-xl'
                        : 'bg-rose-950/20 border-rose-500/20 hover:border-rose-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        <span className="text-xs font-black text-rose-300">2. عدم مطابقة مورد (Supplier NCR)</span>
                      </div>
                      <span className="font-mono text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        {sncr.code}
                      </span>
                    </div>
                    <p className="text-xs text-white/80 font-medium">حجز وإرجاع لوت مانع التسرب LOT-2026-OR-02 (المورد: Apex Polymer)</p>
                    <p className="text-[10px] text-rose-300/60 mt-1">🛑 نقطة توقف كاملة: حجر الشحنة في مستودع الحجر الأصفر ومنع دخولها للمصنع</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: ASSEMBLY & DEFECTS */}
          <div className="glass-panel p-6 rounded-[2.5rem] border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">3</div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">خط التجميع 1 ومسجل العيوب (Assembly & Defect Log)</h3>
                  <p className="text-[11px] text-white/40">تشغيلة التجميع BATCH-2026-901 لعدد 500 مضخة هيدروليكية</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedNodeId('BATCH-2026-901')}
                className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[#0066CC]/20 text-[#00A3E0] border border-[#00A3E0]/30 hover:bg-[#0066CC]/30"
              >
                BATCH-2026-901
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {nodes.filter(n => n.category === 'defect').map((def) => {
                const isSelected = selectedNodeId === def.id;
                return (
                  <div
                    key={def.id}
                    onClick={() => setSelectedNodeId(def.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-[#0066CC]/30 border-[#00A3E0] ring-2 ring-[#00A3E0]/40 shadow-xl'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] font-bold text-amber-400">{def.code}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {def.details['الكمية المتأثرة']}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white line-clamp-1">{def.titleAr.replace(/^عيب: /, '')}</p>
                    <p className="text-[10px] text-white/40 mt-1 line-clamp-1">{def.location}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 4 & 5: CONTROL PLAN, AUDIT, INTERNAL NCR & CAPA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 4: Control Plan & Process Audit */}
            <div className="glass-panel p-5 rounded-[2rem] border border-white/10 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[10px]">4</div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">خطة المراقبة والتدقيق الداخلي</h4>
              </div>

              {nodes.filter(n => n.category === 'control-plan' || n.category === 'audit').map((item) => {
                const isSelected = selectedNodeId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedNodeId(item.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-400 ring-2 ring-purple-400/40 shadow-lg'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] font-bold text-purple-300">{item.code}</span>
                      <span className="text-[9px] text-white/50">{item.assignedTo}</span>
                    </div>
                    <p className="text-xs font-bold text-white line-clamp-1">{item.titleAr}</p>
                  </div>
                );
              })}
            </div>

            {/* Box 5: Closed-Loop NCR & CAPA */}
            <div className="glass-panel p-5 rounded-[2rem] border border-white/10 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">5</div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">حلقة المعالجة والتحسين المغلقة (NCR & CAPA)</h4>
              </div>

              {nodes.filter(n => n.category === 'internal-ncr' || n.category === 'capa').map((item) => {
                const isSelected = selectedNodeId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedNodeId(item.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] font-bold text-amber-300">{item.code}</span>
                      <span className="text-[9px] text-amber-400 font-bold">{item.statusLabelAr}</span>
                    </div>
                    <p className="text-xs font-bold text-white line-clamp-1">{item.titleAr}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 6 & 7: OQC & CUSTOMER COMPLAINT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 6: Outgoing OQC */}
            {nodes.filter(n => n.category === 'oqc').map((oqc) => {
              const isSelected = selectedNodeId === oqc.id;
              return (
                <div
                  key={oqc.id}
                  onClick={() => setSelectedNodeId(oqc.id)}
                  className={`glass-panel p-5 rounded-[2rem] border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-400/40 shadow-xl'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">6</div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">الفحص الصادر (OQC)</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      PASS معتمد
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white">{oqc.titleAr}</p>
                  <p className="text-[10px] text-white/50 mt-1">اعتماد شحن 480 مضخة بعد 100% فرز وضغط 280 بار</p>
                </div>
              );
            })}

            {/* Box 7: Customer Complaint */}
            {nodes.filter(n => n.category === 'customer-complaint').map((cmp) => {
              const isSelected = selectedNodeId === cmp.id;
              return (
                <div
                  key={cmp.id}
                  onClick={() => setSelectedNodeId(cmp.id)}
                  className={`glass-panel p-5 rounded-[2rem] border transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/40 shadow-xl'
                      : 'border-rose-500/20 bg-rose-500/5 hover:border-rose-500/40'
                  }`}
                >
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-rose-600 text-white text-[9px] font-black rounded-full shadow animate-pulse">
                    ⚠️ FIELD ISSUE
                  </span>
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-[10px]">7</div>
                      <h4 className="text-xs font-black text-rose-300 uppercase tracking-wider">العميل والشكوى والتتبع العكسي</h4>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-rose-300">{cmp.code}</span>
                  </div>
                  <p className="text-xs font-bold text-white">{cmp.titleAr}</p>
                  <p className="text-[10px] text-rose-300/60 mt-1">العميل: شركة الأمل للمعدات الصناعية (سيريال PUMP-901-042/043)</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* RIGHT PANE: THE DEEP INSPECTION & ACTION COCKPIT (35% width)           */}
        {/* Answers: Where did it stop? Why? Who is in charge? One-click jump.    */}
        {/* ===================================================================== */}
        <div className="lg:col-span-4">
          <div className="sticky top-6 glass-panel p-6 rounded-[2.5rem] border border-white/10 space-y-6 shadow-2xl">
            {/* Cockpit Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00A3E0]">
                  {activeNode.moduleLabelAr}
                </span>
                <h3 className="text-lg font-black text-white mt-0.5 leading-snug">{activeNode.code}</h3>
                <p className="text-xs text-white/60 font-medium">{activeNode.titleAr}</p>
              </div>

              <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/50">
                <Compass className="w-5 h-5 text-[#00A3E0]" />
              </div>
            </div>

            {/* Stop Point & Lifecycle Diagnostic Card */}
            <div className={`p-4 rounded-2xl border ${
              activeNode.isStopPoint
                ? 'bg-rose-500/10 border-rose-500/30'
                : (activeNode.status === 'conditional' || activeNode.status === 'investigation'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-emerald-500/10 border-emerald-500/30')
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {activeNode.isStopPoint ? (
                  <XCircle className="w-4 h-4 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                <span className="text-xs font-black text-white">
                  {activeNode.isStopPoint ? '🛑 نقطة توقف وحجز في دورة الجودة' : 'الحالة والتشخيص المرحلي'}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-white/80">
                {activeNode.stopReasonAr || 'السجل مطابق للمعايير واجتاز مرحلة التفتيش بنجاح.'}
              </p>

              {activeNode.nextStepAr && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-0.5">الخطوة التالية المطلوبة:</span>
                  <p className="text-xs font-medium text-[#00A3E0]">{activeNode.nextStepAr}</p>
                </div>
              )}
            </div>

            {/* Quick Metadata Table */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                <span className="text-white/40">المسؤول الحالي:</span>
                <span className="font-bold text-white">{activeNode.assignedTo || 'فريق الجودة'}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                <span className="text-white/40">الموقع / المحطة:</span>
                <span className="font-bold text-white line-clamp-1">{activeNode.location || 'خط الإنتاج'}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                <span className="text-white/40">تاريخ التسجيل:</span>
                <span className="font-mono text-white/70">{activeNode.timestamp || '2026-10-06'}</span>
              </div>

              {Object.entries(activeNode.details).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03]">
                  <span className="text-white/40">{key}:</span>
                  <span className="font-medium text-white/90 text-right">{val}</span>
                </div>
              ))}
            </div>

            {/* Linked Quality Records */}
            {activeNode.linkedToIds && activeNode.linkedToIds.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className="text-[10px] font-black uppercase tracking-wider text-white/40">السجلات المترابطة معه:</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeNode.linkedToIds.map(linkId => (
                    <button
                      key={linkId}
                      onClick={() => setSelectedNodeId(linkId)}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#0066CC]/20 text-[#00A3E0] border border-[#00A3E0]/30 hover:bg-[#0066CC]/30 transition-all flex items-center gap-1"
                    >
                      <Layers className="w-3 h-3" />
                      {linkId}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* One-Click Navigation & Deep Jump Action Buttons */}
            <div className="pt-4 border-t border-white/10 space-y-2.5">
              <button
                onClick={() => navigate(activeNode.moduleUrl)}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-[#0066CC] to-[#00A3E0] hover:brightness-110 active:scale-95 text-white font-black text-xs rounded-2xl shadow-xl shadow-[#0066CC]/30 transition-all uppercase tracking-wider"
              >
                <ExternalLink className="w-4 h-4" />
                الانتقال إلى شاشة {activeNode.moduleLabelAr} ↗
              </button>

              <button
                onClick={() => {
                  toast.success(`تم استخراج تقرير تتبع السجل ${activeNode.code}`, {
                    description: 'تقرير التتبع المغلق جاهز للطباعة والتدقيق الخارجي.'
                  });
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold text-xs rounded-2xl transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                تصدير شهادة التتبع الشاملة (Traceability Certificate)
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export default QualityControlTower;
