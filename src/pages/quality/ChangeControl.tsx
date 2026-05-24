// QMS Enterprise 4.0 - Change Control Page - Professional Edition
import { useState, useEffect, useMemo } from 'react';
import { PageHeader, PageContainer, PageSection, StatsBar } from '../../components/PageHeader';
import DynamicFormRenderer from '../../components/DynamicFormRenderer';
import { DataTable } from '../../components/DataTable';
import { FilterPanel } from '../../components/FilterPanel';
import { BulkActionBar } from '../../components/BulkActionBar';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { toast } from 'sonner';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { changeControlApi, type ChangeControlData } from '../../api/change-control';
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
  Workflow
} from 'lucide-react';
import { QualityEngine } from '../../services/qualityEngine';

interface ChangeRequest {
  id: string;
  changeRequestId: string;
  title: string;
  description: string;
  changeType: 'process' | 'product' | 'document' | 'system' | 'supplier' | 'equipment';
  changeCategory: 'minor' | 'major' | 'critical';
  status: 'draft' | 'proposed' | 'pending-review' | 'approved' | 'implemented' | 'closed' | 'rejected';
  priority: 'critical' | 'high' | 'medium' | 'low';
  proposedBy: string;
  proposedDate: string;
  targetDate: string;
  approvers: string[];
  affectedProduct?: string;
  affectedProcess?: string;
  [key: string]: unknown;
}

const mockChanges: ChangeRequest[] = [];

function generateCCNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `CC-${year}-${random}`;
}

const typeConfig = {
  'process': { color: 'bg-purple-500/20 text-purple-400', label: 'Process' },
  'product': { color: 'bg-pink-500/20 text-pink-400', label: 'Product' },
  'document': { color: 'bg-blue-500/20 text-blue-400', label: 'Document' },
  'system': { color: 'bg-cyan-500/20 text-cyan-400', label: 'System' },
  'supplier': { color: 'bg-orange-500/20 text-orange-400', label: 'Supplier' },
  'equipment': { color: 'bg-green-500/20 text-green-400', label: 'Equipment' }
};

const categoryConfig = {
  'minor': { color: 'bg-gray-500 text-white', label: 'Minor' },
  'major': { color: 'bg-yellow-500 text-black', label: 'Major' },
  'critical': { color: 'bg-red-500 text-white', label: 'Critical' }
};

