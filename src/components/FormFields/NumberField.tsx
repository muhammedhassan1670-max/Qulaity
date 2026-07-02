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


const NumberField: React.FC<FieldComponentProps> = ({ field, value, onChange, error, disabled, required }) => {
  const isFocusedOrFilled = (value !== undefined && value !== null && String(value) !== '');
  return (
    <div className="space-y-1 relative group/field">
      <div className="relative group/input mt-4">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0066CC] to-[#00A3E0] rounded-xl blur opacity-0 group-hover/input:opacity-20 transition duration-500" />
        <div className="relative flex items-center">
          <input
            type="number"
            value={value === undefined || value === null ? '' : Number(value)}
            onChange={(e) => {
              const val = e.target.value;
              onChange(val === '' ? null : Number(val));
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
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 text-green-400">
              <Check className="w-4 h-4 drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]" />
            </motion.div>
          )}
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

export default React.memo(NumberField);
