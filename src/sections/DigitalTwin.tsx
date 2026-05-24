import {
  useMemo,
  useState,
  useRef,
  useEffect,
  Suspense,
  useCallback,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import { useTranslation } from '../utils/translations';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import {
  OrbitControls,
  Box,
  Sphere,
  Html,
  PerspectiveCamera,
  Grid,
  Line,
  Environment,
  ContactShadows,
  AccumulativeShadows,
  RandomizedLight,
  GizmoHelper,
  GizmoViewport,
  Sparkles,
  Float,
} from '@react-three/drei';
import * as THREE from 'three';
import {
  Box as BoxIcon,
  Activity,
  Thermometer,
  Wind,
  Zap,
  AlertTriangle,
  RefreshCw,
  Camera,
  Settings,
  Eye,
  EyeOff,
  Play,
  Pause,
  Factory,
  BarChart3,
  Maximize2,
  X,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Wrench
} from 'lucide-react';
import { gsap } from 'gsap';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  LineChart as RechartsLineChart,
  Line as RechartsLine,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import ACFactoryDigitalTwin from './ACFactoryDigitalTwin';
import { productionLayoutApi, type ProductionLayoutData } from '@/api/production-layout';

const DEFAULT_MACHINE_DIMENSIONS = {
  width: 2.8,
  depth: 2.0,
  height: 1.8
};

// =====================================================================================
// ARCHITECTURE NOTE
// - Keep business/telemetry logic (machines + simulation) in the main component.
// - Keep 3D presentation in small reusable scene components.
// - No external assets (GLTF/HDR files) are required; visuals are procedural.
// =====================================================================================

type MachineStatus = 'running' | 'idle' | 'stopped' | 'alarm';

type DigitalTwinMachine = {
  id: string;
  name: string;
  line: string;
  status: MachineStatus;
  oee: number;
  temperature: number;
  vibration: number;
  pressure: number;
  position: [number, number, number];
  width?: number;
  depth?: number;
  height?: number;
};

type TelemetryPoint = {
  time: string;
  timestamp: number;
  oee: number;
  temperature: number;
  vibration: number;
  pressure: number;
};

type AlertEvent = {
  id: string;
  machineId: string;
  type: 'warning' | 'critical' | 'info';
  message: string;
  timestamp: number;
  time: string;
  metric: string;
  value: number;
};

type PublishedLayoutMode =
  | { kind: 'legacy' }
  | { kind: 'ac-factory' }
  | { kind: 'layout'; layoutId: string };

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

function modeKey(mode: PublishedLayoutMode) {
  if (mode.kind === 'layout') return `layout:${mode.layoutId}`;
  return mode.kind;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function toScenePosition(base: [number, number, number]): [number, number, number] {
  return [base[0], base[1] - 0.75, base[2] + 2];
}

function toBasePosition(scene: [number, number, number]): [number, number, number] {
  return [scene[0], scene[1] + 0.75, scene[2] - 2];
}

function DraggableMachine({
  machine,
  showLabels,
  isEditMode,
  isSelected,
  onSelect,
  onPositionChange,
  liteMode
}: {
  machine: DigitalTwinMachine;
  showLabels: boolean;
  isEditMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onPositionChange: (nextBasePosition: [number, number, number]) => void;
  liteMode?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPlane, setDragPlane] = useState<THREE.Plane | null>(null);
  const { camera, raycaster, pointer } = useThree();

  const scenePos = useMemo(() => toScenePosition(machine.position), [machine.position]);

  useEffect(() => {
    if (groupRef.current && !isDragging) {
      groupRef.current.position.set(...scenePos);
    }
  }, [scenePos, isDragging]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onSelect();
    if (!isEditMode) return;
    setIsDragging(true);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -scenePos[1]);
    setDragPlane(plane);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !dragPlane || !groupRef.current) return;
    e.stopPropagation();
    raycaster.setFromCamera(pointer, camera);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlane, target);

    if (target) {
      const snappedX = Math.round(target.x * 2) / 2;
      const snappedZ = Math.round(target.z * 2) / 2;
      groupRef.current.position.set(snappedX, scenePos[1], snappedZ);
    }
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !groupRef.current) return;
    e.stopPropagation();
    setIsDragging(false);
    setDragPlane(null);

    const nextScene: [number, number, number] = [
      groupRef.current.position.x,
      scenePos[1],
      groupRef.current.position.z
    ];
    onPositionChange(toBasePosition(nextScene));
  };

  const w = machine.width ?? DEFAULT_MACHINE_DIMENSIONS.width;
  const d = machine.depth ?? DEFAULT_MACHINE_DIMENSIONS.depth;
  const h = machine.height ?? DEFAULT_MACHINE_DIMENSIONS.height;

  return (
    <group
      ref={groupRef}
      position={scenePos}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {isEditMode && isSelected && (
        <Box args={[w + 0.6, 0.08, d + 0.6]} position={[0, -0.62, 0]}>
          <meshBasicMaterial color="#00A3E0" transparent opacity={0.35} />
        </Box>
      )}

      {isEditMode && (
        <Box args={[w, 0.04, d]} position={[0, -0.58, 0]}>
          <meshBasicMaterial color={isDragging ? "#00C853" : "#FFD600"} transparent opacity={0.18} />
        </Box>
      )}

      {isEditMode && (
        <Box args={[w, h, d]} position={[0, -0.58 + h / 2, 0]}>
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.08} />
        </Box>
      )}

      <group>
        <MachineAsset machine={machine} liteMode={liteMode} />
        {showLabels && <HologramLabel machine={machine} />}
      </group>
    </group>
  );
}

