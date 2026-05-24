import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Brain, MessageSquare, FileText, AlertTriangle, Search,
  Settings, BarChart3, Lightbulb, Target, ChevronRight, Shield, Clock,
  Upload, Download, RefreshCw, Database, Activity
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  DEFECT_PREDICTION_FEATURE_LABELS,
  applyDefectPredictionTarget,
  getDefectPredictionFeatures,
  getDefectPredictionColumnDisplayLabels,
  getDefectPredictionRecommendedPreset,
  inferDefectPredictionColumnProfiles,
  loadDefectPredictionColumnOverrides,
  loadDefectPredictionModel,
  loadDefectPredictionTrainingRows,
  normalizePredictionRows,
  predictDefect,
  saveDefectPredictionColumnOverrides,
  saveDefectPredictionModel,
  summarizeDefectPredictionColumnHygiene,
  summarizePredictionRows,
  trainDefectPredictionModel,
  type DefectPredictionColumnOverrides,
  type DefectPredictionColumnProfile,
  type DefectPredictionColumnRole,
  type DefectPredictionColumnType,
  type DefectPredictionModel,
  type DefectPredictionResult,
  type DefectPredictionRow,
  type DefectPredictionTrainingSummary,
  type DefectPredictionFieldHints,
} from '@/services/defectPredictionModel';
import { useConfigStore, type DynamicField, type FieldOption } from '@/stores/configStore';

// AI Services
const aiServices = [
  {
    id: 'root-cause',
    name: 'Root Cause Analyzer',
    description: 'AI-powered root cause suggestion engine',
    icon: Target,
    color: '#FF6B35',
    status: 'Active',
    usage: '0'
  },
  {
    id: 'capa-generator',
    name: 'CAPA Draft Generator',
    description: 'Automatically generate CAPA proposals',
    icon: FileText,
    color: '#00C853',
    status: 'Active',
    usage: '0'
  },
  {
    id: 'spc-analyzer',
    name: 'SPC Analyzer',
    description: 'Statistical process control analysis',
    icon: BarChart3,
    color: '#00A3E0',
    status: 'Active',
    usage: '0'
  },
  {
    id: 'risk-predictor',
    name: 'Risk Predictor',
    description: 'Predictive quality risk assessment',
    icon: AlertTriangle,
    color: '#FFD600',
    status: 'Active',
    usage: '0'
  },
  {
    id: 'pattern-recognition',
    name: 'Pattern Recognition',
    description: 'Detect patterns in quality data',
    icon: Search,
    color: '#9C27B0',
    status: 'Active',
    usage: '0'
  },
  {
    id: 'report-writer',
    name: 'AI Report Writer',
    description: 'Generate comprehensive quality reports',
    icon: FileText,
    color: '#0066CC',
    status: 'Beta',
    usage: '0'
  }
];

// AI Insights
const aiInsights = [] as any[];

const routeLabels: Record<string, string> = {
  'process-ppm': 'Process PPM',
  'defect-cost': 'Defect Cost',
  'outgoing-quality': 'Outgoing Quality',
  'customer-return': 'Customer Return',
};

const fallbackFieldOptions: Record<string, FieldOption[]> = {
  shift: [
    { value: 'morning', label: 'Morning' },
    { value: 'afternoon', label: 'Afternoon' },
    { value: 'night', label: 'Night' },
  ],
  recordType: [
    { value: 'process-ppm', label: 'Process PPM' },
    { value: 'defect-cost', label: 'Defect Cost / COPQ' },
    { value: 'outgoing-quality', label: 'Outgoing Quality' },
    { value: 'customer-return', label: 'Customer Return' },
  ],
  severity: [
    { value: 'minor', label: 'Minor' },
    { value: 'major', label: 'Major' },
    { value: 'critical', label: 'Critical' },
  ],
  costCategory: [
    { value: 'internal-failure', label: 'Internal Failure' },
    { value: 'external-failure', label: 'External Failure' },
    { value: 'appraisal', label: 'Appraisal' },
    { value: 'prevention', label: 'Prevention' },
  ],
  outgoingResult: [
    { value: 'pass', label: 'Pass' },
    { value: 'fail', label: 'Fail' },
    { value: 'hold', label: 'Hold' },
  ],
};

const excludedPredictionInputFields = new Set([
  'id',
  'date',
  'defectType',
  'description',
  'actionTaken',
  'operatorName',
  'status',
  'relatedNcrId',
  'createdAt',
  'updatedAt',
]);

type PredictionInputField = Pick<DynamicField, 'name' | 'label' | 'type' | 'options' | 'optionSetId' | 'order' | 'defaultValue'> & {
  source: 'form' | 'data';
};

type PredictionSourceRow = {
  id: string;
  label: string;
  row: DefectPredictionRow;
};

const defaultPredictionInput: DefectPredictionRow = {
  recordType: 'process-ppm',
  severity: 'minor',
  quantity: 1,
  inspectedQuantity: 0,
  estimatedCost: 0,
};

const quickFieldNames = new Set(['recordType', 'productionLine', 'shift', 'partId', 'partNumber', 'severity']);

const routeQuickFields: Record<string, string[]> = {
  'process-ppm': ['quantity', 'inspectedQuantity'],
  'defect-cost': ['quantity', 'estimatedCost', 'costCategory'],
  'outgoing-quality': ['outgoingResult', 'shipmentId', 'customerName'],
  'customer-return': ['customerName', 'returnReference', 'estimatedCost'],
};

const columnTypeOptions: DefectPredictionColumnType[] = ['categorical', 'numeric', 'date', 'identifier', 'text', 'boolean', 'empty'];
const columnRoleOptions: DefectPredictionColumnRole[] = ['feature', 'ignored', 'target'];
type ColumnSetupFilter = 'all' | 'feature' | 'ignored' | 'leakage' | 'numeric' | 'date' | 'categorical' | 'text' | 'identifier' | 'low-fill';

const columnFilterOptions: Array<{ value: ColumnSetupFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'feature', label: 'Used Features' },
  { value: 'ignored', label: 'Ignored' },
  { value: 'leakage', label: 'Leakage Risk' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'date', label: 'Date' },
  { value: 'categorical', label: 'Categorical' },
  { value: 'text', label: 'Text' },
  { value: 'identifier', label: 'Identifier' },
  { value: 'low-fill', label: 'Low Fill Rate' },
];

type WorkflowStatus = 'Pending' | 'Ready' | 'Completed' | 'Warning';

type ImportedFileInfo = {
  name: string;
  sheetName: string;
  rows: number;
  columns: number;
};

type QualityActionPlan = {
  immediate: string[];
  verification: string[];
  preventive: string[];
  dataFollowUp: string[];
};

type ManagementInsight = {
  focus: string;
  topReason: string;
  confidenceStatus: string;
  escalation: string;
};

type PredictionTestScenario = {
  id: string;
  row: DefectPredictionRow;
  actual: string;
  model?: string;
  partCode?: string;
  process?: string;
  area?: string;
  shift?: string;
};

type BackCheckMatchResult = 'Match' | 'Top-3 Match' | 'Different';

type HistoricalBackCheck = {
  id: string;
  scenarioId: string;
  actual: string;
  predicted: string;
  result: BackCheckMatchResult;
  confidence: number;
};

type VisualSourceFilter = 'all' | 'imported' | 'registered';
type PredictionWorkspaceView = 'overview' | 'data' | 'training' | 'prediction' | 'visuals' | 'back-check' | 'presentation';

const predictionWorkspaceTabs: Array<{ value: PredictionWorkspaceView; label: string }> = [
  { value: 'overview', label: 'Overview' },
  { value: 'data', label: 'Data & Columns' },
  { value: 'training', label: 'Training' },
  { value: 'prediction', label: 'Prediction' },
  { value: 'visuals', label: 'Visual Analytics' },
  { value: 'back-check', label: 'Back-Check' },
  { value: 'presentation', label: 'Presentation' },
];

type VisualBarDatum = {
  label: string;
  count: number;
  percentage: number;
};

type VisualParetoDatum = VisualBarDatum & {
  cumulativePercentage: number;
};

type VisualSignalDatum = {
  label: string;
  strength: number;
  sampleSize: number;
};

type VisualSummary = {
  topTarget?: VisualBarDatum;
  topParetoLabels: string[];
  topBreakdown?: VisualBarDatum;
  topSignals: string[];
  insight: string;
  dataQualityNotes: string[];
};

function workflowBadgeClass(status: WorkflowStatus): string {
  if (status === 'Completed') return 'bg-green-500/15 text-green-300 border border-green-500/30';
  if (status === 'Ready') return 'bg-[#00A3E0]/15 text-[#7DD3FC] border border-[#00A3E0]/30';
  if (status === 'Warning') return 'bg-yellow-500/15 text-yellow-200 border border-yellow-500/30';
  return 'bg-white/5 text-gray-400 border border-white/10';
}

function formatDateTime(value?: string): string {
  if (!value) return '--';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '--' : date.toLocaleString();
}

function formatQuality(value?: DefectPredictionModel['dataQuality']): string {
  if (value === 'ready') return 'Ready';
  if (value === 'learning') return 'Learning';
  return 'No Model';
}

function columnTypeBadgeClass(type: string): string {
  if (type === 'numeric') return 'bg-blue-500/15 text-blue-200 border border-blue-500/30';
  if (type === 'date') return 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/30';
  if (type === 'boolean') return 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30';
  if (type === 'identifier') return 'bg-orange-500/15 text-orange-200 border border-orange-500/30';
  if (type === 'text') return 'bg-slate-500/15 text-slate-200 border border-slate-500/30';
  if (type === 'empty') return 'bg-red-500/15 text-red-200 border border-red-500/30';
  return 'bg-violet-500/15 text-violet-200 border border-violet-500/30';
}

function columnRoleBadgeClass(role: string): string {
  if (role === 'target') return 'bg-[#FFD600]/15 text-[#FFE66D] border border-[#FFD600]/30';
  if (role === 'ignored') return 'bg-white/5 text-gray-400 border border-white/10';
  return 'bg-[#00A3E0]/15 text-[#7DD3FC] border border-[#00A3E0]/30';
}

function columnWarningBadgeClass(code: string): string {
  if (code === 'target-leakage') return 'bg-red-500/15 text-red-200 border border-red-500/30';
  if (code === 'duplicate-normalized-column') return 'bg-red-500/15 text-red-200 border border-red-500/30';
  if (code === 'column-normalized' || code === 'column-alias-mapped') return 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/30';
  if (code === 'high-cardinality') return 'bg-yellow-500/15 text-yellow-200 border border-yellow-500/30';
  if (code === 'low-fill-rate' || code === 'sparse-column') return 'bg-orange-500/15 text-orange-200 border border-orange-500/30';
  if (code === 'identifier-field') return 'bg-slate-500/15 text-slate-200 border border-slate-500/30';
  return 'bg-white/5 text-gray-300 border border-white/10';
}

function profileMatchesFilter(profile: DefectPredictionColumnProfile, filter: ColumnSetupFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'feature') return profile.role === 'feature';
  if (filter === 'ignored') return profile.role === 'ignored';
  if (filter === 'leakage') return profile.warnings.some((warning) => warning.code === 'target-leakage');
  if (filter === 'low-fill') return profile.fillRate > 0 && profile.fillRate < 40;
  return profile.type === filter;
}

