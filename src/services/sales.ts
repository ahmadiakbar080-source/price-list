import { supabase } from '@/lib/supabase';
import { GENERIC_ERROR } from '@/lib/constants';
import type {
  CreateSaleInput,
  CreateSaleResult,
  Sale,
} from '@/types';


/**
 * ثبت فروش جدید
 *
 * عملیات اصلی در دیتابیس انجام می‌شود:
 * - ثبت مشتری
 * - ثبت آیتم‌ها
 * - کم کردن موجودی
 * - محاسبه سود
 */
export async function createSale(
  input: CreateSaleInput
): Promise<CreateSaleResult> {

  const payload = input.items.map((item) => ({
    product_id: item.product_id,
    quantity: item.quantity,
  }));

  const { data, error } = await supabase.rpc(
    'create_sale',
    {
      p_customer_name: input.customer_name,
      p_customer_phone: input.customer_phone ?? null,
      p_project_address: input.project_address ?? null,
      p_discount: input.discount ?? 0,
      p_items: payload,
    }
  );

  if (error) {
    console.error('[sales] create failed:', error.message);
    throw new Error(error.message || GENERIC_ERROR);
  }

  return {
    sale_id: data.sale_id,

    subtotal: Number(data.subtotal ?? 0),
    discount: Number(data.discount ?? 0),
    total: Number(data.total ?? 0),

    total_cost: Number(data.total_cost ?? 0),
    total_profit: Number(data.total_profit ?? 0),

    created_at: data.created_at,
  };
}


/**
 * لیست فروش‌ها
 * فقط برای پنل مدیریت
 */
export async function listSales(): Promise<Sale[]> {

  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      items:sale_items(*)
    `)
    .order('created_at', {
      ascending: false,
    });


  if (error) {
    console.error('[sales] list failed:', error.message);
    throw new Error(GENERIC_ERROR);
  }


  return (data ?? []).map((row) => ({
    id: row.id,

    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    project_address: row.project_address,

    subtotal: Number(row.subtotal ?? 0),
    discount: Number(row.discount ?? 0),
    total: Number(row.total ?? 0),

    total_cost: Number(row.total_cost ?? 0),
    total_profit: Number(row.total_profit ?? 0),

    created_at: row.created_at,
    created_by: row.created_by,

    items: row.items ?? [],
  }));
}


/**
 * دریافت یک فروش
 */
export async function getSaleById(
  id: string
): Promise<Sale> {

  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      items:sale_items(*)
    `)
    .eq('id', id)
    .single();


  if (error) {
    console.error('[sales] get failed:', error.message);
    throw new Error(GENERIC_ERROR);
  }


  return {
    id: data.id,

    customer_name: data.customer_name,
    customer_phone: data.customer_phone,
    project_address: data.project_address,

    subtotal: Number(data.subtotal ?? 0),
    discount: Number(data.discount ?? 0),
    total: Number(data.total ?? 0),

    total_cost: Number(data.total_cost ?? 0),
    total_profit: Number(data.total_profit ?? 0),

    created_at: data.created_at,
    created_by: data.created_by,

    items: data.items ?? [],
  };
}
export async function getSale(id: string) {

  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      sale_items (
        *,
        products (
          name,
          price,
          purchase_price
        )
      )
    `)
    .eq('id', id)
    .single();


  if (error) {
    throw error;
  }


  return data;

}