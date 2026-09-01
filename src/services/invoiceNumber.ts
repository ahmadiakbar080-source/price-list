import { supabase } from '@/lib/supabase';


/**
 * ساخت شماره فاکتور یکتا
 * مثال:
 * INV-2026-000123
 */
export function generateInvoiceNumber() {

  const year = new Date().getFullYear();

  const random = Math.floor(
    100000 + Math.random() * 900000
  );


  return `INV-${year}-${random}`;

}



/**
 * گرفتن شماره مشتری بعدی
 * خروجی:
 * 001
 * 002
 * 003
 */
export async function getNextCustomerNumber() {

  const { data, error } = await supabase
    .from('sales')
    .select('customer_number')
    .order('created_at', {
      ascending: false,
    })
    .limit(1);


  if (error) {
    throw error;
  }


  const last =
    Number(data?.[0]?.customer_number ?? 0);


  return String(last + 1).padStart(3, '0');

}