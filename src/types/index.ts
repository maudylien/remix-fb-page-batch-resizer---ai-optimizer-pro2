export interface AspectRatioPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  label: string;
  description: string;
  checked: boolean;
  recommendedFor?: string;
}

export type FitMode = 'cover' | 'contain';
export type BlurBackgroundMode = 'blur' | 'black' | 'white' | 'gradient';

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  fontSizeRatio: number; // e.g. 0.035
  opacity: number; // 0.1 to 1.0
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center' | 'bottom-center';
  color: string;
  hasShadow: boolean;
  customLogoUrl?: string;
  customLogoImg?: HTMLImageElement | null;
}

export interface StudioFilterConfig {
  enabled: boolean;
  sharpness: number; // 0 to 100
  contrast: number; // -50 to 50
  vibrance: number; // -50 to 50
  brightness: number; // -50 to 50
}

export interface FocalPoint {
  x: number; // 0.0 to 1.0
  y: number; // 0.0 to 1.0
}

export interface ProcessedRatioOutput {
  ratioId: string;
  ratioLabel: string;
  width: number;
  height: number;
  dataUrl: string;
  blob: Blob;
  sizeBytes: number;
}

export interface ImageItem {
  id: string;
  file: File;
  name: string;
  baseName: string;
  origWidth: number;
  origHeight: number;
  origUrl: string;
  bitmap: ImageBitmap | HTMLImageElement;
  dhash?: string;
  status: 'idle' | 'analyzing' | 'enhancing' | 'rendering' | 'done' | 'filtered' | 'duplicate' | 'error';
  statusMessage?: string;
  
  // AI Metrics
  safe: boolean;
  flag: string;
  viralScore: number;
  reason: string;
  category: string;
  focus: FocalPoint;
  userAdjustedFocus?: FocalPoint;
  captionId: string;
  captionEn: string;
  hashtags: string[];
  cachedCaptionId?: string;
  cachedCaptionEn?: string;
  cachedHashtags?: string[];
  recommendedRatio?: string;
  isAiEnhanced: boolean;
  enhancedBitmap?: ImageBitmap | HTMLImageElement | null;
  
  // Rendered Results
  outputs: ProcessedRatioOutput[];
}

export interface BatchStats {
  total: number;
  processed: number;
  passed: number;
  filtered: number;
  duplicates: number;
  errors: number;
  avgScore: number;
}
