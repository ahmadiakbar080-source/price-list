-- ============================================================================
-- ONLINE PRICE LIST — complete schema for a FRESH Supabase project
-- Run once in: Supabase Studio → SQL Editor → New query → paste → Run
--
-- Creates: tables, indexes, constraints, triggers, RLS + policies,
--          RPC functions (publish / reorder / stats), storage buckets +
--          storage policies, realtime publication, seed settings row.
--
-- SECURITY MODEL (summary — details inline below):
--   * anon (public visitors):
--       - NO access whatsoever to draft tables (no policy => implicit deny)
--       - SELECT only on published_products WHERE is_active = true
--       - SELECT only on published_settings / publications
--       - READ-ONLY on the two public storage buckets
--   * authenticated (the administrator):
--       - full CRUD on draft tables
--       - read/write files in the two buckets
--       - EXECUTE on publish_changes / reorder_products / get_dashboard_stats
--   * SERVICE_ROLE key is never used by the frontend.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1) DRAFT PRODUCTS  (source of truth for the admin)
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 200),
  price       numeric(14,0) not null default 0 check (price >= 0),
  image_url   text,
  image_path  text,                       -- storage path, used for file lifecycle
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.products is
  'DRAFT products. Admin-only via RLS. NEVER exposed to anonymous visitors.';

create index if not exists idx_products_sort on public.products (sort_order);

-- ----------------------------------------------------------------------------
-- 2) PUBLISHED PRODUCTS  (immutable snapshot written only by publish_changes())
--    NOTE: deliberately NO foreign key to products — deleting/removing a draft
--    must not mutate the public page until the admin explicitly publishes.
-- ----------------------------------------------------------------------------
create table if not exists public.published_products (
  id           uuid primary key,
  name         text not null,
  price        numeric(14,0) not null check (price >= 0),
  image_url    text,
  is_active    boolean not null default true,
  sort_order   integer not null default 0,
  published_at timestamptz not null default now()
);
comment on table public.published_products is
  'Public snapshot. Written ONLY by publish_changes(). Public SELECT is further restricted by RLS to is_active = true.';

create index if not exists idx_published_products_sort
  on public.published_products (sort_order) where is_active;

-- ----------------------------------------------------------------------------
-- 3) SETTINGS (draft singleton) & PUBLISHED SETTINGS
-- ----------------------------------------------------------------------------
create table if not exists public.settings (
  id               integer primary key default 1 check (id = 1),
  brand_name       text not null default 'برند من',
  list_title       text not null default 'لیست قیمت محصولات',
  currency         text not null default 'تومان',
  show_update_date boolean not null default true,
  show_logo        boolean not null default true,
  logo_url         text,
  logo_path        text,
  font_family      text not null default 'Vazirmatn'
                     check (font_family in ('Vazirmatn','Estedad','Shabnam','custom')),
  custom_font_url  text,
  custom_font_path text,
  custom_font_name text,
  primary_color    text not null default '#4f46e5' check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  background_color text not null default '#f8fafc' check (background_color ~ '^#[0-9A-Fa-f]{6}$'),
  text_color       text not null default '#0f172a' check (text_color ~ '^#[0-9A-Fa-f]{6}$'),
  table_style      text not null default 'minimal'
                     check (table_style in ('minimal','bordered','striped')),
  image_size       smallint not null default 56  check (image_size between 32 and 128),
  border_radius    smallint not null default 12  check (border_radius between 0 and 28),
  row_spacing      smallint not null default 10  check (row_spacing between 4 and 24),
  base_font_size   smallint not null default 16  check (base_font_size between 14 and 20),
  updated_at       timestamptz not null default now()
);

create table if not exists public.published_settings (
  id               integer primary key default 1 check (id = 1),
  brand_name       text not null,
  list_title       text not null,
  currency         text not null,
  show_update_date boolean not null default true,
  show_logo        boolean not null default true,
  logo_url         text,
  font_family      text not null default 'Vazirmatn',
  custom_font_url  text,
  custom_font_name text,
  primary_color    text not null,
  background_color text not null,
  text_color       text not null,
  table_style      text not null,
  image_size       smallint not null,
  border_radius    smallint not null,
  row_spacing      smallint not null,
  base_font_size   smallint not null,
  published_at     timestamptz not null default now()
);

