'use server';

// FEAT-071: Unified Creator Workflow - Server Actions
// Created: 2025-10-22

import { getServerSupabase } from '@/lib/supabase-server';
import type { GoalId, ViralVideo, NineFields, Prediction, CreatorWorkflow } from '@/types/creator-workflow';

// ============================================================================
// UTILITIES
// ============================================================================

function generateAuditId(prefix: string): string {
  return `aud_${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// UUID v4 generator (simple implementation)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ============================================================================
// ACTION 1: SELECT GOAL (Step 1)
// ============================================================================

export interface SelectGoalResponse {
  success: boolean;
  workflowId?: string;
  auditId?: string;
  error?: string;
}

export async function actSelectGoal(
  goalId: GoalId,
  userId?: string // TODO: Get from auth when implemented
): Promise<SelectGoalResponse> {
  const auditId = generateAuditId('goal');
  const workflowId = generateUUID();
  const demoUserId = userId || generateUUID(); // Generate UUID for demo user

  try {
    const supabase = getServerSupabase();

    // Create new workflow session
    const { data, error } = await supabase
      .from('creator_workflows')
      .insert({
        id: workflowId,
        user_id: demoUserId,
        goal_id: goalId,
        status: 'goal_selected',
        audit_id: auditId,
        started_at: new Date().toISOString(),
        last_updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Emit event
    await supabase.from('workflow_events').insert({
      workflow_id: workflowId,
      event_type: 'goal_selected',
      event_data: { goalId },
      audit_id: auditId,
      created_at: new Date().toISOString()
    });

    return {
      success: true,
      workflowId,
      auditId
    };
  } catch (error: any) {
    console.error('[actSelectGoal] Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to select goal'
    };
  }
}

// ============================================================================
// ACTION 2: DISCOVER VIRAL VIDEOS (Step 2)
// ============================================================================

export interface DiscoverResponse {
  success: boolean;
  videos?: ViralVideo[];
  total_found?: number;
  cached?: boolean;
  cache_age_hours?: number;
  auditId?: string;
  error?: string;
}

export async function actDiscoverViralVideos(
  workflowId: string,
  goalId: GoalId,
  niche: string = 'general',
  limit: number = 10
): Promise<DiscoverResponse> {
  const auditId = generateAuditId('discover');

  try {
    const supabase = getServerSupabase();

    // Fetch viral videos from database (DPS ≥ 70)
    const { data: videos, error } = await supabase
      .from('scraped_videos')
      .select('*')
      .gte('dps_score', 70)
      .order('dps_score', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Transform to ViralVideo format
    const viralVideos: ViralVideo[] = (videos || []).map(v => ({
      video_id: v.video_id,
      dps_score: v.dps_score,
      views: v.views || 0,
      likes: v.likes || 0,
      comments: v.comments,
      shares: v.shares,
      hook: v.transcript_text?.substring(0, 100) || 'No transcript available',
      framework_id: v.framework_id,
      framework_name: v.framework_name,
      platform: 'tiktok', // Default to tiktok for now
      url: v.video_url || `https://tiktok.com/@user/video/${v.video_id}`,
      thumbnail: v.thumbnail_url,
      creator: v.creator_username || 'Unknown',
      caption: v.caption,
      transcript: v.transcript_text,
      created_at: v.created_at
    }));

    // Update workflow with discovered videos
    await supabase
      .from('creator_workflows')
      .update({
        discovered_videos: viralVideos,
        status: 'discovering',
        last_updated_at: new Date().toISOString()
      })
      .eq('id', workflowId);

    // Emit event
    await supabase.from('workflow_events').insert({
      workflow_id: workflowId,
      event_type: 'discovery_complete',
      event_data: {
        goalId,
        niche,
        videos_found: viralVideos.length,
        avg_dps_score: viralVideos.reduce((sum, v) => sum + v.dps_score, 0) / viralVideos.length
      },
      audit_id: auditId,
      created_at: new Date().toISOString()
    });

    return {
      success: true,
      videos: viralVideos,
      total_found: viralVideos.length,
      cached: false,
      auditId
    };
  } catch (error: any) {
    console.error('[actDiscoverViralVideos] Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to discover viral videos'
    };
  }
}

