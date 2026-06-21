import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import {
  Activity, RefreshCw, Layers, Target, ShieldAlert, AlertTriangle, CheckCircle, Calculator
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { gsap } from 'gsap';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import QualityDashboardFilterBar from '@/components/QualityDashboardFilterBar';
import QualityAnalyticsConsistencyBadge from '@/components/QualityAnalyticsConsistencyBadge';
import {
  loadQualityAnalyticsSnapshot,
  loadQualityDashboardFilters,
  type QualityAnalyticsSnapshot,
  type QualityDashboardFilters,
} from '@/services/qualityAnalyticsHub';
import { buildDashboardDrilldownUrl, recordDashboardDrilldown } from '@/services/qualityDashboardSnapshots';

const KPIMini = ({ title, value, color }: { title: string, value: string, color: string }) => (
  <div className="flex flex-col p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all">
    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{title}</span>
    <span className="text-2xl font-black mt-1" style={{ color }}>{value}</span>
  </div>
);

export function Dashboard() {
  const { isLiteMode } = useAppStore();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [kpiData, setKpiData] = useState<any>(null);
  const [ncrTrendData, setNcrTrendData] = useState<any[]>([]);
  const [spcDefectsData, setSpcDefectsData] = useState<any[]>([]);
  const [auditScoresData, setAuditScoresData] = useState<any[]>([]);
  const [approvalBottlenecksData, setApprovalBottlenecksData] = useState<any[]>([]);
  const [snapshot, setSnapshot] = useState<QualityAnalyticsSnapshot | null>(null);
  const [filters, setFilters] = useState<QualityDashboardFilters>(() => loadQualityDashboardFilters());

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const data = await loadQualityAnalyticsSnapshot(filters);
      setSnapshot(data);
      setKpiData({
        totalRecords: data.defectMetrics.totalRecords,
        totalDefects: data.defectMetrics.totalDefectQuantity,
        currentPpm: data.ppmMetrics.currentPpm,
        totalCopq: data.copqMetrics.totalCopq,
        returns: data.outgoingMetrics.customerReturns,
        holds: data.outgoingMetrics.holds,
        returnQty: data.outgoingMetrics.customerReturns,
        passRate: data.outgoingMetrics.passRate,
        openNcrs: data.escalationMetrics.openNcrs,
        openCapas: data.escalationMetrics.openCapas,
        openEightD: data.escalationMetrics.openEightD,
        openActions: data.actionEffectivenessMetrics.openActions,
        overdueActions: data.actionEffectivenessMetrics.overdueActions,
        inspectionCompliance: data.inspectionExecutionMetrics.planCompliance,
        auditCompliance: data.auditMetrics.completionRate,
        failedChecks: data.inspectionExecutionMetrics.failedChecks,
        failedChecksWithoutDefect: data.inspectionExecutionMetrics.failedChecksWithoutDefect,
        notEffectiveActions: data.actionEffectivenessMetrics.notEffectiveActions,
        knowledgeGaps: data.knowledgeMetrics.repeatedDefectsWithoutLessons.length,
        confidence: data.dashboardConfidenceLabels.defects,
      });
      setNcrTrendData(data.defectMetrics.trendData.map((row) => ({ ...row, open: row.defects })));
      setSpcDefectsData(data.defectMetrics.distribution.map((row, index) => ({ name: row.label, value: row.value, color: ['#00A3E0', '#EF4444', '#F59E0B', '#8B5CF6', '#10B981'][index % 5] })));
      setAuditScoresData(data.ppmMetrics.byLine.map((line) => ({ name: line.label, compliance: line.value })));
      setApprovalBottlenecksData(data.outgoingMetrics.recent.map((item) => ({ role: item.shipment, pending: item.result })));
    } catch (error) {
      toast.error('Failed to sync intelligence hub');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  useEffect(() => {
    if (sectionRef.current) {
      gsap.fromTo(
        sectionRef.current.querySelectorAll('.module-row'),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, [kpiData]);

  return (
    <div ref={sectionRef} className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 module-row">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00d2ff] to-[#0077ff] flex items-center justify-center rotate-3 shadow-xl shadow-blue-500/20 text-white">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Executive Command</h1>
            <p className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" /> Unified Quality Analytics Hub
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-white/10 text-white" disabled={isLoading} onClick={fetchDashboardData}>
            {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />} 
            Sync Now
          </Button>
        </div>
      </div>

      <div className="module-row space-y-4">
        <QualityDashboardFilterBar value={filters} onChange={setFilters} compact />
        <QualityAnalyticsConsistencyBadge dashboardName="Main Dashboard" snapshot={snapshot} compact />
      </div>

      {/* Stats Grid */}
      <div className={`grid grid-cols-2 ${isLiteMode ? 'md:grid-cols-3' : 'md:grid-cols-5'} gap-4 module-row`}>
        {[
          { icon: Target, title: 'Defect Records', val: `${kpiData?.totalRecords ?? 0}`, col: '#00d2ff', route: '/defect-log', filters: {} },
          { icon: AlertTriangle, title: 'Total Defects', val: `${kpiData?.totalDefects ?? 0}`, col: '#FF6B35', route: '/defect-log', filters: {} },
          { icon: ShieldAlert, title: 'Process PPM', val: `${kpiData?.currentPpm ?? 0}`, col: '#FFD600', route: '/process-ppm', filters: { recordType: 'process-ppm' } },
          { icon: CheckCircle, title: 'COPQ', val: `$${(kpiData?.totalCopq ?? 0).toLocaleString()}`, col: '#00C853', route: '/defect-cost', filters: { recordType: 'defect-cost' } },
          { icon: Activity, title: 'Returns', val: `${kpiData?.returns ?? 0}`, col: '#8A2BE2', route: '/outgoing-quality', filters: { recordType: 'customer-return' } },
          { icon: ShieldAlert, title: 'Open NCRs', val: `${kpiData?.openNcrs ?? 0}`, col: '#FF1744', route: '/quality/records/ncr', filters: { ncrStatus: 'open' } },
          { icon: Target, title: 'Open CAPAs', val: `${kpiData?.openCapas ?? 0}`, col: '#FFB300', route: '/quality/records/capa', filters: { capaStatus: 'open' } },
          { icon: Activity, title: 'Open 8Ds', val: `${kpiData?.openEightD ?? 0}`, col: '#7C4DFF', route: '/quality/records/8d', filters: { eightDStatus: 'open' } },
          { icon: Calculator, title: 'Open Actions', val: `${kpiData?.openActions ?? 0}`, col: '#26A69A', route: '/quality-command-center', filters: { actionStatus: 'open' } },
          { icon: AlertTriangle, title: 'Failed Checks', val: `${kpiData?.failedChecksWithoutDefect ?? 0}`, col: '#FF9100', route: '/quality-execution-board', filters: {} }
        ]
        .filter(k => !isLiteMode || ['Defect Records', 'Total Defects', 'Open NCRs'].includes(k.title))
        .map((k, i) => (
          <Link key={i} to={buildDashboardDrilldownUrl(k.route, k.filters)} onClick={() => recordDashboardDrilldown(k.route, k.filters, k.title)}>
          <Card className="glass-panel border-white/5 relative overflow-hidden group hover:border-white/20 transition-all">
             <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full group-hover:scale-150 transition-transform" />
            <CardContent className="p-4 flex flex-col items-start relative z-10">
              <k.icon className="w-6 h-6 mb-2" style={{ color: k.col }} />
              <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{k.title}</div>
              <div className="text-2xl font-black text-white">{k.val}</div>
            </CardContent>
          </Card>
          </Link>
        ))}
      </div>

      {/* Row: Internal Ops */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 module-row">
        <Card className="glass-panel border-white/10 p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#FF6B35]" />
          <h2 className="text-sm font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#FF6B35]" /> Defect Trend
          </h2>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ncrTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a25', border: '1px solid #333' }} />
                <Area type="monotone" dataKey="open" stroke="#FF6B35" fill="url(#colorOpen)" name="Defects" />
                <defs>
                   <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3}/><stop offset="95%" stopColor="#FF6B35" stopOpacity={0}/></linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass-panel border-white/10 p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#00A3E0]" />
          <h2 className="text-sm font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00A3E0]" /> Defect Distribution
          </h2>
          <div className="h-[250px] flex items-center">
            <div className="w-1/2 h-full">
               {spcDefectsData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={spcDefectsData} innerRadius={50} outerRadius={80} dataKey="value">
                       {spcDefectsData.map((e, i) => <Cell key={i} fill={e.color} />)}
                     </Pie>
                     <Tooltip />
                   </PieChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="h-full flex items-center justify-center text-xs text-gray-500">No defect records</div>
               )}
            </div>
            <div className="w-1/2 space-y-3">
               {spcDefectsData.slice(0, 3).map((d, i) => (
                 <div key={i} className="flex items-center justify-between">
                   <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: d.color }} /><span className="text-[10px] text-gray-400 capitalize">{d.name}</span></div>
                   <span className="text-sm font-bold text-white">{d.value}</span>
                 </div>
               ))}
               {spcDefectsData.length === 0 && <p className="text-center text-xs text-gray-500">No distribution yet</p>}
            </div>
          </div>
        </Card>
      </div>

      {/* Row: External & Compliance */}
      {!isLiteMode && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 module-row">
           <Card className="lg:col-span-1 glass-panel border-white/10 p-6 flex flex-col justify-center gap-4">
              <KPIMini title="Outgoing Holds" value={`${kpiData?.holds ?? 0}`} color="#E91E63" />
              <KPIMini title="Customer Returns" value={`${kpiData?.returnQty ?? 0}`} color="#795548" />
              <KPIMini title="Outgoing Pass Rate" value={`${kpiData?.passRate ?? 0}%`} color="#00C853" />
           </Card>
           <Card className="lg:col-span-2 glass-panel border-white/10 p-6">
              <h2 className="text-sm font-black text-white uppercase tracking-wider mb-6">PPM by Production Line</h2>
              <div className="h-[200px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={auditScoresData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.4)" fontSize={10} width={80} />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#111' }} />
                      <Bar dataKey="compliance" fill="#00BCD4" radius={[0, 4, 4, 0]} name="PPM" />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </Card>
           <Card className="lg:col-span-1 glass-panel border-white/10 p-6">
              <h2 className="text-sm font-black text-white uppercase tracking-wider mb-6">Recent Outgoing</h2>
              <div className="space-y-4">
                 {approvalBottlenecksData.slice(0, 4).map((b, i) => (
                   <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                     <span className="text-[10px] text-gray-400 uppercase font-bold">{b.role}</span>
                     <Badge className="bg-blue-500/20 text-blue-400">{b.pending}</Badge>
                   </div>
                 ))}
                 {approvalBottlenecksData.length === 0 && <div className="text-center py-10 opacity-30"><Calculator className="w-8 h-8 mx-auto mb-2" /> No tasks</div>}
              </div>
           </Card>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
