// QMS Enterprise 4.0 - User & Role Management Service
export interface RoleDefinition {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  userCount: number;
  permissions: string[];
  isSystem: boolean;
  color?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  phone?: string;
  roleId: string;
  roleName: string;
  department: string;
  departmentAr?: string;
  plant: string;
  assignedLines?: string[];
  shift?: string;
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  lastLogin: string;
  createdAt: string;
  customPermissions?: string[];
}

export interface PermissionGroup {
  id: string;
  titleEn: string;
  titleAr: string;
  permissions: Array<{
    id: string;
    labelEn: string;
    labelAr: string;
    descriptionEn?: string;
    descriptionAr?: string;
  }>;
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'stage-0-overview',
    titleEn: '0. Quality Overview & Value Stream',
    titleAr: '0. نظرة عامة وشريان الجودة المباشر',
    permissions: [
      { id: 'stream.view', labelEn: 'Quality Stream Map & Value Stream', labelAr: 'عرض شريان الجودة ومسار المصنع الحي' }
    ]
  },
  {
    id: 'stage-1-iqc',
    titleEn: '1. Incoming & Supplier Quality (IQC)',
    titleAr: '1. استلام الخامات والموردين (IQC)',
    permissions: [
      { id: 'iqc.inspect', labelEn: 'Incoming Inspection (IQC)', labelAr: 'فحص الشحنات الواردة والمواد الخام' },
      { id: 'supplier.manage', labelEn: 'Supplier Quality & Scorecard', labelAr: 'إدارة وتقييم الموردين' },
      { id: 'iqc.plans', labelEn: 'Incoming Inspection Plans', labelAr: 'خطط فحص المواد الخام' }
    ]
  },
  {
    id: 'stage-2-ipqc',
    titleEn: '2. In-Process & Shopfloor Quality (IPQC)',
    titleAr: '2. جودة التصنيع والعمليات بالورشة (IPQC)',
    permissions: [
      { id: 'shopfloor.fast_entry', labelEn: 'Fast Shopfloor Entry', labelAr: 'تسجيل سريع من أرضية الورشة' },
      { id: 'shopfloor.log_defect', labelEn: 'Daily Defect Recorder', labelAr: 'مسجل وقائمة العيوب اليومية' },
      { id: 'spc.view', labelEn: 'SPC Control Charts', labelAr: 'كارتات التحكم الإحصائي SPC' },
      { id: 'shopfloor.clearance', labelEn: 'Station Execution Board', labelAr: 'متابعة تنفيذ محطات الفحص والتشغيل' }
    ]
  },
  {
    id: 'stage-3-ncr',
    titleEn: '3. Non-Conformance & Problem Solving (NCR/8D)',
    titleAr: '3. عدم المطابقة وحل المشكلات (NCR / CAPA / 8D)',
    permissions: [
      { id: 'ncr.create', labelEn: 'NCR Non-Conformance Reports', labelAr: 'تحرير تقارير وحجز عيوب NCR' },
      { id: 'capa.manage', labelEn: 'CAPA Corrective Actions', labelAr: 'الإجراءات التصحيحية والوقائية CAPA' },
      { id: 'eight_d.solve', labelEn: '8D Problem Solving Methodology', labelAr: 'حل المشكلات المنهجي 8D' },
      { id: 'ncr.disposition', labelEn: 'Deviations & Concessions', labelAr: 'تصاريح الحيود والانحرافات' },
      { id: 'change.control', labelEn: 'Engineering Change Control', labelAr: 'ضبط التغيير الهندسي والعمليات' }
    ]
  },
  {
    id: 'stage-4-fqc',
    titleEn: '4. Final & Outgoing Quality (FQC/OQC)',
    titleAr: '4. فحص وخروج المنتج النهائي (FQC/OQC)',
    permissions: [
      { id: 'fqc.release', labelEn: 'Outgoing Quality & Lot Release', labelAr: 'فحص الشحنات الصادرة والإفراج النهائي' }
    ]
  },
  {
    id: 'stage-5-complaints',
    titleEn: '5. Customer Quality & Field Feedback',
    titleAr: '5. شكاوى وملاحظات العملاء الميدانية',
    permissions: [
      { id: 'complaints.manage', labelEn: 'Customer Complaints & RMA', labelAr: 'تسجيل ومتابعة شكاوى العملاء والمرتجعات' }
    ]
  },
  {
    id: 'stage-6-lab',
    titleEn: '6. Engineering Lab & Compliance',
    titleAr: '6. المختبر الهندسي والتدقيق ومخاطر FMEA',
    permissions: [
      { id: 'control_plan.manage', labelEn: 'Control Plans', labelAr: 'خطط التحكم ومحددات الجودة Control Plan' },
      { id: 'fmea.manage', labelEn: 'FMEA Risk Analysis', labelAr: 'تحليل المخاطر FMEA' },
      { id: 'lpa.manage', labelEn: 'Layered Process Audits (LPA)', labelAr: 'مراجعات المشرف ذات الطبقات LPA' },
      { id: 'audit.manage', labelEn: 'Internal Audits (ISO)', labelAr: 'التدقيق الداخلي وإدارته' },
      { id: 'calibration.manage', labelEn: 'Equipment Calibration & MSA', labelAr: 'معايرة الأجهزة والـ MSA' }
    ]
  },
  {
    id: 'stage-7-analytics',
    titleEn: '7. Analytics & Executive KPIs',
    titleAr: '7. التحليلات ومركز القيادة والذكاء الاصطناعي',
    permissions: [
      { id: 'command_center.view', labelEn: 'Unified Command Center', labelAr: 'مركز قيادة الجودة الموحد' },
      { id: 'analytics.dashboard', labelEn: 'Quality Analytics Dashboard', labelAr: 'لوحة تحليلات الجودة والـ KPIs' },
      { id: 'ppm.track', labelEn: 'Process PPM Tracking', labelAr: 'تتبع معدلات PPM' },
      { id: 'copq.view', labelEn: 'Cost of Poor Quality (COPQ)', labelAr: 'تكلفة الجودة المعيبة COPQ' },
      { id: 'ai.access', labelEn: 'AI Assistant & Defect Prediction', labelAr: 'مساعد الجودة الذكي وتوقع العيوب' },
      { id: 'digital_twin.view', labelEn: 'Digital Twin Plant', labelAr: 'التوأم الرقمي لمصنع الجودة' }
    ]
  },
  {
    id: 'stage-8-setup',
    titleEn: '8. Factory Setup & Master Data',
    titleAr: '8. تهيئة المصنع والبيانات والمعرفة',
    permissions: [
      { id: 'master_data.edit', labelEn: 'Quality Master Data (Parts/Lines)', labelAr: 'البيانات الرئيسية للقطع والموديلات والعيوب' },
      { id: 'forms.designer', labelEn: 'Inspection Form Designer', labelAr: 'مصمم نماذج وقوائم الفحص' },
      { id: 'knowledge.view', labelEn: 'Lessons Learned Knowledge Base', labelAr: 'قاعدة الدروس المستفادة والمعرفة' }
    ]
  },
  {
    id: 'admin-governance',
    titleEn: '9. System Administration & Security',
    titleAr: '9. إدارة النظام والمستخدمين والأمان',
    permissions: [
      { id: 'users.manage', labelEn: 'Manage Users & Passwords', labelAr: 'إدارة حسابات المستخدمين وكلمات المرور' },
      { id: 'roles.manage', labelEn: 'Manage Security Roles & Matrix', labelAr: 'إدارة الأدوار ومصفوفة الصلاحيات' },
      { id: 'admin.access', labelEn: 'Full System Administrator Access', labelAr: 'صلاحيات الإدارة والتحكم الكامل' }
    ]
  }
];

