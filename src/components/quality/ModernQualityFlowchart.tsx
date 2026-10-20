// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Smartphone, Activity, ShieldAlert, Workflow, PackageCheck,
  ShieldCheck, Database, ArrowDown, RefreshCw, CheckCircle2,
  ArrowUpRight, Search, AlertTriangle, Layers, ChevronDown, CheckSquare,
  Sparkles, FileText, Barcode, Brain, Blocks, Library, Users, GitFork,
  HelpCircle, ChevronRight, CornerDownRight, Crosshair, MapPin, X,
  Shield, Check, ExternalLink, Lock, AlertOctagon, RotateCcw, PlusCircle
} from 'lucide-react';
import { 
  ENTERPRISE_DEPARTMENTS, 
  getDepartmentForStation 
} from '../../services/enterpriseDepartmentsEngine';
import { unifiedInspectionApi } from '../../api/unified-api';
import type { ScadaEquipment } from '../../pages/quality/QualityControlTower';

export interface ModernQualityFlowchartProps {
  equipmentList: ScadaEquipment[];
  stationStatuses: Record<string, any>;
  selectedStationId: string | null;
  onSelectStation: (stationId: string) => void;
  isAr: boolean;
  onSwitchToSCADA?: () => void;
}

export interface TrackedLotJourney {
  lotNumber: string;
  materialNameAr: string;
  materialNameEn: string;
  materialCode: string;
  categoryAr: string;
  categoryEn: string;
  supplierNameAr: string;
  supplierNameEn: string;
  receivedDate: string;
  currentStageNumber: number; // 1 to 7
  currentStageNameAr: string;
  currentStageNameEn: string;
  status: 'quarantined' | 'in-progress' | 'hold' | 'completed';
  statusLabelAr: string;
  statusLabelEn: string;
  stoppedStationCode: string;
  stoppedStationTitleAr: string;
  stoppedStationTitleEn: string;
  stopReasonAr: string;
  stopReasonEn: string;
  passedStageNumbers: number[];
  blockedStageNumbers: number[];
  actionRequiredAr: string;
  actionRequiredEn: string;
  relatedRecordCode?: string;
  relatedRecordUrl?: string;
  flowNarrativeAr: string;
  flowNarrativeEn: string;
  isLiveInspection?: boolean;
}

// Built-in Sample Quality Lifecycles
export const TRACKED_LOTS_DATABASE: TrackedLotJourney[] = [
  {
    lotNumber: 'LOT-2026-OR-02',
    materialNameAr: 'جوانات مطاطية عالية الضغط NBR 25x3mm',
    materialNameEn: 'High-Pressure NBR O-Rings 25x3mm',
    materialCode: 'RM-SEAL-NBR',
    categoryAr: 'فحص استلام (IQC)',
    categoryEn: 'Incoming Inspection (IQC)',
    supplierNameAr: 'أبيكس بوليمرز وسيلز (Apex Polymer & Seals Ltd.)',
    supplierNameEn: 'Apex Polymer & Seals Ltd.',
    receivedDate: '2026-10-02',
    currentStageNumber: 3,
    currentStageNameAr: 'المرحلة 3: عدم المطابقة وحل المشكلات (NCR)',
    currentStageNameEn: 'Stage 3: NCR & Problem Solving',
    status: 'quarantined',
    statusLabelAr: '🛑 محجوزة بحجر الجودة (Quarantined)',
    statusLabelEn: 'Quarantined in Yellow Bin',
    stoppedStationCode: 'NCR-01',
    stoppedStationTitleAr: 'تقارير عدم المطابقة NCR',
    stoppedStationTitleEn: 'NCR Non-Conformance Reports',
    stopReasonAr: 'رصد 28 عيب من أصل 80 عينة مفحوصة في فحص الاستلام IQC. انكماش بالأبعاد وصلابة Shore A أقل من المواصفة (62 بدل 75).',
    stopReasonEn: 'Detected 28/80 defectives during IQC receiving inspection. Dimensional shrinkage and low Shore A hardness (62 instead of 75).',
    passedStageNumbers: [1],
    blockedStageNumbers: [2, 4, 5, 6, 7],
    actionRequiredAr: 'تم فتح تقرير عدم مطابقة NCR-SUP-2026-001، وتفعيل حجر فوري في الصندوق الأصفر ومطالبة المورد بالاستبدال الفوري مع حظر إدخالها لصالة الإنتاج.',
    actionRequiredEn: 'NCR-SUP-2026-001 opened, material locked in yellow containment bin, RTV return to vendor initiated.',
    relatedRecordCode: 'NCR-SUP-2026-001',
    relatedRecordUrl: '/quality/records/ncr',
    flowNarrativeAr: 'وصلت الشحنة رصيف الاستلام (1) ➔ خضعت لفحص خطط الاستلام ➔ رُصد عيب الصلابة ➔ تحويل إجباري مباشر عبر بوابة القرار 1 نحو المرحلة 3 (NCR) ➔ حجز تام ومنع وصولها للإنتاج.',
    flowNarrativeEn: 'Arrived at receiving dock (Stage 1) -> Failed IQC inspection -> Diverted by Decision Gate 1 into Stage 3 NCR -> Quarantined.'
  },
  {
    lotNumber: 'LOT-2026-AL-01',
    materialNameAr: 'سبائك ألمونيوم للطائرات 7075-T6',
    materialNameEn: 'Aircraft Grade Aluminum 7075-T6 Billets',
    materialCode: 'RM-ALUM-7075',
    categoryAr: 'خامات واردة مقبولة',
    categoryEn: 'Approved Raw Material',
    supplierNameAr: 'بريسيجن ميتالز (Precision Metals Co.)',
    supplierNameEn: 'Precision Metals Co.',
    receivedDate: '2026-10-01',
    currentStageNumber: 2,
    currentStageNameAr: 'المرحلة 2: جودة التصنيع والعمليات (IPQC)',
    currentStageNameEn: 'Stage 2: In-Process Quality (IPQC)',
    status: 'in-progress',
    statusLabelAr: '⚙️ قيد التشغيل بالخط (In-Process)',
    statusLabelEn: 'In Production Shopfloor',
    stoppedStationCode: 'SHP-01',
    stoppedStationTitleAr: 'تسجيل سريع من الأرضية',
    stoppedStationTitleEn: 'Fast Shopfloor Entry',
    stopReasonAr: 'الخامة اجتازت فحص الاستلام بنجاح، ومصروفة حالياً لأمر الشغل WO-2026-880 على ماكينات الخراطة وخط التجميع 1.',
    stopReasonEn: 'Passed IQC receiving test 100%. Dispatched to shopfloor work order WO-2026-880 on machining line 1.',
    passedStageNumbers: [1],
    blockedStageNumbers: [3, 4, 5, 6, 7],
    actionRequiredAr: 'متابعة كارتات التحكم الإحصائي SPC ومراقبة تفاوتات الأقطار والتشغيل اللحظي.',
    actionRequiredEn: 'Continuous SPC monitoring and operator shift defect logging.',
    relatedRecordCode: 'INS-2026-RM-01',
    relatedRecordUrl: '/compliance/hub/inspection',
    flowNarrativeAr: 'اجتازت فحص الاستلام بالمرحلة 1 بنجاح تام ➔ عبرت بوابة القرار 1 بإجازة خضراء ➔ استقرت حالياً في صالة التصنيع بالمرحلة 2 قيد التشغيل.',
    flowNarrativeEn: 'Cleared Stage 1 IQC with full pass -> Advanced through Gate 1 -> Currently being processed on Stage 2 shopfloor.'
  },
  {
    lotNumber: 'BATCH-2026-901',
    materialNameAr: 'طلمبات هيدروليكية كاملة Model HP-200X',
    materialNameEn: 'Complete Hydraulic Pumps Model HP-200X',
    materialCode: 'FG-PUMP-HP200X',
    categoryAr: 'منتج تام الصنع (Finished Goods)',
    categoryEn: 'Finished Goods Batch',
    supplierNameAr: 'صالة الإنتاج والتجميع - خط 1',
    supplierNameEn: 'Main Assembly Shopfloor Line 1',
    receivedDate: '2026-10-05',
    currentStageNumber: 5,
    currentStageNameAr: 'المرحلة 5: شكاوى العملاء والميدان',
    currentStageNameEn: 'Stage 5: Customer Complaints & Field QA',
    status: 'hold',
    statusLabelAr: '⚠️ بلاغ عميل ميداني (Customer RMA)',
    statusLabelEn: 'Customer Warranty Claim',
    stoppedStationCode: 'CMP-01',
    stoppedStationTitleAr: 'سجل شكاوى العملاء',
    stoppedStationTitleEn: 'Customer Complaints Log',
    stopReasonAr: 'ورد بلاغ من العميل بتروجاس مصر (PetroGas Egypt) بحدوث تسريب زيت طفيف في بورت B بعد 120 ساعة تشغيل ميداني.',
    stopReasonEn: 'Customer claim reported by PetroGas Egypt: Micro-leakage on port B after 120 hours of field operation.',
    passedStageNumbers: [1, 2, 3, 4],
    blockedStageNumbers: [],
    actionRequiredAr: 'جاري تشكيل فريق حل المشكلات 8D لتحليل العزم في التجميع وتحديث خطة التحكم FMEA.',
    actionRequiredEn: '8D team assembled to investigate assembly torque tolerance and update Control Plan FMEA.',
    relatedRecordCode: 'COMP-2026-008',
    relatedRecordUrl: '/quality/records/complaint',
    flowNarrativeAr: 'بدأت من الخامات 1 ➔ صُنعت بـ 2 ➔ حُل عيب عزم بـ 3 ➔ فُحصت بـ 4 وأُصدرت شهادة المطابقة COC ➔ تم الشحن للعميل، وتوقفت بالمرحلة 5 لمتابعة الشكوى.',
    flowNarrativeEn: 'Traveled through Stages 1, 2, 3, 4 (released with COC) -> Delivered -> Customer claim logged in Stage 5.'
  },
  {
    lotNumber: 'LOT-2026-VL-03',
    materialNameAr: 'صمامات بلانجر ستانلس ستيل SS316',
    materialNameEn: 'Stainless Steel 316 Valve Plungers',
    materialCode: 'RM-VALV-SS316',
    categoryAr: 'تشغيلة تجميع منتهية',
    categoryEn: 'Assembled Sub-lot',
    supplierNameAr: 'دلتا بريسيجن (Delta Precision Components)',
    supplierNameEn: 'Delta Precision Components',
    receivedDate: '2026-10-02',
    currentStageNumber: 4,
    currentStageNameAr: 'المرحلة 4: فحص وخروج المنتج النهائي (OQC)',
    currentStageNameEn: 'Stage 4: Outgoing Quality (OQC)',
    status: 'in-progress',
    statusLabelAr: '🔍 قيد الفحص النهائي AQL',
    statusLabelEn: 'Final Release Sampling',
    stoppedStationCode: 'OQC-01',
    stoppedStationTitleAr: 'فحص جودة الشحنات الصادرة (OQC)',
    stoppedStationTitleEn: 'Pre-Shipment Inspection (OQC)',
    stopReasonAr: 'اللوت مكتمل التجميع وقيد سحب عينات القبول AQL Level II للتأكد من مطابقة أبعاد الصمامات قبل الشحن.',
    stopReasonEn: 'Batch fully assembled. Undergoing final AQL Level II sampling verification prior to releasing shipment.',
    passedStageNumbers: [1, 2],
    blockedStageNumbers: [5, 6, 7],
    actionRequiredAr: 'في انتظار توقيع شهادة المطابقة COC للإفراج النهائي والشحن.',
    actionRequiredEn: 'Awaiting final Certificate of Conformance (COC) sign-off.',
    relatedRecordCode: 'INS-2026-OQC-01',
    relatedRecordUrl: '/outgoing-quality',
    flowNarrativeAr: 'اجتازت استلام الخامات 1 ➔ اجتازت خطوط الإنتاج والـ SPC بالمرحلة 2 ➔ تقف الآن في محطة الفحص النهائي AQL بالمرحلة 4 بانتظار الإفراج.',
    flowNarrativeEn: 'Passed Stage 1 IQC -> Cleared Stage 2 production with Cpk 1.48 -> Currently at Stage 4 Final OQC dock.'
  },
  {
    lotNumber: 'LOT-2026-OL-05',
    materialNameAr: 'زيت هيدروليكي صناعي مضاد للتآكل ISO VG 46',
    materialNameEn: 'ISO VG 46 Anti-Wear Hydraulic Oil',
    materialCode: 'RM-OIL-ISO46',
    categoryAr: 'شحنة مكتملة ومغلقة 100%',
    categoryEn: 'Completed Quality Cycle',
    supplierNameAr: 'جلف للزيوت (Gulf Lubricants & Fluids)',
    supplierNameEn: 'Gulf Lubricants & Fluids',
    receivedDate: '2026-10-03',
    currentStageNumber: 7,
    currentStageNameAr: 'المرحلة 7: تهيئة المصنع والبيانات',
    currentStageNameEn: 'Stage 7: Setup & Master Data',
    status: 'completed',
    statusLabelAr: '🏁 مكتمل ومطابق 100% (Completed)',
    statusLabelEn: 'Fully Closed Quality Journey',
    stoppedStationCode: 'KB-01',
    stoppedStationTitleAr: 'قاعدة الدروس المستفادة',
    stoppedStationTitleEn: 'Lessons Learned Knowledge Base',
    stopReasonAr: 'تم الإفراج التام عن الشحنة وتسليمها للعميل مع رضا 100%، وتم أرشفة مواصفات لزوجة الزيت بقاعدة المعرفة والبيانات الرئيسية.',
    stopReasonEn: 'Batch cleared, shipped and received with 100% customer satisfaction. Specs archived in Knowledge Base.',
    passedStageNumbers: [1, 2, 4, 5, 6, 7],
    blockedStageNumbers: [],
    actionRequiredAr: 'دورة جودة مغلقة وناجحة بنسبة 100% بدون أي انحرافات، تغذي معايير التوريد القادمة.',
    actionRequiredEn: 'Zero-defect closed cycle feeding incoming specs for upcoming purchasing orders.',
    relatedRecordCode: 'KB-2026-01',
    relatedRecordUrl: '/quality-knowledge-base',
    flowNarrativeAr: 'أكملت الدورة الكاملة بنجاح من المورد حتى العميل، وتم حفظ الدروس المستفادة في المرحلة 7 وتغذية استلام الخامات.',
    flowNarrativeEn: 'Completed entire closed-loop journey across all quality stages successfully.'
  }
];

