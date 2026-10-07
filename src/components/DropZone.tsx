import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, FolderUp, FileImage, Trash2, ClipboardPaste } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  fileCount: number;
  onClearQueue: () => void;
  isProcessing: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  fileCount,
  onClearQueue,
  isProcessing,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Global paste handler (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isProcessing) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) pastedFiles.push(file);
        }
      }

      if (pastedFiles.length > 0) {
        onFilesSelected(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isProcessing, onFilesSelected]);

  // Recursively walk directory entries
  const walkEntry = async (entry: any): Promise<File[]> => {
    if (entry.isFile) {
      return new Promise<File[]>((resolve) => {
        entry.file(
          (f: File) => resolve([f]),
          () => resolve([])
        );
      });
    }
    if (!entry.isDirectory) return [];

    const reader = entry.createReader();
    const allEntries: any[] = [];
    const readBatch = async (): Promise<void> => {
      const batch = await new Promise<any[]>((resolve) =>
        reader.readEntries(resolve, () => resolve([]))
      );
      if (batch.length) {
        allEntries.push(...batch);
        await readBatch();
      }
    };
    await readBatch();

    const nested = await Promise.all(allEntries.map((sub) => walkEntry(sub)));
    return nested.flat();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isProcessing) return;

    const items = [...e.dataTransfer.items];
    const entryPromises = items
      .filter((item) => item.kind === 'file')
      .map((item) => {
        const entry = (item as any).webkitGetAsEntry?.();
        return entry ? walkEntry(entry) : null;
      })
      .filter(Boolean) as Promise<File[]>[];

    if (entryPromises.length > 0) {
      const results = await Promise.all(entryPromises);
      const flat = results.flat();
      onFilesSelected(flat);
    } else if (e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileImage className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-slate-200">1. Foto / Folder Input</h2>
        </div>
        {fileCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {fileCount} Foto Siap
            </span>
            <button
              onClick={onClearQueue}
              disabled={isProcessing}
              className="text-slate-400 hover:text-red-400 p-1 rounded transition disabled:opacity-30"
              title="Kosongkan Antrean"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition text-center group ${
          isDragOver
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-slate-700 bg-slate-950/40 hover:border-blue-500/60 hover:bg-slate-900/40'
        }`}
      >
        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 mb-3 group-hover:scale-110 transition shadow-inner">
          <UploadCloud className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-200">
          Tarik & lepaskan foto / folder ke sini
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Atau klik untuk memilih file dari komputer
        </p>
        <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <ClipboardPaste className="w-3 h-3 text-slate-400" /> Bisa paste (Ctrl+V)
          </span>
          <span>•</span>
          <span>JPG, PNG, WEBP, AVIF</span>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files) onFilesSelected(Array.from(e.target.files));
          e.target.value = '';
        }}
        multiple
        accept="image/*,.avif"
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={(e) => {
          if (e.target.files) onFilesSelected(Array.from(e.target.files));
          e.target.value = '';
        }}
        // @ts-ignore
        webkitdirectory="true"
        // @ts-ignore
        directory="true"
        multiple
        className="hidden"
      />

      {/* Sub controls: Choose folder instead */}
      <div className="mt-3 flex items-center justify-between text-xs px-1">
        <button
          type="button"
          onClick={() => folderInputRef.current?.click()}
          disabled={isProcessing}
          className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium transition"
        >
          <FolderUp className="w-3.5 h-3.5" />
          <span>Pilih Satu Folder Sekaligus</span>
        </button>
        <span className="text-[11px] text-slate-500">Auto EXIF rotation fixed</span>
      </div>
    </div>
  );
};
