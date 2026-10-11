// @ts-nocheck
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, ChevronDown, AlertCircle, X, Camera, UploadCloud, 
  FileIcon, XCircle, Trash2, CalendarIcon, Star, Plus 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useConfigStore } from '@/stores/configStore';
import type { FieldComponentProps } from './types';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { VoiceInputButton } from './VoiceInputButton';
import { Sparkles } from 'lucide-react';

const TextField: React.FC<FieldComponentProps> = ({ field, value, onChange, error, disabled, required, onFocus }) => {
  const isFocusedOrFilled = (value !== undefined && value !== null && String(value) !== '') || false;
  return (
    <div className="space-y-1 relative group/field">
      <div className="relative group/input mt-4">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0066CC] to-[#00A3E0] rounded-xl blur opacity-0 group-hover/input:opacity-20 transition duration-500" />
        <div className="relative flex items-center">
          <input
            type={field.type === 'number' ? 'number' : 'text'}
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => onFocus?.()}
            onKeyDown={(e) => {
              if (e.key === 'Tab' && !value && field.label.toLowerCase().includes('cause')) {
                e.preventDefault();
                onChange('Cooling System Failure');
              }
            }}
            disabled={disabled}
            className={`
              peer w-full px-5 py-4 text-base transition-all duration-300
              bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:bg-white/10 focus:border-[#00A3E0]/50
              ${error ? 'border-red-500/50 bg-red-500/5 focus:border-red-500' : ''}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            placeholder=" "
          />
          <label
            className={`
              absolute left-5 transition-all duration-300 pointer-events-none text-white/50
              peer-focus:-top-6 peer-focus:text-xs peer-focus:text-[#00A3E0] peer-focus:font-bold
              ${isFocusedOrFilled ? '-top-6 text-xs text-white/70 font-bold' : 'top-4 text-base'}
            `}
          >
            {field.label} {required && <span className="text-red-500">*</span>}
          </label>
          {!error && isFocusedOrFilled && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-12 text-green-400">
              <Check className="w-4 h-4 drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]" />
            </motion.div>
          )}
          {!value && field.label.toLowerCase().includes('cause') && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
              className="absolute left-32 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[#A855F7]/70 cursor-pointer hover:text-[#A855F7] transition-colors"
              onClick={() => onChange('Cooling System Failure')}
            >
              <Sparkles className="w-3 h-3" />
              <span className="text-xs font-medium">Press Tab to accept: Cooling System Failure</span>
            </motion.div>
          )}
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <VoiceInputButton
              disabled={disabled}
              onResult={(text) => {
                const current = (value as string) || '';
                onChange(current ? `${current} ${text}` : text);
              }}
            />
          </div>
        </div>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }} 
            animate={{ opacity: 1, y: 0, x: [-5, 5, -5, 5, 0] }} 
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
            className="text-red-400 text-xs font-bold flex items-center gap-1.5 px-1 pt-1"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(TextField);
