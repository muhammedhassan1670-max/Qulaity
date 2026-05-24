// QMS Enterprise 4.0 - Unified Quality Intelligence Dashboard
import { useState, useEffect, useRef } from 'react';
import { PageHeader, PageContainer } from '../../components/PageHeader';
import { toast } from 'sonner';
import { 
  TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, Activity, Users, Target, ShieldCheck, AlertTriangle, Loader2, MessageSquareWarning, BarChart3, Bot, Sparkles, Zap, ShieldAlert, Radio, Globe, ChevronRight, Send, Terminal, Layout, Plus, Trash2, Maximize2, Save, X
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Bar, Line, Area, ComposedChart, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dashboardApi } from '../../api/unified-api';
import { useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';

// --- Types & Constants ---

type VisualType = 'line' | 'bar' | 'area' | 'pie' | 'radar' | 'composed' | 'scatter';

type WidgetType = 
  | 'kpi-grid' 
  | 'trend-chart' 
  | 'risk-matrix' 
  | 'copilot' 
  | 'plant-comparison' 
  | 'copq-analysis' 
  | 'status-pie'
  | 'complaint-trend'
  | 'health-score'
  | 'recent-actions'
  | 'supplier-risk'
  | 'pareto-defects';

interface WidgetConfig {
  id: string;
  type: WidgetType;
  visualType?: VisualType;
  w: 'full' | 'half' | 'third' | 'two-thirds' | 'quarter';
  title?: string;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'w1', type: 'health-score', w: 'full' },
  { id: 'w2', type: 'kpi-grid', w: 'full' },
  { id: 'w3', type: 'recent-actions', w: 'half' },
  { id: 'w4', type: 'trend-chart', visualType: 'area', w: 'half' },
  { id: 'w5', type: 'risk-matrix', w: 'half' },
  { id: 'w6', type: 'pareto-defects', visualType: 'bar', w: 'half' },
  { id: 'w7', type: 'plant-comparison', visualType: 'bar', w: 'full' },
];

