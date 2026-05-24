// QMS Enterprise 4.0 - Authentication Store
// Zustand store for authentication state management

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  avatar?: string;
  permissions: string[];
  tenant?: {
    id: string;
    name: string;
    code: string;
  };
  plant?: {
    id: string;
    name: string;
    code: string;
  };
  department?: {
    id: string;
    name: string;
  };
  lastLogin?: Date;
  isActive: boolean;
  twoFactorEnabled: boolean;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface AuthState {
  // State
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  updateUser: (data: Partial<AuthUser>) => void;
  clearError: () => void;
  
  // Password reset
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  
  // 2FA
  enable2FA: () => Promise<{ secret: string; qrCode: string } | null>;
  verify2FA: (code: string) => Promise<boolean>;
  disable2FA: (code: string) => Promise<boolean>;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  company: string;
  plant: string;
}

// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

// Mock users for development
const mockUsers: Record<string, { password: string; user: AuthUser }> = {
  'admin@qms.com': {
    password: 'admin123',
    user: {
      id: '1',
      email: 'admin@qms.com',
      firstName: 'System',
      lastName: 'Administrator',
      name: 'System Administrator',
      role: 'admin',
      avatar: undefined,
      permissions: [
        'dashboard.view',
        'quality.manage',
        'builder.use',
        'ai.access',
        'digital-twin.view',
        'spc.analyze',
        'iot.manage',
        'executive.view',
        'admin.access'
      ],
      tenant: { id: '1', name: 'QMS Enterprise', code: 'QMS' },
      plant: { id: '1', name: 'Main Plant', code: 'PLANT-01' },
      isActive: true,
      twoFactorEnabled: false,
      lastLogin: new Date()
    }
  }
};

// Generate local-session tokens
const generateTokens = (): AuthTokens => ({
  accessToken: 'local_access_token_' + Math.random().toString(36).substring(7),
  refreshToken: 'local_refresh_token_' + Math.random().toString(36).substring(7),
  expiresAt: Date.now() + 60 * 60 * 1000 // 1 hour
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login action
      login: async (email: string, password: string, _rememberMe = false) => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check local users when the backend API is unavailable.
          const mockUser = mockUsers[email.toLowerCase()];
          
          if (!mockUser || mockUser.password !== password) {
            set({ 
              isLoading: false, 
              error: 'Invalid email or password',
              isAuthenticated: false 
            });
            toast.error('Login failed', {
              description: 'Invalid email or password'
            });
            return false;
          }

          const tokens = generateTokens();
          
          set({
            user: mockUser.user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          toast.success('Welcome back!', {
            description: `Logged in as ${mockUser.user.name}`
          });

          return true;
        } catch (error) {
          set({ 
            isLoading: false, 
            error: 'Login failed. Please try again.',
            isAuthenticated: false 
          });
          toast.error('Login failed', {
            description: 'An unexpected error occurred'
          });
          return false;
        }
      },

      // Register action
      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check if email already exists
          if (mockUsers[data.email.toLowerCase()]) {
            set({ 
              isLoading: false, 
              error: 'Email already registered' 
            });
            toast.error('Registration failed', {
              description: 'Email already registered'
            });
            return false;
          }

          // Create new user (in production, this would be an API call)
          const newUser: AuthUser = {
            id: Math.random().toString(36).substring(7),
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            name: `${data.firstName} ${data.lastName}`,
            role: 'operator',
            permissions: ['dashboard.view', 'quality.manage'],
            tenant: { id: '1', name: data.company, code: data.company.toUpperCase().slice(0, 3) },
            plant: { id: '1', name: data.plant, code: 'PLT-01' },
            isActive: true,
            twoFactorEnabled: false,
            lastLogin: new Date()
          };

          // Add to local users for the current browser session.
          mockUsers[data.email.toLowerCase()] = {
            password: data.password,
            user: newUser
          };

          set({ isLoading: false });
          toast.success('Account created!', {
            description: 'Please sign in with your new account'
          });
          
          return true;
        } catch (error) {
          set({ 
            isLoading: false, 
            error: 'Registration failed. Please try again.' 
          });
          toast.error('Registration failed');
          return false;
        }
      },

      // Logout action
      logout: () => {
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          error: null
        });
        toast.info('Signed out', {
          description: 'You have been logged out successfully'
        });
      },

      // Refresh token
      refreshToken: async () => {
        const { tokens } = get();
        
        if (!tokens) {
          return false;
        }

        try {
          // Check if token is expired
          if (Date.now() >= tokens.expiresAt) {
            // In production, this would call the refresh endpoint
            const newTokens = generateTokens();
            set({ tokens: newTokens });
          }
          return true;
        } catch (error) {
          get().logout();
          return false;
        }
      },

      // Update user data
      updateUser: (data: Partial<AuthUser>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...data } });
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Forgot password
      forgotPassword: async (email: string) => {
        set({ isLoading: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          if (!mockUsers[email.toLowerCase()]) {
            // Don't reveal if email exists or not (security)
            set({ isLoading: false });
            toast.success('Reset link sent', {
              description: 'Check your email for instructions'
            });
            return true;
          }

          set({ isLoading: false });
          toast.success('Reset link sent', {
            description: 'Check your email for instructions'
          });
          return true;
        } catch (error) {
          set({ isLoading: false });
          toast.error('Failed to send reset link');
          return false;
        }
      },

      // Reset password
      resetPassword: async (_token: string, _newPassword: string) => {
        set({ isLoading: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // In production, validate token and update password
          set({ isLoading: false });
          toast.success('Password reset successful', {
            description: 'Please sign in with your new password'
          });
          return true;
        } catch (error) {
          set({ isLoading: false });
          toast.error('Password reset failed');
          return false;
        }
      },

      // Enable 2FA
      enable2FA: async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Return 2FA setup data
          return {
            secret: 'MOCK2FASECRET123',
            qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
          };
        } catch (error) {
          toast.error('Failed to enable 2FA');
          return null;
        }
      },

      // Verify 2FA
      verify2FA: async (code: string) => {
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Local verification
          if (code === '123456') {
            const { user } = get();
            if (user) {
              set({ user: { ...user, twoFactorEnabled: true } });
            }
            toast.success('2FA enabled successfully');
            return true;
          }
          
          toast.error('Invalid verification code');
          return false;
        } catch (error) {
          toast.error('Verification failed');
          return false;
        }
      },

      // Disable 2FA
      disable2FA: async (code: string) => {
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Local verification
          if (code === '123456') {
            const { user } = get();
            if (user) {
              set({ user: { ...user, twoFactorEnabled: false } });
            }
            toast.success('2FA disabled successfully');
            return true;
          }
          
          toast.error('Invalid verification code');
          return false;
        } catch (error) {
          toast.error('Failed to disable 2FA');
          return false;
        }
      }
    }),
    {
      name: 'qms-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Hook for checking permissions
export function usePermission(permission: string): boolean {
  const { user } = useAuthStore();
  return user?.permissions?.includes(permission) ?? false;
}

// Hook for checking multiple permissions
export function usePermissions(permissions: string[]): { hasAll: boolean; hasAny: boolean } {
  const { user } = useAuthStore();
  const userPermissions = user?.permissions ?? [];
  
  return {
    hasAll: permissions.every(p => userPermissions.includes(p)),
    hasAny: permissions.some(p => userPermissions.includes(p))
  };
}

// Hook for checking role
export function useRole(role: string): boolean {
  const { user } = useAuthStore();
  return user?.role === role;
}

export default useAuthStore;