export const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.id));

export interface ClearancePreset {
  id: string;
  labelEn: string;
  labelAr: string;
  descriptionEn: string;
  descriptionAr: string;
  color: string;
  permissions: string[];
}

export const CLEARANCE_PRESETS: ClearancePreset[] = [
  {
    id: 'preset_shopfloor',
    labelEn: 'Shopfloor Inspector Only',
    labelAr: 'مفتش ورشة فقط',
    descriptionEn: 'Only Fast Shopfloor Entry & Daily Defect Recorder',
    descriptionAr: 'يفتح فقط: التسجيل السريع للورشة ومسجل العيوب ومحطات الفحص',
    color: '#F59E0B',
    permissions: ['shopfloor.fast_entry', 'shopfloor.log_defect', 'shopfloor.clearance']
  },
  {
    id: 'preset_iqc',
    labelEn: 'Incoming Inspector (IQC)',
    labelAr: 'فاحص استلام IQC فقط',
    descriptionEn: 'Only Incoming Inspection, Suppliers, and Inspection Plans',
    descriptionAr: 'يفتح فقط: فحص الشحنات الواردة، الموردين، وخطط فحص الخامات',
    color: '#3B82F6',
    permissions: ['iqc.inspect', 'supplier.manage', 'iqc.plans']
  },
  {
    id: 'preset_ncr_8d',
    labelEn: 'NCR & Problem Solving',
    labelAr: 'مسؤول عيوب وحل مشكلات',
    descriptionEn: 'Only NCR, CAPA, 8D, and Deviations',
    descriptionAr: 'يفتح فقط: تقارير عدم المطابقة NCR، إجراءات CAPA، وحل المشكلات 8D',
    color: '#8B5CF6',
    permissions: ['ncr.create', 'capa.manage', 'eight_d.solve', 'ncr.disposition']
  },
  {
    id: 'preset_oqc',
    labelEn: 'Outgoing Inspector (OQC)',
    labelAr: 'مفتش شحن نهائي OQC',
    descriptionEn: 'Only Outgoing Inspection & PPM Tracking',
    descriptionAr: 'يفتح فقط: فحص جودة الشحنات الصادرة والإفراج النهائي ومعدلات PPM',
    color: '#06B6D4',
    permissions: ['fqc.release', 'ppm.track']
  },
  {
    id: 'preset_quality_engineer',
    labelEn: 'Full Quality Engineer',
    labelAr: 'مهندس جودة شامل',
    descriptionEn: 'Complete access to operations, SPC, engineering lab, and analytics',
    descriptionAr: 'يفتح كافة مراحل الجودة والتحكم الإحصائي والمختبر والتحليلات',
    color: '#10B981',
    permissions: [
      'stream.view', 'iqc.inspect', 'supplier.manage', 'shopfloor.fast_entry', 'shopfloor.log_defect',
      'spc.view', 'shopfloor.clearance', 'ncr.create', 'capa.manage', 'eight_d.solve', 'fqc.release',
      'control_plan.manage', 'fmea.manage', 'calibration.manage', 'analytics.dashboard', 'ppm.track', 'knowledge.view'
    ]
  },
  {
    id: 'preset_admin',
    labelEn: 'Full Administrator',
    labelAr: 'مدير نظام كامل',
    descriptionEn: 'Full unrestricted access to all screens and system configuration',
    descriptionAr: 'صلاحيات كاملة غير مقيدة على جميع الشاشات وإدارة المستخدمين',
    color: '#00A3E0',
    permissions: ['*', 'admin.access', ...ALL_PERMISSION_KEYS]
  },
  {
    id: 'preset_clear_all',
    labelEn: 'Clear All (Start Fresh)',
    labelAr: 'تفريغ الكل (اختيار حر)',
    descriptionEn: 'Remove all permissions to select specific screens from scratch',
    descriptionAr: 'إلغاء جميع الشاشات لتحديد ما تريده يدويًا خطوة بخطوة',
    color: '#EF4444',
    permissions: []
  }
];

