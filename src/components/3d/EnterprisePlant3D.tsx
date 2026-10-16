// @ts-nocheck
// QMS Enterprise 4.0 - Digital Twin 3D Smart Factory Scene
// Fully integrated with the 10 Real Enterprise Departments of the QMS Platform
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
// 10 REAL ENTERPRISE DEPARTMENTS - SPATIAL 3D MAPPING
// Directly matching ENTERPRISE_DEPARTMENTS from enterpriseDepartmentsEngine.ts
// ============================================================================
export const ENTERPRISE_3D_DEPARTMENTS: EnterpriseDepartment3D[] = [
  // 1. SQA-01: Supply Chain & Supplier Quality
  {
    id: 'DEPT-SUPPLY-CHAIN',
    code: 'SQA-01',
    number: 1,
    icon: '🚚',
    nameAr: 'إدارة سلاسل الإمداد وجودة الموردين',
    nameEn: 'Supply Chain & Supplier Quality (SQA)',
    shortNameAr: 'جودة الموردين والاستلام',
    shortNameEn: 'Supplier QA & Inbound',
    accentHex: '#f59e0b',
    floorColor: '#1a1306',
    bounds: { x: -25, z: 11, w: 15, d: 11 },
    camera: { pos: [-25, 12, 22], target: [-25, 0, 11] },
    stationIds: ['DOCK-RECEIVING-01', 'STATION-IQC-INSPECT', 'QUARANTINE-CAGE']
  },
  // 2. WMS-02: Warehouse & Raw Materials Inventory
  {
    id: 'DEPT-WAREHOUSE-INVENTORY',
    code: 'WMS-02',
    number: 2,
    icon: '📦',
    nameAr: 'إدارة المستودعات ومراقبة المخزون وتتبع اللوطات',
    nameEn: 'Warehouse & Raw Materials Inventory (WMS)',
    shortNameAr: 'المستودعات والخامات',
    shortNameEn: 'Warehouse & Staging',
    accentHex: '#0284c7',
    floorColor: '#07162b',
    bounds: { x: -25, z: -10, w: 15, d: 13 },
    camera: { pos: [-25, 12, 2], target: [-22, 0, -10] },
    stationIds: ['WAREHOUSE-RAW-STAGING', 'STATION-WH-STORAGE']
  },
  // 3. PRD-03: Manufacturing & Shopfloor Production Operations
  {
    id: 'DEPT-PRODUCTION-OPERATIONS',
    code: 'PRD-03',
    number: 3,
    icon: '⚙️',
    nameAr: 'إدارة العمليات والإنتاج والتشغيل الميداني',
    nameEn: 'Manufacturing & Shopfloor Production Operations',
    shortNameAr: 'الإنتاج والتشغيل',
    shortNameEn: 'Shopfloor Production',
    accentHex: '#06b6d4',
    floorColor: '#051824',
    bounds: { x: -6, z: -7, w: 19, d: 9 },
    camera: { pos: [-6, 12, 5], target: [-6, 0, -7] },
    stationIds: ['STATION-CNC-MILLING', 'STATION-SUB-ASSEMBLY', 'STATION-STAMPING-PRESS', 'STATION-WELD-ROBOT', 'STATION-SMT-ASSEMBLY']
  },
  // 4. IPQC-04: In-Process Quality Control & Quality Engineering
  {
    id: 'DEPT-IPQC-QUALITY-ENG',
    code: 'IPQC-04',
    number: 4,
    icon: '🔬',
    nameAr: 'إدارة هندسة الجودة والرقابة أثناء التشغيل والـ SPC',
    nameEn: 'In-Process Quality Control & Quality Engineering (IPQC)',
    shortNameAr: 'الجودة أثناء التشغيل',
    shortNameEn: 'In-Process QA (IPQC)',
    accentHex: '#10b981',
    floorColor: '#062016',
    bounds: { x: -6, z: 6.5, w: 19, d: 8 },
    camera: { pos: [-6, 11, 17], target: [-6, 0, 6.5] },
    stationIds: ['STATION-TORQUE-BENCH', 'STATION-PRESSURE-TEST', 'STATION-IPQC-GATE', 'STATION-AOI-INSPECTOR']
  },
  // 5. MET-05: Metrology Lab, CMM Testing & Calibration
  {
    id: 'DEPT-METROLOGY-LAB',
    code: 'MET-05',
    number: 5,
    icon: '📐',
    nameAr: 'إدارة المختبرات المترولوجية والقياس الدقيق CMM والمعايرة',
    nameEn: 'Metrology Lab, CMM Testing & Calibration',
    shortNameAr: 'مختبر المترولوجيا CMM',
    shortNameEn: 'Metrology & Testing Lab',
    accentHex: '#a855f7',
    floorColor: '#170b2c',
    bounds: { x: 12, z: -11, w: 14, d: 11 },
    camera: { pos: [12, 11, 1], target: [12, 0, -11] },
    stationIds: ['LAB-METROLOGY-CMM', 'STATION-LAB-SPECTRO', 'STATION-CMM-METROLOGY']
  },
  // 6. MNT-06: Maintenance, Reliability & Industrial IoT Engineering
  {
    id: 'DEPT-MAINTENANCE-IOT',
    code: 'MNT-06',
    number: 6,
    icon: '🛠️',
    nameAr: 'إدارة هندسة الصيانة والاعتمادية ومجسات IoT',
    nameEn: 'Maintenance, Reliability & Industrial IoT Engineering',
    shortNameAr: 'الصيانة والـ IoT',
    shortNameEn: 'Maintenance & Reliability',
    accentHex: '#eab308',
    floorColor: '#1c1606',
    bounds: { x: -6, z: 16.5, w: 19, d: 7 },
    camera: { pos: [-6, 10, 25], target: [-6, 0, 16.5] },
    stationIds: ['STATION-MAINTENANCE-WORKSHOP', 'STATION-IOT-GATEWAY']
  },
  // 7. QAG-07: Quality Assurance, MRB Governance & Continual Improvement
  {
    id: 'DEPT-QA-MRB-GOVERNANCE',
    code: 'QAG-07',
    number: 7,
    icon: '⚖️',
    nameAr: 'إدارة توكيد الجودة والحوكمة ولجنة المواد المعزولة MRB',
    nameEn: 'Quality Assurance, MRB Governance & Continual Improvement',
    shortNameAr: 'توكيد الجودة و MRB',
    shortNameEn: 'QA, MRB & CAPA Governance',
    accentHex: '#f43f5e',
    floorColor: '#240812',
    bounds: { x: 12, z: -0.5, w: 14, d: 8 },
    camera: { pos: [12, 11, 10], target: [12, 0, -0.5] },
    stationIds: ['ROOM-MRB-CAPA']
  },
  // 8. OQC-08: Outgoing Quality Control & Final Packaging Assurance
  {
    id: 'DEPT-FINAL-OQC-PACKAGING',
    code: 'OQC-08',
    number: 8,
    icon: '✅',
    nameAr: 'إدارة الفحص النهائي والتعبئة وضمان الجودة الصادرة (OQC)',
    nameEn: 'Outgoing Quality Control & Final Packaging Assurance (OQC)',
    shortNameAr: 'الفحص النهائي والتعبئة',
    shortNameEn: 'Final OQC & Packaging',
    accentHex: '#059669',
    floorColor: '#051f18',
    bounds: { x: 12, z: 11, w: 14, d: 11 },
    camera: { pos: [12, 11, 22], target: [12, 0, 11] },
    stationIds: ['BENCH-OQC-RELEASE', 'STATION-PACKAGING', 'STATION-OQC-PACKAGING']
  },
  // 9. LOG-09: Shipping, Fleet Logistics & Dispatch Operations
  {
    id: 'DEPT-SHIPPING-LOGISTICS',
    code: 'LOG-09',
    number: 9,
    icon: '🚛',
    nameAr: 'إدارة اللوجستيات والشحن والتوزيع وأسطول النقل',
    nameEn: 'Shipping, Fleet Logistics & Dispatch Operations',
    shortNameAr: 'الشحن والتوزيع',
    shortNameEn: 'Shipping & Logistics',
    accentHex: '#0284c7',
    floorColor: '#07162b',
    bounds: { x: 26, z: 8, w: 12, d: 14 },
    camera: { pos: [26, 12, 21], target: [26, 0, 8] },
    stationIds: ['DOCK-SHIPPING-03', 'STATION-FG-STAGING', 'DOCK-SHIPPING-01']
  },
  // 10. CSQ-10: Customer Experience, Field Quality & RMA Returns
  {
    id: 'DEPT-CUSTOMER-EXPERIENCE',
    code: 'CSQ-10',
    number: 10,
    icon: '🤝',
    nameAr: 'إدارة خدمة العملاء والجودة الخارجية ومرتجعات RMA',
    nameEn: 'Customer Experience, Field Quality & RMA Returns',
    shortNameAr: 'خدمة العملاء والجودة الخارجية',
    shortNameEn: 'Customer Care & RMA',
    accentHex: '#6366f1',
    floorColor: '#0e1033',
    bounds: { x: 26, z: -9, w: 12, d: 14 },
    camera: { pos: [26, 12, 4], target: [26, 0, -9] },
    stationIds: ['TRUCK-CUSTOMER-DELIVERY', 'STATION-RMA-RETURNS']
  }
];

