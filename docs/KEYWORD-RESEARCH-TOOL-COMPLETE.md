# ✅ Hybrid Keyword Research Tool - COMPLETE

## What We Built

A **hybrid keyword research system** that combines automated expansion (TikTok autocomplete, Google Trends, LLM) with human approval workflow - integrated directly into the Research Review UI.

---

## 🎯 Core Features

### 1. Automated Keyword Expansion
**Sources:**
- **TikTok Autocomplete** - Real search suggestions from TikTok (high confidence: 85%)
- **Google Trends** - Trending search queries (medium confidence: 75%)
- **LLM Expansion (GPT-4)** - AI-generated relevant keywords (medium confidence: 65%)
- **Competitor Hashtags** - From your viral videos database (placeholder for future)

### 2. Confidence Scoring
Each keyword gets a confidence score (0-1) based on source:
- **High (≥0.8):** TikTok autocomplete suggestions
- **Medium (0.6-0.8):** Google Trends + LLM
- **Low (<0.6):** Experimental sources

### 3. Human-in-Loop Approval
- Review all expanded keywords in the UI
- Approve (✓) or Reject (✗) individual keywords
- See confidence scores and sources for each
- Save only approved keywords back to config

### 4. Niche-Specific Expansion
- Uses your existing seed keywords per niche
- Understands niche context (e.g., "personal finance" vs "fitness")
- Returns 30-50+ relevant keywords per niche

---

## 📁 Files Created

### 1. API Endpoint
**`src/app/api/admin/expand-keywords/route.ts`**

Handles POST requests with:
```typescript
{
  seedKeywords: string[],  // From niche config
  niche: string,           // e.g., "personal-finance"
  displayName: string      // e.g., "Personal Finance"
}
```

Returns:
```typescript
{
  expandedKeywords: ExpandedKeyword[],
  summary: {
    total: number,
    highConfidence: number,
    mediumConfidence: number,
    lowConfidence: number,
    sources: { tiktok, googleTrends, llm, competitors }
  }
}
```

**Key Functions:**
- `getTikTokAutocompleteSuggestions()` - Scrapes TikTok search suggestions
- `getGoogleTrendsSuggestions()` - Fetches Google Trends data
- `getLLMKeywordExpansions()` - Uses GPT-4 to generate 30 keywords
- `getCompetitorHashtags()` - Placeholder for analyzing your viral videos

### 2. UI Integration
**`src/app/admin/research-review/page.tsx`** (Updated)

**New Features:**
- **Tab System:** "Research Report" vs "Keyword Research" tabs
- **Expansion Trigger:** Purple "🔍 Research Keywords" button
- **Keyword List:** Shows all expanded keywords with confidence scores
- **Approval UI:** Green (✓) and Red (✗) buttons per keyword
- **Save Function:** "💾 Save Approved Keywords" button
- **Summary Stats:** Shows total, high/medium/low confidence breakdown

### 3. Report API
**`src/app/api/admin/research-reports/route.ts`**

Loads research reports from `research-reports/` directory as JSON files.

---

## 🚀 How to Use

### Step 1: Open Research Review Dashboard
Navigate to: http://localhost:3002/admin/research-review

### Step 2: Select a Niche
Click on "Personal Finance" (or any niche) from the left sidebar

### Step 3: Switch to Keyword Research Tab
Click the "Keyword Research" tab at the top

### Step 4: Expand Keywords
Click the purple "🔍 Expand Keywords" button

**What Happens:**
1. System fetches TikTok autocomplete for your seed keywords
2. Queries Google Trends for related searches
3. Asks GPT-4 to generate 30 relevant keywords
4. Deduplicates and ranks by confidence
5. Shows results in ~10-30 seconds

### Step 5: Review & Approve
- Green background = Approved
- Red background = Rejected
- Gray background = Pending

Click ✓ (checkmark) to approve, ✗ (X) to reject

### Step 6: Save Approved Keywords
Click "💾 Save Approved Keywords (X)" button

**Current Behavior:**
- Shows a message with the list of approved keywords
- You manually copy them to `config/niche-keywords.json`

