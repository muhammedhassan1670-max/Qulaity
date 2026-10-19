// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Smartphone, Activity, ShieldAlert, Workflow, PackageCheck,
  ShieldCheck, Database, ArrowDown, RefreshCw, CheckCircle2,
  ArrowUpRight, Search, AlertTriangle, Layers, ChevronDown, CheckSquare,
  Sparkles, FileText, Barcode, Brain, Blocks, Library, Users
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
    failLabelAr = 'غير مطابق (يُعزل ويُحوّل إلى المرحلة 3: NCR ➡️)',
    accentColor = '#f59e0b'
  ) => {
    return (
      <div 
        className="my-5 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border-2 flex flex-col md:flex-row items-center justify-between gap-4 text-xs shadow-md"
        style={{ borderColor: `${accentColor}50` }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">💎</span>
          <div>
            <span className="text-[10px] font-mono font-black block uppercase tracking-wider" style={{ color: accentColor }}>
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
    const el = document.getElementById(stageId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex-1 w-full bg-[#060a14] text-slate-100 flex flex-col font-sans select-none">
      {/* 1. SIMPLE TOP STICKY BAR: SEARCH & SEQUENTIAL STAGE JUMPERS */}
      <div className="bg-[#080d1a] border-b border-white/10 p-3 md:px-6 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Fast Sequential Stage Quick-Jump Pills (1 to 7) */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 shrink-0 hidden lg:inline">
              {isAr ? 'المراحل الـ 7 بالترتيب:' : '7 Stages (1 ➔ 7):'}
            </span>

            {ENTERPRISE_DEPARTMENTS.map((dept) => (
              <button
                key={dept.id}
                onClick={() => scrollToStage(dept.id)}
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

      {/* 2. THE EASIEST FLOWCHART LAYOUT: SEQUENTIAL (1 ➔ 2 ➔ 3 ➔ 4 ➔ 5 ➔ 6 ➔ 7) */}
      <div className="max-w-6xl mx-auto w-full p-4 md:p-8 space-y-6 pb-20">
        
        {/* START TERMINAL */}
        <div className="flex flex-col items-center">
          <div className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 border-2 border-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span>{isAr ? '🚀 بداية المسار: استلام الخامات وتأهيل الموردين' : 'START: Incoming Materials & Supplier Verification'}</span>
          </div>
          <div className="w-0.5 h-6 bg-amber-500" />
          <div className="text-amber-400 text-xs">▼</div>
        </div>

        {/* ==================================================================== */}
        {/* STAGE 1: INCOMING & SUPPLIER (IQC)                                   */}
        {/* ==================================================================== */}
        <section id="DEPT-STAGE-INCOMING" className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border-2 border-amber-500/40 space-y-4 shadow-xl">
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
        {renderDecisionGate(
          'هل المواد الخام الواردة مطابقة للمواصفات وخطط الفحص؟',
          'Are incoming raw materials compliant with quality specs?',
          isAr ? 'مطابق (ينتقل لصالة الإنتاج: المرحلة 2 ⬇️)' : 'Compliant (Release to In-Process: Stage 2)',
          isAr ? 'غير مطابق (يُعزل ويُحوّل إلى المرحلة 3: NCR ➡️)' : 'Non-compliant (Quarantine & NCR: Stage 3)',
          '#f59e0b'
        )}

        {/* CONNECTOR ARROW */}
        <div className="flex flex-col items-center">
          <div className="w-0.5 h-6 bg-cyan-500" />
          <div className="text-cyan-400 text-xs">▼</div>
        </div>

        {/* ==================================================================== */}
        {/* STAGE 2: IN-PROCESS QUALITY (IPQC)                                   */}
        {/* ==================================================================== */}
        <section id="DEPT-STAGE-INPROCESS" className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border-2 border-cyan-500/40 space-y-4 shadow-xl">
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
        {renderDecisionGate(
          'هل عينات التشغيل ضمن حدود الضبط SPC وخالية من العيوب الحرجة؟',
          'Are in-process samples within SPC control limits & free of critical defects?',
          isAr ? 'مطابق (متابعة المسار وحل أي انحرافات ⬇️)' : 'Compliant (Continue Flow: Stage 3)',
          isAr ? 'خلل أو إنذار أندون (إيقاف وتصعيد فوري لـ NCR و 8D ➡️)' : 'Discrepancy (Andon Alert & Immediate NCR / 8D)',
          '#06b6d4'
        )}

        {/* CONNECTOR ARROW */}
        <div className="flex flex-col items-center">
          <div className="w-0.5 h-6 bg-rose-500" />
          <div className="text-rose-400 text-xs">▼</div>
        </div>

        {/* ==================================================================== */}
        {/* STAGE 3: PROBLEM SOLVING & NCR / 8D / CAPA                           */}
        {/* ==================================================================== */}
        <section id="DEPT-STAGE-RESOLUTION" className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border-2 border-rose-500/50 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-rose-500/20">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-xl text-xs font-mono font-black bg-rose-500/20 text-rose-400 border border-rose-500/40">
                STAGE 03
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-rose-400">
                  {isAr ? 'المرحلة 3: عدم المطابقة وحل المشكلات (NCR / 8D / CAPA)' : 'Stage 3: Problem Solving, NCR & Corrective Actions'}
                </h3>
                <p className="text-xs text-slate-300">
                  {isAr 
                    ? 'تقارير عدم المطابقة NCR، الإجراءات التصحيحية CAPA، حل المشكلات 8D، تصاريح الحيود، وضبط التغيير الهندسي' 
                    : 'NCR reports, CAPA actions, 8D problem solving, deviations & engineering change control'}
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

        {/* DECISION GATE 3 (NCR & CAPA) */}
        {renderDecisionGate(
          'هل تم حصر الخلل، تطبيق الإجراء التصحيحي، وتأكيد خلو الدفعة؟',
          'Has the root cause been contained and corrective action verified?',
          isAr ? 'تم الحل والاعتماد (إفراج للمرحلة 4: الفحص النهائي ⬇️)' : 'Resolved & Verified (Proceed to Final OQC: Stage 4)',
          isAr ? 'قيد التحقيق (استمرار العزل والعرض على لجنة MRB ➡️)' : 'Pending MRB Disposition & Root-Cause Closure',
          '#f43f5e'
        )}

        {/* CONNECTOR ARROW */}
        <div className="flex flex-col items-center">
          <div className="w-0.5 h-6 bg-emerald-500" />
          <div className="text-emerald-400 text-xs">▼</div>
        </div>

        {/* ==================================================================== */}
        {/* STAGE 4: OUTGOING QUALITY (OQC)                                       */}
        {/* ==================================================================== */}
        <section id="DEPT-STAGE-OUTGOING" className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border-2 border-emerald-500/40 space-y-4 shadow-xl">
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
        {renderDecisionGate(
          'هل شحنة المنتج التام مطابقة لمعايير قبول عينات AQL؟',
          'Are finished goods conforming to AQL criteria?',
          isAr ? 'مجاز ومطابق (إصدار شهادة المطابقة COC وتسليم العميل: المرحلة 5 ⬇️)' : 'Approved (Issue COC & Handover to Customer: Stage 5)',
          isAr ? 'مرفوض (حجز الشحنة وإعادتها للمعالجة أو NCR ➡️)' : 'Quarantine & NCR Re-inspection',
          '#10b981'
        )}

        {/* CONNECTOR ARROW */}
        <div className="flex flex-col items-center">
          <div className="w-0.5 h-6 bg-indigo-500" />
          <div className="text-indigo-400 text-xs">▼</div>
        </div>

        {/* ==================================================================== */}
        {/* STAGE 5: CUSTOMER COMPLAINTS                                          */}
        {/* ==================================================================== */}
        <section id="DEPT-STAGE-CUSTOMER" className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border-2 border-indigo-500/40 space-y-4 shadow-xl">
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

        {/* DECISION GATE 5 (CUSTOMER) */}
        {renderDecisionGate(
          'هل تم حل شكوى العميل وتسوية المرتجع RMA وتحديث التدقيق الفني؟',
          'Has customer claim been settled and fed back to technical audits?',
          isAr ? 'نعم (تحويل الدروس المستفادة للمختبر الهندسي والتدقيق: المرحلة 6 ⬇️)' : 'Resolved (Feedback to Engineering Lab: Stage 6)',
          isAr ? 'شكوى مفتوحة (متابعة مع العميل وإجراء 8D عاجل ➡️)' : 'Open Claim (Follow-up & Urgent 8D)',
          '#6366f1'
        )}

        {/* CONNECTOR ARROW */}
        <div className="flex flex-col items-center">
          <div className="w-0.5 h-6 bg-purple-500" />
          <div className="text-purple-400 text-xs">▼</div>
        </div>

        {/* ==================================================================== */}
        {/* STAGE 6: ENGINEERING LAB & AUDITS                                     */}
        {/* ==================================================================== */}
        <section id="DEPT-STAGE-COMPLIANCE" className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border-2 border-purple-500/40 space-y-4 shadow-xl">
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

        {/* CONNECTOR ARROW */}
        <div className="flex flex-col items-center">
          <div className="w-0.5 h-6 bg-blue-500" />
          <div className="text-blue-400 text-xs">▼</div>
        </div>

        {/* ==================================================================== */}
        {/* STAGE 7: FACTORY SETUP & MASTER DATA                                 */}
        {/* ==================================================================== */}
        <section id="DEPT-STAGE-SETUP" className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border-2 border-blue-500/40 space-y-4 shadow-xl">
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
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-blue-950/40 to-emerald-950/40 border-2 border-cyan-500/40 flex flex-col md:flex-row items-center justify-between gap-4 text-xs shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40 shrink-0">
              <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-wider">
                  {isAr ? 'دورة الجودة الشاملة المغلقة' : 'Total Quality Closed Loop'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold">
                  Stage 7 ➔ Stage 1
                </span>
              </div>
              <h5 className="font-black text-white text-sm sm:text-base">
                {isAr ? 'تغذية عكسية مستمرة وتحديث تلقائي لجميع المراحل' : 'Continuous Closed-Loop Feedback & Standard Evolution'}
              </h5>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                {isAr 
                  ? 'الدروس المستفادة والبيانات وقوالب الفحص من المرحلة 7 تُعيد تلقائياً ضبط خطط فحص المواد الخام في المرحلة 1 ومعايير خطوط الإنتاج لمنع تكرار أي خلل نهائياً.' 
                  : 'Master data, lessons learned and form templates continuously refine Stage 1 receiving criteria and production plans.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => scrollToStage('DEPT-STAGE-INCOMING')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 shrink-0"
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
