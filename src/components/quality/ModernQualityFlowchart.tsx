// @ts-nocheck
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Smartphone, Activity, ShieldAlert, Workflow, PackageCheck,
  ShieldCheck, Database, ArrowDown, RefreshCw, CheckCircle2,
  ArrowUpRight, Search, AlertTriangle, Layers, ChevronDown, CheckSquare,
  Sparkles, FileText, Barcode, Brain, Blocks, Library, Users, GitFork,
  HelpCircle, ChevronRight, CornerDownRight, Crosshair, MapPin, X,
  Shield, Check, ExternalLink, Lock, AlertOctagon, RotateCcw, PlusCircle,
  LayoutGrid, ListFilter, Play, Pause, FastForward, Printer, Download, Box, Sliders
} from 'lucide-react';
import { 
  ENTERPRISE_DEPARTMENTS, 
  getDepartmentForStation 
} from '../../services/enterpriseDepartmentsEngine';
import { unifiedInspectionApi } from '../../api/unified-api';
import { isDemoRecord } from '../../services/cleanDemoData';
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

// Real Tracked Lots are dynamically generated from user inspections
export const TRACKED_LOTS_DATABASE: TrackedLotJourney[] = [];

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
  
  // Card Display Aesthetic Mode ('clean' 3-column stats vs 'compact' minimalist pills)
  const [cardDisplayMode, setCardDisplayMode] = useState<'clean' | 'compact'>('clean');

  // Flowchart Architecture Layout Mode ('dual' = Two Parallel Swimlanes vs 'linear' = Single Column)
  const [flowchartLayoutMode, setFlowchartLayoutMode] = useState<'dual' | 'linear'>('dual');
  const [flowchartViewMode, setFlowchartViewMode] = useState<'diagram' | 'expanded'>('diagram');
  const [activeStageDrawer, setActiveStageDrawer] = useState<{
    stageNumber: number;
    stageId: string;
  } | null>(null);

  // =========================================================================
  // LIVE MATERIAL FLOW SIMULATION & OFFICIAL PFD EXPORT STATES
  // =========================================================================
  const [simulationActive, setSimulationActive] = useState<boolean>(false);
  const [simulationPaused, setSimulationPaused] = useState<boolean>(false);
  const [simulationType, setSimulationType] = useState<'pass' | 'fail'>('pass');
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [simulationSpeed, setSimulationSpeed] = useState<1 | 2>(1); // 1 = normal (2.8s), 2 = fast (1.4s)
  const [isPfdExportOpen, setIsPfdExportOpen] = useState<boolean>(false);

  // Drill-Down Modal State for Station Records (Pass / Fail / Total) & Full Lot Traceability
  const [stationDrilldown, setStationDrilldown] = useState<{
    isOpen: boolean;
    station: ScadaEquipment | null;
    stageNumber: number;
    filter: 'all' | 'pass' | 'fail';
  }>({
    isOpen: false,
    station: null,
    stageNumber: 1,
    filter: 'all'
  });
  const [drilldownSearch, setDrilldownSearch] = useState('');

  const handleOpenDrilldown = useCallback((station: ScadaEquipment, stageNumber: number, filter: 'all' | 'pass' | 'fail') => {
    setStationDrilldown({
      isOpen: true,
      station,
      stageNumber,
      filter
    });
    setDrilldownSearch('');
  }, []);

  // Stage 1 Live Lot Tray Controls (Search, Conformance Filter, ViewMode & Collapsible)
  const [lotTraySearch, setLotTraySearch] = useState('');
  const [lotTrayFilter, setLotTrayFilter] = useState<'all' | 'pass' | 'fail'>('all');
  const [lotTrayViewMode, setLotTrayViewMode] = useState<'cards' | 'table'>('cards');
  const [isLotTrayCollapsed, setIsLotTrayCollapsed] = useState(false);

  // Helper: Strictly filter out any legacy dummy/mock inspections
  const filterRealOnly = (items: any[]) => {
    if (!Array.isArray(items)) return [];
    return items.filter(item => {
      if (isDemoRecord(item)) return false;
      const t = (item.type || '').toLowerCase();
      return t === 'incoming' || t === 'iqc' || !item.type;
    });
  };

  // Helper: Read real stored array from localStorage keys with ZERO fallbacks
  const getStoredArray = useCallback((keys: string[]): any[] => {
    for (const k of keys) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const clean = parsed.filter(item => !isDemoRecord(item));
            if (clean.length > 0) return clean;
          }
        }
      } catch {}
    }
    return [];
  }, []);

  // --------------------------------------------------------------------------
  // DYNAMIC INCOMING INSPECTIONS LOADER (Loads 100% REAL data from server & storage)
  // --------------------------------------------------------------------------
  const [realIncomingInspections, setRealIncomingInspections] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('qms_local_inspections') || localStorage.getItem('qms_local_inspection') || '[]';
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return filterRealOnly(parsed);
      }
    } catch {}
    return [];
  });

  // Listen for storage changes across browser tabs, and fetch live from server PHP API
  useEffect(() => {
    const handleStorage = () => {
      try {
        const raw = localStorage.getItem('qms_local_inspections') || localStorage.getItem('qms_local_inspection') || '[]';
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleaned = filterRealOnly(parsed);
          setRealIncomingInspections(cleaned);
        }
      } catch {}
    };

    window.addEventListener('storage', handleStorage);

    // Live fetch from server PHP API (so inspections entered from any device load immediately)
    const fetchServerInspections = async () => {
      try {
        const res = await unifiedInspectionApi.getAll();
        if (res && Array.isArray(res.data)) {
          const cleaned = filterRealOnly(res.data);
          setRealIncomingInspections(cleaned);
          try {
            localStorage.setItem('qms_local_inspections', JSON.stringify(cleaned));
          } catch {}
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

    // Real Inspections ONLY (Zero Mock Lots)
    mappedFromInspections.forEach(item => {
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

  // =========================================================================
  // SIMULATION SCENARIO STEPS CONFIGURATION & AUTOMATION HOOKS
  // =========================================================================
  const simulationSteps = useMemo(() => {
    if (simulationType === 'pass') {
      return [
        {
          stepIndex: 0,
          id: 'start',
          targetDomId: 'start-terminal',
          badgeLabelAr: '📦 وصول شحنة جديدة',
          badgeLabelEn: 'Incoming Lot Arrival',
          titleAr: 'بداية التدفق: وصول خامات معتمدة إلى رصيف الاستلام',
          titleEn: 'START: Approved Material Arrival at Receiving Dock',
          narrativeAr: 'وصلت شحنة جديدة برقم كود LOT-2026-PASS-01 قادمة من المورد المعتمد. جاري تفريغ الحاويات وتسجيل رقم التتبع وفحص مستندات الشحن وشهادة التحليل COA.',
          narrativeEn: 'Lot LOT-2026-PASS-01 arrived from approved supplier. Unloading and COA document verification initiated.',
          actionRequiredAr: 'تسجيل الدخول في محطة استلام الخامات وتعيين خطة الفحص الفني.',
          actionRequiredEn: 'Register arrival and assign IQC inspection plan.',
          statusType: 'info'
        },
        {
          stepIndex: 1,
          id: 'stage1',
          stageNumber: 1,
          targetDomId: 'DEPT-STAGE-INCOMING',
          badgeLabelAr: '🔬 فحص الاستلام IQC',
          badgeLabelEn: 'IQC Receiving Inspection',
          titleAr: 'المرحلة 1: إجراء فحص الاستلام المخبري والفني (IQC)',
          titleEn: 'Stage 1: Incoming Quality Control Inspection (IQC)',
          narrativeAr: 'قام مهندس الجودة بسحب 50 عينة عشوائية حسب خطة AQL 1.0 واختبار الصلادة والأبعاد والشوائب في محطة IQC-01. جميع العينات مطابقة للمعايير بنسبة 100%.',
          narrativeEn: 'QA engineer sampled 50 units per AQL 1.0. Hardness, dimensions and purity tests conform 100%.',
          actionRequiredAr: 'اعتماد نتائج الفحص وتوقيع محضر الاستلام الإلكتروني.',
          actionRequiredEn: 'Approve inspection results and e-sign receiving report.',
          statusType: 'pass'
        },
        {
          stepIndex: 2,
          id: 'gate1',
          gateNumber: 1,
          targetDomId: 'GATEWAY-1',
          badgeLabelAr: '✓ إجازة التوريد (PASS)',
          badgeLabelEn: 'Gate 1 Cleared (PASS)',
          titleAr: 'بوابة القرار 1: تقييم مطابقة الشحنة والاعتماد',
          titleEn: 'Decision Gateway 1: Raw Material Specification Acceptance',
          narrativeAr: 'تم تقييم نتائج الفحص عبر بوابة القرار رقم 1 ➔ النتيجة: مطابق بنجاح (PASS) ✓. النظام يفتح إذن الصرف ويوجه الشحنة مباشرة لصالة الإنتاج.',
          narrativeEn: 'Gate 1 evaluation ➔ PASS ✓. Material clearance issued directly to production floor.',
          actionRequiredAr: 'توجيه الشحنة إلى مستودع التجهيز وبدء تغذية خطوط التجميع.',
          actionRequiredEn: 'Dispatch material to staging buffer and load assembly line.',
          statusType: 'pass'
        },
        {
          stepIndex: 3,
          id: 'stage2',
          stageNumber: 2,
          targetDomId: 'DEPT-STAGE-INPROCESS',
          badgeLabelAr: '⚙️ إنتاج وضبط SPC',
          badgeLabelEn: 'In-Process & SPC',
          titleAr: 'المرحلة 2: بدء التشغيل والمراقبة الإحصائية للعمليات (IPQC)',
          titleEn: 'Stage 2: In-Process Manufacturing & SPC Control (IPQC)',
          narrativeAr: 'بدأت ماكينات التشغيل في تصنيع الأجزاء. محطة SPC-01 تسجل قياسات كل ساعة على كارت X-bar / R، ومؤشر المقدرة Cpk = 1.67 (عملية فائقة الاستقرار).',
          narrativeEn: 'Production line active. Hourly measurements plotted on SPC X-bar/R chart. Process capability Cpk = 1.67 (highly capable).',
          actionRequiredAr: 'الحفاظ على ثبات سرعة التغذية ومعايرة أدوات القياس الدورية.',
          actionRequiredEn: 'Maintain feed rate and monitor periodic gauge calibrations.',
          statusType: 'pass'
        },
        {
          stepIndex: 4,
          id: 'gate2',
          gateNumber: 2,
          targetDomId: 'GATEWAY-2',
          badgeLabelAr: '✓ خلوص التشغيل (PASS)',
          badgeLabelEn: 'Gate 2 Cleared (PASS)',
          titleAr: 'بوابة القرار 2: التحقق من خلو العمليات من العيوب الحرجة',
          titleEn: 'Decision Gateway 2: In-Process Quality Clearance Gate',
          narrativeAr: 'فحص بوابات الخلوص والتحقق من عدم وجود أي عيوب حرجة أو انحرافات أثناء التجميع ➔ مطابقة كاملة (PASS) ✓. الإذن بالانتقال للفحص النهائي.',
          narrativeEn: 'Clearance verification passed with 0 critical defects ➔ PASS ✓. Clearance granted to final inspection.',
          actionRequiredAr: 'تغليف وتجميع الدفعة ونقلها إلى منطقة الفحص النهائي OQC.',
          actionRequiredEn: 'Lot packing and transport to OQC inspection area.',
          statusType: 'pass'
        },
        {
          stepIndex: 5,
          id: 'stage4',
          stageNumber: 4,
          targetDomId: 'DEPT-STAGE-OUTGOING',
          badgeLabelAr: '📦 فحص نهائي OQC',
          badgeLabelEn: 'OQC Final Audit',
          titleAr: 'المرحلة 4: الفحص النهائي وإصدار شهادة المطابقة (OQC)',
          titleEn: 'Stage 4: Outgoing Final Quality Audit & COC Generation',
          narrativeAr: 'مفتش الجودة النهائي يفحص الدفعة التامة الصنع في OQC-01 وفق خطة AQL 0.65. فحص التغليف والملصقات والأداء الوظيفي واكتمال الفحص بنجاح 100%.',
          narrativeEn: 'Final QA auditor verified packed finished goods per AQL 0.65. Packaging, barcode labels and functional tests 100% conforming.',
          actionRequiredAr: 'إصدار شهادة المطابقة الرسمية (Certificate of Conformance) وربطها باللوط.',
          actionRequiredEn: 'Generate official COC certificate and attach to shipment lot.',
          statusType: 'pass'
        },
        {
          stepIndex: 6,
          id: 'gate4',
          gateNumber: 4,
          targetDomId: 'GATEWAY-4',
          badgeLabelAr: '✓ إذن الإفراج النهائي (PASS)',
          badgeLabelEn: 'Gate 4 Cleared (PASS)',
          titleAr: 'بوابة القرار 4: إذن الإفراج والتسليم النهائي للعميل',
          titleEn: 'Decision Gateway 4: Final Product Dispatch & Release Gate',
          narrativeAr: 'بوابة القرار 4 تصدر إذن الإفراج النهائي ➔ مطابق 100% (PASS) ✓. تم اعتماد جميع وثائق الجودة وفتح إذن الشحن والتحميل على أسطول التوزيع.',
          narrativeEn: 'Gate 4 issues final release authorization ➔ 100% PASS ✓. Quality documents validated and logistics loading approved.',
          actionRequiredAr: 'تحميل الشحنة على شاحنة التوزيع والتنسيق مع إدارة المبيعات.',
          actionRequiredEn: 'Dispatch loading onto transport fleet and notify customer.',
          statusType: 'pass'
        },
        {
          stepIndex: 7,
          id: 'end',
          targetDomId: 'end-terminal',
          badgeLabelAr: '🏆 تسليم ناجح 100%',
          badgeLabelEn: '100% Release Complete',
          titleAr: 'نهاية الدورة: تسليم الشحنة للعميل بنجاح وتميز تام',
          titleEn: 'END: Customer Delivery & 100% Quality Conformance Achieved',
          narrativeAr: 'اكتملت دورة التدفق للشحنة بنجاح استثنائي! الشحنة وصلت للعميل دون أي عيوب، مع تحقيق صفر شكاوى وإثراء سجل الجودة بالبيانات الموثقة.',
          narrativeEn: 'Pipeline journey completed with zero defects! Conforming lot safely delivered to customer with flawless quality audit trail.',
          actionRequiredAr: 'تحديث مؤشرات أداء الجودة وسجل رضاء العملاء.',
          actionRequiredEn: 'Update quality KPI scorecard and customer satisfaction log.',
          statusType: 'success'
        }
      ];
    } else {
      return [
        {
          stepIndex: 0,
          id: 'start',
          targetDomId: 'start-terminal',
          badgeLabelAr: '📦 وصول شحنة خامات',
          badgeLabelEn: 'Incoming Lot Arrival',
          titleAr: 'وصول دفعة خامات تحت الرمز LOT-2026-DEFECT-8D',
          titleEn: 'START: Raw Material Batch LOT-2026-DEFECT-8D Arrived',
          narrativeAr: 'وصلت شحنة جديدة من المورد إلى رصيف الاستلام المبدئي. الشحنة تتضمن 500 قطعة من سبائك الألومنيوم بانتظار فحص الاستلام IQC.',
          narrativeEn: 'Incoming batch arrived at receiving dock consisting of 500 precision alloy units awaiting IQC.',
          actionRequiredAr: 'تسليم العينات لمختبر فحص المواد وسحب العينات الممثلة.',
          actionRequiredEn: 'Deliver test specimens to receiving QA lab.',
          statusType: 'info'
        },
        {
          stepIndex: 1,
          id: 'stage1',
          stageNumber: 1,
          targetDomId: 'DEPT-STAGE-INCOMING',
          badgeLabelAr: '⚠️ اكتشاف عيوب بالخامة',
          badgeLabelEn: 'Defect Detected in IQC',
          titleAr: 'المرحلة 1: اكتشاف انحراف حرج أثناء فحص الاستلام (IQC)',
          titleEn: 'Stage 1: Critical Non-Conformance Detected in IQC Inspection',
          narrativeAr: 'أثناء فحص العينات في محطة IQC-01، كشفت أجهزة القياس أن 18 قطعة تعاني من انحراف في الصلادة ووجود تشققات ميكرونية تتجاوز حدود القبول!',
          narrativeEn: 'Lab inspection at IQC-01 revealed 18 parts with severe hardness variations and micro-cracks exceeding tolerance!',
          actionRequiredAr: 'إيقاف قبول الشحنة فوراً وإبلاغ مسؤول الجودة لتفعيل الحظر.',
          actionRequiredEn: 'Halt lot acceptance immediately and initiate containment trigger.',
          statusType: 'fail'
        },
        {
          stepIndex: 2,
          id: 'gate1',
          gateNumber: 1,
          targetDomId: 'GATEWAY-1',
          badgeLabelAr: '🛑 إنذار رفض وتفرع (FAIL)',
          badgeLabelEn: 'Rejection Triggered (FAIL)',
          titleAr: 'بوابة القرار 1: إطلاق إنذار عدم المطابقة والحظر الفوري',
          titleEn: 'Decision Gateway 1: Rejection Alarm & Automated Lockout',
          narrativeAr: 'بوابة القرار 1 تطلق صفارة الإنذار: غير مطابق (FAIL 🛑)! النظام يغلق مسار الإنتاج آلياً ويمنع مرور الشحنة، مع فتح تفرع الطوارئ الأفقي ➡️ نحو منطقة الحجر.',
          narrativeEn: 'Gate 1 triggers FAIL 🛑! Automated system locks out production conduit, redirecting lot horizontally into quarantine.',
          actionRequiredAr: 'حظر الباركود في نظام ERP وتوجيه الرافعة الشوكية إلى قفص الحجر.',
          actionRequiredEn: 'Lock barcode in ERP and route forklift to quarantine bay.',
          statusType: 'fail'
        },
        {
          stepIndex: 3,
          id: 'quarantine',
          targetDomId: 'GATEWAY-1',
          badgeLabelAr: '🔒 رصيف الحجر QRN-01',
          badgeLabelEn: 'Quarantine Dock QRN-01',
          titleAr: 'عزل الشحنة وتثبيت بطاقات الحجر الحمراء (QRN-01)',
          titleEn: 'Physical Containment & Red Tagging at Quarantine Dock QRN-01',
          narrativeAr: 'تم نقل الشحنة بالكامل إلى رصيف الحجر QRN-01 وتثبيت أشرطة التحذير وبطاقات "مرفوض - حجر جودة" لمنع أي سحب خاطئ أو اختلاط بالإنتاج.',
          narrativeEn: 'Lot physically moved to Quarantine Bay QRN-01. Red tags and barricades applied to prevent accidental loading.',
          actionRequiredAr: 'قفل القفص الفيزيائي وتسليم تقرير الحجر لإدارة الجودة.',
          actionRequiredEn: 'Lock quarantine gate and issue quarantine custody voucher.',
          statusType: 'quarantine'
        },
        {
          stepIndex: 4,
          id: 'stage3',
          stageNumber: 3,
          targetDomId: 'DEPT-STAGE-RESOLUTION',
          badgeLabelAr: '📋 فتح تقرير NCR & 8D',
          badgeLabelEn: 'NCR & 8D Investigation',
          titleAr: 'المرحلة 3: فتح تقرير NCR وتشكيل فريق حل المشكلات 8D',
          titleEn: 'Stage 3: Non-Conformance Report (NCR) & 8D Problem Solving',
          narrativeAr: 'تم فتح تقرير عدم مطابقة NCR-2026-089 رسمياً، وتشكيل فريق 8D متعدد التخصصات (جودة، هندسة، مورد). جاري تحليل عظمة السمكة (Ishikawa) و 5-Whys.',
          narrativeEn: 'NCR-2026-089 logged. Cross-functional 8D team formed to conduct Ishikawa root cause and 5-Whys analysis.',
          actionRequiredAr: 'مطالبة المورد بالحضور الفوري وتطبيق إجراء الاحتواء المؤقت ICA.',
          actionRequiredEn: 'Summon supplier for urgent review and establish Interim Containment (ICA).',
          statusType: 'ncr'
        },
        {
          stepIndex: 5,
          id: 'capa',
          stageNumber: 3,
          targetDomId: 'DEPT-STAGE-RESOLUTION',
          badgeLabelAr: '🛡️ إجراء تصحيحي CAPA & MRB',
          badgeLabelEn: 'CAPA Corrective Action & MRB',
          titleAr: 'اعتماد إجراء تصحيحي CAPA وقرار لجنة مراجعة المواد MRB',
          titleEn: 'CAPA Corrective Plan Verified & MRB Disposition Review',
          narrativeAr: 'المورد عدّل برامج المعالجة الحرارية، ولجنة MRB أصدرت قرار فرز 100% مع استبدال العينات المعيبة على نفقة المورد بالكامل واجتياز الفحص البديل.',
          narrativeEn: 'Supplier recalibrated heat treatment recipe. MRB approved 100% sorting and full supplier compensation for rejected parts.',
          actionRequiredAr: 'إغلاق إجراء الـ CAPA وتوقيع محضر لجنة MRB لفك الحجر.',
          actionRequiredEn: 'Close CAPA ticket and authorize MRB disposition release.',
          statusType: 'capa'
        },
        {
          stepIndex: 6,
          id: 'loop',
          stageNumber: 3,
          targetDomId: 'DEPT-STAGE-RESOLUTION',
          badgeLabelAr: '🔄 فك الحجر والعودة للإنتاج',
          badgeLabelEn: 'Closed-Loop Release to Stage 2',
          titleAr: 'دورة الجودة المغلقة: فك الحجر وضخ الشحنة لصالة الإنتاج',
          titleEn: 'Closed-Loop Quality Cycle: Quarantine Lifted & Released to Production',
          narrativeAr: 'تم فك الحجر رسمياً وتغيير حالة اللوط إلى "مجاز بعد المعالجة". انطلاق سهم العودة الأخضر لإعادة ضخ الشحنة السليمة في صالة الإنتاج (المرحلة 2)!',
          narrativeEn: 'Quarantine lifted! Green return loop activates, safely reinjecting conforming sorted stock back into Stage 2 Production stream!',
          actionRequiredAr: 'بدء تصنيع الشحنة تحت مراقبة مشددة وتحديث سجل المورد.',
          actionRequiredEn: 'Begin manufacturing under heightened SPC watch and update supplier scorecard.',
          statusType: 'loop'
        }
      ];
    }
  }, [simulationType]);

  const currentSimStepInfo = simulationSteps[simulationStep] || simulationSteps[0];

  // Simulation Progression Timer
  useEffect(() => {
    if (!simulationActive || simulationPaused) return;

    const maxStep = simulationSteps.length - 1;
    const intervalMs = simulationSpeed === 1 ? 2800 : 1400;

    const timer = setInterval(() => {
      setSimulationStep((prev) => {
        if (prev >= maxStep) {
          setSimulationPaused(true);
          return maxStep;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [simulationActive, simulationPaused, simulationSteps.length, simulationSpeed]);

  // Simulation Dynamic Auto-Scroll to Active Flow Element
  useEffect(() => {
    if (!simulationActive) return;
    const stepObj = simulationSteps[simulationStep];
    if (stepObj?.targetDomId) {
      const el = document.getElementById(stepObj.targetDomId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [simulationActive, simulationStep, simulationSteps]);

  // --------------------------------------------------------------------------
  // 100% REAL RECORD METRICS ENGINE (Total, Pass, Fail across Stations & Stages)
  // ZERO FAKE DATA - Returns exact counts from user records or 0 if unrecorded
  // --------------------------------------------------------------------------
  const getStationRecordStats = useCallback((station: ScadaEquipment, _stageNumber: number) => {
    const code = (station.code || '').toUpperCase();
    const id = station.id;

    // 1. STAGE 1: IQC & Incoming
    if (id === 'STATION-IQC-INSPECTION' || code.includes('INSP') || code.includes('IQC')) {
      const total = realIncomingInspections.length;
      const passItems = realIncomingInspections.filter(i => (i.result || i.status || '').toLowerCase() === 'pass');
      const failItems = realIncomingInspections.filter(i => (i.result || i.status || '').toLowerCase() !== 'pass');
      return {
        total,
        pass: passItems.length,
        fail: failItems.length,
        acceptanceRate: total > 0 ? Math.round((passItems.length / total) * 100) : 100,
        unitAr: 'شحنة مفحوصة',
        unitEn: 'Inspected Lots',
        passLabelAr: 'مطابق للإفراج',
        passLabelEn: 'Released (Pass)',
        failLabelAr: 'مرفوض بالحجر',
        failLabelEn: 'Quarantined (Fail)',
        allItems: realIncomingInspections,
        passItems,
        failItems
      };
    }

    if (id === 'STATION-SUPPLIER-QUALITY' || code.includes('SUP')) {
      const suppliers = getStoredArray(['qms_local_suppliers']);
      const total = suppliers.length;
      const passItems = suppliers.filter(s => (s.status || '').toLowerCase() === 'approved' || (s.rating || 0) >= 80);
      const failItems = suppliers.filter(s => !((s.status || '').toLowerCase() === 'approved' || (s.rating || 0) >= 80));
      return {
        total,
        pass: passItems.length,
        fail: failItems.length,
        acceptanceRate: total > 0 ? Math.round((passItems.length / total) * 100) : 100,
        unitAr: 'مورد مسجل',
        unitEn: 'Suppliers',
        passLabelAr: 'معتمد ومؤهل',
        passLabelEn: 'Approved',
        failLabelAr: 'موقوف / تحت الملاحظة',
        failLabelEn: 'On Probation',
        allItems: suppliers,
        passItems,
        failItems
      };
    }

    if (id === 'STATION-INSPECTION-PLANS' || code.includes('PLN') || code.includes('PLAN')) {
      const plans = getStoredArray(['qms_local_inspection-plans', 'qms_local_inspection_plans', 'qms_inspection_plans_v1']);
      const total = plans.length;
      const passItems = plans.filter(p => (p.status || '').toLowerCase() === 'active' || (p.status || '').toLowerCase() === 'approved');
      const failItems = plans.filter(p => !((p.status || '').toLowerCase() === 'active' || (p.status || '').toLowerCase() === 'approved'));
      return {
        total,
        pass: passItems.length,
        fail: failItems.length,
        acceptanceRate: total > 0 ? Math.round((passItems.length / total) * 100) : 100,
        unitAr: 'خطة فحص',
        unitEn: 'Inspection Plans',
        passLabelAr: 'معتمدة وفعالة',
        passLabelEn: 'Active',
        failLabelAr: 'مسودات متوقفة',
        failLabelEn: 'Draft',
        allItems: plans,
        passItems,
        failItems
      };
    }

    // 2. STAGE 2: IPQC & Shopfloor
    if (id === 'STATION-SHOPFLOOR-ENTRY' || id === 'STATION-DEFECT-LOG' || code.includes('SHP') || code.includes('DEF')) {
      const defects = getStoredArray(['qms_local_defect-logs', 'qms_defect_record_audit_trail_v1']);
      const total = defects.length;
      const passItems = defects.filter(d => (d.status || '').toLowerCase() === 'closed' || (d.status || '').toLowerCase() === 'resolved');
      const failItems = defects.filter(d => !((d.status || '').toLowerCase() === 'closed' || (d.status || '').toLowerCase() === 'resolved'));
      return {
        total,
        pass: passItems.length,
        fail: failItems.length,
        acceptanceRate: total > 0 ? Math.round((passItems.length / total) * 100) : 100,
        unitAr: 'تسجيل عيب',
        unitEn: 'Defect Logs',
        passLabelAr: 'تم الحل والإغلاق',
        passLabelEn: 'Resolved',
        failLabelAr: 'عيوب نشطة ومفتوحة',
        failLabelEn: 'Open',
        allItems: defects,
        passItems,
        failItems
      };
    }

    if (id === 'STATION-SPC-CHARTS' || code.includes('SPC')) {
      const spc = getStoredArray(['qms_spc_real_measurements', 'qms_spc_charts_v2']);
      const total = spc.length;
      const passItems = spc.filter(s => !s.outOfControl);
      const failItems = spc.filter(s => s.outOfControl);
      return {
        total,
        pass: passItems.length,
        fail: failItems.length,
        acceptanceRate: total > 0 ? Math.round((passItems.length / total) * 100) : 100,
        unitAr: 'كارتة تحكم',
        unitEn: 'SPC Charts',
        passLabelAr: 'تحت السيطرة (In-Control)',
        passLabelEn: 'In Control',
        failLabelAr: 'انحراف إحصائي (OOC)',
        failLabelEn: 'Out of Control',
        allItems: spc,
        passItems,
        failItems
      };
    }

    if (id === 'STATION-EXECUTION-BOARD' || code.includes('EXEC') || code.includes('BRD')) {
      const tasks = getStoredArray(['qms_local_execution-tasks', 'qms_execution_tasks_v1']);
      const total = tasks.length;
      const passItems = tasks.filter(t => t.status === 'completed' || t.status === 'done');
      const failItems = tasks.filter(t => !(t.status === 'completed' || t.status === 'done'));
      return {
        total,
        pass: passItems.length,
        fail: failItems.length,
        acceptanceRate: total > 0 ? Math.round((passItems.length / total) * 100) : 100,
        unitAr: 'أمر فحص',
        unitEn: 'Inspection Tasks',
        passLabelAr: 'منفذة بالكامل',
        passLabelEn: 'Executed',
        failLabelAr: 'متأخرة عن الـ SLA',
        failLabelEn: 'Delayed',
        allItems: tasks,
        passItems,
        failItems
      };
    }

    // 3. STAGE 3: NCR, CAPA, 8D, Deviations, Change Control
    if (id === 'STATION-NCR-REPORTS' || code.includes('NCR')) {
      const ncrs = getStoredArray(['qms_local_ncr']);
      const total = ncrs.length;
      const passItems = ncrs.filter(n => (n.status || '').toLowerCase() === 'closed' || (n.status || '').toLowerCase() === 'resolved');
      const failItems = ncrs.filter(n => !((n.status || '').toLowerCase() === 'closed' || (n.status || '').toLowerCase() === 'resolved'));
      return {
        total,
        pass: passItems.length,
        fail: failItems.length,
        acceptanceRate: total > 0 ? Math.round((passItems.length / total) * 100) : 100,
        unitAr: 'تقرير NCR',
        unitEn: 'NCR Reports',
        passLabelAr: 'معتمد ومغلق',
        passLabelEn: 'Closed',
        failLabelAr: 'حالات حجز نشطة',
        failLabelEn: 'Open Containment',
        allItems: ncrs,
        passItems,
        failItems
      };
    }

    if (id === 'STATION-CAPA-ACTIONS' || code.includes('CAPA')) {
      const capas = getStoredArray(['qms_local_capa']);
      const total = capas.length;
      const passItems = capas.filter(c => (c.status || '').toLowerCase() === 'closed' || (c.status || '').toLowerCase() === 'completed');
      const failItems = capas.filter(c => !((c.status || '').toLowerCase() === 'closed' || (c.status || '').toLowerCase() === 'completed'));
      return {
        total,
        pass: passItems.length,
        fail: failItems.length,
        acceptanceRate: total > 0 ? Math.round((passItems.length / total) * 100) : 100,
        unitAr: 'إجراء تصحيحي',
        unitEn: 'CAPA Actions',
        passLabelAr: 'مكتمل وفعال',
        passLabelEn: 'Completed',
        failLabelAr: 'قيد التنفيذ',
        failLabelEn: 'Pending',
        allItems: capas,
        passItems,
        failItems
      };
    }

    if (id === 'STATION-8D-SOLVING' || code.includes('8D')) {
      const eightDs = getStoredArray(['qms_local_8d', 'qms_local_eight-d']);
      const total = eightDs.length;
      const passItems = eightDs.filter(d => (d.status || '').toLowerCase() === 'closed' || d.currentStep === 'D8');
      const failItems = eightDs.filter(d => !((d.status || '').toLowerCase() === 'closed' || d.currentStep === 'D8'));
      return {
        total,
        pass: passItems.length,
        fail: failItems.length,
        acceptanceRate: total > 0 ? Math.round((passItems.length / total) * 100) : 100,
        unitAr: 'مشروع 8D',
        unitEn: '8D Projects',
        passLabelAr: 'مغلق بنجاح (D8)',
        passLabelEn: 'Closed (D8)',
        failLabelAr: 'قيد التحليل الجذري',
        failLabelEn: 'Under Analysis',
        allItems: eightDs,
        passItems,
        failItems
      };
    }

    if (id === 'STATION-DEVIATION-PERMITS' || code.includes('DEV')) {
      const devs = getStoredArray(['qms_local_deviations', 'qms_local_deviation']);
      const total = devs.length;
      const passItems = devs.filter(d => (d.status || '').toLowerCase() === 'approved' || (d.status || '').toLowerCase() === 'closed');
      const failItems = devs.filter(d => !((d.status || '').toLowerCase() === 'approved' || (d.status || '').toLowerCase() === 'closed'));
      return {
        total,
        pass: passItems.length,
        fail: failItems.length,
        acceptanceRate: total > 0 ? Math.round((passItems.length / total) * 100) : 100,
        unitAr: 'تصريح حيود',
        unitEn: 'Deviations',
        passLabelAr: 'معتمد ومقيد',
        passLabelEn: 'Approved',
        failLabelAr: 'مرفوض لخطورته',
        failLabelEn: 'Rejected',
        allItems: devs,
        passItems,
        failItems
      };
    }

    if (id === 'STATION-CHANGE-CONTROL' || code.includes('CHG') || code.includes('ECN')) {
      const changes = getStoredArray(['qms_local_change-control', 'qms_local_change_control']);
      const total = changes.length;
      const passItems = changes.filter(c => (c.status || '').toLowerCase() === 'implemented' || (c.status || '').toLowerCase() === 'closed');
      const failItems = changes.filter(c => !((c.status || '').toLowerCase() === 'implemented' || (c.status || '').toLowerCase() === 'closed'));
      return {
        total,
        pass: passItems.length,
        fail: failItems.length,
        acceptanceRate: total > 0 ? Math.round((passItems.length / total) * 100) : 100,
        unitAr: 'أمر تغيير ECN',
        unitEn: 'Change Requests',
        passLabelAr: 'منفذ ومعتمد',
        passLabelEn: 'Implemented',
        failLabelAr: 'قيد دراسة الأثر',
        failLabelEn: 'Under Review',
        allItems: changes,
        passItems,
        failItems
      };
    }

    // 4. STAGE 4: Outgoing Quality (OQC)
    if (id === 'STATION-OUTGOING-OQC' || code.includes('OUT') || code.includes('OQC')) {
      const oqc = getStoredArray(['qms_local_oqc', 'qms_local_outgoing']);
      const total = oqc.length;
      const passItems = oqc.filter(o => (o.result || o.status || '').toLowerCase() === 'pass');
      const failItems = oqc.filter(o => (o.result || o.status || '').toLowerCase() !== 'pass');
      return {
        total,
        pass: passItems.length,
        fail: failItems.length,
        acceptanceRate: total > 0 ? Math.round((passItems.length / total) * 100) : 100,
        unitAr: 'لوط نهائي',
        unitEn: 'Release Lots',
        passLabelAr: 'تصريح شحن (COC)',
        passLabelEn: 'Approved for Dispatch',
        failLabelAr: 'حجز وإعادة تعديل',
        failLabelEn: 'Quarantined / Rework',
        allItems: oqc,
        passItems,
        failItems
      };
    }

    // 5. STAGE 5: Customer Complaints
    if (id === 'STATION-CUSTOMER-COMPLAINTS' || code.includes('CMP') || code.includes('CUST')) {
      const complaints = getStoredArray(['qms_local_complaints']);
      const total = complaints.length;
      const passItems = complaints.filter(c => (c.status || '').toLowerCase() === 'closed' || (c.status || '').toLowerCase() === 'resolved');
      const failItems = complaints.filter(c => !((c.status || '').toLowerCase() === 'closed' || (c.status || '').toLowerCase() === 'resolved'));
      return {
        total,
        pass: passItems.length,
        fail: failItems.length,
        acceptanceRate: total > 0 ? Math.round((passItems.length / total) * 100) : 100,
        unitAr: 'بلاغ عميل',
        unitEn: 'Customer Claims',
        passLabelAr: 'تمت التسوية والإغلاق',
        passLabelEn: 'Settled',
        failLabelAr: 'بلاغات نشطة',
        failLabelEn: 'Active Claims',
        allItems: complaints,
        passItems,
        failItems
      };
    }

    // 6. STAGE 6: Compliance & Lab
    if (id === 'STATION-CALIBRATION-MSA' || code.includes('CAL')) {
      const cals = getStoredArray(['qms_local_calibrations']);
      const total = cals.length;
      const passItems = cals.filter(c => (c.status || '').toLowerCase() === 'valid' || (c.status || '').toLowerCase() === 'calibrated');
      const failItems = cals.filter(c => !((c.status || '').toLowerCase() === 'valid' || (c.status || '').toLowerCase() === 'calibrated'));
      return {
        total,
        pass: passItems.length,
        fail: failItems.length,
        acceptanceRate: total > 0 ? Math.round((passItems.length / total) * 100) : 100,
        unitAr: 'جهاز قياس',
        unitEn: 'Gages',
        passLabelAr: 'معايرة صالحة',
        passLabelEn: 'Valid Calibration',
        failLabelAr: 'منتهية المعايرة',
        failLabelEn: 'Expired',
        allItems: cals,
        passItems,
        failItems
      };
    }

    if (id === 'STATION-CONTROL-PLAN' || code.includes('CP-') || code.includes('CTRL')) {
      const cps = getStoredArray(['qms_local_control-plans']);
      const total = cps.length;
      const passItems = cps.filter(p => (p.status || '').toLowerCase() === 'approved' || (p.status || '').toLowerCase() === 'active');
      const failItems = cps.filter(p => !((p.status || '').toLowerCase() === 'approved' || (p.status || '').toLowerCase() === 'active'));
      return {
        total,
        pass: passItems.length,
        fail: failItems.length,
        acceptanceRate: total > 0 ? Math.round((passItems.length / total) * 100) : 100,
        unitAr: 'خطة تحكم',
        unitEn: 'Control Plans',
        passLabelAr: 'معتمدة وسارية',
        passLabelEn: 'Approved',
        failLabelAr: 'مسودات',
        failLabelEn: 'Draft',
        allItems: cps,
        passItems,
        failItems
      };
    }

    if (id === 'STATION-FMEA-RISK' || code.includes('FMEA')) {
      const fmeas = getStoredArray(['qms_local_fmea', 'qms_fmea_studies_v1']);
      const total = fmeas.length;
      const passItems = fmeas.filter(f => (f.rpn || 0) < 100 || (f.status || '').toLowerCase() === 'approved');
      const failItems = fmeas.filter(f => !((f.rpn || 0) < 100 || (f.status || '').toLowerCase() === 'approved'));
      return {
        total,
        pass: passItems.length,
        fail: failItems.length,
        acceptanceRate: total > 0 ? Math.round((passItems.length / total) * 100) : 100,
        unitAr: 'دراسة FMEA',
        unitEn: 'FMEA Studies',
        passLabelAr: 'مستوى خطر آمن',
        passLabelEn: 'Low Risk',
        failLabelAr: 'خطر حرج (High RPN)',
        failLabelEn: 'High RPN',
        allItems: fmeas,
        passItems,
        failItems
      };
    }

    if (id === 'STATION-LAYERED-AUDITS' || id === 'STATION-INTERNAL-AUDIT' || code.includes('AUD')) {
      const audits = getStoredArray(['qms_local_audits']);
      const total = audits.length;
      const passItems = audits.filter(a => (a.result || a.status || '').toLowerCase() === 'conforming' || (a.result || a.status || '').toLowerCase() === 'passed' || (a.findingsCount || 0) === 0);
      const failItems = audits.filter(a => !((a.result || a.status || '').toLowerCase() === 'conforming' || (a.result || a.status || '').toLowerCase() === 'passed' || (a.findingsCount || 0) === 0));
      return {
        total,
        pass: passItems.length,
        fail: failItems.length,
        acceptanceRate: total > 0 ? Math.round((passItems.length / total) * 100) : 100,
        unitAr: 'جولة تدقيق',
        unitEn: 'Audits',
        passLabelAr: 'مطابق للمواصفة',
        passLabelEn: 'Conforming',
        failLabelAr: 'حالات عدم مطابقة',
        failLabelEn: 'Non-Conformances',
        allItems: audits,
        passItems,
        failItems
      };
    }

    // 7. STAGE 7: Setup & Master Data
    if (id === 'STATION-MASTER-DATA' || code.includes('MAS') || code.includes('DAT')) {
      const p1 = getStoredArray(['qms_master_data_parts']);
      const p2 = getStoredArray(['qms_master_data_production_lines']);
      const p3 = getStoredArray(['qms_master_data_defects']);
      const total = p1.length + p2.length + p3.length;
      const all = [...p1, ...p2, ...p3];
      return {
        total,
        pass: total,
        fail: 0,
        acceptanceRate: 100,
        unitAr: 'عنصر بيانات',
        unitEn: 'Data Items',
        passLabelAr: 'مفعل وجاهز',
        passLabelEn: 'Ready',
        failLabelAr: 'مسودات',
        failLabelEn: 'Draft',
        allItems: all,
        passItems: all,
        failItems: []
      };
    }

    if (id === 'STATION-FORM-DESIGNER' || code.includes('FRM') || code.includes('TMP')) {
      const tmps = getStoredArray(['qms_quality_form_templates_v1']);
      const total = tmps.length;
      return {
        total,
        pass: total,
        fail: 0,
        acceptanceRate: 100,
        unitAr: 'نموذج مصمم',
        unitEn: 'Templates',
        passLabelAr: 'معتمد وجاهز',
        passLabelEn: 'Ready',
        failLabelAr: 'مسودات',
        failLabelEn: 'Draft',
        allItems: tmps,
        passItems: tmps,
        failItems: []
      };
    }

    if (id === 'STATION-LESSONS-LEARNED' || code.includes('KB') || code.includes('LES')) {
      const kbs = getStoredArray(['qms_quality_knowledge_base_v1']);
      const total = kbs.length;
      return {
        total,
        pass: total,
        fail: 0,
        acceptanceRate: 100,
        unitAr: 'درس مستفاد',
        unitEn: 'Lessons',
        passLabelAr: 'موثق ومعتمد',
        passLabelEn: 'Documented',
        failLabelAr: 'مسودات',
        failLabelEn: 'Draft',
        allItems: kbs,
        passItems: kbs,
        failItems: []
      };
    }

    // Default Fallback: ZERO fake numbers!
    return {
      total: 0,
      pass: 0,
      fail: 0,
      acceptanceRate: 100,
      unitAr: 'سجل',
      unitEn: 'Records',
      passLabelAr: 'مطابق',
      passLabelEn: 'Pass',
      failLabelAr: 'مرفوض',
      failLabelEn: 'Fail',
      allItems: [],
      passItems: [],
      failItems: []
    };
  }, [realIncomingInspections, getStoredArray]);

  // Stage Total Roll-Up
  const getStageRecordStats = useCallback((deptId: string) => {
    const stations = stationsByDept.get(deptId) || [];
    let total = 0;
    let pass = 0;
    let fail = 0;

    stations.forEach(st => {
      const s = getStationRecordStats(st, 0);
      total += s.total;
      pass += s.pass;
      fail += s.fail;
    });

    const rate = total > 0 ? Math.round((pass / total) * 100) : 100;
    return {
      total,
      pass,
      fail,
      acceptanceRate: rate,
      unitAr: 'تسجيل',
      unitEn: 'Records'
    };
  }, [stationsByDept, getStationRecordStats]);

  // Global Factory Quality Balance Summary
  const globalFactoryStats = useMemo(() => {
    let total = 0;
    let pass = 0;
    let fail = 0;

    ENTERPRISE_DEPARTMENTS.forEach(dept => {
      const st = getStageRecordStats(dept.id);
      total += st.total;
      pass += st.pass;
      fail += st.fail;
    });

    const rate = total > 0 ? Math.round((pass / total) * 100) : 100;
    return { total, pass, fail, acceptanceRate: rate };
  }, [getStageRecordStats]);

  // Render Stage KPI & Metric Summary Header
  const renderStageMetricsBanner = (stageNumber: number, deptId: string, accentColor: string) => {
    const stageStats = getStageRecordStats(deptId);
    const stageStations = stationsByDept.get(deptId) || [];
    const targetStation = stageStations.find(st => {
      const s = getStationRecordStats(st, stageNumber);
      return s.total > 0;
    }) || stageStations[0];

    return (
      <div 
        className="p-3 sm:px-4 rounded-2xl bg-slate-950/90 border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-inner my-2"
        style={{ borderInlineStartColor: accentColor, borderInlineStartWidth: '4px' }}
      >
        <div 
          onClick={() => {
            if (targetStation) handleOpenDrilldown(targetStation, stageNumber, 'all');
          }}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          title={isAr ? 'اضغط لعرض السجلات ومسار هذه المرحلة' : 'Click to inspect stage records'}
        >
          <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
          <span className="text-xs font-bold text-slate-300">
            {isAr ? `إجمالي تسجيلات المرحلة ${stageNumber}:` : `Stage ${stageNumber} Total Records:`}
          </span>
          <span className="px-2.5 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono font-black text-xs border border-white/10 transition-colors">
            {stageStats.total} {isAr ? stageStats.unitAr : stageStats.unitEn} ↗
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              if (targetStation) handleOpenDrilldown(targetStation, stageNumber, 'pass');
            }}
            className="px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title={isAr ? 'اضغط لفتح السجلات المقبولة ومسارها' : 'Click to view accepted records'}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAr ? 'مقبول ومطابق:' : 'Accepted:'}</span>
            <b className="font-mono text-emerald-400 text-xs">{stageStats.pass}</b>
            <span className="text-[10px] text-emerald-400/80">({stageStats.acceptanceRate}%) ↗</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (targetStation) handleOpenDrilldown(targetStation, stageNumber, 'fail');
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border ${
              stageStats.fail > 0 
                ? 'bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border-rose-500/30' 
                : 'bg-slate-800/40 hover:bg-slate-800/80 text-slate-400 border-slate-700/30'
            }`}
            title={isAr ? 'اضغط لفتح السجلات المرفوضة ومسار الحجز' : 'Click to view rejected records'}
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span>{isAr ? 'مرفوض ومحجوز:' : 'Rejected:'}</span>
            <b className="font-mono text-rose-400 text-xs">{stageStats.fail}</b>
            <span className="text-[10px] text-rose-400/80">({100 - stageStats.acceptanceRate}%) ↗</span>
          </button>
        </div>
      </div>
    );
  };

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

  // Flowchart Card Component (Clean, Symmetrical, Modern & High-Usability)
  const renderCard = (station: ScadaEquipment, accentColor: string, stageNumber: number) => {
    const cardStats = getStationRecordStats(station, stageNumber);
    const stStatus = stationStatuses[station.id];
    const isAlert = stStatus?.status === 'alert' || stStatus?.isAndonActive;
    const isWarning = stStatus?.status === 'warning';
    const isSelected = selectedStationId === station.id;
    const isPassHigh = cardStats.acceptanceRate >= 90;
    const isPassMed = cardStats.acceptanceRate >= 75 && cardStats.acceptanceRate < 90;
    
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
        className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer text-start relative group shadow-sm hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.99] flex flex-col justify-between ${
          isLotStoppedHere
            ? 'bg-rose-950/40 border-rose-500 ring-4 ring-rose-500/50 shadow-2xl shadow-rose-900/50 animate-pulse'
            : isSelected
              ? 'bg-slate-900/95 border-cyan-400 ring-2 ring-cyan-500/40 shadow-cyan-950/50'
              : isAlert
                ? 'bg-rose-950/30 border-rose-500/70 hover:border-rose-400 shadow-rose-950/20'
                : isWarning
                  ? 'bg-amber-950/20 border-amber-500/70 hover:border-amber-400'
                  : 'bg-gradient-to-b from-slate-900/90 to-[#080e1c]/95 border-slate-800/80 hover:border-cyan-500/50 hover:shadow-cyan-950/30'
        }`}
        style={{
          borderTopColor: isLotStoppedHere ? '#f43f5e' : accentColor,
          borderTopWidth: '3.5px'
        }}
      >
        <div>
          {/* Card Top: Code & Status */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span 
                style={{ backgroundColor: `${accentColor}18`, color: accentColor, borderColor: `${accentColor}30` }}
                className="w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 shadow-inner"
              >
                {renderIcon(station.iconType, 'w-3.5 h-3.5')}
              </span>
              <div>
                <span className="text-xs font-mono font-black text-slate-200 tracking-wide block leading-none">
                  {station.code}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                  {isAr ? '🏢 محطة جودة' : 'Station Terminal'}
                </span>
              </div>
            </div>

            {isLotStoppedHere ? (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-slate-950 text-[10px] font-black border border-white flex items-center gap-1 shadow-md animate-pulse">
                <MapPin className="w-3 h-3 fill-slate-950" />
                <span>{isAr ? 'اللوط هنا 📍' : 'Lot Located'}</span>
              </span>
            ) : isAlert ? (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                <span>{stStatus?.statusLabelAr || (isAr ? 'تنبيه' : 'Alert')}</span>
              </span>
            ) : (
              <span 
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1.5 shadow-sm ${
                  isPassHigh
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : isPassMed
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                <span 
                  className="w-1.5 h-1.5 rounded-full" 
                  style={{ backgroundColor: isPassHigh ? '#34d399' : isPassMed ? '#fbbf24' : '#f43f5e' }} 
                />
                <span>{cardStats.acceptanceRate}% {isAr ? 'مطابقة' : 'Pass'}</span>
              </span>
            )}
          </div>

          {/* Title & Subtitle */}
          <div className="mb-3">
            <h4 className="text-sm font-black text-white leading-snug group-hover:text-cyan-300 transition-colors line-clamp-1">
              {isAr ? station.titleAr : station.titleEn}
            </h4>
            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
              {isAr ? station.locationAr : station.locationEn}
            </p>
          </div>

          {/* Live Record Breakdown (Total, Accepted, Rejected) */}
          {cardDisplayMode === 'clean' ? (
            <div className="my-2.5 space-y-2">
              {/* Header: Total Records */}
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-white/5">
                <span className="text-[11px] text-slate-400 font-medium">
                  {isAr ? 'إجمالي الفحص:' : 'Total Inspected:'}
                </span>
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDrilldown(station, stageNumber, 'all');
                  }}
                  className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-white font-mono font-bold text-[11px] cursor-pointer border border-white/10 hover:border-cyan-400 transition-colors flex items-center gap-1"
                  title={isAr ? 'اضغط لعرض كافة السجلات' : 'Click to inspect all records'}
                >
                  <Database className="w-3 h-3 text-cyan-400" />
                  <span>{cardStats.total} {isAr ? 'سجل' : 'items'}</span>
                  <span className="text-[9px] text-slate-400">↗</span>
                </span>
              </div>

              {/* TWO SEPARATED DEDICATED BOXES: PASS BOX & FAIL BOX */}
              <div className="grid grid-cols-2 gap-2">
                {/* 1. SEPARATE PASS BOX (مربع المقبول المستقل) */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDrilldown(station, stageNumber, 'pass');
                  }}
                  className="p-2 sm:p-2.5 rounded-2xl bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/40 hover:border-emerald-400/80 cursor-pointer transition-all flex flex-col justify-between shadow-sm group/pass"
                  title={isAr ? 'اضغط لفتح السجلات المقبولة والمسار' : 'Click to view accepted records'}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{isAr ? 'مقبول (Pass)' : 'Pass'}</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-black flex items-center gap-0.5 border border-emerald-500/30 shrink-0" title={isAr ? 'سهم مسار المقبول' : 'Pass Arrow'}>
                      <span>إجازة</span>
                      <ArrowDown className="w-2.5 h-2.5 text-emerald-400" />
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mt-1.5">
                    <span className="text-sm sm:text-base font-mono font-black text-emerald-300">
                      {cardStats.pass}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400/90 font-bold">
                      {cardStats.acceptanceRate}%
                    </span>
                  </div>

                  {/* Independent Green Pass Bar */}
                  <div className="w-full bg-slate-900 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm shadow-emerald-400/50" 
                      style={{ width: `${cardStats.acceptanceRate}%` }} 
                    />
                  </div>
                </div>

                {/* 2. SEPARATE FAIL BOX (مربع المرفوض المستقل مع سهم الحجز) */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDrilldown(station, stageNumber, 'fail');
                  }}
                  className={`p-2 sm:p-2.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between shadow-sm group/fail ${
                    cardStats.fail > 0
                      ? 'bg-rose-950/40 hover:bg-rose-950/70 border-rose-500/40 hover:border-rose-400/80 shadow-rose-950/30'
                      : 'bg-slate-950/40 hover:bg-slate-900/60 border-slate-800/80'
                  }`}
                  title={isAr ? 'اضغط لفتح السجلات المرفوضة ومسار الحجز' : 'Click to view rejected records'}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] sm:text-[11px] font-bold flex items-center gap-1 ${
                      cardStats.fail > 0 ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                      <AlertOctagon className={`w-3.5 h-3.5 shrink-0 ${cardStats.fail > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
                      <span>{isAr ? 'مرفوض (Fail)' : 'Fail'}</span>
                    </span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black flex items-center gap-0.5 border shrink-0 ${
                      cardStats.fail > 0 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                        : 'bg-black/30 text-slate-500 border-slate-800'
                    }`} title={isAr ? 'سهم مسار الحجر' : 'Hold Arrow'}>
                      <span>حجز</span>
                      <ArrowUpRight className="w-2.5 h-2.5" />
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mt-1.5">
                    <span className={`text-sm sm:text-base font-mono font-black ${
                      cardStats.fail > 0 ? 'text-rose-300' : 'text-slate-500'
                    }`}>
                      {cardStats.fail}
                    </span>
                    <span className={`text-[10px] font-mono font-bold ${
                      cardStats.fail > 0 ? 'text-rose-400' : 'text-slate-500'
                    }`}>
                      {cardStats.fail > 0 ? `${100 - cardStats.acceptanceRate}%` : '0%'}
                    </span>
                  </div>

                  {/* Independent Red Fail Bar */}
                  <div className="w-full bg-slate-900 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full rounded-full transition-all duration-500 shadow-sm shadow-rose-500/50" 
                      style={{ width: cardStats.fail > 0 ? `${100 - cardStats.acceptanceRate}%` : '0%' }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="my-2 p-1.5 px-2 rounded-xl bg-slate-950/50 border border-white/5 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDrilldown(station, stageNumber, 'all');
                }}
                className="text-slate-300 hover:text-cyan-300 text-[11px] font-mono font-bold flex items-center gap-1 transition-colors"
                title={isAr ? 'اضغط لفتح كامل السجلات' : 'Click to inspect all records'}
              >
                <b className="text-white text-xs">{cardStats.total}</b> {isAr ? 'سجل' : 'items'} ↗
              </button>

              {/* TWO SEPARATED BOXES WITH EXPLICIT ARROWS */}
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
                {/* Separate Pass Box */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDrilldown(station, stageNumber, 'pass');
                  }}
                  className="px-2 py-0.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  title={isAr ? 'اضغط لفتح السجلات المقبولة وسهم الإجازة' : 'Click to view accepted records'}
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{cardStats.pass}</span>
                  <span className="text-[9px] font-sans text-emerald-400/80">{isAr ? 'مقبول' : 'Pass'}</span>
                  <ArrowDown className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                </button>

                {/* Separate Fail Box */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDrilldown(station, stageNumber, 'fail');
                  }}
                  className={`px-2 py-0.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 shadow-sm ${
                    cardStats.fail > 0 
                      ? 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border-rose-500/40' 
                      : 'bg-black/40 text-slate-500 border-slate-800'
                  }`}
                  title={isAr ? 'اضغط لفتح السجلات المرفوضة وسهم مسار الحجز' : 'Click to view rejected records'}
                >
                  <AlertOctagon className={`w-3 h-3 ${cardStats.fail > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
                  <span>{cardStats.fail}</span>
                  <span className={`text-[9px] font-sans ${cardStats.fail > 0 ? 'text-rose-400/80' : 'text-slate-500'}`}>
                    {isAr ? 'مرفوض' : 'Fail'}
                  </span>
                  <ArrowUpRight className="w-2.5 h-2.5 shrink-0" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Card Footer: Unit & Action */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs mt-1">
          <span className="text-[10px] text-slate-400 font-mono truncate max-w-[130px]">
            {isAr ? cardStats.unitAr : cardStats.unitEn}
          </span>

          <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500 text-cyan-300 group-hover:text-slate-950 font-black text-[11px] flex items-center gap-1 transition-all shadow-sm">
            <span>{isAr ? 'فتح المحطة' : 'Open Tab'}</span>
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
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

  // ADVANCED GEOMETRIC DECISION DIAMOND WITH DUAL-BRANCH CORRIDORS & QUARANTINE DOCK
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

    const deptIdForGate: Record<number, string> = {
      1: 'DEPT-STAGE-INCOMING',
      2: 'DEPT-STAGE-INPROCESS',
      3: 'DEPT-STAGE-RESOLUTION',
      4: 'DEPT-STAGE-OUTGOING',
      5: 'DEPT-STAGE-CUSTOMER',
    };
    const gateDeptId = deptIdForGate[gateNumber] || 'DEPT-STAGE-INCOMING';
    const stageStats = getStageRecordStats(gateDeptId);

    const stageNamesAr: Record<number, string> = {
      2: 'المرحلة 2: جودة التصنيع والعمليات (IPQC)',
      3: 'المرحلة 3: عدم المطابقة وحل المشكلات (NCR)',
      4: 'المرحلة 4: فحص وخروج المنتج النهائي (OQC)',
      5: 'المرحلة 5: شكاوى العملاء والميدان (Customer QA)',
      6: 'المرحلة 6: المختبر والتدقيق الهندسي',
    };
    const stageNamesEn: Record<number, string> = {
      2: 'Stage 2: In-Process Quality (IPQC)',
      3: 'Stage 3: Problem Solving & NCR',
      4: 'Stage 4: Outgoing Quality (OQC)',
      5: 'Stage 5: Customer Quality & Complaints',
      6: 'Stage 6: Engineering Lab & Audits',
    };

    return (
      <div className="relative my-7 flex flex-col items-center w-full">
        {/* Incoming Flow Pipe from Stage */}
        <div className="flex flex-col items-center">
          <div className="w-1.5 h-7 rounded-full" style={{ backgroundColor: accentColor }} />
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
                  <span className="text-[11px] font-mono text-rose-400 font-black">FAIL ⬇️</span>
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

        {/* DUAL-BRANCH OUTGOING CONDUITS (Pass ⬇️ vs Fail ⬇️) */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 px-1">
          {/* 1. PASS CONDUIT (المسار المعتمد والمطابق) */}
          <div className="flex flex-col items-center">
            {/* Animated Pipe */}
            <div className="flex flex-col items-center">
              <div className="w-2 h-10 rounded-full bg-gradient-to-b from-emerald-500 via-emerald-400 to-emerald-500 relative shadow-lg shadow-emerald-500/50">
                <div className="w-3 h-3 rounded-full bg-emerald-300 absolute -top-1 -left-0.5 animate-ping" />
              </div>
              <div className="text-emerald-400 text-base font-black -mt-1 animate-bounce">▼</div>
            </div>

            {/* Path Route Indicator Card */}
            <div className="mt-2 w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border-2 border-emerald-500/50 flex items-center justify-between shadow-xl shadow-emerald-950/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                    <span>{isAr ? 'مسار الإفراج والاعتماد المباشر (PASS)' : 'Approved Production Path (PASS)'}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    {isAr 
                      ? `يتدفق مباشرة إلى ${stageNamesAr[passTargetStageNumber] || `المرحلة ${passTargetStageNumber}`}` 
                      : `Flows directly to ${stageNamesEn[passTargetStageNumber] || `Stage ${passTargetStageNumber}`}`}
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono font-black text-xs border border-emerald-500/40 shrink-0">
                {stageStats.pass} {isAr ? 'مجاز' : 'Pass'} ⬇
              </span>
            </div>
          </div>

          {/* 2. FAIL CONDUIT (مسار عدم المطابقة والحجر) */}
          <div className="flex flex-col items-center">
            {/* Animated Pipe */}
            <div className="flex flex-col items-center">
              <div className="w-2 h-10 rounded-full bg-gradient-to-b from-rose-500 via-rose-400 to-rose-600 relative shadow-lg shadow-rose-500/50">
                <div className="w-3 h-3 rounded-full bg-rose-400 absolute -top-1 -left-0.5 animate-ping" />
              </div>
              <div className="text-rose-400 text-base font-black -mt-1 animate-bounce">▼</div>
            </div>

            {/* Path Route Indicator Card */}
            <div className="mt-2 w-full p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/40 to-slate-900 border-2 border-rose-500/50 flex items-center justify-between shadow-xl shadow-rose-950/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <div className="text-xs font-black text-rose-300 flex items-center gap-1.5">
                    <span>{isAr ? 'مسار الحجر وعدم المطابقة (FAIL)' : 'Quarantine & Containment Path (FAIL)'}</span>
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    {isAr ? 'عزل فوري وإجراءات الحظر ورصيف الحجر' : 'Instant Isolation & Quarantine Actions'}
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 font-mono font-black text-xs border border-rose-500/40 shrink-0">
                {stageStats.fail} {isAr ? 'محجوز' : 'Quarantined'} ⬇
              </span>
            </div>
          </div>
        </div>

        {/* DEDICATED QUARANTINE & IMMEDIATE CONTAINMENT DOCK (رصيف حجر المرفوض وإجراءات الـ NCR) */}
        {targetNcr && (
          <div className="w-full max-w-4xl mt-3 p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-rose-950/60 via-slate-900/95 to-slate-950 border-2 border-rose-500/50 shadow-2xl backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-rose-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                  <AlertOctagon className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      {isAr ? 'رصيف العزل والحجر الفوري' : 'Quarantine Containment Dock'}
                    </span>
                    <span className="text-[11px] text-rose-400 font-mono font-bold">
                      QRN-0{gateNumber}
                    </span>
                    {isLotDivertedHere && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-slate-950 text-[10px] font-black animate-pulse">
                        {isAr ? `اللوط ${trackedLot.lotNumber} متوقف هنا` : `Lot Stopped Here`}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-black text-white mt-0.5">
                    {isAr ? `إجراءات حظر وعزل الشحنات غير المطابقة (بوابة #${gateNumber})` : `Immediate Quarantine & Non-Conformance Actions (Gate #${gateNumber})`}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-xs font-mono font-black text-rose-300">
                  {stageStats.fail} {isAr ? 'شحنات محجوزة' : 'Quarantined'}
                </span>
              </div>
            </div>

            {/* 3 Immediate Industrial Quality Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              {/* Action 1: Physical Quarantine Tag */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-bold mb-1">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>{isAr ? '1. الحظر والعزل الفيزيائي' : '1. Physical Quarantine'}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {isAr ? 'وضع علامة الحجر الحمراء لمنع خلط الشحنة أو دخولها لخط الإنتاج.' : 'Apply red quarantine tag to isolate material from production lines.'}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 font-bold">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAr ? 'منطقة العزل مؤمنة (Active Hold)' : 'Quarantine Zone Active'}</span>
                </div>
              </div>

              {/* Action 2: Open Electronic NCR Form */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-bold mb-1">
                    <FileText className="w-4 h-4 shrink-0" />
                    <span>{isAr ? '2. تقرير عدم مطابقة NCR' : '2. Electronic NCR Report'}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {isAr ? 'توثيق حالة عدم المطابقة إلكترونياً وتحديد السبب المبدئي.' : 'Log instant electronic non-conformance report to track cost of quality.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/ncr')}
                  className="mt-3 w-full py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-950/40 hover:scale-[1.02]"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{isAr ? 'فتح نموذج NCR جديد' : 'Create NCR Report'}</span>
                </button>
              </div>

              {/* Action 3: Branch to Stage 3 Problem Solving Hub */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-900/30 to-slate-950/80 border border-rose-500/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-rose-300 text-xs font-bold mb-1">
                    <Workflow className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{isAr ? '3. التحويل للمرحلة 3 (NCR & 8D)' : '3. Escalate to Stage 3'}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {isAr ? 'تصعيد الشحنة لمركز حل المشكلات 8D ولجنة MRB لتحديد المصير.' : 'Direct hydraulic branch pipeline connected to Stage 3 resolution center.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => scrollToStage('DEPT-STAGE-RESOLUTION', true)}
                  className="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-950/50 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>{isAr ? '⚡ انتقال للمرحلة 3 (NCR & 8D)' : 'Branch to Stage 3'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Diverted Lot Specific Notice */}
            {isLotDivertedHere && (
              <div className="mt-3 p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 flex items-center justify-between text-xs text-rose-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
                  <span className="font-bold">{isAr ? `تنبيه خاص باللوط المتتبع ${trackedLot.lotNumber}:` : `Tracked Lot Alert:`}</span>
                  <span>{isAr ? trackedLot.stopReasonAr : trackedLot.stopReasonEn}</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-rose-500 text-slate-950 font-black text-[10px]">
                  {isAr ? 'محجوز هنا' : 'Held Here'}
                </span>
              </div>
            )}

            {/* Bottom Pipeline Notification */}
            <div className="pt-2.5 mt-2.5 border-t border-rose-500/20 flex flex-wrap items-center justify-between text-[11px] text-rose-300/80 font-mono gap-2">
              <span className="flex items-center gap-1.5">
                <GitFork className="w-3.5 h-3.5 text-rose-400 rotate-90" />
                <span>{isAr ? 'مسار تفريع المرفوض: مربوط مباشرة بمركز المرحلة 3 لحل المشكلات' : 'Rejection Branch: Connected directly to Stage 3 Resolution Center'}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                IATF 16949 §8.7 • Control of Nonconforming Outputs
              </span>
            </div>
          </div>
        )}

        {/* Final Outgoing Flow Pipe to Next Stage */}
        <div className="flex flex-col items-center mt-3">
          <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-emerald-500 via-emerald-400 to-transparent" />
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

  // --------------------------------------------------------------------------
  // DRILL-DOWN RECORD MODAL & LOT JOURNEY INSPECTOR (Detailed Pass / Fail / All)
  // --------------------------------------------------------------------------
  const renderStationDrilldownModal = () => {
    if (!stationDrilldown.isOpen || !stationDrilldown.station) return null;

    const st = stationDrilldown.station;
    const stageNum = stationDrilldown.stageNumber;
    const stats = getStationRecordStats(st, stageNum);
    const activeFilter = stationDrilldown.filter;

    // Pick items based on active tab
    const sourceList: any[] = activeFilter === 'pass' 
      ? (stats.passItems || []) 
      : activeFilter === 'fail' 
        ? (stats.failItems || []) 
        : (stats.allItems || []);

    // Filter by search query if user searches
    const query = drilldownSearch.trim().toLowerCase();
    const displayItems = sourceList.filter((item: any) => {
      if (!query) return true;
      const lot = String(item.batchNumber || item.lotNumber || item.batch || item.lot || '').toLowerCase();
      const name = String(item.productName || item.product || item.title || item.name || item.partName || '').toLowerCase();
      const num = String(item.inspectionNumber || item.ncrNumber || item.capaNumber || item.code || item.id || '').toLowerCase();
      const notes = String(item.notes || item.reason || item.description || item.defectType || '').toLowerCase();
      const supp = String(item.supplierName || item.supplier || '').toLowerCase();
      return lot.includes(query) || name.includes(query) || num.includes(query) || notes.includes(query) || supp.includes(query);
    });

    const isPassFilter = activeFilter === 'pass';
    const isFailFilter = activeFilter === 'fail';

    return (
      <div 
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
        onClick={() => setStationDrilldown(prev => ({ ...prev, isOpen: false }))}
      >
        <div 
          className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-start animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* MODAL HEADER */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-inner">
                {renderIcon(st.iconType, 'w-5 h-5')}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-cyan-300 font-mono font-black text-xs">
                    {st.code}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {isAr ? `المرحلة ${stageNum}` : `Stage ${stageNum}`}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-300 border border-white/10">
                    {stats.total} {isAr ? stats.unitAr : stats.unitEn}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                  {isAr ? st.titleAr : st.titleEn}
                </h3>
              </div>
            </div>

            <button
              onClick={() => setStationDrilldown(prev => ({ ...prev, isOpen: false }))}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-white/10"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* FILTER TABS & SEARCH BAR */}
          <div className="p-3 sm:px-5 bg-slate-950/60 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-white/10">
              {/* Total */}
              <button
                onClick={() => setStationDrilldown(prev => ({ ...prev, filter: 'all' }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeFilter === 'all'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{isAr ? 'الكل' : 'All'}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  activeFilter === 'all' ? 'bg-slate-950/30 text-slate-950' : 'bg-white/10 text-slate-300'
                }`}>
                  {stats.total}
                </span>
              </button>

              {/* Pass */}
              <button
                onClick={() => setStationDrilldown(prev => ({ ...prev, filter: 'pass' }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeFilter === 'pass'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-emerald-400 hover:bg-emerald-950/40'
                }`}
              >
                <span>{isAr ? '✓ مقبول ومطابق' : '✓ Pass'}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  activeFilter === 'pass' ? 'bg-slate-950/30 text-slate-950' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {stats.pass}
                </span>
              </button>

              {/* Fail */}
              <button
                onClick={() => setStationDrilldown(prev => ({ ...prev, filter: 'fail' }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeFilter === 'fail'
                    ? 'bg-rose-500 text-slate-950 shadow-md font-black'
                    : 'text-rose-400 hover:bg-rose-950/40'
                }`}
              >
                <span>{isAr ? '✕ مرفوض ومحجوز' : '✕ Fail'}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  activeFilter === 'fail' ? 'bg-slate-950/30 text-slate-950' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {stats.fail}
                </span>
              </button>
            </div>

            {/* In-Modal Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={drilldownSearch}
                onChange={(e) => setDrilldownSearch(e.target.value)}
                placeholder={isAr ? 'بحث برقم اللوط أو الخامة...' : 'Search lot or record...'}
                className="w-full ps-8 pe-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
              {drilldownSearch && (
                <button
                  onClick={() => setDrilldownSearch('')}
                  className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* RECORDS LIST CONTAINER */}
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] space-y-3.5 scrollbar-thin">
            {displayItems.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-3xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto border border-white/10 shadow-lg">
                  {isFailFilter ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  ) : (
                    <FileText className="w-7 h-7 text-slate-400" />
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white">
                    {isFailFilter 
                      ? (isAr ? 'ممتاز! لا توجد أي سجلات مرفوضة في هذه المحطة 🎉' : 'Zero Rejections! 100% Conformance 🎉')
                      : isPassFilter
                        ? (isAr ? 'لا توجد سجلات مقبولة حالياً' : 'No pass records found')
                        : (isAr ? 'لا توجد سجلات مسجلة بعد في هذه المحطة' : 'No records logged in this station yet')}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {isFailFilter 
                      ? (isAr ? 'جميع الفحوصات والعمليات المنفذة في هذه المحطة مطابقة تماماً للمواصفات الفنية وبدون أي حالات حجز.' : 'All inspected units passed technical tolerance specifications.')
                      : (isAr ? 'يمكنك النقر على الزر أدناه للانتقال وإضافة فحص جديد مباشرةً.' : 'Click below to open the module and record inspections.')}
                  </p>
                </div>
                {isFailFilter && stats.pass > 0 ? (
                  <button
                    onClick={() => setStationDrilldown(prev => ({ ...prev, filter: 'pass' }))}
                    className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all"
                  >
                    {isAr ? `عرض السجلات المقبولة (✓ ${stats.pass})` : `View Accepted Records (${stats.pass})`}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setStationDrilldown(prev => ({ ...prev, isOpen: false }));
                      navigate(st.moduleUrl);
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs transition-all flex items-center gap-1.5 mx-auto shadow-md"
                  >
                    <span>{isAr ? 'الانتقال إلى المحطة وتسجيل فحص جديد ↗' : 'Open Module & Add Inspection ↗'}</span>
                  </button>
                )}
              </div>
            ) : (
              displayItems.map((item: any, idx: number) => {
                // Extract record metadata
                const lotNo = String(item.batchNumber || item.lotNumber || item.batch || item.lot || '');
                const recId = String(item.inspectionNumber || item.ncrNumber || item.capaNumber || item.auditNumber || item.code || item.id || `#REC-${idx + 1}`);
                const prodName = item.productName || item.product || item.title || item.name || item.partName || (isAr ? 'خامة مسجلة' : 'Registered Item');
                const dateVal = item.inspectionDate || item.date || (item.createdAt ? String(item.createdAt).split('T')[0] : '') || (isAr ? 'اليوم' : 'Today');
                const inspector = item.inspectedBy || item.auditor || item.createdBy || item.owner || (isAr ? 'مفتش الجودة' : 'QA Lead');
                const sampleQty = item.sampleSize ?? item.quantity ?? item.units ?? null;
                const defCount = item.defectCount ?? item.defects ?? item.findingsCount ?? 0;
                const lineName = item.productionLine || item.line || item.location || '';
                const supplierName = item.supplierName || item.supplier || '';
                const notes = item.notes || item.reason || item.description || item.defectType || '';

                // Conformance flag
                const isItemPass = (() => {
                  if (item.result) return (item.result || '').toLowerCase() === 'pass';
                  if (item.status) {
                    const s = (item.status || '').toLowerCase();
                    return s === 'pass' || s === 'approved' || s === 'closed' || s === 'resolved' || s === 'completed' || s === 'valid' || s === 'conforming';
                  }
                  return true;
                })();

                return (
                  <div
                    key={item.id || item.inspectionNumber || idx}
                    className={`p-4 rounded-2xl border transition-all text-start space-y-3 shadow-md ${
                      isItemPass
                        ? 'bg-slate-950/70 border-emerald-500/30 hover:border-emerald-500/60'
                        : 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/70 shadow-rose-950/20'
                    }`}
                  >
                    {/* TOP LINE: LOT NUMBER, RECORD ID & STATUS PILL */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {lotNo ? (
                          <span className="px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono font-black text-xs flex items-center gap-1.5 shadow-sm">
                            <Barcode className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{isAr ? 'لوط:' : 'Lot:'} <b>{lotNo}</b></span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 font-mono text-xs">
                            {recId}
                          </span>
                        )}

                        <span className="text-xs font-mono text-slate-400">
                          {recId}
                        </span>

                        <span className="text-xs text-slate-400">
                          📅 {dateVal}
                        </span>
                      </div>

                      {/* Conformance status badge */}
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 shadow-sm ${
                        isItemPass
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}>
                        {isItemPass ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{stats.passLabelAr || (isAr ? 'مطابق ومقبول للإفراج' : 'Approved (Pass)')}</span>
                          </>
                        ) : (
                          <>
                            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                            <span>{stats.failLabelAr || (isAr ? 'مرفوض بالحجر / حظر' : 'Quarantined (Fail)')}</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* COMPLETE DATA GRID (2 to 4 cols) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {/* Product Name */}
                      <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {isAr ? '📦 الخامة / الصنف:' : 'Material / Item:'}
                        </span>
                        <b className="text-white text-xs block font-bold truncate mt-0.5" title={prodName}>
                          {prodName}
                        </b>
                      </div>

                      {/* Inspector */}
                      <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {isAr ? '👤 الفاحص / المسؤول:' : 'Inspector / Owner:'}
                        </span>
                        <span className="text-slate-200 text-xs block truncate mt-0.5">
                          {inspector}
                        </span>
                      </div>

                      {/* Sample Size / Quantity */}
                      <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {isAr ? '🔢 حجم العينة / الكمية:' : 'Sample / Qty:'}
                        </span>
                        <span className="text-slate-200 text-xs font-mono font-bold block mt-0.5">
                          {sampleQty !== null ? sampleQty : '-'}
                        </span>
                      </div>

                      {/* Defect Count */}
                      <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {isAr ? '⚠️ عدد العيوب / الانحرافات:' : 'Defects Found:'}
                        </span>
                        <span className={`text-xs font-mono font-black block mt-0.5 ${
                          defCount > 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {defCount} {isAr ? 'عيب' : 'defects'}
                        </span>
                      </div>
                    </div>

                    {/* Secondary row if line or supplier exists */}
                    {(lineName || supplierName) && (
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 bg-white/[0.02] p-2 rounded-xl border border-white/5">
                        {supplierName && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">{isAr ? '🏢 المورد:' : 'Supplier:'}</span>
                            <span className="font-bold text-white">{supplierName}</span>
                          </div>
                        )}
                        {lineName && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">{isAr ? '🏭 خط الإنتاج / الموقع:' : 'Line:'}</span>
                            <span className="font-bold text-white">{lineName}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes & Reason Box */}
                    {notes && (
                      <div className={`p-2.5 rounded-xl border text-xs leading-relaxed ${
                        isItemPass 
                          ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-200' 
                          : 'bg-rose-950/30 border-rose-500/30 text-rose-200 font-medium'
                      }`}>
                        <span className="font-bold block mb-0.5 text-[11px] opacity-90">
                          {isItemPass 
                            ? (isAr ? '📝 ملاحظات الفحص والاعتماد:' : 'Release Notes:') 
                            : (isAr ? '🚨 سبب الرفض وإجراء الحجر:' : 'Rejection Reason / Quarantine Action:')}
                        </span>
                        <span>{notes}</span>
                      </div>
                    )}

                    {/* LOT JOURNEY & ACTION BAR (The core user request) */}
                    <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                      {lotNo ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedLotNumber(lotNo.toUpperCase());
                              setStationDrilldown(prev => ({ ...prev, isOpen: false }));
                              // Smooth scroll to lot traceability banner or stopping stage
                              setTimeout(() => {
                                const tracker = document.getElementById('lot-journey-traceability-bar');
                                if (tracker) {
                                  tracker.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                } else if (!isItemPass) {
                                  scrollToStage('DEPT-STAGE-RESOLUTION', true);
                                } else {
                                  scrollToStage('DEPT-STAGE-INCOMING', true);
                                }
                              }, 150);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all"
                          >
                            <Crosshair className="w-3.5 h-3.5 text-slate-950" />
                            <span>{isAr ? `🧭 تتبع مسار هذا اللوط (${lotNo}) في الفلوشارت` : `Track Lot (${lotNo}) Journey`}</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          {isAr ? 'مسجل بدون رقم لوط محدد' : 'No specific lot code attached'}
                        </span>
                      )}

                      <button
                        onClick={() => {
                          setStationDrilldown(prev => ({ ...prev, isOpen: false }));
                          navigate(st.moduleUrl);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <span>{isAr ? 'فتح المحطة ↗' : 'Open Station ↗'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* MODAL FOOTER */}
          <div className="p-3 sm:px-5 bg-slate-950 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <span>
              {isAr ? `إجمالي السجلات المعروضة: ${displayItems.length}` : `Showing ${displayItems.length} records`}
            </span>
            <button
              onClick={() => setStationDrilldown(prev => ({ ...prev, isOpen: false }))}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Cross-lane Shunt component for Dual Swimlane mode (Horizontal Defect Shunt)
  const renderCrossLaneShunt = (targetNodeTitleAr: string, targetNodeTitleEn: string, targetStageId: string, alertTextAr: string, alertTextEn: string) => (
    <div className="w-full my-3 p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/70 via-slate-900 to-rose-950/40 border-2 border-rose-500/50 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 shadow-md shadow-rose-950/40">
          <GitFork className="w-4 h-4 text-rose-400 rotate-90" />
        </div>
        <div>
          <div className="text-[11px] font-black text-rose-300 flex items-center gap-1.5">
            <span>{isAr ? '🛑 مسار انحراف العيوب ➔ تحويل عرضي للمسار الأحمر' : 'Defect Shunt ➔ Cross-lane to Red Lane'}</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </div>
          <div className="text-[10px] text-slate-300">
            {isAr ? alertTextAr : alertTextEn}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => scrollToStage(targetStageId, true)}
        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-rose-950/40 transition-all hover:scale-105 active:scale-95"
      >
        <span>{isAr ? `انحراف لـ [${targetNodeTitleAr}]` : `Shunt to [${targetNodeTitleEn}]`}</span>
        <ArrowUpRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  // Raw Materials Quarantine Dock in Red Lane (QRN-01)
  const renderRawQuarantineDock = () => {
    const stageStats = getStageRecordStats('DEPT-STAGE-INCOMING');
    return (
      <div id="LANE-RED-QUARANTINE-IQC" className="p-5 rounded-3xl bg-slate-900/90 border-2 border-rose-500/50 shadow-2xl space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-rose-500/20">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-black bg-rose-500/20 text-rose-400 border border-rose-500/40">
              QRN-01
            </span>
            <div>
              <h4 className="text-sm font-black text-white">
                {isAr ? '🛑 رصيف حجر وعزل خامات الاستلام (IQC)' : 'IQC Receiving Quarantine Dock'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {isAr ? 'يستقبل الشحنات غير المطابقة المحالة من بوابة القرار 1 في المسار الأخضر' : 'Receives non-conforming raw lots diverted from Gateway 1'}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-rose-950 border border-rose-500/30 text-xs font-mono font-black text-rose-300">
            {stageStats.fail} {isAr ? 'شحنة محجوزة' : 'Lots Hold'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
            <span className="text-xs text-rose-300 font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>{isAr ? 'حظر فيزيائي نشط' : 'Active Physical Hold'}</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </div>
          <button
            type="button"
            onClick={() => navigate('/ncr')}
            className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-950/40"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{isAr ? 'فتح تقرير NCR فوري' : 'Create NCR Form'}</span>
          </button>
        </div>
      </div>
    );
  };

  // Finished Goods Quarantine Dock in Red Lane (QRN-04)
  const renderFinishedQuarantineDock = () => {
    const stageStats = getStageRecordStats('DEPT-STAGE-OUTGOING');
    return (
      <div id="LANE-RED-QUARANTINE-OQC" className="p-5 rounded-3xl bg-slate-900/90 border-2 border-rose-500/50 shadow-2xl space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-rose-500/20">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-black bg-rose-500/20 text-rose-400 border border-rose-500/40">
              QRN-04
            </span>
            <div>
              <h4 className="text-sm font-black text-white">
                {isAr ? '🛑 رصيف حجر عينات المنتج النهائي (OQC)' : 'Finished Goods Quarantine Dock'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {isAr ? 'يستقبل الشحنات غير المطابقة لمعايير AQL المحالة من بوابة القرار 4' : 'Receives non-conforming finished lots diverted from Gateway 4'}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-rose-950 border border-rose-500/30 text-xs font-mono font-black text-rose-300">
            {stageStats.fail} {isAr ? 'لوط محجوز' : 'Lots Hold'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
            <span className="text-xs text-rose-300 font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>{isAr ? 'حجز شحنة ومنع تصدير' : 'Export Block Hold'}</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </div>
          <button
            type="button"
            onClick={() => setActiveStageDrawer({ stageNumber: 3, stageId: 'DEPT-STAGE-RESOLUTION' })}
            className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-950/40"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{isAr ? 'عرض إجراءات MRB والفرز' : 'View MRB & Sort'}</span>
          </button>
        </div>
      </div>
    );
  };

  // Customer Claims & RMA Return Dock in Red Lane (RMA-01)
  const renderReturnsQuarantineDock = () => {
    const stageStats = getStageRecordStats('DEPT-STAGE-CUSTOMER');
    return (
      <div id="LANE-RED-RETURNS-RMA" className="p-5 rounded-3xl bg-slate-900/90 border-2 border-rose-500/50 shadow-2xl space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-rose-500/20">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-black bg-rose-500/20 text-rose-400 border border-rose-500/40">
              RMA-01
            </span>
            <div>
              <h4 className="text-sm font-black text-white">
                {isAr ? '🛑 مركز تسوية المرتجعات وبلاغات الضمان (RMA)' : 'Customer Warranty RMA Intake Hub'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {isAr ? 'يستقبل المرتجعات المحالة من بوابة القرار 5 لتحليل أسباب الخلل وتحديث FMEA' : 'Receives field return claims diverted from Gateway 5 for root cause analysis'}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-rose-950 border border-rose-500/30 text-xs font-mono font-black text-rose-300">
            {stageStats.fail} {isAr ? 'بلاغات مفتوحة' : 'Active Claims'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => navigate('/complaints')}
            className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-white/5 text-xs text-rose-300 font-bold flex items-center justify-between transition-colors"
          >
            <span>{isAr ? 'سجل شكاوى العملاء' : 'Customer Claims'}</span>
            <ExternalLink className="w-3.5 h-3.5 text-rose-400" />
          </button>
          <button
            type="button"
            onClick={() => setActiveStageDrawer({ stageNumber: 3, stageId: 'DEPT-STAGE-RESOLUTION' })}
            className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-950/40"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{isAr ? 'تصعيد للتحقيق 8D و CAPA' : 'Escalate to 8D'}</span>
          </button>
        </div>
      </div>
    );
  };

  // Closed Loop Re-injection to Production Card
  const renderClosedLoopCard = () => (
    <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-emerald-950/30 border-2 border-emerald-500/50 shadow-2xl space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-md">
            <RotateCcw className="w-4 h-4 text-emerald-400 animate-spin" />
          </span>
          <div>
            <h4 className="text-sm font-black text-emerald-300">
              {isAr ? '🔄 دورة الجودة المغلقة (Closed-Loop Resolution)' : 'Closed-Loop Quality Resolution'}
            </h4>
            <span className="text-[11px] text-slate-300 font-mono">IATF 16949 §10.2 • Corrective Action Verification</span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-black border border-emerald-500/40">
          {getStageRecordStats('DEPT-STAGE-RESOLUTION').pass} {isAr ? 'مُفرج عنها' : 'Released'}
        </span>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        {isAr
          ? 'عند التحقق من نجاح خطة 8D وإغلاق الإجراءات التصحيحية CAPA، تصدر لجنة MRB قرار فك الحجر الصحي وإعادة توجيه المواد إلى خط الإنتاج المعتمد.'
          : 'Upon 8D root cause closure and CAPA verification, MRB lifts quarantine and lots return to production stream.'}
      </p>

      <button
        type="button"
        onClick={() => scrollToStage('DEPT-STAGE-INPROCESS', true)}
        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/40 hover:scale-[1.02] active:scale-[0.98]"
      >
        <span>{isAr ? '🟢 سهم العودة للإنتاج: فك الحجر وضخ اللوط بالمسار الأخضر' : 'Loop-back: Return lot to Production Lane'}</span>
        <ArrowUpRight className="w-4 h-4" />
      </button>
    </div>
  );

  const renderStartTerminal = () => {
    const isStepStart = simulationActive && simulationStep === 0;
    return (
      <div id="start-terminal" className="flex flex-col items-center">
        <div className={`px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 border-2 border-white flex items-center gap-2 transition-all ${
          isStepStart ? 'ring-4 ring-amber-300 scale-105 shadow-2xl animate-pulse' : ''
        }`}>
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
          <span>{isAr ? '🚀 بداية المسار: استلام الخامات وتأهيل الموردين' : 'START: Incoming Materials & Supplier Verification'}</span>
          {isStepStart && (
            <span className="px-2 py-0.5 rounded-md bg-black text-amber-300 font-mono text-[10px] font-bold">
              LOT ARRIVAL
            </span>
          )}
        </div>
        {renderFlowPipe('#f59e0b', 'توريد خامات جديدة', 'New Raw Batch')}
      </div>
    );
  };

  const renderEndTerminal = () => {
    const isStepEnd = simulationActive && simulationType === 'pass' && simulationStep === 7;
    return (
      <div id="end-terminal" className="flex flex-col items-center pt-2">
        <div className={`px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/20 border-2 border-white flex items-center gap-2 transition-all ${
          isStepEnd ? 'ring-4 ring-emerald-300 scale-105 shadow-2xl animate-bounce' : ''
        }`}>
          <CheckCircle2 className="w-4 h-4 text-slate-950" />
          <span>{isAr ? '🏁 نهاية الدورة: مطابقة تامة 100% وتحسين مستمر' : 'END: 100% Conformance & Continuous Excellence'}</span>
          {isStepEnd && (
            <span className="px-2 py-0.5 rounded-md bg-black text-emerald-300 font-mono text-[10px] font-bold">
              100% RELEASED
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderClosedLoopFeedbackBanner = () => (
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
  );

  const renderGate1 = () => (
    <div className="space-y-3">
      {renderDecisionDiamond({
          gateNumber: 1,
          questionAr: 'هل المواد الخام والشحنات الواردة مطابقة للمواصفات وخطط الفحص؟',
          questionEn: 'Are incoming raw materials compliant with quality specs & receiving plans?',
          passLabelAr: `مطابق: تم إجازة ${getStageRecordStats('DEPT-STAGE-INCOMING').pass} شحنة لدخول صالة الإنتاج والتصنيع ⬇️`,
          passLabelEn: `Conforming: ${getStageRecordStats('DEPT-STAGE-INCOMING').pass} lots cleared & released for shopfloor production entry ⬇️`,
          passTargetStageNumber: 2,
          failLabelAr: `غير مطابق: تم حجز ${getStageRecordStats('DEPT-STAGE-INCOMING').fail} شحنة وتحويلها فوراً للمرحلة 3 (NCR) ➡️`,
          failLabelEn: `Non-Conforming: ${getStageRecordStats('DEPT-STAGE-INCOMING').fail} lots quarantined and escalated to Stage 3 NCR ➡️`,
          accentColor: '#f59e0b',
          targetNcr: true
        })}
      {flowchartLayoutMode === "dual" && renderCrossLaneShunt(
        'رصيف الحجر QRN-01 والـ NCR بالمسار الأحمر',
        'Quarantine Dock QRN-01 in Red Lane',
        'LANE-RED-QUARANTINE-IQC',
        'الشحنات المرفوضة في فحص الاستلام تنحرف عرضياً إلى رصيف الحجر الصحي QRN-01 في المسار الأحمر',
        'Rejected incoming lots shunt across to Quarantine Dock QRN-01 in the Red Lane'
      )}
    </div>
  );

  const renderGate2 = () => (
    <div className="space-y-3">
      {renderDecisionDiamond({
          gateNumber: 2,
          questionAr: 'هل عينات التشغيل والقياسات ضمن حدود الضبط SPC وخالية من العيوب الحرجة؟',
          questionEn: 'Are in-process samples within SPC control limits & free of critical defects?',
          passLabelAr: `مطابق ومستقر: ${getStageRecordStats('DEPT-STAGE-INPROCESS').pass} عملية إنتاج سليمة ومجازة للمرحلة 4 (فحص المنتج النهائي OQC) ⬇️`,
          passLabelEn: `Conforming: ${getStageRecordStats('DEPT-STAGE-INPROCESS').pass} conforming processes cleared for Stage 4 (Outgoing OQC) ⬇️`,
          passTargetStageNumber: 4,
          failLabelAr: `خلل أو أندون: ${getStageRecordStats('DEPT-STAGE-INPROCESS').fail} عيوب استدعت حجز الإنتاج والتصعيد لـ NCR و 8D ⬇️`,
          failLabelEn: `Alert / Out of Control: ${getStageRecordStats('DEPT-STAGE-INPROCESS').fail} defects escalated to NCR & 8D ⬇️`,
          accentColor: '#06b6d4',
          targetNcr: true
        })}
      {flowchartLayoutMode === "dual" && renderCrossLaneShunt(
        'مركز حل المشكلات 8D و CAPA بالمسار الأحمر',
        'Problem Solving 8D & CAPA in Red Lane',
        'DEPT-STAGE-RESOLUTION',
        'انحرافات وعيوب خط الإنتاج والأندون تنحرف عرضياً نحو المسار الأحمر للتحليل الجذري 8D',
        'In-process defects & Andon alerts shunt across to Red Lane for 8D root-cause resolution'
      )}
    </div>
  );

  const renderGate3 = () => (
    <div className="w-full">
      {renderDecisionDiamond({
          gateNumber: 3,
          questionAr: 'هل تم حصر الخلل، إغلاق السبب الجذري 8D، وتأكيد فعالية الإجراء التصحيحي CAPA؟',
          questionEn: 'Has the root cause been contained, 8D verified & CAPA corrective action closed?',
          passLabelAr: `تم الحل والاعتماد: ${getStageRecordStats('DEPT-STAGE-RESOLUTION').pass} تقرير وإجراء تم إغلاقه وفك الحجر الصحي ⬇️`,
          passLabelEn: `Resolved & Verified: ${getStageRecordStats('DEPT-STAGE-RESOLUTION').pass} closed reports, quarantine lifted ⬇️`,
          passTargetStageNumber: 4,
          failLabelAr: `قيد التحقيق: ${getStageRecordStats('DEPT-STAGE-RESOLUTION').fail} حالات عزل قيد التحليل الجذري والمتابعة ➡️`,
          failLabelEn: `Under Investigation: ${getStageRecordStats('DEPT-STAGE-RESOLUTION').fail} containment actions under review ➡️`,
          accentColor: '#f43f5e',
          targetNcr: false
        })}
    </div>
  );

  const renderGate4 = () => (
    <div className="space-y-3">
      {renderDecisionDiamond({
          gateNumber: 4,
          questionAr: 'هل شحنة المنتج التام مطابقة لمعايير قبول عينات AQL؟',
          questionEn: 'Are finished goods lots fully compliant with AQL acceptance criteria?',
          passLabelAr: `مطابق ومجاز: ${getStageRecordStats('DEPT-STAGE-OUTGOING').pass} لوط تم إصدار شهادة المطابقة COC والترخيص بالشحن ⬇️`,
          passLabelEn: `Compliant: ${getStageRecordStats('DEPT-STAGE-OUTGOING').pass} lots issued COC and cleared for shipping ⬇️`,
          passTargetStageNumber: 5,
          failLabelAr: `مرفوض: ${getStageRecordStats('DEPT-STAGE-OUTGOING').fail} شحنة محجوزة ومحالة فوراً إلى المرحلة 3 لإعادة الفرز أو NCR ➡️`,
          failLabelEn: `Rejected: ${getStageRecordStats('DEPT-STAGE-OUTGOING').fail} lot quarantined and escalated to Stage 3 NCR ➡️`,
          accentColor: '#10b981',
          targetNcr: true
        })}
      {flowchartLayoutMode === "dual" && renderCrossLaneShunt(
        'حجر المنتجات التامة ولجنة MRB بالمسار الأحمر',
        'Finished Goods Quarantine & MRB in Red Lane',
        'DEPT-STAGE-RESOLUTION',
        'شحنات المنتج النهائي المرفوضة في فحص الخروج تنحرف للمسار الأحمر لإعادة الفرز أو التكهين',
        'Rejected finished goods lots shunt across to Red Lane for sorting or scrap disposition'
      )}
    </div>
  );

  const renderGate5 = () => (
    <div className="w-full">
      {renderDecisionDiamond({
          gateNumber: 5,
          questionAr: 'هل تم حل شكوى العميل، تسوية المرتجع RMA، واستخلاص السبب الفني؟',
          questionEn: 'Has customer claim been settled, RMA processed & technical feedback extracted?',
          passLabelAr: `نعم: تم إغلاق ${getStageRecordStats('DEPT-STAGE-CUSTOMER').pass} شكوى وتمرير الملاحظات للمختبر والتدقيق لتحديث FMEA ⬇️`,
          passLabelEn: `Yes: ${getStageRecordStats('DEPT-STAGE-CUSTOMER').pass} claims resolved & fed back to Lab & FMEA ⬇️`,
          passTargetStageNumber: 6,
          failLabelAr: `شكوى حرجة مفتوحة: ${getStageRecordStats('DEPT-STAGE-CUSTOMER').fail} بلاغات قيد التحقيق والمتابعة الطارئة ➡️`,
          failLabelEn: `Open Claim: ${getStageRecordStats('DEPT-STAGE-CUSTOMER').fail} claims under emergency review ➡️`,
          accentColor: '#6366f1',
          targetNcr: true
        })}
    </div>
  );

  const renderStage1 = () => {

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

              {/* Stage 1 Record Metrics Banner (Total, Pass, Fail) */}
              {renderStageMetricsBanner(1, 'DEPT-STAGE-INCOMING', '#f59e0b')}

              {/* ------------------------------------------------------------- */}
              {/* SECTION A: PERMANENT QUALITY STATIONS (محطات الفحص الثابتة) */}
              {/* ------------------------------------------------------------- */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 px-1">
                  <span className="font-black flex items-center gap-1.5 text-amber-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span>{isAr ? '🏢 محطات الجودة الرقابية الثابتة في المصنع (3 محطات):' : 'Stage 1 Quality Terminals (3 Permanent Stations):'}</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
                    {isAr ? 'SUP-01 | PLN-01 | IQC-01' : 'Fixed Stations'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(stationsByDept.get('DEPT-STAGE-INCOMING') || []).map(st => renderCard(st, '#f59e0b', 1))}
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SECTION B: INSPECTED RAW MATERIAL LOTS TRAY (شحنات وتشغيلات الخامات) */}
              {/* ------------------------------------------------------------- */}
              {(() => {
                const totalLotsCount = realIncomingInspections.length;
                const passLots = realIncomingInspections.filter(i => (i.result || i.status || '').toLowerCase() === 'pass');
                const failLots = realIncomingInspections.filter(i => (i.result || i.status || '').toLowerCase() !== 'pass');

                // Filter by Status Tab
                const statusFiltered = lotTrayFilter === 'pass' 
                  ? passLots 
                  : lotTrayFilter === 'fail' 
                    ? failLots 
                    : realIncomingInspections;

                // Filter by Search Query
                const q = lotTraySearch.trim().toLowerCase();
                const displayLots = statusFiltered.filter(ins => {
                  if (!q) return true;
                  const lotNo = String(ins.batchNumber || ins.batch || ins.lot || ins.inspectionNumber || ins.id || '').toLowerCase();
                  const prod = String(ins.productName || ins.product || '').toLowerCase();
                  const supp = String(ins.supplierName || ins.supplier || '').toLowerCase();
                  return lotNo.includes(q) || prod.includes(q) || supp.includes(q);
                });

                return (
                  <div className="mt-6 pt-5 border-t-2 border-dashed border-amber-500/30 bg-gradient-to-b from-slate-950/95 via-[#081022] to-[#050a14] rounded-3xl p-4 sm:p-6 border border-cyan-500/30 shadow-2xl space-y-4">
                    {/* TRAY HEADER */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-inner">
                          <Barcode className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono font-black text-xs">
                              {isAr ? '📦 سجل التشغيلات والشحنات المفحوصة' : 'Material Batches Log'}
                            </span>
                            <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/30">
                              {isAr ? '📍 ناتجة من محطة فحص الاستلام: IQC-01' : 'Processed via IQC-01 Station'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono font-bold">
                              {totalLotsCount} {isAr ? 'لوط مسجل' : 'Lots'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {isAr 
                              ? 'هذه كروت شحنات الخامات الفعلية المارة برصيف الفحص ومسار كل تشغيلة لحظياً نحو صالة الإنتاج أو الحجز الإجباري.' 
                              : 'Actual material shipment lots inspected at IQC and their routing to production or quarantine.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          onClick={() => navigate('/compliance/hub/inspection')}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95"
                        >
                          <span>{isAr ? '➕ فحص خامة جديدة' : '➕ Inspect Material'}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-950" />
                        </button>

                        <button
                          onClick={() => setIsLotTrayCollapsed(!isLotTrayCollapsed)}
                          className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all flex items-center gap-1"
                          title={isLotTrayCollapsed ? (isAr ? 'توسيع السجل' : 'Expand') : (isAr ? 'طي السجل' : 'Collapse')}
                        >
                          <span>{isLotTrayCollapsed ? (isAr ? 'توسيع ▼' : 'Expand ▼') : (isAr ? 'طي ▲' : 'Collapse ▲')}</span>
                        </button>
                      </div>
                    </div>

                    {/* SCALABILITY TOOLBAR (عند زيادة اللوطات: بحث فوري + تصفية + تبديل النمط) */}
                    {!isLotTrayCollapsed && totalLotsCount > 0 && (
                      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-black/40 p-2.5 rounded-2xl border border-white/5">
                        {/* Status Filters */}
                        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-white/10 overflow-x-auto scrollbar-none">
                          <button
                            type="button"
                            onClick={() => setLotTrayFilter('all')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              lotTrayFilter === 'all'
                                ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {isAr ? 'كافة اللوطات' : 'All'} ({totalLotsCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => setLotTrayFilter('pass')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              lotTrayFilter === 'pass'
                                ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                                : 'text-emerald-400 hover:bg-emerald-950/40'
                            }`}
                          >
                            {isAr ? '✓ المفرج عنها' : '✓ Pass'} ({passLots.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setLotTrayFilter('fail')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              lotTrayFilter === 'fail'
                                ? 'bg-rose-500 text-slate-950 font-black shadow-sm'
                                : 'text-rose-400 hover:bg-rose-950/40'
                            }`}
                          >
                            {isAr ? '✕ المحجوزة بـ NCR' : '✕ Quarantined'} ({failLots.length})
                          </button>
                        </div>

                        {/* Search Input & View Toggle */}
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1 md:w-60">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={lotTraySearch}
                              onChange={(e) => setLotTraySearch(e.target.value)}
                              placeholder={isAr ? 'بحث برقم اللوط أو الخامة...' : 'Quick search lot or part...'}
                              className="w-full ps-8 pe-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                            />
                            {lotTraySearch && (
                              <button
                                onClick={() => setLotTraySearch('')}
                                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                              >
                                ✕
                              </button>
                            )}
                          </div>

                          {/* View Mode Toggle (Cards vs Table) */}
                          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-white/10 shrink-0">
                            <button
                              type="button"
                              onClick={() => setLotTrayViewMode('cards')}
                              className={`p-1.5 rounded-lg text-xs transition-all ${
                                lotTrayViewMode === 'cards'
                                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                              title={isAr ? 'عرض بطاقات الشحنات' : 'Cards Grid'}
                            >
                              <LayoutGrid className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setLotTrayViewMode('table')}
                              className={`p-1.5 rounded-lg text-xs transition-all ${
                                lotTrayViewMode === 'table'
                                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                              title={isAr ? 'عرض جدول مدمج مضغوط (للكميات الكبيرة)' : 'Dense Table View (For high volumes)'}
                            >
                              <ListFilter className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* LOTS DISPLAY AREA (SCROLLABLE & PROTECTED AGAINST OVERFLOW) */}
                    {!isLotTrayCollapsed && (
                      <div>
                        {totalLotsCount === 0 ? (
                          <div className="p-8 rounded-2xl bg-black/40 border border-dashed border-amber-500/30 text-center space-y-2">
                            <Barcode className="w-8 h-8 text-amber-400 mx-auto opacity-80" />
                            <h5 className="text-sm font-bold text-white">
                              {isAr ? 'لا توجد شحنات خامات مفحوصة بعد في محطة IQC' : 'No material lots inspected at IQC yet'}
                            </h5>
                            <p className="text-xs text-slate-400 max-w-md mx-auto">
                              {isAr ? 'اضغط على زر "➕ فحص خامة جديدة" لتسجيل أول شحنة واردة ومتابعة مسارها في الفلوشارت.' : 'Click above to record your first incoming batch inspection.'}
                            </p>
                          </div>
                        ) : displayLots.length === 0 ? (
                          <div className="p-6 rounded-2xl bg-black/30 text-center space-y-2">
                            <p className="text-xs text-slate-400">
                              {isAr ? `لا توجد لوطات تطابق البحث "${lotTraySearch}"` : `No lots matching "${lotTraySearch}"`}
                            </p>
                            <button
                              onClick={() => { setLotTraySearch(''); setLotTrayFilter('all'); }}
                              className="text-xs text-cyan-400 hover:underline font-bold"
                            >
                              {isAr ? 'إعادة ضبط البحث والتصفية' : 'Reset filters'}
                            </button>
                          </div>
                        ) : lotTrayViewMode === 'cards' ? (
                          /* ---------------- CARDS VIEW (BATCH TAG STYLE) ---------------- */
                          <div className="max-h-[420px] overflow-y-auto pr-1 scrollbar-thin space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {displayLots.map((ins, idx) => {
                                const isPass = (ins.result || '').toLowerCase() === 'pass' || (ins.status || '').toLowerCase() === 'pass';
                                const lotNo = ins.batchNumber || ins.batch || ins.lot || ins.inspectionNumber || ins.id;
                                const isCurrentSelected = selectedLotNumber === lotNo;

                                return (
                                  <div
                                    key={ins.id || idx}
                                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between text-start relative group/lot shadow-md ${
                                      isCurrentSelected
                                        ? 'bg-cyan-950/80 border-cyan-400 ring-2 ring-cyan-400/50 shadow-cyan-950/60'
                                        : isPass
                                          ? 'bg-slate-900/90 border-emerald-500/40 hover:border-emerald-400 hover:bg-slate-850'
                                          : 'bg-rose-950/20 border-rose-500/50 hover:border-rose-400 hover:bg-rose-950/30'
                                    }`}
                                  >
                                    <div>
                                      {/* Top Badge: Explicit Lot Tag distinction */}
                                      <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2 mb-2.5">
                                        <div className="flex items-center gap-1.5">
                                          <span className="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                                            <Barcode className="w-3 h-3 text-cyan-400" />
                                          </span>
                                          <div>
                                            <span className="font-mono font-black text-xs text-white group-hover/lot:text-cyan-300 transition-colors tracking-wide block">
                                              {lotNo}
                                            </span>
                                            <span className="text-[9px] font-bold text-cyan-400/80 uppercase tracking-wider block">
                                              {isAr ? '📦 تشغيلة خامة' : 'Material Lot'}
                                            </span>
                                          </div>
                                        </div>

                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${
                                          isPass 
                                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                        }`}>
                                          <span>{isPass ? '✓' : '✕'}</span>
                                          <span>{isPass ? (isAr ? 'عَبَر للإنتاج' : 'PASS ➔ IPQC') : (isAr ? 'محجوز بـ NCR' : 'FAIL ➔ NCR')}</span>
                                        </span>
                                      </div>

                                      {/* Material Info */}
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                                            {isAr ? 'اسم الخامة:' : 'Material:'}
                                          </span>
                                          <span className="text-[10px] text-slate-400 font-mono">
                                            📅 {ins.inspectionDate || ins.date || ''}
                                          </span>
                                        </div>

                                        <h5 className="text-sm font-black text-white line-clamp-1">
                                          {ins.productName || ins.product || (isAr ? 'خامة واردة' : 'Material')}
                                        </h5>

                                        <p className="text-xs text-slate-400 line-clamp-1">
                                          🏢 {ins.supplierName || (isAr ? 'مورد معتمد' : 'Approved Supplier')}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Action & Stats Footer */}
                                    <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                                      <span className="text-slate-400 font-mono text-[11px]">
                                        <b className={ins.defectCount > 0 ? 'text-rose-400' : 'text-emerald-400'}>{ins.defectCount || 0}</b> {isAr ? 'عيب' : 'def'} / {ins.sampleSize || 0} {isAr ? 'عينة' : 'samples'}
                                      </span>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedLotNumber(lotNo);
                                          if (isPass) {
                                            scrollToStage('DEPT-STAGE-INPROCESS', true);
                                          } else {
                                            scrollToStage('DEPT-STAGE-RESOLUTION', true);
                                          }
                                        }}
                                        className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 font-black text-[11px] flex items-center gap-1 transition-all shadow-sm"
                                        title={isAr ? 'تتبع مسار هذه الخامة في الفلوشارت' : 'Trace lot path in flowchart'}
                                      >
                                        <Crosshair className="w-3 h-3" />
                                        <span>{isAr ? 'تتبع المسار 🎯' : 'Trace Flow'}</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          /* ---------------- COMPACT TABLE VIEW (FOR HIGH VOLUME LOTS) ---------------- */
                          <div className="max-h-[380px] overflow-y-auto scrollbar-thin border border-white/10 rounded-2xl bg-black/50">
                            <table className="w-full text-start text-xs border-collapse">
                              <thead className="bg-slate-900/90 text-slate-400 border-b border-white/10 sticky top-0 z-10 font-bold text-[11px]">
                                <tr>
                                  <th className="p-2.5 px-3 text-start">{isAr ? 'رقم اللوط' : 'Lot #'}</th>
                                  <th className="p-2.5 px-3 text-start">{isAr ? 'الخامة / الصنف' : 'Material'}</th>
                                  <th className="p-2.5 px-3 text-start">{isAr ? 'تاريخ الفحص' : 'Date'}</th>
                                  <th className="p-2.5 px-3 text-start">{isAr ? 'المورد' : 'Supplier'}</th>
                                  <th className="p-2.5 px-3 text-start">{isAr ? 'العينات / العيوب' : 'Samples / Defects'}</th>
                                  <th className="p-2.5 px-3 text-start">{isAr ? 'النتيجة ومسار القرار' : 'Result & Path'}</th>
                                  <th className="p-2.5 px-3 text-center">{isAr ? 'المسار' : 'Trace'}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 font-mono">
                                {displayLots.map((ins, idx) => {
                                  const isPass = (ins.result || '').toLowerCase() === 'pass' || (ins.status || '').toLowerCase() === 'pass';
                                  const lotNo = ins.batchNumber || ins.batch || ins.lot || ins.inspectionNumber || ins.id;
                                  const isCurrentSelected = selectedLotNumber === lotNo;

                                  return (
                                    <tr 
                                      key={ins.id || idx}
                                      onClick={() => {
                                        setSelectedLotNumber(lotNo);
                                        if (isPass) {
                                          scrollToStage('DEPT-STAGE-INPROCESS', true);
                                        } else {
                                          scrollToStage('DEPT-STAGE-RESOLUTION', true);
                                        }
                                      }}
                                      className={`transition-colors cursor-pointer hover:bg-white/5 ${
                                        isCurrentSelected ? 'bg-cyan-950/60 text-cyan-200' : ''
                                      }`}
                                    >
                                      <td className="p-2.5 px-3 font-black text-cyan-300">
                                        {lotNo}
                                      </td>
                                      <td className="p-2.5 px-3 text-white font-sans font-bold">
                                        {ins.productName || ins.product || '-'}
                                      </td>
                                      <td className="p-2.5 px-3 text-slate-400">
                                        {ins.inspectionDate || ins.date || '-'}
                                      </td>
                                      <td className="p-2.5 px-3 text-slate-300 font-sans">
                                        {ins.supplierName || '-'}
                                      </td>
                                      <td className="p-2.5 px-3 text-slate-400">
                                        {ins.sampleSize || 0} / <b className={ins.defectCount > 0 ? 'text-rose-400' : 'text-emerald-400'}>{ins.defectCount || 0}</b>
                                      </td>
                                      <td className="p-2.5 px-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border inline-flex items-center gap-1 ${
                                          isPass 
                                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                        }`}>
                                          <span>{isPass ? '✓' : '✕'}</span>
                                          <span>{isPass ? (isAr ? 'عَبَر للإنتاج' : 'PASS ➔ IPQC') : (isAr ? 'محجوز بـ NCR' : 'FAIL ➔ NCR')}</span>
                                        </span>
                                      </td>
                                      <td className="p-2.5 px-3 text-center">
                                        <button
                                          type="button"
                                          className="p-1 px-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 font-black text-[10px] inline-flex items-center gap-1 transition-all"
                                        >
                                          <span>{isAr ? 'تتبع' : 'Trace'}</span>
                                          <ArrowUpRight className="w-3 h-3" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </section>
          );
          };

  const renderStage2 = () => {

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

              {/* Stage 2 Record Metrics Banner (Total, Pass, Fail) */}
              {renderStageMetricsBanner(2, 'DEPT-STAGE-INPROCESS', '#06b6d4')}

              <div className={`grid gap-3 ${flowchartLayoutMode === "dual" ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
                {(stationsByDept.get('DEPT-STAGE-INPROCESS') || []).map(st => renderCard(st, '#06b6d4', 2))}
              </div>
            </section>
          );
          };

  const renderStage3 = () => {

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
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/30 text-[10px] font-bold text-rose-300">
                        {isAr ? '🔄 مركز الاستقبال والتفريغ المباشر لكافة بوابات القرار (Gateways 1, 2, 4)' : 'Central Receiving Hub for Rejections from Gateways 1, 2, 4'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
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

              {/* Stage 3 Record Metrics Banner (Total, Pass, Fail) */}
              {renderStageMetricsBanner(3, 'DEPT-STAGE-RESOLUTION', '#f43f5e')}

              <div className={`grid gap-3 ${flowchartLayoutMode === "dual" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"}`}>
                {(stationsByDept.get('DEPT-STAGE-RESOLUTION') || []).map(st => renderCard(st, '#f43f5e', 3))}
              </div>
            </section>
          );
          };

  const renderStage4 = () => {

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

              {/* Stage 4 Record Metrics Banner (Total, Pass, Fail) */}
              {renderStageMetricsBanner(4, 'DEPT-STAGE-OUTGOING', '#10b981')}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(stationsByDept.get('DEPT-STAGE-OUTGOING') || []).map(st => renderCard(st, '#10b981', 4))}
              </div>
            </section>
          );
          };

  const renderStage5 = () => {

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

              {/* Stage 5 Record Metrics Banner (Total, Pass, Fail) */}
              {renderStageMetricsBanner(5, 'DEPT-STAGE-CUSTOMER', '#6366f1')}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(stationsByDept.get('DEPT-STAGE-CUSTOMER') || []).map(st => renderCard(st, '#6366f1', 5))}
              </div>
            </section>
          );
          };

  const renderStage6 = () => {

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

              {/* Stage 6 Record Metrics Banner (Total, Pass, Fail) */}
              {renderStageMetricsBanner(6, 'DEPT-STAGE-COMPLIANCE', '#a855f7')}

              <div className={`grid gap-3 ${flowchartLayoutMode === "dual" ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"}`}>
                {(stationsByDept.get('DEPT-STAGE-COMPLIANCE') || []).map(st => renderCard(st, '#a855f7', 6))}
              </div>
            </section>
          );
          };

  const renderStage7 = () => {

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

              {/* Stage 7 Record Metrics Banner (Total, Pass, Fail) */}
              {renderStageMetricsBanner(7, 'DEPT-STAGE-SETUP', '#3b82f6')}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(stationsByDept.get('DEPT-STAGE-SETUP') || []).map(st => renderCard(st, '#3b82f6', 7))}
              </div>
            </section>
          );
          };


  // --------------------------------------------------------------------------
  // CLEAN PROCESS DIAGRAM COMPONENTS (Recommended Interactive Flowchart)
  // --------------------------------------------------------------------------
  const renderProcessNode = (props: {
    stageNumber: number;
    stageId: string;
    code: string;
    titleAr: string;
    titleEn: string;
    descAr: string;
    descEn: string;
    accentColor: string;
    stationCount: number;
    icon: React.ReactNode;
  }) => {
    const stats = getStageRecordStats(props.stageId);
    const trackStyle = getStageTrackingStyle(props.stageNumber, 'border-cyan-500/40');

    // Dynamic Simulation Highlighting for this Node
    const isNodeSimActive = simulationActive && (
      (simulationType === 'pass' && (
        (simulationStep === 1 && props.stageNumber === 1) ||
        (simulationStep === 3 && props.stageNumber === 2) ||
        (simulationStep === 5 && props.stageNumber === 4)
      )) ||
      (simulationType === 'fail' && (
        (simulationStep === 1 && props.stageNumber === 1) ||
        (simulationStep === 4 && props.stageNumber === 3) ||
        (simulationStep === 5 && props.stageNumber === 3) ||
        (simulationStep === 6 && props.stageNumber === 3)
      ))
    );

    return (
      <div
        id={props.stageId}
        onClick={() => setActiveStageDrawer({
          stageNumber: props.stageNumber,
          stageId: props.stageId
        })}
        className={`relative w-full max-w-2xl mx-auto p-4 sm:p-5 rounded-3xl bg-slate-900/90 border-2 transition-all cursor-pointer group shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] ${
          isNodeSimActive 
            ? (simulationType === 'pass'
                ? 'ring-4 ring-emerald-400 border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.5)] animate-pulse'
                : 'ring-4 ring-rose-500 border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.6)] animate-pulse')
            : ''
        }`}
        style={{
          borderColor: isNodeSimActive ? undefined : `${props.accentColor}70`,
          boxShadow: `0 4px 25px ${props.accentColor}20`
        }}
      >
        {/* Floating Moving Lot Simulation Badge */}
        {isNodeSimActive && (
          <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-xl animate-bounce z-20">
            <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
            <span>{isAr ? currentSimStepInfo.badgeLabelAr : currentSimStepInfo.badgeLabelEn}</span>
            <span className="font-mono bg-slate-950 text-cyan-300 px-1.5 py-0.2 rounded text-[10px]">
              {simulationType === 'pass' ? 'LOT-2026-PASS' : 'LOT-2026-FAIL'}
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 shadow-inner"
              style={{
                backgroundColor: `${props.accentColor}20`,
                borderColor: props.accentColor,
                color: props.accentColor
              }}
            >
              {props.icon}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-black border"
                  style={{
                    backgroundColor: `${props.accentColor}15`,
                    color: props.accentColor,
                    borderColor: `${props.accentColor}40`
                  }}
                >
                  STAGE 0${props.stageNumber}
                </span>
                <span className="text-xs text-slate-400 font-mono font-bold">
                  {props.code}
                </span>
                <span className="text-[11px] text-slate-400 bg-black/40 px-2 py-0.5 rounded-md border border-white/5 font-mono">
                  {props.stationCount} {isAr ? 'محطات' : 'stations'}
                </span>
                {trackStyle.badge}
              </div>

              <h3 className="text-sm sm:text-base font-black text-white mt-1 group-hover:text-cyan-300 transition-colors">
                {isAr ? props.titleAr : props.titleEn}
              </h3>

              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                {isAr ? props.descAr : props.descEn}
              </p>
            </div>
          </div>

          {/* Quick Metrics and Action Pill - Two Separated Boxes with Explicit Directional Arrows */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
            {/* Separate Pass Box with Pass Arrow */}
            <div 
              className="px-2.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-black flex items-center gap-1.5 shadow-sm"
              title={isAr ? 'عدد السجلات المطابقة المقبولة وسهم الإجازة (Pass)' : 'Conforming Pass Records & Arrow'}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{stats.pass}</span>
              <span className="text-[10px] font-sans font-bold text-emerald-400/80">{isAr ? 'مقبول' : 'Pass'}</span>
              <span className="px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono flex items-center gap-0.5" title={isAr ? 'سهم الإجازة للإنتاج' : 'Pass Flow Arrow'}>
                <ArrowDown className="w-2.5 h-2.5 text-emerald-400" />
              </span>
            </div>

            {/* Separate Fail Box with Fail Arrow */}
            <div 
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-black flex items-center gap-1.5 shadow-sm ${
                stats.fail > 0
                  ? 'bg-rose-950/70 border-rose-500/50 text-rose-300'
                  : 'bg-black/40 border-slate-700/40 text-slate-500'
              }`}
              title={isAr ? 'عدد السجلات المرفوضة والمحجوزة وسهم التحويل لـ NCR (Fail)' : 'Non-Conforming Fail Records & Arrow'}
            >
              <AlertOctagon className={`w-3.5 h-3.5 shrink-0 ${stats.fail > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
              <span>{stats.fail}</span>
              <span className={`text-[10px] font-sans font-bold ${stats.fail > 0 ? 'text-rose-400/80' : 'text-slate-500'}`}>
                {isAr ? 'مرفوض' : 'Fail'}
              </span>
              <span className={`px-1 py-0.5 rounded text-[10px] font-mono flex items-center gap-0.5 ${
                stats.fail > 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-black/30 text-slate-500'
              }`} title={isAr ? 'سهم الحجز للـ NCR' : 'Quarantine Arrow'}>
                <ArrowUpRight className="w-2.5 h-2.5" />
              </span>
            </div>

            <button
              type="button"
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 hover:text-white border border-white/10 text-xs font-bold transition-all flex items-center gap-1.5 group-hover:bg-cyan-500 group-hover:text-slate-950 group-hover:border-cyan-400"
            >
              <span>{isAr ? 'التفاصيل 👁️' : 'Details 👁️'}</span>
              <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Clean Decision Gateway with explicit 🟢 PASS ⬇️ vs 🛑 FAIL ➡️ branching
  const renderVisualDecisionGateway = (props: {
    gateNumber: number;
    questionAr: string;
    questionEn: string;
    accentColor: string;
    nextStageNumber: number;
    passCount: number;
    failCount: number;
    failTitleAr: string;
    failTitleEn: string;
    failTargetAction: () => void;
  }) => {
    // Dynamic Simulation Gateway Active Check
    const isSimAtGate = simulationActive && (
      (simulationType === 'pass' && (
        (simulationStep === 2 && props.gateNumber === 1) ||
        (simulationStep === 4 && props.gateNumber === 2) ||
        (simulationStep === 6 && props.gateNumber === 4)
      )) ||
      (simulationType === 'fail' && (
        (simulationStep === 2 && props.gateNumber === 1) ||
        (simulationStep === 3 && props.gateNumber === 1)
      ))
    );

    const isPassBranchSim = isSimAtGate && simulationType === 'pass';
    const isFailBranchSim = isSimAtGate && simulationType === 'fail';

    return (
      <div id={`GATEWAY-${props.gateNumber}`} className="my-5 w-full max-w-3xl mx-auto flex flex-col items-center">
        {/* Downward Pipe into Gateway */}
        <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: props.accentColor }} />

        {/* Diamond Header Banner Box */}
        <div
          className={`relative w-full p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-slate-900 via-[#0a1122] to-slate-950 border-2 shadow-xl transition-all ${
            isSimAtGate ? 'ring-2 ring-amber-400/80 shadow-2xl' : ''
          }`}
          style={{ borderColor: `${props.accentColor}60` }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm rotate-45 border-2 shrink-0 shadow-md"
                style={{
                  backgroundColor: `${props.accentColor}20`,
                  borderColor: props.accentColor,
                  color: props.accentColor
                }}
              >
                <span className="-rotate-45">◆</span>
              </div>
              <div>
                <span
                  className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded border"
                  style={{
                    backgroundColor: `${props.accentColor}15`,
                    color: props.accentColor,
                    borderColor: `${props.accentColor}40`
                  }}
                >
                  {isAr ? `بوابة اتخاذ القرار #${props.gateNumber}` : `Decision Gateway #${props.gateNumber}`}
                </span>
                <h4 className="text-xs sm:text-sm font-black text-white mt-1">
                  {isAr ? props.questionAr : props.questionEn}
                </h4>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
              ISO / IATF
            </span>
          </div>

          {/* TWO SEPARATED DEDICATED PATHWAY BOXES (Pass Box vs Fail Box) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {/* 1. GREEN PASS BOX */}
            <div className={`p-4 rounded-2xl border-2 flex flex-col justify-between shadow-md transition-all ${
              isPassBranchSim 
                ? 'bg-emerald-950/90 border-emerald-400 ring-4 ring-emerald-400 shadow-xl shadow-emerald-500/40 scale-[1.02] animate-pulse'
                : 'bg-emerald-950/40 border-emerald-500/50 hover:border-emerald-400'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isAr ? '🟢 [نعم / YES] — مقبولة' : '🟢 [YES] — Pass'}</span>
                  </span>
                  <span className="font-mono text-xs font-black text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    {props.passCount} {isAr ? 'مجاز' : 'Pass'}
                  </span>
                </div>
                <h5 className="text-xs sm:text-sm font-black text-emerald-300 mt-1">
                  {isAr ? `🟢 نعم (لو مقبولة): تروح للمحطة التالية (المرحلة ${props.nextStageNumber}) ⬇` : `YES (Pass): Advances to Next Station (Stage ${props.nextStageNumber}) ⬇`}
                </h5>
                <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">
                  {isAr ? `الخامة أو اللوط مطابق للمواصفة 100% ➔ تدفق وإجازة مباشرة للأمام` : `100% Conforming lot ➔ Advances directly to production stream`}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs font-bold text-emerald-300">
                <span>{isAr ? `مسار [نعم / YES] ➔ تروح للمحطة التالية ⬇` : `YES Path ➔ Advances to Next Station ⬇`}</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-black flex items-center gap-1 border border-emerald-500/30">
                  <span>إجازة</span>
                  <ArrowDown className={`w-3.5 h-3.5 text-emerald-400 ${isPassBranchSim ? 'animate-bounce' : ''}`} />
                </span>
              </div>
            </div>

            {/* 2. RED FAIL BOX */}
            <div className={`p-4 rounded-2xl border-2 flex flex-col justify-between shadow-md transition-all ${
              isFailBranchSim
                ? 'bg-rose-950/90 border-rose-400 ring-4 ring-rose-500 shadow-xl shadow-rose-500/50 scale-[1.02] animate-pulse'
                : 'bg-rose-950/40 border-rose-500/50 hover:border-rose-400'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 font-black text-xs border border-rose-500/40 flex items-center gap-1.5 shadow-sm">
                    <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{isAr ? '🛑 [لا / NO] — مرفوضة' : '🛑 [NO] — Fail'}</span>
                  </span>
                  <span className="font-mono text-xs font-black text-rose-300 bg-rose-950/80 px-2.5 py-1 rounded-lg border border-rose-500/30">
                    {props.failCount} {isAr ? 'محجوز' : 'Hold'}
                  </span>
                </div>
                <h5 className="text-xs sm:text-sm font-black text-rose-300 mt-1">
                  {isAr ? `🛑 لا (لو مرفوضة): يتعمل بيها NCR وحجز وارتجاع 🛑 ➔` : `NO (Fail): Issue NCR, Quarantine & Return 🛑 ➔`}
                </h5>
                <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">
                  {isAr ? `رُصد عيب أو خلل ➔ عزل فوري، فتح تقرير عدم مطابقة NCR، وتحويل لطريق المرفوضات` : `Defect detected ➔ Instant isolation, NCR issuance & diversion to Rejects Track`}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-rose-500/20">
                <button
                  type="button"
                  onClick={props.failTargetAction}
                  className={`w-full py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer ${
                    isFailBranchSim
                      ? 'bg-rose-500 text-white animate-bounce shadow-lg shadow-rose-500/50'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  <span>{isAr ? `تفريعة [لا / NO] ➔ إصدار NCR وحجز [${props.failTitleAr}] 🛑 ➔` : `[NO Branch] ➔ Issue NCR & Divert to [${props.failTitleEn}] 🛑 ➔`}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* TWO SEPARATED ARROWS IN TWO SEPARATED CONDUIT BOXES */}
        <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 px-1">
          {/* 1. SEPARATE PASS ARROW & EXIT CONDUIT BOX */}
          <div className="flex flex-col items-center">
            {/* Animated Green Flow Pipe & Down Arrow */}
            <div className="flex flex-col items-center">
              <div className="w-2 h-8 rounded-full bg-gradient-to-b from-emerald-500 via-emerald-400 to-emerald-500 relative shadow-md shadow-emerald-500/50">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-300 absolute -top-1 -left-0.5 animate-ping" />
              </div>
              <div className="text-emerald-400 text-base font-black -mt-1.5 animate-bounce">▼</div>
            </div>

            {/* Separate Pass Output Indicator Box */}
            <div className="mt-1 w-full p-3 rounded-2xl bg-gradient-to-r from-emerald-950/70 to-slate-900 border-2 border-emerald-500/50 flex items-center justify-between text-xs shadow-lg shadow-emerald-950/40">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="font-black text-emerald-300 text-xs flex items-center gap-1.5">
                    <span>{isAr ? `مسار [نعم / YES] ➔ تروح للمحطة التالية (${props.nextStageNumber}) ⬇` : `YES Path ➔ Advances to Stage ${props.nextStageNumber} ⬇`}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5">
                    {isAr ? 'إفراج مباشر وصرف سليم للأمام في خط الإنتاج' : 'Approved direct forward flow to next production stage'}
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-black text-xs border border-emerald-500/40 shrink-0">
                {props.passCount} ⬇
              </span>
            </div>
          </div>

          {/* 2. SEPARATE FAIL ARROW & EXIT CONDUIT BOX */}
          <div className="flex flex-col items-center">
            {/* Animated Red Flow Pipe & Down Arrow */}
            <div className="flex flex-col items-center">
              <div className="w-2 h-8 rounded-full bg-gradient-to-b from-rose-500 via-rose-400 to-rose-600 relative shadow-md shadow-rose-500/50">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400 absolute -top-1 -left-0.5 animate-ping" />
              </div>
              <div className="text-rose-400 text-base font-black -mt-1.5 animate-bounce">▼</div>
            </div>

            {/* Separate Fail Output Indicator Box */}
            <button
              type="button"
              onClick={props.failTargetAction}
              className="mt-1 w-full p-3 rounded-2xl bg-gradient-to-r from-rose-950/70 to-slate-900 hover:from-rose-900/80 hover:to-slate-900 border-2 border-rose-500/50 flex items-center justify-between text-xs shadow-lg shadow-rose-950/40 transition-all group/failarrow text-start cursor-pointer hover:scale-[1.01]"
              title={isAr ? 'اضغط لفتح مسار الحجر وتقارير NCR والارتجاع' : 'Click to inspect NCR quarantine & return path'}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <div className="font-black text-rose-300 text-xs flex items-center gap-1.5 group-hover/failarrow:text-rose-200">
                    <span>{isAr ? `تفريعة [لا / NO] ➔ إصدار NCR وحجز وارتجاع 🛑 ➔` : `NO Branch ➔ Issue NCR, Quarantine & Return 🛑 ➔`}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5">
                    {isAr ? `عزل فوري، إصدار تقرير عدم مطابقة، وتحويل لـ [${props.failTitleAr}]` : `Instant isolation, NCR issuance & routing to [${props.failTitleEn}]`}
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 font-mono font-black text-xs border border-rose-500/40 shrink-0 flex items-center gap-1">
                <span>{props.failCount}</span>
                <ArrowUpRight className="w-3 h-3 group-hover/failarrow:translate-x-0.5 transition-transform" />
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Central Resolution Hub Node in Clean Process Diagram
  const renderResolutionHubNode = () => {
    const stats = getStageRecordStats('DEPT-STAGE-RESOLUTION');
    const trackStyle = getStageTrackingStyle(3, 'border-rose-500/60');

    const isSimAtHub = simulationActive && simulationType === 'fail';
    const isStepNcr = isSimAtHub && simulationStep === 4;
    const isStepCapa = isSimAtHub && simulationStep === 5;
    const isStepLoop = isSimAtHub && simulationStep === 6;

    return (
      <div
        id="DEPT-STAGE-RESOLUTION"
        className={`my-6 w-full max-w-2xl mx-auto p-5 rounded-3xl bg-gradient-to-br from-rose-950/60 via-slate-900 to-slate-950 border-2 border-rose-500/60 shadow-2xl space-y-4 ${trackStyle.className} ${
          isSimAtHub ? 'ring-4 ring-rose-500/70 shadow-2xl shadow-rose-950/90' : ''
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-rose-500/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border-2 border-rose-500 text-rose-400 flex items-center justify-center shrink-0 shadow-lg shadow-rose-950/40">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  STAGE 03 • RESOLUTION HUB
                </span>
                {trackStyle.badge}
                {isSimAtHub && (
                  <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white font-mono text-[10px] font-black animate-pulse">
                    ⚡ SIMULATION ACTIVE
                  </span>
                )}
              </div>
              <h3 className="text-base font-black text-rose-400 mt-1">
                {isAr ? 'المرحلة 3: مركز احتواء عدم المطابقة وحل المشكلات (NCR / 8D / CAPA)' : 'Stage 3: Problem Solving, NCR & Corrective Actions'}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {isAr 
                  ? 'يستقبل المرفوض من بوابات القرار (1، 2، 4) للعزل والتحقيق الجذري وإعادة التدوير' 
                  : 'Central receiving hub for rejections from Gateways 1, 2, 4 for 8D root-cause'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveStageDrawer({ stageNumber: 3, stageId: 'DEPT-STAGE-RESOLUTION' })}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0"
          >
            <span>{isAr ? 'عرض الكروت الخمسة 👁️' : 'View 5 Tabs 👁️'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 5 Resolution Stations Quick Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div 
            onClick={() => navigate('/ncr')} 
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all ${
              isStepNcr
                ? 'bg-rose-900/80 border-rose-400 ring-4 ring-rose-400 shadow-xl shadow-rose-500/50 scale-105 animate-pulse'
                : 'bg-black/40 border-rose-500/30 hover:border-rose-400 hover:bg-rose-950/30'
            }`}
          >
            <span className="block font-black text-rose-300 text-xs">NCR-01</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{isAr ? 'عدم مطابقة' : 'Reports'}</span>
          </div>
          <div 
            onClick={() => navigate('/d8')} 
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all ${
              isStepNcr
                ? 'bg-rose-900/80 border-rose-400 ring-4 ring-rose-400 shadow-xl shadow-rose-500/50 scale-105 animate-pulse'
                : 'bg-black/40 border-rose-500/30 hover:border-rose-400 hover:bg-rose-950/30'
            }`}
          >
            <span className="block font-black text-rose-300 text-xs">D8-01</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{isAr ? 'مشاريع 8D' : '8D Projects'}</span>
          </div>
          <div 
            onClick={() => navigate('/capa')} 
            className={`p-2.5 rounded-2xl border cursor-pointer transition-all ${
              isStepCapa
                ? 'bg-rose-900/80 border-rose-400 ring-4 ring-rose-400 shadow-xl shadow-rose-500/50 scale-105 animate-pulse'
                : 'bg-black/40 border-rose-500/30 hover:border-rose-400 hover:bg-rose-950/30'
            }`}
          >
            <span className="block font-black text-rose-300 text-xs">CAPA-01</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{isAr ? 'إجراءات تصحيح' : 'Actions'}</span>
          </div>
          <div 
            onClick={() => navigate('/deviation')} 
            className="p-2.5 rounded-2xl bg-black/40 border border-rose-500/30 hover:border-rose-400 hover:bg-rose-950/30 cursor-pointer transition-all"
          >
            <span className="block font-black text-rose-300 text-xs">DEV-01</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{isAr ? 'تصاريح حيود' : 'Deviations'}</span>
          </div>
          <div 
            onClick={() => navigate('/change-control')} 
            className="p-2.5 rounded-2xl bg-black/40 border border-rose-500/30 hover:border-rose-400 hover:bg-rose-950/30 cursor-pointer transition-all col-span-2 sm:col-span-1"
          >
            <span className="block font-black text-rose-300 text-xs">CHG-01</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{isAr ? 'ضبط التغيير' : 'Change Ctrl'}</span>
          </div>
        </div>

        {/* Closed-loop Re-injection Card with Glowing Green Return Arrow */}
        <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs transition-all ${
          isStepLoop
            ? 'bg-emerald-950/90 border-emerald-400 ring-4 ring-emerald-400 shadow-2xl shadow-emerald-500/60 scale-[1.02] animate-pulse'
            : 'bg-emerald-950/30 border-emerald-500/40'
        }`}>
          <div className="flex items-center gap-2.5">
            <RotateCcw className={`w-5 h-5 text-emerald-400 shrink-0 ${isStepLoop ? 'animate-spin' : ''}`} />
            <div>
              <span className="font-black text-emerald-300 block">
                {isAr ? '🔄 دورة الجودة المغلقة: سهم العودة للإنتاج' : 'Closed-Loop Production Return Loop'}
              </span>
              <span className="text-[11px] text-slate-400">
                {isAr ? 'بعد إغلاق الـ CAPA وفك الحجر عبر لجنة MRB، تعود الشحنات للإنتاج في المرحلة 2' : 'Upon CAPA closure & MRB release, lots return to Stage 2 production'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => scrollToStage('DEPT-STAGE-INPROCESS', true)}
            className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 active:scale-95 ${
              isStepLoop
                ? 'bg-emerald-400 text-slate-950 font-black animate-bounce shadow-xl shadow-emerald-400/50'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black'
            }`}
          >
            <span>{isStepLoop ? (isAr ? '🚀 ضخ بالإنتاج الآن! ⤴' : 'Reinjecting to Stage 2! ⤴') : (isAr ? 'ضخ بالإنتاج (المرحلة 2) ⤴' : 'Return to Stage 2 ⤴')}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  // THE FULL CLEAN PROCESS DIAGRAM FLOW - UNIFIED INDUSTRIAL FLOWCHART WITH EXPLICIT YES / NO GATEWAYS
  const renderCleanProcessDiagram = () => (
    <div className="w-full max-w-4xl mx-auto space-y-4 py-4">
      {/* Integrated Process Diagram Header Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-2 border-cyan-500/40 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
            <Workflow className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono font-black text-xs border border-cyan-500/40">
                INTEGRATED PROCESS FLOWCHART
              </span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
              {isAr ? '🗺️ خريطة العمليات الموحدة: مسار التدفق الصناعي وقرارات (YES / NO)' : 'Integrated Process Flowchart: Industrial Stream & YES/NO Gates'}
            </h3>
            <p className="text-xs text-slate-300">
              {isAr 
                ? 'الخامة تدخل وتتفحص ➔ لو [نعم / YES] تروح للمحطة التالية ⬇ | لو [لا / NO] تخرج فوراً لـ NCR وحجز وارتجاع 🛑 ➔' 
                : 'Incoming material inspected ➔ [YES] flows down to next station ⬇ | [NO] branches to NCR, quarantine & return 🛑 ➔'}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
            {globalFactoryStats.pass} {isAr ? 'مجاز' : 'Pass'}
          </span>
          <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 font-mono text-xs font-bold border border-rose-500/30">
            {globalFactoryStats.fail} {isAr ? 'حجز نشط' : 'Holds'}
          </span>
        </div>
      </div>

      {/* Start Terminal: Material Inflow */}
      {renderStartTerminal()}

      {/* STAGE 1: IQC */}
      {renderProcessNode({
        stageNumber: 1,
        stageId: 'DEPT-STAGE-INCOMING',
        code: 'IQC-01',
        titleAr: 'المرحلة 1: استلام وتفتيش الخامات والموردين (IQC)',
        titleEn: 'Stage 1: Incoming & Supplier Quality (IQC)',
        descAr: 'تفتيش الشحنات الواردة، تقييم الموردين، وتحليل شهادات التحليل COA',
        descEn: 'Receiving inspection, supplier scorecards & COA verification',
        accentColor: '#f59e0b',
        stationCount: 3,
        icon: <Truck className="w-5 h-5" />
      })}

      {/* GATEWAY 1 */}
      {renderVisualDecisionGateway({
        gateNumber: 1,
        questionAr: 'هل المواد الخام والشحنات الواردة مقبولة ومطابقة للمواصفات وخطط الفحص؟',
        questionEn: 'Are incoming raw materials compliant with quality specs & receiving plans?',
        accentColor: '#f59e0b',
        nextStageNumber: 2,
        passCount: getStageRecordStats('DEPT-STAGE-INCOMING').pass,
        failCount: getStageRecordStats('DEPT-STAGE-INCOMING').fail,
        failTitleAr: 'رصيف حجر الخامات QRN-01 وارتجاع المورد',
        failTitleEn: 'Quarantine Dock QRN-01 & Supplier Return',
        failTargetAction: () => {
          scrollToStage('LANE-RED-QUARANTINE-IQC', true);
        }
      })}

      {/* DEDICATED INLINE REJECTION DOCK FOR GATE 1 (تفريعة لا / NO) */}
      <div className="w-full max-w-3xl mx-auto -mt-2 mb-3 p-4 sm:p-5 rounded-3xl bg-slate-900/95 border-2 border-dashed border-rose-500/60 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-rose-500/20">
          <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 font-mono font-black text-xs border border-rose-500/40 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span>{isAr ? '🛑 تفريعة [لا / NO]: رصيف حجر الوارد (QRN-01) وإصدار تقرير عدم مطابقة (NCR) وارتجاع للمورد' : '🛑 [NO Branch]: Raw Materials Quarantine (QRN-01), NCR & Supplier Return'}</span>
          </span>
          <span className="text-xs text-rose-300 font-mono font-black">
            {getStageRecordStats('DEPT-STAGE-INCOMING').fail} {isAr ? 'حجز نشط' : 'Held'}
          </span>
        </div>
        {renderRawQuarantineDock()}
      </div>

      {/* CONFORMING MATERIAL FORWARD FLOW CONNECTOR (مسار نعم / YES) */}
      <div className="flex flex-col items-center my-3">
        <div className="px-4 py-1.5 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-300 text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-950/40">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{isAr ? '⬇ مسار [نعم / YES]: انتقال الخامات المقبولة إلى صالة الإنتاج والتصنيع (المرحلة 2)' : '⬇ [YES Branch]: Conforming Raw Materials Advance to In-Process (Stage 2)'}</span>
          <ArrowDown className="w-4 h-4 text-emerald-400 animate-bounce" />
        </div>
        <div className="w-1.5 h-6 bg-gradient-to-b from-emerald-500 via-teal-500 to-cyan-500 rounded-full" />
      </div>

      {/* STAGE 2: IPQC */}
      {renderProcessNode({
        stageNumber: 2,
        stageId: 'DEPT-STAGE-INPROCESS',
        code: 'IPQC-01',
        titleAr: 'المرحلة 2: جودة صالة الإنتاج والتحكم الإحصائي (IPQC)',
        titleEn: 'Stage 2: In-Process Quality & SPC (IPQC)',
        descAr: 'تسجيل صالة الإنتاج، قائمة العيوب اليومية، كارتات ضبط SPC، وبوابات الخلوص',
        descEn: 'Shopfloor fast entry, daily defect logs, SPC control charts & clearance gates',
        accentColor: '#06b6d4',
        stationCount: 4,
        icon: <Activity className="w-5 h-5" />
      })}

      {/* GATEWAY 2 */}
      {renderVisualDecisionGateway({
        gateNumber: 2,
        questionAr: 'هل عينات التشغيل والقياسات مقبولة وضمن حدود ضبط SPC وخالية من العيوب الحرجة؟',
        questionEn: 'Are in-process samples within SPC control limits & free of critical defects?',
        accentColor: '#06b6d4',
        nextStageNumber: 4,
        passCount: getStageRecordStats('DEPT-STAGE-INPROCESS').pass,
        failCount: getStageRecordStats('DEPT-STAGE-INPROCESS').fail,
        failTitleAr: 'المرحلة 3: مركز تقارير عدم المطابقة NCR والتحقيق 8D',
        failTitleEn: 'Stage 3: NCR & 8D Problem Solving Hub',
        failTargetAction: () => {
          scrollToStage('DEPT-STAGE-RESOLUTION', true);
        }
      })}

      {/* DEDICATED INLINE REJECTION DOCK FOR GATE 2 (تفريعة لا / NO) */}
      <div className="w-full max-w-3xl mx-auto -mt-2 mb-3 p-4 sm:p-5 rounded-3xl bg-slate-900/95 border-2 border-dashed border-rose-500/60 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-rose-500/20">
          <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 font-mono font-black text-xs border border-rose-500/40 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span>{isAr ? '🛑 تفريعة [لا / NO]: المرحلة 3 - مركز تقارير عدم المطابقة (NCR)، عزل الخط، وتحقيق 8D / CAPA' : '🛑 [NO Branch]: Stage 3 - NCR Resolution Hub, Containment & 8D / CAPA'}</span>
          </span>
          <span className="text-xs text-rose-300 font-mono font-black">
            {getStageRecordStats('DEPT-STAGE-RESOLUTION').fail} {isAr ? 'حالة نشطة' : 'Active'}
          </span>
        </div>
        {renderResolutionHubNode()}
      </div>

      {/* CONFORMING MATERIAL FORWARD FLOW CONNECTOR (مسار نعم / YES) */}
      <div className="flex flex-col items-center my-3">
        <div className="px-4 py-1.5 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-300 text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-950/40">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{isAr ? '⬇ مسار [نعم / YES]: انتقال المنتجات المقبولة إلى التفتيش النهائي (المرحلة 4)' : '⬇ [YES Branch]: Conforming Parts Advance to Final Inspection (Stage 4)'}</span>
          <ArrowDown className="w-4 h-4 text-emerald-400 animate-bounce" />
        </div>
        <div className="w-1.5 h-6 bg-gradient-to-b from-cyan-500 via-emerald-500 to-emerald-400 rounded-full" />
      </div>

      {/* STAGE 4: OQC */}
      {renderProcessNode({
        stageNumber: 4,
        stageId: 'DEPT-STAGE-OUTGOING',
        code: 'OQC-01',
        titleAr: 'المرحلة 4: فحص وخروج المنتج النهائي (OQC)',
        titleEn: 'Stage 4: Outgoing Quality & Release (OQC)',
        descAr: 'فحص عينات القبول AQL للشحنات التامة الصنع قبل التحميل وإصدار شهادات المطابقة COC',
        descEn: 'Pre-shipment AQL sampling, COC certificates & final release authorization',
        accentColor: '#10b981',
        stationCount: 1,
        icon: <PackageCheck className="w-5 h-5" />
      })}

      {/* GATEWAY 4 */}
      {renderVisualDecisionGateway({
        gateNumber: 4,
        questionAr: 'هل شحنة المنتج التام مقبولة ومطابقة لمعايير قبول عينات AQL؟',
        questionEn: 'Are finished goods lots fully compliant with AQL acceptance criteria?',
        accentColor: '#10b981',
        nextStageNumber: 5,
        passCount: getStageRecordStats('DEPT-STAGE-OUTGOING').pass,
        failCount: getStageRecordStats('DEPT-STAGE-OUTGOING').fail,
        failTitleAr: 'رصيف حجر المنتج النهائي ولجنة MRB',
        failTitleEn: 'Finished Goods Quarantine & MRB',
        failTargetAction: () => {
          scrollToStage('LANE-RED-QUARANTINE-OQC', true);
        }
      })}

      {/* DEDICATED INLINE REJECTION DOCK FOR GATE 4 (تفريعة لا / NO) */}
      <div className="w-full max-w-3xl mx-auto -mt-2 mb-3 p-4 sm:p-5 rounded-3xl bg-slate-900/95 border-2 border-dashed border-rose-500/60 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-rose-500/20">
          <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 font-mono font-black text-xs border border-rose-500/40 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span>{isAr ? '🛑 تفريعة [لا / NO]: رصيف حجر المنتج النهائي (QRN-04) ولجنة مراجعة المواد MRB (فرز/تكهين)' : '🛑 [NO Branch]: Finished Goods Quarantine (QRN-04) & MRB Disposition'}</span>
          </span>
          <span className="text-xs text-rose-300 font-mono font-black">
            {getStageRecordStats('DEPT-STAGE-OUTGOING').fail} {isAr ? 'محجوز' : 'Held'}
          </span>
        </div>
        {renderFinishedQuarantineDock()}
      </div>

      {/* CONFORMING MATERIAL FORWARD FLOW CONNECTOR (مسار نعم / YES) */}
      <div className="flex flex-col items-center my-3">
        <div className="px-4 py-1.5 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-300 text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-950/40">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{isAr ? '⬇ مسار [نعم / YES]: إجازة الشحن والتسليم للمستودعات والعملاء (المرحلة 5)' : '⬇ [YES Branch]: Final Clearance to Logistics & Customer Delivery (Stage 5)'}</span>
          <ArrowDown className="w-4 h-4 text-emerald-400 animate-bounce" />
        </div>
        <div className="w-1.5 h-6 bg-gradient-to-b from-emerald-500 to-indigo-500 rounded-full" />
      </div>

      {/* STAGE 5: CUSTOMER QA */}
      {renderProcessNode({
        stageNumber: 5,
        stageId: 'DEPT-STAGE-CUSTOMER',
        code: 'CSM-01',
        titleAr: 'المرحلة 5: شكاوى العملاء والميدان (Customer Quality)',
        titleEn: 'Stage 5: Customer Complaints & Field QA',
        descAr: 'استقبال بلاغات العملاء ومطالبات الضمان ومرتجعات RMA وتحويل الملاحظات للهندسة',
        descEn: 'Customer claims, warranty returns RMA & field feedback loops',
        accentColor: '#6366f1',
        stationCount: 1,
        icon: <Users className="w-5 h-5" />
      })}

      {/* GATEWAY 5 */}
      {renderVisualDecisionGateway({
        gateNumber: 5,
        questionAr: 'هل تسليمات المنتجات للعملاء مقبولة وبدون بلاغات أو شكاوى جودة أو مطالبات ضمان؟',
        questionEn: 'Are customer deliveries accepted without warranty claims or field defects?',
        accentColor: '#6366f1',
        nextStageNumber: 6,
        passCount: getStageRecordStats('DEPT-STAGE-CUSTOMER').pass,
        failCount: getStageRecordStats('DEPT-STAGE-CUSTOMER').fail,
        failTitleAr: 'مركز تسوية مرتجعات الضمان RMA',
        failTitleEn: 'Warranty Returns RMA Center',
        failTargetAction: () => {
          scrollToStage('LANE-RED-RETURNS-RMA', true);
        }
      })}

      {/* DEDICATED INLINE REJECTION DOCK FOR GATE 5 (تفريعة لا / NO) */}
      <div className="w-full max-w-3xl mx-auto -mt-2 mb-3 p-4 sm:p-5 rounded-3xl bg-slate-900/95 border-2 border-dashed border-rose-500/60 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-rose-500/20">
          <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 font-mono font-black text-xs border border-rose-500/40 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span>{isAr ? '🛑 تفريعة [لا / NO]: مركز تسوية مرتجعات الضمان (RMA) واستخلاص الأسباب الجذرية لـ FMEA' : '🛑 [NO Branch]: Warranty Returns RMA Center & Root-Cause'}</span>
          </span>
          <span className="text-xs text-rose-300 font-mono font-black">
            {getStageRecordStats('DEPT-STAGE-CUSTOMER').fail} {isAr ? 'مرتجع' : 'RMA'}
          </span>
        </div>
        {renderReturnsQuarantineDock()}
      </div>

      {/* CONFORMING MATERIAL FORWARD FLOW CONNECTOR (مسار نعم / YES) */}
      <div className="flex flex-col items-center my-3">
        <div className="px-4 py-1.5 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-300 text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-950/40">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{isAr ? '⬇ مسار [نعم / YES]: استمرار التدفق إلى المختبر الهندسي واعتماد البيانات' : '⬇ [YES Branch]: Continue to Engineering Lab & Master Data'}</span>
          <ArrowDown className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
        </div>
        <div className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
      </div>

      {/* STAGE 6: LAB & AUDITS */}
      {renderProcessNode({
        stageNumber: 6,
        stageId: 'DEPT-STAGE-COMPLIANCE',
        code: 'LAB-01',
        titleAr: 'المرحلة 6: المختبر الهندسي والتدقيق (Lab & Audits)',
        titleEn: 'Stage 6: Engineering Lab & Audits',
        descAr: 'خطط التحكم Control Plan، تحليل المخاطر FMEA، معايرة الأجهزة MSA، والتدقيق الداخلي',
        descEn: 'Control Plans, FMEA risk analysis, gage calibration MSA & ISO audits',
        accentColor: '#a855f7',
        stationCount: 5,
        icon: <ShieldCheck className="w-5 h-5" />
      })}

      <div className="flex flex-col items-center my-3">
        {renderFlowPipe('#3b82f6', 'تحديث وثائق النظام والبيانات', 'Update Master Data')}
      </div>

      {/* STAGE 7: MASTER DATA */}
      {renderProcessNode({
        stageNumber: 7,
        stageId: 'DEPT-STAGE-SETUP',
        code: 'MST-01',
        titleAr: 'المرحلة 7: تهيئة المصنع والبيانات (Setup & Master Data)',
        titleEn: 'Stage 7: Factory Setup & Master Data',
        descAr: 'البيانات الرئيسية للأجزاء والموديلات، مصمم نماذج الفحص، وقاعدة الدروس المستفادة',
        descEn: 'Parts catalog, form designer & lessons learned repository',
        accentColor: '#3b82f6',
        stationCount: 3,
        icon: <Database className="w-5 h-5" />
      })}

      {/* FEEDBACK LOOP BANNER */}
      <div className="pt-2">
        {renderClosedLoopFeedbackBanner()}
      </div>

      {/* END TERMINAL */}
      {renderEndTerminal()}
    </div>
  );

  // Interactive Slide-Over Drawer / Modal for Full Stage Details
  const renderStageDrawer = () => {
    if (!activeStageDrawer) return null;
    const stageNum = activeStageDrawer.stageNumber;

    return (
      <div 
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
        onClick={() => setActiveStageDrawer(null)}
      >
        <div 
          className="w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-start animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-inner font-mono font-black text-sm">
                0${stageNum}
              </span>
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  {isAr ? `استعراض سجلات ومحطات المرحلة #${stageNum}` : `Stage #${stageNum} Detailed Records`}
                </span>
                <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                  {isAr 
                    ? ENTERPRISE_DEPARTMENTS.find(d => d.number === stageNum)?.nameAr 
                    : ENTERPRISE_DEPARTMENTS.find(d => d.number === stageNum)?.nameEn}
                </h3>
              </div>
            </div>

            <button
              onClick={() => setActiveStageDrawer(null)}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-white/10"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
            {stageNum === 1 && renderStage1()}
            {stageNum === 2 && renderStage2()}
            {stageNum === 3 && renderStage3()}
            {stageNum === 4 && renderStage4()}
            {stageNum === 5 && renderStage5()}
            {stageNum === 6 && renderStage6()}
            {stageNum === 7 && renderStage7()}
          </div>

          {/* Drawer Footer */}
          <div className="p-3 sm:px-6 bg-slate-950 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <span>
              {isAr ? '💡 يمكنك الضغط على أي كارت بالداخل لفتح شاشته المباشرة' : 'Click any card inside to open its module'}
            </span>
            <button
              onClick={() => setActiveStageDrawer(null)}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
            >
              {isAr ? 'إغلاق النافذة' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // INTERACTIVE LIVE MATERIAL FLOW SIMULATION CONTROLLER (HUD)
  // =========================================================================
  const renderSimulationPlayerHud = () => {
    const maxStep = simulationSteps.length - 1;
    const isFinished = simulationStep >= maxStep;

    return (
      <div className="w-full max-w-6xl mx-auto my-3 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-[#0c1427] to-slate-900 border-2 border-amber-500/60 shadow-2xl shadow-amber-950/50 space-y-3.5 animate-in fade-in slide-in-from-top-4 duration-300">
        {/* Top Row: Title, Scenario Switcher, Close */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/30 shrink-0">
              <Play className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-black text-xs border border-amber-500/40">
                  LIVE FLOW SIMULATOR
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              </div>
              <h3 className="text-sm sm:text-base font-black text-white mt-0.5">
                {isAr ? '🎮 محاكاة تدفق الشحنات والعينات الحية عبر مسار الجودة' : 'Live Material Flow & Lot Inspection Simulator'}
              </h3>
            </div>
          </div>

          {/* Scenario Toggle (Pass vs Defect & Quarantine) */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setSimulationType('pass');
                  setSimulationStep(0);
                  setSimulationPaused(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  simulationType === 'pass'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 scale-105'
                    : 'text-slate-400 hover:text-emerald-300'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isAr ? '🟢 شحنة مطابقة (Pass Stream)' : 'Conforming Lot (Pass)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSimulationType('fail');
                  setSimulationStep(0);
                  setSimulationPaused(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  simulationType === 'fail'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-105'
                    : 'text-slate-400 hover:text-rose-300'
                }`}
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>{isAr ? '🛑 شحنة معيبة وحجر (Fail & Quarantine)' : 'Defect & Quarantine (Fail)'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setSimulationActive(false);
                setSimulationStep(0);
              }}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 flex items-center justify-center transition-colors"
              title={isAr ? 'إغلاق المحاكاة' : 'Close Simulation'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Controls: Play/Pause, Reset, Speed, Step Nav */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-black/40 p-3 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Play / Pause */}
            <button
              type="button"
              onClick={() => setSimulationPaused(prev => !prev)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            >
              {simulationPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>{isAr ? 'استئناف الحركة ▶' : 'Resume ▶'}</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 fill-slate-950" />
                  <span>{isAr ? 'إيقاف مؤقت ⏸' : 'Pause ⏸'}</span>
                </>
              )}
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={() => {
                setSimulationStep(0);
                setSimulationPaused(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-white/10 active:scale-95 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isAr ? 'إعادة للبداية ↺' : 'Restart ↺'}</span>
            </button>

            {/* Step Navigation */}
            <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-xl border border-white/10">
              <button
                type="button"
                disabled={simulationStep === 0}
                onClick={() => {
                  setSimulationStep(prev => Math.max(0, prev - 1));
                  setSimulationPaused(true);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
              >
                {isAr ? '◀ السابق' : '◀ Prev'}
              </button>
              <span className="text-[11px] font-mono font-bold text-amber-300 px-1">
                {simulationStep + 1} / {simulationSteps.length}
              </span>
              <button
                type="button"
                disabled={simulationStep >= maxStep}
                onClick={() => {
                  setSimulationStep(prev => Math.min(maxStep, prev + 1));
                  setSimulationPaused(true);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
              >
                {isAr ? 'التالي ▶' : 'Next ▶'}
              </button>
            </div>
          </div>

          {/* Speed Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">
              {isAr ? 'سرعة التدفق:' : 'Flow Speed:'}
            </span>
            <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setSimulationSpeed(1)}
                className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all ${
                  simulationSpeed === 1 ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                1x {isAr ? '(طبيعي)' : '(Normal)'}
              </button>
              <button
                type="button"
                onClick={() => setSimulationSpeed(2)}
                className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all ${
                  simulationSpeed === 2 ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                2x {isAr ? '(سريع)' : '(Fast)'}
              </button>
            </div>
          </div>
        </div>

        {/* Step Breadcrumbs Tracker */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {simulationSteps.map((step, idx) => {
            const isPassed = idx < simulationStep;
            const isCurrent = idx === simulationStep;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  setSimulationStep(idx);
                  setSimulationPaused(true);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                  isCurrent
                    ? simulationType === 'pass'
                      ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 shadow-lg shadow-emerald-500/40 font-black scale-105'
                      : 'bg-rose-500 text-white ring-2 ring-rose-300 shadow-lg shadow-rose-500/40 font-black scale-105'
                    : isPassed
                    ? 'bg-slate-800 text-slate-300 border border-emerald-500/40'
                    : 'bg-black/40 text-slate-500 border border-white/5 opacity-60 hover:opacity-100'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                  isCurrent ? 'bg-black/30 text-white' : isPassed ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isPassed ? '✓' : idx + 1}
                </span>
                <span>{isAr ? step.badgeLabelAr : step.badgeLabelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Live Narrative Action Box */}
        <div className={`p-4 rounded-2xl border transition-all ${
          simulationType === 'pass' 
            ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border-emerald-500/40'
            : 'bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/40 border-rose-500/40'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/40 text-amber-300 border border-amber-500/30">
                {simulationType === 'pass' ? 'LOT-2026-PASS-01' : 'LOT-2026-DEFECT-8D'}
              </span>
              <span className="text-xs font-black text-white">
                {isAr ? currentSimStepInfo.titleAr : currentSimStepInfo.titleEn}
              </span>
            </div>

            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black flex items-center gap-1 ${
              isFinished
                ? 'bg-emerald-500 text-slate-950 animate-bounce'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>{isFinished ? (isAr ? '🎉 اكتمل التدفق' : 'Flow Completed') : (isAr ? 'جاري التنفيذ اللحظي...' : 'Executing...')}</span>
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 mt-2 leading-relaxed">
            {isAr ? currentSimStepInfo.narrativeAr : currentSimStepInfo.narrativeEn}
          </p>

          <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-amber-300">
              <span className="font-bold">{isAr ? 'الإجراء الهندسي المطلوب:' : 'Quality Action:'}</span>
              <span>{isAr ? currentSimStepInfo.actionRequiredAr : currentSimStepInfo.actionRequiredEn}</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
              ISO 9001:2015 §8.5.1
            </span>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // OFFICIAL ISO 9001:2015 & IATF 16949 PROCESS FLOW DIAGRAM (PFD) MODAL
  // =========================================================================
  const renderPfdExportModal = () => {
    if (!isPfdExportOpen) return null;

    return (
      <div 
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 overflow-y-auto"
        onClick={() => setIsPfdExportOpen(false)}
      >
        <div 
          className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-start my-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Toolbar (Non-printable) */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <span className="text-xs font-mono text-blue-400 font-bold">
                  ISO 9001:2015 & IATF 16949 COMPLIANT
                </span>
                <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                  {isAr ? 'وثيقة خريطة تدفق العمليات الهندسية المعتمدة (PFD Document)' : 'Official Process Flow Diagram (PFD) Quality Document'}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
              >
                <Printer className="w-4 h-4 text-slate-950" />
                <span>{isAr ? 'طباعة / حفظ كـ PDF 🖨️' : 'Print / Export PDF 🖨️'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPfdExportOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-white/10"
                title={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Document Body */}
          <div id="pfd-document-printable-area" className="p-6 sm:p-10 bg-slate-950 text-slate-100 overflow-y-auto max-h-[80vh] space-y-6 font-sans">
            {/* Engineering Document Header Block */}
            <div className="border-2 border-slate-700 rounded-2xl p-4 sm:p-6 bg-slate-900/90 shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-slate-700 pb-4 text-center md:text-start">
                <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-slate-700 pb-3 md:pb-0 md:pr-4">
                  <span className="text-xl font-black text-cyan-400 tracking-wider">QMS 4.0</span>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Enterprise Quality</span>
                </div>
                <div className="md:col-span-2 text-center">
                  <h1 className="text-base sm:text-xl font-black text-white">
                    PROCESS FLOW DIAGRAM (PFD)
                  </h1>
                  <h2 className="text-xs sm:text-sm text-cyan-300 font-bold mt-1">
                    خريطة مسار العمليات وبوابات اتخاذ القرار لضمان الجودة
                  </h2>
                  <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono border border-blue-500/40">
                    STANDARD: ISO 9001:2015 Clause 4.4 & 8.5.1 / IATF 16949 Section 8.5
                  </span>
                </div>
                <div className="md:col-span-1 border-t md:border-t-0 md:border-l border-slate-700 pt-3 md:pt-0 md:pl-4 text-xs font-mono space-y-1">
                  <div><span className="text-slate-400">DOC ID:</span> <strong className="text-white">DOC-QMS-PFD-001</strong></div>
                  <div><span className="text-slate-400">REV:</span> <strong className="text-emerald-400">4.2 (ACTIVE)</strong></div>
                  <div><span className="text-slate-400">DATE:</span> <span className="text-slate-300">{new Date().toISOString().split('T')[0]}</span></div>
                  <div><span className="text-slate-400">PAGE:</span> <span className="text-slate-300">1 of 1</span></div>
                </div>
              </div>

              {/* Scope & Plant Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs text-slate-300 font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">{isAr ? 'المنشأة:' : 'Plant:'}</span>
                  <span className="font-bold text-white">Main Manufacturing Facility</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">{isAr ? 'نطاق التطبيق:' : 'Scope:'}</span>
                  <span className="font-bold text-white">Receiving to Dispatch</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">{isAr ? 'حالة التوازن:' : 'Yield Balance:'}</span>
                  <span className="font-bold text-emerald-400">
                    {globalFactoryStats.total > 0 
                      ? `${Math.round((globalFactoryStats.pass / globalFactoryStats.total) * 100)}% Conformance` 
                      : '100% Certified'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">{isAr ? 'حالة الاعتماد:' : 'Approval:'}</span>
                  <span className="font-bold text-cyan-300">Audited & Released</span>
                </div>
              </div>
            </div>

            {/* Plant Live Health Balance Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block">{isAr ? 'إجمالي المحطات المعتمدة' : 'Total Workstations'}</span>
                <span className="text-xl font-black text-cyan-400 font-mono mt-1 block">17 Stations</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block">{isAr ? 'بوابات اتخاذ القرار' : 'Quality Gateways'}</span>
                <span className="text-xl font-black text-amber-400 font-mono mt-1 block">5 Gates</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block">{isAr ? 'الشحنات المطابقة (PASS)' : 'Conforming Lots'}</span>
                <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">{globalFactoryStats.pass} Lots</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block">{isAr ? 'شحنات الحجر المعزولة' : 'Quarantine Lots'}</span>
                <span className="text-xl font-black text-rose-400 font-mono mt-1 block">{globalFactoryStats.fail} Lots</span>
              </div>
            </div>

            {/* Process Flow Matrix (PFD Engineering Table) */}
            <div className="border border-slate-700 rounded-2xl overflow-hidden shadow-lg bg-slate-900/60">
              <div className="bg-slate-800/90 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                  <span>📋</span>
                  <span>{isAr ? 'جدول مصفوفة تدفق العمليات وبوابات الضبط الفني' : 'Process Flow Matrix & Inspection Gates'}</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-400">IATF 16949 §8.5.1</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                      <th className="p-2.5 text-center">#</th>
                      <th className="p-2.5 text-start">{isAr ? 'المرحلة والعملية' : 'Stage / Process'}</th>
                      <th className="p-2.5 text-center">{isAr ? 'كود المحطة' : 'Station Code'}</th>
                      <th className="p-2.5 text-start">{isAr ? 'نوع النشاط' : 'Activity Type'}</th>
                      <th className="p-2.5 text-start">{isAr ? 'معيار بوابة القرار (Acceptance)' : 'Decision Criteria'}</th>
                      <th className="p-2.5 text-start">{isAr ? 'إجراء عدم المطابقة (Diverted)' : 'Non-Conformance'}</th>
                      <th className="p-2.5 text-center">{isAr ? 'الإدارة المسؤولة' : 'Dept'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-2.5 text-center font-bold text-amber-400">01</td>
                      <td className="p-2.5 font-bold text-white">
                        {isAr ? 'استلام وتفتيش المواد الخام (IQC)' : 'Incoming Material Inspection (IQC)'}
                      </td>
                      <td className="p-2.5 text-center font-mono text-amber-300">IQC-01, VDR-01</td>
                      <td className="p-2.5 text-slate-300">{isAr ? 'فحص مخبري وقياس أبعاد' : 'Lab & Dimension Inspection'}</td>
                      <td className="p-2.5 text-emerald-300 font-mono">Gateway 1: Specs & COA</td>
                      <td className="p-2.5 text-rose-300 font-mono">QRN-01 Quarantine & NCR</td>
                      <td className="p-2.5 text-center font-mono text-slate-400">QA / QC</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-2.5 text-center font-bold text-cyan-400">02</td>
                      <td className="p-2.5 font-bold text-white">
                        {isAr ? 'جودة صالة الإنتاج والتحكم الإحصائي (IPQC)' : 'In-Process Quality & SPC (IPQC)'}
                      </td>
                      <td className="p-2.5 text-center font-mono text-cyan-300">SHP-01, DEF-01, SPC-01</td>
                      <td className="p-2.5 text-slate-300">{isAr ? 'تشغيل وتجميع ومراقبة Cpk' : 'Assembly & SPC Monitoring'}</td>
                      <td className="p-2.5 text-emerald-300 font-mono">Gateway 2: SPC Control Limits</td>
                      <td className="p-2.5 text-rose-300 font-mono">Line Stop, 8D Escalation</td>
                      <td className="p-2.5 text-center font-mono text-slate-400">Production / QC</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40 bg-rose-950/20">
                      <td className="p-2.5 text-center font-bold text-rose-400">03</td>
                      <td className="p-2.5 font-bold text-white">
                        {isAr ? 'مركز احتواء عدم المطابقة وحل المشكلات' : 'Containment & CAPA Resolution Hub'}
                      </td>
                      <td className="p-2.5 text-center font-mono text-rose-300">NCR-01, D8-01, CAPA-01</td>
                      <td className="p-2.5 text-slate-300">{isAr ? 'تحقيق جذري 8D وتصحيح CAPA' : '8D Root Cause & MRB Release'}</td>
                      <td className="p-2.5 text-cyan-300 font-mono">MRB Disposition Sign-Off</td>
                      <td className="p-2.5 text-emerald-400 font-mono">Closed-Loop Return to Stage 2 🔄</td>
                      <td className="p-2.5 text-center font-mono text-slate-400">MRB / QA</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-2.5 text-center font-bold text-emerald-400">04</td>
                      <td className="p-2.5 font-bold text-white">
                        {isAr ? 'فحص وخروج المنتج النهائي (OQC)' : 'Outgoing QA & Final Release (OQC)'}
                      </td>
                      <td className="p-2.5 text-center font-mono text-emerald-300">OQC-01</td>
                      <td className="p-2.5 text-slate-300">{isAr ? 'فحص عينات القبول وإصدار COC' : 'Pre-Shipment AQL Audit & COC'}</td>
                      <td className="p-2.5 text-emerald-300 font-mono">Gateway 4: AQL 0.65 Criteria</td>
                      <td className="p-2.5 text-rose-300 font-mono">Hold & 100% Re-screening</td>
                      <td className="p-2.5 text-center font-mono text-slate-400">QA / Logistics</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-2.5 text-center font-bold text-indigo-400">05</td>
                      <td className="p-2.5 font-bold text-white">
                        {isAr ? 'شكاوى العملاء والميدان (Customer QA)' : 'Customer Complaints & RMA (CSM)'}
                      </td>
                      <td className="p-2.5 text-center font-mono text-indigo-300">CSM-01</td>
                      <td className="p-2.5 text-slate-300">{isAr ? 'استقبال بلاغات ومرتجعات RMA' : 'Warranty Claims & RMA Intake'}</td>
                      <td className="p-2.5 text-emerald-300 font-mono">Gateway 5: Settlement & Feedback</td>
                      <td className="p-2.5 text-rose-300 font-mono">Emergency 8D Corrective Action</td>
                      <td className="p-2.5 text-center font-mono text-slate-400">Customer Support</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-2.5 text-center font-bold text-purple-400">06</td>
                      <td className="p-2.5 font-bold text-white">
                        {isAr ? 'المختبر الهندسي والتدقيق (Compliance)' : 'Engineering Metrology & Audits'}
                      </td>
                      <td className="p-2.5 text-center font-mono text-purple-300">CP-01, FMEA-01, MSA-01</td>
                      <td className="p-2.5 text-slate-300">{isAr ? 'معايرة الأجهزة وتحديث FMEA' : 'Gage MSA & FMEA Updates'}</td>
                      <td className="p-2.5 text-slate-300 font-mono">ISO 9001 / IATF Audit Conformance</td>
                      <td className="p-2.5 text-slate-400 font-mono">Internal Audit Finding</td>
                      <td className="p-2.5 text-center font-mono text-slate-400">Metrology / Audit</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-2.5 text-center font-bold text-blue-400">07</td>
                      <td className="p-2.5 font-bold text-white">
                        {isAr ? 'تهيئة المصنع والبيانات (Master Data)' : 'Master Data Setup & Lessons Learned'}
                      </td>
                      <td className="p-2.5 text-center font-mono text-blue-300">PRT-01, MD-01, LES-01</td>
                      <td className="p-2.5 text-slate-300">{isAr ? 'إدارة النماذج والدروس المستفادة' : 'Forms Designer & Repository'}</td>
                      <td className="p-2.5 text-emerald-400 font-mono">Closed-Loop Feed to Stage 1</td>
                      <td className="p-2.5 text-slate-400 font-mono">Document Revision Required</td>
                      <td className="p-2.5 text-center font-mono text-slate-400">Quality Systems</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Formal Approval Signatures Box */}
            <div className="border border-slate-700 rounded-2xl p-4 sm:p-6 bg-slate-900/80">
              <div className="text-xs font-black text-slate-300 uppercase tracking-wider pb-3 border-b border-slate-700">
                {isAr ? 'اعتمادات وثيقة الجودة الهندسية (Document Approval Signatures)' : 'Engineering Quality Document Approvals'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-xs">
                <div className="space-y-1.5 border border-slate-800 p-3 rounded-xl bg-black/30">
                  <span className="text-[10px] text-slate-400 block">{isAr ? 'إعداد مهندس الجودة:' : 'Prepared by (QA Engineer):'}</span>
                  <span className="font-bold text-white block">Eng. Quality Systems Lead</span>
                  <span className="text-[10px] text-emerald-400 font-mono block">✓ E-SIGN VERIFIED</span>
                  <span className="text-[10px] text-slate-500 font-mono block">{new Date().toISOString().split('T')[0]}</span>
                </div>
                <div className="space-y-1.5 border border-slate-800 p-3 rounded-xl bg-black/30">
                  <span className="text-[10px] text-slate-400 block">{isAr ? 'مراجعة مدير ضمان الجودة:' : 'Reviewed by (QA Manager):'}</span>
                  <span className="font-bold text-white block">Quality Assurance Director</span>
                  <span className="text-[10px] text-emerald-400 font-mono block">✓ AUDITED & APPROVED</span>
                  <span className="text-[10px] text-slate-500 font-mono block">{new Date().toISOString().split('T')[0]}</span>
                </div>
                <div className="space-y-1.5 border border-slate-800 p-3 rounded-xl bg-black/30">
                  <span className="text-[10px] text-slate-400 block">{isAr ? 'اعتماد مدير العمليات والمصنع:' : 'Approved by (Plant Director):'}</span>
                  <span className="font-bold text-white block">VP of Manufacturing Operations</span>
                  <span className="text-[10px] text-cyan-400 font-mono block">✓ RELEASE AUTHORIZED</span>
                  <span className="text-[10px] text-slate-500 font-mono block">{new Date().toISOString().split('T')[0]}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>DOC-VERIFY-HASH: 8F2B-901C-A19F-QMS4</span>
                <span>ISO 9001:2015 REGISTERED FACILITY</span>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <span>{isAr ? '💡 يمكنك طباعة هذه الوثيقة كملف PDF معتمد لتقديمه في تدقيقات ISO و IATF' : 'Ready to export as official PDF for ISO / IATF audits'}</span>
            <button
              type="button"
              onClick={() => setIsPfdExportOpen(false)}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    );
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

          {/* Controls: Mode Switcher & Search */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-wrap sm:flex-nowrap">
            {/* Flowchart Architecture Switcher: Dual Swimlanes vs Single Stream */}
            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => setFlowchartViewMode('diagram')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  flowchartViewMode === 'diagram'
                    ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 shadow-md font-black scale-105'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={isAr ? 'خريطة انسيابية تفاعلية هندسية مبسطة وأنيقة (الموصى بها)' : 'Clean Process Diagram (Recommended)'}
              >
                <Workflow className="w-3.5 h-3.5" />
                <span>{isAr ? '🗺️ خريطة العمليات' : 'Process Diagram'}</span>
              </button>
              <button
                type="button"
                onClick={() => setFlowchartViewMode('expanded')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  flowchartViewMode === 'expanded'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={isAr ? 'عرض كافة البطاقات ومحطات الفحص بشكل موسع' : 'Expanded Cards Mode'}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAr ? 'بطاقات موسعة' : 'Expanded'}</span>
              </button>
            </div>

            {/* Card Display Mode Switcher */}
            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10 shrink-0">
              <button
                onClick={() => setCardDisplayMode('clean')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  cardDisplayMode === 'clean'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={isAr ? 'عرض إحصائي متوازن للكروت' : 'Balanced KPI Cards'}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAr ? 'عرض متوازن' : 'Balanced'}</span>
              </button>
              <button
                onClick={() => setCardDisplayMode('compact')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  cardDisplayMode === 'compact'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={isAr ? 'عرض مدمج خفيف للكروت' : 'Compact Cards'}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAr ? 'عرض مدمج' : 'Compact'}</span>
              </button>
            </div>

            {/* Simulation Launcher Button */}
            <button
              type="button"
              onClick={() => {
                setSimulationActive(prev => !prev);
                if (!simulationActive) {
                  setSimulationStep(0);
                  setSimulationPaused(false);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                simulationActive
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/30 font-black animate-pulse'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:border-amber-400'
              }`}
              title={isAr ? 'بدء محاكاة التدفق الحي للشحنات والعينات' : 'Launch Live Material Flow Simulation'}
            >
              <Play className={`w-3.5 h-3.5 ${simulationActive ? 'fill-slate-950 text-slate-950' : 'text-amber-400'}`} />
              <span>{isAr ? (simulationActive ? 'المحاكاة نشطة ⚡' : '🎮 محاكاة التدفق') : (simulationActive ? 'Simulation Active' : 'Simulate Flow')}</span>
            </button>

            {/* Official PFD Document Export Button */}
            <button
              type="button"
              onClick={() => setIsPfdExportOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:border-blue-400"
              title={isAr ? 'تصدير وثيقة خريطة العمليات المعتمدة ISO / IATF' : 'Export Official PFD Document'}
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">{isAr ? 'وثيقة PFD المعتمدة' : 'Official PFD'}</span>
              <span className="sm:hidden">PFD</span>
            </button>

            {/* Search Box */}
            <div className="relative w-full md:w-56 shrink-0">
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
      </div>

      {/* Dynamic Simulation Player HUD */}
      {simulationActive && renderSimulationPlayerHud()}

      {/* 2. ADVANCED LOT & RAW MATERIAL TRACEABILITY SELECTOR BAR */}
      <div id="lot-journey-traceability-bar" className="bg-[#0b1224] border-b-2 border-cyan-500/30 p-4 md:px-8 shadow-2xl">
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
              {allTrackableLots.length === 0 ? (
                <span className="text-xs text-slate-500 py-1">
                  {isAr ? 'لا توجد شحنات مفحوصة مسجلة حالياً — قم بتسجيل فحص استلام جديد في IQC لتتبعه' : 'No inspected lots recorded yet — add receiving inspections in IQC to trace'}
                </span>
              ) : (
                allTrackableLots.map((lot) => {
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
                })
              )}
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
      <div className="max-w-[1440px] mx-auto w-full p-3 sm:p-6 lg:p-8 space-y-5 pb-24">

        {/* GLOBAL FACTORY QUALITY BALANCE STRIP (TOTAL, ACCEPTED, REJECTED) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-2 border-cyan-500/30 shadow-2xl space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>📊 {isAr ? 'ميزان الجودة ومطابقة التسجيلات في المصنع بالكامل:' : 'Plant-Wide Quality & Inspection Balance:'}</span>
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {isAr ? 'مُحدث لحظياً لجميع المراحل الـ 7' : 'Live across all 7 stages'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Records */}
            <div className="p-3 rounded-2xl bg-black/50 border border-white/10 flex flex-col justify-between shadow-sm">
              <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                <span>📋</span>
                <span>{isAr ? 'إجمالي التسجيلات' : 'Total Records'}</span>
              </span>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="font-mono font-black text-2xl text-white">{globalFactoryStats.total}</span>
                <span className="text-xs text-slate-400 font-bold">{isAr ? 'سجل' : 'items'}</span>
              </div>
            </div>

            {/* Total Conforming / Accepted */}
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col justify-between shadow-sm">
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'المقبول والمطابق' : 'Accepted (Pass)'}</span>
              </span>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="font-mono font-black text-2xl text-emerald-400">{globalFactoryStats.pass}</span>
                <span className="font-mono text-xs font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {globalFactoryStats.acceptanceRate}% FPY
                </span>
              </div>
            </div>

            {/* Total Non-Conforming / Quarantined */}
            <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex flex-col justify-between shadow-sm">
              <span className="text-xs text-rose-400 font-bold flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                <span>{isAr ? 'المرفوض والمحجوز' : 'Rejected (Fail)'}</span>
              </span>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="font-mono font-black text-2xl text-rose-400">{globalFactoryStats.fail}</span>
                <span className="font-mono text-xs font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
                  {Math.round((globalFactoryStats.fail / Math.max(1, globalFactoryStats.total)) * 100)}%
                </span>
              </div>
            </div>

            {/* Containment & Problem Solving */}
            <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex flex-col justify-between shadow-sm">
              <span className="text-xs text-amber-400 font-bold flex items-center gap-1.5">
                <Workflow className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'قيد الحجر والـ NCR' : 'In Resolution'}</span>
              </span>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="font-mono font-black text-2xl text-amber-400">{getStageRecordStats('DEPT-STAGE-RESOLUTION').fail}</span>
                <span className="text-xs text-amber-300 font-bold">{isAr ? 'حالات نشطة' : 'active'}</span>
              </div>
            </div>
          </div>
        </div>
        
                {flowchartViewMode === 'diagram' ? (
          renderCleanProcessDiagram()
        ) : flowchartLayoutMode === 'dual' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ========================================================================= */}
            {/* LANE 1: PRODUCTION & CONFORMANCE STREAM (المسار الأخضر - مسار الإنتاج المطابق) */}
            {/* ========================================================================= */}
            <div className="lg:col-span-7 space-y-4">
              {/* Lane 1 Header Banner */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-2 border-emerald-500/50 shadow-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-black text-xs border border-emerald-500/40">
                        LANE 1 • PRODUCTION
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                    <h3 className="text-base font-black text-white mt-0.5">
                      {isAr ? '🟢 مسار الإنتاج والتدفق المطابق (Production Stream)' : 'Conforming Production & Release Stream'}
                    </h3>
                    <p className="text-xs text-slate-300">
                      {isAr 
                        ? 'مسار التصنيع والتدفق الانسيابي خطوة بخطوة من استلام الخامات حتى الإفراج للعميل' 
                        : 'Compliant production flow from raw receiving to customer shipping'}
                    </p>
                  </div>
                </div>
                <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
                  {globalFactoryStats.pass} {isAr ? 'عملية مطابقة' : 'Pass'}
                </span>
              </div>

              {renderStartTerminal()}
              {renderStage1()}
              {renderGate1()}
              {renderStage2()}
              {renderGate2()}
              {/* Stage 3 lives exclusively in Lane 2 as the Containment Hub; production continues to Stage 4 */}
              {renderStage4()}
              {renderGate4()}
              {renderStage5()}
              {renderGate5()}
              {renderStage6()}
              {renderFlowPipe('#3b82f6', 'تحديث وثائق النظام والبيانات', 'Update Master Data')}
              {renderStage7()}
              {renderClosedLoopFeedbackBanner()}
              {renderEndTerminal()}
            </div>

            {/* ========================================================================= */}
            {/* LANE 2: QUARANTINE & NCR RESOLUTION HUB (المسار الأحمر - الحجر وحل المشكلات) */}
            {/* ========================================================================= */}
            <div className="lg:col-span-5 space-y-4">
              {/* Lane 2 Header Banner */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-rose-950/90 via-slate-900 to-amber-950/80 border-2 border-rose-500/50 shadow-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                    <AlertOctagon className="w-6 h-6 text-rose-400 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-mono font-black text-xs border border-rose-500/40">
                        LANE 2 • RESOLUTION HUB
                      </span>
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    </div>
                    <h3 className="text-base font-black text-rose-400 mt-0.5">
                      {isAr ? '🛑 مسار الحجر والـ NCR وحل المشكلات' : 'Quarantine & Problem Solving Hub'}
                    </h3>
                    <p className="text-xs text-slate-300">
                      {isAr 
                        ? 'مركز عزل العيوب والتحقيق الجذري 8D وإجراءات تصحيح CAPA وفك الحجر' 
                        : 'Defect containment, 8D investigations, CAPA closed-loop & MRB'}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 font-mono text-xs font-bold border border-rose-500/30 shrink-0">
                  {globalFactoryStats.fail} {isAr ? 'حجر نشط' : 'Holds'}
                </span>
              </div>

              {/* 1. Raw Materials Receiving Quarantine Dock (QRN-01) */}
              {renderRawQuarantineDock()}

              {renderFlowPipe('#f43f5e', 'تحويل لتقارير عدم المطابقة والتحقيق الجذري', 'Escalate to NCR & 8D')}

              {/* 2. Stage 3 (NCR, 8D, CAPA, Deviation, Change Control) */}
              {renderStage3()}

              {/* 3. Gate 3 (MRB / CAPA Resolution Verification) */}
              {renderGate3()}

              {/* 4. Closed Loop Return Card (Loop-back arrow to Production in Lane 1) */}
              {renderClosedLoopCard()}
            </div>
          </div>
        ) : (
          /* LINEAR MODE: SEQUENTIAL 1 to 7 */
          <div className="space-y-4">
            {renderStartTerminal()}
            {renderStage1()}
            {renderGate1()}
            {renderStage2()}
            {renderGate2()}
            {renderStage3()}
            {renderGate3()}
            {renderStage4()}
            {renderGate4()}
            {renderStage5()}
            {renderGate5()}
            {renderStage6()}
            {renderFlowPipe('#3b82f6', 'تحديث وثائق النظام والبيانات', 'Update Master Data')}
            {renderStage7()}
            {renderClosedLoopFeedbackBanner()}
            {renderEndTerminal()}
          </div>
        )}
      </div>

{/* STAGE DETAIL DRAWER MODAL */}
      {renderStageDrawer()}

      {/* DRILL-DOWN RECORD MODAL & LOT JOURNEY INSPECTOR */}
      {renderStationDrilldownModal()}

      {/* OFFICIAL PFD QUALITY DOCUMENT EXPORT & PRINT MODAL */}
      {renderPfdExportModal()}
    </div>
  );
};

export default ModernQualityFlowchart;
