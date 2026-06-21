// QMS Enterprise 4.0 - NCR (Non-Conformance Report) Page - Professional Edition
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
  Plus, 
  Search, 
  Filter,
  Calendar,
  User,
  X,
  Edit3,
  Trash2,
  Eye,
  ClipboardList,
  ShieldAlert,
  FileText,
  Activity
} from 'lucide-react';
import { 
  unifiedNcrApi as ncrApi, 
  unifiedCapaApi,
  unifiedEightDApi,
  type NcrData 
} from '../../api/unified-api';
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
import { useAppStore } from '@/stores/appStore';
import type { CapaData, DefectLogData, EightDData } from '@/api/unified-api';

interface NCRItem {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'pending-approval' | 'closed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  createdDate: string;
  dueDate: string;
  assignedTo: string;
  department: string;
  source: string;
  // Dynamic fields from form
  [key: string]: unknown;
}

export const mockNCRs: NCRItem[] = [];

// Generate NCR number
function generateNCRNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `NCR-${year}-${random}`;
}

export function NCRPage() {
  const { isLiteMode } = useAppStore();
  // Data State
  const [ncrs, setNcrs] = useState<NCRItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNcr, setEditingNcr] = useState<NCRItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [defectRecords, setDefectRecords] = useState<DefectLogData[]>([]);
  const [improvementActions, setImprovementActions] = useState<QualityImprovementAction[]>([]);
  const [linkedCapas, setLinkedCapas] = useState<CapaData[]>([]);
  const [linkedEightDs, setLinkedEightDs] = useState<EightDData[]>([]);
  
  // Filter State
  const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});
  const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const workflowUser = buildLocalWorkflowUser(null, loadLocalWorkflowRole());

  const createPrefill = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const source = params.get('source');
    const supplierId = params.get('supplierId');
    const supplierName = params.get('supplierName');
    const problemDescription = params.get('problemDescription');
    const open = params.get('create') === '1' || !!supplierId || !!problemDescription;

    const title = supplierId ? `Supplier issue - ${supplierId}${supplierName ? ` (${supplierName})` : ''}` : undefined;

    return {
      open,
      values: {
        source: source ?? undefined,
        supplierId: supplierId ?? undefined,
        supplierName: supplierName ?? undefined,
        title,
        problemDescription: problemDescription ?? undefined,
      } satisfies Record<string, unknown>,
    };
  }, [location.search]);

  const loadNcrs = async () => {
    try {
      setIsLoading(true);
      const response = await ncrApi.getAll();
      const [capaResponse, eightDResponse] = await Promise.all([
        unifiedCapaApi.getAll().catch(() => ({ data: [] as CapaData[] })),
        unifiedEightDApi.getAll().catch(() => ({ data: [] as EightDData[] })),
      ]);
      // Transform API data to match NCRItem interface
      const transformed = response.data.map((ncr: any) => ({
        id: ncr.id,
        title: ncr.title,
        description: ncr.description,
        status: ncr.status?.toLowerCase().replace('_', '-') || 'open',
        priority: ncr.priority?.toLowerCase() || 'medium',
        createdDate: ncr.detectedDate || ncr.createdAt?.split('T')[0],
        dueDate: ncr.targetCloseDate || ncr.targetDate,
        assignedTo: ncr.assignedUser?.name || ncr.assignedTo || 'Unassigned',
        department: ncr.department?.name || ncr.departmentId || 'General',
        source: ncr.source || 'System',
        ...ncr
      }));
      setNcrs(transformed);
      setDefectRecords(loadSafeLocalDefectRecords());
      setImprovementActions(loadImprovementActions());
      setLinkedCapas(capaResponse.data || []);
      setLinkedEightDs(eightDResponse.data || []);
    } catch (err) {
      console.warn('API unavailable; keeping empty state:', err);
      // Keep an empty state when backend is not running
      setNcrs(mockNCRs);
      toast.info('Backend unavailable - no records loaded');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data from API
  useEffect(() => {
    loadNcrs();
  }, []);

  // Support deep-link /ncr/:id by opening the modal
  useEffect(() => {
    if (isLoading) return;
    const id = params.id;
    if (!id) return;
    const found = ncrs.find((n) => n.id === id);
    if (found) {
      setEditingNcr(found);
      setIsFormOpen(true);
    }
  }, [params.id, ncrs, isLoading]);

  // Deep-link create flow from other pages (e.g., Supplier Details)
  useEffect(() => {
    if (isLoading) return;
    if (!createPrefill.open) return;
    setEditingNcr(null);
    setIsFormOpen(true);
  }, [createPrefill.open, isLoading]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-72">
          <div className="text-gray-400">Loading NCRs...</div>
        </div>
      </PageContainer>
    );
  }

  const stats = [
    { label: 'Open NCRs', value: ncrs.filter(n => n.status === 'open').length, change: '0', trend: 'neutral' as const },
    { label: 'In Progress', value: ncrs.filter(n => n.status === 'in-progress').length, change: '0', trend: 'neutral' as const },
    { label: 'Pending Approval', value: ncrs.filter(n => n.status === 'pending-approval').length, change: '0', trend: 'neutral' as const },
    { label: 'Closed This Month', value: ncrs.filter(n => n.status === 'closed').length, change: '0%', trend: 'neutral' as const }
  ];

  const filteredNCRs = ncrs.filter(ncr => {
    const matchesSearch = !searchQuery || 
      ncr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ncr.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ncr.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const statusFilter = activeFilters['status'] as string[];
    const matchesStatus = !statusFilter || statusFilter.length === 0 || statusFilter.includes(ncr.status);
    
    const priorityFilter = activeFilters['priority'] as string[];
    const matchesPriority = !priorityFilter || priorityFilter.length === 0 || priorityFilter.includes(ncr.priority);
    
    let matchesDate = true;
    if (dateRange?.from || dateRange?.to) {
      const ncrDate = new Date(ncr.createdDate);
      if (dateRange.from && ncrDate < new Date(dateRange.from)) matchesDate = false;
      if (dateRange.to && ncrDate > new Date(dateRange.to)) matchesDate = false;
    }
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDate;
  });

  const handleCreate = () => {
    setEditingNcr(null);
    setIsFormOpen(true);
  };

  const handleEdit = (ncr: NCRItem) => {
    setEditingNcr(ncr);
    setIsFormOpen(true);
  };

  const handleDelete = async (ncrId: string) => {
    if (confirm('Are you sure you want to delete this NCR?')) {
      try {
        await ncrApi.delete(ncrId);
        await loadNcrs();
        toast.success('NCR deleted successfully');
      } catch (err) {
        toast.error('Failed to delete NCR');
        console.error(err);
      }
    }
  };

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    try {
      const ncrData: NcrData = {
        title: data.title as string,
        description: data.problemDescription as string || (data.title as string),
        priority: ((data.severity as string) || 'medium').toUpperCase(),
        source: (data.source as string) || 'System',
        plantId: data.plantId as string || '1',
        departmentId: data.departmentId as string,
        supplierId: data.supplierId as string,
        detectedDate: data.date as string,
        targetCloseDate: data.dueDate as string,
        assignedUserId: data.responsible as string,
        metadata: data
      };

      if (editingNcr) {
        // Update existing NCR
        await ncrApi.update(editingNcr.id, ncrData);
        await loadNcrs();
        toast.success('NCR updated successfully');
      } else {
        // Create new NCR
        await ncrApi.create(ncrData);
        await loadNcrs();
        toast.success('NCR created successfully');
      }
      setIsFormOpen(false);
      setEditingNcr(null);
      if (params.id) {
        navigate('/ncr', { replace: true });
      }
    } catch (err) {
      toast.error(editingNcr ? 'Failed to update NCR' : 'Failed to create NCR');
      console.error(err);
    }
  };

  const getInitialValues = () => {
    if (editingNcr) {
      return editingNcr;
    }
    // Default values for new NCR
    return {
      ncrNumber: generateNCRNumber(),
      date: new Date().toISOString(),
      status: 'open',
      ...createPrefill.values,
    };
  };

  const handleExport = (format: 'excel' | 'csv' | 'json' = 'excel', ids?: string[]) => {
    const dataToExport = ids && ids.length > 0 
      ? ncrs.filter(n => ids.includes(n.id))
      : filteredNCRs;

    if (dataToExport.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      const mapping = {
        id: 'NCR Number',
        title: 'Title',
        description: 'Problem Description',
        status: 'Status',
        priority: 'Priority',
        createdDate: 'Created Date',
        dueDate: 'Due Date',
        assignedTo: 'Assigned To',
        department: 'Department',
        source: 'Source',
        product: 'Product',
        quantity: 'Quantity',
        defectType: 'Defect Type'
      };

      const preparedData = prepareDataForExport(dataToExport, mapping);
      exportData(preparedData, `NCR_Report`, 'Non-Conformance Reports', format);
      toast.success(`Successfully exported ${dataToExport.length} reports`);
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Export failed');
    }
  };

  const handleCreateCapa = async (ncr: any) => {
    if (!hasDefectPermission(workflowUser, 'defect.createCapa')) {
      toast.error('Action not available', { description: 'Your current role cannot create CAPA records.' });
      return;
    }
    try {
      await QualityEngine.escalateNcrToCapa(ncr.id);
      enqueueQualitySyncItem({
        entityType: 'capa',
        entityId: String(ncr.id),
        operation: 'create-capa',
        payloadSummary: `CAPA user-triggered from NCR ${ncr.id}`,
      });
      toast.success('CAPA Created', {
        description: `Corrective action plan automatically initialized for NCR ${ncr.id}.`
      });
      navigate('/quality/capa');
    } catch (err) {
      toast.error('Failed to create CAPA');
    }
  };

  const handleCreateEightD = async (ncr: any) => {
    if (!hasDefectPermission(workflowUser, 'defect.escalate8d')) {
      toast.error('Action not available', { description: 'Your current role cannot create 8D records.' });
      return;
    }
    try {
      const eightDData = {
        subject: `8D Analysis: ${ncr.title}`,
        description: `Problem Investigation for NCR: ${ncr.id}\n${ncr.description}`,
        status: 'open',
        plantId: ncr.plantId || 'MAIN-PLANT',
        ncrReportId: ncr.id,
      };

      await unifiedEightDApi.create(eightDData);
      enqueueQualitySyncItem({
        entityType: 'eight-d',
        entityId: String(ncr.id),
        operation: 'create-8d',
        payloadSummary: `8D user-triggered from NCR ${ncr.id}`,
      });
      toast.success('8D Report Created', {
        description: `8D investigation started for NCR ${ncr.id}.`
      });
      navigate('/quality/8d');
    } catch (err) {
      toast.error('Failed to create 8D');
    }
  };

  const handleCreateImprovementAction = async (ncr: NCRItem) => {
    const confirmed = window.confirm('Create an improvement action from this NCR? You can edit the action later in the Command Center.');
    if (!confirmed) return;
    const metadata = (ncr.metadata && typeof ncr.metadata === 'object' ? ncr.metadata : {}) as Record<string, unknown>;
    const action = createImprovementAction({
      title: `Close loop for NCR ${ncr.id}`,
      description: 'Improvement action created from NCR. Verify containment, root cause notes, linked defects, and effectiveness window.',
      sourceType: 'ncr',
      sourceId: ncr.id,
      relatedNcrId: ncr.id,
      linkedDefectType: String(ncr.defectType || metadata.defectType || ''),
      linkedProductionLine: String(ncr.productionLine || metadata.productionLine || ''),
      linkedPartNumber: String(ncr.partNumber || metadata.partNumber || ''),
      linkedSupplier: String(ncr.supplierName || metadata.supplierName || ''),
      linkedCustomer: String(ncr.customerName || metadata.customerName || ''),
      actionType: 'corrective',
      priority: ncr.priority === 'critical' ? 'critical' : ncr.priority === 'high' ? 'high' : 'medium',
      status: 'open',
    });
    const relatedActionIds = Array.from(new Set([...(Array.isArray(ncr.relatedActionIds) ? ncr.relatedActionIds.map(String) : []), ...((Array.isArray(metadata.relatedActionIds) ? metadata.relatedActionIds.map(String) : [])), action.id]));
    await ncrApi.update(ncr.id, {
      relatedActionIds,
      metadata: { ...metadata, relatedActionIds, effectivenessResult: action.effectivenessResult || metadata.effectivenessResult },
    } as Partial<NcrData>);
    enqueueQualitySyncItem({
      entityType: 'ncr',
      entityId: ncr.id,
      operation: 'link-action',
      payloadSummary: `Linked improvement action ${action.id} to NCR ${ncr.id}`,
    });
    await loadNcrs();
    toast.success('Improvement action linked to NCR');
  };

  const closedLoopForNcr = (ncr: NCRItem) => buildClosedLoopSourceLinks({
    sourceType: 'ncr',
    source: ncr as unknown as NcrData,
    defects: defectRecords,
    actions: improvementActions,
    capas: linkedCapas,
    eightDs: linkedEightDs,
  });

  return (
    <PageContainer>
      <PageHeader
        title="Non-Conformance Reports"
        subtitle="Manage quality deviations and non-conformance issues"
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'NCR' }]}
        actions={{
          create: handleCreate,
          refresh: loadNcrs,
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
                  placeholder="Search NCRs by ID, title, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3E0] transition-colors"
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
                  <span className="hidden sm:inline">New NCR</span>
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            <BulkActionBar
              selectedCount={selectedIds.length}
              itemName="NCRs"
              onClearSelection={() => setSelectedIds([])}
              onDelete={() => {
                if (confirm(`Delete ${selectedIds.length} NCRs?`)) {
                  setNcrs(prev => prev.filter(n => !selectedIds.includes(n.id)));
                  setSelectedIds([]);
                  toast.success(`${selectedIds.length} NCRs deleted`);
                }
              }}
              onExport={(format) => handleExport(format, selectedIds)}
            />

            {/* Data Table */}
            <DataTable
              data={filteredNCRs}
              columns={[
                { key: 'id', title: 'NCR ID', width: '140px', sortable: true, render: (item) => (
                  <span className="text-[#00A3E0] font-mono text-sm font-medium">{item.id}</span>
                )},
                { key: 'title', title: 'Title & Description', sortable: true, render: (item) => (
                  <div>
                    <p className="text-white font-medium text-sm line-clamp-1">{item.title}</p>
                    <p className="text-gray-400 text-xs mt-1 line-clamp-1">{item.description}</p>
                  </div>
                )},
                { key: 'status', title: 'Status', width: '140px', sortable: true, render: (item) => (
                  <StatusBadge status={item.status} size="sm" />
                )},
                { key: 'priority', title: 'Priority', width: '110px', sortable: true, render: (item) => (
                  <PriorityBadge priority={item.priority} size="sm" />
                )},
                { key: 'assignedTo', title: 'Assigned To', width: '160px', sortable: true, render: (item) => (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#0066CC]/20 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-[#00A3E0]" />
                    </div>
                    <span className="text-gray-300 text-sm">{item.assignedTo}</span>
                  </div>
                )},
                { key: 'dueDate', title: 'Due Date', width: '120px', sortable: true, render: (item) => (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Calendar className="w-4 h-4" />
                    {item.dueDate}
                  </div>
                )}
              ]}
              keyExtractor={(item) => item.id}
              selectedItems={selectedIds}
              onSelectionChange={setSelectedIds}
              onRowClick={(row) => {
                setEditingNcr(row);
                setIsFormOpen(true);
              }}
              pageSize={10}
              actions={(item) => (
                <div className="flex items-center gap-1">
                  {!isLiteMode && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); handleCreateImprovementAction(item); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Create Improvement Action">
                        <Activity className="w-4 h-4 text-emerald-400" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleCreateCapa(item); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Create CAPA">
                        <ShieldAlert className="w-4 h-4 text-blue-400" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleCreateEightD(item); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Create 8D Report">
                        <ClipboardList className="w-4 h-4 text-green-400" />
                      </button>
                    </>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); setEditingNcr(item); setIsFormOpen(true); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="View">
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
                  <h3 className="text-lg font-medium text-white mb-2">No NCRs found</h3>
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
                    { value: 'open', label: 'Open', count: ncrs.filter(n => n.status === 'open').length, color: '#F59E0B' },
                    { value: 'in-progress', label: 'In Progress', count: ncrs.filter(n => n.status === 'in-progress').length, color: '#3B82F6' },
                    { value: 'pending-approval', label: 'Pending', count: ncrs.filter(n => n.status === 'pending-approval').length, color: '#8B5CF6' },
                    { value: 'closed', label: 'Closed', count: ncrs.filter(n => n.status === 'closed').length, color: '#10B981' }
                  ]},
                  { key: 'priority', title: 'Priority', multi: true, options: [
                    { value: 'critical', label: 'Critical', count: ncrs.filter(n => n.priority === 'critical').length, color: '#DC2626' },
                    { value: 'high', label: 'High', count: ncrs.filter(n => n.priority === 'high').length, color: '#F59E0B' },
                    { value: 'medium', label: 'Medium', count: ncrs.filter(n => n.priority === 'medium').length, color: '#3B82F6' },
                    { value: 'low', label: 'Low', count: ncrs.filter(n => n.priority === 'low').length, color: '#6B7280' }
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
                  {editingNcr ? 'Edit NCR' : 'Create New NCR'}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {editingNcr ? 'Edit NCR information' : 'Create a new Non-Conformance Report'}
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
                formType="ncr"
                initialValues={getInitialValues()}
                onSubmit={handleFormSubmit}
                readOnly={false}
                showSubmitButton={true}
                submitLabel={editingNcr ? 'Update NCR' : 'Create NCR'}
              />

              {editingNcr && (
                <div className="mt-6 space-y-5">
                  {(() => {
                    const closedLoop = closedLoopForNcr(editingNcr);
                    return (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-black text-white">Closed-Loop NCR Integration</h3>
                            <p className="text-xs text-white/45 mt-1">Links NCR to defects, improvement actions, CAPA, 8D, and effectiveness verification.</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => handleCreateImprovementAction(editingNcr)} className="px-3 py-2 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-200 text-xs font-black">
                              Create Improvement Action
                            </button>
                            <button type="button" onClick={() => handleCreateCapa(editingNcr)} disabled={!hasDefectPermission(workflowUser, 'defect.createCapa')} className="px-3 py-2 rounded-xl bg-[#0066CC]/20 border border-[#0066CC]/25 text-[#8be3ff] text-xs font-black disabled:opacity-40">
                              Create CAPA
                            </button>
                            <button type="button" onClick={() => handleCreateEightD(editingNcr)} disabled={!hasDefectPermission(workflowUser, 'defect.escalate8d')} className="px-3 py-2 rounded-xl bg-purple-400/10 border border-purple-400/20 text-purple-200 text-xs font-black disabled:opacity-40">
                              Escalate to 8D
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-5">
                          {[
                            ['Related Defects', closedLoop.linkedDefects.length],
                            ['Improvement Actions', closedLoop.linkedActions.length],
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
                  <QualityRelationshipManager
                    currentType="ncr"
                    currentId={editingNcr.id}
                    currentLabel={`NCR ${editingNcr.title || editingNcr.id}`}
                    canManage={hasDefectPermission(workflowUser, 'defect.edit')}
                    disabledReason="Requires edit defect permission to link or unlink quality records."
                    records={{
                      defects: defectRecords,
                      ncrs: ncrs as unknown as NcrData[],
                      capas: linkedCapas,
                      eightDs: linkedEightDs,
                      actions: improvementActions,
                    }}
                    onChanged={loadNcrs}
                  />
                  <QualityKnowledgeSuggestions
                    context={buildKnowledgeContextFromSource('ncr', editingNcr as unknown as NcrData)}
                    title="Related Lessons Learned"
                    canApply={hasDefectPermission(workflowUser, 'defect.edit')}
                  />
                  <RelatedRecords
                    currentId={editingNcr.id}
                    relations={[
                      { targetModule: 'defect-logs', filterField: 'relatedNcrId', label: 'Source Defect', icon: <FileText className="w-4 h-4" /> },
                      { targetModule: 'capa', filterField: 'sourceNcrId', label: 'Corrective Action (CAPA)', icon: <Activity className="w-4 h-4" /> },
                      { targetModule: 'eight-d', filterField: 'ncrReportId', label: '8D Investigation', icon: <ClipboardList className="w-4 h-4" /> }
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

export default NCRPage;
