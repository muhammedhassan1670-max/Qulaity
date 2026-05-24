// QMS Enterprise 4.0 - Unified Quality Records Hub
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PageHeader, PageContainer, PageSection } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { toast } from 'sonner';
import {
  Search, Filter, Calendar, User, X, Edit3, Eye, ShieldAlert, ClipboardList, FileText, TrendingUp, Workflow, MessageSquare, List, LayoutGrid, MoreVertical, FileDown
} from 'lucide-react';
import { unifiedApiRegistry } from '../../api/unified-api';
import { useConfigStore } from '../../stores/configStore';
import { DynamicFormRenderer } from '../../components/DynamicFormRenderer';

type RecordType = 'ncr' | 'capa' | '8d' | 'deviation' | 'change-control' | 'complaint';

interface ModuleConfig {
  id: RecordType;
  label: string;
  icon: any;
  color: string;
  apiKey: string;
  description: string;
}

const MODULES: Record<RecordType, ModuleConfig> = {
  'ncr': { id: 'ncr', label: 'NCR', icon: ShieldAlert, color: '#EF4444', apiKey: 'ncr', description: 'Non-Conformance Reports' },
  'capa': { id: 'capa', label: 'CAPA', icon: ClipboardList, color: '#F59E0B', apiKey: 'capa', description: 'Corrective & Preventive Actions' },
  '8d': { id: '8d', label: '8D', icon: FileText, color: '#3B82F6', apiKey: 'eight-d', description: '8D Problem Solving Reports' },
  'deviation': { id: 'deviation', label: 'Deviation', icon: TrendingUp, color: '#8B5CF6', apiKey: 'deviations', description: 'Process Deviations' },
  'change-control': { id: 'change-control', label: 'Change Control', icon: Workflow, color: '#10B981', apiKey: 'change-control', description: 'Change Management' },
  'complaint': { id: 'complaint', label: 'Complaint', icon: MessageSquare, color: '#EC4899', apiKey: 'complaints', description: 'Customer Complaints' },
};

const STAGES = [
  { id: 'draft', label: 'Draft', color: 'bg-gray-500' },
  { id: 'open', label: 'Open', color: 'bg-blue-500' },
  { id: 'investigation', label: 'Investigation', color: 'bg-amber-500' },
  { id: 'action', label: 'Action Taken', color: 'bg-purple-500' },
  { id: 'closed', label: 'Closed', color: 'bg-green-500' }
];

