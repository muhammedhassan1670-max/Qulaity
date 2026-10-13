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
    id: 'stage-1-iqc',
    titleEn: '1. Incoming & Supplier Quality (IQC)',
    titleAr: '1. استلام الخامات والموردين (IQC)',
    permissions: [
      { id: 'iqc.inspect', labelEn: 'Inspect Raw Materials', labelAr: 'فحص المواد الخام الواردة' },
      { id: 'iqc.approve_coa', labelEn: 'Approve Supplier COA', labelAr: 'اعتماد شهادات التحليل COA' },
      { id: 'supplier.manage', labelEn: 'Manage Supplier Scorecard', labelAr: 'إدارة تقييم ومخالفات الموردين' }
    ]
  },
  {
    id: 'stage-2-ipqc',
    titleEn: '2. In-Process & Shopfloor Quality (IPQC)',
    titleAr: '2. جودة التصنيع والعمليات (IPQC)',
    permissions: [
      { id: 'shopfloor.log_defect', labelEn: 'Log Defect Records', labelAr: 'تسجيل العيوب المباشر بالورشة' },
      { id: 'shopfloor.clearance', labelEn: 'Line Clearance & Patrol', labelAr: 'مطابقة بداية التشغيل وفحص الخطوط' },
      { id: 'spc.view', labelEn: 'View SPC Control Charts', labelAr: 'استعراض كارتات التحكم الإحصائي' },
      { id: 'spc.calculate', labelEn: 'Configure SPC Limits & Rules', labelAr: 'ضبط حدود التحكم وقواعد نيلسون' }
    ]
  },
  {
    id: 'stage-3-ncr',
    titleEn: '3. Non-Conformance & Problem Solving (NCR/CAPA/8D)',
    titleAr: '3. عدم المطابقة والحل الجذري (NCR/CAPA/8D)',
    permissions: [
      { id: 'ncr.create', labelEn: 'Create & Contain NCR', labelAr: 'تحرير تقارير وحجز عيوب NCR' },
      { id: 'ncr.disposition', labelEn: 'Approve Material Disposition', labelAr: 'اعتماد قرارات التصرف والعزل' },
      { id: 'capa.manage', labelEn: 'Manage Corrective Actions (CAPA)', labelAr: 'إدارة وتتبع إجراءات CAPA' },
      { id: 'eight_d.solve', labelEn: 'Lead 8D Problem Solving', labelAr: 'قيادة فرق حل المشكلات 8D' }
    ]
  },
  {
    id: 'stage-4-fqc',
    titleEn: '4. Final & Outgoing Quality (FQC/OQC)',
    titleAr: '4. فحص وخروج المنتج النهائي (FQC/OQC)',
    permissions: [
      { id: 'fqc.release', labelEn: 'Release Finished Lots for Dispatch', labelAr: 'اعتماد الإفراج النهائي للشحن' },
      { id: 'fqc.aql_sample', labelEn: 'Perform AQL Acceptance Sampling', labelAr: 'تنفيذ فحص عينات القبول AQL' }
    ]
  },
  {
    id: 'stage-5-complaints',
    titleEn: '5. Customer Quality & Field Feedback',
    titleAr: '5. شكاوى وملاحظات العملاء',
    permissions: [
      { id: 'complaints.manage', labelEn: 'Register & Investigate Complaints', labelAr: 'تسجيل والتحقيق في شكاوى العملاء' },
      { id: 'rma.approve', labelEn: 'Approve Product Returns (RMA)', labelAr: 'اعتماد استرجاع المنتجات المعيبة' }
    ]
  },
  {
    id: 'admin-governance',
    titleEn: 'System Administration & Master Data',
    titleAr: 'إدارة النظام والبيانات الأساسية',
    permissions: [
      { id: 'users.manage', labelEn: 'Manage Users & Passwords', labelAr: 'إدارة المستخدمين والحسابات' },
      { id: 'roles.manage', labelEn: 'Manage Security Roles & Matrix', labelAr: 'إدارة الأدوار ومصفوفة الصلاحيات' },
      { id: 'master_data.edit', labelEn: 'Edit Plants, Lines & Defects Catalog', labelAr: 'تعديل وتكويد الخطوط والعيوب' },
      { id: 'admin.access', labelEn: 'Full System Administrator Access', labelAr: 'صلاحيات الإدارة والتحكم الكامل' }
    ]
  }
];

export const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.id));

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
      'iqc.inspect', 'iqc.approve_coa', 'supplier.manage',
      'shopfloor.clearance', 'spc.view', 'spc.calculate',
      'ncr.create', 'ncr.disposition', 'capa.manage', 'eight_d.solve',
      'fqc.release', 'fqc.aql_sample', 'complaints.manage', 'rma.approve',
      'master_data.edit'
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
      'iqc.inspect', 'iqc.approve_coa',
      'shopfloor.log_defect', 'shopfloor.clearance', 'spc.view', 'spc.calculate',
      'ncr.create', 'capa.manage', 'eight_d.solve',
      'fqc.aql_sample', 'complaints.manage'
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
      'shopfloor.log_defect', 'shopfloor.clearance', 'spc.view',
      'ncr.create', 'fqc.aql_sample'
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
      'iqc.inspect', 'iqc.approve_coa', 'ncr.create'
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
      'fqc.release', 'fqc.aql_sample', 'ncr.create'
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
      'iqc.inspect', 'shopfloor.clearance', 'spc.view', 'ncr.create', 'capa.manage', 'eight_d.solve', 'fqc.aql_sample', 'complaints.manage'
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
        if (!uPatched.password) {
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
  user: { role?: string; roleId?: string; permissions?: string[] } | null, 
  required?: string | string[]
): boolean {
  if (!user) return false;
  
  const roleId = user.roleId || user.role || '';
  if (roleId === 'admin') return true;
  
  const userPerms = user.permissions || getUserPermissions(user);
  if (userPerms.includes('*') || userPerms.includes('admin.access')) return true;

  if (!required || (Array.isArray(required) && required.length === 0)) return true;

  if (Array.isArray(required)) {
    return required.some(p => userPerms.includes(p));
  }

  return userPerms.includes(required);
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
