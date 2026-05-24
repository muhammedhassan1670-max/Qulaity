/**
 * QMS Enterprise 4.0 — Excel/CSV → Dynamic Form Generator
 * Parses uploaded spreadsheets, infers field types, offers a preview,
 * and opens the full Form Builder pre-populated with the generated form.
 */

import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Hash,
  Calendar,
  ToggleLeft,
  List,
  FileText,
  Type,
  Mail,
  Phone,
  Image,
  PenTool,
  AlertCircle,
  X,
  Sparkles,
  RefreshCw,
  Eye,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { DynamicForm, DynamicField, FieldType } from '../stores/configStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DetectedColumn {
  originalName: string;
  fieldName: string;        // snake_case
  label: string;            // Human-readable
  type: FieldType;
  confidence: number;       // 0-100
  sampleValues: string[];
  options?: { value: string; label: string }[];
  required: boolean;
  reason: string;           // Why this type was chosen
}

interface ExcelFormGeneratorProps {
  onFormGenerated: (form: DynamicForm) => void;
  onCancel: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FIELD_TYPE_META: Record<string, { label: string; icon: React.ComponentType<{className?: string}>; color: string }> = {
  text:           { label: 'Text',          icon: Type,           color: 'text-blue-400' },
  textarea:       { label: 'Text Area',     icon: FileText,       color: 'text-blue-300' },
  number:         { label: 'Number',        icon: Hash,           color: 'text-green-400' },
  date:           { label: 'Date',          icon: Calendar,       color: 'text-yellow-400' },
  datetime:       { label: 'Date & Time',   icon: Calendar,       color: 'text-yellow-300' },
  select:         { label: 'Dropdown',      icon: List,           color: 'text-purple-400' },
  multiselect:    { label: 'Multi-Select',  icon: List,           color: 'text-purple-300' },
  checkbox:       { label: 'Checkbox',      icon: ToggleLeft,     color: 'text-indigo-400' },
  radio:          { label: 'Radio Group',   icon: ToggleLeft,     color: 'text-indigo-300' },
  'button-group': { label: 'Button Group',  icon: ToggleLeft,     color: 'text-violet-400' },
  'checkbox-group':{ label: 'Checklist',   icon: ToggleLeft,     color: 'text-violet-300' },
  file:           { label: 'File Upload',   icon: Upload,         color: 'text-orange-400' },
  signature:      { label: 'Signature',     icon: PenTool,        color: 'text-red-400' },
  barcode:        { label: 'Barcode/QR',    icon: FileSpreadsheet,color: 'text-gray-400' },
  relation:       { label: 'Relation',      icon: ChevronRight,   color: 'text-cyan-400' },
  calculated:     { label: 'Calculated',    icon: Hash,           color: 'text-teal-400' },
  formula:        { label: 'Formula',       icon: Hash,           color: 'text-teal-300' },
  lookup:         { label: 'Lookup',        icon: Eye,            color: 'text-sky-400' },
  chart:          { label: 'Chart',         icon: Image,          color: 'text-rose-400' },
  // Display-only types (resolved to standard FieldType on output)
  email:          { label: 'Email',         icon: Mail,           color: 'text-cyan-400' },
  phone:          { label: 'Phone',         icon: Phone,          color: 'text-lime-400' },
  image:          { label: 'Image Upload',  icon: Image,          color: 'text-pink-400' },
};

const ALL_FIELD_OPTIONS: FieldType[] = [
  'text','textarea','number','date','datetime','select','multiselect',
  'checkbox','radio','button-group','checkbox-group','file','signature',
  'barcode','lookup','formula','calculated','chart'
];

// Map display types that aren't in the FieldType union back to valid ones before outputting
const DISPLAY_TYPE_TO_FIELD_TYPE: Record<string, FieldType> = {
  email: 'text',
  phone: 'text',
  image: 'file',
};

function resolveOutputType(displayType: string): FieldType {
  return (DISPLAY_TYPE_TO_FIELD_TYPE[displayType] || displayType) as FieldType;
}

function toSnakeCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_');
}

