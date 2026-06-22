// QMS Enterprise 4.0 - 8D Report Page - Professional Edition
import { useState, useEffect, useMemo } from 'react';
import { PageHeader, PageContainer, PageSection, StatsBar } from '../../components/PageHeader';
import DynamicFormRenderer from '../../components/DynamicFormRenderer';
import { DataTable } from '../../components/DataTable';
import { FilterPanel } from '../../components/FilterPanel';
import { BulkActionBar } from '../../components/BulkActionBar';
import { StatusBadge } from '../../components/StatusBadge';
import { toast } from 'sonner';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter,
  User,
  X,
  Edit3,
  Eye,
  Target,
  ShieldAlert,
  FileText,
  Activity
} from 'lucide-react';
import { 
  unifiedEightDApi as eightDApi,
  unifiedCapaApi,
  unifiedNcrApi,
} from '../../api/unified-api';
import { RelatedRecords } from '../../components/RelatedRecords';
import QualityRelationshipManager from '@/components/QualityRelationshipManager';
import QualityKnowledgeSuggestions from '@/components/QualityKnowledgeSuggestions';
import { exportData, prepareDataForExport } from '../../utils/exportUtils';
import {
  createImprovementAction,
  loadImprovementActions,
  type QualityImprovementAction,
} from '@/services/qualityImprovementActions';
import { buildClosedLoopSourceLinks } from '@/services/qualityClosedLoopIntegration';
import { enqueueQualitySyncItem } from '@/services/qualitySyncQueue';
import { buildKnowledgeContextFromSource } from '@/services/qualityKnowledgeBase';
import type { CapaData, DefectLogData, EightDData, NcrData } from '@/api/unified-api';
import {
  buildLocalWorkflowUser,
  hasDefectPermission,
  loadLocalWorkflowRole,
} from '@/services/defectWorkflowGovernance';
import { loadSafeLocalDefectRecords } from '@/services/safeDefectStorage';

interface D8Report {
  id: string;
  eightDNumber: string;
  symptomDescription: string;
  emergencyResponse: string;
  dateDetected: string;
  teamLeader: string;
  teamMembers: string[];
  department: string;
  champion?: string;
  problemTitle: string;
  productName: string;
  productionLine?: string;
  lotNumber?: string;
  problemDescription: string;
  customerImpact?: string;
  immediateAction: string;
  containmentResponsible: string;
  containmentDate: string;
  quantityContained?: number;
  analysisMethod: '5why' | 'fishbone' | 'fmea' | 'fault-tree' | 'pareto' | 'scatter';
  whyAnalysis?: string;
  fishboneAnalysis?: string;
  rootCauseDescription: string;
  correctiveActionDesc: string;
  correctiveResponsible: string;
  targetDateCorrective: string;
  implementationDate?: string;
  validationResults?: string;
  effectivenessCheck: 'pending' | 'effective' | 'ineffective';
  preventiveActionPlan?: string;
  lessonsLearned?: string;
  status: 'd0' | 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6' | 'd7' | 'd8' | 'closed';
  closureDate?: string;
  [key: string]: unknown;
}

const mock8Ds: D8Report[] = [];

function generate8DNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `8D-${year}-${random}`;
}

const analysisMethodConfig = {
  '5why': { color: 'bg-blue-500/20 text-blue-400', label: '5 Why' },
  'fishbone': { color: 'bg-cyan-500/20 text-cyan-400', label: 'Fishbone' },
  'fmea': { color: 'bg-purple-500/20 text-purple-400', label: 'FMEA' },
  'fault-tree': { color: 'bg-red-500/20 text-red-400', label: 'Fault Tree' },
  'pareto': { color: 'bg-orange-500/20 text-orange-400', label: 'Pareto' },
  'scatter': { color: 'bg-green-500/20 text-green-400', label: 'Scatter' }
};

const effectivenessConfig = {
  'pending': { color: 'bg-yellow-500/20 text-yellow-400', label: 'Pending' },
  'effective': { color: 'bg-green-500/20 text-green-400', label: 'Effective' },
  'ineffective': { color: 'bg-red-500/20 text-red-400', label: 'Ineffective' }
};

