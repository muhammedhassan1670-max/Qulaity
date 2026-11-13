import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Swords,
  Scan,
  Camera,
  Layers,
  Printer,
  Sparkles,
  RotateCcw,
  Flame,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../stores/appStore';
import { askQualityCopilot } from '../../services/copilotEngine';

// Web Speech types
interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: () => void;
  onend: () => void;
}

export function IndustrialSuperpowersHub() {
  const { language, setTourOpen } = useAppStore();
  const navigate = useNavigate();
  const isArabic = language === 'ar';

  const [activeTab, setActiveTab] = useState<'voice' | 'audit' | 'vision' | '3d' | 'print'>('voice');

  // -------------------------------------------------------------
  // 1. TWO-WAY VOICE COPILOT STATE & LOGIC
  // -------------------------------------------------------------
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceResponse, setVoiceResponse] = useState(
    isArabic
      ? 'أنا المساعد الصوتي الصناعي التفاعلي لمنظومة QMS 4.0. تحدث معي بالأمر الصوتي وسأجيبك وأنفذ فوراً!'
      : 'I am the Industrial Voice Copilot for QMS 4.0. Speak your command and I will respond and execute instantly!'
  );
  const [voiceVolume, setVoiceVolume] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const speakText = useCallback(
    (text: string) => {
      if (!voiceVolume || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = isArabic ? 'ar-SA' : 'en-US';
      utterance.rate = 1.05;
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find((v) => v.lang.includes(isArabic ? 'ar' : 'en'));
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    },
    [isArabic, voiceVolume]
  );

  const handleVoiceCommand = useCallback(
    async (transcript: string) => {
      const q = transcript.toLowerCase();
      let reply = '';

      if (q.includes('عيب') || q.includes('defect') || q.includes('عيوب')) {
        reply = isArabic
          ? 'تم رصد 4 عيوب قيد المتابعة. أعلى عيب تكراراً هو خدش السطح بنسبة 45%. هل ترغب في فتح سجل العيوب؟'
          : '4 active defects tracked. Top defect is Surface Scratch at 45%. Opening defect log?';
        speakText(reply);
        setVoiceResponse(reply);
      } else if (q.includes('تقرير') || q.includes('ncr') || q.includes('مطابقة') || q.includes('عدم')) {
        reply = isArabic
          ? 'جاهز لفتح تقرير عدم المطابقة الفوري NCR. جاري التوجيه إلى معالج التسجيل.'
          : 'Ready for emergency NCR registration. Navigating to NCR wizard.';
        speakText(reply);
        setVoiceResponse(reply);
        setTimeout(() => navigate('/ncr'), 2200);
      } else if (q.includes('فحص') || q.includes('inspection') || q.includes('وارد')) {
        reply = isArabic
          ? 'محطة فحص الواردات IQC جاهزة بنسبة مطابقة 99.4%. جاري فتح سجل الفحص.'
          : 'IQC station ready with 99.4% acceptance. Navigating to inspections.';
        speakText(reply);
        setVoiceResponse(reply);
        setTimeout(() => navigate('/inspection'), 2200);
      } else if (q.includes('تفتيش') || q.includes('آيزو') || q.includes('audit')) {
        reply = isArabic
          ? 'تنبيه طوارئ! جاري تشغيل محاكي معركة تفتيش الآيزو المفاجئ الآن!'
          : 'Emergency alert! Launching ISO Audit Battle Simulator now!';
        speakText(reply);
        setVoiceResponse(reply);
        setActiveTab('audit');
      } else if (q.includes('جولة') || q.includes('tour') || q.includes('شرح')) {
        reply = isArabic
          ? 'تم تفعيل الجولة الإرشادية التفاعلية الحية للمنظومة.'
          : 'Launching interactive guided tour now.';
        speakText(reply);
        setVoiceResponse(reply);
        setTourOpen(true);
      } else if (q.includes('دليل') || q.includes('sop') || q.includes('تعليمات')) {
        reply = isArabic
          ? 'جاري فتح دليل وتعليمات التشغيل القياسية الشاملة SOP.'
          : 'Opening comprehensive SOP operating manual.';
        speakText(reply);
        setVoiceResponse(reply);
        window.open('/docs/sop.html', '_blank');
      } else {
        setVoiceResponse(isArabic ? 'جاري التحليل واستدعاء الاستشارة الهندسية...' : 'Analyzing query with Industrial Brain...');
        try {
          const res = await askQualityCopilot(transcript, { pathname: '/superpowers' });
          const plainSummary = res.content.split('\n')[0].replace(/[#*`_~]/g, '') || res.content.substring(0, 140);
          speakText(plainSummary);
          setVoiceResponse(res.content);
        } catch {
          reply = isArabic
            ? `فهمت طلبك: "${transcript}". مؤشرات جودة المصنع اليوم ممتازة، ومعدل FPY هو 99.2%.`
            : `Understood: "${transcript}". Plant quality KPIs are steady at 99.2% FPY.`;
          speakText(reply);
          setVoiceResponse(reply);
        }
      }
    },
    [isArabic, navigate, setTourOpen, speakText]
  );

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognitionClass =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      toast.error(isArabic ? 'متصفحك لا يدعم التعرف على الصوت مباشرة' : 'Speech recognition not supported in this browser');
      return;
    }

    const rec = new SpeechRecognitionClass();
    rec.lang = isArabic ? 'ar-EG' : 'en-US';
    rec.continuous = false;
    rec.interimResults = false;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript;
      setVoiceTranscript(text);
      setIsListening(false);
      handleVoiceCommand(text);
    };

    rec.onerror = () => {
      setIsListening(false);
      toast.error(isArabic ? 'تعذر التقاط الصوت، يرجى المحاولة ثانية' : 'Voice capture error, please retry');
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
    setVoiceTranscript(isArabic ? 'جاري الاستماع إليك...' : 'Listening to you...');
  };

  // -------------------------------------------------------------
  // 2. ISO AUDIT BATTLE SIMULATOR STATE & LOGIC
  // -------------------------------------------------------------
  const [battleRound, setBattleRound] = useState(0);
  const [battleTimer, setBattleTimer] = useState(45);
  const [battleScore, setBattleScore] = useState(0);
  const [battleStatus, setBattleStatus] = useState<'idle' | 'running' | 'won' | 'lost'>('idle');
  const [stressLevel, setStressLevel] = useState(15);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  const auditRounds = [
    {
      auditorQuoteAr: 'أرني سجل المعايرة الأخير لجهاز قياس السمك الرقمي THK-04 المستخدم في خط التجميع، وما هو تاريخ صلاحيته؟',
      auditorQuoteEn: 'Show me the latest calibration record for digital thickness gauge THK-04 on Assembly Line 1, and its expiry date!',
      clause: 'ISO 9001:2015 Clause 7.1.5 (Monitoring & Measuring Resources)',
      proofs: [
        { id: 'p1', textAr: 'إبراز شهادة المعايرة المعتمدة CAL-2026-09 صالحة حتى ديسمبر 2026 مع ملصق التتبع الأخضر', textEn: 'Present CAL-2026-09 valid until Dec 2026 with Green Tag', correct: true, stressDelta: -10 },
        { id: 'p2', textAr: 'القول بأن الجهاز جديد من الوكالة ولا يحتاج لمعايرة دورية', textEn: 'Claiming brand new tool needs no calibration', correct: false, stressDelta: +35 },
        { id: 'p3', textAr: 'طلب مهلة ساعتين للبحث عن الملف في دولاب الأرشيف الورقي', textEn: 'Asking for 2 hours to search paper archive', correct: false, stressDelta: +25 },
      ]
    },
    {
      auditorQuoteAr: 'هناك دفعة أجزاء غير مطابقة تم حجزها أمس.. أين بطاقة الحجر الصحي Red Tag وسجل العزل الفيزيائي في النظام؟',
      auditorQuoteEn: 'A nonconforming batch was segregated yesterday.. Where is the Red Tag and the physical segregation record in the QMS?',
      clause: 'ISO 9001:2015 Clause 8.7 (Control of Nonconforming Outputs)',
      proofs: [
        { id: 'p1', textAr: 'القول بأن القطع معزولة شفوياً والمشغل يعرفها جيداً', textEn: 'Saying parts are segregated verbally in operators memory', correct: false, stressDelta: +40 },
        { id: 'p2', textAr: 'إبراز بطاقة الحجر الحمراء الرقمية QR-RedTag وسجل نقل الدفعة لمنطقة الحجر المغلقة', textEn: 'Presenting QR-RedTag and physical cage transfer manifest', correct: true, stressDelta: -15 },
        { id: 'p3', textAr: 'شحن الدفعة للعميل وطلب تقييمها أثناء الاستخدام', textEn: 'Shipping to customer for on-site evaluation', correct: false, stressDelta: +50 },
      ]
    },
    {
      auditorQuoteAr: 'تقرير عدم المطابقة NCR-2026-088 تم إغلاقه.. أين الدليل الموضوعي على التحقق من فاعلية الإجراء التصحيحي (Verification of Effectiveness)؟',
      auditorQuoteEn: 'NCR-2026-088 is closed.. Where is the objective evidence verifying the corrective action effectiveness?',
      clause: 'ISO 9001:2015 Clause 10.2 (Nonconformity and Corrective Action)',
      proofs: [
        { id: 'p1', textAr: 'عرض تقرير فحص 3 تشغيلات متتالية خالية من العيب مع اعتماد مهندس الجودة بعد 30 يوماً', textEn: 'Audit evidence of 3 zero-defect consecutive production runs verified after 30 days', correct: true, stressDelta: -15 },
        { id: 'p2', textAr: 'التوقيع بالإغلاق في نفس يوم فتح التقرير لتفادي تأخير المؤشرات', textEn: 'Closing on same day to avoid KPI penalty', correct: false, stressDelta: +35 },
        { id: 'p3', textAr: 'تعهد شفهي من رئيس الوردية بعدم تكرار الخلل', textEn: 'Verbal promise from shift leader', correct: false, stressDelta: +30 },
      ]
    },
    {
      auditorQuoteAr: 'المشغل رقم 07 يعمل على ماكينة التخريم.. هل تم تدريبه على أحدث تعديل في خطة التحكم (Control Plan Rev 04)؟',
      auditorQuoteEn: 'Operator #07 on stamping press.. Has he been trained on the latest Control Plan Rev 04?',
      clause: 'ISO 9001:2015 Clause 7.2 (Competence) & IATF 16949 Clause 8.5.1.1',
      proofs: [
        { id: 'p1', textAr: 'إظهار مصفوفة المهارات وسجل تدريب المشغل وتوقيعه على التعديل الجديد قبل بدء الوردية', textEn: 'Present skills matrix & signed training log on Rev 04 before shift start', correct: true, stressDelta: -15 },
        { id: 'p2', textAr: 'افتراض أن المشغل ذو خبرة 10 سنوات ولا يحتاج تدريباً على التعديلات', textEn: 'Assuming 10-year experience needs no retraining', correct: false, stressDelta: +35 },
        { id: 'p3', textAr: 'العمل بنسخة قديمة ملصقة على الماكينة منذ العام الماضي', textEn: 'Operating with outdated paper copy from last year', correct: false, stressDelta: +45 },
      ]
    }
  ];

  // Battle Timer effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (battleStatus === 'running' && battleTimer > 0) {
      timer = setInterval(() => {
        setBattleTimer((t) => {
          if (t <= 1) {
            setStressLevel((s) => Math.min(100, s + 30));
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [battleStatus, battleTimer]);

  const startBattle = () => {
    setBattleRound(0);
    setBattleTimer(45);
    setBattleScore(0);
    setStressLevel(15);
    setSelectedProof(null);
    setBattleStatus('running');
  };

  const handleSelectProof = (proof: { id: string; correct: boolean; stressDelta: number }) => {
    setSelectedProof(proof.id);
    const newStress = Math.max(0, Math.min(100, stressLevel + proof.stressDelta));
    setStressLevel(newStress);

    if (proof.correct) {
      setBattleScore((s) => s + 25);
      toast.success(isArabic ? 'إجابة مطابقة وحاسمة! المدقق راضٍ تماماً ✓' : 'Auditor satisfied with verified proof! ✓');
    } else {
      toast.error(isArabic ? 'حالة عدم مطابقة صريحة! المدقق يرفع الراية الحمراء ✕' : 'Audit nonconformity flagged! ✕');
    }

    setTimeout(() => {
      if (battleRound < auditRounds.length - 1) {
        setBattleRound((r) => r + 1);
        setBattleTimer(45);
        setSelectedProof(null);
      } else {
        if (newStress < 50 && battleScore + (proof.correct ? 25 : 0) >= 75) {
          setBattleStatus('won');
        } else {
          setBattleStatus('lost');
        }
      }
    }, 1500);
  };

  // -------------------------------------------------------------
  // 3. LIVE COMPUTER VISION DEFECT SCANNER LOGIC
  // -------------------------------------------------------------
  const [visionMode, setVisionMode] = useState<'sim' | 'webcam'>('sim');
  const [isScanning, setIsScanning] = useState(true);
  const [detectedDefects] = useState<Array<{ name: string; score: number; color: string; x: number; y: number; w: number; h: number }>>([
    { name: 'MICRO-CRACK [ISO CRITICAL]', score: 96.8, color: '#f43f5e', x: 28, y: 35, w: 24, h: 18 },
    { name: 'SURFACE BURR [MINOR]', score: 88.4, color: '#f59e0b', x: 62, y: 48, w: 18, h: 22 },
    { name: 'BORE DIAMETER [PASS]', score: 99.1, color: '#10b981', x: 42, y: 15, w: 26, h: 26 },
  ]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Toggle Camera
  const toggleWebcam = async () => {
    if (visionMode === 'webcam') {
      setVisionMode('sim');
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setVisionMode('webcam');
        toast.success(isArabic ? 'تم تفعيل الكاميرا الحية بنجاح' : 'Live Camera activated');
      } catch {
        toast.error(isArabic ? 'تعذر فتح الكاميرا، يرجى السماح بالإذن أو الاستمرار بوضع المحاكاة' : 'Could not access webcam, continuing with simulator');
      }
    }
  };

  const handleCaptureNCR = () => {
    toast.success(
      isArabic
        ? 'تم التقاط الصورة وتسجيل تقرير عدم مطابقة فوري NCR-2026-CV9 بنسبة دقة 96.8%!'
        : 'Frame captured & auto-logged to NCR-2026-CV9 with 96.8% confidence!'
    );
  };

  // -------------------------------------------------------------
  // 4. 3D EXPLODED VIEW & DEFECT HEATMAP STATE
  // -------------------------------------------------------------
  const [explodeValue, setExplodeValue] = useState(25);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [activePin, setActivePin] = useState<number | null>(1);

  const pinsData = [
    {
      id: 1,
      titleAr: 'المنطقة A: مبيت رولمان البلي (Bearing Housing)',
      titleEn: 'Zone A: Bearing Housing',
      defectAr: 'إجهاد تذبذبي وشق ميكروي سطحي ناتج عن زيادة عزم الربط بمقدار 18% عن التسامح المحدد.',
      defectEn: 'Cyclic micro-crack caused by 18% over-torque during spindle assembly.',
      fishboneAr: 'المعدات: مفتاح عزم غير معاير | الطريقة: عدم التقيد بتسلسل الربط المتقاطع (Star Pattern).',
      fishboneEn: 'Machine: Uncalibrated torque tool | Method: Missing cross-pattern torque sequence.',
      capaAr: 'تحديث برنامج الربط الرقمي DC Tool لمنع التشغيل في حال تجاوز 85 N.m وإلزام تسلسل النجوم.',
      capaEn: 'Lock DC tool to max 85 N.m and enforce digital interlock star pattern sequence.',
      severity: 'CRITICAL',
    },
    {
      id: 2,
      titleAr: 'المنطقة B: شفة التثبيت الرئيسية (Main Flange)',
      titleEn: 'Zone B: Main Flange',
      defectAr: 'حيود في التوازي بمقدار 0.04mm بسبب تآكل كربيد فصوص التفريز في محطة CNC 2.',
      defectEn: 'Parallelism deviation of 0.04mm due to CNC milling insert flank wear.',
      fishboneAr: 'الآلة: تجاوز حد العمر الافتراضي للفص (500 دورة) | الخامة: اختلاف صلادة الصب.',
      fishboneEn: 'Machine: Insert exceeded 500-cycle tool life | Material: Casting hardness batch variation.',
      capaAr: 'تفعيل مستشعر مراقبة تآكل الأدوات IoT Tool Wear ونظام التغيير الوقائي التلقائي.',
      capaEn: 'Activate IoT tool wear acoustic sensor with automatic preventive tool offset.',
      severity: 'MAJOR',
    },
    {
      id: 3,
      titleAr: 'المنطقة C: مجرى التبريد الحلقي (Cooling Chamber)',
      titleEn: 'Zone C: Cooling Chamber',
      defectAr: 'رايش سطحي دقيق (Burr < 0.15mm) لم يُزل بمرحلة التنظيف بالضغط العالي.',
      defectEn: 'Micro-burrs (< 0.15mm) remaining after high-pressure washing station.',
      fishboneAr: 'الطريقة: ضغط فوهة الغسيل انخفض إلى 4 بار بدلاً من 7 بار المقررة.',
      fishboneEn: 'Method: Wash nozzle pressure dropped to 4 bar instead of specified 7 bar.',
      capaAr: 'إضافة مانومتر قياس ضغط رقمي ذكي مزود بإنذار توقف فوري في حال انخفاض الضغط.',
      capaEn: 'Install digital pressure switch with line interlock if pressure drops below 6.5 bar.',
      severity: 'MINOR',
    },
  ];

  // -------------------------------------------------------------
  // 5. SMART TRAVELER & RED-TAG PRINT STUDIO STATE
  // -------------------------------------------------------------
  const [printDocType, setPrintDocType] = useState<'traveler' | 'redtag' | 'calibration'>('traveler');
  const [travelerPart, setTravelerPart] = useState('MAIN SPINDLE SHAFT 4041');
  const [travelerLot, setTravelerLot] = useState('LOT-2026-X89');
  const [travelerQty, setTravelerQty] = useState('500 PCS');

  return (
    <div className="min-h-screen pb-16 pt-2 px-3 sm:px-6 max-w-7xl mx-auto text-slate-100 font-sans">
      {/* Top Header */}
      <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-950 to-slate-900/90 border-2 border-cyan-500/40 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -top-20 -end-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -start-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black tracking-widest uppercase border border-cyan-500/40 shadow-sm flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
                Industry 5.0 Aerospace Quality Suite
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                PRO ACTIVE
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <span>{isArabic ? 'الترسانة الذكية الفائقة للجودة الصناعية' : 'Industrial Superpowers Intelligence Hub'}</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-amber-400">
                4.0+
              </span>
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              {isArabic
                ? 'مجموعة الأدوات الحية المتطورة للجيل القادم: المساعد الصوتي الثنائي، معركة التفتيش المفاجئ للآيزو، مسح العيوب بالذكاء الاصطناعي، مفكك القطع ثلاثي الأبعاد، واستوديو بطاقات التتبع والحجر الذكية.'
                : 'Next-generation industrial quality toolkit: Two-way Voice Copilot, ISO Audit Battle Simulator, Live Computer Vision Defect Scanner, 3D Exploded View Heatmap, and Smart Tag Print Studio.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => window.open('/docs/sop.html', '_blank')}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>{isArabic ? 'دليل التشغيل SOP' : 'SOP Manual'}</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2.5 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 font-black text-xs flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <span>{isArabic ? 'لوحة القيادة الرئيسية' : 'Main Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-8 pt-6 border-t border-white/10 relative z-10">
          <button
            onClick={() => setActiveTab('voice')}
            className={`p-3 rounded-2xl border text-start transition-all flex items-center gap-3 ${
              activeTab === 'voice'
                ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 border-cyan-400 text-white shadow-lg shadow-cyan-500/20 scale-[1.02]'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className={`p-2 rounded-xl ${activeTab === 'voice' ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-800 text-cyan-400'}`}>
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-black">{isArabic ? 'المساعد الصوتي الثنائي' : 'Voice Copilot'}</span>
              <span className="block text-[10px] text-slate-400 font-mono">Two-Way Speech</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`p-3 rounded-2xl border text-start transition-all flex items-center gap-3 ${
              activeTab === 'audit'
                ? 'bg-gradient-to-r from-amber-500/25 to-orange-500/25 border-amber-400 text-white shadow-lg shadow-amber-500/20 scale-[1.02]'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className={`p-2 rounded-xl ${activeTab === 'audit' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-amber-400'}`}>
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-black">{isArabic ? 'معركة تفتيش الآيزو' : 'Audit Battle'}</span>
              <span className="block text-[10px] text-slate-400 font-mono">ISO 9001 Simulator</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('vision')}
            className={`p-3 rounded-2xl border text-start transition-all flex items-center gap-3 ${
              activeTab === 'vision'
                ? 'bg-gradient-to-r from-rose-500/25 to-pink-500/25 border-rose-400 text-white shadow-lg shadow-rose-500/20 scale-[1.02]'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className={`p-2 rounded-xl ${activeTab === 'vision' ? 'bg-rose-500 text-white font-black' : 'bg-slate-800 text-rose-400'}`}>
              <Scan className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-black">{isArabic ? 'ماسح العيوب الذكي' : 'AI Vision Scanner'}</span>
              <span className="block text-[10px] text-slate-400 font-mono">Computer Vision</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('3d')}
            className={`p-3 rounded-2xl border text-start transition-all flex items-center gap-3 ${
              activeTab === '3d'
                ? 'bg-gradient-to-r from-purple-500/25 to-indigo-500/25 border-purple-400 text-white shadow-lg shadow-purple-500/20 scale-[1.02]'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className={`p-2 rounded-xl ${activeTab === '3d' ? 'bg-purple-500 text-white font-black' : 'bg-slate-800 text-purple-400'}`}>
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-black">{isArabic ? 'مفكك القطع 3D' : '3D Exploded View'}</span>
              <span className="block text-[10px] text-slate-400 font-mono">Stress Heatmap</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('print')}
            className={`p-3 rounded-2xl border text-start transition-all flex items-center gap-3 ${
              activeTab === 'print'
                ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 border-emerald-400 text-white shadow-lg shadow-emerald-500/20 scale-[1.02]'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className={`p-2 rounded-xl ${activeTab === 'print' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-emerald-400'}`}>
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-black">{isArabic ? 'استوديو البطاقات' : 'Tag Print Studio'}</span>
              <span className="block text-[10px] text-slate-400 font-mono">Traveler & Red Tag</span>
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: TWO-WAY CONVERSATIONAL VOICE COPILOT               */}
      {/* ========================================================= */}
      {activeTab === 'voice' && (
        <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/70 border border-cyan-500/30 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 pb-6 border-b border-white/10">
            <div>
              <span className="text-cyan-400 text-xs font-mono font-bold block mb-1">VOICE INTELLIGENCE ENGINE • REAL-TIME DIALOGUE</span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {isArabic ? 'المساعد الصوتي الصناعي التفاعلي (Two-Way Voice Agent)' : 'Two-Way Industrial Voice Copilot'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isArabic
                  ? 'اضغط على زر الميكروفون وتحدث بصوتك باللغة العربية أو الإنجليزية.. المنظومة تستمع، تحلل الأمر، تجيبك بالصوت، وتنفذ الإجراء فوراً!'
                  : 'Click the mic and speak naturally. The system listens, analyzes intent, speaks the answer aloud, and triggers app actions!'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setVoiceVolume(!voiceVolume)}
                className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
                title={voiceVolume ? 'كتم الرد الصوتي' : 'تفعيل الرد الصوتي'}
              >
                {voiceVolume ? <Volume2 className="w-5 h-5 text-cyan-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
              </button>
              <button
                onClick={() => speakText(voiceResponse)}
                className="px-4 py-2.5 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all"
              >
                🔊 {isArabic ? 'أعد نطق الإجابة' : 'Replay Answer'}
              </button>
            </div>
          </div>

          {/* Central Interactive Voice Pod */}
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="relative mb-6">
              {/* Outer Pulsing Rings */}
              {isListening && (
                <>
                  <div className="absolute -inset-6 rounded-full bg-cyan-500/20 animate-ping pointer-events-none" />
                  <div className="absolute -inset-12 rounded-full bg-cyan-500/10 animate-pulse pointer-events-none" />
                </>
              )}

              <button
                onClick={toggleListening}
                className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl relative z-10 ${
                  isListening
                    ? 'bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-500 text-white scale-110 shadow-rose-500/50'
                    : 'bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 text-slate-950 hover:scale-105 shadow-cyan-500/40'
                }`}
              >
                {isListening ? (
                  <>
                    <Mic className="w-10 h-10 sm:w-12 sm:h-12 animate-bounce" />
                    <span className="text-[10px] font-black uppercase tracking-wider mt-1">{isArabic ? 'جاري الاستماع' : 'Listening'}</span>
                  </>
                ) : (
                  <>
                    <MicOff className="w-10 h-10 sm:w-12 sm:h-12" />
                    <span className="text-[10px] font-black uppercase tracking-wider mt-1">{isArabic ? 'اضغط للتحدث' : 'Tap to Speak'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Live Transcript & Sound Wave HUD */}
            <div className="max-w-xl w-full p-4 rounded-2xl bg-slate-950/80 border border-slate-800 mb-6">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-1">
                {isArabic ? 'التقاط الصوت اللحظي:' : 'Real-Time Voice Input:'}
              </span>
              <p className="text-sm sm:text-base font-bold text-cyan-300 min-h-[1.8rem] italic" dir="auto">
                {voiceTranscript || (isArabic ? 'اضغط وتحدث مثل: "وريني العيوب" أو "شغل تفتيش الآيزو"' : 'Try speaking: "Show defects" or "Start ISO audit"')}
              </p>
            </div>

            {/* AI Synthesized Response Box */}
            <div className="max-w-2xl w-full p-6 rounded-3xl bg-gradient-to-b from-cyan-950/30 to-slate-950 border border-cyan-500/40 text-start shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs font-black text-white font-mono uppercase">
                  {isArabic ? 'رد المنظومة الصوتي الذكي:' : 'Voice Agent Response:'}
                </span>
              </div>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans" dir="auto">
                {voiceResponse}
              </p>
            </div>

            {/* Suggested Voice Commands Chips */}
            <div className="mt-8 max-w-2xl w-full text-start">
              <span className="text-xs font-bold text-slate-400 block mb-3">
                {isArabic ? 'أو اختر أمراً صوتياً تجريبياً بنقرة واحدة:' : 'Or trigger an instant simulated voice prompt:'}
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  'وريني العيوب المفتوحة',
                  'افتح تقرير عدم مطابقة NCR',
                  'شغل معركة تفتيش الآيزو',
                  'ابدأ الجولة التفاعلية الحية',
                  'اقرأ دليل التشغيل القياسي SOP',
                  'ما هو معدل الجودة FPY اليوم؟',
                ].map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setVoiceTranscript(cmd);
                      handleVoiceCommand(cmd);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700/80 hover:border-cyan-500/40 text-xs font-medium transition-all"
                  >
                    💬 {cmd}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ISO AUDIT BATTLE SIMULATOR                         */}
      {/* ========================================================= */}
      {activeTab === 'audit' && (
        <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/70 border border-amber-500/30 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                  Adrenaline Battle Mode
                </span>
                <span className="text-slate-400 text-xs font-mono">ISO 9001:2015 & IATF 16949</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {isArabic ? 'معركة تفتيش الآيزو المفاجئ (Audit Battle Simulator)' : 'Surprise ISO Audit Battle'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isArabic
                  ? 'مدقق الجودة الدولي الصارم (د. هانز كلاوس) يباغتك بأسئلة تفتيش حرجة مع عداد وقت تنازلي. هل ستنجو وتحصل على شهادة الجاهزية القصوى؟'
                  : 'Dr. Klaus, strict international ISO auditor, challenges your quality readiness with a countdown timer. Can you survive?'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-mono">STRESS GAUGE</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-24 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        stressLevel > 70 ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : stressLevel > 40 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${stressLevel}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold font-mono text-white">{stressLevel}%</span>
                </div>
              </div>

              {battleStatus === 'running' && (
                <div className="px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-center">
                  <span className="text-[10px] text-amber-300 block font-mono">TIME LEFT</span>
                  <span className="text-lg font-black text-amber-300 font-mono">{battleTimer}s</span>
                </div>
              )}
            </div>
          </div>

          {/* Game States */}
          {battleStatus === 'idle' && (
            <div className="py-12 text-center max-w-xl mx-auto">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-4xl shadow-xl shadow-amber-500/30 mx-auto mb-6">
                👨‍💼
              </div>
              <h3 className="text-xl font-black text-white mb-2">
                {isArabic ? 'المدقق الدولي أمام باب المصنع الآن!' : 'The ISO Auditor is at the factory gate!'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                {isArabic
                  ? 'لديك 4 جولات تفتيشية مكثفة. في كل جولة سيطلب منك المدقق دليلاً موضوعياً موثقاً. اختر الإجراء المطابق بسرعة قبل نفاد الوقت وارتفاع مؤشر التوتر!'
                  : '4 intense audit challenges. In each round, present objective documented evidence before time runs out and stress blows up!'}
              </p>
              <button
                onClick={startBattle}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 mx-auto"
              >
                <Swords className="w-5 h-5" />
                <span>{isArabic ? 'بدء معركة التفتيش الآن ⚡' : 'Start Audit Battle ⚡'}</span>
              </button>
            </div>
          )}

          {battleStatus === 'running' && (
            <div className="max-w-3xl mx-auto">
              {/* Auditor Speech Box */}
              <div className="p-6 rounded-3xl bg-slate-950 border-2 border-amber-500/40 relative mb-8 shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl font-bold">
                    👨‍💼
                  </span>
                  <div>
                    <span className="text-xs font-black text-white">د. هانز كلاوس (Lead Auditor)</span>
                    <span className="text-[10px] text-amber-400 block font-mono">
                      {auditRounds[battleRound].clause} • Round {battleRound + 1} of {auditRounds.length}
                    </span>
                  </div>
                </div>

                <p className="text-base sm:text-lg font-black text-amber-200 leading-relaxed" dir="auto">
                  "{isArabic ? auditRounds[battleRound].auditorQuoteAr : auditRounds[battleRound].auditorQuoteEn}"
                </p>
              </div>

              {/* Player Proof Options */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 block mb-1">
                  {isArabic ? 'اختر دليلك الموضوعي فورياً للرد على المدقق:' : 'Select your objective audit proof to present:'}
                </span>

                {auditRounds[battleRound].proofs.map((proof) => (
                  <button
                    key={proof.id}
                    disabled={selectedProof !== null}
                    onClick={() => handleSelectProof(proof)}
                    className={`w-full p-4 rounded-2xl border text-start transition-all flex items-start gap-3 ${
                      selectedProof === proof.id
                        ? proof.correct
                          ? 'bg-emerald-950/50 border-emerald-500 text-white'
                          : 'bg-rose-950/50 border-rose-500 text-white'
                        : 'bg-slate-800/40 border-slate-700/80 hover:bg-slate-800 text-slate-200 hover:border-slate-500'
                    }`}
                  >
                    <span className="p-1 rounded-lg bg-white/10 text-xs font-mono font-bold mt-0.5">
                      {proof.id.toUpperCase()}
                    </span>
                    <span className="text-xs sm:text-sm font-bold flex-1 leading-relaxed">
                      {isArabic ? proof.textAr : proof.textEn}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {battleStatus === 'won' && (
            <div className="py-10 text-center max-w-xl mx-auto">
              <span className="text-5xl block mb-3 animate-bounce">🏆</span>
              <h3 className="text-2xl font-black text-emerald-400 mb-2">
                {isArabic ? 'نجاح ساحق! تم اجتياز التفتيش دون أي ملاحظات حرجة' : 'Audit Survived with Zero Major Findings!'}
              </h3>
              <p className="text-xs text-slate-300 mb-6">
                {isArabic
                  ? `أداء خارق! النتيجة النهائية: ${battleScore}/100 مع مؤشر توتر متدنٍ ${stressLevel}%. لقد أثبتت امتلاكك لنظام جودة حقيقي غير ورقي.`
                  : `Masterclass! Final Score: ${battleScore}/100 with controlled stress ${stressLevel}%. Proven digital compliance.`}
              </p>
              <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border-2 border-emerald-500 text-center mb-6">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block mb-1">
                  OFFICIAL AUDIT READINESS ACCREDITATION
                </span>
                <h4 className="text-xl font-black text-white">ISO 9001:2015 AUDIT MASTER DEFENDER</h4>
                <p className="text-xs text-slate-400 mt-1">Certified Plant & Operator Competency</p>
              </div>
              <button
                onClick={startBattle}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 mx-auto transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isArabic ? 'إعادة التحدي' : 'Replay Challenge'}</span>
              </button>
            </div>
          )}

          {battleStatus === 'lost' && (
            <div className="py-10 text-center max-w-xl mx-auto">
              <span className="text-5xl block mb-3 animate-pulse">🚨</span>
              <h3 className="text-2xl font-black text-rose-400 mb-2">
                {isArabic ? 'تم تسجيل حالات عدم مطابقة كبرى (Major NC)' : 'Audit Breach: Major Nonconformities Issued'}
              </h3>
              <p className="text-xs text-slate-300 mb-6">
                {isArabic
                  ? 'ارتفع مؤشر التوتر وتأخر تقديم الأدلة الموضوعية. راجع دليل التشغيل القياسي SOP وأعد المحاولة لاكتساب المناعة الرقابية.'
                  : 'Stress surged and objective proof was delayed. Review the SOP and try again to build audit immunity.'}
              </p>
              <button
                onClick={startBattle}
                className="px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs flex items-center gap-2 mx-auto transition-all shadow-lg shadow-rose-500/30"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isArabic ? 'المحاولة مرة أخرى' : 'Retry Audit Battle'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: LIVE COMPUTER VISION DEFECT SCANNER                 */}
      {/* ========================================================= */}
      {activeTab === 'vision' && (
        <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/70 border border-rose-500/30 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase tracking-wider">
                  Neural Edge Vision
                </span>
                <span className="text-slate-400 text-xs font-mono">120 FPS Real-Time Inference</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {isArabic ? 'ماسح العيوب بالرؤية الحاسوبية الحية (Live AI Defect Scanner)' : 'Live Computer Vision Defect Scanner'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isArabic
                  ? 'يوجه الكاميرا نحو القطعة المصنعة، ويكتشف التشققات والرايش السطحي والأبعاد الهندسية لحظياً مع رسم مربعات الثقة والتسجيل التلقائي.'
                  : 'Inspects manufactured parts in real time, drawing neural bounding boxes and logging verified NCR tickets automatically.'}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={toggleWebcam}
                className={`px-4 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
                  visionMode === 'webcam'
                    ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/25'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>{visionMode === 'webcam' ? (isArabic ? 'إيقاف الكاميرا' : 'Stop Camera') : (isArabic ? 'تفعيل كاميرا الجهاز' : 'Activate Webcam')}</span>
              </button>
              <button
                onClick={() => setIsScanning(!isScanning)}
                className={`px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all ${
                  isScanning ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isScanning ? (isArabic ? 'التحليل قيد التشغيل' : 'Scanning Active') : (isArabic ? 'متوقف مؤقتاً' : 'Paused')}
              </button>
            </div>
          </div>

          {/* Scanner Viewport */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 relative rounded-3xl bg-slate-950 border-2 border-slate-800 overflow-hidden min-h-[380px] sm:min-h-[440px] flex items-center justify-center">
              {/* WebCam Video Element */}
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${visionMode === 'webcam' ? 'block' : 'hidden'}`}
              />

              {/* Simulated Industrial Camera Stream when Webcam is off */}
              {visionMode === 'sim' && (
                <div className="w-full h-full min-h-[420px] bg-slate-950 flex flex-col items-center justify-center relative p-6">
                  {/* Cyber Grid Background */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />

                  {/* Mechanical Part Graphic Outline */}
                  <div className="relative w-64 h-64 rounded-full border-4 border-dashed border-cyan-500/40 flex items-center justify-center bg-slate-900/60 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
                    <div className="w-40 h-40 rounded-full border-2 border-slate-700 flex items-center justify-center bg-slate-950">
                      <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-400/50 flex items-center justify-center text-xs font-mono font-bold text-cyan-300">
                        SPINDLE-40
                      </div>
                    </div>
                  </div>

                  {/* Scanning Laser Line */}
                  {isScanning && (
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_15px_#f43f5e] animate-scan pointer-events-none" />
                  )}
                </div>
              )}

              {/* Neural Bounding Boxes Overlay */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none">
                  {detectedDefects.map((def, idx) => (
                    <div
                      key={idx}
                      className="absolute border-2 transition-all duration-300"
                      style={{
                        left: `${def.x}%`,
                        top: `${def.y}%`,
                        width: `${def.w}%`,
                        height: `${def.h}%`,
                        borderColor: def.color,
                        boxShadow: `0 0 15px ${def.color}40`,
                      }}
                    >
                      <span
                        className="absolute -top-6 start-0 px-2 py-0.5 rounded text-[9px] font-black font-mono text-white whitespace-nowrap shadow-md"
                        style={{ backgroundColor: def.color }}
                      >
                        {def.name} ({def.score}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Viewport HUD Overlays */}
              <div className="absolute top-4 start-4 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-mono text-white">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>CAM-01 • SENSOR RES: 3840x2160 • FPS: 119.8</span>
              </div>

              <div className="absolute bottom-4 end-4">
                <button
                  onClick={handleCaptureNCR}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-black text-xs shadow-xl shadow-rose-500/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                  <Scan className="w-4 h-4" />
                  <span>{isArabic ? 'التقاط وتسجيل NCR تلقائي 📸' : 'Capture & Log NCR Ticket 📸'}</span>
                </button>
              </div>
            </div>

            {/* Inference Telemetry Sidebar */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-3">
                  AI DEFECT TELEMETRY
                </span>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
                    <div className="flex items-center justify-between text-xs font-black text-rose-300 mb-1">
                      <span>MICRO-CRACK</span>
                      <span>96.8% Conf.</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block">Class: Material Fracture (Severe)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-center justify-between text-xs font-black text-amber-300 mb-1">
                      <span>SURFACE BURR</span>
                      <span>88.4% Conf.</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block">Class: Tooling Flank Artifact</span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <div className="flex items-center justify-between text-xs font-black text-emerald-300 mb-1">
                      <span>BORE DIAMETER</span>
                      <span>99.1% PASS</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block">Dim: 45.002mm (USL: 45.015mm)</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300">
                <span className="font-bold text-white block mb-1">💡 معالجة الحافة (Edge AI):</span>
                <span>النموذج يعمل محلياً في المتصفح بزمن استجابة 8.3ms مع تصنيف فوري وفق ISO 2859-1.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: 3D EXPLODED VIEW & DEFECT HEATMAP                  */}
      {/* ========================================================= */}
      {activeTab === '3d' && (
        <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/70 border border-purple-500/30 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-wider">
                  3D CAD / WebGL Dissector
                </span>
                <span className="text-slate-400 text-xs font-mono">FEA Stress & Defect Concentration</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {isArabic ? 'مفكك القطع ثلاثي الأبعاد والخريطة الحرارية (3D Exploded View)' : '3D Mechanical Exploded View & Heatmap'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isArabic
                  ? 'نموذج تفاعلي يتيح تفكيك أجزاء التجميعة الميكانيكية في الفضاء، وتفعيل الخريطة الحرارية للإجهاد، والنقر على نقاط العيوب لتحليل إيشيكاوا.'
                  : 'Interactive 3D assembly. Explode components in space, toggle FEA thermal stress map, and click defect pins for Ishikawa analysis.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setHeatmapEnabled(!heatmapEnabled)}
                className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
                  heatmapEnabled
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>{heatmapEnabled ? (isArabic ? 'إخفاء الخريطة الحرارية' : 'Hide Heatmap') : (isArabic ? 'تفعيل الخريطة الحرارية' : 'Show Stress Heatmap')}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Interactive 3D Canvas Box */}
            <div className="lg:col-span-2 relative rounded-3xl bg-slate-950 border-2 border-purple-500/30 overflow-hidden min-h-[440px] flex flex-col justify-between p-6">
              {/* Top Viewport Header */}
              <div className="flex items-center justify-between text-xs text-slate-400 relative z-10">
                <span className="font-mono text-purple-400 font-bold">ASSEMBLY: TURBINE SPINDLE CARRIER #40</span>
                <span className="font-mono">EXPLODE DISTANCE: {explodeValue}mm</span>
              </div>

              {/* 3D Exploded View Visual Representation */}
              <div className="relative my-auto flex items-center justify-center py-10">
                {/* Part 1: Outer Housing */}
                <div
                  className={`w-44 h-44 rounded-3xl border-4 transition-all duration-500 flex items-center justify-center relative shadow-2xl ${
                    heatmapEnabled
                      ? 'bg-gradient-to-tr from-blue-600 via-amber-500 to-rose-600 border-rose-400 shadow-rose-500/30'
                      : 'bg-slate-800/90 border-slate-600'
                  }`}
                  style={{ transform: `translateX(-${explodeValue * 1.5}px)` }}
                >
                  <span className="text-[10px] font-mono font-bold text-white bg-black/60 px-2 py-0.5 rounded">
                    Housing Part 01
                  </span>

                  {/* Hotspot Pin 1 */}
                  <button
                    onClick={() => setActivePin(1)}
                    className="absolute -top-3 -end-3 w-8 h-8 rounded-full bg-rose-500 text-white font-black text-xs flex items-center justify-center shadow-lg shadow-rose-500/50 hover:scale-125 transition-transform animate-bounce"
                    title="انقر لتفاصيل العيب"
                  >
                    1
                  </button>
                </div>

                {/* Laser Connector Line */}
                <div
                  className="h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-500 opacity-60"
                  style={{ width: `${explodeValue * 2}px` }}
                />

                {/* Part 2: Inner Core Spindle */}
                <div
                  className={`w-36 h-36 rounded-full border-4 transition-all duration-500 flex items-center justify-center relative shadow-2xl ${
                    heatmapEnabled
                      ? 'bg-gradient-to-tr from-cyan-500 via-emerald-400 to-yellow-400 border-yellow-300'
                      : 'bg-slate-700/90 border-slate-500'
                  }`}
                  style={{ transform: `translateX(${explodeValue * 1.5}px)` }}
                >
                  <span className="text-[10px] font-mono font-bold text-white bg-black/60 px-2 py-0.5 rounded">
                    Core Shaft 02
                  </span>

                  {/* Hotspot Pin 2 */}
                  <button
                    onClick={() => setActivePin(2)}
                    className="absolute -top-3 -start-3 w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg shadow-amber-500/50 hover:scale-125 transition-transform"
                    title="انقر لتفاصيل العيب"
                  >
                    2
                  </button>
                </div>
              </div>

              {/* Explode Distance Slider Bar */}
              <div className="relative z-10 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center gap-4">
                <span className="text-xs font-bold text-slate-300 shrink-0">
                  {isArabic ? 'مسافة التفكيك 3D:' : 'Explode Distance:'}
                </span>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={explodeValue}
                  onChange={(e) => setExplodeValue(Number(e.target.value))}
                  className="flex-1 accent-purple-400 cursor-pointer"
                />
                <button
                  onClick={() => setExplodeValue(explodeValue === 0 ? 35 : 0)}
                  className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold"
                >
                  {explodeValue === 0 ? (isArabic ? 'تفكيك' : 'Explode') : (isArabic ? 'تجميع' : 'Assemble')}
                </button>
              </div>
            </div>

            {/* Defect Root Cause & CAPA Panel */}
            <div className="space-y-4">
              {activePin && (
                <div className="p-6 rounded-3xl bg-slate-950 border-2 border-purple-500/40 shadow-xl">
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase">
                        {pinsData[activePin - 1].severity} DEFECT
                      </span>
                      <h4 className="text-base font-black text-white mt-1">
                        {isArabic ? pinsData[activePin - 1].titleAr : pinsData[activePin - 1].titleEn}
                      </h4>
                    </div>
                    <span className="text-2xl font-black text-purple-400 font-mono">#{activePin}</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">وصف العيب:</span>
                      <p className="text-slate-200 leading-relaxed font-bold">
                        {isArabic ? pinsData[activePin - 1].defectAr : pinsData[activePin - 1].defectEn}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <span className="text-amber-300 font-bold block mb-1">🐟 تحليل السبب الجذري (Ishikawa 5M):</span>
                      <p className="text-slate-300 leading-relaxed">
                        {isArabic ? pinsData[activePin - 1].fishboneAr : pinsData[activePin - 1].fishboneEn}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <span className="text-emerald-300 font-bold block mb-1">🛡️ الإجراء الوقائي المعتمد (CAPA):</span>
                      <p className="text-slate-300 leading-relaxed">
                        {isArabic ? pinsData[activePin - 1].capaAr : pinsData[activePin - 1].capaEn}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: SMART TRAVELER & RED-TAG PRINT STUDIO              */}
      {/* ========================================================= */}
      {activeTab === 'print' && (
        <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/70 border border-emerald-500/30 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/10 no-print">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                  Industrial Print Engine
                </span>
                <span className="text-slate-400 text-xs font-mono">ISO 9001 / IATF Traceability Cards</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {isArabic ? 'استوديو طباعة بطاقات التتبع والحجر الذكية (Smart Tag Studio)' : 'Smart Traveler & Tag Print Studio'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isArabic
                  ? 'توليد وطباعة بطاقات مسار الإنتاج الذكية، بطاقات الحجر الصحي الحمراء (Red Tags)، ولاصقات المعايرة المزودة بـ QR Code تفاعلي فوري.'
                  : 'Generate and print production route travelers, ISO 8.7 Quarantine Red Tags, and Calibration stickers with live QR verification.'}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs shadow-xl shadow-emerald-500/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>{isArabic ? '🖨️ طباعة البطاقة فوراً' : '🖨️ Print Label / PDF'}</span>
              </button>
            </div>
          </div>

          {/* Document Type Selector Ribbon */}
          <div className="flex flex-wrap gap-2 mb-8 no-print">
            <button
              onClick={() => setPrintDocType('traveler')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                printDocType === 'traveler'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              📋 {isArabic ? 'بطاقة مسار الإنتاج (Work Traveler)' : 'Work Traveler Card'}
            </button>
            <button
              onClick={() => setPrintDocType('redtag')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                printDocType === 'redtag'
                  ? 'bg-rose-500 text-white font-black shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🔴 {isArabic ? 'بطاقة الحجر الصحي الحمراء (ISO 8.7 Red Tag)' : 'Quarantine Red Tag'}
            </button>
            <button
              onClick={() => setPrintDocType('calibration')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                printDocType === 'calibration'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🏷️ {isArabic ? 'لاصقة معايرة الأجهزة القياسية' : 'Calibration Sticker'}
            </button>
          </div>

          {/* PRINTABLE CARD 1: PRODUCTION WORK TRAVELER */}
          {printDocType === 'traveler' && (
            <div
              id="printable-card"
              className="p-8 sm:p-10 rounded-3xl bg-white text-slate-950 border-4 border-slate-900 shadow-2xl max-w-3xl mx-auto font-sans"
            >
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-6">
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-slate-600 block uppercase">
                    QMS ENTERPRISE 4.0 • DIGITAL ROUTE SHEET
                  </span>
                  <h3 className="text-2xl font-black text-slate-900">بطاقة تتبع مسار العمل والإنتاج (WORK TRAVELER)</h3>
                  <span className="text-xs font-bold text-slate-700">COMPLIANT WITH ISO 9001:2015 CLAUSE 8.5.2</span>
                </div>
                {/* SVG QR Code Simulation */}
                <div className="p-2 border-2 border-slate-900 rounded-xl bg-slate-50 text-center">
                  <div className="w-16 h-16 bg-slate-900 flex items-center justify-center text-white text-[9px] font-mono">
                    [QR CODE]
                  </div>
                  <span className="text-[8px] font-mono block mt-1">SCAN FOR LIVE DATA</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-100 border border-slate-300 mb-6 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">اسم القطعة / المكون:</span>
                  <input
                    type="text"
                    value={travelerPart}
                    onChange={(e) => setTravelerPart(e.target.value)}
                    className="font-black text-slate-900 bg-transparent w-full border-b border-slate-400 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">رقم الدفعة (Lot No):</span>
                  <input
                    type="text"
                    value={travelerLot}
                    onChange={(e) => setTravelerLot(e.target.value)}
                    className="font-black font-mono text-slate-900 bg-transparent w-full border-b border-slate-400 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">الكمية المصنعة:</span>
                  <input
                    type="text"
                    value={travelerQty}
                    onChange={(e) => setTravelerQty(e.target.value)}
                    className="font-black text-slate-900 bg-transparent w-full border-b border-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Manufacturing Route Operations Table */}
              <table className="w-full text-start text-xs border-collapse border border-slate-300 mb-6">
                <thead>
                  <tr className="bg-slate-200 text-slate-800 font-bold">
                    <th className="p-2 border border-slate-300 text-start">العملية #</th>
                    <th className="p-2 border border-slate-300 text-start">محطة العمل</th>
                    <th className="p-2 border border-slate-300 text-start">معيار الفحص والقبول</th>
                    <th className="p-2 border border-slate-300 text-center">توقيع المشغل</th>
                    <th className="p-2 border border-slate-300 text-center">اعتماد الجودة QC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  <tr>
                    <td className="p-2.5 border border-slate-300 font-mono font-bold">OP-10</td>
                    <td className="p-2.5 border border-slate-300">القطع الأولي بالليزر (Laser Cutting)</td>
                    <td className="p-2.5 border border-slate-300">طول 450 ± 0.5mm</td>
                    <td className="p-2.5 border border-slate-300 text-center font-mono">Eng. M.H.</td>
                    <td className="p-2.5 border border-slate-300 text-center font-bold text-emerald-700">PASS ✓</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border border-slate-300 font-mono font-bold">OP-20</td>
                    <td className="p-2.5 border border-slate-300">الخراطة الدقيقة CNC Lathe</td>
                    <td className="p-2.5 border border-slate-300">قطر داخلي 45.000 ± 0.015mm</td>
                    <td className="p-2.5 border border-slate-300 text-center font-mono">Op. 12</td>
                    <td className="p-2.5 border border-slate-300 text-center font-bold text-emerald-700">PASS ✓</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border border-slate-300 font-mono font-bold">OP-30</td>
                    <td className="p-2.5 border border-slate-300">المعالجة الحرارية (Induction Hardening)</td>
                    <td className="p-2.5 border border-slate-300">صلادة 58-62 HRC</td>
                    <td className="p-2.5 border border-slate-300 text-center font-mono">Op. 04</td>
                    <td className="p-2.5 border border-slate-300 text-center font-bold text-emerald-700">PASS ✓</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border border-slate-300 font-mono font-bold">OP-40</td>
                    <td className="p-2.5 border border-slate-300">فحص الخروج والتغليف (OQC Inspection)</td>
                    <td className="p-2.5 border border-slate-300">خلو تام من الخدوش + شهادة e-COA</td>
                    <td className="p-2.5 border border-slate-300 text-center font-mono">Q-Inspector</td>
                    <td className="p-2.5 border border-slate-300 text-center font-bold text-emerald-700">APPROVED ✓</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-300">
                <span>تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</span>
                <span>النظام المعتمد: QMS 4.0 Industrial OS - PixoraCo</span>
              </div>
            </div>
          )}

          {/* PRINTABLE CARD 2: QUARANTINE RED TAG */}
          {printDocType === 'redtag' && (
            <div
              id="printable-card"
              className="p-8 sm:p-10 rounded-3xl bg-rose-50 text-slate-950 border-8 border-rose-600 shadow-2xl max-w-2xl mx-auto font-sans"
            >
              <div className="bg-rose-600 text-white p-4 rounded-xl text-center mb-6 shadow-md">
                <span className="text-3xl block mb-1">⛔ HOLD / QUARANTINE ⛔</span>
                <h3 className="text-2xl font-black">بطاقة حجر صحي وعزل فوري (REJECTED / RED TAG)</h3>
                <span className="text-xs font-mono font-bold">STRICTLY PROHIBITED TO MOVE OR PROCESS (ISO 9001:2015 CLAUSE 8.7)</span>
              </div>

              <div className="space-y-4 text-xs font-bold">
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white border border-rose-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">رقم تقرير عدم المطابقة:</span>
                    <span className="font-mono text-base font-black text-rose-600">NCR-2026-X089</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">تاريخ ووقت العزل:</span>
                    <span className="font-mono text-sm">{new Date().toLocaleString('ar-EG')}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-rose-300">
                  <span className="text-slate-500 block text-[10px] mb-1">سبب الحجز والعزل الفيزيائي:</span>
                  <p className="text-sm text-slate-900 leading-relaxed font-black">
                    انحراف قطري بمقدار +0.08mm وتلوث خامات بالشوائب الزيتية. محظور استخدامها لحين انعقاد لجنة مراجعة المواد MRB.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white border border-rose-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">المسؤول عن وضع البطاقة:</span>
                    <span className="text-sm font-black text-slate-900">م. محمد حسن (Quality Lead)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">الموقع الفيزيائي للحجز:</span>
                    <span className="text-sm font-mono font-black text-rose-700">CAGE-03 (LOCKED)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PRINTABLE CARD 3: CALIBRATION STICKER */}
          {printDocType === 'calibration' && (
            <div
              id="printable-card"
              className="p-6 rounded-2xl bg-emerald-50 text-slate-950 border-4 border-emerald-600 shadow-2xl max-w-md mx-auto font-sans"
            >
              <div className="flex items-center justify-between border-b-2 border-emerald-600 pb-2 mb-3">
                <span className="text-xs font-black text-emerald-800">معايرة معتمدة CALIBRATED</span>
                <span className="text-[10px] font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded">
                  PASS ✓
                </span>
              </div>
              <div className="space-y-2 text-xs font-bold">
                <div className="flex justify-between">
                  <span className="text-slate-500">كود الأداة (ID):</span>
                  <span className="font-mono">TORQUE-WRENCH-01</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">تاريخ المعايرة:</span>
                  <span className="font-mono">{new Date().toLocaleDateString('ar-EG')}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>تاريخ انتهاء الصلاحية:</span>
                  <span className="font-mono font-black">November 2027</span>
                </div>
                <div className="flex justify-between border-t border-emerald-300 pt-2">
                  <span className="text-slate-500">معاير بواسطة:</span>
                  <span>معمل المعايرة المركزي QMS</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default IndustrialSuperpowersHub;