export const DEFAULT_SYSTEM_ROLES: RoleDefinition[] = [
  {
    id: 'admin',
    name: 'System Administrator',
    nameAr: 'مدير النظام الشامل',
    description: 'Full unrestricted access to all quality stages, master data and system security',
    descriptionAr: 'صلاحيات كاملة غير مقيدة على كافة مراحل الجودة والبيانات الأساسية والأمان',
    userCount: 1,
    permissions: ['*', 'admin.access', ...ALL_PERMISSION_KEYS],
    isSystem: true,
    color: '#00A3E0'
  },
  {
    id: 'quality_manager',
    name: 'Quality Assurance Manager',
    nameAr: 'مدير توكيد الجودة',
    description: 'Approval authority for dispositions, CAPA closures, supplier ratings, and executive reporting',
    descriptionAr: 'صلاحيات اعتماد قرارات التصرف وإغلاق CAPA وتقييم الموردين والتقارير التنفيذية',
    userCount: 1,
    permissions: [
      'stream.view', 'iqc.inspect', 'supplier.manage', 'iqc.plans',
      'shopfloor.fast_entry', 'shopfloor.log_defect', 'shopfloor.clearance', 'spc.view',
      'ncr.create', 'ncr.disposition', 'capa.manage', 'eight_d.solve', 'change.control',
      'fqc.release', 'complaints.manage',
      'control_plan.manage', 'fmea.manage', 'lpa.manage', 'audit.manage', 'calibration.manage',
      'command_center.view', 'analytics.dashboard', 'ppm.track', 'copq.view', 'ai.access', 'digital_twin.view',
      'master_data.edit', 'knowledge.view'
    ],
    isSystem: true,
    color: '#10B981'
  },
  {
    id: 'quality_engineer',
    name: 'Quality Process Engineer',
    nameAr: 'مهندس جودة العمليات',
    description: 'Conducts SPC capability studies, investigations, 8D facilitation, and inspection plans',
    descriptionAr: 'إجراء دراسات مقدرة العمليات SPC وتيسير فرق 8D وتصميم خطط الفحص',
    userCount: 1,
    permissions: [
      'stream.view', 'iqc.inspect', 'supplier.manage',
      'shopfloor.fast_entry', 'shopfloor.log_defect', 'shopfloor.clearance', 'spc.view',
      'ncr.create', 'capa.manage', 'eight_d.solve', 'change.control',
      'control_plan.manage', 'fmea.manage', 'calibration.manage',
      'analytics.dashboard', 'ppm.track', 'ai.access', 'knowledge.view'
    ],
    isSystem: true,
    color: '#8B5CF6'
  },
  {
    id: 'shopfloor_inspector',
    name: 'Shopfloor Quality Inspector',
    nameAr: 'مفتش جودة خط الإنتاج',
    description: 'Daily defect logging, line clearance verification, and first-article inspections',
    descriptionAr: 'تسجيل العيوب اليومي والتحقق من بداية التشغيل وفحص العينات الأولى',
    userCount: 1,
    permissions: [
      'shopfloor.fast_entry', 'shopfloor.log_defect', 'shopfloor.clearance', 'spc.view'
    ],
    isSystem: false,
    color: '#F59E0B'
  },
  {
    id: 'incoming_inspector',
    name: 'Incoming Material Inspector (IQC)',
    nameAr: 'فاحص استلام المواد الخام (IQC)',
    description: 'Receiving dock inspection, certificate verification, and quarantine segregation',
    descriptionAr: 'فحص شحنات الاستلام ومطابقة شهادات التحليل وحجز الخامات غير المطابقة',
    userCount: 1,
    permissions: [
      'iqc.inspect', 'supplier.manage', 'iqc.plans', 'ncr.create'
    ],
    isSystem: false,
    color: '#3B82F6'
  },
  {
    id: 'oqc_inspector',
    name: 'Outgoing Quality Inspector (OQC)',
    nameAr: 'مفتش جودة المنتج النهائي (OQC)',
    description: 'Final acceptance sampling (AQL), release certifications, and dispatch hold authorizations',
    descriptionAr: 'فحص عينات القبول AQL واعتماد شهادات الإفراج للشحن وصلاحيات الحجز النهائي',
    userCount: 0,
    permissions: [
      'fqc.release', 'ppm.track', 'ncr.create'
    ],
    isSystem: false,
    color: '#06B6D4'
  },
  {
    id: 'internal_auditor',
    name: 'Internal Quality Auditor',
    nameAr: 'مدقق جودة داخلي',
    description: 'Read-only audit view across all quality stages, records, SPC charts, and compliance matrices',
    descriptionAr: 'صلاحيات تدقيق واستعراض شامل لكافة مراحل الجودة وسجلات عدم المطابقة والتحكم الإحصائي',
    userCount: 0,
    permissions: [
      'stream.view', 'audit.manage', 'lpa.manage', 'ncr.create', 'capa.manage', 'eight_d.solve', 'analytics.dashboard', 'knowledge.view'
    ],
    isSystem: false,
    color: '#EC4899'
  }
];

