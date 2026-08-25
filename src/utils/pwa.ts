import type { AppSettings } from '@/types';

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

/** ثبت سرویس‌ورکر (فقط production) — فقط فایل‌های استاتیک immutable کش می‌شوند؛ دیتا هرگز. */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('[pwa] sw:', e));
  });
}

function iconMime(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase();
  if (ext === 'svg') return 'image/svg+xml';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  return 'image/png';
}

/**
 * مانیفست داینامیک: آیکون، نام و رنگ‌ها از تنظیمات منتشرشده گرفته می‌شود —
 * یعنی «افزودن به صفحه اصلی» با لوگوی خودِ شما انجام می‌شود.
 */
export function applyDynamicManifest(s: AppSettings): void {
  try {
    const icons = s.logoUrl
      ? [
          { src: s.logoUrl, sizes: '512x512', type: iconMime(s.logoUrl), purpose: 'any' },
          { src: s.logoUrl, sizes: '192x192', type: iconMime(s.logoUrl), purpose: 'any' },
        ]
      : [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }];

    const manifest = {
      name: `${s.brandName} — ${s.listTitle}`,
      short_name: s.brandName,
      lang: 'fa',
      dir: 'rtl',
      start_url: '.',
      scope: '/',
      display: 'standalone',
      background_color: s.backgroundColor,
      theme_color: s.primaryColor,
      icons,
    };

    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    if (link.href.startsWith('blob:')) URL.revokeObjectURL(link.href);
    link.href = URL.createObjectURL(blob);
  } catch (e) {
    console.warn('[pwa] manifest:', e);
  }
}

/** گرفتن رویداد نصب برای دکمه «افزودن به صفحه اصلی». تابع unsubscribe برمی‌گرداند. */
export function listenInstallPrompt(cb: (installer: (() => Promise<void>) | null) => void): () => void {
  let deferred: BIPEvent | null = null;
  const handler = (e: Event) => {
    e.preventDefault();
    deferred = e as BIPEvent;
    cb(async () => {
      await deferred?.prompt();
      await deferred?.userChoice;
      deferred = null;
      cb(null);
    });
  };
  window.addEventListener('beforeinstallprompt', handler);
  return () => window.removeEventListener('beforeinstallprompt', handler);
}