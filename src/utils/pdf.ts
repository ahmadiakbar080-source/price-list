import type { AppSettings, Category, Product } from '@/types';
import { formatJalaliDate, formatNumber } from './format';

function esc(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * خروجی PDF برای مدیر: پنجره چاپ با همان فونت فارسی باز می‌شود و
 * کاربر «Save as PDF» انتخاب می‌کند. روی داده DRAFT (پنل) کار می‌کند.
 */
export function printPriceList(s: AppSettings, products: Product[], categories: Category[]): void {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    alert('مرورگر اجازه باز شدن پنجره چاپ را نداد. Pop-up این سایت را مجاز کنید.');
    return;
  }

  const face =
    s.fontFamily === 'custom' && s.customFontUrl
      ? `@font-face{font-family:'PLCustomFont';src:url('${s.customFontUrl}');}`
      : '';
  const fam = s.fontFamily === 'custom' ? `'PLCustomFont',Vazirmatn,Tahoma` : `'${s.fontFamily}',Vazirmatn,Tahoma`;
  const builtinCss =
    s.fontFamily === 'Vazirmatn'
      ? 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css'
      : s.fontFamily === 'Shabnam'
        ? 'https://cdn.jsdelivr.net/gh/rastikerdar/shabnam-font@v5.0.1/dist/font-face.css'
        : s.fontFamily === 'Estedad'
          ? 'https://cdn.jsdelivr.net/gh/aminabedi68/Estedad/dist/font-face.css'
          : '';

  const catName = (id: string | null) =>
    esc(categories.find((c) => c.id === id)?.name ?? '—');

  const rows = products
    .map(
      (p, i) => `
      <tr>
        <td class="c">${formatNumber(i + 1)}</td>
        <td class="c">${p.imageUrl ? `<img src="${esc(p.imageUrl)}" alt=""/>` : '—'}</td>
        <td>${esc(p.name)}</td>
        <td>${catName(p.categoryId)}</td>
        <td class="c price">${formatNumber(p.price)} <small>${esc(s.currency)}</small></td>
      </tr>`,
    )
    .join('');

  const dateStr = formatJalaliDate(new Date().toISOString());

  win.document.write(`<!doctype html>
<html lang="fa" dir="rtl"><head><meta charset="utf-8"/>
<title>${esc(s.brandName)} — ${esc(s.listTitle)}</title>
${builtinCss ? `<link rel="stylesheet" href="${builtinCss}"/>` : ''}
<style>
${face}
@page{size:A4;margin:12mm;}
body{font-family:${fam},sans-serif;color:${s.textColor};margin:0;}
header{text-align:center;border-bottom:3px solid ${s.primaryColor};padding-bottom:10px;margin-bottom:14px;}
header h1{margin:0;font-size:20px;}
header p{margin:4px 0 0;font-size:12px;color:#64748b;}
table{width:100%;border-collapse:collapse;font-size:12px;}
th{background:${s.primaryColor};color:#fff;padding:7px 6px;border:1px solid ${s.primaryColor};}
td{padding:6px;border:1px solid #cbd5e1;vertical-align:middle;}
tbody tr:nth-child(even){background:#f1f5f9;}
.c{text-align:center;}
td img{width:42px;height:42px;object-fit:contain;display:block;margin:auto;}
.price{font-weight:700;white-space:nowrap;}
.price small{font-weight:400;font-size:9px;color:#64748b;}
footer{margin-top:14px;text-align:center;font-size:10px;color:#94a3b8;}
</style></head><body>
<header>
  <h1>${esc(s.listTitle)}</h1>
  <p>${esc(s.brandName)} — آخرین به‌روزرسانی: ${dateStr} — تعداد: ${formatNumber(products.length)} محصول</p>
</header>
<table>
  <thead><tr><th>#</th><th>تصویر</th><th>نام محصول</th><th>دسته‌بندی</th><th>قیمت مصرف‌کننده</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<footer>همه قیمت‌ها به «${esc(s.currency)}» است — ${esc(s.brandName)}</footer>
</body></html>`);
  win.document.close();

  // بعد از بارگذاری فونت‌ها/عکس‌ها چاپ را باز کن
  window.setTimeout(() => {
    win.focus();
    win.print();
  }, 900);
}