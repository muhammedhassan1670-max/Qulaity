import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Archive,
  Brain,
  CheckCircle2,
  Copy,
  Download,
  FileJson,
  PlusCircle,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer, PageHeader, PageSection } from '@/components/PageHeader';
import { QualityGuidedEmptyState } from '@/components/QualityGuidedEmptyState';
import QualityDashboardFilterBar from '@/components/QualityDashboardFilterBar';
import QualityAnalyticsConsistencyBadge from '@/components/QualityAnalyticsConsistencyBadge';
import { SectionLoader } from '@/components/Loading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createQualityDataProvider, type QualityDataSnapshot } from '@/services/qualityDataProvider';
import {
  buildExecutiveRiskBoard,
  buildAutoParetoInsights,
  buildCorrectiveActionRecommendations,
  buildManagementReport,
  buildPatternInsights,
  buildQualityBackup,
  buildQualityCommandCenterSummary,
  buildQualityDataHealth,
  buildQualityIntelligenceSummary,
  buildRootCauseHypotheses,
  buildTrendChangeDetection,
  downloadJsonFile,
  restoreQualityBackup,
  validateQualityBackup,
  type DataConfidenceLabel,
  type ManagementReport,
  type QualityBackupPayload,
  type QualityBackupValidation,
} from '@/services/qualityRepository';
import { clearSyncedQualitySyncItems, enqueueQualitySyncItem } from '@/services/qualitySyncQueue';
import { buildClosedLoopCommandSummary } from '@/services/qualityClosedLoopIntegration';
import {
  buildImprovementEffectivenessDashboard,
  calculateActionEffectiveness,
  createImprovementAction,
  prefillActionFromDefect,
  refreshActionEffectiveness,
  transitionImprovementAction,
  type ImprovementActionStatus,
  type ImprovementActionType,
  type ImprovementActionSourceType,
  type QualityImprovementAction,
} from '@/services/qualityImprovementActions';
import {
  buildQualityKnowledgeCommandSummary,
  buildStandardActionLibrary,
  buildTrainingSuggestions,
} from '@/services/qualityKnowledgeBase';
import { buildLayeredAuditCommandSummary } from '@/services/qualityLayeredAudits';
import { recordQualitySetupEvent } from '@/services/qualitySetupReadiness';
import {
  buildQualityAnalyticsSnapshot,
  loadQualityDashboardFilters,
  type QualityAnalyticsSnapshot,
  type QualityDashboardFilters,
} from '@/services/qualityAnalyticsHub';
import { buildDashboardDrilldownUrl, recordDashboardDrilldown } from '@/services/qualityDashboardSnapshots';

const backupScopes = [
  { id: 'all', label: 'All Quality Data' },
  { id: 'defect-records', label: 'Defect Records Only' },
  { id: 'escalation-records', label: 'NCR / CAPA / 8D Links' },
  { id: 'master-data', label: 'Master Data Only' },
  { id: 'workflow-settings', label: 'Workflow Settings Only' },
  { id: 'improvement-actions', label: 'Improvement Actions' },
  { id: 'relationships', label: 'Linked Relationships' },
  { id: 'knowledge-base', label: 'Knowledge Base / Lessons' },
  { id: 'form-templates', label: 'Form Templates' },
  { id: 'inspection-plans', label: 'Inspection Plans / Runs' },
  { id: 'layered-audits', label: 'Layered Audit Plans / Runs' },
  { id: 'search-settings', label: 'Search Settings' },
  { id: 'audit-trail', label: 'Audit Trail' },
  { id: 'prediction-settings', label: 'Prediction Settings' },
  { id: 'dashboard-filters', label: 'Dashboard Filters' },
  { id: 'sync-queue', label: 'Sync Queue' },
];

function numberText(value: number): string {
  return Number(value || 0).toLocaleString();
}

