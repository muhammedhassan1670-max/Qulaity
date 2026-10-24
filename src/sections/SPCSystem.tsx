import { useState, useMemo, useEffect } from 'react';
import { 
  Activity, BarChart3, LineChart as LineChartIcon, AlertCircle, 
  Settings2, Plus, Trash2, CheckCircle2, RotateCcw, 
  Info, Table as TableIcon
} from 'lucide-react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Area
} from 'recharts';
import { useTranslation } from '@/utils/translations';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';

import { 
  calculateXbarR, calculateIMR, calculatePChart, calculateUChart,
  calculateCapability, buildHistogramData, type SpcSubgroup,
  type SpcControlChartResult
} from '@/services/spcEngine';

type SpcTab = 'control' | 'capability' | 'data';
type ChartType = 'xbar-r' | 'i-mr' | 'p' | 'u';

export interface SpcMeasurementRow {
  id: string;
  label: string;
  timestamp?: string;
  values?: number[];   // For X-bar & R
  value?: number;      // For I-MR
  defective?: number;  // For p-chart
  sampleSize?: number; // For p-chart
  defects?: number;    // For u-chart
  units?: number;      // For u-chart
}

// Storage key per chart type ensures no cross-type data corruption
const getStorageKey = (type: ChartType) => `qms_spc_v3_${type}`;

// Helper to load real user measurements only (strictly filters out any synthetic/demo records)
function loadUserMeasurements(type: ChartType): SpcMeasurementRow[] {
  try {
    const saved = localStorage.getItem(getStorageKey(type));
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Exclude any synthetic demo items (ids starting with sg-, pt-, p-, u-, or demo labels like Lot-)
        const clean = parsed.filter(d => 
          !d.id?.startsWith('sg-') && 
          !d.id?.startsWith('pt-') && 
          !d.id?.startsWith('p-') && 
          !d.id?.startsWith('u-') &&
          !d.label?.startsWith('Lot-') &&
          !d.label?.startsWith('Batch-') &&
          !d.label?.startsWith('Unit-')
        );
        if (clean.length !== parsed.length) {
          localStorage.setItem(getStorageKey(type), JSON.stringify(clean));
        }
        return clean;
      }
    }
  } catch {}
  return [];
}

