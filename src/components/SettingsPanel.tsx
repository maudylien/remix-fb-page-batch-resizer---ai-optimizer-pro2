import React, { useState } from 'react';
import {
  Crop,
  Sparkles,
  Type,
  Sliders,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp,
  Flame,
  CheckSquare,
  Square,
  HelpCircle,
  Copy,
  FileCheck
} from 'lucide-react';
import {
  AspectRatioPreset,
  FitMode,
  BlurBackgroundMode,
  WatermarkConfig,
  StudioFilterConfig,
} from '../types';

interface SettingsPanelProps {
  ratios: AspectRatioPreset[];
  onToggleRatio: (id: string) => void;
  customW: number;
  customH: number;
  onCustomWChange: (w: number) => void;
  onCustomHChange: (h: number) => void;
  customRatioEnabled: boolean;
  onToggleCustomRatio: () => void;

  fitMode: FitMode;
  onFitModeChange: (m: FitMode) => void;
  bgMode: BlurBackgroundMode;
  onBgModeChange: (b: BlurBackgroundMode) => void;
  blurRadius: number;
  onBlurRadiusChange: (r: number) => void;

  // AI & Moderation
  enableSafetyFilter: boolean;
  onToggleSafetyFilter: () => void;
  minViralScore: number;
  onMinViralScoreChange: (score: number) => void;
  skipDuplicates: boolean;
  onToggleSkipDuplicates: () => void;
  enableAutoCaption: boolean;
  onToggleAutoCaption: () => void;
  queueItemCount?: number;
  captionLanguage: 'both' | 'id' | 'en';
  onCaptionLanguageChange: (lang: 'both' | 'id' | 'en') => void;
  enableGeminiEnhance: boolean;
  onToggleGeminiEnhance: () => void;
  enableAiMetadataTag: boolean;
  onToggleAiMetadataTag: () => void;

  // Watermark
  watermark: WatermarkConfig;
  onUpdateWatermark: (updates: Partial<WatermarkConfig>) => void;
  onUploadLogo: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // Filters & Format
  filters: StudioFilterConfig;
  onUpdateFilters: (updates: Partial<StudioFilterConfig>) => void;
  format: string;
  onFormatChange: (fmt: string) => void;
  quality: number;
  onQualityChange: (q: number) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  ratios,
  onToggleRatio,
  customW,
  customH,
  onCustomWChange,
  onCustomHChange,
  customRatioEnabled,
  onToggleCustomRatio,

  fitMode,
  onFitModeChange,
  bgMode,
  onBgModeChange,
  blurRadius,
  onBlurRadiusChange,

  enableSafetyFilter,
  onToggleSafetyFilter,
  minViralScore,
  onMinViralScoreChange,
  skipDuplicates,
  onToggleSkipDuplicates,
  enableAutoCaption,
  onToggleAutoCaption,
  queueItemCount = 0,
  captionLanguage,
  onCaptionLanguageChange,
  enableGeminiEnhance,
  onToggleGeminiEnhance,
  enableAiMetadataTag,
  onToggleAiMetadataTag,

  watermark,
  onUpdateWatermark,
  onUploadLogo,

