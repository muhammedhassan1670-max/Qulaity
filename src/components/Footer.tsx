import { Shield, Sparkles, Code2, Award, Cpu, ExternalLink } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';

export function Footer() {
  const { language } = useAppStore();
  const isArabic = language === 'ar';

  return (
    <footer 
      className="w-full mt-10 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md text-slate-400 py-6 px-4 sm:px-6 transition-colors duration-300 relative z-10"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs sm:text-sm">
        {/* Left: Brand & Copyright */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-slate-300">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-bold tracking-tight text-white">
              QMS Enterprise 4.0
            </span>
          </div>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-400 text-xs">
            {isArabic 
              ? '© 2026 منظومة إدارة الجودة الصناعية. جميع الحقوق محفوظة.' 
              : '© 2026 Industrial Quality Management System. All rights reserved.'}
          </span>
        </div>

        {/* Center: Developer Signature with Link to PixoraCo Facebook Page */}
        <a 
          href="https://www.facebook.com/share/1BZWXmCZRm/" 
          target="_blank" 
          rel="noopener noreferrer"
          title="Visit PixoraCo on Facebook"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 shadow-inner group hover:border-cyan-500/50 hover:bg-slate-850 hover:shadow-cyan-500/10 hover:shadow-lg transition-all duration-300 cursor-pointer"
        >
          <Code2 className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
          <span className="text-slate-300 font-medium text-xs sm:text-sm flex items-center gap-1.5">
            {isArabic ? (
              <>
                <span className="text-slate-400">تصميم وتطوير:</span>
                <span className="font-bold bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent group-hover:underline decoration-cyan-400/50">
                  PixoraCo
                </span>
              </>
            ) : (
              <>
                <span className="text-slate-400">Designed & Developed by</span>
                <span className="font-bold bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent group-hover:underline decoration-cyan-400/50">
                  PixoraCo
                </span>
              </>
            )}
            <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors ml-0.5" />
          </span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        </a>

        {/* Right: Architecture & Compliance Tags */}
        <div className="flex items-center gap-3 text-slate-500 text-[11px] sm:text-xs">
          <span className="flex items-center gap-1 hover:text-slate-300 transition-colors">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            AI & Predictive ML
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1 hover:text-slate-300 transition-colors">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            ISO 9001 / IATF 16949
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
