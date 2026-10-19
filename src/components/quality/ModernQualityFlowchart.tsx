// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Smartphone, Activity, ShieldAlert, Workflow, PackageCheck,
  ShieldCheck, Database, ArrowDown, RefreshCw, CheckCircle2,
  ArrowUpRight, Search, AlertTriangle, Layers, ChevronDown
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
  isAr: boolean;
  onSwitchToSCADA?: () => void;
}

export const ModernQualityFlowchart: React.FC<ModernQualityFlowchartProps> = ({
  equipmentList,
  stationStatuses,
  selectedStationId,
  onSelectStation,
  isAr,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');

  // Group stations strictly by Department (7 Stages, 22 Tabs)
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
  const renderIcon = (iconType: string, className = 'w-5 h-5') => {
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

  // Flowchart Card Component (Clean, Clickable, High Usability)
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
        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-start relative group shadow-sm hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between ${
          isSelected
            ? 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-500/30'
            : isAlert
              ? 'bg-rose-950/30 border-rose-500/70 hover:border-rose-400 shadow-rose-950/20'
              : isWarning
                ? 'bg-amber-950/20 border-amber-500/70 hover:border-amber-400'
                : 'bg-slate-900/90 border-slate-800/90 hover:border-slate-600 hover:bg-slate-800'
        }`}
        style={{
          borderTopColor: accentColor,
          borderTopWidth: '4px'
        }}
      >
        <div>
          {/* Card Top: Code & Status */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span 
                style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
                className="p-1.5 rounded-xl border border-white/10"
              >
                {renderIcon(station.iconType, 'w-4 h-4')}
              </span>
              <span className="text-xs font-mono font-black text-slate-300">
                {station.code}
              </span>
            </div>

            {isAlert ? (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/40 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                <span>{stStatus?.statusLabelAr || 'تنبيه'}</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{isAr ? 'مطابق' : 'Pass'}</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-sm font-black text-white leading-snug mb-1 group-hover:text-cyan-300 transition-colors">
            {isAr ? station.titleAr : station.titleEn}
          </h4>
          <p className="text-xs text-slate-400 line-clamp-1 mb-3">
            {isAr ? station.locationAr : station.locationEn}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="font-mono text-slate-400 text-[11px]">
            FPY: <b className="text-emerald-400">{station.fpyEstimate || 99}%</b>
          </span>

          <span className="px-3 py-1 rounded-xl bg-cyan-500/15 group-hover:bg-cyan-500 text-cyan-300 group-hover:text-slate-950 font-black text-xs flex items-center gap-1 transition-all shadow-sm">
            <span>{isAr ? 'فتح التبويب' : 'Open Tab'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    );
  };

  // Clean Flow Decision Gate Banner
  const renderDecisionGate = (
    questionAr: string,
    questionEn: string,
    passLabelAr = 'مطابق (ينتقل للخطوة التالية ⬇️)',
    failLabelAr = 'غير مطابق (يُعزل ويُحوّل إلى المرحلة 3: NCR ➡️)'
  ) => {
    return (
      <div className="my-6 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border-2 border-amber-500/40 flex flex-col md:flex-row items-center justify-between gap-4 text-xs shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-xl">💎</span>
          <div>
            <span className="text-[10px] font-mono font-black text-amber-400 block uppercase tracking-wider">
              {isAr ? 'معيار اتخاذ القرار' : 'Quality Decision Gate'}
            </span>
            <h5 className="font-black text-white text-sm">
              {isAr ? questionAr : questionEn}
            </h5>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-xs flex items-center gap-1.5">
            <span>✓</span>
            <span>{passLabelAr}</span>
          </span>

          <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-black text-xs flex items-center gap-1.5">
            <span>✕</span>
            <span>{failLabelAr}</span>
          </span>
        </div>
      </div>
    );
  };

  const scrollToStage = (stageId: string) => {
    setSelectedStageFilter('all');
    const el = document.getElementById(stageId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex-1 w-full bg-[#060a14] text-slate-100 flex flex-col font-sans select-none">
      {/* 1. SIMPLE TOP STICKY BAR: SEARCH & STAGE JUMPERS */}
      <div className="bg-[#080d1a] border-b border-white/10 p-3 md:px-6 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Fast Stage Quick-Jump Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 shrink-0 hidden lg:inline">
              {isAr ? 'المراحل الـ 7:' : '7 Stages:'}
            </span>

            {ENTERPRISE_DEPARTMENTS.map((dept) => (
              <button
                key={dept.id}
                onClick={() => scrollToStage(dept.id)}
                style={{ borderColor: `${dept.accentHex}50` }}
                className="px-2.5 py-1 rounded-xl bg-black/40 hover:bg-white/10 text-xs font-bold text-slate-300 hover:text-white border shrink-0 transition-all flex items-center gap-1"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dept.accentHex }} />
                <span>{isAr ? dept.shortNameAr : dept.shortNameEn}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث بالاسم أو الكود...' : 'Search any tab...'}
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
      </div>

      {/* 2. THE EASIEST FLOWCHART LAYOUT: CLEAN NATURAL PROCESS SEQUENCE */}
      <div className="max-w-6xl mx-auto w-full p-4 md:p-8 space-y-8 pb-20">
        
        {/* START TERMINAL */}
        <div className="flex flex-col items-center">
          <div className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/20 border-2 border-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span>{isAr ? '🚀 بداية المسار: البيانات الرئيسية والمختبر الهندسي' : 'START: Master Data & Engineering Lab'}</span>
          </div>
          <div className="w-0.5 h-6 bg-cyan-400" />
          <div className="text-cyan-400 text-xs">▼</div>
        </div>

        {/* ==================================================================== */}
        {/* FOUNDATION: STAGE 7 & STAGE 6                                         */}
        {/* ==================================================================== */}
        <section id="DEPT-STAGE-SETUP" className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border-2 border-blue-500/30 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-blue-500/20">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-black bg-blue-500/20 text-blue-400 border border-blue-500/40">
                STAGE 07 & 06
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  {isAr ? 'الأساس الهندسي: البيانات الرئيسية، المختبر، وخطط التحكم' : 'Foundation: Master Data, Metrology Lab & Control Plans'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr ? 'تحديد مواصفات القطع، قوالب الفحص، تحليل المخاطر FMEA، ومعايرة أجهزة القياس MSA' : 'Parts catalog, form templates, FMEA risk analysis & gage calibration'}
                </p>
              </div>
            </div>
            <span className="text-xs text-blue-300 font-mono font-bold bg-blue-950 px-3 py-1 rounded-full border border-blue-500/30 shrink-0">
              8 Tabs
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {(stationsByDept.get('DEPT-STAGE-SETUP') || []).map(st => renderCard(st, '#3b82f6'))}
            {(stationsByDept.get('DEPT-STAGE-COMPLIANCE') || []).map(st => renderCard(st, '#a855f7'))}
          </div>
        </section>

        {/* CONNECTOR ARROW */}
        <div className="flex flex-col items-center">
          <div className="w-0.5 h-6 bg-amber-500" />
          <div className="text-amber-400 text-xs">▼</div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            {isAr ? 'تطبيق خطط الفحص ومعايير القبول على المواد الخام' : 'Apply Inspection Standards to Raw Materials'}
          </span>
          <div className="w-0.5 h-4 bg-amber-500" />
          <div className="text-amber-400 text-xs">▼</div>
        </div>

        {/* ==================================================================== */}
        {/* STAGE 1: INCOMING & SUPPLIER (IQC)                                   */}
        {/* ==================================================================== */}
        <section id="DEPT-STAGE-INCOMING" className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border-2 border-amber-500/40 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">
                STAGE 01
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  {isAr ? 'المرحلة 1: استلام الخامات والموردين (IQC)' : 'Stage 1: Incoming & Supplier Quality (IQC)'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr ? 'تقييم الموردين، فحص الشحنات الواردة، والتأكد من مطابقة الخامات للمواصفة' : 'Supplier scorecards, incoming receiving inspections & COA analysis'}
                </p>
              </div>
            </div>
            <span className="text-xs text-amber-400 font-mono font-bold bg-amber-950 px-3 py-1 rounded-full border border-amber-500/30 shrink-0">
              3 Tabs
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(stationsByDept.get('DEPT-STAGE-INCOMING') || []).map(st => renderCard(st, '#f59e0b'))}
          </div>
        </section>

        {/* DECISION GATE 1 (IQC) */}
        {renderDecisionGate(
          'هل المواد الخام الواردة مطابقة للمواصفات وخطط الفحص؟',
          'Are incoming raw materials compliant with quality specs?'
        )}

        {/* ==================================================================== */}
        {/* STAGE 2: IN-PROCESS QUALITY (IPQC)                                   */}
        {/* ==================================================================== */}
        <section id="DEPT-STAGE-INPROCESS" className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border-2 border-cyan-500/40 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                STAGE 02
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  {isAr ? 'المرحلة 2: جودة التصنيع والعمليات (IPQC)' : 'Stage 2: In-Process Quality & SPC (IPQC)'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr ? 'تسجيل عيوب الوردية، المتابعة اللحظية من الأرضية، كارتات التحكم الإحصائي SPC' : 'Daily defect logs, fast shopfloor entry, SPC control charts & clearance gates'}
                </p>
              </div>
            </div>
            <span className="text-xs text-cyan-400 font-mono font-bold bg-cyan-950 px-3 py-1 rounded-full border border-cyan-500/30 shrink-0">
              4 Tabs
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(stationsByDept.get('DEPT-STAGE-INPROCESS') || []).map(st => renderCard(st, '#06b6d4'))}
          </div>
        </section>

        {/* DECISION GATE 2 (IPQC) */}
        {renderDecisionGate(
          'هل عينات التشغيل والقياسات ضمن حدود الضبط الإحصائي SPC؟',
          'Are in-process samples within SPC control limits?',
          isAr ? 'مطابق (ينتقل للفحص النهائي ⬇️)' : 'Pass (To Outgoing OQC)',
          isAr ? 'خلل (إيقاف أندون وتصعيد لـ NCR ➡️)' : 'Fail (Hold & NCR)'
        )}

        {/* ==================================================================== */}
        {/* STAGE 4: OUTGOING QUALITY (OQC)                                       */}
        {/* ==================================================================== */}
        <section id="DEPT-STAGE-OUTGOING" className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border-2 border-emerald-500/40 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                STAGE 04
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  {isAr ? 'المرحلة 4: فحص وخروج المنتج النهائي (OQC)' : 'Stage 4: Outgoing Quality & Release (OQC)'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr ? 'فحص عينات القبول AQL للشحنات التامة قبل التحميل وإصدار شهادات المطابقة' : 'Pre-shipment AQL sampling, COC certificates & final release authorization'}
                </p>
              </div>
            </div>
            <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-950 px-3 py-1 rounded-full border border-emerald-500/30 shrink-0">
              1 Tab
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(stationsByDept.get('DEPT-STAGE-OUTGOING') || []).map(st => renderCard(st, '#10b981'))}
          </div>
        </section>

        {/* DECISION GATE 3 (OQC) */}
        {renderDecisionGate(
          'هل شحنة المنتج التام مطابقة لمعايير قبول عينات AQL؟',
          'Are finished goods conforming to AQL criteria?',
          isAr ? 'مجاز (إصدار شهادة المطابقة COC والإفراج للشحن ⬇️)' : 'Approved (Issue COC & Ship)',
          isAr ? 'مرفوض (حجز الشحنة وإحالة لـ NCR ➡️)' : 'Quarantine & NCR'
        )}

        {/* ==================================================================== */}
        {/* STAGE 5: CUSTOMER COMPLAINTS                                          */}
        {/* ==================================================================== */}
        <section id="DEPT-STAGE-CUSTOMER" className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border-2 border-indigo-500/40 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-black bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                STAGE 05
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  {isAr ? 'المرحلة 5: شكاوى العملاء والجودة الميدانية' : 'Stage 5: Customer Complaints & Field QA'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr ? 'استقبال بلاغات العملاء ومطالبات الضمان ومرتجعات RMA وتحويلها فوراً لحل المشكلات' : 'Customer claims, warranty returns RMA & field feedback loops'}
                </p>
              </div>
            </div>
            <span className="text-xs text-indigo-400 font-mono font-bold bg-indigo-950 px-3 py-1 rounded-full border border-indigo-500/30 shrink-0">
              1 Tab
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(stationsByDept.get('DEPT-STAGE-CUSTOMER') || []).map(st => renderCard(st, '#6366f1'))}
          </div>
        </section>

        {/* SUCCESS TERMINAL */}
        <div className="flex flex-col items-center pt-2">
          <div className="w-0.5 h-6 bg-emerald-500" />
          <div className="text-emerald-400 text-xs">▼</div>
          <div className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/20 border-2 border-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>{isAr ? '🏁 نهاية المسار: منتجات سليمة 100% ورضا العملاء' : 'END: 100% Conforming Delivery'}</span>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* PARALLEL RESOLUTION & CLOSED LOOP: STAGE 3                           */}
        {/* ==================================================================== */}
        <section id="DEPT-STAGE-RESOLUTION" className="p-5 sm:p-6 rounded-3xl bg-slate-950/90 border-2 border-rose-500/60 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-rose-500/20">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-black bg-rose-500/20 text-rose-400 border border-rose-500/40">
                STAGE 03
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-rose-400">
                  {isAr ? 'المرحلة 3: مسار عدم المطابقة وحل المشكلات المنهجي (NCR / 8D / CAPA)' : 'Stage 3: Problem Solving, NCR & Corrective Actions'}
                </h3>
                <p className="text-xs text-slate-300">
                  {isAr 
                    ? 'يستقبل الشحنات والقطع المرفوضة من IQC، عيوب الإنتاج IPQC، لوتات OQC المرفوضة، وبلاغات العملاء لحصرها وعزلها فوراً' 
                    : 'Receives rejected lots from IQC, IPQC defects, OQC holds & customer claims for containment & 8D root-cause'}
                </p>
              </div>
            </div>
            <span className="text-xs text-rose-300 font-mono font-bold bg-rose-950 px-3 py-1 rounded-full border border-rose-500/40 shrink-0">
              5 Tabs
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {(stationsByDept.get('DEPT-STAGE-RESOLUTION') || []).map(st => renderCard(st, '#f43f5e'))}
          </div>

          {/* CLOSED-LOOP FEEDBACK BANNER */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-950/40 border-2 border-purple-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-5 h-5 text-purple-400 animate-spin shrink-0" />
              <div>
                <h5 className="font-black text-purple-300 text-xs sm:text-sm">
                  {isAr ? 'حلقة التحسين المغلقة والتغذية العكسية (Closed Loop)' : 'Continuous Improvement & Closed Loop'}
                </h5>
                <p className="text-[11px] text-slate-300">
                  {isAr 
                    ? 'نتائج مشاريع الـ 8D والإجراءات التصحيحية تصعد تلقائياً لتحديث خطط التحكم Control Plan و FMEA وقاعدة الدروس المستفادة لمنع تكرار الخطأ.' 
                    : 'Verified corrective actions feed back to update Control Plans, FMEAs, and Lessons Learned repository.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => scrollToStage('DEPT-STAGE-SETUP')}
              className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-slate-950 font-black text-xs border border-purple-500/40 flex items-center gap-1.5 transition-all shrink-0"
            >
              <span>{isAr ? 'العودة للمستوى التأسيسي ▲' : 'Back to Foundation ▲'}</span>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};

export default ModernQualityFlowchart;
