// QMS Enterprise 4.0 - CAPA (Corrective and Preventive Action) Workspace
import { useState, useEffect, useMemo } from 'react';
import { PageHeader, PageContainer, PageSection, StatsBar } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { FilterPanel } from '../../components/FilterPanel';
import { BulkActionBar } from '../../components/BulkActionBar';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { toast } from 'sonner';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  unifiedCapaApi as capaApi, 
  type CapaData 
} from '../../api/unified-api';
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
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Building, 
  Target, 
  FileCheck2, 
  Trash2, 
  LayoutGrid, 
  Table as TableIcon, 
  ExternalLink, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportData, prepareDataForExport } from '../../utils/exportUtils';
import { QualityEngine } from '../../services/qualityEngine';
import {
  createImprovementAction,
} from '@/services/qualityImprovementActions';
import { enqueueQualitySyncItem } from '@/services/qualitySyncQueue';
import {
  buildLocalWorkflowUser,
  hasDefectPermission,
  loadLocalWorkflowRole,
} from '@/services/defectWorkflowGovernance';
import { useTranslation } from '@/utils/translations';

export interface CAPAItem {
  id: string;
  capaNumber?: string;
  title: string;
  description: string;
  type: 'corrective' | 'preventive';
  status: 'identified' | 'analysis' | 'action' | 'verification' | 'closed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  sourceNCRId?: string;
  createdDate: string;
  targetDate: string;
  owner: string;
  department: string;
  plant?: string;
  effectiveness: 'pending' | 'effective' | 'ineffective';
  problemStatement?: string;
  rootCause?: string;
  fiveWhy?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  verificationNotes?: string;
  closedBy?: string;
  [key: string]: unknown;
}

export const DEFAULT_CAPAS: CAPAItem[] = [];
export const mockCAPAs: CAPAItem[] = [];

function generateCAPANumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 900) + 100;
  return `CAPA-${year}-${random}`;
}

