/*
 * سرویس‌ورکر مینیمال و «ضد کهنگی»:
 * فقط باندل‌های immutable (/assets/) کش می‌شوند؛
 * صفحات و دیتا همیشه از شبکه می‌آیند تا قیمت‌ها هرگز قدیمی نشوند.
 */
const CACHE = 'pl-static-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;            // Supabase و … → عبور مستقیم
  if (!url.pathname.startsWith('/assets/')) return;      // فقط باندل‌های build

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    }),
  );
});