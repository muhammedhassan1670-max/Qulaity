// QMS Enterprise 4.0 - Database Page
import { useState } from 'react';
import { 
  Search,
  Table2,
  HardDrive,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MoreHorizontal,
  Download,
  RefreshCw,
  Server
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface TableInfo {
  name: string;
  records: number;
  size: string;
  lastUpdated: string;
  status: 'healthy' | 'warning' | 'critical';
}

const mockTables: TableInfo[] = [];

const statusConfig = {
  'healthy': { color: 'text-green-400', icon: CheckCircle2 },
  'warning': { color: 'text-yellow-400', icon: AlertTriangle },
  'critical': { color: 'text-red-400', icon: AlertTriangle }
};

export function DatabasePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    toast.promise(new Promise(resolve => setTimeout(resolve, 2500)), {
      loading: 'Synchronizing with master database...',
      success: () => {
        setIsSyncing(false);
        return 'Database synchronization complete';
      },
      error: 'Synchronization failed'
    });
  };

  const handleExport = () => {
    setIsExporting(true);
    toast.promise(new Promise(resolve => setTimeout(resolve, 3000)), {
      loading: 'Preparing full database backup...',
      success: () => {
        setIsExporting(false);
        return 'Database backup exported successfully';
      },
      error: 'Backup failed'
    });
  };

  const stats: Array<{ label: string; value: string | number; change: string; trend: 'up' | 'down' | 'neutral' }> = [
    { label: 'Database Size', value: '0 GB', change: '0', trend: 'neutral' as const },
    { label: 'Total Records', value: mockTables.reduce((sum, table) => sum + table.records, 0), change: '0', trend: 'neutral' as const },
    { label: 'Uptime', value: '--', change: '0', trend: 'neutral' as const },
    { label: 'Query Time', value: '--', change: '0', trend: 'neutral' as const }
  ];

  const filteredTables = mockTables.filter(table => 
    table.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#0066CC]/20 to-[#00A3E0]/20 border border-[#0066CC]/30">
            <Server className="w-6 h-6 text-[#00A3E0]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Database Management</h1>
            <p className="text-sm text-gray-400">Monitor and manage system database</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleSync}
            disabled={isSyncing}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button 
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
          >
            <Download className={`w-4 h-4 mr-2 ${isExporting ? 'animate-bounce' : ''}`} />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="glass-panel rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
            <div className="flex items-end justify-between">
              <p className="text-xl font-semibold text-white">{stat.value}</p>
              <span className={`text-xs ${stat.trend === 'up' ? 'text-green-400' : 'text-gray-400'}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#0066CC]/20 flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-[#00A3E0]" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Storage Used</p>
                <p className="text-xl font-semibold text-white">3.2 GB / 10 GB</p>
              </div>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-[32%] bg-gradient-to-r from-[#0066CC] to-[#00A3E0] rounded-full" />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Active Connections</p>
                <p className="text-xl font-semibold text-white">24</p>
              </div>
            </div>
            <p className="text-gray-500 text-xs">Peak: 42 connections today</p>
          </div>

          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Last Backup</p>
                <p className="text-xl font-semibold text-white">2 hours ago</p>
              </div>
            </div>
            <p className="text-green-400 text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Auto-backup enabled
            </p>
          </div>
        </div>

        {/* Data Table Card */}
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
            <h3 className="text-white font-medium">Database Tables</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search tables..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 pr-4 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#00A3E0]"
                />
              </div>
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">Table Name</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">Records</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">Size</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">Last Updated</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTables.map((table) => {
                const StatusIcon = statusConfig[table.status].icon;
                return (
                  <tr key={table.name} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Table2 className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-300 text-sm">{table.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-gray-300 text-sm">{table.records.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-gray-300 text-sm">{table.size}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-gray-400 text-sm">{table.lastUpdated}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-sm ${statusConfig[table.status].color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {table.status}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-1">
                        <button
                          className="p-1.5 hover:bg-white/10 rounded transition-colors"
                          onClick={() => toast.info('Download', { description: `Exporting ${table.name} (coming soon)` })}
                        >
                          <Download className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          className="p-1.5 hover:bg-white/10 rounded transition-colors"
                          onClick={() => toast.info('Table actions', { description: `${table.name}` })}
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {filteredTables.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                        <Search className="w-6 h-6 text-gray-500" />
                      </div>
                      <p className="text-gray-400">No tables found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DatabasePage;
