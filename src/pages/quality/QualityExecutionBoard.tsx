import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Eye,
  FileText,
  Gauge,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer, PageHeader } from '@/components/PageHeader';
import { QualityGuidedEmptyState } from '@/components/QualityGuidedEmptyState';
import { Button } from '@/components/ui/button';
import QualityDashboardFilterBar from '@/components/QualityDashboardFilterBar';
import QualityAnalyticsConsistencyBadge from '@/components/QualityAnalyticsConsistencyBadge';
import QualityKnowledgeSuggestions from '@/components/QualityKnowledgeSuggestions';
import { unifiedDefectLogApi, type DefectLogData } from '@/api/unified-api';
import useAuthStore from '@/stores/authStore';
import {
  buildLocalWorkflowUser,
  hasDefectPermission,
  loadLocalWorkflowRole,
  roleLabel,
} from '@/services/defectWorkflowGovernance';
import {
  buildQualityExecutionBoardSummary,
  enqueueExecutionBoardExport,
  loadQualityInspectionPlans,
  loadQualityInspectionRuns,
  upsertQualityInspectionRun,
  type QualityFailedCheckFollowUp,
  type QualityInspectionPlan,
  type QualityInspectionRun,
} from '@/services/qualityInspectionPlans';
import { createImprovementAction } from '@/services/qualityImprovementActions';
import { enqueueQualitySyncItem } from '@/services/qualitySyncQueue';
import { downloadJsonFile } from '@/services/qualityRepository';
import {
  loadQualityAnalyticsSnapshot,
  loadQualityDashboardFilters,
  type QualityAnalyticsSnapshot,
  type QualityDashboardFilters,
} from '@/services/qualityAnalyticsHub';

const supervisorRoles = ['SYSTEM', 'ADMIN', 'PLANT_MANAGER', 'QUALITY_MANAGER', 'QUALITY_SUPERVISOR', 'QUALITY_ENGINEER'];

function compactDate(value?: string): string {
  if (!value) return '---';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '---' : date.toLocaleString();
}

function percentBar(value: number): string {
  return `${Math.max(0, Math.min(100, Math.round(value || 0)))}%`;
}

function statusClass(status: string): string {
  if (status === 'Critical') return 'border-red-400/20 bg-red-500/10 text-red-200';
  if (status === 'Attention') return 'border-amber-400/20 bg-amber-500/10 text-amber-200';
  if (status === 'OK') return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200';
  if (status === 'pass') return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200';
  if (status === 'fail') return 'border-red-400/20 bg-red-500/10 text-red-200';
  if (status === 'completed') return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200';
  if (status === 'partially-completed') return 'border-amber-400/20 bg-amber-500/10 text-amber-200';
  return 'border-[#00A3E0]/20 bg-[#00A3E0]/10 text-[#8be3ff]';
}

function runPlan(planMap: Map<string, QualityInspectionPlan>, run: QualityInspectionRun): QualityInspectionPlan | undefined {
  return planMap.get(run.inspectionPlanId);
}

function runCompletion(run: QualityInspectionRun, plan?: QualityInspectionPlan): { completed: number; total: number; failed: number } {
  const total = plan?.checkItems.length || run.checkResults.length;
  return {
    completed: run.checkResults.filter((result) => result.result !== 'na').length,
    total,
    failed: run.checkResults.filter((result) => result.result === 'fail').length,
  };
}

