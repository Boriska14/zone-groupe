-- Zone Groupe — schéma Supabase. À exécuter dans SQL Editor (en une fois).
create extension if not exists "pgcrypto";

-- ===== Admins =====
create table if not exists admins (user_id uuid primary key references auth.users(id) on delete cascade);

create or replace function is_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from admins where user_id = auth.uid())
$$;

-- ===== Catalogue =====
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  slug text unique not null,
  brand text,
  description text,
  price integer not null check (price >= 0),
  compare_at_price integer,
  stock integer not null default 0 check (stock >= 0),
  images text[] not null default '{}',
  negotiable boolean not null default true,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

-- Prix plancher : table séparée, JAMAIS lisible par le public (RLS admin uniquement)
create table if not exists product_floors (
  product_id uuid primary key references products(id) on delete cascade,
  min_price integer not null check (min_price >= 0)
);

create table if not exists settings (
  key text primary key,
  value jsonb not null
);
insert into settings (key, value) values
  ('admin_available', 'false'::jsonb),
  ('shop', '{"name":"Zone Groupe","phone":"+237697707229","whatsapp":"+237697707229","address":"Cameroun"}'::jsonb)
on conflict (key) do nothing;

-- ===== Négociation =====
create table if not exists negotiations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  session_token text not null,
  customer_name text,
  mode text not null default 'bot' check (mode in ('bot','admin')),
  status text not null default 'open' check (status in ('open','accepted','closed')),
  rounds int not null default 0,
  agreed_price integer,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists negotiations_lookup on negotiations (product_id, session_token);

create table if not exists negotiation_messages (
  id uuid primary key default gen_random_uuid(),
  negotiation_id uuid not null references negotiations(id) on delete cascade,
  sender text not null check (sender in ('customer','bot','admin','system')),
  content text not null,
  offer integer,
  created_at timestamptz not null default now()
);
create index if not exists negotiation_messages_idx on negotiation_messages (negotiation_id, created_at);

-- ===== Commandes =====
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  email text,
  city text,
  address text,
  notes text,
  total integer not null,
  status text not null default 'pending' check (status in ('pending','paid','failed','shipped','delivered','cancelled')),
  payment_provider text,
  payment_ref text,
  operator text,
  momo_phone text,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  name text not null,
  unit_price integer not null,
  qty integer not null check (qty > 0),
  negotiation_id uuid references negotiations(id) on delete set null
);

-- ===== RLS =====
alter table admins enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_floors enable row level security;
alter table settings enable row level security;
alter table negotiations enable row level security;
alter table negotiation_messages enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "categories public read" on categories for select using (is_active or is_admin());
create policy "categories admin write" on categories for all using (is_admin()) with check (is_admin());

create policy "products public read" on products for select using (is_active or is_admin());
create policy "products admin write" on products for all using (is_admin()) with check (is_admin());

create policy "floors admin only" on product_floors for all using (is_admin()) with check (is_admin());

create policy "settings public read" on settings for select using (true);
create policy "settings admin write" on settings for all using (is_admin()) with check (is_admin());

create policy "negotiations admin" on negotiations for all using (is_admin()) with check (is_admin());
create policy "negotiation_messages admin" on negotiation_messages for all using (is_admin()) with check (is_admin());

create policy "orders admin" on orders for all using (is_admin()) with check (is_admin());
create policy "order_items admin" on order_items for all using (is_admin()) with check (is_admin());

create policy "admins self read" on admins for select using (user_id = auth.uid());

-- Les clients passent par les routes API serveur (clé service_role) pour
-- négociations, commandes et paiements : aucune policy publique d'écriture.

-- ===== Storage (images produits) =====
insert into storage.buckets (id, name, public) values ('products', 'products', true)
on conflict (id) do nothing;

create policy "products images public read" on storage.objects for select using (bucket_id = 'products');
create policy "products images admin insert" on storage.objects for insert with check (bucket_id = 'products' and is_admin());
create policy "products images admin update" on storage.objects for update using (bucket_id = 'products' and is_admin());
create policy "products images admin delete" on storage.objects for delete using (bucket_id = 'products' and is_admin());

-- ===== Données de départ =====
insert into categories (name, slug, position) values
  ('Smartphones', 'smartphones', 1),
  ('Ordinateurs', 'ordinateurs', 2),
  ('TV & Audio', 'tv-audio', 3),
  ('Accessoires', 'accessoires', 4),
  ('Électroménager', 'electromenager', 5)
on conflict (slug) do nothing;

-- ===== Créer le compte propriétaire =====
-- 1) Authentication > Users > Add user (email + mot de passe)
-- 2) Puis exécuter, avec VOTRE email :
-- insert into admins (user_id) select id from auth.users where email = 'proprietaire@exemple.com';
