import { useMemo, useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import {
  OrbitControls,
  Box,
  Sphere,
  Cylinder,
  Plane,
  Html,
  Grid,
  Line,
  Text,
  Billboard,
  GizmoHelper,
  GizmoViewport,
} from '@react-three/drei';
import * as THREE from 'three';
import {
  Box as BoxIcon,
  Activity,
  Thermometer,
  Wind,
  Zap,
  AlertTriangle,
  Eye,
  EyeOff,
  Play,
  Pause,
  Factory,
  BarChart3,
  X,
  Clock,
  Wrench,
  Package,
  Gauge,
  Cpu,
  User,
  MapPin,
  Copy,
  Trash2
} from 'lucide-react';
import { gsap } from 'gsap';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

// =====================================================================================
// AIR CONDITIONER MANUFACTURING DIGITAL TWIN
// HVAC Assembly Factory with Two Production Lines
// =====================================================================================

type StationStatus = 'running' | 'waiting' | 'error' | 'maintenance';

type AssemblyStation = {
  id: string;
  name: string;
  line: 'indoor' | 'outdoor';
  position: [number, number, number];
  status: StationStatus;
  operator: string;
  cycleTime: number; // seconds
  productionCount: number;
  targetCycleTime: number;
  temperature: number;
  vibration: number;
  powerConsumption: number;
  efficiency: number;
  // Editable dimensions for dynamic layout
  width?: number;
  depth?: number;
  height?: number;
};

type ACUnit = {
  id: string;
  line: 'indoor' | 'outdoor';
  stage: number;
  progress: number;
  status: 'empty' | 'partial' | 'assembled' | 'testing' | 'packaged';
  position: [number, number, number];
  temperature: number;
  pressure: number;
};

type Forklift = {
  id: string;
  position: [number, number, number];
  target: [number, number, number];
  carrying: boolean;
  palletType: 'parts' | 'finished' | null;
  status: 'idle' | 'moving' | 'loading' | 'unloading';
};

type AlertEvent = {
  id: string;
  stationId: string;
  line: 'indoor' | 'outdoor';
  type: 'warning' | 'critical' | 'info';
  message: string;
  timestamp: number;
  time: string;
};

// Station definitions for Indoor Unit Line
const indoorStations: Omit<AssemblyStation, 'position'>[] = [];

// Station definitions for Outdoor Unit Line
const outdoorStations: Omit<AssemblyStation, 'position'>[] = [];

// Layout positions
const indoorPositions: [number, number, number][] = [
  [-15, 0, -8], [-12, 0, -8], [-9, 0, -8], [-6, 0, -8],
  [-3, 0, -8], [0, 0, -8], [3, 0, -8], [6, 0, -8], [9, 0, -8]
];

const outdoorPositions: [number, number, number][] = [
  [-15, 0, 8], [-12, 0, 8], [-9, 0, 8], [-6, 0, 8],
  [-3, 0, 8], [0, 0, 8], [3, 0, 8], [6, 0, 8], [9, 0, 8]
];

const DEFAULT_STATION_DIMENSIONS = {
  width: 3,
  depth: 2.5,
  height: 2.2
};

function statusToColor(status: StationStatus) {
  switch (status) {
    case 'running': return '#00C853';
    case 'waiting': return '#FFD600';
    case 'error': return '#FF1744';
    case 'maintenance': return '#FF9100';
    default: return '#9E9E9E';
  }
}

function statusToUIClass(status: StationStatus) {
  switch (status) {
    case 'running': return 'bg-green-500';
    case 'waiting': return 'bg-yellow-500';
    case 'error': return 'bg-red-500';
    case 'maintenance': return 'bg-orange-500';
    default: return 'bg-gray-500';
  }
}

// =====================================================================================
// 3D COMPONENTS
// =====================================================================================

function FactoryFloor() {
  return (
    <group>
      {/* Main Floor - simplified */}
      <Plane args={[50, 40]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} metalness={0.2} />
      </Plane>
      
      {/* Simple Grid */}
      <Grid
        position={[0, 0, 0]}
        args={[50, 40]}
        cellSize={5}
        cellThickness={0.5}
        cellColor="#2a2a4e"
        fadeDistance={25}
        fadeStrength={1}
        infiniteGrid={false}
      />
    </group>
  );
}

function FactoryWalls() {
  return (
    <group>
      {/* Back Wall */}
      <Box args={[50, 12, 0.5]} position={[0, 6, -20]}>
        <meshStandardMaterial color="#2d3436" roughness={0.9} />
      </Box>
      
      {/* Side Walls */}
      <Box args={[0.5, 12, 40]} position={[-25, 6, 0]}>
        <meshStandardMaterial color="#2d3436" roughness={0.9} />
      </Box>
      <Box args={[0.5, 12, 40]} position={[25, 6, 0]}>
        <meshStandardMaterial color="#2d3436" roughness={0.9} />
      </Box>
      
      {/* Structural Columns */}
      {[-15, -5, 5, 15].map((x, i) => (
        <group key={i}>
          <Box args={[1, 12, 1]} position={[x, 6, -19]}>
            <meshStandardMaterial color="#636e72" metalness={0.6} roughness={0.4} />
          </Box>
          <Box args={[1, 12, 1]} position={[x, 6, 19]}>
            <meshStandardMaterial color="#636e72" metalness={0.6} roughness={0.4} />
          </Box>
        </group>
      ))}
      
      {/* Ceiling Lights */}
      {Array.from({ length: 5 }).map((_, row) => (
        Array.from({ length: 4 }).map((_, col) => (
          <group key={`light-${row}-${col}`} position={[-15 + col * 10, 11, -15 + row * 10]}>
            <Box args={[3, 0.2, 1]}>
              <meshStandardMaterial color="#74b9ff" emissive="#0984e3" emissiveIntensity={0.5} />
            </Box>
            <pointLight position={[0, -1, 0]} intensity={0.8} distance={15} color="#dfe6e9" />
          </group>
        ))
      ))}
      
      {/* Ventilation Ducts */}
      <Box args={[40, 1.5, 1.5]} position={[0, 10, -15]}>
        <meshStandardMaterial color="#b2bec3" metalness={0.7} roughness={0.3} />
      </Box>
      <Box args={[40, 1.5, 1.5]} position={[0, 10, 15]}>
        <meshStandardMaterial color="#b2bec3" metalness={0.7} roughness={0.3} />
      </Box>
      
      {/* Pipe runs */}
      {[-18, -6, 6, 18].map((z, i) => (
        <Cylinder key={i} args={[0.15, 0.15, 48]} rotation={[0, 0, Math.PI / 2]} position={[0, 8.5, z]}>
          <meshStandardMaterial color="#e17055" metalness={0.5} roughness={0.4} />
        </Cylinder>
      ))}
    </group>
  );
}

function Conveyor({ position, length = 3 }: { position: [number, number, number]; length?: number }) {
  return (
    <group position={position}>
      {/* Conveyor Frame */}
      <Box args={[length, 0.8, 1.5]} position={[0, 0.4, 0]}>
        <meshStandardMaterial color="#2d3436" metalness={0.6} />
      </Box>
      
      {/* Static Belt - No animation */}
      <Box args={[length - 0.2, 0.05, 1.3]} position={[0, 0.83, 0]}>
        <meshStandardMaterial color="#2d3436" roughness={0.9} />
      </Box>
      
      {/* Rollers */}
      {Array.from({ length: Math.floor(length) + 1 }).map((_, i) => (
        <Cylinder
          key={i}
          args={[0.15, 0.15, 1.4]}
          rotation={[Math.PI / 2, 0, 0]}
          position={[-length/2 + i, 0.5, 0]}
        >
          <meshStandardMaterial color="#636e72" metalness={0.8} />
        </Cylinder>
      ))}
    </group>
  );
}

function WorkTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Table Top */}
      <Box args={[2, 0.1, 1.2]} position={[0, 0.9, 0]}>
        <meshStandardMaterial color="#dfe6e9" metalness={0.3} />
      </Box>
      
      {/* Legs */}
      <Box args={[0.08, 0.9, 0.08]} position={[-0.9, 0.45, -0.5]}>
        <meshStandardMaterial color="#636e72" metalness={0.6} />
      </Box>
      <Box args={[0.08, 0.9, 0.08]} position={[0.9, 0.45, -0.5]}>
        <meshStandardMaterial color="#636e72" metalness={0.6} />
      </Box>
      <Box args={[0.08, 0.9, 0.08]} position={[-0.9, 0.45, 0.5]}>
        <meshStandardMaterial color="#636e72" metalness={0.6} />
      </Box>
      <Box args={[0.08, 0.9, 0.08]} position={[0.9, 0.45, 0.5]}>
        <meshStandardMaterial color="#636e72" metalness={0.6} />
      </Box>
      
      {/* Tools on table */}
      <Box args={[0.3, 0.05, 0.1]} position={[-0.5, 0.95, 0.3]}>
        <meshStandardMaterial color="#e17055" />
      </Box>
      <Cylinder args={[0.05, 0.05, 0.25]} position={[-0.2, 1.02, -0.2]}>
        <meshStandardMaterial color="#00b894" />
      </Cylinder>
    </group>
  );
}

function Technician({ position, isWorking: _isWorking, animationOffset: _animationOffset = 0 }: { position: [number, number, number]; isWorking: boolean; animationOffset?: number }) {
  // Static technician - no animations for performance
  return (
    <group position={position}>
      {/* Body */}
      <Box args={[0.4, 0.6, 0.25]} position={[0, 0.9, 0]}>
        <meshStandardMaterial color="#0984e3" />
      </Box>
      
      {/* Head */}
      <Sphere args={[0.18]} position={[0, 1.45, 0]}>
        <meshStandardMaterial color="#fdcb6e" />
      </Sphere>
      
      {/* Helmet */}
      <Cylinder args={[0.2, 0.22, 0.12]} position={[0, 1.58, 0]}>
        <meshStandardMaterial color="#FFD600" />
      </Cylinder>
      
      {/* Arms - Static */}
      <Box args={[0.12, 0.45, 0.12]} position={[0.25, 0.9, 0]}>
        <meshStandardMaterial color="#0984e3" />
      </Box>
      <Box args={[0.12, 0.45, 0.12]} position={[-0.25, 0.9, 0]}>
        <meshStandardMaterial color="#0984e3" />
      </Box>
      
      {/* Legs */}
      <Box args={[0.15, 0.5, 0.15]} position={[-0.12, 0.45, 0]}>
        <meshStandardMaterial color="#2d3436" />
      </Box>
      <Box args={[0.15, 0.5, 0.15]} position={[0.12, 0.45, 0]}>
        <meshStandardMaterial color="#2d3436" />
      </Box>
    </group>
  );
}

