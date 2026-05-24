// QMS Enterprise 4.0 - Complaints Page - Professional Edition
import { useState, useEffect, useMemo } from 'react';
import { PageHeader, PageContainer, PageSection, StatsBar } from '../../components/PageHeader';
import DynamicFormRenderer from '../../components/DynamicFormRenderer';
import { DataTable } from '../../components/DataTable';
import { FilterPanel } from '../../components/FilterPanel';
import { BulkActionBar } from '../../components/BulkActionBar';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { toast } from 'sonner';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { complaintsApi, type ComplaintData } from '../../api/complaints';
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
  MessageSquareWarning,
  Phone,
  Mail,
  Globe,
  Building
} from 'lucide-react';

interface Complaint {
  id: string;
  complaintId: string;
  customerName: string;
  customerContact: string;
  productModel: string;
  serialNumber?: string;
  batchNumber: string;
  quantity?: number;
  complaintDescription: string;
  severity: 'critical' | 'major' | 'minor';
  priority: 'critical' | 'high' | 'medium' | 'low';
  complaintSource: 'phone' | 'email' | 'web' | 'visit' | 'letter';
  status: 'new' | 'investigating' | 'resolved' | 'closed';
  receivedDate: string;
  responseDue: string;
  assignedTo: string;
  investigationResult?: string;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  closureDate?: string;
  satisfaction?: number;
  [key: string]: unknown;
}

const mockComplaints: Complaint[] = [];

function generateCompNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `COMP-${year}-${random}`;
}

const sourceConfig = {
  'phone': { icon: Phone, color: 'bg-green-500/20 text-green-400', label: 'Phone' },
  'email': { icon: Mail, color: 'bg-blue-500/20 text-blue-400', label: 'Email' },
  'web': { icon: Globe, color: 'bg-purple-500/20 text-purple-400', label: 'Web Portal' },
  'visit': { icon: Building, color: 'bg-orange-500/20 text-orange-400', label: 'Customer Visit' },
  'letter': { icon: Mail, color: 'bg-gray-500/20 text-gray-400', label: 'Letter' }
};