const dSteps = [
  { key: 'd0', label: 'D0: Plan', color: 'bg-gray-500' },
  { key: 'd1', label: 'D1: Team', color: 'bg-blue-500' },
  { key: 'd2', label: 'D2: Problem', color: 'bg-cyan-500' },
  { key: 'd3', label: 'D3: Containment', color: 'bg-yellow-500' },
  { key: 'd4', label: 'D4: Root Cause', color: 'bg-orange-500' },
  { key: 'd5', label: 'D5: Actions', color: 'bg-purple-500' },
  { key: 'd6', label: 'D6: Implement', color: 'bg-pink-500' },
  { key: 'd7', label: 'D7: Prevent', color: 'bg-teal-500' },
  { key: 'd8', label: 'D8: Congratulate', color: 'bg-green-500' },
  { key: 'closed', label: 'Closed', color: 'bg-emerald-500' }
];

export function D8Page() {
  const [reports, setReports] = useState<D8Report[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});
  const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<D8Report | null>(null);
  const [defectRecords, setDefectRecords] = useState<DefectLogData[]>([]);
  const [improvementActions, setImprovementActions] = useState<QualityImprovementAction[]>([]);
  const [linkedNcrs, setLinkedNcrs] = useState<NcrData[]>([]);
  const [linkedCapas, setLinkedCapas] = useState<CapaData[]>([]);

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const workflowUser = buildLocalWorkflowUser(null, loadLocalWorkflowRole());

  const createPrefill = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const title = params.get('title');
    const description = params.get('description');
    const open = params.get('create') === '1' || !!title || !!description;

    return {
      open,
      values: {
        problemTitle: title ?? undefined,
        problemDescription: description ?? undefined,
      } satisfies Record<string, unknown>,
    };
  }, [location.search]);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const [response, ncrResponse, capaResponse] = await Promise.all([
        eightDApi.getAll(),
        unifiedNcrApi.getAll().catch(() => ({ data: [] as NcrData[] })),
        unifiedCapaApi.getAll().catch(() => ({ data: [] as CapaData[] })),
      ]);
      const transformed = response.data.map((report: any) => ({
        id: report.id,
        eightDNumber: report.dNumber || report.eightDNumber || report.id,
        symptomDescription: report.symptomDescription || report.title,
        emergencyResponse: report.emergencyResponse || '',
        dateDetected: report.dateDetected || report.createdAt?.split('T')[0],
        teamLeader: report.teamLeader?.name || report.ownerUser?.name || 'Unassigned',
        teamMembers: report.teamMembers?.map((m: any) => m.name || m) || [],
        department: report.department || 'Quality',
        champion: report.champion,
        problemTitle: report.problemTitle || report.title || report.subject,
        productName: report.productName || report.product,
        productionLine: report.productionLine,
        lotNumber: report.lotNumber,
        problemDescription: report.problemDescription || report.description,
        customerImpact: report.customerImpact,
        immediateAction: report.immediateAction || '',
        containmentResponsible: report.containmentResponsible || '',
        containmentDate: report.containmentDate,
        quantityContained: report.quantityContained,
        analysisMethod: report.analysisMethod || '5why',
        whyAnalysis: report.whyAnalysis,
        fishboneAnalysis: report.fishboneAnalysis,
        rootCauseDescription: report.rootCauseDescription || '',
        correctiveActionDesc: report.correctiveActionDesc || '',
        correctiveResponsible: report.correctiveResponsible || '',
        targetDateCorrective: report.targetDateCorrective,
        implementationDate: report.implementationDate,
        validationResults: report.validationResults,
        effectivenessCheck: report.effectivenessCheck || 'pending',
        preventiveActionPlan: report.preventiveActionPlan,
        lessonsLearned: report.lessonsLearned,
        status: ((): D8Report['status'] => {
          const raw = String(report.status || '').toLowerCase();
          if (!raw) return 'd0';
          if (raw === 'in_progress' || raw === 'open') return 'd0';
          if (raw === 'completed') return 'd8';
          if (raw === 'closed') return 'closed';
          return raw as any;
        })(),
        closureDate: report.closedAt?.split('T')[0] || report.closureDate,
        ...report
      }));
      setReports(transformed);
      setDefectRecords(loadSafeLocalDefectRecords());
      setImprovementActions(loadImprovementActions());
      setLinkedNcrs(ncrResponse.data || []);
      setLinkedCapas(capaResponse.data || []);
    } catch (err) {
      setReports(mock8Ds);
      toast.info('Backend unavailable - no records loaded');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data from API
  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const id = params.id;
    if (!id) return;
    const found = reports.find((r) => r.id === id);
    if (found) {
      setEditingReport(found);
      setIsFormOpen(true);
    }
  }, [params.id, reports, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    if (!createPrefill.open) return;
    setEditingReport(null);
    setIsFormOpen(true);
  }, [createPrefill.open, isLoading]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-72">
          <div className="text-gray-400">Loading 8D reports...</div>
        </div>
      </PageContainer>
    );
  }

  const stats = [
    { label: 'Active 8Ds', value: reports.filter(r => r.status !== 'closed' && r.status !== 'd8').length, change: '0', trend: 'neutral' as const },
    { label: 'Team Formed', value: reports.filter(r => r.status !== 'd0' && r.status !== 'd1' && r.status !== 'closed').length, change: '0', trend: 'neutral' as const },
    { label: 'In Analysis', value: reports.filter(r => ['d2', 'd3', 'd4'].includes(r.status)).length, change: '0', trend: 'neutral' as const },
    { label: 'Completed', value: reports.filter(r => r.status === 'd8' || r.status === 'closed').length, change: '0', trend: 'neutral' as const }
  ];

  const filteredReports = reports.filter(report => {
    const matchesSearch = !searchQuery || 
      report.problemTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.eightDNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.problemDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.productName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const statusFilter = activeFilters['status'] as string[];
    const matchesStatus = !statusFilter || statusFilter.length === 0 || statusFilter.includes(report.status);
    
    const analysisFilter = activeFilters['analysisMethod'] as string[];
    const matchesAnalysis = !analysisFilter || analysisFilter.length === 0 || analysisFilter.includes(report.analysisMethod);
    
    const effectivenessFilter = activeFilters['effectivenessCheck'] as string[];
    const matchesEffectiveness = !effectivenessFilter || effectivenessFilter.length === 0 || effectivenessFilter.includes(report.effectivenessCheck);
    
    return matchesSearch && matchesStatus && matchesAnalysis && matchesEffectiveness;
  });

  const getStepIndex = (status: string) => dSteps.findIndex(s => s.key === status);

  const handleCreate = () => {
    setEditingReport(null);
    setIsFormOpen(true);
  };

  const handleEdit = (report: D8Report) => {
    setEditingReport(report);
    setIsFormOpen(true);
  };


  const handleFormSubmit = async (data: Record<string, unknown>) => {
    try {
      const eightDNumber = (data.eightDNumber as string) || (data.dNumber as string) || generate8DNumber();
      const title = (data.problemTitle as string) || (data.title as string) || '8D Report';

      const backendPayload = {
        dNumber: eightDNumber,
        title,
        teamMembers: (data.teamMembers as any) || [],
        problemDescription: (data.problemDescription as string) || (data.description as string) || '',
        containmentActions: (data.immediateAction as string) || (data.containmentActions as string) || '',
        rootCause: (data.rootCauseDescription as string) || (data.rootCause as string) || '',
        correctiveActions: (data.correctiveActionDesc as string) || (data.correctiveActions as string) || '',
        preventiveActions: (data.preventiveActionPlan as string) || (data.preventiveActions as string) || '',
        lessonsLearned: (data.lessonsLearned as string) || '',
        status: (data.status as string) || 'in_progress',
      };

      if (editingReport) {
        await (eightDApi as any).update(editingReport.id, backendPayload);
        toast.success('8D report updated successfully');
      } else {
        await (eightDApi as any).create(backendPayload);
        toast.success('8D report created successfully');
      }

      await loadReports();
      setIsFormOpen(false);
      setEditingReport(null);
      if (params.id) {
        navigate('/8d', { replace: true });
      }
    } catch (err) {
      toast.error(editingReport ? 'Failed to update 8D report' : 'Failed to create 8D report');
    }
  };

  const handleCreateImprovementAction = async (report: D8Report) => {
    const confirmed = window.confirm('Create an improvement action from this 8D report? You can edit the action later in the Command Center.');
    if (!confirmed) return;
    const metadata = (report.metadata && typeof report.metadata === 'object' ? report.metadata : {}) as Record<string, unknown>;
    const action = createImprovementAction({
      title: `Verify 8D effectiveness: ${report.problemTitle || report.eightDNumber}`,
      description: 'Improvement action created from 8D. Verify D5/D6 implementation, D7 prevention, and before/after effectiveness signal.',
      sourceType: 'eightD',
      sourceId: report.id,
      relatedEightDId: report.id,
      relatedNcrId: String(report.ncrReportId || metadata.ncrReportId || ''),
      relatedCapaId: String(report.relatedCapaId || metadata.relatedCapaId || ''),
      linkedDefectType: String(report.defectType || metadata.defectType || ''),
      linkedProductionLine: String(report.productionLine || metadata.productionLine || ''),
      linkedModel: String(report.productName || metadata.model || ''),
      linkedPartNumber: String(report.partNumber || metadata.partNumber || ''),
      linkedCustomer: String(report.customerName || metadata.customerName || ''),
      actionType: 'verification',
      priority: report.customerImpact ? 'high' : 'medium',
      status: 'open',
    });
    const relatedActionIds = Array.from(new Set([...(Array.isArray(report.relatedActionIds) ? report.relatedActionIds.map(String) : []), ...((Array.isArray(metadata.relatedActionIds) ? metadata.relatedActionIds.map(String) : [])), action.id]));
    await (eightDApi as { update: (id: string, data: Partial<EightDData>) => Promise<unknown> }).update(report.id, {
      relatedActionIds,
      metadata: { ...metadata, relatedActionIds, effectivenessResult: action.effectivenessResult || metadata.effectivenessResult },
    });
    enqueueQualitySyncItem({
      entityType: 'eight-d',
      entityId: report.id,
      operation: 'link-action',
      payloadSummary: `Linked improvement action ${action.id} to 8D ${report.id}`,
    });
    await loadReports();
    toast.success('Improvement action linked to 8D');
  };

  const closedLoopForEightD = (report: D8Report) => buildClosedLoopSourceLinks({
    sourceType: 'eightD',
    source: report as unknown as EightDData,
    defects: defectRecords,
    actions: improvementActions,
    ncrs: linkedNcrs,
    capas: linkedCapas,
  });

  const getInitialValues = () => {
    if (editingReport) {
      return editingReport;
    }
    return {
      eightDNumber: generate8DNumber(),
      dateDetected: new Date().toISOString().split('T')[0],
      status: 'd0',
      analysisMethod: '5why',
      effectivenessCheck: 'pending',
      ...createPrefill.values,
    };
  };

  const handleExport = (format: 'excel' | 'csv' | 'json' = 'excel', ids?: string[]) => {
    const dataToExport = ids && ids.length > 0 
      ? reports.filter(r => ids.includes(r.id))
      : filteredReports;

    if (dataToExport.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      const mapping = {
        eightDNumber: '8D Number',
        problemTitle: 'Title',
        productName: 'Product',
        teamLeader: 'Team Leader',
        analysisMethod: 'Analysis Method',
        status: 'Status',
        dateDetected: 'Date Detected',
        problemDescription: 'Problem Description',
        rootCauseDescription: 'Root Cause',
        correctiveActionDesc: 'Corrective Action',
        effectivenessCheck: 'Effectiveness'
      };

      const preparedData = prepareDataForExport(dataToExport, mapping);
      exportData(preparedData, `8D_Report`, '8D Reports', format);
      toast.success(`Successfully exported ${dataToExport.length} reports`);
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Export failed');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="8D Problem Solving"
        subtitle="Structured problem solving methodology"
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: '8D Report' }]}
        actions={{
          create: handleCreate,
          refresh: loadReports,
          export: () => handleExport('excel')
        }}
      />

      <StatsBar stats={stats} />

      <PageSection>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search 8D reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3E0]"
                />
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-11 px-4 border rounded-lg transition-colors flex items-center gap-2 ${
                    showFilters || Object.keys(activeFilters).length > 0
                      ? 'bg-[#0066CC]/20 border-[#00A3E0] text-[#00A3E0]'
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {Object.keys(activeFilters).length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-[#0066CC] text-white text-xs rounded-full">
                      {Object.values(activeFilters).flat().length}
                    </span>
                  )}
                </button>
                
                <button 
                  onClick={handleCreate}
                  className="h-11 px-4 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052a3] transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New 8D</span>
                </button>
              </div>
            </div>

            <BulkActionBar
              selectedCount={selectedIds.length}
              itemName="8D Reports"
              onClearSelection={() => setSelectedIds([])}
              onExport={(format) => handleExport(format, selectedIds)}
            />

            <DataTable
              data={filteredReports}
              columns={[
                { key: 'eightDNumber', title: '8D Number', width: '120px', sortable: true, render: (item) => (
                  <span className="text-[#00A3E0] font-mono text-sm font-medium">{item.eightDNumber}</span>
                )},
                { key: 'problemTitle', title: 'Problem Title & Description', sortable: true, render: (item) => {
                  const currentStep = getStepIndex(item.status);
                  return (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${dSteps[currentStep]?.color || 'bg-gray-500'} text-white`}>
                          {dSteps[currentStep]?.label || item.status}
                        </span>
                      </div>
                      <p className="text-white font-medium text-sm line-clamp-1">{item.problemTitle}</p>
                      <p className="text-gray-400 text-xs mt-1 line-clamp-1">{item.problemDescription}</p>
                    </div>
                  );
                }},
                { key: 'productName', title: 'Product', width: '150px', sortable: true, render: (item) => (
                  <span className="text-gray-300 text-sm">{item.productName}</span>
                )},
                { key: 'teamLeader', title: 'Team Leader', width: '140px', sortable: true, render: (item) => (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#0066CC]/20 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-[#00A3E0]" />
                    </div>
                    <span className="text-gray-300 text-sm">{item.teamLeader}</span>
                  </div>
                )},
                { key: 'analysisMethod', title: 'Analysis', width: '100px', sortable: true, render: (item) => (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${analysisMethodConfig[item.analysisMethod].color}`}>
                    {analysisMethodConfig[item.analysisMethod].label}
                  </span>
                )},
                { key: 'effectivenessCheck', title: 'Effectiveness', width: '110px', sortable: true, render: (item) => (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${effectivenessConfig[item.effectivenessCheck].color}`}>
                    {effectivenessConfig[item.effectivenessCheck].label}
                  </span>
                )},
                { key: 'status', title: 'Status', width: '110px', sortable: true, render: (item) => (
                  <StatusBadge status={item.status} size="sm" />
                )},
                { key: 'progress', title: 'Progress', width: '140px', sortable: false, render: (item) => {
                  const currentStep = getStepIndex(item.status);
                  const progress = Math.round(((currentStep + 1) / 10) * 100);
                  return (
                    <div className="w-full">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#0066CC] to-[#00A3E0] rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                }}
              ]}
              keyExtractor={(item) => item.id}
              selectedItems={selectedIds}
              onSelectionChange={setSelectedIds}
              onRowClick={(row) => {
                setEditingReport(row);
                setIsFormOpen(true);
              }}
              pageSize={10}
              actions={(item) => (
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); handleCreateImprovementAction(item); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Create Improvement Action">
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setEditingReport(item); setIsFormOpen(true); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="View">
                    <Eye className="w-4 h-4 text-gray-400" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Edit">
                    <Edit3 className="w-4 h-4 text-[#00A3E0]" />
                  </button>
                </div>
              )}
              emptyState={
                <div className="glass-panel rounded-xl p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No 8D reports found</h3>
                  <p className="text-gray-400 mb-4">Try adjusting your search or filters</p>
                  <button onClick={() => { setSearchQuery(''); setActiveFilters({}); setDateRange({ from: null, to: null }); }} className="text-[#00A3E0] hover:text-white transition-colors">
                    Clear all filters
                  </button>
                </div>
              }
            />
          </div>

          {showFilters && (
            <div className="w-full lg:w-72 shrink-0">
              <FilterPanel
                filters={[
                  { key: 'status', title: 'Status', multi: true, options: [
                    { value: 'd0', label: 'D0: Plan', count: reports.filter(r => r.status === 'd0').length, color: '#6B7280' },
                    { value: 'd1', label: 'D1: Team', count: reports.filter(r => r.status === 'd1').length, color: '#3B82F6' },
                    { value: 'd2', label: 'D2: Problem', count: reports.filter(r => r.status === 'd2').length, color: '#06B6D4' },
                    { value: 'd3', label: 'D3: Containment', count: reports.filter(r => r.status === 'd3').length, color: '#EAB308' },
                    { value: 'd4', label: 'D4: Root Cause', count: reports.filter(r => r.status === 'd4').length, color: '#F97316' },
                    { value: 'd5', label: 'D5: Actions', count: reports.filter(r => r.status === 'd5').length, color: '#A855F7' },
                    { value: 'd6', label: 'D6: Implement', count: reports.filter(r => r.status === 'd6').length, color: '#EC4899' },
                    { value: 'd7', label: 'D7: Prevent', count: reports.filter(r => r.status === 'd7').length, color: '#14B8A6' },
                    { value: 'd8', label: 'D8: Congratulate', count: reports.filter(r => r.status === 'd8').length, color: '#22C55E' },
                    { value: 'closed', label: 'Closed', count: reports.filter(r => r.status === 'closed').length, color: '#10B981' }
                  ]},
                  { key: 'analysisMethod', title: 'Analysis Method', multi: true, options: [
                    { value: '5why', label: '5 Why', count: reports.filter(r => r.analysisMethod === '5why').length, color: '#3B82F6' },
                    { value: 'fishbone', label: 'Fishbone', count: reports.filter(r => r.analysisMethod === 'fishbone').length, color: '#06B6D4' },
                    { value: 'fmea', label: 'FMEA', count: reports.filter(r => r.analysisMethod === 'fmea').length, color: '#A855F7' },
                    { value: 'fault-tree', label: 'Fault Tree', count: reports.filter(r => r.analysisMethod === 'fault-tree').length, color: '#DC2626' }
                  ]},
                  { key: 'effectivenessCheck', title: 'Effectiveness', multi: true, options: [
                    { value: 'pending', label: 'Pending', count: reports.filter(r => r.effectivenessCheck === 'pending').length, color: '#EAB308' },
                    { value: 'effective', label: 'Effective', count: reports.filter(r => r.effectivenessCheck === 'effective').length, color: '#22C55E' },
                    { value: 'ineffective', label: 'Ineffective', count: reports.filter(r => r.effectivenessCheck === 'ineffective').length, color: '#DC2626' }
                  ]}
                ]}
                activeFilters={activeFilters}
                onFilterChange={(key, value) => {
                  const newFilters = { ...activeFilters };
                  if (value === null) {
                    delete newFilters[key];
                  } else {
                    newFilters[key] = value;
                  }
                  setActiveFilters(newFilters);
                }}
                onClearAll={() => { setActiveFilters({}); setDateRange({ from: null, to: null }); setSearchQuery(''); }}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            </div>
          )}
        </div>
      </PageSection>

      {isFormOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-[#0a0a0f]">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {editingReport ? 'Edit 8D Report' : 'Create New 8D Report'}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {editingReport ? 'Edit 8D problem solving information' : 'Create a new 8D problem solving report'}
                </p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6">
              <DynamicFormRenderer
                formType="8d"
                initialValues={getInitialValues()}
                onSubmit={handleFormSubmit}
                readOnly={false}
                showSubmitButton={true}
                submitLabel={editingReport ? 'Update 8D Report' : 'Create 8D Report'}
              />

              {editingReport && (
                <div className="mt-6 space-y-5">
                  {(() => {
                    const closedLoop = closedLoopForEightD(editingReport);
                    return (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-black text-white">8D Closed-Loop Integration</h3>
                            <p className="text-xs text-white/45 mt-1">Connects D-sections, linked defects, NCR/CAPA, improvement actions, and effectiveness verification.</p>
                          </div>
                          <button type="button" onClick={() => handleCreateImprovementAction(editingReport)} className="px-3 py-2 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-200 text-xs font-black">
                            Create Improvement Action
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-5">
                          {[
                            ['Linked Defects', closedLoop.linkedDefects.length],
                            ['Linked Actions', closedLoop.linkedActions.length],
                            ['Before Metric', closedLoop.beforeMetric],
                            ['After Metric', closedLoop.afterMetric],
                          ].map(([label, value]) => (
                            <div key={String(label)} className="rounded-xl border border-white/10 bg-black/10 p-3">
                              <p className="text-[10px] text-white/35 uppercase font-black">{String(label)}</p>
                              <p className="text-xl font-black text-white mt-1">{String(value)}</p>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                          <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                            <p className="text-[10px] text-white/35 uppercase font-black">Effectiveness</p>
                            <p className="text-sm font-black text-[#00A3E0] mt-1">{closedLoop.effectivenessStatus}</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                            <p className="text-[10px] text-white/35 uppercase font-black">Confidence</p>
                            <p className="text-sm font-black text-white mt-1">{closedLoop.confidenceLabel}</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                            <p className="text-[10px] text-white/35 uppercase font-black">Improvement</p>
                            <p className="text-sm font-black text-white mt-1">{closedLoop.improvementPercent === null ? 'N/A' : `${closedLoop.improvementPercent}%`}</p>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          {closedLoop.dataLimitations.map((item) => (
                            <p key={item} className="text-xs text-white/45">{item}</p>
                          ))}
                          <p className="text-xs text-emerald-200">{closedLoop.recommendedFollowUp}</p>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <h3 className="text-lg font-black text-white mb-4">Structured 8D Sections</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                      {[
                        ['D1 Team', editingReport.teamLeader || 'Owner not set'],
                        ['D2 Problem Description', editingReport.problemDescription || 'Needs definition'],
                        ['D3 Containment', editingReport.immediateAction || 'Containment not set'],
                        ['D4 Root Cause Analysis', editingReport.rootCauseDescription || 'Requires verification'],
                        ['D5 Corrective Actions', editingReport.correctiveActionDesc || 'Action not set'],
                        ['D6 Implementation', editingReport.implementationDate || 'Implementation date not set'],
                        ['D7 Prevention', editingReport.preventiveActionPlan || 'Prevention not set'],
                        ['D8 Closure / Recognition', editingReport.closureDate || 'Not closed'],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-white/10 bg-black/10 p-3">
                          <p className="text-xs font-black text-white">{label}</p>
                          <p className="text-xs text-white/50 mt-2 line-clamp-3">{value}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-white/35 mt-4">D-section content is shown as structured decision-support. Evidence and closure still require user verification.</p>
                  </div>
                  <QualityRelationshipManager
                    currentType="eightD"
                    currentId={editingReport.id}
                    currentLabel={`8D ${editingReport.problemTitle || editingReport.eightDNumber}`}
                    canManage={hasDefectPermission(workflowUser, 'defect.edit')}
                    disabledReason="Requires edit defect permission to link or unlink quality records."
                    records={{
                      defects: defectRecords,
                      ncrs: linkedNcrs,
                      capas: linkedCapas,
                      eightDs: reports as unknown as EightDData[],
                      actions: improvementActions,
                    }}
                    onChanged={loadReports}
                  />
                  <QualityKnowledgeSuggestions
                    context={buildKnowledgeContextFromSource('eightD', editingReport as unknown as EightDData)}
                    title="Related Lessons Learned"
                    canApply={hasDefectPermission(workflowUser, 'defect.edit')}
                  />
                  <RelatedRecords 
                    currentId={editingReport.id}
                    relations={[
                      { targetModule: 'ncr', filterField: 'id', label: 'Source NCR', icon: <ShieldAlert className="w-4 h-4" /> },
                      { targetModule: 'defect-logs', filterField: 'relatedNcrId', label: 'Original Defect', icon: <FileText className="w-4 h-4" /> }
                    ]}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default D8Page;