-- Guarantee the singleton draft-settings row exists.
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 4) PUBLICATIONS (version metadata — also drives "last updated" on public page)
-- ----------------------------------------------------------------------------
create table if not exists public.publications (
  id            bigint generated always as identity primary key,
  version       integer not null unique,
  product_count integer not null default 0,
  published_by  uuid,                       -- auth.users.id (no FK by design)
  published_at  timestamptz not null default now()
);
create index if not exists idx_publications_published_at
  on public.publications (published_at desc);

-- ----------------------------------------------------------------------------
-- 5) updated_at triggers
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_products_touch on public.products;
create trigger trg_products_touch
  before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_settings_touch on public.settings;
create trigger trg_settings_touch
  before update on public.settings
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- 6) RPC: PUBLISH CHANGES  (atomic — single transaction)
--    Copies the entire draft state into the published snapshot and records a
--    new version. The public page therefore can never observe a half-updated
--    state: readers see either the previous snapshot or the new one.
-- ----------------------------------------------------------------------------
create or replace function public.publish_changes()
returns jsonb
language plpgsql
security definer                      -- runs as owner; bypasses RLS intentionally
set search_path = public
as $$
declare
  v_count   integer;
  v_version integer;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;

  -- 1) products snapshot
  delete from public.published_products;
  insert into public.published_products
    (id, name, price, image_url, is_active, sort_order, published_at)
  select id, name, price, image_url, is_active, sort_order, now()
  from public.products
  order by sort_order asc, created_at asc;
  get diagnostics v_count = row_count;

  -- 2) settings snapshot (singleton upsert; skipped harmlessly if row absent)
  insert into public.published_settings (
    id, brand_name, list_title, currency, show_update_date, show_logo,
    logo_url, font_family, custom_font_url, custom_font_name,
    primary_color, background_color, text_color, table_style,
    image_size, border_radius, row_spacing, base_font_size, published_at)
  select
    s.id, s.brand_name, s.list_title, s.currency, s.show_update_date, s.show_logo,
    s.logo_url, s.font_family, s.custom_font_url, s.custom_font_name,
    s.primary_color, s.background_color, s.text_color, s.table_style,
    s.image_size, s.border_radius, s.row_spacing, s.base_font_size, now()
  from public.settings s
  where s.id = 1
  on conflict (id) do update set
    brand_name       = excluded.brand_name,
    list_title       = excluded.list_title,
    currency         = excluded.currency,
    show_update_date = excluded.show_update_date,
    show_logo        = excluded.show_logo,
    logo_url         = excluded.logo_url,
    font_family      = excluded.font_family,
    custom_font_url  = excluded.custom_font_url,
    custom_font_name = excluded.custom_font_name,
    primary_color    = excluded.primary_color,
    background_color = excluded.background_color,
    text_color       = excluded.text_color,
    table_style      = excluded.table_style,
    image_size       = excluded.image_size,
    border_radius    = excluded.border_radius,
    row_spacing      = excluded.row_spacing,
    base_font_size   = excluded.base_font_size,
    published_at     = now();

  -- 3) version metadata
  select coalesce(max(version), 0) + 1 into v_version from public.publications;
  insert into public.publications (version, product_count, published_by)
  values (v_version, v_count, auth.uid());

  return jsonb_build_object(
    'version', v_version,
    'product_count', v_count,
    'published_at', now()
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- 7) RPC: REORDER PRODUCTS  (batch sort_order update in one transaction)
-- ----------------------------------------------------------------------------
create or replace function public.reorder_products(p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  i integer;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;
  for i in 1 .. coalesce(array_length(p_ids, 1), 0) loop
    update public.products set sort_order = i * 10 where id = p_ids[i];
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- 8) RPC: DASHBOARD STATS (incl. accurate "has unpublished changes?" diff)
-- ----------------------------------------------------------------------------
create or replace function public.get_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last_pub timestamptz;
  v_diff     boolean;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;

  select max(published_at) into v_last_pub from public.publications;

  if v_last_pub is null then
    v_diff := exists (select 1 from public.products);
  else
    -- symmetric difference between draft and published snapshots,
    -- plus any draft-settings change newer than the last publication
    v_diff :=
      exists (
        (select id, name, price, image_url, is_active, sort_order from public.products
         except
         select id, name, price, image_url, is_active, sort_order from public.published_products)
        union all
        (select id, name, price, image_url, is_active, sort_order from public.published_products
         except
         select id, name, price, image_url, is_active, sort_order from public.products)
      )
      or exists (select 1 from public.settings
                 where id = 1 and updated_at > v_last_pub);
  end if;

  return jsonb_build_object(
    'total_products',    (select count(*) from public.products),
    'active_products',   (select count(*) from public.products where is_active),
    'inactive_products', (select count(*) from public.products where not is_active),
    'last_published_at', v_last_pub,
    'published_version', (select max(version) from public.publications),
    'has_unpublished_changes', v_diff
  );
