import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useConfigStore } from './configStore';
import { purgeAllDemoSimulationData } from '@/services/cleanDemoData';

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: string;
  avatar?: string;
  plant?: string;
  department?: string;
  phone?: string;
  permissions: string[];
}

export interface AppState {
  user: User | null;
  isLoading: boolean;
  theme: 'dark' | 'light';
  language: string;
  sidebarCollapsed: boolean;
  notifications: Notification[];
  isOnline: boolean;
  isLiteMode: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setIsLoading: (loading: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setLanguage: (language: string) => void;
  toggleSidebar: () => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  setOnline: (status: boolean) => void;
  setLiteMode: (isLite: boolean) => void;
  initializeApp: () => Promise<void>;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const mockUser: User = {
  id: 'usr-1',
  name: 'Eng. Mohamed Hassan',
  email: 'mohamed.hassan@qms-industrial.com',
  role: 'admin',
  plant: 'Main Plant - Assembly 01',
  department: 'Quality Leadership',
  phone: '+20 100 123 4567',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
  permissions: [
    'dashboard.view',
    'quality.manage',
    'builder.use',
    'ai.access',
    'digital-twin.view',
    'spc.analyze',
    'iot.manage',
    'executive.view',
    'admin.access',
    '*'
  ]
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      theme: 'dark',
      language: 'en',
      sidebarCollapsed: false,
      notifications: [],
      isOnline: true,
      isLiteMode: false,

      setUser: (user) => set({ user }),

      setIsLoading: (loading) => set({ isLoading: loading }),
      
      setTheme: (theme) => {
        set({ theme });
        if (theme === 'light') {
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
        }
      },
      
      setLanguage: (language) => {
        set({ language });
        // Handle RTL/LTR based on language
        if (language === 'ar') {
          document.documentElement.dir = 'rtl';
          document.documentElement.lang = 'ar';
        } else {
          document.documentElement.dir = 'ltr';
          document.documentElement.lang = 'en';
        }
      },
      
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      
      addNotification: (notification) => set((state) => ({
        notifications: [notification, ...state.notifications].slice(0, 50)
      })),
      
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
      
      setOnline: (status) => set({ isOnline: status }),
      
      setLiteMode: (isLite) => set({ isLiteMode: isLite }),
      
      initializeApp: async () => {
        // Reinitialize config defaults (in case of new updates to persisted store)
        useConfigStore.getState().reinitializeDefaults();

        // Permanently purge any legacy demo or mock simulation data
        purgeAllDemoSimulationData();

        // If already authenticated (rehydrated), don't overwrite user on refresh, but ensure avatar.
        if (get().user) {
          if (!get().user?.avatar) {
            set((state) => ({ user: state.user ? { ...state.user, avatar: mockUser.avatar } : null }));
          }
          set({ isLoading: false });
          return;
        }

        set({ isLoading: true });

        // Initialize config store with default forms if empty
        const configStore = useConfigStore.getState();
        if (configStore.forms.length === 0) {
          configStore.loadDefaultConfigs();
        }
        
        // Simulate API calls and initialization
        await new Promise(resolve => setTimeout(resolve, 1500));

        const useMock = import.meta.env.VITE_USE_MOCK_API === 'true';
        set({
          user: useMock ? mockUser : null,
          isLoading: false,
          notifications: []
        });
      }
    }),
    {
      name: 'qms-enterprise-storage',
      partialize: (state) => ({
        user: state.user,
        theme: state.theme,
        language: state.language,
        sidebarCollapsed: state.sidebarCollapsed,
        isLiteMode: state.isLiteMode
      }),
      onRehydrateStorage: () => (state) => {
        state?.setIsLoading(false);
      }
    }
  )
);
