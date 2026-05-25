import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../utils/translations';
import {
  LayoutDashboard,
  ShieldCheck,
  Blocks,
  Brain,
  Box,
  Activity,
  Wifi,
  BarChart3,
  Settings,
  Users,
  FileText,
  DollarSign,
  Truck,
  ChevronRight,
  ChevronDown,
  Factory,
  Workflow,
  Database,
  ScanLine,
  ClipboardCheck,
  AlertCircle,
  TrendingUp,
  Cpu,
  Globe,
  Search,
  MessageSquare,
  LayoutGrid,
  Library,
  Target,
  Smartphone
} from 'lucide-react';
import { useConfigStore } from '../stores/configStore';

interface SidebarProps {
  onSectionChange: (section: string) => void;
  collapsed: boolean;
}

interface MenuItem {
  id: string;
  labelKey: string;
  labelEn?: string;
  labelAr?: string;
  hintEn?: string;
  hintAr?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  children?: MenuItem[];
}

interface QuickAction {
  id: string;
  labelEn: string;
  labelAr: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function Sidebar({ onSectionChange, collapsed }: SidebarProps) {
  const { t, language } = useTranslation();
  const currentPlant = useConfigStore((state) => state.getCurrentPlant());
  const plantLabel = currentPlant?.name || (language === 'ar' ? 'لا يوجد مصنع محدد' : 'No plant selected');
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['quality-entry-flow']);

  const quickActions: QuickAction[] = useMemo(() => [
    { id: 'quick-defect', labelEn: 'Log Defect', labelAr: 'سجل عيب', path: '/defect-log', icon: AlertCircle },
    { id: 'quick-shopfloor', labelEn: 'Quick Entry', labelAr: 'تسجيل سريع', path: '/quality-shopfloor', icon: Smartphone },
    { id: 'quick-command', labelEn: 'Status', labelAr: 'الموقف', path: '/quality-command-center', icon: ShieldCheck },
  ], []);

