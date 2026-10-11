// QMS Enterprise 4.0 - User Profile Management
import { useState, useRef, useEffect } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  MapPin, 
  Edit2, 
  Camera, 
  CheckCircle, 
  Activity, 
  Clock, 
  Phone,
  Sparkles,
  Upload,
  Check,
  Building2,
  Lock,
  Layers
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { PageContainer, PageHeader } from '../../components/PageHeader';
import { toast } from 'sonner';
import { useTranslation } from '@/utils/translations';
import { 
  PRESET_AVATARS, 
  loadStoredRoles, 
  updateUser 
} from '@/services/userService';

export default function ProfilePage() {
  const { user, setUser } = useAppStore();
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
    plant: user?.plant || ''
  });
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatar || '');

  // Keep form synchronized if user store changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        plant: user.plant || ''
      });
      setAvatarUrl(user.avatar || '');
    }
  }, [user]);

  // Find user's role metadata
  const roles = loadStoredRoles();
  const currentRole = roles.find(r => r.id === user?.role || r.name === user?.role);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(isAr ? 'يرجى اختيار ملف صورة صالح' : 'Please upload a valid image file');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      toast.error(isAr ? 'حجم الصورة كبير جداً (الحد الأقصى 4 ميجابايت)' : 'Image size is too large (max 4MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAvatarUrl(result);
      // Auto-save avatar directly
      if (user) {
        const updated = { ...user, avatar: result };
        setUser(updated);
        updateUser(user.id, { avatar: result });
      }
      toast.success(isAr ? 'تم تحديث الصورة الشخصية بنجاح' : 'Profile picture updated successfully');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (presetUrl: string) => {
    setAvatarUrl(presetUrl);
    if (user) {
      const updated = { ...user, avatar: presetUrl };
      setUser(updated);
      updateUser(user.id, { avatar: presetUrl });
    }
    setShowAvatarPicker(false);
    toast.success(isAr ? 'تم تعيين الصورة الرمزية المختارة' : 'Avatar updated from gallery');
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error(isAr ? 'اسم المستخدم مطلوب' : 'Full name is required');
      return;
    }
    if (!formData.email.trim()) {
      toast.error(isAr ? 'البريد الإلكتروني مطلوب' : 'Email address is required');
      return;
    }

    try {
      const updatedUser = {
        ...(user || { id: 'usr-1', role: 'admin', permissions: [] }),
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        department: formData.department.trim(),
        plant: formData.plant.trim(),
        avatar: avatarUrl
      };

      setUser(updatedUser);

      if (user?.id) {
        updateUser(user.id, {
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          department: updatedUser.department,
          plant: updatedUser.plant,
          avatar: updatedUser.avatar
        });
      }

      setIsEditing(false);
      toast.success(isAr ? 'تم حفظ التعديلات بنجاح' : 'Profile updated successfully');
    } catch {
      toast.error(isAr ? 'حدث خطأ أثناء حفظ التعديلات' : 'Failed to update profile');
    }
  };

  const mockActivities = [
    {
      id: 1,
      action: isAr ? 'اعتماد إفراج دفعة منتج تام FQC-2026-088' : 'Approved FQC release lot #2026-088',
      time: isAr ? 'منذ ساعتين' : '2 hours ago',
      category: isAr ? 'فحص نهائي' : 'FQC Release'
    },
    {
      id: 2,
      action: isAr ? 'تسجيل تقرير عدم مطابقة NCR-2026-019' : 'Logged Non-Conformance NCR-2026-019',
      time: isAr ? 'اليوم، 10:15 ص' : 'Today, 10:15 AM',
      category: isAr ? 'حل المشكلات' : 'NCR Containment'
    },
    {
      id: 3,
      action: isAr ? 'تعديل حدود التحكم الإحصائي SPC لخط التجميع 01' : 'Updated SPC control limits for Assembly Line 01',
      time: isAr ? 'أمس، 04:30 م' : 'Yesterday, 04:30 PM',
      category: isAr ? 'التحكم الإحصائي' : 'SPC Control'
    }
  ];

  return (
    <PageContainer>
      <PageHeader 
        title={isAr ? 'الملف الشخصي وحساب المستخدم' : 'User Profile'} 
        subtitle={isAr ? 'إدارة البيانات الشخصية، الصورة الرمزية، والأمان' : 'Manage your personal details, profile picture, and security'}
        breadcrumbs={[{ label: isAr ? 'النظام' : 'System' }, { label: isAr ? 'الملف الشخصي' : 'User Profile' }]}
        actions={{
          custom: [
            {
              label: isEditing ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'تعديل البيانات' : 'Edit Profile'),
              icon: isEditing ? <CheckCircle className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />,
              onClick: () => {
                if (isEditing) {
                  handleSave();
                } else {
                  setIsEditing(true);
                }
              }
            }
          ]
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Overview */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel rounded-3xl p-8 text-center relative overflow-hidden border border-slate-200 dark:border-white/10 shadow-xl bg-white/70 dark:bg-[#0a0d14]/80 backdrop-blur-xl">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-0 w-full h-36 bg-gradient-to-br from-[#0066CC]/20 via-[#00A3E0]/15 to-transparent -z-10" />
            
            {/* Avatar Section */}
            <div className="relative inline-block mb-5">
              <div className="w-36 h-36 rounded-3xl bg-gradient-to-br from-[#0066CC] to-[#00A3E0] p-1 shadow-2xl shadow-blue-500/20 group">
                <div className="w-full h-full rounded-[1.4rem] bg-slate-900 flex items-center justify-center overflow-hidden relative">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={formData.name || 'User Avatar'} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    />
                  ) : (
                    <UserIcon className="w-16 h-16 text-white/40" />
                  )}
                </div>
              </div>

              {/* Upload & Gallery Trigger Buttons */}
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
              />
              <div className="absolute -bottom-2 -right-2 flex gap-1.5">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  title={isAr ? 'رفع صورة من الجهاز' : 'Upload photo'}
                  className="p-2.5 bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  title={isAr ? 'اختيار من المعرض الرمزي' : 'Choose preset avatar'}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-[#00A3E0] border border-white/10 rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Avatar Gallery Drawer/Picker */}
            {showAvatarPicker && (
              <div className="mb-6 p-4 rounded-2xl bg-slate-900/90 border border-[#00A3E0]/30 shadow-2xl text-left animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#00A3E0]" />
                    {isAr ? 'اختر صورة جاهزة من المعرض' : 'Choose Preset Avatar'}
                  </span>
                  <button 
                    onClick={() => setShowAvatarPicker(false)}
                    className="text-[11px] text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(url)}
                      className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                        avatarUrl === url ? 'border-[#00A3E0] scale-95 ring-2 ring-[#00A3E0]/40' : 'border-transparent hover:border-white/30'
                      }`}
                    >
                      <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                      {avatarUrl === url && (
                        <div className="absolute inset-0 bg-[#00A3E0]/30 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center gap-2 border border-white/10 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-[#00A3E0]" />
                  {isAr ? 'أو ارفع صورتك الخاصة' : 'Or upload custom image'}
                </button>
              </div>
            )}

            {/* User Title & Role */}
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">
              {formData.name || (isAr ? 'مستخدم مجهول' : 'Unknown User')}
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#00A3E0] font-black text-xs uppercase tracking-wider mb-6">
              <Shield className="w-3.5 h-3.5" />
              {isAr ? (currentRole?.nameAr || user?.role) : (currentRole?.name || user?.role)}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-200 dark:border-white/5 text-left">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                <p className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                  {isAr ? 'القسم الوظيفي' : 'Department'}
                </p>
                <p className="text-xs font-black text-slate-800 dark:text-white truncate">
                  {formData.department || (isAr ? 'توكيد الجودة' : 'Quality Assurance')}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                <p className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                  {isAr ? 'موقع المصنع' : 'Plant Site'}
                </p>
                <p className="text-xs font-black text-slate-800 dark:text-white truncate">
                  {formData.plant || (isAr ? 'المصنع الرئيسي' : 'Main Plant')}
                </p>
              </div>
            </div>
          </div>

          {/* Security & Access Card */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-lg bg-white/70 dark:bg-[#0a0d14]/80 backdrop-blur-xl">
            <h3 className="text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#00A3E0]" />
              {isAr ? 'صلاحيات الحساب الممنوحة' : 'Active Privileges'}
            </h3>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {user?.permissions && user.permissions.length > 0 ? (
                user.permissions.map((perm) => (
                  <span 
                    key={perm} 
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-mono font-bold text-slate-700 dark:text-gray-300"
                  >
                    {perm}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-500 italic">
                  {isAr ? 'صلاحيات قياسية فعالة' : 'Standard role permissions active'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile Details & Activities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info Card */}
          <div className="glass-panel rounded-3xl p-8 border border-slate-200 dark:border-white/10 shadow-xl bg-white/70 dark:bg-[#0a0d14]/80 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-white/5">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#00A3E0]" />
                {isAr ? 'البيانات الشخصية وبيانات التواصل' : 'Personal & Contact Information'}
              </h3>
              {isEditing ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold animate-pulse">
                  {isAr ? 'وضع التعديل نشط' : 'Editing Mode Active'}
                </span>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-bold text-[#00A3E0] hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {isAr ? 'تعديل البيانات' : 'Edit Details'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-[#00A3E0]" />
                  {isAr ? 'الاسم بالكامل' : 'Full Name'}
                </label>
                <div className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                  isEditing 
                    ? 'bg-white dark:bg-black/30 border-[#00A3E0] ring-2 ring-[#00A3E0]/20' 
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'
                }`}>
                  <input 
                    type="text" 
                    disabled={!isEditing}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={isAr ? 'أدخل الاسم الثلاثي' : 'Enter full name'}
                    className="bg-transparent border-none text-slate-900 dark:text-white text-sm font-bold outline-none w-full disabled:opacity-80"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#00A3E0]" />
                  {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <div className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                  isEditing 
                    ? 'bg-white dark:bg-black/30 border-[#00A3E0] ring-2 ring-[#00A3E0]/20' 
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'
                }`}>
                  <input 
                    type="email" 
                    disabled={!isEditing}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@qms-industrial.com"
                    className="bg-transparent border-none text-slate-900 dark:text-white text-sm font-bold outline-none w-full disabled:opacity-80"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#00A3E0]" />
                  {isAr ? 'رقم الهاتف / الواتساب' : 'Phone / Mobile'}
                </label>
                <div className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                  isEditing 
                    ? 'bg-white dark:bg-black/30 border-[#00A3E0] ring-2 ring-[#00A3E0]/20' 
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'
                }`}>
                  <input 
                    type="tel" 
                    disabled={!isEditing}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+20 100 000 0000"
                    className="bg-transparent border-none text-slate-900 dark:text-white text-sm font-bold outline-none w-full disabled:opacity-80"
                  />
                </div>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#00A3E0]" />
                  {isAr ? 'الإدارة / القسم' : 'Department'}
                </label>
                <div className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                  isEditing 
                    ? 'bg-white dark:bg-black/30 border-[#00A3E0] ring-2 ring-[#00A3E0]/20' 
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'
                }`}>
                  <input 
                    type="text" 
                    disabled={!isEditing}
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder={isAr ? 'مثال: إدارة الجودة الشاملة' : 'e.g. Quality Assurance'}
                    className="bg-transparent border-none text-slate-900 dark:text-white text-sm font-bold outline-none w-full disabled:opacity-80"
                  />
                </div>
              </div>

              {/* Plant Location */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-[11px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#00A3E0]" />
                  {isAr ? 'موقع المصنع / المنشأة' : 'Plant Location / Facility'}
                </label>
                <div className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                  isEditing 
                    ? 'bg-white dark:bg-black/30 border-[#00A3E0] ring-2 ring-[#00A3E0]/20' 
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'
                }`}>
                  <input 
                    type="text" 
                    disabled={!isEditing}
                    value={formData.plant}
                    onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
                    placeholder={isAr ? 'مثال: مجمع السادس من أكتوبر - صالة 1' : 'Main Plant - Assembly 01'}
                    className="bg-transparent border-none text-slate-900 dark:text-white text-sm font-bold outline-none w-full disabled:opacity-80"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions when Editing */}
            {isEditing && (
              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    if (user) {
                      setFormData({
                        name: user.name || '',
                        email: user.email || '',
                        phone: user.phone || '',
                        department: user.department || '',
                        plant: user.plant || ''
                      });
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white text-xs font-black shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {isAr ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Activity Timeline Card */}
          <div className="glass-panel rounded-3xl p-8 border border-slate-200 dark:border-white/10 shadow-xl bg-white/70 dark:bg-[#0a0d14]/80 backdrop-blur-xl">
            <h3 className="text-base font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#00A3E0]" />
              {isAr ? 'سجل العمليات والأنشطة الأخيرة' : 'Recent Quality Log & Activities'}
            </h3>

            <div className="space-y-3">
              {mockActivities.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all border border-slate-200/50 dark:border-white/5 group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-[#00A3E0] group-hover:scale-110 transition-transform">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">{item.action}</p>
                      <span className="text-[10px] text-slate-500 dark:text-gray-500 font-bold">{item.time}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-200/60 dark:bg-white/10 text-[10px] font-bold text-slate-600 dark:text-gray-400">
                    {item.category}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#00A3E0]" />
                {isAr ? 'نظام تتبع العمليات الصناعية QMS 4.0' : 'QMS 4.0 Industrial Audit Trail'}
              </span>
              <span className="text-emerald-500 flex items-center gap-1">
                ● {isAr ? 'الجلسة متصلة' : 'Session Active'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
