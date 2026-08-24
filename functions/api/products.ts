export async function onRequest(context: any) {
  const url = context.env.VITE_SUPABASE_URL || context.env.SUPABASE_URL;
  const key = context.env.VITE_SUPABASE_ANON_KEY || context.env.SUPABASE_KEY;

  if (!url || !key) {
    return Response.json({ error: "Supabase keys are missing" }, { status: 500 });
  }

  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
  };

  try {
    const [settingsRes, productsRes, categoriesRes, pubRes] = await Promise.all([
      fetch(`${url}/rest/v1/published_settings?id=eq.1`, { headers }),
      fetch(`${url}/rest/v1/published_products?is_active=eq.true&order=sort_order.asc,name.asc`, { headers }),
      fetch(`${url}/rest/v1/published_categories?order=sort_order.asc`, { headers }),
      fetch(`${url}/rest/v1/publications?order=published_at.desc&limit=1`, { headers }),
    ]);

    const settingsData = await settingsRes.json();
    const productsData = await productsRes.json();
    const categoriesData = await categoriesRes.json();
    const pubData = await pubRes.json();

    return Response.json({
      settings: Array.isArray(settingsData) ? settingsData[0] : null,
      products: Array.isArray(productsData) ? productsData : [],
      categories: Array.isArray(categoriesData) ? categoriesData : [],
      publication: Array.isArray(pubData) ? pubData[0] : null,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}