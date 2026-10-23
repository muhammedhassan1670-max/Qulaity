import { useState, useMemo } from 'react';
import {
  GitCompare,
  Layers,
  Bell,
  ShieldAlert,
  Search,
  Download,
  CheckCircle2,
  RotateCcw,
  ArrowRightLeft,
  Check,
  X,
  Info,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getBOMModels,
  getBOMParts,
  compareTwoModels,
  getMasterMatrix,
  getModelAuditSummaries,
  getModelDetailedAudit,
  commitModelBaselineSnapshot,
  getCrossModelQualityRisks,
  exportComparisonToXlsx,
  exportMatrixToXlsx,
  resetBOMToFactoryDefaults,
} from '@/services/bomComparisonEngine';

export default function ModelBOMComparison() {
  const [activeTab, setActiveTab] = useState<'diff' | 'matrix' | 'audit' | 'risk'>('diff');

  // Reload trigger
  const [dataVersion, setDataVersion] = useState(0);

  const models = useMemo(() => getBOMModels(), [dataVersion]);
  const parts = useMemo(() => getBOMParts(), [dataVersion]);

  // Tab 1: 1-on-1 Diff State
  const [modelA, setModelA] = useState<string>(() => models[0]?.code || 'R-250MGR-BK2');
  const [modelB, setModelB] = useState<string>(() => models[1]?.code || 'R-250MGR-SL2');
  const [diffFilter, setDiffFilter] = useState<'all' | 'common' | 'onlyA' | 'onlyB'>('all');
  const [diffSearch, setDiffSearch] = useState('');

  const comparisonResult = useMemo(() => {
    return compareTwoModels(modelA, modelB);
  }, [modelA, modelB, dataVersion]);

  const filteredDiffItems = useMemo(() => {
    if (!comparisonResult) return [];
    return comparisonResult.items.filter((item) => {
      if (diffFilter !== 'all' && item.status !== diffFilter) return false;
      if (diffSearch.trim()) {
        const q = diffSearch.trim().toLowerCase();
        return (
          item.partCode.toLowerCase().includes(q) ||
          item.descAr.toLowerCase().includes(q) ||
          item.descEn.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [comparisonResult, diffFilter, diffSearch]);

  // Tab 2: Master Matrix State
  const [matrixSearch, setMatrixSearch] = useState('');
  const [varianceOnly, setVarianceOnly] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<'all' | 'sharp' | 'tornado'>('all');

  const familyFilteredModels = useMemo(() => {
    if (selectedFamily === 'sharp') {
      return models.filter((m) => m.code.startsWith('R-'));
    }
    if (selectedFamily === 'tornado') {
      return models.filter((m) => m.code.startsWith('TM'));
    }
    return models;
  }, [models, selectedFamily]);

  const masterMatrixData = useMemo(() => {
    return getMasterMatrix({
      filterVarianceOnly: varianceOnly,
      search: matrixSearch,
      modelSubset: familyFilteredModels.map((m) => m.code),
    });
  }, [varianceOnly, matrixSearch, familyFilteredModels, dataVersion]);

  // Tab 3: Baseline Audit State
  const auditSummaries = useMemo(() => getModelAuditSummaries(), [dataVersion]);
  const [selectedAuditModel, setSelectedAuditModel] = useState<string | null>(null);

  const detailedAudit = useMemo(() => {
    if (!selectedAuditModel) return null;
    return getModelDetailedAudit(selectedAuditModel);
  }, [selectedAuditModel, dataVersion]);

  // Tab 4: Defect Risk State
  const qualityRisks = useMemo(() => getCrossModelQualityRisks(), [dataVersion]);
  const [riskSearch, setRiskSearch] = useState('');

  const filteredRisks = useMemo(() => {
    if (!riskSearch.trim()) return qualityRisks;
    const q = riskSearch.trim().toLowerCase();
    return qualityRisks.filter(
      (r) =>
        r.partCode.toLowerCase().includes(q) ||
        r.descAr.toLowerCase().includes(q) ||
        r.descEn.toLowerCase().includes(q)
    );
  }, [qualityRisks, riskSearch]);

  // Handlers
  const handleSwapModels = () => {
    const temp = modelA;
    setModelA(modelB);
    setModelB(temp);
  };

  const handleCommitSnapshot = (modelCode: string) => {
    commitModelBaselineSnapshot(modelCode);
    setDataVersion((v) => v + 1);
    toast.success(`تم اعتماد اللقطة المرجعية الجديدة للموديل ${modelCode} بنجاح!`);
  };

  const handleResetDefaults = () => {
    if (window.confirm('هل أنت متأكد من إعادة ضبط جميع بيانات أشجار الموديلات لبيانات المصنع الأصلية؟')) {
      resetBOMToFactoryDefaults();
      setDataVersion((v) => v + 1);
      toast.success('تمت استعادة بيانات المصنع الأصلية بنجاح');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6" dir="rtl">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 shadow-2xl">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                <GitCompare className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white tracking-wide">
                    نظام مقارنة وإدارة أشجار الموديلات (BOM Tree Matrix)
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Industry 4.0 Native
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  محرك التحليل الهندسي والمقارنة الفورية لأشجار المنتجات، كشف الفروق، تتبع لقطات التعديل الهندسي، ومراقبة مخاطر الجودة للأجزاء المشتركة
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-900/80 border border-white/10 px-3 py-2 rounded-xl text-xs">
              <span className="text-slate-400">الموديلات النشطة:</span>
              <span className="font-bold text-indigo-400">{models.length}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">الأجزاء الفريدة:</span>
              <span className="font-bold text-emerald-400">{parts.length}</span>
            </div>

            <button
              onClick={handleResetDefaults}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition flex items-center gap-1.5"
              title="استعادة البيانات الأصلية"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              إعادة ضبط المصنع
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 border-b border-white/10 pb-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('diff')}
            className={`px-4 py-2.5 rounded-t-xl text-sm font-medium transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'diff'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            مقارنة بين موديلين (1-to-1 Diff)
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2.5 rounded-t-xl text-sm font-medium transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            المصفوفة الشاملة (Master Matrix)
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 rounded-t-xl text-sm font-medium transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'audit'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            لوحة التنبيهات واللقطات (Baseline Audit)
            {auditSummaries.some((s) => s.status === 'has_changes') && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('risk')}
            className={`px-4 py-2.5 rounded-t-xl text-sm font-medium transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'risk'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            مخاطر الأجزاء المشتركة (Defect Exposure)
          </button>
        </div>
      </div>

      {/* TAB 1: 1-on-1 Diff */}
      {activeTab === 'diff' && comparisonResult && (
        <div className="space-y-6">
          {/* Selectors Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-900/70 border border-white/10 p-4 rounded-2xl backdrop-blur">
            {/* Model A */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                الموديل الأول (Model A)
              </label>
              <select
                value={modelA}
                onChange={(e) => setModelA(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {models.map((m) => (
                  <option key={m.code} value={m.code} disabled={m.code === modelB}>
                    {m.code} - {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="md:col-span-2 flex justify-center">
              <button
                onClick={handleSwapModels}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-400 transition"
                title="تبديل الموديلين"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Model B */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                الموديل الثاني (Model B)
              </label>
              <select
                value={modelB}
                onChange={(e) => setModelB(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {models.map((m) => (
                  <option key={m.code} value={m.code} disabled={m.code === modelA}>
                    {m.code} - {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparison KPI Summary */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="bg-slate-900/60 border border-white/10 p-4 rounded-xl">
              <div className="text-xs text-slate-400">أجزاء {modelA}</div>
              <div className="text-xl font-bold text-blue-400 mt-1">{comparisonResult.totalPartsA}</div>
            </div>

            <div className="bg-slate-900/60 border border-white/10 p-4 rounded-xl">
              <div className="text-xs text-slate-400">أجزاء {modelB}</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">{comparisonResult.totalPartsB}</div>
            </div>

            <div className="bg-slate-900/60 border border-white/10 p-4 rounded-xl">
              <div className="text-xs text-slate-400">أكواد مشتركة</div>
              <div className="text-xl font-bold text-indigo-400 mt-1">{comparisonResult.commonCount}</div>
            </div>

            <div className="bg-slate-900/60 border border-white/10 p-4 rounded-xl">
              <div className="text-xs text-slate-400">حصري لـ {modelA}</div>
              <div className="text-xl font-bold text-amber-400 mt-1">{comparisonResult.onlyACount}</div>
            </div>

            <div className="bg-slate-900/60 border border-white/10 p-4 rounded-xl">
              <div className="text-xs text-slate-400">حصري لـ {modelB}</div>
              <div className="text-xl font-bold text-cyan-400 mt-1">{comparisonResult.onlyBCount}</div>
            </div>

            <div className="bg-slate-900/60 border border-white/10 p-4 rounded-xl">
              <div className="text-xs text-slate-400">نسبة التطابق الشاملة</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold text-white">{comparisonResult.similarityRate}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${comparisonResult.similarityRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Table Filters & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setDiffFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  diffFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                الكل ({comparisonResult.items.length})
              </button>

              <button
                onClick={() => setDiffFilter('common')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  diffFilter === 'common'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                مشترك فقط ({comparisonResult.commonCount})
              </button>

              <button
                onClick={() => setDiffFilter('onlyA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  diffFilter === 'onlyA'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                حصري لـ {modelA} ({comparisonResult.onlyACount})
              </button>

              <button
                onClick={() => setDiffFilter('onlyB')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  diffFilter === 'onlyB'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                حصري لـ {modelB} ({comparisonResult.onlyBCount})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="بحث في الأكواد والوصف..."
                  value={diffSearch}
                  onChange={(e) => setDiffSearch(e.target.value)}
                  className="bg-slate-950 border border-white/10 rounded-lg pr-9 pl-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 w-56"
                />
              </div>

              <button
                onClick={() => exportComparisonToXlsx(comparisonResult)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                تصدير إكسيل
              </button>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950/90 text-slate-400 border-b border-white/10 sticky top-0 z-10 backdrop-blur">
                  <tr>
                    <th className="py-3 px-4 font-semibold">كود الجزء</th>
                    <th className="py-3 px-4 font-semibold">اسم الجزء (عربي)</th>
                    <th className="py-3 px-4 font-semibold">الوصف الفني (إنجليزي)</th>
                    <th className="py-3 px-4 font-semibold">الوحدة</th>
                    <th className="py-3 px-4 font-semibold text-center">{modelA}</th>
                    <th className="py-3 px-4 font-semibold text-center">{modelB}</th>
                    <th className="py-3 px-4 font-semibold text-center">الحالة الهندسية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredDiffItems.map((item) => (
                    <tr
                      key={item.partCode}
                      className={`hover:bg-white/5 transition ${
                        item.status === 'common'
                          ? 'bg-transparent'
                          : item.status === 'onlyA'
                          ? 'bg-blue-500/5'
                          : 'bg-cyan-500/5'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-indigo-300">{item.partCode}</td>
                      <td className="py-3 px-4 text-slate-200">{item.descAr || '—'}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{item.descEn || '—'}</td>
                      <td className="py-3 px-4 text-slate-400">{item.uom}</td>

                      <td className="py-3 px-4 text-center">
                        {item.inA ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-500">
                            <X className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {item.inB ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-500">
                            <X className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {item.status === 'common' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            مشترك
                          </span>
                        ) : item.status === 'onlyA' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            خاص بـ {modelA}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            خاص بـ {modelB}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredDiffItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-500">
                        لا توجد أجزاء مطابقة لشروط البحث والفلترة.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Master Matrix */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/70 border border-white/10 p-4 rounded-2xl">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Family Filters */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10 text-xs">
                <button
                  onClick={() => setSelectedFamily('all')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    selectedFamily === 'all' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'
                  }`}
                >
                  جميع الموديلات ({models.length})
                </button>
                <button
                  onClick={() => setSelectedFamily('sharp')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    selectedFamily === 'sharp' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'
                  }`}
                >
                  موديلات SHARP
                </button>
                <button
                  onClick={() => setSelectedFamily('tornado')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    selectedFamily === 'tornado' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'
                  }`}
                >
                  موديلات TORNADO
                </button>
              </div>

              {/* Variance Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer text-xs bg-slate-950 border border-white/10 px-3 py-2 rounded-xl text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={varianceOnly}
                  onChange={(e) => setVarianceOnly(e.target.checked)}
                  className="rounded bg-slate-900 border-white/20 text-indigo-500 focus:ring-0"
                />
                <span>الأجزاء المختلفة فقط (فيه فرق ⚠️)</span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="بحث في كود الجزء أو الوصف..."
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                  className="bg-slate-950 border border-white/10 rounded-xl pr-9 pl-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 w-64"
                />
              </div>

              <button
                onClick={() => exportMatrixToXlsx(masterMatrixData.rows, masterMatrixData.models)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                تصدير المصفوفة لإكسيل
              </button>
            </div>
          </div>

          {/* Matrix Info Banner */}
          <div className="bg-slate-900/50 border border-white/10 rounded-xl p-3 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400" />
              <span>
                عرض {masterMatrixData.rows.length} جزء عبر {masterMatrixData.models.length} موديل إنتاج.
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/50 inline-block text-center text-[9px] text-emerald-400 font-bold">
                  ✓
                </span>
                مستخدم في الموديل
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-800 border border-white/5 inline-block" />
                غير مستخدم
              </span>
            </div>
          </div>

          {/* Master Matrix Table */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto max-h-[650px]">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-300 border-b border-white/10 sticky top-0 z-20">
                  <tr>
                    <th className="py-3 px-3 font-semibold sticky right-0 bg-slate-950 z-30 min-w-[120px] shadow-lg">
                      كود الجزء
                    </th>
                    <th className="py-3 px-3 font-semibold min-w-[180px]">الوصف بالعربية</th>
                    <th className="py-3 px-3 font-semibold min-w-[180px]">الوصف بالإنجليزية</th>
                    <th className="py-3 px-2 font-semibold text-center min-w-[50px]">الوحدة</th>
                    <th className="py-3 px-2 font-semibold text-center min-w-[60px]">الموديلات</th>
                    <th className="py-3 px-2 font-semibold text-center min-w-[80px]">فيه فرق؟</th>

                    {/* Columns for each model */}
                    {masterMatrixData.models.map((m) => (
                      <th
                        key={m.code}
                        className="py-3 px-2 font-mono text-[10px] text-center min-w-[80px] border-r border-white/5 bg-slate-950/80"
                        title={m.name}
                      >
                        <div className="truncate max-w-[80px]">{m.code}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {masterMatrixData.rows.map((row) => (
                    <tr key={row.partCode} className="hover:bg-white/5 transition">
                      <td className="py-2.5 px-3 font-mono font-medium text-indigo-300 sticky right-0 bg-slate-900/90 z-10 shadow-lg">
                        {row.partCode}
                      </td>
                      <td className="py-2.5 px-3 text-slate-200">{row.descAr || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{row.descEn || '—'}</td>
                      <td className="py-2.5 px-2 text-center text-slate-400">{row.uom}</td>

                      <td className="py-2.5 px-2 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-300">
                          {row.usageCount}
                        </span>
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        {row.hasVariance ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            فرق ⚠️
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">مطابق —</span>
                        )}
                      </td>

                      {/* Model Presence Indicators */}
                      {masterMatrixData.models.map((m) => {
                        const isPresent = row.modelPresence[m.code];
                        return (
                          <td
                            key={m.code}
                            className={`py-2.5 px-2 text-center border-r border-white/5 ${
                              isPresent ? 'bg-emerald-500/5' : 'bg-transparent'
                            }`}
                          >
                            {isPresent ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                                ✓
                              </span>
                            ) : (
                              <span className="text-slate-700 text-xs">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {masterMatrixData.rows.length === 0 && (
                    <tr>
                      <td colSpan={masterMatrixData.models.length + 6} className="text-center py-12 text-slate-500">
                        لا توجد بيانات مطابقة لشروط البحث.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Baseline Audit & Change Control */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Header Description */}
          <div className="bg-slate-900/60 border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-400" />
                لوحة تنبيهات التغيير الهندسي واللقطات المرجعية (BOM Baseline Audit)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                تتبع التغييرات بين الشجرة الحالية للموديل وآخر لقطة معتمدة هندسياً (Engineering Baseline). تظهر الإضافات والاستبعادات فوراً لضمان التحكم في التغييرات (ECO).
              </p>
            </div>
          </div>

          {/* Models Audit Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {auditSummaries.map((summary) => (
              <div
                key={summary.modelCode}
                className={`p-4 rounded-2xl border transition-all ${
                  summary.status === 'has_changes'
                    ? 'bg-amber-500/5 border-amber-500/30'
                    : 'bg-slate-900/60 border-white/10 hover:border-indigo-500/40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white font-mono text-sm">{summary.modelCode}</h3>
                    <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{summary.productName}</p>
                  </div>
                  {summary.status === 'has_changes' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                      يوجد تغيير
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      مطابق للقطة
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/5 text-center">
                  <div>
                    <div className="text-[10px] text-slate-500">الأجزاء حالياً</div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">{summary.currentPartsCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">إضافات 🆕</div>
                    <div className={`text-sm font-bold mt-0.5 ${summary.addedCount > 0 ? 'text-cyan-400' : 'text-slate-400'}`}>
                      {summary.addedCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">حذف ❌</div>
                    <div className={`text-sm font-bold mt-0.5 ${summary.removedCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                      {summary.removedCount}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    آخر لقطة: {summary.lastSnapshotDate || '2026-09-24'}
                  </span>
                  <button
                    onClick={() => setSelectedAuditModel(summary.modelCode)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    عرض ومراجعة
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Drilldown Modal / Section for Selected Model Audit */}
          {detailedAudit && (
            <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                      مراجعة تفصيلية
                    </span>
                    <h3 className="text-xl font-bold text-white font-mono">{detailedAudit.modelCode}</h3>
                    <span className="text-slate-400 text-sm">({detailedAudit.modelName})</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    تاريخ اللقطة المرجعية المعتمدة: <span className="font-mono text-slate-300">{detailedAudit.snapshotDate}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleCommitSnapshot(detailedAudit.modelCode)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    اعتماد لقطة مرجعية جديدة (Approve Baseline)
                  </button>

                  <button
                    onClick={() => setSelectedAuditModel(null)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="overflow-x-auto max-h-[450px]">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-white/10 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">كود الجزء</th>
                      <th className="py-2.5 px-3">اسم الجزء بالعربية</th>
                      <th className="py-2.5 px-3">الوصف بالإنجليزية</th>
                      <th className="py-2.5 px-3">الوحدة</th>
                      <th className="py-2.5 px-3 text-center">كان في اللقطة؟</th>
                      <th className="py-2.5 px-3 text-center">موجود حالياً؟</th>
                      <th className="py-2.5 px-3 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {detailedAudit.items.map((item) => (
                      <tr
                        key={item.partCode}
                        className={`hover:bg-white/5 transition ${
                          item.status === 'added'
                            ? 'bg-cyan-500/10'
                            : item.status === 'removed'
                            ? 'bg-rose-500/10'
                            : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono font-medium text-indigo-300">{item.partCode}</td>
                        <td className="py-2.5 px-3 text-slate-200">{item.descAr || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{item.descEn || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-400">{item.uom}</td>
                        <td className="py-2.5 px-3 text-center">
                          {item.inBaseline ? (
                            <span className="text-emerald-400 font-semibold">نعم</span>
                          ) : (
                            <span className="text-slate-500">لا</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {item.inCurrent ? (
                            <span className="text-emerald-400 font-semibold">نعم</span>
                          ) : (
                            <span className="text-slate-500">لا</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {item.status === 'added' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                              🆕 إضافة جديدة
                            </span>
                          ) : item.status === 'removed' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              ❌ محذوف
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">بدون تغيير</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Defect Exposure Risk Radar */}
      {activeTab === 'risk' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-slate-900/60 border border-white/10 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h2 className="text-lg font-bold text-white">
                  رادار مخاطر الجودة للأجزاء المشتركة (Multi-Model Quality Exposure)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                ربط ذكي فوري بين شجرة المواد (BOM) وسجلات العيوب (Defect Logs & NCR). إذا ظهر عيب في جزء مشترك في 13 موديلاً، فإن درجة الخطورة تتضاعف عبر خطوط الإنتاج.
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث في الأكواد المشتركة..."
                value={riskSearch}
                onChange={(e) => setRiskSearch(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded-xl pr-9 pl-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 w-64"
              />
            </div>
          </div>

          {/* Risk Table */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-white/10 sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-4 font-semibold">كود الجزء</th>
                    <th className="py-3 px-4 font-semibold">اسم الجزء (عربي)</th>
                    <th className="py-3 px-4 font-semibold">الوصف بالإنجليزية</th>
                    <th className="py-3 px-4 font-semibold text-center">عدد الموديلات المعرضة</th>
                    <th className="py-3 px-4 font-semibold text-center">العيوب المسجلة</th>
                    <th className="py-3 px-4 font-semibold text-center">مؤشر التعرض للمخاطر (Exposure)</th>
                    <th className="py-3 px-4 font-semibold text-center">الموديلات المتأثرة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredRisks.slice(0, 50).map((r) => (
                    <tr key={r.partCode} className="hover:bg-white/5 transition">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-300">{r.partCode}</td>
                      <td className="py-3 px-4 text-slate-200">{r.descAr || '—'}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{r.descEn || '—'}</td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            r.modelsCount >= 10
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : r.modelsCount >= 5
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {r.modelsCount} موديل
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-slate-200">{r.defectCount}</span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono font-bold text-indigo-300">{r.exposureScore}</span>
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              r.riskLevel === 'critical'
                                ? 'bg-rose-500 animate-ping'
                                : r.riskLevel === 'high'
                                ? 'bg-rose-500'
                                : r.riskLevel === 'medium'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {r.modelsList.slice(0, 4).map((m) => (
                            <span
                              key={m}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-slate-300 border border-white/5"
                            >
                              {m}
                            </span>
                          ))}
                          {r.modelsList.length > 4 && (
                            <span className="text-[10px] text-slate-500">
                              +{r.modelsList.length - 4} موديل
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