**Future Enhancement:**
- Auto-update the config file via API

---

## 📊 Example Output

**Input (Personal Finance):**
```json
{
  "seedKeywords": ["save money", "get out of debt", "investing for beginners"]
}
```

**Output (Expanded):**
```json
{
  "expandedKeywords": [
    {
      "keyword": "save money fast",
      "source": "tiktok-autocomplete",
      "confidence": 0.85
    },
    {
      "keyword": "budget tips for beginners",
      "source": "llm-expansion",
      "confidence": 0.65
    },
    {
      "keyword": "debt free journey",
      "source": "google-trends",
      "confidence": 0.75
    }
    // ... 40+ more keywords
  ],
  "summary": {
    "total": 47,
    "highConfidence": 12,
    "mediumConfidence": 28,
    "lowConfidence": 7,
    "sources": {
      "tiktok": 12,
      "googleTrends": 10,
      "llm": 25,
      "competitors": 0
    }
  }
}
```

---

## 🎨 UI Features

### Expansion Summary Card (Blue)
Shows breakdown of keyword sources and confidence levels:
- 47 Total Keywords
- 12 High Confidence (TikTok suggestions)
- 28 Medium Confidence (Google + LLM)
- 7 Low Confidence (experimental)

### Keyword List
Each keyword shows:
- Keyword text (e.g., "save money fast")
- Source (e.g., "tiktok-autocomplete")
- Confidence percentage (e.g., "85%")
- Approve/Reject buttons

### Action Buttons
- **"💾 Save Approved Keywords"** - Saves your selections
- **"🔄 Re-expand"** - Runs expansion again (gets fresh results)

---

## 🔧 Technical Details

### Rate Limiting
- TikTok autocomplete: 500ms delay between requests
- Google Trends: 500ms delay between requests
- Total expansion time: ~10-30 seconds depending on seed keywords

### LLM Prompt
```
You are a TikTok keyword research expert. Generate 30 high-intent search queries
that TikTok users actively search for in the "Personal Finance" niche.

Requirements:
1. Focus on actionable, how-to queries
2. Include problem-solving queries
3. Mix beginner and intermediate level queries
4. Avoid overly technical jargon
5. Each query should be 2-6 words
```

### Deduplication
Keywords are normalized (lowercase, trimmed) and deduplicated. If the same keyword comes from multiple sources, we keep the one with highest confidence.

---

## 🎯 Integration with Niche Configs

### Current Config Format
**`config/niche-keywords.json`:**
```json
{
  "niche": "personal-finance",
  "displayName": "Personal Finance",
  "searchTerms": [
    "save money",
    "get out of debt",
    "investing for beginners"
  ],
  "hashtags": ["#debtfree", "#moneytok"],
  "minViews": 10000
}
```

### After Keyword Research
You approve 15 new keywords. Update the config:
```json
{
  "niche": "personal-finance",
  "displayName": "Personal Finance",
  "searchTerms": [
    // Original seeds
    "save money",
    "get out of debt",
    "investing for beginners",
    // NEW: Approved from expansion
    "save money fast",
    "budget hacks",
    "debt free journey",
    "passive income ideas",
    "emergency fund tips",
    // ... 10 more
  ]
}
```

### Then Re-run Scraping
```bash
node scripts/orchestrate-viral-research.js personal-finance
```

Now Apify scrapes with **18 keywords** instead of 3, capturing much more relevant content!

---

## 💡 Why This Works

### Problem with Manual Keyword Research:
- Time-consuming (hours per niche)
- Limited to what you personally think of
- No validation of search volume
- Easy to miss trending terms

### Solution with Hybrid Approach:
- **Automated:** Generates 50+ keywords in 30 seconds
- **Data-Driven:** Uses actual TikTok autocomplete (what people search)
- **AI-Enhanced:** LLM finds related queries you wouldn't think of
- **Human-Curated:** YOU approve only relevant keywords for your goals

### Expected Results:
- **Time Saved:** 10 hours → 30 minutes (for 20 niches)
- **Keyword Quality:** Higher (validated by TikTok + Google data)
- **Coverage:** Broader (50+ vs 5-10 manual keywords)
- **Scraping Results:** More diverse, relevant videos

