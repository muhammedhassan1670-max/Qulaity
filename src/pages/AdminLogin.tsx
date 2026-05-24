import { useMemo, useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, Loader2, Zap, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import api from '../services/api';

interface AdminCredentials {
  email: string;
  password: string;
}

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAppStore();

  const [credentials, setCredentials] = useState<AdminCredentials>({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const isAlreadyAdmin = useMemo(() => {
    const permissions: string[] = (user?.permissions as string[]) || [];
    const role = user?.role;
    return (
      permissions.includes('admin.access') ||
      permissions.includes('quality.manage') ||
      role === 'Quality Director' ||
      role === 'Quality Manager'
    );
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!credentials.email.trim()) {
      toast.error('Email is required');
      return;
    }

    if (!credentials.password) {
      toast.error('Password is required');
      return;
    }

    setIsLoading(true);

    try {
      const result = await api.auth.login(credentials.email, credentials.password);

      if (!result?.success) {
        toast.error('Login failed', { description: result?.message || 'Invalid credentials' });
        return;
      }

      const u = result.data.user;
      const permissions: string[] = u.permissions || [];
      const roles: string[] = Array.isArray(u.roles) ? u.roles : [];
      const canAccessAdmin =
        permissions.includes('admin.access') ||
        permissions.includes('quality.manage') ||
        roles.includes('Quality Director') ||
        roles.includes('Quality Manager');

      if (!canAccessAdmin) {
        toast.error('Access denied', { description: 'Your account does not have admin access' });
        return;
      }

      setUser({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email,
        role: roles.length > 0 ? roles[0] : 'user',
        plant: u.plantId,
        permissions,
      });

      toast.success('Admin access granted');
      navigate('/admin', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  if (isAlreadyAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0066CC]/10 via-transparent to-[#00A3E0]/10" />
        <div className="absolute top-24 right-20 w-72 h-72 bg-[#0066CC]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-24 left-16 w-96 h-96 bg-[#00A3E0]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0066CC] to-[#00A3E0] mb-4 shadow-2xl shadow-[#0066CC]/30">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-gray-400">Secure access to system configuration</p>
        </div>

        <div className="glass-panel rounded-2xl p-8 shadow-2xl shadow-black/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-red-500/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Administrator Login</h2>
              <p className="text-xs text-gray-400">Requires admin credentials</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@company.com"
                  className="w-full h-12 pl-11 pr-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3E0] focus:ring-1 focus:ring-[#00A3E0] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter admin password"
                  className="w-full h-12 pl-11 pr-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3E0] focus:ring-1 focus:ring-[#00A3E0] transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
              <AlertCircle className="w-5 h-5 text-gray-300 mt-0.5" />
              <div className="text-sm">
                <p className="text-gray-200 font-medium">Admin login</p>
                <p className="text-gray-400 text-xs">Sign in with your normal account. Access is granted based on permissions.</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white font-semibold rounded-lg hover:from-[#0052a3] hover:to-[#0082b3] focus:outline-none focus:ring-2 focus:ring-[#00A3E0] focus:ring-offset-2 focus:ring-offset-[#0a0a0f] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <button
              type="button"
              className="w-full text-sm text-gray-400 hover:text-white transition-colors"
              onClick={() => navigate('/', { replace: true })}
            >
              Back to platform
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
