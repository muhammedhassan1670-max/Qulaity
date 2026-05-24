/**
 * QMS Enterprise 4.0 - Lookup Selector Component
 * Cross-table reference field configuration
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { Database, Link, Check, ArrowRight, Zap, Info, Search, Loader2 } from 'lucide-react';
import { useConfigStore, type DynamicForm } from '../stores/configStore';
import { unifiedApiRegistry } from '../api/unified-api';

export interface LookupSelectorProps {
  config: {
    sourceType?: 'internal' | 'external' | 'excel';
    sourceFormId?: string;
    sourceField?: string;
    externalSourceId?: string;
    matchField?: string;
    filterField?: string;
    filterValue?: string;
    multiple?: boolean;
    displayFields?: string[];
    excelUrl?: string;
  };
  onChange: (config: LookupSelectorProps['config']) => void;
  availableFields?: { id: string; name: string; label: string }[];
}

export function LookupSelector({ config, onChange, availableFields = [] }: LookupSelectorProps) {
  const { forms, externalDataSources } = useConfigStore();
  const [selectedForm, setSelectedForm] = useState<string>(config.sourceFormId || '');
  const [testValue, setTestValue] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const hasAutoSuggested = useRef(false);

  const sourceType = config.sourceType || 'internal';

  const handleTest = async () => {
    if (!testValue) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      if (sourceType === 'internal' && selectedForm) {
        const sourceForm = forms.find(f => f.id === selectedForm);
        if (sourceForm) {
          const moduleKeyMap: Record<string, string> = {
            'ncr': 'ncr', 'capa': 'capa', '8d': 'eight-d', 'fmea': 'fmea',
            'complaint': 'complaints', 'supplier': 'suppliers', 'audit': 'audits',
            'inspection': 'inspections', 'calibration': 'calibrations', 'defect-log': 'defect-logs'
          };
          const apiKey = moduleKeyMap[sourceForm.type] as any;
          const api = (unifiedApiRegistry as any)[apiKey];
          
          if (api) {
            const res = await api.getAll({ search: testValue, limit: 10 });
            const row = res.data.find((r: any) => String(r[config.matchField || 'id']) === String(testValue));
            if (row) {
              setTestResult(`Success! Found: ${row[config.sourceField || 'name'] || 'Empty Value'}`);
            } else {
              setTestResult('No matching record found in this form.');
            }
          }
        }
      } else if (sourceType === 'external' && config.externalSourceId) {
        const ds = externalDataSources.find(s => s.id === config.externalSourceId);
        if (ds && ds.data) {
          const row = ds.data.find((r: any) => String(r[config.matchField || 'id']) === String(testValue));
          if (row) {
            setTestResult(`Success! Found: ${row[config.sourceField || 'name'] || 'Empty Value'}`);
          } else {
            setTestResult('No matching record found in source data.');
          }
        }
      } else {
        setTestResult('Testing for Excel/Direct URL is not yet available in preview.');
      }
    } catch (e) {
      setTestResult('Error: Failed to connect or search.');
    } finally {
      setIsTesting(false);
    }
  };

  const availableForms = useMemo(() => 
    forms.filter((f: DynamicForm) => f.isActive),
  [forms]);
  
  const sourceFields = useMemo(() => {
    if (sourceType === 'internal') {
      return selectedForm 
        ? availableForms.find((f: DynamicForm) => f.id === selectedForm)?.fields || []
        : [];
    } else {
      const ds = externalDataSources.find(s => s.id === config.externalSourceId);
      if (ds && ds.data && ds.data.length > 0) {
        return Object.keys(ds.data[0]).map(key => ({ id: key, name: key, label: key, type: 'text' }));
      }
      return [];
    }
  }, [sourceType, selectedForm, config.externalSourceId, externalDataSources, availableForms]);

  const triggerField = useMemo(() => 
    availableFields.find(f => f.name === config.filterValue),
  [availableFields, config.filterValue]);

  // Auto-suggestion logic with loop protection
  useEffect(() => {
    const shouldSuggest = (selectedForm || config.externalSourceId || config.excelUrl) && 
                         config.filterValue && 
                         !config.matchField && 
                         sourceFields.length > 0 &&
                         !hasAutoSuggested.current;

    if (shouldSuggest) {
      const triggerName = String(config.filterValue || '').toLowerCase();
      const bestMatch = sourceFields.find(f => {
        const name = String(f?.name || '').toLowerCase();
        return name === triggerName || 
               name === 'id' || 
               name.includes(triggerName);
      });
      
      if (bestMatch) {
        hasAutoSuggested.current = true;
        onChange({ ...config, matchField: bestMatch.name });
      }
    }
    
    // Reset the ref if the source or trigger changes, to allow new suggestions
    if (!config.matchField) {
      hasAutoSuggested.current = false;
    }
  }, [selectedForm, config.externalSourceId, config.excelUrl, config.filterValue, sourceFields, config.matchField, onChange, config]);

  const handleSourceTypeChange = (type: 'internal' | 'external' | 'excel') => {
    onChange({
      ...config,
      sourceType: type,
      sourceFormId: undefined,
      externalSourceId: undefined,
      sourceField: undefined,
      matchField: undefined
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. Step: Trigger */}
      <div className="pro-card p-4 border-[#0066CC]/20 bg-[#0066CC]/5 rounded-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
          <Zap className="w-8 h-8 text-[#00A3E0]" />
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#0066CC] flex items-center justify-center shadow-lg shadow-[#0066CC]/30">
            <Link className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest">Step 1: Trigger Field</h4>
            <p className="text-[10px] text-white/40 uppercase tracking-tighter">The value that starts the lookup</p>
          </div>
        </div>

        <select
          value={config.filterValue || ''}
          onChange={(e) => onChange({ ...config, filterValue: e.target.value })}
          className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:border-[#00A3E0] outline-none transition-all appearance-none"
        >
          <option value="" className="bg-[#1a1a1f]">Select field from this form...</option>
          {availableFields.map((f) => (
            <option key={f.id} value={f.name} className="bg-[#1a1a1f]">
              {f.label} (@{f.name})
            </option>
          ))}
        </select>
      </div>

      {/* 2. Step: Source */}
      <div className="pro-card p-4 border-white/10 bg-white/2 rounded-2xl space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <Database className="w-4 h-4 text-[#00A3E0]" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest">Step 2: Data Source</h4>
            <p className="text-[10px] text-white/40 uppercase tracking-tighter">Where to find the information</p>
          </div>
        </div>

        <div className="flex gap-2 p-1.5 bg-black/30 rounded-xl border border-white/5">
          <button
            onClick={() => handleSourceTypeChange('internal')}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
              sourceType === 'internal' ? 'bg-[#0066CC] text-white shadow-lg' : 'text-white/40 hover:text-white'
            }`}
          >
            Other Forms
          </button>
          <button
            onClick={() => handleSourceTypeChange('external')}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
              sourceType === 'external' ? 'bg-[#0066CC] text-white shadow-lg' : 'text-white/40 hover:text-white'
            }`}
          >
            Imported Data
          </button>
          <button
            onClick={() => handleSourceTypeChange('excel')}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
              sourceType === 'excel' ? 'bg-[#0066CC] text-white shadow-lg' : 'text-white/40 hover:text-white'
            }`}
          >
            Direct Excel
          </button>
        </div>

        {sourceType === 'internal' && (
          <select
            value={selectedForm}
            onChange={(e) => {
              setSelectedForm(e.target.value);
              onChange({ ...config, sourceFormId: e.target.value });
            }}
            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:border-[#00A3E0] outline-none appearance-none"
          >
            <option value="" className="bg-[#1a1a1f]">Select a form...</option>
            {availableForms.map((form: DynamicForm) => (
              <option key={form.id} value={form.id} className="bg-[#1a1a1f]">
                {form.name}
              </option>
            ))}
          </select>
        )}

        {sourceType === 'external' && (
          <select
            value={config.externalSourceId || ''}
            onChange={(e) => onChange({ ...config, externalSourceId: e.target.value })}
            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:border-[#00A3E0] outline-none appearance-none"
          >
            <option value="" className="bg-[#1a1a1f]">Select a source...</option>
            {externalDataSources.map((ds) => (
              <option key={ds.id} value={ds.id} className="bg-[#1a1a1f]">
                {ds.name} ({ds.type.toUpperCase()})
              </option>
            ))}
          </select>
        )}

        {sourceType === 'excel' && (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter Excel/CSV Public URL..."
              value={config.excelUrl || ''}
              onChange={(e) => onChange({ ...config, excelUrl: e.target.value })}
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:border-[#00A3E0] outline-none transition-all"
            />
            <p className="text-[10px] text-white/40 px-2 italic flex items-center gap-1">
              <Info className="w-3 h-3" /> Note: Ensure the file is publicly accessible via CORS.
            </p>
          </div>
        )}
      </div>

      {/* 3. Step: Mapping */}
      {(selectedForm || config.externalSourceId) && (
        <div className="pro-card p-4 border-green-500/20 bg-green-500/5 rounded-2xl space-y-4 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-600/20 flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-widest">Step 3: Field Mapping</h4>
              <p className="text-[10px] text-white/40 uppercase tracking-tighter">Match values and get results</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="p-3 bg-black/20 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Match Value In Source</label>
                {config.matchField && <span className="text-[9px] text-green-400 font-bold uppercase tracking-tighter flex items-center gap-1"><Check className="w-3 h-3" /> Auto-suggested</span>}
              </div>
              {sourceFields.length > 0 ? (
                <select
                  value={config.matchField || ''}
                  onChange={(e) => onChange({ ...config, matchField: e.target.value })}
                  className="w-full px-3 py-2 bg-transparent border-none text-white text-sm focus:ring-0 outline-none appearance-none"
                >
                  <option value="" className="bg-[#1a1a1f]">Select source field to match...</option>
                  {sourceFields.map((field: any) => (
                    <option key={field.id} value={field.name} className="bg-[#1a1a1f]">
                      {field.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Type source field name to match..."
                  value={config.matchField || ''}
                  onChange={(e) => onChange({ ...config, matchField: e.target.value })}
                  className="w-full px-3 py-2 bg-transparent border-none text-white text-sm focus:ring-0 outline-none"
                />
              )}
            </div>
            
            <div className="flex justify-center -my-2 relative z-10">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-[#00A3E0]" />
              </div>
            </div>

            <div className="p-3 bg-[#0066CC]/10 rounded-xl border border-[#0066CC]/20 space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Result To Show Here</label>
              {sourceFields.length > 0 ? (
                <select
                  value={config.sourceField || ''}
                  onChange={(e) => onChange({ ...config, sourceField: e.target.value })}
                  className="w-full px-3 py-2 bg-transparent border-none text-white text-sm focus:ring-0 outline-none appearance-none font-bold"
                >
                  <option value="" className="bg-[#1a1a1f]">Select result field...</option>
                  {sourceFields.map((field: any) => (
                    <option key={field.id} value={field.name} className="bg-[#1a1a1f]">
                      {field.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Type result field name..."
                  value={config.sourceField || ''}
                  onChange={(e) => onChange({ ...config, sourceField: e.target.value })}
                  className="w-full px-3 py-2 bg-transparent border-none text-white text-sm focus:ring-0 outline-none font-bold"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Step: Advanced Settings */}
      {(selectedForm || config.externalSourceId || config.excelUrl) && (
        <div className="pro-card p-4 border-white/10 bg-white/2 rounded-2xl space-y-4 animate-in slide-in-from-top-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-widest">Step 4: Advanced Options</h4>
              <p className="text-[10px] text-white/40 uppercase tracking-tighter">Behavior and multi-select</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-white">Multi-Record Match</p>
              <p className="text-[10px] text-white/40">Allow returning multiple values if found</p>
            </div>
            <button
              onClick={() => onChange({ ...config, multiple: !config.multiple })}
              className={`w-10 h-6 rounded-full transition-all relative ${
                config.multiple ? 'bg-[#00A3E0]' : 'bg-white/10'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                config.multiple ? 'left-5' : 'left-1'
              }`} />
            </button>
          </div>
        </div>
      )}

      {/* Logic Summary Visualization */}
      {triggerField && (selectedForm || config.externalSourceId || config.excelUrl) && config.sourceField && (
        <div className="space-y-4">
          <div className="p-5 bg-gradient-to-br from-[#1a1a25] to-black border border-white/10 rounded-[2rem] space-y-4 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent)] pointer-events-none" />
            <div className="relative z-10">
              <h5 className="text-[10px] font-black text-[#00A3E0] uppercase tracking-[0.2em] mb-4 text-center">Data Logic Preview</h5>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 p-3 bg-white/5 rounded-2xl border border-white/10 text-center">
                  <p className="text-[9px] text-white/40 uppercase font-black mb-1">When user enters</p>
                  <p className="text-sm font-black text-white">{triggerField.label}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-white/20 animate-pulse" />
                <div className="flex-1 p-3 bg-[#00A3E0]/10 rounded-2xl border border-[#00A3E0]/30 text-center">
                  <p className="text-[9px] text-[#00A3E0] uppercase font-black mb-1">Fill this field with</p>
                  <p className="text-sm font-black text-white">{sourceFields.find(f => f.name === config.sourceField)?.label || config.sourceField}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-center gap-2">
                <Info className="w-3 h-3 text-white/20" />
                <p className="text-[9px] text-white/20 font-medium">Looking up from: {sourceType === 'internal' ? availableForms.find(f => f.id === selectedForm)?.name : (sourceType === 'external' ? externalDataSources.find(s => s.id === config.externalSourceId)?.name : 'Excel Source')}</p>
              </div>
            </div>
          </div>

          {/* Test Sandbox */}
          <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Search className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Sandbox Test</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={`Enter a ${triggerField.label} value to test...`}
                value={testValue}
                onChange={(e) => setTestValue(e.target.value)}
                className="flex-1 px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-xs text-white focus:border-amber-500 outline-none"
              />
              <button
                onClick={handleTest}
                disabled={isTesting || !testValue}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2"
              >
                {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Run Test'}
              </button>
            </div>
            {testResult && (
              <div className={`p-2 rounded-lg text-[10px] font-bold ${testResult.startsWith('Success') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {testResult}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LookupSelector;
