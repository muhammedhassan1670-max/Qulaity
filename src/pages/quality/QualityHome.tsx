import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Database,
  Download,
  FileText,
  FileJson,
  LayoutTemplate,
  Plus,
  Search,
  ShieldCheck,
  Smartphone,
  Wrench,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer, PageHeader } from '@/components/PageHeader';
import { unifiedDefectLogApi, type DefectLogData } from '@/api/unified-api';
import { loadLocalWorkflowRole, roleLabel, type QualityWorkflowRole } from '@/services/defectWorkflowGovernance';
import { loadQualityFormTemplates } from '@/services/qualityFormTemplates';
import { loadQualityInspectionPlans, loadQualityInspectionRuns } from '@/services/qualityInspectionPlans';
import { loadQualityAuditRuns } from '@/services/qualityLayeredAudits';
import { loadImprovementActions } from '@/services/qualityImprovementActions';
import { loadQualityKnowledgeBase } from '@/services/qualityKnowledgeBase';
import { loadQualitySyncQueue } from '@/services/qualitySyncQueue';
import { loadAllQualityMasterTables, qualityMasterTableConfigs } from '@/services/qualityMasterData';
import {
  buildQualitySetupReadiness,
  buildQualityPilotReadiness,
  createQualityPilotIssue,
  formatQualityPilotReadinessMarkdown,
  formatQualitySetupReportMarkdown,
  recordQualitySetupEvent,
  updateQualityPilotIssueStatus,
  type GuidedSetupStep,
  type QualityPilotIssue,
  type QualityPilotIssueSeverity,
  type QualityPilotIssueStatus,
  type QualitySetupStepStatus,
} from '@/services/qualitySetupReadiness';
import {
  getDefectPersistenceDiagnostics,
  runDefectPersistenceSafetyCheck,
  type DefectPersistenceSafetyCheck,
} from '@/services/safeDefectStorage';

