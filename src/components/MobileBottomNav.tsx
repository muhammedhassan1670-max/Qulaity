import { Home, ClipboardList, Mic, Search, BarChart2 } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from '../utils/translations';

interface NavItem {
  to: string;
  icon: React.ElementType;
  labelEn: string;
  labelAr: string;
  isCenter?: boolean;
}

const navItems: NavItem[] = [
  {
    to: '/quality',
    icon: Home,
    labelEn: 'Home',
    labelAr: 'الرئيسية',
  },
  {
    to: '/record-hub',
    icon: ClipboardList,
    labelEn: 'Records',
    labelAr: 'السجلات',
  },
  {
    to: '/shopfloor-entry',
    icon: Mic,
    labelEn: 'Log Defect',
    labelAr: 'تسجيل',
    isCenter: true,
  },
  {
    to: '/quality-search',
    icon: Search,
    labelEn: 'Search',
    labelAr: 'البحث',
  },
  {
    to: '/quality-dashboard',
    icon: BarChart2,
    labelEn: 'Dashboard',
    labelAr: 'لوحة البيانات',
  },
];

export function MobileBottomNav() {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const location = useLocation();

  return (
    /* Only visible on mobile — hidden on sm (≥640 px) and above */
    <nav
      aria-label="Mobile bottom navigation"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur border-t border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.6)]"
    >
      <div className="flex items-end justify-around px-2 pb-safe" style={{ paddingTop: '8px' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');

          if (item.isCenter) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                aria-label={isAr ? item.labelAr : item.labelEn}
                className="flex flex-col items-center justify-center gap-1 flex-1 py-1"
                style={{ transform: 'translateY(-12px)' }}
              >
                {/* Prominent circular button */}
                <span
                  className="flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform duration-200 active:scale-90"
                  style={{
                    background: 'linear-gradient(135deg, #00A3E0 0%, #0077b6 100%)',
                    boxShadow: '0 8px 24px rgba(0,163,224,0.5)',
                  }}
                >
                  <item.icon className="w-7 h-7 text-white" />
                </span>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: isActive ? '#00A3E0' : 'rgba(148,163,184,0.9)' }}
                >
                  {isAr ? item.labelAr : item.labelEn}
                </span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/quality'}
              aria-label={isAr ? item.labelAr : item.labelEn}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-2xl transition-all duration-200 active:scale-90"
            >
              <item.icon
                className="w-5 h-5 transition-all duration-200"
                style={{
                  color: isActive ? '#00A3E0' : 'rgba(148,163,184,0.75)',
                  filter: isActive ? 'drop-shadow(0 0 6px rgba(0,163,224,0.6))' : 'none',
                }}
              />
              <span
                className="text-[10px] font-bold transition-colors duration-200"
                style={{ color: isActive ? '#00A3E0' : 'rgba(148,163,184,0.7)' }}
              >
                {isAr ? item.labelAr : item.labelEn}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomNav;
