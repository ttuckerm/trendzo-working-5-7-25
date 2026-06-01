# Cron Route Audit — cultural-scan & classify-events

**Date:** 2026-05-25
**Scope:** Read-only audit. No files modified.
**Files audited:**
- `src/app/api/cron/cultural-scan/route.ts`
- `src/app/api/cron/classify-events/route.ts`

---

## Summary of findings (TL;DR)

| Question | cultural-scan | classify-events |
|---|---|---|
| Writes to `integration_job_runs`? | **Yes** | **Yes** |
| When? | At **end** of handler, after all phases, **regardless of phase success/failure** | At **end** of handler, after classify loop, **regardless of success/failure** |
| Job name written | `cultural_scanner` | `event_classifier` |
| Error-swallowing try/catch? | **Yes — multiple, incl. an empty `catch {}` around the job-run write** | **Yes — incl. an empty `catch {}` around the job-run write** |
| Auth check before running? | **Yes — conditional** `CRON_SECRET` bearer check | **Yes — conditional** `CRON_SECRET` bearer check |
| Env-var check? | Yes — Supabase URL + key (500 if missing) | Yes — Supabase URL + key (500 if missing) |
| HTTP status on internal failure | Always **200 `success: true`** | Always **200 `success: true`** |

**Most important observations:**

1. **The `integration_job_runs` write is wrapped in an empty `try { ... } catch {}`** in BOTH routes, AND the Supabase `.upsert()` result's `.error` field is **never read**. A Supabase client error does **not throw** — it resolves with `{ data, error }`. So the empty catch never even fires on a DB error; the error is simply dropped. **Any failure to record the job run is completely invisible.**
2. **The upsert specifies no `onConflict` target** (`.upsert({ job, last_run })`). It relies on `job` being the primary key / unique. If it isn't, this can insert duplicate rows or fail — and per #1, a failure is silent.
3. **`last_run` is written at the END of the handler.** If the function exceeds `maxDuration` (300s for cultural-scan, 120s for classify-events) and Vercel kills it, OR any uncaught throw occurs before that line, the timestamp is **never updated even though the cron "ran."** This is the most likely cause of a stale `last_run` despite Vercel showing successful invocations.
4. **Both routes always return HTTP 200 with `success: true`**, even if every phase failed. Vercel's cron dashboard will report these as successful invocations regardless of internal errors. Errors are only visible inside the JSON response body's `errors` array.
5. **Auth discrepancy vs. memory note:** The Atlas-crons memory (2026-04-21) states these routes "do NOT currently check auth." The **current code DOES** have a `CRON_SECRET` bearer check (both files, top of `GET`). The check is **conditional** — only enforced when `process.env.CRON_SECRET` is set; if unset, the route accepts any request.

---

## Vercel cron logs

No runtime Vercel cron logs for these two routes exist in the project. Searched all `*.log` and `vercel*.txt` files.

- `vercel_phase1_6_log.txt` contains only **build-time** warnings (`Restarted static page generation for /api/cron/generate-recipes` and `/api/feedback-ingest/cron`) — these are different cron paths and are build warnings, not runtime execution logs.
- `vercel_log.txt`, `vercel_phase1_5_log.txt`, `vercel_post_fix_log.txt` — no matches for `cron`, `cultural-scan`, `classify-events`, `integration_job_runs`, `cultural_scanner`, or `event_classifier`.
- `vercel.json` confirms both routes are registered as crons:
  - `/api/cron/cultural-scan` — schedule `30 0 * * *` (00:30 UTC daily)
  - `/api/cron/classify-events` — schedule `0 1 * * *` (01:00 UTC daily)

No log file captures actual cron execution output — that lives in the Vercel dashboard, not in the repo.

---

## Detailed analysis

### `integration_job_runs` write — exact behavior

**cultural-scan** (lines 539–542):
```ts
// Track job run
try {
  await db.from('integration_job_runs').upsert({ job: 'cultural_scanner', last_run: new Date().toISOString() } as any)
} catch {}
```

**classify-events** (lines 220–223):
```ts
// Track job run
try {
  await db.from('integration_job_runs').upsert({ job: 'event_classifier', last_run: new Date().toISOString() } as any)
} catch {}
```

- **Timing:** End of handler, *after* all work, *before* the final `NextResponse.json(...)`.
- **Condition:** Unconditional on reaching that line — fires whether phases succeeded or failed. NOT success-only. But it is skipped if the handler never reaches that line (timeout kill / early uncaught throw — though almost everything upstream is caught).
- **Error visibility:** None. `.error` is never inspected, and a Supabase error doesn't throw so the empty `catch {}` is dead code for DB errors. The `as any` cast also suppresses any type-level mismatch with the table schema.
- **Conflict handling:** No `onConflict` argument — default conflict target is the table's PK. Correct behavior depends entirely on the live `integration_job_runs` schema (whether `job` is the PK / unique). Not verifiable from these files.

