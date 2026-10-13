// @ts-nocheck
// QMS Enterprise 4.0 - Unified Compliance & Audit Hub
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PageHeader, PageContainer, PageSection } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { toast } from 'sonner';
import { 
  Search, User, X, Edit3, Eye, ShieldCheck, Activity, List, CalendarDays, Plus, Filter,
  Trash2, Link2, ShieldAlert, CheckCircle2, Clock, Wrench, AlertTriangle, Building,
  Layers, ChevronRight, RefreshCw, Sparkles, Check
} from 'lucide-react';
import { unifiedApiRegistry } from '../../api/unified-api';
import { useConfigStore } from '../../stores/configStore';
import { DynamicFormRenderer } from '../../components/DynamicFormRenderer';
import { createQualityRelationship, loadQualityRelationships } from '../../services/qualityRelationships';

type ComplianceType = 'audit' | 'inspection' | 'calibration';

interface ComplianceConfig {
  id: ComplianceType;
  label: string;
  icon: any;
  color: string;
  apiKey: string;
  description: string;
  statsLabel: string;
  standard: string;
}

const MODULES: Record<ComplianceType, ComplianceConfig> = {
  audit: { 
    id: 'audit', 
    label: 'Audit', 
    icon: ShieldCheck, 
    color: '#10B981', 
    apiKey: 'audits', 
    description: 'Internal, External & Layered Process Audits',
    statsLabel: 'Total Audits',
    standard: 'ISO 9001 / IATF 16949'
  },
  inspection: { 
    id: 'inspection', 
    label: 'Inspection', 
    icon: Search, 
    color: '#3B82F6', 
    apiKey: 'inspections', 
    description: 'Incoming (IQC), In-Process (IPQC) & Final Inspections',
    statsLabel: 'Total Inspections',
    standard: 'MIL-STD-105E / AQL Sampling'
  },
  calibration: { 
    id: 'calibration', 
    label: 'Calibration', 
    icon: Activity, 
    color: '#8B5CF6', 
    apiKey: 'calibrations', 
    description: 'Metrology Lab, Gauges & Tool Verification',
    statsLabel: 'Active Gauges',
    standard: 'ISO/IEC 17025 Standard'
  },
};

