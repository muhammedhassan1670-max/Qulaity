// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Smartphone, Activity, ShieldAlert, Workflow, PackageCheck,
  ShieldCheck, Database, ArrowDown, RefreshCw, CheckCircle2,
  ArrowUpRight, Search, AlertTriangle, Layers, ChevronDown, CheckSquare,
  Sparkles, FileText, Barcode, Brain, Blocks, Library, Users, GitFork,
  HelpCircle, ChevronRight, CornerDownRight
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
  const [highlightedStageId, setHighlightedStageId] = useState<string | null>(null);

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

  const scrollToStage = (stageId: string, highlight = false) => {
    const el = document.getElementById(stageId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (highlight) {
        setHighlightedStageId(stageId);
        setTimeout(() => setHighlightedStageId(null), 4000);
      }
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

  // ANIMATED SVG FLOW PIPE COMPONENT
  const renderFlowPipe = (color: string, labelAr: string, labelEn: string) => {
    return (
      <div className="flex flex-col items-center my-3 relative">
        <svg width="32" height="48" className="overflow-visible">
          <defs>
            <linearGradient id={`pipeGrad-${color.replace('#','')}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="50%" stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor={color} stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <line
            x1="16" y1="0"
            x2="16" y2="38"
            stroke={`url(#pipeGrad-${color.replace('#','')})`}
            strokeWidth="3.5"
            strokeDasharray="6 4"
            className="flowchart-pipe-anim"
            strokeLinecap="round"
          />
          <polygon
            points="10,36 16,46 22,36"
            fill={color}
          />
        </svg>

        {labelAr && (
          <span className="mt-1 px-3 py-0.5 rounded-full bg-slate-900 border border-white/10 text-[10px] font-mono font-bold text-slate-400 shadow-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            <span>{isAr ? labelAr : labelEn}</span>
          </span>
        )}
      </div>
    );
  };

  // ADVANCED GEOMETRIC DECISION DIAMOND WITH DUAL-BRANCH CORRIDORS
  const renderDecisionDiamond = ({
    gateNumber,
    questionAr,
    questionEn,
    passLabelAr,
    passLabelEn,
    passTargetStageNumber,
    failLabelAr,
    failLabelEn,
    accentColor = '#f59e0b',
    targetNcr = true,
  }: {
    gateNumber: number;
    questionAr: string;
    questionEn: string;
    passLabelAr: string;
    passLabelEn: string;
    passTargetStageNumber: number;
    failLabelAr: string;
    failLabelEn: string;
    accentColor?: string;
    targetNcr?: boolean;
  }) => {
    return (
      <div className="relative my-7 flex flex-col items-center w-full">
        {/* Incoming Flow Pipe from Stage */}
        <div className="flex flex-col items-center">
          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: accentColor }} />
          <div className="w-2.5 h-2.5 rounded-full animate-ping -mt-1" style={{ backgroundColor: accentColor }} />
        </div>

        {/* The Diamond Decision Gateway Box */}
        <div className="relative w-full max-w-4xl mt-3 p-5 sm:p-7 rounded-3xl bg-gradient-to-b from-slate-900 via-[#0a101f] to-slate-950 border-2 shadow-2xl backdrop-blur-md transition-all group"
          style={{ borderColor: `${accentColor}60` }}
        >
          {/* Top Diamond Identity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-4">
              {/* Geometric Diamond Symbol */}
              <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                <div 
                  className="absolute inset-0 rotate-45 rounded-xl border-2 shadow-lg transition-transform duration-500 group-hover:rotate-90 group-hover:scale-110"
                  style={{ 
                    backgroundColor: `${accentColor}20`,
                    borderColor: accentColor,
                    boxShadow: `0 0 20px ${accentColor}40`
                  }} 
                />
                <span className="relative font-black text-sm z-10" style={{ color: accentColor }}>
                  ◆
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span 
                    className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-md border"
                    style={{ 
                      backgroundColor: `${accentColor}15`, 
                      color: accentColor,
                      borderColor: `${accentColor}40`
                    }}
                  >
                    {isAr ? 'بوابة اتخاذ القرار الهندسية' : 'Engineering Decision Gateway'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono font-bold">
                    GATEWAY #{gateNumber}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-black text-white mt-1">
                  {isAr ? questionAr : questionEn}
                </h4>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-400 hidden md:block">
              ISO 9001 / IATF Gate
            </div>
          </div>

          {/* DUAL BRANCH CORRIDORS (Pass ⬇️ vs Fail ➡️) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            {/* PASS BRANCH (GREEN) */}
            <div className="p-4 rounded-2xl bg-emerald-950/25 border-2 border-emerald-500/50 hover:border-emerald-400 transition-all flex flex-col justify-between group/pass">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-500/40 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{isAr ? 'نعم • مطابق للمواصفة' : 'YES • Conforming'}</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-black">PASS ⬇️</span>
                </div>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {isAr ? passLabelAr : passLabelEn}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs font-bold text-emerald-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{isAr ? `ينتقل للمرحلة التالية (${passTargetStageNumber})` : `Advances to Stage ${passTargetStageNumber}`}</span>
                </div>
                <ArrowDown className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            {/* FAIL / NON-CONFORMANCE BRANCH (RED/ROSE WITH DIRECT LINKAGE TO STAGE 3) */}
            <div className="p-4 rounded-2xl bg-rose-950/25 border-2 border-rose-500/60 hover:border-rose-400 transition-all flex flex-col justify-between group/fail shadow-lg shadow-rose-950/20">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 font-black text-xs border border-rose-500/40 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>{isAr ? 'لا • غير مطابق أو رُصد خلل' : 'NO • Non-Conformance'}</span>
                  </span>
                  <span className="text-[11px] font-mono text-rose-400 font-black">FAIL ➡️</span>
                </div>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {isAr ? failLabelAr : failLabelEn}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-rose-500/20">
                {targetNcr ? (
                  <button
                    onClick={() => scrollToStage('DEPT-STAGE-RESOLUTION', true)}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-950/40 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>{isAr ? '⚠️ تفرع فوري لـ المرحلة 3 (تقارير عدم المطابقة NCR)' : 'Branch to Stage 3 (NCR & 8D)'}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="text-xs text-rose-300 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span>{isAr ? 'حجز وتصعيد للجنة الجودة MRB' : 'Quarantine & Escalate to MRB'}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Outgoing Flow Pipe to Next Stage */}
        <div className="flex flex-col items-center mt-3">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-emerald-500 to-transparent" />
          <div className="text-emerald-400 text-xs font-bold -mt-2">▼</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 w-full bg-[#060a14] text-slate-100 flex flex-col font-sans select-none">
      {/* Dynamic Keyframe Animation Styles */}
      <style>{`
        @keyframes flowDash {
          from { stroke-dashoffset: 20; }
          to { stroke-dashoffset: 0; }
        }
        .flowchart-pipe-anim {
          animation: flowDash 1.2s linear infinite;
        }
        @keyframes pulseHighlight {
          0%, 100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
          50% { box-shadow: 0 0 35px 8px rgba(244, 63, 94, 0.7); border-color: rgba(244, 63, 94, 1); }
        }
        .stage-highlight-ncr {
          animation: pulseHighlight 1.5s ease-in-out 3;
        }
      `}</style>

      {/* 1. SIMPLE TOP STICKY BAR: SEARCH & SEQUENTIAL STAGE JUMPERS */}
      <div className="bg-[#080d1a] border-b border-white/10 p-3 md:px-6 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Fast Sequential Stage Quick-Jump Pills (1 to 7) */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 shrink-0 hidden lg:inline">
              {isAr ? 'المراحل الـ 7 بالتسلسل:' : '7 Stages (1 ➔ 7):'}
            </span>

            {ENTERPRISE_DEPARTMENTS.map((dept) => (
              <button
                key={dept.id}
                onClick={() => scrollToStage(dept.id, false)}
                style={{ borderColor: `${dept.accentHex}50` }}
                className="px-2.5 py-1 rounded-xl bg-black/40 hover:bg-white/10 text-xs font-bold text-slate-300 hover:text-white border shrink-0 transition-all flex items-center gap-1.5"
              >
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black text-slate-950" style={{ backgroundColor: dept.accentHex }}>
                  {dept.number}
                </span>
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

      {/* 2. THE DEVELOPED FLOWCHART LAYOUT: SEQUENTIAL (1 ➔ 2 ➔ 3 ➔ 4 ➔ 5 ➔ 6 ➔ 7) */}
      <div className="max-w-6xl mx-auto w-full p-4 md:p-8 space-y-4 pb-20">
        
        {/* START TERMINAL */}
        <div className="flex flex-col items-center">
          <div className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 border-2 border-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span>{isAr ? '🚀 بداية المسار: استلام الخامات وتأهيل الموردين' : 'START: Incoming Materials & Supplier Verification'}</span>
          </div>
          {renderFlowPipe('#f59e0b', 'توريد خامات جديدة', 'New Raw Batch')}
        </div>

        {/* ==================================================================== */}
        {/* STAGE 1: INCOMING & SUPPLIER (IQC)                                   */}
        {/* ==================================================================== */}
        <section id="DEPT-STAGE-INCOMING" className="p-5 sm:p-6 rounded-3xl bg-slate-900/70 border-2 border-amber-500/40 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-xl text-xs font-mono font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">
                STAGE 01
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  {isAr ? 'المرحلة 1: استلام الخامات والموردين (IQC)' : 'Stage 1: Incoming & Supplier Quality (IQC)'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr ? 'تقييم الموردين، خطط فحص الخامات، وتفتيش الشحنات الواردة قبل الإفراج للإنتاج' : 'Supplier scorecards, incoming receiving inspections & COA analysis'}
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
        {renderDecisionDiamond({
          gateNumber: 1,
          questionAr: 'هل المواد الخام والشحنات الواردة مطابقة للمواصفات وخطط الفحص؟',
          questionEn: 'Are incoming raw materials compliant with quality specs & receiving plans?',
          passLabelAr: 'مطابق: يتم ختم الشحنة وتصريح الإفراج لدخول صالة الإنتاج والتصنيع ⬇️',
          passLabelEn: 'Conforming: Lot cleared & released for shopfloor production entry',
          passTargetStageNumber: 2,
          failLabelAr: 'غير مطابق: عزل الشحنة فوراً في منطقة الحجر وفتح تقرير عدم مطابقة لمطالبة المورد ➡️',
          failLabelEn: 'Non-Conforming: Instant quarantine and automatic escalation to Stage 3 NCR',
          accentColor: '#f59e0b',
          targetNcr: true
        })}

        {/* ==================================================================== */}
        {/* STAGE 2: IN-PROCESS QUALITY (IPQC)                                   */}
        {/* ==================================================================== */}
        <section id="DEPT-STAGE-INPROCESS" className="p-5 sm:p-6 rounded-3xl bg-slate-900/70 border-2 border-cyan-500/40 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-xl text-xs font-mono font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                STAGE 02
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  {isAr ? 'المرحلة 2: جودة التصنيع والعمليات (IPQC)' : 'Stage 2: In-Process Quality & SPC (IPQC)'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr ? 'تسجيل صالة الإنتاج، قائمة العيوب اليومية، كارتات التحكم الإحصائي SPC، ومتابعة محطات الفحص' : 'Shopfloor fast entry, daily defect logs, SPC control charts & clearance gates'}
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
        {renderDecisionDiamond({
          gateNumber: 2,
          questionAr: 'هل عينات التشغيل والقياسات ضمن حدود الضبط SPC وخالية من العيوب الحرجة؟',
          questionEn: 'Are in-process samples within SPC control limits & free of critical defects?',
          passLabelAr: 'مطابق ومستقر: استمرار خط الإنتاج وإجازة اللوت للمرحلة التالية ⬇️',
          passLabelEn: 'Conforming: Production line in statistical control, cleared for next step',
          passTargetStageNumber: 3,
          failLabelAr: 'خلل أو أندون: إيقاف فوري للماكينة، حجز الإنتاج، واستدعاء فريق حل المشكلات لفتح NCR و 8D ➡️',
          failLabelEn: 'Out of Control / Andon Alert: Immediate line hold, containment & NCR escalation',
          accentColor: '#06b6d4',
          targetNcr: true
        })}

        {/* ==================================================================== */}
        {/* STAGE 3: PROBLEM SOLVING & NCR / 8D / CAPA                           */}
        {/* ==================================================================== */}
        <section 
          id="DEPT-STAGE-RESOLUTION" 
          className={`p-5 sm:p-6 rounded-3xl bg-slate-900/80 border-2 border-rose-500/60 space-y-4 shadow-2xl transition-all ${
            highlightedStageId === 'DEPT-STAGE-RESOLUTION' ? 'stage-highlight-ncr ring-4 ring-rose-500' : ''
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-rose-500/20">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-xl text-xs font-mono font-black bg-rose-500/20 text-rose-400 border border-rose-500/40">
                STAGE 03
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-rose-400">
                    {isAr ? 'المرحلة 3: عدم المطابقة وحل المشكلات (NCR / 8D / CAPA)' : 'Stage 3: Problem Solving, NCR & Corrective Actions'}
                  </h3>
                  {highlightedStageId === 'DEPT-STAGE-RESOLUTION' && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-slate-950 font-black text-[10px] animate-bounce">
                      {isAr ? '⚡ تم التحويل هنا' : 'Active Escalation'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300">
                  {isAr 
                    ? 'مركز احتواء العيوب: تقارير NCR، الإجراءات التصحيحية CAPA، مشاريع 8D، تصاريح الحيود، وضبط التغيير الهندسي' 
                    : 'NCR reports, CAPA actions, 8D root-cause investigations, concessions & engineering change control'}
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
        </section>

        {/* DECISION GATE 3 (NCR & CAPA RESOLUTION) */}
        {renderDecisionDiamond({
          gateNumber: 3,
          questionAr: 'هل تم حصر الخلل، إغلاق السبب الجذري 8D، وتأكيد فعالية الإجراء التصحيحي CAPA؟',
          questionEn: 'Has the root cause been contained, 8D verified & CAPA corrective action closed?',
          passLabelAr: 'تم الحل والاعتماد: فك الحجر الصحي وتصريح الدفعة للإفراج للشحن والفحص النهائي ⬇️',
          passLabelEn: 'Resolved & Verified: Quarantine lifted, lot released to Final OQC',
          passTargetStageNumber: 4,
          failLabelAr: 'قيد التحقيق: استمرار العزل في منطقة الحجر والرفع للجنة مراجعة المواد (MRB) ➡️',
          failLabelEn: 'Under Investigation: Maintain containment and escalate to MRB Committee',
          accentColor: '#f43f5e',
          targetNcr: false
        })}

        {/* ==================================================================== */}
        {/* STAGE 4: OUTGOING QUALITY (OQC)                                       */}
        {/* ==================================================================== */}
        <section id="DEPT-STAGE-OUTGOING" className="p-5 sm:p-6 rounded-3xl bg-slate-900/70 border-2 border-emerald-500/40 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-xl text-xs font-mono font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                STAGE 04
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  {isAr ? 'المرحلة 4: فحص وخروج المنتج النهائي (OQC)' : 'Stage 4: Outgoing Quality & Release (OQC)'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr ? 'فحص عينات القبول AQL للشحنات التامة الصنع قبل التحميل وإصدار شهادات المطابقة COC' : 'Pre-shipment AQL sampling, COC certificates & final release authorization'}
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

        {/* DECISION GATE 4 (OQC) */}
        {renderDecisionDiamond({
          gateNumber: 4,
          questionAr: 'هل شحنة المنتج التام مطابقة لمعايير قبول عينات AQL؟',
          questionEn: 'Are finished goods lots fully compliant with AQL acceptance criteria?',
          passLabelAr: 'مطابق ومجاز: إصدار شهادة المطابقة COC والترخيص بالشحن والتسليم للعميل ⬇️',
          passLabelEn: 'Compliant: Issue COC Certificate and authorize shipment to Customer',
          passTargetStageNumber: 5,
          failLabelAr: 'مرفوض: حجز الشحنة ومنع خروجها وإحالتها فوراً إلى المرحلة 3 لإعادة الفرز أو NCR ➡️',
          failLabelEn: 'Rejected: Immediate dock lock, quarantine & escalation to Stage 3 NCR',
          accentColor: '#10b981',
          targetNcr: true
        })}

        {/* ==================================================================== */}
        {/* STAGE 5: CUSTOMER COMPLAINTS                                          */}
        {/* ==================================================================== */}
        <section id="DEPT-STAGE-CUSTOMER" className="p-5 sm:p-6 rounded-3xl bg-slate-900/70 border-2 border-indigo-500/40 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-xl text-xs font-mono font-black bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                STAGE 05
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  {isAr ? 'المرحلة 5: شكاوى العملاء والميدان (Customer Quality)' : 'Stage 5: Customer Complaints & Field QA'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr ? 'استقبال بلاغات العملاء ومطالبات الضمان ومرتجعات RMA وتحويل الملاحظات للهندسة' : 'Customer claims, warranty returns RMA & field feedback loops'}
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

        {/* DECISION GATE 5 (CUSTOMER RMA) */}
        {renderDecisionDiamond({
          gateNumber: 5,
          questionAr: 'هل تم حل شكوى العميل، تسوية المرتجع RMA، واستخلاص السبب الفني؟',
          questionEn: 'Has customer claim been settled, RMA processed & technical feedback extracted?',
          passLabelAr: 'نعم: إغلاق الشكوى وتمرير الملاحظات للمختبر الهندسي والتدقيق لتحديث FMEA ⬇️',
          passLabelEn: 'Yes: Claim closed and feedback transferred to Lab & Audits to update FMEA',
          passTargetStageNumber: 6,
          failLabelAr: 'شكوى حرجة مفتوحة: تصعيد فوري لتشكيل فريق 8D طارئ بالمرحلة 3 ➡️',
          failLabelEn: 'Open Critical Claim: Trigger emergency 8D project in Stage 3',
          accentColor: '#6366f1',
          targetNcr: true
        })}

        {/* ==================================================================== */}
        {/* STAGE 6: ENGINEERING LAB & AUDITS                                     */}
        {/* ==================================================================== */}
        <section id="DEPT-STAGE-COMPLIANCE" className="p-5 sm:p-6 rounded-3xl bg-slate-900/70 border-2 border-purple-500/40 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-xl text-xs font-mono font-black bg-purple-500/20 text-purple-400 border border-purple-500/40">
                STAGE 06
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  {isAr ? 'المرحلة 6: المختبر الهندسي والتدقيق (Lab & Audits)' : 'Stage 6: Engineering Lab & Audits'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr ? 'خطط التحكم Control Plan، تحليل المخاطر FMEA، معايرة الأجهزة MSA، مراجعات LPA، والتدقيق الداخلي' : 'Control Plans, FMEA risk analysis, gage calibration MSA, LPA audits & ISO audits'}
                </p>
              </div>
            </div>
            <span className="text-xs text-purple-400 font-mono font-bold bg-purple-950 px-3 py-1 rounded-full border border-purple-500/30 shrink-0">
              5 Tabs
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {(stationsByDept.get('DEPT-STAGE-COMPLIANCE') || []).map(st => renderCard(st, '#a855f7'))}
          </div>
        </section>

        {renderFlowPipe('#3b82f6', 'تحديث وثائق النظام والبيانات', 'Update Master Data')}

        {/* ==================================================================== */}
        {/* STAGE 7: FACTORY SETUP & MASTER DATA                                 */}
        {/* ==================================================================== */}
        <section id="DEPT-STAGE-SETUP" className="p-5 sm:p-6 rounded-3xl bg-slate-900/70 border-2 border-blue-500/40 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-blue-500/20">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-xl text-xs font-mono font-black bg-blue-500/20 text-blue-400 border border-blue-500/40">
                STAGE 07
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  {isAr ? 'المرحلة 7: تهيئة المصنع والبيانات (Setup & Master Data)' : 'Stage 7: Factory Setup & Master Data'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr ? 'البيانات الرئيسية للأجزاء والموديلات، مصمم نماذج الفحص، وقاعدة الدروس المستفادة' : 'Parts & models catalog, dynamic form designer & lessons learned repository'}
                </p>
              </div>
            </div>
            <span className="text-xs text-blue-400 font-mono font-bold bg-blue-950 px-3 py-1 rounded-full border border-blue-500/30 shrink-0">
              3 Tabs
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(stationsByDept.get('DEPT-STAGE-SETUP') || []).map(st => renderCard(st, '#3b82f6'))}
          </div>
        </section>

        {/* CLOSED-LOOP CONTINUOUS IMPROVEMENT FEEDBACK LOOP */}
        <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-purple-950/40 via-blue-950/40 to-emerald-950/40 border-2 border-cyan-500/50 flex flex-col md:flex-row items-center justify-between gap-4 text-xs shadow-2xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40 shrink-0 shadow-lg shadow-cyan-500/20">
              <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/30">
                  {isAr ? 'دورة الجودة الشاملة المغلقة' : 'Total Quality Closed Loop'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold">
                  Stage 7 ➔ Stage 1
                </span>
              </div>
              <h5 className="font-black text-white text-sm sm:text-base mt-1">
                {isAr ? 'تغذية عكسية مستمرة وتحديث تلقائي لجميع المراحل' : 'Continuous Closed-Loop Feedback & Standard Evolution'}
              </h5>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {isAr 
                  ? 'الدروس المستفادة والبيانات وقوالب الفحص من المرحلة 7 تُعيد تلقائياً ضبط خطط فحص المواد الخام في المرحلة 1 ومعايير خطوط الإنتاج لمنع تكرار أي خلل نهائياً.' 
                  : 'Master data, lessons learned and form templates continuously refine Stage 1 receiving criteria and production plans.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => scrollToStage('DEPT-STAGE-INCOMING', true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 shrink-0"
          >
            <span>{isAr ? 'العودة لبداية المسار (المرحلة 1) ▲' : 'Back to Stage 1 (Top) ▲'}</span>
          </button>
        </div>

        {/* SUCCESS TERMINAL */}
        <div className="flex flex-col items-center pt-2">
          <div className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/20 border-2 border-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>{isAr ? '🏁 نهاية الدورة: مطابقة تامة 100% وتحسين مستمر' : 'END: 100% Conformance & Continuous Excellence'}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ModernQualityFlowchart;