function ACUnit({ position, type, stage, isMoving: _isMoving }: { position: [number, number, number]; type: 'indoor' | 'outdoor'; stage: number; isMoving: boolean }) {
  // Static AC Unit - no animations for performance
  if (type === 'indoor') {
    return (
      <group position={position}>
        <Box args={[1.2, 0.3, 0.4]} position={[0, 0, 0]}>
          <meshStandardMaterial color={stage >= 7 ? '#ffffff' : '#b2bec3'} />
        </Box>
        
        {stage >= 7 && (
          <Box args={[1.15, 0.25, 0.02]} position={[0, 0, 0.21]}>
            <meshStandardMaterial color="#ffffff" />
          </Box>
        )}
        
        <Box args={[0.8, 0.05, 0.02]} position={[0, -0.08, 0.21]}>
          <meshStandardMaterial color="#2d3436" />
        </Box>
        
        <Sphere args={[0.03]} position={[0.5, 0.1, 0.21]}>
          <meshStandardMaterial color="#00b894" emissive="#00b894" emissiveIntensity={0.8} />
        </Sphere>
      </group>
    );
  }
  
  return (
    <group position={position}>
      <Box args={[1.4, 1, 0.6]} position={[0, 0.5, 0]}>
        <meshStandardMaterial color={stage >= 8 ? '#ffffff' : '#636e72'} metalness={0.3} />
      </Box>
      
      <Box args={[1.42, 1.02, 0.62]} position={[0, 0.5, 0]}>
        <meshStandardMaterial color="#2d3436" wireframe />
      </Box>
      
      {stage >= 4 && (
        <group position={[0, 1.02, 0]}>
          <Cylinder args={[0.55, 0.55, 0.05]}>
            <meshStandardMaterial color="#2d3436" />
          </Cylinder>
          {Array.from({ length: 5 }).map((_, i) => (
            <Box
              key={i}
              args={[0.5, 0.02, 0.08]}
              rotation={[0, (i * Math.PI * 2) / 5, 0]}
            >
              <meshStandardMaterial color="#b2bec3" />
            </Box>
          ))}
        </group>
      )}
    </group>
  );
}

function StatusBeacon({ status, position }: { status: StationStatus; position: [number, number, number] }) {
  const color = statusToColor(status);
  
  return (
    <group position={position}>
      <Sphere args={[0.15]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </Sphere>
      <pointLight color={color} intensity={0.8} distance={5} />
    </group>
  );
}

function ReferenceMarker({
  position,
  selected,
  onPick,
}: {
  position: [number, number, number];
  selected: boolean;
  onPick: () => void;
}) {
  return (
    <group position={position}>
      <mesh
        onPointerDown={(e) => {
          e.stopPropagation();
          onPick();
        }}
      >
        <sphereGeometry args={[0.12, 20, 20]} />
        <meshStandardMaterial
          color={selected ? '#ffffff' : '#00A3E0'}
          emissive={selected ? '#ffffff' : '#00A3E0'}
          emissiveIntensity={selected ? 1.2 : 0.85}
          roughness={0.35}
          metalness={0.1}
          transparent
          opacity={0.95}
        />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.26, 32]} />
        <meshBasicMaterial color="#00A3E0" transparent opacity={selected ? 0.7 : 0.35} />
      </mesh>
      <pointLight color="#00A3E0" intensity={selected ? 1.2 : 0.6} distance={4.5} />
    </group>
  );
}

