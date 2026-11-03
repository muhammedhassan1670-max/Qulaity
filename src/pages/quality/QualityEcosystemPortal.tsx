import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Database,
  FileSpreadsheet,
  Truck,
  PackageCheck,
  FileWarning,
  Cpu,
  Activity,
  Sliders,
  AlertOctagon,
  GitBranch,
  Wrench,
  CheckSquare,
  RotateCcw,
  FileCheck,
  MessageSquareWarning,
  DollarSign,
  Award,
  ClipboardCheck,
  GraduationCap,
  FolderKanban,
  Scale,
  Bot,
  Sparkles,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Play,
  Square,
  Layers,
  ArrowRight,
  Zap,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Compass,
  Video,
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type PhaseId =
  | 'foundation'
  | 'inbound'
  | 'inprocess'
  | 'containment'
  | 'outbound'
  | 'governance';

type SimulationScenarioId =
  | 'none'
  | 'ncr_to_8d'
  | 'spc_drift'
  | 'customer_complaint'
  | 'full_factory_pulse';

type ViewLensId = 'backbone' | 'all_primary' | 'feedback_bus' | 'heatmap';

interface PhaseZone {
  id: PhaseId;
  stageNum: string;
  title: string;
  subtitle: string;
  color: string;
  glowColor: string;
  badgeBg: string;
  x: number;
  width: number;
}

interface EcosystemNode {
  id: string;
  seqCode: string;
  title: string; // Big 17px bold 2-word title
  shortName: string; // Ultra-short 1-word label for pills
  conceptTagline: string; // Concise 3-4 word concept subtitle across full width
  emoji: string;
  phaseId: PhaseId;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  x: number;
  y: number;
  colIdx: number;
  rowIdx: number;
  kpiLabel: string;
  kpiValue: string;
  healthScore: number;
  health: 'optimal' | 'warning' | 'active';
}

interface CableRelation {
  id: string;
  source: string;
  target: string;
  orderFromSource: number;
  shortTag: string;
  label: string;
  payloadSpec: string;
  color: string;
  isFeedback?: boolean;
  isPrimaryBackbone?: boolean;
  backboneStep?: number;
  corridorTrack: number;
  highwayLane?: number;
}

// ============================================================================
// ULTRA-CRISP FULL-SCALE MATRIX GEOMETRY (1420 x 556 = 2.55:1 WIDESCREEN)
// Fits 100%+ native scale on laptops & monitors with FULL-WIDTH 202x98 HERO CARDS
// ============================================================================

const CANVAS_WIDTH = 1420;
const CANVAS_HEIGHT = 556;
const NODE_WIDTH = 202;
const NODE_HEIGHT = 98;

// 6 Columns: 202px Card + 36px Corridor = 238px pitch (Total = 1420px)
const COL_X = [14, 252, 490, 728, 966, 1204];

// 4 Rows: 98px Card + 24px Top-Rim Badge Alley = 122px vertical pitch
const ROW_Y = [66, 188, 310, 432];

const PHASES: PhaseZone[] = [
  {
    id: 'foundation',
    stageNum: 'STAGE 01',
    title: 'Foundation',
    subtitle: 'Specs & Risks',
    color: '#0EA5E9',
    glowColor: 'rgba(14, 165, 233, 0.28)',
    badgeBg: 'rgba(14, 165, 233, 0.16)',
    x: COL_X[0],
    width: NODE_WIDTH,
  },
  {
    id: 'inbound',
    stageNum: 'STAGE 02',
    title: 'Inbound QC',
    subtitle: 'Suppliers & IQC',
    color: '#06B6D4',
    glowColor: 'rgba(6, 182, 212, 0.28)',
    badgeBg: 'rgba(6, 182, 212, 0.16)',
    x: COL_X[1],
    width: NODE_WIDTH,
  },
  {
    id: 'inprocess',
    stageNum: 'STAGE 03',
    title: 'Shopfloor',
    subtitle: 'IPQC, SPC & IoT',
    color: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.28)',
    badgeBg: 'rgba(16, 185, 129, 0.16)',
    x: COL_X[2],
    width: NODE_WIDTH,
  },
  {
    id: 'containment',
    stageNum: 'STAGE 04',
    title: 'CAPA & 8D',
    subtitle: 'NCR & Root Cause',
    color: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.28)',
    badgeBg: 'rgba(245, 158, 11, 0.16)',
    x: COL_X[3],
    width: NODE_WIDTH,
  },
  {
    id: 'outbound',
    stageNum: 'STAGE 05',
    title: 'Customer',
    subtitle: 'FQC, RMA & COPQ',
    color: '#8B5CF6',
    glowColor: 'rgba(139, 92, 246, 0.28)',
    badgeBg: 'rgba(139, 92, 246, 0.16)',
    x: COL_X[4],
    width: NODE_WIDTH,
  },
  {
    id: 'governance',
    stageNum: 'STAGE 06',
    title: 'Governance',
    subtitle: 'ISO, Audit & AI',
    color: '#EC4899',
    glowColor: 'rgba(236, 72, 153, 0.28)',
    badgeBg: 'rgba(236, 72, 153, 0.16)',
    x: COL_X[5],
    width: NODE_WIDTH,
  },
];

// ============================================================================
// 24 FULL-WIDTH HERO MODULES (17px Title + Full-Width Concept + Sequence Bar)
// ============================================================================

const NODES: EcosystemNode[] = [
  // ---------------- STAGE 01: FOUNDATION ----------------
  {
    id: 'master-data',
    seqCode: 'M-01',
    title: 'Master Data',
    shortName: 'Master',
    conceptTagline: 'Parts, BOM & Defect Catalog',
    emoji: '🗂️',
    phaseId: 'foundation',
    path: '/quality/master-data',
    icon: Database,
    x: COL_X[0],
    y: ROW_Y[0],
    colIdx: 0,
    rowIdx: 0,
    kpiLabel: 'Catalog',
    kpiValue: '100% Sync',
    healthScore: 99,
    health: 'optimal',
  },
  {
    id: 'fmea',
    seqCode: 'M-02',
    title: 'PFMEA Risk',
    shortName: 'PFMEA',
    conceptTagline: 'Severity × Occurrence RPN',
    emoji: '⚠️',
    phaseId: 'foundation',
    path: '/fmea',
    icon: ShieldCheck,
    x: COL_X[0],
    y: ROW_Y[1],
    colIdx: 0,
    rowIdx: 1,
    kpiLabel: 'Risk Matrix',
    kpiValue: 'RPN < 80',
    healthScore: 96,
    health: 'optimal',
  },
  {
    id: 'control-plan',
    seqCode: 'M-03',
    title: 'Control Plan',
    shortName: 'CtrlPlan',
    conceptTagline: 'CTQ Limits & Poka-Yoke',
    emoji: '🎯',
    phaseId: 'foundation',
    path: '/control-plan',
    icon: FileSpreadsheet,
    x: COL_X[0],
    y: ROW_Y[2],
    colIdx: 0,
    rowIdx: 2,
    kpiLabel: 'CTQ Specs',
    kpiValue: 'IATF 16949',
    healthScore: 98,
    health: 'optimal',
  },
  {
    id: 'apqp',
    seqCode: 'M-04',
    title: 'APQP & PPAP',
    shortName: 'PPAP',
    conceptTagline: '18-Element Launch Gate',
    emoji: '🚀',
    phaseId: 'foundation',
    path: '/apqp',
    icon: FolderKanban,
    x: COL_X[0],
    y: ROW_Y[3],
    colIdx: 0,
    rowIdx: 3,
    kpiLabel: 'Launch',
    kpiValue: 'PSW Ready',
    healthScore: 95,
    health: 'optimal',
  },

  // ---------------- STAGE 02: INBOUND ----------------
  {
    id: 'suppliers',
    seqCode: 'M-05',
    title: 'Supplier Score',
    shortName: 'Suppliers',
    conceptTagline: 'Vendor PPM & Approved List',
    emoji: '🏭',
    phaseId: 'inbound',
    path: '/suppliers',
    icon: Truck,
    x: COL_X[1],
    y: ROW_Y[0],
    colIdx: 1,
    rowIdx: 0,
    kpiLabel: 'Vendor PPM',
    kpiValue: '96.8% A+',
    healthScore: 97,
    health: 'optimal',
  },
  {
    id: 'incoming-quality',
    seqCode: 'M-06',
    title: 'Incoming QC',
    shortName: 'IQC',
    conceptTagline: 'Raw Material AQL Sampling',
    emoji: '📦',
    phaseId: 'inbound',
    path: '/incoming-quality',
    icon: PackageCheck,
    x: COL_X[1],
    y: ROW_Y[1],
    colIdx: 1,
    rowIdx: 1,
    kpiLabel: 'Lot Pass',
    kpiValue: '98.4% AQL',
    healthScore: 98,
    health: 'optimal',
  },
  {
    id: 'deviation',
    seqCode: 'M-07',
    title: 'Waiver Permit',
    shortName: 'Waiver',
    conceptTagline: 'Temporary Spec Concession',
    emoji: '📝',
    phaseId: 'inbound',
    path: '/deviation',
    icon: FileWarning,
    x: COL_X[1],
    y: ROW_Y[2],
    colIdx: 1,
    rowIdx: 2,
    kpiLabel: 'Concessions',
    kpiValue: 'Time-Boxed',
    healthScore: 91,
    health: 'active',
  },
  {
    id: 'calibration',
    seqCode: 'M-08',
    title: 'MSA & Gauges',
    shortName: 'Gauges',
    conceptTagline: 'GR&R Study & Calibration',
    emoji: '🔬',
    phaseId: 'inbound',
    path: '/calibration',
    icon: Wrench,
    x: COL_X[1],
    y: ROW_Y[3],
    colIdx: 1,
    rowIdx: 3,
    kpiLabel: 'GR&R',
    kpiValue: '4.2% <10%',
    healthScore: 99,
    health: 'optimal',
  },

  // ---------------- STAGE 03: SHOPFLOOR ----------------
  {
    id: 'iot-dashboard',
    seqCode: 'M-09',
    title: 'IoT Telemetry',
    shortName: 'IoT',
    conceptTagline: 'Live Machine PLC Sensors',
    emoji: '📡',
    phaseId: 'inprocess',
    path: '/iot-dashboard',
    icon: Cpu,
    x: COL_X[2],
    y: ROW_Y[0],
    colIdx: 2,
    rowIdx: 0,
    kpiLabel: 'PLC Stream',
    kpiValue: '50ms Live',
    healthScore: 98,
    health: 'active',
  },
  {
    id: 'in-process-quality',
    seqCode: 'M-10',
    title: 'In-Process QC',
    shortName: 'IPQC',
    conceptTagline: 'First-Piece & Patrol Check',
    emoji: '⚙️',
    phaseId: 'inprocess',
    path: '/in-process-quality',
    icon: Activity,
    x: COL_X[2],
    y: ROW_Y[1],
    colIdx: 2,
    rowIdx: 1,
    kpiLabel: 'Line FPY',
    kpiValue: '99.1% Pass',
    healthScore: 99,
    health: 'optimal',
  },
  {
    id: 'spc',
    seqCode: 'M-11',
    title: 'SPC Control',
    shortName: 'SPC',
    conceptTagline: 'X-Bar/R & Six Sigma Cpk',
    emoji: '📈',
    phaseId: 'inprocess',
    path: '/spc',
    icon: Sliders,
    x: COL_X[2],
    y: ROW_Y[2],
    colIdx: 2,
    rowIdx: 2,
    kpiLabel: 'Capability',
    kpiValue: 'Cpk 1.67',
    healthScore: 97,
    health: 'optimal',
  },
  {
    id: 'process-ppm',
    seqCode: 'M-12',
    title: 'Process OEE',
    shortName: 'PPM',
    conceptTagline: 'Line Yield & Defect PPM',
    emoji: '⚡',
    phaseId: 'inprocess',
    path: '/process-ppm',
    icon: Zap,
    x: COL_X[2],
    y: ROW_Y[3],
    colIdx: 2,
    rowIdx: 3,
    kpiLabel: 'Defect Rate',
    kpiValue: '142 PPM',
    healthScore: 95,
    health: 'optimal',
  },

  // ---------------- STAGE 04: CONTAINMENT & CAPA ----------------
  {
    id: 'ncr',
    seqCode: 'M-13',
    title: 'NCR Quarantine',
    shortName: 'NCR',
    conceptTagline: 'Suspect Batch Hold & MRB',
    emoji: '🛑',
    phaseId: 'containment',
    path: '/ncr',
    icon: AlertOctagon,
    x: COL_X[3],
    y: ROW_Y[0],
    colIdx: 3,
    rowIdx: 0,
    kpiLabel: 'Containment',
    kpiValue: '100% Hold',
    healthScore: 92,
    health: 'warning',
  },
  {
    id: 'problem-solving',
    seqCode: 'M-14',
    title: '8D Root Cause',
    shortName: '8D CAPA',
    conceptTagline: '5-Why & Fishbone Analysis',
    emoji: '🧠',
    phaseId: 'containment',
    path: '/problem-solving',
    icon: GitBranch,
    x: COL_X[3],
    y: ROW_Y[1],
    colIdx: 3,
    rowIdx: 1,
    kpiLabel: 'Root Cause',
    kpiValue: 'D1 ➔ D8',
    healthScore: 96,
    health: 'optimal',
  },
  {
    id: 'rework',
    seqCode: 'M-15',
    title: 'Rework Station',
    shortName: 'Rework',
    conceptTagline: 'Repair Routing & Re-Test',
    emoji: '🔧',
    phaseId: 'containment',
    path: '/rework',
    icon: RotateCcw,
    x: COL_X[3],
    y: ROW_Y[2],
    colIdx: 3,
    rowIdx: 2,
    kpiLabel: 'Recovery',
    kpiValue: '94.5% Saved',
    healthScore: 95,
    health: 'optimal',
  },
  {
    id: 'action-plans',
    seqCode: 'M-16',
    title: 'CAPA Tracker',
    shortName: 'Actions',
    conceptTagline: 'Preventive Tasks & SLA',
    emoji: '✅',
    phaseId: 'containment',
    path: '/action-plans',
    icon: CheckSquare,
    x: COL_X[3],
    y: ROW_Y[3],
    colIdx: 3,
    rowIdx: 3,
    kpiLabel: 'SLA Closure',
    kpiValue: '97.2% OnTime',
    healthScore: 97,
    health: 'optimal',
  },

  // ---------------- STAGE 05: OUTBOUND ----------------
  {
    id: 'outgoing-quality',
    seqCode: 'M-17',
    title: 'Final QC & CoA',
    shortName: 'FQC',
    conceptTagline: 'Shipment Release & CoA',
    emoji: '🏅',
    phaseId: 'outbound',
    path: '/outgoing-quality',
    icon: FileCheck,
    x: COL_X[4],
    y: ROW_Y[0],
    colIdx: 4,
    rowIdx: 0,
    kpiLabel: 'Shipment',
    kpiValue: 'Zero Escape',
    healthScore: 99,
    health: 'optimal',
  },
  {
    id: 'complaints',
    seqCode: 'M-18',
    title: 'Customer RMA',
    shortName: 'RMA',
    conceptTagline: 'Field Claims & 24h Alert',
    emoji: '📣',
    phaseId: 'outbound',
    path: '/complaints',
    icon: MessageSquareWarning,
    x: COL_X[4],
    y: ROW_Y[1],
    colIdx: 4,
    rowIdx: 1,
    kpiLabel: '24h D3 Alert',
    kpiValue: '100% SLA',
    healthScore: 94,
    health: 'active',
  },
  {
    id: 'defect-cost',
    seqCode: 'M-19',
    title: 'COPQ Finance',
    shortName: 'COPQ',
    conceptTagline: 'Scrap, Rework & Claim Cost',
    emoji: '💰',
    phaseId: 'outbound',
    path: '/defect-cost',
    icon: DollarSign,
    x: COL_X[4],
    y: ROW_Y[2],
    colIdx: 4,
    rowIdx: 2,
    kpiLabel: 'Cost Ratio',
    kpiValue: '1.15% Rev',
    healthScore: 96,
    health: 'optimal',
  },
  {
    id: 'customer-satisfaction',
    seqCode: 'M-20',
    title: 'Customer CSAT',
    shortName: 'CSAT',
    conceptTagline: 'OEM Scorecards & NPS',
    emoji: '🌟',
    phaseId: 'outbound',
    path: '/customer-satisfaction',
    icon: Award,
    x: COL_X[4],
    y: ROW_Y[3],
    colIdx: 4,
    rowIdx: 3,
    kpiLabel: 'NPS Score',
    kpiValue: '96.4% Grade A',
    healthScore: 98,
    health: 'optimal',
  },

  // ---------------- STAGE 06: GOVERNANCE & AI ----------------
  {
    id: 'audits',
    seqCode: 'M-21',
    title: 'ISO Audits',
    shortName: 'Audits',
    conceptTagline: 'IATF 16949 & Layered LPA',
    emoji: '📋',
    phaseId: 'governance',
    path: '/audits',
    icon: ClipboardCheck,
    x: COL_X[5],
    y: ROW_Y[0],
    colIdx: 5,
    rowIdx: 0,
    kpiLabel: 'Compliance',
    kpiValue: '98.9% Pass',
    healthScore: 99,
    health: 'optimal',
  },
  {
    id: 'iso-compliance',
    seqCode: 'M-22',
    title: 'ISO Clauses',
    shortName: 'ISO 9001',
    conceptTagline: 'Clause 4-10 Digital Twin',
    emoji: '⚖️',
    phaseId: 'governance',
    path: '/iso-compliance',
    icon: Scale,
    x: COL_X[5],
    y: ROW_Y[1],
    colIdx: 5,
    rowIdx: 1,
    kpiLabel: 'Readiness',
    kpiValue: '100% Mapped',
    healthScore: 100,
    health: 'optimal',
  },
  {
    id: 'training',
    seqCode: 'M-23',
    title: 'Skill Matrix',
    shortName: 'Training',
    conceptTagline: 'Operator Certs & Poka-Yoke',
    emoji: '🎓',
    phaseId: 'governance',
    path: '/training',
    icon: GraduationCap,
    x: COL_X[5],
    y: ROW_Y[2],
    colIdx: 5,
    rowIdx: 2,
    kpiLabel: 'Certified',
    kpiValue: '99.2% Staff',
    healthScore: 99,
    health: 'optimal',
  },
  {
    id: 'ai-copilot',
    seqCode: 'M-24',
    title: 'AI Copilot',
    shortName: 'AI Brain',
    conceptTagline: 'Predictive Risk & Auto-8D',
    emoji: '🤖',
    phaseId: 'governance',
    path: '/ai-copilot',
    icon: Bot,
    x: COL_X[5],
    y: ROW_Y[3],
    colIdx: 5,
    rowIdx: 3,
    kpiLabel: 'Prediction',
    kpiValue: 'Neural 4.0',
    healthScore: 100,
    health: 'active',
  },
];

