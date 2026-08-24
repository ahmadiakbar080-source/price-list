import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PriceListDocument } from '@/components/public/PriceListDocument';
import { Button } from '@/components/ui/Button';
import { FullPageLoader } from '@/components/ui/Spinner';
import { RocketIcon, WarningIcon } from '@/components/icons';
import { useToast } from '@/hooks/useToast';
import { GENERIC_ERROR } from '@/lib/constants';
import { listProducts } from '@/services/products';
import { listCategories } from '@/services/categories';
import { getDraftSettings, toPublicSettings } from '@/services/settings';
import type { AppSettings, Category, Product } from '@/types';

/**
 * Renders the CURRENT DRAFT exactly as customers would see it after publish.
 * The public page (/) reads PUBLISHED data instead — this distinction matters.
 */
export function PreviewPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [failed, setFailed] = useState(false);

 useEffect(() => {
  void Promise.all([
    getDraftSettings(),
    listProducts(),
    listCategories(),
  ])
    .then(([s, p, cats]) => {
      setSettings(toPublicSettings(s));
      setProducts(p.filter((x) => x.isActive));
      setCategories(cats);
    })
    .catch((e) => {
      console.error('[preview]', e);
      setFailed(true);
      toast.error(GENERIC_ERROR);
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  if (failed)
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
        خطا در بارگذاری پیش‌نمایش. لطفاً دوباره تلاش کنید.
      </div>
    );
  if (!settings || !products) return <FullPageLoader label="در حال آماده‌سازی پیش‌نمایش…" />;

  return (
    <div className="pb-10">
      {/* بنر «این فقط پیش‌نمایش است» */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="flex items-center gap-2 text-sm leading-6 text-amber-800">
          <WarningIcon className="shrink-0 text-lg" />
          این <b>پیش‌نمایشِ پیش‌نویس</b> است؛ مشتریان همچنان آخرین نسخه منتشرشده را می‌بینند.
        </p>
        <Link to="/admin/publish">
          <Button size="sm">
            <RocketIcon /> انتشار تغییرات
          </Button>
        </Link>
      </div>

      {/* قاب پیش‌نمایش — همان کامپوننت صفحه عمومی ولی با داده DRAFT */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-inner">
       <PriceListDocument
  settings={settings}
  products={products}
  categories={categories}
  lastPublishedAt={new Date().toISOString()}
  isPreview
/>
      </div>
    </div>
  );
}