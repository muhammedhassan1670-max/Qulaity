/**
 * QMS Enterprise 4.0 - Filter Panel Component
 * Advanced filtering with date ranges, multi-select, and clear options
 */

import { useState } from 'react';
import { X, Filter, Calendar, ChevronDown } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  color?: string;
}

export interface FilterGroup {
  key: string;
  title: string;
  options: FilterOption[];
  multi?: boolean;
}

interface FilterPanelProps {
  filters: FilterGroup[];
  activeFilters: Record<string, string | string[]>;
  onFilterChange: (key: string, value: string | string[] | null) => void;
  onClearAll: () => void;
  dateRange?: { from: string | null; to: string | null };
  onDateRangeChange?: (range: { from: string | null; to: string | null }) => void;
}

export function FilterPanel({
  filters,
  activeFilters,
  onFilterChange,
  onClearAll,
  dateRange,
  onDateRangeChange
}: FilterPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(
    filters.map(f => f.key)
  );
  const [showDateFilter, setShowDateFilter] = useState(false);

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0 || 
    (dateRange?.from || dateRange?.to);

  const activeFilterCount = Object.values(activeFilters).filter(v => 
    v && (Array.isArray(v) ? v.length > 0 : true)
  ).length + (dateRange?.from || dateRange?.to ? 1 : 0);

  return (
    <div className="glass-panel rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#00A3E0]" />
          <span className="text-sm font-medium text-white">Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-[#0066CC] text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Date Range Filter */}
      {onDateRangeChange && (
        <div className="border-t border-white/10 pt-4">
          <button
            onClick={() => setShowDateFilter(!showDateFilter)}
            className="flex items-center justify-between w-full text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date Range
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showDateFilter ? 'rotate-180' : ''}`} />
          </button>
          
          {showDateFilter && (
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">From</label>
                  <input
                    type="date"
                    value={dateRange?.from || ''}
                    onChange={(e) => onDateRangeChange?.({
                      from: e.target.value || null,
                      to: dateRange?.to || null
                    })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">To</label>
                  <input
                    type="date"
                    value={dateRange?.to || ''}
                    onChange={(e) => onDateRangeChange?.({
                      from: dateRange?.from || null,
                      to: e.target.value || null
                    })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Groups */}
      {filters.map((group) => {
        const isExpanded = expandedGroups.includes(group.key);
        const activeValue = activeFilters[group.key];
        const activeCount = Array.isArray(activeValue) ? activeValue.length : activeValue ? 1 : 0;

        return (
          <div key={group.key} className="border-t border-white/10 pt-4">
            <button
              onClick={() => toggleGroup(group.key)}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              <span>{group.title}</span>
              <div className="flex items-center gap-2">
                {activeCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-[#0066CC]/20 text-[#00A3E0] text-xs rounded">
                    {activeCount}
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>
            
            {isExpanded && (
              <div className="mt-3 space-y-1">
                {group.options.map((option) => {
                  const isActive = group.multi 
                    ? (activeValue as string[])?.includes(option.value)
                    : activeValue === option.value;

                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        if (group.multi) {
                          const current = (activeValue as string[]) || [];
                          const updated = current.includes(option.value)
                            ? current.filter(v => v !== option.value)
                            : [...current, option.value];
                          onFilterChange(group.key, updated.length > 0 ? updated : null);
                        } else {
                          onFilterChange(
                            group.key, 
                            isActive ? null : option.value
                          );
                        }
                      }}
                      className={`
                        w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
                        ${isActive 
                          ? 'bg-[#0066CC]/20 text-[#00A3E0]' 
                          : 'text-gray-400 hover:bg-white/5 hover:text-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        {option.color && (
                          <span 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: option.color }}
                          />
                        )}
                        <span>{option.label}</span>
                      </div>
                      {option.count !== undefined && (
                        <span className={`text-xs ${isActive ? 'text-[#00A3E0]' : 'text-gray-600'}`}>
                          {option.count}
                        </span>
                      )}
                      {isActive && !group.multi && (
                        <X className="w-3.5 h-3.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default FilterPanel;
