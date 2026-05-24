import { useState, useRef } from 'react';
import { 
  Layout, 
  ClipboardList, 
  ShieldAlert, 
  FileText, 
  GitBranch, 
  ListChecks, 
  RefreshCw,
  AlertTriangle,
  Users,
  Search,
  Settings,
  Eye,
  Database
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormBuilderPage, type FormBuilderHandle } from './FormBuilder';
import { toast } from 'sonner';
import { useConfigStore } from '../../stores/configStore';
import { useNavigate } from 'react-router-dom';

type ModuleKey = 'ncr' | 'capa' | '8d' | 'fmea' | 'change-control' | 'control-plan' | 'deviation' | 'complaint' | 'audit' | 'calibration' | 'defect-log';

interface ModuleConfig {
  key: ModuleKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  bgColor: string;
}

const modulesConfig: ModuleConfig[] = [
  { key: 'ncr', label: 'NCR', icon: ShieldAlert, description: 'Non-Conformance Reports', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  { key: 'capa', label: 'CAPA', icon: ClipboardList, description: 'Corrective and Preventive Actions', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  { key: '8d', label: '8D Report', icon: FileText, description: 'Eight Disciplines Problem Solving', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  { key: 'deviation', label: 'Deviation', icon: AlertTriangle, description: 'Deviation & Waiver Requests', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  { key: 'change-control', label: 'Change Control', icon: GitBranch, description: 'Change Management & Control', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  { key: 'complaint', label: 'Complaint', icon: Users, description: 'Customer Complaint Management', color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
  { key: 'audit', label: 'Audit', icon: Search, description: 'Internal & External Audits', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20' },
  { key: 'fmea', label: 'FMEA', icon: Layout, description: 'Failure Mode & Effects Analysis', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  { key: 'control-plan', label: 'Control Plan', icon: ListChecks, description: 'Process Control Plans', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  { key: 'calibration', label: 'Calibration', icon: GitBranch, description: 'Equipment Calibration Management', color: 'text-blue-500', bgColor: 'bg-blue-500/20' },
  { key: 'defect-log', label: 'Defect Log', icon: ShieldAlert, description: 'Daily Production Defect Logging', color: 'text-red-500', bgColor: 'bg-red-500/20' }
];

export function ModuleFormsAdminContent() {
  const [activeModule, setActiveModule] = useState<ModuleKey>('ncr');
  const { forms } = useConfigStore();
  const navigate = useNavigate();
  
  // Refs for each form builder instance
  const builderRefs = useRef<Record<string, FormBuilderHandle | null>>({});

  const handleConfigure = (moduleKey: string) => {
    const ref = builderRefs.current[moduleKey];
    if (ref) {
      ref.openBuilder();
      // Scroll to the builder section
      const element = document.getElementById(`builder-section-${moduleKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      toast.error('Form builder is not ready yet');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#0066CC]/20 to-[#00A3E0]/20 border border-[#0066CC]/30">
            <Layout className="w-6 h-6 text-[#00A3E0]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Quality Module Forms</h1>
            <p className="text-sm text-gray-400">Configure 8 core quality management forms</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/database')}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <Database className="w-4 h-4 mr-2" />
            Data Sources
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/records')}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Records
          </Button>
          <Button 
            variant="outline" 
            onClick={() => toast.success('Forms refreshed')}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {modulesConfig.map((module) => {
          const Icon = module.icon;
          const hasForm = forms.some(f => f.type === module.key);
          return (
            <div 
              key={module.key}
              className={`glass-panel rounded-xl p-4 cursor-pointer transition-all ${
                activeModule === module.key ? 'ring-2 ring-[#00A3E0]' : ''
              }`}
              onClick={() => setActiveModule(module.key)}
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-lg ${module.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${module.color}`} />
                </div>
                {hasForm && (
                  <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">Active</span>
                )}
              </div>
              <p className="mt-2 text-white font-medium">{module.label}</p>
              <p className="text-xs text-gray-400">{module.description}</p>
            </div>
          );
        })}
      </div>

      <Tabs value={activeModule} onValueChange={(v) => setActiveModule(v as ModuleKey)} className="w-full">
        <TabsList className="bg-white/5 border border-white/10 flex-wrap h-auto gap-1 p-1">
          {modulesConfig.map((m) => {
            const Icon = m.icon;
            const hasForm = forms.some(f => f.type === m.key);
            return (
              <TabsTrigger 
                key={m.key} 
                value={m.key} 
                className="data-[state=active]:bg-[#0066CC] flex items-center gap-2 px-3 py-2"
              >
                <Icon className={`w-4 h-4 ${m.color}`} />
                <span className="hidden sm:inline">{m.label}</span>
                {hasForm && <span className="w-2 h-2 rounded-full bg-green-400 ml-1" />}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {modulesConfig.map((m) => (
          <TabsContent key={m.key} value={m.key} className="mt-4">
            <div className="space-y-6">
              <div className="glass-panel rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-xl ${m.bgColor} flex items-center justify-center`}>
                      <m.icon className={`w-8 h-8 ${m.color}`} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{m.label}</h2>
                      <p className="text-gray-400">{m.description}</p>
                      <Badge variant="outline" className="mt-2">
                        {forms.find(f => f.type === m.key) ? 'Form Active' : 'Click Configure to Create Form'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/admin/records')}
                      className="bg-white/5 border-white/10"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Records
                    </Button>
                    <Button 
                      onClick={() => handleConfigure(m.key)}
                      className="bg-[#0066CC]/20 border-[#0066CC]/30 text-[#00A3E0] hover:bg-[#0066CC]/30"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </div>
              </div>
              
              <div id={`builder-section-${m.key}`}>
                <FormBuilderPage 
                  ref={(el) => (builderRefs.current[m.key] = el)} 
                  formType={m.key} 
                  hideTypeSelector 
                />
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default function ModuleFormsAdminPage() {
  return <ModuleFormsAdminContent />;
}
