// QMS Enterprise 4.0 - Professional User & Permissions Management Workspace
import { useState, useMemo, useRef } from 'react';
import { 
  Users,
  Search,
  Plus,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  RefreshCw,
  Download,
  Edit2,
  Trash2,
  Camera,
  X,
  Lock,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Shield,
  ShieldCheck,
  LogIn,
  Sliders,
  Sparkles,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Table as TableIcon,
  Share2,
  Clock,
  Factory,
  Send,
  Smartphone,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/utils/translations';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { 
  loadStoredUsers, 
  loadStoredRoles, 
  createUser, 
  updateUser, 
  deleteUser, 
  getUserPermissions,
  getShiftInfo,
  PERMISSION_GROUPS,
  ALL_PERMISSION_KEYS,
  CLEARANCE_PRESETS,
  getFirstPermittedRoute,
  PRESET_AVATARS,
  PRESET_PRODUCTION_LINES,
  PRESET_SHIFTS,
  type UserAccount,
  type RoleDefinition,
  type ClearancePreset
} from '@/services/userService';

const statusConfig = {
  active: { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: CheckCircle2, labelEn: 'Active', labelAr: 'مفعل' },
  inactive: { color: 'bg-slate-500/20 text-slate-300 border-slate-500/30', icon: XCircle, labelEn: 'Inactive', labelAr: 'معطل' },
  suspended: { color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icon: AlertOctagon, labelEn: 'Suspended', labelAr: 'موقوف' }
};

