// @ts-nocheck
// QMS Enterprise 4.0 - Professional Industrial SCADA / MES Plant Floor Layout & Quality Control Tower
// Authentic, clean, interactive 2D factory floorplan driven 100% by REAL records (Zero fake data)
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Factory, CheckCircle2, AlertTriangle, XCircle, Search, RefreshCw, 
  ExternalLink, Cpu, Wrench, PackageCheck, Truck, X, Layers, Activity, 
  Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, Box, Gauge, Radio, 
  ArrowRight, Trash2, ShieldAlert, ShieldCheck, ChevronRight
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

export function QualityControlTower({ embedded = false, className = '' }: QualityControlTowerProps = {}) {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [viewMode, setViewMode] = useState<ViewMode>('scada-floorplan');
  const [filterZone, setFilterZone] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStationId, setSelectedStationId] = useState<string | null>('STATION-PRESSURE-TEST');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // ============================================================================
  // SCADA / MES FACTORY FLOOR ARCHITECTURE (1200 x 640 CANVAS)
  // ============================================================================
  const equipmentList: ScadaEquipment[] = useMemo(() => [
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
  ], []);

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

      // Find real open NCRs matching
      const matchedNcrs = realNcrs.filter(n => {
        const isClosed = n.status === 'Closed' || n.status === 'Resolved';
        if (isClosed) return false;
        const lineMatch = n.productionLine && (
          eq.line.toLowerCase().includes(n.productionLine.toLowerCase()) ||
          n.productionLine.toLowerCase().includes(eq.line.toLowerCase())
        );
        const deptMatch = n.department && eq.zoneNameAr.includes(n.department);
        return lineMatch || deptMatch;
      });

      const defectCount = matchedDefects.reduce((acc, d) => acc + (Number(d.quantity) || 1), 0);
      const openNcrCount = matchedNcrs.length;

      let status: 'pass' | 'warning' | 'alert' = 'pass';
      let statusLabelAr = 'تشغيل طبيعي';
      let statusLabelEn = 'Normal / Pass';
      let statusColor = '#10B981'; // Industrial Emerald

      if (openNcrCount > 0) {
        status = 'alert';
        statusLabelAr = `${openNcrCount} عدم مطابقة مفتوحة`;
        statusLabelEn = `${openNcrCount} Open NCR`;
        statusColor = '#EF4444'; // Industrial Red
      } else if (defectCount > 0) {
        status = 'warning';
        statusLabelAr = `${defectCount} عيوب مسجلة`;
        statusLabelEn = `${defectCount} Defects`;
        statusColor = '#F59E0B'; // Industrial Amber
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
        if (!matchTitle && !matchCode && !matchZone) return false;
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
              {isAr ? 'مسقط أفقي صناعي: مسار الإنتاج، الماكينات الذكية، السير الناقل، ومحطات فحص الجودة' : 'Industrial physical floorplan: line flow, smart machines, conveyor stream, and quality gates'}
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

          {/* Purge Demo Data */}
          <button
            onClick={handleManualPurge}
            className="p-2 rounded-xl bg-slate-900 hover:bg-red-500/20 border border-slate-800 hover:border-red-500/40 text-slate-400 hover:text-red-300 transition-all text-xs flex items-center gap-1"
            title={isAr ? 'تنظيف أي بيانات وهمية/تجريبية' : 'Purge any mock/demo data'}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isAr ? 'تنظيف التجريبي' : 'Clean Demo'}</span>
          </button>

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
      {/* 2. INDUSTRIAL FILTER & ZONE SELECTION                                */}
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
              className={`px-2.5 py-0.5 rounded-lg font-bold ${filterStatus === 'alerts-only' ? 'bg-red-500/20 text-red-400' : 'text-slate-400'}`}
            >
              {isAr ? 'تنبيهات فقط' : 'Alerts'}
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث عن ماكينة أو محطة...' : 'Search equipment...'}
              className="bg-slate-900 border border-slate-700/80 rounded-xl pr-8 pl-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 w-44 sm:w-60"
            />
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. SCADA FLOORPLAN WORKSPACE CANVAS                                  */}
      {/* ==================================================================== */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex">
        {viewMode === 'scada-floorplan' ? (
          /* ================================================================ */
          /* SCADA 2D ARCHITECTURAL CANVAS                                    */
          /* ================================================================ */
          <div className="relative flex-1 w-full h-full overflow-auto flex items-center justify-center p-4 bg-[#050811] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:28px_28px]">
            <div 
              className="relative w-[1200px] h-[640px] transition-transform duration-300 origin-center rounded-3xl border-2 border-slate-800/90 bg-[#090f1d] shadow-2xl shadow-black/90 shrink-0"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* Floorplan Structural SVG Overlay */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  {/* Safety walkway texture */}
                  <pattern id="scada-safety-walkway" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="12" height="24" fill="#f59e0b" fillOpacity="0.08" />
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
                {/* Vertical Aisle between Receiving & Assembly */}
                <rect x="295" y="15" width="25" height="610" fill="url(#scada-safety-walkway)" stroke="#F59E0B" strokeWidth="0.8" opacity="0.7" />
                {/* Vertical Aisle between Assembly & Outbound */}
                <rect x="865" y="15" width="22" height="610" fill="url(#scada-safety-walkway)" stroke="#F59E0B" strokeWidth="0.8" opacity="0.7" />

                {/* RED QUARANTINE HAZARD FLOOR */}
                <rect x="30" y="295" width="122" height="115" fill="url(#scada-quarantine-hatch)" stroke="#EF4444" strokeWidth="1.5" rx="10" />

                {/* LIVE PRODUCTION CONVEYOR STREAM (LINE 01) */}
                {/* Main Assembly Conveyor Belt */}
                <rect x="325" y="130" width="525" height="24" fill="url(#scada-rollers)" stroke="#475569" strokeWidth="2" rx="4" />
                <path d="M 335 142 L 840 142" stroke="#06B6D4" strokeWidth="2.5" strokeDasharray="10,6" className="animate-[pulse_2s_infinite]" />

                {/* Transfer Line from Receiving to Line 01 */}
                <path d="M 270 230 L 325 230 L 325 142" fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeDasharray="6,4" markerEnd="url(#scada-arrow-cyan)" />

                {/* Transfer Line from Assembly to Final OQC */}
                <path d="M 835 365 L 875 365 L 875 120 L 895 120" fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeDasharray="6,4" markerEnd="url(#scada-arrow-cyan)" />

                {/* DOCK GATES */}
                {/* Infeed Gate 01 */}
                <rect x="18" y="85" width="6" height="65" fill="#f59e0b" rx="2" />
                <text x="28" y="70" fill="#f59e0b" fontSize="10" fontWeight="bold">Gate 01</text>

                {/* Outbound Gate 03 */}
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
                      backdrop-blur-md shadow-lg
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

                      {/* Andon Triple LED Tower */}
                      <div className="flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded-full border border-white/10">
                        {/* Red LED */}
                        <span className={`w-2 h-2 rounded-full transition-all ${isAlert ? 'bg-red-500 shadow-[0_0_8px_#ef4444] animate-ping' : 'bg-red-950/60'}`} />
                        {/* Amber LED */}
                        <span className={`w-2 h-2 rounded-full transition-all ${isWarning ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-amber-950/60'}`} />
                        {/* Green LED */}
                        <span className={`w-2 h-2 rounded-full transition-all ${st?.status === 'pass' ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-emerald-950/60'}`} />
                      </div>
                    </div>

                    {/* Machine Title & Location */}
                    <div className="my-0.5">
                      <h4 className="text-xs font-black text-white leading-tight truncate">
                        {isAr ? eq.titleAr : eq.titleEn}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        {isAr ? eq.locationAr : eq.locationEn}
                      </p>
                    </div>

                    {/* Bottom Telemetry Strip */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[9px] font-bold">
                      <span className="text-slate-400 font-mono">{eq.line}</span>
                      {st && (st.openNcrCount > 0 || st.defectCount > 0) ? (
                        <span className="text-amber-300 font-black">
                          {st.openNcrCount > 0 ? `${st.openNcrCount} NCR` : `${st.defectCount} عيوب`}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-black flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>100% OK</span>
                        </span>
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

                      <div className="space-y-1 text-xs text-slate-400 mb-4">
                        <div className="flex justify-between">
                          <span className="text-slate-500">{isAr ? 'المنطقة:' : 'Zone:'}</span>
                          <span className="font-bold text-slate-300">{isAr ? eq.zoneNameAr : eq.zoneNameEn}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">{isAr ? 'الخط:' : 'Line:'}</span>
                          <span className="font-bold text-slate-300">{eq.line}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-slate-400">{isAr ? 'العيوب المسجلة:' : 'Defects:'} {st?.defectCount || 0}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(eq.moduleUrl);
                        }}
                        className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                      >
                        <span>{eq.moduleLabelAr}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* 4. SCADA COCKPIT INSPECTOR SLIDE-OVER DRAWER                       */}
        {/* ================================================================== */}
        {selectedEquipment && (
          <aside className="w-80 md:w-96 flex-none bg-[#0a101d] border-r border-white/10 backdrop-blur-md flex flex-col z-30 shadow-2xl overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/30">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {renderIcon(selectedEquipment.iconType, 'w-5 h-5')}
                </span>
                <div>
                  <h3 className="text-sm font-black text-white leading-tight">
                    {isAr ? selectedEquipment.titleAr : selectedEquipment.titleEn}
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-amber-400">{selectedEquipment.code}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedStationId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
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
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  {isAr ? 'المواصفات والمسار' : 'Routing & Specifications'}
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">{isAr ? 'المنطقة:' : 'Zone:'}</span>
                    <span className="font-bold text-white">{isAr ? selectedEquipment.zoneNameAr : selectedEquipment.zoneNameEn}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">{isAr ? 'خط الإنتاج:' : 'Line:'}</span>
                    <span className="font-bold text-white">{selectedEquipment.line}</span>
                  </div>
                  <div className="col-span-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">{isAr ? 'الموقع الفعلي:' : 'Physical Location:'}</span>
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
    </div>
  );
}

export default QualityControlTower;
