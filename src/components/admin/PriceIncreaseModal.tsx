import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PercentIcon } from '@/components/icons';
import { useToast } from '@/hooks/useToast';
import { GENERIC_ERROR } from '@/lib/constants';
import { applyPriceChange, updateProduct } from '@/services/products';
import { formatNumber } from '@/utils/format';
import type { Category, Product } from '@/types';

interface Props {
  open: boolean;
  /** اگر پر باشد = حالت تکی؛ null = حالت گروهی */
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onApplied: () => void;
}

const ROUND_OPTIONS = [
  { value: 0, label: 'بدون گرد کردن' },
  { value: 1000, label: 'گرد به ۱,۰۰۰' },
  { value: 10000, label: 'گرد به ۱۰,۰۰۰' },
  { value: 100000, label: 'گرد به ۱۰۰,۰۰۰' },
];

type Scope = 'all' | 'active' | 'category';

const radioLabel =
  'flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 cursor-pointer hover:border-indigo-400';

export function PriceIncreaseModal({ open, product, categories, onClose, onApplied }: Props) {
  const toast = useToast();
  const [scope, setScope] = useState<Scope>('active');
  const [categoryId, setCategoryId] = useState('');
  const [percentText, setPercentText] = useState('');
  const [roundTo, setRoundTo] = useState(1000);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPercentText('');
    setRoundTo(product ? 0 : 1000);
    setScope('active');
    setCategoryId('');
  }, [open, product]);

  const percent = Number(percentText.replace(/[^\d.-]/g, ''));
  const validPercent = Number.isFinite(percent) && percent >= -90 && percent <= 100 && percentText !== '';

  const previewPrice = (() => {
    if (!product || !validPercent) return null;
    const raw = product.price * (1 + percent / 100);
    return roundTo > 1 ? Math.round(raw / roundTo) * roundTo : Math.round(raw);
  })();

const apply = async () => {
  if (!validPercent) {
    toast.error('درصد را بین -90 تا 100 وارد کنید.');
    return;
  }

  if (!product && scope === 'category' && !categoryId) {
    toast.error('دسته‌بندی را انتخاب کنید.');
    return;
  }

  setBusy(true);

  try {
    if (product) {
      await updateProduct(product.id, { price: previewPrice ?? product.price });
      toast.success(`قیمت «${product.name}» به‌روزرسانی شد.`);
    } else {
      const count = await applyPriceChange({
        percent,
        categoryId: scope === 'category' ? categoryId || null : null,
        onlyActive: scope === 'active',
        roundTo,
      });

      toast.success(
        count > 0
          ? `قیمت ${formatNumber(count)} محصول به‌روزرسانی شد.`
          : 'هیچ محصولی با این شرایط پیدا نشد.',
      );
    }

    onApplied();
    onClose();
  } catch (e) {
    console.error(e);
    toast.error(GENERIC_ERROR);
  } finally {
    setBusy(false);
  }
};
  return (
    <Modal open={open} title={product ? 'تغییر قیمت این محصول' : 'تغییر قیمت گروهی با درصد'} onClose={busy ? () => undefined : onClose}>
      <div className="space-y-4">
        {/* درصد */}
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">درصد تغییر</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              dir="ltr"
              step="0.1"
              value={percentText}
              disabled={busy}
              onChange={(e) => setPercentText(e.target.value)}
              placeholder="مثلاً 10 یا -5"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-left text-sm tabular-nums outline-none focus:border-indigo-500"
            />
            <PercentIcon className="shrink-0 text-xl text-slate-400" />
          </div>
          <p className="mt-1 text-xs text-slate-400">مثبت = افزایش، منفی = کاهش (بین -۹۰ تا ۱۰۰)</p>
        </label>

        {/* پیش‌نمایش حالت تکی */}
        {product && previewPrice != null && (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            قیمت فعلی: <b className="tabular-nums">{formatNumber(product.price)}</b> ← قیمت جدید:{' '}
            <b className="tabular-nums text-indigo-600">{formatNumber(previewPrice)}</b>
          </p>
        )}

        {/* دامنه (فقط گروهی) */}
        {!product && (
          <>
            <div className="grid gap-2 sm:grid-cols-3">
              <label className={radioLabel}>
                <input type="radio" name="scope" checked={scope === 'active'} onChange={() => setScope('active')} />
                فقط فعال‌ها
              </label>
              <label className={radioLabel}>
                <input type="radio" name="scope" checked={scope === 'all'} onChange={() => setScope('all')} />
                همه محصولات
              </label>
              <label className={radioLabel}>
                <input type="radio" name="scope" checked={scope === 'category'} onChange={() => setScope('category')} />
                یک دسته‌بندی
              </label>
            </div>

            {scope === 'category' && (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500"
              >
                <option value="">— انتخاب دسته —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">گرد کردن قیمت نهایی</span>
              <select
                value={roundTo}
                onChange={(e) => setRoundTo(Number(e.target.value))}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500"
              >
                {ROUND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
          این تغییر روی <b>پیش‌نویس</b> اعمال می‌شود؛ مشتریان پس از «انتشار تغییرات» آن را می‌بینند.
        </p>

        <div className="flex justify-start gap-2">
          <Button onClick={() => void apply()} loading={busy}>
            اعمال تغییر
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            انصراف
          </Button>
        </div>
      </div>
    </Modal>
  );
}