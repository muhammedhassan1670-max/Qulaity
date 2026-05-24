import { useEffect, useMemo, useState } from 'react';
import { Archive, BookOpen, Download, Lightbulb, Plus, RefreshCw, Save, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer, PageHeader, PageSection } from '@/components/PageHeader';
import { SectionLoader } from '@/components/Loading';
import { QualityGuidedEmptyState } from '@/components/QualityGuidedEmptyState';
import { QualityRelationshipManager } from '@/components/QualityRelationshipManager';
import QualityDashboardFilterBar from '@/components/QualityDashboardFilterBar';
import QualityAnalyticsConsistencyBadge from '@/components/QualityAnalyticsConsistencyBadge';
import { createQualityDataProvider, type QualityDataSnapshot } from '@/services/qualityDataProvider';
import {
  archiveQualityKnowledgeItem,
  blockedQualityKnowledgeAudit,
  buildStandardActionLibrary,
  buildTrainingSuggestions,
  createQualityKnowledgeItem,
  loadQualityKnowledgeBase,
  prefillKnowledgeFromAction,
  prefillKnowledgeFromDefect,
  updateQualityKnowledgeItem,
  type QualityKnowledgeItem,
  type QualityKnowledgeStatus,
  type QualityKnowledgeType,
} from '@/services/qualityKnowledgeBase';
import {
  buildLocalWorkflowUser,
  hasDefectPermission,
  loadLocalWorkflowRole,
} from '@/services/defectWorkflowGovernance';
import type { QualityRelationshipEntityType } from '@/services/qualityRelationships';
import {
  loadQualityAnalyticsSnapshot,
  loadQualityDashboardFilters,
  type QualityAnalyticsSnapshot,
  type QualityDashboardFilters,
} from '@/services/qualityAnalyticsHub';

const typeOptions: QualityKnowledgeType[] = ['lesson-learned', 'known-issue', 'best-practice', 'standard-action', 'inspection-alert', 'training-point'];
const statusOptions: QualityKnowledgeStatus[] = ['draft', 'active', 'archived'];

const emptyForm: Partial<QualityKnowledgeItem> = {
  title: '',
  type: 'lesson-learned',
  status: 'draft',
  sourceType: 'manual',
  problemSummary: '',
  tags: [],
  relatedDefectIds: [],
  relatedNcrIds: [],
  relatedCapaIds: [],
  relatedEightDIds: [],
  relatedActionIds: [],
};

