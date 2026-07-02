import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Paperclip, 
  ChevronDown, 
  BrainCircuit,
  Mic,
  MicOff
} from 'lucide-react';
import { useVoiceCommand } from '../hooks/useVoiceCommand';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
}

export function AICopilotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'أهلاً بك! أنا QualityOps Pro. كيف يمكنني مساعدتك اليوم؟',
      timestamp: new Date(),
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Voice Command Hook Integration
  const { isListening, transcript, toggleListening, isSupported, stopListening } = useVoiceCommand((text) => {
    // If voice hook sends a direct chat intent
    setIsOpen(true);
    setInput(text);
    // Auto-send after a tiny delay
    setTimeout(() => {
      handleSendWithText(text);
    }, 100);
  });

  // Listen to global open-ai-copilot events from the Header hook
  useEffect(() => {
    const handleGlobalVoiceEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.text) {
        setIsOpen(true);
        const text = customEvent.detail.text;
        setInput(text);
        // Auto-send
        setTimeout(() => {
          handleSendWithText(text);
        }, 100);
      }
    };
    window.addEventListener('open-ai-copilot', handleGlobalVoiceEvent);
    return () => window.removeEventListener('open-ai-copilot', handleGlobalVoiceEvent);
  }, []);

  // Update input text with transcript when listening from inside the chat widget
  useEffect(() => {
    if (isListening && transcript) {
      setInput(transcript);
    }
  }, [transcript, isListening]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Context-aware greeting based on route
  useEffect(() => {
    if (!isOpen) return;

    let contextGreeting = '';
    const path = location.pathname;

    if (path.includes('ncr')) {
      contextGreeting = 'أرى أنك في شاشة تقارير عدم المطابقة (NCR). هل تريد مني تحليل الاتجاهات الأخيرة أو المساعدة في صياغة تقرير؟';
    } else if (path.includes('capa')) {
      contextGreeting = 'أنت الآن في شاشة الإجراءات التصحيحية (CAPA). هل تحتاج مساعدة في تحديد السبب الجذري (Root Cause)؟';
    } else if (path.includes('dashboard')) {
      contextGreeting = 'نظرة عامة ممتازة! هل تريدني أن ألخص لك أهم مؤشرات الأداء (KPIs) التي تحتاج لتدخل سريع؟';
    } else if (path.includes('inspection')) {
      contextGreeting = 'في شاشة الفحص، يمكنني مساعدتك في مراجعة معايير القبول والرفض (AQL).';
    }

    if (contextGreeting) {
      // Check if we already sent this contextual greeting recently
      const hasSentContext = messages.some(m => m.content === contextGreeting);
      if (!hasSentContext) {
        setIsTyping(true);
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'ai',
            content: contextGreeting,
            timestamp: new Date()
          }]);
          setIsTyping(false);
        }, 1500);
      }
    }
  }, [isOpen, location.pathname]); // Removed messages from dep to avoid infinite loops

  const handleSendWithText = (textToSend: string) => {
    if (!textToSend.trim()) return;

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

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `لقد قمت بتحليل طلبك: "${userMessage.content}". سأقوم بتنفيذ الإجراء المطلوب وتحديث البيانات المعنية في النظام فوراً. هل هناك تفاصيل أخرى تود إضافتها؟`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const handleSend = () => handleSendWithText(input);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
              {/* Outer pulsing rings */}
              <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-[#00A3E0]" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-0 rounded-full animate-ping opacity-10 bg-white" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
              
              <Bot className={`w-8 h-8 transition-transform duration-500 ${isHovered ? 'scale-110 rotate-12' : ''}`} />
              
              {/* Tooltip */}
              <div className="absolute right-full mr-4 px-3 py-1.5 bg-slate-900/90 backdrop-blur-sm text-white text-sm font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                QualityOps Pro Copilot
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
            className="fixed bottom-6 right-6 z-[100] w-[380px] sm:w-[420px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-6rem)] bg-white/90 dark:bg-[#0A1A2F]/90 backdrop-blur-2xl rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.15)] dark:shadow-[0_0_40px_rgba(0,163,224,0.15)] border border-white/20 dark:border-white/10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#00A3E0]/10 to-transparent border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00A3E0] to-[#007BB5] flex items-center justify-center shadow-lg text-white">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#0A1A2F]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white leading-none mb-1 text-[15px]">QualityOps Pro</h3>
                  <p className="text-xs text-[#00A3E0] font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI Assistant Active
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[85%] gap-2 ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    {msg.type === 'ai' && (
                      <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-[#00A3E0]/20 to-[#007BB5]/20 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-[#00A3E0]" />
                      </div>
                    )}
                    
                    {/* Message Bubble */}
                    <div 
                      className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm ${
                        msg.type === 'user' 
                          ? 'bg-gradient-to-br from-[#00A3E0] to-[#007BB5] text-white rounded-tr-sm' 
                          : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-white/5 rounded-tl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex max-w-[85%] gap-2 flex-row">
                    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-[#00A3E0]/20 to-[#007BB5]/20 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-[#00A3E0]" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-tl-sm flex items-center gap-1.5">
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-[#00A3E0]" />
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-[#00A3E0]" />
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-[#00A3E0]" />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

                {/* Input Area */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-white/10 rounded-b-2xl">
                  <div className="flex items-end gap-2 bg-white dark:bg-[#0f131a] rounded-xl border border-slate-200 dark:border-white/10 p-2 focus-within:border-[#00A3E0] dark:focus-within:border-[#00A3E0] focus-within:ring-1 focus-within:ring-[#00A3E0]/20 transition-all duration-300">
                    <button className="p-2 text-slate-400 hover:text-[#00A3E0] transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    
                    {isSupported && (
                      <button 
                        onClick={toggleListening}
                        className={`p-2 transition-colors rounded-lg ${
                          isListening 
                            ? 'text-red-500 bg-red-100 dark:bg-red-500/20 animate-pulse' 
                            : 'text-slate-400 hover:text-[#00A3E0] hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                      >
                        {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                      </button>
                    )}

                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={isListening ? 'جاري الاستماع...' : 'اكتب سؤالك هنا...'}
                      className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none resize-none focus:ring-0 text-sm py-3 px-2 text-slate-900 dark:text-white"
                      rows={1}
                      dir="auto"
                    />

                <button 
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className={`p-2.5 rounded-xl flex-shrink-0 transition-all duration-300 ${
                    input.trim() 
                      ? 'bg-[#00A3E0] text-white shadow-md hover:bg-[#008AC0] hover:shadow-lg' 
                      : 'bg-slate-200 dark:bg-white/5 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-2 text-center">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI can make mistakes. Verify important quality decisions.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
