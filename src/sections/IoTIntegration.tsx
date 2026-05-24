import { useState, useRef, useEffect } from 'react';
import {
  Wifi,
  Activity,
  Thermometer,
  Wind,
  Zap,
  Droplets,
  Gauge,
  Cpu,
  Server,
  Database,
  Cloud,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Settings,
  Plus,
  MoreHorizontal,
  BarChart3,
  Signal,
  Battery,
  MapPin
} from 'lucide-react';
import { gsap } from 'gsap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const iotDevices = [] as any[];

const generateRealtimeData = () => {
  return [] as any[];
};

const realtimeData = generateRealtimeData();

// MQTT topics
const mqttTopics = [] as any[];

export function IoTIntegration() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [dataRate, setDataRate] = useState(0);

  useEffect(() => {
    if (sectionRef.current) {
      gsap.fromTo(
        sectionRef.current.querySelectorAll('.animate-item'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
      );
    }

    if (iotDevices.length === 0) return;

    const interval = setInterval(() => {
      setDataRate(prev => Math.max(0, prev + Math.floor(Math.random() * 100 - 50)));
      
      if (Math.random() > 0.95) {
        const device = iotDevices[Math.floor(Math.random() * iotDevices.length)];
        if (device.status !== 'offline') {
          toast.error(`CRITICAL: ${device.name} reading out of range!`, {
            description: `Station: ${device.location} | Value: ${(Math.random() * 100).toFixed(1)} ${device.unit}`,
            duration: 5000,
            action: {
              label: 'Investigate',
              onClick: () => setSelectedDevice(device.id)
            }
          });
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'alarm':
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'online': 'bg-green-500/20 text-green-400 border-green-500/30',
      'warning': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'offline': 'bg-red-500/20 text-red-400 border-red-500/30',
      'alarm': 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getTypeIcon = (type: string): React.ComponentType<{ className?: string }> => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      'temperature': Thermometer,
      'vibration': Wind,
      'pressure': Gauge,
      'flow': Droplets,
      'humidity': Droplets,
      'power': Zap
    };
    return icons[type] || Activity;
  };

  const onlineCount = iotDevices.filter(d => d.status === 'online').length;
  const offlineCount = iotDevices.filter(d => d.status === 'offline').length;
  const onlinePercent = iotDevices.length ? (onlineCount / iotDevices.length * 100).toFixed(0) : '0';
  const offlinePercent = iotDevices.length ? (offlineCount / iotDevices.length * 100).toFixed(0) : '0';

  return (
    <div ref={sectionRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-item">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00C853] to-[#00A3E0] flex items-center justify-center">
            <Wifi className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">IoT Integration</h1>
            <p className="text-gray-400">Real-time Sensor Data & Device Management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-green-500 text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            MQTT Connected
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="border-white/10"
            onClick={() => toast.success('Refreshed', { description: 'Device status refreshed' })}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0]"
            onClick={() => toast.info('Add Device', { description: 'Device onboarding wizard coming soon' })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Device
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-item">
        <Card className="glass-panel border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Cpu className="w-5 h-5 text-[#00A3E0]" />
              <span className="text-xs text-gray-500">0%</span>
            </div>
            <p className="text-2xl font-bold">{iotDevices.length}</p>
            <p className="text-sm text-gray-400">Total Devices</p>
          </CardContent>
        </Card>
        <Card className="glass-panel border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-xs text-gray-500">{onlinePercent}%</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{onlineCount}</p>
            <p className="text-sm text-gray-400">Online</p>
          </CardContent>
        </Card>
        <Card className="glass-panel border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-xs text-gray-500">{offlinePercent}%</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{offlineCount}</p>
            <p className="text-sm text-gray-400">Offline</p>
          </CardContent>
        </Card>
        <Card className="glass-panel border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-5 h-5 text-[#00C853]" />
              <span className="text-xs text-green-400 animate-pulse">Live</span>
            </div>
            <p className="text-2xl font-bold">{dataRate.toLocaleString()}</p>
            <p className="text-sm text-gray-400">Messages/min</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-item">
        {/* Devices List */}
        <div className="lg:col-span-2">
          <Card className="glass-panel border-white/10">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#00A3E0]" />
                  IoT Devices
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10"
                    onClick={() => toast.info('Signal Check', { description: 'Running signal diagnostic...' })}
                  >
                    <Signal className="w-4 h-4 mr-2" />
                    Signal Check
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toast.info('Device actions', { description: 'More actions coming soon' })}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Device</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Location</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Last Reading</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Battery</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Signal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {iotDevices.map((device) => {
                      const TypeIcon = getTypeIcon(device.type);
                      return (
                        <tr 
                          key={device.id} 
                          className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
                            selectedDevice === device.id ? 'bg-white/10' : ''
                          }`}
                          onClick={() => setSelectedDevice(device.id)}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[#0066CC]/20 flex items-center justify-center">
                                <TypeIcon className="w-4 h-4 text-[#00A3E0]" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{device.name}</p>
                                <p className="text-xs text-gray-500">{device.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-sm text-gray-400">
                              <MapPin className="w-3 h-3" />
                              {device.location}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={getStatusColor(device.status)}>
                              {getStatusIcon(device.status)}
                              <span className="ml-1 capitalize">{device.status}</span>
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            {device.lastReading !== null ? (
                              <div className="text-sm">
                                <span className="font-medium">{device.lastReading}</span>
                                <span className="text-gray-500 ml-1">{device.unit}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">--</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Battery className={`w-4 h-4 ${device.battery < 20 ? 'text-red-400' : 'text-green-400'}`} />
                              <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${device.battery < 20 ? 'bg-red-500' : 'bg-green-500'}`}
                                  style={{ width: `${device.battery}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-400">{device.battery}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <Signal className={`w-4 h-4 ${device.signal > 80 ? 'text-green-400' : device.signal > 50 ? 'text-yellow-400' : 'text-red-400'}`} />
                              <span className="text-sm">{device.signal}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Connection Status */}
          <Card className="glass-panel border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Cloud className="w-4 h-4 text-[#00A3E0]" />
                MQTT Broker Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Status</span>
                <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">
                  <div className="w-2 h-2 rounded-full bg-gray-500 mr-2" />
                  Not Connected
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Broker</span>
                <span className="font-medium">--</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Port</span>
                <span className="font-medium">--</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Uptime</span>
                <span className="font-medium">--</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Latency</span>
                <span className="font-medium text-gray-400">--</span>
              </div>
            </CardContent>
          </Card>

          {/* Active Topics */}
          <Card className="glass-panel border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Server className="w-4 h-4 text-[#00A3E0]" />
                Active Topics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[200px] overflow-y-auto">
                {mqttTopics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-xs font-medium text-[#00A3E0]">{topic.topic}</p>
                      <p className="text-xs text-gray-500">{topic.messages.toLocaleString()} messages</p>
                    </div>
                    <Badge variant="outline" className="border-white/20 text-xs">
                      {topic.rate}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="glass-panel border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start border-white/10"
                onClick={() => toast.info('Restart', { description: 'Restart all devices coming soon' })}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Restart All Devices
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start border-white/10"
                onClick={() => toast.info('Analytics', { description: 'IoT analytics dashboard coming soon' })}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start border-white/10"
                onClick={() => toast.info('Configure', { description: 'Gateway configuration coming soon' })}
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure Gateway
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Real-time Charts */}
      <Card className="glass-panel border-white/10 animate-item">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#00A3E0]" />
              Real-time Data Stream
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-green-500 text-green-400">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                Live
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toast.info('Stream settings', { description: 'Stream settings coming soon' })}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="temperature" className="w-full">
            <TabsList className="bg-white/5 border border-white/10 mb-4">
              <TabsTrigger value="temperature" className="data-[state=active]:bg-[#0066CC]">
                <Thermometer className="w-4 h-4 mr-2" />
                Temperature
              </TabsTrigger>
              <TabsTrigger value="vibration" className="data-[state=active]:bg-[#0066CC]">
                <Wind className="w-4 h-4 mr-2" />
                Vibration
              </TabsTrigger>
              <TabsTrigger value="pressure" className="data-[state=active]:bg-[#0066CC]">
                <Gauge className="w-4 h-4 mr-2" />
                Pressure
              </TabsTrigger>
              <TabsTrigger value="flow" className="data-[state=active]:bg-[#0066CC]">
                <Droplets className="w-4 h-4 mr-2" />
                Flow Rate
              </TabsTrigger>
            </TabsList>

            {['temperature', 'vibration', 'pressure', 'flow'].map((metric) => (
              <TabsContent key={metric} value={metric} className="mt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={realtimeData}>
                      <defs>
                        <linearGradient id={`gradient${metric}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00A3E0" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00A3E0" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                      <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1a1a25', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey={metric} 
                        stroke="#00A3E0" 
                        fillOpacity={1} 
                        fill={`url(#gradient${metric})`} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default IoTIntegration;
