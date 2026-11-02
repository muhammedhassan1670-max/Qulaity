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
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Network,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Database,
  CornerUpLeft,
  GitBranch,
  Zap,
  Flame,
  Eye,
  type LucideIcon,
} from 'lucide-react';

interface BlueprintNode {
  id: string;
  seqCode: string;
  shortName: string;
  title: string; // Concise, high-impact title (fits on 1 line in 16.5px font!)
  conceptTagline: string; // 3-4 word crystal-clear concept summary (13px bold!)
  path: string;
  icon: LucideIcon;
  kpiMetric: string;
  healthScore: number;
  phaseId: string;
  rowIdx: number; // 0, 1, 2, 3
  colIdx: number; // 0..5
  x: number;
  y: number;
}

interface PhaseZone {
  id: string;
  phaseNumber: string;
  title: string;
  gateLabel: string;
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
  orderFromSource: number;
  shortTag: string; // Clear 2-3 word action shown on card rim & top ribbon
  payloadSpec: string;
  label: string;
  isFeedback: boolean;
  feedbackLane?: 'top' | 'bottom' | 'local';
  alleyRow?: 1 | 2 | 3;
  corridorTrack: number; // -1, 0, 1
  category: 'defect' | 'governance' | 'prevention' | 'supplier' | 'intelligence';
  color: string;
}

// =========================================================================
// 1. HIGH-VISIBILITY COMPACT CANVAS GEOMETRY (1680 x 762 FOR MAX FONT SIZE!)
// =========================================================================
// Stage X stride = 280px (Card = 224px, Empty Corridor = 56px):
// Stage 0: zone x=18..262, card x=28..252     | Corridor 1: x=252..308 (center 280)
// Stage 1: zone x=298..542, card x=308..532   | Corridor 2: x=532..588 (center 560)
// Stage 2: zone x=578..822, card x=588..812   | Corridor 3: x=812..868 (center 840)
// Stage 3: zone x=858..1102, card x=868..1092 | Corridor 4: x=1092..1148 (center 1120)
// Stage 4: zone x=1138..1382, card x=1148..1372 | Corridor 5: x=1372..1428 (center 1400)
// Stage 5: zone x=1418..1662, card x=1428..1652
//
// Row Y coordinates (NODE_HEIGHT = 134, ROW_ALLEY_GAP = 32px):
// Row 0: y=86..220  | Alley 1: y=220..252 (center 236)
// Row 1: y=252..386 | Alley 2: y=386..418 (center 402)
// Row 2: y=418..552 | Alley 3: y=552..584 (center 568)
// Row 3: y=584..718

const NODE_WIDTH = 224;
const NODE_HEIGHT = 134;
const CANVAS_WIDTH = 1680;
const CANVAS_HEIGHT = 762;

const PHASES: PhaseZone[] = [
  {
    id: 'supply_chain',
    phaseNumber: '01',
    title: 'Inbound & Supply',
    gateLabel: 'STAGE 01 • INBOUND',
    color: '#10B981',
    borderColor: 'border-emerald-500/35',
    bgGradient: 'from-emerald-950/40 via-emerald-950/10 to-transparent',
    x: 18,
    width: 244,
    icon: Truck,
  },
  {
    id: 'shopfloor',
    phaseNumber: '02',
    title: 'Shopfloor QC',
    gateLabel: 'STAGE 02 • PRODUCTION',
    color: '#0EA5E9',
    borderColor: 'border-sky-500/35',
    bgGradient: 'from-sky-950/40 via-sky-950/10 to-transparent',
    x: 298,
    width: 244,
    icon: Factory,
  },
  {
    id: 'nonconformance',
    phaseNumber: '03',
    title: 'NCR & Containment',
    gateLabel: 'STAGE 03 • QUARANTINE',
    color: '#EF4444',
    borderColor: 'border-red-500/35',
    bgGradient: 'from-red-950/40 via-red-950/10 to-transparent',
    x: 578,
    width: 244,
    icon: AlertTriangle,
  },
  {
    id: 'root_cause',
    phaseNumber: '04',
    title: '8D & CAPA Actions',
    gateLabel: 'STAGE 04 • ROOT CAUSE',
    color: '#8B5CF6',
    borderColor: 'border-purple-500/35',
    bgGradient: 'from-purple-950/40 via-purple-950/10 to-transparent',
    x: 858,
    width: 244,
    icon: Workflow,
  },
  {
    id: 'engineering',
    phaseNumber: '05',
    title: 'FMEA & Prevention',
    gateLabel: 'STAGE 05 • POKA-YOKE',
    color: '#F59E0B',
    borderColor: 'border-amber-500/35',
    bgGradient: 'from-amber-950/40 via-amber-950/10 to-transparent',
    x: 1138,
    width: 244,
    icon: ShieldCheck,
  },
  {
    id: 'intelligence',
    phaseNumber: '06',
    title: 'SPC & AI Tower',
    gateLabel: 'STAGE 06 • INTELLIGENCE',
    color: '#06B6D4',
    borderColor: 'border-cyan-500/35',
    bgGradient: 'from-cyan-950/40 via-cyan-950/10 to-transparent',
    x: 1418,
    width: 244,
    icon: Cpu,
  },
];

