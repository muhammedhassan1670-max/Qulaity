import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Archive,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FileText,
  Lock,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer, PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import QualityDashboardFilterBar from '@/components/QualityDashboardFilterBar';
import QualityAnalyticsConsistencyBadge from '@/components/QualityAnalyticsConsistencyBadge';
import QualityKnowledgeSuggestions from '@/components/QualityKnowledgeSuggestions';
import { unifiedNcrApi } from '@/api/unified-api';
import useAuthStore from '@/stores/authStore';
import {
  buildLocalWorkflowUser,
  hasDefectPermission,
  loadLocalWorkflowRole,
  roleLabel,
  type QualityWorkflowRole,
} from '@/services/defectWorkflowGovernance';
import { createImprovementAction } from '@/services/qualityImprovementActions';
import { createQualityKnowledgeItem } from '@/services/qualityKnowledgeBase';
import {
  buildAuditRunFromPlan,
  buildLayeredAuditAnalytics,
  canExecuteAudit,
  canManageAuditPlans,
  canViewAllAudits,
  createBlankAuditItem,
  createBlankAuditPlan,
  duplicateQualityAuditPlan,
  archiveQualityAuditPlan,
  completeQualityAuditRun,
  enrichAuditRun,
  loadQualityAuditPlans,
  loadQualityAuditRuns,
  publishQualityAuditPlan,
  upsertQualityAuditPlan,
  upsertQualityAuditRun,
  addAuditRunActionLink,
  addAuditRunNcrLink,
  markAuditFindingTrainingPoint,
  QUALITY_AUDIT_PLANS_KEY,
  QUALITY_AUDIT_RUNS_KEY,
  type QualityAuditFinding,
  type QualityAuditInputType,
  type QualityAuditItem,
  type QualityAuditPlan,
  type QualityAuditResultValue,
  type QualityAuditRun,
  type QualityAuditType,
} from '@/services/qualityLayeredAudits';
import {
  loadQualityInspectionPlans,
  loadQualityInspectionRuns,
} from '@/services/qualityInspectionPlans';
import { enqueueQualitySyncItem } from '@/services/qualitySyncQueue';
import {
  loadQualityAnalyticsSnapshot,
  loadQualityDashboardFilters,
  type QualityAnalyticsSnapshot,
  type QualityDashboardFilters,
} from '@/services/qualityAnalyticsHub';

const auditTypes: QualityAuditType[] = ['process-audit', 'inspection-audit', 'product-audit', 'layered-audit', 'supervisor-audit'];
const inputTypes: QualityAuditInputType[] = ['pass-fail', 'score', 'text', 'select', 'photo-required'];
const ownerRoles: QualityWorkflowRole[] = ['ADMIN', 'PLANT_MANAGER', 'QUALITY_MANAGER', 'QUALITY_SUPERVISOR', 'QUALITY_ENGINEER', 'INSPECTOR'];

function text(value: unknown): string {
  return String(value ?? '');
}

function statusClass(value: string): string {
  if (['active', 'completed', 'pass'].includes(value)) return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200';
  if (['critical', 'fail', 'archived'].includes(value)) return 'border-red-400/20 bg-red-500/10 text-red-200';
  if (['major', 'partially-completed', 'draft'].includes(value)) return 'border-amber-400/20 bg-amber-500/10 text-amber-200';
  return 'border-white/10 bg-white/5 text-white/55';
}

function percentBar(value: number): string {
  return `${Math.max(0, Math.min(100, Math.round(value || 0)))}%`;
}

function compactDate(value?: string): string {
  if (!value) return '---';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '---' : date.toLocaleString();
}

function evidenceFromNote(note: string) {
  const clean = note.trim();
  return clean ? [{
    id: `audit-evidence-${Date.now()}`,
    name: 'Evidence reference',
    type: 'note',
    size: clean.length,
    note: clean,
    storedLocally: false,
    warning: 'Evidence reference stored as metadata. Attach large files in the controlled evidence store when available.',
    uploadedAt: new Date().toISOString(),
  }] : [];
}

