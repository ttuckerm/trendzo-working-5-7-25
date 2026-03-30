import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { runPredictionPipeline } from '@/lib/prediction/runPredictionPipeline';
import { resolveCreatorContext } from '@/lib/prediction/creator-context';
import { getVpsTier } from '@/lib/prediction/system-registry';

/**
 * POST /api/quick-win/generate-script
 *
 * Generates a personalized TikTok script based on:
 * - A proven template video the user selected
 * - Their full onboarding profile (niche, audience, story, brand tone, etc.)
 * - Their content strategy and proven hooks from onboarding processing
 *
 * Uses auth session to identify the user and load their profile from
 * onboarding_profiles. Runs the prediction pipeline on the generated script
 * and saves everything to the generated_scripts table.
 *
 * Body: { templateVideoId: string } (the video_id from scraped_videos)
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { db: { schema: 'public' }, auth: { persistSession: false } },
);

export async function POST(request: NextRequest) {
  try {
    const { templateVideoId } = await request.json();

    if (!templateVideoId) {
      return NextResponse.json(
        { error: 'templateVideoId is required' },
        { status: 400 }
      );
    }

    // ── Auth ──────────────────────────────────────────────────────────────
    const authSupabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // ── Load profile by user_id ─────────────────────────────────────────
    const { data: profile, error: profileError } = await serviceClient
      .from('onboarding_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: profileError?.message || 'Onboarding profile not found' },
        { status: 404 }
      );
    }

    // ── Load template video (by video_id, the TikTok ID) ───────────────
    const { data: template, error: templateError } = await serviceClient
      .from('scraped_videos')
      .select('video_id, title, creator_username, niche, views_count, likes_count, dps_score, transcript_text')
      .eq('video_id', templateVideoId)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template video not found' },
        { status: 404 }
      );
    }

    // ── Build proven hooks context (top 5) ────────────────────────────────
    const provenHooks = Array.isArray(profile.proven_hooks)
      ? profile.proven_hooks.slice(0, 5).map((h: any) => h.hook_text || h.title || '').filter(Boolean)
      : [];

    // ── Resolve niche (selected_niche → niche_key → template niche) ─────
    const niche = profile.selected_niche || profile.niche_key || template.niche || 'General';

    // ── Build LLM prompt ──────────────────────────────────────────────────
    const promptContext = {
      template_video: {
        title: template.title,
        creator: template.creator_username,
        views: template.views_count,
        dps_score: template.dps_score,
      },
      creator: {
        niche,
        subtopics: profile.subtopics || profile.selected_subtopics || [],
        content_goals: profile.content_goals || [],
        business_name: profile.business_name,
        business_description: profile.business_description,
        brand_tone: profile.brand_tone || [],
        origin_story: profile.origin_story,
        wins_and_losses: profile.wins_and_losses,
        content_exclusions: profile.content_exclusions || [],
        fun_facts: profile.fun_facts || [],
        differentiator: profile.differentiator,
      },
      audience: {
        demographics: profile.target_demographics,
        pain_points: profile.audience_pain_points || [],
        dream_result: profile.audience_dream_result,
        myths: profile.audience_myths || [],
        mistakes: profile.audience_mistakes || [],
      },
      content_strategy: profile.content_strategy || {},
      proven_hooks: provenHooks,
      engagement: {
        trigger_word: profile.manychat_trigger_word,
        lead_magnet_type: profile.lead_magnet_type,
        lead_magnet_description: profile.lead_magnet_description,
      },
    };

    const systemPrompt = `You are a viral TikTok script writer. Generate a script following a proven format, personalized for a specific creator and their audience.

TEMPLATE VIDEO TO MODEL (this format went viral):
Title: "${template.title}"
Creator: @${template.creator_username || 'unknown'}
Views: ${template.views_count?.toLocaleString() || 'N/A'}

INSTRUCTIONS:
1. Analyze the template video's title/hook structure and replicate that format
2. Personalize the content for the creator's niche, audience, and voice
3. Include the creator's personal story elements where natural
4. Structure the script as: HOOK (first 3 seconds, attention-grabbing), BODY (value delivery, 20-45 seconds), CTA (call to action, 5-10 seconds)
5. Match the brand tone specified
6. Reference the audience's real pain points and dream results
7. If the creator has a ManyChat trigger word, incorporate it naturally in the CTA
8. NEVER mention topics from the content exclusions list
9. Use proven hook patterns from this niche

Return a JSON object with exactly these keys:
{
  "hook": "The opening 3-second hook text (what the creator says/shows first)",
  "body": "The main body of the script (20-45 seconds of value delivery)",
  "cta": "The call to action (5-10 seconds)",
  "full_script": "The complete script as a single flowing text",
  "hook_type": "The type of hook used (question, statistic, contrarian, story, etc.)",
  "estimated_duration_seconds": 45,
  "key_strengths": ["strength1", "strength2", "strength3"]
}

Return ONLY the JSON object, no additional text.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(promptContext) },
      ],
      temperature: 0.8,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const llmContent = response.choices[0]?.message?.content;
    if (!llmContent) {
      throw new Error('Empty response from LLM');
    }

    const parsed = JSON.parse(llmContent);
    const hook = parsed.hook || '';
    const body = parsed.body || '';
    const cta = parsed.cta || '';
    const fullScript = parsed.full_script || `${hook}\n\n${body}\n\n${cta}`;
    const hookType = parsed.hook_type || 'unknown';
    const strengths: string[] = parsed.key_strengths || [];

    // ── Resolve creator context for prediction pipeline ────────────────
    let creatorContext = null;
    try {
      creatorContext = await resolveCreatorContext(serviceClient, user.id);
    } catch (e: any) {
      console.warn('[GenerateScript] Creator context resolve failed (non-blocking):', e.message);
    }

    // ── Run prediction pipeline ───────────────────────────────────────────
    let vpsScore: number | null = null;
    let predictionRunId: string | null = null;
    let vpsTier = null;

    try {
      const pipelineResult = await runPredictionPipeline(
        `script-${Date.now()}`,
        {
          transcript: fullScript,
          niche,
          accountSize: creatorContext?.channelData?.followerCount
            ? (creatorContext.channelData.followerCount >= 1_000_000 ? 'mega (1M+)'
              : creatorContext.channelData.followerCount >= 100_000 ? 'large (100K-1M)'
              : creatorContext.channelData.followerCount >= 10_000 ? 'medium (10K-100K)'
              : 'small (0-10K)')
            : 'small (0-10K)',
          title: hook,
          description: fullScript.substring(0, 200),
          source: 'api',
          sourceMeta: { origin: 'quick-win', templateVideoId },
          creatorContext: creatorContext || undefined,
        }
      );

      if (pipelineResult.success) {
        vpsScore = pipelineResult.predicted_vps;
        predictionRunId = pipelineResult.run_id;
        vpsTier = getVpsTier(vpsScore);
      } else {
        console.warn('[GenerateScript] Pipeline returned unsuccessful:', pipelineResult.error);
      }
    } catch (e: any) {
      console.error('[GenerateScript] Prediction pipeline error (non-blocking):', e.message);
    }

    // ── Save to generated_scripts ─────────────────────────────────────────
    const { data: savedScript, error: saveError } = await serviceClient
      .from('generated_scripts')
      .insert({
        onboarding_profile_id: profile.id,
        user_id: user.id,
        script_text: fullScript,
        script_version: 1,
        niche_key: niche,
        template_video_id: templateVideoId,
        hook_type: hookType,
        generation_prompt_hash: null,
        viral_patterns_used: provenHooks,
        hooks_used: provenHooks,
        creator_data_used: {
          niche,
          brand_tone: profile.brand_tone,
          content_goals: profile.content_goals,
          has_origin_story: !!profile.origin_story,
          has_trigger_word: !!profile.manychat_trigger_word,
        },
        prediction_run_id: predictionRunId,
        vps_score: vpsScore,
        status: 'draft',
        creation_method: 'quick-win',
      })
      .select('id')
      .single();

    if (saveError) {
      console.error('[GenerateScript] Save error:', saveError.message);
    }

    return NextResponse.json({
      id: savedScript?.id || null,
      hook,
      body,
      cta,
      full_script: fullScript,
      hook_type: hookType,
      vps_score: vpsScore,
      vps_tier: vpsTier
        ? { label: vpsTier.label, colorClass: vpsTier.colorClass, gradient: vpsTier.gradient }
        : null,
      prediction_run_id: predictionRunId,
      strengths,
      template: {
        id: template.video_id,
        title: template.title,
        creator: template.creator_username,
      },
    });
  } catch (e: any) {
    console.error('[GenerateScript] Fatal error:', e);
    return NextResponse.json(
      { error: e.message || 'Script generation failed' },
      { status: 500 }
    );
  }
}
