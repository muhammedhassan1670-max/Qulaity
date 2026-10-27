import { useState } from 'react';
import { Home, ClipboardList, Menu, BarChart2, Zap } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from '../utils/translations';
import { MobileQuickActionSheet } from './MobileQuickActionSheet';

interface MobileTabBarProps {
  onMenuToggle: () => void;
}

export function MobileTabBar({ onMenuToggle }: MobileTabBarProps) {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const location = useLocation();
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  // Active state detections
  const isHomeActive = location.pathname === '/' || location.pathname === '/quality' || location.pathname === '/quality-home';
  const isRecordsActive = 
    location.pathname.includes('/record-hub') || 
    location.pathname.includes('/records') || 
    location.pathname.includes('/ncr') || 
    location.pathname.includes('/capa') || 
    location.pathname.includes('/8d') ||
    location.pathname.includes('/deviation') ||
    location.pathname.includes('/change-control') ||
    location.pathname.includes('/complaints');
  const isDashboardActive = 
    location.pathname.includes('/quality-dashboard') || 
    location.pathname.includes('/defect-cost') || 
    location.pathname.includes('/process-ppm');

  return (
    <>
      {/* Grounded Mobile Bottom Navigation Bar */}
      <nav 
        aria-label="Mobile Navigation Bar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#070a0f]/95 backdrop-blur-2xl border-t border-slate-200 dark:border-white/10 shadow-[0_-4px_25px_rgba(0,0,0,0.25)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.7)] px-2 pt-1 pb-[max(env(safe-area-inset-bottom,0px),8px)] transition-all select-none"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          
          {/* 1. Home Tab */}
          <NavLink
            to="/quality-home"
            aria-label={isAr ? 'الرئيسية' : 'Home'}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 ${
              isHomeActive 
                ? 'text-sky-500 dark:text-sky-400 font-bold' 
                : 'text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
            }`}
          >
            <div className="relative">
              <Home className={`w-5 h-5 transition-transform ${isHomeActive ? 'scale-110' : ''}`} />
              {isHomeActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_#0ea5e9]" />
              )}
            </div>
            <span className="text-[10px] mt-1 font-bold tracking-tight">
              {isAr ? 'الرئيسية' : 'Home'}
            </span>
          </NavLink>

          {/* 2. Records Tab */}
          <NavLink
            to="/quality/records/ncr"
            aria-label={isAr ? 'السجلات' : 'Records'}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 ${
              isRecordsActive 
                ? 'text-sky-500 dark:text-sky-400 font-bold' 
                : 'text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
            }`}
          >
            <div className="relative">
              <ClipboardList className={`w-5 h-5 transition-transform ${isRecordsActive ? 'scale-110' : ''}`} />
              {isRecordsActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_#0ea5e9]" />
              )}
            </div>
            <span className="text-[10px] mt-1 font-bold tracking-tight">
              {isAr ? 'السجلات' : 'Records'}
            </span>
          </NavLink>

          {/* 3. Center Action Hub Button */}
          <div className="flex-1 flex justify-center items-center">
            <button
              onClick={() => setIsActionSheetOpen(true)}
              aria-label={isAr ? 'إجراءات الجودة السريعة' : 'Quick Actions'}
              className="relative -top-2 flex flex-col items-center active:scale-95 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-sky-500/40 border-2 border-white/40 dark:border-white/20 group-hover:scale-105 transition-all duration-300">
                <Zap className="w-6 h-6 animate-pulse" />
              </div>
              <span className="text-[10px] mt-0.5 font-black text-sky-500 dark:text-sky-400 tracking-tight">
                {isAr ? 'إجراءات' : 'Actions'}
              </span>
            </button>
          </div>

          {/* 4. Dashboard Tab */}
          <NavLink
            to="/quality-dashboard"
            aria-label={isAr ? 'المؤشرات' : 'Dashboard'}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 ${
              isDashboardActive 
                ? 'text-sky-500 dark:text-sky-400 font-bold' 
                : 'text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
            }`}
          >
            <div className="relative">
              <BarChart2 className={`w-5 h-5 transition-transform ${isDashboardActive ? 'scale-110' : ''}`} />
              {isDashboardActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_#0ea5e9]" />
              )}
            </div>
            <span className="text-[10px] mt-1 font-bold tracking-tight">
              {isAr ? 'المؤشرات' : 'Dashboard'}
            </span>
          </NavLink>

          {/* 5. Menu Drawer Button */}
          <button
            onClick={onMenuToggle}
            aria-label={isAr ? 'القائمة الكاملة' : 'Full Menu'}
            className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all duration-200 active:scale-95"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-bold tracking-tight">
              {isAr ? 'القائمة' : 'Menu'}
            </span>
          </button>

        </div>
      </nav>

      {/* Modern Slide-up Quick Action Sheet */}
      <MobileQuickActionSheet 
        isOpen={isActionSheetOpen} 
        onClose={() => setIsActionSheetOpen(false)} 
      />
    </>
  );
}

export default MobileTabBar;
