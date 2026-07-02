import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Type definitions for Web Speech API
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: (event: Event) => void;
  onstart: (event: Event) => void;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

// ----------------------------------------------------
// Intent Mapping
// ----------------------------------------------------
const NAVIGATION_INTENTS = [
  { keywords: ['لوحة القيادة', 'الرئيسية', 'dashboard', 'home', 'الداش بورد'], path: '/quality', label: 'لوحة القيادة' },
  { keywords: ['شكاوى', 'شكاوي', 'complaint', 'العملاء'], path: '/quality/records/complaints', label: 'الشكاوى' },
  { keywords: ['عدم مطابقة', 'ncr', 'ان سي ار', 'رفض'], path: '/quality/records/ncr', label: 'سجلات NCR' },
  { keywords: ['تصحيحية', 'وقائية', 'capa', 'كابا'], path: '/quality/records/capa', label: 'سجلات CAPA' },
  { keywords: ['توأم رقمي', 'digital twin', 'المصنع', 'خريطة'], path: '/digital-twin', label: 'التوأم الرقمي' },
  { keywords: ['تصميم', 'layout', 'تخطيط'], path: '/production-layout', label: 'مخطط الإنتاج' },
  { keywords: ['فحص', 'تفتيش', 'inspection'], path: '/quality/records/inspection', label: 'عمليات الفحص' },
  { keywords: ['موردين', 'مورد', 'supplier'], path: '/quality/records/supplier', label: 'جودة الموردين' },
  { keywords: ['ماستر داتا', 'البيانات الأساسية', 'master data'], path: '/quality/master-data', label: 'البيانات الأساسية' },
  { keywords: ['شات', 'مساعد', 'ai chat', 'اسأل', 'اسال'], path: '/ai-chat', label: 'المساعد الذكي' },
  { keywords: ['ادمن', 'إدارة', 'admin'], path: '/admin', label: 'لوحة التحكم' },
];

export function useVoiceCommand(onChatIntent?: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      const recog = new SpeechRecognitionAPI();
      recog.continuous = false;
      recog.interimResults = true;
      // Use Arabic by default, but English commands will still be picked up decently
      recog.lang = 'ar-EG';
      
      setRecognition(recog);
    } else {
      console.warn('SpeechRecognition API not supported in this browser.');
    }
  }, []);

  useEffect(() => {
    if (!recognition) return;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onend = () => {
      setIsListening(false);
      // When recognition ends, we check the final transcript
      setTranscript((prev) => {
        if (prev.trim()) {
          parseIntent(prev.trim().toLowerCase());
        }
        return ''; // Clear it out after parsing
      });
    };
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      if (event.error !== 'no-speech') {
        toast.error('Voice Recognition Error', { description: event.error });
      }
    };
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recognition, navigate]); // Intentionally omitting parseIntent from deps to avoid stale closure issues

  const parseIntent = useCallback((text: string) => {
    if (!text) return;

    // Check Navigation
    for (const intent of NAVIGATION_INTENTS) {
      if (intent.keywords.some(keyword => text.includes(keyword))) {
        toast.success(`أوامر صوتية: فتح ${intent.label}`);
        navigate(intent.path);
        return;
      }
    }

    // If it mentions opening a form, we could handle it. But for now, fallback to AI Chat
    if (onChatIntent) {
      onChatIntent(text);
    } else {
      toast.info('أوامر صوتية (محادثة)', { description: `لقد قلت: "${text}"` });
      // Dispatch a global event so the Copilot widget can open and receive the text!
      const event = new CustomEvent('open-ai-copilot', { detail: { text } });
      window.dispatchEvent(event);
    }
  }, [navigate, onChatIntent]);

  const startListening = useCallback(() => {
    if (recognition) {
      try {
        setTranscript('');
        recognition.start();
      } catch (e) {
        // Already started
      }
    } else {
      toast.error('Voice not supported', { description: 'Please use Chrome, Edge, or Safari.' });
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
    }
  }, [recognition]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    toggleListening,
    isSupported: !!recognition
  };
}
