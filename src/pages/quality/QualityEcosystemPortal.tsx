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
  CornerUpLeft,
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
  orderFromSource: number;
  shortTag: string;
  label: string;
  isFeedback: boolean;
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
// 2. ORDERED & SEQUENCED RELATIONSHIPS WITH FEEDBACK LOOPS (39 LINKS)
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
    category: 'supplier',
    color: '#10B981',
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
    category: 'governance',
    color: '#0EA5E9',
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

  // Stage 05 Outgoing (Engineering & Prevention -> Includes Closed-Loop Returns!)
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
    shortTag: 'Return to IPQC',
    label: '2nd (Feedback Loop): Deploys updated inspection specs back to Shopfloor IPQC',
    isFeedback: true,
    category: 'prevention',
    color: '#F43F5E',
  },
  {
    id: 'c33',
    source: 'form_designer',
    target: 'inspection_plans',
    orderFromSource: 1,
    shortTag: 'Deploy Checklists',
    label: '1st (Feedback Loop): Publishes digital checklists back to Shopfloor IPQC',
    isFeedback: true,
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

  // Stage 06 Outgoing (SPC, AI & Audits -> Includes Closed-Loop Returns!)
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
    category: 'governance',
    color: '#F43F5E',
  },
];

// Ordered Simulation Scenarios (with explicit step sequence 1 -> 2 -> 3 ... + Feedback Loop)
const SIMULATION_SCENARIOS: Record<
  'defect' | 'supplier' | 'prevention',
  { title: string; cableSequence: string[]; focusNode: string }
