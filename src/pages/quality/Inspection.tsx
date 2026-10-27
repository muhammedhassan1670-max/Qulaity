// QMS Enterprise 4.0 - Inspection Page
import { useEffect, useState } from 'react';
import { PageHeader, PageContainer, PageSection, StatsBar } from '../../components/PageHeader';
import DynamicFormRenderer from '../../components/DynamicFormRenderer';
import QualityRelationshipManager from '../../components/QualityRelationshipManager';
import { 
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  Building,
  ClipboardList,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { inspectionApi, type InspectionData } from '../../api/inspections';

interface Inspection {
  id: string;
  type: 'incoming' | 'in-process' | 'final' | 'shipping';
  product: string;
  batch: string;
  inspectedBy: string;
  date: string;
  result: 'pass' | 'fail' | 'pending';
  sampleSize: number;
  defectCount: number;
  inspectionPoints: number;
  [key: string]: unknown;
}

const DEFAULT_INSPECTIONS: Inspection[] = [
  {
    id: 'INS-IQC-001',
    type: 'incoming',
    product: 'Cold Rolled Steel Coil 1.5mm',
    batch: 'LOT-STL-9042',
    inspectedBy: 'Eng. Ahmed QC',
    date: new Date().toISOString().split('T')[0],
    result: 'fail',
    sampleSize: 50,
    defectCount: 4,
    inspectionPoints: 6,
  },
  {
    id: 'INS-IPQC-002',
    type: 'in-process',
    product: 'Bracket Assembly BR-200',
    batch: 'LOT-PRD-7711',
    inspectedBy: 'Mahmoud Inspector',
    date: new Date().toISOString().split('T')[0],
    result: 'pass',
    sampleSize: 32,
    defectCount: 0,
    inspectionPoints: 8,
  },
  {
    id: 'INS-OQC-003',
    type: 'final',
    product: 'Gearbox Housing Assy',
    batch: 'LOT-FIN-1029',
    inspectedBy: 'Sara Quality',
    date: new Date().toISOString().split('T')[0],
    result: 'pass',
    sampleSize: 20,
    defectCount: 0,
    inspectionPoints: 10,
  },
];

function recordSupplierDefectLink(productName: string, defectCount: number) {
  try {
    for (const key of ['qms_local_suppliers', 'qms_local_supplier']) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const suppliers = JSON.parse(raw);
        if (Array.isArray(suppliers) && suppliers.length > 0) {
          const updated = suppliers.map((sup: any) => {
            const matches = !productName ||
              sup.name?.toLowerCase().includes(productName.toLowerCase()) ||
              sup.category?.toLowerCase().includes(productName.toLowerCase());
            if (matches) {
              const currentNc = Number(sup.ncCount || 0) + 1;
              const currentPerf = Math.max(50, Number(sup.qualityPerformance || 95) - (defectCount > 0 ? 5 : 2));
              return {
                ...sup,
                ncCount: currentNc,
                qualityPerformance: currentPerf,
                status: currentPerf < 70 ? 'conditional' : sup.status,
              };
            }
            return sup;
          });
          localStorage.setItem(key, JSON.stringify(updated));
        }
      }
    }
  } catch (err) {
    console.warn('Failed to update supplier score from inspection failure:', err);
  }
}

const typeConfig = {
  'incoming': 'bg-blue-500/20 text-blue-400',
  'in-process': 'bg-yellow-500/20 text-yellow-400',
  'final': 'bg-purple-500/20 text-purple-400',
  'shipping': 'bg-green-500/20 text-green-400'
};

const resultConfig = {
  'pass': { color: 'bg-green-500/20 text-green-400', icon: CheckCircle2 },
  'fail': { color: 'bg-red-500/20 text-red-400', icon: XCircle },
  'pending': { color: 'bg-yellow-500/20 text-yellow-400', icon: Clock }
};

