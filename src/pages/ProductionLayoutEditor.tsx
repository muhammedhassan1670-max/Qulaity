import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent,
  type WheelEvent,
} from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Factory,
  LayoutGrid,
  Pencil,
  Copy,
  Undo2,
  Redo2,
  GitBranch,
  ZoomIn,
  ZoomOut,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { productionLayoutApi, type ProductionLayoutData } from '../api/production-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAppStore } from '../stores/appStore';

type LayoutNodeType = 'station' | 'test-room' | 'line' | 'technician' | 'product';

interface LayoutNode {
  id: string;
  type: LayoutNodeType;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  /** Short code for MES / work orders (e.g. ST-03) */
  code?: string;
  /** Free-form notes for operators */
  notes?: string;
  /** Nominal throughput or headcount hint */
  capacity?: number;
  /** Draw order; higher = on top */
  zIndex?: number;
}

interface LayoutDoc {
  /** Bump when shape of file changes (for migrations) */
  schemaVersion?: number;
  nodes: LayoutNode[];
  gridSize: number;
  /** Draw logical flow between ordered stations */
  showFlowLines?: boolean;
}

const LAYOUT_SCHEMA_VERSION = 2;

const snap = (v: number, grid: number) => Math.round(v / grid) * grid;

const nodeDefaults: Record<LayoutNodeType, Pick<LayoutNode, 'w' | 'h' | 'color'>> = {
  station: { w: 160, h: 72, color: 'rgba(0,163,224,0.22)' },
  'test-room': { w: 200, h: 96, color: 'rgba(168,85,247,0.20)' },
  line: { w: 280, h: 120, color: 'rgba(34,197,94,0.16)' },
  technician: { w: 140, h: 60, color: 'rgba(245,158,11,0.18)' },
  product: { w: 160, h: 60, color: 'rgba(148,163,184,0.14)' },
};

const newId = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

const createEmptyDoc = (): LayoutDoc => ({
  schemaVersion: LAYOUT_SCHEMA_VERSION,
  nodes: [],
  gridSize: 20,
  showFlowLines: true,
});

