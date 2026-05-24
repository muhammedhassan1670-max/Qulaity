// QMS Enterprise 4.0 - Users Page
import { useState } from 'react';
import { 
  Users,
  Search,
  Plus,
  User,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  RefreshCw,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  plant: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  permissions: string[];
}

const mockUsers: UserData[] = [];

const statusConfig = {
  'active': { color: 'bg-green-500/20 text-green-400', icon: CheckCircle2 },
  'inactive': { color: 'bg-gray-500/20 text-gray-400', icon: XCircle },
  'suspended': { color: 'bg-red-500/20 text-red-400', icon: XCircle }
};

export function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const stats: Array<{ label: string; value: string | number; change: string; trend: 'up' | 'down' | 'neutral' }> = [
    { label: 'Total Users', value: mockUsers.length, change: '0', trend: 'neutral' as const },
    { label: 'Active', value: mockUsers.filter((user) => user.status === 'active').length, change: '0', trend: 'neutral' as const },
    { label: 'New This Month', value: 0, change: '0', trend: 'neutral' as const },
    { label: 'Suspended', value: mockUsers.filter((user) => user.status === 'suspended').length, change: '0', trend: 'neutral' as const }
  ];

  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#0066CC]/20 to-[#00A3E0]/20 border border-[#0066CC]/30 shadow-lg shadow-[#0066CC]/10">
            <Users className="w-7 h-7 text-[#00A3E0]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">User Management</h1>
            <p className="text-sm text-gray-400 font-medium">Manage access and roles for QMS users</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => toast.success('Data Exported')}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 backdrop-blur-md rounded-xl h-11"
          >
            <Download className="w-4 h-4 mr-2" />
            Export List
          </Button>
          <Button 
            className="bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white hover:opacity-90 shadow-lg shadow-[#0066CC]/20 rounded-xl h-11 px-6 font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New User
          </Button>
        </div>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="glass-panel rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all group">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 group-hover:text-gray-300 transition-colors">{stat.label}</p>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stat.trend === 'up' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Table */}
      <div className="glass-panel rounded-[2rem] border border-white/5 overflow-hidden backdrop-blur-xl">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02]">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#00A3E0] transition-colors" />
            <input
              type="text"
              placeholder="Search users by name, email, or role..."
              className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#00A3E0]/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="ghost" className="text-gray-400 hover:text-white h-11 px-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/[0.03] border-b border-white/5">
              <tr>
                <th className="text-left text-xs font-black text-gray-500 uppercase tracking-widest px-6 py-5">User Info</th>
                <th className="text-left text-xs font-black text-gray-500 uppercase tracking-widest px-6 py-5">Role & Department</th>
                <th className="text-left text-xs font-black text-gray-500 uppercase tracking-widest px-6 py-5">Plant</th>
                <th className="text-left text-xs font-black text-gray-500 uppercase tracking-widest px-6 py-5">Status</th>
                <th className="text-left text-xs font-black text-gray-500 uppercase tracking-widest px-6 py-5">Last Login</th>
                <th className="text-right text-xs font-black text-gray-500 uppercase tracking-widest px-6 py-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user) => {
                const StatusIcon = statusConfig[user.status].icon;
                return (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group/row">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0066CC]/20 to-[#00A3E0]/20 flex items-center justify-center border border-white/10 group-hover/row:scale-110 transition-transform">
                          <User className="w-5 h-5 text-[#00A3E0]" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white group-hover/row:text-[#00A3E0] transition-colors">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-white font-medium">{user.role}</p>
                        <p className="text-xs text-gray-500">{user.department}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">{user.plant}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${statusConfig[user.status].color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {user.lastLogin}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-all">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UsersPage;
