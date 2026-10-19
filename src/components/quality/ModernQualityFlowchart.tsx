// @ts-nocheck
import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Smartphone, Activity, ShieldAlert, Workflow, PackageCheck,
  ShieldCheck, Database, ArrowRight, ArrowLeft, RefreshCw, Filter,
  Layers, CheckCircle2, GitBranch, ArrowUpRight, Search,
  Box, AlertTriangle, Info, ZoomIn, ZoomOut, Maximize2, RotateCcw,
  Check, X, FileText, ChevronRight, Zap, Target, Sparkles, ExternalLink
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

type FlowFilter = 'all' | 'pass-only' | 'escalation' | 'feedback';

export const ModernQualityFlowchart: React.FC<ModernQualityFlowchartProps> = ({
  equipmentList,
  stationStatuses,
  selectedStationId,
  onSelectStation,
  selectedDepartmentId,
  onSelectDepartment,
  isAr,
  onSwitchTo3D,
  onSwitchTo2D,
}) => {
  const navigate = useNavigate();
  const [filterMode, setFilterMode] = useState<FlowFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const diagramRef = useRef<HTMLDivElement>(null);

  // Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // left click only
    // Only drag if clicking on the background, not on buttons or links
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

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
    let totalDefects = 0;
    let totalNcrs = 0;

    equipmentList.forEach(eq => {
      const st = stationStatuses[eq.id];
      if (st) {
        if (st.status === 'alert' || st.isAndonActive) alertCount++;
        else normalCount++;
        totalDefects += st.defectCount || 0;
        totalNcrs += st.openNcrCount || 0;
      } else {
        normalCount++;
      }
    });
    return { alertCount, normalCount, totalDefects, totalNcrs };
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

  // Flowchart Node Renderer Component
  const renderFlowNode = (station: ScadaEquipment, accentColor: string) => {
    const stStatus = stationStatuses[station.id];
    const isAlert = stStatus?.status === 'alert' || stStatus?.isAndonActive;
    const isWarning = stStatus?.status === 'warning';
    const isSelected = selectedStationId === station.id;
    const isHovered = hoveredNodeId === station.id;
    const matchesSearch = searchQuery.trim() 
      ? station.titleAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.code.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return (
      <div
        key={station.id}
        onMouseEnter={() => setHoveredNodeId(station.id)}
        onMouseLeave={() => setHoveredNodeId(null)}
        onClick={() => onSelectStation(station.id)}
        className={`w-64 p-3 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-start relative group shadow-lg ${
          !matchesSearch ? 'opacity-30 scale-95' : 'opacity-100'
        } ${
          isSelected
            ? 'bg-slate-900 border-cyan-400 ring-4 ring-cyan-500/30 scale-105 z-30'
            : isAlert
              ? 'bg-slate-950/95 border-rose-500/80 shadow-rose-950/50 hover:border-rose-400'
              : isWarning
                ? 'bg-slate-950/95 border-amber-500/80 hover:border-amber-400'
                : 'bg-slate-950/90 border-slate-700/80 hover:border-slate-500 hover:bg-slate-900'
        } ${isHovered ? 'scale-102 shadow-2xl' : ''}`}
        style={{
          borderTopColor: accentColor,
          borderTopWidth: '4px'
        }}
      >
        {/* Node Header */}
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span 
              style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
              className="p-1 rounded-lg border border-white/10"
            >
              {renderIcon(station.iconType, 'w-3.5 h-3.5')}
            </span>
            <span className="text-[10px] font-mono font-black text-slate-300">
              {station.code}
            </span>
          </div>

          {/* Status Badge */}
          {isAlert ? (
            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[9px] font-bold border border-rose-500/40 flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>{stStatus?.statusLabelAr || 'تنبيه'}</span>
            </span>
          ) : isWarning ? (
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold border border-amber-500/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>{stStatus?.statusLabelAr || 'تحذير'}</span>
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[9px] font-bold border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{isAr ? 'مطابق' : 'Pass'}</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="text-xs font-bold text-white leading-tight mb-1">
          {isAr ? station.titleAr : station.titleEn}
        </h4>
        <p className="text-[10px] text-slate-400 line-clamp-1 mb-2">
          {isAr ? station.locationAr : station.locationEn}
        </p>

        {/* Footer with 1-Click direct navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px]">
          <span className="font-mono text-slate-400">
            FPY: <b className="text-emerald-400">{station.fpyEstimate || 99}%</b>
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(station.moduleUrl);
            }}
            className="px-2 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 font-bold text-[10px] border border-cyan-500/30 flex items-center gap-1 transition-all shadow-sm"
            title={isAr ? `الانتقال المباشر إلى ${station.titleAr}` : `Open ${station.titleEn}`}
          >
            <span>{isAr ? 'فتح التبويب' : 'Open Tab'}</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  // Flowchart Decision Diamond Renderer
  const renderDecisionDiamond = (
    labelAr: string, 
    labelEn: string, 
    passLabelAr = 'مطابق (Pass)', 
    failLabelAr = 'غير مطابق (Rejection)',
    conditionKey: string
  ) => {
    return (
      <div className="flex flex-col items-center my-3 relative z-10">
        <div className="relative flex items-center justify-center">
          {/* Diamond Shape */}
          <div className="w-48 h-20 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-2 border-amber-400/80 rounded-2xl flex flex-col items-center justify-center p-2 text-center shadow-lg shadow-amber-500/10 backdrop-blur-md">
            <span className="text-[9px] font-mono font-black text-amber-400 uppercase tracking-widest mb-0.5">
              💎 {isAr ? 'معيار اتخاذ القرار' : 'Decision Gate'}
            </span>
            <p className="text-xs font-black text-white leading-tight">
              {isAr ? labelAr : labelEn}
            </p>
          </div>
        </div>

        {/* Decision Outputs Labels */}
        <div className="w-80 flex items-center justify-between text-[11px] font-black mt-2 px-2">
          <div className="flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
            <span>✓</span>
            <span>{passLabelAr}</span>
            <span>↓</span>
          </div>

          <div className="flex items-center gap-1 text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-500/40">
            <span>✕</span>
            <span>{failLabelAr}</span>
            <span>→</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-[#03060f] text-slate-100 overflow-hidden select-none relative font-sans">
      {/* 1. TOP HEADER & FLOWCHART CONTROLS BAR */}
      <div className="flex-none p-3 md:px-6 bg-[#060b17]/95 border-b border-white/10 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-300">
            <Workflow className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-black tracking-wide text-white">
                {isAr ? 'المخطط الانسيابي الشامل للجودة (Quality Process Flowchart)' : 'End-to-End Quality Flowchart'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold">
                {isAr ? '22 قسماً • 7 مراحل' : '22 Tabs • 7 Stages'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {isAr 
                ? 'فلو شارت تدفقي تفاعلي هندسي واضح للمسار القياسي، معايير القرار، وتصعيد عدم المطابقة وحلقة التحسين' 
                : 'Interactive engineering flowchart connecting real platform tabs with decision gates & closed-loop'}
            </p>
          </div>
        </div>

        {/* Live Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                filterMode === 'all'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? '🌟 كامل الفلو شارت' : 'Full Flowchart'}
            </button>

            <button
              onClick={() => setFilterMode('pass-only')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                filterMode === 'pass-only'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                  : 'text-emerald-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{isAr ? 'مسار القبول والإنتاج' : 'Pass Flow'}</span>
            </button>

            <button
              onClick={() => setFilterMode('escalation')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                filterMode === 'escalation'
                  ? 'bg-rose-500 text-white font-black shadow-md'
                  : 'text-rose-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>{isAr ? 'مسار عدم المطابقة' : 'Rejection & NCR'}</span>
            </button>

            <button
              onClick={() => setFilterMode('feedback')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                filterMode === 'feedback'
                  ? 'bg-purple-500 text-white font-black shadow-md'
                  : 'text-purple-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>{isAr ? 'حلقة التحسين المغلقة' : 'Closed Loop'}</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-44 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث بالاسم أو الكود...' : 'Search node...'}
              className="w-full pr-8 pl-3 py-1 rounded-xl bg-black/60 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Zoom / Pan Controls */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title={isAr ? 'تصغير' : 'Zoom Out'}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-slate-400 px-1">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(1.8, prev + 0.1))}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title={isAr ? 'تكبير' : 'Zoom In'}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetView}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title={isAr ? 'إعادة ضبط العرض' : 'Reset View'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. FLOWCHART CANVAS (DRAGGABLE & ZOOMABLE) */}
      <div
        ref={diagramRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`flex-1 w-full h-full overflow-hidden p-6 relative flex justify-center items-start cursor-${isPanning ? 'grabbing' : 'grab'}`}
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      >
        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: isPanning ? 'none' : 'transform 0.15s ease-out',
          }}
          className="min-w-[1240px] max-w-[1400px] flex flex-col items-center gap-6 pb-24"
        >
          {/* FLOWCHART START TERMINAL */}
          <div className="flex flex-col items-center">
            <div className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 text-slate-950 font-black text-xs shadow-xl shadow-cyan-500/20 border-2 border-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <span>{isAr ? '🏁 نقطة البداية: تهيئة المصنع والبيانات والمختبر الهندسي' : 'START: Factory Setup & Engineering Standards'}</span>
            </div>
            <div className="w-0.5 h-6 bg-gradient-to-b from-cyan-400 to-blue-500" />
            <div className="text-cyan-400 text-xs">▼</div>
          </div>

          {/* LEVEL 1: FOUNDATION TIER (Stage 7 & Stage 6) */}
          <div className="w-full grid grid-cols-2 gap-8 p-4 rounded-3xl bg-slate-900/60 border-2 border-blue-500/30 backdrop-blur-sm">
            {/* STAGE 7: SETUP & MASTER DATA */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-blue-500/20">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-blue-500/20 text-blue-400 border border-blue-500/40">
                    STAGE 07
                  </span>
                  <h3 className="text-xs font-black text-white">{isAr ? '7. تهيئة المصنع والبيانات الرئيسية' : '7. Factory Setup & Master Data'}</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">3 Tabs</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {(stationsByDept.get('DEPT-STAGE-SETUP') || []).map(st => renderFlowNode(st, '#3b82f6'))}
              </div>
            </div>

            {/* STAGE 6: LAB & COMPLIANCE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-purple-500/20 text-purple-400 border border-purple-500/40">
                    STAGE 06
                  </span>
                  <h3 className="text-xs font-black text-white">{isAr ? '6. المختبر الهندسي والـ FMEA والتدقيق' : '6. Engineering Lab, FMEA & Audits'}</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">5 Tabs</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {(stationsByDept.get('DEPT-STAGE-COMPLIANCE') || []).map(st => renderFlowNode(st, '#a855f7'))}
              </div>
            </div>
          </div>

          {/* ARROW FROM FOUNDATION TO VALUE STREAM */}
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-6 bg-gradient-to-b from-blue-500 to-amber-500" />
            <div className="text-amber-400 text-xs">▼</div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
              {isAr ? 'تغذية معايير الفحص وخطط التحكم Control Plan' : 'Inspection Specs & Sampling Plans Applied'}
            </span>
            <div className="w-0.5 h-4 bg-amber-500" />
            <div className="text-amber-400 text-xs">▼</div>
          </div>

          {/* MAIN 2-COLUMN FLOWCHART: VALUE STREAM (RIGHT/MAIN) vs RESOLUTION & ESCALATION (LEFT) */}
          <div className="w-full grid grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN (4 COLS): RESOLUTION & DEFECT ESCALATION LOOP (Stage 3) */}
            <div className="col-span-4 p-4 rounded-3xl bg-slate-950/80 border-2 border-rose-500/40 space-y-4 shadow-2xl relative">
              <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-rose-500/20 text-rose-400 border border-rose-500/40">
                    STAGE 03
                  </span>
                  <h3 className="text-xs font-black text-rose-400">
                    {isAr ? 'مسار عدم المطابقة وحل المشكلات (NCR/8D)' : 'Problem Solving & Escalation'}
                  </h3>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 text-[9px] font-mono border border-rose-500/30">
                  {isAr ? 'حلقة مغلقة' : 'Closed Loop'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20 text-[11px] text-slate-300 leading-relaxed">
                {isAr 
                  ? 'يتم تحويل أي شحنة أو قطعة مخالفة فوراً من بوابات القرار إلى مسار عدم المطابقة لحصرها وعزلها، وإصدار تقرير NCR وإجراء تصحيحي CAPA ومشروع 8D.'
                  : 'All non-conformances from IQC, IPQC, OQC or Customers are escalated here for containment and resolution.'}
              </div>

              {/* STAGE 3 TABS IN ORDER */}
              <div className="flex flex-col gap-3 items-center">
                {(stationsByDept.get('DEPT-STAGE-RESOLUTION') || []).map((st, i, arr) => (
                  <React.Fragment key={st.id}>
                    {renderFlowNode(st, '#f43f5e')}
                    {i < arr.length - 1 && (
                      <div className="flex flex-col items-center">
                        <div className="w-0.5 h-3 bg-rose-500/60" />
                        <div className="text-rose-400 text-[10px]">▼</div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* CLOSED-LOOP FEEDBACK ARROW UPWARD TO FOUNDATION */}
              <div className="mt-4 pt-3 border-t border-rose-500/30 flex flex-col items-center gap-1.5 text-center">
                <div className="flex items-center gap-1 text-[10px] font-black text-purple-400 font-mono bg-purple-950/60 px-3 py-1 rounded-full border border-purple-500/40">
                  <RefreshCw className="w-3 h-3 text-purple-400 animate-spin" />
                  <span>{isAr ? 'تغذية عكسية صاعدة: تحديث FMEA والدروس المستفادة' : 'Feedback Loop: Updates FMEA & Master Data'}</span>
                  <span>▲</span>
                </div>
                <span className="text-[9px] text-slate-400">
                  {isAr ? 'يمنع تكرار الخطأ مستقبلياً' : 'Guarantees defect recurrence prevention'}
                </span>
              </div>
            </div>

            {/* RIGHT COLUMN (8 COLS): VALUE STREAM PASS FLOW (Stages 1, 2, 4, 5) */}
            <div className="col-span-8 space-y-6">
              {/* STAGE 1: INCOMING & SUPPLIER (IQC) */}
              <div className="p-4 rounded-3xl bg-slate-900/60 border-2 border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">
                      STAGE 01
                    </span>
                    <h3 className="text-xs font-black text-white">{isAr ? '1. استلام الخامات والموردين (IQC)' : '1. Incoming & Supplier Quality (IQC)'}</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">3 Tabs</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(stationsByDept.get('DEPT-STAGE-INCOMING') || []).map(st => renderFlowNode(st, '#f59e0b'))}
                </div>
              </div>

              {/* DECISION GATE 1 (IQC) */}
              {renderDecisionDiamond(
                'هل المواد الخام مطابقة للمواصفة ومعايير الفحص؟',
                'Are raw materials compliant with incoming specs?',
                isAr ? 'نعم (مطابق للإفراج للمصنع)' : 'Pass (Released to Production)',
                isAr ? 'لا (مرفوض - تحويل لـ NCR)' : 'Fail (Escalate to NCR)',
                'iqc-gate'
              )}

              {/* STAGE 2: IN-PROCESS QUALITY (IPQC) */}
              <div className="p-4 rounded-3xl bg-slate-900/60 border-2 border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                      STAGE 02
                    </span>
                    <h3 className="text-xs font-black text-white">{isAr ? '2. جودة التصنيع والعمليات (IPQC)' : '2. In-Process Quality (IPQC)'}</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">4 Tabs</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(stationsByDept.get('DEPT-STAGE-INPROCESS') || []).map(st => renderFlowNode(st, '#06b6d4'))}
                </div>
              </div>

              {/* DECISION GATE 2 (IPQC) */}
              {renderDecisionDiamond(
                'هل عمليات التشغيل والقياسات ضمن حدود التحكم SPC؟',
                'Are in-process measurements within SPC control limits?',
                isAr ? 'نعم (إجازة ونقل للفحص النهائي)' : 'Pass (Proceed to Final OQC)',
                isAr ? 'لا (خلل - إيقاف أندون و NCR)' : 'Fail (Hold & Open NCR)',
                'ipqc-gate'
              )}

              {/* STAGE 4: OUTGOING QUALITY (OQC) */}
              <div className="p-4 rounded-3xl bg-slate-900/60 border-2 border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      STAGE 04
                    </span>
                    <h3 className="text-xs font-black text-white">{isAr ? '4. فحص وخروج المنتج النهائي (OQC)' : '4. Outgoing Quality & Pre-Shipment (OQC)'}</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">1 Tab</span>
                </div>

                <div className="flex justify-center">
                  {(stationsByDept.get('DEPT-STAGE-OUTGOING') || []).map(st => renderFlowNode(st, '#10b981'))}
                </div>
              </div>

              {/* DECISION GATE 3 (OQC) */}
              {renderDecisionDiamond(
                'هل شحنة المنتج التام مطابقة لمعايير قبول عينات AQL؟',
                'Are finished goods lots conforming to AQL criteria?',
                isAr ? 'نعم (إصدار شهادة المطابقة COC للشحن)' : 'Pass (Issue COC & Ship)',
                isAr ? 'لا (حجز الشحنة وإحالة لـ NCR)' : 'Fail (Quarantine & NCR)',
                'oqc-gate'
              )}

              {/* STAGE 5: CUSTOMER & FIELD QUALITY */}
              <div className="p-4 rounded-3xl bg-slate-900/60 border-2 border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                      STAGE 05
                    </span>
                    <h3 className="text-xs font-black text-white">{isAr ? '5. شكاوى العملاء والجودة الميدانية' : '5. Customer & Field Quality'}</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">1 Tab</span>
                </div>

                <div className="flex justify-center">
                  {(stationsByDept.get('DEPT-STAGE-CUSTOMER') || []).map(st => renderFlowNode(st, '#6366f1'))}
                </div>
              </div>

              {/* FINAL TERMINAL */}
              <div className="flex flex-col items-center pt-2">
                <div className="w-0.5 h-6 bg-emerald-500" />
                <div className="text-emerald-400 text-xs">▼</div>
                <div className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/20 border-2 border-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>{isAr ? '🏁 نهاية المسار: منتجات سليمة 100% وإفراج للعميل' : 'END: 100% Conforming Delivery & Customer Satisfaction'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM FOOTER WITH FAST SWITCHERS IF USER WANTS 2D / 3D */}
      <div className="flex-none p-2.5 px-6 bg-[#060b17] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs z-20">
        <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>{isAr ? 'المسار الأخضر: القبول والتدفق الطبيعي' : 'Green: Pass Value Flow'}</span>
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>{isAr ? 'المسار الأحمر: العزل وتصعيد عدم المطابقة' : 'Red: Defect Escalation'}</span>
          </span>
          <span className="flex items-center gap-1.5 text-purple-400">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            <span>{isAr ? 'المسار البنفسجي: حلقة التحسين والتغذية العكسية' : 'Purple: Closed-Loop Feedback'}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onSwitchTo2D && (
            <button
              onClick={onSwitchTo2D}
              className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'خريطة 2D SCADA' : '2D SCADA Plan'}</span>
            </button>
          )}

          {onSwitchTo3D && (
            <button
              onClick={onSwitchTo3D}
              className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Box className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isAr ? 'التوأم الرقمي 3D' : '3D WebGL Twin'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernQualityFlowchart;