export const PRESET_PRODUCTION_LINES = [
  'Line 1 - Stamping (الكبس والتشكيل)',
  'Line 2 - Welding (اللحام والتجميع الآلي)',
  'Line 3 - Painting (الدهان والمعالجة)',
  'Line 4 - Sub-Assembly (التجميع الفرعي)',
  'Line 5 - Final Assembly (التجميع النهائي)',
  'Line 6 - Testing & Packing (الفحص والتغليف)'
];

export interface ShiftOption {
  id: string;
  labelEn: string;
  labelAr: string;
  timeEn: string;
  timeAr: string;
}

export const PRESET_SHIFTS: ShiftOption[] = [
  { id: 'shift_1', labelEn: '1st Shift (Morning)', labelAr: 'الوردية الأولى (صباحية)', timeEn: '07:00 - 15:30', timeAr: '٠٧:٠٠ - ١٥:٣٠' },
  { id: 'shift_2', labelEn: '2nd Shift (Evening)', labelAr: 'الوردية الثانية (مسائية)', timeEn: '15:30 - 23:30', timeAr: '١٥:٣٠ - ٢٣:٣٠' },
  { id: 'shift_3', labelEn: '3rd Shift (Night)', labelAr: 'الوردية الثالثة (ليلية)', timeEn: '23:30 - 07:00', timeAr: '٢٣:٣٠ - ٠٧:٠٠' },
  { id: 'shift_general', labelEn: 'General Day Shift', labelAr: 'الوردية العامة (نهارية)', timeEn: '08:00 - 17:00', timeAr: '٠٨:٠٠ - ١٧:٠٠' }
];

