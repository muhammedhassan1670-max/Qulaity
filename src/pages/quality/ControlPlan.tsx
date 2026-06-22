// QMS Enterprise 4.0 - Control Plan Page - Professional Edition
import { useState, useEffect, useMemo } from 'react';
import { PageHeader, PageContainer, PageSection, StatsBar } from '../../components/PageHeader';
import DynamicFormRenderer from '../../components/DynamicFormRenderer';
import QualityRelationshipManager from '../../components/QualityRelationshipManager';
import { DataTable } from '../../components/DataTable';
import { FilterPanel } from '../../components/FilterPanel';
import { BulkActionBar } from '../../components/BulkActionBar';
import { StatusBadge } from '../../components/StatusBadge';
import { toast } from 'sonner';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { controlPlanApi, type ControlPlanData } from '../../api/control-plan';
import { 
  Plus, 
  Search, 
  Filter,
  User,
  X,
  Edit3,
  Eye,
  ScanLine
} from 'lucide-react';

interface ControlPlan {
  id: string;
  controlPlanId: string;
  controlPlanType: 'prototype' | 'pre-launch' | 'production';
  partNumber: string;
  partName: string;
  revision: string;
  date: string;
  processNumber: string;
  operationName: string;
  machineDevice?: string;
  characteristicNumber?: string;
  productCharacteristic: string;
  processCharacteristic?: string;
  specification: string;
  tolerance?: string;
  evaluationMethod: string;
  sampleSize: string;
  frequency: 'continuous' | 'every-unit' | 'hourly' | 'shift' | 'daily' | 'weekly' | 'batch';
  controlMethodType: 'spc' | 'checklist' | 'error-proofing' | 'gauge' | 'visual' | 'attribute' | 'variable';
  responsible: string;
  reactionPlanDesc: string;
  correctiveActionRequired: boolean;
  escalationProcedure?: string;
  status: 'draft' | 'active' | 'under-review' | 'obsolete';
  [key: string]: unknown;
}

export const mockControlPlans: ControlPlan[] = [];

function generateCPNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `CP-${year}-${random}`;
}

const typeConfig = {
  'prototype': { color: 'bg-purple-500/20 text-purple-400', label: 'Prototype' },
  'pre-launch': { color: 'bg-orange-500/20 text-orange-400', label: 'Pre-Launch' },
  'production': { color: 'bg-green-500/20 text-green-400', label: 'Production' }
};

const controlMethodConfig = {
  'spc': { color: 'bg-blue-500/20 text-blue-400', label: 'SPC Chart' },
  'checklist': { color: 'bg-gray-500/20 text-gray-400', label: 'Checklist' },
  'error-proofing': { color: 'bg-green-500/20 text-green-400', label: 'Poka-Yoke' },
  'gauge': { color: 'bg-cyan-500/20 text-cyan-400', label: 'Gauge' },
  'visual': { color: 'bg-yellow-500/20 text-yellow-400', label: 'Visual' },
  'attribute': { color: 'bg-pink-500/20 text-pink-400', label: 'Attribute' },
  'variable': { color: 'bg-indigo-500/20 text-indigo-400', label: 'Variable' }
};