  const menuItems: MenuItem[] = useMemo(() => [
    {
      id: 'quality-home',
      labelKey: 'quality-home',
      labelEn: 'Start Here',
      labelAr: 'ابدأ هنا',
      hintEn: 'Setup status and next steps',
      hintAr: 'حالة النظام والخطوة التالية',
      icon: LayoutDashboard,
      badge: 'START',
      badgeColor: 'bg-blue-500',
    },
    {
      id: 'quality-entry-flow',
      labelKey: 'quality-shopfloor-group',
      labelEn: '1. Record & Inspect',
      labelAr: '1. سجل وافحص',
      hintEn: 'Daily entry point',
      hintAr: 'مكان التسجيل اليومي',
      icon: Smartphone,
      children: [
        { id: 'quality-shopfloor', labelKey: 'quality-shopfloor', labelEn: 'Quick Shopfloor Entry', labelAr: 'تسجيل سريع من الأرضية', icon: Smartphone, badge: 'FAST', badgeColor: 'bg-emerald-500' },
        { id: 'quality-defect-log', labelKey: 'quality-defect-log', labelEn: 'Defect Recorder', labelAr: 'تسجيل / قائمة العيوب', icon: AlertCircle, badge: 'LOG', badgeColor: 'bg-green-500' },
        { id: 'quality-execution-board', labelKey: 'quality-execution-board', labelEn: 'Inspection Execution Board', labelAr: 'متابعة تنفيذ الفحص', icon: BarChart3 },
        { id: 'quality-inspection-plans', labelKey: 'quality-inspection-plans', labelEn: 'Inspection Plans', labelAr: 'خطط الفحص', icon: ClipboardCheck },
        { id: 'quality-layered-audits', labelKey: 'quality-layered-audits', labelEn: 'Layered Audits', labelAr: 'مراجعات المشرف', icon: ShieldCheck },
      ]
    },
    {
      id: 'quality-defect-management',
      labelKey: 'quality-defect-management',
      labelEn: '2. Problem Cycle',
      labelAr: '2. دورة المشكلة',
      hintEn: 'Review, escalate, and close',
      hintAr: 'مراجعة وتصعيد وإغلاق',
      icon: Workflow,
      children: [
        { id: 'quality-ncr', labelKey: 'quality-ncr', labelEn: 'NCR', labelAr: 'NCR عدم مطابقة', icon: AlertCircle },
        { id: 'quality-capa', labelKey: 'quality-capa', icon: ClipboardCheck },
        { id: 'quality-8d', labelKey: 'quality-8d', labelEn: '8D', labelAr: '8D حل مشكلة', icon: FileText },
        { id: 'quality-command-center-actions', labelKey: 'quality-improvement-actions', labelEn: 'Improvement Actions', labelAr: 'إجراءات التحسين', icon: Workflow },
        { id: 'quality-fmea', labelKey: 'quality-fmea', labelEn: 'FMEA / RPN', labelAr: 'FMEA / أرقام RPN', icon: Brain, badge: 'RPN', badgeColor: 'bg-red-500' },
      ]
    },
    {
      id: 'quality-intelligence-group',
      labelKey: 'quality-intelligence-group',
      labelEn: '3. Analyze & Decide',
      labelAr: '3. حلل وخد قرار',
      hintEn: 'Search, prediction, command view',
      hintAr: 'بحث وتوقع ولوحة قيادة',
      icon: Brain,
      children: [
        { id: 'quality-command-center', labelKey: 'quality-command-center', labelEn: 'Command Center', labelAr: 'مركز القيادة', icon: ShieldCheck, badge: 'CMD', badgeColor: 'bg-cyan-500' },
        { id: 'quality-search', labelKey: 'quality-search', labelEn: 'Quality Search', labelAr: 'بحث الجودة', icon: Search },
        { id: 'quality-defect-prediction', labelKey: 'defect-prediction', labelEn: 'Defect Prediction', labelAr: 'توقع العيوب', icon: Target, badge: 'ML', badgeColor: 'bg-purple-500' },
        { id: 'quality-spc', labelKey: 'spc', labelEn: 'SPC', labelAr: 'SPC التحكم الإحصائي', icon: Activity },
        { id: 'quality-knowledge-base', labelKey: 'quality-knowledge-base', labelEn: 'Knowledge Base', labelAr: 'الدروس المستفادة', icon: Library },
      ]
    },
    {
      id: 'quality-reports',
      labelKey: 'quality-reports',
      labelEn: '4. Reports',
      labelAr: '4. التقارير',
      hintEn: 'Management and quality metrics',
      hintAr: 'مؤشرات الإدارة والجودة',
      icon: TrendingUp,
      children: [
        { id: 'dashboard', labelKey: 'dashboard', labelEn: 'Main Dashboard', labelAr: 'الداش بورد الرئيسية', icon: LayoutDashboard },
        { id: 'quality-dashboard', labelKey: 'quality-dashboard', labelEn: 'Quality Dashboard', labelAr: 'داش بورد الجودة', icon: LayoutDashboard },
        { id: 'quality-process-ppm', labelKey: 'quality-process-ppm', labelEn: 'Process PPM', labelAr: 'Process PPM', icon: Activity },
        { id: 'quality-defect-cost', labelKey: 'quality-defect-cost', labelEn: 'COPQ / Defect Cost', labelAr: 'تكلفة العيوب COPQ', icon: DollarSign },
        { id: 'quality-outgoing', labelKey: 'quality-outgoing', labelEn: 'Outgoing Quality', labelAr: 'جودة الخروج', icon: Truck },
      ]
    },
    {
      id: 'quality-setup',
      labelKey: 'quality-setup',
      labelEn: '5. Setup',
      labelAr: '5. الإعداد',
      hintEn: 'Master data and forms',
      hintAr: 'البيانات والنماذج',
      icon: Settings,
      children: [
        { id: 'quality-master-data', labelKey: 'quality-master-data', labelEn: 'Master Data', labelAr: 'البيانات الرئيسية', icon: Database },
        { id: 'quality-form-designer', labelKey: 'quality-form-designer', labelEn: 'Form Designer', labelAr: 'مصمم النماذج', icon: Blocks },
        { id: 'quality-inspection-plans', labelKey: 'quality-inspection-plans', labelEn: 'Inspection Plans', labelAr: 'خطط الفحص', icon: ClipboardCheck },
        { id: 'quality-rules-sla', labelKey: 'quality-rules-sla', labelEn: 'Rules / SLA', labelAr: 'القواعد و SLA', icon: Workflow },
      ]
    },
    {
      id: 'quality-governance',
      labelKey: 'quality-governance',
      labelEn: 'More / Admin',
      labelAr: 'المزيد / الإدارة',
      hintEn: 'Advanced modules',
      hintAr: 'صفحات متقدمة',
      icon: ShieldCheck,
      children: [
        { id: 'quality-control-plan', labelKey: 'quality-control-plan', labelEn: 'Control Plan', labelAr: 'Control Plan', icon: ScanLine },
        { id: 'quality-deviation', labelKey: 'quality-deviation', labelEn: 'Deviation', labelAr: 'الانحرافات', icon: TrendingUp },
        { id: 'quality-complaint', labelKey: 'quality-complaint', labelEn: 'Complaints', labelAr: 'الشكاوى', icon: AlertCircle },
        { id: 'quality-change', labelKey: 'quality-change', labelEn: 'Change Control', labelAr: 'ضبط التغيير', icon: Workflow },
        { id: 'quality-supplier', labelKey: 'quality-supplier', labelEn: 'Supplier Quality', labelAr: 'جودة الموردين', icon: Factory },
        { id: 'quality-library', labelKey: 'quality-library', labelEn: 'Quality Library', labelAr: 'مكتبة الجودة', icon: Library },
        { id: 'quality-slides', labelKey: 'quality-slides', labelEn: 'Quality Slides', labelAr: 'شرائح الجودة', icon: FileText },
        { id: 'builder', labelKey: 'builder', labelEn: 'No-Code Builder', labelAr: 'No-Code Builder', icon: Blocks },
        { id: 'digital-twin', labelKey: 'digital-twin', labelEn: 'Digital Twin', labelAr: 'Digital Twin', icon: Box },
        { id: 'production-layout', labelKey: 'production-layout', labelEn: 'Production Layout', labelAr: 'تخطيط الإنتاج', icon: LayoutGrid },
        { id: 'iot', labelKey: 'iot', labelEn: 'IoT', labelAr: 'IoT', icon: Wifi, badge: 'LIVE', badgeColor: 'bg-green-500' },
        { id: 'quality-audit', labelKey: 'quality-audit', labelEn: 'Audit Management', labelAr: 'إدارة التدقيق', icon: ClipboardCheck },
        { id: 'quality-inspection', labelKey: 'quality-inspection', labelEn: 'Inspection', labelAr: 'التفتيش', icon: Search },
        { id: 'quality-calibration', labelKey: 'quality-calibration', labelEn: 'Calibration', labelAr: 'المعايرة', icon: Activity },
        { id: 'ai-chat', labelKey: 'ai-chat', labelEn: 'AI Chat', labelAr: 'مساعد الجودة', icon: MessageSquare },
        { id: 'executive', labelKey: 'executive', labelEn: 'Executive Insights', labelAr: 'رؤى الإدارة', icon: BarChart3 },
        { id: 'quality-backup-sync', labelKey: 'quality-backup-sync', labelEn: 'Backup / Sync', labelAr: 'نسخ احتياطي / مزامنة', icon: Database },
        { id: 'quality-audit-trail', labelKey: 'quality-audit-trail', labelEn: 'Audit Trail', labelAr: 'سجل التدقيق', icon: FileText },
        {
          id: 'admin',
          labelKey: 'admin',
          labelEn: 'Administration',
          labelAr: 'الإدارة',
          icon: Settings,
          children: [
            { id: 'admin-users', labelKey: 'admin-users', icon: Users },
            { id: 'admin-roles', labelKey: 'admin-roles', icon: ShieldCheck },
            { id: 'admin-plants', labelKey: 'admin-plants', icon: Globe },
            { id: 'admin-workflow', labelKey: 'admin-workflow', icon: Workflow },
            { id: 'admin-database', labelKey: 'admin-database', icon: Database },
            { id: 'admin-reports', labelKey: 'admin-reports', icon: FileText }
          ]
        }
      ]
    }
  ], []);

