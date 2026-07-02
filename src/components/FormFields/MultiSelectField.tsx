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


const MultiSelectField: React.FC<FieldComponentProps> = ({ field, value, onChange, error, disabled }) => {
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
      <div className="flex flex-wrap gap-2 min-h-[56px] p-3 pro-input">
        {selectedValues.map((val) => {
          const opt = options?.find((o) => o.value === val);
          return (
            <Badge
              key={val}
              className="bg-[#0066CC] text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-none shadow-lg shadow-[#0066CC]/20 animate-in zoom-in-95 duration-200"
            >
              {opt?.label || val}
              <button
                type="button"
                onClick={() => !disabled && toggleOption(val)}
                className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </Badge>
          );
        })}
        <select
          value=""
          onChange={(e) => e.target.value && toggleOption(e.target.value)}
          disabled={disabled}
          className="flex-1 bg-transparent border-none focus:ring-0 text-sm min-w-[120px] outline-none text-white cursor-pointer appearance-none"
          style={{ colorScheme: 'dark' }}
        >
          <option value="" className="bg-[#1a1a1f] text-white/50" disabled>{selectedValues.length === 0 ? (field.placeholder || 'Select multiple...') : 'Add more...'}</option>
          {options
            ?.filter((opt) => !selectedValues.includes(opt.value))
            .map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#1a1a1f] text-white">
                {opt.label}
              </option>
            ))}
        </select>
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

export default React.memo(MultiSelectField);
