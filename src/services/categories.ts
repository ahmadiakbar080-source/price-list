import { supabase } from '@/lib/supabase';
import { GENERIC_ERROR } from '@/lib/constants';
import type { Category } from '@/types';

const TABLE = 'categories';

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapCategory(row: any): Category {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[categories] list failed:', error.message);
    throw new Error(GENERIC_ERROR);
  }
  return (data ?? []).map(mapCategory);
}

export async function createCategory(name: string, sortOrder: number): Promise<Category> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ name, sort_order: sortOrder })
    .select('*')
    .single();
  if (error) {
    console.error('[categories] create failed:', error.message);
    throw new Error(GENERIC_ERROR);
  }
  return mapCategory(data);
}

export async function updateCategory(
  id: string,
  patch: { name?: string; sortOrder?: number },
): Promise<Category> {
  const upd: Record<string, unknown> = {};
  if (patch.name !== undefined) upd.name = patch.name;
  if (patch.sortOrder !== undefined) upd.sort_order = patch.sortOrder;

  const { data, error } = await supabase.from(TABLE).update(upd).eq('id', id).select('*').single();
  if (error) {
    console.error('[categories] update failed:', error.message);
    throw new Error(GENERIC_ERROR);
  }
  return mapCategory(data);
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) {
    console.error('[categories] delete failed:', error.message);
    throw new Error(GENERIC_ERROR);
  }
}

export async function getNextCategorySortOrder(): Promise<number> {
  const { data } = await supabase
    .from(TABLE)
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);
  return Number(data?.[0]?.sort_order ?? 0) + 10;
}