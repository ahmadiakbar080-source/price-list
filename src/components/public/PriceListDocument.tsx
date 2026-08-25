import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ClockIcon,
  CompareIcon,
  HeartIcon,
  ImageIcon,
  PlusIcon,
  SearchIcon,
  ShareIcon,
  TagIcon,
} from '@/components/icons';
import { CompareModal } from '@/components/public/CompareModal';
import { ImageLightbox } from '@/components/public/ImageLightbox';
import { ProductDetailModal } from '@/components/public/ProductDetailModal';
import { CUSTOM_FONT_FAMILY } from '@/lib/constants';
import { useToast } from '@/hooks/useToast';
import { ensureBuiltinWebfont } from '@/utils/assets';
import { formatJalaliDate, formatNumber, normalizeForSearch } from '@/utils/format';
import { getFavorites, toggleFavorite } from '@/utils/favorites';
import { shareOrCopy } from '@/utils/share';
import { applyDynamicManifest, listenInstallPrompt } from '@/utils/pwa';
import { cn } from '@/utils/cn';
import type { AppSettings, Category, Product } from '@/types';

interface Props {
  settings: AppSettings;
  products: Product[];
  categories: Category[];
  lastPublishedAt: string | null;
  isPreview?: boolean;
}

const PAGE_SIZE = 50;
const MAX_COMPARE = 4;

function getPageNumbers(current: number, total: number): Array<number | '…'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: Array<number | '…'> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push('…');
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push('…');
  out.push(total);
  return out;
}

function CategoryChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold shadow-sm transition',
        active
          ? 'border-indigo-600 bg-indigo-600 text-white'
          : 'border-slate-300 bg-white/85 text-slate-600 hover:border-indigo-300 hover:text-indigo-600',
      )}
    >
      {label}
      <span className={cn('ms-1 tabular-nums', active ? 'opacity-80' : 'opacity-50')}>
        ({formatNumber(count)})
      </span>
    </button>
  );
}

