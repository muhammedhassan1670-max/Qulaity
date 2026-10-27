import { useState } from 'react';
import { Home, ClipboardList, Menu, Box, Sparkles } from 'lucide-react';
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

  // Check if home or quality home is active
  const isHomeActive = location.pathname === '/' || location.pathname === '/quality';
  const isTwinActive = location.pathname.includes('/quality-control-tower') || location.pathname.includes('plant-map');
  const isRecordsActive = location.pathname.includes('/record-hub') || location.pathname.includes('/records');

  return (
    <>
      {/* Floating Island Glass Dock */}
      <div 
        aria-label="Mobile Navigation Dock"
        className="md:hidden fixed bottom-3 left-3 right-3 max-w-md mx-auto z-50 rounded-[28px] bg-slate-950/85 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(14,165,233,0.2)] px-2 py-1.5 transition-all duration-300"
        style={{
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
        }}
      >
        <div className="flex items-center justify-between relative">
          
          {/* 1. Home Tab */}
          <NavLink
            to="/quality"
            aria-label={isAr ? 'الرئيسية' : 'Home'}
            className={`flex flex-col items-center justify-center flex-1 h-12 rounded-2xl transition-all duration-200 active:scale-90 ${
              isHomeActive 
                ? 'text-sky-400 bg-sky-500/10' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Home className="w-5 h-5 transition-transform duration-200" />
            <span className="text-[10px] mt-0.5 font-bold tracking-tight">
              {isAr ? 'الرئيسية' : 'Home'}
            </span>
            {isHomeActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8] mt-0.5 animate-pulse" />
            )}
          </NavLink>

          {/* 2. 3D Digital Twin Tab */}
          <NavLink
            to="/quality-control-tower"
            aria-label={isAr ? 'التوأم 3D' : '3D Twin'}
            className={`flex flex-col items-center justify-center flex-1 h-12 rounded-2xl transition-all duration-200 active:scale-90 ${
              isTwinActive 
                ? 'text-cyan-400 bg-cyan-500/10' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Box className="w-5 h-5 transition-transform duration-200" />
            <span className="text-[10px] mt-0.5 font-bold tracking-tight">
              {isAr ? 'التوأم 3D' : '3D Twin'}
            </span>
            {isTwinActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] mt-0.5 animate-pulse" />
            )}
          </NavLink>

          {/* 3. Center Glowing Action Hub Button */}
          <div className="flex-1 flex justify-center items-center">
            <button
              onClick={() => setIsActionSheetOpen(true)}
              aria-label={isAr ? 'إجراءات الجودة السريعة' : 'Quick Actions'}
              className="relative -top-5 flex flex-col items-center group active:scale-90 transition-transform duration-200"
            >
              {/* Outer pulsing neon ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-500 blur-md opacity-75 group-hover:opacity-100 animate-pulse duration-1000" />
              
              {/* Center Button */}
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-sky-500 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-xl shadow-sky-500/50 border-2 border-white/30 group-hover:scale-105 transition-all">
                <Sparkles className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              
              <span className="text-[9px] mt-1 font-black text-sky-400 drop-shadow-sm tracking-wide">
                {isAr ? 'إجراءات' : 'Actions'}
              </span>
            </button>
          </div>

          {/* 4. Records Hub Tab */}
          <NavLink
            to="/record-hub"
            aria-label={isAr ? 'السجلات' : 'Records'}
            className={`flex flex-col items-center justify-center flex-1 h-12 rounded-2xl transition-all duration-200 active:scale-90 ${
              isRecordsActive 
                ? 'text-sky-400 bg-sky-500/10' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ClipboardList className="w-5 h-5 transition-transform duration-200" />
            <span className="text-[10px] mt-0.5 font-bold tracking-tight">
              {isAr ? 'السجلات' : 'Records'}
            </span>
            {isRecordsActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8] mt-0.5 animate-pulse" />
            )}
          </NavLink>

          {/* 5. Menu Drawer Button */}
          <button
            onClick={onMenuToggle}
            aria-label={isAr ? 'القائمة الكاملة' : 'Full Menu'}
            className="flex flex-col items-center justify-center flex-1 h-12 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 active:scale-90"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-bold tracking-tight">
              {isAr ? 'القائمة' : 'Menu'}
            </span>
          </button>

        </div>
      </div>

      {/* Modern Slide-up Quick Action Sheet */}
      <MobileQuickActionSheet 
        isOpen={isActionSheetOpen} 
        onClose={() => setIsActionSheetOpen(false)} 
      />
    </>
  );
}

export default MobileTabBar;
