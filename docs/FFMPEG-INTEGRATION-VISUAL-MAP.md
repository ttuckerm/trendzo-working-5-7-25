# FFmpeg Integration Visual Flow Map

## 🎬 Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TIKTOK VIDEO SOURCE                          │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
         ╔═══════════════════════════════════════════════╗
         ║   FEAT-001: SCRAPER (Entry Point)             ║
         ║   File: src/lib/services/apifyScraper.ts      ║
         ╠═══════════════════════════════════════════════╣
         ║                                               ║
         ║  1. Download video from TikTok CDN            ║
         ║  2. Save to permanent storage                 ║
         ║  3. ✨ NEW: Analyze with FFmpeg ✨            ║
         ║     → Resolution (1080x1920)                  ║
         ║     → FPS (60)                                ║
         ║     → Bitrate (5000 kbps)                     ║
         ║     → Hook scene changes (3 cuts)             ║
         ║     → Quality score (0.95)                    ║
         ║  4. Save FFmpeg data to database              ║
         ║                                               ║
         ╚═══════════════════════════════════════════════╝
                                 │
                                 ▼
                 ┌───────────────────────────┐
                 │  video_visual_analysis    │
                 │  (PostgreSQL Table)       │
                 │  ✅ FFmpeg data stored    │
                 └───────────────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼

╔═══════════════════╗  ╔═══════════════════╗  ╔═══════════════════╗
║   FEAT-002        ║  ║   FEAT-003        ║  ║   FEAT-060        ║
║   DPS CALCULATOR  ║  ║   PATTERN         ║  ║   KNOWLEDGE       ║
║                   ║  ║   EXTRACTION      ║  ║   EXTRACTION      ║
╠═══════════════════╣  ╠═══════════════════╣  ╠═══════════════════╣
║                   ║  ║                   ║  ║                   ║
║ 1. Fetch FFmpeg   ║  ║ 1. Query videos   ║  ║ 1. Build prompt   ║
║    data from DB   ║  ║    with visual    ║  ║    with visual    ║
║                   ║  ║    data via JOIN  ║  ║    analysis       ║
║ 2. Calculate      ║  ║                   ║  ║                   ║
║    visual score:  ║  ║ 2. Pass visual    ║  ║ 2. Multi-LLM      ║
║    • Res: 30 pts  ║  ║    data to LLM:   ║  ║    consensus:     ║
║    • FPS: 25 pts  ║  ║    "1080x1920     ║  ║    "Visual:       ║
║    • Rate: 20 pts ║  ║     @ 60fps,      ║  ║     1080p, 60fps  ║
║    • Hook: 15 pts ║  ║     3 hook cuts"  ║  ║     3 cuts = high ║
║    • Qual: 10 pts ║  ║                   ║  ║     production"   ║
║    = 100/100      ║  ║ 3. LLM extracts   ║  ║                   ║
║                   ║  ║    visual_format  ║  ║ 3. Include in     ║
║ 3. Add 5% weight  ║  ║    & key_visuals  ║  ║    viral factors  ║
║    to final DPS   ║  ║    patterns       ║  ║    analysis       ║
║                   ║  ║                   ║  ║                   ║
║ 📊 WEIGHT MIX:    ║  ║ 📊 RESULT:        ║  ║ 📊 RESULT:        ║
║ Z-score: 52%      ║  ║ "High-quality     ║  ║ "Production       ║
║ Engage: 21%       ║  ║  1080p @ 60fps    ║  ║  quality          ║
║ Decay: 12%        ║  ║  with fast-paced  ║  ║  contributes      ║
║ Identity: 10%     ║  ║  2-3 cuts in      ║  ║  to viral         ║
║ ✨FFmpeg: 5%✨    ║  ║  opening hook"    ║  ║  success"         ║
║                   ║  ║                   ║  ║                   ║
╚═══════════════════╝  ╚═══════════════════╝  ╚═══════════════════╝
        │                                              │
        │                                              │
        ▼                                              ▼
┌─────────────────┐                          ┌─────────────────┐
│ Higher DPS      │                          │ Better insights │
│ for quality     │                          │ for creators    │
│ videos ✅       │                          │ ✅              │
└─────────────────┘                          └─────────────────┘




