// QMS Enterprise 4.0 - Authentication Pages
// Professional login, register, and password reset components

import { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Building2, 
  ArrowRight,
  Zap,
  Shield,
  Factory,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../stores/appStore';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

// Types
interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
  tenantCode: string;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  company: string;
  plant: string;
  tenantCode: string;
  acceptTerms: boolean;
}

// Validation
const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('One number');
  if (!/[!@#$%^&*]/.test(password)) errors.push('One special character');
  return { valid: errors.length === 0, errors };
};

// Login Page Component
export function LoginPage() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false,
    tenantCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  
  const { setUser } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const p = location.pathname;
    if (p === '/register') setActiveTab('register');
    else if (p === '/forgot-password') setActiveTab('forgot');
    else setActiveTab('login');
  }, [location.pathname]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(credentials.email)) {
      toast.error('Invalid email format');
      return;
    }
    
    if (credentials.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await api.auth.login(
        credentials.email,
        credentials.password,
        credentials.tenantCode.trim() || undefined
      );

      if (!result?.success) {
        throw new Error(result?.message || 'Login failed');
      }

      const u = result.data.user;
      setUser({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email,
        role: Array.isArray(u.roles) && u.roles.length > 0 ? u.roles[0] : 'user',
        plant: u.plantId,
        permissions: u.permissions || [],
      });
      
      // Success
      toast.success('Welcome back!', {
        description: 'Successfully logged in to QMS Enterprise 4.0'
      });
      
      // Navigate to dashboard
      navigate('/', { replace: true });
    } catch (error) {
      toast.error('Login failed', {
        description: 'Invalid email or password'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      {/* 3D Background Effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--industrial-primary)]/10 via-transparent to-[var(--industrial-secondary)]/10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-[var(--industrial-primary)]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[var(--industrial-secondary)]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-[var(--industrial-primary)]/5 via-transparent to-transparent" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--industrial-primary)] to-[var(--industrial-secondary)] mb-4 shadow-2xl shadow-[var(--industrial-primary)]/30">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">QMS Enterprise</h1>
          <p className="text-[var(--text-muted)]">4.0 Industrial Operating System</p>
        </div>

        {/* Auth Card */}
        <div className="glass-panel rounded-2xl p-8 shadow-2xl shadow-black/50">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-lg">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'login'
                  ? 'bg-[var(--industrial-primary)] text-white shadow-lg shadow-[var(--industrial-primary)]/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'register'
                  ? 'bg-[var(--industrial-primary)] text-white shadow-lg shadow-[var(--industrial-primary)]/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Register
            </button>
          </div>

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={credentials.email}
                    onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                    placeholder="Enter your email"
                    className="w-full h-12 pl-11 pr-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3E0] focus:ring-1 focus:ring-[#00A3E0] transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    placeholder="Enter your password"
                    className="w-full h-12 pl-11 pr-12 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3E0] focus:ring-1 focus:ring-[#00A3E0] transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Organization code <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={credentials.tenantCode}
                    onChange={(e) => setCredentials({ ...credentials, tenantCode: e.target.value })}
                    placeholder="e.g. QMS"
                    className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3E0] focus:ring-1 focus:ring-[#00A3E0] transition-all"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Use your tenant code if your account belongs to a specific organization.</p>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={credentials.rememberMe}
                    onChange={(e) => setCredentials({ ...credentials, rememberMe: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-[var(--industrial-primary)] focus:ring-[var(--industrial-secondary)]"
                  />
                  <span className="text-sm text-gray-400">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTab('forgot')}
                  className="text-sm text-[var(--industrial-secondary)] hover:text-[var(--industrial-primary)] transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-[var(--industrial-primary)] to-[var(--industrial-secondary)] text-white font-semibold rounded-lg hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[var(--industrial-secondary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && <RegisterForm onSwitchToLogin={() => setActiveTab('login')} />}

          {/* Forgot Password Form */}
          {activeTab === 'forgot' && <ForgotPasswordForm onSwitchToLogin={() => setActiveTab('login')} />}

          {/* Social Login */}
          {activeTab === 'login' && (
            <div className="mt-6">
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#16161f] text-gray-500">Or continue with</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="flex items-center justify-center gap-2 h-11 px-4 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 transition-colors"
                  type="button"
                  onClick={() => toast.info('Google sign-in', { description: 'OAuth integration coming soon' })}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </button>
                <button
                  className="flex items-center justify-center gap-2 h-11 px-4 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 transition-colors"
                  type="button"
                  onClick={() => toast.info('GitHub sign-in', { description: 'OAuth integration coming soon' })}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
                  </svg>
                  GitHub
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <Factory className="w-4 h-4" />
              <span>ISO 27001 Certified</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-600">
            © 2024 QMS Enterprise. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

// Register Form Component
function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [data, setData] = useState<RegisterData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    plant: '',
    tenantCode: import.meta.env.VITE_DEFAULT_TENANT_CODE || 'QMS',
    acceptTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      if (!data.firstName || !data.lastName || !data.email) {
        toast.error('Please fill all required fields');
        return;
      }
      if (!validateEmail(data.email)) {
        toast.error('Invalid email format');
        return;
      }
      setStep(2);
      return;
    }

    // Step 2 validation
    const passwordCheck = validatePassword(data.password);
    if (!passwordCheck.valid) {
      toast.error('Password does not meet requirements');
      return;
    }
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!data.acceptTerms) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    setIsLoading(true);
    
    try {
      await api.auth.register({
        email: data.email.trim(),
        password: data.password,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        tenantCode: data.tenantCode.trim() || undefined,
      });
      toast.success('Account created successfully!', {
        description: 'Sign in with your email and password.',
      });
      setStep(1);
      onSwitchToLogin();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Registration failed';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {step === 1 ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                First Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={data.firstName}
                  onChange={(e) => setData({ ...data, firstName: e.target.value })}
                  placeholder="John"
                  className="w-full h-12 pl-11 pr-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3E0] transition-all"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Last Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={data.lastName}
                  onChange={(e) => setData({ ...data, lastName: e.target.value })}
                  placeholder="Doe"
                  className="w-full h-12 pl-11 pr-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3E0] transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                placeholder="john.doe@company.com"
                className="w-full h-12 pl-11 pr-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3E0] transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Company
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={data.company}
                onChange={(e) => setData({ ...data, company: e.target.value })}
                placeholder="Your company name"
                className="w-full h-12 pl-11 pr-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3E0] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Organization code *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={data.tenantCode}
                onChange={(e) => setData({ ...data, tenantCode: e.target.value })}
                placeholder="QMS"
                className="w-full h-12 pl-11 pr-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3E0] transition-all"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Must match an active tenant in the system.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Plant Location
            </label>
            <div className="relative">
              <Factory className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={data.plant}
                onChange={(e) => setData({ ...data, plant: e.target.value })}
                placeholder="Enter plant/site name"
                className="w-full h-12 pl-11 pr-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3E0] transition-all"
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={data.password}
                onChange={(e) => setData({ ...data, password: e.target.value })}
                placeholder="Create a strong password"
                className="w-full h-12 pl-11 pr-12 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3E0] transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Password Requirements */}
            <div className="mt-3 space-y-1">
              {[
                { check: data.password.length >= 8, label: 'At least 8 characters' },
                { check: /[A-Z]/.test(data.password), label: 'One uppercase letter' },
                { check: /[a-z]/.test(data.password), label: 'One lowercase letter' },
                { check: /[0-9]/.test(data.password), label: 'One number' },
                { check: /[!@#$%^&*]/.test(data.password), label: 'One special character' }
              ].map((req, i) => (
                <div key={i} className={`flex items-center gap-2 text-xs ${req.check ? 'text-green-400' : 'text-gray-500'}`}>
                  {req.check ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-gray-500" />}
                  {req.label}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={data.confirmPassword}
                onChange={(e) => setData({ ...data, confirmPassword: e.target.value })}
                placeholder="Confirm your password"
                className="w-full h-12 pl-11 pr-12 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3E0] transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {data.confirmPassword && data.password !== data.confirmPassword && (
              <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Passwords do not match
              </p>
            )}
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.acceptTerms}
              onChange={(e) => setData({ ...data, acceptTerms: e.target.checked })}
              className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-[var(--industrial-primary)] focus:ring-[var(--industrial-secondary)]"
            />
            <span className="text-sm text-gray-400">
              I agree to the{' '}
              <button
                type="button"
                className="text-[var(--industrial-secondary)] hover:underline"
                onClick={() => toast.info('Terms of Service', { description: 'Terms page coming soon' })}
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                type="button"
                className="text-[var(--industrial-secondary)] hover:underline"
                onClick={() => toast.info('Privacy Policy', { description: 'Privacy page coming soon' })}
              >
                Privacy Policy
              </button>
            </span>
          </label>
        </>
      )}

      <div className="flex gap-3">
        {step === 2 && (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex-1 h-12 bg-white/5 border border-white/10 text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
          >
            Back
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 h-12 bg-gradient-to-r from-[var(--industrial-primary)] to-[var(--industrial-secondary)] text-white font-semibold rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating account...
            </>
          ) : step === 1 ? (
            <>
              Continue
              <ArrowRight className="w-5 h-5" />
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </div>

      {/* Step Indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-colors ${
              step >= s ? 'bg-[#00A3E0]' : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </form>
  );
}

// Forgot Password Form Component
function ForgotPasswordForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      toast.error('Invalid email format');
      return;
    }

    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSent(true);
      toast.success('Reset link sent!', {
        description: 'Check your email for instructions'
      });
    } catch (error) {
      toast.error('Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Check your email</h3>
        <p className="text-gray-400 mb-6">
          We've sent a password reset link to<br />
          <span className="text-[#00A3E0]">{email}</span>
        </p>
        <button
          onClick={onSwitchToLogin}
          className="text-[#00A3E0] hover:underline"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">Reset Password</h3>
        <p className="text-sm text-gray-400">
          Enter your email and we'll send you a link to reset your password
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full h-12 pl-11 pr-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[var(--industrial-secondary)] transition-all"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 bg-gradient-to-r from-[var(--industrial-primary)] to-[var(--industrial-secondary)] text-white font-semibold rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Sending...
          </>
        ) : (
          'Send Reset Link'
        )}
      </button>

      <button
        type="button"
        onClick={onSwitchToLogin}
        className="w-full h-12 bg-white/5 border border-white/10 text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
      >
        Back to sign in
      </button>
    </form>
  );
}

export default LoginPage;
