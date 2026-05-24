// QMS Enterprise 4.0 - FMEA Page
import { useState, useEffect } from 'react';
import { PageHeader, PageContainer, PageSection, StatsBar } from '../../components/PageHeader';
import DynamicFormRenderer from '../../components/DynamicFormRenderer';
import { 
  Search,
  Plus,
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { fmeaApi, type FmeaData } from '../../api/fmea';

interface FMEAItem {
  id: string;
  process: string;
  failureMode: string;
  failureEffect: string;
  severity: number;
  occurrence: number;
  detection: number;
  rpn: number;
  actions: string;
  owner: string;
  status: 'draft' | 'review' | 'approved';
}

export const mockFMEAs: FMEAItem[] = [];

const statusConfig = {
  'draft': 'bg-gray-500/20 text-gray-400',
  'review': 'bg-yellow-500/20 text-yellow-400',
  'approved': 'bg-green-500/20 text-green-400'
};

function getRPNColor(rpn: number): string {
  if (rpn >= 100) return 'text-red-400';
  if (rpn >= 50) return 'text-yellow-400';
  return 'text-green-400';
}

function getScoreColor(score: number): string {
  if (score >= 8) return 'bg-red-500/20 text-red-400';
  if (score >= 5) return 'bg-yellow-500/20 text-yellow-400';
  return 'bg-green-500/20 text-green-400';
}

export function FMEAPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [fmeas, setFmeas] = useState<FMEAItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFmea, setEditingFmea] = useState<FMEAItem | null>(null);
  const navigate = useNavigate();
  const params = useParams();

  // Load data from API
  useEffect(() => {
    loadFmeas();
  }, []);

  const loadFmeas = async () => {
    try {
      setIsLoading(true);
      const response = await fmeaApi.getAll();
      // Transform API data to match FMEAItem interface
      const transformed = response.data.map((fmea: any) => ({
        id: fmea.id,
        process: fmea.processStep || fmea.process,
        failureMode: fmea.failureMode,
        failureEffect: fmea.potentialEffect || fmea.effect,
        severity: fmea.severityRating || fmea.severity || 1,
        occurrence: fmea.occurrenceRating || fmea.occurrence || 1,
        detection: fmea.detectionRating || fmea.detection || 1,
        rpn: fmea.rpn || (fmea.severityRating || 1) * (fmea.occurrenceRating || 1) * (fmea.detectionRating || 1),
        actions: fmea.recommendedAction || fmea.actions,
        owner: fmea.ownerUser?.name || fmea.owner || 'Unassigned',
        status: fmea.status?.toLowerCase() || 'draft',
        ...fmea
      }));
      setFmeas(transformed);
    } catch (err) {
      console.warn('API unavailable; keeping empty state:', err);
      // Keep an empty state when backend is not running
      setFmeas(mockFMEAs);
      toast.info('Backend unavailable - no records loaded');
    } finally {
      setIsLoading(false);
    }
  };

  // Support deep-link /fmea/:id by opening the modal
  useEffect(() => {
    const id = params.id;
    if (!id) return;
    const found = fmeas.find((f) => f.id === id);
    if (found) {
      setEditingFmea(found);
      setIsFormOpen(true);
    }
  }, [params.id, fmeas]);

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    try {
      const payload: FmeaData = {
        title: (data.title as string) || (data.process as string) || 'FMEA',
        description: (data.description as string) || '',
        type: (data.type as string) || 'process',
        plantId: (data.plantId as string) || '1',
        departmentId: data.departmentId as string,
        metadata: data,
      };

      if (editingFmea) {
        await fmeaApi.update(editingFmea.id, payload as any);
        toast.success('FMEA updated successfully');
      } else {
        await fmeaApi.create(payload as any);
        toast.success('FMEA created successfully');
      }

      await loadFmeas();
      setIsFormOpen(false);
      setEditingFmea(null);
      if (params.id) {
        navigate('/fmea', { replace: true });
      }
    } catch (e: any) {
      toast.error(editingFmea ? 'Failed to update FMEA' : 'Failed to create FMEA');
    }
  };

  const stats = [
    { label: 'Active FMEAs', value: fmeas.filter((fmea) => fmea.status !== 'approved').length, change: '0', trend: 'neutral' as const },
    { label: 'High Risk (RPN>100)', value: fmeas.filter((fmea) => fmea.rpn > 100).length, change: '0', trend: 'neutral' as const },
    { label: 'Under Review', value: fmeas.filter((fmea) => fmea.status === 'review').length, change: '0', trend: 'neutral' as const },
    { label: 'Avg RPN', value: fmeas.length ? Math.round(fmeas.reduce((sum, fmea) => sum + Number(fmea.rpn || 0), 0) / fmeas.length) : 0, change: '0', trend: 'neutral' as const }
  ];

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title="FMEA Analysis"
          subtitle="Failure Mode and Effects Analysis for risk management"
          breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'FMEA' }]}
          actions={{
            create: () => {
              setEditingFmea(null);
              setIsFormOpen(true);
            },
            refresh: loadFmeas,
          }}
        />
        <div className="p-8 text-center text-gray-400">Loading FMEA records...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="FMEA Analysis"
        subtitle="Failure Mode and Effects Analysis for risk management"
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'FMEA' }]}
        actions={{
          create: () => {
            setEditingFmea(null);
            setIsFormOpen(true);
          },
          refresh: loadFmeas
        }}
      />

      <StatsBar stats={stats} />

      <PageSection>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search FMEA records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500"
            />
          </div>
          <button
            className="h-11 px-4 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052a3] flex items-center gap-2"
            onClick={() => {
              setEditingFmea(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            New FMEA
          </button>
        </div>

        <div className="glass-panel rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">ID</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Process</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Failure Mode</th>
                <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-4">S</th>
                <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-4">O</th>
                <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-4">D</th>
                <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-4">RPN</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Actions</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {fmeas.map((fmea) => (
                <tr
                  key={fmea.id}
                  className="hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => {
                    setEditingFmea(fmea);
                    setIsFormOpen(true);
                  }}
                >
                  <td className="px-6 py-4">
                    <span className="text-[#00A3E0] font-mono text-sm">{fmea.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white text-sm">{fmea.process}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white text-sm">{fmea.failureMode}</p>
                    <p className="text-gray-400 text-xs">{fmea.failureEffect}</p>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-medium ${getScoreColor(fmea.severity)}`}>
                      {fmea.severity}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-medium ${getScoreColor(fmea.occurrence)}`}>
                      {fmea.occurrence}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-medium ${getScoreColor(fmea.detection)}`}>
                      {fmea.detection}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`text-lg font-bold ${getRPNColor(fmea.rpn)}`}>
                      {fmea.rpn}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-300 text-sm">{fmea.actions}</p>
                    <p className="text-gray-500 text-xs">Owner: {fmea.owner}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[fmea.status]}`}>
                      {fmea.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isFormOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-[#0a0a0f]">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {editingFmea ? 'Edit FMEA' : 'Create New FMEA'}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {editingFmea ? 'Update failure mode analysis' : 'Create a new failure mode analysis'}
                  </p>
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
                  formType="fmea"
                  initialValues={(editingFmea || {}) as Record<string, unknown>}
                  onSubmit={handleFormSubmit}
                  readOnly={false}
                  showSubmitButton={true}
                  submitLabel={editingFmea ? 'Update FMEA' : 'Create FMEA'}
                />
              </div>
            </div>
          </div>
        )}
      </PageSection>
    </PageContainer>
  );
}

export default FMEAPage;
