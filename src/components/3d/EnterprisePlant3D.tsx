// @ts-nocheck
import React, { useState, useRef, useEffect, useMemo, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  Box,
  Sphere,
  Cylinder,
  Plane,
  Html,
  Grid,
  Billboard,
  GizmoHelper,
  GizmoViewport,
  PointerLockControls
} from '@react-three/drei';
import * as THREE from 'three';
import { 
  Box as BoxIcon, Activity, Eye, Play, Pause, Maximize2, Minimize2, 
  RotateCcw, Camera, Zap, AlertTriangle, CheckCircle2, Layers, Bot, 
  Workflow, Compass, User, Truck, Building2, Flame, Wrench, Shield, Move
} from 'lucide-react';
import { FPSController } from './FPSController';
import type { ScadaEquipment, StationZone } from '../../pages/quality/QualityControlTower';

// ============================================================================
// ENTERPRISE 3D DIGITAL TWIN FACTORY (WebGL Three.js)
// Full End-to-End Plant: Receiving -> Warehouse -> Stamping -> CNC -> Assembly
// -> QA Lab -> Packaging -> Finished Goods -> Outbound Logistics
// ============================================================================

export interface EnterprisePlant3DProps {
  equipmentList: ScadaEquipment[];
  stationStatuses: Record<string, any>;
  selectedStationId: string | null;
  onSelectStation: (id: string) => void;
  isAr?: boolean;
}

// ----------------------------------------------------------------------------
// 3D Worker / Technician Avatar with Safety Helmet & Uniform
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
      {/* Torso / Uniform */}
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
      {/* Animated Arms */}
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
// 3D Delivery & Shipping Truck with Trailer
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
        <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.2} />
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
      <pointLight position={[0.7, 0.8, 5]} color="#fef08a" intensity={0.5} distance={5} />
      <pointLight position={[-0.7, 0.8, 5]} color="#fef08a" intensity={0.5} distance={5} />
    </group>
  );
}