export function CAPAPage() {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [capas, setCapas] = useState<CAPAItem[]>(() => {
    try {
      const local = localStorage.getItem('qms_local_capa');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});
  const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });
  
  // View mode: 'cards' or 'table'
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    return (localStorage.getItem('qms_capa_view_mode') as 'cards' | 'table') || 'cards';
  });

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCapa, setEditingCapa] = useState<CAPAItem | null>(null);
  const [viewingCapa, setViewingCapa] = useState<CAPAItem | null>(null);
  const [capaToDelete, setCapaToDelete] = useState<CAPAItem | null>(null);

  // Form State for Create / Edit
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    problemStatement: '',
    type: 'corrective' as 'corrective' | 'preventive',
    status: 'identified' as 'identified' | 'analysis' | 'action' | 'verification' | 'closed',
    priority: 'medium' as 'critical' | 'high' | 'medium' | 'low',
    sourceNCRId: '',
    owner: '',
    department: 'Quality Assurance',
    plant: 'Main Plant - Assembly 01',
    targetDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    rootCause: '',
    fiveWhy: '',
    correctiveAction: '',
    preventiveAction: '',
    effectiveness: 'pending' as 'pending' | 'effective' | 'ineffective',
  });

  const workflowUser = buildLocalWorkflowUser(null, loadLocalWorkflowRole());

  const handleSetViewMode = (mode: 'cards' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('qms_capa_view_mode', mode);
  };

  // Helper to persist CAPAs
  const saveCapas = (items: CAPAItem[]) => {
    setCapas(items);
    try {
      localStorage.setItem('qms_local_capa', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save CAPAs locally:', e);
    }
  };

  const loadCapas = async () => {
    try {
      setIsLoading(true);
      const response = await capaApi.getAll().catch(() => ({ data: [] as CapaData[] }));

      if (response?.data && response.data.length > 0) {
        const transformed: CAPAItem[] = response.data.map((c: any) => ({
          id: c.id,
          capaNumber: c.capaNumber || c.id,
          title: c.title || 'Untitled CAPA',
          description: c.description || c.problemStatement || '',
          problemStatement: c.problemStatement || c.description || '',
          type: (c.capaType?.toLowerCase() === 'preventive' || c.type === 'preventive') ? 'preventive' : 'corrective',
          status: (c.status?.toLowerCase() as any) || 'identified',
          priority: (c.priority?.toLowerCase() as any) || 'medium',
          source: c.sourceNcrId ? `NCR-${c.sourceNcrId}` : (c.source || 'Internal Audit'),
          sourceNCRId: c.sourceNcrId || c.sourceNCRId || '',
          createdDate: c.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          targetDate: c.targetCloseDate || c.targetDate || new Date().toISOString().split('T')[0],
          owner: c.ownerUser?.name || c.assignedUser?.name || c.owner || 'Unassigned',
          department: c.department?.name || c.department || 'Quality Assurance',
          plant: c.plant || 'Main Plant - Assembly 01',
          effectiveness: c.effectiveness || 'pending',
          rootCause: c.rootCause || '',
          fiveWhy: c.fiveWhy || '',
          correctiveAction: c.correctiveActionPlan || c.correctiveAction || '',
          preventiveAction: c.preventiveActionPlan || c.preventiveAction || '',
          ...c
        }));
        saveCapas(transformed);
      } else {
        const stored = localStorage.getItem('qms_local_capa');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCapas(parsed);
          } else {
            saveCapas(DEFAULT_CAPAS);
          }
        } else {
          saveCapas(DEFAULT_CAPAS);
        }
      }
    } catch {
      const stored = localStorage.getItem('qms_local_capa');
      if (stored) {
        setCapas(JSON.parse(stored));
      } else {
        saveCapas(DEFAULT_CAPAS);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCapas();
  }, []);

  // Support deep-link /capa/:id by opening view modal
  useEffect(() => {
    const id = params.id;
    if (!id || capas.length === 0) return;
    const found = capas.find((c) => c.id === id || c.capaNumber === id);
    if (found) {
      setViewingCapa(found);
    }
  }, [params.id, capas]);

  // Support create query
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get('create') === '1' || p.get('sourceNCRId')) {
      handleOpenCreate(p.get('sourceNCRId') || undefined, p.get('title') || undefined);
    }
  }, [location.search]);

  // Stats
  const stats = useMemo(() => [
    { label: isAr ? 'إجمالي إجراءات CAPA' : 'Active CAPAs', value: capas.filter(c => c.status !== 'closed').length, change: '0', trend: 'neutral' as const },
    { label: isAr ? 'إجراءات متأخرة' : 'Overdue', value: capas.filter(c => c.targetDate < new Date().toISOString().split('T')[0] && c.status !== 'closed').length, change: '0', trend: 'neutral' as const },
    { label: isAr ? 'مرحلة التحقق' : 'Verification Phase', value: capas.filter(c => c.status === 'verification').length, change: '0', trend: 'neutral' as const },
    { label: isAr ? 'معدل الفاعلية' : 'Effectiveness Rate', value: capas.length ? `${Math.round((capas.filter(c => c.effectiveness === 'effective').length / capas.length) * 100)}%` : '100%', change: '0%', trend: 'neutral' as const }
  ], [capas, isAr]);

  // Filtering
  const filteredCAPAs = useMemo(() => {
    return capas.filter(capa => {
      const matchesSearch = !searchQuery || 
        capa.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        capa.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (capa.capaNumber && capa.capaNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (capa.owner && capa.owner.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (capa.department && capa.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (capa.description && capa.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const statusFilter = activeFilters['status'] as string[];
      const matchesStatus = !statusFilter || statusFilter.length === 0 || statusFilter.includes(capa.status);
      
      const typeFilter = activeFilters['type'] as string[];
      const matchesType = !typeFilter || typeFilter.length === 0 || typeFilter.includes(capa.type);
      
      const priorityFilter = activeFilters['priority'] as string[];
      const matchesPriority = !priorityFilter || priorityFilter.length === 0 || priorityFilter.includes(capa.priority);
      
      return matchesSearch && matchesStatus && matchesType && matchesPriority;
    });
  }, [capas, searchQuery, activeFilters]);

  // Handlers
  const handleOpenCreate = (sourceNCR?: string, initialTitle?: string) => {
    setEditingCapa(null);
    setFormData({
      title: initialTitle || '',
      description: '',
      problemStatement: '',
      type: 'corrective',
      status: 'identified',
      priority: 'medium',
      sourceNCRId: sourceNCR || '',
      owner: 'Eng. Quality Team',
      department: 'Quality Assurance',
      plant: 'Main Plant - Assembly 01',
      targetDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      rootCause: '',
      fiveWhy: '',
      correctiveAction: '',
      preventiveAction: '',
      effectiveness: 'pending',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (capa: CAPAItem) => {
    setEditingCapa(capa);
    setFormData({
      title: capa.title || '',
      description: capa.description || '',
      problemStatement: capa.problemStatement || capa.description || '',
      type: capa.type || 'corrective',
      status: capa.status || 'identified',
      priority: capa.priority || 'medium',
      sourceNCRId: capa.sourceNCRId || '',
      owner: capa.owner || 'Unassigned',
      department: capa.department || 'Quality Assurance',
      plant: capa.plant || 'Main Plant - Assembly 01',
      targetDate: capa.targetDate || new Date().toISOString().split('T')[0],
      rootCause: capa.rootCause || '',
      fiveWhy: capa.fiveWhy || '',
      correctiveAction: capa.correctiveAction || '',
      preventiveAction: capa.preventiveAction || '',
      effectiveness: capa.effectiveness || 'pending',
    });
    if (viewingCapa) setViewingCapa(null);
    setIsFormOpen(true);
  };

  const handleOpenView = (capa: CAPAItem) => {
    setViewingCapa(capa);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error(isAr ? 'يرجى إدخال عنوان الإجراء' : 'Please enter CAPA title');
      return;
    }

    if (editingCapa) {
      // Update
      const updatedList = capas.map(c => {
        if (c.id === editingCapa.id) {
          return {
            ...c,
            title: formData.title.trim(),
            description: formData.description.trim() || formData.problemStatement.trim(),
            problemStatement: formData.problemStatement.trim() || formData.description.trim(),
            type: formData.type,
            status: formData.status,
            priority: formData.priority,
            sourceNCRId: formData.sourceNCRId.trim() || undefined,
            source: formData.sourceNCRId ? `NCR-${formData.sourceNCRId}` : c.source,
            owner: formData.owner.trim(),
            department: formData.department.trim(),
            plant: formData.plant,
            targetDate: formData.targetDate,
            rootCause: formData.rootCause.trim(),
            fiveWhy: formData.fiveWhy.trim(),
            correctiveAction: formData.correctiveAction.trim(),
            preventiveAction: formData.preventiveAction.trim(),
            effectiveness: formData.effectiveness,
            updatedAt: new Date().toISOString()
          };
        }
        return c;
      });

      saveCapas(updatedList);
      toast.success(isAr ? `تم تحديث إجراء CAPA (${editingCapa.capaNumber || editingCapa.id}) بنجاح` : `CAPA ${editingCapa.id} updated successfully`);
      setIsFormOpen(false);
      setEditingCapa(null);
    } else {
      // Create New
      const newId = generateCAPANumber();
      const newCapa: CAPAItem = {
        id: newId,
        capaNumber: newId,
        title: formData.title.trim(),
        description: formData.description.trim() || formData.problemStatement.trim(),
        problemStatement: formData.problemStatement.trim() || formData.description.trim(),
        type: formData.type,
        status: formData.status,
        priority: formData.priority,
        source: formData.sourceNCRId ? `NCR-${formData.sourceNCRId}` : 'Internal Quality Audit',
        sourceNCRId: formData.sourceNCRId.trim() || undefined,
        createdDate: new Date().toISOString().split('T')[0],
        targetDate: formData.targetDate,
        owner: formData.owner.trim() || 'Eng. Quality Team',
        department: formData.department.trim(),
        plant: formData.plant,
        effectiveness: formData.effectiveness,
        rootCause: formData.rootCause.trim(),
        fiveWhy: formData.fiveWhy.trim(),
        correctiveAction: formData.correctiveAction.trim(),
        preventiveAction: formData.preventiveAction.trim(),
      };

      const nextList = [newCapa, ...capas];
      saveCapas(nextList);
      toast.success(isAr ? `تم إنشاء إجراء CAPA جديد برقم: ${newId}` : `New CAPA created: ${newId}`);
      setIsFormOpen(false);
    }
  };

  const handleConfirmDelete = () => {
    if (!capaToDelete) return;
    const filtered = capas.filter(c => c.id !== capaToDelete.id);
    saveCapas(filtered);
    toast.success(isAr ? `تم حذف الإجراء ${capaToDelete.capaNumber || capaToDelete.id}` : `CAPA ${capaToDelete.id} deleted`);
    setCapaToDelete(null);
    if (viewingCapa?.id === capaToDelete.id) setViewingCapa(null);
  };

  const handleEscalateTo8D = async (capa: CAPAItem) => {
    if (!hasDefectPermission(workflowUser, 'defect.escalate8d')) {
      toast.error('Action not available', { description: 'Your current role cannot create 8D records.' });
      return;
    }
    try {
      const result = await QualityEngine.trigger8dFromCapa(capa.id, true);
      if (result) {
        toast.success(isAr ? 'تم تصعيد الإجراء إلى تقرير 8D بنجاح' : '8D Escalated', {
          description: isAr ? `تم تحويل الكابا ${capa.capaNumber || capa.id} إلى مسار حل المشكلات 8D.` : `8D Analysis dynamically mapped and initialized from CAPA ${capa.capaNumber || capa.id}.`
        });
        navigate('/quality/8d');
        enqueueQualitySyncItem({
          entityType: 'eight-d',
          entityId: capa.id,
          operation: 'create-8d',
          payloadSummary: `8D user-triggered from CAPA ${capa.id}`,
        });
      }
    } catch {
      toast.error('Failed to escalate CAPA to 8D');
    }
  };

  const handleCreateImprovementAction = async (capa: CAPAItem) => {
    const action = createImprovementAction({
      title: `Verify CAPA effectiveness: ${capa.title || capa.id}`,
      description: 'Improvement action created from CAPA. Verify implementation, preventive action, and effectiveness signal.',
      sourceType: 'capa',
      sourceId: capa.id,
      relatedCapaId: capa.id,
      relatedNcrId: capa.sourceNCRId || '',
      actionType: capa.type === 'preventive' ? 'preventive' : 'corrective',
      priority: capa.priority === 'critical' ? 'critical' : capa.priority === 'high' ? 'high' : 'medium',
      status: 'open',
    });
    toast.success(isAr ? `تم ربط خطة التحسين ${action.id} بالإجراء` : 'Improvement action linked to CAPA');
  };

  const handleExport = (format: 'excel' | 'csv' | 'json' = 'excel', ids?: string[]) => {
    const dataToExport = ids && ids.length > 0 
      ? capas.filter(c => ids.includes(c.id))
      : filteredCAPAs;

    if (dataToExport.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      const mapping = {
        id: 'CAPA Number',
        title: 'Title',
        description: 'Description',
        type: 'Type',
        status: 'Status',
        priority: 'Priority',
        source: 'Source',
        createdDate: 'Created Date',
        targetDate: 'Target Date',
        owner: 'Owner',
        department: 'Department',
        effectiveness: 'Effectiveness'
      };

      const preparedData = prepareDataForExport(dataToExport, mapping);
      exportData(preparedData, `CAPA_Report`, 'Corrective & Preventive Actions', format);
      toast.success(`Successfully exported ${dataToExport.length} reports`);
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={isAr ? 'الإجراءات التصحيحية والوقائية (CAPA)' : 'Corrective & Preventive Actions (CAPA)'}
        subtitle={isAr ? 'إدارة دورة حياة الإجراءات التصحيحية والوقائية من رصد المشكلة وحتى التحقق من الفاعلية' : 'Manage CAPA workflow from root cause analysis to effectiveness verification'}
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'CAPA' }]}
        actions={{
          create: () => handleOpenCreate(),
          refresh: loadCapas,
          export: () => handleExport('excel')
        }}
      />

      <StatsBar stats={stats} />

      <PageSection>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Workspace Area */}
          <div className="flex-1 space-y-4">
            {/* Top Toolbar: Search, Filters, View Modes */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={isAr ? 'بحث برقم الإجراء، العنوان، المسؤول، أو القسم...' : 'Search CAPAs by ID, title, owner, department...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rtl:pr-10 rtl:pl-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3E0] transition-colors text-sm"
                />
              </div>
              
              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                {/* View Switcher Toggle */}
                <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1 backdrop-blur-md">
                  <button
                    onClick={() => handleSetViewMode('cards')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      viewMode === 'cards' 
                        ? 'bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white shadow-md' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>{isAr ? 'بطاقات' : 'Cards'}</span>
                  </button>
                  <button
                    onClick={() => handleSetViewMode('table')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      viewMode === 'table' 
                        ? 'bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white shadow-md' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>{isAr ? 'جدول' : 'Table'}</span>
                  </button>
                </div>

                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-11 px-4 border rounded-2xl transition-colors flex items-center gap-2 text-sm font-bold ${
                    showFilters || Object.keys(activeFilters).length > 0
                      ? 'bg-[#0066CC]/20 border-[#00A3E0] text-[#00A3E0]'
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">{isAr ? 'تصفية' : 'Filters'}</span>
                  {Object.keys(activeFilters).length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-[#0066CC] text-white text-xs rounded-full">
                      {Object.values(activeFilters).flat().length}
                    </span>
                  )}
                </button>
                
                <Button 
                  onClick={() => handleOpenCreate()}
                  className="h-11 px-5 bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white rounded-2xl hover:opacity-90 font-bold shadow-lg shadow-[#0066CC]/20 flex items-center justify-center gap-2 flex-1 sm:flex-initial"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? 'إجراء CAPA جديد' : 'New CAPA'}</span>
                </Button>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            <BulkActionBar
              selectedCount={selectedIds.length}
              itemName="CAPAs"
              onClearSelection={() => setSelectedIds([])}
              onExport={(format) => handleExport(format, selectedIds)}
            />

            {/* VIEW MODE 1: MODERN RESPONSIVE CARDS GRID */}
            {viewMode === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {isLoading ? (
                  <div className="col-span-full py-16 text-center text-gray-400 rounded-3xl border border-white/10 bg-slate-900/60 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#00A3E0] animate-spin mb-3" />
                    <p className="text-sm font-bold text-gray-300">
                      {isAr ? 'جاري تحميل سجلات CAPA...' : 'Loading CAPA records...'}
                    </p>
                  </div>
                ) : filteredCAPAs.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-gray-500 rounded-3xl border border-white/10 bg-slate-900/60">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#00A3E0]" />
                    <p className="text-base font-bold text-gray-300">
                      {isAr ? 'لا توجد إجراءات CAPA مطابقة للبحث' : 'No CAPA records found'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {isAr ? 'انقر على "إجراء CAPA جديد" لإضافة إجراء تصحيحي' : 'Click "New CAPA" to create one'}
                    </p>
                  </div>
                ) : (
                  filteredCAPAs.map((capa) => (
                    <div 
                      key={capa.id}
                      onClick={() => handleOpenView(capa)}
                      className="rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-5 shadow-2xl flex flex-col justify-between hover:border-[#00A3E0]/40 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="space-y-3.5">
                        {/* Top ID & Badges */}
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-[#00A3E0] font-mono font-bold text-xs bg-[#00A3E0]/10 px-2.5 py-1 rounded-xl border border-[#00A3E0]/20">
                              {capa.capaNumber || capa.id}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                              capa.type === 'preventive' 
                                ? 'bg-teal-500/10 text-teal-300 border-teal-500/20' 
                                : 'bg-orange-500/10 text-orange-300 border-orange-500/20'
                            }`}>
                              {capa.type === 'preventive' ? (isAr ? 'وقائي' : 'Preventive') : (isAr ? 'تصحيحي' : 'Corrective')}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <StatusBadge status={capa.status} size="sm" />
                            <PriorityBadge priority={capa.priority} size="sm" />
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h4 className="text-white font-bold text-base leading-snug line-clamp-2 group-hover:text-[#00A3E0] transition-colors">
                            {capa.title}
                          </h4>
                          <p className="text-gray-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                            {capa.description || capa.problemStatement || (isAr ? 'لا يوجد وصف للمشكلة' : 'No description provided')}
                          </p>
                        </div>

                        {/* Operational Metadata */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs text-gray-300">
                          <div className="flex items-center gap-1.5 truncate">
                            <User className="w-3.5 h-3.5 text-[#00A3E0] shrink-0" />
                            <span className="truncate">{capa.owner || (isAr ? 'غير مسند' : 'Unassigned')}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{capa.targetDate}</span>
                          </div>
                        </div>

                        {/* Department & Effectiveness */}
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-gray-400 font-medium truncate max-w-[150px]">
                            {capa.department}
                          </span>
                          <span className={`font-bold px-2 py-0.5 rounded-md ${
                            capa.effectiveness === 'effective' ? 'bg-emerald-500/20 text-emerald-300' :
                            capa.effectiveness === 'ineffective' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {capa.effectiveness === 'effective' ? (isAr ? '✓ فاعل' : 'Effective') :
                             capa.effectiveness === 'ineffective' ? (isAr ? '✗ غير فاعل' : 'Ineffective') : (isAr ? '⏳ قيد التحقق' : 'Pending')}
                          </span>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleOpenView(capa); }}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-bold"
                            title={isAr ? 'عرض التفاصيل الكاملة' : 'View Full Details'}
                          >
                            <Eye className="w-3.5 h-3.5 text-[#00A3E0]" />
                            <span>{isAr ? 'عرض' : 'View'}</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(capa); }}
                            className="p-2 rounded-xl bg-[#00A3E0]/10 hover:bg-[#00A3E0]/20 text-[#00A3E0] transition-colors flex items-center gap-1 text-xs font-bold border border-[#00A3E0]/20"
                            title={isAr ? 'تعديل الإجراء' : 'Edit CAPA'}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{isAr ? 'تعديل' : 'Edit'}</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Escalate to 8D */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleEscalateTo8D(capa); }}
                            className="p-2 rounded-xl text-purple-400 hover:bg-purple-500/10 transition-colors"
                            title={isAr ? 'تصعيد إلى 8D' : 'Escalate to 8D'}
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setCapaToDelete(capa); }}
                            className="p-2 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title={isAr ? 'حذف الإجراء' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* VIEW MODE 2: ENTERPRISE DATA TABLE */}
            {viewMode === 'table' && (
              <DataTable
                data={filteredCAPAs}
                columns={[
                  { key: 'id', title: isAr ? 'رقم الكابا' : 'CAPA ID', width: '150px', sortable: true, render: (item) => (
                    <span className="text-[#00A3E0] font-mono text-sm font-bold">{item.capaNumber || item.id}</span>
                  )},
                  { key: 'title', title: isAr ? 'عنوان المشكلة والبيان' : 'Title & Description', sortable: true, render: (item) => (
                    <div>
                      <p className="text-white font-bold text-sm line-clamp-1">{item.title}</p>
                      <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{item.description || item.problemStatement}</p>
                    </div>
                  )},
                  { key: 'type', title: isAr ? 'النوع' : 'Type', width: '120px', sortable: true, render: (item) => (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                      item.type === 'preventive' ? 'bg-teal-500/10 text-teal-300 border-teal-500/20' : 'bg-orange-500/10 text-orange-300 border-orange-500/20'
                    }`}>
                      {item.type === 'preventive' ? (isAr ? 'وقائي' : 'Preventive') : (isAr ? 'تصحيحي' : 'Corrective')}
                    </span>
                  )},
                  { key: 'status', title: isAr ? 'الحالة' : 'Status', width: '140px', sortable: true, render: (item) => (
                    <StatusBadge status={item.status} size="sm" />
                  )},
                  { key: 'priority', title: isAr ? 'الأولوية' : 'Priority', width: '110px', sortable: true, render: (item) => (
                    <PriorityBadge priority={item.priority} size="sm" />
                  )},
                  { key: 'owner', title: isAr ? 'المسؤول' : 'Owner', width: '150px', sortable: true, render: (item) => (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#0066CC]/20 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-[#00A3E0]" />
                      </div>
                      <span className="text-gray-300 text-xs font-medium truncate">{item.owner}</span>
                    </div>
                  )},
                  { key: 'targetDate', title: isAr ? 'تاريخ الاستحقاق' : 'Target Date', width: '130px', sortable: true, render: (item) => (
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs font-mono">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      {item.targetDate}
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
                      title={isAr ? 'عرض التفاصيل' : 'View Details'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }} 
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-emerald-400" 
                      title={isAr ? 'تعديل' : 'Edit'}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEscalateTo8D(item); }} 
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-purple-400" 
                      title={isAr ? 'تصعيد إلى 8D' : 'Escalate to 8D'}
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setCapaToDelete(item); }} 
                      className="p-2 hover:bg-rose-500/10 rounded-lg transition-colors text-gray-400 hover:text-rose-400" 
                      title={isAr ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                emptyState={
                  <div className="glass-panel rounded-2xl p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-white mb-1">
                      {isAr ? 'لا توجد إجراءات CAPA مسجلة' : 'No CAPAs found'}
                    </h3>
                    <p className="text-gray-400 text-xs mb-4">
                      {isAr ? 'جرّب تعديل خيارات البحث أو أنشئ إجراءً جديداً' : 'Try adjusting your search or filters'}
                    </p>
                  </div>
                }
              />
            )}
          </div>

          {/* Filter Panel Sidebar */}
          {showFilters && (
            <div className="w-full lg:w-72 shrink-0">
              <FilterPanel
                filters={[
                  { key: 'status', title: isAr ? 'الحالة' : 'Status', multi: true, options: [
                    { value: 'identified', label: isAr ? 'تم التحديد' : 'Identified', count: capas.filter(c => c.status === 'identified').length, color: '#6B7280' },
                    { value: 'analysis', label: isAr ? 'قيد التحليل' : 'Analysis', count: capas.filter(c => c.status === 'analysis').length, color: '#3B82F6' },
                    { value: 'action', label: isAr ? 'تنفيذ الإجراء' : 'Action', count: capas.filter(c => c.status === 'action').length, color: '#F59E0B' },
                    { value: 'verification', label: isAr ? 'التحقق' : 'Verification', count: capas.filter(c => c.status === 'verification').length, color: '#8B5CF6' },
                    { value: 'closed', label: isAr ? 'مغلق' : 'Closed', count: capas.filter(c => c.status === 'closed').length, color: '#10B981' }
                  ]},
                  { key: 'type', title: isAr ? 'النوع' : 'Type', multi: true, options: [
                    { value: 'corrective', label: isAr ? 'تصحيحي' : 'Corrective', count: capas.filter(c => c.type === 'corrective').length, color: '#F97316' },
                    { value: 'preventive', label: isAr ? 'وقائي' : 'Preventive', count: capas.filter(c => c.type === 'preventive').length, color: '#14B8A6' }
                  ]},
                  { key: 'priority', title: isAr ? 'الأولوية' : 'Priority', multi: true, options: [
                    { value: 'critical', label: isAr ? 'حرج' : 'Critical', count: capas.filter(c => c.priority === 'critical').length, color: '#DC2626' },
                    { value: 'high', label: isAr ? 'مرتفع' : 'High', count: capas.filter(c => c.priority === 'high').length, color: '#F59E0B' },
                    { value: 'medium', label: isAr ? 'متوسط' : 'Medium', count: capas.filter(c => c.priority === 'medium').length, color: '#3B82F6' },
                    { value: 'low', label: isAr ? 'منخفض' : 'Low', count: capas.filter(c => c.priority === 'low').length, color: '#6B7280' }
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
      {/* MODAL 1: VIEW CAPA DETAILS MODAL (نافذة عرض تفاصيل الكابا الشاملة) */}
      {/* ======================================================================== */}
      {viewingCapa && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-900 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl my-4 sm:my-8 space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#00A3E0] font-mono font-bold text-sm bg-[#00A3E0]/10 px-3 py-1 rounded-xl border border-[#00A3E0]/30">
                    {viewingCapa.capaNumber || viewingCapa.id}
                  </span>
                  <StatusBadge status={viewingCapa.status} />
                  <PriorityBadge priority={viewingCapa.priority} />
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${
                    viewingCapa.type === 'preventive' ? 'bg-teal-500/10 text-teal-300 border-teal-500/20' : 'bg-orange-500/10 text-orange-300 border-orange-500/20'
                  }`}>
                    {viewingCapa.type === 'preventive' ? (isAr ? 'إجراء وقائي' : 'Preventive Action') : (isAr ? 'إجراء تصحيحي' : 'Corrective Action')}
                  </span>
                </div>
                <h2 className="text-xl font-black text-white mt-2">
                  {viewingCapa.title}
                </h2>
              </div>

              <button
                onClick={() => setViewingCapa(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper / Progress Timeline */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">
                {isAr ? 'مراحل سير عمل الإجراء (CAPA Workflow Pipeline):' : 'CAPA Lifecycle Pipeline:'}
              </span>
              <div className="grid grid-cols-5 gap-2 text-center text-xs font-bold">
                {[
                  { id: 'identified', labelAr: '1. التحديد', labelEn: '1. Identified' },
                  { id: 'analysis', labelAr: '2. تحليل السبب', labelEn: '2. Root Cause' },
                  { id: 'action', labelAr: '3. تنفيذ الخطة', labelEn: '3. Action Plan' },
                  { id: 'verification', labelAr: '4. التحقق', labelEn: '4. Verification' },
                  { id: 'closed', labelAr: '5. الإغلاق', labelEn: '5. Closed' }
                ].map((st, idx) => {
                  const isActive = viewingCapa.status === st.id;
                  return (
                    <div 
                      key={idx} 
                      className={`py-2 px-1 rounded-xl border transition-all ${
                        isActive 
                          ? 'bg-[#00A3E0] text-slate-950 border-[#00A3E0] font-black shadow-md shadow-[#00A3E0]/20' 
                          : 'bg-white/5 border-white/5 text-gray-400'
                      }`}
                    >
                      {isAr ? st.labelAr : st.labelEn}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Key Information Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1">
                  <User className="w-3 h-3 text-[#00A3E0]" /> {isAr ? 'المسؤول' : 'Owner'}
                </span>
                <p className="text-sm font-black text-white truncate">{viewingCapa.owner || 'Unassigned'}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1">
                  <Building className="w-3 h-3 text-sky-400" /> {isAr ? 'القسم / المصنع' : 'Dept / Plant'}
                </span>
                <p className="text-sm font-black text-white truncate">{viewingCapa.department || 'QA'}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-emerald-400" /> {isAr ? 'تاريخ الإنشاء' : 'Created'}
                </span>
                <p className="text-sm font-black text-white font-mono">{viewingCapa.createdDate}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" /> {isAr ? 'الاستحقاق' : 'Target Date'}
                </span>
                <p className="text-sm font-black text-white font-mono">{viewingCapa.targetDate}</p>
              </div>
            </div>

            {/* Problem Statement */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1.5">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-4 h-4 text-rose-400" />
                {isAr ? 'بيان ووصف المشكلة (Problem Statement):' : 'Problem Statement:'}
              </span>
              <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap font-medium">
                {viewingCapa.problemStatement || viewingCapa.description || (isAr ? 'لا يوجد تفاصيل إضافية' : 'No detailed problem statement provided.')}
              </p>
            </div>

            {/* Root Cause & 5-Why Section */}
            {(viewingCapa.rootCause || viewingCapa.fiveWhy) && (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <span className="text-xs font-bold text-[#00A3E0] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#00A3E0]" />
                  {isAr ? 'تحليل الأسباب الجذرية (Root Cause & 5-Why):' : 'Root Cause & 5-Why Analysis:'}
                </span>

                {viewingCapa.rootCause && (
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-sky-500/20 text-xs text-sky-200">
                    <span className="font-bold text-sky-300 block mb-1">{isAr ? 'السبب الجذري الأساسي:' : 'Identified Root Cause:'}</span>
                    <p className="leading-relaxed">{viewingCapa.rootCause}</p>
                  </div>
                )}

                {viewingCapa.fiveWhy && (
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 text-xs text-gray-300">
                    <span className="font-bold text-gray-200 block mb-1">{isAr ? 'تحليل لماذا الخماسي (5-Why):' : '5-Why Breakdown:'}</span>
                    <p className="leading-relaxed whitespace-pre-wrap font-mono text-[11px]">{viewingCapa.fiveWhy}</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions: Corrective & Preventive */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Corrective */}
              <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20 space-y-1.5">
                <span className="text-xs font-bold text-orange-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-orange-400" />
                  {isAr ? 'الإجراء التصحيحي (Corrective Action):' : 'Corrective Action:'}
                </span>
                <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {viewingCapa.correctiveAction || (isAr ? 'قيد التحديد والتنفيذ' : 'Action under definition')}
                </p>
              </div>

              {/* Preventive */}
              <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/20 space-y-1.5">
                <span className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-teal-400" />
                  {isAr ? 'الإجراء الوقائي (Preventive Action):' : 'Preventive Action:'}
                </span>
                <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {viewingCapa.preventiveAction || (isAr ? 'قيد التحديد لمنع التكرار' : 'Preventive plan under definition')}
                </p>
              </div>
            </div>

            {/* Verification of Effectiveness */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  {isAr ? 'التحقق من الفاعلية (Effectiveness Check):' : 'Effectiveness Verification:'}
                </span>
                <p className="text-xs text-gray-300 mt-1">
                  {isAr ? 'حالة إغلاق الإجراء بعد المتابعة الميدانية والتحقق من عدم تكرار العيب' : 'Verification outcome following containment and implementation review'}
                </p>
              </div>

              <span className={`text-xs font-black px-3 py-1.5 rounded-xl border ${
                viewingCapa.effectiveness === 'effective' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                viewingCapa.effectiveness === 'ineffective' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {viewingCapa.effectiveness === 'effective' ? (isAr ? '✓ فاعل ومطابق' : 'Effective') :
                 viewingCapa.effectiveness === 'ineffective' ? (isAr ? '✗ غير فاعل' : 'Ineffective') : (isAr ? '⏳ قيد التحقق والمراقبة' : 'Pending Verification')}
              </span>
            </div>

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                {viewingCapa.sourceNCRId && (
                  <button
                    onClick={() => navigate(`/ncr?search=${viewingCapa.sourceNCRId}`)}
                    className="text-xs text-[#00A3E0] hover:underline flex items-center gap-1 font-bold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isAr ? `تقرير عدم المطابقة (${viewingCapa.sourceNCRId})` : `Source NCR (${viewingCapa.sourceNCRId})`}</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => handleCreateImprovementAction(viewingCapa)}
                  className="bg-teal-500/10 text-teal-300 border-teal-500/30 hover:bg-teal-500/20 rounded-xl h-11 flex-1 sm:flex-initial justify-center"
                >
                  <Sparkles className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                  {isAr ? 'ربط خطة تحسين' : 'Link Action'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleEscalateTo8D(viewingCapa)}
                  className="bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20 rounded-xl h-11 flex-1 sm:flex-initial justify-center"
                >
                  <ShieldAlert className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                  {isAr ? 'تصعيد إلى 8D' : 'Escalate to 8D'}
                </Button>

                <Button
                  onClick={() => handleOpenEdit(viewingCapa)}
                  className="bg-[#00A3E0] hover:bg-[#008cc0] text-slate-950 font-black rounded-xl h-11 px-6 shadow-lg shadow-[#00A3E0]/20 flex-1 sm:flex-initial justify-center"
                >
                  <Edit3 className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                  {isAr ? 'تعديل هذا الإجراء' : 'Edit CAPA'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setViewingCapa(null)}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-11 w-full sm:w-auto justify-center"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODAL 2: EDIT & CREATE CAPA MODAL (نافذة تعديل وإنشاء الكابا المباشرة) */}
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
                    {editingCapa 
                      ? (isAr ? `تعديل إجراء CAPA (${editingCapa.capaNumber || editingCapa.id})` : `Edit CAPA (${editingCapa.id})`) 
                      : (isAr ? 'إنشاء إجراء تصحيحي / وقائي جديد (New CAPA)' : 'Create New CAPA')}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isAr ? 'تحديث وتوثيق مسار السبب الجذري وخطة الإجراءات والتنفيذ المعتمدة' : 'Configure corrective & preventive action lifecycle, owner, and verification'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => { setIsFormOpen(false); setEditingCapa(null); }}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-5">
              {/* Title & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'عنوان إجراء الـ CAPA' : 'CAPA Title'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={isAr ? 'مثال: علاج عيوب تسريب اللحام في خط 02' : 'e.g. Containment of welding defect on Line 02'}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'نوع الإجراء' : 'Action Type'}
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  >
                    <option value="corrective" className="bg-slate-900">{isAr ? 'تصحيحي (Corrective)' : 'Corrective'}</option>
                    <option value="preventive" className="bg-slate-900">{isAr ? 'وقائي (Preventive)' : 'Preventive'}</option>
                  </select>
                </div>
              </div>

              {/* Status, Priority, Target Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'مرحلة سير العمل' : 'Status Phase'}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  >
                    <option value="identified" className="bg-slate-900">{isAr ? 'تم التحديد (Identified)' : 'Identified'}</option>
                    <option value="analysis" className="bg-slate-900">{isAr ? 'تحليل السبب الجذري (Analysis)' : 'Analysis'}</option>
                    <option value="action" className="bg-slate-900">{isAr ? 'تنفيذ الإجراءات (Action)' : 'Action'}</option>
                    <option value="verification" className="bg-slate-900">{isAr ? 'التحقق والفاعلية (Verification)' : 'Verification'}</option>
                    <option value="closed" className="bg-slate-900">{isAr ? 'مغلق ومكتمل (Closed)' : 'Closed'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'الأولوية والأهمية' : 'Priority'}
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  >
                    <option value="critical" className="bg-slate-900">{isAr ? 'حرج (Critical)' : 'Critical'}</option>
                    <option value="high" className="bg-slate-900">{isAr ? 'مرتفع (High)' : 'High'}</option>
                    <option value="medium" className="bg-slate-900">{isAr ? 'متوسط (Medium)' : 'Medium'}</option>
                    <option value="low" className="bg-slate-900">{isAr ? 'منخفض (Low)' : 'Low'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'تاريخ الاستحقاق المستهدف' : 'Target Date'}
                  </label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>
              </div>

              {/* Owner, Department, Source NCR */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'المسؤول المتابع' : 'Owner'}
                  </label>
                  <input
                    type="text"
                    value={formData.owner}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    placeholder="Eng. Sara Ibrahim"
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'القسم / الإدارة' : 'Department'}
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Welding & Body Assembly"
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'رقم عدم المطابقة (Source NCR)' : 'Source NCR ID'}
                  </label>
                  <input
                    type="text"
                    value={formData.sourceNCRId}
                    onChange={(e) => setFormData({ ...formData, sourceNCRId: e.target.value })}
                    placeholder="NCR-2026-089"
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>
              </div>

              {/* Problem Statement */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">
                  {isAr ? 'بيان ووصف المشكلة التفصيلي (Problem Statement)' : 'Problem Statement'}
                </label>
                <textarea
                  rows={2}
                  value={formData.problemStatement}
                  onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
                  placeholder={isAr ? 'صف العيب والمشكلة بدقة وعدد القطع المتأثرة...' : 'Describe the problem, affected lots, and impact...'}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#00A3E0]"
                />
              </div>

              {/* Root Cause & 5-Why */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'السبب الجذري المستنتج (Root Cause)' : 'Root Cause'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.rootCause}
                    onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
                    placeholder={isAr ? 'السبب الفني أو الإجرائي الذي قاد لحدوث الخلل...' : 'Underlying reason for non-conformance...'}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'تحليل لماذا الخماسي (5-Why)' : '5-Why Analysis'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.fiveWhy}
                    onChange={(e) => setFormData({ ...formData, fiveWhy: e.target.value })}
                    placeholder={isAr ? '1. لماذا حدث؟ ... 2. لماذا ...' : '1. Why did it happen? 2. Why...'}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>
              </div>

              {/* Corrective & Preventive Action */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-orange-400 mb-1.5">
                    {isAr ? 'الإجراء التصحيحي (Corrective Action)' : 'Corrective Action Plan'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.correctiveAction}
                    onChange={(e) => setFormData({ ...formData, correctiveAction: e.target.value })}
                    placeholder={isAr ? 'الخطوات المتخذة لعلاج الخلل الحالي فوراً...' : 'Action taken to resolve current non-conformance...'}
                    className="w-full p-3 bg-white/5 border border-orange-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-teal-400 mb-1.5">
                    {isAr ? 'الإجراء الوقائي (Preventive Action)' : 'Preventive Action Plan'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.preventiveAction}
                    onChange={(e) => setFormData({ ...formData, preventiveAction: e.target.value })}
                    placeholder={isAr ? 'الخطوات المتخذة لمنع تكرار العيب مستقبلاً...' : 'Action taken to prevent recurrence...'}
                    className="w-full p-3 bg-white/5 border border-teal-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              {/* Effectiveness Status */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">
                  {isAr ? 'حالة التحقق من الفاعلية (Effectiveness Status)' : 'Effectiveness Verification'}
                </label>
                <select
                  value={formData.effectiveness}
                  onChange={(e) => setFormData({ ...formData, effectiveness: e.target.value as any })}
                  className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                >
                  <option value="pending" className="bg-slate-900">{isAr ? 'قيد التحقق والمراقبة (Pending)' : 'Pending Verification'}</option>
                  <option value="effective" className="bg-slate-900">{isAr ? 'فاعل ومحقق للأهداف (Effective)' : 'Effective'}</option>
                  <option value="ineffective" className="bg-slate-900">{isAr ? 'غير فاعل - يتطلب إعادة دراسة (Ineffective)' : 'Ineffective'}</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setIsFormOpen(false); setEditingCapa(null); }}
                  className="bg-white/5 border-white/10 text-white rounded-xl h-11 w-full sm:w-auto justify-center"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  className="bg-[#00A3E0] hover:bg-[#008cc0] text-slate-950 font-black rounded-xl h-11 px-6 shadow-lg shadow-[#00A3E0]/20 w-full sm:w-auto justify-center"
                >
                  {editingCapa ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'إنشاء الإجراء' : 'Create CAPA')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODAL 3: DELETE CONFIRMATION DIALOG */}
      {/* ======================================================================== */}
      {capaToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">
                {isAr ? 'تأكيد حذف إجراء CAPA؟' : 'Confirm CAPA Deletion?'}
              </h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                {isAr 
                  ? `هل أنت متأكد من حذف الإجراء "${capaToDelete.title}" (${capaToDelete.capaNumber || capaToDelete.id})؟ لا يمكن التراجع عن هذا الإجراء.`
                  : `Are you sure you want to delete CAPA "${capaToDelete.id}"?`}
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setCapaToDelete(null)}
                className="bg-white/5 border-white/10 text-white rounded-xl h-11"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl h-11 px-6 shadow-lg shadow-rose-600/30"
              >
                {isAr ? 'تأكيد الحذف' : 'Delete CAPA'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default CAPAPage;
