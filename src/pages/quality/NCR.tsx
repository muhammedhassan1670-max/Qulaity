// QMS Enterprise 4.0 - Non-Conformance Report (NCR) Workspace - Professional Edition
import { useState, useEffect, useMemo } from 'react';
import { PageHeader, PageContainer, PageSection, StatsBar } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { FilterPanel } from '../../components/FilterPanel';
import { BulkActionBar } from '../../components/BulkActionBar';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { toast } from 'sonner';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  X, 
  Edit3, 
  Eye, 
  ShieldAlert, 
  AlertCircle, 
  Building, 
  Target, 
  FileCheck2, 
  Trash2, 
  LayoutGrid, 
  Table as TableIcon, 
  ClipboardList,
  Layers,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  unifiedNcrApi as ncrApi,
  type NcrData 
} from '../../api/unified-api';
import { exportData, prepareDataForExport } from '../../utils/exportUtils';
import { useTranslation } from '@/utils/translations';

export interface NCRItem {
  id: string;
  ncrNumber?: string;
  title: string;
  description: string;
  defectType: string;
  severity: 'critical' | 'major' | 'minor';
  status: 'open' | 'in-progress' | 'under-review' | 'disposition' | 'closed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  createdDate: string;
  dueDate: string;
  assignedTo: string;
  department: string;
  productionLine: string;
  affectedQuantity: number;
  lotNumber: string;
  containmentAction: string;
  disposition: 'rework' | 'scrap' | 'return-to-vendor' | 'use-as-is' | 'pending';
  dispositionNotes?: string;
  rootCauseNotes?: string;
  source: string;
  [key: string]: unknown;
}

export const DEFAULT_NCRS: NCRItem[] = [];
export const mockNCRs: NCRItem[] = [];

function generateNCRNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 900) + 100;
  return `NCR-${year}-${random}`;
}

