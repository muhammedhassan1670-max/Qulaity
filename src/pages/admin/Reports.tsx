// QMS Enterprise 4.0 - Reports Page
import { useState } from 'react';
import { 
  FileText,
  Search,
  Plus,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Share2,
  Clock,
  MoreHorizontal,
  Star,
  RefreshCw,
  LayoutDashboard,
  Database,
  ShieldCheck,
  ClipboardList,
  AlertTriangle,
  Zap,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { exportData, prepareDataForExport } from '@/utils/exportUtils';
import { ncrApi, capaApi, auditApi } from '@/services/api';
import { unifiedDefectLogApi } from '@/api/unified-api';

interface Report {
  id: string;
  name: string;
  type: 'dashboard' | 'quality' | 'compliance' | 'operational';
  description: string;
  lastRun: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'on-demand';
  isFavorite: boolean;
  format: 'pdf' | 'excel' | 'powerbi';
}

const mockReports: Report[] = [];

const typeConfig = {
  'dashboard': 'bg-blue-500/20 text-blue-400',
  'quality': 'bg-green-500/20 text-green-400',
  'compliance': 'bg-purple-500/20 text-purple-400',
  'operational': 'bg-orange-500/20 text-orange-400'
};

const formatIcons = {
  'pdf': FileText,
  'excel': BarChart3,
  'powerbi': PieChart
};

export function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [reports, setReports] = useState<Report[]>(mockReports);

  const toggleFavorite = (reportId: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, isFavorite: !r.isFavorite } : r))
    );
  };

  const stats: Array<{ label: string; value: string | number; change: string; trend: 'up' | 'down' | 'neutral' }> = [
    { label: 'Total Reports', value: reports.length, change: '0', trend: 'neutral' as const },
    { label: 'Scheduled', value: reports.filter((report) => report.frequency !== 'on-demand').length, change: '0', trend: 'neutral' as const },
    { label: 'Generated Today', value: 0, change: '0', trend: 'neutral' as const },
    { label: 'Favorites', value: reports.filter((report) => report.isFavorite).length, change: '0', trend: 'neutral' as const }
  ];

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || report.type === filterType;
    return matchesSearch && matchesType;
  });

  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleGlobalExport = async (moduleId: string) => {
    setIsExporting(moduleId);
    toast.loading(`Gathering data for ${moduleId.toUpperCase()}...`, { id: 'export-toast' });

    try {
      let data: any[] = [];
      let fileName = '';
      let sheetName = '';
      let mapping: Record<string, string> = {};

      switch (moduleId) {
        case 'ncr': {
          const res = await ncrApi.getAll();
          data = res.data || [];
          fileName = 'NCR_Full_Export';
          sheetName = 'NCR Records';
          mapping = { ncrNumber: 'NCR ID', title: 'Title', category: 'Category', severity: 'Severity', status: 'Status', plant: 'Plant', detectedDate: 'Date' };
          break;
        }
        case 'capa': {
          const res = await capaApi.getAll();
          data = res.data || [];
          fileName = 'CAPA_Full_Export';
          sheetName = 'CAPA Records';
          mapping = { capaNumber: 'CAPA ID', title: 'Title', type: 'Type', status: 'Status', priority: 'Priority', dueDate: 'Due Date' };
          break;
        }
        case 'audit': {
          const res = await auditApi.getAll();
          data = res.data || [];
          fileName = 'Audit_Full_Export';
          sheetName = 'Audit Records';
          mapping = { auditNumber: 'Audit ID', title: 'Title', type: 'Type', status: 'Status', scheduledDate: 'Date', leadAuditor: 'Auditor' };
          break;
        }
        case 'defects': {
          const res = await unifiedDefectLogApi.getAll();
          data = res.data || [];
          fileName = 'Daily_Defects_Full_Export';
          sheetName = 'Defect Records';
          mapping = { date: 'Date', productionLine: 'Line', defectType: 'Type', quantity: 'Qty', severity: 'Severity', status: 'Status' };
          break;
        }
        default:
          throw new Error('Module not implemented');
      }

      if (data.length === 0) {
        toast.dismiss('export-toast');
        toast.error('No data found for this module');
        return;
      }

      const preparedData = prepareDataForExport(data, mapping);
      exportData(preparedData, fileName, sheetName, 'excel');
      toast.success(`${moduleId.toUpperCase()} data exported`, { id: 'export-toast' });
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Export failed', { id: 'export-toast' });
    } finally {
      setIsExporting(null);
    }
  };

  const exportModules = [
    { id: 'ncr', name: 'Non-Conformance Reports', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
    { id: 'capa', name: 'Corrective & Preventive Actions', icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { id: 'audit', name: 'Audit & Compliance Records', icon: ShieldCheck, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'defects', name: 'Daily Production Defects', icon: ClipboardList, color: 'text-green-400', bg: 'bg-green-500/10' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#0066CC]/20 to-[#00A3E0]/20 border border-[#0066CC]/30">
            <LayoutDashboard className="w-6 h-6 text-[#00A3E0]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Reports & Analytics Center</h1>
            <p className="text-sm text-gray-400">Generate, schedule, and manage enterprise-wide quality reports</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => toast.success('Refreshed', { description: 'Reports list refreshed' })}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Data
          </Button>
          <Button 
            className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white"
            onClick={() => toast.info('Auto-Reports', { description: 'Scheduled report generation active' })}
          >
            <Clock className="w-4 h-4 mr-2" />
            Schedule Report
          </Button>
        </div>
      </div>

      {/* Bulk Export Center */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-8 rounded-[2rem] border border-white/10 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-[#0066CC]/20 border border-[#0066CC]/30 flex items-center justify-center">
              <Database className="w-6 h-6 text-[#00A3E0]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Bulk Export Center</h2>
              <p className="text-sm text-white/40 font-medium">Export full datasets for industrial auditing</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {exportModules.map((module) => (
              <button
                key={module.id}
                disabled={isExporting !== null}
                onClick={() => handleGlobalExport(module.id)}
                className="group p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-[#0066CC]/40 transition-all text-left relative overflow-hidden active:scale-95 disabled:opacity-50"
              >
                <div className={`w-10 h-10 rounded-xl ${module.bg} ${module.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <module.icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-white mb-1 uppercase tracking-wider">{module.id.toUpperCase()} Data</h3>
                <p className="text-[10px] text-white/30 font-medium">{module.name}</p>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Download className="w-4 h-4 text-[#00A3E0]" />
                </div>
              </button>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-[#0066CC]/5 border border-[#0066CC]/20 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#0066CC]/20 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-[#00A3E0]" />
            </div>
            <p className="text-[11px] text-white/60 leading-relaxed font-medium italic">
              "System automatically prepares formatted industrial reports including all local offline records and server-synced data."
            </p>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-[2rem] border border-white/10 space-y-6 flex flex-col justify-center bg-gradient-to-br from-white/5 to-transparent">
          <div className="space-y-4">
            <div className="inline-block px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest mb-2">
              Industrial Insight
            </div>
            <h2 className="text-3xl font-black text-white leading-tight">Master Data Management & Analytics</h2>
            <p className="text-sm text-white/40 font-medium leading-relaxed max-w-md">
              Download comprehensive reports for all quality modules in Excel format. These reports are pre-formatted for audits and regulatory compliance checks.
            </p>
            <div className="flex gap-4 pt-4">
              <button className="flex items-center gap-2 text-sm font-black text-[#00A3E0] hover:text-white transition-colors group">
                Open PowerBI Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="glass-panel rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
            <div className="flex items-end justify-between">
              <p className="text-xl font-semibold text-white">{stat.value}</p>
              <span className={`text-xs ${stat.trend === 'up' ? 'text-green-400' : 'text-yellow-400'}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-11 px-4 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00A3E0]"
          >
            <option value="all">All Types</option>
            <option value="dashboard">Dashboard</option>
            <option value="quality">Quality</option>
            <option value="compliance">Compliance</option>
            <option value="operational">Operational</option>
          </select>
          <button
            className="h-11 px-4 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052a3] flex items-center gap-2"
            onClick={() => toast.info('New Report', { description: 'Report builder coming soon' })}
          >
            <Plus className="w-4 h-4" />
            New Report
          </button>
        </div>

        <div className="grid gap-4">
          {filteredReports.map((report) => {
            const FormatIcon = formatIcons[report.format];
            return (
              <div key={report.id} className="glass-panel rounded-xl p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[#00A3E0] font-mono text-sm">{report.id}</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeConfig[report.type]}`}>
                        {report.type}
                      </span>
                      <button
                        className={`p-1 rounded transition-colors ${report.isFavorite ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-400'}`}
                        onClick={() => {
                          toggleFavorite(report.id);
                          toast.success(report.isFavorite ? 'Removed from favorites' : 'Added to favorites', {
                            description: report.name,
                          });
                        }}
                      >
                        <Star className={`w-4 h-4 ${report.isFavorite ? 'fill-yellow-400' : ''}`} />
                      </button>
                    </div>
                    <h3 className="text-white font-medium text-lg">{report.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{report.description}</p>
                    
                    <div className="flex items-center gap-6 mt-4">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Clock className="w-4 h-4" />
                        Last run: {report.lastRun}
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        {report.frequency}
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <FormatIcon className="w-4 h-4" />
                        {report.format.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="h-10 px-4 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                      onClick={() => toast.info('Download', { description: `${report.name} (${report.format.toUpperCase()}) coming soon` })}
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      className="h-10 px-4 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                      onClick={() => toast.info('Share', { description: `${report.name} share link coming soon` })}
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                    <button
                      className="h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
                      onClick={() => toast.info('Report actions', { description: report.name })}
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