  // Professional ID-to-Path mapping for robust active state detection
  const PATH_MAP: Record<string, string> = useMemo(() => ({
    'dashboard': '/',
    'quality': '/quality',
    'builder': '/builder',
    'ai': '/ai',
    'defect-prediction': '/ai/defect-prediction',
    'ai-chat': '/ai-chat',
    'digital-twin': '/digital-twin',
    'production-layout': '/production-layout',
    'spc': '/spc',
    'iot': '/iot',
    'executive': '/executive',
    'admin': '/admin',
    'quality-home': '/quality-home',
    'quality-intelligence': '/quality-intelligence',
    'quality-command-center': '/quality-command-center',
    'quality-command-center-actions': '/quality-command-center',
    'quality-search': '/quality-search',
    'quality-knowledge-base': '/quality-knowledge-base',
    'quality-defect-prediction': '/ai/defect-prediction',
    'quality-spc': '/spc',
    'quality-ncr': '/quality/records/ncr',
    'quality-capa': '/quality/records/capa',
    'quality-8d': '/quality/records/8d',
    'quality-deviation': '/quality/records/deviation',
    'quality-change': '/quality/records/change-control',
    'quality-complaint': '/quality/records/complaint',
    'quality-defect-log': '/defect-log',
    'quality-shopfloor': '/quality-shopfloor',
    'quality-inspection-plans': '/quality-inspection-plans',
    'quality-execution-board': '/quality-execution-board',
    'quality-layered-audits': '/quality-audits',
    'quality-master-data': '/quality-master-data',
    'quality-form-designer': '/quality-form-designer',
    'quality-rules-sla': '/defect-log',
    'quality-backup-sync': '/quality-command-center',
    'quality-audit-trail': '/defect-log',
    'quality-defect-cost': '/defect-cost',
    'quality-process-ppm': '/process-ppm',
    'quality-outgoing': '/outgoing-quality',
    'quality-dashboard': '/quality-dashboard',
    'quality-audit': '/compliance/hub/audit',
    'quality-inspection': '/compliance/hub/inspection',
    'quality-calibration': '/compliance/hub/calibration',
    'quality-fmea': '/fmea',
    'quality-control-plan': '/control-plan',
    'quality-supplier': '/supplier-quality',
    'quality-library': '/quality-library',
    'quality-slides': '/quality-slides',
    'admin-users': '/admin/users',
    'admin-roles': '/admin/roles',
    'admin-plants': '/admin/plants',
    'admin-workflow': '/admin/workflow',
    'admin-database': '/admin/database',
    'admin-reports': '/admin/reports'
  }), []);