function StationDataOverlay({ station, position }: { station: AssemblyStation; position: [number, number, number] }) {
  const efficiencyColor = station.efficiency >= 90 ? 'text-green-400' : station.efficiency >= 75 ? 'text-yellow-400' : 'text-red-400';
  
  return (
    <Html position={[position[0], position[1] + 3.5, position[2]]} center distanceFactor={10} transform>
      <div className="select-none w-[200px] rounded-lg border border-white/10 bg-[#0a0f1c]/90 backdrop-blur-md p-3 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-white">{station.id}</span>
          <div className={`w-2 h-2 rounded-full ${statusToUIClass(station.status)} animate-pulse`} />
        </div>
        
        <div className="text-[10px] text-gray-300 mb-1">{station.name}</div>
        
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <span className="text-gray-500">Operator</span>
            <div className="text-white">{station.operator}</div>
          </div>
          <div>
            <span className="text-gray-500">Cycle</span>
            <div className="text-white">{station.cycleTime}s</div>
          </div>
          <div>
            <span className="text-gray-500">Count</span>
            <div className="text-white">{station.productionCount}</div>
          </div>
          <div>
            <span className="text-gray-500">Efficiency</span>
            <div className={efficiencyColor}>{station.efficiency}%</div>
          </div>
        </div>
        
        {/* Mini status bar */}
        <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${station.efficiency >= 90 ? 'bg-green-500' : station.efficiency >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${station.efficiency}%` }}
          />
        </div>
      </div>
    </Html>
  );
}

function PressureGauge({ position, pressure }: { position: [number, number, number]; pressure: number }) {
  // Static gauge - calculate angle once
  const angle = ((pressure - 0) / 20) * Math.PI - Math.PI / 2;
  
  return (
    <group position={position} rotation={[0, 0, -angle]}>
      <Cylinder args={[0.3, 0.3, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#dfe6e9" />
      </Cylinder>
      <Box args={[0.02, 0.25, 0.02]} position={[0, 0.05, 0]}>
        <meshStandardMaterial color="#e17055" />
      </Box>
      <Cylinder args={[0.05, 0.05, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#2d3436" />
      </Cylinder>
    </group>
  );
}

function Forklift({ forklift }: { forklift: Forklift }) {
  // Static forklift at position - no animation for performance
  return (
    <group position={forklift.position}>
      <Box args={[1.5, 1, 0.8]} position={[0, 0.5, 0]}>
        <meshStandardMaterial color="#e17055" />
      </Box>
      <Box args={[0.8, 1.2, 0.7]} position={[-0.2, 1.1, 0]}>
        <meshStandardMaterial color="#2d3436" />
      </Box>
    </group>
  );
}

function StorageArea({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Storage racks */}
      {Array.from({ length: 3 }).map((_, row) => (
        <group key={row} position={[0, 0, row * 2.5 - 2.5]}>
          <Box args={[4, 3, 0.2]} position={[0, 1.5, 0]}>
            <meshStandardMaterial color="#636e72" />
          </Box>
          
          {/* Shelves with boxes */}
          {Array.from({ length: 4 }).map((_, shelf) => (
            <group key={shelf} position={[0, 0.5 + shelf * 0.7, 0]}>
              <Box args={[3.8, 0.05, 0.6]}>
                <meshStandardMaterial color="#74b9ff" />
              </Box>
              
              {/* Random boxes */}
              {Array.from({ length: 4 }).map((_, box) => (
                <Box
                  key={box}
                  args={[0.6, 0.4, 0.4]}
                  position={[-1.2 + box * 0.8, 0.25, 0]}
                >
                  <meshStandardMaterial color={['#00b894', '#0984e3', '#fdcb6e', '#e17055'][box]} />
                </Box>
              ))}
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

// =====================================================================================
// TESTING ZONE COMPONENTS
// =====================================================================================

type TestStatus = 'idle' | 'testing' | 'pass' | 'fail';

type TestRoomProps = {
  position: [number, number, number];
  status: TestStatus;
  testProgress: number;
  testResult?: 'PASS' | 'FAIL';
};

function LeakTestRoom({ position, status, testProgress, testResult }: TestRoomProps) {
  // Static - no animation for performance
  const angle = -Math.PI / 2 + (testProgress / 100) * Math.PI;
  
  return (
    <group position={position}>
      {/* Room floor */}
      <Plane args={[8, 6]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <meshStandardMaterial color="#2d3436" />
      </Plane>
      
      {/* Glass chamber walls */}
      <Box args={[7, 3, 0.1]} position={[0, 1.5, -2.9]}>
        <meshPhysicalMaterial color="#74b9ff" transparent opacity={0.3} transmission={0.9} roughness={0} />
      </Box>
      <Box args={[0.1, 3, 5.8]} position={[-3.4, 1.5, 0]}>
        <meshPhysicalMaterial color="#74b9ff" transparent opacity={0.3} transmission={0.9} />
      </Box>
      <Box args={[0.1, 3, 5.8]} position={[3.4, 1.5, 0]}>
        <meshPhysicalMaterial color="#74b9ff" transparent opacity={0.3} transmission={0.9} />
      </Box>
      
      {/* AC Unit inside chamber */}
      <Box args={[1.2, 0.8, 0.6]} position={[0, 0.5, 0]}>
        <meshStandardMaterial color="#dfe6e9" />
      </Box>
      
      {/* Nitrogen testing machine */}
      <group position={[-2, 0, 1]}>
        <Box args={[1, 1.5, 0.8]}>
          <meshStandardMaterial color="#636e72" metalness={0.6} />
        </Box>
        <Cylinder args={[0.05, 0.05, 2]} rotation={[0, 0, Math.PI / 2]} position={[0.8, 0.5, -0.5]}>
          <meshStandardMaterial color="#b2bec3" metalness={0.8} />
        </Cylinder>
        <Box args={[0.8, 0.6, 0.1]} position={[0, 0.3, 0.41]}>
          <meshStandardMaterial color="#2d3436" />
        </Box>
        <Box args={[0.4, 0.2, 0.02]} position={[0, 0.5, 0.42]}>
          <meshStandardMaterial color="#00b894" emissive="#00b894" emissiveIntensity={0.5} />
        </Box>
      </group>
      
      {/* Pressure gauge - static */}
      <group position={[2, 1.5, -1]} rotation={[0, 0, -angle]}>
        <Cylinder args={[0.4, 0.4, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#dfe6e9" />
        </Cylinder>
        <Box args={[0.02, 0.3, 0.02]} position={[0, 0.1, 0]}>
          <meshStandardMaterial color="#e17055" />
        </Box>
        <Cylinder args={[0.06, 0.06, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#2d3436" />
        </Cylinder>
      </group>
      
      {/* PASS/FAIL indicator */}
      <group position={[2.5, 2, -2]}>
        <Box args={[1, 0.4, 0.1]}>
          <meshStandardMaterial 
            color={status === 'pass' ? '#00C853' : status === 'fail' ? '#FF1744' : '#636e72'} 
            emissive={status === 'pass' ? '#00C853' : status === 'fail' ? '#FF1744' : '#000000'}
            emissiveIntensity={status !== 'idle' ? 0.8 : 0}
          />
        </Box>
        <Sphere args={[0.15]} position={[0, 0.4, 0]}>
          <meshStandardMaterial 
            color={status === 'pass' ? '#00C853' : status === 'fail' ? '#FF1744' : '#FFD600'}
            emissive={status === 'pass' ? '#00C853' : status === 'fail' ? '#FF1744' : '#FFD600'}
            emissiveIntensity={status !== 'idle' ? 1 : 0.3}
          />
        </Sphere>
      </group>
      
      {/* Warning labels */}
      <Billboard position={[0, 2.5, 2.8]}>
        <Text fontSize={0.3} color="#FFD600" anchorX="center">
          ⚠ LEAK TEST
        </Text>
      </Billboard>
      
      {/* Data overlay */}
      <Html position={[0, 4, 0]} center distanceFactor={10}>
        <div className="select-none rounded-lg border border-white/10 bg-[#0a0f1c]/90 backdrop-blur-md p-2 shadow-2xl">
          <div className="text-[10px] text-gray-400">Leak Test Room</div>
          <div className={`text-sm font-bold ${status === 'pass' ? 'text-green-400' : status === 'fail' ? 'text-red-400' : 'text-yellow-400'}`}>
            {status === 'idle' ? 'IDLE' : status === 'testing' ? `TESTING ${testProgress.toFixed(0)}%` : testResult}
          </div>
          <div className="text-[10px] text-gray-500">Pressure: {(testProgress * 0.5).toFixed(1)} bar</div>
        </div>
      </Html>
    </group>
  );
}

function VacuumChamber({ position, status, testProgress }: TestRoomProps) {
  // Static - no animation for performance
  const vacuumLevel = status === 'testing' ? 100 - testProgress : status === 'pass' ? 0 : 100;
  
  return (
    <group position={position}>
      {/* Room floor */}
      <Plane args={[7, 5]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <meshStandardMaterial color="#2d3436" />
      </Plane>
      
      {/* Vacuum chamber - static */}
      <group position={[0, 1.5, 0]}>
        <Cylinder args={[2, 2, 3]} position={[0, 0, 0]}>
          <meshPhysicalMaterial color="#b2bec3" transparent opacity={0.4} transmission={0.8} metalness={0.3} />
        </Cylinder>
        <Cylinder args={[2.1, 2.1, 0.2]} position={[0, 1.4, 0]}>
          <meshStandardMaterial color="#636e72" metalness={0.8} />
        </Cylinder>
        <Cylinder args={[2.1, 2.1, 0.2]} position={[0, -1.4, 0]}>
          <meshStandardMaterial color="#636e72" metalness={0.8} />
        </Cylinder>
      </group>
      
      {/* AC Unit inside */}
      <Box args={[1, 0.6, 0.5]} position={[0, 0.5, 0]}>
        <meshStandardMaterial color="#dfe6e9" />
      </Box>
      
      {/* Vacuum pump machine - static */}
      <group position={[-2.5, 0, 1]}>
        <Box args={[1.2, 1.2, 1]}>
          <meshStandardMaterial color="#2d3436" />
        </Box>
        <group position={[0, 0.8, 0]}>
          <Cylinder args={[0.4, 0.4, 0.2]}>
            <meshStandardMaterial color="#e17055" metalness={0.6} />
          </Cylinder>
          {Array.from({ length: 4 }).map((_, i) => (
            <Box key={i} args={[0.7, 0.05, 0.15]} rotation={[0, (i * Math.PI) / 2, 0]}>
              <meshStandardMaterial color="#636e72" />
            </Box>
          ))}
        </group>
        <Cylinder args={[0.08, 0.08, 2]} rotation={[0, 0, Math.PI / 2]} position={[0.8, 0.3, -0.5]}>
          <meshStandardMaterial color="#2d3436" />
        </Cylinder>
        <Box args={[0.15, 0.15, 0.15]} position={[1.5, 0.3, -0.5]}>
          <meshStandardMaterial color="#636e72" />
        </Box>
      </group>
      
      {/* Digital pressure gauge */}
      <group position={[2, 1.5, -1]}>
        <Box args={[0.8, 0.6, 0.1]}>
          <meshStandardMaterial color="#2d3436" />
        </Box>
        <Box args={[0.6, 0.4, 0.02]} position={[0, 0, 0.06]}>
          <meshStandardMaterial color="#0984e3" emissive="#0984e3" emissiveIntensity={0.3} />
        </Box>
        <Html position={[0, 0, 0.1]} center distanceFactor={5}>
          <div className="text-xs font-mono text-[#00A3E0] bg-[#0a0f1c] px-1 rounded">
            {vacuumLevel.toFixed(1)} kPa
          </div>
        </Html>
      </group>
      
      {/* Warning labels */}
      <Billboard position={[0, 2.8, 2.2]}>
        <Text fontSize={0.25} color="#0984e3" anchorX="center">
          VACUUM CHAMBER
        </Text>
      </Billboard>
      
      {/* Data overlay */}
      <Html position={[0, 3.5, 0]} center distanceFactor={10}>
        <div className="select-none rounded-lg border border-white/10 bg-[#0a0f1c]/90 backdrop-blur-md p-2 shadow-2xl">
          <div className="text-[10px] text-gray-400">Vacuum Chamber</div>
          <div className="text-sm font-bold text-[#00A3E0]">{vacuumLevel.toFixed(1)} kPa</div>
          <div className="text-[10px] text-gray-500">
            {status === 'testing' ? 'Pumping...' : status === 'pass' ? 'Vacuum Ready' : 'Idle'}
          </div>
        </div>
      </Html>
    </group>
  );
}

function PerformanceTestLab({ position, status, testProgress }: TestRoomProps) {
  // Static - no animations for performance
  const coolingCapacity = status === 'testing' ? 2800 + testProgress * 10 : 0;
  const airflow = status === 'testing' ? 450 + testProgress * 2 : 0;
  const power = status === 'testing' ? 0.85 + testProgress * 0.01 : 0;
  const tempDiff = status === 'testing' ? 8 + testProgress * 0.05 : 0;
  
  return (
    <group position={position}>
      {/* Room floor */}
      <Plane args={[9, 6]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <meshStandardMaterial color="#2d3436" />
      </Plane>
      
      {/* Wall with mounted indoor unit */}
      <Box args={[0.2, 3, 5]} position={[-4, 1.5, 0]}>
        <meshStandardMaterial color="#636e72" />
      </Box>
      
      {/* Indoor AC Unit mounted on wall */}
      <group position={[-3.8, 2, 0]}>
        <Box args={[0.2, 0.8, 2]}>
          <meshStandardMaterial color="#dfe6e9" />
        </Box>
        <Box args={[0.22, 0.1, 1.8]} position={[0, -0.35, 0]}>
          <meshStandardMaterial color="#2d3436" />
        </Box>
        <Box args={[0.22, 0.15, 0.4]} position={[0, 0.2, 0.6]}>
          <meshStandardMaterial color="#00A3E0" emissive="#00A3E0" emissiveIntensity={0.5} />
        </Box>
      </group>
      
      {/* Outdoor condenser unit */}
      <group position={[3, 0, 1]}>
        <Box args={[1.2, 1, 0.6]} position={[0, 0.5, 0]}>
          <meshStandardMaterial color="#dfe6e9" metalness={0.3} />
        </Box>
        <group position={[0, 1.02, 0]}>
          <Cylinder args={[0.5, 0.5, 0.05]}>
            <meshStandardMaterial color="#2d3436" />
          </Cylinder>
          {Array.from({ length: 5 }).map((_, i) => (
            <Box key={i} args={[0.4, 0.02, 0.06]} rotation={[0, (i * Math.PI * 2) / 5, 0]}>
              <meshStandardMaterial color="#b2bec3" />
            </Box>
          ))}
        </group>
        <Cylinder args={[0.05, 0.05, 6]} rotation={[0, 0, Math.PI / 2]} position={[-2.5, 0.5, 0]}>
          <meshStandardMaterial color="#b2bec3" metalness={0.8} />
        </Cylinder>
      </group>
      
      {/* Temperature sensors */}
      <group position={[-1, 0.5, -2]}>
        <Cylinder args={[0.1, 0.1, 0.5]}>
          <meshStandardMaterial color="#e17055" />
        </Cylinder>
        <Sphere args={[0.15]} position={[0, 0.3, 0]}>
          <meshStandardMaterial color="#FF6B35" emissive="#FF6B35" emissiveIntensity={0.5} />
        </Sphere>
      </group>
      
      {/* Power measurement panel */}
      <group position={[2, 1.5, -2]}>
        <Box args={[1.2, 1, 0.2]}>
          <meshStandardMaterial color="#2d3436" />
        </Box>
        <Box args={[0.5, 0.3, 0.02]} position={[-0.25, 0.2, 0.11]}>
          <meshStandardMaterial color="#00A3E0" emissive="#00A3E0" emissiveIntensity={0.3} />
        </Box>
        <Box args={[0.5, 0.3, 0.02]} position={[0.25, 0.2, 0.11]}>
          <meshStandardMaterial color="#00C853" emissive="#00C853" emissiveIntensity={0.3} />
        </Box>
        <Box args={[0.5, 0.3, 0.02]} position={[-0.25, -0.2, 0.11]}>
          <meshStandardMaterial color="#FFD600" emissive="#FFD600" emissiveIntensity={0.3} />
        </Box>
        <Box args={[0.5, 0.3, 0.02]} position={[0.25, -0.2, 0.11]}>
          <meshStandardMaterial color="#FF6B35" emissive="#FF6B35" emissiveIntensity={0.3} />
        </Box>
      </group>
      
      {/* Technician - static */}
      <Technician position={[0, 0, 2]} isWorking={status === 'testing'} animationOffset={100} />
      
      {/* Data overlay with metrics */}
      <Html position={[0, 3.5, 0]} center distanceFactor={10}>
        <div className="select-none rounded-lg border border-white/10 bg-[#0a0f1c]/90 backdrop-blur-md p-3 shadow-2xl w-[180px]">
          <div className="text-[10px] text-gray-400 mb-2">Performance Test Lab</div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-gray-500">Cooling</span>
              <div className="text-[#00A3E0] font-bold">{coolingCapacity.toFixed(0)} W</div>
            </div>
            <div>
              <span className="text-gray-500">Airflow</span>
              <div className="text-[#00C853] font-bold">{airflow.toFixed(0)} CFM</div>
            </div>
            <div>
              <span className="text-gray-500">Power</span>
              <div className="text-[#FFD600] font-bold">{power.toFixed(2)} kW</div>
            </div>
            <div>
              <span className="text-gray-500">ΔT</span>
              <div className="text-[#FF6B35] font-bold">{tempDiff.toFixed(1)}°C</div>
            </div>
          </div>
          <div className="mt-2 h-1 bg-white/10 rounded-full">
            <div className="h-full bg-[#00A3E0] rounded-full" style={{ width: `${testProgress}%` }} />
          </div>
        </div>
      </Html>
    </group>
  );
}

function HighVoltageTestRoom({ position, status, testProgress, testResult }: TestRoomProps) {
  // Static - no animations for performance
  const voltage = status === 'testing' ? 1500 + testProgress * 20 : 0;
  
  return (
    <group position={position}>
      {/* Room floor with safety markings */}
      <Plane args={[7, 5]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <meshStandardMaterial color="#2d3436" />
      </Plane>
      
      {/* Yellow safety border */}
      <Line points={[[-3.4, 0.02, -2.4], [3.4, 0.02, -2.4], [3.4, 0.02, 2.4], [-3.4, 0.02, 2.4], [-3.4, 0.02, -2.4]]} color="#FFD600" lineWidth={3} />
      
      {/* High voltage warning signs */}
      <Billboard position={[-3, 2, 2]}>
        <group>
          <Text fontSize={0.4} color="#FF1744" anchorX="center" anchorY="middle">
            ⚡
          </Text>
          <Text fontSize={0.2} color="#FFD600" anchorX="center" position={[0, -0.3, 0]}>
            HIGH VOLTAGE
          </Text>
        </group>
      </Billboard>
      
      <Billboard position={[3, 2, 2]}>
        <group>
          <Text fontSize={0.4} color="#FF1744" anchorX="center" anchorY="middle">
            ⚡
          </Text>
          <Text fontSize={0.2} color="#FFD600" anchorX="center" position={[0, -0.3, 0]}>
            DANGER
          </Text>
        </group>
      </Billboard>
      
      {/* Electrical testing cabinet */}
      <group position={[-2, 0, -1]}>
        <Box args={[1.5, 2, 1]}>
          <meshStandardMaterial color="#636e72" metalness={0.7} />
        </Box>
        <Box args={[1.2, 1.5, 0.1]} position={[0, 0.1, 0.51]}>
          <meshStandardMaterial color="#2d3436" />
        </Box>
        <Cylinder args={[0.15, 0.15, 0.1]} rotation={[Math.PI / 2, 0, 0]} position={[0.4, -0.5, 0.56]}>
          <meshStandardMaterial color="#FF1744" emissive="#FF1744" emissiveIntensity={0.5} />
        </Cylinder>
        <Box args={[0.5, 0.4, 0.02]} position={[-0.3, 0.5, 0.56]}>
          <meshStandardMaterial color={status === 'testing' ? '#FFD600' : '#636e72'} />
        </Box>
      </group>
      
      {/* AC Unit under test */}
      <Box args={[1, 0.6, 0.5]} position={[0, 0.4, 0]}>
        <meshStandardMaterial color="#dfe6e9" />
      </Box>
      
      {/* Test probes - static */}
      <group>
        <Cylinder args={[0.03, 0.03, 2]} position={[-0.8, 1, 0]}>
          <meshStandardMaterial color="#FF1744" emissive="#FF1744" emissiveIntensity={status === 'testing' ? 0.8 : 0} />
        </Cylinder>
        <Sphere args={[0.06]} position={[-0.8, 0.1, 0]}>
          <meshStandardMaterial color="#FF1744" emissive="#FF1744" emissiveIntensity={status === 'testing' ? 0.5 : 0.2} />
        </Sphere>
        <Cylinder args={[0.02, 0.02, 1.5]} rotation={[0, 0, Math.PI / 4]} position={[-0.5, 1.2, 0]}>
          <meshStandardMaterial color="#2d3436" />
        </Cylinder>
        
        <Cylinder args={[0.03, 0.03, 1.5]} position={[0.8, 0.75, 0]}>
          <meshStandardMaterial color="#00C853" />
        </Cylinder>
        <Sphere args={[0.06]} position={[0.8, 0.1, 0]}>
          <meshStandardMaterial color="#00C853" />
        </Sphere>
        <Cylinder args={[0.02, 0.02, 1.5]} rotation={[0, 0, -Math.PI / 4]} position={[0.5, 1, 0]}>
          <meshStandardMaterial color="#2d3436" />
        </Cylinder>
      </group>
      
      {/* Safety warning lights - static */}
      <group position={[2.5, 2, -1.5]}>
        <Box args={[0.4, 0.8, 0.2]}>
          <meshStandardMaterial color="#2d3436" />
        </Box>
        <Sphere args={[0.12]} position={[0, 0.25, 0.15]}>
          <meshStandardMaterial color="#FF1744" emissive="#FF1744" emissiveIntensity={status === 'testing' ? 1 : 0.3} />
        </Sphere>
        <Sphere args={[0.12]} position={[0, -0.25, 0.15]}>
          <meshStandardMaterial color="#FFD600" emissive="#FFD600" emissiveIntensity={status === 'idle' ? 0.5 : 0.2} />
        </Sphere>
      </group>
      
      {/* PASS/FAIL indicator */}
      <group position={[2, 1, 1]}>
        <Box args={[1.2, 0.5, 0.1]}>
          <meshStandardMaterial 
            color={status === 'pass' ? '#00C853' : status === 'fail' ? '#FF1744' : '#636e72'}
            emissive={status === 'pass' ? '#00C853' : status === 'fail' ? '#FF1744' : '#000000'}
            emissiveIntensity={status !== 'idle' ? 0.8 : 0}
          />
        </Box>
        <Html position={[0, 0, 0.1]} center distanceFactor={5}>
          <div className={`text-xs font-bold px-2 py-1 rounded ${status === 'pass' ? 'text-green-400' : status === 'fail' ? 'text-red-400' : 'text-gray-400'}`}>
            {status === 'idle' ? 'READY' : testResult}
          </div>
        </Html>
      </group>
      
      {/* Data overlay */}
      <Html position={[0, 3, 0]} center distanceFactor={10}>
        <div className="select-none rounded-lg border border-red-500/30 bg-[#0a0f1c]/90 backdrop-blur-md p-2 shadow-2xl">
          <div className="text-[10px] text-red-400 font-bold">⚡ HIGH VOLTAGE TEST</div>
          <div className="text-sm font-bold text-[#FFD600]">{voltage.toFixed(0)} V</div>
          <div className="text-[10px] text-gray-500">
            {status === 'testing' ? 'Testing Insulation...' : status === 'pass' ? 'Insulation OK' : status === 'fail' ? 'Insulation Failed' : 'Standby'}
          </div>
        </div>
      </Html>
    </group>
  );
}

// Testing Zone Layout Component
function TestingZone({ 
  testStatus,
  testProgress,
  onTestComplete: _onTestComplete 
}: { 
  testStatus: Record<string, TestStatus>;
  testProgress: Record<string, number>;
  onTestComplete: (room: string, result: 'PASS' | 'FAIL') => void;
}) {
  return (
    <group position={[15, 0, 0]}>
      {/* Testing Zone Label */}
      <Billboard position={[0, 5, 0]}>
        <Text fontSize={1} color="#00C853" anchorX="center">
          TESTING ZONE
        </Text>
      </Billboard>
      
      {/* Testing Zone Floor Marking */}
      <Plane args={[30, 20]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <meshStandardMaterial color="#1a2a3e" transparent opacity={0.5} />
      </Plane>
      
      {/* Green border */}
      <Line 
        points={[[-14, 0.03, -9], [14, 0.03, -9], [14, 0.03, 9], [-14, 0.03, 9], [-14, 0.03, -9]]} 
        color="#00C853" 
        lineWidth={4} 
      />
      
      {/* Leak Test Room */}
      <LeakTestRoom 
        position={[-10, 0, -6]} 
        status={testStatus['leak']} 
        testProgress={testProgress['leak']} 
        testResult={testStatus['leak'] === 'pass' ? 'PASS' : testStatus['leak'] === 'fail' ? 'FAIL' : undefined}
      />
      
      {/* Vacuum Chamber */}
      <VacuumChamber 
        position={[0, 0, -6]} 
        status={testStatus['vacuum']} 
        testProgress={testProgress['vacuum']}
      />
      
      {/* Performance Test Lab */}
      <PerformanceTestLab 
        position={[-5, 0, 3]} 
        status={testStatus['performance']} 
        testProgress={testProgress['performance']}
      />
      
      {/* High Voltage Test Room */}
      <HighVoltageTestRoom 
        position={[7, 0, 3]} 
        status={testStatus['highvoltage']} 
        testProgress={testProgress['highvoltage']}
        testResult={testStatus['highvoltage'] === 'pass' ? 'PASS' : testStatus['highvoltage'] === 'fail' ? 'FAIL' : undefined}
      />
    </group>
  );
}

type DraggableStationProps = {
  station: AssemblyStation;
  position: [number, number, number];
  isEditMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onPositionChange: (pos: [number, number, number]) => void;
  /** Reserved for future inline station edits from the 3D handle */
  onUpdate: (updates: Partial<AssemblyStation>) => void;
};

function DraggableStation(props: DraggableStationProps) {
  const { station, position, isEditMode, isSelected, onSelect, onPositionChange } = props;
  const groupRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPlane, setDragPlane] = useState<THREE.Plane | null>(null);
  const { camera, raycaster, pointer } = useThree();
  
  // Update position when prop changes
  useEffect(() => {
    if (groupRef.current && !isDragging) {
      groupRef.current.position.set(...position);
    }
  }, [position, isDragging]);
  
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!isEditMode) {
      onSelect();
      return;
    }
    e.stopPropagation();
    setIsDragging(true);
    onSelect();
    
    // Create drag plane at station height
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -position[1]);
    setDragPlane(plane);
  };
  
  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !dragPlane || !groupRef.current) return;
    e.stopPropagation();
    
    raycaster.setFromCamera(pointer, camera);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlane, target);
    
    if (target) {
      // Snap to grid (0.5 unit)
      const snappedX = Math.round(target.x * 2) / 2;
      const snappedZ = Math.round(target.z * 2) / 2;
      groupRef.current.position.set(snappedX, position[1], snappedZ);
    }
  };
  
  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !groupRef.current) return;
    e.stopPropagation();
    setIsDragging(false);
    setDragPlane(null);
    
    const newPos: [number, number, number] = [
      groupRef.current.position.x,
      position[1],
      groupRef.current.position.z
    ];
    onPositionChange(newPos);
  };
  
  const isBrazing = station.id === 'OUT-05' && station.status === 'running';
  const isTesting = station.id === 'OUT-07' && station.status === 'running';
  
  return (
    <group 
      ref={groupRef} 
      position={position}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Selection highlight in edit mode */}
      {isEditMode && isSelected && (
        <Box args={[3.5, 0.1, 3.5]} position={[0, 0.05, 0]}>
          <meshBasicMaterial color="#00A3E0" transparent opacity={0.5} />
        </Box>
      )}
      
      {/* Drag handle indicator in edit mode */}
      {isEditMode && (
        <group position={[0, 3, 0]}>
          <Sphere args={[0.2]}>
            <meshBasicMaterial color={isDragging ? "#00C853" : "#FFD600"} />
          </Sphere>
          <Html center distanceFactor={8}>
            <div className={`px-2 py-1 rounded text-[10px] font-medium ${isDragging ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'}`}>
              {isDragging ? 'Dragging...' : 'Drag to move'}
            </div>
          </Html>
        </group>
      )}
      
      <WorkTable position={[0, 0, 0]} />
      
      <Conveyor position={[0, 0, station.line === 'indoor' ? -2 : 2]} length={station.width || 3} />
      
      <Technician 
        position={[1.5, 0, 0]} 
        isWorking={station.status === 'running'} 
        animationOffset={station.id.charCodeAt(0)}
      />
      
      <ACUnit 
        position={[0, 0.9, station.line === 'indoor' ? -2 : 2]} 
        type={station.line}
        stage={parseInt(station.id.split('-')[1])}
        isMoving={station.status === 'running'}
      />
      
      <StatusBeacon status={station.status} position={[0, 2.2, 0]} />
      
      {isBrazing && (
        <Sphere args={[0.3]} position={[0, 1.2, 0]}>
          <meshBasicMaterial color="#fdcb6e" transparent opacity={0.5} />
        </Sphere>
      )}
      {isTesting && <PressureGauge position={[1, 1.5, 0]} pressure={station.status === 'running' ? 15 : 0} />}
      
      <StationDataOverlay station={station} position={position} />
    </group>
  );
}