### Try/catch blocks that suppress errors

**cultural-scan:**
| Location | Behavior |
|---|---|
| `fetchSubredditTop` (89–124) | Catches fetch errors → `console.error` + returns `[]`. Per-subreddit failures swallowed (logged only). |
| `scanReddit` per-subreddit (185–209) | Catches → pushes to `errors[]` (surfaced in response). Upsert `.error` checked and pushed. ✅ surfaced |
| `scanTwitterForNiche` (236–283) | Catches → `console.error` + returns `[]`. Inner JSON-parse failures swallowed with empty `catch {}`. |
| `scanTwitter` per-niche (296–324) | Catches → pushes to `errors[]`. ✅ surfaced |
| `synthesizeTrends` per-niche (356–479) | Catches → pushes to `errors[]`. JSON-parse failures swallowed; insert fallback logic. |
| **Job-run write (540–542)** | **Empty `catch {}` — fully silent.** |
| Final response (547–555) | Always `success: true`; `errors[]` included only if non-empty. HTTP always 200. |

**classify-events:**
| Location | Behavior |
|---|---|
| `classifyTrends` (52–106) | Throws on missing API key; throws on unparseable LLM response. |
| Main classify block (178–218) | Wraps `classifyTrends` + insert loop; catches → pushes `Classification failed: ...` to `errors[]`. ✅ surfaced. Per-row insert `.error` pushed to `errors[]`. |
| **Job-run write (221–223)** | **Empty `catch {}` — fully silent.** |
| Final response (228–237) | Always `success: true`; `errors[]` included only if non-empty. HTTP always 200. |

### Auth / env checks before running

**Both routes, identical pattern at top of `GET`:**
```ts
const auth = request.headers.get('authorization')
if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```
- cultural-scan: lines 494–497
- classify-events: lines 111–114

**Behavior:** Auth is enforced **only if `CRON_SECRET` is set**. If `CRON_SECRET` is unset/empty, the guard is skipped and the route runs for any caller. Vercel Pro auto-injects `Authorization: Bearer $CRON_SECRET` for cron invocations, so this works when the env var is configured on both sides.

**Supabase env check (both routes):**
```ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
if (!supabaseUrl || !supabaseKey) {
  return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 })
}
```
- cultural-scan: lines 502–506
- classify-events: lines 118–122

**Gemini key:** Not gated at the handler entry. Checked lazily inside each phase — cultural-scan's Twitter/synthesis phases skip gracefully (return `[]` / push an error) if `GOOGLE_GEMINI_AI_API_KEY`/`GOOGLE_AI_API_KEY` is missing; classify-events' `classifyTrends` **throws** `No Gemini API key`, which is caught by the main block and surfaced in `errors[]` (still HTTP 200).

---

## Full file contents

### `src/app/api/cron/cultural-scan/route.ts`

