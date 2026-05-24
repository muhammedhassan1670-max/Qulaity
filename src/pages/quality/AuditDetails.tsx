import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ClipboardList, Calendar, Users, Loader2 } from 'lucide-react';
import { PageContainer, PageHeader, PageSection, StatsBar } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { unifiedAuditApi } from '../../api/unified-api';

export function AuditDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [audit, setAudit] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await unifiedAuditApi.getById(id);
        setAudit(data);
      } catch (e) {
        toast.error('Failed to load audit details');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const stats = useMemo(() => {
    if (!audit) return [];
    return [
      { label: 'Type', value: audit.type || 'N/A', change: '', trend: 'neutral' as const },
      { label: 'Status', value: audit.status, change: '', trend: 'neutral' as const },
      { label: 'Findings', value: audit.findings || 0, change: '', trend: 'neutral' as const },
      { label: 'NC Count', value: audit.ncCount || 0, change: '', trend: 'neutral' as const },
    ];
  }, [audit]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-[#00A3E0] animate-spin" />
        </div>
      </PageContainer>
    );
  }

  if (!audit) {
    return (
      <PageContainer>
        <PageHeader
          title="Audit Details"
          subtitle="Record not found"
          breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'Audit', path: '/quality/hub/audit' }, { label: id ?? 'Unknown' }]}
        />
        <PageSection>
          <div className="glass-panel rounded-xl p-6">
            <button
              className="h-11 px-4 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors inline-flex items-center gap-2"
              onClick={() => navigate('/quality/hub/audit')}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Hub
            </button>
          </div>
        </PageSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={audit.id}
        subtitle="Audit record and scope"
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'Audit', path: '/quality/hub/audit' }, { label: audit.id }]}
        actions={{
          refresh: () => toast.success('Refreshed'),
          custom: [
            {
              label: 'Generate Report',
              variant: 'secondary',
              onClick: () => toast.info('Feature coming soon'),
            },
          ],
        }}
      />

      <StatsBar stats={stats} />

      <PageSection>
        <div className="glass-panel rounded-xl p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-white font-medium">{audit.title}</p>
              {audit.description && <p className="text-gray-400 text-sm mt-1">{audit.description}</p>}
              <p className="text-gray-500 text-sm mt-1">Scope: {audit.scope || 'N/A'}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={audit.status} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Calendar className="w-4 h-4" />
                Scheduled
              </div>
              <div className="text-gray-200 mt-1">{audit.scheduledDate ? new Date(audit.scheduledDate).toLocaleDateString() : 'TBD'}</div>
              {audit.duration && <div className="text-gray-500 text-xs mt-1">Duration: {audit.duration}</div>}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Users className="w-4 h-4" />
                Auditor
              </div>
              <div className="text-gray-200 mt-1">{audit.auditor || 'Unassigned'}</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <ClipboardList className="w-4 h-4" />
                Auditee
              </div>
              <div className="text-gray-200 mt-1">{audit.auditee || 'N/A'}</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button
              className="h-10 px-4 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors inline-flex items-center gap-2"
              onClick={() => navigate('/quality/hub/audit')}
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

export default AuditDetailsPage;
