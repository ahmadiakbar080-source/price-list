export interface SharePayload {
  title: string;
  text: string;
  url: string;
}

/**
 * Web Share API (موبایل: واتساپ/تلگرام/…).
 * اگر پشتیبانی نشد یا کاربر لغو کرد → fallback: کپی لینک.
 */
export async function shareOrCopy(payload: SharePayload): Promise<'shared' | 'copied' | 'cancelled'> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share(payload);
      return 'shared';
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return 'cancelled'; // کاربر لغو کرد
      console.warn('[share] native share failed, falling back to clipboard:', err);
    }
  }
  await navigator.clipboard.writeText(`${payload.text}\n${payload.url}`);
  return 'copied';
}

export function whatsappUrl(p: SharePayload): string {
  return `https://wa.me/?text=${encodeURIComponent(`${p.text}\n${p.url}`)}`;
}

export function telegramUrl(p: SharePayload): string {
  return `https://t.me/share/url?url=${encodeURIComponent(p.url)}&text=${encodeURIComponent(p.text)}`;
}