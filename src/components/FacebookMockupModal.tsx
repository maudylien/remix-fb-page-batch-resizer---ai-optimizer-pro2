import React, { useState } from 'react';
import {
  X,
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Globe,
  BadgeCheck,
  Heart,
  Copy,
  Check,
  Download,
  Flame,
  Smartphone
} from 'lucide-react';
import { ImageItem } from '../types';

interface FacebookMockupModalProps {
  item: ImageItem | null;
  onClose: () => void;
  pageName?: string;
}

export const FacebookMockupModal: React.FC<FacebookMockupModalProps> = ({
  item,
  onClose,
  pageName = 'Viral Trend Page Official',
}) => {
  if (!item) return null;

  const [activeLang, setActiveLang] = useState<'id' | 'en'>(item.captionId ? 'id' : 'en');
  const [copied, setCopied] = useState(false);
  const [likesCount, setLikesCount] = useState(1482);
  const [hasLiked, setHasLiked] = useState(false);

  // Pick 4:5 output if available, else first output or origUrl
  const out4x5 = item.outputs?.find((o) => o.ratioLabel === '4x5');
  const displayUrl = out4x5 ? out4x5.dataUrl : item.outputs?.[0]?.dataUrl || item.origUrl;

  const currentCaption = activeLang === 'id' ? (item.captionId || item.captionEn) : (item.captionEn || item.captionId);
  const hasCaption = Boolean(currentCaption || (item.hashtags && item.hashtags.length > 0));
  const fullPostText = `${currentCaption}\n\n${item.hashtags?.join(' ') || ''}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullPostText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleLike = () => {
    if (hasLiked) {
      setLikesCount((prev) => prev - 1);
      setHasLiked(false);
    } else {
      setLikesCount((prev) => prev + 1);
      setHasLiked(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Facebook Mobile Feed Simulator</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Tabs & Copy Action */}
        {hasCaption ? (
          <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Bahasa Caption:</span>
              {item.captionId && (
                <button
                  onClick={() => setActiveLang('id')}
                  className={`px-2 py-0.5 rounded-md font-semibold transition ${
                    activeLang === 'id' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  🇮🇩 Indonesia
                </button>
              )}
              {item.captionEn && (
                <button
                  onClick={() => setActiveLang('en')}
                  className={`px-2 py-0.5 rounded-md font-semibold transition ${
                    activeLang === 'en' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  🇺🇸 English
                </button>
              )}
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Caption</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="text-[11px] italic text-slate-400">AI Auto-Caption dinonaktifkan (Post tanpa teks caption)</span>
            <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded font-mono">Hanya Gambar</span>
          </div>
        )}

        {/* Facebook Phone Shell Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex justify-center bg-slate-950">
          <div className="w-full max-w-[420px] bg-[#242526] text-[#e4e6eb] rounded-2xl border border-slate-700/60 shadow-2xl overflow-hidden font-sans">
            {/* FB Post Header */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Page Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-sm shadow">
                  FP
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[13px] text-white hover:underline cursor-pointer">
                      {pageName}
                    </span>
                    <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/20" />
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#b0b3b8]">
                    <span>Baru saja</span>
                    <span>•</span>
                    <Globe className="w-3 h-3" />
                  </div>
                </div>
              </div>
              <button className="text-[#b0b3b8] hover:text-white p-1">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Post Caption Body */}
            {hasCaption && (
              <div className="px-3.5 pb-3 text-[13px] leading-relaxed whitespace-pre-line text-[#e4e6eb]">
                {currentCaption}
                {item.hashtags && item.hashtags.length > 0 && (
                  <div className="text-blue-400 font-medium mt-2">
                    {item.hashtags.join(' ')}
                  </div>
                )}
              </div>
            )}

            {/* Processed Feed Photo (4:5 / 1:1) */}
            <div className="relative bg-black w-full overflow-hidden flex items-center justify-center">
              <img
                src={displayUrl}
                alt="Facebook Feed Photo"
                className="w-full h-auto max-h-[500px] object-contain"
              />
            </div>

            {/* Engagement Stats Bar */}
            <div className="px-3.5 py-2.5 flex items-center justify-between text-[12px] text-[#b0b3b8] border-b border-[#3e4042]">
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1">
                  <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white text-[9px]">
                    👍
                  </div>
                  <div className="w-4 h-4 rounded-full bg-rose-600 flex items-center justify-center text-white text-[9px]">
                    ❤️
                  </div>
                </div>
                <span>{likesCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-3">
                <span>384 Komentar</span>
                <span>•</span>
                <span>129 Kali Dibagikan</span>
              </div>
            </div>

            {/* Action Bar (Like, Comment, Share) */}
            <div className="px-2 py-1 flex items-center justify-between border-b border-[#3e4042] text-[12px] font-semibold text-[#b0b3b8]">
              <button
                onClick={handleToggleLike}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 hover:bg-[#3a3b3c] transition ${
                  hasLiked ? 'text-blue-400 font-bold' : ''
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>Suka</span>
              </button>
              <button className="flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 hover:bg-[#3a3b3c] transition">
                <MessageCircle className="w-4 h-4" />
                <span>Komentar</span>
              </button>
              <button className="flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 hover:bg-[#3a3b3c] transition">
                <Share2 className="w-4 h-4" />
                <span>Bagikan</span>
              </button>
            </div>

            {/* Viral Meter Tip */}
            <div className="p-3 bg-[#18191a] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300 font-medium">Prediksi Viral:</span>
                <span className="font-bold text-amber-400">{item.viralScore}/100</span>
              </div>
              <span className="text-[11px] text-slate-500">Format Rekomendasi: 4:5 Portrait Feed</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Rasio 4:5 mengisi layar smartphone 25% lebih luas dibanding kotak 1:1!
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Tutup Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
