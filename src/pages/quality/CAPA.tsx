// QMS Enterprise 4.0 - CAPA (Corrective and Preventive Action) Page - Professional Edition
import { useState, useEffect, useMemo } from 'react';
import { PageHeader, PageContainer, PageSection, StatsBar } from '../../components/PageHeader';
import DynamicFormRenderer from '../../components/DynamicFormRenderer';
import { DataTable } from '../../components/DataTable';
import { FilterPanel } from '../../components/FilterPanel';
import { BulkActionBar } from '../../components/BulkActionBar';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { toast } from 'sonner';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  unifiedCapaApi as capaApi, 
  unifiedEightDApi,
  unifiedNcrApi,
  type CapaData 
} from '../../api/unified-api';
import { 
  Plus, 
  Search, 
  Filter,
  Calendar,
  User,
  X,
  Edit3,
  Trash2,
  Eye,
  ShieldAlert,
  FileText,
  Activity
} from 'lucide-react';
import { RelatedRecords } from '../../components/RelatedRecords';
import QualityRelationshipManager from '@/components/QualityRelationshipManager';
import QualityKnowledgeSuggestions from '@/components/QualityKnowledgeSuggestions';
import { exportData, prepareDataForExport } from '../../utils/exportUtils';
import { QualityEngine } from '../../services/qualityEngine';
import {
  createImprovementAction,
  loadImprovementActions,
  type QualityImprovementAction,
} from '@/services/qualityImprovementActions';
import { buildClosedLoopSourceLinks } from '@/services/qualityClosedLoopIntegration';
import { enqueueQualitySyncItem } from '@/services/qualitySyncQueue';
import { buildKnowledgeContextFromSource } from '@/services/qualityKnowledgeBase';
import {
  buildLocalWorkflowUser,
  hasDefectPermission,
  loadLocalWorkflowRole,
} from '@/services/defectWorkflowGovernance';
import { loadSafeLocalDefectRecords } from '@/services/safeDefectStorage';
import type { DefectLogData, EightDData, NcrData } from '@/api/unified-api';

interface CAPAItem {
  id: string;
  title: string;
  description: string;
  type: 'corrective' | 'preventive';
  status: 'identified' | 'analysis' | 'action' | 'verification' | 'closed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  sourceNCRId?: string;
  createdDate: string;
  targetDate: string;
  owner: string;
  department: string;
  effectiveness: 'pending' | 'effective' | 'ineffective';
  // Dynamic fields from form
  [key: string]: unknown;
}

export const mockCAPAs: CAPAItem[] = [];

// Generate CAPA number
function generateCAPANumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `CAPA-${year}-${random}`;
}

