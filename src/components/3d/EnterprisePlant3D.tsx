// @ts-nocheck
// QMS Enterprise 4.0 - Digital Twin 3D Smart Factory Scene
// Fully aligned with the 7 Real Platform Stages & 22 Actual Manual Recording Tabs
import React, { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Cylinder, Sphere, Plane, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { 
  Play, 
  Compass, 
  RotateCcw
} from 'lucide-react';
import type { ScadaEquipment } from '../../pages/quality/QualityControlTower';
import { 
  ENTERPRISE_DEPARTMENTS, 
  ENTERPRISE_DEPT_MAP, 
  type PlantDepartment 
} from '../../services/enterpriseDepartmentsEngine';

// ============================================================================
// TYPES & PROPS
// ============================================================================
export interface EnterprisePlant3DProps {
  equipmentList: ScadaEquipment[];
  stationStatuses?: Record<string, any>;
  selectedStationId?: string | null;
  onSelectStation: (id: string) => void;
  selectedDepartmentId?: string | null;
  onSelectDepartment?: (deptId: string) => void;
  departmentCounts?: Record<string, { openIssues: number; totalRecords?: number; primary?: number }>;
  isAr?: boolean;
}

export interface EnterpriseDepartment3D {
  id: string;
  code: string;
  number: number;
  icon: string;
  nameAr: string;
  nameEn: string;
  shortNameAr: string;
  shortNameEn: string;
  accentHex: string;
  floorColor: string;
  bounds: { x: number; z: number; w: number; d: number };
  camera: { pos: [number, number, number]; target: [number, number, number] };
  stationIds: string[];
}

// ============================================================================
// 7 REAL PLATFORM STAGES - SPATIAL 3D MAPPING
// Strictly matching ENTERPRISE_DEPARTMENTS from enterpriseDepartmentsEngine.ts
// ============================================================================
export const ENTERPRISE_3D_DEPARTMENTS: EnterpriseDepartment3D[] = [
  // 1. Stage 1: Incoming & Supplier Quality (IQC)
  {
    id: 'DEPT-STAGE-INCOMING',
    code: 'STAGE-01',
    number: 1,
    icon: '📥',
    nameAr: '1. استلام الخامات والموردين (IQC)',
    nameEn: '1. Incoming & Supplier Quality (IQC)',
    shortNameAr: 'استلام الخامات (IQC)',
    shortNameEn: 'Incoming & Supplier',
    accentHex: '#f59e0b',
    floorColor: '#1a1306',
    bounds: { x: -24, z: 5, w: 14, d: 24 },
    camera: { pos: [-24, 16, 22], target: [-24, 0, 5] },
    stationIds: ['STATION-SUPPLIER-QUALITY', 'STATION-INSPECTION-PLANS', 'STATION-IQC-INSPECTION']
  },
  // 2. Stage 2: In-Process Quality (IPQC)
  {
    id: 'DEPT-STAGE-INPROCESS',
    code: 'STAGE-02',
    number: 2,
    icon: '⚙️',
    nameAr: '2. جودة التصنيع والعمليات (IPQC)',
    nameEn: '2. In-Process Quality (IPQC)',
    shortNameAr: 'جودة التصنيع (IPQC)',
    shortNameEn: 'In-Process QA',
    accentHex: '#06b6d4',
    floorColor: '#051824',
    bounds: { x: -8, z: 5, w: 14, d: 24 },
    camera: { pos: [-8, 16, 22], target: [-8, 0, 5] },
    stationIds: ['STATION-SHOPFLOOR-ENTRY', 'STATION-DEFECT-LOG', 'STATION-SPC-CHARTS', 'STATION-EXECUTION-BOARD']
  },
  // 3. Stage 3: Problem Solving (NCR/8D)
  {
    id: 'DEPT-STAGE-RESOLUTION',
    code: 'STAGE-03',
    number: 3,
    icon: '🔄',
    nameAr: '3. عدم المطابقة وحل المشكلات (NCR/8D)',
    nameEn: '3. Problem Solving (NCR/8D)',
    shortNameAr: 'عدم المطابقة والتحسين',
    shortNameEn: 'NCR & Problem Solving',
    accentHex: '#f43f5e',
    floorColor: '#240812',
    bounds: { x: 8, z: 5, w: 14, d: 24 },
    camera: { pos: [8, 16, 22], target: [8, 0, 5] },
    stationIds: ['STATION-NCR-REPORTS', 'STATION-CAPA-ACTIONS', 'STATION-8D-SOLVING', 'STATION-DEVIATION-PERMITS', 'STATION-CHANGE-CONTROL']
  },
  // 4. Stage 4: Outgoing Quality (OQC)
  {
    id: 'DEPT-STAGE-OUTGOING',
    code: 'STAGE-04',
    number: 4,
    icon: '✅',
    nameAr: '4. فحص وخروج المنتج (OQC)',
    nameEn: '4. Outgoing Quality (OQC)',
    shortNameAr: 'فحص الشحن (OQC)',
    shortNameEn: 'Outgoing Quality',
    accentHex: '#10b981',
    floorColor: '#051f18',
    bounds: { x: 24, z: 12, w: 14, d: 11 },
    camera: { pos: [24, 14, 22], target: [24, 0, 12] },
    stationIds: ['STATION-OUTGOING-OQC']
  },
  // 5. Stage 5: Customer Complaints & Field Quality
  {
    id: 'DEPT-STAGE-CUSTOMER',
    code: 'STAGE-05',
    number: 5,
    icon: '🤝',
    nameAr: '5. شكاوى العملاء والميدان',
    nameEn: '5. Customer & Field Quality',
    shortNameAr: 'شكاوى العملاء',
    shortNameEn: 'Customer Complaints',
    accentHex: '#6366f1',
    floorColor: '#0e1033',
    bounds: { x: 24, z: -1, w: 14, d: 11 },
    camera: { pos: [24, 14, 9], target: [24, 0, -1] },
    stationIds: ['STATION-CUSTOMER-COMPLAINTS']
  },
  // 6. Stage 6: Engineering Lab & Audits
  {
    id: 'DEPT-STAGE-COMPLIANCE',
    code: 'STAGE-06',
    number: 6,
    icon: '🔬',
    nameAr: '6. المختبر الهندسي والتدقيق',
    nameEn: '6. Engineering Lab & Audits',
    shortNameAr: 'المختبر والتدقيق',
    shortNameEn: 'Lab & Compliance',
    accentHex: '#a855f7',
    floorColor: '#170b2c',
    bounds: { x: 24, z: -14, w: 14, d: 11 },
    camera: { pos: [24, 14, -4], target: [24, 0, -14] },
    stationIds: ['STATION-CONTROL-PLAN', 'STATION-FMEA-RISK', 'STATION-CALIBRATION-MSA', 'STATION-LAYERED-AUDITS', 'STATION-INTERNAL-AUDIT']
  },
  // 7. Stage 7: Factory Setup & Master Data
  {
    id: 'DEPT-STAGE-SETUP',
    code: 'STAGE-07',
    number: 7,
    icon: '⚙️',
    nameAr: '7. تهيئة المصنع والبيانات',
    nameEn: '7. Factory Setup & Master Data',
    shortNameAr: 'البيانات والتهيئة',
    shortNameEn: 'Setup & Master Data',
    accentHex: '#3b82f6',
    floorColor: '#07162b',
    bounds: { x: -16, z: -14, w: 30, d: 11 },
    camera: { pos: [-16, 14, -4], target: [-16, 0, -14] },
    stationIds: ['STATION-MASTER-DATA', 'STATION-FORM-DESIGNER', 'STATION-KNOWLEDGE-BASE']
  }
];

// ============================================================================
// 22 REAL RECORDING WORKSTATIONS - 3D COORDS
// Strictly matching the 22 manual recording tabs from Sidebar.tsx
// ============================================================================
export const REAL_STATION_3D_COORDS: Record<string, [number, number, number]> = {
  // 1. Stage 1: استلام الخامات والموردين (IQC)
  'STATION-SUPPLIER-QUALITY': [-24, 0, 13],
  'STATION-INSPECTION-PLANS': [-24, 0, 5],
  'STATION-IQC-INSPECTION': [-24, 0, -3],

  // 2. Stage 2: جودة التصنيع والعمليات (IPQC)
  'STATION-SHOPFLOOR-ENTRY': [-8, 0, 13],
  'STATION-DEFECT-LOG': [-8, 0, 7],
  'STATION-SPC-CHARTS': [-8, 0, 1],
  'STATION-EXECUTION-BOARD': [-8, 0, -5],

  // 3. Stage 3: عدم المطابقة وحل المشكلات (NCR/8D)
  'STATION-NCR-REPORTS': [8, 0, 13],
  'STATION-CAPA-ACTIONS': [8, 0, 7],
  'STATION-8D-SOLVING': [8, 0, 1],
  'STATION-DEVIATION-PERMITS': [8, 0, -4],
  'STATION-CHANGE-CONTROL': [8, 0, -9],

  // 4. Stage 4: فحص وخروج المنتج (OQC)
  'STATION-OUTGOING-OQC': [24, 0, 12],

  // 5. Stage 5: شكاوى العملاء والميدان
  'STATION-CUSTOMER-COMPLAINTS': [24, 0, -1],

  // 6. Stage 6: المختبر الهندسي والتدقيق
  'STATION-CONTROL-PLAN': [20, 0, -10],
  'STATION-FMEA-RISK': [28, 0, -10],
  'STATION-CALIBRATION-MSA': [24, 0, -14],
  'STATION-LAYERED-AUDITS': [20, 0, -18],
  'STATION-INTERNAL-AUDIT': [28, 0, -18],

  // 7. Stage 7: تهيئة المصنع والبيانات
  'STATION-MASTER-DATA': [-22, 0, -14],
  'STATION-FORM-DESIGNER': [-16, 0, -14],
  'STATION-KNOWLEDGE-BASE': [-10, 0, -14],
};

// ----------------------------------------------------------------------------
// Worker Avatar (Quality Inspector / Operator)
// ----------------------------------------------------------------------------
function WorkerAvatar({ position, color = '#0284c7', helmetColor = '#f59e0b', isWorking = true }: {
  position: [number, number, number];
  color?: string;
  helmetColor?: string;
  isWorking?: boolean;
}) {
  const armRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (armRef.current && isWorking) {
      armRef.current.rotation.x = Math.sin(clock.elapsedTime * 3) * 0.4;
    }
  });

  return (
    <group position={position}>
      {/* Torso */}
      <Box args={[0.42, 0.65, 0.28]} position={[0, 0.95, 0]} castShadow>
        <meshStandardMaterial color={color} roughness={0.6} />
      </Box>
      {/* Reflective Safety Vest */}
      <Box args={[0.44, 0.35, 0.3]} position={[0, 1.05, 0]}>
        <meshStandardMaterial color="#84cc16" roughness={0.3} emissive="#84cc16" emissiveIntensity={0.2} />
      </Box>
      {/* Head */}
      <Sphere args={[0.16, 16, 16]} position={[0, 1.48, 0]} castShadow>
        <meshStandardMaterial color="#fed7aa" roughness={0.7} />
      </Sphere>
      {/* Hard Hat */}
      <Cylinder args={[0.19, 0.22, 0.12, 16]} position={[0, 1.62, 0]} castShadow>
        <meshStandardMaterial color={helmetColor} roughness={0.3} metalness={0.1} />
      </Cylinder>
      {/* Arms */}
      <group ref={armRef} position={[0.26, 1.15, 0]}>
        <Box args={[0.12, 0.45, 0.12]} position={[0, -0.2, 0.1]} castShadow>
          <meshStandardMaterial color={color} />
        </Box>
      </group>
      <Box args={[0.12, 0.45, 0.12]} position={[-0.26, 0.95, 0]} castShadow>
        <meshStandardMaterial color={color} />
      </Box>
      {/* Legs & Safety Boots */}
      <Box args={[0.15, 0.55, 0.15]} position={[-0.12, 0.35, 0]} castShadow>
        <meshStandardMaterial color="#1e293b" />
      </Box>
      <Box args={[0.15, 0.55, 0.15]} position={[0.12, 0.35, 0]} castShadow>
        <meshStandardMaterial color="#1e293b" />
      </Box>
      <Box args={[0.16, 0.15, 0.22]} position={[-0.12, 0.08, 0.03]} castShadow>
        <meshStandardMaterial color="#0f172a" />
      </Box>
      <Box args={[0.16, 0.15, 0.22]} position={[0.12, 0.08, 0.03]} castShadow>
        <meshStandardMaterial color="#0f172a" />
      </Box>
    </group>
  );
}