function buildCss(s: AppSettings): string {
  const stack =
    s.fontFamily === 'custom'
      ? `'${CUSTOM_FONT_FAMILY}', Vazirmatn, Tahoma, sans-serif`
      : `'${s.fontFamily}', Vazirmatn, Tahoma, sans-serif`;
  const face =
    s.fontFamily === 'custom' && s.customFontUrl
      ? `@font-face{font-family:'${CUSTOM_FONT_FAMILY}';src:url('${s.customFontUrl}');font-display:swap;}`
      : '';

  return `${face}
.pl-root{font-family:${stack};color:${s.textColor};
  --pl-primary:${s.primaryColor};--pl-radius:${s.borderRadius}px;--pl-gap:${s.rowSpacing}px;
  --pl-fs:${s.baseFontSize}px;--pl-img:${s.imageSize}px;}
.pl-root{background:
  linear-gradient(180deg, rgba(51,65,85,.20) 0%, rgba(51,65,85,.07) 35%, rgba(51,65,85,.16) 100%),
  ${s.backgroundColor};}

/* ---------- تمپلیت لیکوید گلس ---------- */
.pl-root[data-template='liquid-glass']{background:
  radial-gradient(1100px 600px at 85% -10%, rgba(99,102,241,.30), transparent 60%),
  radial-gradient(900px 500px at -10% 25%, rgba(14,165,233,.26), transparent 55%),
  radial-gradient(900px 600px at 50% 115%, rgba(236,72,153,.22), transparent 60%),
  linear-gradient(180deg,#eef2ff 0%,#f8fafc 45%,#eef2ff 100%);}
.pl-root[data-template='liquid-glass'] .pl-surface{background:rgba(255,255,255,.5);backdrop-filter:blur(12px);}
.pl-root[data-template='liquid-glass'] .pl-search{background:rgba(255,255,255,.45);
  backdrop-filter:blur(14px) saturate(160%);-webkit-backdrop-filter:blur(14px) saturate(160%);
  border:1px solid rgba(255,255,255,.7);border-radius:999px;box-shadow:0 10px 30px -18px rgba(30,41,59,.4);}
.pl-root[data-template='liquid-glass'] .pl-table-wrap{background:rgba(255,255,255,.38);
  backdrop-filter:blur(18px) saturate(170%);-webkit-backdrop-filter:blur(18px) saturate(170%);
  border:1px solid rgba(255,255,255,.65);border-radius:calc(var(--pl-radius) + 10px);
  box-shadow:0 25px 60px -30px rgba(30,41,59,.45);}
.pl-root[data-template='liquid-glass'] .pl-table th{background:rgba(255,255,255,.45);border-bottom:1px solid rgba(255,255,255,.7);}
.pl-root[data-template='liquid-glass'] .pl-table td{border-bottom:1px solid rgba(255,255,255,.35);}
.pl-root[data-template='liquid-glass'] .pl-table tbody tr:nth-child(even){background:rgba(255,255,255,.32);}
.pl-root[data-template='liquid-glass'] .pl-table tbody tr:hover{background:rgba(255,255,255,.55);}
.pl-root[data-template='liquid-glass'] .pl-thumb{background:rgba(255,255,255,.75);border-color:rgba(255,255,255,.8);}

/* ---------- اجزای مشترک ---------- */
.pl-surface{background:rgba(255,255,255,.78);}
.pl-search{background:rgba(255,255,255,.85);border:1px solid rgba(100,116,139,.25);border-radius:calc(var(--pl-radius) * .9);}
.pl-table-wrap{border:1px solid rgba(100,116,139,.16);border-radius:var(--pl-radius);overflow:hidden;
  background:rgba(255,255,255,.55);box-shadow:0 14px 40px -22px rgba(15,23,42,.35);}
.pl-table{width:100%;border-collapse:separate;border-spacing:0;font-size:var(--pl-fs);}
.pl-table th{text-align:center;font-size:.76em;font-weight:700;letter-spacing:.02em;color:#475569;
  padding:.7rem .8rem;background:rgba(241,245,249,.95);border-bottom:1px solid rgba(100,116,139,.18);white-space:nowrap;}
.pl-table td{padding:calc(var(--pl-gap)/2 + 6px) .8rem;vertical-align:middle;border-bottom:1px solid rgba(100,116,139,.10);}
.pl-table tbody tr:last-child td{border-bottom:none;}
.pl-table tbody tr{transition:background .15s ease;cursor:pointer;}
.pl-table tbody tr:nth-child(even){background:rgba(100,116,139,.10);}
.pl-table[data-style='striped'] tbody tr:nth-child(even){background:rgba(100,116,139,.18);}
.pl-table tbody tr:hover{background:rgba(100,116,139,.14);}

.pl-table col.c-img{width:calc(var(--pl-img) + 1.9rem);}
.pl-table col.c-price{width:7.6rem;}
.pl-table td:first-child .pl-thumb{margin-inline:auto;}
.pl-thumb{position:relative;width:var(--pl-img);height:var(--pl-img);flex:0 0 auto;display:flex;
  align-items:center;justify-content:center;overflow:visible;
  background:rgba(255,255,255,.95);border:1px solid rgba(100,116,139,.14);border-radius:calc(var(--pl-radius)*.6);}
.pl-thumb > img{width:100%;height:100%;object-fit:contain;display:block;padding:2px;border-radius:inherit;}
.pl-thumb > svg{opacity:.3;}

/* دکمه‌های شناور روی تصویر: علاقه‌مندی (بالا) و مقایسه (پایین) */
.pl-fab{position:absolute;z-index:2;width:24px;height:24px;display:flex;align-items:center;justify-content:center;
  padding:0;border-radius:999px;background:rgba(255,255,255,.96);border:1px solid rgba(100,116,139,.3);
  color:#64748b;box-shadow:0 2px 6px rgba(15,23,42,.18);transition:all .15s ease;cursor:pointer;}
.pl-fab svg{width:13px;height:13px;}
.pl-fav{top:-9px;inset-inline-start:-9px;}
.pl-comp{bottom:-9px;inset-inline-end:-9px;}
.pl-fab:hover{color:var(--pl-primary);border-color:var(--pl-primary);transform:scale(1.1);}
.pl-fav.active{color:#e11d48;border-color:#e11d48;}
.pl-fav.active svg{fill:#e11d48;}
.pl-comp.active{background:var(--pl-primary);border-color:var(--pl-primary);color:#fff;}

.pl-name{font-weight:600;word-break:break-word;text-align:center;}
.pl-table td:last-child{text-align:center;}
.pl-price{color:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;
  width:100%;margin-inline:auto;gap:1px;line-height:1.3;font-variant-numeric:tabular-nums;}
.pl-price-num{font-size:.8em;font-weight:600;white-space:nowrap;}
.pl-price-cur{font-size:.5em;font-weight:500;opacity:.65;white-space:nowrap;}

.pl-table[data-style='bordered'] th,
.pl-table[data-style='bordered'] td{border:1px solid rgba(100,116,139,.16);}

/* نوار مقایسه شناور */
.pl-compare-bar{position:fixed;bottom:14px;left:14px;right:14px;z-index:60;margin-inline:auto;max-width:34rem;
  display:flex;align-items:center;justify-content:space-between;gap:10px;padding:.65rem .9rem;border-radius:16px;
  background:rgba(15,23,42,.92);color:#fff;box-shadow:0 18px 50px -18px rgba(15,23,42,.6);backdrop-filter:blur(8px);}

@media (max-width:640px){
  .pl-table{font-size:calc(var(--pl-fs)*.88);}
  .pl-table th{padding:.55rem .5rem;font-size:.7em;}
  .pl-table td{padding:calc(var(--pl-gap)/2 + 3px) .5rem;}
  .pl-table col.c-price{width:6.4rem;}
  .pl-thumb{width:calc(var(--pl-img)*.85);height:calc(var(--pl-img)*.85);}
  .pl-fab{width:26px;height:26px;}
}
`;
}

