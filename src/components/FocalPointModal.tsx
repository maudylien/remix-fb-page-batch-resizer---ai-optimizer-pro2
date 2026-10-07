import React, { useState, useRef, useEffect } from 'react';
import { X, Crosshair, Check, Eye, RefreshCw, Smartphone } from 'lucide-react';
import { ImageItem, FocalPoint, FitMode, BlurBackgroundMode, WatermarkConfig, StudioFilterConfig } from '../types';
import { renderImageToCanvas } from '../utils/imageEngine';

interface FocalPointModalProps {
  item: ImageItem | null;
  onClose: () => void;
  onSaveFocus: (itemId: string, newFocus: FocalPoint) => void;
  fitMode: FitMode;
  bgMode: BlurBackgroundMode;
  watermark: WatermarkConfig;
  filters: StudioFilterConfig;
}

export const FocalPointModal: React.FC<FocalPointModalProps> = ({
  item,
  onClose,
  onSaveFocus,
  fitMode,
  bgMode,
  watermark,
  filters,
}) => {
  if (!item) return null;

  const [focus, setFocus] = useState<FocalPoint>(item.userAdjustedFocus || item.focus || { x: 0.5, y: 0.5 });
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [previewRatio, setPreviewRatio] = useState<'4x5' | '1x1' | '9x16'>('4x5');
  const imageRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Render live preview on canvas whenever focus or ratio changes
  useEffect(() => {
    if (!item.bitmap || !previewCanvasRef.current) return;

    let targetW = 1080;
    let targetH = 1350; // 4:5 default
    if (previewRatio === '1x1') {
      targetW = 1080;
      targetH = 1080;
    } else if (previewRatio === '9x16') {
      targetW = 1080;
      targetH = 1920;
    }

    const srcBitmap = item.enhancedBitmap || item.bitmap;
    const rendered = renderImageToCanvas(srcBitmap, {
      width: targetW,
      height: targetH,
      fitMode,
      bgMode,
      focus,
      watermark,
      filters,
    });

    const canvas = previewCanvasRef.current;
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, targetW, targetH);
      ctx.drawImage(rendered, 0, 0);
    }
  }, [item, focus, previewRatio, fitMode, bgMode, watermark, filters]);

  // Handle click on the original image to set focal coordinates
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const normX = Math.max(0, Math.min(1, clickX / rect.width));
    const normY = Math.max(0, Math.min(1, clickY / rect.height));

    setFocus({ x: Number(normX.toFixed(3)), y: Number(normY.toFixed(3)) });
  };

  const handleSave = () => {
    onSaveFocus(item.id, focus);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400">
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Smart Crop &amp; Focal Point Tuner</h3>
              <p className="text-[11px] text-slate-400">
                Klik bagian penting (wajah/produk) agar tidak terpotong saat resize ke 4:5 atau 1:1.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
          {/* Left Column: Interactive Original Image */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">Foto Asli (Klik untuk memindahkan target):</span>
              <span className="font-mono text-[11px] text-blue-400">
                X: {(focus.x * 100).toFixed(0)}% | Y: {(focus.y * 100).toFixed(0)}%
              </span>
            </div>

            <div
              onClick={handleImageClick}
              className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 cursor-crosshair group flex items-center justify-center"
              style={{ minHeight: '320px' }}
            >
              <img
                ref={imageRef}
                src={item.origUrl}
                alt={item.name}
                className="max-h-[380px] w-auto object-contain select-none pointer-events-none"
              />

              {/* Target Reticle Indicator */}
              <div
                className="absolute w-8 h-8 -ml-4 -mt-4 pointer-events-none transition-all duration-75 flex items-center justify-center"
                style={{
                  left: `${focus.x * 100}%`,
                  top: `${focus.y * 100}%`,
                }}
              >
                <div className="w-8 h-8 rounded-full border-2 border-amber-400 bg-amber-400/25 animate-ping absolute" />
                <div className="w-6 h-6 rounded-full border-2 border-amber-400 bg-amber-500/40 flex items-center justify-center shadow-lg shadow-black/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>

              {/* Helper text on hover */}
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/70 backdrop-blur-sm text-[10px] text-slate-300 pointer-events-none">
                🎯 Klik di mana saja untuk menetapkan fokus
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <button
                type="button"
                onClick={() => setFocus(item.focus || { x: 0.5, y: 0.5 })}
                className="flex items-center gap-1 text-slate-400 hover:text-blue-300 transition"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset ke Deteksi AI Otomatis</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Crop Preview */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">Hasil Crop Real-Time:</span>
              <div className="flex items-center gap-1">
                {(['4x5', '1x1', '9x16'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setPreviewRatio(r)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                      previewRatio === r
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center p-2 min-h-[320px]">
              <canvas
                ref={previewCanvasRef}
                className="max-h-[380px] w-auto object-contain rounded shadow-lg"
              />

              {/* Safe Zone Simulation Overlay */}
              {showSafeZone && (
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 bg-gradient-to-b from-black/40 via-transparent to-black/60">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500/80 border border-white/50" />
                    <div className="h-2.5 w-24 bg-white/60 rounded" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 w-3/4 bg-white/70 rounded" />
                    <div className="h-2 w-1/2 bg-white/50 rounded" />
                    <div className="text-[10px] text-amber-300 font-bold mt-1">
                      ⚠️ Area teks &amp; tombol FB feed
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSafeZone}
                  onChange={(e) => setShowSafeZone(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-0"
                />
                <span>Tampilkan Simulasi Safe-Zone FB</span>
              </label>
              <span className="text-[10px] text-slate-500">
                Mode: {fitMode === 'cover' ? 'Smart Cover' : 'Contain'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition"
          >
            <Check className="w-4 h-4" />
            <span>Terapkan Titik Fokus</span>
          </button>
        </div>
      </div>
    </div>
  );
};