// ----------------------------------------------------------------------------
// Quality Workstation Console (Manual Recording Terminal Pod)
// Represents each of the 22 manual recording tabs on the 3D plant floor
// ----------------------------------------------------------------------------
function QualityWorkstationPod({
  station,
  position,
  accentColor = '#06b6d4',
  statusColor = '#10b981',
  isSelected = false,
  onSelect
}: {
  station: ScadaEquipment;
  position: [number, number, number];
  accentColor?: string;
  statusColor?: string;
  isSelected?: boolean;
  onSelect: () => void;
}) {
  return (
    <group 
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Base Floor Demarcation Ring */}
      <Cylinder args={[1.3, 1.4, 0.04, 24]} position={[0, 0.02, 0]} receiveShadow>
        <meshStandardMaterial 
          color={isSelected ? accentColor : '#0f172a'} 
          roughness={0.4} 
          metalness={0.7} 
        />
      </Cylinder>
      {/* Outer Halo ring when selected */}
      {isSelected && (
        <Cylinder args={[1.65, 1.65, 0.02, 32]} position={[0, 0.03, 0]}>
          <meshBasicMaterial color={accentColor} transparent opacity={0.6} />
        </Cylinder>
      )}

      {/* Main Console Pedestal */}
      <Box args={[1.4, 0.85, 0.8]} position={[0, 0.44, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </Box>
      {/* Metallic Accent Trim */}
      <Box args={[1.42, 0.08, 0.82]} position={[0, 0.84, 0]}>
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.8} />
      </Box>

      {/* Operator Worktop / Counter */}
      <Box args={[1.6, 0.06, 0.9]} position={[0, 0.88, 0]} castShadow>
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </Box>

      {/* Angled Dual Digital Terminal Screen */}
      <group position={[0, 1.25, -0.15]} rotation={[-0.2, 0, 0]}>
        {/* Screen Bezel */}
        <Box args={[1.2, 0.65, 0.06]} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#020617" metalness={0.8} roughness={0.2} />
        </Box>
        {/* Glowing Display Screen */}
        <Box args={[1.14, 0.59, 0.02]} position={[0, 0, 0.035]}>
          <meshStandardMaterial 
            color={accentColor} 
            emissive={accentColor} 
            emissiveIntensity={isSelected ? 1.6 : 0.9} 
            roughness={0.1}
          />
        </Box>
      </group>

      {/* Andon Tower Mast */}
      <Cylinder args={[0.02, 0.02, 0.9, 12]} position={[0.65, 1.35, -0.3]}>
        <meshStandardMaterial color="#475569" metalness={0.9} />
      </Cylinder>
      {/* Andon Status Light */}
      <Sphere args={[0.08, 16, 16]} position={[0.65, 1.82, -0.3]}>
        <meshStandardMaterial 
          color={statusColor} 
          emissive={statusColor} 
          emissiveIntensity={2.0} 
        />
      </Sphere>
      <pointLight 
        position={[0, 1.5, 0.2]} 
        color={accentColor} 
        intensity={isSelected ? 1.4 : 0.6} 
        distance={3.5} 
      />
    </group>
  );
}