// Legacy component for backward compatibility
function AssemblyStation3D({ station, position }: { station: AssemblyStation; position: [number, number, number] }) {
  const isBrazing = station.id === 'OUT-05' && station.status === 'running';
  const isTesting = station.id === 'OUT-07' && station.status === 'running';
  
  return (
    <group position={position}>
      {/* Work table */}
      <WorkTable position={[0, 0, 0]} />
      
      {/* Conveyor */}
      <Conveyor position={[0, 0, station.line === 'indoor' ? -2 : 2]} length={3} />
      
      {/* Technician */}
      <Technician 
        position={[1.5, 0, 0]} 
        isWorking={station.status === 'running'} 
        animationOffset={station.id.charCodeAt(0)}
      />
      
      {/* AC Unit on conveyor */}
      <ACUnit 
        position={[0, 0.9, station.line === 'indoor' ? -2 : 2]} 
        type={station.line}
        stage={parseInt(station.id.split('-')[1])}
        isMoving={station.status === 'running'}
      />
      
      {/* Status beacon */}
      <StatusBeacon status={station.status} position={[0, 2.2, 0]} />
      
      {/* Special effects */}
      {isBrazing && (
        <Sphere args={[0.3]} position={[0, 1.2, 0]}>
          <meshBasicMaterial color="#fdcb6e" transparent opacity={0.5} />
        </Sphere>
      )}
      {isTesting && <PressureGauge position={[1, 1.5, 0]} pressure={station.status === 'running' ? 15 : 0} />}
      
      {/* Data overlay */}
      <StationDataOverlay station={station} position={position} />
    </group>
  );
}

