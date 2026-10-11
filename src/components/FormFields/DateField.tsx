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


const DateField: React.FC<FieldComponentProps> = ({ field, value, onChange, error, disabled }) => (
  <div className="space-y-3">
    <div className="relative group/input">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0066CC] to-[#00A3E0] rounded-xl blur opacity-0 group-hover/input:opacity-10 transition duration-500" />
      <input
        type={field.type === 'datetime' ? 'datetime-local' : 'date'}
        value={String(value || '')}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
        className={`
          pro-input relative w-full px-5 py-4 text-base transition-all duration-300
          ${error ? 'border-red-500/50 bg-red-500/5' : ''}
          [color-scheme:dark]
        `}
      />
      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 group-hover/input:text-[#00A3E0] transition-colors">
        <CalendarIcon className="w-5 h-5" />
      </div>
    </div>
    {error && (
      <p className="text-red-400 text-xs font-bold flex items-center gap-1.5 px-1 animate-in slide-in-from-top-1">
        <AlertCircle className="w-3.5 h-3.5" />
        {error}
      </p>
    )}
  </div>
);

export default React.memo(DateField);
