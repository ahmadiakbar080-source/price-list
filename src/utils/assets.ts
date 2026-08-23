import { GENERIC_ERROR } from '@/lib/constants';

export function extensionOf(fileName: string): string {
  const i = fileName.lastIndexOf('.');
  return i >= 0 ? fileName.slice(i + 1).toLowerCase() : '';
}

export function mimeForExtension(ext: string): string {
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'woff':
      return 'font/woff';
    case 'woff2':
      return 'font/woff2';
    case 'ttf':
      return 'font/ttf';
    default:
      return 'application/octet-stream';
  }
}

function assertSize(file: File, maxMB: number): void {
  if (file.size <= 0) throw new Error('فایل خالی است.');
  if (file.size > maxMB * 1024 * 1024) {
    throw new Error(`حجم فایل باید کمتر از ${maxMB} مگابایت باشد.`);
  }
}

export function assertImage(file: File, allowedExt: readonly string[], maxMB: number): void {
  assertSize(file, maxMB);
  const ext = extensionOf(file.name);
  if (!(allowedExt as readonly string[]).includes(ext)) {
    throw new Error('فرمت فایل مجاز نیست. فرمت‌های مجاز: JPG، PNG، WEBP');
  }
}

export function assertFont(file: File, maxMB: number): void {
  assertSize(file, maxMB);
  const ext = extensionOf(file.name);
  if (!['woff', 'woff2', 'ttf'].includes(ext)) {
    throw new Error('فرمت فونت مجاز نیست. فرمت‌های مجاز: WOFF، WOFF2، TTF');
  }
}

/**
 * Build a resized variant URL for Supabase Storage public images
 * (uses Storage image transformations; falls back to the original URL).
 */
export function optimizedImageUrl(url: string | null, width: number): string | null {
  if (!url) return null;
  if (url.includes('/storage/v1/object/public/')) {
    const transformed = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
    const sep = transformed.includes('?') ? '&' : '?';
    return `${transformed}${sep}width=${width}&quality=80`;
  }
  return url;
}

// ---------------------------------------------------------------------------
// Webfont loading (built-in, freely licensed fonts via CDN)
// ---------------------------------------------------------------------------
const BUILTIN_FONT_CSS: Record<string, string> = {
  Vazirmatn: 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css',
  Shabnam: 'https://cdn.jsdelivr.net/gh/rastikerdar/shabnam-font@v5.0.1/dist/font-face.css',
  Estedad: 'https://cdn.jsdelivr.net/gh/aminabedi68/Estedad/dist/font-face.css',
};

/** Injects the stylesheet for a built-in Persian font once (idempotent). */
export function ensureBuiltinWebfont(fontFamily: string): void {
  const href = BUILTIN_FONT_CSS[fontFamily];
  if (!href) return;
  if (document.querySelector(`link[data-pl-font="${fontFamily}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.dataset.plFont = fontFamily;
  document.head.appendChild(link);
}