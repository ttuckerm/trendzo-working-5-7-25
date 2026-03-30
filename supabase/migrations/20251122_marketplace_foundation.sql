-- ============================================================================
-- MARKETPLACE FOUNDATION MIGRATION
-- Created: November 22, 2025
-- Purpose: Mini app marketplace with revenue sharing
-- ============================================================================

-- ============================================================================
-- MINI APPS TABLE
-- Stores available mini apps in the marketplace
-- ============================================================================
CREATE TABLE IF NOT EXISTS mini_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  creator_id TEXT NOT NULL,
  creator_name TEXT,
  revenue_share DECIMAL(3, 2) DEFAULT 0.80, -- 80% to creator, 20% to platform
  install_count INTEGER DEFAULT 0,
  rating DECIMAL(2, 1) DEFAULT 4.5,
  rating_count INTEGER DEFAULT 0,
  icon TEXT, -- Emoji or image URL
  version TEXT DEFAULT '1.0.0',
  status TEXT DEFAULT 'active', -- active, inactive, suspended
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mini_apps_category ON mini_apps(category);
CREATE INDEX IF NOT EXISTS idx_mini_apps_creator ON mini_apps(creator_id);
CREATE INDEX IF NOT EXISTS idx_mini_apps_status ON mini_apps(status);

-- ============================================================================
-- USER APPS TABLE
-- Tracks which users have installed which apps
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_apps (
  user_id TEXT NOT NULL,
  app_id UUID NOT NULL REFERENCES mini_apps(id) ON DELETE CASCADE,
  installed_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  usage_count INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, app_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_apps_user ON user_apps(user_id);
CREATE INDEX IF NOT EXISTS idx_user_apps_app ON user_apps(app_id);

-- ============================================================================
-- TRANSACTIONS TABLE
-- Records all marketplace purchases and revenue splits
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  app_id UUID NOT NULL REFERENCES mini_apps(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  creator_share DECIMAL(10, 2) NOT NULL,
  platform_share DECIMAL(10, 2) NOT NULL,
  transaction_type TEXT DEFAULT 'purchase', -- purchase, refund, subscription
  status TEXT DEFAULT 'completed', -- pending, completed, failed, refunded
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_app ON transactions(app_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- ============================================================================
-- APP STORAGE TABLE
-- Sandboxed key-value storage for mini apps (scoped to user + app)
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_storage (
  user_id TEXT NOT NULL,
  app_id UUID NOT NULL REFERENCES mini_apps(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, app_id, key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_app_storage_user_app ON app_storage(user_id, app_id);

-- ============================================================================
-- APP ANALYTICS TABLE
-- Tracks usage and events for mini apps
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  app_id UUID NOT NULL REFERENCES mini_apps(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_app_analytics_app ON app_analytics(app_id);
CREATE INDEX IF NOT EXISTS idx_app_analytics_event ON app_analytics(event);
CREATE INDEX IF NOT EXISTS idx_app_analytics_created ON app_analytics(created_at DESC);

-- ============================================================================
-- SEED DATA: Initial Mini Apps
-- ============================================================================

-- Real Estate Viral Generator
INSERT INTO mini_apps (
  name,
  description,
  category,
  price,
  creator_id,
  creator_name,
  icon,
  version,
  rating,
  rating_count
) VALUES (
  'Real Estate Viral Generator',
  'Generate property walkthrough scripts optimized for TikTok & Instagram. Includes DPS predictions, cinematic prompts, and real estate-specific tips. Perfect for realtors who want to go viral.',
  'Real Estate',
  49.00,
  'cleancopy_official',
  'CleanCopy Team',
  '🏠',
  '1.0.0',
  4.8,
  127
) ON CONFLICT DO NOTHING;

-- Fitness Transformation Template
INSERT INTO mini_apps (
  name,
  description,
  category,
  price,
  creator_id,
  creator_name,
  icon,
  version,
  rating,
  rating_count
) VALUES (
  'Fitness Transformation Template',
  'Create before/after transformation content that drives engagement. Auto-generates scripts with optimal hooks, progress tracking, and motivation elements. Built-in DPS optimizer.',
  'Fitness',
  29.00,
  'cleancopy_official',
  'CleanCopy Team',
  '💪',
  '1.0.0',
  4.7,
  89
) ON CONFLICT DO NOTHING;

-- Restaurant Review Generator
INSERT INTO mini_apps (
  name,
  description,
  category,
  price,
  creator_id,
  creator_name,
  icon,
  version,
  rating,
  rating_count
) VALUES (
  'Restaurant Review Generator',
  'Food content that goes viral. Generates engaging food review scripts with perfect pacing, taste descriptions, and price reveals. Includes location tags and trending food hashtags.',
  'Food & Dining',
  19.00,
  'cleancopy_official',
  'CleanCopy Team',
  '🍔',
  '1.0.0',
  4.9,
  203
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update mini_apps.updated_at
CREATE OR REPLACE FUNCTION update_mini_apps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for mini_apps updated_at
DROP TRIGGER IF EXISTS trigger_update_mini_apps_updated_at ON mini_apps;
CREATE TRIGGER trigger_update_mini_apps_updated_at
  BEFORE UPDATE ON mini_apps
  FOR EACH ROW
  EXECUTE FUNCTION update_mini_apps_updated_at();

-- Function to increment install count
CREATE OR REPLACE FUNCTION increment_install_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE mini_apps
  SET install_count = install_count + 1
  WHERE id = NEW.app_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment install count on user_apps insert
DROP TRIGGER IF EXISTS trigger_increment_install_count ON user_apps;
CREATE TRIGGER trigger_increment_install_count
  AFTER INSERT ON user_apps
  FOR EACH ROW
  EXECUTE FUNCTION increment_install_count();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE mini_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_analytics ENABLE ROW LEVEL SECURITY;

-- mini_apps: Everyone can read active apps
CREATE POLICY "Anyone can view active apps"
  ON mini_apps FOR SELECT
  USING (status = 'active');

-- user_apps: Users can only see their own installed apps
CREATE POLICY "Users can view own apps"
  ON user_apps FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can install apps"
  ON user_apps FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can uninstall apps"
  ON user_apps FOR DELETE
  USING (auth.uid()::text = user_id);

-- transactions: Users can only see their own transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid()::text = user_id);

-- app_storage: Users can only access their own app data
CREATE POLICY "Users can access own app storage"
  ON app_storage FOR ALL
  USING (auth.uid()::text = user_id);

-- app_analytics: Apps can write their own analytics
CREATE POLICY "Apps can write analytics"
  ON app_analytics FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE mini_apps IS 'Available mini apps in the marketplace';
COMMENT ON TABLE user_apps IS 'User installations of mini apps';
COMMENT ON TABLE transactions IS 'Marketplace purchase transactions with revenue splits';
COMMENT ON TABLE app_storage IS 'Sandboxed key-value storage for mini apps';
COMMENT ON TABLE app_analytics IS 'Usage analytics for mini apps';

COMMENT ON COLUMN mini_apps.revenue_share IS 'Percentage of revenue that goes to creator (0.80 = 80%)';
COMMENT ON COLUMN transactions.creator_share IS 'Amount paid to app creator';
COMMENT ON COLUMN transactions.platform_share IS 'Amount kept by CleanCopy platform';
