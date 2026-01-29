// =====================================================
// Apify TikTok Webhook Ingestion Function
// =====================================================
// Handles Apify webhook payloads, fetches dataset items,
// enriches with OpenAI Whisper transcripts (if needed),
// and stores in scraped_videos table for DPS analysis.
//
// Author: Trendzo Data Engineering
// Date: 2025-10-12
// =====================================================

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// =====================================================
// Type Definitions
// =====================================================

interface ApifyWebhookPayload {
  userId?: string;
  createdAt?: string;
  eventType?: string;
  eventData?: {
    actorId?: string;
    actorTaskId?: string;
    actorRunId?: string;
    data?: any;
  };
  resource?: {
    defaultDatasetId?: string;
    defaultDatasetUrl?: string;
  };
}

interface ApifyTikTokItem {
  id: string;
  webVideoUrl?: string;
  videoUrl?: string;
  text?: string;
  desc?: string;
  createTime?: number; // Unix timestamp (seconds)
  createTimeISO?: string;
  videoDuration?: number; // seconds
  
  authorMeta?: {
    id?: string;
    name?: string;
    nickName?: string;
    verified?: boolean;
    signature?: string;
    avatar?: string;
    fans?: number;
    following?: number;
  };
  
  stats?: {
    diggCount?: number;
    shareCount?: number;
    commentCount?: number;
    playCount?: number;
  };
  
  musicMeta?: {
    musicId?: string;
    musicName?: string;
    musicAuthor?: string;
    musicOriginal?: boolean;
  };
  
  hashtags?: Array<{ id?: string; name?: string; title?: string }>;
  mentions?: string[];
  
  covers?: {
    default?: string;
    origin?: string;
    dynamic?: string;
  };
  
  subtitles?: Array<{
    lang?: string;
    language?: string;
    text?: string;
    url?: string;
  }>;
}

interface ScrapedVideoRow {
  video_id: string;
  scraping_job_id?: string | null;
  title?: string | null;
  description?: string | null;
  url: string;
  platform: string;
  tiktok_id: string;
  creator_id?: string | null;
  creator_username?: string | null;
  creator_nickname?: string | null;
  creator_followers_count?: number;
  creator_verified?: boolean;
  views_count?: number;
  likes_count?: number;
  shares_count?: number;
  comments_count?: number;
  duration_seconds?: number;
  video_url?: string | null;
  thumbnail_url?: string | null;
  caption?: string | null;
  hashtags?: string[];
  mentions?: string[];
  music_id?: string | null;
  music_name?: string | null;
  music_author?: string | null;
  music_is_original?: boolean;
  upload_timestamp?: string | null;
  created_at_utc?: string | null;
  subtitles?: any;
  transcript_text?: string | null;
  raw_scraping_data?: any;
  needs_processing?: boolean;
  processing_priority?: number;
}

// =====================================================
// Environment Variables
// =====================================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('PROJECT_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');
const APIFY_TOKEN = Deno.env.get('APIFY_TOKEN') || Deno.env.get('APIFY_API_TOKEN');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// =====================================================
// Helper Functions
// =====================================================

/**
 * Fetch dataset items from Apify API
 */
