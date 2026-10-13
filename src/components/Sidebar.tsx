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
  Barcode,
  ClipboardCheck,
  AlertCircle,
  TrendingUp,
  Globe,
  MessageSquare,
  Library,
  Target,
  Smartphone,
  Info,
  X
} from 'lucide-react';
import { useConfigStore } from '../stores/configStore';
import { useAppStore } from '../stores/appStore';
import { MODULE_HELP } from '../data/moduleHelpData';
import { hasPermission } from '../services/userService';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSectionChange: (section: string) => void;
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
  permission?: string | string[];
}

export function Sidebar({ isOpen, onClose, onSectionChange }: SidebarProps) {
  const { t, language } = useTranslation();
  const { user, isLiteMode } = useAppStore();
  const currentPlant = useConfigStore((state) => state.getCurrentPlant());
  const plantLabel = currentPlant?.name || (language === 'ar' ? 'لا يوجد مصنع محدد' : 'No plant selected');
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['stage-inprocess']);
  const [helpItemId, setHelpItemId] = useState<string | null>(null);

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const menuItems: MenuItem[] = useMemo(() => {
    const fullMenu: MenuItem[] = [
      // 0. Overview
      {
        id: 'quality-home',
        labelKey: 'quality-home',
        labelEn: 'Quality Stream Map',
        labelAr: 'نظرة عامة وشريان الجودة',
        hintEn: 'System status & plant value stream',
        hintAr: 'حالة النظام ومسار المصنع الحي',
        icon: LayoutDashboard,
        badge: 'STREAM',
        badgeColor: 'bg-blue-500',
        permission: 'stream.view'
      },

      // Stage 1: Incoming & Supplier Quality (IQC)
      {
        id: 'stage-incoming',
        labelKey: 'stage-incoming',
        labelEn: '1. Incoming & Supplier (IQC)',
        labelAr: '1. استلام الخامات والموردين (IQC)',
        hintEn: 'Raw materials, inspection & suppliers',
        hintAr: 'المواد الخام وفحص الاستلام والموردين',
        icon: Factory,
        children: [
          { id: 'quality-inspection', labelKey: 'quality-inspection', labelEn: 'Incoming Inspection (IQC)', labelAr: 'فحص الشحنات الواردة', icon: ClipboardCheck, badge: 'IQC', badgeColor: 'bg-emerald-500', permission: 'iqc.inspect' },
          { id: 'quality-supplier', labelKey: 'quality-supplier', labelEn: 'Supplier Quality & Rating', labelAr: 'جودة وتقييم الموردين', icon: Factory, permission: 'supplier.manage' },
          { id: 'quality-inspection-plans', labelKey: 'quality-inspection-plans', labelEn: 'Incoming Inspection Plans', labelAr: 'خطط فحص المواد الخام', icon: FileText, permission: ['iqc.plans', 'iqc.inspect'] },
        ]
      },

      // Stage 2: In-Process & Shopfloor Quality (IPQC)
      {
        id: 'stage-inprocess',
        labelKey: 'stage-inprocess',
        labelEn: '2. In-Process Quality (IPQC)',
        labelAr: '2. جودة التصنيع والعمليات (IPQC)',
        hintEn: 'Shopfloor entry, SPC & daily logs',
        hintAr: 'تسجيل الورشة والكارتات والعيوب',
        icon: Smartphone,
        children: [
          { id: 'quality-shopfloor', labelKey: 'quality-shopfloor', labelEn: 'Fast Shopfloor Entry', labelAr: 'تسجيل سريع من الأرضية', icon: Smartphone, badge: 'FAST', badgeColor: 'bg-blue-500', permission: ['shopfloor.fast_entry', 'shopfloor.log_defect'] },
          { id: 'quality-defect-log', labelKey: 'quality-defect-log', labelEn: 'Daily Defect Recorder', labelAr: 'مسجل / قائمة العيوب اليومية', icon: AlertCircle, badge: 'LOG', badgeColor: 'bg-green-500', permission: 'shopfloor.log_defect' },
          { id: 'quality-spc', labelKey: 'spc', labelEn: 'SPC Control Charts', labelAr: 'كارتات التحكم الإحصائي SPC', icon: Activity, badge: 'SPC', badgeColor: 'bg-cyan-500', permission: 'spc.view' },
          { id: 'quality-execution-board', labelKey: 'quality-execution-board', labelEn: 'Inspection Execution Board', labelAr: 'متابعة تنفيذ محطات الفحص', icon: BarChart3, permission: ['shopfloor.clearance', 'shopfloor.log_defect'] },
        ]
      },

      // Stage 3: Non-Conformance & Problem Solving (NCR ➔ CAPA ➔ 8D)
      {
        id: 'stage-resolution',
        labelKey: 'stage-resolution',
        labelEn: '3. Problem Solving (NCR/8D)',
        labelAr: '3. عدم المطابقة وحل المشكلات',
        hintEn: 'Closed-loop NCR, CAPA & 8D',
        hintAr: 'حلقة معالجة الخلل والتحسين',
        icon: Workflow,
        children: [
          { id: 'quality-ncr', labelKey: 'quality-ncr', labelEn: 'NCR Non-Conformance', labelAr: 'تقارير عدم المطابقة NCR', icon: AlertCircle, badge: 'NCR', badgeColor: 'bg-amber-500', permission: 'ncr.create' },
          { id: 'quality-capa', labelKey: 'quality-capa', labelEn: 'CAPA Corrective Actions', labelAr: 'الإجراءات التصحيحية CAPA', icon: ClipboardCheck, permission: 'capa.manage' },
          { id: 'quality-8d', labelKey: 'quality-8d', labelEn: '8D Problem Solving', labelAr: 'حل المشكلات المنهجي 8D', icon: FileText, badge: '8D', badgeColor: 'bg-purple-500', permission: 'eight_d.solve' },
          { id: 'quality-deviation', labelKey: 'quality-deviation', labelEn: 'Deviations & Concessions', labelAr: 'الانحرافات وتصاريح الحيود', icon: TrendingUp, permission: ['ncr.disposition', 'ncr.create'] },
          { id: 'quality-change', labelKey: 'quality-change', labelEn: 'Engineering Change Control', labelAr: 'ضبط التغيير الهندسي', icon: Workflow, permission: ['change.control', 'capa.manage'] },
        ]
      },

      // Stage 4: Final & Outgoing Quality (FQC / OQC)
      {
        id: 'stage-outgoing',
        labelKey: 'stage-outgoing',
        labelEn: '4. Outgoing Quality (OQC)',
        labelAr: '4. فحص وخروج المنتج (OQC)',
        hintEn: 'Pre-shipment & lot release',
        hintAr: 'فحص ما قبل الشحن والإفراج',
        icon: Truck,
        children: [
          { id: 'quality-outgoing', labelKey: 'quality-outgoing', labelEn: 'Pre-Shipment Inspection (OQC)', labelAr: 'فحص جودة الشحنات الصادرة', icon: Truck, badge: 'OQC', badgeColor: 'bg-indigo-500', permission: ['fqc.release', 'fqc.aql_sample'] },
        ]
      },

      // Stage 5: Customer Complaints & Field Quality
      {
        id: 'stage-customer',
        labelKey: 'stage-customer',
        labelEn: '5. Customer & Field Quality',
        labelAr: '5. شكاوى العملاء والميدان',
        hintEn: 'Complaints, returns & satisfaction',
        hintAr: 'شكاوى العملاء والمرتجعات',
        icon: Users,
        children: [
          { id: 'quality-complaint', labelKey: 'quality-complaint', labelEn: 'Customer Complaints Log', labelAr: 'سجل شكاوى العملاء', icon: AlertCircle, badge: 'RMA', badgeColor: 'bg-rose-500', permission: 'complaints.manage' },
        ]
      },

      // Section B: Quality Engineering Lab & Compliance
      {
        id: 'quality-compliance-group',
        labelKey: 'quality-governance',
        labelEn: '6. Engineering Lab & Audits',
        labelAr: '6. المختبر الهندسي والتدقيق',
        hintEn: 'Audits, control plans & calibration',
        hintAr: 'مراجعات وخطط تحكم ومعايرة و FMEA',
        icon: ShieldCheck,
        children: [
          { id: 'quality-control-plan', labelKey: 'quality-control-plan', labelEn: 'Control Plan', labelAr: 'خطط التحكم Control Plan', icon: Barcode, permission: ['control_plan.manage', 'spc.calculate'] },
          { id: 'quality-fmea', labelKey: 'quality-fmea', labelEn: 'FMEA Risk Analysis', labelAr: 'FMEA تحليل المخاطر', icon: Brain, badge: 'AP', badgeColor: 'bg-red-500', permission: ['fmea.manage', 'spc.calculate'] },
          { id: 'quality-layered-audits', labelKey: 'quality-layered-audits', labelEn: 'Layered Process Audits (LPA)', labelAr: 'مراجعات المشرف LPA', icon: ShieldCheck, permission: ['lpa.manage', 'shopfloor.clearance'] },
          { id: 'quality-audit', labelKey: 'quality-audit', labelEn: 'Internal Audits (ISO)', labelAr: 'التدقيق الداخلي وإدارته', icon: ClipboardCheck, permission: ['audit.manage', 'capa.manage'] },
          { id: 'quality-calibration', labelKey: 'quality-calibration', labelEn: 'Equipment Calibration & MSA', labelAr: 'معايرة الأجهزة والـ MSA', icon: Activity, permission: ['calibration.manage', 'spc.calculate'] },
        ]
      },

      // Section C: Executive Intelligence & Analytics
      {
        id: 'quality-reports',
        labelKey: 'quality-reports',
        labelEn: '7. Analytics & Executive KPIs',
        labelAr: '7. مركز القيادة والتحليلات',
        hintEn: 'Executive insights, COPQ & PPM',
        hintAr: 'مركز القيادة وتكلفة الجودة والـ PPM',
        icon: TrendingUp,
        children: [
          { id: 'quality-command-center', labelKey: 'quality-command-center', labelEn: 'Command Center', labelAr: 'مركز قيادة الجودة الموحد', icon: ShieldCheck, badge: 'CMD', badgeColor: 'bg-cyan-500', permission: ['command_center.view', 'capa.manage', 'admin.access'] },
          { id: 'quality-dashboard', labelKey: 'quality-dashboard', labelEn: 'Quality Analytics Dashboard', labelAr: 'لوحة تحليلات الجودة', icon: LayoutDashboard, permission: ['analytics.dashboard', 'spc.view', 'ncr.create'] },
          { id: 'quality-process-ppm', labelKey: 'quality-process-ppm', labelEn: 'Process PPM Tracking', labelAr: 'تتبع معدلات PPM', icon: Activity, permission: ['ppm.track', 'spc.view'] },
          { id: 'quality-defect-cost', labelKey: 'quality-defect-cost', labelEn: 'Cost of Poor Quality (COPQ)', labelAr: 'تكلفة الجودة المعيبة COPQ', icon: DollarSign, permission: ['copq.view', 'capa.manage', 'admin.access'] },
          { id: 'quality-defect-prediction', labelKey: 'defect-prediction', labelEn: 'AI Defect Prediction', labelAr: 'توقع العيوب بالذكاء الاصطناعي', icon: Target, badge: 'AI', badgeColor: 'bg-purple-500', permission: ['ai.access', 'spc.view'] },
          { id: 'ai-chat', labelKey: 'ai-chat', labelEn: 'AI Quality Assistant', labelAr: 'مساعد الجودة الذكي', icon: MessageSquare, permission: ['ai.access', 'admin.access'] },
          { id: 'digital-twin', labelKey: 'digital-twin', labelEn: 'Digital Twin Plant', labelAr: 'التوأم الرقمي للمصنع', icon: Box, permission: ['digital_twin.view', 'spc.view', 'admin.access'] },
        ]
      },

      // Section D: Factory Setup & Master Data
      {
        id: 'quality-setup',
        labelKey: 'quality-setup',
        labelEn: '8. Factory Setup & Master Data',
        labelAr: '8. تهيئة المصنع والبيانات',
        hintEn: 'Master data, forms & knowledge',
        hintAr: 'البيانات الرئيسية ومصمم النماذج',
        icon: Settings,
        children: [
          { id: 'quality-master-data', labelKey: 'quality-master-data', labelEn: 'Quality Master Data', labelAr: 'البيانات الرئيسية (قطع/موديلات)', icon: Database, permission: 'master_data.edit' },
          { id: 'quality-form-designer', labelKey: 'quality-form-designer', labelEn: 'Inspection Form Designer', labelAr: 'مصمم نماذج الفحص', icon: Blocks, permission: ['forms.designer', 'master_data.edit'] },
          { id: 'quality-knowledge-base', labelKey: 'quality-knowledge-base', labelEn: 'Lessons Learned Knowledge Base', labelAr: 'قاعدة الدروس المستفادة', icon: Library, permission: ['knowledge.view', 'master_data.edit'] },
          {
            id: 'admin',
            labelKey: 'admin',
            labelEn: 'System Administration',
            labelAr: 'إدارة النظام',
            icon: Settings,
            permission: ['admin.access', 'users.manage', 'roles.manage'],
            children: [
              { id: 'admin-users', labelKey: 'admin-users', icon: Users, permission: 'users.manage' },
              { id: 'admin-roles', labelKey: 'admin-roles', icon: ShieldCheck, permission: 'roles.manage' },
              { id: 'admin-plants', labelKey: 'admin-plants', icon: Globe, permission: 'admin.access' },
              { id: 'admin-workflow', labelKey: 'admin-workflow', icon: Workflow, permission: 'admin.access' },
              { id: 'admin-database', labelKey: 'admin-database', icon: Database, permission: 'admin.access' },
              { id: 'admin-reports', labelKey: 'admin-reports', icon: FileText, permission: 'admin.access' }
            ]
          }
        ]
      }
    ];

    // Filter items strictly by user permissions
    const filterItem = (item: MenuItem): MenuItem | null => {
      // Check item's own permission requirement
      if (item.permission && !hasPermission(user, item.permission)) {
        return null;
      }

      // If item has children, recursively filter them
      if (item.children && item.children.length > 0) {
        const allowedChildren = item.children
          .map(filterItem)
          .filter((child): child is MenuItem => child !== null);
        
        // If all sub-items are disallowed, omit the parent category completely
        if (allowedChildren.length === 0) {
          return null;
        }

        return { ...item, children: allowedChildren };
      }

      return item;
    };

    const permittedMenu = fullMenu
      .map(filterItem)
      .filter((item): item is MenuItem => item !== null);

    if (!isLiteMode) return permittedMenu;

    return permittedMenu.slice(0, 5);
  }, [isLiteMode, user]);

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
          w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-300 cursor-pointer group/item
          ${active 
            ? 'bg-gradient-to-r from-[var(--industrial-primary)]/10 to-transparent border-l-4 border-[var(--industrial-primary)] text-[var(--industrial-primary)] font-black shadow-sm shadow-[var(--industrial-primary)]/5' 
            : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }
          ${level > 0 ? 'ml-4 mr-0' : ''}
        `}
      >
        <Icon className={`w-5 h-5 shrink-0 transition-all duration-300 ${active ? 'text-[var(--industrial-primary)] scale-110' : 'text-slate-500 dark:text-gray-400 group-hover/item:text-slate-800 dark:group-hover/item:text-white/80 group-hover/item:scale-110'}`} />
        
        <span className={`flex-1 min-w-0 ${language === 'ar' ? 'text-right' : 'text-left'} ${active ? 'text-[var(--industrial-primary)]' : 'text-slate-600 dark:text-gray-400 group-hover/item:text-slate-900 dark:group-hover/item:text-white'}`}>
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

        {level > 0 && MODULE_HELP[item.id] && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setHelpItemId(item.id);
            }}
            className="shrink-0 p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 dark:text-white/30 hover:text-[var(--industrial-primary)] transition-colors"
            title={language === 'ar' ? 'معلومات وتعليمات الموديول' : 'Module info and instructions'}
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        )}
        
        {hasChildren && (
          <div className="shrink-0">
            {isExpanded ? (
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${active ? 'text-[var(--industrial-primary)]' : 'text-slate-400 dark:text-white/20'}`} />
            ) : (
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${active ? 'text-[var(--industrial-primary)]' : 'text-slate-400 dark:text-white/10'}`} />
            )}
          </div>
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
          <Link to={getPath(item.id)} onClick={() => {
            onSectionChange(item.id);
            onClose();
          }}>
            {content}
          </Link>
        )}

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-0.5 border-l pl-2 ml-3 border-white/5">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Drawer Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      <aside
        className={`
          fixed top-0 bottom-0 z-[150] w-80 max-w-[85vw]
          ${language === 'ar' ? 'right-0 border-l' : 'left-0 border-r'}
          bg-white dark:bg-[#0c1017] dark:glass-ultra border-slate-200 dark:border-white/10
          flex flex-col shadow-2xl
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : (language === 'ar' ? 'translate-x-full' : '-translate-x-full')}
        `}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--industrial-primary)] to-[var(--industrial-secondary)] flex items-center justify-center shadow-lg shadow-[var(--industrial-primary)]/20 text-white">
              <Factory className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                {language === 'ar' ? 'قائمة النظام الإدارية' : 'System Drawer'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-gray-400 font-bold truncate max-w-[170px]">
                {plantLabel}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            title={language === 'ar' ? 'إغلاق القائمة' : 'Close Menu'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto pb-16">
          {menuItems.map(item => renderMenuItem(item))}
        </nav>

        {/* Bottom Status & Active Profile */}
        <div className="mt-auto p-3.5 border-t border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-black/20">
          <div className="flex items-center gap-3 p-2.5 bg-white/60 dark:bg-[#0f131a]/60 border border-slate-200/80 dark:border-white/5 rounded-2xl">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--industrial-primary)] to-[var(--industrial-secondary)] p-0.5 shrink-0 overflow-hidden shadow">
              <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center text-white text-xs font-black overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.name?.charAt(0) || 'U'}</span>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-800 dark:text-white truncate">{user?.name || 'Quality Operator'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-bold text-[#00A3E0] truncate tracking-tight">
                  {user?.role || 'Active User'}
                </p>
              </div>
            </div>
          </div>
        </div>

      {/* Help Modal Overlay */}
      {helpItemId && MODULE_HELP[helpItemId] && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm" onClick={() => setHelpItemId(null)}>
          <div 
            className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--industrial-primary)]/10 flex items-center justify-center text-[var(--industrial-primary)]">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {language === 'ar' ? 'دليل استخدام الموديول' : 'Module User Guide'}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-gray-400">
                    {language === 'ar' ? 'شرح وخطوات تسجيل البيانات' : 'Explanation and data recording steps'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setHelpItemId(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--industrial-primary)]"></span>
                  {language === 'ar' ? 'ما هذا الموديول؟' : 'What is this module?'}
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-700 dark:text-gray-300 leading-relaxed text-sm">
                  {language === 'ar' ? MODULE_HELP[helpItemId].descriptionAr : MODULE_HELP[helpItemId].descriptionEn}
                </div>
              </div>

              {/* How to Create */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--industrial-secondary)]"></span>
                  {language === 'ar' ? 'طريقة الإنشاء خطوة بخطوة' : 'Step-by-step Creation'}
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-700 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-line">
                  {language === 'ar' ? MODULE_HELP[helpItemId].howToCreateAr : MODULE_HELP[helpItemId].howToCreateEn}
                </div>
              </div>

              {/* How to Record */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--industrial-success)]"></span>
                  {language === 'ar' ? 'آلية تسجيل البيانات' : 'Data Recording Mechanism'}
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-700 dark:text-gray-300 leading-relaxed text-sm">
                  {language === 'ar' ? MODULE_HELP[helpItemId].howToRecordAr : MODULE_HELP[helpItemId].howToRecordEn}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex justify-end">
              <button 
                onClick={() => setHelpItemId(null)}
                className="px-6 py-2 bg-[var(--industrial-primary)] hover:bg-[var(--industrial-primary)]/90 text-white font-bold rounded-xl shadow-sm transition-all"
              >
                {language === 'ar' ? 'فهمت ذلك' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
    </>
  );
}

export default Sidebar;
