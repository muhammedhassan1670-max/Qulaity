import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Loader2, 
  Edit3, 
  ShieldAlert, 
  ClipboardList, 
  Layers, 
  Building, 
  Target, 
  FileCheck2,
  X 
} from 'lucide-react';
import { PageContainer, PageHeader, PageSection, StatsBar } from '../../components/PageHeader';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { Button } from '@/components/ui/button';
import { unifiedNcrApi } from '../../api/unified-api';
import { DEFAULT_NCRS, type NCRItem } from './NCR';
import { useTranslation } from '@/utils/translations';

export function NCRDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [ncr, setNcr] = useState<NCRItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
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

  const loadRecord = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      // 1. Try remote API
      try {
        const data = await unifiedNcrApi.getById(id);
        if (data && data.id) {
          setNcr(data as unknown as NCRItem);
          return;
        }
      } catch {
        // Continue to fallback
      }

      // 2. Try LocalStorage
      const local = localStorage.getItem('qms_local_ncr');
      if (local) {
        const parsed: NCRItem[] = JSON.parse(local);
        const found = parsed.find(n => n.id === id || n.ncrNumber === id);
        if (found) {
          setNcr(found);
          return;
        }
      }

      // 3. Try DEFAULT_NCRS
      const defaultFound = DEFAULT_NCRS.find(n => n.id === id || n.ncrNumber === id);
      if (defaultFound) {
        setNcr(defaultFound);
        return;
      }

      setNcr(null);
    } catch {
      toast.error(isAr ? 'تعذر تحميل بيانات تقرير عدم المطابقة' : 'Failed to load NCR details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecord();
  }, [id]);

  const handleOpenEdit = () => {
    if (!ncr) return;
    setEditFormData({
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
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ncr) return;

    const updatedItem: NCRItem = {
      ...ncr,
      title: editFormData.title.trim(),
      description: editFormData.description.trim(),
      defectType: editFormData.defectType,
      severity: editFormData.severity,
      status: editFormData.status,
      priority: editFormData.priority,
      department: editFormData.department.trim(),
      productionLine: editFormData.productionLine.trim(),
      affectedQuantity: Number(editFormData.affectedQuantity) || 1,
      lotNumber: editFormData.lotNumber.trim(),
      containmentAction: editFormData.containmentAction.trim(),
      disposition: editFormData.disposition,
      dispositionNotes: editFormData.dispositionNotes.trim(),
      rootCauseNotes: editFormData.rootCauseNotes.trim(),
      assignedTo: editFormData.assignedTo.trim(),
      dueDate: editFormData.dueDate,
    };

    setNcr(updatedItem);

    // Save to LocalStorage
    try {
      const local = localStorage.getItem('qms_local_ncr');
      const list: NCRItem[] = local ? JSON.parse(local) : [...DEFAULT_NCRS];
      const index = list.findIndex(item => item.id === updatedItem.id || item.ncrNumber === updatedItem.id);
      if (index >= 0) {
        list[index] = updatedItem;
      } else {
        list.unshift(updatedItem);
      }
      localStorage.setItem('qms_local_ncr', JSON.stringify(list));
    } catch (err) {
      console.error('LocalStorage write failed:', err);
    }

    // Try remote update
    try {
      await unifiedNcrApi.update(updatedItem.id, updatedItem as any).catch(() => null);
    } catch {
      // background
    }

    toast.success(isAr ? 'تم تحديث تقرير عدم المطابقة بنجاح' : 'NCR updated successfully');
    setIsEditOpen(false);
  };

  const stats = useMemo(() => {
    if (!ncr) return [];
    return [
      { label: isAr ? 'الحالة' : 'Status', value: ncr.status, change: '', trend: 'neutral' as const },
      { label: isAr ? 'الخطورة' : 'Severity', value: ncr.severity.toUpperCase(), change: '', trend: 'neutral' as const },
      { label: isAr ? 'الكمية المتأثرة' : 'Affected Qty', value: `${ncr.affectedQuantity} pcs`, change: '', trend: 'neutral' as const },
      { label: isAr ? 'المسؤول' : 'Assigned To', value: ncr.assignedTo || 'Unassigned', change: '', trend: 'neutral' as const },
    ];
  }, [ncr, isAr]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center h-96 gap-3">
          <Loader2 className="w-10 h-10 text-[#00A3E0] animate-spin" />
          <p className="text-gray-400 text-sm font-medium">{isAr ? 'جاري تحميل تفاصيل التقرير...' : 'Loading NCR details...'}</p>
        </div>
      </PageContainer>
    );
  }

  if (!ncr) {
    return (
      <PageContainer>
        <PageHeader
          title={isAr ? 'تفاصيل عدم المطابقة' : 'NCR Details'}
          subtitle={isAr ? 'السجل غير موجود أو تم حذفه' : 'Record not found'}
          breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'NCR', path: '/ncr' }, { label: id ?? 'Unknown' }]}
        />
        <PageSection>
          <div className="glass-panel rounded-2xl p-8 text-center space-y-4">
            <p className="text-gray-300 font-bold">{isAr ? 'لم يتم العثور على التقرير المطلوب' : 'NCR record was not found'}</p>
            <button
              className="h-11 px-5 bg-[#00A3E0] text-slate-950 font-bold rounded-xl hover:bg-[#008cc0] transition-colors inline-flex items-center gap-2"
              onClick={() => navigate('/ncr')}
            >
              <ArrowLeft className="w-4 h-4" />
              {isAr ? 'العودة لسجلات NCR' : 'Back to NCR Workspace'}
            </button>
          </div>
        </PageSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={ncr.ncrNumber || ncr.id}
        subtitle={ncr.title}
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'NCR', path: '/ncr' }, { label: ncr.ncrNumber || ncr.id }]}
        actions={{
          refresh: loadRecord,
          custom: [
            {
              label: isAr ? 'تعديل التقرير' : 'Edit NCR',
              variant: 'primary',
              icon: <Edit3 className="w-4 h-4" />,
              onClick: handleOpenEdit,
            },
            {
              label: isAr ? 'فتح CAPA' : 'Open CAPA',
              variant: 'secondary',
              icon: <ShieldAlert className="w-4 h-4" />,
              onClick: () => navigate(`/capa?create=1&sourceNCRId=${ncr.ncrNumber || ncr.id}&title=${encodeURIComponent(ncr.title)}`),
            },
            {
              label: isAr ? 'تصعيد إلى 8D' : 'Escalate to 8D',
              variant: 'secondary',
              icon: <ClipboardList className="w-4 h-4" />,
              onClick: () => navigate(`/8d?create=1&sourceNCRId=${ncr.ncrNumber || ncr.id}&title=${encodeURIComponent(ncr.title)}`),
            },
          ],
        }}
      />

      <StatsBar stats={stats} />

      <PageSection>
        <div className="space-y-6">
          {/* Header Badges */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <StatusBadge status={ncr.status} />
              <PriorityBadge priority={ncr.priority} />
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                ncr.severity === 'critical' ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' :
                ncr.severity === 'major' ? 'bg-orange-500/10 text-orange-300 border-orange-500/20' : 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20'
              }`}>
                {ncr.severity.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="glass-panel rounded-2xl p-5 border border-white/10 bg-slate-900/60 backdrop-blur-xl">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              {isAr ? 'مسار دورة حياة تقرير عدم المطابقة' : 'NCR Lifecycle Phase'}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { key: 'open', labelAr: 'الرصد والتسجيل', labelEn: 'Open' },
                { key: 'in-progress', labelAr: 'الاحتواء والعزل', labelEn: 'Containment' },
                { key: 'under-review', labelAr: 'التحقيق والمراجعة', labelEn: 'Review' },
                { key: 'disposition', labelAr: 'قرار التصرف (MRB)', labelEn: 'Disposition' },
                { key: 'closed', labelAr: 'مغلق ومكتمل', labelEn: 'Closed' },
              ].map((step, idx) => {
                const phaseOrder = ['open', 'in-progress', 'under-review', 'disposition', 'closed'];
                const currentIdx = phaseOrder.indexOf(ncr.status);
                const isCurrent = step.key === ncr.status;
                const isPassed = currentIdx >= idx;
                return (
                  <div
                    key={step.key}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-[#00A3E0]/20 border-[#00A3E0] text-white shadow-lg shadow-[#00A3E0]/20 font-bold'
                        : isPassed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-white/5 border-white/5 text-gray-500'
                    }`}
                  >
                    <div className="text-xs font-bold">
                      {idx + 1}. {isAr ? step.labelAr : step.labelEn}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <Calendar className="w-4 h-4 text-[#00A3E0]" />
                {isAr ? 'تاريخ الرصد' : 'Detected Date'}
              </div>
              <div className="text-gray-100 font-bold mt-1 text-sm">{ncr.createdDate || 'N/A'}</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <Calendar className="w-4 h-4 text-amber-400" />
                {isAr ? 'تاريخ الاستحقاق' : 'Due Date'}
              </div>
              <div className="text-amber-300 font-bold mt-1 text-sm">{ncr.dueDate || 'N/A'}</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <User className="w-4 h-4 text-[#00A3E0]" />
                {isAr ? 'المسؤول المتابع' : 'Assigned To'}
              </div>
              <div className="text-gray-100 font-bold mt-1 text-sm">{ncr.assignedTo || 'Unassigned'}</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <Building className="w-4 h-4 text-emerald-400" />
                {isAr ? 'القسم والخط' : 'Dept & Line'}
              </div>
              <div className="text-gray-100 font-bold mt-1 text-sm truncate">{ncr.department}</div>
              <div className="text-gray-400 text-xs truncate">{ncr.productionLine}</div>
            </div>
          </div>

          {/* Description & Lot */}
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-xl space-y-2">
            <div className="flex items-center gap-2 text-cyan-400">
              <Target className="w-5 h-5" />
              <h4 className="text-base font-bold text-white">
                {isAr ? 'بيان عدم المطابقة والمواصفة المخالفة' : 'Non-Conformance Statement'}
              </h4>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
              {ncr.description || (isAr ? 'لا يوجد وصف مسجل' : 'No description recorded')}
            </p>
            {ncr.lotNumber && (
              <p className="text-xs text-gray-400 pt-1">
                <strong>{isAr ? 'رقم التشغيلة / الباتش:' : 'Lot Number:'}</strong> {ncr.lotNumber}
              </p>
            )}
          </div>

          {/* Containment & Disposition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/80 border border-yellow-500/20 rounded-2xl p-6 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-yellow-400">
                  <ShieldAlert className="w-5 h-5" />
                  <h4 className="text-base font-bold text-white">
                    {isAr ? 'إجراءات الاحتواء الفوري' : 'Containment Action'}
                  </h4>
                </div>
                <span className="text-xs font-bold text-yellow-300 bg-yellow-500/10 px-2 py-0.5 rounded-md">
                  {ncr.affectedQuantity} {isAr ? 'قطع' : 'pcs'}
                </span>
              </div>
              <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-xl text-gray-300 text-sm leading-relaxed">
                {ncr.containmentAction || (isAr ? 'لم تسجل إجراءات احتواء فورية' : 'No containment action documented')}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-orange-500/20 rounded-2xl p-6 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-orange-400">
                  <Layers className="w-5 h-5" />
                  <h4 className="text-base font-bold text-white">
                    {isAr ? 'قرار التصرف النهائي (MRB)' : 'Disposition Decision'}
                  </h4>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300">
                  {ncr.disposition.toUpperCase()}
                </span>
              </div>
              <div className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-xl text-gray-300 text-sm leading-relaxed">
                {ncr.dispositionNotes || (isAr ? 'قيد المراجعة وتحديد القرار الفني' : 'Pending MRB evaluation')}
              </div>
            </div>
          </div>

          {/* Root Cause Notes */}
          {ncr.rootCauseNotes && (
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-xl space-y-2">
              <div className="flex items-center gap-2 text-indigo-400">
                <FileCheck2 className="w-5 h-5" />
                <h4 className="text-base font-bold text-white">
                  {isAr ? 'ملاحظات التحقيق والسبب الجذري الأولي' : 'Root Cause Investigation'}
                </h4>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                {ncr.rootCauseNotes}
              </p>
            </div>
          )}

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              className="h-11 px-5 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors inline-flex items-center gap-2 text-sm font-medium"
              onClick={() => navigate('/ncr')}
            >
              <ArrowLeft className="w-4 h-4" />
              {isAr ? 'الرجوع لسجلات NCR' : 'Back to NCR Workspace'}
            </button>

            <Button
              onClick={handleOpenEdit}
              className="bg-[#00A3E0] hover:bg-[#008cc0] text-slate-950 font-bold rounded-xl h-11 px-6 shadow-lg shadow-[#00A3E0]/20"
            >
              <Edit3 className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
              {isAr ? 'تعديل هذا التقرير' : 'Edit NCR'}
            </Button>
          </div>
        </div>
      </PageSection>

      {/* EDIT MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#00A3E0]/10 text-[#00A3E0] border border-[#00A3E0]/20">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    {isAr ? `تعديل تقرير عدم المطابقة (${ncr.ncrNumber || ncr.id})` : `Edit NCR (${ncr.id})`}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isAr ? 'تحديث وتوثيق إجراءات الاحتواء، الكمية، وقرار التصرف' : 'Update containment, quantity, and disposition notes'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEditOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'عنوان عدم المطابقة' : 'Title'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'نوع العيب' : 'Defect Type'}
                  </label>
                  <input
                    type="text"
                    value={editFormData.defectType}
                    onChange={(e) => setEditFormData({ ...editFormData, defectType: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'الحالة' : 'Status'}
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
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
                    {isAr ? 'الخطورة' : 'Severity'}
                  </label>
                  <select
                    value={editFormData.severity}
                    onChange={(e) => setEditFormData({ ...editFormData, severity: e.target.value as any })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  >
                    <option value="critical" className="bg-slate-900">{isAr ? 'حرج (Critical)' : 'Critical'}</option>
                    <option value="major" className="bg-slate-900">{isAr ? 'كبير (Major)' : 'Major'}</option>
                    <option value="minor" className="bg-slate-900">{isAr ? 'بسيط (Minor)' : 'Minor'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'الكمية المتأثرة' : 'Affected Qty'}
                  </label>
                  <input
                    type="number"
                    value={editFormData.affectedQuantity}
                    onChange={(e) => setEditFormData({ ...editFormData, affectedQuantity: Number(e.target.value) })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'المسؤول' : 'Assigned To'}
                  </label>
                  <input
                    type="text"
                    value={editFormData.assignedTo}
                    onChange={(e) => setEditFormData({ ...editFormData, assignedTo: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'خط الإنتاج' : 'Production Line'}
                  </label>
                  <input
                    type="text"
                    value={editFormData.productionLine}
                    onChange={(e) => setEditFormData({ ...editFormData, productionLine: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'تاريخ الاستحقاق' : 'Due Date'}
                  </label>
                  <input
                    type="date"
                    value={editFormData.dueDate}
                    onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">
                  {isAr ? 'الوصف التفصيلي' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#00A3E0]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-yellow-400 mb-1.5">
                  {isAr ? 'إجراءات الاحتواء الفوري (Containment Action)' : 'Containment Action'}
                </label>
                <textarea
                  rows={2}
                  value={editFormData.containmentAction}
                  onChange={(e) => setEditFormData({ ...editFormData, containmentAction: e.target.value })}
                  className="w-full p-3 bg-white/5 border border-yellow-500/20 rounded-xl text-white text-xs focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-orange-400 mb-1.5">
                    {isAr ? 'قرار التصرف' : 'Disposition'}
                  </label>
                  <select
                    value={editFormData.disposition}
                    onChange={(e) => setEditFormData({ ...editFormData, disposition: e.target.value as any })}
                    className="w-full h-11 px-4 bg-white/5 border border-orange-500/20 rounded-xl text-white text-sm focus:outline-none focus:border-orange-400"
                  >
                    <option value="pending" className="bg-slate-900">{isAr ? 'قيد الدراسة (Pending)' : 'Pending'}</option>
                    <option value="rework" className="bg-slate-900">{isAr ? 'إعادة تشغيل (Rework)' : 'Rework'}</option>
                    <option value="scrap" className="bg-slate-900">{isAr ? 'تخريد (Scrap)' : 'Scrap'}</option>
                    <option value="return-to-vendor" className="bg-slate-900">{isAr ? 'إرجاع للمورد' : 'Return to Vendor'}</option>
                    <option value="use-as-is" className="bg-slate-900">{isAr ? 'استخدام بحالته' : 'Use As Is'}</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-orange-400 mb-1.5">
                    {isAr ? 'ملاحظات قرار التصرف' : 'Disposition Notes'}
                  </label>
                  <input
                    type="text"
                    value={editFormData.dispositionNotes}
                    onChange={(e) => setEditFormData({ ...editFormData, dispositionNotes: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-orange-500/20 rounded-xl text-white text-sm focus:outline-none focus:border-orange-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-indigo-400 mb-1.5">
                  {isAr ? 'ملاحظات السبب الجذري الأولي' : 'Root Cause Investigation'}
                </label>
                <textarea
                  rows={2}
                  value={editFormData.rootCauseNotes}
                  onChange={(e) => setEditFormData({ ...editFormData, rootCauseNotes: e.target.value })}
                  className="w-full p-3 bg-white/5 border border-indigo-500/20 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="bg-white/5 border-white/10 text-white rounded-xl h-11"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  className="bg-[#00A3E0] hover:bg-[#008cc0] text-slate-950 font-bold rounded-xl h-11 px-6 shadow-lg shadow-[#00A3E0]/20"
                >
                  {isAr ? 'حفظ التعديلات' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default NCRDetailsPage;