// All 24 Modules with LARGE, CONCISE Titles & 3-Word Concept Taglines
const NODES: BlueprintNode[] = [
  // Stage 01: Inbound & Supply (colIdx: 0, x: 28)
  {
    id: 'iqc',
    seqCode: 'M-01',
    shortName: 'IQC',
    title: 'Incoming QC (IQC)',
    conceptTagline: 'Raw Material AQL Gate',
    path: '/inspection',
    icon: Truck,
    kpiMetric: '98.4% Pass',
    healthScore: 98,
    phaseId: 'supply_chain',
    rowIdx: 0,
    colIdx: 0,
    x: 28,
    y: 86,
  },
  {
    id: 'suppliers',
    seqCode: 'M-02',
    shortName: 'Suppliers',
    title: 'Supplier Scorecard',
    conceptTagline: 'Vendor Rating & PPM',
    path: '/supplier-quality',
    icon: Building,
    kpiMetric: '94.2% A-Tier',
    healthScore: 94,
    phaseId: 'supply_chain',
    rowIdx: 1,
    colIdx: 0,
    x: 28,
    y: 252,
  },
  {
    id: 'calibration',
    seqCode: 'M-03',
    shortName: 'Calibration',
    title: 'Tool Calibration',
    conceptTagline: 'Gauge & MSA Certs',
    path: '/calibration',
    icon: Wrench,
    kpiMetric: '100% Valid',
    healthScore: 100,
    phaseId: 'supply_chain',
    rowIdx: 2,
    colIdx: 0,
    x: 28,
    y: 418,
  },
  {
    id: 'master_data',
    seqCode: 'M-04',
    shortName: 'Master Data',
    title: 'Master Standards',
    conceptTagline: 'Specs & Defect Catalog',
    path: '/quality-master-data',
    icon: Database,
    kpiMetric: '1,420 Specs',
    healthScore: 99,
    phaseId: 'supply_chain',
    rowIdx: 3,
    colIdx: 0,
    x: 28,
    y: 584,
  },

  // Stage 02: Shopfloor QC (colIdx: 1, x: 308)
  {
    id: 'daily_defects',
    seqCode: 'M-05',
    shortName: 'Defect Log',
    title: 'Live Defect Log',
    conceptTagline: 'Shopfloor Pareto Capture',
    path: '/defect-log',
    icon: Activity,
    kpiMetric: 'Live Pareto',
    healthScore: 96,
    phaseId: 'shopfloor',
    rowIdx: 0,
    colIdx: 1,
    x: 308,
    y: 86,
  },
  {
    id: 'inspection_plans',
    seqCode: 'M-06',
    shortName: 'IPQC Gates',
    title: 'In-Process IPQC',
    conceptTagline: 'First-Piece & Patrol QC',
    path: '/quality-inspection-plans',
    icon: CheckCircle2,
    kpiMetric: '18 Gates',
    healthScore: 95,
    phaseId: 'shopfloor',
    rowIdx: 1,
    colIdx: 1,
    x: 308,
    y: 252,
  },
  {
    id: 'lpa',
    seqCode: 'M-07',
    shortName: 'LPA Audits',
    title: 'Layered Audits (LPA)',
    conceptTagline: 'Shift Process Checks',
    path: '/quality-audits',
    icon: Layers,
    kpiMetric: '96% Adhere',
    healthScore: 96,
    phaseId: 'shopfloor',
    rowIdx: 2,
    colIdx: 1,
    x: 308,
    y: 418,
  },
  {
    id: 'setup_readiness',
    seqCode: 'M-08',
    shortName: 'Line Setup',
    title: 'Line Setup Go/No-Go',
    conceptTagline: 'Startup Line Clearance',
    path: '/quality-execution-board',
    icon: Sliders,
    kpiMetric: '12 Lines Go',
    healthScore: 97,
    phaseId: 'shopfloor',
    rowIdx: 3,
    colIdx: 1,
    x: 308,
    y: 584,
  },

  // Stage 03: NCR & Containment (colIdx: 2, x: 588)
  {
    id: 'ncr',
    seqCode: 'M-09',
    shortName: 'NCR Hold',
    title: 'NCR Quarantine',
    conceptTagline: 'Batch Hold & MRB',
    path: '/quality/records/ncr',
    icon: AlertTriangle,
    kpiMetric: '7 Hold Lots',
    healthScore: 91,
    phaseId: 'nonconformance',
    rowIdx: 0,
    colIdx: 2,
    x: 588,
    y: 86,
  },
  {
    id: 'deviation',
    seqCode: 'M-10',
    shortName: 'Deviation',
    title: 'Process Deviation',
    conceptTagline: 'Temp Waiver Signoff',
    path: '/deviation',
    icon: FileWarning,
    kpiMetric: '3 Waivers',
    healthScore: 90,
    phaseId: 'nonconformance',
    rowIdx: 1,
    colIdx: 2,
    x: 588,
    y: 252,
  },
  {
    id: 'complaints',
    seqCode: 'M-11',
    shortName: 'Complaints',
    title: 'Customer RMA',
    conceptTagline: 'VOC & Field Returns',
    path: '/complaints',
    icon: Building,
    kpiMetric: '99.1% CSAT',
    healthScore: 94,
    phaseId: 'nonconformance',
    rowIdx: 2,
    colIdx: 2,
    x: 588,
    y: 418,
  },
  {
    id: 'defect_cost',
    seqCode: 'M-12',
    shortName: 'COPQ Cost',
    title: 'COPQ Scrap Cost',
    conceptTagline: 'Scrap & Rework Finance',
    path: '/defect-cost',
    icon: DollarSign,
    kpiMetric: '-18% Cost',
    healthScore: 94,
    phaseId: 'nonconformance',
    rowIdx: 3,
    colIdx: 2,
    x: 588,
    y: 584,
  },

  // Stage 04: 8D & CAPA Actions (colIdx: 3, x: 868)
  {
    id: 'capa_records',
    seqCode: 'M-13',
    shortName: 'CAPA Plan',
    title: 'CAPA Action Plan',
    conceptTagline: 'Corrective & Preventive',
    path: '/quality/records/capa',
    icon: CheckCheck,
    kpiMetric: '96% Closed',
    healthScore: 96,
    phaseId: 'root_cause',
    rowIdx: 0,
    colIdx: 3,
    x: 868,
    y: 86,
  },
  {
    id: 'eight_d',
    seqCode: 'M-14',
    shortName: '8D RCA',
    title: '8D Root Cause',
    conceptTagline: 'Fishbone & 5-Why Solver',
    path: '/quality/records/8d',
    icon: RefreshCw,
    kpiMetric: 'D1➔D8 Live',
    healthScore: 97,
    phaseId: 'root_cause',
    rowIdx: 1,
    colIdx: 3,
    x: 868,
    y: 252,
  },
  {
    id: 'change_control',
    seqCode: 'M-15',
    shortName: 'ECN Change',
    title: 'ECN Change Ctrl',
    conceptTagline: '4M Engineering Changes',
    path: '/change-control',
    icon: Sliders,
    kpiMetric: 'Rev Synced',
    healthScore: 95,
    phaseId: 'root_cause',
    rowIdx: 2,
    colIdx: 3,
    x: 868,
    y: 418,
  },
  {
    id: 'command_center',
    seqCode: 'M-16',
    shortName: 'SLA Center',
    title: 'Action SLA Center',
    conceptTagline: 'Overdue Task Escalation',
    path: '/quality-command-center',
    icon: Workflow,
    kpiMetric: '95% On-Time',
    healthScore: 95,
    phaseId: 'root_cause',
    rowIdx: 3,
    colIdx: 3,
    x: 868,
    y: 584,
  },

  // Stage 05: FMEA & Prevention (colIdx: 4, x: 1148)
  {
    id: 'fmea',
    seqCode: 'M-17',
    shortName: 'PFMEA Risk',
    title: 'PFMEA Risk Matrix',
    conceptTagline: 'Severity × Occurrence RPN',
    path: '/fmea',
    icon: ShieldCheck,
    kpiMetric: 'RPN < 80',
    healthScore: 98,
    phaseId: 'engineering',
    rowIdx: 0,
    colIdx: 4,
    x: 1148,
    y: 86,
  },
  {
    id: 'control_plan',
    seqCode: 'M-18',
    shortName: 'Ctrl Plan',
    title: 'Control Plan Specs',
    conceptTagline: 'CTQ Limits & Poka-Yoke',
    path: '/control-plan',
    icon: Sliders,
    kpiMetric: '84 CTQs',
    healthScore: 99,
    phaseId: 'engineering',
    rowIdx: 1,
    colIdx: 4,
    x: 1148,
    y: 252,
  },
  {
    id: 'knowledge_base',
    seqCode: 'M-19',
    shortName: 'Lessons Hub',
    title: 'Lessons Learned',
    conceptTagline: 'Solved 8D Knowledge Base',
    path: '/quality-knowledge-base',
    icon: BookOpen,
    kpiMetric: '215 Cases',
    healthScore: 97,
    phaseId: 'engineering',
    rowIdx: 2,
    colIdx: 4,
    x: 1148,
    y: 418,
  },
  {
    id: 'form_designer',
    seqCode: 'M-20',
    shortName: 'Form Studio',
    title: 'Smart Checklists',
    conceptTagline: 'No-Code Digital Forms',
    path: '/quality-form-designer',
    icon: Layers,
    kpiMetric: '42 Forms',
    healthScore: 98,
    phaseId: 'engineering',
    rowIdx: 3,
    colIdx: 4,
    x: 1148,
    y: 584,
  },

  // Stage 06: SPC & AI Tower (colIdx: 5, x: 1428)
  {
    id: 'spc',
    seqCode: 'M-21',
    shortName: 'SPC Charts',
    title: 'SPC Control Charts',
    conceptTagline: 'Six Sigma Cp / Cpk',
    path: '/spc',
    icon: TrendingUp,
    kpiMetric: 'Cpk 1.67',
    healthScore: 99,
    phaseId: 'intelligence',
    rowIdx: 0,
    colIdx: 5,
    x: 1428,
    y: 86,
  },
  {
    id: 'control_tower',
    seqCode: 'M-22',
    shortName: 'Ctrl Tower',
    title: '360° Control Tower',
    conceptTagline: 'Executive Plant KPIs',
    path: '/quality-control-tower',
    icon: BarChart3,
    kpiMetric: 'Live KPI',
    healthScore: 100,
    phaseId: 'intelligence',
    rowIdx: 1,
    colIdx: 5,
    x: 1428,
    y: 252,
  },
  {
    id: 'ai_copilot',
    seqCode: 'M-23',
    shortName: 'AI Copilot',
    title: 'AI Quality Copilot',
    conceptTagline: 'Predictive Defect AI',
    path: '/ai/defect-prediction',
    icon: Sparkles,
    kpiMetric: '97% AI Acc',
    healthScore: 97,
    phaseId: 'intelligence',
    rowIdx: 2,
    colIdx: 5,
    x: 1428,
    y: 418,
  },
  {
    id: 'audits',
    seqCode: 'M-24',
    shortName: 'ISO Audits',
    title: 'ISO / IATF Audits',
    conceptTagline: 'Compliance & Findings',
    path: '/audit',
    icon: ShieldCheck,
    kpiMetric: '100% Pass',
    healthScore: 98,
    phaseId: 'intelligence',
    rowIdx: 3,
    colIdx: 5,
    x: 1428,
    y: 584,
  },
];

// =========================================================================
// 2. 100% ORTHOGONAL PCB CONDUITS WITH LARGE READABLE CORRIDOR PILLS
// =========================================================================

