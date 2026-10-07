import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Download,
  RefreshCw,
  AlertCircle,
  Upload,
  Check,
  Copy,
  Sliders,
  Zap,
  Globe
} from 'lucide-react';
import { ImageItem } from '../types';
import { canvasToBlob, blobToBase64Data, createThumbnailCanvas } from '../utils/imageEngine';

interface VeoAnimateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem?: ImageItem | null;
  items: ImageItem[];
}

const VISUAL_PRESETS = [
  {
    id: 'cinematic',
    title: 'Sinematik Facebook HD',
    desc: 'Visual dramatis dengan pencahayaan studio tajam untuk feed Facebook.',
    prompt: 'Cinematic Facebook viral photography, ultra-realistic studio lighting, 8k crisp details, high depth of field, stunning color grading',
    style: 'cinematic',
  },
  {
    id: 'golden_hour',
    title: 'Sunset Golden Hour',
    desc: 'Pencahayaan senja hangat dengan kedalaman atmosferik alami.',
    prompt: 'Dramatic golden hour sunlight, soft ambient lens flare, rich warm tones, atmospheric depth, cinematic nature framing',
    style: 'photorealistic',
  },
  {
    id: 'animated_3d',
    title: 'Animasi & 3D Render Populer',
    desc: 'Gaya animasi 3D modern dengan warna cerah memikat mata.',
    prompt: 'Vibrant 3D rendered animated scene, smooth aesthetic styling, volumetric soft lighting, dynamic energy, trending artstation',
    style: '3d-render',
  },
  {
    id: 'studio_portrait',
    title: 'Studio Portrait & Produk',
    desc: 'Ketajaman mikro-kontras tinggi ala majalah profesional.',
    prompt: 'High fashion editorial studio photography, clean professional backdrop, pristine sharp focus, hyper-realistic skin texture',
    style: 'studio',
  },
];

