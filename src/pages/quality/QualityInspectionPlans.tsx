import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  BarChart3,
  CheckCircle2,
  Copy,
  Download,
  FileJson,
  Lock,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer, PageHeader } from '@/components/PageHeader';
import { QualityGuidedEmptyState } from '@/components/QualityGuidedEmptyState';
import { Button } from '@/components/ui/button';
import {
  QUALITY_INSPECTION_PLANS_KEY,
  QUALITY_INSPECTION_RUNS_KEY,
  archiveQualityInspectionPlan,
  buildInspectionAnalytics,
  canManageInspectionPlans,
  createBlankCheckItem,
  createBlankInspectionPlan,
  duplicateQualityInspectionPlan,
  exportQualityInspectionPlan,
  importQualityInspectionPlan,
  loadQualityInspectionPlans,
  loadQualityInspectionRuns,
  publishQualityInspectionPlan,
  rollbackQualityInspectionPlan,
  upsertQualityInspectionPlan,
  type QualityInspectionCheckItem,
  type QualityInspectionInputType,
  type QualityInspectionMethod,
  type QualityInspectionPlan,
} from '@/services/qualityInspectionPlans';
import { loadLocalWorkflowRole, roleLabel } from '@/services/defectWorkflowGovernance';
import { downloadJsonFile } from '@/services/qualityRepository';

const methods: QualityInspectionMethod[] = ['visual', 'measurement', 'functional', 'barcode', 'document', 'leak-test', 'performance-test'];
const inputTypes: QualityInspectionInputType[] = ['pass-fail', 'numeric', 'text', 'select', 'photo-required', 'checklist'];

function newSectionTitle(count: number): string {
  return `Section ${count + 1}`;
}

function statusClass(status: QualityInspectionPlan['status']): string {
  if (status === 'active') return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200';
  if (status === 'archived') return 'border-slate-400/20 bg-slate-500/10 text-slate-200';
  return 'border-amber-400/20 bg-amber-500/10 text-amber-200';
}

function text(value: unknown): string {
  return String(value ?? '');
}

function numberValue(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}

