// @ts-nocheck
// QMS Enterprise 4.0 - Live Quality Plant Floor Layout & Control Tower
// A clean, authentic 2D factory floorplan driven by REAL system records (no fake/mock data)
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Factory, CheckCircle2, AlertTriangle, XCircle, Search, RefreshCw, 
  ExternalLink, Building, Cpu, Wrench, PackageCheck, Truck, Sparkles, 
  ChevronRight, X, Info, Zap, Layers, Activity, FileText, Maximize2, 
  Minimize2, ZoomIn, ZoomOut, RotateCcw, Compass, MapPin, Gauge, Box, 
  Radio, ShieldAlert, ShieldCheck, ClipboardCheck, ArrowRight, Trash2
} from 'lucide-react';
import { useTranslation } from '../../utils/translations';
import { loadSafeLocalDefectRecords } from '../../services/safeDefectStorage';
import { unifiedNcrApi, unifiedCapaApi, unifiedEightDApi, unifiedComplaintsApi } from '../../api/unified-api';
import { purgeAllDemoSimulationData } from '../../services/cleanDemoData';

export type StationZone = 'receiving' | 'assembly' | 'lab' | 'oqc' | 'shipping';
export type ViewMode = 'plant-layout' | 'stations-grid';
export type FilterStatus = 'all' | 'alerts-only' | 'normal-only';

export interface FactoryStation {
  id: string;
  zone: StationZone;
  zoneNameAr: string;
  zoneNameEn: string;
  titleAr: string;
  titleEn: string;
  code: string;
  line: string;
  locationAr: string;
  locationEn: string;
  iconType: 'truck' | 'pallet' | 'machine' | 'wrench' | 'gauge' | 'lab' | 'package';
  moduleUrl: string;
  moduleLabelAr: string;
  // Floorplan Layout Coordinates (1200 x 740 coordinate system)
  lx: number;
  ly: number;
  lw: number;
  lh: number;
}

export interface QualityControlTowerProps {
  embedded?: boolean;
  className?: string;
}