export function ChangeControlPage() {
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});
  const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChange, setEditingChange] = useState<ChangeRequest | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const createPrefill = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const title = params.get('title');
    const description = params.get('description');
    const changeType = params.get('changeType');
    const open = params.get('create') === '1' || !!title || !!description;

    return {
      open,
      values: {
        changeTitle: title ?? undefined,
        proposedChange: description ?? undefined,
        changeType: changeType ?? undefined,
      } satisfies Record<string, unknown>,
    };
  }, [location.search]);

  const loadChanges = async () => {
    try {
      setIsLoading(true);
      const response = await changeControlApi.getAll();
      const transformed = response.data.map((chg: any) => ({
        id: chg.id,
        changeRequestId: chg.changeNumber || chg.changeRequestId || chg.id,
        title: chg.title,
        description: chg.description,
        changeType: (chg.type || chg.changeType || 'process').toLowerCase(),
        changeCategory: (chg.category || chg.changeCategory || 'minor').toLowerCase(),
        status: String(chg.status || 'draft').toLowerCase().replace('_', '-'),
        priority: String(chg.priority || 'medium').toLowerCase(),
        proposedBy: chg.proposedBy || chg.requestedBy?.name || chg.requestedById || 'Unassigned',
        proposedDate: chg.requestDate?.split('T')[0] || chg.proposedDate || chg.createdAt?.split('T')[0],
        targetDate: chg.targetDate?.split('T')[0] || chg.targetDate,
        approvers: chg.approvers || (chg.approvals ? chg.approvals.map((a: any) => a.approverId) : []),
        affectedProduct: chg.affectedProduct,
        affectedProcess: chg.affectedProcess,
        ...chg,
      }));
      setChanges(transformed);
    } catch (err) {
      setChanges(mockChanges);
      toast.info('Backend unavailable - no records loaded');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChanges();
  }, []);

  // Support deep-link /change-control/:id by opening the modal
  useEffect(() => {
    if (isLoading) return;
    const id = params.id;
    if (!id) return;
    const found = changes.find((c) => c.id === id);
    if (found) {
      setEditingChange(found);
      setIsFormOpen(true);
    }
  }, [params.id, changes, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    if (!createPrefill.open) return;
    setEditingChange(null);
    setIsFormOpen(true);
  }, [createPrefill.open, isLoading]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-72">
          <div className="text-gray-400">Loading change control...</div>
        </div>
      </PageContainer>
    );
  }

  const stats = [
    { label: 'Pending Review', value: changes.filter(c => c.status === 'pending-review').length, change: '0', trend: 'neutral' as const },
    { label: 'Approved', value: changes.filter(c => c.status === 'approved').length, change: '0', trend: 'neutral' as const },
    { label: 'In Implementation', value: changes.filter(c => c.status === 'implemented').length, change: '0', trend: 'neutral' as const },
    { label: 'Total Active', value: changes.filter(c => c.status !== 'closed' && c.status !== 'rejected').length, change: '0', trend: 'neutral' as const }
  ];

  const filteredChanges = changes.filter(change => {
    const matchesSearch = !searchQuery || 
      change.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      change.changeRequestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      change.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const statusFilter = activeFilters['status'] as string[];
    const matchesStatus = !statusFilter || statusFilter.length === 0 || statusFilter.includes(change.status);
    
    const typeFilter = activeFilters['changeType'] as string[];
    const matchesType = !typeFilter || typeFilter.length === 0 || typeFilter.includes(change.changeType);
    
    const categoryFilter = activeFilters['changeCategory'] as string[];
    const matchesCategory = !categoryFilter || categoryFilter.length === 0 || categoryFilter.includes(change.changeCategory);
    
    const priorityFilter = activeFilters['priority'] as string[];
    const matchesPriority = !priorityFilter || priorityFilter.length === 0 || priorityFilter.includes(change.priority);
    
    return matchesSearch && matchesStatus && matchesType && matchesCategory && matchesPriority;
  });

  const handleCreate = () => {
    setEditingChange(null);
    setIsFormOpen(true);
  };

  const handleEdit = (change: ChangeRequest) => {
    setEditingChange(change);
    setIsFormOpen(true);
  };

  const handleDelete = async (changeId: string) => {
    if (confirm('Are you sure you want to delete this change request?')) {
      try {
        await changeControlApi.delete(changeId);
        await loadChanges();
        toast.success('Change request deleted successfully');
      } catch (err) {
        toast.error('Failed to delete change request');
      }
    }
  };

  const handleApproveChange = async (change: ChangeRequest) => {
    try {
      await QualityEngine.approveChangeControl(change.id);
      await loadChanges();
      toast.success('Change Approved', {
        description: `Change Request ${change.changeRequestId} approved. Notification and integration dispatch started.`
      });
    } catch (err) {
      toast.error('Failed to approve change');
    }
  };

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    try {
      const payload: ChangeControlData = {
        title: (data.changeTitle as string) || (data.title as string) || 'Change Request',
        description: (data.proposedChange as string) || (data.description as string) || (data.changeTitle as string) || '',
        status: (data.status as string) || 'draft',
        type: (data.changeType as string) || 'process',
        category: (data.changeCategory as string) || 'minor',
        priority: (data.priority as string) || 'medium',
        targetDate: data.targetDate as string,
        requestDate: data.proposedDate as string,
        metadata: data,
      };

      if (editingChange) {
        await changeControlApi.update(editingChange.id, payload as any);
        toast.success('Change request updated successfully');
      } else {
        await changeControlApi.create(payload as any);
        toast.success('Change request created successfully');
      }

      await loadChanges();
      setIsFormOpen(false);
      setEditingChange(null);
      if (params.id) {
        navigate('/change-control', { replace: true });
      }
    } catch (err) {
      toast.error(editingChange ? 'Failed to update change request' : 'Failed to create change request');
    }
  };

  const getInitialValues = () => {
    if (editingChange) {
      return editingChange;
    }
    return {
      changeRequestId: generateCCNumber(),
      proposedDate: new Date().toISOString().split('T')[0],
      status: 'draft',
      ...createPrefill.values,
    };
  };

  return (
    <PageContainer>
      <PageHeader
        title="Change Control"
        subtitle="Manage changes to processes, products, documents, and systems"
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'Change Control' }]}
        actions={{
          create: handleCreate,
          refresh: loadChanges
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
                  placeholder="Search change requests..."
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
                  <span className="hidden sm:inline">New Change Request</span>
                </button>
              </div>
            </div>

            <BulkActionBar
              selectedCount={selectedIds.length}
              itemName="Change Requests"
              onClearSelection={() => setSelectedIds([])}
              onDelete={() => {
                if (confirm(`Delete ${selectedIds.length} change requests?`)) {
                  setChanges(prev => prev.filter(c => !selectedIds.includes(c.id)));
                  setSelectedIds([]);
                  toast.success(`${selectedIds.length} change requests deleted`);
                }
              }}
              onExport={(format) => toast.success(`Exporting ${selectedIds.length || filteredChanges.length} as ${format.toUpperCase()}...`)}
            />

            <DataTable
              data={filteredChanges}
              columns={[
                { key: 'changeRequestId', title: 'Request ID', width: '140px', sortable: true, render: (item) => (
                  <span className="text-[#00A3E0] font-mono text-sm font-medium">{item.changeRequestId}</span>
                )},
                { key: 'title', title: 'Title & Description', sortable: true, render: (item) => (
                  <div>
                    <p className="text-white font-medium text-sm line-clamp-1">{item.title}</p>
                    <p className="text-gray-400 text-xs mt-1 line-clamp-1">{item.description}</p>
                  </div>
                )},
                { key: 'changeType', title: 'Type', width: '120px', sortable: true, render: (item) => (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeConfig[item.changeType].color}`}>
                    {typeConfig[item.changeType].label}
                  </span>
                )},
                { key: 'changeCategory', title: 'Category', width: '100px', sortable: true, render: (item) => (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryConfig[item.changeCategory].color}`}>
                    {categoryConfig[item.changeCategory].label}
                  </span>
                )},
                { key: 'status', title: 'Status', width: '140px', sortable: true, render: (item) => (
                  <StatusBadge status={item.status} size="sm" />
                )},
                { key: 'priority', title: 'Priority', width: '110px', sortable: true, render: (item) => (
                  <PriorityBadge priority={item.priority} size="sm" />
                )},
                { key: 'proposedBy', title: 'Proposed By', width: '150px', sortable: true, render: (item) => (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#0066CC]/20 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-[#00A3E0]" />
                    </div>
                    <span className="text-gray-300 text-sm">{item.proposedBy}</span>
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
                setEditingChange(row);
                setIsFormOpen(true);
              }}
              pageSize={10}
              actions={(item) => (
                <div className="flex items-center gap-1">
                  {item.status !== 'approved' && item.status !== 'implemented' && item.status !== 'closed' && (
                    <button onClick={(e) => { e.stopPropagation(); handleApproveChange(item); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Approve Fast-Track">
                      <Workflow className="w-4 h-4 text-green-400" />
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); setEditingChange(item); setIsFormOpen(true); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="View">
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
                    <Workflow className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No change requests found</h3>
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
                    { value: 'draft', label: 'Draft', count: changes.filter(c => c.status === 'draft').length, color: '#6B7280' },
                    { value: 'proposed', label: 'Proposed', count: changes.filter(c => c.status === 'proposed').length, color: '#3B82F6' },
                    { value: 'pending-review', label: 'Pending Review', count: changes.filter(c => c.status === 'pending-review').length, color: '#F59E0B' },
                    { value: 'approved', label: 'Approved', count: changes.filter(c => c.status === 'approved').length, color: '#8B5CF6' },
                    { value: 'implemented', label: 'Implemented', count: changes.filter(c => c.status === 'implemented').length, color: '#10B981' },
                    { value: 'closed', label: 'Closed', count: changes.filter(c => c.status === 'closed').length, color: '#14B8A6' },
                    { value: 'rejected', label: 'Rejected', count: changes.filter(c => c.status === 'rejected').length, color: '#DC2626' }
                  ]},
                  { key: 'changeType', title: 'Change Type', multi: true, options: [
                    { value: 'process', label: 'Process', count: changes.filter(c => c.changeType === 'process').length, color: '#A855F7' },
                    { value: 'product', label: 'Product', count: changes.filter(c => c.changeType === 'product').length, color: '#EC4899' },
                    { value: 'document', label: 'Document', count: changes.filter(c => c.changeType === 'document').length, color: '#3B82F6' },
                    { value: 'system', label: 'System', count: changes.filter(c => c.changeType === 'system').length, color: '#06B6D4' },
                    { value: 'supplier', label: 'Supplier', count: changes.filter(c => c.changeType === 'supplier').length, color: '#F97316' },
                    { value: 'equipment', label: 'Equipment', count: changes.filter(c => c.changeType === 'equipment').length, color: '#22C55E' }
                  ]},
                  { key: 'changeCategory', title: 'Category', multi: true, options: [
                    { value: 'minor', label: 'Minor', count: changes.filter(c => c.changeCategory === 'minor').length, color: '#6B7280' },
                    { value: 'major', label: 'Major', count: changes.filter(c => c.changeCategory === 'major').length, color: '#EAB308' },
                    { value: 'critical', label: 'Critical', count: changes.filter(c => c.changeCategory === 'critical').length, color: '#DC2626' }
                  ]},
                  { key: 'priority', title: 'Priority', multi: true, options: [
                    { value: 'critical', label: 'Critical', count: changes.filter(c => c.priority === 'critical').length, color: '#DC2626' },
                    { value: 'high', label: 'High', count: changes.filter(c => c.priority === 'high').length, color: '#F59E0B' },
                    { value: 'medium', label: 'Medium', count: changes.filter(c => c.priority === 'medium').length, color: '#3B82F6' },
                    { value: 'low', label: 'Low', count: changes.filter(c => c.priority === 'low').length, color: '#6B7280' }
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
                  {editingChange ? 'Edit Change Request' : 'Create New Change Request'}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {editingChange ? 'Edit change request information' : 'Submit a new change control request'}
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
                formType="change-control"
                initialValues={getInitialValues()}
                onSubmit={handleFormSubmit}
                readOnly={false}
                showSubmitButton={true}
                submitLabel={editingChange ? 'Update Change Request' : 'Create Change Request'}
              />
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default ChangeControlPage;
