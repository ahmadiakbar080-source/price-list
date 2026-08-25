import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FullPageLoader } from '@/components/ui/Spinner';
import { DownloadIcon } from '@/components/icons';
import { listProducts } from '@/services/products';
import { getDraftSettings } from '@/services/settings';
import { ensureBuiltinWebfont } from '@/utils/assets';
import { formatJalaliDate, formatNumber } from '@/utils/format';
import type { AppSettings, Product } from '@/types';

/**
 * نسخه قابل چاپ — فقط برای ادمین. دکمه «ذخیره PDF» همان دیالوگ چاپ مرورگر است
 * (گزینه Save as PDF). بدون کتابخانه اضافه؛ فونت فارسی بی‌نقص.
 */
export default function PrintPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    Promise.all([getDraftSettings(), listProducts()])
      .then(([s, p]) => {
        setSettings(s);
        setProducts(p.filter((x) => x.isActive));
        ensureBuiltinWebfont(s.fontFamily);
      })
      .catch((e) => {
        console.error(e);
        setFailed(true);
      });
  }, []);

  if (failed) return <FullPageLoader label="خطا در بارگذاری. دوباره تلاش کنید." />;
  if (!settings || !products) return <FullPageLoader label="در حال آماده‌سازی…" />;

  const total = products.reduce((sum, p) => sum + p.price, 0);

  return (
    <div dir="rtl" className="min-h-screen bg-white p-6 text-slate-900 print:p-0" style={{ fontFamily: `'${settings.fontFamily}', Vazirmatn, Tahoma, sans-serif` }}>
      {/* نوار ابزار — در چاپ مخفی می‌شود */}
      <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between print:hidden">
        <p className="text-xs text-slate-500">
          در پنجره چاپ، گزینه «Save as PDF / ذخیره به‌صورت PDF» را انتخاب کنید.
        </p>
        <Button onClick={() => window.print()}>
          <DownloadIcon /> چاپ / ذخیره PDF
        </Button>
      </div>

      <div className="mx-auto max-w-3xl">
        <header className="mb-4 border-b-2 border-slate-800 pb-3 text-center">
          <h1 className="text-xl font-black">{settings.brandName}</h1>
          <h2 className="mt-1 text-sm">{settings.listTitle}</h2>
          <p className="mt-1 text-[11px] text-slate-500">
            تاریخ: {formatJalaliDate(new Date().toISOString())} — تعداد اقلام: {formatNumber(products.length)}
          </p>
        </header>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-xs">
              <th className="border border-slate-300 p-1.5">#</th>
              <th className="border border-slate-300 p-1.5">تصویر</th>
              <th className="border border-slate-300 p-1.5">نام محصول</th>
              <th className="border border-slate-300 p-1.5">قیمت مصرف‌کننده</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.id} className={i % 2 ? 'bg-slate-50' : ''}>
                <td className="border border-slate-300 p-1.5 text-center tabular-nums">{formatNumber(i + 1)}</td>
                <td className="border border-slate-300 p-1.5 text-center">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="mx-auto h-10 w-10 object-contain" />
                  ) : (
                    '—'
                  )}
                </td>
                <td className="border border-slate-300 p-1.5 text-center font-semibold">{p.name}</td>
                <td className="border border-slate-300 p-1.5 text-center tabular-nums font-bold">
                  {formatNumber(p.price)} {settings.currency}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-black">
              <td colSpan={3} className="border border-slate-300 p-1.5 text-center">جمع کل</td>
              <td className="border border-slate-300 p-1.5 text-center tabular-nums">
                {formatNumber(total)} {settings.currency}
              </td>
            </tr>
          </tfoot>
        </table>

        <p className="mt-3 text-center text-[10px] text-slate-400 print:hidden">
          (این برگه از پیش‌نویس فعلی ساخته شده — برای نسخه منتشرشده، اول تغییرات را Publish کنید.)
        </p>
      </div>
    </div>
  );
}