// ============================================================================
// 39 ORDERED & SEQUENCED ARCHITECTURAL RELATIONSHIPS
// ============================================================================

const CABLES: CableRelation[] = [
  // --- STAGE 01 OUTGOING ---
  {
    id: 'c-md-fmea',
    source: 'master-data',
    target: 'fmea',
    orderFromSource: 1,
    shortTag: 'Feed Defect Modes',
    label: '1st: Master Data feeds Standard Defect Modes & Severity Catalog into PFMEA',
    payloadSpec: 'DefectCatalog[] • SeverityTable',
    color: '#0EA5E9',
    isPrimaryBackbone: true,
    backboneStep: 1,
    corridorTrack: -2,
  },
  {
    id: 'c-md-iqc',
    source: 'master-data',
    target: 'incoming-quality',
    orderFromSource: 2,
    shortTag: 'Send AQL Specs',
    label: '2nd: Master Data provisions Raw Material Specs & AQL Sampling Plans to Incoming QC',
    payloadSpec: 'PartSpecs • AQL_Table_ISO2859',
    color: '#0EA5E9',
    corridorTrack: -1,
  },
  {
    id: 'c-md-ipqc',
    source: 'master-data',
    target: 'in-process-quality',
    orderFromSource: 3,
    shortTag: 'Sync Routing BOM',
    label: '3rd: Master Data syncs Production Routing & Work Center CTQs to In-Process QC',
    payloadSpec: 'RoutingSteps[] • LineWorkCenters',
    color: '#0EA5E9',
    corridorTrack: 0,
  },
  {
    id: 'c-fmea-cp',
    source: 'fmea',
    target: 'control-plan',
    orderFromSource: 1,
    shortTag: 'Lock High-RPN CTQs',
    label: '1st: PFMEA transfers Critical Failure Modes & High-RPN Risks into Control Plan',
    payloadSpec: 'HighRPN_Nodes[] • PreventionControls',
    color: '#0EA5E9',
    isPrimaryBackbone: true,
    backboneStep: 2,
    corridorTrack: -2,
  },
  {
    id: 'c-cp-iqc',
    source: 'control-plan',
    target: 'incoming-quality',
    orderFromSource: 1,
    shortTag: 'Deploy IQC Checklists',
    label: '1st: Control Plan deploys Incoming Inspection Checklists & Tolerance Limits to IQC',
    payloadSpec: 'IQC_Checkpoints[] • LSL_USL',
    color: '#06B6D4',
    corridorTrack: 1,
  },
  {
    id: 'c-cp-ipqc',
    source: 'control-plan',
    target: 'in-process-quality',
    orderFromSource: 2,
    shortTag: 'Enforce Line CTQs',
    label: '2nd: Control Plan enforces Shopfloor Patrol Frequency & Poka-Yoke Checks in IPQC',
    payloadSpec: 'IPQC_ControlLimits • SampleSize_Freq',
    color: '#10B981',
    isPrimaryBackbone: true,
    backboneStep: 3,
    corridorTrack: 2,
  },
  {
    id: 'c-cp-spc',
    source: 'control-plan',
    target: 'spc',
    orderFromSource: 3,
    shortTag: 'Set LSL / USL Limits',
    label: '3rd: Control Plan configures X-Bar/R Chart LSL, USL & Target Nominal in SPC',
    payloadSpec: 'CTQ_Specs { LSL, Nominal, USL }',
    color: '#10B981',
    corridorTrack: -2,
  },
  {
    id: 'c-apqp-cp',
    source: 'apqp',
    target: 'control-plan',
    orderFromSource: 1,
    shortTag: 'Approve PPAP Gate',
    label: '1st: APQP/PPAP validates and baselines Production Control Plan for mass production',
    payloadSpec: 'PPAP_PSW_Approval • Rev_Baseline',
    color: '#0EA5E9',
    corridorTrack: 2,
  },

  // --- STAGE 02 OUTGOING ---
  {
    id: 'c-sup-iqc',
    source: 'suppliers',
    target: 'incoming-quality',
    orderFromSource: 1,
    shortTag: 'Set Sampling Level',
    label: '1st: Supplier Score dynamically adjusts IQC Inspection Level (Normal / Tightened / Reduced)',
    payloadSpec: 'VendorRating • DynamicSwitchingRule',
    color: '#06B6D4',
    corridorTrack: -2,
  },
  {
    id: 'c-iqc-ipqc',
    source: 'incoming-quality',
    target: 'in-process-quality',
    orderFromSource: 1,
    shortTag: 'Release Verified Lot',
    label: '1st: Incoming QC releases verified Raw Material Batches to Shopfloor Production (IPQC)',
    payloadSpec: 'MaterialReleaseTag • LotTraceabilityID',
    color: '#10B981',
    corridorTrack: -1,
  },
  {
    id: 'c-iqc-ncr',
    source: 'incoming-quality',
    target: 'ncr',
    orderFromSource: 2,
    shortTag: 'Reject Lot to NCR',
    label: '2nd: Incoming QC quarantines failed supplier shipments and raises Supplier NCR',
    payloadSpec: 'SupplierNCR • QuarantineHoldTag',
    color: '#F59E0B',
    corridorTrack: 0,
  },
  {
    id: 'c-iqc-dev',
    source: 'incoming-quality',
    target: 'deviation',
    orderFromSource: 3,
    shortTag: 'Request Waiver',
    label: '3rd: Incoming QC requests conditional Engineering Concession / Waiver for minor deviations',
    payloadSpec: 'ConcessionRequest • RiskSignoff',
    color: '#06B6D4',
    corridorTrack: 1,
  },
  {
    id: 'c-dev-ipqc',
    source: 'deviation',
    target: 'in-process-quality',
    orderFromSource: 1,
    shortTag: 'Authorize Line Use',
    label: '1st: Approved Waiver Permit authorizes conditional batch usage with 100% IPQC monitoring',
    payloadSpec: 'ConditionalPermit • MaxQtyLimit',
    color: '#06B6D4',
    corridorTrack: 2,
  },
  {
    id: 'c-cal-ipqc',
    source: 'calibration',
    target: 'in-process-quality',
    orderFromSource: 1,
    shortTag: 'Certify Line Gauges',
    label: '1st: MSA & Calibration certifies active gauges and blocks expired tools in IPQC',
    payloadSpec: 'GaugeCertStatus • GRR_Valid_Flag',
    color: '#06B6D4',
    corridorTrack: -2,
  },
  {
    id: 'c-cal-spc',
    source: 'calibration',
    target: 'spc',
    orderFromSource: 2,
    shortTag: 'Validate GR&R < 10%',
    label: '2nd: MSA validates measurement precision (GR&R < 10%) before SPC capability calculation',
    payloadSpec: 'MSA_Variance • NDC_Score',
    color: '#10B981',
    corridorTrack: -1,
  },

  // --- STAGE 03 OUTGOING ---
  {
    id: 'c-iot-spc',
    source: 'iot-dashboard',
    target: 'spc',
    orderFromSource: 1,
    shortTag: 'Stream Telemetry',
    label: '1st: IoT Telemetry streams real-time machine parameters directly into SPC Control Charts',
    payloadSpec: 'MQTT_Subgroup_Stream • 50ms_Telemetry',
    color: '#10B981',
    corridorTrack: 1,
  },
  {
    id: 'c-iot-ipqc',
    source: 'iot-dashboard',
    target: 'in-process-quality',
    orderFromSource: 2,
    shortTag: 'Trigger Patrol Check',
    label: '2nd: IoT sensor anomaly triggers immediate Shopfloor IPQC patrol verification',
    payloadSpec: 'MachineAlarmEvent • StationID',
    color: '#10B981',
    corridorTrack: -2,
  },
  {
    id: 'c-ipqc-spc',
    source: 'in-process-quality',
    target: 'spc',
    orderFromSource: 1,
    shortTag: 'Log Subgroup Data',
    label: '1st: In-Process QC logs dimensional subgroup measurements into SPC X-Bar/R engine',
    payloadSpec: 'SubgroupSample[n=5] • OperatorID',
    color: '#10B981',
    corridorTrack: 0,
  },
  {
    id: 'c-ipqc-fqc',
    source: 'in-process-quality',
    target: 'outgoing-quality',
    orderFromSource: 2,
    shortTag: 'Pass Batch to FQC',
    label: '2nd: In-Process QC passes conforming production lots forward to Final QC (FQC)',
    payloadSpec: 'InProcessPassCert • RoutingComplete',
    color: '#10B981',
    corridorTrack: -2,
  },
  {
    id: 'c-ipqc-ncr',
    source: 'in-process-quality',
    target: 'ncr',
    orderFromSource: 3,
    shortTag: 'Escalate Line NCR',
    label: '3rd: In-Process QC escalates line non-conformances directly to NCR Quarantine',
    payloadSpec: 'LineDefectEvent • SuspectLotHold',
    color: '#F59E0B',
    isPrimaryBackbone: true,
    backboneStep: 4,
    corridorTrack: -1,
  },
  {
    id: 'c-spc-ncr',
    source: 'spc',
    target: 'ncr',
    orderFromSource: 1,
    shortTag: 'Alert Cpk < 1.33',
    label: '1st: SPC triggers automated Out-of-Control / Nelson Rule violation alert to NCR',
    payloadSpec: 'NelsonRuleViolation • Cpk_Drop_Alert',
    color: '#F59E0B',
    corridorTrack: 0,
  },
  {
    id: 'c-spc-ppm',
    source: 'spc',
    target: 'process-ppm',
    orderFromSource: 2,
    shortTag: 'Compute Sigma PPM',
    label: '2nd: SPC feeds process capability & defect probability into Process PPM & OEE',
    payloadSpec: 'SigmaLevel • PredictedPPM',
    color: '#10B981',
    corridorTrack: 2,
  },
  {
    id: 'c-ppm-copq',
    source: 'process-ppm',
    target: 'defect-cost',
    orderFromSource: 1,
    shortTag: 'Report Yield Loss',
    label: '1st: Process PPM reports scrap rate and yield loss to COPQ Financial Ledger',
    payloadSpec: 'PPM_ScrapVolume • OEE_LossHours',
    color: '#8B5CF6',
    corridorTrack: 1,
  },

  // --- STAGE 04 OUTGOING & RETURN LOOPS ---
  {
    id: 'c-ncr-8d',
    source: 'ncr',
    target: 'problem-solving',
    orderFromSource: 1,
    shortTag: 'Launch 8D CAPA',
    label: '1st: NCR Quarantine escalates critical/recurring defects to 8D Root Cause Analysis',
    payloadSpec: 'NCR_Dossier • Containment Lot ID',
    color: '#F59E0B',
    isPrimaryBackbone: true,
    backboneStep: 5,
    corridorTrack: -2,
  },
  {
    id: 'c-ncr-rwk',
    source: 'ncr',
    target: 'rework',
    orderFromSource: 2,
    shortTag: 'Route to Rework',
    label: '2nd: NCR MRB disposition routes repairable batches to Rework & Repair Station',
    payloadSpec: 'MRB_Disposition=REWORK • RepairWI',
    color: '#F59E0B',
    corridorTrack: 1,
  },
  {
    id: 'c-ncr-copq',
    source: 'ncr',
    target: 'defect-cost',
    orderFromSource: 3,
    shortTag: 'Post Scrap Cost',
    label: '3rd: NCR posts scrap & quarantine holding costs directly to COPQ Finance',
    payloadSpec: 'ScrapQty × UnitCost • HoldCost',
    color: '#8B5CF6',
    corridorTrack: -1,
  },
  {
    id: 'c-ncr-sup-fb',
    source: 'ncr',
    target: 'suppliers',
    orderFromSource: 4,
    shortTag: '↺ Penalize Vendor',
    label: '4th (Return Loop ↺): Supplier NCR deducts Vendor Score and triggers SCAR chargeback',
    payloadSpec: 'SCAR_Notice • ScoreDeduction_PPM',
    color: '#F43F5E',
    isFeedback: true,
    corridorTrack: 2,
    highwayLane: 0,
  },
  {
    id: 'c-rwk-fqc',
    source: 'rework',
    target: 'outgoing-quality',
    orderFromSource: 1,
    shortTag: 'Re-Inspect Batch',
    label: '1st: Rework Station submits repaired lots for mandatory 100% Final QC re-inspection',
    payloadSpec: 'ReworkPassTag • 100Pct_ReInspect',
    color: '#10B981',
    corridorTrack: 0,
  },
  {
    id: 'c-8d-act',
    source: 'problem-solving',
    target: 'action-plans',
    orderFromSource: 1,
    shortTag: 'Assign D5/D6 CAPA',
    label: '1st: 8D Root Cause assigns D5/D6 Corrective & Preventive Actions to CAPA Tracker',
    payloadSpec: 'CAPA_Tasks[] • Owner_SLA_Dates',
    color: '#F59E0B',
    isPrimaryBackbone: true,
    backboneStep: 6,
    corridorTrack: 2,
  },
  {
    id: 'c-8d-fmea-fb',
    source: 'problem-solving',
    target: 'fmea',
    orderFromSource: 2,
    shortTag: '↺ Update PFMEA RPN',
    label: '2nd (Return Loop ↺): 8D Lesson Learned updates PFMEA RPN & Failure Modes (D7 Prevention)',
    payloadSpec: 'UpdatedRPN • NewFailureMechanism',
    color: '#F43F5E',
    isFeedback: true,
    isPrimaryBackbone: true,
    backboneStep: 7,
    corridorTrack: -2,
    highwayLane: 1,
  },
  {
    id: 'c-act-cp-fb',
    source: 'action-plans',
    target: 'control-plan',
    orderFromSource: 1,
    shortTag: '↺ Harden Ctrl Plan',
    label: '1st (Return Loop ↺): Verified CAPA updates Control Plan with tighter Poka-Yoke & CTQ checks',
    payloadSpec: 'ControlPlan_RevUp • NewPokaYoke',
    color: '#F43F5E',
    isFeedback: true,
    isPrimaryBackbone: true,
    backboneStep: 8,
    corridorTrack: -1,
    highwayLane: 0,
  },
  {
    id: 'c-act-trn',
    source: 'action-plans',
    target: 'training',
    orderFromSource: 2,
    shortTag: 'Retrain Operators',
    label: '2nd: CAPA Tracker triggers mandatory Operator Retraining on updated SOPs',
    payloadSpec: 'SOP_TrainingReq • SkillGapUpdate',
    color: '#EC4899',
    corridorTrack: 1,
  },

  // --- STAGE 05 OUTGOING & RETURN LOOPS ---
  {
    id: 'c-fqc-csat',
    source: 'outgoing-quality',
    target: 'customer-satisfaction',
    orderFromSource: 1,
    shortTag: 'Certify CoA Delivery',
    label: '1st: Final QC issues Certificate of Analysis (CoA) and logs On-Time Zero-Defect Delivery',
    payloadSpec: 'Digital_CoA • LotGenealogyCert',
    color: '#8B5CF6',
    corridorTrack: -2,
  },
  {
    id: 'c-cmp-ncr-fb',
    source: 'complaints',
    target: 'ncr',
    orderFromSource: 1,
    shortTag: '↺ Containment Hold',
    label: '1st (Return Loop ↺): Customer RMA triggers immediate 24h D3 Containment Hold in NCR',
    payloadSpec: 'RMA_ContainmentAlert • StockHold',
    color: '#F43F5E',
    isFeedback: true,
    corridorTrack: 2,
    highwayLane: 1,
  },
  {
    id: 'c-cmp-8d-fb',
    source: 'complaints',
    target: 'problem-solving',
    orderFromSource: 2,
    shortTag: '↺ Escalate RMA 8D',
    label: '2nd (Return Loop ↺): Customer RMA initiates formal Customer 8D Investigation Report',
    payloadSpec: 'Customer8D_Mandate • FieldReturnSample',
    color: '#F43F5E',
    isFeedback: true,
    corridorTrack: -1,
    highwayLane: 2,
  },
  {
    id: 'c-cmp-copq',
    source: 'complaints',
    target: 'defect-cost',
    orderFromSource: 3,
    shortTag: 'Log Warranty Claim',
    label: '3rd: Customer RMA logs External Failure Warranty & Chargeback Costs into COPQ',
    payloadSpec: 'WarrantyClaimUSD • LogisticsDebit',
    color: '#8B5CF6',
    corridorTrack: -1,
  },

  // --- STAGE 06 GOVERNANCE & AI ---
  {
    id: 'c-aud-act-fb',
    source: 'audits',
    target: 'action-plans',
    orderFromSource: 1,
    shortTag: '↺ Issue Audit CAPA',
    label: '1st (Return Loop ↺): ISO Audit findings generate mandatory Corrective Actions in CAPA Tracker',
    payloadSpec: 'AuditFinding_NCR • ClauseRef',
    color: '#F43F5E',
    isFeedback: true,
    corridorTrack: 2,
    highwayLane: 1,
  },
  {
    id: 'c-aud-iso',
    source: 'audits',
    target: 'iso-compliance',
    orderFromSource: 2,
    shortTag: 'Verify ISO Clauses',
    label: '2nd: Internal & LPA Audits update live ISO 9001 / IATF 16949 Clause Compliance Matrix',
    payloadSpec: 'ClauseEvidenceScore • AuditTrail',
    color: '#EC4899',
    corridorTrack: -2,
  },
  {
    id: 'c-ai-8d-fb',
    source: 'ai-copilot',
    target: 'problem-solving',
    orderFromSource: 1,
    shortTag: '↺ AI Root Cause',
    label: '1st (Return Loop ↺): AI Copilot synthesizes plant-wide data to recommend 8D Root Causes',
    payloadSpec: 'AI_5Why_Hypothesis • RiskPrediction',
    color: '#EC4899',
    isFeedback: true,
    corridorTrack: 0,
    highwayLane: 2,
  },
];