function FactoryScene({ 
  indoorStations, 
  outdoorStations, 
  forklifts,
  selectedStation: _selectedStation,
  onStationSelect,
  showHeatmap,
  heatmapData,
  testStatus,
  testProgress,
  isEditMode,
  selectedEditStation,
  onStationPositionChange,
  onStationUpdate,
  referencePoints,
  selectedReferenceId,
  onPickReference,
}: { 
  indoorStations: AssemblyStation[]; 
  outdoorStations: AssemblyStation[];
  forklifts: Forklift[];
  selectedStation: string | null;
  onStationSelect: (id: string) => void;
  showHeatmap: boolean;
  heatmapData: Record<string, number>;
  testStatus: Record<string, TestStatus>;
  testProgress: Record<string, number>;
  isEditMode?: boolean;
  selectedEditStation?: string | null;
  onStationPositionChange?: (stationId: string, pos: [number, number, number]) => void;
  onStationUpdate?: (stationId: string, updates: Partial<AssemblyStation>) => void;
  referencePoints: { id: string; position: [number, number, number] }[];
  selectedReferenceId: string | null;
  onPickReference: (id: string) => void;
}) {
  return (
    <group>
      {/* Environment */}
      <FactoryFloor />
      <FactoryWalls />
      
      {/* Storage Areas */}
      <StorageArea position={[-20, 0, -15]} />
      <StorageArea position={[20, 0, -15]} />
      <StorageArea position={[-20, 0, 15]} />
      <StorageArea position={[20, 0, 15]} />
      
      {/* Indoor Line Label */}
      <Billboard position={[12, 4, -8]}>
        <Text fontSize={0.8} color="#00A3E0" anchorX="center">
          INDOOR UNIT LINE
        </Text>
      </Billboard>
      
      {/* Outdoor Line Label */}
      <Billboard position={[12, 4, 8]}>
        <Text fontSize={0.8} color="#FF6B35" anchorX="center">
          OUTDOOR UNIT LINE
        </Text>
      </Billboard>
      
      {/* Indoor Assembly Stations */}
      {indoorStations.map((station) => (
        <group key={station.id}>
          {isEditMode ? (
            <DraggableStation
              station={station}
              position={station.position}
              isEditMode={true}
              isSelected={selectedEditStation === station.id}
              onSelect={() => onStationSelect(station.id)}
              onPositionChange={(pos) => onStationPositionChange?.(station.id, pos)}
              onUpdate={(updates) => onStationUpdate?.(station.id, updates)}
            />
          ) : (
            <AssemblyStation3D 
              station={station} 
              position={station.position} 
            />
          )}
          
          {/* Heatmap overlay */}
          {showHeatmap && (
            <Plane
              args={[2.5, 2.5]}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[station.position[0], 0.03, station.position[2]]}
              onClick={() => onStationSelect(station.id)}
            >
              <meshBasicMaterial 
                color={heatmapData[station.id] > 90 ? '#00C853' : heatmapData[station.id] > 75 ? '#FFD600' : '#FF1744'}
                transparent
                opacity={0.4}
              />
            </Plane>
          )}
        </group>
      ))}
      
      {/* Outdoor Assembly Stations */}
      {outdoorStations.map((station) => (
        <group key={station.id}>
          {isEditMode ? (
            <DraggableStation
              station={station}
              position={station.position}
              isEditMode={true}
              isSelected={selectedEditStation === station.id}
              onSelect={() => onStationSelect(station.id)}
              onPositionChange={(pos) => onStationPositionChange?.(station.id, pos)}
              onUpdate={(updates) => onStationUpdate?.(station.id, updates)}
            />
          ) : (
            <AssemblyStation3D 
              station={station} 
              position={station.position} 
            />
          )}
          
          {/* Heatmap overlay */}
          {showHeatmap && (
            <Plane
              args={[2.5, 2.5]}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[station.position[0], 0.03, station.position[2]]}
              onClick={() => onStationSelect(station.id)}
            >
              <meshBasicMaterial 
                color={heatmapData[station.id] > 90 ? '#00C853' : heatmapData[station.id] > 75 ? '#FFD600' : '#FF1744'}
                transparent
                opacity={0.4}
              />
            </Plane>
          )}
        </group>
      ))}
      
      {/* Forklifts */}
      {forklifts.map((forklift) => (
        <Forklift key={forklift.id} forklift={forklift} />
      ))}
      
      {/* Testing Zone */}
      <TestingZone 
        testStatus={testStatus}
        testProgress={testProgress}
        onTestComplete={(room, result) => {
          console.log(`Test ${room}: ${result}`);
        }}
      />
      
      {/* Smart Navigation: Reference Points */}
      {referencePoints.map((p) => (
        <ReferenceMarker
          key={p.id}
          position={p.position}
          selected={selectedReferenceId === p.id}
          onPick={() => onPickReference(p.id)}
        />
      ))}
      
      {/* Ambient Effects - REMOVED for performance */}
      
      {/* Contact Shadows - REMOVED for performance */}
    </group>
  );
}