  useEffect(() => {
    const matchesPath = (id: string): boolean => {
      const itemPath = PATH_MAP[id];
      if (!itemPath) return false;
      if (itemPath === '/') return location.pathname === '/';
      return location.pathname === itemPath || location.pathname.startsWith(`${itemPath}/`);
    };

    const collectActiveParents = (items: MenuItem[]): string[] => {
      const parents: string[] = [];
      items.forEach((item) => {
        if (!item.children?.length) return;
        const childParents = collectActiveParents(item.children);
        const childIsActive = item.children.some((child) => matchesPath(child.id) || childParents.includes(child.id));
        if (childIsActive || childParents.length > 0) {
          parents.push(item.id, ...childParents);
        }
      });
      return parents;
    };

    const activeParents = collectActiveParents(menuItems);
    if (activeParents.length === 0) return;

    setExpandedItems((prev) => {
      const merged = [...new Set([...prev, ...activeParents])];
      return merged.length === prev.length ? prev : merged;
    });
  }, [PATH_MAP, location.pathname, menuItems]);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const getItemLabel = (item: MenuItem): string => {
    if (language === 'ar' && item.labelAr) return item.labelAr;
    if (language === 'en' && item.labelEn) return item.labelEn;
    return t(item.labelKey as any);
  };

  const getItemHint = (item: MenuItem): string => {
    if (language === 'ar') return item.hintAr || '';
    return item.hintEn || '';
  };

  const isItemActive = (item: MenuItem): boolean => {
    if (item.children?.some((child) => isItemActive(child))) return true;

    const itemPath = PATH_MAP[item.id];
    if (!itemPath) return false;
    
    // Exact match for the dashboard/home
    if (itemPath === '/') return location.pathname === '/';
    
    // Professional path matching:
    // 1. Exact match (e.g., /ai matches /ai)
    // 2. Parent-child match (e.g., /ai matches /ai/chat)
    // 3. Avoids partial string matches (e.g., /ai should NOT match /ai-chat)
    return (
      location.pathname === itemPath || 
      location.pathname.startsWith(`${itemPath}/`)
    );
  };

  const isMobile = window.innerWidth < 1024;

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const active = isItemActive(item);
    const Icon = item.icon;
    const hint = getItemHint(item);
    
    const getPath = (id: string) => PATH_MAP[id] || `/${id}`;

