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


const ButtonGroupField: React.FC<FieldComponentProps> = ({ field, value, onChange, error, disabled }) => {
  const { optionSets } = useConfigStore();
  const options = field.optionSetId ? optionSets.find(s => s.id === field.optionSetId)?.items : field.options;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 p-2 bg-white/5 rounded-2xl border border-white/10">
        {options?.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={`
                flex-1 min-w-[120px] px-6 py-4 rounded-xl text-sm font-black transition-all duration-300 relative overflow-hidden group/btn
                ${isSelected 
                  ? 'bg-[#0066CC] text-white shadow-xl shadow-[#0066CC]/30 scale-[1.05] z-10' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
              )}
              <span className="relative z-10 tracking-wide uppercase">{opt.label}</span>
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-red-400 text-xs font-bold flex items-center gap-1.5 px-1 animate-in slide-in-from-top-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
};

export default React.memo(ButtonGroupField);
