# Enhanced Pattern Extraction Implementation Guide

## ✅ What Was Created

### 1. **New Database Schema** (`video_patterns_detailed` table)
**File:** `supabase/migrations/20251006_enhanced_video_patterns.sql`

Stores detailed 9-field breakdown for EACH video:
```sql
CREATE TABLE video_patterns_detailed (
  video_id TEXT PRIMARY KEY,
  niche TEXT,
  
  -- 9 Fields (7 Idea Legos with Hook split into 3)
  topic TEXT,
  angle TEXT,
  hook_spoken TEXT,      -- Exact verbal hook
  hook_text TEXT,        -- On-screen text
  hook_visual TEXT,      -- Visual elements
  story_structure TEXT,
  visual_format TEXT,
  key_visual_elements JSONB,  -- Array of specific elements
  audio_description TEXT,
  
  -- Metrics
  dps_score DECIMAL(5,2),
  extraction_confidence DECIMAL(3,2),
  ...
);
```

### 2. **TypeScript Types**
**File:** `src/lib/services/pattern-extraction/types-enhanced.ts`

```typescript
export interface VideoPatternDetailed {
  topic: string;
  angle: string;
  hookSpoken: string;
  hookText: string;
  hookVisual: string;
  storyStructure: string;
  visualFormat: string;
  keyVisualElements: string[];
  audioDescription: string;
  // ... plus metadata
}
```

### 3. **Enhanced Extraction Engine**
**File:** `src/lib/services/pattern-extraction/enhanced-extraction-engine.ts`

- Processes 5-10 videos per LLM call (detailed extraction needs more tokens)
- GPT-4 extracts ALL 9 fields for EACH video
- Detailed prompt with examples

### 4. **Database Service**
**File:** `src/lib/services/pattern-extraction/enhanced-database-service.ts`

- `storeVideoPattern()` - Store individual video patterns
- `queryVideosForDetailedExtraction()` - Get videos with transcripts
- `getTopVideoPatterns()` - Retrieve stored patterns

### 5. **API Endpoint**
**File:** `src/app/api/patterns/extract-enhanced/route.ts`

- `POST /api/patterns/extract-enhanced` - Run extraction
- `GET /api/patterns/extract-enhanced?niche=X` - Retrieve patterns

### 6. **Execution Script**
**File:** `scripts/run-enhanced-pattern-extraction.js`

Convenience script to trigger extraction

---

## 🚀 How to Run

### Step 1: Apply Database Migration

**Option A: Using Supabase Studio**
1. Go to https://supabase.com/dashboard
2. Navigate to SQL Editor
3. Copy contents of `supabase/migrations/20251006_enhanced_video_patterns.sql`
4. Paste and run

**Option B: Using psql**
```bash
psql $DATABASE_URL -f supabase/migrations/20251006_enhanced_video_patterns.sql
```

**Option C: Using Supabase CLI**
```bash
supabase db push
```

### Step 2: Verify Migration
```sql
-- Check table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'video_patterns_detailed';

-- Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'video_patterns_detailed'
ORDER BY ordinal_position;
```

### Step 3: Start Dev Server
```bash
npm run dev
```

### Step 4: Run Enhanced Extraction

**Option A: Using Script**
```bash
node scripts/run-enhanced-pattern-extraction.js
```

**Option B: Using API Directly**
```bash
curl -X POST http://localhost:3000/api/patterns/extract-enhanced \
  -H "Content-Type: application/json" \
  -d '{
    "niche": "personal-finance",
    "minDPSScore": 70,
    "dateRange": "365d",
    "limit": 20
  }'
```

**Option C: Using Node**
```javascript
const response = await fetch('http://localhost:3000/api/patterns/extract-enhanced', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    niche: 'personal-finance',
    minDPSScore: 70,
    dateRange: '365d',
    limit: 20
  })
});

const result = await response.json();
console.log(result);
```

---

## 📊 Example Output

