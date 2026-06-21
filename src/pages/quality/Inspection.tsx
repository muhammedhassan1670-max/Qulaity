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
  MoreHorizontal
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

const mockInspections: Inspection[] = [];

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
    } catch (e) {
      setInspections(mockInspections);
      toast.info('Backend unavailable - no records loaded');
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
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
            className="h-11 px-4 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052a3] flex items-center gap-2"
            onClick={() => {
              setEditingInspection(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            New Inspection
          </button>
        </div>

        <div className="glass-panel rounded-xl overflow-hidden">
          <table className="w-full">
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {isFormOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-[#0a0a0f]">
                <div>
                  <h2 className="text-xl font-semibold text-white">{editingInspection ? 'Edit Inspection' : 'New Inspection'}</h2>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6">
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
