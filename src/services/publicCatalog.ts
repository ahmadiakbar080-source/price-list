import { supabase } from '@/lib/supabase';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import type { AppSettings, Category, Product, PublicPriceListData } from '@/types';

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapPublishedSettings(row: any): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    brandName: row?.brand_name ?? DEFAULT_SETTINGS.brandName,
    listTitle: row?.list_title ?? DEFAULT_SETTINGS.listTitle,
    currency: row?.currency ?? DEFAULT_SETTINGS.currency,
    showUpdateDate: row?.show_update_date ?? true,
    showLogo: row?.show_logo ?? true,
    logoUrl: row?.logo_url ?? null,
    fontFamily: row?.font_family ?? 'Vazirmatn',
    customFontUrl: row?.custom_font_url ?? null,
    customFontName: row?.custom_font_name ?? null,
    primaryColor: row?.primary_color ?? DEFAULT_SETTINGS.primaryColor,
    backgroundColor: row?.background_color ?? DEFAULT_SETTINGS.backgroundColor,
    textColor: row?.text_color ?? DEFAULT_SETTINGS.textColor,
    tableStyle: row?.table_style ?? DEFAULT_SETTINGS.tableStyle,
    imageSize: Number(row?.image_size ?? DEFAULT_SETTINGS.imageSize),
    borderRadius: Number(row?.border_radius ?? DEFAULT_SETTINGS.borderRadius),
    rowSpacing: Number(row?.row_spacing ?? DEFAULT_SETTINGS.rowSpacing),
    baseFontSize: Number(row?.base_font_size ?? DEFAULT_SETTINGS.baseFontSize),
  };
}

function mapPublishedProduct(row: any): Product {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    price: Number(row.price ?? 0),
    imageUrl: row.image_url ?? null,
    categoryId: row.category_id ?? null,
    isActive: true,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

function mapPublishedCategory(row: any): Category {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

/** فقط اسنپ‌شات منتشرشده — دسته‌ها هم از published_categories می‌آیند. */
export async function getPublicPriceList(): Promise<PublicPriceListData> {
  const [settingsRes, productsRes, categoriesRes, publicationRes] = await Promise.all([
    supabase.from('published_settings').select('*').eq('id', 1).maybeSingle(),
    supabase
      .from('published_products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase.from('published_categories').select('*').order('sort_order', { ascending: true }),
    supabase
      .from('publications')
      .select('published_at')
      .order('published_at', { ascending: false })
      .limit(1),
  ]);

  if (settingsRes.error) throw new Error(settingsRes.error.message);
  if (productsRes.error) throw new Error(productsRes.error.message);
  if (categoriesRes.error) throw new Error(categoriesRes.error.message);
  if (publicationRes.error) throw new Error(publicationRes.error.message);

  return {
    settings: mapPublishedSettings(settingsRes.data),
    products: (productsRes.data ?? []).map(mapPublishedProduct),
    categories: (categoriesRes.data ?? []).map(mapPublishedCategory),
    lastPublishedAt: (publicationRes.data?.[0] as any)?.published_at ?? null,
  };
}