╔═══════════════════════════════════════════════════════════════════╗
║   FEAT-070: PRE-CONTENT PREDICTION                                 ║
║   (Before Filming - No Video Yet)                                  ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Creator Input:                                                    ║
║  {                                                                 ║
║    "script": "POV: You just discovered...",                        ║
║    "plannedVisuals": {          ← ✨ NEW FIELD ✨                 ║
║      "resolution": "1080x1920",                                    ║
║      "fps": 60,                                                    ║
║      "plannedHookCuts": 3                                          ║
║    }                                                               ║
║  }                                                                 ║
║                                                                    ║
║  ↓                                                                 ║
║                                                                    ║
║  LLM Consensus Scoring:                                            ║
║  • GPT-4: Analyzes script + planned quality → Score + 5-10 pts    ║
║  • Claude: Analyzes script + planned quality → Score + 5-10 pts   ║
║  • Gemini: Analyzes script + planned quality → Score + 5-10 pts   ║
║                                                                    ║
║  ↓                                                                 ║
║                                                                    ║
║  Prompt includes:                                                  ║
║  "PLANNED VISUAL QUALITY:                                          ║
║   - Resolution: 1080x1920                                          ║
║   - Frame Rate: 60 fps                                             ║
║   - Hook Editing: 3 cuts                                           ║
║                                                                    ║
║   IMPORTANT: High production quality (1080p+, 60fps) and          ║
║   optimal hook pacing (2-4 cuts) correlate with viral success.    ║
║   Add +5-10 points for high production quality."                  ║
║                                                                    ║
║  📊 RESULT: Better predictions for creators who plan quality       ║
║                                                                    ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## 🔄 Data Flow Timeline

```
STAGE 1: VIDEO SCRAPING
========================
TikTok CDN
   ↓
Download Video
   ↓
FFmpeg Analysis  ← ✨ NEW STEP
   ↓
Save to: video_visual_analysis table
   ↓
Result: Video has visual intelligence data stored


STAGE 2: DPS CALCULATION
=========================
Scraped Video + FFmpeg Data
   ↓
Fetch visual_analysis from DB
   ↓
Calculate FFmpeg Visual Score (0-100)
   ↓
Combine with other DPS factors (5% weight)  ← ✨ NEW WEIGHT
   ↓
Result: DPS score includes quality boost


STAGE 3: PATTERN EXTRACTION
============================
Query high-DPS videos + FFmpeg data (JOIN)
   ↓
Build LLM prompt with visual specs  ← ✨ NEW DATA
   ↓
LLM identifies patterns using text + visual quality
   ↓
Result: Patterns include production quality insights


STAGE 4: KNOWLEDGE EXTRACTION
==============================
Video transcript + caption + FFmpeg data
   ↓
Multi-LLM analysis with visual quality  ← ✨ NEW FACTOR
   ↓
Consensus on viral factors
   ↓
Result: Insights include production quality correlation


STAGE 5: PRE-CONTENT PREDICTION (Optional)
===========================================
Script + Planned Visual Specs  ← ✨ NEW INPUT
   ↓
LLM scoring with quality considerations
   ↓
Prediction boost for planned quality
   ↓
Result: Creator gets better prediction before filming
```

---

## 📊 FFmpeg Scoring Breakdown

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  FFmpeg Visual Intelligence Score (0-100)                      │
│                                                                │
│  ╔════════════════════════════════════════════════╗            │
│  ║                RESOLUTION (30%)                ║            │
│  ╠════════════════════════════════════════════════╣            │
│  ║  1080p+  ████████████████████████████  30 pts  ║            │
│  ║  720p    ██████████████████████        22 pts  ║            │
│  ║  480p    ██████████████              14 pts  ║            │
│  ║  <480p   ████████                      8 pts   ║            │
│  ╚════════════════════════════════════════════════╝            │
│                                                                │
│  ╔════════════════════════════════════════════════╗            │
│  ║                FRAME RATE (25%)                ║            │
│  ╠════════════════════════════════════════════════╣            │
│  ║  60fps+  █████████████████████████    25 pts  ║            │
│  ║  30fps   ██████████████████           18 pts  ║            │
│  ║  24fps   ████████████                 12 pts  ║            │
│  ║  <24fps  ██████                        6 pts   ║            │
│  ╚════════════════════════════════════════════════╝            │
│                                                                │
│  ╔════════════════════════════════════════════════╗            │
│  ║                BITRATE (20%)                   ║            │
│  ╠════════════════════════════════════════════════╣            │
│  ║  5+ Mbps ████████████████████         20 pts  ║            │
│  ║  2.5 Mbps██████████████               14 pts  ║            │
│  ║  1 Mbps  ████████                      8 pts   ║            │
│  ║  <1 Mbps ████                          4 pts   ║            │
│  ╚════════════════════════════════════════════════╝            │
│                                                                │
│  ╔════════════════════════════════════════════════╗            │
│  ║             HOOK CUTS (15%)                    ║            │
│  ╠════════════════════════════════════════════════╣            │
│  ║  2-4 cuts███████████████              15 pts  ║            │
│  ║  1 cut   ████████                      8 pts   ║            │
│  ║  5+ cuts █████                         5 pts   ║            │
│  ║  0 cuts  ██                            2 pts   ║            │
│  ╚════════════════════════════════════════════════╝            │
│                                                                │
│  ╔════════════════════════════════════════════════╗            │
│  ║            QUALITY SCORE (10%)                 ║            │
│  ╠════════════════════════════════════════════════╣            │
│  ║  0.95    ██████████                   9.5 pts  ║            │
│  ║  0.75    ████████                     7.5 pts  ║            │
│  ║  0.50    █████                        5.0 pts  ║            │
│  ╚════════════════════════════════════════════════╝            │
│                                                                │
└────────────────────────────────────────────────────────────────┘

