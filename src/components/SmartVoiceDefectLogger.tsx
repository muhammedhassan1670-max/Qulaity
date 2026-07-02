import { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic, MicOff, Globe, BrainCircuit, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadQualityMasterTable, type QualityMasterRecord } from '@/services/qualityMasterData';

export interface ParsedDefectData {
  defectType?: string;
  quantity?: number;
  shift?: string;
  productionLine?: string;
  partId?: string;
  severity?: string;
  isSkipCommand?: boolean;
}

interface SmartVoiceDefectLoggerProps {
  onParsedData: (data: ParsedDefectData) => void;
  language?: string;
  handsFreeMode?: boolean;
  onSaveRequested?: () => void;
}

export function SmartVoiceDefectLogger({ 
  onParsedData, 
  language: initialLanguage = 'ar-SA',
  handsFreeMode = false,
  onSaveRequested 
}: SmartVoiceDefectLoggerProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState<'en-US' | 'ar-SA'>(initialLanguage as 'en-US' | 'ar-SA');
  const [currentDraft, setCurrentDraft] = useState<ParsedDefectData>({});
  const [lastParsed, setLastParsed] = useState<ParsedDefectData | null>(null);
  const [aiMessage, setAiMessage] = useState<string>('');
  
  // Master Data State
  const [masterDefects, setMasterDefects] = useState<QualityMasterRecord[]>([]);
  const [masterLines, setMasterLines] = useState<QualityMasterRecord[]>([]);
  const [masterParts, setMasterParts] = useState<QualityMasterRecord[]>([]);
  
  const recognitionRef = useRef<any>(null);

  // Load Master Data on mount
  useEffect(() => {
    setMasterDefects(loadQualityMasterTable('defects'));
    setMasterLines(loadQualityMasterTable('lines'));
    setMasterParts(loadQualityMasterTable('parts'));
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      // Always use continuous mode so the microphone doesn't cut off if the user pauses for a second
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        
        if (handsFreeMode && event.results[event.results.length - 1].isFinal) {
           processTranscript(currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error !== 'no-speech' && !handsFreeMode) {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (handsFreeMode && !isProcessing) {
          try { recognition.start(); } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
    }
  }, [language, handsFreeMode]);

  const parseTranscript = (text: string) => {
    const data: ParsedDefectData = {};
    const lowerText = text.toLowerCase();

    // Convert Arabic numerals to English numerals for easier parsing
    const normalizedText = lowerText.replace(/[٠-٩]/g, d => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);

    const skipKeywords = ['skip', 'none', 'تخطي', 'لا أعرف', 'مش عارف', 'لا يوجد', 'معرفش'];
    const isSkip = skipKeywords.some(kw => normalizedText.includes(kw));
    
    if (isSkip) {
      data.isSkipCommand = true;
    }

    const fuzzyMatch = (transcript: string, masterValue: unknown): boolean => {
      if (!masterValue) return false;
      const cleanMaster = String(masterValue).toLowerCase().replace(/[(),/\\-]/g, ' ');
      const masterWords = cleanMaster.split(/\s+/).filter(w => w.length > 2);
      
      if (cleanMaster.trim() && transcript.includes(cleanMaster.trim())) return true;
      
      for (const word of masterWords) {
        if (transcript.includes(word)) return true;
      }
      return false;
    };

    // Match numbers in the normalized text (without \b as it can break with Arabic letters)
    // We also handle Arabic written numbers
    const arabicNumbersMap: Record<string, number> = {
      'واحد': 1, 'واحده': 1, 'واحدة': 1,
      'اثنين': 2, 'اتنين': 2, 'اثنان': 2, 'جوز': 2,
      'ثلاثه': 3, 'ثلاثة': 3, 'تلاته': 3, 'تلاتة': 3, 'ثلاث': 3, 'تلات': 3,
      'اربع': 4, 'اربعة': 4, 'أربعه': 4, 'أربعة': 4,
      'خمس': 5, 'خمسه': 5, 'خمسة': 5,
      'ست': 6, 'سته': 6, 'ستة': 6,
      'سبع': 7, 'سبعه': 7, 'سبعة': 7,
      'ثمان': 8, 'ثمانيه': 8, 'ثمانية': 8, 'تمانيه': 8, 'تمانية': 8,
      'تسع': 9, 'تسعه': 9, 'تسعة': 9,
      'عشر': 10, 'عشره': 10, 'عشرة': 10
    };

    const numberMatch = normalizedText.match(/(?:^|\s)(\d+)(?:\s|$)/);
    if (numberMatch) {
      data.quantity = parseInt(numberMatch[1], 10);
    } else {
      // Check Arabic written numbers (full coverage including Egyptian dialect)
      for (const [word, num] of Object.entries(arabicNumbersMap)) {
         if (normalizedText.includes(word)) {
            data.quantity = num;
            break;
         }
      }
      // Check English written numbers if still not found
      if (!data.quantity) {
        const englishNumbers: Record<string, number> = { 
          'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 
          'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10 
        };
        for (const [word, num] of Object.entries(englishNumbers)) {
          if (normalizedText.includes(word)) {
            data.quantity = num;
            break;
          }
        }
      }
    }

    if (normalizedText.includes('morning') || normalizedText.includes('صباح')) data.shift = 'morning';
    else if (normalizedText.includes('afternoon') || normalizedText.includes('مساء')) data.shift = 'afternoon';
    else if (normalizedText.includes('night') || normalizedText.includes('ليل')) data.shift = 'night';

    let matchedLine = false;
    for (const line of masterLines) {
      if (
         fuzzyMatch(normalizedText, line.productionLine) || 
         fuzzyMatch(normalizedText, line.arabicName) ||
         fuzzyMatch(normalizedText, line.lineCode) ||
         fuzzyMatch(normalizedText, line.aliases)
      ) {
         data.productionLine = String(line.productionLine);
         matchedLine = true;
         break;
      }
    }
    
    if (!matchedLine) {
      const lineMatch = normalizedText.match(/line\s+([a-z0-9]+)/);
      const arabicLineMatch = normalizedText.match(/خط\s+([a-z0-9أ-ي]+)/);
      
      if (lineMatch) data.productionLine = `Line ${lineMatch[1].toUpperCase()}`;
      else if (arabicLineMatch) data.productionLine = `Line ${arabicLineMatch[1].toUpperCase()}`;
    }

    if (normalizedText.includes('critical') || normalizedText.includes('major') || normalizedText.includes('broken') || normalizedText.includes('حرج') || normalizedText.includes('كبير') || normalizedText.includes('مكسور')) {
      data.severity = 'critical';
    } else if (normalizedText.includes('minor') || normalizedText.includes('scratch') || normalizedText.includes('بسيط') || normalizedText.includes('خدش')) {
      data.severity = 'minor';
    }

    let matchedDefect = false;
    for (const defect of masterDefects) {
      if (
         fuzzyMatch(normalizedText, defect.defectType) ||
         fuzzyMatch(normalizedText, defect.arabicName) ||
         fuzzyMatch(normalizedText, defect.aliases)
      ) {
         data.defectType = String(defect.defectType);
         matchedDefect = true;
         break;
      }
    }

    if (!matchedDefect) {
      const defectKeywords = ['scratch', 'scratches', 'dent', 'dents', 'broken', 'crack', 'cracked', 'leak', 'leaking', 'missing', 'bent'];
      const arabicDefectKeywords: Record<string, string> = {
        'خدش': 'Scratch', 'خدوش': 'Scratch', 'كسر': 'Broken', 'مكسور': 'Broken', 
        'تسريب': 'Leak', 'تسرب': 'Leak', 'نقص': 'Missing', 'ناقص': 'Missing', 'انبعاج': 'Dent', 'طعجة': 'Dent'
      };
      for (const kw of defectKeywords) {
        if (normalizedText.includes(kw)) {
          data.defectType = kw.charAt(0).toUpperCase() + kw.slice(1);
          break;
        }
      }
      if (!data.defectType) {
        for (const [kw, englishKw] of Object.entries(arabicDefectKeywords)) {
          if (normalizedText.includes(kw)) {
            data.defectType = englishKw;
            break;
          }
        }
      }
    }
    
    if (!data.defectType && data.quantity && numberMatch) {
        const words = normalizedText.split(' ');
        const numIndex = words.findIndex(w => w === numberMatch[1]);
        if (numIndex !== -1 && numIndex + 1 < words.length) {
             data.defectType = words[numIndex + 1].charAt(0).toUpperCase() + words[numIndex + 1].slice(1);
        }
    }

    let matchedPart = false;
    for (const part of masterParts) {
      if (
         fuzzyMatch(normalizedText, part.partNumber) || 
         fuzzyMatch(normalizedText, part.partName) ||
         fuzzyMatch(normalizedText, part.arabicName) ||
         fuzzyMatch(normalizedText, part.aliases)
      ) {
         data.partId = String(part.partNumber);
         matchedPart = true;
         break;
      }
    }

    if (!matchedPart) {
      const partMatch = normalizedText.match(/part\s+([a-z0-9]+)/);
      const arabicPartMatch = normalizedText.match(/(?:قطعة|كود)(?:\s+رقم)?\s+([a-z0-9]+)/);
      if (partMatch) data.partId = partMatch[1].toUpperCase();
      else if (arabicPartMatch) data.partId = arabicPartMatch[1].toUpperCase();
    }

    return data;
  };

  const processTranscript = (currentText: string) => {
    if (!currentText.trim()) return;
    
    const lowerText = currentText.toLowerCase();
    const wakeWords = ['تسجيل عيب', 'تسجيل العيب', 'يا جودة', 'qms', 'record defect', 'تسجيل', 'يلا'];
    const hasWakeWord = wakeWords.some(ww => lowerText.includes(ww));
    
    const isNewDraft = Object.keys(currentDraft).length === 0;
    
    // In hands-free mode, if it's a new draft, we MUST hear a wake word to start processing
    if (handsFreeMode && isNewDraft && !hasWakeWord) {
       return;
    }

    if (recognitionRef.current && !handsFreeMode) {
       recognitionRef.current.stop();
       setIsListening(false);
    }
    
    setIsProcessing(true);
    
    setTimeout(() => {
      const newlyParsed = parseTranscript(currentText);
      let updatedDraft = { ...currentDraft, ...newlyParsed };

      if (newlyParsed.isSkipCommand) {
           if (!updatedDraft.defectType) updatedDraft.defectType = 'Unknown Defect';
           else if (!updatedDraft.quantity) updatedDraft.quantity = 1;
           else if (!updatedDraft.productionLine) updatedDraft.productionLine = 'Unknown Line';
           else if (!updatedDraft.partId) updatedDraft.partId = 'Unknown Part';
           else if (!updatedDraft.shift) updatedDraft.shift = 'Unknown Shift';
           delete updatedDraft.isSkipCommand;
        }

        setCurrentDraft(updatedDraft);
        setLastParsed(updatedDraft);
        setIsProcessing(false);

        let missingFieldMessage = '';
        let shouldContinueListening = false;

        if (!updatedDraft.defectType) {
           missingFieldMessage = language === 'ar-SA' ? 'ما هو نوع العيب الذي وجدته؟' : 'What is the defect type?';
           shouldContinueListening = true;
        } else if (!updatedDraft.quantity) {
           missingFieldMessage = language === 'ar-SA' ? 'كم عدد العيوب التي وجدتها؟' : 'What is the quantity of the defects?';
           shouldContinueListening = true;
        } else if (!updatedDraft.productionLine) {
           missingFieldMessage = language === 'ar-SA' ? 'في أي خط إنتاج تم العثور على العيب؟' : 'On which production line did you find this?';
           shouldContinueListening = true;
        } else if (!updatedDraft.partId) {
           missingFieldMessage = language === 'ar-SA' ? 'ما هو كود القطعة أو المنتج المعيب؟' : 'What is the part number or product?';
           shouldContinueListening = true;
        } else if (!updatedDraft.shift) {
           missingFieldMessage = language === 'ar-SA' ? 'في أي وردية تم التسجيل؟' : 'Which shift is this?';
           shouldContinueListening = true;
        }

        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance();
          utterance.lang = language;
          
          if (shouldContinueListening) {
             utterance.text = missingFieldMessage;
             setAiMessage(missingFieldMessage);
             utterance.onend = () => {
                if (recognitionRef.current && handsFreeMode) {
                  try { recognitionRef.current.start(); } catch (e) {}
                }
             };
          } else {
            let responseText = language === 'ar-SA' ? 'ممتاز، تم اكتمال البيانات. ' : 'Excellent, data is complete. ';
            responseText += language === 'ar-SA' 
                 ? `تم تسجيل ${updatedDraft.quantity} ${updatedDraft.defectType} في ${updatedDraft.productionLine?.replace('Line', 'خط')}`
                 : `Logged ${updatedDraft.quantity} ${updatedDraft.defectType} on ${updatedDraft.productionLine}`;
            
            if (handsFreeMode && onSaveRequested) {
               responseText += language === 'ar-SA' ? ' جاري الحفظ أوتوماتيكياً.' : ' Auto-saving now.';
            }

            utterance.text = responseText;
            setAiMessage(responseText);
            onParsedData(updatedDraft);
            
            if (handsFreeMode && onSaveRequested) {
               setTimeout(() => onSaveRequested(), 1000);
            }

            setCurrentDraft({});
            setTranscript('');
            
            if (handsFreeMode) {
               utterance.onend = () => {
                  try { recognitionRef.current?.start(); } catch (e) {}
               };
            }
          }
          window.speechSynthesis.speak(utterance);
        } else {
          onParsedData(updatedDraft);
          if (handsFreeMode && !shouldContinueListening && onSaveRequested) {
             setTimeout(() => onSaveRequested(), 500);
          }
          if (!shouldContinueListening) {
             setCurrentDraft({});
             setTranscript('');
          }
        }
      }, 500);
  };

  const handleToggleListen = () => {
    if (!recognitionRef.current) {
      alert("Browser not supported. Please use Google Chrome.");
      return;
    }
    if (isListening) {
       if (handsFreeMode) {
          recognitionRef.current.stop();
          setIsListening(false);
       } else {
          processTranscript(transcript);
       }
    } else {
       setAiMessage('');
       setTranscript(''); // Clear old transcript when starting
       try { recognitionRef.current.start(); } catch (e) {}
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#00A3E0]/30 bg-gradient-to-br from-[#00A3E0]/10 to-transparent p-3 sm:p-5 w-full">
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-[#00A3E0]/20 rounded-3xl"
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col items-center justify-center space-y-2 sm:space-y-3 w-full">
        
        <div className="flex w-full items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-[#00A3E0] font-black uppercase tracking-widest text-xs">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{language === 'ar-SA' ? 'المسجل الصوتي الذكي' : 'Voice AI'}</span>
          </div>
          <button 
            onClick={() => setLanguage(l => l === 'ar-SA' ? 'en-US' : 'ar-SA')}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs font-bold text-white/70 shrink-0"
          >
            <Globe className="w-3 h-3" />
            {language === 'ar-SA' ? 'عربي' : 'EN'}
          </button>
        </div>

        <div className="flex items-center justify-between w-full flex-wrap gap-1">
          <div className="flex items-center gap-1.5">
            <BrainCircuit className="w-4 h-4 text-indigo-400 shrink-0" />
            <h3 className="text-xs font-semibold text-white">Q-Elite Voice Copilot</h3>
          </div>
          {handsFreeMode && (
             <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 text-xs font-medium border border-green-500/30 animate-pulse flex items-center gap-1 shrink-0">
               <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
               Hands-Free
             </span>
          )}
        </div>

        <button
          onClick={handleToggleListen}
          className={`relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full transition-all duration-300 shadow-[0_0_30px_rgba(0,163,224,0.3)] ${
            isListening ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_40px_rgba(239,68,68,0.5)] scale-110' : 'bg-[#00A3E0] hover:bg-[#00A3E0]/80'
          }`}
        >
          {isProcessing ? (
            <BrainCircuit className="w-7 h-7 sm:w-9 sm:h-9 text-white animate-pulse" />
          ) : isListening ? (
             <MicOff className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
          ) : (
            <Mic className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
          )}
        </button>

        <div className="text-center min-h-[3rem] w-full">
          {aiMessage ? (
             <div className="flex flex-col items-center gap-1">
                <span className="text-xs sm:text-sm font-bold text-amber-300 animate-pulse bg-black/40 px-3 py-2 rounded-xl leading-snug break-words" dir={language === 'ar-SA' ? 'rtl' : 'ltr'}>
                  🤖 {aiMessage}
                </span>
             </div>
          ) : isProcessing ? (
             <div className="flex flex-col items-center gap-2 text-[#00A3E0]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs font-bold animate-pulse">{language === 'ar-SA' ? 'جاري استخراج البيانات...' : 'Extracting...'}</span>
             </div>
          ) : isListening ? (
             <p className="text-sm font-medium text-white/90 italic px-1 break-words" dir={language === 'ar-SA' ? 'rtl' : 'ltr'}>"{transcript || (language === 'ar-SA' ? 'استمع إليك...' : 'Listening...')}"</p>
          ) : (
            <p className="text-xs font-medium text-white/50 px-1 leading-relaxed" dir={language === 'ar-SA' ? 'rtl' : 'ltr'}>
             {handsFreeMode 
                ? (language === 'ar-SA' ? 'قل "تسجيل عيب" للبدء' : 'Say "record defect" to start')
                : (language === 'ar-SA' ? 'اضغط وتكلم. مثال: "يوجد خدش في خط أ"' : 'Tap & speak. e.g. "scratch on line A"')
             }
          </p>
          )}
        </div>

        <AnimatePresence>
          {lastParsed && Object.keys(lastParsed).length > 0 && !isListening && !isProcessing && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-wrap justify-center gap-2 pt-4 border-t border-white/10 w-full"
            >
              {lastParsed.defectType && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-200 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Defect: {lastParsed.defectType}
                </div>
              )}
              {lastParsed.quantity && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-200 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Qty: {lastParsed.quantity}
                </div>
              )}
              {lastParsed.shift && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Shift: {lastParsed.shift}
                </div>
              )}
              {lastParsed.productionLine && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-200 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Line: {lastParsed.productionLine}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
