// @ts-nocheck
// QMS Enterprise 4.0 - Professional Industrial SCADA / MES Plant Floor Layout & Quality Control Tower
// Fully dynamic, user-customizable 2D factory floorplan driven 100% by REAL records (Zero fake data)
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Factory, CheckCircle2, AlertTriangle, XCircle, Search, RefreshCw, 
  ExternalLink, Cpu, Wrench, PackageCheck, Truck, X, Layers, Activity, 
  Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, Box, Gauge, Radio, 
  ArrowRight, Trash2, ShieldAlert, ShieldCheck, ChevronRight, Edit3, Plus,
  Sliders, Settings2, Save, Download, Upload, ArrowUp, ArrowDown, ArrowLeft
} from 'lucide-react';
import { useTranslation } from '../../utils/translations';
import { loadSafeLocalDefectRecords } from '../../services/safeDefectStorage';
import { unifiedNcrApi, unifiedCapaApi, unifiedEightDApi, unifiedComplaintsApi } from '../../api/unified-api';
import { purgeAllDemoSimulationData } from '../../services/cleanDemoData';

export type StationZone = 'receiving' | 'assembly' | 'lab' | 'oqc' | 'shipping';
export type ViewMode = 'scada-floorplan' | 'stations-grid';
export type FilterStatus = 'all' | 'alerts-only' | 'normal-only';