export const ModernQualityFlowchart: React.FC<ModernQualityFlowchartProps> = ({
  equipmentList,
  stationStatuses,
  selectedStationId,
  onSelectStation,
  isAr,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedStageId, setHighlightedStageId] = useState<string | null>(null);

  // Active Tracked Lot Journey State
  const [selectedLotNumber, setSelectedLotNumber] = useState<string | null>(null);
  const [lotSearchInput, setLotSearchInput] = useState<string>('');

  // --------------------------------------------------------------------------
  // DYNAMIC INCOMING INSPECTIONS LOADER (Loads from localStorage & syncs live)
  // --------------------------------------------------------------------------
  const [realIncomingInspections, setRealIncomingInspections] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('qms_local_inspections') || localStorage.getItem('qms_local_inspection') || '[]';
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(item => {
          const t = (item.type || '').toLowerCase();
          return t === 'incoming' || t === 'iqc' || !item.type;
        });
      }
    } catch {}
    
    // Default seed incoming inspections
    return [
      {
        id: 'INS-2026-RM-01',
        inspectionNumber: 'INS-2026-RM-01',
        productName: 'سبائك ألمونيوم 7075-T6 للطائرات',
        product: 'RM-ALUM-7075',
        batchNumber: 'LOT-2026-AL-01',
        type: 'incoming',
        inspectedBy: 'م. مصطفى رفعت',
        inspectionDate: '2026-10-01',
        sampleSize: 32,
        defectCount: 0,
        result: 'pass',
        status: 'pass',
        supplierName: 'بريسيجن ميتالز (Precision Metals Co.)'
      },
      {
        id: 'INS-2026-RM-02',
        inspectionNumber: 'INS-2026-RM-02',
        productName: 'جوانات مطاطية عالية الضغط NBR 25x3mm',
        product: 'RM-SEAL-NBR',
        batchNumber: 'LOT-2026-OR-02',
        type: 'incoming',
        inspectedBy: 'م. مصطفى رفعت',
        inspectionDate: '2026-10-02',
        sampleSize: 80,
        defectCount: 28,
        result: 'fail',
        status: 'fail',
        supplierName: 'أبيكس بوليمرز (Apex Polymer & Seals Ltd.)'
      },
      {
        id: 'INS-2026-RM-03',
        inspectionNumber: 'INS-2026-RM-03',
        productName: 'صمامات بلانجر SS316',
        product: 'RM-VALV-SS316',
        batchNumber: 'LOT-2026-VL-03',
        type: 'incoming',
        inspectedBy: 'تامر عادل',
        inspectionDate: '2026-10-02',
        sampleSize: 50,
        defectCount: 0,
        result: 'pass',
        status: 'pass',
        supplierName: 'دلتا بريسيجن (Delta Precision)'
      },
      {
        id: 'INS-2026-RM-04',
        inspectionNumber: 'INS-2026-RM-04',
        productName: 'مسامير صلب مجلفن M8x45 Grade 10.9',
        product: 'RM-BOLT-M8GR10',
        batchNumber: 'LOT-2026-BL-04',
        type: 'incoming',
        inspectedBy: 'تامر عادل',
        inspectionDate: '2026-10-03',
        sampleSize: 200,
        defectCount: 0,
        result: 'pass',
        status: 'pass',
        supplierName: 'تيتان فاستنرز (Titan Fasteners)'
      },
      {
        id: 'INS-2026-RM-05',
        inspectionNumber: 'INS-2026-RM-05',
        productName: 'زيت هيدروليكي صناعي مضاد للتآكل ISO 46',
        product: 'RM-OIL-ISO46',
        batchNumber: 'LOT-2026-OL-05',
        type: 'incoming',
        inspectedBy: 'كيميائية سلمى أحمد',
        inspectionDate: '2026-10-03',
        sampleSize: 8,
        defectCount: 0,
        result: 'pass',
        status: 'pass',
        supplierName: 'جلف للزيوت (Gulf Lubricants)'
      }
    ];
  });

  // Listen for storage changes across browser tabs, and fetch live from server PHP API
  useEffect(() => {
    const handleStorage = () => {
      try {
        const raw = localStorage.getItem('qms_local_inspections') || localStorage.getItem('qms_local_inspection') || '[]';
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const incomingOnly = parsed.filter(item => {
            const t = (item.type || '').toLowerCase();
            return t === 'incoming' || t === 'iqc' || !item.type;
          });
          if (incomingOnly.length > 0) {
            setRealIncomingInspections(incomingOnly);
          }
        }
      } catch {}
    };

    window.addEventListener('storage', handleStorage);

    // Live fetch from server PHP API (so inspections entered from any device load immediately)
    const fetchServerInspections = async () => {
      try {
        const res = await unifiedInspectionApi.getAll();
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          const incoming = res.data.filter((item: any) => {
            const t = (item.type || '').toLowerCase();
            return t === 'incoming' || t === 'iqc' || !item.type;
          });
          if (incoming.length > 0) {
            setRealIncomingInspections(incoming);
          }
        }
      } catch (e) {
        console.warn('Live inspection fetch fallback to local storage:', e);
      }
    };

    fetchServerInspections();

    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Combined Trackable Lots (Live Real Inspections + Quality System Database)
  const allTrackableLots = useMemo(() => {
    const mappedFromInspections: TrackedLotJourney[] = realIncomingInspections.map(ins => {
      const lotNo = ins.batchNumber || ins.batch || ins.lot || ins.inspectionNumber || ins.id;
      const isPass = (ins.result || '').toLowerCase() === 'pass' || (ins.status || '').toLowerCase() === 'pass';
      const isFail = (ins.result || '').toLowerCase() === 'fail' || (ins.status || '').toLowerCase() === 'fail';

      return {
        lotNumber: lotNo,
        materialNameAr: ins.productName || ins.product || 'خامة واردة مفحوصة',
        materialNameEn: ins.productName || ins.product || 'Inspected Incoming Material',
        materialCode: ins.product || ins.productName || lotNo,
        categoryAr: 'فحص استلام فعلي (Live IQC)',
        categoryEn: 'Live IQC Receiving Inspection',
        supplierNameAr: ins.supplierName || ins.supplierId || 'مورد معتمد مسجل',
        supplierNameEn: ins.supplierName || ins.supplierId || 'Approved Supplier',
        receivedDate: ins.inspectionDate || ins.date || new Date().toISOString().split('T')[0],
        currentStageNumber: isFail ? 3 : isPass ? 2 : 1,
        currentStageNameAr: isFail ? 'المرحلة 3: عدم المطابقة وحل المشكلات (NCR)' : isPass ? 'المرحلة 2: جودة التصنيع والعمليات (IPQC)' : 'المرحلة 1: استلام الخامات والموردين (IQC)',
        currentStageNameEn: isFail ? 'Stage 3: NCR & Problem Solving' : isPass ? 'Stage 2: In-Process Quality (IPQC)' : 'Stage 1: Incoming & Supplier (IQC)',
        status: isFail ? 'quarantined' : isPass ? 'in-progress' : 'hold',
        statusLabelAr: isFail ? '🛑 مرفوضة ومحجوزة بـ NCR' : isPass ? '🟢 مقبولة ودخلت صالة الإنتاج' : '🟡 قيد استكمال الفحص',
        statusLabelEn: isFail ? 'Rejected & Quarantined' : isPass ? 'Approved for Production' : 'Pending Inspection',
        stoppedStationCode: isFail ? 'NCR-01' : isPass ? 'SHP-01' : 'IQC-01',
        stoppedStationTitleAr: isFail ? 'تقارير عدم المطابقة NCR' : isPass ? 'تسجيل سريع من الأرضية' : 'فحص الشحنات الواردة (IQC)',
        stoppedStationTitleEn: isFail ? 'NCR Non-Conformance' : isPass ? 'Fast Shopfloor Entry' : 'Incoming Inspection (IQC)',
        stopReasonAr: isFail 
          ? `فشلت في فحص الاستلام IQC (${ins.defectCount || 1} عيوب من ${ins.sampleSize || 0} عينة). تم الحجز الفوري وتحويلها لـ NCR لمنع دخولها للإنتاج.`
          : isPass 
            ? `اجتازت فحص الاستلام IQC بنجاح كامل (${ins.sampleSize || 0} عينة سليمة). صُرح لها بدخول صالة الإنتاج بالمرحلة 2.`
            : 'الشحنة قيد الفحص والتحليل المخبري في رصيف الاستلام.',
        stopReasonEn: isFail ? 'Failed IQC inspection - Quarantined in Stage 3' : 'Passed IQC - Released to Stage 2 Production',
        passedStageNumbers: isPass ? [1] : isFail ? [1] : [],
        blockedStageNumbers: isFail ? [2, 4, 5, 6, 7] : [3, 4, 5, 6, 7],
        actionRequiredAr: isFail 
          ? 'مطلوب فتح ومتابعة تقرير عدم مطابقة ومطالبة المورد بالتعويض الفوري.'
          : 'متابعة تشغيل الخامة على خطوط الإنتاج وتسجيل قراءات الـ SPC.',
        actionRequiredEn: isFail ? 'Action required in NCR' : 'Proceed with manufacturing',
        relatedRecordCode: ins.inspectionNumber || ins.id,
        relatedRecordUrl: '/compliance/hub/inspection',
        flowNarrativeAr: isFail
          ? `وصلت الخامة في ${ins.inspectionDate || ins.date || ''} ➔ رُفضت في فحص الاستلام ➔ تحويل إجباري عبر بوابة القرار 1 نحو المرحلة 3 (NCR) ➔ حجز تام لمنع الإنتاج.`
          : `وصلت الخامة في ${ins.inspectionDate || ins.date || ''} ➔ تم فحصها واعتمادها ➔ عبرت بوابة القرار 1 بنجاح ➔ استقرت في صالة الإنتاج (المرحلة 2).`,
        flowNarrativeEn: isFail ? 'Diverted to NCR' : 'Advanced to Production',
        isLiveInspection: true
      };
    });

    const seenLots = new Set<string>();
    const list: TrackedLotJourney[] = [];

    // Real Inspections first
    mappedFromInspections.forEach(item => {
      if (!seenLots.has(item.lotNumber)) {
        seenLots.add(item.lotNumber);
        list.push(item);
      }
    });

    // Default system demo lots
    TRACKED_LOTS_DATABASE.forEach(item => {
      if (!seenLots.has(item.lotNumber)) {
        seenLots.add(item.lotNumber);
        list.push(item);
      }
    });

    return list;
  }, [realIncomingInspections]);

  // Active Lot Details
  const trackedLot = useMemo(() => {
    if (!selectedLotNumber) return null;
    const found = allTrackableLots.find(l => l.lotNumber === selectedLotNumber);
    if (found) return found;

    // Fallback for custom searched lot
    return {
      lotNumber: selectedLotNumber,
      materialNameAr: `لوط مخصص: ${selectedLotNumber}`,
      materialNameEn: `Custom Lot: ${selectedLotNumber}`,
      materialCode: selectedLotNumber,
      categoryAr: 'تشغيلة مدخلة يدوياً',
      categoryEn: 'Manually Entered Batch',
      supplierNameAr: 'مورد مسجل في النظام',
      supplierNameEn: 'Approved Platform Supplier',
      receivedDate: new Date().toISOString().split('T')[0],
      currentStageNumber: 1,
      currentStageNameAr: 'المرحلة 1: استلام الخامات والموردين (IQC)',
      currentStageNameEn: 'Stage 1: Incoming & Supplier Quality (IQC)',
      status: 'in-progress',
      statusLabelAr: '🔍 قيد فحص الاستلام IQC',
      statusLabelEn: 'Under Receiving Inspection',
      stoppedStationCode: 'IQC-01',
      stoppedStationTitleAr: 'فحص الشحنات الواردة (IQC)',
      stoppedStationTitleEn: 'Incoming Inspection (IQC)',
      stopReasonAr: 'اللوت قيد التفتيش وسحب العينات المخبرية للتأكد من مطابقة المواصفات.',
      stopReasonEn: 'Batch under incoming QA verification and lot release.',
      passedStageNumbers: [],
      blockedStageNumbers: [2, 3, 4, 5, 6, 7],
      actionRequiredAr: 'في انتظار اعتماد نتيجة فحص الاستلام للإفراج لصالة الإنتاج.',
      actionRequiredEn: 'Awaiting receiving inspection release.',
      relatedRecordCode: 'IQC-NEW',
      relatedRecordUrl: '/compliance/hub/inspection',
      flowNarrativeAr: 'اللوت دخل النظام في المرحلة 1 وهو قيد فحص الاستلام حالياً.',
      flowNarrativeEn: 'Entered platform at Stage 1 IQC.'
    } as TrackedLotJourney;
  }, [selectedLotNumber, allTrackableLots]);

  // Group stations strictly by Department (7 Stages, 22 Tabs)
  const stationsByDept = useMemo(() => {
    const map = new Map<string, ScadaEquipment[]>();
    ENTERPRISE_DEPARTMENTS.forEach(dept => map.set(dept.id, []));
    equipmentList.forEach(eq => {
      const dept = getDepartmentForStation(eq.id);
      if (dept && map.has(dept.id)) {
        map.get(dept.id)!.push(eq);
      }
    });
    return map;
  }, [equipmentList]);

  // Overall Statistics
  const stats = useMemo(() => {
    let alertCount = 0;
    let normalCount = 0;
    equipmentList.forEach(eq => {
      const st = stationStatuses[eq.id];
      if (st && (st.status === 'alert' || st.isAndonActive)) alertCount++;
      else normalCount++;
    });
    return { alertCount, normalCount };
  }, [equipmentList, stationStatuses]);

  // Icon mapping
  const renderIcon = (iconType: string, className = 'w-5 h-5') => {
    switch (iconType) {
      case 'truck': return <Truck className={className} />;
      case 'pallet': return <PackageCheck className={className} />;
      case 'machine': return <Smartphone className={className} />;
      case 'wrench': return <Workflow className={className} />;
      case 'gauge': return <Activity className={className} />;
      case 'lab': return <ShieldCheck className={className} />;
      case 'package': return <PackageCheck className={className} />;
      default: return <Activity className={className} />;
    }
  };

  const scrollToStage = (stageId: string, highlight = false) => {
    const el = document.getElementById(stageId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (highlight) {
        setHighlightedStageId(stageId);
        setTimeout(() => setHighlightedStageId(null), 4000);
      }
    }
  };

  // Scroll directly to where the tracked lot is currently stopped
  const scrollToLotStopStage = () => {
    if (!trackedLot) return;
    const stageMap: Record<number, string> = {
      1: 'DEPT-STAGE-INCOMING',
      2: 'DEPT-STAGE-INPROCESS',
      3: 'DEPT-STAGE-RESOLUTION',
      4: 'DEPT-STAGE-OUTGOING',
      5: 'DEPT-STAGE-CUSTOMER',
      6: 'DEPT-STAGE-COMPLIANCE',
      7: 'DEPT-STAGE-SETUP'
    };
    const targetDeptId = stageMap[trackedLot.currentStageNumber] || 'DEPT-STAGE-INCOMING';
    scrollToStage(targetDeptId, true);
  };

  // Flowchart Card Component (Clean, Clickable, High Usability)
  const renderCard = (station: ScadaEquipment, accentColor: string, stageNumber: number) => {
    const stStatus = stationStatuses[station.id];
    const isAlert = stStatus?.status === 'alert' || stStatus?.isAndonActive;
    const isWarning = stStatus?.status === 'warning';
    const isSelected = selectedStationId === station.id;
    
    // Check if this station is the exact stopping point for the tracked lot
    const isLotStoppedHere = trackedLot && trackedLot.currentStageNumber === stageNumber && (
      station.code.toLowerCase() === trackedLot.stoppedStationCode.toLowerCase() ||
      trackedLot.stoppedStationTitleAr.includes(station.titleAr) ||
      station.titleAr.includes(trackedLot.stoppedStationTitleAr)
    );

    const matchesSearch = searchQuery.trim() 
      ? station.titleAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.code.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    if (!matchesSearch) return null;

    return (
      <div
        key={station.id}
        onClick={() => {
          onSelectStation(station.id);
          navigate(station.moduleUrl);
        }}
        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-start relative group shadow-sm hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between ${
          isLotStoppedHere
            ? 'bg-rose-950/40 border-rose-500 ring-4 ring-rose-500/50 shadow-2xl shadow-rose-900/50'
            : isSelected
              ? 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-500/30'
              : isAlert
                ? 'bg-rose-950/30 border-rose-500/70 hover:border-rose-400 shadow-rose-950/20'
                : isWarning
                  ? 'bg-amber-950/20 border-amber-500/70 hover:border-amber-400'
                  : 'bg-slate-900/90 border-slate-800/90 hover:border-slate-600 hover:bg-slate-800'
        }`}
        style={{
          borderTopColor: isLotStoppedHere ? '#f43f5e' : accentColor,
          borderTopWidth: isLotStoppedHere ? '6px' : '4px'
        }}
      >
        <div>
          {/* Card Top: Code & Status */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span 
                style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
                className="p-1.5 rounded-xl border border-white/10"
              >
                {renderIcon(station.iconType, 'w-4 h-4')}
              </span>
              <span className="text-xs font-mono font-black text-slate-300">
                {station.code}
              </span>
            </div>

            {isLotStoppedHere ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-slate-950 text-[10px] font-black border border-white flex items-center gap-1 shadow-md animate-pulse">
                <MapPin className="w-3 h-3 fill-slate-950" />
                <span>{isAr ? 'موقع الخامة الحالي 📍' : 'Lot Located Here'}</span>
              </span>
            ) : isAlert ? (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/40 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                <span>{stStatus?.statusLabelAr || 'تنبيه'}</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{isAr ? 'مطابق' : 'Pass'}</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-sm font-black text-white leading-snug mb-1 group-hover:text-cyan-300 transition-colors">
            {isAr ? station.titleAr : station.titleEn}
          </h4>
          <p className="text-xs text-slate-400 line-clamp-1 mb-3">
            {isAr ? station.locationAr : station.locationEn}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="font-mono text-slate-400 text-[11px]">
            FPY: <b className="text-emerald-400">{station.fpyEstimate || 99}%</b>
          </span>

          <span className="px-3 py-1 rounded-xl bg-cyan-500/15 group-hover:bg-cyan-500 text-cyan-300 group-hover:text-slate-950 font-black text-xs flex items-center gap-1 transition-all shadow-sm">
            <span>{isAr ? 'فتح التبويب' : 'Open Tab'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    );
  };

  // ANIMATED SVG FLOW PIPE COMPONENT
  const renderFlowPipe = (color: string, labelAr: string, labelEn: string) => {
    return (
      <div className="flex flex-col items-center my-3 relative">
        <svg width="32" height="48" className="overflow-visible">
          <defs>
            <linearGradient id={`pipeGrad-${color.replace('#','')}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="50%" stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor={color} stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <line
            x1="16" y1="0"
            x2="16" y2="38"
            stroke={`url(#pipeGrad-${color.replace('#','')})`}
            strokeWidth="3.5"
            strokeDasharray="6 4"
            className="flowchart-pipe-anim"
            strokeLinecap="round"
          />
          <polygon
            points="10,36 16,46 22,36"
            fill={color}
          />
        </svg>

        {labelAr && (
          <span className="mt-1 px-3 py-0.5 rounded-full bg-slate-900 border border-white/10 text-[10px] font-mono font-bold text-slate-400 shadow-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            <span>{isAr ? labelAr : labelEn}</span>
          </span>
        )}
      </div>
    );
  };

  // ADVANCED GEOMETRIC DECISION DIAMOND WITH DUAL-BRANCH CORRIDORS
  const renderDecisionDiamond = ({
    gateNumber,
    questionAr,
    questionEn,
    passLabelAr,
    passLabelEn,
    passTargetStageNumber,
    failLabelAr,
    failLabelEn,
    accentColor = '#f59e0b',
    targetNcr = true,
  }: {
    gateNumber: number;
    questionAr: string;
    questionEn: string;
    passLabelAr: string;
    passLabelEn: string;
    passTargetStageNumber: number;
    failLabelAr: string;
    failLabelEn: string;
    accentColor?: string;
    targetNcr?: boolean;
  }) => {
    // Check if tracked lot took the fail/branch path at this specific gateway
    const isLotDivertedHere = trackedLot && (
      (gateNumber === 1 && trackedLot.status === 'quarantined') ||
      (gateNumber === 2 && trackedLot.currentStageNumber === 3)
    );

    return (
      <div className="relative my-7 flex flex-col items-center w-full">
        {/* Incoming Flow Pipe from Stage */}
        <div className="flex flex-col items-center">
          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: accentColor }} />
          <div className="w-2.5 h-2.5 rounded-full animate-ping -mt-1" style={{ backgroundColor: accentColor }} />
        </div>

        {/* The Diamond Decision Gateway Box */}
        <div className={`relative w-full max-w-4xl mt-3 p-5 sm:p-7 rounded-3xl bg-gradient-to-b from-slate-900 via-[#0a101f] to-slate-950 border-2 shadow-2xl backdrop-blur-md transition-all group ${
          isLotDivertedHere ? 'border-rose-500 ring-4 ring-rose-500/40 shadow-rose-950/60' : ''
        }`}
          style={{ borderColor: isLotDivertedHere ? '#f43f5e' : `${accentColor}60` }}
        >
          {/* Top Diamond Identity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-4">
              {/* Geometric Diamond Symbol */}
              <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                <div 
                  className="absolute inset-0 rotate-45 rounded-xl border-2 shadow-lg transition-transform duration-500 group-hover:rotate-90 group-hover:scale-110"
                  style={{ 
                    backgroundColor: `${accentColor}20`,
                    borderColor: accentColor,
                    boxShadow: `0 0 20px ${accentColor}40`
                  }} 
                />
                <span className="relative font-black text-sm z-10" style={{ color: accentColor }}>
                  ◆
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span 
                    className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-md border"
                    style={{ 
                      backgroundColor: `${accentColor}15`, 
                      color: accentColor,
                      borderColor: `${accentColor}40`
                    }}
                  >
                    {isAr ? 'بوابة اتخاذ القرار الهندسية' : 'Engineering Decision Gateway'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono font-bold">
                    GATEWAY #{gateNumber}
                  </span>
                  {isLotDivertedHere && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-slate-950 text-[10px] font-black animate-pulse">
                      {isAr ? `مسار ${trackedLot.lotNumber}: انحراف لـ NCR ⚠️` : `Lot Path: Diverted to NCR`}
                    </span>
                  )}
                </div>
                <h4 className="text-sm sm:text-base font-black text-white mt-1">
                  {isAr ? questionAr : questionEn}
                </h4>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-400 hidden md:block">
              ISO 9001 / IATF Gate
            </div>
          </div>

          {/* DUAL BRANCH CORRIDORS (Pass ⬇️ vs Fail ➡️) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            {/* PASS BRANCH (GREEN) */}
            <div className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between group/pass ${
              isLotDivertedHere 
                ? 'opacity-40 bg-slate-900/50 border-slate-800' 
                : 'bg-emerald-950/25 border-emerald-500/50 hover:border-emerald-400'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-500/40 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{isAr ? 'نعم • مطابق للمواصفة' : 'YES • Conforming'}</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-black">PASS ⬇️</span>
                </div>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {isAr ? passLabelAr : passLabelEn}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs font-bold text-emerald-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{isAr ? `ينتقل للمرحلة التالية (${passTargetStageNumber})` : `Advances to Stage ${passTargetStageNumber}`}</span>
                </div>
                <ArrowDown className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            {/* FAIL / NON-CONFORMANCE BRANCH (RED/ROSE WITH DIRECT LINKAGE TO STAGE 3) */}
            <div className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between group/fail shadow-lg ${
              isLotDivertedHere
                ? 'bg-rose-950/60 border-rose-400 ring-2 ring-rose-400/50 shadow-rose-900/40'
                : 'bg-rose-950/25 border-rose-500/60 hover:border-rose-400 shadow-rose-950/20'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 font-black text-xs border border-rose-500/40 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>{isAr ? 'لا • غير مطابق أو رُصد خلل' : 'NO • Non-Conformance'}</span>
                  </span>
                  <span className="text-[11px] font-mono text-rose-400 font-black">FAIL ➡️</span>
                </div>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {isAr ? failLabelAr : failLabelEn}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-rose-500/20">
                {targetNcr ? (
                  <button
                    onClick={() => scrollToStage('DEPT-STAGE-RESOLUTION', true)}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-950/40 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>{isAr ? '⚠️ تفرع فوري لـ المرحلة 3 (تقارير عدم المطابقة NCR)' : 'Branch to Stage 3 (NCR & 8D)'}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="text-xs text-rose-300 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span>{isAr ? 'حجز وتصعيد للجنة الجودة MRB' : 'Quarantine & Escalate to MRB'}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Outgoing Flow Pipe to Next Stage */}
        <div className="flex flex-col items-center mt-3">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-emerald-500 to-transparent" />
          <div className="text-emerald-400 text-xs font-bold -mt-2">▼</div>
        </div>
      </div>
    );
  };

  // Helper for Stage Section styling when lot tracking is active
  const getStageTrackingStyle = (stageNumber: number, defaultBorderColor: string) => {
    if (!trackedLot) {
      return {
        className: 'border-2 shadow-xl',
        badge: null,
        isCurrentStop: false
      };
    }

    const isCurrentStop = trackedLot.currentStageNumber === stageNumber;
    const isPassed = trackedLot.passedStageNumbers.includes(stageNumber);
    const isBlocked = trackedLot.blockedStageNumbers.includes(stageNumber);

    if (isCurrentStop) {
      return {
        className: 'border-2 border-rose-500 bg-rose-950/30 ring-4 ring-rose-500/60 shadow-2xl shadow-rose-950/80 animate-pulse',
        badge: (
          <span className="px-3 py-1 rounded-full bg-rose-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-rose-500/40">
            <MapPin className="w-4 h-4 fill-slate-950" />
            <span>{isAr ? `📍 اللوط متوقف هنا حالياً: ${trackedLot.statusLabelAr}` : `Current Stop: ${trackedLot.statusLabelEn}`}</span>
          </span>
        ),
        isCurrentStop: true
      };
    }

    if (isPassed) {
      return {
        className: 'border-2 border-emerald-500/80 bg-emerald-950/20 shadow-lg shadow-emerald-950/40',
        badge: (
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 text-xs font-black flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAr ? '✓ تم اجتياز المرحلة بنجاح' : 'Stage Cleared'}</span>
          </span>
        ),
        isCurrentStop: false
      };
    }

    if (isBlocked) {
      return {
        className: 'border-2 border-slate-800 bg-slate-950/40 opacity-40 border-dashed',
        badge: (
          <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-bold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>{isAr ? 'لم تصل إليها الخامة بعد' : 'Not Reached Yet'}</span>
          </span>
        ),
        isCurrentStop: false
      };
    }

    return {
      className: 'border-2 shadow-xl',
      badge: null,
      isCurrentStop: false
    };
  };

  return (
    <div className="flex-1 w-full bg-[#060a14] text-slate-100 flex flex-col font-sans select-none">
      {/* Dynamic Keyframe Animation Styles */}
      <style>{`
        @keyframes flowDash {
          from { stroke-dashoffset: 20; }
          to { stroke-dashoffset: 0; }
        }
        .flowchart-pipe-anim {
          animation: flowDash 1.2s linear infinite;
        }
        @keyframes pulseHighlight {
          0%, 100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
          50% { box-shadow: 0 0 35px 8px rgba(244, 63, 94, 0.7); border-color: rgba(244, 63, 94, 1); }
        }
        .stage-highlight-ncr {
          animation: pulseHighlight 1.5s ease-in-out 3;
        }
      `}</style>

      {/* 1. SIMPLE TOP STICKY BAR: SEARCH & SEQUENTIAL STAGE JUMPERS */}
      <div className="bg-[#080d1a] border-b border-white/10 p-3 md:px-6 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Fast Sequential Stage Quick-Jump Pills (1 to 7) */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 shrink-0 hidden lg:inline">
              {isAr ? 'المراحل الـ 7 بالتسلسل:' : '7 Stages (1 ➔ 7):'}
            </span>

            {ENTERPRISE_DEPARTMENTS.map((dept) => (
              <button
                key={dept.id}
                onClick={() => scrollToStage(dept.id, false)}
                style={{ borderColor: `${dept.accentHex}50` }}
                className="px-2.5 py-1 rounded-xl bg-black/40 hover:bg-white/10 text-xs font-bold text-slate-300 hover:text-white border shrink-0 transition-all flex items-center gap-1.5"
              >
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black text-slate-950" style={{ backgroundColor: dept.accentHex }}>
                  {dept.number}
                </span>
                <span>{isAr ? dept.shortNameAr : dept.shortNameEn}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث بالاسم أو الكود...' : 'Search any tab...'}
              className="w-full pr-9 pl-4 py-1.5 rounded-xl bg-black/60 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. ADVANCED LOT & RAW MATERIAL TRACEABILITY SELECTOR BAR */}
      <div className="bg-[#0b1224] border-b-2 border-cyan-500/30 p-4 md:px-8 shadow-2xl">
        <div className="max-w-6xl mx-auto space-y-3.5">
          {/* Header & Description */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40 shadow-inner">
                <Crosshair className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white tracking-wide">
                    {isAr ? 'تتبع مسار اللوط والخامات المفحوصة في الاستلام (IQC)' : 'Live Lot & Material Traceability Flow'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/40">
                    {allTrackableLots.length} {isAr ? 'خامة مسجلة' : 'Lots Available'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {isAr 
                    ? 'اختر أي خامة تم فحصها في فحص الاستلام (IQC) لترى مسارها اللحظي: هل عَبَرت للإنتاج أم توقفت ومحجوزة بـ NCR؟' 
                    : 'Select any material inspected in IQC to see whether it passed to production or halted in NCR'}
                </p>
              </div>
            </div>

            {/* Custom Lot Input */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-56">
                <input
                  type="text"
                  value={lotSearchInput}
                  onChange={(e) => setLotSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && lotSearchInput.trim()) {
                      setSelectedLotNumber(lotSearchInput.trim().toUpperCase());
                    }
                  }}
                  placeholder={isAr ? 'اكتب رقم لوط أو كود خامة...' : 'Enter lot or part code...'}
                  className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
              <button
                onClick={() => {
                  if (lotSearchInput.trim()) setSelectedLotNumber(lotSearchInput.trim().toUpperCase());
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs transition-all shrink-0"
              >
                {isAr ? 'تتبع' : 'Track'}
              </button>
              {selectedLotNumber && (
                <button
                  onClick={() => {
                    setSelectedLotNumber(null);
                    setLotSearchInput('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1 border border-slate-700"
                  title={isAr ? 'إلغاء التتبع والعودة للمسار الشامل' : 'Reset Traceability'}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إلغاء' : 'Reset'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Select Inspected Materials & Lots */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-bold flex items-center gap-1">
                <span>📥 {isAr ? 'الخامات والتشغيلات المفحوصة (اضغط لتتبع المسار فوراً):' : 'Inspected Lots (Click to trace):'}</span>
              </span>
              <button
                onClick={() => navigate('/compliance/hub/inspection')}
                className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
              >
                <span>{isAr ? 'فتح شاشة فحص الاستلام IQC ↗' : 'Open IQC Inspection ↗'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {allTrackableLots.map((lot) => {
                const isSelected = selectedLotNumber === lot.lotNumber;
                return (
                  <button
                    key={lot.lotNumber}
                    onClick={() => {
                      setSelectedLotNumber(lot.lotNumber);
                      if (lot.status === 'quarantined') {
                        scrollToStage('DEPT-STAGE-RESOLUTION', true);
                      } else if (lot.currentStageNumber === 2) {
                        scrollToStage('DEPT-STAGE-INPROCESS', true);
                      } else {
                        scrollToLotStopStage();
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-lg shadow-cyan-500/30 scale-105'
                        : 'bg-black/50 hover:bg-white/10 text-slate-200 border-white/10'
                    }`}
                  >
                    <span className="font-mono font-black">{lot.lotNumber}</span>
                    <span className="text-[10px] opacity-80">({isAr ? lot.materialNameAr.split(' ')[0] : lot.materialCode})</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                      lot.status === 'quarantined'
                        ? 'bg-rose-500 text-white'
                        : lot.status === 'completed'
                          ? 'bg-emerald-500 text-slate-950'
                          : lot.status === 'hold'
                            ? 'bg-indigo-500 text-white'
                            : 'bg-amber-500 text-slate-950'
                    }`}>
                      {lot.status === 'quarantined' ? '🛑 حجز NCR' : lot.status === 'completed' ? '🏁 مكتمل' : lot.status === 'hold' ? '⚠️ شكوى' : '🟢 صالة الإنتاج'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE TRACEABILITY HUD / JOURNEY CALLOUT BANNER */}
          {trackedLot && (
            <div className="mt-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0e172a] to-slate-900 border-2 border-cyan-400 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in duration-300">
              <div className="flex items-start gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 ${
                  trackedLot.status === 'quarantined' 
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500 shadow-lg shadow-rose-500/20 animate-pulse' 
                    : trackedLot.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500'
                }`}>
                  <MapPin className="w-6 h-6" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-black text-white font-mono tracking-wide">
                      {trackedLot.lotNumber}
                    </span>
                    <span className="text-xs font-bold text-cyan-300">
                      • {isAr ? trackedLot.materialNameAr : trackedLot.materialNameEn}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-300 text-[10px] font-mono">
                      {isAr ? trackedLot.categoryAr : trackedLot.categoryEn}
                    </span>
                    {trackedLot.isLiveInspection && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                        {isAr ? '🔴 فحص حي من IQC' : 'Live IQC'}
                      </span>
                    )}
                  </div>

                  {/* Narrative path */}
                  <div className="mt-1 text-xs text-slate-300 font-medium leading-relaxed">
                    <b className="text-amber-400 font-black">{isAr ? 'مسار الحركة على الفلو شارت:' : 'Journey:'}</b> {isAr ? trackedLot.flowNarrativeAr : trackedLot.flowNarrativeEn}
                  </div>

                  {/* Where it stopped */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1">
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                      <span>{isAr ? `الموقع الحالي: ${trackedLot.currentStageNameAr}` : `Stopped at: ${trackedLot.currentStageNameEn}`}</span>
                    </span>
                    <span className="text-slate-400 text-xs">
                      {isAr ? trackedLot.stopReasonAr : trackedLot.stopReasonEn}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
                <button
                  onClick={scrollToLotStopStage}
                  className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95"
                >
                  <MapPin className="w-4 h-4 fill-slate-950" />
                  <span>{isAr ? 'القفز لموقع التوقف 🎯' : 'Jump to Current Station'}</span>
                </button>

                {trackedLot.relatedRecordUrl && (
                  <button
                    onClick={() => navigate(trackedLot.relatedRecordUrl!)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-all"
                  >
                    <span>{trackedLot.relatedRecordCode}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. THE DEVELOPED FLOWCHART LAYOUT: SEQUENTIAL (1 ➔ 2 ➔ 3 ➔ 4 ➔ 5 ➔ 6 ➔ 7) */}
      <div className="max-w-6xl mx-auto w-full p-4 md:p-8 space-y-4 pb-20">
        
        {/* START TERMINAL */}
        <div className="flex flex-col items-center">
          <div className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 border-2 border-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span>{isAr ? '🚀 بداية المسار: استلام الخامات وتأهيل الموردين' : 'START: Incoming Materials & Supplier Verification'}</span>
          </div>
          {renderFlowPipe('#f59e0b', 'توريد خامات جديدة', 'New Raw Batch')}
        </div>

        {/* ==================================================================== */}
        {/* STAGE 1: INCOMING & SUPPLIER (IQC)                                   */}
        {/* ==================================================================== */}
        {(() => {
          const trackStyle = getStageTrackingStyle(1, 'border-amber-500/40');
          return (
            <section id="DEPT-STAGE-INCOMING" className={`p-5 sm:p-6 rounded-3xl bg-slate-900/70 border-amber-500/40 space-y-4 ${trackStyle.className}`}>
              <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-xl text-xs font-mono font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    STAGE 01
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white">
                      {isAr ? 'المرحلة 1: استلام الخامات والموردين (IQC)' : 'Stage 1: Incoming & Supplier Quality (IQC)'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isAr ? 'تقييم الموردين، خطط فحص الخامات، وتفتيش الشحنات الواردة قبل الإفراج للإنتاج' : 'Supplier scorecards, incoming receiving inspections & COA analysis'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {trackStyle.badge}
                  <span className="text-xs text-amber-400 font-mono font-bold bg-amber-950 px-3 py-1 rounded-full border border-amber-500/30 shrink-0">
                    3 Tabs
                  </span>
                </div>
              </div>

              {/* 1: Standard 3 Station Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(stationsByDept.get('DEPT-STAGE-INCOMING') || []).map(st => renderCard(st, '#f59e0b', 1))}
              </div>

              {/* 2: LIVE INCOMING INSPECTION QUEUE & TESTED MATERIALS (HERE IS WHERE INSPECTED MATERIALS SHOW UP!) */}
              <div className="mt-5 pt-4 border-t border-amber-500/30">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <h4 className="text-xs sm:text-sm font-black text-white">
                      {isAr ? '📥 سجل الخامات المفحوصة في فحص الاستلام IQC (نتائج التفتيش المباشرة):' : 'Live Inspected Raw Materials Log (IQC):'}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/40">
                      {realIncomingInspections.length} {isAr ? 'خامات مفحوصة' : 'Lots'}
                    </span>
                  </div>

                  <button
                    onClick={() => navigate('/compliance/hub/inspection')}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
                  >
                    <span>{isAr ? '➕ فحص خامة جديدة في فحص الاستلام IQC' : '➕ Inspect New Material (IQC)'}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-950" />
                  </button>
                </div>

                {/* Grid of Inspected Raw Materials with Direct Flow Tracing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {realIncomingInspections.map((ins, idx) => {
                    const isPass = (ins.result || '').toLowerCase() === 'pass' || (ins.status || '').toLowerCase() === 'pass';
                    const lotNo = ins.batchNumber || ins.batch || ins.lot || ins.inspectionNumber || ins.id;
                    const isCurrentSelected = selectedLotNumber === lotNo;

                    return (
                      <div 
                        key={ins.id || idx}
                        onClick={() => {
                          setSelectedLotNumber(lotNo);
                          if (isPass) {
                            scrollToStage('DEPT-STAGE-INPROCESS', true);
                          } else {
                            scrollToStage('DEPT-STAGE-RESOLUTION', true);
                          }
                        }}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group/iqc shadow-sm hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] ${
                          isCurrentSelected
                            ? 'bg-cyan-950/70 border-cyan-400 ring-2 ring-cyan-400/50 shadow-cyan-950/50'
                            : isPass
                              ? 'bg-slate-900/90 border-emerald-500/40 hover:border-emerald-400 hover:bg-slate-800'
                              : 'bg-slate-900/90 border-rose-500/50 hover:border-rose-400 hover:bg-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="font-mono font-black text-xs text-white group-hover/iqc:text-cyan-300 transition-colors">
                              {lotNo}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 ${
                              isPass 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}>
                              <span>{isPass ? '✓' : '✕'}</span>
                              <span>{isPass ? (isAr ? 'مطابق • ذهب للإنتاج' : 'PASS ➔ IPQC') : (isAr ? 'مرفوض • حجز بـ NCR' : 'FAIL ➔ NCR')}</span>
                            </span>
                          </div>

                          <h5 className="text-xs font-bold text-slate-100 line-clamp-1 mb-1">
                            {ins.productName || ins.product || 'خامة صناعية'}
                          </h5>
                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            {ins.supplierName || 'مورد معتمد'} • {ins.inspectionDate || ins.date || ''}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-mono">
                            {ins.defectCount || 0} عيب / {ins.sampleSize || 0} عينة
                          </span>
                          <span className="text-cyan-400 font-black flex items-center gap-1 group-hover/iqc:underline">
                            <span>{isAr ? 'تتبع مسارها 🎯' : 'Trace Flow'}</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })()}

        {/* DECISION GATE 1 (IQC) */}
        {renderDecisionDiamond({
          gateNumber: 1,
          questionAr: 'هل المواد الخام والشحنات الواردة مطابقة للمواصفات وخطط الفحص؟',
          questionEn: 'Are incoming raw materials compliant with quality specs & receiving plans?',
          passLabelAr: 'مطابق: يتم ختم الشحنة وتصريح الإفراج لدخول صالة الإنتاج والتصنيع ⬇️',
          passLabelEn: 'Conforming: Lot cleared & released for shopfloor production entry',
          passTargetStageNumber: 2,
          failLabelAr: 'غير مطابق: عزل الشحنة فوراً في منطقة الحجر وفتح تقرير عدم مطابقة لمطالبة المورد ➡️',
          failLabelEn: 'Non-Conforming: Instant quarantine and automatic escalation to Stage 3 NCR',
          accentColor: '#f59e0b',
          targetNcr: true
        })}

        {/* ==================================================================== */}
        {/* STAGE 2: IN-PROCESS QUALITY (IPQC)                                   */}
        {/* ==================================================================== */}
        {(() => {
          const trackStyle = getStageTrackingStyle(2, 'border-cyan-500/40');
          return (
            <section id="DEPT-STAGE-INPROCESS" className={`p-5 sm:p-6 rounded-3xl bg-slate-900/70 border-cyan-500/40 space-y-4 ${trackStyle.className}`}>
              <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-xl text-xs font-mono font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                    STAGE 02
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white">
                      {isAr ? 'المرحلة 2: جودة التصنيع والعمليات (IPQC)' : 'Stage 2: In-Process Quality & SPC (IPQC)'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isAr ? 'تسجيل صالة الإنتاج، قائمة العيوب اليومية، كارتات التحكم الإحصائي SPC، ومتابعة محطات الفحص' : 'Shopfloor fast entry, daily defect logs, SPC control charts & clearance gates'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {trackStyle.badge}
                  <span className="text-xs text-cyan-400 font-mono font-bold bg-cyan-950 px-3 py-1 rounded-full border border-cyan-500/30 shrink-0">
                    4 Tabs
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(stationsByDept.get('DEPT-STAGE-INPROCESS') || []).map(st => renderCard(st, '#06b6d4', 2))}
              </div>
            </section>
          );
        })()}

        {/* DECISION GATE 2 (IPQC) */}
        {renderDecisionDiamond({
          gateNumber: 2,
          questionAr: 'هل عينات التشغيل والقياسات ضمن حدود الضبط SPC وخالية من العيوب الحرجة؟',
          questionEn: 'Are in-process samples within SPC control limits & free of critical defects?',
          passLabelAr: 'مطابق ومستقر: استمرار خط الإنتاج وإجازة اللوت للمرحلة التالية ⬇️',
          passLabelEn: 'Conforming: Production line in statistical control, cleared for next step',
          passTargetStageNumber: 3,
          failLabelAr: 'خلل أو أندون: إيقاف فوري للماكينة، حجز الإنتاج، واستدعاء فريق حل المشكلات لفتح NCR و 8D ➡️',
          failLabelEn: 'Out of Control / Andon Alert: Immediate line hold, containment & NCR escalation',
          accentColor: '#06b6d4',
          targetNcr: true
        })}

        {/* ==================================================================== */}
        {/* STAGE 3: PROBLEM SOLVING & NCR / 8D / CAPA                           */}
        {/* ==================================================================== */}
        {(() => {
          const trackStyle = getStageTrackingStyle(3, 'border-rose-500/60');
          return (
            <section 
              id="DEPT-STAGE-RESOLUTION" 
              className={`p-5 sm:p-6 rounded-3xl bg-slate-900/80 border-rose-500/60 space-y-4 transition-all ${trackStyle.className} ${
                highlightedStageId === 'DEPT-STAGE-RESOLUTION' ? 'stage-highlight-ncr ring-4 ring-rose-500' : ''
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-rose-500/20">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-xl text-xs font-mono font-black bg-rose-500/20 text-rose-400 border border-rose-500/40">
                    STAGE 03
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-rose-400">
                        {isAr ? 'المرحلة 3: عدم المطابقة وحل المشكلات (NCR / 8D / CAPA)' : 'Stage 3: Problem Solving, NCR & Corrective Actions'}
                      </h3>
                      {trackStyle.isCurrentStop && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-slate-950 font-black text-[10px] animate-bounce">
                          {isAr ? '⚡ الخامة متوقفة ومحجوزة هنا' : 'Lot Quarantined Here'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300">
                      {isAr 
                        ? 'مركز احتواء العيوب: تقارير NCR، الإجراءات التصحيحية CAPA، مشاريع 8D، تصاريح الحيود، وضبط التغيير الهندسي' 
                        : 'NCR reports, CAPA actions, 8D root-cause investigations, concessions & engineering change control'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {trackStyle.badge}
                  <span className="text-xs text-rose-300 font-mono font-bold bg-rose-950 px-3 py-1 rounded-full border border-rose-500/40 shrink-0">
                    5 Tabs
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {(stationsByDept.get('DEPT-STAGE-RESOLUTION') || []).map(st => renderCard(st, '#f43f5e', 3))}
              </div>
            </section>
          );
        })()}

        {/* DECISION GATE 3 (NCR & CAPA RESOLUTION) */}
        {renderDecisionDiamond({
          gateNumber: 3,
          questionAr: 'هل تم حصر الخلل، إغلاق السبب الجذري 8D، وتأكيد فعالية الإجراء التصحيحي CAPA؟',
          questionEn: 'Has the root cause been contained, 8D verified & CAPA corrective action closed?',
          passLabelAr: 'تم الحل والاعتماد: فك الحجر الصحي وتصريح الدفعة للإفراج للشحن والفحص النهائي ⬇️',
          passLabelEn: 'Resolved & Verified: Quarantine lifted, lot released to Final OQC',
          passTargetStageNumber: 4,
          failLabelAr: 'قيد التحقيق: استمرار العزل في منطقة الحجر والرفع للجنة مراجعة المواد (MRB) ➡️',
          failLabelEn: 'Under Investigation: Maintain containment and escalate to MRB Committee',
          accentColor: '#f43f5e',
          targetNcr: false
        })}

        {/* ==================================================================== */}
        {/* STAGE 4: OUTGOING QUALITY (OQC)                                       */}
        {/* ==================================================================== */}
        {(() => {
          const trackStyle = getStageTrackingStyle(4, 'border-emerald-500/40');
          return (
            <section id="DEPT-STAGE-OUTGOING" className={`p-5 sm:p-6 rounded-3xl bg-slate-900/70 border-emerald-500/40 space-y-4 ${trackStyle.className}`}>
              <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-xl text-xs font-mono font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    STAGE 04
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white">
                      {isAr ? 'المرحلة 4: فحص وخروج المنتج النهائي (OQC)' : 'Stage 4: Outgoing Quality & Release (OQC)'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isAr ? 'فحص عينات القبول AQL للشحنات التامة الصنع قبل التحميل وإصدار شهادات المطابقة COC' : 'Pre-shipment AQL sampling, COC certificates & final release authorization'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {trackStyle.badge}
                  <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-950 px-3 py-1 rounded-full border border-emerald-500/30 shrink-0">
                    1 Tab
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(stationsByDept.get('DEPT-STAGE-OUTGOING') || []).map(st => renderCard(st, '#10b981', 4))}
              </div>
            </section>
          );
        })()}

        {/* DECISION GATE 4 (OQC) */}
        {renderDecisionDiamond({
          gateNumber: 4,
          questionAr: 'هل شحنة المنتج التام مطابقة لمعايير قبول عينات AQL؟',
          questionEn: 'Are finished goods lots fully compliant with AQL acceptance criteria?',
          passLabelAr: 'مطابق ومجاز: إصدار شهادة المطابقة COC والترخيص بالشحن والتسليم للعميل ⬇️',
          passLabelEn: 'Compliant: Issue COC Certificate and authorize shipment to Customer',
          passTargetStageNumber: 5,
          failLabelAr: 'مرفوض: حجز الشحنة ومنع خروجها وإحالتها فوراً إلى المرحلة 3 لإعادة الفرز أو NCR ➡️',
          failLabelEn: 'Rejected: Immediate dock lock, quarantine & escalation to Stage 3 NCR',
          accentColor: '#10b981',
          targetNcr: true
        })}

        {/* ==================================================================== */}
        {/* STAGE 5: CUSTOMER COMPLAINTS                                          */}
        {/* ==================================================================== */}
        {(() => {
          const trackStyle = getStageTrackingStyle(5, 'border-indigo-500/40');
          return (
            <section id="DEPT-STAGE-CUSTOMER" className={`p-5 sm:p-6 rounded-3xl bg-slate-900/70 border-indigo-500/40 space-y-4 ${trackStyle.className}`}>
              <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-xl text-xs font-mono font-black bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                    STAGE 05
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white">
                      {isAr ? 'المرحلة 5: شكاوى العملاء والميدان (Customer Quality)' : 'Stage 5: Customer Complaints & Field QA'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isAr ? 'استقبال بلاغات العملاء ومطالبات الضمان ومرتجعات RMA وتحويل الملاحظات للهندسة' : 'Customer claims, warranty returns RMA & field feedback loops'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {trackStyle.badge}
                  <span className="text-xs text-indigo-400 font-mono font-bold bg-indigo-950 px-3 py-1 rounded-full border border-indigo-500/30 shrink-0">
                    1 Tab
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(stationsByDept.get('DEPT-STAGE-CUSTOMER') || []).map(st => renderCard(st, '#6366f1', 5))}
              </div>
            </section>
          );
        })()}

        {/* DECISION GATE 5 (CUSTOMER RMA) */}
        {renderDecisionDiamond({
          gateNumber: 5,
          questionAr: 'هل تم حل شكوى العميل، تسوية المرتجع RMA، واستخلاص السبب الفني؟',
          questionEn: 'Has customer claim been settled, RMA processed & technical feedback extracted?',
          passLabelAr: 'نعم: إغلاق الشكوى وتمرير الملاحظات للمختبر الهندسي والتدقيق لتحديث FMEA ⬇️',
          passLabelEn: 'Yes: Claim closed and feedback transferred to Lab & Audits to update FMEA',
          passTargetStageNumber: 6,
          failLabelAr: 'شكوى حرجة مفتوحة: تصعيد فوري لتشكيل فريق 8D طارئ بالمرحلة 3 ➡️',
          failLabelEn: 'Open Critical Claim: Trigger emergency 8D project in Stage 3',
          accentColor: '#6366f1',
          targetNcr: true
        })}

        {/* ==================================================================== */}
        {/* STAGE 6: ENGINEERING LAB & AUDITS                                     */}
        {/* ==================================================================== */}
        {(() => {
          const trackStyle = getStageTrackingStyle(6, 'border-purple-500/40');
          return (
            <section id="DEPT-STAGE-COMPLIANCE" className={`p-5 sm:p-6 rounded-3xl bg-slate-900/70 border-purple-500/40 space-y-4 ${trackStyle.className}`}>
              <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-xl text-xs font-mono font-black bg-purple-500/20 text-purple-400 border border-purple-500/40">
                    STAGE 06
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white">
                      {isAr ? 'المرحلة 6: المختبر الهندسي والتدقيق (Lab & Audits)' : 'Stage 6: Engineering Lab & Audits'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isAr ? 'خطط التحكم Control Plan، تحليل المخاطر FMEA، معايرة الأجهزة MSA، مراجعات LPA، والتدقيق الداخلي' : 'Control Plans, FMEA risk analysis, gage calibration MSA, LPA audits & ISO audits'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {trackStyle.badge}
                  <span className="text-xs text-purple-400 font-mono font-bold bg-purple-950 px-3 py-1 rounded-full border border-purple-500/30 shrink-0">
                    5 Tabs
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {(stationsByDept.get('DEPT-STAGE-COMPLIANCE') || []).map(st => renderCard(st, '#a855f7', 6))}
              </div>
            </section>
          );
        })()}

        {renderFlowPipe('#3b82f6', 'تحديث وثائق النظام والبيانات', 'Update Master Data')}

        {/* ==================================================================== */}
        {/* STAGE 7: FACTORY SETUP & MASTER DATA                                 */}
        {/* ==================================================================== */}
        {(() => {
          const trackStyle = getStageTrackingStyle(7, 'border-blue-500/40');
          return (
            <section id="DEPT-STAGE-SETUP" className={`p-5 sm:p-6 rounded-3xl bg-slate-900/70 border-blue-500/40 space-y-4 ${trackStyle.className}`}>
              <div className="flex items-center justify-between pb-3 border-b border-blue-500/20">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-xl text-xs font-mono font-black bg-blue-500/20 text-blue-400 border border-blue-500/40">
                    STAGE 07
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white">
                      {isAr ? 'المرحلة 7: تهيئة المصنع والبيانات (Setup & Master Data)' : 'Stage 7: Factory Setup & Master Data'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isAr ? 'البيانات الرئيسية للأجزاء والموديلات، مصمم نماذج الفحص، وقاعدة الدروس المستفادة' : 'Parts & models catalog, dynamic form designer & lessons learned repository'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {trackStyle.badge}
                  <span className="text-xs text-blue-400 font-mono font-bold bg-blue-950 px-3 py-1 rounded-full border border-blue-500/30 shrink-0">
                    3 Tabs
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(stationsByDept.get('DEPT-STAGE-SETUP') || []).map(st => renderCard(st, '#3b82f6', 7))}
              </div>
            </section>
          );
        })()}

        {/* CLOSED-LOOP CONTINUOUS IMPROVEMENT FEEDBACK LOOP */}
        <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-purple-950/40 via-blue-950/40 to-emerald-950/40 border-2 border-cyan-500/50 flex flex-col md:flex-row items-center justify-between gap-4 text-xs shadow-2xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40 shrink-0 shadow-lg shadow-cyan-500/20">
              <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/30">
                  {isAr ? 'دورة الجودة الشاملة المغلقة' : 'Total Quality Closed Loop'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold">
                  Stage 7 ➔ Stage 1
                </span>
              </div>
              <h5 className="font-black text-white text-sm sm:text-base mt-1">
                {isAr ? 'تغذية عكسية مستمرة وتحديث تلقائي لجميع المراحل' : 'Continuous Closed-Loop Feedback & Standard Evolution'}
              </h5>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {isAr 
                  ? 'الدروس المستفادة والبيانات وقوالب الفحص من المرحلة 7 تُعيد تلقائياً ضبط خطط فحص المواد الخام في المرحلة 1 ومعايير خطوط الإنتاج لمنع تكرار أي خلل نهائياً.' 
                  : 'Master data, lessons learned and form templates continuously refine Stage 1 receiving criteria and production plans.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => scrollToStage('DEPT-STAGE-INCOMING', true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 shrink-0"
          >
            <span>{isAr ? 'العودة لبداية المسار (المرحلة 1) ▲' : 'Back to Stage 1 (Top) ▲'}</span>
          </button>
        </div>

        {/* SUCCESS TERMINAL */}
        <div className="flex flex-col items-center pt-2">
          <div className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/20 border-2 border-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>{isAr ? '🏁 نهاية الدورة: مطابقة تامة 100% وتحسين مستمر' : 'END: 100% Conformance & Continuous Excellence'}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ModernQualityFlowchart;