// ============================================================================
// 3D MODELS & MACHINERY FOR DEPARTMENTS
// ============================================================================

// ----------------------------------------------------------------------------
// Worker Avatar
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
// Delivery Truck (Dept 1 Inbound & Dept 9 Outbound)
// ----------------------------------------------------------------------------
function DeliveryTruck({ position, rotation = [0, 0, 0], cabColor = '#0284c7' }: {
  position: [number, number, number];
  rotation?: [number, number, number];
  cabColor?: string;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Cabin */}
      <Box args={[2.0, 2.2, 2.4]} position={[0, 1.4, 3.4]} castShadow>
        <meshStandardMaterial color={cabColor} metalness={0.6} roughness={0.3} />
      </Box>
      {/* Windshield */}
      <Box args={[1.8, 0.9, 0.1]} position={[0, 1.8, 4.61]} castShadow>
        <meshPhysicalMaterial color="#38bdf8" transmission={0.9} roughness={0.1} transparent opacity={0.6} />
      </Box>
      {/* Cargo Trailer */}
      <Box args={[2.2, 3.0, 6.5]} position={[0, 1.8, -1.2]} castShadow receiveShadow>
        <meshStandardMaterial color="#f1f5f9" metalness={0.2} roughness={0.5} />
      </Box>
      {/* Trailer Branding Stripe */}
      <Box args={[2.22, 0.4, 6.52]} position={[0, 1.8, -1.2]}>
        <meshStandardMaterial color={cabColor} emissive={cabColor} emissiveIntensity={0.2} />
      </Box>
      {/* Wheels */}
      {[-2.8, -0.8, 2.6].map((z, idx) => (
        <React.Fragment key={idx}>
          <Cylinder args={[0.45, 0.45, 0.35, 16]} rotation={[0, 0, Math.PI / 2]} position={[1.15, 0.45, z]} castShadow>
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </Cylinder>
          <Cylinder args={[0.45, 0.45, 0.35, 16]} rotation={[0, 0, Math.PI / 2]} position={[-1.15, 0.45, z]} castShadow>
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </Cylinder>
        </React.Fragment>
      ))}
      {/* Headlights */}
      <Box args={[0.3, 0.2, 0.05]} position={[0.7, 0.8, 4.62]}>
        <meshBasicMaterial color="#fef08a" />
      </Box>
      <Box args={[0.3, 0.2, 0.05]} position={[-0.7, 0.8, 4.62]}>
        <meshBasicMaterial color="#fef08a" />
      </Box>
    </group>
  );
}