export function PriceListDocument({
  settings,
  products,
  categories,
  lastPublishedAt,
  isPreview = false,
}: Props) {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<string>('all');
  const [favOnly, setFavOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [favorites, setFavorites] = useState<string[]>(() => getFavorites());
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const [installer, setInstaller] = useState<(() => Promise<void>) | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureBuiltinWebfont(settings.fontFamily);
  }, [settings.fontFamily]);

  // PWA: مانیفست داینامیک با لوگو/رنگ برند (فقط صفحه عمومی)
  useEffect(() => {
    if (isPreview) return;
    applyDynamicManifest(settings);
  }, [settings, isPreview]);

  // PWA: دکمه نصب (وقتی مرورگر اجازه دهد)
  useEffect(() => {
    if (isPreview) return;
    return listenInstallPrompt(setInstaller);
  }, [isPreview]);

  useEffect(() => {
    setPage(1);
  }, [query, activeCat, favOnly]);

  const filtered = useMemo(() => {
    let list = products;
    if (favOnly) list = list.filter((p) => favorites.includes(p.id));
    if (activeCat !== 'all') list = list.filter((p) => p.categoryId === activeCat);
    const q = normalizeForSearch(query);
    if (q) list = list.filter((p) => normalizeForSearch(p.name).includes(q));
    return list;
  }, [products, query, activeCat, favOnly, favorites]);

  const favCount = useMemo(
    () => products.filter((p) => favorites.includes(p.id)).length,
    [products, favorites],
  );

  const compareProducts = useMemo(
    () => products.filter((p) => compareIds.includes(p.id)),
    [products, compareIds],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const goToPage = (p: number) => {
    setPage(p);
    requestAnimationFrame(() => {
      tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const toggleFav = (id: string) => setFavorites(toggleFavorite(id));

  const toggleCompare = (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter((x) => x !== id));
      return;
    }
    if (compareIds.length >= MAX_COMPARE) {
      toast.info(`حداکثر ${formatNumber(MAX_COMPARE)} محصول قابل مقایسه است.`);
      return;
    }
    setCompareIds([...compareIds, id]);
  };

  const shareList = async () => {
    try {
      const res = await shareOrCopy({
        title: settings.brandName,
        text: `${settings.brandName} — ${settings.listTitle}`,
        url: window.location.origin + window.location.pathname,
      });
      if (res === 'copied') toast.success('لینک لیست قیمت کپی شد.');
    } catch (e) {
      console.error(e);
      toast.error('خطا در اشتراک‌گذاری. لطفاً دوباره تلاش کنید.');
    }
  };

  const dateLabel =
    settings.showUpdateDate && lastPublishedAt ? formatJalaliDate(lastPublishedAt) : null;

  return (
    <div className="pl-root min-h-screen" data-template={settings.template}>
      <style>{buildCss(settings)}</style>

      <div className="mx-auto w-full max-w-3xl px-3 pb-16 pt-10 sm:px-6">
        {/* ---------- Header ---------- */}
        <header className="text-center">
          {settings.showLogo && settings.logoUrl && (
            <img
              src={settings.logoUrl}
              alt={settings.brandName}
              className="mx-auto mb-4 h-16 w-16 rounded-2xl object-contain"
            />
          )}
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{settings.brandName}</h1>
          <h2 className="mt-1.5 text-sm font-medium opacity-70 sm:text-base">{settings.listTitle}</h2>

          {dateLabel && (
            <p className="pl-surface mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs opacity-75">
              <ClockIcon className="text-sm" />
              آخرین به‌روزرسانی: {dateLabel}
            </p>
          )}

          {!isPreview && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => void shareList()}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white/85 px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600"
              >
                <ShareIcon />
                اشتراک‌گذاری لیست قیمت
              </button>
              {installer && (
                <button
                  type="button"
                  onClick={() => void installer()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-100"
                >
                  <PlusIcon />
                  نصب اپلیکیشن
                </button>
              )}
            </div>
          )}
        </header>

        {/* ---------- Search ---------- */}
        <div className="relative mx-auto mt-6 max-w-md">
          <SearchIcon className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 text-base opacity-40" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی محصول…"
            aria-label="جستجوی محصول"
            className="pl-search h-11 w-full pe-10 ps-4 text-sm outline-none transition focus:ring-2 focus:ring-indigo-300/60"
          />
        </div>

        {/* ---------- Category + Favorites chips ---------- */}
        {(categories.length > 0 || favCount > 0) && (
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1.5" role="tablist" aria-label="دسته‌بندی‌ها">
            <CategoryChip
              active={activeCat === 'all' && !favOnly}
              label="همه"
              count={products.length}
              onClick={() => {
                setActiveCat('all');
                setFavOnly(false);
              }}
            />
            {categories.map((c) => (
              <CategoryChip
                key={c.id}
                active={activeCat === c.id && !favOnly}
                label={c.name}
                count={products.filter((p) => p.categoryId === c.id).length}
                onClick={() => {
                  setActiveCat(c.id);
                  setFavOnly(false);
                }}
              />
            ))}
            {favCount > 0 && (
              <CategoryChip
                active={favOnly}
                label="♥ علاقه‌مندی‌ها"
                count={favCount}
                onClick={() => setFavOnly((v) => !v)}
              />
            )}
          </div>
        )}

        {/* ---------- Table ---------- */}
        <main className="mt-4" ref={tableRef}>
          {filtered.length === 0 ? (
            <div className="py-16 text-center opacity-70">
              {favOnly ? (
                <HeartIcon className="mx-auto mb-3 text-4xl opacity-40" />
              ) : activeCat !== 'all' && query === '' ? (
                <TagIcon className="mx-auto mb-3 text-4xl opacity-40" />
              ) : (
                <ImageIcon className="mx-auto mb-3 text-4xl opacity-40" />
              )}
              <p className="text-sm font-medium">
                {favOnly
                  ? 'هنوز محصولی به علاقه‌مندی‌ها اضافه نکرده‌اید. روی ♥ روی تصویر محصولات بزنید.'
                  : query
                    ? 'محصولی با این نام پیدا نشد.'
                    : activeCat !== 'all'
                      ? 'محصولی در این دسته‌بندی منتشر نشده است.'
                      : 'هنوز محصولی منتشر نشده است.'}
              </p>
            </div>
          ) : (
            <>
              <p className="mb-2 text-center text-[11px] opacity-50">
                کلیک روی محصول: جزئیات و اشتراک‌گذاری — کلیک روی تصویر: بزرگنمایی — ♥: علاقه‌مندی
              </p>

              <div className="pl-table-wrap">
                <table className="pl-table" data-style={settings.tableStyle}>
                  <colgroup>
                    <col className="c-img" />
                    <col />
                    <col className="c-price" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col">تصویر</th>
                      <th scope="col">نام محصول</th>
                      <th scope="col">قیمت مصرف‌کننده</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((p) => {
                      const isFav = favorites.includes(p.id);
                      const inCompare = compareIds.includes(p.id);
                      return (
                        <tr key={p.id} onClick={() => setDetail(p)}>
                          <td
                            onClick={(e) => {
                              if (p.imageUrl) {
                                e.stopPropagation();
                                setLightbox({ src: p.imageUrl, alt: p.name });
                              }
                            }}
                          >
                            <div className="pl-thumb">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} loading="lazy" decoding="async" />
                              ) : (
                                <ImageIcon className="text-lg" />
                              )}
                              <button
                                type="button"
                                aria-label={isFav ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
                                className={cn('pl-fab pl-fav', isFav && 'active')}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFav(p.id);
                                }}
                              >
                                <HeartIcon />
                              </button>
                              <button
                                type="button"
                                aria-label={inCompare ? 'حذف از مقایسه' : 'افزودن به مقایسه'}
                                className={cn('pl-fab pl-comp', inCompare && 'active')}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCompare(p.id);
                                }}
                              >
                                <CompareIcon />
                              </button>
                            </div>
                          </td>
                          <td className="pl-name">{p.name}</td>
                          <td>
                            <div className="pl-price">
                              <span className="pl-price-num">{formatNumber(p.price)}</span>
                              <span className="pl-price-cur">{settings.currency}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ---------- Pagination ---------- */}
              {pageCount > 1 && (
                <nav className="mt-5 flex flex-col items-center gap-3" aria-label="صفحه‌بندی">
                  <p className="text-xs opacity-60 tabular-nums">
                    صفحه {formatNumber(safePage)} از {formatNumber(pageCount)} — مجموع{' '}
                    {formatNumber(filtered.length)} محصول
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => goToPage(safePage - 1)}
                      disabled={safePage <= 1}
                      className="rounded-lg border border-slate-300 bg-white/90 px-3 py-1.5 text-xs font-medium shadow-sm transition hover:bg-white disabled:pointer-events-none disabled:opacity-40"
                    >
                      قبلی
                    </button>

                    {getPageNumbers(safePage, pageCount).map((n, idx) =>
                      n === '…' ? (
                        <span key={`e-${idx}`} className="px-1 text-xs opacity-50">
                          …
                        </span>
                      ) : (
                        <button
                          key={n}
                          type="button"
                          onClick={() => goToPage(n)}
                          aria-current={n === safePage ? 'page' : undefined}
                          className={cn(
                            'min-w-8 rounded-lg px-2.5 py-1.5 text-xs font-bold tabular-nums shadow-sm transition',
                            n === safePage
                              ? 'bg-indigo-600 text-white'
                              : 'border border-slate-300 bg-white/90 hover:bg-white',
                          )}
                        >
                          {formatNumber(n)}
                        </button>
                      ),
                    )}

                    <button
                      type="button"
                      onClick={() => goToPage(safePage + 1)}
                      disabled={safePage >= pageCount}
                      className="rounded-lg border border-slate-300 bg-white/90 px-3 py-1.5 text-xs font-medium shadow-sm transition hover:bg-white disabled:pointer-events-none disabled:opacity-40"
                    >
                      بعدی
                    </button>
                  </div>
                </nav>
              )}
            </>
          )}
        </main>

        <footer className="mt-12 text-center text-[11px] opacity-50">
          همه قیمت‌ها به «{settings.currency}» است — {settings.brandName}
        </footer>
      </div>

      {/* ---------- Compare bar ---------- */}
      {!isPreview && compareIds.length > 0 && (
        <div className="pl-compare-bar">
          <span className="text-xs font-bold">
            {formatNumber(compareIds.length)} محصول برای مقایسه انتخاب شد
          </span>
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCompareIds([])}
              className="rounded-lg px-2.5 py-1.5 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              پاک کردن
            </button>
            <button
              type="button"
              disabled={compareIds.length < 2}
              onClick={() => setCompareOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-bold transition hover:bg-indigo-400 disabled:pointer-events-none disabled:opacity-40"
            >
              <CompareIcon />
              مقایسه
            </button>
          </span>
        </div>
      )}

      {/* ---------- Modals ---------- */}
      {detail && (
        <ProductDetailModal
          product={detail}
          categoryName={categories.find((c) => c.id === detail.categoryId)?.name ?? null}
          settings={settings}
          onZoomImage={(src, alt) => setLightbox({ src, alt })}
          onClose={() => setDetail(null)}
        />
      )}

      {compareOpen && compareProducts.length >= 2 && (
        <CompareModal
          products={compareProducts}
          categories={categories}
          settings={settings}
          onRemove={(id) => {
            setCompareIds(compareIds.filter((x) => x !== id));
            if (compareIds.length <= 2) setCompareOpen(false);
          }}
          onClose={() => setCompareOpen(false)}
        />
      )}

      {lightbox && (
        <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}