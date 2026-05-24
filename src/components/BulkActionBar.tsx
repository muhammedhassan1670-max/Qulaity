/**
 * QMS Enterprise 4.0 - Bulk Action Bar Component
 * Actions for selected items with export functionality
 */

import { 
  Trash2, 
  Download, 
  Mail, 
  CheckCircle2,
  FileSpreadsheet,
  FileJson,
  Printer
} from 'lucide-react';
import { useState } from 'react';

interface BulkActionBarProps {
  selectedCount: number;
  onDelete?: () => void;
  onExport?: (format: 'csv' | 'json' | 'excel') => void;
  onEmail?: () => void;
  onApprove?: () => void;
  onClearSelection: () => void;
  itemName?: string;
}

export function BulkActionBar({
  selectedCount,
  onDelete,
  onExport,
  onEmail,
  onApprove,
  onClearSelection,
  itemName = 'items'
}: BulkActionBarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="glass-panel rounded-xl p-4 animate-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        {/* Selection Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#0066CC] text-white text-xs flex items-center justify-center font-medium">
              {selectedCount}
            </span>
            <span className="text-sm text-gray-300">
              {selectedCount === 1 ? itemName.slice(0, -1) : itemName} selected
            </span>
          </div>
          
          <button
            onClick={onClearSelection}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Clear selection
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Approve Action */}
          {onApprove && (
            <button
              onClick={onApprove}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">Approve</span>
            </button>
          )}

          {/* Email Action */}
          {onEmail && (
            <button
              onClick={onEmail}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors text-sm"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Email</span>
            </button>
          )}

          {/* Export Dropdown */}
          {onExport && (
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {showExportMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 glass-panel rounded-xl p-2 z-50 animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => {
                        onExport('excel');
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-green-400" />
                      Excel (.xlsx)
                    </button>
                    <button
                      onClick={() => {
                        onExport('csv');
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors"
                    >
                      <FileJson className="w-4 h-4 text-blue-400" />
                      CSV (.csv)
                    </button>
                    <button
                      onClick={() => {
                        onExport('json');
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors"
                    >
                      <FileJson className="w-4 h-4 text-yellow-400" />
                      JSON (.json)
                    </button>
                    <div className="border-t border-white/10 my-1" />
                    <button
                      onClick={() => {
                        window.print();
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors"
                    >
                      <Printer className="w-4 h-4 text-gray-400" />
                      Print
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Delete Action */}
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default BulkActionBar;