export default function QualityExecutionBoard() {
  const authUser = useAuthStore((state) => state.user);
  const [plans, setPlans] = useState(() => loadQualityInspectionPlans(true));
  const [runs, setRuns] = useState(() => loadQualityInspectionRuns());
  const [defects, setDefects] = useState<DefectLogData[]>([]);
  const [analytics, setAnalytics] = useState<QualityAnalyticsSnapshot | null>(null);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [selectedFollowUpId, setSelectedFollowUpId] = useState('');
  const [lineFilter, setLineFilter] = useState('');
  const [filters, setFilters] = useState<QualityDashboardFilters>(() => loadQualityDashboardFilters());

  const role = loadLocalWorkflowRole();
  const workflowUser = useMemo(() => buildLocalWorkflowUser(authUser, role), [authUser, role]);
  const canViewAll = supervisorRoles.includes(role);
  const canCreateDefect = hasDefectPermission(workflowUser, 'defect.create');
  const canCreateAction = hasDefectPermission(workflowUser, 'defect.createCapa') || hasDefectPermission(workflowUser, 'defect.edit');
  const planMap = useMemo(() => new Map(plans.map((plan) => [plan.id, plan])), [plans]);

  const filteredRuns = analytics?.filteredInspectionRuns || runs;
  const filteredDefects = analytics?.filteredDefectRecords || defects;

  const summary = useMemo(() => buildQualityExecutionBoardSummary({
    plans,
    runs: filteredRuns,
    defects: filteredDefects,
    currentUserName: workflowUser.name,
    currentRole: role,
  }), [filteredDefects, filteredRuns, plans, role, workflowUser.name]);

  const visibleRuns = useMemo(() => {
    const needle = lineFilter.trim().toLowerCase();
    return filteredRuns
      .filter((run) => canViewAll || String(run.inspector || '').toLowerCase().includes(workflowUser.name.toLowerCase()))
      .filter((run) => !needle || `${run.productionLine} ${run.model} ${run.inspectionPoint} ${run.inspector}`.toLowerCase().includes(needle))
      .slice(0, 40);
  }, [canViewAll, filteredRuns, lineFilter, workflowUser.name]);

  const selectedRun = useMemo(() => runs.find((run) => run.id === selectedRunId), [runs, selectedRunId]);
  const selectedFollowUp = useMemo(
    () => summary.followUps.find((item) => item.id === selectedFollowUpId) || summary.followUps[0],
    [selectedFollowUpId, summary.followUps],
  );
  const overviewCards: Array<{ label: string; value: string | number; icon: LucideIcon }> = [
    { label: 'Runs Today', value: summary.overview.totalRunsToday, icon: Gauge },
    { label: 'Completed', value: summary.overview.completedRuns, icon: CheckCircle2 },
    { label: 'In Progress', value: summary.overview.inProgressRuns, icon: RefreshCw },
    { label: 'Partial', value: summary.overview.partiallyCompletedRuns, icon: AlertTriangle },
    { label: 'Failed Checks', value: summary.overview.failedChecks, icon: AlertTriangle },
    { label: 'Defects Created', value: summary.overview.defectsCreatedFromChecks, icon: FileText },
    { label: 'No Defect Yet', value: summary.overview.failedChecksWithoutDefect, icon: Wrench },
    { label: 'Compliance', value: `${summary.overview.planCompliance}%`, icon: BarChart3 },
    { label: 'Missing Evidence', value: summary.overview.evidenceMissingCount, icon: ShieldCheck },
  ];

  const refresh = async () => {
    setPlans(loadQualityInspectionPlans(true));
    setRuns(loadQualityInspectionRuns());
    const response = await unifiedDefectLogApi.getAll().catch(() => ({ data: [] as DefectLogData[] }));
    setDefects(response.data || []);
    setAnalytics(await loadQualityAnalyticsSnapshot(filters));
    toast.success('Execution board refreshed', { description: 'Board recalculated from local inspection runs and defect records.' });
  };

  useEffect(() => {
    unifiedDefectLogApi.getAll()
      .then(async (response) => {
        setDefects(response.data || []);
        setAnalytics(await loadQualityAnalyticsSnapshot(filters));
      })
      .catch(() => setDefects([]));
  }, [filters]);

  const createDefectFromFollowUp = async (followUp: QualityFailedCheckFollowUp) => {
    if (!canCreateDefect) {
      toast.error('Create defect blocked', { description: `${roleLabel(role)} cannot create defect records.` });
      return;
    }
    const confirmed = window.confirm('Create a defect record from this failed inspection check? Review and edit the record later if needed.');
    if (!confirmed) return;
    const plan = followUp.plan || planMap.get(followUp.run.inspectionPlanId);
    const item = followUp.checkItem;
    try {
      const payload: Omit<DefectLogData, 'id'> = {
        date: followUp.run.startedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        shift: 'inspection',
        productionLine: followUp.run.productionLine || plan?.productionLine || '',
        partId: plan?.partNumber || '',
        partNumber: plan?.partNumber || '',
        recordType: item?.recordTypeIfNG || 'process-ppm',
        defectType: item?.defectTypeIfNG || item?.checkName || 'Failed inspection check',
        quantity: 1,
        inspectedQuantity: 1,
        productionQuantity: 1,
        severity: item?.severityIfNG || 'major',
        description: [
          `Created from failed inspection check ${item?.checkCode || followUp.result.checkItemId}.`,
          item?.checkName ? `Check: ${item.checkName}.` : '',
          item?.acceptanceCriteria ? `Acceptance: ${item.acceptanceCriteria}.` : '',
          followUp.result.measuredValue ? `Measured: ${followUp.result.measuredValue}${item?.unit ? ` ${item.unit}` : ''}.` : '',
          followUp.result.notes ? `Notes: ${followUp.result.notes}.` : '',
        ].filter(Boolean).join(' '),
        operatorName: followUp.run.inspector || workflowUser.name,
        actionTaken: 'Created from execution board for quality follow-up.',
        model: followUp.run.model || plan?.model,
        defaultInspectionPoint: followUp.run.inspectionPoint || plan?.inspectionPoint,
        evidence: followUp.result.evidence as unknown as Array<Record<string, unknown>>,
        status: 'logged',
        relatedInspectionPlanId: plan?.id,
        relatedInspectionPlanVersion: plan?.version,
        relatedCheckItemId: followUp.result.checkItemId,
        relatedInspectionRunId: followUp.run.id,
        inspectionResult: followUp.result as unknown as Record<string, unknown>,
      };
      const created = await unifiedDefectLogApi.create(payload);
      const nextResults = followUp.run.checkResults.map((result) => (
        result.checkItemId === followUp.result.checkItemId ? { ...result, createdDefectId: created.id } : result
      ));
      upsertQualityInspectionRun({
        ...followUp.run,
        checkResults: nextResults,
        createdDefectIds: [...new Set([...(followUp.run.createdDefectIds || []), created.id])],
      });
      enqueueQualitySyncItem({
        entityType: 'defect-logs',
        entityId: created.id,
        operation: 'create-defect-from-execution-board',
        payloadSummary: `Defect created from execution board failed check ${followUp.result.checkItemId}.`,
      });
      await refresh();
      toast.success('Defect created from failed check', { description: 'Dashboards, SPC, and prediction training will read the new defect through existing records.' });
    } catch (error) {
      toast.error('Failed to create defect', { description: error instanceof Error ? error.message : 'Local create failed.' });
    }
  };

  const createActionFromFollowUp = (followUp: QualityFailedCheckFollowUp) => {
    if (!canCreateAction) {
      toast.error('Create action blocked', { description: `${roleLabel(role)} cannot create improvement actions from failed checks.` });
      return;
    }
    const confirmed = window.confirm('Create an improvement action from this failed check?');
    if (!confirmed) return;
    const item = followUp.checkItem;
    const action = createImprovementAction({
      title: `Follow up failed check: ${item?.checkName || followUp.result.checkItemId}`,
      description: 'Improvement action created from a real failed inspection check. Verify evidence and scope before execution.',
      sourceType: 'intelligence',
      sourceId: followUp.run.id,
      actionType: 'process-control',
      priority: followUp.repeatedCount >= 3 || followUp.missingEvidence ? 'high' : 'medium',
      linkedDefectType: item?.defectTypeIfNG || item?.checkName,
      linkedProductionLine: followUp.run.productionLine,
      linkedModel: followUp.run.model,
      linkedPartNumber: followUp.plan?.partNumber,
      linkedSeverity: item?.severityIfNG,
      linkedRecordType: item?.recordTypeIfNG,
    });
    enqueueQualitySyncItem({
      entityType: 'improvement-actions',
      entityId: action.id,
      operation: 'create-action-from-failed-check',
      payloadSummary: `Improvement action created from failed inspection check ${followUp.result.checkItemId}.`,
    });
    toast.success('Improvement action created', { description: 'The action is stored locally and queued for future sync readiness.' });
  };

  const exportBoard = () => {
    const payload = {
      exportType: 'quality-execution-board-summary',
      exportedAt: new Date().toISOString(),
      overview: summary.overview,
      lineStatus: summary.lineStatus,
      topFollowUps: summary.followUps.slice(0, 20).map((item) => ({
        id: item.id,
        runId: item.run.id,
        planName: item.plan?.planName,
        checkName: item.checkItem?.checkName,
        result: item.result.result,
        missingDefect: item.missingDefect,
        missingEvidence: item.missingEvidence,
        repeatedCount: item.repeatedCount,
      })),
      safetyNote: 'Decision-support summary from real local inspection execution records. No raw dataset rows are exported.',
    };
    downloadJsonFile(payload, 'quality-execution-board-summary.json');
    enqueueExecutionBoardExport(`Execution board summary exported locally with ${summary.followUps.length} failed-check follow-up item(s).`);
    toast.success('Execution board summary exported');
  };

  return (
    <PageContainer>
      <PageHeader
        title="Quality Execution Board"
        subtitle="Daily inspection execution, failed checks, plan compliance, and shopfloor follow-up"
      />

      <div className="space-y-6">
        <QualityDashboardFilterBar value={filters} onChange={setFilters} compact />
        <QualityAnalyticsConsistencyBadge dashboardName="Quality Execution Board" snapshot={analytics} compact />

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <ClipboardCheck className="h-6 w-6 text-[#00A3E0]" />
                <h2 className="text-xl font-black text-white">Execution Governance</h2>
              </div>
              <p className="mt-1 text-sm text-white/45">
                Current role: {roleLabel(role)}. {canViewAll ? 'Viewing all local inspection runs.' : 'Inspectors see their own runs where inspector name matches.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={refresh} className="rounded-xl">
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
              <Button type="button" variant="outline" onClick={exportBoard} disabled={!hasDefectPermission(workflowUser, 'records.export')} className="rounded-xl">
                <Download className="mr-2 h-4 w-4" /> Export Summary
              </Button>
              <Link to="/quality-shopfloor" className="rounded-xl bg-[#0066CC] px-4 py-2 text-sm font-black text-white">
                Open Shopfloor Entry
              </Link>
            </div>
          </div>
        </section>

        {runs.length === 0 ? (
          <QualityGuidedEmptyState
            title="No inspection runs yet"
            purpose="The Execution Board monitors real inspection runs, failed checks, evidence gaps, created defects, and plan compliance."
            firstAction="Publish an inspection plan, then start a shopfloor inspection run."
            actionHref="/quality-shopfloor"
            actionLabel="Start Shopfloor Run"
          />
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-9">
              {overviewCards.map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Icon className="mb-3 h-4 w-4 text-[#00A3E0]" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</p>
                  <p className="mt-1 text-2xl font-black text-white">{String(value)}</p>
                </div>
              ))}
            </section>

            {analytics && (
              <section className="rounded-3xl border border-[#00A3E0]/20 bg-[#00A3E0]/10 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white">Dashboard Impact Links</h2>
                    <p className="mt-1 text-sm text-[#8be3ff]">
                      Failed checks without defects: {analytics.inspectionExecutionMetrics.failedChecksWithoutDefect}. Current PPM: {analytics.ppmMetrics.currentPpm}. COPQ: ${analytics.copqMetrics.totalCopq.toLocaleString()}.
                    </p>
                    <p className="mt-2 text-xs text-white/45">Only failed checks with created defect records affect PPM, COPQ, SPC, and prediction training.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link to="/process-ppm" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/70">PPM Impact</Link>
                    <Link to="/defect-cost" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/70">COPQ Impact</Link>
                    <Link to="/quality-search" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/70">Similar Cases</Link>
                    <Link to="/quality-knowledge-base" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/70">Related Knowledge</Link>
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">Line Status Board</h2>
                  <p className="text-sm text-white/45">Status is based on real failed checks, evidence gaps, unrecorded defects, and completion signals.</p>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                  <Search className="h-4 w-4 text-white/40" />
                  <input value={lineFilter} onChange={(event) => setLineFilter(event.target.value)} placeholder="Filter line/model/point..." className="bg-transparent text-sm text-white outline-none" />
                </div>
              </div>
              {summary.lineStatus.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/40">No line execution status yet.</div>
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
                  {summary.lineStatus.map((line) => (
                    <div key={line.productionLine} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-black text-white">{line.productionLine}</h3>
                          <p className="mt-1 text-xs text-white/45">{line.reason}</p>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(line.status)}`}>{line.status}</span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <p className="rounded-xl bg-white/5 p-3 text-white/55">Plans <b className="text-white">{line.activeInspectionPlans}</b></p>
                        <p className="rounded-xl bg-white/5 p-3 text-white/55">Runs <b className="text-white">{line.totalRuns}</b></p>
                        <p className="rounded-xl bg-white/5 p-3 text-white/55">Failed <b className="text-white">{line.failedChecks}</b></p>
                        <p className="rounded-xl bg-white/5 p-3 text-white/55">Defects <b className="text-white">{line.defectsCreated}</b></p>
                      </div>
                      <div className="mt-4">
                        <div className="mb-1 flex justify-between text-xs text-white/45"><span>Completion</span><span>{line.completionPercent}%</span></div>
                        <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-[#00A3E0]" style={{ width: percentBar(line.completionPercent) }} /></div>
                      </div>
                      <p className="mt-3 text-xs text-[#8be3ff]">Top failed check: {line.topFailedCheck}</p>
                      <Link
                        to={`/quality-audits?line=${encodeURIComponent(line.productionLine)}`}
                        className="mt-3 inline-flex rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs font-black text-amber-100"
                      >
                        Open Layered Audit
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(380px,0.8fr)]">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="mb-4 text-xl font-black text-white">Recent Inspection Runs</h2>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-widest text-white/35">
                      <tr>
                        {['Run', 'Plan', 'Line', 'Model', 'Point', 'Inspector', 'Status', 'Started', 'Checks', 'Failed', 'Defects', ''].map((header) => (
                          <th key={header} className="px-3 py-3">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {visibleRuns.map((run) => {
                        const plan = runPlan(planMap, run);
                        const completion = runCompletion(run, plan);
                        return (
                          <tr key={run.id} className="text-white/65">
                            <td className="px-3 py-3 font-bold text-white">{run.id}</td>
                            <td className="px-3 py-3">{plan?.planName || run.inspectionPlanId}</td>
                            <td className="px-3 py-3">{run.productionLine || '---'}</td>
                            <td className="px-3 py-3">{run.model || '---'}</td>
                            <td className="px-3 py-3">{run.inspectionPoint || '---'}</td>
                            <td className="px-3 py-3">{run.inspector || '---'}</td>
                            <td className="px-3 py-3"><span className={`rounded-full border px-2 py-1 text-[10px] font-black ${statusClass(run.status)}`}>{run.status}</span></td>
                            <td className="px-3 py-3">{compactDate(run.startedAt)}</td>
                            <td className="px-3 py-3">{completion.completed}/{completion.total}</td>
                            <td className="px-3 py-3">{completion.failed}</td>
                            <td className="px-3 py-3">{run.createdDefectIds.length}</td>
                            <td className="px-3 py-3">
                              <button type="button" onClick={() => setSelectedRunId(run.id)} className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/60 hover:text-[#00A3E0]">
                                <Eye className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="mb-4 text-xl font-black text-white">Failed Check Follow-up</h2>
                {summary.followUps.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/40">No failed checks require follow-up.</div>
                ) : (
                  <div className="space-y-3">
                    {summary.followUps.slice(0, 12).map((item) => (
                      <div key={item.id} className={`rounded-2xl border p-4 ${selectedFollowUp?.id === item.id ? 'border-[#00A3E0]/40 bg-[#00A3E0]/10' : 'border-white/10 bg-black/10'}`}>
                        <button type="button" onClick={() => { setSelectedFollowUpId(item.id); setSelectedRunId(item.run.id); }} className="block w-full text-left">
                          <p className="text-sm font-black text-white">{item.checkItem?.checkName || item.result.checkItemId}</p>
                          <p className="mt-1 text-xs text-white/45">{item.run.productionLine || 'No line'} / {item.run.model || 'No model'} / repeated {item.repeatedCount}</p>
                        </button>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.missingDefect && <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-1 text-[10px] font-black text-amber-200">No defect yet</span>}
                          {item.missingEvidence && <span className="rounded-full border border-red-400/20 bg-red-500/10 px-2 py-1 text-[10px] font-black text-red-200">Evidence missing</span>}
                          {item.requiredCheck && <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black text-white/45">Required</span>}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button type="button" onClick={() => createDefectFromFollowUp(item)} disabled={!canCreateDefect || !item.missingDefect} className="rounded-xl text-xs">
                            Create Defect
                          </Button>
                          <Button type="button" variant="outline" onClick={() => createActionFromFollowUp(item)} disabled={!canCreateAction} className="rounded-xl text-xs">
                            Create Action
                          </Button>
                          <Link
                            to={`/quality-audits?line=${encodeURIComponent(item.run.productionLine || '')}&inspectionRunId=${encodeURIComponent(item.run.id)}&focus=failed-check`}
                            className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs font-black text-amber-100"
                          >
                            Audit Gap
                          </Link>
                          <Link to="/quality-inspection-plans" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/60">View Plan</Link>
                          <Link to="/quality-search" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/60">Search Similar</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="mb-4 text-xl font-black text-white">Plan Compliance</h2>
                <div className="space-y-3">
                  {summary.planComplianceRows.slice(0, 8).map((row) => (
                    <div key={row.planId} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-black text-white">{row.planName}</p>
                        <span className="text-sm font-black text-[#8be3ff]">{row.requiredChecksCompletedPercent}%</span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-[#00A3E0]" style={{ width: percentBar(row.requiredChecksCompletedPercent) }} /></div>
                      <p className="mt-2 text-xs text-white/45">Skipped required checks: {row.skippedRequiredChecks} / NA rate: {row.naRate}% / Evidence compliance: {row.evidenceCompliance}%</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="mb-4 text-xl font-black text-white">Failed Check Heatmap</h2>
                {summary.heatmap.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/40">No failed-check heatmap yet.</div>
                ) : (
                  <div className="space-y-3">
                    {summary.heatmap.map((row) => (
                      <div key={`${row.dimension}-${row.value}`} className="rounded-2xl border border-white/10 bg-black/10 p-3">
                        <div className="mb-2 flex justify-between gap-3 text-xs">
                          <span className="font-black text-white">{row.value}</span>
                          <span className="text-white/45">{row.dimension} / {row.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-amber-400" style={{ width: percentBar(row.percentage) }} /></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="mb-4 text-xl font-black text-white">Inspector Workload</h2>
                {summary.inspectorWorkload.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/40">No inspector workload yet.</div>
                ) : (
                  <div className="space-y-3">
                    {summary.inspectorWorkload.map((row) => (
                      <div key={row.inspector} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-white">{row.inspector}</p>
                            <p className="mt-1 text-xs text-white/45">Completed {row.completedRuns} / Open {row.openRuns}</p>
                          </div>
                          <UserCheck className="h-5 w-5 text-[#00A3E0]" />
                        </div>
                        <p className="mt-3 text-xs text-white/45">Failed checks: {row.failedChecksFound} / Defects: {row.defectsCreated} / Avg completion: {row.averageCompletionRate}%</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="mb-4 text-xl font-black text-white">Selected Inspection Run</h2>
                {!selectedRun ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/40">Open a run from the table to view detailed check execution.</div>
                ) : (
                  <div className="space-y-3">
                    {(runPlan(planMap, selectedRun)?.checkItems || []).map((item) => {
                      const result = selectedRun.checkResults.find((entry) => entry.checkItemId === item.id);
                      return (
                        <div key={item.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-white">{item.checkCode} / {item.checkName}</p>
                              <p className="mt-1 text-xs text-white/45">{item.acceptanceCriteria || item.standard || 'No criteria text'}</p>
                            </div>
                            <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(result?.result || 'na')}`}>{result?.result || 'not checked'}</span>
                          </div>
                          <p className="mt-2 text-xs text-white/45">Measured: {String(result?.measuredValue || '---')} / Defect: {result?.createdDefectId || '---'} / Notes: {result?.notes || '---'}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {selectedFollowUp ? (
                  <QualityKnowledgeSuggestions
                    title="Knowledge for Selected Failed Check"
                    canApply={canCreateAction}
                    context={{
                      sourceType: 'defect',
                      defectType: selectedFollowUp.checkItem?.defectTypeIfNG || selectedFollowUp.checkItem?.checkName,
                      productionLine: selectedFollowUp.run.productionLine,
                      model: selectedFollowUp.run.model,
                      partNumber: selectedFollowUp.plan?.partNumber,
                      severity: selectedFollowUp.checkItem?.severityIfNG,
                      recordType: selectedFollowUp.checkItem?.recordTypeIfNG,
                      title: selectedFollowUp.checkItem?.checkName,
                      description: selectedFollowUp.checkItem?.guidanceText || selectedFollowUp.checkItem?.acceptanceCriteria,
                      tags: ['inspection-execution', selectedFollowUp.run.inspectionPoint || '', selectedFollowUp.checkItem?.inspectionMethod || ''].filter(Boolean),
                    }}
                  />
                ) : (
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <h2 className="text-lg font-black text-white">Knowledge Suggestions</h2>
                    <p className="mt-2 text-sm text-white/40">Select a failed check to view similar lessons, alerts, and standard actions from the local knowledge base.</p>
                  </div>
                )}
                {!canCreateDefect && (
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                    <Lock className="mr-2 inline h-4 w-4" />
                    Defect creation from this board is disabled for {roleLabel(role)}.
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </PageContainer>
  );
}
