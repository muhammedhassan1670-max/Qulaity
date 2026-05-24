// QMS Enterprise 4.0 - Unified Compliance & Audit Hub
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PageHeader, PageContainer, PageSection } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
function StatusBadge({ status }: { status: any }) {
  // Ensure status is a safe string for rendering and comparisons
  const s = typeof status === 'object' ? (status ? JSON.stringify(status) : 'Unknown') : String(status || 'Unknown');
  
  const colors: Record<string, string> = {
    'Open': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'In Progress': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Completed': 'bg-green-500/10 text-green-400 border-green-500/20',
    'Cancelled': 'bg-red-500/10 text-red-400 border-red-500/20',
    'Scheduled': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${colors[s] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
      {s}
    </span>
  );
}
import { toast } from 'sonner';
import { 
  Search, User, X, Edit3, Eye, ShieldCheck, Activity, List, CalendarDays, Plus, Filter
} from 'lucide-react';
import { unifiedApiRegistry } from '../../api/unified-api';
import { useConfigStore } from '../../stores/configStore';
import { DynamicFormRenderer } from '../../components/DynamicFormRenderer';

type ComplianceType = 'audit' | 'inspection' | 'calibration';

interface ComplianceConfig {
  id: ComplianceType;
  label: string;
  icon: any;
  color: string;
  apiKey: string;
  description: string;
  statsLabel: string;
}

const MODULES: Record<ComplianceType, ComplianceConfig> = {
  'audit': { 
    id: 'audit', 
    label: 'Audit', 
    icon: ShieldCheck, 
    color: '#10B981', 
    apiKey: 'audits', 
    description: 'Internal & External Quality Audits',
    statsLabel: 'Pending Audits'
  },
  'inspection': { 
    id: 'inspection', 
    label: 'Inspection', 
    icon: Search, 
    color: '#3B82F6', 
    apiKey: 'inspections', 
    description: 'Product & Process Inspections',
    statsLabel: 'Active Inspections'
  },
  'calibration': { 
    id: 'calibration', 
    label: 'Calibration', 
    icon: Activity, 
    color: '#8B5CF6', 
    apiKey: 'calibrations', 
    description: 'Equipment & Tool Calibration',
    statsLabel: 'Due Calibration'
  },
};

export default ComplianceHub;
export function ComplianceHub() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Professional active type detection using useMemo and path matching
  const activeType = useMemo(() => {
    // Priority 1: useParams
    if (type) return type as ComplianceType;
    
    // Priority 2: Extract from pathname (handle trailing slashes)
    const segments = location.pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    
    // Validate if the last segment is a valid module ID
    if (lastSegment && MODULES[lastSegment as ComplianceType]) {
      return lastSegment as ComplianceType;
    }
    
    return 'audit';
  }, [type, location.pathname]);
  
  const [records, setRecords] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');

  const calendarDays = useMemo(() => {
    const today = new Date();
    const days = [];
    for (let i = -7; i < 21; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  }, []);

  const getEventsForDay = (date: Date) => {
    return records.filter(r => {
      const rDate = new Date(r.scheduledDate || r.inspectionDate || r.nextCalibrationDate);
      return rDate.toDateString() === date.toDateString();
    });
  };

  const config = MODULES[activeType] || MODULES.audit;
  const { forms } = useConfigStore();
  
  const formConfig = useMemo(() => 
    forms.find(f => f.type === activeType && f.isActive),
  [forms, activeType]);

  const loadData = async () => {
    try {
      const api = (unifiedApiRegistry as any)[config.apiKey];
      if (api) {
        const res = await api.getAll({ search: searchQuery });
        setRecords(Array.isArray(res?.data) ? res.data : []);
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
      title: 'Reference',
      key: activeType === 'audit' ? 'auditNumber' : (activeType === 'inspection' ? 'inspectionNumber' : 'itemCode'),
      render: (item: any) => {
        const val = activeType === 'audit' ? item.auditNumber : (activeType === 'inspection' ? item.inspectionNumber : item.itemCode);
        return <span className="font-mono font-bold text-[#00A3E0]">{val || item.id}</span>;
      },
    },
    {
      title: 'Title/Item',
      key: activeType === 'calibration' ? 'description' : 'title',
      render: (item: any) => {
        const val = activeType === 'calibration' ? item.description : item.title;
        return <span className="font-medium text-white">{val || item.productName || 'N/A'}</span>;
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (item: any) => <StatusBadge status={item.status} />,
    },
    {
      title: activeType === 'audit' ? 'Auditor' : (activeType === 'inspection' ? 'Inspector' : 'Assigned To'),
      key: activeType === 'audit' ? 'auditor' : (activeType === 'inspection' ? 'inspectedBy' : 'assignedTo'),
      render: (item: any) => {
        const val = activeType === 'audit' ? item.auditor : (activeType === 'inspection' ? item.inspectedBy : item.assignedTo);
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
              <User className="w-3 h-3 text-white/40" />
            </div>
            <span className="text-sm text-gray-300">{val || 'Unassigned'}</span>
          </div>
        );
      },
    },
    {
      title: 'Date',
      key: activeType === 'audit' ? 'scheduledDate' : (activeType === 'inspection' ? 'inspectionDate' : 'nextCalibrationDate'),
      render: (item: any) => {
        const date = activeType === 'audit' ? item.scheduledDate : (activeType === 'inspection' ? item.inspectionDate : item.nextCalibrationDate);
        return <span className="text-gray-400">{date ? new Date(date).toLocaleDateString() : 'TBD'}</span>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" onClick={() => navigate(`/quality/hub/${activeType}/${item.id}`)}>
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
        breadcrumbs={[{ label: 'Compliance' }, { label: config.label }]}
        actions={{
          create: () => setShowCreateForm(true),
          refresh: loadData
        }}
      />

      {/* Hub Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {(Object.values(MODULES)).map((m) => {
          const MIcon = m.icon;
          const isActive = activeType === m.id;
          return (
            <button
              key={m.id}
              onClick={() => navigate(`/compliance/hub/${m.id}`)}
              className={`flex flex-col p-6 rounded-[2rem] border transition-all text-left group relative overflow-hidden ${
                isActive 
                  ? 'bg-gradient-to-br from-[#0066CC] to-[#00A3E0] border-transparent shadow-xl shadow-[#0066CC]/20' 
                  : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.08]'
              }`}
            >
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
                <MIcon className="w-24 h-24 text-white" />
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${isActive ? 'bg-white/20' : 'bg-white/5'}`}>
                <MIcon className={`w-6 h-6 ${isActive ? 'text-white' : ''}`} style={{ color: !isActive ? m.color : undefined }} />
              </div>
              <h3 className={`text-xl font-black uppercase tracking-tighter mb-1 ${isActive ? 'text-white' : 'text-white/60'}`}>{m.label}</h3>
              <p className={`text-xs ${isActive ? 'text-white/70' : 'text-white/20'}`}>{m.description}</p>
              
              <div className="mt-6 flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white/60' : 'text-white/20'}`}>{m.statsLabel}</span>
                <span className={`text-lg font-black ${isActive ? 'text-white' : 'text-[#00A3E0]'}`}>
                  {isActive ? records.length : '--'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <PageSection>
        <div className="glass-panel rounded-[2.5rem] border border-white/5 overflow-hidden">
          <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative flex-1 max-w-lg group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-[#00A3E0] transition-colors" />
              <input 
                type="text" 
                placeholder={`Quick search ${config.label} items...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-[#00A3E0] transition-all"
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
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'calendar' ? 'bg-[#0066CC] text-white' : 'text-white/40 hover:text-white'}`}
              >
                <CalendarDays className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-black text-white/60 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest">
                <Filter className="w-4 h-4" />
                Filters
              </button>
              <button className="flex items-center gap-2 px-6 py-4 bg-[#0066CC] rounded-2xl text-sm font-black text-white hover:bg-[#00A3E0] transition-all uppercase tracking-widest shadow-lg shadow-[#0066CC]/20" onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4" />
                Create New
              </button>
            </div>
          </div>

          {viewMode === 'table' ? (
            <DataTable
              data={records}
              columns={columns}
              keyExtractor={(item: any) => item.id}
              className="border-none"
            />
          ) : (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Timeline Schedule</h3>
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                     <span className="text-[10px] font-bold text-white/40 uppercase">Completed</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                     <span className="text-[10px] font-bold text-white/40 uppercase">Scheduled</span>
                   </div>
                </div>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
                {calendarDays.map((day, idx) => {
                  const dayEvents = getEventsForDay(day);
                  const isToday = day.toDateString() === new Date().toDateString();
                  
                  return (
                    <div key={idx} className="w-64 flex-shrink-0 space-y-4">
                      <div className={`p-4 rounded-2xl border text-center transition-all ${isToday ? 'bg-[#0066CC] border-transparent shadow-lg shadow-[#0066CC]/20' : 'bg-white/5 border-white/5'}`}>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-white/60' : 'text-white/20'}`}>
                          {day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className={`text-2xl font-black ${isToday ? 'text-white' : 'text-white/60'}`}>
                          {day.getDate()}
                        </p>
                      </div>

                      <div className="space-y-2">
                        {dayEvents.map(event => (
                          <div key={event.id} className="p-3 bg-white/5 border border-white/5 rounded-xl hover:border-white/10 transition-all cursor-pointer group">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[9px] font-mono font-bold text-[#00A3E0]">{event.id}</span>
                              <div className={`w-1.5 h-1.5 rounded-full ${event.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500'}`} />
                            </div>
                            <p className="text-[11px] font-bold text-white line-clamp-1 mb-1">{event.title || event.description}</p>
                            <p className="text-[9px] text-white/20 uppercase font-bold tracking-tighter">{event.auditor || event.inspectedBy || 'Team A'}</p>
                          </div>
                        ))}
                        {dayEvents.length === 0 && (
                          <div className="h-16 border border-dashed border-white/5 rounded-xl flex items-center justify-center">
                            <span className="text-[9px] font-bold text-white/5 uppercase tracking-widest">Free Day</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </PageSection>

      {/* Dynamic Form Overlay */}
      {showCreateForm && formConfig && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto glass-strong rounded-[3rem] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="sticky top-0 z-10 p-8 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${config.color}20` }}>
                  <config.icon className="w-6 h-6" style={{ color: config.color }} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">New {config.label} Entry</h2>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Standard Operating Procedure: SOP-QUAL-001</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-500 flex items-center justify-center transition-all group"
              >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
              </button>
            </div>
            <div className="p-10">
              <DynamicFormRenderer 
                config={formConfig}
                onSubmit={async (data) => {
                  try {
                    const api = (unifiedApiRegistry as any)[config.apiKey];
                    if (api) {
                      await api.create(data);
                      toast.success(`${config.label} Created & Logged Successfully`);
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
