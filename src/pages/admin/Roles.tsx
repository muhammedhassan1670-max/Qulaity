// QMS Enterprise 4.0 - Roles & Permissions Page
import { useState } from 'react';
import { toast } from 'sonner';
import { 
  ShieldCheck,
  Search,
  Plus,
  Check,
  Edit2,
  Trash2,
  RefreshCw,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
  isSystem: boolean;
}

const mockRoles: Role[] = [];

const availablePermissions = [
  'dashboard.view',
  'quality.manage',
  'quality.view',
  'ncr.create',
  'ncr.view',
  'capa.manage',
  'capa.view',
  'audit.manage',
  'audit.view',
  'inspection.manage',
  'inspection.view',
  'reports.view',
  'reports.create',
  'admin.manage',
  'admin.view',
  'users.manage',
  'roles.manage'
];

export function RolesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const [roles, setRoles] = useState<Role[]>(mockRoles);

  const updateRole = (roleId: string, patch: Partial<Role>) => {
    setRoles((prev) => prev.map((r) => (r.id === roleId ? { ...r, ...patch } : r)));
    setSelectedRole((prev) => (prev?.id === roleId ? { ...prev, ...patch } : prev));
  };

  const handleDeleteRole = (roleId: string) => {
    if (window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      setRoles(prev => prev.filter(r => r.id !== roleId));
      if (selectedRole?.id === roleId) setSelectedRole(null);
      toast.success('Role deleted successfully');
    }
  };

  const togglePermission = (permission: string) => {
    if (!selectedRole || selectedRole.isSystem) return;
    
    const newPermissions = selectedRole.permissions.includes(permission)
      ? selectedRole.permissions.filter((p) => p !== permission)
      : [...selectedRole.permissions, permission];
      
    updateRole(selectedRole.id, { permissions: newPermissions });
  };

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#0066CC]/20 to-[#00A3E0]/20 border border-[#0066CC]/30 shadow-lg shadow-[#0066CC]/10">
            <ShieldCheck className="w-7 h-7 text-[#00A3E0]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Roles & Permissions</h1>
            <p className="text-sm text-gray-400 font-medium">Define access control and security levels</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => toast.success('Roles Refreshed')}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 backdrop-blur-md rounded-xl h-11"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Roles
          </Button>
          <Button 
            className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white hover:opacity-90 shadow-lg shadow-[#0066CC]/20 rounded-xl h-11 px-6 font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Role
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List Card */}
        <div className="lg:col-span-1 glass-panel rounded-[2rem] border border-white/5 overflow-hidden flex flex-col h-fit">
          <div className="p-6 border-b border-white/5 bg-white/[0.02]">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#00A3E0] transition-colors" />
              <input
                type="text"
                placeholder="Search roles..."
                className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#00A3E0]/50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="p-2 space-y-1 max-h-[600px] overflow-y-auto custom-scrollbar">
            {filteredRoles.map((role) => (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                  selectedRole?.id === role.id 
                    ? 'bg-gradient-to-r from-[#0066CC]/20 to-[#00A3E0]/5 border border-[#0066CC]/30 text-white shadow-lg' 
                    : 'hover:bg-white/5 text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                <div className={`p-2 rounded-lg ${selectedRole?.id === role.id ? 'bg-[#00A3E0]/20 text-[#00A3E0]' : 'bg-white/5 text-gray-500'}`}>
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{role.name}</p>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">{role.userCount} Users Assigned</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Permissions Editor Card */}
        <div className="lg:col-span-2 glass-panel rounded-[2rem] border border-white/5 overflow-hidden flex flex-col">
          {selectedRole ? (
            <>
              <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-black text-white">{selectedRole.name}</h2>
                      {selectedRole.isSystem && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-widest border border-blue-500/20">System</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 font-medium leading-relaxed">{selectedRole.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="bg-white/5 border-white/10 rounded-xl h-10 px-4">
                      <Edit2 className="w-3.5 h-3.5 mr-2" />
                      Edit Details
                    </Button>
                    {!selectedRole.isSystem && (
                      <Button 
                        variant="outline" 
                        onClick={() => handleDeleteRole(selectedRole.id)}
                        className="bg-red-500/5 border-red-500/10 text-red-400 hover:bg-red-500/10 rounded-xl h-10 px-4"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 flex-1">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Permissions Matrix</h3>
                  <p className="text-[11px] text-[#00A3E0] font-bold">{selectedRole.permissions.length} Enabled</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availablePermissions.map((perm) => {
                    const isEnabled = selectedRole.permissions.includes(perm) || selectedRole.permissions.includes('*');
                    return (
                      <div
                        key={perm}
                        onClick={() => !selectedRole.isSystem && togglePermission(perm)}
                        className={`
                          flex items-center justify-between p-4 rounded-2xl border transition-all duration-300
                          ${isEnabled 
                            ? 'bg-[#0066CC]/5 border-[#0066CC]/20 text-white' 
                            : 'bg-white/[0.02] border-white/5 text-gray-500 grayscale'
                          }
                          ${!selectedRole.isSystem ? 'cursor-pointer hover:border-[#0066CC]/40' : 'cursor-default opacity-80'}
                        `}
                      >
                        <span className="text-xs font-bold tracking-tight">{perm}</span>
                        <div className={`
                          w-5 h-5 rounded-full flex items-center justify-center transition-all
                          ${isEnabled ? 'bg-[#00A3E0] text-white scale-110' : 'bg-white/10 text-transparent'}
                        `}>
                          <Check className="w-3 h-3" strokeWidth={4} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 bg-white/[0.03] border-t border-white/5 flex items-center justify-between">
                <p className="text-[11px] text-gray-500 font-medium italic">
                  * System roles cannot have their core permissions modified.
                </p>
                {!selectedRole.isSystem && (
                  <Button className="bg-[#0066CC] hover:bg-[#00A3E0] text-white rounded-xl px-8 h-11 font-bold shadow-lg shadow-[#0066CC]/20">
                    Save Changes
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/5">
                <Shield className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Select a Role</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Choose a role from the left sidebar to view and manage its assigned permissions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RolesPage;
