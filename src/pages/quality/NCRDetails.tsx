import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Calendar, User, Loader2 } from 'lucide-react';
import { PageContainer, PageHeader, PageSection, StatsBar } from '../../components/PageHeader';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { unifiedNcrApi } from '../../api/unified-api';

export function NCRDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [ncr, setNcr] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await unifiedNcrApi.getById(id);
        setNcr(data);
      } catch (e) {
        toast.error('Failed to load NCR details');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const stats = useMemo(() => {
    if (!ncr) return [];
    return [
      { label: 'Status', value: ncr.status, change: '', trend: 'neutral' as const },
      { label: 'Priority', value: ncr.priority, change: '', trend: 'neutral' as const },
      { label: 'Due Date', value: ncr.dueDate || 'N/A', change: '', trend: 'neutral' as const },
      { label: 'Assigned To', value: ncr.assignedTo || 'Unassigned', change: '', trend: 'neutral' as const },
    ];
  }, [ncr]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-[#00A3E0] animate-spin" />
        </div>
      </PageContainer>
    );
  }

  if (!ncr) {
    return (
      <PageContainer>
        <PageHeader
          title="NCR Details"
          subtitle="Record not found"
          breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'NCR', path: '/quality/records/ncr' }, { label: id ?? 'Unknown' }]}
        />
        <PageSection>
          <div className="glass-panel rounded-xl p-6">
            <button
              className="h-11 px-4 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors inline-flex items-center gap-2"
              onClick={() => navigate('/quality/records/ncr')}
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
        title={ncr.id}
        subtitle="Non-Conformance Report"
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'NCR', path: '/quality/records/ncr' }, { label: ncr.id }]}
        actions={{
          refresh: () => toast.success('Refreshed'),
          custom: [
            {
              label: 'Open CAPA',
              variant: 'secondary',
              onClick: () => navigate(`/quality/records/capa?create=1&source=${ncr.id}`),
            },
          ],
        }}
      />

      <StatsBar stats={stats} />

      <PageSection>
        <div className="glass-panel rounded-xl p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-white font-medium">{ncr.title}</p>
              <p className="text-gray-400 text-sm mt-1">{ncr.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={ncr.status} />
              <PriorityBadge priority={ncr.priority} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Calendar className="w-4 h-4" />
                Created
              </div>
              <div className="text-gray-200 mt-1">{new Date(ncr.createdAt).toLocaleDateString()}</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Calendar className="w-4 h-4" />
                Due
              </div>
              <div className="text-gray-200 mt-1">{ncr.dueDate ? new Date(ncr.dueDate).toLocaleDateString() : 'N/A'}</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <User className="w-4 h-4" />
                Assigned
              </div>
              <div className="text-gray-200 mt-1">{ncr.assignedTo || 'Unassigned'}</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button
              className="h-10 px-4 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors inline-flex items-center gap-2"
              onClick={() => navigate('/quality/records/ncr')}
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

export default NCRDetailsPage;
