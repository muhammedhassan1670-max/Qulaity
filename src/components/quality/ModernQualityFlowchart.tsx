// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Smartphone, Activity, ShieldAlert, Workflow, PackageCheck,
  ShieldCheck, Database, ArrowRight, ArrowLeft, ArrowDown, RefreshCw,
  CheckCircle2, GitBranch, ArrowUpRight, Search, AlertTriangle,
  FileText, Check, ChevronRight, Zap, Target, Sparkles, Layers,
  ExternalLink, BarChart3, AlertCircle, HelpCircle
} from 'lucide-react';
import { 
  ENTERPRISE_DEPARTMENTS, 
  getDepartmentForStation 
} from '../../services/enterpriseDepartmentsEngine';
import type { ScadaEquipment } from '../../pages/quality/QualityControlTower';

export interface ModernQualityFlowchartProps {
  equipmentList: ScadaEquipment[];
  stationStatuses: Record<string, any>;
  selectedStationId: string | null;
  onSelectStation: (stationId: string) => void;
  selectedDepartmentId?: string | null;
  onSelectDepartment?: (deptId: string) => void;
  isAr: boolean;
  onSwitchTo3D?: () => void;
  onSwitchTo2D?: () => void;
}

export const ModernQualityFlowchart: React.FC<ModernQualityFlowchartProps> = ({
  equipmentList,
  stationStatuses,
  selectedStationId,
  onSelectStation,
  isAr,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'flow' | 'grid'>('flow');
  const [searchQuery, setSearchQuery] = useState('');

  // Group stations strictly by Department
  const stationsByDept = useMemo(() => {
    const map = new Map<string, ScadaEquipment[]>();
    ENTERPRISE_DEPARTMENTS.forEach(dept => map.set(dept.id, []));
    equipmentList.forEach(eq => {
      const dept = getDepartmentForStation(eq.id);
      if (dept && map.has(dept.id)) {
        map.get(dept.id)!.push(eq);
      }
    });
    return map;
  }, [equipmentList]);

  // Overall Statistics
  const stats = useMemo(() => {
    let alertCount = 0;
    let normalCount = 0;
    equipmentList.forEach(eq => {
      const st = stationStatuses[eq.id];
      if (st && (st.status === 'alert' || st.isAndonActive)) alertCount++;
      else normalCount++;
    });
    return { alertCount, normalCount };
  }, [equipmentList, stationStatuses]);

  // Icon mapping
  const renderIcon = (iconType: string, className = 'w-4 h-4') => {
    switch (iconType) {
      case 'truck': return <Truck className={className} />;
      case 'pallet': return <PackageCheck className={className} />;
      case 'machine': return <Smartphone className={className} />;
      case 'wrench': return <Workflow className={className} />;
      case 'gauge': return <Activity className={className} />;
      case 'lab': return <ShieldCheck className={className} />;
      case 'package': return <PackageCheck className={className} />;
      default: return <Activity className={className} />;
    }
  };

  // Flowchart Card Component (Clean, Clickable, Responsive)
  const renderCard = (station: ScadaEquipment, accentColor: string) => {
    const stStatus = stationStatuses[station.id];
    const isAlert = stStatus?.status === 'alert' || stStatus?.isAndonActive;
    const isWarning = stStatus?.status === 'warning';
    const isSelected = selectedStationId === station.id;
    const matchesSearch = searchQuery.trim() 
      ? station.titleAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.code.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    if (!matchesSearch) return null;

    return (
      <div
        key={station.id}
        onClick={() => {
          onSelectStation(station.id);
          navigate(station.moduleUrl);
        }}
        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-start relative group shadow-md hover:scale-[1.02] active:scale-[0.98] ${
          isSelected
            ? 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-500/30'
            : isAlert
              ? 'bg-rose-950/40 border-rose-500/70 hover:border-rose-400 shadow-rose-950/30'
              : isWarning
                ? 'bg-amber-950/30 border-amber-500/70 hover:border-amber-400'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-600 hover:bg-slate-800/90'
        }`}
        style={{
          borderTopColor: accentColor,
          borderTopWidth: '4px'
        }}
      >
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-2">
            <span 
              style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
              className="p-1.5 rounded-lg border border-white/10"
            >
              {renderIcon(station.iconType, 'w-4 h-4')}
            </span>
            <span className="text-[11px] font-mono font-black text-slate-300">
              {station.code}
            </span>
          </div>

          {isAlert ? (
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              <span>{stStatus?.statusLabelAr || 'تنبيه'}</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{isAr ? 'مطابق' : 'Pass'}</span>
            </span>
          )}
        </div>

        <h4 className="text-sm font-black text-white leading-tight mb-1 group-hover:text-cyan-300 transition-colors">
          {isAr ? station.titleAr : station.titleEn}
        </h4>
        <p className="text-[11px] text-slate-400 line-clamp-1 mb-3">
          {isAr ? station.locationAr : station.locationEn}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
          <span className="font-mono text-slate-400 text-[11px]">
            FPY: <b className="text-emerald-400">{station.fpyEstimate || 99}%</b>
          </span>

          <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 group-hover:bg-cyan-500 text-cyan-300 group-hover:text-slate-950 font-bold text-xs flex items-center gap-1 transition-all">
            <span>{isAr ? 'انتقال للقسم' : 'Open Tab'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    );
  };

  // Clean Flow Decision Gate Banner
  const renderDecisionBanner = (
    questionAr: string,
    questionEn: string,
    passLabelAr = 'مطابق (ينتقل للمرحلة التالية ⬇️)',
    failLabelAr = 'غير مطابق (يُعزل ويُحوّل لمسار عدم المطابقة ➡️)'
  ) => {
    return (
      <div className="my-4 p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-base">💎</span>
          <div>
            <span className="text-[10px] font-mono font-bold text-amber-400 block uppercase">
              {isAr ? 'معيار اتخاذ القرار' : 'Decision Gate'}
            </span>
            <h5 className="font-black text-white text-xs sm:text-sm">
              {isAr ? questionAr : questionEn}
            </h5>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] flex items-center gap-1">
            <span>✓</span>
            <span>{passLabelAr}</span>
          </span>

          <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-[11px] flex items-center gap-1">
            <span>✕</span>
            <span>{failLabelAr}</span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-[#050811] text-slate-100 overflow-y-auto select-none font-sans scrollbar-thin">
      {/* 1. SIMPLE TOP CONTROL BAR: SEARCH & 2 SIMPLE TABS */}
      <div className="flex-none p-3 md:px-6 bg-[#080d1a] border-b border-white/10 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3">
        {/* Simple 2-Tab Switcher */}
        <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('flow')}
            className={`px-3 py-1.5 rounded-lg font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'flow'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>{isAr ? '🌊 مسار تدفق العمليات (Flowchart)' : 'Process Flowchart'}</span>
          </button>

          <button
            onClick={() => setActiveTab('grid')}
            className={`px-3 py-1.5 rounded-lg font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'grid'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isAr ? '📋 فهرس الأقسام الـ 22 (All Tabs)' : 'All 22 Modules'}</span>
          </button>
        </div>

        {/* Live Counters */}
        <div className="hidden md:flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-400">
            {isAr ? 'إجمالي الأقسام:' : 'Modules:'} <b className="text-cyan-400">22</b>
          </span>
          <span className="text-slate-400">
            {isAr ? 'مطابق:' : 'Normal:'} <b className="text-emerald-400">{stats.normalCount}</b>
          </span>
          {stats.alertCount > 0 && (
            <span className="text-rose-400 font-bold flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{stats.alertCount} {isAr ? 'تنبيهات' : 'Alerts'}</span>
            </span>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'ابحث عن أي قسم بالاسم أو الكود...' : 'Search any tab by name or code...'}
            className="w-full pr-9 pl-4 py-1.5 rounded-xl bg-black/60 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN FLOWCHART BODY: NATURAL VERTICAL SCROLL, 0 DRAGGING */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8">
        {activeTab === 'flow' ? (
          <>
            {/* START TERMINAL BANNER */}
            <div className="flex flex-col items-center">
              <div className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-cyan-500/20 border-2 border-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <span>{isAr ? '🚀 بداية المسار: تهيئة المصنع والبيانات والمختبر الهندسي' : 'START: Master Setup & Engineering Lab'}</span>
              </div>
              <div className="w-0.5 h-6 bg-gradient-to-b from-cyan-400 to-amber-500" />
              <div className="text-amber-400 text-xs">▼</div>
            </div>

            {/* FOUNDATION ROW: STAGES 7 & 6 */}
            <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/60 border-2 border-blue-500/30 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-blue-500/20">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs sm:text-sm font-black text-white">
                    {isAr ? 'المستوى المرجعي التأسيسي: البيانات الرئيسية، المختبر، وخطط التحكم' : 'Foundation Level: Master Data, Metrology Lab & Control Plans'}
                  </h3>
                </div>
                <span className="text-[10px] text-blue-300 font-mono font-bold bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-500/30">
                  {isAr ? 'المرحلة 7 و 6' : 'Stages 7 & 6'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(stationsByDept.get('DEPT-STAGE-SETUP') || []).map(st => renderCard(st, '#3b82f6'))}
                {(stationsByDept.get('DEPT-STAGE-COMPLIANCE') || []).map(st => renderCard(st, '#a855f7'))}
              </div>
            </div>

            {/* FLOW CONNECTOR */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-6 bg-amber-500" />
              <div className="text-amber-400 text-xs">▼</div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                {isAr ? 'تطبيق خطط الفحص والمواصفات المعتمدة' : 'Sampling Specs & Inspection Plans Applied'}
              </span>
              <div className="w-0.5 h-4 bg-amber-500" />
              <div className="text-amber-400 text-xs">▼</div>
            </div>

            {/* MAIN 2-COLUMN FLOW: VALUE STREAM vs RESOLUTION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* MAIN VALUE STREAM COLUMN (8 COLS) */}
              <div className="lg:col-span-8 space-y-6">
                {/* STEP 1: IQC */}
                <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/60 border-2 border-amber-500/40 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        1
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-white">
                        {isAr ? 'المرحلة 1: استلام الخامات والموردين (IQC)' : 'Stage 1: Incoming & Supplier Quality (IQC)'}
                      </h4>
                    </div>
                    <span className="text-[10px] text-amber-400 font-mono">3 Tabs</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(stationsByDept.get('DEPT-STAGE-INCOMING') || []).map(st => renderCard(st, '#f59e0b'))}
                  </div>
                </div>

                {/* DECISION GATE 1 (IQC) */}
                {renderDecisionBanner(
                  'هل المواد الخام مطابقة للمواصفة ومعايير الفحص؟',
                  'Are raw materials compliant with incoming specs?'
                )}

                {/* STEP 2: IPQC */}
                <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/60 border-2 border-cyan-500/40 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                        2
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-white">
                        {isAr ? 'المرحلة 2: جودة التصنيع والعمليات (IPQC)' : 'Stage 2: In-Process Quality (IPQC)'}
                      </h4>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-mono">4 Tabs</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(stationsByDept.get('DEPT-STAGE-INPROCESS') || []).map(st => renderCard(st, '#06b6d4'))}
                  </div>
                </div>

                {/* DECISION GATE 2 (IPQC) */}
                {renderDecisionBanner(
                  'هل عينات التشغيل والقياسات ضمن حدود الضبط الإحصائي SPC؟',
                  'Are in-process samples within SPC control limits?',
                  isAr ? 'مطابق (ينتقل للفحص النهائي ⬇️)' : 'Pass (To Outgoing OQC)',
                  isAr ? 'خلل (إيقاف أندون وفتح NCR ➡️)' : 'Fail (Hold & NCR)'
                )}

                {/* STEP 4: OQC */}
                <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/60 border-2 border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        4
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-white">
                        {isAr ? 'المرحلة 4: فحص وخروج المنتج النهائي (OQC)' : 'Stage 4: Outgoing Quality (OQC)'}
                      </h4>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono">1 Tab</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {(stationsByDept.get('DEPT-STAGE-OUTGOING') || []).map(st => renderCard(st, '#10b981'))}
                  </div>
                </div>

                {/* DECISION GATE 3 (OQC) */}
                {renderDecisionBanner(
                  'هل شحنة المنتج التام مطابقة لمعايير قبول عينات AQL؟',
                  'Are finished goods conforming to AQL criteria?',
                  isAr ? 'مجاز (إصدار شهادة المطابقة COC والإفراج ⬇️)' : 'Approved (Issue COC & Release)',
                  isAr ? 'مرفوض (حجز الشحنة وإحالة لـ NCR ➡️)' : 'Quarantine & NCR'
                )}

                {/* STEP 5: CUSTOMER COMPLAINTS */}
                <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/60 border-2 border-indigo-500/40 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                        5
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-white">
                        {isAr ? 'المرحلة 5: شكاوى العملاء والميدان' : 'Stage 5: Customer & Field Quality'}
                      </h4>
                    </div>
                    <span className="text-[10px] text-indigo-400 font-mono">1 Tab</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {(stationsByDept.get('DEPT-STAGE-CUSTOMER') || []).map(st => renderCard(st, '#6366f1'))}
                  </div>
                </div>

                {/* FINAL SUCCESS TERMINAL */}
                <div className="flex flex-col items-center pt-2">
                  <div className="w-0.5 h-6 bg-emerald-500" />
                  <div className="text-emerald-400 text-xs">▼</div>
                  <div className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/20 border-2 border-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>{isAr ? '🏁 نهاية المسار: إفراج نهائي للعملاء بمطابقة 100%' : 'END: 100% Conforming Delivery'}</span>
                  </div>
                </div>
              </div>

              {/* RESOLUTION & DEFECT ESCALATION COLUMN (4 COLS) */}
              <div className="lg:col-span-4 p-4 sm:p-5 rounded-3xl bg-slate-950/90 border-2 border-rose-500/50 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <h3 className="text-xs sm:text-sm font-black text-rose-400">
                      {isAr ? 'المرحلة 3: مسار عدم المطابقة والتحسين' : 'Stage 3: NCR & Problem Solving'}
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-500/40">
                    5 Tabs
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 text-xs text-slate-300 leading-relaxed">
                  {isAr 
                    ? 'أي رفض من بوابات القرار (IQC، IPQC، OQC، شكاوى العملاء) يُحوّل تلقائياً إلى هذا المسار للعزل والتحقيق الجذري.'
                    : 'All non-conformances trigger containment, CAPA, and 8D root-cause investigation.'}
                </div>

                {/* STAGE 3 TABS LIST */}
                <div className="flex flex-col gap-3">
                  {(stationsByDept.get('DEPT-STAGE-RESOLUTION') || []).map((st) => renderCard(st, '#f43f5e'))}
                </div>

                {/* CLOSED-LOOP FEEDBACK BANNER */}
                <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/40 space-y-1 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-black text-purple-300">
                    <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                    <span>{isAr ? 'حلقة التحسين المغلقة والتغذية العكسية' : 'Closed-Loop Quality Feedback'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isAr 
                      ? 'نتائج حل المشكلات تصعد لتحديث خطة التحكم و FMEA والدروس المستفادة لمنع تكرار الخطأ مستقبلياً.' 
                      : '8D solutions update Control Plans, FMEAs, and Lessons Learned.'}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* TAB 2: CLEAN COMPACT GRID OF ALL 22 MODULES */
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
              {isAr 
                ? 'فهرس شامل لجميع أقسام الجودة الـ 22 الحقيقية الموجودة بالقائمة الجانبية مع إمكانية الدخول المباشر بنقرة واحدة.' 
                : 'Direct directory of all 22 quality modules matching the sidebar with 1-click access.'}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {equipmentList.map(st => {
                const dept = getDepartmentForStation(st.id);
                return renderCard(st, dept?.accentHex || '#06b6d4');
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernQualityFlowchart;
