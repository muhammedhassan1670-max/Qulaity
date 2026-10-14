// @ts-nocheck
// QMS Enterprise 4.0 - Advanced Industrial SCADA / MES Digital Twin & Plant Floor Operating System
// Next-Level Upgrades:
// 1. Multi-Angle 3D Camera Controller (Iso-NW, Iso-NE, Elevation, 2D Top-Down)
// 2. Autonomous AGV Robotic Transporters navigating aisles with hazard beacons
// 3. Holographic Vertical Laser Warning Beacons shooting into 3D space
// 4. Live Sensor Oscilloscope & IoT Telemetry Waveforms on every machine pod
// 5. 3 Ambient Floor Lighting Modes (Cyber-Dark, Cleanroom Epoxy White, Night-Shift Spotlights)
// 6. Running Executive Production & Zero-Accident Ticker Bar
// 7. True Drag & Drop with Magnetic Snap, Heatmaps, and Digital Andon Cord Pull
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Factory, CheckCircle2, AlertTriangle, XCircle, Search, RefreshCw, 
  ExternalLink, Cpu, Wrench, PackageCheck, Truck, X, Layers, Activity, 
  Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, Box, Gauge, Radio, 
  ArrowRight, Trash2, ShieldAlert, ShieldCheck, ChevronRight, Edit3, Plus,
  Sliders, Settings2, Save, Download, Upload, ArrowUp, ArrowDown, ArrowLeft,
  Sparkles, SlidersHorizontal, Flame, Play, Pause, Bell, BellRing, Move,
  Eye, Compass, Volume2, VolumeX, BarChart3, Zap, Moon, Sun, Shield,
  Navigation, Bot
} from 'lucide-react';
import { useTranslation } from '../../utils/translations';
import { loadSafeLocalDefectRecords } from '../../services/safeDefectStorage';
import { unifiedNcrApi, unifiedCapaApi, unifiedEightDApi, unifiedComplaintsApi } from '../../api/unified-api';
import { purgeAllDemoSimulationData } from '../../services/cleanDemoData';

export type StationZone = 'receiving' | 'assembly' | 'lab' | 'oqc' | 'shipping';
export type ViewMode = 'scada-floorplan' | 'stations-grid' | 'customize-table';
export type FilterStatus = 'all' | 'alerts-only' | 'normal-only';
export type CameraPreset = 'iso-nw' | 'iso-ne' | 'elevation' | 'top-down';
export type AmbientTheme = 'cyber-dark' | 'cleanroom' | 'night-shift';

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
  oeeEstimate?: number;
  fpyEstimate?: number;
  activeOperator?: string;
  vibrationMmS?: number;
  temperatureC?: number;
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
    oeeEstimate: 96,
    fpyEstimate: 99.1,
    activeOperator: 'فني الاستلام المناوب',
    vibrationMmS: 0.08,
    temperatureC: 22,
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
    oeeEstimate: 94,
    fpyEstimate: 98.4,
    activeOperator: 'مهندس فحص الخامات',
    vibrationMmS: 0.12,
    temperatureC: 23,
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
    oeeEstimate: 100,
    fpyEstimate: 100,
    activeOperator: 'أمين العزل والحجر',
    vibrationMmS: 0.02,
    temperatureC: 21,
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
    oeeEstimate: 98,
    fpyEstimate: 99.8,
    activeOperator: 'مشرف المستودع',
    vibrationMmS: 0.04,
    temperatureC: 21,
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
    oeeEstimate: 91,
    fpyEstimate: 97.5,
    activeOperator: 'مشغل CNC معتمد',
    vibrationMmS: 0.28,
    temperatureC: 44,
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
    oeeEstimate: 93,
    fpyEstimate: 98.9,
    activeOperator: 'فني تجميع ميكانيكي',
    vibrationMmS: 0.14,
    temperatureC: 28,
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
    oeeEstimate: 97,
    fpyEstimate: 99.4,
    activeOperator: 'فني ربط المعايرة',
    vibrationMmS: 0.09,
    temperatureC: 25,
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
    oeeEstimate: 89,
    fpyEstimate: 96.2,
    activeOperator: 'مهندس اختبارات هيدروليكية',
    vibrationMmS: 0.32,
    temperatureC: 38,
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
    oeeEstimate: 95,
    fpyEstimate: 98.7,
    activeOperator: 'مفتش جودة مرحلي IPQC',
    vibrationMmS: 0.08,
    temperatureC: 24,
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
    oeeEstimate: 98,
    fpyEstimate: 99.6,
    activeOperator: 'أخصائي قياسات CMM',
    vibrationMmS: 0.01,
    temperatureC: 20,
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
    oeeEstimate: 92,
    fpyEstimate: 95.0,
    activeOperator: 'مدير توكيد الجودة QA',
    vibrationMmS: 0.01,
    temperatureC: 22,
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
    oeeEstimate: 97,
    fpyEstimate: 99.5,
    activeOperator: 'مفتش الإفراج النهائي OQC',
    vibrationMmS: 0.06,
    temperatureC: 23,
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
    oeeEstimate: 94,
    fpyEstimate: 98.8,
    activeOperator: 'مشرف التعبئة والرص',
    vibrationMmS: 0.18,
    temperatureC: 26,
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
    oeeEstimate: 99,
    fpyEstimate: 100,
    activeOperator: 'أمين رصيف الشحن',
    vibrationMmS: 0.05,
    temperatureC: 25,
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
    oeeEstimate: 99,
    fpyEstimate: 100,
    activeOperator: 'سائق الشحن المعتمد',
    vibrationMmS: 0.02,
    temperatureC: 27,
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

// Synthesize industrial dual-tone chime using Web Audio API
function playIndustrialChime(type: 'alert' | 'success' | 'camera' = 'alert') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';

    if (type === 'alert') {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.38);
    } else if (type === 'camera') {
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(480, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } else {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    }
  } catch (e) {}
}

