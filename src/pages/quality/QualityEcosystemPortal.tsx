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
  type LucideIcon,
} from 'lucide-react';

interface BlueprintNode {
  id: string;
  seqCode: string;
  title: string;
  path: string;
  icon: LucideIcon;
  badge: string;
  kpiMetric: string;
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
  orderFromSource: number;
  shortTag: string;
  label: string;
  isFeedback: boolean;
  feedbackLane?: 'top' | 'bottom' | 'local';
  category: 'defect' | 'governance' | 'prevention' | 'supplier' | 'intelligence';
  color: string;
}

// =========================================================================
// 1. GRID DIMENSIONS & 6 CORE STAGES (LEFT-TO-RIGHT ENGLISH FLOW)
// =========================================================================

const NODE_WIDTH = 252;
const NODE_HEIGHT = 158;
const CANVAS_WIDTH = 1960;
const CANVAS_HEIGHT = 890;

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
  // Stage 01: Supply Chain & Inbound (x: 54)
  {
    id: 'iqc',
    seqCode: 'M-01',
    title: 'Incoming Inspection (IQC)',
    path: '/inspection',
    icon: Truck,
    badge: 'INBOUND QC',
    kpiMetric: '98.4% Lot Pass',
    description: 'Inspect incoming raw materials and shipments against AQL sampling plans.',
    phaseId: 'supply_chain',
    x: 54,
    y: 118,
  },
  {
    id: 'suppliers',
    seqCode: 'M-02',
    title: 'Supplier Quality Scorecard',
    path: '/supplier-quality',
    icon: Building,
    badge: 'VENDOR RATING',
    kpiMetric: 'A-Tier: 94.2%',
    description: 'Track supplier quality ratings automatically based on lot acceptance and defects.',
    phaseId: 'supply_chain',
    x: 54,
    y: 300,
  },
  {
    id: 'calibration',
    seqCode: 'M-03',
    title: 'Metrology & Calibration',
    path: '/calibration',
    icon: Wrench,
    badge: 'GAUGE CONTROL',
    kpiMetric: '100% Calibrated',
    description: 'Manage measurement tool certificates and calibration schedules for accurate testing.',
    phaseId: 'supply_chain',
    x: 54,
    y: 482,
  },
  {
    id: 'master_data',
    seqCode: 'M-04',
    title: 'Master Data & Catalogs',
    path: '/quality-master-data',
    icon: Database,
    badge: 'CORE STANDARDS',
    kpiMetric: '1,420 Specs',
    description: 'Configure parts, standard defect catalogs, production lines, and acceptance criteria.',
    phaseId: 'supply_chain',
    x: 54,
    y: 664,
  },

  // Stage 02: Shopfloor & Production (x: 374)
  {
    id: 'daily_defects',
    seqCode: 'M-05',
    title: 'Real-Time Defect Logger',
    path: '/defect-log',
    icon: Activity,
    badge: 'SHOPFLOOR LOG',
    kpiMetric: 'Live Pareto',
    description: 'Capture live production defects with photos, machine IDs, shifts, and Pareto analytics.',
    phaseId: 'shopfloor',
    x: 374,
    y: 118,
  },
  {
    id: 'inspection_plans',
    seqCode: 'M-06',
    title: 'In-Process Inspection (IPQC)',
    path: '/quality-inspection-plans',
    icon: CheckCircle2,
    badge: 'PROCESS GATES',
    kpiMetric: 'FPI & Patrol',
    description: 'Execute in-process quality checks and mandatory First Piece Inspection approvals.',
    phaseId: 'shopfloor',
    x: 374,
    y: 300,
  },
  {
    id: 'lpa',
    seqCode: 'M-07',
    title: 'Layered Process Audits',
    path: '/quality-audits',
    icon: Layers,
    badge: 'LPA AUDITS',
    kpiMetric: '96% Compliance',
    description: 'Verify operator adherence to standard work instructions across all production shifts.',
    phaseId: 'shopfloor',
    x: 374,
    y: 482,
  },
  {
    id: 'setup_readiness',
    seqCode: 'M-08',
    title: 'Line Setup & Readiness',
    path: '/quality-execution-board',
    icon: Sliders,
    badge: 'LINE CLEARANCE',
    kpiMetric: 'Go / No-Go',
    description: 'Validate machine parameters and issue formal Go/No-Go line startup authorization.',
    phaseId: 'shopfloor',
    x: 374,
    y: 664,
  },

  // Stage 03: Containment & NCR (x: 694)
  {
    id: 'ncr',
    seqCode: 'M-09',
    title: 'Non-Conformance (NCR)',
    path: '/quality/records/ncr',
    icon: AlertTriangle,
    badge: 'QUARANTINE',
    kpiMetric: 'MRB Hold Gate',
    description: 'Isolate non-conforming batches, issue hold tags, and trigger formal disposition.',
    phaseId: 'nonconformance',
    x: 694,
    y: 118,
  },
  {
    id: 'deviation',
    seqCode: 'M-10',
    title: 'Process Deviations',
    path: '/deviation',
    icon: FileWarning,
    badge: 'CONCESSION',
    kpiMetric: 'Temp Waiver',
    description: 'Manage temporary engineering concessions and conditional material approvals.',
    phaseId: 'nonconformance',
    x: 694,
    y: 300,
  },
  {
    id: 'complaints',
    seqCode: 'M-11',
    title: 'Customer Complaints',
    path: '/complaints',
    icon: Building,
    badge: 'VOICE OF CUSTOMER',
    kpiMetric: 'RMA & Warranty',
    description: 'Track customer returns and RMA claims with instant linkage to NCR and 8D.',
    phaseId: 'nonconformance',
    x: 694,
    y: 482,
  },
  {
    id: 'defect_cost',
    seqCode: 'M-12',
    title: 'Cost of Poor Quality',
    path: '/defect-cost',
    icon: DollarSign,
    badge: 'COPQ FINANCE',
    kpiMetric: 'Scrap & Rework',
    description: 'Calculate financial impact of scrap, rework, sorting, and warranty returns.',
    phaseId: 'nonconformance',
    x: 694,
    y: 664,
  },

  // Stage 04: Root Cause & CAPA (x: 1014)
  {
    id: 'capa_records',
    seqCode: 'M-13',
    title: 'CAPA Action Plans',
    path: '/quality/records/capa',
    icon: CheckCheck,
    badge: 'PREVENTIVE ACTION',
    kpiMetric: 'Verified Closure',
    description: 'Drive verified corrective and preventive action plans across cross-functional teams.',
    phaseId: 'root_cause',
    x: 1014,
    y: 118,
  },
  {
    id: 'eight_d',
    seqCode: 'M-14',
    title: '8D Root Cause Analysis',
    path: '/quality/records/8d',
    icon: RefreshCw,
    badge: '8D METHODOLOGY',
    kpiMetric: '5-Why & Ishikawa',
    description: 'Conduct structured root cause investigations using Fishbone and 5-Why tools.',
    phaseId: 'root_cause',
    x: 1014,
    y: 300,
  },
  {
    id: 'change_control',
    seqCode: 'M-15',
    title: 'Engineering Change (ECN)',
    path: '/change-control',
    icon: Sliders,
    badge: '4M CHANGE GOV',
    kpiMetric: 'Design & Tooling',
    description: 'Govern and document changes to design, tooling, machines, or raw materials.',
    phaseId: 'root_cause',
    x: 1014,
    y: 482,
  },
  {
    id: 'command_center',
    seqCode: 'M-16',
    title: 'Action Command Center',
    path: '/quality-command-center',
    icon: Workflow,
    badge: 'EXECUTION SLA',
    kpiMetric: '95% On-Time SLA',
    description: 'Monitor overdue tasks, action closure velocity, and departmental accountability.',
    phaseId: 'root_cause',
    x: 1014,
    y: 664,
  },

  // Stage 05: Engineering & Prevention (x: 1334)
  {
    id: 'fmea',
    seqCode: 'M-17',
    title: 'Risk Analysis (PFMEA)',
    path: '/fmea',
    icon: ShieldCheck,
    badge: 'RISK MATRIX',
    kpiMetric: 'Dynamic RPN',
    description: 'Evaluate Severity, Occurrence, and Detection (RPN) to prevent potential failures.',
    phaseId: 'engineering',
    x: 1334,
    y: 118,
  },
  {
    id: 'control_plan',
    seqCode: 'M-18',
    title: 'Dynamic Control Plan',
    path: '/control-plan',
    icon: Sliders,
    badge: 'PROCESS SPECS',
    kpiMetric: 'Poka-Yoke Specs',
    description: 'Define critical control characteristics, inspection frequencies, and reaction plans.',
    phaseId: 'engineering',
    x: 1334,
    y: 300,
  },
  {
    id: 'knowledge_base',
    seqCode: 'M-19',
    title: 'Lessons Learned Hub',
    path: '/quality-knowledge-base',
    icon: BookOpen,
    badge: 'KNOWLEDGE BASE',
    kpiMetric: 'Solved 8D Vault',
    description: 'Institutionalize solved 8D cases and best practices to prevent recurring defects.',
    phaseId: 'engineering',
    x: 1334,
    y: 482,
  },
  {
    id: 'form_designer',
    seqCode: 'M-20',
    title: 'Smart Form Designer',
    path: '/quality-form-designer',
    icon: Layers,
    badge: 'NO-CODE STUDIO',
    kpiMetric: 'Digital Checklists',
    description: 'Build custom digital inspection checklists and deploy them to shopfloor stations.',
    phaseId: 'engineering',
    x: 1334,
    y: 664,
  },

  // Stage 06: SPC & AI Intelligence (x: 1654)
  {
    id: 'spc',
    seqCode: 'M-21',
    title: 'Statistical Control (SPC)',
    path: '/spc',
    icon: TrendingUp,
    badge: 'SIX SIGMA CPK',
    kpiMetric: 'Cpk 1.67 Live',
    description: 'Real-time X-Bar R control charts and Cp/Cpk capability indices for early drift detection.',
    phaseId: 'intelligence',
    x: 1654,
    y: 118,
  },
  {
    id: 'control_tower',
    seqCode: 'M-22',
    title: 'Quality Control Tower',
    path: '/quality-control-tower',
    icon: BarChart3,
    badge: '360° OVERSIGHT',
    kpiMetric: 'Plant Telemetry',
    description: 'Unified executive command center for plant-wide quality KPIs and live stream alerts.',
    phaseId: 'intelligence',
    x: 1654,
    y: 300,
  },
  {
    id: 'ai_copilot',
    seqCode: 'M-23',
    title: 'AI Quality Copilot',
    path: '/ai/defect-prediction',
    icon: Sparkles,
    badge: 'PREDICTIVE AI',
    kpiMetric: '97% Forecast Acc',
    description: 'Predict defect spikes, analyze complex correlations, and auto-draft 8D root causes.',
    phaseId: 'intelligence',
    x: 1654,
    y: 482,
  },
  {
    id: 'audits',
    seqCode: 'M-24',
    title: 'System & Process Audits',
    path: '/audit',
    icon: ShieldCheck,
    badge: 'ISO / IATF AUDIT',
    kpiMetric: 'IATF 16949 Ready',
    description: 'Schedule internal and external compliance audits, track findings, and verify closure.',
    phaseId: 'intelligence',
    x: 1654,
    y: 664,
  },
];

