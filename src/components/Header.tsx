import React from 'react';
import { Sparkles, Image as ImageIcon, ShieldCheck, Flame, FolderPlus, HelpCircle, Film } from 'lucide-react';

interface HeaderProps {
  onLoadSamples: () => void;
  isLoadingSamples: boolean;
  totalImages: number;
  onOpenHelp: () => void;
  onOpenVeoAnimate: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadSamples,
  isLoadingSamples,
  totalImages,
  onOpenHelp,
  onOpenVeoAnimate,
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-xl">
            FB
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                FB Page Batch Resizer <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Pro</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                v2.5 AI Studio
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
              <span>Smart Subject Crop</span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3 h-3" /> Safe Filter
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-amber-400">
                <Flame className="w-3 h-3" /> Viral Score
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Sparkles className="w-3 h-3" /> AI Visual (Free)
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end w-full md:w-auto">
          <button
            onClick={onOpenVeoAnimate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition cursor-pointer"
            title="Buka AI Visual & Scene Studio (100% Free Tier - Gemini 3.8 Flash & Pollinations)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Visual Studio (Free)</span>
          </button>

          <button
            onClick={onLoadSamples}
            disabled={isLoadingSamples}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition disabled:opacity-50"
            title="Load high-res demo photos to test features"
          >
            <FolderPlus className="w-3.5 h-3.5 text-blue-400" />
            <span>{isLoadingSamples ? 'Memuat Demo...' : 'Load Sample Pack'}</span>
          </button>

          <button
            onClick={onOpenHelp}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Panduan & Tips Optimal Facebook Page"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
