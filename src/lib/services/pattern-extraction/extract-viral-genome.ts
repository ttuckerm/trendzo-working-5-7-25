/**
 * Viral Genome Extraction Service
 * 
 * Extracts the "DNA" of viral videos - the specific patterns that make them successful.
 * Uses GPT-4o-mini to analyze transcripts and extract:
 * - 7 Idea Legos (topic, angle, hooks, structure, visuals, audio)
 * - Nine Attributes Framework (TAM, sharability, hook strength, etc.)
 * - Viral patterns detected
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export interface VideoForGenomeExtraction {
  video_id: string;
  title?: string;
  transcript_text: string;
  niche: string;
  views_count?: number;
  likes_count?: number;
  dps_score?: number;
}

export interface ViralGenome {
  source_video_id: string;
  niche: string;
  
  // 7 Idea Legos
  topic: string;
  angle: string;
  hook_spoken: string;
  hook_text: string;
  hook_visual: string;
  story_structure: string;
  visual_format: string;
  key_visuals: string[];
  audio_description: string;
  
  // Nine Attributes
  tam_resonance: number;
  sharability: number;
  hook_strength: number;
  format_innovation: number;
  value_density: number;
  pacing_rhythm: number;
  curiosity_gaps: number;
  emotional_journey: number;
  clear_payoff: number;
  
  // Metadata
  dps_score?: number;
  viral_patterns: string[];
  extraction_model: string;
}

/**
 * Extract viral genome from a single video
 */
export async function extractViralGenome(video: VideoForGenomeExtraction): Promise<ViralGenome> {
  const prompt = `Analyze this viral TikTok video and extract its "viral genome" - the specific patterns that make it successful.

VIDEO DATA:
Title: ${video.title || 'Unknown'}
Niche: ${video.niche}
Views: ${(video.views_count || 0).toLocaleString()}
Likes: ${(video.likes_count || 0).toLocaleString()}
Transcript: ${video.transcript_text}

Extract the following in JSON format:

{
  "topic": "One sentence description of what the video is about",
  "angle": "The unique premise, take, or perspective that makes this interesting",
  "hook_spoken": "The exact words spoken in first 3 seconds (from transcript)",
  "hook_text": "Any on-screen text in first 3 seconds (infer from transcript context)",
  "hook_visual": "Description of what's likely visually shown in first 3 seconds",
  "story_structure": "breakdown|tutorial|list|story|comparison|challenge|transformation|myth-bust|case-study|other",
  "visual_format": "talking_head|green_screen|pov|voiceover_broll|demo|slideshow|screencast|faceless|other",
  "key_visuals": ["List", "of", "key", "visual", "elements", "mentioned or implied"],
  "audio_description": "Music style, sound effects, voice tone description",
  
  "tam_resonance": 1-10,
  "sharability": 1-10,
  "hook_strength": 1-10,
  "format_innovation": 1-10,
  "value_density": 1-10,
  "pacing_rhythm": 1-10,
  "curiosity_gaps": 1-10,
  "emotional_journey": 1-10,
  "clear_payoff": 1-10,
  
  "viral_patterns": ["List of specific viral patterns detected, e.g., 'Curiosity Gap', 'Before/After', 'Controversial Take', 'Step-by-Step', 'Big Promise', 'Social Proof', 'Time Urgency', 'Relatable Problem', 'Insider Secret']"
}

IMPORTANT SCORING GUIDELINES:
- 8-10: Exceptional execution of this attribute
- 6-7: Good, solid execution
- 4-5: Average, room for improvement
- 1-3: Weak or missing

Be specific and analytical. Base scores on the ACTUAL content, not assumptions.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3, // Lower temperature for more consistent extractions
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  const genome = JSON.parse(content);
  
  return {
    source_video_id: video.video_id,
    niche: video.niche,
    dps_score: video.dps_score,
    extraction_model: 'gpt-4o-mini',
    ...genome,
  };
}

/**
 * Save viral genome to database
 * Note: Uses the existing viral_genomes table schema with pattern_dna JSONB field
 */
export async function saveViralGenome(genome: ViralGenome): Promise<void> {
  // Store all genome data in the pattern_dna JSONB field
  const patternDna = {
    source_video_id: genome.source_video_id,
    topic: genome.topic,
    angle: genome.angle,
    hook_spoken: genome.hook_spoken,
    hook_text: genome.hook_text,
    hook_visual: genome.hook_visual,
    story_structure: genome.story_structure,
    visual_format: genome.visual_format,
    key_visuals: genome.key_visuals,
    audio_description: genome.audio_description,
    nine_attributes: {
      tam_resonance: genome.tam_resonance,
      sharability: genome.sharability,
      hook_strength: genome.hook_strength,
      format_innovation: genome.format_innovation,
      value_density: genome.value_density,
      pacing_rhythm: genome.pacing_rhythm,
      curiosity_gaps: genome.curiosity_gaps,
      emotional_journey: genome.emotional_journey,
      clear_payoff: genome.clear_payoff,
    },
    viral_patterns: genome.viral_patterns,
    extraction_model: genome.extraction_model,
  };

  // Calculate average attribute score for success_rate
  const avgScore = (
    genome.tam_resonance + genome.sharability + genome.hook_strength +
    genome.format_innovation + genome.value_density + genome.pacing_rhythm +
    genome.curiosity_gaps + genome.emotional_journey + genome.clear_payoff
  ) / 9 / 10; // Normalize to 0-1

  const { error } = await supabase
    .from('viral_genomes')
    .upsert({
      niche: genome.niche,
      pattern_type: genome.story_structure || 'general',
      pattern_dna: patternDna,
      success_rate: avgScore,
      example_videos: [genome.source_video_id],
      dps_average: genome.dps_score || 0,
      times_used: 1,
      last_seen: new Date().toISOString(),
    }, {
      onConflict: 'niche,pattern_type', // Use composite key for deduplication
      ignoreDuplicates: false,
    });

  if (error) {
    // Try insert instead of upsert if conflict handling fails
    const { error: insertError } = await supabase
      .from('viral_genomes')
      .insert({
        niche: genome.niche,
        pattern_type: `${genome.story_structure || 'general'}_${genome.source_video_id.slice(-8)}`,
        pattern_dna: patternDna,
        success_rate: avgScore,
        example_videos: [genome.source_video_id],
        dps_average: genome.dps_score || 0,
        times_used: 1,
        last_seen: new Date().toISOString(),
      });

    if (insertError) {
      throw new Error(`Failed to save genome: ${insertError.message}`);
    }
  }
}

/**
 * Extract and save genome for a video
 */
export async function extractAndSaveViralGenome(video: VideoForGenomeExtraction): Promise<ViralGenome> {
  const genome = await extractViralGenome(video);
  await saveViralGenome(genome);
  return genome;
}

/**
 * Get videos ready for genome extraction
 * Note: scraped_videos doesn't have a 'niche' column, so we derive it from hashtags/description
 */
export async function getVideosForGenomeExtraction(
  limit: number = 100,
  minDpsScore: number = 0,
  niche?: string
): Promise<VideoForGenomeExtraction[]> {
  let query = supabase
    .from('scraped_videos')
    .select('video_id, title, transcript_text, description, hashtags, views_count, likes_count, dps_score')
    .not('transcript_text', 'is', null)
    .order('dps_score', { ascending: false, nullsFirst: false })
    .limit(limit * 2); // Get more to account for filtering

  // If minDpsScore > 0, filter by it
  if (minDpsScore > 0) {
    query = query.gte('dps_score', minDpsScore);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch videos: ${error.message}`);
  }

  // Filter and derive niche
  let videos = (data || [])
    .filter(v => v.transcript_text && v.transcript_text.length >= 50)
    .map(v => ({
      video_id: v.video_id,
      title: v.title,
      transcript_text: v.transcript_text,
      niche: deriveNicheFromContent(v.description, v.hashtags),
      views_count: v.views_count,
      likes_count: v.likes_count,
      dps_score: v.dps_score,
    }));

  // Filter by niche if specified
  if (niche) {
    videos = videos.filter(v => v.niche.toLowerCase() === niche.toLowerCase());
  }

  return videos.slice(0, limit);
}

