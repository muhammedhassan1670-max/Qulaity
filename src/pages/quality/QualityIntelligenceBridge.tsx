import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Brain, RefreshCw, Maximize2, Minimize2, 
  Globe, Activity, Cpu, Sliders, Target, ShieldCheck,
  ClipboardCheck, AlertTriangle, ShieldAlert, CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  extractLiveQmsDataset, 
  getRealPlatformStats,
  sendDatasetToUdip, 
  switchUdipTab, 
  setUdipLang,
  type RealDataScope
} from '@/services/qmsIntelligenceBridge';

// Native React Defect Prediction & Inference Studio
import DefectPredictionStudio from '@/sections/AIIntelligence';

export type IntelligenceTab = 'predict' | 'models' | 'forecast' | 'what-if' | 'decision' | 'summary' | 'copilot';

export default function QualityIntelligenceBridge() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeTab, setActiveTab] = useState<IntelligenceTab>('predict');
  const [activeScope, setActiveScope] = useState<RealDataScope>('ALL');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeDatasetLabel, setActiveDatasetLabel] = useState<string>('سجلات المصنع الفعلية (100% Real Records)');
  const [rowCount, setRowCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Real live stats from platform localStorage
  const stats = useMemo(() => getRealPlatformStats(), [isSyncing]);

  // Sync real platform data once iframe is ready
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'UDIP_READY') {
        handleSyncRealData('ALL', false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSyncRealData = (scope: RealDataScope = activeScope, notify: boolean = true) => {
    setIsSyncing(true);
    setActiveScope(scope);
    try {
      const realData = extractLiveQmsDataset(scope);
      setRowCount(realData.rows.length);
      const scopeLabels: Record<RealDataScope, string> = {
        ALL: 'جميع سجلات المصنع الفعلية (All Real Records)',
        INSPECTIONS: 'فحوصات الجودة الواردة والنهائية فقط',
        SHOPFLOOR: 'سجلات عيوب خطوط الإنتاج والورديات فقط',
        NCR_CAPA: 'حالات عدم المطابقة وإجراءات CAPA/8D فقط',
        COMPLAINTS: 'شكاوى العملاء ومرتجعات الميدان فقط'
      };
      setActiveDatasetLabel(scopeLabels[scope]);

      if (iframeRef.current && activeTab !== 'predict') {
        const udipTabMap: Record<string, string> = {
          models: 'models',
          forecast: 'future-risk',
          'what-if': 'scenarios',
          decision: 'actions',
          summary: 'summary',
          copilot: 'copilot'
        };
        sendDatasetToUdip(iframeRef.current, realData, udipTabMap[activeTab] || 'models');
      }

      if (notify) {
        toast.success(`تمت مزامنة ${realData.rows.length} سجل جودة حقيقي بنجاح من المنصة`);
      }
    } catch (e: any) {
      toast.error('حدث خطأ أثناء مزامنة بيانات المنصة: ' + (e?.message || ''));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTabChange = (tab: IntelligenceTab) => {
    setActiveTab(tab);
    if (tab !== 'predict') {
      const tabMap: Record<string, string> = {
        models: 'models',
        forecast: 'future-risk',
        'what-if': 'scenarios',
        decision: 'actions',
        summary: 'summary',
        copilot: 'copilot'
      };
      if (iframeRef.current) {
        switchUdipTab(iframeRef.current, tabMap[tab] || 'models');
      }
    }
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'ar' ? 'en' : 'ar';
    setLang(nextLang);
    if (iframeRef.current) {
      setUdipLang(iframeRef.current, nextLang);
    }
    toast.info(`تم تبديل لغة الواجهة إلى: ${nextLang === 'ar' ? 'العربية' : 'English'}`);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        toast.error(`تعذر الدخول في وضع ملء الشاشة: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleReloadEngine = () => {
    handleSyncRealData(activeScope, true);
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={`flex flex-col bg-slate-950 text-slate-100 ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen p-0 m-0' : 'min-h-[calc(100vh-4rem)] p-3 lg:p-4'
      }`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Top Industrial Quality AI Command Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-xl backdrop-blur-md mb-3 flex flex-col gap-3">
        {/* Row 1: Brand & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-purple-500/20">
              <Brain className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  منظومة الذكاء الاصطناعي وتعلم الآلة الشاملة (Quality 4.0 AI Hub)
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 bg-emerald-500/10 text-xs">
                    🟢 مربوطة 100% بسجلات المصنع الفعلية
                  </Badge>
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                استوديو توقع العيوب الفوري والسبب الجذري، مقارنة نماذج الـ Auto-ML، والتنبؤ الزمني بالمخاطر اعتماداً حصرياً على بيانات خطوط الإنتاج والفحوصات
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-xs h-8"
              title="تبديل لغة واجهة محرك الذكاء الاصطناعي"
            >
              <Globe className="w-3.5 h-3.5 ml-1.5 text-cyan-400" />
              {lang === 'ar' ? 'English' : 'عربي'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReloadEngine}
              className="bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-xs h-8 text-slate-300"
              title="إعادة مزامنة البيانات الحية وتحديث النماذج"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-xs h-8 text-slate-300"
              title={isFullscreen ? 'الخروج من ملء الشاشة' : 'ملء الشاشة بالكامل'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {/* Row 2: Live Platform Records Counters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              سجلات المصنع الفعلية المغذية للموديلات:
            </span>
            <Badge variant="outline" className="bg-slate-900 border-slate-700 text-slate-200 text-xs py-0.5">
              ⚠️ {stats.defectLogsCount} عيوب خط الإنتاج
            </Badge>
            <Badge variant="outline" className="bg-slate-900 border-slate-700 text-slate-200 text-xs py-0.5">
              📋 {stats.inspectionsCount} فحص وارد وتشغيلي
            </Badge>
            <Badge variant="outline" className="bg-slate-900 border-slate-700 text-slate-200 text-xs py-0.5">
              🚨 {stats.ncrCount} تقارير عدم مطابقة NCR
            </Badge>
            <Badge variant="outline" className="bg-slate-900 border-slate-700 text-slate-200 text-xs py-0.5">
              🛡️ {stats.capaCount + stats.eightDCount} إجراءات تصحيحية CAPA و 8D
            </Badge>
            <Badge variant="outline" className="bg-slate-900 border-slate-700 text-slate-200 text-xs py-0.5">
              📦 {stats.complaintsCount} شكاوى عملاء
            </Badge>
            <Badge variant="outline" className="bg-emerald-950/60 border-emerald-700/60 text-emerald-300 text-xs py-0.5 font-bold">
              إجمالي: {stats.totalRealRecords} سجل فعلي 100%
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleSyncRealData(activeScope, true)}
              disabled={isSyncing}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-8 shadow-sm flex items-center gap-1.5"
            >
              <Activity className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              مزامنة لحظية للبيانات
            </Button>
          </div>
        </div>

        {/* Row 3: Scopes & Filtered Ingestion */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 font-medium ml-1">نطاق السجلات المستخدم في التعلم:</span>
            {[
              { id: 'ALL', label: `كل سجلات المصنع (${stats.totalRealRecords})`, icon: Activity },
              { id: 'SHOPFLOOR', label: `عيوب الخطوط والورديات (${stats.defectLogsCount})`, icon: AlertTriangle },
              { id: 'INSPECTIONS', label: `فحوصات الجودة (${stats.inspectionsCount})`, icon: ClipboardCheck },
              { id: 'NCR_CAPA', label: `NCR و CAPA و 8D (${stats.ncrCount + stats.capaCount + stats.eightDCount})`, icon: ShieldAlert },
              { id: 'COMPLAINTS', label: `شكاوى العملاء (${stats.complaintsCount})`, icon: Target },
            ].map((scope) => {
              const Icon = scope.icon;
              const isSelected = activeScope === scope.id;
              return (
                <button
                  key={scope.id}
                  type="button"
                  onClick={() => handleSyncRealData(scope.id as RealDataScope, true)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{scope.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">حالة الربط:</span>
            <Badge variant="secondary" className="bg-purple-950/80 text-purple-300 border border-purple-800/40 text-[11px]">
              {activeDatasetLabel} ({rowCount || stats.totalRealRecords} سجل)
            </Badge>
          </div>
        </div>

        {/* Row 4: Quality Intelligence Unified Navigation Capabilities */}
        <div className="flex items-center overflow-x-auto gap-1.5 pt-1 border-t border-slate-800/60">
          {[
            { id: 'predict', label: 'استوديو توقع العيوب والسبب الجذري', icon: Sparkles, badge: 'Live Inference' },
            { id: 'models', label: 'مقارنة نماذج تعلم الآلة (Auto-ML)', icon: Cpu, badge: 'Multi-Model' },
            { id: 'forecast', label: 'استوديو التنبؤ الزمني (Forecast)', icon: Activity, badge: 'Time-Series' },
            { id: 'what-if', label: 'مختبر المحاكاة (What-If Lab)', icon: Sliders, badge: 'Simulation' },
            { id: 'decision', label: 'الذكاء القراري ومصفوفة 5M للأسباب الجذرية', icon: Target, badge: '5M Matrix' },
            { id: 'summary', label: 'الملخص التنفيذي ومساعد الجودة الذكي', icon: ShieldCheck, badge: 'Executive' },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabChange(item.id as IntelligenceTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                  isSelected ? 'bg-purple-900/80 text-purple-200' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Intelligent Workspace Area */}
      <div className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative shadow-2xl min-h-[750px]">
        {activeTab === 'predict' ? (
          <div className="h-full overflow-y-auto p-4 bg-slate-900">
            <DefectPredictionStudio />
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={`/quality-intelligence/index.html?tab=${
              activeTab === 'forecast' ? 'future-risk' : activeTab === 'what-if' ? 'scenarios' : activeTab === 'decision' ? 'actions' : activeTab
            }&sample=qms_all&lang=${lang}`}
            title="Universal Data Intelligence Platform"
            className="w-full h-full border-0 absolute inset-0 bg-[#070b14]"
            allow="fullscreen; clipboard-read; clipboard-write; microphone"
            onLoad={() => {
              setTimeout(() => {
                handleSyncRealData(activeScope, false);
              }, 400);
            }}
          />
        )}
      </div>
    </div>
  );
}