```ts
/**
 * Cultural Intelligence Scanner — Reddit + X/Twitter + Trend Synthesis
 * Atlas subsystem 4 — KAIROS tick loop
 *
 * GET /api/cron/cultural-scan              — scan ALL niches (Reddit + Twitter + synthesis)
 * GET /api/cron/cultural-scan?niche=fitness — scan one niche
 * GET /api/cron/cultural-scan?phase=reddit  — Reddit only
 * GET /api/cron/cultural-scan?phase=twitter — Twitter only
 * GET /api/cron/cultural-scan?phase=synthesize — Trend synthesis only (uses today's scan data)
 *
 * Full pipeline: Reddit → Twitter → LLM Synthesis → detected_trends
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// ── Niche → Subreddit Mapping ──────────────────────────────────────────

const NICHE_SUBREDDITS: Record<string, string[]> = {
  'side-hustles':      ['sidehustle', 'beermoney', 'WorkOnline', 'Entrepreneur', 'passive_income'],
  'personal-finance':  ['personalfinance', 'investing', 'FinancialPlanning', 'Fire', 'stocks'],
  'fitness':           ['fitness', 'GymTok', 'loseit', 'bodyweightfitness', 'running'],
  'business':          ['Entrepreneur', 'smallbusiness', 'startups', 'SaaS', 'marketing'],
  'food-nutrition':    ['nutrition', 'EatCheapAndHealthy', 'MealPrepSunday', 'Supplements', 'PlantBasedDiet'],
  'beauty':            ['SkincareAddiction', 'MakeupAddiction', 'beauty', 'AsianBeauty', 'HaircareScience'],
  'real-estate':       ['realestateinvesting', 'RealEstate', 'FirstTimeHomeBuyer', 'landlords', 'AirBnB'],
  'self-improvement':  ['selfimprovement', 'getdisciplined', 'productivity', 'DecidingToBeBetter', 'Stoicism'],
  'dating':            ['dating_advice', 'relationship_advice', 'Tinder', 'OnlineDating', 'socialskills'],
  'education':         ['GetStudying', 'studytips', 'college', 'learnprogramming', 'ApplyingToCollege'],
  'career':            ['careerguidance', 'jobs', 'resumes', 'cscareerquestions', 'recruitinghell'],
  'parenting':         ['Parenting', 'Mommit', 'daddit', 'NewParents', 'toddlers'],
  'tech':              ['technology', 'gadgets', 'Android', 'apple', 'programming'],
  'fashion':           ['malefashionadvice', 'femalefashionadvice', 'streetwear', 'ThriftStoreHauls', 'frugalmalefashion'],
  'health':            ['health', 'Biohackers', 'sleep', 'Nootropics', 'longevity'],
  'cooking':           ['Cooking', 'CookingVideos', 'recipes', 'AskCulinary', 'food'],
  'psychology':        ['psychology', 'mentalhealth', 'Anxiety', 'therapy', 'emotionalintelligence'],
  'travel':            ['travel', 'solotravel', 'digitalnomad', 'shoestring', 'TravelHacks'],
  'diy':               ['DIY', 'HomeImprovement', 'woodworking', 'ikeahacks', 'gardening'],
  'language':          ['languagelearning', 'LearnJapanese', 'learnspanish', 'Korean', 'duolingo'],
}

// ── Niche → Twitter Search Terms ───────────────────────────────────────

const NICHE_TWITTER_TERMS: Record<string, string[]> = {
  'side-hustles':      ['side hustle 2026', 'passive income tips', 'make money online', 'etsy digital products', 'freelancing tips'],
  'personal-finance':  ['personal finance tips', 'investing strategy 2026', 'budgeting', 'index funds', 'financial independence'],
  'fitness':           ['fitness tips', 'workout routine', 'weight loss journey', 'gym motivation', 'home workout'],
  'business':          ['startup advice', 'entrepreneurship tips', 'small business', 'marketing strategy', 'ecommerce'],
  'food-nutrition':    ['nutrition tips', 'healthy eating', 'meal prep ideas', 'supplements review', 'gut health'],
  'beauty':            ['skincare routine', 'beauty tips 2026', 'makeup tutorial', 'k-beauty', 'anti aging skincare'],
  'real-estate':       ['real estate investing', 'housing market 2026', 'first time home buyer', 'rental property', 'house flipping'],
  'self-improvement':  ['self improvement', 'productivity tips', 'morning routine', 'habit building', 'stoicism'],
  'dating':            ['dating advice', 'relationship tips', 'dating apps 2026', 'communication skills', 'attachment styles'],
  'education':         ['study tips', 'learning hacks', 'online courses', 'exam prep', 'college advice'],
  'career':            ['career advice', 'resume tips 2026', 'salary negotiation', 'remote work', 'job interview tips'],
  'parenting':         ['parenting tips', 'toddler discipline', 'screen time kids', 'new parent advice', 'work life balance parents'],
  'tech':              ['tech reviews 2026', 'AI tools', 'best gadgets', 'programming tips', 'app recommendations'],
  'fashion':           ['fashion trends 2026', 'outfit ideas', 'thrift fashion', 'capsule wardrobe', 'street style'],
  'health':            ['health tips', 'sleep optimization', 'longevity science', 'biohacking', 'mental health awareness'],
  'cooking':           ['cooking tips', 'easy recipes', 'meal prep', 'viral recipes', 'cooking hacks'],
  'psychology':        ['psychology facts', 'mental health tips', 'therapy', 'emotional intelligence', 'cognitive biases'],
  'travel':            ['travel tips 2026', 'budget travel', 'solo travel', 'digital nomad', 'travel hacks'],
  'diy':               ['DIY projects', 'home improvement tips', 'woodworking', 'IKEA hacks', 'garden ideas'],
  'language':          ['language learning', 'learn Spanish', 'learn Japanese', 'polyglot tips', 'Duolingo streak'],
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 1: Reddit Scanner (unchanged from Prompt 23)
// ═══════════════════════════════════════════════════════════════════════

interface RedditPost {
  title: string
  score: number
  num_comments: number
  url: string
  permalink: string
  selftext: string
  created_utc: number
  subreddit: string
  link_flair_text: string | null
}

async function fetchSubredditTop(subreddit: string): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/top.json?t=week&limit=25&raw_json=1`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Trendzo-Cultural-Scanner/1.0 (cultural intelligence research)',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    if (response.status === 429) {
      console.warn(`[CulturalScanner] Rate limited on r/${subreddit}, skipping`)
      return []
    }
    if (!response.ok) {
      console.warn(`[CulturalScanner] r/${subreddit} returned ${response.status}, skipping`)
      return []
    }

    const data = await response.json()
    const children = data?.data?.children || []

    return children.map((child: any) => ({
      title: child.data.title || '',
      score: child.data.score || 0,
      num_comments: child.data.num_comments || 0,
      url: child.data.url || '',
      permalink: `https://reddit.com${child.data.permalink || ''}`,
      selftext: (child.data.selftext || '').substring(0, 500),
      created_utc: child.data.created_utc || 0,
      subreddit: child.data.subreddit || subreddit,
      link_flair_text: child.data.link_flair_text || null,
    }))
  } catch (err: any) {
    console.error(`[CulturalScanner] Failed to fetch r/${subreddit}:`, err?.message)
    return []
  }
}