function Layout2DViewer({ layout }: { layout: ProductionLayoutData }) {
  const doc = (layout.layout as any) as { nodes?: any[]; gridSize?: number };
  const nodes = Array.isArray(doc?.nodes) ? doc.nodes : [];
  const gridSize = Number(doc?.gridSize || 20);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewScale, setViewScale] = useState(1);
  const [viewPan, setViewPan] = useState({ x: 0, y: 0 });
  const viewScaleRef = useRef(viewScale);
  viewScaleRef.current = viewScale;
  const viewPanRef = useRef(viewPan);
  viewPanRef.current = viewPan;

  const panningRef = useRef<{
    startX: number;
    startY: number;
    panX: number;
    panY: number;
  } | null>(null);

  const contentBounds = useMemo(() => {
    if (nodes.length === 0) return { w: 1280, h: 720 };
    let maxR = 0;
    let maxB = 0;
    for (const n of nodes) {
      const x = Number(n?.x || 0);
      const y = Number(n?.y || 0);
      const w = Number(n?.w || 120);
      const h = Number(n?.h || 60);
      maxR = Math.max(maxR, x + w);
      maxB = Math.max(maxB, y + h);
    }
    const pad = 160;
    return { w: Math.max(1280, maxR + pad), h: Math.max(720, maxB + pad) };
  }, [nodes]);

  const stopPan = useCallback(() => {
    panningRef.current = null;
  }, []);

  const onViewportPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Left-drag on empty area pans.
    if (e.button !== 0) return;
    if (e.target !== e.currentTarget) return;
    e.preventDefault();

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const p = viewPanRef.current;
    panningRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      panX: p.x,
      panY: p.y,
    };
  };

  const onViewportPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const pan = panningRef.current;
    if (!pan) return;
    e.preventDefault();
    const dx = e.clientX - pan.startX;
    const dy = e.clientY - pan.startY;
    setViewPan({ x: pan.panX + dx, y: pan.panY + dy });
  };

  const onViewportPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (panningRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    }
    stopPan();
  };

  const onViewportWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const el = viewportRef.current;
    if (!el) return;

    const isZoomGesture = e.ctrlKey || e.metaKey;
    if (!isZoomGesture) {
      setViewPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      return;
    }

    const rect = el.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    const currentScale = viewScaleRef.current;
    const currentPan = viewPanRef.current;
    const factor = e.deltaY > 0 ? 0.9 : 1.11;
    const nextScale = Math.min(2.75, Math.max(0.35, currentScale * factor));

    const contentX = (clientX - rect.left - currentPan.x) / currentScale;
    const contentY = (clientY - rect.top - currentPan.y) / currentScale;
    const nextPanX = clientX - rect.left - contentX * nextScale;
    const nextPanY = clientY - rect.top - contentY * nextScale;

    setViewScale(nextScale);
    setViewPan({ x: nextPanX, y: nextPanY });
  };

  return (
    <div
      ref={viewportRef}
      className="w-full h-[70vh] rounded-xl overflow-hidden border border-white/10 bg-black/20 relative touch-none select-none"
      onPointerDown={onViewportPointerDown}
      onPointerMove={onViewportPointerMove}
      onPointerUp={onViewportPointerUp}
      onPointerLeave={onViewportPointerUp}
      onWheel={onViewportWheel}
    >
      <div
        className="relative origin-top-left"
        style={{
          width: contentBounds.w,
          height: contentBounds.h,
          transform: `translate(${viewPan.x}px, ${viewPan.y}px) scale(${viewScale})`,
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }}
        />

        {nodes.map((node: any) => (
          <div
            key={String(node.id)}
            className="absolute rounded-lg border border-white/10 shadow-sm"
            style={{
              left: Number(node.x || 0),
              top: Number(node.y || 0),
              width: Number(node.w || 120),
              height: Number(node.h || 60),
              background: node.color || 'rgba(255,255,255,0.06)',
            }}
          >
            <div className="px-3 py-2">
              <div className="text-white text-sm font-medium truncate">{node.name}</div>
              <div className="text-gray-300 text-xs">{node.type}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const machineLayout: Array<Pick<DigitalTwinMachine, 'id' | 'position'>> = [];

const machinesData: Omit<DigitalTwinMachine, 'position'>[] = [];

function clamp(num: number, min: number, max: number) {
  return Math.min(max, Math.max(min, num));
}

function statusToColor(status: MachineStatus) {
  switch (status) {
    case 'running':
      return '#00e676';
    case 'idle':
      return '#ffea00';
    case 'stopped':
      return '#ff1744';
    case 'alarm':
      return '#ff4d00';
    default:
      return '#94a3b8';
  }
}

function statusToUIClass(status: MachineStatus) {
  switch (status) {
    case 'running':
      return 'bg-[#00e676] shadow-[0_0_15px_rgba(0,230,118,0.5)]';
    case 'idle':
      return 'bg-[#ffea00] shadow-[0_0_15px_rgba(255,234,0,0.5)]';
    case 'stopped':
      return 'bg-[#ff1744] shadow-[0_0_15px_rgba(255,23,68,0.5)]';
    case 'alarm':
      return 'bg-[#ff4d00] shadow-[0_0_15px_rgba(255,77,0,0.5)]';
    default:
      return 'bg-gray-500';
  }
}

function HologramLabel({ machine }: { machine: DigitalTwinMachine }) {
  return (
    <Float speed={1.15} rotationIntensity={0.12} floatIntensity={0.35}>
      <Html position={[0, 2.1, 0]} center distanceFactor={10} transform>
        <div className="select-none min-w-[170px] rounded-xl border border-[#00A3E0]/25 bg-[#070b16]/85 backdrop-blur px-3 py-2 shadow-[0_0_30px_rgba(0,163,224,0.15)]">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-white">{machine.id}</div>
            <div className="text-[10px] text-gray-300">OEE {machine.oee}%</div>
          </div>
          <div className="mt-1 grid grid-cols-3 gap-2 text-[10px]">
            <div className="text-gray-300">
              <div className="text-gray-500">Temp</div>
              <div className="text-white">{machine.temperature}°C</div>
            </div>
            <div className="text-gray-300">
              <div className="text-gray-500">Vib</div>
              <div className="text-white">{machine.vibration}</div>
            </div>
            <div className="text-gray-300">
              <div className="text-gray-500">Press</div>
              <div className="text-white">{machine.pressure}</div>
            </div>
          </div>
        </div>
      </Html>
    </Float>
  );
}

function MachineStatusBeacon({ status, selected }: { status: MachineStatus; selected: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pulse = status === 'alarm' ? (Math.sin(t * 6) * 0.5 + 0.5) : status === 'running' ? (Math.sin(t * 2) * 0.2 + 0.8) : 0.35;
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + pulse * 0.25 + (selected ? 0.15 : 0));
    }
    if (lightRef.current) {
      lightRef.current.intensity = 0.4 + pulse * 0.9 + (selected ? 0.5 : 0);
    }
  });

  const color = statusToColor(status);
  return (
    <group position={[0, 1.25, 0]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.1} roughness={0.2} metalness={0.1} />
      </mesh>
      <pointLight ref={lightRef} color={color} distance={4.5} intensity={0.9} />
    </group>
  );
}

function CNCModel({ status }: { status: MachineStatus }) {
  const spindleRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!spindleRef.current) return;
    if (status === 'running') spindleRef.current.rotation.z = clock.elapsedTime * 5;
    else spindleRef.current.rotation.z *= 0.98;
  });

  return (
    <group>
      <Box args={[2.2, 1.4, 1.4]} position={[0, 0.2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#111827" metalness={0.65} roughness={0.35} />
      </Box>
      <Box args={[1.6, 0.9, 1.2]} position={[0.2, 0.85, 0]} castShadow>
        <meshStandardMaterial color="#0b1224" metalness={0.85} roughness={0.2} />
      </Box>
      <Box args={[0.75, 0.55, 0.15]} position={[-0.65, 0.9, 0.78]} castShadow>
        <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.05} emissive="#00A3E0" emissiveIntensity={0.14} />
      </Box>
      <mesh ref={spindleRef} position={[0.9, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.9, 18]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
      </mesh>
      <Box args={[2.4, 0.12, 1.6]} position={[0, -0.55, 0]} receiveShadow>
        <meshStandardMaterial color="#0b1020" metalness={0.25} roughness={0.85} />
      </Box>
    </group>
  );
}

function PressModel({ status }: { status: MachineStatus }) {
  const ramRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ramRef.current) return;
    const t = clock.elapsedTime;
    if (status === 'running' || status === 'alarm') {
      ramRef.current.position.y = 0.5 + (Math.sin(t * 3) * 0.15);
    }
  });

  return (
    <group>
      <Box args={[2.1, 1.8, 1.5]} position={[0, 0.3, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0b1224" metalness={0.55} roughness={0.4} />
      </Box>
      <mesh ref={ramRef} position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 1.0, 22]} />
        <meshStandardMaterial color="#d1d5db" metalness={0.95} roughness={0.18} />
      </mesh>
      <Box args={[2.25, 0.18, 1.7]} position={[0, -0.7, 0]} receiveShadow>
        <meshStandardMaterial color="#0b1020" metalness={0.25} roughness={0.85} />
      </Box>
    </group>
  );
}

function RobotArmModel({ status }: { status: MachineStatus }) {
  const joint1 = useRef<THREE.Group>(null);
  const joint2 = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!joint1.current || !joint2.current) return;
    const t = clock.elapsedTime;
    const a = status === 'running' ? Math.sin(t * 1.5) * 0.45 : Math.sin(t * 0.6) * 0.12;
    const b = status === 'running' ? Math.cos(t * 1.2) * 0.55 : Math.cos(t * 0.5) * 0.1;
    joint1.current.rotation.y = a;
    joint2.current.rotation.z = b;
  });

  return (
    <group>
      <Box args={[1.4, 0.5, 1.2]} position={[0, -0.1, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#111827" metalness={0.55} roughness={0.5} />
      </Box>
      <group ref={joint1} position={[0, 0.25, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.22, 0.26, 0.55, 18]} />
          <meshStandardMaterial color="#0b1224" metalness={0.85} roughness={0.2} />
        </mesh>
        <group ref={joint2} position={[0, 0.3, 0]}>
          <Box args={[0.18, 1.0, 0.18]} position={[0, 0.5, 0]} castShadow>
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.22} />
          </Box>
          <Box args={[0.18, 0.75, 0.18]} position={[0.25, 1.0, 0]} castShadow>
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.22} />
          </Box>
          <Sphere args={[0.12, 18, 18]} position={[0.35, 1.35, 0]} castShadow>
            <meshStandardMaterial color="#00A3E0" emissive="#00A3E0" emissiveIntensity={0.25} metalness={0.2} roughness={0.25} />
          </Sphere>
        </group>
      </group>
    </group>
  );
}

