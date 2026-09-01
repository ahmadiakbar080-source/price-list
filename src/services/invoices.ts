import { supabase } from '@/lib/supabase';


export async function getInvoice(id: string) {

  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      sale_items (
        id,
        quantity,
        price,
        discount,
        total,
        products (
          name
        )
      )
    `)
    .eq('id', id)
    .single();


  if (error) {
    throw error;
  }


  return {
    id: data.id,

    number: data.id.slice(0, 8),

    date: data.created_at,

    customerName: data.customer_name,

    customerPhone: data.customer_phone,

    customerAddress: data.project_address,


    items: data.sale_items.map((item: any) => ({

      name: item.products?.name || '',

      quantity: item.quantity,

      price: item.price,

      discount: item.discount || 0,

      total: item.total,

    })),


    total: data.total,

    discount: data.discount || 0,

    final: data.total - (data.discount || 0),

  };

}