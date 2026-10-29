import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Building,
  Wrench,
  Layers,
  Factory,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileWarning,
  DollarSign,
  Workflow,
  CheckCheck,
  RefreshCw,
  Sliders,
  ShieldCheck,
  BookOpen,
  BarChart3,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Maximize2,
  Cpu,
  Search,
  Play,
  RotateCcw,
  Network,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Link2,
  Database,
  type LucideIcon,
} from 'lucide-react';

interface BlueprintNode {
  id: string;
  title: string;
  path: string;
  icon: LucideIcon;
  badge: string;
  description: string;
  phaseId: string;
  x: number;
  y: number;
}

interface PhaseZone {
  id: string;
  phaseNumber: string;
  title: string;
  subtitle: string;
  color: string;
  borderColor: string;
  bgGradient: string;
  x: number;
  width: number;
  icon: LucideIcon;
}

interface CableRelation {
  id: string;
  source: string;
  target: string;
  label: string;
  category: 'defect' | 'governance' | 'prevention' | 'supplier' | 'intelligence';
  color: string;
}

// =========================================================================
// 1. GRID DIMENSIONS & 6 CORE STAGES (LEFT-TO-RIGHT ENGLISH FLOW)
// =========================================================================

const NODE_WIDTH = 250;
const NODE_HEIGHT = 156;
const CANVAS_WIDTH = 1960;
const CANVAS_HEIGHT = 870;

const PHASES: PhaseZone[] = [
  {
    id: 'supply_chain',
    phaseNumber: '01',
    title: 'Supply Chain & Inbound',
    subtitle: 'Master Data & Vendor Control',
    color: '#10B981',
    borderColor: 'border-emerald-500/30',
    bgGradient: 'from-emerald-950/30 via-emerald-950/10 to-transparent',
    x: 40,
    width: 280,
    icon: Truck,
  },
  {
    id: 'shopfloor',
    phaseNumber: '02',
    title: 'Shopfloor & Production',
    subtitle: 'In-Process Quality Execution',
    color: '#0EA5E9',
    borderColor: 'border-sky-500/30',
    bgGradient: 'from-sky-950/30 via-sky-950/10 to-transparent',
    x: 360,
    width: 280,
    icon: Factory,
  },
  {
    id: 'nonconformance',
    phaseNumber: '03',
    title: 'Containment & NCR',
    subtitle: 'Quarantine & Cost of Poor Quality',
    color: '#EF4444',
    borderColor: 'border-red-500/30',
    bgGradient: 'from-red-950/30 via-red-950/10 to-transparent',
    x: 680,
    width: 280,
    icon: AlertTriangle,
  },
  {
    id: 'root_cause',
    phaseNumber: '04',
    title: 'Root Cause & CAPA',
    subtitle: '8D Problem Solving & Actions',
    color: '#8B5CF6',
    borderColor: 'border-purple-500/30',
    bgGradient: 'from-purple-950/30 via-purple-950/10 to-transparent',
    x: 1000,
    width: 280,
    icon: Workflow,
  },
  {
    id: 'engineering',
    phaseNumber: '05',
    title: 'Engineering & Prevention',
    subtitle: 'FMEA Risk & Control Plans',
    color: '#F59E0B',
    borderColor: 'border-amber-500/30',
    bgGradient: 'from-amber-950/30 via-amber-950/10 to-transparent',
    x: 1320,
    width: 280,
    icon: ShieldCheck,
  },
  {
    id: 'intelligence',
    phaseNumber: '06',
    title: 'SPC & AI Intelligence',
    subtitle: 'Control Tower & System Audits',
    color: '#06B6D4',
    borderColor: 'border-cyan-500/30',
    bgGradient: 'from-cyan-950/30 via-cyan-950/10 to-transparent',
    x: 1640,
    width: 280,
    icon: Cpu,
  },
];