export const VeoAnimateModal: React.FC<VeoAnimateModalProps> = ({
  isOpen,
  onClose,
  selectedItem,
  items,
}) => {
  const [activeItem, setActiveItem] = useState<ImageItem | null>(null);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customPreviewUrl, setCustomPreviewUrl] = useState<string | null>(null);

  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:5'>('4:5');
  const [selectedPreset, setSelectedPreset] = useState<string>('cinematic');
  const [customPrompt, setCustomPrompt] = useState<string>(VISUAL_PRESETS[0].prompt);

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result Visual
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [pollinationsDirectUrl, setPollinationsDirectUrl] = useState<string | null>(null);
  const [usedPrompt, setUsedPrompt] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastRequestTimeRef = useRef<number>(0);

  // Synchronize initial item
  useEffect(() => {
    if (isOpen) {
      if (selectedItem) {
        setActiveItem(selectedItem);
        setCustomFile(null);
        setCustomPreviewUrl(null);
      } else if (items.length > 0) {
        setActiveItem(items[0]);
        setCustomFile(null);
        setCustomPreviewUrl(null);
      }
    }
  }, [isOpen, selectedItem, items]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (customPreviewUrl) URL.revokeObjectURL(customPreviewUrl);
    };
  }, [customPreviewUrl]);

  if (!isOpen) return null;

  // Handle Preset Change
  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const found = VISUAL_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setCustomPrompt(found.prompt);
    }
  };

  // Upload Custom File
  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (customPreviewUrl) URL.revokeObjectURL(customPreviewUrl);
    const url = URL.createObjectURL(file);
    setCustomFile(file);
    setCustomPreviewUrl(url);
    setActiveItem(null);
  };

  // Start Generation via Free Provider (Gemini 3.8 Flash + Pollinations API)
  const handleStartGeneration = async () => {
    setErrorMessage(null);
    setIsGenerating(true);

    try {
      // 0. Free Tier Rate Limit Queue: Ensure 5-second cooldown between visual generation requests
      const now = Date.now();
      const elapsed = now - lastRequestTimeRef.current;
      if (lastRequestTimeRef.current > 0 && elapsed < 5000) {
        const waitMs = 5000 - elapsed;
        const waitSec = Math.ceil(waitMs / 1000);
        for (let s = waitSec; s > 0; s--) {
          setStatusMessage(`[Antrean Free Tier: Jeda ${s} Detik Bebas 429] Menyiapkan giliran...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
      lastRequestTimeRef.current = Date.now();

      setStatusMessage('Mengoptimasi prompt dengan Gemini 3.8 Flash (Free Tier)...');

      let base64Data = '';
      let mime = 'image/jpeg';

      if (customFile) {
        mime = customFile.type || 'image/jpeg';
        const buffer = await customFile.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        base64Data = btoa(binary);
      } else if (activeItem) {
        const sourceBitmap = activeItem.enhancedBitmap || activeItem.bitmap;
        const thumbCanvas = createThumbnailCanvas(sourceBitmap, 1080);
        const blob = await canvasToBlob(thumbCanvas, 'image/jpeg', 0.88);
        base64Data = await blobToBase64Data(blob);
        mime = 'image/jpeg';
      }

      setStatusMessage('Menghubungi Pollinations AI & merender visual HD (Free Tier)...');

      const foundPreset = VISUAL_PRESETS.find((p) => p.id === selectedPreset);
      const styleName = foundPreset ? foundPreset.style : 'cinematic';

      const resp = await fetch('/api/visual/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customPrompt,
          imageBase64: base64Data,
          mimeType: mime,
          aspectRatio,
          style: styleName,
        }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || (!data.imageUrl && data.error)) {
        throw new Error(data.error || `Server HTTP ${resp.status}`);
      }

      setResultImageUrl(data.imageUrl);
      setPollinationsDirectUrl(data.pollinationsUrl || null);
      setUsedPrompt(data.prompt || customPrompt);
      setStatusMessage(
        data.fallbackUsed
          ? 'Visual HD berhasil disiapkan (Free Tier)!'
          : 'Visual berhasil dibuat 100% Free!'
      );
    } catch (err: any) {
      console.warn('Visual generation notice:', err?.message || err);
      const msg = err?.message || '';
      if (msg.includes('500') || msg.includes('beban tinggi') || msg.includes('Pollinations') || msg.includes('sibuk')) {
        setErrorMessage(
          'Layanan visual gratis sedang sibuk sesaat. Jangan khawatir, klik tombol "Coba Lagi (Try Again)" di bawah untuk memproses ulang.'
        );
      } else if (msg.includes('429')) {
        setErrorMessage(
          'Batas request Free Tier tercapai sesaat (429). Tunggu 5 detik lalu klik tombol Coba Lagi di bawah.'
        );
      } else {
        setErrorMessage(
          err?.message ||
            'Terjadi kendala saat memuat gambar gratis. Silakan klik tombol Coba Lagi di bawah.'
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Download Generated Visual
  const handleDownload = () => {
    if (!resultImageUrl) return;
    const link = document.createElement('a');
    link.href = resultImageUrl;
    link.download = `pollinations_visual_${aspectRatio}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(usedPrompt || customPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentPreviewSrc =
    customPreviewUrl ||
    (activeItem ? activeItem.outputs?.[0]?.dataUrl || activeItem.origUrl : null);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white">AI Visual &amp; Scene Studio</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  100% Free Tier (0 Biaya)
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Powered by Gemini 3.8 Flash + Pollinations AI (Tanpa API Key Berbayar)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Top Banner Notice */}
          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
            <Globe className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              <strong>Bebas Biaya:</strong> Model berbayar (Veo 3) telah dilepas. Studio ini menggunakan <strong>Gemini 3.8 Flash</strong> untuk teks dan <strong>Pollinations API</strong> untuk visual berkualitas tinggi tanpa batas tagihan.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Column: Image Source & Setup */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  1. Pilih Sumber Foto:
                </label>
                {/* Image thumbnails carousel from queue */}
                {items.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2">
                    {items.map((it) => (
                      <button
                        key={it.id}
                        onClick={() => {
                          setActiveItem(it);
                          setCustomFile(null);
                          if (customPreviewUrl) URL.revokeObjectURL(customPreviewUrl);
                          setCustomPreviewUrl(null);
                        }}
                        className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition relative ${
                          activeItem?.id === it.id && !customFile
                            ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                            : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={it.outputs?.[0]?.dataUrl || it.origUrl}
                          alt={it.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Upload custom option */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleCustomFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-400" />
                    <span>Upload Foto Lain</span>
                  </button>
                </div>
              </div>

              {/* Source Preview */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-2 flex flex-col items-center justify-center min-h-[160px] max-h-[220px] overflow-hidden">
                {currentPreviewSrc ? (
                  <img
                    src={currentPreviewSrc}
                    alt="Preview Sumber"
                    className="max-h-[200px] w-auto object-contain rounded-lg shadow"
                  />
                ) : (
                  <span className="text-xs text-slate-500">Tidak ada gambar terpilih</span>
                )}
              </div>

              {/* Aspect Ratio Picker */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  2. Rasio Aspek Visual:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['4:5', '1:1', '9:16', '16:9'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-1.5 px-2 rounded-xl text-center text-xs font-bold border transition cursor-pointer ${
                        aspectRatio === ratio
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                          : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Style Presets & Generation */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  3. Gaya Visual:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {VISUAL_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        selectedPreset === preset.id
                          ? 'border-emerald-500 bg-emerald-500/15 text-white'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-200">{preset.title}</div>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{preset.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  4. Prompt Visual (Ditingkatkan Gemini 3.8 Flash):
                </label>
                <textarea
                  rows={3}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-sans"
                  placeholder="Deskripsikan detail visual atau suasana yang diinginkan..."
                />
              </div>

              {/* Action Button */}
              <button
                onClick={handleStartGeneration}
                disabled={isGenerating}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>{statusMessage || 'Sedang Menghasilkan...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-white" />
                    <span>Generate Visual Gratis (Pollinations)</span>
                  </>
                )}
              </button>

              {/* Error Notice with Try Again Button */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-2 text-xs text-rose-200 animate-fadeIn">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span className="leading-tight">{errorMessage}</span>
                  </div>
                  <button
                    onClick={handleStartGeneration}
                    className="w-full py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Coba Lagi (Try Again)</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Result Output Preview */}
          {resultImageUrl && (
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/40 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" /> Hasil Visual Pollinations AI (HD Free)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyPrompt}
                    className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Tersalin' : 'Salin Prompt'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Gambar</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-center bg-black rounded-xl overflow-hidden max-h-[420px]">
                <img
                  src={resultImageUrl}
                  alt="Hasil Visual Pollinations"
                  className="max-h-[420px] w-auto object-contain"
                />
              </div>

              {usedPrompt && (
                <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                  &ldquo;{usedPrompt}&rdquo;
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
