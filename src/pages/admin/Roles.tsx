// QMS Enterprise 4.0 - Professional Roles & Permissions Workspace
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { 
  ShieldCheck,
  Search,
  Plus,
  Check,
  Edit2,
  Trash2,
  RefreshCw,
  Shield,
  Copy,
  Lock,
  Layers,
  Sparkles,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/utils/translations';
import { 
  loadStoredRoles, 
  saveStoredRoles, 
  PERMISSION_GROUPS, 
  ALL_PERMISSION_KEYS,
  type RoleDefinition 
} from '@/services/userService';

export function RolesPage() {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [roles, setRoles] = useState<RoleDefinition[]>(() => loadStoredRoles());
  const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(() => {
    const loaded = loadStoredRoles();
    return loaded[0] || null;
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    color: '#00A3E0'
  });
  const [editRoleForm, setEditRoleForm] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: ''
  });

  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return roles;
    const q = searchQuery.toLowerCase();
    return roles.filter(r => 
      r.name.toLowerCase().includes(q) ||
      r.nameAr.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.descriptionAr.toLowerCase().includes(q)
    );
  }, [roles, searchQuery]);

  const handleSelectRole = (role: RoleDefinition) => {
    setSelectedRole(role);
  };

  const handleTogglePermission = (permId: string) => {
    if (!selectedRole) return;
    if (selectedRole.isSystem && selectedRole.id === 'admin') {
      toast.info(isAr ? 'مدير النظام يمتلك كافة الصلاحيات دائماً' : 'Administrator role always retains all permissions');
      return;
    }

    const currentPerms = selectedRole.permissions;
    const hasPerm = currentPerms.includes(permId) || currentPerms.includes('*');
    let nextPerms: string[];

    if (hasPerm) {
      nextPerms = currentPerms.filter(p => p !== permId && p !== '*');
    } else {
      nextPerms = [...currentPerms, permId];
    }

    const updated = { ...selectedRole, permissions: nextPerms };
    setSelectedRole(updated);
    const updatedRoles = roles.map(r => r.id === updated.id ? updated : r);
    setRoles(updatedRoles);
    saveStoredRoles(updatedRoles);
    toast.success(isAr ? 'تم تحديث الصلاحية فورياً' : 'Permission updated');
  };

  const handleToggleGroup = (groupId: string) => {
    if (!selectedRole || (selectedRole.isSystem && selectedRole.id === 'admin')) return;

    const group = PERMISSION_GROUPS.find(g => g.id === groupId);
    if (!group) return;

    const groupPermIds = group.permissions.map(p => p.id);
    const allEnabled = groupPermIds.every(id => selectedRole.permissions.includes(id));

    let nextPerms: string[];
    if (allEnabled) {
      // Remove all group perms
      nextPerms = selectedRole.permissions.filter(p => !groupPermIds.includes(p));
    } else {
      // Add missing group perms
      const toAdd = groupPermIds.filter(id => !selectedRole.permissions.includes(id));
      nextPerms = [...selectedRole.permissions, ...toAdd];
    }

    const updated = { ...selectedRole, permissions: nextPerms };
    setSelectedRole(updated);
    const updatedRoles = roles.map(r => r.id === updated.id ? updated : r);
    setRoles(updatedRoles);
    saveStoredRoles(updatedRoles);
    toast.success(isAr ? 'تم تحديث صلاحيات المجموعة' : 'Category permissions updated');
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleForm.name.trim()) {
      toast.error(isAr ? 'يرجى إدخال اسم الدور بالإنجليزية' : 'Please provide a role name');
      return;
    }

    const newRole: RoleDefinition = {
      id: `role-${Date.now().toString(36)}`,
      name: newRoleForm.name.trim(),
      nameAr: newRoleForm.nameAr.trim() || newRoleForm.name.trim(),
      description: newRoleForm.description.trim() || 'Custom plant quality role',
      descriptionAr: newRoleForm.descriptionAr.trim() || 'دور مخصص لمنظومة الجودة بالمصنع',
      userCount: 0,
      permissions: ['shopfloor.log_defect', 'spc.view'],
      isSystem: false,
      color: newRoleForm.color || '#00A3E0'
    };

    const updatedRoles = [...roles, newRole];
    setRoles(updatedRoles);
    saveStoredRoles(updatedRoles);
    setSelectedRole(newRole);
    setIsCreateModalOpen(false);
    setNewRoleForm({ name: '', nameAr: '', description: '', descriptionAr: '', color: '#00A3E0' });
    toast.success(isAr ? `تم إنشاء الدور "${newRole.nameAr}" بنجاح` : `Role "${newRole.name}" created successfully`);
  };

  const handleEditRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !editRoleForm.name.trim()) return;

    const updated: RoleDefinition = {
      ...selectedRole,
      name: editRoleForm.name.trim(),
      nameAr: editRoleForm.nameAr.trim() || editRoleForm.name.trim(),
      description: editRoleForm.description.trim(),
      descriptionAr: editRoleForm.descriptionAr.trim()
    };

    const updatedRoles = roles.map(r => r.id === updated.id ? updated : r);
    setRoles(updatedRoles);
    setSelectedRole(updated);
    saveStoredRoles(updatedRoles);
    setIsEditModalOpen(false);
    toast.success(isAr ? 'تم تعديل بيانات الدور بنجاح' : 'Role details updated');
  };

  const handleDeleteRole = (role: RoleDefinition) => {
    if (role.isSystem) {
      toast.error(isAr ? 'لا يمكن حذف الأدوار القياسية للنظام' : 'Cannot delete core system roles');
      return;
    }

    if (window.confirm(isAr ? `هل أنت متأكد من حذف الدور "${role.nameAr}"؟` : `Are you sure you want to delete role "${role.name}"?`)) {
      const remaining = roles.filter(r => r.id !== role.id);
      setRoles(remaining);
      saveStoredRoles(remaining);
      if (selectedRole?.id === role.id) {
        setSelectedRole(remaining[0] || null);
      }
      toast.success(isAr ? 'تم حذف الدور بنجاح' : 'Role deleted successfully');
    }
  };

  const handleDuplicateRole = (sourceRole: RoleDefinition) => {
    const clone: RoleDefinition = {
      id: `role-${Date.now().toString(36)}`,
      name: `${sourceRole.name} (Copy)`,
      nameAr: `${sourceRole.nameAr} (نسخة)`,
      description: sourceRole.description,
      descriptionAr: sourceRole.descriptionAr,
      userCount: 0,
      permissions: [...sourceRole.permissions],
      isSystem: false,
      color: sourceRole.color || '#3B82F6'
    };

    const updated = [...roles, clone];
    setRoles(updated);
    saveStoredRoles(updated);
    setSelectedRole(clone);
    toast.success(isAr ? 'تم استنساخ الدور بنجاح' : 'Role cloned successfully');
  };

  const handleSelectAll = () => {
    if (!selectedRole || (selectedRole.isSystem && selectedRole.id === 'admin')) return;
    const updated = { ...selectedRole, permissions: [...ALL_PERMISSION_KEYS] };
    setSelectedRole(updated);
    const updatedRoles = roles.map(r => r.id === updated.id ? updated : r);
    setRoles(updatedRoles);
    saveStoredRoles(updatedRoles);
    toast.success(isAr ? 'تم منح جميع الصلاحيات' : 'All permissions granted');
  };

  const handleClearAll = () => {
    if (!selectedRole || selectedRole.isSystem) return;
    const updated = { ...selectedRole, permissions: [] };
    setSelectedRole(updated);
    const updatedRoles = roles.map(r => r.id === updated.id ? updated : r);
    setRoles(updatedRoles);
    saveStoredRoles(updatedRoles);
    toast.success(isAr ? 'تم إلغاء تفعيل جميع الصلاحيات' : 'All permissions cleared');
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#0066CC]/20 to-[#00A3E0]/20 border border-[#0066CC]/30 shadow-lg shadow-[#0066CC]/10 text-[#00A3E0]">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {isAr ? 'إدارة الأدوار ومصفوفة الصلاحيات' : 'Roles & Permissions Matrix'}
            </h1>
            <p className="text-sm text-gray-400 font-medium">
              {isAr ? 'التحكم الدقيق بصلاحيات الوصول لمراحل المصنع الخمس وأدوات الجودة' : 'Fine-grained RBAC for manufacturing value stream and plant tools'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => {
              const fresh = loadStoredRoles();
              setRoles(fresh);
              toast.success(isAr ? 'تمت مزامنة الأدوار' : 'Roles refreshed');
            }}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 backdrop-blur-md rounded-xl h-11"
          >
            <RefreshCw className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {isAr ? 'مزامنة الأدوار' : 'Sync Roles'}
          </Button>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white hover:opacity-90 shadow-lg shadow-[#0066CC]/20 rounded-xl h-11 px-6 font-bold"
          >
            <Plus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {isAr ? 'إنشاء دور جديد' : 'Create Role'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Roles List */}
        <div className="lg:col-span-1 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl overflow-hidden flex flex-col h-fit shadow-xl">
          <div className="p-4 border-b border-white/10 bg-white/[0.02]">
            <div className="relative">
              <Search className="absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={isAr ? 'البحث في الأدوار...' : 'Search roles...'}
                className="w-full h-11 pl-10 pr-4 rtl:pr-10 rtl:pl-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-[#00A3E0] transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="p-3 space-y-2 max-h-[650px] overflow-y-auto">
            {filteredRoles.map((role) => {
              const isSelected = selectedRole?.id === role.id;
              return (
                <div
                  key={role.id}
                  onClick={() => handleSelectRole(role)}
                  className={`w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-gradient-to-r from-[#0066CC]/30 to-[#00A3E0]/15 border border-[#00A3E0]/40 text-white shadow-lg' 
                      : 'hover:bg-white/5 text-gray-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md font-black text-sm"
                      style={{ 
                        backgroundColor: `${role.color || '#00A3E0'}20`, 
                        color: role.color || '#00A3E0',
                        border: `1px solid ${role.color || '#00A3E0'}40`
                      }}
                    >
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold truncate">
                          {isAr ? role.nameAr : role.name}
                        </p>
                        {role.isSystem && (
                          <span className="px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 text-[9px] font-mono border border-sky-500/20">
                            {isAr ? 'نظام' : 'System'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">
                        {role.userCount} {isAr ? 'مستخدمين مفعلين' : 'Users Assigned'}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50">
                      {role.permissions.includes('*') ? 'ALL' : `${role.permissions.length}P`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Permissions Editor Matrix */}
        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl overflow-hidden flex flex-col shadow-xl">
          {selectedRole ? (
            <>
              {/* Role Header Banner */}
              <div className="p-6 sm:p-8 border-b border-white/10 bg-white/[0.02]">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-black text-white">
                        {isAr ? selectedRole.nameAr : selectedRole.name}
                      </h2>
                      {selectedRole.isSystem ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 text-xs font-bold border border-emerald-500/20 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          {isAr ? 'دور نظامي أساسي' : 'System Core Role'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-[#00A3E0]/10 text-[#00A3E0] text-xs font-bold border border-[#00A3E0]/20 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          {isAr ? 'دور مخصص للمصنع' : 'Custom Plant Role'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed font-medium">
                      {isAr ? selectedRole.descriptionAr : selectedRole.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setEditRoleForm({
                          name: selectedRole.name,
                          nameAr: selectedRole.nameAr,
                          description: selectedRole.description,
                          descriptionAr: selectedRole.descriptionAr
                        });
                        setIsEditModalOpen(true);
                      }}
                      className="bg-white/5 border-white/10 rounded-xl h-10 px-3 text-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                      {isAr ? 'تعديل الوصف' : 'Edit'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleDuplicateRole(selectedRole)}
                      className="bg-white/5 border-white/10 rounded-xl h-10 px-3 text-xs"
                      title={isAr ? 'استنساخ الدور' : 'Duplicate Role'}
                    >
                      <Copy className="w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                      {isAr ? 'نسخ' : 'Clone'}
                    </Button>
                    {!selectedRole.isSystem && (
                      <Button 
                        variant="outline" 
                        onClick={() => handleDeleteRole(selectedRole)}
                        className="bg-red-500/10 border-red-500/20 text-red-300 hover:bg-red-500/20 rounded-xl h-10 px-3 text-xs"
                        title={isAr ? 'حذف الدور' : 'Delete Role'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Bulk matrix toggles */}
                {!selectedRole.isSystem && (
                  <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/5">
                    <button
                      onClick={handleSelectAll}
                      className="text-xs font-bold text-[#00A3E0] hover:underline"
                    >
                      {isAr ? '✓ تفعيل كافة الصلاحيات' : '✓ Select All'}
                    </button>
                    <span className="text-white/20">•</span>
                    <button
                      onClick={handleClearAll}
                      className="text-xs font-bold text-gray-400 hover:text-white hover:underline"
                    >
                      {isAr ? '✕ إلغاء التحديد بالكامل' : '✕ Clear All'}
                    </button>
                  </div>
                )}
              </div>

              {/* Categorized Permissions Groups */}
              <div className="p-6 sm:p-8 space-y-8 overflow-y-auto max-h-[600px]">
                {PERMISSION_GROUPS.map((group) => {
                  const groupPermIds = group.permissions.map(p => p.id);
                  const isAllInGroup = groupPermIds.every(id => 
                    selectedRole.permissions.includes(id) || selectedRole.permissions.includes('*')
                  );
                  const activeCount = groupPermIds.filter(id => 
                    selectedRole.permissions.includes(id) || selectedRole.permissions.includes('*')
                  ).length;

                  return (
                    <div key={group.id} className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-[#00A3E0]" />
                          <h3 className="text-sm font-black text-white uppercase tracking-wider">
                            {isAr ? group.titleAr : group.titleEn}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-gray-400">
                            {activeCount}/{group.permissions.length}
                          </span>
                          {!selectedRole.isSystem && (
                            <button
                              onClick={() => handleToggleGroup(group.id)}
                              className="text-[11px] font-bold text-[#00A3E0] hover:underline"
                            >
                              {isAllInGroup ? (isAr ? 'تعطيل الكل' : 'Disable') : (isAr ? 'تفعيل الكل' : 'Enable')}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {group.permissions.map((perm) => {
                          const isEnabled = selectedRole.permissions.includes(perm.id) || selectedRole.permissions.includes('*');
                          const canToggle = !selectedRole.isSystem || selectedRole.id !== 'admin';

                          return (
                            <div
                              key={perm.id}
                              onClick={() => canToggle && handleTogglePermission(perm.id)}
                              className={`
                                flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 select-none
                                ${isEnabled 
                                  ? 'bg-[#0066CC]/15 border-[#00A3E0]/40 text-white shadow-sm' 
                                  : 'bg-white/[0.02] border-white/5 text-gray-400 hover:border-white/10'
                                }
                                ${canToggle ? 'cursor-pointer hover:scale-[1.01]' : 'cursor-default opacity-85'}
                              `}
                            >
                              <div className="min-w-0 pr-3 rtl:pl-3 rtl:pr-0">
                                <p className="text-xs font-bold truncate">
                                  {isAr ? perm.labelAr : perm.labelEn}
                                </p>
                                <p className="text-[10px] font-mono text-white/30 truncate mt-0.5">
                                  {perm.id}
                                </p>
                              </div>
                              <div className={`
                                w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-transform
                                ${isEnabled ? 'bg-[#00A3E0] text-slate-950 scale-105' : 'bg-white/10 text-transparent'}
                              `}>
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10 text-gray-500">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                {isAr ? 'حدد دوراً لعرض صلاحياته' : 'Select a Role'}
              </h3>
              <p className="text-sm text-gray-400 max-w-xs">
                {isAr ? 'اختر دوراً من القائمة الجانبية لتعديل مصفوفة الصلاحيات' : 'Choose a role from the left list to view and configure its permissions matrix.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Role */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-slate-900 text-white shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#00A3E0]/20 text-[#00A3E0]">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black">
                  {isAr ? 'إنشاء دور صلاحيات جديد' : 'Create New Security Role'}
                </h3>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">
                  {isAr ? 'اسم الدور (إنجليزي)' : 'Role Name (English)'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Calibration & Lab Lead"
                  value={newRoleForm.name}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
                  className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">
                  {isAr ? 'اسم الدور (عربي)' : 'Role Name (Arabic)'}
                </label>
                <input
                  type="text"
                  placeholder="مثال: مسؤول المعايرة والمختبر"
                  value={newRoleForm.nameAr}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, nameAr: e.target.value })}
                  className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">
                  {isAr ? 'الوصف ومسؤوليات الدور' : 'Role Scope & Responsibilities'}
                </label>
                <textarea
                  rows={3}
                  placeholder={isAr ? 'اشرح اختصاصات هذا الدور وموقعه في مصنع الإنتاج...' : 'Describe duties and factory station responsibilities...'}
                  value={isAr ? newRoleForm.descriptionAr : newRoleForm.description}
                  onChange={(e) => {
                    if (isAr) setNewRoleForm({ ...newRoleForm, descriptionAr: e.target.value, description: e.target.value });
                    else setNewRoleForm({ ...newRoleForm, description: e.target.value });
                  }}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-11"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  className="bg-[#00A3E0] hover:bg-[#008cc0] text-slate-950 font-black rounded-xl h-11 px-6"
                >
                  {isAr ? 'حفظ وتفعيل الدور' : 'Save Role'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Role */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-slate-900 text-white shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#0066CC]/20 text-[#00A3E0]">
                  <Edit2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black">
                  {isAr ? 'تعديل بيانات الدور' : 'Edit Role Details'}
                </h3>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">
                  {isAr ? 'اسم الدور (إنجليزي)' : 'Role Name (English)'}
                </label>
                <input
                  type="text"
                  required
                  value={editRoleForm.name}
                  onChange={(e) => setEditRoleForm({ ...editRoleForm, name: e.target.value })}
                  className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">
                  {isAr ? 'اسم الدور (عربي)' : 'Role Name (Arabic)'}
                </label>
                <input
                  type="text"
                  value={editRoleForm.nameAr}
                  onChange={(e) => setEditRoleForm({ ...editRoleForm, nameAr: e.target.value })}
                  className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">
                  {isAr ? 'الوصف بالإنجليزية' : 'Description (English)'}
                </label>
                <textarea
                  rows={2}
                  value={editRoleForm.description}
                  onChange={(e) => setEditRoleForm({ ...editRoleForm, description: e.target.value })}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">
                  {isAr ? 'الوصف بالعربية' : 'Description (Arabic)'}
                </label>
                <textarea
                  rows={2}
                  value={editRoleForm.descriptionAr}
                  onChange={(e) => setEditRoleForm({ ...editRoleForm, descriptionAr: e.target.value })}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#00A3E0]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-11"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  className="bg-[#0066CC] hover:bg-[#0055b3] text-white font-bold rounded-xl h-11 px-6"
                >
                  {isAr ? 'حفظ التعديلات' : 'Update Details'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RolesPage;
