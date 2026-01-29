# Comprehensive Pattern-Related Architecture Analysis

**Analysis Date:** November 3, 2025  
**System:** CleanCopy - Viral Content Intelligence Platform

---

## Executive Summary

Three distinct pattern subsystems:
1. **FEAT-003: Viral Pattern Extraction** - Extracts 7 Idea Legos from high-DPS videos
2. **Script Pattern Definitions** - 18 predefined content structures  
3. **Pre-Content Pattern Matching** - Matches extracted patterns

**Total Pattern Code:** 4,600+ lines across 30+ files  
**Active Services:** 12+ systems

---

## PART 1: FEAT-003 Pattern Extraction System

### Location: `src/lib/services/pattern-extraction/`

**9 Core Files (4,623 lines):**
- pattern-extraction-service.ts (422)
- pattern-extraction-engine.ts (410)
- pattern-database-service.ts (606)
- enhanced-extraction-engine.ts (281)
- enhanced-extraction-service.ts (218)
- enhanced-database-service.ts (384)
- types.ts (298)
- types-enhanced.ts (184)
- index.ts (74)

### The 7 Idea Legos

1. topic - Core subject matter
2. angle - Unique perspective
3. hook_structure - First 3s capture
4. story_structure - Narrative flow
5. visual_format - Visual style
6. key_visuals - Visual elements
7. audio - Sound strategy

### Database Tables

**viral_patterns** (UUID key)
- niche, pattern_type, pattern_description, pattern_details
- frequency_count, avg_dps_score, success_rate, viral_videos_count
- Unique: (niche, pattern_type, description)
- 8 indexes including trigram similarity

**pattern_video_associations** (Junction)
- Unique: (pattern_id, video_id)

**pattern_extraction_jobs** (Tracking)
- Batch ID, status, metrics, error tracking

**pattern_extraction_errors** (Errors)
- Failed extraction records

### API Endpoints

**POST /api/patterns/extract** (306 lines)
- Extract patterns from niche videos
- Rate limit: 10 req/min
- Response includes: patterns, batchId, metrics

**POST /api/patterns/extract-enhanced** (121 lines)
- Enhanced v2 with per-video 9-field extraction

### Configuration

- maxVideosPerBatch: 500
- maxVideosPerLLMCall: 50
- llmModel: gpt-4-turbo-preview
- minConfidenceScore: 0.7
- similarityThreshold: 0.7

### FFmpeg Integration

Visual data: resolution, fps, hookSceneChanges, qualityScore
Used for: visual_format, key_visuals extraction

---

## PART 2: Script Patterns

**File:** `src/lib/script/patterns.ts` (302 lines)

18 predefined patterns with platform-specific metadata:
- POV, Question Reveal, Problem Demo, Before/After
- Tutorial 3 Steps, Storytime Hook, Authority+Proof
- Benefit Stack... (10 more)

**Structure:** PatternSpec with:
- hookTemplates, bodyTemplates
- signals (keywords, regex)
- platformFits (duration, hook max)

**API:** GET /api/script/patterns
Returns patterns with success rates from recipe book

---

## PART 3: Pattern Analysis & Matching

### Viral Pattern Matching Engine
**File:** viralPatternMatchingEngine.ts (511 lines)

Analyzes video content against known patterns
Returns: ViralAnalysis with score, recommendations, improvements

### Viral Pattern Analyzer
**File:** viral-pattern-analyzer.ts (474 lines)

ML-based framework matching using Viral DNA

**Viral DNA:** emotional_triggers, content_patterns, hook_mechanisms, engagement_drivers, viral_coefficients

**Functions:** extractViralDNA, findBestFrameworks, calculateFrameworkMatch

### Pattern Matcher
**File:** pre-content/pattern-matcher.ts (284 lines)

Database-based pattern matching with 5-minute caching
Functions: fetchViralPatterns, calculateLegoPatternMatch, matchPatternsForPrediction

---

## PART 4: Niche Framework System

**File:** niche-framework-definitions.ts

20+ niches with frameworks and quality filters

**Structure:**
NicheDefinition { id, name, keywords[], frameworks[], llmFilterCriteria }

**Supporting files:**
- niche_overrides.ts (local optimizations)
- niches.json (data)
- niche-keywords.json (keywords)

---

## PART 5: Complete File Inventory

### Active Services

Pattern Extraction (9):
- pattern-extraction-service.ts, engine, database-service
- enhanced versions (v2)
- types, index

Analysis & Matching (4):
- viralPatternMatchingEngine.ts
- viral-pattern-analyzer.ts
- pattern-matcher.ts
- script/patterns.ts

API Routes (4):
- /api/patterns/extract (306)
- /api/patterns/extract-enhanced (121)
- /api/script/patterns (17)
- /api/admin/framework-evolution/patterns (315)

Configuration:
- niche-framework-definitions.ts
- niche_overrides.ts, niches.json, niche-keywords.json

### Database Migrations (Deployed)

- 20251003_feat003_pattern_extraction.sql
- 20251006_enhanced_video_patterns.sql

### Scripts

- run-pattern-scraper.ts (Active)
- run-enhanced-pattern-extraction.js (Active)
- extract-patterns-simple.js, diagnose-patterns.js, verify-pattern-quality.js

---

## PART 6: Dependencies & Relationships

### Service Dependencies

Pattern Extraction Service
├─ Pattern Extraction Engine
├─ Pattern Database Service
├─ LLM Wrapper
└─ Supabase

Pre-Content Prediction
├─ Pattern Matcher
├─ Viral Pattern Analyzer
└─ Pattern Database Service

### Feature Dependencies

FEAT-001 (FFmpeg) → provides video_visual_analysis
FEAT-003 (Extraction) → depends on FEAT-001, produces patterns
FEAT-007 (Prediction) → depends on FEAT-003, uses patterns

### Database Relationships

scraped_videos → video_visual_analysis
scraped_videos → pattern_video_associations → viral_patterns
pattern_extraction_jobs → pattern_extraction_errors

---

## PART 7: Key Insights

### Redundancies

1. Two extraction approaches (v1 batch, v2 per-video) - complementary
2. Pattern matching (ML analyzer, DB matcher) - can consolidate
3. Niche definitions (code, overrides, data) - good separation

### Performance

- Batch size: 500 max
- LLM batch: 50 videos/call
- Model: GPT-4-turbo-preview
- Temp: 0.3 (deterministic)
- Cache: 1 hour
- DB indexes: 8

---

## PART 8: Recommendations

1. Consolidate pattern matching services
2. Make Enhanced v2 default extraction
3. Enhance visual integration and coverage
4. Add comprehensive monitoring

---

## Summary

| Metric | Count |
|--------|-------|
| Pattern services | 9 |
| Analysis services | 4 |
| API endpoints | 4 |
| Script patterns | 18 |
| Niches | 20+ |
| DB tables | 5 |
| Code lines | 4,600+ |
| Active services | 12+ |

**Status:** Active, mature, production-ready

---

Generated: November 3, 2025