function Conveyor({ length = 3.2, status }: { length?: number; status: MachineStatus }) {
  const beltRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!beltRef.current) return;
    const speed = status === 'running' ? 0.6 : status === 'alarm' ? 0.25 : 0;
    if (speed === 0) return;
    const mat = beltRef.current.material as THREE.MeshStandardMaterial;
    if (!mat.map) return;
    mat.map.offset.x = (clock.elapsedTime * speed) % 1;
  });

  const beltTex = useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#0b1224';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 10;
    for (let x = -size; x < size * 2; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + size, size);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 1);
    tex.anisotropy = 4;
    return tex;
  }, []);

  return (
    <group>
      <Box args={[length, 0.15, 0.8]} position={[0, -0.2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#111827" metalness={0.6} roughness={0.5} />
      </Box>
      <mesh ref={beltRef} position={[0, -0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[length * 0.96, 0.08, 0.65]} />
        <meshStandardMaterial map={beltTex ?? undefined} color="#0b1224" metalness={0.2} roughness={0.85} />
      </mesh>
      <Box args={[0.25, 0.25, 0.9]} position={[-length / 2 + 0.15, -0.2, 0]} castShadow>
        <meshStandardMaterial color="#0b1224" metalness={0.8} roughness={0.35} />
      </Box>
      <Box args={[0.25, 0.25, 0.9]} position={[length / 2 - 0.15, -0.2, 0]} castShadow>
        <meshStandardMaterial color="#0b1224" metalness={0.8} roughness={0.35} />
      </Box>
    </group>
  );
}

function MachineAsset({ machine, liteMode }: { machine: DigitalTwinMachine; liteMode?: boolean }) {
  const color = statusToColor(machine.status);
  const selected = false;
  const emissiveIntensity = machine.status === 'alarm' ? 0.45 : machine.status === 'running' ? 0.25 : 0.08;

  const bodyAccent = (
    <Box args={[2.6, 0.06, 1.7]} position={[0, -0.78, 0]} receiveShadow={!liteMode}>
      <meshStandardMaterial color="#0a0f1c" metalness={0.15} roughness={0.95} />
    </Box>
  );

  return (
    <group>
      {machine.id.startsWith('CNC') && <CNCModel status={machine.status} />}
      {machine.id.startsWith('Press') && <PressModel status={machine.status} />}
      {machine.id.startsWith('Weld') && <RobotArmModel status={machine.status} />}
      {machine.id.startsWith('Pack') && (
        <group>
          <Box args={[2.0, 1.2, 1.6]} position={[0, 0.1, 0]} castShadow={!liteMode} receiveShadow={!liteMode}>
            <meshStandardMaterial color="#111827" metalness={0.55} roughness={0.45} />
          </Box>
          <Conveyor length={3.0} status={machine.status} />
        </group>
      )}
      {machine.id.startsWith('Assembly') && (
        <group>
          <Box args={[1.9, 0.8, 1.3]} position={[0, 0.0, 0]} castShadow={!liteMode} receiveShadow={!liteMode}>
            <meshStandardMaterial color="#0b1224" metalness={0.55} roughness={0.4} />
          </Box>
          <Conveyor length={3.4} status={machine.status} />
        </group>
      )}
      {machine.id.startsWith('QC') && (
        <group>
          <Box args={[1.8, 0.9, 1.2]} position={[0, 0.0, 0]} castShadow={!liteMode} receiveShadow={!liteMode}>
            <meshStandardMaterial color="#0b1224" metalness={0.6} roughness={0.35} />
          </Box>
          <Box args={[0.3, 1.1, 0.3]} position={[0.7, 0.3, 0.5]} castShadow={!liteMode}>
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.2} />
          </Box>
          <Box args={[0.25, 0.25, 1.4]} position={[0.0, 0.65, 0.0]} castShadow={!liteMode}>
            <meshStandardMaterial color="#00A3E0" emissive="#00A3E0" emissiveIntensity={0.18} />
          </Box>
        </group>
      )}

      {bodyAccent}

      <MachineStatusBeacon status={machine.status} selected={selected} />

      <mesh position={[0, 0.45, 0]}>
        <ringGeometry args={[0.7, 0.78, 48, 1, 0, (machine.oee / 100) * Math.PI * 2]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.9} />
      </mesh>
      {!liteMode && (
        <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.9, 48]} />
          <meshBasicMaterial color={color} transparent opacity={0.06} />
        </mesh>
      )}

      <pointLight color={color} intensity={emissiveIntensity} distance={5} position={[0, 0.8, 0]} />
    </group>
  );
}

function FactoryShell() {
  const floorTex = useMemo(() => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#0a0f1c';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= size; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }

    // safety markings
    ctx.strokeStyle = 'rgba(255,214,0,0.55)';
    ctx.lineWidth = 6;
    ctx.setLineDash([18, 10]);
    ctx.strokeRect(60, 60, size - 120, size - 120);
    ctx.setLineDash([]);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    tex.anisotropy = 8;
    return tex;
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 2]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial map={floorTex ?? undefined} color="#0a0f1c" metalness={0.05} roughness={0.95} />
      </mesh>

      {/* walls */}
      <Box args={[60, 12, 0.4]} position={[0, 4, -16]} receiveShadow>
        <meshStandardMaterial color="#05070d" metalness={0.1} roughness={0.95} />
      </Box>
      <Box args={[0.4, 12, 34]} position={[-18, 4, 1]} receiveShadow>
        <meshStandardMaterial color="#05070d" metalness={0.1} roughness={0.95} />
      </Box>
      <Box args={[0.4, 12, 34]} position={[18, 4, 1]} receiveShadow>
        <meshStandardMaterial color="#05070d" metalness={0.1} roughness={0.95} />
      </Box>

      {/* ceiling */}
      <Box args={[60, 0.5, 34]} position={[0, 10, 1]} receiveShadow>
        <meshStandardMaterial color="#03050a" metalness={0.15} roughness={0.98} />
      </Box>

      {/* pillars */}
      {[-15, -8, 0, 8, 15].map((x) =>
        [-10, 0, 10].map((z) => (
          <Box key={`${x}-${z}`} args={[0.6, 12, 0.6]} position={[x, 4, z]} castShadow receiveShadow>
            <meshStandardMaterial color="#0b1224" metalness={0.2} roughness={0.9} />
          </Box>
        ))
      )}

      {/* ceiling lights */}
      {[-12, -4, 4, 12].map((x) =>
        [-6, 2, 10].map((z) => (
          <group key={`l-${x}-${z}`} position={[x, 9.2, z]}>
            <Box args={[3.4, 0.1, 0.35]} castShadow>
              <meshStandardMaterial color="#0b1224" metalness={0.6} roughness={0.4} />
            </Box>
            <Box args={[3.2, 0.05, 0.25]} position={[0, -0.08, 0]}>
              <meshStandardMaterial color="#e5e7eb" emissive="#e5e7eb" emissiveIntensity={0.7} />
            </Box>
            <pointLight intensity={0.8} distance={18} position={[0, -0.6, 0]} color="#dbeafe" />
          </group>
        ))
      )}

      {/* pipes/cable trays */}
      <mesh position={[0, 8.2, -6]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 42, 20]} />
        <meshStandardMaterial color="#111827" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, 8.2, 6]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 42, 20]} />
        <meshStandardMaterial color="#111827" metalness={0.85} roughness={0.25} />
      </mesh>
      <Box args={[42, 0.25, 0.8]} position={[0, 8.7, 0]}>
        <meshStandardMaterial color="#0b1224" metalness={0.65} roughness={0.45} />
      </Box>
    </group>
  );
}

