import React, { useRef, useState, useEffect } from "react";
import { Eraser, Check, FileSignature } from "lucide-react";

export default function SignaturePad({ onSave, className = "" }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e293b";
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    setHasSigned(true);
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e && e.cancelable) e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleSave = () => {
    if (!hasSigned) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    if (onSave) onSave(dataUrl);
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileSignature size={18} className="text-blue-600" />
          <h4 className="font-bold text-sm text-slate-800">Customer Digital Signature</h4>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={clearCanvas}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            <Eraser size={14} /> Clear
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasSigned}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            <Check size={14} /> Save Signature
          </button>
        </div>
      </div>

      <div className="relative rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={450}
          height={160}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-40 touch-none cursor-crosshair"
        />
        {!hasSigned && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs">
            Sign here with mouse or touch screen
          </div>
        )}
      </div>
    </div>
  );
}
