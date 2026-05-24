import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  ClipboardList,
  ShieldAlert,
  FileText,
  Layout,
  GitBranch,
  ListChecks,
  Search,
  RefreshCw,
  Download,
  ExternalLink,
  Trash2,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Database,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ncrApi, type NcrQueryParams } from '../../api/ncr';
import { capaApi, type CapaQueryParams } from '../../api/capa';
import { eightDApi, type EightDQueryParams } from '../../api/eight-d';
import { fmeaApi, type FmeaQueryParams } from '../../api/fmea';
import { unifiedDefectLogApi, type DefectLogQueryParams } from '../../api/unified-api';
import { useNavigate } from 'react-router-dom';

type ModuleKey = 'ncr' | 'capa' | '8d' | 'fmea' | 'change-control' | 'control-plan' | 'defect-logs';

type RecordRow = {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

const modules: Array<{ key: ModuleKey; label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = [
  { key: 'ncr', label: 'NCR', icon: ShieldAlert, color: 'text-red-400' },
  { key: 'capa', label: 'CAPA', icon: ClipboardList, color: 'text-amber-400' },
  { key: '8d', label: '8D Reports', icon: FileText, color: 'text-blue-400' },
  { key: 'fmea', label: 'FMEA', icon: Layout, color: 'text-purple-400' },
  { key: 'change-control', label: 'Change Control', icon: GitBranch, color: 'text-emerald-400' },
  { key: 'control-plan', label: 'Control Plan', icon: ListChecks, color: 'text-cyan-400' },
  { key: 'defect-logs', label: 'Defect Recorder', icon: ShieldAlert, color: 'text-orange-400' }
];

const statusOptions = ['Open', 'In Progress', 'Pending', 'Closed', 'Rejected', 'Approved'];
const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];
const limitOptions = [10, 25, 50, 100];

function toCsv(rows: RecordRow[]) {
  const headers = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );

  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    const needsQuotes = /[",\n]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };

  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => escape(r[h])).join(','));
  }
  return lines.join('\n');
}

