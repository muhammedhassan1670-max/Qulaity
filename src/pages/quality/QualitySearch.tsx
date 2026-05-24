import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Bot, Copy, Download, FileJson, Link2, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer, PageHeader, PageSection } from '@/components/PageHeader';
import { SectionLoader } from '@/components/Loading';
import { QualityGuidedEmptyState } from '@/components/QualityGuidedEmptyState';
import QualityDashboardFilterBar from '@/components/QualityDashboardFilterBar';
import QualityAnalyticsConsistencyBadge from '@/components/QualityAnalyticsConsistencyBadge';
import { createQualityDataProvider, type QualityDataSnapshot } from '@/services/qualityDataProvider';
import {
  answerLocalQualityQuestion,
  applyKnowledgeFromSearchResult,
  createActionFromSearchResult,
  enqueueAssistantSummary,
  enqueueQualitySearchExport,
  generateQualitySearchSummary,
  loadQualitySearchApplyDashboardFilters,
  runUnifiedQualitySearch,
  saveQualitySearchApplyDashboardFilters,
  saveQualitySearchSettings,
  type LocalAssistantAnswer,
  type SearchSummary,
  type SearchSummaryMode,
  type UnifiedSearchResult,
} from '@/services/qualityUnifiedSearch';
import {
  buildLocalWorkflowUser,
  hasDefectPermission,
  loadLocalWorkflowRole,
} from '@/services/defectWorkflowGovernance';
import { enqueueQualitySyncItem } from '@/services/qualitySyncQueue';
import {
  loadQualityAnalyticsSnapshot,
  loadQualityDashboardFilters,
  type QualityAnalyticsSnapshot,
  type QualityDashboardFilters,
} from '@/services/qualityAnalyticsHub';

const examples = [
  'What are the top repeated defects this month?',
  'Which CAPAs are not effective?',
  'Show leakage issues related to charging joint.',
  'What lessons exist for welding defects?',
  'Which actions are overdue?',
  'Summarize customer returns.',
  'اعرض عيوب التسريب هذا الشهر',
];

function confidenceClass(confidence: string): string {
  if (confidence === 'Strong Signal') return 'bg-emerald-400/15 text-emerald-200 border-emerald-400/20';
  if (confidence === 'Moderate Signal') return 'bg-[#00A3E0]/15 text-[#8be3ff] border-[#00A3E0]/20';
  if (confidence === 'Weak Signal') return 'bg-amber-400/15 text-amber-200 border-amber-400/20';
  return 'bg-white/5 text-white/45 border-white/10';
}

function downloadText(text: string, fileName: string, type = 'text/markdown;charset=utf-8'): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function resultSummary(result: UnifiedSearchResult): string {
  return [
    `[${result.recordType}] ${result.title}`,
    result.status ? `Status: ${result.status}` : '',
    result.severity ? `Severity: ${result.severity}` : '',
    result.priority ? `Priority: ${result.priority}` : '',
    result.matchReason,
    result.dashboardFilterMatches.length ? `Dashboard filters: ${result.dashboardFilterMatches.join(', ')}` : '',
    result.relationshipContext.slice(0, 3).join(' '),
    result.knowledgeSuggestions.slice(0, 2).map((item) => `Knowledge: ${item.title} - ${item.suggestedFocus}`).join(' '),
  ].filter(Boolean).join('\n');
}

function blockedSearchAction(action: string, reason: string, result?: UnifiedSearchResult): void {
  enqueueQualitySyncItem({
    entityType: 'quality-search',
    entityId: result?.sourceId || `blocked-search-${Date.now()}`,
    operation: 'apply-search-result-action',
    status: 'failed',
    lastError: reason,
    payloadSummary: `Blocked search action "${action}"${result ? ` on ${result.recordType}:${result.sourceId}` : ''}: ${reason}`,
  });
}