> = {
  defect: {
    title: 'Shopfloor Closed-Loop (Steps 1➔6 + ↺ Return)',
    cableSequence: ['c9', 'c10', 'c11', 'c17', 'c23', 'c30', 'c31'],
    focusNode: 'ncr',
  },
  supplier: {
    title: 'Inbound Reject & Audit Loop (Steps 1➔5 + ↺ Return)',
    cableSequence: ['c3', 'c6', 'c5', 'c8', 'c39'],
    focusNode: 'iqc',
  },
  prevention: {
    title: 'Customer 8D & AI Feedback Loop (Steps 1➔6 + ↺ Return)',
    cableSequence: ['c19', 'c20', 'c25', 'c35', 'c38', 'c24'],
    focusNode: 'eight_d',
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

  // Interaction State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSimulation, setActiveSimulation] = useState<'none' | 'defect' | 'supplier' | 'prevention'>('none');
  const [showAllFeedbackLoops, setShowAllFeedbackLoops] = useState<boolean>(false);

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
    // Maps cable.id -> { stepText, subLabel, isFeedback, badgeColor }
    const map = new Map<
      string,
      {
        stepNumber: number;
        stepBadge: string;
        shortTag: string;
        isFeedback: boolean;
        directionRole: 'sim' | 'input' | 'output' | 'feedback';
        badgeColor: string;
      }
    >();

    // 1. If a simulation scenario is active, number cables 1, 2, 3, 4... in exact workflow order
    if (activeSimulation !== 'none') {
      const seq = SIMULATION_SCENARIOS[activeSimulation].cableSequence;
      seq.forEach((cableId, idx) => {
        const cable = CABLES.find((c) => c.id === cableId);
        if (!cable) return;
        const stepNum = idx + 1;
        map.set(cableId, {
          stepNumber: stepNum,
          stepBadge: cable.isFeedback ? `STEP ${stepNum} ↺ RETURN` : `STEP ${stepNum} ➔`,
          shortTag: cable.shortTag,
          isFeedback: cable.isFeedback,
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
          stepBadge: `↺ LOOP #${fbIndex}`,
          shortTag: cable.shortTag,
          isFeedback: true,
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
          stepBadge: cable.isFeedback ? `↺ RETURN IN #${inNum}` : `IN #${inNum} ➔`,
          shortTag: cable.shortTag,
          isFeedback: cable.isFeedback,
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
          stepBadge: cable.isFeedback ? `${ordinalText} ↺ FEEDBACK` : `${ordinalText} ➔ STEP ${ord}`,
          shortTag: cable.shortTag,
          isFeedback: cable.isFeedback,
          directionRole: cable.isFeedback ? 'feedback' : 'output',
          badgeColor: cable.isFeedback ? '#F43F5E' : '#10B981',
        });
      });
    }

    return map;
  }, [activeNodeId, activeSimulation, showAllFeedbackLoops]);

  // Connected nodes & their role badge when highlighted
  const nodeSequenceBadges = useMemo(() => {
    // Maps nodeId -> { text, color, isFeedback }
    const badgeMap = new Map<string, { text: string; color: string; isFeedback?: boolean }>();

    if (activeSimulation !== 'none') {
      const seq = SIMULATION_SCENARIOS[activeSimulation].cableSequence;
      seq.forEach((cableId, idx) => {
        const cable = CABLES.find((c) => c.id === cableId);
        if (!cable) return;
        if (idx === 0) {
          badgeMap.set(cable.source, { text: 'START (01)', color: '#38BDF8' });
        }
        const stepNum = idx + 1;
        badgeMap.set(cable.target, {
          text: cable.isFeedback ? `↺ STEP 0${stepNum} (RETURN)` : `STEP 0${stepNum} ➔`,
          color: cable.isFeedback ? '#F43F5E' : '#10B981',
          isFeedback: cable.isFeedback,
        });
      });
      return badgeMap;
    }

    if (showAllFeedbackLoops && !activeNodeId) {
      CABLES.filter((c) => c.isFeedback).forEach((cable, idx) => {
        badgeMap.set(cable.source, { text: `↺ LOOP #${idx + 1} SRC`, color: '#F43F5E', isFeedback: true });
        badgeMap.set(cable.target, { text: `↺ LOOP #${idx + 1} DEST`, color: '#F59E0B', isFeedback: true });
      });
      return badgeMap;
    }

    if (activeNodeId) {
      badgeMap.set(activeNodeId, { text: 'ACTIVE MODULE', color: '#38BDF8' });

      const incomingCables = CABLES.filter((c) => c.target === activeNodeId);
      incomingCables.forEach((cable, idx) => {
        badgeMap.set(cable.source, {
          text: cable.isFeedback ? `↺ FEEDBACK IN #${idx + 1}` : `📥 INPUT #${idx + 1}`,
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
          text: cable.isFeedback ? `↺ ${ordinalText}: FEEDBACK` : `📤 ${ordinalText} TARGET`,
          color: cable.isFeedback ? '#F43F5E' : '#10B981',
          isFeedback: cable.isFeedback,
        });
      });
    }

    return badgeMap;
  }, [activeNodeId, activeSimulation, showAllFeedbackLoops]);

  // Count links per node
  const nodeConnectionsCount = useMemo(() => {
    const counts: Record<string, { total: number; feedback: number }> = {};
    NODES.forEach((n) => {
      const related = CABLES.filter((c) => c.source === n.id || c.target === n.id);
      const fb = related.filter((c) => c.isFeedback).length;
      counts[n.id] = { total: related.length, feedback: fb };
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

  // Active node details for bottom status bar (sorted by sequence order)
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

  // Helper to compute cubic bezier path and exact curve point at parameter t (0..1)
  const computeCableGeometry = (cable: CableRelation, indexOffset: number) => {
    const src = NODES.find((n) => n.id === cable.source);
    const tgt = NODES.find((n) => n.id === cable.target);
    if (!src || !tgt) return null;

    const isSameColumn = src.x === tgt.x;
    const isForwardLtr = tgt.x > src.x;

    let x1 = src.x + NODE_WIDTH;
    let y1 = src.y + NODE_HEIGHT / 2;
    let x2 = tgt.x;
    let y2 = tgt.y + NODE_HEIGHT / 2;
    let cx1 = x1;
    let cy1 = y1;
    let cx2 = x2;
    let cy2 = y2;

    // Slight vertical port offset based on orderFromSource so multiple outgoing lines cleanly separate
    const portShift = (cable.orderFromSource - 2) * 14;

    if (isSameColumn) {
      x1 = src.x + NODE_WIDTH;
      x2 = tgt.x + NODE_WIDTH;
      const curveOffset = 58;
      cx1 = x1 + curveOffset;
      cy1 = y1;
      cx2 = x2 + curveOffset;
      cy2 = y2;
    } else if (isForwardLtr) {
      x1 = src.x + NODE_WIDTH;
      y1 = src.y + NODE_HEIGHT / 2 + portShift;
      x2 = tgt.x;
      y2 = tgt.y + NODE_HEIGHT / 2;
      const dx = Math.max(60, (x2 - x1) * 0.45);
      cx1 = x1 + dx;
      cy1 = y1;
      cx2 = x2 - dx;
      cy2 = y2;
    } else {
      // Feedback / Return Loop going right-to-left (Stage 05/06 back to Stage 02/04)
      x1 = src.x;
      y1 = src.y + NODE_HEIGHT / 2;
      x2 = tgt.x + NODE_WIDTH;
      y2 = tgt.y + NODE_HEIGHT / 2;
      const archOffset = y1 > 420 ? 115 : -115;
      cx1 = x1 - 85;
      cy1 = y1 + archOffset;
      cx2 = x2 + 85;
      cy2 = y2 + archOffset;
    }

    const pathD = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;

    // Stagger t slightly (0.42, 0.50, 0.58) so badges on parallel cables never overlap
    const tValues = [0.48, 0.38, 0.60, 0.44, 0.54];
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
  };

  return (
    <div
      className="h-full max-h-full overflow-hidden flex flex-col select-none relative w-full text-white bg-[#040812] font-sans"
      dir="ltr"
    >
      {/* ========================================================================= */}
      {/* 1. TOP COMMAND BAR (ORDERED SIMULATIONS, FEEDBACK TOGGLE, SEARCH & ZOOM) */}
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
                QMS 4.0 Interactive Ecosystem
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hidden sm:flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Sequenced Flow + ↺ Feedback
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden xl:block">
              Hover any card to see numbered 1st / 2nd / 3rd steps & return loops (↺)
            </p>
          </div>
        </div>

        {/* Ordered Scenario Simulation Buttons + Feedback Loop Filter */}
        <div className="hidden lg:flex items-center gap-1.5 p-1 bg-white/[0.04] border border-white/10 rounded-2xl">
          <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
            <Play className="w-3 h-3 text-sky-400" />
            <span>Ordered Flows:</span>
          </span>

          <button
            type="button"
            onClick={() => {
              setShowAllFeedbackLoops(false);
              setActiveSimulation(activeSimulation === 'defect' ? 'none' : 'defect');
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSimulation === 'defect'
                ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-105'
                : 'bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/25'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            <span>1➔7 Shopfloor Loop</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAllFeedbackLoops(false);
              setActiveSimulation(activeSimulation === 'supplier' ? 'none' : 'supplier');
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSimulation === 'supplier'
                ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-105'
                : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/25'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>1➔5 Vendor Loop</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAllFeedbackLoops(false);
              setActiveSimulation(activeSimulation === 'prevention' ? 'none' : 'prevention');
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSimulation === 'prevention'
                ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-105'
                : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/25'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>1➔6 AI & 8D Loop</span>
          </button>

          <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

          {/* Dedicated Button to Highlight All Return / Feedback Loops (راجع) */}
          <button
            type="button"
            onClick={() => {
              setActiveSimulation('none');
              setSelectedNodeId(null);
              setShowAllFeedbackLoops((prev) => !prev);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              showAllFeedbackLoops
                ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.55)] scale-105'
                : 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30'
            }`}
            title="Highlight all closed-loop return/feedback connections"
          >
            <CornerUpLeft className="w-3.5 h-3.5" />
            <span>↺ Feedback Loops (7)</span>
          </button>

          {(activeSimulation !== 'none' || showAllFeedbackLoops) && (
            <button
              type="button"
              onClick={() => {
                setActiveSimulation('none');
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

        {/* Transform Layer: Stages, Base Cables, Cards, and Foreground Sequenced Cables */}
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
          {PHASES.map((phase) => (
              <div
                key={phase.id}
                style={{
                  left: `${phase.x}px`,
                  top: '20px',
                  width: `${phase.width}px`,
                  height: '830px',
                }}
                className={`absolute rounded-3xl border ${phase.borderColor} bg-gradient-to-b ${phase.bgGradient} p-4 pointer-events-none transition-all duration-300`}
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
          ))}

          {/* ------------------------------------------------------------- */}
          {/* LAYER 1: BACKGROUND CABLES (SUBTLE DIRECTIONAL LINES) */}
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
                      ? 'rgba(244, 63, 94, 0.22)'
                      : 'rgba(148, 163, 184, 0.15)'
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
          {/* LAYER 2: 24 MODULE CARDS WITH SEQUENCE & FEEDBACK BADGES */}
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
            const linkStats = nodeConnectionsCount[node.id] || { total: 0, feedback: 0 };

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
                      ? `0 14px 35px -5px ${themeColor}50, 0 0 0 2.5px ${themeColor}`
                      : isConnected
                      ? `0 10px 28px -5px ${seqBadge?.color || themeColor}40, 0 0 0 2px ${
                          seqBadge?.color || themeColor
                        }`
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
                className={`absolute rounded-2xl overflow-visible flex flex-col justify-between cursor-pointer transition-all duration-200 z-20 group backdrop-blur-xl ${
                  isSelected
                    ? 'bg-[#111c33] scale-[1.04]'
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
                      boxShadow: `0 4px 14px ${seqBadge.color}66`,
                    }}
                    className="absolute -top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-black text-slate-950 tracking-wider uppercase z-30 flex items-center gap-1 border border-white/40 animate-fade-in"
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

                {/* Integrated Side Connection Ports */}
                <div
                  className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#040812] transition-transform group-hover:scale-125"
                  style={{
                    backgroundColor: isConnected ? seqBadge?.color || themeColor : '#334155',
                    boxShadow: isConnected ? `0 0 10px ${seqBadge?.color || themeColor}` : 'none',
                  }}
                />
                <div
                  className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#040812] transition-transform group-hover:scale-125"
                  style={{
                    backgroundColor: isConnected ? seqBadge?.color || themeColor : '#334155',
                    boxShadow: isConnected ? `0 0 10px ${seqBadge?.color || themeColor}` : 'none',
                  }}
                />

                {/* Card Content */}
                <div className="p-3.5 flex-1 flex flex-col justify-between overflow-hidden rounded-b-2xl">
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

                  {/* Bottom Row: Active Links Count (+ Feedback Loop Indicator) + Direct Launch Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-semibold">
                      <Link2 className="w-3 h-3" style={{ color: themeColor }} />
                      <span>{linkStats.total} Links</span>
                      {linkStats.feedback > 0 && (
                        <span
                          className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-bold"
                          title="Includes Closed-Loop Return / Feedback connections"
                        >
                          ↺ {linkStats.feedback} Loop
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

          {/* ------------------------------------------------------------- */}
          {/* LAYER 3: FOREGROUND HIGHLIGHTED CABLES & NUMBERED STEP BADGES */}
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
                <g key={cable.id}>
                  {/* Glowing Base Path */}
                  <path
                    d={geom.pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={seqMeta.isFeedback ? '3.2' : '3'}
                    strokeDasharray={seqMeta.isFeedback ? '9, 5' : 'none'}
                    filter="url(#laserGlow)"
                    markerEnd={markerId}
                  />

                  {/* Animated Laser Pulse Overlay */}
                  <path
                    d={geom.pathD}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeDasharray="12, 28"
                    className="animate-laser-flow"
                    style={{ animationDuration: seqMeta.isFeedback ? '0.9s' : '0.7s' }}
                  />

                  {/* On-Cable Numbered Sequence Pill Badge */}
                  <g transform={`translate(${geom.midX}, ${geom.midY})`}>
                    <rect
                      x="-74"
                      y="-18"
                      width="148"
                      height="34"
                      rx="10"
                      fill="#070d19"
                      stroke={strokeColor}
                      strokeWidth="1.8"
                    />
                    <text
                      x="0"
                      y="-4"
                      textAnchor="middle"
                      fill={strokeColor}
                      fontSize="9.5"
                      fontWeight="900"
                      letterSpacing="0.04em"
                    >
                      {seqMeta.stepBadge}
                    </text>
                    <text
                      x="0"
                      y="9"
                      textAnchor="middle"
                      fill="#F8FAFC"
                      fontSize="9.5"
                      fontWeight="700"
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
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/15 shrink-0"
                style={{
                  backgroundColor: activeNodeInfo.phase?.color + '25',
                  color: activeNodeInfo.phase?.color,
                }}
              >
                <activeNodeInfo.node.icon className="w-4 h-4" />
              </div>
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
                  <span className="text-slate-500 whitespace-nowrap">Step 01 Origin</span>
                )}
              </div>

              <span className="text-white/20">|</span>

              {/* Outgoing Ordered Sequence (1st, 2nd, 3rd) */}
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold whitespace-nowrap">
                  📤 Sequence Out:
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
        ) : (
          <div className="w-full flex items-center justify-between text-xs text-slate-400 gap-4">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" />
                <span>Forward Sequence (1st ➔ 2nd ➔ 3rd)</span>
              </span>
              <span className="flex items-center gap-1.5 text-rose-300 font-semibold">
                <span className="w-2.5 h-0.5 border-b-2 border-dashed border-rose-400 inline-block" />
                <span>↺ Closed-Loop Return / Feedback (راجع)</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-400 hidden md:inline">
              Hover any card to see numbered execution order on every line • Click "↺ Feedback Loops (7)" above to inspect all return paths
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
