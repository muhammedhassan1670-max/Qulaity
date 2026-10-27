import { useState } from 'react';
import { 
  X, 
  Mic, 
  QrCode, 
  ShieldAlert, 
  CheckCircle2, 
  Box, 
  BarChart2, 
  ArrowUpRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../utils/translations';
import { QRScanner } from './QRScanner';
import { toast } from 'sonner';

interface MobileQuickActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileQuickActionSheet({ isOpen, onClose }: MobileQuickActionSheetProps) {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const [showScanner, setShowScanner] = useState(false);

  if (!isOpen) return null;

  const handleAction = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleScanComplete = (code: string) => {
    setShowScanner(false);
    onClose();
    toast.success(isAr ? `تم مسح الرمز: ${code}` : `Scanned Code: ${code}`);
    navigate(`/quality-search?q=${encodeURIComponent(code)}`);
  };

  const actions = [
    {
      id: 'voice-defect',
      title: isAr ? 'تسجيل عيب بالصوت / الورشة' : 'Voice Defect Entry',
      subtitle: isAr ? 'تسجيل فوري صوتي أو يدوي من صالة الإنتاج' : 'Instant voice or manual shopfloor logging',
      icon: Mic,
      gradient: 'from-sky-500/20 via-blue-500/10 to-transparent',
      borderColor: 'border-sky-500/30',
      iconColor: 'text-sky-400',
      badge: isAr ? 'سريع' : 'Fast',
      badgeColor: 'bg-sky-500/20 text-sky-300',
      onClick: () => handleAction('/quality-shopfloor')
    },
    {
      id: 'qr-scan',
      title: isAr ? 'مسح باركود / QR ذكي' : 'Smart Barcode / QR Scan',
      subtitle: isAr ? 'فحص فوري لقطعة، أمر تشغيل أو رول خام' : 'Scan part, work order or raw material',
      icon: QrCode,
      gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      badge: isAr ? 'كاميرا' : 'Camera',
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
      onClick: () => setShowScanner(true)
    },
    {
      id: 'ncr',
      title: isAr ? 'تقرير عدم مطابقة NCR' : 'Instant Non-Conformance',
      subtitle: isAr ? 'توثيق حالة حيود أو عيب حرج مع تصعيد سريع' : 'Document defect with immediate escalation',
      icon: ShieldAlert,
      gradient: 'from-rose-500/20 via-red-500/10 to-transparent',
      borderColor: 'border-rose-500/30',
      iconColor: 'text-rose-400',
      badge: isAr ? 'عاجل' : 'Alert',
      badgeColor: 'bg-rose-500/20 text-rose-300',
      onClick: () => handleAction('/ncr')
    },
    {
      id: 'inspection',
      title: isAr ? 'فحص جودة استلام وتشغيل' : 'Quality Inspection',
      subtitle: isAr ? 'فحص عينات وارد ومطابقة خطة الفحص' : 'Incoming & in-process sample check',
      icon: CheckCircle2,
      gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
      borderColor: 'border-amber-500/30',
      iconColor: 'text-amber-400',
      badge: isAr ? 'فحص' : 'Check',
      badgeColor: 'bg-amber-500/20 text-amber-300',
      onClick: () => handleAction('/inspection')
    },
    {
      id: 'digital-twin',
      title: isAr ? 'التوأم الرقمي 3D للمصنع' : '3D Factory Digital Twin',
      subtitle: isAr ? 'عرض تفاعلي مباشر لخطوط الإنتاج والماكينات' : 'Live interactive 3D shopfloor view',
      icon: Box,
      gradient: 'from-cyan-500/20 via-indigo-500/10 to-transparent',
      borderColor: 'border-cyan-500/30',
      iconColor: 'text-cyan-400',
      badge: '3D WebGL',
      badgeColor: 'bg-cyan-500/20 text-cyan-300',
      onClick: () => handleAction('/quality-control-tower')
    },
    {
      id: 'kpis',
      title: isAr ? 'لوحة المؤشرات والتحليلات' : 'Executive Quality KPIs',
      subtitle: isAr ? 'متابعة DPMO، تكاليف الجودة وتوزيع باريتو' : 'Monitor DPMO, Cost of Quality & Pareto',
      icon: BarChart2,
      gradient: 'from-purple-500/20 via-fuchsia-500/10 to-transparent',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-400',
      badge: isAr ? 'بيانات' : 'Metrics',
      badgeColor: 'bg-purple-500/20 text-purple-300',
      onClick: () => handleAction('/quality-dashboard')
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-md transition-opacity duration-300 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modern Bottom Sheet */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-[120] max-h-[90vh] overflow-y-auto bg-slate-950/95 backdrop-blur-2xl border-t border-white/15 rounded-t-[32px] p-5 pb-safe shadow-[0_-20px_60px_rgba(0,0,0,0.9)] animate-slideUp"
        style={{ overscrollBehavior: 'contain' }}
      >
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-white/25 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-teal-400 flex items-center justify-center shadow-lg shadow-sky-500/30">
              <Zap className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-1.5">
                {isAr ? 'إجراءات الجودة السريعة' : 'Quick Quality Actions'}
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h2>
              <p className="text-xs text-gray-400 font-medium">
                {isAr ? 'اختر الإجراء المباشر الذي تريده' : 'Select an instant operation to launch'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-gray-400 hover:text-white transition-colors active:scale-90"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 gap-2.5 mb-2">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={act.onClick}
                className={`w-full text-start p-3.5 rounded-2xl bg-gradient-to-r ${act.gradient} border ${act.borderColor} hover:bg-white/10 active:scale-[0.98] transition-all duration-200 flex items-center gap-3.5 group`}
              >
                <div className={`w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-sm ${act.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-sm font-black text-white truncate group-hover:text-sky-300 transition-colors">
                      {act.title}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${act.badgeColor}`}>
                      {act.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {act.subtitle}
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Built-in Scanner Modal */}
      {showScanner && (
        <QRScanner 
          onScan={handleScanComplete}
          onClose={() => setShowScanner(false)}
          title={isAr ? 'مسح باركود / QR الجودة' : 'Scan Quality QR / Barcode'}
          hint={isAr ? 'وجّه الكاميرا نحو الباركود أو الـ QR' : 'Point camera at barcode or QR code'}
        />
      )}
    </>
  );
}