async function fetchApifyDataset(datasetUrl: string, apifyToken?: string): Promise<ApifyTikTokItem[]> {
  try {
    console.log('📥 Fetching Apify dataset:', datasetUrl);
    
    const url = new URL(datasetUrl);
    if (apifyToken) {
      url.searchParams.set('token', apifyToken);
    }
    
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Apify dataset fetch failed: ${response.status} ${response.statusText}`);
    }
    
    const items = await response.json();
    console.log(`✅ Fetched ${Array.isArray(items) ? items.length : 0} items from Apify dataset`);
    
    return Array.isArray(items) ? items : [];
    
  } catch (error) {
    console.error('❌ Failed to fetch Apify dataset:', error);
    throw error;
  }
}

/**
 * Extract transcript from subtitles array
 */
function extractTranscript(subtitles?: Array<any>): string | null {
  if (!subtitles || !Array.isArray(subtitles) || subtitles.length === 0) {
    return null;
  }
  
  // Try to find English subtitles first
  const englishSub = subtitles.find(s => 
    (s.lang === 'en' || s.language === 'en' || s.lang === 'eng' || s.language === 'eng')
  );
  
  if (englishSub?.text) {
    return englishSub.text;
  }
  
  // Fall back to first available subtitle
  const firstSub = subtitles[0];
  return firstSub?.text || null;
}

/**
 * Generate transcript using OpenAI Whisper
 */
async function generateWhisperTranscript(videoUrl: string, openaiKey: string): Promise<string | null> {
  try {
    console.log('🎤 Generating Whisper transcript for:', videoUrl);
    
    // Step 1: Download video file
    console.log('📥 Downloading video file...');
    const videoResponse = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!videoResponse.ok) {
      throw new Error(`Video download failed: ${videoResponse.status}`);
    }
    
    const videoBlob = await videoResponse.blob();
    const videoSize = videoBlob.size / (1024 * 1024); // MB
    console.log(`✅ Downloaded video: ${videoSize.toFixed(2)} MB`);
    
    // Step 2: Prepare file for OpenAI (send as audio/mp4 format)
    // OpenAI Whisper accepts video files but prefers audio MIME types
    const audioBlob = new Blob([videoBlob], { type: 'audio/mp4' });
    
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.mp4');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'text');
    formData.append('language', 'en'); // Optional: can remove to auto-detect
    
    // Step 3: Call OpenAI Whisper API
    console.log('🔊 Calling OpenAI Whisper API...');
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: formData,
    });
    
    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      throw new Error(`Whisper API failed: ${whisperResponse.status} - ${errorText}`);
    }
    
    const transcript = await whisperResponse.text();
    console.log(`✅ Transcript generated: ${transcript.substring(0, 100)}...`);
    
    return transcript || null;
    
  } catch (error: any) {
    console.error('❌ Whisper transcript generation failed:', error?.message || error);
    return null;
  }
}

/**
 * Map Apify TikTok item to scraped_videos schema
 */
function mapApifyItemToRow(item: ApifyTikTokItem): ScrapedVideoRow {
  // Extract hashtags
  const hashtags = item.hashtags?.map(h => h.name || h.title || '').filter(Boolean) || [];
  
  // Parse caption/text
  const caption = item.text || item.desc || '';
  
  // Determine upload timestamp
  let uploadTimestamp: string | null = null;
  let createdAtUtc: string | null = null;
  
  if (item.createTimeISO) {
    uploadTimestamp = item.createTimeISO;
    createdAtUtc = item.createTimeISO;
  } else if (item.createTime) {
    const date = new Date(item.createTime * 1000);
    uploadTimestamp = date.toISOString();
    createdAtUtc = date.toISOString();
  }
  
  // Choose best thumbnail
  const thumbnailUrl = item.covers?.origin || item.covers?.default || item.covers?.dynamic || null;
  
  // Extract transcript from subtitles
  const transcriptText = extractTranscript(item.subtitles);
  
  // Build URL
  const url = item.webVideoUrl || item.videoUrl || `https://www.tiktok.com/@_/video/${item.id}`;
  
  return {
    video_id: item.id,
    tiktok_id: item.id,
    url,
    platform: 'tiktok',
    title: caption.substring(0, 500) || null,
    description: caption || null,
    caption,
    
    // Creator info
    creator_id: item.authorMeta?.id || null,
    creator_username: item.authorMeta?.name || null,
    creator_nickname: item.authorMeta?.nickName || null,
    creator_followers_count: item.authorMeta?.fans || 0,
    creator_verified: item.authorMeta?.verified || false,
    
    // Metrics (check root level first, then stats object)
    views_count: (item as any).playCount || (item as any).viewCount || item.stats?.playCount || (item as any).views || 0,
    likes_count: (item as any).diggCount || (item as any).likeCount || item.stats?.diggCount || (item as any).likes || 0,
    comments_count: (item as any).commentCount || item.stats?.commentCount || (item as any).comments || 0,
    shares_count: (item as any).shareCount || item.stats?.shareCount || (item as any).shares || 0,
    
    // Video details
    duration_seconds: item.videoDuration || undefined,
    video_url: item.videoUrl || item.webVideoUrl || null,
    thumbnail_url: thumbnailUrl,
    
    // Content metadata
    hashtags,
    mentions: item.mentions || [],
    
    // Music/Sound
    music_id: item.musicMeta?.musicId || null,
    music_name: item.musicMeta?.musicName || null,
    music_author: item.musicMeta?.musicAuthor || null,
    music_is_original: item.musicMeta?.musicOriginal || false,
    
    // Timestamps
    upload_timestamp: uploadTimestamp,
    created_at_utc: createdAtUtc,
    
    // Transcript
    subtitles: item.subtitles ? JSON.parse(JSON.stringify(item.subtitles)) : null,
    transcript_text: transcriptText,
    
    // Raw data for debugging
    raw_scraping_data: JSON.parse(JSON.stringify(item)),
    
    // Processing flags
    needs_processing: true,
    processing_priority: 1,
  };
}

/**
 * Upsert video rows to scraped_videos table
 */
async function upsertVideos(
  supabase: any,
  videos: ScrapedVideoRow[],
  openaiKey?: string
): Promise<{ inserted: number; updated: number; errors: number; transcribed: number }> {
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  let transcribed = 0;
  
  for (const video of videos) {
    try {
      // Check if video already exists
      const { data: existing } = await supabase
        .from('scraped_videos')
        .select('video_id, transcript_text')
        .eq('video_id', video.video_id)
        .single();
      
      // Generate Whisper transcript if needed
      let transcriptText = video.transcript_text;
      
      if (!transcriptText && video.video_url && openaiKey) {
        console.log(`🎤 Generating Whisper transcript for ${video.video_id}...`);
        const whisperTranscript = await generateWhisperTranscript(video.video_url, openaiKey);
        if (whisperTranscript) {
          transcriptText = whisperTranscript;
          transcribed++;
        }
      }
      
      if (existing) {
        // Update existing record (preserve transcript if already exists)
        const { error } = await supabase
          .from('scraped_videos')
          .update({
            ...video,
            transcript_text: existing.transcript_text || transcriptText,
            updated_at: new Date().toISOString(),
          })
          .eq('video_id', video.video_id);
        
        if (error) {
          console.error(`❌ Update failed for ${video.video_id}:`, error);
          errors++;
        } else {
          updated++;
        }
      } else {
        // Insert new record with transcript
        const { error } = await supabase
          .from('scraped_videos')
          .insert({
            ...video,
            transcript_text: transcriptText,
          });
        
        if (error) {
          console.error(`❌ Insert failed for ${video.video_id}:`, error);
          errors++;
        } else {
          inserted++;
        }
      }
    } catch (error) {
      console.error(`❌ Upsert failed for ${video.video_id}:`, error);
      errors++;
    }
  }
  
  return { inserted, updated, errors, transcribed };
}

// =====================================================
// Main Handler
// =====================================================

serve(async (req) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Validate environment variables
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase environment variables');
    return new Response(
      JSON.stringify({ error: 'Missing Supabase configuration' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Create Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  
  try {
    // Parse webhook payload
    const payload = await req.json() as ApifyWebhookPayload;
    console.log('📥 Received Apify webhook:', {
      eventType: payload.eventType,
      actorRunId: payload.eventData?.actorRunId,
      datasetId: payload.resource?.defaultDatasetId,
    });
    
    // Validate payload structure
    if (!payload.resource?.defaultDatasetUrl && !payload.resource?.defaultDatasetId) {
      return new Response(
        JSON.stringify({ error: 'Missing dataset URL or ID in webhook payload' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Build dataset URL if only ID provided
    let datasetUrl = payload.resource.defaultDatasetUrl;
    if (!datasetUrl && payload.resource.defaultDatasetId) {
      datasetUrl = `https://api.apify.com/v2/datasets/${payload.resource.defaultDatasetId}/items?clean=1&format=json`;
    }
    
    if (!datasetUrl) {
      return new Response(
        JSON.stringify({ error: 'Could not determine dataset URL' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch dataset items from Apify
    const items = await fetchApifyDataset(datasetUrl, APIFY_TOKEN);
    
    if (items.length === 0) {
      console.log('⚠️  No items in dataset');
      return new Response(
        JSON.stringify({ ok: true, message: 'No items to process', processed: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Map Apify items to scraped_videos schema
    const videos = items.map(item => mapApifyItemToRow(item));
    
    console.log(`🔄 Processing ${videos.length} videos...`);
    
    // Upsert to database (with optional Whisper transcription)
    const result = await upsertVideos(supabase, videos, OPENAI_API_KEY);
    
    console.log(`✅ Processing complete:`, result);
    
    // Return success response
    return new Response(
      JSON.stringify({
        ok: true,
        processed: videos.length,
        inserted: result.inserted,
        updated: result.updated,
        errors: result.errors,
        transcribed: result.transcribed,
        whisperEnabled: !!OPENAI_API_KEY,
        datasetUrl,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('❌ Function error:', error);
    
    return new Response(
      JSON.stringify({
        error: error?.message || 'Internal server error',
        stack: error?.stack,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
