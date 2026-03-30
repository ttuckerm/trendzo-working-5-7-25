-- Session 5: Quick Win finalize columns for generated_scripts
-- Safe to re-run: all ADD COLUMN use IF NOT EXISTS

do $$ begin
  alter table generated_scripts add column if not exists creation_method text;
  alter table generated_scripts add column if not exists ai_guidance jsonb;
  alter table generated_scripts add column if not exists suggested_post_hour integer;
  alter table generated_scripts add column if not exists suggested_hashtags text[];
  alter table generated_scripts add column if not exists suggested_caption text;
end $$;
