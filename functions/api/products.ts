import { createClient } from '@supabase/supabase-js';

export async function onRequest(context: any) {
  const supabaseUrl = context.env.VITE_SUPABASE_URL || context.env.SUPABASE_URL;
  const supabaseKey = context.env.VITE_SUPABASE_ANON_KEY || context.env.SUPABASE_KEY;

  const supabase = createClient(supabaseUrl, supabaseKey);

  // دریافت همزمان تمام اطلاعات لازم از Supabase
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

  if (settingsRes.error || productsRes.error || categoriesRes.error || publicationRes.error) {
    return Response.json({ error: 'خطا در دریافت اطلاعات از دیتابیس' }, { status: 500 });
  }

  return Response.json({
    settings: settingsRes.data,
    products: productsRes.data,
    categories: categoriesRes.data,
    publication: publicationRes.data?.[0] ?? null,
  });
}