import { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Users,
  Shield,
  Globe,
  List,
  Layout,
  Table2,
  Workflow,
  Database,
  History,
  BarChart3,
  Lock,
  RefreshCw,
  Clock,
  Server,
  Monitor,
  Key
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useTranslation } from '@/utils/translations';

// System health metrics
const systemHealth = {
  cpu: 42,
  memory: 68,
  disk: 45,
  network: 23,
  uptime: '45d 12h 34m',
  lastBackup: '2024-03-01 03:00:00'
};

export default function AdminPanel() {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('users');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/admin/roles')) setActiveTab('roles');
    else if (path.includes('/admin/plants')) setActiveTab('plants');
    else if (path.includes('/admin/workflow')) setActiveTab('workflow');
    else if (path.includes('/admin/users')) setActiveTab('users');
    else if (path.includes('/admin/forms')) setActiveTab('forms');
    else if (path.includes('/admin/dropdowns')) setActiveTab('dropdowns');
    else if (path.includes('/admin/records')) setActiveTab('records');
    else if (path.includes('/admin/charts')) setActiveTab('charts');
    else if (path.includes('/admin/reports')) setActiveTab('audit');
    else setActiveTab('users');
  }, [location.pathname]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);

    if (value === 'users') navigate('/admin/users');
    else if (value === 'roles') navigate('/admin/roles');
    else if (value === 'plants') navigate('/admin/plants');
    else if (value === 'workflow') navigate('/admin/workflow');
    else if (value === 'forms') navigate('/admin/forms');
    else if (value === 'dropdowns') navigate('/admin/dropdowns');
    else if (value === 'records') navigate('/admin/records');
    else if (value === 'charts') navigate('/admin/charts');
    else if (value === 'audit') navigate('/admin/reports');
    else if (value === 'security') {
      toast.info('Security', { description: 'Security settings panel is available here' });
    }
  };

  useEffect(() => {
    if (sectionRef.current) {
      gsap.fromTo(
        sectionRef.current.querySelectorAll('.animate-item'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
      );
    }
  }, []);

  return (
    <div ref={sectionRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-item">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0066CC] to-[#00A3E0] flex items-center justify-center shadow-lg shadow-[#0066CC]/20 text-white">
            <Settings className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white mb-1">
              {isAr ? 'لوحة تحكم إدارة النظام' : 'Administration'}
            </h1>
            <p className="text-gray-400 text-sm">
              {isAr ? 'إدارة حسابات المستخدمين، كلمات المرور، مصفوفة الصلاحيات، وتهيئة النظام' : 'System Configuration, Users & Role Matrix Management'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 text-white hover:bg-white/10 rounded-xl h-10"
            onClick={() => toast.success(isAr ? 'تم تحديث بيانات الإدارة' : 'Refreshed', { description: isAr ? 'تم جلب أحدث بيانات النظام' : 'Administration data refreshed' })}
          >
            <RefreshCw className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {isAr ? 'تحديث' : 'Refresh'}
          </Button>
          <Button
            className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white rounded-xl h-10 font-bold"
            onClick={() => navigate('/admin/users')}
          >
            <Users className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {isAr ? 'إدارة المستخدمين' : 'Manage Users'}
          </Button>
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 animate-item">
        <Card className="glass-panel border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Monitor className="w-5 h-5 text-[#00A3E0]" />
              <span className="text-xs text-green-400">Healthy</span>
            </div>
            <p className="text-2xl font-bold">{systemHealth.cpu}%</p>
            <p className="text-sm text-gray-400">{isAr ? 'استهلاك المعالج' : 'CPU Usage'}</p>
            <div className="w-full h-1.5 bg-white/10 rounded-full mt-2">
              <div className="h-full bg-[#00A3E0] rounded-full" style={{ width: `${systemHealth.cpu}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-5 h-5 text-[#FFD600]" />
              <span className="text-xs text-yellow-400">Warning</span>
            </div>
            <p className="text-2xl font-bold">{systemHealth.memory}%</p>
            <p className="text-sm text-gray-400">{isAr ? 'استهلاك الذاكرة' : 'Memory Usage'}</p>
            <div className="w-full h-1.5 bg-white/10 rounded-full mt-2">
              <div className="h-full bg-[#FFD600] rounded-full" style={{ width: `${systemHealth.memory}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Server className="w-5 h-5 text-[#00C853]" />
              <span className="text-xs text-green-400">Good</span>
            </div>
            <p className="text-2xl font-bold">{systemHealth.disk}%</p>
            <p className="text-sm text-gray-400">{isAr ? 'المساحة التخزينية' : 'Disk Usage'}</p>
            <div className="w-full h-1.5 bg-white/10 rounded-full mt-2">
              <div className="h-full bg-[#00C853] rounded-full" style={{ width: `${systemHealth.disk}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Globe className="w-5 h-5 text-[#FF6B35]" />
              <span className="text-xs text-green-400">Stable</span>
            </div>
            <p className="text-2xl font-bold">{systemHealth.network}%</p>
            <p className="text-sm text-gray-400">{isAr ? 'حمل الشبكة' : 'Network Load'}</p>
            <div className="w-full h-1.5 bg-white/10 rounded-full mt-2">
              <div className="h-full bg-[#FF6B35] rounded-full" style={{ width: `${systemHealth.network}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-[#9C27B0]" />
              <span className="text-xs text-green-400">Online</span>
            </div>
            <p className="text-2xl font-bold">45d</p>
            <p className="text-sm text-gray-400">{isAr ? 'وقت التشغيل' : 'Uptime'}</p>
            <p className="text-xs text-gray-500 mt-2">{isAr ? 'الحالة: متصل بنجاح' : 'Status: Online'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs - Sticky */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full animate-item">
        <TabsList className="bg-white/5 border border-white/10 mb-6 flex-wrap sticky top-0 z-50 backdrop-blur-md bg-[#0a0f1c]/80 p-1 rounded-2xl gap-1">
          <TabsTrigger value="users" className="data-[state=active]:bg-[#0066CC] rounded-xl text-xs font-bold py-2 px-3">
            <Users className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            {isAr ? 'المستخدمين وكلمات المرور' : 'Users & Passwords'}
          </TabsTrigger>
          <TabsTrigger value="roles" className="data-[state=active]:bg-[#0066CC] rounded-xl text-xs font-bold py-2 px-3">
            <Shield className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            {isAr ? 'الأدوار ومصفوفة الصلاحيات' : 'Roles & Matrix'}
          </TabsTrigger>
          <TabsTrigger value="plants" className="data-[state=active]:bg-[#0066CC] rounded-xl text-xs font-bold py-2 px-3">
            <Globe className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            {isAr ? 'إدارة المصانع' : 'Multi-Plant'}
          </TabsTrigger>
          <TabsTrigger value="workflow" className="data-[state=active]:bg-[#0066CC] rounded-xl text-xs font-bold py-2 px-3">
            <Workflow className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            {isAr ? 'سير العمل' : 'Workflow'}
          </TabsTrigger>
          <TabsTrigger value="forms" className="data-[state=active]:bg-[#0066CC] rounded-xl text-xs font-bold py-2 px-3">
            <Layout className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            {isAr ? 'النماذج' : 'Forms'}
          </TabsTrigger>
          <TabsTrigger value="dropdowns" className="data-[state=active]:bg-[#0066CC] rounded-xl text-xs font-bold py-2 px-3">
            <List className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            {isAr ? 'القوائم' : 'Dropdowns'}
          </TabsTrigger>
          <TabsTrigger value="records" className="data-[state=active]:bg-[#0066CC] rounded-xl text-xs font-bold py-2 px-3">
            <Table2 className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            {isAr ? 'السجلات' : 'Records'}
          </TabsTrigger>
          <TabsTrigger value="charts" className="data-[state=active]:bg-[#0066CC] rounded-xl text-xs font-bold py-2 px-3">
            <BarChart3 className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            {isAr ? 'المخططات' : 'Charts'}
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-[#0066CC] rounded-xl text-xs font-bold py-2 px-3">
            <Lock className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            {isAr ? 'إعدادات الأمان' : 'Security'}
          </TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-[#0066CC] rounded-xl text-xs font-bold py-2 px-3">
            <History className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            {isAr ? 'سجل التدقيق' : 'Audit Log'}
          </TabsTrigger>
        </TabsList>

        {activeTab === 'security' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-panel border-white/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#00A3E0]" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Require 2FA for all users</p>
                  </div>
                  <Switch defaultChecked onCheckedChange={() => toast.success('2FA setting updated')} />
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="font-medium">Password Policy</p>
                    <p className="text-sm text-gray-500">Enforce strong passwords</p>
                  </div>
                  <Switch defaultChecked onCheckedChange={() => toast.success('Password policy updated')} />
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="font-medium">Session Timeout</p>
                    <p className="text-sm text-gray-500">Auto logout after 30 min</p>
                  </div>
                  <Switch defaultChecked onCheckedChange={() => toast.success('Session timeout updated')} />
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="font-medium">IP Restriction</p>
                    <p className="text-sm text-gray-500">Limit access by IP</p>
                  </div>
                  <Switch onCheckedChange={() => toast.success('IP restriction updated')} />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel border-white/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="w-5 h-5 text-[#FFD600]" />
                  API Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Production API Key</p>
                    <Badge variant="outline" className="border-green-500 text-green-400">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-500 font-mono">sk_live_51H...xYz9</p>
                  <p className="text-xs text-gray-500 mt-1">Last used: 2 min ago</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Staging API Key</p>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-400">Limited</Badge>
                  </div>
                  <p className="text-sm text-gray-500 font-mono">sk_test_32K...aB7</p>
                  <p className="text-xs text-gray-500 mt-1">Last used: 1 hour ago</p>
                </div>
                <Button variant="outline" size="sm" className="w-full border-white/10">
                  <Key className="w-4 h-4 mr-2" />
                  Generate New Key
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="glass-panel border-white/10 rounded-2xl p-4">
            <Outlet />
          </div>
        )}
      </Tabs>
    </div>
  );
}
