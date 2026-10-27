// QMS Enterprise 4.0 - Supplier Quality Page
import { useState, useEffect } from 'react';
import { PageHeader, PageContainer, PageSection, StatsBar } from '../../components/PageHeader';
import DynamicFormRenderer from '../../components/DynamicFormRenderer';
import { 
  Search,
  Plus,
  Star,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { supplierApi, type SupplierData } from '../../api/suppliers';

interface Supplier {
  id: string;
  name: string;
  location: string;
  category: string;
  rating: number;
  status: 'approved' | 'conditional' | 'blocked';
  lastAudit: string;
  nextAudit: string;
  ncCount: number;
  deliveryPerformance: number;
  qualityPerformance: number;
  [key: string]: unknown;
}

export const DEFAULT_SUPPLIERS: Supplier[] = [
  {
    id: 'SUP-001',
    name: 'Apex Industrial Steel Ltd.',
    location: 'Alexandria, Egypt',
    category: 'Raw Materials (Coils & Plates)',
    rating: 4.8,
    status: 'approved',
    lastAudit: '2026-03-15',
    nextAudit: '2027-03-15',
    ncCount: 1,
    deliveryPerformance: 98,
    qualityPerformance: 96,
  },
  {
    id: 'SUP-002',
    name: 'Delta Precision Polymers & Seals',
    location: '10th of Ramadan, Egypt',
    category: 'Injection Molded Parts',
    rating: 4.2,
    status: 'approved',
    lastAudit: '2026-01-20',
    nextAudit: '2027-01-20',
    ncCount: 3,
    deliveryPerformance: 92,
    qualityPerformance: 88,
  },
  {
    id: 'SUP-003',
    name: 'Global Fasteners & Hardware Co.',
    location: 'Cairo, Egypt',
    category: 'Fasteners & Standard Hardware',
    rating: 3.4,
    status: 'conditional',
    lastAudit: '2025-11-10',
    nextAudit: '2026-11-10',
    ncCount: 6,
    deliveryPerformance: 85,
    qualityPerformance: 78,
  },
];

export const mockSuppliers: Supplier[] = DEFAULT_SUPPLIERS;

const statusConfig = {
  'approved': 'bg-green-500/20 text-green-400',
  'conditional': 'bg-yellow-500/20 text-yellow-400',
  'blocked': 'bg-red-500/20 text-red-400'
};

function getRatingColor(rating: number): string {
  if (rating >= 4.5) return 'text-green-400';
  if (rating >= 3.5) return 'text-yellow-400';
  return 'text-red-400';
}

export function SupplierQualityPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const navigate = useNavigate();
  const params = useParams();

  const loadSuppliers = async () => {
    try {
      setIsLoading(true);
      const response = await supplierApi.getAll();
      // Transform API data to match Supplier interface
      const transformed = response.data.map((supplier: any) => ({
        id: supplier.id,
        name: supplier.name,
        location: supplier.address ? `${supplier.address.city || ''}, ${supplier.address.country || ''}` : (supplier.location || 'Unknown'),
        category: supplier.category || supplier.type || 'General',
        rating: supplier.rating || supplier.qualityRating || 4.0,
        status: supplier.status?.toLowerCase() || 'approved',
        lastAudit: supplier.lastAuditDate || supplier.lastAudit || 'N/A',
        nextAudit: supplier.nextAuditDate || supplier.nextAudit || 'N/A',
        ncCount: supplier.ncCount || supplier.openNcrCount || 0,
        deliveryPerformance: supplier.deliveryPerformance || 95,
        qualityPerformance: supplier.qualityPerformance || 95,
        ...supplier
      }));
      setSuppliers(transformed);
    } catch (err) {
      console.warn('API unavailable; keeping empty state:', err);
      // Keep an empty state when backend is not running
      setSuppliers(mockSuppliers);
      toast.info('Backend unavailable - no records loaded');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data from API
  useEffect(() => {
    loadSuppliers();
  }, []);

  // Support deep-link /supplier-quality/:id by opening the modal
  useEffect(() => {
    if (isLoading) return;
    const id = params.id;
    if (!id) return;
    const found = suppliers.find((s) => s.id === id);
    if (found) {
      setEditingSupplier(found);
      setIsFormOpen(true);
    }
  }, [params.id, suppliers, isLoading]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-72">
          <div className="text-gray-400">Loading supplier quality...</div>
        </div>
      </PageContainer>
    );
  }

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    try {
      const payload: SupplierData = {
        supplierCode: (data.supplierCode as string) || (data.code as string) || undefined,
        name: (data.name as string) || 'Supplier',
        category: data.category as string,
        status: data.status as string,
        address: data.address as any,
        primaryContact: data.primaryContact as string,
        email: data.email as string,
        phone: data.phone as string,
        rating: data.rating as number,
        metadata: data,
      };

      if (editingSupplier) {
        await supplierApi.update(editingSupplier.id, payload as any);
        toast.success('Supplier updated successfully');
      } else {
        await supplierApi.create(payload as any);
        toast.success('Supplier created successfully');
      }

      await loadSuppliers();
      setIsFormOpen(false);
      setEditingSupplier(null);
      if (params.id) {
        navigate('/supplier-quality', { replace: true });
      }
    } catch (e) {
      toast.error(editingSupplier ? 'Failed to update supplier' : 'Failed to create supplier');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this supplier?')) return;
    try {
      await supplierApi.delete(id);
      await loadSuppliers();
      toast.success('Supplier deleted');
    } catch (e) {
      toast.error('Failed to delete supplier');
    }
  };

  const stats = [
    { label: 'Approved Suppliers', value: suppliers.filter((supplier) => supplier.status === 'approved').length, change: '0', trend: 'neutral' as const },
    { label: 'Conditional', value: suppliers.filter((supplier) => supplier.status === 'conditional').length, change: '0', trend: 'neutral' as const },
    { label: 'Pending Audit', value: suppliers.filter((supplier) => supplier.nextAudit && supplier.nextAudit !== 'N/A').length, change: '0', trend: 'neutral' as const },
    { label: 'Avg Rating', value: suppliers.length ? (suppliers.reduce((sum, supplier) => sum + Number(supplier.rating || 0), 0) / suppliers.length).toFixed(1) : '0.0', change: '0.0', trend: 'neutral' as const }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Supplier Quality Management"
        subtitle="Manage supplier qualifications, audits, and performance"
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'Supplier Quality' }]}
        actions={{
          create: () => {
            setEditingSupplier(null);
            setIsFormOpen(true);
          },
          refresh: loadSuppliers
        }}
      />

      <StatsBar stats={stats} />

      <PageSection>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500"
            />
          </div>
          <button
            className="h-11 px-4 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052a3] flex items-center justify-center gap-2 w-full sm:w-auto"
            onClick={() => {
              setEditingSupplier(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>

        <div className="grid gap-4">
          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="glass-panel rounded-xl p-4 sm:p-6 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => {
                setEditingSupplier(supplier);
                setIsFormOpen(true);
              }}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1.5 flex-wrap">
                    <span className="text-[#00A3E0] font-mono font-bold text-xs bg-[#00A3E0]/10 px-2 py-0.5 rounded-lg border border-[#00A3E0]/20">
                      {supplier.id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusConfig[supplier.status]}`}>
                      {supplier.status}
                    </span>
                    <span className="text-gray-400 text-xs">{supplier.category}</span>
                  </div>
                  <h3 className="text-white font-bold text-base sm:text-lg">{supplier.name}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm mt-0.5">{supplier.location}</p>
                </div>

                <div className="flex items-center gap-2 self-start lg:self-auto bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                  <Star className={`w-5 h-5 ${getRatingColor(supplier.rating)}`} />
                  <span className={`text-xl sm:text-2xl font-black ${getRatingColor(supplier.rating)}`}>
                    {Number(supplier.rating || 0).toFixed(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 w-full lg:w-auto">
                  <div className="bg-white/5 p-2 rounded-xl text-center border border-white/5">
                    <p className="text-[10px] uppercase font-bold text-gray-400">Delivery</p>
                    <p className={`text-sm font-black mt-0.5 ${supplier.deliveryPerformance >= 90 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {supplier.deliveryPerformance}%
                    </p>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl text-center border border-white/5">
                    <p className="text-[10px] uppercase font-bold text-gray-400">Quality</p>
                    <p className={`text-sm font-black mt-0.5 ${supplier.qualityPerformance >= 95 ? 'text-green-400' : supplier.qualityPerformance >= 90 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {supplier.qualityPerformance}%
                    </p>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl text-center border border-white/5">
                    <p className="text-[10px] uppercase font-bold text-gray-400">Open NCs</p>
                    <p className={`text-sm font-black mt-0.5 ${supplier.ncCount === 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {supplier.ncCount}
                    </p>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl text-center border border-white/5">
                    <p className="text-[10px] uppercase font-bold text-gray-400">Next Audit</p>
                    <p className="text-xs font-bold text-gray-300 mt-0.5 truncate">{supplier.nextAudit}</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
                <span className="text-white/40 font-medium">سجلات الجودة والارتباطات:</span>
                <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/inspection')}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/30 transition flex items-center justify-center gap-1 font-bold text-[11px]"
                  >
                    <span>🔍 فحص الوارد (IQC)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/ncr?search=${encodeURIComponent(supplier.name)}`)}
                    className="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/30 transition flex items-center justify-center gap-1 font-bold text-[11px]"
                  >
                    <span>🚨 تقارير عدم المطابقة ({supplier.ncCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/8d?search=${encodeURIComponent(supplier.name)}`)}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition flex items-center justify-center gap-1 font-bold text-[11px]"
                  >
                    <span>⚡ تقارير 8D للمورد</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {isFormOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-5xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-[#0a0a0f]">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-white">
                    {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    {editingSupplier ? 'Update supplier details' : 'Create a new supplier'}
                  </p>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 sm:p-6">
                <DynamicFormRenderer
                  formType="supplier"
                  initialValues={(editingSupplier || {}) as Record<string, unknown>}
                  onSubmit={handleFormSubmit}
                  readOnly={false}
                  showSubmitButton={true}
                  submitLabel={editingSupplier ? 'Update Supplier' : 'Create Supplier'}
                />

                {editingSupplier && (
                  <div className="mt-4">
                    <button
                      className="h-10 px-4 bg-red-600/80 text-white rounded-lg hover:bg-red-600"
                      onClick={() => handleDelete(editingSupplier.id)}
                    >
                      Delete
                    </button>
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

export default SupplierQualityPage;
