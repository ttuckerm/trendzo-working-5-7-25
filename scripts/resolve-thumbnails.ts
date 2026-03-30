/**
 * Resolve TikTok oembed URLs to actual thumbnail images
 * 
 * Run with: npx tsx scripts/resolve-thumbnails.ts
 * 
 * This script:
 * 1. Finds videos with oembed placeholder URLs
 * 2. Fetches the oembed JSON to get actual thumbnail URLs
 * 3. Updates the database with real thumbnail URLs
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface OembedResponse {
  thumbnail_url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
  title?: string;
  author_name?: string;
}

async function fetchOembed(url: string): Promise<OembedResponse | null> {
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch oembed for ${url}: ${response.status}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.warn(`Error fetching oembed for ${url}:`, error);
    return null;
  }
}

async function resolveThumbnails(limit: number = 100) {
  console.log('='.repeat(60));
  console.log('TIKTOK THUMBNAIL RESOLVER');
  console.log('='.repeat(60));
  
  // Find videos with oembed placeholder URLs
  const { data: videos, error } = await supabase
    .from('scraped_videos')
    .select('id, video_id, url, thumbnail_url')
    .like('thumbnail_url', 'https://www.tiktok.com/oembed%')
    .limit(limit);
  
  if (error) {
    console.error('Error fetching videos:', error);
    return;
  }
  
  console.log(`Found ${videos?.length || 0} videos with placeholder thumbnails`);
  
  let resolved = 0;
  let failed = 0;
  
  for (const video of videos || []) {
    console.log(`Processing ${video.video_id}...`);
    
    const oembed = await fetchOembed(video.url);
    
    if (oembed?.thumbnail_url) {
      const { error: updateError } = await supabase
        .from('scraped_videos')
        .update({ thumbnail_url: oembed.thumbnail_url })
        .eq('id', video.id);
      
      if (updateError) {
        console.warn(`  Failed to update: ${updateError.message}`);
        failed++;
      } else {
        console.log(`  ✓ Resolved: ${oembed.thumbnail_url.substring(0, 60)}...`);
        resolved++;
      }
    } else {
      console.log(`  ✗ No thumbnail in oembed response`);
      failed++;
    }
    
    // Rate limiting - TikTok may block rapid requests
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Resolved: ${resolved}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${videos?.length || 0}`);
}

// Run with optional limit argument
const limit = parseInt(process.argv[2] || '100');
resolveThumbnails(limit).catch(console.error);














