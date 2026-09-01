export type BuiltinFont = 'Vazirmatn' | 'Estedad' | 'Shabnam';
export type FontFamily = BuiltinFont | 'custom';
export type TableStyle = 'minimal' | 'bordered' | 'striped';
export type TemplateId =
  | 'classic'
  | 'liquid-glass'
  | 'premium-dark'
  | 'minimal-white'
  | 'neon-future'
  | 'luxury-editorial';
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  purchase_price: number;
stock_quantity: number;
  categoryId: string | null;
  imageUrl: string | null;
  /** Present on draft rows only (used for storage lifecycle). */
  imagePath?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;

  // Snapshot محصول در زمان فروش
  product_name: string;

  quantity: number;

  purchase_price: number;
  sale_price: number;

  gross_total: number;
  discount_amount: number;
  net_total: number;

  total_cost: number;
  profit: number;

  created_at: string;
}

export interface Sale {
  id: string;

  customer_name: string;
  customer_phone: string | null;
  project_address: string | null;
invoice_number: string;
customer_number: string;
  subtotal: number;
  discount: number;
  total: number;

  total_cost: number;
  total_profit: number;

  created_at: string;
  created_by: string | null;

  items?: SaleItem[];
}

export interface CreateSaleItem {
  product_id: string;
  quantity: number;
}

export interface CreateSaleInput {
  customer_name: string;
  customer_phone?: string;
  project_address?: string;
  discount: number;
  items: CreateSaleItem[];
}

export interface CreateSaleResult {
  sale_id: string;

  subtotal: number;
  discount: number;
  total: number;
invoice_number: string;
customer_number: string;
  total_cost: number;
  total_profit: number;

  created_at: string;
}

export interface ProductInput {
  name: string;
  price: number;
  description: string | null;
  purchasePrice: number;
stockQuantity: number;
  categoryId: string | null;
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
    invoiceStoreName: string;
  invoicePhone: string;
  invoiceAddress: string;
  invoiceFooterText: string;
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
  template: TemplateId;
welcomeEnabled: boolean;
welcomeDuration: number;
welcomeImageUrl: string | null;
}

/** Draft settings incl. storage paths needed for file replacement/removal. */
export interface SettingsDraft extends AppSettings {
  logoPath: string | null;
  customFontPath: string | null;
  welcomeImagePath: string | null;
}

export type SettingsPatch = Partial<Omit<SettingsDraft, 'id'>>;

export interface Publication {
  version: number;
  productCount: number;
  publishedAt: string;
}

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  activeProducts: number;
  inactiveProducts: number;
  lastPublishedAt: string | null;
  publishedVersion: number | null;
  hasUnpublishedChanges: boolean;
}

export interface PublicPriceListData {
  settings: AppSettings;
  products: Product[];
  categories: Category[];
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