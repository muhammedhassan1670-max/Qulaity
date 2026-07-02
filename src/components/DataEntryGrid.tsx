import React, { useState, useCallback } from 'react';
import type { ClipboardEvent } from 'react';
import type { DynamicForm } from '../stores/configStore';
import { Button } from '@/components/ui/button';
import { Plus, Save, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

interface DataEntryGridProps {
  formConfig: DynamicForm;
  onSubmitAll: (records: Record<string, unknown>[]) => void;
  role?: string;
  mode?: string;
}

export const DataEntryGrid: React.FC<DataEntryGridProps> = ({ formConfig, onSubmitAll }) => {
  const [records, setRecords] = useState<Record<string, unknown>[]>([{}]);

  // Only show fields that are editable and visible (basic check)
  const columns = formConfig.fields.filter(f => !['section', 'formula', 'lookup', 'signature', 'file'].includes(f.type));

  const handleCellChange = (rowIndex: number, fieldName: string, value: string) => {
    const newRecords = [...records];
    newRecords[rowIndex] = { ...newRecords[rowIndex], [fieldName]: value };
    setRecords(newRecords);
  };

  const handleAddRow = () => {
    setRecords([...records, {}]);
  };

  const handlePaste = useCallback((e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const clipboardData = e.clipboardData.getData('text/plain');
    if (!clipboardData) return;

    const rows = clipboardData.split('\n').map(row => row.split('\t'));
    if (rows.length === 0) return;

    const newRecords = [...records];
    // We assume the user pasted starting from the currently selected cell, but for simplicity, 
    // we just append the pasted rows as new records based on column order.
    
    rows.forEach(rowCells => {
      if (rowCells.length === 1 && rowCells[0].trim() === '') return; // Skip empty rows
      
      const newRecord: Record<string, unknown> = {};
      columns.forEach((col, idx) => {
        if (rowCells[idx] !== undefined) {
          newRecord[col.name] = rowCells[idx].trim();
        }
      });
      newRecords.push(newRecord);
    });

    // Remove the initial empty row if we are pasting and it's untouched
    if (newRecords[0] && Object.keys(newRecords[0]).length === 0) {
      newRecords.shift();
    }

    setRecords(newRecords);
    toast.success(`Pasted ${rows.length} rows from Excel`);
  }, [columns, records]);

  return (
    <div className="w-full space-y-4" onPaste={handlePaste}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/50 text-sm">
          <FileSpreadsheet className="w-4 h-4 text-green-400" />
          <span>Excel-Grid Mode Active. You can directly copy & paste rows from Excel here!</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAddRow} className="border-white/10 text-white hover:bg-white/5">
            <Plus className="w-4 h-4 mr-2" /> Add Row
          </Button>
          <Button size="sm" onClick={() => onSubmitAll(records)} className="bg-[#00A3E0] hover:bg-[#0082b3] text-white">
            <Save className="w-4 h-4 mr-2" /> Submit All ({records.length})
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 pb-16">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/5 uppercase text-[10px] tracking-wider text-white/40 border-b border-white/10">
            <tr>
              <th className="px-4 py-3 w-12 text-center">#</th>
              {columns.map(col => (
                <th key={col.id} className="px-4 py-3 font-medium">
                  {col.label} {col.validation?.required && <span className="text-red-500">*</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {records.map((record, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-white/5 transition-colors group">
                <td className="px-4 py-2 text-center text-white/30 font-mono text-xs">
                  {rowIndex + 1}
                </td>
                {columns.map(col => (
                  <td key={col.id} className="p-0 border-x border-white/5">
                    {col.type === 'select' || col.type === 'radio' ? (
                      <select 
                        value={String(record[col.name] || '')}
                        onChange={e => handleCellChange(rowIndex, col.name, e.target.value)}
                        className="w-full h-full min-h-[36px] bg-transparent text-white px-4 py-2 focus:bg-[#00A3E0]/10 focus:outline-none transition-colors appearance-none"
                      >
                        <option value="" className="text-black">Select...</option>
                        {col.options?.map(opt => (
                          <option key={opt.value} value={opt.value} className="text-black">{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type={col.type === 'number' ? 'number' : 'text'}
                        value={String(record[col.name] || '')}
                        onChange={e => handleCellChange(rowIndex, col.name, e.target.value)}
                        placeholder="..."
                        className="w-full h-full min-h-[36px] bg-transparent text-white px-4 py-2 focus:bg-[#00A3E0]/10 focus:outline-none transition-colors placeholder:text-white/10"
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