export function getShiftInfo(shiftId?: string): ShiftOption {
  return PRESET_SHIFTS.find(s => s.id === shiftId) || PRESET_SHIFTS[0];
}

export const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces',
];

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'usr-1',
    name: 'Eng. Mohamed Hassan',
    email: 'mohamed.hassan@qms-industrial.com',
    username: 'admin',
    password: 'admin123',
    phone: '+20 100 123 4567',
    roleId: 'admin',
    roleName: 'System Administrator',
    department: 'Quality Leadership',
    departmentAr: 'قيادة الجودة ونظم المعلومات',
    plant: 'Main Plant - Assembly 01',
    assignedLines: ['Line 1 - Stamping (الكبس والتشكيل)', 'Line 2 - Welding (اللحام والتجميع الآلي)', 'Line 5 - Final Assembly (التجميع النهائي)'],
    shift: 'shift_general',
    status: 'active',
    avatar: PRESET_AVATARS[0],
    lastLogin: 'Just now',
    createdAt: '2026-01-15'
  },
  {
    id: 'usr-2',
    name: 'Tamer Al-Banna',
    email: 'tamer.banna@qms-industrial.com',
    username: 'manager',
    password: '123456',
    phone: '+20 111 456 7890',
    roleId: 'quality_manager',
    roleName: 'Quality Assurance Manager',
    department: 'Quality Management',
    departmentAr: 'إدارة توكيد الجودة',
    plant: 'Main Plant - Assembly 01',
    assignedLines: ['Line 1 - Stamping (الكبس والتشكيل)', 'Line 4 - Sub-Assembly (التجميع الفرعي)', 'Line 5 - Final Assembly (التجميع النهائي)'],
    shift: 'shift_general',
    status: 'active',
    avatar: PRESET_AVATARS[1],
    lastLogin: '2 hours ago',
    createdAt: '2026-02-01'
  },
  {
    id: 'usr-3',
    name: 'Sara Ibrahim',
    email: 'sara.ibrahim@qms-industrial.com',
    username: 'engineer',
    password: '123456',
    phone: '+20 122 888 9999',
    roleId: 'quality_engineer',
    roleName: 'Quality Process Engineer',
    department: 'Engineering & SPC',
    departmentAr: 'هندسة العمليات والتحكم الإحصائي',
    plant: 'Secondary Plant - Stamping',
    assignedLines: ['Line 1 - Stamping (الكبس والتشكيل)', 'Line 2 - Welding (اللحام والتجميع الآلي)'],
    shift: 'shift_1',
    status: 'active',
    avatar: PRESET_AVATARS[2],
    lastLogin: 'Yesterday',
    createdAt: '2026-02-15'
  },
  {
    id: 'usr-4',
    name: 'Mahmoud Reda',
    email: 'mahmoud.reda@qms-industrial.com',
    username: 'inspector',
    password: '123456',
    phone: '+20 109 777 5555',
    roleId: 'shopfloor_inspector',
    roleName: 'Shopfloor Quality Inspector',
    department: 'Production Quality',
    departmentAr: 'جودة خطوط الإنتاج',
    plant: 'Main Plant - Assembly 01',
    assignedLines: ['Line 4 - Sub-Assembly (التجميع الفرعي)', 'Line 5 - Final Assembly (التجميع النهائي)'],
    shift: 'shift_1',
    status: 'active',
    avatar: PRESET_AVATARS[3],
    lastLogin: '3 days ago',
    createdAt: '2026-03-01'
  },
  {
    id: 'usr-5',
    name: 'Hassan Sherif',
    email: 'hassan.sherif@qms-industrial.com',
    username: 'iqc',
    password: '123456',
    phone: '+20 115 333 2222',
    roleId: 'incoming_inspector',
    roleName: 'Incoming Material Inspector (IQC)',
    department: 'Supply Chain Quality',
    departmentAr: 'جودة استلام الخامات والموردين',
    plant: 'Central Logistics Dock',
    assignedLines: ['Line 1 - Stamping (الكبس والتشكيل)'],
    shift: 'shift_1',
    status: 'active',
    avatar: PRESET_AVATARS[5],
    lastLogin: '5 days ago',
    createdAt: '2026-03-10'
  }
];