export default function SPCSystem() {
  const { language: langApp } = useAppStore();
  const { language: langTrans } = useTranslation();
  const language = langApp || langTrans || 'ar';
  const isAr = language === 'ar';
  
  const [activeTab, setActiveTab] = useState<SpcTab>('control');
  const [chartType, setChartType] = useState<ChartType>('xbar-r');

  // Purge any legacy demo keys once on load
  useEffect(() => {
    try {
      localStorage.removeItem('qms_spc_real_measurements');
      (['xbar-r', 'i-mr', 'p', 'u'] as ChartType[]).forEach(t => {
        loadUserMeasurements(t);
      });
    } catch {}
  }, []);

  // Real user data only — starts strictly empty if no real measurements recorded
  const [data, setData] = useState<SpcMeasurementRow[]>(() => loadUserMeasurements('xbar-r'));

  // Switch dataset when chartType changes (real data only)
  useEffect(() => {
    setData(loadUserMeasurements(chartType));
  }, [chartType]);

  // Save changes to current chart storage
  const saveData = (updated: SpcMeasurementRow[]) => {
    setData(updated);
    try {
      localStorage.setItem(getStorageKey(chartType), JSON.stringify(updated));
    } catch {}
  };

  // Form Inputs State
  const [inputLabel, setInputLabel] = useState('');
  const [inputValuesText, setInputValuesText] = useState('');
  const [inputDefective, setInputDefective] = useState('2');
  const [inputSampleSize, setInputSampleSize] = useState('100');
  const [inputDefects, setInputDefects] = useState('3');
  const [inputUnits, setInputUnits] = useState('10');

  // Capability specs state
  const [usl, setUsl] = useState<number>(55);
  const [lsl, setLsl] = useState<number>(45);
  const [target, setTarget] = useState<number>(50);

  // Clear all data
  const handleClearData = () => {
    saveData([]);
    toast.info(isAr ? 'تم مسح سجل القياسات للشارت الحالي' : 'Measurements cleared for active chart');
  };

  // Delete single measurement row
  const handleDeleteRow = (id: string) => {
    const updated = data.filter(d => d.id !== id);
    saveData(updated);
    toast.success(isAr ? 'تم حذف القراءة' : 'Measurement removed');
  };

  // Undo / Delete last measurement row
  const handleUndoLast = () => {
    if (data.length === 0) return;
    const updated = data.slice(0, -1);
    saveData(updated);
    toast.info(isAr ? 'تم حذف آخر قراءة مسجلة والتراجع عنها' : 'Last measurement removed');
  };

  // Add Measurement Handler
  const handleAddMeasurement = () => {
    const defaultLabel = `${isAr ? 'عينة' : 'Sample'}-${data.length + 1}`;
    const label = inputLabel.trim() || defaultLabel;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const id = `rec-${Date.now()}`;

    if (chartType === 'xbar-r') {
      if (!inputValuesText.trim()) {
        toast.error(isAr ? 'يرجى إدخال قيم القياس (مثال: 50.2, 49.8, 50.1)' : 'Please enter measurement values (e.g. 50.2, 49.8, 50.1)');
        return;
      }
      const numbers = inputValuesText
        .split(/[\s,]+/)
        .map(v => parseFloat(v))
        .filter(v => !isNaN(v));

      if (numbers.length === 0) {
        toast.error(isAr ? 'يرجى إدخال أرقام صحيحة' : 'Invalid numbers entered');
        return;
      }

      const newRow: SpcMeasurementRow = {
        id,
        label,
        timestamp: timeStr,
        values: numbers
      };
      saveData([...data, newRow]);
      setInputValuesText('');
      setInputLabel('');
      toast.success(isAr ? `تمت إضافة العينة (${numbers.length} قياسات) بنجاح` : `Sample added (${numbers.length} readings)`);

    } else if (chartType === 'i-mr') {
      if (!inputValuesText.trim()) {
        toast.error(isAr ? 'يرجى إدخال القيمة المقاسة (مثال: 25.4)' : 'Please enter the measured value (e.g. 25.4)');
        return;
      }
      const val = parseFloat(inputValuesText.trim());
      if (isNaN(val)) {
        toast.error(isAr ? 'قيمة رقمية غير صالحة' : 'Invalid numeric value');
        return;
      }

      const newRow: SpcMeasurementRow = {
        id,
        label,
        timestamp: timeStr,
        value: val
      };
      saveData([...data, newRow]);
      setInputValuesText('');
      setInputLabel('');
      toast.success(isAr ? 'تم تسجيل القراءة ورسمها على الشارت' : 'Reading recorded and plotted on chart');

    } else if (chartType === 'p') {
      const defective = parseFloat(inputDefective) || 0;
      const sampleSize = parseFloat(inputSampleSize) || 100;
      if (sampleSize <= 0) {
        toast.error(isAr ? 'حجم العينة يجب أن يكون أكبر من صفر' : 'Sample size must be greater than zero');
        return;
      }
      const newRow: SpcMeasurementRow = {
        id,
        label,
        timestamp: timeStr,
        defective,
        sampleSize
      };
      saveData([...data, newRow]);
      setInputLabel('');
      toast.success(isAr ? 'تمت إضافة عينة الفحص بنجاح' : 'Inspection sample added');

    } else {
      const defects = parseFloat(inputDefects) || 0;
      const units = parseFloat(inputUnits) || 1;
      if (units <= 0) {
        toast.error(isAr ? 'عدد الوحدات يجب أن يكون أكبر من صفر' : 'Units count must be greater than zero');
        return;
      }
      const newRow: SpcMeasurementRow = {
        id,
        label,
        timestamp: timeStr,
        defects,
        units
      };
      saveData([...data, newRow]);
      setInputLabel('');
      toast.success(isAr ? 'تمت إضافة فحص العيوب بنجاح' : 'Defect check added');
    }
  };

  // Run Statistical Calculations safely
  const calculations: SpcControlChartResult | null = useMemo(() => {
    if (!data || data.length === 0) return null;

    try {
      if (chartType === 'xbar-r') {
        const subgroups: SpcSubgroup[] = data.map((d, i) => ({
          id: d.id || i.toString(),
          label: d.label || `S-${i + 1}`,
          values: d.values && d.values.length > 0 ? d.values : (d.value !== undefined ? [d.value] : [50])
        }));
        return calculateXbarR(subgroups);
      } else if (chartType === 'i-mr') {
        const mapped = data.map((d, i) => ({
          label: d.label || `Pt-${i + 1}`,
          value: d.value !== undefined ? d.value : (d.values && d.values.length > 0 ? d.values[0] : 0)
        }));
        return calculateIMR(mapped);
      } else if (chartType === 'p') {
        const mapped = data.map((d, i) => ({
          label: d.label || `Lot-${i + 1}`,
          defective: d.defective ?? 0,
          sampleSize: d.sampleSize ?? 100
        }));
        return calculatePChart(mapped);
      } else if (chartType === 'u') {
        const mapped = data.map((d, i) => ({
          label: d.label || `Insp-${i + 1}`,
          defects: d.defects ?? 0,
          units: d.units ?? 1
        }));
        return calculateUChart(mapped);
      }
    } catch (err) {
      console.error('SPC calculation error:', err);
      return null;
    }
    return null;
  }, [data, chartType]);

  // Capability calculations (for continuous variable charts)
  const capabilityData = useMemo(() => {
    if (chartType !== 'xbar-r' && chartType !== 'i-mr') return null;
    if (!calculations || !data || data.length === 0) return null;

    let allValues: number[] = [];
    if (chartType === 'xbar-r') {
      allValues = data.flatMap(d => d.values && d.values.length > 0 ? d.values : (d.value !== undefined ? [d.value] : []));
    } else {
      allValues = data.map(d => d.value !== undefined ? d.value : (d.values && d.values[0] !== undefined ? d.values[0] : 0));
    }

    if (allValues.length === 0) return null;

    return {
      indices: calculateCapability(allValues, usl, lsl, target, calculations.withinSigma),
      histogram: buildHistogramData(allValues)
    };
  }, [data, chartType, calculations, usl, lsl, target]);

  // Helper to calculate safe Y-axis domain with generous breathing room
  const getYDomain = (chartData: any[], limits: any) => {
    if (!chartData || chartData.length === 0) return [0, 10];
    const vals: number[] = [];
    chartData.forEach(d => {
      if (typeof d.value === 'number' && !isNaN(d.value) && isFinite(d.value)) {
        vals.push(d.value);
      }
    });
    if (typeof limits?.ucl === 'number' && isFinite(limits.ucl)) vals.push(limits.ucl);
    if (typeof limits?.lcl === 'number' && isFinite(limits.lcl)) vals.push(limits.lcl);
    if (typeof limits?.cl === 'number' && isFinite(limits.cl)) vals.push(limits.cl);

    if (vals.length === 0) return [0, 10];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    if (min === max) return [Number((min - 1).toFixed(2)), Number((max + 1).toFixed(2))];
    const span = max - min;
    const pad = Math.max(0.6, span * 0.22);
    return [Number((min - pad).toFixed(2)), Number((max + pad).toFixed(2))];
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload || {};
      const val = payload[0]?.value;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3.5 rounded-xl shadow-2xl text-xs text-white min-w-[190px]">
          <p className="font-bold text-sm text-sky-400 mb-2 pb-1 border-b border-slate-800">{label}</p>
          <div className="space-y-1.5 font-mono">
            <p className="flex justify-between gap-4">
              <span className="text-slate-400">{isAr ? 'القيمة المقاسة:' : 'Value:'}</span>
              <span className="font-bold text-white">{typeof val === 'number' ? val.toFixed(3) : '—'}</span>
            </p>
            {dataPoint?.ucl !== undefined && (
              <p className="flex justify-between gap-4 text-red-400">
                <span>{isAr ? 'الحد الأعلى (UCL):' : 'UCL:'}</span>
                <span className="font-bold">{dataPoint.ucl?.toFixed(3)}</span>
              </p>
            )}
            {dataPoint?.cl !== undefined && (
              <p className="flex justify-between gap-4 text-emerald-400">
                <span>{isAr ? 'المركز (CL):' : 'CL:'}</span>
                <span className="font-bold">{dataPoint.cl?.toFixed(3)}</span>
              </p>
            )}
            {dataPoint?.lcl !== undefined && (
              <p className="flex justify-between gap-4 text-red-400">
                <span>{isAr ? 'الحد الأدنى (LCL):' : 'LCL:'}</span>
                <span className="font-bold">{dataPoint.lcl?.toFixed(3)}</span>
              </p>
            )}

            {dataPoint?.violations && dataPoint.violations.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-800">
                <p className="text-red-400 font-bold flex items-center gap-1 mb-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {isAr ? 'مخالفات نيلسون:' : 'Nelson Rules:'}
                </p>
                <ul className="list-disc pr-4 text-[11px] text-red-300 space-y-0.5">
                  {dataPoint.violations.map((v: string, i: number) => <li key={i}>{v}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Render Control Chart (Primary or Secondary)
  const renderControlChart = (
    chartData: any[], 
    limits: any, 
    title: string, 
    strokeColor: string = '#0ea5e9'
  ) => {
    if (!chartData || chartData.length === 0) return null;
    const yDomain = getYDomain(chartData, limits);

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl mb-6">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2 border-b border-slate-800/80 pb-3">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" />
            {title}
          </h3>
          <div className="flex items-center gap-4 text-xs font-mono">
            {typeof limits?.ucl === 'number' && isFinite(limits.ucl) && (
              <span className="text-red-400">UCL: <strong>{limits.ucl.toFixed(2)}</strong></span>
            )}
            {typeof limits?.cl === 'number' && isFinite(limits.cl) && (
              <span className="text-emerald-400">CL: <strong>{limits.cl.toFixed(2)}</strong></span>
            )}
            {typeof limits?.lcl === 'number' && isFinite(limits.lcl) && (
              <span className="text-red-400">LCL: <strong>{limits.lcl.toFixed(2)}</strong></span>
            )}
          </div>
        </div>
        
        <div className="h-[320px] w-full" style={{ touchAction: 'pan-y' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 25, right: 35, left: 15, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
              <XAxis 
                dataKey="label" 
                tick={{ fill: '#94a3b8', fontSize: 11 }} 
                stroke="#475569" 
                padding={{ left: 20, right: 20 }}
              />
              <YAxis 
                domain={yDomain} 
                tick={{ fill: '#94a3b8', fontSize: 11 }} 
                stroke="#475569" 
                allowDataOverflow={false}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Control Limits Reference Lines - CL on opposite side to avoid overlap */}
              {typeof limits?.ucl === 'number' && isFinite(limits.ucl) && (
                <ReferenceLine 
                  y={limits.ucl} 
                  stroke="#ef4444" 
                  strokeDasharray="6 4" 
                  strokeWidth={1.5}
                  label={{ 
                    value: `UCL (${limits.ucl.toFixed(2)})`, 
                    position: isAr ? 'insideTopLeft' : 'insideTopRight', 
                    fill: '#ef4444', 
                    fontSize: 11, 
                    fontWeight: 'bold' 
                  }} 
                />
              )}
              {typeof limits?.cl === 'number' && isFinite(limits.cl) && (
                <ReferenceLine 
                  y={limits.cl} 
                  stroke="#22c55e" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                  label={{ 
                    value: `CL (${limits.cl.toFixed(2)})`, 
                    position: isAr ? 'insideTopRight' : 'insideTopLeft', 
                    fill: '#22c55e', 
                    fontSize: 11, 
                    fontWeight: 'bold' 
                  }} 
                />
              )}
              {typeof limits?.lcl === 'number' && isFinite(limits.lcl) && (
                <ReferenceLine 
                  y={limits.lcl} 
                  stroke="#ef4444" 
                  strokeDasharray="6 4" 
                  strokeWidth={1.5}
                  label={{ 
                    value: `LCL (${limits.lcl.toFixed(2)})`, 
                    position: isAr ? 'insideBottomLeft' : 'insideBottomRight', 
                    fill: '#ef4444', 
                    fontSize: 11, 
                    fontWeight: 'bold' 
                  }} 
                />
              )}
              
              {/* Data Line: Straight linear line per standard SPC guidelines (no spline overshoot) */}
              <Line 
                type="linear" 
                dataKey="value" 
                stroke={strokeColor} 
                strokeWidth={2}
                connectNulls={true}
                isAnimationActive={false}
                dot={(props: any) => {
                  const { cx, cy, payload, index } = props;
                  if (cx === undefined || cy === undefined || isNaN(cx) || isNaN(cy)) return <g key={`dot-empty-${index}`} />;
                  if (payload?.value === null || payload?.value === undefined) return <g key={`dot-null-${index}`} />;
                  const isViolation = payload?.outOfControl || (payload?.violations && payload.violations.length > 0);
                  return (
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={isViolation ? 6 : 4.5} 
                      fill={isViolation ? "#ef4444" : strokeColor} 
                      stroke="#ffffff" 
                      strokeWidth={2} 
                      key={`dot-${index}`}
                    />
                  );
                }}
                activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2 }} 
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const getCapabilityColor = (val: number) => {
    if (val >= 1.33) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (val >= 1.0) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    return 'text-red-400 bg-red-500/10 border-red-500/30';
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 pt-20 sm:pt-24 min-h-screen text-slate-100">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <LineChartIcon className="w-8 h-8 text-sky-400" />
            {isAr ? 'التحكم الإحصائي في العمليات (SPC)' : 'Statistical Process Control (SPC)'}
          </h1>
          <p className="text-slate-400 mt-1 text-sm font-medium">
            {isAr ? 'رسم ومراقبة استقرار وقدرة خطوط الإنتاج وحساب حدود التحكم بدقة AIAG' : 'Monitor process stability, capability, and real-time AIAG control limits'}
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl shadow-lg">
          <button
            onClick={() => setActiveTab('control')}
            className={`px-4 sm:px-6 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
              activeTab === 'control' 
                ? 'bg-sky-500 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            {isAr ? 'شارتات التحكم' : 'Control Charts'}
          </button>
          
          <button
            onClick={() => setActiveTab('capability')}
            disabled={chartType !== 'xbar-r' && chartType !== 'i-mr'}
            className={`px-4 sm:px-6 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === 'capability' 
                ? 'bg-sky-500 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            {isAr ? 'تحليل القدرة' : 'Capability Analysis'}
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`px-4 sm:px-6 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
              activeTab === 'data' 
                ? 'bg-sky-500 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            {isAr ? 'جدول القراءات' : 'Data Table'}
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-sky-400 font-mono">
              {data.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      {activeTab === 'control' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Controls & Data Entry Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Chart Type Selector & Input Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h3 className="font-bold text-base mb-4 flex items-center justify-between text-white">
                <span className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-sky-400" />
                  {isAr ? 'نوع الشارت وإدخال البيانات' : 'Chart & Data Entry'}
                </span>
                <span className="text-xs text-sky-400 font-mono">{data.length} {isAr ? 'عينة' : 'samples'}</span>
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                    {isAr ? 'نوع شارت التحكم الإحصائي:' : 'SPC Chart Type:'}
                  </label>
                  <select 
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as ChartType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-sky-500 shadow-inner"
                  >
                    <option value="xbar-r">{isAr ? 'X-bar & R (متوسط ومدى العينات - للمتغيرات)' : 'X-bar & R (Variables)'}</option>
                    <option value="i-mr">{isAr ? 'I-MR (قراءة فردية ومدى متحرك - قياس تلو الآخر)' : 'I-MR (Individual Readings)'}</option>
                    <option value="p">{isAr ? 'p-Chart (نسبة الوحدات المعيبة)' : 'p-Chart (Proportion Defective)'}</option>
                    <option value="u">{isAr ? 'u-Chart (معدل العيوب لكل وحدة)' : 'u-Chart (Defects per Unit)'}</option>
                  </select>
                </div>

                {/* Helpful Tip about Chart Type & Quick Switch to I-MR */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
                  <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div className="w-full">
                    {chartType === 'xbar-r' && (
                      <div className="space-y-2">
                        <p className="text-[11px] leading-relaxed">
                          {isAr 
                            ? 'شارت X-bar & R يتطلب عدة قياسات لكل عينة لحساب مدى التباين (R). إذا كنت تسجل قطعة واحدة فقط كل مرة، استخدم شارت الأفراد (I-MR).' 
                            : 'X-bar & R requires multiple readings per sample. If recording 1 piece at a time, switch to I-MR.'}
                        </p>
                        <button
                          onClick={() => setChartType('i-mr')}
                          className="w-full py-1.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
                        >
                          <span>{isAr ? 'التبديل إلى شارت الأفراد (I-MR)' : 'Switch to I-MR Chart'}</span>
                        </button>
                      </div>
                    )}
                    {chartType === 'i-mr' && (
                      <p>{isAr ? 'شارت الأفراد مخصص للقياسات الفردية؛ يتم رسم كل قراءة فور تسجيلها وحساب المدى المتحرك تلقائياً.' : 'Designed for individual measurements. Plots each reading immediately with moving range.'}</p>
                    )}
                    {chartType === 'p' && (
                      <p>{isAr ? 'تتبع نسبة القطع المعيبة لكل وجبة إنتاج مفحوصة.' : 'Track the proportion of defective items per lot.'}</p>
                    )}
                    {chartType === 'u' && (
                      <p>{isAr ? 'تتبع إجمالي عدد العيوب المقاسة مقسوماً على حجم العينة.' : 'Track defects per unit count across inspection batches.'}</p>
                    )}
                  </div>
                </div>

                {/* Form Fields Tailored to Chart Type */}
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      {isAr ? 'رقم أو اسم العينة:' : 'Sample / Lot Label:'}
                    </label>
                    <input
                      type="text"
                      value={inputLabel}
                      onChange={e => setInputLabel(e.target.value)}
                      placeholder={`${isAr ? 'مثال: عينة' : 'Sample'} ${data.length + 1}`}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-sky-500 font-mono"
                    />
                  </div>

                  {chartType === 'xbar-r' && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] font-bold text-slate-400">
                          {isAr ? 'قيم القياسات داخل العينة:' : 'Subgroup Measurements:'}
                        </label>
                      </div>
                      <input
                        type="text"
                        value={inputValuesText}
                        onChange={e => setInputValuesText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddMeasurement()}
                        placeholder={isAr ? 'أدخل الأرقام مفصولة بفاصلة: 50.2, 49.8, 50.1' : 'Values e.g. 50.2, 49.8, 50.1, 50.4'}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-sky-500 font-mono"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        {isAr ? 'ملاحظة: أدخل من 2 إلى 5 قراءات للعينة الواحدة' : 'Enter 2 to 5 values per subgroup'}
                      </p>
                    </div>
                  )}

                  {chartType === 'i-mr' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        {isAr ? 'القيمة المقاسة:' : 'Measured Value:'}
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={inputValuesText}
                        onChange={e => setInputValuesText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddMeasurement()}
                        placeholder={isAr ? 'مثال: 25.4' : 'e.g. 25.4'}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-sky-500 font-mono"
                      />
                    </div>
                  )}

                  {chartType === 'p' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          {isAr ? 'عدد المعيب:' : 'Defectives:'}
                        </label>
                        <input
                          type="number"
                          value={inputDefective}
                          onChange={e => setInputDefective(e.target.value)}
                          placeholder="2"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          {isAr ? 'حجم العينة:' : 'Sample Size:'}
                        </label>
                        <input
                          type="number"
                          value={inputSampleSize}
                          onChange={e => setInputSampleSize(e.target.value)}
                          placeholder="100"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {chartType === 'u' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          {isAr ? 'عدد العيوب:' : 'Defects:'}
                        </label>
                        <input
                          type="number"
                          value={inputDefects}
                          onChange={e => setInputDefects(e.target.value)}
                          placeholder="3"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          {isAr ? 'عدد الوحدات:' : 'Units:'}
                        </label>
                        <input
                          type="number"
                          value={inputUnits}
                          onChange={e => setInputUnits(e.target.value)}
                          placeholder="10"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* Add Measurement Button */}
                  <button
                    onClick={handleAddMeasurement}
                    className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAr ? 'تسجيل القراءة ورسمها' : 'Record & Plot Reading'}</span>
                  </button>

                  {/* Quick Action Buttons (Undo, Clear) */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={handleUndoLast}
                      disabled={data.length === 0}
                      className="py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-700/60"
                      title={isAr ? 'حذف آخر قراءة تم تسجيلها' : 'Undo last recorded point'}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تراجع عن آخر قراءة' : 'Undo Last'}</span>
                    </button>

                    <button
                      onClick={handleClearData}
                      disabled={data.length === 0}
                      className="py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-red-500/20"
                      title={isAr ? 'مسح كافة القراءات' : 'Clear all'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'مسح الكل' : 'Clear All'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Statistical Summary Card */}
            {calculations && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-sky-400" />
                    {isAr ? 'المؤشرات الإحصائية الحالية' : 'Live Statistics'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {data.length} {isAr ? 'نقطة' : 'pts'}
                  </span>
                </h3>
                
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-400">{isAr ? 'المتوسط الإجمالي (Mean):' : 'Overall Mean:'}</span>
                    <span className="font-bold text-white">{calculations.overallMean.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-400">{isAr ? 'الانحراف المعياري (Sigma):' : 'Within Sigma:'}</span>
                    <span className="font-bold text-sky-400">{calculations.withinSigma.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-400">{isAr ? 'الحد الأعلى (UCL):' : 'Upper Limit (UCL):'}</span>
                    <span className="font-bold text-red-400">{calculations.primaryLimits.ucl.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-400">{isAr ? 'الحد الأدنى (LCL):' : 'Lower Limit (LCL):'}</span>
                    <span className="font-bold text-red-400">{calculations.primaryLimits.lcl.toFixed(3)}</span>
                  </div>
                </div>

                {/* Out of Control Warning / Safe Badge */}
                {calculations.primaryChart.some(p => p.outOfControl) ? (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <strong className="block">{isAr ? 'تنبيه جودة:' : 'Quality Alert:'}</strong> 
                      {isAr ? 'توجد نقاط خارج حدود التحكم الإحصائي المسموحة!' : 'Points detected outside 3-sigma control limits!'}
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{isAr ? 'العملية مستقرة وفي حالة تحكم إحصائي' : 'Process is stable and in statistical control'}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Charts Display Area */}
          <div className="lg:col-span-3 space-y-6">
            {calculations && calculations.primaryChart.length > 0 ? (
              <>
                {/* Primary Chart */}
                {renderControlChart(
                  calculations.primaryChart, 
                  calculations.primaryLimits, 
                  `${calculations.chartType} ${isAr ? '— الشارت الأساسي' : '— Primary Chart'}`,
                  '#0ea5e9'
                )}

                {/* Secondary Chart (Range or Moving Range) */}
                {calculations.secondaryChart && calculations.secondaryChart.length > 0 && (
                  renderControlChart(
                    calculations.secondaryChart, 
                    calculations.secondaryLimits || { ucl: 0, cl: 0, lcl: 0 }, 
                    chartType === 'xbar-r' 
                      ? (isAr ? 'R-Chart (شارت مدى التباين داخل العينة)' : 'R-Chart (Subgroup Range)')
                      : (isAr ? 'MR-Chart (شارت المدى المتحرك بين القراءات)' : 'MR-Chart (Moving Range)'),
                    '#14b8a6'
                  )
                )}
              </>
            ) : (
              <div className="h-[420px] bg-slate-900 border border-slate-800 border-dashed rounded-2xl flex flex-col items-center justify-center text-slate-400 p-6 text-center shadow-xl">
                <LineChartIcon className="w-16 h-16 mb-4 text-sky-400/40" />
                <p className="font-bold text-white text-lg mb-1">
                  {isAr ? 'لا توجد قراءات مسجلة حتى الآن' : 'No measurements recorded'}
                </p>
                <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                  {isAr 
                    ? 'ابدأ بتسجيل قراءات العينات الحقيقية من صالة الإنتاج عبر النموذج الجانبي لرسم شارتات التحكم وحساب الحدود الإحصائية.' 
                    : 'Enter real sample readings from the shopfloor using the form on the left to plot control charts.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Capability Analysis Tab */}
      {activeTab === 'capability' && (
        <div className="space-y-6">
          {/* Spec Limits Input Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap gap-6 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 font-mono">
                {isAr ? 'الحد الأدنى للمواصفة (LSL):' : 'Lower Spec Limit (LSL):'}
              </label>
              <input 
                type="number" 
                value={lsl} 
                onChange={e => setLsl(Number(e.target.value))} 
                className="w-36 bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2 font-mono text-sm outline-none focus:border-sky-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 font-mono">
                {isAr ? 'القيمة المستهدفة (Target):' : 'Target Value:'}
              </label>
              <input 
                type="number" 
                value={target} 
                onChange={e => setTarget(Number(e.target.value))} 
                className="w-36 bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2 font-mono text-sm outline-none focus:border-sky-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 font-mono">
                {isAr ? 'الحد الأعلى للمواصفة (USL):' : 'Upper Spec Limit (USL):'}
              </label>
              <input 
                type="number" 
                value={usl} 
                onChange={e => setUsl(Number(e.target.value))} 
                className="w-36 bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2 font-mono text-sm outline-none focus:border-sky-500" 
              />
            </div>
            
            <div className="text-xs text-slate-400 pb-2">
              <span className="text-sky-400 font-bold">{isAr ? 'معيار القبول:' : 'Acceptance:'}</span> Cpk &ge; 1.33 {isAr ? 'للعمليات القادرة والمستقرة' : 'for capable processes'}
            </div>
          </div>

          {capabilityData ? (
            <>
              {/* Capability KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-6 rounded-2xl border ${getCapabilityColor(capabilityData.indices.cp)} shadow-lg`}>
                  <p className="text-xs font-bold uppercase opacity-80">{isAr ? 'مؤشر القدرة المحتملة (Cp)' : 'Potential Capability (Cp)'}</p>
                  <p className="text-3xl font-black mt-2 font-mono">{capabilityData.indices.cp.toFixed(2)}</p>
                  <p className="text-[11px] mt-1 opacity-75">{isAr ? 'يقيس تشتت العملية مقارنة بمدى المواصفة' : 'Process spread vs tolerance width'}</p>
                </div>
                
                <div className={`p-6 rounded-2xl border ${getCapabilityColor(capabilityData.indices.cpk)} shadow-lg`}>
                  <p className="text-xs font-bold uppercase opacity-80">{isAr ? 'مؤشر قدرة العملية الفعلي (Cpk)' : 'Actual Capability (Cpk)'}</p>
                  <p className="text-3xl font-black mt-2 font-mono">{capabilityData.indices.cpk.toFixed(2)}</p>
                  <p className="text-[11px] mt-1 opacity-75">
                    {capabilityData.indices.cpk >= 1.33 
                      ? (isAr ? 'العملية قادرة ومطابقة للمواصفات' : 'Process is fully capable')
                      : (isAr ? 'تحتاج لتحسين تقليل التشتت' : 'Action needed to center/reduce variance')}
                  </p>
                </div>

                <div className={`p-6 rounded-2xl border ${getCapabilityColor(capabilityData.indices.pp)} shadow-lg`}>
                  <p className="text-xs font-bold uppercase opacity-80">{isAr ? 'مؤشر الأداء الكلي (Pp)' : 'Overall Performance (Pp)'}</p>
                  <p className="text-3xl font-black mt-2 font-mono">{capabilityData.indices.pp.toFixed(2)}</p>
                  <p className="text-[11px] mt-1 opacity-75">{isAr ? 'مبني على الانحراف المعياري الكلي' : 'Based on overall population sigma'}</p>
                </div>

                <div className={`p-6 rounded-2xl border ${getCapabilityColor(capabilityData.indices.ppk)} shadow-lg`}>
                  <p className="text-xs font-bold uppercase opacity-80">{isAr ? 'مؤشر أداء العملية الفعلي (Ppk)' : 'Actual Performance (Ppk)'}</p>
                  <p className="text-3xl font-black mt-2 font-mono">{capabilityData.indices.ppk.toFixed(2)}</p>
                  <p className="text-[11px] mt-1 opacity-75">{isAr ? 'معدل العيوب المتوقع بالمليون: ' : 'PPM Defect: '} {capabilityData.indices.ppmTotal.toFixed(0)}</p>
                </div>
              </div>

              {/* Histogram Distribution Chart */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-sky-400" />
                    {isAr ? 'توزيع القياسات والتطابق مع منحنى التوزيع الطبيعي (Histogram)' : 'Measurements Distribution (Histogram)'}
                  </h3>
                  <div className="text-xs font-mono text-slate-400">
                    Mean: <strong>{capabilityData.indices.overallMean.toFixed(2)}</strong> | Sigma: <strong>{capabilityData.indices.withinSigma.toFixed(3)}</strong>
                  </div>
                </div>
                
                <div className="h-[380px] w-full" style={{ touchAction: 'pan-y' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={capabilityData.histogram} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                      <XAxis dataKey="binLabel" tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#475569" />
                      <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#475569" />
                      <YAxis yAxisId="right" orientation="right" hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                      />
                      
                      <Bar yAxisId="left" dataKey="count" fill="#0ea5e9" opacity={0.75} radius={[4, 4, 0, 0]} name={isAr ? 'تكرار العينات' : 'Sample Count'} />
                      <Area yAxisId="right" type="monotone" dataKey="normalY" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.15} strokeWidth={2.5} name={isAr ? 'التوزيع الطبيعي المتوقع' : 'Normal Curve'} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 shadow-xl">
              <p className="font-bold text-white mb-2">{isAr ? 'بيانات غير كافية لحساب القدرة' : 'Insufficient data for capability analysis'}</p>
              <p className="text-xs">{isAr ? 'يرجى تسجيل قراءات في شارت X-bar أو I-MR أولاً.' : 'Please record continuous measurements in X-bar or I-MR chart first.'}</p>
            </div>
          )}
        </div>
      )}

      {/* Data Table Tab (View, inspect, and delete individual rows) */}
      {activeTab === 'data' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TableIcon className="w-5 h-5 text-sky-400" />
                {isAr ? 'مصفوفة القراءات المسجلة' : 'Recorded Measurements Table'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr ? `إجمالي العينات في شارت (${chartType}): ${data.length}` : `Total samples in (${chartType}) chart: ${data.length}`}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleClearData}
                disabled={data.length === 0}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 disabled:opacity-30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-red-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'مسح كافة القراءات' : 'Clear All'}</span>
              </button>
            </div>
          </div>

          {data.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">{isAr ? 'اسم العينة' : 'Label'}</th>
                    <th className="p-3">{isAr ? 'وقت التسجيل' : 'Timestamp'}</th>
                    <th className="p-3">{isAr ? 'البيانات المسجلة' : 'Recorded Data'}</th>
                    <th className="p-3">{isAr ? 'المتوسط / القيمة' : 'Mean / Value'}</th>
                    <th className="p-3 text-center">{isAr ? 'إجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.map((row, idx) => {
                    let meanVal: number | string = '—';
                    let dataDisplay: string = '';

                    if (row.values && row.values.length > 0) {
                      const sum = row.values.reduce((s, v) => s + v, 0);
                      meanVal = (sum / row.values.length).toFixed(3);
                      dataDisplay = row.values.join(', ');
                    } else if (row.value !== undefined) {
                      meanVal = row.value.toFixed(3);
                      dataDisplay = row.value.toString();
                    } else if (row.defective !== undefined) {
                      meanVal = `${row.defective} / ${row.sampleSize} (${((row.defective / (row.sampleSize || 1)) * 100).toFixed(1)}%)`;
                      dataDisplay = `Def: ${row.defective}, N: ${row.sampleSize}`;
                    } else if (row.defects !== undefined) {
                      meanVal = `${row.defects} / ${row.units} (${(row.defects / (row.units || 1)).toFixed(2)} d/u)`;
                      dataDisplay = `Defects: ${row.defects}, Units: ${row.units}`;
                    }

                    return (
                      <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 text-center text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-bold text-white">{row.label}</td>
                        <td className="p-3 text-slate-400">{row.timestamp || '—'}</td>
                        <td className="p-3 text-sky-400 max-w-xs truncate">{dataDisplay}</td>
                        <td className="p-3 font-bold text-emerald-400">{meanVal}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteRow(row.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                            title={isAr ? 'حذف هذه القراءة' : 'Delete this row'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <p>{isAr ? 'لا توجد قراءات في هذا الجدول حتى الآن.' : 'No rows in this table yet.'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