/**
 * Derive niche from video content
 */
function deriveNicheFromContent(description?: string | null, hashtags?: string[] | null): string {
  const content = `${description || ''} ${(hashtags || []).join(' ')}`.toLowerCase();
  
  const nicheKeywords: Record<string, string[]> = {
    'personal-finance': ['money', 'invest', 'finance', 'savings', 'debt', 'budget', 'wealth', 'income', 'rich', 'stock', 'crypto', 'bitcoin'],
    'fitness': ['workout', 'fitness', 'gym', 'exercise', 'health', 'weight', 'muscle', 'training', 'protein', 'cardio'],
    'business': ['business', 'entrepreneur', 'startup', 'hustle', 'sales', 'marketing', 'ecommerce', 'dropship'],
    'productivity': ['productivity', 'focus', 'habit', 'routine', 'morning', 'discipline', 'time management'],
    'tech': ['tech', 'software', 'code', 'coding', 'programming', 'ai', 'app', 'developer'],
    'lifestyle': ['lifestyle', 'travel', 'fashion', 'food', 'cooking', 'home', 'diy'],
  };

  for (const [niche, keywords] of Object.entries(nicheKeywords)) {
    if (keywords.some(kw => content.includes(kw))) {
      return niche;
    }
  }

  return 'general';
}

/**
 * Get videos that don't have genomes yet
 */
export async function getVideosWithoutGenomes(
  limit: number = 100,
  minDpsScore: number = 0
): Promise<VideoForGenomeExtraction[]> {
  // Get existing genome video IDs
  const { data: existingGenomes } = await supabase
    .from('viral_genomes')
    .select('source_video_id');

  const existingIds = new Set((existingGenomes || []).map(g => g.source_video_id));

  // Build query
  let query = supabase
    .from('scraped_videos')
    .select('video_id, title, transcript_text, description, hashtags, views_count, likes_count, dps_score')
    .not('transcript_text', 'is', null)
    .order('dps_score', { ascending: false, nullsFirst: false })
    .limit(limit * 3); // Get more to account for filtering

  // If minDpsScore > 0, filter by it
  if (minDpsScore > 0) {
    query = query.gte('dps_score', minDpsScore);
  }

  const { data: videos, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch videos: ${error.message}`);
  }

  return (videos || [])
    .filter(v => !existingIds.has(v.video_id) && v.transcript_text && v.transcript_text.length >= 50)
    .map(v => ({
      video_id: v.video_id,
      title: v.title,
      transcript_text: v.transcript_text,
      niche: deriveNicheFromContent(v.description, v.hashtags),
      views_count: v.views_count,
      likes_count: v.likes_count,
      dps_score: v.dps_score,
    }))
    .slice(0, limit);
}


