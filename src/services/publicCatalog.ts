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
    description: row.description ?? null,
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

/** دریافت اطلاعات کامل لیست قیمت از طریق Cloudflare Function */
export async function getPublicPriceList(): Promise<PublicPriceListData> {
  const response = await fetch('/api/products');

  if (!response.ok) {
    throw new Error('خطا در دریافت اطلاعات از API');
  }

  const data = await response.json();

  return {
    settings: mapPublishedSettings(data.settings),
    products: (data.products ?? []).map(mapPublishedProduct),
    categories: (data.categories ?? []).map(mapPublishedCategory),
    lastPublishedAt: data.publication?.published_at ?? null,
  };
}