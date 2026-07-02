import { useState, useRef, useEffect, useCallback } from 'react';
import { Scan, XCircle, CheckCircle2, ShieldAlert, Cpu, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AIVisionResult {
  defectType: string;
  confidence: number;
  evidenceImage: string; // Base64 data URL
}

interface AIVisionScannerProps {
  onScanComplete: (result: AIVisionResult) => void;
  onCancel: () => void;
}

export function AIVisionScanner({ onScanComplete, onCancel }: AIVisionScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanStage, setScanStage] = useState<'idle' | 'analyzing' | 'detected'>('idle');
  const [cameraError, setCameraError] = useState<string>('');
  
  // Start camera on mount
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    async function setupCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }, 
          audio: false 
        });
        setStream(mediaStream);
        activeStream = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        setCameraError(err.message || 'Could not access camera. Please check permissions.');
      }
    }
    
    setupCamera();
    
    return () => {
      // Cleanup stream on unmount
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const triggerScan = useCallback(() => {
    if (scanStage !== 'idle' || !videoRef.current || !canvasRef.current) return;
    
    setScanStage('analyzing');
    
    // Simulate AI Processing time
    setTimeout(() => {
      setScanStage('detected');
      
      // Capture the frame
      const video = videoRef.current!;
      const canvas = canvasRef.current!;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Draw a simulated bounding box directly onto the evidence image
        ctx.strokeStyle = '#ef4444'; // Red-500
        ctx.lineWidth = 6;
        const boxWidth = canvas.width * 0.4;
        const boxHeight = canvas.height * 0.4;
        const startX = (canvas.width - boxWidth) / 2;
        const startY = (canvas.height - boxHeight) / 2;
        ctx.strokeRect(startX, startY, boxWidth, boxHeight);
        
        // Draw label background
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(startX, startY - 40, 300, 40);
        
        // Draw label text
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.fillText('Scratch - 98.4%', startX + 10, startY - 12);
        
        const evidenceBase64 = canvas.toDataURL('image/jpeg', 0.8);
        
        setTimeout(() => {
           onScanComplete({
             defectType: 'Scratch',
             confidence: 98.4,
             evidenceImage: evidenceBase64
           });
           
           // Stop camera
           if (stream) {
             stream.getTracks().forEach(t => t.stop());
           }
        }, 2000);
      }
    }, 2500);
  }, [scanStage, stream, onScanComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-[#00A3E0]/30 bg-gray-900 shadow-2xl">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center gap-2 text-[#00A3E0] font-black uppercase tracking-widest">
            <Cpu className="w-5 h-5" />
            AI Vision Auto-Detect
          </div>
          <button 
            onClick={() => {
              if (stream) stream.getTracks().forEach(t => t.stop());
              onCancel();
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Video Container */}
        <div className="relative aspect-[4/3] w-full bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="text-center text-red-400 p-6">
              <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-bold">{cameraError}</p>
            </div>
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* UI Overlays */}
              <div className="absolute inset-0 z-10 pointer-events-none">
                {/* Rule of thirds grid */}
                <div className="absolute w-full h-full border-t border-b border-white/10 flex flex-col justify-evenly">
                  <div className="w-full h-[1px] bg-white/10"></div>
                  <div className="w-full h-[1px] bg-white/10"></div>
                </div>
                <div className="absolute w-full h-full border-l border-r border-white/10 flex justify-evenly">
                  <div className="w-[1px] h-full bg-white/10"></div>
                  <div className="w-[1px] h-full bg-white/10"></div>
                </div>

                {/* Scanning Animation */}
                {scanStage === 'analyzing' && (
                  <motion.div 
                    initial={{ top: '0%' }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-1 bg-[#00A3E0] shadow-[0_0_15px_#00A3E0]"
                  />
                )}

                {/* Bounding Box HUD */}
                <AnimatePresence>
                  {scanStage === 'detected' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 1.2 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="relative w-[40%] h-[40%] border-4 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                         <div className="absolute -top-10 left-[-4px] bg-red-500 text-white font-bold px-3 py-1 text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Scratch (98.4%)
                         </div>
                         {/* Corner brackets */}
                         <div className="absolute -top-2 -left-2 w-4 h-4 border-t-4 border-l-4 border-red-500"></div>
                         <div className="absolute -top-2 -right-2 w-4 h-4 border-t-4 border-r-4 border-red-500"></div>
                         <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-4 border-l-4 border-red-500"></div>
                         <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-4 border-r-4 border-red-500"></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </>
          )}
        </div>

        {/* Footer Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-center p-6 bg-gradient-to-t from-black/90 to-transparent">
           {!cameraError && (
             <button
                onClick={triggerScan}
                disabled={scanStage !== 'idle'}
                className={`relative flex items-center justify-center w-20 h-20 rounded-full border-4 transition-all duration-300 ${
                  scanStage === 'idle' 
                    ? 'border-white bg-white/20 hover:bg-white/40' 
                    : scanStage === 'analyzing'
                      ? 'border-[#00A3E0] bg-[#00A3E0]/20 animate-pulse'
                      : 'border-red-500 bg-red-500/20'
                }`}
             >
                {scanStage === 'idle' ? (
                  <Scan className="w-8 h-8 text-white" />
                ) : scanStage === 'analyzing' ? (
                  <Loader2 className="w-8 h-8 text-[#00A3E0] animate-spin" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 text-red-500" />
                )}
             </button>
           )}
        </div>
        
      </div>
    </div>
  );
}
