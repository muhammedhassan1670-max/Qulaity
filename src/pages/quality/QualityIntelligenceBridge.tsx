import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, RefreshCw, Maximize2, Minimize2, 
  Globe, Activity, Cpu, Sliders, Target, ShieldCheck,
  ClipboardCheck, AlertTriangle, ShieldAlert, CheckCircle2,
  PlusCircle, ArrowUpRight
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

// Fallback to classic statistical prediction if needed
import ClassicAIIntelligence from '@/sections/AIIntelligence';

export default function QualityIntelligenceBridge() {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeTab, setActiveTab] = useState<'models' | 'forecast' | 'what-if' | 'decision' | 'summary' | 'copilot'>('models');
  const [activeScope, setActiveScope] = useState<RealDataScope>('ALL');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeDatasetLabel, setActiveDatasetLabel] = useState<string>('بيانات المنصة الحية (100% Real Records)');
  const [rowCount, setRowCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [mode, setMode] = useState<'udip' | 'classic'>('udip');
  const containerRef = useRef<HTMLDivElement>(null);

  // Real live stats from platform localStorage
  const stats = useMemo(() => getRealPlatformStats(), [isSyncing]);

  // Auto-sync real platform data once iframe is ready
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
      const success = sendDatasetToUdip(iframeRef.current, realData, activeTab);
      if (success) {
        const scopeLabels: Record<RealDataScope, string> = {
          ALL: 'جميع سجلات المنصة الفعلية (All Real Records)',
          INSPECTIONS: 'فحوصات الجودة الواردة والنهائية فقط',
          SHOPFLOOR: 'سجلات عيوب خطوط الإنتاج والورديات فقط',
          NCR_CAPA: 'حالات عدم المطابقة وإجراءات CAPA/8D فقط',
          COMPLAINTS: 'شكاوى العملاء ومرتجعات الميدان فقط'
        };
        setActiveDatasetLabel(scopeLabels[scope]);
        setRowCount(realData.rows.length);
        if (notify) {
          if (realData.rows.length > 0) {
            toast.success(`تمت مزامنة ${realData.rows.length} سجل جودة حقيقي بنجاح من المنصة`);
          } else {
            toast.info('لا توجد سجلات مسجلة بعد في هذا القسم من المنصة');
          }
        }
      }
    } catch (e: any) {
      toast.error('حدث خطأ أثناء مزامنة بيانات المنصة: ' + (e?.message || ''));
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
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 bg-emerald-500/10 text-xs">
                    مربوطة حصرياً ببيانات المنصة الفعلية
                  </Badge>
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                تدريب نماذج Machine Learning وتوقع العيوب والـ What-If Simulation اعتماداً بنسبة 100% على سجلات مصنعك الحقيقية
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
              title="إعادة تحميل المحرك ومزامنة البيانات الحية"
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
            {/* Row 2: Live Platform Records Counters Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  سجلات مصنعك الفعلية المتاحة:
                </span>
                <Badge variant="outline" className="bg-slate-900 border-slate-700 text-slate-200 text-xs py-0.5">
                  📋 {stats.inspectionsCount} فحص وارد/نهائي
                </Badge>
                <Badge variant="outline" className="bg-slate-900 border-slate-700 text-slate-200 text-xs py-0.5">
                  ⚠️ {stats.defectLogsCount} عيوب خط
                </Badge>
                <Badge variant="outline" className="bg-slate-900 border-slate-700 text-slate-200 text-xs py-0.5">
                  🚨 {stats.ncrCount} تقارير NCR
                </Badge>
                <Badge variant="outline" className="bg-slate-900 border-slate-700 text-slate-200 text-xs py-0.5">
                  🛡️ {stats.capaCount + stats.eightDCount} إجراءات CAPA & 8D
                </Badge>
                <Badge variant="outline" className="bg-slate-900 border-slate-700 text-slate-200 text-xs py-0.5">
                  📦 {stats.complaintsCount} شكاوى عملاء
                </Badge>
                <Badge variant="outline" className="bg-slate-900 border-slate-700 text-slate-200 text-xs py-0.5">
                  📑 {stats.deviationsCount} طلبات حيود
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

            {/* Row 3: Real Data Scopes (Filtered Ingestion from Real Modules) */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-400 font-medium ml-1">تحديد نطاق التحليل:</span>
                {[
                  { id: 'ALL', label: `كل سجلات المنصة (${stats.totalRealRecords})`, icon: Activity },
                  { id: 'INSPECTIONS', label: `فحوصات الجودة (${stats.inspectionsCount})`, icon: ClipboardCheck },
                  { id: 'SHOPFLOOR', label: `عيوب الخطوط (${stats.defectLogsCount})`, icon: AlertTriangle },
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
                <span className="text-xs text-slate-400">النطاق المحقون:</span>
                <Badge variant="secondary" className="bg-purple-950/80 text-purple-300 border border-purple-800/40 text-[11px]">
                  {activeDatasetLabel} ({rowCount} سجل)
                </Badge>
              </div>
            </div>

            {/* If zero real records exist, show guided quick-entry banner */}
            {stats.totalRealRecords === 0 && (
              <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs text-amber-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    لا توجد سجلات مسجلة بعد في المنصة. ابدأ بإضافة فحص وارد أو تسجيل عيب خط ليتم تدريب نماذج الذكاء الاصطناعي عليه فوراً!
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => navigate('/inspection')} 
                    className="h-7 text-xs border-amber-700/60 bg-amber-900/40 text-amber-100 hover:bg-amber-900/80"
                  >
                    <PlusCircle className="w-3 h-3 ml-1" />
                    تسجيل فحص وارد
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => navigate('/quality-shopfloor')} 
                    className="h-7 text-xs border-amber-700/60 bg-amber-900/40 text-amber-100 hover:bg-amber-900/80"
                  >
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                    شاشة خط الإنتاج
                  </Button>
                </div>
              </div>
            )}

            {/* Row 4: Analytical Capabilities Tabs */}
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
                handleSyncRealData(activeScope, false);
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
