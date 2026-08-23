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
import { removeFromBucket } from '@/services/storage';
import type { Product } from '@/types';

interface Props {
  open: boolean;
  product: Product | null; // null => create mode
  onClose: () => void;
  onSaved: () => void;
}

export function ProductFormModal({ open, product, onClose, onSaved }: Props) {
  const toast = useToast();

  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | null>(null);
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
    if (product) {
      setName(product.name);
      setPrice(product.price);
      setIsActive(product.isActive);
      setSortOrder(product.sortOrder);
    } else {
      setName('');
      setPrice(null);
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
      toast.error(error instanceof Error && error.message !== GENERIC_ERROR ? error.message : GENERIC_ERROR);
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
          placeholder="مثلاً: شامپو بدن婴儿" /* placeholder kept simple below */
        />

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