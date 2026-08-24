import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { Modal } from '@/components/ui/Modal';
import { Toggle } from '@/components/ui/Toggle';
import { ImagePicker } from '@/components/admin/ImagePicker';
import { useToast } from '@/hooks/useToast';
import { GENERIC_ERROR } from '@/lib/constants';
import {
  createProduct,
  getNextSortOrder,
  updateProduct,
  uploadProductImage,
} from '@/services/products';
import { listCategories } from '@/services/categories';
import { removeFromBucket } from '@/services/storage';
import type { Category, Product } from '@/types';

interface Props {
  open: boolean;
  product: Product | null; // null => حالت افزودن
  onClose: () => void;
  onSaved: () => void;
}

export function ProductFormModal({ open, product, onClose, onSaved }: Props) {
  const toast = useToast();

  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState<number>(10);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [clearImage, setClearImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setImageFile(null);
    setClearImage(false);
    void listCategories().then(setCategories).catch(() => setCategories([]));
    if (product) {
      setName(product.name);
      setPrice(product.price);
      setDescription(product.description ?? '');
      setCategoryId(product.categoryId ?? '');
      setIsActive(product.isActive);
      setSortOrder(product.sortOrder);
    } else {
      setName('');
      setPrice(null);
      setCategoryId('');
      setIsActive(true);
      void getNextSortOrder().then(setSortOrder);
    }
  }, [open, product]);

  const submit = async () => {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = 'نام محصول الزامی است.';
    if (price == null) errs.price = 'قیمت مصرف‌کننده الزامی است.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      let uploaded: { url: string; path: string } | null = null;
      if (imageFile) {
        uploaded = await uploadProductImage(imageFile);
        toast.success('تصویر با موفقیت آپلود شد.');
      }

      const keepExisting = !clearImage && !imageFile;
      const payload = {
        name: name.trim(),
        price: price as number,
        description: description.trim() || null,
        categoryId: categoryId || null,
        imageUrl: uploaded ? uploaded.url : keepExisting ? (product?.imageUrl ?? null) : null,
        imagePath: uploaded ? uploaded.path : keepExisting ? (product?.imagePath ?? null) : null,
        isActive,
        sortOrder,
      };

      if (product) {
        await updateProduct(product.id, payload);
        if (uploaded && product.imagePath) void removeFromBucket('product-images', product.imagePath);
        toast.success('محصول با موفقیت ویرایش شد.');
      } else {
        await createProduct(payload);
        toast.success('محصول با موفقیت اضافه شد.');
      }
      onSaved();
      onClose();
    } catch (error) {
      console.error('[ProductFormModal]', error);
      toast.error(GENERIC_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  const currentPreview =
    clearImage && !imageFile ? null : imageFile ? URL.createObjectURL(imageFile) : (product?.imageUrl ?? null);

  return (
    <Modal open={open} title={product ? 'ویرایش محصول' : 'افزودن محصول'} onClose={submitting ? () => undefined : onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <ImagePicker
          label="تصویر محصول"
          currentUrl={currentPreview}
          disabled={submitting}
          onFileChange={(f) => {
            setImageFile(f);
            setClearImage(false);
            if (!f && product?.imageUrl) setClearImage(true);
          }}
        />

        <Input
  label="نام محصول"
  value={name}
  maxLength={200}
  disabled={submitting}
  error={errors.name}
  onChange={(e) => setName(e.target.value)}
  placeholder="مثلاً: روغن موتور ۴ لیتری"
/>

<label className="block">
  <span className="mb-1.5 block text-sm font-medium text-slate-700">
    توضیحات کوتاه <span className="font-normal text-slate-400">(اختیاری)</span>
  </span>

  <textarea
    value={description}
    maxLength={2000}
    rows={3}
    disabled={submitting}
    onChange={(e) => setDescription(e.target.value)}
    placeholder="مشخصات، جنس، ابعاد، نکات فنی…"
    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
  />

  <p className="mt-1 text-xs text-slate-400">
    در پاپ‌آپ جزئیات محصول در صفحه عمومی نمایش داده می‌شود. ({description.length}/2000)
  </p>
</label>

        {/* دسته‌بندی */}
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">دسته‌بندی</span>
          <select
            value={categoryId}
            disabled={submitting}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">بدون دسته‌بندی</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">
            دسته‌بندی‌های جدید را از منوی «دسته‌بندی‌ها» بسازید.
          </p>
        </label>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">قیمت مصرف‌کننده</span>
          <div className="flex items-center gap-2">
            <MoneyInput initialValue={price} onChangeValue={setPrice} disabled={submitting} />
            <span className="shrink-0 text-sm text-slate-500">تومان</span>
          </div>
          {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5">
            <span className="text-sm text-slate-700">فعال (نمایش در لیست عمومی)</span>
            <Toggle checked={isActive} onChange={setIsActive} disabled={submitting} />
          </div>
          <Input
            label="ترتیب نمایش"
            type="number"
            dir="ltr"
            min={0}
            value={sortOrder}
            disabled={submitting}
            onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
            hint="عدد کوچکتر = بالاتر"
          />
        </div>

        <div className="flex justify-start gap-2 pt-2">
          <Button type="submit" loading={submitting}>
            ذخیره
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            انصراف
          </Button>
        </div>
      </form>
    </Modal>
  );
}