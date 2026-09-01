import { supabase } from '@/lib/supabase';
import { GENERIC_ERROR, MAX_IMAGE_MB, IMAGE_EXTENSIONS } from '@/lib/constants';
import { assertImage, extensionOf } from '@/utils/assets';
import { removeFromBucket, uploadToBucket } from '@/services/storage';
import type { Product, ProductInput, UploadedFile } from '@/types';

const TABLE = 'products';
const BUCKET = 'product-images';

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapProduct(row: any): Product {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    price: Number(row.price ?? 0),
    description: row.description ?? null,
    categoryId: row.category_id ?? null,
    imageUrl: row.image_url ?? null,
    imagePath: row.image_path ?? null,
    isActive: Boolean(row.is_active),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    purchase_price: row.purchase_price ?? 0,
stock_quantity: row.stock_quantity ?? 0,
  };
}

export async function listProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[products] list failed:', error.message);
    throw new Error(GENERIC_ERROR);
  }
  return (data ?? []).map(mapProduct);
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      name: input.name,
      price: input.price,
      description: input.description,
      category_id: input.categoryId,
      image_url: input.imageUrl,
      image_path: input.imagePath,
      is_active: input.isActive,
      sort_order: input.sortOrder,
    })
    .select('*')
    .single();
  if (error) {
    console.error('[products] create failed:', error.message);
    throw new Error(GENERIC_ERROR);
  }
  return mapProduct(data);
}

export async function updateProduct(id: string, patch: Partial<ProductInput>): Promise<Product> {
  const upd: Record<string, unknown> = {};
  if (patch.name !== undefined) upd.name = patch.name;
  if (patch.price !== undefined) upd.price = patch.price;
  if (patch.description !== undefined) upd.description = patch.description;
  if (patch.categoryId !== undefined) upd.category_id = patch.categoryId;
  if (patch.imageUrl !== undefined) upd.image_url = patch.imageUrl;
  if (patch.imagePath !== undefined) upd.image_path = patch.imagePath;
  if (patch.isActive !== undefined) upd.is_active = patch.isActive;
  if (patch.sortOrder !== undefined) upd.sort_order = patch.sortOrder;
  if (patch.purchasePrice !== undefined) upd.purchase_price = patch.purchasePrice;
  if (patch.stockQuantity !== undefined) upd.stock_quantity = Math.max(0, Math.trunc(patch.stockQuantity));

  const { data, error } = await supabase.from(TABLE).update(upd).eq('id', id).select('*').single();
  if (error) {
    console.error('[products] update failed:', error.message);
    throw new Error(GENERIC_ERROR);
  }
  return mapProduct(data);
}

/** Deletes the draft row, then cleans up its image (best effort). */
export async function deleteProduct(product: Pick<Product, 'id' | 'imagePath'>): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', product.id);
  if (error) {
    console.error('[products] delete failed:', error.message);
    throw new Error(GENERIC_ERROR);
  }
  void removeFromBucket(BUCKET, product.imagePath);
}

export async function uploadProductImage(file: File): Promise<UploadedFile> {
  assertImage(file, IMAGE_EXTENSIONS, MAX_IMAGE_MB);
  const path = `${crypto.randomUUID()}.${extensionOf(file.name)}`;
  return uploadToBucket(BUCKET, path, file);
}

/** Persists a new ordering (transactional RPC). */
export async function reorderProducts(orderedIds: string[]): Promise<void> {
  const { error } = await supabase.rpc('reorder_products', { p_ids: orderedIds });
  if (error) {
    console.error('[products] reorder failed:', error.message);
    throw new Error(GENERIC_ERROR);
  }
}

export async function getNextSortOrder(): Promise<number> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);
  if (error) {
    console.error('[products] next sort failed:', error.message);
    return 10;
  }
  return Number(data?.[0]?.sort_order ?? 0) + 10;
}
export async function applyPriceChange(opts: {
  percent: number;
  categoryId: string | null;
  onlyActive: boolean;
  roundTo: number;
}): Promise<number> {
  const { data, error } = await supabase.rpc('apply_price_change', {
    p_percent: opts.percent,
    p_category_id: opts.categoryId,
    p_only_active: opts.onlyActive,
    p_round_to: opts.roundTo,
  });

  if (error) {
    console.error('[products] apply_price_change failed:', error.message);
    throw new Error(GENERIC_ERROR);
  }

  return Number(data ?? 0);
}