import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { PageContainer, PageHeader, PageSection, StatsBar } from '../../components/PageHeader';
import { mockControlPlans } from './ControlPlan';

export function ControlPlanDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const cp = useMemo(() => mockControlPlans.find((x) => x.id === id), [id]);

  const asText = (value: unknown) => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  const stats = useMemo(() => {
    if (!cp) return [];
    return [
      { label: 'Product', value: asText((cp as any).product ?? (cp as any).partName ?? (cp as any).productCharacteristic), change: '', trend: 'neutral' as const },
      { label: 'Process', value: asText((cp as any).process ?? (cp as any).operationName ?? (cp as any).processNumber), change: '', trend: 'neutral' as const },
      { label: 'Classification', value: asText((cp as any).classification ?? (cp as any).controlPlanType ?? (cp as any).status), change: '', trend: 'neutral' as const },
      { label: 'Frequency', value: asText((cp as any).frequency ?? (cp as any).sampleSize), change: '', trend: 'neutral' as const },
    ];
  }, [cp]);

  if (!id || !cp) {
    return (
      <PageContainer>
        <PageHeader
          title="Control Plan Details"
          subtitle="Record not found"
          breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'Control Plan' }, { label: id ?? 'Unknown' }]}
          actions={{
            create: () => navigate('/control-plan'),
            refresh: () => toast.info('Refresh', { description: 'Reload coming soon' }),
          }}
        />

        <PageSection>
          <div className="glass-panel rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4 text-gray-300">
              <ClipboardList className="w-5 h-5 text-[#00A3E0]" />
              <span className="text-sm">No record found for</span>
              <span className="font-mono text-sm text-[#00A3E0]">{id}</span>
            </div>

            <button
              className="h-11 px-4 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors inline-flex items-center gap-2"
              onClick={() => navigate('/control-plan')}
              type="button"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Control Plans
            </button>
          </div>
        </PageSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={cp.id}
        subtitle="Process controls and reaction plans"
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'Control Plan', path: '/control-plan' }, { label: cp.id }]}
        actions={{
          create: () => toast.info('Edit', { description: 'Edit control plan coming soon' }),
          refresh: () => toast.success('Refreshed', { description: 'Control plan refreshed' }),
        }}
      />

      <StatsBar stats={stats} />

      <PageSection>
        <div className="glass-panel rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-500">Characteristic</p>
              <p className="text-white font-medium">{asText((cp as any).characteristics ?? (cp as any).productCharacteristic)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Specification</p>
              <p className="text-gray-200">{asText((cp as any).specification)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Measurement</p>
              <p className="text-gray-200">{asText((cp as any).measurement ?? (cp as any).evaluationMethod)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Sample Size</p>
              <p className="text-gray-200">{asText((cp as any).sampleSize)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-500">Control Method</p>
              <p className="text-gray-200">{asText((cp as any).controlMethod ?? (cp as any).controlMethodType)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Reaction Plan</p>
              <p className="text-red-300">{asText((cp as any).reactionPlan ?? (cp as any).reactionPlanDesc)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button
              className="h-10 px-4 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors inline-flex items-center gap-2"
              onClick={() => navigate('/control-plan')}
              type="button"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              className="h-10 px-4 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052a3] transition-colors"
              onClick={() => toast.info('Export', { description: 'Export control plan coming soon' })}
              type="button"
            >
              Export
            </button>
          </div>
        </div>
      </PageSection>
    </PageContainer>
  );
}

export default ControlPlanDetailsPage;