function downloadJson(data: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function text(value: unknown): string {
  return String(value ?? '').trim();
}

function splitTags(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function confidenceClass(confidence?: string): string {
  if (confidence === 'Strong Signal') return 'bg-emerald-400/15 text-emerald-200 border-emerald-400/20';
  if (confidence === 'Moderate Signal') return 'bg-[#00A3E0]/15 text-[#8be3ff] border-[#00A3E0]/20';
  if (confidence === 'Weak Signal') return 'bg-amber-400/15 text-amber-200 border-amber-400/20';
  return 'bg-white/5 text-white/45 border-white/10';
}

export default function QualityKnowledgeBase() {
  const [items, setItems] = useState<QualityKnowledgeItem[]>([]);
  const [snapshot, setSnapshot] = useState<QualityDataSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | QualityKnowledgeType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | QualityKnowledgeStatus>('all');
  const [selectedId, setSelectedId] = useState<string>('');
  const [form, setForm] = useState<Partial<QualityKnowledgeItem>>(emptyForm);
  const [filters, setFilters] = useState<QualityDashboardFilters>(() => loadQualityDashboardFilters());
  const [analyticsSnapshot, setAnalyticsSnapshot] = useState<QualityAnalyticsSnapshot | null>(null);
  const workflowUser = useMemo(() => buildLocalWorkflowUser(null, loadLocalWorkflowRole()), []);
  const canEdit = hasDefectPermission(workflowUser, 'masterData.edit') || hasDefectPermission(workflowUser, 'rules.edit');
  const canExport = hasDefectPermission(workflowUser, 'records.export');

  const loadPage = async () => {
    setIsLoading(true);
    try {
      const provider = createQualityDataProvider('local');
      const data = await provider.loadSnapshot();
      const analytics = await loadQualityAnalyticsSnapshot(filters);
      const rows = loadQualityKnowledgeBase(true);
      setSnapshot(data);
      setAnalyticsSnapshot(analytics);
      setItems(rows);
      if (!selectedId && rows[0]) {
        setSelectedId(rows[0].id);
        setForm(rows[0]);
      }
    } catch (error) {
      console.error('Knowledge base load failed:', error);
      toast.error('Knowledge base load failed', { description: 'Could not read local knowledge records.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, [filters]);

  const selected = useMemo(() => items.find((item) => item.id === selectedId) || null, [items, selectedId]);
  const relationshipSourceType = useMemo<QualityRelationshipEntityType | null>(() => {
    if (!selected?.sourceId) return null;
    return ['defect', 'ncr', 'capa', 'eightD', 'improvement-action'].includes(selected.sourceType)
      ? selected.sourceType as QualityRelationshipEntityType
      : null;
  }, [selected]);
  const standardLibrary = useMemo(() => buildStandardActionLibrary(items), [items]);
  const trainingSuggestions = useMemo(() => buildTrainingSuggestions(items), [items]);

  const filtered = useMemo(() => {
    const activeQuery = query.trim().toLowerCase();
    return items
      .filter((item) => typeFilter === 'all' || item.type === typeFilter)
      .filter((item) => statusFilter === 'all' || item.status === statusFilter)
      .filter((item) => !filters.productionLine || text(item.productionLine).toLowerCase().includes(filters.productionLine.toLowerCase()))
      .filter((item) => !filters.model || text(item.model).toLowerCase().includes(filters.model.toLowerCase()))
      .filter((item) => !filters.partNumber || text(item.partNumber).toLowerCase().includes(filters.partNumber.toLowerCase()))
      .filter((item) => !filters.defectType || text(item.defectType).toLowerCase().includes(filters.defectType.toLowerCase()))
      .filter((item) => !filters.severity || text(item.severity).toLowerCase().includes(filters.severity.toLowerCase()))
      .filter((item) => !filters.supplier || text(item.supplier).toLowerCase().includes(filters.supplier.toLowerCase()))
      .filter((item) => !filters.customer || text(item.customer).toLowerCase().includes(filters.customer.toLowerCase()))
      .filter((item) => {
        if (!activeQuery) return true;
        return [
          item.id,
          item.title,
          item.type,
          item.status,
          item.defectType,
          item.defectCategory,
          item.productionLine,
          item.model,
          item.partNumber,
          item.supplier,
          item.customer,
          item.severity,
          item.problemSummary,
          item.historicalPattern,
          item.tags.join(' '),
        ].join(' ').toLowerCase().includes(activeQuery);
      });
  }, [filters, items, query, typeFilter, statusFilter]);

  const updateForm = (patch: Partial<QualityKnowledgeItem>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const startNew = () => {
    setSelectedId('');
    setForm(emptyForm);
  };

  const selectItem = (item: QualityKnowledgeItem) => {
    setSelectedId(item.id);
    setForm(item);
  };

  const saveItem = async () => {
    if (!canEdit) {
      blockedQualityKnowledgeAudit(selectedId ? 'update knowledge' : 'create knowledge', 'Requires master data or rules edit permission.', selectedId || 'new-knowledge');
      toast.error('Knowledge action blocked', { description: 'Requires master data or rules edit permission.' });
      return;
    }
    if (!form.title?.trim() || !form.problemSummary?.trim()) {
      toast.error('Title and problem summary are required');
      return;
    }
    if (selectedId) {
      updateQualityKnowledgeItem(selectedId, {
        ...form,
        tags: Array.isArray(form.tags) ? form.tags : [],
      });
      toast.success('Knowledge item updated');
    } else {
      const created = createQualityKnowledgeItem({
        ...form,
        tags: Array.isArray(form.tags) ? form.tags : [],
      });
      setSelectedId(created.id);
      toast.success('Knowledge item created', { description: 'Stored locally and added to the sync queue.' });
    }
    await loadPage();
  };

  const archiveItem = async () => {
    if (!selectedId) return;
    if (!canEdit) {
      blockedQualityKnowledgeAudit('archive knowledge', 'Requires master data or rules edit permission.', selectedId);
      toast.error('Knowledge archive blocked');
      return;
    }
    const confirmed = window.confirm('Archive this knowledge item? It will no longer appear as an active suggestion.');
    if (!confirmed) return;
    archiveQualityKnowledgeItem(selectedId);
    setSelectedId('');
    setForm(emptyForm);
    await loadPage();
    toast.success('Knowledge item archived');
  };

  const exportKnowledge = () => {
    if (!canExport) {
      blockedQualityKnowledgeAudit('export knowledge', 'Requires records export permission.');
      toast.error('Export blocked', { description: 'Requires records export permission.' });
      return;
    }
    downloadJson({
      exportType: 'quality-knowledge-base',
      exportedAt: new Date().toISOString(),
      storageKey: 'qms_quality_knowledge_base_v1',
      items,
    }, `quality_knowledge_base_${new Date().toISOString().split('T')[0]}.json`);
    toast.success('Knowledge base exported', { description: 'Export contains knowledge records only, not raw defect datasets.' });
  };

  const createFromClosedDefect = async () => {
    const defect = snapshot?.defectRecords.find((record) => String(record.status || '').toLowerCase() === 'closed') || snapshot?.defectRecords[0];
    if (!defect) {
      toast.info('No defect records available to prefill a lesson.');
      return;
    }
    setSelectedId('');
    setForm({ ...emptyForm, ...prefillKnowledgeFromDefect(defect) });
    toast.success('Lesson draft prepared from a real defect record');
  };

  const createFromEffectiveAction = async () => {
    const action = snapshot?.improvementActions.find((item) => item.status === 'effective' || item.status === 'closed' || item.effectivenessResult === 'Effective') || snapshot?.improvementActions[0];
    if (!action) {
      toast.info('No improvement actions available to prefill a lesson.');
      return;
    }
    setSelectedId('');
    setForm({ ...emptyForm, ...prefillKnowledgeFromAction(action, snapshot?.defectRecords || []) });
    toast.success('Lesson draft prepared from a real improvement action');
  };

  return (
    <PageContainer>
      <PageHeader
        title="Quality Knowledge Base"
        subtitle="Reusable lessons learned, known issues, standard actions, and training points from verified quality records"
      />

      <PageSection>
        {isLoading ? (
          <SectionLoader message="Loading local quality knowledge..." />
        ) : (
          <div className="space-y-6">
            <QualityDashboardFilterBar value={filters} onChange={setFilters} compact />
            <QualityAnalyticsConsistencyBadge dashboardName="Quality Knowledge Base" snapshot={analyticsSnapshot} compact />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
              {[
                ['Knowledge Items', items.length],
                ['Active Lessons', items.filter((item) => item.status === 'active' && item.type === 'lesson-learned').length],
                ['Known Issues', items.filter((item) => item.type === 'known-issue').length],
                ['Standard Actions', standardLibrary.length],
                ['Training Points', trainingSuggestions.length],
                ['Feedback Score', items.reduce((sum, item) => sum + Number(item.feedbackScore || 0), 0)],
              ].map(([label, value]) => (
                <div key={String(label)} className="glass-panel p-4 rounded-2xl border border-white/10">
                  <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">{label}</p>
                  <p className="text-2xl font-black text-white mt-2">{Number(value).toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col xl:flex-row gap-3">
              <button type="button" onClick={startNew} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0066CC] text-white text-sm font-black">
                <Plus className="w-4 h-4" />
                New Knowledge Item
              </button>
              <button type="button" onClick={createFromClosedDefect} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-black">
                <BookOpen className="w-4 h-4" />
                Create from Defect
              </button>
              <button type="button" onClick={createFromEffectiveAction} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-black">
                <Lightbulb className="w-4 h-4" />
                Create from Effective Action
              </button>
              <button type="button" onClick={exportKnowledge} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-black">
                <Download className="w-4 h-4" />
                Export Knowledge
              </button>
              <button type="button" onClick={loadPage} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-black">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-6">
              <div className="glass-panel p-5 rounded-2xl border border-white/10">
                <div className="grid grid-cols-1 gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search lessons, defects, lines, models, parts, tags..."
                      className="w-full rounded-xl bg-black/20 border border-white/10 pl-10 pr-3 py-3 text-sm text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as 'all' | QualityKnowledgeType)} className="rounded-xl bg-black/20 border border-white/10 px-3 py-3 text-sm text-white">
                      <option value="all">All Types</option>
                      {typeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | QualityKnowledgeStatus)} className="rounded-xl bg-black/20 border border-white/10 px-3 py-3 text-sm text-white">
                      <option value="all">All Statuses</option>
                      {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                </div>

                <div className="mt-4 space-y-3 max-h-[700px] overflow-auto pr-1">
                  {filtered.length === 0 ? (
                    <QualityGuidedEmptyState
                      title="No knowledge records yet"
                      purpose="The Knowledge Base stores verified lessons learned, known issues, standard actions, inspection alerts, and training points from real closed-loop cases."
                      firstAction="Create a lesson from a closed defect or effective improvement action when one is available."
                      actionHref="/quality-command-center"
                      actionLabel="Open Command Center"
                    />
                  ) : filtered.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectItem(item)}
                      className={`w-full text-left rounded-xl border p-4 transition-all ${selectedId === item.id ? 'border-[#00A3E0]/40 bg-[#0066CC]/15' : 'border-white/10 bg-black/10 hover:bg-white/10'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-white">{item.title}</p>
                          <p className="text-xs text-white/40 mt-1">{item.type} | {item.status}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full border text-[10px] font-black ${confidenceClass(item.confidenceLabel)}`}>{item.confidenceLabel || 'Insufficient Data'}</span>
                      </div>
                      <p className="text-xs text-white/35 mt-2 line-clamp-2">{item.problemSummary || 'No summary yet'}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-5">
                    <div>
                      <h3 className="text-xl font-black text-white">{selected ? 'Knowledge Detail' : 'New Knowledge Item'}</h3>
                      <p className="text-xs text-white/40 mt-1">Use safe wording: suggested reference, requires verification, historically effective action.</p>
                    </div>
                    {!canEdit && <span className="px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-200 text-xs font-black">Read only for current role</span>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="space-y-1 md:col-span-2">
                      <span className="text-xs text-white/45 font-bold">Title</span>
                      <input value={form.title || ''} onChange={(event) => updateForm({ title: event.target.value })} className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-3 text-sm text-white" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs text-white/45 font-bold">Type</span>
                      <select value={form.type || 'lesson-learned'} onChange={(event) => updateForm({ type: event.target.value as QualityKnowledgeType })} className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-3 text-sm text-white">
                        {typeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs text-white/45 font-bold">Status</span>
                      <select value={form.status || 'draft'} onChange={(event) => updateForm({ status: event.target.value as QualityKnowledgeStatus })} className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-3 text-sm text-white">
                        {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </label>
                    {[
                      ['defectType', 'Defect Type'],
                      ['defectCategory', 'Defect Category'],
                      ['productionLine', 'Production Line'],
                      ['model', 'Model'],
                      ['partNumber', 'Part Number'],
                      ['supplier', 'Supplier'],
                      ['customer', 'Customer'],
                      ['severity', 'Severity'],
                    ].map(([key, label]) => (
                      <label key={key} className="space-y-1">
                        <span className="text-xs text-white/45 font-bold">{label}</span>
                        <input value={text(form[key as keyof QualityKnowledgeItem])} onChange={(event) => updateForm({ [key]: event.target.value })} className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-3 text-sm text-white" />
                      </label>
                    ))}
                    <label className="space-y-1 md:col-span-2">
                      <span className="text-xs text-white/45 font-bold">Problem Summary</span>
                      <textarea value={form.problemSummary || ''} onChange={(event) => updateForm({ problemSummary: event.target.value })} rows={3} className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-3 text-sm text-white" />
                    </label>
                    <label className="space-y-1 md:col-span-2">
                      <span className="text-xs text-white/45 font-bold">Historical Pattern</span>
                      <textarea value={form.historicalPattern || ''} onChange={(event) => updateForm({ historicalPattern: event.target.value })} rows={2} className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-3 text-sm text-white" />
                    </label>
                    <label className="space-y-1 md:col-span-2">
                      <span className="text-xs text-white/45 font-bold">Effective Actions</span>
                      <textarea value={form.effectiveActions || ''} onChange={(event) => updateForm({ effectiveActions: event.target.value })} rows={2} className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-3 text-sm text-white" />
                    </label>
                    {[
                      ['recommendedContainment', 'Recommended Containment'],
                      ['recommendedVerification', 'Recommended Verification'],
                      ['recommendedCorrectiveAction', 'Recommended Corrective Action'],
                      ['recommendedPreventiveAction', 'Recommended Preventive Action'],
                      ['inspectionStandardUpdate', 'Inspection Standard Update'],
                      ['trainingNeed', 'Training Need'],
                    ].map(([key, label]) => (
                      <label key={key} className="space-y-1 md:col-span-2">
                        <span className="text-xs text-white/45 font-bold">{label}</span>
                        <textarea value={text(form[key as keyof QualityKnowledgeItem])} onChange={(event) => updateForm({ [key]: event.target.value })} rows={2} className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-3 text-sm text-white" />
                      </label>
                    ))}
                    <label className="space-y-1 md:col-span-2">
                      <span className="text-xs text-white/45 font-bold">Tags, comma separated</span>
                      <input value={(form.tags || []).join(', ')} onChange={(event) => updateForm({ tags: splitTags(event.target.value) })} className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-3 text-sm text-white" />
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-5">
                    <button type="button" onClick={saveItem} disabled={!canEdit} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0066CC] text-white text-sm font-black disabled:opacity-40">
                      <Save className="w-4 h-4" />
                      Save Knowledge
                    </button>
                    {selected && (
                      <button type="button" onClick={archiveItem} disabled={!canEdit} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-400/10 border border-red-400/20 text-red-200 text-sm font-black disabled:opacity-40">
                        <Archive className="w-4 h-4" />
                        Archive
                      </button>
                    )}
                  </div>
                </div>

                {selected && relationshipSourceType && (
                  <QualityRelationshipManager
                    currentType={relationshipSourceType}
                    currentId={selected.sourceId || selected.id}
                    currentLabel={`Knowledge source for ${selected.title}`}
                    canManage={canEdit}
                    disabledReason="Requires knowledge edit permission to link or unlink source records."
                    onChanged={loadPage}
                  />
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="glass-panel p-5 rounded-2xl border border-white/10">
                    <h3 className="text-lg font-black text-white mb-4">Standard Action Library</h3>
                    {standardLibrary.length === 0 ? (
                      <p className="text-sm text-white/35">No active standard actions yet.</p>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-auto pr-1">
                        {standardLibrary.map((entry) => (
                          <div key={entry.key} className="rounded-xl border border-white/10 bg-black/10 p-4">
                            <p className="text-sm font-black text-white">{entry.defectTypeOrCategory}</p>
                            <p className="text-xs text-[#8be3ff] mt-2">{entry.recommendedVerification}</p>
                            <p className="text-xs text-white/40 mt-1">{entry.trainingRecommendation}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="glass-panel p-5 rounded-2xl border border-white/10">
                    <h3 className="text-lg font-black text-white mb-4">Training Points</h3>
                    {trainingSuggestions.length === 0 ? (
                      <p className="text-sm text-white/35">No training points have been marked yet.</p>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-auto pr-1">
                        {trainingSuggestions.map((item) => (
                          <div key={item.topic} className="rounded-xl border border-white/10 bg-black/10 p-4">
                            <p className="text-sm font-black text-white">{item.topic}</p>
                            <p className="text-xs text-white/45 mt-1">{item.reason}</p>
                            <p className="text-xs text-amber-200 mt-2">Audience: {item.suggestedAudience}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </PageSection>
    </PageContainer>
  );
}