// All 24 paths match 100% with src/router/index.tsx
const NODES: BlueprintNode[] = [
  // Stage 01: Supply Chain & Inbound (x: 55)
  {
    id: 'iqc',
    title: 'Incoming Inspection (IQC)',
    path: '/inspection',
    icon: Truck,
    badge: 'INBOUND QC',
    description: 'Inspect incoming raw materials and shipments against AQL sampling plans.',
    phaseId: 'supply_chain',
    x: 55,
    y: 110,
  },
  {
    id: 'suppliers',
    title: 'Supplier Quality Scorecard',
    path: '/supplier-quality',
    icon: Building,
    badge: 'VENDOR RATING',
    description: 'Track supplier quality ratings automatically based on lot acceptance and defects.',
    phaseId: 'supply_chain',
    x: 55,
    y: 295,
  },
  {
    id: 'calibration',
    title: 'Metrology & Calibration',
    path: '/calibration',
    icon: Wrench,
    badge: 'GAUGE CONTROL',
    description: 'Manage measurement tool certificates and calibration schedules for accurate testing.',
    phaseId: 'supply_chain',
    x: 55,
    y: 480,
  },
  {
    id: 'master_data',
    title: 'Master Data & Catalogs',
    path: '/quality-master-data',
    icon: Database,
    badge: 'CORE STANDARDS',
    description: 'Configure parts, standard defect catalogs, production lines, and acceptance criteria.',
    phaseId: 'supply_chain',
    x: 55,
    y: 665,
  },

  // Stage 02: Shopfloor & Production (x: 375)
  {
    id: 'daily_defects',
    title: 'Real-Time Defect Logger',
    path: '/defect-log',
    icon: Activity,
    badge: 'SHOPFLOOR LOG',
    description: 'Capture live production defects with photos, machine IDs, shifts, and Pareto analytics.',
    phaseId: 'shopfloor',
    x: 375,
    y: 110,
  },
  {
    id: 'inspection_plans',
    title: 'In-Process Inspection (IPQC)',
    path: '/quality-inspection-plans',
    icon: CheckCircle2,
    badge: 'PROCESS GATES',
    description: 'Execute in-process quality checks and mandatory First Piece Inspection approvals.',
    phaseId: 'shopfloor',
    x: 375,
    y: 295,
  },
  {
    id: 'lpa',
    title: 'Layered Process Audits',
    path: '/quality-audits',
    icon: Layers,
    badge: 'LPA AUDITS',
    description: 'Verify operator adherence to standard work instructions across all production shifts.',
    phaseId: 'shopfloor',
    x: 375,
    y: 480,
  },
  {
    id: 'setup_readiness',
    title: 'Line Setup & Readiness',
    path: '/quality-execution-board',
    icon: Sliders,
    badge: 'LINE CLEARANCE',
    description: 'Validate machine parameters and issue formal Go/No-Go line startup authorization.',
    phaseId: 'shopfloor',
    x: 375,
    y: 665,
  },

  // Stage 03: Containment & NCR (x: 695)
  {
    id: 'ncr',
    title: 'Non-Conformance (NCR)',
    path: '/quality/records/ncr',
    icon: AlertTriangle,
    badge: 'QUARANTINE',
    description: 'Isolate non-conforming batches, issue hold tags, and trigger formal disposition.',
    phaseId: 'nonconformance',
    x: 695,
    y: 110,
  },
  {
    id: 'deviation',
    title: 'Process Deviations',
    path: '/deviation',
    icon: FileWarning,
    badge: 'CONCESSION',
    description: 'Manage temporary engineering concessions and conditional material approvals.',
    phaseId: 'nonconformance',
    x: 695,
    y: 295,
  },
  {
    id: 'complaints',
    title: 'Customer Complaints',
    path: '/complaints',
    icon: Building,
    badge: 'VOICE OF CUSTOMER',
    description: 'Track customer returns and RMA claims with instant linkage to NCR and 8D.',
    phaseId: 'nonconformance',
    x: 695,
    y: 480,
  },
  {
    id: 'defect_cost',
    title: 'Cost of Poor Quality',
    path: '/defect-cost',
    icon: DollarSign,
    badge: 'COPQ FINANCE',
    description: 'Calculate financial impact of scrap, rework, sorting, and warranty returns.',
    phaseId: 'nonconformance',
    x: 695,
    y: 665,
  },

  // Stage 04: Root Cause & CAPA (x: 1015)
  {
    id: 'capa_records',
    title: 'CAPA Action Plans',
    path: '/quality/records/capa',
    icon: CheckCheck,
    badge: 'PREVENTIVE ACTION',
    description: 'Drive verified corrective and preventive action plans across cross-functional teams.',
    phaseId: 'root_cause',
    x: 1015,
    y: 110,
  },
  {
    id: 'eight_d',
    title: '8D Root Cause Analysis',
    path: '/quality/records/8d',
    icon: RefreshCw,
    badge: '8D METHODOLOGY',
    description: 'Conduct structured root cause investigations using Fishbone and 5-Why tools.',
    phaseId: 'root_cause',
    x: 1015,
    y: 295,
  },
  {
    id: 'change_control',
    title: 'Engineering Change (ECN)',
    path: '/change-control',
    icon: Sliders,
    badge: '4M CHANGE GOV',
    description: 'Govern and document changes to design, tooling, machines, or raw materials.',
    phaseId: 'root_cause',
    x: 1015,
    y: 480,
  },
  {
    id: 'command_center',
    title: 'Action Command Center',
    path: '/quality-command-center',
    icon: Workflow,
    badge: 'EXECUTION SLA',
    description: 'Monitor overdue tasks, action closure velocity, and departmental accountability.',
    phaseId: 'root_cause',
    x: 1015,
    y: 665,
  },

  // Stage 05: Engineering & Prevention (x: 1335)
  {
    id: 'fmea',
    title: 'Risk Analysis (PFMEA)',
    path: '/fmea',
    icon: ShieldCheck,
    badge: 'RISK MATRIX',
    description: 'Evaluate Severity, Occurrence, and Detection (RPN) to prevent potential failures.',
    phaseId: 'engineering',
    x: 1335,
    y: 110,
  },
  {
    id: 'control_plan',
    title: 'Dynamic Control Plan',
    path: '/control-plan',
    icon: Sliders,
    badge: 'PROCESS SPECS',
    description: 'Define critical control characteristics, inspection frequencies, and reaction plans.',
    phaseId: 'engineering',
    x: 1335,
    y: 295,
  },
  {
    id: 'knowledge_base',
    title: 'Lessons Learned Hub',
    path: '/quality-knowledge-base',
    icon: BookOpen,
    badge: 'KNOWLEDGE BASE',
    description: 'Institutionalize solved 8D cases and best practices to prevent recurring defects.',
    phaseId: 'engineering',
    x: 1335,
    y: 480,
  },
  {
    id: 'form_designer',
    title: 'Smart Form Designer',
    path: '/quality-form-designer',
    icon: Layers,
    badge: 'NO-CODE STUDIO',
    description: 'Build custom digital inspection checklists and deploy them to shopfloor stations.',
    phaseId: 'engineering',
    x: 1335,
    y: 665,
  },

  // Stage 06: SPC & AI Intelligence (x: 1655)
  {
    id: 'spc',
    title: 'Statistical Control (SPC)',
    path: '/spc',
    icon: TrendingUp,
    badge: 'SIX SIGMA CPK',
    description: 'Real-time X-Bar R control charts and Cp/Cpk capability indices for early drift detection.',
    phaseId: 'intelligence',
    x: 1655,
    y: 110,
  },
  {
    id: 'control_tower',
    title: 'Quality Control Tower',
    path: '/quality-control-tower',
    icon: BarChart3,
    badge: '360° OVERSIGHT',
    description: 'Unified executive command center for plant-wide quality KPIs and live stream alerts.',
    phaseId: 'intelligence',
    x: 1655,
    y: 295,
  },
  {
    id: 'ai_copilot',
    title: 'AI Quality Copilot',
    path: '/ai/defect-prediction',
    icon: Sparkles,
    badge: 'PREDICTIVE AI',
    description: 'Predict defect spikes, analyze complex correlations, and auto-draft 8D root causes.',
    phaseId: 'intelligence',
    x: 1655,
    y: 480,
  },
  {
    id: 'audits',
    title: 'System & Process Audits',
    path: '/audit',
    icon: ShieldCheck,
    badge: 'ISO / IATF AUDIT',
    description: 'Schedule internal and external compliance audits, track findings, and verify closure.',
    phaseId: 'intelligence',
    x: 1655,
    y: 665,
  },
];