export function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});
  const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const createPrefill = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const title = params.get('title');
    const description = params.get('description');
    const open = params.get('create') === '1' || !!title || !!description;

    return {
      open,
      values: {
        title: title ?? undefined,
        complaintDescription: description ?? undefined,
      } satisfies Record<string, unknown>,
    };
  }, [location.search]);

  const loadComplaints = async () => {
    try {
      setIsLoading(true);
      const response = await complaintsApi.getAll();
      const transformed = response.data.map((complaint: any) => ({
        id: complaint.id,
        complaintId: complaint.complaintNumber || complaint.id,
        customerName: complaint.customerName || complaint.customer,
        customerContact: complaint.customerContact || '',
        productModel: complaint.productName || complaint.product,
        serialNumber: complaint.serialNumber,
        batchNumber: complaint.batchNumber || complaint.batch,
        quantity: complaint.quantity,
        complaintDescription: complaint.subject || complaint.title || complaint.issue || complaint.complaintDescription,
        severity: complaint.severity?.toLowerCase() || 'minor',
        priority: complaint.priority?.toLowerCase() || 'medium',
        complaintSource: complaint.complaintType?.toLowerCase() || complaint.source || complaint.complaintSource || 'web',
        status: complaint.status?.toLowerCase() || 'new',
        receivedDate: complaint.receivedDate || complaint.createdAt?.split('T')[0],
        responseDue: complaint.targetCloseDate || complaint.responseDue,
        assignedTo: complaint.assignedUser?.name || complaint.assignedTo || 'Unassigned',
        investigationResult: complaint.investigationResult,
        rootCause: complaint.rootCause,
        correctiveAction: complaint.correctiveAction,
        preventiveAction: complaint.preventiveAction,
        closureDate: complaint.closureDate,
        satisfaction: complaint.satisfaction,
        ...complaint
      }));
      setComplaints(transformed);
    } catch (err) {
      setComplaints(mockComplaints);
      toast.info('Backend unavailable - no records loaded');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  // Support deep-link /complaints/:id by opening the modal
  useEffect(() => {
    if (isLoading) return;
    const id = params.id;
    if (!id) return;
    const found = complaints.find((c) => c.id === id);
    if (found) {
      setEditingComplaint(found);
      setIsFormOpen(true);
    }
  }, [params.id, complaints, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    if (!createPrefill.open) return;
    setEditingComplaint(null);
    setIsFormOpen(true);
  }, [createPrefill.open, isLoading]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-72">
          <div className="text-gray-400">Loading complaints...</div>
        </div>
      </PageContainer>
    );
  }

  const stats = [
    { label: 'New Complaints', value: complaints.filter(c => c.status === 'new').length, change: '0', trend: 'neutral' as const },
    { label: 'In Investigation', value: complaints.filter(c => c.status === 'investigating').length, change: '0', trend: 'neutral' as const },
    { label: 'Resolved', value: complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length, change: '0', trend: 'neutral' as const },
    { label: 'Critical', value: complaints.filter(c => c.severity === 'critical' && c.status !== 'closed').length, change: '0', trend: 'neutral' as const }
  ];

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = !searchQuery || 
      complaint.complaintDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.complaintId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.productModel?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const statusFilter = activeFilters['status'] as string[];
    const matchesStatus = !statusFilter || statusFilter.length === 0 || statusFilter.includes(complaint.status);
    
    const severityFilter = activeFilters['severity'] as string[];
    const matchesSeverity = !severityFilter || severityFilter.length === 0 || severityFilter.includes(complaint.severity);
    
    const priorityFilter = activeFilters['priority'] as string[];
    const matchesPriority = !priorityFilter || priorityFilter.length === 0 || priorityFilter.includes(complaint.priority);
    
    const sourceFilter = activeFilters['complaintSource'] as string[];
    const matchesSource = !sourceFilter || sourceFilter.length === 0 || sourceFilter.includes(complaint.complaintSource);
    
    return matchesSearch && matchesStatus && matchesSeverity && matchesPriority && matchesSource;
  });

  const handleCreate = () => {
    setEditingComplaint(null);
    setIsFormOpen(true);
  };

  const handleEdit = (complaint: Complaint) => {
    setEditingComplaint(complaint);
    setIsFormOpen(true);
  };

  const handleDelete = async (complaintId: string) => {
    if (confirm('Are you sure you want to delete this complaint?')) {
      try {
        await complaintsApi.delete(complaintId);
        await loadComplaints();
        toast.success('Complaint deleted successfully');
      } catch (err) {
        toast.error('Failed to delete complaint');
      }
    }
  };

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    try {
      const payload: ComplaintData = {
        subject: (data.title as string) || (data.subject as string) || 'Complaint',
        description: (data.complaintDescription as string) || (data.description as string) || '',
        status: (data.status as string) || 'new',
        priority: (data.priority as string) || 'medium',
        category: (data.severity as string) || (data.category as string) || 'minor',
        customerName: data.customerName as string,
        customerContact: data.customerContact as string,
        plantId: (data.plantId as string) || '1',
        assignedUserId: data.assignedTo as string,
        receivedDate: data.receivedDate as string,
        targetCloseDate: data.responseDue as string,
        metadata: data,
      };

      if (editingComplaint) {
        await complaintsApi.update(editingComplaint.id, payload as any);
        toast.success('Complaint updated successfully');
      } else {
        await complaintsApi.create(payload as any);
        toast.success('Complaint logged successfully');
      }

      await loadComplaints();
      setIsFormOpen(false);
      setEditingComplaint(null);
      if (params.id) {
        navigate('/complaints', { replace: true });
      }
    } catch (err) {
      toast.error(editingComplaint ? 'Failed to update complaint' : 'Failed to log complaint');
    }
  };

  const getInitialValues = () => {
    if (editingComplaint) {
      return editingComplaint;
    }
    return {
      complaintId: generateCompNumber(),
      receivedDate: new Date().toISOString().split('T')[0],
      responseDue: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'new',
      severity: 'minor',
      priority: 'medium',
      ...createPrefill.values,
    };
  };

  return (
    <PageContainer>
      <PageHeader
        title="Customer Complaints"
        subtitle="Track and manage customer feedback and complaints"
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'Complaints' }]}
        actions={{
          create: handleCreate,
          refresh: loadComplaints
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
                  placeholder="Search complaints..."
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
                  <span className="hidden sm:inline">Log Complaint</span>
                </button>
              </div>
            </div>

            <BulkActionBar
              selectedCount={selectedIds.length}
              itemName="Complaints"
              onClearSelection={() => setSelectedIds([])}
              onDelete={() => {
                if (confirm(`Delete ${selectedIds.length} complaints?`)) {
                  setComplaints(prev => prev.filter(c => !selectedIds.includes(c.id)));
                  setSelectedIds([]);
                  toast.success(`${selectedIds.length} complaints deleted`);
                }
              }}
              onExport={(format) => toast.success(`Exporting ${selectedIds.length || filteredComplaints.length} as ${format.toUpperCase()}...`)}
            />

            <DataTable
              data={filteredComplaints}
              columns={[
                { key: 'complaintId', title: 'Complaint ID', width: '140px', sortable: true, render: (item) => (
                  <span className="text-[#00A3E0] font-mono text-sm font-medium">{item.complaintId}</span>
                )},
                { key: 'complaintDescription', title: 'Issue & Customer', sortable: true, render: (item) => (
                  <div>
                    <p className="text-white font-medium text-sm line-clamp-1">{item.complaintDescription}</p>
                    <p className="text-gray-400 text-xs mt-1">{item.customerName} • {item.productModel}</p>
                  </div>
                )},
                { key: 'complaintSource', title: 'Source', width: '110px', sortable: true, render: (item) => {
                  const SourceIcon = sourceConfig[item.complaintSource].icon;
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sourceConfig[item.complaintSource].color}`}>
                      <SourceIcon className="w-3.5 h-3.5" />
                      {sourceConfig[item.complaintSource].label}
                    </span>
                  );
                }},
                { key: 'severity', title: 'Severity', width: '90px', sortable: true, render: (item) => (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    item.severity === 'critical' ? 'bg-red-500 text-white' :
                    item.severity === 'major' ? 'bg-orange-500 text-white' : 'bg-yellow-500 text-black'
                  }`}>
                    {item.severity}
                  </span>
                )},
                { key: 'priority', title: 'Priority', width: '90px', sortable: true, render: (item) => (
                  <PriorityBadge priority={item.priority} size="sm" />
                )},
                { key: 'status', title: 'Status', width: '120px', sortable: true, render: (item) => (
                  <StatusBadge status={item.status} size="sm" />
                )},
                { key: 'responseDue', title: 'Due Date', width: '120px', sortable: true, render: (item) => (
                  <div className={`flex items-center gap-2 text-sm ${new Date(item.responseDue) < new Date() ? 'text-red-400' : 'text-gray-400'}`}>
                    <Calendar className="w-4 h-4" />
                    {item.responseDue}
                  </div>
                )},
                { key: 'assignedTo', title: 'Assigned To', width: '150px', sortable: true, render: (item) => (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#0066CC]/20 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-[#00A3E0]" />
                    </div>
                    <span className="text-gray-300 text-sm">{item.assignedTo}</span>
                  </div>
                )}
              ]}
              keyExtractor={(item) => item.id}
              selectedItems={selectedIds}
              onSelectionChange={setSelectedIds}
              onRowClick={(row) => {
                setEditingComplaint(row);
                setIsFormOpen(true);
              }}
              pageSize={10}
              actions={(item) => (
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); setEditingComplaint(item); setIsFormOpen(true); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="View">
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
                    <MessageSquareWarning className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No complaints found</h3>
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
                    { value: 'new', label: 'New', count: complaints.filter(c => c.status === 'new').length, color: '#DC2626' },
                    { value: 'investigating', label: 'Investigating', count: complaints.filter(c => c.status === 'investigating').length, color: '#F59E0B' },
                    { value: 'resolved', label: 'Resolved', count: complaints.filter(c => c.status === 'resolved').length, color: '#3B82F6' },
                    { value: 'closed', label: 'Closed', count: complaints.filter(c => c.status === 'closed').length, color: '#10B981' }
                  ]},
                  { key: 'severity', title: 'Severity', multi: true, options: [
                    { value: 'critical', label: 'Critical', count: complaints.filter(c => c.severity === 'critical').length, color: '#DC2626' },
                    { value: 'major', label: 'Major', count: complaints.filter(c => c.severity === 'major').length, color: '#F97316' },
                    { value: 'minor', label: 'Minor', count: complaints.filter(c => c.severity === 'minor').length, color: '#EAB308' }
                  ]},
                  { key: 'priority', title: 'Priority', multi: true, options: [
                    { value: 'critical', label: 'Critical', count: complaints.filter(c => c.priority === 'critical').length, color: '#DC2626' },
                    { value: 'high', label: 'High', count: complaints.filter(c => c.priority === 'high').length, color: '#F59E0B' },
                    { value: 'medium', label: 'Medium', count: complaints.filter(c => c.priority === 'medium').length, color: '#3B82F6' },
                    { value: 'low', label: 'Low', count: complaints.filter(c => c.priority === 'low').length, color: '#6B7280' }
                  ]},
                  { key: 'complaintSource', title: 'Source', multi: true, options: [
                    { value: 'phone', label: 'Phone', count: complaints.filter(c => c.complaintSource === 'phone').length, color: '#22C55E' },
                    { value: 'email', label: 'Email', count: complaints.filter(c => c.complaintSource === 'email').length, color: '#3B82F6' },
                    { value: 'web', label: 'Web', count: complaints.filter(c => c.complaintSource === 'web').length, color: '#A855F7' },
                    { value: 'visit', label: 'Visit', count: complaints.filter(c => c.complaintSource === 'visit').length, color: '#F97316' },
                    { value: 'letter', label: 'Letter', count: complaints.filter(c => c.complaintSource === 'letter').length, color: '#6B7280' }
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
                  {editingComplaint ? 'Edit Complaint' : 'Log New Complaint'}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {editingComplaint ? 'Edit complaint information' : 'Record a new customer complaint'}
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
                formType="complaint"
                initialValues={getInitialValues()}
                onSubmit={handleFormSubmit}
                readOnly={false}
                showSubmitButton={true}
                submitLabel={editingComplaint ? 'Update Complaint' : 'Log Complaint'}
              />
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default ComplaintsPage;