  filters,
  onUpdateFilters,
  format,
  onFormatChange,
  quality,
  onQualityChange,
}) => {
  const [activeTab, setActiveTab] = useState<'ratios' | 'ai' | 'watermark' | 'export'>('ratios');

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 sm:p-5 flex flex-col gap-4">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('ratios')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition whitespace-nowrap flex-1 justify-center ${
            activeTab === 'ratios'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Crop className="w-3.5 h-3.5" />
          <span>2. Ukuran & Crop</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition whitespace-nowrap flex-1 justify-center ${
            activeTab === 'ai'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-300" />
          <span>3. AI & Filter</span>
        </button>

        <button
          onClick={() => setActiveTab('watermark')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition whitespace-nowrap flex-1 justify-center ${
            activeTab === 'watermark'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Watermark</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition whitespace-nowrap flex-1 justify-center ${
            activeTab === 'export'
              ? 'bg-slate-700 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>4. Output & Mutu</span>
        </button>
      </div>

      {/* Tab 1: Ratios & Framing */}
      {activeTab === 'ratios' && (
        <div className="space-y-4 text-xs animate-fadeIn">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-200">Rasio Standar Facebook (Multi-Pilih):</span>
              <span className="text-[11px] text-blue-400 font-medium">Bisa pilih &gt; 1 sekaligus</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ratios.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                    r.checked
                      ? 'border-blue-500 bg-blue-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={r.checked}
                    onChange={() => onToggleRatio(r.id)}
                    className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-200">{r.name}</span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {r.width}x{r.height}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{r.description}</p>
                    {r.recommendedFor && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {r.recommendedFor}
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {/* Custom Ratio */}
            <div className="mt-2 p-2.5 rounded-xl border border-slate-800 bg-slate-950/30">
              <label className="flex items-center gap-2 font-semibold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customRatioEnabled}
                  onChange={onToggleCustomRatio}
                  className="rounded border-slate-700 text-blue-600 focus:ring-0"
                />
                <span>Custom Ukuran Piksel Sendiri</span>
              </label>
              {customRatioEnabled && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <span className="text-[10px] text-slate-500">Lebar (Width px):</span>
                    <input
                      type="number"
                      value={customW}
                      onChange={(e) => onCustomWChange(Math.max(100, Number(e.target.value)))}
                      className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Tinggi (Height px):</span>
                    <input
                      type="number"
                      value={customH}
                      onChange={(e) => onCustomHChange(Math.max(100, Number(e.target.value)))}
                      className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Framing / Fit Mode */}
          <div className="pt-2 border-t border-slate-800">
            <span className="font-bold text-slate-200 block mb-2">Metode Penyesuaian Bingkai:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onFitModeChange('cover')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  fitMode === 'cover'
                    ? 'border-blue-500 bg-blue-500/15 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-slate-200">Crop Pintar (Smart Cover)</div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Fokus otomatis pada wajah/subjek utama tanpa menyisakan ruang kosong.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onFitModeChange('contain')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  fitMode === 'contain'
                    ? 'border-blue-500 bg-blue-500/15 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-slate-200">Contain (Tanpa Potong)</div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Seluruh foto utuh ditampilkan, sisi kosong diisi efek blur / warna.
                </p>
              </button>
            </div>

            {fitMode === 'contain' && (
              <div className="mt-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-300">Pengisian Sisi Kosong:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['blur', 'black', 'white', 'gradient'] as BlurBackgroundMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onBgModeChange(mode)}
                      className={`py-1.5 px-2 rounded-lg text-center font-medium capitalize border text-[11px] transition ${
                        bgMode === mode
                          ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                          : 'border-slate-800 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      {mode === 'blur' ? 'Blur Ambient' : mode === 'black' ? 'Hitam Pekat' : mode === 'white' ? 'Putih' : 'Gradien'}
                    </button>
                  ))}
                </div>

                {bgMode === 'blur' && (
                  <div className="pt-2">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Kekuatan Efek Blur:</span>
                      <span className="font-mono text-blue-300">{blurRadius}px</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      value={blurRadius}
                      onChange={(e) => onBlurRadiusChange(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: AI Intelligence & Safety */}
      {activeTab === 'ai' && (
        <div className="space-y-4 text-xs animate-fadeIn">
          {/* Moderation & Filter */}
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-200">Filter Standar Komunitas FB:</span>
              </div>
              <input
                type="checkbox"
                checked={enableSafetyFilter}
                onChange={onToggleSafetyFilter}
                className="rounded border-slate-700 text-purple-600 focus:ring-0"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Otomatis buang foto yang melanggar ketentuan Facebook (nuditas, kekerasan, gambar spam, sensasional berbahaya).
            </p>

            {enableSafetyFilter && (
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex justify-between items-center text-[11px] mb-1.5">
                  <span className="text-slate-300 flex items-center gap-1 font-semibold">
                    <Flame className="w-3.5 h-3.5 text-amber-400" /> Skor Potensi Viral Minimal:
                  </span>
                  <span className="font-bold font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    &ge; {minViralScore} / 100
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="90"
                  step="5"
                  value={minViralScore}
                  onChange={(e) => onMinViralScoreChange(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Foto dengan skor di bawah ambang batas ini akan disortir/dilewati agar Halaman FB Anda hanya mengunggah konten berkualitas tinggi.
                </p>
              </div>
            )}
          </div>

          {/* Duplicate Detection */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-800 bg-slate-950/40 cursor-pointer hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={skipDuplicates}
              onChange={onToggleSkipDuplicates}
              className="mt-0.5 rounded border-slate-700 text-purple-600 focus:ring-0"
            />
            <div>
              <span className="font-bold text-slate-200">Lewati Foto Duplikat / Mirip (dHash)</span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Mendeteksi kemiripan visual 64-bit Hamming distance untuk menyaring hasil jepretan burst mode atau file kembar.
              </p>
            </div>
          </label>

          {/* Automated Viral Captioning (Global Queue Toggle Switch) */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              enableAutoCaption
                ? 'bg-purple-950/20 border-purple-500/40 shadow-sm'
                : 'bg-slate-950/40 border-slate-800'
            } space-y-2.5`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div
                  className={`p-1.5 rounded-lg mt-0.5 transition-colors ${
                    enableAutoCaption ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Type className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200 text-xs">AI Auto-Caption (Global Antrean)</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        enableAutoCaption
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {enableAutoCaption ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {queueItemCount > 0
                      ? `Mengontrol pembuatan caption pada ${queueItemCount} foto di antrean`
                      : 'Sakelar global kontrol caption untuk seluruh antrean foto'}
                  </span>
                </div>
              </div>

              {/* Modern Switch Toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={enableAutoCaption}
                onClick={onToggleAutoCaption}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                  enableAutoCaption ? 'bg-purple-600' : 'bg-slate-700'
                }`}
                title={
                  enableAutoCaption
                    ? 'Klik untuk mematikan caption pada semua foto antrean'
                    : 'Klik untuk mengaktifkan caption pada semua foto antrean'
                }
              >
                <span className="sr-only">Toggle AI Auto-Caption global antrean</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    enableAutoCaption ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Sakelar global untuk menyalakan atau mematikan pembuatan caption &amp; hashtag. Menonaktifkan sakelar ini langsung menonaktifkan/menyembunyikan caption pada seluruh foto di antrean tanpa perlu menjalankan ulang (render) foto yang sudah diproses.
            </p>

            {enableAutoCaption ? (
              <div className="pt-2 border-t border-purple-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">Bahasa Caption:</span>
                  <span className="text-[9px] text-purple-300 font-mono">Hook + CTA Pertanyaan</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['both', 'id', 'en'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => onCaptionLanguageChange(lang)}
                      className={`py-1 rounded-lg text-center font-medium border text-[10px] transition ${
                        captionLanguage === lang
                          ? 'border-purple-500 bg-purple-600/30 text-purple-200 shadow-sm'
                          : 'border-slate-800 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      {lang === 'both' ? '🇮🇩 ID & 🇺🇸 EN' : lang === 'id' ? '🇮🇩 Indonesia' : '🇺🇸 English'}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 flex items-start gap-2">
                <span className="text-amber-400 text-xs">⚡</span>
                <span className="leading-tight">
                  <strong className="text-slate-300">Caption dinonaktifkan:</strong> Seluruh foto di antrean (termasuk yang telah selesai diproses) tidak akan menyertakan caption pada kartu, simulator, maupun file manifest.csv tanpa perlu re-run proses.
                </span>
              </div>
            )}
          </div>

          {/* Real AI Image Enhancement */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-purple-500/30 bg-purple-950/10 cursor-pointer hover:border-purple-500/50 transition">
            <input
              type="checkbox"
              checked={enableGeminiEnhance}
              onChange={onToggleGeminiEnhance}
              className="mt-0.5 rounded border-purple-500 text-purple-600 focus:ring-0"
            />
            <div>
              <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> ✨ AI Image Detail Enhancer (100% Free Tier)
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Meningkatkan kejernihan foto dengan prompt visual Gemini 3.8 Flash &amp; Pollinations AI tanpa biaya (0 Biaya API).
              </p>
            </div>
          </label>

          {/* AI Metadata Tagging */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-800 bg-slate-950/40 cursor-pointer hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={enableAiMetadataTag}
              onChange={onToggleAiMetadataTag}
              className="mt-0.5 rounded border-slate-700 text-purple-600 focus:ring-0"
            />
            <div>
              <span className="font-bold text-slate-200">🏷️ Label XMP / IPTC Metadata AI (Khusus JPEG)</span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Menyematkan penanda resmi &apos;trainedAlgorithmicMedia&apos; ke dalam file gambar sesuai transparansi AI Facebook / Meta.
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Tab 3: Watermark Studio */}
      {activeTab === 'watermark' && (
        <div className="space-y-4 text-xs animate-fadeIn">
          <div className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800">
            <div>
              <span className="font-bold text-slate-200">Aktifkan Watermark Otomatis</span>
              <p className="text-[10px] text-slate-400">Cegah pencurian konten oleh halaman lain.</p>
            </div>
            <input
              type="checkbox"
              checked={watermark.enabled}
              onChange={(e) => onUpdateWatermark({ enabled: e.target.checked })}
              className="rounded border-slate-700 text-indigo-600 focus:ring-0"
            />
          </div>

          {watermark.enabled && (
            <div className="space-y-3">
              {/* Text input */}
              <div>
                <span className="text-slate-300 font-semibold block mb-1">Teks Watermark:</span>
                <input
                  type="text"
                  placeholder="Misal: @NamaHalamanAnda"
                  value={watermark.text}
                  onChange={(e) => onUpdateWatermark({ text: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs font-medium focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Position 3x3 selector */}
              <div>
                <span className="text-slate-300 font-semibold block mb-1.5">Posisi Watermark:</span>
                <div className="grid grid-cols-3 gap-1.5 max-w-[240px]">
                  {[
                    { id: 'top-left', label: '↖ Atas Kiri' },
                    { id: 'center', label: '• Tengah' },
                    { id: 'top-right', label: '↗ Atas Kanan' },
                    { id: 'bottom-left', label: '↙ Bawah Kiri' },
                    { id: 'bottom-center', label: '↓ Bawah Tengah' },
                    { id: 'bottom-right', label: '↘ Bawah Kanan' },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => onUpdateWatermark({ position: pos.id as any })}
                      className={`p-1.5 rounded-lg text-center text-[10px] font-semibold border transition ${
                        watermark.position === pos.id
                          ? 'border-indigo-500 bg-indigo-600/25 text-white'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opacity slider */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Transparansi (Opacity):</span>
                  <span className="font-mono text-indigo-300">{Math.round(watermark.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={watermark.opacity}
                  onChange={(e) => onUpdateWatermark({ opacity: Number(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* Upload Logo Watermark */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-300 font-semibold block mb-1">Gunakan Logo PNG (Opsional):</span>
                <input
                  type="file"
                  accept="image/png,image/webp"
                  onChange={onUploadLogo}
                  className="text-[11px] text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                />
                {watermark.customLogoUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <img
                      src={watermark.customLogoUrl}
                      alt="Logo preview"
                      className="h-7 w-auto bg-slate-950 p-1 rounded border border-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateWatermark({ customLogoUrl: undefined, customLogoImg: null })}
                      className="text-red-400 hover:text-red-300 text-[10px] underline"
                    >
                      Hapus Logo
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Export Format & Pro Filters */}
      {activeTab === 'export' && (
        <div className="space-y-4 text-xs animate-fadeIn">
          {/* Format Selection */}
          <div>
            <span className="font-bold text-slate-200 block mb-1.5">Format Gambar Akhir:</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'image/jpeg', name: 'JPEG', desc: 'Terbaik utk FB' },
                { id: 'image/webp', name: 'WEBP', desc: 'Ukuran Ringan' },
                { id: 'image/png', name: 'PNG', desc: 'Lossless' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onFormatChange(f.id)}
                  className={`p-2 rounded-xl text-center border transition ${
                    format === f.id
                      ? 'border-blue-500 bg-blue-600/20 text-white font-bold'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <div className="text-xs">{f.name}</div>
                  <div className="text-[9px] text-slate-500">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quality slider */}
          {format !== 'image/png' && (
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-300">Kualitas Kompresi:</span>
                <span className="font-mono text-blue-300">{quality}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={quality}
                onChange={(e) => onQualityChange(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <span className="text-[10px] text-slate-500">
                Rekomendasi Facebook: 92% (warna cerah tanpa artifak kompresi).
              </span>
            </div>
          )}

          {/* Studio Color & Clarity Filters */}
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">Studio HD Color &amp; Clarity Tuning:</span>
              <input
                type="checkbox"
                checked={filters.enabled}
                onChange={(e) => onUpdateFilters({ enabled: e.target.checked })}
                className="rounded border-slate-700 text-blue-600 focus:ring-0"
              />
            </div>
            {filters.enabled && (
              <div className="space-y-2 pt-2">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>Ketajaman Mikro (Sharpness):</span>
                    <span className="font-mono text-blue-300">{filters.sharpness}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.sharpness}
                    onChange={(e) => onUpdateFilters({ sharpness: Number(e.target.value) })}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>Kontras Dinamis:</span>
                    <span className="font-mono text-blue-300">{filters.contrast}</span>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    value={filters.contrast}
                    onChange={(e) => onUpdateFilters({ contrast: Number(e.target.value) })}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>Vibrance (Kekayaan Warna):</span>
                    <span className="font-mono text-blue-300">{filters.vibrance}</span>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    value={filters.vibrance}
                    onChange={(e) => onUpdateFilters({ vibrance: Number(e.target.value) })}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
