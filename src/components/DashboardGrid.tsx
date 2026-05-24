/**
 * DashboardGrid — Drag & Drop widget layout with localStorage persistence
 * Uses native HTML5 Drag and Drop API (no extra dependencies needed)
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GripVertical, Minus, Plus, RotateCcw } from 'lucide-react';

export interface WidgetConfig {
  id: string;
  title: string;
  /** Grid column span: 1 = 25%, 2 = 50%, 3 = 75%, 4 = 100% of 4-column grid */
  colSpan?: 1 | 2 | 3 | 4;
  visible: boolean;
}

interface DashboardGridProps {
  storageKey: string;
  defaultLayout: WidgetConfig[];
  children: (widget: WidgetConfig, index: number) => React.ReactNode;
  /** Show an edit toolbar so the user can toggle / reorder widgets */
  editable?: boolean;
}

const SPAN_CLASSES: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-1 md:col-span-2',
  3: 'col-span-1 md:col-span-3',
  4: 'col-span-1 md:col-span-4',
};

export function DashboardGrid({
  storageKey,
  defaultLayout,
  children,
  editable = true,
}: DashboardGridProps) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: WidgetConfig[] = JSON.parse(saved);
        // Merge: keep any new widgets from defaultLayout
        const ids = new Set(parsed.map((w) => w.id));
        const merged = [
          ...parsed,
          ...defaultLayout.filter((w) => !ids.has(w.id)),
        ];
        return merged;
      }
    } catch {/* ignore */}
    return defaultLayout;
  });

  const [editMode, setEditMode] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // Persist on every change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(widgets));
  }, [widgets, storageKey]);

  const handleDragStart = useCallback((index: number) => {
    dragIndex.current = index;
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      setDragOver(index);
    },
    [],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      const fromIndex = dragIndex.current;
      if (fromIndex === null || fromIndex === toIndex) return;

      setWidgets((prev) => {
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });

      dragIndex.current = null;
      setDragOver(null);
    },
    [],
  );

  const handleDragEnd = useCallback(() => {
    dragIndex.current = null;
    setDragOver(null);
  }, []);

  const toggleVisible = (id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)),
    );
  };

  const changeSpan = (id: string, delta: 1 | -1) => {
    setWidgets((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        const current = w.colSpan ?? 2;
        const next = Math.min(4, Math.max(1, current + delta)) as 1 | 2 | 3 | 4;
        return { ...w, colSpan: next };
      }),
    );
  };

  const resetLayout = () => {
    localStorage.removeItem(storageKey);
    setWidgets(defaultLayout);
  };

  const visibleWidgets = editMode ? widgets : widgets.filter((w) => w.visible);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {editable && (
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={resetLayout}
            title="Reset layout"
            className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setEditMode((e) => !e)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${
              editMode
                ? 'bg-[#0066CC] text-white'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {editMode ? 'Done Editing' : 'Customize Layout'}
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {visibleWidgets.map((widget, index) => (
          <div
            key={widget.id}
            className={`${SPAN_CLASSES[widget.colSpan ?? 2]} transition-all duration-300 ${
              dragOver === index ? 'ring-2 ring-[#00A3E0] ring-offset-1 ring-offset-transparent rounded-xl' : ''
            } ${!widget.visible && editMode ? 'opacity-40' : 'opacity-100'}`}
            draggable={editMode}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            {/* Widget wrapper with edit controls */}
            <div className="relative h-full group/widget">
              {editMode && (
                <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 opacity-0 group-hover/widget:opacity-100 transition-opacity">
                  {/* Drag handle */}
                  <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-white">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest truncate mx-2">
                    {widget.title}
                  </span>

                  <div className="flex items-center gap-1">
                    {/* Shrink */}
                    <button
                      onClick={() => changeSpan(widget.id, -1)}
                      disabled={(widget.colSpan ?? 2) <= 1}
                      className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-30"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    {/* Grow */}
                    <button
                      onClick={() => changeSpan(widget.id, 1)}
                      disabled={(widget.colSpan ?? 2) >= 4}
                      className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-30"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    {/* Toggle visibility */}
                    <button
                      onClick={() => toggleVisible(widget.id)}
                      className={`p-1 rounded text-xs font-bold ml-1 ${
                        widget.visible
                          ? 'text-green-400 hover:text-red-400'
                          : 'text-red-400 hover:text-green-400'
                      }`}
                    >
                      {widget.visible ? '●' : '○'}
                    </button>
                  </div>
                </div>
              )}
              {children(widget, index)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardGrid;
