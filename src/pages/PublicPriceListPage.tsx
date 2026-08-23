import { useCallback, useEffect, useState } from 'react';
import { PriceListDocument } from '@/components/public/PriceListDocument';
import { Button } from '@/components/ui/Button';
import { FullPageLoader } from '@/components/ui/Spinner';
import { WarningIcon } from '@/components/icons';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { getPublicPriceList } from '@/services/publicCatalog';
import type { PublicPriceListData } from '@/types';

/**
 * Public customer-facing page.
 * Reads ONLY the published snapshot (database-enforced via RLS).
 * Re-fetches silently when the tab becomes visible again (§39 freshness).
 */
export function PublicPriceListPage() {
  const [data, setData] = useState<PublicPriceListData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await getPublicPriceList());
    } catch (e) {
      console.error('[public] load failed:', e);
      setError('خطا در دریافت اطلاعات. لطفاً دوباره تلاش کنید.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  useDocumentMeta(
    data ? `${data.settings.listTitle} | ${data.settings.brandName}` : 'لیست قیمت محصولات',
    data ? `لیست قیمت محصولات ${data.settings.brandName} — ${data.settings.listTitle}` : undefined,
  );

  if (error) {
    return (
      <div dir="rtl" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
        <WarningIcon className="text-4xl text-amber-500" />
        <p className="text-sm text-slate-600">{error}</p>
        <Button onClick={() => void load()}>تلاش مجدد</Button>
      </div>
    );
  }

  if (!data) return <FullPageLoader label="در حال دریافت لیست قیمت…" />;

  return <PriceListDocument settings={data.settings} products={data.products} lastPublishedAt={data.lastPublishedAt} />;
}