// ============================================================================
// CLOSED-LOOP MASTER BACKBONE & SIMULATION SCENARIOS
// ============================================================================

const MASTER_BACKBONE_SEQUENCE: string[] = [
  'c-md-fmea',
  'c-fmea-cp',
  'c-cp-ipqc',
  'c-ipqc-ncr',
  'c-ncr-8d',
  'c-8d-act',
  'c-8d-fmea-fb',
  'c-act-cp-fb',
];

const SIMULATION_SCENARIOS: Record<
  Exclude<SimulationScenarioId, 'none'>,
  {
    title: string;
    shortTitle: string;
    color: string;
    cableSequence: string[];
  }
> = {
  ncr_to_8d: {
    title: 'NCR ➔ 8D ➔ PFMEA Return Loop',
    shortTitle: 'NCR ➔ 8D ➔ Return',
    color: '#F59E0B',
    cableSequence: [
      'c-ipqc-ncr',
      'c-ncr-8d',
      'c-8d-act',
      'c-8d-fmea-fb',
      'c-act-cp-fb',
      'c-cp-ipqc',
    ],
  },
  spc_drift: {
    title: 'IoT & SPC Drift ➔ Auto-Containment',
    shortTitle: 'SPC Drift ➔ Return',
    color: '#10B981',
    cableSequence: [
      'c-iot-spc',
      'c-spc-ncr',
      'c-ncr-8d',
      'c-8d-act',
      'c-act-cp-fb',
    ],
  },
  customer_complaint: {
    title: 'Customer RMA ➔ 24h Hold ➔ 8D CAPA',
    shortTitle: 'RMA ➔ 8D ➔ Return',
    color: '#F43F5E',
    cableSequence: [
      'c-cmp-ncr-fb',
      'c-cmp-8d-fb',
      'c-8d-act',
      'c-act-cp-fb',
      'c-cp-ipqc',
    ],
  },
  full_factory_pulse: {
    title: 'End-to-End Closed-Loop Factory Lifecycle',
    shortTitle: 'Full Closed-Loop (8)',
    color: '#38BDF8',
    cableSequence: MASTER_BACKBONE_SEQUENCE,
  },
};

