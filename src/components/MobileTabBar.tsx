import { Home, Search, PlusCircle, LayoutDashboard, Menu } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from '../utils/translations';

interface MobileTabBarProps {
  onMenuToggle: () => void;
}

export function MobileTabBar({ onMenuToggle }: MobileTabBarProps) {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const navItems = [
    {
      to: '/quality',
      icon: Home,
      labelEn: 'Home',
      labelAr: 'الرئيسية',
      exact: true
    },
    {
      to: '/dashboard',
      icon: LayoutDashboard,
      labelEn: 'Dash',
      labelAr: 'المؤشرات'
    },
    {
      to: '/quality/shopfloor',
      icon: PlusCircle,
      labelEn: 'Defect',
      labelAr: 'تسجيل عيب',
      isPrimary: true
    },
    {
      to: '/search',
      icon: Search,
      labelEn: 'Search',
      labelAr: 'البحث'
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full z-50 safe-pb glass-ultra border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item, idx) => (
          <NavLink
            key={idx}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `touch-scale flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-300 ${
                item.isPrimary 
                  ? 'relative -top-5 w-16 h-16 rounded-full bg-gradient-to-tr from-[#0ea5e9] to-[#14b8a6] shadow-[0_10px_25px_rgba(14,165,233,0.4)] text-white' 
                  : isActive
                    ? 'text-[#38bdf8] bg-white/5'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`${item.isPrimary ? 'w-7 h-7' : 'w-5 h-5'} ${isActive && !item.isPrimary ? 'drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]' : ''}`} />
                {!item.isPrimary && (
                  <span className={`text-[10px] mt-1 font-bold ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                    {isAr ? item.labelAr : item.labelEn}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Menu Toggle Button */}
        <button
          onClick={onMenuToggle}
          className="touch-scale flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-300 text-gray-400 hover:text-white hover:bg-white/5"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-bold opacity-70">
            {isAr ? 'القائمة' : 'Menu'}
          </span>
        </button>
      </div>
    </div>
  );
}
