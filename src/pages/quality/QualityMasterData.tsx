import { useMemo, useRef, useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  Edit3,
  Plus,
  Power,
  Search,
  Upload,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { PageContainer, PageHeader, PageSection } from '@/components/PageHeader';
import { QualityGuidedEmptyState } from '@/components/QualityGuidedEmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  deactivateQualityMasterRecord,
  detectMasterDuplicates,
  getQualityMasterTableConfig,
  importQualityMasterRows,
  loadQualityMasterTable,
  qualityMasterTableConfigs,
  upsertQualityMasterRecord,
  validateMasterRecord,
  type QualityMasterRecord,
  type QualityMasterTableId,
} from '@/services/qualityMasterData';
import { enqueueQualitySyncItem } from '@/services/qualitySyncQueue';

const userLabel = 'local-user';

function blankRecord(table: QualityMasterTableId): Record<string, unknown> {
  const config = getQualityMasterTableConfig(table);
  return config.fields.reduce((acc, field) => {
    acc[field.key] = field.type === 'number' ? 0 : '';
    return acc;
  }, {} as Record<string, unknown>);
}

function recordText(record: QualityMasterRecord): string {
  return Object.values(record).map((value) => String(value ?? '')).join(' ').toLowerCase();
}

export default function QualityMasterData() {
  const [activeTable, setActiveTable] = useState<QualityMasterTableId | 'defect-records'>('parts');
  const [records, setRecords] = useState<Record<QualityMasterTableId, QualityMasterRecord[]>>(() => (
    qualityMasterTableConfigs.reduce((acc, table) => {
      acc[table.id] = loadQualityMasterTable(table.id);
      return acc;
    }, {} as Record<QualityMasterTableId, QualityMasterRecord[]>)
  ));
  const [defectRecords, setDefectRecords] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [editingRecord, setEditingRecord] = useState<QualityMasterRecord | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>(() => blankRecord('parts'));
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTable === 'defect-records') {
      try {
        const stored = localStorage.getItem('qms_local_defect-logs');
        if (stored) {
          setDefectRecords(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Failed to load defect records:', err);
      }
    }
  }, [activeTable]);

  const config = activeTable !== 'defect-records' ? getQualityMasterTableConfig(activeTable as QualityMasterTableId) : qualityMasterTableConfigs[0];
  const tableRecords = activeTable !== 'defect-records' ? (records[activeTable as QualityMasterTableId] || []) : [];
  const duplicates = useMemo(() => activeTable !== 'defect-records' ? detectMasterDuplicates(activeTable as QualityMasterTableId, tableRecords) : [], [activeTable, tableRecords]);
  const filteredRecords = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return tableRecords.filter((record) => {
      if (statusFilter === 'active' && record.isActive === false) return false;
      if (statusFilter === 'inactive' && record.isActive !== false) return false;
      return !needle || recordText(record).includes(needle);
    });
  }, [search, statusFilter, tableRecords]);

  const refreshTable = (table?: QualityMasterTableId) => {
    const tableToRefresh = table || (activeTable === 'defect-records' ? null : activeTable);
    if (!tableToRefresh) return;
    setRecords((prev) => ({ ...prev, [tableToRefresh]: loadQualityMasterTable(tableToRefresh) }));
  };

  const switchTable = (table: string) => {
    if (table === 'defect-records') {
      setActiveTable('defect-records');
      setSearch('');
      return;
    }
    const tableId = table as QualityMasterTableId;
    setActiveTable(tableId);
    setDraft(blankRecord(tableId));
    setEditingRecord(null);
    setSearch('');
    setStatusFilter('active');
  };

  const startEdit = (record: QualityMasterRecord) => {
    setEditingRecord(record);
    setDraft({ ...record });
  };

  const startNew = () => {
    if (activeTable === 'defect-records') return;
    setEditingRecord(null);
    setDraft(blankRecord(activeTable as QualityMasterTableId));
  };

  const saveRecord = () => {
    if (activeTable === 'defect-records') return;
    const missing = validateMasterRecord(activeTable as QualityMasterTableId, draft);
    if (missing.length > 0) {
      toast.error('Required master data fields are missing', {
        description: missing.join(', '),
      });
      return;
    }
    upsertQualityMasterRecord(activeTable as QualityMasterTableId, editingRecord ? { ...editingRecord, ...draft } : draft, userLabel);
    enqueueQualitySyncItem({
      entityType: 'master-data',
      entityId: `${activeTable}:${String(draft.id || draft[config.primaryKey] || 'new')}`,
      operation: editingRecord ? 'update' : 'create',
      payloadSummary: `${config.name} ${editingRecord ? 'updated' : 'created'} locally.`,
    });
    refreshTable();
    startNew();
    toast.success('Master data saved', {
      description: `${config.name} was updated locally.`,
    });
  };

  const deactivateRecord = (id: string) => {
    if (activeTable === 'defect-records') return;
    deactivateQualityMasterRecord(activeTable as QualityMasterTableId, id, userLabel);
    enqueueQualitySyncItem({
      entityType: 'master-data',
      entityId: `${activeTable}:${id}`,
      operation: 'update',
      payloadSummary: `${config.name} record deactivated locally.`,
    });
    refreshTable();
    if (editingRecord?.id === id) startNew();
    toast.success('Record deactivated', {
      description: 'The record remains available historically but is hidden from active lookups.',
    });
  };

  const importFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const workbook = XLSX.read(loadEvent.target?.result, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
        if (rows.length === 0) {
          toast.error('Empty file', { description: 'No rows were found in the selected file.' });
          return;
        }
        const next = importQualityMasterRows(activeTable as QualityMasterTableId, rows, userLabel);
        enqueueQualitySyncItem({
          entityType: 'master-data',
          entityId: activeTable,
          operation: 'update',
          payloadSummary: `${rows.length} rows imported into ${config.name}.`,
        });
        setRecords((prev) => ({ ...prev, [activeTable as QualityMasterTableId]: next }));
        toast.success('Master data imported', {
          description: `${rows.length} rows loaded into ${config.name}.`,
        });
      } catch (error) {
        console.error('Master data import failed:', error);
        toast.error('Import failed', { description: 'Please check the Excel/CSV format.' });
      } finally {
        if (event.target) event.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const exportTable = () => {
    const exportRows = tableRecords.map(({ id, ...record }) => ({ id, ...record }));
    if (exportRows.length === 0) {
      toast.error('No data to export');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, config.name.slice(0, 31));
    XLSX.writeFile(workbook, `${activeTable}_master_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Master data exported');
  };

  const activeCount = tableRecords.filter((record) => record.isActive !== false).length;
  const inactiveCount = tableRecords.length - activeCount;

  return (
    <PageContainer>
      <PageHeader
        title="Quality Master Data"
        subtitle="Controlled local master data for defect recording, routing, lookups, rules, and historical snapshots"
      />

      <PageSection>
        <Tabs value={activeTable} onValueChange={switchTable} className="w-full">
          <div className="flex flex-col gap-5 mb-6">
            <TabsList className="bg-white/5 border border-white/10 p-1 w-full overflow-x-auto no-scrollbar justify-start">
              {qualityMasterTableConfigs.map((table) => (
                <TabsTrigger
                  key={table.id}
                  value={table.id}
                  className="data-[state=active]:bg-[#0066CC] data-[state=active]:text-white px-4 py-2 shrink-0"
                >
                  {table.name}
                </TabsTrigger>
              ))}
              <TabsTrigger
                value="defect-records"
                className="data-[state=active]:bg-[#0066CC] data-[state=active]:text-white px-4 py-2 shrink-0 border-l border-white/10 ml-2 pl-6"
              >
                Defect Records
              </TabsTrigger>
            </TabsList>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-panel p-4 rounded-2xl border border-white/10">
                <Database className="w-5 h-5 text-[#00A3E0] mb-2" />
                <p className="text-xs text-white/40 uppercase font-black">Total Records</p>
                <p className="text-2xl font-black text-white">{tableRecords.length}</p>
              </div>
              <div className="glass-panel p-4 rounded-2xl border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
                <p className="text-xs text-white/40 uppercase font-black">Active</p>
                <p className="text-2xl font-black text-white">{activeCount}</p>
              </div>
              <div className="glass-panel p-4 rounded-2xl border border-white/10">
                <Power className="w-5 h-5 text-slate-400 mb-2" />
                <p className="text-xs text-white/40 uppercase font-black">Inactive</p>
                <p className="text-2xl font-black text-white">{inactiveCount}</p>
              </div>
              <div className="glass-panel p-4 rounded-2xl border border-white/10">
                <AlertTriangle className="w-5 h-5 text-amber-400 mb-2" />
                <p className="text-xs text-white/40 uppercase font-black">Duplicate Signals</p>
                <p className="text-2xl font-black text-white">{duplicates.length}</p>
              </div>
            </div>
          </div>

          {qualityMasterTableConfigs.map((table) => (
            <TabsContent key={table.id} value={table.id} className="mt-0 focus-visible:outline-none">
              <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-6 items-start">
                <div className="glass-panel p-5 rounded-2xl border border-white/10 xl:sticky xl:top-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-xl bg-[#0066CC]/20 border border-[#0066CC]/30">
                      <Edit3 className="w-5 h-5 text-[#00A3E0]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">{editingRecord ? 'Edit Master Record' : 'Add Master Record'}</h3>
                      <p className="text-xs text-white/40">{config.description}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {config.fields.map((field) => (
                      <label key={field.key} className="block space-y-2">
                        <span className="text-xs font-black uppercase tracking-widest text-white/50">
                          {field.label}{field.required && <span className="text-red-400"> *</span>}
                        </span>
                        {field.type === 'textarea' ? (
                          <textarea
                            value={String(draft[field.key] ?? '')}
                            onChange={(event) => setDraft((prev) => ({ ...prev, [field.key]: event.target.value }))}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                          />
                        ) : field.type === 'select' ? (
                          <select
                            value={String(draft[field.key] ?? '')}
                            onChange={(event) => setDraft((prev) => ({ ...prev, [field.key]: event.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-[#1a1a1f] border border-white/10 text-white text-sm"
                          >
                            <option value="">Choose...</option>
                            {field.options?.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type === 'number' ? 'number' : 'text'}
                            value={String(draft[field.key] ?? '')}
                            onChange={(event) => setDraft((prev) => ({ ...prev, [field.key]: field.type === 'number' ? Number(event.target.value) : event.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                          />
                        )}
                      </label>
                    ))}

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={saveRecord}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0066CC] text-white font-black text-sm hover:bg-[#0052a3]"
                      >
                        <Plus className="w-4 h-4" />
                        {editingRecord ? 'Update' : 'Add'}
                      </button>
                      <button
                        type="button"
                        onClick={startNew}
                        className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 font-bold text-sm hover:bg-white/10"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
                  <div className="p-5 border-b border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black text-white">{config.name}</h3>
                      <p className="text-sm text-white/40 mt-1">{config.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={importFile}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-bold hover:bg-white/10"
                      >
                        <Upload className="w-4 h-4" />
                        Import
                      </button>
                      <button
                        type="button"
                        onClick={exportTable}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-bold hover:bg-white/10"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                    </div>
                  </div>

                  <div className="p-5 border-b border-white/10 flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search master data..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')}
                      className="px-4 py-3 rounded-xl bg-[#1a1a1f] border border-white/10 text-white text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="all">All</option>
                    </select>
                  </div>

                  {duplicates.length > 0 && (
                    <div className="m-5 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-300" />
                        <span className="text-sm font-black text-amber-200">Duplicate detection warning</span>
                      </div>
                      <p className="text-xs text-white/60">
                        {duplicates.length} duplicate key signal detected. Standardize these records before using them for controlled shopfloor lookup.
                      </p>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    {filteredRecords.length === 0 ? (
                      <div className="p-5">
                        <QualityGuidedEmptyState
                          title="No master data rows"
                          purpose="Master Data controls lookups, auto-fill values, routing, rules, and historical snapshots for the defect recorder and shopfloor entry."
                          firstAction="Import Excel/CSV for this table or add the first controlled record manually."
                          actionHref="/quality-master-data"
                          actionLabel="Stay Here"
                        />
                      </div>
                    ) : (
                      <table className="w-full min-w-[900px] text-sm">
                        <thead className="bg-white/5 text-white/40 uppercase text-[10px] tracking-widest">
                          <tr>
                            {config.fields.slice(0, 6).map((field) => (
                              <th key={field.key} className="px-4 py-3 text-left font-black">{field.label}</th>
                            ))}
                            <th className="px-4 py-3 text-left font-black">Status</th>
                            <th className="px-4 py-3 text-left font-black">Last Updated</th>
                            <th className="px-4 py-3 text-right font-black">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRecords.map((record) => (
                            <tr key={record.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                              {config.fields.slice(0, 6).map((field) => (
                                <td key={field.key} className="px-4 py-3 text-white/70 max-w-[220px] truncate" title={String(record[field.key] ?? '')}>
                                  {String(record[field.key] ?? '---') || '---'}
                                </td>
                              ))}
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${record.isActive === false ? 'bg-slate-500/10 text-slate-300' : 'bg-emerald-400/10 text-emerald-300'}`}>
                                  {record.isActive === false ? 'Inactive' : 'Active'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-white/40">{record.lastUpdatedAt ? new Date(record.lastUpdatedAt).toLocaleString() : '---'}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => startEdit(record)}
                                    className="p-2 rounded-lg text-white/50 hover:text-[#00A3E0] hover:bg-[#00A3E0]/10"
                                    title="Edit"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  {record.isActive !== false && (
                                    <button
                                      type="button"
                                      onClick={() => deactivateRecord(record.id)}
                                      className="p-2 rounded-lg text-white/50 hover:text-amber-300 hover:bg-amber-300/10"
                                      title="Deactivate"
                                    >
                                      <Power className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}

          <TabsContent value="defect-records" className="mt-0 focus-visible:outline-none">
            <div className="glass-panel p-5 rounded-2xl border border-white/10">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-black text-white">Recorded Defects</h3>
                  <p className="text-xs text-white/50">
                    These are the actual defect records logged by operators. Note: This view is read-only. 
                    To log new defects, please use the Defect Recorder page.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search records..."
                      className="w-[250px] pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-white/40 uppercase bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3 font-black">Date</th>
                      <th className="px-4 py-3 font-black">Shift</th>
                      <th className="px-4 py-3 font-black">Line</th>
                      <th className="px-4 py-3 font-black">Part</th>
                      <th className="px-4 py-3 font-black">Defect Type</th>
                      <th className="px-4 py-3 font-black">Qty</th>
                      <th className="px-4 py-3 font-black">Severity</th>
                      <th className="px-4 py-3 font-black">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defectRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-white/40">
                          No defect records found.
                        </td>
                      </tr>
                    ) : (
                      defectRecords.filter(r => !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase())).map((record: any, index: number) => (
                        <tr key={index} className="border-t border-white/5 hover:bg-white/[0.03]">
                          <td className="px-4 py-3 text-white/70">{record.date || '---'}</td>
                          <td className="px-4 py-3 text-white/70">{record.shift || '---'}</td>
                          <td className="px-4 py-3 text-white/70">{record.productionLine || '---'}</td>
                          <td className="px-4 py-3 text-white/70 max-w-[200px] truncate" title={record.partNameAtTime || record.partId || '---'}>
                            {record.partNameAtTime || record.partId || '---'}
                          </td>
                          <td className="px-4 py-3 text-white/70">{record.defectType || '---'}</td>
                          <td className="px-4 py-3 text-white/70 font-bold">{record.quantity || 0}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                              record.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                              record.severity === 'major' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {record.severity || 'minor'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                              record.status === 'open' ? 'bg-amber-500/10 text-amber-400' :
                              record.status === 'closed' ? 'bg-emerald-500/10 text-emerald-400' :
                              'bg-blue-500/10 text-blue-400'
                            }`}>
                              {record.status || 'open'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </PageSection>
    </PageContainer>
  );
}
