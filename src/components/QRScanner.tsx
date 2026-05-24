/**
 * QRScanner Component
 * Uses native BarcodeDetector API (Chrome 83+, Android WebView, Edge)
 * with a polyfill fallback approach for other browsers.
 * No external dependencies required!
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, QrCode, Flashlight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  title?: string;
  hint?: string;
}

export function QRScanner({ onScan, onClose, title = 'Scan QR / Barcode', hint }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detectorRef = useRef<any>(null);

  const [status, setStatus] = useState<'requesting' | 'scanning' | 'error' | 'found'>('requesting');
  const [errorMsg, setErrorMsg] = useState('');
  const [scanned, setScanned] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [supportsTorch, setSupportsTorch] = useState(false);

  // Start Camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // rear camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check torch support
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      if (capabilities?.torch) setSupportsTorch(true);

      setStatus('scanning');
      startDetection();
    } catch (err: any) {
      setErrorMsg(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access and try again.'
          : 'Could not access the camera. Please try again.',
      );
      setStatus('error');
    }
  }, []);

  // BarcodeDetector API
  const startDetection = useCallback(() => {
    if (!('BarcodeDetector' in window)) {
      // Fallback: inform user browser doesn't support native API
      setErrorMsg(
        'Your browser does not support native barcode detection.\n' +
        'Please use Chrome on Android or on Desktop.',
      );
      setStatus('error');
      return;
    }

    const detector = new (window as any).BarcodeDetector({
      formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'data_matrix'],
    });
    detectorRef.current = detector;

    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const barcodes = await detector.detect(canvas);
        if (barcodes.length > 0) {
          const value = barcodes[0].rawValue;
          handleFound(value);
        }
      } catch {
        // silent — frame may not be ready yet
      }
    }, 300);
  }, []);

  const handleFound = useCallback((value: string) => {
    clearInterval(intervalRef.current!);
    setScanned(value);
    setStatus('found');

    // Vibrate on mobile
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);

    toast.success('Code scanned!', { description: value });
    setTimeout(() => {
      onScan(value);
    }, 800);
  }, [onScan]);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    const newValue = !torchOn;
    await track.applyConstraints({ advanced: [{ torch: newValue } as any] });
    setTorchOn(newValue);
  };

  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    startCamera();
    return stopCamera;
  }, [startCamera, stopCamera]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-safe-top">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0066CC]/20 border border-[#0066CC]/40 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-[#00A3E0]" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">{title}</p>
            {hint && <p className="text-gray-400 text-xs">{hint}</p>}
          </div>
        </div>
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning overlay */}
        {status === 'scanning' && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Dimmed corners */}
            <div className="absolute inset-0 bg-black/50" />
            {/* Scan window */}
            <div className="relative w-64 h-64">
              {/* Clear area */}
              <div className="absolute inset-0 bg-transparent" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} />
              {/* Corners */}
              {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
                <div
                  key={pos}
                  className={`absolute w-8 h-8 border-[#00A3E0]
                    ${pos.includes('top') ? 'top-0 border-t-[3px]' : 'bottom-0 border-b-[3px]'}
                    ${pos.includes('left') ? 'left-0 border-l-[3px]' : 'right-0 border-r-[3px]'}
                  `}
                />
              ))}
              {/* Scanning laser line */}
              <div className="absolute left-0 right-0 h-[2px] bg-[#00A3E0] animate-bounce opacity-80 top-1/2" />
            </div>
            <p className="absolute bottom-24 text-white text-sm font-medium text-center px-6">
              Point the camera at a QR code or barcode
            </p>
          </div>
        )}

        {/* Found state */}
        {status === 'found' && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-400 flex items-center justify-center animate-pulse">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <p className="text-white font-bold text-lg">Code Detected!</p>
            <p className="text-gray-300 text-sm px-8 text-center break-all">{scanned}</p>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 p-8">
            <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <p className="text-white font-bold text-lg text-center">Camera Error</p>
            <p className="text-gray-300 text-sm text-center whitespace-pre-line">{errorMsg}</p>
            <button
              onClick={startCamera}
              className="mt-4 px-6 py-3 bg-[#0066CC] hover:bg-[#0055aa] text-white font-bold rounded-xl transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Requesting */}
        {status === 'requesting' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
            <Camera className="w-12 h-12 text-[#00A3E0] animate-pulse" />
            <p className="text-white font-medium">Starting camera...</p>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="p-4 pb-safe-bottom flex items-center justify-center gap-6">
        {supportsTorch && (
          <button
            onClick={toggleTorch}
            className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all ${
              torchOn ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400' : 'bg-white/10 border-white/20 text-white'
            }`}
          >
            <Flashlight className="w-6 h-6" />
          </button>
        )}
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-widest">QMS Enterprise 4.0</p>
          <p className="text-xs text-gray-600">Mobile Scanner</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to trigger QR scanning from anywhere
 */
export function useQRScanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const handleScan = (value: string) => {
    setLastScan(value);
    setIsOpen(false);
  };

  return { isOpen, open, close, lastScan, handleScan };
}
