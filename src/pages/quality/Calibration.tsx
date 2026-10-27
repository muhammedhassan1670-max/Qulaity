// QMS Enterprise 4.0 - Calibration Page
import { useEffect, useState } from 'react';
import { PageHeader, PageContainer, PageSection, StatsBar } from '../../components/PageHeader';
import DynamicFormRenderer from '../../components/DynamicFormRenderer';
import { 
  Search,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wrench,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { calibrationApi, type CalibrationData } from '../../api/calibrations';

interface CalibrationItem {
  id: string;
  equipment: string;
  model: string;
  serialNumber: string;
  location: string;
  lastCalibration: string;
  nextCalibration: string;
  status: 'calibrated' | 'due' | 'overdue' | 'maintenance';
  calibratedBy: string;
  uncertainty: string;
  [key: string]: unknown;
}

const mockCalibrations: CalibrationItem[] = [];

const statusConfig = {
  'calibrated': { color: 'bg-green-500/20 text-green-400', icon: CheckCircle2 },
  'due': { color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
  'overdue': { color: 'bg-red-500/20 text-red-400', icon: AlertCircle },
  'maintenance': { color: 'bg-blue-500/20 text-blue-400', icon: Wrench }
};

export function CalibrationPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<CalibrationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CalibrationItem | null>(null);
  const navigate = useNavigate();
  const params = useParams();

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const response = await calibrationApi.getAll();
      const transformed = response.data.map((c: any) => ({
        id: c.id,
        equipment: c.equipment,
        model: c.model || '',
        serialNumber: c.serialNumber,
        location: c.location || '',
        lastCalibration: c.lastCalibration?.split('T')[0] || '',
        nextCalibration: c.nextCalibration?.split('T')[0] || '',
        status: String(c.status || 'calibrated').toLowerCase() as any,
        calibratedBy: c.calibratedBy || '',
        uncertainty: c.uncertainty || '',
        ...c,
      }));
      setItems(transformed);
    } catch (e) {
      setItems(mockCalibrations);
      toast.info('Backend unavailable - no records loaded');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const id = params.id;
    if (!id) return;
    const found = items.find((i) => i.id === id);
    if (found) {
      setEditingItem(found);
      setIsFormOpen(true);
    }
  }, [params.id, items, isLoading]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-72">
          <div className="text-gray-400">Loading calibration...</div>
        </div>
      </PageContainer>
    );
  }

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    try {
      const payload: Omit<CalibrationData, 'id'> = {
        itemCode: (data.itemCode as string) || (data.equipment as string) || '',
        description: (data.description as string) || (data.model as string) || '',
        equipmentType: (data.equipmentType as string) || (data.equipment as string) || '',
        serialNumber: (data.serialNumber as string) || '',
        location: data.location as string,
        calibrationDate: (data.calibrationDate as string) || (data.lastCalibration as string) || '',
        nextCalibrationDate: (data.nextCalibrationDate as string) || (data.nextCalibration as string) || '',
        status: (data.status as string) || 'calibrated',
        assignedTo: (data.assignedTo as string) || (data.calibratedBy as string) || '',
      };

      if (editingItem) {
        await calibrationApi.update(editingItem.id, payload as any);
        toast.success('Calibration updated');
      } else {
        await calibrationApi.create(payload as any);
        toast.success('Equipment added');
      }

      await loadItems();
      setIsFormOpen(false);
      setEditingItem(null);
      if (params.id) {
        navigate('/calibration', { replace: true });
      }
    } catch (e) {
      toast.error(editingItem ? 'Failed to update calibration' : 'Failed to add equipment');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this calibration record?')) return;
    try {
      await calibrationApi.delete(id);
      await loadItems();
      toast.success('Deleted');
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const stats = [
    { label: 'Calibrated', value: items.filter((item) => item.status === 'calibrated').length, change: '0', trend: 'neutral' as const },
    { label: 'Due This Month', value: items.filter((item) => item.status === 'due').length, change: '0', trend: 'neutral' as const },
    { label: 'Overdue', value: items.filter((item) => item.status === 'overdue').length, change: '0', trend: 'neutral' as const },
    { label: 'Compliance', value: items.length ? `${Math.round((items.filter((item) => item.status === 'calibrated').length / items.length) * 100)}%` : '0%', change: '0%', trend: 'neutral' as const }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Calibration Management"
        subtitle="Track equipment calibration schedules and certificates"
        breadcrumbs={[{ label: 'Quality 4.0' }, { label: 'Calibration' }]}
        actions={{
          create: () => {
            setEditingItem(null);
            setIsFormOpen(true);
          },
          refresh: loadItems
        }}
      />

      <StatsBar stats={stats} />

      <PageSection>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500"
            />
          </div>
          <button
            className="h-11 px-4 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052a3] flex items-center justify-center gap-2 w-full sm:w-auto"
            onClick={() => {
              setEditingItem(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Equipment</span>
          </button>
        </div>

        {/* Mobile Cards View */}
        <div className="block sm:hidden space-y-3">
          {items.map((cal) => {
            const StatusIcon = statusConfig[cal.status].icon;
            return (
              <div
                key={cal.id}
                onClick={() => {
                  setEditingItem(cal);
                  setIsFormOpen(true);
                }}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3 hover:border-white/20 transition-all cursor-pointer active:scale-[0.99]"
              >
                {/* Header: ID, Equipment & Status */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#00A3E0] font-mono font-bold text-xs bg-[#00A3E0]/10 px-2 py-0.5 rounded-lg border border-[#00A3E0]/20">
                    {cal.id}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${statusConfig[cal.status].color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span className="capitalize">{cal.status}</span>
                  </span>
                </div>

                {/* Equipment & Model */}
                <div>
                  <h4 className="text-white font-bold text-sm leading-tight">{cal.equipment}</h4>
                  {cal.model && <p className="text-gray-400 text-xs mt-0.5">Model: {cal.model}</p>}
                </div>

                {/* Serial & Location */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase font-bold">Serial No.</span>
                    <span className="font-mono text-gray-200 text-xs">{cal.serialNumber}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase font-bold">Location</span>
                    <span className="text-gray-300 text-xs truncate block">{cal.location}</span>
                  </div>
                </div>

                {/* Calibration Dates & Uncertainty */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs">
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase font-bold">Last Cal.</span>
                    <span className="text-gray-400 text-xs">{cal.lastCalibration || '-'}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase font-bold">Next Due</span>
                    <span className={`text-xs font-bold ${cal.status === 'overdue' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {cal.nextCalibration || '-'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block glass-panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto w-full no-scrollbar">
            <table className="w-full min-w-[720px]">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">ID</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Equipment</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Serial No.</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Location</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Last Cal.</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Next Cal.</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Uncertainty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((cal) => {
                const StatusIcon = statusConfig[cal.status].icon;
                return (
                  <tr
                    key={cal.id}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => {
                      setEditingItem(cal);
                      setIsFormOpen(true);
                    }}
                  >
                    <td className="px-6 py-4">
                      <span className="text-[#00A3E0] font-mono text-sm">{cal.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white text-sm">{cal.equipment}</p>
                      <p className="text-gray-400 text-xs">{cal.model}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300 text-sm">{cal.serialNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300 text-sm">{cal.location}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[cal.status].color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {cal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400 text-sm">{cal.lastCalibration}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${cal.status === 'overdue' ? 'text-red-400' : 'text-gray-300'}`}>
                        {cal.nextCalibration}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300 text-sm">{cal.uncertainty}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>

        {isFormOpen && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
            <div className="glass-panel w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-t-[32px] sm:rounded-2xl animate-slideUp sm:animate-none">
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-3 sm:hidden" />
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-[#0a0a0f]">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-white">{editingItem ? 'Edit Calibration' : 'Add Equipment'}</h2>
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
                  formType="calibration"
                  initialValues={(editingItem || {}) as Record<string, unknown>}
                  onSubmit={handleFormSubmit}
                  readOnly={false}
                  showSubmitButton={true}
                  submitLabel={editingItem ? 'Update' : 'Create'}
                />

                {editingItem && (
                  <div className="mt-4">
                    <button
                      className="h-10 px-4 bg-red-600/80 text-white rounded-lg hover:bg-red-600"
                      onClick={() => handleDelete(editingItem.id)}
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

export default CalibrationPage;
