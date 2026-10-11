import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Truck, 
  Cpu, 
  AlertOctagon, 
  PackageCheck, 
  Users, 
  Activity, 
  ShieldCheck, 
  FileText, 
  Database, 
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X
} from 'lucide-react';
import { useTranslation } from '../utils/translations';

interface CommandItem {
  id: string;
  category: 'stream' | 'action' | 'lab' | 'system';
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeEn?: string;
  badgeAr?: string;
}

const COMMAND_ITEMS: CommandItem[] = [
  // Value Stream Stages
  {
    id: 'stage-1',
    category: 'stream',
    titleEn: 'Stage 01: Incoming & Supplier Quality (IQC)',
    titleAr: 'المرحلة 01: استلام الخامات والموردين (IQC)',
    subtitleEn: 'Raw material inspections, COA verification & supplier scorecard',
    subtitleAr: 'فحص الخامات الواردة ومطابقة الشهادات وتقييم الموردين',
    path: '/inspection',
    icon: Truck,
    badgeEn: 'Stage 01',
    badgeAr: 'مرحلة 01'
  },
  {
    id: 'stage-1-supp',
    category: 'stream',
    titleEn: 'Supplier Quality Management',
    titleAr: 'إدارة جودة الموردين',
    subtitleEn: 'Supplier audits, approvals & vendor defect records',
    subtitleAr: 'تدقيق الموردين وسجل العيوب للموردين والموافقات',
    path: '/supplier-quality',
    icon: Truck,
  },
  {
    id: 'stage-2-shopfloor',
    category: 'stream',
    titleEn: 'Stage 02: Shopfloor Execution (IPQC)',
    titleAr: 'المرحلة 02: جودة التصنيع والعمليات (IPQC)',
    subtitleEn: 'First-piece inspection, line clearance & patrol checks',
    subtitleAr: 'فحص العينة الأولى ومطابقة بداية التشغيل وفحص الخطوط',
    path: '/quality-shopfloor',
    icon: Cpu,
    badgeEn: 'Stage 02',
    badgeAr: 'مرحلة 02'
  },
  {
    id: 'stage-2-defect',
    category: 'action',
    titleEn: 'Log Manufacturing Defect (Recorder)',
    titleAr: 'تسجيل عيب تصنيعي فوري',
    subtitleEn: 'Touch-friendly fast defect recording on shopfloor lines',
    subtitleAr: 'تسجيل العيوب المباشر بضغطة زر لخطوط الإنتاج',
    path: '/defect-log',
    icon: Activity,
    badgeEn: 'Fast Action',
    badgeAr: 'إجراء سريع'
  },
  {
    id: 'stage-2-spc',
    category: 'lab',
    titleEn: 'SPC & Statistical Quality Control',
    titleAr: 'التحكم الإحصائي بالعمليات (SPC)',
    subtitleEn: 'Control charts (Xbar-R, I-MR, CUSUM) & Capability (Cp, Cpk, Pp, Ppk)',
    subtitleAr: 'خرائط التحكم الإحصائي ومؤشرات المقدرة وتحليل النورماليتي',
    path: '/spc',
    icon: Activity,
    badgeEn: 'Statistical Engine',
    badgeAr: 'محرك إحصائي'
  },
  {
    id: 'stage-3-ncr',
    category: 'stream',
    titleEn: 'Stage 03: Non-Conformance Records (NCR)',
    titleAr: 'المرحلة 03: تقارير عدم المطابقة (NCR)',
    subtitleEn: 'Material containment, quarantine & disposition workflow',
    subtitleAr: 'حجز الخامات المعيبة وقرارات العزل والتصرف الفوري',
    path: '/quality/records/ncr',
    icon: AlertOctagon,
    badgeEn: 'Stage 03',
    badgeAr: 'مرحلة 03'
  },
  {
    id: 'stage-3-capa',
    category: 'stream',
    titleEn: 'Corrective & Preventive Actions (CAPA)',
    titleAr: 'الإجراءات التصحيحية والوقائية (CAPA)',
    subtitleEn: 'Root cause analysis, corrective action plans & closure tracking',
    subtitleAr: 'التحليل الجذري وخطط الإجراءات التصحيحية ومتابعة الإغلاق',
    path: '/quality/records/capa',
    icon: AlertOctagon,
  },
  {
    id: 'stage-3-8d',
    category: 'stream',
    titleEn: '8D Problem Solving Methodology',
    titleAr: 'منهجية حل المشكلات 8D',
    subtitleEn: 'Automotive standard D0-D8 disciplined problem-solving',
    subtitleAr: 'منهجية الفصول الثمانية لحل المشكلات المعقدة بالمعايير العالمية',
    path: '/quality/records/8d',
    icon: AlertOctagon,
  },
  {
    id: 'stage-4-fqc',
    category: 'stream',
    titleEn: 'Stage 04: Final & Outgoing Quality (FQC/OQC)',
    titleAr: 'المرحلة 04: فحص وخروج المنتج النهائي (FQC/OQC)',
    subtitleEn: 'AQL sampling, outgoing release gate & warehouse dispatch checks',
    subtitleAr: 'فحص عينات القبول والاعتماد النهائي قبل الشحن للمخازن',
    path: '/outgoing-quality',
    icon: PackageCheck,
    badgeEn: 'Stage 04',
    badgeAr: 'مرحلة 04'
  },
  {
    id: 'stage-5-complaints',
    category: 'stream',
    titleEn: 'Stage 05: Customer Complaints & Feedback',
    titleAr: 'المرحلة 05: شكاوى وملاحظات العملاء',
    subtitleEn: 'Field failures, RMA tracking & customer satisfaction analytics',
    subtitleAr: 'متابعة العيوب الميدانية واسترجاع المنتجات ومؤشرات الرضا',
    path: '/quality/records/complaints',
    icon: Users,
    badgeEn: 'Stage 05',
    badgeAr: 'مرحلة 05'
  },
  // Management & Setup
  {
    id: 'command-center',
    category: 'action',
    titleEn: 'Quality Command Center',
    titleAr: 'غرفة القيادة المركزية للجودة',
    subtitleEn: 'Executive control tower, active tasks, alerts & risk register',
    subtitleAr: 'برج المراقبة والتحكم بالمهام النشطة والإنذارات والمخاطر',
    path: '/quality-command-center',
    icon: Sparkles,
    badgeEn: 'Executive',
    badgeAr: 'إدارة'
  },
  {
    id: 'master-data',
    category: 'system',
    titleEn: 'Master Data & Process Architecture',
    titleAr: 'البيانات الأساسية وتكويد المصنع',
    subtitleEn: 'Lines, stations, defect catalog, part numbers & test parameters',
    subtitleAr: 'تكويد خطوط الإنتاج والمحطات ودليل العيوب والمنتجات',
    path: '/quality-master-data',
    icon: Database,
  },
  {
    id: 'inspection-plans',
    category: 'system',
    titleEn: 'Inspection Plans & Checklists',
    titleAr: 'خطط وقوائم فحص الجودة',
    subtitleEn: 'Control points, criteria limits & mandatory parameters',
    subtitleAr: 'نقاط المراقبة وحدود القبول والمعايير الإلزامية للفحص',
    path: '/quality-inspection-plans',
    icon: FileText,
  },
  {
    id: 'layered-audits',
    category: 'lab',
    titleEn: 'Layered Process Audits (LPA)',
    titleAr: 'التدقيق الطبقي للعمليات (LPA)',
    subtitleEn: 'Supervisory and management process confirmation checks',
    subtitleAr: 'عمليات التدقيق والتحقق اليومي لمشرفي ومديري المصنع',
    path: '/quality-audits',
    icon: ShieldCheck,
  }
];

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isAr = language === 'ar';

  // Listen for global Ctrl+K / Cmd+K and custom event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleCustomOpen);
    };
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return COMMAND_ITEMS;
    const lower = query.toLowerCase().trim();
    return COMMAND_ITEMS.filter((item) => {
      return (
        item.titleEn.toLowerCase().includes(lower) ||
        item.titleAr.toLowerCase().includes(lower) ||
        item.subtitleEn.toLowerCase().includes(lower) ||
        item.subtitleAr.toLowerCase().includes(lower) ||
        item.path.toLowerCase().includes(lower)
      );
    });
  }, [query]);

  // Keyboard navigation inside list
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        executeSelection(filteredItems[selectedIndex].path);
      } else if (query.trim()) {
        executeSelection(`/quality-search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  const executeSelection = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  if (!isOpen) return null;

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-md transition-opacity">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={() => setIsOpen(false)} />

      {/* Modal Dialog */}
      <div 
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/15 bg-slate-900/95 text-white shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 transition-all"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header Search Box */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <Search className="h-5 w-5 text-[#00A3E0] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder={
              isAr
                ? 'ابحث عن محطة، مرحلة تصنيع، عيب، أو أمر سريع... (مثال: IQC, NCR, خامات)'
                : 'Search manufacturing stage, defect, tool, or command... (e.g. IQC, NCR, SPC)'
            }
            className="w-full bg-transparent text-base sm:text-lg text-white placeholder-white/35 focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-mono text-white/40">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-white/5">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center">
              <Search className="mx-auto h-8 w-8 text-white/20 mb-2" />
              <p className="text-sm font-semibold text-white/60">
                {isAr ? `لا توجد نتائج مطابقة لـ "${query}"` : `No direct results for "${query}"`}
              </p>
              <button
                onClick={() => executeSelection(`/quality-search?q=${encodeURIComponent(query.trim())}`)}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#00A3E0]/20 border border-[#00A3E0]/30 px-4 py-2 text-xs font-bold text-[#8be3ff] hover:bg-[#00A3E0]/30"
              >
                <span>{isAr ? 'البحث في أرشيف الجودة الشامل' : 'Search in Full Quality Archive'}</span>
                <ArrowIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => executeSelection(item.path)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`group flex items-center justify-between gap-4 rounded-2xl px-4 py-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#00A3E0]/20 to-sky-500/10 border border-[#00A3E0]/30 text-white'
                      : 'hover:bg-white/5 text-white/80'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                        isSelected
                          ? 'bg-[#00A3E0] text-slate-950 shadow-lg shadow-[#00A3E0]/30'
                          : 'bg-white/5 text-[#00A3E0] group-hover:bg-white/10'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold text-white">
                          {isAr ? item.titleAr : item.titleEn}
                        </span>
                        {(item.badgeAr || item.badgeEn) && (
                          <span className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono font-medium text-white/60">
                            {isAr ? item.badgeAr : item.badgeEn}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-white/45 mt-0.5">
                        {isAr ? item.subtitleAr : item.subtitleEn}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <ArrowIcon
                      className={`h-4 w-4 transition-transform ${
                        isSelected
                          ? 'text-[#00A3E0] translate-x-0.5 rtl:-translate-x-0.5'
                          : 'text-white/20 opacity-0 group-hover:opacity-100'
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-5 py-3 text-[11px] text-white/40">
          <div className="flex items-center gap-3">
            <span>
              {isAr ? 'استخدم الأسهم للتنقل' : 'Use arrows to navigate'}
            </span>
            <span>•</span>
            <span>
              {isAr ? 'Enter للاختيار' : 'Enter to select'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <span>QMS 4.0 Industrial Stream</span>
          </div>
        </div>
      </div>
    </div>
  );
}