function moneyText(value: number): string {
  return `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function bytesText(value: number): string {
  if (value > 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  if (value > 1024) return `${Math.round(value / 1024)} KB`;
  return `${value} B`;
}

function confidenceClass(confidence: DataConfidenceLabel): string {
  if (confidence === 'Strong Signal') return 'bg-emerald-400/15 text-emerald-200 border-emerald-400/20';
  if (confidence === 'Moderate Signal') return 'bg-[#00A3E0]/15 text-[#8be3ff] border-[#00A3E0]/20';
  if (confidence === 'Weak Signal') return 'bg-amber-400/15 text-amber-200 border-amber-400/20';
  return 'bg-white/5 text-white/45 border-white/10';
}

function downloadTextFile(text: string, fileName: string): void {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

const defaultActionForm: Partial<QualityImprovementAction> = {
  title: '',
  description: '',
  sourceType: 'manual',
  actionType: 'corrective',
  priority: 'medium',
  status: 'draft',
  owner: '',
  ownerRole: 'QUALITY_ENGINEER',
  dueDate: '',
  verificationMethod: 'Before/after comparison using matching real defect records',
};

function statusBadgeClass(status: string): string {
  if (['effective', 'closed'].includes(status)) return 'bg-emerald-400/15 text-emerald-200 border-emerald-400/20';
  if (['not-effective', 'cancelled'].includes(status)) return 'bg-red-400/15 text-red-200 border-red-400/20';
  if (['pending-verification', 'in-progress'].includes(status)) return 'bg-amber-400/15 text-amber-200 border-amber-400/20';
  return 'bg-white/5 text-white/55 border-white/10';
}

function nextImprovementStatuses(status: ImprovementActionStatus): ImprovementActionStatus[] {
  const map: Record<ImprovementActionStatus, ImprovementActionStatus[]> = {
    draft: ['open', 'cancelled'],
    open: ['in-progress', 'cancelled'],
    'in-progress': ['pending-verification', 'cancelled'],
    'pending-verification': ['effective', 'not-effective'],
    effective: ['closed'],
    'not-effective': ['open', 'in-progress', 'cancelled'],
    closed: [],
    cancelled: [],
  };
  return map[status] || [];
}

export default function QualityCommandCenter() {
  const [snapshot, setSnapshot] = useState<QualityDataSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBackupScopes, setSelectedBackupScopes] = useState<string[]>(['all']);
  const [restoreCandidate, setRestoreCandidate] = useState<QualityBackupPayload | null>(null);
  const [restoreValidation, setRestoreValidation] = useState<QualityBackupValidation | null>(null);
  const [managementReport, setManagementReport] = useState<ManagementReport | null>(null);
  const [actionForm, setActionForm] = useState<Partial<QualityImprovementAction>>(defaultActionForm);
  const [dashboardFilters, setDashboardFilters] = useState<QualityDashboardFilters>(() => loadQualityDashboardFilters());
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const loadSnapshot = async () => {
    setIsLoading(true);
    try {
      const provider = createQualityDataProvider('local');
      setSnapshot(await provider.loadSnapshot());
    } catch (error) {
      console.error('Quality Command Center failed to load:', error);
      toast.error('Command Center load failed', { description: 'Could not read local quality records.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSnapshot();
  }, []);

  const summary = useMemo(() => snapshot ? buildQualityCommandCenterSummary(snapshot) : null, [snapshot]);
  const riskBoard = useMemo(() => snapshot ? buildExecutiveRiskBoard(snapshot) : [], [snapshot]);
  const dataHealth = useMemo(() => snapshot ? buildQualityDataHealth(snapshot) : null, [snapshot]);
  const intelligence = useMemo(() => snapshot ? buildQualityIntelligenceSummary(snapshot) : null, [snapshot]);
  const paretoInsights = useMemo(() => snapshot ? buildAutoParetoInsights(snapshot) : null, [snapshot]);
  const trendMetrics = useMemo(() => snapshot ? buildTrendChangeDetection(snapshot) : [], [snapshot]);
  const patternInsights = useMemo(() => snapshot ? buildPatternInsights(snapshot) : [], [snapshot]);
  const hypotheses = useMemo(() => snapshot ? buildRootCauseHypotheses(snapshot) : [], [snapshot]);
  const actionRecommendations = useMemo(() => snapshot ? buildCorrectiveActionRecommendations(snapshot) : [], [snapshot]);
  const improvementDashboard = useMemo(
    () => snapshot ? buildImprovementEffectivenessDashboard(snapshot.improvementActions, snapshot.defectRecords) : null,
    [snapshot],
  );
  const closedLoopSummary = useMemo(
    () => snapshot ? buildClosedLoopCommandSummary({ ncrs: snapshot.ncr, capas: snapshot.capa, eightDs: snapshot.eightD, actions: snapshot.improvementActions }) : null,
    [snapshot],
  );
  const knowledgeSummary = useMemo(
    () => snapshot ? buildQualityKnowledgeCommandSummary({ knowledge: snapshot.qualityKnowledge, defects: snapshot.defectRecords, actions: snapshot.improvementActions }) : null,
    [snapshot],
  );
  const auditSummary = useMemo(() => buildLayeredAuditCommandSummary(), [snapshot]);
  const analyticsSnapshot = useMemo<QualityAnalyticsSnapshot | null>(
    () => snapshot ? buildQualityAnalyticsSnapshot(snapshot, dashboardFilters) : null,
    [dashboardFilters, snapshot],
  );
  const standardActionLibrary = useMemo(() => snapshot ? buildStandardActionLibrary(snapshot.qualityKnowledge) : [], [snapshot]);
  const knowledgeTrainingPoints = useMemo(() => snapshot ? buildTrainingSuggestions(snapshot.qualityKnowledge) : [], [snapshot]);
  const hasCommandData = useMemo(() => {
    if (!snapshot) return false;
    const masterRows = Object.values(snapshot.masterData).reduce((sum, rows) => sum + rows.length, 0);
    return snapshot.defectRecords.length
      + snapshot.ncr.length
      + snapshot.capa.length
      + snapshot.eightD.length
      + snapshot.improvementActions.length
      + snapshot.qualityKnowledge.length
      + snapshot.syncQueue.length
      + masterRows > 0;
  }, [snapshot]);

  const commandCards = summary ? [
    ['Open Defects', summary.openDefects, 'Active lifecycle records'],
    ['Pending Review', summary.pendingReview, 'Waiting quality review'],
    ['Pending Approval', summary.pendingApproval, 'Approval governance'],
    ['Investigating', summary.investigating, 'Under action tracking'],
    ['Escalated', summary.escalated, 'Escalated workflow'],
    ['Closed This Month', summary.closedThisMonth, 'Closed lifecycle records'],
    ['Overdue SLA', summary.overdueSla, 'Configured SLA breach'],
    ['High Severity Open', summary.highSeverityOpen, 'Priority quality signal'],
    ['Repeated Defects', summary.repeatedDefects, 'Historically repeated'],
    ['Customer Returns', summary.customerReturns, 'External failure signal'],
    ['Outgoing Holds / Failures', summary.outgoingFailures, 'Outgoing quality signal'],
    ['COPQ Impact', moneyText(summary.copqImpact), 'Estimated real records cost'],
    ['Process PPM', summary.processPpm, 'Based on defect qty / inspected qty'],
    ['NCR Escalations', summary.ncrEscalations, 'Linked or registered NCR'],
    ['CAPA Pending', summary.capaPending, 'Open CAPA records'],
    ['8D Active', summary.eightDActive, 'Open 8D investigations'],
    ['My Tasks', summary.myTasks, 'Derived from real records'],
    ['Unread Notifications', summary.unreadNotifications, 'Local workflow alerts'],
    ['Open Improvement Actions', summary.openImprovementActions, 'Closed-loop action register'],
    ['Pending Verification', summary.pendingImprovementVerification, 'Effectiveness checks'],
    ['Open NCRs', summary.openNcrs, 'Linked non-conformance flow'],
    ['Open CAPAs', summary.openCapas, 'Corrective/preventive actions'],
    ['Open 8Ds', summary.openEightD, 'Structured problem solving'],
    ['Active Lessons', summary.activeKnowledgeLessons, 'Reusable verified learning'],
    ['Standard Actions', summary.standardActionsAvailable, 'Knowledge-driven actions'],
    ['Training Points', summary.trainingPoints, 'Capability development'],
    ['Audits Due Today', auditSummary.auditsDueToday, 'Layered audit cadence'],
    ['Completed Audits', auditSummary.completedAudits, 'Supervisor audit execution'],
    ['Critical Audit Findings', auditSummary.criticalFindings, 'Requires verification'],
    ['Repeat Audit Findings', auditSummary.repeatAuditFindings, 'Historically repeated gaps'],
    ['Audit Actions Overdue', auditSummary.auditActionsOverdue, 'Audit action follow-up'],
    ['Lowest Audit Line', auditSummary.lowestComplianceLine, 'Suggested supervisor focus'],
  ] : [];

  const commandDrilldowns: Record<string, { route: string; filters: Partial<QualityDashboardFilters> }> = {
    'Open Defects': { route: '/defect-log', filters: {} },
    'Pending Review': { route: '/defect-log', filters: {} },
    'Pending Approval': { route: '/defect-log', filters: {} },
    'Open NCRs': { route: '/quality/records/ncr', filters: { ncrStatus: 'open' } },
    'Open CAPAs': { route: '/quality/records/capa', filters: { capaStatus: 'open' } },
    'Open 8Ds': { route: '/quality/records/8d', filters: { eightDStatus: 'open' } },
    'CAPA Pending': { route: '/quality/records/capa', filters: { capaStatus: 'open' } },
    '8D Active': { route: '/quality/records/8d', filters: { eightDStatus: 'open' } },
    'Open Improvement Actions': { route: '/quality-command-center', filters: { actionStatus: 'open' } },
    'Pending Verification': { route: '/quality-command-center', filters: { effectivenessStatus: 'pending-verification' } },
    'Critical Audit Findings': { route: '/quality-audits', filters: { severity: 'critical' } },
    'Audit Actions Overdue': { route: '/quality-audits', filters: { actionStatus: 'overdue' } },
    'Active Lessons': { route: '/quality-knowledge-base', filters: {} },
  };

  const toggleBackupScope = (scope: string) => {
    setSelectedBackupScopes((prev) => {
      if (scope === 'all') return ['all'];
      const withoutAll = prev.filter((item) => item !== 'all');
      const next = withoutAll.includes(scope) ? withoutAll.filter((item) => item !== scope) : [...withoutAll, scope];
      return next.length > 0 ? next : ['all'];
    });
  };

  const exportBackup = () => {
    const backup = buildQualityBackup(selectedBackupScopes);
    downloadJsonFile(backup, `quality_backup_${new Date().toISOString().split('T')[0]}.json`);
    recordQualitySetupEvent('backup-export', selectedBackupScopes.join(', '));
    toast.success('Quality backup exported', {
      description: 'The export contains selected local quality data, not generated demo data.',
    });
  };

  const importBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}')) as QualityBackupPayload;
        const validation = validateQualityBackup(parsed);
        setRestoreValidation(validation);
        setRestoreCandidate(validation.valid ? parsed : null);
        if (validation.valid) {
          toast.success('Backup validated', { description: 'Review the restore preview before overwriting local data.' });
        } else {
          toast.error('Invalid backup', { description: validation.message });
        }
      } catch {
        setRestoreCandidate(null);
        setRestoreValidation({ valid: false, message: 'Backup JSON could not be parsed.', scopes: [], itemCounts: {} });
        toast.error('Invalid backup JSON');
      } finally {
        if (event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const restoreBackup = async () => {
    if (!restoreCandidate || !restoreValidation?.valid) return;
    const confirmed = window.confirm('Restore will overwrite matching local quality data keys. Continue?');
    if (!confirmed) return;
    try {
      restoreQualityBackup(restoreCandidate);
      setRestoreCandidate(null);
      setRestoreValidation(null);
      await loadSnapshot();
      toast.success('Backup restored', { description: 'Local quality data was restored from the selected backup.' });
    } catch (error) {
      toast.error('Restore failed', { description: error instanceof Error ? error.message : 'Backup could not be restored.' });
    }
  };

  const clearSynced = async () => {
    clearSyncedQualitySyncItems();
    await loadSnapshot();
    toast.success('Synced queue items cleared');
  };

  const generateManagementReport = () => {
    if (!snapshot) return;
    const baseReport = buildManagementReport(snapshot);
    const report = analyticsSnapshot ? {
      ...baseReport,
      markdown: [
        baseReport.markdown,
        '',
        '## Unified Dashboard Consistency',
        `Applied filters: ${JSON.stringify(analyticsSnapshot.filters)}`,
        analyticsSnapshot.managementSummary,
        `PPM: ${analyticsSnapshot.ppmMetrics.currentPpm}. COPQ: ${moneyText(analyticsSnapshot.copqMetrics.totalCopq)}. Failed checks without defects: ${analyticsSnapshot.inspectionExecutionMetrics.failedChecksWithoutDefect}.`,
        `Dashboard confidence labels: ${Object.entries(analyticsSnapshot.dashboardConfidenceLabels).map(([key, value]) => `${key}: ${value}`).join(', ')}.`,
        'Dashboard consistency note: specialized dashboards read from the same local analytics hub snapshot where integrated.',
      ].join('\n'),
      json: {
        ...baseReport.json,
        appliedDashboardFilters: analyticsSnapshot.filters,
        analyticsHubSummary: {
          managementSummary: analyticsSnapshot.managementSummary,
          ppm: analyticsSnapshot.ppmMetrics.currentPpm,
          copq: analyticsSnapshot.copqMetrics.totalCopq,
          outgoingPassRate: analyticsSnapshot.outgoingMetrics.passRate,
          failedChecksWithoutDefect: analyticsSnapshot.inspectionExecutionMetrics.failedChecksWithoutDefect,
          confidenceLabels: analyticsSnapshot.dashboardConfidenceLabels,
          dataQualityWarnings: analyticsSnapshot.dataQualityMetrics.warnings,
        },
      },
    } : baseReport;
    setManagementReport(report);
    enqueueQualitySyncItem({
      entityType: 'dashboard',
      entityId: 'quality-management-report',
      operation: 'management-report-export',
      payloadSummary: 'Management report generated from unified local analytics.',
    });
    toast.success('Management summary generated', {
      description: 'The summary uses real local quality records and safe decision-support wording.',
    });
  };

  const copyManagementReport = async () => {
    const report = managementReport || (snapshot ? buildManagementReport(snapshot) : null);
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report.markdown);
      setManagementReport(report);
      toast.success('Management summary copied');
    } catch {
      toast.error('Copy failed', { description: 'Clipboard access is not available in this browser context.' });
    }
  };

  const updateActionForm = (patch: Partial<QualityImprovementAction>) => {
    setActionForm((prev) => ({ ...prev, ...patch }));
  };

  const fillActionFromTopRisk = () => {
    if (!snapshot || riskBoard.length === 0) {
      toast.info('No active risk is available to prefill an action.');
      return;
    }
    const defect = snapshot.defectRecords.find((record) => record.id === riskBoard[0].relatedDefectId);
    if (!defect) return;
    setActionForm({ ...defaultActionForm, ...prefillActionFromDefect(defect), status: 'draft' });
    toast.success('Action draft prepared', { description: 'Review and save before the action is registered.' });
  };

  const createAction = async () => {
    if (!actionForm.title?.trim()) {
      toast.error('Action title is required');
      return;
    }
    createImprovementAction(actionForm);
    setActionForm(defaultActionForm);
    await loadSnapshot();
    toast.success('Improvement action registered', {
      description: 'The action was saved locally and added to the sync queue for future backend readiness.',
    });
  };

  const moveAction = async (action: QualityImprovementAction, nextStatus: ImprovementActionStatus) => {
    const result = transitionImprovementAction(action.id, nextStatus, `Moved from ${action.status} to ${nextStatus} from Command Center.`);
    if (result.error) {
      toast.error('Action transition blocked', { description: result.error });
      return;
    }
    await loadSnapshot();
    toast.success('Action status updated');
  };

  const refreshEffectiveness = async (action: QualityImprovementAction) => {
    if (!snapshot) return;
    const updated = refreshActionEffectiveness(action.id, snapshot.defectRecords);
    if (!updated) {
      toast.error('Action was not found');
      return;
    }
    await loadSnapshot();
    toast.success('Effectiveness refreshed', {
      description: 'Before/after metrics were recalculated from matching real defect records.',
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Quality Command Center"
        subtitle="Centralized local command view for defect lifecycle, governance, risk, sync readiness, backup, and data health"
      />

      <PageSection>
        {isLoading ? (
          <SectionLoader message="Loading real quality command data..." />
        ) : !snapshot || !summary || !dataHealth || !intelligence || !paretoInsights || !improvementDashboard || !closedLoopSummary || !knowledgeSummary || !hasCommandData ? (
          <QualityGuidedEmptyState
            title="No command data available"
            purpose="The Command Center aggregates real local defects, workflow settings, tasks, risks, master data, actions, knowledge, sync, and backup health."
            firstAction="Create or import master data, publish a form, then log the first defect or inspection run."
            actionHref="/quality-home"
            actionLabel="Open Guided Setup"
          />
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <TabsList className="bg-white/5 border border-white/10 p-1 w-full lg:w-auto overflow-x-auto no-scrollbar justify-start">
                {[
                  ['overview', 'Overview'],
                  ['risk', 'Risk Board'],
                  ['intelligence', 'Intelligence'],
                  ['trends', 'Trends'],
                  ['patterns', 'Patterns'],
                  ['knowledge', 'Knowledge / Lessons'],
                  ['improvement', 'Improvement Effectiveness'],
                  ['report', 'Management Report'],
                  ['health', 'Data Health'],
                  ['backup-sync', 'Backup / Sync'],
                ].map(([value, label]) => (
                  <TabsTrigger key={value} value={value} className="data-[state=active]:bg-[#0066CC] data-[state=active]:text-white px-4 py-2 shrink-0">
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <button
                type="button"
                onClick={loadSnapshot}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-bold hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Real Data
              </button>
              <Link
                to="/quality-search"
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#0066CC]/20 border border-[#0066CC]/25 text-[#8be3ff] text-sm font-bold hover:bg-[#0066CC]/30"
              >
                Quality Search
              </Link>
              <Link
                to="/quality-execution-board"
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-bold hover:bg-white/10"
              >
                Execution Board
              </Link>
              <Link
                to="/defect-log"
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-bold hover:bg-white/10"
              >
                Defect Log
              </Link>
            </div>

            <div className="mb-6">
              <QualityDashboardFilterBar value={dashboardFilters} onChange={setDashboardFilters} compact />
            </div>

            <div className="mb-6">
              <QualityAnalyticsConsistencyBadge dashboardName="Quality Command Center" snapshot={analyticsSnapshot} compact />
            </div>

            <TabsContent value="overview" className="mt-0 focus-visible:outline-none">
              <div className="space-y-6">
                {analyticsSnapshot && (
                  <div className="rounded-2xl border border-[#00A3E0]/20 bg-[#00A3E0]/10 p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-lg font-black text-white">Unified Analytics Hub Summary</h3>
                        <p className="mt-1 text-sm text-[#8be3ff]">{analyticsSnapshot.managementSummary}</p>
                        <p className="mt-2 text-xs text-white/45">
                          Filtered records: {analyticsSnapshot.defectMetrics.totalRecords} defects, {analyticsSnapshot.filteredInspectionRuns.length} inspection runs, {analyticsSnapshot.filteredAuditRuns.length} audit runs.
                        </p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-black ${confidenceClass(analyticsSnapshot.dashboardConfidenceLabels.defects)}`}>
                        {analyticsSnapshot.dashboardConfidenceLabels.defects}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
                      {[
                        ['PPM', analyticsSnapshot.ppmMetrics.currentPpm],
                        ['COPQ', moneyText(analyticsSnapshot.copqMetrics.totalCopq)],
                        ['Failed Checks', analyticsSnapshot.inspectionExecutionMetrics.failedChecksWithoutDefect],
                        ['Audit Findings', analyticsSnapshot.auditMetrics.failedAuditItems],
                        ['Open NCRs', analyticsSnapshot.escalationMetrics.openNcrs],
                        ['Open CAPAs', analyticsSnapshot.escalationMetrics.openCapas],
                        ['Open Actions', analyticsSnapshot.actionEffectivenessMetrics.openActions],
                        ['Knowledge Gaps', analyticsSnapshot.knowledgeMetrics.repeatedDefectsWithoutLessons.length],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/35">{String(label)}</p>
                          <p className="mt-1 text-lg font-black text-white">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="glass-panel p-5 rounded-2xl border border-white/10">
                  <h3 className="mb-4 text-lg font-black text-white">Closed-Loop Quality Flow</h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-9">
                    {[
                      ['Setup Master Data', '/quality-master-data'],
                      ['Design Form', '/quality-form-designer'],
                      ['Build Plan', '/quality-inspection-plans'],
                      ['Execute', '/quality-shopfloor'],
                      ['Record Defect', '/defect-log'],
                      ['Review / Escalate', '/quality/records/ncr'],
                      ['Action', '/quality-command-center'],
                      ['Verify', '/quality-command-center'],
                      ['Lesson', '/quality-knowledge-base'],
                    ].map(([label, href], index) => (
                      <Link key={label} to={href} className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs font-black text-white/65 hover:bg-white/10">
                        <span className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0066CC] text-[10px] text-white">{index + 1}</span>
                        <span className="block">{label}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
                  {commandCards.map(([label, value, description]) => {
                    const target = commandDrilldowns[String(label)];
                    const body = (
                      <>
                        <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">{String(label)}</p>
                        <p className="text-2xl font-black text-white mt-2">{typeof value === 'number' ? numberText(value) : String(value)}</p>
                        <p className="text-[10px] text-white/35 mt-2">{String(description)}</p>
                      </>
                    );
                    return target ? (
                      <Link
                        key={String(label)}
                        to={buildDashboardDrilldownUrl(target.route, target.filters)}
                        onClick={() => recordDashboardDrilldown(target.route, target.filters, String(label))}
                        className="glass-panel p-4 rounded-2xl border border-white/10 hover:bg-white/10"
                      >
                        {body}
                      </Link>
                    ) : (
                      <div key={String(label)} className="glass-panel p-4 rounded-2xl border border-white/10">
                        {body}
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6">
                  <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3 mb-5">
                      <ShieldAlert className="w-5 h-5 text-amber-300" />
                      <h3 className="text-xl font-black text-white">Top Active Quality Risks</h3>
                    </div>
                    {riskBoard.length === 0 ? (
                      <p className="text-sm text-white/35">No active quality risks from current real records.</p>
                    ) : (
                      <div className="space-y-3">
                        {riskBoard.slice(0, 5).map((risk) => (
                          <Link key={risk.id} to={`/quality/defect-log/${risk.relatedDefectId}`} className="block rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-all">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-sm font-black text-white">{risk.title}</p>
                                <p className="text-xs text-white/40 mt-1">{risk.affectedContext}</p>
                              </div>
                              <span className="px-3 py-1 rounded-full bg-amber-400/15 text-amber-200 text-xs font-black">Risk {risk.riskScore}</span>
                            </div>
                            <p className="text-xs text-[#00A3E0] mt-3">{risk.suggestedNextAction}</p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3 mb-5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                      <h3 className="text-xl font-black text-white">Command Insight</h3>
                    </div>
                    <p className="text-sm text-white/65 leading-relaxed">
                      The current command view is based on locally stored quality records and governance settings. Use it to prioritize review, containment, approvals, and follow-up. It is decision-support and requires engineering verification.
                    </p>
                    <div className="mt-5 space-y-2">
                      {dataHealth.recommendations.slice(0, 4).map((recommendation) => (
                        <div key={recommendation} className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/60">
                          {recommendation}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="risk" className="mt-0 focus-visible:outline-none">
              <div className="glass-panel p-6 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3 mb-5">
                  <AlertTriangle className="w-5 h-5 text-amber-300" />
                  <h3 className="text-xl font-black text-white">Executive Risk Board</h3>
                </div>
                {riskBoard.length === 0 ? (
                  <p className="text-sm text-white/35">No active risk items. Open defects will appear here when real records indicate priority quality signals.</p>
                ) : (
                  <div className="space-y-4">
                    {riskBoard.map((risk) => (
                      <Link key={risk.id} to={`/quality/defect-log/${risk.relatedDefectId}`} className="block rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-all">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-lg font-black text-white">{risk.title}</p>
                            <p className="text-xs text-white/40 mt-1">{risk.affectedContext} | Defect {risk.relatedDefectId}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 rounded-full bg-amber-400/15 text-amber-200 text-xs font-black">Risk Score {risk.riskScore}</span>
                            <span className="px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs font-black">{risk.slaStatus}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                          <div className="rounded-xl bg-black/10 border border-white/10 p-3">
                            <p className="text-[10px] uppercase font-black text-white/35">Owner</p>
                            <p className="text-sm font-bold text-white mt-1">{risk.owner}</p>
                          </div>
                          <div className="rounded-xl bg-black/10 border border-white/10 p-3">
                            <p className="text-[10px] uppercase font-black text-white/35">Required Role</p>
                            <p className="text-sm font-bold text-white mt-1">{risk.nextRequiredRole}</p>
                          </div>
                          <div className="rounded-xl bg-black/10 border border-white/10 p-3">
                            <p className="text-[10px] uppercase font-black text-white/35">Suggested Focus</p>
                            <p className="text-sm font-bold text-[#00A3E0] mt-1">{risk.suggestedNextAction}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                          {risk.reasonSignals.map((signal) => (
                            <span key={signal} className="px-2 py-1 rounded bg-white/10 text-[10px] text-white/55">{signal}</span>
                          ))}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="intelligence" className="mt-0 focus-visible:outline-none">
              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                      <Brain className="w-5 h-5 text-[#00A3E0]" />
                      <div>
                        <h3 className="text-xl font-black text-white">Quality Intelligence Summary</h3>
                        <p className="text-xs text-white/40">Management-friendly insights from real local quality data only</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full border text-xs font-black ${confidenceClass(intelligence.confidence)}`}>
                      {intelligence.confidence}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[
                      intelligence.overallQualityStatus,
                      intelligence.topCurrentQualitySignal,
                      intelligence.highestRiskArea,
                      intelligence.topRepeatedDefect,
                      intelligence.biggestCopqContributor,
                      intelligence.mostAffectedProductionLine,
                      intelligence.mostAffectedModelOrPart,
                      intelligence.overdueWorkflowConcern,
                    ].map((fact) => (
                      <div key={fact.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-xs font-black uppercase tracking-widest text-white/40">{fact.label}</p>
                          <span className={`px-2 py-1 rounded border text-[10px] font-black ${confidenceClass(fact.confidence)}`}>{fact.confidence}</span>
                        </div>
                        <p className="text-lg font-black text-white mt-3">{fact.value}</p>
                        <p className="text-xs text-white/50 mt-2 leading-relaxed">{fact.description}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 rounded-2xl border border-[#00A3E0]/20 bg-[#00A3E0]/10 p-5">
                    <p className="text-xs font-black uppercase tracking-widest text-[#00A3E0]">Suggested Management Focus</p>
                    <p className="text-sm text-white/75 mt-2 leading-relaxed">{intelligence.suggestedManagementFocus}</p>
                    <p className="text-xs text-white/40 mt-3">This is a decision-support summary and requires engineering verification.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <h3 className="text-xl font-black text-white mb-4">Auto Pareto Insights</h3>
                    <p className="text-sm text-white/65 leading-relaxed">{paretoInsights.narrative}</p>
                    <p className="text-sm text-[#00A3E0] mt-3">{paretoInsights.focusRecommendation}</p>
                    <p className="text-xs text-white/40 mt-2">{paretoInsights.previousPeriodNote}</p>
                    <div className="mt-5 space-y-3">
                      {paretoInsights.rows.length === 0 ? (
                        <p className="text-sm text-white/35">No Pareto data yet. Log real defect records to generate insight.</p>
                      ) : paretoInsights.rows.slice(0, 5).map((row) => (
                        <div key={row.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <span className="text-sm font-black text-white">{row.label}</span>
                            <span className="text-xs text-white/45">{row.percentage}% | cumulative {row.cumulativePercentage}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-[#0066CC] to-[#00A3E0]" style={{ width: `${Math.min(100, row.percentage)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <h3 className="text-xl font-black text-white mb-4">Corrective Action Recommendation Library</h3>
                    <div className="space-y-4">
                      {actionRecommendations.map((recommendation) => (
                        <div key={recommendation.trigger} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-sm font-black text-white">{recommendation.trigger}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs text-white/55">
                            <p><span className="text-white/80 font-bold">Containment:</span> {recommendation.immediateContainment[0]}</p>
                            <p><span className="text-white/80 font-bold">Verification:</span> {recommendation.processVerification[0]}</p>
                            <p><span className="text-white/80 font-bold">Corrective:</span> {recommendation.correctiveAction[0]}</p>
                            <p><span className="text-white/80 font-bold">Follow-up:</span> {recommendation.dataFollowUp[0]}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-white/35 mt-4">Recommendations are generic local guidance and can later be moved into editable master data or settings.</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="mt-0 focus-visible:outline-none">
              <div className="glass-panel p-6 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3 mb-5">
                  <TrendingUp className="w-5 h-5 text-[#00A3E0]" />
                  <h3 className="text-xl font-black text-white">Trend Change Detection</h3>
                </div>
                {trendMetrics.length === 0 ? (
                  <p className="text-sm text-white/35">No records are available for trend detection.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {trendMetrics.map((trend) => (
                      <div key={trend.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-black text-white">{trend.name}</p>
                          <span className={`px-2 py-1 rounded border text-[10px] font-black ${confidenceClass(trend.confidence)}`}>{trend.confidence}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                          <div className="rounded-xl bg-black/10 p-2">
                            <p className="text-[10px] text-white/35 uppercase">Current</p>
                            <p className="text-lg font-black text-white">{numberText(trend.current)}</p>
                          </div>
                          <div className="rounded-xl bg-black/10 p-2">
                            <p className="text-[10px] text-white/35 uppercase">Previous</p>
                            <p className="text-lg font-black text-white">{numberText(trend.previous)}</p>
                          </div>
                          <div className="rounded-xl bg-black/10 p-2">
                            <p className="text-[10px] text-white/35 uppercase">Move</p>
                            <p className={`text-lg font-black ${trend.direction === 'increase' ? 'text-amber-200' : trend.direction === 'decrease' ? 'text-emerald-200' : 'text-white/70'}`}>
                              {trend.movementPercent === null ? 'N/A' : `${trend.movementPercent}%`}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-white/55 mt-4 leading-relaxed">{trend.interpretation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="patterns" className="mt-0 focus-visible:outline-none">
              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                  <h3 className="text-xl font-black text-white mb-5">Pattern Detection</h3>
                  {patternInsights.length === 0 ? (
                    <p className="text-sm text-white/35">No concentration patterns yet. Add more real records with line, shift, model, part, supplier, and inspection fields.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {patternInsights.map((pattern) => (
                        <div key={pattern.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-black text-white">{pattern.title}</p>
                            <span className={`px-2 py-1 rounded border text-[10px] font-black ${confidenceClass(pattern.confidence)}`}>{pattern.confidence}</span>
                          </div>
                          <p className="text-xs text-white/45 mt-2">{pattern.count} records | {pattern.percentage}% concentration</p>
                          <p className="text-xs text-amber-100 mt-3">{pattern.riskImpact}</p>
                          <p className="text-xs text-white/55 mt-2">{pattern.suggestedVerificationArea}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                  <h3 className="text-xl font-black text-white mb-5">Root Cause Hypothesis Assistant</h3>
                  {hypotheses.length === 0 ? (
                    <p className="text-sm text-white/35">No hypothesis is generated yet because there is not enough repeated or concentrated data.</p>
                  ) : (
                    <div className="space-y-4">
                      {hypotheses.map((hypothesis) => (
                        <div key={hypothesis.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-lg font-black text-white">{hypothesis.possibleFocusArea}</p>
                            <span className={`px-2 py-1 rounded border text-[10px] font-black ${confidenceClass(hypothesis.confidence)}`}>{hypothesis.confidence}</span>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-white/40">Supporting Signals</p>
                              <ul className="mt-2 space-y-1 text-xs text-white/55">{hypothesis.supportingSignals.map((item) => <li key={item}>{item}</li>)}</ul>
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-white/40">Missing Data Needed</p>
                              <ul className="mt-2 space-y-1 text-xs text-white/55">{hypothesis.missingDataNeeded.map((item) => <li key={item}>{item}</li>)}</ul>
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-white/40">Verification Step</p>
                              <p className="mt-2 text-xs text-[#00A3E0]">{hypothesis.recommendedVerificationStep}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="knowledge" className="mt-0 focus-visible:outline-none">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
                  {[
                    ['Active Lessons', knowledgeSummary.activeLessons],
                    ['New This Month', knowledgeSummary.newLessonsThisMonth],
                    ['Known Repeated Issues', knowledgeSummary.topRepeatedKnownIssues.length],
                    ['Linked to Effective Actions', knowledgeSummary.lessonsLinkedToEffectiveActions],
                    ['Training Points', knowledgeSummary.trainingPoints],
                    ['Knowledge Gaps', knowledgeSummary.knowledgeGaps.length],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="glass-panel p-4 rounded-2xl border border-white/10">
                      <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">{String(label)}</p>
                      <p className="text-2xl font-black text-white mt-2">{numberText(Number(value || 0))}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <h3 className="text-xl font-black text-white">Lessons / Known Issues</h3>
                      <Link to="/quality-knowledge-base" className="px-3 py-2 rounded-xl bg-[#0066CC]/20 border border-[#0066CC]/25 text-[#8be3ff] text-xs font-black">Open Knowledge Base</Link>
                    </div>
                    {snapshot.qualityKnowledge.length === 0 ? (
                      <p className="text-sm text-white/35">No knowledge records yet. Create lessons from verified effective actions or closed defects.</p>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-auto pr-1">
                        {snapshot.qualityKnowledge.slice(0, 10).map((item) => (
                          <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-black text-white">{item.title}</p>
                                <p className="text-xs text-white/40 mt-1">{item.type} | {item.status} | {item.defectType || item.defectCategory || 'general'}</p>
                              </div>
                              <span className={`px-2 py-1 rounded border text-[10px] font-black ${confidenceClass(item.confidenceLabel || 'Insufficient Data')}`}>{item.confidenceLabel || 'Insufficient Data'}</span>
                            </div>
                            <p className="text-xs text-white/45 mt-2 line-clamp-2">{item.problemSummary}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <h3 className="text-xl font-black text-white mb-5">Knowledge Gaps</h3>
                    {knowledgeSummary.knowledgeGaps.length === 0 ? (
                      <p className="text-sm text-white/35">No repeated defect gaps detected from current records.</p>
                    ) : (
                      <div className="space-y-3">
                        {knowledgeSummary.knowledgeGaps.map((gap) => (
                          <div key={gap.label} className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
                            <p className="text-sm font-black text-amber-100">{gap.label}</p>
                            <p className="text-xs text-white/55 mt-1">{gap.repeatedCount} repeated quantity/records signal without an active lesson.</p>
                            <p className="text-xs text-white/45 mt-2">{gap.suggestedAction}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <h3 className="text-xl font-black text-white mb-5">Standard Action Library</h3>
                    {standardActionLibrary.length === 0 ? (
                      <p className="text-sm text-white/35">No standard actions are available from active knowledge yet.</p>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-auto pr-1">
                        {standardActionLibrary.slice(0, 8).map((entry) => (
                          <div key={entry.key} className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <p className="text-sm font-black text-white">{entry.defectTypeOrCategory}</p>
                            <p className="text-xs text-[#8be3ff] mt-2">{entry.recommendedVerification}</p>
                            <p className="text-xs text-white/40 mt-1">{entry.recommendedPreventiveAction}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <h3 className="text-xl font-black text-white mb-5">Training Points</h3>
                    {knowledgeTrainingPoints.length === 0 ? (
                      <p className="text-sm text-white/35">No active training points yet.</p>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-auto pr-1">
                        {knowledgeTrainingPoints.slice(0, 8).map((point) => (
                          <div key={point.topic} className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <p className="text-sm font-black text-white">{point.topic}</p>
                            <p className="text-xs text-white/45 mt-1">{point.reason}</p>
                            <p className="text-xs text-amber-200 mt-2">Suggested audience: {point.suggestedAudience}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="improvement" className="mt-0 focus-visible:outline-none">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {[
                    ['Total Actions', improvementDashboard.totalActions],
                    ['Open Actions', improvementDashboard.openActions],
                    ['Overdue Actions', improvementDashboard.overdueActions],
                    ['Pending Verification', improvementDashboard.pendingVerification],
                    ['Effective Actions', improvementDashboard.effectiveActions],
                    ['Not Effective', improvementDashboard.notEffectiveActions],
                    ['Avg Completion Days', improvementDashboard.averageTimeToCompleteDays],
                    ['Estimated COPQ Reduction', moneyText(improvementDashboard.estimatedCopqReduction)],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="glass-panel p-4 rounded-2xl border border-white/10">
                      <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">{String(label)}</p>
                      <p className="text-2xl font-black text-white mt-2">{typeof value === 'number' ? numberText(value) : String(value)}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-6">
                  <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <div className="flex items-center gap-3">
                        <PlusCircle className="w-5 h-5 text-[#00A3E0]" />
                        <h3 className="text-xl font-black text-white">Create Improvement Action</h3>
                      </div>
                      <button type="button" onClick={fillActionFromTopRisk} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/65">
                        From Top Risk
                      </button>
                    </div>
                    <div className="space-y-3">
                      <input
                        value={actionForm.title || ''}
                        onChange={(event) => updateActionForm({ title: event.target.value })}
                        placeholder="Action title"
                        className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-sm text-white"
                      />
                      <textarea
                        value={actionForm.description || ''}
                        onChange={(event) => updateActionForm({ description: event.target.value })}
                        placeholder="Description and expected quality improvement"
                        rows={3}
                        className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-sm text-white"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={actionForm.sourceType || 'manual'}
                          onChange={(event) => updateActionForm({ sourceType: event.target.value as ImprovementActionSourceType })}
                          className="rounded-xl bg-black/20 border border-white/10 px-3 py-3 text-sm text-white"
                        >
                          {['manual', 'defect', 'ncr', 'capa', 'eightD', 'audit', 'intelligence'].map((type) => <option key={type} value={type}>{type}</option>)}
                        </select>
                        <select
                          value={actionForm.actionType || 'corrective'}
                          onChange={(event) => updateActionForm({ actionType: event.target.value as ImprovementActionType })}
                          className="rounded-xl bg-black/20 border border-white/10 px-3 py-3 text-sm text-white"
                        >
                          {['containment', 'correction', 'corrective', 'preventive', 'verification', 'audit', 'training', 'supplier-action', 'process-control'].map((type) => <option key={type} value={type}>{type}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          value={actionForm.owner || ''}
                          onChange={(event) => updateActionForm({ owner: event.target.value })}
                          placeholder="Owner"
                          className="rounded-xl bg-black/20 border border-white/10 px-3 py-3 text-sm text-white"
                        />
                        <select
                          value={actionForm.priority || 'medium'}
                          onChange={(event) => updateActionForm({ priority: event.target.value as QualityImprovementAction['priority'] })}
                          className="rounded-xl bg-black/20 border border-white/10 px-3 py-3 text-sm text-white"
                        >
                          {['low', 'medium', 'high', 'critical'].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="date"
                          value={actionForm.dueDate || ''}
                          onChange={(event) => updateActionForm({ dueDate: event.target.value })}
                          className="rounded-xl bg-black/20 border border-white/10 px-3 py-3 text-sm text-white"
                        />
                        <input
                          value={actionForm.linkedDefectType || ''}
                          onChange={(event) => updateActionForm({ linkedDefectType: event.target.value })}
                          placeholder="Linked defect type"
                          className="rounded-xl bg-black/20 border border-white/10 px-3 py-3 text-sm text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          value={actionForm.linkedProductionLine || ''}
                          onChange={(event) => updateActionForm({ linkedProductionLine: event.target.value })}
                          placeholder="Line"
                          className="rounded-xl bg-black/20 border border-white/10 px-3 py-3 text-sm text-white"
                        />
                        <input
                          value={actionForm.linkedPartNumber || ''}
                          onChange={(event) => updateActionForm({ linkedPartNumber: event.target.value })}
                          placeholder="Part number"
                          className="rounded-xl bg-black/20 border border-white/10 px-3 py-3 text-sm text-white"
                        />
                      </div>
                      <button type="button" onClick={createAction} className="w-full px-5 py-3 rounded-xl bg-[#0066CC] text-white text-sm font-black">
                        Save Improvement Action
                      </button>
                      <p className="text-xs text-white/35 leading-relaxed">
                        Actions are never auto-created. Saving creates a local action register item and queues a future sync operation.
                      </p>
                    </div>
                  </div>

                  <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <h3 className="text-xl font-black text-white mb-5">Action Effectiveness Register</h3>
                    {snapshot.improvementActions.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                        <CheckCircle2 className="w-10 h-10 text-white/15 mx-auto mb-3" />
                        <p className="text-white/45">No improvement actions yet. Create one manually or prefill from the highest real risk.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {snapshot.improvementActions.slice(0, 40).map((action) => {
                          const result = calculateActionEffectiveness(action, snapshot.defectRecords);
                          return (
                            <div key={action.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <p className="text-lg font-black text-white">{action.title}</p>
                                  <p className="text-xs text-white/40 mt-1">{action.actionType} | {action.sourceType} | Owner: {action.owner || 'Unassigned'}</p>
                                  <p className="text-xs text-white/55 mt-3 leading-relaxed">{action.description || 'No description provided.'}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <span className={`px-3 py-1 rounded-full border text-xs font-black ${statusBadgeClass(action.status)}`}>{action.status}</span>
                                  <span className={`px-3 py-1 rounded-full border text-xs font-black ${confidenceClass(result.confidenceLabel)}`}>{result.confidenceLabel}</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
                                <div className="rounded-xl bg-black/10 border border-white/10 p-3">
                                  <p className="text-[10px] uppercase font-black text-white/35">Before</p>
                                  <p className="text-lg font-black text-white">{numberText(result.primaryMetric.before)}</p>
                                </div>
                                <div className="rounded-xl bg-black/10 border border-white/10 p-3">
                                  <p className="text-[10px] uppercase font-black text-white/35">After</p>
                                  <p className="text-lg font-black text-white">{numberText(result.primaryMetric.after)}</p>
                                </div>
                                <div className="rounded-xl bg-black/10 border border-white/10 p-3">
                                  <p className="text-[10px] uppercase font-black text-white/35">Improvement</p>
                                  <p className={`text-lg font-black ${result.primaryMetric.trendDirection === 'improved' ? 'text-emerald-200' : result.primaryMetric.trendDirection === 'worsened' ? 'text-red-200' : 'text-white/65'}`}>
                                    {result.primaryMetric.improvementPercent === null ? 'N/A' : `${result.primaryMetric.improvementPercent}%`}
                                  </p>
                                </div>
                                <div className="rounded-xl bg-black/10 border border-white/10 p-3">
                                  <p className="text-[10px] uppercase font-black text-white/35">Effectiveness</p>
                                  <p className="text-sm font-black text-[#00A3E0]">{result.effectivenessStatus}</p>
                                </div>
                              </div>

                              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-white/45">{result.interpretation}</p>
                                  <p className="text-xs text-white/35 mt-2">Before records: {result.beforeRecords} | After records: {result.afterRecords} | Window: {result.comparisonWindowDays} days</p>
                                </div>
                                <div className="space-y-2">
                                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                    <div className="h-full bg-emerald-400" style={{ width: `${Math.min(100, Math.max(0, result.primaryMetric.improvementPercent || 0))}%` }} />
                                  </div>
                                  <p className="text-[10px] text-white/35">Before / after visual is calculated from matching real defect records only.</p>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 mt-4">
                                <button type="button" onClick={() => refreshEffectiveness(action)} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/65">
                                  Refresh Effectiveness
                                </button>
                                {nextImprovementStatuses(action.status).map((status) => (
                                  <button key={status} type="button" onClick={() => moveAction(action, status)} className="px-3 py-2 rounded-xl bg-[#0066CC]/20 border border-[#0066CC]/25 text-xs font-bold text-[#8be3ff]">
                                    Move to {status}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="glass-panel p-6 rounded-2xl border border-white/10 xl:col-span-3">
                    <h3 className="text-xl font-black text-white mb-4">NCR / CAPA / 8D Closed-Loop Integration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        ['NCRs Waiting CAPA', closedLoopSummary.ncrsWaitingCapa],
                        ['CAPA Pending Verification', closedLoopSummary.capasPendingVerification],
                        ['Not Effective CAPAs', closedLoopSummary.notEffectiveCapas],
                        ['Actions Linked to NCR/CAPA/8D', closedLoopSummary.actionsLinkedToEscalations],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">{String(label)}</p>
                          <p className="text-2xl font-black text-white mt-2">{numberText(Number(value || 0))}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                      {closedLoopSummary.effectivenessBySourceType.map((item) => (
                        <div key={item.label} className="rounded-xl border border-white/10 bg-black/10 p-4">
                          <p className="text-sm font-black text-white uppercase">{item.label}</p>
                          <p className="text-xs text-white/45 mt-2">Actions {item.count} | Effective {item.effective} | Not effective {item.notEffective} | Pending {item.pending}</p>
                          <div className="h-2 rounded-full bg-white/10 overflow-hidden mt-3">
                            <div className="h-full bg-emerald-400" style={{ width: `${item.count ? Math.round((item.effective / item.count) * 100) : 0}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-white/35 mt-4">These values are derived from stored NCR, CAPA, 8D, defect, and improvement action records only.</p>
                  </div>

                  <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <h3 className="text-xl font-black text-white mb-4">Action Status Distribution</h3>
                    {improvementDashboard.actionsByStatus.length === 0 ? (
                      <p className="text-sm text-white/35">No action status data yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {improvementDashboard.actionsByStatus.map((item) => (
                          <div key={item.label}>
                            <div className="flex justify-between text-xs text-white/55 mb-1"><span>{item.label}</span><span>{item.count}</span></div>
                            <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-[#00A3E0]" style={{ width: `${item.percentage}%` }} /></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <h3 className="text-xl font-black text-white mb-4">Effectiveness Distribution</h3>
                    {improvementDashboard.effectivenessDistribution.length === 0 ? (
                      <p className="text-sm text-white/35">No effectiveness data yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {improvementDashboard.effectivenessDistribution.map((item) => (
                          <div key={item.label}>
                            <div className="flex justify-between text-xs text-white/55 mb-1"><span>{item.label}</span><span>{item.count}</span></div>
                            <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-emerald-400" style={{ width: `${item.percentage}%` }} /></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <h3 className="text-xl font-black text-white mb-4">Overdue Improvement Actions</h3>
                    {improvementDashboard.overdueActionList.length === 0 ? (
                      <p className="text-sm text-white/35">No overdue improvement actions from current local register.</p>
                    ) : (
                      <div className="space-y-3">
                        {improvementDashboard.overdueActionList.slice(0, 8).map((action) => (
                          <div key={action.id} className="rounded-xl border border-red-400/20 bg-red-400/10 p-3">
                            <p className="text-sm font-black text-white">{action.title}</p>
                            <p className="text-xs text-red-100 mt-1">Due {action.dueDate} | Owner {action.owner || 'Unassigned'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="report" className="mt-0 focus-visible:outline-none">
              <div className="glass-panel p-6 rounded-2xl border border-white/10">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-black text-white">Management Report Generator</h3>
                    <p className="text-sm text-white/45 mt-1">Generates a safe management summary without raw dataset rows.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={generateManagementReport} className="px-4 py-2 rounded-xl bg-[#0066CC] text-white text-sm font-black">
                      Generate Management Summary
                    </button>
                    <button type="button" onClick={copyManagementReport} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-bold">
                      <Copy className="w-4 h-4" />
                      Copy Summary
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const report = managementReport || buildManagementReport(snapshot);
                        setManagementReport(report);
                        downloadJsonFile(report.json, `quality_management_summary_${new Date().toISOString().split('T')[0]}.json`);
                      }}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-bold"
                    >
                      Export JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const report = managementReport || buildManagementReport(snapshot);
                        setManagementReport(report);
                        downloadTextFile(report.markdown, `quality_management_summary_${new Date().toISOString().split('T')[0]}.md`);
                      }}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-bold"
                    >
                      Export Markdown
                    </button>
                  </div>
                </div>
                {managementReport ? (
                  <pre className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/20 p-5 text-sm leading-relaxed text-white/75 max-h-[720px] overflow-auto">
                    {managementReport.markdown}
                  </pre>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                    <FileJson className="w-10 h-10 text-white/15 mx-auto mb-3" />
                    <p className="text-white/45">Generate a report to preview, copy, or export a management-ready summary.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="health" className="mt-0 focus-visible:outline-none">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {[
                    ['Total Defect Records', dataHealth.totalDefectRecords],
                    ['Master Data Tables', dataHealth.masterDataTablesCount],
                    ['Missing Mandatory Fields', dataHealth.missingMandatoryFields],
                    ['No Master Match', dataHealth.recordsWithoutMasterDataMatch],
                    ['No Snapshot', dataHealth.recordsWithoutSnapshot],
                    ['Duplicate Master Signals', dataHealth.duplicateMasterDataEntries],
                    ['Large Attachments Skipped', dataHealth.largeAttachmentsSkipped],
                    ['Prediction Ready Records', dataHealth.recordsReadyForPrediction],
                    ['Requires Review', dataHealth.recordsRequiringReview],
                    ['Overdue Actions', dataHealth.overdueActions],
                    ['Improvement Actions', dataHealth.improvementActionsCount],
                    ['Actions Pending Verification', dataHealth.actionsPendingVerification],
                    ['LocalStorage Usage', `${dataHealth.localStorageUsagePercent}%`],
                    ['Storage Size', bytesText(dataHealth.localStorageUsageBytes)],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="glass-panel p-4 rounded-2xl border border-white/10">
                      <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">{String(label)}</p>
                      <p className="text-2xl font-black text-white mt-2">{String(value)}</p>
                    </div>
                  ))}
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                  <h3 className="text-xl font-black text-white mb-5">Practical Data Health Recommendations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dataHealth.recommendations.map((recommendation) => (
                      <div key={recommendation} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/65">
                        {recommendation}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="backup-sync" className="mt-0 focus-visible:outline-none">
              <div className="space-y-6">
              <div className="glass-panel p-6 rounded-2xl border border-white/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3">
                    <Archive className="w-5 h-5 text-[#00A3E0]" />
                    <div>
                      <h3 className="text-xl font-black text-white">Offline Sync Queue</h3>
                      <p className="text-xs text-white/40">Operations are local today and ready for future backend synchronization.</p>
                    </div>
                  </div>
                  <button type="button" onClick={clearSynced} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-bold">
                    Clear Synced Items
                  </button>
                </div>
                {snapshot.syncQueue.length === 0 ? (
                  <p className="text-sm text-white/35">No queued local operations yet.</p>
                ) : (
                  <div className="space-y-3">
                    {snapshot.syncQueue.slice(0, 80).map((item) => (
                      <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-white">{item.operation} | {item.entityType}</p>
                            <p className="text-xs text-white/45 mt-1">{item.payloadSummary}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                            item.status === 'pending' ? 'bg-amber-400/15 text-amber-200' :
                            item.status === 'failed' ? 'bg-red-400/15 text-red-200' :
                            item.status === 'conflict' ? 'bg-purple-400/15 text-purple-200' :
                            'bg-emerald-400/15 text-emerald-200'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/35 mt-2">Entity {item.entityId} | {new Date(item.createdAt).toLocaleString()} | Retry {item.retryCount}</p>
                        {item.lastError && <p className="text-xs text-red-200 mt-2">{item.lastError}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3 mb-5">
                    <Download className="w-5 h-5 text-[#00A3E0]" />
                    <h3 className="text-xl font-black text-white">Export Backup</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {backupScopes.map((scope) => (
                      <label key={scope.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/65">
                        <input
                          type="checkbox"
                          checked={selectedBackupScopes.includes(scope.id)}
                          onChange={() => toggleBackupScope(scope.id)}
                        />
                        {scope.label}
                      </label>
                    ))}
                  </div>
                  <button type="button" onClick={exportBackup} className="mt-5 flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0066CC] text-white text-sm font-black">
                    <FileJson className="w-4 h-4" />
                    Export Selected Backup
                  </button>
                  <p className="text-xs text-white/40 mt-4">Backups include selected local quality data only. Raw demo data is not generated.</p>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3 mb-5">
                    <Upload className="w-5 h-5 text-amber-300" />
                    <h3 className="text-xl font-black text-white">Import / Restore Backup</h3>
                  </div>
                  <input ref={restoreInputRef} type="file" accept=".json,application/json" className="hidden" onChange={importBackup} />
                  <button
                    type="button"
                    onClick={() => restoreInputRef.current?.click()}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-bold"
                  >
                    <Upload className="w-4 h-4" />
                    Validate Backup JSON
                  </button>
                  {restoreValidation && (
                    <div className={`mt-5 rounded-xl border p-4 ${restoreValidation.valid ? 'border-emerald-400/20 bg-emerald-400/10' : 'border-red-400/20 bg-red-400/10'}`}>
                      <p className="text-sm font-black text-white">{restoreValidation.message}</p>
                      {restoreValidation.valid && (
                        <div className="mt-3 space-y-1 text-xs text-white/60">
                          {Object.entries(restoreValidation.itemCounts).map(([key, count]) => (
                            <p key={key}>{key}: {count}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={restoreBackup}
                    disabled={!restoreCandidate || !restoreValidation?.valid}
                    className="mt-5 px-5 py-3 rounded-xl bg-amber-500 text-black text-sm font-black disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Confirm Restore
                  </button>
                  <p className="text-xs text-white/40 mt-4">Restore never runs silently. You must validate and confirm before matching local keys are overwritten.</p>
                </div>
              </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </PageSection>
    </PageContainer>
  );
}