// ----------------------------------------------------------------------------
// Minimalist Holographic Station Billboard
// ----------------------------------------------------------------------------
function HolographicStationBillboard({ 
  station, 
  statusInfo, 
  isSelected, 
  onSelect,
  isAr = true
}: {
  station: ScadaEquipment;
  statusInfo?: any;
  isSelected: boolean;
  onSelect: () => void;
  isAr?: boolean;
}) {
  const oee = statusInfo?.realTimeMetrics?.oee ?? station.oeeEstimate ?? 95;
  const status = statusInfo?.status || 'pass';

  const statusColor = 
    status === 'critical' ? '#ef4444' :
    status === 'warning' ? '#f59e0b' : '#10b981';

  return (
    <Html
      position={[0, 2.5, 0]}
      center
      distanceFactor={28}
      className="pointer-events-auto"
      style={{
        transition: 'all 0.15s ease',
        transform: isSelected ? 'scale(1.12)' : 'scale(1.0)',
        zIndex: isSelected ? 15 : 5
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg transition-all ${
          isSelected 
            ? 'bg-slate-900 border-2 ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)]' 
            : 'bg-slate-950/85 hover:bg-slate-900 border hover:scale-105 active:scale-95'
        }`}
        style={{
          borderColor: isSelected ? '#38bdf8' : `${statusColor}60`,
          boxShadow: isSelected 
            ? `0 0 20px rgba(56,189,248,0.5), inset 0 0 10px rgba(56,189,248,0.2)` 
            : `0 0 12px ${statusColor}30`,
        }}
        title={isAr ? station.titleAr : station.titleEn}
      >
        <span 
          className="w-2 h-2 rounded-full shrink-0 animate-ping"
          style={{ backgroundColor: statusColor }}
        />
        <span 
          className="w-2 h-2 rounded-full shrink-0 -ml-3.5"
          style={{ backgroundColor: statusColor }}
        />
        <span className="text-[11px] font-mono font-black text-white">
          {station.code}
        </span>
        <span className={`text-[10px] font-medium max-w-[140px] truncate ${
          isSelected ? 'text-cyan-200 inline' : 'text-slate-400 hidden group-hover:inline'
        }`}>
          {isAr ? station.titleAr : station.titleEn}
        </span>
        <span 
          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
          style={{ 
            backgroundColor: `${statusColor}25`,
            color: statusColor 
          }}
        >
          {oee}%
        </span>
      </button>
    </Html>
  );
}

// ============================================================================
// MAIN 3D ENTERPRISE FACTORY CANVAS
// ============================================================================
export function EnterprisePlant3D({
  equipmentList,
  stationStatuses,
  selectedStationId,
  onSelectStation,
  selectedDepartmentId,
  onSelectDepartment,
  departmentCounts,
  isAr = true
}: EnterprisePlant3DProps) {
  const [cameraMode, setCameraMode] = useState<'orbit' | 'walk'>('orbit');
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [localSelectedDeptId, setLocalSelectedDeptId] = useState<string | null>(null);
  const controlsRef = useRef<any>(null);

  const activeDeptId = selectedDepartmentId !== undefined ? selectedDepartmentId : localSelectedDeptId;

  // Camera presets flight controller
  const flyToPreset = (targetPosition: [number, number, number], lookAt: [number, number, number] = [0, 0, 0]) => {
    if (controlsRef.current) {
      controlsRef.current.target.set(...lookAt);
      controlsRef.current.object.position.set(...targetPosition);
      controlsRef.current.update();
    }
  };

  // Sync camera when parent changes selectedDepartmentId
  useEffect(() => {
    if (selectedDepartmentId) {
      const dept = ENTERPRISE_3D_DEPARTMENTS.find(d => d.id === selectedDepartmentId);
      if (dept) {
        flyToPreset(dept.camera.pos as any, dept.camera.target as any);
      }
    }
  }, [selectedDepartmentId]);

  // Synchronized 3D station coordinates mapping inside their respective departments
  const station3DCoords = useMemo(() => {
    const coords: Record<string, [number, number, number]> = { ...REAL_STATION_3D_COORDS };

    // Auto-placement for any extra or custom stations
    equipmentList.forEach((eq, idx) => {
      if (!coords[eq.id]) {
        const row = idx % 2 === 0 ? 5 : -5;
        const x = -20 + (idx * 3.5);
        coords[eq.id] = [x, 0, row];
      }
    });

    return coords;
  }, [equipmentList]);

  return (
    <div className="relative w-full h-full bg-[#050811] overflow-hidden select-none isolate">
      {/* ==================================================================== */}
      {/* TOP CONTROLS & 7 REAL DEPARTMENTS NAVIGATOR HUD                      */}
      {/* ==================================================================== */}
      <div className="absolute top-3 left-3 right-3 z-40 flex items-center justify-between gap-2 pointer-events-none">
        {/* Left: View Controls (Orbit / Auto-Tour) */}
        <div className="flex items-center gap-1.5 pointer-events-auto shrink-0 bg-[#090f1e]/90 backdrop-blur-xl border border-white/10 p-1 rounded-2xl shadow-2xl">
          <button
            onClick={() => setCameraMode('orbit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
              cameraMode === 'orbit'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md ring-2 ring-cyan-300'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isAr ? 'منظور 360°' : '360° View'}</span>
          </button>
          <button
            onClick={() => setAutoRotate(prev => !prev)}
            className={`p-1.5 rounded-xl border transition-all ${
              autoRotate
                ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400'
                : 'bg-black/40 text-slate-300 hover:text-white border-white/10'
            }`}
            title={isAr ? 'جولة كاميرا سينمائية تلقائية' : 'Cinematic Auto-Tour'}
          >
            <Play className={`w-3.5 h-3.5 ${autoRotate ? 'fill-slate-950' : ''}`} />
          </button>
        </div>

        {/* Right: The 7 Real Platform Stages Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[calc(100vw-220px)] bg-[#090f1e]/90 backdrop-blur-xl border border-white/10 p-1 rounded-2xl shadow-2xl scrollbar-none pointer-events-auto">
          {/* Overview Button */}
          <button
            onClick={() => {
              setLocalSelectedDeptId(null);
              onSelectDepartment?.('');
              flyToPreset([0, 26, 30], [0, 0, 0]);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 ${
              !activeDeptId 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 ring-2 ring-cyan-300 shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🏭</span>
            <span>{isAr ? 'كل المصنع' : 'All Plant'}</span>
          </button>

          {/* 7 Real Platform Stages Chips */}
          {ENTERPRISE_3D_DEPARTMENTS.map(dept => {
            const isSelected = activeDeptId === dept.id;
            const countInfo = departmentCounts?.[dept.id];
            const openIssues = countInfo?.openIssues || 0;

            return (
              <button
                key={dept.id}
                onClick={() => {
                  setLocalSelectedDeptId(dept.id);
                  onSelectDepartment?.(dept.id);
                  flyToPreset(dept.camera.pos as any, dept.camera.target as any);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 border ${
                  isSelected
                    ? 'text-slate-950 ring-2 shadow-lg scale-105'
                    : 'text-slate-300 hover:text-white bg-black/40 border-white/5 hover:border-white/20'
                }`}
                style={{
                  backgroundColor: isSelected ? dept.accentHex : undefined,
                  borderColor: isSelected ? dept.accentHex : undefined,
                  color: isSelected ? '#090d16' : undefined
                }}
              >
                <span 
                  style={{ backgroundColor: isSelected ? '#090d16' : dept.accentHex }}
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                    isSelected ? 'text-white' : 'text-slate-950'
                  }`}
                >
                  {dept.number}
                </span>
                <span>{dept.icon}</span>
                <span className="font-mono text-[10px] opacity-80">{dept.code}</span>
                <span className="truncate max-w-[120px] hidden md:inline">
                  {isAr ? dept.shortNameAr : dept.shortNameEn}
                </span>
                {openIssues > 0 && (
                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-black font-mono animate-pulse ${
                    isSelected ? 'bg-black text-red-400' : 'bg-red-500/25 text-red-300 border border-red-500/40'
                  }`}>
                    {openIssues} NCR
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* FLOATING 1-CLICK CAMERA HUD (BOTTOM LEFT)                             */}
      {/* ==================================================================== */}
      <div className="absolute bottom-5 left-5 z-40 flex items-center gap-1.5 bg-[#090f1e]/95 backdrop-blur-2xl border border-white/10 p-1.5 rounded-2xl shadow-2xl">
        <button
          onClick={() => {
            setLocalSelectedDeptId(null);
            onSelectDepartment?.('');
            flyToPreset([0, 26, 30], [0, 0, 0]);
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1.5 border border-cyan-500/30 transition-all hover:scale-105 shadow-md"
          title={isAr ? 'إعادة ضبط الكاميرا' : 'Reset Camera'}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isAr ? 'إعادة ضبط الكاميرا' : 'Reset View'}</span>
        </button>

        <button
          onClick={() => flyToPreset([-28, 22, 28], [-4, 0, 0])}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all border border-white/5 shadow-md"
        >
          <span>📐 {isAr ? 'أيزومتري' : 'Isometric'}</span>
        </button>

        <button
          onClick={() => flyToPreset([0, 42, 0.1], [0, 0, 0])}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all border border-white/5 shadow-md"
        >
          <span>⬆️ {isAr ? 'منظر علوي' : 'Top-Down'}</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* THREE.JS WEBGL CANVAS                                                */}
      {/* ==================================================================== */}
      <Canvas
        shadows
        camera={{ position: [0, 26, 30], fov: 45 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#040711']} />
        
        {/* Lights */}
        <ambientLight intensity={0.8} />
        <directionalLight 
          position={[25, 35, 20]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048} 
        />
        <pointLight position={[-24, 12, 10]} color="#f59e0b" intensity={0.7} distance={22} />
        <pointLight position={[-8, 12, 10]} color="#06b6d4" intensity={0.7} distance={22} />
        <pointLight position={[8, 12, 10]} color="#f43f5e" intensity={0.7} distance={22} />
        <pointLight position={[24, 12, 6]} color="#10b981" intensity={0.7} distance={22} />
        <pointLight position={[-16, 12, -14]} color="#3b82f6" intensity={0.7} distance={22} />
        <pointLight position={[24, 12, -14]} color="#a855f7" intensity={0.7} distance={22} />

        {/* Silky Smooth Camera OrbitControls */}
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.65}
          maxPolarAngle={Math.PI / 2.3}
          minPolarAngle={Math.PI / 8}
          minDistance={10}
          maxDistance={60}
          autoRotate={autoRotate}
          autoRotateSpeed={0.6}
        />

        <Suspense fallback={null}>
          {/* Master Factory Base Foundation */}
          <Plane args={[76, 46]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
            <meshStandardMaterial color="#070a12" roughness={0.4} metalness={0.4} />
          </Plane>

          {/* ================================================================ */}
          {/* 7 REAL PLATFORM STAGES - FLOOR DEMARCATION                       */}
          {/* ================================================================ */}
          {ENTERPRISE_3D_DEPARTMENTS.map((dept) => {
            const isSelected = activeDeptId === dept.id;

            return (
              <group key={dept.id}>
                {/* Epoxy Floor Pad */}
                <Plane
                  args={[dept.bounds.w, dept.bounds.d]}
                  rotation={[-Math.PI / 2, 0, 0]}
                  position={[dept.bounds.x, 0.003, dept.bounds.z]}
                  receiveShadow
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocalSelectedDeptId(dept.id);
                    onSelectDepartment?.(dept.id);
                    flyToPreset(dept.camera.pos as any, dept.camera.target as any);
                  }}
                >
                  <meshStandardMaterial
                    color={dept.floorColor}
                    roughness={0.25}
                    metalness={0.35}
                  />
                </Plane>

                {/* Glowing Perimeter Borders */}
                <Box args={[dept.bounds.w, 0.04, 0.14]} position={[dept.bounds.x, 0.02, dept.bounds.z - dept.bounds.d / 2]}>
                  <meshStandardMaterial color={dept.accentHex} emissive={dept.accentHex} emissiveIntensity={isSelected ? 2.5 : 0.8} />
                </Box>
                <Box args={[dept.bounds.w, 0.04, 0.14]} position={[dept.bounds.x, 0.02, dept.bounds.z + dept.bounds.d / 2]}>
                  <meshStandardMaterial color={dept.accentHex} emissive={dept.accentHex} emissiveIntensity={isSelected ? 2.5 : 0.8} />
                </Box>
                <Box args={[0.14, 0.04, dept.bounds.d]} position={[dept.bounds.x - dept.bounds.w / 2, 0.02, dept.bounds.z]}>
                  <meshStandardMaterial color={dept.accentHex} emissive={dept.accentHex} emissiveIntensity={isSelected ? 2.5 : 0.8} />
                </Box>
                <Box args={[0.14, 0.04, dept.bounds.d]} position={[dept.bounds.x + dept.bounds.w / 2, 0.02, dept.bounds.z]}>
                  <meshStandardMaterial color={dept.accentHex} emissive={dept.accentHex} emissiveIntensity={isSelected ? 2.5 : 0.8} />
                </Box>

                {/* Floor Stripe Decal */}
                <Plane 
                  args={[dept.bounds.w * 0.9, 0.5]} 
                  rotation={[-Math.PI / 2, 0, 0]} 
                  position={[dept.bounds.x, 0.015, dept.bounds.z + (dept.bounds.z > 0 ? dept.bounds.d / 2 - 0.6 : -dept.bounds.d / 2 + 0.6)]}
                >
                  <meshBasicMaterial color={dept.accentHex} transparent opacity={isSelected ? 0.45 : 0.18} />
                </Plane>
              </group>
            );
          })}

          {/* Central Safety Walkways */}
          <Plane args={[68, 2.4]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
            <meshBasicMaterial color="#1e293b" />
          </Plane>
          <Plane args={[68, 0.12]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 1.2]}>
            <meshBasicMaterial color="#f59e0b" />
          </Plane>
          <Plane args={[68, 0.12]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, -1.2]}>
            <meshBasicMaterial color="#f59e0b" />
          </Plane>

          {/* Transverse Crosswalks */}
          {[-16, 0, 16].map((x, i) => (
            <group key={i}>
              <Plane args={[2.2, 38]} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.008, 0]}>
                <meshBasicMaterial color="#1e293b" />
              </Plane>
              {[-8, -4, 4, 8].map((zy, zi) => (
                <Plane key={zi} args={[1.8, 0.35]} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.016, zy]}>
                  <meshBasicMaterial color="#f8fafc" transparent opacity={0.6} />
                </Plane>
              ))}
            </group>
          ))}

          {/* Factory Back Wall */}
          <Box args={[72, 8, 0.4]} position={[0, 4, -22]} receiveShadow>
            <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.7} />
          </Box>
          {/* Steel Roof Trusses */}
          {[-24, -12, 0, 12, 24].map((tx, ti) => (
            <group key={ti} position={[tx, 7.8, 0]}>
              <Box args={[0.3, 0.3, 44]}>
                <meshStandardMaterial color="#334155" metalness={0.9} />
              </Box>
            </group>
          ))}

          {/* ================================================================ */}
          {/* QUALITY INSPECTORS / AUDITORS AT WORKSTATION PODS                */}
          {/* ================================================================ */}
          {/* Stage 1: IQC Inspector */}
          <WorkerAvatar position={[-24, 0, -1.8]} color="#d97706" helmetColor="#f59e0b" />
          {/* Stage 2: Shopfloor IPQC Operator */}
          <WorkerAvatar position={[-8, 0, 11.8]} color="#0891b2" helmetColor="#06b6d4" />
          {/* Stage 3: NCR & CAPA Engineer */}
          <WorkerAvatar position={[8, 0, 11.8]} color="#e11d48" helmetColor="#ffffff" />
          {/* Stage 4: Outgoing OQC Auditor */}
          <WorkerAvatar position={[24, 0, 10.8]} color="#059669" helmetColor="#10b981" />
          {/* Stage 5: Customer Quality Rep */}
          <WorkerAvatar position={[24, 0, -2.2]} color="#4f46e5" helmetColor="#6366f1" />
          {/* Stage 6: Metrology & Lab Specialist */}
          <WorkerAvatar position={[24, 0, -12.8]} color="#9333ea" helmetColor="#ffffff" />
          {/* Stage 7: Master Data Admin */}
          <WorkerAvatar position={[-16, 0, -12.8]} color="#2563eb" helmetColor="#3b82f6" />

          {/* ================================================================ */}
          {/* CLOSED-LOOP QUALITY DATA HIGHWAY PULSES                          */}
          {/* ================================================================ */}
          {/* Stage 1 (IQC) -> Stage 2 (Shopfloor IPQC) */}
          <Line
            points={[
              [-24, 0.8, -3],
              [-16, 0.8, 5],
              [-8, 0.8, 13]
            ]}
            color="#f59e0b"
            lineWidth={2}
            dashed
            dashScale={15}
            dashSize={0.8}
            gapSize={0.4}
          />
          {/* Stage 2 (IPQC) -> Stage 3 (NCR/8D Resolution) */}
          <Line
            points={[
              [-8, 0.8, -5],
              [0, 0.8, 0],
              [8, 0.8, 13]
            ]}
            color="#06b6d4"
            lineWidth={2}
            dashed
            dashScale={15}
            dashSize={0.8}
            gapSize={0.4}
          />
          {/* Stage 3 (Resolution) -> Stage 4 (Outgoing OQC) */}
          <Line
            points={[
              [8, 0.8, -9],
              [16, 0.8, 5],
              [24, 0.8, 12]
            ]}
            color="#f43f5e"
            lineWidth={2}
            dashed
            dashScale={15}
            dashSize={0.8}
            gapSize={0.4}
          />
          {/* Stage 4 (OQC) -> Stage 5 (Customer Complaints) */}
          <Line
            points={[
              [24, 0.8, 12],
              [24, 0.8, -1]
            ]}
            color="#10b981"
            lineWidth={2}
            dashed
            dashScale={15}
            dashSize={0.8}
            gapSize={0.4}
          />
          {/* Stage 5 (Customer) Feedback Loop -> Stage 3 (8D) & Stage 6 (Compliance & Risk) */}
          <Line
            points={[
              [24, 2.2, -1],
              [24, 5.0, -1],
              [16, 5.0, 1],
              [8, 2.2, 1]
            ]}
            color="#6366f1"
            lineWidth={2.5}
            dashed
            dashScale={18}
            dashSize={1}
            gapSize={0.5}
          />

          {/* ================================================================ */}
          {/* 22 REAL RECORDING WORKSTATION PODS & BILLBOARDS                  */}
          {/* ================================================================ */}
          {equipmentList.filter(Boolean).map(eq => {
            const pos = station3DCoords[eq.id] || [0, 0, 0];
            const isSelected = selectedStationId === eq.id;
            const st = stationStatuses?.[eq.id];
            const dept = ENTERPRISE_DEPT_MAP[eq.departmentId] || ENTERPRISE_3D_DEPARTMENTS[0];
            const accentColor = dept?.accentHex || '#06b6d4';
            const statusColor = st?.status === 'critical' ? '#ef4444' : st?.status === 'warning' ? '#f59e0b' : '#10b981';

            return (
              <group key={eq.id}>
                {/* Physical Workstation Pedestal */}
                <QualityWorkstationPod
                  station={eq}
                  position={pos}
                  accentColor={accentColor}
                  statusColor={statusColor}
                  isSelected={isSelected}
                  onSelect={() => onSelectStation(eq.id)}
                />

                {/* Floating Holographic Station Billboard */}
                <group position={pos}>
                  <HolographicStationBillboard
                    station={eq}
                    statusInfo={st}
                    isSelected={isSelected}
                    onSelect={() => onSelectStation(eq.id)}
                    isAr={isAr}
                  />
                </group>
              </group>
            );
          })}
        </Suspense>
      </Canvas>
    </div>
  );
}

export default EnterprisePlant3D;
