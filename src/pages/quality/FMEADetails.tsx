import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, FileText } from 'lucide-react';
import { PageContainer, PageHeader, PageSection, StatsBar } from '../../components/PageHeader';
import { mockFMEAs } from './FMEA';

export function FMEADetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const fmea = useMemo(() => mockFMEAs.find((x) => x.id === id), [id]);

  const stats = useMemo(() => {
    if (!fmea) return [];
    return [
      { label: 'Severity', value: fmea.severity, change: '', trend: 'neutral' as const },
      { label: 'Occurrence', value: fmea.occurrence, change: '', trend: 'neutral' as const },
      { label: 'Detection', value: fmea.detection, change: '', trend: 'neutral' as const },
      { label: 'RPN', value: fmea.rpn, change: '', trend: fmea.rpn >= 100 ? ('up' as const) : ('neutral' as const) },
    ];
  }, [fmea]);

  if (!id || !fmea) {
    return (
      <PageContainer>
        <PageHeader
          title="FMEA Details"
          subtitle="Record not found"
          breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'FMEA' }, { label: id ?? 'Unknown' }]}
          actions={{
            create: () => navigate('/fmea'),
            refresh: () => toast.info('Refresh', { description: 'Reload coming soon' }),
          }}
        />

        <PageSection>
          <div className="glass-panel rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4 text-gray-300">
              <FileText className="w-5 h-5 text-[#00A3E0]" />
              <span className="text-sm">No record found for</span>
              <span className="font-mono text-sm text-[#00A3E0]">{id}</span>
            </div>

            <button
              className="h-11 px-4 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors inline-flex items-center gap-2"
              onClick={() => navigate('/fmea')}
              type="button"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to FMEA
            </button>
          </div>
        </PageSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={fmea.id}
        subtitle="Failure Mode and Effects Analysis"
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'FMEA', path: '/fmea' }, { label: fmea.id }]}
        actions={{
          create: () => toast.info('Create', { description: 'Create flow coming soon' }),
          refresh: () => toast.success('Refreshed', { description: 'FMEA details refreshed' }),
        }}
      />

      <StatsBar stats={stats} />

      <PageSection>
        <div className="glass-panel rounded-xl p-6 space-y-6">
          <div>
            <p className="text-xs text-gray-500">Process</p>
            <p className="text-white font-medium">{fmea.process}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-500">Failure Mode</p>
              <p className="text-gray-200">{fmea.failureMode}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Failure Effect</p>
              <p className="text-gray-200">{fmea.failureEffect}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500">Recommended Actions</p>
            <p className="text-gray-200">{fmea.actions}</p>
            <p className="text-gray-500 text-xs mt-1">Owner: {fmea.owner}</p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button
              className="h-10 px-4 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors inline-flex items-center gap-2"
              onClick={() => navigate('/fmea')}
              type="button"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              className="h-10 px-4 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052a3] transition-colors"
              onClick={() => {
                const params = new URLSearchParams();
                params.set('create', '1');
                params.set('source', fmea.id);
                params.set('title', `CAPA for ${fmea.id}`);
                params.set('problemStatement', fmea.failureMode);
                navigate(`/capa?${params.toString()}`);
              }}
              type="button"
            >
              Create CAPA
            </button>
          </div>
        </div>
      </PageSection>
    </PageContainer>
  );
}

export default FMEADetailsPage;