EXAMPLE: Premium Quality Video
- 1080p (30) + 60fps (25) + 5 Mbps (20) + 3 cuts (15) + 0.95 (9.5)
= 99.5 / 100 ✅
```

---

## 🎯 Where to Look in Code

### Quick Reference:

| Feature | Key File | Line/Section | What to Look For |
|---------|----------|--------------|------------------|
| **Scraper** | `src/lib/services/apifyScraper.ts` | Lines 198-217 | FFmpeg analysis after download |
| **Scraper** | `src/lib/services/apifyScraper.ts` | Lines 269-304 | `saveFFmpegAnalysis()` function |
| **DPS Engine** | `src/lib/services/dps/dps-calculation-engine.ts` | Lines 292-363 | `calculateFFmpegVisualScore()` |
| **DPS Engine** | `src/lib/services/dps/dps-calculation-engine.ts` | Lines 380-420 | Weight distribution (5% FFmpeg) |
| **DPS Service** | `src/lib/services/dps/dps-calculation-service.ts` | Lines 66-98 | FFmpeg data fetch helper |
| **DPS Service** | `src/lib/services/dps/dps-calculation-service.ts` | Lines 149-163 | FFmpeg score calculation |
| **Pattern Types** | `src/lib/services/pattern-extraction/types.ts` | Lines 60-82 | `visualData` field added |
| **Pattern DB** | `src/lib/services/pattern-extraction/pattern-database-service.ts` | Lines 66-141 | SQL JOIN for FFmpeg data |
| **Pattern Engine** | `src/lib/services/pattern-extraction/pattern-extraction-engine.ts` | Lines 97-121 | LLM prompt with visual data |
| **Knowledge** | `src/lib/services/gppt/knowledge-extraction-engine.ts` | Lines 14-38 | `visual_analysis` field |
| **Knowledge** | `src/lib/services/gppt/knowledge-extraction-engine.ts` | Lines 73-92 | Prompt builder with visuals |
| **Pre-Content Types** | `src/types/pre-content-prediction.ts` | Lines 18-24 | `plannedVisuals` field |
| **Pre-Content LLM** | `src/lib/services/pre-content/llm-consensus.ts` | Lines 29-63 | Prompt with planned specs |
| **Pre-Content Service** | `src/lib/services/pre-content/pre-content-prediction-service.ts` | Lines 72-82 | Passing visuals to LLM |

---

## ✅ Verification Checklist

### Code-Level Verification (No Data Needed)

- [ ] Open `src/lib/services/apifyScraper.ts` - Search for "FFmpeg" → Should find analysis code
- [ ] Open `src/lib/services/dps/dps-calculation-engine.ts` - Search for "5%" → Should find in weight comments
- [ ] Open `src/lib/services/pattern-extraction/types.ts` - Search for "visualData" → Should find field
- [ ] Open `src/lib/services/gppt/knowledge-extraction-engine.ts` - Search for "visual_analysis" → Should find field
- [ ] Open `src/types/pre-content-prediction.ts` - Search for "plannedVisuals" → Should find field
- [ ] Run test: `npx tsx scripts/test-ffmpeg-integration.ts` → Tests 2, 5, 6 should pass

### Data-Level Verification (After Scraping)

- [ ] Check database: `SELECT COUNT(*) FROM video_visual_analysis` → Should be > 0
- [ ] Check DPS: Query videos with both `dps_score` and FFmpeg data
- [ ] Run test: `npx tsx scripts/test-ffmpeg-integration.ts` → All 7 tests should pass

---

## 🎉 Success Criteria

**✅ Integration is COMPLETE when:**

1. **Code exists**: All 5 files modified (check Git diff)
2. **Types updated**: New fields in interfaces (visualData, visual_analysis, plannedVisuals)
3. **Functions work**: Test script passes scoring algorithm test
4. **Database ready**: Migration exists for `video_visual_analysis` table

**✅ Integration is OPERATIONAL when:**

1. Scraper populates FFmpeg data (check database count > 0)
2. DPS scores include FFmpeg boost (check calculated scores)
3. Pattern extraction receives visual data (check LLM prompts)
4. Knowledge extraction includes visual factors (check responses)
5. Pre-content predictions consider planned quality (test API)

---

**Current Status:** ✅ CODE INTEGRATION COMPLETE

**Next Step:** Run scraper to populate FFmpeg data for full operational status.