function getOrdinalLabel(n: number): string {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function QualityEcosystemPortal() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport State
  const [zoom, setZoom] = useState<number>(0.92);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 8, y: 6 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Interactive Selection & Lenses
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedCableId, setSelectedCableId] = useState<string | null>(null);
  const [focusedStageId, setFocusedStageId] = useState<PhaseId | null>(null);
  const [viewLens, setViewLens] = useState<ViewLensId>('backbone');
  const [multiHopRipple, setMultiHopRipple] = useState<boolean>(true);
  const [cinemaCamera, setCinemaCamera] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Simulation Engine State
  const [activeSimulation, setActiveSimulation] = useState<SimulationScenarioId>('none');
  const [simStepIndex, setSimStepIndex] = useState<number | null>(null);

  const activeNodeId = hoveredNodeId || selectedNodeId;

  // Auto-Fit Matrix to Viewport (1420x556 achieves 92%-120% native scale!)
  const fitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    const padX = 12;
    const padY = 10;
    const scaleX = (clientWidth - padX) / CANVAS_WIDTH;
    const scaleY = (clientHeight - padY) / CANVAS_HEIGHT;
    const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.55), 1.35);

    const centeredX = (clientWidth - CANVAS_WIDTH * newZoom) / 2;
    const centeredY = (clientHeight - CANVAS_HEIGHT * newZoom) / 2;

    setZoom(newZoom);
    setPan({ x: centeredX, y: Math.max(centeredY, 4) });
    setFocusedStageId(null);
  }, []);

  // Cinema Camera focus on a specific Cable (frames Source & Target cards smoothly)
  const focusCameraOnCable = useCallback(
    (cableId: string) => {
      if (!containerRef.current) return;
      const cable = CABLES.find((c) => c.id === cableId);
      if (!cable) return;
      const src = NODES.find((n) => n.id === cable.source);
      const tgt = NODES.find((n) => n.id === cable.target);
      if (!src || !tgt) return;

      const { clientWidth, clientHeight } = containerRef.current;
      const minX = Math.min(src.x, tgt.x) - 40;
      const maxX = Math.max(src.x + NODE_WIDTH, tgt.x + NODE_WIDTH) + 40;
      const minY = Math.min(src.y, tgt.y) - 50;
      const maxY = Math.max(src.y + NODE_HEIGHT, tgt.y + NODE_HEIGHT) + 40;

      const boxW = Math.max(maxX - minX, 520);
      const boxH = Math.max(maxY - minY, 320);

      const scaleX = (clientWidth - 40) / boxW;
      const scaleY = (clientHeight - 60) / boxH;
      const targetZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.92), 1.26);

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      const panX = clientWidth / 2 - centerX * targetZoom;
      const panY = clientHeight / 2 - centerY * targetZoom;

      setZoom(targetZoom);
      setPan({ x: panX, y: panY });
    },
    []
  );

  useEffect(() => {
    fitToScreen();
    const timer = setTimeout(fitToScreen, 120);
    window.addEventListener('resize', fitToScreen);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', fitToScreen);
    };
  }, [fitToScreen]);

  // Click any Stage Header to zoom into that Stage & spotlight all its connections
  const toggleFocusStage = useCallback(
    (phase: PhaseZone) => {
      if (focusedStageId === phase.id) {
        fitToScreen();
        return;
      }
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const targetZoom = Math.min(Math.max((clientHeight - 16) / CANVAS_HEIGHT, 1.02), 1.32);
      const stageCenterX = phase.x + phase.width / 2;

      const rawPanX = clientWidth / 2 - stageCenterX * targetZoom;
      const minPanX = clientWidth - CANVAS_WIDTH * targetZoom - 16;
      const clampedPanX = Math.min(Math.max(rawPanX, minPanX), 16);
      const targetPanY = (clientHeight - CANVAS_HEIGHT * targetZoom) / 2;

      setFocusedStageId(phase.id);
      setSelectedNodeId(null);
      setSelectedCableId(null);
      setActiveSimulation('none');
      setZoom(targetZoom);
      setPan({ x: clampedPanX, y: targetPanY });
    },
    [focusedStageId, fitToScreen]
  );

  // Step-by-Step Animated Simulation Timer
  useEffect(() => {
    if (activeSimulation === 'none') {
      setSimStepIndex(null);
      return;
    }
    const seq = SIMULATION_SCENARIOS[activeSimulation].cableSequence;
    setSimStepIndex(0);
    if (cinemaCamera && seq[0]) {
      focusCameraOnCable(seq[0]);
    }

    const interval = setInterval(() => {
      setSimStepIndex((prev) => {
        if (prev === null) return 0;
        const nextIdx = (prev + 1) % seq.length;
        if (cinemaCamera && seq[nextIdx]) {
          focusCameraOnCable(seq[nextIdx]);
        }
        return nextIdx;
      });
    }, 2200);

    return () => clearInterval(interval);
  }, [activeSimulation, cinemaCamera, focusCameraOnCable]);

  // Canvas Mouse Drag & Wheel Zoom
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-interactive="true"]')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom((z) => Math.min(Math.max(z + delta, 0.5), 1.55));
  };

  // =========================================================================
  // SEQUENCE & RELATIONSHIP ENGINE
  // =========================================================================

  const isIdleLensActive =
    !activeNodeId && !selectedCableId && activeSimulation === 'none' && !focusedStageId;

  const ribbonSequenceCables = useMemo(() => {
    if (activeSimulation !== 'none') {
      const seq = SIMULATION_SCENARIOS[activeSimulation].cableSequence;
      return seq
        .map((id, idx) => {
          const cable = CABLES.find((c) => c.id === id);
          if (!cable) return null;
          const src = NODES.find((n) => n.id === cable.source);
          const tgt = NODES.find((n) => n.id === cable.target);
          return {
            stepNumber: idx + 1,
            cable,
            srcName: src?.shortName || cable.source,
            tgtName: tgt?.shortName || cable.target,
            isActiveStep: simStepIndex === idx,
            isPassedStep: simStepIndex !== null && idx <= simStepIndex,
          };
        })
        .filter(Boolean) as Array<{
        stepNumber: number;
        cable: CableRelation;
        srcName: string;
        tgtName: string;
        isActiveStep: boolean;
        isPassedStep: boolean;
      }>;
    }

    if (activeNodeId) {
      const outgoing = CABLES.filter((c) => c.source === activeNodeId).sort(
        (a, b) => a.orderFromSource - b.orderFromSource
      );
      return outgoing.map((cable) => {
        const src = NODES.find((n) => n.id === cable.source);
        const tgt = NODES.find((n) => n.id === cable.target);
        return {
          stepNumber: cable.orderFromSource,
          cable,
          srcName: src?.shortName || cable.source,
          tgtName: tgt?.shortName || cable.target,
          isActiveStep: selectedCableId === cable.id,
          isPassedStep: true,
        };
      });
    }

    return MASTER_BACKBONE_SEQUENCE.map((id, idx) => {
      const cable = CABLES.find((c) => c.id === id)!;
      const src = NODES.find((n) => n.id === cable.source);
      const tgt = NODES.find((n) => n.id === cable.target);
      return {
        stepNumber: idx + 1,
        cable,
        srcName: src?.shortName || cable.source,
        tgtName: tgt?.shortName || cable.target,
        isActiveStep: selectedCableId === cable.id,
        isPassedStep: true,
      };
    });
  }, [activeSimulation, simStepIndex, activeNodeId, selectedCableId]);

  const activeCableSequenceMap = useMemo(() => {
    const map = new Map<
      string,
      {
        medallionText: string;
        shortTag: string;
        badgeColor: string;
        isFeedback: boolean;
        isCurrentStepSpotlight: boolean;
        directionRole: 'input' | 'output' | 'downstream' | 'simulation' | 'ambient';
      }
    >();

    // 0. Stage Focus Mode
    if (focusedStageId && !activeNodeId && !selectedCableId && activeSimulation === 'none') {
      const stageNodeIds = new Set(
        NODES.filter((n) => n.phaseId === focusedStageId).map((n) => n.id)
      );
      CABLES.forEach((cable) => {
        const isOut = stageNodeIds.has(cable.source);
        const isIn = stageNodeIds.has(cable.target);
        if (!isOut && !isIn) return;
        map.set(cable.id, {
          medallionText: cable.isFeedback
            ? `↺ #${cable.orderFromSource}`
            : `${getOrdinalLabel(cable.orderFromSource)} ➔`,
          shortTag: cable.shortTag,
          badgeColor: cable.isFeedback ? '#F43F5E' : isOut ? '#10B981' : '#38BDF8',
          isFeedback: !!cable.isFeedback,
          isCurrentStepSpotlight: true,
          directionRole: isOut ? 'output' : 'input',
        });
      });
      return map;
    }

    // 1. Default Idle Architectural Lens
    if (isIdleLensActive) {
      if (viewLens === 'backbone' || viewLens === 'heatmap') {
        MASTER_BACKBONE_SEQUENCE.forEach((cableId, idx) => {
          const cable = CABLES.find((c) => c.id === cableId);
          if (!cable) return;
          const stepNum = idx + 1;
          map.set(cable.id, {
            medallionText: cable.isFeedback ? `↺ 0${stepNum}` : `0${stepNum} ➔`,
            shortTag: cable.shortTag,
            badgeColor: cable.isFeedback ? '#F43F5E' : cable.color,
            isFeedback: !!cable.isFeedback,
            isCurrentStepSpotlight: true,
            directionRole: 'ambient',
          });
        });
        return map;
      }

      if (viewLens === 'all_primary') {
        CABLES.filter((c) => c.orderFromSource === 1 && !c.isFeedback).forEach((cable) => {
          map.set(cable.id, {
            medallionText: '1st ➔',
            shortTag: cable.shortTag,
            badgeColor: cable.color,
            isFeedback: false,
            isCurrentStepSpotlight: false,
            directionRole: 'ambient',
          });
        });
        return map;
      }

      if (viewLens === 'feedback_bus') {
        CABLES.filter((c) => c.isFeedback).forEach((cable, idx) => {
          map.set(cable.id, {
            medallionText: `↺ #${idx + 1}`,
            shortTag: cable.shortTag,
            badgeColor: '#F43F5E',
            isFeedback: true,
            isCurrentStepSpotlight: true,
            directionRole: 'ambient',
          });
        });
        return map;
      }
    }

    // 2. Specific Cable Clicked
    if (selectedCableId && !activeNodeId && activeSimulation === 'none') {
      const cable = CABLES.find((c) => c.id === selectedCableId);
      if (cable) {
        map.set(cable.id, {
          medallionText: cable.isFeedback
            ? `↺ #${cable.orderFromSource}`
            : `${getOrdinalLabel(cable.orderFromSource)} ➔`,
          shortTag: cable.shortTag,
          badgeColor: cable.isFeedback ? '#F43F5E' : '#10B981',
          isFeedback: !!cable.isFeedback,
          isCurrentStepSpotlight: true,
          directionRole: 'output',
        });
      }
      return map;
    }

    // 3. Simulation Active
    if (activeSimulation !== 'none') {
      const seq = SIMULATION_SCENARIOS[activeSimulation].cableSequence;
      seq.forEach((cableId, idx) => {
        if (simStepIndex !== null && idx > simStepIndex) return;
        const cable = CABLES.find((c) => c.id === cableId);
        if (!cable) return;
        const isCurrent = simStepIndex === idx;
        const stepNum = idx + 1;
        map.set(cableId, {
          medallionText: cable.isFeedback ? `↺ 0${stepNum}` : `0${stepNum} ➔`,
          shortTag: cable.shortTag,
          badgeColor: cable.isFeedback ? '#F43F5E' : isCurrent ? '#10B981' : '#38BDF8',
          isFeedback: !!cable.isFeedback,
          isCurrentStepSpotlight: isCurrent,
          directionRole: 'simulation',
        });
      });
      return map;
    }

    // 4. Node Hovered or Pinned
    if (activeNodeId) {
      const incoming = CABLES.filter((c) => c.target === activeNodeId);
      incoming.forEach((cable, idx) => {
        map.set(cable.id, {
          medallionText: cable.isFeedback ? `↺ IN` : `IN #${idx + 1}`,
          shortTag: cable.shortTag,
          badgeColor: cable.isFeedback ? '#F43F5E' : '#38BDF8',
          isFeedback: !!cable.isFeedback,
          isCurrentStepSpotlight: true,
          directionRole: 'input',
        });
      });

      const outgoing = CABLES.filter((c) => c.source === activeNodeId).sort(
        (a, b) => a.orderFromSource - b.orderFromSource
      );
      outgoing.forEach((cable) => {
        const ord = getOrdinalLabel(cable.orderFromSource);
        map.set(cable.id, {
          medallionText: cable.isFeedback ? `↺ ${ord}` : `${ord} ➔`,
          shortTag: cable.shortTag,
          badgeColor: cable.isFeedback ? '#F43F5E' : '#10B981',
          isFeedback: !!cable.isFeedback,
          isCurrentStepSpotlight: true,
          directionRole: 'output',
        });

        if (multiHopRipple && selectedNodeId === activeNodeId && !cable.isFeedback) {
          const hop2 = CABLES.filter(
            (c) => c.source === cable.target && c.orderFromSource === 1
          );
          hop2.forEach((h2) => {
            if (!map.has(h2.id)) {
              map.set(h2.id, {
                medallionText: h2.isFeedback ? `↺ HOP2` : `HOP 2`,
                shortTag: h2.shortTag,
                badgeColor: h2.isFeedback ? '#F43F5E' : '#F59E0B',
                isFeedback: !!h2.isFeedback,
                isCurrentStepSpotlight: false,
                directionRole: 'downstream',
              });
            }
          });
        }
      });
    }

    return map;
  }, [
    focusedStageId,
    isIdleLensActive,
    viewLens,
    selectedCableId,
    activeSimulation,
    simStepIndex,
    activeNodeId,
    selectedNodeId,
    multiHopRipple,
  ]);

  // Node Top-Rim Sequence Badges (sits cleanly in the 24px gap above each card!)
  const nodeSequenceBadges = useMemo(() => {
    const badgeMap = new Map<
      string,
      { text: string; color: string; isFeedback?: boolean; isPulseSpotlight?: boolean }
    >();

    if (focusedStageId && !activeNodeId && !selectedCableId && activeSimulation === 'none') {
      const stagePhase = PHASES.find((p) => p.id === focusedStageId);
      NODES.filter((n) => n.phaseId === focusedStageId).forEach((n) => {
        badgeMap.set(n.id, {
          text: `★ ${stagePhase?.title.toUpperCase()}`,
          color: stagePhase?.color || '#38BDF8',
          isPulseSpotlight: true,
        });
      });
      activeCableSequenceMap.forEach((meta, cableId) => {
        const c = CABLES.find((item) => item.id === cableId);
        if (!c) return;
        if (!badgeMap.has(c.source)) {
          badgeMap.set(c.source, { text: `📥 ${c.shortTag}`, color: meta.badgeColor });
        }
        if (!badgeMap.has(c.target)) {
          badgeMap.set(c.target, { text: `📤 ${c.shortTag}`, color: meta.badgeColor });
        }
      });
      return badgeMap;
    }

    if (isIdleLensActive) {
      if (viewLens === 'backbone' || viewLens === 'heatmap') {
        MASTER_BACKBONE_SEQUENCE.forEach((cableId, idx) => {
          const cable = CABLES.find((c) => c.id === cableId);
          if (!cable) return;
          if (idx === 0) {
            badgeMap.set(cable.source, { text: '00 • START: MASTER SPECS', color: '#10B981' });
          }
          const stepNum = idx + 1;
          badgeMap.set(cable.target, {
            text: cable.isFeedback
              ? `↺ 0${stepNum} • ${cable.shortTag.toUpperCase()}`
              : `0${stepNum} ➔ ${cable.shortTag.toUpperCase()}`,
            color: cable.isFeedback ? '#F43F5E' : cable.color,
            isFeedback: cable.isFeedback,
          });
        });
        return badgeMap;
      }

      if (viewLens === 'all_primary') {
        NODES.forEach((n) => {
          const p = PHASES.find((ph) => ph.id === n.phaseId);
          badgeMap.set(n.id, {
            text: `${n.seqCode} • PRIMARY FLOW`,
            color: p?.color || '#0EA5E9',
          });
        });
        return badgeMap;
      }

      if (viewLens === 'feedback_bus') {
        CABLES.filter((c) => c.isFeedback).forEach((cable, idx) => {
          badgeMap.set(cable.source, {
            text: `↺ LOOP #${idx + 1} SOURCE`,
            color: '#F43F5E',
            isFeedback: true,
          });
          badgeMap.set(cable.target, {
            text: `↺ #${idx + 1} • ${cable.shortTag.toUpperCase()}`,
            color: '#F59E0B',
            isFeedback: true,
          });
        });
        return badgeMap;
      }
    }

    if (selectedCableId && !activeNodeId && activeSimulation === 'none') {
      const cable = CABLES.find((c) => c.id === selectedCableId);
      if (cable) {
        badgeMap.set(cable.source, {
          text: '★ SOURCE MODULE',
          color: '#38BDF8',
          isPulseSpotlight: true,
        });
        badgeMap.set(cable.target, {
          text: cable.isFeedback
            ? `↺ RETURN • ${cable.shortTag}`
            : `STEP #${cable.orderFromSource} ➔ ${cable.shortTag}`,
          color: cable.isFeedback ? '#F43F5E' : '#10B981',
          isPulseSpotlight: true,
        });
      }
      return badgeMap;
    }

    if (activeSimulation !== 'none') {
      const seq = SIMULATION_SCENARIOS[activeSimulation].cableSequence;
      seq.forEach((cableId, idx) => {
        if (simStepIndex !== null && idx > simStepIndex) return;
        const cable = CABLES.find((c) => c.id === cableId);
        if (!cable) return;
        if (idx === 0) {
          badgeMap.set(cable.source, {
            text: '00 • ORIGIN MODULE',
            color: '#38BDF8',
            isPulseSpotlight: simStepIndex === 0,
          });
        }
        const isCurrent = simStepIndex === idx;
        badgeMap.set(cable.target, {
          text: cable.isFeedback
            ? `↺ STEP 0${idx + 1} • ${cable.shortTag}`
            : `STEP 0${idx + 1} ➔ ${cable.shortTag}`,
          color: cable.isFeedback ? '#F43F5E' : isCurrent ? '#10B981' : '#38BDF8',
          isFeedback: cable.isFeedback,
          isPulseSpotlight: isCurrent,
        });
      });
      return badgeMap;
    }

    if (activeNodeId) {
      badgeMap.set(activeNodeId, {
        text: '★ SELECTED MODULE',
        color: '#38BDF8',
        isPulseSpotlight: true,
      });

      const incoming = CABLES.filter((c) => c.target === activeNodeId);
      incoming.forEach((cable, idx) => {
        badgeMap.set(cable.source, {
          text: cable.isFeedback
            ? `↺ FEEDBACK IN #${idx + 1}`
            : `📥 INPUT #${idx + 1} • ${cable.shortTag}`,
          color: cable.isFeedback ? '#F43F5E' : '#38BDF8',
          isFeedback: cable.isFeedback,
        });
      });

      const outgoing = CABLES.filter((c) => c.source === activeNodeId).sort(
        (a, b) => a.orderFromSource - b.orderFromSource
      );
      outgoing.forEach((cable) => {
        const ordinalText = getOrdinalLabel(cable.orderFromSource).toUpperCase();
        badgeMap.set(cable.target, {
          text: cable.isFeedback
            ? `↺ ${ordinalText} • ${cable.shortTag}`
            : `📤 ${ordinalText} ➔ ${cable.shortTag}`,
          color: cable.isFeedback ? '#F43F5E' : '#10B981',
          isFeedback: cable.isFeedback,
        });

        if (multiHopRipple && selectedNodeId === activeNodeId && !cable.isFeedback) {
          const hop2Cables = CABLES.filter(
            (c) => c.source === cable.target && c.orderFromSource === 1
          );
          hop2Cables.forEach((hop2) => {
            if (!badgeMap.has(hop2.target)) {
              badgeMap.set(hop2.target, {
                text: hop2.isFeedback
                  ? `↺ HOP 2 • ${hop2.shortTag}`
                  : `⚡ HOP 2 ➔ ${hop2.shortTag}`,
                color: hop2.isFeedback ? '#F43F5E' : '#F59E0B',
                isFeedback: hop2.isFeedback,
              });
            }
          });
        }
      });
    }

    return badgeMap;
  }, [
    focusedStageId,
    activeCableSequenceMap,
    isIdleLensActive,
    viewLens,
    activeNodeId,
    selectedNodeId,
    selectedCableId,
    activeSimulation,
    simStepIndex,
    multiHopRipple,
  ]);

  const activeStageIds = useMemo(() => {
    const set = new Set<string>();
    nodeSequenceBadges.forEach((_, nodeId) => {
      const node = NODES.find((n) => n.id === nodeId);
      if (node) set.add(node.phaseId);
    });
    return set;
  }, [nodeSequenceBadges]);

  const nodeOutgoingChipsMap = useMemo(() => {
    const map: Record<
      string,
      Array<{
        cableId: string;
        orderNum: number;
        targetId: string;
        targetShortName: string;
        shortTag: string;
        isFeedback: boolean;
      }>
    > = {};

    NODES.forEach((n) => {
      const out = CABLES.filter((c) => c.source === n.id)
        .sort((a, b) => a.orderFromSource - b.orderFromSource)
        .map((c) => {
          const tgt = NODES.find((item) => item.id === c.target);
          return {
            cableId: c.id,
            orderNum: c.orderFromSource,
            targetId: c.target,
            targetShortName: tgt?.shortName || c.target,
            shortTag: c.shortTag,
            isFeedback: !!c.isFeedback,
          };
        });
      map[n.id] = out;
    });
    return map;
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return NODES.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.conceptTagline.toLowerCase().includes(q) ||
        n.seqCode.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const activeNodeInfo = useMemo(() => {
    if (!activeNodeId) return null;
    const node = NODES.find((n) => n.id === activeNodeId);
    if (!node) return null;
    const phase = PHASES.find((p) => p.id === node.phaseId);
    return { node, phase };
  }, [activeNodeId]);

  const activeCableInfo = useMemo(() => {
    const cableId =
      selectedCableId ||
      (activeSimulation !== 'none' && simStepIndex !== null
        ? SIMULATION_SCENARIOS[activeSimulation].cableSequence[simStepIndex]
        : null);
    if (!cableId) return null;
    const cable = CABLES.find((c) => c.id === cableId);
    if (!cable) return null;
    const srcNode = NODES.find((n) => n.id === cable.source);
    const tgtNode = NODES.find((n) => n.id === cable.target);
    return { cable, srcNode, tgtNode };
  }, [selectedCableId, activeSimulation, simStepIndex]);

  // =========================================================================
  // 100% ORTHOGONAL PCB TRACE ROUTING ENGINE FOR 1420x556 MATRIX
  // =========================================================================
  const computeCableGeometry = useCallback((cable: CableRelation, indexOffset: number) => {
    const src = NODES.find((n) => n.id === cable.source);
    const tgt = NODES.find((n) => n.id === cable.target);
    if (!src || !tgt) return null;

    const isSameColumn = src.colIdx === tgt.colIdx;
    const colSpan = tgt.colIdx - src.colIdx;

    const outPinOffset = (cable.orderFromSource - 2) * 14;
    const inPinOffset = (src.rowIdx - tgt.rowIdx) * 4;

    // 1A. Adjacent-Row Same-Column Direct Vertical Bridge across the 24px Alley
    if (isSameColumn && Math.abs(src.rowIdx - tgt.rowIdx) === 1) {
      const goingDown = tgt.rowIdx > src.rowIdx;
      const xBridge = src.x + 44;
      const y1 = goingDown ? src.y + NODE_HEIGHT : src.y;
      const y2 = goingDown ? tgt.y : tgt.y + NODE_HEIGHT;
      const pathD = `M ${xBridge} ${y1} L ${xBridge} ${y2}`;
      const midX = xBridge;
      const midY = (y1 + y2) / 2;
      return { pathD, midX, midY, x1: xBridge, y1, x2: xBridge, y2, isCompactMedallion: true };
    }

    // 1B. Multi-Row Same-Column Local PCB Trace
    if (isSameColumn) {
      const x1 = src.x + NODE_WIDTH;
      const y1 = src.y + NODE_HEIGHT / 2 + outPinOffset * 0.4;
      const x2 = tgt.x + NODE_WIDTH;
      const y2 = tgt.y + NODE_HEIGHT / 2;
      const corridorCenter = src.colIdx < 5 ? x1 + 18 : x1 + 12;
      const laneX = corridorCenter + cable.corridorTrack * 4;
      const r = 7;
      const dirY = y2 > y1 ? 1 : -1;

      const pathD = [
        `M ${x1} ${y1}`,
        `L ${laneX - r} ${y1}`,
        `Q ${laneX} ${y1} ${laneX} ${y1 + dirY * r}`,
        `L ${laneX} ${y2 - dirY * r}`,
        `Q ${laneX} ${y2} ${laneX - r} ${y2}`,
        `L ${x2} ${y2}`,
      ].join(' ');

      const midX = corridorCenter;
      const midY = (y1 + y2) / 2;
      return { pathD, midX, midY, x1, y1, x2, y2, isCompactMedallion: true };
    }

    // 2. Adjacent Column Orthogonal PCB Trace (colSpan === 1)
    if (colSpan === 1) {
      const x1 = src.x + NODE_WIDTH;
      const y1 = src.y + NODE_HEIGHT / 2 + outPinOffset;
      const x2 = tgt.x;
      const y2 = tgt.y + NODE_HEIGHT / 2 + inPinOffset;

      const corridorCenter = (x1 + x2) / 2;
      const laneX = corridorCenter + cable.corridorTrack * 5;

      if (Math.abs(y2 - y1) < 12) {
        const pathD = `M ${x1} ${y1} L ${x2} ${y1}`;
        return {
          pathD,
          midX: corridorCenter,
          midY: y1,
          x1,
          y1,
          x2,
          y2: y1,
          isCompactMedallion: true,
        };
      }

      const r = 7;
      const dirY = y2 > y1 ? 1 : -1;
      const pathD = [
        `M ${x1} ${y1}`,
        `L ${laneX - r} ${y1}`,
        `Q ${laneX} ${y1} ${laneX} ${y1 + dirY * r}`,
        `L ${laneX} ${y2 - dirY * r}`,
        `Q ${laneX} ${y2} ${laneX + r} ${y2}`,
        `L ${x2} ${y2}`,
      ].join(' ');

      const midX = corridorCenter;
      const midY = (y1 + y2) / 2;
      return { pathD, midX, midY, x1, y1, x2, y2, isCompactMedallion: true };
    }

    // 3. Feedback Return Loops & Multi-Column Jumps -> Top/Bottom Highway Bus
    const isTopBus = !cable.isFeedback && src.rowIdx <= 1 && tgt.rowIdx <= 1;
    const laneIdx = cable.highwayLane ?? indexOffset % 3;
    const busY = isTopBus ? 14 + laneIdx * 5 : 542 + laneIdx * 4;

    const x1 = cable.isFeedback ? src.x : src.x + NODE_WIDTH;
    const y1 = src.y + NODE_HEIGHT / 2 + outPinOffset * 0.4;
    const x2 = cable.isFeedback ? tgt.x + NODE_WIDTH : tgt.x;
    const y2 = tgt.y + NODE_HEIGHT / 2 + inPinOffset * 0.4;

    const exitCorridorX = cable.isFeedback
      ? src.x - 16 + cable.corridorTrack * 3
      : src.x + NODE_WIDTH + 16 + cable.corridorTrack * 3;

    const entryCorridorX = cable.isFeedback
      ? tgt.x + NODE_WIDTH + 16 + cable.corridorTrack * 3
      : tgt.x - 16 + cable.corridorTrack * 3;

    const r = 8;
    const dirToBusY = busY > y1 ? 1 : -1;
    const dirFromBusY = y2 > busY ? 1 : -1;
    const dirBusX = entryCorridorX > exitCorridorX ? 1 : -1;

    const pathD = [
      `M ${x1} ${y1}`,
      `L ${exitCorridorX - (cable.isFeedback ? -r : r)} ${y1}`,
      `Q ${exitCorridorX} ${y1} ${exitCorridorX} ${y1 + dirToBusY * r}`,
      `L ${exitCorridorX} ${busY - dirToBusY * r}`,
      `Q ${exitCorridorX} ${busY} ${exitCorridorX + dirBusX * r} ${busY}`,
      `L ${entryCorridorX - dirBusX * r} ${busY}`,
      `Q ${entryCorridorX} ${busY} ${entryCorridorX} ${busY + dirFromBusY * r}`,
      `L ${entryCorridorX} ${y2 - dirFromBusY * r}`,
      `Q ${entryCorridorX} ${y2} ${
        entryCorridorX + (cable.isFeedback ? -r : r)
      } ${y2}`,
      `L ${x2} ${y2}`,
    ].join(' ');

    const midX = (exitCorridorX + entryCorridorX) / 2;
    const midY = busY;

    return { pathD, midX, midY, x1, y1, x2, y2, isCompactMedallion: false };
  }, []);

  // Anti-collision spacing for active corridor pills
  const deOverlappedActiveGeometries = useMemo(() => {
    const geomMap = new Map<
      string,
      {
        pathD: string;
        midX: number;
        midY: number;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        isCompactMedallion: boolean;
      }
    >();

    const placedMedallions: Array<{ x: number; y: number; isCompact: boolean }> = [];

    CABLES.forEach((cable, idx) => {
      if (!activeCableSequenceMap.has(cable.id)) return;
      const baseGeom = computeCableGeometry(cable, idx);
      if (!baseGeom) return;

      let { midX, midY } = baseGeom;
      const isCompact = baseGeom.isCompactMedallion;

      for (let attempt = 0; attempt < 10; attempt++) {
        const collision = placedMedallions.find((p) => {
          const minDx = isCompact && p.isCompact ? 38 : 140;
          const minDy = 20;
          return Math.abs(p.x - midX) < minDx && Math.abs(p.y - midY) < minDy;
        });
        if (!collision) break;
        if (isCompact) {
          midY += (attempt % 2 === 0 ? 1 : -1) * (20 + attempt * 4);
          midY = Math.min(Math.max(midY, 76), 518);
        } else {
          midX += (attempt % 2 === 0 ? 1 : -1) * 145;
          midX = Math.min(Math.max(midX, 150), CANVAS_WIDTH - 150);
        }
      }

      placedMedallions.push({ x: midX, y: midY, isCompact });
      geomMap.set(cable.id, { ...baseGeom, midX, midY });
    });

    return geomMap;
  }, [activeCableSequenceMap, computeCableGeometry]);

  const handleSelectSearchResult = (node: EcosystemNode) => {
    setSelectedNodeId(node.id);
    setSelectedCableId(null);
    setActiveSimulation('none');
    setSearchQuery('');
  };

  // Cycle Previous / Next Step in Backbone or Simulation
  const handleStepDelta = (delta: number) => {
    const list = ribbonSequenceCables;
    if (list.length === 0) return;
    if (activeSimulation !== 'none') {
      const nextIdx =
        simStepIndex === null
          ? 0
          : (simStepIndex + delta + list.length) % list.length;
      setSimStepIndex(nextIdx);
      if (cinemaCamera && list[nextIdx]) {
        focusCameraOnCable(list[nextIdx].cable.id);
      }
      return;
    }
    const currIdx = list.findIndex((item) => item.cable.id === selectedCableId);
    const nextIdx = currIdx === -1 ? 0 : (currIdx + delta + list.length) % list.length;
    const nextCable = list[nextIdx].cable;
    setSelectedCableId(nextCable.id);
    if (cinemaCamera) {
      focusCameraOnCable(nextCable.id);
    }
  };

  return (
    <div
      dir="ltr"
      className="relative w-full h-full max-h-full flex flex-col bg-[#030711] text-slate-100 overflow-hidden select-none font-sans"
    >
      {/* ========================================================================= */}
      {/* 1A. COMPACT TOP COMMAND HEADER BAR */}
      {/* ========================================================================= */}
      <header className="h-10 px-3 border-b border-white/10 bg-[#070d19]/95 backdrop-blur-xl flex items-center justify-between gap-2 shrink-0 z-30">
        {/* Brand + Architectural Lens Switcher */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0066CC] to-[#00A3E0] flex items-center justify-center shadow-[0_0_12px_rgba(0,163,224,0.45)] border border-sky-300/30">
              <Compass className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-black tracking-tight text-white hidden xl:inline">
              QMS 4.0 MATRIX
            </span>
          </div>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          {/* 4 Architectural View Lenses */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => {
                setViewLens('backbone');
                setSelectedNodeId(null);
                setSelectedCableId(null);
                setFocusedStageId(null);
                setActiveSimulation('none');
              }}
              className={`px-2 py-1 rounded-md text-[11px] font-extrabold transition-all flex items-center gap-1 ${
                viewLens === 'backbone' && isIdleLensActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3 h-3 text-emerald-400" />
              <span>Backbone (1➔8)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewLens('all_primary');
                setSelectedNodeId(null);
                setSelectedCableId(null);
                setFocusedStageId(null);
                setActiveSimulation('none');
              }}
              className={`px-2 py-1 rounded-md text-[11px] font-extrabold transition-all flex items-center gap-1 ${
                viewLens === 'all_primary' && isIdleLensActive
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <GitBranch className="w-3 h-3 text-sky-400" />
              <span>All 1st Links</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewLens('feedback_bus');
                setSelectedNodeId(null);
                setSelectedCableId(null);
                setFocusedStageId(null);
                setActiveSimulation('none');
              }}
              className={`px-2 py-1 rounded-md text-[11px] font-extrabold transition-all flex items-center gap-1 ${
                viewLens === 'feedback_bus' && isIdleLensActive
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <RotateCcw className="w-3 h-3 text-rose-400" />
              <span>↺ Return Loops (7)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewLens('heatmap');
                setSelectedNodeId(null);
                setSelectedCableId(null);
                setFocusedStageId(null);
                setActiveSimulation('none');
              }}
              className={`px-2 py-1 rounded-md text-[11px] font-extrabold transition-all flex items-center gap-1 ${
                viewLens === 'heatmap'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Activity className="w-3 h-3 text-amber-400" />
              <span>Health SLA</span>
            </button>
          </div>
        </div>

        {/* Center: Live Scenario Simulators + Cinema Camera Toggle */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-white/10">
          {(
            Object.keys(SIMULATION_SCENARIOS) as Array<Exclude<SimulationScenarioId, 'none'>>
          ).map((simKey) => {
            const sim = SIMULATION_SCENARIOS[simKey];
            const isActive = activeSimulation === simKey;
            return (
              <button
                key={simKey}
                type="button"
                onClick={() => {
                  setSelectedNodeId(null);
                  setSelectedCableId(null);
                  setFocusedStageId(null);
                  setActiveSimulation(isActive ? 'none' : simKey);
                }}
                className={`px-2 py-1 rounded-md text-[11px] font-extrabold transition-all flex items-center gap-1 whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white shadow-[0_0_10px_rgba(0,163,224,0.45)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive ? (
                  <Square className="w-2.5 h-2.5 fill-current animate-pulse" />
                ) : (
                  <Play className="w-2.5 h-2.5 fill-current" />
                )}
                <span>{sim.shortTitle}</span>
              </button>
            );
          })}

          <div className="h-3.5 w-px bg-white/10 mx-0.5" />

          {/* Cinema Auto-Follow Camera Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextVal = !cinemaCamera;
              setCinemaCamera(nextVal);
              if (!nextVal) {
                fitToScreen();
              } else if (activeCableInfo) {
                focusCameraOnCable(activeCableInfo.cable.id);
              }
            }}
            className={`px-2 py-1 rounded-md text-[11px] font-extrabold transition-all flex items-center gap-1 ${
              cinemaCamera
                ? 'bg-purple-500/25 text-purple-200 border border-purple-400/50 shadow-[0_0_10px_rgba(168,85,247,0.35)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Smoothly zoom & track the active step on the canvas"
          >
            <Video className="w-3 h-3 text-purple-400" />
            <span>Cinema Zoom</span>
          </button>
        </div>

        {/* Right: Quick Search & Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <div className="relative hidden sm:block">
            <div className="flex items-center bg-slate-900/90 border border-white/15 rounded-lg px-2 py-0.5 w-36 focus-within:w-48 focus-within:border-sky-400 transition-all">
              <Search className="w-3 h-3 text-slate-400 mr-1.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 24 modules..."
                className="bg-transparent text-[11px] text-white placeholder-slate-400 focus:outline-none w-full font-semibold"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-white text-[10px] ml-1"
                >
                  ✕
                </button>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="absolute right-0 mt-1 w-64 bg-[#0b1324] border border-white/15 rounded-xl shadow-2xl py-1 z-50 max-h-60 overflow-y-auto">
                {searchResults.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => handleSelectSearchResult(node)}
                    className="w-full px-3 py-1.5 text-left hover:bg-white/10 flex items-center justify-between gap-2 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                        {node.seqCode}
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate">
                          {node.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {node.conceptTagline}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMultiHopRipple((v) => !v)}
            className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border transition-all hidden xl:flex items-center gap-1 ${
              multiHopRipple
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-slate-900/60 border-white/10 text-slate-400'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>2-Hop</span>
          </button>

          <div className="flex items-center bg-slate-900/90 border border-white/10 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(z - 0.1, 0.5))}
              className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold text-sky-300 px-1.5 min-w-[38px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(z + 0.1, 1.55))}
              className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={fitToScreen}
              className="p-1 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 rounded transition-colors"
              title="Fit Full Widescreen Matrix"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 1B. DOCKED SEQUENCE PIPELINE RIBBON WITH PREV/NEXT STEPPER */}
      {/* ========================================================================= */}
      <div className="h-8 px-3 border-b border-white/10 bg-[#050a14]/95 flex items-center justify-between gap-2 shrink-0 z-20 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Prev / Next Stepper Buttons */}
          <div className="flex items-center bg-slate-900 border border-white/15 rounded-md p-0.5">
            <button
              type="button"
              onClick={() => handleStepDelta(-1)}
              className="p-0.5 text-slate-300 hover:text-white hover:bg-white/10 rounded"
              title="Previous Relationship Step"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-300 px-1.5">
              {activeSimulation !== 'none'
                ? `SIMULATION`
                : activeNodeInfo
                ? `${activeNodeInfo.node.shortName} FLOW`
                : `STEPPER (1➔8)`}
            </span>
            <button
              type="button"
              onClick={() => handleStepDelta(1)}
              className="p-0.5 text-slate-300 hover:text-white hover:bg-white/10 rounded"
              title="Next Relationship Step"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            {ribbonSequenceCables.map((item, idx) => {
              const isBackboneFeedback = item.cable.isFeedback;
              return (
                <React.Fragment key={item.cable.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCableId(
                        selectedCableId === item.cable.id ? null : item.cable.id
                      );
                      if (cinemaCamera) {
                        focusCameraOnCable(item.cable.id);
                      }
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-all flex items-center gap-1 shrink-0 border ${
                      item.isActiveStep
                        ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)] scale-105'
                        : isBackboneFeedback
                        ? 'bg-rose-950/60 border-rose-500/40 text-rose-200 hover:bg-rose-500/20'
                        : item.isPassedStep
                        ? 'bg-slate-900/90 border-white/15 text-slate-200 hover:border-sky-400/50 hover:text-white'
                        : 'bg-slate-950/50 border-white/5 text-slate-500'
                    }`}
                  >
                    <span
                      className={`px-1 rounded text-[9px] font-black ${
                        isBackboneFeedback
                          ? 'bg-rose-500 text-white'
                          : 'bg-sky-400 text-slate-950'
                      }`}
                    >
                      {isBackboneFeedback ? `↺ 0${item.stepNumber}` : `0${item.stepNumber}`}
                    </span>
                    <span className="font-bold">{item.srcName}</span>
                    <span className="text-sky-400">➔</span>
                    <span className="font-bold text-emerald-300">{item.tgtName}</span>
                  </button>
                  {idx < ribbonSequenceCables.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {(selectedNodeId || selectedCableId || activeSimulation !== 'none' || focusedStageId) && (
          <button
            type="button"
            onClick={() => {
              setSelectedNodeId(null);
              setSelectedCableId(null);
              setActiveSimulation('none');
              fitToScreen();
            }}
            className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 text-[10px] font-black shrink-0"
          >
            Reset View ✕
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE WIDESCREEN 2.55:1 FULL-SCALE MATRIX (1420 x 556) */}
      {/* ========================================================================= */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest('[data-interactive="true"]')) {
            setSelectedNodeId(null);
            setSelectedCableId(null);
          }
        }}
        className={`relative flex-1 w-full overflow-hidden ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          backgroundImage: `
            radial-gradient(circle at 18% 22%, rgba(0, 102, 204, 0.14) 0%, transparent 45%),
            radial-gradient(circle at 82% 78%, rgba(16, 185, 129, 0.11) 0%, transparent 45%),
            radial-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 22px 22px',
        }}
      >
        {/* LIVE TELEPROMPTER STORY BANNER (Appears when stepping through a Cable or Simulation!) */}
        {activeCableInfo && (
          <div
            data-interactive="true"
            className="absolute top-2.5 left-1/2 -translate-x-1/2 z-40 max-w-3xl w-[94%] bg-[#071124]/95 backdrop-blur-2xl border-2 rounded-2xl px-4 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.85)] flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
              borderColor: activeCableInfo.cable.isFeedback ? '#F43F5E' : '#10B981',
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider shrink-0 shadow"
                style={{
                  backgroundColor: activeCableInfo.cable.isFeedback ? '#F43F5E' : '#10B981',
                  color: '#030711',
                }}
              >
                {activeCableInfo.cable.isFeedback
                  ? `↺ RETURN LOOP #${activeCableInfo.cable.orderFromSource}`
                  : `STEP #${activeCableInfo.cable.orderFromSource} FLOW`}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-black text-white truncate">
                  <span>
                    {activeCableInfo.srcNode?.emoji} {activeCableInfo.srcNode?.title}
                  </span>
                  <span className="text-sky-400">━━▶</span>
                  <span className="text-emerald-300">
                    {activeCableInfo.tgtNode?.emoji} {activeCableInfo.tgtNode?.title}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/10 text-amber-300 font-mono text-[11px]">
                    {activeCableInfo.cable.shortTag}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-300 truncate">
                  {activeCableInfo.cable.label}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleStepDelta(-1)}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
              >
                ◀ Prev
              </button>
              <button
                type="button"
                onClick={() => handleStepDelta(1)}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black"
              >
                Next Step ▶
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCableId(null);
                  setActiveSimulation('none');
                  fitToScreen();
                }}
                className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div
          className="origin-top-left transition-transform duration-150 ease-out"
          style={{
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          }}
        >
          {/* ------------------------------------------------------------- */}
          {/* LAYER 0: 6 CLICK-TO-ZOOM STAGE COLUMNS (Stages 01 -> 06) */}
          {/* ------------------------------------------------------------- */}
          {PHASES.map((phase, idx) => {
            const isStageActive = activeStageIds.has(phase.id);
            const isFocused = focusedStageId === phase.id;
            return (
              <div
                key={phase.id}
                style={{
                  left: `${phase.x - 4}px`,
                  top: '26px',
                  width: `${phase.width + 8}px`,
                  height: `${CANVAS_HEIGHT - 36}px`,
                  borderColor: isFocused
                    ? phase.color
                    : isStageActive
                    ? `${phase.color}66`
                    : 'rgba(255,255,255,0.06)',
                  background: isFocused
                    ? `linear-gradient(180deg, ${phase.badgeBg} 0%, rgba(10, 18, 34, 0.72) 100%)`
                    : isStageActive
                    ? `linear-gradient(180deg, ${phase.badgeBg} 0%, rgba(10, 18, 34, 0.45) 100%)`
                    : 'linear-gradient(180deg, rgba(15, 23, 42, 0.42) 0%, rgba(8, 13, 25, 0.22) 100%)',
                }}
                className="absolute rounded-xl border transition-all duration-300 pointer-events-none"
              >
                {/* Clickable Stage Header */}
                <button
                  type="button"
                  data-interactive="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFocusStage(phase);
                  }}
                  title={`Click to ${isFocused ? 'reset zoom' : `zoom & spotlight ${phase.title}`}`}
                  className="pointer-events-auto w-full px-2.5 py-1.5 border-b border-white/10 flex items-center justify-between rounded-t-xl bg-slate-950/85 hover:bg-slate-900 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded uppercase shrink-0"
                      style={{
                        backgroundColor: phase.color,
                        color: '#020617',
                      }}
                    >
                      0{idx + 1}
                    </span>
                    <span className="text-[13px] font-black text-white tracking-tight truncate">
                      {phase.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-sky-300 transition-colors shrink-0">
                    {isFocused ? 'Reset ✕' : `${phase.subtitle} 🔍`}
                  </span>
                </button>
              </div>
            );
          })}

          {/* ------------------------------------------------------------- */}
          {/* LAYER 1: SUBTLE BACKGROUND PCB TRACES (Dimmed non-active) */}
          {/* ------------------------------------------------------------- */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}
          >
            {CABLES.map((cable, idx) => {
              if (activeCableSequenceMap.has(cable.id)) return null;
              const geom = computeCableGeometry(cable, idx);
              if (!geom) return null;

              const isDimmedByFocus =
                Boolean(activeNodeId) ||
                Boolean(selectedCableId) ||
                Boolean(focusedStageId) ||
                activeSimulation !== 'none';

              return (
                <path
                  key={cable.id}
                  d={geom.pathD}
                  fill="none"
                  stroke={cable.isFeedback ? '#F43F5E' : cable.color}
                  strokeWidth={cable.orderFromSource === 1 ? '1.3' : '0.9'}
                  strokeDasharray={cable.isFeedback ? '6, 5' : 'none'}
                  opacity={isDimmedByFocus ? 0.05 : 0.14}
                />
              );
            })}
          </svg>

          {/* ------------------------------------------------------------- */}
          {/* LAYER 2: 24 FULL-WIDTH HERO POSTER CARDS (202 x 98px) */}
          {/* 17px Title + Full-Width 12.5px Concept + Sequence Bar */}
          {/* ------------------------------------------------------------- */}
          {NODES.map((node) => {
            const Icon = node.icon;
            const phase = PHASES.find((p) => p.id === node.phaseId)!;
            const seqBadge = nodeSequenceBadges.get(node.id);
            const isConnected = Boolean(seqBadge);
            const isSelected = activeNodeId === node.id;
            const hasAnyFocus =
              Boolean(activeNodeId) ||
              Boolean(selectedCableId) ||
              Boolean(focusedStageId) ||
              activeSimulation !== 'none';
            const isDimmed = hasAnyFocus && !isConnected;
            const outgoingChips = nodeOutgoingChipsMap[node.id] || [];

            const heatmapBorderColor =
              node.healthScore >= 97
                ? '#10B981'
                : node.healthScore >= 94
                ? '#38BDF8'
                : '#F59E0B';

            const cardAccentColor =
              viewLens === 'heatmap'
                ? heatmapBorderColor
                : seqBadge
                ? seqBadge.color
                : phase.color;

            return (
              <div
                key={node.id}
                data-interactive="true"
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCableId(null);
                  setActiveSimulation('none');
                  setSelectedNodeId(node.id === selectedNodeId ? null : node.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  navigate(node.path);
                }}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: `${NODE_WIDTH}px`,
                  height: `${NODE_HEIGHT}px`,
                  borderColor: isSelected
                    ? '#38BDF8'
                    : seqBadge
                    ? seqBadge.color
                    : viewLens === 'heatmap'
                    ? heatmapBorderColor
                    : `${phase.color}66`,
                  boxShadow: isSelected
                    ? `0 0 28px rgba(56, 189, 248, 0.55), 0 10px 24px rgba(0,0,0,0.8)`
                    : seqBadge?.isPulseSpotlight
                    ? `0 0 22px ${seqBadge.color}66, 0 8px 20px rgba(0,0,0,0.75)`
                    : `0 6px 16px rgba(0, 0, 0, 0.65)`,
                }}
                className={`absolute rounded-xl bg-[#091224]/95 backdrop-blur-xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-visible group ${
                  isDimmed
                    ? 'opacity-20 scale-[0.97]'
                    : 'opacity-100 hover:scale-[1.05] hover:z-40'
                } ${isSelected || seqBadge?.isPulseSpotlight ? 'z-30' : 'z-20'}`}
              >
                {/* Left Vertical Neon Spine Bar */}
                <div
                  className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full"
                  style={{ backgroundColor: cardAccentColor }}
                />

                {/* Top-Rim Floating Sequence Action Tag (Sits in the 24px gap above card) */}
                {seqBadge && (
                  <div
                    style={{
                      backgroundColor: seqBadge.color,
                      boxShadow: `0 3px 10px ${seqBadge.color}77`,
                    }}
                    className={`absolute -top-3 right-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider text-slate-950 shadow-lg flex items-center gap-1 whitespace-nowrap z-30 border border-white/50 ${
                      seqBadge.isPulseSpotlight ? 'animate-bounce' : ''
                    }`}
                  >
                    <span>{seqBadge.text}</span>
                  </div>
                )}

                {/* ROW 1: Top Header Strip (Code + Emoji + Icon + Live KPI Pill) */}
                <div className="pl-2.5 pr-2 pt-1.5 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center border border-white/15 shrink-0"
                      style={{
                        backgroundColor: `${cardAccentColor}25`,
                        color: cardAccentColor,
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span
                      className="text-[10.5px] font-black font-mono tracking-wider"
                      style={{ color: cardAccentColor }}
                    >
                      {node.seqCode}
                    </span>
                    <span className="text-xs leading-none">{node.emoji}</span>
                  </div>

                  {/* Live Metric Pill */}
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-black font-mono tracking-tight border border-white/10"
                    style={{
                      backgroundColor: `${cardAccentColor}18`,
                      color: '#F8FAFC',
                    }}
                  >
                    {viewLens === 'heatmap' ? `SLA ${node.healthScore}%` : node.kpiValue}
                  </span>
                </div>

                {/* ROW 2: HERO FULL-WIDTH TITLE (17px Black) & CONCEPT SUBTITLE (12px Extrabold) */}
                <div className="pl-2.5 pr-2 flex flex-col justify-center">
                  <h4 className="text-[16.5px] font-black text-white leading-none tracking-tight whitespace-nowrap">
                    {node.title}
                  </h4>
                  <p
                    className="text-[11.5px] font-extrabold leading-tight whitespace-nowrap mt-1"
                    style={{ color: `${phase.color}` }}
                  >
                    {node.conceptTagline}
                  </p>
                </div>

                {/* ROW 3: Bottom Interactive Sequence Buttons (1st, 2nd, ↺) + Go Button */}
                <div className="pl-2.5 pr-1.5 pb-1 pt-0.5 border-t border-white/[0.08] bg-slate-950/60 rounded-b-xl flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 overflow-hidden">
                    {outgoingChips.slice(0, 2).map((chip) => (
                      <button
                        key={chip.cableId}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNodeId(null);
                          setActiveSimulation('none');
                          setSelectedCableId(
                            chip.cableId === selectedCableId ? null : chip.cableId
                          );
                          if (cinemaCamera) {
                            focusCameraOnCable(chip.cableId);
                          }
                        }}
                        title={`${getOrdinalLabel(chip.orderNum)}: ${chip.shortTag} ➔ ${chip.targetShortName}`}
                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-black transition-all flex items-center gap-0.5 shrink-0 ${
                          selectedCableId === chip.cableId
                            ? 'bg-emerald-400 text-slate-950 shadow'
                            : chip.isFeedback
                            ? 'bg-rose-500/25 text-rose-200 border border-rose-500/40 hover:bg-rose-500/40'
                            : 'bg-white/[0.08] text-slate-200 border border-white/10 hover:bg-sky-500/30 hover:text-white'
                        }`}
                      >
                        <span className={chip.isFeedback ? 'text-rose-300' : 'text-sky-300'}>
                          {chip.isFeedback ? `↺${chip.orderNum}` : `${chip.orderNum}➔`}
                        </span>
                        <span>{chip.targetShortName}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(node.path);
                    }}
                    className="px-1.5 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-slate-950 border border-sky-400/30 text-[9.5px] font-black transition-all flex items-center gap-0.5 shrink-0"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* ------------------------------------------------------------- */}
          {/* LAYER 3: FOREGROUND PCB TRACES & CORRIDOR NUMBER PILLS */}
          {/* ------------------------------------------------------------- */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-30"
            style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}
          >
            <defs>
              <filter id="laserGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              <marker
                id="arrowActiveGreen"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#10B981" />
              </marker>

              <marker
                id="arrowActiveBlue"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#38BDF8" />
              </marker>

              <marker
                id="arrowActiveAmber"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#F59E0B" />
              </marker>

              <marker
                id="arrowActiveFeedback"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6.5"
                markerHeight="6.5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#F43F5E" />
              </marker>
            </defs>

            {CABLES.map((cable) => {
              const seqMeta = activeCableSequenceMap.get(cable.id);
              if (!seqMeta) return null;

              const geom = deOverlappedActiveGeometries.get(cable.id);
              if (!geom) return null;

              const strokeColor = seqMeta.badgeColor;
              const markerId = seqMeta.isFeedback
                ? 'url(#arrowActiveFeedback)'
                : seqMeta.directionRole === 'input'
                ? 'url(#arrowActiveBlue)'
                : seqMeta.directionRole === 'downstream'
                ? 'url(#arrowActiveAmber)'
                : 'url(#arrowActiveGreen)';

              return (
                <g
                  key={cable.id}
                  opacity={
                    seqMeta.directionRole === 'ambient'
                      ? 0.95
                      : seqMeta.isCurrentStepSpotlight
                      ? 1
                      : 0.78
                  }
                >
                  {/* Glowing Orthogonal PCB Path */}
                  <path
                    id={`path-${cable.id}`}
                    d={geom.pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={
                      seqMeta.isCurrentStepSpotlight
                        ? seqMeta.isFeedback
                          ? '3'
                          : '2.6'
                        : '2'
                    }
                    strokeDasharray={seqMeta.isFeedback ? '8, 5' : 'none'}
                    filter="url(#laserGlow)"
                    markerEnd={markerId}
                  />

                  {/* Dual Live Travelling Energy Orbs */}
                  <circle
                    r={seqMeta.isCurrentStepSpotlight ? '4.2' : '3'}
                    fill="#ffffff"
                    filter="url(#laserGlow)"
                  >
                    <animateMotion
                      dur={seqMeta.isFeedback ? '2.0s' : '1.35s'}
                      repeatCount="indefinite"
                      path={geom.pathD}
                    />
                  </circle>
                  <circle
                    r={seqMeta.isCurrentStepSpotlight ? '3.2' : '2.5'}
                    fill={strokeColor}
                    filter="url(#laserGlow)"
                  >
                    <animateMotion
                      dur={seqMeta.isFeedback ? '2.0s' : '1.35s'}
                      begin="0.67s"
                      repeatCount="indefinite"
                      path={geom.pathD}
                    />
                  </circle>

                  {/* Corridor Number Pill (36x18px inside 36px corridor) */}
                  <g
                    transform={`translate(${geom.midX}, ${geom.midY})`}
                    className="pointer-events-auto cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(null);
                      setActiveSimulation('none');
                      setSelectedCableId(cable.id === selectedCableId ? null : cable.id);
                      if (cinemaCamera) {
                        focusCameraOnCable(cable.id);
                      }
                    }}
                  >
                    {geom.isCompactMedallion ? (
                      <>
                        <rect
                          x="-18"
                          y="-9"
                          width="36"
                          height="18"
                          rx="9"
                          fill={strokeColor}
                          stroke="#ffffff"
                          strokeWidth="1.3"
                        />
                        <text
                          x="0"
                          y="3.5"
                          textAnchor="middle"
                          fill="#040812"
                          fontSize="10"
                          fontWeight="900"
                        >
                          {seqMeta.medallionText}
                        </text>
                      </>
                    ) : (
                      /* Highway Return Bus Capsule (Top/Bottom Highway) */
                      <>
                        <rect
                          x="-82"
                          y="-9"
                          width="164"
                          height="18"
                          rx="9"
                          fill="#050b16"
                          stroke={strokeColor}
                          strokeWidth="1.8"
                        />
                        <rect
                          x="-80"
                          y="-7"
                          width="46"
                          height="14"
                          rx="7"
                          fill={strokeColor}
                        />
                        <text
                          x="-57"
                          y="3.2"
                          textAnchor="middle"
                          fill="#040812"
                          fontSize="9.5"
                          fontWeight="900"
                        >
                          {seqMeta.medallionText}
                        </text>
                        <text
                          x="22"
                          y="3.2"
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="9.5"
                          fontWeight="800"
                        >
                          {seqMeta.shortTag}
                        </text>
                      </>
                    )}
                  </g>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DOCKED SINGLE-LINE BOTTOM STATUS BAR */}
      {/* ========================================================================= */}
      <div className="h-9 px-4 border-t border-white/10 bg-[#070d19]/95 backdrop-blur-2xl flex items-center justify-between shrink-0 z-30 gap-3 overflow-x-auto no-scrollbar">
        {activeNodeInfo ? (
          <div className="w-full flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-black">
                {activeNodeInfo.node.seqCode}
              </span>
              <span className="font-black text-white text-sm">
                {activeNodeInfo.node.emoji} {activeNodeInfo.node.title}
              </span>
              <span className="text-sky-300 font-bold text-xs">
                • {activeNodeInfo.node.conceptTagline}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {selectedNodeId && (
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(null)}
                  className="px-2 py-0.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10"
                >
                  Unpin
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate(activeNodeInfo.node.path)}
                className="px-3 py-0.5 rounded-lg bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white text-xs font-black flex items-center gap-1.5 shadow-md hover:scale-105 transition-all whitespace-nowrap"
              >
                <span>Launch Module</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full flex items-center justify-between text-xs text-slate-300 gap-4">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Full-Width Hero Cards (17px Title + Full Concept) • Stepper Controls (◀/▶) • Cinema Zoom</span>
              </span>
            </div>
            <span className="text-xs text-slate-300 hidden md:inline">
              Use <strong>◀ / ▶ Stepper</strong> or click any <strong>Stage 01..06 Header</strong> to zoom & trace relationships
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