export function QualityControlTower({ embedded = false, className = '' }: QualityControlTowerProps = {}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useTranslation();
  const isAr = language === 'ar';

  // Dynamic Equipment Pods State
  const [equipmentList, setEquipmentList] = useState<ScadaEquipment[]>(loadSavedEquipment);
  
  // View Modes & Advanced Perspectives
  const initialMode: ViewMode = (searchParams.get('mode') === 'customize' || searchParams.get('tab') === 'customize')
    ? 'customize-table'
    : 'scada-floorplan';

  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
  
  // Multi-Angle 3D Camera Controls
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso-nw'); // 'iso-nw' | 'iso-ne' | 'elevation' | 'top-down'
  const is3D = cameraPreset !== 'top-down';

  // Floor Lighting Ambience
  const [ambientTheme, setAmbientTheme] = useState<AmbientTheme>('cyber-dark'); // 'cyber-dark' | 'cleanroom' | 'night-shift'
  
  // Toggles
  const [isHeatmapActive, setIsHeatmapActive] = useState(false);
  const [isMaterialFlowActive, setIsMaterialFlowActive] = useState(true);
  const [isAgvActive, setIsAgvActive] = useState(true);
  const [showOscilloscope, setShowOscilloscope] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Customization & Interactive Drag and Drop State
  const [isCustomizing, setIsCustomizing] = useState(searchParams.get('mode') === 'customize');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ pointerX: number; pointerY: number; initX: number; initY: number } | null>(null);

  // Station Editing & Andon Hold State
  const [editingStation, setEditingStation] = useState<ScadaEquipment | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [andonHolds, setAndonHolds] = useState<Record<string, { active: boolean; operator: string; timestamp: string }>>({});

  const [filterZone, setFilterZone] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStationId, setSelectedStationId] = useState<string | null>('STATION-PRESSURE-TEST');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
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

  const changeCameraPreset = (preset: CameraPreset) => {
    setCameraPreset(preset);
    if (soundEnabled) playIndustrialChime('camera');
  };

  // 3D Transform calculations based on camera preset
  const getCameraTransform = () => {
    if (viewMode !== 'scada-floorplan') return 'none';
    switch (cameraPreset) {
      case 'iso-nw':
        return `rotateX(52deg) rotateZ(-28deg) scale(${zoomLevel * 0.9})`;
      case 'iso-ne':
        return `rotateX(52deg) rotateZ(28deg) scale(${zoomLevel * 0.9})`;
      case 'elevation':
        return `rotateX(68deg) rotateZ(0deg) scale(${zoomLevel * 0.95})`;
      case 'top-down':
      default:
        return `scale(${zoomLevel})`;
    }
  };

  // True Drag & Drop Pointer Events
  const handlePointerDown = (e: React.PointerEvent, station: ScadaEquipment) => {
    if (!isCustomizing) return;
    e.stopPropagation();
    e.preventDefault();
    setDraggingId(station.id);
    setDragStart({
      pointerX: e.clientX,
      pointerY: e.clientY,
      initX: station.x,
      initY: station.y
    });
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !dragStart) return;
    const deltaX = (e.clientX - dragStart.pointerX) / zoomLevel;
    const deltaY = (e.clientY - dragStart.pointerY) / zoomLevel;
    
    // Magnetic Snap to 10px Grid
    const snap = (v: number) => Math.round(v / 10) * 10;

    setEquipmentList(prev => {
      const target = prev.find(item => item.id === draggingId);
      if (!target) return prev;
      const nextX = Math.max(20, Math.min(1180 - target.w, snap(dragStart.initX + deltaX)));
      const nextY = Math.max(30, Math.min(620 - target.h, snap(dragStart.initY + deltaY)));
      return prev.map(item => item.id === draggingId ? { ...item, x: nextX, y: nextY } : item);
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
      setDraggingId(null);
      setDragStart(null);
      try {
        localStorage.setItem(SCADA_STORAGE_KEY, JSON.stringify(equipmentList));
      } catch (err) {}
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
    if (soundEnabled) playIndustrialChime('success');
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

  // Digital Andon Cord Trigger (Emergency Pull)
  const toggleAndonPull = (stationId: string) => {
    const isCurrentlyHeld = andonHolds[stationId]?.active;
    if (!isCurrentlyHeld) {
      if (soundEnabled) playIndustrialChime('alert');
      setAndonHolds(prev => ({
        ...prev,
        [stationId]: {
          active: true,
          operator: 'مشغل الخط الحالي',
          timestamp: new Date().toLocaleTimeString('ar-EG')
        }
      }));
      toast.error(isAr ? '🚨 تم سحب حبل الأندون! الخط في حالة استدعاء طارئ للجودة' : '🚨 Andon Cord Pulled! Emergency Quality Call Active');
    } else {
      if (soundEnabled) playIndustrialChime('success');
      setAndonHolds(prev => {
        const next = { ...prev };
        delete next[stationId];
        return next;
      });
      toast.success(isAr ? '✓ تم إغلاق استدعاء الأندون وإعادة التشغيل' : '✓ Andon alert cleared. Station resumed.');
    }
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
      status: 'pass' | 'warning' | 'alert' | 'andon';
      statusLabelAr: string;
      statusLabelEn: string;
      statusColor: string;
      defectCount: number;
      openNcrCount: number;
      matchedDefects: any[];
      matchedNcrs: any[];
      isAndonActive: boolean;
    }> = {};

    equipmentList.forEach(eq => {
      const isAndonActive = Boolean(andonHolds[eq.id]?.active);

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
      let status: 'pass' | 'warning' | 'alert' | 'andon' = 'pass';
      let statusLabelAr = 'تشغيل طبيعي';
      let statusLabelEn = 'Normal Operational';
      let statusColor = '#10B981'; // Green

      if (isAndonActive) {
        status = 'andon';
        statusLabelAr = '🚨 توقف أندون طارئ';
        statusLabelEn = '🚨 Andon Cord Pulled';
        statusColor = '#EC4899'; // Bright Pink/Magenta
      } else if (openNcrCount > 0) {
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
        matchedNcrs,
        isAndonActive
      };
    });

    return map;
  }, [equipmentList, realDefects, realNcrs, andonHolds]);

  // Overall Factory Real KPIs
  const summaryMetrics = useMemo(() => {
    let alertCount = 0;
    let normalCount = 0;
    let andonCount = 0;
    equipmentList.forEach(eq => {
      const st = stationStatuses[eq.id];
      if (st?.isAndonActive) andonCount++;
      else if (st && st.status !== 'pass') alertCount++;
      else normalCount++;
    });

    return {
      totalStations: equipmentList.length,
      normalCount,
      alertCount,
      andonCount,
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

  const handleAddNewTemplate = (preferredZone: StationZone = 'assembly') => {
    setIsAddingNew(true);
    setEditingStation({
      id: `STATION-CUSTOM-${Date.now().toString().slice(-4)}`,
      code: `EQ-0${equipmentList.length + 1}`,
      zone: preferredZone,
      zoneNameAr: preferredZone === 'receiving' ? 'عنبر الاستلام A' : preferredZone === 'lab' ? 'مركز الجودة C' : preferredZone === 'oqc' ? 'عنبر الإفراج D' : preferredZone === 'shipping' ? 'عنبر الشحن E' : 'خط التجميع 01',
      zoneNameEn: preferredZone === 'receiving' ? 'Receiving Bay A' : preferredZone === 'lab' ? 'Quality Hub C' : preferredZone === 'oqc' ? 'OQC Bay D' : preferredZone === 'shipping' ? 'Shipping Bay E' : 'Assembly Line 01',
      titleAr: `محطة جديدة ${equipmentList.length + 1}`,
      titleEn: `New Workstation ${equipmentList.length + 1}`,
      line: 'Line 1',
      locationAr: 'صالة الإنتاج الرئيسية',
      locationEn: 'Main Shopfloor',
      iconType: 'machine',
      moduleUrl: '/quality-shopfloor',
      moduleLabelAr: 'تسجيل صالة الإنتاج',
      oeeEstimate: 95,
      fpyEstimate: 98.5,
      activeOperator: 'مشغل الخط',
      vibrationMmS: 0.12,
      temperatureC: 25,
      x: preferredZone === 'receiving' ? 35 : preferredZone === 'lab' ? 450 : preferredZone === 'oqc' || preferredZone === 'shipping' ? 895 : 480,
      y: preferredZone === 'lab' ? 470 : preferredZone === 'shipping' ? 350 : 200,
      w: 160,
      h: 105
    });
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full ${isFullscreen ? 'h-screen fixed inset-0 z-50' : embedded ? 'h-[820px] min-h-[680px] rounded-3xl border-2 border-amber-500/50 shadow-2xl' : 'h-[calc(100vh-80px)] min-h-[720px] max-h-[980px]'} ${
        ambientTheme === 'cleanroom' 
          ? 'bg-[#0f172a] text-slate-100' 
          : ambientTheme === 'night-shift' 
            ? 'bg-[#020408] text-white' 
            : 'bg-[#060a13] text-white'
      } flex flex-col font-sans overflow-hidden select-none ${className}`}
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
      {/* 1. SCADA INDUSTRIAL TOP HEADER: MULTI-ANGLE CAMERA & THEMES          */}
      {/* ==================================================================== */}
      <header className="flex-none px-4 py-2 bg-[#090f1d] border-b border-white/10 backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5 z-30 shadow-md">
        {/* Plant Title & Perspective Badges */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
            <Factory className="w-4 h-4 text-slate-950 font-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs md:text-sm font-black text-white tracking-wide">
                {isAr ? 'لوحة تحكم صالة المصنع (SCADA / MES Digital Twin)' : 'SCADA / MES Digital Twin Floor'}
              </h1>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                <Compass className="w-2.5 h-2.5 text-cyan-400" />
                <span>{cameraPreset.toUpperCase()}</span>
              </span>
              {isHeatmapActive && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  <Flame className="w-2.5 h-2.5 text-rose-400 animate-bounce" />
                  <span>HEATMAP</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              {isAr ? 'محاكاة ثلاثية الأبعاد: تحكم في زوايا الرؤية، سحب وإفلات، حركة روبوتات AGV، وموجات قياس حية' : 'Full 3D SCADA: Camera angles, drag & drop, AGV robotics, live oscilloscopes & laser beacons'}
            </p>
          </div>
        </div>

        {/* HIGH-TECH MULTI-ANGLE CAMERA PRESET SWITCHER */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 px-1 hidden md:inline">{isAr ? 'الكاميرا:' : 'Camera:'}</span>
          {[
            { id: 'iso-nw', labelAr: '📐 آيزومترك N', labelEn: 'Iso NW' },
            { id: 'iso-ne', labelAr: '📐 آيزومترك E', labelEn: 'Iso NE' },
            { id: 'elevation', labelAr: '👁️ مسقط أمامي', labelEn: 'Elevation' },
            { id: 'top-down', labelAr: 'مسقط 2D', labelEn: '2D Flat' },
          ].map(cam => (
            <button
              key={cam.id}
              onClick={() => changeCameraPreset(cam.id as CameraPreset)}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                cameraPreset === cam.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 scale-105'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {isAr ? cam.labelAr : cam.labelEn}
            </button>
          ))}
        </div>

        {/* AMBIENT THEMES SWITCHER (Cyber-Dark vs Cleanroom vs Night-Shift) */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setAmbientTheme('cyber-dark')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
              ambientTheme === 'cyber-dark' ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="النمط الصناعي السيبراني الداكن"
          >
            <Moon className="w-3 h-3 inline mr-1" />
            <span className="text-[10px] hidden lg:inline">{isAr ? 'سيبراني' : 'Cyber'}</span>
          </button>
          <button
            onClick={() => setAmbientTheme('cleanroom')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
              ambientTheme === 'cleanroom' ? 'bg-sky-500 text-slate-950 shadow-sm font-black' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="نمط الغرف النظيفة الأبيض (Cleanroom Epoxy)"
          >
            <Sun className="w-3 h-3 inline mr-1" />
            <span className="text-[10px] hidden lg:inline">{isAr ? 'غرفة نظيفة' : 'Cleanroom'}</span>
          </button>
          <button
            onClick={() => setAmbientTheme('night-shift')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
              ambientTheme === 'night-shift' ? 'bg-amber-500 text-slate-950 shadow-sm font-black' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="نمط وردية الليل مع كشافات سبوت لايت"
          >
            <Sparkles className="w-3 h-3 inline mr-1" />
            <span className="text-[10px] hidden lg:inline">{isAr ? 'وردية الليل' : 'Spotlight'}</span>
          </button>
        </div>

        {/* INTERACTIVE CONTROLS: DRAG, HEATMAP, AGV, SOUND */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* True Drag & Drop Customize Button */}
          <button
            onClick={() => {
              if (viewMode === 'customize-table') {
                setViewMode('scada-floorplan');
              } else {
                setIsCustomizing(prev => !prev);
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
              isCustomizing || viewMode === 'customize-table'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 ring-2 ring-amber-300 shadow-amber-500/40 scale-105'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/25 ring-1 ring-amber-400'
            }`}
            title={isAr ? 'تفعيل السحب والإفلات وتخصيص الماكينات' : 'Toggle Drag & Drop Floor Editor'}
          >
            <Move className="w-3.5 h-3.5" />
            <span>
              {isCustomizing 
                ? (isAr ? '✓ إنهاء السحب' : '✓ Done') 
                : (isAr ? '✋ سحب حر (Drag)' : '✋ Drag & Drop')}
            </span>
          </button>

          {/* AGV Robots Toggle */}
          <button
            onClick={() => setIsAgvActive(prev => !prev)}
            className={`p-1.5 rounded-xl text-xs font-bold transition-all border ${
              isAgvActive 
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/40 shadow-sm' 
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title={isAr ? 'تشغيل / إيقاف روبوتات النقل الذاتي AGVs' : 'Toggle Autonomous AGV Robots'}
          >
            <Bot className="w-3.5 h-3.5 text-amber-400" />
          </button>

          {/* Defect Heatmap Layer Toggle */}
          <button
            onClick={() => setIsHeatmapActive(prev => !prev)}
            className={`p-1.5 rounded-xl text-xs font-bold transition-all border ${
              isHeatmapActive 
                ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30' 
                : 'bg-slate-900 hover:bg-slate-800 text-rose-400 border-rose-500/30'
            }`}
            title={isAr ? 'تفعيل الخريطة الحرارية لكثافة العيوب' : 'Toggle Defect Heatmap Layer'}
          >
            <Flame className="w-3.5 h-3.5" />
          </button>

          {/* Material Flow Simulation Toggle */}
          <button
            onClick={() => setIsMaterialFlowActive(prev => !prev)}
            className={`p-1.5 rounded-xl text-xs font-bold transition-all border ${
              isMaterialFlowActive 
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' 
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title={isAr ? 'تشغيل/إيقاف محاكاة حركة الباليتات والسيور' : 'Toggle Conveyor Material Flow'}
          >
            {isMaterialFlowActive ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Sound Chime Toggle */}
          <button
            onClick={() => {
              setSoundEnabled(prev => !prev);
              if (!soundEnabled) playIndustrialChime('success');
            }}
            className={`p-1.5 rounded-xl text-xs font-bold transition-all border ${
              soundEnabled 
                ? 'bg-slate-900 text-amber-400 border-amber-500/40' 
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title={isAr ? 'تشغيل / كتم نغمات الأندون الصناعية' : 'Toggle SCADA Audio Chimes'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Add Station Button */}
          <button
            onClick={() => handleAddNewTemplate('assembly')}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1 shadow-md shadow-emerald-600/25 transition-all active:scale-95"
            title={isAr ? 'إضافة محطة أو ماكينة جديدة إلى المصنع' : 'Add new station'}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isAr ? '+ إضافة' : '+ Add'}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 hover:text-amber-300 transition-all"
            title={isAr ? 'ملء كامل الشاشة' : 'Toggle Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. EXECUTIVE LIVE PRODUCTION & SAFETY TICKER BAR                     */}
      {/* ==================================================================== */}
      <div className="flex-none px-4 py-1.5 bg-[#060a14] border-b border-white/5 flex flex-wrap items-center justify-between text-[11px] font-mono z-20">
        <div className="flex items-center gap-3 overflow-x-auto max-w-full">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>{isAr ? 'إنتاج الوردية: 1,482 / 1,500 قطعة (98.8%)' : 'Shift Output: 1,482 / 1,500 pcs (98.8%)'}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-slate-400">
            <span>•</span>
            <span>{isAr ? 'سرعة السير: 18.4 قطة/دقيقة' : 'Line Velocity: 18.4 pcs/min'}</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-emerald-400">
            <span>•</span>
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>{isAr ? 'السلامة الصناعية: 248 يوماً بدون توقف' : 'Zero Loss-Time: 248 Days Safe'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls for canvas */}
          {viewMode === 'scada-floorplan' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.1))}
                className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                title="تصغير"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="text-[10px] font-mono text-slate-400 px-1">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(1.5, prev + 0.1))}
                className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                title="تكبير"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                title="إعادة ضبط"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-[10px]">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2 py-0.5 rounded-lg font-bold ${filterStatus === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
            >
              {isAr ? 'الكل' : 'All'}
            </button>
            <button
              onClick={() => setFilterStatus('alerts-only')}
              className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 ${filterStatus === 'alerts-only' ? 'bg-red-950/60 text-red-400 border border-red-500/40' : 'text-slate-400'}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
              <span>{isAr ? 'تنبيهات' : 'Alerts'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Customize Hint Banner */}
      {isCustomizing && (
        <div className="bg-gradient-to-r from-amber-500/25 to-orange-500/25 border-b border-amber-500/40 px-4 py-2 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-black">
              {isAr 
                ? '✋ وضع السحب الحر التفاعلي نشط: يمكنك مسك أي ماكينة بالماوس وسحبها لأي مكان، أو النقر على [✏️] لتعديل اسمها وبياناتها فوراً!' 
                : '✋ Interactive Drag & Drop Active: Click & drag any machine pod across the floorplan, or click [✏️] to edit its specs!'}
            </span>
          </div>
          <button
            onClick={() => setIsCustomizing(false)}
            className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 shadow-md"
          >
            {isAr ? '✓ حفظ وإنهاء' : '✓ Done'}
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. MAIN WORKSPACE: SCADA FLOORPLAN (2D / 2.5D ISOMETRIC MULTI-ANGLE) */}
      {/* ==================================================================== */}
      <div className="flex-1 relative flex overflow-hidden">
        {viewMode === 'scada-floorplan' ? (
          <div 
            ref={canvasRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={`flex-1 w-full h-full relative overflow-auto p-4 md:p-8 flex items-center justify-center transition-colors duration-500 ${
              ambientTheme === 'cleanroom' 
                ? 'bg-[#e2e8f0]' 
                : ambientTheme === 'night-shift' 
                  ? 'bg-[#010204]' 
                  : 'bg-[#040711]'
            }`}
            style={{ 
              perspective: is3D ? '1400px' : 'none',
              cursor: isCustomizing && draggingId ? 'grabbing' : 'default'
            }}
          >
            <div 
              style={{
                transform: getCameraTransform(),
                transformOrigin: 'center center',
                transformStyle: is3D ? 'preserve-3d' : 'flat',
                transition: draggingId ? 'none' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              className={`relative w-[1200px] h-[640px] shrink-0 rounded-3xl border-2 transition-all duration-500 ${
                ambientTheme === 'cleanroom'
                  ? 'bg-[#f8fafc] border-slate-300 shadow-[0_30px_60px_rgba(0,0,0,0.15)] ring-2 ring-sky-500/20 text-slate-900'
                  : ambientTheme === 'night-shift'
                    ? 'bg-[#02050b] border-slate-900 shadow-[0_60px_120px_rgba(0,0,0,0.95)] ring-2 ring-amber-500/20'
                    : is3D 
                      ? 'bg-[#080d19] border-slate-800 shadow-[0_60px_120px_rgba(0,0,0,0.9),0_0_80px_rgba(6,182,212,0.15)] ring-4 ring-cyan-500/20' 
                      : 'bg-[#080d19] border-slate-800 shadow-2xl'
              }`}
            >
              {/* SVG ARCHITECTURAL INDUSTRIAL BACKGROUND */}
              <svg 
                viewBox="0 0 1200 640" 
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <defs>
                  {/* SCADA floor grid */}
                  <pattern id="scada-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke={ambientTheme === 'cleanroom' ? '#cbd5e1' : '#141d2f'} strokeWidth="1" />
                    <circle cx="0" cy="0" r="1.5" fill={ambientTheme === 'cleanroom' ? '#94a3b8' : '#1e293b'} />
                  </pattern>

                  {/* High-visibility yellow safety walkway hatch */}
                  <pattern id="scada-safety-walkway" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="12" height="24" fill="#f59e0b" fillOpacity={ambientTheme === 'cleanroom' ? '0.25' : '0.15'} />
                    <rect x="12" width="12" height="24" fill={ambientTheme === 'cleanroom' ? '#e2e8f0' : '#000000'} fillOpacity="0.4" />
                  </pattern>

                  {/* Red quarantine hazard hatch */}
                  <pattern id="scada-quarantine-hatch" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="8" height="16" fill="#ef4444" fillOpacity="0.22" />
                    <rect x="8" width="8" height="16" fill="#180000" fillOpacity="0.4" />
                  </pattern>

                  {/* Conveyor belt roller texture */}
                  <pattern id="scada-rollers" width="16" height="26" patternUnits="userSpaceOnUse">
                    <rect width="16" height="26" fill={ambientTheme === 'cleanroom' ? '#334155' : '#0f172a'} />
                    <line x1="8" y1="0" x2="8" y2="26" stroke={ambientTheme === 'cleanroom' ? '#64748b' : '#334155'} strokeWidth="2" />
                  </pattern>

                  {/* Material Flow Arrow Markers */}
                  <marker id="scada-arrow-cyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#06B6D4" />
                  </marker>
                </defs>

                {/* Grid Floor */}
                <rect width="1200" height="640" fill="url(#scada-grid)" />

                {/* Outer Plant Wall */}
                <rect x="15" y="15" width="1170" height="610" fill="none" stroke={ambientTheme === 'cleanroom' ? '#94a3b8' : '#1e293b'} strokeWidth="3" rx="16" />

                {/* STRUCTURAL BAY BOUNDARIES */}
                <line x1="290" y1="15" x2="290" y2="625" stroke={ambientTheme === 'cleanroom' ? '#cbd5e1' : '#1e293b'} strokeWidth="2" strokeDasharray="10,6" />
                <line x1="290" y1="440" x2="875" y2="440" stroke={ambientTheme === 'cleanroom' ? '#cbd5e1' : '#1e293b'} strokeWidth="2" strokeDasharray="10,6" />
                <line x1="875" y1="15" x2="875" y2="625" stroke={ambientTheme === 'cleanroom' ? '#cbd5e1' : '#1e293b'} strokeWidth="2" strokeDasharray="10,6" />

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

                {/* AUTONOMOUS AGV ROBOTS (Option 3 Upgrade) */}
                {isAgvActive && (
                  <g>
                    {/* AGV 01: Raw Inbound Materials */}
                    <g>
                      <rect width="28" height="16" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.6))">
                        <animateMotion path="M 120 120 L 305 120 L 305 380 L 120 380 Z" dur="18s" repeatCount="indefinite" />
                      </rect>
                      <circle cx="14" cy="8" r="3" fill="#f59e0b" className="animate-ping">
                        <animateMotion path="M 120 120 L 305 120 L 305 380 L 120 380 Z" dur="18s" repeatCount="indefinite" />
                      </circle>
                    </g>

                    {/* AGV 02: Central Quality Transfer to Metrology Lab */}
                    <g>
                      <rect width="28" height="16" rx="4" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.6))">
                        <animateMotion path="M 875 220 L 875 520 L 450 520 L 450 220 Z" dur="22s" repeatCount="indefinite" />
                      </rect>
                      <circle cx="14" cy="8" r="3" fill="#06b6d4" className="animate-ping">
                        <animateMotion path="M 875 220 L 875 520 L 450 520 L 450 220 Z" dur="22s" repeatCount="indefinite" />
                      </circle>
                    </g>
                  </g>
                )}

                {/* LIVE GLIDING PALLETS / MATERIAL STREAM ANIMATION */}
                {isMaterialFlowActive && (
                  <g>
                    {/* Pallet 1 */}
                    <g>
                      <rect width="18" height="14" rx="3" fill="#f59e0b" stroke="#78350f" strokeWidth="1">
                        <animateMotion path="M 270 230 L 325 230 L 325 142 L 840 142" dur="10s" repeatCount="indefinite" />
                      </rect>
                      <circle cx="9" cy="7" r="2.5" fill="#ffffff" opacity="0.8">
                        <animateMotion path="M 270 230 L 325 230 L 325 142 L 840 142" dur="10s" repeatCount="indefinite" />
                      </circle>
                    </g>

                    {/* Pallet 2 */}
                    <g>
                      <rect width="18" height="14" rx="3" fill="#06b6d4" stroke="#164e63" strokeWidth="1">
                        <animateMotion path="M 335 142 L 840 142 L 840 365 L 875 365 L 875 120 L 895 120" dur="12s" begin="3.5s" repeatCount="indefinite" />
                      </rect>
                    </g>

                    {/* Pallet 3 */}
                    <g>
                      <rect width="18" height="14" rx="3" fill="#10b981" stroke="#064e3b" strokeWidth="1">
                        <animateMotion path="M 895 120 L 895 365 L 1170 365" dur="8s" begin="6s" repeatCount="indefinite" />
                      </rect>
                    </g>
                  </g>
                )}
              </svg>

              {/* INDUSTRIAL BAY OVERLAY BADGES */}
              <div className="absolute top-4 left-9 pointer-events-none z-10 flex items-center gap-1.5 bg-[#0b1324]/90 border border-slate-700/80 px-2.5 py-1 rounded-xl shadow-md">
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Bay A: الاستلام والخامات</span>
              </div>

              <div className="absolute top-4 left-[330px] pointer-events-none z-10 flex items-center gap-1.5 bg-[#0b1324]/90 border border-slate-700/80 px-2.5 py-1 rounded-xl shadow-md">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">Bay B: صالة الإنتاج والتجميع 01</span>
                {isMaterialFlowActive && (
                  <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-500/40 ml-2 animate-pulse">
                    FLOW ACTIVE
                  </span>
                )}
              </div>

              <div className="absolute top-[448px] left-[330px] pointer-events-none z-10 flex items-center gap-1.5 bg-[#0b1324]/90 border border-slate-700/80 px-2.5 py-1 rounded-xl shadow-md">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">Hub C: مختبر الجودة و MRB</span>
              </div>

              {/* SCADA EQUIPMENT PODS WITH 3D EXTRUSION & LASER BEACONS */}
              {filteredEquipment.map(eq => {
                const st = stationStatuses[eq.id];
                const isSelected = selectedStationId === eq.id;
                const isDragging = draggingId === eq.id;
                const isAndonActive = Boolean(st?.isAndonActive);
                const isAlert = st?.status === 'alert';
                const isWarning = st?.status === 'warning';

                return (
                  <div
                    key={eq.id}
                    onPointerDown={(e) => handlePointerDown(e, eq)}
                    onClick={() => setSelectedStationId(eq.id)}
                    style={{
                      left: `${eq.x}px`,
                      top: `${eq.y}px`,
                      width: `${eq.w}px`,
                      height: `${eq.h}px`,
                      transform: is3D 
                        ? (isDragging ? 'translateZ(65px) scale(1.08)' : isSelected ? 'translateZ(46px) scale(1.04)' : 'translateZ(26px)')
                        : (isDragging ? 'scale(1.05)' : isSelected ? 'scale(1.02)' : 'none'),
                      boxShadow: is3D
                        ? (isDragging 
                            ? '-20px 30px 40px rgba(0,0,0,0.8), -2px 4px 0px rgba(255,255,255,0.2)' 
                            : isAlert || isAndonActive 
                              ? '-15px 22px 30px rgba(239,68,68,0.5), -1px 2px 0px rgba(255,255,255,0.15)'
                              : '-12px 18px 24px rgba(0,0,0,0.7), -1px 2px 0px rgba(255,255,255,0.15)')
                        : undefined,
                      cursor: isCustomizing ? 'grab' : 'pointer'
                    }}
                    className={`
                      absolute rounded-2xl transition-all duration-200 p-2.5 flex flex-col justify-between
                      backdrop-blur-md select-none group
                      ${isDragging ? 'z-50 ring-4 ring-amber-400 shadow-2xl opacity-95' : ''}
                      ${ambientTheme === 'cleanroom'
                        ? isSelected 
                          ? 'ring-2 ring-sky-500 bg-white border-sky-500 shadow-xl z-20' 
                          : 'border border-slate-300 bg-white/95 text-slate-800 shadow-md hover:border-sky-400 z-10'
                        : isSelected 
                          ? 'ring-2 ring-amber-400 bg-[#0f1b33] border-amber-400/80 shadow-2xl shadow-amber-500/25 z-20' 
                          : isAndonActive
                            ? 'border-2 border-pink-500 bg-pink-950/60 shadow-xl shadow-pink-500/40 animate-pulse z-18'
                            : isAlert
                              ? 'border-2 border-red-500 bg-red-950/40 shadow-xl shadow-red-500/30 animate-pulse z-15'
                              : isWarning
                                ? 'border-2 border-amber-500/80 bg-amber-950/30 shadow-lg shadow-amber-500/20 z-12'
                                : 'border border-slate-700/80 bg-[#0c1426]/90 hover:border-slate-500 hover:bg-[#111c36] z-10'
                      }
                    `}
                  >
                    {/* HOLOGRAPHIC VERTICAL LASER BEACON (Option 5 Upgrade) */}
                    {(isAlert || isAndonActive) && is3D && (
                      <div 
                        className="absolute left-1/2 bottom-full -translate-x-1/2 pointer-events-none flex flex-col items-center z-50"
                        style={{ transform: 'translateZ(50px)' }}
                      >
                        <div className={`px-2 py-0.5 rounded-full text-[9px] font-black text-white flex items-center gap-1 shadow-2xl animate-bounce ${isAndonActive ? 'bg-pink-600' : 'bg-red-600'}`}>
                          <AlertTriangle className="w-3 h-3 text-white" />
                          <span>{isAndonActive ? 'ANDON STOP' : 'NCR ALERT'}</span>
                        </div>
                        <div 
                          className={`w-1.5 h-28 rounded-full ${
                            isAndonActive 
                              ? 'bg-gradient-to-t from-pink-500 via-pink-400 to-transparent shadow-[0_0_15px_#ec4899]' 
                              : 'bg-gradient-to-t from-red-600 via-red-500 to-transparent shadow-[0_0_15px_#ef4444]'
                          }`} 
                        />
                      </div>
                    )}

                    {/* DEFECT HEATMAP GLOWING LAYER */}
                    {isHeatmapActive && (
                      <div 
                        className={`absolute -inset-4 rounded-3xl pointer-events-none -z-10 blur-xl transition-all duration-500 ${
                          isAndonActive || isAlert
                            ? 'bg-red-600/40 animate-pulse'
                            : isWarning
                              ? 'bg-amber-500/30'
                              : 'bg-emerald-500/20'
                        }`} 
                      />
                    )}

                    {/* Top Row: SCADA Machine Header & ALWAYS-VISIBLE EDIT PENCIL */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`p-1 rounded-lg ${isAndonActive ? 'bg-pink-500 text-white' : isAlert ? 'bg-red-500/20 text-red-400' : isWarning ? 'bg-amber-500/20 text-amber-400' : ambientTheme === 'cleanroom' ? 'bg-sky-100 text-sky-700' : 'bg-slate-800 text-slate-300'}`}>
                          {renderIcon(eq.iconType, 'w-3.5 h-3.5')}
                        </span>
                        <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md border ${ambientTheme === 'cleanroom' ? 'bg-slate-100 text-slate-700 border-slate-300' : 'text-slate-300 bg-black/40 border-white/5'}`}>
                          {eq.code}
                        </span>

                        {/* ALWAYS-VISIBLE EDIT PENCIL */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingStation(eq);
                          }}
                          className="p-1 rounded-md bg-amber-500/25 hover:bg-amber-400 text-amber-300 hover:text-slate-950 border border-amber-500/40 transition-colors shadow-sm"
                          title={isAr ? 'تعديل اسم ووصف هذه المحطة' : 'Edit station details'}
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Right actions: If in Customizing mode, show Drag handle & Delete */}
                      {isCustomizing ? (
                        <div className="flex items-center gap-1 z-30" onClick={e => e.stopPropagation()}>
                          <span className="p-1 rounded bg-amber-500/20 text-amber-400 cursor-grab" title="اسحب لتحريك الماكينة">
                            <Move className="w-3 h-3" />
                          </span>
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
                          <span className={`w-2 h-2 rounded-full transition-all ${isAndonActive ? 'bg-pink-500 shadow-[0_0_10px_#ec4899] animate-ping' : isAlert ? 'bg-red-500 shadow-[0_0_8px_#ef4444] animate-ping' : 'bg-red-950/60'}`} />
                          <span className={`w-2 h-2 rounded-full transition-all ${isWarning ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-amber-950/60'}`} />
                          <span className={`w-2 h-2 rounded-full transition-all ${st?.status === 'pass' ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-emerald-950/60'}`} />
                        </div>
                      )}
                    </div>

                    {/* Machine Title & Location */}
                    <div className="my-0.5">
                      <h4 className={`text-xs font-black leading-tight truncate ${ambientTheme === 'cleanroom' ? 'text-slate-900' : 'text-white'}`}>
                        {isAr ? eq.titleAr : eq.titleEn}
                      </h4>
                      <p className={`text-[10px] truncate ${ambientTheme === 'cleanroom' ? 'text-slate-500' : 'text-slate-400'}`}>
                        {isAr ? eq.locationAr : eq.locationEn}
                      </p>
                    </div>

                    {/* LIVE IOT SENSOR OSCILLOSCOPE WAVEFORM (Option 4 Upgrade) */}
                    {showOscilloscope && (
                      <div className="h-2.5 w-full overflow-hidden flex items-center opacity-80 my-0.5">
                        <svg viewBox="0 0 100 12" className="w-full h-full">
                          <path 
                            d={isAndonActive || isAlert 
                              ? "M 0 6 Q 10 -2 20 6 T 40 6 T 60 -3 T 80 14 T 100 6" 
                              : "M 0 6 Q 15 2 30 6 T 60 6 T 90 6 L 100 6"} 
                            fill="none" 
                            stroke={isAndonActive ? '#ec4899' : isAlert ? '#ef4444' : isWarning ? '#f59e0b' : '#06b6d4'} 
                            strokeWidth="1.5"
                            className="animate-pulse"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Bottom Telemetry Strip: Mini OEE Gauge & Real Status */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[9px] font-bold">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-mono truncate max-w-[65px]">{eq.line}</span>
                        {eq.oeeEstimate && (
                          <span className="text-cyan-400 font-mono bg-cyan-950/60 px-1 rounded border border-cyan-500/30">
                            {eq.oeeEstimate}% OEE
                          </span>
                        )}
                      </div>
                      
                      {isAndonActive ? (
                        <span className="text-pink-400 font-black flex items-center gap-0.5 animate-pulse">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>أندون طوارئ</span>
                        </span>
                      ) : st && (st.openNcrCount > 0 || st.defectCount > 0) ? (
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
        ) : viewMode === 'stations-grid' ? (
          /* ================================================================ */
          /* STATIONS GRID MATRIX VIEW                                        */
          /* ================================================================ */
          <div className="flex-1 w-full h-full overflow-y-auto p-4 md:p-6 bg-[#050811]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredEquipment.map(eq => {
                const st = stationStatuses[eq.id];
                const isSelected = selectedStationId === eq.id;
                const isAlert = st?.status === 'alert';
                const isAndonActive = Boolean(st?.isAndonActive);

                return (
                  <div
                    key={eq.id}
                    onClick={() => setSelectedStationId(eq.id)}
                    className={`
                      p-4 rounded-2xl cursor-pointer transition-all duration-200 border flex flex-col justify-between
                      ${isSelected 
                        ? 'border-amber-400 bg-slate-800/90 shadow-xl' 
                        : isAndonActive
                          ? 'border-pink-500 bg-pink-950/20'
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
                            className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 transition-colors"
                            title={isAr ? 'تعديل بيانات المحطة' : 'Edit station'}
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

                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-white/5 text-[11px] font-mono text-slate-300 mb-3">
                        <span>OEE: <strong className="text-cyan-400">{eq.oeeEstimate || 95}%</strong></span>
                        <span>FPY: <strong className="text-emerald-400">{eq.fpyEstimate || 98.8}%</strong></span>
                      </div>
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
        ) : (
          /* ================================================================ */
          /* 3RD VIEW MODE: FULL CUSTOMIZATION & MANAGEMENT TABLE             */
          /* ================================================================ */
          <div className="flex-1 w-full h-full overflow-y-auto p-4 md:p-6 bg-[#050811] space-y-4">
            <div className="p-4 rounded-2xl bg-[#090f1e] border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 shadow-xl">
              <div>
                <h2 className="text-sm md:text-base font-black text-white flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? 'لوحة إدارة وتخصيص محطات وماكينات المصنع (Customize Stations)' : 'Factory Workstations & Pods Customizer'}</span>
                </h2>
                <p className="text-xs text-slate-400">
                  {isAr 
                    ? 'يمكنك من هنا إعادة تسمية أي ماكينة، تغيير كودها، تعديل خط الإنتاج، أو إضافة وحذف المحطات' 
                    : 'Manage, rename, configure codes, production lines, and physical descriptions for all plant units'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAddNewTemplate('assembly')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? '+ إضافة محطة جديدة' : '+ Add New Station'}</span>
                </button>
                <button
                  onClick={handleResetToDefaults}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isAr ? 'استعادة الافتراضي' : 'Reset to Default'}</span>
                </button>
              </div>
            </div>

            {/* Stations Customization Table */}
            <div className="rounded-2xl border border-white/10 bg-[#090f1d] overflow-hidden shadow-2xl">
              <table className="w-full text-left text-xs border-collapse" dir={isAr ? 'rtl' : 'ltr'}>
                <thead>
                  <tr className="bg-[#0e172c] border-b border-white/10 text-slate-400 font-black">
                    <th className="p-3.5">{isAr ? 'الكود' : 'Code'}</th>
                    <th className="p-3.5">{isAr ? 'اسم المحطة (بالعربية)' : 'Title (Arabic)'}</th>
                    <th className="p-3.5">{isAr ? 'اسم المحطة (بالإنجليزية)' : 'Title (English)'}</th>
                    <th className="p-3.5">{isAr ? 'العنبر / الجناح' : 'Zone / Bay'}</th>
                    <th className="p-3.5">{isAr ? 'خط الإنتاج' : 'Line'}</th>
                    <th className="p-3.5">{isAr ? 'الموقع الفعلي / الوصف' : 'Description'}</th>
                    <th className="p-3.5">{isAr ? 'حالة الجودة الحية' : 'Live Status'}</th>
                    <th className="p-3.5 text-center">{isAr ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredEquipment.map(eq => {
                    const st = stationStatuses[eq.id];
                    return (
                      <tr key={eq.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="p-3.5 font-mono font-black text-amber-400">
                          {eq.code}
                        </td>
                        <td className="p-3.5 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded bg-slate-800 text-slate-300">
                              {renderIcon(eq.iconType, 'w-3.5 h-3.5')}
                            </span>
                            <span>{eq.titleAr}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-300">
                          {eq.titleEn}
                        </td>
                        <td className="p-3.5 text-slate-400">
                          {isAr ? eq.zoneNameAr : eq.zoneNameEn}
                        </td>
                        <td className="p-3.5 font-mono text-slate-300">
                          {eq.line}
                        </td>
                        <td className="p-3.5 text-slate-400 truncate max-w-xs">
                          {isAr ? eq.locationAr : eq.locationEn}
                        </td>
                        <td className="p-3.5">
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
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setEditingStation(eq)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-sm transition-all hover:scale-105"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>{isAr ? 'تعديل' : 'Edit'}</span>
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(eq.id)}
                              className="p-1 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white transition-colors"
                              title={isAr ? 'حذف' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 4. SLIDE-OVER SCADA COCKPIT DRAWER (INSPECTION & ACTIONS)            */}
        {/* ==================================================================== */}
        {selectedEquipment && viewMode !== 'customize-table' && (
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
            <div className="p-4 space-y-4 flex-1">
              {/* BIG PROMINENT EDIT BUTTON AT TOP OF DRAWER */}
              <button
                onClick={() => setEditingStation(selectedEquipment)}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02]"
              >
                <Edit3 className="w-4 h-4" />
                <span>{isAr ? '✏️ تعديل اسم ومواصفات هذه المحطة (Edit)' : '✏️ Edit This Station Details'}</span>
              </button>

              {/* DIGITAL ANDON EMERGENCY PULL BUTTON */}
              <button
                onClick={() => toggleAndonPull(selectedEquipment.id)}
                className={`w-full py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                  selectedStatus?.isAndonActive
                    ? 'bg-pink-600 hover:bg-pink-500 text-white animate-pulse shadow-pink-600/40'
                    : 'bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-500/50 shadow-red-950/30'
                }`}
              >
                <BellRing className={`w-4 h-4 ${selectedStatus?.isAndonActive ? 'animate-bounce text-white' : 'text-red-400'}`} />
                <span>
                  {selectedStatus?.isAndonActive
                    ? (isAr ? '🚨 إلغاء استدعاء الأندون وإعادة التشغيل' : '🚨 Release Andon Hold')
                    : (isAr ? '🚨 سحب حبل الأندون الصناعي (Pull Andon)' : '🚨 Pull Andon Cord (Emergency)')}
                </span>
              </button>

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
                  {selectedStatus?.isAndonActive ? (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-pink-950/50 border border-pink-500/40 text-pink-300 text-[11px] font-bold">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{isAr ? 'تم تفعيل حبل الأندون على هذه الماكينة! استدعاء فوري لفريق الجودة والصيانة.' : 'Andon Emergency Active! Urgent quality support requested.'}</span>
                    </div>
                  ) : selectedStatus && selectedStatus.status === 'pass' ? (
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

              {/* Machine Technical Metadata & OEE Telemetry */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  {isAr ? 'مؤشرات الكفاءة والمسار (Telemetry & Specs)' : 'Telemetry & Specifications'}
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">{isAr ? 'الكفاءة OEE:' : 'OEE Rate:'}</span>
                    <span className="font-bold text-cyan-400 font-mono text-sm">{selectedEquipment.oeeEstimate || 95}%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">{isAr ? 'الجودة من المرة الأولى:' : 'First Pass Yield:'}</span>
                    <span className="font-bold text-emerald-400 font-mono text-sm">{selectedEquipment.fpyEstimate || 98.6}%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">{isAr ? 'الاهتزاز (Vibration):' : 'Vibration:'}</span>
                    <span className="font-bold text-amber-300 font-mono">{selectedEquipment.vibrationMmS || 0.12} mm/s</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">{isAr ? 'الحرارة (Temp):' : 'Temperature:'}</span>
                    <span className="font-bold text-cyan-300 font-mono">{selectedEquipment.temperatureC || 24}°C</span>
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
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
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
      <div className="bg-[#0b1324] border-2 border-amber-500/50 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-white my-8" dir={isAr ? 'rtl' : 'ltr'}>
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
