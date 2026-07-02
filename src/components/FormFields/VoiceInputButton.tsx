import React, { useState, useEffect, useCallback } from 'react';
import { Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface VoiceInputButtonProps {
  onResult: (text: string) => void;
  disabled?: boolean;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onResult, disabled }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US'; 

        rec.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          onResult(text);
          setIsListening(false);
          toast.success('Voice recognized', { description: text });
        };

        rec.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          if (event.error !== 'no-speech') {
            toast.error('Voice recognition failed', { description: event.error });
          }
        };

        rec.onend = () => {
          setIsListening(false);
        };

        setRecognition(rec);
      }
    }
  }, [onResult]);

  const toggleListening = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!recognition || disabled) {
      if (!recognition) toast.error('Voice input not supported in this browser.');
      return;
    }
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  }, [recognition, isListening, disabled]);

  if (!recognition) return null;

  return (
    <div className="relative">
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -inset-2 bg-[#00A3E0]/30 rounded-full animate-ping pointer-events-none"
          />
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        className={`
          relative z-10 p-2 rounded-full transition-colors flex items-center justify-center
          ${isListening ? 'bg-[#00A3E0] text-white shadow-[0_0_15px_rgba(0,163,224,0.6)]' : 'bg-transparent text-gray-400 hover:text-[#00A3E0] hover:bg-white/5'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title={isListening ? 'Stop listening' : 'Start voice input'}
      >
        <motion.div
          animate={isListening ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={isListening ? { repeat: Infinity, duration: 1.5 } : {}}
        >
          <Mic className="w-4 h-4" />
        </motion.div>
      </button>
    </div>
  );
};