function ProductionFlow({ machines, enabled }: { machines: DigitalTwinMachine[]; enabled: boolean }) {
  const itemsRef = useRef<THREE.InstancedMesh>(null);
  const path = useMemo(() => {
    const byId = new Map(machines.map((m) => [m.id, m] as const));
    const order = ['CNC-001', 'CNC-002', 'Assembly-001', 'QC-001', 'Pack-001'];
    const points = order
      .map((id) => byId.get(id)?.position)
      .filter((p): p is [number, number, number] => !!p)
      .map((p) => new THREE.Vector3(p[0], -0.9, p[2]));
    return points;
  }, [machines]);

  const curve = useMemo(() => {
    if (path.length < 2) return null;
    return new THREE.CatmullRomCurve3(path, false, 'catmullrom', 0.25);
  }, [path]);

  useFrame(({ clock }) => {
    if (!enabled) return;
    if (!itemsRef.current || !curve) return;
    const t = clock.elapsedTime;
    const dummy = new THREE.Object3D();
    const count = itemsRef.current.count;
    for (let i = 0; i < count; i++) {
      const u = ((t * 0.06) + i / count) % 1;
      const p = curve.getPointAt(u);
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(0, t * 0.6 + i, 0);
      const s = 0.18 + Math.sin((u + t) * Math.PI * 2) * 0.02;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      itemsRef.current.setMatrixAt(i, dummy.matrix);
    }
    itemsRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!curve) return null;

  return (
    <group>
      <Line points={curve.getPoints(60).map((p) => [p.x, p.y, p.z])} color="#00A3E0" lineWidth={2} transparent opacity={0.35} />
      <instancedMesh ref={itemsRef} args={[undefined as unknown as THREE.BufferGeometry, undefined as unknown as THREE.Material, 22]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#00A3E0" emissive="#00A3E0" emissiveIntensity={1.25} roughness={0.25} metalness={0.15} />
      </instancedMesh>
    </group>
  );
}

function CameraDirector({
  focus,
  autoRotate,
  onControlsReady
}: {
  focus: { position: THREE.Vector3; target: THREE.Vector3 } | null;
  autoRotate: boolean;
  onControlsReady: (controls: any) => void;
}) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (controlsRef.current) onControlsReady(controlsRef.current);
  }, [onControlsReady]);

  useEffect(() => {
    if (!focus) return;
    const controls = controlsRef.current;
    if (!controls) return;

    const from = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
      tx: controls.target.x,
      ty: controls.target.y,
      tz: controls.target.z
    };

    const to = {
      x: focus.position.x,
      y: focus.position.y,
      z: focus.position.z,
      tx: focus.target.x,
      ty: focus.target.y,
      tz: focus.target.z
    };

    const tween = gsap.to(from, {
      ...to,
      duration: 1.05,
      ease: 'power3.out',
      onUpdate: () => {
        camera.position.set(from.x, from.y, from.z);
        controls.target.set(from.tx, from.ty, from.tz);
        controls.update();
      }
    });

    return () => {
      tween.kill();
    };
  }, [focus, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      enableZoom
      enableRotate
      enableDamping
      dampingFactor={0.08}
      minDistance={6}
      maxDistance={36}
      maxPolarAngle={Math.PI / 2.02}
      autoRotate={autoRotate}
      autoRotateSpeed={0.35}
    />
  );
}

function FactoryFloor({
  machines,
  showLabels,
  isSimulationRunning,
  selectedMachine,
  onSelect,
  isEditMode,
  selectedEditMachine,
  onEditSelect,
  onMachinePositionChange,
  referencePoints,
  selectedReferenceId,
  onPickReference,
  liteMode = false
}: {
  machines: DigitalTwinMachine[];
  showLabels: boolean;
  isSimulationRunning: boolean;
  selectedMachine: string | null;
  onSelect: (id: string) => void;
  isEditMode: boolean;
  selectedEditMachine: string | null;
  onEditSelect: (id: string) => void;
  onMachinePositionChange: (id: string, nextBasePosition: [number, number, number]) => void;
  referencePoints: { id: string; position: [number, number, number] }[];
  selectedReferenceId: string | null;
  onPickReference: (id: string) => void;
  liteMode?: boolean;
}) {
  return (
    <>
      <FactoryShell />

      {/* Floor helper grid */}
      <Grid position={[0, -1.95, 2]} args={[50, 50]} cellSize={1} cellThickness={0.45} cellColor="#0066CC" sectionSize={5} sectionThickness={1} sectionColor="#00A3E0" fadeDistance={30} fadeStrength={1} />
      
      {/* Machines */}
      {machines.map((m) => (
        <group key={m.id}>
          <DraggableMachine
            machine={m}
            showLabels={showLabels}
            isEditMode={isEditMode}
            isSelected={selectedEditMachine === m.id}
            onSelect={() => {
              onSelect(m.id);
              onEditSelect(m.id);
            }}
            onPositionChange={(pos) => onMachinePositionChange(m.id, pos)}
            liteMode={liteMode}
          />

          {!isEditMode && selectedMachine === m.id && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[m.position[0], m.position[1] - 1.37, m.position[2] + 2]}>
              <ringGeometry args={[1.25, 1.45, 64]} />
              <meshBasicMaterial color="#00A3E0" transparent opacity={0.65} />
            </mesh>
          )}
        </group>
      ))}

      {/* Connection Lines */}
      <Line
        points={[[-6, -1.5, 2], [-3, -1.5, 2], [0, -1.5, 2], [3, -1.5, 2]]}
        color="#00A3E0"
        lineWidth={2}
      />
      <Line
        points={[[-6, -1.5, 7], [-3, -1.5, 7], [0, -1.5, 7], [3, -1.5, 7]]}
        color="#00A3E0"
        lineWidth={2}
      />

      {/* production flow */}
      <ProductionFlow machines={machines} enabled={isSimulationRunning} />

      {referencePoints.map((p) => (
        <ReferenceMarker
          key={p.id}
          position={p.position}
          selected={selectedReferenceId === p.id}
          onPick={() => onPickReference(p.id)}
        />
      ))}

      {/* subtle particles - Disabled in Lite Mode */}
      {!liteMode && <Sparkles count={45} scale={[45, 15, 30]} size={1.4} speed={0.25} opacity={0.18} color="#00A3E0" />}

      {/* Lighting */}
      <ambientLight intensity={0.18} />
      <directionalLight
        position={[14, 22, 10]}
        intensity={1.35}
        castShadow={!liteMode}
        shadow-mapSize-width={liteMode ? 256 : 2048}
        shadow-mapSize-height={liteMode ? 256 : 2048}
        shadow-camera-near={1}
        shadow-camera-far={70}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <pointLight position={[-12, 8, -10]} intensity={0.35} color="#00A3E0" />

      {!liteMode && (
        <AccumulativeShadows temporal frames={45} alphaTest={0.9} opacity={0.75} scale={40} position={[0, -2, 2]}>
          <RandomizedLight amount={8} radius={10} ambient={0.45} intensity={1.2} position={[12, 18, 8]} bias={0.001} />
        </AccumulativeShadows>
      )}

      <Environment preset="warehouse" />
      {!liteMode && <ContactShadows position={[0, -1.2, 2]} opacity={0.35} blur={2.6} far={24} />}

      {/* Pause overlay */}
      {!isSimulationRunning && (
        <Html center>
          <div className="px-3 py-1.5 rounded bg-black/70 text-white text-xs border border-white/10">
            Simulation Paused
          </div>
        </Html>
      )}
    </>
  );
}