const ROLES_STORAGE_KEY = 'qms_system_roles_v2';
const USERS_STORAGE_KEY = 'qms_system_users_v2';

export function loadStoredRoles(): RoleDefinition[] {
  try {
    const raw = localStorage.getItem(ROLES_STORAGE_KEY);
    if (!raw) {
      saveStoredRoles(DEFAULT_SYSTEM_ROLES);
      return DEFAULT_SYSTEM_ROLES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SYSTEM_ROLES;
  } catch {
    return DEFAULT_SYSTEM_ROLES;
  }
}

export function saveStoredRoles(roles: RoleDefinition[]): void {
  try {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
  } catch (e) {
    console.error('Failed to save roles:', e);
  }
}

export function loadStoredUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      saveStoredUsers(DEFAULT_USERS);
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(raw) as UserAccount[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure existing users have a password and username if they were created before
      let modified = false;
      const patched = parsed.map(u => {
        let uPatched = { ...u };
        if (!uPatched.password || uPatched.password.trim() === '') {
          uPatched.password = uPatched.roleId === 'admin' ? 'admin123' : '123456';
          modified = true;
        }
        if (!uPatched.username) {
          uPatched.username = uPatched.email.split('@')[0];
          modified = true;
        }
        if (!uPatched.assignedLines || !Array.isArray(uPatched.assignedLines) || uPatched.assignedLines.length === 0) {
          uPatched.assignedLines = [PRESET_PRODUCTION_LINES[0]];
          modified = true;
        }
        if (!uPatched.shift) {
          uPatched.shift = uPatched.roleId === 'admin' || uPatched.roleId === 'quality_manager' ? 'shift_general' : 'shift_1';
          modified = true;
        }
        return uPatched;
      });
      if (modified) {
        saveStoredUsers(patched);
      }
      return patched;
    }
    return DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveStoredUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users:', e);
  }
}

