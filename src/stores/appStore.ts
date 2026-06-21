import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useConfigStore } from './configStore';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  plant?: string;
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
  id: '1',
  name: 'System Administrator',
  email: 'admin@qms.com',
  role: 'admin',
  plant: 'Main Plant',
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

        // Seed default local records for offline/Vercel demonstration
        if (typeof localStorage !== 'undefined' && !localStorage.getItem('qms_local_seeded')) {
          localStorage.setItem('qms_local_defect-logs', JSON.stringify([
            {
              id: "DEF-2026-0001",
              date: "2026-06-21",
              shift: "Morning",
              productionLine: "Assembly Line A",
              partId: "PART-001",
              partNumber: "PN-100-200",
              recordType: "process-ppm",
              defectType: "Paint Scratch",
              quantity: 5,
              severity: "Medium",
              description: "Minor paint scratch detected on dashboard panel after curing.",
              operatorName: "Ahmed Ali",
              actionTaken: "Reworked and repainted.",
              status: "logged",
              relatedNcrIds: ["NCR-2026-1001"]
            }
          ]));
          localStorage.setItem('qms_local_ncrs', JSON.stringify([
            {
              id: "NCR-2026-1001",
              title: "Welding cracks detected on chassis",
              description: "Multiple welding cracks detected on chassis during final line check. Possibly caused by incorrect temperature setting in welding robot.",
              status: "open",
              priority: "critical",
              createdDate: "2026-06-21",
              dueDate: "2026-06-28",
              assignedTo: "Sayed Mahmoud",
              department: "Welding Department",
              source: "Defect Log",
              defectType: "Welding Crack",
              productionLine: "Welding Line B",
              partNumber: "PN-CHASSIS-01",
              supplierName: "Global Steel Co",
              relatedDefectIds: ["DEF-2026-0001"],
              relatedCapaIds: ["CAPA-2026-2001"],
              relatedEightDIds: ["8D-2026-3001"]
            }
          ]));
          localStorage.setItem('qms_local_capas', JSON.stringify([
            {
              id: "CAPA-2026-2001",
              title: "Welding Temperature Parameter Optimization",
              description: "Perform comprehensive temperature audit on welding robots and define strict range limit guidelines.",
              status: "open",
              priority: "high",
              createdDate: "2026-06-21",
              targetDate: "2026-07-05",
              assignedTo: "Kareem Hassan",
              department: "Engineering",
              source: "NCR-2026-1001",
              relatedNcrIds: ["NCR-2026-1001"],
              relatedEightDIds: ["8D-2026-3001"]
            }
          ]));
          localStorage.setItem('qms_local_8ds', JSON.stringify([
            {
              id: "8D-2026-3001",
              subject: "Chassis Welding Crack Analysis",
              description: "Investigate and document root cause for the structural welding cracks detected on Batch B12.",
              status: "open",
              priority: "high",
              createdDate: "2026-06-21",
              targetDate: "2026-07-15",
              assignedTo: "Welding Quality Team",
              ncrReportId: "NCR-2026-1001",
              relatedNcrIds: ["NCR-2026-1001"],
              relatedCapaIds: ["CAPA-2026-2001"]
            }
          ]));
          localStorage.setItem('qms_local_inspections', JSON.stringify([
            {
              id: "INSP-2026-4001",
              title: "Incoming Inspection - Steel Plates Batch A10",
              description: "Thickness and tensile strength verification for steel plates.",
              status: "failed",
              result: "fail",
              createdDate: "2026-06-21",
              inspector: "Mostafa Omar",
              supplierId: "SUP-STEEL",
              supplierName: "Global Steel Co",
              partId: "PART-002",
              partNumber: "PN-STEEL-002",
              relatedNcrIds: ["NCR-2026-1001"]
            }
          ]));
          localStorage.setItem('qms_local_complaints', JSON.stringify([
            {
              id: "COMP-2026-5001",
              title: "Dashboard squeaking noise reported",
              description: "Customer complained about persistent squeaking noise from the dashboard panel under hot conditions.",
              status: "open",
              createdDate: "2026-06-21",
              customerName: "Cairo Auto Dealership",
              product: "Dashboard Assembly v2",
              severity: "high",
              relatedDefectIds: ["DEF-2026-0001"]
            }
          ]));
          localStorage.setItem('qms_local_control-plans', JSON.stringify([
            {
              id: "CP-2026-6001",
              title: "Welding Line Parameter Control Plan",
              description: "Control plan detailing inspection frequencies, temperature ranges, and operator checks for welding robots.",
              status: "active",
              createdDate: "2026-06-21",
              department: "Welding",
              relatedNcrIds: ["NCR-2026-1001"],
              relatedCapaIds: ["CAPA-2026-2001"]
            }
          ]));
          localStorage.setItem('qms_local_seeded', 'true');
        }

        // If already authenticated (rehydrated), don't overwrite user on refresh.
        if (get().user) {
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
