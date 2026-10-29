import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mic, Wand2, X, RefreshCw, CheckCircle2, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface SmartFormCopilotProps {
  onAutoFill: (data: Record<string, any>) => void;
  fields: Array<{ name: string; label: string; type: string }>;
}

// -----------------------------------------------------------------------------
// INDUSTRIAL DEFECT DICTIONARY (ARABIC & ENGLISH)
// -----------------------------------------------------------------------------
const DEFECT_DICTIONARY = [
  { standard: 'Scratch', standardAr: 'خدش سطحي', keywords: ['خدش', 'خدوش', 'خربشة', 'تجريح', 'scratch', 'scratches', 'scratched', 'abrasion'] },
  { standard: 'Crack / Fracture', standardAr: 'شرخ / كسر', keywords: ['شرخ', 'شروخ', 'كسر', 'مكسور', 'مشروخ', 'صدع', 'تشقق', 'انشطار', 'crack', 'cracks', 'cracked', 'broken', 'fracture'] },
  { standard: 'Dent / Deformation', standardAr: 'انبعاج / نقرة', keywords: ['انبعاج', 'انبعاجات', 'نقرة', 'طعجة', 'صدمة', 'تقوس', 'التواء', 'اعوجاج', 'dent', 'dents', 'dented', 'depression', 'warpage'] },
  { standard: 'Leakage', standardAr: 'تسريب زيت / سوائل', keywords: ['تسريب', 'تسريب زيت', 'تسريب مياه', 'تنفيس', 'رشح', 'leak', 'leakage', 'leaking'] },
  { standard: 'Burr / Flash', standardAr: 'رايش / زوائد', keywords: ['رايش', 'ريش', 'زوائد', 'نتوءات', 'burr', 'burrs', 'flash'] },
  { standard: 'Dimensional Deviation', standardAr: 'عدم تطابق أبعاد', keywords: ['أبعاد', 'ابعاد', 'أبعاد غير مطابقة', 'مقاس', 'مقاس غير مطابق', 'طول غير مطابق', 'قطر غير مطابق', 'سماكة', 'سمك', 'dimension', 'dimensions', 'out of spec', 'tolerance'] },
  { standard: 'Welding Defect', standardAr: 'عيب لحام', keywords: ['عيب لحام', 'لحام ضعيف', 'مسامية لحام', 'شروخ لحام', 'لحام', 'weld', 'welding', 'poor weld'] },
  { standard: 'Porosity / Blister', standardAr: 'مسامية / فقاعات', keywords: ['فقاعات', 'مسامية', 'بثور', 'فجوات', 'porosity', 'blister', 'blowhole'] },
  { standard: 'Paint / Coating Defect', standardAr: 'عيب دهان / طلاء', keywords: ['دهان', 'بوية', 'طلاء', 'تقشير دهان', 'بقع دهان', 'تسييل', 'paint', 'coating', 'peel', 'peeling'] },
  { standard: 'Corrosion / Rust', standardAr: 'صدأ / تآكل', keywords: ['صدأ', 'صدا', 'مصدي', 'تآكل', 'تاكل', 'أكسدة', 'rust', 'rusty', 'corrosion'] },
  { standard: 'Assembly Defect', standardAr: 'عيب تجميع / تثبيت', keywords: ['تجميع', 'تركيب', 'مسمار ناقص', 'تفويت', 'عدم ربط', 'فك', 'assembly', 'missing part', 'loose screw'] },
  { standard: 'Contamination', standardAr: 'شوائب / تلوث', keywords: ['شوائب', 'اتساخ', 'بقع', 'تلوث', 'وساخة', 'contamination', 'dirty', 'stain'] },
  { standard: 'Electrical Defect', standardAr: 'عيب كهربائي', keywords: ['ماس كهربائي', 'شورت', 'توصيل ضعيف', 'جهد غير مطابق', 'short circuit', 'electrical'] },
];

function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F]/g, '') // remove diacritics
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase();
}

interface ParsedNlpData {
  defectType?: string;
  defectCount?: number;
  sampleSize?: number;
  inspectionPoints?: number;
  result?: 'pass' | 'fail' | 'pending';
  type?: 'incoming' | 'in-process' | 'final' | 'shipping';
  batchNumber?: string;
  productName?: string;
  severity?: 'critical' | 'major' | 'minor';
  inspectedBy?: string;
  notes?: string;
}

