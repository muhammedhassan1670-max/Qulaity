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
  Bug,
  ClipboardCheck,
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
  pdcaPhase: 'PLAN' | 'DO' | 'CHECK' | 'ACT';
  isoClauseRange: string;
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
  isoClause: string; // Short single-line ISO 9001:2015 Clause (never wraps!)
  title: string; // Crisp 16px bold title
  shortName: string; // Short 3-6 char code for bottom pills (never truncates!)
  conceptTagline: string; // Concise 3-4 word concept subtitle
   phaseId: PhaseId;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  x: number;
  y: number;
  colIdx: number;
  rowIdx: number;
  kpiValue: string; // Short single-line KPI (max 7 chars so it never wraps!)
  healthScore: number;
  health: 'optimal' | 'warning' | 'active';
}

interface CableRelation {
  id: string;
  source: string;
  target: string;
  orderFromSource: number;
  isoTransition: string;
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
// SPACIOUS ZERO-CLUTTER MATRIX GEOMETRY (1460 x 560)
// 48px Wide Corridors + 28px Open Row Gaps + Zero External Overlapping Banners
// ============================================================================

const CANVAS_WIDTH = 1540;
const CANVAS_HEIGHT = 580;
const NODE_WIDTH = 204;
const NODE_HEIGHT = 100;

// 6 Columns: 198px Card + 48px Spacious Corridor = 246px pitch
const COL_X = [16, 272, 528, 784, 1040, 1296];

// 4 Rows: 94px Card + 28px Pure Open Vertical Gap = 122px pitch
const ROW_Y = [68, 194, 320, 446];

const PHASES: PhaseZone[] = [
  {
    id: 'foundation',
    stageNum: 'STAGE 01',
    pdcaPhase: 'PLAN',
    isoClauseRange: 'ISO Cl. 4.4 • 6.1 • 8.1 • 8.3',
    title: 'Plan & Design',
    subtitle: 'Cl. 6.1 & 8.1',
    color: '#0EA5E9',
    glowColor: 'rgba(14, 165, 233, 0.25)',
    badgeBg: 'rgba(14, 165, 233, 0.12)',
    x: COL_X[0],
    width: NODE_WIDTH,
  },
  {
    id: 'inbound',
    stageNum: 'STAGE 02',
    pdcaPhase: 'DO',
    isoClauseRange: 'ISO Cl. 7.1.5 • 8.4 • 8.7',
    title: 'Inbound & MSA',
    subtitle: 'Cl. 7.1.5 & 8.4',
    color: '#06B6D4',
    glowColor: 'rgba(6, 182, 212, 0.25)',
    badgeBg: 'rgba(6, 182, 212, 0.12)',
    x: COL_X[1],
    width: NODE_WIDTH,
  },
  {
    id: 'inprocess',
    stageNum: 'STAGE 03',
    pdcaPhase: 'DO',
    isoClauseRange: 'ISO Cl. 8.5.1 • 9.1.1',
    title: 'Shopfloor QC',
    subtitle: 'Cl. 8.5.1 & 9.1',
    color: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.25)',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    x: COL_X[2],
    width: NODE_WIDTH,
  },
  {
    id: 'containment',
    stageNum: 'STAGE 04',
    pdcaPhase: 'ACT',
    isoClauseRange: 'ISO Cl. 8.7 • 10.2 CAPA',
    title: 'NCR & 8D CAPA',
    subtitle: 'Cl. 8.7 & 10.2',
    color: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    x: COL_X[3],
    width: NODE_WIDTH,
  },
  {
    id: 'outbound',
    stageNum: 'STAGE 05',
    pdcaPhase: 'CHECK',
    isoClauseRange: 'ISO Cl. 8.6 • 8.2.1 • 9.1.2',
    title: 'Release & CSAT',
    subtitle: 'Cl. 8.6 & 9.1.2',
    color: '#8B5CF6',
    glowColor: 'rgba(139, 92, 246, 0.25)',
    badgeBg: 'rgba(139, 92, 246, 0.12)',
    x: COL_X[4],
    width: NODE_WIDTH,
  },
  {
    id: 'governance',
    stageNum: 'STAGE 06',
    pdcaPhase: 'CHECK',
    isoClauseRange: 'ISO Cl. 7.2 • 9.2 • 9.3 • 10.3',
    title: 'Audit & ISO',
    subtitle: 'Cl. 9.2 & 10.3',
    color: '#EC4899',
    glowColor: 'rgba(236, 72, 153, 0.25)',
    badgeBg: 'rgba(236, 72, 153, 0.12)',
    x: COL_X[5],
    width: NODE_WIDTH,
  },
];

// ============================================================================
// 24 ULTRA-CLEAN ISO 9001:2015 MODULES (Single-Line Badges, Zero Wrapping)
// ============================================================================

