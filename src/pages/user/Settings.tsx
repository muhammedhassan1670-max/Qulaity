import { useState } from 'react';
import { 
  Settings, 
  Moon, 
  Sun, 
  Bell, 
  Shield, 
  Globe, 
  Monitor, 
  Zap,
  Lock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useTranslation } from '../../utils/translations';
import { PageContainer, PageHeader } from '../../components/PageHeader';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { theme, setTheme, setLanguage } = useAppStore();
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState('general');

  const settingsTabs = [
    { id: 'general', label: t('general'), icon: Settings },
    { id: 'security', label: t('security'), icon: Lock },
    { id: 'notifications', label: t('notifications'), icon: Bell },
    { id: 'preferences', label: t('preferences'), icon: Monitor },
  ];

  const handleLanguageChange = (val: string) => {
    setLanguage(val);
    toast.success(val === 'ar' ? t('language-changed-ar') : t('language-changed-en'));
  };

  const handleSave = () => {
    toast.promise(new Promise(r => setTimeout(r, 1000)), {
      loading: t('save-preferences-loading'),
      success: t('save-preferences-success'),
      error: t('save-preferences-error')
    });
  };

  return (
    <PageContainer>
      <div className="page-enter">
        <PageHeader 
          title={t('system-settings')} 
          subtitle={t('settings-subtitle')}
          breadcrumbs={[{ label: t('system') }, { label: t('settings') }]}
          actions={{
            custom: [
              {
                label: t('save-changes'),
                icon: <CheckCircle className="w-4 h-4" />,
                onClick: handleSave
              }
            ]
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1 space-y-3">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-4 px-6 py-5 rounded-[1.5rem] transition-all duration-500 border ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#0077ff]/20 to-[#00d2ff]/10 border-[#00d2ff]/30 text-white shadow-[0_10px_30px_rgba(0,119,255,0.2)] scale-105 z-10' 
                      : 'bg-white/5 border-transparent text-gray-500 hover:text-white hover:bg-white/10'
                  } group hover-lift`}
                >
                  <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-[#0077ff] text-white rotate-12' : 'bg-white/5 text-gray-500 group-hover:text-white'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-black uppercase tracking-tighter">{tab.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-[#00d2ff] shadow-[0_0_10px_#00d2ff] animate-pulse" />
                  )}
                </button>
              );
            })}

            <div className="mt-8 p-8 rounded-[2.5rem] bg-gradient-to-br from-[#0077ff]/10 via-[#7000ff]/5 to-transparent border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00d2ff]/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#00d2ff]/20 transition-colors" />
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-[#0077ff]/20">
                  <Zap className="w-5 h-5 text-[#00d2ff]" />
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-widest">{t('system-status')}</h4>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('api-latency')}</span>
                  <span className="text-xs font-black text-[#00e676]">24ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('uptime')}</span>
                  <span className="text-xs font-black text-[#00e676]">99.9%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('version')}</span>
                  <span className="text-xs font-black text-[#00d2ff]">4.0.2-pro</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 space-y-6">
            <div className="glass-ultra rounded-[2.5rem] p-10 min-h-[600px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0077ff]/5 rounded-full blur-[120px] -mr-64 -mt-64" />
              
              {activeTab === 'general' && (
                <div className="space-y-10 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0077ff] to-[#00d2ff] flex items-center justify-center shadow-lg">
                      <Monitor className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tighter">
                      {t('display-theme')}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div 
                      className={`p-8 rounded-[2rem] transition-all duration-500 cursor-pointer group border-2 ${
                        theme === 'light' 
                          ? 'bg-white border-[#0077ff] shadow-[0_20px_40px_rgba(0,0,0,0.1)]' 
                          : 'bg-white/5 border-transparent hover:border-white/10 hover:bg-white/10'
                      }`} 
                      onClick={() => setTheme('light')}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className={`p-4 rounded-2xl transition-all ${theme === 'light' ? 'bg-[#0077ff] text-white' : 'bg-white/5 text-gray-500'}`}>
                          <Sun className="w-6 h-6" />
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 transition-all ${theme === 'light' ? 'border-[#0077ff] bg-[#0077ff] scale-110' : 'border-white/10'}`}>
                          {theme === 'light' && <CheckCircle className="w-full h-full text-white" />}
                        </div>
                      </div>
                      <h4 className={`text-lg font-black uppercase tracking-tighter mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{t('light-mode')}</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">{t('industrial-interface-desc')}</p>
                    </div>

                    <div 
                      className={`p-8 rounded-[2rem] transition-all duration-500 cursor-pointer group border-2 ${
                        theme === 'dark' 
                          ? 'bg-[#10101a] border-[#0077ff] shadow-[0_20px_40px_rgba(0,119,255,0.1)]' 
                          : 'bg-white/5 border-transparent hover:border-white/10 hover:bg-white/10'
                      }`} 
                      onClick={() => setTheme('dark')}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className={`p-4 rounded-2xl transition-all ${theme === 'dark' ? 'bg-[#0077ff] text-white' : 'bg-white/5 text-gray-500'}`}>
                          <Moon className="w-6 h-6" />
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 transition-all ${theme === 'dark' ? 'border-[#0077ff] bg-[#0077ff] scale-110' : 'border-white/10'}`}>
                          {theme === 'dark' && <CheckCircle className="w-full h-full text-white" />}
                        </div>
                      </div>
                      <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-2">{t('dark-mode')}</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">{t('deep-immersion-desc')}</p>
                    </div>
                  </div>

                <div className="pt-8 border-t border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">{t('system-language')}</h4>
                      <p className="text-xs text-gray-500">{t('choose-language-desc')}</p>
                    </div>
                    <select 
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[#00A3E0]"
                    >
                      <option value="en">English (Professional)</option>
                      <option value="ar">العربية (تقني)</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">{t('time-zone')}</h4>
                      <p className="text-xs text-gray-500">{t('timezone-desc')}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#00A3E0] font-bold">
                      <Globe className="w-4 h-4" />
                      (GMT+03:00) Arabian Standard Time
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8">
                <h3 className="text-lg font-black text-white flex items-center gap-3">
                  <Shield className="w-5 h-5 text-[#00A3E0]" />
                  Security & Access
                </h3>

                <div className="space-y-6">
                  <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Two-Factor Authentication</h4>
                        <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                      <Button variant="outline" className="bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20 rounded-xl px-6">Enable 2FA</Button>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Currently disabled - Highly recommended
                    </div>
                  </div>

                  <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 space-y-4">
                    <h4 className="text-sm font-bold text-white">Change Password</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input 
                        type="password" 
                        placeholder="Current Password"
                        className="h-12 px-4 rounded-2xl bg-white/5 border border-white/10 text-sm text-white focus:border-[#00A3E0] outline-none"
                      />
                      <input 
                        type="password" 
                        placeholder="New Password"
                        className="h-12 px-4 rounded-2xl bg-white/5 border border-white/10 text-sm text-white focus:border-[#00A3E0] outline-none"
                      />
                    </div>
                    <Button className="bg-[#0066CC] hover:bg-[#00A3E0] text-white rounded-xl px-8 h-11 font-bold">Update Password</Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <h3 className="text-lg font-black text-white flex items-center gap-3">
                  <Bell className="w-5 h-5 text-[#00A3E0]" />
                  Notification Center
                </h3>

                <div className="space-y-4">
                  {[
                    { title: 'NCR Alerts', desc: 'When a new non-conformance is raised', active: true },
                    { title: 'Audit Schedule', desc: 'Reminders for upcoming audit tasks', active: true },
                    { title: 'IoT Sensors', desc: 'Critical alerts from machine sensors', active: false },
                    { title: 'System Updates', desc: 'News about new features and fixes', active: true },
                  ].map((notif, idx) => (
                    <div key={idx} className="flex items-center justify-between p-6 rounded-[2rem] bg-white/5 border border-white/10">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">{notif.title}</h4>
                        <p className="text-xs text-gray-500">{notif.desc}</p>
                      </div>
                      <div 
                        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${notif.active ? 'bg-[#0066CC]' : 'bg-white/10'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${notif.active ? 'translate-x-6' : 'translate-x-0'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-8">
                <h3 className="text-lg font-black text-white flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-[#00A3E0]" />
                  Operation Preferences
                </h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 rounded-[2rem] bg-white/5 border border-white/10">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">Advanced 3D Effects</h4>
                      <p className="text-xs text-gray-500">Enable high-quality shadows and particles in Digital Twin</p>
                    </div>
                    <div className="w-12 h-6 rounded-full p-1 bg-[#0066CC] cursor-pointer">
                      <div className="w-4 h-4 rounded-full bg-white translate-x-6" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-6 rounded-[2rem] bg-white/5 border border-white/10">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">Auto-Refresh Dashboards</h4>
                      <p className="text-xs text-gray-500">Keep data fresh with real-time polling every 30s</p>
                    </div>
                    <div className="w-12 h-6 rounded-full p-1 bg-[#0066CC] cursor-pointer">
                      <div className="w-4 h-4 rounded-full bg-white translate-x-6" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </PageContainer>
  );
}