// ----------------------------------------------------------------------------
// Quarantine Cage (Dept 1 SQA)
// ----------------------------------------------------------------------------
function QuarantineCageModel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Floor Pad */}
      <Box args={[3.2, 0.08, 2.8]} position={[0, 0.04, 0]}>
        <meshStandardMaterial color="#b45309" roughness={0.7} />
      </Box>
      {/* Corner Posts */}
      {[[-1.5, -1.3], [1.5, -1.3], [-1.5, 1.3], [1.5, 1.3]].map(([px, pz], i) => (
        <Cylinder key={i} args={[0.05, 0.05, 2.2, 12]} position={[px, 1.1, pz]} castShadow>
          <meshStandardMaterial color="#f59e0b" metalness={0.8} />
        </Cylinder>
      ))}
      {/* Top Warning Rail */}
      <Box args={[3.2, 0.08, 2.8]} position={[0, 2.15, 0]}>
        <meshStandardMaterial color="#f59e0b" />
      </Box>
      {/* Caution Stripe Barrier */}
      <Box args={[3.22, 0.15, 0.06]} position={[0, 0.2, 1.35]}>
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
      </Box>
      {/* Quarantined Defect Lots */}
      <Box args={[0.9, 0.8, 0.9]} position={[-0.6, 0.45, 0]} castShadow>
        <meshStandardMaterial color="#dc2626" roughness={0.6} />
      </Box>
      <Box args={[0.8, 0.6, 0.8]} position={[0.6, 0.35, 0]} castShadow>
        <meshStandardMaterial color="#dc2626" roughness={0.6} />
      </Box>
      <pointLight position={[0, 1.8, 0]} color="#ef4444" intensity={0.8} distance={3.5} />
    </group>
  );
}