// ----------------------------------------------------------------------------
// 3D Multi-Tier Warehouse Storage Racks with Stacked Pallets
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
          {/* Vertical Steel Uprights */}
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

          {/* Shelves & Stacked Cargo Boxes */}
          {Array.from({ length: levels }).map((_, lvl) => {
            const y = 0.6 + lvl * 1.25;
            return (
              <group key={`lvl-${lvl}`}>
                {/* Steel Beams (Orange) */}
                <Box args={[5.8, 0.08, 0.9]} position={[0, y, 0]} receiveShadow>
                  <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.4} />
                </Box>
                {/* Wooden Pallets & Cargo Boxes */}
                {[-2.0, -0.65, 0.65, 2.0].map((bx, bi) => (
                  <group key={bi} position={[bx, y + 0.08, 0]}>
                    {/* Pallet Base */}
                    <Box args={[0.9, 0.1, 0.8]} position={[0, 0.05, 0]}>
                      <meshStandardMaterial color="#b45309" roughness={0.8} />
                    </Box>
                    {/* Cargo Container Box */}
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
// 3D Hydraulic Stamping Press Machine (Moving Ram)
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
      {/* Heavy Base Bed */}
      <Box args={[2.6, 0.7, 2.0]} position={[0, 0.35, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.4} />
      </Box>
      {/* 4 Heavy Steel Guide Columns */}
      {[[-1.0, -0.7], [1.0, -0.7], [-1.0, 0.7], [1.0, 0.7]].map(([cx, cz], i) => (
        <Cylinder key={i} args={[0.1, 0.1, 3.2, 16]} position={[cx, 1.9, cz]} castShadow>
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
        </Cylinder>
      ))}
      {/* Upper Crown Hydraulic Cylinder */}
      <Box args={[2.6, 0.9, 2.0]} position={[0, 3.4, 0]} castShadow>
        <meshStandardMaterial color="#0284c7" metalness={0.6} roughness={0.3} />
      </Box>
      {/* Moving Press Ram */}
      <group ref={ramRef} position={[0, 1.3, 0]}>
        <Cylinder args={[0.3, 0.3, 1.4, 16]} position={[0, 0.7, 0]}>
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
        </Cylinder>
        <Box args={[2.0, 0.35, 1.5]} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
        </Box>
      </group>
      {/* Die Bed with Stamped Part */}
      <Box args={[1.6, 0.25, 1.2]} position={[0, 0.75, 0]}>
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
      </Box>
      {/* Operator Safety Light Curtain Sensor */}
      <Box args={[0.08, 1.8, 0.08]} position={[-1.25, 1.6, 0.9]}>
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.8} />
      </Box>
      <Box args={[0.08, 1.8, 0.08]} position={[1.25, 1.6, 0.9]}>
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.8} />
      </Box>
    </group>
  );
}

// ----------------------------------------------------------------------------
// 3D CNC Machining Center with Spinning Spindle & Interior Light
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
      {/* Machine Main Body */}
      <Box args={[2.8, 2.4, 2.2]} position={[0, 1.2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
      </Box>
      {/* Front Tempered Glass Window */}
      <Box args={[1.8, 1.4, 0.05]} position={[0, 1.4, 1.12]} castShadow>
        <meshPhysicalMaterial color="#38bdf8" transmission={0.92} roughness={0.08} transparent opacity={0.5} />
      </Box>
      {/* Spinning Spindle Tool inside */}
      <group ref={spindleRef} position={[0, 1.5, 0]}>
        <Cylinder args={[0.18, 0.18, 0.7, 16]} castShadow>
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
        </Cylinder>
        <Cylinder args={[0.04, 0.04, 0.4, 8]} position={[0, -0.4, 0]}>
          <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.2} />
        </Cylinder>
      </group>
      {/* Interior LED Work Light */}
      <pointLight position={[0, 2.0, 0]} color="#38bdf8" intensity={1.2} distance={3.5} />
      {/* CNC Operator Control Console Screen */}
      <group position={[1.55, 1.4, 0.8]} rotation={[0, -Math.PI / 6, 0]}>
        <Box args={[0.1, 0.8, 0.6]} castShadow>
          <meshStandardMaterial color="#1e293b" />
        </Box>
        <Box args={[0.02, 0.65, 0.45]} position={[0.06, 0, 0]}>
          <meshBasicMaterial color="#0284c7" />
        </Box>
      </group>
      {/* Status Signal Patlite Tower */}
      <group position={[-1.2, 2.45, -0.8]}>
        <Cylinder args={[0.02, 0.02, 0.4]} position={[0, 0.2, 0]}>
          <meshStandardMaterial color="#64748b" />
        </Cylinder>
        <Cylinder args={[0.06, 0.06, 0.1]} position={[0, 0.45, 0]}>
          <meshStandardMaterial color={isRunning ? '#22c55e' : '#ef4444'} emissive={isRunning ? '#22c55e' : '#ef4444'} emissiveIntensity={1.2} />
        </Cylinder>
      </group>
    </group>
  );
}

// ----------------------------------------------------------------------------
// 3D Industrial Robotic Arm with Animated Joints
// ----------------------------------------------------------------------------
function RoboticArmModel({ position, isRunning = true }: {
  position: [number, number, number];
  isRunning?: boolean;
}) {
  const baseJoint = useRef<THREE.Group>(null);
  const elbowJoint = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (isRunning) {
      const t = clock.elapsedTime;
      if (baseJoint.current) baseJoint.current.rotation.y = Math.sin(t * 1.4) * 0.7;
      if (elbowJoint.current) elbowJoint.current.rotation.z = Math.cos(t * 1.8) * 0.45;
    }
  });

  return (
    <group position={position}>
      {/* Pedestal Stand */}
      <Cylinder args={[0.55, 0.65, 0.7, 24]} position={[0, 0.35, 0]} castShadow>
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
      </Cylinder>
      {/* Rotating Turret Base */}
      <group ref={baseJoint} position={[0, 0.7, 0]}>
        <Cylinder args={[0.42, 0.48, 0.45, 20]} position={[0, 0.22, 0]} castShadow>
          <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.3} />
        </Cylinder>
        {/* Lower Arm */}
        <Box args={[0.26, 1.4, 0.3]} position={[0, 0.85, 0.15]} rotation={[-0.3, 0, 0]} castShadow>
          <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.3} />
        </Box>
        {/* Elbow Joint */}
        <group ref={elbowJoint} position={[0, 1.5, 0.35]}>
          <Sphere args={[0.22, 16, 16]}>
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
          </Sphere>
          {/* Forearm */}
          <Box args={[0.2, 1.2, 0.2]} position={[0, 0.6, 0.2]} rotation={[0.6, 0, 0]} castShadow>
            <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.3} />
          </Box>
          {/* Gripper Tool / Welding Torch with spark glow */}
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
// 3D Continuous Motorized Conveyor Stream with Moving Products (Parts/Boxes)
// ----------------------------------------------------------------------------
function MotorizedConveyorStream({ start, end, width = 1.4, height = 0.85, isRunning = true }: {
  start: [number, number, number];
  end: [number, number, number];
  width?: number;
  height?: number;
  isRunning?: boolean;
}) {
  const partsRef = useRef<THREE.Group>(null);
  const length = useMemo(() => {
    return Math.hypot(end[0] - start[0], end[2] - start[2]);
  }, [start, end]);

  const angle = useMemo(() => {
    return Math.atan2(end[0] - start[0], end[2] - start[2]);
  }, [start, end]);

  const midPos: [number, number, number] = [
    (start[0] + end[0]) / 2,
    height / 2,
    (start[2] + end[2]) / 2
  ];

  // Animated moving pallets/boxes along the conveyor stream
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
      {/* Conveyor Bed Steel Frame */}
      <Box args={[width, 0.25, length]} position={[0, height / 2 - 0.12, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
      </Box>
      {/* Motorized Rollers Surface */}
      <Box args={[width - 0.15, 0.05, length]} position={[0, height / 2 + 0.02, 0]}>
        <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.3} />
      </Box>
      {/* Side Guide Rails (Safety Yellow) */}
      <Box args={[0.06, 0.18, length]} position={[-width / 2 + 0.03, height / 2 + 0.1, 0]}>
        <meshStandardMaterial color="#f59e0b" />
      </Box>
      <Box args={[0.06, 0.18, length]} position={[width / 2 - 0.03, height / 2 + 0.1, 0]}>
        <meshStandardMaterial color="#f59e0b" />
      </Box>
      {/* Support Legs */}
      {Array.from({ length: Math.max(2, Math.floor(length / 3)) }).map((_, li) => {
        const z = -length / 2 + (li + 0.5) * (length / Math.max(2, Math.floor(length / 3)));
        return (
          <group key={li} position={[0, -height / 4, z]}>
            <Cylinder args={[0.05, 0.05, height, 12]} position={[-width / 2 + 0.1, 0, 0]}>
              <meshStandardMaterial color="#334155" metalness={0.8} />
            </Cylinder>
            <Cylinder args={[0.05, 0.05, height, 12]} position={[width / 2 - 0.1, 0, 0]}>
              <meshStandardMaterial color="#334155" metalness={0.8} />
            </Cylinder>
          </group>
        );
      })}

      {/* Real-time Moving Products on Conveyor */}
      <group ref={partsRef} position={[0, height / 2 + 0.2, 0]}>
        {Array.from({ length: Math.max(2, Math.floor(length / 2.2)) }).map((_, pi) => (
          <group key={pi}>
            {/* Base Pallet */}
            <Box args={[0.8, 0.08, 0.8]} position={[0, -0.05, 0]}>
              <meshStandardMaterial color="#78350f" roughness={0.8} />
            </Box>
            {/* Finished Part / Shoe / AC Unit / Subassembly */}
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
// 3D Quality Inspection & Testing Lab Chamber (Transparent Glass + Laser)
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
      {/* Cleanroom Raised Anti-Static Tile Floor */}
      <Box args={[6.5, 0.2, 5.5]} position={[0, 0.1, 0]} receiveShadow>
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.4} />
      </Box>
      {/* Cleanroom Glass Enclosure Walls */}
      <Box args={[6.4, 2.8, 0.08]} position={[0, 1.5, -2.7]} castShadow>
        <meshPhysicalMaterial color="#38bdf8" transmission={0.9} transparent opacity={0.35} roughness={0.05} />
      </Box>
      <Box args={[0.08, 2.8, 5.4]} position={[-3.2, 1.5, 0]} castShadow>
        <meshPhysicalMaterial color="#38bdf8" transmission={0.9} transparent opacity={0.35} roughness={0.05} />
      </Box>
      <Box args={[0.08, 2.8, 5.4]} position={[3.2, 1.5, 0]} castShadow>
        <meshPhysicalMaterial color="#38bdf8" transmission={0.9} transparent opacity={0.35} roughness={0.05} />
      </Box>
      {/* Cleanroom Air Shower Entry Frame */}
      <Box args={[1.6, 2.4, 0.2]} position={[0, 1.3, 2.7]}>
        <meshStandardMaterial color="#38bdf8" metalness={0.7} />
      </Box>

      {/* Granite CMM Precision Inspection Table */}
      <Box args={[2.2, 0.8, 1.8]} position={[-1.2, 0.5, 0]} castShadow>
        <meshStandardMaterial color="#1e293b" roughness={0.1} metalness={0.9} />
      </Box>
      {/* CMM Gantry Bridge & Touch Probe */}
      <Box args={[0.15, 1.6, 1.8]} position={[-2.2, 1.4, 0]}>
        <meshStandardMaterial color="#e2e8f0" metalness={0.8} />
      </Box>
      <Box args={[2.0, 0.15, 0.2]} position={[-1.2, 2.1, 0]}>
        <meshStandardMaterial color="#e2e8f0" metalness={0.8} />
      </Box>
      <Cylinder args={[0.03, 0.03, 0.7, 12]} position={[-1.2, 1.7, 0]}>
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.8} />
      </Cylinder>

      {/* Nitrogen / Leak Test Environmental Chamber */}
      <group position={[1.5, 0.9, 0]}>
        <Cylinder args={[0.8, 0.8, 1.4, 24]}>
          <meshPhysicalMaterial color="#38bdf8" transmission={0.85} transparent opacity={0.4} />
        </Cylinder>
        <Cylinder args={[0.85, 0.85, 0.15, 24]} position={[0, 0.7, 0]}>
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </Cylinder>
      </group>

      {/* Laser Scanning Inspection Beam */}
      <pointLight ref={laserRef} position={[-1.2, 1.3, 0]} color="#10b981" intensity={1.5} distance={4} />
      {/* QA Holographic Overhead Signboard */}
      <Billboard position={[0, 3.2, 0]}>
        <Html center transform distanceFactor={16}>
          <div className="select-none px-3 py-1 rounded-lg bg-sky-950/90 border border-sky-400/50 text-sky-300 text-[11px] font-mono font-black whitespace-nowrap shadow-xl flex items-center gap-1.5 backdrop-blur-md">
            <span>🔬</span>
            <span>QUALITY ASSURANCE & TESTING LAB</span>
          </div>
        </Html>
      </Billboard>
    </group>
  );
}

// ----------------------------------------------------------------------------
// 3D Autonomous AGV Robotic Transporter (Navigating with Strobe Beacon)
// ----------------------------------------------------------------------------
function AutonomousAGV({ pathRadius = 12, speed = 0.5, isRunning = true }: {
  pathRadius?: number;
  speed?: number;
  isRunning?: boolean;
}) {
  const agvRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (agvRef.current && isRunning) {
      const angle = clock.elapsedTime * speed * 0.25;
      const x = Math.sin(angle) * pathRadius;
      const z = Math.cos(angle) * (pathRadius * 0.6) + 4;
      agvRef.current.position.set(x, 0.2, z);
      agvRef.current.rotation.y = angle + Math.PI / 2;
    }
    if (beaconRef.current) {
      beaconRef.current.intensity = (Math.sin(clock.elapsedTime * 8) + 1) * 0.6;
    }
  });

  return (
    <group ref={agvRef} position={[0, 0.2, 0]}>
      {/* AGV Low Profile Chassis */}
      <Box args={[1.8, 0.4, 1.2]} position={[0, 0.1, 0]} castShadow>
        <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.3} />
      </Box>
      {/* Front Hazard Bumper */}
      <Box args={[0.1, 0.35, 1.15]} position={[0.91, 0.1, 0]}>
        <meshStandardMaterial color="#1e293b" />
      </Box>
      {/* LiDAR Laser Sensor Dome */}
      <Cylinder args={[0.12, 0.14, 0.15, 16]} position={[0.6, 0.38, 0]}>
        <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.5} />
      </Cylinder>
      {/* Orange Flashing Safety Beacon */}
      <Sphere args={[0.08, 12, 12]} position={[-0.7, 0.4, 0]}>
        <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={1.5} />
      </Sphere>
      <pointLight ref={beaconRef} position={[-0.7, 0.5, 0]} color="#ea580c" distance={4} />
      {/* Pallet Payload Carried by AGV */}
      <Box args={[1.2, 0.5, 0.9]} position={[-0.1, 0.55, 0]} castShadow>
        <meshStandardMaterial color="#0284c7" roughness={0.6} />
      </Box>
    </group>
  );
}

