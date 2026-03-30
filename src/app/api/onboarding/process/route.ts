import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';
import OpenAI from 'openai';

/**
 * POST /api/onboarding/process
 *
 * Runs the three processing stages for onboarding step 1.11:
 * 1. Analyze niche patterns from viral_genomes
 * 2. Find proven hooks from scraped_videos
 * 3. Generate content strategy via GPT-4o-mini
 *
 * Returns all three results for the client to save.
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { profileId } = await request.json();

    if (!profileId) {
      return NextResponse.json({ error: 'profileId required' }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Load the profile to get niche and other onboarding data
    const { data: profile, error: profileError } = await supabase
      .from('onboarding_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: profileError?.message || 'Profile not found' },
        { status: 404 }
      );
    }

    const nicheKey = profile.niche_key;

    // ── Stage 1: Analyze niche patterns from viral_genomes ──────────────
    let niche_intelligence: Record<string, unknown> = {};
    try {
      const { data: genomes } = await supabase
        .from('viral_genomes')
        .select('topic, angle, hook_spoken, hook_text, hook_visual, story_structure, visual_format, viral_patterns, dps_score')
        .eq('niche', nicheKey)
        .order('dps_score', { ascending: false })
        .limit(20);

      if (genomes && genomes.length > 0) {
        // Aggregate patterns
        const patternCounts: Record<string, number> = {};
        const storyStructures: Record<string, number> = {};
        const visualFormats: Record<string, number> = {};
        const topTopics: string[] = [];

        for (const g of genomes) {
          if (g.viral_patterns) {
            for (const p of g.viral_patterns) {
              patternCounts[p] = (patternCounts[p] || 0) + 1;
            }
          }
          if (g.story_structure) {
            storyStructures[g.story_structure] = (storyStructures[g.story_structure] || 0) + 1;
          }
          if (g.visual_format) {
            visualFormats[g.visual_format] = (visualFormats[g.visual_format] || 0) + 1;
          }
          if (g.topic) topTopics.push(g.topic);
        }

        // Sort by frequency, take top entries
        const sortByFreq = (obj: Record<string, number>) =>
          Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);

        niche_intelligence = {
          total_genomes_analyzed: genomes.length,
          top_patterns: sortByFreq(patternCounts),
          top_story_structures: sortByFreq(storyStructures),
          top_visual_formats: sortByFreq(visualFormats),
          sample_topics: topTopics.slice(0, 10),
          avg_dps: genomes.reduce((s, g) => s + (g.dps_score || 0), 0) / genomes.length,
        };
      }
    } catch (e: any) {
      console.error('[OnboardingProcess] Stage 1 error (non-blocking):', e.message);
      niche_intelligence = { error: 'No genome data available for this niche' };
    }

    // ── Stage 2: Find proven hooks from scraped_videos ──────────────────
    let proven_hooks: Record<string, unknown>[] = [];
    try {
      const { data: topVideos } = await supabase
        .from('scraped_videos')
        .select('id, title, creator, views, likes, dps_score, niche')
        .eq('niche', nicheKey)
        .not('dps_score', 'is', null)
        .order('dps_score', { ascending: false })
        .limit(10);

      if (topVideos && topVideos.length > 0) {
        proven_hooks = topVideos.map((v: any) => ({
          video_id: v.id,
          title: v.title,
          creator: v.creator,
          views: v.views,
          dps_score: v.dps_score,
          // Extract the hook (first ~100 chars of title as proxy)
          hook_text: v.title?.substring(0, 120) || '',
        }));
      }
    } catch (e: any) {
      console.error('[OnboardingProcess] Stage 2 error (non-blocking):', e.message);
    }

    // ── Stage 3: Generate content strategy via GPT-4o-mini ──────────────
    let content_strategy: Record<string, unknown> = {};
    try {
      const promptContext = {
        niche: nicheKey,
        subtopics: profile.subtopics || [],
        content_goals: profile.content_goals || [],
        audience: {
          demographics: profile.target_demographics,
          pain_points: profile.audience_pain_points,
          dream_result: profile.audience_dream_result,
          myths: profile.audience_myths,
          mistakes: profile.audience_mistakes,
        },
        brand_tone: profile.brand_tone || [],
        creator_story: {
          origin: profile.origin_story,
          wins_losses: profile.wins_and_losses,
          exclusions: profile.content_exclusions,
        },
        niche_intelligence: niche_intelligence,
        proven_hooks_count: proven_hooks.length,
        differentiator: profile.differentiator,
      };

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a viral content strategist. Based on the creator's profile data, generate a personalized content strategy.

Return a JSON object with exactly these keys:
{
  "content_pillars": ["pillar1", "pillar2", "pillar3"] (3-4 main content themes),
  "recommended_themes": ["theme1", "theme2", ...] (5-8 specific video themes),
  "posting_cadence": "description of ideal posting schedule",
  "hook_styles_to_use": ["style1", "style2", "style3"] (3-4 hook approaches that work for this niche),
  "content_mix": { "educational": 40, "entertaining": 30, "promotional": 20, "personal": 10 } (percentage breakdown),
  "first_video_suggestion": "A specific idea for their first video",
  "differentiator_angle": "How to position against competitors",
  "audience_triggers": ["trigger1", "trigger2", "trigger3"] (emotional/psychological triggers to use)
}

Return ONLY the JSON object, no additional text.`,
          },
          {
            role: 'user',
            content: JSON.stringify(promptContext),
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        content_strategy = JSON.parse(content);
      }
    } catch (e: any) {
      console.error('[OnboardingProcess] Stage 3 error:', e.message);
      content_strategy = {
        error: 'Strategy generation unavailable',
        content_pillars: ['Educational content', 'Behind the scenes', 'Tips & tricks'],
        posting_cadence: '3-5 times per week',
        first_video_suggestion: 'Share your origin story — how you got into this niche',
      };
    }

    return NextResponse.json({
      niche_intelligence,
      proven_hooks,
      content_strategy,
    });
  } catch (e: any) {
    console.error('[OnboardingProcess] Fatal error:', e);
    return NextResponse.json(
      { error: e.message || 'Processing failed' },
      { status: 500 }
    );
  }
}