// ----------------------------------------------------------------------------
// Multi-Tier Warehouse Storage Racks (Dept 2 WMS)
// ----------------------------------------------------------------------------
function HighBayWarehouseRacks({ position, rows = 3, levels = 3 }: {
  position: [number, number, number];
  rows?: number;
  levels?: number;
}) {
  const boxColors = ['#f59e0b', '#0284c7', '#10b981', '#ef4444', '#8b5cf6'];

  return (
    <group position={position}>
      {Array.from({ length: rows }).map((_, r) => (
        <group key={`row-${r}`} position={[0, 0, r * 2.6]}>
          {/* Vertical Uprights */}
          {[-2.8, -0.9, 0.9, 2.8].map((x, ux) => (
            <React.Fragment key={ux}>
              <Box args={[0.1, 4.2, 0.1]} position={[x, 2.1, -0.45]} castShadow>
                <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.3} />
              </Box>
              <Box args={[0.1, 4.2, 0.1]} position={[x, 2.1, 0.45]} castShadow>
                <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.3} />
              </Box>
            </React.Fragment>
          ))}

          {/* Shelves & Cargo */}
          {Array.from({ length: levels }).map((_, lvl) => {
            const y = 0.6 + lvl * 1.25;
            return (
              <group key={`lvl-${lvl}`}>
                <Box args={[5.8, 0.08, 0.9]} position={[0, y, 0]} receiveShadow>
                  <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.4} />
                </Box>
                {[-2.0, -0.65, 0.65, 2.0].map((bx, bi) => (
                  <group key={bi} position={[bx, y + 0.08, 0]}>
                    <Box args={[0.9, 0.1, 0.8]} position={[0, 0.05, 0]}>
                      <meshStandardMaterial color="#b45309" roughness={0.8} />
                    </Box>
                    <Box args={[0.8, 0.6, 0.7]} position={[0, 0.4, 0]} castShadow>
                      <meshStandardMaterial color={boxColors[(r + lvl + bi) % boxColors.length]} roughness={0.5} />
                    </Box>
                  </group>
                ))}
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
}

// ----------------------------------------------------------------------------
// Hydraulic Stamping Press (Dept 3 PRD)
// ----------------------------------------------------------------------------
function HydraulicPressModel({ position, isRunning = true }: {
  position: [number, number, number];
  isRunning?: boolean;
}) {
  const ramRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ramRef.current && isRunning) {
      ramRef.current.position.y = 1.1 + Math.sin(clock.elapsedTime * 2.5) * 0.35;
    }
  });

  return (
    <group position={position}>
      {/* Heavy Base */}
      <Box args={[2.6, 0.7, 2.0]} position={[0, 0.35, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.4} />
      </Box>
      {/* Guide Columns */}
      {[[-1.0, -0.7], [1.0, -0.7], [-1.0, 0.7], [1.0, 0.7]].map(([cx, cz], i) => (
        <Cylinder key={i} args={[0.1, 0.1, 3.2, 16]} position={[cx, 1.9, cz]} castShadow>
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
        </Cylinder>
      ))}
      {/* Crown */}
      <Box args={[2.6, 0.9, 2.0]} position={[0, 3.4, 0]} castShadow>
        <meshStandardMaterial color="#0284c7" metalness={0.6} roughness={0.3} />
      </Box>
      {/* Moving Ram */}
      <group ref={ramRef} position={[0, 1.3, 0]}>
        <Cylinder args={[0.3, 0.3, 1.4, 16]} position={[0, 0.7, 0]}>
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
        </Cylinder>
        <Box args={[2.0, 0.35, 1.5]} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
        </Box>
      </group>
      <Box args={[1.6, 0.25, 1.2]} position={[0, 0.75, 0]}>
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
      </Box>
    </group>
  );
}

// ----------------------------------------------------------------------------
// CNC Machining Center (Dept 3 PRD)
// ----------------------------------------------------------------------------
function CNCMachineModel({ position, isRunning = true }: {
  position: [number, number, number];
  isRunning?: boolean;
}) {
  const spindleRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (spindleRef.current && isRunning) {
      spindleRef.current.rotation.y = clock.elapsedTime * 12;
    }
  });

  return (
    <group position={position}>
      {/* Machine Enclosure */}
      <Box args={[2.8, 2.4, 2.2]} position={[0, 1.2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
      </Box>
      {/* Viewing Window */}
      <Box args={[1.6, 1.4, 0.05]} position={[0, 1.3, 1.11]}>
        <meshPhysicalMaterial color="#38bdf8" transmission={0.85} transparent opacity={0.6} roughness={0.1} />
      </Box>
      {/* Interior Chamber */}
      <Box args={[2.2, 1.8, 1.6]} position={[0, 1.2, 0]}>
        <meshStandardMaterial color="#0f172a" side={THREE.BackSide} />
      </Box>
      {/* Spinning Spindle */}
      <group position={[0, 1.6, 0]}>
        <Cylinder ref={spindleRef} args={[0.15, 0.05, 0.5, 16]} position={[0, -0.25, 0]}>
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
        </Cylinder>
      </group>
      {/* Machined Part on Table */}
      <Box args={[0.8, 0.3, 0.6]} position={[0, 0.65, 0]} castShadow>
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </Box>
      {/* Operator HMI Terminal */}
      <Box args={[0.45, 0.6, 0.1]} position={[1.5, 1.4, 0.6]} rotation={[0, -0.3, 0]}>
        <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.5} />
      </Box>
      {/* 3-Color Andon Light Tower */}
      <group position={[-1.2, 2.4, 0.9]}>
        <Cylinder args={[0.02, 0.02, 0.6, 8]} position={[0, 0.3, 0]}>
          <meshStandardMaterial color="#334155" />
        </Cylinder>
        <Cylinder args={[0.06, 0.06, 0.12, 12]} position={[0, 0.66, 0]}>
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={1.2} />
        </Cylinder>
      </group>
      <pointLight position={[0, 1.7, 0]} color="#38bdf8" intensity={0.8} distance={2.5} />
    </group>
  );
}

// ----------------------------------------------------------------------------
// 6-Axis Robotic Arm (Dept 3 PRD)
// ----------------------------------------------------------------------------
function RoboticArmModel({ position, isRunning = true }: {
  position: [number, number, number];
  isRunning?: boolean;
}) {
  const baseJoint = useRef<THREE.Group>(null);
  const elbowJoint = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (isRunning) {
      if (baseJoint.current) {
        baseJoint.current.rotation.y = Math.sin(clock.elapsedTime * 1.2) * 0.8;
      }
      if (elbowJoint.current) {
        elbowJoint.current.rotation.z = Math.sin(clock.elapsedTime * 2.0) * 0.4;
      }
    }
  });

  return (
    <group position={position}>
      {/* Cast Iron Base Pedestal */}
      <Cylinder args={[0.55, 0.65, 0.7, 24]} position={[0, 0.35, 0]} castShadow>
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.4} />
      </Cylinder>
      {/* Turret */}
      <group ref={baseJoint} position={[0, 0.7, 0]}>
        <Cylinder args={[0.42, 0.48, 0.45, 20]} position={[0, 0.22, 0]} castShadow>
          <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.3} />
        </Cylinder>
        {/* Arm */}
        <Box args={[0.26, 1.4, 0.3]} position={[0, 0.85, 0.15]} rotation={[-0.3, 0, 0]} castShadow>
          <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.3} />
        </Box>
        {/* Elbow */}
        <group ref={elbowJoint} position={[0, 1.5, 0.35]}>
          <Sphere args={[0.22, 16, 16]}>
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
          </Sphere>
          <Box args={[0.2, 1.2, 0.2]} position={[0, 0.6, 0.2]} rotation={[0.6, 0, 0]} castShadow>
            <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.3} />
          </Box>
          {/* Torch / Gripper */}
          <Sphere args={[0.09, 12, 12]} position={[0, 1.15, 0.55]}>
            <meshBasicMaterial color="#38bdf8" />
          </Sphere>
          <pointLight position={[0, 1.15, 0.55]} color="#38bdf8" intensity={1.5} distance={3.0} />
        </group>
      </group>
    </group>
  );
}