function toLabel(str: string): string {
  return str
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function isDate(val: string): boolean {
  if (!val || val.length < 6) return false;
  // ISO dates, common formats
  return !isNaN(Date.parse(val)) &&
    /(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/.test(val);
}

function isNumber(val: string): boolean {
  return val !== '' && !isNaN(Number(val.replace(/,/g, '')));
}

function isBoolLike(val: string): boolean {
  const v = val.toString().toLowerCase().trim();
  return ['yes', 'no', 'true', 'false', 'y', 'n', '1', '0', 'on', 'off', 'active', 'inactive'].includes(v);
}

function detectColumnType(columnName: string, values: string[]): DetectedColumn {
  const name = columnName.toLowerCase();
  const fieldName = toSnakeCase(columnName);
  const label = toLabel(columnName);
  const nonEmpty = values.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
  const samples = nonEmpty.slice(0, 5).map(String);

  // 1. Name-based overrides (high confidence)
  if (/email/i.test(name))              return build('email' as unknown as FieldType, 98, 'Column name contains "email"', []);
  if (/phone|mobile|tel/i.test(name))   return build('phone' as unknown as FieldType, 98, 'Column name contains "phone/mobile"', []);
  if (/signature|sign/i.test(name))     return build('signature', 96, 'Column name contains "signature"', []);
  if (/image|photo|picture|logo/i.test(name))  return build('image' as unknown as FieldType, 95, 'Column name contains "image/photo"', []);
  if (/attachment|file|document/i.test(name))  return build('file', 95, 'Column name contains "file/attachment"', []);
  if (/barcode|qr|scan/i.test(name))    return build('barcode', 94, 'Column name contains "barcode/qr"', []);
  if (/password|secret|token/i.test(name)) return build('text', 90, 'Sensitive field detected', []);

  // 2. Status / priority / category → smart dropdown
  if (/status/i.test(name)) {
    const opts = buildOptions(['Open', 'Closed', 'In Progress', 'Pending', 'Cancelled']);
    return build('select', 92, 'Column named "status" → status dropdown', opts);
  }
  if (/priority/i.test(name)) {
    const opts = buildOptions(['Critical', 'High', 'Medium', 'Low']);
    return build('select', 92, 'Column named "priority" → priority dropdown', opts);
  }
  if (/category|type|kind|class/i.test(name) && nonEmpty.length > 0) {
    const uniq = [...new Set(nonEmpty)];
    if (uniq.length <= 8) {
      return build('select', 85, `Repeating values (${uniq.length} unique) → dropdown`, buildOptions(uniq));
    }
  }

  // 3. Data-based detection
  if (nonEmpty.length === 0) return build('text', 50, 'No data, defaulting to text', []);

  const dateCount   = nonEmpty.filter(v => isDate(String(v))).length;
  const numCount    = nonEmpty.filter(v => isNumber(String(v))).length;
  const boolCount   = nonEmpty.filter(v => isBoolLike(String(v))).length;
  const total       = nonEmpty.length;

  if (dateCount / total > 0.7) return build('date', 90, `${Math.round(dateCount/total*100)}% date-like values`, []);
  if (boolCount / total > 0.7) return build('checkbox', 88, `${Math.round(boolCount/total*100)}% boolean-like values`, []);
  if (numCount  / total > 0.8) return build('number', 85, `${Math.round(numCount/total*100)}% numeric values`, []);

  // Unique values check → dropdown vs free text
  const uniq = [...new Set(nonEmpty.map(String))];
  if (uniq.length <= 6 && total >= 5) {
    return build('select', 82, `Only ${uniq.length} unique values → dropdown`, buildOptions(uniq));
  }

  // Long text check
  const avgLen = nonEmpty.reduce((s, v) => s + String(v).length, 0) / total;
  if (avgLen > 80) return build('textarea', 80, `Avg length ${Math.round(avgLen)} chars → textarea`, []);

  // Default: short text
  return build('text', 70, 'Short free-text values', []);

  function build(type: FieldType, confidence: number, reason: string, options: {value:string;label:string}[]): DetectedColumn {
    return { originalName: columnName, fieldName, label, type, confidence, sampleValues: samples, options: options.length ? options : undefined, required: false, reason };
  }

  function buildOptions(vals: string[]) {
    return vals.map(v => ({ value: toSnakeCase(v) || v.toLowerCase(), label: v }));
  }
}

function parseWorkbook(data: ArrayBuffer): { columns: string[]; rows: Record<string, any>[] } {
  const wb = XLSX.read(data, { type: 'array', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
  const columns = json.length > 0 ? Object.keys(json[0]) : [];
  return { columns, rows: json.slice(0, 20) };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ExcelFormGenerator({ onFormGenerated, onCancel }: ExcelFormGeneratorProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [columns, setColumns] = useState<DetectedColumn[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [formName, setFormName] = useState('Generated Form');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File processing ──

  const processFile = useCallback(async (file: File) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      toast.error('Unsupported file', { description: 'Please upload an .xlsx, .xls, or .csv file' });
      return;
    }
    setIsProcessing(true);
    setFileName(file.name);
    const slug = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
    setFormName(toLabel(slug));

    try {
      const buf = await file.arrayBuffer();
      const { columns: cols, rows: dataRows } = parseWorkbook(buf);
      if (cols.length === 0) { toast.error('No columns found in file'); setIsProcessing(false); return; }

      const detected = cols.map(col => {
        const vals = dataRows.map(r => String(r[col] ?? ''));
        return detectColumnType(col, vals);
      });

      setColumns(detected);
      setRows(dataRows);
      setStep(2);
    } catch (err) {
      toast.error('Failed to parse file', { description: String(err) });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  // ── Field type change ──

  const changeColumnType = (idx: number, newType: FieldType) => {
    setColumns(prev => prev.map((c, i) => i === idx ? { ...c, type: newType } : c));
  };

  const toggleRequired = (idx: number) => {
    setColumns(prev => prev.map((c, i) => i === idx ? { ...c, required: !c.required } : c));
  };

  const removeColumn = (idx: number) => {
    setColumns(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Form generation ──

  const generateForm = () => {
    const sectionId = 'section-1';
    const fields: DynamicField[] = columns.map((col, idx) => ({
      id: `field-${idx + 1}`,
      name: col.fieldName,
      label: col.label,
      type: resolveOutputType(col.type as string),
      required: col.required,
      visible: true,
      editable: true,
      order: idx + 1,
      section: sectionId,
      ...(col.options ? { options: col.options } : {}),
    }));

    const form: DynamicForm = {
      id: `form-${Date.now()}`,
      name: formName,
      description: `Auto-generated from ${fileName}`,
      type: 'custom',
      version: 1,
      isActive: false,
      fields,
      sections: [{
        id: sectionId,
        title: 'Imported Fields',
        order: 1,
        fields: fields.map(f => f.id),
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'import-wizard',
    };

    toast.success('Form generated!', { description: `${fields.length} fields imported from ${fileName}` });
    onFormGenerated(form);
  };

  // ── Confidence badge ──
  const confidenceBadge = (c: number) => {
    if (c >= 90) return <Badge className="bg-green-500/20 text-green-400 border-none text-[10px]">High {c}%</Badge>;
    if (c >= 75) return <Badge className="bg-yellow-500/20 text-yellow-400 border-none text-[10px]">Med {c}%</Badge>;
    return <Badge className="bg-red-500/20 text-red-400 border-none text-[10px]">Low {c}%</Badge>;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">

      {/* ── Stepper ── */}
      <div className="flex items-center justify-center gap-0">
        {([
          { n: 1, label: 'Upload File' },
          { n: 2, label: 'Review Fields' },
          { n: 3, label: 'Generate Form' },
        ] as const).map(({ n, label }, i) => (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all duration-500
                ${step > n  ? 'bg-[#00d2ff] border-[#00d2ff] text-[#0a0a0f]'
                : step === n ? 'bg-[#0077ff]/10 border-[#0077ff] text-[#00d2ff] shadow-[0_0_20px_rgba(0,119,255,0.4)]'
                : 'bg-white/5 border-white/10 text-gray-600'}`}>
                {step > n ? <CheckCircle className="w-5 h-5" /> : n}
              </div>
              <span className={`text-[11px] font-bold uppercase tracking-widest whitespace-nowrap
                ${step === n ? 'text-[#00d2ff]' : step > n ? 'text-white/60' : 'text-gray-600'}`}>{label}</span>
            </div>
            {i < 2 && (
              <div className={`w-24 md:w-36 h-px mx-3 mb-5 transition-all duration-500
                ${step > n + 1 ? 'bg-[#00d2ff]' : step > n ? 'bg-[#0077ff]' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════
          STEP 1 — UPLOAD
         ══════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-6 rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-300 p-16
              ${isDragging
                ? 'border-[#00d2ff] bg-[#00d2ff]/5 scale-[1.01]'
                : 'border-white/10 bg-white/[0.02] hover:border-[#0077ff]/50 hover:bg-white/[0.04]'}`}
          >
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFileInput} />

            {isProcessing ? (
              <div className="flex flex-col items-center gap-4">
                <RefreshCw className="w-14 h-14 text-[#00d2ff] animate-spin" />
                <p className="text-white font-bold text-lg">Analysing your file…</p>
                <p className="text-gray-500 text-sm">Detecting column types & values</p>
              </div>
            ) : (
              <>
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#0077ff]/20 to-[#00d2ff]/10 flex items-center justify-center border border-[#0077ff]/20 shadow-[0_0_40px_rgba(0,119,255,0.15)]">
                  <FileSpreadsheet className="w-12 h-12 text-[#00d2ff]" />
                </div>
                <div className="text-center">
                  <p className="text-xl font-black text-white tracking-tight mb-2">
                    {isDragging ? 'Drop your file here!' : 'Drop your Excel / CSV file'}
                  </p>
                  <p className="text-gray-500 text-sm">Supports <span className="text-[#00d2ff] font-bold">.xlsx</span>, <span className="text-[#00d2ff] font-bold">.xls</span>, <span className="text-[#00d2ff] font-bold">.csv</span></p>
                </div>
                <Button className="bg-gradient-to-r from-[#0077ff] to-[#00d2ff] text-white font-bold px-8 py-3 rounded-2xl shadow-[0_8px_24px_rgba(0,119,255,0.3)] hover:scale-105 transition-all">
                  <Upload className="w-4 h-4 mr-2" />
                  Browse File
                </Button>
              </>
            )}
          </div>

          {/* Tips */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Zap, title: 'Auto Type Detection', desc: 'Numbers, dates, dropdowns — detected automatically from your data' },
              { icon: Eye, title: 'Preview & Edit', desc: 'Review every field type before generating the form' },
              { icon: Sparkles, title: 'Instant Form', desc: 'Get a fully editable form in seconds, no coding needed' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-9 h-9 rounded-xl bg-[#0077ff]/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#00d2ff]" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm mb-1">{title}</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="ghost" onClick={onCancel} className="text-gray-500 hover:text-white">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          STEP 2 — REVIEW FIELDS
         ══════════════════════════════════════════════ */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0077ff]/10 flex items-center justify-center border border-[#0077ff]/20">
                <FileSpreadsheet className="w-6 h-6 text-[#00d2ff]" />
              </div>
              <div>
                <p className="text-white font-bold">{fileName}</p>
                <p className="text-gray-500 text-sm">{columns.length} columns detected &nbsp;·&nbsp; {rows.length} sample rows</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#0077ff] w-64 font-bold"
                placeholder="Form Name…"
              />
              <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-gray-500 hover:text-white border border-white/10">
                <ChevronLeft className="w-4 h-4 mr-1" /> Re-upload
              </Button>
            </div>
          </div>

          {/* Columns table */}
          <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
            {/* Table head */}
            <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-white/[0.04] border-b border-white/[0.06]">
              <div className="col-span-3 text-[11px] font-black uppercase tracking-widest text-gray-500">Column Name</div>
              <div className="col-span-2 text-[11px] font-black uppercase tracking-widest text-gray-500">Field Name</div>
              <div className="col-span-3 text-[11px] font-black uppercase tracking-widest text-gray-500">Detected Type</div>
              <div className="col-span-2 text-[11px] font-black uppercase tracking-widest text-gray-500">Confidence</div>
              <div className="col-span-1 text-[11px] font-black uppercase tracking-widest text-gray-500 text-center">Req.</div>
              <div className="col-span-1 text-[11px] font-black uppercase tracking-widest text-gray-500 text-center">Del.</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-white/[0.04] max-h-[420px] overflow-y-auto custom-scrollbar">
              {columns.map((col, idx) => {
                const meta = (FIELD_TYPE_META as any)[col.type] || FIELD_TYPE_META['text'];
                const Icon = meta.icon;
                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-white/[0.02] transition-colors group">
                    {/* Original name */}
                    <div className="col-span-3">
                      <p className="text-white font-semibold text-sm truncate">{col.label}</p>
                      <p className="text-gray-600 text-[11px] truncate">"{col.originalName}"</p>
                    </div>
                    {/* Field name */}
                    <div className="col-span-2">
                      <code className="text-[11px] text-[#00d2ff] bg-[#00d2ff]/10 px-2 py-0.5 rounded-lg">{col.fieldName}</code>
                    </div>
                    {/* Type selector */}
                    <div className="col-span-3">
                      <div className="relative">
                        <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${meta.color} pointer-events-none`} />
                        <select
                          value={col.type}
                          onChange={e => changeColumnType(idx, e.target.value as FieldType)}
                          className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#0077ff] cursor-pointer appearance-none"
                        >
                          {ALL_FIELD_OPTIONS.map(t => {
                            const m = (FIELD_TYPE_META as any)[t] || FIELD_TYPE_META['text'];
                            return <option key={t} value={t}>{m.label}</option>;
                          })}
                        </select>
                      </div>
                    </div>
                    {/* Confidence */}
                    <div className="col-span-2 flex flex-col gap-1">
                      {confidenceBadge(col.confidence)}
                      <p className="text-[10px] text-gray-600 truncate leading-tight">{col.reason}</p>
                    </div>
                    {/* Required toggle */}
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => toggleRequired(idx)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${col.required ? 'bg-[#0077ff]/20 text-[#00d2ff]' : 'bg-white/5 text-gray-600 hover:text-gray-400'}`}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Remove */}
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => removeColumn(idx)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5 text-gray-600 hover:bg-red-500/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer count */}
            <div className="px-5 py-3 bg-white/[0.02] border-t border-white/[0.06] flex items-center justify-between">
              <p className="text-xs text-gray-600">{columns.length} fields · {columns.filter(c => c.required).length} required</p>
              <div className="flex gap-3 text-xs">
                <span className="text-green-400 font-bold">{columns.filter(c => c.confidence >= 90).length} High conf.</span>
                <span className="text-yellow-400 font-bold">{columns.filter(c => c.confidence >= 75 && c.confidence < 90).length} Med conf.</span>
                <span className="text-red-400 font-bold">{columns.filter(c => c.confidence < 75).length} Low conf.</span>
              </div>
            </div>
          </div>

          {/* Sample data preview */}
          {rows.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors list-none">
                <Eye className="w-4 h-4" />
                <span className="font-bold uppercase tracking-widest text-[11px]">Preview Sample Data ({rows.length} rows)</span>
                <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform ml-auto" />
              </summary>
              <div className="mt-3 overflow-x-auto rounded-xl border border-white/[0.06]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-white/[0.04] border-b border-white/[0.06]">
                    <tr>
                      {columns.map(c => (
                        <th key={c.fieldName} className="px-3 py-2 text-gray-500 font-bold uppercase tracking-wider whitespace-nowrap">{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        {columns.map(c => (
                          <td key={c.fieldName} className="px-3 py-2 text-gray-400 whitespace-nowrap max-w-[180px] truncate">{String(row[c.originalName] ?? '—')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}

          {/* Low-confidence warning */}
          {columns.some(c => c.confidence < 75) && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/20">
              <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-300 font-bold text-sm">Some fields have low confidence</p>
                <p className="text-yellow-400/70 text-xs mt-1">
                  {columns.filter(c => c.confidence < 75).map(c => `"${c.label}"`).join(', ')} — please review their types manually.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(1)} className="text-gray-500 hover:text-white border border-white/10">
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button
              className="bg-gradient-to-r from-[#0077ff] to-[#00d2ff] text-white font-black px-8 rounded-2xl shadow-[0_8px_24px_rgba(0,119,255,0.3)] hover:scale-105 transition-all"
              onClick={() => setStep(3)}
              disabled={columns.length === 0}
            >
              Review & Generate <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          STEP 3 — GENERATE FORM
         ══════════════════════════════════════════════ */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-2">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#0077ff] to-[#00d2ff] flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(0,119,255,0.35)] mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">Ready to Generate!</h2>
            <p className="text-gray-500">Your form <span className="text-[#00d2ff] font-bold">"{formName}"</span> will be created with <span className="text-white font-bold">{columns.length} fields</span></p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Fields', value: columns.length, color: 'text-[#00d2ff]' },
              { label: 'Required',     value: columns.filter(c => c.required).length,                          color: 'text-red-400' },
              { label: 'Auto Dropdowns', value: columns.filter(c => ['select','multiselect','button-group'].includes(c.type)).length, color: 'text-purple-400' },
              { label: 'High Confidence', value: columns.filter(c => c.confidence >= 90).length,               color: 'text-green-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] text-center">
                <p className={`text-3xl font-black ${color} mb-1`}>{value}</p>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>

          {/* Field preview list */}
          <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
            <div className="px-5 py-3 bg-white/[0.04] border-b border-white/[0.06]">
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">Fields Summary</p>
            </div>
            <div className="divide-y divide-white/[0.04] max-h-60 overflow-y-auto custom-scrollbar">
              {columns.map((col, idx) => {
                const meta = (FIELD_TYPE_META as any)[col.type] || FIELD_TYPE_META['text'];
                const Icon = meta.icon;
                return (
                  <div key={idx} className="flex items-center gap-4 px-5 py-3">
                    <div className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{col.label}</p>
                      <p className="text-gray-600 text-[11px] truncate">{meta.label}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {col.required && <Badge className="bg-red-500/20 text-red-400 border-none text-[10px]">Required</Badge>}
                      {confidenceBadge(col.confidence)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(2)} className="text-gray-500 hover:text-white border border-white/10">
              <ChevronLeft className="w-4 h-4 mr-2" /> Back to Review
            </Button>
            <Button
              className="bg-gradient-to-r from-[#0077ff] to-[#00d2ff] text-white font-black px-10 py-3 rounded-2xl shadow-[0_8px_30px_rgba(0,119,255,0.4)] hover:scale-105 transition-all text-base"
              onClick={generateForm}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Form & Open Builder
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExcelFormGenerator;