    const content = (
      <div
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 cursor-pointer group/item
          ${active 
            ? 'bg-blue-50 dark:bg-transparent dark:bg-gradient-to-r dark:from-[#0077ff]/20 dark:to-[#00d2ff]/10 border-l-4 border-blue-600 dark:border-[#00d2ff] text-blue-700 dark:text-white shadow-sm dark:shadow-[0_0_20px_rgba(0,210,255,0.15)]' 
            : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }
          ${level > 0 && !collapsed ? 'ml-4 mr-0' : ''}
        `}
      >
        <Icon className={`w-5 h-5 shrink-0 transition-all duration-300 ${active ? 'text-blue-600 dark:text-[#00d2ff] scale-110' : 'text-slate-500 dark:text-gray-400 group-hover/item:text-slate-800 dark:group-hover/item:text-white/80 group-hover/item:scale-110'}`} />
        
        {!collapsed && (
          <>
            <span className={`flex-1 min-w-0 ${language === 'ar' ? 'text-right' : 'text-left'} ${active ? 'text-blue-700 dark:text-white' : 'text-slate-600 dark:text-gray-400 group-hover/item:text-slate-900 dark:group-hover/item:text-white'}`}>
              <span className="block truncate text-sm font-bold">{getItemLabel(item)}</span>
              {hint && level === 0 && (
                <span className="mt-0.5 block truncate text-[10px] font-medium text-slate-400 dark:text-white/30">{hint}</span>
              )}
            </span>
            
            {item.badge && (
              <span className={`px-2 py-0.5 text-[9px] font-black rounded-full shrink-0 uppercase tracking-widest ${item.badgeColor || 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/40'}`}>
                {item.badge}
              </span>
            )}
            
            {hasChildren && (
              <div className="shrink-0">
                {isExpanded ? (
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${active ? 'text-blue-600 dark:text-[#00A3E0]' : 'text-slate-400 dark:text-white/20'}`} />
                ) : (
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${active ? 'text-blue-600 dark:text-[#00A3E0]' : 'text-slate-400 dark:text-white/10'}`} />
                )}
              </div>
            )}
          </>
        )}
      </div>
    );

    return (
      <div key={item.id} className="w-full">
        {hasChildren ? (
          <div onClick={() => toggleExpand(item.id)}>
            {content}
          </div>
        ) : (
          <Link to={getPath(item.id)} onClick={() => onSectionChange(item.id)}>
            {content}
          </Link>
        )}

        {/* Children */}
        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1 space-y-0.5 border-l pl-2 ml-3 border-white/5">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={`
        fixed left-0 top-[70px] bottom-0 z-[90]
        bg-white dark:bg-transparent dark:glass-ultra border-r border-slate-200 dark:border-white/10
        flex flex-col shadow-sm dark:shadow-none
        transition-all duration-500 ease-in-out
        ${collapsed ? (isMobile ? '-translate-x-full' : 'w-20') : 'w-[280px] translate-x-0'}
      `}
    >
      {/* Plant Selector */}
      {!collapsed && (
        <div className="p-4 border-b border-slate-200 dark:border-white/10 hover-lift">
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-blue-300 dark:hover:border-[#00d2ff]/30 transition-all duration-300 group cursor-pointer hover:bg-blue-50 dark:hover:bg-[#00d2ff]/5 hover:shadow-md dark:shadow-none">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0077ff] to-[#00d2ff] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-500 dark:text-gray-500 font-bold uppercase tracking-wider">{t('current-plant')}</p>
              <p className="text-sm font-black truncate text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-[#00d2ff] transition-colors">{plantLabel}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-[#00d2ff] transition-colors" />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.id}
                  to={action.path}
                  onClick={() => onSectionChange(action.id)}
                  className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-center transition hover:border-blue-300 hover:bg-blue-50 dark:border-white/10 dark:bg-white/5 dark:hover:border-[#00d2ff]/30 dark:hover:bg-[#00d2ff]/10"
                >
                  <Icon className="mx-auto mb-1 h-4 w-4 text-blue-600 dark:text-[#00d2ff]" />
                  <span className="block truncate text-[10px] font-black text-slate-700 dark:text-white/80">
                    {language === 'ar' ? action.labelAr : action.labelEn}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Menu */}
      <nav className={`flex-1 p-3 space-y-1 overflow-y-auto ${collapsed ? '' : 'pb-24'}`}>
        {menuItems.map(item => renderMenuItem(item))}
      </nav>

      {/* Bottom Status */}
      {!collapsed && (
        <div className="mt-auto p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-transparent">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-md dark:hover:shadow-none cursor-pointer">
              <Cpu className="w-4 h-4 text-green-600 dark:text-green-500 shrink-0" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 dark:text-gray-400">{t('system-status')}</p>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">{t('operational')}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
