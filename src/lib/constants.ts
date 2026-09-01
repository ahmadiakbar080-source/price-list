import type { AppSettings, BuiltinFont, TableStyle } from '@/types';

export const APP_NAME = 'مدیریت لیست قیمت';

export const GENERIC_ERROR = 'خطایی رخ داد. لطفاً دوباره تلاش کنید.';

export const PRODUCTS_PAGE_SIZE = 50;
export const PUBLICATIONS_HISTORY_LIMIT = 10;

export const MAX_IMAGE_MB = 5;
export const MAX_FONT_MB = 2;

export const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp';
export const LOGO_ACCEPT = '.jpg,.jpeg,.png,.webp';
export const FONT_ACCEPT = '.woff,.woff2,.ttf';

export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;
export const LOGO_EXTENSIONS = IMAGE_EXTENSIONS;
export const FONT_EXTENSIONS = ['woff', 'woff2', 'ttf'] as const;

export const BUILTIN_FONTS: Array<{ value: BuiltinFont; label: string }> = [
  { value: 'Vazirmatn', label: 'وزیرمتن' },
  { value: 'Estedad', label: 'استعداد' },
  { value: 'Shabnam', label: 'شبنم' },
];

export const TABLE_STYLES: Array<{ value: TableStyle; label: string }> = [
  { value: 'minimal', label: 'مینیمال' },
  { value: 'bordered', label: 'خط‌کشی‌شده' },
  { value: 'striped', label: 'یک‌درمیان رنگی' },
];

export const CURRENCY_PRESETS = ['تومان', 'ریال'] as const;

/** Family name used in generated @font-face for admin-uploaded fonts. */
export const CUSTOM_FONT_FAMILY = 'PLCustomFont';

export const DEFAULT_SETTINGS: AppSettings = {
  brandName: 'برند من',
  listTitle: 'لیست قیمت محصولات',
  currency: 'تومان',
  showUpdateDate: true,
  showLogo: true,
  logoUrl: null,
  invoiceStoreName: '',
invoicePhone: '',
invoiceAddress: '',
invoiceFooterText: 'با تشکر از خرید شما',
  fontFamily: 'Vazirmatn',
  customFontUrl: null,
  customFontName: null,
  primaryColor: '#4f46e5',
  backgroundColor: '#f8fafc',
  textColor: '#0f172a',
  tableStyle: 'minimal',
  imageSize: 72,
  borderRadius: 6,
  rowSpacing: 10,
  baseFontSize: 16,
  template: 'classic' as const,
welcomeEnabled: false,
welcomeDuration: 6,
welcomeImageUrl: null,
};