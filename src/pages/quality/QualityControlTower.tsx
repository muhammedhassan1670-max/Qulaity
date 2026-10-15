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
import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
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
  Navigation, Bot, Workflow, GitFork, FileText, ClipboardList, Target,
  Link2, Unlink, AlignJustify, LayoutGrid, CheckSquare, Scale, HelpCircle,
  CornerDownRight, ArrowUpRight, MapPin, Share2, Power, Cable, Check, ChevronDown,
  Building2, Users, Award, Headphones, PenTool, Hand, MousePointer
} from 'lucide-react';
import { useTranslation } from '../../utils/translations';
import { loadSafeLocalDefectRecords } from '../../services/safeDefectStorage';
import { unifiedNcrApi, unifiedCapaApi, unifiedEightDApi, unifiedComplaintsApi } from '../../api/unified-api';
import { purgeAllDemoSimulationData } from '../../services/cleanDemoData';
import { relationshipsForEntity, relatedIdsForEntity } from '../../services/qualityRelationships';
import { 
  ENTERPRISE_DEPARTMENTS, 
  ENTERPRISE_DEPT_MAP, 
  getDepartmentForStation, 
  type PlantDepartment 
} from '../../services/enterpriseDepartmentsEngine';

const EnterprisePlant3D = React.lazy(() => import('../../components/3d/EnterprisePlant3D'));

export type StationZone = 'receiving' | 'assembly' | 'lab' | 'oqc' | 'shipping';
export type ViewMode = '3d-webgl' | 'scada-floorplan' | 'stations-grid' | 'customize-table';
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
  cycleTimeSec?: number;
  fpyEstimate?: number;
  activeOperator?: string;
  vibrationMmS?: number;
  temperatureC?: number;
  criticalParameterAr?: string;
  criticalParameterEn?: string;
  targetSpec?: string;
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
const SCADA_CONNECTIONS_KEY = 'qms_scada_connections_v2';

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

export interface ScadaConnection {
  id: string;
  fromId: string;
  toId: string;
  labelAr: string;
  labelEn: string;
  type: 'motor-roller' | 'gravity-roller' | 'belt' | 'chute' | 'pneumatic' | 'bridge' | 'dock-ramp';
  fromAnchor?: 'top' | 'bottom' | 'left' | 'right';
  toAnchor?: 'top' | 'bottom' | 'left' | 'right';
  velocityMs?: number;
  motorKw?: number;
  capacityUnits?: number;
  currentWip?: number;
  sensorType?: string;
  waypoints?: { x: number; y: number }[];
}

export const FACTORY_CONNECTIONS: ScadaConnection[] = [
  // BAY A: Inbound Logistics
  {
    id: 'CONN-RCV-IQC',
    fromId: 'DOCK-RECEIVING-01',
    toId: 'STATION-IQC-INSPECT',
    labelAr: 'سير رولمان استلام الفحص (Gravity Rollers)',
    labelEn: 'Inbound Infeed Gravity Conveyor',
    type: 'gravity-roller',
    fromAnchor: 'bottom',
    toAnchor: 'top',
    velocityMs: 0.35,
    motorKw: 0.55,
    capacityUnits: 15,
    currentWip: 6,
    sensorType: 'Photoelectric Retroreflective',
  },
  {
    id: 'CONN-IQC-BUF',
    fromId: 'STATION-IQC-INSPECT',
    toId: 'WAREHOUSE-RAW-STAGING',
    labelAr: 'مسار الخامات المعتمدة (Approved Infeed)',
    labelEn: 'Approved Material Transfer',
    type: 'motor-roller',
    fromAnchor: 'bottom',
    toAnchor: 'top',
    velocityMs: 0.48,
    motorKw: 0.75,
    capacityUnits: 20,
    currentWip: 11,
    sensorType: 'Optical Barcode Scanner',
  },
  {
    id: 'CONN-IQC-QRN',
    fromId: 'STATION-IQC-INSPECT',
    toId: 'QUARANTINE-CAGE',
    labelAr: 'مسار العزل والرفض (Quarantine Diverter Chute)',
    labelEn: 'Reject Diverter Slide Chute',
    type: 'chute',
    fromAnchor: 'bottom',
    toAnchor: 'top',
    velocityMs: 0.60,
    motorKw: 0.37,
    capacityUnits: 10,
    currentWip: 2,
    sensorType: 'Motorized Diverter Gate Blade',
  },
  // CROSSING AISLE: Bay A to Bay B
  {
    id: 'CONN-BUF-CNC',
    fromId: 'WAREHOUSE-RAW-STAGING',
    toId: 'STATION-CNC-MILLING',
    labelAr: 'جسر تغذية خط التشغيل الميكانيكي (Infeed Transfer Bridge)',
    labelEn: 'CNC Infeed Transfer Bridge',
    type: 'bridge',
    fromAnchor: 'right',
    toAnchor: 'left',
    velocityMs: 0.42,
    motorKw: 0.75,
    capacityUnits: 16,
    currentWip: 7,
    sensorType: 'RFID Transponder Reader Gate',
  },
  // BAY B: Assembly Line 01 Inter-Station Motorized Conveyors
  {
    id: 'CONN-CNC-ASM',
    fromId: 'STATION-CNC-MILLING',
    toId: 'STATION-SUB-ASSEMBLY',
    labelAr: 'سير نقل المكونات المخرطة (Machined Parts Conveyor)',
    labelEn: 'Machined Components Motorized Line',
    type: 'motor-roller',
    fromAnchor: 'right',
    toAnchor: 'left',
    velocityMs: 0.50,
    motorKw: 1.10,
    capacityUnits: 25,
    currentWip: 14,
    sensorType: 'Laser Distance Sensor & Proximity',
  },
  {
    id: 'CONN-ASM-TRQ',
    fromId: 'STATION-SUB-ASSEMBLY',
    toId: 'STATION-TORQUE-BENCH',
    labelAr: 'سير محطة الربط والعزم الذكي (Torque Station Feed)',
    labelEn: 'Smart Torque Indexing Conveyor',
    type: 'motor-roller',
    fromAnchor: 'right',
    toAnchor: 'left',
    velocityMs: 0.45,
    motorKw: 0.75,
    capacityUnits: 20,
    currentWip: 9,
    sensorType: 'Poka-Yoke Indexing Stop Gate',
  },
  {
    id: 'CONN-TRQ-PRS',
    fromId: 'STATION-TORQUE-BENCH',
    toId: 'STATION-PRESSURE-TEST',
    labelAr: 'منحنى دوران السير الهيدروليكي 90° (Turn-Table Loop)',
    labelEn: '90° Powered Curve & Test Feed',
    type: 'motor-roller',
    fromAnchor: 'right',
    toAnchor: 'right',
    velocityMs: 0.38,
    motorKw: 1.50,
    capacityUnits: 18,
    currentWip: 5,
    sensorType: 'Heavy Friction Rollers & Safety Guide',
  },
  {
    id: 'CONN-PRS-IPQC',
    fromId: 'STATION-PRESSURE-TEST',
    toId: 'STATION-IPQC-GATE',
    labelAr: 'سير الفحص المرحلي IPQC (Quality Clearance Link)',
    labelEn: 'IPQC Clearance Transfer Bed',
    type: 'belt',
    fromAnchor: 'right',
    toAnchor: 'left',
    velocityMs: 0.40,
    motorKw: 0.75,
    capacityUnits: 15,
    currentWip: 8,
    sensorType: 'Optical Vision Clearance Arch',
  },
  // BAY B to BAY C: Quality Lab Sampling
  {
    id: 'CONN-IPQC-CMM',
    fromId: 'STATION-IPQC-GATE',
    toId: 'LAB-METROLOGY-CMM',
    labelAr: 'أنبوب عينات الجودة الهوائي (Pneumatic Sampling Tube)',
    labelEn: 'Pneumatic Quality Sample Tube',
    type: 'pneumatic',
    fromAnchor: 'bottom',
    toAnchor: 'top',
    velocityMs: 2.80,
    motorKw: 2.20,
    capacityUnits: 5,
    currentWip: 1,
    sensorType: 'Vacuum Pressure Transducer',
  },
  {
    id: 'CONN-IPQC-MRB',
    fromId: 'STATION-IPQC-GATE',
    toId: 'ROOM-MRB-CAPA',
    labelAr: 'مسار العينات غير المطابقة إلى MRB (NCR Escalation Link)',
    labelEn: 'MRB Review Escalation Link',
    type: 'pneumatic',
    fromAnchor: 'bottom',
    toAnchor: 'top',
    velocityMs: 2.50,
    motorKw: 2.20,
    capacityUnits: 5,
    currentWip: 1,
    sensorType: 'High-Speed Pneumatic Shuttle',
  },
  // BAY B to BAY D: Cross-Plant Elevated Bridge
  {
    id: 'CONN-IPQC-OQC',
    fromId: 'STATION-IPQC-GATE',
    toId: 'BENCH-OQC-RELEASE',
    labelAr: 'جسر نقل علوي إلى عنبر الإفراج النهائي (Overhead Bridge Conveyor)',
    labelEn: 'Overhead Plant Crossing Bridge',
    type: 'bridge',
    fromAnchor: 'right',
    toAnchor: 'left',
    velocityMs: 0.55,
    motorKw: 1.10,
    capacityUnits: 30,
    currentWip: 18,
    sensorType: 'Elevated Safety Net & Sensor Eye',
  },
  // BAY D & BAY E: Final Packaging & Shipping
  {
    id: 'CONN-OQC-PCK',
    fromId: 'BENCH-OQC-RELEASE',
    toId: 'STATION-PACKAGING',
    labelAr: 'سير نقل للملاكمة والتغليف (Boxing Infeed)',
    labelEn: 'Palletizing & Packaging Infeed',
    type: 'gravity-roller',
    fromAnchor: 'bottom',
    toAnchor: 'top',
    velocityMs: 0.40,
    motorKw: 0.75,
    capacityUnits: 20,
    currentWip: 10,
    sensorType: 'Pallet Centering Photo-Eyes',
  },
  {
    id: 'CONN-PCK-SHP',
    fromId: 'STATION-PACKAGING',
    toId: 'DOCK-SHIPPING-03',
    labelAr: 'سير خروج الباليتات الجاهزة (Finished Goods Outfeed)',
    labelEn: 'Outbound Pallet Roller Bed',
    type: 'motor-roller',
    fromAnchor: 'bottom',
    toAnchor: 'top',
    velocityMs: 0.35,
    motorKw: 1.50,
    capacityUnits: 15,
    currentWip: 5,
    sensorType: 'Heavy Duty Pallet Scale & Scanner',
  },
  {
    id: 'CONN-SHP-DSP',
    fromId: 'DOCK-SHIPPING-03',
    toId: 'TRUCK-CUSTOMER-DELIVERY',
    labelAr: 'منحدر التحميل الهيدروليكي للشاحنة (Hydraulic Dock Leveler Ramp)',
    labelEn: 'Hydraulic Truck Dock Leveler',
    type: 'dock-ramp',
    fromAnchor: 'bottom',
    toAnchor: 'top',
    velocityMs: 0.25,
    motorKw: 2.20,
    capacityUnits: 8,
    currentWip: 3,
    sensorType: 'Hydraulic Leveler Safety Sensor',
  },
];

function calculateConnectionPath(
  conn: ScadaConnection,
  equipmentMap: Record<string, ScadaEquipment>
): { pathD: string; startX: number; startY: number; endX: number; endY: number; points: { x: number; y: number }[] } | null {
  const fromEq = equipmentMap[conn.fromId];
  const toEq = equipmentMap[conn.toId];
  if (!fromEq || !toEq) return null;

  // Determine effective dock ports
  let fromAnchor = conn.fromAnchor;
  let toAnchor = conn.toAnchor;

  // If anchors missing or identical, auto-determine optimal docking faces
  if (!fromAnchor || !toAnchor) {
    const dx = (toEq.x + toEq.w / 2) - (fromEq.x + fromEq.w / 2);
    const dy = (toEq.y + toEq.h / 2) - (fromEq.y + fromEq.h / 2);
    if (Math.abs(dx) >= Math.abs(dy)) {
      fromAnchor = dx >= 0 ? 'right' : 'left';
      toAnchor = dx >= 0 ? 'left' : 'right';
    } else {
      fromAnchor = dy >= 0 ? 'bottom' : 'top';
      toAnchor = dy >= 0 ? 'top' : 'bottom';
    }
  }

  // Exact docking port centers on machine perimeter
  let sx = fromEq.x + fromEq.w / 2;
  let sy = fromEq.y + fromEq.h / 2;
  if (fromAnchor === 'right') { sx = fromEq.x + fromEq.w; sy = fromEq.y + fromEq.h / 2; }
  else if (fromAnchor === 'left') { sx = fromEq.x; sy = fromEq.y + fromEq.h / 2; }
  else if (fromAnchor === 'top') { sx = fromEq.x + fromEq.w / 2; sy = fromEq.y; }
  else if (fromAnchor === 'bottom') { sx = fromEq.x + fromEq.w / 2; sy = fromEq.y + fromEq.h; }

  let ex = toEq.x + toEq.w / 2;
  let ey = toEq.y + toEq.h / 2;
  if (toAnchor === 'right') { ex = toEq.x + toEq.w; ey = toEq.y + toEq.h / 2; }
  else if (toAnchor === 'left') { ex = toEq.x; ey = toEq.y + toEq.h / 2; }
  else if (toAnchor === 'top') { ex = toEq.x + toEq.w / 2; ey = toEq.y; }
  else if (toAnchor === 'bottom') { ex = toEq.x + toEq.w / 2; ey = toEq.y + toEq.h; }

  // IF CUSTOM WAYPOINTS DEFINED BY USER, FOLLOW THEM PRECISELY!
  if (conn.waypoints && conn.waypoints.length > 0) {
    const customPoints = [{ x: sx, y: sy }, ...conn.waypoints, { x: ex, y: ey }];
    const pathD = customPoints.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');
    return { pathD, startX: sx, startY: sy, endX: ex, endY: ey, points: customPoints };
  }

  // Clearance offset from machine casing to prevent overlapping with pod
  const c = 24;
  const points: { x: number; y: number }[] = [{ x: sx, y: sy }];

  // Compute directional departure clearance point
  let exitX = sx;
  let exitY = sy;
  if (fromAnchor === 'right') exitX = sx + c;
  else if (fromAnchor === 'left') exitX = sx - c;
  else if (fromAnchor === 'top') exitY = sy - c;
  else if (fromAnchor === 'bottom') exitY = sy + c;
  points.push({ x: exitX, y: exitY });

  // Compute directional arrival clearance point
  let enterX = ex;
  let enterY = ey;
  if (toAnchor === 'right') enterX = ex + c;
  else if (toAnchor === 'left') enterX = ex - c;
  else if (toAnchor === 'top') enterY = ey - c;
  else if (toAnchor === 'bottom') enterY = ey + c;

  // Intermediate routing between exit and enter points
  if (fromAnchor === 'right' && toAnchor === 'left') {
    if (ex >= sx) {
      const midX = Math.round((exitX + enterX) / 2);
      points.push({ x: midX, y: exitY });
      points.push({ x: midX, y: enterY });
    } else {
      const bypassY = Math.min(fromEq.y, toEq.y) - 28 > 25 
        ? Math.min(fromEq.y, toEq.y) - 28 
        : Math.max(fromEq.y + fromEq.h, toEq.y + toEq.h) + 28;
      points.push({ x: exitX, y: bypassY });
      points.push({ x: enterX, y: bypassY });
    }
  } else if (fromAnchor === 'left' && toAnchor === 'right') {
    if (ex <= sx) {
      const midX = Math.round((exitX + enterX) / 2);
      points.push({ x: midX, y: exitY });
      points.push({ x: midX, y: enterY });
    } else {
      const bypassY = Math.min(fromEq.y, toEq.y) - 28 > 25 
        ? Math.min(fromEq.y, toEq.y) - 28 
        : Math.max(fromEq.y + fromEq.h, toEq.y + toEq.h) + 28;
      points.push({ x: exitX, y: bypassY });
      points.push({ x: enterX, y: bypassY });
    }
  } else if (fromAnchor === 'bottom' && toAnchor === 'top') {
    if (ey >= sy) {
      const midY = Math.round((exitY + enterY) / 2);
      points.push({ x: exitX, y: midY });
      points.push({ x: enterX, y: midY });
    } else {
      const bypassX = Math.max(fromEq.x + fromEq.w, toEq.x + toEq.w) + 28;
      points.push({ x: bypassX, y: exitY });
      points.push({ x: bypassX, y: enterY });
    }
  } else if (fromAnchor === 'top' && toAnchor === 'bottom') {
    if (ey <= sy) {
      const midY = Math.round((exitY + enterY) / 2);
      points.push({ x: exitX, y: midY });
      points.push({ x: enterX, y: midY });
    } else {
      const bypassX = Math.max(fromEq.x + fromEq.w, toEq.x + toEq.w) + 28;
      points.push({ x: bypassX, y: exitY });
      points.push({ x: bypassX, y: enterY });
    }
  } else if (fromAnchor === 'right' && toAnchor === 'right') {
    const loopX = Math.max(exitX, enterX) + 26;
    points.push({ x: loopX, y: exitY });
    points.push({ x: loopX, y: enterY });
  } else if (fromAnchor === 'left' && toAnchor === 'left') {
    const loopX = Math.min(exitX, enterX) - 26;
    points.push({ x: loopX, y: exitY });
    points.push({ x: loopX, y: enterY });
  } else if (fromAnchor === 'bottom' && toAnchor === 'bottom') {
    const loopY = Math.max(exitY, enterY) + 26;
    points.push({ x: exitX, y: loopY });
    points.push({ x: enterX, y: loopY });
  } else if (fromAnchor === 'top' && toAnchor === 'top') {
    const loopY = Math.min(exitY, enterY) - 26;
    points.push({ x: exitX, y: loopY });
    points.push({ x: enterX, y: loopY });
  } else if (fromAnchor === 'right' || fromAnchor === 'left') {
    points.push({ x: enterX, y: exitY });
  } else {
    points.push({ x: exitX, y: enterY });
  }

  points.push({ x: enterX, y: enterY });
  points.push({ x: ex, y: ey });

  // Clean deduplicated points
  const cleaned: { x: number; y: number }[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = cleaned[cleaned.length - 1];
    const curr = points[i];
    if (prev.x === curr.x && prev.y === curr.y) continue;
    if (i < points.length - 1) {
      const next = points[i + 1];
      if ((prev.x === curr.x && curr.x === next.x) || (prev.y === curr.y && curr.y === next.y)) {
        continue;
      }
    }
    cleaned.push(curr);
  }

  const pathD = cleaned.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  return { pathD, startX: sx, startY: sy, endX: ex, endY: ey, points: cleaned };
}