end;
$$;

-- Functions: executable ONLY by the authenticated admin (never by anon).
revoke execute on function public.publish_changes()      from public, anon;
revoke execute on function public.reorder_products(uuid[]) from public, anon;
revoke execute on function public.get_dashboard_stats()  from public, anon;
grant  execute on function public.publish_changes()      to authenticated;
grant  execute on function public.reorder_products(uuid[]) to authenticated;
grant  execute on function public.get_dashboard_stats()  to authenticated;

-- ----------------------------------------------------------------------------
-- 9) ROW LEVEL SECURITY + POLICIES
-- ----------------------------------------------------------------------------

-- 9.1 Enable RLS everywhere (no exceptions, no "allow all").
alter table public.products            enable row level security;
alter table public.settings             enable row level security;
alter table public.published_products   enable row level security;
alter table public.published_settings   enable row level security;
alter table public.publications         enable row level security;

-- 9.2 DRAFT tables → admin (any authenticated user; only admins have accounts.
--     See README "Hardening" for a per-email stricter variant.)
create policy "admins_manage_products"
  on public.products for all
  to authenticated
  using (true) with check (true);

create policy "admins_manage_settings"
  on public.settings for all
  to authenticated
  using (true) with check (true);

-- anon gets NO policy on draft tables ⇒ implicit DENY (cannot read drafts).

-- 9.3 PUBLISHED tables → world-readable, strictly read-only.
--     RLS additionally hides inactive rows from everyone at DB level.
create policy "public_read_active_published_products"
  on public.published_products for select
  using (is_active = true);

create policy "public_read_published_settings"
  on public.published_settings for select
  using (true);

create policy "public_read_publications"
  on public.publications for select
  using (true);

-- No INSERT/UPDATE/DELETE policies exist on published tables for ANY role —
-- writes happen exclusively inside security-definer publish_changes().

-- 9.4 Table privileges (belt & suspenders on top of RLS).
revoke all on public.products, public.settings from anon;
grant select, insert, update, delete on public.products, public.settings to authenticated;
grant select on public.published_products, public.published_settings, public.publications
  to anon, authenticated;
grant usage, select on sequence public.publications_id_seq to authenticated;

-- ----------------------------------------------------------------------------
-- 10) STORAGE — buckets, limits, policies
--     (public READ for storefront assets; WRITE only for authenticated admin)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('brand-assets', 'brand-assets', true)
on conflict (id) do nothing;

update storage.buckets set
  file_size_limit    = 5242880, -- 5 MB
  allowed_mime_types = array['image/jpeg','image/jpg','image/png','image/webp']
where id = 'product-images';

update storage.buckets set
  file_size_limit    = 2097152, -- 2 MB
  allowed_mime_types = array[
    'font/woff','font/woff2','font/ttf',
    'application/font-woff','application/x-font-ttf','application/octet-stream',
    'image/png','image/jpeg','image/webp'] -- last three = logos in same bucket
where id = 'brand-assets';

-- Public read (files are meant to be served to customers):
create policy "public_read_product_images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "public_read_brand_assets"
  on storage.objects for select
  using (bucket_id = 'brand-assets');

-- Admin-only writes:
create policy "admins_insert_product_images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images');
create policy "admins_update_product_images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images') with check (bucket_id = 'product-images');
create policy "admins_delete_product_images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images');

create policy "admins_insert_brand_assets"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'brand-assets');
create policy "admins_update_brand_assets"
  on storage.objects for update to authenticated
  using (bucket_id = 'brand-assets') with check (bucket_id = 'brand-assets');
create policy "admins_delete_brand_assets"
  on storage.objects for delete to authenticated
  using (bucket_id = 'brand-assets');

-- ----------------------------------------------------------------------------
-- 11) REALTIME — push draft-product changes to the open admin dashboard
-- ----------------------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.products;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;

-- ----------------------------------------------------------------------------
-- 12) OPTIONAL SAMPLE DATA — DEVELOPMENT ONLY. Delete before real use!
-- ----------------------------------------------------------------------------
-- insert into public.products (name, price, sort_order) values
--   ('محصول نمونه الف', 125000, 10),
--   ('محصول نمونه ب',   180000, 20),
--   ('محصول نمونه ج',   240000, 30);