const CABLES: CableRelation[] = [
  // Stage 01 Outgoing
  {
    id: 'c1',
    source: 'master_data',
    target: 'inspection_plans',
    orderFromSource: 1,
    shortTag: 'Defect Specs',
    payloadSpec: 'Payload: { partId, defectCodes[], aqlLevel, tolerances }',
    label: '1st: Feeds standard defect catalogs & acceptance specs to IPQC',
    isFeedback: false,
    corridorTrack: -1,
    category: 'governance',
    color: '#10B981',
  },
  {
    id: 'c2',
    source: 'master_data',
    target: 'fmea',
    orderFromSource: 2,
    shortTag: 'BOM to PFMEA',
    payloadSpec: 'Payload: { bomTree, processSteps[], severityBaseline }',
    label: '2nd: Supplies part BOM & process steps for PFMEA risk analysis',
    isFeedback: false,
    alleyRow: 3,
    corridorTrack: 0,
    category: 'governance',
    color: '#10B981',
  },
  {
    id: 'c3',
    source: 'calibration',
    target: 'iqc',
    orderFromSource: 1,
    shortTag: 'Validate Gauge',
    payloadSpec: 'Payload: { gaugeId, calCertValid: true, uncertainty }',
    label: '1st: Validates measurement gauge accuracy before Incoming QC',
    isFeedback: false,
    corridorTrack: -1,
    category: 'governance',
    color: '#10B981',
  },
  {
    id: 'c4',
    source: 'calibration',
    target: 'spc',
    orderFromSource: 2,
    shortTag: 'MSA to SPC',
    payloadSpec: 'Payload: { grrScore, gaugeBias, linearityStatus }',
    label: '2nd: Ensures measurement system reliability for SPC charts',
    isFeedback: false,
    alleyRow: 2,
    corridorTrack: 1,
    category: 'intelligence',
    color: '#06B6D4',
  },
  {
    id: 'c6',
    source: 'iqc',
    target: 'ncr',
    orderFromSource: 1,
    shortTag: 'Quarantine Lot',
    payloadSpec: 'Payload: { shipmentId, rejectedQty, holdTagId, vendorId }',
    label: '1st: Triggers NCR & quarantine hold for rejected inbound material',
    isFeedback: false,
    alleyRow: 1,
    corridorTrack: -1,
    category: 'supplier',
    color: '#EF4444',
  },
  {
    id: 'c7',
    source: 'iqc',
    target: 'deviation',
    orderFromSource: 2,
    shortTag: 'Waiver Request',
    payloadSpec: 'Payload: { lotId, deviationReason, RiskSignoff }',
    label: '2nd: Requests conditional concession for urgent production lots',
    isFeedback: false,
    alleyRow: 1,
    corridorTrack: 0,
    category: 'supplier',
    color: '#F59E0B',
  },
  {
    id: 'c5',
    source: 'iqc',
    target: 'suppliers',
    orderFromSource: 3,
    shortTag: 'Rate Vendor',
    payloadSpec: 'Feedback: { vendorId, lotAcceptRate, ppmScoreDelta }',
    label: '3rd (Feedback): Auto-updates vendor scorecard from lot results',
    isFeedback: true,
    feedbackLane: 'local',
    corridorTrack: 1,
    category: 'supplier',
    color: '#F43F5E',
  },
  {
    id: 'c8',
    source: 'suppliers',
    target: 'audits',
    orderFromSource: 1,
    shortTag: 'Vendor Audit',
    payloadSpec: 'Payload: { vendorId, ratingTier: "C", auditScope }',
    label: '1st: Schedules supplier quality audits for low-rated vendors',
    isFeedback: false,
    alleyRow: 2,
    corridorTrack: 0,
    category: 'supplier',
    color: '#10B981',
  },

  // Stage 02 Outgoing
  {
    id: 'c9',
    source: 'setup_readiness',
    target: 'inspection_plans',
    orderFromSource: 1,
    shortTag: 'Startup Go/No-Go',
    payloadSpec: 'Payload: { lineId, fpiApproved: true, recipeVerified }',
    label: '1st: Authorizes line startup & mandatory First Piece check',
    isFeedback: false,
    corridorTrack: -1,
    category: 'governance',
    color: '#0EA5E9',
  },
  {
    id: 'c10',
    source: 'inspection_plans',
    target: 'daily_defects',
    orderFromSource: 1,
    shortTag: 'Log Defect',
    payloadSpec: 'Payload: { stationId, checkId, failedSpec, samplePhoto }',
    label: '1st: Logs live defects detected during IPQC patrol checks',
    isFeedback: false,
    corridorTrack: 0,
    category: 'defect',
    color: '#0EA5E9',
  },
  {
    id: 'c11',
    source: 'daily_defects',
    target: 'ncr',
    orderFromSource: 1,
    shortTag: 'Escalate NCR',
    payloadSpec: 'Payload: { defectId, severity: "CRITICAL", batchHold }',
    label: '1st: Escalates critical shopfloor defects into formal NCR',
    isFeedback: false,
    corridorTrack: -1,
    category: 'defect',
    color: '#EF4444',
  },
  {
    id: 'c12',
    source: 'daily_defects',
    target: 'spc',
    orderFromSource: 2,
    shortTag: 'Stream to SPC',
    payloadSpec: 'Payload: { subgroupValues[], timestamp, shiftId }',
    label: '2nd: Streams live defect telemetry into SPC control charts',
    isFeedback: false,
    alleyRow: 1,
    corridorTrack: 0,
    category: 'intelligence',
    color: '#0EA5E9',
  },
  {
    id: 'c13',
    source: 'daily_defects',
    target: 'defect_cost',
    orderFromSource: 3,
    shortTag: 'Scrap Cost',
    payloadSpec: 'Payload: { scrapQty, reworkHours, unitMaterialCost }',
    label: '3rd: Calculates daily scrap and rework financial impact',
    isFeedback: false,
    corridorTrack: 1,
    category: 'defect',
    color: '#EF4444',
  },
  {
    id: 'c14',
    source: 'lpa',
    target: 'capa_records',
    orderFromSource: 1,
    shortTag: 'Audit CAPA',
    payloadSpec: 'Payload: { lpaAuditId, nonCompliantStep, shiftSupervisor }',
    label: '1st: Opens CAPA for non-compliant process audit findings',
    isFeedback: false,
    alleyRow: 2,
    corridorTrack: -1,
    category: 'governance',
    color: '#0EA5E9',
  },
  {
    id: 'c15',
    source: 'lpa',
    target: 'setup_readiness',
    orderFromSource: 2,
    shortTag: 'Verify Setup',
    payloadSpec: 'Feedback: { setupChecklistId, pokaYokeVerified: true }',
    label: '2nd (Feedback): Reinforces operator setup checklist compliance',
    isFeedback: true,
    feedbackLane: 'local',
    corridorTrack: 1,
    category: 'governance',
    color: '#F43F5E',
  },

  // Stage 03 Outgoing
  {
    id: 'c17',
    source: 'ncr',
    target: 'eight_d',
    orderFromSource: 1,
    shortTag: 'Launch 8D',
    payloadSpec: 'Payload: { ncrId, containmentActions, d1TeamList[] }',
    label: '1st: Launches structured 8D root cause investigation',
    isFeedback: false,
    corridorTrack: -1,
    category: 'defect',
    color: '#8B5CF6',
  },
  {
    id: 'c16',
    source: 'ncr',
    target: 'capa_records',
    orderFromSource: 2,
    shortTag: 'Open CAPA',
    payloadSpec: 'Payload: { ncrId, rootCauseSummary, targetDueDate }',
    label: '2nd: Initiates corrective & preventive action plan (CAPA)',
    isFeedback: false,
    corridorTrack: 0,
    category: 'defect',
    color: '#EF4444',
  },
  {
    id: 'c18',
    source: 'ncr',
    target: 'defect_cost',
    orderFromSource: 3,
    shortTag: 'Hold Scrap Loss',
    payloadSpec: 'Payload: { ncrId, disposition: "SCRAP", financialLoss }',
    label: '3rd: Records quarantine sorting & batch scrap losses',
    isFeedback: false,
    corridorTrack: 1,
    category: 'defect',
    color: '#EF4444',
  },
  {
    id: 'c19',
    source: 'complaints',
    target: 'ncr',
    orderFromSource: 1,
    shortTag: 'RMA to NCR',
    payloadSpec: 'Payload: { rmaNumber, customerCode, returnedBatchId }',
    label: '1st: Converts customer RMA claim into formal containment NCR',
    isFeedback: false,
    corridorTrack: -1,
    category: 'defect',
    color: '#EF4444',
  },
  {
    id: 'c20',
    source: 'complaints',
    target: 'eight_d',
    orderFromSource: 2,
    shortTag: 'Mandate 8D',
    payloadSpec: 'Payload: { vocClaimId, sla48hContainment, d8ReportReq }',
    label: '2nd: Mandates formal 8D root cause report for customer',
    isFeedback: false,
    corridorTrack: 0,
    category: 'defect',
    color: '#8B5CF6',
  },
  {
    id: 'c21',
    source: 'deviation',
    target: 'change_control',
    orderFromSource: 1,
    shortTag: 'Route to ECN',
    payloadSpec: 'Payload: { concessionId, specChangeRequest, mrbApproval }',
    label: '1st: Routes temporary deviation for permanent ECN review',
    isFeedback: false,
    corridorTrack: 1,
    category: 'governance',
    color: '#F59E0B',
  },
  {
    id: 'c22',
    source: 'defect_cost',
    target: 'control_tower',
    orderFromSource: 1,
    shortTag: 'COPQ Stream',
    payloadSpec: 'Payload: { monthlyCopqTotal, scrapRatio, warrantyCost }',
    label: '1st: Reports COPQ financial impact to Executive Control Tower',
    isFeedback: false,
    alleyRow: 3,
    corridorTrack: 0,
    category: 'intelligence',
    color: '#EF4444',
  },

  // Stage 04 Outgoing
  {
    id: 'c23',
    source: 'eight_d',
    target: 'fmea',
    orderFromSource: 1,
    shortTag: 'Update RPN',
    payloadSpec: 'Payload: { d4RootCause, failureModeId, newOccurrenceRPN }',
    label: '1st: Updates PFMEA risk matrix with newly discovered failure modes',
    isFeedback: false,
    corridorTrack: -1,
    category: 'prevention',
    color: '#F59E0B',
  },
  {
    id: 'c24',
    source: 'eight_d',
    target: 'control_plan',
    orderFromSource: 2,
    shortTag: 'Add Poka-Yoke',
    payloadSpec: 'Payload: { d5PermanentFix, errorProofingSpec, reactionPlan }',
    label: '2nd: Enforces new poka-yoke controls in Dynamic Control Plan',
    isFeedback: false,
    corridorTrack: 0,
    category: 'prevention',
    color: '#10B981',
  },
  {
    id: 'c25',
    source: 'eight_d',
    target: 'knowledge_base',
    orderFromSource: 3,
    shortTag: 'Save Lesson',
    payloadSpec: 'Payload: { d8LessonLearned, horizontalDeployment[] }',
    label: '3rd: Archives verified root cause in Lessons Learned Hub',
    isFeedback: false,
    corridorTrack: 1,
    category: 'prevention',
    color: '#10B981',
  },
  {
    id: 'c26',
    source: 'capa_records',
    target: 'change_control',
    orderFromSource: 1,
    shortTag: 'Trigger ECN',
    payloadSpec: 'Payload: { capaId, toolingModification, drawingRev }',
    label: '1st: Triggers formal Engineering Change Notice (ECN)',
    isFeedback: false,
    corridorTrack: -1,
    category: 'governance',
    color: '#8B5CF6',
  },
  {
    id: 'c27',
    source: 'capa_records',
    target: 'command_center',
    orderFromSource: 2,
    shortTag: 'Track SLA',
    payloadSpec: 'Payload: { actionOwner, dueDate, effectivenessCheck }',
    label: '2nd: Tracks CAPA due dates and departmental closure SLA',
    isFeedback: false,
    corridorTrack: 1,
    category: 'governance',
    color: '#8B5CF6',
  },
  {
    id: 'c28',
    source: 'change_control',
    target: 'control_plan',
    orderFromSource: 1,
    shortTag: 'Revise Specs',
    payloadSpec: 'Payload: { ecnNumber, updatedTolerances, effectiveDate }',
    label: '1st: Revises Control Plan specifications after ECN approval',
    isFeedback: false,
    corridorTrack: 0,
    category: 'prevention',
    color: '#8B5CF6',
  },
  {
    id: 'c29',
    source: 'command_center',
    target: 'control_tower',
    orderFromSource: 1,
    shortTag: 'SLA Stream',
    payloadSpec: 'Payload: { onTimeClosureRate, overdueCount, escalations }',
    label: '1st: Broadcasts action closure KPIs to Quality Control Tower',
    isFeedback: false,
    alleyRow: 3,
    corridorTrack: 1,
    category: 'intelligence',
    color: '#8B5CF6',
  },

  // Stage 05 Outgoing
  {
    id: 'c30',
    source: 'fmea',
    target: 'control_plan',
    orderFromSource: 1,
    shortTag: 'Critical CTQs',
    payloadSpec: 'Payload: { criticalCTQs[], rpnThreshold, sampleFreq }',
    label: '1st: Transfers high-RPN characteristics to Dynamic Control Plan',
    isFeedback: false,
    corridorTrack: -1,
    category: 'prevention',
    color: '#F59E0B',
  },
  {
    id: 'c32',
    source: 'control_plan',
    target: 'spc',
    orderFromSource: 1,
    shortTag: 'Set USL / LSL',
    payloadSpec: 'Payload: { characteristicId, usl, lsl, targetCpk: 1.67 }',
    label: '1st: Sets USL/LSL specification limits for SPC control charts',
    isFeedback: false,
    corridorTrack: -1,
    category: 'intelligence',
    color: '#06B6D4',
  },
  {
    id: 'c31',
    source: 'control_plan',
    target: 'inspection_plans',
    orderFromSource: 2,
    shortTag: 'Return Specs to IPQC',
    payloadSpec: 'Feedback Loop: { controlPlanRev, newCheckpoints[], gaugeType }',
    label: '2nd (Feedback Loop): Deploys updated inspection specs back to Shopfloor IPQC',
    isFeedback: true,
    feedbackLane: 'top',
    corridorTrack: 0,
    category: 'prevention',
    color: '#F43F5E',
  },
  {
    id: 'c33',
    source: 'form_designer',
    target: 'inspection_plans',
    orderFromSource: 1,
    shortTag: 'Deploy Checklists',
    payloadSpec: 'Feedback Loop: { templateId, digitalFields[], mandatoryPhotos }',
    label: '1st (Feedback Loop): Publishes digital checklists back to Shopfloor IPQC',
    isFeedback: true,
    feedbackLane: 'bottom',
    corridorTrack: -1,
    category: 'governance',
    color: '#F43F5E',
  },
  {
    id: 'c34',
    source: 'form_designer',
    target: 'lpa',
    orderFromSource: 2,
    shortTag: 'Deploy LPA Forms',
    payloadSpec: 'Feedback Loop: { lpaFormSchema, shiftLayerRules[] }',
    label: '2nd (Feedback Loop): Deploys custom audit templates back to Shopfloor LPA',
    isFeedback: true,
    feedbackLane: 'bottom',
    corridorTrack: 1,
    category: 'governance',
    color: '#F43F5E',
  },
  {
    id: 'c35',
    source: 'knowledge_base',
    target: 'ai_copilot',
    orderFromSource: 1,
    shortTag: 'Train AI Model',
    payloadSpec: 'Payload: { solved8DVectors[], rootCauseEmbeddings }',
    label: '1st: Trains AI Copilot on historical 8D solutions & patterns',
    isFeedback: false,
    corridorTrack: 0,
    category: 'intelligence',
    color: '#06B6D4',
  },

  // Stage 06 Outgoing
  {
    id: 'c37',
    source: 'spc',
    target: 'control_tower',
    orderFromSource: 1,
    shortTag: 'Live Cpk Feed',
    payloadSpec: 'Payload: { cpkIndex, nelsonRuleViolations, oocAlerts }',
    label: '1st: Streams live Cp/Cpk capability metrics to Control Tower',
    isFeedback: false,
    corridorTrack: -1,
    category: 'intelligence',
    color: '#06B6D4',
  },
  {
    id: 'c36',
    source: 'spc',
    target: 'ai_copilot',
    orderFromSource: 2,
    shortTag: 'Drift Telemetry',
    payloadSpec: 'Payload: { xBarTrend, toolWearSlope, anomalyScore }',
    label: '2nd: Feeds process drift trends to AI for predictive alerts',
    isFeedback: false,
    corridorTrack: 1,
    category: 'intelligence',
    color: '#06B6D4',
  },
  {
    id: 'c38',
    source: 'ai_copilot',
    target: 'eight_d',
    orderFromSource: 1,
    shortTag: 'AI 8D Root Cause',
    payloadSpec: 'Feedback Loop: { predictedRootCause, confidence: 0.96, suggestedD5 }',
    label: '1st (Feedback Loop): Recommends AI-generated root causes back to 8D teams',
    isFeedback: true,
    feedbackLane: 'top',
    corridorTrack: 1,
    category: 'intelligence',
    color: '#F43F5E',
  },
  {
    id: 'c39',
    source: 'audits',
    target: 'capa_records',
    orderFromSource: 1,
    shortTag: 'Audit to CAPA',
    payloadSpec: 'Feedback Loop: { auditFindingId, clauseRef, mandatoryCapa }',
    label: '1st (Feedback Loop): Generates CAPA actions from audit non-conformities',
    isFeedback: true,
    feedbackLane: 'bottom',
    corridorTrack: 0,
    category: 'governance',
    color: '#F43F5E',
  },
];