export default function QualitySearch() {
  const [snapshot, setSnapshot] = useState<QualityDataSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [assistantAnswer, setAssistantAnswer] = useState<LocalAssistantAnswer | null>(null);
  const [summaryMode, setSummaryMode] = useState<SearchSummaryMode>('management');
  const [selectedRelationshipId, setSelectedRelationshipId] = useState('');
  const [filters, setFilters] = useState<QualityDashboardFilters>(() => loadQualityDashboardFilters());
  const [applyDashboardFilters, setApplyDashboardFilters] = useState(() => loadQualitySearchApplyDashboardFilters());
  const [analyticsSnapshot, setAnalyticsSnapshot] = useState<QualityAnalyticsSnapshot | null>(null);
  const workflowUser = useMemo(() => buildLocalWorkflowUser(null, loadLocalWorkflowRole()), []);
  const canCreateAction = hasDefectPermission(workflowUser, 'defect.edit') || hasDefectPermission(workflowUser, 'defect.createCapa');
  const canApplyKnowledge = hasDefectPermission(workflowUser, 'defect.edit');
  const canExport = hasDefectPermission(workflowUser, 'records.export');

  const loadSnapshot = async () => {
    setIsLoading(true);
    try {
      const provider = createQualityDataProvider('local');
      const [source, analytics] = await Promise.all([
        provider.loadSnapshot(),
        loadQualityAnalyticsSnapshot(filters),
      ]);
      setSnapshot(source);
      setAnalyticsSnapshot(analytics);
    } catch (error) {
      console.error('Quality Search failed to load:', error);
      toast.error('Quality Search load failed', { description: 'Could not read local QMS data.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSnapshot();
  }, [filters]);

  const search = useMemo(() => {
    if (!snapshot) return null;
    return runUnifiedQualitySearch(snapshot, lastQuery || query, {
      limit: 120,
      dashboardFilters: filters,
      applyDashboardFilters,
    });
  }, [snapshot, lastQuery, query, filters, applyDashboardFilters]);
  const hasLocalSearchData = useMemo(() => {
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

  const selectedRelationshipResult = useMemo(
    () => search?.results.find((result) => result.id === selectedRelationshipId) || null,
    [search, selectedRelationshipId],
  );

  const executeSearch = () => {
    setLastQuery(query);
    saveQualitySearchSettings({ lastQuery: query, lastSearchedAt: new Date().toISOString() });
    setAssistantAnswer(null);
  };

  const toggleDashboardFilters = (enabled: boolean) => {
    setApplyDashboardFilters(enabled);
    saveQualitySearchApplyDashboardFilters(enabled);
    toast.success(enabled ? 'Shared dashboard filters enabled' : 'Shared dashboard filters disabled', {
      description: enabled
        ? 'Search results will be narrowed only where entity fields support the filters.'
        : 'Search will run broadly across the local quality index.',
    });
  };

  const askAssistant = () => {
    if (!snapshot) return;
    const answer = answerLocalQualityQuestion(snapshot, query || lastQuery, {
      dashboardFilters: filters,
      applyDashboardFilters,
    });
    setAssistantAnswer(answer);
    enqueueAssistantSummary(answer);
    toast.success('Local assistant summary created', { description: 'Answer uses stored local QMS records only.' });
  };

  const buildSummary = (): SearchSummary | null => {
    if (!search) return null;
    return generateQualitySearchSummary({
      query: lastQuery || query,
      parsed: search.parsed,
      results: search.results,
      mode: summaryMode,
      assistant: assistantAnswer || undefined,
      filterSummary: search.filterSummary,
    });
  };

  const copySummary = async () => {
    const summary = buildSummary();
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary.markdown);
      toast.success('Search summary copied');
    } catch {
      toast.error('Copy failed', { description: 'Clipboard access is not available.' });
    }
  };

  const exportSummary = (format: 'json' | 'markdown') => {
    if (!canExport) {
      blockedSearchAction('search export', 'Requires records export permission.');
      toast.error('Export blocked', { description: 'Requires records export permission.' });
      return;
    }
    const summary = buildSummary();
    if (!summary) return;
    enqueueQualitySearchExport(summary);
    if (format === 'json') {
      downloadText(JSON.stringify(summary.json, null, 2), `quality_search_${summary.mode}_${new Date().toISOString().split('T')[0]}.json`, 'application/json;charset=utf-8');
    } else {
      downloadText(summary.markdown, `quality_search_${summary.mode}_${new Date().toISOString().split('T')[0]}.md`);
    }
    toast.success('Search summary exported', { description: 'Export contains summary and references, not raw datasets.' });
  };

  const createAction = async (result: UnifiedSearchResult) => {
    if (!canCreateAction) {
      blockedSearchAction('create improvement action', 'Current role cannot create actions from search results.', result);
      toast.error('Action blocked', { description: 'Current role cannot create actions from search results.' });
      return;
    }
    const created = createActionFromSearchResult(result);
    if (created.error) {
      toast.error('Action was not created', { description: created.error });
      return;
    }
    await loadSnapshot();
    toast.success('Improvement action draft created', { description: 'Review owner, due date, and verification method before use.' });
  };

  const applyKnowledge = async (result: UnifiedSearchResult) => {
    if (!canApplyKnowledge) {
      blockedSearchAction('apply knowledge', 'Current role cannot apply knowledge search results.', result);
      toast.error('Knowledge apply blocked');
      return;
    }
    const applied = applyKnowledgeFromSearchResult(result);
    if (!applied.applied) {
      toast.info(applied.message);
      return;
    }
    await loadSnapshot();
    toast.success('Knowledge reference applied', { description: 'Historical records were not changed.' });
  };

  const copyResult = async (result: UnifiedSearchResult) => {
    try {
      await navigator.clipboard.writeText(resultSummary(result));
      toast.success('Result summary copied');
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Unified Quality Search"
        subtitle="Explainable local search and assistant across real QMS records, relationships, and lessons learned"
      />

      <PageSection>
        {isLoading ? (
          <SectionLoader message="Indexing local quality records..." />
        ) : !snapshot || !search || !hasLocalSearchData ? (
          <QualityGuidedEmptyState
            title="No local search data available"
            purpose="Quality Search indexes real stored defects, NCRs, CAPAs, 8Ds, actions, relationships, knowledge, master data, and audit events."
            firstAction="Create a defect, lesson learned, or improvement action so the local search memory has records to retrieve."
            actionHref="/defect-log"
            actionLabel="Register Defect"
          />
        ) : (
          <div className="space-y-6">
            <QualityDashboardFilterBar value={filters} onChange={setFilters} compact />
            <QualityAnalyticsConsistencyBadge dashboardName="Quality Search" snapshot={analyticsSnapshot} compact />

            <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-white">Shared dashboard filters in search</p>
                <p className="text-xs text-white/40 mt-1">
                  When enabled, Quality Search applies the shared dashboard filters only to entity types that expose matching fields.
                </p>
              </div>
              <label className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-black text-white/70">
                <input
                  type="checkbox"
                  checked={applyDashboardFilters}
                  onChange={(event) => toggleDashboardFilters(event.target.checked)}
                  className="h-4 w-4 accent-[#00A3E0]"
                />
                Apply shared dashboard filters: {applyDashboardFilters ? 'On' : 'Off'}
              </label>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/10">
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto_auto] gap-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') executeSearch();
                    }}
                    placeholder="Ask or search: leakage this month, CAPA not effective, رقم الكود, مرتجعات..."
                    className="w-full rounded-xl bg-black/20 border border-white/10 pl-12 pr-4 py-4 text-white"
                  />
                </div>
                <button type="button" onClick={executeSearch} className="px-5 py-4 rounded-xl bg-[#0066CC] text-white text-sm font-black">
                  Search
                </button>
                <button type="button" onClick={askAssistant} className="px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white/75 text-sm font-black">
                  Ask Local Assistant
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {examples.map((example) => (
                  <button key={example} type="button" onClick={() => { setQuery(example); setLastQuery(example); }} className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-white/45 text-xs hover:text-white/80">
                    {example}
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/35 mt-3">Search is fully local. It does not use external AI APIs and does not create demo results.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
                  {[
                    ['Indexed Records', search.totalIndexed],
                    ['Before Filters', search.filterSummary.resultCountBeforeFilters],
                    ['Search Results', search.results.length],
                    ['Active Filters', search.filterSummary.activeFilters.length],
                    ['Parser Confidence', `${search.parsed.confidence}%`],
                    ['Relationship Links', search.results.reduce((sum, result) => sum + result.relatedRecords.length, 0)],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="glass-panel p-4 rounded-2xl border border-white/10">
                      <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">{String(label)}</p>
                      <p className="text-2xl font-black text-white mt-2">{String(value)}</p>
                    </div>
                  ))}
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h3 className="text-xl font-black text-white">Search Results</h3>
                    <span className={`px-3 py-1 rounded-full border text-xs font-black ${confidenceClass(search.parsed.confidenceLabel)}`}>
                      {search.parsed.confidenceLabel}
                    </span>
                  </div>
                  {search.results.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-black/10 p-8 text-center">
                      <AlertCircle className="w-10 h-10 text-white/10 mx-auto mb-3" />
                      <p className="text-sm text-white/35">No local records matched. Try a broader query or add real QMS records first.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {search.results.map((result) => (
                        <div key={result.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2 py-1 rounded bg-white/10 text-white/55 text-[10px] font-black uppercase">{result.recordType}</span>
                                <span className={`px-2 py-1 rounded border text-[10px] font-black ${confidenceClass(result.confidenceLabel)}`}>{result.confidenceLabel}</span>
                                {result.status && <span className="px-2 py-1 rounded bg-black/20 text-white/45 text-[10px] font-black">{result.status}</span>}
                              </div>
                              <h3 className="text-lg font-black text-white mt-2">{result.title}</h3>
                              <p className="text-xs text-white/45 mt-1 line-clamp-2">{result.summary || 'No summary available.'}</p>
                              <p className="text-xs text-[#8be3ff] mt-2">{result.matchReason}</p>
                              {result.matchedFields.length > 0 && (
                                <p className="text-[10px] text-white/35 mt-2">Matched fields: {result.matchedFields.join(', ')}</p>
                              )}
                              {result.dashboardFilterMatches.length > 0 && (
                                <p className="text-[10px] text-emerald-200/70 mt-2">Matched dashboard filters: {result.dashboardFilterMatches.join(', ')}</p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 lg:justify-end">
                              <Link to={result.openPath || '/quality-command-center'} className="px-3 py-2 rounded-lg bg-[#0066CC]/20 border border-[#0066CC]/25 text-[#8be3ff] text-xs font-black">
                                Open
                              </Link>
                              <button type="button" onClick={() => setSelectedRelationshipId(result.id)} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs font-black">
                                Relationships
                              </button>
                              <button type="button" onClick={() => createAction(result)} disabled={!canCreateAction} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs font-black disabled:opacity-40">
                                Create Action
                              </button>
                              {result.recordType === 'knowledge' && (
                                <button type="button" onClick={() => applyKnowledge(result)} disabled={!canApplyKnowledge} className="px-3 py-2 rounded-lg bg-emerald-400/10 border border-emerald-400/20 text-emerald-200 text-xs font-black disabled:opacity-40">
                                  Apply Knowledge
                                </button>
                              )}
                              <button type="button" onClick={() => copyResult(result)} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60" title="Copy summary">
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {(result.relationshipContext.length > 0 || result.knowledgeSuggestions.length > 0) && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
                              <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                                <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Relationship Context</p>
                                {result.relationshipContext.length === 0 ? (
                                  <p className="text-xs text-white/30">No relationship links registered.</p>
                                ) : result.relationshipContext.slice(0, 4).map((item) => (
                                  <p key={item} className="text-xs text-white/50">{item}</p>
                                ))}
                              </div>
                              <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                                <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Knowledge Suggestions</p>
                                {result.knowledgeSuggestions.length === 0 ? (
                                  <p className="text-xs text-white/30">No active knowledge suggestion found.</p>
                                ) : result.knowledgeSuggestions.map((item) => (
                                  <p key={item.id} className="text-xs text-white/50">{item.title}: {item.suggestedFocus}</p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass-panel p-5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <Bot className="w-5 h-5 text-[#00A3E0]" />
                    <h3 className="text-xl font-black text-white">Local Quality Assistant</h3>
                  </div>
                  {!assistantAnswer ? (
                    <div className="rounded-xl border border-white/10 bg-black/10 p-5 text-sm text-white/35">
                      Ask a question to get a concise answer based only on stored local QMS records.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <span className={`inline-flex px-3 py-1 rounded-full border text-xs font-black ${confidenceClass(assistantAnswer.confidenceLabel)}`}>{assistantAnswer.confidenceLabel}</span>
                      <p className="text-sm text-white/75 leading-relaxed">{assistantAnswer.answer}</p>
                      <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                        <p className="text-xs font-black text-white/50 uppercase tracking-widest">Suggested Focus</p>
                        <p className="text-xs text-[#8be3ff] mt-2">{assistantAnswer.suggestedFocus}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black text-white/50 uppercase tracking-widest mb-2">Data Limitations</p>
                        {assistantAnswer.dataLimitations.map((item) => <p key={item} className="text-xs text-white/45">{item}</p>)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-white/10">
                  <h3 className="text-xl font-black text-white mb-4">Query Interpretation</h3>
                  <div className="space-y-2">
                    {search.parsed.explanation.map((item) => (
                      <p key={item} className="text-xs text-white/50">{item}</p>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {search.parsed.detectedEntities.length === 0 ? (
                      <span className="text-xs text-white/30">No specific entities detected.</span>
                    ) : search.parsed.detectedEntities.map((entity) => (
                      <span key={entity} className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/45 text-[10px] font-black">{entity}</span>
                    ))}
                  </div>
                  <div className="mt-5 rounded-xl border border-white/10 bg-black/10 p-3">
                    <p className="text-xs font-black text-white/50 uppercase tracking-widest">Dashboard Filter Explanation</p>
                    <div className="mt-3 space-y-2 text-xs text-white/45">
                      <p>Filter toggle: {search.filterSummary.enabled ? 'On' : 'Off'}.</p>
                      <p>Results before / after filters: {search.filterSummary.resultCountBeforeFilters} / {search.filterSummary.resultCountAfterFilters}.</p>
                      <p>
                        Applied filters: {search.filterSummary.activeFilters.length
                          ? search.filterSummary.activeFilters.map((item) => `${item.label}=${item.value}`).join(', ')
                          : 'No active shared dashboard filters.'}
                      </p>
                      {search.filterSummary.ignoredFilters.length > 0 && (
                        <p>Ignored where not applicable: {search.filterSummary.ignoredFilters.slice(0, 6).join('; ')}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-white/10">
                  <h3 className="text-xl font-black text-white mb-4">Summary Generator</h3>
                  <select value={summaryMode} onChange={(event) => setSummaryMode(event.target.value as SearchSummaryMode)} className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-3 text-sm text-white">
                    <option value="management">Management summary</option>
                    <option value="technical">Technical summary</option>
                    <option value="action">Action-focused summary</option>
                    <option value="training">Training-focused summary</option>
                  </select>
                  <div className="grid grid-cols-1 gap-2 mt-3">
                    <button type="button" onClick={copySummary} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-black">
                      <Copy className="w-4 h-4" />
                      Copy Summary
                    </button>
                    <button type="button" onClick={() => exportSummary('markdown')} disabled={!canExport} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-black disabled:opacity-40">
                      <Download className="w-4 h-4" />
                      Export Markdown
                    </button>
                    <button type="button" onClick={() => exportSummary('json')} disabled={!canExport} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-black disabled:opacity-40">
                      <FileJson className="w-4 h-4" />
                      Export JSON
                    </button>
                  </div>
                  <p className="text-xs text-white/35 mt-3">Exports contain summaries and record references, not raw datasets.</p>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h3 className="text-xl font-black text-white">Selected Relationships</h3>
                    <button type="button" onClick={loadSnapshot} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  {!selectedRelationshipResult ? (
                    <p className="text-sm text-white/35">Select Relationships on a result card to inspect linked quality signals.</p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-black text-white">{selectedRelationshipResult.title}</p>
                      {selectedRelationshipResult.relatedRecords.length === 0 ? (
                        <p className="text-xs text-white/35">No relationship records are currently linked.</p>
                      ) : selectedRelationshipResult.relatedRecords.map((record) => (
                        <div key={`${record.type}-${record.id}`} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 p-3">
                          <Link2 className="w-4 h-4 text-[#00A3E0]" />
                          <span className="text-xs text-white/60">{record.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </PageSection>
    </PageContainer>
  );
}
