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


const FileField: React.FC<FieldComponentProps> = ({ field, value, onChange, error, disabled }) => (
  <div className="space-y-2">
    <div
      className={`
        border-2 border-dashed rounded-lg p-6 text-center
        ${error ? 'border-red-500' : 'border-white/20'}
        ${disabled ? 'opacity-50' : 'hover:border-[#00A3E0] cursor-pointer'}
        transition-colors
      `}
      onClick={() => !disabled && document.getElementById(`file-${field.name}`)?.click()}
    >
      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
      <p className="text-sm text-gray-300">
        {value ? (value as File).name : 'Click to upload or drag and drop'}
      </p>
      <input
        id={`file-${field.name}`}
        type="file"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        disabled={disabled}
        className="hidden"
      />
    </div>
    {error && <p className="text-red-400 text-xs">{error}</p>}
  </div>
);

export default React.memo(FileField);