function extractThemes(titles: string[], scores: number[], maxThemes = 8): string[] {
  const stopWords = new Set([
    'the','a','an','is','are','was','were','be','been','being','have','has','had',
    'do','does','did','will','would','could','should','may','might','shall','can',
    'need','dare','ought','used','to','of','in','for','on','with','at','by','from',
    'as','into','through','during','before','after','above','below','between','out',
    'off','over','under','again','further','then','once','here','there','when','where',
    'why','how','all','both','each','few','more','most','other','some','such','no',
    'nor','not','only','own','same','so','than','too','very','just','don','now','and',
    'but','or','if','while','because','about','up','down','this','that','these','those',
    'what','which','who','whom','its','it','i','me','my','we','our','you','your','he',
    'him','his','she','her','they','them','their','am','get','got','like','one','also',
    'much','even','still','really','going','went','any','new','old','first','last',
    'long','great','little','right','big','high','small','large','next','early','make',
    'made','thing','things','people','way','well','back','day','days','time','year',
    'years','know','think','want','look','use','come','good','give','take','see','try',
    'say','feel','keep','let','help','tell','ask','seem','show','put','run','move',
    'live','believe','bring','happen','must','call','ever','already','ive','dont','im',
    'cant','doesnt',
  ])

  const wordFreq = new Map<string, number>()

  for (let i = 0; i < titles.length; i++) {
    const words = titles[i]
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w))

    const weight = Math.log2(Math.max(scores[i] || 2, 2))
    for (const word of words) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + weight)
    }
    for (let j = 0; j < words.length - 1; j++) {
      const bigram = `${words[j]} ${words[j + 1]}`
      wordFreq.set(bigram, (wordFreq.get(bigram) || 0) + weight * 1.5)
    }
  }

  return Array.from(wordFreq.entries())
    .filter(([, count]) => count > 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxThemes)
    .map(([term]) => term)
}