// =========================================================================
// 2. COMPLETE CLOSED-LOOP ENGINEERING RELATIONSHIPS (39 ACTIVE LINKS)
// =========================================================================

const CABLES: CableRelation[] = [
  // Stage 01 Links (Supply Chain & Foundation)
  { id: 'c1', source: 'master_data', target: 'inspection_plans', label: 'Feeds standard defect catalogs & acceptance specs', category: 'governance', color: '#10B981' },
  { id: 'c2', source: 'master_data', target: 'fmea', label: 'Supplies part BOM & process steps for risk analysis', category: 'governance', color: '#10B981' },
  { id: 'c3', source: 'calibration', target: 'iqc', label: 'Validates gauge accuracy for incoming inspection', category: 'governance', color: '#10B981' },
  { id: 'c4', source: 'calibration', target: 'spc', label: 'Ensures measurement reliability for SPC charts', category: 'intelligence', color: '#06B6D4' },
  { id: 'c5', source: 'iqc', target: 'suppliers', label: 'Auto-updates vendor scorecard from lot results', category: 'supplier', color: '#10B981' },
  { id: 'c6', source: 'iqc', target: 'ncr', label: 'Triggers NCR & quarantine for rejected material', category: 'supplier', color: '#F59E0B' },
  { id: 'c7', source: 'iqc', target: 'deviation', label: 'Requests conditional concession for urgent lots', category: 'supplier', color: '#F59E0B' },
  { id: 'c8', source: 'suppliers', target: 'audits', label: 'Schedules supplier audits for low-rated vendors', category: 'supplier', color: '#10B981' },

  // Stage 02 Links (Shopfloor & Production)
  { id: 'c9', source: 'setup_readiness', target: 'inspection_plans', label: 'Authorizes line startup & First Piece check', category: 'governance', color: '#0EA5E9' },
  { id: 'c10', source: 'inspection_plans', target: 'daily_defects', label: 'Logs defects detected during IPQC patrol', category: 'defect', color: '#0EA5E9' },
  { id: 'c11', source: 'daily_defects', target: 'ncr', label: 'Escalates critical shopfloor defects to NCR', category: 'defect', color: '#EF4444' },
  { id: 'c12', source: 'daily_defects', target: 'spc', label: 'Streams live defect telemetry into SPC charts', category: 'intelligence', color: '#0EA5E9' },
  { id: 'c13', source: 'daily_defects', target: 'defect_cost', label: 'Calculates daily scrap and rework cost', category: 'defect', color: '#EF4444' },
  { id: 'c14', source: 'lpa', target: 'capa_records', label: 'Opens CAPA for non-compliant process audit items', category: 'governance', color: '#0EA5E9' },
  { id: 'c15', source: 'lpa', target: 'setup_readiness', label: 'Verifies operator compliance with setup checklists', category: 'governance', color: '#0EA5E9' },

  // Stage 03 Links (Containment, NCR & Complaints)
  { id: 'c16', source: 'ncr', target: 'capa_records', label: 'Initiates corrective & preventive action plan', category: 'defect', color: '#EF4444' },
  { id: 'c17', source: 'ncr', target: 'eight_d', label: 'Launches 8D investigation for major non-conformance', category: 'defect', color: '#8B5CF6' },
  { id: 'c18', source: 'ncr', target: 'defect_cost', label: 'Records quarantine sorting & scrap losses', category: 'defect', color: '#EF4444' },
  { id: 'c19', source: 'complaints', target: 'ncr', label: 'Converts customer RMA claim into formal NCR', category: 'defect', color: '#EF4444' },
  { id: 'c20', source: 'complaints', target: 'eight_d', label: 'Mandates 8D root cause report for customer', category: 'defect', color: '#8B5CF6' },
  { id: 'c21', source: 'deviation', target: 'change_control', label: 'Routes temporary deviation for engineering review', category: 'governance', color: '#F59E0B' },
  { id: 'c22', source: 'defect_cost', target: 'control_tower', label: 'Reports COPQ financial impact to Control Tower', category: 'intelligence', color: '#EF4444' },

  // Stage 04 Links (Root Cause, 8D & CAPA)
  { id: 'c23', source: 'eight_d', target: 'fmea', label: 'Updates PFMEA risk matrix with new failure modes', category: 'prevention', color: '#F59E0B' },
  { id: 'c24', source: 'eight_d', target: 'control_plan', label: 'Enforces new poka-yoke controls in Control Plan', category: 'prevention', color: '#10B981' },
  { id: 'c25', source: 'eight_d', target: 'knowledge_base', label: 'Archives verified root cause in Lessons Learned', category: 'prevention', color: '#10B981' },
  { id: 'c26', source: 'capa_records', target: 'change_control', label: 'Triggers formal Engineering Change Notice (ECN)', category: 'governance', color: '#8B5CF6' },
  { id: 'c27', source: 'capa_records', target: 'command_center', label: 'Tracks CAPA due dates and closure SLA', category: 'governance', color: '#8B5CF6' },
  { id: 'c28', source: 'change_control', target: 'control_plan', label: 'Revises Control Plan specs after ECN approval', category: 'prevention', color: '#8B5CF6' },
  { id: 'c29', source: 'command_center', target: 'control_tower', label: 'Broadcasts action closure KPIs to executive tower', category: 'intelligence', color: '#8B5CF6' },

  // Stage 05 Links (Engineering & Prevention)
  { id: 'c30', source: 'fmea', target: 'control_plan', label: 'Transfers high-RPN characteristics to Control Plan', category: 'prevention', color: '#F59E0B' },
  { id: 'c31', source: 'control_plan', target: 'inspection_plans', label: 'Deploys updated inspection specs to shopfloor', category: 'governance', color: '#0EA5E9' },
  { id: 'c32', source: 'control_plan', target: 'spc', label: 'Sets USL/LSL specification limits for SPC charts', category: 'intelligence', color: '#06B6D4' },
  { id: 'c33', source: 'form_designer', target: 'inspection_plans', label: 'Publishes digital checklists to IPQC stations', category: 'governance', color: '#F59E0B' },
  { id: 'c34', source: 'form_designer', target: 'lpa', label: 'Provides custom audit templates for LPA', category: 'governance', color: '#F59E0B' },
  { id: 'c35', source: 'knowledge_base', target: 'ai_copilot', label: 'Trains AI Copilot on historical 8D solutions', category: 'intelligence', color: '#06B6D4' },

  // Stage 06 Links (SPC, AI & Audits)
  { id: 'c36', source: 'spc', target: 'ai_copilot', label: 'Feeds process drift trends for predictive alerts', category: 'intelligence', color: '#06B6D4' },
  { id: 'c37', source: 'spc', target: 'control_tower', label: 'Streams live Cp/Cpk capability metrics to Tower', category: 'intelligence', color: '#06B6D4' },
  { id: 'c38', source: 'ai_copilot', target: 'eight_d', label: 'Recommends AI-generated root causes to 8D teams', category: 'intelligence', color: '#06B6D4' },
  { id: 'c39', source: 'audits', target: 'capa_records', label: 'Generates CAPA records from audit non-conformities', category: 'governance', color: '#06B6D4' },
];