function downloadText(filename: string, content: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface FetchResult {
  rows: RecordRow[];
  total: number;
  page: number;
  totalPages: number;
}

async function fetchModuleRecords(
  module: ModuleKey,
  query: {
    search?: string;
    status?: string;
    priority?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }
): Promise<FetchResult> {
  switch (module) {
    case 'ncr': {
      const params: NcrQueryParams = {
        search: query.search,
        status: query.status,
        priority: query.priority,
        startDate: query.dateFrom,
        endDate: query.dateTo,
        page: query.page,
        limit: query.limit,
      };
      const res = await ncrApi.getAll(params);
      return {
        rows: res.data.map((x: any) => ({
          id: x.ncrNumber || x.id,
          title: x.title,
          description: x.description,
          status: x.status,
          priority: x.priority,
          createdAt: x.createdAt,
          updatedAt: x.updatedAt,
          ...x
        })),
        total: res.total,
        page: res.page,
        totalPages: res.totalPages,
      };
    }
    case 'capa': {
      const params: CapaQueryParams = {
        search: query.search,
        status: query.status,
        priority: query.priority,
        startDate: query.dateFrom,
        endDate: query.dateTo,
        page: query.page,
        limit: query.limit,
      };
      const res = await capaApi.getAll(params);
      return {
        rows: res.data.map((x: any) => ({
          id: x.capaNumber || x.id,
          title: x.title,
          description: x.description,
          status: x.status,
          priority: x.priority,
          createdAt: x.createdAt,
          updatedAt: x.updatedAt,
          ...x
        })),
        total: res.total,
        page: res.page,
        totalPages: res.totalPages,
      };
    }
    case '8d': {
      const params: EightDQueryParams = {
        search: query.search,
        status: query.status,
        startDate: query.dateFrom,
        endDate: query.dateTo,
        page: query.page,
        limit: query.limit,
      };
      const res = await eightDApi.getAll(params);
      return {
        rows: res.data.map((x: any) => ({
          id: x.eightDNumber || x.id,
          title: x.title || x.subject,
          description: x.description,
          status: x.status,
          createdAt: x.createdAt,
          updatedAt: x.updatedAt,
          ...x
        })),
        total: res.total,
        page: res.page,
        totalPages: res.totalPages,
      };
    }
    case 'fmea': {
      const params: FmeaQueryParams = {
        search: query.search,
        status: query.status,
        startDate: query.dateFrom,
        endDate: query.dateTo,
        page: query.page,
        limit: query.limit,
      };
      const res = await fmeaApi.getAll(params);
      return {
        rows: res.data.map((x: any) => ({
          id: x.fmeaNumber || x.id,
          title: x.title,
          description: x.description,
          status: x.status,
          createdAt: x.createdAt,
          updatedAt: x.updatedAt,
          ...x
        })),
        total: res.total,
        page: res.page,
        totalPages: res.totalPages,
      };
    }
    case 'defect-logs': {
      const params: DefectLogQueryParams = {
        search: query.search,
        startDate: query.dateFrom,
        endDate: query.dateTo,
        page: query.page,
        limit: query.limit,
      };
      const res = await unifiedDefectLogApi.getAll(params);
      return {
        rows: res.data.map((x: any) => ({
          id: x.id,
          title: `Defect: ${x.defectType}`,
          description: x.description,
          status: x.status,
          priority: x.severity,
          createdAt: x.createdAt,
          updatedAt: x.updatedAt,
          ...x
        })),
        total: res.total,
        page: res.page,
        totalPages: res.totalPages,
      };
    }
    case 'change-control':
    case 'control-plan':
      toast.info('Coming soon', { description: 'Records API for this module is not wired yet' });
      return { rows: [], total: 0, page: 1, totalPages: 0 };
    default:
      return { rows: [], total: 0, page: 1, totalPages: 0 };
  }
}

async function deleteModuleRecord(module: ModuleKey, id: string) {
  switch (module) {
    case 'ncr':
      return ncrApi.delete(id);
    case 'capa':
      return capaApi.delete(id);
    case '8d':
      return eightDApi.delete(id);
    case 'fmea':
      return fmeaApi.delete(id);
    case 'defect-logs':
      return unifiedDefectLogApi.delete(id);
    case 'change-control':
    case 'control-plan':
      toast.info('Coming soon', { description: 'Delete for this module is not wired yet' });
      return;
    default:
      return;
  }
}

function recordLink(module: ModuleKey, id: string) {
  switch (module) {
    case 'ncr':
      return `/ncr/${encodeURIComponent(id)}`;
    case 'capa':
      return `/capa/${encodeURIComponent(id)}`;
    case '8d':
      return `/8d/${encodeURIComponent(id)}`;
    case 'fmea':
      return `/fmea/${encodeURIComponent(id)}`;
    case 'change-control':
      return `/change-control/${encodeURIComponent(id)}`;
    case 'control-plan':
      return `/control-plan/${encodeURIComponent(id)}`;
    case 'defect-logs':
      return `/defect-log`;
    default:
      return '/';
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getStatusColor(status?: string): string {
  switch (status?.toLowerCase()) {
    case 'open':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'in progress':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'pending':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'closed':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'rejected':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'approved':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

function getPriorityColor(priority?: string): string {
  switch (priority?.toLowerCase()) {
    case 'critical':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'high':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'medium':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'low':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

// Filter Badge Component
function FilterBadge({ label, value, onClear }: { label: string; value: string; onClear: () => void }) {
  return (
    <Badge variant="secondary" className="bg-white/10 text-white border border-white/10 hover:bg-white/20 transition-colors">
      <span className="text-gray-400 mr-1">{label}:</span>
      <span className="text-white">{value}</span>
      <button onClick={onClear} className="ml-2 hover:text-red-400 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </Badge>
  );
}

export default function AdminRecordsPage() {
  const [activeModule, setActiveModule] = useState<ModuleKey>('ncr');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState<RecordRow[]>([]);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();

  const hasActiveFilters = statusFilter || priorityFilter || dateFrom || dateTo;

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter) count++;
    if (priorityFilter) count++;
    if (dateFrom || dateTo) count++;
    return count;
  }, [statusFilter, priorityFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const load = async (module: ModuleKey, currentPage = page) => {
    setIsLoading(true);
    try {
      const result = await fetchModuleRecords(module, {
        search,
        status: statusFilter,
        priority: priorityFilter,
        dateFrom,
        dateTo,
        page: currentPage,
        limit,
      });
      setRows(result.rows);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setPage(result.page);
    } catch (e) {
      console.warn('Failed to load records', e);
      toast.error('Failed to load records');
      setRows([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeModule, statusFilter, priorityFilter, dateFrom, dateTo, limit]);

  // Load data when page or search changes
  useEffect(() => {
    load(activeModule, page);
  }, [activeModule, page, limit]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        load(activeModule, 1);
      } else {
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Pagination controls
  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const goToFirst = () => goToPage(1);
  const goToLast = () => goToPage(totalPages);
  const goToPrev = () => goToPage(page - 1);
  const goToNext = () => goToPage(page + 1);

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#0066CC]/20 to-[#00A3E0]/20 border border-[#0066CC]/30">
            <Database className="w-6 h-6 text-[#00A3E0]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Records Management</h1>
            <p className="text-sm text-gray-400">Manage and organize quality records across all modules</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 hover:bg-white/5"
            onClick={() => load(activeModule)}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 hover:bg-white/5"
            onClick={() => {
              const csv = toCsv(rows);
              downloadText(`${activeModule}-records.csv`, csv, 'text/csv');
              toast.success('Exported successfully');
            }}
            disabled={rows.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Module Tabs */}
      <Tabs value={activeModule} onValueChange={(v) => setActiveModule(v as ModuleKey)} className="w-full">
        <TabsList className="bg-white/5 border border-white/10 p-1 flex-wrap gap-1">
          {modules.map((m) => {
            const Icon = m.icon;
            const isActive = activeModule === m.key;
            return (
              <TabsTrigger
                key={m.key}
                value={m.key}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-[#0066CC] text-white shadow-lg shadow-[#0066CC]/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : m.color}`} />
                <span className="font-medium">{m.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {modules.map((m) => (
          <TabsContent key={m.key} value={m.key} className="mt-6 space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${m.label} records...`}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0066CC]/50 focus:border-[#0066CC]/50 transition-all"
                />
              </div>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                size="default"
                className={`border-white/10 hover:bg-white/5 ${showFilters ? 'bg-[#0066CC]/20 border-[#0066CC]/30' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge className="ml-2 bg-[#0066CC] text-white text-xs px-1.5 py-0">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#00A3E0]" />
                    Advanced Filters
                  </h3>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-400 hover:text-red-400 h-8">
                      <X className="w-4 h-4 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30 transition-all"
                    >
                      <option value="" className="bg-gray-900">All Statuses</option>
                      {statusOptions.map((s) => (
                        <option key={s} value={s} className="bg-gray-900">{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Priority Filter */}
                  {(m.key === 'ncr' || m.key === 'capa') && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Priority</label>
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30 transition-all"
                      >
                        <option value="" className="bg-gray-900">All Priorities</option>
                        {priorityOptions.map((p) => (
                          <option key={p} value={p} className="bg-gray-900">{p}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Date From */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Date From
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30 transition-all"
                    />
                  </div>

                  {/* Date To */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Date To
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30 transition-all"
                    />
                  </div>
                </div>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                    <span className="text-xs text-gray-500 py-1">Active filters:</span>
                    {statusFilter && (
                      <FilterBadge label="Status" value={statusFilter} onClear={() => setStatusFilter('')} />
                    )}
                    {priorityFilter && (
                      <FilterBadge label="Priority" value={priorityFilter} onClear={() => setPriorityFilter('')} />
                    )}
                    {dateFrom && (
                      <FilterBadge label="From" value={formatDate(dateFrom)} onClear={() => setDateFrom('')} />
                    )}
                    {dateTo && (
                      <FilterBadge label="To" value={formatDate(dateTo)} onClear={() => setDateTo('')} />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Data Table Card */}
            <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
              {/* Table Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      <>
                        <span className="text-white font-medium">{total.toLocaleString()}</span>
                        <span> records found</span>
                      </>
                    )}
                  </span>
                  {hasActiveFilters && !isLoading && (
                    <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400 bg-amber-500/10">
                      Filtered
                    </Badge>
                  )}
                </div>

                {/* Limit Selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">Show per page:</span>
                  <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30 transition-all"
                  >
                    {limitOptions.map((l) => (
                      <option key={l} value={l} className="bg-gray-900">{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                      {(m.key === 'ncr' || m.key === 'capa') && (
                        <th className="text-left py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Priority</th>
                      )}
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Updated</th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, index) => (
                      <tr
                        key={r.id}
                        className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                          index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'
                        }`}
                      >
                        <td className="py-4 px-6">
                          <span className="font-mono text-sm text-[#00A3E0] font-medium">{r.id}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-200 max-w-xs truncate block" title={String(r.title ?? '')}>
                            {String(r.title ?? '')}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <Badge variant="outline" className={`text-xs ${getStatusColor(r.status)} border`}>
                            {r.status || 'Unknown'}
                          </Badge>
                        </td>
                        {(m.key === 'ncr' || m.key === 'capa') && (
                          <td className="py-4 px-6">
                            <Badge variant="outline" className={`text-xs ${getPriorityColor(r.priority)} border`}>
                              {r.priority || '-'}
                            </Badge>
                          </td>
                        )}
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-400">{formatDate(r.createdAt)}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-400">{formatDate(r.updatedAt)}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-[#00A3E0] hover:bg-[#00A3E0]/10"
                              onClick={() => navigate(recordLink(activeModule, r.id))}
                              title="View record"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-400 hover:bg-red-400/10"
                              onClick={async () => {
                                if (!confirm(`Are you sure you want to delete ${r.id}?`)) return;
                                try {
                                  await deleteModuleRecord(activeModule, r.id);
                                  toast.success('Record deleted successfully');
                                  load(activeModule);
                                } catch (e) {
                                  console.error(e);
                                  toast.error('Failed to delete record');
                                }
                              }}
                              title="Delete record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {rows.length === 0 && !isLoading && (
                      <tr>
                        <td
                          colSpan={m.key === 'ncr' || m.key === 'capa' ? 7 : 6}
                          className="py-16 text-center"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-4 rounded-full bg-white/5">
                              <Search className="w-8 h-8 text-gray-600" />
                            </div>
                            <div className="text-gray-500 font-medium">No records found</div>
                            {hasActiveFilters && (
                              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[#00A3E0]">
                                Clear all filters
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}

                    {isLoading && (
                      <tr>
                        <td
                          colSpan={m.key === 'ncr' || m.key === 'capa' ? 7 : 6}
                          className="py-16 text-center"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <RefreshCw className="w-8 h-8 text-gray-600 animate-spin" />
                            <span className="text-gray-500">Loading records...</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/5">
                  <div className="text-sm text-gray-400">
                    Showing <span className="text-white font-medium">{startRecord.toLocaleString()}</span>
                    {' - '}
                    <span className="text-white font-medium">{endRecord.toLocaleString()}</span>
                    {' of '}
                    <span className="text-white font-medium">{total.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 border-white/10 hover:bg-white/10"
                      onClick={goToFirst}
                      disabled={page === 1 || isLoading}
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 border-white/10 hover:bg-white/10"
                      onClick={goToPrev}
                      disabled={page === 1 || isLoading}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <div className="flex items-center gap-1 px-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            disabled={isLoading}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                              pageNum === page
                                ? 'bg-[#0066CC] text-white shadow-lg shadow-[#0066CC]/30'
                                : 'text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 border-white/10 hover:bg-white/10"
                      onClick={goToNext}
                      disabled={page === totalPages || isLoading}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 border-white/10 hover:bg-white/10"
                      onClick={goToLast}
                      disabled={page === totalPages || isLoading}
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