async function scanReddit(
  db: SupabaseClient, niches: string[], today: string
): Promise<{ rows: number; posts: number; errors: string[] }> {
  let totalRows = 0, totalPosts = 0
  const errors: string[] = []

  for (const niche of niches) {
    const subreddits = NICHE_SUBREDDITS[niche]
    if (!subreddits) { errors.push(`${niche}: no subreddit mapping`); continue }

    for (const sub of subreddits) {
      try {
        const posts = await fetchSubredditTop(sub)
        if (posts.length > 0) {
          const themes = extractThemes(
            posts.map(p => p.title),
            posts.map(p => p.score),
          )
          const { error } = await db
            .from('cultural_scan_results')
            .upsert({
              niche, source: 'reddit', subreddit: sub, scan_date: today,
              raw_data: posts.map(p => ({
                title: p.title, score: p.score, num_comments: p.num_comments,
                url: p.url, permalink: p.permalink,
                selftext_preview: p.selftext.substring(0, 200),
                created_utc: p.created_utc, flair: p.link_flair_text,
              })),
              post_count: posts.length, top_themes: themes,
            }, { onConflict: 'niche,source,subreddit,scan_date' })

          if (error) errors.push(`reddit/${niche}/${sub}: ${error.message}`)
          else { totalRows++; totalPosts += posts.length }
        }
        await delay(1500)
      } catch (err: any) { errors.push(`reddit/${niche}/${sub}: ${err?.message}`) }
    }
    if (niches.length > 1) await delay(1000)
  }
  return { rows: totalRows, posts: totalPosts, errors }
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 2: X/Twitter Scanner (via Gemini + Google Search grounding)
// ═══════════════════════════════════════════════════════════════════════

interface TwitterTrend {
  topic: string
  engagement: string
  description: string
  sample_posts: string[]
  estimated_likes: number
  estimated_reposts: number
}

async function scanTwitterForNiche(niche: string, searchTerms: string[]): Promise<TwitterTrend[]> {
  const apiKey = process.env.GOOGLE_GEMINI_AI_API_KEY || process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    console.warn('[CulturalScanner:Twitter] No Gemini API key, skipping Twitter scan')
    return []
  }

  try {
    const { GoogleGenAI } = await import('@google/genai')
    const ai = new GoogleGenAI({ apiKey })

    const prompt = `Search X/Twitter for the most discussed topics this week related to: ${searchTerms.join(', ')}

For the "${niche}" niche, find 5-8 specific trending discussions, debates, or viral posts from X/Twitter in the last 7 days.

Return ONLY a JSON array (no markdown, no code fences) with objects containing:
- "topic": specific trending topic or hashtag (be specific, not generic)
- "engagement": "high", "medium", or "low" based on apparent virality
- "description": one-sentence summary of the discussion/trend
- "sample_posts": array of 2-3 example tweet texts or paraphrased content you found
- "estimated_likes": rough average likes per post on this topic (number)
- "estimated_reposts": rough average reposts per post on this topic (number)

Be specific to ${niche}. Do NOT return generic social media advice. Return real, current trending discussions.`

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3,
      },
    })

    const text = result.text || ''
    // Strip markdown code fences if present
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()

    try {
      const parsed = JSON.parse(cleaned)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // Try extracting JSON array from response
      const match = cleaned.match(/\[[\s\S]*\]/)
      if (match) {
        try { return JSON.parse(match[0]) } catch {}
      }
    }

    console.warn(`[CulturalScanner:Twitter] Could not parse Gemini response for ${niche}`)
    return []
  } catch (err: any) {
    console.error(`[CulturalScanner:Twitter] Gemini error for ${niche}:`, err?.message)
    return []
  }
}

