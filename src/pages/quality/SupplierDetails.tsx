import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Factory, Star } from 'lucide-react';
import { PageContainer, PageHeader, PageSection, StatsBar } from '../../components/PageHeader';
import { mockSuppliers } from './SupplierQuality';

export function SupplierDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const supplier = useMemo(() => mockSuppliers.find((x) => x.id === id), [id]);

  const stats = useMemo(() => {
    if (!supplier) return [];
    return [
      { label: 'Category', value: supplier.category, change: '', trend: 'neutral' as const },
      { label: 'Delivery', value: `${supplier.deliveryPerformance}%`, change: '', trend: supplier.deliveryPerformance >= 90 ? ('up' as const) : ('neutral' as const) },
      { label: 'Quality', value: `${supplier.qualityPerformance}%`, change: '', trend: supplier.qualityPerformance >= 95 ? ('up' as const) : ('neutral' as const) },
      { label: 'Open NCs', value: supplier.ncCount, change: '', trend: supplier.ncCount === 0 ? ('neutral' as const) : ('up' as const) },
    ];
  }, [supplier]);

  if (!id || !supplier) {
    return (
      <PageContainer>
        <PageHeader
          title="Supplier Details"
          subtitle="Record not found"
          breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'Supplier Quality' }, { label: id ?? 'Unknown' }]}
          actions={{
            create: () => navigate('/supplier-quality'),
            refresh: () => toast.info('Refresh', { description: 'Reload coming soon' }),
          }}
        />

        <PageSection>
          <div className="glass-panel rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4 text-gray-300">
              <Factory className="w-5 h-5 text-[#00A3E0]" />
              <span className="text-sm">No record found for</span>
              <span className="font-mono text-sm text-[#00A3E0]">{id}</span>
            </div>

            <button
              className="h-11 px-4 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors inline-flex items-center gap-2"
              onClick={() => navigate('/supplier-quality')}
              type="button"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Suppliers
            </button>
          </div>
        </PageSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={supplier.name}
        subtitle="Supplier performance and audit readiness"
        breadcrumbs={[
          { label: 'Quality 4.0' },
          { label: 'Supplier Quality', path: '/supplier-quality' },
          { label: supplier.id },
        ]}
        actions={{
          create: () => toast.info('New Audit', { description: 'Schedule supplier audit coming soon' }),
          refresh: () => toast.success('Refreshed', { description: 'Supplier data refreshed' }),
        }}
      />

      <StatsBar stats={stats} />

      <PageSection>
        <div className="glass-panel rounded-xl p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[#00A3E0] font-mono text-sm">{supplier.id}</span>
                <span className="text-gray-400 text-sm">•</span>
                <span className="text-gray-300 text-sm">{supplier.location}</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">Category: {supplier.category}</p>
            </div>

            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-2xl font-bold text-white">{Number(supplier.rating || 0).toFixed(1)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-gray-500">Last Audit</p>
              <p className="text-gray-200">{supplier.lastAudit}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-gray-500">Next Audit</p>
              <p className="text-gray-200">{supplier.nextAudit}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button
              className="h-10 px-4 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors inline-flex items-center gap-2"
              onClick={() => navigate('/supplier-quality')}
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
                params.set('source', 'Supplier');
                params.set('supplierId', supplier.id);
                params.set('supplierName', supplier.name);
                params.set('problemDescription', `Quality issue reported for ${supplier.name} (${supplier.id})`);
                navigate(`/ncr?${params.toString()}`);
              }}
              type="button"
            >
              Create NCR
            </button>
          </div>
        </div>
      </PageSection>
    </PageContainer>
  );
}

export default SupplierDetailsPage;