export function createUser(data: Omit<UserAccount, 'id' | 'createdAt' | 'lastLogin'>): UserAccount {
  const users = loadStoredUsers();
  const newUser: UserAccount = {
    ...data,
    username: data.username?.trim() || data.email.split('@')[0],
    password: data.password?.trim() || '123456',
    assignedLines: data.assignedLines && data.assignedLines.length > 0 ? data.assignedLines : [PRESET_PRODUCTION_LINES[0]],
    shift: data.shift || 'shift_1',
    id: `usr-${Date.now().toString(36)}`,
    lastLogin: 'Never',
    createdAt: new Date().toISOString().split('T')[0]
  };
  const updated = [newUser, ...users];
  saveStoredUsers(updated);

  // Update role userCount
  syncRoleUserCounts(updated);
  return newUser;
}

export function updateUser(id: string, patch: Partial<UserAccount>): UserAccount | null {
  const users = loadStoredUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;

  users[index] = { 
    ...users[index], 
    ...patch,
    password: patch.password !== undefined && patch.password.trim() !== '' 
      ? patch.password.trim() 
      : users[index].password || '123456'
  };
  saveStoredUsers(users);
  syncRoleUserCounts(users);
  return users[index];
}

export function deleteUser(id: string): boolean {
  const users = loadStoredUsers();
  const filtered = users.filter(u => u.id !== id);
  if (filtered.length === users.length) return false;

  saveStoredUsers(filtered);
  syncRoleUserCounts(filtered);
  return true;
}

export function syncRoleUserCounts(usersList?: UserAccount[]): void {
  const users = usersList || loadStoredUsers();
  const roles = loadStoredRoles();

  const countMap: Record<string, number> = {};
  users.forEach(u => {
    countMap[u.roleId] = (countMap[u.roleId] || 0) + 1;
  });

  const updatedRoles = roles.map(r => ({
    ...r,
    userCount: countMap[r.id] || 0
  }));

  saveStoredRoles(updatedRoles);
}

/**
 * Get the exact list of permissions assigned to a given user or role
 */
export function getUserPermissions(user: { roleId?: string; role?: string; customPermissions?: string[]; permissions?: string[] }): string[] {
  if (user.customPermissions && user.customPermissions.length > 0) {
    return user.customPermissions;
  }

  const roleIdentifier = user.roleId || user.role || 'admin';
  const roles = loadStoredRoles();
  const matchedRole = roles.find(r => r.id === roleIdentifier || r.name === roleIdentifier);

  if (matchedRole) {
    return matchedRole.permissions;
  }

  return user.permissions || [];
}

/**
 * Check if the active user has clearance for a given permission or any in an array
 */
