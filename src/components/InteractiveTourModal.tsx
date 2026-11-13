import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Volume2,
  VolumeX,
  Compass,
  RotateCcw,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';

export interface TourStep {
  targetSelector?: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  badgeAr?: string;
  badgeEn?: string;
  actionHintAr?: string;
  actionHintEn?: string;
  route?: string;
}

export function InteractiveTourModal() {
  const { isTourOpen, setTourOpen, language } = useAppStore();
  const location = useLocation();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const isArabic = language === 'ar';

  // Sound Synthesizer using Web Audio API (Futuristic Tech Clicks)
  const playTechSound = useCallback(
    (type: 'next' | 'finish' | 'start') => {
      if (!soundEnabled) return;
      try {
        const AudioContextClass =
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        if (type === 'start') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
          osc.start(now);
          osc.stop(now + 0.25);
        } else if (type === 'next') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(580, now);
          osc.frequency.exponentialRampToValueAtTime(1160, now + 0.12);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.16);
        } else if (type === 'finish') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
          osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
          osc.frequency.setValueAtTime(1046.5, now + 0.3); // C6
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
          osc.start(now);
          osc.stop(now + 0.48);
        }
      } catch {
        // AudioContext not allowed before user gesture
      }
    },
    [soundEnabled]
  );

  // Intelligent Context-Aware Tour Steps based on current page
  const steps: TourStep[] = useMemo(() => {
    const path = location.pathname.toLowerCase();

    // 1. Quality Home / Dashboard Tour
    if (path === '/' || path.includes('/quality-home') || path === '/quality') {
      return [
        {
          targetSelector: 'header',
          titleAr: 'قمرة القيادة والهيدر الذكي الصناعي',
          titleEn: 'Industrial Smart Header & Command Bar',
          descAr:
            'الهيدر يمنحك وصولاً سريعاً للبحث الشامل (Ctrl+K)، الأوامر الصوتية بالذكاء الاصطناعي 🎙️، ماسح الباركود 📷، التوأم الرقمي للمصنع، ودليل التشغيل القياسي (SOP).',
          descEn:
            'The header gives instant access to Global Search (Ctrl+K), AI Voice Commands, Barcode Scanner, 3D Digital Twin, and the SOP Manual.',
          badgeAr: 'التحكم العام',
          badgeEn: 'Global Shell',
          actionHintAr: 'يمكنك استخدام زر البحث أو الأوامر الصوتية في أي وقت',
          actionHintEn: 'Use search or voice commands anytime',
        },
        {
          titleAr: 'مؤشرات الأداء اللحظية FPY و COPQ',
          titleEn: 'Live KPI Cards (FPY, MTTR, COPQ)',
          descAr:
            'هنا تتابع نبض المصنع لحظة بلحظة: معدل الجودة من المرة الأولى First Pass Yield، عدد العيوب المفتوحة، وتكلفة الجودة الرديئة COPQ المحدثة تلقائياً.',
          descEn:
            'Track plant performance in real-time: First Pass Yield (FPY), open defects, MTTR resolution time, and live Cost of Poor Quality (COPQ).',
          badgeAr: 'مؤشرات الأداء',
          badgeEn: 'Live KPIs',
          actionHintAr: 'تتغير الأرقام آلياً فور تسجيل أي فحص أو عيب جديد',
          actionHintEn: 'Numbers update automatically on any new inspection',
        },
        {
          titleAr: 'أزرار الإجراء السريع (Quick Actions)',
          titleEn: 'Quick Action Launchers',
          descAr:
            'أزرار فورية لتسجيل فحص وارد أو تشغيل سريع بنقرة واحدة، تسجيل عيب جديد، أو فتح تقرير عدم مطابقة (NCR) دون التنقل بين القوائم.',
          descEn:
            'One-click triggers for Quick Inspection, Quick Defect Entry, and Emergency NCR Creation without menu navigation.',
          badgeAr: 'سرعة الإنجاز',
          badgeEn: 'Quick Launch',
          actionHintAr: 'اضغط على زر "+ فحص سريع" لتجربة معالج الفحص',
          actionHintEn: 'Click "+ Quick Inspection" to try the wizard',
        },
        {
          titleAr: 'التحليل التراكمي وتوزيع العيوب (Pareto Distribution)',
          titleEn: 'Defect Pareto & Shift Analytics',
          descAr:
            'رسوم بيانية تفاعلية تكشف أهم 20% من العيوب المسببة لـ 80% من الخسائر (قاعدة باريتو) لتوجيه فرق الجودة لحلها جذرياً.',
          descEn:
            'Interactive charts uncovering the vital 20% of defects causing 80% of losses (Pareto Principle).',
          badgeAr: 'الذكاء التحليلي',
          badgeEn: 'Pareto Intelligence',
        },
        {
          titleAr: 'تصدير التقرير التنفيذي الرسمي (Executive Dossier)',
          titleEn: 'Executive Report Export',
          descAr:
            'بضغطة زر واحدة يقوم النظام بتجميع بيانات الورديات والرسوم البيانية وتوليد تقرير PDF رسمي معتمد لاجتماعات الإدارة العليا.',
          descEn:
            'Compile shift telemetry and audit data into a formal executive PDF dossier with a single click.',
          badgeAr: 'التقارير التنفيذية',
          badgeEn: 'Executive Reporting',
        },
      ];
    }

    // 2. Inspection Management Tour
    if (path.includes('/inspection')) {
      return [
        {
          titleAr: 'محطات الفحص الثلاث (IQC / IPQC / OQC)',
          titleEn: 'The Three Inspection Pillars',
          descAr:
            'تنقسم شاشة الفحص إلى 3 تبويبات رئيسية: فحص الخامات الواردة (IQC)، فحص خطوط التجميع أثناء التشغيل (IPQC)، والفحص النهائي وما قبل الشحن (OQC).',
          descEn:
            'Three core inspection tabs: Incoming Material QC (IQC), In-Process Assembly QC (IPQC), and Outgoing Pre-Shipment QC (OQC).',
          badgeAr: 'محطات التفتيش',
          badgeEn: 'Inspection Tabs',
        },
        {
          titleAr: 'معالج الفحص الجديد ثلاثي الخطوات (+ New Inspection)',
          titleEn: '3-Step Inspection Wizard',
          descAr:
            'الزر الأخضر يفتح معالج فحص رقمي: الخطوة 1 لبيانات اللوط والمورد، الخطوة 2 لأخذ القياسات ومقارنتها بالـ USL/LSL، والخطوة 3 للقرار والمرفقات.',
          descEn:
            'Green button opens digital wizard: Step 1 for Lot/Supplier, Step 2 for dimensional measurements against USL/LSL, and Step 3 for final decision.',
          badgeAr: 'معالج الفحص',
          badgeEn: 'Inspection Wizard',
        },
        {
          titleAr: 'القرار التلقائي والربط الذكي بالـ NCR',
          titleEn: 'Automatic NCR Linkage upon Failure',
          descAr:
            'إذا كانت نتيجة الفحص Fail (راسب)، يظهر فورياً في الجدول زر أحمر "فتح NCR" ينقل رقم اللوط والصنف والمورد تلقائياً لنموذج عدم المطابقة دون إعادة كتابتها.',
          descEn:
            'If inspection result is Fail, a red "Open NCR" button appears instantly, transferring Lot, Part, and Supplier info to NCR with zero retyping.',
          badgeAr: 'الربط التلقائي',
          badgeEn: 'Auto Linkage',
        },
        {
          titleAr: 'طباعة بطاقات الجودة والباركود (Green / Red Tag)',
          titleEn: 'Digital Quality Tags & Barcodes',
          descAr:
            'زر الطباعة يولد بطاقة إفراج خضراء (Green Release Tag) أو بطاقة حجز حمراء (Red Quarantine Tag) مع باركود تتبع لتعليقها على الصناديق واللوطات.',
          descEn:
            'Print instant Green Release Tags or Red Quarantine Tags with scannable QR/barcodes to affix onto material crates.',
          badgeAr: 'بطاقات التعريف',
          badgeEn: 'Barcode Tagging',
        },
      ];
    }

    // 3. NCR Management Tour
    if (path.includes('/ncr')) {
      return [
        {
          titleAr: 'حالات عدم المطابقة ولجنة مراجعة المواد (NCR & MRB)',
          titleEn: 'Non-Conformance & Material Review Board',
          descAr:
            'هنا يتم توثيق وحجز أي خامة أو منتج غير مطابق وإخضاعه لقرارات لجنة مراجعة المواد (MRB) لمنع خروجه أو استخدامه بالخطأ.',
          descEn:
            'Quarantine and track non-conforming lots and enforce Material Review Board (MRB) governance to prevent accidental release.',
          badgeAr: 'إدارة عدم المطابقة',
          badgeEn: 'MRB Governance',
        },
        {
          titleAr: 'قرارات الـ MRB الأربعة الصارمة',
          titleEn: 'The 4 MRB Disposition Branches',
          descAr:
            'لكل حالة عدم مطابقة 4 مسارات حاسمة: (1) Use As Is بقبول مشروط مع تصريح حيود، (2) Rework بإعادة تشغيل، (3) Scrap بإعدام وتحويل لهالك، أو (4) RTV بإرجاع للشحنة للمورد.',
          descEn:
            'Four strict disposition paths: (1) Use As Is with Deviation, (2) Rework, (3) Scrap, or (4) Return to Vendor (RTV).',
          badgeAr: 'قرارات اللجنة',
          badgeEn: 'Disposition Paths',
        },
        {
          titleAr: 'التصعيد الفوري لمنهجية حل المشكلات (Escalate to 8D)',
          titleEn: 'One-Click Escalation to 8D',
          descAr:
            'في حال كان العيب حرجاً أو متكرراً، زر "Escalate to 8D" ينشئ دراسة كاملة في نظام حل المشكلات ثماني الأبعاد مع سحب كافة الأدلة والبيانات.',
          descEn:
            'Critical or repeated failures can be escalated directly to an 8D Problem Solving project with pre-populated evidence.',
          badgeAr: 'التصعيد المنهجي',
          badgeEn: '8D Escalation',
        },
      ];
    }

    // 4. ISO Ecosystem Matrix Tour
    if (path.includes('/ecosystem')) {
      return [
        {
          titleAr: 'بوابة مصفوفة الأيزو والـ Cyber-Industrial Matrix',
          titleEn: 'ISO 9001:2015 Cyber-Industrial Matrix',
          descAr:
            'تجسيد حي لمعمارية المصنع وفقاً لدورة PDCA وبنود الأيزو من 4 إلى 10، حيث يمكنك رؤية تدفق الإشارات والبيانات بين الـ 35 موديولاً كشبكة حية متكاملة.',
          descEn:
            'Live cyber-physical architecture modeling the full factory across PDCA cycle and ISO clauses 4 through 10.',
          badgeAr: 'المصفوفة الذكية',
          badgeEn: 'Ecosystem Matrix',
        },
        {
          titleAr: 'العدسات المعمارية الأربع (View Lenses)',
          titleEn: '4 Architectural View Lenses',
          descAr:
            'أزرار الهيدر تتيح لك التبديل بين: مسار الـ PDCA الفقري (11 خطوة)، كافة الروابط المباشرة، حلقات التغذية الراجعة الـ 14، ومؤشر صحة الاستجابة SLA.',
          descEn:
            'Switch instantly between: PDCA Backbone (11 steps), All 1st Links, Return Loops (14 feedback circuits), and Health SLA telemetry.',
          badgeAr: 'العدسات المعمارية',
          badgeEn: 'View Lenses',
        },
        {
          titleAr: 'قائمة محاكاة السيناريوهات الحية (Scenarios Dropdown)',
          titleEn: 'Live Interactive Scenario Simulators',
          descAr:
            'اختر أي سيناريو (مثل: NCR ➔ 8D، أو انحراف SPC، أو شكوى عميل) لتشاهد تدفق الإشارات وحلقات الإغلاق تتحرك أمامك على الكانفاس بوضوح مبهر!',
          descEn:
            'Select any scenario (NCR ➔ 8D, SPC Drift, RMA complaint) to watch signal flows and closed-loop resolutions live on canvas!',
          badgeAr: 'محاكاة تفاعلية',
          badgeEn: 'Live Simulation',
        },
        {
          titleAr: 'شريط مسار الـ PDCA المدمج (1 إلى 11)',
          titleEn: 'Compact PDCA Sequence Stepper',
          descAr:
            'شريط خطوات دائري مدمج ومرقم من 01 إلى 11 يتيح لك التنقل بالأسهم < > وتوسيع الخطوة النشطة، مع زر لإخفائه أو توسيعه بالكامل لتوفير المساحة.',
          descEn:
            'Numbered circular badge stepper (01 to 11) with previous/next controls, expandable active step, and collapse toggle.',
          badgeAr: 'مسار الخطوات',
          badgeEn: 'Sequence Ribbon',
        },
      ];
    }

    // 5. Global Tour (Default for all other pages)
    return [
      {
        titleAr: 'مرحباً بك في نظام الجولات الإرشادية التفاعلية',
        titleEn: 'Welcome to the Interactive Guided Tour',
        descAr:
          'هذا النظام التفاعلي تم تصميمه ليأخذك خطوة بخطوة في أي شاشة بالمنظومة لتعريفك بكل زر وكل تاب ووظيفته التشغيلية والربط الآلي بين الموديولات.',
        descEn:
          'This interactive tour guides you step-by-step through any platform screen, explaining every button, tab, and auto-linkage.',
        badgeAr: 'التدريب التفاعلي',
        badgeEn: 'Interactive Guide',
      },
      {
        titleAr: 'دليل التشغيل القياسي الشامل (SOP)',
        titleEn: 'Comprehensive SOP Reference Manual',
        descAr:
          'يمكنك دائماً الضغط على زر "📖 دليل التشغيل (SOP)" الأخضر في الهيدر لفتح الموسوعة التشغيلية الشاملة لكافة السيناريوهات والأزرار والتبويبات.',
        descEn:
          'Click the green "📖 SOP Manual" button in the header anytime to open the exhaustive operational encyclopedia.',
        badgeAr: 'المرجع الرسمي',
        badgeEn: 'Official SOP',
      },
      {
        titleAr: 'البحث الشامل والأوامر الصوتية بالذكاء الاصطناعي',
        titleEn: 'Global Search & AI Voice Commands',
        descAr:
          'اضغط Ctrl + K للبحث عن أي رقم لوط أو كود عيب، أو انقر على أيقونة الميكروفون 🎙️ لإعطاء أوامر صوتية مباشرة للنظام باللغة العربية أو الإنجليزية.',
        descEn:
          'Press Ctrl+K to search any Lot or Defect code, or click the mic icon 🎙️ for AI voice commands in Arabic or English.',
        badgeAr: 'الذكاء الصناعي',
        badgeEn: 'AI Voice & Search',
      },
      {
        titleAr: 'المصنع الرقمي ثلاثي الأبعاد (3D Digital Twin)',
        titleEn: '3D Plant Digital Twin',
        descAr:
          'استكشف خطوط الإنتاج والماكينات وحساسات الـ IoT في بيئة ثلاثية الأبعاد تفاعلية تتيح لك مراقبة حالة المصنع لحظياً من أي مكان.',
        descEn:
          'Explore production lines, machines, and IoT sensors in a full 3D interactive plant twin.',
        badgeAr: 'المصنع الذكي',
        badgeEn: 'Industry 4.0',
      },
    ];
  }, [location.pathname]);

  // Reset step on modal open or route change
  useEffect(() => {
    if (isTourOpen) {
      setCurrentStepIndex(0);
      playTechSound('start');
    }
  }, [isTourOpen, playTechSound]);

  // Find target element bounding rect if specified
  const currentStep = steps[currentStepIndex];
  useEffect(() => {
    if (!isTourOpen || !currentStep?.targetSelector) {
      setHighlightRect(null);
      return;
    }
    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setHighlightRect(rect);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setHighlightRect(null);
    }
  }, [isTourOpen, currentStepIndex, currentStep]);

  // Keyboard navigation
  useEffect(() => {
    if (!isTourOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTourOpen(false);
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      playTechSound('next');
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      playTechSound('finish');
      setTourOpen(false);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      playTechSound('next');
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    playTechSound('start');
    setCurrentStepIndex(0);
  };

  if (!isTourOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      {/* Dark backdrop with glass blur */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={() => setTourOpen(false)}
      />

      {/* Target Element Spotlight Highlight */}
      {highlightRect && (
        <div
          className="fixed pointer-events-none transition-all duration-300 rounded-xl z-[10000]"
          style={{
            top: highlightRect.top - 6,
            left: highlightRect.left - 6,
            width: highlightRect.width + 12,
            height: highlightRect.height + 12,
            boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.78), 0 0 30px rgba(0, 210, 255, 0.85)',
            border: '2.5px solid #00D2FF',
          }}
        >
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
        </div>
      )}

      {/* Floating Cyber-Glass Tour Card */}
      <div
        dir={isArabic ? 'rtl' : 'ltr'}
        className="relative z-[10001] w-full max-w-lg bg-[#040916]/95 border border-sky-400/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,163,224,0.35)] backdrop-blur-2xl text-white font-sans overflow-hidden"
      >
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-gradient-to-br from-cyan-500/20 to-sky-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-600/10 blur-3xl pointer-events-none" />

        {/* Card Header: Badge + Step Counter + Controls */}
        <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Sparkles className="w-4 h-4 text-white animate-spin-slow" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30">
                {isArabic
                  ? currentStep.badgeAr || 'جولة تفاعلية حية'
                  : currentStep.badgeEn || 'Interactive Tour'}
              </span>
              <div className="text-[11px] text-slate-400 font-mono font-bold mt-0.5">
                {isArabic
                  ? `الخطوة ${currentStepIndex + 1} من ${steps.length}`
                  : `Step ${currentStepIndex + 1} of ${steps.length}`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title={soundEnabled ? 'كتم المؤثرات الصوتية' : 'تفعيل المؤثرات الصوتية'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {/* Restart Tour */}
            <button
              type="button"
              onClick={handleRestart}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title={isArabic ? 'إعادة الجولة من البداية' : 'Restart Tour'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={() => setTourOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title={isArabic ? 'إغلاق (Esc)' : 'Close (Esc)'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden relative z-10">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 transition-all duration-300 shadow-[0_0_10px_#00d2ff]"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="py-5 relative z-10">
          <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <span>{isArabic ? currentStep.titleAr : currentStep.titleEn}</span>
          </h3>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            {isArabic ? currentStep.descAr : currentStep.descEn}
          </p>

          {/* Action Hint Callout */}
          {(currentStep.actionHintAr || currentStep.actionHintEn) && (
            <div className="mt-3.5 p-3 rounded-xl bg-sky-500/10 border border-sky-400/25 flex items-start gap-2.5 text-xs text-sky-200">
              <Compass className="w-4 h-4 text-sky-400 shrink-0 mt-0.5 animate-pulse" />
              <span>{isArabic ? currentStep.actionHintAr : currentStep.actionHintEn}</span>
            </div>
          )}
        </div>

        {/* Card Footer: Navigation Buttons */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10 relative z-10">
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  playTechSound('next');
                  setCurrentStepIndex(idx);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'w-6 bg-gradient-to-r from-cyan-400 to-sky-400 shadow-[0_0_8px_#00d2ff]'
                    : idx < currentStepIndex
                    ? 'bg-emerald-400/60'
                    : 'bg-white/20 hover:bg-white/40'
                }`}
                title={`الخطوة ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                {isArabic ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                <span>{isArabic ? 'السابق' : 'Previous'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-sky-500/25 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
            >
              <span>
                {currentStepIndex === steps.length - 1
                  ? isArabic
                    ? 'إتمام الجولة ✓'
                    : 'Complete Tour ✓'
                  : isArabic
                  ? 'التالي'
                  : 'Next'}
              </span>
              {currentStepIndex < steps.length - 1 && (
                isArabic ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default InteractiveTourModal;
