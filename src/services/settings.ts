import { supabase } from '@/lib/supabase';
import {
  DEFAULT_SETTINGS,
  GENERIC_ERROR,
  LOGO_EXTENSIONS,
  MAX_IMAGE_MB,
  MAX_FONT_MB,
} from '@/lib/constants';
import { assertFont, assertImage, extensionOf } from '@/utils/assets';
import { removeFromBucket, uploadToBucket } from '@/services/storage';
import type { AppSettings, SettingsDraft, SettingsPatch, UploadedFile, UploadedFont } from '@/types';

const TABLE = 'settings';
const BUCKET = 'brand-assets';

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapSettings(row: any): SettingsDraft {
  return {
    ...DEFAULT_SETTINGS,
    brandName: row.brand_name ?? DEFAULT_SETTINGS.brandName,
    listTitle: row.list_title ?? DEFAULT_SETTINGS.listTitle,
    currency: row.currency ?? DEFAULT_SETTINGS.currency,
    showUpdateDate: row.show_update_date ?? true,
    showLogo: row.show_logo ?? true,
    logoUrl: row.logo_url ?? null,
    logoPath: row.logo_path ?? null,
    fontFamily: row.font_family ?? 'Vazirmatn',
    customFontUrl: row.custom_font_url ?? null,
    customFontPath: row.custom_font_path ?? null,
    customFontName: row.custom_font_name ?? null,
    primaryColor: row.primary_color ?? DEFAULT_SETTINGS.primaryColor,
    backgroundColor: row.background_color ?? DEFAULT_SETTINGS.backgroundColor,
    textColor: row.text_color ?? DEFAULT_SETTINGS.textColor,
    tableStyle: row.table_style ?? DEFAULT_SETTINGS.tableStyle,
    imageSize: Number(row.image_size ?? DEFAULT_SETTINGS.imageSize),
    borderRadius: Number(row.border_radius ?? DEFAULT_SETTINGS.borderRadius),
    rowSpacing: Number(row.row_spacing ?? DEFAULT_SETTINGS.rowSpacing),
    baseFontSize: Number(row.base_font_size ?? DEFAULT_SETTINGS.baseFontSize),
    template: row.template ?? 'classic',
welcomeEnabled: row.welcome_enabled ?? false,
welcomeDuration: Number(row.welcome_duration ?? 6),
welcomeImageUrl: row.welcome_image_url ?? null,
welcomeImagePath: row.welcome_image_path ?? null,
  };
}

export async function getDraftSettings(): Promise<SettingsDraft> {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', 1).maybeSingle();
  if (error) {
    console.error('[settings] load failed:', error.message);
    throw new Error(GENERIC_ERROR);
  }
  return data
    ? mapSettings(data)
    : { ...DEFAULT_SETTINGS, logoPath: null, customFontPath: null, welcomeImagePath: null };
}

const PATCH_KEY_MAP = {
  brandName: 'brand_name',
  listTitle: 'list_title',
  currency: 'currency',
  showUpdateDate: 'show_update_date',
  showLogo: 'show_logo',
  logoUrl: 'logo_url',
  logoPath: 'logo_path',
  fontFamily: 'font_family',
  customFontUrl: 'custom_font_url',
  customFontPath: 'custom_font_path',
  customFontName: 'custom_font_name',
  primaryColor: 'primary_color',
  backgroundColor: 'background_color',
  textColor: 'text_color',
  tableStyle: 'table_style',
  imageSize: 'image_size',
  borderRadius: 'border_radius',
  rowSpacing: 'row_spacing',
  baseFontSize: 'base_font_size',
  template: 'template',
welcomeEnabled: 'welcome_enabled',
welcomeDuration: 'welcome_duration',
welcomeImageUrl: 'welcome_image_url',
welcomeImagePath: 'welcome_image_path',
} as const;

export async function updateDraftSettings(patch: SettingsPatch): Promise<void> {
  const upd: Record<string, unknown> = {};
  for (const [camel, snake] of Object.entries(PATCH_KEY_MAP)) {
    const value = (patch as Record<string, unknown>)[camel];
    if (value !== undefined) upd[snake] = value;
  }
  if (Object.keys(upd).length === 0) return;

  const { error } = await supabase.from(TABLE).update(upd).eq('id', 1);
  if (error) {
    console.error('[settings] update failed:', error.message);
    throw new Error(GENERIC_ERROR);
  }
}

export async function uploadLogo(file: File): Promise<UploadedFile> {
  assertImage(file, LOGO_EXTENSIONS, MAX_IMAGE_MB);
  const path = `logo-${Date.now()}.${extensionOf(file.name)}`;
  return uploadToBucket(BUCKET, path, file);
}

export function removeLogoFile(path: string | null): Promise<void> {
  return removeFromBucket(BUCKET, path);
}

export async function uploadCustomFont(file: File): Promise<UploadedFont> {
  assertFont(file, MAX_FONT_MB);
  const safeBase = file.name.replace(/\.[^.]+$/, '').replace(/[^\w\u0600-\u06FF-]+/g, '-').slice(0, 40);
  const path = `fonts/${Date.now()}-${safeBase || 'font'}.${extensionOf(file.name)}`;
  const uploaded = await uploadToBucket(BUCKET, path, file);
  const name = safeBase || 'فونت سفارشی';
  return { ...uploaded, name };
}

export function removeFontFile(path: string | null): Promise<void> {
  return removeFromBucket(BUCKET, path);
}

/** Strip storage paths — published snapshot carries public URLs only. */
export function toPublicSettings(draft: SettingsDraft): AppSettings {
  const { logoPath: _l, customFontPath: _c, welcomeImagePath: _w, ...rest } = draft;
  return rest;
}
export async function uploadWelcomeImage(file: File): Promise<UploadedFile> {
  assertImage(file, LOGO_EXTENSIONS, MAX_IMAGE_MB);
  const path = `welcome-${Date.now()}.${extensionOf(file.name)}`;
  return uploadToBucket(BUCKET, path, file);
}

export function removeWelcomeImageFile(path: string | null): Promise<void> {
  return removeFromBucket(BUCKET, path);
}