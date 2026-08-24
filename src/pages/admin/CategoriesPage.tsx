import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { FullPageLoader } from '@/components/ui/Spinner';
import { InlineEdit } from '@/components/admin/InlineEdit';
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, TagIcon, TrashIcon } from '@/components/icons';
import { useToast } from '@/hooks/useToast';
import { GENERIC_ERROR } from '@/lib/constants';
import {
  createCategory,
  deleteCategory,
  getNextCategorySortOrder,
  listCategories,
  updateCategory,
} from '@/services/categories';
import { listProducts } from '@/services/products';
import { formatNumber } from '@/utils/format';
import type { Category } from '@/types';

export function CategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const [cats, prods] = await Promise.all([listCategories(), listProducts()]);
      setCategories(cats);
      const c: Record<string, number> = {};
      for (const p of prods) if (p.categoryId) c[p.categoryId] = (c[p.categoryId] ?? 0) + 1;
      setCounts(c);
    } catch (e) {
      console.error(e);
      toast.error(GENERIC_ERROR);
    }
  }, [toast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const add = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error('نام دسته‌بندی را وارد کنید.');
      return;
    }
    setAdding(true);
    try {
      const so = await getNextCategorySortOrder();
      await createCategory(name, so);
      toast.success('دسته‌بندی با موفقیت اضافه شد.');
      setNewName('');
      await reload();
    } catch (e) {
      console.error(e);
      toast.error(GENERIC_ERROR);
    } finally {
      setAdding(false);
    }
  };

  const rename = async (cat: Category, name: string) => {
    if (name === cat.name) return;
    try {
      await updateCategory(cat.id, { name });
      toast.success('نام دسته‌بندی ویرایش شد.');
      await reload();
    } catch (e) {
      console.error(e);
      toast.error(GENERIC_ERROR);
    }
  };

  const swap = async (i: number, j: number) => {
    if (!categories) return;
    const a = categories[i];
    const b = categories[j];
    if (!a || !b) return;
    try {
      await Promise.all([
        updateCategory(a.id, { sortOrder: b.sortOrder }),
        updateCategory(b.id, { sortOrder: a.sortOrder }),
      ]);
      await reload();
    } catch (e) {
      console.error(e);
      toast.error(GENERIC_ERROR);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteCategory(deleting.id);
      toast.success('دسته‌بندی حذف شد.');
      setDeleting(null);
      await reload();
    } catch (e) {
      console.error(e);
      toast.error(GENERIC_ERROR);
    } finally {
      setBusy(false);
    }
  };

  if (!categories) return <FullPageLoader label="در حال دریافت دسته‌بندی‌ها…" />;

  return (
    <div className="pb-10">
      <PageHeader
        title="دسته‌بندی‌ها"
        subtitle="دسته‌ها پس از انتشار، به‌صورت دکمه‌های فیلتر در صفحه عمومی نمایش داده می‌شوند."
      />

      {/* افزودن */}
      <Card className="mb-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void add();
          }}
        >
          <div className="flex-1">
            <Input
              value={newName}
              maxLength={100}
              disabled={adding}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="نام دسته‌بندی جدید — مثلاً: دریل و فرز"
            />
          </div>
          <Button type="submit" loading={adding} className="shrink-0">
            <PlusIcon /> افزودن
          </Button>
        </form>
      </Card>

      {categories.length === 0 ? (
        <EmptyState
          title="هنوز دسته‌بندی‌ای ساخته نشده است."
          description="با ساخت دسته‌بندی، مشتری می‌تواند در صفحه عمومی محصولات هر دسته را جدا ببیند."
        />
      ) : (
        <Card className="overflow-hidden !p-0">
          <ul className="divide-y divide-slate-100">
            {categories.map((c, i) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex shrink-0 flex-col gap-0.5">
                  <button
                    type="button"
                    aria-label="انتقال به بالا"
                    disabled={i === 0}
                    onClick={() => void swap(i, i - 1)}
                    className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                  >
                    <ChevronUpIcon />
                  </button>
                  <button
                    type="button"
                    aria-label="انتقال به پایین"
                    disabled={i === categories.length - 1}
                    onClick={() => void swap(i, i + 1)}
                    className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                  >
                    <ChevronDownIcon />
                  </button>
                </span>

                <TagIcon className="shrink-0 text-lg text-slate-300" />

                <div className="min-w-0 flex-1">
                  <InlineEdit
                    value={c.name}
                    ariaLabel="ویرایش نام دسته‌بندی"
                    className="block w-full text-sm font-semibold text-slate-800"
                    onCommit={(v) => rename(c, v)}
                  />
                  <span className="text-[11px] text-slate-400">
                    {formatNumber(counts[c.id] ?? 0)} محصول
                  </span>
                </div>

                <button
                  type="button"
                  aria-label="حذف دسته‌بندی"
                  onClick={() => setDeleting(c)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <TrashIcon className="text-base" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="حذف دسته‌بندی"
        message="آیا از حذف این دسته‌بندی مطمئن هستید؟ محصولات آن حذف نمی‌شوند؛ فقط بدون دسته‌بندی می‌شوند."
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