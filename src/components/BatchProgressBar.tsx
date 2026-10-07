import React from 'react';
import { Archive, XCircle, CheckCircle2, ShieldAlert, CopyCheck, Flame, Undo2 } from 'lucide-react';
import { BatchStats } from '../types';

interface BatchProgressBarProps {
  isProcessing: boolean;
  progressPercent: number;
  statusText: string;
  onCancel: () => void;
  stats: BatchStats;
  canDownloadZip: boolean;
  onDownloadZip: () => void;
  isZipping: boolean;
  canUndo?: boolean;
  onUndo?: () => void;
}

export const BatchProgressBar: React.FC<BatchProgressBarProps> = ({
  isProcessing,
  progressPercent,
  statusText,
  onCancel,
  stats,
  canDownloadZip,
  onDownloadZip,
  isZipping,
  canUndo = false,
  onUndo,
}) => {
  if (!isProcessing && !canDownloadZip && stats.total === 0 && !canUndo) return null;

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl space-y-4">
      {/* Top Status & Main Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex-1 w-full">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-200 truncate pr-2" title={statusText}>
              {statusText || 'Siap memproses batch...'}
            </span>
            <span className="font-mono font-bold text-blue-400 shrink-0">
              {Math.round(progressPercent)}%
            </span>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isProcessing
                  ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-pulse'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(2, Math.min(100, progressPercent))}%` }}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 flex-wrap">
          {canUndo && !isProcessing && onUndo && (
            <button
              onClick={onUndo}
              className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-400 font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              title="Batalkan proses batch terakhir dan kembalikan antrean foto ke kondisi semula"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo Batch</span>
            </button>
          )}

          {isProcessing && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700/60 font-semibold text-xs flex items-center gap-1.5 transition"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Batal</span>
            </button>
          )}

          {canDownloadZip && (
            <button
              onClick={onDownloadZip}
              disabled={isZipping}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition disabled:opacity-50"
            >
              <Archive className="w-4 h-4" />
              <span>{isZipping ? 'Mengemas ZIP...' : '📦 Download Semua (ZIP + manifest.csv)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Metrics Bar */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800/60 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <div>
              <div className="text-[10px] text-slate-400">Total Diproses</div>
              <div className="font-bold text-slate-200 font-mono">
                {stats.processed} / {stats.total}
              </div>
            </div>
          </div>

          <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800/60 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400">Rerata Viral</div>
              <div className="font-bold text-amber-400 font-mono">
                {stats.avgScore > 0 ? `${stats.avgScore}/100` : '-'}
              </div>
            </div>
          </div>

          <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800/60 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400">Lolos Seleksi</div>
              <div className="font-bold text-emerald-400 font-mono">{stats.passed}</div>
            </div>
          </div>

          <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800/60 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <div>
              <div className="text-[10px] text-slate-400">Disaring (Reject)</div>
              <div className="font-bold text-red-400 font-mono">{stats.filtered}</div>
            </div>
          </div>

          <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800/60 flex items-center gap-2 col-span-2 sm:col-span-1">
            <CopyCheck className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-[10px] text-slate-400">Duplikat Dilewati</div>
              <div className="font-bold text-slate-300 font-mono">{stats.duplicates}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
