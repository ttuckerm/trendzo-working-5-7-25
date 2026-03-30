/**
 * Direct scrape of @sidehustlereview - bypassing the API endpoint
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { db: { schema: 'public' }, auth: { persistSession: false } }
);

async function main() {
  const username = 'sidehustlereview';
  const scrapeLimit = 50;

  console.log('=== SCRAPING @sidehustlereview DIRECTLY ===\n');

  // Step 1: Create profile
  const { data: profile, error: profileError } = await supabase
    .from('creator_profiles')
    .upsert({
      tiktok_username: username,
      channel_url: `https://www.tiktok.com/@${username}`,
      analysis_status: 'scraping'
    }, {
      onConflict: 'tiktok_username'
    })
    .select()
    .single();

  if (profileError || !profile) {
    console.error('❌ Failed to create profile:', profileError);
    return;
  }

  console.log('✅ Creator profile ready:', profile.id);

  // Step 2: Trigger Apify scrape
  const actorId = process.env.TIKTOK_SCRAPER_ACTOR_ID || 'GdWCkxBtKWOsKjdch';
  const token = process.env.APIFY_API_TOKEN;

  console.log('\nTriggering Apify scrape...');
  console.log('Actor ID:', actorId);
  console.log('Token:', token?.substring(0, 20) + '...\n');

  const apifyResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
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
    const error = await apifyResponse.json();
    console.error('❌ Apify failed:', error);
    return;
  }

  const apifyData = await apifyResponse.json();
  const runId = apifyData.data.id;

  console.log('✅ Scrape started! Run ID:', runId);
  console.log('\nPolling for completion...\n');

  // Step 3: Poll for completion
  let attempts = 0;
  const maxAttempts = 60;
  let scrapeData: any = null;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const statusResponse = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs/${runId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    const statusData = await statusResponse.json();
    const status = statusData.data.status;

    console.log(`[${new Date().toLocaleTimeString()}] Status: ${status} (attempt ${attempts + 1}/${maxAttempts})`);

    if (status === 'SUCCEEDED') {
      const resultsResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}/dataset/items`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      scrapeData = await resultsResponse.json();
      break;
    } else if (status === 'FAILED' || status === 'ABORTED') {
      console.error('\n❌ Scrape failed with status:', status);
      return;
    }

    attempts++;
  }

  if (!scrapeData || scrapeData.length === 0) {
    console.error('\n❌ No data returned');
    return;
  }

  console.log(`\n✅ Scraped ${scrapeData.length} videos!\n`);

  // Step 4: Process videos
  let videosProcessed = 0;

  for (const video of scrapeData) {
    const views = video.playCount || 0;
    const likes = video.diggCount || 0;
    const comments = video.commentCount || 0;
    const shares = video.shareCount || 0;
    const saves = video.collectCount || 0;

    if (views === 0) continue;

    const engagementRate = (likes + comments + shares + saves) / views;

    let dps = 0;
    if (engagementRate >= 0.20) {
      dps = 80 + (engagementRate - 0.20) * 100;
    } else if (engagementRate >= 0.10) {
      dps = 60 + (engagementRate - 0.10) * 200;
    } else if (engagementRate >= 0.05) {
      dps = 40 + (engagementRate - 0.05) * 400;
    } else if (engagementRate >= 0.03) {
      dps = 30 + (engagementRate - 0.03) * 500;
    } else {
      dps = engagementRate * 1000;
    }

    dps = Math.max(0, Math.min(100, dps));

    const { error: insertError } = await supabase
      .from('creator_video_history')
      .insert({
        creator_profile_id: profile.id,
        tiktok_video_id: video.id,
        tiktok_url: video.webVideoUrl || `https://www.tiktok.com/@${username}/video/${video.id}`,
        actual_views: views,
        actual_likes: likes,
        actual_comments: comments,
        actual_shares: shares,
        actual_saves: saves,
        actual_dps: dps,
        actual_engagement_rate: engagementRate,
        duration_seconds: video.videoMeta?.duration,
        posted_at: video.createTimeISO
      });

    // Ignore duplicate errors
    if (insertError && !insertError.message.includes('duplicate')) {
      console.warn('Insert error for video', video.id, ':', insertError.message);
    }

    videosProcessed++;
  }

  console.log(`Processed ${videosProcessed} videos\n`);

  // Step 5: Calculate baseline
  console.log('Calculating baseline...');

  await supabase.rpc('calculate_creator_baseline', {
    p_creator_profile_id: profile.id
  });

  await supabase
    .from('creator_profiles')
    .update({
      analysis_status: 'complete',
      last_scraped_at: new Date().toISOString()
    })
    .eq('id', profile.id);

  // Step 6: Show results
  const { data: finalProfile } = await supabase
    .from('creator_profiles')
    .select('*')
    .eq('id', profile.id)
    .single();

  console.log('\n' + '='.repeat(80));
  console.log('✅ BASELINE ESTABLISHED FOR @sidehustlereview\n');
  console.log('Total Videos:', finalProfile?.total_videos);
  console.log('Average Views:', Math.round(finalProfile?.avg_views || 0).toLocaleString());
  console.log('Average Likes:', Math.round(finalProfile?.avg_likes || 0).toLocaleString());
  console.log('Baseline DPS:', finalProfile?.baseline_dps?.toFixed(1));
  console.log('\nDPS Percentiles:');
  console.log('  25th:', finalProfile?.dps_percentiles?.p25?.toFixed(1));
  console.log('  50th:', finalProfile?.dps_percentiles?.p50?.toFixed(1));
  console.log('  75th:', finalProfile?.dps_percentiles?.p75?.toFixed(1));
  console.log('  90th:', finalProfile?.dps_percentiles?.p90?.toFixed(1));
  console.log('='.repeat(80));
}

main().catch(console.error);