async function scanTwitter(
  db: SupabaseClient, niches: string[], today: string
): Promise<{ rows: number; posts: number; errors: string[] }> {
  let totalRows = 0, totalPosts = 0
  const errors: string[] = []

  for (const niche of niches) {
    const terms = NICHE_TWITTER_TERMS[niche]
    if (!terms) { errors.push(`${niche}: no twitter search terms`); continue }

    try {
      const trends = await scanTwitterForNiche(niche, terms)
      if (trends.length > 0) {
        const themes = trends.map(t => t.topic)
        const { error } = await db
          .from('cultural_scan_results')
          .upsert({
            niche,
            source: 'twitter',
            subreddit: null,
            scan_date: today,
            raw_data: trends.map(t => ({
              topic: t.topic,
              engagement: t.engagement,
              description: t.description,
              sample_posts: t.sample_posts || [],
              estimated_likes: t.estimated_likes || 0,
              estimated_reposts: t.estimated_reposts || 0,
            })),
            post_count: trends.length,
            top_themes: themes,
          }, { onConflict: 'niche,source,subreddit,scan_date' })

        if (error) errors.push(`twitter/${niche}: ${error.message}`)
        else { totalRows++; totalPosts += trends.length }
      }
      // Rate limit between Gemini calls
      await delay(2000)
    } catch (err: any) { errors.push(`twitter/${niche}: ${err?.message}`) }
  }
  return { rows: totalRows, posts: totalPosts, errors }
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 3: LLM Trend Synthesis
// ═══════════════════════════════════════════════════════════════════════

interface SynthesizedTrend {
  trend_summary: string
  velocity_score: number
  confidence: number
  sources: string[]
  evidence: string[]
}

async function synthesizeTrends(
  db: SupabaseClient, niches: string[], today: string
): Promise<{ trends: number; errors: string[] }> {
  const apiKey = process.env.GOOGLE_GEMINI_AI_API_KEY || process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    return { trends: 0, errors: ['No Gemini API key for synthesis'] }
  }

  let totalTrends = 0
  const errors: string[] = []

  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey })

  for (const niche of niches) {
    try {
      // Fetch today's scan data for this niche (both Reddit + Twitter)
      const { data: scanRows, error: fetchErr } = await db
        .from('cultural_scan_results')
        .select('source, subreddit, raw_data, top_themes, post_count')
        .eq('niche', niche)
        .eq('scan_date', today)

      if (fetchErr || !scanRows || scanRows.length === 0) {
        errors.push(`${niche}: no scan data for today`)
        continue
      }

      // Build context for the LLM
      const redditRows = scanRows.filter((r: any) => r.source === 'reddit')
      const twitterRows = scanRows.filter((r: any) => r.source === 'twitter')

      const redditSummary = redditRows.map((r: any) => {
        const topPosts = (r.raw_data || [])
          .slice(0, 5)
          .map((p: any) => `  - "${p.title}" (${p.score} upvotes, ${p.num_comments} comments)`)
          .join('\n')
        return `r/${r.subreddit} (${r.post_count} posts):\n  Themes: ${(r.top_themes || []).join(', ')}\n  Top posts:\n${topPosts}`
      }).join('\n\n')

      const twitterSummary = twitterRows.map((r: any) => {
        return (r.raw_data || []).map((t: any) =>
          `- ${t.topic} [${t.engagement} engagement]: ${t.description}`
        ).join('\n')
      }).join('\n')

      const sourceCount = scanRows.reduce((sum: number, r: any) => sum + (r.post_count || 0), 0)

      const prompt = `You are a cultural intelligence analyst for the "${niche}" content niche. Analyze this week's social media data and identify the 3-5 most significant emerging trends.

## Reddit Data (last 7 days)
${redditSummary || 'No Reddit data available'}

## X/Twitter Data (last 7 days)
${twitterSummary || 'No Twitter data available'}

## Your Task
Synthesize the data above into 3-5 SPECIFIC, ACTIONABLE trend summaries for short-form video creators in the ${niche} niche. Each trend should be:
- Specific enough to inspire a video topic (not generic like "people like fitness")
- Cross-referenced across sources where possible
- Assessed for velocity (is this growing fast or plateauing?)

Return ONLY a JSON array (no markdown, no code fences) with objects:
- "trend_summary": 1-2 sentence specific trend description that a creator could act on
- "velocity_score": 0.0-1.0 (0=dying, 0.5=stable, 0.8+=accelerating fast)
- "confidence": 0.0-1.0 (how confident based on data volume and cross-source agreement)
- "sources": array of source labels (e.g. ["r/fitness", "r/loseit", "twitter"])
- "evidence": array of 2-3 specific data points supporting this trend (post titles, engagement numbers)`

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { temperature: 0.4 },
      })

      const text = result.text || ''
      const cleaned = text.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()

      let trends: SynthesizedTrend[] = []
      try {
        trends = JSON.parse(cleaned)
      } catch {
        const match = cleaned.match(/\[[\s\S]*\]/)
        if (match) {
          try { trends = JSON.parse(match[0]) } catch {}
        }
      }

      if (!Array.isArray(trends) || trends.length === 0) {
        errors.push(`${niche}: synthesis returned no valid trends`)
        continue
      }

      // Insert synthesized trends
      for (const trend of trends) {
        const { error: insertErr } = await db
          .from('detected_trends')
          .upsert({
            niche,
            trend_summary: trend.trend_summary,
            velocity_score: Math.max(0, Math.min(1, trend.velocity_score || 0)),
            confidence: Math.max(0, Math.min(1, trend.confidence || 0)),
            source_count: sourceCount,
            sources: trend.sources || [],
            evidence: trend.evidence || [],
            detected_date: today,
          }, { onConflict: 'niche,detected_date' })
          // Note: onConflict uses md5(trend_summary) in the actual index,
          // but Supabase upsert doesn't support function-based conflicts.
          // We use insert + ignore duplicates approach instead.

        if (insertErr) {
          // Try plain insert if upsert fails (md5 index handles dedup)
          const { error: insertErr2 } = await db
            .from('detected_trends')
            .insert({
              niche,
              trend_summary: trend.trend_summary,
              velocity_score: Math.max(0, Math.min(1, trend.velocity_score || 0)),
              confidence: Math.max(0, Math.min(1, trend.confidence || 0)),
              source_count: sourceCount,
              sources: trend.sources || [],
              evidence: trend.evidence || [],
              detected_date: today,
            })
          if (insertErr2 && !insertErr2.message.includes('duplicate')) {
            errors.push(`${niche}/trend: ${insertErr2.message}`)
          } else {
            totalTrends++
          }
        } else {
          totalTrends++
        }
      }

      await delay(1500)
    } catch (err: any) {
      errors.push(`synthesis/${niche}: ${err?.message}`)
    }
  }

  return { trends: totalTrends, errors }
}