// =========================================================================
// 2. ORDERED & SEQUENCED RELATIONSHIPS WITH DEDICATED FEEDBACK LANES
// =========================================================================

const CABLES: CableRelation[] = [
  // Stage 01 Outgoing (Supply Chain & Inbound)
  {
    id: 'c1',
    source: 'master_data',
    target: 'inspection_plans',
    orderFromSource: 1,
    shortTag: 'Defect Catalogs',
    label: '1st: Feeds standard defect catalogs & acceptance specs to IPQC',
    isFeedback: false,
    category: 'governance',
    color: '#10B981',
  },
  {
    id: 'c2',
    source: 'master_data',
    target: 'fmea',
    orderFromSource: 2,
    shortTag: 'BOM & Process',
    label: '2nd: Supplies part BOM & process steps for PFMEA risk analysis',
    isFeedback: false,
    category: 'governance',
    color: '#10B981',
  },
  {
    id: 'c3',
    source: 'calibration',
    target: 'iqc',
    orderFromSource: 1,
    shortTag: 'Gauge Validation',
    label: '1st: Validates measurement gauge accuracy before Incoming QC',
    isFeedback: false,
    category: 'governance',
    color: '#10B981',
  },
  {
    id: 'c4',
    source: 'calibration',
    target: 'spc',
    orderFromSource: 2,
    shortTag: 'MSA Reliability',
    label: '2nd: Ensures measurement system reliability for SPC charts',
    isFeedback: false,
    category: 'intelligence',
    color: '#06B6D4',
  },
  {
    id: 'c6',
    source: 'iqc',
    target: 'ncr',
    orderFromSource: 1,
    shortTag: 'Quarantine Lot',
    label: '1st: Triggers NCR & quarantine hold for rejected inbound material',
    isFeedback: false,
    category: 'supplier',
    color: '#EF4444',
  },
  {
    id: 'c7',
    source: 'iqc',
    target: 'deviation',
    orderFromSource: 2,
    shortTag: 'Request Concession',
    label: '2nd: Requests conditional concession for urgent production lots',
    isFeedback: false,
    category: 'supplier',
    color: '#F59E0B',
  },
  {
    id: 'c5',
    source: 'iqc',
    target: 'suppliers',
    orderFromSource: 3,
    shortTag: 'Update Rating',
    label: '3rd (Feedback): Auto-updates vendor scorecard from lot results',
    isFeedback: true,
    feedbackLane: 'local',
    category: 'supplier',
    color: '#F43F5E',
  },
  {
    id: 'c8',
    source: 'suppliers',
    target: 'audits',
    orderFromSource: 1,
    shortTag: 'Schedule Audit',
    label: '1st: Schedules supplier quality audits for low-rated vendors',
    isFeedback: false,
    category: 'supplier',
    color: '#10B981',
  },

  // Stage 02 Outgoing (Shopfloor & Production)
  {
    id: 'c9',
    source: 'setup_readiness',
    target: 'inspection_plans',
    orderFromSource: 1,
    shortTag: 'Startup Go/No-Go',
    label: '1st: Authorizes line startup & mandatory First Piece check',
    isFeedback: false,
    category: 'governance',
    color: '#0EA5E9',
  },
  {
    id: 'c10',
    source: 'inspection_plans',
    target: 'daily_defects',
    orderFromSource: 1,
    shortTag: 'Log Patrol Defect',
    label: '1st: Logs live defects detected during IPQC patrol checks',
    isFeedback: false,
    category: 'defect',
    color: '#0EA5E9',
  },
  {
    id: 'c11',
    source: 'daily_defects',
    target: 'ncr',
    orderFromSource: 1,
    shortTag: 'Escalate to NCR',
    label: '1st: Escalates critical shopfloor defects into formal NCR',
    isFeedback: false,
    category: 'defect',
    color: '#EF4444',
  },
  {
    id: 'c12',
    source: 'daily_defects',
    target: 'spc',
    orderFromSource: 2,
    shortTag: 'Live SPC Stream',
    label: '2nd: Streams live defect telemetry into SPC control charts',
    isFeedback: false,
    category: 'intelligence',
    color: '#0EA5E9',
  },
  {
    id: 'c13',
    source: 'daily_defects',
    target: 'defect_cost',
    orderFromSource: 3,
    shortTag: 'Scrap Cost (COPQ)',
    label: '3rd: Calculates daily scrap and rework financial impact',
    isFeedback: false,
    category: 'defect',
    color: '#EF4444',
  },
  {
    id: 'c14',
    source: 'lpa',
    target: 'capa_records',
    orderFromSource: 1,
    shortTag: 'Audit CAPA',
    label: '1st: Opens CAPA for non-compliant process audit findings',
    isFeedback: false,
    category: 'governance',
    color: '#0EA5E9',
  },
  {
    id: 'c15',
    source: 'lpa',
    target: 'setup_readiness',
    orderFromSource: 2,
    shortTag: 'Verify Clearance',
    label: '2nd (Feedback): Reinforces operator setup checklist compliance',
    isFeedback: true,
    feedbackLane: 'local',
    category: 'governance',
    color: '#F43F5E',
  },

  // Stage 03 Outgoing (Containment, NCR & Complaints)
  {
    id: 'c17',
    source: 'ncr',
    target: 'eight_d',
    orderFromSource: 1,
    shortTag: 'Launch 8D',
    label: '1st: Launches structured 8D root cause investigation',
    isFeedback: false,
    category: 'defect',
    color: '#8B5CF6',
  },
  {
    id: 'c16',
    source: 'ncr',
    target: 'capa_records',
    orderFromSource: 2,
    shortTag: 'Open CAPA Plan',
    label: '2nd: Initiates corrective & preventive action plan (CAPA)',
    isFeedback: false,
    category: 'defect',
    color: '#EF4444',
  },
  {
    id: 'c18',
    source: 'ncr',
    target: 'defect_cost',
    orderFromSource: 3,
    shortTag: 'Log Quarantine Loss',
    label: '3rd: Records quarantine sorting & batch scrap losses',
    isFeedback: false,
    category: 'defect',
    color: '#EF4444',
  },
  {
    id: 'c19',
    source: 'complaints',
    target: 'ncr',
    orderFromSource: 1,
    shortTag: 'RMA to NCR',
    label: '1st: Converts customer RMA claim into formal containment NCR',
    isFeedback: false,
    category: 'defect',
    color: '#EF4444',
  },
  {
    id: 'c20',
    source: 'complaints',
    target: 'eight_d',
    orderFromSource: 2,
    shortTag: 'Mandate 8D Report',
    label: '2nd: Mandates formal 8D root cause report for customer',
    isFeedback: false,
    category: 'defect',
    color: '#8B5CF6',
  },
  {
    id: 'c21',
    source: 'deviation',
    target: 'change_control',
    orderFromSource: 1,
    shortTag: 'Route to ECN',
    label: '1st: Routes temporary deviation for permanent ECN review',
    isFeedback: false,
    category: 'governance',
    color: '#F59E0B',
  },
  {
    id: 'c22',
    source: 'defect_cost',
    target: 'control_tower',
    orderFromSource: 1,
    shortTag: 'COPQ KPI Feed',
    label: '1st: Reports COPQ financial impact to Executive Control Tower',
    isFeedback: false,
    category: 'intelligence',
    color: '#EF4444',
  },

  // Stage 04 Outgoing (Root Cause, 8D & CAPA)
  {
    id: 'c23',
    source: 'eight_d',
    target: 'fmea',
    orderFromSource: 1,
    shortTag: 'Update PFMEA RPN',
    label: '1st: Updates PFMEA risk matrix with newly discovered failure modes',
    isFeedback: false,
    category: 'prevention',
    color: '#F59E0B',
  },
  {
    id: 'c24',
    source: 'eight_d',
    target: 'control_plan',
    orderFromSource: 2,
    shortTag: 'Add Poka-Yoke',
    label: '2nd: Enforces new poka-yoke controls in Dynamic Control Plan',
    isFeedback: false,
    category: 'prevention',
    color: '#10B981',
  },
  {
    id: 'c25',
    source: 'eight_d',
    target: 'knowledge_base',
    orderFromSource: 3,
    shortTag: 'Archive Lesson',
    label: '3rd: Archives verified root cause in Lessons Learned Hub',
    isFeedback: false,
    category: 'prevention',
    color: '#10B981',
  },
  {
    id: 'c26',
    source: 'capa_records',
    target: 'change_control',
    orderFromSource: 1,
    shortTag: 'Trigger ECN',
    label: '1st: Triggers formal Engineering Change Notice (ECN)',
    isFeedback: false,
    category: 'governance',
    color: '#8B5CF6',
  },
  {
    id: 'c27',
    source: 'capa_records',
    target: 'command_center',
    orderFromSource: 2,
    shortTag: 'Track Action SLA',
    label: '2nd: Tracks CAPA due dates and departmental closure SLA',
    isFeedback: false,
    category: 'governance',
    color: '#8B5CF6',
  },
  {
    id: 'c28',
    source: 'change_control',
    target: 'control_plan',
    orderFromSource: 1,
    shortTag: 'Revise Specs',
    label: '1st: Revises Control Plan specifications after ECN approval',
    isFeedback: false,
    category: 'prevention',
    color: '#8B5CF6',
  },
  {
    id: 'c29',
    source: 'command_center',
    target: 'control_tower',
    orderFromSource: 1,
    shortTag: 'Closure Velocity',
    label: '1st: Broadcasts action closure KPIs to Quality Control Tower',
    isFeedback: false,
    category: 'intelligence',
    color: '#8B5CF6',
  },

  // Stage 05 Outgoing (Engineering & Prevention -> Closed-Loop Highway Returns)
  {
    id: 'c30',
    source: 'fmea',
    target: 'control_plan',
    orderFromSource: 1,
    shortTag: 'Critical Specs',
    label: '1st: Transfers high-RPN characteristics to Dynamic Control Plan',
    isFeedback: false,
    category: 'prevention',
    color: '#F59E0B',
  },
  {
    id: 'c32',
    source: 'control_plan',
    target: 'spc',
    orderFromSource: 1,
    shortTag: 'Set USL / LSL',
    label: '1st: Sets USL/LSL specification limits for SPC control charts',
    isFeedback: false,
    category: 'intelligence',
    color: '#06B6D4',
  },
  {
    id: 'c31',
    source: 'control_plan',
    target: 'inspection_plans',
    orderFromSource: 2,
    shortTag: 'Return Specs to IPQC',
    label: '2nd (Feedback Loop): Deploys updated inspection specs back to Shopfloor IPQC',
    isFeedback: true,
    feedbackLane: 'top',
    category: 'prevention',
    color: '#F43F5E',
  },
  {
    id: 'c33',
    source: 'form_designer',
    target: 'inspection_plans',
    orderFromSource: 1,
    shortTag: 'Publish Checklists',
    label: '1st (Feedback Loop): Publishes digital checklists back to Shopfloor IPQC',
    isFeedback: true,
    feedbackLane: 'bottom',
    category: 'governance',
    color: '#F43F5E',
  },
  {
    id: 'c34',
    source: 'form_designer',
    target: 'lpa',
    orderFromSource: 2,
    shortTag: 'Deploy LPA Forms',
    label: '2nd (Feedback Loop): Deploys custom audit templates back to Shopfloor LPA',
    isFeedback: true,
    feedbackLane: 'bottom',
    category: 'governance',
    color: '#F43F5E',
  },
  {
    id: 'c35',
    source: 'knowledge_base',
    target: 'ai_copilot',
    orderFromSource: 1,
    shortTag: 'Train AI Model',
    label: '1st: Trains AI Copilot on historical 8D solutions & patterns',
    isFeedback: false,
    category: 'intelligence',
    color: '#06B6D4',
  },

  // Stage 06 Outgoing (SPC, AI & Audits -> Closed-Loop Highway Returns)
  {
    id: 'c37',
    source: 'spc',
    target: 'control_tower',
    orderFromSource: 1,
    shortTag: 'Live Cpk Feed',
    label: '1st: Streams live Cp/Cpk capability metrics to Control Tower',
    isFeedback: false,
    category: 'intelligence',
    color: '#06B6D4',
  },
  {
    id: 'c36',
    source: 'spc',
    target: 'ai_copilot',
    orderFromSource: 2,
    shortTag: 'Drift Telemetry',
    label: '2nd: Feeds process drift trends to AI for predictive alerts',
    isFeedback: false,
    category: 'intelligence',
    color: '#06B6D4',
  },
  {
    id: 'c38',
    source: 'ai_copilot',
    target: 'eight_d',
    orderFromSource: 1,
    shortTag: 'AI Root Cause',
    label: '1st (Feedback Loop): Recommends AI-generated root causes back to 8D teams',
    isFeedback: true,
    feedbackLane: 'top',
    category: 'intelligence',
    color: '#F43F5E',
  },
  {
    id: 'c39',
    source: 'audits',
    target: 'capa_records',
    orderFromSource: 1,
    shortTag: 'Audit to CAPA',
    label: '1st (Feedback Loop): Generates CAPA actions from audit non-conformities',
    isFeedback: true,
    feedbackLane: 'bottom',
    category: 'governance',
    color: '#F43F5E',
  },
];

