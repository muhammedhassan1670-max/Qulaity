// QMS Enterprise 4.0 - Audit Management Page - Professional Edition
import { useState, useEffect } from 'react';
import { PageHeader, PageContainer, PageSection, StatsBar } from '../../components/PageHeader';
import DynamicFormRenderer from '../../components/DynamicFormRenderer';
import { DataTable } from '../../components/DataTable';
import { FilterPanel } from '../../components/FilterPanel';
import { BulkActionBar } from '../../components/BulkActionBar';
import { StatusBadge } from '../../components/StatusBadge';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  unifiedAuditApi as auditApi,
  unifiedNcrApi
} from '../../api/unified-api';
import { 
  Search,
  Plus,
  Users,
  X,
  Edit3,
  Eye,
  Filter,
  ShieldAlert
} from 'lucide-react';
import { RelatedRecords } from '../../components/RelatedRecords';
import { exportData, prepareDataForExport } from '../../utils/exportUtils';

interface Audit {
  id: string;
  title: string;
  description?: string;
  type: 'internal' | 'external' | 'supplier' | 'regulatory';
  status: 'planned' | 'in-progress' | 'completed' | 'closed';
  scope: string;
  auditor: string;
  auditee: string;
  scheduledDate: string;
  duration: string;
  findings: number;
  ncCount: number;
  // Dynamic fields from form
  [key: string]: unknown;
}

export const mockAudits: Audit[] = [];

// Generate Audit number
function generateAuditNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 900) + 100;
  return `AUD-${year}-${random}`;
}