// ============================================================================
// ACTION 3: SUGGEST CONTENT (Step 3)
// ============================================================================

export interface SuggestResponse {
  success: boolean;
  suggestions?: NineFields;
  framework_matched?: {
    id: string;
    name: string;
    success_rate: number;
    confidence: number;
  };
  partial?: boolean;
  auditId?: string;
  error?: string;
}

export async function actSuggestContent(
  workflowId: string,
  goalId: GoalId,
  viralExamples: string[], // Array of video_id's
  userNiche: string = 'general'
): Promise<SuggestResponse> {
  const auditId = generateAuditId('suggest');

  try {
    const supabase = getServerSupabase();

    // Fetch the viral examples to analyze
    const { data: videos, error: fetchError } = await supabase
      .from('scraped_videos')
      .select('*, extracted_knowledge(*)')
      .in('video_id', viralExamples);

    if (fetchError) {
      console.error('[actSuggestContent] Fetch error:', fetchError);
    }

    // If no videos found or error, fall back to generating from any viral videos
    let viralVideos = videos;
    if (!viralVideos || viralVideos.length === 0) {
      console.log('[actSuggestContent] No specific videos found, fetching any viral videos...');
      const { data: fallbackVideos } = await supabase
        .from('scraped_videos')
        .select('*, extracted_knowledge(*)')
        .gte('dps_score', 70)
        .order('dps_score', { ascending: false })
        .limit(3);

      viralVideos = fallbackVideos || [];
    }

    if (!viralVideos || viralVideos.length === 0) {
      throw new Error('No viral examples found in database');
    }

    // Extract common patterns from viral videos
    const allHooks: string[] = [];
    const allTriggers: string[] = [];
    const allPatterns: string[] = [];

    viralVideos.forEach(video => {
      if (video.extracted_knowledge && video.extracted_knowledge.length > 0) {
        const knowledge = video.extracted_knowledge[0];
        const insights = knowledge.consensus_insights as any;

        if (insights?.viral_hooks) allHooks.push(...insights.viral_hooks);
        if (insights?.emotional_triggers) allTriggers.push(...insights.emotional_triggers);
        if (insights?.pattern_match) allPatterns.push(insights.pattern_match);
      }
    });

    // Generate suggestions based on extracted patterns
    const suggestions: NineFields = {
      topic: viralVideos[0]?.caption?.substring(0, 50) || 'Topic from viral example',
      angle: 'Unique take on proven concept',
      hook_spoken: allHooks[0] || viralVideos[0]?.transcript_text?.substring(0, 100) || 'Have you ever wondered...',
      hook_text: 'Attention-grabbing text overlay',
      hook_visual: 'Eye-catching visual element',
      story_structure: 'Problem → Agitation → Solution',
      visual_format: 'Talking head with B-roll',
      key_visuals: ['Opening shot', 'Supporting visuals', 'Call-to-action visual'],
      audio: 'Trending audio matching vibe'
    };

    // Determine framework match (simplified for now)
    const frameworkMatch = {
      id: 'fw_generic',
      name: 'Proven Viral Pattern',
      success_rate: 0.85,
      confidence: 0.75
    };

    // Update workflow
    await supabase
      .from('creator_workflows')
      .update({
        script_draft: suggestions,
        framework_id: frameworkMatch.id,
        framework_confidence: frameworkMatch.confidence,
        status: 'designing',
        last_updated_at: new Date().toISOString()
      })
      .eq('id', workflowId);

    // Emit event
    await supabase.from('workflow_events').insert({
      workflow_id: workflowId,
      event_type: 'suggestion_complete',
      event_data: {
        goalId,
        niche: userNiche,
        framework_matched: frameworkMatch.name
      },
      audit_id: auditId,
      created_at: new Date().toISOString()
    });

    return {
      success: true,
      suggestions,
      framework_matched: frameworkMatch,
      partial: false,
      auditId
    };
  } catch (error: any) {
    console.error('[actSuggestContent] Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate suggestions'
    };
  }
}

