import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Mic, Wand2, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface SmartFormCopilotProps {
  onAutoFill: (data: Record<string, any>) => void;
  fields: Array<{ name: string; label: string; type: string }>;
}

export function SmartFormCopilot({ onAutoFill, fields }: SmartFormCopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Voice Recognition setup
  useEffect(() => {
    if (!isListening) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition is not supported in this browser.');
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'ar-SA'; // Default to Arabic

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      // Auto trigger processing after speaking
      setTimeout(() => processInput(transcript), 500);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      toast.error('Voice recognition failed.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();

    return () => {
      recognition.stop();
    };
  }, [isListening]);

  const processInput = async (textToProcess: string = input) => {
    if (!textToProcess.trim()) return;

    setIsProcessing(true);
    
    // Simulate AI processing delay for premium feel
    await new Promise(resolve => setTimeout(resolve, 1500));

    const text = textToProcess.toLowerCase();
    const extractedData: Record<string, any> = {};
    
    // 1. Mock Keyword Extractor (Simulating NLP)
    fields.forEach(field => {
      const name = field.name.toLowerCase();
      const label = field.label.toLowerCase();
      
      // Simple exact match logic or generic mock
      if ((name.includes('qty') || name.includes('quantity') || label.includes('كمية')) && text.match(/\b\d+\b/)) {
        const num = text.match(/\b\d+\b/)?.[0];
        if (num) extractedData[field.name] = parseInt(num, 10);
      }
      
      if ((name.includes('type') || name.includes('defect') || label.includes('عيب')) && text.includes('خدش')) {
        extractedData[field.name] = 'خدش';
      } else if ((name.includes('type') || name.includes('defect') || label.includes('عيب')) && text.includes('كسر')) {
        extractedData[field.name] = 'كسر';
      }

      if ((name.includes('product') || name.includes('model') || label.includes('منتج')) && text.includes('x')) {
        extractedData[field.name] = 'Model X';
      }
    });

    // If we extracted something
    if (Object.keys(extractedData).length > 0) {
      onAutoFill(extractedData);
      toast.success('Form magically filled!', {
        description: `Extracted ${Object.keys(extractedData).length} fields successfully.`,
      });
      setIsOpen(false);
      setInput('');
    } else {
      toast.error('Could not extract data.', {
        description: 'Try being more specific, e.g. "وجدت خدش في منتج X، الكمية 5"',
      });
    }

    setIsProcessing(false);
  };

  return (
    <div className="mb-6 relative z-20">
      {!isOpen ? (
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#00A3E0]/10 to-[#0066CC]/10 border border-[#00A3E0]/30 hover:border-[#00A3E0]/60 transition-all shadow-[0_0_20px_rgba(0,163,224,0.15)] hover:shadow-[0_0_30px_rgba(0,163,224,0.3)] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          <Sparkles className="w-5 h-5 text-[#00A3E0] animate-pulse" />
          <span className="text-sm font-black text-[#8be3ff] tracking-wide">AI MAGIC FILL</span>
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="p-1 rounded-3xl bg-gradient-to-r from-[#00A3E0] via-[#0066CC] to-[#00A3E0] bg-[length:200%_auto] animate-gradient shadow-[0_0_40px_rgba(0,163,224,0.3)]"
        >
          <div className="bg-[#0f131a] rounded-[22px] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#00A3E0]">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">Q-Elite Copilot</span>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white/80 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2 relative overflow-hidden">
              {isProcessing && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00A3E0]/20 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
              )}
              
              <button
                type="button"
                onClick={() => setIsListening(!isListening)}
                disabled={isProcessing}
                className={`p-3 rounded-lg transition-all ${isListening ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' : 'bg-white/5 text-white/60 hover:text-[#00A3E0] hover:bg-[#00A3E0]/10 border border-transparent'}`}
              >
                <Mic className="w-5 h-5" />
              </button>
              
              <input
                type="text"
                placeholder='مثال: "وجدت خدش في الباب، الكمية 5"'
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && processInput()}
                disabled={isProcessing}
                className="flex-1 bg-transparent border-none text-white text-sm outline-none placeholder:text-white/30"
              />
              
              <button
                type="button"
                onClick={() => processInput()}
                disabled={isProcessing || !input.trim()}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white text-sm font-bold shadow-lg hover:shadow-[#00A3E0]/50 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                Magic Fill
              </button>
            </div>
            <p className="text-[10px] text-white/30 text-center font-medium">Powered by QMS Enterprise 4.0 AI Intelligence</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