export function InspectionPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);
  const navigate = useNavigate();
  const params = useParams();

  const loadInspections = async () => {
    try {
      setIsLoading(true);
      const response = await inspectionApi.getAll();
      const transformed = response.data.map((ins: any) => ({
        id: ins.id,
        type: String(ins.type || 'incoming').toLowerCase().replace('_', '-') as any,
        product: ins.productName || ins.product || '',
        batch: ins.batchNumber || ins.batch || '',
        inspectedBy: ins.inspectedBy || 'Unassigned',
        date: (ins.inspectionDate || ins.createdAt || new Date().toISOString()).split('T')[0],
        result: String(ins.result || 'pending').toLowerCase() as any,
        sampleSize: ins.sampleSize ?? 0,
        defectCount: ins.defectCount ?? 0,
        inspectionPoints: ins.inspectionPoints ?? 0,
        ...ins,
      }));
      setInspections(transformed);
      try {
        localStorage.setItem('qms_local_inspections', JSON.stringify(transformed));
      } catch {}
    } catch (e) {
      try {
        const local = localStorage.getItem('qms_local_inspections');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setInspections(parsed);
            return;
          }
        }
      } catch {}
      setInspections(DEFAULT_INSPECTIONS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInspections();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const id = params.id;
    if (!id) return;
    const found = inspections.find((i) => i.id === id);
    if (found) {
      setEditingInspection(found);
      setIsFormOpen(true);
    }
  }, [params.id, inspections, isLoading]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-72">
          <div className="text-gray-400">Loading inspections...</div>
        </div>
      </PageContainer>
    );
  }

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    try {
      const payload: InspectionData = {
        type: (data.type as string) || 'incoming',
        productName: (data.productName as string) || (data.product as string) || '',
        batchNumber: (data.batchNumber as string) || (data.batch as string) || undefined,
        inspectedBy: data.inspectedBy as string,
        inspectionDate: (data.inspectionDate as string) || (data.date as string),
        result: (data.result as string) || 'pending',
        sampleSize: (data.sampleSize as number) || 0,
        defectCount: (data.defectCount as number) || 0,
        inspectionPoints: (data.inspectionPoints as number) || 0,
        metadata: data,
      };

      if (editingInspection) {
        await inspectionApi.update(editingInspection.id, payload as any);
        toast.success('Inspection updated');
      } else {
        await inspectionApi.create(payload as any);
        toast.success('Inspection created');
      }

      if (payload.result === 'fail' && payload.type === 'incoming') {
        recordSupplierDefectLink(payload.productName || (payload as any).product, payload.defectCount || 1);
        toast.info('تم تحديث تقييم جودة المورد آلياً بناءً على حيود فحص الوارد');
      }

      await loadInspections();
      setIsFormOpen(false);
      setEditingInspection(null);
      if (params.id) {
        navigate('/inspection', { replace: true });
      }
    } catch (e) {
      toast.error(editingInspection ? 'Failed to update inspection' : 'Failed to create inspection');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this inspection?')) return;
    try {
      await inspectionApi.delete(id);
      await loadInspections();
      toast.success('Inspection deleted');
    } catch (e) {
      toast.error('Failed to delete inspection');
    }
  };

  const stats = [
    { label: 'Today Inspected', value: inspections.filter((inspection) => inspection.date === new Date().toISOString().split('T')[0]).length, change: '0', trend: 'neutral' as const },
    { label: 'Pass Rate', value: inspections.length ? `${Math.round((inspections.filter((inspection) => inspection.result === 'pass').length / inspections.length) * 100)}%` : '0%', change: '0%', trend: 'neutral' as const },
    { label: 'Pending', value: inspections.filter((inspection) => inspection.result === 'pending').length, change: '0', trend: 'neutral' as const },
    { label: 'Rejected', value: inspections.filter((inspection) => inspection.result === 'fail').length, change: '0', trend: 'neutral' as const }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Inspection Management"
        subtitle="Incoming, in-process, and final inspection tracking"
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'Inspection' }]}
        actions={{
          create: () => {
            setEditingInspection(null);
            setIsFormOpen(true);
          },
          refresh: loadInspections
        }}
      />

      <StatsBar stats={stats} />

      <PageSection>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search inspections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500"
            />
          </div>
          <button
            className="h-11 px-4 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052a3] flex items-center justify-center gap-2 w-full sm:w-auto"
            onClick={() => {
              setEditingInspection(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            <span>New Inspection</span>
          </button>
        </div>

        {/* Mobile Cards View */}
        <div className="block sm:hidden space-y-3">
          {inspections.map((ins) => {
            const ResultIcon = resultConfig[ins.result].icon;
            return (
              <div
                key={ins.id}
                onClick={() => {
                  setEditingInspection(ins);
                  setIsFormOpen(true);
                }}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3 hover:border-white/20 transition-all cursor-pointer active:scale-[0.99]"
              >
                {/* Header: ID, Type & Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[#00A3E0] font-mono font-bold text-xs bg-[#00A3E0]/10 px-2 py-0.5 rounded-lg border border-[#00A3E0]/20">
                      {ins.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${typeConfig[ins.type]}`}>
                      {ins.type}
                    </span>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${resultConfig[ins.result].color}`}>
                    <ResultIcon className="w-3.5 h-3.5" />
                    <span className="capitalize">{ins.result}</span>
                  </span>
                </div>

                {/* Product & Batch */}
                <div>
                  <h4 className="text-white font-bold text-sm leading-tight">{ins.product}</h4>
                  <p className="text-gray-400 text-xs mt-1">
                    <span className="text-white/40">Lot / Batch:</span> <span className="font-mono text-gray-300">{ins.batch}</span>
                  </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs">
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase font-bold">Samples / Defects</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-white font-medium">{ins.sampleSize} عينة</span>
                      {ins.defectCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 text-[10px] font-bold">
                          {ins.defectCount} عيوب
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase font-bold">Inspector</span>
                    <span className="text-gray-200 mt-0.5 block truncate font-medium">{ins.inspectedBy}</span>
                  </div>
                </div>

                {/* Actions & Date */}
                <div className="flex items-center justify-between pt-1 text-xs" onClick={(e) => e.stopPropagation()}>
                  <span className="text-gray-500 text-[11px]">{ins.date}</span>
                  {ins.result === 'fail' ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/ncr?create=1&title=${encodeURIComponent(`فشل فحص وارد: ${ins.product} (${ins.batch})`)}&defectType=Incoming Material&line=Incoming Inspection&qty=${ins.defectCount || 1}&lot=${encodeURIComponent(ins.batch)}&desc=${encodeURIComponent(`فشل فحص الجودة للخامة/المنتج [${ins.product}] - تشغيلة رقم [${ins.batch}]. عدد العينات: ${ins.sampleSize}، عدد العيوب: ${ins.defectCount}. المسؤول: ${ins.inspectedBy}`)}&severity=major`);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40 transition flex items-center gap-1"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                        <span>فتح NCR</span>
                      </button>
                      {ins.type === 'incoming' && (
                        <button
                          type="button"
                          onClick={() => navigate('/supplier-quality')}
                          className="px-2 py-1 rounded-lg text-xs font-bold bg-[#00A3E0]/20 text-[#00A3E0] hover:bg-[#00A3E0]/30 border border-[#00A3E0]/40 transition flex items-center gap-1"
                        >
                          <Building className="w-3 h-3" />
                          <span>المورد</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-emerald-400/80 font-bold">مطابق للجودة ✓</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block glass-panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto w-full no-scrollbar">
            <table className="w-full min-w-[720px]">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">ID</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Type</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Product</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Batch</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Result</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Sample/Defects</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Inspected By</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Date</th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Actions / تصعيد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {inspections.map((ins) => {
                const ResultIcon = resultConfig[ins.result].icon;
                return (
                  <tr
                    key={ins.id}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => {
                      setEditingInspection(ins);
                      setIsFormOpen(true);
                    }}
                  >
                    <td className="px-6 py-4">
                      <span className="text-[#00A3E0] font-mono text-sm">{ins.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeConfig[ins.type]}`}>
                        {ins.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white text-sm">{ins.product}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300 text-sm">{ins.batch}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${resultConfig[ins.result].color}`}>
                        <ResultIcon className="w-3.5 h-3.5" />
                        {ins.result}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-300 text-sm">{ins.sampleSize}</span>
                        {ins.defectCount > 0 && (
                          <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                            {ins.defectCount} defects
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300 text-sm">{ins.inspectedBy}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400 text-sm">{ins.date}</span>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {ins.result === 'fail' ? (
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              navigate(`/ncr?create=1&title=${encodeURIComponent(`فشل فحص وارد: ${ins.product} (${ins.batch})`)}&defectType=Incoming Material&line=Incoming Inspection&qty=${ins.defectCount || 1}&lot=${encodeURIComponent(ins.batch)}&desc=${encodeURIComponent(`فشل فحص الجودة للخامة/المنتج [${ins.product}] - تشغيلة رقم [${ins.batch}]. عدد العينات: ${ins.sampleSize}، عدد العيوب: ${ins.defectCount}. المسؤول: ${ins.inspectedBy}`)}&severity=major`);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40 transition flex items-center gap-1"
                            title="فتح تقرير عدم مطابقة (NCR)"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                            <span>فتح NCR</span>
                          </button>

                          {ins.type === 'incoming' && (
                            <button
                              type="button"
                              onClick={() => navigate('/supplier-quality')}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#00A3E0]/20 text-[#00A3E0] hover:bg-[#00A3E0]/30 border border-[#00A3E0]/40 transition flex items-center gap-1"
                              title="تقييم وسجل المورد"
                            >
                              <Building className="w-3.5 h-3.5" />
                              <span>المورد</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-400/60 font-medium">مطابق</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>

        {isFormOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-5xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-[#0a0a0f]">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-white">{editingInspection ? 'Edit Inspection' : 'New Inspection'}</h2>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 sm:p-6">
                {editingInspection && editingInspection.result === 'fail' && (
                  <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-950/30 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-red-400" />
                          <span>إجراءات التدخل لعدم المطابقة (IQC / Inspection Escalation)</span>
                        </h4>
                        <p className="text-xs text-white/60 mt-0.5">
                          هذه الشحنة/الدفعة غير مطابقة. يمكنك تصعيدها فوراً لتقرير عدم مطابقة NCR أو إصدار SCAR للمورد
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIsFormOpen(false);
                            navigate(`/ncr?create=1&title=${encodeURIComponent(`فشل فحص وارد: ${editingInspection.product} (${editingInspection.batch})`)}&defectType=Incoming Material&line=Incoming Inspection&qty=${editingInspection.defectCount || 1}&lot=${encodeURIComponent(editingInspection.batch)}&desc=${encodeURIComponent(`فشل فحص الجودة للخامة/المنتج [${editingInspection.product}] - تشغيلة رقم [${editingInspection.batch}]. عدد العينات: ${editingInspection.sampleSize}، عدد العيوب: ${editingInspection.defectCount}. المسؤول: ${editingInspection.inspectedBy}`)}&severity=major`);
                          }}
                          className="px-3 py-2 rounded-xl text-xs font-black bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40 transition flex items-center gap-1.5"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                          <span>فتح تقرير NCR</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsFormOpen(false);
                            navigate(`/8d?create=1&title=${encodeURIComponent(`فشل فحص خامة: ${editingInspection.product} (${editingInspection.batch})`)}&product=${encodeURIComponent(editingInspection.product)}&lot=${encodeURIComponent(editingInspection.batch)}&desc=${encodeURIComponent(`إجراء تصحيحي لحل المشكلة الجذرية إثر فشل فحص الشحنة [${editingInspection.batch}] لمنتج [${editingInspection.product}]. نسبة العيوب: ${editingInspection.defectCount}/${editingInspection.sampleSize}.`)}`);
                          }}
                          className="px-3 py-2 rounded-xl text-xs font-black bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition flex items-center gap-1.5"
                        >
                          <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
                          <span>إصدار 8D للمورد</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsFormOpen(false);
                            navigate('/supplier-quality');
                          }}
                          className="px-3 py-2 rounded-xl text-xs font-black bg-[#00A3E0]/20 text-[#00A3E0] hover:bg-[#00A3E0]/30 border border-[#00A3E0]/40 transition flex items-center gap-1.5"
                        >
                          <Building className="w-3.5 h-3.5" />
                          <span>سجل الموردين</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <DynamicFormRenderer
                  formType="inspection"
                  initialValues={(editingInspection || {}) as Record<string, unknown>}
                  onSubmit={handleFormSubmit}
                  readOnly={false}
                  showSubmitButton={true}
                  submitLabel={editingInspection ? 'Update Inspection' : 'Create Inspection'}
                />

                {editingInspection && (
                  <div className="mt-8 space-y-8 border-t border-white/10 pt-6">
                    <QualityRelationshipManager
                      currentType="inspection"
                      currentId={editingInspection.id}
                      currentLabel={`Inspection: ${editingInspection.product || editingInspection.id}`}
                      onChanged={loadInspections}
                    />

                    <div className="flex justify-end">
                      <button
                        className="h-10 px-4 bg-red-600/80 text-white rounded-lg hover:bg-red-600"
                        onClick={() => handleDelete(editingInspection.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </PageSection>
    </PageContainer>
  );
}

export default InspectionPage;