---

## 🔗 Connection to Viral Research Pipeline

### Workflow:
1. **Start with seed keywords** (manual, 5-10 per niche)
2. **Expand keywords** (automated, 30-50 candidates)
3. **Approve keywords** (human review, 15-30 approved)
4. **Update config** (manual, copy approved list)
5. **Re-run scraper** (automated, Apify uses new keywords)
6. **Transcribe + DPS** (automated, orchestrator processes videos)
7. **Review results** (human, see if new keywords found better content)
8. **Iterate** (repeat 2-7 with refined keywords)

### Continuous Improvement Loop:
```
Seed Keywords → Expand → Scrape → Analyze Results
      ↑                                    ↓
      └────────── Refine Based on DPS ────┘
```

If certain expanded keywords produce higher DPS scores, prioritize similar keywords in next expansion.

---

## 🚨 Current Limitations

### 1. TikTok Autocomplete May Fail
- TikTok can block scraping attempts
- Falls back to Google Trends + LLM only
- Still get 30+ keywords, just lower confidence

### 2. No Competitor Hashtag Analysis Yet
- Placeholder function exists
- Need to implement: query `scraped_videos` → extract hashtags → frequency analysis
- Would add another 10-20 high-confidence keywords

### 3. Manual Config Update
- You must copy approved keywords to `config/niche-keywords.json`
- Could build API endpoint to auto-update file
- Trade-off: Manual gives you control, automated is faster

### 4. No Historical Tracking
- Can't see previous keyword expansions
- No A/B testing of keyword sets
- Could add `keyword_research_history` table

---

## 🎉 What Makes This Special

1. **Hybrid = Best of Both Worlds**
   - Automated speed + Human judgment
   - AI creativity + Data validation

2. **Multiple Data Sources**
   - TikTok (platform-specific insights)
   - Google Trends (broad search behavior)
   - LLM (lateral thinking, variations)

3. **Confidence Scoring**
   - Know which keywords to trust
   - Prioritize high-confidence (TikTok autocomplete)

4. **Integrated into Existing UI**
   - No separate tool to learn
   - Same place you review research reports

5. **Iterative Process**
   - Expand → Review → Scrape → Analyze → Refine
   - Gets smarter over time

---

## 📈 Next Steps

### Immediate (Today):
1. ✅ Refresh http://localhost:3002/admin/research-review
2. ✅ Click "Personal Finance"
3. ✅ Click "Keyword Research" tab
4. ✅ Click "🔍 Expand Keywords"
5. ✅ Review results
6. ✅ Approve 15-20 best keywords
7. ✅ Copy approved list to `config/niche-keywords.json`
8. ✅ Re-run orchestrator with expanded keywords

### Short-term (This Week):
9. Expand keywords for all 20 niches
10. Update all niche configs with approved keywords
11. Run full scraping pipeline with new keywords
12. Compare results: old keywords vs new keywords (viral video count, DPS distribution)

### Medium-term (Next 2 Weeks):
13. Implement competitor hashtag analysis
14. Build auto-update API for config file
15. Add keyword performance tracking (which keywords → best DPS)
16. Create keyword recommendation system (suggest high-performing keywords to other niches)

---

## 📞 Testing

**To test the keyword expansion:**

1. Navigate to: http://localhost:3002/admin/research-review
2. Select "Personal Finance" from left sidebar
3. Click "Keyword Research" tab
4. Click purple "🔍 Research Keywords" button
5. Wait ~20 seconds
6. You should see:
   - Blue summary card with stats
   - List of 30-50 keywords
   - Each with source + confidence
   - ✓ and ✗ buttons for each keyword

**Expected Output:**
- TikTok autocomplete: 5-10 keywords
- Google Trends: 5-10 keywords
- LLM expansion: 25-30 keywords
- **Total: 35-50 unique keywords**

---

**Built:** October 15, 2025
**Status:** ✅ Complete - Ready for Testing
**Next Action:** Test keyword expansion on Personal Finance niche, then expand to all 20 niches