// ----------------------------------------------------------------------------
// Motorized Conveyor Stream (Dept 3 PRD & Dept 4 IPQC)
// ----------------------------------------------------------------------------
function MotorizedConveyorStream({ start, end, width = 1.4, height = 0.85, isRunning = true }: {
  start: [number, number, number];
  end: [number, number, number];
  width?: number;
  height?: number;
  isRunning?: boolean;
}) {
  const partsRef = useRef<THREE.Group>(null);
  const length = useMemo(() => Math.hypot(end[0] - start[0], end[2] - start[2]), [start, end]);
  const angle = useMemo(() => Math.atan2(end[0] - start[0], end[2] - start[2]), [start, end]);
  const midPos: [number, number, number] = [
    (start[0] + end[0]) / 2,
    height / 2,
    (start[2] + end[2]) / 2
  ];

  useFrame(({ clock }) => {
    if (partsRef.current && isRunning) {
      partsRef.current.children.forEach((child, i) => {
        const offset = (clock.elapsedTime * 0.8 + i * 2.2) % length;
        child.position.z = -length / 2 + offset;
      });
    }
  });

  return (
    <group position={midPos} rotation={[0, angle, 0]}>
      {/* Frame */}
      <Box args={[width, 0.25, length]} position={[0, height / 2 - 0.12, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
      </Box>
      {/* Rollers */}
      <Box args={[width - 0.15, 0.05, length]} position={[0, height / 2 + 0.02, 0]}>
        <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.3} />
      </Box>
      {/* Guide Rails */}
      <Box args={[0.06, 0.18, length]} position={[-width / 2 + 0.03, height / 2 + 0.1, 0]}>
        <meshStandardMaterial color="#f59e0b" />
      </Box>
      <Box args={[0.06, 0.18, length]} position={[width / 2 - 0.03, height / 2 + 0.1, 0]}>
        <meshStandardMaterial color="#f59e0b" />
      </Box>
      {/* Moving Products */}
      <group ref={partsRef} position={[0, height / 2 + 0.2, 0]}>
        {Array.from({ length: Math.max(2, Math.floor(length / 2.2)) }).map((_, pi) => (
          <group key={pi}>
            <Box args={[0.8, 0.08, 0.8]} position={[0, -0.05, 0]}>
              <meshStandardMaterial color="#78350f" roughness={0.8} />
            </Box>
            <Box args={[0.65, 0.28, 0.55]} position={[0, 0.12, 0]} castShadow>
              <meshStandardMaterial color={pi % 2 === 0 ? '#0284c7' : '#10b981'} metalness={0.5} roughness={0.3} />
            </Box>
          </group>
        ))}
      </group>
    </group>
  );
}

// ----------------------------------------------------------------------------
// Quality Testing Lab Chamber & 3D CMM (Dept 5 MET)
// ----------------------------------------------------------------------------
function QualityTestingLabChamber({ position, isTesting = true }: {
  position: [number, number, number];
  isTesting?: boolean;
}) {
  const laserRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (laserRef.current && isTesting) {
      laserRef.current.intensity = 1.0 + Math.sin(clock.elapsedTime * 6) * 0.8;
    }
  });

  return (
    <group position={position}>
      {/* Floor */}
      <Box args={[6.5, 0.2, 5.5]} position={[0, 0.1, 0]} receiveShadow>
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.4} />
      </Box>
      {/* Glass Walls */}
      <Box args={[6.4, 2.8, 0.08]} position={[0, 1.5, -2.7]} castShadow>
        <meshPhysicalMaterial color="#a855f7" transmission={0.9} transparent opacity={0.35} roughness={0.05} />
      </Box>
      <Box args={[0.08, 2.8, 5.4]} position={[-3.2, 1.5, 0]} castShadow>
        <meshPhysicalMaterial color="#a855f7" transmission={0.9} transparent opacity={0.35} roughness={0.05} />
      </Box>
      <Box args={[0.08, 2.8, 5.4]} position={[3.2, 1.5, 0]} castShadow>
        <meshPhysicalMaterial color="#a855f7" transmission={0.9} transparent opacity={0.35} roughness={0.05} />
      </Box>
      {/* Granite CMM Table */}
      <Box args={[2.4, 0.7, 1.8]} position={[0, 0.45, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#1e1b4b" metalness={0.8} roughness={0.2} />
      </Box>
      {/* Bridge Gantry */}
      <Box args={[0.2, 1.8, 0.2]} position={[-1.0, 1.5, 0]}>
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} />
      </Box>
      <Box args={[0.2, 1.8, 0.2]} position={[1.0, 1.5, 0]}>
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} />
      </Box>
      <Box args={[2.2, 0.2, 0.2]} position={[0, 2.3, 0]}>
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} />
      </Box>
      {/* Ruby Touch Probe */}
      <Cylinder args={[0.02, 0.02, 0.6, 12]} position={[0, 1.8, 0]}>
        <meshStandardMaterial color="#334155" />
      </Cylinder>
      <Sphere args={[0.05, 16, 16]} position={[0, 1.5, 0]}>
        <meshBasicMaterial color="#ef4444" />
      </Sphere>
      <pointLight ref={laserRef} position={[0, 1.5, 0]} color="#a855f7" intensity={1.5} distance={4} />
    </group>
  );
}

