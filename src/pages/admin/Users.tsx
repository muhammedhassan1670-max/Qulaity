// QMS Enterprise 4.0 - Professional User Management Workspace
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
  Key
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/utils/translations';
import { 
  loadStoredUsers, 
  loadStoredRoles, 
  createUser, 
  updateUser, 
  deleteUser, 
  PRESET_AVATARS,
  type UserAccount 
} from '@/services/userService';

const statusConfig = {
  active: { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: CheckCircle2, labelEn: 'Active', labelAr: 'مفعل' },
  inactive: { color: 'bg-slate-500/20 text-slate-300 border-slate-500/30', icon: XCircle, labelEn: 'Inactive', labelAr: 'معطل' },
  suspended: { color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icon: AlertOctagon, labelEn: 'Suspended', labelAr: 'موقوف' }
};

export function UsersPage() {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [users, setUsers] = useState<UserAccount[]>(() => loadStoredUsers());
  const [roles] = useState(() => loadStoredRoles());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
    status: 'active' as 'active' | 'inactive' | 'suspended',
    avatar: PRESET_AVATARS[0]
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => [
    { labelEn: 'Total Users', labelAr: 'إجمالي المستخدمين', value: users.length, color: 'text-white' },
    { labelEn: 'Active Staff', labelAr: 'المستخدمين النشطين', value: users.filter(u => u.status === 'active').length, color: 'text-emerald-400' },
    { labelEn: 'Inactive / Suspended', labelAr: 'معطلين / موقوفين', value: users.filter(u => u.status !== 'active').length, color: 'text-amber-400' },
    { labelEn: 'Security Roles', labelAr: 'أدوار النظام', value: roles.length, color: 'text-[#00A3E0]' }
  ], [users, roles]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.roleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.department.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = selectedStatus === 'all' || u.status === selectedStatus;
      const matchRole = selectedRoleFilter === 'all' || u.roleId === selectedRoleFilter;

      return matchSearch && matchStatus && matchRole;
    });
  }, [users, searchQuery, selectedStatus, selectedRoleFilter]);

  const handleOpenCreate = () => {
    setUserForm({
      name: '',
      email: '',
      username: '',
      password: '',
      phone: '',
      roleId: roles[0]?.id || 'quality_engineer',
      department: 'Quality Assurance',
      plant: 'Main Plant - Assembly 01',
      status: 'active',
      avatar: PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)]
    });
    setShowPassword(false);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      username: user.username || '',
      password: user.password || '',
      phone: user.phone || '',
      roleId: user.roleId,
      department: user.department,
      plant: user.plant,
      status: user.status,
      avatar: user.avatar || PRESET_AVATARS[0]
    });
    setShowPassword(false);
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

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.email.trim()) {
      toast.error(isAr ? 'الاسم والبريد الإلكتروني مطلوبان' : 'Name and Email are required');
      return;
    }

    const matchedRole = roles.find(r => r.id === userForm.roleId);
    const roleName = matchedRole ? (isAr ? matchedRole.nameAr : matchedRole.name) : userForm.roleId;

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
        status: userForm.status,
        avatar: userForm.avatar
      });
      if (res) {
        setUsers(loadStoredUsers());
        toast.success(isAr ? 'تم تحديث بيانات المستخدم وكلمة المرور' : 'User updated successfully');
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
        status: userForm.status,
        avatar: userForm.avatar
      });
      setUsers(loadStoredUsers());
      setIsCreateOpen(false);
      toast.success(isAr ? 'تمت إضافة المستخدم وتعيين الصلاحيات وكلمة المرور' : 'New user created successfully');
    }
  };

  const handleDelete = (user: UserAccount) => {
    if (window.confirm(isAr ? `هل أنت متأكد من حذف المستخدم "${user.name}"؟` : `Delete user "${user.name}"?`)) {
      deleteUser(user.id);
      setUsers(loadStoredUsers());
      toast.success(isAr ? 'تم حذف المستخدم' : 'User deleted');
    }
  };

  const handleToggleStatus = (user: UserAccount) => {
    const nextStatus: UserAccount['status'] = user.status === 'active' ? 'inactive' : 'active';
    updateUser(user.id, { status: nextStatus });
    setUsers(loadStoredUsers());
    toast.success(isAr ? `تم تعديل حالة المستخدم إلى: ${statusConfig[nextStatus].labelAr}` : `Status changed to ${nextStatus}`);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Department', 'Plant', 'Status', 'Last Login', 'Created At'];
    const rows = users.map(u => [
      u.id,
      `"${u.name}"`,
      u.email,
      u.phone || '',
      `"${u.roleName}"`,
      `"${u.department}"`,
      `"${u.plant}"`,
      u.status,
      u.lastLogin,
      u.createdAt
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qms_users_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(isAr ? 'تم تصدير قائمة المستخدمين بصيغة CSV' : 'User directory exported to CSV');
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
            <h1 className="text-2xl font-black text-white tracking-tight">
              {isAr ? 'إدارة المستخدمين وحسابات الجودة' : 'User Account Management'}
            </h1>
            <p className="text-sm text-gray-400 font-medium">
              {isAr ? 'إدارة مهندسي ومفتشي المصنع والصور الشخصية والصلاحيات الممنوحة' : 'Plant quality personnel, inspector profiles, avatars and plant assignment'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleExportCSV}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 backdrop-blur-md rounded-xl h-11"
          >
            <Download className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {isAr ? 'تصدير القائمة CSV' : 'Export CSV'}
          </Button>
          <Button 
            onClick={handleOpenCreate}
            className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white hover:opacity-90 shadow-lg shadow-[#0066CC]/20 rounded-xl h-11 px-6 font-bold"
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

      {/* Main Content Area */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-2xl">
        {/* Filter Bar */}
        <div className="p-4 sm:p-6 border-b border-white/10 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={isAr ? 'بحث بالاسم، البريد، أو القسم...' : 'Search by name, email, department...'}
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

            <Button 
              variant="ghost" 
              onClick={() => {
                setUsers(loadStoredUsers());
                toast.success(isAr ? 'تم تحديث القائمة' : 'List refreshed');
              }}
              className="text-gray-400 hover:text-white h-11 px-3"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] border-b border-white/10 text-gray-400 text-xs uppercase font-black">
              <tr>
                <th className="text-left rtl:text-right px-6 py-4">{isAr ? 'المستخدم والصورة' : 'User & Avatar'}</th>
                <th className="text-left rtl:text-right px-6 py-4">{isAr ? 'الدور والقسم' : 'Role & Department'}</th>
                <th className="text-left rtl:text-right px-6 py-4">{isAr ? 'المصنع' : 'Plant'}</th>
                <th className="text-left rtl:text-right px-6 py-4">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="text-left rtl:text-right px-6 py-4">{isAr ? 'آخر دخول' : 'Last Active'}</th>
                <th className="text-right rtl:text-left px-6 py-4">{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <UserIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    {isAr ? 'لا يوجد مستخدمين مطابقين للبحث' : 'No users match your search criteria'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const statusInfo = statusConfig[user.status] || statusConfig.active;
                  const StatusIcon = statusInfo.icon;

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
                            <p className="font-bold text-white truncate">{user.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400 truncate">{user.email}</span>
                              {user.username && (
                                <span className="text-[10px] text-[#00A3E0] font-mono bg-[#00A3E0]/10 px-1.5 py-0.5 rounded">
                                  @{user.username}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-amber-400/80 font-mono mt-1 flex items-center gap-1">
                              <Key className="w-3 h-3" />
                              <span>{isAr ? 'الباسورد:' : 'Pass:'} {user.password || '123456'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Dept */}
                      <td className="px-6 py-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-sky-300 mb-1">
                          {user.roleName}
                        </span>
                        <p className="text-xs text-gray-400 truncate">{user.department}</p>
                      </td>

                      {/* Plant */}
                      <td className="px-6 py-4 text-xs font-medium text-gray-300">
                        {user.plant}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          title={isAr ? 'انقر لتغيير الحالة' : 'Click to toggle status'}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-transform hover:scale-105 ${statusInfo.color}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{isAr ? statusInfo.labelAr : statusInfo.labelEn}</span>
                        </button>
                      </td>

                      {/* Last Login */}
                      <td className="px-6 py-4 text-xs font-mono text-gray-400">
                        {user.lastLogin}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right rtl:text-left">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            title={isAr ? 'تعديل المستخدم' : 'Edit User'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
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

      {/* Modal: Add or Edit User */}
      {(isCreateOpen || editingUser) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl border border-white/15 bg-slate-900 text-white shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#00A3E0]/20 text-[#00A3E0]">
                  {editingUser ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <h3 className="text-lg font-black">
                  {editingUser 
                    ? (isAr ? 'تعديل بيانات المستخدم والصورة' : 'Edit User & Avatar')
                    : (isAr ? 'إضافة مستخدم جديد للنظام' : 'Create New QMS User')}
                </h3>
              </div>
              <button 
                onClick={() => { setIsCreateOpen(false); setEditingUser(null); }}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-5">
              {/* Avatar Selector Section */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <label className="block text-xs font-bold text-gray-400">
                  {isAr ? 'الصورة الشخصية (Avatar)' : 'Profile Picture / Avatar'}
                </label>
                
                <div className="flex items-center gap-4">
                  {/* Current Preview */}
                  <div className="relative group">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#0066CC] to-[#00A3E0] p-0.5 shadow-lg">
                      <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center overflow-hidden">
                        {userForm.avatar ? (
                          <img src={userForm.avatar} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-8 h-8 text-white/30" />
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-[#00A3E0] text-slate-950 shadow hover:scale-110 transition-transform"
                      title={isAr ? 'رفع صورة من الجهاز' : 'Upload from device'}
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleAvatarFile} 
                  />

                  {/* Preset Quick Selectors */}
                  <div className="flex-1">
                    <p className="text-[11px] text-gray-400 mb-2 font-medium">
                      {isAr ? 'أو اختر صورة جاهزة:' : 'Or choose a preset avatar:'}
                    </p>
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
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'البريد الإلكتروني' : 'Email Address'} *
                  </label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-[#00A3E0]" />
                    {isAr ? 'اسم الدخول (Username)' : 'Username'}
                  </label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    placeholder={isAr ? 'اسم مستخدم مختصر لتسجيل الدخول' : 'Short login username'}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#00A3E0]" />
                      {isAr ? 'كلمة المرور (Password)' : 'Password'} *
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-[#00A3E0] hover:underline"
                    >
                      {showPassword ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}
                    </button>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder={isAr ? 'اترك فارغاً للافتراضي (123456)' : 'Leave empty for default (123456)'}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'رقم الهاتف' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">
                    {isAr ? 'الدور الوظيفي والصلاحيات' : 'Security Role'} *
                  </label>
                  <select
                    value={userForm.roleId}
                    onChange={(e) => setUserForm({ ...userForm, roleId: e.target.value })}
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
                    {isAr ? 'المصنع المحدد' : 'Assigned Plant'}
                  </label>
                  <input
                    type="text"
                    value={userForm.plant}
                    onChange={(e) => setUserForm({ ...userForm, plant: e.target.value })}
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">
                  {isAr ? 'حالة الحساب' : 'Account Status'}
                </label>
                <div className="flex items-center gap-3">
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
                      <span className="text-xs font-bold capitalize">
                        {isAr ? statusConfig[st].labelAr : statusConfig[st].labelEn}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

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
                  className="bg-[#00A3E0] hover:bg-[#008cc0] text-slate-950 font-black rounded-xl h-11 px-6"
                >
                  {editingUser ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'إنشاء المستخدم' : 'Create User')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersPage;