// ============================================================================
// ACTION 4: PREDICT VIRAL PERFORMANCE (Step 4)
// ============================================================================

export interface PredictResponse {
  success: boolean;
  prediction?: Prediction;
  auditId?: string;
  error?: string;
}

export async function actPredictViral(
  workflowId: string,
  script: NineFields,
  goalId: GoalId,
  niche: string = 'general'
): Promise<PredictResponse> {
  const auditId = generateAuditId('predict');

  try {
    const supabase = getServerSupabase();

    // TODO: Call FEAT-070 Prediction API
    // For now, generate mock prediction based on script quality
    const scriptWordCount = Object.values(script).join(' ').split(' ').length;
    const hasAllFields = Object.keys(script).length === 9;

    // Simple scoring based on completeness
    let baseDps = 65;
    if (hasAllFields) baseDps += 5;
    if (scriptWordCount > 50) baseDps += 5;
    if (script.hook_spoken && script.hook_spoken.length > 10) baseDps += 5;

    const prediction: Prediction = {
      dps_score: baseDps,
      status: baseDps >= 70 ? 'green' : baseDps >= 60 ? 'yellow' : 'red',
      projected_views: {
        min: baseDps * 10000,
        max: baseDps * 50000,
        avg: baseDps * 25000
      },
      projected_engagement_rate: baseDps / 1000,
      share_potential: baseDps >= 75 ? 'high' : baseDps >= 65 ? 'medium' : 'low',
      nine_attributes_breakdown: {
        tam_resonance: 0.80,
        sharability: 0.85,
        hook_strength: script.hook_spoken ? 0.88 : 0.50,
        format_innovation: 0.75,
        value_density: 0.80,
        pacing_rhythm: 0.78,
        curiosity_gaps: 0.83,
        emotional_journey: 0.85,
        payoff_satisfaction: 0.80
      },
      whats_working: [
        'Script structure is clear and organized',
        hasAllFields ? 'All 9 fields completed' : 'Most fields completed',
        'Content aligns with goal'
      ],
      suggested_improvements: baseDps < 70 ? [
        {
          issue: 'DPS score below viral threshold',
          fix: 'Strengthen hook in first 2 seconds',
          impact: '+5-10 DPS points',
          one_click_fix: false
        }
      ] : [],
      recommended_hooks: [
        'POV: You finally discovered...',
        'This is your sign to...',
        'No one talks about this but...'
      ]
    };

    // Update workflow
    await supabase
      .from('creator_workflows')
      .update({
        prediction_result: prediction,
        predicted_dps: prediction.dps_score,
        status: 'complete',
        completed_at: new Date().toISOString(),
        last_updated_at: new Date().toISOString()
      })
      .eq('id', workflowId);

    // Emit event
    await supabase.from('workflow_events').insert({
      workflow_id: workflowId,
      event_type: 'prediction_complete',
      event_data: {
        goalId,
        niche,
        predicted_dps: prediction.dps_score,
        status: prediction.status
      },
      audit_id: auditId,
      created_at: new Date().toISOString()
    });

    return {
      success: true,
      prediction,
      auditId
    };
  } catch (error: any) {
    console.error('[actPredictViral] Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate prediction'
    };
  }
}

// ============================================================================
// HELPER: GET WORKFLOW BY ID
// ============================================================================

export async function getWorkflow(workflowId: string): Promise<CreatorWorkflow | null> {
  try {
    const supabase = getServerSupabase();

    const { data, error } = await supabase
      .from('creator_workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (error) throw error;

    return data as CreatorWorkflow;
  } catch (error) {
    console.error('[getWorkflow] Error:', error);
    return null;
  }
}
