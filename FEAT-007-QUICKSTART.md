# FEAT-007: Pre-Content Prediction - Quick Start Guide

**Goal:** Get script viral predictions working in under 10 minutes.

---

## Step 1: Environment Setup (2 min)

Add these to `.env.local`:

```bash
# OpenAI (for GPT-4)
OPENAI_API_KEY=sk-proj-...

# Anthropic (for Claude)
ANTHROPIC_API_KEY=sk-ant-...

# Google AI (for Gemini)
GOOGLE_AI_API_KEY=AIza...

# Feature Flag (optional, defaults to true)
NEXT_PUBLIC_FF-PreContentAnalyzer-v1=true
```

**Get API Keys:**
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/settings/keys
- Google AI: https://makersuite.google.com/app/apikey

---

## Step 2: Database Migration (1 min)

Run the migration to create the `pre_content_predictions` table:

```bash
# If using Supabase CLI
supabase db push

# Or via SQL in Supabase Dashboard
# Copy contents of: supabase/migrations/20251003_feat007_pre_content_predictions.sql
# Run in SQL Editor
```

---

## Step 3: Install Dependencies (1 min)

```bash
npm install openai @anthropic-ai/sdk @google/generative-ai
```

---

## Step 4: Test the API (1 min)

Start your dev server:

```bash
npm run dev
```

Test health check:

```bash
curl http://localhost:3000/api/predict/pre-content?action=health
```

Expected response:
```json
{
  "status": "operational",
  "featureFlag": "FF-PreContentAnalyzer-v1",
  "enabled": true,
  "timestamp": "2025-10-03T..."
}
```

---

## Step 5: Make Your First Prediction (1 min)

Create a test file `test-prediction.json`:

```json
{
  "script": "Day 1 of cutting my expenses by 50%. I cancelled Netflix, Spotify, and my gym membership. Here's what I learned: you don't need subscriptions to be happy. I started working out at home, reading library books, and cooking instead of ordering DoorDash. Week 1 savings: $487. Follow for Day 2!",
  "storyboard": "Opens with before photo showing all subscription apps. Shows cancellation screens. Cut to home workout, library visit, home-cooked meal. Ends with savings tracker.",
  "niche": "personal-finance",
  "platform": "tiktok",
  "creatorFollowers": 10000
}
```

Run the prediction:

```bash
curl -X POST http://localhost:3000/api/predict/pre-content \
  -H "Content-Type: application/json" \
  -d @test-prediction.json
```

---

## Expected Output

```json
{
  "predictedViralScore": 82,
  "predictedDPS": 76.5,
  "confidence": 0.89,
  "predictions": {
    "estimatedViews": "180K-270K",
    "estimatedLikes": "12K-18K",
    "estimatedDPSPercentile": "Top 10%"
  },
  "breakdown": {
    "patternMatchScore": 78,
    "llmConsensusScore": 85,
    "llmScores": {
      "gpt4": 84,
      "claude": 87,
      "gemini": 84
    }
  },
  "ideaLegos": {
    "topic": "Expense reduction challenge",
    "angle": "Documenting real-time savings journey",
    "hookStructure": "Day X format with specific number ($487)",
    "storyStructure": "Problem → action → result → teaser",
    "visualFormat": "Screen recording + real-life B-roll",
    "keyVisuals": "App cancellations, savings tracker, lifestyle changes",
    "audio": "Voice-over narration"
  },
  "recommendations": [
    "Show the $487 savings number in first 3 seconds",
    "Add reaction shot after each cancellation",
    "Include one 'unexpected benefit' discovery"
  ],
  "topMatchingPatterns": [
    {
      "type": "hook_structure",
      "description": "Day X of challenge with specific number/stat",
      "successRate": 0.91,
      "avgDPS": 84.2,
      "matchScore": 95
    }
  ]
}
```

---

## Troubleshooting

### "All LLM providers failed"
- Check API keys in `.env.local`
- Verify keys are valid (test at provider dashboards)
- Check rate limits / billing status

### "No viral patterns found"
- Run FEAT-003 pattern extraction first
- Or manually seed some patterns in `viral_patterns` table

### "Database query failed"
- Verify migration ran successfully
- Check Supabase connection in `.env.local`

### Response > 5 seconds
- Normal on first call (cold start)
- Should be ~2-4s on subsequent calls (cached patterns)
- Check LLM API latency in logs

---

## Next Steps

1. **Integrate into UI:**
   - Create a form component
   - Display results with charts
   - Add "Try These Recommendations" action buttons

2. **Test with Real Scripts:**
   - Use actual creator scripts
   - Compare predictions to published content
   - Measure accuracy

3. **A/B Testing:**
   - Submit 2-3 script variations
   - Compare predicted scores
   - Choose highest-scoring version

4. **Track Accuracy:**
   - When content goes live, call `updatePredictionWithActual()`
   - Monitor prediction error rates
   - Refine weighting formulas

---

## API Reference Card

**Endpoint:** `POST /api/predict/pre-content`

**Required Fields:**
- `script` (string, min 10 chars)
- `niche` (string)
- `platform` ("tiktok" | "instagram" | "youtube" | "twitter" | "linkedin")

**Optional Fields:**
- `storyboard` (string)
- `creatorFollowers` (number)

**Response Time:** ~2-5 seconds

**Cost per Prediction:** ~$0.10-0.20 (LLM API calls)

---

## Quick Commands Cheat Sheet

```bash
# Health check
curl localhost:3000/api/predict/pre-content?action=health

# Simple prediction
curl -X POST localhost:3000/api/predict/pre-content \
  -H "Content-Type: application/json" \
  -d '{"script":"Your script here","niche":"fitness","platform":"tiktok"}'

# Check prediction in database
# In Supabase SQL Editor:
SELECT * FROM pre_content_predictions ORDER BY created_at DESC LIMIT 1;

# View accuracy stats
SELECT * FROM prediction_accuracy_stats;
```

---

**You're ready to predict viral success before filming! 🚀**
