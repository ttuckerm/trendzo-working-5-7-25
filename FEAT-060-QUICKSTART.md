# FEAT-060 Quick Start Guide

## Prerequisites

```bash
# Install LLM SDK dependencies
npm install openai @anthropic-ai/sdk @google/generative-ai

# Set environment variables
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AIza...
```

---

## 1. Database Setup

```bash
# Apply migration
supabase db push

# Verify table created
supabase db query "SELECT COUNT(*) FROM extracted_knowledge"
```

---

## 2. Extract Knowledge for One Video

```bash
# Start dev server
npm run dev

# Extract knowledge (replace video_id)
curl -X POST http://localhost:3002/api/knowledge/extract \
  -H "Content-Type: application/json" \
  -d '{"video_id": "7556687934095723798"}'
```

**Expected Response:**
```json
{
  "success": true,
  "extraction_id": "uuid",
  "consensus_insights": {
    "viral_hooks": ["specific phrases"],
    "emotional_triggers": ["curiosity gap", "FOMO"],
    "content_structure": "problem-solution-cta",
    "value_proposition": "learn X in 60 seconds",
    "call_to_action": "follow for more",
    "viral_coefficient_factors": ["shareable advice"],
    "pattern_match": "hook-pattern-curiosity-gap",
    "novelty_score": 6.5,
    "confidence": 0.89
  },
  "processing_time_ms": 2847,
  "llm_agreement": 0.87,
  "confidence": 0.92
}
```

---

## 3. Batch Process Videos

```bash
# Extract top 10 mega-viral videos
node scripts/batch-extract-knowledge.js --classification mega-viral --limit 10

# Extract all videos with DPS >= 70
node scripts/batch-extract-knowledge.js --min-dps 70

# Re-extract with force refresh
node scripts/batch-extract-knowledge.js --limit 50 --force-refresh

# Run with higher parallelism (faster but more API load)
node scripts/batch-extract-knowledge.js --parallel 5
```

**Output:**
```
═══════════════════════════════════════════════════════════════
   FEAT-060: Batch Knowledge Extraction
═══════════════════════════════════════════════════════════════

🔍 Fetching videos to process...

📊 Found 10 videos to process
   Classification: mega-viral
   Parallel: 3

📦 Batch 1/4 (3 videos)
   ✅ 7556687934095723798 | Agreement: 87% | Confidence: 92% | 2847ms
   ✅ 7428319847219847938 | Agreement: 91% | Confidence: 88% | 3124ms
   ✅ 7329847219847219847 | Agreement: 79% | Confidence: 85% | 2956ms

...

═══════════════════════════════════════════════════════════════
   EXTRACTION COMPLETE
═══════════════════════════════════════════════════════════════

📊 Results:
   Total:        10
   ✅ Success:   9 (90.0%)
   ❌ Failed:    1
   💾 Cached:    0
   ⏱️  Total Time: 28.3s
   📈 Avg Time:  2.83s/video

📈 Quality Metrics:
   Avg Agreement:  85.2%
   Avg Confidence: 87.8%
   Novel Patterns: 2
```

---

## 4. Query Results

```sql
-- View high-quality extractions
SELECT * FROM high_quality_extractions LIMIT 5;

-- Find novel patterns
SELECT * FROM novel_pattern_candidates;

-- Check specific video
SELECT
  consensus_insights->>'viral_hooks' as hooks,
  consensus_insights->>'emotional_triggers' as triggers,
  agreement_score,
  confidence_score
FROM extracted_knowledge
WHERE video_id = '7556687934095723798';

-- Quality metrics
SELECT
  AVG(agreement_score) as avg_agreement,
  AVG(confidence_score) as avg_confidence,
  COUNT(*) FILTER (WHERE is_novel_pattern = true) as novel_count
FROM extracted_knowledge;
```

---

## 5. Retrieve Cached Extraction

```bash
# GET endpoint (no re-processing)
curl http://localhost:3002/api/knowledge/extract?video_id=7556687934095723798
```

---

## Troubleshooting

### "All LLM extractions failed"
- Check API keys are set correctly
- Verify API quotas not exceeded
- Check network connectivity
- Review logs for specific LLM errors

### "Video not found or missing transcript"
- Verify video exists: `SELECT * FROM scraped_videos WHERE video_id = 'X'`
- Check transcript/caption not null
- Ensure DPS score calculated

### "Agreement score is low (<0.5)"
- Normal for very unique content
- Review individual LLM analyses for conflicts
- May indicate ambiguous/low-quality content

### High API costs
- Reduce `--parallel` flag (default: 3)
- Use `--limit` to test small batches first
- Check for unnecessary `--force-refresh` calls

---

## Example: Full Pipeline

```bash
# 1. Apply migration
supabase db push

# 2. Test single extraction
curl -X POST http://localhost:3002/api/knowledge/extract \
  -H "Content-Type: application/json" \
  -d '{"video_id": "7556687934095723798"}'

# 3. Batch extract top 50 videos
node scripts/batch-extract-knowledge.js --limit 50

# 4. Review results
supabase db query "SELECT * FROM high_quality_extractions LIMIT 10"

# 5. Find novel patterns
supabase db query "SELECT * FROM novel_pattern_candidates"
```

---

## Next: Integrate with Prediction

Once extractions complete, use knowledge to improve predictions:

```typescript
// Example: Use extracted hooks in prediction model
const { data } = await supabase
  .from('high_quality_extractions')
  .select('consensus_insights, dps_score')
  .gte('dps_score', 70);

const topHooks = data.flatMap(d => d.consensus_insights.viral_hooks);
// Feed into ML model or pattern recommender
```

See [FEAT-063-SELF-IMPROVING-LOOP.md](FEAT-063-SELF-IMPROVING-LOOP.md) for full integration.
