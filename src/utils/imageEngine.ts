import { FocalPoint, WatermarkConfig, StudioFilterConfig, FitMode, BlurBackgroundMode } from '../types';

/**
 * Convert canvas to Blob
 */
export function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      mimeType,
      quality
    );
  });
}

/**
 * Convert Blob to Base64 (data only without prefix)
 */
export function blobToBase64Data(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const commaIdx = res.indexOf(',');
      resolve(commaIdx !== -1 ? res.slice(commaIdx + 1) : res);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Create a resized thumbnail canvas for faster AI processing & upload
 */
export function createThumbnailCanvas(
  source: ImageBitmap | HTMLImageElement,
  maxDimension: number = 768
): HTMLCanvasElement {
  const scale = Math.min(1, maxDimension / Math.max(source.width, source.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  }
  return canvas;
}

/**
 * 64-bit Difference Hash (dHash) for duplicate detection
 */
export function computeDHash(source: ImageBitmap | HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = 9;
  canvas.height = 8;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.drawImage(source, 0, 0, 9, 8);
  const imgData = ctx.getImageData(0, 0, 9, 8).data;
  
  // Grayscale luminance conversion: 0.299R + 0.587G + 0.114B
  const gray = (i: number) =>
    imgData[i] * 0.299 + imgData[i + 1] * 0.587 + imgData[i + 2] * 0.114;

  let hash = '';
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const idxLeft = (y * 9 + x) * 4;
      const idxRight = (y * 9 + x + 1) * 4;
      hash += gray(idxLeft) > gray(idxRight) ? '1' : '0';
    }
  }
  return hash;
}

/**
 * Calculate Hamming Distance between two 64-bit hashes
 */
export function hammingDistance(hashA: string, hashB: string): number {
  if (hashA.length !== hashB.length) return 64;
  let dist = 0;
  for (let i = 0; i < hashA.length; i++) {
    if (hashA[i] !== hashB[i]) dist++;
  }
  return dist;
}

interface RenderOptions {
  width: number;
  height: number;
  fitMode: FitMode;
  bgMode: BlurBackgroundMode;
  focus: FocalPoint;
  watermark: WatermarkConfig;
  filters: StudioFilterConfig;
  blurRadius?: number;
}

/**
 * Render image with smart crop, containment, blur fill, filters, and watermark
 */
export function renderImageToCanvas(
  source: ImageBitmap | HTMLImageElement,
  options: RenderOptions
): HTMLCanvasElement {
  const { width: W, height: H, fitMode, bgMode, focus, watermark, filters, blurRadius = 26 } = options;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const srcW = source.width;
  const srcH = source.height;

  // Background rendering
  if (fitMode === 'cover') {
    // Smart Subject Cover centering around focal point
    const scale = Math.max(W / srcW, H / srcH);
    const scaledW = srcW * scale;
    const scaledH = srcH * scale;

    // Shift viewport to focus point while preventing black borders
    const targetX = W / 2 - focus.x * scaledW;
    const targetY = H / 2 - focus.y * scaledH;

    const posX = Math.min(0, Math.max(W - scaledW, targetX));
    const posY = Math.min(0, Math.max(H - scaledH, targetY));

    ctx.drawImage(source, posX, posY, scaledW, scaledH);
  } else {
    // Contain Mode
    if (bgMode === 'blur') {
      // Blurred ambient background
      const bgScale = Math.max(W / srcW, H / srcH);
      const bgW = srcW * bgScale;
      const bgH = srcH * bgScale;
      const bgX = (W - bgW) / 2;
      const bgY = (H - bgH) / 2;

      ctx.save();
      ctx.filter = `blur(${blurRadius}px) brightness(0.75) saturate(1.2)`;
      // Oversize slightly to prevent edge bleed
      ctx.drawImage(source, bgX - 20, bgY - 20, bgW + 40, bgH + 40);
      ctx.restore();

      // Soft dark overlay to separate foreground
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(0, 0, W, H);
    } else if (bgMode === 'black') {
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, W, H);
    } else if (bgMode === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
    } else if (bgMode === 'gradient') {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // Foreground image contained
    const fgScale = Math.min(W / srcW, H / srcH);
    const fgW = srcW * fgScale;
    const fgH = srcH * fgScale;
    const fgX = (W - fgW) / 2;
    const fgY = (H - fgH) / 2;

    ctx.save();
    // Subtle drop shadow behind contained photo
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = Math.round(W * 0.015);
    ctx.drawImage(source, fgX, fgY, fgW, fgH);
    ctx.restore();
  }

  // Apply Studio Filters if enabled
  if (filters.enabled) {
    applyStudioColorGrading(ctx, W, H, filters);
  }

  // Draw Watermark
  if (watermark.enabled) {
    drawWatermark(ctx, W, H, watermark);
  }

  return canvas;
}

/**
 * Apply fast canvas contrast and clarity adjustments
 */