// =========================================================================
// 3. MAIN INTERACTIVE ECOSYSTEM PORTAL COMPONENT
// =========================================================================

export default function QualityEcosystemPortal() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom State
  const [zoom, setZoom] = useState<number>(0.75);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 20, y: 20 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);

  // Interaction State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSimulation, setActiveSimulation] = useState<'none' | 'defect' | 'supplier' | 'prevention'>('none');
  const [activePhaseFilter, setActivePhaseFilter] = useState<string | null>(null);

  // Auto-fit entire 24-node matrix cleanly inside the viewport
  const fitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    const padding = 20;
    const scaleX = (clientWidth - padding * 2) / CANVAS_WIDTH;
    const scaleY = (clientHeight - padding * 2) / CANVAS_HEIGHT;
    const optimalZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.45), 1.05);

    const centerX = (clientWidth - CANVAS_WIDTH * optimalZoom) / 2;
    const centerY = (clientHeight - CANVAS_HEIGHT * optimalZoom) / 2;

    setZoom(optimalZoom);
    setPan({ x: centerX, y: centerY });
  }, []);

  useEffect(() => {
    fitToScreen();
    window.addEventListener('resize', fitToScreen);
    return () => window.removeEventListener('resize', fitToScreen);
  }, [fitToScreen]);

  // Center camera on a specific node
  const centerOnNode = useCallback((nodeId: string) => {
    const targetNode = NODES.find((n) => n.id === nodeId);
    if (!targetNode || !containerRef.current) return;

    const { clientWidth, clientHeight } = containerRef.current;
    const targetZoom = Math.max(zoom, 0.85);
    const nodeCenterX = targetNode.x + NODE_WIDTH / 2;
    const nodeCenterY = targetNode.y + NODE_HEIGHT / 2;

    const targetPanX = clientWidth / 2 - nodeCenterX * targetZoom;
    const targetPanY = clientHeight / 2 - nodeCenterY * targetZoom;

    setZoom(targetZoom);
    setPan({ x: targetPanX, y: targetPanY });
    setSelectedNodeId(nodeId);
  }, [zoom]);

  // Focus camera when simulation is triggered
  useEffect(() => {
    if (activeSimulation === 'defect') {
      centerOnNode('ncr');
    } else if (activeSimulation === 'supplier') {
      centerOnNode('iqc');
    } else if (activeSimulation === 'prevention') {
      centerOnNode('eight_d');
    }
  }, [activeSimulation, centerOnNode]);

  // Drag-to-pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setHasMoved(false);
    setStartPoint({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const newX = e.clientX - startPoint.x;
    const newY = e.clientY - startPoint.y;
    if (Math.abs(newX - pan.x) > 3 || Math.abs(newY - pan.y) > 3) {
      setHasMoved(true);
    }
    setPan({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Smooth wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.4), 1.6);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const activeNodeId = hoveredNodeId || selectedNodeId;

  // Active highlighted cables
  const highlightedCableIds = useMemo(() => {
    const set = new Set<string>();

    if (activeSimulation === 'defect') {
      ['c10', 'c11', 'c12', 'c16', 'c17', 'c18', 'c23', 'c36'].forEach((id) => set.add(id));
      return set;
    }
    if (activeSimulation === 'supplier') {
      ['c3', 'c5', 'c6', 'c8', 'c17'].forEach((id) => set.add(id));
      return set;
    }
    if (activeSimulation === 'prevention') {
      ['c23', 'c24', 'c25', 'c30', 'c31', 'c32', 'c35'].forEach((id) => set.add(id));
      return set;
    }

    if (activeNodeId) {
      CABLES.forEach((c) => {
        if (c.source === activeNodeId || c.target === activeNodeId) {
          set.add(c.id);
        }
      });
      return set;
    }

    return set;
  }, [activeNodeId, activeSimulation]);

  // Connected nodes to highlight
  const activeConnectedNodeIds = useMemo(() => {
    const set = new Set<string>();
    if (activeNodeId) set.add(activeNodeId);

    highlightedCableIds.forEach((cId) => {
      const c = CABLES.find((item) => item.id === cId);
      if (c) {
        set.add(c.source);
        set.add(c.target);
      }
    });

    return set;
  }, [activeNodeId, highlightedCableIds]);

  // Count links per node
  const nodeConnectionsCount = useMemo(() => {
    const counts: Record<string, number> = {};
    NODES.forEach((n) => {
      counts[n.id] = CABLES.filter((c) => c.source === n.id || c.target === n.id).length;
    });
    return counts;
  }, []);

  // Instant search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return NODES.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.badge.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Active node details for bottom status bar
  const activeNodeInfo = useMemo(() => {
    if (!activeNodeId) return null;
    const node = NODES.find((n) => n.id === activeNodeId);
    if (!node) return null;
    const phase = PHASES.find((p) => p.id === node.phaseId);

    const incoming = CABLES.filter((c) => c.target === node.id).map((c) => {
      const srcNode = NODES.find((n) => n.id === c.source);
      return { cable: c, sourceId: c.source, sourceName: srcNode?.title || c.source };
    });

    const outgoing = CABLES.filter((c) => c.source === node.id).map((c) => {
      const tgtNode = NODES.find((n) => n.id === c.target);
      return { cable: c, targetId: c.target, targetName: tgtNode?.title || c.target };
    });

    return { node, phase, incoming, outgoing };
  }, [activeNodeId]);

  return (
    <div className="h-full max-h-full overflow-hidden flex flex-col select-none relative w-full text-white bg-[#040812] font-sans" dir="ltr">
      
      {/* ========================================================================= */}
      {/* 1. TOP COMMAND BAR (SIMULATIONS, STAGE FILTERS, SEARCH & ZOOM) */}
      {/* ========================================================================= */}
      <header className="h-14 px-3 sm:px-6 border-b border-white/10 bg-[#070d19]/90 backdrop-blur-2xl flex items-center justify-between shrink-0 z-30 gap-2">
        
        {/* Brand & Ecosystem Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0066CC] to-[#00A3E0] flex items-center justify-center shadow-[0_0_25px_rgba(0,163,224,0.45)] border border-sky-400/40">
            <Network className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight">
                QMS 4.0 Interactive Ecosystem
              </h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                24 Connected Modules
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              Hover any module to trace live data conduits • Click to launch directly
            </p>
          </div>
        </div>

        {/* Live Scenario Simulation Buttons */}
        <div className="hidden lg:flex items-center gap-1.5 p-1 bg-white/[0.04] border border-white/10 rounded-2xl">
          <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
            <Play className="w-3 h-3 text-sky-400" />
            <span>Simulate Flow:</span>
          </span>

          <button
            type="button"
            onClick={() => setActiveSimulation(activeSimulation === 'defect' ? 'none' : 'defect')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSimulation === 'defect'
                ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-105'
                : 'bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/25'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            <span>Defect ➔ NCR ➔ 8D</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSimulation(activeSimulation === 'supplier' ? 'none' : 'supplier')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSimulation === 'supplier'
                ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-105'
                : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/25'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>IQC Reject ➔ Vendor Rating</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSimulation(activeSimulation === 'prevention' ? 'none' : 'prevention')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSimulation === 'prevention'
                ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-105'
                : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/25'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>8D Closure ➔ Control Plan</span>
          </button>

          {activeSimulation !== 'none' && (
            <button
              type="button"
              onClick={() => setActiveSimulation('none')}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              title="Reset Simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Stage Filter, Search & Zoom Controls */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Quick Stage Filter */}
          <div className="hidden 2xl:flex items-center gap-1 bg-white/[0.04] border border-white/10 rounded-xl p-1">
            <button
              type="button"
              onClick={() => {
                setActivePhaseFilter(null);
                fitToScreen();
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                !activePhaseFilter ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            {PHASES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  if (activePhaseFilter === p.id) {
                    setActivePhaseFilter(null);
                    fitToScreen();
                  } else {
                    setActivePhaseFilter(p.id);
                    const firstNode = NODES.find((n) => n.phaseId === p.id);
                    if (firstNode) centerOnNode(firstNode.id);
                  }
                }}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  activePhaseFilter === p.id
                    ? 'bg-white/15 text-white border border-white/30 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={{ color: activePhaseFilter === p.id ? p.color : undefined }}
              >
                {p.title.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Search Module Input */}
          <div className="relative">
            <div className="flex items-center gap-1.5 bg-white/[0.05] border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-sky-400/60 transition-colors w-36 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search module..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white placeholder:text-slate-500 w-full"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0c1424] border border-white/15 rounded-xl shadow-2xl p-1.5 z-50 max-h-60 overflow-y-auto">
                {searchResults.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => {
                      centerOnNode(res.id);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-white/10 flex items-center justify-between gap-2 transition-colors"
                  >
                    <span className="font-bold text-white">{res.title}</span>
                    <span className="text-[9px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md font-bold">
                      {res.badge}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Zoom & Fit Controls */}
          <div className="flex items-center gap-1 bg-white/[0.05] border border-white/10 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(z + 0.12, 1.5))}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-bold text-slate-300 px-1 min-w-[38px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(z - 0.12, 0.45))}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3.5 bg-white/10 mx-0.5" />
            <button
              type="button"
              onClick={fitToScreen}
              className="p-1.5 rounded-lg hover:bg-white/10 text-sky-400 hover:text-sky-300"
              title="Fit to Screen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE NODE CANVAS (PAN & ZOOM) */}
      {/* ========================================================================= */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`flex-1 overflow-hidden relative w-full h-full ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        } bg-[radial-gradient(ellipse_at_center,#0a1326_0%,#040812_100%)]`}
      >
        {/* Subtle Cyber Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage: `radial-gradient(rgba(56, 189, 248, 0.35) 1px, transparent 1px)`,
            backgroundSize: `${28 * zoom}px ${28 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        />

        {/* Transform Layer: Stages, Laser Cables & Cards */}
        <div
          className="absolute top-0 left-0 transition-transform duration-75 origin-top-left pointer-events-auto"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
          }}
        >
          {/* ------------------------------------------------------------- */}
          {/* 6 STAGE ZONES */}
          {/* ------------------------------------------------------------- */}
          {PHASES.map((phase) => {
            const isPhaseActive = !activePhaseFilter || activePhaseFilter === phase.id;
            return (
              <div
                key={phase.id}
                style={{
                  left: `${phase.x}px`,
                  top: '20px',
                  width: `${phase.width}px`,
                  height: '830px',
                }}
                className={`absolute rounded-3xl border ${phase.borderColor} bg-gradient-to-b ${phase.bgGradient} p-4 pointer-events-none transition-all duration-300 ${
                  isPhaseActive ? 'opacity-100' : 'opacity-20'
                }`}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg border border-white/15"
                      style={{
                        backgroundColor: phase.color + '25',
                        color: phase.color,
                        boxShadow: `0 0 20px ${phase.color}30`,
                      }}
                    >
                      <phase.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md"
                          style={{ backgroundColor: phase.color + '20', color: phase.color }}
                        >
                          STAGE {phase.phaseNumber}
                        </span>
                      </div>
                      <h3 className="text-[14px] font-black text-white mt-0.5 tracking-tight">
                        {phase.title}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* ------------------------------------------------------------- */}
          {/* DYNAMIC SVG LASER CABLES */}
          {/* ------------------------------------------------------------- */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}
          >
            <defs>
              <filter id="laserGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              <linearGradient id="laserPulseRed" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#FCA5A5" stopOpacity="1" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0.2" />
              </linearGradient>

              <linearGradient id="laserPulseEmerald" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#6EE7B7" stopOpacity="1" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.2" />
              </linearGradient>

              <linearGradient id="laserPulseCyan" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#BAE6FD" stopOpacity="1" />
                <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.2" />
              </linearGradient>

              <linearGradient id="laserPulsePurple" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#DDD6FE" stopOpacity="1" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {CABLES.map((cable) => {
              const src = NODES.find((n) => n.id === cable.source);
              const tgt = NODES.find((n) => n.id === cable.target);
              if (!src || !tgt) return null;

              const isSameColumn = src.x === tgt.x;
              const isForwardLtr = tgt.x > src.x;

              let x1 = src.x + NODE_WIDTH;
              const y1 = src.y + NODE_HEIGHT / 2;
              let x2 = tgt.x;
              const y2 = tgt.y + NODE_HEIGHT / 2;

              let pathD = '';

              if (isSameColumn) {
                x1 = src.x + NODE_WIDTH;
                x2 = tgt.x + NODE_WIDTH;
                const curveOffset = 45;
                pathD = `M ${x1} ${y1} C ${x1 + curveOffset} ${y1}, ${x2 + curveOffset} ${y2}, ${x2} ${y2}`;
              } else if (isForwardLtr) {
                x1 = src.x + NODE_WIDTH;
                x2 = tgt.x;
                const dx = Math.max(55, (x2 - x1) * 0.45);
                pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
              } else {
                x1 = src.x;
                x2 = tgt.x + NODE_WIDTH;
                const archOffset = y1 > 450 ? 110 : -110;
                pathD = `M ${x1} ${y1} C ${x1 - 80} ${y1 + archOffset}, ${x2 + 80} ${y2 + archOffset}, ${x2} ${y2}`;
              }

              const isHighlighted = highlightedCableIds.has(cable.id);

              return (
                <g key={cable.id}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isHighlighted ? cable.color : 'rgba(148, 163, 184, 0.13)'}
                    strokeWidth={isHighlighted ? '3' : '1.4'}
                    strokeDasharray={isHighlighted ? 'none' : '5, 5'}
                    filter={isHighlighted ? 'url(#laserGlow)' : 'none'}
                    className="transition-all duration-300"
                  />

                  {isHighlighted && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke={
                        cable.color === '#EF4444'
                          ? 'url(#laserPulseRed)'
                          : cable.color === '#10B981'
                          ? 'url(#laserPulseEmerald)'
                          : cable.color === '#8B5CF6'
                          ? 'url(#laserPulsePurple)'
                          : 'url(#laserPulseCyan)'
                      }
                      strokeWidth="4.5"
                      strokeDasharray="18, 26"
                      className="animate-laser-flow"
                      filter="url(#laserGlow)"
                      style={{ animationDuration: '0.75s' }}
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* ------------------------------------------------------------- */}
          {/* 4. REDESIGNED MODULE CARDS (CRISP VISIBLE ENGLISH TITLES) */}
          {/* ------------------------------------------------------------- */}
          {NODES.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isHovered = hoveredNodeId === node.id;
            const isConnected = activeConnectedNodeIds.has(node.id);
            const isDimmed = activeNodeId && !isConnected && activeSimulation === 'none';
            const phase = PHASES.find((p) => p.id === node.phaseId);
            const themeColor = phase?.color || '#0EA5E9';
            const linksCount = nodeConnectionsCount[node.id] || 0;

            return (
              <div
                key={node.id}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: `${NODE_WIDTH}px`,
                  height: `${NODE_HEIGHT}px`,
                  boxShadow:
                    isSelected || isHovered
                      ? `0 14px 35px -5px ${themeColor}45, 0 0 0 2px ${themeColor}`
                      : isConnected
                      ? `0 8px 25px -5px ${themeColor}30, 0 0 0 1.5px ${themeColor}90`
                      : '0 10px 30px -10px rgba(0, 0, 0, 0.7)',
                }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={() => {
                  if (hasMoved) return;
                  setSelectedNodeId(node.id === selectedNodeId ? null : node.id);
                }}
                onDoubleClick={() => {
                  navigate(node.path);
                }}
                className={`absolute rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-200 z-20 group backdrop-blur-xl ${
                  isSelected
                    ? 'bg-[#111c33] scale-[1.04]'
                    : isHovered
                    ? 'bg-[#0f192d] scale-[1.03]'
                    : isConnected
                    ? 'bg-[#0d1627]'
                    : 'bg-[#09101d]/95 border border-white/10 hover:border-white/25'
                } ${isDimmed ? 'opacity-25' : 'opacity-100'}`}
              >
                {/* Top Neon Accent Bar */}
                <div
                  className="h-1.5 w-full shrink-0"
                  style={{
                    background: `linear-gradient(90deg, ${themeColor}, ${themeColor}55)`,
                  }}
                />

                {/* Soft Ambient Corner Glow */}
                <div
                  className="absolute -top-10 -left-10 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity"
                  style={{ backgroundColor: themeColor }}
                />

                {/* Integrated Side Connection Ports */}
                <div
                  className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#040812] transition-transform group-hover:scale-125"
                  style={{
                    backgroundColor: isConnected ? themeColor : '#334155',
                    boxShadow: isConnected ? `0 0 10px ${themeColor}` : 'none',
                  }}
                />
                <div
                  className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#040812] transition-transform group-hover:scale-125"
                  style={{
                    backgroundColor: isConnected ? themeColor : '#334155',
                    boxShadow: isConnected ? `0 0 10px ${themeColor}` : 'none',
                  }}
                />

                {/* Card Content */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  
                  {/* Top Row: Icon + Clear Visible English Title + Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/15 transition-transform group-hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, ${themeColor}35, ${themeColor}10)`,
                          color: themeColor,
                          boxShadow: `inset 0 1px 1px rgba(255,255,255,0.2)`,
                        }}
                      >
                        <node.icon className="w-5 h-5" />
                      </div>

                      <div>
                        <h4 className="text-[14px] font-black text-white group-hover:text-sky-300 transition-colors leading-snug tracking-tight">
                          {node.title}
                        </h4>
                        <span
                          className="inline-block text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md mt-1"
                          style={{
                            backgroundColor: `${themeColor}20`,
                            color: themeColor,
                          }}
                        >
                          {node.badge}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Row: Concise English Description */}
                  <p className="text-[11px] text-slate-300/85 leading-relaxed line-clamp-2 my-1.5">
                    {node.description}
                  </p>

                  {/* Bottom Row: Active Links Count + Direct Launch Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
                    <div className="flex items-center gap-1 text-[10px] text-slate-300 font-semibold">
                      <Link2 className="w-3 h-3" style={{ color: themeColor }} />
                      <span>{linksCount} Active Links</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(node.path);
                      }}
                      style={{
                        backgroundColor: isHovered ? themeColor : 'rgba(255,255,255,0.06)',
                        color: isHovered ? '#ffffff' : '#e2e8f0',
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm hover:shadow-md"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DOCKED SINGLE-LINE BOTTOM STATUS BAR (NEVER COVERS CARDS OR LINKS) */}
      {/* ========================================================================= */}
      <div className="h-12 px-4 border-t border-white/10 bg-[#070d19]/95 backdrop-blur-2xl flex items-center justify-between shrink-0 z-30 gap-3 overflow-x-auto no-scrollbar">
        {activeNodeInfo ? (
          <>
            {/* Active Module Identity */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/15 shrink-0"
                style={{
                  backgroundColor: activeNodeInfo.phase?.color + '25',
                  color: activeNodeInfo.phase?.color,
                }}
              >
                <activeNodeInfo.node.icon className="w-4 h-4" />
              </div>
              <span
                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                style={{
                  backgroundColor: activeNodeInfo.phase?.color + '20',
                  color: activeNodeInfo.phase?.color,
                }}
              >
                {activeNodeInfo.phase?.title}
              </span>
              <h3 className="text-xs sm:text-sm font-black text-white whitespace-nowrap">
                {activeNodeInfo.node.title}
              </h3>
            </div>

            {/* Single-Line Inputs & Outputs */}
            <div className="flex items-center gap-3 text-[11px] shrink-0">
              {/* Inputs */}
              <div className="flex items-center gap-1.5">
                <span className="text-sky-400 font-bold whitespace-nowrap">📥 Inputs From:</span>
                {activeNodeInfo.incoming.length > 0 ? (
                  <div className="flex items-center gap-1">
                    {activeNodeInfo.incoming.map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedNodeId(item.sourceId)}
                        title={item.cable.label}
                        className="px-2 py-0.5 rounded-md bg-sky-500/15 hover:bg-sky-500/30 border border-sky-500/30 text-white font-bold whitespace-nowrap flex items-center gap-1 transition-colors"
                      >
                        <span>{item.sourceName}</span>
                        <span className="text-[10px] text-sky-300 font-normal hidden xl:inline">
                          ({item.cable.label})
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-500 whitespace-nowrap">Primary Source Node</span>
                )}
              </div>

              <span className="text-white/20">|</span>

              {/* Outputs */}
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold whitespace-nowrap">📤 Feeds Into:</span>
                {activeNodeInfo.outgoing.length > 0 ? (
                  <div className="flex items-center gap-1">
                    {activeNodeInfo.outgoing.map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedNodeId(item.targetId)}
                        title={item.cable.label}
                        className="px-2 py-0.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/30 text-white font-bold whitespace-nowrap flex items-center gap-1 transition-colors"
                      >
                        <span>{item.targetName}</span>
                        <span className="text-[10px] text-emerald-300 font-normal hidden xl:inline">
                          ({item.cable.label})
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-500 whitespace-nowrap">Executive Endpoint</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {selectedNodeId && (
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(null)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-400 hover:text-white hover:bg-white/10"
                >
                  Unpin
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate(activeNodeInfo.node.path)}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white text-[11px] font-black flex items-center gap-1.5 shadow-md hover:scale-105 transition-all whitespace-nowrap"
              >
                <span>Launch Module</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </>
        ) : (
          <div className="w-full flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span>
                Hover over any module card to illuminate its connected workflows and inspect data inputs/outputs
              </span>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Double-click any card or click "Open" to launch the module
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
