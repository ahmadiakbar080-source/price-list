import { supabase } from '@/lib/supabase';
import { GENERIC_ERROR, PUBLICATIONS_HISTORY_LIMIT } from '@/lib/constants';
import type { DashboardStats, Publication } from '@/types';

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc('get_dashboard_stats');
  if (error) {
    console.error('[publication] stats failed:', error.message);
    throw new Error(GENERIC_ERROR);
  }
  const d = data as any;
  return {
    totalProducts: Number(d.total_products ?? 0),
    totalCategories: Number(d.total_categories ?? 0),
    activeProducts: Number(d.active_products ?? 0),
    inactiveProducts: Number(d.inactive_products ?? 0),
    lastPublishedAt: d.last_published_at ?? null,
    publishedVersion: d.published_version != null ? Number(d.published_version) : null,
    hasUnpublishedChanges: Boolean(d.has_unpublished_changes),
  };
}

/** Atomic publish — executes the publish_changes() PostgreSQL function. */
export async function publishChanges(): Promise<{ version: number; productCount: number }> {
  const { data, error } = await supabase.rpc('publish_changes');
  if (error) {
    console.error('[publication] publish failed:', error.message);
    throw new Error(GENERIC_ERROR);
  }
  const d = data as any;
  return { version: Number(d.version), productCount: Number(d.product_count ?? 0) };
}

export async function listRecentPublications(limit = PUBLICATIONS_HISTORY_LIMIT): Promise<Publication[]> {
  const { data, error } = await supabase
    .from('publications')
    .select('version,product_count,published_at')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[publication] history failed:', error.message);
    throw new Error(GENERIC_ERROR);
  }
  return (data ?? []).map((row: any) => ({
    version: Number(row.version),
    productCount: Number(row.product_count ?? 0),
    publishedAt: String(row.published_at),
  }));
}