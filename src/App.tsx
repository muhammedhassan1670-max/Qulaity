import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ThreeBackground } from './components/3d/ThreeBackground';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { QualityPageAssistant } from './components/QualityPageAssistant';
import { AICopilotWidget } from './components/AICopilotWidget';
import { CommandPalette } from './components/CommandPalette';
import { MobileTabBar } from './components/MobileTabBar';
import { useAppStore } from './stores/appStore';
import { FullPageLoader } from './components/Loading';
import { toast } from 'sonner';
import { useWebSocketAutoConnect, useWebSocketStatus } from './services/websocket';
import { purgeAllDemoSimulationData } from './services/cleanDemoData';

function App() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [performanceMode, setPerformanceMode] = useState<'full' | 'lite' | '2d'>('full');
  const [isLoading, setIsLoading] = useState(true);
  
  const { user, theme, language, initializeApp } = useAppStore();

  // Purge any stale mock/demo seed records automatically on app startup
  useEffect(() => {
    purgeAllDemoSimulationData();
  }, []);

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

  const isFullScreenPage = location.pathname === '/' || location.pathname === '/quality-home' || location.pathname === '/ecosystem';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[var(--bg-primary)] text-white dark' : 'bg-[var(--bg-primary)] text-slate-900 light'}`}>
      {/* 3D Background */}
      <ThreeBackground mode={performanceMode} interactive={activeSection === 'digital-twin'} />
      
      {/* Header */}
      <Header 
        onMenuToggle={() => setSidebarOpen((prev) => !prev)}
        user={user}
      />
      
      {/* Sidebar Drawer */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSectionChange={handleSectionChange}
      />
      
      {/* Main Content with Outlet for nested routes */}
      <main 
        className={`transition-all duration-300 mobile-pb-tabbar ${
          isFullScreenPage
            ? 'pt-[56px] sm:pt-[64px] h-[100dvh] overflow-hidden'
            : 'pt-[62px] sm:pt-[70px] min-h-screen'
        }`}
        style={{ 
          marginLeft: '0px'
        }}
      >
        <div className={isFullScreenPage ? 'p-0 h-full overflow-hidden' : 'p-3 sm:p-4 md:p-6'}>
          {!isFullScreenPage && <QualityPageAssistant />}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className={isFullScreenPage ? 'h-full overflow-hidden' : ''}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileTabBar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
      
      {/* Global AI Copilot & Command Palette */}
      <CommandPalette />
      <AICopilotWidget />

    </div>
  );
}

export default App;
