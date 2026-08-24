import { Modal } from '@/components/ui/Modal';
import { ChatIcon, CopyIcon, ImageIcon, SendIcon, ShareIcon, TagIcon, ZoomInIcon } from '@/components/icons';
import { useToast } from '@/hooks/useToast';
import { GENERIC_ERROR } from '@/lib/constants';
import { formatNumber } from '@/utils/format';
import { shareOrCopy, telegramUrl, whatsappUrl, type SharePayload } from '@/utils/share';
import type { AppSettings, Product } from '@/types';

interface Props {
  product: Product;
  categoryName: string | null;
  settings: AppSettings;
  onZoomImage: (src: string, alt: string) => void;
  onClose: () => void;
}

const BTN_PRIMARY =
  'inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-indigo-700';
const BTN_SECONDARY =
  'inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50';

export function ProductDetailModal({ product, categoryName, settings, onZoomImage, onClose }: Props) {
  const toast = useToast();

  const payload: SharePayload = {
    title: settings.brandName,
    text: `${product.name} — ${formatNumber(product.price)} ${settings.currency}`,
    url: window.location.origin + window.location.pathname,
  };

  const share = async () => {
    try {
      const res = await shareOrCopy(payload);
      if (res === 'copied') toast.success('لینک محصول کپی شد.');
      // 'shared' یعنی شیت اشتراک سیستم باز/ارسال شد؛ 'cancelled' یعنی کاربر لغو کرد
    } catch (e) {
      console.error(e);
      toast.error(GENERIC_ERROR);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${payload.text}\n${payload.url}`);
      toast.success('لینک محصول کپی شد.');
    } catch (e) {
      console.error(e);
      toast.error(GENERIC_ERROR);
    }
  };

  return (
    <Modal open title="جزئیات محصول" onClose={onClose}>
      <div className="space-y-4">
        {/* تصویر — کلیک = زوم */}
        <button
          type="button"
          onClick={() => product.imageUrl && onZoomImage(product.imageUrl, product.name)}
          className="relative mx-auto block w-full max-w-xs overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition hover:border-indigo-300"
          aria-label="نمایش تصویر بزرگ"
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="mx-auto max-h-64 w-full object-contain p-2"
            />
          ) : (
            <span className="flex h-36 items-center justify-center text-slate-300">
              <ImageIcon className="text-5xl" />
            </span>
          )}
          {product.imageUrl && (
            <span className="absolute bottom-2 end-2 flex items-center gap-1 rounded-full bg-slate-900/70 px-2.5 py-1 text-[10px] text-white">
              <ZoomInIcon className="text-xs" />
              بزرگنمایی
            </span>
          )}
        </button>

        {/* اطلاعات */}
        <div className="space-y-2 text-center">
          <h3 className="text-base font-extrabold text-slate-900">{product.name}</h3>
          {categoryName && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
              <TagIcon className="text-xs" />
              {categoryName}
            </span>
          )}
          <p className="text-xl font-black tabular-nums text-slate-900">
            {formatNumber(product.price)}
            <span className="ms-1 text-xs font-medium text-slate-500">{settings.currency}</span>
          </p>
        </div>

        {/* توضیحات */}
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="mb-1 text-xs font-bold text-slate-500">توضیحات</p>
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {product.description?.trim() || 'توضیحاتی برای این محصول ثبت نشده است.'}
          </p>
        </div>

        {/* اشتراک‌گذاری */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {typeof navigator.share === 'function' && (
            <button type="button" onClick={() => void share()} className={BTN_PRIMARY}>
              <ShareIcon /> اشتراک‌گذاری
            </button>
          )}
          <a href={whatsappUrl(payload)} target="_blank" rel="noreferrer" className={BTN_SECONDARY}>
            <ChatIcon /> واتساپ
          </a>
          <a href={telegramUrl(payload)} target="_blank" rel="noreferrer" className={BTN_SECONDARY}>
            <SendIcon /> تلگرام
          </a>
          <button type="button" onClick={() => void copyLink()} className={BTN_SECONDARY}>
            <CopyIcon /> کپی لینک
          </button>
        </div>
      </div>
    </Modal>
  );
}