export function UsersPage() {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const navigate = useNavigate();
  const { setUser } = useAppStore();

  const [users, setUsers] = useState<UserAccount[]>(() => loadStoredUsers());
  const [roles] = useState<RoleDefinition[]>(() => loadStoredRoles());
  
  // View mode: 'cards' or 'table'
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    return (localStorage.getItem('qms_users_view_mode') as 'cards' | 'table') || 'cards';
  });

  const handleSetViewMode = (mode: 'cards' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('qms_users_view_mode', mode);
  };

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [viewingPermissionsUser, setViewingPermissionsUser] = useState<UserAccount | null>(null);
  const [quickPasswordUser, setQuickPasswordUser] = useState<UserAccount | null>(null);
  const [shareCredentialsUser, setShareCredentialsUser] = useState<UserAccount | null>(null);
  const [newQuickPassword, setNewQuickPassword] = useState('');
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);

  // Visibility states for passwords
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [showQuickDirectory, setShowQuickDirectory] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    roleId: roles[0]?.id || 'quality_engineer',
    department: 'Quality Engineering',
    plant: 'Main Plant - Assembly 01',
    shift: 'shift_1',
    assignedLines: [PRESET_PRODUCTION_LINES[0]],
    status: 'active' as 'active' | 'inactive' | 'suspended',
    avatar: PRESET_AVATARS[0],
    customPermissions: [] as string[],
    useCustomPermissions: false
  });
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [permissionSearch, setPermissionSearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => [
    { labelEn: 'Total Users', labelAr: 'إجمالي المستخدمين', value: users.length, color: 'text-white' },
    { labelEn: 'Active Shift Staff', labelAr: 'المستخدمين النشطين', value: users.filter(u => u.status === 'active').length, color: 'text-emerald-400' },
    { labelEn: 'Custom Permissions', labelAr: 'صلاحيات مخصصة', value: users.filter(u => u.customPermissions && u.customPermissions.length > 0).length, color: 'text-purple-400' },
    { labelEn: 'Security Roles', labelAr: 'أدوار النظام', value: roles.length, color: 'text-[#00A3E0]' }
  ], [users, roles]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        u.roleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.plant && u.plant.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.assignedLines && u.assignedLines.some(l => l.toLowerCase().includes(searchQuery.toLowerCase())));
      
      const matchStatus = selectedStatus === 'all' || u.status === selectedStatus;
      const matchRole = selectedRoleFilter === 'all' || u.roleId === selectedRoleFilter;
      const matchShift = selectedShiftFilter === 'all' || u.shift === selectedShiftFilter;

      return matchSearch && matchStatus && matchRole && matchShift;
    });
  }, [users, searchQuery, selectedStatus, selectedRoleFilter, selectedShiftFilter]);

  // Open Create Dialog
  const handleOpenCreate = () => {
    const defaultRoleId = roles[0]?.id || 'quality_engineer';
    const defaultRole = roles.find(r => r.id === defaultRoleId);
    setUserForm({
      name: '',
      email: '',
      username: '',
      password: '123456',
      phone: '',
      roleId: defaultRoleId,
      department: 'Quality Assurance',
      plant: 'Main Plant - Assembly 01',
      shift: 'shift_1',
      assignedLines: [PRESET_PRODUCTION_LINES[0], PRESET_PRODUCTION_LINES[3]],
      status: 'active',
      avatar: PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)],
      customPermissions: defaultRole ? [...defaultRole.permissions] : [],
      useCustomPermissions: false
    });
    setShowFormPassword(false);
    setPermissionSearch('');
    setIsCreateOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (user: UserAccount) => {
    setEditingUser(user);
    const activePerms = getUserPermissions(user);
    setUserForm({
      name: user.name,
      email: user.email,
      username: user.username || '',
      password: user.password || '123456',
      phone: user.phone || '',
      roleId: user.roleId,
      department: user.department,
      plant: user.plant,
      shift: user.shift || 'shift_1',
      assignedLines: user.assignedLines && user.assignedLines.length > 0 ? user.assignedLines : [PRESET_PRODUCTION_LINES[0]],
      status: user.status,
      avatar: user.avatar || PRESET_AVATARS[0],
      customPermissions: [...activePerms],
      useCustomPermissions: Boolean(user.customPermissions && user.customPermissions.length > 0)
    });
    setShowFormPassword(false);
    setPermissionSearch('');
  };

  // Role changed in form -> update default permissions
  const handleRoleChangeInForm = (roleId: string) => {
    const roleObj = roles.find(r => r.id === roleId);
    setUserForm(prev => ({
      ...prev,
      roleId,
      customPermissions: roleObj ? [...roleObj.permissions] : prev.customPermissions,
      useCustomPermissions: false
    }));
  };

  // Toggle single permission in form
  const handleToggleFormPermission = (permId: string) => {
    setUserForm(prev => {
      const exists = prev.customPermissions.includes(permId);
      const next = exists 
        ? prev.customPermissions.filter(p => p !== permId)
        : [...prev.customPermissions, permId];
      return { ...prev, customPermissions: next, useCustomPermissions: true };
    });
  };

  // Select all permissions in group
  const handleSelectGroupPermissions = (groupId: string, selectAll: boolean) => {
    const group = PERMISSION_GROUPS.find(g => g.id === groupId);
    if (!group) return;
    const groupPermIds = group.permissions.map(p => p.id);

    setUserForm(prev => {
      let next: string[];
      if (selectAll) {
        next = Array.from(new Set([...prev.customPermissions, ...groupPermIds]));
      } else {
        next = prev.customPermissions.filter(p => !groupPermIds.includes(p));
      }
      return { ...prev, customPermissions: next, useCustomPermissions: true };
    });
  };

  // Toggle production line assignment
  const handleToggleAssignedLine = (line: string) => {
    setUserForm(prev => {
      const exists = prev.assignedLines.includes(line);
      const next = exists
        ? prev.assignedLines.filter(l => l !== line)
        : [...prev.assignedLines, line];
      return { ...prev, assignedLines: next };
    });
  };

  // Generate random password
  const handleGeneratePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setUserForm(prev => ({ ...prev, password: pass }));
    setShowFormPassword(true);
    toast.success(isAr ? `تم توليد كلمة سر جديدة: ${pass}` : `Generated password: ${pass}`);
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(isAr ? 'يرجى اختيار ملف صورة صالح' : 'Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setUserForm(prev => ({ ...prev, avatar: base64 }));
      toast.success(isAr ? 'تم تحميل الصورة الشخصية' : 'Avatar uploaded');
    };
    reader.readAsDataURL(file);
  };

  // Save User (Create or Update)
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.email.trim()) {
      toast.error(isAr ? 'الاسم والبريد الإلكتروني مطلوبان' : 'Name and Email are required');
      return;
    }

    const matchedRole = roles.find(r => r.id === userForm.roleId);
    const roleName = matchedRole ? (isAr ? matchedRole.nameAr : matchedRole.name) : userForm.roleId;
    const customPerms = userForm.customPermissions;

    if (editingUser) {
      // Update
      const res = updateUser(editingUser.id, {
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        username: userForm.username.trim() || undefined,
        password: userForm.password.trim() || undefined,
        phone: userForm.phone.trim(),
        roleId: userForm.roleId,
        roleName: roleName,
        department: userForm.department,
        plant: userForm.plant,
        shift: userForm.shift,
        assignedLines: userForm.assignedLines,
        status: userForm.status,
        avatar: userForm.avatar,
        customPermissions: customPerms
      });
      if (res) {
        setUsers(loadStoredUsers());
        toast.success(isAr ? 'تم تحديث بيانات المستخدم وكلمة المرور والصلاحيات المخصصة' : 'User updated successfully');
      }
      setEditingUser(null);
    } else {
      // Create
      createUser({
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        username: userForm.username.trim() || undefined,
        password: userForm.password.trim() || '123456',
        phone: userForm.phone.trim(),
        roleId: userForm.roleId,
        roleName: roleName,
        department: userForm.department,
        plant: userForm.plant,
        shift: userForm.shift,
        assignedLines: userForm.assignedLines,
        status: userForm.status,
        avatar: userForm.avatar,
        customPermissions: customPerms
      });
      setUsers(loadStoredUsers());
      setIsCreateOpen(false);
      toast.success(isAr ? 'تمت إضافة المستخدم وتعيين الصلاحيات وكلمة المرور' : 'New user created successfully');
    }
  };

  // One-click clearance preset
  const handleApplyPreset = (preset: ClearancePreset) => {
    setUserForm(prev => ({
      ...prev,
      customPermissions: [...preset.permissions],
      useCustomPermissions: true
    }));
    toast.success(
      isAr 
        ? `تم تطبيق قالب الصلاحيات: ${preset.labelAr} (${preset.permissions.length} شاشة)` 
        : `Applied preset: ${preset.labelEn} (${preset.permissions.length} screens)`
    );
  };

  // Delete User
  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    if (userToDelete.roleId === 'admin' && users.filter(u => u.roleId === 'admin').length <= 1) {
      toast.error(isAr ? 'لا يمكن حذف الحساب الإداري الرئيسي الأخير للنظام' : 'Cannot delete the only root administrator account');
      setUserToDelete(null);
      return;
    }

    deleteUser(userToDelete.id);
    setUsers(loadStoredUsers());
    toast.success(isAr ? `تم حذف المستخدم "${userToDelete.name}" بنجاح` : `User "${userToDelete.name}" deleted`);
    setUserToDelete(null);
  };

  // Toggle Status
  const handleToggleStatus = (user: UserAccount) => {
    const nextStatus: UserAccount['status'] = user.status === 'active' ? 'inactive' : 'active';
    updateUser(user.id, { status: nextStatus });
    setUsers(loadStoredUsers());
    toast.success(isAr ? `تم تعديل حالة المستخدم إلى: ${statusConfig[nextStatus].labelAr}` : `Status changed to ${nextStatus}`);
  };

  // Copy Credentials
  const handleCopyCredentials = (user: UserAccount) => {
    const uname = user.username || user.email.split('@')[0];
    const pass = user.password || '123456';
    const text = `QMS Login Credentials:\nEmail: ${user.email}\nUsername: ${uname}\nPassword: ${pass}\nRole: ${user.roleName}`;
    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success(isAr ? `تم نسخ كافة بيانات الدخول للمستخدم ${user.name}` : `Credentials copied for ${user.name}`);
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success(isAr ? `تم نسخ البريد الإلكتروني: ${email}` : `Copied email: ${email}`);
  };

  const handleCopyPassword = (pass: string) => {
    navigator.clipboard.writeText(pass);
    toast.success(isAr ? `تم نسخ كلمة المرور: ${pass}` : `Copied password: ${pass}`);
  };

  const handleCopyUsername = (uname: string) => {
    navigator.clipboard.writeText(uname);
    toast.success(isAr ? `تم نسخ اسم المستخدم: ${uname}` : `Copied username: ${uname}`);
  };

  // Switch / Impersonate User
  const handleImpersonateUser = (targetUser: UserAccount) => {
    const perms = getUserPermissions(targetUser);
    setUser({
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      username: targetUser.username,
      role: targetUser.roleId,
      plant: targetUser.plant,
      department: targetUser.department,
      phone: targetUser.phone,
      avatar: targetUser.avatar,
      permissions: perms
    });

    useAuthStore.setState({
      user: {
        id: targetUser.id,
        email: targetUser.email,
        firstName: targetUser.name.split(' ')[0] || targetUser.name,
        lastName: targetUser.name.split(' ').slice(1).join(' ') || '',
        name: targetUser.name,
        role: targetUser.roleId,
        avatar: targetUser.avatar,
        permissions: perms,
        plant: { id: '1', name: targetUser.plant, code: 'PLANT-01' },
        department: { id: '1', name: targetUser.department },
        isActive: targetUser.status === 'active',
        twoFactorEnabled: false,
        lastLogin: new Date()
      },
      isAuthenticated: true
    });

    toast.success(
      isAr 
        ? `تم التبديل الآن والدخول بحساب: ${targetUser.name} (${targetUser.roleName})` 
        : `Switched account to: ${targetUser.name}`
    );

    const targetRoute = getFirstPermittedRoute(targetUser);
    navigate(targetRoute);
  };

  // Quick Password Change
  const handleSaveQuickPassword = () => {
    if (!quickPasswordUser) return;
    if (!newQuickPassword.trim()) {
      toast.error(isAr ? 'يرجى إدخال كلمة المرور الجديدة' : 'Please enter new password');
      return;
    }
    updateUser(quickPasswordUser.id, { password: newQuickPassword.trim() });
    setUsers(loadStoredUsers());
    toast.success(isAr ? `تم تغيير كلمة المرور للمستخدم ${quickPasswordUser.name}` : `Password changed successfully`);
    setQuickPasswordUser(null);
    setNewQuickPassword('');
  };

  // WhatsApp formatted share text
  const getWhatsAppShareText = (user: UserAccount) => {
    const origin = window.location.origin;
    const uname = user.username || user.email.split('@')[0];
    const pass = user.password || '123456';
    const shiftInfo = getShiftInfo(user.shift);
    const shiftLabel = isAr ? `${shiftInfo.labelAr} (${shiftInfo.timeAr})` : `${shiftInfo.labelEn} (${shiftInfo.timeEn})`;
    const linesList = user.assignedLines && user.assignedLines.length > 0 ? user.assignedLines.join(', ') : (isAr ? 'كافة الخطوط' : 'All Lines');

    if (isAr) {
      return `مرحباً ${user.name}،\nإليك بيانات حسابك في منصة إدارة الجودة الذكية QMS Enterprise 4.0:\n\n🌐 رابط المنصة:\n${origin}/login\n\n👤 اسم المستخدم / البريد:\n${uname} (أو ${user.email})\n\n🔑 كلمة المرور:\n${pass}\n\n🛡️ الدور الوظيفي:\n${user.roleName}\n\n🏭 خطوط الإنتاج المخصصة:\n${linesList}\n\n⏰ الوردية:\n${shiftLabel}\n\nيرجى تسجيل الدخول والتحقق من حسابك.`;
    } else {
      return `Hello ${user.name},\nHere are your access credentials for QMS Enterprise 4.0:\n\n🌐 Portal URL:\n${origin}/login\n\n👤 Username / Email:\n${uname} (or ${user.email})\n\n🔑 Password:\n${pass}\n\n🛡️ Role:\n${user.roleName}\n\n🏭 Assigned Lines:\n${linesList}\n\n⏰ Shift:\n${shiftLabel}\n\nPlease log in and verify your access.`;
    }
  };

  const handleSendWhatsApp = (user: UserAccount) => {
    const text = getWhatsAppShareText(user);
    const cleanPhone = (user.phone || '').replace(/[^0-9]/g, '');
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Username', 'Email', 'Password', 'Phone', 'Role', 'Department', 'Plant', 'Shift', 'Assigned_Lines', 'Status', 'Permissions_Count', 'Last_Login'];
    const rows = users.map(u => {
      const perms = getUserPermissions(u);
      const lines = (u.assignedLines || []).join(' | ');
      return [
        u.id,
        `"${u.name}"`,
        u.username || '',
        u.email,
        `"${u.password || '123456'}"`,
        u.phone || '',
        `"${u.roleName}"`,
        `"${u.department}"`,
        `"${u.plant}"`,
        `"${u.shift || 'shift_1'}"`,
        `"${lines}"`,
        u.status,
        perms.length,
        u.lastLogin
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qms_users_with_passwords_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(isAr ? 'تم تصدير قائمة المستخدمين وكلمات المرور بصيغة CSV' : 'User directory exported with passwords to CSV');
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#0066CC]/20 to-[#00A3E0]/20 border border-[#0066CC]/30 shadow-lg shadow-[#0066CC]/10 text-[#00A3E0]">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              {isAr ? 'إدارة المستخدمين وكلمات المرور ومصفوفة الصلاحيات' : 'User Directory, Passwords & Permission Matrix'}
              <span className="px-2.5 py-0.5 rounded-full bg-[#00A3E0]/10 border border-[#00A3E0]/30 text-[#00A3E0] text-xs font-mono font-bold">
                QMS 4.0
              </span>
            </h1>
            <p className="text-sm text-gray-400 font-medium">
              {isAr 
                ? 'إدارة حسابات فريق الجودة، تعيين خطوط الإنتاج والورديات، التحكم في كلمات المرور، ومشاركة بيانات الدخول' 
                : 'Centralized admin control for user credentials, passwords, assigned production lines, shifts and permissions'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* View Mode Toggle Button */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1 backdrop-blur-md">
            <button
              onClick={() => handleSetViewMode('cards')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'cards' 
                  ? 'bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>{isAr ? 'بطاقات المستخدمين' : 'Cards Grid'}</span>
            </button>
            <button
              onClick={() => handleSetViewMode('table')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'table' 
                  ? 'bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span>{isAr ? 'جدول تفصيلي' : 'Table View'}</span>
            </button>
          </div>

          {/* Show All Passwords Toggle */}
          <Button 
            variant="outline"
            onClick={() => setShowAllPasswords(!showAllPasswords)}
            className={`border rounded-2xl h-11 px-4 font-bold transition-all ${
              showAllPasswords
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-500/20'
                : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            title={isAr ? 'إظهار كافة كلمات المرور في البطاقات والجدول' : 'Reveal all passwords in cards and table'}
          >
            {showAllPasswords ? <EyeOff className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 text-amber-400" /> : <Eye className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 text-amber-400" />}
            {isAr ? (showAllPasswords ? 'إخفاء كلمات المرور' : 'إظهار كل كلمات المرور') : (showAllPasswords ? 'Hide Passwords' : 'Show All Passwords')}
          </Button>

          {/* Toggle Quick Credentials Directory */}
          <Button
            variant="outline"
            onClick={() => setShowQuickDirectory(!showQuickDirectory)}
            className={`border rounded-2xl h-11 px-4 font-bold transition-all ${
              showQuickDirectory
                ? 'bg-[#00A3E0]/20 text-[#00A3E0] border-[#00A3E0]/50 shadow-lg shadow-[#00A3E0]/20'
                : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Key className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 text-[#00A3E0]" />
            {isAr ? 'دليل الدخول المباشر' : 'Credentials Sheet'}
          </Button>

          <Button 
            variant="outline" 
            onClick={handleExportCSV}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 backdrop-blur-md rounded-2xl h-11"
          >
            <Download className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {isAr ? 'تصدير القائمة' : 'Export CSV'}
          </Button>

          <Button 
            onClick={handleOpenCreate}
            className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white hover:opacity-90 shadow-lg shadow-[#0066CC]/20 rounded-2xl h-11 px-6 font-bold"
          >
            <Plus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {isAr ? 'إضافة مستخدم جديد' : 'Add New User'}
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="rounded-3xl p-5 bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-lg">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
              {isAr ? stat.labelAr : stat.labelEn}
            </p>
            <p className={`text-2xl font-black ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* QUICK CREDENTIALS DIRECTORY ACCORDION */}
      {showQuickDirectory && (
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-slate-900/95 backdrop-blur-xl p-5 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  {isAr ? 'دليل بيانات الدخول المعتمدة لجميع المستخدمين (البريد الإلكتروني وكلمة المرور)' : 'Live User Login Directory (Emails & Passwords)'}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {isAr ? 'جاهز للدخول الفوري' : 'Ready to Login'}
                  </span>
                </h2>
                <p className="text-xs text-gray-400">
                  {isAr 
                    ? 'البيانات المعتمدة لكل مستخدم للدخول إلى المنصة عبر شاشة الدخول (/login) أو التجربة الفورية'
                    : 'Authorized credentials for each user to sign in via (/login) or test directly'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAllPasswords(!showAllPasswords)}
                className="bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs rounded-xl h-9 font-bold"
              >
                {showAllPasswords ? <EyeOff className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" /> : <Eye className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" />}
                {isAr ? (showAllPasswords ? 'إخفاء كلمات المرور' : 'إظهار كافة كلمات المرور') : (showAllPasswords ? 'Hide' : 'Reveal All')}
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-white/10 text-right rtl:text-right ltr:text-left">
                  <th className="py-2.5 px-3 font-bold">{isAr ? 'المستخدم والدور' : 'User & Role'}</th>
                  <th className="py-2.5 px-3 font-bold">{isAr ? 'البريد الإلكتروني للدخول (Email)' : 'Email'}</th>
                  <th className="py-2.5 px-3 font-bold">{isAr ? 'كلمة المرور (Password)' : 'Password'}</th>
                  <th className="py-2.5 px-3 font-bold">{isAr ? 'اسم المستخدم (Username)' : 'Username'}</th>
                  <th className="py-2.5 px-3 font-bold text-center">{isAr ? 'إجراءات سريعة' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {users.map(u => {
                  const isVisible = showAllPasswords || visiblePasswords[u.id];
                  const pass = u.password || '123456';
                  const uname = u.username || u.email.split('@')[0];
                  return (
                    <tr key={u.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-2.5 px-3 font-sans">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                            {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : <span className="font-bold text-xs text-white p-1">{u.name.charAt(0)}</span>}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">{u.name}</div>
                            <span className="text-[10px] text-[#00A3E0] font-sans font-bold">{u.roleName}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-500/10 border border-sky-500/25">
                          <Mail className="w-3.5 h-3.5 text-sky-400" />
                          <span className="text-sky-300 font-bold">{u.email}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyEmail(u.email)}
                            className="p-1 text-gray-400 hover:text-white rounded"
                            title={isAr ? 'نسخ البريد الإلكتروني' : 'Copy email'}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30">
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-amber-300 font-bold tracking-wider">
                            {isVisible ? pass : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setVisiblePasswords(prev => ({ ...prev, [u.id]: !isVisible }))}
                            className="p-1 text-gray-400 hover:text-white"
                            title={isVisible ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyPassword(pass)}
                            className="p-1 text-amber-400 hover:text-white"
                            title={isAr ? 'نسخ كلمة المرور' : 'Copy password'}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-gray-300">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5">
                          <span>@{uname}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyUsername(uname)}
                            className="p-0.5 text-gray-400 hover:text-white rounded"
                            title={isAr ? 'نسخ اسم المستخدم' : 'Copy username'}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center font-sans">
                        <div className="inline-flex items-center gap-1.5 justify-center">
                          <Button
                            size="sm"
                            onClick={() => handleImpersonateUser(u)}
                            className="h-7 px-2.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-[11px] font-bold"
                          >
                            <LogIn className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
                            {isAr ? 'دخول بحسابه' : 'Login As'}
                          </Button>

                          <button
                            type="button"
                            onClick={() => handleCopyCredentials(u)}
                            className="p-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-500/20 border border-emerald-500/20"
                            title={isAr ? 'نسخ كافة بيانات الدخول' : 'Copy all credentials'}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setShareCredentialsUser(u)}
                            className="p-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-500/20 border border-emerald-500/20"
                            title={isAr ? 'مشاركة عبر واتساب' : 'Share via WhatsApp'}
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 sm:p-5 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={isAr ? 'بحث بالاسم، اسم المستخدم، البريد، الخط، أو الدور...' : 'Search by name, username, email, line, role...'}
            className="w-full h-11 pl-10 pr-4 rtl:pr-10 rtl:pl-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-[#00A3E0] transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-11 px-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-[#00A3E0]"
          >
            <option value="all" className="bg-slate-900">{isAr ? 'كافة الحالات' : 'All Statuses'}</option>
            <option value="active" className="bg-slate-900">{isAr ? 'مفعل فقط' : 'Active Only'}</option>
            <option value="inactive" className="bg-slate-900">{isAr ? 'معطل' : 'Inactive'}</option>
            <option value="suspended" className="bg-slate-900">{isAr ? 'موقوف' : 'Suspended'}</option>
          </select>

          {/* Role Filter */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="h-11 px-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-[#00A3E0]"
          >
            <option value="all" className="bg-slate-900">{isAr ? 'كافة الأدوار' : 'All Roles'}</option>
            {roles.map(r => (
              <option key={r.id} value={r.id} className="bg-slate-900">
                {isAr ? r.nameAr : r.name}
              </option>
            ))}
          </select>

          {/* Shift Filter */}
          <select
            value={selectedShiftFilter}
            onChange={(e) => setSelectedShiftFilter(e.target.value)}
            className="h-11 px-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-[#00A3E0]"
          >
            <option value="all" className="bg-slate-900">{isAr ? 'كافة الورديات' : 'All Shifts'}</option>
            {PRESET_SHIFTS.map(s => (
              <option key={s.id} value={s.id} className="bg-slate-900">
                {isAr ? s.labelAr : s.labelEn}
              </option>
            ))}
          </select>

          <Button 
            variant="ghost" 
            onClick={() => {
              setUsers(loadStoredUsers());
              toast.success(isAr ? 'تم تحديث القائمة' : 'List refreshed');
            }}
            className="text-gray-400 hover:text-white h-11 px-3 rounded-2xl"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* VIEW MODE 1: MODERN INDUSTRIAL CARDS GRID */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredUsers.length === 0 ? (
            <div className="col-span-full py-16 text-center text-gray-500 rounded-3xl border border-white/10 bg-slate-900/60">
              <UserIcon className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#00A3E0]" />
              <p className="text-base font-bold text-gray-300">
                {isAr ? 'لا يوجد مستخدمين مطابقين للبحث' : 'No users match your search criteria'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {isAr ? 'جرّب تعديل الفلاتر أو إضافة مستخدم جديد' : 'Try adjusting filters or adding a new user'}
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const statusInfo = statusConfig[user.status] || statusConfig.active;
              const StatusIcon = statusInfo.icon;
              const userPerms = getUserPermissions(user);
              const isPassVisible = showAllPasswords || visiblePasswords[user.id] || false;
              const roleObj = roles.find(r => r.id === user.roleId);
              const shiftInfo = getShiftInfo(user.shift);

              return (
                <div 
                  key={user.id} 
                  className="rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-5 shadow-2xl flex flex-col justify-between hover:border-[#00A3E0]/40 transition-all duration-300 group"
                >
                  <div className="space-y-4">
                    {/* Card Top: Avatar, Name, Role */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        {/* Avatar with status glow ring */}
                        <div className="relative">
                          <div 
                            className="w-14 h-14 rounded-2xl overflow-hidden p-0.5 shadow-lg shrink-0"
                            style={{ 
                              background: `linear-gradient(135deg, ${roleObj?.color || '#00A3E0'}, #0066CC)` 
                            }}
                          >
                            <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center overflow-hidden">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-black text-lg text-white">
                                  {user.name.charAt(0)}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Live Status Indicator dot */}
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                            user.status === 'active' ? 'bg-emerald-500' : user.status === 'suspended' ? 'bg-rose-500' : 'bg-slate-500'
                          }`} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-white text-base truncate group-hover:text-[#00A3E0] transition-colors">
                              {user.name}
                            </h3>
                          </div>
                          <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                          <span className="inline-block mt-1 text-[10px] font-bold text-slate-300 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                            {user.department}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge clickable */}
                      <button
                        onClick={() => handleToggleStatus(user)}
                        title={isAr ? 'انقر لتغيير الحالة' : 'Click to toggle status'}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-transform hover:scale-105 shrink-0 ${statusInfo.color}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        <span>{isAr ? statusInfo.labelAr : statusInfo.labelEn}</span>
                      </button>
                    </div>

                    {/* Role Chip */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border shadow-sm"
                          style={{ 
                            backgroundColor: `${roleObj?.color || '#00A3E0'}15`, 
                            borderColor: `${roleObj?.color || '#00A3E0'}40`,
                            color: roleObj?.color || '#00A3E0'
                          }}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {user.roleName}
                        </span>

                        {user.customPermissions && user.customPermissions.length > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {isAr ? 'صلاحيات مخصصة' : 'Custom'}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-mono text-gray-500">
                        {user.lastLogin}
                      </span>
                    </div>

                    {/* High-Visibility Credentials & Password Box */}
                    <div className="p-3.5 rounded-2xl bg-black/60 border border-[#00A3E0]/30 space-y-2.5 shadow-inner">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                        <span className="text-[11px] font-black text-[#00A3E0] uppercase tracking-wider flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-amber-400" />
                          {isAr ? 'بيانات تسجيل الدخول المعتمدة:' : 'Login Credentials:'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCredentials(user)}
                          className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                          title={isAr ? 'نسخ كافة بيانات الدخول (الميل والباسورد)' : 'Copy all credentials'}
                        >
                          <Copy className="w-3 h-3" />
                          {copiedId === user.id ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الكل' : 'Copy All')}
                        </button>
                      </div>

                      {/* 1. EMAIL */}
                      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/90 border border-sky-500/25">
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[9px] text-gray-400 block font-bold">{isAr ? 'البريد الإلكتروني للدخول:' : 'Email Address:'}</span>
                            <span className="font-mono text-xs font-bold text-white truncate block">
                              {user.email}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyEmail(user.email)}
                          className="p-1.5 text-gray-400 hover:text-sky-300 rounded hover:bg-white/5 shrink-0"
                          title={isAr ? 'نسخ البريد الإلكتروني' : 'Copy email'}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* 2. PASSWORD */}
                      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/90 border border-amber-500/35">
                        <div className="flex items-center gap-2 min-w-0">
                          <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[9px] text-gray-400 block font-bold">{isAr ? 'كلمة المرور:' : 'Password:'}</span>
                            <span className="font-mono text-xs font-bold text-amber-300 tracking-wider truncate block">
                              {isPassVisible ? (user.password || '123456') : '••••••••'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setVisiblePasswords(prev => ({ ...prev, [user.id]: !isPassVisible }))}
                            className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/5 transition-colors"
                            title={isPassVisible ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}
                          >
                            {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyPassword(user.password || '123456')}
                            className="p-1.5 text-amber-400 hover:text-white rounded hover:bg-white/5 transition-colors"
                            title={isAr ? 'نسخ كلمة المرور' : 'Copy Password'}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setQuickPasswordUser(user);
                              setNewQuickPassword(user.password || '123456');
                            }}
                            className="p-1.5 text-gray-400 hover:text-[#00A3E0] rounded hover:bg-white/5 transition-colors"
                            title={isAr ? 'تغيير كلمة المرور' : 'Reset Password'}
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 3. USERNAME */}
                      <div className="flex items-center justify-between text-xs pt-0.5 px-1">
                        <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                          <UserIcon className="w-3 h-3 text-slate-400" />
                          {isAr ? 'اسم المستخدم البديل:' : 'Alternative Username:'}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs text-[#00A3E0] font-bold">
                            @{user.username || user.email.split('@')[0]}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyUsername(user.username || user.email.split('@')[0])}
                            className="p-0.5 text-gray-400 hover:text-white"
                            title={isAr ? 'نسخ اسم المستخدم' : 'Copy username'}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Operational Context: Shift & Assigned Production Lines */}
                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 font-bold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-sky-400" />
                          {isAr ? 'الوردية:' : 'Shift:'}
                        </span>
                        <span className="text-gray-200 font-bold">
                          {isAr ? shiftInfo.labelAr : shiftInfo.labelEn}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Factory className="w-3 h-3 text-amber-400" />
                          {isAr ? 'خطوط الإنتاج المخصصة:' : 'Assigned Lines:'}
                        </span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {user.assignedLines && user.assignedLines.length > 0 ? (
                            user.assignedLines.map((line, lIdx) => (
                              <span 
                                key={lIdx} 
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10"
                              >
                                {line.split('(')[0].trim()}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-gray-500 font-bold">
                              {isAr ? 'كافة خطوط المصنع' : 'All Lines'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Permissions Preview Bar */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300">
                        <Shield className="w-3.5 h-3.5 text-[#00A3E0]" />
                        <span>
                          {userPerms.includes('*') || userPerms.includes('admin.access') 
                            ? (isAr ? '⭐ تحكم شامل بالنظام' : '⭐ Full System Access')
                            : (isAr ? `✓ ${userPerms.length} صلاحيات نشطة` : `✓ ${userPerms.length} active perms`)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setViewingPermissionsUser(user)}
                        className="text-xs font-bold text-[#00A3E0] hover:underline flex items-center gap-1"
                      >
                        <Sliders className="w-3 h-3" />
                        {isAr ? 'عرض الصلاحيات' : 'View Perms'}
                      </button>
                    </div>
                  </div>

                  {/* Card Bottom Actions Toolbar */}
                  <div className="pt-4 mt-4 border-t border-white/10 grid grid-cols-4 gap-2">
                    {/* 1. Impersonate Button */}
                    <Button
                      size="sm"
                      onClick={() => handleImpersonateUser(user)}
                      className="col-span-2 bg-gradient-to-r from-sky-500/20 to-[#00A3E0]/20 hover:from-sky-500/30 hover:to-[#00A3E0]/30 text-sky-300 border border-sky-500/30 rounded-xl h-10 font-bold text-xs"
                      title={isAr ? `دخول فوري بحساب "${user.name}" لمعاينة شاشته` : `Preview access as ${user.name}`}
                    >
                      <LogIn className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                      {isAr ? 'دخول بحسابه' : 'Login As'}
                    </Button>

                    {/* 2. WhatsApp Share Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShareCredentialsUser(user)}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30 rounded-xl h-10 px-0 flex items-center justify-center"
                      title={isAr ? 'مشاركة بيانات الدخول عبر واتساب' : 'Share credentials via WhatsApp'}
                    >
                      <Share2 className="w-4 h-4 text-emerald-400" />
                    </Button>

                    {/* 3. Edit & Delete Group */}
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(user)}
                        className="text-gray-400 hover:text-white hover:bg-white/10 rounded-xl h-10 w-full p-0 flex items-center justify-center"
                        title={isAr ? 'تعديل المستخدم والصلاحيات' : 'Edit User'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setUserToDelete(user)}
                        className="text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl h-10 w-full p-0 flex items-center justify-center"
                        title={isAr ? 'حذف المستخدم' : 'Delete User'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW MODE 2: ENTERPRISE DATA TABLE */}
      {viewMode === 'table' && (
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] border-b border-white/10 text-gray-400 text-xs uppercase font-black">
                <tr>
                  <th className="text-left rtl:text-right px-6 py-4">{isAr ? 'المستخدم والصورة' : 'User & Avatar'}</th>
                  <th className="text-left rtl:text-right px-6 py-4">{isAr ? 'اسم الدخول وكلمة المرور' : 'Credentials & Password'}</th>
                  <th className="text-left rtl:text-right px-6 py-4">{isAr ? 'الدور والصلاحيات' : 'Role & Permissions'}</th>
                  <th className="text-left rtl:text-right px-6 py-4">{isAr ? 'الوردية والخطوط' : 'Shift & Lines'}</th>
                  <th className="text-left rtl:text-right px-6 py-4">{isAr ? 'المصنع والحالة' : 'Plant & Status'}</th>
                  <th className="text-right rtl:text-left px-6 py-4">{isAr ? 'إجراءات التحكم' : 'Control Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">
                      <UserIcon className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#00A3E0]" />
                      {isAr ? 'لا يوجد مستخدمين مطابقين للبحث' : 'No users match your search criteria'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const statusInfo = statusConfig[user.status] || statusConfig.active;
                    const StatusIcon = statusInfo.icon;
                    const userPerms = getUserPermissions(user);
                    const isPassVisible = showAllPasswords || visiblePasswords[user.id] || false;
                    const roleObj = roles.find(r => r.id === user.roleId);
                    const shiftInfo = getShiftInfo(user.shift);

                    return (
                      <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                        {/* Avatar & Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-br from-[#0066CC] to-[#00A3E0] p-0.5 shadow-md shrink-0">
                              <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center overflow-hidden">
                                {user.avatar ? (
                                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="font-black text-sm text-white">
                                    {user.name.charAt(0)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white text-sm truncate">{user.name}</p>
                              <p className="text-xs text-gray-400 truncate">{user.email}</p>
                              <span className="inline-block mt-0.5 text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                {user.department}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Credentials & Password */}
                        <td className="px-6 py-4">
                          <div className="space-y-1.5 min-w-[230px]">
                            {/* Email Row */}
                            <div className="flex items-center justify-between gap-1 p-1 px-2 rounded-lg bg-slate-950/80 border border-sky-500/25">
                              <span className="text-[10px] text-gray-400 font-bold shrink-0">{isAr ? 'الميل:' : 'Email:'}</span>
                              <span className="text-xs text-sky-300 font-mono font-bold truncate flex-1">
                                {user.email}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyEmail(user.email)}
                                className="p-0.5 text-gray-400 hover:text-white"
                                title={isAr ? 'نسخ البريد الإلكتروني' : 'Copy email'}
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Password Row */}
                            <div className="flex items-center justify-between gap-1 p-1 px-2 rounded-lg bg-slate-950/80 border border-amber-500/30">
                              <span className="text-[10px] text-gray-400 font-bold shrink-0">{isAr ? 'الباسورد:' : 'Pass:'}</span>
                              <span className="font-mono text-xs font-bold text-amber-300 tracking-wider truncate flex-1">
                                {isPassVisible ? (user.password || '123456') : '••••••••'}
                              </span>
                              
                              <button
                                type="button"
                                onClick={() => setVisiblePasswords(prev => ({ ...prev, [user.id]: !isPassVisible }))}
                                className="p-0.5 text-gray-400 hover:text-white"
                                title={isPassVisible ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}
                              >
                                {isPassVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCopyPassword(user.password || '123456')}
                                className="p-0.5 text-amber-400 hover:text-white"
                                title={isAr ? 'نسخ كلمة المرور' : 'Copy Password'}
                              >
                                <Copy className="w-3 h-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setQuickPasswordUser(user);
                                  setNewQuickPassword(user.password || '123456');
                                }}
                                className="p-0.5 text-gray-400 hover:text-[#00A3E0]"
                                title={isAr ? 'تعديل سريع لكلمة المرور' : 'Reset Password'}
                              >
                                <Lock className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Username & Copy All */}
                            <div className="flex items-center justify-between text-[11px] text-gray-400 px-1 font-mono">
                              <span>@{user.username || user.email.split('@')[0]}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyCredentials(user)}
                                className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 font-bold font-sans"
                              >
                                <Copy className="w-2.5 h-2.5" />
                                {copiedId === user.id ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الكل' : 'Copy All')}
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Role & Permissions */}
                        <td className="px-6 py-4">
                          <div className="space-y-1.5 min-w-[190px]">
                            <div className="flex items-center gap-1.5">
                              <span 
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border"
                                style={{ 
                                  backgroundColor: `${roleObj?.color || '#00A3E0'}15`, 
                                  borderColor: `${roleObj?.color || '#00A3E0'}40`,
                                  color: roleObj?.color || '#00A3E0'
                                }}
                              >
                                <ShieldCheck className="w-3 h-3" />
                                {user.roleName}
                              </span>
                              
                              {user.customPermissions && user.customPermissions.length > 0 && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  {isAr ? 'مخصص' : 'Custom'}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono text-gray-400">
                                {userPerms.includes('*') || userPerms.includes('admin.access') 
                                  ? (isAr ? '⭐ تحكم كامل' : '⭐ Full Access')
                                  : (isAr ? `✓ ${userPerms.length} صلاحيات` : `✓ ${userPerms.length} perms`)}
                              </span>

                              <button
                                type="button"
                                onClick={() => setViewingPermissionsUser(user)}
                                className="text-[11px] font-bold text-[#00A3E0] hover:underline"
                              >
                                {isAr ? 'عرض' : 'View'}
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Shift & Production Lines */}
                        <td className="px-6 py-4">
                          <div className="space-y-1 min-w-[180px]">
                            <span className="text-xs font-bold text-sky-300 block">
                              {isAr ? shiftInfo.labelAr : shiftInfo.labelEn}
                            </span>
                            <p className="text-[11px] text-gray-400 truncate max-w-[200px]">
                              {user.assignedLines && user.assignedLines.length > 0 
                                ? user.assignedLines.map(l => l.split('(')[0].trim()).join(', ')
                                : (isAr ? 'كافة الخطوط' : 'All Lines')}
                            </p>
                          </div>
                        </td>

                        {/* Plant & Status */}
                        <td className="px-6 py-4">
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium text-gray-300 truncate max-w-[140px]">
                              {user.plant}
                            </p>
                            <button
                              onClick={() => handleToggleStatus(user)}
                              title={isAr ? 'انقر لتغيير الحالة' : 'Click to toggle status'}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-transform hover:scale-105 ${statusInfo.color}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              <span>{isAr ? statusInfo.labelAr : statusInfo.labelEn}</span>
                            </button>
                          </div>
                        </td>

                        {/* Control Actions */}
                        <td className="px-6 py-4 text-right rtl:text-left">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Impersonate Button */}
                            <button
                              onClick={() => handleImpersonateUser(user)}
                              className="p-2 rounded-xl text-sky-400 hover:text-white hover:bg-sky-500/20 border border-sky-500/20 transition-all"
                              title={isAr ? `دخول فوري بحساب "${user.name}"` : `Login as ${user.name}`}
                            >
                              <LogIn className="w-4 h-4" />
                            </button>

                            {/* WhatsApp Share Button */}
                            <button
                              onClick={() => setShareCredentialsUser(user)}
                              className="p-2 rounded-xl text-emerald-400 hover:text-white hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
                              title={isAr ? 'مشاركة بيانات الدخول عبر واتساب' : 'Share via WhatsApp'}
                            >
                              <Share2 className="w-4 h-4" />
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                              title={isAr ? 'تعديل المستخدم والصلاحيات' : 'Edit User'}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => setUserToDelete(user)}
                              className="p-2 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title={isAr ? 'حذف المستخدم' : 'Delete User'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT USER WITH FULL PRODUCTION CONTEXT & PERMISSIONS */}
      {(isCreateOpen || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#00A3E0]/10 text-[#00A3E0] border border-[#00A3E0]/20">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    {editingUser 
                      ? (isAr ? 'تعديل بيانات المستخدم وخطوط الإنتاج والصلاحيات' : 'Edit User, Production Lines & Permissions') 
                      : (isAr ? 'إضافة مستخدم جديد للنظام' : 'Create New User Account')}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {isAr 
                      ? 'إعداد بيانات الحساب، كلمة المرور، تحديد وردية العمل، خطوط الإنتاج، ومصفوفة الصلاحيات' 
                      : 'Set account credentials, password, shift, assigned production lines, and custom permission matrix'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setIsCreateOpen(false); setEditingUser(null); }}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-6">
              {/* SECTION 1: AVATAR & BASIC CREDENTIALS */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">
                  {isAr ? 'الصورة الشخصية' : 'Profile Avatar'}
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 border-2 border-[#00A3E0] p-0.5 shrink-0 shadow-lg">
                    <img src={userForm.avatar} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleAvatarFile} 
                        className="hidden" 
                        accept="image/*" 
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10 text-xs h-9 rounded-xl"
                      >
                        <Camera className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                        {isAr ? 'رفع صورة خاصة' : 'Upload Image'}
                      </Button>
                      <span className="text-xs text-gray-400">{isAr ? 'أو اختر صورة جاهزة:' : 'Or choose preset:'}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {PRESET_AVATARS.map((preset, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setUserForm({ ...userForm, avatar: preset })}
                          className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-transform hover:scale-110 ${
                            userForm.avatar === preset ? 'border-[#00A3E0] scale-105 shadow-md' : 'border-transparent opacity-70'
                          }`}
                        >
                          <img src={preset} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'الاسم الكامل' : 'Full Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="Eng. Mohamed Hassan"
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                {/* HIGHLIGHTED LOGIN CREDENTIALS CONTAINER */}
                <div className="col-span-full p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-500/20">
                    <span className="text-xs font-black text-amber-300 flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-400" />
                      {isAr ? 'بيانات تسجيل الدخول الأساسية (البريد الإلكتروني وكلمة المرور)' : 'User Login Credentials (Email & Password)'}
                    </span>
                    <span className="text-[11px] text-amber-200/90 font-bold bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                      {isAr ? '⚠️ يُستخدم هذا البريد وكلمة المرور للدخول إلى النظام' : 'Required for platform authentication'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-200 mb-1.5 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-sky-400" />
                        {isAr ? 'البريد الإلكتروني للدخول (Login Email)' : 'Login Email'} *
                      </label>
                      <input
                        type="email"
                        required
                        value={userForm.email}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        placeholder="user@qms-industrial.com"
                        className="w-full h-11 px-4 bg-black/60 border border-sky-500/40 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-[#00A3E0]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          {isAr ? 'كلمة المرور (Login Password)' : 'Login Password'} *
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleGeneratePassword}
                            className="text-[11px] text-[#00A3E0] hover:underline flex items-center gap-1 font-bold"
                          >
                            <Sparkles className="w-3 h-3" />
                            {isAr ? 'توليد تلقائي' : 'Generate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowFormPassword(!showFormPassword)}
                            className="text-[11px] text-gray-400 hover:text-white"
                          >
                            {showFormPassword ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}
                          </button>
                        </div>
                      </div>
                      <input
                        type={showFormPassword ? 'text' : 'password'}
                        required
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        placeholder="Enter password (e.g. 123456)"
                        className="w-full h-11 px-4 bg-black/60 border border-amber-500/40 rounded-xl text-amber-300 font-mono text-sm focus:outline-none focus:border-amber-400 font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        {isAr ? 'اسم المستخدم البديل (اختياري، للدخول السريع)' : 'Alternative Username (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={userForm.username}
                        onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                        placeholder="e.g. mohamed or inspector"
                        className="w-full h-11 px-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'الدور الوظيفي الأساسي' : 'Security Role'} *
                  </label>
                  <select
                    value={userForm.roleId}
                    onChange={(e) => handleRoleChangeInForm(e.target.value)}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id} className="bg-slate-900">
                        {isAr ? r.nameAr : r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'القسم / الإدارة' : 'Department'}
                  </label>
                  <input
                    type="text"
                    value={userForm.department}
                    onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'رقم الهاتف (لإرسال رسائل واتساب)' : 'Phone Number (for WhatsApp)'}
                  </label>
                  <input
                    type="text"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    placeholder="+20 100 000 0000"
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'المصنع المحدد' : 'Assigned Plant'}
                  </label>
                  <input
                    type="text"
                    value={userForm.plant}
                    onChange={(e) => setUserForm({ ...userForm, plant: e.target.value })}
                    placeholder="Main Plant - Assembly 01"
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                {/* Shift Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    {isAr ? 'وردية العمل المحددة' : 'Assigned Shift'}
                  </label>
                  <select
                    value={userForm.shift}
                    onChange={(e) => setUserForm({ ...userForm, shift: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  >
                    {PRESET_SHIFTS.map(s => (
                      <option key={s.id} value={s.id} className="bg-slate-900">
                        {isAr ? `${s.labelAr} (${s.timeAr})` : `${s.labelEn} (${s.timeEn})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Radio */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2">
                    {isAr ? 'حالة الحساب' : 'Account Status'}
                  </label>
                  <div className="flex items-center gap-4 h-11">
                    {(['active', 'inactive', 'suspended'] as const).map(st => (
                      <label key={st} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="userStatus"
                          value={st}
                          checked={userForm.status === st}
                          onChange={() => setUserForm({ ...userForm, status: st })}
                          className="accent-[#00A3E0]"
                        />
                        <span className="text-xs font-bold capitalize text-white">
                          {isAr ? statusConfig[st].labelAr : statusConfig[st].labelEn}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 2: PRODUCTION LINES ASSIGNMENT */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Factory className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-black text-white">
                      {isAr ? 'تخصيص خطوط الإنتاج المسموح له بمتابعتها' : 'Assigned Production Lines'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUserForm(prev => ({ ...prev, assignedLines: [...PRESET_PRODUCTION_LINES] }))}
                      className="text-xs text-[#00A3E0] hover:underline font-bold"
                    >
                      {isAr ? 'تحديد كافة الخطوط' : 'Select All'}
                    </button>
                    <span className="text-gray-600">|</span>
                    <button
                      type="button"
                      onClick={() => setUserForm(prev => ({ ...prev, assignedLines: [] }))}
                      className="text-xs text-rose-400 hover:underline font-bold"
                    >
                      {isAr ? 'إلغاء التحديد' : 'Clear'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {PRESET_PRODUCTION_LINES.map((line) => {
                    const isChecked = userForm.assignedLines.includes(line);
                    return (
                      <label 
                        key={line}
                        className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer text-xs border transition-colors ${
                          isChecked 
                            ? 'bg-[#00A3E0]/15 border-[#00A3E0]/40 text-white font-bold' 
                            : 'bg-white/5 border-white/5 text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleAssignedLine(line)}
                          className="accent-[#00A3E0]"
                        />
                        <span className="truncate">{line}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: GRANULAR SCREEN CLEARANCE & PERMISSIONS */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-[#00A3E0]/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#00A3E0]/15 text-[#00A3E0] border border-[#00A3E0]/30">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        {isAr ? 'تحديد الشاشات والأقسام المسموح بها للمستخدم' : 'User Screen Clearance & Permissions'}
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#00A3E0]/20 text-[#00A3E0] border border-[#00A3E0]/30">
                          {userForm.customPermissions.includes('*') 
                            ? ALL_PERMISSION_KEYS.length 
                            : userForm.customPermissions.length} / {ALL_PERMISSION_KEYS.length} {isAr ? 'شاشة مفعلة' : 'screens'}
                        </span>
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        {isAr 
                          ? 'الشاشات المحددة هنا فقط هي التي ستظهر للمستخدم في القائمة الجانبية والشاشات الرئيسية' 
                          : 'Only screens selected below will appear in the sidebar and navigation for this user'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUserForm(prev => ({
                          ...prev,
                          customPermissions: ALL_PERMISSION_KEYS,
                          useCustomPermissions: true
                        }));
                        toast.success(isAr ? 'تم تحديد كافة شاشات النظام' : 'Selected all system screens');
                      }}
                      className="text-xs text-[#00A3E0] hover:underline font-bold px-2 py-1 rounded bg-[#00A3E0]/10 border border-[#00A3E0]/20"
                    >
                      {isAr ? 'تحديد كافة الشاشات' : 'Select All'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserForm(prev => ({
                          ...prev,
                          customPermissions: [],
                          useCustomPermissions: true
                        }));
                        toast.info(isAr ? 'تم تفريغ كافة الصلاحيات' : 'Cleared all screens');
                      }}
                      className="text-xs text-rose-400 hover:underline font-bold px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20"
                    >
                      {isAr ? 'تفريغ الكل' : 'Clear All'}
                    </button>
                  </div>
                </div>

                {/* Notice Banner */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-xs flex items-center gap-2.5 font-medium">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    {isAr 
                      ? '⚠️ نظام الأمان المشدد: لن يظهر لهذا المستخدم إلا الشاشات والأقسام التي تحددها له في هذه القائمة فقط.' 
                      : '⚠️ Strict Access Control: Unselected screens will be completely hidden from the sidebar and navigation for this user.'}
                  </span>
                </div>

                {/* ONE-CLICK CLEARANCE PRESETS */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAr ? 'قوالب صلاحيات جاهزة بنقرة واحدة (Quick Clearance Presets):' : 'One-Click Clearance Presets:'}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {CLEARANCE_PRESETS.map((preset) => {
                      const isMatched = 
                        preset.id === 'preset_admin'
                          ? userForm.customPermissions.includes('*') || userForm.customPermissions.length === ALL_PERMISSION_KEYS.length
                          : preset.permissions.length > 0 && preset.permissions.every(p => userForm.customPermissions.includes(p)) && userForm.customPermissions.length === preset.permissions.length;

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleApplyPreset(preset)}
                          className={`p-2.5 rounded-xl text-left rtl:text-right border transition-all text-xs flex flex-col justify-between ${
                            isMatched
                              ? 'bg-[#00A3E0]/20 border-[#00A3E0] shadow-md shadow-[#00A3E0]/15'
                              : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.08]'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="font-bold text-white text-xs truncate">
                              {isAr ? preset.labelAr : preset.labelEn}
                            </span>
                            <span 
                              className="w-2.5 h-2.5 rounded-full shrink-0" 
                              style={{ backgroundColor: preset.color }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400 line-clamp-2">
                            {isAr ? preset.descriptionAr : preset.descriptionEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Search within permissions */}
                <div className="relative">
                  <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={permissionSearch}
                    onChange={(e) => setPermissionSearch(e.target.value)}
                    placeholder={isAr ? 'تصفية الشاشات بالاسم أو المرحلة...' : 'Filter screens by name or stage...'}
                    className="w-full h-9 pl-9 pr-4 rtl:pr-9 rtl:pl-4 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                {/* Categorized Permissions Grid */}
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {PERMISSION_GROUPS.map((group) => {
                    const isExpanded = expandedStage === group.id || Boolean(permissionSearch);
                    const matchingPerms = permissionSearch 
                      ? group.permissions.filter(p => 
                          p.labelAr.toLowerCase().includes(permissionSearch.toLowerCase()) ||
                          p.labelEn.toLowerCase().includes(permissionSearch.toLowerCase()) ||
                          p.id.toLowerCase().includes(permissionSearch.toLowerCase())
                        )
                      : group.permissions;

                    if (matchingPerms.length === 0) return null;

                    const groupPermIds = group.permissions.map(p => p.id);
                    const activeCount = groupPermIds.filter(id => userForm.customPermissions.includes(id) || userForm.customPermissions.includes('*')).length;

                    return (
                      <div key={group.id} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                        <div 
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors"
                          onClick={() => setExpandedStage(isExpanded && !permissionSearch ? null : group.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">
                              {isAr ? group.titleAr : group.titleEn}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              activeCount === groupPermIds.length
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : activeCount > 0
                                  ? 'bg-[#00A3E0]/20 text-[#00A3E0] border border-[#00A3E0]/30'
                                  : 'bg-white/5 text-gray-400'
                            }`}>
                              {activeCount} / {groupPermIds.length} {isAr ? 'مسموح' : 'granted'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectGroupPermissions(group.id, activeCount < groupPermIds.length);
                              }}
                              className="text-[11px] font-bold text-sky-400 hover:text-white px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20"
                            >
                              {activeCount === groupPermIds.length 
                                ? (isAr ? 'إلغاء المرحلة' : 'Clear Stage') 
                                : (isAr ? 'تحديد كل المرحلة' : 'Select Stage')}
                            </button>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-3 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-white/5 bg-black/30">
                            {matchingPerms.map((perm) => {
                              const isChecked = userForm.customPermissions.includes(perm.id) || userForm.customPermissions.includes('*');
                              return (
                                <label 
                                  key={perm.id} 
                                  className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer text-xs border transition-colors ${
                                    isChecked 
                                      ? 'bg-[#00A3E0]/15 border-[#00A3E0]/40 text-white font-bold' 
                                      : 'bg-white/5 border-white/5 text-gray-400 hover:text-gray-200'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleFormPermission(perm.id)}
                                    className="accent-[#00A3E0] w-4 h-4 rounded"
                                  />
                                  <div className="min-w-0">
                                    <span className="block truncate">
                                      {isAr ? perm.labelAr : perm.labelEn}
                                    </span>
                                    <span className="block text-[10px] text-gray-500 font-mono truncate">
                                      {perm.id}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setIsCreateOpen(false); setEditingUser(null); }}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-11"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  className="bg-[#00A3E0] hover:bg-[#008cc0] text-slate-950 font-black rounded-xl h-11 px-6 shadow-lg shadow-[#00A3E0]/20"
                >
                  {editingUser ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'إنشاء المستخدم' : 'Create User')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: WHATSAPP / CREDENTIALS SHARE DIALOG */}
      {shareCredentialsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {isAr ? 'مشاركة بيانات الدخول عبر واتساب' : 'Share Credentials via WhatsApp'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {shareCredentialsUser.name} ({shareCredentialsUser.phone || (isAr ? 'بدون رقم هاتف' : 'No phone')})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShareCredentialsUser(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 font-mono text-xs text-gray-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {getWhatsAppShareText(shareCredentialsUser)}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const text = getWhatsAppShareText(shareCredentialsUser);
                    navigator.clipboard.writeText(text);
                    toast.success(isAr ? 'تم نسخ نص الرسالة إلى الحافظة' : 'Message copied to clipboard');
                  }}
                  className="bg-white/5 border-white/10 text-white rounded-xl h-11"
                >
                  <Copy className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 text-[#00A3E0]" />
                  {isAr ? 'نسخ الرسالة' : 'Copy Text'}
                </Button>

                <Button
                  onClick={() => handleSendWhatsApp(shareCredentialsUser)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11 px-6 shadow-lg shadow-emerald-600/30"
                >
                  <Send className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {isAr ? 'إرسال عبر واتساب' : 'Open WhatsApp'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW USER PERMISSIONS MODAL */}
      {viewingPermissionsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#00A3E0]/10 text-[#00A3E0]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    {isAr ? 'مصفوفة صلاحيات المستخدم:' : 'Permission Matrix for:'} {viewingPermissionsUser.name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {isAr ? 'الدور الوظيفي:' : 'Role:'} <span className="text-[#00A3E0] font-bold">{viewingPermissionsUser.roleName}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingPermissionsUser(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {PERMISSION_GROUPS.map((group) => {
                const userPerms = getUserPermissions(viewingPermissionsUser);
                const hasAll = userPerms.includes('*') || userPerms.includes('admin.access');

                return (
                  <div key={group.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <p className="text-xs font-black text-white uppercase tracking-wider mb-2">
                      {isAr ? group.titleAr : group.titleEn}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.permissions.map((perm) => {
                        const isAllowed = hasAll || userPerms.includes(perm.id);
                        return (
                          <div 
                            key={perm.id} 
                            className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold border ${
                              isAllowed 
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                                : 'bg-rose-500/5 text-gray-500 border-white/5 opacity-50'
                            }`}
                          >
                            {isAllowed ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                            <span className="truncate">{isAr ? perm.labelAr : perm.labelEn}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  const u = viewingPermissionsUser;
                  setViewingPermissionsUser(null);
                  handleOpenEdit(u);
                }}
                className="bg-[#00A3E0]/10 border-[#00A3E0]/30 text-[#00A3E0] hover:bg-[#00A3E0]/20 rounded-xl h-11"
              >
                <Edit2 className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {isAr ? 'تعديل الصلاحيات' : 'Edit Permissions'}
              </Button>
              <Button
                onClick={() => setViewingPermissionsUser(null)}
                className="bg-white/10 hover:bg-white/20 text-white rounded-xl h-11 px-6 font-bold"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: QUICK PASSWORD RESET MODAL */}
      {quickPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {isAr ? 'تغيير كلمة المرور' : 'Change Password'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {quickPasswordUser.name} (@{quickPasswordUser.username || quickPasswordUser.email.split('@')[0]})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickPasswordUser(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">
                  {isAr ? 'كلمة المرور الجديدة' : 'New Password'}
                </label>
                <input
                  type="text"
                  value={newQuickPassword}
                  onChange={(e) => setNewQuickPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-[#00A3E0]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={() => setQuickPasswordUser(null)}
                  className="bg-white/5 border-white/10 text-white rounded-xl h-11"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleSaveQuickPassword}
                  className="bg-[#00A3E0] hover:bg-[#008cc0] text-slate-950 font-black rounded-xl h-11 px-6"
                >
                  {isAr ? 'تحديث كلمة المرور' : 'Update Password'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: DELETE CONFIRMATION DIALOG */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/20">
                <Trash2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">
                  {isAr ? 'تأكيد حذف المستخدم؟' : 'Confirm User Deletion?'}
                </h3>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  {isAr 
                    ? `هل أنت متأكد من رغبتك في حذف الحساب: "${userToDelete.name}" (@${userToDelete.username || userToDelete.email.split('@')[0]})؟ لا يمكن التراجع عن هذا الإجراء.`
                    : `Are you sure you want to permanently delete user "${userToDelete.name}"? This action cannot be undone.`}
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setUserToDelete(null)}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-11 px-5"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-rose-600/30"
                >
                  {isAr ? 'تأكيد الحذف النهائي' : 'Yes, Delete User'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersPage;