// Ordered Simulation Scenarios with Step-by-Step Auto-Player support
const SIMULATION_SCENARIOS: Record<
  'defect' | 'supplier' | 'prevention',
  { title: string; cableSequence: string[] }
> = {
  defect: {
    title: 'Shopfloor Closed-Loop (Steps 1➔7 + ↺ Return)',
    cableSequence: ['c9', 'c10', 'c11', 'c17', 'c23', 'c30', 'c31'],
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

  // Interaction & Step-by-Step Player State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSimulation, setActiveSimulation] = useState<'none' | 'defect' | 'supplier' | 'prevention'>('none');
  const [simStepIndex, setSimStepIndex] = useState<number | null>(null); // null = show all steps in sim, 0..N = spotlight up to step
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [showAllFeedbackLoops, setShowAllFeedbackLoops] = useState<boolean>(false);

  // Auto-fit entire 24-node matrix cleanly inside the viewport
  const fitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    const padding = 18;
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

  // Step-by-Step Auto-Play Timer for Simulation Flows
  useEffect(() => {
    if (!isAutoPlaying || activeSimulation === 'none') return;
    const totalSteps = SIMULATION_SCENARIOS[activeSimulation].cableSequence.length;

    const timer = window.setInterval(() => {
      setSimStepIndex((prev) => {
        if (prev === null) return 0;
        if (prev + 1 >= totalSteps) {
          return 0; // loop back to Step 1 continuously
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
      const targetZoom = Math.max(zoom, 0.82);
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

  // Compute exact sequence metadata for highlighted cables
  const activeCableSequenceMap = useMemo(() => {
    const map = new Map<
      string,
      {
        stepNumber: number;
        stepPillText: string;
        shortTag: string;
        isFeedback: boolean;
        isCurrentStepSpotlight: boolean;
        directionRole: 'sim' | 'input' | 'output' | 'feedback';
        badgeColor: string;
      }
    >();

    // 1. If a simulation scenario is active
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
          stepPillText: cable.isFeedback ? `↺ STEP 0${stepNum}` : `STEP 0${stepNum}`,
          shortTag: cable.isFeedback ? `${cable.shortTag} (Return)` : `${cable.shortTag} ➔`,
          isFeedback: cable.isFeedback,
          isCurrentStepSpotlight: isSpotlight,
          directionRole: cable.isFeedback ? 'feedback' : 'sim',
          badgeColor: cable.isFeedback ? '#F43F5E' : cable.color,
        });
      });
      return map;
    }

    // 2. If user toggled "Show All Feedback Loops (راجع)"
    if (showAllFeedbackLoops && !activeNodeId) {
      let fbIndex = 1;
      CABLES.filter((c) => c.isFeedback).forEach((cable) => {
        map.set(cable.id, {
          stepNumber: fbIndex,
          stepPillText: `↺ LOOP #${fbIndex}`,
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

    // 3. If a card is hovered or selected, number Incoming (IN #1, IN #2...) and Outgoing (1st, 2nd, 3rd...)
    if (activeNodeId) {
      const incomingCables = CABLES.filter((c) => c.target === activeNodeId);
      incomingCables.forEach((cable, idx) => {
        const inNum = idx + 1;
        map.set(cable.id, {
          stepNumber: inNum,
          stepPillText: cable.isFeedback ? `↺ IN #${inNum}` : `IN #${inNum}`,
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
        map.set(cable.id, {
          stepNumber: ord,
          stepPillText: cable.isFeedback ? `↺ ${ordinalText}` : `${ordinalText} OUT`,
          shortTag: cable.isFeedback ? `${cable.shortTag} (Return)` : `${cable.shortTag} ➔`,
          isFeedback: cable.isFeedback,
          isCurrentStepSpotlight: true,
          directionRole: cable.isFeedback ? 'feedback' : 'output',
          badgeColor: cable.isFeedback ? '#F43F5E' : '#10B981',
        });
      });
    }

    return map;
  }, [activeNodeId, activeSimulation, simStepIndex, showAllFeedbackLoops]);

  // Connected nodes & their role badge when highlighted
  const nodeSequenceBadges = useMemo(() => {
    const badgeMap = new Map<
      string,
      { text: string; color: string; isFeedback?: boolean; isPulseSpotlight?: boolean }
    >();

    if (activeSimulation !== 'none') {
      const seq = SIMULATION_SCENARIOS[activeSimulation].cableSequence;
      seq.forEach((cableId, idx) => {
        if (simStepIndex !== null && idx > simStepIndex) return;
        const cable = CABLES.find((c) => c.id === cableId);
        if (!cable) return;
        if (idx === 0) {
          badgeMap.set(cable.source, {
            text: '00 • ORIGIN',
            color: '#38BDF8',
            isPulseSpotlight: simStepIndex === 0,
          });
        }
        const stepNum = idx + 1;
        badgeMap.set(cable.target, {
          text: cable.isFeedback ? `↺ STEP 0${stepNum} (RETURN)` : `STEP 0${stepNum} TARGET`,
          color: cable.isFeedback ? '#F43F5E' : '#10B981',
          isFeedback: cable.isFeedback,
          isPulseSpotlight: simStepIndex === idx,
        });
      });
      return badgeMap;
    }

    if (showAllFeedbackLoops && !activeNodeId) {
      CABLES.filter((c) => c.isFeedback).forEach((cable, idx) => {
        badgeMap.set(cable.source, {
          text: `↺ LOOP #${idx + 1} START`,
          color: '#F43F5E',
          isFeedback: true,
        });
        badgeMap.set(cable.target, {
          text: `↺ LOOP #${idx + 1} RETURN`,
          color: '#F59E0B',
          isFeedback: true,
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

      const incomingCables = CABLES.filter((c) => c.target === activeNodeId);
      incomingCables.forEach((cable, idx) => {
        badgeMap.set(cable.source, {
          text: cable.isFeedback ? `↺ RETURN IN #${idx + 1}` : `📥 INPUT #${idx + 1}`,
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
          text: cable.isFeedback ? `↺ ${ordinalText}: FEEDBACK` : `📤 ${ordinalText} STEP`,
          color: cable.isFeedback ? '#F43F5E' : '#10B981',
          isFeedback: cable.isFeedback,
        });
      });
    }

    return badgeMap;
  }, [activeNodeId, activeSimulation, simStepIndex, showAllFeedbackLoops]);

  // Count links per node (In, Out, Feedback)
  const nodeConnectionsCount = useMemo(() => {
    const counts: Record<string, { inCount: number; outCount: number; feedback: number }> = {};
    NODES.forEach((n) => {
      const incoming = CABLES.filter((c) => c.target === n.id);
      const outgoing = CABLES.filter((c) => c.source === n.id);
      const fb = [...incoming, ...outgoing].filter((c) => c.isFeedback).length;
      counts[n.id] = { inCount: incoming.length, outCount: outgoing.length, feedback: fb };
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
        n.seqCode.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Active node details for bottom status bar
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
          targetName: tgtNode?.title || c.target,
        };
      });

    return { node, phase, incoming, outgoing };
  }, [activeNodeId]);

  // High-Precision Geometry Engine with Dedicated Top/Bottom Feedback Loop Highways
  const computeCableGeometry = (cable: CableRelation, indexOffset: number) => {
    const src = NODES.find((n) => n.id === cable.source);
    const tgt = NODES.find((n) => n.id === cable.target);
    if (!src || !tgt) return null;

    const isSameColumn = src.x === tgt.x;
    const isForwardLtr = tgt.x > src.x;

    // Separate outgoing ports vertically by orderFromSource (1st = top pin, 2nd = mid pin, 3rd = bottom pin)
    const outPinOffset = (cable.orderFromSource - 2) * 18;
    // Separate incoming ports slightly based on source row
    const inPinOffset = ((src.y - tgt.y) / 200) * 14;

    if (isSameColumn) {
      // Local column arc on the right side of the column
      const x1 = src.x + NODE_WIDTH;
      const y1 = src.y + NODE_HEIGHT / 2 + outPinOffset * 0.5;
      const x2 = tgt.x + NODE_WIDTH;
      const y2 = tgt.y + NODE_HEIGHT / 2;
      const curveOffset = cable.isFeedback ? 52 : 44;
      const cx1 = x1 + curveOffset;
      const cy1 = y1;
      const cx2 = x2 + curveOffset;
      const cy2 = y2;
      const pathD = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
      const midX = x1 + curveOffset * 0.82;
      const midY = (y1 + y2) / 2;
      return { pathD, midX, midY, x1, y1, x2, y2 };
    }

    if (isForwardLtr) {
      const x1 = src.x + NODE_WIDTH;
      const y1 = src.y + NODE_HEIGHT / 2 + outPinOffset;
      const x2 = tgt.x;
      const y2 = tgt.y + NODE_HEIGHT / 2 + inPinOffset;
      const dx = Math.max(65, (x2 - x1) * 0.46);
      const cx1 = x1 + dx;
      const cy1 = y1;
      const cx2 = x2 - dx;
      const cy2 = y2;
      const pathD = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;

      const tValues = [0.48, 0.36, 0.62, 0.42, 0.55];
      const t = tValues[indexOffset % tValues.length];
      const mt = 1 - t;
      const midX =
        mt * mt * mt * x1 +
        3 * mt * mt * t * cx1 +
        3 * mt * t * t * cx2 +
        t * t * t * x2;
      const midY =
        mt * mt * mt * y1 +
        3 * mt * mt * t * cy1 +
        3 * mt * t * t * cy2 +
        t * t * t * y2;

      return { pathD, midX, midY, x1, y1, x2, y2 };
    }

    // Closed-Loop Return / Feedback Cable (Right-to-Left Highway Channel so it never cuts across cards!)
    const x1 = src.x;
    const y1 = src.y + NODE_HEIGHT / 2;
    const x2 = tgt.x + NODE_WIDTH;
    const y2 = tgt.y + NODE_HEIGHT / 2;

    const useTopHighway = cable.feedbackLane === 'top' || (!cable.feedbackLane && y1 < 450);
    const highwayY = useTopHighway
      ? 56 + (indexOffset % 2) * 18 // Top Return Highway Bus
      : 856 - (indexOffset % 2) * 16; // Bottom Return Highway Bus

    const cx1 = x1 - 45;
    const cy1 = highwayY;
    const cx2 = x2 + 45;
    const cy2 = highwayY;

    const pathD = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
    const t = 0.5;
    const mt = 0.5;
    const midX =
      mt * mt * mt * x1 +
      3 * mt * mt * t * cx1 +
      3 * mt * t * t * cx2 +
      t * t * t * x2;
    const midY =
      mt * mt * mt * y1 +
      3 * mt * mt * t * cy1 +
      3 * mt * t * t * cy2 +
      t * t * t * y2;

    return { pathD, midX, midY, x1, y1, x2, y2 };
  };

  // Start or toggle a simulation flow with auto-play
  const triggerSimulation = (simType: 'defect' | 'supplier' | 'prevention') => {
    setShowAllFeedbackLoops(false);
    setSelectedNodeId(null);
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

  return (
    <div
      className="h-full max-h-full overflow-hidden flex flex-col select-none relative w-full text-white bg-[#040812] font-sans"
      dir="ltr"
    >
      {/* ========================================================================= */}
      {/* 1. TOP COMMAND BAR (STEP-BY-STEP PLAYER, FEEDBACK BUS, SEARCH & ZOOM) */}
      {/* ========================================================================= */}
      <header className="h-14 px-3 sm:px-5 border-b border-white/10 bg-[#070d19]/95 backdrop-blur-2xl flex items-center justify-between shrink-0 z-30 gap-2">
        {/* Brand & Ecosystem Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0066CC] to-[#00A3E0] flex items-center justify-center shadow-[0_0_25px_rgba(0,163,224,0.45)] border border-sky-400/40">
            <Network className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight">
                QMS 4.0 Digital Twin Matrix
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hidden sm:flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                M-01 ➔ M-24 Sequenced
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden 2xl:block">
              Live Step-by-Step Conduit Player • Dedicated Closed-Loop Return Highways (↺)
            </p>
          </div>
        </div>

        {/* Ordered Scenario Simulation Buttons + Step-by-Step Controls */}
        <div className="hidden lg:flex items-center gap-1.5 p-1 bg-white/[0.04] border border-white/10 rounded-2xl">
          <button
            type="button"
            onClick={() => triggerSimulation('defect')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSimulation === 'defect'
                ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                : 'bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/25'
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>1➔7 Shopfloor Loop</span>
          </button>

          <button
            type="button"
            onClick={() => triggerSimulation('supplier')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSimulation === 'supplier'
                ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/25'
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>1➔5 Vendor Loop</span>
          </button>

          <button
            type="button"
            onClick={() => triggerSimulation('prevention')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSimulation === 'prevention'
                ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/25'
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>1➔6 AI & 8D Loop</span>
          </button>

          {/* Interactive Step-by-Step Controller when a simulation is active */}
          {activeSimulation !== 'none' && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-[#0c1629] border border-sky-500/40 rounded-xl ml-1">
              <button
                type="button"
                onClick={() => {
                  setIsAutoPlaying(false);
                  const total = SIMULATION_SCENARIOS[activeSimulation].cableSequence.length;
                  setSimStepIndex((prev) =>
                    prev === null ? total - 1 : (prev - 1 + total) % total
                  );
                }}
                className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white"
                title="Previous Step"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (simStepIndex === null) setSimStepIndex(0);
                  setIsAutoPlaying((p) => !p);
                }}
                className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-[11px] font-black flex items-center gap-1"
              >
                {isAutoPlaying ? (
                  <>
                    <Pause className="w-3 h-3" />
                    <span>
                      Step {(simStepIndex ?? 0) + 1}/
                      {SIMULATION_SCENARIOS[activeSimulation].cableSequence.length}
                    </span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    <span>
                      {simStepIndex === null
                        ? 'All Steps'
                        : `Step ${simStepIndex + 1}/${
                            SIMULATION_SCENARIOS[activeSimulation].cableSequence.length
                          }`}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAutoPlaying(false);
                  const total = SIMULATION_SCENARIOS[activeSimulation].cableSequence.length;
                  setSimStepIndex((prev) => (prev === null ? 0 : (prev + 1) % total));
                }}
                className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white"
                title="Next Step"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAutoPlaying(false);
                  setSimStepIndex(null);
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  simStepIndex === null
                    ? 'bg-sky-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Show All Steps Simultaneously"
              >
                All
              </button>
            </div>
          )}

          <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

          {/* Dedicated Button to Highlight All Return / Feedback Loops (راجع) */}
          <button
            type="button"
            onClick={() => {
              setActiveSimulation('none');
              setIsAutoPlaying(false);
              setSimStepIndex(null);
              setSelectedNodeId(null);
              setShowAllFeedbackLoops((prev) => !prev);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              showAllFeedbackLoops
                ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.55)]'
                : 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30'
            }`}
            title="Highlight all closed-loop return/feedback connections"
          >
            <CornerUpLeft className="w-3.5 h-3.5" />
            <span>↺ Feedback Bus (7)</span>
          </button>

          {(activeSimulation !== 'none' || showAllFeedbackLoops) && (
            <button
              type="button"
              onClick={() => {
                setActiveSimulation('none');
                setIsAutoPlaying(false);
                setSimStepIndex(null);
                setShowAllFeedbackLoops(false);
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
          {/* Search Module Input */}
          <div className="relative">
            <div className="flex items-center gap-1.5 bg-white/[0.05] border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-sky-400/60 transition-colors w-36 sm:w-44">
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

        {/* Transform Layer: Stages, Base Cables, Cards, and Foreground Sequenced Cables */}
        <div
          className="absolute top-0 left-0 transition-transform duration-75 origin-top-left pointer-events-auto"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
          }}
        >
          {/* Dedicated Top & Bottom Feedback Loop Highway Track Indicators */}
          <div className="absolute left-[360px] right-[40px] top-[6px] h-[22px] rounded-full border border-rose-500/20 bg-rose-950/15 flex items-center justify-between px-6 pointer-events-none">
            <span className="text-[9px] font-black uppercase tracking-widest text-rose-400/80 flex items-center gap-1.5">
              <span>↺ CLOSED-LOOP FEEDBACK HIGHWAY (UPPER BUS: STAGE 06 / 05 ➔ STAGE 04 / 02)</span>
            </span>
            <span className="text-[9px] font-bold text-rose-400/60">
              AI Root Cause ➔ 8D • Control Plan Specs ➔ Shopfloor IPQC
            </span>
          </div>

          <div className="absolute left-[360px] right-[40px] bottom-[6px] h-[22px] rounded-full border border-rose-500/20 bg-rose-950/15 flex items-center justify-between px-6 pointer-events-none">
            <span className="text-[9px] font-black uppercase tracking-widest text-rose-400/80 flex items-center gap-1.5">
              <span>↺ CLOSED-LOOP FEEDBACK HIGHWAY (LOWER BUS: STAGE 06 / 05 ➔ STAGE 04 / 02)</span>
            </span>
            <span className="text-[9px] font-bold text-rose-400/60">
              System Audits ➔ CAPA • Smart Forms ➔ IPQC & LPA Checklists
            </span>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* 6 STAGE ZONES */}
          {/* ------------------------------------------------------------- */}
          {PHASES.map((phase) => (
            <div
              key={phase.id}
              style={{
                left: `${phase.x}px`,
                top: '34px',
                width: `${phase.width}px`,
                height: '818px',
              }}
              className={`absolute rounded-3xl border ${phase.borderColor} bg-gradient-to-b ${phase.bgGradient} p-4 pointer-events-none transition-all duration-300`}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
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
                        STAGE {phase.phaseNumber} ➔
                      </span>
                    </div>
                    <h3 className="text-[14px] font-black text-white mt-0.5 tracking-tight">
                      {phase.title}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* ------------------------------------------------------------- */}
          {/* LAYER 1: BACKGROUND CABLES (SUBTLE DIRECTIONAL CONDUITS) */}
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
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(244, 63, 94, 0.45)" />
              </marker>
            </defs>

            {CABLES.map((cable, idx) => {
              if (activeCableSequenceMap.has(cable.id)) return null;
              const geom = computeCableGeometry(cable, idx);
              if (!geom) return null;

              return (
                <path
                  key={cable.id}
                  d={geom.pathD}
                  fill="none"
                  stroke={
                    cable.isFeedback
                      ? 'rgba(244, 63, 94, 0.24)'
                      : 'rgba(148, 163, 184, 0.16)'
                  }
                  strokeWidth={cable.isFeedback ? '1.6' : '1.3'}
                  strokeDasharray={cable.isFeedback ? '8, 5' : '4, 5'}
                  markerEnd={
                    cable.isFeedback ? 'url(#arrowFeedbackMuted)' : 'url(#arrowMuted)'
                  }
                />
              );
            })}
          </svg>

          {/* ------------------------------------------------------------- */}
          {/* LAYER 2: 24 CYBER-INDUSTRIAL MODULE CARDS (M-01 TO M-24) */}
          {/* ------------------------------------------------------------- */}
          {NODES.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isHovered = hoveredNodeId === node.id;
            const seqBadge = nodeSequenceBadges.get(node.id);
            const isConnected = Boolean(seqBadge);
            const isDimmed =
              (activeNodeId || activeSimulation !== 'none' || showAllFeedbackLoops) &&
              !isConnected;
            const phase = PHASES.find((p) => p.id === node.phaseId);
            const themeColor = phase?.color || '#0EA5E9';
            const linkStats = nodeConnectionsCount[node.id] || {
              inCount: 0,
              outCount: 0,
              feedback: 0,
            };

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
                      ? `0 16px 38px -5px ${seqBadge?.color || themeColor}55, 0 0 0 2.5px ${
                          seqBadge?.color || themeColor
                        }`
                      : isConnected
                      ? `0 10px 28px -5px ${seqBadge?.color || themeColor}40, 0 0 0 2px ${
                          seqBadge?.color || themeColor
                        }`
                      : '0 10px 30px -10px rgba(0, 0, 0, 0.75)',
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
                className={`absolute rounded-2xl overflow-visible flex flex-col justify-between cursor-pointer transition-all duration-200 z-20 group backdrop-blur-xl ${
                  isSelected || seqBadge?.isPulseSpotlight
                    ? 'bg-[#121f38] scale-[1.04]'
                    : isHovered
                    ? 'bg-[#0f192d] scale-[1.03]'
                    : isConnected
                    ? 'bg-[#0d1627]'
                    : 'bg-[#09101d]/95 border border-white/10 hover:border-white/25'
                } ${isDimmed ? 'opacity-20' : 'opacity-100'}`}
              >
                {/* Floating Sequence Role Badge on Top-Right of Card */}
                {seqBadge && (
                  <div
                    style={{
                      backgroundColor: seqBadge.color,
                      boxShadow: `0 4px 16px ${seqBadge.color}80`,
                    }}
                    className="absolute -top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-black text-slate-950 tracking-wider uppercase z-30 flex items-center gap-1 border border-white/50"
                  >
                    <span>{seqBadge.text}</span>
                  </div>
                )}

                {/* Top Neon Accent Bar */}
                <div
                  className="h-1.5 w-full shrink-0 rounded-t-2xl"
                  style={{
                    background: `linear-gradient(90deg, ${themeColor}, ${themeColor}55)`,
                  }}
                />

                {/* Multi-Pin Left Input Terminals & Right Output Terminals */}
                {[-16, 0, 16].map((offsetY, pinIdx) => (
                  <div
                    key={`in-${pinIdx}`}
                    style={{
                      top: `calc(50% + ${offsetY}px)`,
                      backgroundColor: isConnected ? seqBadge?.color || themeColor : '#334155',
                    }}
                    className="absolute -left-1.5 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-[#040812]"
                  />
                ))}
                {[-18, 0, 18].map((offsetY, pinIdx) => (
                  <div
                    key={`out-${pinIdx}`}
                    style={{
                      top: `calc(50% + ${offsetY}px)`,
                      backgroundColor: isConnected ? seqBadge?.color || themeColor : '#334155',
                    }}
                    className="absolute -right-1.5 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-[#040812]"
                  />
                ))}

                {/* Card Content */}
                <div className="p-3.5 flex-1 flex flex-col justify-between overflow-hidden rounded-b-2xl">
                  {/* Top Row: Icon + Clear Visible English Title + M-Code & Live Telemetry */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 border border-white/15 transition-transform group-hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, ${themeColor}35, ${themeColor}10)`,
                          color: themeColor,
                          boxShadow: `inset 0 1px 1px rgba(255,255,255,0.2)`,
                        }}
                      >
                        <node.icon className="w-4 h-4" />
                        <span className="text-[8px] font-black text-white/90 leading-none mt-0.5">
                          {node.seqCode}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-[13.5px] font-black text-white group-hover:text-sky-300 transition-colors leading-snug tracking-tight">
                          {node.title}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className="inline-block text-[8.5px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `${themeColor}20`,
                              color: themeColor,
                            }}
                          >
                            {node.badge}
                          </span>
                          <span className="text-[9px] font-bold text-slate-300 bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/10">
                            {node.kpiMetric}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle Row: Concise English Description */}
                  <p className="text-[11px] text-slate-300/85 leading-relaxed line-clamp-2 my-1">
                    {node.description}
                  </p>

                  {/* Bottom Row: In / Out / Loop Breakdown + Direct Launch Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
                    <div className="flex items-center gap-1 text-[9.5px] font-bold">
                      <span
                        className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/25"
                        title="Incoming Inputs"
                      >
                        {linkStats.inCount} In
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                        title="Ordered Outgoing Steps (1st, 2nd, 3rd)"
                      >
                        {linkStats.outCount} Out
                      </span>
                      {linkStats.feedback > 0 && (
                        <span
                          className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/35"
                          title="Includes Closed-Loop Return / Feedback connections"
                        >
                          ↺ {linkStats.feedback}
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
                        backgroundColor: isHovered ? themeColor : 'rgba(255,255,255,0.07)',
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

          {/* ------------------------------------------------------------- */}
          {/* LAYER 3: FOREGROUND HIGHLIGHTED CABLES, ORBS & HUD STEP PILLS */}
          {/* ------------------------------------------------------------- */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-30"
            style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}
          >
            <defs>
              <filter id="laserGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
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

            {CABLES.map((cable, idx) => {
              const seqMeta = activeCableSequenceMap.get(cable.id);
              if (!seqMeta) return null;

              const geom = computeCableGeometry(cable, idx);
              if (!geom) return null;

              const strokeColor = seqMeta.badgeColor;
              const markerId = seqMeta.isFeedback
                ? 'url(#arrowActiveFeedback)'
                : seqMeta.directionRole === 'input'
                ? 'url(#arrowActiveBlue)'
                : 'url(#arrowActiveGreen)';

              return (
                <g
                  key={cable.id}
                  opacity={seqMeta.isCurrentStepSpotlight ? 1 : 0.55}
                >
                  {/* Glowing Base Path */}
                  <path
                    id={`path-${cable.id}`}
                    d={geom.pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={
                      seqMeta.isCurrentStepSpotlight
                        ? seqMeta.isFeedback
                          ? '3.6'
                          : '3.2'
                        : '2.2'
                    }
                    strokeDasharray={seqMeta.isFeedback ? '10, 5' : 'none'}
                    filter="url(#laserGlow)"
                    markerEnd={markerId}
                  />

                  {/* Live Travelling Energy Orbs along exact Bezier Curve */}
                  <circle
                    r={seqMeta.isCurrentStepSpotlight ? '5' : '3.5'}
                    fill="#ffffff"
                    filter="url(#laserGlow)"
                  >
                    <animateMotion
                      dur={seqMeta.isFeedback ? '1.8s' : '1.3s'}
                      repeatCount="indefinite"
                      path={geom.pathD}
                    />
                  </circle>

                  {/* 2-Part Cyber HUD Sequence Capsule on the Line */}
                  <g transform={`translate(${geom.midX}, ${geom.midY})`}>
                    {/* Outer Glass Capsule */}
                    <rect
                      x="-92"
                      y="-14"
                      width="184"
                      height="28"
                      rx="14"
                      fill="#050b16"
                      stroke={strokeColor}
                      strokeWidth={seqMeta.isCurrentStepSpotlight ? '2' : '1.4'}
                    />
                    {/* Left Solid Numbered Step Pill */}
                    <rect
                      x="-90"
                      y="-12"
                      width="66"
                      height="24"
                      rx="12"
                      fill={strokeColor}
                    />
                    <text
                      x="-57"
                      y="3.5"
                      textAnchor="middle"
                      fill="#040812"
                      fontSize="9.5"
                      fontWeight="900"
                      letterSpacing="0.03em"
                    >
                      {seqMeta.stepPillText}
                    </text>
                    {/* Right Action Label */}
                    <text
                      x="34"
                      y="3.5"
                      textAnchor="middle"
                      fill="#F8FAFC"
                      fontSize="9.5"
                      fontWeight="800"
                    >
                      {seqMeta.shortTag}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DOCKED SINGLE-LINE BOTTOM STATUS BAR (ORDERED 1st, 2nd, 3rd + RETURN) */}
      {/* ========================================================================= */}
      <div className="h-12 px-4 border-t border-white/10 bg-[#070d19]/95 backdrop-blur-2xl flex items-center justify-between shrink-0 z-30 gap-3 overflow-x-auto no-scrollbar">
        {activeNodeInfo ? (
          <>
            {/* Active Module Identity */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-black">
                {activeNodeInfo.node.seqCode}
              </span>
              <h3 className="text-xs sm:text-sm font-black text-white whitespace-nowrap">
                {activeNodeInfo.node.title}
              </h3>
            </div>

            {/* Ordered Single-Line Inputs & Sequenced Outputs (1st, 2nd, 3rd + Feedback) */}
            <div className="flex items-center gap-3 text-[11px] shrink-0">
              {/* Inputs */}
              <div className="flex items-center gap-1.5">
                <span className="text-sky-400 font-bold whitespace-nowrap">📥 Inputs:</span>
                {activeNodeInfo.incoming.length > 0 ? (
                  <div className="flex items-center gap-1">
                    {activeNodeInfo.incoming.map((item) => (
                      <button
                        key={item.cable.id}
                        type="button"
                        onClick={() => setSelectedNodeId(item.sourceId)}
                        title={item.cable.label}
                        className={`px-2 py-0.5 rounded-md border text-white font-bold whitespace-nowrap flex items-center gap-1 transition-colors ${
                          item.cable.isFeedback
                            ? 'bg-rose-500/20 hover:bg-rose-500/35 border-rose-500/40'
                            : 'bg-sky-500/15 hover:bg-sky-500/30 border-sky-500/30'
                        }`}
                      >
                        <span
                          className={`text-[10px] font-black px-1 rounded ${
                            item.cable.isFeedback
                              ? 'bg-rose-500 text-white'
                              : 'bg-sky-500/30 text-sky-200'
                          }`}
                        >
                          {item.cable.isFeedback ? `↺ IN #${item.orderNum}` : `IN #${item.orderNum}`}
                        </span>
                        <span>{item.sourceName}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-500 whitespace-nowrap">Primary Stage Origin</span>
                )}
              </div>

              <span className="text-white/20">|</span>

              {/* Outgoing Ordered Sequence (1st, 2nd, 3rd) */}
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold whitespace-nowrap">
                  📤 Execution Order:
                </span>
                {activeNodeInfo.outgoing.length > 0 ? (
                  <div className="flex items-center gap-1">
                    {activeNodeInfo.outgoing.map((item) => {
                      const ord =
                        item.orderNum === 1
                          ? '1st'
                          : item.orderNum === 2
                          ? '2nd'
                          : item.orderNum === 3
                          ? '3rd'
                          : `${item.orderNum}th`;
                      return (
                        <button
                          key={item.cable.id}
                          type="button"
                          onClick={() => setSelectedNodeId(item.targetId)}
                          title={item.cable.label}
                          className={`px-2 py-0.5 rounded-md border text-white font-bold whitespace-nowrap flex items-center gap-1 transition-colors ${
                            item.cable.isFeedback
                              ? 'bg-rose-500/20 hover:bg-rose-500/35 border-rose-500/40'
                              : 'bg-emerald-500/15 hover:bg-emerald-500/30 border-emerald-500/30'
                          }`}
                        >
                          <span
                            className={`text-[10px] font-black px-1 rounded ${
                              item.cable.isFeedback
                                ? 'bg-rose-500 text-white'
                                : 'bg-emerald-500 text-slate-950'
                            }`}
                          >
                            {item.cable.isFeedback ? `↺ ${ord} (Return)` : `${ord} ➔`}
                          </span>
                          <span>{item.targetName}</span>
                        </button>
                      );
                    })}
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
        ) : activeSimulation !== 'none' ? (
          /* Interactive Step-by-Step Timeline Bar when a Simulation is running */
          <div className="w-full flex items-center justify-between gap-2 text-xs">
            <span className="font-black text-sky-400 whitespace-nowrap">
              {SIMULATION_SCENARIOS[activeSimulation].title}:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {SIMULATION_SCENARIOS[activeSimulation].cableSequence.map((cableId, idx) => {
                const c = CABLES.find((item) => item.id === cableId);
                if (!c) return null;
                const isCurr = simStepIndex === idx;
                return (
                  <button
                    key={cableId}
                    type="button"
                    onClick={() => {
                      setIsAutoPlaying(false);
                      setSimStepIndex(idx);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap flex items-center gap-1 transition-all border ${
                      isCurr
                        ? c.isFeedback
                          ? 'bg-rose-500 text-white border-white shadow-lg scale-105'
                          : 'bg-emerald-500 text-slate-950 border-white shadow-lg scale-105'
                        : c.isFeedback
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'
                        : 'bg-white/[0.06] text-slate-300 border-white/10 hover:bg-white/15'
                    }`}
                  >
                    <span className="font-black">
                      {c.isFeedback ? `↺ Step ${idx + 1}:` : `Step ${idx + 1}:`}
                    </span>
                    <span>{c.shortTag}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="w-full flex items-center justify-between text-xs text-slate-400 gap-4">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" />
                <span>Forward Sequence (1st ➔ 2nd ➔ 3rd)</span>
              </span>
              <span className="flex items-center gap-1.5 text-rose-300 font-semibold">
                <span className="w-2.5 h-0.5 border-b-2 border-dashed border-rose-400 inline-block" />
                <span>↺ Dedicated Return Highways (Upper & Lower Feedback Bus)</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-400 hidden md:inline">
              Click any loop button above to watch live Step-by-Step progression (`Step 1 ➔ Step 2 ➔ ↺ Return`)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
