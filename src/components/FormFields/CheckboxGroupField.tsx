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


const CheckboxGroupField: React.FC<FieldComponentProps> = ({ field, value, onChange, error, disabled }) => {
  const { optionSets } = useConfigStore();
  const options = field.optionSetId ? optionSets.find(s => s.id === field.optionSetId)?.items : field.options;
  const selectedValues = Array.isArray(value) ? value : [];

  const toggleOption = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter((v) => v !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options?.map((opt) => {
          const isSelected = selectedValues.includes(opt.value);
          return (
            <label
              key={opt.value}
              className={`
                relative flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden group/check
                ${isSelected 
                  ? 'bg-[#00A3E0]/10 border-[#00A3E0]/50 shadow-[0_0_20px_rgba(0,163,224,0.1)]' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-br from-[#00A3E0]/5 to-transparent" />
              )}
              <div className={`
                w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all duration-300
                ${isSelected ? 'bg-[#00A3E0] border-[#00A3E0] scale-110 shadow-[0_0_10px_rgba(0,163,224,0.5)]' : 'border-white/20 group-hover/check:border-white/40'}
              `}>
                {isSelected && <Check className="w-4 h-4 text-white stroke-[4]" />}
              </div>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => !disabled && toggleOption(opt.value)}
                disabled={disabled}
                className="hidden"
              />
              <span className={`text-sm font-black transition-colors ${isSelected ? 'text-white' : 'text-gray-500 group-hover/check:text-gray-300'}`}>
                {opt.label}
              </span>
            </label>
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

export default React.memo(CheckboxGroupField);
