import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface ExpandedKeyword {
  keyword: string;
  source: 'tiktok-autocomplete' | 'google-autocomplete' | 'youtube-autocomplete' | 'llm-expansion' | 'competitor-hashtags';
  confidence: number;
  metadata?: {
    trend?: 'rising' | 'stable' | 'declining';
    volume?: 'high' | 'medium' | 'low';
    frequency?: number;
  };
}

// =====================================================
// TikTok Autocomplete Scraper (Alternative Mobile API)
// =====================================================

async function getTikTokAutocompleteSuggestions(seedKeyword: string): Promise<ExpandedKeyword[]> {
  try {
    // Try TikTok mobile API endpoint (less likely to be blocked)
    const url = `https://m.tiktok.com/api/suggest/search/?keyword=${encodeURIComponent(seedKeyword)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json',
        'Referer': 'https://m.tiktok.com/',
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      console.warn(`TikTok autocomplete failed for "${seedKeyword}":`, response.status);
      return [];
    }

    const data = await response.json();

    // Extract suggestions from response (format may vary)
    const suggestions = data?.suggest_words || data?.data?.suggest_words || data?.sug_list || [];

    const keywords = suggestions
      .map((item: any) => typeof item === 'string' ? item : item?.word || item?.title)
      .filter((word: string) => word && word.length > 0 && word.length < 100)
      .slice(0, 15); // Limit to 15 per seed

    return keywords.map((word: string) => ({
      keyword: word,
      source: 'tiktok-autocomplete' as const,
      confidence: 0.85, // High confidence - these are actual TikTok suggestions
      metadata: { volume: 'high' as const }
    }));
  } catch (error) {
    console.error(`Error fetching TikTok suggestions for "${seedKeyword}":`, error);
    return [];
  }
}

// =====================================================
// Google Autocomplete (More Reliable Than Trends)
// =====================================================

async function getGoogleAutocompleteSuggestions(seedKeyword: string): Promise<ExpandedKeyword[]> {
  try {
    // Google's public autocomplete API
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(seedKeyword)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn(`Google autocomplete failed for "${seedKeyword}":`, response.status);
      return [];
    }

    const data = await response.json();

    // Response format: [query, [suggestions]]
    const suggestions = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];

    return suggestions.slice(0, 12).map((keyword: string) => ({
      keyword: keyword.trim(),
      source: 'google-autocomplete' as const,
      confidence: 0.80,
      metadata: { volume: 'medium' as const }
    }));
  } catch (error) {
    console.error(`Error fetching Google autocomplete for "${seedKeyword}":`, error);
    return [];
  }
}

// =====================================================
// YouTube Autocomplete
// =====================================================

async function getYouTubeAutocompleteSuggestions(seedKeyword: string): Promise<ExpandedKeyword[]> {
  try {
    // YouTube's public autocomplete API
    const url = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(seedKeyword)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn(`YouTube autocomplete failed for "${seedKeyword}":`, response.status);
      return [];
    }

    const data = await response.json();

    // Response format: [query, [suggestions]]
    const suggestions = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];

    return suggestions.slice(0, 12).map((keyword: string) => ({
      keyword: keyword.trim(),
      source: 'youtube-autocomplete' as const,
      confidence: 0.78, // Slightly lower than Google (cross-platform validation)
      metadata: { volume: 'medium' as const }
    }));
  } catch (error) {
    console.error(`Error fetching YouTube autocomplete for "${seedKeyword}":`, error);
    return [];
  }
}

// =====================================================
// LLM-Based Keyword Expansion (FIXED)
// =====================================================

async function getLLMKeywordExpansions(
  seedKeywords: string[],
  niche: string,
  displayName: string
): Promise<ExpandedKeyword[]> {
  try {
    const prompt = `Generate 30 high-intent TikTok search queries for the "${displayName}" niche.

Seed keywords: ${seedKeywords.join(', ')}

Rules:
- Focus on actionable, how-to queries (e.g., "how to save money on groceries")
- Include problem-solving queries (e.g., "why can't I lose weight")
- Mix beginner and intermediate level queries
- Each query should be 2-6 words
- NO numbering, NO bullet points, NO explanations
- Return ONLY the raw keyword text, one per line

Example format:
how to budget money
best side hustles 2024
save money on groceries

Generate 30 keywords:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a keyword research expert. Return ONLY raw keywords, one per line. No formatting, numbering, or explanations.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 600,
    });

    const rawContent = completion.choices[0].message.content || '';

    // Aggressive cleaning to remove ALL formatting
    const keywords = rawContent
      .split('\n')
      .map(line => line.trim())
      .map(line => {
        // Remove numbering: "1.", "1)", "- ", "* ", etc.
        return line.replace(/^\d+[\.)]\s*/, '')
                   .replace(/^[-*•]\s*/, '')
                   .replace(/^[:\-]\s*/, '')
                   .trim();
      })
      .filter(line => {
        // Keep only valid keywords
        return line.length > 0
          && line.length <= 100
          && !line.toLowerCase().startsWith('example')
          && !line.toLowerCase().includes('generate')
          && !line.match(/^[^a-zA-Z]/); // Must start with letter
      })
      .slice(0, 30);

    return keywords.map(keyword => ({
      keyword,
      source: 'llm-expansion' as const,
      confidence: 0.65, // Medium confidence - needs validation
      metadata: {}
    }));
  } catch (error) {
    console.error('Error with LLM keyword expansion:', error);
    return [];
  }
}