// ----------------------------------------------------------------------------
// Maintenance & Reliability Workshop (Dept 6 MNT)
// ----------------------------------------------------------------------------
function MaintenanceWorkshopModel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Heavy Duty Tool Bench */}
      <Box args={[3.2, 0.85, 1.3]} position={[0, 0.42, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </Box>
      <Box args={[3.4, 0.08, 1.4]} position={[0, 0.88, 0]}>
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </Box>
      {/* Vise */}
      <Box args={[0.3, 0.25, 0.2]} position={[-1.2, 1.05, 0.35]} castShadow>
        <meshStandardMaterial color="#475569" metalness={0.9} />
      </Box>
      {/* Diagnostic Laptop Terminal */}
      <Box args={[0.45, 0.35, 0.04]} position={[0.2, 1.15, -0.2]} rotation={[-0.2, 0, 0]}>
        <meshStandardMaterial color="#eab308" emissive="#eab308" emissiveIntensity={0.8} />
      </Box>
      {/* Tool Cabinet */}
      <Box args={[1.1, 2.0, 0.6]} position={[1.4, 1.0, -0.6]} castShadow>
        <meshStandardMaterial color="#ca8a04" metalness={0.5} roughness={0.4} />
      </Box>
      {/* IoT Gateway Telemetry Mast */}
      <Cylinder args={[0.04, 0.05, 2.8, 12]} position={[-1.4, 1.4, -0.6]}>
        <meshStandardMaterial color="#64748b" metalness={0.9} />
      </Cylinder>
      <Sphere args={[0.16, 16, 16]} position={[-1.4, 2.8, -0.6]}>
        <meshStandardMaterial color="#eab308" emissive="#eab308" emissiveIntensity={1.8} />
      </Sphere>
      <pointLight position={[-1.4, 2.8, -0.6]} color="#eab308" intensity={1.2} distance={5} />
      {/* Maintenance Engineer */}
      <WorkerAvatar position={[-0.4, 0, 1.2]} color="#854d0e" helmetColor="#eab308" />
    </group>
  );
}

// ----------------------------------------------------------------------------
// MRB War Room & CAPA Governance Center (Dept 7 QAG)
// ----------------------------------------------------------------------------
function MRBWarRoomModel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Conference Floor Pad */}
      <Box args={[4.2, 0.12, 3.2]} position={[0, 0.06, 0]} receiveShadow>
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.6} />
      </Box>
      {/* Center MRB Review Table */}
      <Box args={[2.6, 0.8, 1.6]} position={[0, 0.45, 0]} castShadow>
        <meshStandardMaterial color="#1e1b4b" roughness={0.3} metalness={0.7} />
      </Box>
      <Box args={[2.8, 0.06, 1.8]} position={[0, 0.88, 0]}>
        <meshPhysicalMaterial color="#f43f5e" transmission={0.7} transparent opacity={0.5} roughness={0.1} />
      </Box>
      {/* Holographic CAPA Analytics Column */}
      <Cylinder args={[0.12, 0.12, 1.5, 16]} position={[0, 1.7, 0]}>
        <meshPhysicalMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={1.2} transparent opacity={0.6} />
      </Cylinder>
      <pointLight position={[0, 1.7, 0]} color="#f43f5e" intensity={1.2} distance={4.5} />
      {/* Quality Director */}
      <WorkerAvatar position={[0, 0, 1.3]} color="#be123c" helmetColor="#ffffff" isWorking={false} />
    </group>
  );
}

// ----------------------------------------------------------------------------
// Customer Experience & RMA Returns (Dept 10 CSQ)
// ----------------------------------------------------------------------------
function CustomerRmaModel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* RMA Pallet & Return Inspection Bench */}
      <Box args={[2.8, 0.85, 1.6]} position={[0, 0.45, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#1e1b4b" metalness={0.6} roughness={0.4} />
      </Box>
      {/* Returned Product Samples */}
      <Box args={[0.7, 0.5, 0.6]} position={[-0.7, 1.15, 0]} castShadow>
        <meshStandardMaterial color="#6366f1" />
      </Box>
      <Box args={[0.6, 0.4, 0.6]} position={[0.6, 1.1, 0]} castShadow>
        <meshStandardMaterial color="#a5b4fc" />
      </Box>
      {/* Customer Representative */}
      <WorkerAvatar position={[0, 0, 1.3]} color="#4338ca" helmetColor="#6366f1" />
    </group>
  );
}

