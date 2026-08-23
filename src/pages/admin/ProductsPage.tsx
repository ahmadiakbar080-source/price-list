import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { FullPageLoader, Spinner } from '@/components/ui/Spinner';
import { Toggle } from '@/components/ui/Toggle';
import { InlineEdit } from '@/components/admin/InlineEdit';
import { ProductFormModal } from '@/components/admin/ProductFormModal';
import {
  BoxIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  GripIcon,
  ImageIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from '@/components/icons';
import { useToast } from '@/hooks/useToast';
import { GENERIC_ERROR, PRODUCTS_PAGE_SIZE } from '@/lib/constants';
import {
  deleteProduct,
  listProducts,
  reorderProducts,
  updateProduct,
} from '@/services/products';
import { optimizedImageUrl } from '@/utils/assets';
import { digitsOnly, formatPrice, normalizeForSearch } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { Product } from '@/types';

export function ProductsPage() {
  const toast = useToast();

  const [products, setProducts] = useState<Product[] | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const [orderSaving, setOrderSaving] = useState(false);

  // ---- data -----------------------------------------------------------------
  const reload = useCallback(
    async (silent = false) => {
      try {
        setProducts(await listProducts());
      } catch (e) {
        console.error('[products] reload:', e);
        if (!silent) toast.error(GENERIC_ERROR);
      }
    },
    [toast],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  // Real-time sync across devices/admin tabs (§48) — debounced refetch.
  const rtTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    const ch = (async () => {
      const { supabase } = await import('@/lib/supabase');
      const channel = supabase
        .channel('admin-products')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
          window.clearTimeout(rtTimer.current);
          rtTimer.current = window.setTimeout(() => void reload(true), 350);
        })
        .subscribe();
      return { supabase, channel };
    })();

    return () => {
      void (async () => {
        const { supabase, channel } = await ch;
        await supabase.removeChannel(channel);
      })();
    };
  }, [reload]);

  // ---- derived ---------------------------------------------------------------
  const filtered = useMemo(() => {
    const q = normalizeForSearch(query);
    if (!q || !products) return products ?? [];
    return products.filter((p) => normalizeForSearch(p.name).includes(q));
  }, [products, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * PRODUCTS_PAGE_SIZE, safePage * PRODUCTS_PAGE_SIZE);
  useEffect(() => setPage(1), [query]);

  const isFiltering = normalizeForSearch(query).length > 0;

  // ---- mutations --------------------------------------------------------------
  const patchLocal = (id: string, patch: Partial<Product>) =>
    setProducts((prev) => (prev ? prev.map((p) => (p.id === id ? { ...p, ...patch } : p)) : prev));

  const commitInline = async (p: Product, patch: Partial<Product>, kind: 'name' | 'price') => {
    try {
      const updated = await updateProduct(p.id, patch);
      patchLocal(p.id, updated);
      toast.success(kind === 'price' ? 'قیمت با موفقیت به‌روزرسانی شد.' : 'نام محصول به‌روزرسانی شد.');
    } catch (e) {
      console.error(e);
      toast.error(GENERIC_ERROR);
      void reload(true);
    }
  };

  const toggleActive = async (p: Product) => {
    patchLocal(p.id, { isActive: !p.isActive }); // optimistic
    try {
      await updateProduct(p.id, { isActive: !p.isActive });
    } catch (e) {
      console.error(e);
      toast.error(GENERIC_ERROR);
      patchLocal(p.id, { isActive: p.isActive });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteProduct(deleting);
      toast.success('محصول حذف شد.');
      setDeleting(null);
      void reload(true);
    } catch (e) {
      console.error(e);
      toast.error(GENERIC_ERROR);
    } finally {
      setBusy(false);
    }
  };

  // ---- reordering (drag & drop + arrows) --------------------------------------
  const dragIndex = useRef<number | null>(null); // global index in `products`
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const commitOrder = async (nextIds: string[], optimistic: Product[]) => {
    const prev = products;
    setProducts(optimistic);
    setOrderSaving(true);
    try {
      await reorderProducts(nextIds);
      toast.success('ترتیب محصولات ذخیره شد.');
    } catch (e) {
      console.error(e);
      toast.error(GENERIC_ERROR);
      if (prev) setProducts(prev);
    } finally {
      setOrderSaving(false);
      setDragOverIdx(null);
      dragIndex.current = null;
    }
  };

  const moveTo = (globalIdx: number, dir: -1 | 1) => {
    if (!products) return;
    const j = globalIdx + dir;
    if (j < 0 || j >= products.length) return;
    const next = [...products];
    [next[globalIdx], next[j]] = [next[j], next[globalIdx]];
    void commitOrder(next.map((p) => p.id), next);
  };

  const offset = (safePage - 1) * PRODUCTS_PAGE_SIZE;

  // ---- render -------------------------------------------------------------------
  if (!products) return <FullPageLoader label="در حال دریافت محصولات…" />;

  return (
    <div>
      <PageHeader
        title="محصولات"
        subtitle="تغییرات ابتدا روی پیش‌نویس اعمال می‌شود؛ مشتری پس از «انتشار» آن را می‌بیند."
        actions={
          <>
            {orderSaving && <Spinner className="size-4 text-indigo-500" />}
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <PlusIcon /> افزودن محصول
            </Button>
          </>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          title="هنوز محصولی اضافه نشده است."
          description="اولین محصول خود را اضافه کنید تا در لیست قیمت عمومی نمایش داده شود."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <PlusIcon /> افزودن محصول
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-4 max-w-xs">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجو در محصولات…"
                className="!pr-9"
              />
            </div>
            {!isFiltering && (
              <p className="mt-1.5 text-[11px] text-slate-400">
                برای تغییر ترتیب: کشیدن ردیف‌ها (دسکتاپ) یا دکمه‌های ▲▼
              </p>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {paged.map((p, i) => {
                const g = offset + i; // global index within full list
                return (
                  <li
                    key={p.id}
                    draggable={!isFiltering && !orderSaving}
                    onDragStart={(e) => {
                      dragIndex.current = g;
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragIndex.current !== null) setDragOverIdx(g);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const from = dragIndex.current;
                      if (from === null || from === g || !products) {
                        dragIndex.current = null;
                        setDragOverIdx(null);
                        return;
                      }
                      const next = [...products];
                      const [moved] = next.splice(from, 1);
                      next.splice(g, 0, moved);
                      void commitOrder(next.map((x) => x.id), next);
                    }}
                    onDragEnd={() => {
                      dragIndex.current = null;
                      setDragOverIdx(null);
                    }}
                    className={cn(
                      'flex items-center gap-2 px-3 py-3 transition sm:gap-3 sm:px-4',
                      dragOverIdx === g && 'bg-indigo-50/70 ring-1 ring-inset ring-indigo-200',
                      !isFiltering && 'cursor-grab active:cursor-grabbing',
                    )}
                  >
                    {/* grip (desktop) */}
                    <span
                      className={cn(
                        'hidden shrink-0 text-slate-300 md:block',
                        isFiltering ? 'opacity-30' : 'cursor-grab',
                      )}
                      title="جابه‌جایی با کشیدن"
                    >
                      <GripIcon className="text-lg" />
                    </span>

                    {/* arrows (touch-friendly, §17) */}
                    <span className="flex shrink-0 flex-col gap-0.5 md:hidden">
                      <button
                        type="button"
                        aria-label="انتقال به بالا"
                        disabled={isFiltering || orderSaving || g === 0}
                        onClick={() => moveTo(g, -1)}
                        className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                      >
                        <ChevronUpIcon />
                      </button>
                      <button
                        type="button"
                        aria-label="انتقال به پایین"
                        disabled={isFiltering || orderSaving || g === products.length - 1}
                        onClick={() => moveTo(g, 1)}
                        className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                      >
                        <ChevronDownIcon />
                      </button>
                    </span>

                    {/* thumbnail */}
                    <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                      {p.imageUrl ? (
                        <img
                          src={optimizedImageUrl(p.imageUrl, 96) ?? p.imageUrl}
                          alt=""
                          loading="lazy"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <ImageIcon className="text-lg text-slate-300" />
                      )}
                    </div>

                    {/* name + price (inline editable) */}
                    <div className="min-w-0 flex-1">
                      <InlineEdit
                        value={p.name}
                        ariaLabel="ویرایش سریع نام"
                        className="block w-full text-sm font-semibold text-slate-800"
                        onCommit={(v) => commitInline(p, { name: v }, 'name')}
                      />
                      <div className="mt-0.5">
                        <InlineEdit
                          value={String(p.price)}
                          display={formatPrice(p.price, 'تومان')}
                          numeric
                          ariaLabel="ویرایش سریع قیمت"
                          className="block text-xs font-bold text-indigo-600 tabular-nums"
                          onCommit={(v) => commitInline(p, { price: Number(v) }, 'price')}
                        />
                      </div>
                    </div>

                    {/* active toggle */}
                    <Toggle checked={p.isActive} onChange={() => void toggleActive(p)} />

                    {/* actions */}
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        aria-label="ویرایش کامل"
                        onClick={() => {
                          setEditing(p);
                          setFormOpen(true);
                        }}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <PencilIcon className="text-base" />
                      </button>
                      <button
                        type="button"
                        aria-label="حذف محصول"
                        onClick={() => setDeleting(p)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <TrashIcon className="text-base" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* pagination (large catalogs, §44) */}
          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                صفحه {safePage} از {pageCount} — {filtered.length} محصول
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
                  قبلی
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={safePage >= pageCount}
                  onClick={() => setPage(safePage + 1)}
                >
                  بعدی
                </Button>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <BoxIcon className="text-sm" />
            <span>
              نمایش عمومی فقط شامل محصولات <Badge tone="green">فعال</Badge> و پس از انتشار است.
            </span>
          </div>
        </>
      )}

      {/* Modals */}
      <ProductFormModal
        open={formOpen}
        product={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => void reload(true)}
      />

      <ConfirmDialog
        open={!!deleting}
        title="حذف محصول"
        message="آیا مطمئن هستید که می‌خواهید این محصول را حذف کنید؟"
        confirmLabel="حذف"
        cancelLabel="انصراف"
        danger
        loading={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}