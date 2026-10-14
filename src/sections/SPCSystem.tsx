import { useState, useMemo } from 'react';
import { 
  Activity, BarChart3, LineChart as LineChartIcon, AlertCircle, 
  Settings2, Plus, Trash2
} from 'lucide-react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Area
} from 'recharts';
import { useTranslation } from '@/utils/translations';
import { toast } from 'sonner';

import { 
  calculateXbarR, calculateIMR, calculatePChart, calculateUChart,
  calculateCapability, buildHistogramData, type SpcSubgroup
} from '@/services/spcEngine';

type SpcTab = 'control' | 'capability';
type ChartType = 'xbar-r' | 'i-mr' | 'p' | 'u';

export interface SpcMeasurementRow {
  label: string;
  values?: number[]; // For X-bar
  value?: number; // For I-MR
  defective?: number; // For P
  sampleSize?: number; // For P
  defects?: number; // For U
  units?: number; // For U
}

export default function SPCSystem() {
  const { language } = useTranslation();
  
  const [activeTab, setActiveTab] = useState<SpcTab>('control');
  const [chartType, setChartType] = useState<ChartType>('xbar-r');
  const [data, setData] = useState<SpcMeasurementRow[]>(() => {
    try {
      const saved = localStorage.getItem('qms_spc_real_measurements');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [inputValuesText, setInputValuesText] = useState('');
  const [inputLabel, setInputLabel] = useState('');
  const subgroupSize = 5;
  
  // Capability specs
  const [usl, setUsl] = useState<number>(55);
  const [lsl, setLsl] = useState<number>(45);
  const [target, setTarget] = useState<number>(50);

  const handleAddMeasurement = () => {
    if (!inputValuesText.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال قيم القياس' : 'Please enter measurement values');
      return;
    }

    const label = inputLabel.trim() || `Sample-${data.length + 1}`;
    let newRow: SpcMeasurementRow;

    if (chartType === 'xbar-r') {
      const numbers = inputValuesText
        .split(/[\s,]+/)
        .map(v => parseFloat(v))
        .filter(v => !isNaN(v));

      if (numbers.length === 0) {
        toast.error(language === 'ar' ? 'أرقام غير صالحة' : 'Invalid numbers');
        return;
      }
      newRow = { label, values: numbers };
    } else if (chartType === 'i-mr') {
      const val = parseFloat(inputValuesText.trim());
      if (isNaN(val)) {
        toast.error(language === 'ar' ? 'قيمة غير صالحة' : 'Invalid value');
        return;
      }
      newRow = { label, value: val };
    } else if (chartType === 'p') {
      const parts = inputValuesText.split(/[\s,/]+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
      const defective = parts[0] || 0;
      const sampleSize = parts[1] || 100;
      newRow = { label, defective, sampleSize };
    } else {
      const parts = inputValuesText.split(/[\s,/]+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
      const defects = parts[0] || 0;
      const units = parts[1] || 1;
      newRow = { label, defects, units };
    }

    const updated = [...data, newRow];
    setData(updated);
    try {
      localStorage.setItem('qms_spc_real_measurements', JSON.stringify(updated));
    } catch {}
    setInputValuesText('');
    setInputLabel('');
    toast.success(language === 'ar' ? 'تمت إضافة قراءة العينة بنجاح' : 'Measurement added successfully');
  };

  const handleClearData = () => {
    setData([]);
    try {
      localStorage.removeItem('qms_spc_real_measurements');
    } catch {}
    toast.info(language === 'ar' ? 'تم مسح سجل القياسات' : 'Measurements cleared');
  };

  // Run Calculations
  const calculations = useMemo(() => {
    if (data.length === 0) return null;
    try {
      if (chartType === 'xbar-r') {
        const subgroups: SpcSubgroup[] = data.map((d, i) => ({
          id: i.toString(), label: d.label, values: d.values || []
        }));
        return calculateXbarR(subgroups);
      } else if (chartType === 'i-mr') {
        const mapped = data.map(d => ({ label: d.label, value: d.value || 0 }));
        return calculateIMR(mapped);
      } else if (chartType === 'p') {
        const mapped = data.map(d => ({ label: d.label, defective: d.defective || 0, sampleSize: d.sampleSize || 100 }));
        return calculatePChart(mapped);
      } else if (chartType === 'u') {
        const mapped = data.map(d => ({ label: d.label, defects: d.defects || 0, units: d.units || 1 }));
        return calculateUChart(mapped);
      }
    } catch (err: any) {
      console.error(err);
      return null;
    }
    return null;
  }, [data, chartType, subgroupSize]);

  // Capability calculations
  const capabilityData = useMemo(() => {
    if (chartType !== 'xbar-r' && chartType !== 'i-mr') return null;
    if (!calculations) return null;
    
    let allValues: number[] = [];
    if (chartType === 'xbar-r') {
      allValues = data.flatMap(d => d.values || []);
    } else {
      allValues = data.map(d => d.value || 0);
    }
    
    if (allValues.length === 0) return null;
    
    return {
      indices: calculateCapability(allValues, usl, lsl, target, calculations.withinSigma),
      histogram: buildHistogramData(allValues)
    };
  }, [data, chartType, calculations, usl, lsl, target]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload || {};
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="font-bold mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p><span className="text-slate-500">Value:</span> {payload[0]?.value?.toFixed(3)}</p>
            {dataPoint?.ucl !== undefined && <p><span className="text-red-500">UCL:</span> {dataPoint.ucl?.toFixed(3)}</p>}
            {dataPoint?.cl !== undefined && <p><span className="text-green-500">Center:</span> {dataPoint.cl?.toFixed(3)}</p>}
            {dataPoint?.lcl !== undefined && <p><span className="text-red-500">LCL:</span> {dataPoint.lcl?.toFixed(3)}</p>}
            
            {dataPoint?.violations && dataPoint.violations.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                <p className="text-red-500 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Violations:
                </p>
                <ul className="list-disc pl-4 text-xs text-red-400">
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

  const renderControlChart = (chartData: any[], limits: any, title: string, dataKey: string = 'value') => {
    if (!chartData || chartData.length === 0) return null;
    
    // Add dummy point for connecting out-of-control dots if needed, but Recharts dot customizer works better
    return (
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm mb-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-[var(--industrial-primary)]" />
          {title}
        </h3>
        
        <div className="h-[300px] w-full" style={{ touchAction: 'pan-y' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} style={{ touchAction: 'pan-y' }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
              <XAxis dataKey="label" tick={{fontSize: 12}} />
              <YAxis domain={['auto', 'auto']} tick={{fontSize: 12}} />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Control Limits */}
              {limits.ucl !== undefined && <ReferenceLine y={limits.ucl} stroke="red" strokeDasharray="5 5" label={{ value: 'UCL', position: 'insideTopRight', fill: 'red' }} />}
              {limits.cl !== undefined && <ReferenceLine y={limits.cl} stroke="green" strokeDasharray="3 3" label={{ value: 'CL', position: 'insideTopRight', fill: 'green' }} />}
              {limits.lcl !== undefined && <ReferenceLine y={limits.lcl} stroke="red" strokeDasharray="5 5" label={{ value: 'LCL', position: 'insideBottomRight', fill: 'red' }} />}
              
              {/* Data Line */}
              <Line 
                type="monotone" 
                dataKey={dataKey} 
                stroke="var(--industrial-primary)" 
                strokeWidth={2}
                dot={((props: any) => {
                  const { cx, cy, payload } = props;
                  if (!cx || !cy) return <circle key={`dot-${props.index}`} />;
                  const isViolation = payload?.outOfControl || (payload?.violations && payload.violations.length > 0);
                  return (
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={isViolation ? 6 : 4} 
                      fill={isViolation ? "red" : "var(--industrial-primary)"} 
                      stroke="white" 
                      strokeWidth={2} 
                      key={`dot-${props.index}`}
                    />
                  );
                }) as any}
                activeDot={{ r: 8 }} 
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const getCapabilityColor = (val: number) => {
    if (val >= 1.33) return 'text-green-500 bg-green-500/10 border-green-500/20';
    if (val >= 1.0) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-500 bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 pt-24 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <LineChartIcon className="w-8 h-8 text-[var(--industrial-primary)]" />
            {language === 'ar' ? 'التحكم الإحصائي (SPC)' : 'Statistical Process Control'}
          </h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1 font-medium">
            {language === 'ar' ? 'مراقبة استقرار وقدرة العمليات' : 'Monitor process stability and capability'}
          </p>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('control')}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'control' ? 'bg-white dark:bg-[var(--industrial-primary)] text-[var(--industrial-primary)] dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white'}`}
          >
            {language === 'ar' ? 'شارتات التحكم' : 'Control Charts'}
          </button>
          <button
            onClick={() => setActiveTab('capability')}
            disabled={chartType !== 'xbar-r' && chartType !== 'i-mr'}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all disabled:opacity-30 ${activeTab === 'capability' ? 'bg-white dark:bg-[var(--industrial-primary)] text-[var(--industrial-primary)] dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white'}`}
          >
            {language === 'ar' ? 'تحليل القدرة' : 'Capability Analysis'}
          </button>
        </div>
      </div>

      {activeTab === 'control' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-[var(--industrial-primary)]" />
                {language === 'ar' ? 'إعدادات الشارت' : 'Chart Settings'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    {language === 'ar' ? 'نوع الشارت' : 'Chart Type'}
                  </label>
                  <select 
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as ChartType)}
                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-[var(--industrial-primary)]"
                  >
                    <option value="xbar-r">X-bar & R (Variables)</option>
                    <option value="i-mr">I-MR (Individual Variables)</option>
                    <option value="p">p Chart (Proportion Defective)</option>
                    <option value="u">u Chart (Defects per Unit)</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-2.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    {language === 'ar' ? 'إدخال قياس عينة حقيقية:' : 'Add Real Measurement:'}
                  </span>
                  <input
                    type="text"
                    value={inputLabel}
                    onChange={e => setInputLabel(e.target.value)}
                    placeholder={language === 'ar' ? 'اسم/رقم العينة (مثال: عينة 1)' : 'Sample label (e.g. Lot-01)'}
                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[var(--industrial-primary)]"
                  />
                  <input
                    type="text"
                    value={inputValuesText}
                    onChange={e => setInputValuesText(e.target.value)}
                    placeholder={
                      chartType === 'xbar-r'
                        ? (language === 'ar' ? 'القيم مفصولة بفاصلة: 50.2, 49.8, 50.1' : 'Values e.g. 50.2, 49.8, 50.1')
                        : chartType === 'i-mr'
                        ? (language === 'ar' ? 'القيمة المقاسة: 100.5' : 'Value e.g. 100.5')
                        : chartType === 'p'
                        ? (language === 'ar' ? 'المعيب / حجم العينة: 5 / 100' : 'Defective / Size: 5 / 100')
                        : (language === 'ar' ? 'العيوب / عدد الوحدات: 3 / 1' : 'Defects / Units: 3 / 1')
                    }
                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[var(--industrial-primary)]"
                  />
                  <button
                    onClick={handleAddMeasurement}
                    className="w-full py-2 bg-[var(--industrial-primary)] hover:opacity-90 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'تسجيل القراءة' : 'Record Reading'}</span>
                  </button>

                  {data.length > 0 && (
                    <button
                      onClick={handleClearData}
                      className="w-full py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'مسح كافة القراءات' : 'Clear All Readings'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {calculations && (
              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[var(--industrial-primary)]" />
                  {language === 'ar' ? 'ملخص إحصائي' : 'Statistical Summary'}
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                    <span className="text-sm text-slate-500">{language === 'ar' ? 'المتوسط الإجمالي' : 'Overall Mean'}</span>
                    <span className="font-bold">{calculations.overallMean.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                    <span className="text-sm text-slate-500">{language === 'ar' ? 'الانحراف (الداخلي)' : 'Within Sigma'}</span>
                    <span className="font-bold">{calculations.withinSigma.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                    <span className="text-sm text-slate-500">{language === 'ar' ? 'الانحراف (الكلي)' : 'Overall Sigma'}</span>
                    <span className="font-bold">{calculations.overallSigma.toFixed(3)}</span>
                  </div>
                  
                  {calculations.primaryChart.some(p => p.outOfControl) && (
                    <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        <strong>{language === 'ar' ? 'تحذير' : 'Warning'}:</strong> 
                        {language === 'ar' ? ' توجد نقاط خارج حدود التحكم!' : ' Process is out of statistical control!'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Charts Area */}
          <div className="lg:col-span-3">
            {calculations ? (
              <>
                {renderControlChart(calculations.primaryChart, calculations.primaryLimits, calculations.chartType + ' Chart')}
                {calculations.secondaryChart && (
                  renderControlChart(calculations.secondaryChart, calculations.secondaryLimits!, chartType === 'xbar-r' ? 'R Chart' : 'MR Chart')
                )}
              </>
            ) : (
              <div className="h-[400px] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 border-dashed rounded-2xl flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <LineChartIcon className="w-16 h-16 mb-4 opacity-50" />
                <p className="font-bold text-slate-300 mb-1">{language === 'ar' ? 'لا توجد قراءات مسجلة' : 'No measurements recorded'}</p>
                <p className="text-xs text-slate-500 max-w-sm">{language === 'ar' ? 'قم بإدخال قراءات العينات الحقيقية من صالة الإنتاج لعرض كارتات التحكم الإحصائي ومؤشرات القدرة' : 'Enter genuine sample readings from the shopfloor to display SPC control charts and capability indices'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'capability' && capabilityData && (
        <div className="space-y-6">
          {/* Spec Limits Input */}
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">LSL</label>
              <input type="number" value={lsl} onChange={e => setLsl(Number(e.target.value))} className="w-32 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Target</label>
              <input type="number" value={target} onChange={e => setTarget(Number(e.target.value))} className="w-32 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">USL</label>
              <input type="number" value={usl} onChange={e => setUsl(Number(e.target.value))} className="w-32 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 outline-none" />
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-6 rounded-2xl border ${getCapabilityColor(capabilityData.indices.cp)}`}>
              <p className="text-sm font-bold uppercase opacity-80">Cp</p>
              <p className="text-3xl font-black mt-2">{capabilityData.indices.cp.toFixed(2)}</p>
            </div>
            <div className={`p-6 rounded-2xl border ${getCapabilityColor(capabilityData.indices.cpk)}`}>
              <p className="text-sm font-bold uppercase opacity-80">Cpk</p>
              <p className="text-3xl font-black mt-2">{capabilityData.indices.cpk.toFixed(2)}</p>
            </div>
            <div className={`p-6 rounded-2xl border ${getCapabilityColor(capabilityData.indices.pp)}`}>
              <p className="text-sm font-bold uppercase opacity-80">Pp</p>
              <p className="text-3xl font-black mt-2">{capabilityData.indices.pp.toFixed(2)}</p>
            </div>
            <div className={`p-6 rounded-2xl border ${getCapabilityColor(capabilityData.indices.ppk)}`}>
              <p className="text-sm font-bold uppercase opacity-80">Ppk</p>
              <p className="text-3xl font-black mt-2">{capabilityData.indices.ppk.toFixed(2)}</p>
            </div>
          </div>

          {/* Histogram */}
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[var(--industrial-primary)]" />
              {language === 'ar' ? 'توزيع القياسات' : 'Measurements Distribution (Histogram)'}
            </h3>
            
            <div className="h-[400px] w-full" style={{ touchAction: 'pan-y' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={capabilityData.histogram} margin={{ top: 20, right: 30, left: 20, bottom: 20 }} style={{ touchAction: 'pan-y' }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="binLabel" tick={{fontSize: 12}} />
                  <YAxis yAxisId="left" domain={['auto', 'auto']} />
                  <YAxis yAxisId="right" orientation="right" hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px', color: 'white' }}
                  />
                  
                  <ReferenceLine x={lsl.toString()} stroke="red" strokeDasharray="5 5" label={{ value: 'LSL', position: 'insideTopLeft', fill: 'red' }} />
                  <ReferenceLine x={usl.toString()} stroke="red" strokeDasharray="5 5" label={{ value: 'USL', position: 'insideTopRight', fill: 'red' }} />
                  {target && <ReferenceLine x={target.toString()} stroke="green" strokeDasharray="3 3" label={{ value: 'Target', position: 'insideTop', fill: 'green' }} />}
                  
                  <Bar yAxisId="left" dataKey="frequency" fill="var(--industrial-primary)" opacity={0.6} />
                  <Area yAxisId="right" type="monotone" dataKey="normalY" stroke="var(--industrial-secondary)" fill="var(--industrial-secondary)" fillOpacity={0.1} strokeWidth={3} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