// ----------------------------------------------------------------------------
// 3D Floating Holographic Machine Billboard (Station Code, CT, OEE, Status)
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
  if (!station) return null;
  const isAlert = statusInfo?.status === 'fail' || (statusInfo?.openNcrCount && statusInfo.openNcrCount > 0);
  const isWarning = statusInfo?.status === 'warning' || (statusInfo?.defectCount && statusInfo.defectCount > 0);
  const cycleTimeSeconds = station.cycleTimeSec ?? (station as any).cycleTime ?? 45;
  const stationTitle = isAr 
    ? (station.titleAr || (station as any).nameAr || station.titleEn || station.code || 'محطة')
    : (station.titleEn || (station as any).nameEn || station.titleAr || station.code || 'Station');

  return (
    <Html
      position={[0, station.h ? 3.4 : 3.2, 0]}
      center
      distanceFactor={18}
      zIndexRange={[100, 0]}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        className={`select-none cursor-pointer rounded-2xl p-2.5 backdrop-blur-xl border transition-all duration-300 shadow-2xl min-w-[190px] ${
          isSelected 
            ? 'bg-[#0f1b33]/95 border-amber-400 ring-4 ring-amber-400/50 scale-110 shadow-amber-500/40 z-50' 
            : isAlert 
              ? 'bg-[#1e0a14]/90 border-red-500 animate-pulse shadow-red-500/30' 
              : isWarning
                ? 'bg-[#1e150a]/90 border-amber-500 shadow-amber-500/20'
                : 'bg-[#090f1e]/90 border-cyan-500/40 hover:border-cyan-400 hover:scale-105'
        }`}
      >
        {/* Header: Station Code & Status LED */}
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded-md bg-cyan-950 text-cyan-300 font-mono font-black text-[10px] border border-cyan-500/40">
              {station.code}
            </span>
            <span className="text-white font-black text-xs truncate max-w-[100px]">
              {stationTitle}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-2.5 h-2.5 rounded-full ${isAlert ? 'bg-red-500 animate-ping' : isWarning ? 'bg-amber-400' : 'bg-emerald-400 shadow-[0_0_8px_#10b981]'}`} />
          </div>
        </div>

        {/* Core Metrics: Cycle Time (CT) & OEE */}
        <div className="grid grid-cols-2 gap-1.5 my-2">
          {/* Cycle Time (CT sec) - Exactly like in LinkedIn Video! */}
          <div className="p-1.5 rounded-xl bg-black/60 border border-white/5">
            <span className="text-[9px] text-slate-400 block font-mono">
              {isAr ? 'زمن الدورة (CT):' : 'Cycle Time:'}
            </span>
            <span className="text-sm font-black font-mono text-cyan-400">
              {cycleTimeSeconds}s
            </span>
            <span className="text-[8px] text-slate-500 ml-1">/ pc</span>
          </div>

          {/* OEE Efficiency */}
          <div className="p-1.5 rounded-xl bg-black/60 border border-white/5">
            <span className="text-[9px] text-slate-400 block font-mono">
              {isAr ? 'الكفاءة OEE:' : 'OEE Rate:'}
            </span>
            <span className="text-sm font-black font-mono text-emerald-400">
              {station.oeeEstimate || 94.8}%
            </span>
          </div>
        </div>

        {/* Footer: Operator & Zone */}
        <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-white/5">
          <span className="truncate max-w-[100px] text-slate-300">
            👤 {station.activeOperator || (isAr ? 'فني المناوبة' : 'Lead Tech')}
          </span>
          <span className="font-mono text-amber-300">
            {station.line}
          </span>
        </div>
      </div>
    </Html>
  );
}

// ============================================================================
// MAIN 3D FACTORY CANVAS SCENE
// ============================================================================
export function EnterprisePlant3D({
  equipmentList,
  stationStatuses,
  selectedStationId,
  onSelectStation,
  isAr = true
}: EnterprisePlant3DProps) {
  const [cameraMode, setCameraMode] = useState<'orbit' | 'walk'>('orbit');
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [viewpoint, setViewpoint] = useState<string>('overview');
  const controlsRef = useRef<any>(null);

  // Map stations to 3D Coordinates (Spread along factory floor 60m x 35m)
  const station3DCoords = useMemo(() => {
    const coords: Record<string, [number, number, number]> = {
      // Zone 1: Receiving Dock
      'DOCK-RECEIVING-01': [-26, 0, 8],
      'STATION-IQC-INSPECT': [-20, 0, 8],

      // Zone 2: Warehouse Racks
      'STATION-WH-STORAGE': [-20, 0, -8],
      
      // Zone 3: Stamping & Fabrication
      'STATION-STAMPING-PRESS': [-12, 0, 4],
      
      // Zone 4: CNC Machining
      'STATION-CNC-MILLING': [-5, 0, 4],
      
      // Zone 5: Surface Prep & Welding
      'STATION-WELD-ROBOT': [2, 0, 4],
      
      // Zone 6: Assembly Lines
      'STATION-SMT-ASSEMBLY': [-12, 0, -4],
      'STATION-AOI-INSPECTOR': [-5, 0, -4],
      'STATION-FINAL-ASSEMBLY': [2, 0, -4],

      // Zone 7: Quality Lab
      'STATION-LAB-SPECTRO': [10, 0, -8],
      'STATION-CMM-METROLOGY': [16, 0, -8],

      // Zone 8: Packaging
      'STATION-OQC-PACKAGING': [10, 0, 4],

      // Zone 9: Finished Goods Staging
      'STATION-FG-STAGING': [18, 0, 4],

      // Zone 10: Outbound Shipping Dock
      'DOCK-SHIPPING-01': [26, 0, 4],
    };

    // Fallback placement for user-added stations
    equipmentList.forEach((eq, idx) => {
      if (!coords[eq.id]) {
        const row = idx % 2 === 0 ? 5 : -5;
        const x = -22 + (idx * 4);
        coords[eq.id] = [x, 0, row];
      }
    });

    return coords;
  }, [equipmentList]);

  // Fast Camera Preset Navigator
  const flyToPreset = (targetPosition: [number, number, number], lookAt: [number, number, number] = [0, 0, 0]) => {
    if (controlsRef.current) {
      controlsRef.current.target.set(...lookAt);
      controlsRef.current.object.position.set(...targetPosition);
      controlsRef.current.update();
    }
  };

  return (
    <div className="relative w-full h-full bg-[#050811] overflow-hidden select-none">
      {/* 3D Top Control Bar */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-2 flex-wrap">
        {/* Camera Mode Toggle: Orbit vs Walk Mode (WASD) */}
        <div className="flex items-center bg-[#090f1e]/90 backdrop-blur-xl border border-white/10 p-1 rounded-2xl shadow-2xl">
          <button
            onClick={() => setCameraMode('orbit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
              cameraMode === 'orbit'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md ring-2 ring-cyan-300'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{isAr ? '🌐 منظور 360° حر' : '360° Orbit'}</span>
          </button>
          <button
            onClick={() => setCameraMode('walk')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
              cameraMode === 'walk'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-md ring-2 ring-emerald-300 animate-pulse'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Move className="w-4 h-4" />
            <span>{isAr ? '🚶‍♂️ تجول بالشخص الأول (WASD)' : 'Walk Mode (WASD)'}</span>
          </button>
        </div>

        {/* Auto-Tour Rotation */}
        {cameraMode === 'orbit' && (
          <button
            onClick={() => setAutoRotate(prev => !prev)}
            className={`p-2 rounded-xl border transition-all shadow-md ${
              autoRotate
                ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400'
                : 'bg-[#090f1e]/90 text-slate-300 hover:text-white border-white/10'
            }`}
            title={isAr ? 'جولة كاميرا سينمائية تلقائية' : 'Cinematic Auto-Tour'}
          >
            <Play className={`w-4 h-4 ${autoRotate ? 'fill-slate-950' : ''}`} />
          </button>
        )}

        {/* Camera Viewpoint Presets */}
        <div className="hidden md:flex items-center gap-1 bg-[#090f1e]/90 backdrop-blur-xl border border-white/10 p-1 rounded-2xl">
          {[
            { id: 'overview', labelAr: '🏭 المصنع بالكامل', labelEn: 'All Factory', pos: [0, 24, 28], target: [0, 0, 0] },
            { id: 'receiving', labelAr: '📥 عنبر الاستلام', labelEn: 'Receiving', pos: [-24, 8, 18], target: [-22, 0, 8] },
            { id: 'assembly', labelAr: '⚙️ خطوط التجميع', labelEn: 'Assembly', pos: [0, 7, 12], target: [0, 0, 0] },
            { id: 'lab', labelAr: '🔬 مختبر الجودة', labelEn: 'QA Lab', pos: [14, 8, -1], target: [14, 0, -8] },
            { id: 'shipping', labelAr: '🚚 عنبر الشحن', labelEn: 'Shipping', pos: [26, 8, 16], target: [24, 0, 4] },
          ].map(vp => (
            <button
              key={vp.id}
              onClick={() => {
                setViewpoint(vp.id);
                flyToPreset(vp.pos as any, vp.target as any);
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                viewpoint === vp.id
                  ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? vp.labelAr : vp.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Walk Mode Guidance Tooltip Banner */}
      {cameraMode === 'walk' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-black/85 backdrop-blur-md border border-emerald-400/60 px-4 py-2 rounded-2xl text-xs text-emerald-200 flex items-center gap-3 shadow-2xl animate-bounce">
          <span className="font-black">
            {isAr 
              ? '🎮 انقر بالماوس داخل الشاشة للنظر حولك، واستخدم مفاتيح (W, A, S, D أو الأسهم) للتحرك والمشي بين خطوط الإنتاج!' 
              : '🎮 Click inside to lock mouse look. Use (W, A, S, D or Arrows) to walk between production lines!'}
          </span>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-white/20">
            Esc = للخروج
          </span>
        </div>
      )}

      {/* 3D WebGL Canvas */}
      <Canvas
        shadows
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        camera={{ position: [0, 24, 28], fov: 48 }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Background & Industrial Ambient Fog */}
        <color attach="background" args={['#040711']} />
        <fog attach="fog" args={['#040711', 35, 95]} />

        <Suspense fallback={null}>
          {/* Camera Control Modes */}
        {cameraMode === 'orbit' ? (
          <OrbitControls
            ref={controlsRef}
            autoRotate={autoRotate}
            autoRotateSpeed={0.8}
            enableDamping
            dampingFactor={0.06}
            minDistance={6}
            maxDistance={70}
            maxPolarAngle={Math.PI / 2 - 0.05} // Do not go below floor
          />
        ) : (
          <>
            <PointerLockControls />
            <FPSController />
          </>
        )}

        {/* 3D Orientation Compass Gizmo */}
        {cameraMode === 'orbit' && (
          <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewport axisColors={['#ef4444', '#10b981', '#0284c7']} labelColor="#ffffff" />
          </GizmoHelper>
        )}

        {/* Studio Industrial Lighting Rig */}
        <ambientLight intensity={0.65} />
        <directionalLight
          position={[15, 30, 20]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={80}
          shadow-camera-left={-35}
          shadow-camera-right={35}
          shadow-camera-top={35}
          shadow-camera-bottom={-35}
        />
        <pointLight position={[-15, 12, 0]} intensity={0.8} color="#0284c7" distance={30} />
        <pointLight position={[15, 12, 0]} intensity={0.8} color="#10b981" distance={30} />
        <pointLight position={[0, 14, 0]} intensity={0.9} color="#f59e0b" distance={35} />

        {/* ================================================================ */}
        {/* 3D FACTORY FLOOR & ARCHITECTURE                                  */}
        {/* ================================================================ */}
        {/* Heavy Industrial Dark Epoxy Floor */}
        <Plane args={[72, 44]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <meshStandardMaterial color="#090e1a" roughness={0.3} metalness={0.5} />
        </Plane>

        {/* Safety Walkway Markings (Yellow Aisles) */}
        <Plane args={[68, 2.2]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <meshBasicMaterial color="#1e293b" />
        </Plane>
        <Plane args={[68, 0.1]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 1.1]}>
          <meshBasicMaterial color="#f59e0b" />
        </Plane>
        <Plane args={[68, 0.1]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -1.1]}>
          <meshBasicMaterial color="#f59e0b" />
        </Plane>

        {/* Transverse Crosswalks */}
        {[-20, 0, 20].map((x, i) => (
          <Plane key={i} args={[2.2, 36]} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, 0]}>
            <meshBasicMaterial color="#1e293b" />
          </Plane>
        ))}

        {/* Factory Back Wall with Clerestory Windows */}
        <Box args={[72, 8, 0.4]} position={[0, 4, -22]} receiveShadow>
          <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.7} />
        </Box>
        {/* Overhead Steel Roof Trusses */}
        {[-24, -12, 0, 12, 24].map((tx, ti) => (
          <group key={ti} position={[tx, 7.8, 0]}>
            <Box args={[0.3, 0.3, 44]}>
              <meshStandardMaterial color="#334155" metalness={0.9} />
            </Box>
            <Box args={[0.3, 0.3, 44]} position={[0, -0.6, 0]}>
              <meshStandardMaterial color="#334155" metalness={0.9} />
            </Box>
          </group>
        ))}

        {/* ================================================================ */}
        {/* 10 DEPARTMENTS: 3D MODELS & MACHINERY                            */}
        {/* ================================================================ */}

        {/* 1. Inbound Delivery Truck at Dock A */}
        <DeliveryTruck position={[-29, 0, 8]} rotation={[0, Math.PI / 2, 0]} cabColor="#0284c7" />

        {/* 2. Raw Materials High-Bay Warehouse Racking */}
        <HighBayWarehouseRacks position={[-20, 0, -10]} rows={3} levels={3} />

        {/* 3. Stamping & Press Department */}
        <HydraulicPressModel position={[-12, 0, 4]} isRunning />
        <WorkerAvatar position={[-12, 0, 2.6]} color="#0284c7" helmetColor="#f59e0b" />

        {/* 4. CNC Machining Cell */}
        <CNCMachineModel position={[-5, 0, 4]} isRunning />
        <WorkerAvatar position={[-5, 0, 2.6]} color="#0284c7" helmetColor="#f59e0b" />

        {/* 5. Robotic Welding & Assembly */}
        <RoboticArmModel position={[2, 0, 4]} isRunning />

        {/* 6. Main Motorized Conveyor Stream Line 1 */}
        <MotorizedConveyorStream start={[-15, 0, 4]} end={[8, 0, 4]} isRunning />

        {/* 6. Assembly Line 2 (Electronic SMT / Final Assembly) */}
        <MotorizedConveyorStream start={[-15, 0, -4]} end={[6, 0, -4]} isRunning />
        <WorkerAvatar position={[-12, 0, -2.6]} color="#0284c7" helmetColor="#f59e0b" />
        <WorkerAvatar position={[-5, 0, -2.6]} color="#0284c7" helmetColor="#f59e0b" />
        <WorkerAvatar position={[2, 0, -2.6]} color="#0284c7" helmetColor="#f59e0b" />

        {/* 7. Quality Assurance Lab & Testing Chamber */}
        <QualityTestingLabChamber position={[14, 0, -8]} isTesting />
        <WorkerAvatar position={[13, 0, -6.5]} color="#ffffff" helmetColor="#ffffff" />

        {/* 8. Packaging & Boxing Line */}
        <Box args={[3.2, 1.2, 1.6]} position={[10, 0.6, 4]} castShadow>
          <meshStandardMaterial color="#0284c7" metalness={0.6} />
        </Box>
        <WorkerAvatar position={[10, 0, 2.6]} color="#0284c7" helmetColor="#f59e0b" />

        {/* 9. Finished Goods Staging Pallets */}
        {[-1, 1].map((pz, pi) => (
          <group key={pi} position={[18, 0, 4 + pz * 1.5]}>
            <Box args={[1.2, 0.1, 1.2]} position={[0, 0.05, 0]}>
              <meshStandardMaterial color="#b45309" />
            </Box>
            <Box args={[1.1, 1.1, 1.1]} position={[0, 0.65, 0]} castShadow>
              <meshPhysicalMaterial color="#38bdf8" transmission={0.7} transparent opacity={0.6} roughness={0.2} />
            </Box>
          </group>
        ))}

        {/* 10. Autonomous Moving AGV Robot */}
        <AutonomousAGV pathRadius={13} speed={0.6} isRunning />

        {/* 11. Outbound Shipping Truck at Dock E */}
        <DeliveryTruck position={[29, 0, 4]} rotation={[0, -Math.PI / 2, 0]} cabColor="#10b981" />

        {/* ================================================================ */}
        {/* FLOATING 3D HOLOGRAPHIC STATION BILLBOARDS                       */}
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
