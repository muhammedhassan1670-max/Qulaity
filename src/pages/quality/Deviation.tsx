// QMS Enterprise 4.0 - Deviation Page - Professional Edition
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
import { deviationApi, type DeviationData } from '../../api/deviation';
import { 
  Plus, 
  Search, 
  Filter,
  Calendar,
  User,
  X,
  Edit3,
  Eye,
  GitPullRequest
} from 'lucide-react';

interface Deviation {
  id: string;
  deviationId: string;
  title: string;
  description: string;
  deviationType: 'temporary' | 'permanent' | 'emergency';
  status: 'draft' | 'submitted' | 'under-review' | 'approved' | 'rejected' | 'expired';
  riskLevel: 'low' | 'medium' | 'high';
  requestor: string;
  requestDate: string;
  effectiveDate: string;
  expiryDate?: string;
  processName: string;
  productName: string;
  approvers: string[];
  [key: string]: unknown;
}

const mockDeviations: Deviation[] = [];

function generateDevNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `DEV-${year}-${random}`;
}

const typeConfig = {
  'temporary': { color: 'bg-blue-500/20 text-blue-400', label: 'Temporary' },
  'permanent': { color: 'bg-purple-500/20 text-purple-400', label: 'Permanent' },
  'emergency': { color: 'bg-red-500/20 text-red-400', label: 'Emergency' }
};

const riskConfig = {
  'low': { color: 'bg-green-500 text-white', label: 'Low' },
  'medium': { color: 'bg-yellow-500 text-black', label: 'Medium' },
  'high': { color: 'bg-red-500 text-white', label: 'High' }
};

