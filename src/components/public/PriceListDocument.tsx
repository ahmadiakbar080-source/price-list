import { useEffect, useMemo, useState } from 'react';
import { ClockIcon, ImageIcon, SearchIcon } from '@/components/icons';
import { CUSTOM_FONT_FAMILY } from '@/lib/constants';
import { ensureBuiltinWebfont } from '@/utils/assets';
import { formatJalaliDate, formatNumber, normalizeForSearch } from '@/utils/format';
import type { AppSettings, Product } from '@/types';

interface Props {
  settings: AppSettings;
  products: Product[];
  lastPublishedAt: string | null;
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
/* پس‌زمینه: رنگ انتخابی + یک لایه گرادیان خاکستری-آبی روش تا هیچ‌وقت سفید خالی نباشد */
.pl-root{background:
  linear-gradient(180deg, rgba(51,65,85,.20) 0%, rgba(51,65,85,.07) 35%, rgba(51,65,85,.16) 100%),
  ${s.backgroundColor};}

.pl-surface{background:rgba(255,255,255,.78);}
.pl-search{background:rgba(255,255,255,.85);border:1px solid rgba(100,116,139,.25);border-radius:calc(var(--pl-radius) * .9);}
.pl-table-wrap{border:1px solid rgba(100,116,139,.16);border-radius:var(--pl-radius);overflow:hidden;
  background:rgba(255,255,255,.55);
  box-shadow:0 14px 40px -22px rgba(15,23,42,.35);}
.pl-table{width:100%;border-collapse:separate;border-spacing:0;font-size:var(--pl-fs);}
.pl-table th{text-align:center;font-size:.76em;font-weight:700;letter-spacing:.02em;color:#475569;
  padding:.7rem .8rem;background:rgba(241,245,249,.95);
  border-bottom:1px solid rgba(100,116,139,.18);white-space:nowrap;}
.pl-table td{padding:calc(var(--pl-gap)/2 + 6px) .8rem;vertical-align:middle;
  border-bottom:1px solid rgba(100,116,139,.10);}
.pl-table tbody tr:last-child td{border-bottom:none;}

/* ---- ردیف‌های زوج و فرد ---- */
.pl-table tbody tr{transition:background .15s ease;}
.pl-table tbody tr:nth-child(even){background:rgba(100,116,139,.10);}
.pl-table[data-style='striped'] tbody tr:nth-child(even){background:rgba(100,116,139,.18);}
.pl-table tbody tr:hover{background:rgba(100,116,139,.14);}

/* ---- عرض ستون‌ها ---- */
.pl-table col.c-img{width:calc(var(--pl-img) + 1.9rem);}
.pl-table col.c-price{width:7.6rem;}

/* تصویر وسط ستون خودش */
.pl-table td:first-child .pl-thumb{margin-inline:auto;}
.pl-thumb{width:var(--pl-img);height:var(--pl-img);flex:0 0 auto;display:flex;align-items:center;justify-content:center;overflow:hidden;
  background:rgba(255,255,255,.95);border:1px solid rgba(100,116,139,.14);border-radius:calc(var(--pl-radius)*.6);}
.pl-thumb img{width:100%;height:100%;object-fit:contain;display:block;padding:2px;}

/* نام محصول: وسط‌چین (هم سلول، هم هدر ستون) */
.pl-name{font-weight:600;word-break:break-word;text-align:center;}

/* قیمت: دوخطی — عدد بالا، «تومان» خیلی ریز زیرش */
.pl-table td:last-child{text-align:center;}

/* قیمت: دوخطی — عدد بالا، «تومان» خیلی ریز زیرش */
.pl-price{color:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;
  width:100%;margin-inline:auto;gap:1px;
  line-height:1.3;font-variant-numeric:tabular-nums;}
.pl-price-num{font-size:.8em;font-weight:600;white-space:nowrap;}
.pl-price-cur{font-size:.5em;font-weight:500;opacity:.65;white-space:nowrap;}

/* حالت خط‌کشی‌شده */
.pl-table[data-style='bordered'] th,
.pl-table[data-style='bordered'] td{border:1px solid rgba(100,116,139,.16);}

/* ---- موبایل: جدول فشرده بدون اسکرول افقی ---- */
@media (max-width:640px){
  .pl-table{font-size:calc(var(--pl-fs)*.88);}
  .pl-table th{padding:.55rem .5rem;font-size:.7em;}
  .pl-table td{padding:calc(var(--pl-gap)/2 + 3px) .5rem;}
  .pl-table col.c-price{width:6.4rem;}
  .pl-thumb{width:calc(var(--pl-img)*.85);height:calc(var(--pl-img)*.85);}
}
`;
}

/**
 * The single renderer shared by the PUBLIC page (published data)
 * and the ADMIN PREVIEW (draft data) — preview always matches reality.
 */
export function PriceListDocument({ settings, products, lastPublishedAt }: Props) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    ensureBuiltinWebfont(settings.fontFamily);
  }, [settings.fontFamily]);

  const filtered = useMemo(() => {
    const q = normalizeForSearch(query);
    if (!q) return products;
    return products.filter((p) => normalizeForSearch(p.name).includes(q));
  }, [products, query]);

  const dateLabel = settings.showUpdateDate && lastPublishedAt ? formatJalaliDate(lastPublishedAt) : null;

  return (
    <div className="pl-root min-h-screen">
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
        </header>

        {/* ---------- Search ---------- */}
        <div className="relative mx-auto mt-7 max-w-md">
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

        {/* ---------- Table (all screen sizes) ---------- */}
        <main className="mt-7">
          {filtered.length === 0 ? (
            <div className="py-16 text-center opacity-70">
              <ImageIcon className="mx-auto mb-3 text-4xl opacity-40" />
              <p className="text-sm font-medium">
                {query ? 'محصولی با این نام پیدا نشد.' : 'هنوز محصولی منتشر نشده است.'}
              </p>
            </div>
          ) : (
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
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="pl-thumb">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} loading="lazy" decoding="async" />
                          ) : (
                            <ImageIcon className="text-lg opacity-30" />
                          )}
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>

        <footer className="mt-12 text-center text-[11px] opacity-50">
          همه قیمت‌ها به «{settings.currency}» است — {settings.brandName}
        </footer>
      </div>
    </div>
  );
}