export function NCRPage() {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [ncrs, setNcrs] = useState<NCRItem[]>(() => {
    try {
      const local = localStorage.getItem('qms_local_ncr');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_NCRS;
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});
  const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });

  // View Mode: 'cards' or 'table'
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    return (localStorage.getItem('qms_ncr_view_mode') as 'cards' | 'table') || 'cards';
  });

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNcr, setEditingNcr] = useState<NCRItem | null>(null);
  const [viewingNcr, setViewingNcr] = useState<NCRItem | null>(null);
  const [ncrToDelete, setNcrToDelete] = useState<NCRItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    defectType: 'Dimensional / Geometry',
    severity: 'major' as 'critical' | 'major' | 'minor',
    status: 'open' as NCRItem['status'],
    priority: 'medium' as NCRItem['priority'],
    department: 'Quality Assurance',
    productionLine: 'Line 01',
    affectedQuantity: 1,
    lotNumber: '',
    containmentAction: '',
    disposition: 'pending' as NCRItem['disposition'],
    dispositionNotes: '',
    rootCauseNotes: '',
    assignedTo: 'Eng. Quality Team',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  });

  const handleSetViewMode = (mode: 'cards' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('qms_ncr_view_mode', mode);
  };

  const saveNcrs = (items: NCRItem[]) => {
    setNcrs(items);
    try {
      localStorage.setItem('qms_local_ncr', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save NCRs locally:', e);
    }
  };

  const loadNcrs = async () => {
    try {
      setIsLoading(true);
      const response = await ncrApi.getAll().catch(() => ({ data: [] as NcrData[] }));

      if (response?.data && response.data.length > 0) {
        const transformed: NCRItem[] = response.data.map((ncr: any) => ({
          id: ncr.id,
          ncrNumber: ncr.ncrNumber || ncr.id,
          title: ncr.title || 'Untitled NCR',
          description: ncr.description || '',
          defectType: ncr.defectType || 'General Defect',
          severity: (ncr.severity?.toLowerCase() as any) || 'major',
          status: (ncr.status?.toLowerCase().replace('_', '-') as any) || 'open',
          priority: (ncr.priority?.toLowerCase() as any) || 'medium',
          createdDate: ncr.detectedDate || ncr.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          dueDate: ncr.targetCloseDate || ncr.targetDate || ncr.dueDate || new Date().toISOString().split('T')[0],
          assignedTo: ncr.assignedUser?.name || ncr.assignedTo || 'Unassigned',
          department: ncr.department?.name || ncr.department || 'Quality Assurance',
          productionLine: ncr.productionLine || ncr.line || 'Line 01',
          affectedQuantity: ncr.affectedQuantity || ncr.quantity || 1,
          lotNumber: ncr.lotNumber || '',
          containmentAction: ncr.containmentAction || ncr.containment || '',
          disposition: (ncr.disposition?.toLowerCase() as any) || 'pending',
          dispositionNotes: ncr.dispositionNotes || '',
          rootCauseNotes: ncr.rootCauseNotes || ncr.rootCause || '',
          source: ncr.source || 'Inspection',
          ...ncr
        }));
        saveNcrs(transformed);
      } else {
        const stored = localStorage.getItem('qms_local_ncr');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setNcrs(parsed);
          } else {
            saveNcrs(DEFAULT_NCRS);
          }
        } else {
          saveNcrs(DEFAULT_NCRS);
        }
      }
    } catch {
      const stored = localStorage.getItem('qms_local_ncr');
      if (stored) {
        setNcrs(JSON.parse(stored));
      } else {
        saveNcrs(DEFAULT_NCRS);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNcrs();
  }, []);

  // Support deep-link /ncr/:id
  useEffect(() => {
    const id = params.id;
    if (!id || ncrs.length === 0) return;
    const found = ncrs.find((n) => n.id === id || n.ncrNumber === id);
    if (found) {
      setViewingNcr(found);
    }
  }, [params.id, ncrs]);

  // Support create via query parameters
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get('create') === '1' || p.get('source') || p.get('title')) {
      handleOpenCreate(p.get('source') || undefined, p.get('title') || undefined);
    }
  }, [location.search]);

  const stats = useMemo(() => [
    { label: isAr ? 'إجمالي تقارير عدم المطابقة' : 'Active NCRs', value: ncrs.filter(n => n.status !== 'closed').length, change: '0', trend: 'neutral' as const },
    { label: isAr ? 'حالات حرجة (Critical)' : 'Critical', value: ncrs.filter(n => n.severity === 'critical' || n.priority === 'critical').length, change: '0', trend: 'neutral' as const },
    { label: isAr ? 'بانتظار القرار (Disposition)' : 'Pending Disposition', value: ncrs.filter(n => n.disposition === 'pending' || n.status === 'under-review').length, change: '0', trend: 'neutral' as const },
    { label: isAr ? 'مغلق ومصحح' : 'Closed', value: ncrs.filter(n => n.status === 'closed').length, change: '0', trend: 'neutral' as const }
  ], [ncrs, isAr]);

  const filteredNCRs = useMemo(() => {
    return ncrs.filter(ncr => {
      const matchesSearch = !searchQuery || 
        ncr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ncr.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ncr.ncrNumber && ncr.ncrNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ncr.assignedTo && ncr.assignedTo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ncr.department && ncr.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ncr.description && ncr.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const statusFilter = activeFilters['status'] as string[];
      const matchesStatus = !statusFilter || statusFilter.length === 0 || statusFilter.includes(ncr.status);

      const priorityFilter = activeFilters['priority'] as string[];
      const matchesPriority = !priorityFilter || priorityFilter.length === 0 || priorityFilter.includes(ncr.priority);

      const severityFilter = activeFilters['severity'] as string[];
      const matchesSeverity = !severityFilter || severityFilter.length === 0 || severityFilter.includes(ncr.severity);

      return matchesSearch && matchesStatus && matchesPriority && matchesSeverity;
    });
  }, [ncrs, searchQuery, activeFilters]);

  const handleOpenCreate = (_sourceStr?: string, initialTitle?: string) => {
    const p = new URLSearchParams(location.search);
    setFormData({
      title: initialTitle || p.get('title') || '',
      description: p.get('desc') || p.get('description') || '',
      defectType: p.get('defectType') || 'Dimensional / Geometry',
      severity: (p.get('severity') as any) || 'major',
      status: 'open',
      priority: (p.get('priority') as any) || 'medium',
      department: p.get('department') || 'Quality Assurance',
      productionLine: p.get('line') || p.get('productionLine') || 'Line 01',
      affectedQuantity: Number(p.get('qty')) || 1,
      lotNumber: p.get('lot') || p.get('partNumber') || '',
      containmentAction: p.get('containment') || '',
      disposition: 'pending',
      dispositionNotes: '',
      rootCauseNotes: '',
      assignedTo: 'Eng. Quality Team',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    });
    setEditingNcr(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (ncr: NCRItem) => {
    setFormData({
      title: ncr.title || '',
      description: ncr.description || '',
      defectType: ncr.defectType || 'Dimensional / Geometry',
      severity: ncr.severity || 'major',
      status: ncr.status || 'open',
      priority: ncr.priority || 'medium',
      department: ncr.department || 'Quality Assurance',
      productionLine: ncr.productionLine || 'Line 01',
      affectedQuantity: ncr.affectedQuantity || 1,
      lotNumber: ncr.lotNumber || '',
      containmentAction: ncr.containmentAction || '',
      disposition: ncr.disposition || 'pending',
      dispositionNotes: ncr.dispositionNotes || '',
      rootCauseNotes: ncr.rootCauseNotes || '',
      assignedTo: ncr.assignedTo || '',
      dueDate: ncr.dueDate || new Date().toISOString().split('T')[0],
    });
    setEditingNcr(ncr);
    setIsFormOpen(true);
  };

  const handleOpenView = (ncr: NCRItem) => {
    setViewingNcr(ncr);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingNcr) {
      const updatedItem: NCRItem = {
        ...editingNcr,
        title: formData.title.trim(),
        description: formData.description.trim(),
        defectType: formData.defectType,
        severity: formData.severity,
        status: formData.status,
        priority: formData.priority,
        department: formData.department.trim(),
        productionLine: formData.productionLine.trim(),
        affectedQuantity: Number(formData.affectedQuantity) || 1,
        lotNumber: formData.lotNumber.trim(),
        containmentAction: formData.containmentAction.trim(),
        disposition: formData.disposition,
        dispositionNotes: formData.dispositionNotes.trim(),
        rootCauseNotes: formData.rootCauseNotes.trim(),
        assignedTo: formData.assignedTo.trim(),
        dueDate: formData.dueDate,
      };

      const updatedList = ncrs.map((n) => (n.id === editingNcr.id ? updatedItem : n));
      saveNcrs(updatedList);

      ncrApi.update(editingNcr.id, {
        title: updatedItem.title,
        description: updatedItem.description,
        status: updatedItem.status as any,
        priority: updatedItem.priority as any,
      }).catch(() => null);

      if (viewingNcr?.id === editingNcr.id) {
        setViewingNcr(updatedItem);
      }

      toast.success(isAr ? `تم تحديث تقرير عدم المطابقة (${updatedItem.ncrNumber || updatedItem.id}) بنجاح` : `NCR ${updatedItem.id} updated`);
      setIsFormOpen(false);
      setEditingNcr(null);
    } else {
      const newId = generateNCRNumber();
      const newNcr: NCRItem = {
        id: newId,
        ncrNumber: newId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        defectType: formData.defectType,
        severity: formData.severity,
        status: formData.status,
        priority: formData.priority,
        department: formData.department.trim(),
        productionLine: formData.productionLine.trim(),
        affectedQuantity: Number(formData.affectedQuantity) || 1,
        lotNumber: formData.lotNumber.trim(),
        containmentAction: formData.containmentAction.trim(),
        disposition: formData.disposition,
        dispositionNotes: formData.dispositionNotes.trim(),
        rootCauseNotes: formData.rootCauseNotes.trim(),
        assignedTo: formData.assignedTo.trim() || 'Quality Team',
        createdDate: new Date().toISOString().split('T')[0],
        dueDate: formData.dueDate,
        source: 'Manual Entry',
      };

      const nextList = [newNcr, ...ncrs];
      saveNcrs(nextList);

      (ncrApi.create as any)({
        title: newNcr.title,
        description: newNcr.description,
        status: newNcr.status as any,
        priority: newNcr.priority as any,
      }).catch(() => null);

      toast.success(isAr ? `تم إنشاء تقرير عدم مطابقة جديد: ${newId}` : `New NCR created: ${newId}`);
      setIsFormOpen(false);
    }
  };

  const handleConfirmDelete = () => {
    if (!ncrToDelete) return;
    const filtered = ncrs.filter((n) => n.id !== ncrToDelete.id);
    saveNcrs(filtered);
    toast.success(isAr ? `تم حذف التقرير ${ncrToDelete.ncrNumber || ncrToDelete.id}` : `NCR ${ncrToDelete.id} deleted`);
    setNcrToDelete(null);
    if (viewingNcr?.id === ncrToDelete.id) setViewingNcr(null);
  };

  const handleCreateCapaFromNcr = (ncr: NCRItem) => {
    navigate(`/capa?create=1&sourceNCRId=${ncr.ncrNumber || ncr.id}&title=${encodeURIComponent(ncr.title)}`);
  };

  const handleCreateEightDFromNcr = (ncr: NCRItem) => {
    navigate(`/8d?create=1&sourceNCRId=${ncr.ncrNumber || ncr.id}&title=${encodeURIComponent(ncr.title)}`);
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
        id: 'NCR ID',
        title: 'Title',
        description: 'Description',
        defectType: 'Defect Type',
        severity: 'Severity',
        status: 'Status',
        priority: 'Priority',
        productionLine: 'Line',
        affectedQuantity: 'Quantity',
        assignedTo: 'Assigned To',
        department: 'Department',
        disposition: 'Disposition',
        createdDate: 'Created Date',
        dueDate: 'Due Date'
      };

      const preparedData = prepareDataForExport(dataToExport, mapping);
      exportData(preparedData, `NCR_Report`, 'Non-Conformance Reports', format);
      toast.success(`Successfully exported ${dataToExport.length} reports`);
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={isAr ? 'تقارير عدم المطابقة (NCR)' : 'Non-Conformance Reports (NCR)'}
        subtitle={isAr ? 'حصر وتوثيق حالات عدم المطابقة الصناعية، إجراءات الاحتواء، وتحديد قرارات التصرف (Disposition)' : 'Register, contain, and resolve non-conformance incidents across production'}
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'NCR' }]}
        actions={{
          create: () => handleOpenCreate(),
          refresh: loadNcrs,
          export: () => handleExport('excel')
        }}
      />

      <StatsBar stats={stats} />

      <PageSection>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={isAr ? 'بحث برقم NCR، العنوان، نوع العيب، المسؤول، أو القسم...' : 'Search NCR by ID, title, defect type, owner...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rtl:pr-10 rtl:pl-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3E0] transition-colors text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => handleSetViewMode('cards')}
                    className={`p-2 rounded-xl transition-all ${
                      viewMode === 'cards' 
                        ? 'bg-[#00A3E0] text-slate-950 font-bold shadow-md' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title={isAr ? 'عرض البطاقات' : 'Cards View'}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetViewMode('table')}
                    className={`p-2 rounded-xl transition-all ${
                      viewMode === 'table' 
                        ? 'bg-[#00A3E0] text-slate-950 font-bold shadow-md' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title={isAr ? 'عرض الجدول' : 'Table View'}
                  >
                    <TableIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Filter Toggle */}
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-11 px-3.5 rounded-2xl border flex items-center gap-2 text-sm transition-all ${
                    showFilters || Object.values(activeFilters).flat().length > 0
                      ? 'bg-[#00A3E0]/15 border-[#00A3E0] text-[#00A3E0]'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">{isAr ? 'تصفية' : 'Filters'}</span>
                </button>

                {/* SCADA Floorplan Deep Link */}
                <Link
                  to="/quality-tower"
                  className="h-11 px-3.5 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 flex items-center gap-2 text-xs font-bold transition-all shadow-sm"
                  title={isAr ? 'عرض برج المراقبة وخريطة المصنع الرقمية' : 'View SCADA Factory Floorplan'}
                >
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span className="hidden md:inline">{isAr ? 'خريطة المصنع' : 'Plant Floorplan'}</span>
                </Link>

                <Button 
                  onClick={() => handleOpenCreate()}
                  className="h-11 px-4 sm:px-5 bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white rounded-2xl hover:opacity-90 font-bold shadow-lg shadow-[#0066CC]/20 flex items-center gap-2 text-xs sm:text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? 'تقرير NCR جديد' : 'New NCR'}</span>
                </Button>
              </div>
            </div>

            {/* Bulk Actions */}
            <BulkActionBar
              selectedCount={selectedIds.length}
              itemName="NCRs"
              onClearSelection={() => setSelectedIds([])}
              onExport={(format) => handleExport(format, selectedIds)}
            />

            {/* VIEW MODE 1: CARDS GRID */}
            {viewMode === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {isLoading ? (
                  <div className="col-span-full py-16 text-center text-gray-400 rounded-3xl border border-white/10 bg-slate-900/60 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[#00A3E0] border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-sm font-bold text-gray-300">{isAr ? 'جاري تحميل تقارير عدم المطابقة...' : 'Loading NCR records...'}</p>
                  </div>
                ) : filteredNCRs.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-gray-500 rounded-3xl border border-white/10 bg-slate-900/60">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#00A3E0]" />
                    <p className="text-base font-bold text-gray-300">
                      {isAr ? 'لا توجد تقارير عدم مطابقة مطابقة للبحث' : 'No NCR records found'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {isAr ? 'انقر على "تقرير NCR جديد" لتسجيل حالة عدم مطابقة' : 'Click "New NCR" to log a non-conformance'}
                    </p>
                  </div>
                ) : (
                  filteredNCRs.map((ncr) => (
                    <div
                      key={ncr.id}
                      onClick={() => handleOpenView(ncr)}
                      className="rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-5 shadow-2xl flex flex-col justify-between hover:border-[#00A3E0]/40 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="space-y-3.5">
                        {/* Header ID & Status */}
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-[#00A3E0] font-mono font-bold text-xs bg-[#00A3E0]/10 px-2.5 py-1 rounded-xl border border-[#00A3E0]/20">
                              {ncr.ncrNumber || ncr.id}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                              ncr.severity === 'critical' ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' :
                              ncr.severity === 'major' ? 'bg-orange-500/10 text-orange-300 border-orange-500/20' : 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20'
                            }`}>
                              {ncr.severity.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <StatusBadge status={ncr.status} size="sm" />
                            <PriorityBadge priority={ncr.priority} size="sm" />
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h4 className="text-white font-bold text-base leading-snug line-clamp-2 group-hover:text-[#00A3E0] transition-colors">
                            {ncr.title}
                          </h4>
                          <p className="text-gray-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                            {ncr.description}
                          </p>
                        </div>

                        {/* Defect Type & Qty */}
                        <div className="flex items-center justify-between text-xs bg-white/5 p-2.5 rounded-xl border border-white/5">
                          <span className="text-gray-300 truncate max-w-[160px] font-medium">{ncr.defectType}</span>
                          <span className="font-bold text-[#00A3E0] bg-[#00A3E0]/10 px-2 py-0.5 rounded-md">
                            {ncr.affectedQuantity} {isAr ? 'قطع' : 'pcs'}
                          </span>
                        </div>

                        {/* Line & Owner */}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 text-xs text-gray-300">
                          <div className="flex items-center gap-1.5 truncate">
                            <User className="w-3.5 h-3.5 text-[#00A3E0] shrink-0" />
                            <span className="truncate">{ncr.assignedTo}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <Building className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">{ncr.productionLine}</span>
                          </div>
                        </div>

                        {/* Disposition Status */}
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-gray-400">{isAr ? 'قرار التصرف:' : 'Disposition:'}</span>
                          <span className={`font-bold px-2 py-0.5 rounded-md ${
                            ncr.disposition === 'rework' ? 'bg-amber-500/20 text-amber-300' :
                            ncr.disposition === 'scrap' ? 'bg-rose-500/20 text-rose-300' :
                            ncr.disposition === 'return-to-vendor' ? 'bg-purple-500/20 text-purple-300' :
                            ncr.disposition === 'use-as-is' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-500/20 text-gray-300'
                          }`}>
                            {ncr.disposition === 'rework' ? (isAr ? 'إعادة تشغيل (Rework)' : 'Rework') :
                             ncr.disposition === 'scrap' ? (isAr ? 'تخريد (Scrap)' : 'Scrap') :
                             ncr.disposition === 'return-to-vendor' ? (isAr ? 'إرجاع لمورد' : 'RTV') :
                             ncr.disposition === 'use-as-is' ? (isAr ? 'استخدام بحالته' : 'Use As Is') : (isAr ? 'قيد الدراسة' : 'Pending')}
                          </span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleOpenView(ncr); }}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-bold"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#00A3E0]" />
                          <span>{isAr ? 'عرض' : 'View'}</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(ncr); }}
                            className="p-2 rounded-xl bg-white/5 hover:bg-[#00A3E0]/20 text-gray-300 hover:text-[#00A3E0] transition-colors"
                            title={isAr ? 'تعديل' : 'Edit'}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setNcrToDelete(ncr); }}
                            className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-gray-300 hover:text-rose-400 transition-colors"
                            title={isAr ? 'حذف' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* VIEW MODE 2: TABLE VIEW */}
            {viewMode === 'table' && (
              <DataTable
                data={filteredNCRs}
                columns={[
                  { key: 'id', title: isAr ? 'رقم التقرير' : 'NCR ID', width: '140px', sortable: true, render: (item) => (
                    <span className="text-[#00A3E0] font-mono text-sm font-bold">{item.ncrNumber || item.id}</span>
                  )},
                  { key: 'title', title: isAr ? 'عنوان عدم المطابقة' : 'Title', sortable: true, render: (item) => (
                    <div>
                      <p className="text-white font-bold text-sm line-clamp-1">{item.title}</p>
                      <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{item.description}</p>
                    </div>
                  )},
                  { key: 'severity', title: isAr ? 'الخطورة' : 'Severity', width: '110px', sortable: true, render: (item) => (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                      item.severity === 'critical' ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' :
                      item.severity === 'major' ? 'bg-orange-500/10 text-orange-300 border-orange-500/20' : 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20'
                    }`}>
                      {item.severity.toUpperCase()}
                    </span>
                  )},
                  { key: 'status', title: isAr ? 'الحالة' : 'Status', width: '130px', sortable: true, render: (item) => (
                    <StatusBadge status={item.status} size="sm" />
                  )},
                  { key: 'affectedQuantity', title: isAr ? 'الكمية' : 'Qty', width: '90px', sortable: true, render: (item) => (
                    <span className="font-mono text-xs font-bold text-gray-200">{item.affectedQuantity}</span>
                  )},
                  { key: 'assignedTo', title: isAr ? 'المسؤول' : 'Assigned To', width: '150px', sortable: true, render: (item) => (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#0066CC]/20 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-[#00A3E0]" />
                      </div>
                      <span className="text-gray-300 text-xs font-medium truncate">{item.assignedTo}</span>
                    </div>
                  )},
                  { key: 'dueDate', title: isAr ? 'تاريخ الاستحقاق' : 'Due Date', width: '120px', sortable: true, render: (item) => (
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs font-mono">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      {item.dueDate}
                    </div>
                  )}
                ]}
                keyExtractor={(item) => item.id}
                selectedItems={selectedIds}
                onSelectionChange={setSelectedIds}
                onRowClick={(row) => handleOpenView(row)}
                pageSize={10}
                actions={(item) => (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenView(item); }} 
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-[#00A3E0]" 
                      title={isAr ? 'عرض' : 'View'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }} 
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white" 
                      title={isAr ? 'تعديل' : 'Edit'}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setNcrToDelete(item); }} 
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-rose-400" 
                      title={isAr ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              />
            )}
          </div>

          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-full lg:w-72 shrink-0">
              <FilterPanel
                filters={[
                  { key: 'status', title: isAr ? 'الحالة' : 'Status', multi: true, options: [
                    { value: 'open', label: isAr ? 'مفتوح (Open)' : 'Open', count: ncrs.filter(n => n.status === 'open').length, color: '#3B82F6' },
                    { value: 'in-progress', label: isAr ? 'قيد التنفيذ' : 'In Progress', count: ncrs.filter(n => n.status === 'in-progress').length, color: '#EAB308' },
                    { value: 'under-review', label: isAr ? 'قيد المراجعة' : 'Under Review', count: ncrs.filter(n => n.status === 'under-review').length, color: '#A855F7' },
                    { value: 'disposition', label: isAr ? 'تحديد القرار' : 'Disposition', count: ncrs.filter(n => n.status === 'disposition').length, color: '#F97316' },
                    { value: 'closed', label: isAr ? 'مغلق ومصحح' : 'Closed', count: ncrs.filter(n => n.status === 'closed').length, color: '#22C55E' },
                  ]},
                  { key: 'severity', title: isAr ? 'الخطورة' : 'Severity', multi: true, options: [
                    { value: 'critical', label: isAr ? 'حرج (Critical)' : 'Critical', count: ncrs.filter(n => n.severity === 'critical').length, color: '#DC2626' },
                    { value: 'major', label: isAr ? 'كبير (Major)' : 'Major', count: ncrs.filter(n => n.severity === 'major').length, color: '#F97316' },
                    { value: 'minor', label: isAr ? 'بسيط (Minor)' : 'Minor', count: ncrs.filter(n => n.severity === 'minor').length, color: '#EAB308' },
                  ]},
                  { key: 'priority', title: isAr ? 'الأولوية' : 'Priority', multi: true, options: [
                    { value: 'critical', label: 'Critical', count: ncrs.filter(n => n.priority === 'critical').length, color: '#DC2626' },
                    { value: 'high', label: 'High', count: ncrs.filter(n => n.priority === 'high').length, color: '#F97316' },
                    { value: 'medium', label: 'Medium', count: ncrs.filter(n => n.priority === 'medium').length, color: '#3B82F6' },
                    { value: 'low', label: 'Low', count: ncrs.filter(n => n.priority === 'low').length, color: '#6B7280' },
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

      {/* ======================================================================== */}
      {/* MODAL 1: VIEW NCR DETAILS MODAL */}
      {/* ======================================================================== */}
      {viewingNcr && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-900 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl my-4 sm:my-8 space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-[#00A3E0] font-mono font-bold text-sm bg-[#00A3E0]/15 px-3 py-1 rounded-xl border border-[#00A3E0]/30">
                    {viewingNcr.ncrNumber || viewingNcr.id}
                  </span>
                  <StatusBadge status={viewingNcr.status} size="sm" />
                  <PriorityBadge priority={viewingNcr.priority} size="sm" />
                </div>
                <h3 className="text-xl font-black text-white mt-2">
                  {viewingNcr.title}
                </h3>
              </div>

              <button
                onClick={() => setViewingNcr(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Timeline */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-bold">
              {[
                { key: 'open', label: isAr ? 'رصد المشكلة' : 'Open' },
                { key: 'in-progress', label: isAr ? 'الاحتواء والعزل' : 'Containment' },
                { key: 'under-review', label: isAr ? 'المراجعة والتحقيق' : 'Review' },
                { key: 'disposition', label: isAr ? 'قرار التصرف' : 'Disposition' },
                { key: 'closed', label: isAr ? 'مغلق ومكتمل' : 'Closed' },
              ].map((step, idx) => {
                const phaseOrder = ['open', 'in-progress', 'under-review', 'disposition', 'closed'];
                const currentIdx = phaseOrder.indexOf(viewingNcr.status);
                const isCurrent = step.key === viewingNcr.status;
                const isPassed = currentIdx >= idx;
                return (
                  <div
                    key={step.key}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-[#00A3E0]/20 border-[#00A3E0] text-white shadow-md'
                        : isPassed
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : 'bg-white/5 border-white/5 text-gray-500'
                    }`}
                  >
                    <span>{idx + 1}. {step.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Overview Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                <span className="text-gray-400 block">{isAr ? 'نوع العيب' : 'Defect Type'}</span>
                <span className="font-bold text-gray-200 mt-1 block truncate">{viewingNcr.defectType}</span>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                <span className="text-gray-400 block">{isAr ? 'الكمية المتأثرة' : 'Affected Qty'}</span>
                <span className="font-bold text-[#00A3E0] mt-1 block">{viewingNcr.affectedQuantity} {isAr ? 'قطعة' : 'pcs'}</span>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                <span className="text-gray-400 block">{isAr ? 'خط الإنتاج' : 'Line'}</span>
                <span className="font-bold text-gray-200 mt-1 block truncate">{viewingNcr.productionLine}</span>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                <span className="text-gray-400 block">{isAr ? 'المسؤول' : 'Owner'}</span>
                <span className="font-bold text-gray-200 mt-1 block truncate">{viewingNcr.assignedTo}</span>
              </div>
            </div>

            {/* Description & Containment */}
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                  <Target className="w-4 h-4" />
                  <span>{isAr ? 'بيان عدم المطابقة التفصيلي' : 'Non-Conformance Description'}</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{viewingNcr.description}</p>
                {viewingNcr.lotNumber && (
                  <p className="text-[11px] text-gray-400 pt-1">
                    <strong>{isAr ? 'رقم التشغيلة / الباتش:' : 'Lot Number:'}</strong> {viewingNcr.lotNumber}
                  </p>
                )}
              </div>

              {/* Containment Action */}
              <div className="bg-yellow-500/5 p-4 rounded-2xl border border-yellow-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold">
                  <ShieldAlert className="w-4 h-4" />
                  <span>{isAr ? 'إجراءات الاحتواء الفوري (Immediate Containment)' : 'Immediate Containment'}</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {viewingNcr.containmentAction || (isAr ? 'لم تسجل إجراءات احتواء فورية' : 'No containment actions documented')}
                </p>
              </div>

              {/* Disposition Determination */}
              <div className="bg-orange-500/5 p-4 rounded-2xl border border-orange-500/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-orange-400 text-xs font-bold">
                    <Layers className="w-4 h-4" />
                    <span>{isAr ? 'قرار التصرف النهائي (Disposition Decision)' : 'Disposition Decision'}</span>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${
                    viewingNcr.disposition === 'rework' ? 'bg-amber-500/20 text-amber-300' :
                    viewingNcr.disposition === 'scrap' ? 'bg-rose-500/20 text-rose-300' :
                    viewingNcr.disposition === 'return-to-vendor' ? 'bg-purple-500/20 text-purple-300' :
                    viewingNcr.disposition === 'use-as-is' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-500/20 text-gray-300'
                  }`}>
                    {viewingNcr.disposition.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {viewingNcr.dispositionNotes || (isAr ? 'قيد دراسة لجنة فحص المواد (MRB Review)' : 'Under MRB Review')}
                </p>
              </div>

              {/* Root Cause Notes */}
              {viewingNcr.rootCauseNotes && (
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                    <FileCheck2 className="w-4 h-4" />
                    <span>{isAr ? 'ملاحظات السبب الجذري الأولية' : 'Root Cause Investigation'}</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{viewingNcr.rootCauseNotes}</p>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => handleCreateCapaFromNcr(viewingNcr)}
                  className="bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20 rounded-xl h-10 text-xs font-bold"
                >
                  <ShieldAlert className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
                  {isAr ? 'فتح CAPA' : 'Open CAPA'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCreateEightDFromNcr(viewingNcr)}
                  className="bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20 rounded-xl h-10 text-xs font-bold"
                >
                  <ClipboardList className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
                  {isAr ? 'تصعيد إلى 8D' : 'Escalate to 8D'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewingNcr(null);
                    navigate(viewingNcr.productionLine ? `/quality-tower?station=${encodeURIComponent(viewingNcr.productionLine)}` : '/quality-tower');
                  }}
                  className="bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20 rounded-xl h-10 text-xs font-bold"
                  title={isAr ? 'عرض موقع المحطة على خريطة المصنع SCADA' : 'View on SCADA plant floorplan'}
                >
                  <MapPin className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0 text-cyan-400" />
                  {isAr ? 'خريطة المصنع' : 'Plant Map'}
                </Button>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setViewingNcr(null)}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-11 w-full sm:w-auto justify-center"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </Button>

                <Button
                  onClick={() => { setViewingNcr(null); handleOpenEdit(viewingNcr); }}
                  className="bg-[#00A3E0] hover:bg-[#008cc0] text-slate-950 font-black rounded-xl h-11 px-6 shadow-lg shadow-[#00A3E0]/20 w-full sm:w-auto justify-center"
                >
                  <Edit3 className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                  {isAr ? 'تعديل هذا التقرير' : 'Edit NCR'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODAL 2: EDIT & CREATE NCR MODAL */}
      {/* ======================================================================== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-900 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl my-4 sm:my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#00A3E0]/10 text-[#00A3E0] border border-[#00A3E0]/20">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    {editingNcr 
                      ? (isAr ? `تعديل تقرير عدم المطابقة (${editingNcr.ncrNumber || editingNcr.id})` : `Edit NCR (${editingNcr.id})`) 
                      : (isAr ? 'إنشاء تقرير عدم مطابقة جديد (New NCR)' : 'Create New NCR')}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isAr ? 'توثيق الخلل، الكمية، خطة الاحتواء، وقرار التصرف' : 'Log non-conformance details, containment, and disposition'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => { setIsFormOpen(false); setEditingNcr(null); }}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-5">
              {/* Title & Defect Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'عنوان عدم المطابقة' : 'NCR Title'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={isAr ? 'مثال: تسريب وضعف بنطة اللحام النقطي في شاسيه المنتج' : 'e.g. Welding porosity in vehicle chassis'}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'نوع العيب' : 'Defect Type'}
                  </label>
                  <input
                    type="text"
                    value={formData.defectType}
                    onChange={(e) => setFormData({ ...formData, defectType: e.target.value })}
                    placeholder="Dimensional / Welding"
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>
              </div>

              {/* Status, Severity, Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'المرحلة / الحالة' : 'Status'}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  >
                    <option value="open" className="bg-slate-900">{isAr ? 'مفتوح (Open)' : 'Open'}</option>
                    <option value="in-progress" className="bg-slate-900">{isAr ? 'قيد الاحتواء (In Progress)' : 'In Progress'}</option>
                    <option value="under-review" className="bg-slate-900">{isAr ? 'قيد المراجعة (Under Review)' : 'Under Review'}</option>
                    <option value="disposition" className="bg-slate-900">{isAr ? 'تحديد القرار (Disposition)' : 'Disposition'}</option>
                    <option value="closed" className="bg-slate-900">{isAr ? 'مغلق ومكتمل (Closed)' : 'Closed'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'مستوى الخطورة' : 'Severity'}
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  >
                    <option value="critical" className="bg-slate-900">{isAr ? 'حرج (Critical)' : 'Critical'}</option>
                    <option value="major" className="bg-slate-900">{isAr ? 'كبير (Major)' : 'Major'}</option>
                    <option value="minor" className="bg-slate-900">{isAr ? 'بسيط (Minor)' : 'Minor'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'الأولوية' : 'Priority'}
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  >
                    <option value="critical" className="bg-slate-900">Critical</option>
                    <option value="high" className="bg-slate-900">High</option>
                    <option value="medium" className="bg-slate-900">Medium</option>
                    <option value="low" className="bg-slate-900">Low</option>
                  </select>
                </div>
              </div>

              {/* Line, Quantity, Lot Number */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'خط الإنتاج / الموقع' : 'Production Line'}
                  </label>
                  <input
                    type="text"
                    value={formData.productionLine}
                    onChange={(e) => setFormData({ ...formData, productionLine: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'الكمية المتأثرة' : 'Affected Quantity'}
                  </label>
                  <input
                    type="number"
                    value={formData.affectedQuantity}
                    onChange={(e) => setFormData({ ...formData, affectedQuantity: Number(e.target.value) })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'رقم التشغيلة (Lot #)' : 'Lot Number'}
                  </label>
                  <input
                    type="text"
                    value={formData.lotNumber}
                    onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>
              </div>

              {/* Assigned To, Department, Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'المسؤول المتابع' : 'Assigned To'}
                  </label>
                  <input
                    type="text"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'القسم' : 'Department'}
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'تاريخ الاستحقاق' : 'Due Date'}
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">
                  {isAr ? 'وصف المشكلة وعدم المطابقة بالتفصيل' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#00A3E0]"
                />
              </div>

              {/* Containment Action */}
              <div>
                <label className="block text-xs font-bold text-yellow-400 mb-1.5">
                  {isAr ? 'إجراءات الاحتواء والعزل الفوري (Immediate Containment Action)' : 'Containment Action'}
                </label>
                <textarea
                  rows={2}
                  value={formData.containmentAction}
                  onChange={(e) => setFormData({ ...formData, containmentAction: e.target.value })}
                  placeholder={isAr ? 'الفرز، العزل، وتأمين خط الإنتاج...' : 'Sorting, quarantine, line containment...'}
                  className="w-full p-3 bg-white/5 border border-yellow-500/20 rounded-xl text-white text-xs focus:outline-none focus:border-yellow-400"
                />
              </div>

              {/* Disposition Decision */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-orange-400 mb-1.5">
                    {isAr ? 'قرار التصرف (Disposition Decision)' : 'Disposition Decision'}
                  </label>
                  <select
                    value={formData.disposition}
                    onChange={(e) => setFormData({ ...formData, disposition: e.target.value as any })}
                    className="w-full h-11 px-4 bg-white/5 border border-orange-500/20 rounded-xl text-white text-sm focus:outline-none focus:border-orange-400"
                  >
                    <option value="pending" className="bg-slate-900">{isAr ? 'قيد الدراسة (Pending MRB)' : 'Pending MRB'}</option>
                    <option value="rework" className="bg-slate-900">{isAr ? 'إعادة تشغيل (Rework)' : 'Rework'}</option>
                    <option value="scrap" className="bg-slate-900">{isAr ? 'تخريد (Scrap)' : 'Scrap'}</option>
                    <option value="return-to-vendor" className="bg-slate-900">{isAr ? 'إرجاع للمورد (RTV)' : 'Return to Vendor'}</option>
                    <option value="use-as-is" className="bg-slate-900">{isAr ? 'استخدام بحالته بتنازل (Use As Is)' : 'Use As Is'}</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-orange-400 mb-1.5">
                    {isAr ? 'ملاحظات قرار التصرف والشروط الفنية' : 'Disposition Notes'}
                  </label>
                  <input
                    type="text"
                    value={formData.dispositionNotes}
                    onChange={(e) => setFormData({ ...formData, dispositionNotes: e.target.value })}
                    placeholder={isAr ? 'تفاصيل إعادة التشغيل أو شروط التنازل...' : 'Rework parameters or MRB concession conditions...'}
                    className="w-full h-11 px-4 bg-white/5 border border-orange-500/20 rounded-xl text-white text-sm focus:outline-none focus:border-orange-400"
                  />
                </div>
              </div>

              {/* Root Cause Notes */}
              <div>
                <label className="block text-xs font-bold text-indigo-400 mb-1.5">
                  {isAr ? 'ملاحظات التحقيق والسبب الجذري الأولي' : 'Root Cause Investigation Notes'}
                </label>
                <textarea
                  rows={2}
                  value={formData.rootCauseNotes}
                  onChange={(e) => setFormData({ ...formData, rootCauseNotes: e.target.value })}
                  className="w-full p-3 bg-white/5 border border-indigo-500/20 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-400"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setIsFormOpen(false); setEditingNcr(null); }}
                  className="bg-white/5 border-white/10 text-white rounded-xl h-11 w-full sm:w-auto justify-center"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  className="bg-[#00A3E0] hover:bg-[#008cc0] text-slate-950 font-black rounded-xl h-11 px-6 shadow-lg shadow-[#00A3E0]/20 w-full sm:w-auto justify-center"
                >
                  {editingNcr ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'إنشاء التقرير' : 'Create NCR')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODAL 3: DELETE CONFIRMATION */}
      {/* ======================================================================== */}
      {ncrToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">
                {isAr ? 'تأكيد حذف تقرير عدم المطابقة؟' : 'Confirm NCR Deletion?'}
              </h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                {isAr 
                  ? `هل أنت متأكد من حذف التقرير "${ncrToDelete.title}" (${ncrToDelete.ncrNumber || ncrToDelete.id})؟ لا يمكن التراجع عن هذا الإجراء.`
                  : `Are you sure you want to delete NCR "${ncrToDelete.id}"?`}
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setNcrToDelete(null)}
                className="bg-white/5 border-white/10 text-white rounded-xl h-11"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl h-11 px-6 shadow-lg shadow-rose-600/30"
              >
                {isAr ? 'تأكيد الحذف' : 'Delete NCR'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default NCRPage;