export default function QualityLayeredAudits() {
  const [searchParams] = useSearchParams();
  const authUser = useAuthStore((state) => state.user);
  const role = loadLocalWorkflowRole();
  const workflowUser = useMemo(() => buildLocalWorkflowUser(authUser, role), [authUser, role]);
  const manageAccess = canManageAuditPlans(role);
  const executeAccess = canExecuteAudit(role);
  const canCreateAction = hasDefectPermission(workflowUser, 'defect.createCapa') || hasDefectPermission(workflowUser, 'defect.edit');
  const canCreateNcr = hasDefectPermission(workflowUser, 'defect.elevateNcr');

  const [plans, setPlans] = useState<QualityAuditPlan[]>(() => loadQualityAuditPlans(true));
  const [runs, setRuns] = useState<QualityAuditRun[]>(() => loadQualityAuditRuns());
  const [inspectionPlans] = useState(() => loadQualityInspectionPlans(true));
  const [inspectionRuns] = useState(() => loadQualityInspectionRuns());
  const [tab, setTab] = useState<'plans' | 'execute' | 'analytics'>('execute');
  const [selectedPlanId, setSelectedPlanId] = useState(() => plans[0]?.id || '');
  const [draft, setDraft] = useState<QualityAuditPlan>(() => plans[0] || createBlankAuditPlan());
  const [sectionDraft, setSectionDraft] = useState('');
  const [runDraft, setRunDraft] = useState<QualityAuditRun | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState('');
  const [planSearch, setPlanSearch] = useState('');
  const [filters, setFilters] = useState<QualityDashboardFilters>(() => loadQualityDashboardFilters());
  const [analyticsSnapshot, setAnalyticsSnapshot] = useState<QualityAnalyticsSnapshot | null>(null);

  const lineParam = searchParams.get('line') || '';
  const inspectionRunParam = searchParams.get('inspectionRunId') || '';
  const planMap = useMemo(() => new Map(plans.map((plan) => [plan.id, plan])), [plans]);
  const activePlans = useMemo(() => plans.filter((plan) => plan.status === 'active'), [plans]);
  const filteredRunsForAnalytics = analyticsSnapshot?.filteredAuditRuns || runs;
  const analytics = useMemo(() => buildLayeredAuditAnalytics(plans, filteredRunsForAnalytics), [filteredRunsForAnalytics, plans]);
  const visibleRuns = useMemo(() => {
    if (canViewAllAudits(role)) return runs.slice(0, 30);
    return runs.filter((run) => text(run.auditor).toLowerCase().includes(workflowUser.name.toLowerCase())).slice(0, 30);
  }, [role, runs, workflowUser.name]);
  const filteredPlans = useMemo(() => {
    const needle = planSearch.trim().toLowerCase();
    return plans.filter((plan) => {
      const haystack = [
        plan.auditName,
        plan.auditType,
        plan.productionLine,
        plan.inspectionPoint,
        plan.frequency,
        plan.status,
      ].join(' ').toLowerCase();
      return !needle || haystack.includes(needle);
    });
  }, [plans, planSearch]);
  const selectedFinding = runDraft?.findings.find((finding) => finding.id === selectedFindingId) || runDraft?.findings[0];

  useEffect(() => {
    loadQualityAnalyticsSnapshot(filters)
      .then(setAnalyticsSnapshot)
      .catch(() => setAnalyticsSnapshot(null));
  }, [filters]);

  const refresh = (nextPlanId?: string) => {
    const nextPlans = loadQualityAuditPlans(true);
    const nextRuns = loadQualityAuditRuns();
    setPlans(nextPlans);
    setRuns(nextRuns);
    const nextPlan = nextPlans.find((plan) => plan.id === (nextPlanId || selectedPlanId)) || nextPlans[0];
    if (nextPlan) {
      setSelectedPlanId(nextPlan.id);
      setDraft(nextPlan);
    }
    if (runDraft) {
      setRunDraft(nextRuns.find((run) => run.id === runDraft.id) || runDraft);
    }
  };

  const ensureManage = () => {
    if (manageAccess.allowed) return true;
    toast.error('Audit plan governance blocked', { description: manageAccess.reason });
    return false;
  };

  const ensureExecute = () => {
    if (executeAccess.allowed) return true;
    toast.error('Audit execution blocked', { description: executeAccess.reason });
    return false;
  };

  const selectPlan = (plan: QualityAuditPlan) => {
    setSelectedPlanId(plan.id);
    setDraft(plan);
  };

  const updateDraft = (patch: Partial<QualityAuditPlan>) => {
    setDraft((prev) => ({ ...prev, ...patch, updatedAt: new Date().toISOString() }));
  };

  const createPlan = () => {
    if (!ensureManage()) return;
    const created = upsertQualityAuditPlan(createBlankAuditPlan());
    refresh(created.id);
    setTab('plans');
    toast.success('Layered audit plan created', { description: `Stored locally in ${QUALITY_AUDIT_PLANS_KEY}.` });
  };

  const savePlan = () => {
    if (!ensureManage()) return;
    const saved = upsertQualityAuditPlan(draft);
    refresh(saved.id);
    toast.success('Audit plan saved locally');
  };

  const publishPlan = () => {
    if (!ensureManage()) return;
    if (draft.auditItems.length === 0) {
      toast.error('Cannot publish empty audit plan', { description: 'Add at least one audit item before publishing.' });
      return;
    }
    const saved = upsertQualityAuditPlan(draft, false);
    const published = publishQualityAuditPlan(saved.id);
    if (!published) return;
    refresh(published.id);
    toast.success('Audit plan published', { description: `Active version ${published.version} can now be executed by quality supervisors.` });
  };

  const duplicatePlan = () => {
    if (!ensureManage()) return;
    const copy = duplicateQualityAuditPlan(draft.id);
    if (!copy) return;
    refresh(copy.id);
    toast.success('Audit plan duplicated');
  };

  const archivePlan = () => {
    if (!ensureManage()) return;
    const confirmed = window.confirm('Archive this audit plan? Existing audit runs will remain available.');
    if (!confirmed) return;
    const archived = archiveQualityAuditPlan(draft.id);
    if (!archived) return;
    refresh(archived.id);
    toast.success('Audit plan archived');
  };

  const addSection = () => {
    if (!ensureManage()) return;
    const title = sectionDraft.trim() || `Section ${draft.sections.length + 1}`;
    if (draft.sections.some((section) => section.title.toLowerCase() === title.toLowerCase())) {
      toast.error('Section already exists');
      return;
    }
    updateDraft({
      sections: [...draft.sections, {
        id: `audit-section-${Date.now()}`,
        title,
        order: draft.sections.length + 1,
      }],
    });
    setSectionDraft('');
  };

  const addItem = (section = draft.sections[0]?.title || 'General') => {
    if (!ensureManage()) return;
    updateDraft({ auditItems: [...draft.auditItems, createBlankAuditItem(section, draft.auditItems.length + 1)] });
  };

  const updateItem = (id: string, patch: Partial<QualityAuditItem>) => {
    updateDraft({ auditItems: draft.auditItems.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
  };

  const removeItem = (id: string) => {
    if (!ensureManage()) return;
    updateDraft({ auditItems: draft.auditItems.filter((item) => item.id !== id) });
  };

  const startRun = (planId = selectedPlanId) => {
    if (!ensureExecute()) return;
    const plan = planMap.get(planId) || activePlans[0];
    if (!plan || plan.status !== 'active') {
      toast.error('No active audit plan selected', { description: 'Publish an audit plan before executing supervisor audits.' });
      return;
    }
    const relatedRun = inspectionRuns.find((run) => run.id === inspectionRunParam);
    const run = buildAuditRunFromPlan(plan, {
      productionLine: lineParam || relatedRun?.productionLine || plan.productionLine,
      inspectionPoint: relatedRun?.inspectionPoint || plan.inspectionPoint,
      relatedInspectionRunId: inspectionRunParam || undefined,
    }, workflowUser.name);
    const saved = upsertQualityAuditRun(run);
    setRunDraft(saved);
    setSelectedFindingId('');
    setTab('execute');
    refresh(plan.id);
    toast.success('Audit run started', { description: 'Answer the checklist, then complete the run when evidence and notes are ready.' });
  };

  const updateAnswer = (item: QualityAuditItem, patch: Partial<QualityAuditRun['answers'][number]>) => {
    if (!runDraft) return;
    const existing = runDraft.answers.find((answer) => answer.auditItemId === item.id);
    const nextAnswer = {
      auditItemId: item.id,
      result: existing?.result || 'na' as QualityAuditResultValue,
      ...existing,
      ...patch,
    };
    const nextAnswers = existing
      ? runDraft.answers.map((answer) => (answer.auditItemId === item.id ? nextAnswer : answer))
      : [...runDraft.answers, nextAnswer];
    const plan = planMap.get(runDraft.auditPlanId);
    setRunDraft(enrichAuditRun({ ...runDraft, answers: nextAnswers }, plan, runs));
  };

  const saveRunDraft = () => {
    if (!runDraft) return;
    const saved = upsertQualityAuditRun(runDraft);
    setRunDraft(saved);
    refresh(saved.auditPlanId);
    toast.success('Audit run saved', { description: `Stored locally in ${QUALITY_AUDIT_RUNS_KEY}.` });
  };

  const completeRun = () => {
    if (!runDraft) return;
    const confirmed = window.confirm('Complete this audit run? Findings will remain available for actions, NCRs, and knowledge follow-up.');
    if (!confirmed) return;
    const completed = completeQualityAuditRun(runDraft);
    setRunDraft(completed);
    refresh(completed.auditPlanId);
    toast.success('Audit completed', { description: `Score ${completed.auditScore}% with ${completed.findings.length} finding(s).` });
  };

  const openExistingRun = (run: QualityAuditRun) => {
    setRunDraft(run);
    setSelectedPlanId(run.auditPlanId);
    const plan = planMap.get(run.auditPlanId);
    if (plan) setDraft(plan);
    setTab('execute');
  };

  const createActionFromFinding = (finding: QualityAuditFinding) => {
    if (!runDraft) return;
    if (!canCreateAction) {
      toast.error('Create action blocked', { description: `${roleLabel(role)} cannot create improvement actions from audit findings.` });
      return;
    }
    const confirmed = window.confirm('Create an improvement action from this audit finding?');
    if (!confirmed) return;
    const action = createImprovementAction({
      title: `Audit action: ${finding.question}`,
      description: [
        'Action created from a real layered audit finding.',
        finding.suggestedAction ? `Suggested focus: ${finding.suggestedAction}` : '',
        'Use as decision-support and verify scope before closure.',
      ].filter(Boolean).join(' '),
      sourceType: 'audit',
      sourceId: runDraft.id,
      actionType: finding.findingType.toLowerCase().includes('training') ? 'training' : 'audit',
      priority: finding.severity === 'critical' ? 'critical' : finding.severity === 'major' ? 'high' : 'medium',
      linkedProductionLine: runDraft.productionLine,
      linkedSeverity: finding.severity,
    });
    const updated = addAuditRunActionLink(runDraft.id, finding.id, action.id);
    if (updated) setRunDraft(updated);
    refresh(runDraft.auditPlanId);
    toast.success('Audit action created', { description: 'The action is stored locally and linked to this audit finding.' });
  };

  const createNcrFromFinding = async (finding: QualityAuditFinding) => {
    if (!runDraft) return;
    if (!canCreateNcr) {
      toast.error('NCR creation blocked', { description: `${roleLabel(role)} cannot elevate audit findings to NCR.` });
      return;
    }
    if (finding.severity !== 'critical' && finding.repeatedCount < 2) {
      toast.info('NCR should be reserved for critical or repeated audit gaps', { description: 'You can still create an improvement action for normal follow-up.' });
      return;
    }
    const confirmed = window.confirm('Create an NCR from this audit finding? Review the NCR before closure or escalation.');
    if (!confirmed) return;
    try {
      const created = await unifiedNcrApi.create({
        title: `Audit finding: ${finding.question}`,
        description: [
          `Layered audit finding from run ${runDraft.id}.`,
          `Finding type: ${finding.findingType}.`,
          finding.suggestedAction ? `Suggested follow-up: ${finding.suggestedAction}.` : '',
        ].filter(Boolean).join(' '),
        priority: finding.severity,
        source: 'layered-audit',
        sourceAuditId: runDraft.id,
        plantId: 'local-plant',
        detectedDate: new Date().toISOString().split('T')[0],
        status: 'open',
        metadata: {
          auditRunId: runDraft.id,
          auditPlanId: runDraft.auditPlanId,
          auditFindingId: finding.id,
          productionLine: runDraft.productionLine,
          inspectionPoint: runDraft.inspectionPoint,
          safetyNote: 'NCR was user-created from a real audit finding and requires verification.',
        },
      });
      const updated = addAuditRunNcrLink(runDraft.id, finding.id, created.id || '');
      if (updated) setRunDraft(updated);
      refresh(runDraft.auditPlanId);
      toast.success('NCR created from audit finding', { description: 'The NCR is linked to this audit run and available in existing NCR flows.' });
    } catch (error) {
      toast.error('Failed to create NCR', { description: error instanceof Error ? error.message : 'Local NCR create failed.' });
    }
  };

  const createTrainingPoint = (finding: QualityAuditFinding) => {
    if (!runDraft) return;
    const confirmed = window.confirm('Create a draft training point from this audit finding?');
    if (!confirmed) return;
    createQualityKnowledgeItem({
      title: `Training point: ${finding.question}`,
      type: 'training-point',
      status: 'draft',
      sourceType: 'manual',
      sourceId: runDraft.id,
      productionLine: runDraft.productionLine,
      severity: finding.severity,
      problemSummary: finding.findingType,
      historicalPattern: finding.repeatedCount > 1 ? `Repeated in ${finding.repeatedCount} audit finding(s).` : 'Single audit finding. Verify before standardization.',
      effectiveActions: finding.suggestedAction,
      recommendedVerification: 'Verify operator/inspector understanding, evidence discipline, and inspection plan compliance.',
      trainingNeed: finding.suggestedAction || 'Supervisor coaching and standard work refresh.',
      tags: ['layered-audit', 'training-point', finding.findingType].filter(Boolean),
    });
    const updated = markAuditFindingTrainingPoint(runDraft.id, finding.id);
    if (updated) setRunDraft(updated);
    refresh(runDraft.auditPlanId);
    toast.success('Training point drafted', { description: 'Stored in the local Knowledge Base for review before activation.' });
  };

  const exportAuditSummary = () => {
    enqueueQualitySyncItem({
      entityType: 'audit-runs',
      entityId: 'layered-audit-summary',
      operation: 'update',
      payloadSummary: 'Layered audit summary exported locally.',
    });
    const payload = {
      exportType: 'layered-audit-summary',
      exportedAt: new Date().toISOString(),
      analytics,
      recentRuns: analytics.recentRuns.map((run) => ({
        id: run.id,
        auditPlanId: run.auditPlanId,
        auditType: run.auditType,
        productionLine: run.productionLine,
        status: run.status,
        auditScore: run.auditScore,
        findings: run.findings.length,
      })),
      safetyNote: 'Audit analytics are based on real local audit runs. They are decision-support and require quality verification.',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'layered-audit-summary.json';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Audit summary exported');
  };

  const runPlan = runDraft ? planMap.get(runDraft.auditPlanId) : null;

  return (
    <PageContainer>
      <PageHeader
        title="Layered Process Audits"
        subtitle="Quality supervisor audits for inspection execution, evidence discipline, findings, and closed-loop follow-up"
      />

      <div className="space-y-6">
        <QualityDashboardFilterBar value={filters} onChange={setFilters} compact />
        <QualityAnalyticsConsistencyBadge dashboardName="Layered Audits" snapshot={analyticsSnapshot} compact />

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-[#00A3E0]" />
                <h2 className="text-xl font-black text-white">Supervisor Audit Governance</h2>
              </div>
              <p className="mt-1 text-sm text-white/45">
                Current role: {roleLabel(role)}. Audit records remain local-first and are linked to execution, actions, NCR, and knowledge where users confirm.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['execute', 'plans', 'analytics'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTab(value)}
                  className={`rounded-xl border px-4 py-2 text-sm font-black ${tab === value ? 'border-[#00A3E0]/40 bg-[#00A3E0]/15 text-[#8be3ff]' : 'border-white/10 bg-white/5 text-white/55'}`}
                >
                  {value === 'execute' ? 'Execute Audit' : value === 'plans' ? 'Audit Plans' : 'Analytics'}
                </button>
              ))}
              <Button type="button" variant="outline" onClick={() => refresh()} className="rounded-xl">
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
              <Button type="button" variant="outline" onClick={exportAuditSummary} disabled={!hasDefectPermission(workflowUser, 'records.export')} className="rounded-xl">
                <FileText className="mr-2 h-4 w-4" /> Export Summary
              </Button>
            </div>
          </div>
          {(lineParam || inspectionRunParam) && (
            <div className="mt-4 rounded-2xl border border-[#00A3E0]/20 bg-[#00A3E0]/10 p-4 text-sm text-[#8be3ff]">
              Opened from execution context: line {lineParam || 'not specified'} / inspection run {inspectionRunParam || 'not specified'}.
            </div>
          )}
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          {[
            ['Active Plans', analytics.activePlans],
            ['Runs', analytics.totalRuns],
            ['Due Today', analytics.auditsDueToday],
            ['Completion', `${analytics.completionRate}%`],
            ['Avg Score', `${analytics.averageAuditScore}%`],
            ['Findings', analytics.failedAuditItems],
            ['Critical', analytics.criticalFindings],
            ['Actions', analytics.actionsCreatedFromAudits],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</p>
              <p className="mt-2 text-2xl font-black text-white">{String(value)}</p>
            </div>
          ))}
        </section>

        {tab === 'plans' && (
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-white">Audit Plans</h2>
                <Button type="button" onClick={createPlan} disabled={!manageAccess.allowed} className="rounded-xl">
                  <Plus className="mr-2 h-4 w-4" /> New
                </Button>
              </div>
              <input
                value={planSearch}
                onChange={(event) => setPlanSearch(event.target.value)}
                placeholder="Search audit plans..."
                className="mb-4 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
              />
              <div className="space-y-3">
                {filteredPlans.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/40">No audit plans yet. Create a plan without adding demo data.</div>
                ) : filteredPlans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => selectPlan(plan)}
                    className={`block w-full rounded-2xl border p-4 text-left ${selectedPlanId === plan.id ? 'border-[#00A3E0]/40 bg-[#00A3E0]/10' : 'border-white/10 bg-black/10'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-white">{plan.auditName}</p>
                        <p className="mt-1 text-xs text-white/45">{plan.auditType} / {plan.productionLine || 'All lines'} / v{plan.version}</p>
                      </div>
                      <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${statusClass(plan.status)}`}>{plan.status}</span>
                    </div>
                  </button>
                ))}
              </div>
              {!manageAccess.allowed && (
                <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                  <Lock className="mr-2 inline h-4 w-4" />
                  {manageAccess.reason}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">Plan Builder</h2>
                  <p className="text-sm text-white/45">Define questions that verify inspection plan compliance and shopfloor discipline.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={savePlan} disabled={!manageAccess.allowed} className="rounded-xl"><Save className="mr-2 h-4 w-4" /> Save</Button>
                  <Button type="button" variant="outline" onClick={publishPlan} disabled={!manageAccess.allowed} className="rounded-xl"><CheckCircle2 className="mr-2 h-4 w-4" /> Publish</Button>
                  <Button type="button" variant="outline" onClick={duplicatePlan} disabled={!manageAccess.allowed} className="rounded-xl"><Copy className="mr-2 h-4 w-4" /> Duplicate</Button>
                  <Button type="button" variant="outline" onClick={archivePlan} disabled={!manageAccess.allowed} className="rounded-xl"><Archive className="mr-2 h-4 w-4" /> Archive</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <input value={draft.auditName} onChange={(event) => updateDraft({ auditName: event.target.value })} placeholder="Audit name" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white" />
                <select value={draft.auditType} onChange={(event) => updateDraft({ auditType: event.target.value as QualityAuditType })} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white">
                  {auditTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <select value={draft.ownerRole || 'QUALITY_SUPERVISOR'} onChange={(event) => updateDraft({ ownerRole: event.target.value as QualityWorkflowRole })} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white">
                  {ownerRoles.map((ownerRole) => <option key={ownerRole} value={ownerRole}>{ownerRole}</option>)}
                </select>
                {[
                  ['productionLine', 'Production line'],
                  ['inspectionPoint', 'Inspection point'],
                  ['frequency', 'Frequency'],
                  ['factory', 'Factory'],
                  ['workshop', 'Workshop'],
                ].map(([key, label]) => (
                  <input key={key} value={text(draft[key as keyof QualityAuditPlan])} onChange={(event) => updateDraft({ [key]: event.target.value })} placeholder={label} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white" />
                ))}
                <select value={draft.relatedInspectionPlanId || ''} onChange={(event) => updateDraft({ relatedInspectionPlanId: event.target.value })} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white">
                  <option value="">Related inspection plan</option>
                  {inspectionPlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.planName}</option>)}
                </select>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-4">
                <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <h3 className="text-lg font-black text-white">Sections & Audit Items</h3>
                  <div className="flex gap-2">
                    <input value={sectionDraft} onChange={(event) => setSectionDraft(event.target.value)} placeholder="New section" className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" />
                    <Button type="button" variant="outline" onClick={addSection} disabled={!manageAccess.allowed} className="rounded-xl">Add Section</Button>
                  </div>
                </div>

                <div className="space-y-5">
                  {draft.sections.map((section) => {
                    const sectionItems = draft.auditItems.filter((item) => item.section === section.title);
                    return (
                      <div key={section.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h4 className="text-sm font-black uppercase tracking-widest text-[#8be3ff]">{section.title}</h4>
                          <Button type="button" variant="outline" onClick={() => addItem(section.title)} disabled={!manageAccess.allowed} className="rounded-xl text-xs">Add Item</Button>
                        </div>
                        {sectionItems.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-white/35">No audit items in this section.</div>
                        ) : (
                          <div className="space-y-3">
                            {sectionItems.map((item) => (
                              <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                                <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
                                  <input value={item.itemCode} onChange={(event) => updateItem(item.id, { itemCode: event.target.value })} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" />
                                  <input value={item.question} onChange={(event) => updateItem(item.id, { question: event.target.value })} placeholder="Audit question" className="lg:col-span-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" />
                                  <select value={item.inputType} onChange={(event) => updateItem(item.id, { inputType: event.target.value as QualityAuditInputType })} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white">
                                    {inputTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                                  </select>
                                  <input value={item.expectedCondition || ''} onChange={(event) => updateItem(item.id, { expectedCondition: event.target.value })} placeholder="Expected condition" className="lg:col-span-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" />
                                  <input value={item.suggestedAction || ''} onChange={(event) => updateItem(item.id, { suggestedAction: event.target.value })} placeholder="Suggested action if failed" className="lg:col-span-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" />
                                  <input value={item.linkedCheckItemId || ''} onChange={(event) => updateItem(item.id, { linkedCheckItemId: event.target.value })} placeholder="Linked check item id" className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" />
                                  <input type="number" value={item.weight} onChange={(event) => updateItem(item.id, { weight: Number(event.target.value || 1) })} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" />
                                  <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/60">
                                    <input type="checkbox" checked={item.isCritical} onChange={(event) => updateItem(item.id, { isCritical: event.target.checked, severityIfFail: event.target.checked ? 'critical' : item.severityIfFail })} />
                                    Critical
                                  </label>
                                  <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/60">
                                    <input type="checkbox" checked={item.requiredEvidence} onChange={(event) => updateItem(item.id, { requiredEvidence: event.target.checked })} />
                                    Evidence Required
                                  </label>
                                  <Button type="button" variant="outline" onClick={() => removeItem(item.id)} disabled={!manageAccess.allowed} className="rounded-xl text-xs">
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === 'execute' && (
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)_380px]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="mb-4 text-xl font-black text-white">Start / Open Audit</h2>
                {activePlans.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/40">No active audit plans. Publish a plan before execution.</div>
                ) : (
                  <div className="space-y-3">
                    <select value={selectedPlanId} onChange={(event) => setSelectedPlanId(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white">
                      {activePlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.auditName} / {plan.productionLine || 'All lines'}</option>)}
                    </select>
                    <Button type="button" onClick={() => startRun(selectedPlanId)} disabled={!executeAccess.allowed} className="w-full rounded-xl">
                      <ClipboardCheck className="mr-2 h-4 w-4" /> Start Audit Run
                    </Button>
                  </div>
                )}
                {!executeAccess.allowed && (
                  <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                    <Lock className="mr-2 inline h-4 w-4" />
                    {executeAccess.reason}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="mb-4 text-xl font-black text-white">Recent Audit Runs</h2>
                {visibleRuns.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/40">No layered audit runs yet.</div>
                ) : (
                  <div className="space-y-3">
                    {visibleRuns.map((run) => (
                      <button key={run.id} type="button" onClick={() => openExistingRun(run)} className="block w-full rounded-2xl border border-white/10 bg-black/10 p-4 text-left hover:bg-white/10">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-white">{planMap.get(run.auditPlanId)?.auditName || run.auditPlanId}</p>
                            <p className="mt-1 text-xs text-white/45">{run.productionLine || 'No line'} / {compactDate(run.startedAt)}</p>
                          </div>
                          <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${statusClass(run.status)}`}>{run.status}</span>
                        </div>
                        <p className="mt-3 text-xs text-[#8be3ff]">Score {run.auditScore}% / Findings {run.findings.length}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">Audit Checklist</h2>
                  <p className="text-sm text-white/45">
                    {runDraft ? `${runPlan?.auditName || runDraft.auditPlanId} / ${runDraft.productionLine || 'No line'} / score ${runDraft.auditScore}%` : 'Start or open an audit run.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={saveRunDraft} disabled={!runDraft || !executeAccess.allowed} className="rounded-xl"><Save className="mr-2 h-4 w-4" /> Save Draft</Button>
                  <Button type="button" onClick={completeRun} disabled={!runDraft || !executeAccess.allowed} className="rounded-xl"><CheckCircle2 className="mr-2 h-4 w-4" /> Complete</Button>
                </div>
              </div>
              {!runDraft || !runPlan ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
                  <ClipboardCheck className="mx-auto mb-4 h-10 w-10 text-white/25" />
                  <h3 className="text-xl font-black text-white">No audit run selected</h3>
                  <p className="mx-auto mt-2 max-w-xl text-sm text-white/45">Select an active plan and start a run. Audits use real local plans and do not create fake findings.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-2 flex justify-between text-xs text-white/45"><span>Audit Score</span><span>{runDraft.auditScore}%</span></div>
                    <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-[#00A3E0]" style={{ width: percentBar(runDraft.auditScore) }} /></div>
                    <p className="mt-3 text-xs text-white/45">Related inspection run: {runDraft.relatedInspectionRunId || '---'} / Auditor: {runDraft.auditor || workflowUser.name}</p>
                  </div>
                  {runPlan.auditItems.map((item) => {
                    const answer = runDraft.answers.find((entry) => entry.auditItemId === item.id);
                    return (
                      <div key={item.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-sm font-black text-white">{item.itemCode} / {item.question}</p>
                            <p className="mt-1 text-xs text-white/45">{item.expectedCondition || 'No expected condition configured.'}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {item.isCritical && <span className="rounded-full border border-red-400/20 bg-red-500/10 px-2 py-1 text-[10px] font-black text-red-200">Critical</span>}
                              {item.requiredEvidence && <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-1 text-[10px] font-black text-amber-200">Evidence required</span>}
                              {item.linkedCheckItemId && <span className="rounded-full border border-[#00A3E0]/20 bg-[#00A3E0]/10 px-2 py-1 text-[10px] font-black text-[#8be3ff]">Linked check</span>}
                            </div>
                          </div>
                          <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
                            {(['pass', 'fail', 'na'] as QualityAuditResultValue[]).map((result) => (
                              <button
                                key={result}
                                type="button"
                                onClick={() => updateAnswer(item, { result })}
                                className={`rounded-lg px-3 py-2 text-xs font-black ${answer?.result === result ? 'bg-[#0066CC] text-white' : 'text-white/45 hover:text-white'}`}
                              >
                                {result}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                          {item.inputType === 'score' && (
                            <input type="number" min="0" max="100" value={answer?.score ?? ''} onChange={(event) => updateAnswer(item, { score: Number(event.target.value || 0) })} placeholder="Score 0-100" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white" />
                          )}
                          {(item.inputType === 'text' || item.inputType === 'select') && (
                            <input value={answer?.textValue || ''} onChange={(event) => updateAnswer(item, { textValue: event.target.value })} placeholder="Audit response" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white" />
                          )}
                          <input value={answer?.notes || ''} onChange={(event) => updateAnswer(item, { notes: event.target.value })} placeholder="Notes" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white" />
                          {(item.requiredEvidence || item.inputType === 'photo-required') && (
                            <input
                              value={answer?.evidence?.[0]?.note || ''}
                              onChange={(event) => updateAnswer(item, { evidence: evidenceFromNote(event.target.value) })}
                              placeholder="Evidence reference / photo id"
                              className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white"
                            />
                          )}
                        </div>
                        {answer?.finding && (
                          <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-100">
                            Finding: {answer.finding.findingType}. Suggested action: {answer.finding.suggestedAction || 'Verify standard work and evidence.'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="mb-4 text-xl font-black text-white">Audit Findings</h2>
                {!runDraft || runDraft.findings.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/40">Fail audit items to create findings. No NCR/action is auto-created.</div>
                ) : (
                  <div className="space-y-3">
                    {runDraft.findings.map((finding) => (
                      <div key={finding.id} className={`rounded-2xl border p-4 ${selectedFinding?.id === finding.id ? 'border-[#00A3E0]/40 bg-[#00A3E0]/10' : 'border-white/10 bg-black/10'}`}>
                        <button type="button" onClick={() => setSelectedFindingId(finding.id)} className="block w-full text-left">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-white">{finding.itemCode} / {finding.question}</p>
                              <p className="mt-1 text-xs text-white/45">Repeated {finding.repeatedCount} / Evidence missing: {finding.evidenceMissing ? 'Yes' : 'No'}</p>
                            </div>
                            <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${statusClass(finding.severity)}`}>{finding.severity}</span>
                          </div>
                        </button>
                        <p className="mt-3 text-xs text-[#8be3ff]">{finding.suggestedAction || 'Verify process discipline and inspection evidence.'}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button type="button" onClick={() => createActionFromFinding(finding)} disabled={!canCreateAction || Boolean(finding.createdActionId)} className="rounded-xl text-xs">
                            {finding.createdActionId ? 'Action Linked' : 'Create Action'}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => createNcrFromFinding(finding)} disabled={!canCreateNcr || Boolean(finding.createdNcrId)} className="rounded-xl text-xs">
                            {finding.createdNcrId ? 'NCR Linked' : 'Create NCR'}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => createTrainingPoint(finding)} disabled={Boolean(finding.trainingPointCreated)} className="rounded-xl text-xs">
                            {finding.trainingPointCreated ? 'Training Drafted' : 'Training Point'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedFinding ? (
                <QualityKnowledgeSuggestions
                  title="Knowledge for Audit Finding"
                  canApply={canCreateAction}
                  context={{
                    sourceType: 'manual',
                    productionLine: runDraft?.productionLine,
                    severity: selectedFinding.severity,
                    title: selectedFinding.question,
                    description: selectedFinding.suggestedAction,
                    tags: ['layered-audit', selectedFinding.findingType, runDraft?.inspectionPoint || ''].filter(Boolean),
                  }}
                />
              ) : (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <h2 className="text-lg font-black text-white">Knowledge Suggestions</h2>
                  <p className="mt-2 text-sm text-white/40">Select an audit finding to view similar local lessons, inspection alerts, and training points.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {tab === 'analytics' && (
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h2 className="mb-4 text-xl font-black text-white">Line Compliance</h2>
              {analytics.lineCompliance.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/40">No audit runs yet.</div>
              ) : analytics.lineCompliance.map((line) => (
                <div key={line.line} className="mb-3 rounded-2xl border border-white/10 bg-black/10 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-black text-white">{line.line}</span>
                    <span className="font-black text-[#8be3ff]">{line.averageScore}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-[#00A3E0]" style={{ width: percentBar(line.averageScore) }} /></div>
                  <p className="mt-2 text-xs text-white/45">Runs {line.runs} / Critical findings {line.criticalFindings}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h2 className="mb-4 text-xl font-black text-white">Repeat Findings</h2>
              {analytics.repeatedFindings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/40">No repeated audit findings yet.</div>
              ) : analytics.repeatedFindings.slice(0, 10).map((finding) => (
                <div key={finding.key} className="mb-3 rounded-2xl border border-white/10 bg-black/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-black text-white">{finding.key}</p>
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${statusClass(finding.severity)}`}>{finding.count}</span>
                  </div>
                  <p className="mt-2 text-xs text-white/45">{finding.suggestedAction || 'Review repeated audit gap and verify standard work.'}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h2 className="mb-4 text-xl font-black text-white">Audit Management Insight</h2>
              <div className="space-y-3 text-sm text-white/60">
                <p className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  Lowest compliance line is <b className="text-white">{analytics.lowestComplianceLine}</b> at <b className="text-white">{analytics.lowestComplianceScore}%</b>. Use this as a suggested focus for supervisor verification.
                </p>
                <p className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  Critical findings: <b className="text-white">{analytics.criticalFindings}</b>. Repeated findings: <b className="text-white">{analytics.repeatFindings}</b>. These are quality signals, not confirmed root causes.
                </p>
                <p className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  Overdue audit actions: <b className="text-white">{analytics.overdueAuditActions}</b>. Prioritize action ownership and verification before closure.
                </p>
                <Link to="/quality-execution-board" className="flex items-center justify-center gap-2 rounded-xl border border-[#00A3E0]/25 bg-[#00A3E0]/10 px-4 py-3 text-sm font-black text-[#8be3ff]">
                  <BarChart3 className="h-4 w-4" /> Open Execution Board
                </Link>
              </div>
            </div>

            <div className="xl:col-span-3 rounded-3xl border border-white/10 bg-white/5 p-5">
              <h2 className="mb-4 text-xl font-black text-white">Recent Audit Runs</h2>
              {analytics.recentRuns.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/40">No audit run history yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[840px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-widest text-white/35">
                      <tr>{['Run', 'Plan', 'Line', 'Point', 'Auditor', 'Status', 'Score', 'Findings', 'Completed'].map((header) => <th key={header} className="px-3 py-3">{header}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {analytics.recentRuns.map((run) => (
                        <tr key={run.id} className="text-white/65">
                          <td className="px-3 py-3 font-bold text-white">{run.id}</td>
                          <td className="px-3 py-3">{planMap.get(run.auditPlanId)?.auditName || run.auditPlanId}</td>
                          <td className="px-3 py-3">{run.productionLine || '---'}</td>
                          <td className="px-3 py-3">{run.inspectionPoint || '---'}</td>
                          <td className="px-3 py-3">{run.auditor || '---'}</td>
                          <td className="px-3 py-3"><span className={`rounded-full border px-2 py-1 text-[10px] font-black ${statusClass(run.status)}`}>{run.status}</span></td>
                          <td className="px-3 py-3">{run.auditScore}%</td>
                          <td className="px-3 py-3">{run.findings.length}</td>
                          <td className="px-3 py-3">{compactDate(run.completedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </PageContainer>
  );
}
