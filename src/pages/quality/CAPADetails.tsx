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
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Building, 
  Target, 
  FileCheck2,
  X 
} from 'lucide-react';
import { PageContainer, PageHeader, PageSection, StatsBar } from '../../components/PageHeader';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { Button } from '@/components/ui/button';
import { unifiedCapaApi } from '../../api/unified-api';
import { DEFAULT_CAPAS, type CAPAItem } from './CAPA';
import { QualityEngine } from '../../services/qualityEngine';
import { useTranslation } from '@/utils/translations';

export function CAPADetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [capa, setCapa] = useState<CAPAItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
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
    targetDate: '',
    rootCause: '',
    fiveWhy: '',
    correctiveAction: '',
    preventiveAction: '',
    effectiveness: 'pending' as 'pending' | 'effective' | 'ineffective',
  });

  const loadRecord = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      // 1. Try remote API
      try {
        const data = await unifiedCapaApi.getById(id);
        if (data && data.id) {
          setCapa(data as unknown as CAPAItem);
          return;
        }
      } catch {
        // API offline or error, continue to fallback
      }

      // 2. Try LocalStorage
      const local = localStorage.getItem('qms_local_capa');
      if (local) {
        const parsed: CAPAItem[] = JSON.parse(local);
        const found = parsed.find(c => c.id === id || c.capaNumber === id);
        if (found) {
          setCapa(found);
          return;
        }
      }

      // 3. Try DEFAULT_CAPAS
      const defaultFound = DEFAULT_CAPAS.find(c => c.id === id || c.capaNumber === id);
      if (defaultFound) {
        setCapa(defaultFound);
        return;
      }

      setCapa(null);
    } catch (e) {
      toast.error(isAr ? 'تعذر تحميل بيانات الإجراء' : 'Failed to load CAPA details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecord();
  }, [id]);

  const handleOpenEdit = () => {
    if (!capa) return;
    setEditFormData({
      title: capa.title || '',
      description: capa.description || '',
      problemStatement: capa.problemStatement || capa.description || '',
      type: capa.type || 'corrective',
      status: capa.status || 'identified',
      priority: capa.priority || 'medium',
      sourceNCRId: capa.sourceNCRId || '',
      owner: capa.owner || '',
      department: capa.department || 'Quality Assurance',
      plant: capa.plant || 'Main Plant - Assembly 01',
      targetDate: capa.targetDate || new Date().toISOString().split('T')[0],
      rootCause: capa.rootCause || '',
      fiveWhy: capa.fiveWhy || '',
      correctiveAction: capa.correctiveAction || '',
      preventiveAction: capa.preventiveAction || '',
      effectiveness: capa.effectiveness || 'pending',
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capa) return;

    const updatedItem: CAPAItem = {
      ...capa,
      title: editFormData.title.trim(),
      description: editFormData.description.trim() || editFormData.problemStatement.trim(),
      problemStatement: editFormData.problemStatement.trim() || editFormData.description.trim(),
      type: editFormData.type,
      status: editFormData.status,
      priority: editFormData.priority,
      sourceNCRId: editFormData.sourceNCRId.trim() || undefined,
      source: editFormData.sourceNCRId.trim() ? `NCR-${editFormData.sourceNCRId.trim()}` : capa.source,
      owner: editFormData.owner.trim() || capa.owner,
      department: editFormData.department.trim(),
      plant: editFormData.plant,
      targetDate: editFormData.targetDate,
      rootCause: editFormData.rootCause.trim(),
      fiveWhy: editFormData.fiveWhy.trim(),
      correctiveAction: editFormData.correctiveAction.trim(),
      preventiveAction: editFormData.preventiveAction.trim(),
      effectiveness: editFormData.effectiveness,
    };

    // Update state
    setCapa(updatedItem);

    // Update LocalStorage
    try {
      const local = localStorage.getItem('qms_local_capa');
      const list: CAPAItem[] = local ? JSON.parse(local) : [...DEFAULT_CAPAS];
      const index = list.findIndex(c => c.id === updatedItem.id || c.capaNumber === updatedItem.id);
      if (index >= 0) {
        list[index] = updatedItem;
      } else {
        list.unshift(updatedItem);
      }
      localStorage.setItem('qms_local_capa', JSON.stringify(list));
    } catch (err) {
      console.error('LocalStorage write failed:', err);
    }

    // Try remote update
    try {
      await unifiedCapaApi.update(updatedItem.id, updatedItem as any).catch(() => null);
    } catch {
      // Ignore background api sync failure
    }

    toast.success(isAr ? 'تم حفظ وتحديث بيانات الإجراء بنجاح' : 'CAPA updated successfully');
    setIsEditOpen(false);
  };

  const handleEscalateTo8D = async () => {
    if (!capa) return;
    try {
      const result = await QualityEngine.trigger8dFromCapa(capa.id, true);
      if (result) {
        toast.success(isAr ? 'تم تصعيد الإجراء إلى 8D بنجاح' : '8D Escalated successfully');
        navigate('/8d');
      }
    } catch {
      toast.error('Failed to escalate to 8D');
    }
  };

  const stats = useMemo(() => {
    if (!capa) return [];
    return [
      { label: isAr ? 'المرحلة الحالية' : 'Status', value: capa.status, change: '', trend: 'neutral' as const },
      { label: isAr ? 'مستوى الأولوية' : 'Priority', value: capa.priority, change: '', trend: 'neutral' as const },
      { label: isAr ? 'نوع الإجراء' : 'Type', value: capa.type === 'preventive' ? (isAr ? 'وقائي' : 'Preventive') : (isAr ? 'تصحيحي' : 'Corrective'), change: '', trend: 'neutral' as const },
      { label: isAr ? 'تاريخ الاستحقاق' : 'Target Date', value: capa.targetDate || 'N/A', change: '', trend: 'neutral' as const },
    ];
  }, [capa, isAr]);

  const phases = ['identified', 'analysis', 'action', 'verification', 'closed'];
  const phaseLabelsAr: Record<string, string> = {
    identified: 'الرصد والتحديد',
    analysis: 'تحليل السبب الجذري',
    action: 'خطة الإجراءات',
    verification: 'التحقق والمراقبة',
    closed: 'مغلق ومكتمل',
  };
  const phaseLabelsEn: Record<string, string> = {
    identified: 'Identified',
    analysis: 'Root Cause',
    action: 'Action Plan',
    verification: 'Verification',
    closed: 'Closed',
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center h-96 gap-3">
          <Loader2 className="w-10 h-10 text-[#00A3E0] animate-spin" />
          <p className="text-gray-400 text-sm font-medium">{isAr ? 'جاري تحميل تفاصيل الإجراء...' : 'Loading CAPA details...'}</p>
        </div>
      </PageContainer>
    );
  }

  if (!capa) {
    return (
      <PageContainer>
        <PageHeader
          title={isAr ? 'تفاصيل الإجراء التصحيحي' : 'CAPA Details'}
          subtitle={isAr ? 'السجل غير موجود أو تم حذفه' : 'Record not found'}
          breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'CAPA', path: '/capa' }, { label: id ?? 'Unknown' }]}
        />
        <PageSection>
          <div className="glass-panel rounded-2xl p-8 text-center space-y-4">
            <p className="text-gray-300 font-bold">{isAr ? 'لم يتم العثور على الإجراء المطلوب' : 'CAPA record was not found'}</p>
            <button
              className="h-11 px-5 bg-[#00A3E0] text-slate-950 font-bold rounded-xl hover:bg-[#008cc0] transition-colors inline-flex items-center gap-2"
              onClick={() => navigate('/capa')}
            >
              <ArrowLeft className="w-4 h-4" />
              {isAr ? 'العودة لسجلات CAPA' : 'Back to CAPA Workspace'}
            </button>
          </div>
        </PageSection>
      </PageContainer>
    );
  }

  const currentPhaseIndex = phases.indexOf(capa.status);

  return (
    <PageContainer>
      <PageHeader
        title={capa.capaNumber || capa.id}
        subtitle={capa.title}
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'CAPA', path: '/capa' }, { label: capa.capaNumber || capa.id }]}
        actions={{
          refresh: loadRecord,
          custom: [
            {
              label: isAr ? 'تعديل الإجراء' : 'Edit CAPA',
              variant: 'primary',
              icon: <Edit3 className="w-4 h-4" />,
              onClick: handleOpenEdit,
            },
            {
              label: isAr ? 'تصعيد إلى 8D' : 'Escalate to 8D',
              variant: 'secondary',
              icon: <ShieldAlert className="w-4 h-4" />,
              onClick: handleEscalateTo8D,
            },
            ...(capa.sourceNCRId ? [{
              label: isAr ? `عدم المطابقة (${capa.sourceNCRId})` : `Source NCR (${capa.sourceNCRId})`,
              variant: 'secondary' as const,
              icon: <ExternalLink className="w-4 h-4" />,
              onClick: () => navigate(`/ncr?search=${capa.sourceNCRId}`),
            }] : [])
          ],
        }}
      />

      <StatsBar stats={stats} />

      <PageSection>
        <div className="space-y-6">
          {/* Header Badges */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <StatusBadge status={capa.status} />
              <PriorityBadge priority={capa.priority} />
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="glass-panel rounded-2xl p-5 border border-white/10 bg-slate-900/60 backdrop-blur-xl">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              {isAr ? 'مسار دورة حياة الإجراء (Workflow Lifecycle)' : 'CAPA Lifecycle Phase'}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {phases.map((phase, idx) => {
                const isPassed = currentPhaseIndex >= idx;
                const isCurrent = currentPhaseIndex === idx;
                return (
                  <div
                    key={phase}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-[#00A3E0]/20 border-[#00A3E0] text-white shadow-lg shadow-[#00A3E0]/20 font-bold'
                        : isPassed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-white/5 border-white/5 text-gray-500'
                    }`}
                  >
                    <div className="text-xs font-bold">
                      {idx + 1}. {isAr ? phaseLabelsAr[phase] : phaseLabelsEn[phase]}
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] text-[#00A3E0] mt-1 block">
                        {isAr ? '● المرحلة النشطة' : '● In Progress'}
                      </span>
                    )}
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
                {isAr ? 'تاريخ الإنشاء' : 'Created Date'}
              </div>
              <div className="text-gray-100 font-bold mt-1 text-sm">{capa.createdDate || 'N/A'}</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <Clock className="w-4 h-4 text-amber-400" />
                {isAr ? 'تاريخ الاستحقاق' : 'Target Date'}
              </div>
              <div className="text-amber-300 font-bold mt-1 text-sm">{capa.targetDate || 'N/A'}</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <User className="w-4 h-4 text-[#00A3E0]" />
                {isAr ? 'المسؤول المتابع' : 'Owner'}
              </div>
              <div className="text-gray-100 font-bold mt-1 text-sm">{capa.owner || 'Unassigned'}</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <Building className="w-4 h-4 text-emerald-400" />
                {isAr ? 'القسم والموقع' : 'Department & Plant'}
              </div>
              <div className="text-gray-100 font-bold mt-1 text-sm truncate">{capa.department}</div>
              <div className="text-gray-400 text-xs truncate">{capa.plant}</div>
            </div>
          </div>

          {/* Problem Statement Box */}
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Target className="w-5 h-5" />
              <h4 className="text-base font-bold text-white">
                {isAr ? 'بيان ووصف المشكلة (Problem Statement)' : 'Problem Statement'}
              </h4>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
              {capa.problemStatement || capa.description || (isAr ? 'لا يوجد بيان للمشكلة مسجل' : 'No problem statement recorded')}
            </p>
          </div>

          {/* Root Cause & 5-Why */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-[#00A3E0]">
                <FileCheck2 className="w-5 h-5" />
                <h4 className="text-base font-bold text-white">
                  {isAr ? 'السبب الجذري المستنتج (Root Cause)' : 'Root Cause Analysis'}
                </h4>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-gray-300 text-sm leading-relaxed">
                {capa.rootCause || (isAr ? 'لم يتم توثيق السبب الجذري بعد' : 'No root cause documented yet')}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <CheckCircle2 className="w-5 h-5" />
                <h4 className="text-base font-bold text-white">
                  {isAr ? 'تحليل لماذا الخماسي (5-Why Analysis)' : '5-Why Analysis'}
                </h4>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-gray-300 text-sm leading-relaxed whitespace-pre-line font-mono text-xs">
                {capa.fiveWhy || (isAr ? 'لم يتم تسجيل تحليل 5-Why' : 'No 5-Why breakdown provided')}
              </div>
            </div>
          </div>

          {/* Corrective & Preventive Action Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/80 border border-orange-500/20 rounded-2xl p-6 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-orange-400">
                <Target className="w-5 h-5" />
                <h4 className="text-base font-bold text-white">
                  {isAr ? 'الإجراء التصحيحي (Corrective Action)' : 'Corrective Action Plan'}
                </h4>
              </div>
              <div className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-xl text-gray-300 text-sm leading-relaxed">
                {capa.correctiveAction || (isAr ? 'لا يوجد إجراء تصحيحي مسجل' : 'No corrective action recorded')}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-teal-500/20 rounded-2xl p-6 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-teal-400">
                <ShieldAlert className="w-5 h-5" />
                <h4 className="text-base font-bold text-white">
                  {isAr ? 'الإجراء الوقائي (Preventive Action)' : 'Preventive Action Plan'}
                </h4>
              </div>
              <div className="bg-teal-500/5 border border-teal-500/20 p-4 rounded-xl text-gray-300 text-sm leading-relaxed">
                {capa.preventiveAction || (isAr ? 'لا يوجد إجراء وقائي مسجل لمنع التكرار' : 'No preventive action recorded')}
              </div>
            </div>
          </div>

          {/* Verification & Effectiveness Block */}
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-white">
                {isAr ? 'نتيجة التحقق من الفاعلية (Effectiveness Status)' : 'Effectiveness Verification'}
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                {isAr ? 'مؤشر قياس مدى فاعلية الإجراءات لمنع تكرار العيب مستقبلاً' : 'Validation whether corrective and preventive actions prevented recurrence'}
              </p>
            </div>
            <div>
              <span className={`px-4 py-2 rounded-xl text-xs font-bold border inline-flex items-center gap-1.5 ${
                capa.effectiveness === 'effective' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                capa.effectiveness === 'ineffective' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {capa.effectiveness === 'effective' ? (isAr ? '✓ فاعل ومطابق للمواصفة' : 'Effective') :
                 capa.effectiveness === 'ineffective' ? (isAr ? '✗ غير فاعل - يتطلب مراجعة' : 'Ineffective') : (isAr ? '⏳ قيد التحقق والمراقبة' : 'Pending Verification')}
              </span>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              className="h-11 px-5 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors inline-flex items-center gap-2 text-sm font-medium"
              onClick={() => navigate('/capa')}
            >
              <ArrowLeft className="w-4 h-4" />
              {isAr ? 'الرجوع لسجلات الكابا' : 'Back to CAPA Workspace'}
            </button>

            <Button
              onClick={handleOpenEdit}
              className="bg-[#00A3E0] hover:bg-[#008cc0] text-slate-950 font-bold rounded-xl h-11 px-6 shadow-lg shadow-[#00A3E0]/20"
            >
              <Edit3 className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
              {isAr ? 'تعديل هذا الإجراء' : 'Edit CAPA'}
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
                    {isAr ? `تعديل إجراء CAPA (${capa.capaNumber || capa.id})` : `Edit CAPA (${capa.id})`}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isAr ? 'تحديث وتوثيق السبب الجذري، الإجراءات، وحالة الفاعلية' : 'Update root cause, actions, and verification status'}
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
                    {isAr ? 'عنوان الإجراء' : 'Title'} *
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
                    {isAr ? 'نوع الإجراء' : 'Type'}
                  </label>
                  <select
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as any })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  >
                    <option value="corrective" className="bg-slate-900">{isAr ? 'تصحيحي (Corrective)' : 'Corrective'}</option>
                    <option value="preventive" className="bg-slate-900">{isAr ? 'وقائي (Preventive)' : 'Preventive'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'مرحلة سير العمل' : 'Status'}
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  >
                    <option value="identified" className="bg-slate-900">{isAr ? 'تم التحديد (Identified)' : 'Identified'}</option>
                    <option value="analysis" className="bg-slate-900">{isAr ? 'تحليل السبب (Analysis)' : 'Analysis'}</option>
                    <option value="action" className="bg-slate-900">{isAr ? 'تنفيذ الإجراء (Action)' : 'Action'}</option>
                    <option value="verification" className="bg-slate-900">{isAr ? 'التحقق (Verification)' : 'Verification'}</option>
                    <option value="closed" className="bg-slate-900">{isAr ? 'مغلق ومكتمل (Closed)' : 'Closed'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'الأولوية' : 'Priority'}
                  </label>
                  <select
                    value={editFormData.priority}
                    onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value as any })}
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
                    {isAr ? 'تاريخ الاستحقاق' : 'Target Date'}
                  </label>
                  <input
                    type="date"
                    value={editFormData.targetDate}
                    onChange={(e) => setEditFormData({ ...editFormData, targetDate: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'المسؤول' : 'Owner'}
                  </label>
                  <input
                    type="text"
                    value={editFormData.owner}
                    onChange={(e) => setEditFormData({ ...editFormData, owner: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'القسم' : 'Department'}
                  </label>
                  <input
                    type="text"
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'رقم عدم المطابقة (Source NCR)' : 'Source NCR'}
                  </label>
                  <input
                    type="text"
                    value={editFormData.sourceNCRId}
                    onChange={(e) => setEditFormData({ ...editFormData, sourceNCRId: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">
                  {isAr ? 'بيان المشكلة (Problem Statement)' : 'Problem Statement'}
                </label>
                <textarea
                  rows={2}
                  value={editFormData.problemStatement}
                  onChange={(e) => setEditFormData({ ...editFormData, problemStatement: e.target.value })}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#00A3E0]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'السبب الجذري (Root Cause)' : 'Root Cause'}
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.rootCause}
                    onChange={(e) => setEditFormData({ ...editFormData, rootCause: e.target.value })}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'تحليل لماذا الخماسي (5-Why)' : '5-Why'}
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.fiveWhy}
                    onChange={(e) => setEditFormData({ ...editFormData, fiveWhy: e.target.value })}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-orange-400 mb-1.5">
                    {isAr ? 'الإجراء التصحيحي (Corrective Action)' : 'Corrective Action Plan'}
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.correctiveAction}
                    onChange={(e) => setEditFormData({ ...editFormData, correctiveAction: e.target.value })}
                    className="w-full p-3 bg-white/5 border border-orange-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-teal-400 mb-1.5">
                    {isAr ? 'الإجراء الوقائي (Preventive Action)' : 'Preventive Action Plan'}
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.preventiveAction}
                    onChange={(e) => setEditFormData({ ...editFormData, preventiveAction: e.target.value })}
                    className="w-full p-3 bg-white/5 border border-teal-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">
                  {isAr ? 'حالة الفاعلية (Effectiveness Status)' : 'Effectiveness'}
                </label>
                <select
                  value={editFormData.effectiveness}
                  onChange={(e) => setEditFormData({ ...editFormData, effectiveness: e.target.value as any })}
                  className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                >
                  <option value="pending" className="bg-slate-900">{isAr ? 'قيد التحقق والمراقبة (Pending)' : 'Pending'}</option>
                  <option value="effective" className="bg-slate-900">{isAr ? 'فاعل ومطابق (Effective)' : 'Effective'}</option>
                  <option value="ineffective" className="bg-slate-900">{isAr ? 'غير فاعل (Ineffective)' : 'Ineffective'}</option>
                </select>
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

export default CAPADetailsPage;
