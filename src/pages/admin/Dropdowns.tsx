// QMS Enterprise 4.0 - Dropdown Lists Page
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  List,
  RefreshCw,
  Database,
  ChevronDown,
  Check
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useConfigStore, type OptionSet, type FieldOption } from '../../stores/configStore';

const presetOrder: Array<OptionSet['id']> = [
  'factories',
  'lines',
  'departments',
  'products',
  'defect-types',
  'root-causes'
];

function moveItem<T>(arr: T[], from: number, to: number) {
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export default function DropdownsAdminPage() {
  const { optionSets, upsertOptionSet, updateOptionSetItems, deleteOptionSet } = useConfigStore();

  const orderedSets = useMemo(() => {
    const byId = new Map(optionSets.map((s) => [s.id, s] as const));
    const ordered: OptionSet[] = [];

    for (const id of presetOrder) {
      const s = byId.get(id);
      if (s) ordered.push(s);
    }

    for (const s of optionSets) {
      if (!presetOrder.includes(s.id)) ordered.push(s);
    }

    return ordered;
  }, [optionSets]);

  const [activeSetId, setActiveSetId] = useState<OptionSet['id']>('factories');
  const [query, setQuery] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newLabel, setNewLabel] = useState('');

  useEffect(() => {
    if (orderedSets.length > 0 && !orderedSets.some((s: OptionSet) => s.id === activeSetId)) {
      setActiveSetId(orderedSets[0].id);
    }
  }, [activeSetId, orderedSets]);

  const activeSet = orderedSets.find((s) => s.id === activeSetId);

  const filteredItems = useMemo(() => {
    const items = activeSet?.items || [];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i: FieldOption) => i.value.toLowerCase().includes(q) || i.label.toLowerCase().includes(q));
  }, [activeSet, query]);

  const handleAdd = () => {
    if (!activeSet) return;
    const value = newValue.trim();
    const label = newLabel.trim();
    if (!value || !label) {
      toast.error('Value and Label are required');
      return;
    }

    if (activeSet.items.some((i) => i.value === value)) {
      toast.error('Value already exists');
      return;
    }

    updateOptionSetItems(activeSet.id, [...activeSet.items, { value, label }]);
    setNewValue('');
    setNewLabel('');
    toast.success('Option added');
  };

  const handleUpdateItem = (idx: number, updates: Partial<FieldOption>) => {
    if (!activeSet) return;
    const items = [...activeSet.items];
    items[idx] = { ...items[idx], ...updates };
    updateOptionSetItems(activeSet.id, items);
  };

  const handleDeleteItem = (idx: number) => {
    if (!activeSet) return;
    const items = activeSet.items.filter((_: FieldOption, i: number) => i !== idx);
    updateOptionSetItems(activeSet.id, items);
  };

  const handleMove = (idx: number, direction: -1 | 1) => {
    if (!activeSet) return;
    updateOptionSetItems(activeSet.id, moveItem(activeSet.items, idx, idx + direction));
  };

  const handleCreateCustomList = () => {
    const id = `list-${Date.now()}`;
    upsertOptionSet({
      id,
      name: 'New List',
      items: []
    });
    setActiveSetId(id);
    toast.success('List created');
  };

  const handleDeleteList = () => {
    if (!activeSet) return;
    if (presetOrder.includes(activeSet.id)) {
      toast.error('Default lists cannot be deleted');
      return;
    }
    deleteOptionSet(activeSet.id);
    const next = orderedSets.find((s) => s.id !== activeSet.id);
    if (next) setActiveSetId(next.id);
    toast.success('List deleted');
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#0066CC]/20 to-[#00A3E0]/20 border border-[#0066CC]/30">
            <Database className="w-6 h-6 text-[#00A3E0]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Dropdown Lists</h1>
            <p className="text-sm text-gray-400">Central datasets used by select/radio fields across modules</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => toast.success('Refreshed')}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={handleCreateCustomList}
            className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New List
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDeleteList}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs value={activeSetId} onValueChange={(v) => setActiveSetId(v as OptionSet['id'])} className="w-full">
        <TabsList className="bg-white/5 border border-white/10 p-1 flex-wrap gap-1 sticky top-0 z-10">
          {orderedSets.map((s) => (
            <TabsTrigger 
              key={s.id} 
              value={s.id} 
              className="data-[state=active]:bg-[#0066CC] data-[state=active]:text-white"
            >
              <List className="w-4 h-4 mr-2" />
              {s.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Active List Selector - Always Visible */}
        <div className="mt-4 p-3 rounded-lg border border-[#0066CC]/30 bg-[#0066CC]/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0066CC]/20">
              <List className="w-5 h-5 text-[#00A3E0]" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Currently Editing</p>
              <p className="text-white font-medium">{activeSet?.name || 'Select a list'}</p>
            </div>
          </div>
          
          {/* Quick List Switcher */}
          <div className="relative group">
            <Button 
              variant="outline" 
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <ChevronDown className="w-4 h-4 mr-2" />
              Switch List
            </Button>
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-56 py-2 rounded-lg border border-white/10 bg-[#1a1f2e] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <p className="px-3 py-1 text-xs text-gray-500 uppercase">Select List</p>
              {orderedSets.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSetId(s.id)}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-white/5 ${
                    activeSetId === s.id ? 'text-[#00A3E0]' : 'text-gray-300'
                  }`}
                >
                  <span>{s.name}</span>
                  {activeSetId === s.id && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {orderedSets.map((s) => (
          <TabsContent key={s.id} value={s.id} className="mt-6 space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">List Name</label>
                  <input
                    value={s.name}
                    onChange={(e) => upsertOptionSet({ ...s, name: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-white/10 bg-transparent text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={activeSetId === s.id ? query : ''}
                      onChange={(e) => activeSetId === s.id && setQuery(e.target.value)}
                      placeholder="Search value or label..."
                      className="w-full pl-10 pr-3 py-2 rounded border border-white/10 bg-transparent text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Value</label>
                    <input
                      value={activeSetId === s.id ? newValue : ''}
                      onChange={(e) => activeSetId === s.id && setNewValue(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-white/10 bg-transparent text-white"
                      placeholder="e.g. factory-a"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Label</label>
                    <input
                      value={activeSetId === s.id ? newLabel : ''}
                      onChange={(e) => activeSetId === s.id && setNewLabel(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-white/10 bg-transparent text-white"
                      placeholder="e.g. Factory A"
                    />
                  </div>
                  <Button
                    onClick={handleAdd}
                    className="bg-[#0066CC] hover:bg-[#0052a3]"
                    disabled={activeSetId !== s.id}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {(activeSetId === s.id ? filteredItems : s.items).map((item: FieldOption, idx: number) => (
                  <div key={`${item.value}-${idx}`} className="flex items-center gap-2 p-3 rounded-lg border border-white/10 bg-white/5">
                    <input
                      value={item.value}
                      onChange={(e) => activeSetId === s.id && handleUpdateItem(idx, { value: e.target.value })}
                      className="flex-1 px-3 py-2 rounded border border-white/10 bg-transparent text-white text-sm"
                      disabled={activeSetId !== s.id}
                    />
                    <input
                      value={item.label}
                      onChange={(e) => activeSetId === s.id && handleUpdateItem(idx, { label: e.target.value })}
                      className="flex-1 px-3 py-2 rounded border border-white/10 bg-transparent text-white text-sm"
                      disabled={activeSetId !== s.id}
                    />
                    <Button
                      variant="secondary"
                      onClick={() => handleMove(idx, -1)}
                      disabled={activeSetId !== s.id}
                      className="px-2"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleMove(idx, 1)}
                      disabled={activeSetId !== s.id}
                      className="px-2"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => activeSetId === s.id && handleDeleteItem(idx)}
                      disabled={activeSetId !== s.id}
                      className="px-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