function HeatmapView({ machines, selectedMachine, onSelect }: { machines: DigitalTwinMachine[]; selectedMachine: string | null; onSelect: (id: string) => void }) {
  const getTempColor = (t: number) => {
    if (t >= 75) return 'bg-red-500/70 border-red-500/60';
    if (t >= 55) return 'bg-orange-500/60 border-orange-500/50';
    if (t >= 40) return 'bg-yellow-500/50 border-yellow-500/40';
    return 'bg-green-500/40 border-green-500/40';
  };

  const bounds = useMemo(() => {
    const xs = machines.map((m) => m.position[0]);
    const zs = machines.map((m) => m.position[2]);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minZ: Math.min(...zs),
      maxZ: Math.max(...zs)
    };
  }, [machines]);

  const mapToPercent = (x: number, min: number, max: number) => {
    const denom = max - min || 1;
    return ((x - min) / denom) * 100;
  };

  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] to-[#06060a]" />
      <div className="absolute inset-0">
        {machines.map((m) => {
          const left = mapToPercent(m.position[0], bounds.minX - 2, bounds.maxX + 2);
          const top = mapToPercent(m.position[2], bounds.minZ - 2, bounds.maxZ + 2);
          const isSelected = selectedMachine === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-24 h-14 rounded-lg border ${getTempColor(m.temperature)} ${
                isSelected ? 'ring-2 ring-[#00A3E0]' : 'hover:ring-2 hover:ring-white/20'
              }`}
              style={{ left: `${clamp(left, 5, 95)}%`, top: `${clamp(top, 8, 92)}%` }}
            >
              <div className="text-left px-2 py-1">
                <p className="text-xs text-white font-medium">{m.id}</p>
                <p className="text-[11px] text-white/80">{m.temperature}°C</p>
              </div>
            </button>
          );
        })}
      </div>
      <div className="absolute left-3 bottom-3 text-xs text-gray-400 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
        Heatmap (Temperature)
      </div>
    </div>
  );
}

function SchematicView({ machines, selectedMachine, onSelect }: { machines: DigitalTwinMachine[]; selectedMachine: string | null; onSelect: (id: string) => void }) {
  const nodes = useMemo(() => {
    return machines.map((m) => ({
      ...m,
      x: (m.position[0] + 10) * 30,
      y: (m.position[2] + 5) * 35
    }));
  }, [machines]);

  const links = useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const pairs: Array<[string, string]> = [
      ['CNC-001', 'CNC-002'],
      ['CNC-002', 'Assembly-001'],
      ['Assembly-001', 'QC-001'],
      ['Press-001', 'Press-002'],
      ['Press-002', 'Weld-001'],
      ['Weld-001', 'Pack-001']
    ];
    return pairs
      .map(([a, b]) => ({ a: byId.get(a), b: byId.get(b) }))
      .filter((l): l is { a: (typeof nodes)[number]; b: (typeof nodes)[number] } => !!l.a && !!l.b);
  }, [nodes]);

  return (
    <div className="w-full h-full bg-[#0a0a0f] flex items-center justify-center">
      <svg width="100%" height="100%" viewBox="0 0 700 420" className="">
        <defs>
          <linearGradient id="pipe" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00A3E0" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0066CC" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        {links.map((l, idx) => (
          <line
            key={idx}
            x1={l.a.x}
            y1={l.a.y}
            x2={l.b.x}
            y2={l.b.y}
            stroke="url(#pipe)"
            strokeWidth={6}
            strokeLinecap="round"
          />
        ))}

        {nodes.map((n) => {
          const selected = selectedMachine === n.id;
          const statusColor =
            n.status === 'running' ? '#00C853' : n.status === 'idle' ? '#FFD600' : n.status === 'alarm' ? '#FF6B35' : '#FF1744';
          return (
            <g key={n.id} onClick={() => onSelect(n.id)} style={{ cursor: 'pointer' }}>
              <rect
                x={n.x - 60}
                y={n.y - 22}
                width={120}
                height={44}
                rx={10}
                fill={selected ? 'rgba(0,163,224,0.18)' : 'rgba(255,255,255,0.06)'}
                stroke={selected ? '#00A3E0' : 'rgba(255,255,255,0.12)'}
              />
              <circle cx={n.x - 45} cy={n.y} r={6} fill={statusColor} />
              <text x={n.x - 33} y={n.y + 5} fontSize={12} fill="#fff" fontFamily="ui-sans-serif">
                {n.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function AnalyticsDrawer({
  machine,
  telemetryHistory,
  alerts,
  onClose
}: {
  machine: DigitalTwinMachine;
  telemetryHistory: TelemetryPoint[];
  alerts: AlertEvent[];
  onClose: () => void;
}) {
  const { t, language } = useTranslation();
  const latest = telemetryHistory[telemetryHistory.length - 1];
  const machineAlerts = alerts.filter(a => a.machineId === machine.id).slice(0, 8);

  const metricCards = [
    { key: 'oee', label: t('oee'), unit: '%', icon: BarChart3, color: '#00A3E0', max: 100, goodUp: true },
    { key: 'temperature', label: t('temperature'), unit: '°C', icon: Thermometer, color: '#FF6B35', max: 100, goodUp: false },
    { key: 'vibration', label: t('vibration'), unit: 'mm/s', icon: Wind, color: '#00C853', max: 15, goodUp: false },
    { key: 'pressure', label: t('pressure'), unit: 'bar', icon: Zap, color: '#FFD600', max: 20, goodUp: true }
  ] as const;

  const trendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-3 h-3 text-green-400" />;
    if (current < previous) return <TrendingDown className="w-3 h-3 text-red-400" />;
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  const prev = telemetryHistory[telemetryHistory.length - 2];

  return (
    <div className="fixed inset-0 z-[300] flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl h-full bg-[#0a0f1c] border-l border-white/10 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-[#0a0f1c] to-[#0d1424]">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusToUIClass(machine.status)}`}>
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{machine.name}</h2>
              <p className="text-sm text-gray-400">{machine.id} • {machine.line}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusToUIClass(machine.status)}>
              {machine.status.toUpperCase()}
            </Badge>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {metricCards.map(({ key, label, unit, icon: Icon, color }) => {
              const value = latest?.[key as keyof TelemetryPoint] as number ?? machine[key as keyof DigitalTwinMachine] as number;
              const prevValue = prev?.[key as keyof TelemetryPoint] as number ?? value;
              const pct = Math.min((value / (key === 'oee' ? 100 : key === 'temperature' ? 100 : key === 'vibration' ? 15 : 20)) * 100, 100);
              return (
                <div key={key} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" style={{ color }} />
                      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
                    </div>
                    {trendIcon(value, prevValue)}
                  </div>
                  <div className="text-2xl font-bold text-white">{value.toFixed(key === 'oee' ? 0 : 1)}{unit}</div>
                  <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#00A3E0]" />
                  <span className="text-sm font-medium text-white">{language === 'ar' ? 'اتجاه OEE' : 'OEE Trend'}</span>
                </div>
                <span className="text-xs text-gray-500">{language === 'ar' ? 'آخر 20 نقطة' : 'Last 20 points'}</span>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={telemetryHistory}>
                    <defs>
                      <linearGradient id="oeeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00A3E0" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#00A3E0" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a0f1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      labelStyle={{ color: '#9ca3af' }}
                      itemStyle={{ color: '#00A3E0' }}
                    />
                    <Area type="monotone" dataKey="oee" stroke="#00A3E0" strokeWidth={2} fill="url(#oeeGradient)" />
                    <ReferenceLine y={85} stroke="#00C853" strokeDasharray="4 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-[#FF6B35]" />
                  <span className="text-sm font-medium text-white">{language === 'ar' ? 'اتجاه درجة الحرارة' : 'Temperature Trend'}</span>
                </div>
                <span className="text-xs text-gray-500">{language === 'ar' ? 'آخر 20 نقطة' : 'Last 20 points'}</span>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={telemetryHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[20, 95]} hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a0f1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      labelStyle={{ color: '#9ca3af' }}
                      itemStyle={{ color: '#FF6B35' }}
                    />
                    <RechartsLine type="monotone" dataKey="temperature" stroke="#FF6B35" strokeWidth={2} dot={false} />
                    <ReferenceLine y={70} stroke="#FF6B35" strokeDasharray="4 4" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-[#00C853]" />
                  <span className="text-sm font-medium text-white">{language === 'ar' ? 'اتجاه الاهتزاز' : 'Vibration Trend'}</span>
                </div>
                <span className="text-xs text-gray-500">{language === 'ar' ? 'آخر 20 نقطة' : 'Last 20 points'}</span>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={telemetryHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 15]} hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a0f1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      labelStyle={{ color: '#9ca3af' }}
                      itemStyle={{ color: '#00C853' }}
                    />
                    <RechartsLine type="monotone" dataKey="vibration" stroke="#00C853" strokeWidth={2} dot={false} />
                    <ReferenceLine y={5} stroke="#00C853" strokeDasharray="4 4" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#FFD600]" />
                  <span className="text-sm font-medium text-white">{language === 'ar' ? 'اتجاه الضغط' : 'Pressure Trend'}</span>
                </div>
                <span className="text-xs text-gray-500">{language === 'ar' ? 'آخر 20 نقطة' : 'Last 20 points'}</span>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={telemetryHistory}>
                    <defs>
                      <linearGradient id="pressGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FFD600" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#FFD600" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 20]} hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a0f1c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      labelStyle={{ color: '#9ca3af' }}
                      itemStyle={{ color: '#FFD600' }}
                    />
                    <Area type="monotone" dataKey="pressure" stroke="#FFD600" strokeWidth={2} fill="url(#pressGradient)" />
                    <ReferenceLine y={10} stroke="#FFD600" strokeDasharray="4 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00A3E0]" />
                <span className="text-sm font-medium text-white">{t('alerts-log')}</span>
              </div>
              <Badge variant="outline" className="text-xs border-white/10">
                {machineAlerts.length} {language === 'ar' ? 'تنبيهات' : 'events'}
              </Badge>
            </div>
            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {machineAlerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No alerts for this machine</p>
                </div>
              ) : (
                machineAlerts.map((alert, idx) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      alert.type === 'critical'
                        ? 'bg-red-500/10 border-red-500/30'
                        : alert.type === 'warning'
                        ? 'bg-orange-500/10 border-orange-500/30'
                        : 'bg-blue-500/10 border-blue-500/30'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      alert.type === 'critical' ? 'bg-red-500' : alert.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-medium ${
                          alert.type === 'critical' ? 'text-red-400' : alert.type === 'warning' ? 'text-orange-400' : 'text-blue-400'
                        }`}>
                          {alert.message}
                        </p>
                        <span className="text-xs text-gray-500 shrink-0">{alert.time}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {alert.metric}: {alert.value.toFixed(1)}
                      </p>
                    </div>
                    {idx < machineAlerts.length - 1 && (
                      <div className="absolute left-[19px] top-[40px] bottom-[-12px] w-px bg-white/10" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DigitalTwin() {
  const { t, language } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [viewMode, setViewMode] = useState<'3d' | 'heatmap' | 'schematic'>('3d');
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showConfigure, setShowConfigure] = useState(false);
  const [showAnalyticsDrawer, setShowAnalyticsDrawer] = useState(false);
  const [factoryMode, setFactoryMode] = useState<PublishedLayoutMode>({ kind: 'legacy' });
  const [publishedLayouts, setPublishedLayouts] = useState<ProductionLayoutData[]>([]);
  const controlsApiRef = useRef<any>(null);

  const [isLegacyEditMode, setIsLegacyEditMode] = useState(false);
  const [selectedEditMachine, setSelectedEditMachine] = useState<string | null>(null);

  const [selectedReferenceId, setSelectedReferenceId] = useState<string | null>(null);
  const [manualFocus, setManualFocus] = useState<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  const [isLiteMode, setIsLiteMode] = useState(false);
  const toggleLiteMode = useCallback(() => setIsLiteMode((prev) => !prev), []);

  const [machines, setMachines] = useState<DigitalTwinMachine[]>(() => {
    const posById = new Map(machineLayout.map((m) => [m.id, m.position] as const));
    return machinesData.map((m) => ({
      ...m,
      position: posById.get(m.id) || [0, 0, 0],
      width: DEFAULT_MACHINE_DIMENSIONS.width,
      depth: DEFAULT_MACHINE_DIMENSIONS.depth,
      height: DEFAULT_MACHINE_DIMENSIONS.height
    }));
  });

  const updateMachine = useCallback((id: string, updates: Partial<DigitalTwinMachine>) => {
    setMachines((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  }, []);

  const updateMachinePosition = useCallback((id: string, nextBasePosition: [number, number, number]) => {
    setMachines((prev) => prev.map((m) => (m.id === id ? { ...m, position: nextBasePosition } : m)));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res: any = await productionLayoutApi.getAll({ page: 1, limit: 50, isPublished: true });
        if (cancelled) return;

        const list =
          (Array.isArray(res?.data) && res.data) ||
          (Array.isArray(res?.data?.data) && res.data.data) ||
          (Array.isArray(res?.data?.items) && res.data.items) ||
          [];

        setPublishedLayouts(list);
      } catch (e: any) {
        if (cancelled) return;
        setPublishedLayouts([]);

        const message = e?.message || 'Failed to load published layouts';
        toast.error(message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [telemetryHistory, setTelemetryHistory] = useState<Record<string, TelemetryPoint[]>>(() => {
    const initial: Record<string, TelemetryPoint[]> = {};
    machinesData.forEach((m) => {
      initial[m.id] = Array.from({ length: 20 }, (_, i) => ({
        time: formatTime(Date.now() - (19 - i) * 1500),
        timestamp: Date.now() - (19 - i) * 1500,
        oee: m.oee + (Math.random() - 0.5) * 5,
        temperature: m.temperature + (Math.random() - 0.5) * 3,
        vibration: m.vibration + (Math.random() - 0.5) * 0.5,
        pressure: m.pressure + (Math.random() - 0.5) * 0.3
      }));
    });
    return initial;
  });

  const [alerts, setAlerts] = useState<AlertEvent[]>([]);

  const selectedMachineData = useMemo(
    () => machines.find((m) => m.id === selectedMachine),
    [machines, selectedMachine]
  );

  const selectedEditMachineData = useMemo(
    () => machines.find((m) => m.id === selectedEditMachine),
    [machines, selectedEditMachine]
  );

  useEffect(() => {
    if (sectionRef.current) {
      gsap.fromTo(
        sectionRef.current.querySelectorAll('.animate-item'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
      );
    }
  }, []);

  const handleRefreshData = useCallback(() => {
    setMachines((prev) =>
      prev.map((m) => {
        if (m.status === 'stopped') return m;
        const nextTemp = clamp(m.temperature + (Math.random() - 0.5) * 4, 20, 95);
        const nextOee = clamp(m.oee + (Math.random() - 0.5) * 6, 0, 100);
        const nextVibration = clamp(m.vibration + (Math.random() - 0.5) * 1.2, 0, 15);
        const nextPressure = clamp(m.pressure + (Math.random() - 0.5) * 0.9, 0, 20);
        return {
          ...m,
          temperature: Number(nextTemp.toFixed(1)),
          oee: Number(nextOee.toFixed(0)),
          vibration: Number(nextVibration.toFixed(1)),
          pressure: Number(nextPressure.toFixed(1))
        };
      })
    );
    toast.success('Refreshed', { description: 'Machine data refreshed' });
  }, []);

  const handleViewDetails = useCallback(() => {
    if (!selectedMachineData) {
      toast.info('Select a machine first');
      return;
    }
    setShowAnalyticsDrawer(true);
  }, [selectedMachineData]);

  const handleConfigure = useCallback(() => {
    if (!selectedMachineData) {
      toast.info('Select a machine first');
      return;
    }
    setShowConfigure(true);
  }, [selectedMachineData]);

  const toggleLegacyEditMode = useCallback(() => {
    setIsLegacyEditMode((prev) => {
      const next = !prev;
      if (!next) {
        setSelectedEditMachine(null);
      } else {
        setSelectedEditMachine(selectedMachine);
      }
      return next;
    });
  }, [selectedMachine]);

  const getStatusColor = (status: string) => {
    return statusToUIClass(status as MachineStatus);
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      'running': t('running'),
      'idle': t('idle'),
      'stopped': t('stopped'),
      'alarm': t('alarm')
    };
    return texts[status] || status;
  };

  useEffect(() => {
    if (!isSimulationRunning) return;
    const id = window.setInterval(() => {
      const now = Date.now();
      setMachines((prev) =>
        prev.map((m) => {
          if (m.status === 'stopped') return m;

          const drift = (base: number, range: number) => base + (Math.random() - 0.5) * range;
          const nextTemp = clamp(drift(m.temperature, m.status === 'alarm' ? 3.5 : 1.2), 20, 95);
          const nextOee = clamp(drift(m.oee, m.status === 'idle' ? 2.5 : 1.0), 0, 100);
          const nextVibration = clamp(drift(m.vibration, m.status === 'alarm' ? 1.0 : 0.3), 0, 15);
          const nextPressure = clamp(drift(m.pressure, 0.35), 0, 20);

          return {
            ...m,
            temperature: Number(nextTemp.toFixed(1)),
            oee: Number(nextOee.toFixed(0)),
            vibration: Number(nextVibration.toFixed(1)),
            pressure: Number(nextPressure.toFixed(1))
          };
        })
      );

      setTelemetryHistory((prev) => {
        const next: Record<string, TelemetryPoint[]> = {};
        Object.keys(prev).forEach((mid) => {
          const machine = machines.find((m) => m.id === mid);
          if (!machine) {
            next[mid] = prev[mid];
            return;
          }
          const history = prev[mid];
          const last20 = history.slice(-19);
          next[mid] = [
            ...last20,
            {
              time: formatTime(now),
              timestamp: now,
              oee: machine.oee,
              temperature: machine.temperature,
              vibration: machine.vibration,
              pressure: machine.pressure
            }
          ];
        });
        return next;
      });

      setAlerts((prev) => {
        const lastAlert = prev[0];
        if (!lastAlert || now - lastAlert.timestamp > 300000) {
          const alarmMachine = machines.find((m) => m.status === 'alarm');
          if (alarmMachine && Math.random() > 0.7) {
            return [
              {
                id: `alert-${now}`,
                machineId: alarmMachine.id,
                type: 'warning' as const,
                message: 'Temperature Fluctuation',
                timestamp: now,
                time: formatTime(now),
                metric: 'temperature',
                value: alarmMachine.temperature
              },
              ...prev
            ].slice(0, 50);
          }
        }
        return prev;
      });
    }, 1500);
    return () => window.clearInterval(id);
  }, [isSimulationRunning, machines]);

  const focusTarget = useMemo(() => {
    if (!selectedMachineData) return null;
    const target = new THREE.Vector3(selectedMachineData.position[0], 0.2, selectedMachineData.position[2] + 2);
    const offset = new THREE.Vector3(5.5, 4.2, 6.8);
    const pos = target.clone().add(offset);
    return { position: pos, target };
  }, [selectedMachineData]);

  const legacyReferencePoints = useMemo(() => {
    return [
      { id: 'ref-entrance', position: [-14, -1.75, 12] as [number, number, number] },
      { id: 'ref-center', position: [0, -1.75, 2] as [number, number, number] },
      { id: 'ref-line1-a', position: [-6, -1.75, 2] as [number, number, number] },
      { id: 'ref-line1-b', position: [3, -1.75, 2] as [number, number, number] },
      { id: 'ref-line2-a', position: [-6, -1.75, 7] as [number, number, number] },
      { id: 'ref-line2-b', position: [3, -1.75, 7] as [number, number, number] },
      { id: 'ref-qc', position: [8, -1.75, 2] as [number, number, number] },
      { id: 'ref-back', position: [12, -1.75, -10] as [number, number, number] },
    ];
  }, []);

  const pickLegacyReference = useCallback((id: string) => {
    const hit = legacyReferencePoints.find((p) => p.id === id);
    if (!hit) return;
    setSelectedReferenceId(id);

    const target = new THREE.Vector3(hit.position[0], 0.2, hit.position[2]);
    const offset = new THREE.Vector3(8.5, 5.2, 10.5);
    const pos = target.clone().add(offset);
    setManualFocus({ position: pos, target });
  }, [legacyReferencePoints]);

  const effectiveFocus = manualFocus ?? focusTarget;

  const handleSnapshot = useCallback(() => {
    const canvas = canvasElRef.current;
    if (!canvas) {
      toast.error('Snapshot failed', { description: '3D canvas not ready' });
      return;
    }

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `digital-twin-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
      a.click();
      toast.success('Snapshot saved');
    } catch {
      toast.error('Snapshot blocked', { description: 'Browser blocked canvas export' });
    }
  }, []);

  const handleFullscreen = useCallback(async () => {
    const el = viewportRef.current;
    if (!el) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      toast.error('Fullscreen failed');
    }
  }, []);

  return (
    <div ref={sectionRef} className="space-y-6">
      {/* Header with Factory Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-item">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#9C27B0] to-[#E91E63] flex items-center justify-center">
            <BoxIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">{t('digital-twin-title')}</h1>
            <p className="text-gray-400">{t('digital-twin-subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Factory Mode Tabs */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 mr-2 flex-wrap">
            {([
              { kind: 'legacy' } as const,
              { kind: 'ac-factory' } as const,
              ...publishedLayouts.map((l) => ({ kind: 'layout' as const, layoutId: l.id })),
            ] as PublishedLayoutMode[]).map((mode) => (
              <button
                key={modeKey(mode)}
                onClick={() => setFactoryMode(mode)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  modeKey(factoryMode) === modeKey(mode)
                    ? 'bg-[#0066CC] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {mode.kind === 'legacy'
                  ? `🏭 ${language === 'ar' ? 'تخطيط قديم' : 'Legacy Layout'}`
                  : mode.kind === 'ac-factory'
                    ? `❄️ ${language === 'ar' ? 'مصنع المكيفات (جديد)' : 'AC Factory (New)'}`
                    : `🗺️ ${publishedLayouts.find((l) => l.id === mode.layoutId)?.name ?? 'Layout'}`}
              </button>
            ))}
          </div>
          
          <Badge variant="outline" className="border-green-500 text-green-400">
            <div className={`w-2 h-2 rounded-full bg-green-500 ${language === 'ar' ? 'ml-2' : 'mr-2'} animate-pulse`} />
            {t('live-data')}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-white/10"
            onClick={() => setIsSimulationRunning(!isSimulationRunning)}
          >
            {isSimulationRunning ? <Pause className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} /> : <Play className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />}
            {isSimulationRunning ? t('pause') : t('resume')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`border-white/10 ${isLiteMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : ''}`}
            onClick={toggleLiteMode}
            title={isLiteMode ? (language === 'ar' ? "تعطيل الوضع المخفف (جودة أفضل)" : "Disable Lite Mode (Better Quality)") : (language === 'ar' ? "تفعيل الوضع المخفف (أداء أفضل)" : "Enable Lite Mode (Better Performance)")}
          >
            <Zap className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'} ${isLiteMode ? 'fill-current' : ''}`} />
            {isLiteMode ? t('lite-mode') : t('high-quality')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/10"
            onClick={() => setShowSettings(true)}
          >
            <Settings className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {t('settings')}
          </Button>
        </div>
      </div>

      {factoryMode.kind === 'ac-factory' ? (
        <ACFactoryDigitalTwin />
      ) : factoryMode.kind === 'layout' ? (
        (() => {
          const layout = publishedLayouts.find((l) => l.id === factoryMode.layoutId);
          if (!layout) {
            return (
              <div className="w-full h-[70vh] rounded-xl overflow-hidden border border-white/10 bg-black/20 flex items-center justify-center">
                <div className="text-gray-400 text-sm">Published layout not found.</div>
              </div>
            );
          }
          return <Layout2DViewer layout={layout} />;
        })()
      ) : (
        <>
          {/* Legacy Factory Content */}
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-item">
            {/* 3D Viewport */}
            <div className="lg:col-span-3">
              <Card className="glass-panel border-white/10 overflow-hidden">
                <CardHeader className="pb-2 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Factory className="w-5 h-5 text-[#00A3E0]" />
                        {t('plant-a-floor')}
                      </CardTitle>
                      <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                        {(['3d', 'heatmap', 'schematic'] as const).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
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
                      <Button
                        variant={isLegacyEditMode ? 'default' : 'outline'}
                        size="sm"
                        className={isLegacyEditMode ? 'bg-[#00A3E0] text-white' : 'border-white/10'}
                        onClick={toggleLegacyEditMode}
                      >
                        <Wrench className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                        {isLegacyEditMode ? t('done-editing') : t('edit-layout')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSnapshot}
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleFullscreen}
                      >
                        <Maximize2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div ref={viewportRef} className="h-[500px] bg-[#0a0a0f]">
                    {viewMode === '3d' && (
                      <Canvas
                        shadows
                        gl={{ preserveDrawingBuffer: true, antialias: true }}
                        onCreated={({ gl }) => {
                          canvasElRef.current = gl.domElement;
                          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                          gl.outputColorSpace = THREE.SRGBColorSpace;
                        }}
                        camera={{ position: [0, 8, 15], fov: 55 }}
                      >
                        <color attach="background" args={['#070710']} />
                        <fog attach="fog" args={['#070710', 18, 45]} />
                        <PerspectiveCamera makeDefault position={[0, 10, 15]} />
                        <CameraDirector
                          focus={effectiveFocus}
                          autoRotate={autoRotate && !selectedMachineData}
                          onControlsReady={(c) => {
                            controlsApiRef.current = c;
                          }}
                        />
                        <GizmoHelper alignment="bottom-right" margin={[90, 90]}>
                          <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="#ffffff" />
                        </GizmoHelper>
                        <Suspense fallback={null}>
                          <FactoryFloor
                            machines={machines}
                            showLabels={showLabels}
                            isSimulationRunning={isSimulationRunning}
                            selectedMachine={selectedMachine}
                            onSelect={(id) => {
                              setSelectedMachine(id);
                              setSelectedReferenceId(null);
                              setManualFocus(null);
                              if (isLegacyEditMode) setSelectedEditMachine(id);
                              const m = machines.find((x) => x.id === id);
                              if (!m) return;
                              if (m.status === 'alarm') {
                                toast.warning(`${m.id} Alert`, { description: `Temp: ${m.temperature}°C` });
                              } else if (m.status === 'stopped') {
                                toast.error(`${m.id} Stopped`, { description: 'Maintenance required' });
                              } else {
                                toast.info(`${m.id} Selected`, { description: `OEE: ${m.oee}%, Status: ${m.status}` });
                              }
                            }}
                            isEditMode={isLegacyEditMode}
                            selectedEditMachine={selectedEditMachine}
                            onEditSelect={setSelectedEditMachine}
                            onMachinePositionChange={updateMachinePosition}
                            referencePoints={legacyReferencePoints}
                            selectedReferenceId={selectedReferenceId}
                            onPickReference={pickLegacyReference}
                            liteMode={isLiteMode}
                          />
                        </Suspense>
                      </Canvas>
                    )}

                    {viewMode === 'heatmap' && (
                      <HeatmapView machines={machines} selectedMachine={selectedMachine} onSelect={setSelectedMachine} />
                    )}

                    {viewMode === 'schematic' && (
                      <SchematicView machines={machines} selectedMachine={selectedMachine} onSelect={setSelectedMachine} />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Side Panel */}
            <div className="space-y-4">
              {isLegacyEditMode && (
                <Card className="glass-panel border-white/10 border-[#00A3E0]/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-[#00A3E0]">
                      <Wrench className="w-4 h-4" />
                      Edit Machine
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {!selectedEditMachineData ? (
                      <div className="text-xs text-gray-400">Select a machine to edit.</div>
                    ) : (
                      (() => {
                        const m = selectedEditMachineData;
                        const width = m.width ?? DEFAULT_MACHINE_DIMENSIONS.width;
                        const depth = m.depth ?? DEFAULT_MACHINE_DIMENSIONS.depth;
                        const height = m.height ?? DEFAULT_MACHINE_DIMENSIONS.height;
                        return (
                          <div className="space-y-3">
                            <div className="text-xs text-gray-400">ID</div>
                            <div className="text-sm font-medium text-white">{m.id}</div>

                            <div className="space-y-1">
                              <div className="text-xs text-gray-400">Name</div>
                              <input
                                className="w-full h-9 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-white"
                                value={m.name}
                                onChange={(e) => updateMachine(m.id, { name: e.target.value })}
                              />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-1">
                                <div className="text-xs text-gray-400">W</div>
                                <input
                                  className="w-full h-9 px-2 rounded-md bg-white/5 border border-white/10 text-sm text-white"
                                  value={String(width)}
                                  onChange={(e) =>
                                    updateMachine(m.id, {
                                      width: clampNumber(e.target.value, 0.5, 10, width)
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <div className="text-xs text-gray-400">D</div>
                                <input
                                  className="w-full h-9 px-2 rounded-md bg-white/5 border border-white/10 text-sm text-white"
                                  value={String(depth)}
                                  onChange={(e) =>
                                    updateMachine(m.id, {
                                      depth: clampNumber(e.target.value, 0.5, 10, depth)
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <div className="text-xs text-gray-400">H</div>
                                <input
                                  className="w-full h-9 px-2 rounded-md bg-white/5 border border-white/10 text-sm text-white"
                                  value={String(height)}
                                  onChange={(e) =>
                                    updateMachine(m.id, {
                                      height: clampNumber(e.target.value, 0.5, 10, height)
                                    })
                                  }
                                />
                              </div>
                            </div>

                            <div className="text-[11px] text-gray-500">
                              Drag the machine in the 3D view to move it.
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Plant Overview */}
              <Card className="glass-panel border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Plant Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Machines</span>
                    <span className="font-medium">8</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Running</span>
                    <span className="font-medium text-green-400">5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Idle</span>
                    <span className="font-medium text-yellow-400">1</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Stopped</span>
                    <span className="font-medium text-red-400">1</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Alarm</span>
                    <span className="font-medium text-orange-400">1</span>
                  </div>
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Avg OEE</span>
                      <span className="font-medium text-[#00A3E0]">76.9%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Machine List */}
              <Card className="glass-panel border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Machines</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[250px] overflow-y-auto">
                    {machines.map((machine) => (
                      <button
                        key={machine.id}
                        onClick={() => setSelectedMachine(machine.id)}
                        className={`w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${
                          selectedMachine === machine.id ? 'bg-white/10' : ''
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(machine.status)}`} />
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium">{machine.id}</p>
                          <p className="text-xs text-gray-500">{getStatusText(machine.status)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{machine.oee}%</p>
                          <p className="text-xs text-gray-500">OEE</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Alerts */}
              <Card className="glass-panel border-white/10 border-orange-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    Active Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {alerts.length === 0 ? (
                      <p className="text-sm text-gray-500">No active alerts</p>
                    ) : (
                      alerts.map((alert) => (
                        <div key={alert.id} className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                          <p className="text-sm text-orange-400">{alert.machineId}</p>
                          <p className="text-xs text-gray-500">{alert.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Selected Machine Details */}
          {selectedMachineData && (
            <Card className="glass-panel border-white/10 animate-item">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg ${getStatusColor(selectedMachineData.status)} flex items-center justify-center`}>
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{selectedMachineData.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {selectedMachineData.line} • ID: {selectedMachineData.id}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(selectedMachineData.status)}>
                      {getStatusText(selectedMachineData.status)}
                    </Badge>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0]"
                      onClick={handleViewDetails}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="border-white/10" onClick={handleRefreshData}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Data
                    </Button>
                    <Button variant="outline" size="sm" className="border-white/10" onClick={handleConfigure}>
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedMachine(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-[#00A3E0]" />
                      <span className="text-sm text-gray-400">OEE</span>
                    </div>
                    <p className="text-2xl font-bold">{selectedMachineData.oee}%</p>
                    <div className="w-full h-2 bg-white/10 rounded-full mt-2">
                      <div 
                        className="h-full bg-gradient-to-r from-[#0066CC] to-[#00A3E0] rounded-full"
                        style={{ width: `${selectedMachineData.oee}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="w-4 h-4 text-[#FF6B35]" />
                      <span className="text-sm text-gray-400">Temperature</span>
                    </div>
                    <p className={`text-2xl font-bold ${selectedMachineData.temperature > 70 ? 'text-red-400' : ''}`}>
                      {selectedMachineData.temperature}°C
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedMachineData.temperature > 70 ? 'Above normal' : 'Normal range'}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Wind className="w-4 h-4 text-[#00C853]" />
                      <span className="text-sm text-gray-400">Vibration</span>
                    </div>
                    <p className="text-2xl font-bold">{selectedMachineData.vibration} mm/s</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedMachineData.vibration > 5 ? 'High vibration' : 'Normal'}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-[#FFD600]" />
                      <span className="text-sm text-gray-400">Pressure</span>
                    </div>
                    <p className="text-2xl font-bold">{selectedMachineData.pressure} bar</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedMachineData.pressure > 10 ? 'Above normal' : 'Normal'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0f1c] p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Digital Twin Settings</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                Close
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <p className="text-sm font-medium">Overview Auto-Rotate</p>
                  <p className="text-xs text-gray-500">Auto rotate camera when no machine selected</p>
                </div>
                <Button variant="outline" size="sm" className="border-white/10" onClick={() => setAutoRotate((v) => !v)}>
                  {autoRotate ? 'On' : 'Off'}
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <p className="text-sm font-medium">Reset View</p>
                  <p className="text-xs text-gray-500">Return to default camera view</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10"
                  onClick={() => {
                    setSelectedMachine(null);
                    toast.success('View reset');
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfigure && selectedMachineData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0f1c] p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Configure {selectedMachineData.id}</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowConfigure(false)}>
                Close
              </Button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-gray-300">
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white font-medium">Telemetry Thresholds</p>
                <p className="text-xs text-gray-500 mt-1">This panel is a functional placeholder for enterprise configuration workflows.</p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" className="border-white/10" onClick={() => setShowConfigure(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0]"
                  onClick={() => {
                    setShowConfigure(false);
                    toast.success('Configuration saved');
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAnalyticsDrawer && selectedMachineData && (
        <AnalyticsDrawer
          machine={selectedMachineData}
          telemetryHistory={telemetryHistory[selectedMachineData.id] || []}
          alerts={alerts}
          onClose={() => setShowAnalyticsDrawer(false)}
        />
      )}
    </div>
  );
}

export default DigitalTwin;
