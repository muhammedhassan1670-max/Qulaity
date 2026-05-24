/**
 * QMS Enterprise 4.0 - Formula Editor Component
 * Advanced formula builder with autocomplete and validation
 */

import { useState, useCallback } from 'react';
import { AlertCircle, Check, Variable, Plus, Minus, X, Divide, FunctionSquare, Info, Zap } from 'lucide-react';

export interface FormulaEditorProps {
  expression: string;
  availableFields: { name: string; label: string; type: string }[];
  onChange: (formula: { expression: string; variables: string[] }) => void;
}

export function FormulaEditor({ expression = '', availableFields, onChange }: FormulaEditorProps) {
  const [localExpression, setLocalExpression] = useState(expression);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const operators = [
    { label: '+', value: '+', icon: Plus },
    { label: '-', value: '-', icon: Minus },
    { label: '×', value: '*', icon: X },
    { label: '÷', value: '/', icon: Divide },
    { label: '(', value: '(', icon: null },
    { label: ')', value: ')', icon: null },
  ];

  const validateFormula = useCallback((expr: string) => {
    if (!expr) {
      setError(null);
      return { valid: true, variables: [] };
    }
    try {
      // Basic validation - check for balanced parentheses
      let parentheses = 0;
      for (const char of expr) {
        if (char === '(') parentheses++;
        if (char === ')') parentheses--;
        if (parentheses < 0) throw new Error('Unbalanced parentheses');
      }
      if (parentheses !== 0) throw new Error('Unbalanced parentheses');

      // Extract variables (field references like @fieldName)
      const variableRegex = /@(\w+)/g;
      const variables: string[] = [];
      let match;
      while ((match = variableRegex.exec(expr)) !== null) {
        variables.push(match[1]);
      }

      setError(null);
      return { valid: true, variables };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid formula');
      return { valid: false, variables: [] };
    }
  }, []);

  const handleExpressionChange = (value: string) => {
    setLocalExpression(value);
    const result = validateFormula(value);
    
    if (result.valid) {
      onChange({ expression: value, variables: result.variables });
    }

    // Show autocomplete on @ symbol
    const lastChar = value[cursorPosition - 1];
    setShowAutocomplete(lastChar === '@');
  };

  const insertField = (fieldName: string) => {
    const before = localExpression.slice(0, cursorPosition);
    const after = localExpression.slice(cursorPosition);
    const newExpression = before + '@' + fieldName + after;
    setLocalExpression(newExpression);
    setShowAutocomplete(false);
    
    const result = validateFormula(newExpression);
    onChange({ expression: newExpression, variables: result.variables });
  };

  const insertOperator = (op: string) => {
    const before = localExpression.slice(0, cursorPosition);
    const after = localExpression.slice(cursorPosition);
    const newExpression = before + ' ' + op + ' ' + after;
    setLocalExpression(newExpression);
    
    const result = validateFormula(newExpression);
    if (result.valid) {
      onChange({ expression: newExpression, variables: result.variables });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. Field Selection Quick List */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Quick Add Field</label>
        <div className="flex flex-wrap gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl">
          {availableFields.map(field => (
            <button
              key={field.name}
              onClick={() => insertField(field.name)}
              className="px-3 py-1.5 bg-[#0066CC]/10 text-[#00A3E0] text-[11px] font-black rounded-lg border border-[#0066CC]/20 hover:bg-[#0066CC]/20 transition-all flex items-center gap-2 group"
            >
              <Variable className="w-3 h-3 opacity-50 group-hover:opacity-100" />
              {field.label}
            </button>
          ))}
          {availableFields.length === 0 && <span className="text-[10px] text-white/20 italic p-1">No other fields available</span>}
        </div>
      </div>

      {/* 2. Formula Input Area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Formula Expression</label>
          {error ? (
            <span className="text-[9px] text-red-400 font-bold uppercase flex items-center gap-1 animate-pulse"><AlertCircle className="w-3 h-3" /> {error}</span>
          ) : localExpression ? (
            <span className="text-[9px] text-green-400 font-bold uppercase flex items-center gap-1"><Check className="w-3 h-3" /> Valid Logic</span>
          ) : null}
        </div>
        
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0066CC] to-[#00A3E0] rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500" />
          <textarea
            value={localExpression}
            onChange={(e) => {
              const pos = e.target.selectionStart || 0;
              setCursorPosition(pos);
              handleExpressionChange(e.target.value);
            }}
            onSelect={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart || 0)}
            placeholder="e.g. (@price * @quantity) + @tax"
            className="relative w-full h-32 p-6 bg-black/40 border border-white/10 rounded-2xl text-white text-lg font-mono resize-none focus:outline-none focus:border-[#00A3E0] transition-all placeholder:text-white/10"
          />
          
          {/* Floating Autocomplete */}
          {showAutocomplete && (
            <div className="absolute z-50 left-6 right-6 top-full -mt-2 glass-panel rounded-xl overflow-hidden border-[#00A3E0]/30 shadow-2xl shadow-black">
              <div className="p-2 bg-[#00A3E0]/10 text-[9px] font-black text-[#00A3E0] uppercase tracking-widest border-b border-white/5">Select Variable</div>
              <div className="max-h-48 overflow-y-auto">
                {availableFields.map((field) => (
                  <button
                    key={field.name}
                    onClick={() => insertField(field.name)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-left transition-colors group"
                  >
                    <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center group-hover:bg-[#00A3E0]/20 transition-colors">
                      <Variable className="w-3 h-3 text-[#00A3E0]" />
                    </div>
                    <div>
                      <div className="text-white text-xs font-bold">{field.label}</div>
                      <div className="text-[10px] text-white/30">@{field.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Toolbar: Operators & Functions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Basic Math</label>
          <div className="flex flex-wrap gap-2">
            {operators.map((op) => (
              <button
                key={op.value}
                onClick={() => insertOperator(op.value)}
                className="w-10 h-10 bg-white/5 hover:bg-[#0066CC]/20 border border-white/5 hover:border-[#0066CC]/30 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95"
                title={op.label}
              >
                {op.icon ? <op.icon className="w-4 h-4" /> : <span className="text-lg font-bold">{op.label}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Advanced Logic</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => insertOperator('IF( , , )')}
              className="px-4 h-10 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 border border-[#FF6B35]/20 rounded-xl flex items-center gap-2 text-[#FF6B35] text-[10px] font-black uppercase transition-all"
            >
              <Zap className="w-3 h-3" />
              IF Condition
            </button>
            <button
              onClick={() => insertOperator('ROUND( , 2)')}
              className="px-4 h-10 bg-[#00A3E0]/10 hover:bg-[#00A3E0]/20 border border-[#00A3E0]/20 rounded-xl flex items-center gap-2 text-[#00A3E0] text-[10px] font-black uppercase transition-all"
            >
              <FunctionSquare className="w-3 h-3" />
              Round Value
            </button>
          </div>
        </div>
      </div>

      {/* Visualization Summary */}
      {localExpression && !error && (
        <div className="p-4 bg-gradient-to-br from-[#0066CC]/5 to-transparent border border-[#0066CC]/20 rounded-2xl relative overflow-hidden">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-[#00A3E0] mt-0.5" />
            <div className="space-y-1">
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Logic Preview</p>
              <p className="text-xs text-white/40 leading-relaxed italic">
                This field will automatically update whenever any of the referenced fields 
                ({validateFormula(localExpression).variables.map(v => `@${v}`).join(', ') || 'none'}) change.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FormulaEditor;