export function AuditPage() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAudit, setEditingAudit] = useState<Audit | null>(null);

  const navigate = useNavigate();
  const params = useParams();

  const loadAudits = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await auditApi.getAll();
      // Transform API data to match Audit interface
      const transformed = response.data.map((audit: any) => ({
        id: audit.id,
        title: audit.title,
        description: audit.description,
        type: audit.auditType?.toLowerCase() || 'internal',
        status: audit.status?.toLowerCase() || 'planned',
        scope: audit.scope || 'Full QMS',
        auditor: audit.auditor?.name || audit.auditorUser?.name || 'TBD',
        auditee: audit.auditee || 'TBD',
        scheduledDate: audit.plannedDate || audit.startDate || audit.scheduledDate,
        duration: audit.duration || '1 day',
        findings: audit.findings?.length || 0,
        ncCount: audit.findings?.filter((f: any) => f.severity === 'MAJOR' || f.severity === 'CRITICAL')?.length || 0,
        ...audit
      }));
      setAudits(transformed);
    } catch (err) {
      console.warn('API unavailable; keeping empty state:', err);
      // Keep an empty state when backend is not running
      setAudits(mockAudits);
      toast.info('Backend unavailable - no records loaded');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data from API
  useEffect(() => {
    loadAudits();
  }, []);

  // Support deep-link /audit/:id by opening the modal
  useEffect(() => {
    const id = params.id;
    if (!id) return;
    const found = audits.find((a) => a.id === id);
    if (found) {
      setEditingAudit(found);
      setIsFormOpen(true);
    }
  }, [params.id, audits]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-72">
          <div className="text-gray-400">Loading audits...</div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-72">
          <div className="text-gray-400">{error}</div>
        </div>
      </PageContainer>
    );
  }

  const handleCreateNcr = async (audit: any) => {
    try {
      const ncrData = {
        title: `NCR from Audit Finding: ${audit.title}`,
        description: `Audit ID: ${audit.id}\nAuditor: ${audit.auditor}\nFinding description...`,
        priority: 'medium',
        source: 'Audit',
        sourceAuditId: audit.id,
        plantId: 'MAIN-PLANT',
        status: 'open',
      };

      await unifiedNcrApi.create(ncrData);
      toast.success('NCR Created', {
        description: `NCR initialized based on findings from audit ${audit.id}.`
      });
      navigate('/quality/ncr');
    } catch (err) {
      toast.error('Failed to create NCR');
    }
  };

  const stats = [
    { label: 'Planned', value: audits.filter(a => a.status === 'planned').length, change: '0', trend: 'neutral' as const },
    { label: 'In Progress', value: audits.filter(a => a.status === 'in-progress').length, change: '0', trend: 'neutral' as const },
    { label: 'Findings (YTD)', value: audits.reduce((acc, a) => acc + a.findings, 0), change: '0', trend: 'neutral' as const },
    { label: 'Open NCs', value: audits.reduce((acc, a) => acc + a.ncCount, 0), change: '0', trend: 'neutral' as const }
  ];

  const filteredAudits = audits.filter(audit => {
    const matchesSearch = !searchQuery || 
      audit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      audit.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const statusFilter = activeFilters['status'] as string[];
    const matchesStatus = !statusFilter || statusFilter.length === 0 || statusFilter.includes(audit.status);
    
    const typeFilter = activeFilters['type'] as string[];
    const matchesType = !typeFilter || typeFilter.length === 0 || typeFilter.includes(audit.type);
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCreate = () => {
    setEditingAudit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (audit: Audit) => {
    setEditingAudit(audit);
    setIsFormOpen(true);
  };


  const handleFormSubmit = async (data: Record<string, unknown>) => {
    try {
      const auditData: any = {
        title: data.title as string,
        description: data.description as string,
        type: (data.auditType as string) || (data.type as string) || 'Internal',
        status: (data.status as string) || 'planned',
        scope: (data.scope as string) || 'Full QMS',
        auditor: (data.auditor as string) || 'Lead Auditor',
        auditee: (data.auditee as string) || 'Dept Manager',
        scheduledDate: (data.scheduledDate as string) || new Date().toISOString(),
        metadata: { ...data }
      };

      if (editingAudit) {
        // Update existing Audit
        await auditApi.update(editingAudit.id, auditData);
        await loadAudits();
        toast.success('Audit updated successfully');
      } else {
        // Create new Audit
        await auditApi.create(auditData);
        await loadAudits();
        toast.success('Audit scheduled successfully');
      }
      setIsFormOpen(false);
      setEditingAudit(null);
      if (params.id) {
        navigate('/audit', { replace: true });
      }
    } catch (err) {
      toast.error(editingAudit ? 'Failed to update Audit' : 'Failed to schedule Audit');
      console.error(err);
    }
  };

  const getInitialValues = () => {
    if (editingAudit) {
      return editingAudit;
    }
    // Default values for new Audit
    return {
      auditNumber: generateAuditNumber(),
      status: 'planned',
      scheduledDate: new Date().toISOString().split('T')[0]
    };
  };

  const handleExport = (format: 'excel' | 'csv' | 'json' = 'excel', ids?: string[]) => {
    const dataToExport = ids && ids.length > 0 
      ? audits.filter(a => ids.includes(a.id))
      : filteredAudits;

    if (dataToExport.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      const mapping = {
        id: 'Audit ID',
        title: 'Title',
        description: 'Description',
        type: 'Type',
        status: 'Status',
        scope: 'Scope',
        auditor: 'Auditor',
        auditee: 'Auditee',
        scheduledDate: 'Scheduled Date',
        duration: 'Duration',
        findings: 'Findings Count',
        ncCount: 'NC Count'
      };

      const preparedData = prepareDataForExport(dataToExport, mapping);
      exportData(preparedData, `Audit_Report`, 'Quality Audits', format);
      toast.success(`Successfully exported ${dataToExport.length} reports`);
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Export failed');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Audit Management"
        subtitle="Schedule, execute, and track internal and external audits"
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'Audit Mgmt' }]}
        actions={{
          create: handleCreate,
          refresh: loadAudits,
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
                  placeholder="Search audits by ID, title, or scope..."
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
                  <span className="hidden sm:inline">Schedule Audit</span>
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            <BulkActionBar
              selectedCount={selectedIds.length}
              itemName="Audits"
              onClearSelection={() => setSelectedIds([])}
              onExport={(format) => handleExport(format, selectedIds)}
            />

            {/* Data Table */}
            <DataTable
              data={filteredAudits}
              columns={[
                { key: 'id', title: 'Audit ID', width: '140px', sortable: true, render: (item) => (
                  <span className="text-[#00A3E0] font-mono text-sm font-medium">{item.id}</span>
                )},
                { key: 'title', title: 'Title & Scope', sortable: true, render: (item) => (
                  <div>
                    <p className="text-white font-medium text-sm line-clamp-1">{item.title}</p>
                    <p className="text-gray-400 text-xs mt-1 line-clamp-1">{item.scope}</p>
                  </div>
                )},
                { key: 'type', title: 'Type', width: '120px', sortable: true, render: (item) => (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    item.type === 'internal' ? 'bg-purple-500/20 text-purple-400' :
                    item.type === 'external' ? 'bg-orange-500/20 text-orange-400' :
                    item.type === 'supplier' ? 'bg-teal-500/20 text-teal-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {item.type}
                  </span>
                )},
                { key: 'status', title: 'Status', width: '140px', sortable: true, render: (item) => (
                  <StatusBadge status={item.status} size="sm" />
                )},
                { key: 'scheduledDate', title: 'Date & Duration', width: '140px', sortable: true, render: (item) => (
                  <div>
                    <div className="text-gray-300 text-sm">{item.scheduledDate}</div>
                    <div className="text-gray-500 text-xs">{item.duration}</div>
                  </div>
                )},
                { key: 'auditor', title: 'Auditor', width: '150px', sortable: true, render: (item) => (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300 text-sm">{item.auditor}</span>
                  </div>
                )},
                { key: 'findings', title: 'Findings', width: '100px', sortable: true, render: (item) => (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300 text-sm">{item.findings}</span>
                    {item.ncCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                        {item.ncCount} NC
                      </span>
                    )}
                  </div>
                )}
              ]}
              keyExtractor={(item) => item.id}
              selectedItems={selectedIds}
              onSelectionChange={setSelectedIds}
              onRowClick={(row) => {
                setEditingAudit(row);
                setIsFormOpen(true);
              }}
              pageSize={10}
              actions={(item) => (
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateNcr(item);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Elevate to NCR"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingAudit(item);
                      setIsFormOpen(true);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="View"
                  >
                    <Eye className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(item);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4 text-[#00A3E0]" />
                  </button>
                </div>
              )}
              emptyState={
                <div className="glass-panel rounded-xl p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No Audits found</h3>
                  <p className="text-gray-400 mb-4">Try adjusting your search or filters</p>
                  <button onClick={() => { setSearchQuery(''); setActiveFilters({}); }} className="text-[#00A3E0] hover:text-white transition-colors">
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
                    { value: 'planned', label: 'Planned', count: audits.filter(a => a.status === 'planned').length, color: '#3B82F6' },
                    { value: 'in-progress', label: 'In Progress', count: audits.filter(a => a.status === 'in-progress').length, color: '#F59E0B' },
                    { value: 'completed', label: 'Completed', count: audits.filter(a => a.status === 'completed').length, color: '#10B981' },
                    { value: 'closed', label: 'Closed', count: audits.filter(a => a.status === 'closed').length, color: '#6B7280' }
                  ]},
                  { key: 'type', title: 'Type', multi: true, options: [
                    { value: 'internal', label: 'Internal', count: audits.filter(a => a.type === 'internal').length, color: '#8B5CF6' },
                    { value: 'external', label: 'External', count: audits.filter(a => a.type === 'external').length, color: '#F97316' },
                    { value: 'supplier', label: 'Supplier', count: audits.filter(a => a.type === 'supplier').length, color: '#14B8A6' },
                    { value: 'regulatory', label: 'Regulatory', count: audits.filter(a => a.type === 'regulatory').length, color: '#DC2626' }
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
                onClearAll={() => { setActiveFilters({}); setSearchQuery(''); }}
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
                  {editingAudit ? 'Edit Audit' : 'Schedule New Audit'}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {editingAudit ? 'Edit audit information' : 'Schedule a new quality audit'}
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
                formType="audit"
                initialValues={getInitialValues()}
                onSubmit={handleFormSubmit}
                readOnly={false}
                showSubmitButton={true}
                submitLabel={editingAudit ? 'Update Audit' : 'Create Audit'}
              />

              {editingAudit && (
                <RelatedRecords 
                  currentId={editingAudit.id}
                  relations={[
                    { targetModule: 'ncr', filterField: 'sourceAuditId', label: 'Linked NCRs', icon: <ShieldAlert className="w-4 h-4" /> }
                  ]}
                />
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

export default AuditPage;
