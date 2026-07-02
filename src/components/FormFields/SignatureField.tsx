import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Check } from 'lucide-react';
import type { FieldComponentProps } from './types';

export const SignatureField: React.FC<FieldComponentProps> = ({
  field,
  value,
  onChange,
  error,
  disabled,
  required
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!value);
  const [savedSignature, setSavedSignature] = useState<string | null>(typeof value === 'string' ? value : null);
  
  // Set up canvas context and event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || savedSignature) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Resize handling to keep resolution sharp
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = 200; // Fixed height for signature pad
    }
  }, [savedSignature]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled || savedSignature) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled || savedSignature) return;
    e.preventDefault(); // Prevent scrolling on touch devices
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.closePath();
    }
    setIsDrawing(false);
  };

  const handleClear = () => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    setHasSignature(false);
    setSavedSignature(null);
    onChange(null);
  };

  const handleSave = () => {
    if (disabled || !hasSignature) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      setSavedSignature(dataUrl);
      onChange(dataUrl);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-white">
          {field.label} {required && <span className="text-red-500">*</span>}
        </label>
        {field.helpText && <span className="text-xs text-white/50">{field.helpText}</span>}
      </div>

      <div className={`relative rounded-xl border overflow-hidden bg-white ${error ? 'border-red-500' : 'border-white/20'}`}>
        {savedSignature ? (
          <div className="relative w-full h-[200px] flex items-center justify-center bg-white p-4">
            {/* Background watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <span className="text-4xl font-black text-black transform -rotate-12">DIGITALLY SIGNED</span>
            </div>
            <img src={savedSignature} alt="Signature" className="max-h-full max-w-full object-contain mix-blend-multiply" />
            {!disabled && (
              <div className="absolute top-2 right-2 flex gap-2">
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleClear}
                  className="shadow-lg"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>
            )}
            <div className="absolute bottom-2 left-2 flex gap-2 items-center text-xs font-mono text-gray-500 bg-gray-100/80 px-2 py-1 rounded">
              <Check className="w-3 h-3 text-emerald-500" />
              Signed & Encrypted
            </div>
          </div>
        ) : (
          <div className="relative w-full h-[200px]">
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {/* Signature line guide */}
            <div className="absolute bottom-[20%] left-[10%] right-[10%] h-[1px] bg-gray-300 pointer-events-none" />
            <div className="absolute bottom-[20%] left-[10%] transform translate-y-full pt-1 text-gray-400 text-xs italic pointer-events-none">
              Sign here {required ? '(Required)' : ''}
            </div>
            
            {!disabled && (
              <div className="absolute top-2 right-2 flex gap-2">
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleClear}
                  disabled={!hasSignature}
                  className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={handleSave}
                  disabled={!hasSignature}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Lock Signature
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
};
