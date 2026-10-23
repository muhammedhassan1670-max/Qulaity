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
  LayoutGrid, ListFilter
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
            <div className="my-2.5 p-2 rounded-xl bg-slate-950/60 border border-white/5 space-y-2 shadow-inner">
              <div className="grid grid-cols-3 divide-x divide-x-reverse divide-white/10 text-center">
                {/* Total */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDrilldown(station, stageNumber, 'all');
                  }}
                  className="px-1 py-1 rounded-lg hover:bg-white/10 cursor-pointer transition-all group/stat relative"
                  title={isAr ? 'اضغط لفتح كامل السجلات والمسار' : 'Click to view all records'}
                >
                  <span className="text-[10px] text-slate-400 group-hover/stat:text-cyan-300 block font-medium transition-colors">
                    {isAr ? 'الإجمالي' : 'Total'}
                  </span>
                  <span className="text-sm font-mono font-black text-white group-hover/stat:text-cyan-300 flex items-center justify-center gap-0.5">
                    {cardStats.total}
                    <span className="text-[9px] opacity-0 group-hover/stat:opacity-100 transition-opacity">↗</span>
                  </span>
                </div>

                {/* Pass */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDrilldown(station, stageNumber, 'pass');
                  }}
                  className="px-1 py-1 rounded-lg hover:bg-emerald-950/60 cursor-pointer transition-all group/stat relative"
                  title={isAr ? 'اضغط لفتح السجلات المقبولة والمسار' : 'Click to view accepted records'}
                >
                  <span className="text-[10px] text-emerald-400/90 group-hover/stat:text-emerald-300 block font-bold transition-colors">
                    {isAr ? '✓ مقبول' : '✓ Pass'}
                  </span>
                  <span className="text-sm font-mono font-black text-emerald-400 group-hover/stat:scale-105 transition-transform flex items-center justify-center gap-0.5">
                    {cardStats.pass}
                    <span className="text-[9px] opacity-0 group-hover/stat:opacity-100 transition-opacity">↗</span>
                  </span>
                </div>

                {/* Fail */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDrilldown(station, stageNumber, 'fail');
                  }}
                  className="px-1 py-1 rounded-lg hover:bg-rose-950/60 cursor-pointer transition-all group/stat relative"
                  title={isAr ? 'اضغط لفتح السجلات المرفوضة ومسار الحجز' : 'Click to view rejected records'}
                >
                  <span className="text-[10px] text-rose-400/90 group-hover/stat:text-rose-300 block font-bold transition-colors">
                    {isAr ? '✕ مرفوض' : '✕ Fail'}
                  </span>
                  <span className="text-sm font-mono font-black text-rose-400 group-hover/stat:scale-105 transition-transform flex items-center justify-center gap-0.5">
                    {cardStats.fail}
                    <span className="text-[9px] opacity-0 group-hover/stat:opacity-100 transition-opacity">↗</span>
                  </span>
                </div>
              </div>

              {/* Slim, smooth dual-color bar - clickable to open records */}
              <div 
                className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden flex shadow-inner cursor-pointer hover:h-2 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDrilldown(station, stageNumber, 'all');
                }}
                title={isAr ? 'اضغط لعرض السجلات ومسار الخامة' : 'Click to inspect records & lot path'}
              >
                <div 
                  className="bg-emerald-400 h-full transition-all duration-500 rounded-full" 
                  style={{ width: `${cardStats.acceptanceRate}%` }} 
                  title={`${cardStats.pass} ${isAr ? 'مقبول' : 'Pass'}`}
                />
                {cardStats.fail > 0 && (
                  <div 
                    className="bg-rose-500 h-full transition-all duration-500 rounded-full" 
                    style={{ width: `${100 - cardStats.acceptanceRate}%` }} 
                    title={`${cardStats.fail} ${isAr ? 'مرفوض' : 'Fail'}`}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="my-2 p-1.5 px-2.5 rounded-xl bg-slate-950/50 border border-white/5 flex items-center justify-between text-xs">
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
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDrilldown(station, stageNumber, 'pass');
                  }}
                  className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer"
                  title={isAr ? 'اضغط لفتح السجلات المقبولة' : 'Click to view accepted records'}
                >
                  {cardStats.pass} ✓
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDrilldown(station, stageNumber, 'fail');
                  }}
                  className={`px-1.5 py-0.5 rounded-md border transition-all cursor-pointer ${
                    cardStats.fail > 0 
                      ? 'bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 border-rose-500/20' 
                      : 'bg-slate-800/60 text-slate-500 border-slate-700/40'
                  }`}
                  title={isAr ? 'اضغط لفتح السجلات المرفوضة ومسار الحجز' : 'Click to view rejected records'}
                >
                  {cardStats.fail} ✕
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

  const renderStartTerminal = () => (
    <div className="flex flex-col items-center">
      <div className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 border-2 border-white flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
        <span>{isAr ? '🚀 بداية المسار: استلام الخامات وتأهيل الموردين' : 'START: Incoming Materials & Supplier Verification'}</span>
      </div>
      {renderFlowPipe('#f59e0b', 'توريد خامات جديدة', 'New Raw Batch')}
    </div>
  );

  const renderEndTerminal = () => (
    <div className="flex flex-col items-center pt-2">
      <div className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/20 border-2 border-white flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-slate-950" />
        <span>{isAr ? '🏁 نهاية الدورة: مطابقة تامة 100% وتحسين مستمر' : 'END: 100% Conformance & Continuous Excellence'}</span>
      </div>
    </div>
  );

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
                onClick={() => setFlowchartLayoutMode('dual')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  flowchartLayoutMode === 'dual'
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={isAr ? 'مساران متوازيان: مسار الإنتاج الأخضر ومسار الـ NCR الأحمر' : 'Dual Swimlanes: Production vs NCR'}
              >
                <GitFork className="w-3.5 h-3.5 rotate-90" />
                <span className="hidden sm:inline">{isAr ? 'مساران متوازيان' : 'Dual Lanes'}</span>
              </button>
              <button
                type="button"
                onClick={() => setFlowchartLayoutMode('linear')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  flowchartLayoutMode === 'linear'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={isAr ? 'تسلسل رأسي مدمج في عمود واحد' : 'Single Stream Flow'}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAr ? 'مسار فردي' : 'Single'}</span>
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
        
                {/* DUAL SWIMLANES VS LINEAR ARCHITECTURE */}
        {flowchartLayoutMode === 'dual' ? (
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

{/* DRILL-DOWN RECORD MODAL & LOT JOURNEY INSPECTOR */}
      {renderStationDrilldownModal()}
    </div>
  );
};

export default ModernQualityFlowchart;