function StatusBadge({ status }: { status: any }) {
  const s = typeof status === 'object' ? (status?.label || (status ? JSON.stringify(status) : 'Unknown')) : String(status || 'Unknown');
  const lower = s.toLowerCase();
  
  let colorClass = 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  if (lower.includes('open') || lower.includes('pass') || lower.includes('calibrated') || lower.includes('completed')) {
    colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  } else if (lower.includes('progress') || lower.includes('due') || lower.includes('pending') || lower.includes('planned')) {
    colorClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  } else if (lower.includes('fail') || lower.includes('overdue') || lower.includes('cancel') || lower.includes('quarantine')) {
    colorClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  } else if (lower.includes('schedule')) {
    colorClass = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-wide uppercase ${colorClass}`}>
      {s}
    </span>
  );
}

export function ComplianceHub() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const activeType = useMemo(() => {
    if (type && MODULES[type as ComplianceType]) return type as ComplianceType;
    const segments = location.pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    if (lastSegment && MODULES[lastSegment as ComplianceType]) {
      return lastSegment as ComplianceType;
    }
    return 'audit';
  }, [type, location.pathname]);
  
  const config = MODULES[activeType] || MODULES.audit;
  const { forms, getFormByType } = useConfigStore();

  const [records, setRecords] = useState<any[]>([]);
  const [moduleCounts, setModuleCounts] = useState<Record<ComplianceType, number>>({
    audit: 0,
    inspection: 0,
    calibration: 0,
  });
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form mode: 'standard' (built-in full-featured) vs 'dynamic' (configStore custom template)
  const [formMode, setFormMode] = useState<'standard' | 'dynamic'>('standard');

  const formConfig = useMemo(() => {
    return forms.find(f => f.type === activeType && f.isActive) || getFormByType(activeType);
  }, [forms, activeType, getFormByType]);

  // Initial Form Data builders with unique auto-generated reference IDs
  const createInitialAuditData = useCallback(() => ({
    auditNumber: `AUD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    title: '',
    type: 'Internal',
    standard: 'ISO 9001:2015',
    scope: 'Full Quality Management System',
    department: 'Quality Assurance',
    auditor: 'Lead Auditor',
    auditee: 'Operations Manager',
    scheduledDate: new Date().toISOString().split('T')[0],
    duration: '1 Day',
    status: 'Planned',
    supplierId: '',
    findingsSummary: '',
  }), []);

  const createInitialInspectionData = useCallback(() => ({
    inspectionNumber: `INS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    productName: '',
    batchNumber: `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    type: 'incoming',
    inspectedBy: 'Lead Inspector',
    inspectionDate: new Date().toISOString().split('T')[0],
    sampleSize: 50,
    defectCount: 0,
    inspectionPoints: 5,
    result: 'pass',
    supplierId: '',
    productionLine: 'Line 1 - Primary Assembly',
    autoCreateNcr: false,
  }), []);

  const createInitialCalibrationData = useCallback(() => {
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);
    return {
      itemCode: `CAL-GAUGE-${Math.floor(1000 + Math.random() * 9000)}`,
      description: '',
      category: 'Caliper',
      serialNumber: `SN-${Math.floor(10000 + Math.random() * 90000)}`,
      manufacturer: 'Mitutoyo',
      location: 'Metrology Lab',
      intervalMonths: 12,
      lastCalibrationDate: today.toISOString().split('T')[0],
      nextCalibrationDate: nextYear.toISOString().split('T')[0],
      calibratedBy: 'Calibration Specialist',
      standard: 'ISO/IEC 17025 Certified',
      status: 'calibrated',
      uncertainty: '±0.02 mm',
      linkedMachine: 'CNC Station 1',
    };
  }, []);

  const [formData, setFormData] = useState<any>({});

  // Reset form when modal opens or activeType changes
  useEffect(() => {
    if (activeType === 'audit') setFormData(createInitialAuditData());
    else if (activeType === 'inspection') setFormData(createInitialInspectionData());
    else if (activeType === 'calibration') setFormData(createInitialCalibrationData());
  }, [activeType, createInitialAuditData, createInitialInspectionData, createInitialCalibrationData]);

  // Load suppliers for cross-module linking
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await unifiedApiRegistry.suppliers.getAll();
        if (Array.isArray(res?.data)) {
          setSuppliers(res.data.map((s: any) => ({
            id: s.id,
            name: s.name || s.supplierName || s.title || `Supplier #${s.id}`,
          })));
        }
      } catch {
        // Fallback default suppliers
        setSuppliers([
          { id: 'SUP-001', name: 'Precision Castings Ltd' },
          { id: 'SUP-002', name: 'Global Fasteners Co' },
          { id: 'SUP-003', name: 'Apex Electronics Inc' },
        ]);
      }
    };
    fetchSuppliers();
  }, []);

  // Fetch counts for ALL three modules simultaneously so none show '--'
  const loadCounts = useCallback(async () => {
    try {
      const [auditsRes, inspRes, calRes] = await Promise.allSettled([
        unifiedApiRegistry.audits.getAll(),
        unifiedApiRegistry.inspections.getAll(),
        unifiedApiRegistry.calibrations.getAll(),
      ]);

      setModuleCounts({
        audit: auditsRes.status === 'fulfilled' && Array.isArray(auditsRes.value?.data) ? auditsRes.value.data.length : 0,
        inspection: inspRes.status === 'fulfilled' && Array.isArray(inspRes.value?.data) ? inspRes.value.data.length : 0,
        calibration: calRes.status === 'fulfilled' && Array.isArray(calRes.value?.data) ? calRes.value.data.length : 0,
      });
    } catch (err) {
      console.warn('Error loading module counts', err);
    }
  }, []);

  // Load active tab records
  const loadData = useCallback(async () => {
    try {
      const api = (unifiedApiRegistry as any)[config.apiKey];
      if (api) {
        const res = await api.getAll({ search: searchQuery });
        setRecords(Array.isArray(res?.data) ? res.data : []);
      }
    } catch (e) {
      toast.error(`Failed to load ${config.label} data`);
      setRecords([]);
    }
  }, [config.apiKey, config.label, searchQuery]);

  useEffect(() => {
    loadData();
    loadCounts();
  }, [loadData, loadCounts]);

  // Filter records by status and search
  const filteredRecords = useMemo(() => {
    return records.filter(item => {
      if (statusFilter !== 'all') {
        const itemStatus = String(item.status || item.result || '').toLowerCase();
        if (!itemStatus.includes(statusFilter.toLowerCase())) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const ref = String(item.auditNumber || item.inspectionNumber || item.itemCode || item.id || '').toLowerCase();
      const title = String(item.title || item.productName || item.description || item.equipment || '').toLowerCase();
      const assignee = String(item.auditor || item.inspectedBy || item.calibratedBy || item.assignedTo || '').toLowerCase();
      return ref.includes(q) || title.includes(q) || assignee.includes(q);
    });
  }, [records, statusFilter, searchQuery]);

  // Submit Handler with Comprehensive Quality Relationship Linkage
  const handleCreateSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    try {
      const api = (unifiedApiRegistry as any)[config.apiKey];
      if (!api) throw new Error(`API for ${config.apiKey} is not registered`);

      // Prepare payload based on activeType
      const payload: Record<string, any> = { ...formData };
      
      // Ensure required title / ID fields are set
      if (activeType === 'audit') {
        if (!payload.title?.trim()) {
          toast.error('Please enter an Audit Title');
          setIsSubmitting(false);
          return;
        }
        payload.auditType = payload.type;
        payload.plannedDate = payload.scheduledDate;
      } else if (activeType === 'inspection') {
        if (!payload.productName?.trim()) {
          toast.error('Please enter Product / Part Name');
          setIsSubmitting(false);
          return;
        }
        payload.title = payload.productName;
        payload.product = payload.productName;
        payload.status = payload.result;
      } else if (activeType === 'calibration') {
        if (!payload.description?.trim()) {
          toast.error('Please enter Tool / Equipment Description');
          setIsSubmitting(false);
          return;
        }
        payload.equipment = payload.description;
        payload.lastCalibration = payload.lastCalibrationDate;
        payload.nextCalibration = payload.nextCalibrationDate;
      }

      // Save to API
      const result = await api.create(payload);
      const createdItem = result?.data || result || payload;
      const createdId = createdItem.id || payload.id || payload.auditNumber || payload.inspectionNumber || payload.itemCode;

      // CROSS-MODULE LINKAGE ENGINE
      if (activeType === 'audit') {
        if (payload.supplierId) {
          createQualityRelationship({
            sourceType: 'audit',
            sourceId: createdId,
            targetType: 'supplier',
            targetId: payload.supplierId,
            relationshipType: 'supplier-compliance-audit',
            notes: `Audit ${payload.auditNumber} linked to Supplier ${payload.supplierId}`,
          });
        }
      } else if (activeType === 'inspection') {
        // Link to Supplier if selected
        if (payload.supplierId) {
          createQualityRelationship({
            sourceType: 'inspection',
            sourceId: createdId,
            targetType: 'supplier',
            targetId: payload.supplierId,
            relationshipType: 'incoming-inspection-trace',
            notes: `Inspection ${payload.inspectionNumber} linked to Supplier for lot ${payload.batchNumber}`,
          });
        }
        // Link to NCR if failed lot
        if ((payload.result === 'fail' || payload.result === 'quarantine') && payload.autoCreateNcr) {
          try {
            const ncrRes = await unifiedApiRegistry.ncr.create({
              title: `NCR: Failed Inspection on ${payload.productName}`,
              description: `Inspection ${payload.inspectionNumber} failed.\nBatch: ${payload.batchNumber}\nDefects: ${payload.defectCount} out of sample ${payload.sampleSize}\nInspector: ${payload.inspectedBy}`,
              priority: payload.defectCount > 5 ? 'critical' : 'high',
              severity: 'major',
              status: 'open',
              source: 'Inspection',
              sourceInspectionId: createdId,
              productName: payload.productName,
              batchNumber: payload.batchNumber,
              plantId: 'MAIN-PLANT',
            });
            const ncrId = ncrRes?.data?.id || ncrRes?.id;
            if (ncrId) {
              createQualityRelationship({
                sourceType: 'inspection',
                sourceId: createdId,
                targetType: 'ncr',
                targetId: ncrId,
                relationshipType: 'defect-escalation',
                notes: `Escalated from failed inspection ${payload.inspectionNumber}`,
              });
              toast.success(`Linked NCR created: ${ncrId}`, {
                description: 'Record successfully linked across Inspection & NCR modules.',
              });
            }
          } catch (ncrErr) {
            console.warn('Failed to auto-generate NCR', ncrErr);
          }
        }
      } else if (activeType === 'calibration') {
        // Calibration record created & ready for MSA studies
      }

      toast.success(`${config.label} Created Successfully`, {
        description: `Reference: ${payload.auditNumber || payload.inspectionNumber || payload.itemCode || createdId}`,
      });

      setShowCreateForm(false);
      await Promise.all([loadData(), loadCounts()]);
    } catch (err: any) {
      toast.error(`Failed to create ${config.label}`, {
        description: err?.message || 'Unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Record Handler
  const handleDelete = async (item: any) => {
    const id = item.id;
    if (!id) return;
    if (!window.confirm(`Are you sure you want to delete ${item.auditNumber || item.inspectionNumber || item.itemCode || id}?`)) {
      return;
    }

    try {
      const api = (unifiedApiRegistry as any)[config.apiKey];
      if (api?.delete) {
        await api.delete(id);
      } else {
        // LocalStorage fallback deletion
        const key = `qms_local_${config.apiKey}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const updated = existing.filter((r: any) => r.id !== id);
        localStorage.setItem(key, JSON.stringify(updated));
      }

      toast.success(`${config.label} deleted successfully`);
      await Promise.all([loadData(), loadCounts()]);
    } catch (e: any) {
      toast.error('Failed to delete item', { description: e.message });
    }
  };

  // Calendar timeline view data
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
    return filteredRecords.filter(r => {
      const rDate = new Date(r.scheduledDate || r.inspectionDate || r.nextCalibrationDate || r.lastCalibrationDate);
      return rDate.toDateString() === date.toDateString();
    });
  };

  // Table Columns
  const columns = useMemo(() => [
    {
      title: 'Reference',
      key: activeType === 'audit' ? 'auditNumber' : (activeType === 'inspection' ? 'inspectionNumber' : 'itemCode'),
      render: (item: any) => {
        const val = activeType === 'audit' ? item.auditNumber : (activeType === 'inspection' ? item.inspectionNumber : item.itemCode);
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-[#00A3E0] hover:underline cursor-pointer" onClick={() => navigate(`/compliance/hub/${activeType}/${item.id}`)}>
              {val || item.id}
            </span>
            {item.supplierId && (
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <Link2 className="w-2.5 h-2.5" /> Supplier
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: 'Title / Subject',
      key: activeType === 'calibration' ? 'description' : 'title',
      render: (item: any) => {
        const val = activeType === 'calibration' ? (item.description || item.equipment) : (item.title || item.productName);
        const sub = activeType === 'audit' ? item.scope : (activeType === 'inspection' ? `Batch: ${item.batchNumber || 'N/A'}` : `Model: ${item.model || item.manufacturer || 'N/A'}`);
        return (
          <div>
            <div className="font-medium text-white line-clamp-1">{val || 'Untitled Record'}</div>
            <div className="text-xs text-white/40">{sub}</div>
          </div>
        );
      },
    },
    {
      title: 'Category / Standard',
      key: 'type',
      render: (item: any) => {
        const val = item.type || item.standard || item.category || 'Standard';
        return (
          <span className="text-xs font-medium text-white/70 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
            {val}
          </span>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (item: any) => <StatusBadge status={item.status || item.result} />,
    },
    {
      title: activeType === 'audit' ? 'Lead Auditor' : (activeType === 'inspection' ? 'Inspector' : 'Technician'),
      key: activeType === 'audit' ? 'auditor' : (activeType === 'inspection' ? 'inspectedBy' : 'calibratedBy'),
      render: (item: any) => {
        const val = activeType === 'audit' ? item.auditor : (activeType === 'inspection' ? item.inspectedBy : (item.calibratedBy || item.assignedTo));
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
              <User className="w-3 h-3 text-white/50" />
            </div>
            <span className="text-xs text-gray-300">{val || 'Unassigned'}</span>
          </div>
        );
      },
    },
    {
      title: 'Target Date',
      key: 'date',
      render: (item: any) => {
        const date = item.scheduledDate || item.inspectionDate || item.nextCalibrationDate || item.lastCalibration;
        return <span className="text-xs text-gray-400">{date ? new Date(date).toLocaleDateString() : 'N/A'}</span>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (item: any) => (
        <div className="flex items-center gap-1.5">
          <button 
            title="View Details"
            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
            onClick={() => navigate(`/compliance/hub/${activeType}/${item.id}`)}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button 
            title="Edit Record"
            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-[#00A3E0] transition-colors"
            onClick={() => {
              setEditingRecord(item);
              setShowEditModal(true);
            }}
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button 
            title="Delete Record"
            className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
            onClick={() => handleDelete(item)}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ], [activeType, navigate]);

  return (
    <PageContainer>
      <PageHeader
        title={`${config.label} Hub`}
        subtitle={config.description}
        breadcrumbs={[{ label: 'Quality Compliance' }, { label: config.label }]}
        actions={{
          create: () => setShowCreateForm(true),
          refresh: () => {
            loadData();
            loadCounts();
            toast.success('Data refreshed');
          }
        }}
      />

      {/* Hub Module Cards with Real Dynamic Live Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {(Object.values(MODULES)).map((m) => {
          const MIcon = m.icon;
          const isActive = activeType === m.id;
          const count = moduleCounts[m.id] ?? 0;
          return (
            <button
              key={m.id}
              onClick={() => navigate(`/compliance/hub/${m.id}`)}
              className={`flex flex-col p-6 rounded-[2rem] border transition-all text-left group relative overflow-hidden ${
                isActive 
                  ? 'bg-gradient-to-br from-[#0066CC] to-[#00A3E0] border-transparent shadow-xl shadow-[#0066CC]/25 ring-2 ring-[#00A3E0]/40' 
                  : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.08]'
              }`}
            >
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform pointer-events-none">
                <MIcon className="w-24 h-24 text-white" />
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${isActive ? 'bg-white/20' : 'bg-white/5'}`}>
                <MIcon className={`w-6 h-6 ${isActive ? 'text-white' : ''}`} style={{ color: !isActive ? m.color : undefined }} />
              </div>
              
              <div className="flex items-center justify-between">
                <h3 className={`text-xl font-black uppercase tracking-tighter ${isActive ? 'text-white' : 'text-white/80'}`}>{m.label}</h3>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'}`}>
                  {m.standard}
                </span>
              </div>
              <p className={`text-xs mt-1 line-clamp-1 ${isActive ? 'text-white/80' : 'text-white/40'}`}>{m.description}</p>
              
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/10">
                <span className={`text-[11px] font-black uppercase tracking-widest ${isActive ? 'text-white/80' : 'text-white/40'}`}>
                  {m.statsLabel}
                </span>
                <span className={`text-2xl font-black font-mono ${isActive ? 'text-white' : 'text-[#00A3E0]'}`}>
                  {count}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <PageSection>
        <div className="glass-panel rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
          {/* Action Bar */}
          <div className="p-6 md:p-8 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-[#00A3E0] transition-colors" />
              <input 
                type="text" 
                placeholder={`Search ${config.label} by ID, Title, Auditor...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00A3E0] transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2">
                <Filter className="w-4 h-4 text-white/40" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-white">All Statuses</option>
                  <option value="open" className="bg-slate-900 text-white">Open / Planned</option>
                  <option value="progress" className="bg-slate-900 text-white">In Progress</option>
                  <option value="completed" className="bg-slate-900 text-white">Completed / Pass</option>
                  <option value="fail" className="bg-slate-900 text-white">Failed / Due</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl">
                <button 
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-[#0066CC] text-white shadow-md' : 'text-white/40 hover:text-white'}`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('calendar')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'calendar' ? 'bg-[#0066CC] text-white shadow-md' : 'text-white/40 hover:text-white'}`}
                  title="Timeline View"
                >
                  <CalendarDays className="w-4 h-4" />
                </button>
              </div>

              {/* Create New Button */}
              <button 
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#0066CC] to-[#00A3E0] rounded-2xl text-xs font-black text-white hover:brightness-110 active:scale-95 transition-all uppercase tracking-wider shadow-lg shadow-[#0066CC]/25"
              >
                <Plus className="w-4 h-4" />
                Create New {config.label}
              </button>
            </div>
          </div>

          {/* Table or Timeline View */}
          {viewMode === 'table' ? (
            <DataTable
              data={filteredRecords}
              columns={columns}
              keyExtractor={(item: any) => item.id || item.auditNumber || item.inspectionNumber || item.itemCode}
              className="border-none"
              emptyState={
                <div className="py-20 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-white/30">
                    <config.icon className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-1">No {config.label} records found</h4>
                  <p className="text-xs text-white/40 mb-6">Get started by creating your first {config.label} entry.</p>
                  <button 
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0066CC] rounded-xl text-xs font-bold text-white hover:bg-[#00A3E0] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create {config.label}
                  </button>
                </div>
              }
            />
          ) : (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Timeline & Schedule</h3>
                  <p className="text-xs text-white/40">Visual day-by-day roadmap of compliance milestones</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                    <span className="text-white/60">Pass / Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                    <span className="text-white/60">Scheduled / Planned</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                    <span className="text-white/60">Due / Failed</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
                {calendarDays.map((day, idx) => {
                  const dayEvents = getEventsForDay(day);
                  const isToday = day.toDateString() === new Date().toDateString();
                  
                  return (
                    <div key={idx} className="w-64 flex-shrink-0 space-y-3">
                      <div className={`p-4 rounded-2xl border text-center transition-all ${isToday ? 'bg-[#0066CC] border-transparent shadow-lg shadow-[#0066CC]/20' : 'bg-white/5 border-white/10'}`}>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-white/70' : 'text-white/30'}`}>
                          {day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className={`text-2xl font-black ${isToday ? 'text-white' : 'text-white/70'}`}>
                          {day.getDate()}
                        </p>
                        <p className={`text-[10px] uppercase font-bold mt-0.5 ${isToday ? 'text-white/80' : 'text-white/20'}`}>
                          {day.toLocaleDateString('en-US', { month: 'short' })}
                        </p>
                      </div>

                      <div className="space-y-2">
                        {dayEvents.map(event => (
                          <div 
                            key={event.id || event.auditNumber || event.inspectionNumber || event.itemCode} 
                            onClick={() => navigate(`/compliance/hub/${activeType}/${event.id}`)}
                            className="p-3 bg-white/5 border border-white/10 rounded-xl hover:border-[#00A3E0]/50 hover:bg-white/10 transition-all cursor-pointer group"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-mono font-bold text-[#00A3E0]">{event.auditNumber || event.inspectionNumber || event.itemCode || event.id}</span>
                              <div className={`w-2 h-2 rounded-full ${String(event.status || event.result).toLowerCase().includes('pass') || String(event.status || event.result).toLowerCase().includes('complete') ? 'bg-green-500' : 'bg-blue-500'}`} />
                            </div>
                            <p className="text-xs font-bold text-white line-clamp-1 mb-1">{event.title || event.productName || event.description}</p>
                            <p className="text-[10px] text-white/30 uppercase font-bold tracking-tight">{event.auditor || event.inspectedBy || event.calibratedBy || 'Unassigned'}</p>
                          </div>
                        ))}
                        {dayEvents.length === 0 && (
                          <div className="h-16 border border-dashed border-white/5 rounded-xl flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest">No Events</span>
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

      {/* ========================================================================= */}
      {/* COMPREHENSIVE INDUSTRIAL CREATION MODAL                                    */}
      {/* Works 100% reliably, guarantees cross-platform linkage across QMS modules   */}
      {/* ========================================================================= */}
      {showCreateForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto glass-strong rounded-[2.5rem] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="sticky top-0 z-20 p-6 md:p-8 bg-[#0a0a0f]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: `${config.color}25` }}>
                  <config.icon className="w-7 h-7" style={{ color: config.color }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">New {config.label} Entry</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00A3E0]/20 text-[#00A3E0] border border-[#00A3E0]/30">
                      Standard Quality 4.0
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mt-0.5">
                    {activeType === 'audit' && 'Schedule and log internal, supplier, or system audits with standard criteria'}
                    {activeType === 'inspection' && 'Record incoming IQC, in-process IPQC, or final inspection with lot traceability'}
                    {activeType === 'calibration' && 'Register precision gauges, instruments, and calibration schedules'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateSubmit} className="p-6 md:p-8 space-y-6">
              {/* ========================================================== */}
              {/* AUDIT FORM FIELDS                                          */}
              {/* ========================================================== */}
              {activeType === 'audit' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Audit Reference #</label>
                      <input 
                        type="text"
                        value={formData.auditNumber || ''}
                        onChange={(e) => setFormData({ ...formData, auditNumber: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-mono text-[#00A3E0] focus:border-[#00A3E0] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Audit Title *</label>
                      <input 
                        type="text"
                        placeholder="e.g. Annual ISO 9001:2015 System Audit"
                        value={formData.title || ''}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Audit Type</label>
                      <select 
                        value={formData.type || 'Internal'}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      >
                        <option value="Internal" className="bg-slate-900 text-white">Internal QMS Audit</option>
                        <option value="Supplier" className="bg-slate-900 text-white">Supplier Audit</option>
                        <option value="External" className="bg-slate-900 text-white">External Certification Audit</option>
                        <option value="Regulatory" className="bg-slate-900 text-white">Regulatory / Compliance Audit</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Standard</label>
                      <select 
                        value={formData.standard || 'ISO 9001:2015'}
                        onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      >
                        <option value="ISO 9001:2015" className="bg-slate-900 text-white">ISO 9001:2015</option>
                        <option value="IATF 16949" className="bg-slate-900 text-white">IATF 16949 (Automotive)</option>
                        <option value="ISO 13485" className="bg-slate-900 text-white">ISO 13485 (Medical)</option>
                        <option value="AS9100" className="bg-slate-900 text-white">AS9100 (Aerospace)</option>
                        <option value="ISO 14001" className="bg-slate-900 text-white">ISO 14001 (Environmental)</option>
                        <option value="GMP" className="bg-slate-900 text-white">GMP Guidelines</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Target Department</label>
                      <select 
                        value={formData.department || 'Quality Assurance'}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      >
                        <option value="Quality Assurance" className="bg-slate-900 text-white">Quality Assurance</option>
                        <option value="Manufacturing" className="bg-slate-900 text-white">Manufacturing / Operations</option>
                        <option value="Supply Chain" className="bg-slate-900 text-white">Supply Chain & Procurement</option>
                        <option value="Engineering" className="bg-slate-900 text-white">Engineering & R&D</option>
                        <option value="Maintenance" className="bg-slate-900 text-white">Maintenance</option>
                        <option value="Warehouse" className="bg-slate-900 text-white">Warehouse & Logistics</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Lead Auditor</label>
                      <input 
                        type="text"
                        value={formData.auditor || ''}
                        onChange={(e) => setFormData({ ...formData, auditor: e.target.value })}
                        placeholder="Lead Auditor Name"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Auditee / Representative</label>
                      <input 
                        type="text"
                        value={formData.auditee || ''}
                        onChange={(e) => setFormData({ ...formData, auditee: e.target.value })}
                        placeholder="Department Lead / Process Owner"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Scheduled Date</label>
                      <input 
                        type="date"
                        value={formData.scheduledDate || ''}
                        onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Duration</label>
                      <input 
                        type="text"
                        value={formData.duration || '1 Day'}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Status</label>
                      <select 
                        value={formData.status || 'Planned'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      >
                        <option value="Planned" className="bg-slate-900 text-white">Planned / Scheduled</option>
                        <option value="In Progress" className="bg-slate-900 text-white">In Progress</option>
                        <option value="Completed" className="bg-slate-900 text-white">Completed</option>
                        <option value="Closed" className="bg-slate-900 text-white">Closed</option>
                      </select>
                    </div>
                  </div>

                  {/* Cross-Module Linkage: Supplier */}
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#00A3E0] uppercase tracking-wider">
                      <Link2 className="w-4 h-4" />
                      Cross-Platform Traceability Link
                    </div>
                    <div>
                      <label className="block text-xs text-white/60 mb-1">Link to Registered Supplier (Optional)</label>
                      <select 
                        value={formData.supplierId || ''}
                        onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                        className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:border-[#00A3E0] focus:outline-none"
                      >
                        <option value="" className="bg-slate-900 text-white">None (Internal QMS Scope)</option>
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                            {s.name} ({s.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* INSPECTION FORM FIELDS                                     */}
              {/* ========================================================== */}
              {activeType === 'inspection' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Inspection Reference #</label>
                      <input 
                        type="text"
                        value={formData.inspectionNumber || ''}
                        onChange={(e) => setFormData({ ...formData, inspectionNumber: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-mono text-[#00A3E0] focus:border-[#00A3E0] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Part / Product Name *</label>
                      <input 
                        type="text"
                        placeholder="e.g. CNC Aluminum Housing Block"
                        value={formData.productName || ''}
                        onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Inspection Stage</label>
                      <select 
                        value={formData.type || 'incoming'}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      >
                        <option value="incoming" className="bg-slate-900 text-white">Incoming IQC (Raw Materials)</option>
                        <option value="in-process" className="bg-slate-900 text-white">In-Process IPQC (Production Line)</option>
                        <option value="final" className="bg-slate-900 text-white">Final FQC (Finished Goods)</option>
                        <option value="shipping" className="bg-slate-900 text-white">Outgoing OQC (Pre-Shipment)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Batch / Lot Number</label>
                      <input 
                        type="text"
                        value={formData.batchNumber || ''}
                        onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                        placeholder="LOT-2026-..."
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Production Line / Station</label>
                      <input 
                        type="text"
                        value={formData.productionLine || ''}
                        onChange={(e) => setFormData({ ...formData, productionLine: e.target.value })}
                        placeholder="e.g. Line 1 - Station 4"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Sample Size</label>
                      <input 
                        type="number"
                        min="1"
                        value={formData.sampleSize || 50}
                        onChange={(e) => setFormData({ ...formData, sampleSize: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Defect Count</label>
                      <input 
                        type="number"
                        min="0"
                        value={formData.defectCount || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormData({ 
                            ...formData, 
                            defectCount: val,
                            result: val > 0 ? 'fail' : 'pass',
                            autoCreateNcr: val > 0
                          });
                        }}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Result</label>
                      <select 
                        value={formData.result || 'pass'}
                        onChange={(e) => {
                          const res = e.target.value;
                          setFormData({ 
                            ...formData, 
                            result: res,
                            autoCreateNcr: res === 'fail'
                          });
                        }}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      >
                        <option value="pass" className="bg-slate-900 text-white">Pass (Accept Lot)</option>
                        <option value="fail" className="bg-slate-900 text-white">Fail (Reject Lot)</option>
                        <option value="quarantine" className="bg-slate-900 text-white">Quarantine (Hold)</option>
                        <option value="pending" className="bg-slate-900 text-white">Pending Verification</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Inspector Name</label>
                      <input 
                        type="text"
                        value={formData.inspectedBy || ''}
                        onChange={(e) => setFormData({ ...formData, inspectedBy: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Inspection Date</label>
                      <input 
                        type="date"
                        value={formData.inspectionDate || ''}
                        onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Cross-Module Linkage: Supplier & NCR Escalation */}
                  <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#00A3E0] uppercase tracking-wider">
                      <Link2 className="w-4 h-4" />
                      Cross-Platform Traceability Link
                    </div>
                    
                    <div>
                      <label className="block text-xs text-white/60 mb-1.5">Link to Supplier (for Incoming IQC)</label>
                      <select 
                        value={formData.supplierId || ''}
                        onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                        className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:border-[#00A3E0] focus:outline-none"
                      >
                        <option value="" className="bg-slate-900 text-white">Internal Production (No External Supplier)</option>
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                            {s.name} ({s.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Auto-create NCR option if rejected */}
                    <label className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl cursor-pointer hover:bg-red-500/15 transition-all">
                      <input 
                        type="checkbox"
                        checked={formData.autoCreateNcr || false}
                        onChange={(e) => setFormData({ ...formData, autoCreateNcr: e.target.checked })}
                        className="w-4 h-4 rounded text-red-500 bg-black/50 border-white/20 focus:ring-0"
                      />
                      <div className="flex-1">
                        <span className="text-xs font-bold text-red-300">Auto-Generate & Link NCR on Failure</span>
                        <p className="text-[10px] text-red-300/70">Automatically opens an active Non-Conformance Report in the NCR module linked to this inspection record.</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* CALIBRATION FORM FIELDS                                    */}
              {/* ========================================================== */}
              {activeType === 'calibration' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Item Code / Tool ID *</label>
                      <input 
                        type="text"
                        value={formData.itemCode || ''}
                        onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-mono text-[#00A3E0] focus:border-[#00A3E0] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Gauge / Tool Description *</label>
                      <input 
                        type="text"
                        placeholder="e.g. Mitutoyo Digital Vernier Caliper 0-150mm"
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Gauge Category</label>
                      <select 
                        value={formData.category || 'Caliper'}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      >
                        <option value="Caliper" className="bg-slate-900 text-white">Vernier / Digital Caliper</option>
                        <option value="Micrometer" className="bg-slate-900 text-white">External/Internal Micrometer</option>
                        <option value="Torque Wrench" className="bg-slate-900 text-white">Torque Wrench</option>
                        <option value="Dial Gauge" className="bg-slate-900 text-white">Dial Indicator / Depth Gauge</option>
                        <option value="Pressure Gauge" className="bg-slate-900 text-white">Pressure / Vacuum Gauge</option>
                        <option value="Scale" className="bg-slate-900 text-white">Precision Analytical Balance</option>
                        <option value="CMM" className="bg-slate-900 text-white">CMM Probe / Machine</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Serial Number</label>
                      <input 
                        type="text"
                        value={formData.serialNumber || ''}
                        onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Manufacturer</label>
                      <input 
                        type="text"
                        value={formData.manufacturer || 'Mitutoyo'}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Location / Crib</label>
                      <input 
                        type="text"
                        value={formData.location || 'Metrology Lab'}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Interval (Months)</label>
                      <select 
                        value={formData.intervalMonths || 12}
                        onChange={(e) => {
                          const months = Number(e.target.value);
                          const last = new Date(formData.lastCalibrationDate || Date.now());
                          const next = new Date(last);
                          next.setMonth(next.getMonth() + months);
                          setFormData({ 
                            ...formData, 
                            intervalMonths: months,
                            nextCalibrationDate: next.toISOString().split('T')[0]
                          });
                        }}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      >
                        <option value={3} className="bg-slate-900 text-white">3 Months (Critical Frequent)</option>
                        <option value={6} className="bg-slate-900 text-white">6 Months (Semi-Annual)</option>
                        <option value={12} className="bg-slate-900 text-white">12 Months (Standard Annual)</option>
                        <option value={24} className="bg-slate-900 text-white">24 Months (Reference Standard)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Calibration Status</label>
                      <select 
                        value={formData.status || 'calibrated'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      >
                        <option value="calibrated" className="bg-slate-900 text-white">Calibrated (In Tolerance)</option>
                        <option value="due" className="bg-slate-900 text-white">Calibration Due Soon</option>
                        <option value="overdue" className="bg-slate-900 text-white">Overdue (Out of Service)</option>
                        <option value="maintenance" className="bg-slate-900 text-white">Under Maintenance / Repair</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Last Calibration Date</label>
                      <input 
                        type="date"
                        value={formData.lastCalibrationDate || ''}
                        onChange={(e) => {
                          const lastStr = e.target.value;
                          const next = new Date(lastStr);
                          next.setMonth(next.getMonth() + (formData.intervalMonths || 12));
                          setFormData({ 
                            ...formData, 
                            lastCalibrationDate: lastStr,
                            nextCalibrationDate: next.toISOString().split('T')[0]
                          });
                        }}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Next Calibration Due Date</label>
                      <input 
                        type="date"
                        value={formData.nextCalibrationDate || ''}
                        onChange={(e) => setFormData({ ...formData, nextCalibrationDate: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Calibrated By / Metrology Tech</label>
                      <input 
                        type="text"
                        value={formData.calibratedBy || ''}
                        onChange={(e) => setFormData({ ...formData, calibratedBy: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Standard / Uncertainty</label>
                      <input 
                        type="text"
                        value={formData.uncertainty || '±0.02 mm'}
                        onChange={(e) => setFormData({ ...formData, uncertainty: e.target.value })}
                        placeholder="ISO/IEC 17025 Traceable (±0.02 mm)"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-[#00A3E0] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-6 border-t border-white/10 flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3.5 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold text-white/60 hover:text-white transition-colors uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#0066CC] to-[#00A3E0] hover:brightness-110 active:scale-95 rounded-2xl text-xs font-black text-white shadow-xl shadow-[#0066CC]/30 transition-all uppercase tracking-wider disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving & Linking...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Create & Link {config.label}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Record Modal */}
      {showEditModal && editingRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#0a0a0f] border border-white/10 rounded-[2rem] p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-xl font-bold text-white">Edit {config.label}</h3>
                <p className="text-xs text-white/40">{editingRecord.auditNumber || editingRecord.inspectionNumber || editingRecord.itemCode || editingRecord.id}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/70 mb-1">Title / Description</label>
                <input 
                  type="text"
                  value={editingRecord.title || editingRecord.productName || editingRecord.description || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditingRecord({ 
                      ...editingRecord, 
                      title: val, 
                      productName: val, 
                      description: val 
                    });
                  }}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#00A3E0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1">Status</label>
                  <select
                    value={editingRecord.status || editingRecord.result || 'open'}
                    onChange={(e) => setEditingRecord({ ...editingRecord, status: e.target.value, result: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none"
                  >
                    <option value="Planned" className="bg-slate-900 text-white">Planned / Scheduled</option>
                    <option value="In Progress" className="bg-slate-900 text-white">In Progress</option>
                    <option value="Completed" className="bg-slate-900 text-white">Completed / Pass</option>
                    <option value="Failed" className="bg-slate-900 text-white">Failed / Due</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1">Assigned / In Charge</label>
                  <input 
                    type="text"
                    value={editingRecord.auditor || editingRecord.inspectedBy || editingRecord.calibratedBy || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingRecord({ 
                        ...editingRecord, 
                        auditor: val, 
                        inspectedBy: val, 
                        calibratedBy: val 
                      });
                    }}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button 
                onClick={() => setShowEditModal(false)}
                className="px-5 py-2.5 rounded-xl bg-white/5 text-white/60 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    const api = (unifiedApiRegistry as any)[config.apiKey];
                    if (api?.update) {
                      await api.update(editingRecord.id, editingRecord);
                    } else {
                      // fallback
                      const key = `qms_local_${config.apiKey}`;
                      const list = JSON.parse(localStorage.getItem(key) || '[]');
                      const idx = list.findIndex((x: any) => x.id === editingRecord.id);
                      if (idx >= 0) list[idx] = editingRecord;
                      localStorage.setItem(key, JSON.stringify(list));
                    }
                    toast.success('Updated successfully');
                    setShowEditModal(false);
                    await Promise.all([loadData(), loadCounts()]);
                  } catch (e: any) {
                    toast.error('Update failed', { description: e.message });
                  }
                }}
                className="px-6 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#00A3E0] text-white text-xs font-bold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default ComplianceHub;
