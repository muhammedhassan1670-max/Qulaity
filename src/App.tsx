import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ThreeBackground } from './components/3d/ThreeBackground';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { QualityPageAssistant } from './components/QualityPageAssistant';
import { MobileTabBar } from './components/MobileTabBar';
import { useAppStore } from './stores/appStore';
import { FullPageLoader } from './components/Loading';
import { toast } from 'sonner';
import { useWebSocketAutoConnect, useWebSocketStatus } from './services/websocket';

function App() {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [performanceMode, setPerformanceMode] = useState<'full' | 'lite' | '2d'>('full');
  const [isLoading, setIsLoading] = useState(true);
  
  const { user, theme, language, initializeApp } = useAppStore();

  // Real-time WebSocket connection with auto-reconnect.
  useWebSocketAutoConnect();
  const _wsStatus = useWebSocketStatus(); // available for status indicator if needed
  void _wsStatus; // suppress unused warning

  // Sync theme and language classes/attributes
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }

    // Apply RTL for Arabic, LTR for English
    if (language === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    }
  }, [theme, language]);

  // Handle window resize for sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get active section from URL
  const getActiveSectionFromPath = () => {
    const path = location.pathname.slice(1); // Remove leading slash
    if (!path) return 'dashboard';
    return path.split('/')[0];
  };

  const activeSection = getActiveSectionFromPath();

  // Detect device performance
  useEffect(() => {
    const detectPerformance = () => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        setPerformanceMode('2d');
        return;
      }
      
      const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        
        // Check for low-power devices
        if (renderer.includes('Intel') && !renderer.includes('Arc')) {
          setPerformanceMode('lite');
        } else if (renderer.includes('Software') || renderer.includes('SwiftShader')) {
          setPerformanceMode('2d');
        }
      }
      
      // Check memory
      if ('deviceMemory' in navigator) {
        const memory = (navigator as any).deviceMemory;
        if (memory && memory < 4) {
          setPerformanceMode('lite');
        }
      }
    };

    detectPerformance();
  }, []);

  // Initialize app
  useEffect(() => {
    const init = async () => {
      try {
        await initializeApp();
        setIsLoading(false);
        toast.success('QMS Enterprise 4.0 Initialized', {
          description: 'Welcome to the Immersive Industrial Operating System'
        });
      } catch (error) {
        toast.error('Initialization Error', {
          description: 'Failed to initialize the application'
        });
        setIsLoading(false);
      }
    };

    init();
  }, [initializeApp]);

  const handleSectionChange = (section: string) => {
    void section;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return <FullPageLoader message="Initializing QMS Enterprise 4.0..." submessage="Industrial Operating System" />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[var(--bg-primary)] text-white dark' : 'bg-[var(--bg-primary)] text-slate-900 light'}`}>
      {/* 3D Background */}
      <ThreeBackground mode={performanceMode} interactive={activeSection === 'digital-twin'} />
      
      {/* Header */}
      <Header 
        onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
      />
      
      {/* Sidebar */}
      <Sidebar
        onSectionChange={handleSectionChange}
        collapsed={sidebarCollapsed}
      />
      
      {/* Main Content with Outlet for nested routes */}
      <main 
        className="transition-all duration-300 mobile-pb-tabbar"
        style={{ 
          marginLeft: window.innerWidth < 1024 ? '0' : (sidebarCollapsed ? '80px' : '280px'),
          marginTop: '70px',
          minHeight: 'calc(100vh - 70px)'
        }}
      >
        <div className="p-4 md:p-6">
          <QualityPageAssistant />
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileTabBar onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      {/* Performance Mode Indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="glass-panel px-3 py-2 flex items-center gap-2 text-xs">
          <span className="text-gray-400">3D Mode:</span>
          <select 
            value={performanceMode}
            onChange={(e) => setPerformanceMode(e.target.value as 'full' | 'lite' | '2d')}
            className="bg-transparent border-none text-[#00A3E0] cursor-pointer outline-none"
          >
            <option value="full">Full 3D</option>
            <option value="lite">3D Lite</option>
            <option value="2d">2D Mode</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default App;