const VISUAL_OPTIONS: { type: VisualType; label: string; icon: any }[] = [
  { type: 'line', label: 'Line Chart', icon: TrendingUp },
  { type: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { type: 'area', label: 'Area Chart', icon: Activity },
  { type: 'pie', label: 'Pie Chart', icon: PieChart },
  { type: 'radar', label: 'Radar Chart', icon: Target },
  { type: 'composed', label: 'Composed', icon: Sparkles },
];

const WIDGET_LIBRARY: { type: WidgetType; label: string; description: string; defaultWidth: WidgetConfig['w']; defaultVisual?: VisualType; icon: any }[] = [
  { type: 'health-score', label: 'Quality Score', description: 'Real-time overall quality health indicator', defaultWidth: 'full', icon: Activity },
  { type: 'kpi-grid', label: 'KPI Summary', description: 'NCR, CAPA, 8D, and Audit counts', defaultWidth: 'full', icon: Target },
  { type: 'recent-actions', label: 'Recent Activities', description: 'Live feed of recent system events and updates', defaultWidth: 'half', icon: Radio },
  { type: 'trend-chart', label: 'Quality Trends', description: 'Historical performance of quality records', defaultWidth: 'two-thirds', defaultVisual: 'area', icon: TrendingUp },
  { type: 'status-pie', label: 'Distribution', description: 'Pie chart of record status', defaultWidth: 'third', defaultVisual: 'pie', icon: PieChart },
  { type: 'risk-matrix', label: 'Risk Heatmap', description: 'Severity vs Probability matrix', defaultWidth: 'half', icon: ShieldAlert },
  { type: 'pareto-defects', label: 'Pareto Analysis', description: 'Defect types ordered by frequency (80/20 rule)', defaultWidth: 'half', defaultVisual: 'bar', icon: BarChart3 },
  { type: 'copq-analysis', label: 'COPQ Analysis', description: 'Cost of Quality financial breakdown', defaultWidth: 'half', icon: Zap },
  { type: 'supplier-risk', label: 'Supplier Quality', description: 'Risk assessment of key suppliers', defaultWidth: 'full', defaultVisual: 'radar', icon: ShieldCheck },
  { type: 'plant-comparison', label: 'Plant Benchmark', description: 'Compare performance across locations', defaultWidth: 'full', defaultVisual: 'bar', icon: Globe },
  { type: 'complaint-trend', label: 'Customer Feedback', description: 'Trend of customer complaints', defaultWidth: 'full', defaultVisual: 'line', icon: MessageSquareWarning },
];

// --- Mock Data ---
const defaultTrendData = [] as any[];

const defaultPlantData = [] as any[];

const sourceData = [] as any[];

const riskMatrixData = [] as number[][];

export default QualityIntelligencePage;
export function QualityIntelligencePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>(defaultTrendData);
  const [plantData, setPlantData] = useState<any[]>(defaultPlantData);
  const [aiChat, setAiChat] = useState<{role: 'user' | 'ai', text: string, actions?: {label: string, icon: any, onClick: () => void}[]}[]>([
    { 
      role: 'ai', 
      text: 'Hello! I am your Quality Copilot. Add real records to start analysis.',
      actions: [
        { label: 'Analyze Current Data', icon: AlertCircle, onClick: () => handleSendChat('Analyze current quality data') },
        { label: 'Optimize Layout', icon: Layout, onClick: () => setIsEditMode(true) }
      ]
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<{id: string, text: string, type: 'warning' | 'info' | 'success', action?: () => void}[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Smart Suggestions Logic ---
  useEffect(() => {
    if (isLoading || !kpis) return;

    const suggestions = [];
    if (kpis.openNCRs > 20) {
      suggestions.push({
        id: 's1',
        text: `High volume of open NCRs (${kpis.openNCRs}). Consider initiating a bulk review.`,
        type: 'warning' as const,
        action: () => navigate('/quality/records/ncr')
      });
    }
    
    if (plantData.some(p => p.quality < 90)) {
      const lowPlant = plantData.find(p => p.quality < 90);
      suggestions.push({
        id: 's2',
        text: `Plant ${lowPlant.name} quality score dropped below 90%. Audit recommended.`,
        type: 'warning' as const,
        action: () => navigate('/compliance/hub/audit')
      });
    }

    if (kpis.pendingAudits > 5) {
      suggestions.push({
        id: 's3',
        text: `You have ${kpis.pendingAudits} pending audits. Schedule them to maintain compliance.`,
        type: 'info' as const,
        action: () => navigate('/compliance/hub/audit')
      });
    }

    setSmartSuggestions(suggestions);
  }, [kpis, plantData, isLoading]);

  // --- Dashboard Logic ---

  useEffect(() => {
    const saved = localStorage.getItem('qms_dashboard_layout');
    if (saved) {
      try {
        setWidgets(JSON.parse(saved));
      } catch (e) {
        setWidgets(DEFAULT_WIDGETS);
      }
    } else {
      setWidgets(DEFAULT_WIDGETS);
    }
  }, []);

  const saveLayout = (newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets);
    localStorage.setItem('qms_dashboard_layout', JSON.stringify(newWidgets));
  };

  const addWidget = (type: WidgetType) => {
    const libItem = WIDGET_LIBRARY.find(l => l.type === type);
    const newWidget: WidgetConfig = {
      id: `w-${Date.now()}`,
      type,
      visualType: libItem?.defaultVisual,
      w: libItem?.defaultWidth || 'full'
    };
    saveLayout([...widgets, newWidget]);
    setShowLibrary(false);
    toast.success(`${libItem?.label} added to dashboard`);
  };

  const removeWidget = (id: string) => {
    saveLayout(widgets.filter(w => w.id !== id));
    toast.info('Widget removed');
  };

  const updateWidgetWidth = (id: string, w: WidgetConfig['w']) => {
    saveLayout(widgets.map(widget => widget.id === id ? { ...widget, w } : widget));
  };

  const updateWidgetVisual = (id: string, visualType: VisualType) => {
    saveLayout(widgets.map(widget => widget.id === id ? { ...widget, visualType } : widget));
    toast.success('Chart type updated');
  };

  const moveWidget = (id: string, direction: 'up' | 'down') => {
    const index = widgets.findIndex(w => w.id === id);
    if (index === -1) return;
    const newWidgets = [...widgets];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= widgets.length) return;
    [newWidgets[index], newWidgets[newIndex]] = [newWidgets[newIndex], newWidgets[index]];
    saveLayout(newWidgets);
  };

  // --- AI Chat Logic ---

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChat, isAiTyping]);

  const handleSendChat = (customText?: string) => {
    const textToSend = customText || chatInput;
    if (!textToSend.trim()) return;

    setAiChat(prev => [...prev, { role: 'user', text: textToSend }]);
    setChatInput('');
    setIsAiTyping(true);

    setTimeout(() => {
      let response = "I'm analyzing the data for you...";
      let actions: any[] = [];

      const lowerText = textToSend.toLowerCase();

      if (lowerText.includes('ncr') || lowerText.includes('spike')) {
      response = 'No historical records are loaded yet. Add real NCR, CAPA, audit, supplier, and complaint data to generate insights.';
        actions = [
          { label: 'Add Pareto Chart', icon: BarChart3, onClick: () => addWidget('pareto-defects') },
          { label: 'Add Risk Heatmap', icon: Plus, onClick: () => addWidget('risk-matrix') }
        ];
      } else if (lowerText.includes('layout') || lowerText.includes('customize') || lowerText.includes('dashboard')) {
        response = "I've enabled Dashboard Edit Mode for you. You can now resize, reorder, or add new analytical widgets from the library.";
        setIsEditMode(true);
        actions = [
          { label: 'Add KPI Grid', icon: Plus, onClick: () => addWidget('kpi-grid') },
          { label: 'Add Supplier Risk', icon: Plus, onClick: () => addWidget('supplier-risk') }
        ];
      } else if (lowerText.includes('supplier') || lowerText.includes('vendor')) {
        response = 'No supplier quality records are loaded yet. Add supplier records to start risk analysis.';
        actions = [
          { label: 'Add Supplier Map', icon: ShieldCheck, onClick: () => addWidget('supplier-risk') },
          { label: 'View All Suppliers', icon: Globe, onClick: () => navigate('/supplier-quality') }
        ];
      } else if (lowerText.includes('radar') || lowerText.includes('benchmark')) {
        response = "I can add a Radar Chart to compare supplier performance across multiple dimensions like Quality, Delivery, and Cost.";
        actions = [
          { label: 'Add Radar Chart', icon: Target, onClick: () => addWidget('supplier-risk') }
        ];
      } else if (lowerText.includes('reset')) {
        saveLayout(DEFAULT_WIDGETS);
        response = "I have reset your dashboard to the default enterprise layout.";
      } else {
        response = 'No plant performance data is loaded yet. Add real records to start visualization.';
        actions = [
          { label: 'Suggest Layout', icon: Sparkles, onClick: () => handleSendChat('Suggest a layout for a Quality Manager') },
          { label: 'Compare Plants', icon: Globe, onClick: () => addWidget('plant-comparison') }
        ];
      }

      setAiChat(prev => [...prev, { role: 'ai', text: response, actions }]);
      setIsAiTyping(false);
    }, 1500);
  };

  // --- Data Loading ---

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [kpiRes, trendRes, plantRes] = await Promise.all([
          dashboardApi.getKPIs(),
          dashboardApi.getQualityTrend(),
          dashboardApi.getPlantPerformance()
        ]);
        
        if (kpiRes && typeof kpiRes === 'object') setKpis(kpiRes);
        if (Array.isArray(trendRes)) setTrendData(trendRes);
        if (Array.isArray(plantRes)) setPlantData(plantRes);
      } catch (e) {
        console.error("Failed to load dashboard data", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();

    // Real-time update simulation (Polling every 30 seconds)
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-[#00A3E0] animate-spin" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-8">
        <PageHeader
          title="Intelligence Hub 4.0"
          subtitle="Dynamic analytical ecosystem for Enterprise Quality"
          breadcrumbs={[{ label: 'Quality' }, { label: 'Intelligence' }]}
        />
        
        <div className="flex items-center gap-3">
          {isEditMode ? (
            <>
              <button 
                onClick={() => setShowLibrary(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#00A3E0]/10 text-[#00A3E0] border border-[#00A3E0]/20 rounded-xl font-bold text-sm hover:bg-[#00A3E0]/20 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Widget
              </button>
              <button 
                onClick={() => setIsEditMode(false)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-500/20"
              >
                <Save className="w-4 h-4" /> Finish Editing
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white/60 rounded-xl font-bold text-sm hover:text-white hover:bg-white/10 transition-all"
            >
              <Layout className="w-4 h-4" /> Customize Dashboard
            </button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl w-fit">
            <TabsTrigger value="overview" className="px-6 py-2 rounded-lg data-[state=active]:bg-[#0066CC] data-[state=active]:text-white">
              Dynamic Overview
            </TabsTrigger>
            <TabsTrigger value="command" className="px-6 py-2 rounded-lg data-[state=active]:bg-[#0066CC] data-[state=active]:text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-500 animate-pulse" /> Live Command
            </TabsTrigger>
            <TabsTrigger value="complaints" className="px-6 py-2 rounded-lg data-[state=active]:bg-[#0066CC] data-[state=active]:text-white">
              Feedback Analytics
            </TabsTrigger>
          </TabsList>

          {/* Smart Suggestions Feed */}
          {smartSuggestions.length > 0 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {smartSuggestions.map(s => (
                <div 
                  key={s.id} 
                  onClick={s.action}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold whitespace-nowrap cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                    s.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                    s.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                    'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {s.text}
                  <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                </div>
              ))}
            </div>
          )}
        </div>

        <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-wrap gap-6">
            {widgets.map((widget) => (
              <div 
                key={widget.id} 
                className={`${
                  widget.w === 'full' ? 'w-full' : 
                  widget.w === 'two-thirds' ? 'w-full lg:w-[calc(66.6%-12px)]' : 
                  widget.w === 'half' ? 'w-full lg:w-[calc(50%-12px)]' :
                  widget.w === 'third' ? 'w-full lg:w-[calc(33.3%-16px)]' :
                  'w-full lg:w-[calc(25%-18px)]'
                } relative group`}
              >
                {isEditMode && (
                  <div className="absolute -top-3 -right-3 z-50 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/90 border border-white/10 rounded-lg p-1 flex gap-1 shadow-2xl">
                      <button onClick={() => moveWidget(widget.id, 'up')} className="p-1.5 hover:bg-white/10 rounded text-white/60"><ChevronRight className="w-3.5 h-3.5 -rotate-90" /></button>
                      <button onClick={() => moveWidget(widget.id, 'down')} className="p-1.5 hover:bg-white/10 rounded text-white/60"><ChevronRight className="w-3.5 h-3.5 rotate-90" /></button>
                      <div className="w-px bg-white/10 mx-1" />
                      
                      {/* Visual Type Selector */}
                      {widget.visualType && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 hover:bg-[#00A3E0]/20 rounded text-[#00A3E0]">
                              <Activity className="w-3.5 h-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-[#0a0a0f] border-white/10 text-white">
                            <DropdownMenuLabel className="text-[10px] uppercase font-black text-white/40">Chart Type</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/5" />
                            {VISUAL_OPTIONS.map(opt => (
                              <DropdownMenuItem 
                                key={opt.type} 
                                onClick={() => updateWidgetVisual(widget.id, opt.type)}
                                className="flex items-center gap-2 text-xs hover:bg-white/5 cursor-pointer"
                              >
                                <opt.icon className="w-3.5 h-3.5" /> {opt.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}

                      <button 
                        onClick={() => {
                          const widths: WidgetConfig['w'][] = ['quarter', 'third', 'half', 'two-thirds', 'full'];
                          const curIdx = widths.indexOf(widget.w);
                          updateWidgetWidth(widget.id, widths[(curIdx + 1) % widths.length]);
                        }} 
                        className="p-1.5 hover:bg-[#00A3E0]/20 rounded text-[#00A3E0]"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => removeWidget(widget.id)} className="p-1.5 hover:bg-red-500/20 rounded text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                )}
                
                <div className={`${isEditMode ? 'ring-2 ring-[#00A3E0]/30 rounded-[2.5rem] p-1' : ''}`}>
                  <WidgetRenderer widget={widget} data={{ kpis, trendData, plantData, sourceData, riskMatrixData }} />
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ... Command and Feedback tabs stay similar but can be refined later ... */}
        <TabsContent value="command" className="space-y-8 animate-in zoom-in-95 duration-500">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <AICopilotPanel aiChat={aiChat} isAiTyping={isAiTyping} onSend={handleSendChat} chatInput={chatInput} setChatInput={setChatInput} chatEndRef={chatEndRef} />
            <div className="xl:col-span-3 space-y-6">
              <PlantHealthCards plantData={plantData} />
              <NeuralFeed />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="complaints" className="space-y-8 animate-in slide-in-from-right-4 duration-500">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPIStoreCard label="Total Complaints" value="0" icon={MessageSquareWarning} color="#3B82F6" trend="No data" />
            <KPIStoreCard label="Avg Response" value="0h" icon={Clock} color="#8B5CF6" trend="No data" />
            <KPIStoreCard label="Satisfaction" value="0/5" icon={Users} color="#10B981" trend="No data" />
            <KPIStoreCard label="Critical Issues" value="0" icon={AlertTriangle} color="#EF4444" trend="No data" />
          </div>
          <WidgetRenderer widget={{ id: 'complaint-trend', type: 'complaint-trend', w: 'full', visualType: 'line' }} data={{ trendData }} />
        </TabsContent>
      </Tabs>

      {/* Widget Library Modal */}
      {showLibrary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#0a0a0f] border border-white/10 rounded-[2.5rem] w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Widget Library</h2>
                <p className="text-sm text-white/40 font-bold uppercase tracking-widest">Select an analytical module to add to your dashboard</p>
              </div>
              <button onClick={() => setShowLibrary(false)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-4 scrollbar-hide">
              {WIDGET_LIBRARY.map((lib) => (
                <button 
                  key={lib.type}
                  onClick={() => addWidget(lib.type)}
                  className="flex items-start gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-3xl text-left hover:bg-[#00A3E0]/5 hover:border-[#00A3E0]/30 transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#00A3E0]/20 group-hover:scale-110 transition-all">
                    <lib.icon className="w-7 h-7 text-white/40 group-hover:text-[#00A3E0]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-black text-white mb-1">{lib.label}</h4>
                    <p className="text-xs text-white/40 font-medium leading-relaxed">{lib.description}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#00A3E0] uppercase tracking-widest bg-[#00A3E0]/10 px-2 py-1 rounded-md">Default: {lib.defaultWidth}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

// --- Specialized Components ---

function WidgetRenderer({ widget, data }: { widget: WidgetConfig, data: any }) {
  const { type, visualType } = widget;
  
  switch (type) {
    case 'health-score':
      return (
        <div className="p-8 bg-gradient-to-r from-[#0066CC] to-[#00A3E0] rounded-[2.5rem] shadow-2xl relative overflow-hidden group h-full min-h-[240px] flex flex-col justify-center">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent)] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full w-fit">
                <Activity className="w-3 h-3 text-white" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">System Quality Score</span>
              </div>
              <h2 className="text-6xl font-black text-white tracking-tighter">0<span className="text-2xl text-white/60">/100</span></h2>
              <p className="text-white/70 text-sm font-medium">Status: <span className="text-white font-bold uppercase tracking-widest">No Data</span></p>
            </div>
            <div className="flex gap-4">
              <div className="px-6 py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                <p className="text-[10px] font-bold text-white/60 uppercase mb-1">Efficiency</p>
                <p className="text-xl font-black text-white">0%</p>
              </div>
              <div className="px-6 py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                <p className="text-[10px] font-bold text-white/60 uppercase mb-1">Risk Level</p>
                <p className="text-xl font-black text-white">--</p>
              </div>
            </div>
          </div>
        </div>
      );
    case 'kpi-grid':
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPIStoreCard label="Open NCRs" value={data.kpis?.openNCRs || 0} icon={AlertCircle} color="#EF4444" trend={data.kpis?.ncrTrend ? `${data.kpis.ncrTrend}%` : ""} />
          <KPIStoreCard label="Active CAPAs" value={data.kpis?.activeCAPAs || 0} icon={Target} color="#F59E0B" trend={data.kpis?.capaTrend ? `${data.kpis.capaTrend}%` : ""} />
          <KPIStoreCard label="Open 8Ds" value={data.kpis?.open8Ds || 0} icon={Activity} color="#8B5CF6" trend="" />
          <KPIStoreCard label="Pending Audits" value={data.kpis?.pendingAudits || 0} icon={ShieldCheck} color="#10B981" trend={data.kpis?.auditTrend ? `${data.kpis.auditTrend}%` : ""} />
        </div>
      );
    case 'trend-chart':
      return (
        <ChartWrapper title="Quality Performance Trends" icon={TrendingUp}>
          <DynamicChart 
            type={visualType || 'area'} 
            data={data.trendData} 
            config={[
              { key: 'ncr', color: '#EF4444', name: 'NCR' },
              { key: 'capa', color: '#F59E0B', name: 'CAPA' },
              { key: 'audit', color: '#10B981', name: 'Audits' }
            ]} 
          />
        </ChartWrapper>
      );
    case 'status-pie':
      return (
        <ChartWrapper title="Status Distribution" icon={PieChart}>
          <DynamicChart 
            type={visualType || 'pie'} 
            data={data.sourceData} 
            dataKey="value"
            nameKey="name"
          />
        </ChartWrapper>
      );
    case 'risk-matrix':
      return (
        <div className="glass-panel rounded-[2.5rem] p-8 border border-white/5 h-full">
          <div className="mb-8">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">NCR Risk Heatmap</h3>
            <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Severity vs Probability Analysis</p>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {data.riskMatrixData.map((row: any, rIdx: number) => (
              row.map((val: any, cIdx: number) => {
                const riskScore = (cIdx + 1) * (5 - rIdx);
                let bgColor = 'bg-green-500/20';
                if (riskScore >= 15) bgColor = 'bg-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
                else if (riskScore >= 10) bgColor = 'bg-orange-500/40';
                else if (riskScore >= 5) bgColor = 'bg-yellow-500/30';
                return (
                  <div key={`${rIdx}-${cIdx}`} className={`aspect-square rounded-lg flex items-center justify-center ${bgColor} group/risk relative`}>
                    <span className="text-sm font-black text-white">{val}</span>
                  </div>
                );
              })
            ))}
          </div>
        </div>
      );
    case 'copq-analysis':
      return (
        <div className="glass-panel rounded-[2.5rem] p-8 border border-white/5 h-full flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Cost of Quality (COPQ)</h3>
            <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Financial Impact Breakdown</p>
          </div>
          <div className="py-6">
            <div className="text-5xl font-black text-white tracking-tighter mb-2">$0</div>
            <div className="flex items-center gap-2 text-gray-400 font-bold text-xs">
              <TrendingDown className="w-3 h-3" /> <span>No comparison data</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Internal Failure</span>
              <span className="text-sm font-black text-white">$0</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">External Failure</span>
              <span className="text-sm font-black text-white">$0</span>
            </div>
          </div>
        </div>
      );
    case 'plant-comparison':
      return (
        <ChartWrapper title="Global Plant Performance" icon={Globe}>
          <DynamicChart 
            type={visualType || 'bar'} 
            data={data.plantData} 
            config={[
              { key: 'quality', color: '#00A3E0', name: 'Quality Score' },
              { key: 'productivity', color: 'rgba(255,255,255,0.1)', name: 'Productivity' }
            ]} 
          />
        </ChartWrapper>
      );
    case 'supplier-risk': {
      const supplierData = [] as any[];
      return (
        <ChartWrapper title="Supplier Benchmark Radar" icon={ShieldCheck}>
          <DynamicChart 
            type={visualType || 'radar'} 
            data={supplierData} 
            config={[
              { key: 'quality', color: '#00A3E0', name: 'Quality' }
            ]} 
          />
        </ChartWrapper>
      );
    }
    case 'complaint-trend':
      return (
        <ChartWrapper title="Feedback Trends" icon={MessageSquareWarning}>
          <DynamicChart 
            type={visualType || 'line'} 
            data={data.trendData} 
            config={[{ key: 'complaint', color: '#3B82F6', name: 'Complaints' }]} 
          />
        </ChartWrapper>
      );
    case 'pareto-defects': {
      const paretoData = [] as any[];
      return (
        <ChartWrapper title="Pareto Analysis (Defects)" icon={BarChart3}>
          <DynamicChart 
            type={visualType || 'bar'} 
            data={paretoData} 
            config={[
              { key: 'count', color: '#EF4444', name: 'Frequency' },
              { key: 'cumulative', color: '#F59E0B', name: 'Cumulative %' }
            ]} 
          />
        </ChartWrapper>
      );
    }
    case 'recent-actions':
      return (
        <div className="glass-panel rounded-[2.5rem] p-8 border border-white/5 h-full overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Live Feed</h3>
            <div className="px-2 py-1 bg-[#00A3E0]/10 rounded-lg text-[10px] font-black text-[#00A3E0] animate-pulse">LIVE</div>
          </div>
          <div className="space-y-4 overflow-y-auto pr-2 scrollbar-hide">
            {([] as number[]).map(i => (
              <div key={i} className="flex items-start gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  {i % 2 === 0 ? <AlertCircle className="w-4 h-4 text-red-400" /> : <CheckCircle className="w-4 h-4 text-green-400" />}
                </div>
                <div>
                  <p className="text-[11px] text-white/80 font-medium">
                    {`Record ${i} updated`}
                  </p>
                  <p className="text-[9px] text-white/30 mt-1 font-bold uppercase tracking-widest">{i * 5} mins ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
}

function ChartWrapper({ title, icon: Icon, children }: any) {
  return (
    <div className="glass-panel rounded-[2.5rem] p-8 border border-white/5 h-full flex flex-col">
      <h3 className="text-xl font-black text-white mb-8 flex items-center gap-2 uppercase tracking-tighter">
        <Icon className="w-6 h-6 text-[#00A3E0]" /> {title}
      </h3>
      <div className="flex-1 min-h-[320px]">
        {children}
      </div>
    </div>
  );
}

function DynamicChart({ type, data, config, dataKey = 'value', nameKey = 'name' }: { type: VisualType, data: any[], config?: any[], dataKey?: string, nameKey?: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      {type === 'pie' ? (
        <PieChart>
          <Pie data={data} innerRadius={60} outerRadius={100} paddingAngle={8} dataKey={dataKey} nameKey={nameKey}>
            {data.map((entry: any, index: number) => <Cell key={index} fill={entry.color || ['#00A3E0', '#EF4444', '#F59E0B', '#8B5CF6', '#10B981'][index % 5]} />)}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: '#0a0a0f', border: '1px solid #ffffff10', borderRadius: '16px' }} />
        </PieChart>
      ) : type === 'radar' ? (
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#ffffff10" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff40', fontSize: 10 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#ffffff20', fontSize: 8 }} />
          {config?.map(c => (
            <Radar key={c.key} name={c.name} dataKey={c.key} stroke={c.color} fill={c.color} fillOpacity={0.3} />
          ))}
          <Tooltip contentStyle={{ backgroundColor: '#0a0a0f', border: '1px solid #ffffff10', borderRadius: '16px' }} />
        </RadarChart>
      ) : (
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
          <XAxis dataKey={data[0]?.month ? 'month' : 'name'} stroke="#ffffff20" fontSize={12} axisLine={false} tickLine={false} />
          <YAxis stroke="#ffffff20" fontSize={12} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ backgroundColor: '#11111a', border: '1px solid #ffffff10', borderRadius: '12px' }} />
          {config?.map(c => {
            if (type === 'bar') return <Bar key={c.key} dataKey={c.key} fill={c.color} radius={[6, 6, 6, 6]} barSize={30} name={c.name} />;
            if (type === 'line') return <Line key={c.key} type="monotone" dataKey={c.key} stroke={c.color} strokeWidth={3} dot={{ r: 4 }} name={c.name} />;
            if (type === 'area') return <Area key={c.key} type="monotone" dataKey={c.key} stroke={c.color} fill={c.color} fillOpacity={0.1} name={c.name} />;
            if (type === 'composed') {
              return c.key === 'audit' ? 
                <Line key={c.key} type="monotone" dataKey={c.key} stroke={c.color} strokeWidth={3} name={c.name} /> : 
                <Area key={c.key} type="monotone" dataKey={c.key} stroke={c.color} fill={c.color} fillOpacity={0.1} name={c.name} />;
            }
            return null;
          })}
        </ComposedChart>
      )}
    </ResponsiveContainer>
  );
}

function KPIStoreCard({ label, value, icon: Icon, color, trend }: any) {
  // Defensive check: ensure all props are safe for template literals and rendering
  const safeColor = typeof color === 'string' ? color : '#94a3b8';
  const displayValue = typeof value === 'object' ? (value ? JSON.stringify(value) : '0') : String(value || '0');
  const displayLabel = typeof label === 'object' ? (label ? JSON.stringify(label) : '') : String(label || '');
  const displayTrend = typeof trend === 'object' ? (trend ? JSON.stringify(trend) : '') : String(trend || '');

  return (
    <div className="glass-panel rounded-[2rem] p-6 border border-white/5 hover:bg-white/[0.03] transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: `${safeColor}15` }}>
          <Icon className="w-6 h-6" style={{ color: safeColor }} />
        </div>
        {displayTrend && (
          <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${displayTrend.startsWith('+') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {displayTrend}
          </div>
        )}
      </div>
      <h4 className="text-3xl font-black text-white mb-1 tracking-tighter">{displayValue}</h4>
      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{displayLabel}</p>
    </div>
  );
}

function AICopilotPanel({ aiChat, isAiTyping, onSend, chatInput, setChatInput, chatEndRef }: any) {
  return (
    <div className="xl:col-span-1 glass-strong rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col h-[700px]">
      <div className="p-6 bg-gradient-to-br from-[#0066CC]/20 to-transparent border-b border-white/5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-[#00A3E0]/20 flex items-center justify-center">
            <Bot className="w-6 h-6 text-[#00A3E0]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tighter">AI Copilot</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Active Intelligence</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {aiChat.map((msg: any, i: number) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
            <div className={`max-w-[90%] p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
              msg.role === 'user' ? 'bg-[#0066CC] text-white rounded-tr-none' : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
            {msg.actions && msg.actions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 ml-1">
                {msg.actions.map((action: any, j: number) => {
                  const ActionIcon = action.icon;
                  return (
                    <button key={j} onClick={action.onClick} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/60 hover:text-white hover:bg-[#00A3E0]/20 transition-all">
                      <ActionIcon className="w-3 h-3" /> {action.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        {isAiTyping && (
          <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl rounded-tl-none w-fit animate-pulse">
            <div className="flex gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#00A3E0]" /><div className="w-1.5 h-1.5 rounded-full bg-[#00A3E0]/60" /><div className="w-1.5 h-1.5 rounded-full bg-[#00A3E0]/30" /></div>
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">AI Thinking</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-white/5 border-t border-white/5 space-y-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Ask your copilot..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
            className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-[#00A3E0] outline-none pr-14"
          />
          <button onClick={() => onSend()} disabled={isAiTyping || !chatInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-[#0066CC] text-white flex items-center justify-center disabled:opacity-30 transition-all">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PlantHealthCards({ plantData }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plantData.map((plant: any) => {
        // Defensive checks for template literals
        const quality = typeof plant.quality === 'number' ? plant.quality : 0;
        const ncrCount = typeof plant.ncr === 'number' ? plant.ncr : 0;
        const name = typeof plant.name === 'string' ? plant.name : 'Unknown Plant';

        return (
          <div key={name} className="glass-panel rounded-[2rem] p-6 border border-white/5 hover:border-[#00A3E0]/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <div className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${quality > 93 ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                {quality > 93 ? 'Optimal' : 'Caution'}
              </div>
            </div>
            <h4 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#00A3E0]" /> {name}
            </h4>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase text-white/40"><span>Health</span><span>{quality}%</span></div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#0066CC] to-[#00A3E0] transition-all duration-1000" style={{ width: `${quality}%` }} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase text-white/40"><span>Risk</span><span className={ncrCount > 15 ? 'text-red-400' : 'text-green-400'}>{ncrCount > 15 ? 'HIGH' : 'LOW'}</span></div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${ncrCount > 15 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${ncrCount * 4}%` }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NeuralFeed() {
  return (
    <div className="glass-panel rounded-[2.5rem] p-8 border border-white/5 relative h-[440px] overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent)]" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">System Neural Feed</h3>
            <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Real-time event stream</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
            <Terminal className="w-4 h-4 text-[#00A3E0]" />
            <span className="text-[10px] font-mono font-bold text-[#00A3E0]">LIVE_STREAM_v4.0</span>
          </div>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto scrollbar-hide font-mono">
          {([] as number[]).map(i => (
            <div key={i} className="flex items-start gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl animate-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 100}ms` }}>
              <span className="text-[10px] text-white/20">[{new Date().toLocaleTimeString()}]</span>
              <span className="text-[10px] text-[#00A3E0] font-black uppercase">INFO</span>
              <p className="text-[11px] text-white/60">Record <span className="text-white font-bold">#{i}</span> updated.</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
