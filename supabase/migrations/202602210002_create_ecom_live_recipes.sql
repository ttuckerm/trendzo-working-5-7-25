create table if not exists public.ecom_live_recipes (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.ecom_products(id) on delete cascade,
  target_buyer text,
  price_point text,
  creator_style text,
  recipe jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists ecom_live_recipes_product_id_idx
  on public.ecom_live_recipes (product_id, created_at desc);
