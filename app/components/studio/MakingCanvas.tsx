"use client";
import { Label } from '@/components/ui/label';
import React, { useRef, useState, useEffect, useCallback } from 'react'; 
import { Brush, Eraser, Loader2, Undo2, Redo2 } from 'lucide-react'; // 
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { 
    Tooltip, 
    TooltipContent, 
    TooltipProvider, 
    TooltipTrigger 
} from '@/components/ui/tooltip'; 

// --- MASKE BOYUT VE AYARLARI ---
const BRUSH_COLOR = 'rgba(255, 255, 255, 1)'; 
const MASK_COLOR = 'rgba(0, 0, 0, 1)';      
const INITIAL_BRUSH_SIZE = 20;

interface MaskingCanvasProps {
  imageUrl: string | null;
  onMaskComplete: (maskDataUrl: string | null) => void;
  isProcessing: boolean;
}

export default function MaskingCanvas({ imageUrl, onMaskComplete, isProcessing }: MaskingCanvasProps) {

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [brushSize, setBrushSize] = useState(INITIAL_BRUSH_SIZE);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // -----------------------------------------------------------
  // YENİDEN YÜKLEME VE İLK DURUMU AYARLAMA (imageUrl değiştiğinde)
  // -----------------------------------------------------------
  useEffect(() => {
    if (!imageUrl) return; // Hook'un kendisi koşulsuz çağrıldı, içerik koşullu

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;
    setCtx(context);

    const img = new Image();
    img.crossOrigin = 'Anonymous'; 
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      context.fillStyle = MASK_COLOR;
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      const initialDataUrl = canvas.toDataURL('image/png');
      
      // Geçmişi temizle ve yeni durumu ayarla
      setHistory([initialDataUrl]);
      setHistoryIndex(0);
      onMaskComplete(initialDataUrl);
    };
    img.src = imageUrl;
  }, [imageUrl, onMaskComplete]);


  // --- TARİHÇE (UNDO/REDO) YÖNETİMİ ---
  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const newHistory = history.slice(0, historyIndex + 1);
    const newState = canvas.toDataURL('image/png');
    
    // Performans için sadece son 20 adımı tut
    if (newHistory.length > 20) {
        newHistory.shift();
    }
    
    setHistory([...newHistory, newState]);
    setHistoryIndex(newHistory.length);
    onMaskComplete(newState);
  }, [history, historyIndex, onMaskComplete]);

  const undo = useCallback(() => {
    if (historyIndex > 0 && ctx) { // ctx kontrolü eklendi
      setHistoryIndex(historyIndex - 1);
      const prevData = history[historyIndex - 1];
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0); // ctx kullanıldı
      img.src = prevData;
      onMaskComplete(prevData);
    }
  }, [historyIndex, history, ctx, onMaskComplete]);
  
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1 && ctx) { // ctx kontrolü eklendi
      setHistoryIndex(historyIndex + 1);
      const nextData = history[historyIndex + 1];
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0); // ctx kullanıldı
      img.src = nextData;
      onMaskComplete(nextData);
    }
  }, [historyIndex, history, ctx, onMaskComplete]);

  // --- YARDIMCI FONKSİYONLAR ---
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = e.currentTarget.width / rect.width;
    const scaleY = e.currentTarget.height / rect.height;
    return {
      offsetX: (e.clientX - rect.left) * scaleX,
      offsetY: (e.clientY - rect.top) * scaleY,
    };
  };

  const getTouchPos = (e: React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      offsetX: (touch.clientX - rect.left) * scaleX,
      offsetY: (touch.clientY - rect.top) * scaleY,
    };
  };

  // --- ÇİZİM İŞLEMLERİ ---
  
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isProcessing) return;

    // TypeScript hatasını önlemek için type assertion kullanıldı
    const { offsetX, offsetY } = 'touches' in e 
      ? getTouchPos(e, canvasRef.current!) 
      : getMousePos(e as React.MouseEvent<HTMLCanvasElement>);
    
    if (ctx) {
      ctx.beginPath();
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = tool === 'brush' ? BRUSH_COLOR : MASK_COLOR;
      
      ctx.globalCompositeOperation = tool === 'brush' ? 'source-over' : 'destination-out'; 
      
      ctx.moveTo(offsetX, offsetY); 
      setIsDrawing(true);
    }
  }, [ctx, brushSize, tool, isProcessing]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isProcessing) return;

    const { offsetX, offsetY } = 'touches' in e 
      ? getTouchPos(e, canvasRef.current!) 
      : getMousePos(e as React.MouseEvent<HTMLCanvasElement>);

    if (ctx) {
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
    }
  }, [isDrawing, ctx, isProcessing]);

  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      saveState(); // Çizim bitince geçmişe kaydet
    }
  }, [isDrawing, saveState]);

  // --- ETKİNLİK YÖNETİMİ ---
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // Canvas elementi yoksa erken dön

    // Mouse ve Touch olaylarını bağlama
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);

    return () => {
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
      canvas.removeEventListener('touchend', stopDrawing);
      canvas.removeEventListener('touchcancel', stopDrawing);
    };
  }, [stopDrawing]);

  // --- KOŞULLU DÖNÜŞ (Görsel yoksa) ---
  if (!imageUrl) return null;


  // --- JSX (Görsel İçeriği) ---

  return (
    <div className="flex flex-col gap-4">
        <Label className="text-sm font-medium">
            3. Tedavi Alanını Boyayın (Maske)
            <span className="text-xs text-muted-foreground ml-2">
                {tool === 'brush' ? 'Dişlerin üzerine fırçalayın' : 'Hatalı alanları silin'}
            </span>
        </Label>
        
        {/* Kontrol Alanı */}
        <div className="flex items-center  gap-3 bg-secondary p-3 rounded-lg border border-secondary-foreground/5">
            <TooltipProvider>
                {/* Fırça Butonu */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                            variant={tool === 'brush' ? 'default' : 'secondary'} 
                            size="icon" 
                            onClick={() => setTool('brush')}
                            disabled={isProcessing}
                        >
                            <Brush className="w-4 h-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Fırça (Boyama)</TooltipContent>
                </Tooltip>
                
                {/* Silgi Butonu */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                            variant={tool === 'eraser' ? 'default' : 'secondary'} 
                            size="icon" 
                            onClick={() => setTool('eraser')}
                            disabled={isProcessing}
                        >
                            <Eraser className="w-4 h-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Silgi (Temizleme)</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {/* Fırça Boyutu Ayarı */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-[50px]  text-right">Boyut:</span>
                <Slider 
                    value={[brushSize]} 
                    onValueChange={(val) => setBrushSize(val[0])} 
                    min={5} 
                    max={50} 
                    step={1} 
                    className="w-10 cursor-pointer"
                    disabled={isProcessing}
                />
            </div>
            
            {/* Undo / Redo Butonları */}
            <div className='flex-1 flex justify-end '>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="secondary" size="icon" onClick={undo} disabled={historyIndex <= 0 || isProcessing}>
                                <Undo2 className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Geri Al</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="secondary" size="icon" onClick={redo} disabled={historyIndex >= history.length - 1 || isProcessing}>
                                <Redo2 className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Yinele</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>

        {/* Maske Çizim Alanı (Görselin Üzerine Canvas) */}
        <div 
            className="relative w-full h-auto rounded-xl border-2 border-border shadow-inner overflow-hidden flex items-center justify-center bg-black"
            // Orijinal görseli arka plan olarak göster (Canvas'ın altında)
            style={{ 
                backgroundImage: `url(${imageUrl})`, 
                backgroundSize: 'contain', 
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                // Dikkat: Canvas'ın yüklenmesini bekleyerek aspectRatio'yu ayarlıyoruz
                aspectRatio: canvasRef.current ? canvasRef.current.width / canvasRef.current.height : undefined,
            }}
        >
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onTouchStart={startDrawing}
                onTouchMove={(e) => { e.preventDefault(); draw(e); }} // Mobil kaydırmayı engelle
                className={cn(
                    "absolute inset-0 cursor-crosshair mix-blend-screen",
                    isDrawing ? 'opacity-100' : 'opacity-70', 
                    isProcessing && 'opacity-30 cursor-wait pointer-events-none'
                )} 
                style={{ 
                    width: '100%', 
                    height: '100%',
                    filter: 'grayscale(100%) invert(100%)' 
                }} 
            />
            
            {/* Yükleniyor Göstergesi */}
            {isProcessing && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-10 text-white">
                    <Loader2 className="w-8 h-8 animate-spin mb-3" />
                    <span className="text-sm font-medium">Maskeleniyor...</span>
                </div>
            )}
        </div>
    </div>
  );
}