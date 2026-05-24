/**
 * QMS Enterprise 4.0 - Professional Data Table Component
 * Advanced table with sorting, pagination, selection, and bulk actions
 */

import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown,
  CheckSquare,
  Square,
  Search,
  Filter
} from 'lucide-react';

export interface Column<T> {
  key: string;
  title: string;
  width?: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  selectedItems?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  actions?: (item: T) => React.ReactNode;
  emptyState?: React.ReactNode;
  pageSize?: number;
  className?: string;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  filterOptions?: Array<{ label: string; value: string }>;
  onFilterChange?: (value: string) => void;
  activeFilter?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  selectedItems = [],
  onSelectionChange,
  actions,
  emptyState,
  pageSize = 10,
  className = '',
  onSearch,
  searchQuery = '',
  filterOptions = [],
  onFilterChange,
  activeFilter
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    
    return [...data].sort((a, b) => {
      let aValue = getNestedValue(a, sortConfig.key);
      let bValue = getNestedValue(b, sortConfig.key);
      
      // Safe conversion for objects to strings for comparison
      if (typeof aValue === 'object' && aValue !== null) {
        aValue = aValue.label || aValue.name || String(aValue);
      }
      if (typeof bValue === 'object' && bValue !== null) {
        bValue = bValue.label || bValue.name || String(bValue);
      }
      
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
    setCurrentPage(1);
  };

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;
    
    const currentPageIds = paginatedData.map(keyExtractor);
    const allSelected = currentPageIds.every(id => selectedItems.includes(id));
    
    if (allSelected) {
      onSelectionChange(selectedItems.filter(id => !currentPageIds.includes(id)));
    } else {
      const newSelection = [...new Set([...selectedItems, ...currentPageIds])];
      onSelectionChange(newSelection);
    }
  };

  const toggleSelect = (id: string) => {
    if (!onSelectionChange) return;
    
    if (selectedItems.includes(id)) {
      onSelectionChange(selectedItems.filter(sid => sid !== id));
    } else {
      onSelectionChange([...selectedItems, id]);
    }
  };

  const allCurrentSelected = paginatedData.length > 0 && 
    paginatedData.every(item => selectedItems.includes(keyExtractor(item)));

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filters - Stack on mobile */}
      {(onSearch || filterOptions.length > 0) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
          {onSearch && (
            <div className="relative w-full sm:w-80 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#00A3E0] transition-colors" />
              <input
                type="text"
                placeholder="Quick search..."
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#00A3E0] transition-all"
              />
            </div>
          )}
          
          {filterOptions.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 sm:pb-0 no-scrollbar">
              <Filter className="w-4 h-4 text-gray-500 shrink-0" />
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onFilterChange?.(option.value)}
                  className={`
                    px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all shrink-0
                    ${activeFilter === option.value
                      ? 'bg-[#00A3E0]/20 border-[#00A3E0]/50 text-[#00A3E0]'
                      : 'bg-white/5 border-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table Container - Scrollable on mobile */}
      <div className="relative overflow-x-auto rounded-[2rem] glass-panel border border-white/5 no-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-white/[0.02]">
            <tr>
              {/* Selection Checkbox */}
              {onSelectionChange && (
                <th className="px-4 py-5 w-10 text-center">
                  <button
                    onClick={toggleSelectAll}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors inline-flex"
                  >
                    {allCurrentSelected ? (
                      <CheckSquare className="w-5 h-5 text-[#00A3E0]" />
                    ) : (
                      <Square className="w-5 h-5 text-white/10" />
                    )}
                  </button>
                </th>
              )}
                
              {/* Column Headers */}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-5 text-left text-[10px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/5 ${
                    column.sortable ? 'cursor-pointer hover:text-[#00A3E0] transition-colors' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.title}
                    {column.sortable && (
                      <span className="text-gray-600">
                        {sortConfig?.key === column.key ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-[#00A3E0]" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-[#00A3E0]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
                
              {/* Actions Column */}
              {actions && (
                <th className="px-6 py-5 text-right text-[10px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/5 w-24">
                  Actions
                </th>
              )}
            </tr>
          </thead>
            
          <tbody className="divide-y divide-white/[0.02]">
            {paginatedData.map((item, index) => {
              const id = keyExtractor(item);
              const isSelected = selectedItems.includes(id);
              
              return (
                <tr
                  key={id}
                  className={`
                    transition-all duration-300 group
                    ${onRowClick ? 'cursor-pointer' : ''}
                    ${isSelected ? 'bg-[#00A3E0]/10' : 'hover:bg-white/[0.03]'}
                  `}
                  onClick={() => onRowClick?.(item)}
                  style={{ 
                    animationDelay: `${index * 40}ms`,
                    animation: 'slideIn 0.5s ease-out forwards'
                  }}
                >
                  {/* Selection */}
                  {onSelectionChange && (
                    <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleSelect(id)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors inline-flex"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-[#00A3E0]" />
                        ) : (
                          <Square className="w-5 h-5 text-white/10 group-hover:text-white/30" />
                        )}
                      </button>
                    </td>
                  )}
                    
                  {/* Data Cells */}
                  {columns.map((column) => {
                    const value = getNestedValue(item, column.key);
                    const displayValue = typeof value === 'object' && value !== null 
                      ? (value.label || value.name || JSON.stringify(value)) 
                      : (value || '-');

                    return (
                      <td key={column.key} className="px-6 py-5">
                        {column.render ? (
                          <div className="flex items-center">
                            {column.render(item)}
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                            {String(displayValue)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                    
                  {/* Actions */}
                  {actions && (
                    <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {actions(item)}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
          <p className="text-sm text-gray-400 order-2 sm:order-1">
            Showing <span className="text-white font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="text-white font-medium">{Math.min(currentPage * pageSize, sortedData.length)}</span> of{' '}
            <span className="text-white font-medium">{sortedData.length}</span> entries
          </p>
          
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => 
                  page === 1 || 
                  page === totalPages || 
                  Math.abs(page - currentPage) <= 1
                )
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="text-gray-600 px-1">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`
                        w-9 h-9 rounded-lg text-sm font-medium transition-colors
                        ${currentPage === page
                          ? 'bg-[#0066CC] text-white shadow-lg shadow-[#0066CC]/20'
                          : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                        }
                      `}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to get nested object values
function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

export default DataTable;
