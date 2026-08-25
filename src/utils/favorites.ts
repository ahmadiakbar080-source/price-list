const KEY = 'pl-favorites-v1';

/**
 * علاقه‌مندی مشتری روی همان دستگاه/مرورگر ذخیره می‌شود (localStorage).
 * عمدی است: مشتری حساب کاربری ندارد و این «تنظیمات شخصی دستگاه» است،
 * نه دیتای کسب‌وکار — دیتای اصلی همچنان فقط Supabase است.
 */
export function getFavorites(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function setFavorites(ids: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify([...new Set(ids)]));
  } catch {
    /* حالت ناشناس/پر بودن حافظه — نادیده بگیر */
  }
}

export function toggleFavorite(id: string): string[] {
  const next = getFavorites().includes(id)
    ? getFavorites().filter((x) => x !== id)
    : [...getFavorites(), id];
  setFavorites(next);
  return next;
}