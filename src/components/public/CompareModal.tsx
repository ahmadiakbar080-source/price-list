import { Modal } from '@/components/ui/Modal';
import { ImageIcon, TagIcon, XIcon } from '@/components/icons';
import { formatNumber } from '@/utils/format';
import type { AppSettings, Category, Product } from '@/types';

interface Props {
  products: Product[];
  categories: Category[];
  settings: AppSettings;
  onRemove: (id: string) => void;
  onClose: () => void;
}

/** مقایسه حضوری تا ۴ محصول، ستونی. */
export function CompareModal({ products, categories, settings, onRemove, onClose }: Props) {
  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? '—';

  return (
    <Modal open title={`مقایسه محصولات (${products.length})`} onClose={onClose} maxWidth="sm:max-w-3xl">
      {products.length < 2 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          برای مقایسه، حداقل ۲ محصول انتخاب کنید.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="w-20" />
                {products.map((p) => (
                  <th key={p.id} className="min-w-36 p-2 align-top">
                    <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-2 text-center">
                      <button
                        type="button"
                        onClick={() => onRemove(p.id)}
                        aria-label={`حذف ${p.name} از مقایسه`}
                        className="absolute end-1 top-1 rounded-full bg-white/90 p-1 text-slate-400 shadow hover:text-red-500"
                      >
                        <XIcon className="text-xs" />
                      </button>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="mx-auto h-20 w-20 object-contain" />
                      ) : (
                        <span className="flex h-20 w-20 items-center justify-center text-slate-300 mx-auto">
                          <ImageIcon className="text-3xl" />
                        </span>
                      )}
                      <p className="mt-1.5 text-xs font-bold leading-5 text-slate-800">{p.name}</p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-center">
              <tr className="border-t border-slate-100">
                <td className="p-2 text-xs font-bold text-slate-400">قیمت</td>
                {products.map((p) => (
                  <td key={p.id} className="p-2 font-black tabular-nums text-slate-900">
                    {formatNumber(p.price)}
                    <span className="ms-1 text-[10px] font-medium text-slate-500">{settings.currency}</span>
                  </td>
                ))}
              </tr>
              <tr className="border-t border-slate-100">
                <td className="p-2 text-xs font-bold text-slate-400">دسته‌بندی</td>
                {products.map((p) => (
                  <td key={p.id} className="p-2 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <TagIcon className="text-[10px] opacity-50" />
                      {catName(p.categoryId)}
                    </span>
                  </td>
                ))}
              </tr>
              <tr className="border-t border-slate-100">
                <td className="p-2 text-xs font-bold text-slate-400">توضیحات</td>
                {products.map((p) => (
                  <td key={p.id} className="p-2 align-top">
                    <p className="mx-auto max-w-44 whitespace-pre-wrap text-[11px] leading-5 text-slate-600">
                      {p.description?.trim() || '—'}
                    </p>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}