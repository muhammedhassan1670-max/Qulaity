import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Download, Printer, Loader2 } from 'lucide-react';
import { PageContainer, PageHeader, PageSection, StatsBar } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { unifiedAuditApi } from '../../api/unified-api';

export function AuditReportPage() {
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
        toast.error('Failed to load audit report');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const stats = useMemo(() => {
    if (!audit) return [];
    return [
      { label: 'Audit ID', value: audit.id, change: '', trend: 'neutral' as const },
      { label: 'Status', value: audit.status, change: '', trend: 'neutral' as const },
      { label: 'Findings', value: audit.findings || 0, change: '', trend: 'neutral' as const },
      { label: 'NCs', value: audit.ncCount || 0, change: '', trend: 'neutral' as const },
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
          title="Audit Report"
          subtitle="Record not found"
          breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'Audit', path: '/quality/hub/audit' }, { label: id ?? 'Unknown' }, { label: 'Report' }]}
        />
        <PageSection>
          <div className="glass-panel rounded-xl p-6">
            <button
              className="h-11 px-4 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors inline-flex items-center gap-2"
              onClick={() => navigate('/quality/hub/audit')}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Audits
            </button>
          </div>
        </PageSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Audit Report"
        subtitle="Audit summary and findings snapshot"
        breadcrumbs={[
          { label: 'Quality 4.0' },
          { label: 'Audit', path: '/quality/hub/audit' },
          { label: audit.id, path: `/quality/hub/audit/${audit.id}` },
          { label: 'Report' },
        ]}
        actions={{
          refresh: () => toast.success('Refreshed'),
          custom: [
            {
              label: 'Download',
              icon: <Download className="w-4 h-4" />,
              variant: 'secondary',
              onClick: () => {
                toast.promise(unifiedAuditApi.export('pdf', { search: id }), {
                  loading: 'Preparing PDF Report...',
                  success: (blob: Blob) => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Audit_Report_${id}_${new Date().toISOString().split('T')[0]}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    return 'Audit report downloaded';
                  },
                  error: 'Download failed'
                });
              },
            },
            {
              label: 'Print',
              icon: <Printer className="w-4 h-4" />,
              variant: 'secondary',
              onClick: () => window.print(),
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
              <p className="text-gray-400 text-sm mt-1">Scope: {audit.scope || 'N/A'}</p>
              <p className="text-gray-500 text-sm mt-1">Scheduled: {audit.scheduledDate ? new Date(audit.scheduledDate).toLocaleDateString() : 'TBD'} • Duration: {audit.duration || 'N/A'}</p>
            </div>
            <StatusBadge status={audit.status} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-gray-500">Auditor</p>
              <p className="text-gray-200">{audit.auditor || 'Unassigned'}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-gray-500">Auditee</p>
              <p className="text-gray-200">{audit.auditee || 'N/A'}</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-gray-500">Highlights</p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-gray-500">Total Findings</p>
                <p className="text-2xl font-bold text-white mt-1">{audit.findings || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-gray-500">Non-Conformances</p>
                <p className="text-2xl font-bold text-white mt-1">{audit.ncCount || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-gray-500">Overall</p>
                <p className="text-2xl font-bold text-[#00A3E0] mt-1">Good</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button
              className="h-10 px-4 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors inline-flex items-center gap-2"
              onClick={() => navigate(`/quality/hub/audit/${audit.id}`)}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              className="h-10 px-4 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052a3] transition-colors"
              onClick={() => {
                navigate(`/quality/records/ncr?create=1&source=Audit&auditId=${audit.id}`);
              }}
            >
              Create NCR
            </button>
          </div>
        </div>
      </PageSection>
    </PageContainer>
  );
}

export default AuditReportPage;