export function CAPAPage() {
  const [capas, setCapas] = useState<CAPAItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});
  const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCapa, setEditingCapa] = useState<CAPAItem | null>(null);
  const [defectRecords, setDefectRecords] = useState<DefectLogData[]>([]);
  const [improvementActions, setImprovementActions] = useState<QualityImprovementAction[]>([]);
  const [linkedNcrs, setLinkedNcrs] = useState<NcrData[]>([]);
  const [linkedEightDs, setLinkedEightDs] = useState<EightDData[]>([]);

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const workflowUser = buildLocalWorkflowUser(null, loadLocalWorkflowRole());

  const createPrefill = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const sourceNCRId = params.get('sourceNCRId');
    const title = params.get('title');
    const problemStatement = params.get('problemStatement');
    const source = params.get('source');
    const open = params.get('create') === '1' || !!sourceNCRId || !!title || !!problemStatement;

    return {
      open,
      values: {
        sourceNCRId: sourceNCRId ?? undefined,
        source: source ?? (sourceNCRId ? sourceNCRId : undefined),
        title: title ?? undefined,
        problemStatement: problemStatement ?? undefined,
      } satisfies Record<string, unknown>,
    };
  }, [location.search]);

  const loadCapas = async () => {
    try {
      setIsLoading(true);
      const [response, ncrResponse, eightDResponse] = await Promise.all([
        capaApi.getAll(),
        unifiedNcrApi.getAll().catch(() => ({ data: [] as NcrData[] })),
        unifiedEightDApi.getAll().catch(() => ({ data: [] as EightDData[] })),
      ]);
      // Transform API data to match CAPAItem interface
      const transformed = response.data.map((capa: any) => ({
        id: capa.id,
        title: capa.title,
        description: capa.description,
        type: capa.capaType?.toLowerCase() || 'corrective',
        status: capa.status?.toLowerCase() || 'identified',
        priority: capa.priority?.toLowerCase() || 'medium',
        source: capa.sourceNcrId ? `NCR-${capa.sourceNcrId}` : (capa.source || 'System'),
        sourceNCRId: capa.sourceNcrId,
        createdDate: capa.createdAt?.split('T')[0],
        targetDate: capa.targetCloseDate || capa.targetDate,
        owner: capa.ownerUser?.name || capa.assignedUser?.name || 'Unassigned',
        department: capa.department?.name || capa.departmentId || 'General',
        effectiveness: capa.effectiveness || 'pending',
        ...capa
      }));
      setCapas(transformed);
      setDefectRecords(loadSafeLocalDefectRecords());
      setImprovementActions(loadImprovementActions());
      setLinkedNcrs(ncrResponse.data || []);
      setLinkedEightDs(eightDResponse.data || []);
    } catch (err) {
      console.warn('API unavailable; keeping empty state:', err);
      // Keep an empty state when backend is not running
      setCapas(mockCAPAs);
      toast.info('Backend unavailable - no records loaded');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data from API
  useEffect(() => {
    loadCapas();
  }, []);

  // Support deep-link /capa/:id by opening the modal
  useEffect(() => {
    if (isLoading) return;
    const id = params.id;
    if (!id) return;
    const found = capas.find((c) => c.id === id);
    if (found) {
      setEditingCapa(found);
      setIsFormOpen(true);
    }
  }, [params.id, capas, isLoading]);

  // Deep-link create flow from other pages (e.g., NCR Details)
  useEffect(() => {
    if (isLoading) return;
    if (!createPrefill.open) return;
    setEditingCapa(null);
    setIsFormOpen(true);
  }, [createPrefill.open, isLoading]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-72">
          <div className="text-gray-400">Loading CAPA...</div>
        </div>
      </PageContainer>
    );
  }

  const stats = [
    { label: 'Active CAPAs', value: capas.filter(c => c.status !== 'closed').length, change: '0', trend: 'neutral' as const },
    { label: 'Overdue', value: capas.filter(c => c.targetDate < new Date().toISOString().split('T')[0] && c.status !== 'closed').length, change: '0', trend: 'neutral' as const },
    { label: 'Verification Phase', value: capas.filter(c => c.status === 'verification').length, change: '0', trend: 'neutral' as const },
    { label: 'Effectiveness Rate', value: capas.length ? `${Math.round((capas.filter(c => c.effectiveness === 'effective').length / capas.length) * 100)}%` : '0%', change: '0%', trend: 'neutral' as const }
  ];

  const filteredCAPAs = capas.filter(capa => {
    const matchesSearch = !searchQuery || 
      capa.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      capa.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      capa.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const statusFilter = activeFilters['status'] as string[];
    const matchesStatus = !statusFilter || statusFilter.length === 0 || statusFilter.includes(capa.status);
    
    const typeFilter = activeFilters['type'] as string[];
    const matchesType = !typeFilter || typeFilter.length === 0 || typeFilter.includes(capa.type);
    
    const priorityFilter = activeFilters['priority'] as string[];
    const matchesPriority = !priorityFilter || priorityFilter.length === 0 || priorityFilter.includes(capa.priority);
    
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  const handleCreate = () => {
    setEditingCapa(null);
    setIsFormOpen(true);
  };

  const handleEdit = (capa: CAPAItem) => {
    setEditingCapa(capa);
    setIsFormOpen(true);
  };

  const handleDelete = async (capaId: string) => {
    if (confirm('Are you sure you want to delete this CAPA?')) {
      try {
        await capaApi.delete(capaId);
        await loadCapas();
        toast.success('CAPA deleted successfully');
      } catch (err) {
        toast.error('Failed to delete CAPA');
        console.error(err);
      }
    }
  };

  const handleEscalateTo8D = async (capa: CAPAItem) => {
    if (!hasDefectPermission(workflowUser, 'defect.escalate8d')) {
      toast.error('Action not available', { description: 'Your current role cannot create 8D records.' });
      return;
    }
    try {
      const result = await QualityEngine.trigger8dFromCapa(capa.id, true);
      if (result) {
        toast.success('8D Escalated', {
          description: `8D Analysis dynamically mapped and initialized from CAPA ${capa.capaNumber || capa.id}.`
        });
        navigate('/quality/8d');
        enqueueQualitySyncItem({
          entityType: 'eight-d',
          entityId: capa.id,
          operation: 'create-8d',
          payloadSummary: `8D user-triggered from CAPA ${capa.id}`,
        });
      } else {
        toast.info('Escalation Criteria Not Met', {
          description: 'This CAPA does not meet automatic escalation rules.'
        });
      }
    } catch (err) {
      toast.error('Failed to escalate CAPA to 8D');
    }
  };

  const handleCreateImprovementAction = async (capa: CAPAItem) => {
    const confirmed = window.confirm('Create an improvement action from this CAPA? You can edit the action later in the Command Center.');
    if (!confirmed) return;
    const metadata = (capa.metadata && typeof capa.metadata === 'object' ? capa.metadata : {}) as Record<string, unknown>;
    const action = createImprovementAction({
      title: `Verify CAPA effectiveness: ${capa.title || capa.id}`,
      description: 'Improvement action created from CAPA. Verify implementation, preventive action, and before/after effectiveness signal.',
      sourceType: 'capa',
      sourceId: capa.id,
      relatedCapaId: capa.id,
      relatedNcrId: capa.sourceNCRId || String(capa.sourceNcrId || metadata.sourceNcrId || ''),
      linkedDefectType: String(capa.defectType || metadata.defectType || ''),
      linkedProductionLine: String(capa.productionLine || metadata.productionLine || ''),
      linkedPartNumber: String(capa.partNumber || metadata.partNumber || ''),
      linkedSupplier: String(capa.supplierName || metadata.supplierName || ''),
      linkedCustomer: String(capa.customerName || metadata.customerName || ''),
      actionType: capa.type === 'preventive' ? 'preventive' : 'corrective',
      priority: capa.priority === 'critical' ? 'critical' : capa.priority === 'high' ? 'high' : 'medium',
      status: 'open',
    });
    const relatedActionIds = Array.from(new Set([...(Array.isArray(capa.relatedActionIds) ? capa.relatedActionIds.map(String) : []), ...((Array.isArray(metadata.relatedActionIds) ? metadata.relatedActionIds.map(String) : [])), action.id]));
    await capaApi.update(capa.id, {
      relatedActionIds,
      metadata: { ...metadata, relatedActionIds, effectivenessResult: action.effectivenessResult || metadata.effectivenessResult },
    } as Partial<CapaData>);
    enqueueQualitySyncItem({
      entityType: 'capa',
      entityId: capa.id,
      operation: 'link-action',
      payloadSummary: `Linked improvement action ${action.id} to CAPA ${capa.id}`,
    });
    await loadCapas();
    toast.success('Improvement action linked to CAPA');
  };

  const closedLoopForCapa = (capa: CAPAItem) => buildClosedLoopSourceLinks({
    sourceType: 'capa',
    source: capa as unknown as CapaData,
    defects: defectRecords,
    actions: improvementActions,
    ncrs: linkedNcrs,
    eightDs: linkedEightDs,
  });

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    try {
      const capaData: CapaData = {
        title: data.title as string,
        description: data.problemStatement as string || (data.title as string),
        priority: ((data.priority as string) || 'medium').toUpperCase(),
        capaType: (data.capaType as string) || 'Corrective',
        sourceNcrId: data.sourceNCRId as string,
        plantId: data.plantId as string || '1',
        departmentId: data.departmentId as string,
        targetCloseDate: data.implementationDate as string,
        assignedUserId: data.owner as string,
        metadata: data
      };

      if (editingCapa) {
        // Update existing CAPA
        await capaApi.update(editingCapa.id, capaData);
        await loadCapas();
        toast.success('CAPA updated successfully');
      } else {
        // Create new CAPA
        await capaApi.create(capaData);
        await loadCapas();
        toast.success('CAPA created successfully');
      }
      setIsFormOpen(false);
      setEditingCapa(null);
      if (params.id) {
        navigate('/capa', { replace: true });
      }
    } catch (err) {
      toast.error(editingCapa ? 'Failed to update CAPA' : 'Failed to create CAPA');
      console.error(err);
    }
  };

  const getInitialValues = () => {
    if (editingCapa) {
      return editingCapa;
    }
    // Default values for new CAPA
    return {
      capaNumber: generateCAPANumber(),
      date: new Date().toISOString(),
      status: 'identified',
      ...createPrefill.values,
    };
  };

  const handleExport = (format: 'excel' | 'csv' | 'json' = 'excel', ids?: string[]) => {
    const dataToExport = ids && ids.length > 0 
      ? capas.filter(c => ids.includes(c.id))
      : filteredCAPAs;

    if (dataToExport.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      const mapping = {
        id: 'CAPA Number',
        title: 'Title',
        description: 'Description',
        type: 'Type',
        status: 'Status',
        priority: 'Priority',
        source: 'Source',
        createdDate: 'Created Date',
        targetDate: 'Target Date',
        owner: 'Owner',
        department: 'Department',
        effectiveness: 'Effectiveness'
      };

      const preparedData = prepareDataForExport(dataToExport, mapping);
      exportData(preparedData, `CAPA_Report`, 'Corrective & Preventive Actions', format);
      toast.success(`Successfully exported ${dataToExport.length} reports`);
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Export failed');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Corrective & Preventive Actions"
        subtitle="Manage CAPA workflow from identification to closure"
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'CAPA' }]}
        actions={{
          create: handleCreate,
          refresh: loadCapas,
          export: () => handleExport('excel')
        }}
      />

      <StatsBar stats={stats} />

      <PageSection>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-4">
            {/* Search & Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search CAPAs..."
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
                  <span className="hidden sm:inline">New CAPA</span>
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            <BulkActionBar
              selectedCount={selectedIds.length}
              itemName="CAPAs"
              onClearSelection={() => setSelectedIds([])}
              onDelete={() => {
                if (confirm(`Delete ${selectedIds.length} CAPAs?`)) {
                  setCapas(prev => prev.filter(c => !selectedIds.includes(c.id)));
                  setSelectedIds([]);
                  toast.success(`${selectedIds.length} CAPAs deleted`);
                }
              }}
              onExport={(format) => handleExport(format, selectedIds)}
            />

            {/* Data Table */}
            <DataTable
              data={filteredCAPAs}
              columns={[
                { key: 'id', title: 'CAPA ID', width: '150px', sortable: true, render: (item) => (
                  <span className="text-[#00A3E0] font-mono text-sm font-medium">{item.id}</span>
                )},
                { key: 'title', title: 'Title & Description', sortable: true, render: (item) => (
                  <div>
                    <p className="text-white font-medium text-sm line-clamp-1">{item.title}</p>
                    <p className="text-gray-400 text-xs mt-1 line-clamp-1">{item.description}</p>
                  </div>
                )},
                { key: 'status', title: 'Status', width: '150px', sortable: true, render: (item) => (
                  <StatusBadge status={item.status} size="sm" />
                )},
                { key: 'priority', title: 'Priority', width: '110px', sortable: true, render: (item) => (
                  <PriorityBadge priority={item.priority} size="sm" />
                )},
                { key: 'owner', title: 'Owner', width: '150px', sortable: true, render: (item) => (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#0066CC]/20 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-[#00A3E0]" />
                    </div>
                    <span className="text-gray-300 text-sm">{item.owner}</span>
                  </div>
                )},
                { key: 'targetDate', title: 'Target Date', width: '130px', sortable: true, render: (item) => (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Calendar className="w-4 h-4" />
                    {item.targetDate}
                  </div>
                )}
              ]}
              keyExtractor={(item) => item.id}
              selectedItems={selectedIds}
              onSelectionChange={setSelectedIds}
              onRowClick={(row) => {
                setEditingCapa(row);
                setIsFormOpen(true);
              }}
              pageSize={10}
              actions={(item) => (
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); handleCreateImprovementAction(item); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Create Improvement Action">
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleEscalateTo8D(item); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Escalate to 8D">
                    <ShieldAlert className="w-4 h-4 text-orange-400" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setEditingCapa(item); setIsFormOpen(true); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="View">
                    <Eye className="w-4 h-4 text-gray-400" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Edit">
                    <Edit3 className="w-4 h-4 text-[#00A3E0]" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              )}
              emptyState={
                <div className="glass-panel rounded-xl p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No CAPAs found</h3>
                  <p className="text-gray-400 mb-4">Try adjusting your search or filters</p>
                  <button onClick={() => { setSearchQuery(''); setActiveFilters({}); setDateRange({ from: null, to: null }); }} className="text-[#00A3E0] hover:text-white transition-colors">
                    Clear all filters
                  </button>
                </div>
              }
            />
          </div>

          {/* Filter Panel Sidebar */}
          {showFilters && (
            <div className="w-full lg:w-72 shrink-0">
              <FilterPanel
                filters={[
                  { key: 'status', title: 'Status', multi: true, options: [
                    { value: 'identified', label: 'Identified', count: capas.filter(c => c.status === 'identified').length, color: '#6B7280' },
                    { value: 'analysis', label: 'Analysis', count: capas.filter(c => c.status === 'analysis').length, color: '#3B82F6' },
                    { value: 'action', label: 'Action', count: capas.filter(c => c.status === 'action').length, color: '#F59E0B' },
                    { value: 'verification', label: 'Verification', count: capas.filter(c => c.status === 'verification').length, color: '#8B5CF6' },
                    { value: 'closed', label: 'Closed', count: capas.filter(c => c.status === 'closed').length, color: '#10B981' }
                  ]},
                  { key: 'type', title: 'Type', multi: true, options: [
                    { value: 'corrective', label: 'Corrective', count: capas.filter(c => c.type === 'corrective').length, color: '#F97316' },
                    { value: 'preventive', label: 'Preventive', count: capas.filter(c => c.type === 'preventive').length, color: '#14B8A6' }
                  ]},
                  { key: 'priority', title: 'Priority', multi: true, options: [
                    { value: 'critical', label: 'Critical', count: capas.filter(c => c.priority === 'critical').length, color: '#DC2626' },
                    { value: 'high', label: 'High', count: capas.filter(c => c.priority === 'high').length, color: '#F59E0B' },
                    { value: 'medium', label: 'Medium', count: capas.filter(c => c.priority === 'medium').length, color: '#3B82F6' },
                    { value: 'low', label: 'Low', count: capas.filter(c => c.priority === 'low').length, color: '#6B7280' }
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

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-[#0a0a0f]">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {editingCapa ? 'Edit CAPA' : 'Create New CAPA'}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {editingCapa ? 'Edit CAPA information' : 'Create a new Corrective/Preventive Action'}
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
                formType="capa"
                initialValues={getInitialValues()}
                onSubmit={handleFormSubmit}
                readOnly={false}
                showSubmitButton={true}
                submitLabel={editingCapa ? 'Update CAPA' : 'Create CAPA'}
              />

              {editingCapa && (
                <div className="mt-6 space-y-5">
                  {(() => {
                    const closedLoop = closedLoopForCapa(editingCapa);
                    return (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-black text-white">CAPA Closed-Loop Workflow</h3>
                            <p className="text-xs text-white/45 mt-1">Tracks linked defects, NCR, actions, verification window, and effectiveness signal.</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => handleCreateImprovementAction(editingCapa)} className="px-3 py-2 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-200 text-xs font-black">
                              Create Improvement Action
                            </button>
                            <button type="button" onClick={() => handleEscalateTo8D(editingCapa)} disabled={!hasDefectPermission(workflowUser, 'defect.escalate8d')} className="px-3 py-2 rounded-xl bg-purple-400/10 border border-purple-400/20 text-purple-200 text-xs font-black disabled:opacity-40">
                              Escalate to 8D
                            </button>
                          </div>
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
                    <h3 className="text-lg font-black text-white mb-4">Structured CAPA Workflow</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {['opened', 'root-cause-analysis', 'action-planning', 'implementation', 'pending-verification', 'effective', 'not-effective', 'closed', 'reopened'].map((status) => (
                        <span key={status} className={`px-3 py-2 rounded-xl text-xs font-black border ${String(editingCapa.status).toLowerCase() === status ? 'bg-[#0066CC]/25 border-[#00A3E0]/30 text-[#8be3ff]' : 'bg-black/10 border-white/10 text-white/45'}`}>
                          {status}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-white/35 mt-4">Workflow labels are decision-support states. Closure still requires user verification and evidence review.</p>
                  </div>
                  <QualityRelationshipManager
                    currentType="capa"
                    currentId={editingCapa.id}
                    currentLabel={`CAPA ${editingCapa.title || editingCapa.id}`}
                    canManage={hasDefectPermission(workflowUser, 'defect.edit')}
                    disabledReason="Requires edit defect permission to link or unlink quality records."
                    records={{
                      defects: defectRecords,
                      ncrs: linkedNcrs,
                      capas: capas as unknown as CapaData[],
                      eightDs: linkedEightDs,
                      actions: improvementActions,
                    }}
                    onChanged={loadCapas}
                  />
                  <QualityKnowledgeSuggestions
                    context={buildKnowledgeContextFromSource('capa', editingCapa as unknown as CapaData)}
                    title="Related Lessons Learned"
                    canApply={hasDefectPermission(workflowUser, 'defect.edit')}
                  />
                  <RelatedRecords
                    currentId={editingCapa.id}
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

      {/* No Form Config Warning */}
      {/* Note: Form not found message will show inside the modal if config is missing */}
    </PageContainer>
  );
}

export default CAPAPage;
