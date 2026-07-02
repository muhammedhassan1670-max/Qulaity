// @ts-nocheck
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, ChevronDown, AlertCircle, X, Camera, UploadCloud, 
  FileIcon, XCircle, Trash2, CalendarIcon, Star, Plus 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useConfigStore } from '@/stores/configStore';
import { FieldComponentProps } from './types';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';


const RadioField: React.FC<FieldComponentProps> = ({ field, value, onChange, error, disabled }) => {
  const { optionSets } = useConfigStore();
  const options = field.optionSetId ? optionSets.find(s => s.id === field.optionSetId)?.items : field.options;

  return (
    <div className="space-y-2 mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options?.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <motion.label
              key={opt.value}
              whileHover={!disabled ? { scale: 1.02 } : {}}
              whileTap={!disabled ? { scale: 0.98 } : {}}
              onClick={() => {
                if (!disabled) {
                  onChange(opt.value);
                  onAutoAdvance?.();
                }
              }}
              className={`
                relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden group/radio
                ${isSelected 
                  ? 'bg-[#0066CC]/20 border-[#0066CC] shadow-[0_0_20px_rgba(0,102,204,0.3)]' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isSelected && (
                <motion.div 
                  layoutId={`radio-bg-${field.id}`}
                  className="absolute inset-0 bg-gradient-to-r from-[#0066CC]/10 to-transparent" 
                />
              )}
              <div className={`
                relative w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10
                ${isSelected ? 'border-[#0066CC] bg-[#0066CC]/20' : 'border-white/30 group-hover/radio:border-white/60'}
              `}>
                {isSelected && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-3 h-3 rounded-full bg-[#00A3E0] shadow-[0_0_10px_rgba(0,163,224,0.8)]" 
                  />
                )}
              </div>
              <input
                type="radio"
                name={field.name}
                value={opt.value}
                checked={isSelected}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="hidden"
              />
              <span className={`relative z-10 text-sm font-bold transition-colors ${isSelected ? 'text-white' : 'text-gray-400 group-hover/radio:text-gray-100'}`}>
                {opt.label}
              </span>
            </motion.label>
          );
        })}
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

export default React.memo(RadioField);