export function ControlPlanPage() {
  const [controlPlans, setControlPlans] = useState<ControlPlan[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});
  const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingControlPlan, setEditingControlPlan] = useState<ControlPlan | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const createPrefill = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const partNumber = params.get('partNumber');
    const partName = params.get('partName');
    const open = params.get('create') === '1' || !!partNumber || !!partName;

    return {
      open,
      values: {
        partNumber: partNumber ?? undefined,
        partName: partName ?? undefined,
      } satisfies Record<string, unknown>,
    };
  }, [location.search]);

  const loadControlPlans = async () => {
    try {
      setIsLoading(true);
      const response = await controlPlanApi.getAll();
      const transformed = response.data.map((cp: any) => ({
        id: cp.id,
        controlPlanId: cp.controlPlanId || cp.controlPlanNumber || cp.id,
        controlPlanType: (cp.controlPlanType || cp.type || 'production').toLowerCase(),
        partNumber: cp.partNumber || cp.productCode || '',
        partName: cp.partName || cp.productName || '',
        revision: cp.revision || 'Rev. A',
        date: cp.date || cp.createdAt?.split('T')[0],
        processNumber: cp.processNumber || '',
        operationName: cp.operationName || cp.operation || cp.title || '',
        machineDevice: cp.machineDevice,
        characteristicNumber: cp.characteristicNumber,
        productCharacteristic: cp.productCharacteristic || '',
        processCharacteristic: cp.processCharacteristic,
        specification: cp.specification || '',
        tolerance: cp.tolerance,
        evaluationMethod: cp.evaluationMethod || '',
        sampleSize: cp.sampleSize || '',
        frequency: (cp.frequency || 'hourly').toLowerCase(),
        controlMethodType: (cp.controlMethodType || 'spc').toLowerCase(),
        responsible: cp.responsible || cp.preparedBy?.name || cp.preparedById || 'Unassigned',
        reactionPlanDesc: cp.reactionPlanDesc || '',
        correctiveActionRequired: !!cp.correctiveActionRequired,
        escalationProcedure: cp.escalationProcedure,
        status: String(cp.status || 'draft').toLowerCase().replace('_', '-') as any,
        ...cp,
      }));
      setControlPlans(transformed);
    } catch (err) {
      setControlPlans(mockControlPlans);
      toast.info('Backend unavailable - no records loaded');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadControlPlans();
  }, []);

  // Support deep-link /control-plan/:id by opening the modal
  useEffect(() => {
    if (isLoading) return;
    const id = params.id;
    if (!id) return;
    const found = controlPlans.find((c) => c.id === id);
    if (found) {
      setEditingControlPlan(found);
      setIsFormOpen(true);
    }
  }, [params.id, controlPlans, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    if (!createPrefill.open) return;
    setEditingControlPlan(null);
    setIsFormOpen(true);
  }, [createPrefill.open, isLoading]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-72">
          <div className="text-gray-400">Loading control plans...</div>
        </div>
      </PageContainer>
    );
  }

  const stats = [
    { label: 'Active Control Plans', value: controlPlans.filter(cp => cp.status === 'active').length, change: '0', trend: 'neutral' as const },
    { label: 'SPC Monitored', value: controlPlans.filter(cp => cp.controlMethodType === 'spc' && cp.status === 'active').length, change: '0', trend: 'neutral' as const },
    { label: 'Production', value: controlPlans.filter(cp => cp.controlPlanType === 'production').length, change: '0', trend: 'neutral' as const },
    { label: 'Draft', value: controlPlans.filter(cp => cp.status === 'draft').length, change: '0', trend: 'neutral' as const }
  ];

  const filteredControlPlans = controlPlans.filter(cp => {
    const matchesSearch = !searchQuery || 
      cp.partNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cp.partName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cp.productCharacteristic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cp.operationName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const statusFilter = activeFilters['status'] as string[];
    const matchesStatus = !statusFilter || statusFilter.length === 0 || statusFilter.includes(cp.status);
    
    const typeFilter = activeFilters['controlPlanType'] as string[];
    const matchesType = !typeFilter || typeFilter.length === 0 || typeFilter.includes(cp.controlPlanType);
    
    const methodFilter = activeFilters['controlMethodType'] as string[];
    const matchesMethod = !methodFilter || methodFilter.length === 0 || methodFilter.includes(cp.controlMethodType);
    
    return matchesSearch && matchesStatus && matchesType && matchesMethod;
  });

  const handleCreate = () => {
    setEditingControlPlan(null);
    setIsFormOpen(true);
  };

  const handleEdit = (cp: ControlPlan) => {
    setEditingControlPlan(cp);
    setIsFormOpen(true);
  };


  const handleFormSubmit = async (data: Record<string, unknown>) => {
    try {
      const payload: ControlPlanData = {
        title: (data.operationName as string) || (data.title as string),
        productName: (data.partName as string) || (data.productName as string),
        status: (data.status as string) || 'draft',
        plantId: (data.plantId as string) || '1',
        departmentId: data.departmentId as string,
        metadata: data,
      };

      if (editingControlPlan) {
        await controlPlanApi.update(editingControlPlan.id, payload as any);
        toast.success('Control plan updated successfully');
      } else {
        await controlPlanApi.create(payload as any);
        toast.success('Control plan created successfully');
      }

      await loadControlPlans();
      setIsFormOpen(false);
      setEditingControlPlan(null);
      if (params.id) {
        navigate('/control-plan', { replace: true });
      }
    } catch (err) {
      toast.error(editingControlPlan ? 'Failed to update control plan' : 'Failed to create control plan');
    }
  };

  const getInitialValues = () => {
    if (editingControlPlan) {
      return editingControlPlan;
    }
    return {
      controlPlanId: generateCPNumber(),
      date: new Date().toISOString().split('T')[0],
      revision: 'Rev. A',
      status: 'draft',
      ...createPrefill.values,
    };
  };

  return (
    <PageContainer>
      <PageHeader
        title="Control Plan"
        subtitle="Define and manage process controls for quality assurance"
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'Control Plan' }]}
        actions={{
          create: handleCreate,
          refresh: loadControlPlans
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
                  placeholder="Search control plans..."
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
                  <span className="hidden sm:inline">New Control Plan</span>
                </button>
              </div>
            </div>

            <BulkActionBar
              selectedCount={selectedIds.length}
              itemName="Control Plans"
              onClearSelection={() => setSelectedIds([])}
              onExport={(format) => toast.success(`Exporting ${selectedIds.length || filteredControlPlans.length} as ${format.toUpperCase()}...`)}
            />

            <DataTable
              data={filteredControlPlans}
              columns={[
                { key: 'controlPlanId', title: 'Control Plan ID', width: '140px', sortable: true, render: (item) => (
                  <span className="text-[#00A3E0] font-mono text-sm font-medium">{item.controlPlanId}</span>
                )},
                { key: 'partInfo', title: 'Part Information', sortable: true, render: (item) => (
                  <div>
                    <p className="text-white font-medium text-sm">{item.partNumber} - {item.partName}</p>
                    <p className="text-gray-400 text-xs mt-1">{item.operationName}</p>
                  </div>
                )},
                { key: 'controlPlanType', title: 'Type', width: '110px', sortable: true, render: (item) => (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeConfig[item.controlPlanType].color}`}>
                    {typeConfig[item.controlPlanType].label}
                  </span>
                )},
                { key: 'productCharacteristic', title: 'Characteristic', sortable: true, render: (item) => (
                  <div>
                    <p className="text-white text-sm">{item.productCharacteristic}</p>
                    <p className="text-gray-400 text-xs">{item.specification}</p>
                  </div>
                )},
                { key: 'controlMethodType', title: 'Method', width: '110px', sortable: true, render: (item) => (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${controlMethodConfig[item.controlMethodType].color}`}>
                    {controlMethodConfig[item.controlMethodType].label}
                  </span>
                )},
                { key: 'status', title: 'Status', width: '110px', sortable: true, render: (item) => (
                  <StatusBadge status={item.status} size="sm" />
                )},
                { key: 'frequency', title: 'Frequency', width: '100px', sortable: true, render: (item) => (
                  <span className="text-gray-300 text-sm capitalize">{item.frequency?.replace('-', ' ')}</span>
                )},
                { key: 'responsible', title: 'Responsible', width: '150px', sortable: true, render: (item) => (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#0066CC]/20 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-[#00A3E0]" />
                    </div>
                    <span className="text-gray-300 text-sm">{item.responsible}</span>
                  </div>
                )}
              ]}
              keyExtractor={(item) => item.id}
              selectedItems={selectedIds}
              onSelectionChange={setSelectedIds}
              onRowClick={(row) => {
                setEditingControlPlan(row);
                setIsFormOpen(true);
              }}
              pageSize={10}
              actions={(item) => (
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); setEditingControlPlan(item); setIsFormOpen(true); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="View">
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
                    <ScanLine className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No control plans found</h3>
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
                    { value: 'draft', label: 'Draft', count: controlPlans.filter(cp => cp.status === 'draft').length, color: '#6B7280' },
                    { value: 'active', label: 'Active', count: controlPlans.filter(cp => cp.status === 'active').length, color: '#10B981' },
                    { value: 'under-review', label: 'Under Review', count: controlPlans.filter(cp => cp.status === 'under-review').length, color: '#F59E0B' },
                    { value: 'obsolete', label: 'Obsolete', count: controlPlans.filter(cp => cp.status === 'obsolete').length, color: '#DC2626' }
                  ]},
                  { key: 'controlPlanType', title: 'Control Plan Type', multi: true, options: [
                    { value: 'prototype', label: 'Prototype', count: controlPlans.filter(cp => cp.controlPlanType === 'prototype').length, color: '#A855F7' },
                    { value: 'pre-launch', label: 'Pre-Launch', count: controlPlans.filter(cp => cp.controlPlanType === 'pre-launch').length, color: '#F97316' },
                    { value: 'production', label: 'Production', count: controlPlans.filter(cp => cp.controlPlanType === 'production').length, color: '#22C55E' }
                  ]},
                  { key: 'controlMethodType', title: 'Control Method', multi: true, options: [
                    { value: 'spc', label: 'SPC Chart', count: controlPlans.filter(cp => cp.controlMethodType === 'spc').length, color: '#3B82F6' },
                    { value: 'checklist', label: 'Checklist', count: controlPlans.filter(cp => cp.controlMethodType === 'checklist').length, color: '#6B7280' },
                    { value: 'error-proofing', label: 'Poka-Yoke', count: controlPlans.filter(cp => cp.controlMethodType === 'error-proofing').length, color: '#22C55E' },
                    { value: 'gauge', label: 'Gauge', count: controlPlans.filter(cp => cp.controlMethodType === 'gauge').length, color: '#06B6D4' },
                    { value: 'visual', label: 'Visual', count: controlPlans.filter(cp => cp.controlMethodType === 'visual').length, color: '#EAB308' }
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
          <div className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-[#0a0a0f]">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {editingControlPlan ? 'Edit Control Plan' : 'Create New Control Plan'}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {editingControlPlan ? 'Edit control plan information' : 'Define a new process control plan'}
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
                formType="control-plan"
                initialValues={getInitialValues()}
                onSubmit={handleFormSubmit}
                readOnly={false}
                showSubmitButton={true}
                submitLabel={editingControlPlan ? 'Update Control Plan' : 'Create Control Plan'}
              />

              {editingControlPlan && (
                <div className="mt-8 border-t border-white/10 pt-6">
                  <QualityRelationshipManager
                    currentType="control-plan"
                    currentId={editingControlPlan.id}
                    currentLabel={`Control Plan: ${editingControlPlan.partName || editingControlPlan.id}`}
                    onChanged={loadControlPlans}
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

export default ControlPlanPage;
