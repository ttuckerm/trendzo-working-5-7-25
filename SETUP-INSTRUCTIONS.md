# Setup Instructions for Viral Template Feed

## Current Status
The viral template feed components have been created successfully, but there are a few setup steps needed to resolve the errors and get everything working.

## Issues to Fix

### 1. WebSocket Error (RESOLVED)
✅ **Fixed**: Disabled real-time subscriptions temporarily to avoid WebSocket issues in browser
- The error "ws does not work in the browser" has been resolved
- Real-time updates are commented out and can be re-enabled later

### 2. Database Setup (NEEDS MANUAL ACTION)
❌ **Requires Action**: Run the following SQL in your Supabase SQL editor:

```sql
-- Step 1: Add viral columns to tiktok_templates table
ALTER TABLE tiktok_templates 
ADD COLUMN IF NOT EXISTS views BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS viral_score INTEGER DEFAULT 0 CHECK (viral_score >= 0 AND viral_score <= 100),
ADD COLUMN IF NOT EXISTS sound_id TEXT,
ADD COLUMN IF NOT EXISTS sound_title TEXT,
ADD COLUMN IF NOT EXISTS sound_author TEXT;

-- Step 2: Update existing data
UPDATE tiktok_templates 
SET 
  views = COALESCE((engagement_metrics->>'views')::BIGINT, 0),
  likes = COALESCE((engagement_metrics->>'likes')::BIGINT, 0)
WHERE engagement_metrics IS NOT NULL;

-- Step 3: Calculate viral scores
UPDATE tiktok_templates 
SET viral_score = LEAST(100, GREATEST(0, 
  CASE 
    WHEN views > 1000000 THEN 90 + (likes::FLOAT / views::FLOAT * 100)::INTEGER / 10
    WHEN views > 100000 THEN 70 + (likes::FLOAT / views::FLOAT * 100)::INTEGER / 3
    WHEN views > 10000 THEN 50 + (likes::FLOAT / views::FLOAT * 100)::INTEGER / 5
    ELSE 30 + (likes::FLOAT / GREATEST(views, 1)::FLOAT * 100)::INTEGER / 10
  END
));

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS tiktok_templates_views_idx ON tiktok_templates(views DESC);
CREATE INDEX IF NOT EXISTS tiktok_templates_likes_idx ON tiktok_templates(likes DESC);
CREATE INDEX IF NOT EXISTS tiktok_templates_viral_score_idx ON tiktok_templates(viral_score DESC);
CREATE INDEX IF NOT EXISTS tiktok_templates_sound_id_idx ON tiktok_templates(sound_id);

-- Step 5: Create templates view
CREATE OR REPLACE VIEW templates AS
SELECT 
  id::TEXT as id,
  title,
  COALESCE(category, 'Uncategorized') as category,
  description,
  thumbnail_url as "thumbnailUrl",
  video_url as "videoUrl", 
  views,
  likes,
  viral_score,
  COALESCE(duration::TEXT || 's', '15s') as duration,
  sound_id,
  sound_title,
  sound_author,
  created_at,
  updated_at
FROM tiktok_templates;

-- Step 6: Grant permissions
GRANT SELECT ON templates TO anon;
GRANT SELECT ON templates TO authenticated;
```

### 3. Seed Sample Data (OPTIONAL)
Run this SQL to add sample viral templates:

```sql
-- Located in: scripts/seed-viral-templates.sql
-- Copy and paste the content from that file into Supabase SQL editor
```

### 4. Environment Variables
Create a `.env.local` file in your project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Fallback Behavior
✅ **Working**: The application includes fallback mock data, so it will work even if:
- Database is not set up
- Supabase connection fails
- Environment variables are missing

## Components Created
✅ **Complete**: All viral template feed components have been created:

- `ViralTemplateFeedPage` - Main page with infinite scroll
- `TemplateGrid` - Responsive grid layout
- `ViralTemplateCard` - Individual template cards with animations
- `ViralDNA` - Viral score indicators (1-3 dots)
- `TrendingBadge` - Live trending count
- `CustomCursor` - Smooth custom cursor
- `FloatingOrbs` - Ambient background effects
- `LoadingIndicator` - Infinite scroll loader

## Testing the Implementation

1. **Start the development server:**
   ```bash
   pnpm dev
   ```

2. **Navigate to the viral template feed:**
   ```
   http://localhost:3001/dashboard-view/template-library/view
   ```

3. **Expected behavior:**
   - Page loads with mock data (if database not set up)
   - Smooth animations and hover effects
   - Custom cursor on desktop
   - Infinite scroll simulation
   - Responsive design

## Next Steps

1. **Immediate**: Run the database migration SQL in Supabase
2. **Optional**: Seed sample data for testing
3. **Future**: Re-enable real-time subscriptions when needed
4. **Enhancement**: Add search and filtering features

## Troubleshooting

### Page Not Loading
- Check if development server is running on port 3001
- Verify the route: `/dashboard-view/template-library/view`

### No Templates Showing
- Check browser console for errors
- Verify Supabase connection (or rely on fallback data)
- Ensure the `templates` view exists in database

### Animations Not Working
- Check if Tailwind CSS is properly configured
- Verify Framer Motion is installed
- Test on different browsers

The viral template feed is now ready to use with a stunning TikTok-inspired design! 