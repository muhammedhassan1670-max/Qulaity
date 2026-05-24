import { useState, useRef, useEffect } from 'react';
import {
  BarChart3,
  Globe,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Factory,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Zap,
  Shield,
  Download,
  Calendar,
  ChevronRight,
  MoreHorizontal,
  Printer,
  Share2
} from 'lucide-react';
import { gsap } from 'gsap';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { toast } from 'sonner';
import { useConfigStore } from '../stores/configStore';

// Mock executive data
const kpiTrendData = [] as any[];

const plantPerformance = [] as any[];

const costBreakdown = [] as any[];

const topIssues = [] as any[];

const qualityScoreData = {
  overall: 0,
  previous: 0,
  target: 100,
  breakdown: {
    conformance: 0,
    performance: 0,
    reliability: 0,
    durability: 0
  }
};

export function ExecutiveMode() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { chartSettings } = useConfigStore();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedPlant, setSelectedPlant] = useState('all');

  const isSeriesEnabled = (key: string) => chartSettings?.executive?.seriesEnabled?.[key] ?? true;
  const seriesColor = (key: string, fallback: string) => chartSettings?.executive?.seriesColors?.[key] || fallback;

  useEffect(() => {
    if (sectionRef.current) {
      gsap.fromTo(
        sectionRef.current.querySelectorAll('.animate-item'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
      );
    }
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-400" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-400" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-yellow-400" />;
    }
  };

  const getImpactColor = (impact: string) => {
    const colors: Record<string, string> = {
      'High': 'bg-red-500/20 text-red-400 border-red-500/30',
      'Medium': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Low': 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return colors[impact] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div ref={sectionRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-item">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FFD600] to-[#FF6B35] flex items-center justify-center">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Executive Dashboard</h1>
            <p className="text-gray-400">Strategic Quality Management Overview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-[#00A3E0]"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <select 
            value={selectedPlant}
            onChange={(e) => setSelectedPlant(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-[#00A3E0]"
          >
            <option value="all">All Plants</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            className="border-white/10"
            onClick={() => toast.info('Print', { description: 'Print view coming soon' })}
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/10"
            onClick={() => toast.info('Share', { description: 'Sharing coming soon' })}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Executive KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-item">
        <Card className="glass-panel border-white/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Award className="w-6 h-6 text-[#FFD600]" />
              <Badge variant="outline" className="border-green-500 text-green-400">
                <TrendingUp className="w-3 h-3 mr-1" />
                0%
              </Badge>
            </div>
            <p className="text-3xl font-bold">{qualityScoreData.overall}</p>
            <p className="text-sm text-gray-400">Quality Score Index</p>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Target: {qualityScoreData.target}</span>
                <span className="text-green-400">{(qualityScoreData.overall / qualityScoreData.target * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full">
                <div 
                  className="h-full bg-gradient-to-r from-[#FFD600] to-[#FF6B35] rounded-full"
                  style={{ width: `${(qualityScoreData.overall / qualityScoreData.target * 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <DollarSign className="w-6 h-6 text-[#00C853]" />
              <Badge variant="outline" className="border-green-500 text-green-400">
                <TrendingDown className="w-3 h-3 mr-1" />
                0%
              </Badge>
            </div>
            <p className="text-3xl font-bold">$0</p>
            <p className="text-sm text-gray-400">Cost of Poor Quality</p>
            <p className="text-xs text-gray-500 mt-2">No comparison data</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Factory className="w-6 h-6 text-[#00A3E0]" />
              <Badge variant="outline" className="border-green-500 text-green-400">
                <TrendingUp className="w-3 h-3 mr-1" />
                0%
              </Badge>
            </div>
            <p className="text-3xl font-bold">0%</p>
            <p className="text-sm text-gray-400">Average OEE</p>
            <p className="text-xs text-gray-500 mt-2">No plants configured</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Shield className="w-6 h-6 text-[#FF6B35]" />
              <Badge variant="outline" className="border-green-500 text-green-400">
                0 incidents
              </Badge>
            </div>
            <p className="text-3xl font-bold">0%</p>
            <p className="text-sm text-gray-400">Safety Score</p>
            <p className="text-xs text-gray-500 mt-2">No safety data</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-item">
        {/* KPI Trends */}
        <Card className="lg:col-span-2 glass-panel border-white/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">KPI Trends</CardTitle>
                <CardDescription>Quality, Delivery, Cost, Safety performance</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toast.info('Chart actions', { description: 'More actions coming soon' })}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpiTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} domain={[80, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a25', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                  />
                  {isSeriesEnabled('quality') && (
                    <Line type="monotone" dataKey="quality" stroke={seriesColor('quality', '#FFD600')} strokeWidth={2} name="Quality" />
                  )}
                  {isSeriesEnabled('delivery') && (
                    <Line type="monotone" dataKey="delivery" stroke={seriesColor('delivery', '#00C853')} strokeWidth={2} name="Delivery" />
                  )}
                  {isSeriesEnabled('cost') && (
                    <Line type="monotone" dataKey="cost" stroke={seriesColor('cost', '#00A3E0')} strokeWidth={2} name="Cost" />
                  )}
                  {isSeriesEnabled('safety') && (
                    <Line type="monotone" dataKey="safety" stroke={seriesColor('safety', '#FF6B35')} strokeWidth={2} name="Safety" />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cost of Quality Breakdown */}
        <Card className="glass-panel border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Cost of Quality</CardTitle>
            <CardDescription>By category (%)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {costBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a25', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {costBreakdown.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-300">{item.name}</span>
                  </div>
                  <span className="text-gray-400">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plant Performance & Top Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-item">
        {/* Plant Performance */}
        <Card className="glass-panel border-white/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Plant Performance</CardTitle>
                <CardDescription>Multi-plant comparison</CardDescription>
              </div>
              <Globe className="w-5 h-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={plantPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a25', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="oee" fill="#00A3E0" name="OEE" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="quality" fill="#FFD600" name="Quality" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="safety" fill="#00C853" name="Safety" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Issues */}
        <Card className="glass-panel border-white/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Top Quality Issues</CardTitle>
                <CardDescription>By financial impact</CardDescription>
              </div>
              <AlertTriangle className="w-5 h-5 text-[#FF6B35]" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[250px] overflow-y-auto">
              {topIssues.map((issue) => (
                <div key={issue.id} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{issue.issue}</p>
                      <Badge variant="outline" className={getImpactColor(issue.impact)}>
                        {issue.impact}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{issue.plant}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-400">{issue.cost}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      {getTrendIcon(issue.trend)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Score Breakdown */}
      <Card className="glass-panel border-white/10 animate-item">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Quality Score Breakdown</CardTitle>
              <CardDescription>Detailed performance metrics</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-white/10"
              onClick={() => toast.info('Export Report', { description: 'Executive report export coming soon' })}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Conformance', value: qualityScoreData.breakdown.conformance, icon: CheckCircle, color: '#00C853' },
              { label: 'Performance', value: qualityScoreData.breakdown.performance, icon: Zap, color: '#00A3E0' },
              { label: 'Reliability', value: qualityScoreData.breakdown.reliability, icon: Clock, color: '#FFD600' },
              { label: 'Durability', value: qualityScoreData.breakdown.durability, icon: Shield, color: '#FF6B35' },
            ].map((metric) => (
              <div key={metric.label} className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${metric.color}20` }}
                  >
                    <metric.icon className="w-5 h-5" style={{ color: metric.color }} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{metric.label}</p>
                    <p className="text-xl font-bold">{metric.value}</p>
                  </div>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full">
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${(metric.value / 100) * 100}%`,
                      backgroundColor: metric.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card className="glass-panel border-white/10 animate-item">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-[#00A3E0]" />
            Executive Action Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {([] as Array<{ title: string; due: string; owner: string; priority: string }>).map((action, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => toast.info('Action Item', { description: action.title })}
              >
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  action.priority === 'High' ? 'bg-red-500' :
                  action.priority === 'Medium' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{action.title}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Due {action.due}
                    </span>
                    <span>{action.owner}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExecutiveMode;
