/**
 * Creator Onboarding API
 *
 * POST /api/creator/onboard
 *
 * Scrapes creator's TikTok channel, analyzes all videos, and builds baseline profile.
 * This enables personalized predictions for the creator.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { analyzeVideoImmediately } from '@/lib/services/immediate-video-analyzer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

interface OnboardRequest {
  tiktok_username: string;
  scrape_limit?: number; // Max videos to scrape (default: 50)
}

export async function POST(request: NextRequest) {
  try {
    const body: OnboardRequest = await request.json();

    if (!body.tiktok_username) {
      return NextResponse.json(
        { success: false, error: 'tiktok_username is required' },
        { status: 400 }
      );
    }

    const username = body.tiktok_username.replace('@', '');
    const scrapeLimit = body.scrape_limit || 50;

    console.log(`[Creator Onboard] Starting onboarding for @${username}`);

    // Step 1: Check if creator profile already exists
    const { data: existingProfile } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('tiktok_username', username)
      .single();

    let profileId: string;

    if (existingProfile) {
      profileId = existingProfile.id;
      console.log(`[Creator Onboard] Existing profile found: ${profileId}`);

      // Update status to scraping
      await supabase
        .from('creator_profiles')
        .update({ analysis_status: 'scraping' })
        .eq('id', profileId);
    } else {
      // Create new profile
      const { data: newProfile, error: createError } = await supabase
        .from('creator_profiles')
        .insert({
          tiktok_username: username,
          channel_url: `https://www.tiktok.com/@${username}`,
          analysis_status: 'scraping'
        })
        .select()
        .single();

      if (createError || !newProfile) {
        return NextResponse.json(
          { success: false, error: `Failed to create profile: ${createError?.message}` },
          { status: 500 }
        );
      }

      profileId = newProfile.id;
      console.log(`[Creator Onboard] Created new profile: ${profileId}`);
    }

    // Step 2: Trigger Apify scrape of creator's channel
    console.log(`[Creator Onboard] Triggering Apify scrape for @${username}...`);

    const actorId = process.env.TIKTOK_SCRAPER_ACTOR_ID || 'GdWCkxBtKWOsKjdch';

    const apifyResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.APIFY_API_TOKEN}`
      },
      body: JSON.stringify({
        postURLs: [],
        hashtags: [],
        profiles: [username],
        searchQueries: [],
        searchSection: '',
        resultsPerPage: scrapeLimit,
        excludePinnedPosts: false,
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
        shouldDownloadSubtitles: false,
        shouldDownloadSlideshowImages: false
      })
    });

    if (!apifyResponse.ok) {
      throw new Error(`Apify API error: ${apifyResponse.statusText}`);
    }

    const apifyData = await apifyResponse.json();
    const runId = apifyData.data.id;

    console.log(`[Creator Onboard] Apify run started: ${runId}`);

    // Step 3: Poll Apify for completion (with timeout)
    console.log(`[Creator Onboard] Polling for scrape completion...`);

    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (5 second intervals)
    let scrapeData: any = null;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await fetch(
        `https://api.apify.com/v2/acts/${actorId}/runs/${runId}`,
        {
          headers: { 'Authorization': `Bearer ${process.env.APIFY_API_TOKEN}` }
        }
      );

      const statusData = await statusResponse.json();
      const status = statusData.data.status;

      console.log(`[Creator Onboard] Apify status: ${status} (attempt ${attempts + 1}/${maxAttempts})`);

      if (status === 'SUCCEEDED') {
        // Fetch results
        const resultsResponse = await fetch(
          `https://api.apify.com/v2/actor-runs/${runId}/dataset/items`,
          {
            headers: { 'Authorization': `Bearer ${process.env.APIFY_API_TOKEN}` }
          }
        );

        scrapeData = await resultsResponse.json();
        break;
      } else if (status === 'FAILED' || status === 'ABORTED') {
        throw new Error(`Apify scrape failed with status: ${status}`);
      }

      attempts++;
    }

    if (!scrapeData || scrapeData.length === 0) {
      throw new Error('Apify scrape timed out or returned no data');
    }

    console.log(`[Creator Onboard] Scraped ${scrapeData.length} videos`);

    // Step 4: Process scraped videos and store in creator_video_history
    await supabase
      .from('creator_profiles')
      .update({ analysis_status: 'analyzing' })
      .eq('id', profileId);

    let videosProcessed = 0;
    let ffmpegAnalyzed = 0;

    for (const video of scrapeData) {
      try {
        // Calculate DPS from scraped metrics
        const views = video.playCount || 0;
        const likes = video.diggCount || 0;
        const comments = video.commentCount || 0;
        const shares = video.shareCount || 0;
        const saves = video.collectCount || 0;

        if (views === 0) continue; // Skip videos with no views

        const engagementRate = (likes + comments + shares + saves) / views;

        // DPS calculation (same as in learning-loop)
        let actualDPS = 0;
        if (engagementRate >= 0.20) {
          actualDPS = 80 + (engagementRate - 0.20) * 100;
        } else if (engagementRate >= 0.10) {
          actualDPS = 60 + (engagementRate - 0.10) * 200;
        } else if (engagementRate >= 0.05) {
          actualDPS = 40 + (engagementRate - 0.05) * 400;
        } else if (engagementRate >= 0.03) {
          actualDPS = 30 + (engagementRate - 0.03) * 500;
        } else {
          actualDPS = engagementRate * 1000;
        }

        actualDPS = Math.max(0, Math.min(100, actualDPS));

        const tiktokUrl = video.webVideoUrl || `https://www.tiktok.com/@${username}/video/${video.id}`;

        // Insert into creator_video_history
        await supabase
          .from('creator_video_history')
          .insert({
            creator_profile_id: profileId,
            tiktok_video_id: video.id,
            tiktok_url: tiktokUrl,
            actual_views: views,
            actual_likes: likes,
            actual_comments: comments,
            actual_shares: shares,
            actual_saves: saves,
            actual_dps: actualDPS,
            actual_engagement_rate: engagementRate,
            duration_seconds: video.videoMeta?.duration,
            posted_at: video.createTimeISO
          })
          .onConflict('creator_profile_id, tiktok_video_id')
          .ignore();

        // =====================================================
        // IMMEDIATE FFmpeg ANALYSIS (while CDN URL is fresh!)
        // =====================================================
        try {
          const ffmpegResult = await analyzeVideoImmediately(tiktokUrl, video.id, video.text || '');
          if (ffmpegResult.success) {
            ffmpegAnalyzed++;
            console.log(`[Creator Onboard] ✅ FFmpeg ${video.id}: ${ffmpegResult.analysis?.height}p`);
          }
        } catch (ffmpegError: any) {
          console.warn(`[Creator Onboard] FFmpeg ${video.id}: ${ffmpegError.message}`);
          // Continue - FFmpeg failure shouldn't stop onboarding
        }

        videosProcessed++;
      } catch (videoError: any) {
        console.warn(`[Creator Onboard] Failed to process video ${video.id}:`, videoError.message);
      }
    }

    console.log(`[Creator Onboard] Processed ${videosProcessed} videos`);

    // Step 5: Calculate baseline using database function
    console.log(`[Creator Onboard] Calculating baseline metrics...`);

    await supabase.rpc('calculate_creator_baseline', {
      p_creator_profile_id: profileId
    });

    // Step 6: Update status to complete
    await supabase
      .from('creator_profiles')
      .update({ analysis_status: 'complete', last_scraped_at: new Date().toISOString() })
      .eq('id', profileId);

    // Fetch final profile
    const { data: finalProfile } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    console.log(`[Creator Onboard] Onboarding complete for @${username}`);

    return NextResponse.json({
      success: true,
      profile_id: profileId,
      tiktok_username: username,
      videos_analyzed: videosProcessed,
      ffmpeg_analyzed: ffmpegAnalyzed,
      baseline_dps: finalProfile?.baseline_dps,
      avg_views: finalProfile?.avg_views,
      dps_percentiles: finalProfile?.dps_percentiles,
      apify_run_id: runId
    });

  } catch (error: any) {
    console.error('[Creator Onboard] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint - Check creator profile status
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json(
      { success: false, error: 'username parameter required' },
      { status: 400 }
    );
  }

  const { data: profile, error } = await supabase
    .from('creator_profiles')
    .select('*')
    .eq('tiktok_username', username.replace('@', ''))
    .single();

  if (error || !profile) {
    return NextResponse.json({
      success: false,
      exists: false,
      message: 'Creator profile not found'
    });
  }

  return NextResponse.json({
    success: true,
    exists: true,
    profile: {
      id: profile.id,
      tiktok_username: profile.tiktok_username,
      total_videos: profile.total_videos,
      baseline_dps: profile.baseline_dps,
      avg_views: profile.avg_views,
      dps_percentiles: profile.dps_percentiles,
      analysis_status: profile.analysis_status,
      last_scraped_at: profile.last_scraped_at
    }
  });
}
