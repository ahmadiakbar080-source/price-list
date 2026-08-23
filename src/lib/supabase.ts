import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly and early with actionable guidance.
  throw new Error(
    '[config] متغیرهای محیطی VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY تنظیم نشده‌اند. ' +
      'فایل .env را بر اساس .env.example بسازید.',
  );
}

/**
 * Frontend client. Uses the PUBLIC anon key only.
 * All authorization is enforced by PostgreSQL RLS + Storage policies,
 * never by hiding data in the UI.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export const SUPABASE_URL = supabaseUrl;