export default QualityRecordHub;
export function QualityRecordHub() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Professional active type detection using useMemo and path matching
  const activeType = useMemo(() => {
    // Priority 1: useParams
    if (type) return type as RecordType;
    
    // Priority 2: Extract from pathname (handle trailing slashes and nested paths)
    const segments = location.pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    
    // Validate if the last segment is a valid module ID
    if (lastSegment && MODULES[lastSegment as RecordType]) {
      return lastSegment as RecordType;
    }
    
    return 'ncr';
  }, [type, location.pathname]);
  
  const [records, setRecords] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  const config = MODULES[activeType] || MODULES.ncr;
  const { forms } = useConfigStore();
  
  const formConfig = useMemo(() => 
    forms.find(f => f.type === activeType && f.isActive),
  [forms, activeType]);

  const recordsByStage = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    STAGES.forEach(s => grouped[s.id] = []);
    
    records.forEach(r => {
      // Defensive check: ensure status is a safe string for stage grouping
      const rawStatus = typeof r.status === 'object' ? (r.status?.label || 'open') : (r.status || 'open');
      const stageId = String(rawStatus).toLowerCase();
      const stage = STAGES.find(s => s.id === stageId) ? stageId : 'open';
      grouped[stage].push(r);
    });
    return grouped;
  }, [records]);

  const loadData = async () => {
    try {
      const api = (unifiedApiRegistry as any)[config.apiKey];
      if (api) {
        // Use getAll instead of list, as list is not in unifiedApiRegistry
        const res = await api.getAll({ search: searchQuery });
        setRecords(Array.isArray(res.data) ? res.data : []);
      }
    } catch (e) {
      toast.error(`Failed to load ${config.label} data`);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeType, searchQuery]);

  const columns = useMemo(() => [
    {
      title: 'ID',
      key: 'id',
      render: (item: any) => <span className="font-mono font-bold text-[#00A3E0]">{item.id}</span>,
    },
    {
      title: 'Title/Subject',
      key: 'title',
      render: (item: any) => <span className="font-medium text-white">{item.title || item.subject}</span>,
    },
    {
      title: 'Status',
      key: 'status',
      render: (item: any) => <StatusBadge status={item.status} />,
    },
    {
      title: 'Priority',
      key: 'priority',
      render: (item: any) => <PriorityBadge priority={item.priority} />,
    },
    {
      title: 'Date',
      key: 'createdAt',
      render: (item: any) => <span className="text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" onClick={() => navigate(`/quality/records/${activeType}/${item.id}`)}>
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-[#00A3E0] transition-colors">
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ], [activeType]);

  return (
    <PageContainer>
      <PageHeader
        title={`${config.label} Hub`}
        subtitle={config.description}
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: config.label }]}
        actions={{
          create: () => setShowCreateForm(true),
          refresh: loadData,
          custom: [
            {
              label: 'Export PDF',
              icon: <FileDown className="w-4 h-4" />,
              onClick: async () => {
                const api = (unifiedApiRegistry as any)[config.apiKey];
                if (!api) return;
                
                toast.promise(api.export('pdf', { search: searchQuery }), {
                  loading: 'Generating Professional PDF Report...',
                  success: (blob: Blob) => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${config.label}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    return 'Report exported successfully!';
                  },
                  error: 'Export failed'
                });
              },
            }
          ]
        }}
      />

      <div className="flex flex-wrap gap-3 mb-8 p-1.5 bg-white/5 border border-white/10 rounded-[1.5rem] w-fit backdrop-blur-md">
        {(Object.values(MODULES)).map((m) => {
          const MIcon = m.icon;
          const isActive = activeType === m.id;
          return (
            <button
              key={m.id}
              onClick={() => navigate(`/quality/records/${m.id}`)}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-300 transform ${
                isActive 
                  ? 'bg-[#0066CC] text-white shadow-xl shadow-[#0066CC]/30 scale-105 border border-white/10' 
                  : 'text-white/40 hover:text-white hover:bg-white/10 hover:scale-[1.02]'
              }`}
            >
              <MIcon className={`w-4 h-4 transition-colors duration-300 ${isActive ? 'text-white' : ''}`} style={{ color: !isActive ? m.color : undefined }} />
              <span className={`text-sm font-black uppercase tracking-tighter ${isActive ? 'text-white' : 'text-white/40'}`}>{m.label}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      <PageSection>
        <div className="glass-panel rounded-[2rem] border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#00A3E0] transition-colors" />
              <input 
                type="text" 
                placeholder={`Search ${config.label} records...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-[#00A3E0] transition-all"
              />
            </div>
            <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
              <button 
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-[#0066CC] text-white' : 'text-white/40 hover:text-white'}`}
              >
                <List className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'kanban' ? 'bg-[#0066CC] text-white' : 'text-white/40 hover:text-white'}`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white hover:bg-white/10 transition-all">
                <Filter className="w-4 h-4" />
                Advanced Filters
              </button>
            </div>
          </div>

          {viewMode === 'table' ? (
            <DataTable
              data={records}
              columns={columns}
              keyExtractor={(item: any) => item.id}
              className="animate-in fade-in duration-500"
            />
          ) : (
            <div className="p-6 overflow-x-auto">
              <div className="flex gap-6 min-w-max pb-4">
                {STAGES.map(stage => (
                  <div key={stage.id} className="w-80 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4 px-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                        <h3 className="text-xs font-black text-white/60 uppercase tracking-widest">{stage.label}</h3>
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/40 font-bold">
                          {recordsByStage[stage.id]?.length || 0}
                        </span>
                      </div>
                      <MoreVertical className="w-4 h-4 text-white/20" />
                    </div>
                    
                    <div className="space-y-3">
                      {recordsByStage[stage.id]?.map((record: any) => (
                        <div key={record.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-[#00A3E0]/30 transition-all group cursor-pointer">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono font-bold text-[#00A3E0]">{record.id}</span>
                            <PriorityBadge priority={record.priority} />
                          </div>
                          <h4 className="text-sm font-bold text-white mb-3 line-clamp-2">{record.title || record.subject}</h4>
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                <User className="w-3 h-3 text-white/40" />
                              </div>
                              <span className="text-[10px] text-white/40 font-medium truncate max-w-[80px]">
                                {record.assignedTo || 'Unassigned'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-white/20">
                              <Calendar className="w-3 h-3" />
                              {new Date(record.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                      {recordsByStage[stage.id]?.length === 0 && (
                        <div className="h-24 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center text-white/10 text-[10px] font-bold uppercase tracking-widest">
                          No Items
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PageSection>

      {/* Dynamic Create Dialog */}
      {showCreateForm && formConfig && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-strong rounded-[2.5rem] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="sticky top-0 z-10 p-6 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">New {config.label} Record</h2>
                <p className="text-xs text-white/40">Fill in the details for the new quality report</p>
              </div>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-500 flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8">
              <DynamicFormRenderer 
                config={formConfig}
                onSubmit={async (data) => {
                  try {
                    const api = (unifiedApiRegistry as any)[config.apiKey];
                    if (api) {
                      await api.create(data);
                      toast.success(`${config.label} Created Successfully`);
                      setShowCreateForm(false);
                      loadData();
                    }
                  } catch (e: any) {
                    toast.error(`Failed to create ${config.label}`, { description: e.message });
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