function applyStudioColorGrading(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filters: StudioFilterConfig
) {
  if (filters.contrast === 0 && filters.brightness === 0 && filters.vibrance === 0 && filters.sharpness === 0) {
    return;
  }

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const contrastFactor = (259 * (filters.contrast + 255)) / (255 * (259 - filters.contrast));
  const brightnessOffset = (filters.brightness / 100) * 255;
  const vibranceFactor = filters.vibrance / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Brightness
    if (filters.brightness !== 0) {
      r += brightnessOffset;
      g += brightnessOffset;
      b += brightnessOffset;
    }

    // Contrast
    if (filters.contrast !== 0) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    // Vibrance (boosts less saturated colors more)
    if (filters.vibrance !== 0) {
      const max = Math.max(r, g, b);
      const avg = (r + g + b) / 3;
      const amt = ((Math.abs(max - avg) * 2) / 255) * vibranceFactor;
      r += (max - r) * amt;
      g += (max - g) * amt;
      b += (max - b) * amt;
    }

    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  ctx.putImageData(imgData, 0, 0);

  // Unsharp mask approximation if sharpness > 0
  if (filters.sharpness > 20) {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = (filters.sharpness / 100) * 0.25;
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.restore();
  }
}

/**
 * Draw Text or Logo Watermark
 */
function drawWatermark(ctx: CanvasRenderingContext2D, W: number, H: number, wm: WatermarkConfig) {
  ctx.save();
  ctx.globalAlpha = Math.max(0.1, Math.min(1, wm.opacity));

  const marginX = Math.round(W * 0.035);
  const marginY = Math.round(H * 0.035);

  if (wm.customLogoImg) {
    // Draw Logo
    const logoW = Math.round(W * 0.16);
    const logoAspect = wm.customLogoImg.width / wm.customLogoImg.height;
    const logoH = Math.round(logoW / logoAspect);

    let x = W - logoW - marginX;
    let y = H - logoH - marginY;

    if (wm.position === 'bottom-left') {
      x = marginX;
      y = H - logoH - marginY;
    } else if (wm.position === 'top-right') {
      x = W - logoW - marginX;
      y = marginY;
    } else if (wm.position === 'top-left') {
      x = marginX;
      y = marginY;
    } else if (wm.position === 'center') {
      x = (W - logoW) / 2;
      y = (H - logoH) / 2;
    }

    if (wm.hasShadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = Math.round(W * 0.012);
    }
    ctx.drawImage(wm.customLogoImg, x, y, logoW, logoH);
  } else if (wm.text && wm.text.trim().length > 0) {
    // Draw Text Watermark
    const fontSize = Math.max(14, Math.round(W * (wm.fontSizeRatio || 0.032)));
    ctx.font = `700 ${fontSize}px "Plus Jakarta Sans", -apple-system, sans-serif`;
    ctx.fillStyle = wm.color || '#ffffff';

    if (wm.hasShadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = Math.round(fontSize * 0.35);
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
    }

    let x = W - marginX;
    let y = H - marginY;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';

    if (wm.position === 'bottom-left') {
      x = marginX;
      y = H - marginY;
      ctx.textAlign = 'left';
    } else if (wm.position === 'top-right') {
      x = W - marginX;
      y = marginY + fontSize;
      ctx.textAlign = 'right';
    } else if (wm.position === 'top-left') {
      x = marginX;
      y = marginY + fontSize;
      ctx.textAlign = 'left';
    } else if (wm.position === 'center') {
      x = W / 2;
      y = H / 2;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
    } else if (wm.position === 'bottom-center') {
      x = W / 2;
      y = H - marginY;
      ctx.textAlign = 'center';
    }

    ctx.fillText(wm.text, x, y);
  }

  ctx.restore();
}

/**
 * Inject AI XMP/IPTC metadata tag for JPEG images
 */
export async function tagAiMetadata(blob: Blob): Promise<Blob> {
  if (blob.type !== 'image/jpeg') return blob;
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Verify JPEG SOI marker (0xFF, 0xD8)
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return blob;

    const xmpPayload =
      'http://ns.adobe.com/xap/1.0/\x00' +
      '<x:xmpmeta xmlns:x="adobe:ns:meta/">' +
      '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">' +
      '<rdf:Description rdf:about="" xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" xmlns:xmp="http://ns.adobe.com/xap/1.0/">' +
      '<Iptc4xmpExt:DigitalSourceType>http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia</Iptc4xmpExt:DigitalSourceType>' +
      '<xmp:CreatorTool>FB Page Batch Resizer & Gemini AI</xmp:CreatorTool>' +
      '</rdf:Description></rdf:RDF></x:xmpmeta>';

    const encodedXmp = new TextEncoder().encode(xmpPayload);
    const length = encodedXmp.length + 2;
    if (length > 65535) return blob;

    // Create APP1 marker (0xFF, 0xE1)
    const out = new Uint8Array(bytes.length + encodedXmp.length + 4);
    out.set(bytes.subarray(0, 2), 0); // SOI
    out.set([0xff, 0xe1, length >> 8, length & 0xff], 2); // APP1 + Length
    out.set(encodedXmp, 6);
    out.set(bytes.subarray(2), 6 + encodedXmp.length);

    return new Blob([out], { type: 'image/jpeg' });
  } catch (err) {
    console.warn('Could not inject AI metadata:', err);
    return blob;
  }
}
