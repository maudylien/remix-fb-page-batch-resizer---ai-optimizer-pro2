import React, { useState, useRef, useEffect, useMemo } from 'react';
import JSZip from 'jszip';
import {
  Sparkles,
  Flame,
  ShieldCheck,
  CheckCircle,
  Play,
  RotateCcw,
  SlidersHorizontal,
  LayoutGrid,
  FileSpreadsheet,
  AlertCircle,
  Undo2,
  Check,
  Film
} from 'lucide-react';

import {
  ImageItem,
  AspectRatioPreset,
  FitMode,
  BlurBackgroundMode,
  WatermarkConfig,
  StudioFilterConfig,
  BatchStats,
  FocalPoint,
  ProcessedRatioOutput,
} from './types';

import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { SettingsPanel } from './components/SettingsPanel';
import { ImageCard } from './components/ImageCard';
import { BatchProgressBar } from './components/BatchProgressBar';
import { FocalPointModal } from './components/FocalPointModal';
import { FacebookMockupModal } from './components/FacebookMockupModal';
import { HelpModal } from './components/HelpModal';
import { VeoAnimateModal } from './components/VeoAnimateModal';

import {
  canvasToBlob,
  createThumbnailCanvas,
  blobToBase64Data,
  computeDHash,
  hammingDistance,
  renderImageToCanvas,
  tagAiMetadata,
} from './utils/imageEngine';

import { SAMPLE_IMAGES, fetchSampleAsFile } from './utils/sampleImages';

const DEFAULT_RATIOS: AspectRatioPreset[] = [
  {
    id: '4x5',
    name: 'Feed Portrait (4:5)',
    width: 1080,
    height: 1350,
    label: '4x5',
    description: 'Format vertikal standar Facebook mobile dengan jangkauan tertinggi.',
    checked: true,
    recommendedFor: 'Rekomendasi Utama FB Feed',
  },
  {
    id: '1x1',
    name: 'Square Feed (1:1)',
    width: 1080,
    height: 1080,
    label: '1x1',
    description: 'Format persegi serbaguna untuk desktop & mobile carousel.',
    checked: true,
  },
  {
    id: '9x16',
    name: 'Reels / Stories (9:16)',
    width: 1080,
    height: 1920,
    label: '9x16',
    description: 'Layar penuh untuk FB Reels dan Story 24 jam.',
    checked: false,
  },
  {
    id: '16x9',
    name: 'Landscape Link (16:9)',
    width: 1200,
    height: 675,
    label: '16x9',
    description: 'Banner artikel web dan preview desktop feed.',
    checked: false,
  },
  {
    id: 'fb_cover',
    name: 'Facebook Cover',
    width: 1640,
    height: 624,
    label: 'cover',
    description: 'Header sampul halaman Facebook resolusi HD.',
    checked: false,
  },
];