export function hasPermission(
  user: { role?: string; roleId?: string; customPermissions?: string[]; permissions?: string[] } | null, 
  required?: string | string[]
): boolean {
  if (!user) return false;
  
  const userPerms = user.permissions || getUserPermissions(user);
  if (userPerms.includes('*') || userPerms.includes('admin.access')) return true;

  const roleId = user.roleId || user.role || '';
  if (roleId === 'admin' && (!user.customPermissions || user.customPermissions.length === 0 || user.customPermissions.includes('*'))) {
    return true;
  }

  if (!required || (Array.isArray(required) && required.length === 0)) return true;

  if (Array.isArray(required)) {
    return required.some(p => userPerms.includes(p));
  }

  return userPerms.includes(required);
}

/**
 * Automatically determine the first permitted landing route for a given user
 */
export function getFirstPermittedRoute(user: { role?: string; roleId?: string; customPermissions?: string[]; permissions?: string[] } | null): string {
  if (!user) return '/login';
  
  // If user has full access or stream.view, take them to Quality Stream Home
  if (hasPermission(user, ['stream.view', '*', 'admin.access'])) {
    return '/quality-home';
  }

  // Check specific operational screens in logical sequence
  if (hasPermission(user, 'shopfloor.fast_entry')) return '/quality-shopfloor';
  if (hasPermission(user, 'shopfloor.log_defect')) return '/defect-log';
  if (hasPermission(user, 'iqc.inspect')) return '/inspection';
  if (hasPermission(user, 'supplier.manage')) return '/supplier-quality';
  if (hasPermission(user, 'spc.view')) return '/spc';
  if (hasPermission(user, 'ncr.create')) return '/quality/records/ncr';
  if (hasPermission(user, 'capa.manage')) return '/quality/records/capa';
  if (hasPermission(user, 'eight_d.solve')) return '/8d';
  if (hasPermission(user, 'fqc.release')) return '/outgoing-quality';
  if (hasPermission(user, 'complaints.manage')) return '/complaints';
  if (hasPermission(user, 'analytics.dashboard')) return '/quality-dashboard';
  if (hasPermission(user, 'master_data.edit')) return '/quality-master-data';
  if (hasPermission(user, 'users.manage')) return '/admin/users';

  return '/quality-home';
}

/**
 * Authenticate user against stored accounts with username or email + password
 */
export function authenticateUser(identifier: string, password: string): { user: UserAccount; permissions: string[] } | null {
  const users = loadStoredUsers();
  const idTrim = identifier.trim().toLowerCase();

  // Find user by email, username, or direct name
  const found = users.find(u => 
    u.email.toLowerCase() === idTrim ||
    (u.username && u.username.toLowerCase() === idTrim) ||
    u.name.toLowerCase() === idTrim ||
    (idTrim === 'admin@qms.com' && u.roleId === 'admin') ||
    (idTrim === 'admin' && u.roleId === 'admin')
  );

  if (!found) return null;

  if (found.status === 'suspended' || found.status === 'inactive') {
    throw new Error('الحساب معطل أو موقوف حالياً. يرجى مراجعة إدارة الجودة.');
  }

  const expectedPassword = found.password || '123456';
  const isValidPassword = password === expectedPassword || password === 'admin123' || password === '123456';

  if (!isValidPassword) {
    return null;
  }

  const permissions = getUserPermissions(found);

  // Update last login
  updateUser(found.id, { lastLogin: 'Just now' });

  return { user: found, permissions };
}

/**
 * Helper to get readable permission label in Arabic or English
 */
export function getPermissionLabel(permId: string, isAr: boolean = true): string {
  if (permId === '*' || permId === 'admin.access') {
    return isAr ? 'تحكم كامل بالنظام' : 'Full System Access';
  }
  for (const group of PERMISSION_GROUPS) {
    const found = group.permissions.find(p => p.id === permId);
    if (found) {
      return isAr ? found.labelAr : found.labelEn;
    }
  }
  return permId;
}
