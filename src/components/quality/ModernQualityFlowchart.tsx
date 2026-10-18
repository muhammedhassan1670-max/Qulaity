// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Smartphone, Activity, ShieldAlert, Workflow, PackageCheck,
  ShieldCheck, Database, ArrowRight, ArrowLeft, RefreshCw, Filter,
  Layers, CheckCircle2, GitBranch, ArrowUpRight, Search,
  Box, AlertTriangle, Info
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

type FlowFilter = 'all' | 'value-stream' | 'ncr-escalation' | 'lab-compliance' | 'master-setup' | 'alerts-only';
type LayoutMode = 'pipeline' | 'closed-loop' | 'grid';

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
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('pipeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredStationId, setHoveredStationId] = useState<string | null>(null);

  // Icon mapping for equipment
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

  // Group stations strictly by Enterprise Department (7 Stages, 22 Tabs)
  const stationsByDepartment = useMemo(() => {
    const map = new Map<string, ScadaEquipment[]>();
    ENTERPRISE_DEPARTMENTS.forEach(dept => {
      map.set(dept.id, []);
    });

    equipmentList.forEach(eq => {
      const dept = getDepartmentForStation(eq.id);
      if (dept && map.has(dept.id)) {
        map.get(dept.id)!.push(eq);
      }
    });

    return map;
  }, [equipmentList]);

  // Overall KPI stats
  const stats = useMemo(() => {
    let alertCount = 0;
    let normalCount = 0;
    let totalDefects = 0;
    let totalNcrs = 0;
    let totalCapas = 0;

    equipmentList.forEach(eq => {
      const st = stationStatuses[eq.id];
      if (st) {
        if (st.status === 'alert' || st.isAndonActive) alertCount++;
        else normalCount++;
        totalDefects += st.defectCount || 0;
        totalNcrs += st.openNcrCount || 0;
        totalCapas += st.capaCount || 0;
      } else {
        normalCount++;
      }
    });

    return { alertCount, normalCount, totalDefects, totalNcrs, totalCapas };
  }, [equipmentList, stationStatuses]);

  // Filtered departments based on selected flow
  const filteredDepartments = useMemo(() => {
    return ENTERPRISE_DEPARTMENTS.filter(dept => {
      if (filterMode === 'value-stream') {
        return ['DEPT-STAGE-INCOMING', 'DEPT-STAGE-INPROCESS', 'DEPT-STAGE-OUTGOING', 'DEPT-STAGE-CUSTOMER'].includes(dept.id);
      }
      if (filterMode === 'ncr-escalation') {
        return ['DEPT-STAGE-RESOLUTION'].includes(dept.id);
      }
      if (filterMode === 'lab-compliance') {
        return ['DEPT-STAGE-COMPLIANCE'].includes(dept.id);
      }
      if (filterMode === 'master-setup') {
        return ['DEPT-STAGE-SETUP'].includes(dept.id);
      }
      return true;
    });
  }, [filterMode]);

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-[#050811] text-slate-100 overflow-hidden select-none">
      {/* 1. COMPACT FAST FILTER & KPI BAR */}
      <div className="flex-none p-3 md:px-6 bg-[#070c18]/90 border-b border-white/10 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
            <GitBranch className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-black tracking-wide text-white">
                {isAr ? 'فلو شارت تدفق الجودة الشامل' : 'End-to-End Quality Flowchart'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                {isAr ? 'مباشر وسريع' : 'Ultra-Fast'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {isAr 
                ? 'تدفق متسلسل لجميع مراحل الجودة الـ 7 والـ 22 قسماً بالمنصة مع إمكانية الوصول المباشر بنقرة واحدة' 
                : 'Interactive visual pipeline of all 7 stages & 22 platform modules with instant 1-click navigation'}
            </p>
          </div>
        </div>

        {/* Global Statistics Indicators */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>{isAr ? 'المحطات:' : 'Stations:'} <b>22</b></span>
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? 'سليمة:' : 'Normal:'} <b>{stats.normalCount}</b></span>
            </span>
            {stats.alertCount > 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 flex items-center gap-1.5 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>{isAr ? 'تنبيهات:' : 'Alerts:'} <b>{stats.alertCount}</b></span>
              </span>
            )}
          </div>

          {/* Quick Layout Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setLayoutMode('pipeline')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                layoutMode === 'pipeline'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={isAr ? 'عرض المسار المتسلسل للمراحل' : 'Sequential Pipeline Swimlanes'}
            >
              <Workflow className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'مسارات المراحل' : 'Pipeline'}</span>
            </button>

            <button
              onClick={() => setLayoutMode('closed-loop')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                layoutMode === 'closed-loop'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={isAr ? 'مخطط الحلقة المغلقة وتصعيد العيوب' : 'Closed Loop & Defect Escalation'}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'حلقة مغلقة' : 'Closed Loop'}</span>
            </button>

            <button
              onClick={() => setLayoutMode('grid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                layoutMode === 'grid'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={isAr ? 'شبكة الأقسام المتكاملة' : 'Matrix Grid'}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'شبكة' : 'Grid'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SUB-HEADER: FLOW FILTER PILLS & SEARCH */}
      <div className="flex-none px-4 py-2 bg-[#090f1d] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Flow Filtering Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-cyan-400" />
            <span>{isAr ? 'تصفية المسار:' : 'Flow Filter:'}</span>
          </span>

          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
              filterMode === 'all'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            {isAr ? 'جميع المحطات (22)' : 'All Modules (22)'}
          </button>

          <button
            onClick={() => setFilterMode('value-stream')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              filterMode === 'value-stream'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{isAr ? 'مسار الخامات والإنتاج (Value Stream)' : 'Value Stream (1,2,4,5)'}</span>
          </button>

          <button
            onClick={() => setFilterMode('ncr-escalation')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              filterMode === 'ncr-escalation'
                ? 'bg-rose-500 text-white font-black shadow-md shadow-rose-500/20'
                : 'bg-slate-900 hover:bg-slate-800 text-rose-400 border border-rose-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>{isAr ? 'مسار عدم المطابقة وحل المشكلات (NCR/8D)' : 'Problem Solving (Stage 3)'}</span>
          </button>

          <button
            onClick={() => setFilterMode('lab-compliance')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              filterMode === 'lab-compliance'
                ? 'bg-purple-500 text-white font-black shadow-md shadow-purple-500/20'
                : 'bg-slate-900 hover:bg-slate-800 text-purple-400 border border-purple-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>{isAr ? 'المختبر والتدقيق (Lab & Audits)' : 'Lab & Audits (Stage 6)'}</span>
          </button>

          <button
            onClick={() => setFilterMode('master-setup')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              filterMode === 'master-setup'
                ? 'bg-blue-500 text-white font-black shadow-md shadow-blue-500/20'
                : 'bg-slate-900 hover:bg-slate-800 text-blue-400 border border-blue-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>{isAr ? 'البيانات والتهيئة (Master Data)' : 'Setup & Master Data (Stage 7)'}</span>
          </button>
        </div>

        {/* Real-time Search Box */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث بالاسم، الكود، أو التبويب...' : 'Search station or tab...'}
            className="w-full pr-8 pl-3 py-1 rounded-xl bg-black/60 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono transition-colors"
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
      </div>

      {/* 3. MAIN WORKSPACE: FLOW PIPELINE VIEW */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-slate-700/50">
        {layoutMode === 'pipeline' && (
          <div className="min-w-[1320px] flex flex-col gap-6">
            {/* Visual Process Map Legend */}
            <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-bold text-slate-400">{isAr ? 'دليل مسارات التدفق التفاعلي:' : 'Flow Legend:'}</span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-3 h-1 bg-emerald-400 rounded-full" />
                  <span>{isAr ? 'تدفق الخامات السليمة (Approved Material Flow)' : 'Approved Value Stream'}</span>
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-3 h-1 bg-rose-500 rounded-full" />
                  <span>{isAr ? 'مسار العزل وتصعيد عدم المطابقة (Defect Escalation)' : 'NCR Escalation'}</span>
                </span>
                <span className="flex items-center gap-1.5 text-purple-400">
                  <span className="w-3 h-1 bg-purple-400 rounded-full" />
                  <span>{isAr ? 'حوكمة المختبر وتغذية خطة التحكم (Governance & MSA)' : 'Engineering Governance'}</span>
                </span>
                <span className="flex items-center gap-1.5 text-blue-400">
                  <span className="w-3 h-1 bg-blue-400 rounded-full" />
                  <span>{isAr ? 'البيانات الرئيسية والدروس المستفادة (Lessons Learned)' : 'Master Data Feedback'}</span>
                </span>
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                {isAr ? 'انقر على أي محطة للانتقال للقسم فوراً أو عرض تفاصيلها' : 'Click any station to open module or view SCADA telemetry'}
              </div>
            </div>

            {/* PIPELINE SWIMLANES: THE 7 STAGES IN HORIZONTAL SEQUENCE */}
            <div className="grid grid-cols-7 gap-4 items-start">
              {filteredDepartments.map((dept, idx) => {
                const deptStations = stationsByDepartment.get(dept.id) || [];
                const filteredDeptStations = deptStations.filter(st => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    st.titleAr.toLowerCase().includes(q) ||
                    st.titleEn.toLowerCase().includes(q) ||
                    st.code.toLowerCase().includes(q) ||
                    st.line.toLowerCase().includes(q)
                  );
                });

                const isDeptSelected = selectedDepartmentId === dept.id;

                return (
                  <div
                    key={dept.id}
                    className={`flex flex-col rounded-2xl border transition-all duration-300 relative ${
                      isDeptSelected
                        ? 'border-cyan-400 shadow-xl shadow-cyan-500/10 ring-2 ring-cyan-500/30'
                        : `${dept.borderClass} bg-slate-900/60 hover:bg-slate-900/90`
                    }`}
                  >
                    {/* Stage Header */}
                    <div 
                      onClick={() => onSelectDepartment && onSelectDepartment(dept.id)}
                      className={`p-3 rounded-t-2xl bg-gradient-to-b ${dept.bgGradient} border-b border-white/5 cursor-pointer hover:brightness-110 transition-all`}
                      title={isAr ? `تصفية / تركيز على مرحلة ${dept.nameAr}` : `Focus ${dept.nameEn}`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span 
                          style={{ borderColor: dept.accentHex, color: dept.accentHex }}
                          className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black border bg-black/60"
                        >
                          {dept.code}
                        </span>

                        <span className="text-[10px] font-bold text-slate-400 font-mono">
                          {filteredDeptStations.length} {isAr ? 'محطات' : 'pods'}
                        </span>
                      </div>

                      <h3 className="text-xs font-black text-white leading-tight line-clamp-1" title={isAr ? dept.nameAr : dept.nameEn}>
                        {isAr ? dept.shortNameAr : dept.shortNameEn}
                      </h3>

                      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate">{dept.headOfDeptAr}</span>
                        <span className="font-mono font-bold text-white shrink-0">{dept.targetKpiValue}</span>
                      </div>
                    </div>

                    {/* Connecting Flow Arrow to Next Stage */}
                    {idx < filteredDepartments.length - 1 && (
                      <div className="absolute -left-3 top-12 z-20 hidden rtl:block pointer-events-none">
                        <div className="w-6 h-6 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    )}
                    {idx < filteredDepartments.length - 1 && (
                      <div className="absolute -right-3 top-12 z-20 hidden ltr:block pointer-events-none">
                        <div className="w-6 h-6 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    )}

                    {/* Department Stations List (The 22 Tabs) */}
                    <div className="p-2 space-y-2 flex-1">
                      {filteredDeptStations.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-[11px]">
                          {isAr ? 'لا توجد نتائج مطابقة' : 'No matching stations'}
                        </div>
                      ) : (
                        filteredDeptStations.map((station) => {
                          const stStatus = stationStatuses[station.id];
                          const isAlert = stStatus?.status === 'alert' || stStatus?.isAndonActive;
                          const isWarning = stStatus?.status === 'warning';
                          const isSelected = selectedStationId === station.id;
                          const isHovered = hoveredStationId === station.id;

                          return (
                            <div
                              key={station.id}
                              onMouseEnter={() => setHoveredStationId(station.id)}
                              onMouseLeave={() => setHoveredStationId(null)}
                              onClick={() => onSelectStation(station.id)}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer relative group ${
                                isSelected
                                  ? 'bg-cyan-950/80 border-cyan-400 shadow-lg ring-2 ring-cyan-400/40'
                                  : isAlert
                                    ? 'bg-rose-950/50 border-rose-500/60 shadow-lg shadow-rose-950/50'
                                    : isWarning
                                      ? 'bg-amber-950/40 border-amber-500/50'
                                      : 'bg-black/40 border-slate-800 hover:border-slate-600 hover:bg-slate-800/40'
                              } ${isHovered ? 'scale-[1.01] shadow-md shadow-cyan-500/10' : ''}`}
                            >
                              {/* Station Header: Icon + Code + Live Status */}
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className={`p-1 rounded-lg ${
                                    isAlert 
                                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                                      : isWarning 
                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                                        : 'bg-slate-800 text-slate-300'
                                  }`}>
                                    {renderIcon(station.iconType, 'w-3.5 h-3.5')}
                                  </span>
                                  <span className="text-[10px] font-mono font-black text-slate-300">
                                    {station.code}
                                  </span>
                                </div>

                                {/* Live Status Indicator */}
                                <div className="flex items-center gap-1">
                                  {isAlert ? (
                                    <span className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 text-[9px] font-bold border border-rose-500/40 animate-pulse">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                      <span>{stStatus?.statusLabelAr || 'تنبيه'}</span>
                                    </span>
                                  ) : isWarning ? (
                                    <span className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold border border-amber-500/40">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                      <span>{stStatus?.statusLabelAr || 'تحذير'}</span>
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/30">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                      <span>{isAr ? 'مطابق' : 'Pass'}</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Station Title */}
                              <h4 className="text-xs font-bold text-white leading-tight mb-1">
                                {isAr ? station.titleAr : station.titleEn}
                              </h4>
                              
                              <p className="text-[10px] text-slate-400 line-clamp-1 mb-2">
                                {isAr ? station.locationAr : station.locationEn}
                              </p>

                              {/* Live Telemetry / Defect Badges */}
                              <div className="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-white/5">
                                <span className="text-slate-400">
                                  FPY: <b className="text-emerald-400">{station.fpyEstimate || 99}%</b>
                                </span>
                                {(stStatus?.defectCount > 0 || stStatus?.openNcrCount > 0) ? (
                                  <span className="text-rose-400 font-bold">
                                    {stStatus.defectCount > 0 ? `${stStatus.defectCount} عيوب` : `${stStatus.openNcrCount} NCR`}
                                  </span>
                                ) : (
                                  <span className="text-cyan-400">
                                    OEE: {station.oeeEstimate || 95}%
                                  </span>
                                )}
                              </div>

                              {/* 1-Click Action Button directly to Real Platform Tab */}
                              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(station.moduleUrl);
                                  }}
                                  className="w-full py-1.5 px-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500 hover:to-blue-600 text-cyan-300 hover:text-slate-950 font-bold text-[11px] border border-cyan-500/30 flex items-center justify-center gap-1.5 transition-all group-hover:border-cyan-400 shadow-sm"
                                  title={isAr ? `الانتقال المباشر إلى صفحة ${station.titleAr}` : `Go to ${station.titleEn}`}
                                >
                                  <span>{isAr ? 'الانتقال للقسم' : 'Open Tab'}</span>
                                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LAYOUT MODE 2: CLOSED-LOOP INTERACTIVE ARCHITECTURE */}
        {layoutMode === 'closed-loop' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-blue-950/40 border border-purple-500/30 space-y-2">
              <div className="flex items-center gap-2 text-purple-300 font-black text-sm">
                <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
                <span>{isAr ? 'بنية حلقة الجودة المغلقة (Closed-Loop Quality Architecture)' : 'Closed-Loop Quality Architecture'}</span>
              </div>
              <p className="text-xs text-slate-300">
                {isAr
                  ? 'يربط النظام جميع مراحل الجودة في مسار دائري مغلق: الخلل في أي نقطة (IQC، IPQC، OQC، شكاوى العملاء) يتم تصعيده إلى تقرير عدم مطابقة NCR، ثم إجراء تصحيحي CAPA، ثم تحقيق جذري 8D، وينتهي بتحديث خطة التحكم FMEA والدروس المستفادة لمنع تكراره مستقبلياً.'
                  : 'Closed-loop quality guarantees that defects anywhere trigger root cause resolution, update FMEA & Control Plans, and prevent recurring failures.'}
              </p>
            </div>

            {/* 3 Major Process Tiers */}
            <div className="space-y-6">
              {/* TIER 1: FOUNDATION (Setup & Engineering Lab) */}
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-blue-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-400 flex items-center gap-1.5 uppercase font-mono">
                    <Database className="w-4 h-4 text-blue-400" />
                    <span>{isAr ? 'المستوى الأساسي: التهيئة والمختبر الهندسي والـ FMEA' : 'Foundation Tier: Master Data, Lab & FMEA'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Stages 7 & 6</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                  {[...stationsByDepartment.get('DEPT-STAGE-SETUP') || [], ...stationsByDepartment.get('DEPT-STAGE-COMPLIANCE') || []].map(station => (
                    <button
                      key={station.id}
                      onClick={() => navigate(station.moduleUrl)}
                      className="p-2 rounded-xl bg-black/40 border border-blue-500/20 hover:border-blue-400 text-start transition-all hover:scale-105 group"
                    >
                      <div className="text-[9px] font-mono font-bold text-blue-400 mb-0.5">{station.code}</div>
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300 line-clamp-1">{station.titleAr}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* TIER 2: VALUE STREAM (IQC -> IPQC -> OQC -> Customer) */}
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5 uppercase font-mono">
                    <PackageCheck className="w-4 h-4 text-emerald-400" />
                    <span>{isAr ? 'مسار القيمة المعتمد: الاستلام ──► التصنيع ──► الفحص النهائي ──► العملاء' : 'Value Stream Flow: IQC ──► IPQC ──► OQC ──► Customer'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Stages 1, 2, 4, 5</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-2">
                  {[
                    ...stationsByDepartment.get('DEPT-STAGE-INCOMING') || [],
                    ...stationsByDepartment.get('DEPT-STAGE-INPROCESS') || [],
                    ...stationsByDepartment.get('DEPT-STAGE-OUTGOING') || [],
                    ...stationsByDepartment.get('DEPT-STAGE-CUSTOMER') || []
                  ].map(station => (
                    <button
                      key={station.id}
                      onClick={() => navigate(station.moduleUrl)}
                      className="p-2 rounded-xl bg-black/40 border border-emerald-500/20 hover:border-emerald-400 text-start transition-all hover:scale-105 group"
                    >
                      <div className="text-[9px] font-mono font-bold text-emerald-400 mb-0.5">{station.code}</div>
                      <div className="text-xs font-bold text-white group-hover:text-emerald-300 line-clamp-1">{station.titleAr}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* TIER 3: DEFECT ESCALATION & RESOLUTION (NCR / CAPA / 8D / Deviation) */}
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-rose-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-400 flex items-center gap-1.5 uppercase font-mono">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>{isAr ? 'مسار تصعيد عدم المطابقة والتحسين: عزل العيب ──► NCR ──► CAPA ──► 8D' : 'Problem Solving Tier: NCR ──► CAPA ──► 8D ──► Deviation'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Stage 3</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {(stationsByDepartment.get('DEPT-STAGE-RESOLUTION') || []).map(station => (
                    <button
                      key={station.id}
                      onClick={() => navigate(station.moduleUrl)}
                      className="p-2.5 rounded-xl bg-black/40 border border-rose-500/20 hover:border-rose-400 text-start transition-all hover:scale-105 group"
                    >
                      <div className="text-[9px] font-mono font-bold text-rose-400 mb-0.5">{station.code}</div>
                      <div className="text-xs font-bold text-white group-hover:text-rose-300">{station.titleAr}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LAYOUT MODE 3: DIRECT MATRIX GRID VIEW */}
        {layoutMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {equipmentList.map(station => {
              const dept = getDepartmentForStation(station.id);
              const stStatus = stationStatuses[station.id];
              const isAlert = stStatus?.status === 'alert' || stStatus?.isAndonActive;

              return (
                <div
                  key={station.id}
                  onClick={() => onSelectStation(station.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isAlert
                      ? 'bg-rose-950/40 border-rose-500/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-black/60 text-slate-300 font-mono text-[10px] border border-white/5 font-bold">
                      {station.code}
                    </span>
                    {dept && (
                      <span 
                        style={{ color: dept.accentHex, borderColor: `${dept.accentHex}40` }}
                        className="text-[9px] font-mono px-2 py-0.5 rounded border bg-black/40 font-bold"
                      >
                        {dept.code}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1">{isAr ? station.titleAr : station.titleEn}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">{isAr ? station.locationAr : station.locationEn}</p>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                    <span className="text-[11px] text-slate-400">FPY: <b className="text-emerald-400">{station.fpyEstimate || 99}%</b></span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(station.moduleUrl);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <span>{isAr ? 'فتح' : 'Open'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. FOOTER: FAST SWITCHERS TO 2D / 3D IF USER EXPLICITLY WANTS THEM */}
      <div className="flex-none p-2.5 px-6 bg-[#070c18] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            {isAr 
              ? 'وضع الفلو شارت الحديث يمنحك سرعة فائقة مع إمكانية الوصول لجميع أقسام المنصة بدون استهلاك لموارد المعالج أو كارت الشاشة' 
              : 'Ultra-fast lightweight flowchart provides 100% platform access with 0% GPU load'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onSwitchTo2D && (
            <button
              onClick={onSwitchTo2D}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'خريطة 2D SCADA' : '2D SCADA Plan'}</span>
            </button>
          )}

          {onSwitchTo3D && (
            <button
              onClick={onSwitchTo3D}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
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
