# Creator Dashboard - Setup Instructions

## ✅ What's Been Built

### 1. Main Creator Dashboard (`/admin/creators`)
- Lists all onboarded creators
- Shows baseline metrics for each creator
- "Add Creator" button with modal
- Triggers Apify scrape directly from UI
- Real-time scrape progress

### 2. Individual Creator Pages (`/admin/creators/[username]`)
- Full baseline metrics display
- Upload video & get personalized prediction
- Creator context analysis (relative score, percentile rank, etc.)
- Prediction history tracking
- All predictions are creator-specific

### 3. API Endpoints
- `GET /api/creator/list` - Get all creators
- `GET /api/creator/onboard?username=X` - Get creator profile
- `POST /api/creator/onboard` - Scrape and onboard new creator
- `GET /api/creator/predictions?username=X` - Get prediction history
- `POST /api/creator/predictions` - Save prediction with creator context

### 4. Database Schema
- `creator_profiles` - Already exists
- `creator_video_history` - Already exists
- `creator_predictions` - **NEEDS TO BE CREATED**

---

## 🔧 Setup Steps

### Step 1: Apply Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Creator Predictions Table
-- Tracks predictions made for specific creators with personalized context

CREATE TABLE IF NOT EXISTS creator_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to creator profile
  creator_profile_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,

  -- Link to original prediction
  prediction_id UUID REFERENCES prediction_events(id) ON DELETE SET NULL,
  video_id UUID REFERENCES video_files(id) ON DELETE SET NULL,

  -- Raw prediction
  predicted_dps DECIMAL(5,2) NOT NULL,

  -- Creator context
  relative_score INTEGER NOT NULL, -- 0-10 scale
  improvement_factor DECIMAL(4,2) NOT NULL, -- e.g., 1.5x
  percentile_rank TEXT NOT NULL, -- e.g., "top 10%", "p75-p90"
  adjusted_dps DECIMAL(5,2) NOT NULL, -- DPS after creator adjustment
  contextualized_message TEXT NOT NULL, -- e.g., "🔥 1.5x better than your average"

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_creator_predictions_profile ON creator_predictions(creator_profile_id);
CREATE INDEX idx_creator_predictions_prediction ON creator_predictions(prediction_id);
CREATE INDEX idx_creator_predictions_created ON creator_predictions(created_at DESC);

COMMENT ON TABLE creator_predictions IS 'Prediction history with creator-specific context and personalization';
```

### Step 2: Access the Creator Dashboard

Navigate to: **http://localhost:3000/admin/creators**

---

## 📋 How to Use

### Add a New Creator

1. Go to `/admin/creators`
2. Click **[+ Add Creator]**
3. Enter TikTok username (e.g., `sidehustlereview`)
4. System automatically:
   - Scrapes their channel via Apify
   - Analyzes all videos
   - Calculates baseline DPS
   - Builds percentile distribution
5. Creator appears in the list

### Get Personalized Prediction

1. Click **[View Details]** on any creator
2. Upload a video file
3. (Optional) Add transcript, select niche, goal, account size
4. Click **[Get Personalized Prediction]**
5. System shows:
   - Raw Kai prediction (e.g., 68.2 DPS)
   - **Creator context:** relative score, improvement factor, percentile rank
   - **Adjusted DPS** with creator-specific bonus/penalty
   - **Personalized message** (e.g., "🔥 1.6x better than your average!")

### View Prediction History

- All predictions for a creator are tracked on their detail page
- Shows comparison to their baseline
- Tracks performance trends over time

---

## 🎯 Example Flow

```
1. Add @sidehustlereview
   → Scrapes 50 videos
   → Baseline: 41.6 DPS

2. Upload new video for them
   → Kai predicts: 68.2 DPS
   → System adds context: "🔥 1.6x better than your 41.6 baseline!"
   → Relative score: 10/10
   → Adjusted DPS: 78.2 (+10 bonus)

3. History shows:
   - Video #1: 68.2 DPS (Top 10% for you)
   - Video #2: 45.0 DPS (Similar to baseline)
   - etc.
```

---

## 🔗 Current State

### Already Onboarded:
- @sidehustlereview (50 videos, 41.6 DPS baseline)

### Ready to Use:
- `/admin/creators` - Main dashboard ✅
- `/admin/creators/sidehustlereview` - Detail page ✅
- Upload & predict with creator context ✅
- Scrape new creators from UI ✅

### Needs:
- Run SQL migration above to create `creator_predictions` table
- Then system is fully operational!

---

## 📂 Files Created

```
✅ src/app/admin/creators/page.tsx (Main dashboard)
✅ src/app/admin/creators/[username]/page.tsx (Creator detail page)
✅ src/app/api/creator/list/route.ts (List all creators)
✅ src/app/api/creator/predictions/route.ts (Prediction history API)
✅ supabase/migrations/20251120_creator_predictions.sql (Database schema)
```

---

## ✨ Key Features

1. **Scrape from UI** - No need to run scripts, just enter username
2. **Real-time Progress** - See scrape status as it happens
3. **Personalized Predictions** - Every prediction is contextualized to the creator
4. **History Tracking** - All predictions saved and viewable
5. **Creator-Specific** - Each creator has their own page with their data only

The system is production-ready once the SQL migration is applied!
