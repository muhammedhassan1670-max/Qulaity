import { 
  Menu, 
  Bell, 
  Search, 
  Settings, 
  HelpCircle, 
  LogOut,
  User as UserIcon,
  ChevronDown,
  Moon,
  Sun,
  Zap,
  Shield,
  CheckCircle,
  AlertTriangle,
  Info,
  QrCode,
  Layout,
  LayoutGrid,
  Mic,
  MicOff
} from 'lucide-react';
import { useVoiceCommand } from '../hooks/useVoiceCommand';
import { useAppStore, type User } from '../stores/appStore';
import { useTranslation } from '../utils/translations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useQRScanner, QRScanner } from './QRScanner';

interface HeaderProps {
  onMenuToggle: () => void;
  user: User | null;
}

export function Header({ onMenuToggle, user }: HeaderProps) {
  const { t, language } = useTranslation();
  const scanner = useQRScanner();
  const { isListening, transcript, toggleListening, isSupported } = useVoiceCommand();

  const navigate = useNavigate();
  
  const { theme, setTheme, notifications, removeNotification, setUser, isLiteMode, setLiteMode } = useAppStore();
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleNotificationClick = (id: string) => {
    removeNotification(id);
  };

  const handleLogout = () => {
    localStorage.removeItem('qms_access_token');
    localStorage.removeItem('qms_refresh_token');
    localStorage.removeItem('auth_token');
    setUser(null);
    toast.info(t('sign-out'), { description: language === 'ar' ? 'لقد قمت بتسجيل الخروج بنجاح' : 'You have been logged out successfully' });
    navigate('/login', { replace: true });
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <Shield className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-[70px] bg-white/80 dark:bg-[#080b11]/80 dark:glass-ultra z-[100] border-b border-slate-200 dark:border-white/10 backdrop-blur-md">
      <div className="h-full flex items-center justify-between px-4">
        {/* Left Section */}
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={onMenuToggle}
            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <Menu className="w-5 h-5 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white" />
          </button>
          
          {/* Logo */}
          <div className="flex items-center gap-2 md:gap-3 group cursor-pointer">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-[var(--industrial-primary)] to-[var(--industrial-secondary)] flex items-center justify-center shadow-md dark:shadow-[0_0_20px_rgba(14,165,233,0.25)] group-hover:scale-110 transition-transform duration-500">
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-white animate-pulse" />
            </div>
            <div className="block">
              <h1 className="text-sm md:text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                QMS <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--industrial-primary)] to-[var(--industrial-secondary)]">4.0</span>
              </h1>
              <p className="text-[8px] md:text-[10px] text-slate-500 dark:text-gray-500 font-bold uppercase tracking-[0.2em] hidden sm:block">Industrial Intelligence</p>
            </div>
          </div>
        </div>
        
        {/* Center Section - Search (Desktop only) */}
        <div className="hidden lg:flex flex-1 max-w-xl mx-4">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            className="w-full h-10 flex items-center gap-3 px-4 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-500 dark:text-gray-400 hover:bg-slate-200/50 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shadow-sm dark:shadow-none"
          >
            <Search className="w-4 h-4 text-[#00A3E0]" />
            <span>{t('search-placeholder')}</span>
            <kbd className="ml-auto px-2 py-0.5 bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-gray-400 rounded text-xs font-mono">⌘K / Ctrl+K</kbd>
          </button>
        </div>
        
        {/* Right Section */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Voice Command Button */}
          {isSupported && (
            <div className="relative">
              <button
                onClick={toggleListening}
                className={`p-2.5 rounded-xl transition-all duration-300 ${
                  isListening 
                    ? 'bg-red-100 text-red-500 dark:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse' 
                    : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400 hover:text-[#00A3E0]'
                }`}
                title={isListening ? 'Listening...' : 'Voice Command'}
              >
                {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              
              {/* Live Transcript Toast */}
              {isListening && (
                <div className="absolute top-[120%] right-0 min-w-[250px] p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-xl border border-red-500/30 text-sm z-50 pointer-events-none">
                  <div className="flex items-center gap-2 mb-1 text-red-500">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span className="font-bold text-xs uppercase tracking-wider">Listening</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-200 min-h-[1.5rem] italic text-right" dir="auto">
                    {transcript || 'تحدث الآن...'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Mobile Search Toggle */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            className="lg:hidden p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
            title="Search / Command Palette"
          >
            <Search className="w-5 h-5 text-[#00A3E0]" />
          </button>

          {/* Scanner Button (Mobile & Desktop) */}
          <button
            onClick={scanner.open}
            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300 text-slate-500 dark:text-gray-400 hover:text-[var(--industrial-primary)] dark:hover:text-[var(--industrial-secondary)] hover:scale-105 active:scale-95"
            title="Scan QR/Barcode"
          >
            <QrCode className="w-5 h-5" />
          </button>

          {/* Admin - Desktop only */}
          <button
            className="hidden lg:inline-flex items-center gap-2 px-4 h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-[var(--industrial-primary)]/5 dark:hover:bg-[var(--industrial-primary)]/10 hover:border-[var(--industrial-primary)]/30 dark:hover:border-[var(--industrial-primary)]/50 transition-all duration-300 text-sm font-bold hover:scale-105 active:scale-95"
            onClick={() => {
              const canAccessAdmin = Boolean(user?.permissions?.includes('admin.access'));
              navigate(canAccessAdmin ? '/admin' : '/admin-login');
            }}
          >
            <Shield className="w-4 h-4 text-[var(--industrial-primary)] dark:text-[var(--industrial-secondary)]" />
            <span className="text-slate-700 dark:text-gray-300 group-hover:text-[var(--industrial-primary)] dark:group-hover:text-[var(--industrial-secondary)]">{t('admin')}</span>
          </button>

          {/* Mode Toggle (Simple/Advanced) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-1 rounded-xl shadow-sm dark:shadow-none">
            <button
              onClick={() => {
                setLiteMode(true);
                toast.success(language === 'ar' ? 'تم التفعيل للوضع المبسط' : 'Simple Mode Enabled');
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-1 ${
                isLiteMode
                  ? 'bg-[var(--industrial-success)] text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-105'
                  : 'text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300'
              }`}
              title={language === 'ar' ? 'وضع مبسط' : 'Simple Mode'}
            >
              <Layout className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'ar' ? 'مبسط' : 'Simple'}</span>
            </button>
            <button
              onClick={() => {
                setLiteMode(false);
                toast.success(language === 'ar' ? 'تم التفعيل للوضع المتقدم' : 'Advanced Mode Enabled');
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-1 ${
                !isLiteMode
                  ? 'bg-[var(--industrial-primary)] text-white shadow-[0_0_15px_rgba(14,165,233,0.3)] scale-105'
                  : 'text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300'
              }`}
              title={language === 'ar' ? 'وضع متقدم' : 'Advanced Mode'}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'ar' ? 'متقدم' : 'Advanced'}</span>
            </button>
          </div>

          {/* Theme Toggle - Condensed on mobile */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-1 rounded-xl shadow-sm dark:shadow-none">
            <button
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-lg transition-all duration-300 ${theme === 'light' ? 'bg-white text-yellow-500 shadow-sm scale-110' : 'text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300'}`}
              title={t('light-mode')}
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-lg transition-all duration-300 ${theme === 'dark' ? 'bg-[var(--industrial-primary)] text-white shadow-[0_0_15px_rgba(14,165,233,0.3)] scale-110' : 'text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300'}`}
              title={t('dark-mode')}
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>
          
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300 relative group active:scale-90">
                <Bell className="w-5 h-5 text-slate-500 dark:text-gray-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                {unreadCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gradient-sunset text-white text-[10px] font-black shadow-lg shadow-[var(--industrial-accent)]/25 animate-pulse"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-80 bg-white dark:bg-[#0f131a]/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 mt-2 shadow-2xl rounded-2xl p-1 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-black/20">
                <span className="font-bold text-sm text-slate-900 dark:text-white">{t('notifications')}</span>
                <button
                  className="text-xs font-bold text-[var(--industrial-primary)] dark:text-[var(--industrial-secondary)] hover:underline"
                  onClick={() => toast.info(t('notifications'), { description: language === 'ar' ? 'ميزة تحديد الكل كمقروء ستتوفر قريباً' : 'Mark all read coming soon' })}
                >
                  {t('mark-all-read')}
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    {t('no-notifications')}
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0"
                      onSelect={() => handleNotificationClick(notification.id)}
                    >
                      <div className="flex gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-[var(--industrial-primary)] mt-1 animate-pulse" />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile User Profile Trigger */}
          <button 
            className="sm:hidden w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--industrial-primary)] to-[var(--industrial-secondary)] p-0.5"
            onClick={() => navigate('/profile')}
          >
            <div className="w-full h-full rounded-[10px] bg-slate-900 dark:bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-4 h-4 text-white" />
              )}
            </div>
          </button>

          {/* Desktop User Profile */}
          <div className="hidden sm:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all duration-300 ml-2 group">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--industrial-primary)] to-[var(--industrial-secondary)] p-0.5 shadow-md dark:shadow-lg group-hover:scale-110 transition-transform">
                    <div className="w-full h-full rounded-[10px] bg-slate-900 dark:bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-sm font-black">
                          {user?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-black leading-tight text-slate-900 dark:text-white group-hover:text-[var(--industrial-primary)] dark:group-hover:text-[var(--industrial-secondary)] transition-colors">{user?.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-gray-500 font-bold uppercase tracking-tighter">{user?.role}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 dark:text-gray-600 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#0f131a]/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 mt-2 shadow-2xl rounded-2xl p-1">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-white/10">
                  <p className="font-medium text-slate-900 dark:text-white">{user?.name}</p>
                  <p className="text-sm text-slate-500 dark:text-gray-400">{user?.email}</p>
                </div>
                <DropdownMenuItem
                  className="hover:bg-slate-50 dark:hover:bg-white/10 cursor-pointer text-slate-700 dark:text-slate-200"
                  onSelect={() => navigate('/profile')}
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  {t('user-profile')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="hover:bg-white/10 cursor-pointer"
                  onSelect={() => navigate('/settings')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {t('settings')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="hover:bg-white/10 cursor-pointer"
                  onSelect={() => toast.info(t('help-support'), { description: language === 'ar' ? 'مركز المساعدة سيتوفر قريباً' : 'Help center coming soon' })}
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  {t('help-support')}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  className="hover:bg-white/10 cursor-pointer text-red-400"
                  onSelect={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('sign-out')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* QR Scanner Overlay */}
      {scanner.isOpen && (
        <QRScanner 
          onClose={scanner.close} 
          onScan={(result) => {
            scanner.handleScan(result);
            if (result.toLowerCase().startsWith('http')) {
              window.open(result, '_blank');
            } else if (result.includes('NCR')) {
              navigate(`/ncr?search=${result}`);
            } else {
              navigate(`/quality-search?q=${encodeURIComponent(result)}`);
            }
          }} 
        />
      )}
    </header>
  );
}


export default Header;