// ----------------------------------------------------------------------------
// Autonomous AGV Robot Navigation (Between Departments)
// ----------------------------------------------------------------------------
function AutonomousAGV({ pathRadius = 14, speed = 0.5, isRunning = true }: {
  pathRadius?: number;
  speed?: number;
  isRunning?: boolean;
}) {
  const agvRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (agvRef.current && isRunning) {
      const t = clock.elapsedTime * speed;
      agvRef.current.position.x = Math.sin(t) * pathRadius;
      agvRef.current.position.z = Math.cos(t) * 7.5;
      agvRef.current.rotation.y = t + Math.PI / 2;
    }
  });

  return (
    <group ref={agvRef} position={[0, 0, 0]}>
      {/* AGV Chassis */}
      <Box args={[1.5, 0.45, 1.1]} position={[0, 0.28, 0]} castShadow>
        <meshStandardMaterial color="#f59e0b" metalness={0.4} roughness={0.5} />
      </Box>
      {/* LiDAR Sensor */}
      <Cylinder args={[0.12, 0.12, 0.16, 16]} position={[0.6, 0.58, 0]}>
        <meshStandardMaterial color="#0f172a" />
      </Cylinder>
      {/* Carried Container */}
      <Box args={[1.1, 0.65, 0.9]} position={[-0.1, 0.85, 0]} castShadow>
        <meshStandardMaterial color="#0284c7" roughness={0.3} />
      </Box>
      {/* Safety Flasher */}
      <Sphere args={[0.08, 12, 12]} position={[0.6, 0.72, 0]}>
        <meshBasicMaterial color="#ef4444" />
      </Sphere>
      <pointLight position={[0.6, 0.72, 0]} color="#ef4444" intensity={1.0} distance={2.5} />
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
  statusInfo?: StationStatusInfo;
  isSelected: boolean;
  onSelect: () => void;
  isAr?: boolean;
}) {
  const oee = statusInfo?.realTimeMetrics?.oee ?? station.oeeEstimate ?? 92;
  const status = statusInfo?.status || 'pass';

  const statusColor = 
    status === 'critical' ? '#ef4444' :
    status === 'warning' ? '#f59e0b' : '#10b981';

  return (
    <Html
      position={[0, 2.4, 0]}
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
        <span className={`text-[10px] font-medium max-w-[120px] truncate ${
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
    const coords: Record<string, [number, number, number]> = {
      // Dept 1: SQA-01 (Supply Chain & Inbound)
      'DOCK-RECEIVING-01': [-27, 0, 10],
      'STATION-IQC-INSPECT': [-22, 0, 10],
      'QUARANTINE-CAGE': [-22, 0, 14],

      // Dept 2: WMS-02 (Warehouse & Inventory)
      'WAREHOUSE-RAW-STAGING': [-27, 0, -10],
      'STATION-WH-STORAGE': [-20, 0, -10],

      // Dept 3: PRD-03 (Manufacturing & Assembly)
      'STATION-CNC-MILLING': [-11, 0, -6],
      'STATION-SUB-ASSEMBLY': [-4, 0, -6],
      'STATION-STAMPING-PRESS': [-11, 0, -10],
      'STATION-WELD-ROBOT': [-4, 0, -10],
      'STATION-SMT-ASSEMBLY': [1, 0, -6],

      // Dept 4: IPQC-04 (In-Process Quality & SPC)
      'STATION-TORQUE-BENCH': [-11, 0, 5],
      'STATION-PRESSURE-TEST': [-4, 0, 5],
      'STATION-IPQC-GATE': [1, 0, 5],
      'STATION-AOI-INSPECTOR': [1, 0, 8],

      // Dept 5: MET-05 (Metrology Lab & CMM)
      'LAB-METROLOGY-CMM': [10, 0, -12],
      'STATION-LAB-SPECTRO': [15, 0, -12],
      'STATION-CMM-METROLOGY': [12, 0, -8],

      // Dept 6: MNT-06 (Maintenance & IoT)
      'STATION-MAINTENANCE-WORKSHOP': [-10, 0, 16],
      'STATION-IOT-GATEWAY': [-3, 0, 16],

      // Dept 7: QAG-07 (QA Governance & MRB War Room)
      'ROOM-MRB-CAPA': [12, 0, -1],

      // Dept 8: OQC-08 (Final OQC & Packaging)
      'BENCH-OQC-RELEASE': [9, 0, 10],
      'STATION-PACKAGING': [15, 0, 10],
      'STATION-OQC-PACKAGING': [12, 0, 14],

      // Dept 9: LOG-09 (Shipping & Logistics)
      'STATION-FG-STAGING': [24, 0, 7],
      'DOCK-SHIPPING-03': [29, 0, 7],
      'DOCK-SHIPPING-01': [29, 0, 11],

      // Dept 10: CSQ-10 (Customer Quality & RMA)
      'TRUCK-CUSTOMER-DELIVERY': [26, 0, -9],
      'STATION-RMA-RETURNS': [23, 0, -9],
    };

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
      {/* TOP CONTROLS & 10 REAL DEPARTMENTS NAVIGATOR HUD                     */}
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

        {/* Right: The 10 Real Enterprise Departments Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[calc(100vw-220px)] bg-[#090f1e]/90 backdrop-blur-xl border border-white/10 p-1 rounded-2xl shadow-2xl scrollbar-none pointer-events-auto">
          {/* Overview Button */}
          <button
            onClick={() => {
              setLocalSelectedDeptId(null);
              onSelectDepartment?.('');
              flyToPreset([0, 24, 28], [0, 0, 0]);
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

          {/* 10 Real Platform Departments Chips */}
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
            flyToPreset([0, 24, 28], [0, 0, 0]);
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
          onClick={() => flyToPreset([0, 38, 0.1], [0, 0, 0])}
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
        camera={{ position: [0, 24, 28], fov: 45 }}
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
        <pointLight position={[-25, 12, 10]} color="#f59e0b" intensity={0.6} distance={20} />
        <pointLight position={[12, 12, -10]} color="#a855f7" intensity={0.6} distance={20} />
        <pointLight position={[26, 12, 8]} color="#0284c7" intensity={0.6} distance={20} />

        {/* Silky Smooth Camera OrbitControls */}
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.65}
          maxPolarAngle={Math.PI / 2.3}
          minPolarAngle={Math.PI / 8}
          minDistance={10}
          maxDistance={55}
          autoRotate={autoRotate}
          autoRotateSpeed={0.6}
        />

        <Suspense fallback={null}>
          {/* Master Factory Base Foundation */}
          <Plane args={[76, 46]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
            <meshStandardMaterial color="#070a12" roughness={0.4} metalness={0.4} />
          </Plane>

          {/* ================================================================ */}
          {/* 10 REAL ENTERPRISE DEPARTMENTS - FLOOR DEMARCATION               */}
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
          {[-20, 0, 20].map((x, i) => (
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
          {/* 3D MACHINERY & PHYSICAL PODS IN THE 10 DEPARTMENTS               */}
          {/* ================================================================ */}

          {/* DEPT 1 (SQA-01): Inbound Dock, IQC & Quarantine Cage */}
          <DeliveryTruck position={[-29, 0, 10]} rotation={[0, Math.PI / 2, 0]} cabColor="#f59e0b" />
          <QuarantineCageModel position={[-22, 0, 14]} />

          {/* DEPT 2 (WMS-02): High-Bay Racks */}
          <HighBayWarehouseRacks position={[-22, 0, -10]} rows={3} levels={3} />

          {/* DEPT 3 (PRD-03): Stamping Press, CNC, Robot, Conveyor Line 1 */}
          <HydraulicPressModel position={[-11, 0, -10]} isRunning />
          <CNCMachineModel position={[-11, 0, -6]} isRunning />
          <RoboticArmModel position={[-4, 0, -10]} isRunning />
          <MotorizedConveyorStream start={[-15, 0, -6]} end={[5, 0, -6]} isRunning />
          <WorkerAvatar position={[-11, 0, -4.5]} color="#06b6d4" helmetColor="#f59e0b" />
          <WorkerAvatar position={[-4, 0, -4.5]} color="#06b6d4" helmetColor="#f59e0b" />

          {/* DEPT 4 (IPQC-04): Torque Bench, Pressure Chamber, Conveyor Line 2 */}
          <MotorizedConveyorStream start={[-15, 0, 5]} end={[5, 0, 5]} isRunning />
          <Box args={[2.4, 1.2, 1.4]} position={[-4, 0.6, 5]} castShadow>
            <meshStandardMaterial color="#10b981" metalness={0.6} />
          </Box>
          <WorkerAvatar position={[-11, 0, 6.5]} color="#10b981" helmetColor="#10b981" />
          <WorkerAvatar position={[-4, 0, 6.5]} color="#10b981" helmetColor="#10b981" />

          {/* DEPT 5 (MET-05): Cleanroom Metrology Testing Chamber */}
          <QualityTestingLabChamber position={[12, 0, -11]} isTesting />
          <WorkerAvatar position={[11, 0, -9]} color="#ffffff" helmetColor="#ffffff" />

          {/* DEPT 6 (MNT-06): Maintenance & IoT Engineering Workshop */}
          <MaintenanceWorkshopModel position={[-6, 0, 16.5]} />

          {/* DEPT 7 (QAG-07): QA Governance & MRB War Room */}
          <MRBWarRoomModel position={[12, 0, -0.5]} />

          {/* DEPT 8 (OQC-08): Final OQC Acceptance Bench & Pallet Packing */}
          <Box args={[3.2, 1.2, 1.6]} position={[12, 0.6, 11]} castShadow>
            <meshStandardMaterial color="#059669" metalness={0.6} />
          </Box>
          <WorkerAvatar position={[12, 0, 9.5]} color="#059669" helmetColor="#f59e0b" />

          {/* DEPT 9 (LOG-09): Staging Pallets & Outbound Cargo Truck */}
          {[-1, 1].map((pz, pi) => (
            <group key={pi} position={[24, 0, 7 + pz * 1.5]}>
              <Box args={[1.2, 0.1, 1.2]} position={[0, 0.05, 0]}>
                <meshStandardMaterial color="#b45309" />
              </Box>
              <Box args={[1.1, 1.1, 1.1]} position={[0, 0.65, 0]} castShadow>
                <meshPhysicalMaterial color="#38bdf8" transmission={0.7} transparent opacity={0.6} roughness={0.2} />
              </Box>
            </group>
          ))}
          <DeliveryTruck position={[29, 0, 7]} rotation={[0, -Math.PI / 2, 0]} cabColor="#0284c7" />

          {/* DEPT 10 (CSQ-10): Customer Experience & RMA Dispatch Yard */}
          <CustomerRmaModel position={[26, 0, -9]} />

          {/* Closed-Loop Fiber Beam linking Dept 10 back to Dept 1 (SQA) */}
          <Line
            points={[
              [26, 2.5, -9],
              [26, 6.5, -9],
              [0, 6.5, 0],
              [-25, 6.5, 11],
              [-25, 2.5, 11]
            ]}
            color="#6366f1"
            lineWidth={2}
            dashed
            dashScale={20}
            dashSize={1}
            gapSize={0.5}
          />

          {/* Autonomous AGV Moving Robot */}
          <AutonomousAGV pathRadius={13} speed={0.6} isRunning />

          {/* ================================================================ */}
          {/* FLOATING HOLOGRAPHIC STATION BILLBOARDS                          */}
          {/* ================================================================ */}
          {equipmentList.filter(Boolean).map(eq => {
            const pos = station3DCoords[eq.id] || [0, 0, 0];
            const isSelected = selectedStationId === eq.id;
            const st = stationStatuses?.[eq.id];

            return (
              <group key={eq.id} position={pos}>
                <HolographicStationBillboard
                  station={eq}
                  statusInfo={st}
                  isSelected={isSelected}
                  onSelect={() => onSelectStation(eq.id)}
                  isAr={isAr}
                />
              </group>
            );
          })}
        </Suspense>
      </Canvas>
    </div>
  );
}

export default EnterprisePlant3D;
