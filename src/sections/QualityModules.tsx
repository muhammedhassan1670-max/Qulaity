import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, CheckCircle, FileText, MessageSquare, ClipboardCheck, Factory, Plus, RefreshCw, ArrowRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ncrApi, capaApi, eightDApi, auditApi } from '@/services/api';
import { useTranslation } from '../utils/translations';

interface NCRItem { id: string; ncrNumber: string; title: string; category: string; severity: string; status: string; plant: string; detectedDate: string; }
interface CAPAItem { id: string; capaNumber: string; title: string; type: string; status: string; priority: string; dueDate: string; }
interface EightDItem { id: string; dNumber: string; title: string; status: string; createdDate: string; }
interface AuditItem { id: string; auditNumber: string; title: string; status: string; scheduledDate: string; }

export function QualityModules() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const [selectedModule, setSelectedModule] = useState('ncr');
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [ncrData, setNcrData] = useState<NCRItem[]>([]);
  const [capaData, setCapaData] = useState<CAPAItem[]>([]);
  const [eightDData, setEightDData] = useState<EightDItem[]>([]);
  const [auditData, setAuditData] = useState<AuditItem[]>([]);

  const dynamicModules = useMemo(() => [
    {
      id: 'ncr', name: 'Non-Conformance', shortName: 'NCR', icon: AlertCircle, color: '#FF6B35',
      description: 'Manage material and process non-conformances', count: ncrData.length, trend: 0
    },
    {
      id: 'capa', name: 'Corrective Action', shortName: 'CAPA', icon: CheckCircle, color: '#00C853',
      description: 'Systemic improvements and preventive actions', count: capaData.length, trend: 0
    },
    {
      id: '8d', name: '8D Problem Solving', shortName: '8D', icon: FileText, color: '#0066CC',
      description: 'Structured 8D root cause analysis method', count: eightDData.length, trend: 0
    },
    {
      id: 'complaint', name: 'Complaints', shortName: 'CCM', icon: MessageSquare, color: '#E91E63',
      description: 'Customer quality feedback tracking', count: ncrData.filter(n => n.category === 'customer').length, trend: 0
    },
    {
      id: 'audit', name: 'Audits', shortName: 'AMS', icon: ClipboardCheck, color: '#00BCD4',
      description: 'Compliance and process audit management', count: auditData.length, trend: 0
    },
    {
      id: 'supplier', name: 'Supplier Quality', shortName: 'SQM', icon: Factory, color: '#795548',
      description: 'Incoming material quality control', count: ncrData.filter(n => n.category === 'supplier').length, trend: 0
    }
  ], [ncrData, capaData, eightDData, auditData]);

  const fetchModuleData = async () => {
    try {
      const [ncrRes, capaRes, eightDRes, auditRes] = await Promise.all([
        ncrApi.getAll(), capaApi.getAll(), eightDApi.getAll(), auditApi.getAll()
      ]);
      if (ncrRes?.success) setNcrData(ncrRes.data);
      if (capaRes?.success) setCapaData(capaRes.data);
      if (eightDRes?.success) setEightDData(eightDRes.data);
      if (auditRes?.success) setAuditData(auditRes.data);
    } catch (error) {
      console.error('Fetch failed');
    }
  };

  useEffect(() => { fetchModuleData(); }, []);

  const handleModuleClick = (moduleId: string) => {
    const hubMap: Record<string, string> = {
      'ncr': '/quality/records/ncr',
      'capa': '/quality/records/capa',
      '8d': '/quality/records/8d',
      'audit': '/compliance/hub/audit'
    };
    if (hubMap[moduleId]) navigate(hubMap[moduleId]);
    else { setSelectedModule(moduleId); setActiveTab('active'); }
  };

  const statusColors: Record<string, string> = {
    'Open': 'bg-red-500/20 text-red-400',
    'Closed': 'bg-green-500/20 text-green-400',
    'In Progress': 'bg-blue-500/20 text-blue-400',
    'Active': 'bg-green-500/20 text-green-400',
    'Completed': 'bg-green-500/20 text-green-400'
  };

  return (
    <div ref={sectionRef} className="space-y-10 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-item mb-8">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-[#00C853] to-[#00E676] flex items-center justify-center shadow-lg rotate-3">
            <ClipboardCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">{t('quality-core')} <span className="text-[#00d2ff]">Modules</span></h1>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" /> Dynamic Operational Intelligence
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setIsRefreshing(true); fetchModuleData().then(() => setIsRefreshing(false)); }} className="bg-white/5 p-3 rounded-xl hover:bg-blue-500/20 hover:text-blue-400 transition-all">
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowCreateDialog(true)} className="bg-[#0077ff] text-white px-6 py-3 rounded-xl flex items-center gap-2 font-black uppercase text-xs tracking-widest">
            <Plus className="w-4 h-4" /> New Record
          </button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl h-14">
          <TabsTrigger value="overview" className="px-8 flex-1 rounded-xl data-[state=active]:bg-[#0077ff] data-[state=active]:text-white font-black text-[10px] uppercase">Control Hub</TabsTrigger>
          <TabsTrigger value="active" className="px-8 flex-1 rounded-xl data-[state=active]:bg-[#0077ff] data-[state=active]:text-white font-black text-[10px] uppercase">Record Stream</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dynamicModules.map((module) => (
            <Card
              key={module.id}
              className="glass-ultra border-white/10 hover:border-[#00d2ff]/50 transition-all duration-500 hover:scale-[1.02] cursor-pointer group relative overflow-hidden"
              onClick={() => handleModuleClick(module.id)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-all duration-700 blur-3xl opacity-30" />
              <CardContent className="p-8 relative z-10">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/5 bg-white/5 group-hover:rotate-6 transition-transform shadow-xl">
                    <module.icon className="w-7 h-7" style={{ color: module.color }} />
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-black text-white tabular-nums tracking-tighter">{module.count}</span>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter mt-1">{module.shortName} Total</p>
                  </div>
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tighter group-hover:text-blue-400 transition-colors mb-2">{module.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-2">{module.description}</p>
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                   <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{module.shortName} Live Control</span>
                   <ArrowRight className="w-4 h-4 text-blue-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="active">
           <Card className="glass-panel border-white/10 p-0 overflow-hidden">
              <table className="w-full">
                 <thead className="bg-white/5">
                    <tr>
                       <th className="text-left p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identifier</th>
                       <th className="text-left p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                       <th className="text-left p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                       <th className="text-left p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Facility</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {selectedModule === 'ncr' && ncrData.map((item) => (
                       <tr key={item.id} className="hover:bg-white/5 transition-all cursor-pointer">
                          <td className="p-4 text-sm font-black text-blue-400">{item.ncrNumber}</td>
                          <td className="p-4 text-sm text-white font-medium">{item.title}</td>
                          <td className="p-4">
                             <Badge className={statusColors[item.status] || 'bg-gray-500/20 text-gray-400'}>{item.status}</Badge>
                          </td>
                          <td className="p-4 text-xs text-gray-500">{item.plant}</td>
                       </tr>
                    ))}
                    {ncrData.length === 0 && <tr className="py-20 text-center text-gray-500 text-xs italic uppercase"><td colSpan={4} className="p-20">Initialization sequence complete. No active records detected in vault.</td></tr>}
                 </tbody>
              </table>
           </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="glass-ultra border-white/10 bg-[#0a0a0f] text-white">
           <DialogHeader><DialogTitle className="text-2xl font-black uppercase italic">New Intelligence Log</DialogTitle></DialogHeader>
           <div className="py-10 text-center opacity-30"><FileText className="w-16 h-16 mx-auto mb-4" /><p>Recording engine offline. Please use specific module hubs for direct entry.</p></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default QualityModules;