// Master End-to-End 6-Stage Value Stream Backbone
const MASTER_BACKBONE_SEQUENCE = ['c1', 'c10', 'c11', 'c17', 'c23', 'c30', 'c32', 'c31'];

const SIMULATION_SCENARIOS: Record<
  'defect' | 'supplier' | 'prevention',
  { title: string; cableSequence: string[] }
> = {
  defect: {
    title: 'Shopfloor Closed-Loop (Steps 1➔8 + ↺ Return)',
    cableSequence: ['c1', 'c10', 'c11', 'c17', 'c23', 'c30', 'c32', 'c31'],
  },
  supplier: {
    title: 'Inbound Reject & Audit Loop (Steps 1➔5 + ↺ Return)',
    cableSequence: ['c3', 'c6', 'c5', 'c8', 'c39'],
  },
  prevention: {
    title: 'Customer 8D & AI Feedback Loop (Steps 1➔6 + ↺ Return)',
    cableSequence: ['c19', 'c20', 'c25', 'c35', 'c38', 'c24'],
  },
};

// =========================================================================
// 3. MAIN HIGH-VISIBILITY ECOSYSTEM PORTAL COMPONENT
// =========================================================================

export default function QualityEcosystemPortal() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom State (Compact 1680x762 canvas fits at ~90% native zoom!)
  const [zoom, setZoom] = useState<number>(0.88);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 16, y: 10 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);

  // Interaction State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedCableId, setSelectedCableId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSimulation, setActiveSimulation] = useState<'none' | 'defect' | 'supplier' | 'prevention'>('none');
  const [simStepIndex, setSimStepIndex] = useState<number | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [viewLens, setViewLens] = useState<'backbone' | 'all_primary' | 'feedback_bus' | 'heatmap'>('backbone');
  const [multiHopRipple, setMultiHopRipple] = useState<boolean>(true);

  // Auto-fit entire 24-node matrix at maximum possible scale inside viewport
  const fitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    const padX = 8;
    const padY = 6;
    const scaleX = (clientWidth - padX * 2) / CANVAS_WIDTH;
    const scaleY = (clientHeight - padY * 2) / CANVAS_HEIGHT;
    const optimalZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.5), 1.15);

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

  // Step-by-Step Auto-Play Timer for Simulation Flows
  useEffect(() => {
    if (!isAutoPlaying || activeSimulation === 'none') return;
    const totalSteps = SIMULATION_SCENARIOS[activeSimulation].cableSequence.length;

    const timer = window.setInterval(() => {
      setSimStepIndex((prev) => {
        if (prev === null) return 0;
        if (prev + 1 >= totalSteps) {
          return 0;
        }
        return prev + 1;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isAutoPlaying, activeSimulation]);

  // Center camera on a specific node
  const centerOnNode = useCallback(
    (nodeId: string) => {
      const targetNode = NODES.find((n) => n.id === nodeId);
      if (!targetNode || !containerRef.current) return;

      const { clientWidth, clientHeight } = containerRef.current;
      const targetZoom = Math.max(zoom, 0.95);
      const nodeCenterX = targetNode.x + NODE_WIDTH / 2;
      const nodeCenterY = targetNode.y + NODE_HEIGHT / 2;

      const targetPanX = clientWidth / 2 - nodeCenterX * targetZoom;
      const targetPanY = clientHeight / 2 - nodeCenterY * targetZoom;

      setZoom(targetZoom);
      setPan({ x: targetPanX, y: targetPanY });
      setSelectedNodeId(nodeId);
    },
    [zoom]
  );

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
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.45), 1.65);

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
  const isIdleLensActive = !activeNodeId && !selectedCableId && activeSimulation === 'none';

  // Compute sequence metadata for highlighted cables
  // Large, High-Contrast Number Medallions (50x22px with 11.5px font) sit in the 56px corridors,
  // while the full Concept Action Banner lights up across the 208px top rim of each card!
  const activeCableSequenceMap = useMemo(() => {
    const map = new Map<
      string,
      {
        stepNumber: number;
        medallionText: string;
        shortTag: string;
        isFeedback: boolean;
        isCurrentStepSpotlight: boolean;
        directionRole: 'sim' | 'input' | 'output' | 'downstream' | 'feedback' | 'ambient';
        badgeColor: string;
      }
    >();

    if (isIdleLensActive) {
      if (viewLens === 'backbone' || viewLens === 'heatmap') {
        MASTER_BACKBONE_SEQUENCE.forEach((cableId, idx) => {
          const cable = CABLES.find((c) => c.id === cableId);
          if (!cable) return;
          const stepNum = idx + 1;
          const src = NODES.find((n) => n.id === cable.source);
          const tgt = NODES.find((n) => n.id === cable.target);
          const isAdjSameCol =
            src && tgt && src.colIdx === tgt.colIdx && Math.abs(src.rowIdx - tgt.rowIdx) === 1;
          const dirArrow = cable.isFeedback
            ? `↺ 0${stepNum}`
            : isAdjSameCol
            ? tgt.rowIdx > src.rowIdx
              ? `0${stepNum} ▼`
              : `0${stepNum} ▲`
            : `0${stepNum} ➔`;

          map.set(cableId, {
            stepNumber: stepNum,
            medallionText: dirArrow,
            shortTag: cable.shortTag,
            isFeedback: cable.isFeedback,
            isCurrentStepSpotlight: true,
            directionRole: cable.isFeedback ? 'feedback' : 'ambient',
            badgeColor: cable.isFeedback ? '#F43F5E' : cable.color,
          });
        });
        return map;
      }

      if (viewLens === 'all_primary') {
        CABLES.filter((c) => c.orderFromSource === 1 && !c.isFeedback).forEach((cable, idx) => {
          const src = NODES.find((n) => n.id === cable.source);
          const tgt = NODES.find((n) => n.id === cable.target);
          const isAdjSameCol =
            src && tgt && src.colIdx === tgt.colIdx && Math.abs(src.rowIdx - tgt.rowIdx) === 1;
          map.set(cable.id, {
            stepNumber: idx + 1,
            medallionText: isAdjSameCol
              ? tgt.rowIdx > src.rowIdx
                ? '1st ▼'
                : '1st ▲'
              : '1st ➔',
            shortTag: cable.shortTag,
            isFeedback: false,
            isCurrentStepSpotlight: true,
            directionRole: 'ambient',
            badgeColor: cable.color,
          });
        });
        return map;
      }

      if (viewLens === 'feedback_bus') {
        let fbIndex = 1;
        CABLES.filter((c) => c.isFeedback).forEach((cable) => {
          map.set(cable.id, {
            stepNumber: fbIndex,
            medallionText: `↺ #${fbIndex}`,
            shortTag: cable.shortTag,
            isFeedback: true,
            isCurrentStepSpotlight: true,
            directionRole: 'feedback',
            badgeColor: '#F43F5E',
          });
          fbIndex++;
        });
        return map;
      }
    }

    if (selectedCableId && !activeNodeId && activeSimulation === 'none') {
      const cable = CABLES.find((c) => c.id === selectedCableId);
      if (cable) {
        const ord = cable.orderFromSource;
        const ordinalText = ord === 1 ? '1st' : ord === 2 ? '2nd' : ord === 3 ? '3rd' : `${ord}th`;
        map.set(cable.id, {
          stepNumber: ord,
          medallionText: cable.isFeedback ? `↺ ${ordinalText}` : `${ordinalText} ➔`,
          shortTag: cable.shortTag,
          isFeedback: cable.isFeedback,
          isCurrentStepSpotlight: true,
          directionRole: cable.isFeedback ? 'feedback' : 'output',
          badgeColor: cable.isFeedback ? '#F43F5E' : cable.color,
        });
      }
      return map;
    }

    if (activeSimulation !== 'none') {
      const seq = SIMULATION_SCENARIOS[activeSimulation].cableSequence;
      seq.forEach((cableId, idx) => {
        if (simStepIndex !== null && idx > simStepIndex) return;
        const cable = CABLES.find((c) => c.id === cableId);
        if (!cable) return;
        const stepNum = idx + 1;
        const isSpotlight = simStepIndex === null || simStepIndex === idx;
        map.set(cableId, {
          stepNumber: stepNum,
          medallionText: cable.isFeedback ? `↺ 0${stepNum}` : `0${stepNum} ➔`,
          shortTag: cable.shortTag,
          isFeedback: cable.isFeedback,
          isCurrentStepSpotlight: isSpotlight,
          directionRole: cable.isFeedback ? 'feedback' : 'sim',
          badgeColor: cable.isFeedback ? '#F43F5E' : cable.color,
        });
      });
      return map;
    }

    if (activeNodeId) {
      const incomingCables = CABLES.filter((c) => c.target === activeNodeId);
      incomingCables.forEach((cable, idx) => {
        const inNum = idx + 1;
        map.set(cable.id, {
          stepNumber: inNum,
          medallionText: cable.isFeedback ? `↺ IN${inNum}` : `IN #${inNum}`,
          shortTag: cable.shortTag,
          isFeedback: cable.isFeedback,
          isCurrentStepSpotlight: true,
          directionRole: cable.isFeedback ? 'feedback' : 'input',
          badgeColor: cable.isFeedback ? '#F43F5E' : '#38BDF8',
        });
      });

      const outgoingCables = CABLES.filter((c) => c.source === activeNodeId).sort(
        (a, b) => a.orderFromSource - b.orderFromSource
      );
      outgoingCables.forEach((cable) => {
        const ord = cable.orderFromSource;
        const ordinalText = ord === 1 ? '1st' : ord === 2 ? '2nd' : ord === 3 ? '3rd' : `${ord}th`;
        const src = NODES.find((n) => n.id === cable.source);
        const tgt = NODES.find((n) => n.id === cable.target);
        const isAdjSameCol =
          src && tgt && src.colIdx === tgt.colIdx && Math.abs(src.rowIdx - tgt.rowIdx) === 1;
        const arrowChar = isAdjSameCol ? (tgt.rowIdx > src.rowIdx ? '▼' : '▲') : '➔';

        map.set(cable.id, {
          stepNumber: ord,
          medallionText: cable.isFeedback ? `↺ ${ordinalText}` : `${ordinalText} ${arrowChar}`,
          shortTag: cable.shortTag,
          isFeedback: cable.isFeedback,
          isCurrentStepSpotlight: true,
          directionRole: cable.isFeedback ? 'feedback' : 'output',
          badgeColor: cable.isFeedback ? '#F43F5E' : '#10B981',
        });
      });

      if (multiHopRipple && selectedNodeId === activeNodeId) {
        outgoingCables.forEach((hop1Cable) => {
          if (hop1Cable.isFeedback) return;
          const hop2Cables = CABLES.filter(
            (c) => c.source === hop1Cable.target && c.orderFromSource === 1
          );
          hop2Cables.forEach((hop2) => {
            if (!map.has(hop2.id)) {
              map.set(hop2.id, {
                stepNumber: hop1Cable.orderFromSource + 10,
                medallionText: hop2.isFeedback ? `↺ H2` : `HOP 2`,
                shortTag: hop2.shortTag,
                isFeedback: hop2.isFeedback,
                isCurrentStepSpotlight: false,
                directionRole: hop2.isFeedback ? 'feedback' : 'downstream',
                badgeColor: hop2.isFeedback ? '#F43F5E' : '#F59E0B',
              });
            }
          });
        });
      }
    }

    return map;
  }, [
    isIdleLensActive,
    viewLens,
    activeNodeId,
    selectedNodeId,
    selectedCableId,
    activeSimulation,
    simStepIndex,
    multiHopRipple,
  ]);

  // Connected nodes & their large top-rim concept action banner
  const nodeSequenceBadges = useMemo(() => {
    const badgeMap = new Map<
      string,
      { text: string; color: string; isFeedback?: boolean; isPulseSpotlight?: boolean }
    >();

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
        const stepNum = idx + 1;
        badgeMap.set(cable.target, {
          text: cable.isFeedback
            ? `↺ STEP 0${stepNum} • ${cable.shortTag}`
            : `STEP 0${stepNum} ➔ ${cable.shortTag}`,
          color: cable.isFeedback ? '#F43F5E' : '#10B981',
          isFeedback: cable.isFeedback,
          isPulseSpotlight: simStepIndex === idx,
        });
      });
      return badgeMap;
    }

    if (activeNodeId) {
      badgeMap.set(activeNodeId, {
        text: '★ ACTIVE MODULE',
        color: '#38BDF8',
        isPulseSpotlight: true,
      });

      const incomingCables = CABLES.filter((c) => c.target === activeNodeId);
      incomingCables.forEach((cable, idx) => {
        badgeMap.set(cable.source, {
          text: cable.isFeedback
            ? `↺ IN #${idx + 1} • ${cable.shortTag}`
            : `📥 IN #${idx + 1} • ${cable.shortTag}`,
          color: cable.isFeedback ? '#F43F5E' : '#0EA5E9',
          isFeedback: cable.isFeedback,
        });
      });

      const outgoingCables = CABLES.filter((c) => c.source === activeNodeId).sort(
        (a, b) => a.orderFromSource - b.orderFromSource
      );
      outgoingCables.forEach((cable) => {
        const ord = cable.orderFromSource;
        const ordinalText = ord === 1 ? '1st' : ord === 2 ? '2nd' : ord === 3 ? '3rd' : `${ord}th`;
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

  // Map each node's ordered outgoing chips for direct display on the card bottom row
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
            isFeedback: c.isFeedback,
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

    const incoming = CABLES.filter((c) => c.target === node.id).map((c, idx) => {
      const srcNode = NODES.find((n) => n.id === c.source);
      return {
        cable: c,
        orderNum: idx + 1,
        sourceId: c.source,
        sourceShortName: srcNode?.shortName || c.source,
        sourceName: srcNode?.title || c.source,
      };
    });

    const outgoing = CABLES.filter((c) => c.source === node.id)
      .sort((a, b) => a.orderFromSource - b.orderFromSource)
      .map((c) => {
        const tgtNode = NODES.find((n) => n.id === c.target);
        return {
          cable: c,
          orderNum: c.orderFromSource,
          targetId: c.target,
          targetShortName: tgtNode?.shortName || c.target,
          targetName: tgtNode?.title || c.target,
        };
      });

    return { node, phase, incoming, outgoing };
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
  // 100% ORTHOGONAL PCB TRACE ROUTING ENGINE FOR COMPACT 1680x762 MATRIX
  // =========================================================================
  const computeCableGeometry = useCallback((cable: CableRelation, indexOffset: number) => {
    const src = NODES.find((n) => n.id === cable.source);
    const tgt = NODES.find((n) => n.id === cable.target);
    if (!src || !tgt) return null;

    const isSameColumn = src.colIdx === tgt.colIdx;
    const colSpan = tgt.colIdx - src.colIdx;

    const outPinOffset = (cable.orderFromSource - 2) * 18;
    const inPinOffset = (src.rowIdx - tgt.rowIdx) * 5;

    // 1A. Adjacent-Row Same-Column Direct Vertical Bridge across the 32px Inter-Row Alley
    if (isSameColumn && Math.abs(src.rowIdx - tgt.rowIdx) === 1) {
      const goingDown = tgt.rowIdx > src.rowIdx;
      const xBridge = src.x + 56;
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
      const corridorCenter = src.colIdx < 5 ? x1 + 28 : x1 + 20;
      const laneX = corridorCenter + cable.corridorTrack * 7;
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
      const laneX = corridorCenter + cable.corridorTrack * 8;

      if (Math.abs(y2 - y1) < 14) {
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

      const midX = corridorCenter;
      const midY = (y1 + y2) / 2 + cable.corridorTrack * 12;

      return { pathD, midX, midY, x1, y1, x2, y2, isCompactMedallion: true };
    }

    // 3. Multi-Column Forward Express PCB Trace (colSpan >= 2)
    // Routes through the 32px Horizontal Inter-Row Alley (y=236, 402, 568)
    if (colSpan >= 2) {
      const x1 = src.x + NODE_WIDTH;
      const y1 = src.y + NODE_HEIGHT / 2 + outPinOffset;
      const x2 = tgt.x;
      const y2 = tgt.y + NODE_HEIGHT / 2 + inPinOffset;

      const alleyIndex = cable.alleyRow || (src.rowIdx === 0 ? 1 : src.rowIdx === 3 ? 3 : 2);
      const baseAlleyY = alleyIndex === 1 ? 236 : alleyIndex === 2 ? 402 : 568;
      const alleyY = baseAlleyY + cable.corridorTrack * 4;

      const exitX = x1 + 22 + cable.corridorTrack * 6;
      const entryX = x2 - 22 + cable.corridorTrack * 6;
      const r = 8;
      const dir1 = alleyY >= y1 ? 1 : -1;
      const dir2 = y2 >= alleyY ? 1 : -1;

      const pathD = [
        `M ${x1} ${y1}`,
        `L ${exitX - r} ${y1}`,
        `Q ${exitX} ${y1} ${exitX} ${y1 + dir1 * r}`,
        `L ${exitX} ${alleyY - dir1 * r}`,
        `Q ${exitX} ${alleyY} ${exitX + r} ${alleyY}`,
        `L ${entryX - r} ${alleyY}`,
        `Q ${entryX} ${alleyY} ${entryX} ${alleyY + dir2 * r}`,
        `L ${entryX} ${y2 - dir2 * r}`,
        `Q ${entryX} ${y2} ${entryX + r} ${y2}`,
        `L ${x2} ${y2}`,
      ].join(' ');

      const corridorHop = cable.orderFromSource % 2 === 1 ? 0 : 1;
      const midCorridorX = src.x + NODE_WIDTH + 28 + corridorHop * 280;
      const midX = midCorridorX;
      const midY = alleyY;
      return { pathD, midX, midY, x1, y1, x2, y2, isCompactMedallion: true };
    }

    // 4. Orthogonal PCB Highway Routing for Closed-Loop Return / Feedback Cables (colSpan < 0)
    const x1 = src.x;
    const y1 = src.y + NODE_HEIGHT / 2;
    const x2 = tgt.x + NODE_WIDTH;
    const y2 = tgt.y + NODE_HEIGHT / 2;

    const useTopHighway = cable.feedbackLane === 'top' || (!cable.feedbackLane && y1 < 380);
    const laneTrackOffset = (indexOffset % 3) * 5;
    const highwayY = useTopHighway ? 15 + laneTrackOffset : 746 - laneTrackOffset;

    const exitCorridorX = x1 - 28;
    const entryCorridorX = x2 + 28;
    const r = 10;
    const dirToHighway = highwayY < y1 ? -1 : 1;
    const dirFromHighway = y2 > highwayY ? 1 : -1;

    const pathD = [
      `M ${x1} ${y1}`,
      `L ${exitCorridorX + r} ${y1}`,
      `Q ${exitCorridorX} ${y1} ${exitCorridorX} ${y1 + dirToHighway * r}`,
      `L ${exitCorridorX} ${highwayY - dirToHighway * r}`,
      `Q ${exitCorridorX} ${highwayY} ${exitCorridorX - r} ${highwayY}`,
      `L ${entryCorridorX + r} ${highwayY}`,
      `Q ${entryCorridorX} ${highwayY} ${entryCorridorX} ${highwayY + dirFromHighway * r}`,
      `L ${entryCorridorX} ${y2 - dirFromHighway * r}`,
      `Q ${entryCorridorX} ${y2} ${entryCorridorX - r} ${y2}`,
      `L ${x2} ${y2}`,
    ].join(' ');

    const midX = (exitCorridorX + entryCorridorX) / 2 + cable.corridorTrack * 100;
    const midY = highwayY;

    return { pathD, midX, midY, x1, y1, x2, y2, isCompactMedallion: false };
  }, []);

  // Anti-collision pass for active medallions
  const deOverlappedActiveGeometries = useMemo(() => {
    const result = new Map<
      string,
      NonNullable<ReturnType<typeof computeCableGeometry>>
    >();
    const placedPoints: Array<{ x: number; y: number }> = [];

    CABLES.forEach((cable, idx) => {
      if (!activeCableSequenceMap.has(cable.id)) return;
      const geom = computeCableGeometry(cable, idx);
      if (!geom) return;

      let adjustedY = geom.midY;
      for (let attempt = 0; attempt < 6; attempt++) {
        const collision = placedPoints.find(
          (pt) => Math.abs(pt.x - geom.midX) < 52 && Math.abs(pt.y - adjustedY) < 26
        );
        if (!collision) break;
        adjustedY += attempt % 2 === 0 ? 26 : -26;
      }

      placedPoints.push({ x: geom.midX, y: adjustedY });
      result.set(cable.id, { ...geom, midY: adjustedY });
    });

    return result;
  }, [activeCableSequenceMap, computeCableGeometry]);

  const triggerSimulation = (simType: 'defect' | 'supplier' | 'prevention') => {
    setSelectedNodeId(null);
    setSelectedCableId(null);
    if (activeSimulation === simType) {
      setActiveSimulation('none');
      setSimStepIndex(null);
      setIsAutoPlaying(false);
    } else {
      setActiveSimulation(simType);
      setSimStepIndex(0);
      setIsAutoPlaying(true);
      fitToScreen();
    }
  };

  const activePipelineSequence = useMemo(() => {
    const seqIds =
      activeSimulation !== 'none'
        ? SIMULATION_SCENARIOS[activeSimulation].cableSequence
        : MASTER_BACKBONE_SEQUENCE;
    return seqIds
      .map((id, idx) => {
        const cable = CABLES.find((c) => c.id === id);
        if (!cable) return null;
        const src = NODES.find((n) => n.id === cable.source);
        const tgt = NODES.find((n) => n.id === cable.target);
        return {
          stepNum: idx + 1,
          cable,
          src,
          tgt,
        };
      })
      .filter(Boolean);
  }, [activeSimulation]);

  return (
    <div
      className="h-full max-h-full overflow-hidden flex flex-col select-none relative w-full text-white bg-[#040812] font-sans"
      dir="ltr"
    >
      {/* ========================================================================= */}
      {/* 1. TOP COMMAND BAR */}
      {/* ========================================================================= */}
      <header className="h-12 px-3 sm:px-5 border-b border-white/10 bg-[#070d19]/95 backdrop-blur-2xl flex items-center justify-between shrink-0 z-30 gap-2">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0066CC] to-[#00A3E0] flex items-center justify-center shadow-[0_0_20px_rgba(0,163,224,0.45)] border border-sky-400/40">
            <Network className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-black text-white tracking-tight">
              QMS 4.0 Ecosystem Matrix
            </h1>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hidden xl:flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              High-Clarity Cards
            </span>
          </div>
        </div>

        {/* 4 Architectural View Lenses + Scenario Simulators */}
        <div className="hidden lg:flex items-center gap-1.5 p-1 bg-white/[0.04] border border-white/10 rounded-2xl">
          <div className="flex items-center gap-1 bg-[#0b1324] p-0.5 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => {
                setActiveSimulation('none');
                setSelectedNodeId(null);
                setSelectedCableId(null);
                setViewLens('backbone');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                isIdleLensActive && viewLens === 'backbone'
                  ? 'bg-sky-500 text-slate-950 font-black shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Backbone (1➔8)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSimulation('none');
                setSelectedNodeId(null);
                setSelectedCableId(null);
                setViewLens('all_primary');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                isIdleLensActive && viewLens === 'all_primary'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>All 1st Links</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSimulation('none');
                setSelectedNodeId(null);
                setSelectedCableId(null);
                setViewLens('feedback_bus');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                isIdleLensActive && viewLens === 'feedback_bus'
                  ? 'bg-rose-500 text-white font-black shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                  : 'text-rose-300 hover:text-white'
              }`}
            >
              <CornerUpLeft className="w-3.5 h-3.5" />
              <span>↺ Feedback (7)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSimulation('none');
                setSelectedNodeId(null);
                setSelectedCableId(null);
                setViewLens('heatmap');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewLens === 'heatmap'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                  : 'text-amber-300 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Health Heatmap</span>
            </button>
          </div>

          <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

          <button
            type="button"
            onClick={() => triggerSimulation('defect')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              activeSimulation === 'defect'
                ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                : 'bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/25'
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Shopfloor Loop</span>
          </button>

          <button
            type="button"
            onClick={() => triggerSimulation('supplier')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              activeSimulation === 'supplier'
                ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/25'
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Vendor Loop</span>
          </button>

          <button
            type="button"
            onClick={() => triggerSimulation('prevention')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              activeSimulation === 'prevention'
                ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/25'
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>AI & 8D Loop</span>
          </button>

          <button
            type="button"
            onClick={() => setMultiHopRipple((p) => !p)}
            className={`px-2 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              multiHopRipple
                ? 'bg-purple-500/25 text-purple-200 border border-purple-400/40'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
            title="When clicking a card, also trace its 2nd-hop downstream cascade"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span className="hidden 2xl:inline">2-Hop</span>
          </button>

          {(activeSimulation !== 'none' || selectedNodeId || selectedCableId || viewLens !== 'backbone') && (
            <button
              type="button"
              onClick={() => {
                setActiveSimulation('none');
                setIsAutoPlaying(false);
                setSimStepIndex(null);
                setViewLens('backbone');
                setSelectedNodeId(null);
                setSelectedCableId(null);
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search & Zoom Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <div className="flex items-center gap-1.5 bg-white/[0.05] border border-white/10 rounded-xl px-3 py-1 focus-within:border-sky-400/60 transition-colors w-36 sm:w-44">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search M-01..M-24..."
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
                    <span className="font-bold text-white">
                      <span className="text-sky-400 mr-1.5">{res.seqCode}</span>
                      {res.title}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 bg-white/[0.05] border border-white/10 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(z + 0.12, 1.6))}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-black text-slate-200 px-1 min-w-[40px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(z - 0.12, 0.45))}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3.5 bg-white/10 mx-0.5" />
            <button
              type="button"
              onClick={fitToScreen}
              className="p-1 rounded-lg hover:bg-white/10 text-sky-400 hover:text-sky-300"
              title="Fit to Screen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 1B. DOCKED INTERACTIVE SEQUENCE PIPELINE RIBBON (READABLE AT EYE LEVEL!) */}
      {/* ========================================================================= */}
      <div className="h-10 px-4 border-b border-white/10 bg-[#060b16] flex items-center justify-between gap-2 shrink-0 z-30 overflow-x-auto no-scrollbar">
        {activeNodeInfo ? (
          /* Live Node Input ➔ Module ➔ Ordered Output Equation at Eye Level! */
          <div className="flex items-center gap-2 text-xs w-full justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 shrink-0">
                📥 Inputs ({activeNodeInfo.incoming.length})
              </span>
              {activeNodeInfo.incoming.map((inc) => (
                <button
                  key={inc.cable.id}
                  type="button"
                  onClick={() => setSelectedNodeId(inc.sourceId)}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-bold flex items-center gap-1 shrink-0 border ${
                    inc.cable.isFeedback
                      ? 'bg-rose-500/20 text-rose-200 border-rose-500/40'
                      : 'bg-white/[0.06] text-slate-100 border-white/15 hover:bg-white/15'
                  }`}
                >
                  <span className="font-black text-sky-400">
                    {inc.cable.isFeedback ? `↺ IN#${inc.orderNum}` : `IN#${inc.orderNum}`}
                  </span>
                  <span>{inc.sourceShortName}</span>
                  <span className="text-[10.5px] text-slate-300">({inc.cable.shortTag})</span>
                </button>
              ))}

              <ArrowRight className="w-4 h-4 text-sky-400 shrink-0 mx-1" />

              {/* Center Selected Module Pill */}
              <div className="px-3 py-0.5 rounded-lg bg-sky-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shrink-0 shadow-[0_0_15px_rgba(56,189,248,0.5)]">
                <span>★ {activeNodeInfo.node.seqCode}</span>
                <span>{activeNodeInfo.node.title}</span>
              </div>

              <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0 mx-1" />

              {/* Ordered Outgoing Sequence Pills (1st, 2nd, 3rd) */}
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                📤 Order ({activeNodeInfo.outgoing.length})
              </span>
              {activeNodeInfo.outgoing.map((out) => {
                const ord =
                  out.orderNum === 1
                    ? '1st'
                    : out.orderNum === 2
                    ? '2nd'
                    : out.orderNum === 3
                    ? '3rd'
                    : `${out.orderNum}th`;
                return (
                  <button
                    key={out.cable.id}
                    type="button"
                    onClick={() => setSelectedNodeId(out.targetId)}
                    className={`px-2.5 py-0.5 rounded-md text-xs font-bold flex items-center gap-1 shrink-0 border ${
                      out.cable.isFeedback
                        ? 'bg-rose-500/20 text-rose-200 border-rose-500/40'
                        : 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30 hover:bg-emerald-500/25'
                    }`}
                  >
                    <span
                      className={`px-1.5 rounded text-[10.5px] font-black ${
                        out.cable.isFeedback
                          ? 'bg-rose-500 text-white'
                          : 'bg-emerald-400 text-slate-950'
                      }`}
                    >
                      {out.cable.isFeedback ? `↺ ${ord}` : `${ord} ➔`}
                    </span>
                    <span>{out.targetShortName}</span>
                    <span className="text-[10.5px] text-emerald-300">
                      ({out.cable.shortTag})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Default / Simulation Ordered Step-by-Step Pipeline Ribbon */
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 shrink-0 mr-1">
                {activeSimulation !== 'none'
                  ? SIMULATION_SCENARIOS[activeSimulation].title
                  : '⚡ Master Sequence (01 ➔ 08)'}
              </span>

              {activePipelineSequence.map((item, idx) => {
                if (!item) return null;
                const isSelectedStep =
                  selectedCableId === item.cable.id ||
                  (activeSimulation !== 'none' && simStepIndex === idx);
                return (
                  <div key={item.cable.id} className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (activeSimulation !== 'none') {
                          setIsAutoPlaying(false);
                          setSimStepIndex(idx);
                        } else {
                          setSelectedNodeId(null);
                          setSelectedCableId(
                            selectedCableId === item.cable.id ? null : item.cable.id
                          );
                        }
                      }}
                      className={`px-2.5 py-0.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all border ${
                        isSelectedStep
                          ? item.cable.isFeedback
                            ? 'bg-rose-500 text-white border-white shadow scale-105'
                            : 'bg-sky-400 text-slate-950 border-white shadow scale-105 font-black'
                          : item.cable.isFeedback
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25'
                          : 'bg-white/[0.05] text-slate-200 border-white/10 hover:bg-white/15'
                      }`}
                    >
                      <span
                        className={`px-1 rounded text-[10px] font-black ${
                          item.cable.isFeedback
                            ? 'bg-rose-500 text-white'
                            : 'bg-sky-500/30 text-sky-300'
                        }`}
                      >
                        {item.cable.isFeedback ? `↺ 0${item.stepNum}` : `0${item.stepNum}`}
                      </span>
                      <span className="font-extrabold text-white">
                        {item.src?.shortName} ➔ {item.tgt?.shortName}
                      </span>
                      <span className="text-[10.5px] text-sky-300 font-semibold hidden 2xl:inline">
                        ({item.cable.shortTag})
                      </span>
                    </button>
                    {idx < activePipelineSequence.length - 1 && (
                      <span className="text-slate-500 text-xs font-black">➔</span>
                    )}
                  </div>
                );
              })}
            </div>

            {activeSimulation !== 'none' && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsAutoPlaying(false);
                    const total = SIMULATION_SCENARIOS[activeSimulation].cableSequence.length;
                    setSimStepIndex((prev) =>
                      prev === null ? total - 1 : (prev - 1 + total) % total
                    );
                  }}
                  className="p-1 rounded bg-white/5 hover:bg-white/15 text-white"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAutoPlaying((p) => !p)}
                  className="px-2.5 py-0.5 rounded bg-sky-500 text-slate-950 text-xs font-black flex items-center gap-1"
                >
                  {isAutoPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isAutoPlaying ? 'Pause' : 'Play'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAutoPlaying(false);
                    const total = SIMULATION_SCENARIOS[activeSimulation].cableSequence.length;
                    setSimStepIndex((prev) => (prev === null ? 0 : (prev + 1) % total));
                  }}
                  className="p-1 rounded bg-white/5 hover:bg-white/15 text-white"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE NODE CANVAS (COMPACT 1680x762 FOR LARGE CARD READABILITY!) */}
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

        {/* Transform Layer */}
        <div
          className="absolute top-0 left-0 transition-transform duration-75 origin-top-left pointer-events-auto"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
          }}
        >
          {/* Dedicated Top & Bottom PCB Feedback Bus Tracks */}
          <div className="absolute left-[298px] right-[18px] top-[3px] h-[22px] rounded-full border border-rose-500/25 bg-rose-950/20 flex items-center justify-between px-5 pointer-events-none">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
              <span>↺ CLOSED-LOOP FEEDBACK BUS A (RETURN TO STAGE 04 / STAGE 02)</span>
            </span>
            <span className="text-[10px] font-bold text-rose-300/80">
              AI Copilot ➔ 8D Root Cause • Control Plan ➔ In-Process IPQC
            </span>
          </div>

          <div className="absolute left-[298px] right-[18px] bottom-[3px] h-[22px] rounded-full border border-rose-500/25 bg-rose-950/20 flex items-center justify-between px-5 pointer-events-none">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
              <span>↺ CLOSED-LOOP FEEDBACK BUS B (RETURN TO STAGE 04 / STAGE 02)</span>
            </span>
            <span className="text-[10px] font-bold text-rose-300/80">
              ISO Audits ➔ CAPA Plan • Smart Checklists ➔ IPQC & LPA Audits
            </span>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* 6 STAGE ZONES WITH BOLD READABLE HEADERS */}
          {/* ------------------------------------------------------------- */}
          {PHASES.map((phase) => {
            const isStageIlluminated = activeStageIds.has(phase.id);
            return (
              <div
                key={phase.id}
                style={{
                  left: `${phase.x}px`,
                  top: '30px',
                  width: `${phase.width}px`,
                  height: '702px',
                  boxShadow: isStageIlluminated
                    ? `0 0 35px -5px ${phase.color}30, inset 0 0 20px ${phase.color}15`
                    : 'none',
                }}
                className={`absolute rounded-2xl border ${
                  isStageIlluminated ? 'border-white/35' : phase.borderColor
                } bg-gradient-to-b ${phase.bgGradient} px-3 py-2.5 pointer-events-none transition-all duration-300`}
              >
                <div className="flex items-center gap-2.5 border-b border-white/10 pb-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg border border-white/20 shrink-0"
                    style={{
                      backgroundColor: phase.color + '28',
                      color: phase.color,
                    }}
                  >
                    <phase.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span
                      className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{ backgroundColor: phase.color + '28', color: phase.color }}
                    >
                      {phase.gateLabel}
                    </span>
                    <h3 className="text-[15.5px] font-black text-white leading-tight mt-0.5 truncate">
                      {phase.title}
                    </h3>
                  </div>
                </div>
              </div>
            );
          })}

          {/* ------------------------------------------------------------- */}
          {/* LAYER 1: BACKGROUND CABLES (SUBTLE PCB TRACES) */}
          {/* ------------------------------------------------------------- */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}
          >
            <defs>
              <marker
                id="arrowMuted"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148, 163, 184, 0.35)" />
              </marker>
              <marker
                id="arrowFeedbackMuted"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(244, 63, 94, 0.42)" />
              </marker>
            </defs>

            {CABLES.map((cable, idx) => {
              if (activeCableSequenceMap.has(cable.id)) return null;
              const geom = computeCableGeometry(cable, idx);
              if (!geom) return null;

              return (
                <g key={cable.id}>
                  <path
                    d={geom.pathD}
                    fill="none"
                    stroke={
                      cable.isFeedback
                        ? 'rgba(244, 63, 94, 0.18)'
                        : 'rgba(148, 163, 184, 0.13)'
                    }
                    strokeWidth={cable.isFeedback ? '1.5' : '1.2'}
                    strokeDasharray={cable.isFeedback ? '8, 5' : '4, 5'}
                    markerEnd={
                      cable.isFeedback ? 'url(#arrowFeedbackMuted)' : 'url(#arrowMuted)'
                    }
                  />
                  <path
                    d={geom.pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="12"
                    className="pointer-events-auto cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(null);
                      setActiveSimulation('none');
                      setSelectedCableId(cable.id === selectedCableId ? null : cable.id);
                    }}
                  />
                </g>
              );
            })}
          </svg>

          {/* ------------------------------------------------------------- */}
          {/* LAYER 2: 24 HIGH-VISIBILITY BILLBOARD CARDS (LARGE FONTS!) */}
          {/* ------------------------------------------------------------- */}
          {NODES.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isHovered = hoveredNodeId === node.id;
            const seqBadge = nodeSequenceBadges.get(node.id);
            const isConnected = Boolean(seqBadge);
            const isDimmed =
              !isIdleLensActive &&
              (activeNodeId || selectedCableId || activeSimulation !== 'none') &&
              !isConnected;
            const phase = PHASES.find((p) => p.id === node.phaseId);

            const heatmapColor =
              node.healthScore >= 97
                ? '#10B981'
                : node.healthScore >= 93
                ? '#F59E0B'
                : '#EF4444';
            const themeColor =
              viewLens === 'heatmap' ? heatmapColor : phase?.color || '#0EA5E9';
            const outgoingChips = nodeOutgoingChipsMap[node.id] || [];

            return (
              <div
                key={node.id}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: `${NODE_WIDTH}px`,
                  height: `${NODE_HEIGHT}px`,
                  boxShadow:
                    isSelected || isHovered || seqBadge?.isPulseSpotlight
                      ? `0 18px 40px -5px ${seqBadge?.color || themeColor}70, 0 0 0 2.5px ${
                          seqBadge?.color || themeColor
                        }`
                      : viewLens === 'heatmap' && node.healthScore <= 92
                      ? `0 0 30px rgba(239, 68, 68, 0.55), 0 0 0 2px #EF4444`
                      : isConnected
                      ? `0 10px 28px -5px ${seqBadge?.color || themeColor}45, 0 0 0 2px ${
                          seqBadge?.color || themeColor
                        }`
                      : '0 10px 28px -10px rgba(0, 0, 0, 0.85)',
                }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={() => {
                  if (hasMoved) return;
                  setSelectedCableId(null);
                  setSelectedNodeId(node.id === selectedNodeId ? null : node.id);
                }}
                onDoubleClick={() => {
                  navigate(node.path);
                }}
                className={`absolute rounded-2xl overflow-visible flex flex-col justify-between cursor-pointer transition-all duration-200 z-20 group backdrop-blur-xl ${
                  isSelected || seqBadge?.isPulseSpotlight
                    ? 'bg-[#12203a] scale-[1.03]'
                    : isHovered
                    ? 'bg-[#101c33] scale-[1.02]'
                    : isConnected
                    ? 'bg-[#0d172a]'
                    : 'bg-[#09111f]/95 border border-white/15 hover:border-white/30'
                } ${isDimmed ? 'opacity-20' : 'opacity-100'}`}
              >
                {/* LARGE, FULL-RIM ACTION BANNER ON TOP OF CARD (11px Font, Never Truncates!) */}
                {seqBadge && (
                  <div
                    style={{
                      backgroundColor: seqBadge.color,
                      boxShadow: `0 4px 14px ${seqBadge.color}80`,
                    }}
                    className="absolute -top-3 right-2 px-2.5 py-0.5 rounded-full text-[10.5px] font-black text-slate-950 tracking-wide uppercase z-30 flex items-center gap-1 border border-white/70 whitespace-nowrap shadow-md"
                  >
                    <span>{seqBadge.text}</span>
                  </div>
                )}

                {/* Top Neon Accent Bar */}
                <div
                  className="h-1.5 w-full shrink-0 rounded-t-2xl"
                  style={{
                    background: `linear-gradient(90deg, ${themeColor}, ${themeColor}40)`,
                  }}
                />

                {/* Left Input Terminal Pin */}
                <div
                  style={{
                    top: '50%',
                    backgroundColor: isConnected ? seqBadge?.color || themeColor : '#334155',
                  }}
                  className="absolute -left-2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-[#040812] flex items-center justify-center text-[7px] font-black text-slate-950"
                >
                  ►
                </div>

                {/* Right Numbered Output Terminal Pins (1, 2, 3) */}
                {[-18, 0, 18].map((offsetY, pinIdx) => {
                  const hasPort = outgoingChips.some((ch) => ch.orderNum === pinIdx + 1);
                  if (!hasPort) return null;
                  const chip = outgoingChips.find((ch) => ch.orderNum === pinIdx + 1);
                  return (
                    <div
                      key={`out-${pinIdx}`}
                      style={{
                        top: `calc(50% + ${offsetY}px)`,
                        backgroundColor: chip?.isFeedback
                          ? '#F43F5E'
                          : isConnected
                          ? seqBadge?.color || themeColor
                          : '#1E293B',
                        borderColor: chip?.isFeedback ? '#FDA4AF' : themeColor,
                      }}
                      className="absolute -right-2 -translate-y-1/2 w-4 h-4 rounded-full border text-[8.5px] font-black text-white flex items-center justify-center shadow"
                      title={`Output #${pinIdx + 1} ➔ ${chip?.targetShortName} (${chip?.shortTag})`}
                    >
                      {pinIdx + 1}
                    </div>
                  );
                })}

                {/* Card Content — 3 BIG, BOLD, CRYSTAL-CLEAR ROWS */}
                <div className="p-2.5 flex-1 flex flex-col justify-between overflow-hidden rounded-b-2xl">
                  {/* ROW 1: Large Icon + M-Code + BIG 16px BOLD TITLE */}
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 border border-white/20 shadow-inner"
                      style={{
                        background: `linear-gradient(135deg, ${themeColor}40, ${themeColor}15)`,
                        color: themeColor,
                      }}
                    >
                      <node.icon className="w-4 h-4" />
                      <span className="text-[9px] font-black text-white leading-none mt-0.5">
                        {node.seqCode}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-[15.5px] font-black text-white group-hover:text-sky-300 transition-colors leading-tight tracking-tight">
                        {node.title}
                      </h4>
                    </div>
                  </div>

                  {/* ROW 2: CONCISE 3-WORD CONCEPT TAGLINE (13px Bold!) + KPI PILL */}
                  <div className="flex items-center justify-between gap-1.5 bg-white/[0.05] px-2.5 py-1.5 rounded-xl border border-white/10">
                    <span
                      className="text-[12.5px] font-extrabold tracking-tight truncate"
                      style={{ color: '#E2E8F0' }}
                    >
                      {node.conceptTagline}
                    </span>
                    <span
                      className="text-[10.5px] font-black px-1.5 py-0.5 rounded-md shrink-0"
                      style={{
                        backgroundColor: `${themeColor}25`,
                        color: themeColor,
                      }}
                    >
                      {node.kpiMetric}
                    </span>
                  </div>

                  {/* ROW 3: LARGE ORDERED SEQUENCE CHIPS (1➔, 2➔, ↺3➔) + OPEN BUTTON */}
                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                      {outgoingChips.length > 0 ? (
                        outgoingChips.map((chip) => (
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
                            }}
                            title={`Step #${chip.orderNum}: ${chip.shortTag} ➔ ${chip.targetShortName}`}
                            className={`px-2 py-0.5 rounded-md text-[10.5px] font-black whitespace-nowrap border transition-all ${
                              chip.isFeedback
                                ? 'bg-rose-500/25 text-rose-200 border-rose-500/50 hover:bg-rose-500 hover:text-white'
                                : 'bg-white/[0.08] text-white border-white/20 hover:bg-emerald-400 hover:text-slate-950'
                            }`}
                          >
                            {chip.isFeedback
                              ? `↺${chip.orderNum}➔${chip.targetShortName}`
                              : `${chip.orderNum}➔${chip.targetShortName}`}
                          </button>
                        ))
                      ) : (
                        <span className="text-[10.5px] text-cyan-300 font-black px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30">
                          ★ 360° KPI Hub
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(node.path);
                      }}
                      style={{
                        backgroundColor: isHovered ? themeColor : 'rgba(255,255,255,0.12)',
                        color: '#ffffff',
                      }}
                      className="px-2 py-0.5 rounded-lg text-[11px] font-black flex items-center gap-0.5 shrink-0 transition-all shadow-sm hover:scale-105"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* ------------------------------------------------------------- */}
          {/* LAYER 3: FOREGROUND PCB TRACES & LARGE CORRIDOR STEP PILLS */}
          {/* ------------------------------------------------------------- */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-30"
            style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}
          >
            <defs>
              <filter id="laserGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              <marker
                id="arrowActiveGreen"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6.5"
                markerHeight="6.5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#10B981" />
              </marker>

              <marker
                id="arrowActiveBlue"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6.5"
                markerHeight="6.5"
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
                markerWidth="7"
                markerHeight="7"
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
                          ? '3.2'
                          : '2.8'
                        : '2.2'
                    }
                    strokeDasharray={seqMeta.isFeedback ? '9, 5' : 'none'}
                    filter="url(#laserGlow)"
                    markerEnd={markerId}
                  />

                  {/* Dual Live Travelling Energy Orbs */}
                  <circle
                    r={seqMeta.isCurrentStepSpotlight ? '4.5' : '3.2'}
                    fill="#ffffff"
                    filter="url(#laserGlow)"
                  >
                    <animateMotion
                      dur={seqMeta.isFeedback ? '2.1s' : '1.4s'}
                      repeatCount="indefinite"
                      path={geom.pathD}
                    />
                  </circle>
                  <circle
                    r={seqMeta.isCurrentStepSpotlight ? '3.5' : '2.8'}
                    fill={strokeColor}
                    filter="url(#laserGlow)"
                  >
                    <animateMotion
                      dur={seqMeta.isFeedback ? '2.1s' : '1.4s'}
                      begin="0.7s"
                      repeatCount="indefinite"
                      path={geom.pathD}
                    />
                  </circle>

                  {/* HIGH-CONTRAST LARGE-FONT CORRIDOR NUMBER PILL (50x22px with 11.5px Bold Font!) */}
                  <g
                    transform={`translate(${geom.midX}, ${geom.midY})`}
                    className="pointer-events-auto cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(null);
                      setActiveSimulation('none');
                      setSelectedCableId(cable.id === selectedCableId ? null : cable.id);
                    }}
                  >
                    {geom.isCompactMedallion ? (
                      <>
                        <rect
                          x="-25"
                          y="-11"
                          width="50"
                          height="22"
                          rx="11"
                          fill={strokeColor}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          fill="#040812"
                          fontSize="11.5"
                          fontWeight="900"
                          letterSpacing="0.02em"
                        >
                          {seqMeta.medallionText}
                        </text>
                      </>
                    ) : (
                      /* Highway Return Bus Capsule (sits in the Top/Bottom Highway above/below all cards) */
                      <>
                        <rect
                          x="-95"
                          y="-11"
                          width="190"
                          height="22"
                          rx="11"
                          fill="#050b16"
                          stroke={strokeColor}
                          strokeWidth="2"
                        />
                        <rect
                          x="-93"
                          y="-9"
                          width="54"
                          height="18"
                          rx="9"
                          fill={strokeColor}
                        />
                        <text
                          x="-66"
                          y="3.5"
                          textAnchor="middle"
                          fill="#040812"
                          fontSize="10.5"
                          fontWeight="900"
                        >
                          {seqMeta.medallionText}
                        </text>
                        <text
                          x="24"
                          y="3.5"
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="10.5"
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
      <div className="h-11 px-4 border-t border-white/10 bg-[#070d19]/95 backdrop-blur-2xl flex items-center justify-between shrink-0 z-30 gap-3 overflow-x-auto no-scrollbar">
        {activeCableInfo ? (
          <div className="w-full flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-black text-slate-950 uppercase"
                style={{ backgroundColor: activeCableInfo.cable.color }}
              >
                {activeCableInfo.cable.isFeedback
                  ? `↺ RETURN LOOP`
                  : `STEP #${activeCableInfo.cable.orderFromSource}`}
              </span>
              <span className="font-black text-white text-sm">
                {activeCableInfo.srcNode?.title}
              </span>
              <ArrowRight className="w-4 h-4 text-sky-400" />
              <span className="font-black text-emerald-300 text-sm">
                {activeCableInfo.tgtNode?.title}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono bg-white/[0.06] px-3 py-1 rounded-lg border border-white/10 text-sky-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{activeCableInfo.cable.payloadSpec}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-slate-200 text-xs font-semibold hidden xl:inline">
                {activeCableInfo.cable.label}
              </span>
              {selectedCableId && (
                <button
                  type="button"
                  onClick={() => setSelectedCableId(null)}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        ) : activeNodeInfo ? (
          <div className="w-full flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="px-2.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-black">
                {activeNodeInfo.node.seqCode}
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
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10"
                >
                  Unpin
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate(activeNodeInfo.node.path)}
                className="px-3.5 py-1 rounded-lg bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white text-xs font-black flex items-center gap-1.5 shadow-md hover:scale-105 transition-all whitespace-nowrap"
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
                <span>Large Billboard Cards • Concise 3-Word Concept Taglines • High-Contrast Step Pills</span>
              </span>
            </div>
            <span className="text-xs text-slate-300 hidden md:inline">
              Hover any card to see its full <strong>📥 Inputs ➔ ★ Module ➔ 📤 Ordered Sequence (1st, 2nd, 3rd)</strong> in the top bar
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
