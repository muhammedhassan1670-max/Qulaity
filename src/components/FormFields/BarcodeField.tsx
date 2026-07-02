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


const BarcodeField: React.FC<FieldComponentProps> = ({ value, onChange, error, disabled }) => (
  <div className="space-y-2">
    <div className="flex gap-2">
      <input
        type="text"
        value={String(value || '')}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Scan or enter barcode..."
        disabled={disabled}
        className={`
          flex-1 px-4 py-2.5 rounded-lg border bg-transparent
          ${error ? 'border-red-500' : 'border-white/10'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          focus:outline-none focus:border-[#00A3E0] focus:ring-1 focus:ring-[#00A3E0]
          text-white placeholder-gray-500
        `}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => toast.info('Scan', { description: 'Barcode scanner integration coming soon' })}
        className="px-3 py-2 bg-[#0066CC]/20 rounded-lg text-[#00A3E0] hover:bg-[#0066CC]/30 disabled:opacity-50"
      >
        <ScanLine className="w-5 h-5" />
      </button>
    </div>
    {error && <p className="text-red-400 text-xs">{error}</p>}
  </div>
);

// ============================================================================
// MAIN FORM RENDERER
// ============================================================================

interface DynamicFormRendererProps {
  formId?: string;
  formType?: DynamicForm['type'];
  config?: DynamicForm;
  initialValues?: Record<string, unknown>;
  qualityTemplateContext?: ActiveQualityFormContext & { role?: string; mode?: QualityFormMode };
  onSubmit?: (data: Record<string, unknown>) => void | Promise<void>;
  onChange?: (data: Record<string, unknown>) => void;
  readOnly?: boolean;
  showSubmitButton?: boolean;
  submitLabel?: string;
  submitActions?: Array<{ id: string; label: string; value: string; description?: string }>;
  compactMode?: 'shopfloor';
  className?: string;
}

export default React.memo(BarcodeField);
