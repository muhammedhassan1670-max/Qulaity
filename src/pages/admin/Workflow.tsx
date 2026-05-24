// QMS Enterprise 4.0 - Workflow Engine Page
import { useState } from 'react';
import { 
  Search,
  Plus,
  Play,
  Pause,
  Settings,
  GitBranch,
  Clock,
  MoreHorizontal,
  RefreshCw,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  type: 'approval' | 'review' | 'notification' | 'automation';
  status: 'active' | 'paused' | 'draft';
  trigger: string;
  steps: number;
  executions: number;
  lastRun: string;
  successRate: number;
}

const mockWorkflows: WorkflowItem[] = [];

const statusConfig = {
  'active': { color: 'bg-green-500/20 text-green-400', icon: Play },
  'paused': { color: 'bg-yellow-500/20 text-yellow-400', icon: Pause },
  'draft': { color: 'bg-gray-500/20 text-gray-400', icon: Clock }
};

const typeConfig = {
  'approval': 'bg-blue-500/20 text-blue-400',
  'review': 'bg-purple-500/20 text-purple-400',
  'notification': 'bg-teal-500/20 text-teal-400',
  'automation': 'bg-orange-500/20 text-orange-400'
};

export function WorkflowPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const stats: Array<{ label: string; value: string | number; change: string; trend: 'up' | 'down' | 'neutral' }> = [
    { label: 'Active Workflows', value: mockWorkflows.filter((workflow) => workflow.status === 'active').length, change: '0', trend: 'neutral' as const },
    { label: 'Total Executions', value: mockWorkflows.reduce((sum, workflow) => sum + workflow.executions, 0), change: '0', trend: 'neutral' as const },
    { label: 'Avg Success Rate', value: mockWorkflows.length ? `${(mockWorkflows.reduce((sum, workflow) => sum + workflow.successRate, 0) / mockWorkflows.length).toFixed(1)}%` : '0%', change: '0%', trend: 'neutral' as const },
    { label: 'Paused', value: mockWorkflows.filter((workflow) => workflow.status === 'paused').length, change: '0', trend: 'neutral' as const }
  ];

  const filteredWorkflows = mockWorkflows.filter(wf => 
    wf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wf.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#0066CC]/20 to-[#00A3E0]/20 border border-[#0066CC]/30">
            <Zap className="w-6 h-6 text-[#00A3E0]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Workflow Engine</h1>
            <p className="text-sm text-gray-400">Design and manage automated business processes</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => toast.success('Refreshed', { description: 'Workflow list refreshed' })}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => toast.info('Create Workflow', { description: 'Workflow designer coming soon' })}
            className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Workflow
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="glass-panel rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
            <div className="flex items-end justify-between">
              <p className="text-xl font-semibold text-white">{stat.value}</p>
              <span className={`text-xs ${stat.trend === 'up' ? 'text-green-400' : 'text-gray-400'}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search workflows by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3E0]"
            />
          </div>
        </div>

        {/* Workflows Grid */}
        <div className="space-y-4">
          {filteredWorkflows.map((wf) => {
            const StatusIcon = statusConfig[wf.status].icon;
            return (
              <div key={wf.id} className="rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[#00A3E0] font-mono text-sm">{wf.id}</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeConfig[wf.type]}`}>
                        {wf.type}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[wf.status].color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {wf.status}
                      </span>
                    </div>
                    <h3 className="text-white font-medium text-lg">{wf.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{wf.description}</p>
                    
                    <div className="flex items-center gap-6 mt-4">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <GitBranch className="w-4 h-4" />
                        {wf.steps} steps
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Play className="w-4 h-4" />
                        Trigger: {wf.trigger}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Executions</p>
                      <p className="text-xl font-semibold text-white">{wf.executions.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Success Rate</p>
                      <p className={`text-xl font-semibold ${wf.successRate >= 95 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {wf.successRate}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Last Run</p>
                      <p className="text-sm text-gray-300">{wf.lastRun}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        onClick={() => toast.info('Workflow settings', { description: wf.name })}
                      >
                        <Settings className="w-5 h-5 text-gray-400" />
                      </button>
                      <button
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        onClick={() => toast.info('Workflow actions', { description: wf.name })}
                      >
                        <MoreHorizontal className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredWorkflows.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12 rounded-xl border border-white/10 bg-white/5">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                <Search className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-gray-400">No workflows found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkflowPage;
