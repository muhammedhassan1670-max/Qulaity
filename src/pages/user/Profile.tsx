import { useState, useRef } from 'react';
import { 
  User, 
  Mail, 
  Shield, 
  MapPin, 
  Edit2, 
  Camera, 
  CheckCircle, 
  Activity, 
  Clock,
  ChevronRight,
  Settings,
  Bell,
  Loader2
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { PageContainer, PageHeader } from '../../components/PageHeader';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, setUser } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setIsUploading(true);
    
    // Simulate upload process
    const reader = new FileReader();
    reader.onload = (event) => {
      setTimeout(() => {
        const result = event.target?.result as string;
        setUser({ ...user, avatar: result });
        setIsUploading(false);
        toast.success('Profile picture updated');
      }, 1500);
    };
    reader.readAsDataURL(file);
  };

  const activities = [] as any[];

  return (
    <PageContainer>
      <PageHeader 
        title="User Profile" 
        subtitle="Manage your personal information and security"
        breadcrumbs={[{ label: 'System' }, { label: 'User Profile' }]}
        actions={{
          custom: [
            {
              label: isEditing ? 'Save Changes' : 'Edit Profile',
              icon: isEditing ? <CheckCircle className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />,
              onClick: () => {
                setIsEditing(!isEditing);
                if (isEditing) toast.success('Profile updated successfully');
              }
            }
          ]
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel rounded-[2rem] p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-[#0066CC]/20 to-[#00A3E0]/20 -z-10" />
            
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#0066CC] to-[#00A3E0] p-1 shadow-2xl">
                <div className="w-full h-full rounded-[1.4rem] bg-[#0a0a0f] flex items-center justify-center overflow-hidden relative">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-white/20" />
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-2 -right-2 p-2.5 bg-[#0066CC] text-white rounded-xl shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:scale-100"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-2xl font-black text-white mb-1">{user?.name}</h2>
            <p className="text-[#00A3E0] font-bold text-sm uppercase tracking-widest mb-6">{user?.role}</p>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {user?.permissions?.slice(0, 3).map((perm: string) => (
                <span key={perm} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                  {perm.replace('.', ' ')}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
              <div className="text-center">
                <p className="text-2xl font-black text-white">0</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Tasks Done</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-white">0%</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Efficiency</p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6 space-y-4">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Quick Links</h3>
            <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Settings className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-white">Settings</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <Bell className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-white">Notifications</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Details & Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-[2rem] p-8">
            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#00A3E0]" />
              Account Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Full Name</label>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <User className="w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    disabled={!isEditing}
                    defaultValue={user?.name}
                    className="bg-transparent border-none text-white text-sm font-bold outline-none flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Email Address</label>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <input 
                    type="email" 
                    disabled={!isEditing}
                    defaultValue={user?.email}
                    className="bg-transparent border-none text-white text-sm font-bold outline-none flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Department</label>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <Activity className="w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    disabled={!isEditing}
                    defaultValue=""
                    className="bg-transparent border-none text-white text-sm font-bold outline-none flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Plant Location</label>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    disabled={!isEditing}
                    defaultValue={user?.plant || ''}
                    className="bg-transparent border-none text-white text-sm font-bold outline-none flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-8">
            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#00A3E0]" />
              Recent Activity
            </h3>

            <div className="space-y-4">
              {activities.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/[0.08] transition-all border border-transparent hover:border-white/5 group">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl bg-white/5 ${item.color} group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{item.action}</p>
                        <p className="text-xs text-gray-500">{item.time}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                  </div>
                );
              })}
            </div>
            
            <button className="w-full mt-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-[#00A3E0] transition-colors">
              View All History
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
