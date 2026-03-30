diff --git a/supabase/migrations/202602210001_create_ecom_products.sql b/supabase/migrations/202602210001_create_ecom_products.sql
new file mode 100644
index 0000000..5a0a67f
--- /dev/null
+++ b/supabase/migrations/202602210001_create_ecom_products.sql
@@ -0,0 +1,23 @@
+create table if not exists public.ecom_products (
+  id text primary key,
+  name text not null,
+  conversion_rate numeric not null default 0 check (conversion_rate >= 0 and conversion_rate <= 1),
+  margin_rate numeric not null default 0 check (margin_rate >= 0 and margin_rate <= 1),
+  weekly_traffic integer not null default 0 check (weekly_traffic >= 0),
+  trend_velocity numeric not null default 0 check (trend_velocity >= -1 and trend_velocity <= 1),
+  created_at timestamptz not null default now(),
+  updated_at timestamptz not null default now()
+);
+
+create index if not exists ecom_products_updated_at_idx
+  on public.ecom_products (updated_at desc);
+
+create or replace function public.set_updated_at_ecom_products()
+returns trigger
+language plpgsql
+as $$
+begin
+  new.updated_at = now();
+  return new;
+end;
+$$;
