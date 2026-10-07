import React, { useState } from 'react';
import {
  Flame,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Crosshair,
  Smartphone,
  Copy,
  Check,
  Download,
  Eye,
  AlertTriangle,
  RotateCcw,
  Film
} from 'lucide-react';
import { ImageItem } from '../types';

interface ImageCardProps {
  item: ImageItem;
  onOpenFocalModal: (item: ImageItem) => void;
  onOpenMockupModal: (item: ImageItem) => void;
  onDownloadSingle: (item: ImageItem, ratioId?: string) => void;
  onAnimateVeo?: (item: ImageItem) => void;
  onRetrySingle?: (item: ImageItem) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  item,
  onOpenFocalModal,
  onOpenMockupModal,
  onDownloadSingle,
  onAnimateVeo,
  onRetrySingle,
}) => {
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [selectedOutputIndex, setSelectedOutputIndex] = useState(0);

  const handleCopyCaption = () => {
    const textToCopy = [
      item.captionId || item.captionEn,
      item.hashtags?.length ? '\n\n' + item.hashtags.join(' ') : '',
    ].join('');

    navigator.clipboard.writeText(textToCopy);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  // Determine score color badge
  const getScoreBadge = (score: number) => {
    if (score >= 85) {
      return {
        bg: 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-amber-500/20 shadow-md',
        label: `🔥 ${score}/100 Super Viral`,
      };
    }
    if (score >= 70) {
      return {
        bg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
        label: `⭐ ${score}/100 Potensi Tinggi`,
      };
    }
    if (score >= 55) {
      return {
        bg: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
        label: `👍 ${score}/100 Standar`,
      };
    }
    return {
      bg: 'bg-slate-700 text-slate-300',
      label: `${score}/100 Rendah`,
    };
  };

  const scoreBadge = getScoreBadge(item.viralScore);
  const currentOutput = item.outputs?.[selectedOutputIndex] || null;
  const displayImageSrc = currentOutput ? currentOutput.dataUrl : item.origUrl;

  return (
    <div
      className={`bg-slate-900 rounded-2xl border flex flex-col overflow-hidden transition-all duration-200 group ${
        item.status === 'filtered'
          ? 'border-red-500/40 bg-red-950/10'
          : item.status === 'duplicate'
          ? 'border-amber-500/30 opacity-70'
          : item.viralScore >= 80 && item.status === 'done'
          ? 'border-emerald-500/40 hover:border-emerald-500/80 shadow-lg shadow-emerald-500/5'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Media Container */}
      <div className="relative aspect-[4/5] bg-slate-950 overflow-hidden flex items-center justify-center">
        {displayImageSrc ? (
          <img
            src={displayImageSrc}
            alt={item.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-slate-600 text-xs">Tidak ada preview</div>
        )}

        {/* Status Overlays */}
        {item.status === 'analyzing' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 p-4 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            <span className="text-xs font-semibold text-purple-300">Menganalisis Gemini...</span>
            <span className="text-[10px] text-slate-400">Menghitung skor viral &amp; titik fokus</span>
          </div>
        )}

        {item.status === 'enhancing' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 p-4 text-center">
            <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
            <span className="text-xs font-semibold text-purple-300">✨ Enhancing AI Studio...</span>
            <span className="text-[10px] text-slate-400">Meningkatkan ketajaman detail</span>
          </div>
        )}

        {item.status === 'rendering' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 p-4 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <span className="text-xs font-semibold text-blue-300">Merender Multi-Rasio...</span>
          </div>
        )}

        {item.status === 'filtered' && (
          <div className="absolute inset-0 bg-red-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-2 p-4 text-center">
            <ShieldAlert className="w-10 h-10 text-red-400" />
            <span className="text-xs font-bold text-red-200">Disaring &amp; Ditolak</span>
            <span className="text-[11px] text-red-300/90">{item.reason || 'Melanggar standar FB'}</span>
          </div>
        )}

        {item.status === 'duplicate' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-2 p-4 text-center">
            <RotateCcw className="w-8 h-8 text-amber-400" />
            <span className="text-xs font-bold text-amber-200">Foto Serupa (Duplikat)</span>
            <span className="text-[11px] text-slate-400">Dilewati untuk menghemat kuota</span>
          </div>
        )}

        {item.status === 'error' && (
          <div className="absolute inset-0 bg-rose-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-2 p-4 text-center z-20">
            <AlertTriangle className="w-8 h-8 text-rose-400" />
            <span className="text-xs font-bold text-rose-200">Gagal Memproses</span>
            <span className="text-[10px] text-rose-300 leading-tight">
              {item.statusMessage || item.reason || 'Batas kuota Free Tier tercapai sesaat'}
            </span>
            {onRetrySingle && (
              <button
                type="button"
                onClick={() => onRetrySingle(item)}
                className="mt-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Coba Lagi</span>
              </button>
            )}
          </div>
        )}

        {/* Badges on Top */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10">
          {item.status === 'done' && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${scoreBadge.bg}`}>
              {scoreBadge.label}
            </span>
          )}
          {item.isAiEnhanced && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/30 text-purple-200 border border-purple-500/40 backdrop-blur-sm flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> AI Enhanced
            </span>
          )}
        </div>

        {/* Safety Indicator Badge */}
        {item.status === 'done' && (
          <div className="absolute top-2 right-2 z-10">
            {item.safe ? (
              <span
                className="p-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-sm block"
                title="Lolos Standar Komunitas FB"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
            ) : (
              <span
                className="p-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 backdrop-blur-sm block"
                title={`Pelanggaran: ${item.flag}`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        )}

        {/* Quick Preview & Adjust Floating Buttons */}
        {item.status === 'done' && (
          <div className="absolute bottom-2 inset-x-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-950/80 backdrop-blur-md rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => onOpenFocalModal(item)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 text-[10px] font-semibold text-slate-200 transition"
              title="Atur Titik Fokus Subjek (Smart Crop)"
            >
              <Crosshair className="w-3 h-3 text-blue-400" />
              <span>Titik Fokus</span>
            </button>

            <button
              onClick={() => onOpenMockupModal(item)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 text-[10px] font-semibold text-slate-200 transition"
              title="Simulator Feed Facebook Mobile"
            >
              <Smartphone className="w-3 h-3 text-indigo-400" />
              <span>Mockup FB</span>
            </button>
          </div>
        )}
      </div>

      {/* Info & Outputs Content */}
      <div className="p-3 flex-1 flex flex-col justify-between gap-2.5 text-xs">
        <div>
          {/* Filename & Category */}
          <div className="flex items-center justify-between gap-1">
            <span className="font-semibold text-slate-200 truncate font-mono text-[11px]" title={item.name}>
              {item.name}
            </span>
            {item.category && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0 font-medium">
                {item.category}
              </span>
            )}
          </div>

          {/* AI Reason Review */}
          {item.reason && item.status !== 'filtered' && (
            <p className="text-[10px] text-slate-400 italic mt-1 line-clamp-2 leading-relaxed">
              &ldquo;{item.reason}&rdquo;
            </p>
          )}

          {/* Multi-Ratio Output Tabs */}
          {item.outputs && item.outputs.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-slate-800">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Hasil Rasio:
              </span>
              <div className="flex flex-wrap gap-1">
                {item.outputs.map((out, idx) => (
                  <button
                    key={out.ratioId}
                    onClick={() => setSelectedOutputIndex(idx)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                      selectedOutputIndex === idx
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {out.ratioLabel}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Caption & Actions Footer */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          {/* Viral Caption Preview */}
          {(item.captionId || item.captionEn) && (
            <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/60">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="font-semibold text-purple-300">AI Viral Caption:</span>
                <button
                  onClick={handleCopyCaption}
                  className="flex items-center gap-1 text-slate-400 hover:text-purple-300 transition"
                  title="Salin caption dan hashtags"
                >
                  {copiedCaption ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-300 line-clamp-2 font-sans leading-relaxed">
                {item.captionId || item.captionEn}
              </p>
            </div>
          )}

          {/* Bottom Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onOpenMockupModal(item)}
              className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] flex items-center justify-center gap-1 transition"
            >
              <Smartphone className="w-3 h-3 text-indigo-400" />
              <span>Simulasi</span>
            </button>

            {onAnimateVeo && (
              <button
                onClick={() => onAnimateVeo(item)}
                className="py-1.5 px-2.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/50 hover:border-emerald-400 font-semibold text-[11px] flex items-center justify-center gap-1 transition shadow-sm cursor-pointer"
                title="Buka AI Visual & Scene Studio (100% Free Tier - Pollinations & Gemini)"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>AI Visual</span>
              </button>
            )}

            {item.outputs && item.outputs.length > 0 && (
              <button
                onClick={() => onDownloadSingle(item, currentOutput?.ratioId)}
                className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] flex items-center justify-center gap-1 shadow-md shadow-blue-600/20 transition"
                title="Download foto terpilih"
              >
                <Download className="w-3 h-3" />
                <span>Simpan</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