const NODES: EcosystemNode[] = [
  // ---------------- STAGE 01: PLAN & DESIGN ----------------
  {
    id: 'master-data',
    seqCode: 'M-01',
    isoClause: 'ISO 4.4 / 7.5',
    title: 'Master Data',
    shortName: 'Master',
    conceptTagline: 'Parts, BOM & Defect Catalog',
    phaseId: 'foundation',
    path: '/quality/master-data',
    icon: Database,
    x: COL_X[0],
    y: ROW_Y[0],
    colIdx: 0,
    rowIdx: 0,
    kpiValue: '100%',
    healthScore: 99,
    health: 'optimal',
  },
  {
    id: 'fmea',
    seqCode: 'M-02',
    isoClause: 'ISO 6.1',
    title: 'PFMEA Risk',
    shortName: 'PFMEA',
    conceptTagline: 'Severity × Occurrence RPN',
    phaseId: 'foundation',
    path: '/fmea',
    icon: ShieldCheck,
    x: COL_X[0],
    y: ROW_Y[1],
    colIdx: 0,
    rowIdx: 1,
    kpiValue: 'RPN<80',
    healthScore: 96,
    health: 'optimal',
  },
  {
    id: 'control-plan',
    seqCode: 'M-03',
    isoClause: 'ISO 8.1',
    title: 'Control Plan',
    shortName: 'CtrlPlan',
    conceptTagline: 'CTQ Limits & Poka-Yoke',
    phaseId: 'foundation',
    path: '/control-plan',
    icon: FileSpreadsheet,
    x: COL_X[0],
    y: ROW_Y[2],
    colIdx: 0,
    rowIdx: 2,
    kpiValue: 'CTQ OK',
    healthScore: 98,
    health: 'optimal',
  },
  {
    id: 'change-control',
    seqCode: 'M-04',
    isoClause: 'ISO 8.5.6',
    title: 'Change Control',
    shortName: 'Change',
    conceptTagline: 'Controlled Process Changes',
    phaseId: 'foundation',
    path: '/change-control',
    icon: FolderKanban,
    x: COL_X[0],
    y: ROW_Y[3],
    colIdx: 0,
    rowIdx: 3,
    kpiValue: 'MOC',
    healthScore: 95,
    health: 'optimal',
  },

  // ---------------- STAGE 02: INBOUND & RESOURCES ----------------
  {
    id: 'suppliers',
    seqCode: 'M-05',
    isoClause: 'ISO 8.4.1',
    title: 'Supplier Score',
    shortName: 'Vendor',
    conceptTagline: 'Vendor PPM & Approved List',
    phaseId: 'inbound',
    path: '/supplier-quality',
    icon: Truck,
    x: COL_X[1],
    y: ROW_Y[0],
    colIdx: 1,
    rowIdx: 0,
    kpiValue: '96.8%',
    healthScore: 97,
    health: 'optimal',
  },
  {
    id: 'incoming-quality',
    seqCode: 'M-06',
    isoClause: 'ISO 8.4.2',
    title: 'Incoming QC',
    shortName: 'IQC',
    conceptTagline: 'Raw Material AQL Sampling',
    phaseId: 'inbound',
    path: '/inspection',
    icon: PackageCheck,
    x: COL_X[1],
    y: ROW_Y[1],
    colIdx: 1,
    rowIdx: 1,
    kpiValue: '98.4%',
    healthScore: 98,
    health: 'optimal',
  },
  {
    id: 'deviation',
    seqCode: 'M-07',
    isoClause: 'ISO 8.7.1b',
    title: 'Waiver Permit',
    shortName: 'Waiver',
    conceptTagline: 'Concession Authorization',
    phaseId: 'inbound',
    path: '/deviation',
    icon: FileWarning,
    x: COL_X[1],
    y: ROW_Y[2],
    colIdx: 1,
    rowIdx: 2,
    kpiValue: 'Active',
    healthScore: 91,
    health: 'active',
  },
  {
    id: 'calibration',
    seqCode: 'M-08',
    isoClause: 'ISO 7.1.5',
    title: 'MSA & Gauges',
    shortName: 'Gauges',
    conceptTagline: 'GR&R Study & Calibration',
    phaseId: 'inbound',
    path: '/calibration',
    icon: Wrench,
    x: COL_X[1],
    y: ROW_Y[3],
    colIdx: 1,
    rowIdx: 3,
    kpiValue: 'GRR 4%',
    healthScore: 99,
    health: 'optimal',
  },

  // ---------------- STAGE 03: SHOPFLOOR EXECUTION ----------------
  {
    id: 'iot-dashboard',
    seqCode: 'M-09',
    isoClause: 'ISO 8.5.1f',
    title: 'IoT Telemetry',
    shortName: 'IoT',
    conceptTagline: 'Live Machine PLC Sensors',
    phaseId: 'inprocess',
    path: '/iot',
    icon: Cpu,
    x: COL_X[2],
    y: ROW_Y[0],
    colIdx: 2,
    rowIdx: 0,
    kpiValue: '50ms',
    healthScore: 98,
    health: 'active',
  },
  {
    id: 'in-process-quality',
    seqCode: 'M-10',
    isoClause: 'ISO 8.5.1',
    title: 'In-Process QC',
    shortName: 'IPQC',
    conceptTagline: 'First-Piece & Patrol Check',
    phaseId: 'inprocess',
    path: '/quality-shopfloor',
    icon: Activity,
    x: COL_X[2],
    y: ROW_Y[1],
    colIdx: 2,
    rowIdx: 1,
    kpiValue: '99.1%',
    healthScore: 99,
    health: 'optimal',
  },
  {
    id: 'spc',
    seqCode: 'M-11',
    isoClause: 'ISO 9.1.1',
    title: 'SPC Control',
    shortName: 'SPC',
    conceptTagline: 'X-Bar/R & Six Sigma Cpk',
    phaseId: 'inprocess',
    path: '/spc',
    icon: Sliders,
    x: COL_X[2],
    y: ROW_Y[2],
    colIdx: 2,
    rowIdx: 2,
    kpiValue: 'Cpk 1.67',
    healthScore: 97,
    health: 'optimal',
  },
  {
    id: 'process-ppm',
    seqCode: 'M-12',
    isoClause: 'ISO 9.1.3',
    title: 'Process OEE',
    shortName: 'PPM',
    conceptTagline: 'Line Yield & Defect PPM',
    phaseId: 'inprocess',
    path: '/process-ppm',
    icon: Zap,
    x: COL_X[2],
    y: ROW_Y[3],
    colIdx: 2,
    rowIdx: 3,
    kpiValue: '142 PPM',
    healthScore: 95,
    health: 'optimal',
  },

  // ---------------- STAGE 04: NONCONFORMANCE & CAPA ----------------
  {
    id: 'ncr',
    seqCode: 'M-13',
    isoClause: 'ISO 8.7',
    title: 'NCR Quarantine',
    shortName: 'NCR',
    conceptTagline: 'Suspect Batch Hold & MRB',
    phaseId: 'containment',
    path: '/ncr',
    icon: AlertOctagon,
    x: COL_X[3],
    y: ROW_Y[0],
    colIdx: 3,
    rowIdx: 0,
    kpiValue: 'Hold',
    healthScore: 92,
    health: 'warning',
  },
  {
    id: 'problem-solving',
    seqCode: 'M-14',
    isoClause: 'ISO 10.2.1b',
    title: '8D Root Cause',
    shortName: '8D',
    conceptTagline: '5-Why & Fishbone Analysis',
    phaseId: 'containment',
    path: '/8d',
    icon: GitBranch,
    x: COL_X[3],
    y: ROW_Y[1],
    colIdx: 3,
    rowIdx: 1,
    kpiValue: 'D1➔D8',
    healthScore: 96,
    health: 'optimal',
  },
  {
    id: 'defect-log',
    seqCode: 'M-15',
    isoClause: 'ISO 8.7 / 10.2',
    title: 'Defect Log',
    shortName: 'Defect',
    conceptTagline: 'Logged Defects & Escalation',
    phaseId: 'containment',
    path: '/defect-log',
    icon: Bug,
    x: COL_X[3],
    y: ROW_Y[2],
    colIdx: 3,
    rowIdx: 2,
    kpiValue: 'Live',
    healthScore: 95,
    health: 'optimal',
  },
  {
    id: 'action-plans',
    seqCode: 'M-16',
    isoClause: 'ISO 10.2.1c',
    title: 'CAPA Tracker',
    shortName: 'CAPA',
    conceptTagline: 'Preventive Tasks & SLA',
    phaseId: 'containment',
    path: '/capa',
    icon: CheckSquare,
    x: COL_X[3],
    y: ROW_Y[3],
    colIdx: 3,
    rowIdx: 3,
    kpiValue: '97.2%',
    healthScore: 97,
    health: 'optimal',
  },

  // ---------------- STAGE 05: RELEASE & CUSTOMER ----------------
  {
    id: 'outgoing-quality',
    seqCode: 'M-17',
    isoClause: 'ISO 8.6',
    title: 'Final QC & CoA',
    shortName: 'FQC',
    conceptTagline: 'Shipment Release & CoA',
    phaseId: 'outbound',
    path: '/outgoing-quality',
    icon: FileCheck,
    x: COL_X[4],
    y: ROW_Y[0],
    colIdx: 4,
    rowIdx: 0,
    kpiValue: '0 Esc',
    healthScore: 99,
    health: 'optimal',
  },
  {
    id: 'complaints',
    seqCode: 'M-18',
    isoClause: 'ISO 8.2.1',
    title: 'Customer RMA',
    shortName: 'RMA',
    conceptTagline: 'Field Claims & 24h Alert',
    phaseId: 'outbound',
    path: '/complaints',
    icon: MessageSquareWarning,
    x: COL_X[4],
    y: ROW_Y[1],
    colIdx: 4,
    rowIdx: 1,
    kpiValue: '24h SLA',
    healthScore: 94,
    health: 'active',
  },
  {
    id: 'defect-cost',
    seqCode: 'M-19',
    isoClause: 'ISO 9.1.3',
    title: 'COPQ Finance',
    shortName: 'COPQ',
    conceptTagline: 'Scrap, Rework & Claim Cost',
    phaseId: 'outbound',
    path: '/defect-cost',
    icon: DollarSign,
    x: COL_X[4],
    y: ROW_Y[2],
    colIdx: 4,
    rowIdx: 2,
    kpiValue: '1.15%',
    healthScore: 96,
    health: 'optimal',
  },
  {
    id: 'traceability',
    seqCode: 'M-20',
    isoClause: 'ISO 8.5.2',
    title: 'Traceability',
    shortName: 'Trace',
    conceptTagline: 'Lot Genealogy & Recall Scope',
    phaseId: 'outbound',
    path: '/traceability-tower',
    icon: Layers,
    x: COL_X[4],
    y: ROW_Y[3],
    colIdx: 4,
    rowIdx: 3,
    kpiValue: 'Lot ID',
    healthScore: 98,
    health: 'optimal',
  },

  // ---------------- STAGE 06: GOVERNANCE, AUDIT & CI ----------------
  {
    id: 'audits',
    seqCode: 'M-21',
    isoClause: 'ISO 9.2',
    title: 'ISO Audits',
    shortName: 'Audits',
    conceptTagline: 'IATF 16949 & Layered LPA',
    phaseId: 'governance',
    path: '/audit',
    icon: ClipboardCheck,
    x: COL_X[5],
    y: ROW_Y[0],
    colIdx: 5,
    rowIdx: 0,
    kpiValue: '98.9%',
    healthScore: 99,
    health: 'optimal',
  },
  {
    id: 'iso-compliance',
    seqCode: 'M-22',
    isoClause: 'ISO 9.3',
    title: 'ISO Governance',
    shortName: 'ISO9001',
    conceptTagline: 'Clause 4-10 & Mgmt Review',
    phaseId: 'governance',
    path: '/compliance/hub',
    icon: Scale,
    x: COL_X[5],
    y: ROW_Y[1],
    colIdx: 5,
    rowIdx: 1,
    kpiValue: '100%',
    healthScore: 100,
    health: 'optimal',
  },
  {
    id: 'layered-audits',
    seqCode: 'M-23',
    isoClause: 'ISO 9.2',
    title: 'Layered Audits',
    shortName: 'LPA',
    conceptTagline: 'Process Audits on the Floor',
    phaseId: 'governance',
    path: '/quality/layered-audits',
    icon: ClipboardCheck,
    x: COL_X[5],
    y: ROW_Y[2],
    colIdx: 5,
    rowIdx: 2,
    kpiValue: 'LPA',
    healthScore: 99,
    health: 'optimal',
  },
  {
    id: 'ai-copilot',
    seqCode: 'M-24',
    isoClause: 'ISO 10.3',
    title: 'AI Copilot',
    shortName: 'AI',
    conceptTagline: 'Continual Improvement AI',
    phaseId: 'governance',
    path: '/ai',
    icon: Bot,
    x: COL_X[5],
    y: ROW_Y[3],
    colIdx: 5,
    rowIdx: 3,
    kpiValue: 'AI 4.0',
    healthScore: 100,
    health: 'active',
  },
];