// =====================================================
// Competitor Hashtag Analysis (NEW - FULLY IMPLEMENTED)
// =====================================================

async function getCompetitorHashtags(niche: string): Promise<ExpandedKeyword[]> {
  try {
    // Query scraped_videos for viral videos (DPS >= 70) with hashtags
    const { data: viralVideos, error } = await supabase
      .from('scraped_videos')
      .select('hashtags')
      .gte('dps_score', 70) // Only viral videos
      .not('hashtags', 'is', null)
      .limit(200); // Analyze top 200 viral videos

    if (error) {
      console.error('Error querying viral videos for hashtags:', error);
      return [];
    }

    if (!viralVideos || viralVideos.length === 0) {
      console.warn('No viral videos found with hashtags');
      return [];
    }

    // Count hashtag frequency
    const hashtagFrequency = new Map<string, number>();

    viralVideos.forEach(video => {
      const hashtags = video.hashtags;
      if (Array.isArray(hashtags)) {
        hashtags.forEach((tag: string) => {
          const normalized = tag.toLowerCase().replace(/^#/, '').trim();
          if (normalized.length > 0 && normalized.length < 50) {
            hashtagFrequency.set(normalized, (hashtagFrequency.get(normalized) || 0) + 1);
          }
        });
      }
    });

    // Convert to array and sort by frequency
    const sortedHashtags = Array.from(hashtagFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15); // Top 15 most common hashtags

    return sortedHashtags.map(([hashtag, frequency]) => ({
      keyword: hashtag,
      source: 'competitor-hashtags' as const,
      confidence: Math.min(0.90, 0.60 + (frequency / 100) * 0.30), // Scale confidence by frequency
      metadata: {
        frequency,
        volume: frequency > 20 ? 'high' : frequency > 10 ? 'medium' : 'low',
      }
    }));
  } catch (error) {
    console.error('Error analyzing competitor hashtags:', error);
    return [];
  }
}

// =====================================================
// Main Expansion Logic
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const { seedKeywords, niche, displayName } = await request.json();

    if (!seedKeywords || !Array.isArray(seedKeywords) || seedKeywords.length === 0) {
      return NextResponse.json(
        { error: 'seedKeywords array is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Expanding keywords for ${displayName} (${niche})...`);
    console.log(`   Seed keywords: ${seedKeywords.join(', ')}`);

    const allExpanded: ExpandedKeyword[] = [];

    // 1. TikTok Autocomplete (for each seed keyword)
    console.log('   📱 Fetching TikTok autocomplete suggestions...');
    for (const seed of seedKeywords.slice(0, 5)) { // Limit to first 5 to avoid rate limits
      const tiktokSuggestions = await getTikTokAutocompleteSuggestions(seed);
      allExpanded.push(...tiktokSuggestions);
      console.log(`      - "${seed}": ${tiktokSuggestions.length} suggestions`);
      await new Promise(resolve => setTimeout(resolve, 800)); // Rate limiting
    }

    // 2. Google Autocomplete (for each seed keyword)
    console.log('   🔍 Fetching Google autocomplete suggestions...');
    for (const seed of seedKeywords.slice(0, 5)) {
      const googleSuggestions = await getGoogleAutocompleteSuggestions(seed);
      allExpanded.push(...googleSuggestions);
      console.log(`      - "${seed}": ${googleSuggestions.length} suggestions`);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // 3. YouTube Autocomplete (for each seed keyword)
    console.log('   🎥 Fetching YouTube autocomplete suggestions...');
    for (const seed of seedKeywords.slice(0, 5)) {
      const youtubeSuggestions = await getYouTubeAutocompleteSuggestions(seed);
      allExpanded.push(...youtubeSuggestions);
      console.log(`      - "${seed}": ${youtubeSuggestions.length} suggestions`);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // 4. LLM Expansion (using all seed keywords)
    console.log('   🤖 Generating LLM keyword expansions...');
    const llmKeywords = await getLLMKeywordExpansions(seedKeywords, niche, displayName);
    allExpanded.push(...llmKeywords);
    console.log(`      - Generated ${llmKeywords.length} LLM keywords`);

    // 5. Competitor Hashtags (from existing viral videos)
    console.log('   🏆 Analyzing competitor hashtags from viral videos...');
    const competitorHashtags = await getCompetitorHashtags(niche);
    allExpanded.push(...competitorHashtags);
    console.log(`      - Found ${competitorHashtags.length} viral hashtags`);

    // Deduplicate (keep highest confidence for duplicates)
    const uniqueKeywords = new Map<string, ExpandedKeyword>();
    allExpanded.forEach(kw => {
      const normalized = kw.keyword.toLowerCase().trim();
      if (!uniqueKeywords.has(normalized) || uniqueKeywords.get(normalized)!.confidence < kw.confidence) {
        uniqueKeywords.set(normalized, kw);
      }
    });

    const dedupedKeywords = Array.from(uniqueKeywords.values());

    // Sort by confidence (high to low)
    dedupedKeywords.sort((a, b) => b.confidence - a.confidence);

    // Categorize by confidence
    const highConfidence = dedupedKeywords.filter(k => k.confidence >= 0.8);
    const mediumConfidence = dedupedKeywords.filter(k => k.confidence >= 0.6 && k.confidence < 0.8);
    const lowConfidence = dedupedKeywords.filter(k => k.confidence < 0.6);

    console.log(`   ✅ Expanded to ${dedupedKeywords.length} unique keywords`);
    console.log(`      High confidence: ${highConfidence.length}`);
    console.log(`      Medium confidence: ${mediumConfidence.length}`);
    console.log(`      Low confidence: ${lowConfidence.length}`);

    return NextResponse.json({
      niche,
      displayName,
      originalSeedKeywords: seedKeywords,
      expandedKeywords: dedupedKeywords,
      summary: {
        total: dedupedKeywords.length,
        highConfidence: highConfidence.length,
        mediumConfidence: mediumConfidence.length,
        lowConfidence: lowConfidence.length,
        sources: {
          tiktok: dedupedKeywords.filter(k => k.source === 'tiktok-autocomplete').length,
          google: dedupedKeywords.filter(k => k.source === 'google-autocomplete').length,
          youtube: dedupedKeywords.filter(k => k.source === 'youtube-autocomplete').length,
          llm: dedupedKeywords.filter(k => k.source === 'llm-expansion').length,
          competitors: dedupedKeywords.filter(k => k.source === 'competitor-hashtags').length,
        }
      }
    });
  } catch (error) {
    console.error('Error expanding keywords:', error);
    return NextResponse.json(
      { error: 'Failed to expand keywords', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