export default function QualityInspectionPlans() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const role = loadLocalWorkflowRole();
  const access = canManageInspectionPlans(role);
  const [plans, setPlans] = useState<QualityInspectionPlan[]>(() => loadQualityInspectionPlans(true));
  const [runs, setRuns] = useState(() => loadQualityInspectionRuns());
  const [selectedId, setSelectedId] = useState(() => plans[0]?.id || '');
  const [draft, setDraft] = useState<QualityInspectionPlan>(() => plans[0] || createBlankInspectionPlan());
  const [searchText, setSearchText] = useState('');
  const [sectionDraft, setSectionDraft] = useState('');

  const analytics = useMemo(() => buildInspectionAnalytics(runs, plans), [runs, plans]);
  const filteredPlans = useMemo(() => {
    const needle = searchText.trim().toLowerCase();
    return plans.filter((plan) => {
      const haystack = [
        plan.planName,
        plan.description,
        plan.productionLine,
        plan.inspectionPoint,
        plan.model,
        plan.partNumber,
        plan.status,
      ].join(' ').toLowerCase();
      return !needle || haystack.includes(needle);
    });
  }, [plans, searchText]);

  const refresh = (nextSelectedId?: string) => {
    const next = loadQualityInspectionPlans(true);
    setPlans(next);
    setRuns(loadQualityInspectionRuns());
    const selected = next.find((plan) => plan.id === (nextSelectedId || selectedId)) || next[0];
    if (selected) {
      setSelectedId(selected.id);
      setDraft(selected);
    }
  };

  const ensureAccess = () => {
    if (access.allowed) return true;
    toast.error('Inspection plan governance blocked', { description: access.reason });
    return false;
  };

  const updateDraft = (patch: Partial<QualityInspectionPlan>) => {
    setDraft((prev) => ({ ...prev, ...patch, updatedAt: new Date().toISOString() }));
  };

  const selectPlan = (plan: QualityInspectionPlan) => {
    setSelectedId(plan.id);
    setDraft(plan);
  };

  const createPlan = () => {
    if (!ensureAccess()) return;
    const created = upsertQualityInspectionPlan(createBlankInspectionPlan());
    refresh(created.id);
    toast.success('Inspection plan created', { description: `Stored locally in ${QUALITY_INSPECTION_PLANS_KEY}.` });
  };

  const savePlan = () => {
    if (!ensureAccess()) return;
    const saved = upsertQualityInspectionPlan(draft);
    refresh(saved.id);
    toast.success('Inspection plan saved', { description: 'The builder changes were saved locally.' });
  };

  const duplicatePlan = () => {
    if (!ensureAccess()) return;
    const copy = duplicateQualityInspectionPlan(draft.id);
    if (!copy) return;
    refresh(copy.id);
    toast.success('Inspection plan duplicated');
  };

  const publishPlan = () => {
    if (!ensureAccess()) return;
    if (draft.checkItems.length === 0) {
      toast.error('Cannot publish empty plan', { description: 'Add at least one check item before publishing.' });
      return;
    }
    const saved = upsertQualityInspectionPlan(draft, false);
    const published = publishQualityInspectionPlan(saved.id);
    if (!published) return;
    refresh(published.id);
    toast.success('Inspection plan published', { description: `Active version ${published.version} is available for shopfloor entry.` });
  };

  const archivePlan = () => {
    if (!ensureAccess()) return;
    const confirmed = window.confirm('Archive this inspection plan? Existing inspection runs will remain available.');
    if (!confirmed) return;
    const archived = archiveQualityInspectionPlan(draft.id);
    if (!archived) return;
    refresh(archived.id);
    toast.success('Inspection plan archived');
  };

  const rollbackPlan = (version: number) => {
    if (!ensureAccess()) return;
    const rolledBack = rollbackQualityInspectionPlan(draft.id, version);
    if (!rolledBack) return;
    refresh(rolledBack.id);
    toast.success('Inspection plan rolled back as draft', { description: `Snapshot v${version} was restored into a new draft version.` });
  };

  const addSection = () => {
    if (!ensureAccess()) return;
    const title = sectionDraft.trim() || newSectionTitle(draft.sections.length);
    if (draft.sections.some((section) => section.title.toLowerCase() === title.toLowerCase())) {
      toast.error('Section already exists');
      return;
    }
    updateDraft({
      sections: [...draft.sections, {
        id: `inspection-section-${Date.now()}`,
        title,
        order: draft.sections.length + 1,
      }],
    });
    setSectionDraft('');
  };

  const updateCheck = (id: string, patch: Partial<QualityInspectionCheckItem>) => {
    updateDraft({
      checkItems: draft.checkItems.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  };

  const addCheck = (section = draft.sections[0]?.title || 'General') => {
    if (!ensureAccess()) return;
    updateDraft({
      checkItems: [...draft.checkItems, createBlankCheckItem(section, draft.checkItems.length + 1)],
    });
  };

  const removeCheck = (id: string) => {
    if (!ensureAccess()) return;
    updateDraft({ checkItems: draft.checkItems.filter((item) => item.id !== id) });
  };

  const moveCheck = (id: string, direction: -1 | 1) => {
    const index = draft.checkItems.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= draft.checkItems.length) return;
    const next = [...draft.checkItems];
    [next[index], next[target]] = [next[target], next[index]];
    updateDraft({ checkItems: next.map((item, order) => ({ ...item, order: order + 1 })) });
  };

  const exportPlan = () => {
    downloadJsonFile(exportQualityInspectionPlan(draft), `inspection-plan-${draft.planName.replace(/\W+/g, '-') || draft.id}.json`);
    toast.success('Inspection plan exported', { description: 'Export includes plan metadata and check items, not inspection run records.' });
  };

  const importPlan = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!ensureAccess()) return;
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = importQualityInspectionPlan(JSON.parse(String(reader.result || '{}')));
        refresh(imported.id);
        toast.success('Inspection plan imported');
      } catch (error) {
        toast.error('Import failed', { description: error instanceof Error ? error.message : 'The JSON file could not be imported.' });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <PageContainer>
      <PageHeader
        title="Inspection Plan Builder"
        subtitle="Define model, line, part, and inspection-point checks for controlled shopfloor inspections"
      />

      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-[#00A3E0]" />
                <h2 className="text-xl font-black text-white">Builder Governance</h2>
              </div>
              <p className="mt-1 text-sm text-white/45">
                Current role: {roleLabel(role)}. {access.allowed ? 'You can manage inspection plans.' : access.reason}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={createPlan} disabled={!access.allowed} className="rounded-xl">
                <Plus className="mr-2 h-4 w-4" /> New Plan
              </Button>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={!access.allowed} className="rounded-xl">
                <Upload className="mr-2 h-4 w-4" /> Import JSON
              </Button>
              <Link to="/quality-shopfloor" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white/65">
                Open Shopfloor
              </Link>
              <Link to="/quality-execution-board" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white/65">
                Execution Board
              </Link>
              <Link to="/defect-log" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white/65">
                Related Defects
              </Link>
              <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={importPlan} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {[
            ['Total Inspections', analytics.totalInspections],
            ['Pass Rate', `${analytics.passRate}%`],
            ['Failed Checks', analytics.failedChecks],
            ['Defects from Checks', analytics.defectsCreatedFromChecks],
            ['Plan Compliance', `${analytics.planCompliance}%`],
            ['Incomplete', analytics.incompleteInspections],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <BarChart3 className="mb-3 h-4 w-4 text-[#00A3E0]" />
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</p>
              <p className="mt-1 text-2xl font-black text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
              <Search className="h-4 w-4 text-white/40" />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search plans..."
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none"
              />
            </div>
            {filteredPlans.length === 0 ? (
              <QualityGuidedEmptyState
                title="No inspection plans yet"
                purpose="Inspection plans turn model, line, part, and inspection-point requirements into mobile shopfloor checksheets."
                firstAction="Create a plan manually or import a plan JSON, then publish it before shopfloor execution."
                actionHref="/quality-inspection-plans"
                actionLabel="Create Plan"
              />
            ) : (
              <div className="space-y-2">
                {filteredPlans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => selectPlan(plan)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${selectedId === plan.id ? 'border-[#00A3E0]/40 bg-[#00A3E0]/10' : 'border-white/10 bg-black/10 hover:bg-white/10'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-white">{plan.planName}</p>
                        <p className="mt-1 text-xs text-white/40">{plan.productionLine || 'Any line'} / {plan.inspectionPoint || 'Any point'}</p>
                      </div>
                      <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${statusClass(plan.status)}`}>{plan.status}</span>
                    </div>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/30">v{plan.version} / {plan.checkItems.length} checks</p>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <main className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white">{draft.planName}</h2>
                  <p className="mt-1 text-sm text-white/45">
                    Stored locally. Shopfloor entry only loads active plans that match line/model/part/inspection point.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={savePlan} disabled={!access.allowed} className="rounded-xl"><Save className="mr-2 h-4 w-4" /> Save</Button>
                  <Button type="button" onClick={publishPlan} disabled={!access.allowed} className="rounded-xl"><CheckCircle2 className="mr-2 h-4 w-4" /> Publish</Button>
                  <Button type="button" variant="outline" onClick={duplicatePlan} disabled={!access.allowed} className="rounded-xl"><Copy className="mr-2 h-4 w-4" /> Duplicate</Button>
                  <Button type="button" variant="outline" onClick={exportPlan} className="rounded-xl"><Download className="mr-2 h-4 w-4" /> Export</Button>
                  <Button type="button" variant="outline" onClick={archivePlan} disabled={!access.allowed || draft.status === 'archived'} className="rounded-xl"><Archive className="mr-2 h-4 w-4" /> Archive</Button>
                </div>
              </div>

              {!access.allowed && (
                <div className="mb-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                  <Lock className="mr-2 inline h-4 w-4" />
                  Editing is disabled. {access.reason}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  ['planName', 'Plan Name', 'text'],
                  ['productionLine', 'Production Line', 'text'],
                  ['inspectionPoint', 'Inspection Point', 'text'],
                  ['model', 'Model', 'text'],
                  ['partNumber', 'Part Number', 'text'],
                  ['product', 'Product', 'text'],
                  ['factory', 'Factory', 'text'],
                  ['workshop', 'Workshop', 'text'],
                  ['supplier', 'Supplier', 'text'],
                  ['customer', 'Customer', 'text'],
                  ['effectiveDate', 'Effective Date', 'date'],
                ].map(([key, label, type]) => (
                  <label key={key} className="space-y-2">
                    <span className="text-xs font-black uppercase tracking-widest text-white/40">{label}</span>
                    <input
                      type={type}
                      value={text((draft as unknown as Record<string, unknown>)[key])}
                      onChange={(event) => updateDraft({ [key]: event.target.value } as Partial<QualityInspectionPlan>)}
                      disabled={!access.allowed}
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-[#00A3E0]/50 disabled:opacity-50"
                    />
                  </label>
                ))}
                <label className="space-y-2 md:col-span-3">
                  <span className="text-xs font-black uppercase tracking-widest text-white/40">Description</span>
                  <textarea
                    value={draft.description || ''}
                    onChange={(event) => updateDraft({ description: event.target.value })}
                    disabled={!access.allowed}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-[#00A3E0]/50 disabled:opacity-50"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-xl font-black text-white">Sections & Check Items</h3>
                  <p className="mt-1 text-sm text-white/45">Group checks by station section and define acceptance criteria for shopfloor use.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    value={sectionDraft}
                    onChange={(event) => setSectionDraft(event.target.value)}
                    placeholder="New section"
                    disabled={!access.allowed}
                    className="h-11 min-w-0 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white"
                  />
                  <Button type="button" variant="outline" onClick={addSection} disabled={!access.allowed} className="rounded-xl"><Plus className="mr-2 h-4 w-4" /> Section</Button>
                </div>
              </div>

              <div className="space-y-5">
                {draft.sections.map((section) => {
                  const sectionChecks = draft.checkItems.filter((item) => item.section === section.title).sort((a, b) => a.order - b.order);
                  return (
                    <div key={section.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <input
                          value={section.title}
                          onChange={(event) => updateDraft({
                            sections: draft.sections.map((item) => (item.id === section.id ? { ...item, title: event.target.value } : item)),
                            checkItems: draft.checkItems.map((item) => (item.section === section.title ? { ...item, section: event.target.value } : item)),
                          })}
                          disabled={!access.allowed}
                          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-lg font-black text-white"
                        />
                        <Button type="button" onClick={() => addCheck(section.title)} disabled={!access.allowed} className="rounded-xl">
                          <Plus className="mr-2 h-4 w-4" /> Add Check
                        </Button>
                      </div>

                      {sectionChecks.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-white/35">No checks in this section yet.</div>
                      ) : (
                        <div className="space-y-3">
                          {sectionChecks.map((item) => (
                            <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                              <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
                                <input
                                  value={item.checkCode}
                                  onChange={(event) => updateCheck(item.id, { checkCode: event.target.value })}
                                  disabled={!access.allowed}
                                  placeholder="Code"
                                  className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm font-bold text-white"
                                />
                                <input
                                  value={item.checkName}
                                  onChange={(event) => updateCheck(item.id, { checkName: event.target.value })}
                                  disabled={!access.allowed}
                                  placeholder="Check name"
                                  className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white lg:col-span-2"
                                />
                                <select
                                  value={item.inspectionMethod}
                                  onChange={(event) => updateCheck(item.id, { inspectionMethod: event.target.value as QualityInspectionMethod })}
                                  disabled={!access.allowed}
                                  className="rounded-lg border border-white/10 bg-[#1a1a1f] px-3 py-2 text-sm text-white"
                                >
                                  {methods.map((method) => <option key={method} value={method}>{method}</option>)}
                                </select>
                                <select
                                  value={item.inputType}
                                  onChange={(event) => updateCheck(item.id, { inputType: event.target.value as QualityInspectionInputType })}
                                  disabled={!access.allowed}
                                  className="rounded-lg border border-white/10 bg-[#1a1a1f] px-3 py-2 text-sm text-white"
                                >
                                  {inputTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                                </select>
                                <div className="flex gap-1">
                                  <button type="button" onClick={() => moveCheck(item.id, -1)} disabled={!access.allowed} className="rounded-lg border border-white/10 bg-white/5 px-3 text-white/60">↑</button>
                                  <button type="button" onClick={() => moveCheck(item.id, 1)} disabled={!access.allowed} className="rounded-lg border border-white/10 bg-white/5 px-3 text-white/60">↓</button>
                                  <button type="button" onClick={() => removeCheck(item.id)} disabled={!access.allowed} className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 text-red-200"><Trash2 className="h-4 w-4" /></button>
                                </div>
                              </div>
                              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                                <input value={item.standard || ''} onChange={(event) => updateCheck(item.id, { standard: event.target.value })} disabled={!access.allowed} placeholder="Standard" className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" />
                                <input value={item.acceptanceCriteria || ''} onChange={(event) => updateCheck(item.id, { acceptanceCriteria: event.target.value })} disabled={!access.allowed} placeholder="Acceptance criteria" className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" />
                                <input value={item.defectTypeIfNG || ''} onChange={(event) => updateCheck(item.id, { defectTypeIfNG: event.target.value })} disabled={!access.allowed} placeholder="Defect if NG" className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" />
                                <select value={item.severityIfNG || 'major'} onChange={(event) => updateCheck(item.id, { severityIfNG: event.target.value })} disabled={!access.allowed} className="rounded-lg border border-white/10 bg-[#1a1a1f] px-3 py-2 text-sm text-white">
                                  <option value="minor">minor</option>
                                  <option value="major">major</option>
                                  <option value="critical">critical</option>
                                </select>
                                <input type="number" value={numberValue(item.lowerSpecLimit)} onChange={(event) => updateCheck(item.id, { lowerSpecLimit: event.target.value === '' ? undefined : Number(event.target.value) })} disabled={!access.allowed} placeholder="LSL" className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" />
                                <input type="number" value={numberValue(item.targetValue)} onChange={(event) => updateCheck(item.id, { targetValue: event.target.value === '' ? undefined : Number(event.target.value) })} disabled={!access.allowed} placeholder="Target" className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" />
                                <input type="number" value={numberValue(item.upperSpecLimit)} onChange={(event) => updateCheck(item.id, { upperSpecLimit: event.target.value === '' ? undefined : Number(event.target.value) })} disabled={!access.allowed} placeholder="USL" className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" />
                                <input value={item.unit || ''} onChange={(event) => updateCheck(item.id, { unit: event.target.value })} disabled={!access.allowed} placeholder="Unit" className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" />
                                <textarea value={item.guidanceText || ''} onChange={(event) => updateCheck(item.id, { guidanceText: event.target.value })} disabled={!access.allowed} placeholder="Guidance text" rows={2} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white md:col-span-3" />
                                <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
                                  <input type="checkbox" checked={item.requiredEvidence || item.inputType === 'photo-required'} onChange={(event) => updateCheck(item.id, { requiredEvidence: event.target.checked })} disabled={!access.allowed} />
                                  Evidence required
                                </label>
                                <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
                                  <input type="checkbox" checked={item.isRequired} onChange={(event) => updateCheck(item.id, { isRequired: event.target.checked })} disabled={!access.allowed} />
                                  Required check
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="mb-4 flex items-center gap-3">
                <FileJson className="h-5 w-5 text-[#00A3E0]" />
                <h3 className="text-xl font-black text-white">Plan History & Storage</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-white/40">Plans Storage</p>
                  <p className="mt-1 text-sm font-bold text-white">{QUALITY_INSPECTION_PLANS_KEY}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-white/40">Runs Storage</p>
                  <p className="mt-1 text-sm font-bold text-white">{QUALITY_INSPECTION_RUNS_KEY}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-white/40">Published Version</p>
                  <p className="mt-1 text-sm font-bold text-white">v{draft.version} / {draft.status}</p>
                </div>
              </div>
              {(draft.history || []).length > 0 && (
                <div className="mt-4 space-y-2">
                  {(draft.history || []).slice().reverse().map((snapshot) => (
                    <div key={`${snapshot.version}-${snapshot.createdAt}`} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/10 p-3 md:flex-row md:items-center md:justify-between">
                      <p className="text-sm text-white/70">Version {snapshot.version} / {snapshot.status} / {new Date(snapshot.createdAt).toLocaleString()}</p>
                      <Button type="button" variant="outline" onClick={() => rollbackPlan(snapshot.version)} disabled={!access.allowed} className="rounded-xl">
                        <RefreshCw className="mr-2 h-4 w-4" /> Rollback as Draft
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {analytics.topFailedCheckItems.length > 0 && (
                <div className="mt-5">
                  <h4 className="mb-3 text-sm font-black uppercase tracking-widest text-white/40">Top Failed Check Items</h4>
                  <div className="space-y-2">
                    {analytics.topFailedCheckItems.map((item) => (
                      <div key={item.checkItemId} className="rounded-xl border border-white/10 bg-black/10 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-bold text-white">{item.checkName}</span>
                          <span className="text-sm font-black text-amber-200">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </PageContainer>
  );
}
