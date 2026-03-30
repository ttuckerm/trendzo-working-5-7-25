-- Session 3: Additional columns for onboarding steps 1.7-1.11
-- Safe to re-run: all ADD COLUMN use IF NOT EXISTS

do $$ begin
  -- Step 1.8: Voice & Competitive
  alter table onboarding_profiles add column if not exists differentiator text;

  -- Step 1.9: Signal Calibration
  alter table onboarding_profiles add column if not exists calibration_completed boolean default false;

  -- Step 1.10: Engagement Setup
  alter table onboarding_profiles add column if not exists manychat_connected boolean default false;
  alter table onboarding_profiles add column if not exists lead_magnet_type text;

  -- Step 1.11: System Processing outputs
  alter table onboarding_profiles add column if not exists niche_intelligence jsonb;
  alter table onboarding_profiles add column if not exists proven_hooks jsonb;
  alter table onboarding_profiles add column if not exists content_strategy jsonb;
  alter table onboarding_profiles add column if not exists onboarding_completed boolean default false;
end $$;
