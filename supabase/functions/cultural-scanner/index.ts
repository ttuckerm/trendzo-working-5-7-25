// =====================================================
// Cultural Intelligence Scanner — Reddit Niche Monitor
// =====================================================
// Atlas subsystem 4 — KAIROS tick loop
// Scans niche-relevant subreddits for trending discussions,
// extracts themes, and stores in cultural_scan_results.
//
// Triggered nightly via cron or manually via POST with
// optional { niche: "fitness" } to scan a single niche.
// =====================================================

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// =====================================================
// Niche → Subreddit Mapping
// =====================================================

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
};

// =====================================================
// Reddit Fetcher
// =====================================================

interface RedditPost {
  title: string;
  score: number;
  num_comments: number;
  url: string;
  permalink: string;
  selftext: string;
  created_utc: number;
  subreddit: string;
  link_flair_text: string | null;
}

interface ScanResult {
  niche: string;
  subreddit: string;
  posts: RedditPost[];
  themes: string[];
  postCount: number;
}

async function fetchSubredditTop(
  subreddit: string,
  timeframe: string = 'week',
  limit: number = 25
): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/top.json?t=${timeframe}&limit=${limit}&raw_json=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Trendzo-Cultural-Scanner/1.0 (cultural intelligence research)',
        'Accept': 'application/json',
      },
    });

    if (response.status === 429) {
      // Rate limited — back off
      console.warn(`⚠️  Rate limited on r/${subreddit}, skipping`);
      return [];
    }

    if (!response.ok) {
      console.warn(`⚠️  r/${subreddit} returned ${response.status}, skipping`);
      return [];
    }

    const data = await response.json();
    const children = data?.data?.children || [];

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
    }));
  } catch (err: any) {
    console.error(`❌ Failed to fetch r/${subreddit}:`, err?.message);
    return [];
  }
}

// =====================================================
// Theme Extraction (lightweight keyword clustering)
// =====================================================

function extractThemes(posts: RedditPost[], maxThemes: number = 8): string[] {
  // Combine titles into a frequency map of meaningful bigrams/trigrams
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
    'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
    'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both',
    'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
    'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
    'don', 'now', 'and', 'but', 'or', 'if', 'while', 'because', 'about',
    'up', 'down', 'this', 'that', 'these', 'those', 'what', 'which', 'who',
    'whom', 'its', 'it', 'i', 'me', 'my', 'we', 'our', 'you', 'your',
    'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their', 'am',
    'get', 'got', 'like', 'one', 'also', 'much', 'even', 'still', 'really',
    'going', 'went', 'any', 'new', 'old', 'first', 'last', 'long', 'great',
    'little', 'right', 'big', 'high', 'small', 'large', 'next', 'early',
    'make', 'made', 'thing', 'things', 'people', 'way', 'well', 'back',
    'day', 'days', 'time', 'year', 'years', 'know', 'think', 'want',
    'look', 'use', 'come', 'good', 'give', 'take', 'see', 'try', 'say',
    'feel', 'keep', 'let', 'help', 'tell', 'ask', 'seem', 'show', 'put',
    'run', 'move', 'live', 'believe', 'bring', 'happen', 'must', 'call',
    'ever', 'already', 'ive', 'dont', 'im', 'cant', 'doesnt',
  ]);

  const wordFreq = new Map<string, number>();

  for (const post of posts) {
    const words = post.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    // Count individual meaningful words weighted by post score
    const weight = Math.log2(Math.max(post.score, 2));
    for (const word of words) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + weight);
    }

    // Also count bigrams
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      wordFreq.set(bigram, (wordFreq.get(bigram) || 0) + weight * 1.5);
    }
  }

  // Sort by frequency, filter out single-occurrence terms
  return Array.from(wordFreq.entries())
    .filter(([, count]) => count > 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxThemes)
    .map(([term]) => term);
}

// =====================================================
// Delay helper (respect Reddit rate limits)
// =====================================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =====================================================
// Main Scanner
// =====================================================

async function scanNiche(niche: string): Promise<ScanResult[]> {
  const subreddits = NICHE_SUBREDDITS[niche];
  if (!subreddits || subreddits.length === 0) {
    console.warn(`⚠️  No subreddits mapped for niche: ${niche}`);
    return [];
  }

  const results: ScanResult[] = [];

  for (const sub of subreddits) {
    const posts = await fetchSubredditTop(sub, 'week', 25);

    if (posts.length > 0) {
      const themes = extractThemes(posts);
      results.push({
        niche,
        subreddit: sub,
        posts,
        themes,
        postCount: posts.length,
      });
    }

    // 1.5s delay between subreddit fetches to respect rate limits
    await delay(1500);
  }

  return results;
}

// =====================================================
// Main Handler
// =====================================================

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('PROJECT_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: 'Missing Supabase configuration' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    // Parse optional body — { niche?: string } to scan a single niche
    let targetNiche: string | null = null;
    try {
      const body = await req.json();
      if (body?.niche && typeof body.niche === 'string') {
        targetNiche = body.niche;
      }
    } catch {
      // No body or invalid JSON — scan all niches
    }

    const nichesToScan = targetNiche
      ? [targetNiche]
      : Object.keys(NICHE_SUBREDDITS);

    console.log(`🔍 Cultural Scanner: scanning ${nichesToScan.length} niche(s)...`);

    let totalRows = 0;
    let totalPosts = 0;
    const errors: string[] = [];
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    for (const niche of nichesToScan) {
      try {
        const results = await scanNiche(niche);

        for (const result of results) {
          const row = {
            niche: result.niche,
            source: 'reddit',
            subreddit: result.subreddit,
            scan_date: today,
            raw_data: result.posts.map(p => ({
              title: p.title,
              score: p.score,
              num_comments: p.num_comments,
              url: p.url,
              permalink: p.permalink,
              selftext_preview: p.selftext.substring(0, 200),
              created_utc: p.created_utc,
              flair: p.link_flair_text,
            })),
            post_count: result.postCount,
            top_themes: result.themes,
          };

          const { error } = await supabase
            .from('cultural_scan_results')
            .upsert(row, { onConflict: 'niche,subreddit,scan_date' });

          if (error) {
            console.error(`❌ DB error for ${niche}/${result.subreddit}:`, error.message);
            errors.push(`${niche}/${result.subreddit}: ${error.message}`);
          } else {
            totalRows++;
            totalPosts += result.postCount;
          }
        }

        // Brief pause between niches to avoid Reddit throttling
        if (nichesToScan.length > 1) {
          await delay(2000);
        }
      } catch (err: any) {
        console.error(`❌ Niche scan failed for ${niche}:`, err?.message);
        errors.push(`${niche}: ${err?.message}`);
      }
    }

    // Track job run
    try {
      await supabase
        .from('integration_job_runs')
        .upsert({ job: 'cultural_scanner', last_run: new Date().toISOString() } as any);
    } catch {}

    console.log(`✅ Cultural Scanner complete: ${totalRows} rows, ${totalPosts} posts across ${nichesToScan.length} niche(s)`);

    return new Response(
      JSON.stringify({
        ok: true,
        niches_scanned: nichesToScan.length,
        rows_upserted: totalRows,
        total_posts: totalPosts,
        errors: errors.length > 0 ? errors : undefined,
        scan_date: today,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Cultural Scanner error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
