import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { Loader2 } from 'lucide-react';
import { getFirstPermittedRoute } from '../services/userService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRole?: string;
  fallback?: React.ReactNode;
}

type AppStorePersistApi = {
  hasHydrated?: () => boolean;
  onFinishHydration?: (listener: () => void) => () => void;
};

const getAppStorePersist = () => (
  useAppStore as unknown as { persist?: AppStorePersistApi }
).persist;

function useAppStoreHydrated(): boolean {
  const [hasHydrated, setHasHydrated] = React.useState(() => getAppStorePersist()?.hasHydrated?.() ?? true);

  React.useEffect(() => {
    const persist = getAppStorePersist();
    const unsubscribe = persist?.onFinishHydration?.(() => setHasHydrated(true));
    setHasHydrated(persist?.hasHydrated?.() ?? true);
    return () => unsubscribe?.();
  }, []);

  return hasHydrated;
}

function hasPersistedAppUser(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem('qms-enterprise-storage');
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { state?: { user?: unknown } } | null;
    return Boolean(parsed?.state?.user);
  } catch {
    return false;
  }
}

/**
 * QMS Enterprise 4.0 - Protected Route Component
 * Standard hook-safe implementation for React 19
 */
export function ProtectedRoute({ 
  children, 
  requiredPermissions = [],
  requiredRole,
  fallback 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAppStore();
  const location = useLocation();
  const hasHydrated = useAppStoreHydrated();
  const hasAccessToken = typeof window !== 'undefined' && !!localStorage.getItem('qms_access_token');
  const waitingForPersistedUser = hasAccessToken && hasPersistedAppUser() && !user;

  if (!hasHydrated || isLoading || waitingForPersistedUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#00A3E0] mx-auto mb-4" />
          <p className="text-gray-400">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!user || !hasAccessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAdmin = user.role === 'admin' || user.permissions?.includes('*') || user.permissions?.includes('admin.access');

  if (requiredRole && user.role !== requiredRole && !isAdmin) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="glass-panel rounded-2xl p-8 text-center max-w-md border border-white/10 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 mx-auto mb-4 flex items-center justify-center font-bold text-xl">
            🔒
          </div>
          <h2 className="text-xl font-bold text-white mb-2">غير مصرح بالدخول / Access Restricted</h2>
          <p className="text-gray-400 text-sm mb-6">
            هذه الشاشة تتطلب دور ({requiredRole}). دورك الحالي: ({user.role}).
          </p>
          <button 
            onClick={() => window.location.href = getFirstPermittedRoute(user)} 
            className="px-5 py-2.5 bg-[#0066CC] hover:bg-[#0055b3] text-white font-bold rounded-xl text-sm transition-colors"
          >
            العودة للقسم المصرح به / Return to Permitted Area
          </button>
        </div>
      </div>
    );
  }

  if (requiredPermissions.length > 0 && !isAdmin) {
    const hasClearance = requiredPermissions.some(p => user.permissions?.includes(p));
    if (!hasClearance) {
      if (fallback) return <>{fallback}</>;
      return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-8 text-center max-w-md border border-white/10 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto mb-4 flex items-center justify-center font-bold text-xl">
              🛡️
            </div>
            <h2 className="text-xl font-bold text-white mb-2">صلاحية محجوبة / Permission Required</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              حسابك الحالي لا يمتلك الصلاحية المطلوبة لفتح هذا القسم. يُرجى مراجعة مسؤول إدارة النظام إذا كنت بحاجة للوصول.
            </p>
            <button 
              onClick={() => window.location.href = getFirstPermittedRoute(user)} 
              className="px-5 py-2.5 bg-gradient-to-r from-[#0066CC] to-[#00A3E0] text-white font-bold rounded-xl text-sm transition-all hover:scale-105"
            >
              الذهاب للقسم المصرح لك به / Go to Permitted Area
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAppStore();
  const location = useLocation();
  const hasHydrated = useAppStoreHydrated();
  const hasAccessToken = typeof window !== 'undefined' && !!localStorage.getItem('qms_access_token');
  const waitingForPersistedUser = hasAccessToken && hasPersistedAppUser() && !user;
  const from = (location.state as any)?.from?.pathname || '/';

  if (!hasHydrated || isLoading || waitingForPersistedUser) return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]"><Loader2 className="animate-spin text-blue-500" /></div>;
  if (user) return <Navigate to={from} replace />;
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>;
}

export default ProtectedRoute;