export default function App() {
  // Image Items State
  const [items, setItems] = useState<ImageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [isZipping, setIsZipping] = useState(false);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);

  // Filter Grid View Tab
  const [gridFilterTab, setGridFilterTab] = useState<'all' | 'passed' | 'filtered' | 'duplicate' | 'error'>('all');

  // Cancel processing control ref
  const cancelRequestedRef = useRef(false);

  // Aspect Ratios State
  const [ratios, setRatios] = useState<AspectRatioPreset[]>(DEFAULT_RATIOS);
  const [customRatioEnabled, setCustomRatioEnabled] = useState(false);
  const [customW, setCustomW] = useState(1200);
  const [customH, setCustomH] = useState(1200);

  // Framing & Background
  const [fitMode, setFitMode] = useState<FitMode>('cover');
  const [bgMode, setBgMode] = useState<BlurBackgroundMode>('blur');
  const [blurRadius, setBlurRadius] = useState(26);

  // AI & Moderation
  const [enableSafetyFilter, setEnableSafetyFilter] = useState(true);
  const [minViralScore, setMinViralScore] = useState(60);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [enableAutoCaption, setEnableAutoCaption] = useState(true);
  const [captionLanguage, setCaptionLanguage] = useState<'both' | 'id' | 'en'>('both');
  const [enableGeminiEnhance, setEnableGeminiEnhance] = useState(false);
  const [enableAiMetadataTag, setEnableAiMetadataTag] = useState(true);

  // Watermark
  const [watermark, setWatermark] = useState<WatermarkConfig>({
    enabled: false,
    text: '@ViralPage_Official',
    fontSizeRatio: 0.032,
    opacity: 0.75,
    position: 'bottom-right',
    color: '#ffffff',
    hasShadow: true,
  });

  // Filters & Format
  const [filters, setFilters] = useState<StudioFilterConfig>({
    enabled: false,
    sharpness: 35,
    contrast: 5,
    vibrance: 12,
    brightness: 0,
  });
  const [format, setFormat] = useState('image/jpeg');
  const [quality, setQuality] = useState(92);

  // Modals State
  const [activeFocalItem, setActiveFocalItem] = useState<ImageItem | null>(null);
  const [activeMockupItem, setActiveMockupItem] = useState<ImageItem | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showVeoModal, setShowVeoModal] = useState(false);
  const [veoTargetItem, setVeoTargetItem] = useState<ImageItem | null>(null);

  // Undo Last Batch State
  const [previousBatchSnapshot, setPreviousBatchSnapshot] = useState<ImageItem[] | null>(null);
  const [undoToast, setUndoToast] = useState<string | null>(null);

  // Helper to deep-clone queue state for Undo
  const cloneItemsForHistory = (itemsList: ImageItem[]): ImageItem[] => {
    return itemsList.map((item) => ({
      ...item,
      focus: { ...item.focus },
      userAdjustedFocus: item.userAdjustedFocus ? { ...item.userAdjustedFocus } : undefined,
      hashtags: [...item.hashtags],
      cachedHashtags: item.cachedHashtags ? [...item.cachedHashtags] : undefined,
      outputs: item.outputs.map((out) => ({ ...out })),
    }));
  };

  // Undo last batch processing operation, restoring the previous queue state
  const handleUndoBatch = () => {
    if (!previousBatchSnapshot || isProcessing) return;

    // Collect valid output URLs that were already present in snapshot
    const snapshotUrls = new Set<string>();
    previousBatchSnapshot.forEach((item) => {
      item.outputs?.forEach((out) => snapshotUrls.add(out.dataUrl));
    });

    // Revoke object URLs created during undone batch execution
    items.forEach((item) => {
      item.outputs?.forEach((out) => {
        if (!snapshotUrls.has(out.dataUrl)) {
          URL.revokeObjectURL(out.dataUrl);
        }
      });
    });

    setItems(previousBatchSnapshot);
    setPreviousBatchSnapshot(null);
    setProgressPercent(0);
    setStatusText('Operasi batch berhasil di-undo. Antrean foto dikembalikan ke kondisi sebelumnya.');
    setUndoToast('Operasi batch terakhir berhasil dibatalkan! Antrean foto telah dipulihkan.');
    setTimeout(() => setUndoToast(null), 5000);
  };

  // Globally Toggle AI Auto-Caption across all items currently in the queue
  const handleToggleAutoCaption = () => {
    const nextState = !enableAutoCaption;
    setEnableAutoCaption(nextState);

    // Immediately toggle captions across all items currently in the queue without re-processing
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (!nextState) {
          // Disabling: Save active captions to cache, clear visible captions
          const cachedId = item.captionId || item.cachedCaptionId || '';
          const cachedEn = item.captionEn || item.cachedCaptionEn || '';
          const cachedTags =
            item.hashtags && item.hashtags.length > 0
              ? [...item.hashtags]
              : item.cachedHashtags || [];

          return {
            ...item,
            cachedCaptionId: cachedId,
            cachedCaptionEn: cachedEn,
            cachedHashtags: cachedTags,
            captionId: '',
            captionEn: '',
            hashtags: [],
          };
        } else {
          // Enabling: Restore captions from cache if available
          return {
            ...item,
            captionId: item.cachedCaptionId || item.captionId || '',
            captionEn: item.cachedCaptionEn || item.captionEn || '',
            hashtags:
              item.cachedHashtags && item.cachedHashtags.length > 0
                ? [...item.cachedHashtags]
                : item.hashtags || [],
          };
        }
      })
    );

    const count = items.length;
    if (nextState) {
      setStatusText(
        count > 0
          ? `AI Auto-Caption diaktifkan secara global untuk ${count} foto di antrean.`
          : 'AI Auto-Caption diaktifkan secara global.'
      );
    } else {
      setStatusText(
        count > 0
          ? `AI Auto-Caption dinonaktifkan secara global untuk ${count} foto di antrean tanpa perlu proses ulang.`
          : 'AI Auto-Caption dinonaktifkan secara global.'
      );
    }
  };

  // Toggle Aspect Ratio
  const handleToggleRatio = (id: string) => {
    setRatios((prev) =>
      prev.map((r) => (r.id === id ? { ...r, checked: !r.checked } : r))
    );
  };

  // Upload Logo for Watermark
  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setWatermark((prev) => ({
        ...prev,
        enabled: true,
        customLogoUrl: url,
        customLogoImg: img,
      }));
    };
    img.src = url;
  };

  // Add files to queue
  const handleFilesSelected = async (files: File[]) => {
    const validFiles = files.filter(
      (f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(f.name)
    );

    if (validFiles.length === 0) return;

    const newItems: ImageItem[] = [];
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '_');
      const origUrl = URL.createObjectURL(file);

      try {
        const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
        newItems.push({
          id: `${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
          file,
          name: file.name,
          baseName,
          origWidth: bmp.width,
          origHeight: bmp.height,
          origUrl,
          bitmap: bmp,
          status: 'idle',
          safe: true,
          flag: 'None',
          viralScore: 75,
          reason: '',
          category: 'General',
          focus: { x: 0.5, y: 0.5 },
          captionId: '',
          captionEn: '',
          hashtags: [],
          isAiEnhanced: false,
          outputs: [],
        });
      } catch (err) {
        console.warn('Gagal decode bitmap:', file.name, err);
      }
    }

    setItems((prev) => [...prev, ...newItems]);
  };

  // Clear all items
  const handleClearQueue = () => {
    items.forEach((item) => {
      URL.revokeObjectURL(item.origUrl);
      item.outputs?.forEach((out) => URL.revokeObjectURL(out.dataUrl));
    });
    setItems([]);
    setPreviousBatchSnapshot(null);
    setUndoToast(null);
    setProgressPercent(0);
    setStatusText('');
  };

  // Load Sample Images Pack
  const handleLoadSamples = async () => {
    setIsLoadingSamples(true);
    try {
      const sampleFiles = await Promise.all(
        SAMPLE_IMAGES.map((sample) => fetchSampleAsFile(sample))
      );
      await handleFilesSelected(sampleFiles);
    } catch (err) {
      console.error('Error loading samples:', err);
    } finally {
      setIsLoadingSamples(false);
    }
  };

  // Active targets list
  const activeTargets = useMemo(() => {
    const list = ratios
      .filter((r) => r.checked)
      .map((r) => ({
        id: r.id,
        label: r.label,
        width: r.width,
        height: r.height,
      }));

    if (customRatioEnabled && customW > 0 && customH > 0) {
      list.push({
        id: 'custom',
        label: `custom_${customW}x${customH}`,
        width: customW,
        height: customH,
      });
    }
    return list;
  }, [ratios, customRatioEnabled, customW, customH]);

  // Main Batch Processing Function
  const handleStartProcess = async () => {
    if (activeTargets.length === 0) {
      alert('Pilih minimal satu ukuran rasio untuk memproses.');
      return;
    }
    if (items.length === 0) return;

    // Save snapshot of current queue state before processing to enable Undo
    const snapshot = cloneItemsForHistory(items);
    setPreviousBatchSnapshot(snapshot);
    setUndoToast(null);

    cancelRequestedRef.current = false;
    setIsProcessing(true);
    setProgressPercent(0);

    const hashes: string[] = [];
    const updatedItems = [...items];

    for (let i = 0; i < updatedItems.length; i++) {
      if (cancelRequestedRef.current) break;

      const item = updatedItems[i];
      const progressFraction = i / updatedItems.length;
      setProgressPercent(progressFraction * 100);

      // 0. Free Tier Queue Delay: Jeda 5 detik antar-request untuk mencegah Rate Limit 429
      if (i > 0) {
        for (let sec = 5; sec > 0; sec--) {
          if (cancelRequestedRef.current) break;
          setStatusText(
            `[Antrean Free Tier: Jeda ${sec} Detik Bebas 429] Menyiapkan foto ke-${i + 1} dari ${updatedItems.length}...`
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        if (cancelRequestedRef.current) break;
      }

      setStatusText(`[${i + 1}/${updatedItems.length}] Menganalisis ${item.name}...`);

      // 1. Compute dHash for duplicate check
      const dhash = computeDHash(item.bitmap);
      item.dhash = dhash;

      if (skipDuplicates && dhash) {
        const isDuplicate = hashes.some((h) => hammingDistance(h, dhash) <= 5);
        if (isDuplicate) {
          item.status = 'duplicate';
          item.reason = 'Kemiripan visual sangat tinggi dengan foto sebelumnya.';
          setItems([...updatedItems]);
          continue;
        }
        hashes.push(dhash);
      }

      // 2. AI Analysis via server-side Gemini 3.8 Flash
      item.status = 'analyzing';
      setItems([...updatedItems]);

      let aiResult = {
        safe: true,
        flag: 'None',
        score: 75,
        reason: 'Visual foto cerah dan tajam.',
        focus: { x: 0.5, y: 0.5 },
        captionId: 'Momen berharga hari ini! Bagaimana menurut teman-teman? Komen di bawah ya! 👇',
        captionEn: 'What an incredible moment! What are your thoughts on this? Drop a comment below! 👇',
        hashtags: ['#FacebookPost', '#TrendingViral', '#ContentCreator'],
        category: 'General',
        recommendedRatio: '4:5',
      };

      const abortCtrl = new AbortController();
      const timeoutId = setTimeout(() => abortCtrl.abort(), 50000);

      try {
        const thumbCanvas = createThumbnailCanvas(item.bitmap, 768);
        const thumbBlob = await canvasToBlob(thumbCanvas, 'image/jpeg', 0.85);
        const thumbBase64 = await blobToBase64Data(thumbBlob);

        const resp = await fetch('/api/gemini/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: thumbBase64,
            mimeType: 'image/jpeg',
            language: captionLanguage,
          }),
          signal: abortCtrl.signal,
        });

        if (!resp.ok) {
          if (resp.status === 429) {
            throw new Error('Batas kuota Free Tier tercapai (429). Silakan jeda sejenak lalu klik Coba Lagi.');
          }
          throw new Error(`Server status ${resp.status}`);
        }

        const data = await resp.json();
        aiResult = {
          safe: data.safe !== false,
          flag: data.flag || 'None',
          score: typeof data.score === 'number' ? data.score : 75,
          reason: data.reason || 'Kualitas visual sangat bagus untuk feed.',
          focus: data.focus || { x: 0.5, y: 0.5 },
          captionId: data.captionId || '',
          captionEn: data.captionEn || '',
          hashtags: data.hashtags || [],
          category: data.category || 'General',
          recommendedRatio: data.recommendedRatio || '4:5',
        };
      } catch (err: any) {
        console.warn('AI analysis error on item:', item.name, err);
        // Error handling without crashing the app
        item.status = 'error';
        item.statusMessage =
          err?.name === 'AbortError'
            ? 'Timeout koneksi. Klik Coba Lagi di bawah.'
            : err?.message || 'Batas limit Free Tier tercapai sesaat. Klik Coba Lagi.';
        setItems([...updatedItems]);
        continue;
      } finally {
        clearTimeout(timeoutId);
      }

      item.safe = aiResult.safe;
      item.flag = aiResult.flag;
      item.viralScore = aiResult.score;
      item.reason = aiResult.reason;
      item.focus = aiResult.focus;

      // Handle AI Auto-Caption respecting global queue setting
      item.cachedCaptionId = aiResult.captionId;
      item.cachedCaptionEn = aiResult.captionEn;
      item.cachedHashtags = aiResult.hashtags;
      if (enableAutoCaption) {
        item.captionId = aiResult.captionId;
        item.captionEn = aiResult.captionEn;
        item.hashtags = aiResult.hashtags;
      } else {
        item.captionId = '';
        item.captionEn = '';
        item.hashtags = [];
      }

      item.category = aiResult.category;
      item.recommendedRatio = aiResult.recommendedRatio;

      // Check Community Standards filter & minimum score
      if (enableSafetyFilter) {
        const failedSafety = !aiResult.safe;
        const failedScore = aiResult.score < minViralScore;
        if (failedSafety || failedScore) {
          item.status = 'filtered';
          item.reason = failedSafety
            ? `Melanggar standar FB: ${aiResult.flag}`
            : `Skor ${aiResult.score} di bawah batas minimal ${minViralScore}`;
          setItems([...updatedItems]);
          continue;
        }
      }

      // 3. AI Enhancement (if enabled)
      let sourceBitmap: ImageBitmap | HTMLImageElement = item.bitmap;
      if (enableGeminiEnhance) {
        item.status = 'enhancing';
        setStatusText(`[${i + 1}/${updatedItems.length}] ✨ AI Enhancing ${item.name}...`);
        setItems([...updatedItems]);

        try {
          const enhanceThumb = createThumbnailCanvas(item.bitmap, 1536);
          const enhanceBlob = await canvasToBlob(enhanceThumb, 'image/jpeg', 0.9);
          const enhanceBase64 = await blobToBase64Data(enhanceBlob);

          const enhResp = await fetch('/api/gemini/enhance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: enhanceBase64, mimeType: 'image/jpeg' }),
          });

          if (enhResp.ok) {
            const enhData = await enhResp.json();
            if (enhData.imageBase64) {
              const byteCharacters = atob(enhData.imageBase64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let k = 0; k < byteCharacters.length; k++) {
                byteNumbers[k] = byteCharacters.charCodeAt(k);
              }
              const enhBlob = new Blob([new Uint8Array(byteNumbers)], {
                type: enhData.mimeType || 'image/jpeg',
              });
              const enhBitmap = await createImageBitmap(enhBlob);
              item.enhancedBitmap = enhBitmap;
              item.isAiEnhanced = true;
              sourceBitmap = enhBitmap;
            }
          }
        } catch (enhErr) {
          console.warn('Enhance error, fallback to original:', enhErr);
        }
      }

      // 4. Render All Target Ratios
      item.status = 'rendering';
      setStatusText(`[${i + 1}/${updatedItems.length}] Merender bingkai ${item.name}...`);
      setItems([...updatedItems]);

      const effectiveFocus = item.userAdjustedFocus || item.focus || { x: 0.5, y: 0.5 };
      const outputs: ProcessedRatioOutput[] = [];

      for (const target of activeTargets) {
        const canvas = renderImageToCanvas(sourceBitmap, {
          width: target.width,
          height: target.height,
          fitMode,
          bgMode,
          focus: effectiveFocus,
          watermark,
          filters,
          blurRadius,
        });

        let outputBlob = await canvasToBlob(canvas, format, quality / 100);

        // Inject AI metadata if enhanced and format is JPEG
        if (item.isAiEnhanced && enableAiMetadataTag && format === 'image/jpeg') {
          outputBlob = await tagAiMetadata(outputBlob);
        }

        const dataUrl = URL.createObjectURL(outputBlob);
        outputs.push({
          ratioId: target.id,
          ratioLabel: target.label,
          width: target.width,
          height: target.height,
          dataUrl,
          blob: outputBlob,
          sizeBytes: outputBlob.size,
        });
      }

      item.outputs = outputs;
      item.status = 'done';
      setItems([...updatedItems]);
    }

    setIsProcessing(false);
    setProgressPercent(100);
    const failedCount = updatedItems.filter((it) => it.status === 'error').length;
    if (cancelRequestedRef.current) {
      setStatusText('Proses dibatalkan oleh pengguna.');
    } else if (failedCount > 0) {
      setStatusText(`Selesai! ${failedCount} foto mengalami kendala rate limit / koneksi. Klik tombol Coba Lagi untuk mencoba kembali.`);
    } else {
      setStatusText('Selesai! Berhasil memproses antrean foto tanpa biaya (100% Free Tier).');
    }
  };

  // Retry processing a single failed item
  const handleRetrySingle = async (itemToRetry: ImageItem) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setStatusText(`Memproses ulang ${itemToRetry.name}...`);

    try {
      itemToRetry.status = 'analyzing';
      setItems([...items]);

      const thumbCanvas = createThumbnailCanvas(itemToRetry.bitmap, 768);
      const thumbBlob = await canvasToBlob(thumbCanvas, 'image/jpeg', 0.85);
      const thumbBase64 = await blobToBase64Data(thumbBlob);

      const resp = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: thumbBase64,
          mimeType: 'image/jpeg',
          language: captionLanguage,
        }),
      });

      if (!resp.ok) {
        throw new Error(
          resp.status === 429
            ? 'Batas limit Free Tier tercapai (429). Coba lagi beberapa detik lagi.'
            : `Gagal memproses (HTTP ${resp.status})`
        );
      }

      const data = await resp.json();
      itemToRetry.safe = data.safe !== false;
      itemToRetry.flag = data.flag || 'None';
      itemToRetry.viralScore = typeof data.score === 'number' ? data.score : 75;
      itemToRetry.reason = data.reason || 'Kualitas visual sangat bagus untuk feed.';
      itemToRetry.focus = data.focus || { x: 0.5, y: 0.5 };
      itemToRetry.category = data.category || 'General';
      itemToRetry.recommendedRatio = data.recommendedRatio || '4:5';

      itemToRetry.cachedCaptionId = data.captionId || '';
      itemToRetry.cachedCaptionEn = data.captionEn || '';
      itemToRetry.cachedHashtags = data.hashtags || [];

      if (enableAutoCaption) {
        itemToRetry.captionId = data.captionId || '';
        itemToRetry.captionEn = data.captionEn || '';
        itemToRetry.hashtags = data.hashtags || [];
      } else {
        itemToRetry.captionId = '';
        itemToRetry.captionEn = '';
        itemToRetry.hashtags = [];
      }

      // Render Multi-Ratio
      itemToRetry.status = 'rendering';
      setItems([...items]);

      const sourceBitmap = itemToRetry.enhancedBitmap || itemToRetry.bitmap;
      const effectiveFocus = itemToRetry.userAdjustedFocus || itemToRetry.focus;
      const outputs: ProcessedRatioOutput[] = [];

      for (const target of activeTargets) {
        const canvas = renderImageToCanvas(sourceBitmap, {
          width: target.width,
          height: target.height,
          fitMode,
          bgMode,
          focus: effectiveFocus,
          watermark,
          filters,
          blurRadius,
        });

        let outputBlob = await canvasToBlob(canvas, format, quality / 100);
        if (itemToRetry.isAiEnhanced && enableAiMetadataTag && format === 'image/jpeg') {
          outputBlob = await tagAiMetadata(outputBlob);
        }

        outputs.push({
          ratioId: target.id,
          ratioLabel: target.label,
          width: target.width,
          height: target.height,
          dataUrl: URL.createObjectURL(outputBlob),
          blob: outputBlob,
          sizeBytes: outputBlob.size,
        });
      }

      itemToRetry.outputs = outputs;
      itemToRetry.status = 'done';
      itemToRetry.statusMessage = undefined;
      setItems([...items]);
      setStatusText(`Berhasil memproses ulang ${itemToRetry.name}!`);
    } catch (err: any) {
      console.warn('Retry single error:', err);
      itemToRetry.status = 'error';
      itemToRetry.statusMessage = err?.message || 'Batas kuota tercapai. Klik Coba Lagi.';
      setItems([...items]);
      setStatusText(`Gagal memproses ulang: ${err?.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Retry all failed items with 5-second Free Tier queue delay
  const handleRetryFailed = async () => {
    if (isProcessing) return;
    const errorItems = items.filter((it) => it.status === 'error');
    if (errorItems.length === 0) return;

    setIsProcessing(true);
    setProgressPercent(0);
    cancelRequestedRef.current = false;

    for (let i = 0; i < errorItems.length; i++) {
      if (cancelRequestedRef.current) break;
      const it = errorItems[i];

      // Jeda 5 detik antar-request Free Tier
      if (i > 0) {
        for (let sec = 5; sec > 0; sec--) {
          if (cancelRequestedRef.current) break;
          setStatusText(`[Jeda Free Tier ${sec} Detik Bebas 429] Mengulang foto ${i + 1}/${errorItems.length}...`);
          await new Promise((r) => setTimeout(r, 1000));
        }
        if (cancelRequestedRef.current) break;
      }

      setStatusText(`[${i + 1}/${errorItems.length}] Memproses ulang ${it.name}...`);
      await handleRetrySingle(it);
      setProgressPercent(((i + 1) / errorItems.length) * 100);
    }

    setIsProcessing(false);
    setStatusText('Selesai memproses ulang foto yang gagal.');
  };

  // Re-render single item when user adjusts focal point
  const handleSaveFocus = async (itemId: string, newFocus: FocalPoint) => {
    const itemIdx = items.findIndex((i) => i.id === itemId);
    if (itemIdx === -1) return;

    const item = items[itemIdx];
    item.userAdjustedFocus = newFocus;

    const sourceBitmap = item.enhancedBitmap || item.bitmap;
    const outputs: ProcessedRatioOutput[] = [];

    for (const target of activeTargets) {
      const canvas = renderImageToCanvas(sourceBitmap, {
        width: target.width,
        height: target.height,
        fitMode,
        bgMode,
        focus: newFocus,
        watermark,
        filters,
        blurRadius,
      });

      let outputBlob = await canvasToBlob(canvas, format, quality / 100);
      if (item.isAiEnhanced && enableAiMetadataTag && format === 'image/jpeg') {
        outputBlob = await tagAiMetadata(outputBlob);
      }

      const dataUrl = URL.createObjectURL(outputBlob);
      outputs.push({
        ratioId: target.id,
        ratioLabel: target.label,
        width: target.width,
        height: target.height,
        dataUrl,
        blob: outputBlob,
        sizeBytes: outputBlob.size,
      });
    }

    item.outputs = outputs;
    setItems([...items]);
  };

  // Download Single Photo
  const handleDownloadSingle = (item: ImageItem, ratioId?: string) => {
    const out =
      (ratioId ? item.outputs.find((o) => o.ratioId === ratioId) : item.outputs[0]) ||
      item.outputs[0];
    if (!out) return;

    const ext = format === 'image/webp' ? '.webp' : format === 'image/png' ? '.png' : '.jpg';
    const scorePrefix = String(item.viralScore).padStart(3, '0') + '_';
    const fileName = `${scorePrefix}${item.baseName}_${out.ratioLabel}${ext}`;

    const link = document.createElement('a');
    link.href = out.dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download All as Organized ZIP with manifest.csv
  const handleDownloadZip = async () => {
    const completedItems = items.filter((i) => i.status === 'done' && i.outputs.length > 0);
    if (completedItems.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const ext = format === 'image/webp' ? '.webp' : format === 'image/png' ? '.png' : '.jpg';

      // Manifest rows
      const manifestRows: string[][] = [
        [
          'Filename',
          'Viral_Score',
          'Safe',
          'Flag',
          'Category',
          'AI_Enhanced',
          'Focal_X',
          'Focal_Y',
          'Caption_ID',
          'Caption_EN',
          'Hashtags',
          'Review_Reason',
        ],
      ];

      for (const item of completedItems) {
        const scoreStr = String(item.viralScore).padStart(3, '0');
        const effectiveFocus = item.userAdjustedFocus || item.focus || { x: 0.5, y: 0.5 };

        // Add file for each ratio into subfolders (e.g. 4x5/, 1x1/)
        for (const out of item.outputs) {
          const folder = zip.folder(out.ratioLabel) || zip;
          const outFileName = `${scoreStr}_${item.baseName}_${out.ratioLabel}${ext}`;
          folder.file(outFileName, out.blob);
        }

        // Add manifest row
        manifestRows.push([
          item.name,
          String(item.viralScore),
          item.safe ? 'YES' : 'NO',
          item.flag || 'None',
          item.category || 'General',
          item.isAiEnhanced ? 'YES' : 'NO',
          effectiveFocus.x.toFixed(3),
          effectiveFocus.y.toFixed(3),
          item.captionId || '',
          item.captionEn || '',
          item.hashtags?.join(' ') || '',
          item.reason || '',
        ]);
      }

      // Encode CSV with UTF-8 BOM so Excel opens indonesian characters cleanly
      const escapeCsv = (val: string) => `"${String(val).replace(/"/g, '""')}"`;
      const csvContent =
        '\ufeff' +
        manifestRows
          .map((row) => row.map(escapeCsv).join(','))
          .join('\r\n');

      zip.file('manifest.csv', csvContent);

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      const zipUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = `fb_page_photos_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(zipUrl);
    } catch (err) {
      console.error('ZIP generation error:', err);
      alert('Gagal membuat file ZIP: ' + (err as any)?.message);
    } finally {
      setIsZipping(false);
    }
  };

  // Compute stats
  const stats: BatchStats = useMemo(() => {
    const total = items.length;
    const processed = items.filter((i) => i.status !== 'idle').length;
    const passed = items.filter((i) => i.status === 'done').length;
    const filtered = items.filter((i) => i.status === 'filtered').length;
    const duplicates = items.filter((i) => i.status === 'duplicate').length;
    const errors = items.filter((i) => i.status === 'error').length;

    const scoredItems = items.filter((i) => i.status === 'done');
    const avgScore =
      scoredItems.length > 0
        ? Math.round(scoredItems.reduce((acc, curr) => acc + curr.viralScore, 0) / scoredItems.length)
        : 0;

    return { total, processed, passed, filtered, duplicates, errors, avgScore };
  }, [items]);

  // Filtered Items for display
  const displayedItems = useMemo(() => {
    if (gridFilterTab === 'passed') return items.filter((i) => i.status === 'done');
    if (gridFilterTab === 'filtered') return items.filter((i) => i.status === 'filtered');
    if (gridFilterTab === 'duplicate') return items.filter((i) => i.status === 'duplicate');
    if (gridFilterTab === 'error') return items.filter((i) => i.status === 'error');
    return items;
  }, [items, gridFilterTab]);

  const canDownloadZip = items.some((i) => i.status === 'done' && i.outputs.length > 0);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        onLoadSamples={handleLoadSamples}
        isLoadingSamples={isLoadingSamples}
        totalImages={items.length}
        onOpenHelp={() => setShowHelpModal(true)}
        onOpenVeoAnimate={() => {
          setVeoTargetItem(items[0] || null);
          setShowVeoModal(true);
        }}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Control Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Dropzone & Summary */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <DropZone
              onFilesSelected={handleFilesSelected}
              fileCount={items.length}
              onClearQueue={handleClearQueue}
              isProcessing={isProcessing}
            />

            {/* Quick Master Execution Bar */}
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 sm:p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span>Mulai Batch Processing</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Otomatis crop fokus subjek, moderasi aman, hitung skor viral, dan beri watermark.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleStartProcess}
                  disabled={items.length === 0 || isProcessing || activeTargets.length === 0}
                  className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>
                    {isProcessing
                      ? 'Sedang Memproses...'
                      : `Mulai Proses (${items.length} Foto)`}
                  </span>
                </button>

                {previousBatchSnapshot && !isProcessing && (
                  <button
                    onClick={handleUndoBatch}
                    className="py-3 px-3.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-400 font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                    title="Undo operasi batch terakhir & kembalikan antrean foto ke kondisi semula"
                  >
                    <Undo2 className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline">Undo Batch</span>
                  </button>
                )}

                {items.length > 0 && !isProcessing && (
                  <button
                    onClick={handleClearQueue}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                    title="Kosongkan Antrean"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">AI Visual &amp; Scene (Free):</span>
                <button
                  type="button"
                  onClick={() => {
                    setVeoTargetItem(items[0] || null);
                    setShowVeoModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>AI Visual Studio (0 Biaya)</span>
                </button>
              </div>

              {activeTargets.length === 0 && (
                <div className="text-[11px] text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Pilih minimal 1 ukuran di tab Ukuran &amp; Crop!</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Settings Panel */}
          <div className="lg:col-span-7">
            <SettingsPanel
              ratios={ratios}
              onToggleRatio={handleToggleRatio}
              customW={customW}
              customH={customH}
              onCustomWChange={setCustomW}
              onCustomHChange={setCustomH}
              customRatioEnabled={customRatioEnabled}
              onToggleCustomRatio={() => setCustomRatioEnabled(!customRatioEnabled)}
              fitMode={fitMode}
              onFitModeChange={setFitMode}
              bgMode={bgMode}
              onBgModeChange={setBgMode}
              blurRadius={blurRadius}
              onBlurRadiusChange={setBlurRadius}
              enableSafetyFilter={enableSafetyFilter}
              onToggleSafetyFilter={() => setEnableSafetyFilter(!enableSafetyFilter)}
              minViralScore={minViralScore}
              onMinViralScoreChange={setMinViralScore}
              skipDuplicates={skipDuplicates}
              onToggleSkipDuplicates={() => setSkipDuplicates(!skipDuplicates)}
              enableAutoCaption={enableAutoCaption}
              onToggleAutoCaption={handleToggleAutoCaption}
              queueItemCount={items.length}
              captionLanguage={captionLanguage}
              onCaptionLanguageChange={setCaptionLanguage}
              enableGeminiEnhance={enableGeminiEnhance}
              onToggleGeminiEnhance={() => setEnableGeminiEnhance(!enableGeminiEnhance)}
              enableAiMetadataTag={enableAiMetadataTag}
              onToggleAiMetadataTag={() => setEnableAiMetadataTag(!enableAiMetadataTag)}
              watermark={watermark}
              onUpdateWatermark={(updates) => setWatermark((prev) => ({ ...prev, ...updates }))}
              onUploadLogo={handleUploadLogo}
              filters={filters}
              onUpdateFilters={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
              format={format}
              onFormatChange={setFormat}
              quality={quality}
              onQualityChange={setQuality}
            />
          </div>
        </div>

        {/* Batch Progress Bar & Summary */}
        <BatchProgressBar
          isProcessing={isProcessing}
          progressPercent={progressPercent}
          statusText={statusText}
          onCancel={() => {
            cancelRequestedRef.current = true;
          }}
          stats={stats}
          canDownloadZip={canDownloadZip}
          onDownloadZip={handleDownloadZip}
          isZipping={isZipping}
          canUndo={Boolean(previousBatchSnapshot && !isProcessing)}
          onUndo={handleUndoBatch}
        />

        {/* Undo Toast Notification */}
        {undoToast && (
          <div className="bg-amber-500/15 border border-amber-500/40 rounded-2xl px-4 py-3 text-amber-200 text-xs flex items-center justify-between gap-2 shadow-lg animate-fade-in">
            <div className="flex items-center gap-2">
              <Undo2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-semibold">{undoToast}</span>
            </div>
            <button
              onClick={() => setUndoToast(null)}
              className="text-amber-400 hover:text-amber-200 text-xs font-bold px-2 py-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error Alert Banner with Try Again Button */}
        {stats.errors > 0 && (
          <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-200 animate-fadeIn shadow-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-100 text-sm">
                  {stats.errors} Foto Membutuhkan Percobaan Ulang (Limit Free Tier / Koneksi)
                </span>
                <p className="text-[11px] text-rose-300/80 mt-0.5">
                  Batas kuota Free Tier tercapai sesaat atau koneksi terputus. Klik tombol di samping untuk mencoba lagi dengan proteksi jeda 5 detik otomatis tanpa perlu mengulang foto yang sudah selesai.
                </p>
              </div>
            </div>
            <button
              onClick={handleRetryFailed}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-600/30 transition shrink-0 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Coba Lagi ({stats.errors} Foto)</span>
            </button>
          </div>
        )}

        {/* Gallery / Results Grid Section */}
        {items.length > 0 && (
          <div className="space-y-4">
            {/* Filter Tabs & Count */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setGridFilterTab('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    gridFilterTab === 'all'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Semua ({items.length})
                </button>

                <button
                  onClick={() => setGridFilterTab('passed')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                    gridFilterTab === 'passed'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Lolos ({stats.passed})</span>
                </button>

                <button
                  onClick={() => setGridFilterTab('filtered')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                    gridFilterTab === 'filtered'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>Disaring ({stats.filtered})</span>
                </button>

                <button
                  onClick={() => setGridFilterTab('duplicate')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                    gridFilterTab === 'duplicate'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>Duplikat ({stats.duplicates})</span>
                </button>

                {stats.errors > 0 && (
                  <button
                    onClick={() => setGridFilterTab('error')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                      gridFilterTab === 'error'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Gagal ({stats.errors})</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {previousBatchSnapshot && !isProcessing && (
                  <button
                    onClick={handleUndoBatch}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    title="Batalkan hasil pemrosesan batch terakhir dan kembalikan antrean foto"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Undo Batch</span>
                  </button>
                )}

                <div className="text-xs text-slate-400 font-medium">
                  Menampilkan {displayedItems.length} foto
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {displayedItems.map((item) => (
                <ImageCard
                  key={item.id}
                  item={item}
                  onOpenFocalModal={(targetItem) => setActiveFocalItem(targetItem)}
                  onOpenMockupModal={(targetItem) => setActiveMockupItem(targetItem)}
                  onDownloadSingle={handleDownloadSingle}
                  onAnimateVeo={(targetItem) => {
                    setVeoTargetItem(targetItem);
                    setShowVeoModal(true);
                  }}
                  onRetrySingle={handleRetrySingle}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State when no photos uploaded */}
        {items.length === 0 && (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-1">
              <LayoutGrid className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-200">Belum Ada Foto dalam Antrean</h3>
            <p className="text-xs text-slate-400 max-w-md">
              Tarik foto atau folder ke kotak di atas, atau klik tombol di bawah untuk mencoba dengan paket foto demo berkualitas tinggi.
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
              <button
                onClick={handleLoadSamples}
                disabled={isLoadingSamples}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isLoadingSamples ? 'Memuat Demo...' : 'Coba Demo Sekarang'}</span>
              </button>

              <button
                onClick={() => {
                  setVeoTargetItem(null);
                  setShowVeoModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Buka AI Visual Studio (Free)</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Interactive Modals */}
      {activeFocalItem && (
        <FocalPointModal
          item={activeFocalItem}
          onClose={() => setActiveFocalItem(null)}
          onSaveFocus={handleSaveFocus}
          fitMode={fitMode}
          bgMode={bgMode}
          watermark={watermark}
          filters={filters}
        />
      )}

      {activeMockupItem && (
        <FacebookMockupModal
          item={activeMockupItem}
          onClose={() => setActiveMockupItem(null)}
          pageName={watermark.text?.replace(/^@/, '') || 'Facebook Page Creator'}
        />
      )}

      {showHelpModal && (
        <HelpModal onClose={() => setShowHelpModal(false)} />
      )}

      {showVeoModal && (
        <VeoAnimateModal
          isOpen={showVeoModal}
          onClose={() => setShowVeoModal(false)}
          selectedItem={veoTargetItem}
          items={items}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          FB Page Batch Resizer &amp; AI Optimizer Pro • Powered by Gemini 3.8 Flash • Smart Crop &amp; Facebook Feed Algorithm Ready
        </p>
      </footer>
    </div>
  );
}