export interface ScadaEquipment {
  id: string;
  code: string;
  zone: StationZone;
  zoneNameAr: string;
  zoneNameEn: string;
  titleAr: string;
  titleEn: string;
  line: string;
  locationAr: string;
  locationEn: string;
  iconType: 'truck' | 'pallet' | 'machine' | 'wrench' | 'gauge' | 'lab' | 'package';
  moduleUrl: string;
  moduleLabelAr: string;
  // Floorplan Coordinate System (1200 x 640)
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface QualityControlTowerProps {
  embedded?: boolean;
  className?: string;
}

const SCADA_STORAGE_KEY = 'qms_scada_equipment_config_v2';

export const DEFAULT_EQUIPMENT_PODS: ScadaEquipment[] = [
  // ------------------------------------------------------------------------
  // BAY A: رصيف الاستلام وفحص المواد الخام (RECEIVING & RAW MATERIALS)
  // ------------------------------------------------------------------------
  {
    id: 'DOCK-RECEIVING-01',
    code: 'DCK-01',
    zone: 'receiving',
    zoneNameAr: 'عنبر الاستلام A',
    zoneNameEn: 'Receiving Bay A',
    titleAr: 'بوابة رصيف الاستلام 01',
    titleEn: 'Infeed Dock Gate 01',
    line: 'Receiving',
    locationAr: 'مدخل المصنع الغربي',
    locationEn: 'West Inbound Gate',
    iconType: 'truck',
    moduleUrl: '/compliance/hub/inspection',
    moduleLabelAr: 'فحص الشحنات (IQC)',
    x: 35, y: 70, w: 235, h: 95
  },
  {
    id: 'STATION-IQC-INSPECT',
    code: 'IQC-01',
    zone: 'receiving',
    zoneNameAr: 'عنبر الاستلام A',
    zoneNameEn: 'Receiving Bay A',
    titleAr: 'محطة فحص الاستلام (IQC)',
    titleEn: 'Smart IQC Inspection Cell',
    line: 'Receiving',
    locationAr: 'منطقة الفحص الأولى',
    locationEn: 'Primary Inspection Cell',
    iconType: 'gauge',
    moduleUrl: '/compliance/hub/inspection',
    moduleLabelAr: 'فحص الاستلام (IQC)',
    x: 35, y: 185, w: 235, h: 95
  },
  {
    id: 'QUARANTINE-CAGE',
    code: 'QRN-01',
    zone: 'receiving',
    zoneNameAr: 'عنبر الاستلام A',
    zoneNameEn: 'Receiving Bay A',
    titleAr: 'قفص العزل للمواد المرفوضة',
    titleEn: 'Quarantine & Rejection Hold',
    line: 'Receiving',
    locationAr: 'قفص العزل الأمني',
    locationEn: 'Secure Hold Enclosure',
    iconType: 'pallet',
    moduleUrl: '/quality/records/ncr',
    moduleLabelAr: 'تقارير عدم المطابقة (NCR)',
    x: 35, y: 300, w: 112, h: 105
  },
  {
    id: 'WAREHOUSE-RAW-STAGING',
    code: 'BUF-01',
    zone: 'receiving',
    zoneNameAr: 'عنبر الاستلام A',
    zoneNameEn: 'Receiving Bay A',
    titleAr: 'مستودع الخامات المعتمدة',
    titleEn: 'Approved Material Racks',
    line: 'Receiving',
    locationAr: 'مستودع الخامات المفحوصة',
    locationEn: 'Approved Buffer Staging',
    iconType: 'pallet',
    moduleUrl: '/supplier-quality',
    moduleLabelAr: 'جودة الموردين',
    x: 158, y: 300, w: 112, h: 105
  },

  // ------------------------------------------------------------------------
  // BAY B: صالة الإنتاج وخط التجميع الرئيسي (ASSEMBLY LINE 01 - CONVEYOR)
  // ------------------------------------------------------------------------
  {
    id: 'STATION-CNC-MILLING',
    code: 'CNC-01',
    zone: 'assembly',
    zoneNameAr: 'خط التجميع 01',
    zoneNameEn: 'Assembly Line 01',
    titleAr: 'محطة 1: التشغيل والخراطة CNC',
    titleEn: '5-Axis CNC Machining Cell',
    line: 'Line 1',
    locationAr: 'بداية السير الناقل 01',
    locationEn: 'Conveyor 01 Infeed',
    iconType: 'machine',
    moduleUrl: '/quality-shopfloor',
    moduleLabelAr: 'تسجيل صالة الإنتاج',
    x: 330, y: 180, w: 155, h: 110
  },
  {
    id: 'STATION-SUB-ASSEMBLY',
    code: 'ASM-02',
    zone: 'assembly',
    zoneNameAr: 'خط التجميع 01',
    zoneNameEn: 'Assembly Line 01',
    titleAr: 'محطة 2: التجميع والتركيب الميكانيكي',
    titleEn: 'Sub-Assembly & Fitting',
    line: 'Line 1',
    locationAr: 'المرحلة 02 على السير',
    locationEn: 'Mid-Conveyor Station',
    iconType: 'wrench',
    moduleUrl: '/quality-shopfloor',
    moduleLabelAr: 'تسجيل صالة الإنتاج',
    x: 505, y: 180, w: 155, h: 110
  },
  {
    id: 'STATION-TORQUE-BENCH',
    code: 'TRQ-03',
    zone: 'assembly',
    zoneNameAr: 'خط التجميع 01',
    zoneNameEn: 'Assembly Line 01',
    titleAr: 'محطة 3: عزم الربط الذكي Poka-Yoke',
    titleEn: 'Smart Torque & Fastening Bench',
    line: 'Line 1',
    locationAr: 'المرحلة 03 على السير',
    locationEn: 'Poka-Yoke Fastening Gate',
    iconType: 'wrench',
    moduleUrl: '/spc',
    moduleLabelAr: 'كارتات التحكم الإحصائي SPC',
    x: 680, y: 180, w: 155, h: 110
  },
  {
    id: 'STATION-PRESSURE-TEST',
    code: 'PRS-04',
    zone: 'assembly',
    zoneNameAr: 'خط التجميع 01',
    zoneNameEn: 'Assembly Line 01',
    titleAr: 'محطة 4: كابينة اختبار الضغط والتسريب',
    titleEn: 'Pressure & Leakage Test Cell',
    line: 'Line 1',
    locationAr: 'كابينة الاختبارات الهيدروليكية',
    locationEn: 'Hydraulic Test Cell',
    iconType: 'gauge',
    moduleUrl: '/quality-execution-board',
    moduleLabelAr: 'متابعة محطات الفحص',
    x: 415, y: 310, w: 200, h: 110
  },
  {
    id: 'STATION-IPQC-GATE',
    code: 'IPQC-05',
    zone: 'assembly',
    zoneNameAr: 'خط التجميع 01',
    zoneNameEn: 'Assembly Line 01',
    titleAr: 'محطة 5: بوابة الفحص المرحلي IPQC',
    titleEn: 'In-Process Quality Clearance Gate',
    line: 'Line 1',
    locationAr: 'مخرج خط الإنتاج 01',
    locationEn: 'Line 01 Quality Gate',
    iconType: 'gauge',
    moduleUrl: '/defect-log',
    moduleLabelAr: 'مسجل العيوب اليومية',
    x: 635, y: 310, w: 200, h: 110
  },

  // ------------------------------------------------------------------------
  // BAY C: مركز الجودة والمعايرة (METROLOGY LAB & MRB WAR ROOM)
  // ------------------------------------------------------------------------
  {
    id: 'LAB-METROLOGY-CMM',
    code: 'CMM-01',
    zone: 'lab',
    zoneNameAr: 'مركز الجودة C',
    zoneNameEn: 'Quality Hub C',
    titleAr: 'معمل القياس ثلاثي الأبعاد CMM',
    titleEn: '3D CMM Metrology Lab',
    line: 'Quality Lab',
    locationAr: 'المعمل المركزي المكيف',
    locationEn: 'Climate-Controlled Metrology Room',
    iconType: 'lab',
    moduleUrl: '/compliance/hub/calibration',
    moduleLabelAr: 'المعايرة والأجهزة',
    x: 330, y: 470, w: 245, h: 105
  },
  {
    id: 'ROOM-MRB-CAPA',
    code: 'MRB-01',
    zone: 'lab',
    zoneNameAr: 'مركز الجودة C',
    zoneNameEn: 'Quality Hub C',
    titleAr: 'غرفة مراجعة المواد MRB و CAPA',
    titleEn: 'MRB Review & Problem Solving Hub',
    line: 'Quality Assurance',
    locationAr: 'قاعة مراجعة الجودة المركزية',
    locationEn: 'Central QA War Room',
    iconType: 'lab',
    moduleUrl: '/quality/records/capa',
    moduleLabelAr: 'الإجراءات التصحيحية (CAPA)',
    x: 590, y: 470, w: 245, h: 105
  },

  // ------------------------------------------------------------------------
  // BAY D: الفحص النهائي والتغليف (FINAL OQC & PACKAGING)
  // ------------------------------------------------------------------------
  {
    id: 'BENCH-OQC-RELEASE',
    code: 'OQC-01',
    zone: 'oqc',
    zoneNameAr: 'عنبر الإفراج D',
    zoneNameEn: 'OQC Bay D',
    titleAr: 'منصة الفحص النهائي والإفراج OQC',
    titleEn: 'Final OQC Clearance Bench',
    line: 'Final Inspection',
    locationAr: 'محطة فحص عينات الشحن',
    locationEn: 'Outbound Sampling Bench',
    iconType: 'package',
    moduleUrl: '/outgoing-quality',
    moduleLabelAr: 'فحص المنتج النهائي (OQC)',
    x: 895, y: 70, w: 260, h: 100
  },
  {
    id: 'STATION-PACKAGING',
    code: 'PCK-02',
    zone: 'oqc',
    zoneNameAr: 'عنبر الإفراج D',
    zoneNameEn: 'OQC Bay D',
    titleAr: 'محطة التعبئة والتغليف والباليتات',
    titleEn: 'Final Packing & Palletizing Cell',
    line: 'Packaging',
    locationAr: 'ساحة التغليف والشحن',
    locationEn: 'Pallet Wrap Staging',
    iconType: 'package',
    moduleUrl: '/outgoing-quality',
    moduleLabelAr: 'فحص المنتج النهائي (OQC)',
    x: 895, y: 190, w: 260, h: 100
  },

  // ------------------------------------------------------------------------
  // BAY E: رصيف الشحن والتسليم للعميل (OUTBOUND SHIPPING DOCK)
  // ------------------------------------------------------------------------
  {
    id: 'DOCK-SHIPPING-03',
    code: 'DCK-03',
    zone: 'shipping',
    zoneNameAr: 'عنبر الشحن E',
    zoneNameEn: 'Shipping Bay E',
    titleAr: 'بوابة رصيف الشحن والتوزيع 03',
    titleEn: 'Shipping Dock Gate 03',
    line: 'Shipping',
    locationAr: 'المخرج اللوجستي الشرقي',
    locationEn: 'East Logistics Bay',
    iconType: 'truck',
    moduleUrl: '/quality/records/complaints',
    moduleLabelAr: 'شكاوى العملاء والميدان',
    x: 895, y: 315, w: 260, h: 100
  },
  {
    id: 'TRUCK-CUSTOMER-DELIVERY',
    code: 'DSP-01',
    zone: 'shipping',
    zoneNameAr: 'عنبر الشحن E',
    zoneNameEn: 'Shipping Bay E',
    titleAr: 'ساحة تسليم الشحنات للعميل',
    titleEn: 'Customer Dispatch & Logistics Staging',
    line: 'Shipping',
    locationAr: 'ساحة الشاحنات الخارجية',
    locationEn: 'Outbound Truck Yard',
    iconType: 'truck',
    moduleUrl: '/quality/records/complaints',
    moduleLabelAr: 'شكاوى العملاء والميدان',
    x: 895, y: 435, w: 260, h: 100
  }
];

function loadSavedEquipment(): ScadaEquipment[] {
  try {
    const raw = localStorage.getItem(SCADA_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse saved SCADA equipment', e);
  }
  return DEFAULT_EQUIPMENT_PODS;
}

export function QualityControlTower({ embedded = false, className = '' }: QualityControlTowerProps = {}) {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isAr = language === 'ar';

  // Dynamic Equipment Pods State (Fully Editable & Persistent)
  const [equipmentList, setEquipmentList] = useState<ScadaEquipment[]>(loadSavedEquipment);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [editingStation, setEditingStation] = useState<ScadaEquipment | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('scada-floorplan');
  const [filterZone, setFilterZone] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStationId, setSelectedStationId] = useState<string | null>('STATION-PRESSURE-TEST');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real System Records State
  const [realDefects, setRealDefects] = useState<any[]>([]);
  const [realNcrs, setRealNcrs] = useState<any[]>([]);
  const [realCapas, setRealCapas] = useState<any[]>([]);
  const [realEightDs, setRealEightDs] = useState<any[]>([]);
  const [realComplaints, setRealComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load genuine data and clean out any mock data
  const loadRealData = async () => {
    try {
      setIsLoading(true);
      purgeAllDemoSimulationData();

      const defects = loadSafeLocalDefectRecords() || [];
      const [ncrRes, capaRes, eightDRes, compRes] = await Promise.all([
        unifiedNcrApi.getAll().catch(() => ({ data: [] })),
        unifiedCapaApi.getAll().catch(() => ({ data: [] })),
        unifiedEightDApi.getAll().catch(() => ({ data: [] })),
        unifiedComplaintsApi.getAll().catch(() => ({ data: [] })),
      ]);

      setRealDefects(defects);
      setRealNcrs(ncrRes.data || []);
      setRealCapas(capaRes.data || []);
      setRealEightDs(eightDRes.data || []);
      setRealComplaints(compRes.data || []);
    } catch (err) {
      console.error('Failed to load real quality records', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRealData();
  }, []);

  const handleManualPurge = () => {
    const { totalRemoved } = purgeAllDemoSimulationData();
    loadRealData();
    if (totalRemoved > 0) {
      toast.success(isAr ? `تم تنظيف ${totalRemoved} سجل تجريبي وهمي بنجاح` : `Purged ${totalRemoved} mock demo records successfully`);
    } else {
      toast.info(isAr ? 'النظام نظيف بالكامل - لا توجد أي بيانات وهمية' : 'System is clean. No mock demo records found.');
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Station Save / Edit / Delete handlers
  const handleSaveStation = (stationData: ScadaEquipment) => {
    setEquipmentList(prev => {
      let next: ScadaEquipment[];
      const exists = prev.some(e => e.id === stationData.id);
      if (exists) {
        next = prev.map(e => e.id === stationData.id ? stationData : e);
        toast.success(isAr ? `تم تحديث بيانات المحطة (${stationData.titleAr}) بنجاح` : `Updated station ${stationData.titleEn} successfully`);
      } else {
        next = [...prev, stationData];
        toast.success(isAr ? `تمت إضافة المحطة الجديدة (${stationData.titleAr}) بنجاح` : `Added new station ${stationData.titleEn} successfully`);
      }
      try {
        localStorage.setItem(SCADA_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error('Failed to save to localStorage', err);
      }
      return next;
    });
    setEditingStation(null);
    setIsAddingNew(false);
    setSelectedStationId(stationData.id);
  };

  const handleDeleteStation = (id: string) => {
    setEquipmentList(prev => {
      const next = prev.filter(e => e.id !== id);
      try {
        localStorage.setItem(SCADA_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error('Failed to save to localStorage', err);
      }
      return next;
    });
    toast.success(isAr ? 'تم حذف المحطة بنجاح' : 'Station deleted successfully');
    setDeleteConfirmId(null);
    if (selectedStationId === id) {
      setSelectedStationId(null);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm(isAr ? 'هل أنت متأكد من رغبتك في استعادة المحطات والتوزيع الافتراضي للمصنع؟ سيتم مسح أي تعديلات مخصصة قمت بها.' : 'Are you sure you want to restore default factory stations? Custom edits will be reset.')) {
      localStorage.removeItem(SCADA_STORAGE_KEY);
      setEquipmentList(DEFAULT_EQUIPMENT_PODS);
      toast.success(isAr ? 'تمت استعادة إعدادات المصنع الافتراضية بنجاح' : 'Factory layout reset to defaults');
    }
  };

  const handleNudgeStation = (id: string, dx: number, dy: number) => {
    setEquipmentList(prev => {
      const next = prev.map(eq => {
        if (eq.id === id) {
          return {
            ...eq,
            x: Math.max(20, Math.min(1150 - eq.w, eq.x + dx)),
            y: Math.max(30, Math.min(600 - eq.h, eq.y + dy)),
          };
        }
        return eq;
      });
      localStorage.setItem(SCADA_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleExportConfig = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(equipmentList, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `factory-stations-layout-${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
    toast.success(isAr ? 'تم تصدير مخطط المصنع بنجاح' : 'Factory layout exported successfully');
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEquipmentList(parsed);
          localStorage.setItem(SCADA_STORAGE_KEY, JSON.stringify(parsed));
          toast.success(isAr ? 'تم استيراد مخطط المصنع بنجاح' : 'Factory layout imported successfully');
        } else {
          toast.error(isAr ? 'ملف غير صالح' : 'Invalid file format');
        }
      } catch (err) {
        toast.error(isAr ? 'حدث خطأ أثناء قراءة الملف' : 'Error reading JSON file');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Compute live station status from genuine records (Zero fake data)
  const stationStatuses = useMemo(() => {
    const map: Record<string, {
      status: 'pass' | 'warning' | 'alert';
      statusLabelAr: string;
      statusLabelEn: string;
      statusColor: string;
      defectCount: number;
      openNcrCount: number;
      matchedDefects: any[];
      matchedNcrs: any[];
    }> = {};

    equipmentList.forEach(eq => {
      // Find real defects matching this station or line
      const matchedDefects = realDefects.filter(d => {
        const lineMatch = d.productionLine && (
          eq.line.toLowerCase().includes(d.productionLine.toLowerCase()) ||
          d.productionLine.toLowerCase().includes(eq.line.toLowerCase())
        );
        const stationMatch = d.station && (
          eq.titleAr.includes(d.station) ||
          eq.titleEn.toLowerCase().includes(d.station.toLowerCase()) ||
          eq.code.toLowerCase().includes(d.station.toLowerCase())
        );
        return lineMatch || stationMatch;
      });

      // Find real NCRs matching this station or line
      const matchedNcrs = realNcrs.filter(n => {
        const lineMatch = n.productionLine && (
          eq.line.toLowerCase().includes(n.productionLine.toLowerCase()) ||
          n.productionLine.toLowerCase().includes(eq.line.toLowerCase())
        );
        const titleMatch = (n.title || '').toLowerCase().includes(eq.code.toLowerCase()) ||
          (n.description || '').toLowerCase().includes(eq.code.toLowerCase());
        return lineMatch || titleMatch;
      });

      const openNcrCount = matchedNcrs.filter(n => n.status !== 'Closed' && n.status !== 'Resolved').length;
      const defectCount = matchedDefects.length;

      // Status determination
      let status: 'pass' | 'warning' | 'alert' = 'pass';
      let statusLabelAr = 'مطابق وطبيعي';
      let statusLabelEn = 'Normal Operational';
      let statusColor = '#10B981'; // Green

      if (openNcrCount > 0) {
        status = 'alert';
        statusLabelAr = `${openNcrCount} عدم مطابقة نشطة`;
        statusLabelEn = `${openNcrCount} Active NCR`;
        statusColor = '#EF4444'; // Red
      } else if (defectCount > 0) {
        status = 'warning';
        statusLabelAr = `${defectCount} عيوب مسجلة`;
        statusLabelEn = `${defectCount} Defects Logged`;
        statusColor = '#F59E0B'; // Amber
      }

      map[eq.id] = {
        status,
        statusLabelAr,
        statusLabelEn,
        statusColor,
        defectCount,
        openNcrCount,
        matchedDefects,
        matchedNcrs
      };
    });

    return map;
  }, [equipmentList, realDefects, realNcrs]);

  // Overall Factory Real KPIs
  const summaryMetrics = useMemo(() => {
    let alertCount = 0;
    let normalCount = 0;
    equipmentList.forEach(eq => {
      const st = stationStatuses[eq.id];
      if (st && st.status !== 'pass') alertCount++;
      else normalCount++;
    });

    return {
      totalStations: equipmentList.length,
      normalCount,
      alertCount,
      totalRealDefects: realDefects.length,
      openNcrs: realNcrs.filter(n => n.status !== 'Closed' && n.status !== 'Resolved').length,
      activeCapas: realCapas.filter(c => c.status !== 'Closed' && c.status !== 'Completed').length,
      openComplaints: realComplaints.filter(c => c.status !== 'Closed').length
    };
  }, [equipmentList, stationStatuses, realDefects, realNcrs, realCapas, realComplaints]);

  // Filtered stations for display
  const filteredEquipment = useMemo(() => {
    return equipmentList.filter(eq => {
      if (filterZone !== 'all' && eq.zone !== filterZone) return false;
      const st = stationStatuses[eq.id];
      if (filterStatus === 'alerts-only' && st?.status === 'pass') return false;
      if (filterStatus === 'normal-only' && st?.status !== 'pass') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = eq.titleAr.toLowerCase().includes(q) || eq.titleEn.toLowerCase().includes(q);
        const matchCode = eq.code.toLowerCase().includes(q);
        const matchZone = eq.zoneNameAr.toLowerCase().includes(q) || eq.zoneNameEn.toLowerCase().includes(q);
        const matchLoc = eq.locationAr.toLowerCase().includes(q) || eq.locationEn.toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchZone && !matchLoc) return false;
      }

      return true;
    });
  }, [equipmentList, stationStatuses, filterZone, filterStatus, searchQuery]);

  const selectedEquipment = useMemo(() => {
    return equipmentList.find(e => e.id === selectedStationId) || equipmentList[0];
  }, [equipmentList, selectedStationId]);

  const selectedStatus = useMemo(() => {
    return selectedEquipment ? stationStatuses[selectedEquipment.id] : null;
  }, [selectedEquipment, stationStatuses]);

  // Icon selector
  const renderIcon = (type: string, className = 'w-4 h-4') => {
    switch (type) {
      case 'truck': return <Truck className={className} />;
      case 'pallet': return <Box className={className} />;
      case 'machine': return <Cpu className={className} />;
      case 'wrench': return <Wrench className={className} />;
      case 'gauge': return <Gauge className={className} />;
      case 'lab': return <Activity className={className} />;
      case 'package': return <PackageCheck className={className} />;
      default: return <Factory className={className} />;
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full ${isFullscreen ? 'h-screen fixed inset-0 z-50 bg-[#070b14]' : embedded ? 'h-[780px] min-h-[640px] rounded-3xl border border-amber-500/40 shadow-2xl' : 'h-[calc(100vh-80px)] min-h-[680px] max-h-[960px]'} bg-[#060a13] text-white flex flex-col font-sans overflow-hidden select-none ${className}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportConfig} 
        accept=".json" 
        className="hidden" 
      />

      {/* ==================================================================== */}
      {/* 1. SCADA INDUSTRIAL TOP HEADER & METRIC HUD                          */}
      {/* ==================================================================== */}
      <header className="flex-none px-4 py-2.5 bg-[#0a101d] border-b border-white/10 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-30 shadow-md">
        {/* Plant Title & Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0">
            <Factory className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-black text-white tracking-wide">
                {isAr ? 'لوحة تحكم صالة المصنع الصناعية (SCADA / MES Floorplan)' : 'SCADA / MES Plant Floor Operating Map'}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{isAr ? 'بيانات حية 100%' : 'LIVE DATA'}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {isAr ? 'محطات قابلة للتعديل والتخصيص بالكامل: مسار الإنتاج، الماكينات، والأبراج التحذيرية' : 'Fully customizable equipment pods: edit names, codes, lines, and layout to match your plant'}
            </p>
          </div>
        </div>

        {/* Real KPI HUD */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-700/80 text-xs">
            <span className="text-slate-400 text-[11px]">{isAr ? 'إجمالي المحطات:' : 'Total Units:'}</span>
            <span className="font-black text-white text-sm">{summaryMetrics.totalStations}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-bold text-[11px]">{isAr ? 'تشغيل طبيعي:' : 'Normal:'}</span>
            <span className="font-black text-sm">{summaryMetrics.normalCount}</span>
          </div>

          {summaryMetrics.alertCount > 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-950/50 border border-red-500/40 text-xs text-red-400 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              <span className="font-bold text-[11px]">{isAr ? 'تنبيهات جودة:' : 'Alerts:'}</span>
              <span className="font-black text-sm">{summaryMetrics.alertCount}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
              <span className="text-[11px]">{isAr ? 'لا توجد تنبيهات' : 'Zero Alerts'}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-700/80 text-xs">
            <span className="text-slate-400 text-[11px]">NCR:</span>
            <span className="font-black text-amber-400 text-sm">{summaryMetrics.openNcrs}</span>
          </div>
        </div>

        {/* View Controls & Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Mode Switch: Edit & Customize Stations */}
          <button
            onClick={() => setIsCustomizing(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm ${
              isCustomizing 
                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300' 
                : 'bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30'
            }`}
            title={isAr ? 'تفعيل وضع تعديل وتخصيص المحطات ومواقعها' : 'Toggle customize & edit mode'}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isCustomizing ? (isAr ? 'إنهاء التعديل' : 'Done Editing') : (isAr ? 'تخصيص المحطات' : 'Customize Layout')}</span>
          </button>

          {/* Add New Station Button */}
          <button
            onClick={() => {
              setIsAddingNew(true);
              setEditingStation({
                id: `STATION-CUSTOM-${Date.now().toString().slice(-4)}`,
                code: `EQ-0${equipmentList.length + 1}`,
                zone: 'assembly',
                zoneNameAr: 'خط التجميع 01',
                zoneNameEn: 'Assembly Line 01',
                titleAr: `محطة جديدة ${equipmentList.length + 1}`,
                titleEn: `New Workstation ${equipmentList.length + 1}`,
                line: 'Line 1',
                locationAr: 'صالة الإنتاج الرئيسية',
                locationEn: 'Main Shopfloor',
                iconType: 'machine',
                moduleUrl: '/quality-shopfloor',
                moduleLabelAr: 'تسجيل صالة الإنتاج',
                x: 480,
                y: 220,
                w: 160,
                h: 105
              });
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            title={isAr ? 'إضافة محطة أو ماكينة جديدة إلى المصنع' : 'Add new station'}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isAr ? 'إضافة محطة' : 'Add Station'}</span>
          </button>

          {/* Switch View Mode */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('scada-floorplan')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                viewMode === 'scada-floorplan' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'خريطة SCADA' : 'SCADA Map'}
            </button>
            <button
              onClick={() => setViewMode('stations-grid')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                viewMode === 'stations-grid' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'قائمة المعدات' : 'Equipment Grid'}
            </button>
          </div>

          {/* Zoom Controls */}
          <button
            onClick={() => setZoomLevel(prev => Math.max(0.7, prev - 0.1))}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all"
            title={isAr ? 'تصغير' : 'Zoom Out'}
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.1))}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all"
            title={isAr ? 'تكبير' : 'Zoom In'}
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => setZoomLevel(1)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all"
            title={isAr ? 'إعادة ضبط' : 'Reset View'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 hover:text-amber-300 transition-all"
            title={isAr ? 'ملء كامل الشاشة' : 'Toggle Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {embedded && (
            <button
              onClick={() => navigate('/quality-control-tower')}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 shrink-0"
              title={isAr ? 'فتح في صفحة كاملة مخصصة' : 'Open in Dedicated Page'}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isAr ? 'شاشة كاملة' : 'Full Page'}</span>
            </button>
          )}
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. INDUSTRIAL FILTER & ZONE SELECTION + CUSTOMIZATION SUB-BAR        */}
      {/* ==================================================================== */}
      <div className="flex-none px-4 py-2 bg-[#080d19] border-b border-white/5 flex flex-wrap items-center justify-between gap-2 z-20">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
          <span className="text-[11px] font-bold text-slate-400 mr-1">{isAr ? 'المناطق الصناعية:' : 'Bays & Zones:'}</span>
          {[
            { id: 'all', labelAr: 'كامل الصالة', labelEn: 'All Bays' },
            { id: 'receiving', labelAr: 'A: رصيف الاستلام والخامات', labelEn: 'Bay A: Receiving' },
            { id: 'assembly', labelAr: 'B: صالة الإنتاج والتجميع', labelEn: 'Bay B: Assembly' },
            { id: 'lab', labelAr: 'C: مختبر الجودة و MRB', labelEn: 'Hub C: QA Lab' },
            { id: 'oqc', labelAr: 'D: الفحص النهائي OQC', labelEn: 'Bay D: Final OQC' },
            { id: 'shipping', labelAr: 'E: رصيف الشحن والتسليم', labelEn: 'Bay E: Shipping' },
          ].map(z => (
            <button
              key={z.id}
              onClick={() => setFilterZone(z.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterZone === z.id 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              {isAr ? z.labelAr : z.labelEn}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Customization Actions Menu (Export / Import / Reset) */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleExportConfig}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1"
              title={isAr ? 'تصدير مخطط المحطات كملف JSON' : 'Export Stations Layout JSON'}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[10px]">{isAr ? 'تصدير' : 'Export'}</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1"
              title={isAr ? 'استيراد مخطط المحطات من ملف JSON' : 'Import Stations Layout JSON'}
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[10px]">{isAr ? 'استيراد' : 'Import'}</span>
            </button>

            <button
              onClick={handleResetToDefaults}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-amber-400 text-xs flex items-center gap-1"
              title={isAr ? 'استعادة التوزيع الافتراضي للمصنع' : 'Restore Default Layout'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[10px]">{isAr ? 'استعادة الافتراضي' : 'Reset'}</span>
            </button>

            {/* Purge Demo Data */}
            <button
              onClick={handleManualPurge}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-500/20 border border-slate-800 hover:border-red-500/40 text-slate-400 hover:text-red-300 transition-all text-xs flex items-center gap-1"
              title={isAr ? 'تنظيف أي بيانات وهمية/تجريبية' : 'Purge any mock/demo data'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[10px]">{isAr ? 'تنظيف التجريبي' : 'Clean Demo'}</span>
            </button>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-0.5 rounded-lg font-bold ${filterStatus === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
            >
              {isAr ? 'الكل' : 'All'}
            </button>
            <button
              onClick={() => setFilterStatus('alerts-only')}
              className={`px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1 ${filterStatus === 'alerts-only' ? 'bg-red-950/60 text-red-400 border border-red-500/40' : 'text-slate-400'}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
              <span>{isAr ? 'التنبيهات' : 'Alerts'}</span>
            </button>
            <button
              onClick={() => setFilterStatus('normal-only')}
              className={`px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1 ${filterStatus === 'normal-only' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40' : 'text-slate-400'}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>{isAr ? 'طبيعي' : 'Normal'}</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute top-2.5 right-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث عن ماكينة، كود، محطة...' : 'Search equipment or code...'}
              className="w-36 md:w-48 pl-2 pr-8 py-1 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Customizable Banner Notification when in Edit Mode */}
      {isCustomizing && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1.5 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-amber-400 animate-bounce" />
            <span className="font-bold">
              {isAr ? 'وضع تخصيص المحطات نشط: يمكنك الآن النقر على زر التعديل (القلم) لتغيير أسماء ووصف الماكينات، أو استخدام الأسهم لنقلها!' : 'Customize Mode Active: Click the pencil to rename or edit any station, or use arrows to reposition them!'}
            </span>
          </div>
          <button
            onClick={() => setIsCustomizing(false)}
            className="px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[11px] hover:bg-amber-400"
          >
            {isAr ? 'تم وحفظ' : 'Done & Save'}
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. MAIN WORKSPACE: SCADA FLOORPLAN OR STATIONS GRID                  */}
      {/* ==================================================================== */}
      <div className="flex-1 relative flex overflow-hidden">
        {viewMode === 'scada-floorplan' ? (
          <div className="flex-1 w-full h-full relative overflow-auto p-4 flex items-center justify-center bg-[#050811]">
            <div 
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              className="relative w-[1200px] h-[640px] shrink-0 bg-[#080d19] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden"
            >
              {/* SVG ARCHITECTURAL INDUSTRIAL BACKGROUND */}
              <svg 
                viewBox="0 0 1200 640" 
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <defs>
                  {/* Subtle SCADA floor grid */}
                  <pattern id="scada-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#141d2f" strokeWidth="1" />
                    <circle cx="0" cy="0" r="1.5" fill="#1e293b" />
                  </pattern>

                  {/* High-visibility yellow safety walkway hatch */}
                  <pattern id="scada-safety-walkway" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="12" height="24" fill="#f59e0b" fillOpacity="0.15" />
                    <rect x="12" width="12" height="24" fill="#000000" fillOpacity="0.4" />
                  </pattern>

                  {/* Red quarantine hazard hatch */}
                  <pattern id="scada-quarantine-hatch" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="8" height="16" fill="#ef4444" fillOpacity="0.18" />
                    <rect x="8" width="8" height="16" fill="#180000" fillOpacity="0.4" />
                  </pattern>

                  {/* Conveyor belt roller texture */}
                  <pattern id="scada-rollers" width="16" height="26" patternUnits="userSpaceOnUse">
                    <rect width="16" height="26" fill="#0f172a" />
                    <line x1="8" y1="0" x2="8" y2="26" stroke="#334155" strokeWidth="2" />
                  </pattern>

                  {/* Material Flow Arrow Markers */}
                  <marker id="scada-arrow-cyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#06B6D4" />
                  </marker>
                </defs>

                {/* Grid Floor */}
                <rect width="1200" height="640" fill="url(#scada-grid)" />

                {/* Outer Plant Wall */}
                <rect x="15" y="15" width="1170" height="610" fill="none" stroke="#1e293b" strokeWidth="3" rx="16" />

                {/* STRUCTURAL BAY BOUNDARIES */}
                {/* Bay A: Receiving Divider */}
                <line x1="290" y1="15" x2="290" y2="625" stroke="#1e293b" strokeWidth="2" strokeDasharray="10,6" />

                {/* Bay B: Assembly Line Floor Boundary */}
                <line x1="290" y1="440" x2="875" y2="440" stroke="#1e293b" strokeWidth="2" strokeDasharray="10,6" />

                {/* Bay D & E Divider */}
                <line x1="875" y1="15" x2="875" y2="625" stroke="#1e293b" strokeWidth="2" strokeDasharray="10,6" />

                {/* SAFETY PEDESTRIAN AISLES */}
                <rect x="295" y="15" width="25" height="610" fill="url(#scada-safety-walkway)" stroke="#F59E0B" strokeWidth="0.8" opacity="0.7" />
                <rect x="865" y="15" width="22" height="610" fill="url(#scada-safety-walkway)" stroke="#F59E0B" strokeWidth="0.8" opacity="0.7" />

                {/* RED QUARANTINE HAZARD FLOOR */}
                <rect x="30" y="295" width="122" height="115" fill="url(#scada-quarantine-hatch)" stroke="#EF4444" strokeWidth="1.5" rx="10" />

                {/* LIVE PRODUCTION CONVEYOR STREAM (LINE 01) */}
                <rect x="325" y="130" width="525" height="24" fill="url(#scada-rollers)" stroke="#475569" strokeWidth="2" rx="4" />
                <path d="M 335 142 L 840 142" stroke="#06B6D4" strokeWidth="2.5" strokeDasharray="10,6" className="animate-[pulse_2s_infinite]" />

                {/* Transfer Line from Receiving to Line 01 */}
                <path d="M 270 230 L 325 230 L 325 142" fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeDasharray="6,4" markerEnd="url(#scada-arrow-cyan)" />

                {/* Transfer Line from Assembly to Final OQC */}
                <path d="M 835 365 L 875 365 L 875 120 L 895 120" fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeDasharray="6,4" markerEnd="url(#scada-arrow-cyan)" />

                {/* DOCK GATES */}
                <rect x="18" y="85" width="6" height="65" fill="#f59e0b" rx="2" />
                <text x="28" y="70" fill="#f59e0b" fontSize="10" fontWeight="bold">Gate 01</text>

                <rect x="1176" y="335" width="6" height="65" fill="#10b981" rx="2" />
                <text x="1170" y="325" fill="#10b981" fontSize="10" fontWeight="bold" textAnchor="end">Gate 03</text>
              </svg>

              {/* INDUSTRIAL BAY OVERLAY BADGES */}
              <div className="absolute top-4 left-9 pointer-events-none z-10 flex items-center gap-1.5 bg-[#0b1324]/90 border border-slate-700/80 px-2.5 py-1 rounded-xl shadow-md">
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Bay A: الاستلام والخامات</span>
              </div>

              <div className="absolute top-4 left-[330px] pointer-events-none z-10 flex items-center gap-1.5 bg-[#0b1324]/90 border border-slate-700/80 px-2.5 py-1 rounded-xl shadow-md">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">Bay B: صالة الإنتاج والتجميع 01</span>
                <span className="text-[9px] font-mono text-cyan-300/60 ml-2">CONVEYOR LIVE</span>
              </div>

              <div className="absolute top-[448px] left-[330px] pointer-events-none z-10 flex items-center gap-1.5 bg-[#0b1324]/90 border border-slate-700/80 px-2.5 py-1 rounded-xl shadow-md">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">Hub C: مختبر الجودة و MRB</span>
              </div>

              <div className="absolute top-4 right-8 pointer-events-none z-10 flex items-center gap-1.5 bg-[#0b1324]/90 border border-slate-700/80 px-2.5 py-1 rounded-xl shadow-md">
                <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Bay D & E: الفحص والشحن</span>
              </div>

              {/* SCADA EQUIPMENT PODS */}
              {filteredEquipment.map(eq => {
                const st = stationStatuses[eq.id];
                const isSelected = selectedStationId === eq.id;
                const isAlert = st?.status === 'alert';
                const isWarning = st?.status === 'warning';

                return (
                  <div
                    key={eq.id}
                    onClick={() => setSelectedStationId(eq.id)}
                    style={{
                      left: `${eq.x}px`,
                      top: `${eq.y}px`,
                      width: `${eq.w}px`,
                      height: `${eq.h}px`,
                    }}
                    className={`
                      absolute rounded-2xl cursor-pointer transition-all duration-300 p-2.5 flex flex-col justify-between
                      backdrop-blur-md shadow-lg group
                      ${isSelected 
                        ? 'ring-2 ring-amber-400 bg-[#0f1b33] border-amber-400/80 shadow-2xl shadow-amber-500/25 z-20 scale-[1.03]' 
                        : isAlert
                          ? 'border-2 border-red-500 bg-red-950/40 shadow-xl shadow-red-500/30 animate-pulse z-15'
                          : isWarning
                            ? 'border-2 border-amber-500/80 bg-amber-950/30 shadow-lg shadow-amber-500/20 z-12'
                            : 'border border-slate-700/80 bg-[#0c1426]/90 hover:border-slate-500 hover:bg-[#111c36] z-10'
                      }
                    `}
                  >
                    {/* Top Row: SCADA Machine Header & Andon LED Light */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`p-1 rounded-lg ${isAlert ? 'bg-red-500/20 text-red-400' : isWarning ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-300'}`}>
                          {renderIcon(eq.iconType, 'w-3.5 h-3.5')}
                        </span>
                        <span className="text-[10px] font-mono font-black text-slate-300 bg-black/40 px-1.5 py-0.5 rounded-md border border-white/5">
                          {eq.code}
                        </span>
                      </div>

                      {/* Right actions: If in Customizing mode, show quick edit & nudge controls */}
                      {isCustomizing ? (
                        <div className="flex items-center gap-1 z-30" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setEditingStation(eq)}
                            className="p-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow"
                            title={isAr ? 'تعديل بيانات المحطة والوصف' : 'Edit station details'}
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(eq.id)}
                            className="p-1 rounded bg-red-600 hover:bg-red-500 text-white transition-colors shadow"
                            title={isAr ? 'حذف المحطة' : 'Delete station'}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        /* Andon Triple LED Tower */
                        <div className="flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded-full border border-white/10">
                          <span className={`w-2 h-2 rounded-full transition-all ${isAlert ? 'bg-red-500 shadow-[0_0_8px_#ef4444] animate-ping' : 'bg-red-950/60'}`} />
                          <span className={`w-2 h-2 rounded-full transition-all ${isWarning ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-amber-950/60'}`} />
                          <span className={`w-2 h-2 rounded-full transition-all ${st?.status === 'pass' ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-emerald-950/60'}`} />
                        </div>
                      )}
                    </div>

                    {/* Machine Title & Location (Description) */}
                    <div className="my-0.5">
                      <h4 className="text-xs font-black text-white leading-tight truncate">
                        {isAr ? eq.titleAr : eq.titleEn}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        {isAr ? eq.locationAr : eq.locationEn}
                      </p>
                    </div>

                    {/* Bottom Telemetry Strip & Quick Move Controls in Customize Mode */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[9px] font-bold">
                      <span className="text-slate-400 font-mono truncate max-w-[80px]">{eq.line}</span>
                      
                      {isCustomizing ? (
                        <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={() => handleNudgeStation(eq.id, 0, -15)} 
                            className="p-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="تحريك لأعلى"
                          >
                            <ArrowUp className="w-2.5 h-2.5" />
                          </button>
                          <button 
                            onClick={() => handleNudgeStation(eq.id, 0, 15)} 
                            className="p-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="تحريك لأسفل"
                          >
                            <ArrowDown className="w-2.5 h-2.5" />
                          </button>
                          <button 
                            onClick={() => handleNudgeStation(eq.id, -15, 0)} 
                            className="p-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="تحريك لليسار"
                          >
                            <ArrowLeft className="w-2.5 h-2.5" />
                          </button>
                          <button 
                            onClick={() => handleNudgeStation(eq.id, 15, 0)} 
                            className="p-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="تحريك لليمين"
                          >
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        st && (st.openNcrCount > 0 || st.defectCount > 0) ? (
                          <span className="text-amber-300 font-black">
                            {st.openNcrCount > 0 ? `${st.openNcrCount} NCR` : `${st.defectCount} عيوب`}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-black flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>100% OK</span>
                          </span>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ================================================================ */
          /* STATIONS GRID MATRIX VIEW                                        */
          /* ================================================================ */
          <div className="flex-1 w-full h-full overflow-y-auto p-4 md:p-6 bg-[#050811]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredEquipment.map(eq => {
                const st = stationStatuses[eq.id];
                const isSelected = selectedStationId === eq.id;
                const isAlert = st?.status === 'alert';

                return (
                  <div
                    key={eq.id}
                    onClick={() => setSelectedStationId(eq.id)}
                    className={`
                      p-4 rounded-2xl cursor-pointer transition-all duration-200 border flex flex-col justify-between
                      ${isSelected 
                        ? 'border-amber-400 bg-slate-800/90 shadow-xl' 
                        : isAlert
                          ? 'border-red-500/80 bg-red-950/20'
                          : 'border-white/10 bg-slate-900/60 hover:bg-slate-900 hover:border-white/20'
                      }
                    `}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="p-2 rounded-xl bg-white/5 text-amber-400">
                            {renderIcon(eq.iconType, 'w-4 h-4')}
                          </span>
                          <div>
                            <span className="text-[10px] font-mono text-slate-400 block">{eq.code}</span>
                            <span className="text-xs font-black text-white">{isAr ? eq.titleAr : eq.titleEn}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingStation(eq);
                            }}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-colors"
                            title={isAr ? 'تعديل المحطة' : 'Edit station'}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <span 
                            className="px-2 py-0.5 rounded-full text-[10px] font-black border"
                            style={{
                              color: st?.statusColor,
                              borderColor: `${st?.statusColor}40`,
                              backgroundColor: `${st?.statusColor}15`
                            }}
                          >
                            {isAr ? st?.statusLabelAr : st?.statusLabelEn}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                        {isAr ? eq.locationAr : eq.locationEn}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono text-[11px]">{eq.line}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(eq.moduleUrl);
                        }}
                        className="text-amber-400 hover:text-amber-300 text-xs font-bold flex items-center gap-1"
                      >
                        <span>{isAr ? eq.moduleLabelAr : 'Open Module'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 4. SLIDE-OVER SCADA COCKPIT DRAWER (INSPECTION & ACTIONS)            */}
        {/* ==================================================================== */}
        {selectedEquipment && (
          <aside className="w-80 md:w-96 flex-none bg-[#090f1d] border-r md:border-r-0 md:border-l border-white/10 flex flex-col z-20 shadow-2xl overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-4 bg-[#0d162b] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {renderIcon(selectedEquipment.iconType, 'w-5 h-5')}
                </span>
                <div>
                  <h3 className="text-sm font-black text-white leading-tight">
                    {isAr ? selectedEquipment.titleAr : selectedEquipment.titleEn}
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-amber-400">{selectedEquipment.code}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingStation(selectedEquipment)}
                  className="p-1.5 rounded-lg text-amber-400 hover:text-white hover:bg-amber-500/20 transition-colors"
                  title={isAr ? 'تعديل بيانات هذه المحطة' : 'Edit station'}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedStationId(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="p-4 space-y-5 flex-1">
              {/* Telemetry Status Box */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">{isAr ? 'حالة الجودة الحية:' : 'Live Quality Status:'}</span>
                  <span 
                    className="px-2.5 py-0.5 rounded-full text-xs font-black border"
                    style={{
                      color: selectedStatus?.statusColor,
                      borderColor: `${selectedStatus?.statusColor}40`,
                      backgroundColor: `${selectedStatus?.statusColor}15`
                    }}
                  >
                    {isAr ? selectedStatus?.statusLabelAr : selectedStatus?.statusLabelEn}
                  </span>
                </div>

                <div className="text-xs text-slate-300">
                  {selectedStatus && selectedStatus.status === 'pass' ? (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{isAr ? 'المحطة تعمل بكفاءة طبيعية، ولا توجد أي مشكلات جودة مسجلة.' : 'Operating normally with zero quality alerts.'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-400 text-[11px] font-medium">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{isAr ? 'يوجد بلاغات جودة نشطة على هذا الخط تتطلب التدقيق.' : 'Active quality alerts detected on this station.'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Machine Technical Metadata */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {isAr ? 'المواصفات والمسار' : 'Routing & Specifications'}
                  </span>
                  <button
                    onClick={() => setEditingStation(selectedEquipment)}
                    className="text-amber-400 hover:text-amber-300 text-[11px] font-bold flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isAr ? 'تعديل البيانات' : 'Edit Specs'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">{isAr ? 'المنطقة:' : 'Zone:'}</span>
                    <span className="font-bold text-white truncate block">{isAr ? selectedEquipment.zoneNameAr : selectedEquipment.zoneNameEn}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">{isAr ? 'خط الإنتاج:' : 'Line:'}</span>
                    <span className="font-bold text-white truncate block">{selectedEquipment.line}</span>
                  </div>
                  <div className="col-span-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">{isAr ? 'الموقع الفعلي / الوصف:' : 'Physical Location / Desc:'}</span>
                    <span className="font-bold text-white">{isAr ? selectedEquipment.locationAr : selectedEquipment.locationEn}</span>
                  </div>
                </div>
              </div>

              {/* Genuine Records List */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  {isAr ? 'السجلات الحقيقية المسجلة على هذه المحطة' : 'Real System Records Logged'}
                </span>

                {selectedStatus && selectedStatus.matchedDefects.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {selectedStatus.matchedDefects.map((d, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex justify-between items-center">
                        <div>
                          <span className="font-bold text-amber-300 block">{d.defectType || d.type || 'عيب مصنعي'}</span>
                          <span className="text-[10px] text-slate-400">{d.date || d.createdAt || 'اليوم'} - {d.partNameAtTime || d.partNumber || 'قطعة عامة'}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black">
                          الكمية: {d.quantity || 1}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                    {isAr ? 'لا توجد أي عيوب أو بلاغات عدم مطابقة مسجلة على هذه المحطة' : 'Zero defects or NCRs recorded for this unit'}
                  </div>
                )}
              </div>

              {/* Direct Deep Navigation Actions */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  {isAr ? 'إجراءات الجودة السريعة' : 'Quick Actions'}
                </span>

                <div className="space-y-1.5">
                  <button
                    onClick={() => navigate(selectedEquipment.moduleUrl)}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <span>{isAr ? `الانتقال إلى ${selectedEquipment.moduleLabelAr}` : `Open ${selectedEquipment.moduleLabelAr}`}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => navigate('/quality-shopfloor')}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-xs flex items-center justify-between transition-colors"
                  >
                    <span>{isAr ? '📝 تسجيل عيب سريع على هذه المحطة' : 'Fast Shopfloor Entry'}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => navigate('/quality/records/ncr')}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-xs flex items-center justify-between transition-colors"
                  >
                    <span>{isAr ? '⚠️ إصدار تقرير عدم مطابقة NCR' : 'Create NCR Report'}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => navigate('/spc')}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-xs flex items-center justify-between transition-colors"
                  >
                    <span>{isAr ? '📊 كارتات التحكم الإحصائي SPC' : 'Open SPC Control Charts'}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 5. MODAL: EDIT / ADD STATION DIALOG                                  */}
      {/* ==================================================================== */}
      {editingStation && (
        <StationEditModal
          station={editingStation}
          isNew={isAddingNew}
          isAr={isAr}
          onSave={handleSaveStation}
          onDelete={(id) => {
            setEditingStation(null);
            handleDeleteStation(id);
          }}
          onClose={() => {
            setEditingStation(null);
            setIsAddingNew(false);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-red-500/40 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-white">
              {isAr ? 'تأكيد حذف المحطة' : 'Confirm Delete Station'}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr ? 'هل أنت متأكد من حذف هذه المحطة من خريطة المصنع؟ يمكنك استعادتها لاحقاً عبر زر استعادة الافتراضي.' : 'Are you sure you want to delete this station from the plant map?'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => handleDeleteStation(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30"
              >
                {isAr ? 'نعم، احذف المحطة' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MODAL COMPONENT: STATION EDIT / ADD FORM
// ============================================================================
interface StationEditModalProps {
  station: ScadaEquipment;
  isNew: boolean;
  isAr: boolean;
  onSave: (station: ScadaEquipment) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function StationEditModal({ station, isNew, isAr, onSave, onDelete, onClose }: StationEditModalProps) {
  const [formData, setFormData] = useState<ScadaEquipment>({ ...station });

  const setZonePreset = (zone: StationZone) => {
    switch (zone) {
      case 'receiving':
        setFormData(prev => ({
          ...prev,
          zone: 'receiving',
          zoneNameAr: 'عنبر الاستلام A',
          zoneNameEn: 'Receiving Bay A',
          line: 'Receiving',
          x: 35,
          y: 185
        }));
        break;
      case 'assembly':
        setFormData(prev => ({
          ...prev,
          zone: 'assembly',
          zoneNameAr: 'خط التجميع 01',
          zoneNameEn: 'Assembly Line 01',
          line: 'Line 1',
          x: 480,
          y: 180
        }));
        break;
      case 'lab':
        setFormData(prev => ({
          ...prev,
          zone: 'lab',
          zoneNameAr: 'مركز الجودة C',
          zoneNameEn: 'Quality Hub C',
          line: 'Quality Lab',
          x: 450,
          y: 470
        }));
        break;
      case 'oqc':
        setFormData(prev => ({
          ...prev,
          zone: 'oqc',
          zoneNameAr: 'عنبر الإفراج D',
          zoneNameEn: 'OQC Bay D',
          line: 'Final Inspection',
          x: 895,
          y: 130
        }));
        break;
      case 'shipping':
        setFormData(prev => ({
          ...prev,
          zone: 'shipping',
          zoneNameAr: 'عنبر الشحن E',
          zoneNameEn: 'Shipping Bay E',
          line: 'Shipping',
          x: 895,
          y: 350
        }));
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titleAr.trim() || !formData.code.trim()) {
      toast.error(isAr ? 'يرجى كتابة اسم المحطة وكود الماكينة' : 'Please provide station title and code');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#0b1324] border border-amber-500/40 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-white my-8" dir={isAr ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {isNew ? (isAr ? 'إضافة محطة / ماكينة جديدة للصالة' : 'Add New Workstation') : (isAr ? 'تعديل بيانات المحطة والوصف' : 'Edit Workstation Details')}
              </h2>
              <p className="text-xs text-slate-400">
                {isAr ? 'تخصيص الاسم، الكود، خط الإنتاج، الموقع والربط الإجرائي' : 'Customize title, machine code, line, physical location, and links'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Arabic Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {isAr ? 'اسم المحطة (بالعربية) *' : 'Station Title (Arabic) *'}
              </label>
              <input
                type="text"
                required
                value={formData.titleAr}
                onChange={e => setFormData({ ...formData, titleAr: e.target.value })}
                placeholder="مثال: محطة 1: التشغيل والخراطة CNC"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* English Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {isAr ? 'اسم المحطة (بالإنجليزية)' : 'Station Title (English)'}
              </label>
              <input
                type="text"
                value={formData.titleEn}
                onChange={e => setFormData({ ...formData, titleEn: e.target.value })}
                placeholder="e.g. 5-Axis CNC Machining Cell"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Machine Code */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {isAr ? 'كود الماكينة / المحطة (Code) *' : 'Machine Code *'}
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                placeholder="مثال: CNC-01, ASM-02"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-amber-300 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Production Line */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {isAr ? 'خط الإنتاج / الورشة المرتبطة *' : 'Associated Production Line *'}
              </label>
              <input
                type="text"
                required
                value={formData.line}
                onChange={e => setFormData({ ...formData, line: e.target.value })}
                placeholder="مثال: Line 1, Receiving, Quality Lab"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Zone Assignment */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {isAr ? 'العنبر / الجناح المصنعي (Bay / Zone):' : 'Bay / Industrial Zone:'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'receiving', labelAr: 'Bay A: الاستلام', labelEn: 'Bay A: Receiving' },
                  { id: 'assembly', labelAr: 'Bay B: الإنتاج والتجميع', labelEn: 'Bay B: Assembly' },
                  { id: 'lab', labelAr: 'Hub C: المختبر و MRB', labelEn: 'Hub C: QA Lab' },
                  { id: 'oqc', labelAr: 'Bay D: الفحص النهائي', labelEn: 'Bay D: Final OQC' },
                  { id: 'shipping', labelAr: 'Bay E: الشحن واللوجستيات', labelEn: 'Bay E: Shipping' },
                ].map(z => (
                  <button
                    type="button"
                    key={z.id}
                    onClick={() => setZonePreset(z.id as StationZone)}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all text-center ${
                      formData.zone === z.id
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isAr ? z.labelAr : z.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Arabic Physical Location / Description */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {isAr ? 'الموقع الفعلي / وصف المحطة (بالعربية)' : 'Location / Description (Arabic)'}
              </label>
              <input
                type="text"
                value={formData.locationAr}
                onChange={e => setFormData({ ...formData, locationAr: e.target.value })}
                placeholder="مثال: بداية السير الناقل 01"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* English Location */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {isAr ? 'الموقع الفعلي / الوصف (بالإنجليزية)' : 'Location / Description (English)'}
              </label>
              <input
                type="text"
                value={formData.locationEn}
                onChange={e => setFormData({ ...formData, locationEn: e.target.value })}
                placeholder="e.g. Conveyor 01 Infeed"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Icon Type */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {isAr ? 'نوع المعدة والأيقونة' : 'Equipment Type & Icon'}
              </label>
              <select
                value={formData.iconType}
                onChange={e => setFormData({ ...formData, iconType: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="machine">مركز تشغيل / ماكينة (Machine)</option>
                <option value="wrench">محطة تجميع وربط (Wrench / Assembly)</option>
                <option value="gauge">كابينة اختبار وقياس (Gauge / Test)</option>
                <option value="lab">مختبر وغرفة جودة (Lab / Metrology)</option>
                <option value="package">تعبئة وتغليف (Packaging)</option>
                <option value="truck">رصيف شحن ونقل (Truck / Dock)</option>
                <option value="pallet">مستودع وباليتات (Pallet Buffer)</option>
              </select>
            </div>

            {/* Target Module URL */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {isAr ? 'الإجراء السريع المرتبط' : 'Quick Linked Module'}
              </label>
              <select
                value={formData.moduleUrl}
                onChange={e => {
                  const url = e.target.value;
                  let label = 'تسجيل صالة الإنتاج';
                  if (url.includes('inspection')) label = 'فحص الشحنات (IQC)';
                  else if (url.includes('spc')) label = 'كارتات التحكم الإحصائي SPC';
                  else if (url.includes('ncr')) label = 'تقارير عدم المطابقة (NCR)';
                  else if (url.includes('capa')) label = 'الإجراءات التصحيحية (CAPA)';
                  else if (url.includes('calibration')) label = 'المعايرة والأجهزة';
                  else if (url.includes('outgoing')) label = 'فحص المنتج النهائي (OQC)';
                  else if (url.includes('complaints')) label = 'شكاوى العملاء';
                  setFormData({ ...formData, moduleUrl: url, moduleLabelAr: label });
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="/quality-shopfloor">تسجيل صالة الإنتاج الميداني (/quality-shopfloor)</option>
                <option value="/compliance/hub/inspection">فحص استلام الشحنات IQC (/inspection)</option>
                <option value="/spc">كارتات التحكم الإحصائي SPC (/spc)</option>
                <option value="/defect-log">مسجل العيوب اليومية (/defect-log)</option>
                <option value="/quality/records/ncr">تقارير عدم المطابقة NCR (/ncr)</option>
                <option value="/quality/records/capa">الإجراءات التصحيحية CAPA (/capa)</option>
                <option value="/compliance/hub/calibration">معايرة الأجهزة والمعدات (/calibration)</option>
                <option value="/outgoing-quality">فحص المنتج النهائي OQC (/outgoing-quality)</option>
                <option value="/quality/records/complaints">شكاوى العملاء (/complaints)</option>
              </select>
            </div>

            {/* Coordinates and Dimensions */}
            <div className="md:col-span-2 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-amber-400 block">
                {isAr ? 'الإحداثيات والأبعاد على خريطة المصنع (Canvas Coordinates):' : 'Canvas Coordinates (X, Y, W, H):'}
              </span>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block">X (الموضع الأفقي)</span>
                  <input
                    type="number"
                    value={formData.x}
                    onChange={e => setFormData({ ...formData, x: Number(e.target.value) })}
                    className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Y (الموضع الرأسي)</span>
                  <input
                    type="number"
                    value={formData.y}
                    onChange={e => setFormData({ ...formData, y: Number(e.target.value) })}
                    className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">العرض (Width)</span>
                  <input
                    type="number"
                    value={formData.w}
                    onChange={e => setFormData({ ...formData, w: Number(e.target.value) })}
                    className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">الارتفاع (Height)</span>
                  <input
                    type="number"
                    value={formData.h}
                    onChange={e => setFormData({ ...formData, h: Number(e.target.value) })}
                    className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            {!isNew ? (
              <button
                type="button"
                onClick={() => onDelete(formData.id)}
                className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'حذف هذه المحطة' : 'Delete Station'}</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{isAr ? 'حفظ التغييرات' : 'Save Station'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QualityControlTower;