// ============================================================================
// 42 ISO 9001:2015 VERIFIED RELATIONSHIPS
// ============================================================================

const CABLES: CableRelation[] = [
  // ================= STAGE 01: PLAN & DESIGN =================
  {
    id: 'c-md-fmea',
    source: 'master-data',
    target: 'fmea',
    orderFromSource: 1,
    isoTransition: 'Cl. 4.4 ➔ Cl. 6.1',
    shortTag: 'Defect Catalog',
    label: '1st (ISO Cl. 6.1): Master Data feeds Standard Defect Modes & Severity Tables into PFMEA Risk Analysis',
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
    isoTransition: 'Cl. 7.5 ➔ Cl. 8.4.2',
    shortTag: 'Send AQL Specs',
    label: '2nd (ISO Cl. 8.4.2): Master Data provisions Raw Material Drawings & AQL Plans to Incoming QC',
    payloadSpec: 'PartSpecs • AQL_Table_ISO2859',
    color: '#0EA5E9',
    corridorTrack: -1,
  },
  {
    id: 'c-md-ipqc',
    source: 'master-data',
    target: 'in-process-quality',
    orderFromSource: 3,
    isoTransition: 'Cl. 7.5 ➔ Cl. 8.5.1',
    shortTag: 'Sync Routing BOM',
    label: '3rd (ISO Cl. 8.5.1): Master Data syncs Production Routing & Work Center CTQs to In-Process QC',
    payloadSpec: 'RoutingSteps[] • LineWorkCenters',
    color: '#0EA5E9',
    corridorTrack: 0,
  },
  {
    id: 'c-fmea-cp',
    source: 'fmea',
    target: 'control-plan',
    orderFromSource: 1,
    isoTransition: 'Cl. 6.1 ➔ Cl. 8.1',
    shortTag: 'Lock High-RPN CTQs',
    label: '1st (ISO Cl. 6.1 ➔ 8.1): PFMEA transfers Critical Failure Modes & High-RPN Risks into Control Plan',
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
    isoTransition: 'Cl. 8.1 ➔ Cl. 8.4.2',
    shortTag: 'Deploy IQC Plan',
    label: '1st (ISO Cl. 8.1 ➔ 8.4.2): Control Plan deploys Incoming Inspection Checklists & Tolerances to IQC',
    payloadSpec: 'IQC_Checkpoints[] • LSL_USL',
    color: '#06B6D4',
    isPrimaryBackbone: true,
    backboneStep: 3,
    corridorTrack: 1,
  },
  {
    id: 'c-cp-apqp',
    source: 'change-control',
    target: 'control-plan',
    orderFromSource: 1,
    isoTransition: 'Cl. 8.5.6 ➔ Cl. 8.1',
    shortTag: 'Revise Control Plan',
    label: '1st (ISO Cl. 8.5.6): an approved Change Control revises the Control Plan before production resumes',
    payloadSpec: 'ChangeRecord • ControlPlan_Rev',
    color: '#0EA5E9',
    corridorTrack: 2,
  },
  {
    id: 'c-cp-spc',
    source: 'control-plan',
    target: 'spc',
    orderFromSource: 3,
    isoTransition: 'Cl. 8.1 ➔ Cl. 9.1.1',
    shortTag: 'Set LSL/USL Limits',
    label: '3rd (ISO Cl. 9.1.1): Control Plan configures X-Bar/R Chart LSL, USL & Target Nominal in SPC',
    payloadSpec: 'CTQ_Specs { LSL, Nominal, USL }',
    color: '#10B981',
    corridorTrack: -2,
  },
  {
    id: 'c-apqp-ipqc',
    source: 'change-control',
    target: 'in-process-quality',
    orderFromSource: 3,
    isoTransition: 'Cl. 8.5.6 ➔ Cl. 8.5.1',
    shortTag: 'Release Approved Change',
    label: '3rd (ISO Cl. 8.5.6): approved changes are released to the shopfloor under IPQC verification',
    payloadSpec: 'ApprovedChange • EffectiveDate',
    color: '#10B981',
    corridorTrack: 2,
  },

  // ================= STAGE 02: INBOUND & MSA =================
  {
    id: 'c-sup-iqc',
    source: 'suppliers',
    target: 'incoming-quality',
    orderFromSource: 1,
    isoTransition: 'Cl. 8.4.1 ➔ Cl. 8.4.2',
    shortTag: 'Set AQL Tightness',
    label: '1st (ISO Cl. 8.4): Supplier Score dynamically adjusts IQC Sampling Level (Normal / Tightened / Reduced)',
    payloadSpec: 'VendorRating • DynamicSwitchingRule',
    color: '#06B6D4',
    corridorTrack: -2,
  },
  {
    id: 'c-iqc-ipqc',
    source: 'incoming-quality',
    target: 'in-process-quality',
    orderFromSource: 1,
    isoTransition: 'Cl. 8.4.2 ➔ Cl. 8.5.1',
    shortTag: 'Release Good Lot',
    label: '1st (ISO Cl. 8.4 ➔ 8.5.1): Incoming QC releases verified Raw Material Batches to Shopfloor IPQC',
    payloadSpec: 'MaterialReleaseTag • LotTraceabilityID',
    color: '#10B981',
    isPrimaryBackbone: true,
    backboneStep: 4,
    corridorTrack: -1,
  },
  {
    id: 'c-iqc-ncr',
    source: 'incoming-quality',
    target: 'ncr',
    orderFromSource: 2,
    isoTransition: 'Cl. 8.4.2 ➔ Cl. 8.7',
    shortTag: 'Reject Lot to NCR',
    label: '2nd (ISO Cl. 8.7): Incoming QC quarantines nonconforming supplier lots and raises Supplier NCR',
    payloadSpec: 'SupplierNCR • QuarantineHoldTag',
    color: '#F59E0B',
    corridorTrack: 0,
  },
  {
    id: 'c-iqc-dev',
    source: 'incoming-quality',
    target: 'deviation',
    orderFromSource: 3,
    isoTransition: 'Cl. 8.4.2 ➔ Cl. 8.7.1b',
    shortTag: 'Request Concession',
    label: '3rd (ISO Cl. 8.7.1b): Incoming QC requests Concession / Waiver Permit for minor deviations',
    payloadSpec: 'ConcessionRequest • RiskSignoff',
    color: '#06B6D4',
    corridorTrack: 1,
  },
  {
    id: 'c-dev-ipqc',
    source: 'deviation',
    target: 'in-process-quality',
    orderFromSource: 1,
    isoTransition: 'Cl. 8.7.1b ➔ Cl. 8.5.1',
    shortTag: 'Authorize Line Use',
    label: '1st (ISO Cl. 8.7.1b): Approved Concession authorizes batch usage under special IPQC monitoring',
    payloadSpec: 'ConditionalPermit • MaxQtyLimit',
    color: '#06B6D4',
    corridorTrack: 2,
  },
  {
    id: 'c-cal-ipqc',
    source: 'calibration',
    target: 'in-process-quality',
    orderFromSource: 1,
    isoTransition: 'Cl. 7.1.5 ➔ Cl. 8.5.1',
    shortTag: 'Certify Line Gauges',
    label: '1st (ISO Cl. 7.1.5): MSA & Calibration certifies active gauges and blocks expired tools in IPQC',
    payloadSpec: 'GaugeCertStatus • GRR_Valid_Flag',
    color: '#06B6D4',
    corridorTrack: -2,
  },
  {
    id: 'c-cal-spc',
    source: 'calibration',
    target: 'spc',
    orderFromSource: 2,
    isoTransition: 'Cl. 7.1.5 ➔ Cl. 9.1.1',
    shortTag: 'Validate GR&R < 10%',
    label: '2nd (ISO Cl. 7.1.5): MSA validates measurement precision (GR&R < 10%) for SPC capability charts',
    payloadSpec: 'MSA_Variance • NDC_Score',
    color: '#10B981',
    corridorTrack: -1,
  },

  // ================= STAGE 03: SHOPFLOOR EXECUTION =================
  {
    id: 'c-iot-spc',
    source: 'iot-dashboard',
    target: 'spc',
    orderFromSource: 1,
    isoTransition: 'Cl. 8.5.1 ➔ Cl. 9.1.1',
    shortTag: 'Stream Telemetry',
    label: '1st (ISO Cl. 9.1.1): IoT Telemetry streams real-time machine parameters into SPC Control Charts',
    payloadSpec: 'MQTT_Subgroup_Stream • 50ms_Telemetry',
    color: '#10B981',
    corridorTrack: 1,
  },
  {
    id: 'c-iot-ipqc',
    source: 'iot-dashboard',
    target: 'in-process-quality',
    orderFromSource: 2,
    isoTransition: 'Cl. 8.5.1f ➔ Cl. 8.5.1',
    shortTag: 'Trigger Patrol Check',
    label: '2nd (ISO Cl. 8.5.1): IoT sensor anomaly triggers immediate Shopfloor IPQC patrol verification',
    payloadSpec: 'MachineAlarmEvent • StationID',
    color: '#10B981',
    corridorTrack: -2,
  },
  {
    id: 'c-ipqc-fqc',
    source: 'in-process-quality',
    target: 'outgoing-quality',
    orderFromSource: 1,
    isoTransition: 'Cl. 8.5.1 ➔ Cl. 8.6',
    shortTag: 'Pass Batch to FQC',
    label: '1st (ISO Cl. 8.5.1 ➔ 8.6): In-Process QC passes conforming lots forward to Final QC Release (FQC)',
    payloadSpec: 'InProcessPassCert • RoutingComplete',
    color: '#10B981',
    isPrimaryBackbone: true,
    backboneStep: 5,
    corridorTrack: -2,
  },
  {
    id: 'c-ipqc-spc',
    source: 'in-process-quality',
    target: 'spc',
    orderFromSource: 2,
    isoTransition: 'Cl. 8.5.1 ➔ Cl. 9.1.1',
    shortTag: 'Log Subgroup Data',
    label: '2nd (ISO Cl. 9.1.1): In-Process QC logs dimensional subgroup measurements into SPC X-Bar/R engine',
    payloadSpec: 'SubgroupSample[n=5] • OperatorID',
    color: '#10B981',
    corridorTrack: 0,
  },
  {
    id: 'c-ipqc-ncr',
    source: 'in-process-quality',
    target: 'defect-log',
    orderFromSource: 4,
    isoTransition: 'Cl. 8.5.1 ➔ Cl. 8.7',
    shortTag: 'Log Line Defect',
    label: '4th (ISO Cl. 8.7): In-Process QC logs a nonconforming output as a Defect record',
    payloadSpec: 'DefectEntry • StationID',
    color: '#F59E0B',
    corridorTrack: -1,
  },
  {
    id: 'c-spc-ncr',
    source: 'spc',
    target: 'defect-log',
    orderFromSource: 1,
    isoTransition: 'Cl. 9.1.1 ➔ Cl. 8.7',
    shortTag: 'Log OOC Defect',
    label: '1st (ISO Cl. 9.1.1 ➔ 8.7): an out-of-control SPC signal is logged as a Defect for review',
    payloadSpec: 'NelsonRuleViolation • Cpk_Drop',
    color: '#F59E0B',
    corridorTrack: 0,
  },
  {
    id: 'c-spc-ppm',
    source: 'spc',
    target: 'process-ppm',
    orderFromSource: 2,
    isoTransition: 'Cl. 9.1.1 ➔ Cl. 9.1.3',
    shortTag: 'Compute Sigma PPM',
    label: '2nd (ISO Cl. 9.1.3): SPC feeds process capability & defect probability into Process PPM & OEE',
    payloadSpec: 'SigmaLevel • PredictedPPM',
    color: '#10B981',
    corridorTrack: 2,
  },
  {
    id: 'c-ppm-copq',
    source: 'process-ppm',
    target: 'defect-cost',
    orderFromSource: 1,
    isoTransition: 'Cl. 9.1.3 ➔ COPQ',
    shortTag: 'Report Yield Loss',
    label: '1st (ISO Cl. 9.1.3): Process PPM reports scrap rate and yield loss to COPQ Financial Ledger',
    payloadSpec: 'PPM_ScrapVolume • OEE_LossHours',
    color: '#8B5CF6',
    corridorTrack: 1,
  },

  // ================= STAGE 04: NONCONFORMANCE & CAPA =================
  {
    id: 'c-ncr-8d',
    source: 'ncr',
    target: 'problem-solving',
    orderFromSource: 1,
    isoTransition: 'Cl. 8.7 ➔ Cl. 10.2.1b',
    shortTag: 'Launch 8D CAPA',
    label: '1st (ISO Cl. 10.2.1b): NCR Quarantine escalates nonconformities to 8D Root Cause Analysis',
    payloadSpec: 'NCR_Dossier • Containment Lot ID',
    color: '#F59E0B',
    isPrimaryBackbone: true,
    backboneStep: 7,
    corridorTrack: -2,
  },
  {
    id: 'c-ncr-rwk',
    source: 'ncr',
    target: 'deviation',
    orderFromSource: 2,
    isoTransition: '↺ Cl. 8.7.1b ➔ Cl. 8.4.2',
    shortTag: '↺ Use-As-Is Waiver',
    label: '2nd (Return ↺ • ISO Cl. 8.7.1b): MRB use-as-is disposition issues a Deviation / Waiver permit',
    payloadSpec: 'MRB_Disposition=USE_AS_IS • WaiverRequest',
    color: '#F43F5E',
    isFeedback: true,
    highwayLane: 2,
    corridorTrack: 2,
  },
  {
    id: 'c-ncr-copq',
    source: 'ncr',
    target: 'defect-cost',
    orderFromSource: 3,
    isoTransition: 'Cl. 8.7 ➔ Cl. 9.1.3',
    shortTag: 'Post Scrap Cost',
    label: '3rd (ISO Cl. 9.1.3): NCR posts scrap & quarantine holding costs directly to COPQ Finance',
    payloadSpec: 'ScrapQty × UnitCost • HoldCost',
    color: '#8B5CF6',
    corridorTrack: -1,
  },
  {
    id: 'c-ncr-sup-fb',
    source: 'ncr',
    target: 'suppliers',
    orderFromSource: 4,
    isoTransition: '↺ Cl. 8.7 ➔ Cl. 8.4.1',
    shortTag: '↺ Penalize Vendor',
    label: '4th (Return Loop ↺ • ISO Cl. 8.4.1): Supplier NCR deducts Vendor Score and issues SCAR',
    payloadSpec: 'SCAR_Notice • ScoreDeduction_PPM',
    color: '#F43F5E',
    isFeedback: true,
    corridorTrack: 2,
    highwayLane: 0,
  },
  {
    id: 'c-rwk-fqc',
    source: 'defect-log',
    target: 'ncr',
    orderFromSource: 1,
    isoTransition: 'Cl. 8.7 ➔ Cl. 8.7',
    shortTag: 'Elevate to NCR',
    label: '1st (System: elevate-ncr): a reviewed Defect is elevated to an NCR',
    payloadSpec: 'DefectRecord • relatedNcrId',
    color: '#F59E0B',
    corridorTrack: -1,
  },
  {
    id: 'c-8d-act',
    source: 'problem-solving',
    target: 'action-plans',
    orderFromSource: 1,
    isoTransition: 'Cl. 10.2.1b ➔ 10.2.1c',
    shortTag: 'Assign D5/D6 CAPA',
    label: '1st (ISO Cl. 10.2.1c/d): 8D Root Cause assigns Corrective Actions & Effectiveness Checks to CAPA Tracker',
    payloadSpec: 'CAPA_Tasks[] • Owner_SLA_Dates',
    color: '#F59E0B',
    isPrimaryBackbone: true,
    backboneStep: 8,
    corridorTrack: 2,
  },
  {
    id: 'c-8d-fmea-fb',
    source: 'problem-solving',
    target: 'fmea',
    orderFromSource: 2,
    isoTransition: '↺ Cl. 10.2.1e ➔ Cl. 6.1',
    shortTag: '↺ Update PFMEA RPN',
    label: '2nd (Return Loop ↺ • ISO Cl. 10.2.1e): 8D updates PFMEA Risks & Opportunities determined during planning',
    payloadSpec: 'UpdatedRPN • NewFailureMechanism',
    color: '#F43F5E',
    isFeedback: true,
    isPrimaryBackbone: true,
    backboneStep: 9,
    corridorTrack: -2,
    highwayLane: 1,
  },
  {
    id: 'c-act-cp-fb',
    source: 'action-plans',
    target: 'control-plan',
    orderFromSource: 1,
    isoTransition: '↺ Cl. 10.2.1f ➔ Cl. 8.1',
    shortTag: '↺ Harden Ctrl Plan',
    label: '1st (Return Loop ↺ • ISO Cl. 10.2.1f): Verified CAPA updates Control Plan with tighter Poka-Yoke & CTQs',
    payloadSpec: 'ControlPlan_RevUp • NewPokaYoke',
    color: '#F43F5E',
    isFeedback: true,
    isPrimaryBackbone: true,
    backboneStep: 10,
    corridorTrack: -1,
    highwayLane: 0,
  },
  {
    id: 'c-act-trn',
    source: 'action-plans',
    target: 'layered-audits',
    orderFromSource: 2,
    isoTransition: 'Cl. 10.2.1d ➔ Cl. 9.2',
    shortTag: 'Verify Effectiveness',
    label: '2nd (ISO Cl. 10.2.1d): CAPA effectiveness is verified through layered process audits',
    payloadSpec: 'CAPA_Effectiveness • AuditChecklist',
    color: '#EC4899',
    corridorTrack: 1,
  },

  // ================= STAGE 05: RELEASE & CUSTOMER =================
  {
    id: 'c-fqc-csat',
    source: 'outgoing-quality',
    target: 'traceability',
    orderFromSource: 1,
    isoTransition: 'Cl. 8.6 ➔ Cl. 8.5.2',
    shortTag: 'Record Lot Genealogy',
    label: '1st (ISO Cl. 8.5.2): Final QC release records lot genealogy for traceability',
    payloadSpec: 'LotGenealogy • CoA_ID',
    color: '#8B5CF6',
    corridorTrack: -2,
  },
  {
    id: 'c-fqc-ncr-fb',
    source: 'outgoing-quality',
    target: 'ncr',
    orderFromSource: 2,
    isoTransition: '↺ Cl. 8.6 ➔ Cl. 8.7',
    shortTag: '↺ Block Failed Lot',
    label: '2nd (Return Loop ↺ • ISO Cl. 8.6 ➔ 8.7): Final QC blocks nonconforming shipment lot and routes to NCR Quarantine',
    payloadSpec: 'FinalReleaseBlocked • ShipmentHoldNCR',
    color: '#F43F5E',
    isFeedback: true,
    corridorTrack: 1,
    highwayLane: 0,
  },
  {
    id: 'c-cmp-ncr-fb',
    source: 'complaints',
    target: 'ncr',
    orderFromSource: 1,
    isoTransition: '↺ Cl. 8.2.1 ➔ Cl. 8.7',
    shortTag: '↺ 24h Stock Hold',
    label: '1st (Return Loop ↺ • ISO Cl. 8.7): Customer RMA triggers immediate 24h D3 Containment Hold in NCR',
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
    isoTransition: '↺ Cl. 10.2.1a ➔ 10.2.1b',
    shortTag: '↺ Escalate RMA 8D',
    label: '2nd (Return Loop ↺ • ISO Cl. 10.2.1a): Customer Complaint initiates formal Customer 8D Investigation',
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
    isoTransition: 'Cl. 8.2.1 ➔ Cl. 9.1.3',
    shortTag: 'Log Warranty Claim',
    label: '3rd (ISO Cl. 9.1.3): Customer RMA logs External Failure Warranty & Chargeback Costs into COPQ',
    payloadSpec: 'WarrantyClaimUSD • LogisticsDebit',
    color: '#8B5CF6',
    corridorTrack: -1,
  },
  {
    id: 'c-cmp-csat',
    source: 'complaints',
    target: 'traceability',
    orderFromSource: 4,
    isoTransition: 'Cl. 8.2.1 ➔ Cl. 8.5.2',
    shortTag: 'Trace Affected Lots',
    label: '4th (ISO Cl. 8.5.2): a complaint is traced back to the affected lots',
    payloadSpec: 'ComplaintLot • FieldPPM',
    color: '#8B5CF6',
    corridorTrack: 1,
  },
  {
    id: 'c-copq-ai',
    source: 'defect-cost',
    target: 'ai-copilot',
    orderFromSource: 1,
    isoTransition: 'Cl. 9.1.3 ➔ Cl. 10.3',
    shortTag: 'Rank Financial Risk',
    label: '1st (ISO Cl. 9.1.3 ➔ 10.3): COPQ Finance feeds Pareto financial losses to AI Copilot for CI prioritization',
    payloadSpec: 'COPQ_ParetoMatrix • CostPerDefect',
    color: '#EC4899',
    corridorTrack: 0,
  },
  {
    id: 'c-csat-iso',
    source: 'traceability',
    target: 'ncr',
    orderFromSource: 1,
    isoTransition: '↺ Cl. 8.5.2 ➔ Cl. 8.7',
    shortTag: '↺ Scope Containment',
    label: '1st (Return ↺ • ISO Cl. 8.5.2): traced lots define the containment scope in NCR',
    payloadSpec: 'AffectedLots[] • RecallScope',
    color: '#F43F5E',
    isFeedback: true,
    highwayLane: 1,
    corridorTrack: 2,
  },

  // ================= STAGE 06: GOVERNANCE, AUDIT & CI =================
  {
    id: 'c-aud-act-fb',
    source: 'audits',
    target: 'action-plans',
    orderFromSource: 1,
    isoTransition: '↺ Cl. 9.2.2 ➔ Cl. 10.2',
    shortTag: '↺ Issue Audit CAPA',
    label: '1st (Return Loop ↺ • ISO Cl. 9.2.2d): ISO Audit findings trigger mandatory Corrective Actions in CAPA Tracker',
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
    isoTransition: 'Cl. 9.2 ➔ Cl. 9.3',
    shortTag: 'Report Audit Results',
    label: '2nd (ISO Cl. 9.2.2e): Internal & LPA Audits report compliance evidence to ISO 9001 Management Review',
    payloadSpec: 'ClauseEvidenceScore • AuditTrail',
    color: '#EC4899',
    corridorTrack: -2,
  },
  {
    id: 'c-iso-fmea-fb',
    source: 'iso-compliance',
    target: 'fmea',
    orderFromSource: 1,
    isoTransition: '↺ Cl. 9.3.3 ➔ Cl. 6.1',
    shortTag: '↺ Mgmt Review Risks',
    label: '1st (Return Loop ↺ • ISO Cl. 9.3.3): Management Review outputs mandate systemic risk updates in PFMEA',
    payloadSpec: 'MgmtReviewDirective • StrategicRiskUpdate',
    color: '#F43F5E',
    isFeedback: true,
    corridorTrack: -2,
    highwayLane: 1,
  },
  {
    id: 'c-trn-ipqc-fb',
    source: 'layered-audits',
    target: 'in-process-quality',
    orderFromSource: 1,
    isoTransition: '↺ Cl. 9.2 ➔ Cl. 8.5.1',
    shortTag: '↺ Audit Line Process',
    label: '1st (Return ↺ • ISO Cl. 9.2): layered audits check process discipline on IPQC lines',
    payloadSpec: 'LPA_Findings • StationAuth',
    color: '#10B981',
    isFeedback: true,
    highwayLane: 2,
    corridorTrack: 1,
  },
  {
    id: 'c-ai-8d-fb',
    source: 'ai-copilot',
    target: 'problem-solving',
    orderFromSource: 1,
    isoTransition: '↺ Cl. 10.3 ➔ Cl. 10.2',
    shortTag: '↺ AI Root Cause',
    label: '1st (Return Loop ↺ • ISO Cl. 10.3): AI Copilot synthesizes plant-wide data to predict & accelerate 8D Root Causes',
    payloadSpec: 'AI_5Why_Hypothesis • RiskPrediction',
    color: '#EC4899',
    isFeedback: true,
    corridorTrack: 0,
    highwayLane: 2,
  },
  {
    id: 'c-cc-fmea',
    source: 'change-control',
    target: 'fmea',
    orderFromSource: 2,
    isoTransition: 'Cl. 8.5.6 ➔ Cl. 6.1',
    shortTag: 'Re-assess Risk',
    label: '2nd (ISO Cl. 8.5.6 ➔ 6.1): a process change triggers a PFMEA risk re-assessment',
    payloadSpec: 'ChangeImpact • RPN_Review',
    color: '#0EA5E9',
    corridorTrack: -2,
  },
  {
    id: 'c-dfl-capa',
    source: 'defect-log',
    target: 'action-plans',
    orderFromSource: 2,
    isoTransition: 'Cl. 8.7 ➔ Cl. 10.2',
    shortTag: 'Create CAPA',
    label: '2nd (System: create-capa): a Defect under investigation spawns a CAPA',
    payloadSpec: 'DefectRecord • relatedCapaId',
    color: '#F59E0B',
    corridorTrack: 2,
  },
  {
    id: 'c-dfl-fmea',
    source: 'defect-log',
    target: 'fmea',
    orderFromSource: 3,
    isoTransition: '↺ Cl. 8.7 ➔ Cl. 6.1',
    shortTag: '↺ Feed Defect Data',
    label: '3rd (Return ↺ • System: defect-FMEA integration): defect history feeds PFMEA occurrence ratings',
    payloadSpec: 'DefectFrequency • Occurrence',
    color: '#F43F5E',
    isFeedback: true,
    highwayLane: 0,
    corridorTrack: 0,
  },
  {
    id: 'c-capa-cc',
    source: 'action-plans',
    target: 'change-control',
    orderFromSource: 3,
    isoTransition: '↺ Cl. 10.2.1e ➔ Cl. 8.5.6',
    shortTag: '↺ Trigger Change',
    label: '3rd (Return ↺ • ISO Cl. 10.2.1e): a verified CAPA that needs a process change raises a Change Control',
    payloadSpec: 'CAPA_ChangeRequest',
    color: '#F43F5E',
    isFeedback: true,
    highwayLane: 1,
    corridorTrack: 1,
  },
];