function normalizeDoc(raw: unknown): LayoutDoc {
  const base = createEmptyDoc();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Partial<LayoutDoc> & { nodes?: unknown };
  const rawNodes: unknown[] = Array.isArray(o.nodes) ? (o.nodes as unknown[]) : [];
  const nodes: LayoutNode[] = rawNodes
    .filter((n): n is Record<string, unknown> => !!n && typeof n === 'object')
    .map((n, i) => {
      const type = (n.type as LayoutNodeType) || 'station';
      const def = nodeDefaults[type] ?? nodeDefaults.station;
      return {
        id: typeof n.id === 'string' ? n.id : newId(),
        type: (['station', 'test-room', 'line', 'technician', 'product'].includes(type) ? type : 'station') as LayoutNodeType,
        name: typeof n.name === 'string' ? n.name : 'Node',
        x: typeof n.x === 'number' ? n.x : 0,
        y: typeof n.y === 'number' ? n.y : 0,
        w: typeof n.w === 'number' ? n.w : def.w,
        h: typeof n.h === 'number' ? n.h : def.h,
        color: typeof n.color === 'string' ? n.color : def.color,
        code: typeof n.code === 'string' ? n.code : undefined,
        notes: typeof n.notes === 'string' ? n.notes : undefined,
        capacity: typeof n.capacity === 'number' ? n.capacity : undefined,
        zIndex: typeof n.zIndex === 'number' ? n.zIndex : i,
      };
    });
  return {
    schemaVersion: LAYOUT_SCHEMA_VERSION,
    nodes,
    gridSize: typeof o.gridSize === 'number' && o.gridSize >= 5 ? o.gridSize : base.gridSize,
    showFlowLines: o.showFlowLines !== false,
  };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseStationNumber(name: string) {
  const m = /station\s*(\d+)/i.exec(name);
  return m ? Number(m[1]) : null;
}

export function ProductionLayoutEditor() {
  const flowMarkerId = useId().replace(/:/g, '');
  const user = useAppStore((s) => s.user);
  const [layouts, setLayouts] = useState<ProductionLayoutData[]>([]);
  const [activeLayoutId, setActiveLayoutId] = useState<string>('');
  const [activeLayout, setActiveLayout] = useState<ProductionLayoutData | null>(null);
  const [layoutNameDraft, setLayoutNameDraft] = useState('');
  const [doc, setDoc] = useState<LayoutDoc>(createEmptyDoc());
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'straight' | 'u-shape'>('straight');
  const [desiredStationCount, setDesiredStationCount] = useState<number>(8);
  const [viewScale, setViewScale] = useState(1);
  const [viewPan, setViewPan] = useState({ x: 0, y: 0 });
  const [undoPast, setUndoPast] = useState<LayoutDoc[]>([]);
  const [undoFuture, setUndoFuture] = useState<LayoutDoc[]>([]);

  const docRef = useRef(doc);
  docRef.current = doc;
  const viewPanRef = useRef(viewPan);
  viewPanRef.current = viewPan;
  const viewScaleRef = useRef(viewScale);
  viewScaleRef.current = viewScale;

  const plantIdFilter = useMemo(() => {
    const p = user?.plant;
    if (p && UUID_RE.test(p)) return p;
    return undefined;
  }, [user?.plant]);

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const draggingRef = useRef<{
    nodeId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const panningRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const spaceDownRef = useRef(false);
  const compassPanRef = useRef<{
    raf: number | null;
    lastTs: number;
    vx: number;
    vy: number;
  }>({ raf: null, lastTs: 0, vx: 0, vy: 0 });

  const cloneDoc = useCallback((d: LayoutDoc): LayoutDoc => JSON.parse(JSON.stringify(d)), []);

  const pushUndo = useCallback(() => {
    setUndoPast((p) => [...p.slice(-24), cloneDoc(docRef.current)]);
    setUndoFuture([]);
  }, [cloneDoc]);

  const undo = useCallback(() => {
    setUndoPast((past) => {
      if (past.length === 0) return past;
      const current = cloneDoc(docRef.current);
      const prevDoc = past[past.length - 1];
      setUndoFuture((f) => [current, ...f].slice(0, 25));
      setDoc(prevDoc);
      return past.slice(0, -1);
    });
  }, [cloneDoc]);

  const redo = useCallback(() => {
    setUndoFuture((future) => {
      if (future.length === 0) return future;
      const current = cloneDoc(docRef.current);
      const nextDoc = future[0];
      setUndoPast((p) => [...p.slice(-24), current]);
      setDoc(nextDoc);
      return future.slice(1);
    });
  }, [cloneDoc]);

  const contentBounds = useMemo(() => {
    if (doc.nodes.length === 0) {
      return { w: 1280, h: 720 };
    }
    let maxR = 0;
    let maxB = 0;
    for (const n of doc.nodes) {
      maxR = Math.max(maxR, n.x + n.w);
      maxB = Math.max(maxB, n.y + n.h);
    }
    const pad = 160;
    return { w: Math.max(1280, maxR + pad), h: Math.max(720, maxB + pad) };
  }, [doc.nodes]);

  const flowSegments = useMemo(() => {
    if (!doc.showFlowLines) return [];
    const stations = doc.nodes
      .filter((n) => n.type === 'station')
      .slice()
      .sort((a, b) => {
        const an = parseStationNumber(a.name) ?? Number.MAX_SAFE_INTEGER;
        const bn = parseStationNumber(b.name) ?? Number.MAX_SAFE_INTEGER;
        if (an !== bn) return an - bn;
        return a.x - b.x;
      });
    const segs: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < stations.length - 1; i++) {
      const a = stations[i];
      const b = stations[i + 1];
      const gap = Math.max(8, b.x - (a.x + a.w));
      segs.push({
        x1: a.x + a.w,
        y1: a.y + a.h / 2,
        x2: b.x - gap / 2,
        y2: a.y + a.h / 2,
      });
      segs.push({
        x1: b.x - gap / 2,
        y1: a.y + a.h / 2,
        x2: b.x - gap / 2,
        y2: b.y + b.h / 2,
      });
      segs.push({
        x1: b.x - gap / 2,
        y1: b.y + b.h / 2,
        x2: b.x,
        y2: b.y + b.h / 2,
      });
    }
    return segs;
  }, [doc.nodes, doc.showFlowLines]);

  const sortedNodes = useMemo(
    () =>
      [...doc.nodes].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0) || a.id.localeCompare(b.id)),
    [doc.nodes]
  );

  const clientToContent = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const r = canvas.getBoundingClientRect();
      const lx = (clientX - r.left - viewPan.x) / viewScale;
      const ly = (clientY - r.top - viewPan.y) / viewScale;
      return { x: lx, y: ly };
    },
    [viewPan.x, viewPan.y, viewScale]
  );

  const selectedNode = useMemo(
    () => doc.nodes.find((n) => n.id === selectedNodeId) || null,
    [doc.nodes, selectedNodeId]
  );

  const stationNodes = useMemo(() => doc.nodes.filter((n) => n.type === 'station'), [doc.nodes]);

  useEffect(() => {
    if (stationNodes.length > 0) {
      setDesiredStationCount(stationNodes.length);
    }
  }, [stationNodes.length]);

  const loadLayouts = useCallback(async () => {
    try {
      const res = await productionLayoutApi.getAll({
        page: 1,
        limit: 50,
        ...(plantIdFilter ? { plantId: plantIdFilter } : {}),
      });
      setLayouts(res.data);
      if (!activeLayoutId && res.data.length > 0) {
        setActiveLayoutId(res.data[0].id);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load layouts';
      toast.error(message);
    }
  }, [activeLayoutId, plantIdFilter]);

  const loadActiveLayout = useCallback(async (id: string) => {
    try {
      const item = await productionLayoutApi.getById(id);
      setActiveLayout(item);
      setDoc(normalizeDoc(item.layout));
      setUndoPast([]);
      setUndoFuture([]);
      setViewScale(1);
      setViewPan({ x: 0, y: 0 });
      setSelectedNodeId('');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load layout';
      toast.error(message);
    }
  }, []);

  useEffect(() => {
    loadLayouts();
  }, [loadLayouts]);

  useEffect(() => {
    if (!activeLayoutId) return;
    void loadActiveLayout(activeLayoutId);
  }, [activeLayoutId, loadActiveLayout]);

  useEffect(() => {
    setLayoutNameDraft(activeLayout?.name ?? '');
  }, [activeLayout?.id, activeLayout?.name]);

  const buildMetadataPatch = useCallback(() => {
    const base = (activeLayout?.metadata as Record<string, unknown> | undefined) ?? {};
    return {
      ...base,
      lastEditedBy: user?.id,
      lastEditedByName: user?.name,
      lastEditedAt: new Date().toISOString(),
    };
  }, [activeLayout?.metadata, user?.id, user?.name]);

  const createLayout = async () => {
    try {
      const name = `Layout ${layouts.length + 1}`;
      const created = await productionLayoutApi.create({
        name,
        plantId: plantIdFilter,
        layout: createEmptyDoc() as unknown as Record<string, unknown>,
        isPublished: false,
        version: 1,
        metadata: {
          lastEditedBy: user?.id,
          lastEditedByName: user?.name,
          createdAt: new Date().toISOString(),
        },
      } as Omit<ProductionLayoutData, 'id'>);
      toast.success('Layout created');
      await loadLayouts();
      setActiveLayoutId(created.id);
      setLayoutNameDraft(created.name || name);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create layout';
      toast.error(message);
    }
  };

  const togglePublish = async () => {
    if (!activeLayout) {
      toast.error('Save the layout first before publishing');
      return;
    }

    try {
      setIsPublishing(true);
      await productionLayoutApi.update(activeLayout.id, {
        isPublished: !activeLayout.isPublished,
        version: (activeLayout.version ?? 1) + 1,
      } as any);
      toast.success(activeLayout.isPublished ? 'Unpublished' : 'Published');
      await loadActiveLayout(activeLayout.id);
      await loadLayouts();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to update publish status';
      toast.error(message);
    } finally {
      setIsPublishing(false);
    }
  };

  const saveLayout = async () => {
    try {
      setIsSaving(true);

      const nameToSave =
        layoutNameDraft.trim() || activeLayout?.name || `Layout ${layouts.length + 1}`;
      const metadata = buildMetadataPatch();

      let targetLayout = activeLayout;
      if (!targetLayout) {
        targetLayout = await productionLayoutApi.create({
          name: nameToSave,
          plantId: plantIdFilter,
          layout: doc as unknown as Record<string, unknown>,
          isPublished: false,
          version: 1,
          metadata: metadata as Record<string, unknown>,
        } as Omit<ProductionLayoutData, 'id'>);
        setActiveLayoutId(targetLayout.id);
      } else {
        await productionLayoutApi.update(targetLayout.id, {
          name: nameToSave,
          layout: doc as unknown as Record<string, unknown>,
          version: (targetLayout.version ?? 1) + 1,
          metadata: metadata as Record<string, unknown>,
        });
      }

      toast.success('Saved');
      await loadActiveLayout(targetLayout.id);
      await loadLayouts();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to save';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const addNode = (type: LayoutNodeType) => {
    pushUndo();
    const base = nodeDefaults[type];
    const grid = doc.gridSize || 20;

    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    const x0 = rect ? (rect.width / 2 - base.w / 2) : 160;
    const y0 = rect ? (rect.height / 2 - base.h / 2) : 120;

    const node: LayoutNode = {
      id: newId(),
      type,
      name: type === 'test-room' ? 'Test Room' : type.charAt(0).toUpperCase() + type.slice(1),
      x: snap(x0, grid),
      y: snap(y0, grid),
      w: base.w,
      h: base.h,
      color: base.color,
      zIndex: doc.nodes.length,
    };

    setDoc((prev) => ({ ...prev, nodes: [...prev.nodes, node] }));
    setSelectedNodeId(node.id);
  };

  const nextStationIndex = () => {
    const max = stationNodes.reduce((acc, n) => {
      const num = parseStationNumber(n.name);
      return Math.max(acc, num ?? 0);
    }, 0);
    return max + 1;
  };

  const autoLayoutLine = (nodesOverride?: LayoutNode[]) => {
    const nodes = nodesOverride ?? doc.nodes;
    const grid = doc.gridSize || 20;

    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    const canvasW = rect?.width ?? 1100;
    const canvasH = rect?.height ?? 600;

    const stationBase = nodeDefaults.station;
    const lineBase = nodeDefaults.line;
    const testBase = nodeDefaults['test-room'];
    const techBase = nodeDefaults.technician;
    const productBase = nodeDefaults.product;

    const stations = nodes
      .filter((n) => n.type === 'station')
      .slice()
      .sort((a, b) => {
        const an = parseStationNumber(a.name) ?? Number.MAX_SAFE_INTEGER;
        const bn = parseStationNumber(b.name) ?? Number.MAX_SAFE_INTEGER;
        return an - bn;
      });

    const stationCount = stations.length;
    if (stationCount === 0) return;

    const stationGap = 20;
    const rowTop = snap(Math.max(40, canvasH * 0.30), grid);

    let rowLeft = snap(60, grid);
    let stationsTotalW = stationCount * stationBase.w + (stationCount - 1) * stationGap;
    if (layoutMode === 'straight') {
      rowLeft = snap(Math.max(40, (canvasW - stationsTotalW) / 2), grid);
    } else {
      const topRowCount = Math.ceil(stationCount / 2);
      stationsTotalW = topRowCount * stationBase.w + (topRowCount - 1) * stationGap;
      rowLeft = snap(Math.max(40, (canvasW - stationsTotalW) / 2), grid);
    }

    const updated: LayoutNode[] = nodes.map((n) => ({ ...n }));
    const updatedById = new Map(updated.map((n) => [n.id, n] as const));

    if (layoutMode === 'straight') {
      stations.forEach((s, i) => {
        const u = updatedById.get(s.id);
        if (!u) return;
        u.x = snap(rowLeft + i * (stationBase.w + stationGap), grid);
        u.y = rowTop;
        u.w = stationBase.w;
        u.h = stationBase.h;
      });
    } else {
      const topRowCount = Math.ceil(stationCount / 2);
      const bottomRowCount = stationCount - topRowCount;
      const rowBottom = snap(rowTop + stationBase.h + 80, grid);

      for (let i = 0; i < topRowCount; i++) {
        const s = stations[i];
        const u = updatedById.get(s.id);
        if (!u) continue;
        u.x = snap(rowLeft + i * (stationBase.w + stationGap), grid);
        u.y = rowTop;
        u.w = stationBase.w;
        u.h = stationBase.h;
      }

      for (let i = 0; i < bottomRowCount; i++) {
        const s = stations[topRowCount + i];
        const u = updatedById.get(s.id);
        if (!u) continue;
        const idx = bottomRowCount - 1 - i;
        u.x = snap(rowLeft + idx * (stationBase.w + stationGap), grid);
        u.y = rowBottom;
        u.w = stationBase.w;
        u.h = stationBase.h;
      }
    }

    const stationXs = stations
      .map((s) => updatedById.get(s.id))
      .filter(Boolean)
      .map((n) => n!.x);
    const stationYs = stations
      .map((s) => updatedById.get(s.id))
      .filter(Boolean)
      .map((n) => n!.y);

    const minX = Math.min(...stationXs);
    const maxX = Math.max(...stationXs) + stationBase.w;
    const minY = Math.min(...stationYs);
    const maxY = Math.max(...stationYs) + stationBase.h;

    const line = updated.find((n) => n.type === 'line') ?? null;
    if (line) {
      line.x = snap(Math.max(20, minX - 40), grid);
      line.y = snap(Math.max(20, minY - 50), grid);
      line.w = snap(Math.min(canvasW - 40, maxX - minX + 80), grid);
      line.h = snap(Math.min(canvasH - 40, maxY - minY + 100), grid);
      line.color = lineBase.color;
      if (!line.name) line.name = 'Line 1';
    }

    const products = updated.filter((n) => n.type === 'product');
    if (products.length > 0) {
      const incoming = products.find((p) => /incoming/i.test(p.name)) ?? products[0];
      incoming.x = snap(Math.max(20, minX - productBase.w - 30), grid);
      incoming.y = snap(maxY + 30, grid);

      const finished = products.find((p) => /finished/i.test(p.name)) ?? products[1];
      if (finished) {
        finished.x = snap(Math.min(canvasW - productBase.w - 20, maxX + 30), grid);
        finished.y = snap(maxY + 30, grid);
      }
    }

    const testRoom = updated.find((n) => n.type === 'test-room') ?? null;
    if (testRoom) {
      testRoom.x = snap(minX + Math.max(0, Math.floor(Math.max(1, stationCount) / 2) - 1) * (stationBase.w + stationGap), grid);
      testRoom.y = snap(Math.max(20, minY - testBase.h - 30), grid);
      testRoom.w = testBase.w;
      testRoom.h = testBase.h;
    }

    const technicians = updated.filter((n) => n.type === 'technician');
    if (technicians.length > 0) {
      const tA = technicians[0];
      tA.x = snap(minX, grid);
      tA.y = snap(maxY + 120, grid);
      tA.w = techBase.w;
      tA.h = techBase.h;
      const tB = technicians[1];
      if (tB) {
        tB.x = snap(Math.max(20, maxX - techBase.w), grid);
        tB.y = snap(maxY + 120, grid);
        tB.w = techBase.w;
        tB.h = techBase.h;
      }
    }

    if (nodesOverride) return updated;
    setDoc((prev) => ({ ...prev, nodes: updated }));
  };

  const ensureStationCount = (count: number) => {
    pushUndo();
    const safeCount = Math.max(0, Math.floor(count || 0));
    const stations = doc.nodes.filter((n) => n.type === 'station');

    if (stations.length === safeCount) {
      autoLayoutLine();
      toast.success('Auto-layout applied');
      return;
    }

    let nextNodes = doc.nodes.slice();
    if (stations.length < safeCount) {
      const base = nodeDefaults.station;
      const start = nextStationIndex();
      for (let i = 0; i < safeCount - stations.length; i++) {
        nextNodes.push({
          id: newId(),
          type: 'station',
          name: `Station ${start + i}`,
          x: 0,
          y: 0,
          w: base.w,
          h: base.h,
          color: base.color,
        });
      }
    } else {
      const sorted = stations
        .slice()
        .sort((a, b) => {
          const an = parseStationNumber(a.name) ?? Number.MAX_SAFE_INTEGER;
          const bn = parseStationNumber(b.name) ?? Number.MAX_SAFE_INTEGER;
          return an - bn;
        });
      const toRemove = sorted.slice(safeCount).map((s) => s.id);
      nextNodes = nextNodes.filter((n) => !toRemove.includes(n.id));
      if (toRemove.includes(selectedNodeId)) setSelectedNodeId('');
    }

    const relaid = autoLayoutLine(nextNodes) as LayoutNode[];
    setDoc((prev) => ({ ...prev, nodes: relaid }));
    toast.success('Updated station count');
  };

  const generateFullLine = () => {
    const ok = doc.nodes.length === 0 || confirm('This will replace the current layout. Continue?');
    if (!ok) return;

    pushUndo();
    const grid = doc.gridSize || 20;
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    const canvasW = rect?.width ?? 1100;
    const canvasH = rect?.height ?? 600;

    const stationCount = Math.max(1, Math.floor(desiredStationCount || 8));
    const stationBase = nodeDefaults.station;
    const lineBase = nodeDefaults.line;
    const testBase = nodeDefaults['test-room'];
    const techBase = nodeDefaults.technician;
    const productBase = nodeDefaults.product;

    const stationGap = 20;
    const rowTop = snap(Math.max(40, canvasH * 0.30), grid);
    const stationsTotalW = stationCount * stationBase.w + (stationCount - 1) * stationGap;
    const rowLeft = snap(Math.max(40, (canvasW - stationsTotalW) / 2), grid);

    const nodes: LayoutNode[] = [];

    nodes.push({
      id: newId(),
      type: 'line',
      name: 'Line 1',
      x: snap(Math.max(20, rowLeft - 40), grid),
      y: snap(Math.max(20, rowTop - 50), grid),
      w: snap(Math.min(canvasW - 40, stationsTotalW + 80), grid),
      h: snap(lineBase.h + 40, grid),
      color: lineBase.color,
    });

    for (let i = 0; i < stationCount; i++) {
      nodes.push({
        id: newId(),
        type: 'station',
        name: `Station ${i + 1}`,
        x: snap(rowLeft + i * (stationBase.w + stationGap), grid),
        y: rowTop,
        w: stationBase.w,
        h: stationBase.h,
        color: stationBase.color,
      });
    }

    nodes.push({
      id: newId(),
      type: 'product',
      name: 'Incoming Product',
      x: snap(Math.max(20, rowLeft - productBase.w - 30), grid),
      y: snap(rowTop + stationBase.h + 30, grid),
      w: productBase.w,
      h: productBase.h,
      color: productBase.color,
    });

    nodes.push({
      id: newId(),
      type: 'product',
      name: 'Finished Product',
      x: snap(Math.min(canvasW - productBase.w - 20, rowLeft + stationsTotalW + 30), grid),
      y: snap(rowTop + stationBase.h + 30, grid),
      w: productBase.w,
      h: productBase.h,
      color: productBase.color,
    });

    nodes.push({
      id: newId(),
      type: 'test-room',
      name: 'Test Room',
      x: snap(rowLeft + Math.max(0, Math.floor(stationCount / 2) - 1) * (stationBase.w + stationGap), grid),
      y: snap(Math.max(20, rowTop - testBase.h - 30), grid),
      w: testBase.w,
      h: testBase.h,
      color: testBase.color,
    });

    nodes.push({
      id: newId(),
      type: 'technician',
      name: 'Technician A',
      x: snap(rowLeft, grid),
      y: snap(rowTop + stationBase.h + 120, grid),
      w: techBase.w,
      h: techBase.h,
      color: techBase.color,
    });

    nodes.push({
      id: newId(),
      type: 'technician',
      name: 'Technician B',
      x: snap(rowLeft + stationsTotalW - techBase.w, grid),
      y: snap(rowTop + stationBase.h + 120, grid),
      w: techBase.w,
      h: techBase.h,
      color: techBase.color,
    });

    setDoc((prev) => ({ ...prev, nodes }));
    setSelectedNodeId('');
    toast.success('Generated full production line');
  };

  const updateSelectedNode = (patch: Partial<LayoutNode>) => {
    if (!selectedNode) return;
    setDoc((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === selectedNode.id ? { ...n, ...patch } : n)),
    }));
  };

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    pushUndo();
    setDoc((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => n.id !== selectedNodeId),
    }));
    setSelectedNodeId('');
  }, [selectedNodeId, pushUndo]);

  const duplicateSelectedNode = () => {
    if (!selectedNode) return;
    pushUndo();
    const grid = doc.gridSize || 20;
    const copy: LayoutNode = {
      ...selectedNode,
      id: newId(),
      name: `${selectedNode.name} (copy)`,
      x: snap(selectedNode.x + 24, grid),
      y: snap(selectedNode.y + 24, grid),
      code: selectedNode.code ? `${selectedNode.code}-B` : undefined,
      zIndex: (selectedNode.zIndex ?? 0) + 1,
    };
    setDoc((prev) => ({ ...prev, nodes: [...prev.nodes, copy] }));
    setSelectedNodeId(copy.id);
    toast.success('Duplicated');
  };

  const exportLayoutJson = () => {
    const name = (layoutNameDraft || activeLayout?.name || 'layout').replace(/[^\w-]+/g, '_');
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success('Exported JSON');
  };

  const onImportJson = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        pushUndo();
        setDoc(normalizeDoc(parsed));
        setSelectedNodeId('');
        toast.success('Layout imported');
      } catch {
        toast.error('Invalid layout file');
      }
    };
    reader.readAsText(f);
  };

  const onNodePointerDown = (e: PointerEvent<HTMLDivElement>, node: LayoutNode) => {
    e.stopPropagation();
    pushUndo();
    setSelectedNodeId(node.id);

    const { x: px, y: py } = clientToContent(e.clientX, e.clientY);

    draggingRef.current = {
      nodeId: node.id,
      offsetX: px - node.x,
      offsetY: py - node.y,
    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onCanvasPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const pan = panningRef.current;
    if (pan) {
      const dx = e.clientX - pan.startX;
      const dy = e.clientY - pan.startY;
      setViewPan({ x: pan.panX + dx, y: pan.panY + dy });
      return;
    }

    const drag = draggingRef.current;
    if (!drag) return;

    const { x: px, y: py } = clientToContent(e.clientX, e.clientY);
    const grid = doc.gridSize || 20;
    const nextX = snap(px - drag.offsetX, grid);
    const nextY = snap(py - drag.offsetY, grid);

    setDoc((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === drag.nodeId ? { ...n, x: nextX, y: nextY } : n)),
    }));
  };

  const onCanvasPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    draggingRef.current = null;
    if (panningRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    }
    panningRef.current = null;
  };

  const onCanvasWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Default: wheel/trackpad scroll pans the view (both axes).
    // Ctrl/Meta + wheel: zoom at cursor (trackpad pinch typically maps to this).
    const isZoomGesture = e.ctrlKey || e.metaKey;

    if (!isZoomGesture) {
      // Natural trackpad scrolling: move the view with your fingers.
      setViewPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    const currentScale = viewScaleRef.current;
    const currentPan = viewPanRef.current;

    const factor = e.deltaY > 0 ? 0.9 : 1.11;
    const nextScale = Math.min(2.75, Math.max(0.35, currentScale * factor));

    // Keep the content point under the cursor fixed while zooming.
    const contentX = (clientX - rect.left - currentPan.x) / currentScale;
    const contentY = (clientY - rect.top - currentPan.y) / currentScale;
    const nextPanX = clientX - rect.left - contentX * nextScale;
    const nextPanY = clientY - rect.top - contentY * nextScale;

    setViewScale(nextScale);
    setViewPan({ x: nextPanX, y: nextPanY });
  };

  const onViewportPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button === 1 || (e.button === 0 && (spaceDownRef.current || e.shiftKey))) {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const p = viewPanRef.current;
      panningRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        panX: p.x,
        panY: p.y,
      };
      return;
    }
    if (e.button === 0 && e.target === e.currentTarget) {
      setSelectedNodeId('');
    }
  };

  const stopCompassPan = useCallback(() => {
    const s = compassPanRef.current;
    if (s.raf != null) {
      cancelAnimationFrame(s.raf);
      s.raf = null;
    }
    s.vx = 0;
    s.vy = 0;
    s.lastTs = 0;
  }, []);

  const startCompassPan = useCallback(
    (dir: 'up' | 'down' | 'left' | 'right') => {
      const s = compassPanRef.current;
      const speed = 780;
      s.vx = dir === 'left' ? speed : dir === 'right' ? -speed : 0;
      s.vy = dir === 'up' ? speed : dir === 'down' ? -speed : 0;

      if (s.raf != null) return;

      const tick = (ts: number) => {
        const state = compassPanRef.current;
        const last = state.lastTs || ts;
        const dt = Math.min(0.05, (ts - last) / 1000);
        state.lastTs = ts;

        if (state.vx !== 0 || state.vy !== 0) {
          setViewPan((p) => ({ x: p.x + state.vx * dt, y: p.y + state.vy * dt }));
          state.raf = requestAnimationFrame(tick);
        } else {
          state.raf = null;
          state.lastTs = 0;
        }
      };

      s.raf = requestAnimationFrame(tick);
    },
    []
  );

  useEffect(() => {
    return () => {
      stopCompassPan();
    };
  }, [stopCompassPan]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement ||
          e.target instanceof HTMLButtonElement
        )
          return;
        if (e.type === 'keydown') {
          e.preventDefault();
          spaceDownRef.current = true;
        } else {
          spaceDownRef.current = false;
        }
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, []);

  useEffect(() => {
    const onKeyNav = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable))
        return;

      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        e.preventDefault();
        deleteSelectedNode();
        return;
      }

      if (!selectedNode) return;
      const g = doc.gridSize || 20;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!e.repeat) pushUndo();
        setDoc((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) =>
            n.id === selectedNodeId ? { ...n, x: snap(n.x - g, g) } : n
          ),
        }));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (!e.repeat) pushUndo();
        setDoc((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) =>
            n.id === selectedNodeId ? { ...n, x: snap(n.x + g, g) } : n
          ),
        }));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!e.repeat) pushUndo();
        setDoc((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) =>
            n.id === selectedNodeId ? { ...n, y: snap(n.y - g, g) } : n
          ),
        }));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!e.repeat) pushUndo();
        setDoc((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) =>
            n.id === selectedNodeId ? { ...n, y: snap(n.y + g, g) } : n
          ),
        }));
      }
    };
    window.addEventListener('keydown', onKeyNav);
    return () => window.removeEventListener('keydown', onKeyNav);
  }, [selectedNodeId, doc.gridSize, deleteSelectedNode, pushUndo, redo, undo]);

  return (
    <div className="max-w-[1680px] mx-auto space-y-6 pb-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2 min-w-0">
          <div className="inline-flex items-center gap-2 text-[#00A3E0] text-xs font-semibold uppercase tracking-wider">
            <LayoutGrid className="w-4 h-4" aria-hidden />
            Digital factory
          </div>
          <h1 className="text-white text-2xl font-semibold tracking-tight">Production layout</h1>
          <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">
            تخطيط ثنائي الأبعاد للخطوط والمحطات وغرف الاختبار. يُحفظ في قاعدة البيانات ويُربط بحسابك؛ انشر التخطيط لعرضه في{' '}
            <Link to="/digital-twin" className="text-[#00A3E0] hover:underline">
              Digital Twin
            </Link>
            .
          </p>
          {user && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 border border-white/10">
                <Factory className="w-3.5 h-3.5 text-gray-400" aria-hidden />
                {user.name}
              </span>
              {plantIdFilter ? (
                <span className="text-gray-600">Filtering by your plant</span>
              ) : (
                <span className="text-gray-600">Showing all layouts for your tenant</span>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            onClick={generateFullLine}
          >
            Generate full line
          </Button>
          <Button
            variant="outline"
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            onClick={togglePublish}
            disabled={!activeLayoutId || isPublishing}
          >
            {isPublishing ? 'Updating...' : activeLayout?.isPublished ? 'Unpublish' : 'Publish'}
          </Button>
          <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10" onClick={createLayout}>
            New layout
          </Button>
          <Button className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white" onClick={saveLayout} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(260px,300px)_minmax(0,1fr)_minmax(260px,300px)] gap-4">
        <Card className="glass-panel border-white/10 p-4 space-y-4 h-fit">
          <div className="flex items-center gap-2 text-white font-medium">
            <Pencil className="w-4 h-4 text-[#00A3E0]" aria-hidden />
            Layouts
          </div>
          <div className="space-y-2">
            <label className="text-gray-400 text-xs">Active layout</label>
            <select
              value={activeLayoutId}
              onChange={(e) => setActiveLayoutId(e.target.value)}
              className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
            >
              <option value="" disabled>
                Select layout
              </option>
              {layouts.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 pt-1">
            <label className="text-gray-400 text-xs">Layout name (saved with Save)</label>
            <input
              type="text"
              value={layoutNameDraft}
              onChange={(e) => setLayoutNameDraft(e.target.value)}
              placeholder="e.g. Assembly Line A"
              className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600"
              disabled={!activeLayoutId && layouts.length === 0}
            />
          </div>

          <div className="pt-2 border-t border-white/10 space-y-2">
            <div className="text-white text-sm font-medium">Add elements</div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10" onClick={() => addNode('line')}>
                Line
              </Button>
              <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10" onClick={() => addNode('station')}>
                Station
              </Button>
              <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10" onClick={() => addNode('test-room')}>
                Test Room
              </Button>
              <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10" onClick={() => addNode('technician')}>
                Technician
              </Button>
              <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10" onClick={() => addNode('product')}>
                Product
              </Button>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 space-y-2">
            <div className="text-white text-sm font-medium">Line builder</div>

            <div className="space-y-2">
              <div className="text-gray-400 text-xs">Stations</div>
              <input
                type="number"
                value={desiredStationCount}
                onChange={(e) => setDesiredStationCount(Math.max(0, Number(e.target.value) || 0))}
                className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
              />
            </div>

            <div className="space-y-2">
              <div className="text-gray-400 text-xs">Mode</div>
              <select
                value={layoutMode}
                onChange={(e) => setLayoutMode(e.target.value as 'straight' | 'u-shape')}
                className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="straight">Straight</option>
                <option value="u-shape">U-Shape</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                onClick={() => ensureStationCount(desiredStationCount)}
              >
                Apply
              </Button>
              <Button
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                onClick={() => {
                  pushUndo();
                  autoLayoutLine();
                  toast.success('Auto-layout applied');
                }}
                disabled={stationNodes.length === 0}
              >
                Auto-Layout
              </Button>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 space-y-2">
            <div className="text-white font-medium">Grid</div>
            <input
              type="number"
              value={doc.gridSize}
              onChange={(e) => setDoc((prev) => ({ ...prev, gridSize: Math.max(5, Number(e.target.value) || 20) }))}
              className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
            />
          </div>

          <div className="pt-2 border-t border-white/10 space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={doc.showFlowLines !== false}
                onChange={(e) => setDoc((prev) => ({ ...prev, showFlowLines: e.target.checked }))}
                className="rounded border-white/20 bg-white/5"
              />
              <GitBranch className="w-4 h-4 text-[#00A3E0]" aria-hidden />
              Flow lines (stations)
            </label>
          </div>

          <div className="pt-2 border-t border-white/10 space-y-2">
            <div className="text-white text-sm font-medium">History &amp; files</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                onClick={undo}
                disabled={undoPast.length === 0}
              >
                <Undo2 className="w-4 h-4 mr-1 inline" aria-hidden />
                Undo
              </Button>
              <Button
                type="button"
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                onClick={redo}
                disabled={undoFuture.length === 0}
              >
                <Redo2 className="w-4 h-4 mr-1 inline" aria-hidden />
                Redo
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                onClick={exportLayoutJson}
              >
                Export JSON
              </Button>
              <Button
                type="button"
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                onClick={() => importFileRef.current?.click()}
              >
                Import
              </Button>
            </div>
            <input
              ref={importFileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={onImportJson}
            />
          </div>
        </Card>

        <Card className="glass-panel border-white/10 p-0 overflow-hidden min-h-[420px] flex flex-col">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-white/10 bg-black/20">
            <span className="text-xs text-gray-500 mr-1">Canvas</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 bg-white/5 border-white/10 text-white"
              onClick={() => setViewScale((s) => Math.min(2.75, s * 1.15))}
            >
              <ZoomIn className="w-3.5 h-3.5" aria-hidden />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 bg-white/5 border-white/10 text-white"
              onClick={() => setViewScale((s) => Math.max(0.35, s / 1.15))}
            >
              <ZoomOut className="w-3.5 h-3.5" aria-hidden />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 bg-white/5 border-white/10 text-white"
              onClick={() => {
                setViewScale(1);
                setViewPan({ x: 0, y: 0 });
              }}
            >
              Reset view
            </Button>
            <span className="text-xs text-gray-500 flex items-center gap-1 ml-auto">
              <Move className="w-3.5 h-3.5" aria-hidden />
              Wheel zoom · Mid-click or Shift+drag pan · Space+drag pan
            </span>
          </div>
          <div
            ref={canvasRef}
            className="relative flex-1 w-full h-[58vh] min-h-[380px] bg-black/25 touch-none select-none cursor-default"
            onWheel={onCanvasWheel}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
            onPointerLeave={(e) => onCanvasPointerUp(e)}
            onPointerDown={onViewportPointerDown}
          >
            <div className="absolute right-3 top-3 z-20">
              <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur p-2 shadow-lg">
                <div className="grid grid-cols-3 gap-1">
                  <div />
                  <button
                    type="button"
                    className="w-9 h-9 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      startCompassPan('up');
                    }}
                    onPointerUp={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      stopCompassPan();
                    }}
                    onPointerLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      stopCompassPan();
                    }}
                  >
                    <ArrowUp className="w-4 h-4" aria-hidden />
                  </button>
                  <div />

                  <button
                    type="button"
                    className="w-9 h-9 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      startCompassPan('left');
                    }}
                    onPointerUp={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      stopCompassPan();
                    }}
                    onPointerLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      stopCompassPan();
                    }}
                  >
                    <ArrowLeft className="w-4 h-4" aria-hidden />
                  </button>

                  <button
                    type="button"
                    className="w-9 h-9 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      stopCompassPan();
                      setViewScale(1);
                      setViewPan({ x: 0, y: 0 });
                    }}
                  >
                    <RotateCcw className="w-4 h-4" aria-hidden />
                  </button>

                  <button
                    type="button"
                    className="w-9 h-9 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      startCompassPan('right');
                    }}
                    onPointerUp={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      stopCompassPan();
                    }}
                    onPointerLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      stopCompassPan();
                    }}
                  >
                    <ArrowRight className="w-4 h-4" aria-hidden />
                  </button>

                  <div />
                  <button
                    type="button"
                    className="w-9 h-9 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      startCompassPan('down');
                    }}
                    onPointerUp={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      stopCompassPan();
                    }}
                    onPointerLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      stopCompassPan();
                    }}
                  >
                    <ArrowDown className="w-4 h-4" aria-hidden />
                  </button>
                  <div />
                </div>
              </div>
            </div>

            <div
              className="relative origin-top-left"
              style={{
                width: contentBounds.w,
                height: contentBounds.h,
                transform: `translate(${viewPan.x}px, ${viewPan.y}px) scale(${viewScale})`,
              }}
              onPointerDown={(e) => {
                if (e.button === 0 && e.target === e.currentTarget) setSelectedNodeId('');
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)`,
                  backgroundSize: `${doc.gridSize}px ${doc.gridSize}px`,
                }}
              />

              <svg
                className="absolute inset-0 pointer-events-none text-[#00A3E0]/45"
                width={contentBounds.w}
                height={contentBounds.h}
                aria-hidden
                style={{ zIndex: 1 }}
              >
                <defs>
                  <marker
                    id={flowMarkerId}
                    markerWidth="8"
                    markerHeight="8"
                    refX="7"
                    refY="4"
                    orient="auto"
                  >
                    <path d="M0,0 L8,4 L0,8 Z" fill="currentColor" />
                  </marker>
                </defs>
                {flowSegments.map((seg, i) => (
                  <line
                    key={`flow-seg-${i}`}
                    x1={seg.x1}
                    y1={seg.y1}
                    x2={seg.x2}
                    y2={seg.y2}
                    stroke="currentColor"
                    strokeWidth={2}
                    markerEnd={`url(#${flowMarkerId})`}
                  />
                ))}
              </svg>

              {sortedNodes.map((node) => {
                const active = node.id === selectedNodeId;
                return (
                  <div
                    key={node.id}
                    className={`absolute rounded-lg border ${active ? 'border-[#00A3E0] ring-1 ring-[#00A3E0]/40' : 'border-white/10'} shadow-sm cursor-move select-none`}
                    style={{
                      left: node.x,
                      top: node.y,
                      width: node.w,
                      height: node.h,
                      zIndex: (node.zIndex ?? 0) + 10,
                      background: node.color || 'rgba(255,255,255,0.08)',
                    }}
                    onPointerDown={(e) => onNodePointerDown(e, node)}
                  >
                    <div className="px-3 py-2 min-h-full flex flex-col justify-center">
                      <div className="text-white text-sm font-medium truncate leading-tight">{node.name}</div>
                      <div className="text-gray-300 text-[11px] uppercase tracking-wide">
                        {node.type.replace(/-/g, ' ')}
                      </div>
                      {node.code ? (
                        <div className="text-[#00A3E0] text-[11px] font-mono mt-0.5 truncate">{node.code}</div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className="glass-panel border-white/10 p-4 space-y-4 h-fit">
          <div className="text-white text-sm font-medium">Properties</div>

          {!selectedNode ? (
            <div className="text-gray-400 text-sm leading-relaxed space-y-2">
              <p>Select an element on the canvas. Drag to move; wheel zoom; mid-click / Shift+drag / Space+drag to pan.</p>
              <p className="text-gray-500 text-xs">
                Ctrl+Z / Ctrl+Y undo · arrows nudge · Delete removes · code &amp; notes save with the layout JSON.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="text-gray-400 text-xs">Name</div>
                <input
                  value={selectedNode.name}
                  onChange={(e) => updateSelectedNode({ name: e.target.value })}
                  className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
                />
              </div>

              <div className="space-y-2">
                <div className="text-gray-400 text-xs">Code (MES / tag)</div>
                <input
                  value={selectedNode.code ?? ''}
                  onChange={(e) => updateSelectedNode({ code: e.target.value || undefined })}
                  placeholder="e.g. ST-04"
                  className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600 font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <div className="text-gray-400 text-xs">Capacity / throughput hint</div>
                <input
                  type="number"
                  min={0}
                  value={selectedNode.capacity ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateSelectedNode({
                      capacity: v === '' ? undefined : Math.max(0, Number(v) || 0),
                    });
                  }}
                  placeholder="Optional"
                  className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600"
                />
              </div>

              <div className="space-y-2">
                <div className="text-gray-400 text-xs">Notes</div>
                <textarea
                  value={selectedNode.notes ?? ''}
                  onChange={(e) => updateSelectedNode({ notes: e.target.value || undefined })}
                  rows={3}
                  placeholder="Instructions, equipment, safety…"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600 text-sm resize-y min-h-[72px]"
                />
              </div>

              <div className="space-y-2">
                <div className="text-gray-400 text-xs">Layer (z-index)</div>
                <input
                  type="number"
                  value={selectedNode.zIndex ?? 0}
                  onChange={(e) =>
                    updateSelectedNode({ zIndex: Math.round(Number(e.target.value) || 0) })
                  }
                  className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <div className="text-gray-400 text-xs">X</div>
                  <input
                    type="number"
                    value={selectedNode.x}
                    onChange={(e) => updateSelectedNode({ x: Number(e.target.value) || 0 })}
                    className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-gray-400 text-xs">Y</div>
                  <input
                    type="number"
                    value={selectedNode.y}
                    onChange={(e) => updateSelectedNode({ y: Number(e.target.value) || 0 })}
                    className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-gray-400 text-xs">W</div>
                  <input
                    type="number"
                    value={selectedNode.w}
                    onChange={(e) => updateSelectedNode({ w: Math.max(20, Number(e.target.value) || 20) })}
                    className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-gray-400 text-xs">H</div>
                  <input
                    type="number"
                    value={selectedNode.h}
                    onChange={(e) => updateSelectedNode({ h: Math.max(20, Number(e.target.value) || 20) })}
                    className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                  onClick={() => {
                    if (!selectedNode) return;
                    const grid = doc.gridSize || 20;
                    updateSelectedNode({ x: snap(selectedNode.x, grid), y: snap(selectedNode.y, grid) });
                  }}
                >
                  Snap
                </Button>
                <Button
                  variant="outline"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                  onClick={duplicateSelectedNode}
                >
                  <Copy className="w-4 h-4 mr-1 inline" aria-hidden />
                  Duplicate
                </Button>
                <Button
                  variant="outline"
                  className="bg-red-500/10 border-red-500/30 text-red-200 hover:bg-red-500/20"
                  onClick={deleteSelectedNode}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default ProductionLayoutEditor;
