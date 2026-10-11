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


const SelectField: React.FC<FieldComponentProps> = ({ field, value, onChange, error, disabled, required }) => {
  const { optionSets } = useConfigStore();
  const options = field.optionSetId ? optionSets.find(s => s.id === field.optionSetId)?.items : field.options;
  const isFocusedOrFilled = (value !== undefined && value !== null && String(value) !== '');

  return (
    <div className="space-y-1 relative group/field">
      <div className="relative group/input mt-4">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0066CC] to-[#00A3E0] rounded-xl blur opacity-0 group-hover/input:opacity-20 transition duration-500" />
        <div className="relative">
          <select
            value={value as string || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`
              peer w-full px-5 py-4 text-base transition-all duration-300 appearance-none
              bg-[#0a0a0f] border border-white/10 rounded-xl text-white outline-none focus:bg-white/5 focus:border-[#00A3E0]/50
              ${error ? 'border-red-500/50 bg-red-500/5 focus:border-red-500' : ''}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <option value="" className="bg-[#1a1a1f] text-white/50" disabled></option>
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#1a1a1f] text-white">
                {opt.label}
              </option>
            ))}
          </select>
          <label
            className={`
              absolute left-5 transition-all duration-300 pointer-events-none text-white/50
              peer-focus:-top-6 peer-focus:text-xs peer-focus:text-[#00A3E0] peer-focus:font-bold
              ${isFocusedOrFilled ? '-top-6 text-xs text-white/70 font-bold' : 'top-4 text-base'}
            `}
          >
            {field.label} {required && <span className="text-red-500">*</span>}
          </label>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 group-hover/input:text-[#00A3E0] transition-colors">
            <ChevronDown className="w-5 h-5" />
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

export default React.memo(SelectField);
