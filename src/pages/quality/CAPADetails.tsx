import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Calendar, User, Loader2 } from 'lucide-react';
import { PageContainer, PageHeader, PageSection, StatsBar } from '../../components/PageHeader';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { unifiedCapaApi } from '../../api/unified-api';

export function CAPADetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [capa, setCapa] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await unifiedCapaApi.getById(id);
        setCapa(data);
      } catch (e) {
        toast.error('Failed to load CAPA details');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const stats = useMemo(() => {
    if (!capa) return [];
    return [
      { label: 'Status', value: capa.status, change: '', trend: 'neutral' as const },
      { label: 'Priority', value: capa.priority, change: '', trend: 'neutral' as const },
      { label: 'Type', value: capa.type || 'N/A', change: '', trend: 'neutral' as const },
      { label: 'Target Date', value: capa.targetDate ? new Date(capa.targetDate).toLocaleDateString() : 'N/A', change: '', trend: 'neutral' as const },
    ];
  }, [capa]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-[#00A3E0] animate-spin" />
        </div>
      </PageContainer>
    );
  }

  if (!capa) {
    return (
      <PageContainer>
        <PageHeader
          title="CAPA Details"
          subtitle="Record not found"
          breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'CAPA', path: '/quality/records/capa' }, { label: id ?? 'Unknown' }]}
        />
        <PageSection>
          <div className="glass-panel rounded-xl p-6">
            <button
              className="h-11 px-4 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors inline-flex items-center gap-2"
              onClick={() => navigate('/quality/records/capa')}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Records
            </button>
          </div>
        </PageSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={capa.id}
        subtitle="Corrective & Preventive Action"
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'CAPA', path: '/quality/records/capa' }, { label: capa.id }]}
        actions={{
          refresh: () => toast.success('Refreshed'),
          custom: [
            {
              label: 'View Source',
              variant: 'secondary',
              onClick: () => {
                if (capa.sourceNCRId) {
                  navigate(`/quality/records/ncr/${capa.sourceNCRId}`);
                  return;
                }
                toast.info('No linked source record');
              },
            },
          ],
        }}
      />

      <StatsBar stats={stats} />

      <PageSection>
        <div className="glass-panel rounded-xl p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-white font-medium">{capa.title}</p>
              <p className="text-gray-400 text-sm mt-1">{capa.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={capa.status} />
              <PriorityBadge priority={capa.priority} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Calendar className="w-4 h-4" />
                Created
              </div>
              <div className="text-gray-200 mt-1">{new Date(capa.createdAt).toLocaleDateString()}</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Calendar className="w-4 h-4" />
                Target
              </div>
              <div className="text-gray-200 mt-1">{capa.targetDate ? new Date(capa.targetDate).toLocaleDateString() : 'N/A'}</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <User className="w-4 h-4" />
                Owner
              </div>
              <div className="text-gray-200 mt-1">{capa.owner || 'Unassigned'}</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button
              className="h-10 px-4 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors inline-flex items-center gap-2"
              onClick={() => navigate('/quality/records/capa')}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      </PageSection>
    </PageContainer>
  );
}

export default CAPADetailsPage;