// ============================================================================
// 10-STEP ISO 9001:2015 PDCA MASTER BACKBONE (PLAN ➔ DO ➔ CHECK ➔ ACT)
// ============================================================================

const MASTER_BACKBONE_SEQUENCE: string[] = [
  'c-md-fmea',
  'c-fmea-cp',
  'c-cp-iqc',
  'c-iqc-ipqc',
  'c-ipqc-fqc',
  'c-ipqc-ncr',
  'c-rwk-fqc',
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
    title: 'ISO Cl. 8.7 NCR ➔ Cl. 10.2 8D ➔ Cl. 6.1/8.1 Return Loop',
    shortTitle: 'NCR ➔ 8D ➔ Return',
    color: '#F59E0B',
    cableSequence: [
      'c-ipqc-ncr',
      'c-ncr-8d',
      'c-8d-act',
      'c-8d-fmea-fb',
      'c-act-cp-fb',
      'c-cp-iqc',
    ],
  },
  spc_drift: {
    title: 'ISO Cl. 9.1.1 SPC Drift ➔ Cl. 8.7 NCR ➔ Cl. 7.2 Operator Retraining',
    shortTitle: 'SPC Drift ➔ Return',
    color: '#10B981',
    cableSequence: [
      'c-iot-spc',
      'c-spc-ncr',
      'c-ncr-8d',
      'c-8d-act',
      'c-act-trn',
      'c-trn-ipqc-fb',
    ],
  },
  customer_complaint: {
    title: 'ISO Cl. 8.2.1 RMA ➔ Cl. 8.7 Hold ➔ Cl. 10.2 8D ➔ Cl. 9.3 Mgmt Review',
    shortTitle: 'RMA ➔ 8D ➔ Return',
    color: '#F43F5E',
    cableSequence: [
      'c-cmp-ncr-fb',
      'c-cmp-8d-fb',
      'c-8d-act',
      'c-act-cp-fb',
      'c-cmp-csat',
      'c-csat-iso',
    ],
  },
  full_factory_pulse: {
    title: 'ISO 9001:2015 Complete PDCA Closed-Loop Lifecycle (Clauses 4 ➔ 10)',
    shortTitle: 'ISO PDCA Loop',
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
  const [multiHopRipple, setMultiHopRipple] = useState<boolean>(false);
  const [cinemaCamera, setCinemaCamera] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Simulation Engine State
  const [activeSimulation, setActiveSimulation] = useState<SimulationScenarioId>('none');
  const [simStepIndex, setSimStepIndex] = useState<number | null>(null);

  const activeNodeId = hoveredNodeId || selectedNodeId;

  // Auto-Fit Matrix to Viewport
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

  // Cinema Camera focus on a specific Cable
  const focusCameraOnCable = useCallback((cableId: string) => {
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
  }, []);

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
  // SEQUENCE & RELATIONSHIP ENGINE (ZERO CLUTTER, INTERNAL CARD PILLS)
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
        pillText: string;
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
          pillText: cable.isFeedback
            ? `↺${cable.orderFromSource}`
            : `${cable.orderFromSource}➔`,
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
          const padded = stepNum < 10 ? `0${stepNum}` : `${stepNum}`;
          map.set(cable.id, {
            pillText: cable.isFeedback ? `↺${padded}` : `${padded}`,
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
            pillText: '1st',
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
            pillText: `↺#${idx + 1}`,
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
          pillText: cable.isFeedback
            ? `↺#${cable.orderFromSource}`
            : `${getOrdinalLabel(cable.orderFromSource)}`,
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
        const padded = stepNum < 10 ? `0${stepNum}` : `${stepNum}`;
        map.set(cableId, {
          pillText: cable.isFeedback ? `↺${padded}` : `${padded}`,
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
          pillText: cable.isFeedback ? `↺IN` : `IN${idx + 1}`,
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
          pillText: cable.isFeedback ? `↺${ord}` : `${ord}`,
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
                pillText: `H2`,
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

  // Internal Card Header Role Badge (Replaces KPI badge inside Row 1 — ZERO external floating clutter!)
  const nodeInternalRoleBadges = useMemo(() => {
    const badgeMap = new Map<
      string,
      { text: string; color: string; isFeedback?: boolean; isPulseSpotlight?: boolean }
    >();

    if (focusedStageId && !activeNodeId && !selectedCableId && activeSimulation === 'none') {
      const stagePhase = PHASES.find((p) => p.id === focusedStageId);
      NODES.filter((n) => n.phaseId === focusedStageId).forEach((n) => {
        badgeMap.set(n.id, {
          text: `${stagePhase?.pdcaPhase}`,
          color: stagePhase?.color || '#38BDF8',
          isPulseSpotlight: true,
        });
      });
      activeCableSequenceMap.forEach((meta, cableId) => {
        const c = CABLES.find((item) => item.id === cableId);
        if (!c) return;
        if (!badgeMap.has(c.source)) {
          badgeMap.set(c.source, { text: `IN ➔`, color: meta.badgeColor });
        }
        if (!badgeMap.has(c.target)) {
          badgeMap.set(c.target, { text: `➔ OUT`, color: meta.badgeColor });
        }
      });
      return badgeMap;
    }

    if (isIdleLensActive) {
      if (viewLens === 'backbone') {
        MASTER_BACKBONE_SEQUENCE.forEach((cableId, idx) => {
          const cable = CABLES.find((c) => c.id === cableId);
          if (!cable) return;
          if (idx === 0) {
            badgeMap.set(cable.source, { text: 'STEP 00', color: '#10B981' });
          }
          const stepNum = idx + 1;
          const padded = stepNum < 10 ? `0${stepNum}` : `${stepNum}`;
          if (!badgeMap.has(cable.target) || !cable.isFeedback) {
            badgeMap.set(cable.target, {
              text: cable.isFeedback ? `↺ STEP ${padded}` : `STEP ${padded}`,
              color: cable.isFeedback ? '#F43F5E' : cable.color,
              isFeedback: cable.isFeedback,
            });
          }
        });
        return badgeMap;
      }

      if (viewLens === 'feedback_bus') {
        CABLES.filter((c) => c.isFeedback).forEach((cable, idx) => {
          badgeMap.set(cable.source, {
            text: `↺ SRC #${idx + 1}`,
            color: '#F43F5E',
            isFeedback: true,
          });
          badgeMap.set(cable.target, {
            text: `↺ TGT #${idx + 1}`,
            color: '#F59E0B',
            isFeedback: true,
          });
        });
        return badgeMap;
      }
      return badgeMap;
    }

    if (selectedCableId && !activeNodeId && activeSimulation === 'none') {
      const cable = CABLES.find((c) => c.id === selectedCableId);
      if (cable) {
        badgeMap.set(cable.source, {
          text: `SOURCE`,
          color: '#38BDF8',
          isPulseSpotlight: true,
        });
        badgeMap.set(cable.target, {
          text: cable.isFeedback ? `↺ TARGET` : `STEP #${cable.orderFromSource}`,
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
            text: 'START 00',
            color: '#38BDF8',
            isPulseSpotlight: simStepIndex === 0,
          });
        }
        const isCurrent = simStepIndex === idx;
        const stepNum = idx + 1;
        const padded = stepNum < 10 ? `0${stepNum}` : `${stepNum}`;
        badgeMap.set(cable.target, {
          text: cable.isFeedback ? `↺ STEP ${padded}` : `STEP ${padded}`,
          color: cable.isFeedback ? '#F43F5E' : isCurrent ? '#10B981' : '#38BDF8',
          isFeedback: cable.isFeedback,
          isPulseSpotlight: isCurrent,
        });
      });
      return badgeMap;
    }

    if (activeNodeId) {
      badgeMap.set(activeNodeId, {
        text: `★ FOCUS`,
        color: '#38BDF8',
        isPulseSpotlight: true,
      });

      const incoming = CABLES.filter((c) => c.target === activeNodeId);
      incoming.forEach((cable, idx) => {
        badgeMap.set(cable.source, {
          text: cable.isFeedback ? `↺ IN #${idx + 1}` : `IN #${idx + 1}`,
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
          text: cable.isFeedback ? `↺ ${ordinalText}` : `${ordinalText} OUT`,
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
                text: `HOP 2`,
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
    nodeInternalRoleBadges.forEach((_, nodeId) => {
      const node = NODES.find((n) => n.id === nodeId);
      if (node) set.add(node.phaseId);
    });
    return set;
  }, [nodeInternalRoleBadges]);

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
        n.seqCode.toLowerCase().includes(q) ||
        n.isoClause.toLowerCase().includes(q)
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
  // SPACIOUS ORTHOGONAL PCB TRACE ENGINE (48px Wide Corridors + 28px Row Gaps)
  // =========================================================================
  const computeCableGeometry = useCallback((cable: CableRelation, indexOffset: number) => {
    const src = NODES.find((n) => n.id === cable.source);
    const tgt = NODES.find((n) => n.id === cable.target);
    if (!src || !tgt) return null;

    const isSameColumn = src.colIdx === tgt.colIdx;
    const colSpan = tgt.colIdx - src.colIdx;

    const outPinOffset = (cable.orderFromSource - 2) * 14;
    const inPinOffset = (src.rowIdx - tgt.rowIdx) * 4;

    // 1A. Adjacent-Row Same-Column Direct Vertical Bridge across the 28px Open Gap
    if (isSameColumn && Math.abs(src.rowIdx - tgt.rowIdx) === 1) {
      const goingDown = tgt.rowIdx > src.rowIdx;
      const xBridge = src.x + NODE_WIDTH / 2;
      const y1 = goingDown ? src.y + NODE_HEIGHT : src.y;
      const y2 = goingDown ? tgt.y : tgt.y + NODE_HEIGHT;
      const pathD = `M ${xBridge} ${y1} L ${xBridge} ${y2}`;
      const midX = xBridge;
      const midY = (y1 + y2) / 2;
      return { pathD, midX, midY, x1: xBridge, y1, x2: xBridge, y2, isHighway: false };
    }

    // 1B. Multi-Row Same-Column Local PCB Trace
    if (isSameColumn) {
      const x1 = src.x + NODE_WIDTH;
      const y1 = src.y + NODE_HEIGHT / 2 + outPinOffset * 0.4;
      const x2 = tgt.x + NODE_WIDTH;
      const y2 = tgt.y + NODE_HEIGHT / 2;
      const corridorCenter = src.colIdx < 5 ? x1 + 24 : x1 + 14;
      const laneX = corridorCenter + cable.corridorTrack * 5;
      const r = 8;
      const dirY = y2 > y1 ? 1 : -1;

      const pathD = [
        `M ${x1} ${y1}`,
        `L ${laneX - r} ${y1}`,
        `Q ${laneX} ${y1} ${laneX} ${y1 + dirY * r}`,
        `L ${laneX} ${y2 - dirY * r}`,
        `Q ${laneX} ${y2} ${laneX - r} ${y2}`,
        `L ${x2} ${y2}`,
      ].join(' ');

      const midX = laneX;
      const midY = (y1 + y2) / 2;
      return { pathD, midX, midY, x1, y1, x2, y2, isHighway: false };
    }

    // 2. Adjacent Column Orthogonal PCB Trace (colSpan === 1)
    if (colSpan === 1) {
      const x1 = src.x + NODE_WIDTH;
      const y1 = src.y + NODE_HEIGHT / 2 + outPinOffset;
      const x2 = tgt.x;
      const y2 = tgt.y + NODE_HEIGHT / 2 + inPinOffset;

      const corridorCenter = (x1 + x2) / 2;
      const laneX = corridorCenter + cable.corridorTrack * 6;

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
          isHighway: false,
        };
      }

      const r = 8;
      const dirY = y2 > y1 ? 1 : -1;
      const pathD = [
        `M ${x1} ${y1}`,
        `L ${laneX - r} ${y1}`,
        `Q ${laneX} ${y1} ${laneX} ${y1 + dirY * r}`,
        `L ${laneX} ${y2 - dirY * r}`,
        `Q ${laneX} ${y2} ${laneX + r} ${y2}`,
        `L ${x2} ${y2}`,
      ].join(' ');

      const midX = laneX;
      const midY = (y1 + y2) / 2;
      return { pathD, midX, midY, x1, y1, x2, y2, isHighway: false };
    }

    // 3. Feedback Return Loops & Multi-Column Jumps -> Top/Bottom Highway Bus
    const isTopBus = !cable.isFeedback && src.rowIdx <= 1 && tgt.rowIdx <= 1;
    const laneIdx = cable.highwayLane ?? indexOffset % 3;
    const busY = isTopBus ? 14 + laneIdx * 5 : 564 + laneIdx * 4;

    const x1 = cable.isFeedback ? src.x : src.x + NODE_WIDTH;
    const y1 = src.y + NODE_HEIGHT / 2 + outPinOffset * 0.4;
    const x2 = cable.isFeedback ? tgt.x + NODE_WIDTH : tgt.x;
    const y2 = tgt.y + NODE_HEIGHT / 2 + inPinOffset * 0.4;

    const exitCorridorX = cable.isFeedback
      ? src.x - 22 + cable.corridorTrack * 4
      : src.x + NODE_WIDTH + 22 + cable.corridorTrack * 4;

    const entryCorridorX = cable.isFeedback
      ? tgt.x + NODE_WIDTH + 22 + cable.corridorTrack * 4
      : tgt.x - 22 + cable.corridorTrack * 4;

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

    return { pathD, midX, midY, x1, y1, x2, y2, isHighway: true };
  }, []);

  // Anti-collision spacing for small 24x15px step dots
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
        isHighway: boolean;
      }
    >();

    const placedDots: Array<{ x: number; y: number }> = [];

    CABLES.forEach((cable, idx) => {
      if (!activeCableSequenceMap.has(cable.id)) return;
      const baseGeom = computeCableGeometry(cable, idx);
      if (!baseGeom) return;

      let { midX, midY } = baseGeom;

      for (let attempt = 0; attempt < 8; attempt++) {
        const collision = placedDots.find(
          (p) => Math.abs(p.x - midX) < 28 && Math.abs(p.y - midY) < 18
        );
        if (!collision) break;
        if (!baseGeom.isHighway) {
          midY += (attempt % 2 === 0 ? 1 : -1) * (18 + attempt * 4);
          midY = Math.min(Math.max(midY, 76), 516);
        } else {
          midX += (attempt % 2 === 0 ? 1 : -1) * 70;
          midX = Math.min(Math.max(midX, 90), CANVAS_WIDTH - 90);
        }
      }

      placedDots.push({ x: midX, y: midY });
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
              ISO 9001:2015 MATRIX
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
              <span>PDCA Backbone (1➔{MASTER_BACKBONE_SEQUENCE.length})</span>
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
              <span>↺ Return Loops ({CABLES.filter((c) => c.isFeedback).length})</span>
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
                placeholder="Search Clause / Module..."
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
                        {node.isoClause}
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
                : `ISO PDCA (1➔${MASTER_BACKBONE_SEQUENCE.length})`}
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
              const paddedNum =
                item.stepNumber < 10 ? `0${item.stepNumber}` : `${item.stepNumber}`;
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
                      {isBackboneFeedback ? `↺${paddedNum}` : paddedNum}
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
      {/* 2. SPACIOUS ZERO-CLUTTER MATRIX CANVAS (1460 x 560) */}
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
            radial-gradient(circle at 18% 22%, rgba(0, 102, 204, 0.12) 0%, transparent 45%),
            radial-gradient(circle at 82% 78%, rgba(16, 185, 129, 0.09) 0%, transparent 45%),
            radial-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 24px 24px',
        }}
      >
        {/* LIVE TELEPROMPTER STORY BANNER (Appears when stepping through a Cable or Simulation) */}
        {activeCableInfo && (
          <div
            data-interactive="true"
            className="absolute top-2.5 left-1/2 -translate-x-1/2 z-40 max-w-4xl w-[95%] bg-[#071124]/95 backdrop-blur-2xl border-2 rounded-2xl px-4 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.85)] flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200"
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
                {activeCableInfo.cable.isoTransition}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-black text-white truncate">
                  <span>
                    {activeCableInfo.srcNode?.title} ({activeCableInfo.srcNode?.isoClause})
                  </span>
                  <span className="text-sky-400">━━▶</span>
                  <span className="text-emerald-300">
                    {activeCableInfo.tgtNode?.title} ({activeCableInfo.tgtNode?.isoClause})
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
          {PHASES.map((phase) => {
            const isStageActive = activeStageIds.has(phase.id);
            const isFocused = focusedStageId === phase.id;
            return (
              <div
                key={phase.id}
                style={{
                  left: `${phase.x - 5}px`,
                  top: '26px',
                  width: `${phase.width + 10}px`,
                  height: `${CANVAS_HEIGHT - 36}px`,
                  borderColor: isFocused
                    ? phase.color
                    : isStageActive
                    ? `${phase.color}55`
                    : 'rgba(255,255,255,0.06)',
                  background: isFocused
                    ? `linear-gradient(180deg, ${phase.badgeBg} 0%, rgba(10, 18, 34, 0.72) 100%)`
                    : isStageActive
                    ? `linear-gradient(180deg, ${phase.badgeBg} 0%, rgba(10, 18, 34, 0.38) 100%)`
                    : 'linear-gradient(180deg, rgba(15, 23, 42, 0.35) 0%, rgba(8, 13, 25, 0.18) 100%)',
                }}
                className="absolute rounded-xl border transition-all duration-300 pointer-events-none"
              >
                {/* Clickable Stage Header with PDCA Badge + ISO Clause Range */}
                <button
                  type="button"
                  data-interactive="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFocusStage(phase);
                  }}
                  title={`Click to ${isFocused ? 'reset zoom' : `zoom & spotlight ${phase.title} (${phase.isoClauseRange})`}`}
                  className="pointer-events-auto w-full px-2.5 py-1.5 border-b border-white/10 flex items-center justify-between rounded-t-xl bg-slate-950/90 hover:bg-slate-900 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="text-[9.5px] font-black tracking-wider px-1.5 py-0.5 rounded uppercase shrink-0"
                      style={{
                        backgroundColor: phase.color,
                        color: '#020617',
                      }}
                    >
                      {phase.pdcaPhase}
                    </span>
                    <span className="text-[12.5px] font-black text-white tracking-tight truncate">
                      {phase.title}
                    </span>
                  </div>
                  <span className="text-[9.5px] font-mono font-bold text-slate-400 group-hover:text-sky-300 transition-colors shrink-0">
                    {isFocused ? 'Reset ✕' : `${phase.subtitle}`}
                  </span>
                </button>
              </div>
            );
          })}

          {/* ------------------------------------------------------------- */}
          {/* LAYER 1: ULTRA-CLEAN MINIMALIST HERO CARDS (198 x 94px) */}
          {/* Zero External Top Banners • Zero Wrapping Text • Zero Cut-off Pills */}
          {/* ------------------------------------------------------------- */}
          {NODES.map((node) => {
            const Icon = node.icon;
            const phase = PHASES.find((p) => p.id === node.phaseId)!;
            const roleBadge = nodeInternalRoleBadges.get(node.id);
            const isConnected = Boolean(roleBadge);
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
                : roleBadge
                ? roleBadge.color
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
                    : roleBadge
                    ? roleBadge.color
                    : viewLens === 'heatmap'
                    ? heatmapBorderColor
                    : `${phase.color}40`,
                  boxShadow: isSelected
                    ? `0 0 24px rgba(56, 189, 248, 0.45), 0 8px 24px rgba(0,0,0,0.85)`
                    : roleBadge?.isPulseSpotlight
                    ? `0 0 16px ${roleBadge.color}45, 0 6px 18px rgba(0,0,0,0.75)`
                    : `0 4px 16px rgba(0, 0, 0, 0.65)`,
                }}
                className={`absolute rounded-xl bg-gradient-to-b from-[#0d1629] to-[#070d18] backdrop-blur-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group ${
                  isDimmed
                    ? 'opacity-20 scale-[0.98]'
                    : 'opacity-100 hover:scale-[1.03] hover:border-sky-400/70 hover:shadow-[0_0_20px_rgba(56,189,248,0.25)] hover:z-40'
                } ${isSelected || roleBadge?.isPulseSpotlight ? 'z-30' : 'z-20'}`}
              >
                {/* Left Vertical Neon Spine Bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all duration-300"
                  style={{ backgroundColor: cardAccentColor }}
                />

                {/* ROW 1: Sleek Header Strip (Icon + ISO Clause + Status/Role Pill) */}
                <div className="pl-3 pr-2.5 pt-2 flex items-center justify-between gap-1.5 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 border border-white/10"
                      style={{
                        backgroundColor: `${cardAccentColor}18`,
                        color: cardAccentColor,
                      }}
                    >
                      <Icon className="w-3 h-3" />
                    </div>
                    <span
                      className="text-[10px] font-black font-mono tracking-tight"
                      style={{ color: phase.color }}
                    >
                      {node.isoClause}
                    </span>
                  </div>

                  {/* Internal Role/Step Badge OR Metric */}
                  {roleBadge ? (
                    <span
                      style={{
                        backgroundColor: roleBadge.color,
                        color: '#020617',
                      }}
                      className="px-2 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider shrink-0 shadow-sm"
                    >
                      {roleBadge.text}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/10 text-slate-300 text-[9.5px] font-black font-mono shrink-0">
                      {viewLens === 'heatmap' ? `${node.healthScore}%` : node.kpiValue}
                    </span>
                  )}
                </div>

                {/* ROW 2: High-Clarity Module Title & Concise Concept Tagline */}
                <div className="pl-3 pr-2.5 flex flex-col justify-center">
                  <h4 className="text-[15.5px] font-black text-white leading-tight tracking-tight whitespace-nowrap">
                    {node.title}
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-300 leading-tight whitespace-nowrap mt-0.5">
                    {node.conceptTagline}
                  </p>
                </div>

                {/* ROW 3: Streamlined Interactive Sequence Bar & Launch Button */}
                <div className="pl-3 pr-2 pb-1.5 pt-1 border-t border-white/[0.07] bg-black/30 flex items-center justify-between gap-1.5 whitespace-nowrap">
                  <div className="flex items-center gap-1 min-w-0">
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
                        className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold transition-all flex items-center gap-1 shrink-0 ${
                          selectedCableId === chip.cableId
                            ? 'bg-emerald-400 text-slate-950 font-black shadow'
                            : chip.isFeedback
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                            : 'bg-white/[0.05] text-slate-300 border border-white/10 hover:bg-sky-500/20 hover:text-white'
                        }`}
                      >
                        <span className={chip.isFeedback ? 'text-rose-400' : 'text-sky-400'}>
                          {chip.isFeedback ? `↺${chip.orderNum}` : `${chip.orderNum}➔`}
                        </span>
                        <span className="truncate max-w-[55px]">{chip.targetShortName}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(node.path);
                    }}
                    className="px-2 py-0.5 rounded bg-sky-500/15 hover:bg-sky-500 text-sky-300 hover:text-slate-950 text-[9.5px] font-black border border-sky-400/25 transition-all flex items-center gap-1 shrink-0"
                  >
                    <span>Go</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* ------------------------------------------------------------- */}
          {/* LAYER 2: CLEAN FOREGROUND PCB TRACES (ZERO BACKGROUND NOISE!) */}
          {/* Only active cables are drawn, with compact 24x15px number badges */}
          {/* ------------------------------------------------------------- */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-30"
            style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}
          >
            <defs>
              <filter id="laserGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              <marker
                id="arrowActiveGreen"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#10B981" />
              </marker>

              <marker
                id="arrowActiveBlue"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#38BDF8" />
              </marker>

              <marker
                id="arrowActiveAmber"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#F59E0B" />
              </marker>

              <marker
                id="arrowActiveFeedback"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6.5"
                markerHeight="6.5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#F43F5E" />
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
                      ? 0.92
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
                          ? '2.6'
                          : '2.2'
                        : '1.8'
                    }
                    strokeDasharray={seqMeta.isFeedback ? '7, 5' : 'none'}
                    filter="url(#laserGlow)"
                    markerEnd={markerId}
                  />

                  {/* Single Crisp Travelling Energy Pulse */}
                  <circle
                    r={seqMeta.isCurrentStepSpotlight ? '3.8' : '2.8'}
                    fill="#ffffff"
                    filter="url(#laserGlow)"
                  >
                    <animateMotion
                      dur={seqMeta.isFeedback ? '2.2s' : '1.5s'}
                      repeatCount="indefinite"
                      path={geom.pathD}
                    />
                  </circle>

                  {/* Tiny Sleek 24x15px Number Badge inside the 48px Corridor */}
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
                    <rect
                      x="-13"
                      y="-7.5"
                      width="26"
                      height="15"
                      rx="7.5"
                      fill="#040812"
                      stroke={strokeColor}
                      strokeWidth="1.5"
                    />
                    <text
                      x="0"
                      y="3"
                      textAnchor="middle"
                      fill={strokeColor}
                      fontSize="9"
                      fontWeight="900"
                    >
                      {seqMeta.pillText}
                    </text>
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
                {activeNodeInfo.node.seqCode} • {activeNodeInfo.node.isoClause}
              </span>
              <span className="font-black text-white text-sm">
                {activeNodeInfo.node.title}
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
                <span>Zero-Clutter ISO 9001:2015 Matrix • Clean 48px Corridors • Internal Step Badges</span>
              </span>
            </div>
            <span className="text-xs text-slate-300 hidden md:inline">
              Hover any card to spotlight its exact <strong>1st / 2nd / ↺ Return</strong> links with zero background clutter
            </span>
          </div>
        )}
      </div>
    </div>
  );
}