export function QualityControlTower({ embedded = false, className = '' }: QualityControlTowerProps = {}) {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [viewMode, setViewMode] = useState<ViewMode>('plant-layout');
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

  // Purge any fake simulation data and load real system records
  const loadRealData = async () => {
    try {
      setIsLoading(true);
      // Clean out any previously injected simulation demo data
      purgeAllDemoSimulationData();

      // Read real records from local storage & unified APIs
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
      toast.success(isAr ? `تم تنظيف ${totalRemoved} سجل تجريبي بنجاح` : `Purged ${totalRemoved} mock demo records successfully`);
    } else {
      toast.info(isAr ? 'النظام نظيف بالكامل ولا توجد أي بيانات تجريبية' : 'System is clean. No mock demo records found.');
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
  // AUTHENTIC FACTORY FLOOR STATIONS & EQUIPMENT LAYOUT
  // ============================================================================
  const stations: FactoryStation[] = useMemo(() => [
    // ------------------------------------------------------------------------
    // ZONE A: رصيف الاستلام وفحص المواد الخام (RECEIVING & RAW MATERIALS)
    // ------------------------------------------------------------------------
    {
      id: 'DOCK-RECEIVING-01',
      zone: 'receiving',
      zoneNameAr: 'رصيف الاستلام 01',
      zoneNameEn: 'Receiving Dock 01',
      titleAr: 'بوابة رصيف الاستلام 01',
      titleEn: 'Receiving Dock Gate 01',
      code: 'DCK-REC-01',
      line: 'Receiving',
      locationAr: 'مدخل المصنع الغربي',
      locationEn: 'West Factory Entrance',
      iconType: 'truck',
      moduleUrl: '/compliance/hub/inspection',
      moduleLabelAr: 'فحص الشحنات (IQC)',
      lx: 40, ly: 50, lw: 160, lh: 75,
    },
    {
      id: 'STATION-IQC-INSPECT',
      zone: 'receiving',
      zoneNameAr: 'رصيف الاستلام 01',
      zoneNameEn: 'Receiving Dock 01',
      titleAr: 'محطة فحص الاستلام (IQC)',
      titleEn: 'Incoming Quality Control (IQC)',
      code: 'ST-IQC-01',
      line: 'Receiving',
      locationAr: 'منطقة الفحص الأولى',
      locationEn: 'Primary Inspection Area',
      iconType: 'gauge',
      moduleUrl: '/compliance/hub/inspection',
      moduleLabelAr: 'فحص الاستلام (IQC)',
      lx: 220, ly: 50, lw: 160, lh: 75,
    },
    {
      id: 'QUARANTINE-CAGE',
      zone: 'receiving',
      zoneNameAr: 'قفص الحجز والعزل',
      zoneNameEn: 'Quarantine & Hold Cage',
      titleAr: 'قفص العزل والمواد المحجوزة',
      titleEn: 'Quarantine & Rejection Cage',
      code: 'CAGE-QRN-01',
      line: 'Receiving',
      locationAr: 'منطقة الحجز الإداري',
      locationEn: 'Hold & Quarantine Bay',
      iconType: 'pallet',
      moduleUrl: '/quality/records/ncr',
      moduleLabelAr: 'تقارير عدم المطابقة (NCR)',
      lx: 40, ly: 145, lw: 160, lh: 80,
    },
    {
      id: 'WAREHOUSE-RAW-STAGING',
      zone: 'receiving',
      zoneNameAr: 'مستودع الخامات المعتمدة',
      zoneNameEn: 'Approved Raw Materials Staging',
      titleAr: 'مستودع الخامات المعتمدة',
      titleEn: 'Approved Raw Material Racks',
      code: 'WH-RAW-01',
      line: 'Receiving',
      locationAr: 'ساحة الإفراج والتغذية',
      locationEn: 'Release Staging Buffer',
      iconType: 'pallet',
      moduleUrl: '/supplier-quality',
      moduleLabelAr: 'جودة الموردين',
      lx: 220, ly: 145, lw: 160, lh: 80,
    },

    // ------------------------------------------------------------------------
    // ZONE B: صالة الإنتاج وخط التجميع 01 (PRODUCTION & ASSEMBLY LINE)
    // ------------------------------------------------------------------------
    {
      id: 'STATION-CNC-MILLING',
      zone: 'assembly',
      zoneNameAr: 'خط التجميع - محطة التشغيل',
      zoneNameEn: 'Assembly Line - Machining',
      titleAr: 'محطة 1: التشغيل والخراطة CNC',
      titleEn: 'Station 1: CNC Machining Cell',
      code: 'MCH-CNC-01',
      line: 'Line 1',
      locationAr: 'بداية خط الإنتاج 01',
      locationEn: 'Line 01 Infeed',
      iconType: 'machine',
      moduleUrl: '/quality-shopfloor',
      moduleLabelAr: 'تسجيل صالة الإنتاج',
      lx: 430, ly: 70, lw: 140, lh: 85,
    },
    {
      id: 'STATION-SUB-ASSEMBLY',
      zone: 'assembly',
      zoneNameAr: 'خط التجميع - محطة التجميع الميكانيكي',
      zoneNameEn: 'Assembly Line - Mechanical Fit',
      titleAr: 'محطة 2: التجميع الميكانيكي للأجزاء',
      titleEn: 'Station 2: Mechanical Sub-Assembly',
      code: 'ASM-SUB-02',
      line: 'Line 1',
      locationAr: 'منتصف خط الإنتاج 01',
      locationEn: 'Line 01 Mid-Station',
      iconType: 'wrench',
      moduleUrl: '/quality-shopfloor',
      moduleLabelAr: 'تسجيل صالة الإنتاج',
      lx: 590, ly: 70, lw: 140, lh: 85,
    },
    {
      id: 'STATION-TORQUE-BENCH',
      zone: 'assembly',
      zoneNameAr: 'خط التجميع - محطة عزم الربط',
      zoneNameEn: 'Assembly Line - Fastening Station',
      titleAr: 'محطة 3: عزم الربط والتثبيت الذكي',
      titleEn: 'Station 3: Smart Torque & Poka-Yoke',
      code: 'ASM-TRQ-03',
      line: 'Line 1',
      locationAr: 'محطة الربط والتحكم',
      locationEn: 'Fastening Control Gate',
      iconType: 'wrench',
      moduleUrl: '/spc',
      moduleLabelAr: 'كارتات التحكم الإحصائي SPC',
      lx: 750, ly: 70, lw: 140, lh: 85,
    },
    {
      id: 'STATION-PRESSURE-TEST',
      zone: 'assembly',
      zoneNameAr: 'خط التجميع - كابينة اختبار الأداء',
      zoneNameEn: 'Assembly Line - Pressure Testing Cell',
      titleAr: 'محطة 4: كابينة اختبار الضغط والأداء',
      titleEn: 'Station 4: Pressure & Leak Test Cell',
      code: 'TST-PRS-04',
      line: 'Line 1',
      locationAr: 'كابينة الاختبارات الهيدروليكية',
      locationEn: 'Hydraulic Test Cell',
      iconType: 'gauge',
      moduleUrl: '/quality-execution-board',
      moduleLabelAr: 'لوحة متابعة محطات الفحص',
      lx: 910, ly: 70, lw: 140, lh: 85,
    },
    {
      id: 'STATION-IPQC-GATE',
      zone: 'assembly',
      zoneNameAr: 'خط التجميع - بوابة فحص الجودة المرحلية',
      zoneNameEn: 'Assembly Line - In-Process Gate',
      titleAr: 'محطة 5: الفحص المرحلي IPQC',
      titleEn: 'Station 5: In-Process Quality Gate',
      code: 'GAT-IPQC-05',
      line: 'Line 1',
      locationAr: 'نهاية خط الإنتاج 01',
      locationEn: 'Line 01 Quality Clearance',
      iconType: 'gauge',
      moduleUrl: '/defect-log',
      moduleLabelAr: 'مسجل العيوب اليومية',
      lx: 1065, ly: 70, lw: 110, lh: 85,
    },

    // ------------------------------------------------------------------------
    // ZONE C: مختبر الجودة وغرفة مراجعة المواد (METROLOGY & MRB)
    // ------------------------------------------------------------------------
    {
      id: 'LAB-METROLOGY-CMM',
      zone: 'lab',
      zoneNameAr: 'مختبر القياس والمعايرة',
      zoneNameEn: 'Metrology & CMM Lab',
      titleAr: 'معمل القياس ثلاثي الأبعاد CMM',
      titleEn: 'CMM 3D Metrology Lab',
      code: 'LAB-CMM-01',
      line: 'Quality Lab',
      locationAr: 'المعمل المركزي المكيف',
      locationEn: 'Central Controlled Lab',
      iconType: 'lab',
      moduleUrl: '/compliance/hub/calibration',
      moduleLabelAr: 'المعايرة والأجهزة',
      lx: 430, ly: 220, lw: 230, lh: 95,
    },
    {
      id: 'ROOM-MRB-CAPA',
      zone: 'lab',
      zoneNameAr: 'غرفة مراجعة المواد وحل المشكلات',
      zoneNameEn: 'MRB Review & Problem Solving',
      titleAr: 'غرفة مراجعة المواد MRB و CAPA',
      titleEn: 'MRB Review & CAPA Center',
      code: 'MRB-WAR-01',
      line: 'Quality Assurance',
      locationAr: 'قاعة التحسين المستمر',
      locationEn: 'Continuous Improvement Center',
      iconType: 'lab',
      moduleUrl: '/quality/records/capa',
      moduleLabelAr: 'الإجراءات التصحيحية (CAPA)',
      lx: 680, ly: 220, lw: 230, lh: 95,
    },

    // ------------------------------------------------------------------------
    // ZONE D: الفحص النهائي والتغليف (FINAL OQC & PACKAGING)
    // ------------------------------------------------------------------------
    {
      id: 'BENCH-OQC-RELEASE',
      zone: 'oqc',
      zoneNameAr: 'الفحص النهائي قبل الشحن',
      zoneNameEn: 'Final Quality Release (OQC)',
      titleAr: 'منصة الفحص النهائي والإفراج OQC',
      titleEn: 'Final OQC Clearance Bench',
      code: 'BNC-OQC-01',
      line: 'Final Inspection',
      locationAr: 'بوابة الإفراج التام',
      locationEn: 'Final Release Gate',
      iconType: 'package',
      moduleUrl: '/outgoing-quality',
      moduleLabelAr: 'فحص المنتج النهائي (OQC)',
      lx: 430, ly: 350, lw: 230, lh: 95,
    },
    {
      id: 'STATION-PACKAGING',
      zone: 'oqc',
      zoneNameAr: 'منطقة التعبئة والباليتات',
      zoneNameEn: 'Packaging & Palletizing',
      titleAr: 'منطقة التعبئة وتجهيز الباليتات',
      titleEn: 'Packing & Finished Palletizing',
      code: 'ST-PCK-02',
      line: 'Packaging',
      locationAr: 'مدخل رصيف الشحن',
      locationEn: 'Pre-Shipping Buffer',
      iconType: 'package',
      moduleUrl: '/outgoing-quality',
      moduleLabelAr: 'فحص المنتج النهائي (OQC)',
      lx: 680, ly: 350, lw: 230, lh: 95,
    },

    // ------------------------------------------------------------------------
    // ZONE E: رصيف الشحن والتسليم للعميل (SHIPPING DOCK & DISPATCH)
    // ------------------------------------------------------------------------
    {
      id: 'DOCK-SHIPPING-03',
      zone: 'shipping',
      zoneNameAr: 'رصيف الشحن الخارجي 03',
      zoneNameEn: 'Shipping Dock Gate 03',
      titleAr: 'بوابة رصيف الشحن والتسليم 03',
      titleEn: 'Shipping Dock Gate 03',
      code: 'DCK-SHP-03',
      line: 'Shipping',
      locationAr: 'المخرج اللوجستي الشرقي',
      locationEn: 'East Logistics Gate',
      iconType: 'truck',
      moduleUrl: '/quality/records/complaints',
      moduleLabelAr: 'شكاوى العملاء والميدان',
      lx: 940, ly: 220, lw: 230, lh: 110,
    },
    {
      id: 'TRUCK-CUSTOMER-DELIVERY',
      zone: 'shipping',
      zoneNameAr: 'منطقة انتظار الشاحنات والتسليم',
      zoneNameEn: 'Customer Dispatch Staging',
      titleAr: 'ساحة شحن الطلبيات ومتابعة العميل',
      titleEn: 'Customer Delivery & Dispatch Area',
      code: 'TRK-DSP-01',
      line: 'Shipping',
      locationAr: 'ساحة النقل الخارجي',
      locationEn: 'Outbound Logistics Yard',
      iconType: 'truck',
      moduleUrl: '/quality/records/complaints',
      moduleLabelAr: 'شكاوى العملاء والميدان',
      lx: 940, ly: 350, lw: 230, lh: 95,
    }
  ], []);

  // Compute station status dynamically based on REAL records (Zero fake data)
  const stationStatuses = useMemo(() => {
    const map: Record<string, {
      status: 'pass' | 'alert' | 'warning';
      statusLabelAr: string;
      statusLabelEn: string;
      statusColor: string;
      defectCount: number;
      openNcrCount: number;
      activeCapaCount: number;
      matchedDefects: any[];
      matchedNcrs: any[];
    }> = {};

    stations.forEach(station => {
      // Find real defects matching this station or line
      const matchedDefects = realDefects.filter(d => {
        const lineMatch = d.productionLine && (
          station.line.toLowerCase().includes(d.productionLine.toLowerCase()) ||
          d.productionLine.toLowerCase().includes(station.line.toLowerCase())
        );
        const stationMatch = d.station && (
          station.titleAr.includes(d.station) ||
          station.titleEn.toLowerCase().includes(d.station.toLowerCase()) ||
          station.code.toLowerCase().includes(d.station.toLowerCase())
        );
        return lineMatch || stationMatch;
      });

      // Find real open NCRs
      const matchedNcrs = realNcrs.filter(n => {
        const isClosed = n.status === 'Closed' || n.status === 'Resolved';
        if (isClosed) return false;
        const lineMatch = n.productionLine && (
          station.line.toLowerCase().includes(n.productionLine.toLowerCase()) ||
          n.productionLine.toLowerCase().includes(station.line.toLowerCase())
        );
        const deptMatch = n.department && station.zoneNameAr.includes(n.department);
        return lineMatch || deptMatch;
      });

      const defectCount = matchedDefects.reduce((acc, d) => acc + (Number(d.quantity) || 1), 0);
      const openNcrCount = matchedNcrs.length;

      let status: 'pass' | 'alert' | 'warning' = 'pass';
      let statusLabelAr = 'تشغيل طبيعي';
      let statusLabelEn = 'Normal Operation';
      let statusColor = '#10B981'; // Green

      if (openNcrCount > 0) {
        status = 'alert';
        statusLabelAr = `${openNcrCount} تقرير عدم مطابقة مفتوح`;
        statusLabelEn = `${openNcrCount} Open NCR`;
        statusColor = '#EF4444'; // Red
      } else if (defectCount > 0) {
        status = 'warning';
        statusLabelAr = `${defectCount} عيوب مسجلة`;
        statusLabelEn = `${defectCount} Defects Logged`;
        statusColor = '#F59E0B'; // Amber
      }

      map[station.id] = {
        status,
        statusLabelAr,
        statusLabelEn,
        statusColor,
        defectCount,
        openNcrCount,
        activeCapaCount: 0,
        matchedDefects,
        matchedNcrs
      };
    });

    return map;
  }, [stations, realDefects, realNcrs]);

  // Overall Real Factory Metrics
  const summaryMetrics = useMemo(() => {
    let alertCount = 0;
    let normalCount = 0;
    stations.forEach(s => {
      const st = stationStatuses[s.id];
      if (st && st.status !== 'pass') alertCount++;
      else normalCount++;
    });

    return {
      totalStations: stations.length,
      normalCount,
      alertCount,
      totalRealDefects: realDefects.length,
      openNcrs: realNcrs.filter(n => n.status !== 'Closed' && n.status !== 'Resolved').length,
      activeCapas: realCapas.filter(c => c.status !== 'Closed' && c.status !== 'Completed').length,
      openComplaints: realComplaints.filter(c => c.status !== 'Closed').length
    };
  }, [stations, stationStatuses, realDefects, realNcrs, realCapas, realComplaints]);

  // Filtered stations for display
  const filteredStations = useMemo(() => {
    return stations.filter(station => {
      // Zone filter
      if (filterZone !== 'all' && station.zone !== filterZone) return false;

      // Status filter
      const st = stationStatuses[station.id];
      if (filterStatus === 'alerts-only' && st?.status === 'pass') return false;
      if (filterStatus === 'normal-only' && st?.status !== 'pass') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = station.titleAr.toLowerCase().includes(q) || station.titleEn.toLowerCase().includes(q);
        const matchCode = station.code.toLowerCase().includes(q);
        const matchZone = station.zoneNameAr.toLowerCase().includes(q) || station.zoneNameEn.toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchZone) return false;
      }

      return true;
    });
  }, [stations, stationStatuses, filterZone, filterStatus, searchQuery]);

  const selectedStation = useMemo(() => {
    return stations.find(s => s.id === selectedStationId) || stations[0];
  }, [stations, selectedStationId]);

  const selectedStatus = useMemo(() => {
    return selectedStation ? stationStatuses[selectedStation.id] : null;
  }, [selectedStation, stationStatuses]);

  // Station Icon Renderer
  const renderIcon = (type: string, className = 'w-5 h-5') => {
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
      className={`relative w-full ${isFullscreen ? 'h-screen fixed inset-0 z-50 bg-[#070b14]' : embedded ? 'h-[780px] min-h-[640px] rounded-3xl border border-amber-500/40 shadow-2xl' : 'h-[calc(100vh-80px)] min-h-[680px] max-h-[960px]'} bg-[#070b14] text-white flex flex-col font-sans overflow-hidden select-none ${className}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* ==================================================================== */}
      {/* 1. TOP INDUSTRIAL TOOLBAR & METRICS BAR                              */}
      {/* ==================================================================== */}
      <header className="flex-none px-4 py-2.5 bg-slate-900/95 border-b border-white/10 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-30">
        {/* Title & Plant Identifier */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
            <Factory className="w-5 h-5 text-slate-950 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-black text-white tracking-wide">
                {isAr ? 'خريطة صالة المصنع التفاعلية 2D' : 'Live Factory Plant Floor Layout'}
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {isAr ? 'بيانات حقيقية حية' : 'LIVE SYSTEM DATA'}
              </span>
            </div>
            <p className="text-[11px] text-white/50 hidden sm:block">
              {isAr ? 'مسقط أفقي هندسي لأرضية المصنع، الماكينات، مناطق الفحص ومسارات الإنتاج' : 'Physical 2D shopfloor blueprint: machines, testing stations, IQC, and dispatch'}
            </p>
          </div>
        </div>

        {/* Real KPI Pills */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs">
            <span className="text-white/50 text-[11px]">{isAr ? 'محطات المصنع:' : 'Stations:'}</span>
            <span className="font-black text-white">{summaryMetrics.totalStations}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-bold text-[11px]">{isAr ? 'تشغيل منتظم:' : 'Normal:'}</span>
            <span className="font-black">{summaryMetrics.normalCount}</span>
          </div>

          {summaryMetrics.alertCount > 0 ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-400 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              <span className="font-bold text-[11px]">{isAr ? 'تنبيهات جودة:' : 'Alerts:'}</span>
              <span className="font-black">{summaryMetrics.alertCount}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-white/60">
              <span className="text-[11px]">{isAr ? 'لا توجد تنبيهات' : 'Zero Alerts'}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70">
            <span className="text-white/40 text-[11px]">NCR:</span>
            <span className="font-black text-amber-400">{summaryMetrics.openNcrs}</span>
          </div>
        </div>

        {/* View Mode & Utility Actions */}
        <div className="flex items-center gap-1.5">
          {/* Switch View Mode: 2D Floorplan vs Grid */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('plant-layout')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                viewMode === 'plant-layout' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-white/60 hover:text-white'
              }`}
            >
              {isAr ? 'مسقط أفقي 2D' : '2D Blueprint'}
            </button>
            <button
              onClick={() => setViewMode('stations-grid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                viewMode === 'stations-grid' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-white/60 hover:text-white'
              }`}
            >
              {isAr ? 'قائمة المحطات' : 'Grid'}
            </button>
          </div>

          {/* Purge Demo Data Button */}
          <button
            onClick={handleManualPurge}
            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-white/60 hover:text-red-300 transition-all text-xs flex items-center gap-1"
            title={isAr ? 'تنظيف أي بيانات وهمية/تجريبية' : 'Purge any mock/demo data'}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isAr ? 'تنظيف التجريبي' : 'Clean Demo'}</span>
          </button>

          {/* Zoom controls */}
          <button
            onClick={() => setZoomLevel(prev => Math.max(0.7, prev - 0.1))}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
            title={isAr ? 'تصغير' : 'Zoom Out'}
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.1))}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
            title={isAr ? 'تكبير' : 'Zoom In'}
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => setZoomLevel(1)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
            title={isAr ? 'إعادة ضبط' : 'Reset View'}
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

          {embedded && (
            <button
              onClick={() => navigate('/quality-control-tower')}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
              title={isAr ? 'فتح في صفحة كاملة مخصصة' : 'Open in Dedicated Page'}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isAr ? 'صفحة مخصصة' : 'Full Page'}</span>
            </button>
          )}
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. FILTER & ZONE BAR                                                 */}
      {/* ==================================================================== */}
      <div className="flex-none px-4 py-2 bg-slate-950/80 border-b border-white/5 flex flex-wrap items-center justify-between gap-2 z-20">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
          <span className="text-[11px] font-bold text-white/40 mr-1">{isAr ? 'المناطق:' : 'Zones:'}</span>
          {[
            { id: 'all', labelAr: 'كل المصنع', labelEn: 'All Zones' },
            { id: 'receiving', labelAr: 'الاستلام والخامات', labelEn: 'Receiving' },
            { id: 'assembly', labelAr: 'صالة الإنتاج والتجميع', labelEn: 'Assembly' },
            { id: 'lab', labelAr: 'مختبر الجودة والـ MRB', labelEn: 'Quality Lab' },
            { id: 'oqc', labelAr: 'الفحص النهائي والتغليف', labelEn: 'Final OQC' },
            { id: 'shipping', labelAr: 'رصيف الشحن والتسليم', labelEn: 'Shipping' },
          ].map(z => (
            <button
              key={z.id}
              onClick={() => setFilterZone(z.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterZone === z.id 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {isAr ? z.labelAr : z.labelEn}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2 py-0.5 rounded-lg font-bold ${filterStatus === 'all' ? 'bg-white/10 text-white' : 'text-white/50'}`}
            >
              {isAr ? 'الكل' : 'All'}
            </button>
            <button
              onClick={() => setFilterStatus('alerts-only')}
              className={`px-2 py-0.5 rounded-lg font-bold ${filterStatus === 'alerts-only' ? 'bg-red-500/20 text-red-400' : 'text-white/50'}`}
            >
              {isAr ? 'تنبيهات فقط' : 'Alerts'}
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث عن ماكينة أو محطة...' : 'Search station...'}
              className="bg-white/5 border border-white/10 rounded-xl pr-8 pl-3 py-1 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-500/50 w-40 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. MAIN FLOORPLAN WORKSPACE OR GRID VIEW                             */}
      {/* ==================================================================== */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex">
        {viewMode === 'plant-layout' ? (
          /* ================================================================ */
          /* 2D ARCHITECTURAL FLOORPLAN CANVAS                                */
          /* ================================================================ */
          <div className="relative flex-1 w-full h-full overflow-auto flex items-center justify-center p-3 bg-[#060a12] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]">
            <div 
              className="relative w-[1200px] h-[720px] transition-transform duration-300 origin-center rounded-3xl border-2 border-slate-700/80 bg-[#09101d] shadow-2xl shadow-black/80 shrink-0"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* Floorplan Background Blueprint SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  {/* Yellow safety diagonal walkway pattern */}
                  <pattern id="safety-walkway" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="10" height="20" fill="#f59e0b" fillOpacity="0.12" />
                    <rect x="10" width="10" height="20" fill="#000000" fillOpacity="0.4" />
                  </pattern>

                  {/* Red quarantine hazard pattern */}
                  <pattern id="quarantine-hazard" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="8" height="16" fill="#ef4444" fillOpacity="0.2" />
                    <rect x="8" width="8" height="16" fill="#180000" fillOpacity="0.4" />
                  </pattern>

                  {/* Conveyor belt roller texture */}
                  <pattern id="conveyor-rollers" width="12" height="20" patternUnits="userSpaceOnUse">
                    <rect width="12" height="20" fill="#1e293b" />
                    <line x1="6" y1="0" x2="6" y2="20" stroke="#334155" strokeWidth="2" />
                  </pattern>

                  {/* Green material flow marker */}
                  <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#10B981" />
                  </marker>
                </defs>

                {/* Outer Plant Floor Boundary */}
                <rect x="15" y="15" width="1170" height="690" fill="none" stroke="#334155" strokeWidth="4" rx="16" />

                {/* ZONE DIVIDERS */}
                {/* Zone A: Receiving Boundary (Vertical line at x=400) */}
                <line x1="400" y1="15" x2="400" y2="705" stroke="#334155" strokeWidth="3" strokeDasharray="12,8" />

                {/* Zone B: Assembly Bottom Divider (Horizontal line at y=190) */}
                <line x1="400" y1="190" x2="1185" y2="190" stroke="#334155" strokeWidth="3" strokeDasharray="12,8" />

                {/* Zone C & D Divider (Horizontal line at y=330) */}
                <line x1="400" y1="330" x2="1185" y2="330" stroke="#334155" strokeWidth="3" strokeDasharray="12,8" />

                {/* Zone E: Shipping Boundary (Vertical line at x=925) */}
                <line x1="925" y1="190" x2="925" y2="705" stroke="#334155" strokeWidth="3" strokeDasharray="12,8" />

                {/* PEDESTRIAN SAFETY WALKWAYS */}
                {/* Main East-West Walkway */}
                <rect x="400" y="465" width="785" height="30" fill="url(#safety-walkway)" stroke="#F59E0B" strokeWidth="1" opacity="0.8" />
                {/* Receiving North-South Walkway */}
                <rect x="380" y="15" width="20" height="690" fill="url(#safety-walkway)" stroke="#F59E0B" strokeWidth="1" opacity="0.8" />

                {/* RED QUARANTINE HAZARD FLOOR IN RECEIVING */}
                <rect x="35" y="140" width="170" height="90" fill="url(#quarantine-hazard)" stroke="#EF4444" strokeWidth="1.5" rx="8" />

                {/* SHOPFLOOR CONVEYOR BELT (LINE 01) */}
                <rect x="420" y="105" width="750" height="20" fill="url(#conveyor-rollers)" stroke="#475569" strokeWidth="2" rx="4" />
                <path d="M 430 115 L 1160 115" stroke="#38bdf8" strokeWidth="2" strokeDasharray="8,6" />

                {/* MATERIAL FLOW ARROWS THROUGH STATIONS */}
                <path d="M 380 90 L 420 90" fill="none" stroke="#10B981" strokeWidth="3" markerEnd="url(#arrow-green)" />
                <path d="M 1170 115 L 1170 360 L 925 360" fill="none" stroke="#10B981" strokeWidth="3" strokeDasharray="6,4" markerEnd="url(#arrow-green)" />

                {/* GATES & DOORS */}
                {/* Dock 01 Door */}
                <rect x="18" y="60" width="8" height="55" fill="#f59e0b" rx="2" />
                <text x="30" y="45" fill="#f59e0b" fontSize="10" fontWeight="bold">بوابة استلام 01</text>

                {/* Dock 03 Door */}
                <rect x="1174" y="240" width="8" height="60" fill="#10b981" rx="2" />
                <text x="1165" y="230" fill="#10b981" fontSize="10" fontWeight="bold" textAnchor="end">بوابة شحن 03</text>
              </svg>

              {/* ZONE HEADERS */}
              <div className="absolute top-5 right-5 pointer-events-none z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1 rounded-xl shadow-md">
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-black text-amber-400 uppercase">المنطقة A: رصيف الاستلام والمواد الخام</span>
              </div>

              <div className="absolute top-5 left-[420px] pointer-events-none z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1 rounded-xl shadow-md">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] font-black text-blue-400 uppercase">المنطقة B: صالة الإنتاج وخط التجميع 01</span>
              </div>

              <div className="absolute top-[200px] left-[420px] pointer-events-none z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1 rounded-xl shadow-md">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[11px] font-black text-purple-400 uppercase">المنطقة C: مختبر الجودة وغرفة الـ MRB</span>
              </div>

              <div className="absolute top-[330px] left-[420px] pointer-events-none z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1 rounded-xl shadow-md">
                <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-black text-emerald-400 uppercase">المنطقة D: الفحص النهائي OQC والتغليف</span>
              </div>

              <div className="absolute top-[200px] right-6 pointer-events-none z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1 rounded-xl shadow-md">
                <Truck className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] font-black text-cyan-400 uppercase">المنطقة E: رصيف الشحن والتسليم</span>
              </div>

              {/* RENDER STATIONS ON THE FLOORPLAN */}
              {filteredStations.map(station => {
                const st = stationStatuses[station.id];
                const isSelected = selectedStationId === station.id;
                const isAlert = st?.status === 'alert';
                const isWarning = st?.status === 'warning';

                return (
                  <div
                    key={station.id}
                    onClick={() => setSelectedStationId(station.id)}
                    style={{
                      left: `${station.lx}px`,
                      top: `${station.ly}px`,
                      width: `${station.lw}px`,
                      height: `${station.lh}px`,
                    }}
                    className={`
                      absolute rounded-2xl cursor-pointer transition-all duration-300 p-2.5 flex flex-col justify-between
                      ${isSelected 
                        ? 'ring-2 ring-amber-400 bg-slate-800/95 shadow-xl shadow-amber-500/20 z-20 scale-[1.03]' 
                        : isAlert
                          ? 'border-2 border-red-500 bg-red-950/40 shadow-lg shadow-red-500/30 animate-pulse z-15'
                          : isWarning
                            ? 'border border-amber-500/60 bg-amber-950/30 z-10'
                            : 'border border-slate-700/80 bg-slate-900/85 hover:border-slate-500 hover:bg-slate-800/90 z-10'
                      }
                    `}
                  >
                    {/* Top Row: Station Code & Status Indicator */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`p-1 rounded-lg ${isAlert ? 'bg-red-500/20 text-red-400' : isWarning ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white/80'}`}>
                          {renderIcon(station.iconType, 'w-3.5 h-3.5')}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-white/50">{station.code}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: st?.statusColor || '#10B981' }} 
                        />
                        <span className="text-[9px] font-black uppercase" style={{ color: st?.statusColor || '#10B981' }}>
                          {isAr ? (isAlert ? 'إيقاف' : isWarning ? 'تنبيه' : 'طبيعي') : (isAlert ? 'STOP' : isWarning ? 'WARN' : 'OK')}
                        </span>
                      </div>
                    </div>

                    {/* Station Title */}
                    <div>
                      <h4 className="text-xs font-black text-white leading-tight truncate">
                        {isAr ? station.titleAr : station.titleEn}
                      </h4>
                      <p className="text-[10px] text-white/40 truncate">
                        {isAr ? station.locationAr : station.locationEn}
                      </p>
                    </div>

                    {/* Bottom Status / Real Records Alert Count */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[9px]">
                      <span className="text-white/50">{station.line}</span>
                      {st && (st.openNcrCount > 0 || st.defectCount > 0) ? (
                        <span className="font-black text-amber-300">
                          {st.openNcrCount > 0 ? `${st.openNcrCount} NCR` : `${st.defectCount} عيوب`}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold">100% Pass</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ================================================================ */
          /* STATIONS GRID / FLOW MATRIX VIEW                                 */
          /* ================================================================ */
          <div className="flex-1 w-full h-full overflow-y-auto p-4 md:p-6 bg-[#060a12]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStations.map(station => {
                const st = stationStatuses[station.id];
                const isSelected = selectedStationId === station.id;
                const isAlert = st?.status === 'alert';

                return (
                  <div
                    key={station.id}
                    onClick={() => setSelectedStationId(station.id)}
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
                            {renderIcon(station.iconType, 'w-4 h-4')}
                          </span>
                          <div>
                            <span className="text-[10px] font-mono text-white/40 block">{station.code}</span>
                            <span className="text-xs font-black text-white">{isAr ? station.titleAr : station.titleEn}</span>
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

                      <div className="space-y-1 text-xs text-white/60 mb-4">
                        <div className="flex justify-between">
                          <span className="text-white/40">{isAr ? 'المنطقة:' : 'Zone:'}</span>
                          <span className="font-bold">{isAr ? station.zoneNameAr : station.zoneNameEn}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/40">{isAr ? 'الخط:' : 'Line:'}</span>
                          <span className="font-bold">{station.line}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-white/40">{isAr ? 'العيوب المسجلة:' : 'Defects:'} {st?.defectCount || 0}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(station.moduleUrl);
                        }}
                        className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                      >
                        <span>{station.moduleLabelAr}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* 4. STATION INSPECTOR SLIDE-OVER COCKPIT                            */}
        {/* ================================================================== */}
        {selectedStation && (
          <aside className="w-80 md:w-96 flex-none bg-slate-900/95 border-r border-white/10 backdrop-blur-md flex flex-col z-30 shadow-2xl overflow-y-auto">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  {renderIcon(selectedStation.iconType, 'w-5 h-5')}
                </span>
                <div>
                  <h3 className="text-sm font-black text-white leading-tight">
                    {isAr ? selectedStation.titleAr : selectedStation.titleEn}
                  </h3>
                  <span className="text-[10px] font-mono text-white/40">{selectedStation.code}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedStationId(null)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Details */}
            <div className="p-4 space-y-5 flex-1">
              {/* Station Status Box */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white/50">{isAr ? 'حالة جودة المحطة الحية:' : 'Live Station Status:'}</span>
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

                <div className="text-xs text-white/70">
                  {selectedStatus && selectedStatus.status === 'pass' ? (
                    <p className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{isAr ? 'المحطة تعمل بكفاءة طبيعية، ولا توجد أي بلاغات جودة أو تقارير عدم مطابقة مفتوحة.' : 'Operating normally with zero active defects.'}</span>
                    </p>
                  ) : (
                    <p className="flex items-center gap-1.5 text-amber-400 text-[11px] font-medium">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{isAr ? 'يوجد بلاغات جودة أو عيوب مسجلة على هذا الخط تتطلب المتابعة الفورية.' : 'Active quality alerts detected on this station.'}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Station Specs & Hierarchy */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-white/40 block">
                  {isAr ? 'بيانات الموقع والمسار' : 'Location & Routing'}
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-white/40 text-[10px] block">{isAr ? 'المنطقة:' : 'Zone:'}</span>
                    <span className="font-bold text-white">{isAr ? selectedStation.zoneNameAr : selectedStation.zoneNameEn}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-white/40 text-[10px] block">{isAr ? 'خط الإنتاج:' : 'Line:'}</span>
                    <span className="font-bold text-white">{selectedStation.line}</span>
                  </div>
                  <div className="col-span-2 p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-white/40 text-[10px] block">{isAr ? 'الموقع الفعلي:' : 'Physical Location:'}</span>
                    <span className="font-bold text-white">{isAr ? selectedStation.locationAr : selectedStation.locationEn}</span>
                  </div>
                </div>
              </div>

              {/* Live Real Records List */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-white/40 block">
                  {isAr ? 'سجلات النظام الحقيقية المرتبطة' : 'Connected Real Records'}
                </span>

                {selectedStatus && selectedStatus.matchedDefects.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {selectedStatus.matchedDefects.map((d, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex justify-between items-center">
                        <div>
                          <span className="font-bold text-amber-300 block">{d.defectType || d.type || 'عيب مصنعي'}</span>
                          <span className="text-[10px] text-white/40">{d.date || d.createdAt || 'اليوم'} - {d.partNameAtTime || d.partNumber || 'قطعة عامة'}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black">
                          الكمية: {d.quantity || 1}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center text-xs text-white/40">
                    {isAr ? 'لا توجد سجلات عيوب مسجلة على هذه المحطة' : 'No defect records on this station'}
                  </div>
                )}
              </div>

              {/* Direct Deep Actions */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className="text-[10px] font-black uppercase tracking-wider text-white/40 block">
                  {isAr ? 'إجراءات الجودة السريعة للمحطة' : 'Quick Station Quality Actions'}
                </span>

                <div className="space-y-1.5">
                  <button
                    onClick={() => navigate(selectedStation.moduleUrl)}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <span>{isAr ? `الانتقال إلى ${selectedStation.moduleLabelAr}` : `Open ${selectedStation.moduleLabelAr}`}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => navigate('/quality-shopfloor')}
                    className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center justify-between transition-colors"
                  >
                    <span>{isAr ? '📝 تسجيل عيب سريع على هذه المحطة' : 'Fast Shopfloor Entry'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white/40" />
                  </button>

                  <button
                    onClick={() => navigate('/quality/records/ncr')}
                    className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center justify-between transition-colors"
                  >
                    <span>{isAr ? '⚠️ إصدار تقرير عدم مطابقة NCR' : 'Create NCR Report'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white/40" />
                  </button>

                  <button
                    onClick={() => navigate('/spc')}
                    className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center justify-between transition-colors"
                  >
                    <span>{isAr ? '📊 كارتات التحكم الإحصائي SPC' : 'Open SPC Control Charts'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white/40" />
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
