import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Trash2, X, Pencil, RotateCcw } from 'lucide-react';

interface ScratchpadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScratchpadModal: React.FC<ScratchpadModalProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#2563eb');
  const [brushSize, setBrushSize] = useState(3);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions based on client size
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw grid lines like school notebook
        drawGrid(ctx, canvas.width, canvas.height);
      }
    }
  }, [isOpen]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineWidth = tool === 'eraser' ? brushSize * 4 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden border-4 border-amber-300 animate-in fade-in zoom-in-95 duration-150">
        {/* Header bar */}
        <div className="bg-amber-400 px-4 py-3 flex items-center justify-between text-amber-950">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📝</span>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">Bảng Nháp Toán Học</h3>
              <p className="text-xs text-amber-900/80 font-medium">Đặt tính rồi tính, vẽ hình tự do thoải mái</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-amber-500 transition-colors text-amber-950 cursor-pointer"
            title="Đóng bảng nháp"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tools bar */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          {/* Pen / Eraser toggle */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-amber-200">
            <button
              onClick={() => setTool('pen')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                tool === 'pen' ? 'bg-amber-400 text-amber-950 shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" /> Bút viết
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                tool === 'eraser' ? 'bg-amber-400 text-amber-950 shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" /> Tẩy xóa
            </button>
          </div>

          {/* Color palette */}
          {tool === 'pen' && (
            <div className="flex items-center gap-1.5">
              {[
                { hex: '#2563eb', label: 'Xanh dương' },
                { hex: '#dc2626', label: 'Đỏ' },
                { hex: '#16a34a', label: 'Xanh lá' },
                { hex: '#1e293b', label: 'Đen chì' },
                { hex: '#d97706', label: 'Cam' },
              ].map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setColor(c.hex)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                    color === c.hex ? 'scale-125 border-slate-900 shadow-sm' : 'border-white hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
          )}

          {/* Clear action */}
          <button
            onClick={clearCanvas}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-200 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Xóa sạch nháp
          </button>
        </div>

        {/* Canvas Area */}
        <div className="relative w-full h-[320px] sm:h-[380px] bg-white cursor-crosshair touch-none select-none">
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-4 py-2 text-center text-xs text-slate-500 border-t border-slate-200 flex justify-between items-center">
          <span>💡 Vẽ nháp không làm mất bài thi đang làm</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
          >
            Xong, quay lại làm bài
          </button>
        </div>
      </div>
    </div>
  );
};