interface WorkspaceCard {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

const processFlow = [
  ['Setup Master Data', '/quality-master-data'],
  ['Design Form', '/quality-form-designer'],
  ['Build Inspection Plan', '/quality-inspection-plans'],
  ['Execute Inspection', '/quality-shopfloor'],
  ['Record Defect', '/defect-log'],
  ['Review / Escalate', '/quality/records/ncr'],
  ['Action', '/quality-command-center'],
  ['Verify Effectiveness', '/quality-command-center'],
  ['Lesson Learned', '/quality-knowledge-base'],
];

function cardClass(): string {
  return 'rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-[#00A3E0]/35 hover:bg-white/10';
}

function downloadTextFile(text: string, fileName: string, type = 'text/markdown;charset=utf-8'): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadJsonFile(value: unknown, fileName: string): void {
  downloadTextFile(JSON.stringify(value, null, 2), fileName, 'application/json;charset=utf-8');
}

function statusBadgeClass(status: QualitySetupStepStatus): string {
  if (status === 'done') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200';
  if (status === 'warning') return 'border-amber-400/20 bg-amber-400/10 text-amber-200';
  return 'border-red-400/20 bg-red-400/10 text-red-200';
}

function readinessClass(level: string): string {
  if (level === 'Ready') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200';
  if (level === 'Partially Ready') return 'border-amber-400/20 bg-amber-400/10 text-amber-200';
  return 'border-red-400/20 bg-red-400/10 text-red-200';
}

function severityBadgeClass(severity: string): string {
  if (severity === 'critical') return 'border-red-400/20 bg-red-500/10 text-red-200';
  if (severity === 'high') return 'border-orange-400/20 bg-orange-500/10 text-orange-200';
  if (severity === 'medium') return 'border-amber-400/20 bg-amber-500/10 text-amber-200';
  return 'border-white/10 bg-white/5 text-white/45';
}

function storageHealthClass(status: string): string {
  if (status === 'OK') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200';
  if (status === 'Warning') return 'border-amber-400/20 bg-amber-400/10 text-amber-200';
  return 'border-red-400/20 bg-red-400/10 text-red-200';
}

function StepIcon({ status }: { status: QualitySetupStepStatus }) {
  if (status === 'done') return <CheckCircle2 className="h-5 w-5 text-emerald-300" />;
  if (status === 'warning') return <AlertTriangle className="h-5 w-5 text-amber-300" />;
  return <XCircle className="h-5 w-5 text-red-300" />;
}

function cardsForRole(role: QualityWorkflowRole): WorkspaceCard[] {
  if (role === 'INSPECTOR' || role === 'OPERATOR') {
    return [
      { title: 'Shopfloor Entry', description: 'Fast mobile-first defect and inspection entry.', href: '/quality-shopfloor', icon: Smartphone },
      { title: 'My Inspection Runs', description: 'Review execution runs and open checks.', href: '/quality-execution-board', icon: ClipboardCheck },
      { title: 'Register Defect', description: 'Log a controlled defect record.', href: '/defect-log', icon: AlertTriangle },
      { title: 'My Feedback', description: 'Check audit feedback and quality signals.', href: '/quality-audits', icon: ShieldCheck },
    ];
  }
  if (role === 'QUALITY_ENGINEER' || role === 'PRODUCTION_ENGINEER') {
    return [
      { title: 'Execution Board', description: 'Monitor failed checks and plan compliance.', href: '/quality-execution-board', icon: BarChart3 },
      { title: 'Defect Log', description: 'Review, edit, and connect defect records.', href: '/defect-log', icon: AlertTriangle },
      { title: 'NCR', description: 'Escalate verified non-conformance records.', href: '/quality/records/ncr', icon: FileText },
      { title: 'Improvement Actions', description: 'Create and verify closed-loop actions.', href: '/quality-command-center', icon: Wrench },
      { title: 'Search Similar Cases', description: 'Search defects, actions, lessons, and relationships.', href: '/quality-search', icon: Search },
    ];
  }
  if (role === 'QUALITY_SUPERVISOR') {
    return [
      { title: 'Execution Board', description: 'Daily inspection execution and line status.', href: '/quality-execution-board', icon: BarChart3 },
      { title: 'Layered Audits', description: 'Audit evidence, failed checks, and standard work.', href: '/quality-audits', icon: ShieldCheck },
      { title: 'Pending Approvals', description: 'Open governance and review queue.', href: '/defect-log', icon: ClipboardCheck },
      { title: 'Overdue Actions', description: 'Focus on overdue action and verification work.', href: '/quality-command-center', icon: Wrench },
      { title: 'Line Status', description: 'Review line risk and compliance signals.', href: '/quality-execution-board', icon: Activity },
    ];
  }
  if (role === 'PLANT_MANAGER' || role === 'QUALITY_MANAGER') {
    return [
      { title: 'Command Center', description: 'Executive risk, workflow, data health, and reports.', href: '/quality-command-center', icon: ShieldCheck },
      { title: 'Management Report', description: 'Generate safe management summaries.', href: '/quality-command-center', icon: FileText },
      { title: 'Top Risks', description: 'Prioritize active quality risks from real records.', href: '/quality-command-center', icon: AlertTriangle },
      { title: 'Effectiveness', description: 'Review improvement results and follow-up.', href: '/quality-command-center', icon: Wrench },
      { title: 'COPQ / PPM / Outgoing', description: 'Open quality performance dashboards.', href: '/quality-dashboard', icon: BarChart3 },
    ];
  }
  return [
    { title: 'Master Data', description: 'Configure parts, models, defects, lines, and rules.', href: '/quality-master-data', icon: Database },
    { title: 'Form Designer', description: 'Design forms, lookups, formulas, and publishing.', href: '/quality-form-designer', icon: LayoutTemplate },
    { title: 'Inspection Plans', description: 'Build checksheets and inspection plans.', href: '/quality-inspection-plans', icon: ClipboardCheck },
    { title: 'Rules / SLA', description: 'Open workflow governance and settings.', href: '/defect-log', icon: ShieldCheck },
    { title: 'Backup / Sync', description: 'Export, restore, and review sync readiness.', href: '/quality-command-center', icon: Database },
  ];
}

export default function QualityHome() {
  const role = loadLocalWorkflowRole();
  const [defects, setDefects] = useState<DefectLogData[]>([]);
  const [setupRefresh, setSetupRefresh] = useState(0);
  const [pilotRefresh, setPilotRefresh] = useState(0);
  const [pilotIssueDraft, setPilotIssueDraft] = useState<Partial<QualityPilotIssue>>({
    module: 'Quality Home',
    title: '',
    description: '',
    severity: 'medium',
    relatedRoute: '/quality-home',
    suggestedFix: '',
  });
  const [persistenceDiagnostics, setPersistenceDiagnostics] = useState(() => getDefectPersistenceDiagnostics());
  const [persistenceCheck, setPersistenceCheck] = useState<DefectPersistenceSafetyCheck | null>(null);

  useEffect(() => {
    unifiedDefectLogApi.getAll()
      .then((response) => setDefects(response.data || []))
      .catch(() => setDefects([]));
  }, []);

  useEffect(() => {
    setPersistenceDiagnostics(getDefectPersistenceDiagnostics());
  }, [defects.length, setupRefresh, pilotRefresh]);

  const metrics = useMemo(() => {
    const masterData = loadAllQualityMasterTables();
    return {
      defects: defects.length,
      activeTemplates: loadQualityFormTemplates().filter((template) => template.status === 'active').length,
      activeInspectionPlans: loadQualityInspectionPlans().filter((plan) => plan.status === 'active').length,
      inspectionRuns: loadQualityInspectionRuns().length,
      auditRuns: loadQualityAuditRuns().length,
      openActions: loadImprovementActions().filter((action) => !['effective', 'closed', 'cancelled'].includes(action.status)).length,
      activeLessons: loadQualityKnowledgeBase().filter((item) => item.status === 'active').length,
      pendingSync: loadQualitySyncQueue().filter((item) => item.status === 'pending').length,
      masterRows: qualityMasterTableConfigs.reduce((sum, table) => sum + (masterData[table.id]?.length || 0), 0),
    };
  }, [defects.length]);

  const setupReport = useMemo(() => buildQualitySetupReadiness(defects), [defects, setupRefresh]);
  const pilotReport = useMemo(() => buildQualityPilotReadiness(defects, setupReport), [defects, pilotRefresh, setupReport]);

  const copySetupReport = async () => {
    const markdown = formatQualitySetupReportMarkdown(setupReport);
    try {
      await navigator.clipboard.writeText(markdown);
      recordQualitySetupEvent('setup-report-copy', setupReport.readinessLevel);
      setSetupRefresh((value) => value + 1);
      toast.success('Setup report copied', { description: 'The report includes readiness, health issues, and suggested fixes.' });
    } catch {
      toast.error('Copy failed', { description: 'Clipboard access is not available in this browser.' });
    }
  };

  const exportSetupMarkdown = () => {
    downloadTextFile(formatQualitySetupReportMarkdown(setupReport), `quality_setup_report_${new Date().toISOString().split('T')[0]}.md`);
    recordQualitySetupEvent('setup-report-export-markdown', setupReport.readinessLevel);
    setSetupRefresh((value) => value + 1);
    toast.success('Setup report exported', { description: 'Markdown report exported without raw dataset rows.' });
  };

  const exportSetupJson = () => {
    downloadJsonFile(
      {
        exportType: 'quality-setup-readiness-report',
        exportedAt: new Date().toISOString(),
        report: setupReport,
      },
      `quality_setup_report_${new Date().toISOString().split('T')[0]}.json`,
    );
    recordQualitySetupEvent('setup-report-export-json', setupReport.readinessLevel);
    setSetupRefresh((value) => value + 1);
    toast.success('Setup report exported', { description: 'JSON report exported without raw dataset rows.' });
  };

  const copyPilotReport = async () => {
    try {
      await navigator.clipboard.writeText(formatQualityPilotReadinessMarkdown(pilotReport));
      toast.success('Pilot readiness report copied', { description: 'Includes journey status, route health, usability review, and pilot issues.' });
    } catch {
      toast.error('Copy failed', { description: 'Clipboard access is not available in this browser.' });
    }
  };

  const exportPilotMarkdown = () => {
    downloadTextFile(formatQualityPilotReadinessMarkdown(pilotReport), `quality_pilot_readiness_${new Date().toISOString().split('T')[0]}.md`);
    toast.success('Pilot readiness report exported', { description: 'Markdown export excludes raw datasets.' });
  };

  const exportPilotJson = () => {
    downloadJsonFile(
      {
        exportType: 'quality-pilot-readiness-report',
        exportedAt: new Date().toISOString(),
        report: pilotReport,
      },
      `quality_pilot_readiness_${new Date().toISOString().split('T')[0]}.json`,
    );
    toast.success('Pilot readiness report exported', { description: 'JSON export excludes raw datasets.' });
  };

  const submitPilotIssue = () => {
    if (!pilotIssueDraft.title?.trim()) {
      toast.error('Pilot issue title is required');
      return;
    }
    createQualityPilotIssue(pilotIssueDraft);
    setPilotIssueDraft({
      module: 'Quality Home',
      title: '',
      description: '',
      severity: 'medium',
      relatedRoute: '/quality-home',
      suggestedFix: '',
    });
    setPilotRefresh((value) => value + 1);
    toast.success('Pilot issue logged', { description: 'Stored locally in qms_quality_pilot_issues_v1.' });
  };

  const runPersistenceCheck = async () => {
    try {
      const result = await runDefectPersistenceSafetyCheck();
      setPersistenceCheck(result);
      setPersistenceDiagnostics(getDefectPersistenceDiagnostics());
      if (result.consistent) {
        toast.success('Defect persistence check passed', { description: 'Local records, analytics hub, and latest backup are aligned.' });
      } else {
        toast.warning('Defect persistence check needs review', { description: result.warnings[0] || 'Review diagnostics before pilot use.' });
      }
    } catch (error) {
      toast.error('Persistence check failed', { description: error instanceof Error ? error.message : 'Unexpected local check error.' });
    }
  };

  const changePilotIssueStatus = (id: string, status: QualityPilotIssueStatus) => {
    updateQualityPilotIssueStatus(id, status);
    setPilotRefresh((value) => value + 1);
    toast.success('Pilot issue updated');
  };

  const roleCards = cardsForRole(role);
  const quickActions: WorkspaceCard[] = [
    { title: 'New Defect', description: 'Open recorder', href: '/defect-log', icon: AlertTriangle },
    { title: 'Start Inspection', description: 'Shopfloor entry', href: '/quality-shopfloor', icon: Smartphone },
    { title: 'Create Audit', description: 'Layered audit', href: '/quality-audits', icon: ShieldCheck },
    { title: 'Create Action', description: 'Command center', href: '/quality-command-center', icon: Wrench },
    { title: 'Search', description: 'Quality memory', href: '/quality-search', icon: Search },
    { title: 'Command Center', description: 'Management view', href: '/quality-command-center', icon: Brain },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Quality Workspace"
        subtitle="Role-based starting point for setup, shopfloor execution, defect lifecycle, intelligence, and governance"
      />

      <div className="space-y-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">Welcome to your quality workspace</h2>
              <p className="mt-1 text-sm text-white/45">Current local role: {roleLabel(role)}. Cards below are tailored to the work this role usually performs.</p>
            </div>
            <div className="rounded-2xl border border-[#00A3E0]/20 bg-[#00A3E0]/10 px-4 py-3 text-sm font-black text-[#8be3ff]">
              Offline-first / no backend required
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-9">
          {[
            ['Defects', metrics.defects],
            ['Master Rows', metrics.masterRows],
            ['Active Forms', metrics.activeTemplates],
            ['Plans', metrics.activeInspectionPlans],
            ['Runs', metrics.inspectionRuns],
            ['Audits', metrics.auditRuns],
            ['Open Actions', metrics.openActions],
            ['Lessons', metrics.activeLessons],
            ['Pending Sync', metrics.pendingSync],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/35">{label}</p>
              <p className="mt-2 text-2xl font-black text-white">{String(value)}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Data Persistence Diagnostics</p>
              <h2 className="mt-1 text-xl font-black text-white">Defect Records Storage Health</h2>
              <p className="mt-1 text-sm text-white/45">
                Tracks the protected local source used by Defect Log, dashboards, analytics, SPC, and prediction training.
              </p>
            </div>
            <button type="button" onClick={runPersistenceCheck} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-black text-white/70 hover:bg-white/10">
              <ShieldCheck className="h-4 w-4" /> Run Safety Check
            </button>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Records</p>
              <p className="mt-2 text-2xl font-black text-white">{persistenceDiagnostics.recordCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4 md:col-span-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Storage Key</p>
              <p className="mt-2 break-all text-sm font-black text-white">{persistenceDiagnostics.storageKey}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Latest Backup</p>
              <p className="mt-2 text-sm font-black text-white">{persistenceDiagnostics.latestBackupExists ? `${persistenceDiagnostics.latestBackupCount} record(s)` : 'Not yet'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Last Saved</p>
              <p className="mt-2 text-sm font-black text-white">{persistenceDiagnostics.lastSavedAt ? new Date(persistenceDiagnostics.lastSavedAt).toLocaleString() : 'Not recorded'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Health</p>
              <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-black ${storageHealthClass(persistenceDiagnostics.storageHealth)}`}>
                {persistenceDiagnostics.storageHealth}
              </span>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-4">
            <p className="text-xs font-black text-white/70">Migration / normalization status</p>
            <p className="mt-1 text-xs leading-5 text-white/45">{persistenceDiagnostics.lastMigrationStatus}</p>
            {persistenceDiagnostics.warnings.length > 0 && (
              <div className="mt-3 space-y-1">
                {persistenceDiagnostics.warnings.map((warning) => (
                  <p key={warning} className="text-xs text-amber-200">{warning}</p>
                ))}
              </div>
            )}
            {persistenceCheck && (
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
                {[
                  ['Local Count', persistenceCheck.localCount],
                  ['Analytics Source', persistenceCheck.analyticsSourceCount],
                  ['Filtered Analytics', persistenceCheck.analyticsFilteredCount],
                  ['Backup Count', persistenceCheck.backupCount],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-lg font-black text-white">{String(value)}</p>
                    <p className="text-[10px] text-white/35">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/35">System Readiness Score</p>
                <h2 className="mt-2 text-4xl font-black text-white">{setupReport.readinessScore}%</h2>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${readinessClass(setupReport.readinessLevel)}`}>
                {setupReport.readinessLevel}
              </span>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-black/30">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0066CC] to-emerald-400"
                style={{ width: `${setupReport.readinessScore}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-white/45">
              {setupReport.completedReadinessItems}/{setupReport.totalReadinessItems} readiness checks are complete using real local QMS data only.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                <p className="font-black text-white">{setupReport.summary.lookupMappings}</p>
                <p className="text-white/35">Lookup mappings</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                <p className="font-black text-white">{setupReport.summary.invalidFormulas}</p>
                <p className="text-white/35">Formula issues</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                <p className="font-black text-white">{setupReport.summary.commandCenterRealSignals}</p>
                <p className="text-white/35">Command signals</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                <p className="font-black text-white">{setupReport.summary.backupExports}</p>
                <p className="text-white/35">Backup exports</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black text-white">Guided Setup</h2>
                <p className="mt-1 text-sm text-white/45">Validate the setup-to-execution journey before rolling out the platform on the shopfloor.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={copySetupReport} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-white/70 hover:bg-white/10">
                  <Copy className="h-4 w-4" /> Copy Report
                </button>
                <button type="button" onClick={exportSetupMarkdown} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-white/70 hover:bg-white/10">
                  <Download className="h-4 w-4" /> Export MD
                </button>
                <button type="button" onClick={exportSetupJson} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-white/70 hover:bg-white/10">
                  <FileJson className="h-4 w-4" /> Export JSON
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {setupReport.guidedSteps.map((step: GuidedSetupStep) => (
                <div key={step.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <StepIcon status={step.status} />
                      <h3 className="text-sm font-black text-white">{step.title}</h3>
                    </div>
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${statusBadgeClass(step.status)}`}>
                      {step.status}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-white/45">{step.explanation}</p>
                  <p className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/55">{step.validationReason}</p>
                  <Link to={step.href} className="mt-3 inline-flex rounded-xl bg-[#0066CC] px-3 py-2 text-xs font-black text-white hover:bg-[#005BB8]">
                    {step.actionLabel}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-black text-white">End-to-End Journey Checklist</h2>
            <p className="mt-1 text-sm text-white/45">Completion is calculated from real local configuration, inspection runs, defects, actions, and knowledge records.</p>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {setupReport.journeys.map((journey) => {
                const completed = journey.items.filter((item) => item.done).length;
                const percent = Math.round((completed / Math.max(1, journey.items.length)) * 100);
                return (
                  <div key={journey.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-black text-white">{journey.title}</h3>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black text-white/50">{percent}%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/30">
                      <div className="h-full rounded-full bg-[#00A3E0]" style={{ width: `${percent}%` }} />
                    </div>
                    <div className="mt-4 space-y-2">
                      {journey.items.map((item) => (
                        <Link key={item.label} to={item.href} className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10">
                          {item.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />}
                          <span>
                            <span className="block text-xs font-black text-white/70">{item.label}</span>
                            <span className="mt-1 block text-[11px] leading-4 text-white/35">{item.reason}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-white">Cross-Module Health Checks</h2>
                <p className="mt-1 text-sm text-white/45">Issues show impact and a suggested next action.</p>
              </div>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-black text-white/45">
                {setupReport.healthIssues.length} open
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {setupReport.healthIssues.length === 0 ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <CheckCircle2 className="h-6 w-6 text-emerald-300" />
                  <p className="mt-3 text-sm font-black text-emerald-100">No cross-module setup issues detected.</p>
                  <p className="mt-1 text-xs text-emerald-100/60">Keep exporting backups after important configuration changes.</p>
                </div>
              ) : setupReport.healthIssues.slice(0, 8).map((issue) => (
                <div key={issue.id} className={`rounded-2xl border p-4 ${issue.severity === 'critical' ? 'border-red-400/20 bg-red-400/10' : 'border-amber-400/20 bg-amber-400/10'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-black text-white">{issue.issue}</h3>
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${issue.severity === 'critical' ? 'border-red-400/20 bg-red-500/10 text-red-200' : 'border-amber-400/20 bg-amber-500/10 text-amber-200'}`}>
                      {issue.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/55">Impact: {issue.impact}</p>
                  <p className="mt-2 text-xs leading-5 text-white/55">Suggested fix: {issue.suggestedFix}</p>
                  <Link to={issue.href} className="mt-3 inline-flex rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-white/70 hover:bg-white/10">
                    {issue.actionLabel}
                  </Link>
                </div>
              ))}
              {setupReport.healthIssues.length > 8 && (
                <p className="text-xs text-white/35">Showing the first 8 issues. Export the setup report to review the complete list.</p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Pilot Readiness</p>
              <h2 className="mt-1 text-2xl font-black text-white">Pilot Test Checklist & QA Validation Matrix</h2>
              <p className="mt-1 text-sm text-white/45">Use this before pilot rollout to confirm journeys, record feedback, and export a practical readiness report.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center rounded-full border px-3 py-2 text-xs font-black ${readinessClass(pilotReport.readinessLevel)}`}>
                {pilotReport.readinessLevel} / {pilotReport.readinessScore}%
              </span>
              <button type="button" onClick={copyPilotReport} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-white/70 hover:bg-white/10">
                <Copy className="h-4 w-4" /> Copy Pilot Report
              </button>
              <button type="button" onClick={exportPilotMarkdown} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-white/70 hover:bg-white/10">
                <Download className="h-4 w-4" /> Export MD
              </button>
              <button type="button" onClick={exportPilotJson} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-white/70 hover:bg-white/10">
                <FileJson className="h-4 w-4" /> Export JSON
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            {pilotReport.categories.map((category) => (
              <Link key={category.id} to={category.href} className="rounded-2xl border border-white/10 bg-black/10 p-4 hover:bg-white/10">
                <div className="flex items-center justify-between gap-2">
                  <StepIcon status={category.status} />
                  <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${statusBadgeClass(category.status)}`}>{category.status}</span>
                </div>
                <p className="mt-3 text-sm font-black text-white">{category.title}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/30">
                  <div className="h-full rounded-full bg-[#00A3E0]" style={{ width: `${category.score}%` }} />
                </div>
                <p className="mt-2 text-xs leading-5 text-white/40">{category.validationReason}</p>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
              <h3 className="text-xl font-black text-white">End-to-End Journey Test Checklist</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {pilotReport.journeyTests.map((journey) => (
                  <div key={journey.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-white">{journey.title}</p>
                        <p className="mt-1 text-xs text-white/35">{journey.validationReason}</p>
                      </div>
                      <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${statusBadgeClass(journey.status)}`}>{journey.status}</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {journey.checks.map((check) => (
                        <div key={check.label} className="rounded-xl border border-white/10 bg-black/10 p-3">
                          <div className="flex items-center gap-2">
                            <StepIcon status={check.status} />
                            <p className="text-xs font-black text-white/70">{check.label}</p>
                          </div>
                          <p className="mt-1 text-[11px] leading-4 text-white/35">{check.reason}</p>
                        </div>
                      ))}
                    </div>
                    <Link to={journey.href} className="mt-3 inline-flex rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-white/70 hover:bg-white/10">
                      Open Related Page
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
                <h3 className="text-xl font-black text-white">Pilot Issue Log</h3>
                <p className="mt-1 text-sm text-white/45">Log pilot feedback locally without creating demo data.</p>
                <div className="mt-4 space-y-3">
                  <input
                    value={pilotIssueDraft.module || ''}
                    onChange={(event) => setPilotIssueDraft((prev) => ({ ...prev, module: event.target.value }))}
                    placeholder="Module / page"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  />
                  <input
                    value={pilotIssueDraft.title || ''}
                    onChange={(event) => setPilotIssueDraft((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Issue title"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  />
                  <textarea
                    value={pilotIssueDraft.description || ''}
                    onChange={(event) => setPilotIssueDraft((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Description / observed behavior"
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  />
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <select
                      value={pilotIssueDraft.severity || 'medium'}
                      onChange={(event) => setPilotIssueDraft((prev) => ({ ...prev, severity: event.target.value as QualityPilotIssueSeverity }))}
                      className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
                    >
                      {(['low', 'medium', 'high', 'critical'] as QualityPilotIssueSeverity[]).map((severity) => (
                        <option key={severity} value={severity}>{severity}</option>
                      ))}
                    </select>
                    <input
                      value={pilotIssueDraft.relatedRoute || ''}
                      onChange={(event) => setPilotIssueDraft((prev) => ({ ...prev, relatedRoute: event.target.value }))}
                      placeholder="/related-route"
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                    />
                  </div>
                  <input
                    value={pilotIssueDraft.suggestedFix || ''}
                    onChange={(event) => setPilotIssueDraft((prev) => ({ ...prev, suggestedFix: event.target.value }))}
                    placeholder="Suggested fix"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  />
                  <button type="button" onClick={submitPilotIssue} className="inline-flex items-center gap-2 rounded-xl bg-[#0066CC] px-4 py-3 text-sm font-black text-white">
                    <Plus className="h-4 w-4" /> Log Pilot Issue
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {pilotReport.pilotIssues.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-white/40">No pilot issues logged yet.</div>
                  ) : pilotReport.pilotIssues.slice(0, 6).map((issue) => (
                    <div key={issue.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-white">{issue.title}</p>
                          <p className="mt-1 text-xs text-white/35">{issue.module} / {issue.relatedRoute}</p>
                        </div>
                        <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${severityBadgeClass(issue.severity)}`}>{issue.severity}</span>
                      </div>
                      {issue.description && <p className="mt-2 text-xs leading-5 text-white/45">{issue.description}</p>}
                      {issue.suggestedFix && <p className="mt-2 text-xs leading-5 text-white/55">Fix: {issue.suggestedFix}</p>}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <select
                          value={issue.status}
                          onChange={(event) => changePilotIssueStatus(issue.id, event.target.value as QualityPilotIssueStatus)}
                          className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white"
                        >
                          {(['open', 'in-progress', 'resolved', 'deferred'] as QualityPilotIssueStatus[]).map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        <Link to={issue.relatedRoute || '/quality-home'} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-white/70 hover:bg-white/10">
                          Open Page
                        </Link>
                      </div>
                    </div>
                  ))}
                  {pilotReport.pilotIssues.length > 6 && (
                    <p className="text-xs text-white/35">Showing latest 6 pilot issues. Export the pilot report for the full issue list.</p>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
                <h3 className="text-xl font-black text-white">Broken Link / Route Health</h3>
                <p className="mt-2 text-sm text-white/45">{pilotReport.routeHealth.validationReason}</p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    ['Missing routes', pilotReport.routeHealth.missingRouteWarnings.length],
                    ['Sidebar mismatches', pilotReport.routeHealth.sidebarMismatchWarnings.length],
                    ['Static nav mismatches', pilotReport.routeHealth.staticNavigationMismatchWarnings.length],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-lg font-black text-white">{String(value)}</p>
                      <p className="text-[10px] text-white/35">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
            <h3 className="text-xl font-black text-white">Usability Review Checklist</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="text-[10px] uppercase tracking-widest text-white/35">
                  <tr>
                    {['Page', 'Purpose', 'Next Action', 'Empty State', 'Quick Actions', 'Role Buttons', 'Wording', 'Note'].map((header) => (
                      <th key={header} className="px-3 py-2 text-left font-black">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pilotReport.usabilityReview.map((row) => (
                    <tr key={row.route} className="border-t border-white/5">
                      <td className="px-3 py-3">
                        <Link to={row.route} className="font-black text-[#8be3ff] hover:underline">{row.page}</Link>
                      </td>
                      {[row.clearPurpose, row.clearNextAction, row.emptyStateExists, row.quickActionsAvailable, row.roleButtonsClear].map((value, index) => (
                        <td key={`${row.route}-${index}`} className="px-3 py-3">
                          {value ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <AlertTriangle className="h-4 w-4 text-amber-300" />}
                        </td>
                      ))}
                      <td className="px-3 py-3">
                        <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${row.wordingOverload === 'controlled' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/20 bg-amber-400/10 text-amber-200'}`}>
                          {row.wordingOverload}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-white/45">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 text-xl font-black text-white">Quality Process Flow</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-9">
            {processFlow.map(([label, href], index) => (
              <Link key={label} to={href} className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm font-black text-white/70 hover:bg-white/10">
                <span className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0066CC] text-xs text-white">{index + 1}</span>
                <span className="block">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <h2 className="mb-4 text-xl font-black text-white">Recommended For {roleLabel(role)}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {roleCards.map(({ title, description, href, icon: Icon, badge }) => (
                <Link key={title} to={href} className={cardClass()}>
                  <Icon className="mb-4 h-7 w-7 text-[#00A3E0]" />
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-black text-white">{title}</h3>
                    {badge && <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black text-white/45">{badge}</span>}
                  </div>
                  <p className="mt-2 text-sm text-white/45">{description}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-xl font-black text-white">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map(({ title, description, href, icon: Icon }) => (
                <Link key={title} to={href} className="rounded-2xl border border-white/10 bg-black/10 p-4 hover:bg-white/10">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-[#00A3E0]" />
                    <div>
                      <p className="text-sm font-black text-white">{title}</p>
                      <p className="text-xs text-white/40">{description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
