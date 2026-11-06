import { useState, useRef, useEffect } from 'react';
import { 
  Brain, RefreshCw, Database, Maximize2, Minimize2, 
  Globe, Activity, Cpu, Sliders, Target, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  extractLiveQmsDataset, 
  fetchFactoryMasterDataset, 
  sendDatasetToUdip, 
  switchUdipTab, 
  setUdipLang
} from '@/services/qmsIntelligenceBridge';

// Fallback to classic statistical prediction if needed
import ClassicAIIntelligence from '@/sections/AIIntelligence';

export default function QualityIntelligenceBridge() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeTab, setActiveTab] = useState<'models' | 'forecast' | 'what-if' | 'decision' | 'summary' | 'copilot'>('models');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeDatasetLabel, setActiveDatasetLabel] = useState<string>('لم يتم تحميل بيانات بعد');
  const [rowCount, setRowCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [mode, setMode] = useState<'udip' | 'classic'>('udip');
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-sync live platform data once iframe is ready
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'UDIP_READY') {
        handleSyncLiveQms(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSyncLiveQms = (notify: boolean = true) => {
    setIsSyncing(true);
    try {
      const liveData = extractLiveQmsDataset();
      const success = sendDatasetToUdip(iframeRef.current, liveData, activeTab);
      if (success) {
        setActiveDatasetLabel('بيانات المنصة الحية (Live QMS Records)');
        setRowCount(liveData.rows.length);
        if (notify) {
          toast.success(`تمت مزامنة ${liveData.rows.length} سجل جودة حي بنجاح مع محرك الذكاء الاصطناعي`);
        }
      }
    } catch (e: any) {
      toast.error('حدث خطأ أثناء مزامنة بيانات المنصة: ' + (e?.message || ''));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoadFactoryMaster = async () => {
    setIsSyncing(true);
    try {
      toast.loading('جاري تحميل بيانات المصنع القياسية (500 سجل)...', { id: 'load-master' });
      const masterData = await fetchFactoryMasterDataset();
      sendDatasetToUdip(iframeRef.current, masterData, activeTab);
      setActiveDatasetLabel('بيانات المصنع المعتمدة (500 سجل - Automotive/Industrial)');
      setRowCount(masterData.rows.length);
      toast.success('تم تحميل 500 سجل تدريب صناعي شامل بنجاح!', { id: 'load-master' });
    } catch (e: any) {
      toast.error('تعذر تحميل بيانات المصنع: ' + (e?.message || ''), { id: 'load-master' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTabChange = (tab: 'models' | 'forecast' | 'what-if' | 'decision' | 'summary' | 'copilot') => {
    setActiveTab(tab);
    const tabMap: Record<string, string> = {
      models: 'models',
      forecast: 'future-risk',
      'what-if': 'scenarios',
      decision: 'actions',
      summary: 'summary',
      copilot: 'copilot'
    };
    switchUdipTab(iframeRef.current, tabMap[tab] || 'models');
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'ar' ? 'en' : 'ar';
    setLang(nextLang);
    setUdipLang(iframeRef.current, nextLang);
    toast.info(`تم تبديل لغة المحرك إلى: ${nextLang === 'ar' ? 'العربية' : 'English'}`);
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
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
      toast.info('جاري إعادة تشغيل محرك الذكاء الاصطناعي...');
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
      {/* Top Industrial Header & Live Sync Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-xl backdrop-blur-md mb-3 flex flex-col gap-3">
        {/* Row 1: Brand, Mode Switcher & Global Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-purple-500/20">
              <Brain className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  منظومة الذكاء الاصطناعي وتعلم الآلة الشاملة
                  <Badge variant="outline" className="border-purple-500/40 text-purple-300 bg-purple-500/10 text-xs">
                    UDIP v2.8.2 Enterprise
                  </Badge>
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Machine Learning Classifiers, Predictive Forecasting, What-If Simulation & 5M Root Cause Analytics
              </p>
            </div>
          </div>

          {/* Mode Switcher (UDIP 2.8 vs Classic Model) */}
          <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setMode('udip')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mode === 'udip'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              المحرك المتقدم الشامل (12 Subsystems)
            </button>
            <button
              type="button"
              onClick={() => setMode('classic')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mode === 'classic'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              النموذج الكلاسيكي السابق
            </button>
          </div>

          {/* Top Quick Actions */}
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
              title="إعادة تحميل المحرك"
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

        {mode === 'udip' && (
          <>
            {/* Row 2: Live QMS Data Ingestion Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs flex items-center gap-1.5 py-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  مصدر البيانات النشط:
                </Badge>
                <span className="text-xs font-medium text-slate-200">{activeDatasetLabel}</span>
                {rowCount > 0 && (
                  <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-[11px]">
                    {rowCount} سجل جاهز للتدريب
                  </Badge>
                )}
              </div>

              {/* Ingestion & Training Triggers */}
              <div className="flex items-center flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSyncLiveQms(true)}
                  disabled={isSyncing}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs h-8 shadow-sm"
                >
                  <Activity className={`w-3.5 h-3.5 ml-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  مزامنة بيانات المنصة الحية (Live Sync)
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadFactoryMaster}
                  disabled={isSyncing}
                  className="bg-indigo-950/60 border-indigo-700/50 hover:bg-indigo-900/80 text-indigo-200 text-xs h-8"
                >
                  <Database className="w-3.5 h-3.5 ml-1.5 text-indigo-400" />
                  تحميل بيانات المصنع المعتمدة (500 سجل)
                </Button>
              </div>
            </div>

            {/* Row 3: Analytical Capabilities Tabs */}
            <div className="flex items-center overflow-x-auto gap-1.5 pt-1 border-t border-slate-800/60">
              {[
                { id: 'models', label: 'نماذج تعلم الآلة (ML Models)', icon: Cpu, badge: 'Auto-ML' },
                { id: 'forecast', label: 'استوديو التنبؤ الزمني (Forecast)', icon: Activity, badge: 'Time-Series' },
                { id: 'what-if', label: 'مختبر المحاكاة (What-If Lab)', icon: Sliders, badge: 'Simulation' },
                { id: 'decision', label: 'الذكاء القراري والأسباب الجذرية (5M)', icon: Target, badge: 'Root Cause' },
                { id: 'summary', label: 'الملخص التنفيذي (Executive Brief)', icon: ShieldCheck, badge: 'C-Level' },
                { id: 'copilot', label: 'مساعد الذكاء الاصطناعي (UDIP Copilot)', icon: Brain, badge: 'AI Chat' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabChange(item.id as any)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                      isSelected ? 'bg-purple-800 text-purple-200' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Main View Area */}
      <div className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative shadow-2xl min-h-[750px]">
        {mode === 'udip' ? (
          <iframe
            ref={iframeRef}
            src={`/quality-intelligence/index.html?tab=${activeTab}&lang=${lang}`}
            title="Universal Data Intelligence Platform"
            className="w-full h-full border-0 absolute inset-0 bg-[#070b14]"
            allow="fullscreen; clipboard-read; clipboard-write; microphone"
            onLoad={() => {
              setTimeout(() => {
                handleSyncLiveQms(false);
              }, 400);
            }}
          />
        ) : (
          <div className="h-full overflow-y-auto p-4 bg-slate-900">
            <ClassicAIIntelligence />
          </div>
        )}
      </div>
    </div>
  );
}