function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function nextBrowserFrame(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

function yieldToBrowser(delayMs = 0): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

function asPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function percentOf(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

function confidenceStatus(result?: DefectPredictionResult | null): string {
  if (!result) return 'Not predicted';
  if (result.reliabilityStatus) return result.reliabilityStatus;
  if (result.insufficientLearning) return 'Insufficient Learning';
  if (result.confidence >= 70) return 'Decision support confidence is strong';
  if (result.confidence >= 45) return 'Decision support confidence is usable';
  return 'Decision support confidence is weak';
}

function reliabilityBadgeClass(status: string): string {
  if (status === 'Reliable Decision Support') return 'bg-green-500/20 text-green-300 border border-green-500/30';
  if (status === 'Moderate Decision Support') return 'bg-[#00A3E0]/20 text-[#7DD3FC] border border-[#00A3E0]/30';
  if (status === 'Weak Learning Signal') return 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30';
  return 'bg-red-500/20 text-red-300 border border-red-500/30';
}

function includesAny(value: string, tokens: string[]): boolean {
  const normalized = value.toLowerCase();
  return tokens.some((token) => normalized.includes(token.toLowerCase()));
}

function buildQualityActionPlan(label: string, contributors: DefectPredictionResult['topContributors'], insufficientLearning: boolean): QualityActionPlan {
  const plan: QualityActionPlan = {
    immediate: [],
    verification: [],
    preventive: [],
    dataFollowUp: [],
  };

  if (insufficientLearning) {
    return {
      immediate: ['Review the selected target and confirm enough historical rows are available.'],
      verification: ['Check that leakage, investigation, and action fields are excluded before retraining.'],
      preventive: ['Make key model, part, process, shift, and area fields mandatory for future records.'],
      dataFollowUp: ['Add more validated defect records before using this output for escalation.'],
    };
  }

  if (includesAny(label, ['تسريب', 'لحام', 'leak', 'welding', 'weld'])) {
    plan.immediate.push('Verify leak test result.', 'Check welding point condition.', 'Confirm clamp/contact condition.');
    plan.verification.push('Review welding parameter stability.', 'Check operator handling angle.', 'Verify leak tester calibration.');
    plan.preventive.push('Review fixture maintenance frequency.', 'Add focused audit on welding station.');
    plan.dataFollowUp.push('Track recurrence by model, part code, operator, and shift.');
  }

  if (includesAny(label, ['مكون', 'material', 'component'])) {
    plan.immediate.push('Verify part code and supplier batch.', 'Inspect component condition.');
    plan.verification.push('Review incoming inspection result.', 'Check storage and handling condition.');
    plan.preventive.push('Escalate repeated part issues to supplier quality.');
    plan.dataFollowUp.push('Track defect by supplier, part number, and model.');
  }

  if (includesAny(label, ['تجميع', 'assembly'])) {
    plan.immediate.push('Verify assembly sequence.', 'Check station work instruction.');
    plan.verification.push('Review jig and fixture condition.', 'Confirm operator training status.');
    plan.preventive.push('Update visual standard or checklist.');
    plan.dataFollowUp.push('Track recurrence by station, operator, and shift.');
  }

  if (includesAny(label, ['اداء', 'أداء', 'performance'])) {
    plan.immediate.push('Verify performance test readings.', 'Check sensor/test equipment status.');
    plan.verification.push('Review refrigerant charge, airflow, and electrical readings.');
    plan.preventive.push('Add focused audit on performance test parameters.');
    plan.dataFollowUp.push('Track recurrence by model, test room, and shift.');
  }

  if (includesAny(label, ['تداول', 'handling', 'transport'])) {
    plan.immediate.push('Inspect unit for dents/scratches/handling damage.');
    plan.verification.push('Review transport route and trolley condition.');
    plan.preventive.push('Improve handling separation and protection points.');
    plan.dataFollowUp.push('Track recurrence by area, line, and handling route.');
  }

  if (Object.values(plan).every((group) => group.length === 0)) {
    const focusFields = contributors.slice(0, 2).map((item) => item.label).join(' and ') || 'the strongest contributing fields';
    plan.immediate.push(`Check the current unit against ${focusFields}.`);
    plan.verification.push('Review recent records with the same model, part, process, and detection area.');
    plan.preventive.push('Confirm the control plan covers this likely category.');
    plan.dataFollowUp.push('Track recurrence by model, process, area, and shift.');
  }

  return plan;
}

function buildManagementInsight(result: DefectPredictionResult, targetLabel: string): ManagementInsight {
  const topContributors = result.topContributors.slice(0, 3);
  const topReason = topContributors.map((item) => item.label).join(', ') || 'limited matched historical signals';
  const focus = topContributors[0]?.label || targetLabel;
  const acceptableReliability = result.reliabilityStatus === 'Reliable Decision Support' || result.reliabilityStatus === 'Moderate Decision Support';
  const severeLabel = includesAny(result.defectType, ['تسريب', 'لحام', 'leak', 'welding', 'performance', 'اداء', 'أداء', 'customer return', 'critical', 'severe']);
  const shouldEscalate = result.riskLevel === 'high'
    && !result.insufficientLearning
    && acceptableReliability
    && result.confidenceDetails.unknownFields <= Math.max(1, result.confidenceDetails.activeInputFields);

  return {
    focus,
    topReason,
    confidenceStatus: result.reliabilityStatus,
    escalation: shouldEscalate && severeLabel
      ? 'Escalate for immediate quality review before release or shipment.'
      : 'Use as decision support and verify through normal quality checks before escalation.',
  };
}

function buildPredictionSummaryText(
  result: DefectPredictionResult,
  targetLabel: string,
  insight: ManagementInsight,
  backCheck?: HistoricalBackCheck | null,
  visual?: VisualSummary,
): string {
  const reasons = result.topContributors.slice(0, 3).map((item, index) => `${index + 1}. ${item.label} = ${item.value}`);
  return [
    'Prediction Summary:',
    `Target: ${targetLabel}`,
    `Predicted Result: ${result.defectType}`,
    `Confidence: ${result.confidenceDetails.calibratedConfidence}% - ${confidenceStatus(result)}`,
    `Reliability: ${result.reliabilityStatus}`,
    `Use Guidance: ${result.actionPermissionMessage}`,
    'Top Reasons:',
    ...(reasons.length ? reasons : ['1. No strong matched feature history yet.']),
    'Suggested Focus:',
    insight.focus,
    ...(visual ? [
      'Visual Summary:',
      `Top Target Category: ${visual.topTarget ? `${visual.topTarget.label} (${visual.topTarget.percentage}%)` : 'Not available'}`,
      `Top Pareto Labels: ${visual.topParetoLabels.join(', ') || 'Not available'}`,
      `Top Breakdown Driver: ${visual.topBreakdown ? `${visual.topBreakdown.label} (${visual.topBreakdown.count})` : 'Not available'}`,
      `Top Prediction Signals: ${visual.topSignals.join(', ') || 'Not available'}`,
    ] : []),
    ...(backCheck ? [
      'Historical Back-Check:',
      `Historical Actual: ${backCheck.actual}`,
      `Back-Check Result: ${backCheck.result}`,
    ] : []),
    'Note:',
    'This is decision-support based on historical records, not a confirmed root cause.',
  ].join('\n');
}

function buildPresentationVisualSummaryText(visual: VisualSummary, reliabilityStatus?: string): string {
  return [
    'Presentation Visual Summary:',
    `Top Target Category: ${visual.topTarget ? `${visual.topTarget.label} (${visual.topTarget.count} records, ${visual.topTarget.percentage}%)` : 'Not available'}`,
    `Top Pareto Focus: ${visual.topParetoLabels.join(', ') || 'Not available'}`,
    `Top Breakdown Driver: ${visual.topBreakdown ? `${visual.topBreakdown.label} (${visual.topBreakdown.count} records)` : 'Not available'}`,
    `Top Prediction Signals: ${visual.topSignals.join(', ') || 'Not available'}`,
    `Reliability Status: ${reliabilityStatus || 'No current prediction'}`,
    `Insight: ${visual.insight}`,
    ...(visual.dataQualityNotes.length ? ['Data Quality Notes:', ...visual.dataQualityNotes.map((note, index) => `${index + 1}. ${note}`)] : []),
    'Note:',
    'This is decision-support based on historical records and requires quality verification.',
  ].join('\n');
}

function sourceRowLabel(row: DefectPredictionRow, index: number, source: 'record' | 'import', targetField = 'defectType'): string {
  const sourceName = source === 'record' ? 'Record' : 'Import';
  const date = typeof row.date === 'string' && row.date ? row.date.split('T')[0] : '';
  const line = typeof row.productionLine === 'string' && row.productionLine ? row.productionLine : '';
  const part = typeof row.partId === 'string' && row.partId ? row.partId : row.partNumber;
  const target = row[targetField] ?? row.defectType;
  const defect = typeof target === 'string' && target ? target : '';
  return [sourceName, index + 1, date, line, part, defect].filter(Boolean).join(' | ');
}

function rowToPredictionInput(row: DefectPredictionRow, targetField = 'defectType'): DefectPredictionRow {
  const normalized = normalizePredictionRows([row])[0] || {};
  const next: DefectPredictionRow = { ...defaultPredictionInput, ...normalized };
  delete next.defectType;
  delete next[targetField];
  delete next.id;
  return next;
}

function scenarioValue(row: DefectPredictionRow, candidates: string[]): string {
  for (const candidate of candidates) {
    const value = row[candidate];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function backCheckResult(result: DefectPredictionResult, actual: string): BackCheckMatchResult {
  if (result.defectType === actual) return 'Match';
  const topThree = result.probabilities.slice(0, 3).map((item) => item.label);
  if (topThree.includes(actual)) return 'Top-3 Match';
  return 'Different';
}

function countValuesForVisual(values: string[], limit: number): VisualBarDatum[] {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  const total = values.filter(Boolean).length;
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count, percentage: percentOf(count, total) }));
}

function buildParetoData(values: string[], limit: number): VisualParetoDatum[] {
  const bars = countValuesForVisual(values, limit);
  const total = values.filter(Boolean).length;
  let cumulative = 0;
  return bars.map((item) => {
    cumulative += item.count;
    return { ...item, cumulativePercentage: percentOf(cumulative, total) };
  });
}

function visualValue(row: DefectPredictionRow, field: string): string {
  const value = row[field];
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function renderVisualBars(items: VisualBarDatum[], color = 'from-[#0066CC] to-[#00A3E0]', suffix = '') {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">No visual data available yet.</p>;
  }

  const max = Math.max(1, ...items.map((item) => item.count));
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-xs min-w-0">
            <span className="text-gray-300 truncate" title={item.label}>{item.label}</span>
            <span className="text-gray-400 shrink-0">{item.count}{suffix} · {item.percentage}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${color}`}
              style={{ width: `${Math.max(3, (item.count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function renderSummaryBars(items: VisualBarDatum[], color = 'from-[#0066CC] to-[#00A3E0]') {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">No summary data available yet.</p>;
  }

  const total = items.reduce((sum, item) => sum + item.count, 0);
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex justify-between gap-3 text-xs min-w-0">
            <span className="text-gray-300 truncate" title={item.label}>{item.label}</span>
            <span className="text-gray-400">{item.count}</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${percentOf(item.count, total)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AIIntelligence() {
  const navigate = useNavigate();
  const location = useLocation();
  const forms = useConfigStore((state) => state.forms);
  const optionSets = useConfigStore((state) => state.optionSets);
  const defectLogForm = useMemo(() => forms.find((form) => form.type === 'defect-log'), [forms]);
  const isPredictionRoute = location.pathname.includes('defect-prediction');
  const [activeTab, setActiveTab] = useState(() => (
    location.pathname.includes('defect-prediction') ? 'prediction' : 'assistant'
  ));
  const [predictionWorkspaceView, setPredictionWorkspaceView] = useState<PredictionWorkspaceView>('overview');
  const [predictionModel, setPredictionModel] = useState<DefectPredictionModel | null>(() => loadDefectPredictionModel());
  const [registeredRows, setRegisteredRows] = useState<DefectPredictionRow[]>([]);
  const [importedRows, setImportedRows] = useState<DefectPredictionRow[]>([]);
  const [importedFileInfo, setImportedFileInfo] = useState<ImportedFileInfo | null>(null);
  const [targetField, setTargetField] = useState('defectType');
  const [targetManuallySelected, setTargetManuallySelected] = useState(false);
  const [columnOverrides, setColumnOverrides] = useState<DefectPredictionColumnOverrides>(() => loadDefectPredictionColumnOverrides());
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [importedFileSignature, setImportedFileSignature] = useState<string | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [columnSearch, setColumnSearch] = useState('');
  const [columnFilter, setColumnFilter] = useState<ColumnSetupFilter>('all');
  const [predictionResult, setPredictionResult] = useState<DefectPredictionResult | null>(null);
  const [predictionInput, setPredictionInput] = useState<DefectPredictionRow>(() => defaultPredictionInput);
  const [selectedScenario, setSelectedScenario] = useState<PredictionTestScenario | null>(null);
  const [historicalBackChecks, setHistoricalBackChecks] = useState<HistoricalBackCheck[]>([]);
  const [visualSourceFilter, setVisualSourceFilter] = useState<VisualSourceFilter>('all');
  const [visualTopN, setVisualTopN] = useState(10);
  const [breakdownDimension, setBreakdownDimension] = useState('الموديل');
  const trainingFileRef = useRef<HTMLInputElement>(null);
  const activeImportSignatureRef = useRef<string | null>(null);
  const registeredSummary = useMemo(() => summarizePredictionRows(registeredRows, targetField), [registeredRows, targetField]);
  const importedSummary = useMemo(() => summarizePredictionRows(importedRows, targetField), [importedRows, targetField]);
  const totalTrainingRows = registeredSummary.totalRows + importedSummary.totalRows;
  const totalEligibleRows = registeredSummary.eligibleRows + importedSummary.eligibleRows;
  const modelLabels = predictionModel?.labels.slice(0, 6) || [];
  const inputClass = 'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#00A3E0]';
  const labelClass = 'text-xs font-medium text-gray-400';
  const isOverviewView = predictionWorkspaceView === 'overview';
  const isDataView = predictionWorkspaceView === 'data';
  const isTrainingView = predictionWorkspaceView === 'training';
  const isPredictionWorkspaceView = predictionWorkspaceView === 'prediction';
  const isVisualsView = predictionWorkspaceView === 'visuals';
  const isBackCheckView = predictionWorkspaceView === 'back-check';
  const isPresentationView = predictionWorkspaceView === 'presentation';
  const trainingRows = useMemo(() => [...registeredRows, ...importedRows], [registeredRows, importedRows]);
  const columnDisplayLabels = useMemo(() => getDefectPredictionColumnDisplayLabels(trainingRows), [trainingRows]);
  const columnHygiene = useMemo(() => summarizeDefectPredictionColumnHygiene(trainingRows), [trainingRows]);
  const fieldHints = useMemo<DefectPredictionFieldHints>(() => (
    (defectLogForm?.fields || []).reduce((acc, field) => {
      acc[field.name] = { label: field.label, type: field.type };
      return acc;
    }, {} as DefectPredictionFieldHints)
  ), [defectLogForm]);
  const formPredictionFields = useMemo<PredictionInputField[]>(() => (
    (defectLogForm?.fields || [])
      .filter((field) => field.visible && field.name !== targetField && !excludedPredictionInputFields.has(field.name))
      .sort((a, b) => a.order - b.order)
      .map((field) => ({ ...field, source: 'form' }))
  ), [defectLogForm, targetField]);
  const predictionFields = useMemo<PredictionInputField[]>(() => {
    const existing = new Set(formPredictionFields.map((field) => field.name));
    const learnedFeatures = getDefectPredictionFeatures(trainingRows, formPredictionFields.map((field) => field.name), [targetField], fieldHints, columnOverrides);
    const extraFields = learnedFeatures
      .filter((feature) => feature !== targetField && !existing.has(feature) && !excludedPredictionInputFields.has(feature))
      .map((feature, index) => ({
        name: feature,
        label: predictionModel?.featureLabels[feature] || columnDisplayLabels[feature] || DEFECT_PREDICTION_FEATURE_LABELS[feature] || feature,
        type: 'text' as DynamicField['type'],
        visible: true,
        editable: true,
        order: 1000 + index,
        source: 'data' as const,
      }));

    return [...formPredictionFields, ...extraFields];
  }, [columnDisplayLabels, columnOverrides, fieldHints, formPredictionFields, predictionModel?.featureLabels, targetField, trainingRows]);
  const targetFieldOptions = useMemo(() => {
    const optionMap = new Map<string, string>();
    const ignoredTargetFields = new Set(['id', 'date', 'createdAt', 'updatedAt', 'description', 'actionTaken', 'operatorName', 'relatedNcrId']);

    optionMap.set('defectType', 'Defect Type');
    (defectLogForm?.fields || []).forEach((field) => {
      if (!ignoredTargetFields.has(field.name)) optionMap.set(field.name, field.label);
    });
    trainingRows.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (ignoredTargetFields.has(key)) return;
        const label = defectLogForm?.fields.find((field) => field.name === key)?.label
          || predictionModel?.featureLabels[key]
          || columnDisplayLabels[key]
          || DEFECT_PREDICTION_FEATURE_LABELS[key]
          || key;
        optionMap.set(key, label);
      });
    });

    return [...optionMap.entries()].map(([value, label]) => ({ value, label }));
  }, [columnDisplayLabels, defectLogForm, predictionModel?.featureLabels, trainingRows]);
  const targetLabel = useMemo(() => (
    targetFieldOptions.find((option) => option.value === targetField)?.label || targetField
  ), [targetField, targetFieldOptions]);
  const columnProfiles = useMemo(() => (
    inferDefectPredictionColumnProfiles(trainingRows, targetField, targetLabel, fieldHints, columnOverrides)
  ), [columnOverrides, fieldHints, targetField, targetLabel, trainingRows]);
  const totalColumnCount = columnProfiles.length;
  const featureColumnCount = columnProfiles.filter((profile) => profile.role === 'feature').length;
  const ignoredColumnCount = columnProfiles.filter((profile) => profile.role === 'ignored').length;
  const leakageColumnCount = columnProfiles.filter((profile) => profile.warnings.some((warning) => warning.code === 'target-leakage')).length;
  const highCardinalityColumnCount = columnProfiles.filter((profile) => profile.warnings.some((warning) => warning.code === 'high-cardinality')).length;
  const numericColumnCount = columnProfiles.filter((profile) => profile.type === 'numeric').length;
  const dateColumnCount = columnProfiles.filter((profile) => profile.type === 'date').length;
  const textColumnCount = columnProfiles.filter((profile) => profile.type === 'text').length;
  const identifierColumnCount = columnProfiles.filter((profile) => profile.type === 'identifier').length;
  const categoricalColumnCount = columnProfiles.filter((profile) => profile.type === 'categorical').length;
  const lowFillColumnCount = columnProfiles.filter((profile) => profile.fillRate > 0 && profile.fillRate < 40).length;
  const targetProfile = columnProfiles.find((profile) => profile.role === 'target');
  const targetTopValues = targetProfile?.categoricalStats?.topValues.slice(0, 5) || [];
  const rareTargetLabelCount = targetProfile?.categoricalStats?.rareValuesPercentage
    ? Math.round((targetProfile.distinctCount * targetProfile.categoricalStats.rareValuesPercentage) / 100)
    : 0;
  const importedColumnCount = useMemo(() => {
    const columns = new Set<string>();
    importedRows.forEach((row) => Object.keys(row).forEach((key) => columns.add(key)));
    return importedFileInfo?.columns || columns.size;
  }, [importedFileInfo?.columns, importedRows]);
  const missingValuePercentage = useMemo(() => {
    if (trainingRows.length === 0 || columnProfiles.length === 0) return 0;
    const totalCells = trainingRows.length * columnProfiles.length;
    const totalMissing = columnProfiles.reduce((sum, profile) => sum + profile.nullCount, 0);
    return Math.round((totalMissing / Math.max(1, totalCells)) * 100);
  }, [columnProfiles, trainingRows.length]);
  const recommendedPreset = useMemo(() => getDefectPredictionRecommendedPreset(trainingRows), [trainingRows]);
  const filteredColumnProfiles = useMemo(() => {
    const query = columnSearch.trim().toLowerCase();
    return columnProfiles
      .filter((profile) => profileMatchesFilter(profile, columnFilter))
      .filter((profile) => {
        if (!query) return true;
        return `${profile.label} ${profile.feature} ${profile.reason}`.toLowerCase().includes(query);
      });
  }, [columnFilter, columnProfiles, columnSearch]);
  const sourceRows = useMemo<PredictionSourceRow[]>(() => {
    const registered = registeredRows.slice(0, 25).map((row, index) => ({
      id: `record-${index}`,
      label: sourceRowLabel(applyDefectPredictionTarget([row], targetField)[0] || row, index, 'record', targetField),
      row,
    }));
    const imported = importedRows.slice(0, 25).map((row, index) => ({
      id: `import-${index}`,
      label: sourceRowLabel(applyDefectPredictionTarget([row], targetField)[0] || row, index, 'import', targetField),
      row,
    }));

    return [...registered, ...imported];
  }, [importedRows, registeredRows, targetField]);
  const predictionTestScenarios = useMemo<PredictionTestScenario[]>(() => {
    const rowsWithTarget = applyDefectPredictionTarget(trainingRows, targetField)
      .map((row, index) => ({ row, index, actual: String(row.defectType || '').trim() }))
      .filter((item) => item.actual);
    const step = Math.max(1, Math.floor(rowsWithTarget.length / 10));

    return rowsWithTarget
      .filter((_, index) => index % step === 0)
      .slice(0, 10)
      .map(({ row, index, actual }) => ({
        id: `scenario-${index}`,
        row,
        actual,
        model: scenarioValue(row, ['الموديل', 'partNumber', 'model type']),
        partCode: scenarioValue(row, ['رقم الكود', 'part code', 'partId']),
        process: scenarioValue(row, ['العملية', 'productionLine']),
        area: scenarioValue(row, ['المنطقة', 'منطقة الاكتشاف']),
        shift: scenarioValue(row, ['الوردية', 'shift']),
      }));
  }, [targetField, trainingRows]);
  const activeBackCheck = useMemo(() => {
    if (!selectedScenario || !predictionResult) return null;
    const matches = historicalBackChecks.filter((item) => item.scenarioId === selectedScenario.id);
    return matches[matches.length - 1] || null;
  }, [historicalBackChecks, predictionResult, selectedScenario]);
  const backCheckSummary = useMemo(() => {
    const total = historicalBackChecks.length;
    const confidenceTotal = historicalBackChecks.reduce((sum, item) => sum + item.confidence, 0);
    return {
      total,
      exact: historicalBackChecks.filter((item) => item.result === 'Match').length,
      top3: historicalBackChecks.filter((item) => item.result === 'Top-3 Match').length,
      different: historicalBackChecks.filter((item) => item.result === 'Different').length,
      averageConfidence: total ? Math.round(confidenceTotal / total) : 0,
    };
  }, [historicalBackChecks]);
  const visualRows = useMemo(() => {
    if (visualSourceFilter === 'imported') return importedRows;
    if (visualSourceFilter === 'registered') return registeredRows;
    return trainingRows;
  }, [importedRows, registeredRows, trainingRows, visualSourceFilter]);
  const visualTargetRows = useMemo(() => applyDefectPredictionTarget(visualRows, targetField), [targetField, visualRows]);
  const visualTargetDistribution = useMemo(() => (
    countValuesForVisual(visualTargetRows.map((row) => String(row.defectType || '').trim()), visualTopN)
  ), [visualTargetRows, visualTopN]);
  const visualParetoSourceField = useMemo(() => {
    const hasDetailDefect = visualRows.some((row) => visualValue(row, 'العيب'));
    return hasDetailDefect && targetField !== 'العيب' ? 'العيب' : 'defectType';
  }, [targetField, visualRows]);
  const visualParetoData = useMemo(() => {
    const rows = visualParetoSourceField === 'defectType' ? visualTargetRows : visualRows;
    return buildParetoData(rows.map((row) => (
      visualParetoSourceField === 'defectType' ? String(row.defectType || '').trim() : visualValue(row, visualParetoSourceField)
    )), visualTopN);
  }, [visualParetoSourceField, visualRows, visualTargetRows, visualTopN]);
  const breakdownDimensionOptions = useMemo(() => {
    const candidates = ['الموديل', 'رقم الكود', 'part code', 'model type', 'العملية', 'الجزء', 'القسم', 'الوردية', 'منطقة الاكتشاف', 'متسبب العيب'];
    return candidates
      .filter((field) => visualRows.some((row) => visualValue(row, field)))
      .map((field) => ({
        value: field,
        label: columnDisplayLabels[field] || DEFECT_PREDICTION_FEATURE_LABELS[field] || field,
      }));
  }, [columnDisplayLabels, visualRows]);
  const effectiveBreakdownDimension = breakdownDimensionOptions.some((option) => option.value === breakdownDimension)
    ? breakdownDimension
    : breakdownDimensionOptions[0]?.value || breakdownDimension;
  const breakdownDimensionLabel = breakdownDimensionOptions.find((option) => option.value === effectiveBreakdownDimension)?.label
    || columnDisplayLabels[effectiveBreakdownDimension]
    || effectiveBreakdownDimension;
  const visualBreakdownData = useMemo(() => (
    countValuesForVisual(visualRows.map((row) => visualValue(row, effectiveBreakdownDimension)), visualTopN)
  ), [effectiveBreakdownDimension, visualRows, visualTopN]);
  const visualFeatureSignals = useMemo<VisualSignalDatum[]>(() => (
    (predictionModel?.featureImportance || [])
      .slice(0, visualTopN)
      .map((item) => ({
        label: predictionModel?.featureLabels[item.feature] || columnDisplayLabels[item.feature] || DEFECT_PREDICTION_FEATURE_LABELS[item.feature] || item.feature,
        strength: item.confidence,
        sampleSize: item.sampleSize,
      }))
  ), [columnDisplayLabels, predictionModel, visualTopN]);
  const missingDataSummary = useMemo<VisualBarDatum[]>(() => (
    columnProfiles
      .filter((profile) => profile.nullCount > 0)
      .map((profile) => ({
        label: profile.label,
        count: profile.nullCount,
        percentage: Math.max(0, 100 - profile.fillRate),
      }))
      .sort((a, b) => b.percentage - a.percentage || b.count - a.count)
      .slice(0, 10)
  ), [columnProfiles]);
  const ignoredColumnsSummary = useMemo<VisualBarDatum[]>(() => {
    const counts = new Map<string, number>();
    columnProfiles
      .filter((profile) => profile.role === 'ignored')
      .forEach((profile) => {
        const reason = profile.manualOverride?.role === 'ignored'
          ? 'manual ignored'
          : profile.warnings.some((warning) => warning.code === 'target-leakage')
            ? 'leakage'
            : profile.type === 'identifier'
              ? 'identifier'
              : profile.type === 'empty'
                ? 'empty'
                : profile.type === 'text'
                  ? 'text'
                  : profile.warnings.some((warning) => warning.code === 'high-cardinality')
                    ? 'high cardinality'
                    : 'ignored';
        counts.set(reason, (counts.get(reason) || 0) + 1);
      });
    const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count, percentage: percentOf(count, total) }));
  }, [columnProfiles]);
  const columnTypeSummary = useMemo<VisualBarDatum[]>(() => {
    const counts = new Map<string, number>();
    columnProfiles.forEach((profile) => counts.set(profile.type, (counts.get(profile.type) || 0) + 1));
    const total = columnProfiles.length;
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count, percentage: percentOf(count, total) }));
  }, [columnProfiles]);
  const visualSummary = useMemo<VisualSummary>(() => {
    const topTarget = visualTargetDistribution[0];
    const topBreakdown = visualBreakdownData[0];
    const topParetoLabels = visualParetoData.slice(0, 3).map((item) => item.label);
    const topSignals = visualFeatureSignals.slice(0, 3).map((item) => item.label);
    const notes: string[] = [];
    if (topTarget?.percentage && topTarget.percentage > 70) notes.push('Target distribution is imbalanced, so confidence is adjusted and predictions should be verified carefully.');
    if (leakageColumnCount > 0) notes.push('Leakage-risk fields are excluded from prediction visuals used for modeling.');
    if (missingDataSummary.length > 0) notes.push(`Highest missing-data field is ${missingDataSummary[0].label} at ${missingDataSummary[0].percentage}%.`);
    const insight = topTarget
      ? `The largest target category is ${topTarget.label} with ${topTarget.percentage}% of records. ${
        topBreakdown ? `The top ${breakdownDimensionLabel} driver is ${topBreakdown.label}. ` : ''
      }The Pareto suggests focusing first on ${topParetoLabels.length ? topParetoLabels.join(', ') : topTarget.label}.`
      : 'Import defect data or use registered defect records to view visual management insight.';

    return {
      topTarget,
      topParetoLabels,
      topBreakdown,
      topSignals,
      insight,
      dataQualityNotes: notes,
    };
  }, [breakdownDimensionLabel, leakageColumnCount, missingDataSummary, visualBreakdownData, visualFeatureSignals, visualParetoData, visualTargetDistribution]);
  const activeQuickFieldNames = useMemo(() => {
    const names = new Set(quickFieldNames);
    const route = String(predictionInput.recordType || 'process-ppm');
    (routeQuickFields[route] || []).forEach((field) => names.add(field));
    return names;
  }, [predictionInput.recordType]);
  const quickPredictionFields = useMemo(
    () => predictionFields.filter((field) => activeQuickFieldNames.has(field.name)),
    [activeQuickFieldNames, predictionFields],
  );
  const advancedPredictionFields = useMemo(
    () => predictionFields.filter((field) => !activeQuickFieldNames.has(field.name)),
    [activeQuickFieldNames, predictionFields],
  );
  const workflowSteps = useMemo<Array<{ label: string; status: WorkflowStatus; detail: string }>>(() => ([
    {
      label: 'Import / Load Data',
      status: isImporting ? 'Ready' : totalTrainingRows > 0 ? 'Completed' : 'Pending',
      detail: isImporting ? importStatus || 'Preparing Excel data...' : totalTrainingRows > 0 ? `${totalTrainingRows} rows available` : 'Import Excel/CSV or use registered defects',
    },
    {
      label: 'Review Columns',
      status: columnProfiles.length === 0 ? 'Pending' : leakageColumnCount > 0 || Object.keys(columnOverrides).length > 0 ? 'Completed' : 'Ready',
      detail: columnProfiles.length === 0 ? 'No columns profiled yet' : `${featureColumnCount} features, ${ignoredColumnCount} ignored`,
    },
    {
      label: 'Train Model',
      status: predictionModel ? 'Completed' : totalEligibleRows > 0 ? 'Ready' : totalTrainingRows > 0 ? 'Warning' : 'Pending',
      detail: predictionModel ? `v${predictionModel.version} trained` : totalEligibleRows > 0 ? `${totalEligibleRows} eligible rows` : 'No selected target values',
    },
    {
      label: 'Predict & Act',
      status: predictionResult ? 'Completed' : predictionModel ? 'Ready' : 'Pending',
      detail: predictionResult ? confidenceStatus(predictionResult) : predictionModel ? 'Ready for prediction input' : 'Train first',
    },
  ]), [columnOverrides, columnProfiles.length, featureColumnCount, ignoredColumnCount, importStatus, isImporting, leakageColumnCount, predictionModel, predictionResult, totalEligibleRows, totalTrainingRows]);
  const strongestSignals = useMemo(() => (
    (predictionModel?.featureImportance || [])
      .slice(0, 3)
      .map((item) => predictionModel?.featureLabels[item.feature] || DEFECT_PREDICTION_FEATURE_LABELS[item.feature] || item.feature)
  ), [predictionModel]);
  const actionPlan = useMemo(() => (
    predictionResult ? buildQualityActionPlan(predictionResult.defectType, predictionResult.topContributors, predictionResult.insufficientLearning) : null
  ), [predictionResult]);
  const managementInsight = useMemo(() => (
    predictionResult ? buildManagementInsight(predictionResult, targetLabel) : null
  ), [predictionResult, targetLabel]);
  const confidenceFactors = useMemo(() => {
    if (!predictionResult) return [];
    const topShare = predictionModel?.validation?.topClassShare ?? 0;
    return [
      {
        label: 'Data volume factor',
        value: predictionModel ? `${predictionModel.eligibleRows} eligible rows` : `${totalEligibleRows} eligible rows`,
      },
      {
        label: 'Feature match factor',
        value: `${predictionResult.confidenceDetails.activeInputFields} active inputs, ${predictionResult.confidenceDetails.matchedSampleSize} matched samples`,
      },
      {
        label: 'Unknown input factor',
        value: `${predictionResult.confidenceDetails.unknownFields} unseen or weakly learned values`,
      },
      {
        label: 'Class imbalance factor',
        value: topShare ? `Top class share ${topShare}%` : 'No imbalance signal available',
      },
      {
        label: 'Sample size factor',
        value: predictionResult.confidenceDetails.reliabilityFactors.length
          ? predictionResult.confidenceDetails.reliabilityFactors.join(', ')
          : 'No major reliability reduction applied',
      },
      {
        label: 'Reliability status',
        value: predictionResult.reliabilityStatus,
      },
    ];
  }, [predictionModel, predictionResult, totalEligibleRows]);
  const dataQualitySuggestions = useMemo(() => {
    const suggestions = [
      'Standardize model names, part codes, and defect category naming.',
      'Avoid using investigation, root cause, and action fields as prediction inputs.',
      'Make shift, process, part, model, and detection area mandatory in new records.',
    ];
    if ((targetProfile?.distinctCount || 0) > 50) suggestions.push('Consider predicting a grouped target first, then investigate detailed defect labels.');
    if (rareTargetLabelCount > 0) suggestions.push('Increase records for rare defect classes before relying on their predictions.');
    if (missingValuePercentage > 20) suggestions.push('Reduce missing values in key process and part fields.');
    return suggestions;
  }, [missingValuePercentage, rareTargetLabelCount, targetProfile?.distinctCount]);
  const dataImprovementRecommendations = useMemo(() => {
    const recommendations: string[] = [];
    const lowFillFeatures = columnProfiles
      .filter((profile) => profile.role === 'feature' && profile.fillRate > 0 && profile.fillRate < 70)
      .slice(0, 3)
      .map((profile) => profile.label);

    lowFillFeatures.forEach((label) => {
      recommendations.push(`Make ${label} mandatory during defect recording.`);
    });
    if ((targetProfile?.distinctCount || 0) > 30 || rareTargetLabelCount > 0) {
      recommendations.push('Group detailed defects under stable categories such as اصل العيب before prediction.');
    }
    if (columnHygiene.duplicateColumns.length > 0) {
      recommendations.push('Standardize column names in the Excel template.');
    }
    if (leakageColumnCount > 0) {
      recommendations.push('Keep investigation/action fields separate from prediction input fields.');
    }
    if (textColumnCount > 3) {
      recommendations.push('Convert repeated free-text values into dropdown lists.');
    }

    return recommendations.length ? recommendations : ['Current data structure is usable. Keep standardizing key quality fields as new records are added.'];
  }, [columnHygiene.duplicateColumns.length, columnProfiles, leakageColumnCount, rareTargetLabelCount, targetProfile?.distinctCount, textColumnCount]);
  const getFieldOptions = (field: PredictionInputField): FieldOption[] => {
    if (field?.optionSetId) {
      const optionSet = optionSets.find((set) => set.id === field.optionSetId);
      if (optionSet?.items.length) return optionSet.items;
    }
    if (field?.options?.length) return field.options;
    return fallbackFieldOptions[field.name] || [];
  };
  const distinctValues = (field: string): string[] => {
    const values = trainingRows
      .map((row) => row[field])
      .filter((value): value is string | number => typeof value === 'string' || typeof value === 'number')
      .map((value) => String(value).trim())
      .filter(Boolean);
    return [...new Set(values)].slice(0, 80);
  };
  const fieldValue = (field: PredictionInputField) => predictionInput[field.name] as string | number | boolean | undefined;
  const renderOptions = (options: FieldOption[], includeBlank = false) => (
    <>
      {includeBlank && <option value="">--</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </>
  );
  const renderPredictionField = (field: PredictionInputField) => {
    const options = getFieldOptions(field);
    const value = fieldValue(field);
    const datalistId = `prediction-${field.name.replace(/[^a-zA-Z0-9_-]/g, '-')}-options`;

    if (options.length > 0 || ['select', 'button-group', 'radio', 'multiselect', 'checkbox-group'].includes(field.type)) {
      return (
        <label key={field.name} className="space-y-1">
          <span className={labelClass}>{field.label}</span>
          <select
            className={inputClass}
            value={String(value ?? field.defaultValue ?? '')}
            onChange={(event) => updatePredictionInput(field.name, event.target.value)}
          >
            {renderOptions(options, true)}
          </select>
        </label>
      );
    }

    if (field.type === 'textarea') {
      return (
        <label key={field.name} className="space-y-1 md:col-span-2 xl:col-span-3">
          <span className={labelClass}>{field.label}</span>
          <textarea
            className={`${inputClass} min-h-[96px] resize-y`}
            value={String(value ?? '')}
            onChange={(event) => updatePredictionInput(field.name, event.target.value)}
          />
        </label>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <label key={field.name} className="space-y-1">
          <span className={labelClass}>{field.label}</span>
          <select
            className={inputClass}
            value={String(value ?? '')}
            onChange={(event) => updatePredictionInput(field.name, event.target.value)}
          >
            <option value="">--</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>
      );
    }

    return (
      <label key={field.name} className="space-y-1">
        <span className={labelClass}>{field.label}</span>
        <input
          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
          min={field.type === 'number' ? '0' : undefined}
          className={inputClass}
          list={field.type === 'number' || field.type === 'date' ? undefined : datalistId}
          value={String(value ?? '')}
          onChange={(event) => updatePredictionInput(
            field.name,
            field.type === 'number' ? Number(event.target.value || 0) : event.target.value,
          )}
        />
        {field.type !== 'number' && field.type !== 'date' && (
          <datalist id={datalistId}>
            {distinctValues(field.name).map((item) => <option key={item} value={item} />)}
          </datalist>
        )}
      </label>
    );
  };

  const updateColumnOverride = (
    feature: string,
    patch: Partial<{ type: DefectPredictionColumnType; role: DefectPredictionColumnRole }>,
  ) => {
    setColumnOverrides((current) => {
      const next: DefectPredictionColumnOverrides = { ...current };

      if (patch.role === 'target') {
        Object.keys(next).forEach((key) => {
          if (next[key]?.role === 'target') next[key] = { ...next[key], role: undefined };
        });
        setTargetField(feature);
        setTargetManuallySelected(true);
      }

      const merged = { ...(next[feature] || {}), ...patch };
      if (!merged.type && !merged.role && !merged.label) delete next[feature];
      else next[feature] = merged;

      saveDefectPredictionColumnOverrides(next);
      return next;
    });
    setPredictionModel(null);
    setPredictionResult(null);
  };

  const resetColumnOverride = (feature: string) => {
    setColumnOverrides((current) => {
      const next = { ...current };
      delete next[feature];
      saveDefectPredictionColumnOverrides(next);
      return next;
    });
    setPredictionModel(null);
    setPredictionResult(null);
  };

  const clearColumnOverrides = () => {
    setColumnOverrides({});
    saveDefectPredictionColumnOverrides({});
    setPredictionModel(null);
    setPredictionResult(null);
  };

  const applyRecommendedSetup = () => {
    if (!recommendedPreset) return;
    setColumnOverrides((current) => {
      const next = { ...current, ...recommendedPreset.overrides };
      saveDefectPredictionColumnOverrides(next);
      return next;
    });
    setTargetField(recommendedPreset.targetField);
    setTargetManuallySelected(true);
    setPredictionModel(null);
    setPredictionResult(null);
    toast.success('Recommended setup applied', {
      description: `${recommendedPreset.name}: target ${recommendedPreset.targetLabel}`,
    });
  };

  useEffect(() => {
    let mounted = true;

    loadDefectPredictionTrainingRows()
      .then((rows) => {
        if (mounted) {
          setRegisteredRows(rows);
        }
      })
      .catch((error) => {
        console.warn('Failed to load defect prediction training rows:', error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (location.pathname.includes('defect-prediction')) {
      setActiveTab('prediction');
    }
  }, [location.pathname]);

  useEffect(() => {
    const hasRecommendedExcelTarget = trainingRows.some((row) => row['اصل العيب']);
    if (!targetManuallySelected && targetField === 'defectType' && hasRecommendedExcelTarget) {
      setTargetField('اصل العيب');
      setPredictionModel(null);
      setPredictionResult(null);
    }
  }, [targetField, targetManuallySelected, trainingRows]);

  const updatePredictionInput = <K extends keyof DefectPredictionRow>(field: K, value: DefectPredictionRow[K]) => {
    setPredictionInput((current) => ({ ...current, [field]: value }));
  };

  const applySourceRow = (sourceId: string) => {
    setSelectedSourceId(sourceId);
    const source = sourceRows.find((item) => item.id === sourceId);
    if (!source) return;

    setPredictionInput(rowToPredictionInput(source.row, targetField));
    setSelectedScenario(null);
    setPredictionResult(null);
    toast.success('Prediction input filled', { description: source.label });
  };

  const applyPredictionScenario = (scenario: PredictionTestScenario) => {
    setSelectedScenario(scenario);
    setSelectedSourceId('');
    setPredictionInput(rowToPredictionInput(scenario.row, targetField));
    setPredictionResult(null);
    setPredictionWorkspaceView('prediction');
    toast.success('Historical scenario loaded', {
      description: 'Review the inputs, then click Predict Defect to back-check the model.',
    });
  };

  const clearPredictionInput = () => {
    setSelectedSourceId('');
    setSelectedScenario(null);
    setPredictionInput(defaultPredictionInput);
    setPredictionResult(null);
  };

  const handleTrainingFileImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const fileSignature = `${file.name}:${file.size}:${file.lastModified}`;

    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      toast.error('Unsupported file', { description: 'Import an Excel or CSV file: .xlsx, .xls, or .csv.' });
      event.target.value = '';
      return;
    }

    if (activeImportSignatureRef.current === fileSignature) {
      toast.info('Import already running', { description: 'Please wait for the current Excel import to finish.' });
      event.target.value = '';
      return;
    }

    if (importedRows.length > 0 && importedFileSignature === fileSignature) {
      toast.info('File already imported', {
        description: 'Clear imports before importing the same file again to avoid duplicate training rows.',
      });
      event.target.value = '';
      return;
    }

    activeImportSignatureRef.current = fileSignature;
    setIsImporting(true);
    setImportStatus('Reading file...');
    toast.info('Preparing Excel data', { description: 'Large files may take a few seconds to profile.' });
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        await nextBrowserFrame();
        const data = evt.target?.result;
        if (!data) {
          toast.error('Import failed', { description: 'Could not read any data from this file.' });
          return;
        }

        setImportStatus('Parsing workbook...');
        await nextBrowserFrame();
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;

        if (!sheet) {
          toast.error('Import failed', { description: 'No sheet was found in this file.' });
          return;
        }

        setImportStatus(`Converting ${sheetName} rows...`);
        await yieldToBrowser();
        const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false });

        setImportStatus('Normalizing columns and values...');
        await yieldToBrowser();
        const rows = normalizePredictionRows(jsonRows);

        if (rows.length === 0) {
          toast.error('Import failed', { description: 'No usable rows were found.' });
          return;
        }

        setImportStatus('Updating column profiles...');
        await yieldToBrowser();
        const summary = summarizePredictionRows(rows, targetField);
        setImportedRows((current) => [...current, ...rows]);
        setImportedFileInfo({
          name: file.name,
          sheetName,
          rows: rows.length,
          columns: jsonRows.length ? Object.keys(jsonRows[0]).length : 0,
        });
        setImportedFileSignature(fileSignature);
        toast.success('Training data imported', {
          description: `${rows.length} rows loaded, ${summary.eligibleRows} rows include the selected target.`,
        });
      } catch (error) {
        console.error('Prediction data import failed:', error);
        toast.error('Import failed', { description: 'Please check the Excel or CSV format.' });
      } finally {
        activeImportSignatureRef.current = null;
        setIsImporting(false);
        setImportStatus('');
        event.target.value = '';
      }
    };
    reader.onerror = () => {
      activeImportSignatureRef.current = null;
      setIsImporting(false);
      setImportStatus('');
      event.target.value = '';
      toast.error('Import failed', { description: 'Could not read this file.' });
    };
    reader.readAsArrayBuffer(file);
  };

  const handleTrainPredictionModel = async () => {
    try {
      setIsTraining(true);
      const storedRows = await loadDefectPredictionTrainingRows();
      const allRows = [...storedRows, ...importedRows];
      const summary = summarizePredictionRows(allRows, targetField);
      setRegisteredRows(storedRows);

      if (summary.eligibleRows === 0) {
        toast.error('No training target found', {
          description: 'Choose a Target To Predict field that has values, or import rows that include it.',
        });
        return;
      }

      const model = trainDefectPredictionModel(allRows, predictionFields.map((field) => field.name), targetField, targetLabel, fieldHints, columnOverrides);
      saveDefectPredictionModel(model);
      setPredictionModel(model);
      setPredictionResult(null);
      toast.success('Defect prediction model trained', {
        description: `${model.eligibleRows} usable rows, ${model.labels.length} defect types.`,
      });
    } catch (error) {
      console.error('Failed to train defect prediction model:', error);
      toast.error('Training failed', { description: 'Could not load defect records.' });
    } finally {
      setIsTraining(false);
    }
  };

  const handlePredictDefect = async () => {
    try {
      setIsPredicting(true);
      let model = predictionModel;

      if (!model || model.labels.length === 0 || model.targetField !== targetField) {
        const storedRows = await loadDefectPredictionTrainingRows();
        const allRows = [...storedRows, ...importedRows];
        const summary = summarizePredictionRows(allRows, targetField);
        setRegisteredRows(storedRows);

        if (summary.eligibleRows === 0) {
          toast.error('No training target found', {
            description: 'Choose a Target To Predict field that has values, or import rows that include it.',
          });
          return;
        }

        model = trainDefectPredictionModel(allRows, predictionFields.map((field) => field.name), targetField, targetLabel, fieldHints, columnOverrides);
        saveDefectPredictionModel(model);
        setPredictionModel(model);
      }

      const result = predictDefect(model, predictionInput);
      setPredictionResult(result);
      if (selectedScenario) {
        const matchResult = backCheckResult(result, selectedScenario.actual);
        setHistoricalBackChecks((current) => [
          ...current,
          {
            id: `${selectedScenario.id}-${Date.now()}`,
            scenarioId: selectedScenario.id,
            actual: selectedScenario.actual,
            predicted: result.defectType,
            result: matchResult,
            confidence: result.confidenceDetails.calibratedConfidence,
          },
        ]);
      }
      if (result.insufficientLearning) {
        toast.warning('Insufficient learning', {
          description: 'The model needs more rows or cleaner column setup before this prediction is reliable.',
        });
      } else {
        toast.success('Prediction ready', {
          description: `${result.defectType} with ${result.confidence}% confidence.`,
        });
      }
    } catch (error) {
      console.error('Failed to predict defect:', error);
      toast.error('Prediction failed', { description: 'Could not load or train the defect model.' });
    } finally {
      setIsPredicting(false);
    }
  };

  const handleExportModel = () => {
    if (!predictionModel) {
      toast.error('No model to export');
      return;
    }
    downloadJson(`Defect_Prediction_Model_${new Date().toISOString().split('T')[0]}.json`, {
      ...predictionModel,
      exportedAt: new Date().toISOString(),
      columnOverrides,
      columnHygiene,
      exportType: 'model-summary',
    });
  };

  const handleClearImports = () => {
    setImportedRows([]);
    setImportedFileInfo(null);
    setImportedFileSignature(null);
    setPredictionModel(null);
    setPredictionResult(null);
    setSelectedScenario(null);
    setHistoricalBackChecks([]);
  };

  const handleCopyPredictionSummary = async () => {
    if (!predictionResult || !managementInsight) {
      toast.error('No prediction summary to copy');
      return;
    }

    const summary = buildPredictionSummaryText(predictionResult, targetLabel, managementInsight, activeBackCheck, visualSummary);
    try {
      await navigator.clipboard.writeText(summary);
      toast.success('Prediction summary copied');
    } catch {
      toast.error('Copy failed', { description: 'Clipboard access is not available in this browser.' });
    }
  };

  const handleCopyPresentationSummary = async () => {
    const summary = buildPresentationVisualSummaryText(visualSummary, predictionResult?.reliabilityStatus);
    try {
      await navigator.clipboard.writeText(summary);
      toast.success('Presentation visual summary copied');
    } catch {
      toast.error('Copy failed', { description: 'Clipboard access is not available in this browser.' });
    }
  };

  const handleExportPredictionReport = () => {
    if (!predictionResult || !managementInsight || !actionPlan) {
      toast.error('No prediction report to export');
      return;
    }

    downloadJson(`Defect_Prediction_Report_${new Date().toISOString().split('T')[0]}.json`, {
      exportType: 'prediction-report',
      exportedAt: new Date().toISOString(),
      targetField,
      targetLabel,
      predictedLabel: predictionResult.defectType,
      confidence: {
        raw: predictionResult.confidenceDetails.rawConfidence,
        calibrated: predictionResult.confidenceDetails.calibratedConfidence,
        status: confidenceStatus(predictionResult),
        factors: confidenceFactors,
      },
      reliabilityStatus: predictionResult.reliabilityStatus,
      actionPermissionMessage: predictionResult.actionPermissionMessage,
      riskLevel: predictionResult.riskLevel,
      managementInsight,
      visualSummary: {
        topTargetCategory: visualSummary.topTarget,
        topParetoLabels: visualSummary.topParetoLabels,
        topBreakdownDriver: visualSummary.topBreakdown ? {
          dimension: breakdownDimensionLabel,
          ...visualSummary.topBreakdown,
        } : null,
        topPredictionSignals: visualSummary.topSignals,
        dataQualityNotes: visualSummary.dataQualityNotes,
        reliabilityVisualStatus: predictionResult.reliabilityStatus,
      },
      historicalBackCheck: activeBackCheck ? {
        historicalActual: activeBackCheck.actual,
        predicted: activeBackCheck.predicted,
        matchResult: activeBackCheck.result,
      } : null,
      columnHygiene,
      contributors: predictionResult.topContributors.slice(0, 5),
      alternatives: predictionResult.probabilities.slice(1, 4),
      unknownFields: predictionResult.unknownFields,
      ignoredFields: predictionResult.ignoredFields,
      actionPlan,
      note: 'This is decision-support based on historical records, not a confirmed root cause.',
    });
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prediction':
        return <Target className="w-5 h-5 text-[#FF6B35]" />;
      case 'pattern':
        return <Search className="w-5 h-5 text-[#9C27B0]" />;
      case 'recommendation':
        return <Lightbulb className="w-5 h-5 text-[#00C853]" />;
      default:
        return <Brain className="w-5 h-5 text-[#00A3E0]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-item">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0066CC] to-[#00A3E0] flex items-center justify-center">
            {isPredictionRoute ? <Target className="w-7 h-7 text-white" /> : <Brain className="w-7 h-7 text-white" />}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              {isPredictionRoute ? 'Defect Prediction' : 'AI Intelligence'}
            </h1>
            <p className="text-gray-400">
              {isPredictionRoute ? 'Trained from Defect Recorder, imports, and quality dashboards' : 'Powered by Advanced Machine Learning'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-green-500 text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            AI Online
          </Badge>
          {isPredictionRoute ? (
            <>
              <Button variant="outline" size="sm" className="border-white/10" onClick={() => navigate('/defect-log')}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Defect Recorder
              </Button>
              <Button variant="outline" size="sm" className="border-white/10" onClick={() => navigate('/process-ppm')}>
                <Activity className="w-4 h-4 mr-2" />
                Process PPM
              </Button>
              <Button variant="outline" size="sm" className="border-white/10" onClick={() => navigate('/defect-cost')}>
                <BarChart3 className="w-4 h-4 mr-2" />
                COPQ
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="border-white/10"
              onClick={() => toast.info('Configure AI', { description: 'AI settings coming soon' })}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </Button>
          )}
        </div>
      </div>

      {/* AI Services Grid */}
      {!isPredictionRoute && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-item">
        {aiServices.map((service) => (
          <Card 
            key={service.id} 
            className="glass-panel border-white/10 hover:border-[#00A3E0]/30 transition-all cursor-pointer group"
            onClick={() => toast.info(service.name, { description: 'Service details coming soon' })}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${service.color}20` }}
                >
                  <service.icon className="w-6 h-6" style={{ color: service.color }} />
                </div>
                <Badge 
                  variant="outline" 
                  className={service.status === 'Active' ? 'border-green-500 text-green-400' : 'border-yellow-500 text-yellow-400'}
                >
                  {service.status}
                </Badge>
              </div>
              <h3 className="font-semibold text-white mb-1">{service.name}</h3>
              <p className="text-sm text-gray-400 mb-3">{service.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{service.usage}</span>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-[#00A3E0] transition-colors" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full animate-item">
        {!isPredictionRoute && <TabsList className="bg-white/5 border border-white/10 mb-6 flex flex-wrap h-auto">
          <TabsTrigger value="assistant" className="data-[state=active]:bg-[#0066CC]">
            <MessageSquare className="w-4 h-4 mr-2" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="prediction" className="data-[state=active]:bg-[#0066CC]">
            <Target className="w-4 h-4 mr-2" />
            Defect Prediction
          </TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-[#0066CC]">
            <Lightbulb className="w-4 h-4 mr-2" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-[#0066CC]">
            <BarChart3 className="w-4 h-4 mr-2" />
            AI Analytics
          </TabsTrigger>
        </TabsList>}

        <TabsContent value="assistant" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 glass-panel border-white/10">
              <CardHeader className="border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">AI Assistant</CardTitle>
                    <CardDescription className="text-xs">Use the dedicated chat page for conversational assistance.</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0]"
                    onClick={() => navigate('/ai-chat')}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Open Chat
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-[#FF6B35]" />
                      <span className="text-sm font-medium text-white">Root Cause & CAPA</span>
                    </div>
                    <p className="text-sm text-gray-400">Generate structured 5-Why / Fishbone outputs and draft CAPA recommendations.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-[#00A3E0]" />
                      <span className="text-sm font-medium text-white">SPC & Trend Analysis</span>
                    </div>
                    <p className="text-sm text-gray-400">Interpret control chart signals, capability indices, and drift patterns.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-[#FFD600]" />
                      <span className="text-sm font-medium text-white">Risk & Forecast</span>
                    </div>
                    <p className="text-sm text-gray-400">Assess emerging risks using historical patterns and predictive indicators.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-[#00C853]" />
                      <span className="text-sm font-medium text-white">Compliance Support</span>
                    </div>
                    <p className="text-sm text-gray-400">Get guidance aligned with ISO 9001 / IATF 16949 style workflows.</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <p className="text-sm font-medium text-white">Tip</p>
                    <p className="text-sm text-gray-400">For best results, open chat and ask with part number / line / date range.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10"
                    onClick={() => {
                      setActiveTab('insights');
                      toast.info('AI Insights', { description: 'Showing recent AI insights' });
                    }}
                  >
                    View Insights
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="glass-panel border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {[
                    { label: 'Open AI Chat', icon: MessageSquare, onClick: () => navigate('/ai-chat') },
                    { label: 'Train Defect Model', icon: Target, onClick: () => setActiveTab('prediction') },
                    { label: 'View Insights', icon: Lightbulb, onClick: () => setActiveTab('insights') },
                    { label: 'View Analytics', icon: BarChart3, onClick: () => setActiveTab('analytics') },
                  ].map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      className="w-full justify-start border-white/10 hover:bg-white/5"
                      onClick={action.onClick}
                    >
                      <action.icon className="w-4 h-4 mr-2 text-[#00A3E0]" />
                      {action.label}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass-panel border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">AI Stats</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Interactions</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Accuracy Rate</span>
                    <span className="font-medium text-gray-400">0%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Avg Response Time</span>
                    <span className="font-medium">--</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Active Sessions</span>
                    <span className="font-medium">0</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="prediction" className="mt-0">
          <Tabs
            value={predictionWorkspaceView}
            onValueChange={(value) => setPredictionWorkspaceView(value as PredictionWorkspaceView)}
            className="w-full mb-6"
          >
            <TabsList className="bg-white/5 border border-white/10 flex flex-wrap h-auto gap-1 p-1">
              {predictionWorkspaceTabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-[#0066CC] text-xs sm:text-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {isOverviewView && totalTrainingRows === 0 && (
            <Card className="glass-panel border-white/10 mb-6">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">No training data loaded yet</p>
                    <p className="text-sm text-gray-400 mt-1">Import Excel data or use registered defect records to start training and visual analytics.</p>
                  </div>
                  <Button className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0]" onClick={() => setPredictionWorkspaceView('data')}>
                    Import / Review Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isOverviewView && (
          <Card className="glass-panel border-white/10 mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {workflowSteps.map((step, index) => (
                  <div key={step.label} className="rounded-lg bg-white/5 border border-white/10 p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-sm font-medium text-white">{index + 1}. {step.label}</p>
                      <Badge className={workflowBadgeClass(step.status)}>{step.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-400">{step.detail}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          )}

          {(isDataView || isTrainingView || isPredictionWorkspaceView) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {(isDataView || isTrainingView) && (
            <Card className={`${isPredictionWorkspaceView ? '' : 'lg:col-span-3'} glass-panel border-white/10`}>
              <CardHeader className="border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Model Training</CardTitle>
                    <CardDescription className="text-xs">Defect recorder and imported files</CardDescription>
                  </div>
                  <Activity className="w-5 h-5 text-[#00A3E0]" />
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <input
                  ref={trainingFileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleTrainingFileImport}
                />

                <label className="block space-y-1">
                  <span className={labelClass}>Target To Predict</span>
                  <select
                    className={inputClass}
                    value={targetField}
                    onChange={(event) => {
                      setTargetField(event.target.value);
                      setTargetManuallySelected(true);
                      setPredictionModel(null);
                      setPredictionResult(null);
                    }}
                  >
                    {targetFieldOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {targetField === 'اصل العيب' && (
                      <Badge className="bg-green-500/15 text-green-300 border border-green-500/30">Recommended for data.xlsx</Badge>
                    )}
                    {targetProfile && targetProfile.distinctCount > 30 && (
                      <Badge className="bg-yellow-500/15 text-yellow-200 border border-yellow-500/30">High complexity target: {targetProfile.distinctCount}</Badge>
                    )}
                    {targetProfile && targetProfile.distinctCount > 0 && totalEligibleRows / targetProfile.distinctCount < 10 && (
                      <Badge className="bg-orange-500/15 text-orange-200 border border-orange-500/30">Low samples/class</Badge>
                    )}
                    {targetProfile && targetProfile.fillRate < 70 && (
                      <Badge className="bg-red-500/15 text-red-200 border border-red-500/30">Low fill: {targetProfile.fillRate}%</Badge>
                    )}
                  </div>
                  {(targetLabel.trim() === 'العيب' || (targetProfile?.distinctCount || 0) > 30) && (
                    <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 text-xs text-yellow-100">
                      This target has many detailed classes. Prediction may be unstable unless each class has enough examples. For management-level prediction, start with اصل العيب.
                    </div>
                  )}
                </label>

                {recommendedPreset && (
                  <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-green-200">{recommendedPreset.name}</p>
                        <p className="text-xs text-green-100/80">{recommendedPreset.description}</p>
                      </div>
                      <Badge className="bg-green-500/15 text-green-200 border border-green-500/30">
                        {recommendedPreset.matchedColumns.length} matched
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-500/30 text-green-200 hover:bg-green-500/10"
                      onClick={applyRecommendedSetup}
                    >
                      Apply Recommended Setup
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {importedFileInfo && (
                    <div className="col-span-2 p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-xs text-gray-400">Imported File</p>
                      <p className="text-sm font-semibold text-white truncate">{importedFileInfo.name}</p>
                      <p className="text-xs text-gray-500">
                        {importedFileInfo.sheetName} · {importedFileInfo.rows} rows · {importedFileInfo.columns} columns
                      </p>
                    </div>
                  )}
                  {isImporting && (
                    <div className="col-span-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-100 flex items-start gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">{importStatus || 'Preparing Excel data and column profiles...'}</p>
                        <p className="text-yellow-100/70 mt-1">Large Excel files can take a few seconds while columns are normalized and profiled.</p>
                      </div>
                    </div>
                  )}
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-gray-400">Registered Rows</p>
                    <p className="text-2xl font-bold text-white">{registeredSummary.totalRows}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-gray-400">Imported Rows</p>
                    <p className="text-2xl font-bold text-white">{importedSummary.totalRows}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-gray-400">Training Targets</p>
                    <p className="text-2xl font-bold text-white">{totalEligibleRows}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-gray-400">Model Status</p>
                    <p className="text-lg font-semibold text-white">{formatQuality(predictionModel?.dataQuality)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Database className="w-4 h-4 text-[#00A3E0]" />
                    Training Routes
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(registeredSummary.routeCounts).map(([route, storedCount]) => {
                      const routeKey = route as keyof DefectPredictionTrainingSummary['routeCounts'];
                      const count = storedCount + importedSummary.routeCounts[routeKey];
                      return (
                        <div key={route} className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                          <p className="text-xs text-gray-500">{routeLabels[route] || route}</p>
                          <p className="text-sm font-semibold text-white">{count}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Settings className="w-4 h-4 text-[#FFD600]" />
                    Column Understanding
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-sm font-semibold text-white">{totalColumnCount}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 min-w-0">
                      <p className="text-xs text-gray-500">Target</p>
                      <p className="text-sm font-semibold text-white truncate">{targetLabel}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-xs text-gray-500">Used</p>
                      <p className="text-sm font-semibold text-white">{featureColumnCount}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-xs text-gray-500">Ignored</p>
                      <p className="text-sm font-semibold text-white">{ignoredColumnCount}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-xs text-gray-500">Leakage</p>
                      <p className="text-sm font-semibold text-white">{leakageColumnCount}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-xs text-gray-500">Numeric/Date</p>
                      <p className="text-sm font-semibold text-white">{numericColumnCount}/{dateColumnCount}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-xs text-gray-500">Text/IDs</p>
                      <p className="text-sm font-semibold text-white">{textColumnCount}/{identifierColumnCount}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-xs text-gray-500">Low Fill</p>
                      <p className="text-sm font-semibold text-white">{lowFillColumnCount}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Trained</span>
                    <span className="text-white">{formatDateTime(predictionModel?.trainedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Target Classes</span>
                    <span className="text-white">{predictionModel?.labels.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Validation</span>
                    <span className="text-white">
                      {predictionModel?.validation.accuracy !== undefined
                        ? `${predictionModel.validation.accuracy}%`
                        : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Baseline</span>
                    <span className="text-white">
                      {predictionModel?.validation.baselineAccuracy !== undefined
                        ? `${predictionModel.validation.baselineAccuracy}%`
                        : '--'}
                    </span>
                  </div>
                  {modelLabels.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {modelLabels.map((label) => (
                        <Badge key={label} variant="outline" className="border-white/10 text-gray-300">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {targetProfile?.warnings.length ? (
                    <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 text-xs text-yellow-200">
                      {targetProfile.warnings[0].message}
                    </div>
                  ) : null}
                  {predictionModel?.trainingWarnings?.length ? (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 space-y-1 text-xs text-red-200">
                      {predictionModel.trainingWarnings.slice(0, 3).map((warning) => (
                        <p key={warning}>{warning}</p>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="border-white/10"
                    disabled={isImporting}
                    onClick={() => trainingFileRef.current?.click()}
                  >
                    {isImporting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    {isImporting ? 'Importing...' : 'Import Data'}
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0]"
                    disabled={isImporting || isTraining || totalTrainingRows === 0}
                    onClick={handleTrainPredictionModel}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isTraining ? 'animate-spin' : ''}`} />
                    Train Model
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/10"
                    disabled={isImporting || importedRows.length === 0}
                    onClick={handleClearImports}
                  >
                    Clear Imports
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/10"
                    disabled={Object.keys(columnOverrides).length === 0}
                    onClick={clearColumnOverrides}
                  >
                    Reset Setup
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/10"
                    disabled={!predictionModel}
                    onClick={handleExportModel}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Model
                  </Button>
                  <div className="sm:col-span-2 rounded-lg bg-white/5 border border-white/10 p-3 text-xs text-gray-400">
                    Imported Excel rows are kept in the current browser session only. The trained model and column setup remain saved after refresh.
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {isPredictionWorkspaceView && (
            <Card className="lg:col-span-3 glass-panel border-white/10">
              <CardHeader className="border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Prediction Input</CardTitle>
                    <CardDescription className="text-xs">Current part, process, shipment, or return signal</CardDescription>
                  </div>
                  <Target className="w-5 h-5 text-[#FF6B35]" />
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-3 items-end rounded-lg bg-white/5 border border-white/10 p-4">
                  <label className="space-y-1">
                    <span className={labelClass}>Start From Record</span>
                    <select
                      className={inputClass}
                      value={selectedSourceId}
                      onChange={(event) => applySourceRow(event.target.value)}
                    >
                      <option value="">Manual quick input</option>
                      {sourceRows.map((source) => (
                        <option key={source.id} value={source.id}>{source.label}</option>
                      ))}
                    </select>
                  </label>
                  <Button
                    variant="outline"
                    className="border-white/10"
                    disabled={sourceRows.length === 0}
                    onClick={() => applySourceRow(sourceRows[0]?.id || '')}
                  >
                    Use Latest
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/10"
                    onClick={clearPredictionInput}
                  >
                    Clear
                  </Button>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">Quick Signals</p>
                    <p className="text-xs text-gray-500">{quickPredictionFields.length} fields used for the current route</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10"
                    disabled={advancedPredictionFields.length === 0}
                    onClick={() => setShowAdvancedFields((value) => !value)}
                  >
                    {showAdvancedFields ? 'Hide More Signals' : `More Signals (${advancedPredictionFields.length})`}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {quickPredictionFields.map((field) => renderPredictionField(field))}
                </div>

                {showAdvancedFields && advancedPredictionFields.length > 0 && (
                  <div className="pt-4 border-t border-white/10">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {advancedPredictionFields.map((field) => renderPredictionField(field))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end">
                  <Button
                    className="bg-gradient-to-r from-[#FF6B35] to-[#FFD600] text-black"
                    disabled={isImporting || isPredicting}
                    onClick={handlePredictDefect}
                  >
                    <Target className={`w-4 h-4 mr-2 ${isPredicting ? 'animate-pulse' : ''}`} />
                    Predict Defect
                  </Button>
                </div>
              </CardContent>
            </Card>
            )}
          </div>
          )}

          {isBackCheckView && predictionTestScenarios.length === 0 && (
            <Card className="glass-panel border-white/10 mt-6">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-white">No historical test scenarios yet</p>
                <p className="text-sm text-gray-400 mt-1">Import rows with the selected target, then train the model to generate practical back-check examples.</p>
              </CardContent>
            </Card>
          )}

          {isBackCheckView && predictionTestScenarios.length > 0 && (
            <Card className="glass-panel border-white/10 mt-6">
              <CardHeader className="border-b border-white/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Prediction Test Scenarios</CardTitle>
                    <CardDescription className="text-xs">Historical examples from the current training data for practical back-checking</CardDescription>
                  </div>
                  <Badge variant="outline" className="border-white/10 text-gray-300">
                    {predictionTestScenarios.length} scenarios
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  {predictionTestScenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      className={`rounded-lg border p-3 space-y-3 ${
                        selectedScenario?.id === scenario.id ? 'bg-[#00A3E0]/10 border-[#00A3E0]/30' : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-gray-500">Model</p>
                          <p className="text-white truncate">{scenario.model || '--'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Part Code</p>
                          <p className="text-white truncate">{scenario.partCode || '--'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Process</p>
                          <p className="text-white truncate">{scenario.process || '--'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Area</p>
                          <p className="text-white truncate">{scenario.area || '--'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Shift</p>
                          <p className="text-white truncate">{scenario.shift || '--'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Historical Actual</p>
                          <p className="text-white truncate">{scenario.actual}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-white/10"
                        onClick={() => applyPredictionScenario(scenario)}
                      >
                        Use Scenario
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 rounded-lg bg-white/5 border border-white/10 p-3">
                  <div>
                    <p className="text-xs text-gray-500">Historical Back-Check</p>
                    <p className="text-sm font-semibold text-white">{backCheckSummary.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Exact Matches</p>
                    <p className="text-sm font-semibold text-white">{backCheckSummary.exact}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Top-3 Matches</p>
                    <p className="text-sm font-semibold text-white">{backCheckSummary.top3}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Different</p>
                    <p className="text-sm font-semibold text-white">{backCheckSummary.different}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Avg Confidence</p>
                    <p className="text-sm font-semibold text-white">{backCheckSummary.averageConfidence}%</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">This is a historical back-check, not a future guarantee.</p>
              </CardContent>
            </Card>
          )}

          {isOverviewView && totalTrainingRows > 0 && (
            <Card className="glass-panel border-white/10 mt-6">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="text-base">Visual Management Insight</CardTitle>
                <CardDescription className="text-xs">Short management summary from the current training data</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <p className="text-sm text-gray-300">{visualSummary.insight}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                    <p className="text-xs text-gray-500">Top Target</p>
                    <p className="text-white truncate" title={visualSummary.topTarget?.label}>
                      {visualSummary.topTarget ? `${visualSummary.topTarget.label} (${visualSummary.topTarget.percentage}%)` : '--'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                    <p className="text-xs text-gray-500">Top Focus</p>
                    <p className="text-white truncate" title={visualSummary.topParetoLabels.join(', ')}>
                      {visualSummary.topParetoLabels.slice(0, 3).join(', ') || '--'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                    <p className="text-xs text-gray-500">Reliability</p>
                    <p className="text-white truncate">{predictionResult?.reliabilityStatus || 'Run a prediction'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {(isOverviewView || isTrainingView) && (
          <Card className="glass-panel border-white/10 mt-6">
            <CardHeader className="border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Model Health</CardTitle>
                  <CardDescription className="text-xs">Training quality, storage, and setup status</CardDescription>
                </div>
                <Shield className="w-5 h-5 text-[#00C853]" />
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                  <p className="text-xs text-gray-500">Version</p>
                  <p className="text-sm font-semibold text-white">v{predictionModel?.version || 3}</p>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 min-w-0">
                  <p className="text-xs text-gray-500">Target</p>
                  <p className="text-sm font-semibold text-white truncate">{predictionModel?.targetLabel || targetLabel}</p>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                  <p className="text-xs text-gray-500">Quality</p>
                  <p className="text-sm font-semibold text-white">{formatQuality(predictionModel?.dataQuality)}</p>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                  <p className="text-xs text-gray-500">Eligible</p>
                  <p className="text-sm font-semibold text-white">{predictionModel?.eligibleRows || totalEligibleRows}</p>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                  <p className="text-xs text-gray-500">Excluded</p>
                  <p className="text-sm font-semibold text-white">{predictionModel?.excludedRows ?? Math.max(0, totalTrainingRows - totalEligibleRows)}</p>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                  <p className="text-xs text-gray-500">Features</p>
                  <p className="text-sm font-semibold text-white">{predictionModel?.activeFeatures.length || featureColumnCount}</p>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                  <p className="text-xs text-gray-500">Validation</p>
                  <p className="text-sm font-semibold text-white">
                    {predictionModel?.validation.accuracy !== undefined ? `${predictionModel.validation.accuracy}%` : '--'}
                  </p>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                  <p className="text-xs text-gray-500">Overrides</p>
                  <p className="text-sm font-semibold text-white">{Object.keys(columnOverrides).length}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="outline" className="border-white/10 text-gray-300">Imported {importedRows.length}</Badge>
                <Badge variant="outline" className="border-white/10 text-gray-300">Registered {registeredRows.length}</Badge>
                <Badge variant="outline" className="border-white/10 text-gray-300">Categorical {categoricalColumnCount}</Badge>
                <Badge variant="outline" className="border-white/10 text-gray-300">Storage {predictionModel ? 'saved' : 'not trained'}</Badge>
                <Badge variant="outline" className="border-white/10 text-gray-300">Last {formatDateTime(predictionModel?.trainedAt)}</Badge>
              </div>
              {predictionModel?.trainingWarnings?.length ? (
                <div className="mt-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 text-xs text-yellow-200 space-y-1">
                  {predictionModel.trainingWarnings.map((warning) => <p key={warning}>{warning}</p>)}
                </div>
              ) : null}
            </CardContent>
          </Card>
          )}

          {isVisualsView && (
          <Card className="glass-panel border-white/10 mt-6">
            <CardHeader className="border-b border-white/10">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base">Visual Analytics</CardTitle>
                  <CardDescription className="text-xs">Decision-support visuals from imported and registered defect records</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className={`${inputClass} w-auto min-w-36 py-1.5`}
                    value={visualSourceFilter}
                    onChange={(event) => setVisualSourceFilter(event.target.value as VisualSourceFilter)}
                  >
                    <option value="all">All Sources</option>
                    <option value="imported">Imported</option>
                    <option value="registered">Registered</option>
                  </select>
                  <select
                    className={`${inputClass} w-auto min-w-28 py-1.5`}
                    value={visualTopN}
                    onChange={(event) => setVisualTopN(Number(event.target.value))}
                  >
                    {[5, 10, 15].map((value) => <option key={value} value={value}>Top {value}</option>)}
                  </select>
                  <select
                    className={`${inputClass} w-auto min-w-44 py-1.5`}
                    value={effectiveBreakdownDimension}
                    onChange={(event) => setBreakdownDimension(event.target.value)}
                    disabled={breakdownDimensionOptions.length === 0}
                  >
                    {breakdownDimensionOptions.length > 0
                      ? breakdownDimensionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)
                      : <option value={breakdownDimension}>No dimension</option>}
                  </select>
                  <Button size="sm" variant="outline" className="border-white/10" onClick={handleCopyPresentationSummary}>
                    Copy Presentation Summary
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              {totalTrainingRows === 0 ? (
                <div className="rounded-lg bg-white/5 border border-white/10 p-6 text-sm text-gray-400">
                  Import defect data or use registered defect records to view visual analytics.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-xs text-gray-500">Total Rows</p>
                      <p className="text-sm font-semibold text-white">{visualRows.length}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-xs text-gray-500">Eligible Rows</p>
                      <p className="text-sm font-semibold text-white">{visualTargetRows.filter((row) => row.defectType).length}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 min-w-0">
                      <p className="text-xs text-gray-500">Selected Target</p>
                      <p className="text-sm font-semibold text-white truncate">{targetLabel}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-xs text-gray-500">Target Classes</p>
                      <p className="text-sm font-semibold text-white">{targetProfile?.distinctCount || predictionModel?.labels.length || visualTargetDistribution.length}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-xs text-gray-500">Data Quality</p>
                      <p className="text-sm font-semibold text-white">{formatQuality(predictionModel?.dataQuality)}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-xs text-gray-500">Reliability</p>
                      <p className="text-sm font-semibold text-white truncate">{predictionResult?.reliabilityStatus || 'No prediction'}</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-[#00A3E0]/10 border border-[#00A3E0]/20 p-4">
                    <p className="text-sm font-semibold text-white mb-2">Visual Management Insight</p>
                    <p className="text-sm text-gray-300">{visualSummary.insight}</p>
                    {visualSummary.dataQualityNotes.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {visualSummary.dataQualityNotes.map((note) => (
                          <p key={note} className="text-xs text-yellow-100">{note}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <Card className="bg-white/[0.03] border-white/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Target Distribution</CardTitle>
                        <CardDescription className="text-xs">Selected target classes by record count</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {renderVisualBars(visualTargetDistribution, 'from-[#00A3E0] to-[#00C853]')}
                        {visualSummary.topTarget && visualSummary.topTarget.percentage > 70 && (
                          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 text-xs text-yellow-100">
                            One class dominates more than 70%. Confidence is adjusted and predictions should be verified carefully.
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-white/[0.03] border-white/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Top Defect Pareto</CardTitle>
                        <CardDescription className="text-xs">Vital few labels by count and cumulative share</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {visualParetoData.length > 0 ? (
                          <div className="space-y-3">
                            {visualParetoData.map((item) => (
                              <div key={item.label} className="space-y-1">
                                <div className="flex items-center justify-between gap-3 text-xs min-w-0">
                                  <span className="text-gray-300 truncate" title={item.label}>{item.label}</span>
                                  <span className="text-gray-400 shrink-0">{item.count} · cum {item.cumulativePercentage}%</span>
                                </div>
                                <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                                  <div className="h-full rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FFD600]" style={{ width: `${Math.max(3, item.percentage)}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No Pareto data available yet.</p>
                        )}
                        <p className="text-xs text-gray-500">Pareto helps focus on the vital few defect categories.</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/[0.03] border-white/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Top Prediction Signals</CardTitle>
                        <CardDescription className="text-xs">Strongest learned model features</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {visualFeatureSignals.length > 0 ? (
                          <div className="space-y-3">
                            {visualFeatureSignals.map((item) => (
                              <div key={`${item.label}-${item.sampleSize}`} className="space-y-1">
                                <div className="flex items-center justify-between gap-3 text-xs min-w-0">
                                  <span className="text-gray-300 truncate" title={item.label}>{item.label}</span>
                                  <span className="text-gray-400 shrink-0">{item.strength}% · {item.sampleSize} samples</span>
                                </div>
                                <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                                  <div className="h-full rounded-full bg-gradient-to-r from-[#0066CC] to-[#00A3E0]" style={{ width: `${Math.max(3, item.strength)}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Train the model to view top prediction signals.</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-white/[0.03] border-white/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Defect Drivers Breakdown</CardTitle>
                        <CardDescription className="text-xs">Top {breakdownDimensionLabel} values by defect count</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {renderVisualBars(visualBreakdownData, 'from-[#9C27B0] to-[#00A3E0]')}
                      </CardContent>
                    </Card>

                    <Card className="bg-white/[0.03] border-white/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Prediction Reliability</CardTitle>
                        <CardDescription className="text-xs">Current prediction confidence and reliability status</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {predictionResult ? (
                          <>
                            <div className="flex items-center justify-between">
                              <Badge className={reliabilityBadgeClass(predictionResult.reliabilityStatus)}>{predictionResult.reliabilityStatus}</Badge>
                              <span className="text-sm font-semibold text-white">{predictionResult.confidenceDetails.calibratedConfidence}%</span>
                            </div>
                            <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${
                                  predictionResult.reliabilityStatus === 'Reliable Decision Support'
                                    ? 'from-green-500 to-[#00C853]'
                                    : predictionResult.reliabilityStatus === 'Moderate Decision Support'
                                      ? 'from-[#0066CC] to-[#00A3E0]'
                                      : predictionResult.reliabilityStatus === 'Weak Learning Signal'
                                        ? 'from-yellow-500 to-[#FFD600]'
                                        : 'from-red-500 to-orange-400'
                                }`}
                                style={{ width: `${predictionResult.confidenceDetails.calibratedConfidence}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-400">{predictionResult.actionPermissionMessage}</p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">Run a prediction to view reliability status.</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-white/[0.03] border-white/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Historical Back-Check</CardTitle>
                        <CardDescription className="text-xs">Scenario checks in this browser session</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          {[
                            ['Total', backCheckSummary.total],
                            ['Exact', backCheckSummary.exact],
                            ['Top-3', backCheckSummary.top3],
                            ['Different', backCheckSummary.different],
                            ['Avg %', backCheckSummary.averageConfidence],
                          ].map(([label, value]) => (
                            <div key={String(label)} className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                              <p className="text-xs text-gray-500">{label}</p>
                              <p className="text-sm font-semibold text-white">{value}</p>
                            </div>
                          ))}
                        </div>
                        {renderSummaryBars([
                          { label: 'Exact matches', count: backCheckSummary.exact, percentage: percentOf(backCheckSummary.exact, backCheckSummary.total) },
                          { label: 'Top-3 matches', count: backCheckSummary.top3, percentage: percentOf(backCheckSummary.top3, backCheckSummary.total) },
                          { label: 'Different', count: backCheckSummary.different, percentage: percentOf(backCheckSummary.different, backCheckSummary.total) },
                        ], 'from-[#00C853] to-[#FFD600]')}
                        <p className="text-xs text-gray-500">This is a historical back-check, not a formal holdout accuracy.</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <Card className="bg-white/[0.03] border-white/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Missing Data by Column</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {renderVisualBars(missingDataSummary, 'from-yellow-500 to-orange-400')}
                      </CardContent>
                    </Card>
                    <Card className="bg-white/[0.03] border-white/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Ignored Columns Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {renderSummaryBars(ignoredColumnsSummary, 'from-red-500 to-orange-400')}
                      </CardContent>
                    </Card>
                    <Card className="bg-white/[0.03] border-white/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Column Type Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {renderSummaryBars(columnTypeSummary, 'from-[#0066CC] to-[#00C853]')}
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-white/[0.03] border-white/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Presentation Visual Summary</CardTitle>
                      <CardDescription className="text-xs">Compact view for quality leads and factory management</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Top Target</p>
                        <p className="text-white">{visualSummary.topTarget ? `${visualSummary.topTarget.label} (${visualSummary.topTarget.percentage}%)` : '--'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Top Signals</p>
                        <p className="text-white">{visualSummary.topSignals.join(', ') || '--'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Reliability</p>
                        <p className="text-white">{predictionResult?.reliabilityStatus || 'No prediction'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Suggested Focus</p>
                        <p className="text-white">{visualSummary.topBreakdown?.label || visualSummary.topParetoLabels[0] || '--'}</p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </CardContent>
          </Card>
          )}

          {((isOverviewView && predictionModel) || isDataView) && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
              {isOverviewView && predictionModel && (
              <Card className="glass-panel border-white/10">
                <CardHeader className="border-b border-white/10">
                  <CardTitle className="text-base">Model Business Summary</CardTitle>
                  <CardDescription className="text-xs">Management-ready explanation of what the local model learned</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-3 text-sm text-gray-300">
                  <p>The model is trained on actual defect records from registered logs and imported quality files.</p>
                  <p>The selected prediction target is <span className="text-white font-medium">{predictionModel.targetLabel}</span>.</p>
                  <p>The model uses <span className="text-white font-medium">{predictionModel.activeFeatures.length}</span> active quality signals.</p>
                  <p>
                    The strongest learned signals are{' '}
                    <span className="text-white font-medium">
                      {strongestSignals.length ? strongestSignals.join(', ') : 'not enough signal history yet'}
                    </span>.
                  </p>
                  <p>The current data quality is <span className="text-white font-medium">{formatQuality(predictionModel.dataQuality)}</span>.</p>
                  <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 text-xs text-yellow-100">
                    Use this output as decision support for quality review. It is not an automatic final judgment or confirmed root cause.
                  </div>
                </CardContent>
              </Card>
              )}

              {isDataView && (
              <Card className="glass-panel border-white/10">
                <CardHeader className="border-b border-white/10">
                  <CardTitle className="text-base">Data Quality Report</CardTitle>
                  <CardDescription className="text-xs">Imported dataset and selected target readiness</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-xs text-gray-500">Rows</p>
                      <p className="text-sm font-semibold text-white">{totalTrainingRows}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-xs text-gray-500">Columns</p>
                      <p className="text-sm font-semibold text-white">{importedColumnCount || totalColumnCount}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-xs text-gray-500">Missing</p>
                      <p className="text-sm font-semibold text-white">{asPercent(missingValuePercentage)}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-xs text-gray-500">Leakage</p>
                      <p className="text-sm font-semibold text-white">{leakageColumnCount}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-xs text-gray-500">Ignored</p>
                      <p className="text-sm font-semibold text-white">{ignoredColumnCount}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-xs text-gray-500">High Cardinality</p>
                      <p className="text-sm font-semibold text-white">{highCardinalityColumnCount}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-xs text-gray-500">Target Classes</p>
                      <p className="text-sm font-semibold text-white">{targetProfile?.distinctCount || predictionModel?.labels.length || 0}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-xs text-gray-500">Rare Labels</p>
                      <p className="text-sm font-semibold text-white">{rareTargetLabelCount}</p>
                    </div>
                  </div>

                  {targetTopValues.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-white mb-2">Top Target Labels</p>
                      <div className="space-y-2">
                        {targetTopValues.map((item) => (
                          <div key={item.value} className="flex items-center justify-between text-xs">
                            <span className="text-gray-300">{item.value}</span>
                            <span className="text-gray-400">{item.count} rows</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                    <p className="text-sm font-medium text-white mb-2">Suggested Data Improvements</p>
                    <div className="space-y-1">
                      {dataQualitySuggestions.map((item) => (
                        <p key={item} className="text-xs text-gray-400">{item}</p>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                    <p className="text-sm font-medium text-white mb-2">Data Improvement Recommendations</p>
                    <div className="space-y-1">
                      {dataImprovementRecommendations.map((item) => (
                        <p key={item} className="text-xs text-gray-400">{item}</p>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-3">
                    <p className="text-sm font-medium text-white mb-2">Data Hygiene Note</p>
                    <div className="space-y-1">
                      {columnHygiene.normalizedColumns.length > 0 ? (
                        columnHygiene.normalizedColumns.slice(0, 5).map((entry) => (
                          <p key={`${entry.displayName}-${entry.internalKey}`} className="text-xs text-cyan-100">
                            {entry.displayName === entry.internalKey
                              ? <><span className="whitespace-pre">"{entry.displayName}"</span> is already using the internal key.</>
                              : <><span className="whitespace-pre">"{entry.displayName}"</span> → "{entry.internalKey}"</>}
                          </p>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400">No column-name normalization issues detected.</p>
                      )}
                      {columnHygiene.duplicateColumns.length > 0 && (
                        <p className="text-xs text-yellow-100">
                          {columnHygiene.duplicateColumns.length} duplicate normalized column warning(s) detected.
                        </p>
                      )}
                      <p className="text-xs text-gray-400">No raw data was changed. Normalization is used internally only.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              )}
            </div>
          )}

          {isOverviewView && !predictionModel && totalTrainingRows > 0 && (
            <Card className="glass-panel border-white/10 mt-6">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-white">No model trained yet</p>
                <p className="text-sm text-gray-400 mt-1">Review the selected target and column setup, then train the model before using prediction outputs for decision support.</p>
                <Button className="mt-4 bg-gradient-to-r from-[#0066CC] to-[#00A3E0]" onClick={() => setPredictionWorkspaceView('training')}>
                  Go to Training
                </Button>
              </CardContent>
            </Card>
          )}

          {isPredictionWorkspaceView && !predictionResult && (
            <Card className="glass-panel border-white/10 mt-6">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-white">No prediction generated yet</p>
                <p className="text-sm text-gray-400 mt-1">Fill the prediction input, train or load a model, then run Predict Defect to view reliability and management insight.</p>
              </CardContent>
            </Card>
          )}

          {isPredictionWorkspaceView && predictionResult && (
            <Card className="glass-panel border-white/10 mt-6">
              <CardHeader className="border-b border-white/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Prediction Result</CardTitle>
                    <CardDescription className="text-xs">Most likely defect pattern from trained records</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-[#00A3E0]/20 text-[#7DD3FC] border border-[#00A3E0]/30">
                      {predictionResult.confidence}% confidence
                    </Badge>
                    <Badge className={reliabilityBadgeClass(predictionResult.reliabilityStatus)}>
                      {predictionResult.reliabilityStatus}
                    </Badge>
                    <Badge
                      className={
                        predictionResult.riskLevel === 'high'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : predictionResult.riskLevel === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                            : 'bg-green-500/20 text-green-300 border border-green-500/30'
                      }
                    >
                      {predictionResult.riskLevel.toUpperCase()} RISK
                    </Badge>
                    <Button size="sm" variant="outline" className="border-white/10" onClick={handleCopyPredictionSummary}>
                      Copy Prediction Summary
                    </Button>
                    <Button size="sm" variant="outline" className="border-white/10" onClick={handleExportPredictionReport}>
                      Export Prediction Report
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <p className="text-xs text-gray-400">Predicted {targetLabel}</p>
                    <p className="text-3xl font-bold text-white">{predictionResult.defectType}</p>
                    <p className="text-sm text-gray-400">Model quality: {formatQuality(predictionResult.dataQuality)}</p>
                    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                      <p className="text-xs text-gray-500">Reliability</p>
                      <p className="text-sm font-semibold text-white">{predictionResult.reliabilityStatus}</p>
                      <p className="text-xs text-gray-400 mt-1">{predictionResult.actionPermissionMessage}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                        <p className="text-xs text-gray-500">Raw Confidence</p>
                        <p className="text-sm font-semibold text-white">{predictionResult.confidenceDetails.rawConfidence}%</p>
                      </div>
                      <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                        <p className="text-xs text-gray-500">Calibrated</p>
                        <p className="text-sm font-semibold text-white">{predictionResult.confidenceDetails.calibratedConfidence}%</p>
                      </div>
                    </div>
                    {predictionResult.insufficientLearning && (
                      <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 text-xs text-yellow-200">
                        Insufficient learning. Add more rows or improve column setup before trusting this prediction.
                      </div>
                    )}
                    {predictionResult.dataQualityWarnings.slice(0, 2).map((warning) => (
                      <p key={warning} className="text-xs text-red-300">{warning}</p>
                    ))}
                    {(predictionModel?.labels.length || targetProfile?.distinctCount || 0) > 30 && (
                      <p className="text-xs text-yellow-200">
                        High complexity target. Prediction may be unstable unless each class has enough examples.
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-white">Top Alternative Predictions</p>
                    {predictionResult.probabilities
                      .filter((item) => item.label !== predictionResult.defectType)
                      .slice(0, 3)
                      .map((item) => (
                        <div key={item.label} className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-2">
                          <div className="flex justify-between gap-3 text-xs">
                            <span className="text-gray-200">{item.label}</span>
                            <span className="text-gray-400">{item.probability}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#0066CC] to-[#00A3E0]"
                              style={{ width: `${item.probability}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            Also possible because some historical records share similar input signals, but with weaker support than the selected result.
                          </p>
                        </div>
                      ))}
                    {predictionResult.probabilities.filter((item) => item.label !== predictionResult.defectType).length === 0 && (
                      <p className="text-sm text-gray-500">No alternative labels are strong enough yet.</p>
                    )}
                  </div>

                  <div className="rounded-lg bg-white/5 border border-white/10 p-4">
                    <p className="text-sm font-medium text-white mb-3">Confidence Explanation</p>
                    <div className="space-y-2">
                      {confidenceFactors.map((factor) => (
                        <div key={factor.label} className="flex items-start justify-between gap-3 text-xs">
                          <span className="text-gray-400">{factor.label}</span>
                          <span className="text-right text-gray-200">{factor.value}</span>
                        </div>
                      ))}
                    </div>
                    {predictionResult.confidenceDetails.reliabilityFactors.length > 0 && (
                      <div className="mt-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 space-y-1">
                        {predictionResult.confidenceDetails.reliabilityFactors.slice(0, 4).map((factor) => (
                          <p key={factor} className="text-xs text-yellow-200">{factor}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {managementInsight && (
                  <div className="rounded-lg bg-[#00A3E0]/10 border border-[#00A3E0]/20 p-4">
                    <p className="text-sm font-semibold text-white mb-2">Management Insight</p>
                    <p className="text-sm text-gray-300">
                      Current input conditions are historically linked with{' '}
                      <span className="text-white font-medium">{predictionResult.defectType}</span>. The strongest contributing
                      signals are <span className="text-white font-medium">{managementInsight.topReason}</span>. Recommended
                      focus is to verify <span className="text-white font-medium">{managementInsight.focus}</span> before release,
                      escalation, or process adjustment.
                    </p>
                    <p className="text-xs text-gray-400 mt-2">{predictionResult.actionPermissionMessage}</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
                      <div>
                        <p className="text-xs text-gray-500">Likely {targetLabel}</p>
                        <p className="text-sm text-white">{predictionResult.defectType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Confidence Status</p>
                        <p className="text-sm text-white">{managementInsight.confidenceStatus}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Top Reason</p>
                        <p className="text-sm text-white">{managementInsight.topReason}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Escalation</p>
                        <p className="text-sm text-white">{managementInsight.escalation}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-lg bg-white/5 border border-white/10 p-4">
                  <p className="text-sm font-semibold text-white mb-2">What does this prediction mean?</p>
                  <p className="text-sm text-gray-300">
                    This prediction means that, based on historical records with similar model, part, process, area,
                    detection location, and responsible-source signals, the most likely {targetLabel} is{' '}
                    <span className="text-white font-medium">{predictionResult.defectType}</span>. Confidence is adjusted by
                    data volume, feature matches, unknown values, matched sample size, and class balance.
                  </p>
                </div>

                {activeBackCheck && selectedScenario && (
                  <div className="rounded-lg bg-[#FFD600]/10 border border-[#FFD600]/20 p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">Historical Back-Check</p>
                        <p className="text-xs text-gray-400">This compares the prediction with the selected historical scenario.</p>
                      </div>
                      <Badge
                        className={
                          activeBackCheck.result === 'Match'
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : activeBackCheck.result === 'Top-3 Match'
                              ? 'bg-[#00A3E0]/20 text-[#7DD3FC] border border-[#00A3E0]/30'
                              : 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30'
                        }
                      >
                        {activeBackCheck.result}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Historical Actual</p>
                        <p className="text-white">{activeBackCheck.actual}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Predicted</p>
                        <p className="text-white">{activeBackCheck.predicted}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Back-Check Note</p>
                        <p className="text-gray-300">This is a historical back-check, not a future guarantee.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-lg bg-white/5 border border-white/10 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-sm font-semibold text-white">Top Contributing Fields</p>
                  </div>
                  {predictionResult.topContributors.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="text-gray-400 bg-white/5">
                          <tr>
                            <th className="text-left p-3 font-medium">Field</th>
                            <th className="text-left p-3 font-medium">Input Value</th>
                            <th className="text-left p-3 font-medium">Historical Association</th>
                            <th className="text-left p-3 font-medium">Sample Size</th>
                            <th className="text-left p-3 font-medium">Effect</th>
                            <th className="text-left p-3 font-medium">Strength</th>
                          </tr>
                        </thead>
                        <tbody>
                          {predictionResult.topContributors.slice(0, 6).map((item) => (
                            <tr key={`${item.feature}-${item.value}`} className="border-t border-white/10">
                              <td className="p-3 text-white">{item.label}</td>
                              <td className="p-3 text-gray-300">{item.value}</td>
                              <td className="p-3 text-gray-300">{item.effect}</td>
                              <td className="p-3 text-gray-400">{item.matchingCount}/{item.sampleSize} rows</td>
                              <td className="p-3 text-gray-300">Supports {predictionResult.defectType}</td>
                              <td className="p-3 text-gray-300">{item.confidence}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="p-4 text-sm text-gray-500">No strong matched feature history yet.</p>
                  )}
                </div>

                {actionPlan && (
                  <div className="rounded-lg bg-white/5 border border-white/10 p-4">
                    <p className="text-sm font-semibold text-white mb-3">Suggested Quality Action Plan</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                      {[
                        ['Immediate Check', actionPlan.immediate],
                        ['Process Verification', actionPlan.verification],
                        ['Preventive Action', actionPlan.preventive],
                        ['Data Follow-up', actionPlan.dataFollowUp],
                      ].map(([title, actions]) => (
                        <div key={title as string} className="rounded-lg bg-black/20 border border-white/10 p-3">
                          <p className="text-xs font-semibold text-white mb-2">{title as string}</p>
                          <div className="space-y-2">
                            {(actions as string[]).map((action) => (
                              <p key={action} className="text-xs text-gray-400">{action}</p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(predictionResult.unknownFields.length > 0 || predictionResult.ignoredFields.length > 0 || leakageColumnCount > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
                      <p className="text-sm font-medium text-white mb-2">Unknown Fields</p>
                      {predictionResult.unknownFields.length > 0 ? (
                        predictionResult.unknownFields.slice(0, 5).map((field) => (
                          <p key={`unknown-${field.feature}`} className="text-xs text-yellow-100">
                            {field.label} = {field.value}
                          </p>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500">No unknown input values detected.</p>
                      )}
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                      <p className="text-sm font-medium text-white mb-2">Ignored Fields</p>
                      {predictionResult.ignoredFields.length > 0 ? (
                        predictionResult.ignoredFields.slice(0, 5).map((field) => (
                          <p key={`ignored-${field.feature}`} className="text-xs text-gray-400">
                            {field.label} - {field.reason}
                          </p>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500">No entered fields were ignored by the model.</p>
                      )}
                    </div>
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                      <p className="text-sm font-medium text-white mb-2">Leakage Fields Excluded</p>
                      {columnProfiles
                        .filter((profile) => profile.warnings.some((warning) => warning.code === 'target-leakage'))
                        .slice(0, 5)
                        .map((profile) => (
                          <p key={`leakage-${profile.feature}`} className="text-xs text-red-100">
                            {profile.label}
                          </p>
                        ))}
                      {leakageColumnCount === 0 && (
                        <p className="text-xs text-gray-500">No leakage-risk columns detected.</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {isDataView && columnProfiles.length === 0 && (
            <Card className="glass-panel border-white/10 mt-6">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-white">No columns to review</p>
                <p className="text-sm text-gray-400 mt-1">Import Excel/CSV data or register defect records to see column profiling and setup controls.</p>
              </CardContent>
            </Card>
          )}

          {isDataView && columnProfiles.length > 0 && (
            <Card className="glass-panel border-white/10 mt-6">
              <CardHeader className="border-b border-white/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Column Setup Before Training</CardTitle>
                    <CardDescription className="text-xs">Review detected types, leakage warnings, and manual training roles</CardDescription>
                  </div>
                  <Settings className="w-5 h-5 text-[#FFD600]" />
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <div className="p-4 space-y-3 border-b border-white/10">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                    <input
                      className={inputClass}
                      placeholder="Search columns..."
                      value={columnSearch}
                      onChange={(event) => setColumnSearch(event.target.value)}
                    />
                    <select
                      className={inputClass}
                      value={columnFilter}
                      onChange={(event) => setColumnFilter(event.target.value as ColumnSetupFilter)}
                    >
                      {columnFilterOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {columnFilterOptions.map((option) => (
                      <Button
                        key={option.value}
                        size="sm"
                        variant={columnFilter === option.value ? 'default' : 'outline'}
                        className={columnFilter === option.value ? 'bg-[#00A3E0] text-white' : 'border-white/10'}
                        onClick={() => setColumnFilter(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                  {filteredColumnProfiles.length > 50 && (
                    <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 text-xs text-yellow-100">
                      Many columns are visible. Use search or quick filters to focus on target, leakage, low-fill, or manually overridden columns.
                    </div>
                  )}
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-white/5 text-gray-400">
                    <tr>
                      <th className="text-left p-3 font-medium">Column</th>
                      <th className="text-left p-3 font-medium">Detected</th>
                      <th className="text-left p-3 font-medium">Type</th>
                      <th className="text-left p-3 font-medium">Role</th>
                      <th className="text-left p-3 font-medium">Fill</th>
                      <th className="text-left p-3 font-medium">Distinct</th>
                      <th className="text-left p-3 font-medium">Profile</th>
                      <th className="text-left p-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredColumnProfiles.map((profile) => (
                      <tr key={profile.feature} className="border-t border-white/10">
                        <td className="p-3 min-w-44">
                          <p className="text-white font-medium whitespace-pre-wrap">{profile.displayName || profile.label}</p>
                          {profile.label !== (profile.displayName || profile.label) && (
                            <p className="text-xs text-gray-400">Label: {profile.label}</p>
                          )}
                          <p className="text-xs text-gray-500">Internal Key: {profile.internalKey || profile.feature}</p>
                          {profile.originalColumns && profile.originalColumns.length > 1 && (
                            <p className="text-xs text-yellow-200">
                              Original Columns: {profile.originalColumns.join(', ')}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {profile.role === 'target' && <Badge className="bg-[#FFD600]/15 text-[#FFE66D] border border-[#FFD600]/30">target</Badge>}
                            {columnOverrides[profile.feature] && <Badge className="bg-purple-500/15 text-purple-200 border border-purple-500/30">manual</Badge>}
                            {profile.warnings.map((warning) => (
                              <Badge key={warning.code} className={columnWarningBadgeClass(warning.code)}>
                                {warning.code.replace(/-/g, ' ')}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={columnTypeBadgeClass(profile.detectedType || profile.type)}>
                            {profile.detectedType || profile.type}
                          </Badge>
                        </td>
                        <td className="p-3 min-w-40">
                          <select
                            className={`${inputClass} py-1.5`}
                            value={columnOverrides[profile.feature]?.type || profile.type}
                            onChange={(event) => updateColumnOverride(profile.feature, { type: event.target.value as DefectPredictionColumnType })}
                          >
                            {columnTypeOptions.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 min-w-36">
                          <select
                            className={`${inputClass} py-1.5`}
                            value={profile.role}
                            onChange={(event) => updateColumnOverride(profile.feature, { role: event.target.value as DefectPredictionColumnRole })}
                          >
                            {columnRoleOptions.map((role) => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 text-gray-300">
                          <p>{profile.fillRate}%</p>
                          <p className="text-xs text-gray-500">{profile.nullCount} empty</p>
                        </td>
                        <td className="p-3 text-gray-300">{profile.distinctCount}</td>
                        <td className="p-3 text-gray-400 min-w-48">
                          <p>{profile.reason}</p>
                          {profile.numericStats && (
                            <p className="text-xs text-gray-500 mt-1">
                              min {profile.numericStats.min}, max {profile.numericStats.max}, avg {profile.numericStats.average}
                            </p>
                          )}
                          {profile.dateStats?.earliest && (
                            <p className="text-xs text-gray-500 mt-1">
                              {profile.dateStats.earliest} to {profile.dateStats.latest}
                            </p>
                          )}
                          {profile.categoricalStats?.topValues.length ? (
                            <p className="text-xs text-gray-500 mt-1">
                              Top: {profile.categoricalStats.topValues.slice(0, 3).map((item) => `${item.value} (${item.count})`).join(', ')}
                            </p>
                          ) : null}
                          {profile.sampleValues.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                              {profile.sampleValues.join(', ')}
                            </p>
                          )}
                          {profile.warnings.map((warning) => (
                            <p
                              key={warning.code}
                              className={warning.severity === 'danger' ? 'text-xs text-red-300 mt-1' : 'text-xs text-yellow-200 mt-1'}
                            >
                              {warning.message}
                            </p>
                          ))}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-2">
                            <Badge className={columnRoleBadgeClass(profile.role)}>{profile.role}</Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-white/10"
                              disabled={!columnOverrides[profile.feature]}
                              onClick={() => resetColumnOverride(profile.feature)}
                            >
                              Reset to Auto
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {isTrainingView && (!predictionModel || predictionModel.featureImportance.length === 0) && (
            <Card className="glass-panel border-white/10 mt-6">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-white">No feature importance available yet</p>
                <p className="text-sm text-gray-400 mt-1">Select a target and train the model to view the strongest learned prediction signals.</p>
              </CardContent>
            </Card>
          )}

          {isTrainingView && predictionModel && predictionModel.featureImportance.length > 0 && (
            <Card className="glass-panel border-white/10 mt-6">
              <CardHeader>
                <CardTitle className="text-base">Top Learned Signals</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 text-gray-400">
                    <tr>
                      <th className="text-left p-3 font-medium">Signal</th>
                      <th className="text-left p-3 font-medium">Value</th>
                      <th className="text-left p-3 font-medium">{targetLabel}</th>
                      <th className="text-left p-3 font-medium">Confidence</th>
                      <th className="text-left p-3 font-medium">Rows</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictionModel.featureImportance.map((item) => (
                      <tr key={`${item.feature}-${item.value}-${item.label}`} className="border-t border-white/10">
                        <td className="p-3 text-gray-300">{predictionModel.featureLabels[item.feature] || DEFECT_PREDICTION_FEATURE_LABELS[item.feature] || item.feature}</td>
                        <td className="p-3 text-white">{item.value}</td>
                        <td className="p-3 text-white">{item.label}</td>
                        <td className="p-3 text-[#00A3E0]">{item.confidence}%</td>
                        <td className="p-3 text-gray-400">{item.sampleSize}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {isTrainingView && totalTrainingRows > 0 && (
            <Card className="glass-panel border-white/10 mt-6">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="text-base">Training Distribution Summary</CardTitle>
                <CardDescription className="text-xs">Selected target distribution and Pareto focus for the current training rows</CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="rounded-lg bg-white/[0.03] border border-white/10 p-4">
                    <p className="text-sm font-semibold text-white mb-3">Target Distribution</p>
                    {renderVisualBars(visualTargetDistribution, 'from-[#00A3E0] to-[#00C853]')}
                  </div>
                  <div className="rounded-lg bg-white/[0.03] border border-white/10 p-4">
                    <p className="text-sm font-semibold text-white mb-3">Top Defect Pareto</p>
                    {visualParetoData.length > 0 ? (
                      <div className="space-y-3">
                        {visualParetoData.slice(0, 10).map((item) => (
                          <div key={item.label} className="space-y-1">
                            <div className="flex items-center justify-between gap-3 text-xs min-w-0">
                              <span className="text-gray-300 truncate" title={item.label}>{item.label}</span>
                              <span className="text-gray-400 shrink-0">{item.count} · cum {item.cumulativePercentage}%</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FFD600]" style={{ width: `${Math.max(3, item.percentage)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No Pareto data available yet.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isPresentationView && (
            <div className="space-y-6">
              <Card className="glass-panel border-white/10">
                <CardHeader className="border-b border-white/10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">Presentation Mode</CardTitle>
                      <CardDescription className="text-xs">Compact decision-support summary for quality leads and factory management</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="border-white/10" onClick={handleCopyPresentationSummary}>
                        Copy Presentation Summary
                      </Button>
                      <Button size="sm" variant="outline" className="border-white/10" disabled={!predictionResult} onClick={handleExportPredictionReport}>
                        Export Prediction Report
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                      <p className="text-xs text-gray-500">Top Target</p>
                      <p className="text-white truncate" title={visualSummary.topTarget?.label}>
                        {visualSummary.topTarget ? `${visualSummary.topTarget.label} (${visualSummary.topTarget.percentage}%)` : 'Not available'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                      <p className="text-xs text-gray-500">Top Signals</p>
                      <p className="text-white truncate" title={visualSummary.topSignals.join(', ')}>
                        {visualSummary.topSignals.join(', ') || 'Train model first'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                      <p className="text-xs text-gray-500">Prediction Reliability</p>
                      <p className="text-white truncate">{predictionResult?.reliabilityStatus || 'Run a prediction'}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                      <p className="text-xs text-gray-500">Suggested Focus</p>
                      <p className="text-white truncate" title={visualSummary.topBreakdown?.label || visualSummary.topParetoLabels[0]}>
                        {visualSummary.topBreakdown?.label || visualSummary.topParetoLabels[0] || 'Not available'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-[#00A3E0]/10 border border-[#00A3E0]/20 p-4">
                    <p className="text-sm font-semibold text-white mb-2">Presenter Script</p>
                    <p className="text-sm text-gray-300">
                      The current records show a historically high focus around{' '}
                      <span className="text-white font-medium">{visualSummary.topTarget?.label || 'the selected target'}</span>.
                      The strongest visible signals are{' '}
                      <span className="text-white font-medium">{visualSummary.topSignals.slice(0, 3).join(', ') || 'not available yet'}</span>.
                      Use this as decision support to prioritize checks and verify through standard quality controls.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg bg-white/5 border border-white/10 p-4">
                      <p className="text-sm font-semibold text-white mb-3">Presentation Visual Summary</p>
                      <div className="space-y-2 text-xs text-gray-300">
                        <p>Top Pareto focus: {visualSummary.topParetoLabels.slice(0, 3).join(', ') || 'Not available'}</p>
                        <p>Top breakdown driver: {visualSummary.topBreakdown ? `${visualSummary.topBreakdown.label} (${visualSummary.topBreakdown.count})` : 'Not available'}</p>
                        <p>Data quality notes: {visualSummary.dataQualityNotes.join(' ') || 'No major visual data quality warning.'}</p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 p-4">
                      <p className="text-sm font-semibold text-white mb-3">Presentation Readiness Checklist</p>
                      <div className="space-y-2 text-xs text-gray-300">
                        <p>{predictionModel ? 'Ready' : 'Pending'}: Model trained on current selected target.</p>
                        <p>{predictionResult ? 'Ready' : 'Pending'}: Prediction and reliability status available.</p>
                        <p>{visualSummary.topTarget ? 'Ready' : 'Pending'}: Visual analytics has a top target category.</p>
                        <p>{predictionResult?.insufficientLearning ? 'Warning' : 'Ready'}: No misleading claim from weak learning signal.</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    This summary is for prioritizing quality review. It is not a confirmed root cause or automatic release decision.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="mt-0">
          <div className="space-y-4">
            {aiInsights.map((insight) => (
              <Card key={insight.id} className="glass-panel border-white/10">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">{insight.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-[#00A3E0] text-[#00A3E0]">
                            {insight.confidence}% confidence
                          </Badge>
                          <span className="text-xs text-gray-500">{insight.timestamp}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mb-3">{insight.description}</p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0]"
                          onClick={() => toast.info(insight.action, { description: insight.title })}
                        >
                          {insight.action}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/10"
                          onClick={() => toast.info('Dismissed', { description: 'Insight dismissed' })}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'AI Predictions', value: '0', change: '0%', icon: Target },
              { label: 'Patterns Found', value: '0', change: '0%', icon: Search },
              { label: 'Reports Generated', value: '0', change: '0%', icon: FileText },
              { label: 'Time Saved', value: '0h', change: '0%', icon: Clock },
            ].map((stat) => (
              <Card key={stat.label} className="glass-panel border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className="w-5 h-5 text-[#00A3E0]" />
                    <span className="text-xs text-green-400">{stat.change}</span>
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card className="glass-panel border-white/10 mt-6">
            <CardHeader>
              <CardTitle>AI Usage Trends</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-64 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <div className="text-center">
                  <Clock className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No AI usage records yet</p>
                </div>
              </div>
              <div className="flex justify-between mt-4 text-xs text-gray-500">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AIIntelligence;