### What You'll Get:
```json
{
  "success": true,
  "patterns": [
    {
      "videoId": "7556687934095723798",
      "dpsScore": 80,
      "topic": "Credit card debt reduction strategies for millennials",
      "angle": "Contrarian: Minimum payments are a trap designed by banks",
      "hookSpoken": "If you're only paying the minimum on your credit cards, you need to stop right now",
      "hookText": "⚠️ Banks DON'T Want You To Know This",
      "hookVisual": "Close-up of person pointing at camera with urgent expression",
      "storyStructure": "Problem reveal → Shocking explanation → 3-step solution",
      "visualFormat": "Talking head with periodic text overlays and calculator graphics",
      "keyVisualElements": [
        "Dramatic hand gestures",
        "Red warning graphics",
        "Calculator showing interest calculations",
        "Before/after debt numbers",
        "Text 'whoosh' transitions"
      ],
      "audioDescription": "Upbeat motivational background music, energetic voice-over with urgency",
      "extractionConfidence": 0.92
    }
  ],
  "totalVideosAnalyzed": 12,
  "patternsExtracted": 12,
  "llmCallsCount": 3,
  "llmTokensUsed": 8543,
  "llmCostUsd": 0.1234,
  "processingTimeMs": 45000
}
```

---

## 🔍 Query the Data

### Get All Patterns for a Niche:
```sql
SELECT 
  video_id,
  dps_score,
  topic,
  angle,
  hook_spoken,
  hook_text,
  hook_visual,
  story_structure,
  visual_format,
  key_visual_elements,
  audio_description
FROM video_patterns_detailed
WHERE niche = 'personal-finance'
  AND dps_score >= 70
ORDER BY dps_score DESC;
```

### Find Videos with Similar Topics:
```sql
SELECT * 
FROM find_similar_video_patterns(
  'Credit card debt reduction',
  'Contrarian financial advice',
  'personal-finance',
  10
);
```

### Get Aggregated Pattern Statistics:
```sql
SELECT * FROM viral_patterns_aggregated
WHERE niche = 'personal-finance'
ORDER BY success_rate DESC
LIMIT 10;
```

---

## 📝 Key Differences from v1

| Feature | v1 (viral_patterns) | v2 (video_patterns_detailed) |
|---------|---------------------|------------------------------|
| **Granularity** | Aggregated patterns | Per-video detailed patterns |
| **Storage** | Pattern descriptions | 9 structured fields |
| **Hook** | Single field | Split into spoken/text/visual |
| **Key Visuals** | Text description | Array of specific elements |
| **Use Case** | Pattern discovery | Script generation training data |

---

## ⚙️ Configuration

Edit `src/lib/services/pattern-extraction/types-enhanced.ts`:

```typescript
export const DEFAULT_ENHANCED_PATTERN_CONFIG = {
  maxVideosPerBatch: 100,
  maxVideosPerLLMCall: 10,      // Lower for detailed extraction
  llmModel: 'gpt-4-turbo-preview',
  llmTemperature: 0.2,           // Lower for consistency
  llmMaxTokens: 4000,            // Higher for detailed responses
  minConfidenceScore: 0.7,
};
```

---

## 🐛 Troubleshooting

### Error: "Table video_patterns_detailed does not exist"
**Solution:** Apply the migration (Step 1 above)

### Error: "No videos found matching criteria"
**Solution:** Check if videos have transcripts:
```sql
SELECT COUNT(*) 
FROM scraped_videos 
WHERE transcript IS NOT NULL 
  AND niche = 'personal-finance';
```

### Error: "OPENAI_API_KEY not set"
**Solution:** Add to `.env.local`:
```
OPENAI_API_KEY=sk-...
```

### Extraction taking too long
**Solution:** Reduce `maxVideosPerLLMCall` in config (default: 10)

---

## 📈 Next Steps

1. **Apply migration** to database
2. **Start dev server** (`npm run dev`)
3. **Run extraction** on 12 high-DPS videos
4. **Query results** to verify structure
5. **Use patterns** for script generation training

---

## 💡 Pro Tips

- **Start small**: Test with 5-10 videos first
- **Monitor costs**: Detailed extraction uses more tokens (~300-500 per video)
- **Check confidence**: Patterns with confidence < 0.7 may need human review
- **Update regularly**: Re-run extraction monthly to capture new trends
- **Compare versions**: Keep v1 table for pattern aggregation, use v2 for detailed training data

---

## 📞 Support

If you encounter issues:
1. Check console logs for detailed error messages
2. Verify migration was applied successfully
3. Ensure videos have transcripts in database
4. Confirm OPENAI_API_KEY has sufficient credits

