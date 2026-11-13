import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ChevronDown, 
  BrainCircuit,
  Mic, 
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  Key,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { useVoiceCommand } from '../hooks/useVoiceCommand';
import { askQualityCopilot, type CopilotAction } from '../services/copilotEngine';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  actions?: CopilotAction[];
  model?: string;
}

export function AICopilotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('qms_gemini_api_key') || '');
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      type: 'ai',
      content: 'أهلاً بك! أنا **QualityOps Pro 5.0**، مستشارك الذكي للجودة الصناعية ومعايير ISO. كيف يمكنني مساعدتك اليوم؟',
      timestamp: new Date(),
      suggestions: [
        '⚡ فتح الترسانة الصناعية الفائقة',
        '🔴 كيف أتعامل مع عيب على الخط؟',
        '📊 احسب مؤشر القدرة Cpk',
        '📖 فتح دليل التشغيل المرجعي SOP'
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Voice Command Hook Integration
  const { isListening, transcript, toggleListening, isSupported, stopListening } = useVoiceCommand((text) => {
    setIsOpen(true);
    setInput(text);
    setTimeout(() => {
      handleSendWithText(text);
    }, 150);
  });

  // Listen to global open-ai-copilot events from the Header
  useEffect(() => {
    const handleGlobalVoiceEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ text?: string }>;
      if (customEvent.detail && customEvent.detail.text) {
        setIsOpen(true);
        const text = customEvent.detail.text;
        setInput(text);
        setTimeout(() => {
          handleSendWithText(text);
        }, 150);
      }
    };
    window.addEventListener('open-ai-copilot', handleGlobalVoiceEvent);
    return () => window.removeEventListener('open-ai-copilot', handleGlobalVoiceEvent);
  }, []);

  // Update input text with transcript
  useEffect(() => {
    if (isListening && transcript) {
      setInput(transcript);
    }
  }, [transcript, isListening]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Context-aware greeting based on route changes
  useEffect(() => {
    if (!isOpen) return;

    let contextGreeting = '';
    const path = location.pathname;

    if (path.includes('superpowers')) {
      contextGreeting = 'أنت الآن في **الترسانة الصناعية الفائقة (Superpowers 5.0)**! يمكنك تجربة المساعد الصوتي، معركة تدقيق الآيزو مع د. كلاوس، أو ماسح العيوب البصري الذكي.';
    } else if (path.includes('ncr')) {
      contextGreeting = 'أنت في سجل **حالات عدم المطابقة (NCR)**. هل ترغب في صياغة تقرير عزل فوري أو الاستعلام عن أحدث العيوب المتكررة؟';
    } else if (path.includes('capa')) {
      contextGreeting = 'أنت في شاشة **الإجراءات التصحيحية (CAPA)**. هل تحتاج إلى مساعدتي في صياغة تحليل السبب الجذري بنظام 5-Why أو عظمة السمكة؟';
    } else if (path.includes('spc')) {
      contextGreeting = 'أنت في لوحة **الضبط الإحصائي للعمليات (SPC)**. هل ترغب في فحص شروط الاستقرار الإحصائي وحساب مؤشرات Cp / Cpk؟';
    } else if (path.includes('calibration')) {
      contextGreeting = 'أنت في قسم **أجهزة القياس والمعايرة (ISO 7.1.5)**. هل تريد استخراج قائمة الأجهزة التي اقتربت معايرتها أو إصدار ملصق فحص؟';
    }

    if (contextGreeting) {
      const hasSentContext = messages.some(m => m.content === contextGreeting);
      if (!hasSentContext) {
        setIsTyping(true);
        const timer = setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'ai',
            content: contextGreeting,
            timestamp: new Date()
          }]);
          setIsTyping(false);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, location.pathname]);

  const handleSendWithText = async (textToSend: string) => {
    if (!textToSend.trim() || isTyping) return;

    if (isListening) stopListening();

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await askQualityCopilot(textToSend, {
        pathname: location.pathname
      });

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions,
        actions: response.actions,
        model: response.metadata.model
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: 'عذراً، حدث خطأ أثناء معالجة الطلب. يرجى المحاولة مرة أخرى.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => handleSendWithText(input);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleActionClick = (action: CopilotAction) => {
    if (action.type === 'external') {
      window.open(action.target, '_blank');
    } else if (action.type === 'navigate') {
      navigate(action.target);
    }
  };

  const speakText = (text: string, id: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeakingId === id) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown formatting for speech
    const plainText = text
      .replace(/[#*`_~[\]]/g, '')
      .replace(/\$\$[\s\S]*?\$\$/g, '')
      .replace(/\$[^$]*\$/g, '');

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = 'ar-SA';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
    if (arabicVoice) utterance.voice = arabicVoice;

    utterance.onend = () => setIsSpeakingId(null);
    utterance.onerror = () => setIsSpeakingId(null);

    setIsSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const saveApiKey = (key: string) => {
    const clean = key.trim();
    setGeminiApiKey(clean);
    if (clean) {
      localStorage.setItem('qms_gemini_api_key', clean);
    } else {
      localStorage.removeItem('qms_gemini_api_key');
    }
    setShowSettings(false);
  };

  return (
    <>
      {/* Floating Orb Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[100]"
          >
            <button
              onClick={() => setIsOpen(true)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="relative group flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#00A3E0] to-[#007BB5] text-white shadow-[0_0_20px_rgba(0,163,224,0.4)] hover:shadow-[0_0_30px_rgba(0,163,224,0.6)] transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-[#00A3E0]" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-0 rounded-full animate-ping opacity-10 bg-white" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
              
              <Bot className={`w-8 h-8 transition-transform duration-500 ${isHovered ? 'scale-110 rotate-12' : ''}`} />
              
              <div className="absolute right-full mr-4 px-3 py-1.5 bg-slate-900/90 backdrop-blur-sm text-white text-sm font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                QualityOps Pro Copilot 5.0
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(5px)' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-6 right-6 z-[100] w-[420px] sm:w-[460px] max-w-[calc(100vw-2rem)] h-[650px] max-h-[calc(100vh-5rem)] bg-white/95 dark:bg-[#0A1A2F]/95 backdrop-blur-2xl rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.25)] border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden text-right"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-l from-[#00A3E0]/15 via-slate-100/50 to-transparent dark:from-[#00A3E0]/20 dark:via-white/5 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00A3E0] to-[#007BB5] flex items-center justify-center shadow-lg text-white">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0A1A2F]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white leading-none text-[15px]">QualityOps Pro</h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#00A3E0]/20 text-[#00A3E0]">v5.0</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                    <Sparkles className="w-3 h-3 text-[#00A3E0]" />
                    {geminiApiKey ? 'Gemini 1.5 Pro Live Active' : 'Industrial Neural Brain Active'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  title="إعدادات الذكاء الاصطناعي ومفتاح Gemini API"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-[#00A3E0] hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Settings Overlay */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-white/10 p-4 space-y-3"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Key className="w-3.5 h-3.5 text-[#00A3E0]" />
                    <span>ربط مفتاح Google Gemini API المباشر (اختياري)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    يمكنك إدخال مفتاح Gemini الخاص بك لتفعيل الاتصال السحابي المباشر، أو تركه فارغاً للاعتماد على العقل العصبي الصناعي الداخلي بدون إنترنت.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      defaultValue={geminiApiKey}
                      id="gemini-key-input"
                      className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <button
                      onClick={() => {
                        const inputEl = document.getElementById('gemini-key-input') as HTMLInputElement;
                        saveApiKey(inputEl ? inputEl.value : '');
                      }}
                      className="px-3 py-1.5 text-xs bg-[#00A3E0] text-white rounded-lg font-medium hover:bg-[#008AC0] transition-colors"
                    >
                      حفظ
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-sm">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.type === 'user' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`flex max-w-[92%] gap-2 ${msg.type === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
                    {/* Avatar */}
                    {msg.type === 'ai' && (
                      <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-[#00A3E0]/20 to-[#007BB5]/20 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-[#00A3E0]" />
                      </div>
                    )}
                    
                    {/* Message Bubble */}
                    <div className="space-y-2">
                      <div 
                        className={`px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed shadow-sm ${
                          msg.type === 'user' 
                            ? 'bg-gradient-to-br from-[#00A3E0] to-[#007BB5] text-white rounded-tl-sm' 
                            : 'bg-white dark:bg-white/5 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/5 rounded-tr-sm'
                        }`}
                      >
                        {/* Formatted Markdown Content */}
                        <div className="whitespace-pre-line space-y-1">
                          {msg.content}
                        </div>

                        {/* Speech and Copy Bar for AI */}
                        {msg.type === 'ai' && (
                          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {msg.model || 'QualityOps Brain'}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => speakText(msg.content, msg.id)}
                                title={isSpeakingId === msg.id ? 'إيقاف الصوت' : 'استماع صوتي للإجابة'}
                                className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 transition-colors ${
                                  isSpeakingId === msg.id ? 'text-[#00A3E0] animate-pulse' : 'text-slate-400 hover:text-slate-600'
                                }`}
                              >
                                {isSpeakingId === msg.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => copyToClipboard(msg.content, msg.id)}
                                title="نسخ النص"
                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-600"
                              >
                                {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Direct Navigation Actions */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {msg.actions.map((act, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleActionClick(act)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#00A3E0]/15 to-[#007BB5]/15 text-[#00A3E0] hover:from-[#00A3E0]/25 hover:to-[#007BB5]/25 border border-[#00A3E0]/30 transition-all shadow-sm"
                            >
                              <span>{act.label}</span>
                              {act.type === 'external' ? <ExternalLink className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Interactive Suggestion Chips */}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {msg.suggestions.map((sug, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => handleSendWithText(sug)}
                              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-[#00A3E0]/10 hover:text-[#00A3E0] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-colors"
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end"
                >
                  <div className="flex max-w-[85%] gap-2 flex-row-reverse">
                    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-[#00A3E0]/20 to-[#007BB5]/20 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-[#00A3E0]" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-tr-sm flex items-center gap-1.5">
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-[#00A3E0]" />
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-[#00A3E0]" />
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-[#00A3E0]" />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-white/10">
              <div className="flex items-end gap-2 bg-white dark:bg-[#0f131a] rounded-xl border border-slate-200 dark:border-white/10 p-2 focus-within:border-[#00A3E0] dark:focus-within:border-[#00A3E0] focus-within:ring-1 focus-within:ring-[#00A3E0]/20 transition-all duration-300">
                <button 
                  onClick={() => handleSendWithText('لخص لي حالة الجودة الحالية في المنصة وأبرز أولويات العمل')}
                  title="تحديث وتلخيص الأولويات"
                  className="p-2 text-slate-400 hover:text-[#00A3E0] transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                
                {isSupported && (
                  <button 
                    onClick={toggleListening}
                    title={isListening ? 'إيقاف الاستماع' : 'تحدث صوتياً'}
                    className={`p-2 transition-colors rounded-lg ${
                      isListening 
                        ? 'text-red-500 bg-red-100 dark:bg-red-500/20 animate-pulse' 
                        : 'text-slate-400 hover:text-[#00A3E0] hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>
                )}

                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening ? 'جاري الاستماع لصوتك...' : 'اسأل عن ISO 9001، الـ CAPA، Cpk، أو أي عيب...'}
                  className="flex-1 max-h-28 min-h-[38px] bg-transparent border-none resize-none focus:ring-0 text-xs py-2 px-2 text-slate-900 dark:text-white"
                  rows={1}
                  dir="auto"
                />

                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className={`p-2 rounded-xl flex-shrink-0 transition-all duration-300 ${
                    input.trim() && !isTyping
                      ? 'bg-[#00A3E0] text-white shadow-md hover:bg-[#008AC0] hover:shadow-lg' 
                      : 'bg-slate-200 dark:bg-white/5 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4 rotate-180" />
                </button>
              </div>

              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-[#00A3E0]" />
                  نظام ذكاء اصطناعي صناعي مدرب على معايير الجودة 4.0
                </span>
                <span>Enter للإرسال</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
