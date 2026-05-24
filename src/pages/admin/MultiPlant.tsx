// QMS Enterprise 4.0 - Multi-Plant Page
import { 
  Globe,
  Plus,
  Factory,
  CheckCircle2,
  AlertCircle,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface Plant {
  id: string;
  name: string;
  location: string;
  country: string;
  status: 'active' | 'inactive' | 'maintenance';
  manager: string;
  employees: number;
  certifications: string[];
  monthlyOutput: number;
  qualityScore: number;
}

const mockPlants: Plant[] = [];

const statusConfig = {
  'active': { color: 'bg-green-500/20 text-green-400', icon: CheckCircle2 },
  'inactive': { color: 'bg-gray-500/20 text-gray-400', icon: AlertCircle },
  'maintenance': { color: 'bg-yellow-500/20 text-yellow-400', icon: AlertCircle }
};

export function MultiPlantPage() {
  const stats: Array<{ label: string; value: string | number; change: string; trend: 'up' | 'down' | 'neutral' }> = [
    { label: 'Total Plants', value: mockPlants.length, change: '0', trend: 'neutral' as const },
    { label: 'Active', value: mockPlants.filter((plant) => plant.status === 'active').length, change: '0', trend: 'neutral' as const },
    { label: 'Total Employees', value: mockPlants.reduce((sum, plant) => sum + plant.employees, 0), change: '0', trend: 'neutral' as const },
    { label: 'Avg Quality', value: mockPlants.length ? `${(mockPlants.reduce((sum, plant) => sum + plant.qualityScore, 0) / mockPlants.length).toFixed(1)}%` : '0%', change: '0%', trend: 'neutral' as const }
  ];

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#0066CC]/20 to-[#00A3E0]/20 border border-[#0066CC]/30 shadow-lg shadow-[#0066CC]/10">
            <Globe className="w-7 h-7 text-[#00A3E0]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Multi-Plant Management</h1>
            <p className="text-sm text-gray-400 font-medium">Global operational overview across all sites</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => toast.success('Syncing Global Data...')}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 backdrop-blur-md rounded-xl h-11"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Global
          </Button>
          <Button 
            className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white hover:opacity-90 shadow-lg shadow-[#0066CC]/20 rounded-xl h-11 px-6 font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Plant
          </Button>
        </div>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="glass-panel rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all group">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 group-hover:text-gray-300 transition-colors">{stat.label}</p>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stat.trend === 'up' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Plants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockPlants.map((plant) => {
          const StatusIcon = statusConfig[plant.status].icon;
          return (
            <div key={plant.id} className="glass-panel rounded-[2rem] border border-white/5 hover:border-[#00A3E0]/30 transition-all duration-500 group/card overflow-hidden">
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 group-hover/card:bg-[#0066CC]/20 transition-colors">
                      <Factory className="w-6 h-6 text-[#00A3E0]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white group-hover/card:text-[#00A3E0] transition-colors">{plant.name}</h3>
                      <div className="flex items-center gap-1.5 text-gray-500 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{plant.location}, {plant.country}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusConfig[plant.status].color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {plant.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/5">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Quality Score</p>
                    <p className="text-lg font-black text-white">{plant.qualityScore}%</p>
                  </div>
                  <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/5">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Employees</p>
                    <p className="text-lg font-black text-white">{plant.employees}</p>
                  </div>
                  <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/5">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Manager</p>
                    <p className="text-xs font-bold text-white truncate">{plant.manager}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {plant.certifications.map((cert) => (
                      <div key={cert} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-gray-400 uppercase tracking-widest backdrop-blur-md">
                        {cert}
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="text-[#00A3E0] hover:bg-[#00A3E0]/10 rounded-xl h-10 px-4 font-bold text-xs">
                    View Dashboard
                    <RefreshCw className="w-3.5 h-3.5 ml-2" />
                  </Button>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-transparent via-[#00A3E0]/30 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MultiPlantPage;
