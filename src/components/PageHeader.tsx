// QMS Enterprise 4.0 - Page Header Component
// Breadcrumbs, page title, and action buttons

import { useLocation } from 'react-router-dom';
import { ChevronRight, RefreshCw, Download } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  showBack?: boolean;
  onBack?: () => void;
  actions?: {
    refresh?: () => void;
    export?: () => void;
    create?: () => void;
    custom?: Array<{
      label: string;
      icon?: React.ReactNode;
      onClick: () => void;
      variant?: 'primary' | 'secondary' | 'danger';
    }>;
  };
}

// Auto-generate breadcrumbs from path
export function useBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return pathnames.map((name, index) => {
    const path = `/${pathnames.slice(0, index + 1).join('/')}`;
    const label = name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return { label, path };
  });
}

export function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="relative mb-8 p-8 rounded-[2.5rem] overflow-hidden group">
      {/* Background with animated gradient */}
      <div className="absolute inset-0 bg-[#10101a] z-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0077ff]/10 via-transparent to-[#7000ff]/10 z-0 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#00d2ff]/10 rounded-full blur-[80px] z-0 animate-pulse" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#7000ff]/10 rounded-full blur-[80px] z-0 animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          {/* Breadcrumbs */}
          {breadcrumbs && (
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
              {breadcrumbs.map((crumb, idx) => (
                <div key={idx} className="flex items-center gap-2 group/crumb">
                  <span className="hover:text-[#00d2ff] transition-colors cursor-pointer">{crumb.label}</span>
                  {idx < breadcrumbs.length - 1 && <ChevronRight className="w-3 h-3 text-gray-700" />}
                </div>
              ))}
            </nav>
          )}
          
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm md:text-base text-gray-400 font-medium max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {actions?.refresh && (
            <button
              onClick={actions.refresh}
              className="p-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-[#00d2ff]/50 hover:bg-[#00d2ff]/10 transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
          
          {actions?.export && (
            <button
              onClick={actions.export}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-300 font-bold text-sm hover:text-white hover:border-[#00d2ff]/50 hover:bg-[#00d2ff]/10 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
            >
              <Download className="w-4 h-4 text-[#00d2ff]" />
              Export
            </button>
          )}

          {actions?.custom?.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className="btn-jamed"
            >
              {action.icon}
              <span className="uppercase tracking-wider text-xs">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Page Container with consistent padding and max-width
export function PageContainer({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={`max-w-[1600px] mx-auto page-enter ${className}`}>
      {children}
    </div>
  );
}

// Page Section with consistent spacing
export function PageSection({
  children,
  title,
  description,
  className = ''
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={`mb-8 ${className}`}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
          {description && <p className="text-gray-400 text-sm">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

// Stats Bar for dashboard-like pages
export function StatsBar({ 
  stats 
}: { 
  stats: Array<{
    label: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
  }>;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div key={index} className="glass-panel rounded-lg p-4">
          <p className="text-gray-400 text-sm">{stat.label}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            {stat.change && (
              <span className={`text-xs ${
                stat.trend === 'up' ? 'text-green-400' : 
                stat.trend === 'down' ? 'text-red-400' : 'text-gray-400'
              }`}>
                {stat.change}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PageHeader;