// ============================================================================
// INDUSTRIAL FACTORY FLOOR LAYOUT PRESETS ENGINE (محرّك التنسيقات المصنعية)
// ============================================================================
function buildLayoutPresetData(
  presetId: 'bays' | 'u-cell' | 'linear' | 'serpentine' | 'default',
  currentList: ScadaEquipment[]
): { equipment: ScadaEquipment[]; connections: ScadaConnection[]; nameAr: string; nameEn: string } {
  if (presetId === 'default') {
    return {
      equipment: DEFAULT_EQUIPMENT_PODS,
      connections: FACTORY_CONNECTIONS,
      nameAr: 'المصنع الافتراضي القياسي',
      nameEn: 'Default SCADA Plant'
    };
  }

  if (presetId === 'bays') {
    // 1. Bays Layout: Left Bay A, Center-Top Bay B, Center-Bottom Hub C, Right-Top Bay D, Right-Bottom Bay E
    const coords: Record<string, { x: number; y: number; w: number; h: number }> = {
      'DOCK-RECEIVING-01': { x: 35, y: 65, w: 235, h: 90 },
      'STATION-IQC-INSPECT': { x: 35, y: 180, w: 235, h: 90 },
      'QUARANTINE-CAGE': { x: 35, y: 295, w: 110, h: 95 },
      'WAREHOUSE-RAW-STAGING': { x: 160, y: 295, w: 110, h: 95 },
      'STATION-CNC-MILLING': { x: 335, y: 65, w: 220, h: 90 },
      'STATION-SUB-ASSEMBLY': { x: 335, y: 180, w: 220, h: 90 },
      'STATION-TORQUE-BENCH': { x: 595, y: 65, w: 220, h: 90 },
      'STATION-PRESSURE-TEST': { x: 595, y: 180, w: 220, h: 90 },
      'STATION-IPQC-GATE': { x: 465, y: 295, w: 230, h: 95 },
      'LAB-METROLOGY-CMM': { x: 335, y: 490, w: 220, h: 95 },
      'ROOM-MRB-CAPA': { x: 595, y: 490, w: 220, h: 95 },
      'BENCH-OQC-RELEASE': { x: 890, y: 65, w: 245, h: 90 },
      'STATION-PACKAGING': { x: 890, y: 185, w: 245, h: 90 },
      'DOCK-SHIPPING-03': { x: 890, y: 345, w: 245, h: 95 },
      'TRUCK-CUSTOMER-DELIVERY': { x: 890, y: 470, w: 245, h: 95 }
    };

    const equipment = currentList.map(item => {
      const c = coords[item.id];
      if (c) return { ...item, ...c };
      return item;
    });

    const connections: ScadaConnection[] = [
      { id: 'CONN-BAYS-1', fromId: 'DOCK-RECEIVING-01', toId: 'STATION-IQC-INSPECT', fromAnchor: 'bottom', toAnchor: 'top', type: 'gravity-roller', labelAr: 'سير رولمان استلام الفحص', labelEn: 'Inbound Infeed Conveyor', velocityMs: 0.35, motorKw: 0.55, capacityUnits: 15, currentWip: 5 },
      { id: 'CONN-BAYS-2', fromId: 'STATION-IQC-INSPECT', toId: 'WAREHOUSE-RAW-STAGING', fromAnchor: 'bottom', toAnchor: 'top', type: 'motor-roller', labelAr: 'مسار الخامات المعتمدة', labelEn: 'Approved Material Line', velocityMs: 0.48, motorKw: 0.75, capacityUnits: 20, currentWip: 8 },
      { id: 'CONN-BAYS-3', fromId: 'STATION-IQC-INSPECT', toId: 'QUARANTINE-CAGE', fromAnchor: 'bottom', toAnchor: 'top', type: 'chute', labelAr: 'مزلقان عزل الشحنات المرفوضة', labelEn: 'Quarantine Diverter Chute', velocityMs: 0.6, motorKw: 0.37, capacityUnits: 10, currentWip: 1 },
      { id: 'CONN-BAYS-4', fromId: 'WAREHOUSE-RAW-STAGING', toId: 'STATION-CNC-MILLING', fromAnchor: 'right', toAnchor: 'left', type: 'bridge', labelAr: 'جسر تغذية خط التشغيل الميكانيكي', labelEn: 'CNC Infeed Transfer Bridge', velocityMs: 0.45, motorKw: 0.75, capacityUnits: 16, currentWip: 6 },
      { id: 'CONN-BAYS-5', fromId: 'STATION-CNC-MILLING', toId: 'STATION-SUB-ASSEMBLY', fromAnchor: 'bottom', toAnchor: 'top', type: 'motor-roller', labelAr: 'سير نقل المكونات المخرطة', labelEn: 'Machined Parts Conveyor', velocityMs: 0.5, motorKw: 1.1, capacityUnits: 25, currentWip: 12 },
      { id: 'CONN-BAYS-6', fromId: 'STATION-CNC-MILLING', toId: 'STATION-TORQUE-BENCH', fromAnchor: 'right', toAnchor: 'left', type: 'belt', labelAr: 'سير التغذية المتقاطعة للربط', labelEn: 'Cross-Bay Torque Feed', velocityMs: 0.45, motorKw: 0.75, capacityUnits: 20, currentWip: 7 },
      { id: 'CONN-BAYS-7', fromId: 'STATION-TORQUE-BENCH', toId: 'STATION-PRESSURE-TEST', fromAnchor: 'bottom', toAnchor: 'top', type: 'motor-roller', labelAr: 'سير محطة الضغط والهيدروليك', labelEn: 'Hydrostatic Pressure Line', velocityMs: 0.45, motorKw: 1.1, capacityUnits: 20, currentWip: 6 },
      { id: 'CONN-BAYS-8', fromId: 'STATION-SUB-ASSEMBLY', toId: 'STATION-PRESSURE-TEST', fromAnchor: 'right', toAnchor: 'left', type: 'motor-roller', labelAr: 'سير التجميع لاختبار الضغط', labelEn: 'Assembly to Pressure Test', velocityMs: 0.4, motorKw: 0.75, capacityUnits: 18, currentWip: 4 },
      { id: 'CONN-BAYS-9', fromId: 'STATION-PRESSURE-TEST', toId: 'STATION-IPQC-GATE', fromAnchor: 'bottom', toAnchor: 'top', type: 'motor-roller', labelAr: 'بوابة فحص الجودة أثناء التشغيل', labelEn: 'IPQC Release Conveyor', velocityMs: 0.5, motorKw: 0.75, capacityUnits: 22, currentWip: 9 },
      { id: 'CONN-BAYS-10', fromId: 'STATION-IPQC-GATE', toId: 'LAB-METROLOGY-CMM', fromAnchor: 'bottom', toAnchor: 'top', type: 'pneumatic', labelAr: 'أنبوب هوائي سريع لعينات CMM', labelEn: 'Pneumatic CMM Sample Tube', velocityMs: 1.8, motorKw: 2.2, capacityUnits: 5, currentWip: 1 },
      { id: 'CONN-BAYS-11', fromId: 'STATION-IPQC-GATE', toId: 'ROOM-MRB-CAPA', fromAnchor: 'bottom', toAnchor: 'top', type: 'chute', labelAr: 'مسار العزل الهندسي ولجنة MRB', labelEn: 'MRB Engineering Review Chute', velocityMs: 0.6, motorKw: 0.37, capacityUnits: 8, currentWip: 2 },
      { id: 'CONN-BAYS-12', fromId: 'STATION-IPQC-GATE', toId: 'BENCH-OQC-RELEASE', fromAnchor: 'right', toAnchor: 'left', type: 'bridge', labelAr: 'جسر نقل الفحص النهائي OQC', labelEn: 'Final Release Transfer Bridge', velocityMs: 0.5, motorKw: 1.1, capacityUnits: 25, currentWip: 10 },
      { id: 'CONN-BAYS-13', fromId: 'BENCH-OQC-RELEASE', toId: 'STATION-PACKAGING', fromAnchor: 'bottom', toAnchor: 'top', type: 'motor-roller', labelAr: 'سير محطة التعبئة والتغليف', labelEn: 'Final Packaging Conveyor', velocityMs: 0.45, motorKw: 0.75, capacityUnits: 20, currentWip: 8 },
      { id: 'CONN-BAYS-14', fromId: 'STATION-PACKAGING', toId: 'DOCK-SHIPPING-03', fromAnchor: 'bottom', toAnchor: 'top', type: 'motor-roller', labelAr: 'سير رصيف الشحن والتصدير', labelEn: 'Outbound Shipping Conveyor', velocityMs: 0.45, motorKw: 0.75, capacityUnits: 24, currentWip: 6 },
      { id: 'CONN-BAYS-15', fromId: 'DOCK-SHIPPING-03', toId: 'TRUCK-CUSTOMER-DELIVERY', fromAnchor: 'bottom', toAnchor: 'top', type: 'dock-ramp', labelAr: 'رامب تحميل شاحنات التوزيع', labelEn: 'Customer Dispatch Ramp', velocityMs: 0.3, motorKw: 0.55, capacityUnits: 30, currentWip: 15 }
    ];

    return { equipment, connections, nameAr: 'العنابر الصناعية المتوازية (Bays Grid)', nameEn: 'Industrial Bays Grid' };
  }

  if (presetId === 'u-cell') {
    // 2. Continuous U-Shape Horseshoe Loop
    const coords: Record<string, { x: number; y: number; w: number; h: number }> = {
      'DOCK-RECEIVING-01': { x: 45, y: 65, w: 200, h: 90 },
      'STATION-IQC-INSPECT': { x: 270, y: 65, w: 200, h: 90 },
      'WAREHOUSE-RAW-STAGING': { x: 495, y: 65, w: 200, h: 90 },
      'STATION-CNC-MILLING': { x: 720, y: 65, w: 200, h: 90 },
      'STATION-SUB-ASSEMBLY': { x: 945, y: 65, w: 205, h: 90 },
      'STATION-TORQUE-BENCH': { x: 945, y: 205, w: 205, h: 90 },
      'STATION-PRESSURE-TEST': { x: 945, y: 345, w: 205, h: 90 },
      'STATION-IPQC-GATE': { x: 945, y: 485, w: 205, h: 90 },
      'LAB-METROLOGY-CMM': { x: 720, y: 485, w: 200, h: 90 },
      'ROOM-MRB-CAPA': { x: 495, y: 485, w: 200, h: 90 },
      'BENCH-OQC-RELEASE': { x: 270, y: 485, w: 200, h: 90 },
      'STATION-PACKAGING': { x: 45, y: 485, w: 200, h: 90 },
      'DOCK-SHIPPING-03': { x: 45, y: 345, w: 200, h: 90 },
      'TRUCK-CUSTOMER-DELIVERY': { x: 45, y: 205, w: 200, h: 90 },
      'QUARANTINE-CAGE': { x: 270, y: 205, w: 180, h: 90 }
    };

    const equipment = currentList.map(item => {
      const c = coords[item.id];
      if (c) return { ...item, ...c };
      return item;
    });

    const connections: ScadaConnection[] = [
      { id: 'CONN-U-1', fromId: 'DOCK-RECEIVING-01', toId: 'STATION-IQC-INSPECT', fromAnchor: 'right', toAnchor: 'left', type: 'motor-roller', labelAr: 'سير رولمان استلام IQC', labelEn: 'Dock to IQC Conveyor', velocityMs: 0.45, motorKw: 0.75, capacityUnits: 15, currentWip: 5 },
      { id: 'CONN-U-2', fromId: 'STATION-IQC-INSPECT', toId: 'WAREHOUSE-RAW-STAGING', fromAnchor: 'right', toAnchor: 'left', type: 'motor-roller', labelAr: 'سير الخامات المفحوصة', labelEn: 'IQC to Raw Buffer', velocityMs: 0.5, motorKw: 0.75, capacityUnits: 20, currentWip: 8 },
      { id: 'CONN-U-3', fromId: 'STATION-IQC-INSPECT', toId: 'QUARANTINE-CAGE', fromAnchor: 'bottom', toAnchor: 'top', type: 'chute', labelAr: 'مزلقان العزل والحجر', labelEn: 'Quarantine Diverter Chute', velocityMs: 0.6, motorKw: 0.37, capacityUnits: 10, currentWip: 1 },
      { id: 'CONN-U-4', fromId: 'WAREHOUSE-RAW-STAGING', toId: 'STATION-CNC-MILLING', fromAnchor: 'right', toAnchor: 'left', type: 'motor-roller', labelAr: 'سير تغذية ماكينات CNC', labelEn: 'Buffer to CNC Infeed', velocityMs: 0.5, motorKw: 1.1, capacityUnits: 22, currentWip: 11 },
      { id: 'CONN-U-5', fromId: 'STATION-CNC-MILLING', toId: 'STATION-SUB-ASSEMBLY', fromAnchor: 'right', toAnchor: 'left', type: 'motor-roller', labelAr: 'سير خط التجميع 01', labelEn: 'CNC to Assembly Line', velocityMs: 0.5, motorKw: 1.1, capacityUnits: 25, currentWip: 14 },
      { id: 'CONN-U-6', fromId: 'STATION-SUB-ASSEMBLY', toId: 'STATION-TORQUE-BENCH', fromAnchor: 'bottom', toAnchor: 'top', type: 'motor-roller', labelAr: 'سير محطة الربط والعزم', labelEn: 'Assembly to Torque Cell', velocityMs: 0.45, motorKw: 0.75, capacityUnits: 18, currentWip: 7 },
      { id: 'CONN-U-7', fromId: 'STATION-TORQUE-BENCH', toId: 'STATION-PRESSURE-TEST', fromAnchor: 'bottom', toAnchor: 'top', type: 'motor-roller', labelAr: 'سير كابينة اختبار الضغط', labelEn: 'Torque to Pressure Chamber', velocityMs: 0.45, motorKw: 1.1, capacityUnits: 20, currentWip: 6 },
      { id: 'CONN-U-8', fromId: 'STATION-PRESSURE-TEST', toId: 'STATION-IPQC-GATE', fromAnchor: 'bottom', toAnchor: 'top', type: 'motor-roller', labelAr: 'سير بوابة فحص الصالة', labelEn: 'Pressure to IPQC Gate', velocityMs: 0.5, motorKw: 0.75, capacityUnits: 20, currentWip: 9 },
      { id: 'CONN-U-9', fromId: 'STATION-IPQC-GATE', toId: 'LAB-METROLOGY-CMM', fromAnchor: 'left', toAnchor: 'right', type: 'pneumatic', labelAr: 'أنبوب هوائي سريع لغرفة CMM', labelEn: 'IPQC to CMM Metrology', velocityMs: 1.8, motorKw: 2.2, capacityUnits: 5, currentWip: 1 },
      { id: 'CONN-U-10', fromId: 'LAB-METROLOGY-CMM', toId: 'ROOM-MRB-CAPA', fromAnchor: 'left', toAnchor: 'right', type: 'motor-roller', labelAr: 'مسار لجنة MRB والإجراءات', labelEn: 'CMM to MRB Hold', velocityMs: 0.45, motorKw: 0.55, capacityUnits: 12, currentWip: 3 },
      { id: 'CONN-U-11', fromId: 'ROOM-MRB-CAPA', toId: 'BENCH-OQC-RELEASE', fromAnchor: 'left', toAnchor: 'right', type: 'motor-roller', labelAr: 'مسار الإفراج النهائي OQC', labelEn: 'MRB to OQC Release Bench', velocityMs: 0.5, motorKw: 0.75, capacityUnits: 20, currentWip: 8 },
      { id: 'CONN-U-12', fromId: 'BENCH-OQC-RELEASE', toId: 'STATION-PACKAGING', fromAnchor: 'left', toAnchor: 'right', type: 'motor-roller', labelAr: 'سير التعبئة والتغليف الآلي', labelEn: 'OQC to Auto Packaging', velocityMs: 0.5, motorKw: 0.75, capacityUnits: 25, currentWip: 10 },
      { id: 'CONN-U-13', fromId: 'STATION-PACKAGING', toId: 'DOCK-SHIPPING-03', fromAnchor: 'top', toAnchor: 'bottom', type: 'motor-roller', labelAr: 'سير رصيف الشحن والتصدير', labelEn: 'Packaging to Shipping Dock', velocityMs: 0.45, motorKw: 0.75, capacityUnits: 24, currentWip: 7 },
      { id: 'CONN-U-14', fromId: 'DOCK-SHIPPING-03', toId: 'TRUCK-CUSTOMER-DELIVERY', fromAnchor: 'top', toAnchor: 'bottom', type: 'dock-ramp', labelAr: 'رامب شحن الشاحنات', labelEn: 'Dock to Truck Ramp', velocityMs: 0.35, motorKw: 0.55, capacityUnits: 30, currentWip: 14 }
    ];

    return { equipment, connections, nameAr: 'خلية تصنيع U الهندسية (Lean TPS U-Cell)', nameEn: 'Lean TPS U-Cell' };
  }

  if (presetId === 'linear') {
    // 3. Dual Linear Cascade Lines (Upper Manufacturing, Lower Quality & Release)
    const coords: Record<string, { x: number; y: number; w: number; h: number }> = {
      'DOCK-RECEIVING-01': { x: 35, y: 120, w: 175, h: 90 },
      'STATION-IQC-INSPECT': { x: 230, y: 120, w: 175, h: 90 },
      'WAREHOUSE-RAW-STAGING': { x: 425, y: 120, w: 175, h: 90 },
      'STATION-CNC-MILLING': { x: 620, y: 120, w: 175, h: 90 },
      'STATION-SUB-ASSEMBLY': { x: 815, y: 120, w: 175, h: 90 },
      'STATION-TORQUE-BENCH': { x: 1010, y: 120, w: 160, h: 90 },
      'STATION-PRESSURE-TEST': { x: 1010, y: 380, w: 160, h: 90 },
      'STATION-IPQC-GATE': { x: 815, y: 380, w: 175, h: 90 },
      'LAB-METROLOGY-CMM': { x: 620, y: 380, w: 175, h: 90 },
      'BENCH-OQC-RELEASE': { x: 425, y: 380, w: 175, h: 90 },
      'STATION-PACKAGING': { x: 230, y: 380, w: 175, h: 90 },
      'DOCK-SHIPPING-03': { x: 35, y: 380, w: 175, h: 90 },
      'TRUCK-CUSTOMER-DELIVERY': { x: 35, y: 505, w: 175, h: 90 },
      'QUARANTINE-CAGE': { x: 230, y: 245, w: 175, h: 80 },
      'ROOM-MRB-CAPA': { x: 620, y: 245, w: 175, h: 80 }
    };

    const equipment = currentList.map(item => {
      const c = coords[item.id];
      if (c) return { ...item, ...c };
      return item;
    });

    const connections: ScadaConnection[] = [
      { id: 'CONN-LIN-1', fromId: 'DOCK-RECEIVING-01', toId: 'STATION-IQC-INSPECT', fromAnchor: 'right', toAnchor: 'left', type: 'motor-roller', labelAr: 'سير رولمان استلام الشحنات', labelEn: 'Dock to IQC', velocityMs: 0.45, motorKw: 0.75, capacityUnits: 15, currentWip: 4 },
      { id: 'CONN-LIN-2', fromId: 'STATION-IQC-INSPECT', toId: 'WAREHOUSE-RAW-STAGING', fromAnchor: 'right', toAnchor: 'left', type: 'motor-roller', labelAr: 'سير الخامات المفحوصة', labelEn: 'IQC to Raw Buffer', velocityMs: 0.5, motorKw: 0.75, capacityUnits: 20, currentWip: 8 },
      { id: 'CONN-LIN-3', fromId: 'STATION-IQC-INSPECT', toId: 'QUARANTINE-CAGE', fromAnchor: 'bottom', toAnchor: 'top', type: 'chute', labelAr: 'مزلقان العزل والحجز', labelEn: 'Quarantine Chute', velocityMs: 0.6, motorKw: 0.37, capacityUnits: 8, currentWip: 1 },
      { id: 'CONN-LIN-4', fromId: 'WAREHOUSE-RAW-STAGING', toId: 'STATION-CNC-MILLING', fromAnchor: 'right', toAnchor: 'left', type: 'motor-roller', labelAr: 'سير تغذية ماكينات CNC', labelEn: 'Buffer to CNC Milling', velocityMs: 0.5, motorKw: 1.1, capacityUnits: 22, currentWip: 11 },
      { id: 'CONN-LIN-5', fromId: 'STATION-CNC-MILLING', toId: 'STATION-SUB-ASSEMBLY', fromAnchor: 'right', toAnchor: 'left', type: 'motor-roller', labelAr: 'سير خط التجميع 01', labelEn: 'CNC to Assembly', velocityMs: 0.5, motorKw: 1.1, capacityUnits: 25, currentWip: 13 },
      { id: 'CONN-LIN-6', fromId: 'STATION-SUB-ASSEMBLY', toId: 'STATION-TORQUE-BENCH', fromAnchor: 'right', toAnchor: 'left', type: 'motor-roller', labelAr: 'سير محطة الربط والعزم', labelEn: 'Assembly to Torque', velocityMs: 0.45, motorKw: 0.75, capacityUnits: 18, currentWip: 7 },
      { id: 'CONN-LIN-7', fromId: 'STATION-TORQUE-BENCH', toId: 'STATION-PRESSURE-TEST', fromAnchor: 'bottom', toAnchor: 'top', type: 'bridge', labelAr: 'جسر نقل الاختبارات الهيدروليكية', labelEn: 'Torque to Pressure Bridge', velocityMs: 0.45, motorKw: 1.1, capacityUnits: 20, currentWip: 6 },
      { id: 'CONN-LIN-8', fromId: 'STATION-PRESSURE-TEST', toId: 'STATION-IPQC-GATE', fromAnchor: 'left', toAnchor: 'right', type: 'motor-roller', labelAr: 'سير بوابة فحص الصالة', labelEn: 'Pressure to IPQC', velocityMs: 0.5, motorKw: 0.75, capacityUnits: 20, currentWip: 8 },
      { id: 'CONN-LIN-9', fromId: 'STATION-IPQC-GATE', toId: 'LAB-METROLOGY-CMM', fromAnchor: 'left', toAnchor: 'right', type: 'pneumatic', labelAr: 'أنبوب هوائي لغرفة القياس CMM', labelEn: 'IPQC to CMM Lab', velocityMs: 1.8, motorKw: 2.2, capacityUnits: 5, currentWip: 1 },
      { id: 'CONN-LIN-10', fromId: 'LAB-METROLOGY-CMM', toId: 'BENCH-OQC-RELEASE', fromAnchor: 'left', toAnchor: 'right', type: 'motor-roller', labelAr: 'سير الإفراج والتحرير النهائي', labelEn: 'Metrology to OQC', velocityMs: 0.5, motorKw: 0.75, capacityUnits: 22, currentWip: 9 },
      { id: 'CONN-LIN-11', fromId: 'BENCH-OQC-RELEASE', toId: 'STATION-PACKAGING', fromAnchor: 'left', toAnchor: 'right', type: 'motor-roller', labelAr: 'سير محطة التعبئة والتغليف', labelEn: 'OQC to Packaging', velocityMs: 0.5, motorKw: 0.75, capacityUnits: 25, currentWip: 12 },
      { id: 'CONN-LIN-12', fromId: 'STATION-PACKAGING', toId: 'DOCK-SHIPPING-03', fromAnchor: 'left', toAnchor: 'right', type: 'motor-roller', labelAr: 'سير رصيف الشحن والتصدير', labelEn: 'Packaging to Shipping Dock', velocityMs: 0.45, motorKw: 0.75, capacityUnits: 24, currentWip: 7 },
      { id: 'CONN-LIN-13', fromId: 'DOCK-SHIPPING-03', toId: 'TRUCK-CUSTOMER-DELIVERY', fromAnchor: 'bottom', toAnchor: 'top', type: 'dock-ramp', labelAr: 'رامب شحن الشاحنات', labelEn: 'Dock to Dispatch Ramp', velocityMs: 0.35, motorKw: 0.55, capacityUnits: 30, currentWip: 16 }
    ];

    return { equipment, connections, nameAr: 'خط الإنتاج التسلسلي المزدوج (Linear Cascade)', nameEn: 'Dual Linear Cascade' };
  }

  // 4. Serpentine S-Flow (Triple Tier)
  const coords: Record<string, { x: number; y: number; w: number; h: number }> = {
    'DOCK-RECEIVING-01': { x: 40, y: 70, w: 200, h: 85 },
    'STATION-IQC-INSPECT': { x: 265, y: 70, w: 200, h: 85 },
    'WAREHOUSE-RAW-STAGING': { x: 490, y: 70, w: 200, h: 85 },
    'STATION-CNC-MILLING': { x: 715, y: 70, w: 200, h: 85 },
    'STATION-SUB-ASSEMBLY': { x: 940, y: 70, w: 210, h: 85 },
    'STATION-TORQUE-BENCH': { x: 940, y: 260, w: 210, h: 85 },
    'STATION-PRESSURE-TEST': { x: 715, y: 260, w: 200, h: 85 },
    'STATION-IPQC-GATE': { x: 490, y: 260, w: 200, h: 85 },
    'LAB-METROLOGY-CMM': { x: 265, y: 260, w: 200, h: 85 },
    'ROOM-MRB-CAPA': { x: 40, y: 260, w: 200, h: 85 },
    'BENCH-OQC-RELEASE': { x: 40, y: 465, w: 200, h: 85 },
    'STATION-PACKAGING': { x: 265, y: 465, w: 200, h: 85 },
    'DOCK-SHIPPING-03': { x: 490, y: 465, w: 200, h: 85 },
    'TRUCK-CUSTOMER-DELIVERY': { x: 715, y: 465, w: 200, h: 85 },
    'QUARANTINE-CAGE': { x: 940, y: 465, w: 210, h: 85 }
  };

  const equipment = currentList.map(item => {
    const c = coords[item.id];
    if (c) return { ...item, ...c };
    return item;
  });

  const connections: ScadaConnection[] = [
    { id: 'CONN-S-1', fromId: 'DOCK-RECEIVING-01', toId: 'STATION-IQC-INSPECT', fromAnchor: 'right', toAnchor: 'left', type: 'motor-roller', labelAr: 'سير رولمان استلام الفحص', labelEn: 'Dock to IQC', velocityMs: 0.45, motorKw: 0.75, capacityUnits: 15, currentWip: 5 },
    { id: 'CONN-S-2', fromId: 'STATION-IQC-INSPECT', toId: 'WAREHOUSE-RAW-STAGING', fromAnchor: 'right', toAnchor: 'left', type: 'motor-roller', labelAr: 'سير الخامات المفحوصة', labelEn: 'IQC to Buffer', velocityMs: 0.5, motorKw: 0.75, capacityUnits: 20, currentWip: 8 },
    { id: 'CONN-S-3', fromId: 'WAREHOUSE-RAW-STAGING', toId: 'STATION-CNC-MILLING', fromAnchor: 'right', toAnchor: 'left', type: 'motor-roller', labelAr: 'سير تغذية ماكينات CNC', labelEn: 'Buffer to CNC', velocityMs: 0.5, motorKw: 1.1, capacityUnits: 22, currentWip: 11 },
    { id: 'CONN-S-4', fromId: 'STATION-CNC-MILLING', toId: 'STATION-SUB-ASSEMBLY', fromAnchor: 'right', toAnchor: 'left', type: 'motor-roller', labelAr: 'سير خط التجميع 01', labelEn: 'CNC to Assembly', velocityMs: 0.5, motorKw: 1.1, capacityUnits: 25, currentWip: 14 },
    { id: 'CONN-S-5', fromId: 'STATION-SUB-ASSEMBLY', toId: 'STATION-TORQUE-BENCH', fromAnchor: 'bottom', toAnchor: 'top', type: 'motor-roller', labelAr: 'منحنى دوران السير 180°', labelEn: 'Tier 1 Turnaround Loop', velocityMs: 0.45, motorKw: 1.1, capacityUnits: 18, currentWip: 7 },
    { id: 'CONN-S-6', fromId: 'STATION-TORQUE-BENCH', toId: 'STATION-PRESSURE-TEST', fromAnchor: 'left', toAnchor: 'right', type: 'motor-roller', labelAr: 'سير اختبارات الضغط', labelEn: 'Torque to Pressure', velocityMs: 0.45, motorKw: 1.1, capacityUnits: 20, currentWip: 6 },
    { id: 'CONN-S-7', fromId: 'STATION-PRESSURE-TEST', toId: 'STATION-IPQC-GATE', fromAnchor: 'left', toAnchor: 'right', type: 'motor-roller', labelAr: 'سير بوابة فحص الصالة', labelEn: 'Pressure to IPQC', velocityMs: 0.5, motorKw: 0.75, capacityUnits: 20, currentWip: 8 },
    { id: 'CONN-S-8', fromId: 'STATION-IPQC-GATE', toId: 'LAB-METROLOGY-CMM', fromAnchor: 'left', toAnchor: 'right', type: 'pneumatic', labelAr: 'أنبوب هوائي سريع لغرفة CMM', labelEn: 'IPQC to CMM Metrology', velocityMs: 1.8, motorKw: 2.2, capacityUnits: 5, currentWip: 1 },
    { id: 'CONN-S-9', fromId: 'LAB-METROLOGY-CMM', toId: 'ROOM-MRB-CAPA', fromAnchor: 'left', toAnchor: 'right', type: 'motor-roller', labelAr: 'مسار العزل الهندسي ولجنة MRB', labelEn: 'Metrology to MRB', velocityMs: 0.45, motorKw: 0.55, capacityUnits: 12, currentWip: 3 },
    { id: 'CONN-S-10', fromId: 'ROOM-MRB-CAPA', toId: 'BENCH-OQC-RELEASE', fromAnchor: 'bottom', toAnchor: 'top', type: 'motor-roller', labelAr: 'منحنى دوران السير 180° للمرحلة الثالثة', labelEn: 'Tier 2 Turnaround Loop', velocityMs: 0.45, motorKw: 1.1, capacityUnits: 18, currentWip: 6 },
    { id: 'CONN-S-11', fromId: 'BENCH-OQC-RELEASE', toId: 'STATION-PACKAGING', fromAnchor: 'right', toAnchor: 'left', type: 'motor-roller', labelAr: 'سير محطة التعبئة والتغليف', labelEn: 'OQC to Packaging', velocityMs: 0.5, motorKw: 0.75, capacityUnits: 22, currentWip: 9 },
    { id: 'CONN-S-12', fromId: 'STATION-PACKAGING', toId: 'DOCK-SHIPPING-03', fromAnchor: 'right', toAnchor: 'left', type: 'motor-roller', labelAr: 'سير رصيف الشحن والتصدير', labelEn: 'Packaging to Shipping Dock', velocityMs: 0.45, motorKw: 0.75, capacityUnits: 24, currentWip: 7 },
    { id: 'CONN-S-13', fromId: 'DOCK-SHIPPING-03', toId: 'TRUCK-CUSTOMER-DELIVERY', fromAnchor: 'right', toAnchor: 'left', type: 'dock-ramp', labelAr: 'رامب شحن الشاحنات', labelEn: 'Dock to Dispatch Ramp', velocityMs: 0.35, motorKw: 0.55, capacityUnits: 30, currentWip: 15 }
  ];

  return { equipment, connections, nameAr: 'الخط التموجي المتعرج (Serpentine S-Flow)', nameEn: 'Serpentine S-Flow' };
}

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
  
  // View Modes & Advanced Perspectives: 3D Living Twin or 2D Architectural SCADA
  const initialMode: ViewMode = searchParams.get('view') === '2d'
    ? 'scada-floorplan'
    : '3d-webgl';

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
  
  // Inter-Station Material Flow & Connection Mode ('hybrid' | 'conveyor' | 'laser')
  const [connectionStyle, setConnectionStyle] = useState<'hybrid' | 'conveyor' | 'laser'>('hybrid');

  // Fast equipment coordinate lookup map for dynamic conveyor routing
  const equipmentMap = useMemo(() => {
    const map: Record<string, ScadaEquipment> = {};
    equipmentList.forEach(eq => { map[eq.id] = eq; });
    return map;
  }, [equipmentList]);

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
  const [selectedConveyorId, setSelectedConveyorId] = useState<string | null>(null);
  const [eStopConveyors, setEStopConveyors] = useState<Record<string, boolean>>({});
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Connection Network State (localStorage persistence)
  const [connectionsList, setConnectionsList] = useState<ScadaConnection[]>(() => {
    try {
      const saved = localStorage.getItem(SCADA_CONNECTIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return FACTORY_CONNECTIONS;
  });
  const [showConnectionManager, setShowConnectionManager] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [drawerStationSearch, setDrawerStationSearch] = useState('');
  const [drawerTab, setDrawerTab] = useState<'overview' | 'department' | 'defects-ncr' | 'capa-8d' | 'closed-loop'>('overview');

  // Synchronized Ref for equipmentList to prevent stale closure during drag & drop
  const equipmentListRef = useRef<ScadaEquipment[]>(equipmentList);
  useEffect(() => {
    equipmentListRef.current = equipmentList;
  }, [equipmentList]);

  // Interactive Visual Wiring State
  const [isWiringMode, setIsWiringMode] = useState(false);
  const [wiringSource, setWiringSource] = useState<{ stationId: string; anchor: 'left' | 'right' | 'top' | 'bottom' } | null>(null);
  const [mouseCanvasPos, setMouseCanvasPos] = useState<{ x: number; y: number } | null>(null);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  // Interactive Custom Path Drawing Tool State (أداة رسم وتوجيه المسارات باليد)
  const [isDrawingPath, setIsDrawingPath] = useState(false);
  const [drawStartStationId, setDrawStartStationId] = useState<string | null>(null);
  const [drawWaypoints, setDrawWaypoints] = useState<{ x: number; y: number }[]>([]);
  const [drawCurrentMouse, setDrawCurrentMouse] = useState<{ x: number; y: number } | null>(null);
  const [draggingWaypoint, setDraggingWaypoint] = useState<{ connId: string; index: number; startClientX: number; startClientY: number; initX: number; initY: number } | null>(null);

  // Canvas Pan & Navigation State
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanToolActive, setIsPanToolActive] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ clientX: number; clientY: number; initPanX: number; initPanY: number } | null>(null);

  // Instant Direct Connector Dragging State (Figma/Miro port drag-and-drop)
  const [activeConnectorDrag, setActiveConnectorDrag] = useState<{
    fromStationId: string;
    fromAnchor: 'left' | 'right' | 'top' | 'bottom';
    currentPos: { x: number; y: number };
  } | null>(null);

  // Quick Editing & Nudge Step State
  const [nudgeStep, setNudgeStep] = useState<number>(20);
  const [quickConnectTargetId, setQuickConnectTargetId] = useState<string>('');
  const [quickConnectType, setQuickConnectType] = useState<ScadaConnection['type']>('motor-roller');

  // Enterprise 10 Departments State & Closed-Loop Lifecycle
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [isClosedLoopActive, setIsClosedLoopActive] = useState(false);
  const [closedLoopStep, setClosedLoopStep] = useState<number>(0);

  // Selected Department Object
  const selectedDepartment = useMemo(() => {
    if (!selectedDeptId) return null;
    return ENTERPRISE_DEPT_MAP[selectedDeptId] || null;
  }, [selectedDeptId]);

  // Closed-loop simulation timer across all 10 departments
  useEffect(() => {
    let timer: any;
    if (isClosedLoopActive) {
      timer = setInterval(() => {
        setClosedLoopStep(prev => {
          const next = (prev + 1) % ENTERPRISE_DEPARTMENTS.length;
          const currentDept = ENTERPRISE_DEPARTMENTS[next];
          if (currentDept && currentDept.stationIds.length > 0) {
            setSelectedStationId(currentDept.stationIds[0]);
          }
          return next;
        });
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [isClosedLoopActive]);

  // Selected Conveyor lookup for real-time telemetry HUD
  const selectedConveyor = useMemo(() => {
    if (!selectedConveyorId) return null;
    return connectionsList.find(c => c.id === selectedConveyorId) || null;
  }, [selectedConveyorId, connectionsList]);

  const toggleConveyorEStop = (connId: string) => {
    const isStopped = Boolean(eStopConveyors[connId]);
    if (!isStopped) {
      if (soundEnabled) playIndustrialChime('alert');
      setEStopConveyors(prev => ({ ...prev, [connId]: true }));
      toast.error(isAr ? `🛑 تم إيقاف طوارئ للخط الناقل (${connId})` : `🛑 Conveyor (${connId}) Emergency Stopped`);
    } else {
      if (soundEnabled) playIndustrialChime('success');
      setEStopConveyors(prev => {
        const next = { ...prev };
        delete next[connId];
        return next;
      });
      toast.success(isAr ? `✓ تم استئناف حركة الخط الناقل (${connId})` : `✓ Conveyor (${connId}) resumed motion`);
    }
  };

  // Real System Records State Across Entire Platform Ecosystem
  const [realDefects, setRealDefects] = useState<any[]>([]);
  const [realNcrs, setRealNcrs] = useState<any[]>([]);
  const [realCapas, setRealCapas] = useState<any[]>([]);
  const [realEightDs, setRealEightDs] = useState<any[]>([]);
  const [realComplaints, setRealComplaints] = useState<any[]>([]);
  const [realInspections, setRealInspections] = useState<any[]>([]);
  const [realSuppliers, setRealSuppliers] = useState<any[]>([]);
  const [realControlPlans, setRealControlPlans] = useState<any[]>([]);
  const [realAudits, setRealAudits] = useState<any[]>([]);
  const [realCalibrations, setRealCalibrations] = useState<any[]>([]);
  const [realSpc, setRealSpc] = useState<any[]>([]);
  const [realRelationships, setRealRelationships] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load genuine data across entire quality ecosystem
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

      // Load additional quality ecosystem entities from localStorage
      try {
        const insp = localStorage.getItem('qms_local_inspections');
        if (insp) setRealInspections(JSON.parse(insp));
        const sup = localStorage.getItem('qms_local_suppliers');
        if (sup) setRealSuppliers(JSON.parse(sup));
        const cp = localStorage.getItem('qms_local_control-plans');
        if (cp) setRealControlPlans(JSON.parse(cp));
        const aud = localStorage.getItem('qms_local_audits');
        if (aud) setRealAudits(JSON.parse(aud));
        const cal = localStorage.getItem('qms_local_calibrations');
        if (cal) setRealCalibrations(JSON.parse(cal));
        const spc = localStorage.getItem('qms_spc_real_measurements');
        if (spc) setRealSpc(JSON.parse(spc));
        const rel = localStorage.getItem('qms_quality_relationships_v1');
        if (rel) setRealRelationships(JSON.parse(rel));
      } catch (e) {
        console.warn('Could not parse local ecosystem records', e);
      }
    } catch (err) {
      console.error('Failed to load real quality records', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Enterprise Department Metrics derived from real quality records
  const departmentCounts = useMemo(() => {
    return {
      'DEPT-SUPPLY-CHAIN': {
        primary: realSuppliers.length || 12,
        labelAr: 'مورد معتمد',
        labelEn: 'Approved Suppliers',
        inspections: realInspections.filter(i => i.type === 'incoming' || i.type === 'iqc').length || 8,
        openIssues: realNcrs.filter(n => n.type === 'supplier' || (n.supplier && n.supplier !== 'N/A')).length
      },
      'DEPT-WAREHOUSE-INVENTORY': {
        primary: 48,
        labelAr: 'تشغيلة خامات',
        labelEn: 'Raw Batches',
        inspections: realInspections.length || 15,
        openIssues: 0
      },
      'DEPT-PRODUCTION-OPERATIONS': {
        primary: realDefects.length || 6,
        labelAr: 'عيوب مسجلة',
        labelEn: 'Logged Defects',
        inspections: Object.values(andonHolds).filter(h => h.active).length,
        openIssues: realNcrs.filter(n => n.type === 'internal' || n.type === 'production').length
      },
      'DEPT-IPQC-QUALITY-ENG': {
        primary: realSpc.length || realControlPlans.length || 18,
        labelAr: 'كارت ضبط SPC',
        labelEn: 'SPC Control Charts',
        inspections: realControlPlans.length || 5,
        openIssues: realNcrs.filter(n => n.type === 'in-process').length
      },
      'DEPT-METROLOGY-LAB': {
        primary: realCalibrations.length || 14,
        labelAr: 'أجهزة معايرة',
        labelEn: 'Calibrated Gages',
        inspections: 12,
        openIssues: 0
      },
      'DEPT-MAINTENANCE-IOT': {
        primary: 15,
        labelAr: 'عقدة IoT نشطة',
        labelEn: 'Active IoT Nodes',
        inspections: 0,
        openIssues: 0
      },
      'DEPT-QA-MRB-GOVERNANCE': {
        primary: (realCapas.length + realEightDs.length) || 9,
        labelAr: 'إجراءات CAPA / 8D',
        labelEn: 'Active CAPA & 8D',
        inspections: realAudits.length || 4,
        openIssues: realNcrs.filter(n => n.status !== 'closed' && n.status !== 'resolved').length
      },
      'DEPT-FINAL-OQC-PACKAGING': {
        primary: realInspections.filter(i => i.type === 'outgoing' || i.type === 'final').length || 24,
        labelAr: 'إفراج جودة نهائي',
        labelEn: 'Final Release COC',
        inspections: 24,
        openIssues: 0
      },
      'DEPT-SHIPPING-LOGISTICS': {
        primary: 18,
        labelAr: 'باليتة مشحونة',
        labelEn: 'Dispatched Pallets',
        inspections: 3,
        openIssues: 0
      },
      'DEPT-CUSTOMER-EXPERIENCE': {
        primary: realComplaints.length || 2,
        labelAr: 'شكاوى عملاء RMA',
        labelEn: 'Customer Complaints',
        inspections: realComplaints.filter(c => c.status !== 'closed').length,
        openIssues: realComplaints.filter(c => c.status !== 'closed').length
      }
    };
  }, [realSuppliers, realInspections, realNcrs, realDefects, andonHolds, realSpc, realControlPlans, realCalibrations, realCapas, realEightDs, realAudits, realComplaints]);

  // URL Deep-Linking: auto-focus station if specified in query parameter
  const stationParam = searchParams.get('station');
  useEffect(() => {
    if (stationParam && equipmentList.length > 0) {
      const q = stationParam.toLowerCase().trim();
      const found = equipmentList.find(e => 
        e.id.toLowerCase() === q ||
        e.code.toLowerCase() === q ||
        e.titleEn.toLowerCase().includes(q) ||
        e.titleAr.includes(q) ||
        e.line.toLowerCase().includes(q)
      );
      if (found) {
        setSelectedStationId(found.id);
        toast.info(isAr ? `🎯 تم تحديد المحطة: ${found.titleAr}` : `🎯 Focused station: ${found.titleEn}`);
      }
    }
  }, [stationParam, equipmentList, isAr]);

  // Comprehensive Industrial Layout Presets & Auto-Wiring Engine
  const handleApplyLayoutPreset = (presetId: 'bays' | 'u-cell' | 'linear' | 'serpentine' | 'default') => {
    const res = buildLayoutPresetData(presetId, equipmentList);
    setEquipmentList(res.equipment);
    setConnectionsList(res.connections);
    try {
      localStorage.setItem(SCADA_STORAGE_KEY, JSON.stringify(res.equipment));
      localStorage.setItem(SCADA_CONNECTIONS_KEY, JSON.stringify(res.connections));
    } catch {}
    setShowLayoutMenu(false);
    if (soundEnabled) playIndustrialChime('success');
    toast.success(isAr ? `✨ تم تطبيق: ${res.nameAr} وإعادة توجيه كافة المسارات بنجاح!` : `✨ Applied: ${res.nameEn} with reconnected conveyors!`);
  };

  const handleAutoAlignLayout = () => {
    handleApplyLayoutPreset('bays');
  };

  // Reverse conveyor direction
  const handleReverseConnection = (connId: string) => {
    setConnectionsList(prev => {
      const next = prev.map(c => {
        if (c.id !== connId) return c;
        const newFrom = c.toId;
        const newTo = c.fromId;
        const newFromAnchor = c.toAnchor || 'right';
        const newToAnchor = c.fromAnchor || 'left';
        const fromSt = equipmentMap[newFrom];
        const toSt = equipmentMap[newTo];
        return {
          ...c,
          fromId: newFrom,
          toId: newTo,
          fromAnchor: newFromAnchor,
          toAnchor: newToAnchor,
          labelAr: `مسار: ${fromSt?.code || newFrom} ➔ ${toSt?.code || newTo}`,
          labelEn: `Flow: ${fromSt?.code || newFrom} ➔ ${toSt?.code || newTo}`
        };
      });
      try {
        localStorage.setItem(SCADA_CONNECTIONS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    if (soundEnabled) playIndustrialChime('success');
    toast.success(isAr ? '🔄 تم عكس اتجاه السير الناقل بنجاح!' : '🔄 Conveyor flow direction reversed!');
  };

  // Cycle conveyor technology
  const handleCycleConveyorType = (connId: string) => {
    const types: ScadaConnection['type'][] = ['motor-roller', 'belt', 'gravity-roller', 'chute', 'pneumatic', 'bridge', 'dock-ramp'];
    setConnectionsList(prev => {
      const next = prev.map(c => {
        if (c.id !== connId) return c;
        const currIdx = types.indexOf(c.type);
        const nextType = types[(currIdx + 1) % types.length];
        return { ...c, type: nextType };
      });
      try {
        localStorage.setItem(SCADA_CONNECTIONS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    if (soundEnabled) playIndustrialChime('camera');
    toast.info(isAr ? '⚙️ تم تغيير تقنية السير الناقل' : '⚙️ Conveyor technology updated');
  };

  // Interactive Dock Port Click (Visual Wiring)
  const handleAnchorClick = (stationId: string, anchor: 'left' | 'right' | 'top' | 'bottom') => {
    const clickedSt = equipmentMap[stationId];
    if (!wiringSource) {
      setWiringSource({ stationId, anchor });
      if (soundEnabled) playIndustrialChime('camera');
      toast.info(isAr ? `🔌 محطة الانطلاق: ${clickedSt?.code} [منفذ ${anchor}]. انقر الآن على منفذ محطة الوصول!` : `🔌 Selected source: ${clickedSt?.code} [${anchor} port]. Now click target station port!`);
    } else {
      if (wiringSource.stationId === stationId) {
        toast.warning(isAr ? 'لا يمكن ربط المحطة بنفسها. انقر على محطة أخرى!' : 'Cannot connect a station to itself. Select a different station!');
        return;
      }
      const srcSt = equipmentMap[wiringSource.stationId];
      const newConn: ScadaConnection = {
        id: `CONN-${Date.now().toString(36).toUpperCase()}`,
        fromId: wiringSource.stationId,
        toId: stationId,
        labelAr: `مسار ناقل: ${srcSt?.code || ''} ➔ ${clickedSt?.code || ''}`,
        labelEn: `Conveyor: ${srcSt?.code || ''} ➔ ${clickedSt?.code || ''}`,
        type: 'motor-roller',
        fromAnchor: wiringSource.anchor,
        toAnchor: anchor,
        velocityMs: 0.5,
        motorKw: 0.75,
        capacityUnits: 20,
        currentWip: 0,
        sensorType: 'Optical Retroreflective'
      };

      setConnectionsList(prev => {
        const exists = prev.some(c => (c.fromId === wiringSource.stationId && c.toId === stationId) || (c.fromId === stationId && c.toId === wiringSource.stationId));
        const next = exists 
          ? prev.map(c => ((c.fromId === wiringSource.stationId && c.toId === stationId) || (c.fromId === stationId && c.toId === wiringSource.stationId)) ? newConn : c)
          : [...prev, newConn];
        try {
          localStorage.setItem(SCADA_CONNECTIONS_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });

      setWiringSource(null);
      if (soundEnabled) playIndustrialChime('success');
      toast.success(isAr ? `✨ تم توصيل الخط الناقل بنجاح بين ${srcSt?.code} و ${clickedSt?.code}!` : `✨ Connected conveyor between ${srcSt?.code} and ${clickedSt?.code}!`);
    }
  };

  // Conveyor Connection Management Handlers
  const handleSaveConnection = (conn: ScadaConnection) => {
    setConnectionsList(prev => {
      const exists = prev.some(c => c.id === conn.id);
      const next = exists ? prev.map(c => c.id === conn.id ? conn : c) : [...prev, conn];
      try {
        localStorage.setItem(SCADA_CONNECTIONS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    toast.success(isAr ? '✓ تم حفظ مسار النقل بنجاح' : '✓ Conveyor connection saved');
  };

  const handleDeleteConnection = (connId: string) => {
    setConnectionsList(prev => {
      const next = prev.filter(c => c.id !== connId);
      try {
        localStorage.setItem(SCADA_CONNECTIONS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    if (selectedConveyorId === connId) setSelectedConveyorId(null);
    toast.success(isAr ? 'تم حذف مسار النقل' : 'Conveyor connection deleted');
  };

  const handleResetConnections = () => {
    setConnectionsList(FACTORY_CONNECTIONS);
    try {
      localStorage.removeItem(SCADA_CONNECTIONS_KEY);
    } catch {}
    toast.success(isAr ? 'تمت استعادة شبكة المسارات الافتراضية' : 'Default connections restored');
  };

  const handleAutoConnectStations = () => {
    // Smart sequential auto-connection with proximity-based docking ports
    const autoConns: ScadaConnection[] = [];
    const ordered = [...equipmentList].sort((a, b) => a.x - b.x || a.y - b.y);

    for (let i = 0; i < ordered.length - 1; i++) {
      const from = ordered[i];
      const to = ordered[i + 1];

      const dx = (to.x + to.w / 2) - (from.x + from.w / 2);
      const dy = (to.y + to.h / 2) - (from.y + from.h / 2);
      let fromAnchor: 'left' | 'right' | 'top' | 'bottom' = 'right';
      let toAnchor: 'left' | 'right' | 'top' | 'bottom' = 'left';

      if (Math.abs(dy) > Math.abs(dx)) {
        fromAnchor = dy >= 0 ? 'bottom' : 'top';
        toAnchor = dy >= 0 ? 'top' : 'bottom';
      } else {
        fromAnchor = dx >= 0 ? 'right' : 'left';
        toAnchor = dx >= 0 ? 'left' : 'right';
      }

      autoConns.push({
        id: `AUTO-CONN-${from.code}-${to.code}`,
        fromId: from.id,
        toId: to.id,
        labelAr: `مسار آلي من ${from.code} إلى ${to.code}`,
        labelEn: `Auto Flow: ${from.code} ➔ ${to.code}`,
        type: 'motor-roller',
        fromAnchor,
        toAnchor,
        velocityMs: 0.5,
        motorKw: 0.75,
        capacityUnits: 20,
        currentWip: 5,
        sensorType: 'Optical Retroreflective'
      });
    }

    setConnectionsList(autoConns);
    try {
      localStorage.setItem(SCADA_CONNECTIONS_KEY, JSON.stringify(autoConns));
    } catch {}
    if (soundEnabled) playIndustrialChime('success');
    toast.success(isAr ? `✓ تم ربط ${autoConns.length} مسار ناقل تسلسلياً وبمنافذ دقيقة بين جميع المحطات!` : `✓ Auto-connected ${autoConns.length} sequential conveyors!`);
  };

  // Nudge Station Position step-by-step with 1-click precision (Arrow Buttons)
  const nudgeStation = (stationId: string, dx: number, dy: number) => {
    setEquipmentList(prev => {
      const updated = prev.map(eq => {
        if (eq.id !== stationId) return eq;
        const nextX = Math.max(20, Math.min(1180 - eq.w, eq.x + dx));
        const nextY = Math.max(30, Math.min(620 - eq.h, eq.y + dy));
        return { ...eq, x: nextX, y: nextY };
      });
      try {
        localStorage.setItem(SCADA_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (soundEnabled) playIndustrialChime('camera');
  };

  // Instant 1-Click Move to Factory Bay Preset
  const moveStationToBayPreset = (stationId: string, zone: StationZone) => {
    const bayCoordinates: Record<StationZone, { x: number; y: number; zoneNameAr: string; zoneNameEn: string }> = {
      receiving: { x: 35, y: 185, zoneNameAr: 'عنبر الاستلام A', zoneNameEn: 'Receiving Bay A' },
      assembly: { x: 320, y: 160, zoneNameAr: 'خط التجميع B', zoneNameEn: 'Assembly Line B' },
      lab: { x: 480, y: 470, zoneNameAr: 'مركز الجودة C', zoneNameEn: 'Quality Hub C' },
      oqc: { x: 895, y: 80, zoneNameAr: 'عنبر الإفراج D', zoneNameEn: 'OQC Bay D' },
      shipping: { x: 895, y: 350, zoneNameAr: 'عنبر الشحن E', zoneNameEn: 'Shipping Bay E' },
    };

    const target = bayCoordinates[zone];
    if (!target) return;

    setEquipmentList(prev => {
      const updated = prev.map(eq => {
        if (eq.id !== stationId) return eq;
        return {
          ...eq,
          zone,
          zoneNameAr: target.zoneNameAr,
          zoneNameEn: target.zoneNameEn,
          x: target.x,
          y: target.y
        };
      });
      try {
        localStorage.setItem(SCADA_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (soundEnabled) playIndustrialChime('success');
    toast.success(isAr ? `✓ تم نقل المحطة إلى ${target.zoneNameAr}` : `✓ Moved station to ${target.zoneNameEn}`);
  };

  // Quick Direct Inline Field Update (Station Name, Line, Operator, OEE)
  const updateStationField = (stationId: string, field: keyof ScadaEquipment, value: any) => {
    setEquipmentList(prev => {
      const updated = prev.map(eq => {
        if (eq.id !== stationId) return eq;
        return { ...eq, [field]: value };
      });
      try {
        localStorage.setItem(SCADA_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Quick 1-Click Conveyor Connection between 2 Stations
  const handleQuickConnect = (fromId: string, toId: string, type: ScadaConnection['type'] = 'motor-roller') => {
    if (!fromId || !toId || fromId === toId) {
      toast.warning(isAr ? 'يرجى اختيار محطة وصول مختلفة' : 'Please select a different target station');
      return;
    }
    const fromSt = equipmentMap[fromId];
    const toSt = equipmentMap[toId];
    if (!fromSt || !toSt) return;

    const dx = (toSt.x + toSt.w / 2) - (fromSt.x + fromSt.w / 2);
    const dy = (toSt.y + toSt.h / 2) - (fromSt.y + fromSt.h / 2);
    let fromAnchor: 'left' | 'right' | 'top' | 'bottom' = 'right';
    let toAnchor: 'left' | 'right' | 'top' | 'bottom' = 'left';

    if (Math.abs(dy) > Math.abs(dx)) {
      fromAnchor = dy >= 0 ? 'bottom' : 'top';
      toAnchor = dy >= 0 ? 'top' : 'bottom';
    } else {
      fromAnchor = dx >= 0 ? 'right' : 'left';
      toAnchor = dx >= 0 ? 'left' : 'right';
    }

    const newConn: ScadaConnection = {
      id: `CONN-${fromSt.code}-${toSt.code}-${Date.now().toString(36).slice(-4)}`,
      fromId,
      toId,
      labelAr: `مسار: ${fromSt.code} ➔ ${toSt.code}`,
      labelEn: `Conveyor: ${fromSt.code} ➔ ${toSt.code}`,
      type,
      fromAnchor,
      toAnchor,
      velocityMs: 0.5,
      motorKw: 0.75,
      capacityUnits: 20,
      currentWip: 0,
      sensorType: 'Optical Retroreflective'
    };

    setConnectionsList(prev => {
      const filtered = prev.filter(c => !(c.fromId === fromId && c.toId === toId));
      const next = [...filtered, newConn];
      try {
        localStorage.setItem(SCADA_CONNECTIONS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    if (soundEnabled) playIndustrialChime('success');
    toast.success(isAr ? `✨ تم ربط خط سير جديد بنجاح بين ${fromSt.code} و ${toSt.code}!` : `✨ Connected conveyor between ${fromSt.code} and ${toSt.code}!`);
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

  // Helper to get exact SCADA 1200x640 floor coordinates from screen pointer event
  const getFloorCoords = (e: React.PointerEvent | MouseEvent) => {
    const floorBoard = canvasRef.current?.querySelector('.scada-floor-board') as HTMLElement;
    if (!floorBoard) return { x: 0, y: 0 };
    const rect = floorBoard.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) / (rect.width / 1200);
    const rawY = (e.clientY - rect.top) / (rect.height / 640);
    return {
      x: Math.max(10, Math.min(1190, Math.round(rawX))),
      y: Math.max(10, Math.min(630, Math.round(rawY)))
    };
  };

  // Waypoint Dragging & Management Handlers
  const handleWaypointPointerDown = (e: React.PointerEvent, connId: string, wpIndex: number) => {
    e.stopPropagation();
    e.preventDefault();
    const conn = connectionsList.find(c => c.id === connId);
    if (!conn || !conn.waypoints || !conn.waypoints[wpIndex]) return;
    const wp = conn.waypoints[wpIndex];
    setDraggingWaypoint({
      connId,
      index: wpIndex,
      startClientX: e.clientX,
      startClientY: e.clientY,
      initX: wp.x,
      initY: wp.y
    });
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleDeleteWaypoint = (connId: string, wpIndex: number) => {
    setConnectionsList(prev => {
      const next = prev.map(c => {
        if (c.id !== connId) return c;
        const wps = (c.waypoints || []).filter((_, idx) => idx !== wpIndex);
        return { ...c, waypoints: wps.length > 0 ? wps : undefined };
      });
      try {
        localStorage.setItem(SCADA_CONNECTIONS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    if (soundEnabled) playIndustrialChime('camera');
    toast.info(isAr ? 'تم حذف نقطة الثني من المسار' : 'Waypoint removed from path');
  };

  const handleAddWaypointToConveyor = (connId: string) => {
    const conn = connectionsList.find(c => c.id === connId);
    if (!conn) return;
    const pathInfo = calculateConnectionPath(conn, equipmentMap);
    if (!pathInfo) return;
    const pts = pathInfo.points || [{ x: pathInfo.startX, y: pathInfo.startY }, { x: pathInfo.endX, y: pathInfo.endY }];
    const midPt = pts[Math.floor(pts.length / 2)] || { x: (pathInfo.startX + pathInfo.endX) / 2, y: (pathInfo.startY + pathInfo.endY) / 2 };
    const newWp = { x: Math.round(midPt.x) + 20, y: Math.round(midPt.y) + 20 };

    setConnectionsList(prev => {
      const next = prev.map(c => {
        if (c.id !== connId) return c;
        const existing = c.waypoints ? [...c.waypoints] : pts.slice(1, -1);
        return { ...c, waypoints: [...existing, newWp] };
      });
      try {
        localStorage.setItem(SCADA_CONNECTIONS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    if (soundEnabled) playIndustrialChime('camera');
    toast.success(isAr ? '➕ تمت إضافة نقطة ثني جديدة! اسحب الدائرة البرتقالية بالماوس لتوجيه المسار' : '➕ Added new waypoint handle! Drag the amber handle to bend path');
  };

  const handleResetConveyorWaypoints = (connId: string) => {
    setConnectionsList(prev => {
      const next = prev.map(c => {
        if (c.id !== connId) return c;
        const copy = { ...c };
        delete copy.waypoints;
        return copy;
      });
      try {
        localStorage.setItem(SCADA_CONNECTIONS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    if (soundEnabled) playIndustrialChime('success');
    toast.success(isAr ? '✓ تمت استعادة المسار الهندسي التلقائي للسير' : '✓ Reset to auto-routed conveyor');
  };

  // Interactive Path Drawing Pen Tool Handlers
  const handleStartDrawingMode = () => {
    setIsDrawingPath(prev => {
      const next = !prev;
      if (next) {
        setIsWiringMode(false);
        setCameraPreset('top-down');
        setDrawStartStationId(null);
        setDrawWaypoints([]);
        setDrawCurrentMouse(null);
        if (soundEnabled) playIndustrialChime('camera');
        toast.info(isAr 
          ? '✏️ أداة رسم المسارات بالماوس نشطة: 1) انقر على محطة البداية، 2) انقر على الصالة لتحديد ثنيات المسار، 3) انقر على محطة الوصول لإتمام السير الناقل!' 
          : '✏️ Path Drawing Active: 1) Click start station, 2) Click floor to set waypoints, 3) Click destination station to finish conveyor!'
        );
      } else {
        setDrawStartStationId(null);
        setDrawWaypoints([]);
        setDrawCurrentMouse(null);
      }
      return next;
    });
  };

  const handleFloorClickWhileDrawing = (e: React.PointerEvent) => {
    if (!isDrawingPath) return;
    if (!drawStartStationId) {
      toast.warning(isAr ? 'يرجى النقر على محطة البداية أولاً لتوصيل السير بها!' : 'Please click on the starting station first!');
      return;
    }
    const coords = getFloorCoords(e);
    setDrawWaypoints(prev => [...prev, coords]);
    if (soundEnabled) playIndustrialChime('camera');
  };

  const handleStationClickWhileDrawing = (station: ScadaEquipment, e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    if (!drawStartStationId) {
      setDrawStartStationId(station.id);
      if (soundEnabled) playIndustrialChime('camera');
      toast.success(isAr ? `✓ محطة البداية: [${station.code} - ${station.titleAr}]. الآن انقر على الصالة لرسم مسار السير!` : `✓ Start Station: [${station.code}]. Now click on floor to draw path!`);
    } else if (drawStartStationId === station.id) {
      toast.warning(isAr ? 'المسار لا يمكن أن يبدأ وينتهي في نفس المحطة! اختر محطة وصول أخرى.' : 'Start and destination cannot be identical! Choose another station.');
    } else {
      const fromSt = equipmentMap[drawStartStationId];
      const toSt = station;
      const newConn: ScadaConnection = {
        id: `CONN-CUSTOM-${Date.now().toString(36).toUpperCase()}`,
        fromId: drawStartStationId,
        toId: toSt.id,
        labelAr: `مسار يدوي: ${fromSt?.code || ''} ➔ ${toSt.code}`,
        labelEn: `Custom Flow: ${fromSt?.code || ''} ➔ ${toSt.code}`,
        type: 'motor-roller',
        fromAnchor: 'right',
        toAnchor: 'left',
        waypoints: [...drawWaypoints],
        velocityMs: 0.5,
        motorKw: 0.75,
        capacityUnits: 20,
        currentWip: 0,
        sensorType: 'Optical Retroreflective'
      };

      setConnectionsList(prev => {
        const next = [...prev, newConn];
        try {
          localStorage.setItem(SCADA_CONNECTIONS_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });

      setIsDrawingPath(false);
      setDrawStartStationId(null);
      setDrawWaypoints([]);
      setDrawCurrentMouse(null);
      setSelectedConveyorId(newConn.id);

      if (soundEnabled) playIndustrialChime('success');
      toast.success(isAr 
        ? `✨ تم بنجاح رسم وتوصيل السير الناقل بين ${fromSt?.code} و ${toSt.code} مع ${drawWaypoints.length} نقاط ثني!` 
        : `✨ Conveyor created between ${fromSt?.code} and ${toSt.code} with ${drawWaypoints.length} waypoints!`
      );
    }
  };

  // Canvas Pan and Background Pointer Down
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (isDrawingPath) {
      handleFloorClickWhileDrawing(e);
      return;
    }

    if (e.button === 1 || isPanToolActive || e.altKey) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({
        clientX: e.clientX,
        clientY: e.clientY,
        initPanX: panOffset.x,
        initPanY: panOffset.y
      });
      return;
    }

    const target = e.target as HTMLElement;
    if (
      target === canvasRef.current || 
      target.classList.contains('scada-floor-board') || 
      target.tagName?.toLowerCase() === 'svg' || 
      (target.tagName?.toLowerCase() === 'rect' && target.getAttribute('width') === '1200')
    ) {
      setIsPanning(true);
      setPanStart({
        clientX: e.clientX,
        clientY: e.clientY,
        initPanX: panOffset.x,
        initPanY: panOffset.y
      });
    }
  };

  // Instant Direct Connector Pointer Down (Figma/Miro style port drag)
  const handleConnectorPointerDown = (e: React.PointerEvent, stationId: string, anchor: 'left' | 'right' | 'top' | 'bottom') => {
    e.stopPropagation();
    e.preventDefault();
    const coords = getFloorCoords(e);
    setActiveConnectorDrag({
      fromStationId: stationId,
      fromAnchor: anchor,
      currentPos: coords
    });
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  // Direct Station Pointer Down - Anytime Dragging (بدون الحاجة لأي أوضاع!)
  const handleStationPointerDown = (e: React.PointerEvent, station: ScadaEquipment) => {
    if (isDrawingPath) {
      handleStationClickWhileDrawing(station, e);
      return;
    }
    setSelectedStationId(station.id);

    // Don't drag if clicking an interactive inner button
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) {
      return;
    }

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

  // Universal Unified Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    // 0. Active Direct Connector Dragging (Figma/Miro style port drag-and-drop)
    if (activeConnectorDrag) {
      const coords = getFloorCoords(e);
      setActiveConnectorDrag(prev => prev ? { ...prev, currentPos: coords } : null);
      return;
    }

    // 1. Waypoint Dragging
    if (draggingWaypoint) {
      const deltaX = (e.clientX - draggingWaypoint.startClientX) / zoomLevel;
      const deltaY = (e.clientY - draggingWaypoint.startClientY) / zoomLevel;
      const snap = (v: number) => Math.round(v / 10) * 10;
      const nextX = Math.max(10, Math.min(1190, snap(draggingWaypoint.initX + deltaX)));
      const nextY = Math.max(10, Math.min(630, snap(draggingWaypoint.initY + deltaY)));

      setConnectionsList(prev => {
        return prev.map(c => {
          if (c.id !== draggingWaypoint.connId) return c;
          const wps = [...(c.waypoints || [])];
          wps[draggingWaypoint.index] = { x: nextX, y: nextY };
          return { ...c, waypoints: wps };
        });
      });
      return;
    }

    // 2. Canvas Panning
    if (isPanning && panStart) {
      setPanOffset({
        x: Math.round(panStart.initPanX + (e.clientX - panStart.clientX)),
        y: Math.round(panStart.initPanY + (e.clientY - panStart.clientY))
      });
      return;
    }

    // 3. Station Dragging
    if (draggingId && dragStart) {
      const deltaX = (e.clientX - dragStart.pointerX) / zoomLevel;
      const deltaY = (e.clientY - dragStart.pointerY) / zoomLevel;
      const snap = (v: number) => Math.round(v / 10) * 10;

      setEquipmentList(prev => {
        const target = prev.find(item => item.id === draggingId);
        if (!target) return prev;
        const nextX = Math.max(20, Math.min(1180 - target.w, snap(dragStart.initX + deltaX)));
        const nextY = Math.max(30, Math.min(620 - target.h, snap(dragStart.initY + deltaY)));
        return prev.map(item => item.id === draggingId ? { ...item, x: nextX, y: nextY } : item);
      });
      return;
    }

    // 4. Drawing path mouse preview
    if (isDrawingPath && drawStartStationId) {
      setDrawCurrentMouse(getFloorCoords(e));
    }
  };

  // Universal Unified Pointer Up
  const handlePointerUp = (e: React.PointerEvent) => {
    // Complete Direct Connector Dragging
    if (activeConnectorDrag) {
      const dropCoords = getFloorCoords(e);
      const targetStation = equipmentList.find(eq => 
        eq.id !== activeConnectorDrag.fromStationId &&
        dropCoords.x >= eq.x - 20 && dropCoords.x <= eq.x + eq.w + 20 &&
        dropCoords.y >= eq.y - 20 && dropCoords.y <= eq.y + eq.h + 20
      );

      if (targetStation) {
        const dx = (targetStation.x + targetStation.w / 2) - dropCoords.x;
        const dy = (targetStation.y + targetStation.h / 2) - dropCoords.y;
        let toAnchor: 'left' | 'right' | 'top' | 'bottom' = 'left';
        if (Math.abs(dx) > Math.abs(dy)) {
          toAnchor = dx >= 0 ? 'left' : 'right';
        } else {
          toAnchor = dy >= 0 ? 'top' : 'bottom';
        }

        const fromSt = equipmentMap[activeConnectorDrag.fromStationId];
        const newConn: ScadaConnection = {
          id: `CONN-${fromSt?.code || ''}-${targetStation.code}-${Date.now().toString(36).slice(-4)}`,
          fromId: activeConnectorDrag.fromStationId,
          toId: targetStation.id,
          labelAr: `مسار: ${fromSt?.code || ''} ➔ ${targetStation.code}`,
          labelEn: `Conveyor: ${fromSt?.code || ''} ➔ ${targetStation.code}`,
          type: 'motor-roller',
          fromAnchor: activeConnectorDrag.fromAnchor,
          toAnchor,
          velocityMs: 0.5,
          motorKw: 0.75,
          capacityUnits: 20,
          currentWip: 0,
          sensorType: 'Optical Retroreflective'
        };

        setConnectionsList(prev => {
          const filtered = prev.filter(c => !(c.fromId === newConn.fromId && c.toId === newConn.toId));
          const next = [...filtered, newConn];
          try {
            localStorage.setItem(SCADA_CONNECTIONS_KEY, JSON.stringify(next));
          } catch {}
          return next;
        });

        setSelectedConveyorId(newConn.id);
        if (soundEnabled) playIndustrialChime('success');
        toast.success(isAr 
          ? `✨ تم ربط سير ناقل جديد فوراً بالسحب بين [${fromSt?.code}] و [${targetStation.code}]!` 
          : `✨ Instantly connected conveyor between [${fromSt?.code}] and [${targetStation.code}]!`
        );
      } else {
        // Quick tap/click fallback on the connector handle
        handleAnchorClick(activeConnectorDrag.fromStationId, activeConnectorDrag.fromAnchor);
      }

      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setActiveConnectorDrag(null);
    }

    if (draggingWaypoint) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setDraggingWaypoint(null);
      try {
        localStorage.setItem(SCADA_CONNECTIONS_KEY, JSON.stringify(connectionsList));
      } catch {}
    }
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
    }
    if (draggingId) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
      setDraggingId(null);
      setDragStart(null);
      try {
        localStorage.setItem(SCADA_STORAGE_KEY, JSON.stringify(equipmentListRef.current));
      } catch (err) {}
    }
  };

  // Global Keyboard Listener for Ultra-Intuitive Factory Floor Control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable)) {
        return;
      }

      // Escape: cancel drawing, wiring, or clear selection
      if (e.key === 'Escape') {
        if (isDrawingPath) {
          setIsDrawingPath(false);
          setDrawStartStationId(null);
          setDrawWaypoints([]);
          setDrawCurrentMouse(null);
          toast.info(isAr ? 'تم إلغاء رسم المسار' : 'Path drawing cancelled');
        } else if (isWiringMode) {
          setIsWiringMode(false);
          setWiringSource(null);
          setMouseCanvasPos(null);
        } else if (selectedConveyorId) {
          setSelectedConveyorId(null);
        } else if (selectedStationId) {
          setSelectedStationId(null);
        }
        return;
      }

      // Delete or Backspace: delete selected conveyor
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedConveyorId) {
          handleDeleteConnection(selectedConveyorId);
          e.preventDefault();
        }
        return;
      }

      // Arrow keys: precision nudge for selected station
      if (selectedStationId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? nudgeStep * 2 : nudgeStep;
        if (e.key === 'ArrowUp') nudgeStation(selectedStationId, 0, -step);
        if (e.key === 'ArrowDown') nudgeStation(selectedStationId, 0, step);
        if (e.key === 'ArrowLeft') nudgeStation(selectedStationId, -step, 0);
        if (e.key === 'ArrowRight') nudgeStation(selectedStationId, step, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawingPath, isWiringMode, selectedConveyorId, selectedStationId, nudgeStep, isAr, connectionsList]);

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

  // Compute live station status and multi-module ecosystem linking from genuine records
  const stationStatuses = useMemo(() => {
    const map: Record<string, {
      status: 'pass' | 'warning' | 'alert' | 'andon';
      statusLabelAr: string;
      statusLabelEn: string;
      statusColor: string;
      defectCount: number;
      openNcrCount: number;
      capaCount: number;
      eightDCount: number;
      inspectionCount: number;
      spcCount: number;
      controlPlanCount: number;
      auditCount: number;
      calibrationCount: number;
      complaintCount: number;
      matchedDefects: any[];
      matchedNcrs: any[];
      matchedCapas: any[];
      matchedEightDs: any[];
      matchedInspections: any[];
      matchedControlPlans: any[];
      matchedAudits: any[];
      matchedCalibrations: any[];
      matchedComplaints: any[];
      matchedSpc: any[];
      closedLoopChain: any[];
      isAndonActive: boolean;
    }> = {};

    equipmentList.forEach(eq => {
      const isAndonActive = Boolean(andonHolds[eq.id]?.active);
      const eqLineLower = (eq.line || '').toLowerCase();
      const eqCodeLower = (eq.code || '').toLowerCase();
      const eqTitleAr = eq.titleAr || '';
      const eqTitleEnLower = (eq.titleEn || '').toLowerCase();

      // 1. Find real defects matching this station or line
      const matchedDefects = realDefects.filter(d => {
        const prodLine = (d.productionLine || '').toLowerCase();
        const lineMatch = prodLine && (eqLineLower.includes(prodLine) || prodLine.includes(eqLineLower));
        const stationMatch = d.station && (
          eqTitleAr.includes(d.station) ||
          eqTitleEnLower.includes(d.station.toLowerCase()) ||
          eqCodeLower.includes(d.station.toLowerCase())
        );
        return lineMatch || stationMatch;
      });

      // 2. Find real NCRs matching this station or line
      const matchedNcrs = realNcrs.filter(n => {
        const prodLine = (n.productionLine || '').toLowerCase();
        const lineMatch = prodLine && (eqLineLower.includes(prodLine) || prodLine.includes(eqLineLower));
        const codeMatch = (n.title || '').toLowerCase().includes(eqCodeLower) ||
          (n.description || '').toLowerCase().includes(eqCodeLower);
        const zoneMatch = eq.zone === 'receiving' && (n.source === 'Supplier' || n.source === 'IQC' || (n.title || '').includes('خامات'));
        return lineMatch || codeMatch || zoneMatch;
      });

      // 3. Find real CAPAs matching this station, line, or linked NCRs
      const matchedCapas = realCapas.filter(c => {
        const ncrMatch = matchedNcrs.some(n => 
          (n.id && n.id === c.sourceNCRId) || 
          (n.ncrNumber && n.ncrNumber === c.sourceNCRId) ||
          (c.relatedNcrId && c.relatedNcrId === n.id)
        );
        const prodLine = (c.productionLine || '').toLowerCase();
        const lineMatch = prodLine && (eqLineLower.includes(prodLine) || prodLine.includes(eqLineLower));
        return ncrMatch || lineMatch;
      });

      // 4. Find real 8D Reports matching this station, line, or linked NCRs
      const matchedEightDs = realEightDs.filter(d => {
        const ncrMatch = matchedNcrs.some(n => 
          (n.id && n.id === d.sourceNCRId) || 
          (n.ncrNumber && n.ncrNumber === d.sourceNCRId)
        );
        const prodLine = (d.productionLine || '').toLowerCase();
        const lineMatch = prodLine && (eqLineLower.includes(prodLine) || prodLine.includes(eqLineLower));
        return ncrMatch || lineMatch;
      });

      // 5. Find real IQC Inspections matching receiving bay or line
      const matchedInspections = realInspections.filter(insp => {
        if (eq.zone === 'receiving') return true;
        const inspLine = (insp.line || insp.productionLine || '').toLowerCase();
        return inspLine && (eqLineLower.includes(inspLine) || inspLine.includes(eqLineLower));
      });

      // 6. Find real Control Plans matching line or operation
      const matchedControlPlans = realControlPlans.filter(cp => {
        const cpLine = (cp.line || cp.productionLine || '').toLowerCase();
        return cpLine && (eqLineLower.includes(cpLine) || cpLine.includes(eqLineLower));
      });

      // 7. Find real Audits (LPA / Process)
      const matchedAudits = realAudits.filter(a => {
        const area = (a.area || a.department || '').toLowerCase();
        return area && (eqLineLower.includes(area) || area.includes(eqLineLower));
      });

      // 8. Find real Calibrations for instruments on this machine/station
      const matchedCalibrations = realCalibrations.filter(cal => {
        const loc = (cal.location || cal.department || '').toLowerCase();
        return loc && (eqTitleEnLower.includes(loc) || eqLineLower.includes(loc));
      });

      // 9. Find real Customer Complaints matching final stages or line
      const matchedComplaints = realComplaints.filter(comp => {
        if (eq.zone === 'shipping' || eq.zone === 'oqc') return true;
        const compLine = (comp.line || comp.productionLine || '').toLowerCase();
        return compLine && (eqLineLower.includes(compLine) || compLine.includes(eqLineLower));
      });

      // 10. Find real SPC measurements
      const matchedSpc = realSpc.filter(m => {
        return m.stationId === eq.id || m.line === eq.line;
      });

      // Full 8-Stage Interactive Closed-Loop Traceability Chain
      const closedLoopChain = [
        {
          step: 'iqc',
          titleAr: 'تفتيش الخامات IQC',
          titleEn: 'IQC Receiving Inspection',
          count: matchedInspections.length,
          status: matchedInspections.some(i => i.status === 'Rejected' || i.status === 'Failed') ? 'alert' : matchedInspections.length > 0 ? 'pass' : 'neutral',
          route: '/compliance/hub/inspection',
          sampleId: matchedInspections[0]?.id || matchedInspections[0]?.inspectionNumber
        },
        {
          step: 'defect',
          titleAr: 'تسجيل العيوب الميدانية',
          titleEn: 'Shopfloor Defect Logging',
          count: matchedDefects.length,
          status: matchedDefects.length > 0 ? 'warning' : 'pass',
          route: '/quality-shopfloor',
          sampleId: matchedDefects[0]?.id || matchedDefects[0]?.defectId
        },
        {
          step: 'ncr',
          titleAr: 'تقارير عدم المطابقة NCR',
          titleEn: 'Non-Conformance Report',
          count: matchedNcrs.length,
          status: matchedNcrs.some(n => n.status !== 'Closed') ? 'alert' : matchedNcrs.length > 0 ? 'pass' : 'neutral',
          route: '/quality/records/ncr',
          sampleId: matchedNcrs[0]?.id || matchedNcrs[0]?.ncrNumber
        },
        {
          step: '8d',
          titleAr: 'التحقيق الجذري 8D',
          titleEn: '8D Root Cause Analysis',
          count: matchedEightDs.length,
          status: matchedEightDs.some(d => d.status !== 'd8' && d.status !== 'closed') ? 'warning' : matchedEightDs.length > 0 ? 'pass' : 'neutral',
          route: '/quality/records/eight-d',
          sampleId: matchedEightDs[0]?.id || matchedEightDs[0]?.eightDNumber
        },
        {
          step: 'capa',
          titleAr: 'الإجراءات التصحيحية CAPA',
          titleEn: 'Corrective Action CAPA',
          count: matchedCapas.length,
          status: matchedCapas.some(c => c.status !== 'Closed') ? 'warning' : matchedCapas.length > 0 ? 'pass' : 'neutral',
          route: '/quality/records/capa',
          sampleId: matchedCapas[0]?.id || matchedCapas[0]?.capaNumber
        },
        {
          step: 'control-plan',
          titleAr: 'خطة التحكم والرقابة Control Plan',
          titleEn: 'Control Plan Gate',
          count: matchedControlPlans.length,
          status: matchedControlPlans.length > 0 ? 'pass' : 'neutral',
          route: '/compliance/hub/control-plan',
          sampleId: matchedControlPlans[0]?.id || matchedControlPlans[0]?.planNumber
        },
        {
          step: 'spc',
          titleAr: 'التحكم الإحصائي SPC',
          titleEn: 'Statistical Process Control',
          count: matchedSpc.length,
          status: matchedSpc.length > 0 ? 'pass' : 'neutral',
          route: '/spc',
          sampleId: matchedSpc.length > 0 ? `${matchedSpc.length} pts` : undefined
        },
        {
          step: 'complaints',
          titleAr: 'صوت العميل والشكاوى',
          titleEn: 'Customer Feedback & Complaints',
          count: matchedComplaints.length,
          status: matchedComplaints.some(c => c.status !== 'Closed') ? 'alert' : matchedComplaints.length > 0 ? 'pass' : 'neutral',
          route: '/quality/records/complaints',
          sampleId: matchedComplaints[0]?.id || matchedComplaints[0]?.complaintNumber
        }
      ];

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
        capaCount: matchedCapas.length,
        eightDCount: matchedEightDs.length,
        inspectionCount: matchedInspections.length,
        spcCount: matchedSpc.length,
        controlPlanCount: matchedControlPlans.length,
        auditCount: matchedAudits.length,
        calibrationCount: matchedCalibrations.length,
        complaintCount: matchedComplaints.length,
        matchedDefects,
        matchedNcrs,
        matchedCapas,
        matchedEightDs,
        matchedInspections,
        matchedControlPlans,
        matchedAudits,
        matchedCalibrations,
        matchedComplaints,
        matchedSpc,
        closedLoopChain,
        isAndonActive
      };
    });

    return map;
  }, [
    equipmentList, realDefects, realNcrs, realCapas, realEightDs,
    realInspections, realControlPlans, realAudits, realCalibrations,
    realComplaints, realSpc, andonHolds
  ]);

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
    if (!selectedStationId) return null;
    return equipmentList.find(e => e.id === selectedStationId) || null;
  }, [equipmentList, selectedStationId]);

  const selectedStatus = useMemo(() => {
    return selectedEquipment ? stationStatuses[selectedEquipment.id] : null;
  }, [selectedEquipment, stationStatuses]);

  // Active Department (either explicitly selected or derived from focused equipment)
  const activeDepartment = useMemo<PlantDepartment>(() => {
    if (selectedDeptId && ENTERPRISE_DEPT_MAP[selectedDeptId]) {
      return ENTERPRISE_DEPT_MAP[selectedDeptId];
    }
    if (selectedEquipment) {
      const found = getDepartmentForStation(selectedEquipment.id);
      if (found) return found;
    }
    return ENTERPRISE_DEPARTMENTS[0];
  }, [selectedDeptId, selectedEquipment]);

  const getModuleBadgeCount = (badgeCountKey?: string) => {
    if (!badgeCountKey) return null;
    switch (badgeCountKey) {
      case 'ncr': return realNcrs.filter(n => n.status !== 'Closed' && n.status !== 'Resolved').length;
      case 'defect': return realDefects.length;
      case 'capa': return realCapas.filter(c => c.status !== 'Closed' && c.status !== 'Completed').length;
      case 'complaint': return realComplaints.filter(c => c.status !== 'Closed').length;
      case 'inspection': return realInspections.length;
      case 'spc': return realSpc.length;
      case 'audit': return realAudits.length;
      default: return null;
    }
  };

  const renderModuleIcon = (iconName: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'Truck': return <Truck className={className} />;
      case 'ClipboardList': return <ClipboardList className={className} />;
      case 'CheckSquare': return <CheckSquare className={className} />;
      case 'AlertTriangle': return <AlertTriangle className={className} />;
      case 'Layers': return <Layers className={className} />;
      case 'Search': return <Search className={className} />;
      case 'RefreshCw': return <RefreshCw className={className} />;
      case 'BarChart3': return <BarChart3 className={className} />;
      case 'Workflow': return <Workflow className={className} />;
      case 'FileText': return <FileText className={className} />;
      case 'CheckCircle2': return <CheckCircle2 className={className} />;
      case 'Activity': return <Activity className={className} />;
      case 'Cpu': return <Cpu className={className} />;
      case 'Wrench': return <Wrench className={className} />;
      default: return <ExternalLink className={className} />;
    }
  };

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

  // Machine SVG Blueprint Watermark Selector for high-fidelity industrial cards
  const renderMachineWatermark = (code: string) => {
    if (code.startsWith('CNC')) {
      return (
        <svg viewBox="0 0 80 80" className="absolute -right-3 -bottom-3 w-24 h-24 opacity-10 pointer-events-none text-cyan-400 stroke-current fill-none">
          <circle cx="40" cy="40" r="28" strokeWidth="2" strokeDasharray="4,4" />
          <circle cx="40" cy="40" r="14" strokeWidth="2" />
          <path d="M 40 10 L 40 70 M 10 40 L 70 40" strokeWidth="1.5" />
          <rect x="36" y="2" width="8" height="12" fill="currentColor" />
        </svg>
      );
    }
    if (code.startsWith('ASM')) {
      return (
        <svg viewBox="0 0 80 80" className="absolute -right-3 -bottom-3 w-24 h-24 opacity-10 pointer-events-none text-cyan-400 stroke-current fill-none">
          <rect x="25" y="55" width="30" height="15" rx="3" strokeWidth="2" />
          <path d="M 40 55 L 40 35 L 55 20" strokeWidth="3" strokeLinecap="round" />
          <circle cx="55" cy="20" r="4" fill="currentColor" />
          <path d="M 55 16 L 65 12 M 55 24 L 65 28" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }
    if (code.startsWith('TRQ')) {
      return (
        <svg viewBox="0 0 80 80" className="absolute -right-3 -bottom-3 w-24 h-24 opacity-10 pointer-events-none text-amber-400 stroke-current fill-none">
          <circle cx="40" cy="40" r="25" strokeWidth="2" />
          <path d="M 40 40 L 55 30" strokeWidth="3" strokeLinecap="round" />
          <circle cx="40" cy="40" r="4" fill="currentColor" />
          <path d="M 22 40 A 18 18 0 0 1 58 40" strokeWidth="1.5" strokeDasharray="3,3" />
        </svg>
      );
    }
    if (code.startsWith('PRS')) {
      return (
        <svg viewBox="0 0 80 80" className="absolute -right-3 -bottom-3 w-24 h-24 opacity-10 pointer-events-none text-red-400 stroke-current fill-none">
          <rect x="20" y="20" width="40" height="40" rx="6" strokeWidth="2" />
          <circle cx="40" cy="40" r="14" strokeWidth="1.5" />
          <path d="M 40 40 L 48 34" strokeWidth="2" />
          <path d="M 20 40 L 10 40 M 60 40 L 70 40" strokeWidth="2" />
        </svg>
      );
    }
    if (code.startsWith('IPQC') || code.startsWith('OQC') || code.startsWith('IQC')) {
      return (
        <svg viewBox="0 0 80 80" className="absolute -right-3 -bottom-3 w-24 h-24 opacity-10 pointer-events-none text-emerald-400 stroke-current fill-none">
          <circle cx="40" cy="40" r="24" strokeWidth="2" />
          <circle cx="40" cy="40" r="16" strokeWidth="1" strokeDasharray="4,2" />
          <path d="M 40 12 L 40 20 M 40 60 L 40 68 M 12 40 L 20 40 M 60 40 L 68 40" strokeWidth="2" />
          <circle cx="40" cy="40" r="3" fill="currentColor" />
        </svg>
      );
    }
    if (code.startsWith('CMM')) {
      return (
        <svg viewBox="0 0 80 80" className="absolute -right-3 -bottom-3 w-24 h-24 opacity-10 pointer-events-none text-purple-400 stroke-current fill-none">
          <rect x="15" y="55" width="50" height="15" rx="2" strokeWidth="2" />
          <path d="M 25 55 L 25 20 L 55 20 L 55 55" strokeWidth="2.5" />
          <path d="M 40 20 L 40 38" strokeWidth="2" />
          <circle cx="40" cy="41" r="3" fill="#ec4899" />
        </svg>
      );
    }
    return null;
  };

  // Interactive Live Animated Machine Cockpit Mechanisms
  const renderMachineCockpit = (code: string, isAlert: boolean, isAndonActive: boolean) => {
    if (code.startsWith('CNC')) {
      return (
        <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg bg-black/40 border border-cyan-500/20 my-0.5 z-10">
          <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
            <div className={`w-3.5 h-3.5 rounded-full border-2 border-dashed border-cyan-400 ${isAndonActive ? '' : 'animate-[spin_1.2s_linear_infinite]'}`} />
            <div className="w-1 h-1 rounded-full bg-amber-400" />
          </div>
          <div className="flex-1 flex justify-between items-center text-[8px] font-mono">
            <span className="text-slate-400">SPINDLE</span>
            <span className={`font-bold ${isAndonActive ? 'text-red-400' : 'text-cyan-300'}`}>
              {isAndonActive ? '0 RPM' : '12,500 RPM'}
            </span>
          </div>
        </div>
      );
    }
    if (code.startsWith('PRS')) {
      return (
        <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg bg-black/40 border border-red-500/20 my-0.5 z-10">
          <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-red-400">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="14,4" />
              <line x1="12" y1="12" x2="16" y2="7" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" className={isAndonActive ? '' : 'animate-pulse'} />
            </svg>
          </div>
          <div className="flex-1 flex justify-between items-center text-[8px] font-mono">
            <span className="text-slate-400">PRESS.</span>
            <span className={`font-bold ${isAlert ? 'text-red-400' : 'text-emerald-400'}`}>
              6.12 BAR
            </span>
          </div>
        </div>
      );
    }
    if (code.startsWith('TRQ')) {
      return (
        <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg bg-black/40 border border-amber-500/20 my-0.5 z-10">
          <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
            <div className={`w-3 h-3 border-2 border-amber-400 rounded-sm ${isAndonActive ? '' : 'animate-bounce'}`} />
          </div>
          <div className="flex-1 flex justify-between items-center text-[8px] font-mono">
            <span className="text-slate-400">TORQUE</span>
            <span className="font-bold text-amber-300">42.5 N·m</span>
          </div>
        </div>
      );
    }
    if (code.startsWith('IPQC') || code.startsWith('OQC')) {
      return (
        <div className="relative overflow-hidden px-1.5 py-0.5 rounded-lg bg-black/40 border border-emerald-500/20 my-0.5 z-10">
          {!isAndonActive && (
            <div className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent animate-[dash_2s_linear_infinite]" />
          )}
          <div className="flex justify-between items-center text-[8px] font-mono relative z-10">
            <span className="text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              VISION AI
            </span>
            <span className="font-bold text-emerald-300">100% SCAN</span>
          </div>
        </div>
      );
    }
    if (code.startsWith('CMM')) {
      return (
        <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg bg-black/40 border border-purple-500/20 my-0.5 z-10">
          <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
            <div className="w-2 h-2 rounded-full bg-pink-500/80 animate-ping" />
            <div className="absolute w-1 h-1 rounded-full bg-white" />
          </div>
          <div className="flex-1 flex justify-between items-center text-[8px] font-mono">
            <span className="text-slate-400">PROBE</span>
            <span className="font-bold text-purple-300">±0.002 mm</span>
          </div>
        </div>
      );
    }
    return null;
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

        {/* PRIMARY VIEW MODE SWITCHER: 3D WEBGL TWIN vs 2D SCADA FLOORPLAN + FACTORY SETTINGS */}
        <div className="flex items-center gap-1 bg-[#090f1e]/95 p-1 rounded-2xl border border-cyan-500/40 shadow-xl shrink-0">
          <button
            onClick={() => {
              setViewMode('3d-webgl');
              if (soundEnabled) playIndustrialChime('camera');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
              viewMode === '3d-webgl'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/30 ring-2 ring-cyan-300 scale-105'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Box className="w-4 h-4 text-cyan-400" />
            <span>{isAr ? '🌐 التوأم الرقمي 3D' : '🌐 3D Twin'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 text-[9px] font-mono border border-cyan-500/40">Three.js</span>
          </button>

          <button
            onClick={() => {
              setViewMode('scada-floorplan');
              if (soundEnabled) playIndustrialChime('camera');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
              viewMode === 'scada-floorplan'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md shadow-amber-500/30 ring-2 ring-amber-300 scale-105'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>{isAr ? '🗺️ خريطة 2D' : '🗺️ 2D Plan'}</span>
          </button>

          <button
            onClick={() => {
              setSelectedStationId(null);
              setIsDrawerOpen(prev => !prev);
              if (soundEnabled) playIndustrialChime('camera');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
              isDrawerOpen && !selectedStationId
                ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300 scale-105'
                : 'text-amber-400 hover:text-white hover:bg-amber-500/20'
            }`}
            title={isAr ? 'فتح لوحة إعدادات وتعديل المصنع والربط' : 'Factory Settings & Integrated Customizer'}
          >
            <Settings2 className="w-4 h-4 text-amber-400" />
            <span>{isAr ? '⚙️ إعدادات وتعديل المصنع' : '⚙️ Factory Settings'}</span>
          </button>
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
            {isMaterialFlowActive ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* Connection Flow Mode Toggle (Conveyor / Cyber / Hybrid) */}
          <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 p-0.5 rounded-xl">
            <button
              onClick={() => setConnectionStyle('hybrid')}
              className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
                connectionStyle === 'hybrid' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title={isAr ? 'نمط الوصلات المزدوج (سيور ميكانيكية + نبضات ليزر)' : 'Hybrid Mode (Conveyors + Cyber Lines)'}
            >
              <Workflow className="w-3 h-3 inline mr-1" />
              <span className="hidden md:inline">{isAr ? 'مزدوج' : 'Hybrid'}</span>
            </button>
            <button
              onClick={() => setConnectionStyle('conveyor')}
              className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
                connectionStyle === 'conveyor' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title={isAr ? 'نمط السيور وخطوط النقل الميكانيكية الواقعية' : 'Mechanical Conveyors Mode'}
            >
              <span>{isAr ? 'سيور' : 'Conveyors'}</span>
            </button>
            <button
              onClick={() => setConnectionStyle('laser')}
              className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
                connectionStyle === 'laser' ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title={isAr ? 'نمط مسارات التدفق الرقمية والبيانات' : 'Cyber Data Conduit Mode'}
            >
              <span>{isAr ? 'ليزر' : 'Cyber'}</span>
            </button>
          </div>

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

          {/* Factory Layout Presets Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLayoutMenu(prev => !prev)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                showLayoutMenu
                  ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-300 shadow-md'
                  : 'bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40'
              }`}
              title={isAr ? 'اختيار تنسيق هندسي متكامل للمصنع وإعادة ربط السيور' : 'Factory Layout & Conveyor Presets'}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">{isAr ? '📐 تنسيقات المصنع' : 'Layout Presets'}</span>
              <ChevronDown className="w-3 h-3 text-cyan-400" />
            </button>

            {showLayoutMenu && (
              <div 
                className="absolute top-full mt-2 left-0 sm:right-0 sm:left-auto z-50 w-72 rounded-2xl bg-[#090f1e]/98 backdrop-blur-xl border border-cyan-500/40 p-2 shadow-2xl shadow-cyan-950/80 animate-in fade-in zoom-in-95 duration-150"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-3 py-2 border-b border-cyan-500/20 mb-1">
                  <h5 className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                    <Factory className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isAr ? 'تنسيقات المصنع والسيور الهندسية' : 'SCADA Factory Layout Presets'}</span>
                  </h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {isAr ? 'إعادة ترتيب فوري للمحطات مع وصلات هندسية دقيقة' : 'Instant rearrangement with non-overlapping conveyors'}
                  </p>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => handleApplyLayoutPreset('bays')}
                    className="w-full text-left rtl:text-right px-3 py-2 rounded-xl hover:bg-cyan-500/15 border border-transparent hover:border-cyan-500/30 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-black text-white group-hover:text-cyan-300 flex items-center gap-1.5">
                        <span>🏭</span>
                        <span>{isAr ? 'العنابر المتوازية (Bays Grid)' : 'Parallel Bays Grid'}</span>
                      </div>
                      <p className="text-[9px] text-slate-400">{isAr ? 'أجنحة A, B, C, D, E مع 15 خط سير منظم' : 'Bays A-E with 15 orthogonal lines'}</p>
                    </div>
                    <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">15 Convs</span>
                  </button>

                  <button
                    onClick={() => handleApplyLayoutPreset('u-cell')}
                    className="w-full text-left rtl:text-right px-3 py-2 rounded-xl hover:bg-amber-500/15 border border-transparent hover:border-amber-500/30 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-black text-white group-hover:text-amber-300 flex items-center gap-1.5">
                        <span>🔄</span>
                        <span>{isAr ? 'خلية U المتكاملة (Lean U-Cell)' : 'Lean TPS U-Cell'}</span>
                      </div>
                      <p className="text-[9px] text-slate-400">{isAr ? 'تدفق حلقي متواصل من الاستلام إلى الشحن' : 'Continuous horseshoe loop'}</p>
                    </div>
                    <span className="text-[9px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">Lean Loop</span>
                  </button>

                  <button
                    onClick={() => handleApplyLayoutPreset('linear')}
                    className="w-full text-left rtl:text-right px-3 py-2 rounded-xl hover:bg-emerald-500/15 border border-transparent hover:border-emerald-500/30 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-black text-white group-hover:text-emerald-300 flex items-center gap-1.5">
                        <span>⚡</span>
                        <span>{isAr ? 'خط إنتاج تسلسلي (Linear Cascade)' : 'Linear Cascade'}</span>
                      </div>
                      <p className="text-[9px] text-slate-400">{isAr ? 'خطين متوازيين مع جسر نقل علوي' : 'Dual parallel lines with cross bridge'}</p>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">Cascade</span>
                  </button>

                  <button
                    onClick={() => handleApplyLayoutPreset('serpentine')}
                    className="w-full text-left rtl:text-right px-3 py-2 rounded-xl hover:bg-purple-500/15 border border-transparent hover:border-purple-500/30 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-black text-white group-hover:text-purple-300 flex items-center gap-1.5">
                        <span>〰️</span>
                        <span>{isAr ? 'خط متعرج تموجي (Serpentine S-Flow)' : 'Serpentine S-Flow'}</span>
                      </div>
                      <p className="text-[9px] text-slate-400">{isAr ? '3 مسارات متتالية مع لفات 180°' : 'Triple-tier continuous S-curves'}</p>
                    </div>
                    <span className="text-[9px] font-mono text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/30">S-Curves</span>
                  </button>

                  <div className="pt-1.5 border-t border-white/10 flex items-center gap-1">
                    <button
                      onClick={() => handleApplyLayoutPreset('default')}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-center text-[10px] font-bold transition-all"
                    >
                      🔄 {isAr ? 'الافتراضي' : 'Default'}
                    </button>
                    <button
                      onClick={handleAutoConnectStations}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/30 text-cyan-300 text-center text-[10px] font-bold transition-all"
                    >
                      ⚡ {isAr ? 'ربط آلي ذكي' : 'Auto-Wire'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Visual Wiring Mode Toggle */}
          <button
            onClick={() => {
              setIsWiringMode(prev => {
                const next = !prev;
                if (next) {
                  setCameraPreset('top-down');
                  setWiringSource(null);
                  toast.info(isAr ? '🔌 وضع التوصيل المرئي نشط: انقر على منفذ البداية ثم منفذ النهاية!' : '🔌 Wiring Mode Active: Click start port then end port!');
                } else {
                  setWiringSource(null);
                  setMouseCanvasPos(null);
                }
                return next;
              });
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
              isWiringMode
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black ring-2 ring-cyan-300 shadow-cyan-500/50 scale-105'
                : 'bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40'
            }`}
            title={isAr ? 'تفعيل وضع التوصيل المرئي بين منافذ الماكينات' : 'Visual Conveyor Wiring Mode'}
          >
            <Cable className={`w-3.5 h-3.5 ${isWiringMode ? 'text-slate-950 animate-bounce' : 'text-cyan-400'}`} />
            <span className="hidden sm:inline">
              {isWiringMode 
                ? (isAr ? '✓ إنهاء التوصيل' : '✓ Done Wiring') 
                : (isAr ? '🔌 توصيل مرئي' : '🔌 Wire Mode')}
            </span>
          </button>

          {/* Manage Conveyor Network Button */}
          <button
            onClick={() => setShowConnectionManager(true)}
            className="px-2.5 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900/80 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title={isAr ? 'إدارة شبكة مسارات الناقلات والسيور' : 'Manage Conveyor Network'}
          >
            <Link2 className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">{isAr ? '🔗 المسارات' : 'Conveyors'}</span>
          </button>

          {/* Interactive Freehand Path Drawing Pen Tool */}
          <button
            onClick={handleStartDrawingMode}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
              isDrawingPath
                ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 text-slate-950 ring-2 ring-yellow-300 shadow-yellow-500/50 scale-105 animate-pulse'
                : 'bg-yellow-950/80 hover:bg-yellow-900/80 text-yellow-300 border border-yellow-500/40'
            }`}
            title={isAr ? 'أداة رسم المسارات والسيور يدوياً بالماوس مع تحديد نقاط الانعطاف' : 'Interactive Path Drawing Pen Tool with Waypoints'}
          >
            <PenTool className={`w-3.5 h-3.5 ${isDrawingPath ? 'text-slate-950 animate-bounce' : 'text-yellow-400'}`} />
            <span>
              {isDrawingPath 
                ? (isAr ? '✓ إنهاء الرسم' : '✓ Done Drawing') 
                : (isAr ? '✏️ ارسم مسار باليد' : '✏️ Draw Path')}
            </span>
          </button>

          {/* Edit & Layout Mode Toggle Button */}
          <button
            onClick={() => {
              setIsCustomizing(prev => {
                const next = !prev;
                if (next) {
                  setCameraPreset('top-down');
                  if (soundEnabled) playIndustrialChime('camera');
                  toast.info(isAr ? '📐 تم تفعيل وضع التعديل: يمكنك الآن سحب الماكينات بالماوس أو تحريكها بدقة بالأزرار في القائمة الجانبية!' : '📐 Edit Mode Active: Drag stations with mouse or nudge with arrow buttons!');
                } else {
                  if (soundEnabled) playIndustrialChime('success');
                  toast.success(isAr ? '✓ تم حفظ المخطط وتثبيت مواقع المحطات' : '✓ Layout locked and saved');
                }
                return next;
              });
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
              isCustomizing
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 ring-2 ring-amber-300 shadow-amber-500/50 scale-105 animate-pulse'
                : 'bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border border-amber-500/40'
            }`}
            title={isAr ? 'تفعيل وضع تحريك وسحب وتعديل الماكينات' : 'Toggle Drag & Layout Edit Mode'}
          >
            <Move className={`w-3.5 h-3.5 ${isCustomizing ? 'text-slate-950 animate-bounce' : 'text-amber-400'}`} />
            <span>
              {isCustomizing 
                ? (isAr ? '✓ إنهاء التعديل والحفظ' : '✓ Done Editing') 
                : (isAr ? '✏️ وضع التعديل والتحريك' : '✏️ Move & Edit Mode')}
            </span>
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
            <button
              onClick={() => setFilterStatus('normal-only')}
              className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 ${filterStatus === 'normal-only' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40' : 'text-slate-400'}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>{isAr ? 'طبيعي' : 'Normal'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2.5 ENTERPRISE 10 DEPARTMENTS CLOSED-LOOP PIPELINE STRIP             */}
      {/* ==================================================================== */}
      <div className="flex-none px-4 py-2 bg-[#070c17]/95 border-b border-cyan-500/20 backdrop-blur-md z-20">
        <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-thin">
          <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r rtl:border-r-0 rtl:border-l border-white/10">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <div className="text-[10px] font-black uppercase text-cyan-300">
              {isAr ? 'إدارات المصنع المتكاملة (10)' : 'Plant Depts (10)'}
            </div>
            <button
              onClick={() => setIsClosedLoopActive(prev => !prev)}
              className={`ml-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 shadow-md active:scale-95 ${
                isClosedLoopActive
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 ring-2 ring-amber-300 shadow-amber-500/40 animate-pulse'
                  : 'bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300'
              }`}
              title={isAr ? 'محاكاة تتبع دورة حياة المنتج المغلقة من المورد حتى العميل' : 'Simulate Closed-Loop Flow from Supplier to Customer'}
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>{isClosedLoopActive ? (isAr ? 'إيقاف المحاكاة' : 'Stop Loop') : (isAr ? '🔄 تتبع الدورة المغلقة' : 'Closed Loop')}</span>
            </button>
          </div>

          {/* 10 Departments Pipeline Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
            {ENTERPRISE_DEPARTMENTS.map((dept, idx) => {
              const isSelected = selectedDeptId === dept.id;
              const isCurrentStep = isClosedLoopActive && closedLoopStep === idx;
              const countInfo = (departmentCounts as any)[dept.id];

              return (
                <div key={dept.id} className="flex items-center shrink-0">
                  <button
                    onClick={() => {
                      if (selectedDeptId === dept.id) {
                        setSelectedDeptId(null);
                      } else {
                        setSelectedDeptId(dept.id);
                        if (dept.stationIds.length > 0) {
                          setSelectedStationId(dept.stationIds[0]);
                        }
                        setDrawerTab('department');
                        if (soundEnabled) playIndustrialChime('camera');
                      }
                    }}
                    style={{
                      borderColor: isSelected || isCurrentStep ? dept.accentHex : undefined,
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all border shadow-sm ${
                      isSelected || isCurrentStep
                        ? 'bg-slate-900 text-white ring-2 shadow-lg scale-105'
                        : 'bg-slate-950/70 hover:bg-slate-900/90 text-slate-300 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <span 
                      style={{ backgroundColor: dept.accentHex }} 
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-slate-950 shrink-0 shadow-inner"
                    >
                      {dept.number}
                    </span>
                    <span className="truncate max-w-[120px] sm:max-w-[150px]">
                      {isAr ? dept.shortNameAr : dept.shortNameEn}
                    </span>
                    {countInfo?.openIssues > 0 && (
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-red-500/25 text-red-300 border border-red-500/40 animate-pulse">
                        {countInfo.openIssues} NCR
                      </span>
                    )}
                  </button>

                  {idx < ENTERPRISE_DEPARTMENTS.length - 1 && (
                    <ArrowRight className={`w-3.5 h-3.5 mx-0.5 shrink-0 transition-colors ${isCurrentStep ? 'text-amber-400 animate-pulse' : 'text-slate-600'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DYNAMIC INDUSTRIAL BAY / ZONE FAST NAVIGATION BAR */}
      <div className="flex-none px-4 py-1 bg-[#0a1020] border-b border-white/5 flex items-center justify-between gap-2 overflow-x-auto text-[11px] z-20">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider hidden sm:inline">
            {isAr ? 'عنابر المصنع:' : 'Plant Bays:'}
          </span>
          {[
            { id: 'all', labelAr: '🏭 جميع العنابر', labelEn: '🏭 All Bays', count: equipmentList.length },
            { id: 'receiving', labelAr: '📥 Bay A: الاستلام', labelEn: '📥 Bay A: Receiving', count: equipmentList.filter(e => e.zone === 'receiving').length },
            { id: 'assembly', labelAr: '⚙️ Bay B: التجميع والتشغيل', labelEn: '⚙️ Bay B: Assembly', count: equipmentList.filter(e => e.zone === 'assembly').length },
            { id: 'lab', labelAr: '🔬 Hub C: مختبر الجودة', labelEn: '🔬 Hub C: QA Lab', count: equipmentList.filter(e => e.zone === 'lab').length },
            { id: 'oqc', labelAr: '✅ Bay D: الفحص النهائي', labelEn: '✅ Bay D: Final OQC', count: equipmentList.filter(e => e.zone === 'oqc').length },
            { id: 'shipping', labelAr: '🚚 Bay E: الشحن والتسليم', labelEn: '🚚 Bay E: Shipping', count: equipmentList.filter(e => e.zone === 'shipping').length },
          ].map(bay => (
            <button
              key={bay.id}
              onClick={() => setFilterZone(bay.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border ${
                filterZone === bay.id
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{isAr ? bay.labelAr : bay.labelEn}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${filterZone === bay.id ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'}`}>
                {bay.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search input in subheader */}
        <div className="relative shrink-0 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث عن محطة، كود، أو خط...' : 'Search station, code, line...'}
            className="w-48 sm:w-60 pr-8 pl-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-all font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
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

      {/* Interactive Conveyor Wiring Mode Hint Banner */}
      {isWiringMode && (
        <div className="bg-gradient-to-r from-cyan-600/30 via-blue-600/30 to-purple-600/30 border-b border-cyan-500/50 px-4 py-2 flex items-center justify-between text-xs text-cyan-200 z-30">
          <div className="flex items-center gap-2">
            <Cable className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="font-black">
              {wiringSource 
                ? (isAr 
                    ? `🔌 تم تحديد منفذ [${wiringSource.anchor}] لمحطة [${equipmentMap[wiringSource.stationId]?.code || wiringSource.stationId}]. انقر الآن على أي منفذ في محطة أخرى لربط السير الناقل فوراً!` 
                    : `🔌 Selected [${wiringSource.anchor}] port of [${equipmentMap[wiringSource.stationId]?.code || wiringSource.stationId}]. Now click any port on target station to connect conveyor!`)
                : (isAr 
                    ? '🔌 وضع التوصيل المرئي للسيور نشط: انقر على أي منفذ من المنافذ الأربعة (◀ ▶ ▲ ▼) على أي ماكينة لبدء مد خط سير ناقل جديد.' 
                    : '🔌 Visual Conveyor Wiring Active: Click any docking port (◀ ▶ ▲ ▼) on a machine to begin routing.')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {wiringSource && (
              <button
                onClick={() => setWiringSource(null)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-colors"
              >
                {isAr ? 'إلغاء المنفذ' : 'Cancel Port'}
              </button>
            )}
            <button
              onClick={() => {
                setIsWiringMode(false);
                setWiringSource(null);
                setMouseCanvasPos(null);
              }}
              className="px-3 py-1 rounded-lg bg-cyan-500 text-slate-950 font-black text-xs hover:bg-cyan-400 shadow-md transition-all active:scale-95"
            >
              {isAr ? '✓ إنهاء التوصيل' : '✓ Done Wiring'}
            </button>
          </div>
        </div>
      )}

      {/* Interactive Conveyor Path Drawing Guidance Banner */}
      {isDrawingPath && (
        <div className="bg-gradient-to-r from-yellow-600/35 via-amber-600/35 to-orange-600/35 border-b border-yellow-500/60 px-4 py-2 flex items-center justify-between text-xs text-yellow-200 z-30 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-yellow-400 animate-bounce" />
            <span className="font-black">
              {drawStartStationId 
                ? (isAr 
                    ? `✏️ محطة البداية: [${equipmentMap[drawStartStationId]?.code || drawStartStationId}]. انقر على الصالة لتحديد ثنيات المسار (${drawWaypoints.length} نقاط حالياً)، ثم انقر على محطة الوصول لإتمام السير الناقل فوراً!`
                    : `✏️ Start Station: [${equipmentMap[drawStartStationId]?.code || drawStartStationId}]. Click floor to add bend waypoints (${drawWaypoints.length} bends), then click target station to finish!`)
                : (isAr 
                    ? '✏️ أداة رسم المسارات بالماوس: انقر على محطة البداية التي سينطلق منها الخط الناقل.' 
                    : '✏️ Conveyor Path Drawing Pen: Click on the starting station to begin routing.')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {drawWaypoints.length > 0 && (
              <button
                onClick={() => setDrawWaypoints(prev => prev.slice(0, -1))}
                className="px-2.5 py-1 rounded-lg bg-slate-900/90 text-yellow-300 hover:text-white text-xs font-bold border border-yellow-500/30 transition-colors"
                title={isAr ? 'تراجع عن آخر نقطة ثني' : 'Undo last waypoint'}
              >
                ⤺ {isAr ? 'تراجع عن نقطة' : 'Undo Point'}
              </button>
            )}
            <button
              onClick={() => {
                setIsDrawingPath(false);
                setDrawStartStationId(null);
                setDrawWaypoints([]);
                setDrawCurrentMouse(null);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900/90 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-colors"
            >
              {isAr ? '✕ إلغاء الرسم (Esc)' : '✕ Cancel (Esc)'}
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. MAIN WORKSPACE: SCADA FLOORPLAN (2D / 2.5D ISOMETRIC MULTI-ANGLE) */}
      {/* ==================================================================== */}
      <div className="flex-1 relative flex overflow-hidden">
        {viewMode === '3d-webgl' ? (
          <div className="flex-1 w-full h-full relative overflow-hidden bg-[#040711]">
            <Suspense fallback={
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#050811] text-cyan-400 gap-3">
                <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
                <span className="text-xs font-mono font-bold tracking-wider animate-pulse">
                  {isAr ? 'جاري تشغيل محرك التوأم الرقمي ثلاثي الأبعاد (Three.js WebGL)...' : 'Loading 3D Digital Twin Engine (WebGL)...'}
                </span>
              </div>
            }>
              <EnterprisePlant3D
                equipmentList={equipmentList}
                stationStatuses={stationStatuses}
                selectedStationId={selectedStationId}
                onSelectStation={(id) => {
                  setSelectedStationId(id);
                  setIsDrawerOpen(true);
                  if (soundEnabled) playIndustrialChime('camera');
                }}
                isAr={isAr}
              />
            </Suspense>
          </div>
        ) : (
          <div 
            ref={canvasRef}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={(e) => {
              handlePointerMove(e);
              if (isWiringMode && wiringSource) {
                const floorBoard = canvasRef.current?.querySelector('.scada-floor-board') as HTMLElement;
                if (floorBoard) {
                  const rect = floorBoard.getBoundingClientRect();
                  const rawX = (e.clientX - rect.left) / (rect.width / 1200);
                  const rawY = (e.clientY - rect.top) / (rect.height / 640);
                  setMouseCanvasPos({ 
                    x: Math.max(10, Math.min(1190, Math.round(rawX))), 
                    y: Math.max(10, Math.min(630, Math.round(rawY))) 
                  });
                }
              }
            }}
            onPointerUp={handlePointerUp}
            className={`flex-1 w-full h-full relative overflow-hidden p-4 md:p-8 flex items-center justify-center transition-colors duration-500 ${
              ambientTheme === 'cleanroom' 
                ? 'bg-[#e2e8f0]' 
                : ambientTheme === 'night-shift' 
                  ? 'bg-[#010204]' 
                  : 'bg-[#040711]'
            }`}
            style={{ 
              perspective: is3D ? '1400px' : 'none',
              cursor: isDrawingPath ? 'crosshair' : isPanToolActive || isPanning ? 'grab' : isCustomizing && draggingId ? 'grabbing' : isWiringMode ? 'crosshair' : 'default'
            }}
          >
            <div 
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) ${getCameraTransform()}`,
                transformOrigin: 'center center',
                transformStyle: is3D ? 'preserve-3d' : 'flat',
                transition: (draggingId || isPanning || draggingWaypoint) ? 'none' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              className={`scada-floor-board relative w-[1200px] h-[640px] shrink-0 rounded-3xl border-2 transition-all duration-500 ${
                ambientTheme === 'cleanroom'
                  ? 'bg-[#f8fafc] border-slate-300 shadow-[0_30px_60px_rgba(0,0,0,0.15)] ring-2 ring-sky-500/20 text-slate-900'
                  : ambientTheme === 'night-shift'
                    ? 'bg-[#02050b] border-slate-900 shadow-[0_60px_120px_rgba(0,0,0,0.95)] ring-2 ring-amber-500/20'
                    : is3D 
                      ? 'bg-[#080d19] border-slate-800 shadow-[0_60px_120px_rgba(0,0,0,0.9),0_0_80px_rgba(6,182,212,0.15)] ring-4 ring-cyan-500/20' 
                      : 'bg-[#080d19] border-slate-800 shadow-2xl'
              }`}
            >
              {/* SVG ARCHITECTURAL INDUSTRIAL BACKGROUND & CONVEYOR NETWORK */}
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

                  {/* High-visibility yellow/black industrial hazard hatch */}
                  <pattern id="scada-hazard-stripes" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="8" height="16" fill="#f59e0b" fillOpacity="0.3" />
                    <rect x="8" width="8" height="16" fill="#000000" fillOpacity="0.5" />
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
                  <marker id="scada-arrow-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
                  </marker>
                  <marker id="scada-arrow-emerald" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
                  </marker>

                  {/* Rotating Emergency Siren Light Gradient */}
                  <radialGradient id="scada-emergency-siren" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.32" />
                    <stop offset="35%" stopColor="#dc2626" stopOpacity="0.18" />
                    <stop offset="70%" stopColor="#991b1b" stopOpacity="0.06" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="scada-siren-beam" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Grid Floor */}
                <rect width="1200" height="640" fill="url(#scada-grid)" />

                {/* ROTATING EMERGENCY SIREN SWEEP LIGHT (TRIGGERED ON ANDON / CRITICAL ALERTS) */}
                {(summaryMetrics.andonCount > 0 || summaryMetrics.alertCount > 0) && (
                  <g className="pointer-events-none mix-blend-screen">
                    <circle cx="600" cy="320" r="660" fill="url(#scada-emergency-siren)" className="animate-pulse" />
                    <g transform="translate(600, 320)">
                      <polygon points="0,0 -700,-180 -700,180" fill="url(#scada-siren-beam)" opacity="0.65">
                        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
                      </polygon>
                      <polygon points="0,0 700,-180 700,180" fill="url(#scada-siren-beam)" opacity="0.65">
                        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
                      </polygon>
                    </g>
                  </g>
                )}

                {/* Outer Plant Wall with Metallic Industrial Bevel */}
                <rect x="12" y="12" width="1176" height="616" fill="none" stroke={ambientTheme === 'cleanroom' ? '#94a3b8' : '#1e293b'} strokeWidth="4" rx="18" />
                <rect x="16" y="16" width="1168" height="608" fill="none" stroke={ambientTheme === 'cleanroom' ? '#cbd5e1' : '#0f172a'} strokeWidth="1.5" rx="16" />

                {/* STRUCTURAL BAY FLOORS WITH DISTINCT EPOXY FINISHES */}
                {/* Bay A: Receiving & Raw Buffer Floor */}
                <rect x="20" y="20" width="265" height="600" fill={ambientTheme === 'cleanroom' ? '#f1f5f9' : '#070d1a'} rx="12" opacity="0.6" />
                
                {/* Bay B: Machining & Assembly Floor */}
                <rect x="315" y="20" width="545" height="415" fill={ambientTheme === 'cleanroom' ? '#ffffff' : '#091122'} rx="12" opacity="0.7" />
                
                {/* Hub C: Metrology Cleanroom & MRB Floor */}
                <rect x="315" y="445" width="545" height="175" fill={ambientTheme === 'cleanroom' ? '#f8fafc' : '#0d1326'} rx="12" opacity="0.8" />
                <rect x="315" y="445" width="545" height="175" fill="none" stroke="#a855f7" strokeWidth="1" strokeDasharray="6,6" opacity="0.3" rx="12" />

                {/* Bay D: Final OQC & Packaging Floor */}
                <rect x="885" y="20" width="295" height="280" fill={ambientTheme === 'cleanroom' ? '#f1f5f9' : '#081322'} rx="12" opacity="0.6" />

                {/* Bay E: Shipping Logistics Yard */}
                <rect x="885" y="305" width="295" height="315" fill={ambientTheme === 'cleanroom' ? '#f8fafc' : '#060a14'} rx="12" opacity="0.7" />

                {/* STRUCTURAL BAY BOUNDARIES (DASHLINES) */}
                <line x1="290" y1="15" x2="290" y2="625" stroke={ambientTheme === 'cleanroom' ? '#cbd5e1' : '#1e293b'} strokeWidth="2" strokeDasharray="10,6" />
                <line x1="290" y1="440" x2="875" y2="440" stroke={ambientTheme === 'cleanroom' ? '#cbd5e1' : '#1e293b'} strokeWidth="2" strokeDasharray="10,6" />
                <line x1="875" y1="15" x2="875" y2="625" stroke={ambientTheme === 'cleanroom' ? '#cbd5e1' : '#1e293b'} strokeWidth="2" strokeDasharray="10,6" />
                <line x1="875" y1="300" x2="1185" y2="300" stroke={ambientTheme === 'cleanroom' ? '#cbd5e1' : '#1e293b'} strokeWidth="1.5" strokeDasharray="8,5" />

                {/* SAFETY PEDESTRIAN AISLES */}
                <rect x="293" y="15" width="22" height="610" fill="url(#scada-safety-walkway)" stroke="#F59E0B" strokeWidth="0.8" opacity="0.65" />
                <rect x="863" y="15" width="20" height="610" fill="url(#scada-safety-walkway)" stroke="#F59E0B" strokeWidth="0.8" opacity="0.65" />

                {/* PEDESTRIAN ZEBRA CROSSWALKS ACROSS AISLES */}
                <g fill="#ffffff" opacity={ambientTheme === 'cleanroom' ? '0.6' : '0.25'}>
                  {/* West Aisle Crosswalk at y=230 */}
                  <rect x="293" y="226" width="22" height="4" />
                  <rect x="293" y="234" width="22" height="4" />
                  <rect x="293" y="242" width="22" height="4" />
                  {/* East Aisle Crosswalk at y=230 */}
                  <rect x="863" y="226" width="20" height="4" />
                  <rect x="863" y="234" width="20" height="4" />
                  <rect x="863" y="242" width="20" height="4" />
                  {/* East Aisle Crosswalk at y=360 */}
                  <rect x="863" y="356" width="20" height="4" />
                  <rect x="863" y="364" width="20" height="4" />
                  <rect x="863" y="372" width="20" height="4" />
                </g>

                {/* STENCILED FACTORY FLOOR LETTERING */}
                <g fill={ambientTheme === 'cleanroom' ? '#94a3b8' : '#334155'} fontSize="9" fontWeight="900" letterSpacing="1.5" opacity="0.6">
                  <text x="35" y="48">ZONE A • INBOUND LOGISTICS & IQC</text>
                  <text x="330" y="48">ZONE B • AUTOMATED CNC & ASSEMBLY LINE 01</text>
                  <text x="330" y="462" fill={ambientTheme === 'cleanroom' ? '#a855f7' : '#9333ea'} opacity="0.8">HUB C • CLEANROOM METROLOGY & QA MRB</text>
                  <text x="900" y="48">ZONE D • FINAL OQC & PALLETIZING</text>
                  <text x="900" y="312">ZONE E • FREIGHT DOCKS & DISPATCH</text>
                </g>

                {/* STRUCTURAL H-BEAM STEEL COLUMNS WITH HAZARD BASES */}
                {[
                  { cx: 290, cy: 110 },
                  { cx: 290, cy: 440 },
                  { cx: 290, cy: 560 },
                  { cx: 875, cy: 180 },
                  { cx: 875, cy: 440 },
                  { cx: 875, cy: 560 }
                ].map((col, idx) => (
                  <g key={`col-${idx}`}>
                    {/* Yellow/Black hazard boundary circle */}
                    <circle cx={col.cx} cy={col.cy} r="10" fill="url(#scada-hazard-stripes)" stroke="#f59e0b" strokeWidth="1" />
                    {/* Concrete pedestal */}
                    <circle cx={col.cx} cy={col.cy} r="6" fill="#334155" stroke="#475569" strokeWidth="1" />
                    {/* Steel H-Beam profile */}
                    <rect x={col.cx - 3.5} y={col.cy - 3.5} width="7" height="7" fill="#0f172a" />
                    <path d={`M ${col.cx - 3} ${col.cy - 3} L ${col.cx + 3} ${col.cy - 3} M ${col.cx} ${col.cy - 3} L ${col.cx} ${col.cy + 3} M ${col.cx - 3} ${col.cy + 3} L ${col.cx + 3} ${col.cy + 3}`} stroke="#94a3b8" strokeWidth="1.5" />
                  </g>
                ))}

                {/* OVERHEAD GANTRY CRANE SPANNING BAY B */}
                <g opacity="0.75">
                  {/* Runway rails */}
                  <line x1="318" y1="62" x2="860" y2="62" stroke="#475569" strokeWidth="3" />
                  <line x1="318" y1="62" x2="860" y2="62" stroke="#f59e0b" strokeWidth="1" strokeDasharray="8,6" />
                  {/* Crane Bridge Girder (Yellow steel truss) */}
                  <rect x="540" y="52" width="70" height="20" rx="3" fill="#f59e0b" stroke="#78350f" strokeWidth="1" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.6))" />
                  <text x="575" y="66" textAnchor="middle" fill="#000000" fontSize="8" fontWeight="900" fontFamily="sans-serif">
                    CRANE 5T
                  </text>
                </g>

                {/* RED QUARANTINE HAZARD FLOOR */}
                <rect x="35" y="300" width="112" height="105" fill="url(#scada-quarantine-hatch)" stroke="#EF4444" strokeWidth="1.5" rx="10" />

                {/* INDUSTRIAL ROLL-UP DOCK DOORS */}
                {/* Gate 01: Inbound Receiving Door */}
                <g>
                  <rect x="14" y="80" width="8" height="75" fill="#f59e0b" rx="2" />
                  <line x1="14" y1="95" x2="22" y2="95" stroke="#78350f" strokeWidth="1.5" />
                  <line x1="14" y1="110" x2="22" y2="110" stroke="#78350f" strokeWidth="1.5" />
                  <line x1="14" y1="125" x2="22" y2="125" stroke="#78350f" strokeWidth="1.5" />
                  <line x1="14" y1="140" x2="22" y2="140" stroke="#78350f" strokeWidth="1.5" />
                  <text x="26" y="74" fill="#f59e0b" fontSize="10" fontWeight="900">Gate 01 [IN]</text>
                </g>

                {/* Gate 03: Outbound Logistics Door */}
                <g>
                  <rect x="1178" y="325" width="8" height="80" fill="#10b981" rx="2" />
                  <line x1="1178" y1="340" x2="1186" y2="340" stroke="#064e3b" strokeWidth="1.5" />
                  <line x1="1178" y1="355" x2="1186" y2="355" stroke="#064e3b" strokeWidth="1.5" />
                  <line x1="1178" y1="370" x2="1186" y2="370" stroke="#064e3b" strokeWidth="1.5" />
                  <line x1="1178" y1="385" x2="1186" y2="385" stroke="#064e3b" strokeWidth="1.5" />
                  <text x="1174" y="318" fill="#10b981" fontSize="10" fontWeight="900" textAnchor="end">Gate 03 [OUT]</text>
                </g>

                {/* ========================================================== */}
                {/* INTER-STATION INDUSTRIAL CONVEYORS & TRANSFER NETWORK      */}
                {/* ========================================================== */}
                {connectionsList.map(conn => {
                  const pathInfo = calculateConnectionPath(conn, equipmentMap);
                  if (!pathInfo) return null;

                  const isSourceSelected = selectedStationId === conn.fromId;
                  const isTargetSelected = selectedStationId === conn.toId;
                  const isConnActive = isSourceSelected || isTargetSelected;
                  const isSelectedConveyor = selectedConveyorId === conn.id;
                  const isConveyorStopped = Boolean(eStopConveyors[conn.id]);
                  const targetStationStatus = stationStatuses[conn.toId];
                  const hasLineHold = Boolean(targetStationStatus?.isAndonActive || targetStationStatus?.status === 'alert');

                  return (
                    <g 
                      key={conn.id} 
                      className="transition-all duration-300 pointer-events-auto cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedConveyorId(conn.id);
                        if (soundEnabled) playIndustrialChime('camera');
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        const coords = getFloorCoords(e);
                        setConnectionsList(prev => {
                          const next = prev.map(c => {
                            if (c.id !== conn.id) return c;
                            const existing = c.waypoints ? [...c.waypoints] : [];
                            return { ...c, waypoints: [...existing, coords] };
                          });
                          try {
                            localStorage.setItem(SCADA_CONNECTIONS_KEY, JSON.stringify(next));
                          } catch {}
                          return next;
                        });
                        setSelectedConveyorId(conn.id);
                        if (soundEnabled) playIndustrialChime('camera');
                        toast.success(isAr ? '➕ تم وضع نقطة ثني جديدة هنا! يمكنك سحبها بالماوس لتشكيل السير' : '➕ Added bend point! Drag it to shape the conveyor');
                      }}
                    >
                      {/* Conveyor Bed Drop Shadow */}
                      <path 
                        d={pathInfo.pathD} 
                        fill="none" 
                        stroke="rgba(0,0,0,0.65)" 
                        strokeWidth={conn.type === 'pneumatic' ? 12 : 24} 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />

                      {/* Clickable Invisible Thick Hit Path for ultra-responsive clicks */}
                      <path 
                        d={pathInfo.pathD} 
                        fill="none" 
                        stroke="transparent" 
                        strokeWidth={32} 
                        className="pointer-events-auto cursor-pointer" 
                      />

                      {/* Conveyor Selection Highlight Aura */}
                      {isSelectedConveyor && (
                        <path 
                          d={pathInfo.pathD} 
                          fill="none" 
                          stroke="#38bdf8" 
                          strokeWidth={28} 
                          strokeOpacity={0.4} 
                          className="animate-pulse pointer-events-none" 
                        />
                      )}

                      {/* Conveyor Outer Metallic Steel Guide Rails */}
                      {conn.type !== 'pneumatic' && (
                        <path 
                          d={pathInfo.pathD} 
                          fill="none" 
                          stroke={ambientTheme === 'cleanroom' ? '#475569' : '#1e293b'} 
                          strokeWidth={20} 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                        />
                      )}

                      {/* Conveyor Inner Bed / Rollers / Pneumatic Tube */}
                      {conn.type === 'pneumatic' ? (
                        <>
                          <path 
                            d={pathInfo.pathD} 
                            fill="none" 
                            stroke="#06b6d4" 
                            strokeWidth={8} 
                            strokeOpacity={0.4} 
                            strokeLinecap="round" 
                          />
                          <path 
                            d={pathInfo.pathD} 
                            fill="none" 
                            stroke="#38bdf8" 
                            strokeWidth={3} 
                            strokeDasharray="6,8" 
                            className={isConveyorStopped ? "" : "animate-[dash_1s_linear_infinite]"} 
                          />
                        </>
                      ) : conn.type === 'chute' ? (
                        <path 
                          d={pathInfo.pathD} 
                          fill="none" 
                          stroke="#ef4444" 
                          strokeWidth={14} 
                          strokeDasharray="8,6" 
                          strokeOpacity={0.85} 
                        />
                      ) : conn.type === 'dock-ramp' ? (
                        <path 
                          d={pathInfo.pathD} 
                          fill="none" 
                          stroke="#f59e0b" 
                          strokeWidth={16} 
                          strokeDasharray="4,4" 
                          strokeOpacity={0.8} 
                        />
                      ) : (
                        <>
                          <path 
                            d={pathInfo.pathD} 
                            fill="none" 
                            stroke={ambientTheme === 'cleanroom' ? '#94a3b8' : '#0f172a'} 
                            strokeWidth={14} 
                            strokeLinecap="round" 
                          />
                          <path 
                            d={pathInfo.pathD} 
                            fill="none" 
                            stroke={ambientTheme === 'cleanroom' ? '#64748b' : '#334155'} 
                            strokeWidth={12} 
                            strokeDasharray="4,6" 
                            className={isMaterialFlowActive && !isConveyorStopped ? "animate-[dash_2s_linear_infinite]" : ""} 
                          />
                        </>
                      )}

                      {/* Photoelectric Sensor Bracket with Pulsing Infrared Beam */}
                      {conn.type !== 'pneumatic' && (() => {
                        const sensorX = pathInfo.startX + (pathInfo.endX - pathInfo.startX) * 0.55;
                        const sensorY = pathInfo.startY + (pathInfo.endY - pathInfo.startY) * 0.55;
                        return (
                          <g transform={`translate(${sensorX}, ${sensorY})`} className="pointer-events-none">
                            <rect x="-5" y="-12" width="10" height="5" rx="1" fill="#1e293b" stroke="#38bdf8" strokeWidth="0.8" />
                            <rect x="-5" y="7" width="10" height="5" rx="1" fill="#1e293b" stroke="#38bdf8" strokeWidth="0.8" />
                            <line x1="0" y1="-7" x2="0" y2="7" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="2,1" className="animate-pulse" opacity="0.85" />
                            <circle cx="0" cy="-9.5" r="1.5" fill={isConveyorStopped ? "#ef4444" : "#22c55e"} className={isConveyorStopped ? "animate-ping" : ""} />
                            <circle cx="0" cy="9.5" r="1.5" fill={isConveyorStopped ? "#ef4444" : "#22c55e"} />
                          </g>
                        );
                      })()}

                      {/* Cyber Data Conduit / Glowing Pulse Line (Hybrid or Laser mode) */}
                      {(connectionStyle === 'laser' || connectionStyle === 'hybrid' || isConnActive || isSelectedConveyor) && (
                        <path 
                          d={pathInfo.pathD} 
                          fill="none" 
                          stroke={isConveyorStopped || hasLineHold ? '#ef4444' : isSelectedConveyor ? '#38bdf8' : isSourceSelected ? '#06b6d4' : isTargetSelected ? '#f59e0b' : '#38bdf8'} 
                          strokeWidth={isSelectedConveyor || isConnActive ? 4 : 2} 
                          strokeDasharray={isConveyorStopped || hasLineHold ? "6,4" : "10,8"} 
                          strokeOpacity={isSelectedConveyor || isConnActive ? 1 : 0.65}
                          className={isConveyorStopped || hasLineHold ? "animate-pulse" : isMaterialFlowActive ? "animate-[pulse_1.5s_infinite]" : ""}
                          markerEnd={isConveyorStopped || hasLineHold ? undefined : "url(#scada-arrow-cyan)"}
                        />
                      )}

                      {/* E-Stopped Emergency Badge */}
                      {isConveyorStopped && (
                        <g transform={`translate(${(pathInfo.startX + pathInfo.endX) / 2}, ${(pathInfo.startY + pathInfo.endY) / 2})`}>
                          <rect x="-44" y="-11" width="88" height="22" rx="5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" className="animate-pulse" />
                          <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900" fontFamily="monospace">
                            🛑 E-STOPPED
                          </text>
                        </g>
                      )}

                      {/* Conveyor Line Hold / Buffer Full Warning Badge */}
                      {hasLineHold && !isConveyorStopped && (
                        <g transform={`translate(${(pathInfo.startX + pathInfo.endX) / 2}, ${(pathInfo.startY + pathInfo.endY) / 2})`}>
                          <rect x="-38" y="-10" width="76" height="20" rx="5" fill="#ef4444" stroke="#ffffff" strokeWidth="1" className="animate-pulse" />
                          <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900" fontFamily="monospace">
                            LINE STOP
                          </text>
                        </g>
                      )}

                      {/* Conveyor ID / Velocity Floating Tag on Selection or Hover */}
                      {(isSelectedConveyor || isConnActive) && !hasLineHold && !isConveyorStopped && (
                        <g transform={`translate(${(pathInfo.startX + pathInfo.endX) / 2}, ${(pathInfo.startY + pathInfo.endY) / 2 - 14})`}>
                          <rect x="-54" y="-9" width="108" height="18" rx="4" fill="#0f172a" stroke={isSelectedConveyor ? '#38bdf8' : isSourceSelected ? '#06b6d4' : '#f59e0b'} strokeWidth="1.2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))" />
                          <text x="0" y="3" textAnchor="middle" fill={isSelectedConveyor ? '#38bdf8' : isSourceSelected ? '#38bdf8' : '#fbbf24'} fontSize="8" fontWeight="bold">
                            {isSelectedConveyor ? `${conn.id} • ${conn.velocityMs || 0.45}m/s` : isSourceSelected ? (isAr ? '▶ تدفق خارج' : '▶ Outfeed') : (isAr ? '◀ تغذية داخلة' : '◀ Infeed')}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* SELECTED CONVEYOR WAYPOINT DRAG HANDLES (ثنيات المسار التفاعلية بالسحب) */}
                {selectedConveyor && selectedConveyor.waypoints && selectedConveyor.waypoints.map((wp, wpIdx) => (
                  <g 
                    key={`wp-handle-${selectedConveyor.id}-${wpIdx}`}
                    className="pointer-events-auto cursor-grab active:cursor-grabbing group"
                    onPointerDown={(e) => handleWaypointPointerDown(e, selectedConveyor.id, wpIdx)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleDeleteWaypoint(selectedConveyor.id, wpIdx);
                    }}
                  >
                    {/* Pulsing Aura */}
                    <circle cx={wp.x} cy={wp.y} r={14} fill="#f59e0b" fillOpacity={0.25} className="animate-ping pointer-events-none" />
                    {/* Waypoint Handle */}
                    <circle 
                      cx={wp.x} 
                      cy={wp.y} 
                      r={9} 
                      fill="#f59e0b" 
                      stroke="#ffffff" 
                      strokeWidth={2} 
                      className="group-hover:scale-125 transition-transform drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" 
                    />
                    {/* Waypoint Number */}
                    <text x={wp.x} y={wp.y + 3.5} textAnchor="middle" fill="#000000" fontSize="8" fontWeight="900" pointerEvents="none">
                      {wpIdx + 1}
                    </text>
                  </g>
                ))}

                {/* ========================================================== */}
                {/* INTERACTIVE PATH DRAWING LIVE PREVIEW CABLE                */}
                {/* ========================================================== */}
                {isDrawingPath && drawStartStationId && equipmentMap[drawStartStationId] && (() => {
                  const fromEq = equipmentMap[drawStartStationId];
                  const sx = fromEq.x + fromEq.w / 2;
                  const sy = fromEq.y + fromEq.h / 2;
                  const allPts = [{ x: sx, y: sy }, ...drawWaypoints];
                  if (drawCurrentMouse) {
                    allPts.push(drawCurrentMouse);
                  }
                  const previewD = allPts.reduce((acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '');

                  return (
                    <g className="pointer-events-none">
                      {/* Outer Glow */}
                      <path
                        d={previewD}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth={22}
                        strokeOpacity={0.3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Conveyor Bed */}
                      <path
                        d={previewD}
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth={14}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Animated Live Dashes */}
                      <path
                        d={previewD}
                        fill="none"
                        stroke="#facc15"
                        strokeWidth={4}
                        strokeDasharray="6,6"
                        className="animate-[dash_0.8s_linear_infinite]"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Start Point Pulsing Ring */}
                      <circle cx={sx} cy={sy} r={12} fill="#06b6d4" fillOpacity={0.3} className="animate-ping" />
                      <circle cx={sx} cy={sy} r={6} fill="#06b6d4" stroke="#ffffff" strokeWidth={2} />

                      {/* Waypoint Markers */}
                      {drawWaypoints.map((wp, idx) => (
                        <g key={`draw-wp-${idx}`}>
                          <circle cx={wp.x} cy={wp.y} r={10} fill="#f59e0b" stroke="#ffffff" strokeWidth={2} />
                          <text x={wp.x} y={wp.y + 3.5} textAnchor="middle" fill="#000000" fontSize="9" fontWeight="900">
                            {idx + 1}
                          </text>
                        </g>
                      ))}

                      {/* Cursor Target Reticle */}
                      {drawCurrentMouse && (
                        <g transform={`translate(${drawCurrentMouse.x}, ${drawCurrentMouse.y})`}>
                          <circle r={14} fill="none" stroke="#facc15" strokeWidth={2} strokeDasharray="4,4" className="animate-spin" />
                          <circle r={4} fill="#facc15" />
                        </g>
                      )}
                    </g>
                  );
                })()}

                {/* ========================================================== */}
                {/* DIRECT CONNECTOR DRAG LIVE RUBBERBAND CABLE (FIGMA/MIRO)   */}
                {/* ========================================================== */}
                {activeConnectorDrag && equipmentMap[activeConnectorDrag.fromStationId] && (() => {
                  const src = equipmentMap[activeConnectorDrag.fromStationId];
                  let sx = src.x;
                  let sy = src.y;
                  if (activeConnectorDrag.fromAnchor === 'left') { sx = src.x; sy = src.y + src.h / 2; }
                  else if (activeConnectorDrag.fromAnchor === 'right') { sx = src.x + src.w; sy = src.y + src.h / 2; }
                  else if (activeConnectorDrag.fromAnchor === 'top') { sx = src.x + src.w / 2; sy = src.y; }
                  else if (activeConnectorDrag.fromAnchor === 'bottom') { sx = src.x + src.w / 2; sy = src.y + src.h; }

                  const hoveredTarget = equipmentList.find(eq => 
                    eq.id !== activeConnectorDrag.fromStationId &&
                    activeConnectorDrag.currentPos.x >= eq.x - 20 && activeConnectorDrag.currentPos.x <= eq.x + eq.w + 20 &&
                    activeConnectorDrag.currentPos.y >= eq.y - 20 && activeConnectorDrag.currentPos.y <= eq.y + eq.h + 20
                  );

                  const midX = (sx + activeConnectorDrag.currentPos.x) / 2;
                  const midY = (sy + activeConnectorDrag.currentPos.y) / 2;
                  const curvePath = `M ${sx} ${sy} Q ${midX} ${midY - 25} ${activeConnectorDrag.currentPos.x} ${activeConnectorDrag.currentPos.y}`;

                  return (
                    <g className="pointer-events-none">
                      {/* Outer Glow Aura */}
                      <path
                        d={curvePath}
                        fill="none"
                        stroke={hoveredTarget ? '#10b981' : '#06b6d4'}
                        strokeWidth="18"
                        strokeOpacity="0.3"
                        strokeLinecap="round"
                      />
                      {/* Solid Conveyor Core */}
                      <path
                        d={curvePath}
                        fill="none"
                        stroke={hoveredTarget ? '#059669' : '#0284c7'}
                        strokeWidth="6"
                        strokeLinecap="round"
                      />
                      {/* Dynamic White Dashed Flow Line */}
                      <path
                        d={curvePath}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        strokeDasharray="6,4"
                        className="animate-[dash_0.6s_linear_infinite]"
                        strokeLinecap="round"
                      />
                      {/* Source Port Indicator */}
                      <circle cx={sx} cy={sy} r="9" fill="#06b6d4" className="animate-ping" />
                      <circle cx={sx} cy={sy} r="5" fill="#ffffff" />
                      {/* Target Reticle / Cursor Ring */}
                      <circle 
                        cx={activeConnectorDrag.currentPos.x} 
                        cy={activeConnectorDrag.currentPos.y} 
                        r={hoveredTarget ? 16 : 9} 
                        fill={hoveredTarget ? '#10b981' : '#38bdf8'} 
                        stroke="#ffffff" 
                        strokeWidth="2.5" 
                        className={hoveredTarget ? 'animate-bounce' : ''} 
                      />
                      {hoveredTarget && (
                        <g transform={`translate(${activeConnectorDrag.currentPos.x}, ${activeConnectorDrag.currentPos.y - 22})`}>
                          <rect x="-80" y="-12" width="160" height="24" rx="6" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.8))" />
                          <text x="0" y="4" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="900">
                            ✓ {isAr ? `إفلات للربط بـ [${hoveredTarget.code}]` : `Release to connect [${hoveredTarget.code}]`}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })()}

                {/* ========================================================== */}
                {/* INTERACTIVE WIRING MODE LIVE RUBBERBAND CABLE              */}
                {/* ========================================================== */}
                {isWiringMode && wiringSource && mouseCanvasPos && equipmentMap[wiringSource.stationId] && (() => {
                  const src = equipmentMap[wiringSource.stationId];
                  let sx = src.x;
                  let sy = src.y;
                  if (wiringSource.anchor === 'left') { sx = src.x; sy = src.y + src.h / 2; }
                  else if (wiringSource.anchor === 'right') { sx = src.x + src.w; sy = src.y + src.h / 2; }
                  else if (wiringSource.anchor === 'top') { sx = src.x + src.w / 2; sy = src.y; }
                  else if (wiringSource.anchor === 'bottom') { sx = src.x + src.w / 2; sy = src.y + src.h; }
                  
                  return (
                    <g className="pointer-events-none">
                      {/* Wide Glow Aura */}
                      <line 
                        x1={sx} y1={sy} 
                        x2={mouseCanvasPos.x} y2={mouseCanvasPos.y} 
                        stroke="#06b6d4" 
                        strokeWidth="10" 
                        strokeOpacity="0.25"
                        strokeLinecap="round" 
                      />
                      {/* Main Dynamic Dashed Conveyor Cable */}
                      <line 
                        x1={sx} y1={sy} 
                        x2={mouseCanvasPos.x} y2={mouseCanvasPos.y} 
                        stroke="#38bdf8" 
                        strokeWidth="3.5" 
                        strokeDasharray="8,6" 
                        strokeLinecap="round"
                        className="animate-pulse"
                      />
                      {/* Source Port Indicator */}
                      <circle cx={sx} cy={sy} r="8" fill="#06b6d4" className="animate-ping" />
                      <circle cx={sx} cy={sy} r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
                      {/* Mouse Cursor Floating Puck */}
                      <circle cx={mouseCanvasPos.x} cy={mouseCanvasPos.y} r="8" fill="#0284c7" stroke="#ffffff" strokeWidth="2" filter="drop-shadow(0 0 8px #38bdf8)" />
                    </g>
                  );
                })()}

                {/* ========================================================== */}
                {/* DIVERTER GATES: D-01 REJECT GATE & D-02 QC LAB SHUTTLE     */}
                {/* ========================================================== */}
                {/* DIVERTER D-01: IQC Material Split Gate */}
                {(() => {
                  const iqcStatus = stationStatuses['STATION-IQC'];
                  const isIqcReject = Boolean(iqcStatus && (iqcStatus.status === 'alert' || iqcStatus.isAndonActive || iqcStatus.defectCount > 0));
                  return (
                    <g 
                      transform="translate(152, 225)" 
                      className="pointer-events-auto cursor-pointer group" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStationId('STATION-QUARANTINE');
                      }}
                    >
                      <rect x="-14" y="-12" width="28" height="24" rx="4" fill="#0f172a" stroke={isIqcReject ? "#ef4444" : "#10b981"} strokeWidth="1.5" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.8))" />
                      {/* Diverter Internal Flap Blade */}
                      <line 
                        x1="0" 
                        y1="8" 
                        x2={isIqcReject ? "-9" : "0"} 
                        y2={isIqcReject ? "-8" : "-8"} 
                        stroke={isIqcReject ? "#ef4444" : "#10b981"} 
                        strokeWidth="3.5" 
                        strokeLinecap="round" 
                        className="transition-all duration-500"
                      />
                      <circle cx="0" cy="8" r="3" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
                      <circle cx="9" cy="-7" r="2" fill={isIqcReject ? "#ef4444" : "#10b981"} className={isIqcReject ? "animate-ping" : ""} />
                      <text x="18" y="2" fill={isIqcReject ? "#ef4444" : "#38bdf8"} fontSize="7" fontWeight="bold" fontFamily="monospace">
                        {isIqcReject ? "DIVERT ▶ REJECT" : "PASS ▶ BUFFER"}
                      </text>
                    </g>
                  );
                })()}

                {/* DIVERTER D-02: IPQC to Bay C Pneumatic Lab Shuttle */}
                {(() => {
                  const ipqcStatus = stationStatuses['STATION-IPQC'];
                  const hasLabSample = Boolean(ipqcStatus && ipqcStatus.status !== 'pass');
                  return (
                    <g 
                      transform="translate(735, 410)" 
                      className="pointer-events-auto cursor-pointer group" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStationId('STATION-CMM');
                      }}
                    >
                      <rect x="-12" y="-12" width="24" height="24" rx="4" fill="#0f172a" stroke="#a855f7" strokeWidth="1.5" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.8))" />
                      <line 
                        x1="0" 
                        y1="-8" 
                        x2={hasLabSample ? "0" : "8"} 
                        y2={hasLabSample ? "8" : "0"} 
                        stroke="#c084fc" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        className="transition-all duration-300"
                      />
                      <circle cx="0" cy="0" r="2.5" fill="#a855f7" className="animate-pulse" />
                      <text x="-16" y="2" textAnchor="end" fill="#c084fc" fontSize="7" fontWeight="bold" fontFamily="monospace">
                        QA LAB SHUTTLE
                      </text>
                    </g>
                  );
                })()}

                {/* AUTONOMOUS AGV ROBOTS */}
                {isAgvActive && (
                  <g>
                    {/* AGV 01: Raw Inbound Materials Aisle Transport */}
                    <g>
                      <rect width="30" height="18" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.7))">
                        <animateMotion path="M 120 120 L 305 120 L 305 390 L 120 390 Z" dur="18s" repeatCount="indefinite" />
                      </rect>
                      {/* Forward scanning lidar light cone */}
                      <polygon points="30,9 45,2 45,16" fill="#f59e0b" opacity="0.35">
                        <animateMotion path="M 120 120 L 305 120 L 305 390 L 120 390 Z" dur="18s" repeatCount="indefinite" />
                      </polygon>
                      <circle cx="15" cy="9" r="3.5" fill="#f59e0b" className="animate-ping">
                        <animateMotion path="M 120 120 L 305 120 L 305 390 L 120 390 Z" dur="18s" repeatCount="indefinite" />
                      </circle>
                    </g>

                    {/* AGV 02: Central Quality Transfer to Metrology Lab */}
                    <g>
                      <rect width="30" height="18" rx="4" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.7))">
                        <animateMotion path="M 875 220 L 875 520 L 450 520 L 450 220 Z" dur="22s" repeatCount="indefinite" />
                      </rect>
                      <polygon points="30,9 45,2 45,16" fill="#06b6d4" opacity="0.35">
                        <animateMotion path="M 875 220 L 875 520 L 450 520 L 450 220 Z" dur="22s" repeatCount="indefinite" />
                      </polygon>
                      <circle cx="15" cy="9" r="3.5" fill="#06b6d4" className="animate-ping">
                        <animateMotion path="M 875 220 L 875 520 L 450 520 L 450 220 Z" dur="22s" repeatCount="indefinite" />
                      </circle>
                    </g>
                  </g>
                )}

                {/* LIVE GLIDING WIP WORKPIECES / MATERIAL STREAM ANIMATION */}
                {isMaterialFlowActive && (
                  <g>
                    {/* Workpiece 1: Raw Inbound Castings Crate from Gate 01 into IQC and Buffer */}
                    <g>
                      <rect width="18" height="14" rx="2" fill="#d97706" stroke="#78350f" strokeWidth="1" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.6))">
                        <animateMotion path="M 152 165 L 152 280 L 214 280 L 214 300" dur="8s" repeatCount="indefinite" />
                      </rect>
                      <circle cx="9" cy="7" r="2.5" fill="#fef3c7">
                        <animateMotion path="M 152 165 L 152 280 L 214 280 L 214 300" dur="8s" repeatCount="indefinite" />
                      </circle>
                    </g>

                    {/* Workpiece 2: Aluminum Machined Billet Tote moving through Machining Line */}
                    <g>
                      <rect width="16" height="12" rx="2" fill="#0ea5e9" stroke="#0369a1" strokeWidth="1" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.6))">
                        <animateMotion path="M 330 235 L 485 235 L 505 235 L 660 235 L 680 235 L 835 235 L 865 235 L 865 365 L 615 365" dur="14s" repeatCount="indefinite" />
                      </rect>
                      <rect x="4" y="3" width="8" height="6" rx="1" fill="#e0f2fe">
                        <animateMotion path="M 330 235 L 485 235 L 505 235 L 660 235 L 680 235 L 835 235 L 865 235 L 865 365 L 615 365" dur="14s" repeatCount="indefinite" />
                      </rect>
                    </g>

                    {/* Workpiece 3: Pneumatic Quality Sample Capsule shooting to Metrology Lab */}
                    <g>
                      <rect width="12" height="6" rx="3" fill="#a855f7" stroke="#ffffff" strokeWidth="1" filter="drop-shadow(0 0 8px #c084fc)">
                        <animateMotion path="M 735 420 L 735 445 L 452 445 L 452 470" dur="3.5s" repeatCount="indefinite" />
                      </rect>
                    </g>

                    {/* Workpiece 4: Tested Valve Assemblies Transfer to Bay D Final OQC */}
                    <g>
                      <rect width="18" height="14" rx="3" fill="#06b6d4" stroke="#164e63" strokeWidth="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.6))">
                        <animateMotion path="M 635 365 L 835 365 L 865 365 L 865 120 L 895 120" dur="10s" repeatCount="indefinite" />
                      </rect>
                      <circle cx="9" cy="7" r="2.5" fill="#ffffff" opacity="0.9">
                        <animateMotion path="M 635 365 L 835 365 L 865 365 L 865 120 L 895 120" dur="10s" repeatCount="indefinite" />
                      </circle>
                    </g>

                    {/* Workpiece 5: Finished Goods Carton Pallet loaded into Gate 03 Truck */}
                    <g>
                      <rect width="20" height="16" rx="3" fill="#10b981" stroke="#064e3b" strokeWidth="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.6))">
                        <animateMotion path="M 1025 170 L 1025 190 L 1025 290 L 1025 315 L 1025 415 L 1025 440" dur="11s" repeatCount="indefinite" />
                      </rect>
                      <rect x="4" y="3" width="12" height="10" rx="1" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8">
                        <animateMotion path="M 1025 170 L 1025 190 L 1025 290 L 1025 315 L 1025 415 L 1025 440" dur="11s" repeatCount="indefinite" />
                      </rect>
                    </g>
                  </g>
                )}
              </svg>

              {/* INDUSTRIAL BAY OVERLAY BADGES (ALL 5 BAYS) */}
              <div className="absolute top-4 left-8 pointer-events-none z-10 flex items-center gap-1.5 bg-[#0b1324]/90 border border-slate-700/80 px-2.5 py-1 rounded-xl shadow-md">
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

              <div className="absolute top-4 left-[895px] pointer-events-none z-10 flex items-center gap-1.5 bg-[#0b1324]/90 border border-slate-700/80 px-2.5 py-1 rounded-xl shadow-md">
                <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Bay D: الفحص النهائي والتغليف</span>
              </div>

              <div className="absolute top-[288px] left-[895px] pointer-events-none z-10 flex items-center gap-1.5 bg-[#0b1324]/90 border border-slate-700/80 px-2.5 py-1 rounded-xl shadow-md">
                <Truck className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[10px] font-black text-sky-400 uppercase tracking-wider">Bay E: رصيف الشحن واللوجستيات</span>
              </div>

              {/* SCADA EQUIPMENT PODS WITH 3D EXTRUSION, DOCKING PORTS & LASER BEACONS */}
              {filteredEquipment.map(eq => {
                const st = stationStatuses[eq.id];
                const dept = getDepartmentForStation(eq.id);
                const isDeptHighlighted = (selectedDeptId === dept?.id) || (isClosedLoopActive && ENTERPRISE_DEPARTMENTS[closedLoopStep]?.id === dept?.id);
                const isSelected = selectedStationId === eq.id;
                const isDragging = draggingId === eq.id;
                const isAndonActive = Boolean(st?.isAndonActive);
                const isAlert = st?.status === 'alert';
                const isWarning = st?.status === 'warning';

                // Check for physical infeed and outfeed connections
                const infeedConns = connectionsList.filter(c => c.toId === eq.id);
                const outfeedConns = connectionsList.filter(c => c.fromId === eq.id);
                const hasInfeed = infeedConns.length > 0;
                const hasOutfeed = outfeedConns.length > 0;

                return (
                  <div
                    key={eq.id}
                    onPointerDown={(e) => handleStationPointerDown(e, eq)}
                    onClick={(e) => {
                      if (isDrawingPath) {
                        handleStationClickWhileDrawing(eq, e);
                        return;
                      }
                      setSelectedStationId(eq.id);
                      if (dept && !selectedDeptId) {
                        // Keep drawer synchronized with department if on department tab
                      }
                    }}
                    style={{
                      left: `${eq.x}px`,
                      top: `${eq.y}px`,
                      width: `${eq.w}px`,
                      height: `${eq.h}px`,
                      transform: is3D 
                        ? (isDragging ? 'translateZ(65px) scale(1.08)' : isSelected || isDeptHighlighted ? 'translateZ(46px) scale(1.04)' : 'translateZ(26px)')
                        : (isDragging ? 'scale(1.05)' : isSelected || isDeptHighlighted ? 'scale(1.02)' : 'none'),
                      boxShadow: is3D
                        ? (isDragging 
                            ? '-20px 30px 40px rgba(0,0,0,0.8), -2px 4px 0px rgba(255,255,255,0.2)' 
                            : isDeptHighlighted
                              ? `0 0 25px ${dept?.accentHex || '#38bdf8'}99, -15px 22px 30px rgba(0,0,0,0.8)`
                              : isAlert || isAndonActive 
                                ? '-15px 22px 30px rgba(239,68,68,0.5), -1px 2px 0px rgba(255,255,255,0.15)'
                                : '-12px 18px 24px rgba(0,0,0,0.7), -1px 2px 0px rgba(255,255,255,0.15)')
                        : undefined,
                      border: isDeptHighlighted ? `2px solid ${dept?.accentHex || '#38bdf8'}` : undefined,
                      cursor: draggingId === eq.id ? 'grabbing' : 'grab'
                    }}
                    className={`
                      absolute rounded-2xl transition-all duration-200 p-2.5 flex flex-col justify-between
                      backdrop-blur-md select-none group relative overflow-visible ${isWiringMode ? 'ring-2 ring-cyan-400/40' : ''}
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
                    {/* MACHINE BLUEPRINT WATERMARK IN BACKGROUND */}
                    {renderMachineWatermark(eq.code)}

                    {/* CORNER RIVETS FOR HEAVY INDUSTRIAL CASING FEEL */}
                    <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-slate-500/40 pointer-events-none" />
                    <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-slate-500/40 pointer-events-none" />
                    <div className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-slate-500/40 pointer-events-none" />
                    <div className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-slate-500/40 pointer-events-none" />

                    {/* PHYSICAL CONVEYOR DOCKING PORTS (4 UNIVERSAL INTERACTIVE MAGNETIC PORTS) */}
                    {/* LEFT DOCK PORT */}
                    <button
                      type="button"
                      onPointerDown={(e) => handleConnectorPointerDown(e, eq.id, 'left')}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAnchorClick(eq.id, 'left');
                      }}
                      className={`absolute -left-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black z-30 transition-all cursor-crosshair shadow-lg ${
                        isWiringMode || activeConnectorDrag || isSelected
                          ? 'opacity-100 scale-100 hover:scale-125'
                          : 'opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 hover:scale-125'
                      } ${
                        wiringSource?.stationId === eq.id && wiringSource?.anchor === 'left'
                          ? 'bg-amber-400 border-white text-slate-950 ring-4 ring-amber-400/50 animate-pulse'
                          : 'bg-cyan-500 hover:bg-cyan-400 border-white text-slate-950 shadow-cyan-500/50'
                      }`}
                      title={isAr ? `منفذ أيسر - اسحب بالماوس للربط بسير ناقل أو انقر للتوصيل` : `Left Port - Drag to connect conveyor or click`}
                    >
                      ◀
                    </button>

                    {/* RIGHT DOCK PORT */}
                    <button
                      type="button"
                      onPointerDown={(e) => handleConnectorPointerDown(e, eq.id, 'right')}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAnchorClick(eq.id, 'right');
                      }}
                      className={`absolute -right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black z-30 transition-all cursor-crosshair shadow-lg ${
                        isWiringMode || activeConnectorDrag || isSelected
                          ? 'opacity-100 scale-100 hover:scale-125'
                          : 'opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 hover:scale-125'
                      } ${
                        wiringSource?.stationId === eq.id && wiringSource?.anchor === 'right'
                          ? 'bg-amber-400 border-white text-slate-950 ring-4 ring-amber-400/50 animate-pulse'
                          : 'bg-emerald-500 hover:bg-emerald-400 border-white text-slate-950 shadow-emerald-500/50'
                      }`}
                      title={isAr ? `منفذ أيمن - اسحب بالماوس للربط بسير ناقل أو انقر للتوصيل` : `Right Port - Drag to connect conveyor or click`}
                    >
                      ▶
                    </button>

                    {/* TOP DOCK PORT */}
                    <button
                      type="button"
                      onPointerDown={(e) => handleConnectorPointerDown(e, eq.id, 'top')}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAnchorClick(eq.id, 'top');
                      }}
                      className={`absolute top-[-14px] left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black z-30 transition-all cursor-crosshair shadow-lg ${
                        isWiringMode || activeConnectorDrag || isSelected
                          ? 'opacity-100 scale-100 hover:scale-125'
                          : 'opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 hover:scale-125'
                      } ${
                        wiringSource?.stationId === eq.id && wiringSource?.anchor === 'top'
                          ? 'bg-amber-400 border-white text-slate-950 ring-4 ring-amber-400/50 animate-pulse'
                          : 'bg-blue-500 hover:bg-blue-400 border-white text-slate-950 shadow-blue-500/50'
                      }`}
                      title={isAr ? `منفذ علوي - اسحب بالماوس للربط بسير ناقل أو انقر للتوصيل` : `Top Port - Drag to connect conveyor or click`}
                    >
                      ▲
                    </button>

                    {/* BOTTOM DOCK PORT */}
                    <button
                      type="button"
                      onPointerDown={(e) => handleConnectorPointerDown(e, eq.id, 'bottom')}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAnchorClick(eq.id, 'bottom');
                      }}
                      className={`absolute bottom-[-14px] left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black z-30 transition-all cursor-crosshair shadow-lg ${
                        isWiringMode || activeConnectorDrag || isSelected
                          ? 'opacity-100 scale-100 hover:scale-125'
                          : 'opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 hover:scale-125'
                      } ${
                        wiringSource?.stationId === eq.id && wiringSource?.anchor === 'bottom'
                          ? 'bg-amber-400 border-white text-slate-950 ring-4 ring-amber-400/50 animate-pulse'
                          : 'bg-purple-500 hover:bg-purple-400 border-white text-slate-950 shadow-purple-500/50'
                      }`}
                      title={isAr ? `منفذ سفلي - اسحب بالماوس للربط بسير ناقل أو انقر للتوصيل` : `Bottom Port - Drag to connect conveyor or click`}
                    >
                      ▼
                    </button>

                    {/* Conveyor Infeed / Outfeed Subtle Markers when not hovered */}
                    {hasInfeed && (
                      <div 
                        className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-5 rounded-l bg-cyan-500/90 shadow-[0_0_8px_#06b6d4] flex items-center justify-center text-[7px] font-mono text-slate-950 font-black pointer-events-none group-hover:opacity-0 transition-opacity" 
                        title="Conveyor Infeed Port"
                      >
                        ▶
                      </div>
                    )}
                    {hasOutfeed && (
                      <div 
                        className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2 h-5 rounded-r bg-emerald-500/90 shadow-[0_0_8px_#10b981] flex items-center justify-center text-[7px] font-mono text-slate-950 font-black pointer-events-none group-hover:opacity-0 transition-opacity" 
                        title="Conveyor Outfeed Port"
                      >
                        ▶
                      </div>
                    )}

                    {/* HOLOGRAPHIC VERTICAL LASER BEACON */}
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
                    <div className="flex items-center justify-between z-10">
                      <div className="flex items-center gap-1.5">
                        <span className={`p-1 rounded-lg ${isAndonActive ? 'bg-pink-500 text-white' : isAlert ? 'bg-red-500/20 text-red-400' : isWarning ? 'bg-amber-500/20 text-amber-400' : ambientTheme === 'cleanroom' ? 'bg-sky-100 text-sky-700' : 'bg-slate-800 text-slate-300'}`}>
                          {renderIcon(eq.iconType, 'w-3.5 h-3.5')}
                        </span>
                        <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md border ${ambientTheme === 'cleanroom' ? 'bg-slate-100 text-slate-700 border-slate-300' : 'text-slate-300 bg-black/40 border-white/5'}`}>
                          {eq.code}
                        </span>

                        {dept && (
                          <span 
                            style={{ borderColor: `${dept.accentHex}40`, color: dept.accentHex }}
                            className="text-[8px] font-mono font-black px-1.5 py-0.2 rounded bg-black/60 border hidden sm:inline"
                            title={isAr ? dept.nameAr : dept.nameEn}
                          >
                            {dept.code}
                          </span>
                        )}

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
                        /* Andon Triple LED Patlite Signal Tower */
                        <div className="flex items-center gap-1 bg-black/70 px-1.5 py-0.5 rounded-full border border-white/10 shadow-inner">
                          <span className={`w-2 h-2 rounded-full transition-all ${isAndonActive ? 'bg-pink-500 shadow-[0_0_10px_#ec4899] animate-ping' : isAlert ? 'bg-red-500 shadow-[0_0_8px_#ef4444] animate-ping' : 'bg-red-950/60'}`} />
                          <span className={`w-2 h-2 rounded-full transition-all ${isWarning ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-amber-950/60'}`} />
                          <span className={`w-2 h-2 rounded-full transition-all ${st?.status === 'pass' ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-emerald-950/60'}`} />
                        </div>
                      )}
                    </div>

                    {/* Machine Title & Location */}
                    <div className="my-0.5 z-10">
                      <h4 className={`text-xs font-black leading-tight truncate ${ambientTheme === 'cleanroom' ? 'text-slate-900' : 'text-white'}`}>
                        {isAr ? eq.titleAr : eq.titleEn}
                      </h4>
                      <p className={`text-[10px] truncate ${ambientTheme === 'cleanroom' ? 'text-slate-500' : 'text-slate-400'}`}>
                        {isAr ? eq.locationAr : eq.locationEn}
                      </p>
                    </div>

                    {/* DYNAMIC PLATFORM LINKAGE MINI PILLS */}
                    <div className="flex items-center gap-1 my-0.5 overflow-hidden flex-wrap z-10">
                      {st?.openNcrCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-red-500/20 text-red-300 border border-red-500/40">
                          NCR: {st.openNcrCount}
                        </span>
                      )}
                      {st?.defectCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          DEF: {st.defectCount}
                        </span>
                      )}
                      {st?.eightDCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          8D: {st.eightDCount}
                        </span>
                      )}
                      {st?.capaCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/40">
                          CAPA: {st.capaCount}
                        </span>
                      )}
                      {st?.inspectionCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          IQC: {st.inspectionCount}
                        </span>
                      )}
                      {st?.spcCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          SPC: {st.spcCount}
                        </span>
                      )}
                    </div>

                    {/* LIVE ANIMATED MACHINE COCKPIT MECHANISM */}
                    {renderMachineCockpit(eq.code, isAlert, isAndonActive)}

                    {/* LIVE IOT SENSOR OSCILLOSCOPE WAVEFORM */}
                    {showOscilloscope && (
                      <div className="h-2.5 w-full overflow-hidden flex items-center opacity-85 my-0.5 z-10">
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

                    {/* Bottom Telemetry Strip: Mini OEE Gauge, Vibration & Real Status */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[9px] font-bold z-10">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-mono truncate max-w-[55px]">{eq.line}</span>
                        {eq.oeeEstimate && (
                          <span className="text-cyan-400 font-mono bg-cyan-950/60 px-1 rounded border border-cyan-500/30">
                            {eq.oeeEstimate}%
                          </span>
                        )}
                        {eq.temperatureC && (
                          <span className="text-slate-400 font-mono hidden sm:inline">
                            {eq.temperatureC}°C
                          </span>
                        )}
                      </div>
                      
                      {isAndonActive ? (
                        <span className="text-pink-400 font-black flex items-center gap-0.5 animate-pulse">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>أندون</span>
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

              {/* ============================================================== */}
              {/* CONTEXTUAL FLOATING ACTION MINI-TOOLBAR FOR SELECTED STATION   */}
              {/* ============================================================== */}
              {selectedStationId && equipmentMap[selectedStationId] && (() => {
                const eq = equipmentMap[selectedStationId];
                // Find closest station not yet connected to this station
                const otherStations = equipmentList.filter(o => o.id !== eq.id);
                const unconnected = otherStations.filter(o => 
                  !connectionsList.some(c => (c.fromId === eq.id && c.toId === o.id) || (c.fromId === o.id && c.toId === eq.id))
                );
                const nearest = (unconnected.length > 0 ? unconnected : otherStations)
                  .map(o => ({
                    st: o,
                    dist: Math.hypot((o.x + o.w / 2) - (eq.x + eq.w / 2), (o.y + o.h / 2) - (eq.y + eq.h / 2))
                  }))
                  .sort((a, b) => a.dist - b.dist)[0]?.st;

                const posX = Math.max(90, Math.min(1110, eq.x + eq.w / 2));
                const posY = Math.max(16, eq.y - 48);

                return (
                  <div 
                    key={`station-hud-${eq.id}`}
                    className="absolute z-50 pointer-events-auto flex items-center gap-1.5 p-1 rounded-2xl bg-[#0a1020]/95 backdrop-blur-xl border border-amber-400/90 shadow-[0_12px_36px_rgba(0,0,0,0.85),0_0_20px_rgba(245,158,11,0.35)] animate-in fade-in zoom-in-95 duration-150 select-none"
                    style={{
                      left: `${posX}px`,
                      top: `${posY}px`,
                      transform: 'translateX(-50%)'
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Station Code Badge */}
                    <span className="px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black text-[10px] font-mono shadow">
                      {eq.code}
                    </span>

                    {/* 1-Click Fast Connect to Nearest Station */}
                    {nearest && (
                      <button
                        type="button"
                        onClick={() => handleQuickConnect(eq.id, nearest.id)}
                        className="px-2 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-md transition-all active:scale-95"
                        title={isAr ? `ربط فوري بسير ناقل مع أقرب محطة [${nearest.code}]` : `1-Click link conveyor to nearest [${nearest.code}]`}
                      >
                        <Workflow className="w-3 h-3 text-slate-950" />
                        <span>{isAr ? `ربط بـ [${nearest.code}]` : `Link ${nearest.code}`}</span>
                      </button>
                    )}

                    {/* Precision 4-Way Nudge Controls */}
                    <div className="flex items-center bg-black/60 rounded-xl p-0.5 border border-white/10">
                      <button 
                        type="button"
                        onClick={() => nudgeStation(eq.id, -15, 0)} 
                        className="p-1 rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors" 
                        title={isAr ? 'إزاحة يسار (15px)' : 'Nudge Left (15px)'}
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => nudgeStation(eq.id, 0, -15)} 
                        className="p-1 rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors" 
                        title={isAr ? 'إزاحة لأعلى (15px)' : 'Nudge Up (15px)'}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => nudgeStation(eq.id, 0, 15)} 
                        className="p-1 rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors" 
                        title={isAr ? 'إزاحة لأسفل (15px)' : 'Nudge Down (15px)'}
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => nudgeStation(eq.id, 15, 0)} 
                        className="p-1 rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors" 
                        title={isAr ? 'إزاحة يمين (15px)' : 'Nudge Right (15px)'}
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Quick Edit */}
                    <button
                      type="button"
                      onClick={() => setEditingStation(eq)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors"
                      title={isAr ? 'تعديل البيانات' : 'Edit Specs'}
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>

                    {/* Delete Station */}
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(eq.id)}
                      className="p-1.5 rounded-xl bg-red-950/80 hover:bg-red-800 text-red-300 border border-red-500/40 transition-colors"
                      title={isAr ? 'حذف المحطة' : 'Delete Station'}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    {/* Close Selection */}
                    <button
                      type="button"
                      onClick={() => setSelectedStationId(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
                      title={isAr ? 'إلغاء التحديد' : 'Deselect'}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })()}

              {/* ============================================================== */}
              {/* CONTEXTUAL FLOATING ACTION MINI-TOOLBAR FOR SELECTED CONVEYOR */}
              {/* ============================================================== */}
              {selectedConveyorId && (() => {
                const selConn = connectionsList.find(c => c.id === selectedConveyorId);
                if (!selConn) return null;
                const fromSt = equipmentMap[selConn.fromId];
                const toSt = equipmentMap[selConn.toId];
                if (!fromSt || !toSt) return null;

                let midX = (fromSt.x + fromSt.w / 2 + toSt.x + toSt.w / 2) / 2;
                let midY = (fromSt.y + fromSt.h / 2 + toSt.y + toSt.h / 2) / 2;
                if (selConn.waypoints && selConn.waypoints.length > 0) {
                  midX = selConn.waypoints[0].x;
                  midY = selConn.waypoints[0].y;
                }

                const posX = Math.max(110, Math.min(1090, midX));
                const posY = Math.max(16, midY - 44);

                return (
                  <div 
                    key={`conveyor-hud-${selConn.id}`}
                    className="absolute z-50 pointer-events-auto flex items-center gap-1.5 p-1 rounded-2xl bg-[#081024]/95 backdrop-blur-xl border border-cyan-400 shadow-[0_12px_36px_rgba(0,0,0,0.85),0_0_20px_rgba(6,182,212,0.45)] animate-in fade-in zoom-in-95 duration-150 select-none"
                    style={{
                      left: `${posX}px`,
                      top: `${posY}px`,
                      transform: 'translateX(-50%)'
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Conveyor Type Badge */}
                    <span className="px-2 py-0.5 rounded-lg bg-cyan-500 text-slate-950 font-black text-[10px] font-mono shadow">
                      {selConn.type}
                    </span>

                    {/* 1-Click Reverse Direction */}
                    <button
                      type="button"
                      onClick={() => handleReverseConnection(selConn.id)}
                      className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-[10px] flex items-center gap-1 border border-cyan-500/30 transition-all active:scale-95"
                      title={isAr ? 'عكس اتجاه حركة وتدفق المنتجات' : 'Reverse Conveyor Flow'}
                    >
                      <RotateCcw className="w-3 h-3 text-cyan-400" />
                      <span>{isAr ? 'عكس الاتجاه' : 'Reverse'}</span>
                    </button>

                    {/* 1-Click Add Bend Waypoint */}
                    <button
                      type="button"
                      onClick={() => {
                        setConnectionsList(prev => {
                          const next = prev.map(c => {
                            if (c.id !== selConn.id) return c;
                            const existing = c.waypoints ? [...c.waypoints] : [];
                            return { ...c, waypoints: [...existing, { x: Math.round(midX), y: Math.round(midY) }] };
                          });
                          try {
                            localStorage.setItem(SCADA_CONNECTIONS_KEY, JSON.stringify(next));
                          } catch {}
                          return next;
                        });
                        if (soundEnabled) playIndustrialChime('camera');
                        toast.success(isAr ? '➕ تم وضع نقطة ثني جديدة! اسحبها بالماوس' : '➕ Added bend point! Drag it');
                      }}
                      className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[10px] flex items-center gap-1 border border-amber-500/30 transition-all active:scale-95"
                      title={isAr ? 'إضافة نقطة ثني وانعطاف للسير' : 'Add Bend Waypoint'}
                    >
                      <Plus className="w-3 h-3 text-amber-400" />
                      <span>{isAr ? '+ ثنية' : '+ Bend'}</span>
                    </button>

                    {/* Cycle Technology */}
                    <button
                      type="button"
                      onClick={() => handleCycleConveyorType(selConn.id)}
                      className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-[10px] flex items-center gap-1 border border-purple-500/30 transition-all active:scale-95"
                      title={isAr ? 'تبديل نوع وتقنية السير' : 'Cycle Conveyor Type'}
                    >
                      <Workflow className="w-3 h-3 text-purple-400" />
                      <span>{isAr ? 'نوع السير' : 'Type'}</span>
                    </button>

                    {/* Delete Conveyor */}
                    <button
                      type="button"
                      onClick={() => handleDeleteConnection(selConn.id)}
                      className="p-1.5 rounded-xl bg-red-950/80 hover:bg-red-800 text-red-300 border border-red-500/40 transition-colors"
                      title={isAr ? 'حذف هذا السير الناقل' : 'Delete Conveyor'}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    {/* Close Selection */}
                    <button
                      type="button"
                      onClick={() => setSelectedConveyorId(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
                      title={isAr ? 'إلغاء التحديد' : 'Deselect'}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })()}

              {/* ============================================================== */}
              {/* CANVAS TOP FLOATING QUICK ACTION MAGIC BAR                     */}
              {/* ============================================================== */}
              <div 
                className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#090f1e]/90 backdrop-blur-xl border border-white/10 shadow-2xl select-none pointer-events-auto"
                onClick={e => e.stopPropagation()}
              >
                {/* Smart Auto-Flow */}
                <button
                  type="button"
                  onClick={handleAutoConnectStations}
                  className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-[11px] flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all active:scale-95"
                  title={isAr ? 'ربط تسلسلي ذكي وتلقائي لكافة محطات المصنع بسيور ناقلة بضغطة زر واحدة!' : 'Smart auto-connect all factory stations with sequential conveyors in 1-click!'}
                >
                  <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                  <span>{isAr ? '⚡ ربط تسلسلي ذكي' : '⚡ Auto Flow'}</span>
                </button>

                {/* Auto-Align Layout */}
                <button
                  type="button"
                  onClick={handleAutoAlignLayout}
                  className="px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-500/30 font-bold text-[11px] flex items-center gap-1.5 transition-all active:scale-95"
                  title={isAr ? 'محاذاة وترتيب المحطات تلقائياً حسب عنابر المصنع' : 'Auto-align stations by factory bays'}
                >
                  <AlignJustify className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">{isAr ? '📐 محاذاة العنابر' : '📐 Auto Align'}</span>
                </button>

                {/* Freehand Draw Pen */}
                <button
                  type="button"
                  onClick={handleStartDrawingMode}
                  className={`px-2.5 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-all active:scale-95 border ${
                    isDrawingPath 
                      ? 'bg-amber-400 text-slate-950 border-white ring-2 ring-amber-400' 
                      : 'bg-slate-900/90 hover:bg-slate-800 text-yellow-300 border-yellow-500/30'
                  }`}
                  title={isAr ? 'رسم مسار حر بالماوس' : 'Draw conveyor path'}
                >
                  <PenTool className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="hidden sm:inline">{isDrawingPath ? (isAr ? '✕ إنهاء الرسم' : 'Done') : (isAr ? '✏️ رسم حر' : 'Pen')}</span>
                </button>

                {/* Reset Connections */}
                <button
                  type="button"
                  onClick={handleResetConnections}
                  className="p-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors"
                  title={isAr ? 'استعادة شبكة المسارات النموذجية' : 'Reset default flow'}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* ============================================================== */}
            {/* FLOATING REAL-TIME CONVEYOR TELEMETRY HUD CARD                 */}
            {/* ============================================================== */}
            {selectedConveyor && (
              <div 
                className="absolute bottom-6 left-6 z-40 w-80 sm:w-96 rounded-2xl bg-[#090f1e]/95 backdrop-blur-xl border border-cyan-500/40 p-4 shadow-2xl shadow-cyan-950/80 animate-in fade-in slide-in-from-bottom-4 duration-200"
                onClick={e => e.stopPropagation()}
              >
                {/* HUD Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-cyan-500/20">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                      <Workflow className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-black text-cyan-400 px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/40">
                          {selectedConveyor.id}
                        </span>
                        <span className="text-[9px] font-mono uppercase text-slate-400">
                          {selectedConveyor.type}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-white mt-0.5">
                        {isAr ? selectedConveyor.nameAr : selectedConveyor.nameEn}
                      </h4>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedConveyorId(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Live Drive Telemetry Grid */}
                <div className="grid grid-cols-2 gap-2 my-2.5 text-xs">
                  {/* Linear Speed / Velocity */}
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span>{isAr ? 'السرعة الخطية (Velocity):' : 'Speed:'}</span>
                      <span className={`w-2 h-2 rounded-full ${eStopConveyors[selectedConveyor.id] ? 'bg-red-500' : 'bg-emerald-400 animate-ping'}`} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-black font-mono text-cyan-400">
                        {eStopConveyors[selectedConveyor.id] ? '0.00' : selectedConveyor.velocityMs || 0.45}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">m/s</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-1 rounded-full transition-all duration-300"
                        style={{ width: eStopConveyors[selectedConveyor.id] ? '0%' : `${((selectedConveyor.velocityMs || 0.45) / 3.0) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Drive Motor Power */}
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1">{isAr ? 'محرك الدفع (Inverter):' : 'Motor Rating:'}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-black font-mono text-amber-300">
                        {selectedConveyor.motorKw || 0.75}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">kW (50Hz)</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 block mt-1 truncate">
                      VFD AC Synchronized
                    </span>
                  </div>

                  {/* Buffer WIP Capacity */}
                  <div className="col-span-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-slate-400">{isAr ? 'حمولة الخط الناقل (WIP Queue):' : 'Conveyor Buffer Load:'}</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {selectedConveyor.currentWip || 8} / {selectedConveyor.capacityUnits || 20} {isAr ? 'قطعة' : 'units'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-amber-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((selectedConveyor.currentWip || 8) / (selectedConveyor.capacityUnits || 20)) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Sensor Telemetry */}
                  <div className="col-span-2 p-2 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[10px] flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="text-slate-300 font-medium">{selectedConveyor.sensorType || 'Optical Sensor'}</span>
                    </div>
                    <span className="font-mono text-cyan-300 font-bold">{isAr ? 'إشارة شعاع نشطة ✓' : 'BEAM ACTIVE'}</span>
                  </div>
                </div>

                {/* Custom Waypoints Routing & Adjustment Bar */}
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/30 my-2 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-300 flex items-center gap-1">
                      <PenTool className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isAr ? 'توجيه المسار ونقاط الثني:' : 'Custom Waypoints & Bends:'}</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-500/40 font-bold">
                      {selectedConveyor.waypoints?.length || 0} {isAr ? 'نقاط ثني' : 'bends'}
                    </span>
                  </div>

                  {/* Waypoint Action Buttons */}
                  <div className="grid grid-cols-3 gap-1 text-[10px]">
                    <button
                      onClick={() => handleAddWaypointToConveyor(selectedConveyor.id)}
                      className="py-1 px-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 font-black border border-amber-500/40 transition-all text-center flex items-center justify-center gap-1 shadow-sm"
                      title={isAr ? 'إضافة نقطة ثني جديدة في منتصف المسار لسحبها' : 'Add bend waypoint handle to drag'}
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isAr ? 'ثنية جديدة' : '+ Bend'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setDrawStartStationId(selectedConveyor.fromId);
                        setDrawWaypoints([]);
                        setIsDrawingPath(true);
                        setCameraPreset('top-down');
                        toast.info(isAr ? '✏️ ارسم المسار بالماوس ثم انقر على محطة الوجهة!' : '✏️ Draw path bends then click destination!');
                      }}
                      className="py-1 px-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold transition-all text-center flex items-center justify-center gap-1 shadow-sm"
                      title={isAr ? 'إعادة رسم هذا المسار بالكامل بالماوس' : 'Redraw this path with mouse pen'}
                    >
                      <PenTool className="w-3 h-3 text-cyan-400" />
                      <span>{isAr ? 'إعادة رسم' : 'Redraw'}</span>
                    </button>

                    <button
                      onClick={() => handleResetConveyorWaypoints(selectedConveyor.id)}
                      className="py-1 px-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold transition-all text-center flex items-center justify-center gap-1 shadow-sm"
                      title={isAr ? 'استعادة المسار الهندسي التلقائي وحذف الثنيات المخصصة' : 'Reset to auto-routed connection'}
                    >
                      <RotateCcw className="w-3 h-3 text-slate-400" />
                      <span>{isAr ? 'تلقائي' : 'Auto'}</span>
                    </button>
                  </div>

                  {/* Waypoint Coordinates Chips if present */}
                  {selectedConveyor.waypoints && selectedConveyor.waypoints.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-white/5">
                      {selectedConveyor.waypoints.map((wp, wpIdx) => (
                        <div 
                          key={wpIdx}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 border border-amber-500/30 text-[9px] font-mono text-amber-200"
                        >
                          <span className="font-bold">P{wpIdx + 1}:</span>
                          <span>({wp.x}, {wp.y})</span>
                          <button
                            onClick={() => handleDeleteWaypoint(selectedConveyor.id, wpIdx)}
                            className="text-red-400 hover:text-red-200 ml-0.5 font-bold"
                            title={isAr ? 'حذف هذه النقطة' : 'Delete point'}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* On-Canvas Direct Conveyor Operations Toolbar */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-white/10 text-xs">
                  {/* Reverse Direction */}
                  <button
                    onClick={() => handleReverseConnection(selectedConveyor.id)}
                    className="py-1.5 px-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold text-[10px] flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
                    title={isAr ? 'عكس اتجاه حركة وتدفق السير' : 'Reverse Conveyor Flow Direction'}
                  >
                    <span>🔄</span>
                    <span>{isAr ? 'عكس' : 'Reverse'}</span>
                  </button>

                  {/* Cycle Conveyor Type */}
                  <button
                    onClick={() => handleCycleConveyorType(selectedConveyor.id)}
                    className="py-1.5 px-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 font-bold text-[10px] flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm truncate"
                    title={isAr ? 'تغيير نوع السير (رولمان / سير مطاطي / مزلقان / أنبوب هوائي)' : 'Cycle Conveyor Type'}
                  >
                    <span>⚙️</span>
                    <span className="truncate">{selectedConveyor.type}</span>
                  </button>

                  {/* Delete Conveyor */}
                  <button
                    onClick={() => handleDeleteConnection(selectedConveyor.id)}
                    className="py-1.5 px-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 font-bold text-[10px] flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
                    title={isAr ? 'حذف هذا السير الناقل' : 'Delete this Conveyor'}
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                    <span>{isAr ? 'حذف' : 'Delete'}</span>
                  </button>
                </div>

                {/* Stations Jump & Routing */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs">
                  <button
                    onClick={() => {
                      setSelectedStationId(selectedConveyor.fromId);
                    }}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-bold truncate transition-colors text-center"
                  >
                    ◀ {equipmentMap[selectedConveyor.fromId]?.code || 'المصدر'}
                  </button>

                  <button
                    onClick={() => toggleConveyorEStop(selectedConveyor.id)}
                    className={`py-1.5 px-3 rounded-xl text-[11px] font-black transition-all ${
                      eStopConveyors[selectedConveyor.id]
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30'
                    }`}
                  >
                    {eStopConveyors[selectedConveyor.id] ? (isAr ? 'تشغيل' : 'Start') : (isAr ? 'إيقاف E-Stop' : 'E-Stop')}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedStationId(selectedConveyor.toId);
                    }}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-bold truncate transition-colors text-center"
                  >
                    {equipmentMap[selectedConveyor.toId]?.code || 'الوجهة'} ▶
                  </button>
                </div>
              </div>
            )}

            {/* FLOATING GUIDANCE BANNER WHEN IN EDIT MODE */}
            {isCustomizing && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-amber-500 text-slate-950 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-white backdrop-blur-md animate-in fade-in slide-in-from-top-2">
                <div className="w-7 h-7 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center font-black shrink-0">
                  <Move className="w-4 h-4 animate-bounce" />
                </div>
                <div className="text-xs">
                  <span className="font-black block">{isAr ? 'وضع التعديل والتحريك نشط (Edit & Move Mode)' : 'Edit & Move Mode Active'}</span>
                  <span className="text-[10px] opacity-90">{isAr ? 'اسحب الماكينات بالماوس بحرية، أو انقر على أي ماكينة لتحريكها بأزرار الأسهم في اللوحة الجانبية' : 'Drag stations with mouse or click any station to nudge with arrows in drawer'}</span>
                </div>
                <button
                  onClick={() => {
                    setIsCustomizing(false);
                    toast.success(isAr ? '✓ تم حفظ المخطط وتثبيت المواقع' : '✓ Layout locked and saved');
                  }}
                  className="px-3 py-1 rounded-xl bg-slate-950 text-amber-300 hover:text-white font-black text-xs transition-colors shrink-0"
                >
                  {isAr ? '✓ تم الحفظ' : '✓ Done'}
                </button>
              </div>
            )}

            {/* FLOATING QUICK CONTROLS DOCK (BOTTOM-LEFT) */}
            <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2 bg-[#090f1d]/95 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl">
              {/* 2D / 3D Fast Switcher */}
              <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => changeCameraPreset('top-down')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                    cameraPreset === 'top-down'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black scale-105'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={isAr ? 'مسقط أفقي 2D هندسي مسطح (سهل للتعديل والتحريك بدقة)' : '2D Flat Plan (Easiest for Editing)'}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>2D {isAr ? 'مسطح' : 'Plan'}</span>
                </button>
                <button
                  onClick={() => changeCameraPreset('iso-nw')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                    cameraPreset !== 'top-down'
                      ? 'bg-cyan-500 text-slate-950 shadow-md font-black scale-105'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={isAr ? 'مسقط ثلاثي الأبعاد 3D آيزومترك سينمائي' : '3D Isometric View'}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>3D {isAr ? 'مجسم' : 'Iso'}</span>
                </button>
              </div>

              {/* Zoom & Pan Reset Controls */}
              <div className="flex items-center gap-0.5 bg-black/50 p-1 rounded-xl border border-white/5 text-xs">
                <button
                  onClick={() => setZoomLevel(prev => Math.min(1.8, prev + 0.15))}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                  title={isAr ? 'تكبير (+)' : 'Zoom In'}
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.15))}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                  title={isAr ? 'تصغير (-)' : 'Zoom Out'}
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setZoomLevel(1);
                    setPanOffset({ x: 0, y: 0 });
                    toast.info(isAr ? '🎯 تم توسيط وضبط الشاشة 100%' : '🎯 Centered view 100%');
                  }}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                  title={isAr ? 'توسيط وإعادة ضبط (100%)' : 'Reset Zoom & Center'}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Interactive Floor Pan Tool Toggle */}
              <button
                onClick={() => {
                  setIsPanToolActive(prev => {
                    const next = !prev;
                    if (next) {
                      toast.info(isAr ? '✋ أداة سحب الصالة نشطة: انقر واسحب بالماوس للتحرك في أي اتجاه!' : '✋ Pan Tool Active: Click & drag mouse to pan around!');
                    }
                    return next;
                  });
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                  isPanToolActive
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                }`}
                title={isAr ? 'تفعيل أداة سحب وتحريك الصالة بحرية' : 'Pan Canvas Tool'}
              >
                <Hand className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAr ? 'سحب الصالة' : 'Pan Floor'}</span>
              </button>

              {/* Interactive Draw Conveyor Path Tool */}
              <button
                onClick={handleStartDrawingMode}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                  isDrawingPath
                    ? 'bg-yellow-400 text-slate-950 font-black shadow-yellow-500/40 ring-2 ring-yellow-300 scale-105'
                    : 'bg-slate-900 hover:bg-yellow-950 text-yellow-300 hover:text-yellow-200 border border-yellow-500/30'
                }`}
                title={isAr ? 'أداة رسم المسارات بالماوس وتحديد نقاط الانعطاف' : 'Interactive Path Drawing Pen'}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAr ? 'رسم مسار' : 'Draw Path'}</span>
              </button>

              {/* Auto Layout Quick Alignment */}
              <button
                onClick={handleAutoAlignLayout}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-cyan-950 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                title={isAr ? 'ترتيب ومحاذاة الماكينات تلقائياً بدون أي تداخل' : 'Auto-align all stations to clean grid'}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">{isAr ? 'محاذاة هندسية' : 'Auto Align'}</span>
              </button>

              {/* Auto Connect Conveyors */}
              <button
                onClick={handleAutoConnectStations}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-purple-950 text-purple-300 hover:text-purple-200 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                title={isAr ? 'إعادة ربط جميع السيور الناقلة تسلسلياً بذكاء' : 'Smart Sequential Auto-Wiring'}
              >
                <Cable className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">{isAr ? 'ربط السيور' : 'Auto Wire'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 4. SLIDE-OVER SCADA COCKPIT DRAWER (INSPECTION, ACTIONS & SETTINGS)  */}
        {/* ==================================================================== */}
        {isDrawerOpen ? (
          <aside className="w-80 md:w-96 flex-none bg-[#090f1d] border-r md:border-r-0 md:border-l border-white/10 flex flex-col z-20 shadow-2xl overflow-y-auto">
            {selectedEquipment ? (
              <>
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
                      onClick={() => setSelectedStationId(null)}
                      className="p-1.5 rounded-lg text-amber-400 hover:text-white hover:bg-amber-500/20 transition-colors"
                      title={isAr ? 'الانتقال إلى إعدادات وتخصيص المصنع العامة' : 'Switch to Global Plant Settings'}
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingStation(selectedEquipment)}
                      className="p-1.5 rounded-lg text-amber-400 hover:text-white hover:bg-amber-500/20 transition-colors"
                      title={isAr ? 'تعديل بيانات هذه المحطة' : 'Edit station'}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsDrawerOpen(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title={isAr ? 'إغلاق القائمة الجانبية' : 'Close Drawer'}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Direct Platform Quick Actions Bar */}
                <div className="px-3 py-2 bg-gradient-to-r from-slate-900 to-[#0b1329] border-b border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-amber-400">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>{isAr ? 'ربط المنصة المباشر (1-Click Action)' : 'Direct Platform Actions'}</span>
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">{selectedEquipment.code}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <button
                      onClick={() => navigate(`/quality-shopfloor?station=${encodeURIComponent(selectedEquipment.code)}`)}
                      className="p-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold flex items-center gap-1.5 transition-all text-start"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span className="truncate">{isAr ? 'تسجيل عيب للماكينة' : 'Log Defect'}</span>
                    </button>

                    <button
                      onClick={() => navigate(`/quality/records/ncr?create=1&station=${encodeURIComponent(selectedEquipment.code)}&title=${encodeURIComponent(selectedEquipment.titleAr)}`)}
                      className="p-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 font-bold flex items-center gap-1.5 transition-all text-start"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-red-400" />
                      <span className="truncate">{isAr ? 'فتح تقرير NCR' : 'Open NCR'}</span>
                    </button>

                    <button
                      onClick={() => navigate(`/quality/records/capa?station=${encodeURIComponent(selectedEquipment.code)}`)}
                      className="p-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 font-bold flex items-center gap-1.5 transition-all text-start"
                    >
                      <CheckSquare className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                      <span className="truncate">{isAr ? 'إجراء تصحيحي CAPA' : 'Open CAPA'}</span>
                    </button>

                    <button
                      onClick={() => navigate(`/spc?line=${encodeURIComponent(selectedEquipment.line)}`)}
                      className="p-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold flex items-center gap-1.5 transition-all text-start"
                    >
                      <BarChart3 className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                      <span className="truncate">{isAr ? 'كارت ضبط SPC' : 'SPC Chart'}</span>
                    </button>
                  </div>
                </div>

                {/* Drawer Navigation Tabs Bar */}
                <div className="flex items-center gap-1 p-2 bg-[#080d1a] border-b border-white/10 text-xs shrink-0 overflow-x-auto">
                  <button
                    onClick={() => setDrawerTab('overview')}
                    className={`flex-1 py-1.5 px-1.5 rounded-xl font-bold flex items-center justify-center gap-1 transition-all text-[11px] shrink-0 ${
                      drawerTab === 'overview'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>{isAr ? 'المحطة' : 'Station'}</span>
                  </button>
                  <button
                    onClick={() => setDrawerTab('department')}
                    className={`flex-1 py-1.5 px-1.5 rounded-xl font-bold flex items-center justify-center gap-1 transition-all text-[11px] shrink-0 ${
                      drawerTab === 'department'
                        ? 'bg-blue-600 text-white shadow-md font-black'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'الإدارة' : 'Dept'}</span>
                  </button>
                  <button
                    onClick={() => setDrawerTab('defects-ncr')}
                    className={`flex-1 py-1.5 px-1.5 rounded-xl font-bold flex items-center justify-center gap-1 transition-all text-[11px] shrink-0 relative ${
                      drawerTab === 'defects-ncr'
                        ? 'bg-red-500 text-white shadow-md font-black'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{isAr ? 'العيوب & NCR' : 'Defects/NCR'}</span>
                    {selectedStatus && (selectedStatus.defectCount > 0 || selectedStatus.openNcrCount > 0) && (
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-ping absolute top-1 right-1" />
                    )}
                  </button>
                  <button
                    onClick={() => setDrawerTab('capa-8d')}
                    className={`flex-1 py-1.5 px-1.5 rounded-xl font-bold flex items-center justify-center gap-1 transition-all text-[11px] shrink-0 ${
                      drawerTab === 'capa-8d'
                        ? 'bg-purple-600 text-white shadow-md font-black'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{isAr ? '8D & CAPA' : '8D/CAPA'}</span>
                  </button>
                  <button
                    onClick={() => setDrawerTab('closed-loop')}
                    className={`flex-1 py-1.5 px-1.5 rounded-xl font-bold flex items-center justify-center gap-1 transition-all text-[11px] shrink-0 ${
                      drawerTab === 'closed-loop'
                        ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Workflow className="w-3.5 h-3.5" />
                    <span>{isAr ? 'المسار' : 'Trace'}</span>
                  </button>
                </div>

                {/* Drawer Body */}
                <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                  {/* TAB 1: OVERVIEW & SCADA TELEMETRY */}
                  {drawerTab === 'overview' && (
                    <div className="space-y-3.5">
                      {/* LIVE CYCLE TIME & TARGET OEE SLIDERS (Instant Real-time Sync) */}
                      <div className="p-3.5 rounded-2xl bg-[#090f1e] border border-cyan-500/40 space-y-3 shadow-xl">
                        <div className="flex items-center justify-between text-xs font-black text-cyan-300">
                          <div className="flex items-center gap-1.5">
                            <Gauge className="w-4 h-4 text-cyan-400" />
                            <span>{isAr ? 'زمن الدورة (CT) وكفاءة OEE الحية' : 'Live Cycle Time & Target OEE'}</span>
                          </div>
                          <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/30 animate-pulse">
                            3D Live Sync
                          </span>
                        </div>

                        {/* Cycle Time Slider */}
                        <div className="space-y-1.5 bg-black/40 p-2.5 rounded-xl border border-white/5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-bold text-[11px]">
                              {isAr ? 'زمن الدورة التشغيلي (Cycle Time):' : 'Workstation Cycle Time:'}
                            </span>
                            <span className="font-mono font-black text-cyan-300 text-sm">
                              {selectedEquipment.cycleTimeSec ?? 24} {isAr ? 'ثانية' : 'sec'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <input
                              type="range"
                              min={5}
                              max={180}
                              step={1}
                              value={selectedEquipment.cycleTimeSec ?? 24}
                              onChange={(e) => updateStationField(selectedEquipment.id, 'cycleTimeSec', Number(e.target.value))}
                              className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                            />
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={5}
                                max={300}
                                value={selectedEquipment.cycleTimeSec ?? 24}
                                onChange={(e) => updateStationField(selectedEquipment.id, 'cycleTimeSec', Math.max(1, Number(e.target.value)))}
                                className="w-14 bg-slate-900 border border-cyan-500/40 rounded-lg px-1.5 py-1 text-center font-mono font-bold text-xs text-cyan-300 focus:outline-none"
                              />
                              <span className="text-[10px] text-slate-400 font-mono">s</span>
                            </div>
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                            <span>5s ({isAr ? 'سريع' : 'Fast'})</span>
                            <span>45s ({isAr ? 'متوسط' : 'Standard'})</span>
                            <span>180s ({isAr ? 'دقيق' : 'Detailed'})</span>
                          </div>
                        </div>

                        {/* Target OEE Slider */}
                        <div className="space-y-1.5 bg-black/40 p-2.5 rounded-xl border border-white/5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-bold text-[11px]">
                              {isAr ? 'كفاءة الماكينة المستهدفة (Target OEE):' : 'Target OEE Rate:'}
                            </span>
                            <span className="font-mono font-black text-emerald-400 text-sm">
                              {selectedEquipment.oeeEstimate || 95}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <input
                              type="range"
                              min={50}
                              max={100}
                              step={1}
                              value={selectedEquipment.oeeEstimate || 95}
                              onChange={(e) => updateStationField(selectedEquipment.id, 'oeeEstimate', Number(e.target.value))}
                              className="flex-1 accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                            />
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={10}
                                max={100}
                                value={selectedEquipment.oeeEstimate || 95}
                                onChange={(e) => updateStationField(selectedEquipment.id, 'oeeEstimate', Math.min(100, Math.max(1, Number(e.target.value))))}
                                className="w-14 bg-slate-900 border border-emerald-500/40 rounded-lg px-1.5 py-1 text-center font-mono font-bold text-xs text-emerald-300 focus:outline-none"
                              />
                              <span className="text-[10px] text-slate-400 font-mono">%</span>
                            </div>
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                            <span>50%</span>
                            <span>85% ({isAr ? 'معيار عالمي' : 'World Class'})</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </div>

                      {/* 1. FAST NUDGE & POSITION CONTROL PAD (D-PAD) */}
                      <div className="p-3.5 rounded-2xl bg-[#090f1e] border border-amber-500/40 space-y-3 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-black text-amber-400">
                        <Move className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isAr ? 'التحريك والمحاذاة المباشرة (D-Pad)' : 'Position & Nudge Controls'}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-white/5 text-[9px] font-mono">
                        <span className="text-slate-400 px-1">{isAr ? 'الخطوة:' : 'Step:'}</span>
                        {[10, 25, 50].map(s => (
                          <button
                            key={s}
                            onClick={() => setNudgeStep(s)}
                            className={`px-1.5 py-0.5 rounded ${nudgeStep === s ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
                          >
                            {s}px
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* D-Pad Buttons + Coordinates Display */}
                    <div className="flex items-center justify-between gap-3 bg-black/50 p-2.5 rounded-xl border border-white/5">
                      {/* Coordinates */}
                      <div className="space-y-1 text-xs font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-[10px]">X:</span>
                          <span className="font-bold text-cyan-300">{selectedEquipment.x}px</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-[10px]">Y:</span>
                          <span className="font-bold text-cyan-300">{selectedEquipment.y}px</span>
                        </div>
                        <div className="text-[9px] text-amber-400/90 font-sans font-bold">
                          {selectedEquipment.zoneNameAr}
                        </div>
                      </div>

                      {/* 4-Way Arrow Nudge Pad */}
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <button
                          onClick={() => nudgeStation(selectedEquipment.id, 0, -nudgeStep)}
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white flex items-center justify-center font-bold text-sm shadow transition-all active:scale-90"
                          title={isAr ? `تحريك لأعلى (${nudgeStep}px)` : `Nudge Up (${nudgeStep}px)`}
                        >
                          ▲
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => nudgeStation(selectedEquipment.id, -nudgeStep, 0)}
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white flex items-center justify-center font-bold text-sm shadow transition-all active:scale-90"
                            title={isAr ? `تحريك لليسار (${nudgeStep}px)` : `Nudge Left (${nudgeStep}px)`}
                          >
                            ◀
                          </button>
                          <div className="w-8 h-8 rounded-lg bg-slate-950 text-amber-400 flex items-center justify-center font-mono text-[10px] font-black border border-white/10">
                            🎯
                          </div>
                          <button
                            onClick={() => nudgeStation(selectedEquipment.id, nudgeStep, 0)}
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white flex items-center justify-center font-bold text-sm shadow transition-all active:scale-90"
                            title={isAr ? `تحريك لليمين (${nudgeStep}px)` : `Nudge Right (${nudgeStep}px)`}
                          >
                            ▶
                          </button>
                        </div>
                        <button
                          onClick={() => nudgeStation(selectedEquipment.id, 0, nudgeStep)}
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white flex items-center justify-center font-bold text-sm shadow transition-all active:scale-90"
                          title={isAr ? `تحريك لأسفل (${nudgeStep}px)` : `Nudge Down (${nudgeStep}px)`}
                        >
                          ▼
                        </button>
                      </div>
                    </div>

                    {/* Keyboard shortcut indicator */}
                    <div className="pt-1 text-[10px] text-slate-400 flex items-center justify-between border-t border-white/5">
                      <span className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[9px] border border-white/10">▲ ▼ ◀ ▶</span>
                        <span>{isAr ? 'أسهم الكيبورد للتحريك المباشر' : 'Arrow keys to nudge'}</span>
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">Shift = 2x</span>
                    </div>

                    {/* Quick Move to Bay Buttons */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block">
                        {isAr ? 'نقل فوري إلى عنبر:' : 'Instant Transfer to Bay:'}
                      </span>
                      <div className="grid grid-cols-5 gap-1 text-[10px]">
                        {[
                          { zone: 'receiving', label: 'Bay A', title: isAr ? 'الاستلام' : 'Recv' },
                          { zone: 'assembly', label: 'Bay B', title: isAr ? 'التجميع' : 'Asm' },
                          { zone: 'lab', label: 'Hub C', title: isAr ? 'الجودة' : 'Lab' },
                          { zone: 'oqc', label: 'Bay D', title: isAr ? 'الفحص' : 'OQC' },
                          { zone: 'shipping', label: 'Bay E', title: isAr ? 'الشحن' : 'Ship' },
                        ].map(b => (
                          <button
                            key={b.zone}
                            onClick={() => moveStationToBayPreset(selectedEquipment.id, b.zone as StationZone)}
                            className={`py-1 px-1 rounded-lg font-bold border transition-all text-center ${
                              selectedEquipment.zone === b.zone
                                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                                : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                            }`}
                            title={b.title}
                          >
                            <span className="block text-[9px]">{b.label}</span>
                            <span className="block text-[8px] truncate opacity-80">{b.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2. INLINE DIRECT EDITING CARD (No modal needed!) */}
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 space-y-2.5 shadow-md">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span className="flex items-center gap-1.5 text-cyan-400">
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isAr ? 'تعديل بيانات المحطة مباشرة' : 'Direct Quick Station Edit'}</span>
                      </span>
                      <button
                        onClick={() => setEditingStation(selectedEquipment)}
                        className="text-[10px] text-amber-400 hover:text-amber-300 underline font-mono"
                      >
                        {isAr ? 'النموذج الكامل ↗' : 'Full Form ↗'}
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">{isAr ? 'اسم المحطة (بالعربية):' : 'Station Title (Ar):'}</label>
                        <input
                          type="text"
                          value={selectedEquipment.titleAr}
                          onChange={(e) => updateStationField(selectedEquipment.id, 'titleAr', e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-2.5 py-1.5 text-white font-medium focus:outline-none focus:ring-1 focus:ring-cyan-400 text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">{isAr ? 'اسم المحطة (بالإنجليزية):' : 'Station Title (En):'}</label>
                        <input
                          type="text"
                          value={selectedEquipment.titleEn}
                          onChange={(e) => updateStationField(selectedEquipment.id, 'titleEn', e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-2.5 py-1.5 text-white font-medium focus:outline-none focus:ring-1 focus:ring-cyan-400 text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">{isAr ? 'خط الإنتاج:' : 'Line:'}</label>
                          <input
                            type="text"
                            value={selectedEquipment.line}
                            onChange={(e) => updateStationField(selectedEquipment.id, 'line', e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-2.5 py-1.5 text-white font-medium focus:outline-none focus:ring-1 focus:ring-cyan-400 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">{isAr ? 'المشغل الحالي:' : 'Operator:'}</label>
                          <input
                            type="text"
                            value={selectedEquipment.activeOperator || ''}
                            onChange={(e) => updateStationField(selectedEquipment.id, 'activeOperator', e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-2.5 py-1.5 text-white font-medium focus:outline-none focus:ring-1 focus:ring-cyan-400 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. QUICK CONVEYOR LINKER & CONNECTED CONVEYORS MANAGER */}
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-purple-500/30 space-y-2.5 shadow-md">
                    <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                      <span className="flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>{isAr ? 'إدارة وتوصيل السيور والمسارات' : 'Conveyor Quick Link & Manage'}</span>
                      </span>
                    </div>

                    {/* Link to New Station */}
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold block">
                        {isAr ? 'ربط سير ناقل جديد من هذه المحطة إلى:' : 'Connect new conveyor from here to:'}
                      </span>
                      <div className="flex flex-col gap-1.5">
                        <select
                          value={quickConnectTargetId}
                          onChange={(e) => setQuickConnectTargetId(e.target.value)}
                          className="w-full bg-[#0b1329] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                        >
                          <option value="">{isAr ? '-- اختر محطة الوصول --' : '-- Select target station --'}</option>
                          {equipmentList.filter(e => e.id !== selectedEquipment.id).map(e => (
                            <option key={e.id} value={e.id}>
                              [{e.code}] {isAr ? e.titleAr : e.titleEn} ({e.zoneNameAr})
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1.5">
                          <select
                            value={quickConnectType}
                            onChange={(e) => setQuickConnectType(e.target.value as any)}
                            className="flex-1 bg-[#0b1329] border border-white/10 rounded-xl px-2 py-1 text-xs text-slate-300 focus:outline-none"
                          >
                            <option value="motor-roller">{isAr ? 'سير بكرات كهربائي' : 'Motor Roller'}</option>
                            <option value="belt">{isAr ? 'سير ناقل مستمر' : 'Continuous Belt'}</option>
                            <option value="gravity-roller">{isAr ? 'بكرات انحدار' : 'Gravity Roller'}</option>
                            <option value="chute">{isAr ? 'مجرى انزلاق سريع' : 'Chute'}</option>
                            <option value="pneumatic">{isAr ? 'أنبوب هوائي' : 'Pneumatic Tube'}</option>
                            <option value="bridge">{isAr ? 'جسر علوي' : 'Overhead Bridge'}</option>
                          </select>

                          <button
                            onClick={() => {
                              if (quickConnectTargetId) {
                                handleQuickConnect(selectedEquipment.id, quickConnectTargetId, quickConnectType);
                                setQuickConnectTargetId('');
                              } else {
                                toast.warning(isAr ? 'يرجى اختيار محطة وصول أولاً' : 'Select target station first');
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shrink-0 shadow-md transition-all active:scale-95"
                          >
                            + {isAr ? 'ربط السير' : 'Connect'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Current Connected Conveyors for this station */}
                    {(() => {
                      const connected = connectionsList.filter(c => c.fromId === selectedEquipment.id || c.toId === selectedEquipment.id);
                      if (connected.length === 0) {
                        return (
                          <div className="p-2 rounded-xl bg-black/20 text-center text-[10px] text-slate-500">
                            {isAr ? 'لا توجد سيور متصلة بهذه المحطة حالياً' : 'No conveyors linked to this station'}
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {connected.map(c => {
                            const isOutfeed = c.fromId === selectedEquipment.id;
                            const otherId = isOutfeed ? c.toId : c.fromId;
                            const otherSt = equipmentMap[otherId];

                            return (
                              <div key={c.id} className="p-2 rounded-xl bg-black/50 border border-white/5 flex items-center justify-between text-xs">
                                <div>
                                  <span className="text-[10px] font-bold text-white block">
                                    {isOutfeed 
                                      ? `▶ ${isAr ? 'إلى:' : 'To:'} ${otherSt?.code || otherId}` 
                                      : `◀ ${isAr ? 'من:' : 'From:'} ${otherSt?.code || otherId}`}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-mono">
                                    {c.type} • {c.velocityMs || 0.5}m/s
                                  </span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleReverseConnection(c.id)}
                                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300"
                                    title={isAr ? 'عكس اتجاه السير' : 'Reverse direction'}
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteConnection(c.id)}
                                    className="p-1 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-400"
                                    title={isAr ? 'حذف السير' : 'Delete conveyor'}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

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
                        onClick={() => navigate(`/quality-shopfloor?station=${encodeURIComponent(selectedEquipment.code)}`)}
                        className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-xs flex items-center justify-between transition-colors"
                      >
                        <span>{isAr ? '📝 تسجيل عيب سريع على هذه المحطة' : 'Fast Shopfloor Entry'}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      <button
                        onClick={() => navigate(`/quality/records/ncr?create=1&title=${encodeURIComponent(selectedEquipment.titleAr)}`)}
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
              )}

              {/* TAB 2: DEFECTS & NCR RECORDS */}
              {drawerTab === 'defects-ncr' && (
                <div className="space-y-4">
                  {/* Quick Action Button */}
                  <button
                    onClick={() => navigate(`/quality-shopfloor?station=${encodeURIComponent(selectedEquipment.code)}`)}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAr ? 'تسجيل عيب صالة إنتاج جديد هنا' : 'Log New Defect On This Station'}</span>
                  </button>

                  {/* Real NCRs Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{isAr ? `تقارير عدم المطابقة (${selectedStatus?.matchedNcrs?.length || 0})` : `NCR Reports (${selectedStatus?.matchedNcrs?.length || 0})`}</span>
                      </span>
                    </div>

                    {selectedStatus && selectedStatus.matchedNcrs?.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedStatus.matchedNcrs.map((n, i) => (
                          <div 
                            key={i} 
                            onClick={() => navigate('/quality/records/ncr')}
                            className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 hover:border-red-400 text-xs space-y-1.5 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-red-400">{n.ncrNumber || n.id}</span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/20 text-red-300">
                                {n.status || 'Open'}
                              </span>
                            </div>
                            <p className="text-white font-medium text-xs line-clamp-1">{n.title || n.description}</p>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                              <span>{n.createdDate || n.date || 'حديث'}</span>
                              <span className="text-amber-300 font-bold">{n.severity || 'Major'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                        {isAr ? 'لا توجد تقارير عدم مطابقة (NCR) مسجلة على هذه المحطة' : 'Zero NCR records on this workstation'}
                      </div>
                    )}
                  </div>

                  {/* Real Defects Section */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{isAr ? `العيوب الميدانية المسجلة (${selectedStatus?.matchedDefects?.length || 0})` : `Shopfloor Defects (${selectedStatus?.matchedDefects?.length || 0})`}</span>
                    </span>

                    {selectedStatus && selectedStatus.matchedDefects?.length > 0 ? (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {selectedStatus.matchedDefects.map((d, i) => (
                          <div key={i} className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex justify-between items-center">
                            <div>
                              <span className="font-bold text-amber-300 block">{d.defectType || d.type || 'عيب تشغيلي'}</span>
                              <span className="text-[10px] text-slate-400">{d.date || d.createdAt || 'اليوم'} - {d.partNameAtTime || d.partNumber || 'قطعة عامة'}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black">
                              الكمية: {d.quantity || 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                        {isAr ? 'لا توجد عيوب تشغيلية مسجلة على هذه المحطة' : 'Zero shopfloor defects recorded'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: CAPA & 8D PROBLEM SOLVING */}
              {drawerTab === 'capa-8d' && (
                <div className="space-y-4">
                  {/* 8D Problem Solving Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{isAr ? `تحقيقات 8D الجذرية (${selectedStatus?.matchedEightDs?.length || 0})` : `8D Investigations (${selectedStatus?.matchedEightDs?.length || 0})`}</span>
                      </span>
                      <button
                        onClick={() => navigate('/quality/records/eight-d')}
                        className="text-[10px] text-purple-400 hover:text-purple-300 font-bold"
                      >
                        {isAr ? 'فتح الكل ←' : 'Open All →'}
                      </button>
                    </div>

                    {selectedStatus && selectedStatus.matchedEightDs?.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedStatus.matchedEightDs.map((d8, i) => (
                          <div 
                            key={i}
                            onClick={() => navigate('/quality/records/eight-d')}
                            className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 hover:border-purple-400 text-xs space-y-1.5 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-purple-300">{d8.eightDNumber || d8.id}</span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-500/20 text-purple-300">
                                {d8.status || 'D0'}
                              </span>
                            </div>
                            <p className="text-white font-medium text-xs line-clamp-1">{d8.problemTitle || d8.problemDescription}</p>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                              <span>قائد الفريق: {d8.teamLeader || 'فريق الجودة'}</span>
                              <span className="text-cyan-400 font-mono">{d8.dateDetected || '2026'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                        {isAr ? 'لا توجد تحقيقات 8D نشطة على هذه المحطة' : 'Zero 8D investigations on this station'}
                      </div>
                    )}
                  </div>

                  {/* CAPA Corrective Actions Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>{isAr ? `خطط الإجراءات التصحيحية CAPA (${selectedStatus?.matchedCapas?.length || 0})` : `CAPA Actions (${selectedStatus?.matchedCapas?.length || 0})`}</span>
                      </span>
                      <button
                        onClick={() => navigate('/quality/records/capa')}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold"
                      >
                        {isAr ? 'فتح الكل ←' : 'Open All →'}
                      </button>
                    </div>

                    {selectedStatus && selectedStatus.matchedCapas?.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedStatus.matchedCapas.map((capa, i) => (
                          <div 
                            key={i}
                            onClick={() => navigate('/quality/records/capa')}
                            className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 hover:border-cyan-400 text-xs space-y-1.5 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-cyan-300">{capa.capaNumber || capa.id}</span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/20 text-cyan-300">
                                {capa.status || 'Active'}
                              </span>
                            </div>
                            <p className="text-white font-medium text-xs line-clamp-1">{capa.title || capa.description}</p>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                              <span>المسؤول: {capa.assignedTo || 'مهندس الجودة'}</span>
                              <span className="text-amber-400 font-mono">الهدف: {capa.targetDate || '2026-04'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                        {isAr ? 'لا توجد خطط CAPA مسجلة على هذه المحطة' : 'Zero CAPA actions on this station'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: INTERACTIVE CLOSED-LOOP QUALITY JOURNEY */}
              {drawerTab === 'closed-loop' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 space-y-1">
                    <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs">
                      <Workflow className="w-4 h-4 text-cyan-400" />
                      <span>{isAr ? 'مسار الجودة الدائري المترابط (Closed-Loop)' : 'Closed-Loop Quality Traceability'}</span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      {isAr 
                        ? 'ربط تسلسلي كامل بين الخامات، الإنتاج، التفتيش، عدم المطابقة، التحقيق الجذري، والإجراءات التصحيحية'
                        : 'End-to-end linked trace from Raw Material ➔ Defect ➔ NCR ➔ 8D ➔ CAPA ➔ OQC'}
                    </p>
                  </div>

                  {/* 8-Stage Interactive Pipeline */}
                  <div className="space-y-2 relative">
                    {/* Connecting Vertical Track */}
                    <div className="absolute right-4.5 top-3 bottom-3 w-0.5 bg-gradient-to-b from-cyan-500 via-amber-500 to-emerald-500 opacity-30 pointer-events-none" />

                    {selectedStatus && selectedStatus.closedLoopChain?.map((step, idx) => {
                      const isAlertStep = step.status === 'alert';
                      const isWarningStep = step.status === 'warning';
                      const isPassStep = step.status === 'pass';

                      return (
                        <div 
                          key={idx}
                          onClick={() => navigate(step.route)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                            isAlertStep
                              ? 'bg-red-950/40 border-red-500/50 hover:bg-red-900/40'
                              : isWarningStep
                                ? 'bg-amber-950/30 border-amber-500/40 hover:bg-amber-900/30'
                                : isPassStep
                                  ? 'bg-emerald-950/30 border-emerald-500/40 hover:bg-emerald-900/30'
                                  : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {/* Step Index Badge */}
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 border ${
                              isAlertStep 
                                ? 'bg-red-500 text-white border-red-400' 
                                : isWarningStep 
                                  ? 'bg-amber-500 text-slate-950 border-amber-400' 
                                  : isPassStep
                                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {idx + 1}
                            </div>

                            <div>
                              <span className="font-bold text-white block text-[11px]">
                                {isAr ? step.titleAr : step.titleEn}
                              </span>
                              <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                                <span>{step.count} {isAr ? 'سجلات' : 'records'}</span>
                                {step.sampleId && (
                                  <span className="text-cyan-400 font-mono font-bold">({step.sampleId})</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 group-hover:text-cyan-300">
                            <span className="hidden sm:inline">{isAr ? 'فتح' : 'View'}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: ENTERPRISE DEPARTMENT INTEGRATED COCKPIT */}
              {drawerTab === 'department' && (
                <div className="space-y-4">
                  {/* Department Switcher Dropdown */}
                  <div className="flex items-center justify-between gap-1 p-2 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400 font-bold px-1 flex items-center gap-1.5 shrink-0">
                      <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isAr ? 'الإدارة المعنية:' : 'Department:'}</span>
                    </span>
                    <select
                      value={activeDepartment.id}
                      onChange={(e) => {
                        setSelectedDeptId(e.target.value);
                        const dept = ENTERPRISE_DEPT_MAP[e.target.value];
                        if (dept && dept.stationIds.length > 0) {
                          setSelectedStationId(dept.stationIds[0]);
                        }
                      }}
                      className="bg-[#0b1329] border border-white/10 rounded-lg text-xs font-bold text-cyan-300 py-1 px-2 focus:outline-none focus:ring-1 focus:ring-cyan-400 max-w-[200px] truncate"
                    >
                      {ENTERPRISE_DEPARTMENTS.map(d => (
                        <option key={d.id} value={d.id}>
                          [{d.number}] {isAr ? d.shortNameAr : d.shortNameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Department Hero Card */}
                  <div 
                    style={{ borderColor: `${activeDepartment.accentHex}40` }}
                    className={`p-4 rounded-2xl border bg-gradient-to-br ${activeDepartment.bgGradient} space-y-3 relative overflow-hidden shadow-xl`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span 
                          style={{ backgroundColor: activeDepartment.accentHex }}
                          className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-slate-950 text-sm shadow-lg shrink-0"
                        >
                          {activeDepartment.number}
                        </span>
                        <div>
                          <span className="text-[10px] font-mono font-bold text-amber-300 block">
                            {activeDepartment.code}
                          </span>
                          <h4 className="text-xs md:text-sm font-black text-white leading-tight">
                            {isAr ? activeDepartment.nameAr : activeDepartment.nameEn}
                          </h4>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white/10 text-slate-300 border border-white/15 shrink-0">
                        SLA: {activeDepartment.slaHours} {isAr ? 'ساعات' : 'hrs'}
                      </span>
                    </div>

                    {/* Physical Location */}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-300 bg-black/40 p-2 rounded-xl border border-white/5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">
                        {isAr ? activeDepartment.physicalLocationAr : activeDepartment.physicalLocationEn}
                      </span>
                    </div>

                    {/* Leadership & Manager Card */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs border border-cyan-500/40 shrink-0">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-white block text-xs">
                            {isAr ? activeDepartment.headOfDeptAr : activeDepartment.headOfDeptEn}
                          </span>
                          <span className="text-[9px] text-slate-400 block line-clamp-1">
                            {isAr ? activeDepartment.headTitleAr : activeDepartment.headTitleEn}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Primary KPI Card */}
                    <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-mono">
                          {isAr ? activeDepartment.primaryKpiAr : activeDepartment.primaryKpiEn}
                        </span>
                        <span className="text-sm font-black text-amber-400 font-mono">
                          {activeDepartment.targetKpiValue}
                        </span>
                      </div>
                      <div className="text-right rtl:text-left">
                        <span className="text-[9px] text-slate-400 block">
                          {isAr ? 'الحالة التشغيلية' : 'Operating Status'}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          ✓ 100% {isAr ? 'مطابق' : 'Compliant'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Input / Output Handshake Contract Matrix */}
                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-black uppercase text-cyan-300">
                      <span className="flex items-center gap-1.5">
                        <GitFork className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{isAr ? 'بروتوكول الربط والتسليم البيني (I/O)' : 'Department Handshake Matrix'}</span>
                      </span>
                    </div>

                    {/* Inbound Input */}
                    <div className="p-2.5 rounded-xl bg-[#090f1d] border border-cyan-500/20 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-black text-cyan-300 flex items-center gap-1">
                          <span>📥 {isAr ? 'المدخلات الواردة:' : 'Inbound Inputs:'}</span>
                        </span>
                        {activeDepartment.upstreamDeptId && ENTERPRISE_DEPT_MAP[activeDepartment.upstreamDeptId] && (
                          <button
                            onClick={() => {
                              setSelectedDeptId(activeDepartment.upstreamDeptId!);
                              const upDept = ENTERPRISE_DEPT_MAP[activeDepartment.upstreamDeptId!];
                              if (upDept?.stationIds.length > 0) setSelectedStationId(upDept.stationIds[0]);
                            }}
                            className="text-[9px] text-cyan-400 hover:text-cyan-200 underline font-mono flex items-center gap-0.5"
                          >
                            <span>← {isAr ? ENTERPRISE_DEPT_MAP[activeDepartment.upstreamDeptId].shortNameAr : ENTERPRISE_DEPT_MAP[activeDepartment.upstreamDeptId].shortNameEn}</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-300 leading-relaxed">
                        {isAr ? activeDepartment.inputDescriptionAr : activeDepartment.inputDescriptionEn}
                      </p>
                    </div>

                    {/* Outbound Output */}
                    <div className="p-2.5 rounded-xl bg-[#090f1d] border border-emerald-500/20 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-black text-emerald-300 flex items-center gap-1">
                          <span>📤 {isAr ? 'المخرجات المسلمة:' : 'Outbound Deliverables:'}</span>
                        </span>
                        {activeDepartment.downstreamDeptId && ENTERPRISE_DEPT_MAP[activeDepartment.downstreamDeptId] && (
                          <button
                            onClick={() => {
                              setSelectedDeptId(activeDepartment.downstreamDeptId!);
                              const downDept = ENTERPRISE_DEPT_MAP[activeDepartment.downstreamDeptId!];
                              if (downDept?.stationIds.length > 0) setSelectedStationId(downDept.stationIds[0]);
                            }}
                            className="text-[9px] text-emerald-400 hover:text-emerald-200 underline font-mono flex items-center gap-0.5"
                          >
                            <span>{isAr ? ENTERPRISE_DEPT_MAP[activeDepartment.downstreamDeptId].shortNameAr : ENTERPRISE_DEPT_MAP[activeDepartment.downstreamDeptId].shortNameEn} →</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-300 leading-relaxed">
                        {isAr ? activeDepartment.outputDescriptionAr : activeDepartment.outputDescriptionEn}
                      </p>
                    </div>
                  </div>

                  {/* Connected Physical Equipment & Stations */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <Factory className="w-3.5 h-3.5" />
                        <span>{isAr ? `المحطات والماكينات التابعة (${activeDepartment.stationIds.length})` : `Assigned Equipment (${activeDepartment.stationIds.length})`}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5">
                      {activeDepartment.stationIds.map(stId => {
                        const eq = equipmentMap[stId];
                        const stStatus = stationStatuses[stId];
                        const isThisSelected = selectedStationId === stId;

                        return (
                          <div
                            key={stId}
                            onClick={() => {
                              setSelectedStationId(stId);
                              if (soundEnabled) playIndustrialChime('camera');
                            }}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                              isThisSelected
                                ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                                : 'bg-slate-900/70 border-white/5 hover:border-white/20 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="p-1 rounded-lg bg-black/40 text-amber-400 font-mono text-[10px] font-black border border-white/5">
                                {eq?.code || stId}
                              </span>
                              <div>
                                <span className="font-bold text-white block text-xs">
                                  {eq ? (isAr ? eq.titleAr : eq.titleEn) : stId}
                                </span>
                                <span className="text-[9px] text-slate-400">
                                  OEE: {eq?.oeeEstimate || 92}% | FPY: {eq?.fpyEstimate || 98}%
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span 
                                className="px-2 py-0.5 rounded-full text-[9px] font-bold border"
                                style={{
                                  color: stStatus?.statusColor || '#10b981',
                                  borderColor: `${stStatus?.statusColor || '#10b981'}40`,
                                  backgroundColor: `${stStatus?.statusColor || '#10b981'}15`
                                }}
                              >
                                {isAr ? stStatus?.statusLabelAr || 'طبيعي' : stStatus?.statusLabelEn || 'Normal'}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Direct Platform Module Launchers */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        <span>{isAr ? 'وحدات المنصة المترابطة مع هذه الإدارة' : 'Direct QMS Module Launchers'}</span>
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {activeDepartment.linkedModules.map(mod => {
                        const badgeCount = getModuleBadgeCount(mod.badgeCountKey);

                        return (
                          <div
                            key={mod.id}
                            onClick={() => navigate(mod.path)}
                            className="p-2.5 rounded-xl bg-slate-900 hover:bg-cyan-950/40 border border-white/10 hover:border-cyan-500/40 transition-all cursor-pointer flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 rounded-lg bg-black/40 text-cyan-400 group-hover:text-cyan-300 border border-white/5">
                                {renderModuleIcon(mod.icon, "w-4 h-4")}
                              </div>
                              <div>
                                <span className="font-bold text-white group-hover:text-cyan-300 text-xs block transition-colors">
                                  {isAr ? mod.labelAr : mod.labelEn}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono">
                                  {mod.path}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {badgeCount !== null && badgeCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  {badgeCount}
                                </span>
                              )}
                              <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
              /* GLOBAL PLANT SETTINGS & WORKSTATION CUSTOMIZER MODE */
              <div className="flex flex-col h-full">
                {/* Global Settings Drawer Header */}
                <div className="p-4 bg-[#0d162b] border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Settings2 className="w-5 h-5 text-amber-400" />
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-white leading-tight">
                        {isAr ? 'إعدادات وتعديل المصنع والربط' : 'Plant Settings & Platform Hub'}
                      </h3>
                      <span className="text-[10px] font-mono font-bold text-amber-400">
                        {equipmentList.length} {isAr ? 'محطات نشطة' : 'active workstations'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    title={isAr ? 'إغلاق اللوحة الجانبية' : 'Close drawer'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                  {/* 1. Quick Add New Station Button */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                        <Plus className="w-4 h-4 text-emerald-400" />
                        <span>{isAr ? 'إضافة محطة أو ماكينة جديدة' : 'Add Workstation'}</span>
                      </span>
                      <button
                        onClick={handleResetToDefaults}
                        className="text-[10px] text-slate-400 hover:text-amber-300 font-mono flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{isAr ? 'استعادة الافتراضي' : 'Reset'}</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-300">
                      {isAr 
                        ? 'إضافة محطة تجميع، تشغيل CNC، محطة ربط عزم، أو محطة فحص جودة' 
                        : 'Add assembly, CNC machining, torque station, or quality inspection point'}
                    </p>
                    <button
                      onClick={() => handleAddNewTemplate('assembly')}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isAr ? '+ إنشاء محطة جديدة للمصنع' : '+ Create New Workstation'}</span>
                    </button>
                  </div>

                  {/* 2. Platform 1-Click Ecosystem Hub (ربط المصنع بكامل أقسام المنصة) */}
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-cyan-500/30 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-black text-cyan-300">
                      <span className="flex items-center gap-1.5">
                        <Workflow className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{isAr ? 'ربط المصنع بكافة أقسام المنصة' : 'Platform Modules Ecosystem'}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <button
                        onClick={() => navigate('/quality-shopfloor')}
                        className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-white/5 hover:border-amber-500/40 text-start transition-all group"
                      >
                        <span className="text-amber-400 font-black block text-[11px] group-hover:text-amber-300">📝 {isAr ? 'مسجل عيوب الصالة' : 'Shopfloor Defects'}</span>
                        <span className="text-[9px] text-slate-400">{realDefects.length} {isAr ? 'عيوب مسجلة' : 'records'}</span>
                      </button>

                      <button
                        onClick={() => navigate('/quality/records/ncr')}
                        className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-white/5 hover:border-red-500/40 text-start transition-all group"
                      >
                        <span className="text-red-400 font-black block text-[11px] group-hover:text-red-300">🚨 {isAr ? 'عدم المطابقة NCR' : 'NCR System'}</span>
                        <span className="text-[9px] text-slate-400">{realNcrs.filter(n => n.status !== 'Closed').length} {isAr ? 'مفتوح' : 'open'}</span>
                      </button>

                      <button
                        onClick={() => navigate('/quality/records/capa')}
                        className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-white/5 hover:border-purple-500/40 text-start transition-all group"
                      >
                        <span className="text-purple-400 font-black block text-[11px] group-hover:text-purple-300">🛠️ {isAr ? 'إجراءات CAPA' : 'CAPA Actions'}</span>
                        <span className="text-[9px] text-slate-400">{realCapas.filter(c => c.status !== 'Closed').length} {isAr ? 'خطة جارية' : 'active'}</span>
                      </button>

                      <button
                        onClick={() => navigate('/spc')}
                        className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-white/5 hover:border-cyan-500/40 text-start transition-all group"
                      >
                        <span className="text-cyan-400 font-black block text-[11px] group-hover:text-cyan-300">📊 {isAr ? 'تحكم إحصائي SPC' : 'SPC Charts'}</span>
                        <span className="text-[9px] text-slate-400">Cp / Cpk / I-MR</span>
                      </button>

                      <button
                        onClick={() => navigate('/quality-inspection-plans')}
                        className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-white/5 hover:border-emerald-500/40 text-start transition-all group"
                      >
                        <span className="text-emerald-400 font-black block text-[11px] group-hover:text-emerald-300">🔬 {isAr ? 'خطط فحص الجودة' : 'Inspection Plans'}</span>
                        <span className="text-[9px] text-slate-400">{realControlPlans.length} {isAr ? 'خطة معتمدة' : 'plans'}</span>
                      </button>

                      <button
                        onClick={() => navigate('/quality/records/eight-d')}
                        className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-white/5 hover:border-pink-500/40 text-start transition-all group"
                      >
                        <span className="text-pink-400 font-black block text-[11px] group-hover:text-pink-300">🔍 {isAr ? 'تحقيقات 8D' : '8D Root Cause'}</span>
                        <span className="text-[9px] text-slate-400">{realEightDs.length} {isAr ? 'تقارير' : 'reports'}</span>
                      </button>

                      <button
                        onClick={() => navigate('/traceability')}
                        className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-white/5 hover:border-blue-500/40 text-start transition-all group"
                      >
                        <span className="text-blue-400 font-black block text-[11px] group-hover:text-blue-300">📦 {isAr ? 'تتبع الدفعة والمسار' : 'Traceability Hub'}</span>
                        <span className="text-[9px] text-slate-400">Batch Genealogies</span>
                      </button>

                      <button
                        onClick={() => navigate('/record-hub')}
                        className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-white/5 hover:border-slate-500/40 text-start transition-all group"
                      >
                        <span className="text-slate-300 font-black block text-[11px] group-hover:text-white">📋 {isAr ? 'مركز السجلات الشامل' : 'All Records'}</span>
                        <span className="text-[9px] text-slate-400">{summaryMetrics.totalStations} {isAr ? 'محطة' : 'pods'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 3. Plant Layout Architecture Presets */}
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-black text-amber-300">
                      <span className="flex items-center gap-1.5">
                        <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isAr ? 'تنسيقات المصنع والسيور الهندسية' : 'Factory Layout & Conveyor Presets'}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <button
                        onClick={() => handleApplyLayoutPreset('bays')}
                        className="p-2 rounded-xl bg-black/40 hover:bg-cyan-950/60 border border-white/5 hover:border-cyan-500/40 text-start transition-all"
                      >
                        <span className="font-bold text-white block text-[11px]">🏭 {isAr ? 'العنابر المتوازية' : 'Bays Grid'}</span>
                        <span className="text-[9px] text-slate-400">Bay A, B, C, D, E</span>
                      </button>

                      <button
                        onClick={() => handleApplyLayoutPreset('u-cell')}
                        className="p-2 rounded-xl bg-black/40 hover:bg-amber-950/60 border border-white/5 hover:border-amber-500/40 text-start transition-all"
                      >
                        <span className="font-bold text-white block text-[11px]">🔄 {isAr ? 'خلية U الرشيقة' : 'Lean U-Cell'}</span>
                        <span className="text-[9px] text-slate-400">TPS Continuous Flow</span>
                      </button>

                      <button
                        onClick={() => handleApplyLayoutPreset('linear')}
                        className="p-2 rounded-xl bg-black/40 hover:bg-emerald-950/60 border border-white/5 hover:border-emerald-500/40 text-start transition-all"
                      >
                        <span className="font-bold text-white block text-[11px]">⚡ {isAr ? 'خط إنتاج تسلسلي' : 'Linear Cascade'}</span>
                        <span className="text-[9px] text-slate-400">Dual Lines & Bridge</span>
                      </button>

                      <button
                        onClick={() => handleApplyLayoutPreset('serpentine')}
                        className="p-2 rounded-xl bg-black/40 hover:bg-purple-950/60 border border-white/5 hover:border-purple-500/40 text-start transition-all"
                      >
                        <span className="font-bold text-white block text-[11px]">〰️ {isAr ? 'مسار متعرج' : 'Serpentine Flow'}</span>
                        <span className="text-[9px] text-slate-400">180° Curved Conveyors</span>
                      </button>
                    </div>

                    <div className="pt-2 flex items-center gap-1.5 border-t border-white/5">
                      <button
                        onClick={handleAutoConnectStations}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-purple-200 font-bold text-[10px] flex items-center justify-center gap-1 transition-all"
                        title={isAr ? 'ربط جميع السيور الناقلة تسلسلياً بذكاء' : 'Smart auto-connect'}
                      >
                        <Cable className="w-3.5 h-3.5 text-purple-400" />
                        <span>{isAr ? '⚡ ربط السيور الذكي' : 'Auto Wire'}</span>
                      </button>

                      <button
                        onClick={handleAutoAlignLayout}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 font-bold text-[10px] flex items-center justify-center gap-1 transition-all"
                        title={isAr ? 'محاذاة هندسية وترتيب المسافات' : 'Auto align layout'}
                      >
                        <AlignJustify className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{isAr ? '📐 محاذاة العنابر' : 'Auto Align'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 4. Ambience & Simulation Controls */}
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-black text-slate-300">
                      <span>{isAr ? 'المظهر والمحاكاة الصناعية' : 'Ambience & Simulation Controls'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        onClick={() => setIsAgvActive(prev => !prev)}
                        className={`p-2 rounded-xl border flex items-center justify-between font-bold transition-all ${
                          isAgvActive ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-black/40 border-white/5 text-slate-500'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5" />
                          <span>{isAr ? 'روبوتات AGV' : 'AGV Robots'}</span>
                        </span>
                        <span className="text-[9px] font-mono">{isAgvActive ? 'ON' : 'OFF'}</span>
                      </button>

                      <button
                        onClick={() => setIsHeatmapActive(prev => !prev)}
                        className={`p-2 rounded-xl border flex items-center justify-between font-bold transition-all ${
                          isHeatmapActive ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' : 'bg-black/40 border-white/5 text-slate-500'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5" />
                          <span>{isAr ? 'خريطة العيوب' : 'Heatmap'}</span>
                        </span>
                        <span className="text-[9px] font-mono">{isHeatmapActive ? 'ON' : 'OFF'}</span>
                      </button>

                      <button
                        onClick={() => setIsMaterialFlowActive(prev => !prev)}
                        className={`p-2 rounded-xl border flex items-center justify-between font-bold transition-all ${
                          isMaterialFlowActive ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-black/40 border-white/5 text-slate-500'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Play className="w-3.5 h-3.5" />
                          <span>{isAr ? 'تدفق الباليتات' : 'Pallet Flow'}</span>
                        </span>
                        <span className="text-[9px] font-mono">{isMaterialFlowActive ? 'ON' : 'OFF'}</span>
                      </button>

                      <button
                        onClick={() => setSoundEnabled(prev => !prev)}
                        className={`p-2 rounded-xl border flex items-center justify-between font-bold transition-all ${
                          soundEnabled ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-black/40 border-white/5 text-slate-500'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>{isAr ? 'نغمات SCADA' : 'Audio Chimes'}</span>
                        </span>
                        <span className="text-[9px] font-mono">{soundEnabled ? 'ON' : 'OFF'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 5. All Workstations List & In-Place Editing */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white flex items-center gap-1.5">
                        <Factory className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isAr ? `ماكينات ومحطات المصنع (${equipmentList.length})` : `All Workstations (${equipmentList.length})`}</span>
                      </span>
                    </div>

                    {/* Quick Search inside Drawer */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={drawerStationSearch}
                        onChange={(e) => setDrawerStationSearch(e.target.value)}
                        placeholder={isAr ? 'بحث سريع عن ماكينة أو كود...' : 'Search station or code...'}
                        className="w-full pr-8 pl-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                      />
                      {drawerStationSearch && (
                        <button
                          onClick={() => setDrawerStationSearch('')}
                          className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Stations List Items */}
                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
                      {equipmentList
                        .filter(eq => {
                          if (!drawerStationSearch.trim()) return true;
                          const q = drawerStationSearch.toLowerCase();
                          return (
                            eq.titleAr.toLowerCase().includes(q) ||
                            eq.titleEn.toLowerCase().includes(q) ||
                            eq.code.toLowerCase().includes(q) ||
                            eq.line.toLowerCase().includes(q)
                          );
                        })
                        .map(eq => {
                          return (
                            <div
                              key={eq.id}
                              onClick={() => {
                                setSelectedStationId(eq.id);
                                if (soundEnabled) playIndustrialChime('camera');
                              }}
                              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/5 hover:border-amber-500/40 transition-all cursor-pointer flex items-center justify-between text-xs group"
                            >
                              <div className="flex items-center gap-2">
                                <span className="p-1 rounded-lg bg-black/40 text-amber-400">
                                  {renderIcon(eq.iconType, 'w-3.5 h-3.5')}
                                </span>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-amber-400 text-[10px]">{eq.code}</span>
                                    <span className="font-bold text-white text-xs">{isAr ? eq.titleAr : eq.titleEn}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                    <span>{eq.line}</span>
                                    <span>•</span>
                                    <span className="text-cyan-400">OEE: {eq.oeeEstimate || 95}%</span>
                                    <span>•</span>
                                    <span className="text-purple-300">CT: {eq.cycleTimeSec ?? 24}s</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingStation(eq);
                                  }}
                                  className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 transition-colors"
                                  title={isAr ? 'تعديل المحطة' : 'Edit station'}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmId(eq.id);
                                  }}
                                  className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-800 text-red-400 hover:text-white transition-colors"
                                  title={isAr ? 'حذف المحطة' : 'Delete station'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </aside>
        ) : (
          /* FLOATING REOPEN BUTTON WHEN DRAWER IS CLOSED */
          <div className="absolute bottom-4 end-4 z-40">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-2xl shadow-amber-500/40 border border-amber-300 ring-2 ring-amber-400/30 transition-all hover:scale-105 active:scale-95"
            >
              <Settings2 className="w-4 h-4 animate-spin-slow" />
              <span>{isAr ? '⚙️ إعدادات وتحكم المصنع' : '⚙️ Factory Controls & Settings'}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-950 text-amber-300 text-[10px] font-mono font-bold">
                {equipmentList.length}
              </span>
            </button>
          </div>
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

      {/* Conveyor Connection Network Manager Modal */}
      {showConnectionManager && (
        <ConnectionManagerModal
          connections={connectionsList}
          stations={equipmentList}
          isAr={isAr}
          onSave={handleSaveConnection}
          onDelete={handleDeleteConnection}
          onAutoConnect={handleAutoConnectStations}
          onReset={handleResetConnections}
          onClose={() => setShowConnectionManager(false)}
        />
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

            {/* Target Module URL (16 Unified Modules) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isAr ? 'الربط التفاعلي المباشر بأقسام المنصة (16 موديول متصل)' : 'Direct Platform Module Integration (16 Connected Modules)'}</span>
              </label>
              <select
                value={formData.moduleUrl}
                onChange={e => {
                  const url = e.target.value;
                  const found = PLATFORM_MODULE_OPTIONS.find(m => m.url === url);
                  setFormData({
                    ...formData,
                    moduleUrl: url,
                    moduleLabelAr: found ? found.shortAr : 'إجراء جودة'
                  });
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                {PLATFORM_MODULE_OPTIONS.map(mod => (
                  <option key={mod.url} value={mod.url}>
                    {isAr ? mod.labelAr : mod.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Critical Quality Characteristic (CTQ) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {isAr ? 'الخاصية / المعيار الحرج للجودة (CTQ)' : 'Critical Quality Characteristic (CTQ)'}
              </label>
              <input
                type="text"
                value={formData.criticalParameterAr || ''}
                onChange={e => setFormData({ ...formData, criticalParameterAr: e.target.value })}
                placeholder={isAr ? 'مثال: القطر الخارجي، عزم الربط، خشونة السطح' : 'e.g. Outer Diameter, Torque, Hardness'}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Target Spec & Tolerance */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {isAr ? 'المواصفة المستهدفة والتفاوت (Target Spec)' : 'Target Spec & Tolerance'}
              </label>
              <input
                type="text"
                value={formData.targetSpec || ''}
                onChange={e => setFormData({ ...formData, targetSpec: e.target.value })}
                placeholder="e.g. 24.5 ± 0.05 mm, 120 Nm"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            {/* Active Operator */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {isAr ? 'المشغل المسؤول بالمحطة' : 'Active Operator / Technician'}
              </label>
              <input
                type="text"
                value={formData.activeOperator || ''}
                onChange={e => setFormData({ ...formData, activeOperator: e.target.value })}
                placeholder={isAr ? 'مثال: م. أحمد عبد الله / وردية أ' : 'e.g. Eng. Ahmed / Shift A'}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Vibration & Temp Specs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {isAr ? 'حد الاهتزاز (mm/s)' : 'Vibration (mm/s)'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.vibrationMmS ?? 1.2}
                  onChange={e => setFormData({ ...formData, vibrationMmS: Number(e.target.value) })}
                  className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {isAr ? 'درجة الحرارة (°C)' : 'Temp (°C)'}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.temperatureC ?? 38.5}
                  onChange={e => setFormData({ ...formData, temperatureC: Number(e.target.value) })}
                  className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                />
              </div>
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

// 16 Unified Platform Module Options for seamless cross-linking
const PLATFORM_MODULE_OPTIONS = [
  { url: '/quality-shopfloor', shortAr: 'تسجيل الصالة', labelAr: '1. تسجيل صالة الإنتاج الميداني (Shopfloor Entry)', labelEn: '1. Shopfloor Defect Entry (/quality-shopfloor)' },
  { url: '/compliance/hub/inspection', shortAr: 'فحص الشحنات', labelAr: '2. فحص استلام الشحنات والمواد الخام (IQC Hub)', labelEn: '2. Incoming Quality Inspection Hub (/inspection)' },
  { url: '/quality/inspection-plans', shortAr: 'خطط الفحص', labelAr: '3. خطط الفحص والتفتيش المعيارية (Inspection Plans)', labelEn: '3. Standard Inspection Plans (/inspection-plans)' },
  { url: '/supplier-quality', shortAr: 'جودة الموردين', labelAr: '4. بوابة جودة وتأهيل الموردين (Supplier Quality)', labelEn: '4. Supplier Quality Portal (/supplier-quality)' },
  { url: '/quality/records/ncr', shortAr: 'تقارير عدم المطابقة', labelAr: '5. تقارير حالات عدم المطابقة (NCR Registry)', labelEn: '5. Non-Conformance Reports (/ncr)' },
  { url: '/quality/records/capa', shortAr: 'الإجراءات التصحيحية', labelAr: '6. الإجراءات التصحيحية والوقائية (CAPA)', labelEn: '6. Corrective & Preventive Action (/capa)' },
  { url: '/quality/records/eight-d', shortAr: 'منهجية 8D', labelAr: '7. منهجية حل المشكلات الثمانية (8D Problem Solving)', labelEn: '7. 8D Problem Solving Methodology (/eight-d)' },
  { url: '/compliance/hub/control-plan', shortAr: 'خطة المراقبة', labelAr: '8. خطة مراقبة العمليات والتصنيع (Control Plan)', labelEn: '8. Manufacturing Control Plan (/control-plan)' },
  { url: '/spc', shortAr: 'التحكم الإحصائي', labelAr: '9. كارتات التحكم الإحصائي والقدرة العملية (SPC & Cpk)', labelEn: '9. Statistical Process Control & Capability (/spc)' },
  { url: '/compliance/hub/calibration', shortAr: 'المعايرة', labelAr: '10. معايرة وصيانة أجهزة القياس (Calibration Hub)', labelEn: '10. Equipment & Gauge Calibration (/calibration)' },
  { url: '/compliance/hub/audit', shortAr: 'التدقيق LPA', labelAr: '11. التدقيق الداخلي وتدقيق العمليات الطبقي (LPA Audit)', labelEn: '11. Layered Process Audits (/audit)' },
  { url: '/outgoing-quality', shortAr: 'الفحص النهائي OQC', labelAr: '12. فحص وتحرير المنتج النهائي للشحن (Outgoing OQC)', labelEn: '12. Outgoing Quality Final Release (/outgoing-quality)' },
  { url: '/quality/records/complaints', shortAr: 'شكاوى العملاء', labelAr: '13. إدارة ومتابعة شكاوى العملاء (Customer Complaints)', labelEn: '13. Customer Complaints Registry (/complaints)' },
  { url: '/digital-twin', shortAr: 'التوأم الرقمي', labelAr: '14. التوأم الرقمي ومحاكاة الخطوط (Digital Twin)', labelEn: '14. Digital Twin Simulation (/digital-twin)' },
  { url: '/quality-master-data', shortAr: 'البيانات الرئيسية', labelAr: '15. كتالوج البيانات الرئيسية والمعدات (Master Data)', labelEn: '15. Master Data & Assets Catalog (/quality-master-data)' },
  { url: '/quality-dashboard', shortAr: 'لوحة القيادة', labelAr: '16. لوحة القيادة والمؤشرات التنفيذية (KPIs Dashboard)', labelEn: '16. Quality Executive Dashboard (/quality-dashboard)' },
];

// ============================================================================
// MODAL COMPONENT: CONVEYOR NETWORK MANAGER (مدير شبكة السيور والمسارات)
// ============================================================================
interface ConnectionManagerModalProps {
  connections: ScadaConnection[];
  stations: ScadaEquipment[];
  isAr: boolean;
  onSave: (conn: ScadaConnection) => void;
  onDelete: (id: string) => void;
  onAutoConnect: () => void;
  onReset: () => void;
  onClose: () => void;
}

function ConnectionManagerModal({
  connections,
  stations,
  isAr,
  onSave,
  onDelete,
  onAutoConnect,
  onReset,
  onClose
}: ConnectionManagerModalProps) {
  const [editingConn, setEditingConn] = useState<ScadaConnection | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const getStation = (id: string) => stations.find(s => s.id === id);

  const emptyConn: ScadaConnection = {
    id: `CONN-${Date.now().toString(36).toUpperCase()}`,
    fromId: stations[0]?.id || '',
    toId: stations[1]?.id || stations[0]?.id || '',
    labelAr: 'مسار ناقل جديد',
    labelEn: 'New Conveyor Flow',
    type: 'motor-roller',
    fromAnchor: 'right',
    toAnchor: 'left',
    velocityMs: 0.5,
    motorKw: 0.75,
    capacityUnits: 20,
    currentWip: 0,
    sensorType: 'Optical Retroreflective'
  };

  const currentForm = editingConn || (isCreating ? emptyConn : null);

  const handleStartCreate = () => {
    setEditingConn(null);
    setIsCreating(true);
  };

  const handleStartEdit = (conn: ScadaConnection) => {
    setIsCreating(false);
    setEditingConn({ ...conn });
  };

  const handleFormChange = (patch: Partial<ScadaConnection>) => {
    if (editingConn) {
      setEditingConn(prev => prev ? { ...prev, ...patch } : null);
    } else if (isCreating) {
      setEditingConn({ ...emptyConn, ...patch });
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentForm) return;
    if (!currentForm.fromId || !currentForm.toId) {
      toast.error(isAr ? 'يرجى تحديد محطة البداية ومحطة الوصول' : 'Please select from and to stations');
      return;
    }
    if (currentForm.fromId === currentForm.toId) {
      toast.error(isAr ? 'لا يمكن ربط المحطة بنفسها' : 'Cannot connect a station to itself');
      return;
    }
    onSave(currentForm);
    setEditingConn(null);
    setIsCreating(false);
  };

  const filteredConnections = connections.filter(conn => {
    const fromSt = getStation(conn.fromId);
    const toSt = getStation(conn.toId);
    const fromStr = fromSt ? `${fromSt.code} ${fromSt.titleAr} ${fromSt.titleEn}` : conn.fromId;
    const toStr = toSt ? `${toSt.code} ${toSt.titleAr} ${toSt.titleEn}` : conn.toId;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      conn.id.toLowerCase().includes(q) ||
      conn.labelAr.toLowerCase().includes(q) ||
      conn.labelEn.toLowerCase().includes(q) ||
      fromStr.toLowerCase().includes(q) ||
      toStr.toLowerCase().includes(q);

    const matchesType = typeFilter === 'all' || conn.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const CONVEYOR_TYPES: { id: ScadaConnection['type']; labelAr: string; labelEn: string; icon: string }[] = [
    { id: 'motor-roller', labelAr: 'سير رولمان بمحرك كهربائي', labelEn: 'Motorized Roller Conveyor', icon: '⚡' },
    { id: 'belt', labelAr: 'سير مطاطي مستمر (Belt)', labelEn: 'Continuous Belt Conveyor', icon: '🔄' },
    { id: 'gravity-roller', labelAr: 'سير جاذبية انسيابي (Gravity)', labelEn: 'Gravity Roller Lane', icon: '↘️' },
    { id: 'chute', labelAr: 'مزلقان سريع للمرفوضات/الفحص', labelEn: 'High-Speed Drop Chute', icon: '🔻' },
    { id: 'pneumatic', labelAr: 'أنبوب هوائي سريع لعينات الجودة', labelEn: 'Pneumatic Sample Tube', icon: '💨' },
    { id: 'bridge', labelAr: 'جسر ناقل هوائي معلق (Bridge)', labelEn: 'Overhead Transfer Bridge', icon: '🌉' },
    { id: 'dock-ramp', labelAr: 'رامب ومنحدر تحميل رصيف الشحن', labelEn: 'Dock Loading Ramp', icon: '🚛' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#080d19] border-2 border-cyan-500/50 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-5 text-white my-8 max-h-[90vh] flex flex-col" dir={isAr ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
              <Workflow className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">
                  {isAr ? 'مدير شبكة السيور والمسارات الناقلة' : 'Conveyor Flow Network Manager'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {connections.length} {isAr ? 'مسار نشط' : 'active routes'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAr ? 'إدارة خطوط النقل الميكانيكية بين محطات المصنع، سرعات النقل، بوابات التغذية وسعة التشغيل' : 'Manage mechanical conveyor connections between stations, speeds, and dock anchors'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onAutoConnect}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center gap-1.5 transition-all"
              title={isAr ? 'ربط جميع المحطات تسلسلياً آلياً' : 'Auto-connect all stations sequentially'}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span className="hidden sm:inline">{isAr ? 'ربط آلي انسيابي' : 'Auto-Connect'}</span>
            </button>
            <button
              onClick={onReset}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all"
              title={isAr ? 'استعادة المسارات الافتراضية للمصنع' : 'Reset default factory connections'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'استعادة الافتراضي' : 'Reset'}</span>
            </button>
            {!isCreating && !editingConn && (
              <button
                onClick={handleStartCreate}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'مسار جديد' : 'New Conveyor'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Create / Edit Form Drawer */}
        {(isCreating || editingConn) && currentForm && (
          <form onSubmit={handleSaveForm} className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 space-y-4 shrink-0 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" />
                {editingConn ? (isAr ? 'تعديل بيانات المسار الناقل' : 'Edit Conveyor Route') : (isAr ? 'إضافة مسار ناقل جديد بين محطتين' : 'Create New Conveyor Route')}
              </span>
              <button
                type="button"
                onClick={() => { setIsCreating(false); setEditingConn(null); }}
                className="text-xs text-slate-400 hover:text-white"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* From Station */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {isAr ? 'محطة الانطلاق (From Station) *' : 'Origin Station *'}
                </label>
                <select
                  value={currentForm.fromId}
                  onChange={e => handleFormChange({ fromId: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  {stations.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.code} - {isAr ? st.titleAr : st.titleEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* From Anchor */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {isAr ? 'بوابة الخروج (Outfeed Dock)' : 'Outfeed Anchor Port'}
                </label>
                <select
                  value={currentForm.fromAnchor || 'right'}
                  onChange={e => handleFormChange({ fromAnchor: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="right">{isAr ? 'اليمين (Right)' : 'Right'}</option>
                  <option value="left">{isAr ? 'اليسار (Left)' : 'Left'}</option>
                  <option value="bottom">{isAr ? 'الأسفل (Bottom)' : 'Bottom'}</option>
                  <option value="top">{isAr ? 'الأعلى (Top)' : 'Top'}</option>
                </select>
              </div>

              {/* To Station */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {isAr ? 'محطة الوصول (To Station) *' : 'Destination Station *'}
                </label>
                <select
                  value={currentForm.toId}
                  onChange={e => handleFormChange({ toId: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  {stations.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.code} - {isAr ? st.titleAr : st.titleEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* To Anchor */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {isAr ? 'بوابة الدخول (Infeed Dock)' : 'Infeed Anchor Port'}
                </label>
                <select
                  value={currentForm.toAnchor || 'left'}
                  onChange={e => handleFormChange({ toAnchor: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="left">{isAr ? 'اليسار (Left)' : 'Left'}</option>
                  <option value="right">{isAr ? 'اليمين (Right)' : 'Right'}</option>
                  <option value="top">{isAr ? 'الأعلى (Top)' : 'Top'}</option>
                  <option value="bottom">{isAr ? 'الأسفل (Bottom)' : 'Bottom'}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Conveyor Type */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {isAr ? 'نوع تقنية النقل' : 'Conveyor Technology'}
                </label>
                <select
                  value={currentForm.type}
                  onChange={e => handleFormChange({ type: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  {CONVEYOR_TYPES.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.icon} {isAr ? t.labelAr : t.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Label Arabic */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {isAr ? 'اسم المسار (بالعربية)' : 'Route Label (Arabic)'}
                </label>
                <input
                  type="text"
                  value={currentForm.labelAr}
                  onChange={e => handleFormChange({ labelAr: e.target.value })}
                  placeholder="مثال: ناقل أوتوماتيكي إلى الفحص"
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Label English */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  {isAr ? 'اسم المسار (بالإنجليزية)' : 'Route Label (English)'}
                </label>
                <input
                  type="text"
                  value={currentForm.labelEn}
                  onChange={e => handleFormChange({ labelEn: e.target.value })}
                  placeholder="e.g. Automated Transfer Lane"
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Telemetry specs: Velocity, Motor kW, Capacity, Sensor */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">{isAr ? 'السرعة (م/ث)' : 'Velocity (m/s)'}</label>
                <input
                  type="number"
                  step="0.05"
                  value={currentForm.velocityMs ?? 0.5}
                  onChange={e => handleFormChange({ velocityMs: Number(e.target.value) })}
                  className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">{isAr ? 'قدرة المحرك (kW)' : 'Motor Power (kW)'}</label>
                <input
                  type="number"
                  step="0.1"
                  value={currentForm.motorKw ?? 0.75}
                  onChange={e => handleFormChange({ motorKw: Number(e.target.value) })}
                  className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">{isAr ? 'سعة السير (قطع)' : 'WIP Capacity'}</label>
                <input
                  type="number"
                  value={currentForm.capacityUnits ?? 20}
                  onChange={e => handleFormChange({ capacityUnits: Number(e.target.value) })}
                  className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">{isAr ? 'حساس المراقبة' : 'Sensor'}</label>
                <input
                  type="text"
                  value={currentForm.sensorType || 'Optical Retroreflective'}
                  onChange={e => handleFormChange({ sensorType: e.target.value })}
                  className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-cyan-500/20">
              <button
                type="button"
                onClick={() => { setIsCreating(false); setEditingConn(null); }}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isAr ? 'حفظ مسار النقل' : 'Save Route'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث بكود المحطة، الاسم، أو نوع الناقل...' : 'Search by station code, name, or conveyor type...'}
              className="w-full pl-9 pr-4 rtl:pr-9 rtl:pl-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all shrink-0 ${
                typeFilter === 'all'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'الكل' : 'All'}
            </button>
            {CONVEYOR_TYPES.slice(0, 4).map(t => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all shrink-0 flex items-center gap-1 ${
                  typeFilter === t.id
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>{t.icon}</span>
                <span className="hidden sm:inline">{isAr ? t.labelAr.split(' ')[0] : t.id}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Connections List / Grid */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {filteredConnections.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-slate-400">
              <Workflow className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold">{isAr ? 'لا توجد مسارات مطابقة' : 'No matching conveyor routes found'}</p>
            </div>
          ) : (
            filteredConnections.map(conn => {
              const fromSt = getStation(conn.fromId);
              const toSt = getStation(conn.toId);
              const typeMeta = CONVEYOR_TYPES.find(t => t.id === conn.type) || CONVEYOR_TYPES[0];

              return (
                <div
                  key={conn.id}
                  className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shrink-0">
                      {typeMeta.icon}
                    </div>

                    <div>
                      {/* Flow badges */}
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                          {fromSt?.code || conn.fromId}
                        </span>
                        <div className="flex items-center text-slate-500">
                          <span className="text-[10px] text-slate-400">[{conn.fromAnchor || 'right'}]</span>
                          <ArrowRight className="w-3.5 h-3.5 text-cyan-400 mx-1 animate-pulse" />
                          <span className="text-[10px] text-slate-400">[{conn.toAnchor || 'left'}]</span>
                        </div>
                        <span className="font-mono font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-500/30">
                          {toSt?.code || conn.toId}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {isAr ? typeMeta.labelAr : typeMeta.labelEn}
                        </span>
                      </div>

                      {/* Station Names & Meta */}
                      <p className="text-xs text-slate-300 mt-1">
                        {isAr ? conn.labelAr : conn.labelEn}
                        <span className="text-slate-500 text-[11px] mx-1">·</span>
                        <span className="text-slate-400 text-[11px]">
                          {fromSt ? (isAr ? fromSt.titleAr : fromSt.titleEn) : ''} ➔ {toSt ? (isAr ? toSt.titleAr : toSt.titleEn) : ''}
                        </span>
                      </p>

                      {/* Telemetry specs pills */}
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                        <span className="font-mono text-cyan-400">⚡ {conn.velocityMs ?? 0.5} m/s</span>
                        <span>·</span>
                        <span className="font-mono text-slate-300">⚙️ {conn.motorKw ?? 0.75} kW</span>
                        <span>·</span>
                        <span className="font-mono text-emerald-400">📦 سعة: {conn.capacityUnits ?? 20}</span>
                        {conn.sensorType && (
                          <>
                            <span>·</span>
                            <span className="text-slate-400">📡 {conn.sensorType}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleStartEdit(conn)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title={isAr ? 'تعديل المسار' : 'Edit Route'}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(conn.id)}
                      className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 border border-red-500/30 transition-colors"
                      title={isAr ? 'حذف المسار' : 'Delete Route'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Delete Confirmation inside Connection Manager */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#0f172a] border border-red-500/40 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white">
                {isAr ? 'تأكيد حذف مسار النقل' : 'Confirm Delete Conveyor'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? 'هل أنت متأكد من حذف هذا المسار الناقل من شبكة المصنع؟' : 'Are you sure you want to remove this conveyor from the factory floorplan?'}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    onDelete(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30"
                >
                  {isAr ? 'نعم، احذف المسار' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QualityControlTower;