// ── Delay helper ────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// ═══════════════════════════════════════════════════════════════════════
// Main Handler
// ═══════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const targetNiche = searchParams.get('niche') || null
  const phase = searchParams.get('phase') || 'all' // reddit | twitter | synthesize | all

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 })
  }

  const db = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  const nichesToScan = targetNiche ? [targetNiche] : Object.keys(NICHE_SUBREDDITS)
  const today = new Date().toISOString().split('T')[0]
  const startTime = Date.now()

  const results: Record<string, any> = {}
  const allErrors: string[] = []

  console.log(`[CulturalScanner] Starting phase=${phase} for ${nichesToScan.length} niche(s)...`)

  // Phase 1: Reddit
  if (phase === 'all' || phase === 'reddit') {
    const reddit = await scanReddit(db, nichesToScan, today)
    results.reddit = { rows: reddit.rows, posts: reddit.posts }
    allErrors.push(...reddit.errors)
  }

  // Phase 2: Twitter (via Gemini + Google Search)
  if (phase === 'all' || phase === 'twitter') {
    const twitter = await scanTwitter(db, nichesToScan, today)
    results.twitter = { rows: twitter.rows, posts: twitter.posts }
    allErrors.push(...twitter.errors)
  }

  // Phase 3: Trend Synthesis
  if (phase === 'all' || phase === 'synthesize') {
    const synthesis = await synthesizeTrends(db, nichesToScan, today)
    results.synthesis = { trends_created: synthesis.trends }
    allErrors.push(...synthesis.errors)
  }

  // Track job run
  try {
    await db.from('integration_job_runs').upsert({ job: 'cultural_scanner', last_run: new Date().toISOString() } as any)
  } catch {}

  const elapsed = Date.now() - startTime
  console.log(`[CulturalScanner] Done in ${(elapsed / 1000).toFixed(1)}s`)

  return NextResponse.json({
    success: true,
    phase,
    niches_scanned: nichesToScan.length,
    scan_date: today,
    elapsed_ms: elapsed,
    results,
    errors: allErrors.length > 0 ? allErrors : undefined,
  })
}
```

### `src/app/api/cron/classify-events/route.ts`

```ts
/**
 * Event Classifier — Converts detected_trends → cultural_events
 * Atlas subsystem 4 — Cultural Intelligence Pipeline
 *
 * GET /api/cron/classify-events              — classify all unprocessed trends
 * GET /api/cron/classify-events?niche=fitness — classify for one niche
 *
 * For each detected trend:
 * 1. Classifies by taxonomy (who/what/where/when/why/how)
 * 2. Estimates decay rate (how long until irrelevant)
 * 3. Determines which niches it activates
 * 4. Extracts keyword triggers for the prediction pipeline
 * 5. Auto-approves above confidence threshold (0.8)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const AUTO_APPROVE_THRESHOLD = 0.8

// ── All known niches for cross-niche activation ────────────────────────

const ALL_NICHES = [
  'side-hustles', 'personal-finance', 'fitness', 'business', 'food-nutrition',
  'beauty', 'real-estate', 'self-improvement', 'dating', 'education',
  'career', 'parenting', 'tech', 'fashion', 'health',
  'cooking', 'psychology', 'travel', 'diy', 'language',
]

// ── LLM Classification ─────────────────────────────────────────────────

interface ClassifiedEvent {
  event_title: string
  event_summary: string
  taxonomy: {
    who: string
    what: string
    where: string
    when: string
    why: string
    how: string
  }
  decay_rate: number
  activated_niches: string[]
  keywords: string[]
  expires_in_days: number
}

async function classifyTrends(
  trends: Array<{ id: number; niche: string; trend_summary: string; velocity_score: number; confidence: number; sources: string[]; evidence: any[] }>
): Promise<ClassifiedEvent[]> {
  const apiKey = process.env.GOOGLE_GEMINI_AI_API_KEY || process.env.GOOGLE_AI_API_KEY
  if (!apiKey) throw new Error('No Gemini API key')

  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey })

  const trendDescriptions = trends.map((t, i) =>
    `${i + 1}. [${t.niche}] (velocity: ${t.velocity_score}, confidence: ${t.confidence}) ${t.trend_summary}\n   Sources: ${(t.sources || []).join(', ')}`
  ).join('\n')

  const prompt = `You are a cultural intelligence classifier for a content creation platform. Classify each detected trend into an actionable cultural event.

## Detected Trends
${trendDescriptions}

## Available Niches
${ALL_NICHES.join(', ')}

## For each trend, produce a classified event with:
- "event_title": Short, punchy title (5-10 words, like a headline)
- "event_summary": 1-2 sentence actionable summary for content creators
- "taxonomy": Classification object with:
  - "who": Who is involved/affected? (audience, demographics, influencers)
  - "what": What is the core event/trend? (be specific)
  - "where": Where is this happening? (platforms, regions, communities)
  - "when": When is this relevant? (this week, this month, seasonal, evergreen)
  - "why": Why does this matter for content creators?
  - "how": How should creators respond? (content angle, format suggestion)
- "decay_rate": 0.0-1.0 (0.0=evergreen/months, 0.3=weeks, 0.5=days, 0.8=hours, 1.0=already expired)
- "activated_niches": Array of niche keys this event is relevant to (can span multiple niches)
- "keywords": Array of 5-10 lowercase keywords that would appear in video captions/hashtags matching this event
- "expires_in_days": Estimated days until this event is no longer relevant (1-90)

Return ONLY a JSON array (no markdown, no code fences).`

  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { temperature: 0.3 },
  })

  const text = result.text || ''
  const cleaned = text.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/)
    if (match) return JSON.parse(match[0])
    throw new Error('Failed to parse classification response')
  }
}

// ── Main Handler ────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const targetNiche = searchParams.get('niche') || null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 })
  }

  const db = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  const startTime = Date.now()

  // Fetch detected trends that haven't been classified yet
  // (no matching cultural_event with same source_trend_id)
  let query = db
    .from('detected_trends')
    .select('id, niche, trend_summary, velocity_score, confidence, sources, evidence, detected_date')
    .order('detected_date', { ascending: false })
    .limit(20)

  if (targetNiche) {
    query = query.eq('niche', targetNiche)
  }

  const { data: trends, error: fetchErr } = await query

  if (fetchErr || !trends || trends.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No trends to classify',
      classified: 0,
      elapsed_ms: Date.now() - startTime,
    })
  }

  // Filter out trends that already have corresponding cultural_events
  const trendIds = trends.map(t => t.id)
  const { data: existingEvents } = await db
    .from('cultural_events')
    .select('source_trend_ids')

  const alreadyClassifiedIds = new Set<number>()
  ;(existingEvents || []).forEach((e: any) => {
    ;(e.source_trend_ids || []).forEach((id: number) => alreadyClassifiedIds.add(id))
  })

  const unclassified = trends.filter(t => !alreadyClassifiedIds.has(t.id))

  if (unclassified.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'All trends already classified',
      classified: 0,
      elapsed_ms: Date.now() - startTime,
    })
  }

  console.log(`[EventClassifier] Classifying ${unclassified.length} trends...`)

  const errors: string[] = []
  let classified = 0
  let autoApproved = 0

  try {
    const events = await classifyTrends(unclassified)

    for (let i = 0; i < events.length && i < unclassified.length; i++) {
      const event = events[i]
      const trend = unclassified[i]

      const shouldAutoApprove = trend.confidence >= AUTO_APPROVE_THRESHOLD
      const expiresAt = new Date(Date.now() + (event.expires_in_days || 7) * 24 * 3600 * 1000).toISOString()

      const { error: insertErr } = await db
        .from('cultural_events')
        .insert({
          niche: trend.niche,
          event_title: event.event_title,
          event_summary: event.event_summary,
          taxonomy_classification: event.taxonomy || {},
          velocity_score: trend.velocity_score,
          confidence: trend.confidence,
          decay_rate_estimate: Math.max(0, Math.min(1, event.decay_rate || 0.3)),
          activated_niches: event.activated_niches || [trend.niche],
          source_trend_ids: [trend.id],
          keywords: event.keywords || [],
          status: shouldAutoApprove ? 'approved' : 'detected',
          auto_approved: shouldAutoApprove,
          reviewed_at: shouldAutoApprove ? new Date().toISOString() : null,
          reviewed_by: shouldAutoApprove ? 'auto' : null,
          expires_at: expiresAt,
          generated_by_agent: 'Trend Scout',
        })

      if (insertErr) {
        errors.push(`${trend.niche}/${event.event_title}: ${insertErr.message}`)
      } else {
        classified++
        if (shouldAutoApprove) autoApproved++
      }
    }
  } catch (err: any) {
    errors.push(`Classification failed: ${err.message}`)
  }

  // Track job run
  try {
    await db.from('integration_job_runs').upsert({ job: 'event_classifier', last_run: new Date().toISOString() } as any)
  } catch {}

  const elapsed = Date.now() - startTime
  console.log(`[EventClassifier] Done: ${classified} classified, ${autoApproved} auto-approved in ${(elapsed / 1000).toFixed(1)}s`)

  return NextResponse.json({
    success: true,
    trends_found: unclassified.length,
    classified,
    auto_approved: autoApproved,
    needs_review: classified - autoApproved,
    auto_approve_threshold: AUTO_APPROVE_THRESHOLD,
    elapsed_ms: elapsed,
    errors: errors.length > 0 ? errors : undefined,
  })
}
```
