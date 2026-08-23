export type BuiltinFont = 'Vazirmatn' | 'Estedad' | 'Shabnam';
export type FontFamily = BuiltinFont | 'custom';
export type TableStyle = 'minimal' | 'bordered' | 'striped';

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  /** Present on draft rows only (used for storage lifecycle). */
  imagePath?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductInput {
  name: string;
  price: number;
  imageUrl: string | null;
  imagePath: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface AppSettings {
  brandName: string;
  listTitle: string;
  currency: string;
  showUpdateDate: boolean;
  showLogo: boolean;
  logoUrl: string | null;
  fontFamily: FontFamily;
  customFontUrl: string | null;
  customFontName: string | null;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  tableStyle: TableStyle;
  imageSize: number;
  borderRadius: number;
  rowSpacing: number;
  baseFontSize: number;
}

/** Draft settings incl. storage paths needed for file replacement/removal. */
export interface SettingsDraft extends AppSettings {
  logoPath: string | null;
  customFontPath: string | null;
}

export type SettingsPatch = Partial<Omit<SettingsDraft, 'id'>>;

export interface Publication {
  version: number;
  productCount: number;
  publishedAt: string;
}

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  lastPublishedAt: string | null;
  publishedVersion: number | null;
  hasUnpublishedChanges: boolean;
}

export interface PublicPriceListData {
  settings: AppSettings;
  products: Product[];
  lastPublishedAt: string | null;
}

export interface UploadedFile {
  url: string;
  path: string;
}

export interface UploadedFont extends UploadedFile {
  name: string;
}

export interface AuthUser {
  id: string;
  email?: string;
}