export function DeviationPage() {
  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});
  const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDeviation, setEditingDeviation] = useState<Deviation | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const createPrefill = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const title = params.get('title');
    const description = params.get('description');
    const deviationType = params.get('deviationType');
    const open = params.get('create') === '1' || !!title || !!description;

    return {
      open,
      values: {
        title: title ?? undefined,
        deviationDescription: description ?? undefined,
        deviationType: deviationType ?? undefined,
      } satisfies Record<string, unknown>,
    };
  }, [location.search]);

  useEffect(() => {
    loadDeviations();
  }, []);

  const loadDeviations = async () => {
    try {
      setIsLoading(true);
      const response = await deviationApi.getAll();
      const transformed = response.data.map((dev: any) => ({
        id: dev.id,
        deviationId: dev.deviationNumber || dev.deviationId || dev.id,
        title: dev.title,
        description: dev.description,
        deviationType: (dev.type || dev.deviationType || 'temporary').toLowerCase(),
        status: String(dev.status || 'draft').toLowerCase().replace('_', '-'),
        riskLevel: String(dev.riskLevel || dev.risk || 'low').toLowerCase(),
        requestor: dev.requestor || dev.requestedBy?.name || dev.requestedById || 'Unassigned',
        requestDate: dev.startDate?.split('T')[0] || dev.requestDate || dev.createdAt?.split('T')[0],
        effectiveDate: dev.startDate?.split('T')[0] || dev.effectiveDate || dev.createdAt?.split('T')[0],
        expiryDate: dev.endDate?.split('T')[0] || dev.expiryDate,
        processName: dev.processName || '',
        productName: dev.productName || '',
        approvers: dev.approvers || [],
        ...dev,
      }));
      setDeviations(transformed);
    } catch (err) {
      setDeviations(mockDeviations);
      toast.info('Backend unavailable - no records loaded');
    } finally {
      setIsLoading(false);
    }
  };

  // Support deep-link /deviation/:id by opening the modal
  useEffect(() => {
    const id = params.id;
    if (!id) return;
    const found = deviations.find((d) => d.id === id);
    if (found) {
      setEditingDeviation(found);
      setIsFormOpen(true);
    }
  }, [params.id, deviations]);

  useEffect(() => {
    if (!createPrefill.open) return;
    setEditingDeviation(null);
    setIsFormOpen(true);
  }, [createPrefill.open]);

  const stats = [
    { label: 'Pending Review', value: deviations.filter(d => d.status === 'submitted' || d.status === 'under-review').length, change: '0', trend: 'neutral' as const },
    { label: 'Active Deviations', value: deviations.filter(d => d.status === 'approved').length, change: '0', trend: 'neutral' as const },
    { label: 'Expiring Soon', value: deviations.filter(d => d.expiryDate && new Date(d.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && d.status === 'approved').length, change: '0', trend: 'neutral' as const },
    { label: 'High Risk', value: deviations.filter(d => d.riskLevel === 'high' && d.status !== 'rejected').length, change: '0', trend: 'neutral' as const }
  ];

  const filteredDeviations = deviations.filter(deviation => {
    const matchesSearch = !searchQuery || 
      deviation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deviation.deviationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deviation.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const statusFilter = activeFilters['status'] as string[];
    const matchesStatus = !statusFilter || statusFilter.length === 0 || statusFilter.includes(deviation.status);
    
    const typeFilter = activeFilters['deviationType'] as string[];
    const matchesType = !typeFilter || typeFilter.length === 0 || typeFilter.includes(deviation.deviationType);
    
    const riskFilter = activeFilters['riskLevel'] as string[];
    const matchesRisk = !riskFilter || riskFilter.length === 0 || riskFilter.includes(deviation.riskLevel);
    
    return matchesSearch && matchesStatus && matchesType && matchesRisk;
  });

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title="Deviations"
          subtitle="Manage temporary and permanent deviations"
          breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'Deviation' }]}
          actions={{
            create: () => {
              setEditingDeviation(null);
              setIsFormOpen(true);
            },
            refresh: loadDeviations,
          }}
        />
        <div className="p-8 text-center text-gray-400">Loading deviations...</div>
      </PageContainer>
    );
  }

  const handleCreate = () => {
    setEditingDeviation(null);
    setIsFormOpen(true);
  };

  const handleEdit = (deviation: Deviation) => {
    setEditingDeviation(deviation);
    setIsFormOpen(true);
  };


  const handleFormSubmit = async (data: Record<string, unknown>) => {
    try {
      const payload: DeviationData = {
        title: (data.title as string) || 'Deviation',
        description: (data.deviationDescription as string) || (data.description as string) || (data.title as string) || '',
        type: (data.deviationType as string) || 'temporary',
        category: (data.category as string) || 'unplanned',
        status: (data.status as string) || 'draft',
        processName: (data.processName as string) || undefined,
        productName: (data.productName as string) || undefined,
        startDate: (data.effectiveDate as string) || (data.startDate as string) || undefined,
        endDate: (data.expiryDate as string) || (data.endDate as string) || undefined,
        metadata: data,
      };

      if (editingDeviation) {
        await deviationApi.update(editingDeviation.id, payload);
        toast.success('Deviation request updated successfully');
      } else {
        await deviationApi.create(payload as any);
        toast.success('Deviation request created successfully');
      }

      await loadDeviations();
      setIsFormOpen(false);
      setEditingDeviation(null);
      if (params.id) {
        navigate('/deviation', { replace: true });
      }
    } catch (err) {
      toast.error(editingDeviation ? 'Failed to update deviation request' : 'Failed to create deviation request');
    }
  };

  const getInitialValues = () => {
    if (editingDeviation) {
      return editingDeviation;
    }
    return {
      deviationId: generateDevNumber(),
      requestDate: new Date().toISOString().split('T')[0],
      effectiveDate: new Date().toISOString().split('T')[0],
      status: 'draft',
      ...createPrefill.values,
    };
  };

  return (
    <PageContainer>
      <PageHeader
        title="Deviation Management"
        subtitle="Manage temporary and permanent deviations from specifications"
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'Deviation' }]}
        actions={{
          create: handleCreate,
          refresh: loadDeviations
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
                  placeholder="Search deviations..."
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
                  <span className="hidden sm:inline">Request Deviation</span>
                </button>
              </div>
            </div>

            <BulkActionBar
              selectedCount={selectedIds.length}
              itemName="Deviation Requests"
              onClearSelection={() => setSelectedIds([])}
              onExport={(format) => toast.success(`Exporting ${selectedIds.length || filteredDeviations.length} as ${format.toUpperCase()}...`)}
            />

            <DataTable
              data={filteredDeviations}
              columns={[
                { key: 'deviationId', title: 'Deviation ID', width: '140px', sortable: true, render: (item) => (
                  <span className="text-[#00A3E0] font-mono text-sm font-medium">{item.deviationId}</span>
                )},
                { key: 'title', title: 'Title & Description', sortable: true, render: (item) => (
                  <div>
                    <p className="text-white font-medium text-sm line-clamp-1">{item.title}</p>
                    <p className="text-gray-400 text-xs mt-1 line-clamp-1">{item.description}</p>
                  </div>
                )},
                { key: 'deviationType', title: 'Type', width: '110px', sortable: true, render: (item) => (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeConfig[item.deviationType].color}`}>
                    {typeConfig[item.deviationType].label}
                  </span>
                )},
                { key: 'status', title: 'Status', width: '130px', sortable: true, render: (item) => (
                  <StatusBadge status={item.status} size="sm" />
                )},
                { key: 'riskLevel', title: 'Risk', width: '90px', sortable: true, render: (item) => (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${riskConfig[item.riskLevel].color}`}>
                    {riskConfig[item.riskLevel].label}
                  </span>
                )},
                { key: 'expiryDate', title: 'Valid Until', width: '130px', sortable: true, render: (item) => (
                  item.expiryDate ? (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      {item.expiryDate}
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">Permanent</span>
                  )
                )},
                { key: 'requestor', title: 'Requestor', width: '150px', sortable: true, render: (item) => (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#0066CC]/20 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-[#00A3E0]" />
                    </div>
                    <span className="text-gray-300 text-sm">{item.requestor}</span>
                  </div>
                )}
              ]}
              keyExtractor={(item) => item.id}
              selectedItems={selectedIds}
              onSelectionChange={setSelectedIds}
              onRowClick={(row) => {
                setEditingDeviation(row);
                setIsFormOpen(true);
              }}
              pageSize={10}
              actions={(item) => (
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); setEditingDeviation(item); setIsFormOpen(true); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="View">
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
                    <GitPullRequest className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No deviations found</h3>
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
                    { value: 'draft', label: 'Draft', count: deviations.filter(d => d.status === 'draft').length, color: '#6B7280' },
                    { value: 'submitted', label: 'Submitted', count: deviations.filter(d => d.status === 'submitted').length, color: '#3B82F6' },
                    { value: 'under-review', label: 'Under Review', count: deviations.filter(d => d.status === 'under-review').length, color: '#F59E0B' },
                    { value: 'approved', label: 'Approved', count: deviations.filter(d => d.status === 'approved').length, color: '#10B981' },
                    { value: 'rejected', label: 'Rejected', count: deviations.filter(d => d.status === 'rejected').length, color: '#DC2626' },
                    { value: 'expired', label: 'Expired', count: deviations.filter(d => d.status === 'expired').length, color: '#6B7280' }
                  ]},
                  { key: 'deviationType', title: 'Deviation Type', multi: true, options: [
                    { value: 'temporary', label: 'Temporary', count: deviations.filter(d => d.deviationType === 'temporary').length, color: '#3B82F6' },
                    { value: 'permanent', label: 'Permanent', count: deviations.filter(d => d.deviationType === 'permanent').length, color: '#A855F7' },
                    { value: 'emergency', label: 'Emergency', count: deviations.filter(d => d.deviationType === 'emergency').length, color: '#DC2626' }
                  ]},
                  { key: 'riskLevel', title: 'Risk Level', multi: true, options: [
                    { value: 'low', label: 'Low', count: deviations.filter(d => d.riskLevel === 'low').length, color: '#22C55E' },
                    { value: 'medium', label: 'Medium', count: deviations.filter(d => d.riskLevel === 'medium').length, color: '#EAB308' },
                    { value: 'high', label: 'High', count: deviations.filter(d => d.riskLevel === 'high').length, color: '#DC2626' }
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
                  {editingDeviation ? 'Edit Deviation Request' : 'Create New Deviation Request'}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {editingDeviation ? 'Edit deviation request information' : 'Submit a new deviation request'}
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
                formType="deviation"
                initialValues={getInitialValues()}
                onSubmit={handleFormSubmit}
                readOnly={false}
                showSubmitButton={true}
                submitLabel={editingDeviation ? 'Update Deviation Request' : 'Create Deviation Request'}
              />

              {editingDeviation && (
                <div className="mt-8 border-t border-white/10 pt-6">
                  <QualityRelationshipManager
                    currentType="deviation"
                    currentId={editingDeviation.id}
                    currentLabel={`Deviation: ${editingDeviation.title || editingDeviation.id}`}
                    onChanged={loadDeviations}
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

export default DeviationPage;