function CameraController({ target, controlsRef }: { target: { position: THREE.Vector3; target: THREE.Vector3 } | null; controlsRef: React.RefObject<any> }) {
  const { camera } = useThree();
  
  useEffect(() => {
    if (target && controlsRef.current) {
      gsap.to(camera.position, {
        x: target.position.x,
        y: target.position.y,
        z: target.position.z,
        duration: 1.5,
        ease: 'power2.inOut'
      });
      
      gsap.to(controlsRef.current.target, {
        x: target.target.x,
        y: target.target.y,
        z: target.target.z,
        duration: 1.5,
        ease: 'power2.inOut',
        onUpdate: () => controlsRef.current.update()
      });
    }
  }, [target, camera, controlsRef]);
  
  return null;
}

// =====================================================================================
// MAIN AC FACTORY DIGITAL TWIN COMPONENT
// =====================================================================================

export default function ACFactoryDigitalTwin() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<any>(null);
  
  // State
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [viewMode, setViewMode] = useState<'3d' | 'heatmap' | 'analytics'>('3d');
  const [autoRotate] = useState(false);
  const [selectedLine, setSelectedLine] = useState<'all' | 'indoor' | 'outdoor'>('all');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEditStation, setSelectedEditStation] = useState<string | null>(null);
  
  // Smart Navigation: Reference points state
  const [selectedReferenceId, setSelectedReferenceId] = useState<string | null>(null);
  const [manualFocus, setManualFocus] = useState<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  
  // Stations State
  const [indoorLineStations, setIndoorLineStations] = useState<AssemblyStation[]>(
    indoorStations.map((s, i) => ({ 
      ...s, 
      position: indoorPositions[i],
      width: s.width || DEFAULT_STATION_DIMENSIONS.width,
      depth: s.depth || DEFAULT_STATION_DIMENSIONS.depth,
      height: s.height || DEFAULT_STATION_DIMENSIONS.height
    }))
  );
  const [outdoorLineStations, setOutdoorLineStations] = useState<AssemblyStation[]>(
    outdoorStations.map((s, i) => ({ 
      ...s, 
      position: outdoorPositions[i],
      width: s.width || DEFAULT_STATION_DIMENSIONS.width,
      depth: s.depth || DEFAULT_STATION_DIMENSIONS.depth,
      height: s.height || DEFAULT_STATION_DIMENSIONS.height
    }))
  );
  
  // Forklifts State
  const [forklifts] = useState<Forklift[]>([]);
  
  // Production Data
  const [productionData] = useState({
    indoorTotal: 0,
    outdoorTotal: 0,
    indoorTarget: 0,
    outdoorTarget: 0,
    indoorEfficiency: 0,
    outdoorEfficiency: 0,
    avgCycleTime: 0,
    activeAlerts: 0
  });
  
  // Telemetry History - REMOVED (not needed, static data only)
  
  // Alerts
  const [alerts] = useState<AlertEvent[]>([]);
  
  // Testing Zone State
  const [testStatus] = useState<Record<string, TestStatus>>({
    leak: 'idle',
    vacuum: 'idle',
    performance: 'idle',
    highvoltage: 'idle'
  });
  const [testProgress] = useState<Record<string, number>>({
    leak: 0,
    vacuum: 0,
    performance: 0,
    highvoltage: 0
  });
  
  // Heatmap Data
  const heatmapData = useMemo(() => {
    const data: Record<string, number> = {};
    [...indoorLineStations, ...outdoorLineStations].forEach(s => {
      data[s.id] = s.efficiency;
    });
    return data;
  }, [indoorLineStations, outdoorLineStations]);
  
  // Camera Target
  const cameraTarget = useMemo(() => {
    if (!selectedStation) return null;
    const station = [...indoorLineStations, ...outdoorLineStations].find(s => s.id === selectedStation);
    if (!station) return null;
    
    const pos = new THREE.Vector3(station.position[0] + 5, 6, station.position[2] + 8);
    const target = new THREE.Vector3(station.position[0], 1, station.position[2]);
    return { position: pos, target };
  }, [selectedStation, indoorLineStations, outdoorLineStations]);
  
  // Smart Navigation: AC Factory reference points (eye-like markers)
  const acReferencePoints = useMemo(() => {
    return [
      { id: 'ref-entrance', position: [-20, 0.1, 18] as [number, number, number] },
      { id: 'ref-center', position: [0, 0.1, 0] as [number, number, number] },
      { id: 'ref-indoor-start', position: [-15, 0.1, -8] as [number, number, number] },
      { id: 'ref-indoor-end', position: [9, 0.1, -8] as [number, number, number] },
      { id: 'ref-outdoor-start', position: [-15, 0.1, 8] as [number, number, number] },
      { id: 'ref-outdoor-end', position: [9, 0.1, 8] as [number, number, number] },
      { id: 'ref-testing-zone', position: [-5, 0.1, -6] as [number, number, number] },
      { id: 'ref-storage-nw', position: [-20, 0.1, -15] as [number, number, number] },
      { id: 'ref-storage-ne', position: [20, 0.1, -15] as [number, number, number] },
      { id: 'ref-storage-sw', position: [-20, 0.1, 15] as [number, number, number] },
      { id: 'ref-storage-se', position: [20, 0.1, 15] as [number, number, number] },
    ];
  }, []);
  
  const pickAcReference = useCallback((id: string) => {
    const hit = acReferencePoints.find((p) => p.id === id);
    if (!hit) return;
    setSelectedReferenceId(id);
    setSelectedStation(null); // Clear station selection when using reference points

    const target = new THREE.Vector3(hit.position[0], 0.5, hit.position[2]);
    const offset = new THREE.Vector3(8, 6, 10);
    const pos = target.clone().add(offset);
    setManualFocus({ position: pos, target });
  }, [acReferencePoints]);
  
  // Use manual focus if set, otherwise use camera target from station selection
  const effectiveFocus = manualFocus ?? cameraTarget;
  
  // Simulation Effect - REMOVED for performance (static data only)
  
  // GSAP Animation
  useEffect(() => {
    if (sectionRef.current) {
      gsap.fromTo(
        sectionRef.current.querySelectorAll('.animate-item'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
      );
    }
  }, []);
  
  const handleStationClick = useCallback((id: string) => {
    setSelectedStation(id);
    const station = [...indoorLineStations, ...outdoorLineStations].find(s => s.id === id);
    if (station) {
      toast.info(`${station.name} Selected`, { description: `Operator: ${station.operator} • Efficiency: ${station.efficiency}%` });
    }
  }, [indoorLineStations, outdoorLineStations]);
  
  const handleResetView = useCallback(() => {
    setSelectedStation(null);
    if (controlsRef.current) {
      gsap.to(controlsRef.current.object.position, {
        x: 0, y: 15, z: 25,
        duration: 1.5,
        ease: 'power2.inOut'
      });
      gsap.to(controlsRef.current.target, {
        x: 0, y: 0, z: 0,
        duration: 1.5,
        ease: 'power2.inOut',
        onUpdate: () => controlsRef.current.update()
      });
    }
  }, []);
  
  // Analytics Data
  const efficiencyData = useMemo(() => {
    return [...indoorLineStations, ...outdoorLineStations].map(s => ({
      name: s.id,
      efficiency: s.efficiency,
      target: 90,
      line: s.line
    }));
  }, [indoorLineStations, outdoorLineStations]);
  
  const throughputData = useMemo(() => {
    return [
      { name: 'Indoor Line', actual: productionData.indoorTotal, target: productionData.indoorTarget },
      { name: 'Outdoor Line', actual: productionData.outdoorTotal, target: productionData.outdoorTarget }
    ];
  }, [productionData]);
  
  const bottleneckStations = useMemo(() => {
    return [...indoorLineStations, ...outdoorLineStations]
      .filter(s => s.efficiency < 80 || s.cycleTime > s.targetCycleTime * 1.2)
      .sort((a, b) => a.efficiency - b.efficiency)
      .slice(0, 3);
  }, [indoorLineStations, outdoorLineStations]);

  // Station CRUD operations
  const generateStationId = (line: 'indoor' | 'outdoor') => {
    const prefix = line === 'indoor' ? 'IND' : 'OUT';
    const existing = line === 'indoor' ? indoorLineStations : outdoorLineStations;
    const numbers = existing
      .map(s => parseInt(s.id.split('-')[1]))
      .filter(n => !isNaN(n));
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `${prefix}-${String(maxNum + 1).padStart(2, '0')}`;
  };

  const addStation = (line: 'indoor' | 'outdoor') => {
    const newId = generateStationId(line);
    const newStation: AssemblyStation = {
      id: newId,
      name: `New Station ${newId}`,
      line,
      position: line === 'indoor' ? [-15, 0, -8] : [-15, 0, 8],
      status: 'waiting',
      operator: 'Unassigned',
      cycleTime: 45,
      productionCount: 0,
      targetCycleTime: 40,
      temperature: 28,
      vibration: 0.8,
      powerConsumption: 2.5,
      efficiency: 85,
      width: DEFAULT_STATION_DIMENSIONS.width,
      depth: DEFAULT_STATION_DIMENSIONS.depth,
      height: DEFAULT_STATION_DIMENSIONS.height
    };
    
    if (line === 'indoor') {
      setIndoorLineStations(prev => [...prev, newStation]);
    } else {
      setOutdoorLineStations(prev => [...prev, newStation]);
    }
    toast.success(`Added ${newId}`);
    setSelectedEditStation(newId);
  };

  const duplicateStation = (stationId: string) => {
    const station = [...indoorLineStations, ...outdoorLineStations].find(s => s.id === stationId);
    if (!station) return;
    
    const newId = generateStationId(station.line);
    const newStation: AssemblyStation = {
      ...station,
      id: newId,
      name: `${station.name} (Copy)`,
      position: [station.position[0] + 3, station.position[1], station.position[2]],
      productionCount: 0
    };
    
    if (station.line === 'indoor') {
      setIndoorLineStations(prev => [...prev, newStation]);
    } else {
      setOutdoorLineStations(prev => [...prev, newStation]);
    }
    toast.success(`Duplicated ${stationId} as ${newId}`);
    setSelectedEditStation(newId);
  };

  const deleteStation = (stationId: string) => {
    const station = [...indoorLineStations, ...outdoorLineStations].find(s => s.id === stationId);
    if (!station) return;
    
    if (station.line === 'indoor') {
      setIndoorLineStations(prev => prev.filter(s => s.id !== stationId));
    } else {
      setOutdoorLineStations(prev => prev.filter(s => s.id !== stationId));
    }
    
    if (selectedEditStation === stationId) {
      setSelectedEditStation(null);
    }
    toast.success(`Deleted ${stationId}`);
  };

  const updateStationPosition = (stationId: string, newPosition: [number, number, number]) => {
    const station = [...indoorLineStations, ...outdoorLineStations].find(s => s.id === stationId);
    if (!station) return;
    
    if (station.line === 'indoor') {
      setIndoorLineStations(prev => prev.map(s => 
        s.id === stationId ? { ...s, position: newPosition } : s
      ));
    } else {
      setOutdoorLineStations(prev => prev.map(s => 
        s.id === stationId ? { ...s, position: newPosition } : s
      ));
    }
  };

  const updateStation = (stationId: string, updates: Partial<AssemblyStation>) => {
    const station = [...indoorLineStations, ...outdoorLineStations].find(s => s.id === stationId);
    if (!station) return;
    
    if (station.line === 'indoor') {
      setIndoorLineStations(prev => prev.map(s => 
        s.id === stationId ? { ...s, ...updates } : s
      ));
    } else {
      setOutdoorLineStations(prev => prev.map(s => 
        s.id === stationId ? { ...s, ...updates } : s
      ));
    }
  };

  return (
    <div ref={sectionRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-item">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00A3E0] to-[#0066CC] flex items-center justify-center">
            <Factory className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">AC Factory Digital Twin</h1>
            <p className="text-gray-400">HVAC Assembly Plant • Real-time Production Monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="border-green-500 text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            Live Production
          </Badge>
          <Badge variant="outline" className="border-[#00A3E0] text-[#00A3E0]">
            <Wind className="w-3 h-3 mr-1" />
            Indoor: {productionData.indoorTotal}
          </Badge>
          <Badge variant="outline" className="border-[#FF6B35] text-[#FF6B35]">
            <Wind className="w-3 h-3 mr-1" />
            Outdoor: {productionData.outdoorTotal}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-white/10"
            onClick={() => setIsSimulationRunning(!isSimulationRunning)}
          >
            {isSimulationRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isSimulationRunning ? 'Pause' : 'Resume'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 3D Viewport */}
        <div className="lg:col-span-3 animate-item">
          <Card className="glass-panel border-white/10 overflow-hidden">
            <CardHeader className="pb-2 border-b border-white/10">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BoxIcon className="w-5 h-5 text-[#00A3E0]" />
                    Factory Floor View
                  </CardTitle>
                  <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                    {(['3d', 'heatmap', 'analytics'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => {
                          setViewMode(mode);
                          setShowHeatmap(mode === 'heatmap');
                        }}
                        className={`px-3 py-1 rounded text-xs capitalize transition-colors ${
                          viewMode === mode ? 'bg-[#0066CC] text-white' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowLabels(!showLabels)}
                  >
                    {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleResetView}>
                    <MapPin className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={isEditMode ? "default" : "outline"}
                    size="sm" 
                    className={isEditMode ? "bg-[#00A3E0] text-white" : "border-white/10"}
                    onClick={() => {
                      setIsEditMode(!isEditMode);
                      if (isEditMode) setSelectedEditStation(null);
                    }}
                  >
                    <Wrench className="w-4 h-4 mr-2" />
                    {isEditMode ? 'Done Editing' : 'Edit Layout'}
                  </Button>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[550px] bg-[#0a0a0f]">
              {viewMode === '3d' && (
                <Canvas
                  frameloop="demand"
                  shadows={false}
                  gl={{ preserveDrawingBuffer: true, antialias: false, powerPreference: 'low-power' }}
                  camera={{ position: [0, 15, 25], fov: 55 }}
                >
                  <color attach="background" args={['#070710']} />
                  <ambientLight intensity={0.6} />
                  <directionalLight position={[10, 20, 10]} intensity={0.8} />
                  
                  <OrbitControls 
                    ref={controlsRef}
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    autoRotate={autoRotate}
                    autoRotateSpeed={0.5}
                  />
                  
                  <CameraController target={effectiveFocus} controlsRef={controlsRef} />
                  
                  {/* Orientation Gizmo */}
                  <GizmoHelper alignment="bottom-right" margin={[90, 90]}>
                    <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="#ffffff" />
                  </GizmoHelper>
                  
                  <Suspense fallback={null}>
                    <FactoryScene 
                      indoorStations={indoorLineStations}
                      outdoorStations={outdoorLineStations}
                      forklifts={forklifts}
                      selectedStation={selectedStation}
                      onStationSelect={(id) => {
                        handleStationClick(id);
                        setSelectedReferenceId(null);
                        setManualFocus(null);
                      }}
                      showHeatmap={showHeatmap}
                      heatmapData={heatmapData}
                      testStatus={testStatus}
                      testProgress={testProgress}
                      isEditMode={isEditMode}
                      selectedEditStation={selectedEditStation}
                      onStationPositionChange={updateStationPosition}
                      onStationUpdate={updateStation}
                      referencePoints={acReferencePoints}
                      selectedReferenceId={selectedReferenceId}
                      onPickReference={pickAcReference}
                    />
                  </Suspense>
                </Canvas>
              )}
              
              {viewMode === 'heatmap' && (
                  <Canvas
                    frameloop="demand"
                    shadows={false}
                    gl={{ preserveDrawingBuffer: true, antialias: false, powerPreference: 'low-power' }}
                    camera={{ position: [0, 20, 5], fov: 55 }}
                  >
                    <color attach="background" args={['#070710']} />
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[10, 20, 10]} intensity={0.8} />
                    <OrbitControls ref={controlsRef} enablePan={true} enableZoom={true} />
                    <CameraController target={effectiveFocus} controlsRef={controlsRef} />
                    
                    {/* Orientation Gizmo */}
                    <GizmoHelper alignment="bottom-right" margin={[90, 90]}>
                      <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="#ffffff" />
                    </GizmoHelper>
                    
                    <Suspense fallback={null}>
                      <FactoryScene 
                        indoorStations={indoorLineStations}
                        outdoorStations={outdoorLineStations}
                        forklifts={forklifts}
                        selectedStation={selectedStation}
                        onStationSelect={(id) => {
                          handleStationClick(id);
                          setSelectedReferenceId(null);
                          setManualFocus(null);
                        }}
                        showHeatmap={true}
                        heatmapData={heatmapData}
                        testStatus={testStatus}
                        testProgress={testProgress}
                        referencePoints={acReferencePoints}
                        selectedReferenceId={selectedReferenceId}
                        onPickReference={pickAcReference}
                      />
                    </Suspense>
                  </Canvas>
                )}
                
                {viewMode === 'analytics' && (
                  <div className="h-full p-6 overflow-auto">
                    {/* Production Analytics Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card className="glass-panel border-white/10">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-400">Total Production</p>
                              <p className="text-2xl font-bold text-white">
                                {(productionData.indoorTotal + productionData.outdoorTotal).toLocaleString()}
                              </p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-[#00A3E0]/20 flex items-center justify-center">
                              <Package className="w-6 h-6 text-[#00A3E0]" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="glass-panel border-white/10">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-400">Avg Efficiency</p>
                              <p className="text-2xl font-bold text-white">
                                {((productionData.indoorEfficiency + productionData.outdoorEfficiency) / 2).toFixed(1)}%
                              </p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                              <Activity className="w-6 h-6 text-green-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="glass-panel border-white/10">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-400">Active Alerts</p>
                              <p className="text-2xl font-bold text-white">{productionData.activeAlerts}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                              <AlertTriangle className="w-6 h-6 text-red-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Efficiency Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <Card className="glass-panel border-white/10">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-[#00A3E0]" />
                            Station Efficiency
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={efficiencyData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis type="number" domain={[0, 100]} stroke="#636e72" fontSize={10} />
                                <YAxis type="category" dataKey="name" stroke="#636e72" fontSize={10} width={50} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#0a0f1c', border: '1px solid #ffffff20' }}
                                  labelStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="efficiency" radius={[0, 4, 4, 0]}>
                                  {efficiencyData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.efficiency >= 90 ? '#00C853' : entry.efficiency >= 75 ? '#FFD600' : '#FF1744'} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="glass-panel border-white/10">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Package className="w-4 h-4 text-[#FF6B35]" />
                            Production Throughput
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={throughputData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis dataKey="name" stroke="#636e72" fontSize={10} />
                                <YAxis stroke="#636e72" fontSize={10} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#0a0f1c', border: '1px solid #ffffff20' }}
                                  labelStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="actual" fill="#00A3E0" name="Actual" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="target" fill="#ffffff30" name="Target" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Bottlenecks */}
                    <Card className="glass-panel border-white/10 mt-4">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-orange-400">
                          <Gauge className="w-4 h-4" />
                          Identified Bottlenecks
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          {bottleneckStations.map((station) => (
                            <div key={station.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${statusToUIClass(station.status)}`} />
                                <div>
                                  <p className="text-sm font-medium text-white">{station.id} - {station.name}</p>
                                  <p className="text-xs text-gray-400">Operator: {station.operator}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-red-400">{station.efficiency}% Efficiency</p>
                                <p className="text-xs text-gray-400">Cycle: {station.cycleTime}s / Target: {station.targetCycleTime}s</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-4 animate-item">
          {/* Production Overview */}
          <Card className="glass-panel border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#00A3E0]" />
                Production Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Indoor Units</span>
                <span className="font-medium text-[#00A3E0]">{productionData.indoorTotal.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full">
                <div 
                  className="h-full bg-[#00A3E0] rounded-full transition-all"
                  style={{ width: `${productionData.indoorTarget ? (productionData.indoorTotal / productionData.indoorTarget) * 100 : 0}%` }}
                />
              </div>
              
              <div className="flex justify-between text-sm mt-3">
                <span className="text-gray-400">Outdoor Units</span>
                <span className="font-medium text-[#FF6B35]">{productionData.outdoorTotal.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full">
                <div 
                  className="h-full bg-[#FF6B35] rounded-full transition-all"
                  style={{ width: `${productionData.outdoorTarget ? (productionData.outdoorTotal / productionData.outdoorTarget) * 100 : 0}%` }}
                />
              </div>
              
              <div className="pt-3 border-t border-white/10">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Avg Cycle Time</span>
                  <span className="font-medium text-white">{productionData.avgCycleTime.toFixed(1)}s</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Station List */}
          <Card className="glass-panel border-white/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Assembly Stations</CardTitle>
                <div className="flex items-center gap-1">
                  {(['all', 'indoor', 'outdoor'] as const).map((line) => (
                    <button
                      key={line}
                      onClick={() => setSelectedLine(line)}
                      className={`px-2 py-0.5 rounded text-[10px] capitalize transition-colors ${
                        selectedLine === line ? 'bg-[#0066CC] text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {line}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[300px] overflow-y-auto">
                {(selectedLine === 'all' || selectedLine === 'indoor' ? indoorLineStations : []).map((station) => (
                  <button
                    key={station.id}
                    onClick={() => handleStationClick(station.id)}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${
                      selectedStation === station.id ? 'bg-white/10' : ''
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${statusToUIClass(station.status)}`} />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{station.id}</p>
                      <p className="text-xs text-gray-500 truncate">{station.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{station.efficiency}%</p>
                      <p className="text-xs text-gray-500">{station.productionCount}</p>
                    </div>
                  </button>
                ))}
                {(selectedLine === 'all' || selectedLine === 'outdoor' ? outdoorLineStations : []).map((station) => (
                  <button
                    key={station.id}
                    onClick={() => handleStationClick(station.id)}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${
                      selectedStation === station.id ? 'bg-white/10' : ''
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${statusToUIClass(station.status)}`} />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{station.id}</p>
                      <p className="text-xs text-gray-500 truncate">{station.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{station.efficiency}%</p>
                      <p className="text-xs text-gray-500">{station.productionCount}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Edit Mode Panel */}
          {isEditMode && (
            <Card className="glass-panel border-white/10 border-[#00A3E0]/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-[#00A3E0]">
                  <Wrench className="w-4 h-4" />
                  Edit Mode Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {/* Add Station Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#00A3E0]/30 text-[#00A3E0] hover:bg-[#00A3E0]/10"
                    onClick={() => addStation('indoor')}
                  >
                    <Package className="w-3 h-3 mr-1" />
                    Add Indoor
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#FF6B35]/30 text-[#FF6B35] hover:bg-[#FF6B35]/10"
                    onClick={() => addStation('outdoor')}
                  >
                    <Package className="w-3 h-3 mr-1" />
                    Add Outdoor
                  </Button>
                </div>

                {/* Selected Station Controls */}
                {selectedEditStation && (() => {
                  const station = [...indoorLineStations, ...outdoorLineStations].find(s => s.id === selectedEditStation);
                  if (!station) return null;
                  return (
                    <div className="space-y-3 pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{station.id}</span>
                        <Badge variant="outline" className={station.line === 'indoor' ? 'border-[#00A3E0] text-[#00A3E0]' : 'border-[#FF6B35] text-[#FF6B35]'}>
                          {station.line}
                        </Badge>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-white/10 hover:bg-white/5"
                          onClick={() => duplicateStation(selectedEditStation)}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Duplicate
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={() => deleteStation(selectedEditStation)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>

                      {/* Property Editor */}
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400">Name</label>
                        <input
                          type="text"
                          value={station.name}
                          onChange={(e) => updateStation(station.id, { name: e.target.value })}
                          className="w-full px-2 py-1 text-sm bg-white/5 border border-white/10 rounded text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs text-gray-400">Operator</label>
                        <input
                          type="text"
                          value={station.operator}
                          onChange={(e) => updateStation(station.id, { operator: e.target.value })}
                          className="w-full px-2 py-1 text-sm bg-white/5 border border-white/10 rounded text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <label className="text-xs text-gray-400">Cycle Time (s)</label>
                          <input
                            type="number"
                            value={station.cycleTime}
                            onChange={(e) => updateStation(station.id, { cycleTime: parseInt(e.target.value) || 0 })}
                            className="w-full px-2 py-1 text-sm bg-white/5 border border-white/10 rounded text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-gray-400">Target (s)</label>
                          <input
                            type="number"
                            value={station.targetCycleTime}
                            onChange={(e) => updateStation(station.id, { targetCycleTime: parseInt(e.target.value) || 0 })}
                            className="w-full px-2 py-1 text-sm bg-white/5 border border-white/10 rounded text-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs text-gray-400">Status</label>
                        <select
                          value={station.status}
                          onChange={(e) => updateStation(station.id, { status: e.target.value as StationStatus })}
                          className="w-full px-2 py-1 text-sm bg-white/5 border border-white/10 rounded text-white"
                        >
                          <option value="running">Running</option>
                          <option value="waiting">Waiting</option>
                          <option value="error">Error</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </div>

                      {/* Position Display */}
                      <div className="text-xs text-gray-500 pt-2">
                        Position: X: {station.position[0].toFixed(1)}, Z: {station.position[2].toFixed(1)}
                      </div>
                    </div>
                  );
                })()}

                {!selectedEditStation && (
                  <p className="text-xs text-gray-500 text-center py-4">
                    Select a station in the 3D view to edit its properties
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Alerts Panel */}
          <Card className="glass-panel border-white/10 border-orange-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Active Alerts ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className={`p-2 rounded-lg border text-xs ${
                      alert.type === 'critical' 
                        ? 'bg-red-500/10 border-red-500/20' 
                        : alert.type === 'warning'
                        ? 'bg-orange-500/10 border-orange-500/20'
                        : 'bg-blue-500/10 border-blue-500/20'
                    }`}
                  >
                    <div className={`font-medium ${
                      alert.type === 'critical' ? 'text-red-400' : alert.type === 'warning' ? 'text-orange-400' : 'text-blue-400'
                    }`}>
                      {alert.stationId}
                    </div>
                    <div className="text-gray-400">{alert.message}</div>
                    <div className="text-gray-500 mt-1">{alert.time}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* IoT Sensors */}
          {selectedStation && (
            <Card className="glass-panel border-white/10 border-[#00A3E0]/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#00A3E0]" />
                  IoT Sensors: {selectedStation}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {(() => {
                  const station = [...indoorLineStations, ...outdoorLineStations].find(s => s.id === selectedStation);
                  if (!station) return null;
                  
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Thermometer className="w-3 h-3" /> Temperature
                        </span>
                        <span className={`text-sm font-medium ${station.temperature > 70 ? 'text-red-400' : 'text-white'}`}>
                          {station.temperature.toFixed(1)}°C
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Activity className="w-3 h-3" /> Vibration
                        </span>
                        <span className="text-sm font-medium text-white">{station.vibration.toFixed(1)} mm/s</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Power
                        </span>
                        <span className="text-sm font-medium text-white">{station.powerConsumption.toFixed(1)} kW</span>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Selected Station Details */}
      {selectedStation && (
        <Card className="glass-panel border-white/10 animate-item">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              {(() => {
                const station = [...indoorLineStations, ...outdoorLineStations].find(s => s.id === selectedStation);
                if (!station) return null;
                
                return (
                  <>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg ${statusToUIClass(station.status)} flex items-center justify-center`}>
                        <Wrench className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{station.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {station.id} • {station.line === 'indoor' ? 'Indoor Unit Line' : 'Outdoor Unit Line'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusToUIClass(station.status)}>
                        {station.status}
                      </Badge>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0]"
                        onClick={() => setSelectedStation(null)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Close
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {(() => {
              const station = [...indoorLineStations, ...outdoorLineStations].find(s => s.id === selectedStation);
              if (!station) return null;
              
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-[#00A3E0]" />
                      <span className="text-sm text-gray-400">Operator</span>
                    </div>
                    <p className="text-xl font-bold">{station.operator}</p>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-[#FF6B35]" />
                      <span className="text-sm text-gray-400">Cycle Time</span>
                    </div>
                    <p className={`text-xl font-bold ${station.cycleTime > station.targetCycleTime ? 'text-red-400' : 'text-white'}`}>
                      {station.cycleTime}s
                    </p>
                    <p className="text-xs text-gray-500">Target: {station.targetCycleTime}s</p>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-[#00C853]" />
                      <span className="text-sm text-gray-400">Production</span>
                    </div>
                    <p className="text-xl font-bold">{station.productionCount}</p>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-[#FFD600]" />
                      <span className="text-sm text-gray-400">Efficiency</span>
                    </div>
                    <p className={`text-xl font-bold ${station.efficiency < 80 ? 'text-red-400' : 'text-white'}`}>
                      {station.efficiency}%
                    </p>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="w-4 h-4 text-[#FF6B35]" />
                      <span className="text-sm text-gray-400">Temperature</span>
                    </div>
                    <p className={`text-xl font-bold ${station.temperature > 70 ? 'text-red-400' : 'text-white'}`}>
                      {station.temperature.toFixed(1)}°C
                    </p>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-[#FFD600]" />
                      <span className="text-sm text-gray-400">Power</span>
                    </div>
                    <p className="text-xl font-bold">{station.powerConsumption.toFixed(1)} kW</p>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