function parseIndustrialNlp(rawText: string): ParsedNlpData {
  const norm = normalizeArabic(rawText);
  const result: ParsedNlpData = {
    notes: rawText.trim(),
  };

  // 1. Defect Type
  for (const entry of DEFECT_DICTIONARY) {
    const matched = entry.keywords.some((kw) => {
      const normKw = normalizeArabic(kw);
      return norm.includes(normKw);
    });
    if (matched) {
      result.defectType = entry.standardAr;
      break;
    }
  }

  // 2. Inspection Result (Pass / Fail / Pending)
  const failPatterns = ['غير مطابق', 'غير مطابقة', 'مرفوض', 'مرفوضه', 'فاشل', 'ساقط', 'راسب', 'رفض', 'معيب', 'لا يصلح', 'fail', 'failed', 'reject', 'rejected', 'ng', 'non-conforming'];
  const passPatterns = ['مطابق', 'مطابقة', 'مقبول', 'مقبوله', 'سليم', 'سليمة', 'ناجح', 'تمام', 'جيد', 'صالح', 'اجتاز', 'pass', 'passed', 'accept', 'accepted', 'approved', 'ok'];

  if (failPatterns.some((p) => norm.includes(normalizeArabic(p)))) {
    result.result = 'fail';
  } else if (passPatterns.some((p) => norm.includes(normalizeArabic(p)))) {
    result.result = 'pass';
  } else if (result.defectType) {
    // If defect detected and not explicitly stated pass, default to fail in QMS
    result.result = 'fail';
  }

  // 3. Defect Count / Quantity
  if (/(?:عيب واحد|قطعه واحده|خدش واحد|شرخ واحد|كسر واحد)/.test(norm)) {
    result.defectCount = 1;
  } else if (/(?:عيبين|عيبان|قطعتين|قطعتان|خدشين|خدشان|شرخين|شرخان|كسرين)/.test(norm)) {
    result.defectCount = 2;
  } else {
    const m1 = norm.match(/(?:عدد العيوب|العيوب|الكميه المعيبه|defect count|defects?)\s*[:=]?\s*(\d+)/i);
    const m2 = norm.match(/(\d+)\s*(?:عيب|عيوب|قطعه معيبه|قطع معيبه|شرخ|شروخ|خدش|خدوش|انبعاج|كسر|defects?|flaws?)/i);
    const m3 = norm.match(/(?:الكميه|العدد|qty|quantity)\s*[:=]?\s*(\d+)/i);
    if (m1) result.defectCount = parseInt(m1[1], 10);
    else if (m2) result.defectCount = parseInt(m2[1], 10);
    else if (m3) result.defectCount = parseInt(m3[1], 10);
    else if (result.defectType) result.defectCount = 1; // Default to 1 if defect mentioned
  }

  // 4. Sample Size
  const smMatch = norm.match(/(?:عينه|حجم العينه|من اجمالي|من اصل|من عينه|sample size|sample)\s*[:=]?\s*(\d+)/i);
  if (smMatch) result.sampleSize = parseInt(smMatch[1], 10);

  // 5. Inspection Points
  const ptMatch = norm.match(/(?:نقاط الفحص|نقطه فحص|inspection points?)\s*[:=]?\s*(\d+)/i);
  if (ptMatch) result.inspectionPoints = parseInt(ptMatch[1], 10);

  // 6. Inspection Type
  if (/(?:وارد|استلام|توريد|خامات|مورد|iqc|incoming)/i.test(norm)) {
    result.type = 'incoming';
  } else if (/(?:مرحلي|اثناء التشغيل|خط الانتاج|ipqc|in-process)/i.test(norm)) {
    result.type = 'in-process';
  } else if (/(?:نهائي|فحص نهائي|تام الصنع|fqc|final)/i.test(norm)) {
    result.type = 'final';
  } else if (/(?:شحن|تسليم|خروج|oqc|shipping|outgoing)/i.test(norm)) {
    result.type = 'shipping';
  }

  // 7. Batch / Lot Number
  const lotMatch = rawText.match(/(?:تشغيلة|تشغيله|لوط|دفعة|دفعه|batch|lot)\s*(?:رقم|num|#)?\s*([a-zA-Z0-9_\-]+)/i);
  if (lotMatch) result.batchNumber = lotMatch[1];

  // 8. Product Name
  const prodMatch = rawText.match(/(?:منتج|خامة|خامه|قطعة|قطعه|صنف|جزء|موديل|product|part|item)\s*[:=]?\s*([a-zA-Z0-9\u0600-\u06FF\s\-]+?)(?=(?:[\u060C,،\.\n]|تشغيلة|تشغيله|لوط|دفعة|دفعه|عينة|عينه|عيب|عيوب|عدد|كمية|كميه|نتيجة|بعدد|مع|$))/i);
  if (prodMatch && prodMatch[1].trim()) {
    result.productName = prodMatch[1].replace(/[\u060C,،\.;:]+$/g, '').trim();
  }

  // 9. Severity
  if (/(?:حرج|خطير جدا|كارثي|critical)/i.test(norm)) {
    result.severity = 'critical';
  } else if (/(?:رئيسي|كبير|هام|مؤثر|major)/i.test(norm)) {
    result.severity = 'major';
  } else if (/(?:بسيط|طفيف|ثانوي|صغير|غير مؤثر|minor)/i.test(norm)) {
    result.severity = 'minor';
  } else if (result.defectCount && result.defectCount > 3) {
    result.severity = 'major';
  }

  // 10. Inspector
  const inspMatch = rawText.match(/(?:الفاحص|المفتش|بواسطة|مهندس|فحص|inspected by|inspector)\s*[:=]?\s*([a-zA-Z\u0600-\u06FF\s]+?)(?=(?:[\u060C,،\.\n]|تشغيلة|تشغيله|لوط|دفعة|عينة|عيب|نتيجة|$))/i);
  if (inspMatch && inspMatch[1].trim()) {
    result.inspectedBy = inspMatch[1].trim();
  }

  return result;
}

const SAMPLE_PROMPTS = [
  'وجدنا 3 شروخ في صاج مسحوب، لوط LOT-9042، فحص غير مطابق',
  'فحص استلام وارد: خدش سطحي في 5 قطع، عينة 50، مرفوض',
  'تسريب زيت من الجوان، الكمية 2، تشغيلة B12، مرفوض',
  'فحص مرحلي مطابق: عينة 30 قطعة سليم تماماً بدون عيوب',
];

export function SmartFormCopilot({ onAutoFill, fields }: SmartFormCopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastExtracted, setLastExtracted] = useState<Record<string, any> | null>(null);

  // Voice Recognition setup
  useEffect(() => {
    if (!isListening) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('التعرف على الصوت غير مدعوم في هذا المتصفح. يمكنك الكتابة مباشرة.');
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'ar-SA'; // Arabic support

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      // Auto trigger processing after speaking
      setTimeout(() => processInput(transcript), 400);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      toast.error('تعذر التعرف على الصوت. الرجاء المحاولة مجدداً أو كتابة الوصف.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }

    return () => {
      try {
        recognition.stop();
      } catch {}
    };
  }, [isListening]);

  const processInput = async (textToProcess: string = input) => {
    if (!textToProcess.trim()) return;

    setIsProcessing(true);
    setLastExtracted(null);

    // Realistic brief AI delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const parsed = parseIndustrialNlp(textToProcess);
    const extractedData: Record<string, any> = {};

    // Map extracted NLP tokens to the exact form fields schema
    fields.forEach((field) => {
      const name = field.name.toLowerCase();
      const label = (field.label || '').toLowerCase();
      const type = field.type;

      // 1. Defect Count / Quantity (STRICTLY NUMBERS ONLY)
      if (
        (name.includes('defectcount') ||
          name.includes('defects') ||
          (name.includes('qty') && !name.includes('scrap')) ||
          (name.includes('quantity') && !name.includes('order')) ||
          label.includes('defect count') ||
          label.includes('عدد العيوب') ||
          label.includes('كمية')) &&
        type === 'number'
      ) {
        if (parsed.defectCount !== undefined) {
          extractedData[field.name] = parsed.defectCount;
        }
      }

      // 2. Sample Size (STRICTLY NUMBER)
      if (
        (name.includes('samplesize') || name.includes('sample') || label.includes('sample') || label.includes('عينة')) &&
        type === 'number'
      ) {
        if (parsed.sampleSize !== undefined) {
          extractedData[field.name] = parsed.sampleSize;
        }
      }

      // 3. Inspection Points (STRICTLY NUMBER)
      if (
        (name.includes('inspectionpoints') || name.includes('points') || label.includes('نقاط')) &&
        type === 'number'
      ) {
        if (parsed.inspectionPoints !== undefined) {
          extractedData[field.name] = parsed.inspectionPoints;
        }
      }

      // 4. Defect Type / Name (STRING / TEXT ONLY - NEVER ASSIGN TO NUMBER)
      if (
        (name === 'defecttype' ||
          name === 'defect' ||
          name.includes('defect_type') ||
          (label.includes('defect') && !label.includes('count')) ||
          label.includes('نوع العيب') ||
          label.includes('العيب')) &&
        type !== 'number'
      ) {
        if (parsed.defectType) {
          extractedData[field.name] = parsed.defectType;
        }
      }

      // 5. Result (Select: pass / fail / pending)
      if (
        name === 'result' ||
        name === 'status' ||
        label.includes('result') ||
        label.includes('نتيجة') ||
        label.includes('حالة الفحص')
      ) {
        if (parsed.result) {
          extractedData[field.name] = parsed.result;
        }
      }

      // 6. Inspection Type (Select: incoming / in-process / final / shipping)
      if ((name === 'type' || name === 'inspectiontype' || label.includes('type')) && type === 'select') {
        if (parsed.type) {
          extractedData[field.name] = parsed.type;
        }
      }

      // 7. Product / Item Name
      if (
        (name.includes('product') ||
          name.includes('part') ||
          name.includes('item') ||
          label.includes('product') ||
          label.includes('منتج') ||
          label.includes('خامة')) &&
        type !== 'number'
      ) {
        if (parsed.productName) {
          extractedData[field.name] = parsed.productName;
        }
      }

      // 8. Batch / Lot Number
      if (
        (name.includes('batch') ||
          name.includes('lot') ||
          label.includes('batch') ||
          label.includes('lot') ||
          label.includes('تشغيلة') ||
          label.includes('لوط') ||
          label.includes('دفعة')) &&
        type !== 'number'
      ) {
        if (parsed.batchNumber) {
          extractedData[field.name] = parsed.batchNumber;
        }
      }

      // 9. Severity
      if ((name.includes('severity') || label.includes('severity') || label.includes('شدة') || label.includes('درجة')) && type !== 'number') {
        if (parsed.severity) {
          extractedData[field.name] = parsed.severity;
        }
      }

      // 10. Inspected By / Inspector
      if ((name.includes('inspectedby') || name.includes('inspector') || label.includes('inspected') || label.includes('فاحص')) && type !== 'number') {
        if (parsed.inspectedBy) {
          extractedData[field.name] = parsed.inspectedBy;
        }
      }

      // 11. Notes / Description / Details
      if (
        (name.includes('note') ||
          name.includes('desc') ||
          name.includes('remark') ||
          name.includes('detail') ||
          label.includes('note') ||
          label.includes('وصف') ||
          label.includes('ملاحظات') ||
          label.includes('تفاصيل')) &&
        (type === 'textarea' || type === 'text')
      ) {
        if (parsed.notes) {
          extractedData[field.name] = parsed.notes;
        }
      }

      // 12. Date
      if (
        (name.includes('date') || label.includes('date') || label.includes('تاريخ')) &&
        type === 'date'
      ) {
        extractedData[field.name] = new Date().toISOString().split('T')[0];
      }
    });

    const extractedCount = Object.keys(extractedData).length;

    if (extractedCount > 0) {
      setLastExtracted(extractedData);
      onAutoFill(extractedData);

      const defectLabel = parsed.defectType ? `العيب: [${parsed.defectType}]` : '';
      const countLabel = parsed.defectCount !== undefined ? `العدد: [${parsed.defectCount}]` : '';
      const resultLabel = parsed.result ? `النتيجة: [${parsed.result === 'fail' ? 'غير مطابق ❌' : 'مطابق ✓'}]` : '';

      toast.success('تم ملء النموذج تلقائياً بالذكاء الاصطناعي! ✨', {
        description: [defectLabel, countLabel, resultLabel].filter(Boolean).join(' • ') || `تم تعبئة ${extractedCount} حقول بنجاح`,
      });

      // Brief pause so user sees what was populated, then close
      setTimeout(() => {
        setIsOpen(false);
        setInput('');
        setLastExtracted(null);
      }, 1000);
    } else {
      toast.error('لم نتمكن من استخراج بيانات مطابقة للنموذج.', {
        description: 'جرّب ذكر نوع العيب، عدد العيوب، رقم اللوط، أو النتيجة، مثلاً: "3 شروخ في صاج مسحوب، مرفوض"',
      });
    }

    setIsProcessing(false);
  };

  return (
    <div className="mb-6 relative z-30 w-full max-w-2xl mx-auto">
      {!isOpen ? (
        <motion.button
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#00A3E0]/15 via-[#0066CC]/20 to-[#00A3E0]/15 border border-[#00A3E0]/40 hover:border-[#00A3E0]/80 transition-all shadow-[0_0_25px_rgba(0,163,224,0.2)] hover:shadow-[0_0_35px_rgba(0,163,224,0.4)] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          <Sparkles className="w-5 h-5 text-[#00A3E0] animate-pulse" />
          <div className="flex flex-col text-left rtl:text-right">
            <span className="text-xs sm:text-sm font-black text-[#8be3ff] tracking-wide flex items-center gap-2">
              ✨ AI MAGIC FILL
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-[#00A3E0]/20 border border-[#00A3E0]/30 text-[#00A3E0]">
                ذكاء اصطناعي
              </span>
            </span>
            <span className="text-[11px] text-white/50 font-normal hidden sm:inline">
              املأ الفحص والعيوب بالتحدث صوتياً أو كتابةً
            </span>
          </div>
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="p-1 rounded-3xl bg-gradient-to-r from-[#00A3E0] via-[#0066CC] to-[#00A3E0] bg-[length:200%_auto] animate-gradient shadow-[0_0_40px_rgba(0,163,224,0.35)]"
        >
          <div className="bg-[#0b101b] rounded-[22px] p-4 sm:p-5 flex flex-col gap-3.5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2 text-[#00A3E0]">
                <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Q-Elite Industrial AI Copilot
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#00A3E0]/20 text-[#00A3E0]">
                  مساعد الفحص الذكي
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsListening(false);
                }}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input Bar */}
            <div className="flex items-center gap-2 sm:gap-3 bg-white/5 border border-white/10 rounded-2xl p-2 relative overflow-hidden focus-within:border-[#00A3E0]/60 transition-colors">
              {isProcessing && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00A3E0]/20 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                />
              )}

              {/* Mic Button */}
              <button
                type="button"
                onClick={() => setIsListening(!isListening)}
                disabled={isProcessing}
                className={`p-2.5 sm:p-3 rounded-xl transition-all relative ${
                  isListening
                    ? 'bg-red-500/25 text-red-400 border border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse'
                    : 'bg-white/5 text-white/70 hover:text-[#00A3E0] hover:bg-[#00A3E0]/15 border border-transparent'
                }`}
                title={isListening ? 'جاري الاستماع... اضغط للإيقاف' : 'اضغط للتحدث بالصوت'}
              >
                <Mic className="w-5 h-5" />
                {isListening && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </button>

              {/* Text Input */}
              <input
                type="text"
                placeholder={
                  isListening
                    ? '🎙️ جاري الاستماع إلى صوتك... تحدث الآن'
                    : 'تحدث بالصوت أو اكتب، مثلاً: "3 شروخ في صاج مسحوب، لوط LOT-9042، مرفوض"'
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && processInput()}
                disabled={isProcessing}
                className="flex-1 bg-transparent border-none text-white text-xs sm:text-sm outline-none placeholder:text-white/35 min-w-0"
              />

              {/* Apply / Magic Fill Button */}
              <button
                type="button"
                onClick={() => processInput()}
                disabled={isProcessing || !input.trim()}
                className="px-3.5 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white text-xs sm:text-sm font-bold shadow-lg hover:shadow-[#00A3E0]/50 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100 flex items-center gap-1.5 shrink-0"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                <span>تعبئة ذكية</span>
              </button>
            </div>

            {/* Quick Helper Chips */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-1.5 text-[11px] text-white/50 font-medium">
                <Tag className="w-3 h-3 text-[#00A3E0]" />
                <span>أمثلة سريعة للتجربة بلمسة واحدة:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isProcessing}
                    onClick={() => {
                      setInput(prompt);
                      processInput(prompt);
                    }}
                    className="text-left rtl:text-right px-2.5 py-1 rounded-lg text-[11px] bg-white/5 hover:bg-[#00A3E0]/20 hover:text-[#8be3ff] text-white/70 border border-white/5 hover:border-[#00A3E0]/40 transition-all truncate max-w-full"
                  >
                    💡 {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Extracted Preview */}
            <AnimatePresence>
              {lastExtracted && Object.keys(lastExtracted).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl bg-[#00A3E0]/10 border border-[#00A3E0]/30 p-3 text-xs"
                >
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تم استخراج وتعبئة الحقول التالية بنجاح في النموذج:</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(lastExtracted).map(([k, v]) => (
                      <div key={k} className="p-1.5 rounded-lg bg-black/30 border border-white/5">
                        <span className="text-[10px] text-white/40 block uppercase">{k}</span>
                        <span className="text-white font-semibold truncate block">
                          {String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer Notice */}
            <p className="text-[10px] text-white/35 text-center font-medium pt-1">
              مدعوم بمحرك QMS 4.0 Industrial NLP للتعرف على العيوب والمواصفات الصناعية
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
export default SmartFormCopilot;
