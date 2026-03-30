import { NextRequest, NextResponse } from 'next/server';
import { apifyService } from '@/lib/services/apifyService';

// Comprehensive mock data for development
const MOCK_VIDEOS = [
  {
    id: "7156513930261518599",
    text: "Let me show you how to make the most delicious pasta 🍝 #foodtiktok #cooking",
    createTime: 1650123456,
    authorMeta: {
      id: "user12345",
      name: "Chef Daniela",
      nickname: "chef_daniela",
      verified: true
    },
    videoMeta: {
      height: 1920,
      width: 1080,
      duration: 45
    },
    hashtags: ["foodtiktok", "cooking", "pasta"],
    stats: {
      commentCount: 1293,
      diggCount: 24831,
      playCount: 358942,
      shareCount: 3892
    },
    videoUrl: "https://example.com/video1.mp4",
    webVideoUrl: "https://www.tiktok.com/@chef_daniela/video/7156513930261518599"
  },
  {
    id: "7152387641938273541",
    text: "Morning routine that changed my life ✨ #productivity #morningroutine",
    createTime: 1649876543,
    authorMeta: {
      id: "user67890",
      name: "Productivity Guru",
      nickname: "productivity_guru",
      verified: false
    },
    videoMeta: {
      height: 1920,
      width: 1080,
      duration: 60
    },
    hashtags: ["productivity", "morningroutine", "selfcare"],
    stats: {
      commentCount: 845,
      diggCount: 15672,
      playCount: 245891,
      shareCount: 2103
    },
    videoUrl: "https://example.com/video2.mp4",
    webVideoUrl: "https://www.tiktok.com/@productivity_guru/video/7152387641938273541"
  },
  {
    id: "7158902736451928334",
    text: "How I edit my photos for Instagram 📸 #phototips #editing",
    createTime: 1650234567,
    authorMeta: {
      id: "user24680",
      name: "Photo Editor Pro",
      nickname: "photo_editor_pro",
      verified: true
    },
    videoMeta: {
      height: 1920,
      width: 1080,
      duration: 52
    },
    hashtags: ["phototips", "editing", "photography"],
    stats: {
      commentCount: 765,
      diggCount: 18954,
      playCount: 289076,
      shareCount: 3214
    },
    videoUrl: "https://example.com/video3.mp4",
    webVideoUrl: "https://www.tiktok.com/@photo_editor_pro/video/7158902736451928334"
  },
  {
    id: "7149823762172631298",
    text: "Fitness challenge: 30 days transformation 💪 #fitness #workout",
    createTime: 1649012345,
    authorMeta: {
      id: "user13579",
      name: "Fitness Coach",
      nickname: "fitness_coach",
      verified: true
    },
    videoMeta: {
      height: 1920,
      width: 1080,
      duration: 58
    },
    hashtags: ["fitness", "workout", "transformation"],
    stats: {
      commentCount: 2431,
      diggCount: 52198,
      playCount: 890123,
      shareCount: 15243
    },
    videoUrl: "https://example.com/video4.mp4",
    webVideoUrl: "https://www.tiktok.com/@fitness_coach/video/7149823762172631298"
  },
  {
    id: "7163452917384521473",
    text: "DIY home decor ideas on a budget! #homedecor #diy",
    createTime: 1650345678,
    authorMeta: {
      id: "user02468",
      name: "DIY Maven",
      nickname: "diy_maven",
      verified: false
    },
    videoMeta: {
      height: 1920,
      width: 1080,
      duration: 65
    },
    hashtags: ["homedecor", "diy", "budget"],
    stats: {
      commentCount: 1823,
      diggCount: 45321,
      playCount: 684972,
      shareCount: 12543
    },
    videoUrl: "https://example.com/video5.mp4",
    webVideoUrl: "https://www.tiktok.com/@diy_maven/video/7163452917384521473"
  }
];

/**
 * API endpoint to fetch videos from Apify for testing
 * Always returns data in development mode, either real or mock
 */
export async function POST(request: NextRequest) {
  console.log('Fetch videos API called');
  
  // For development, use mock data by default
  const isDev = process.env.NODE_ENV === 'development';
  
  try {
    // Get requested video count
    const body = await request.json().catch(() => ({}));
    const maxItems = body.maxItems || 5;
    const limit = Math.min(Math.max(1, Number(maxItems)), 20);
    
    // Check if we can use real data
    const hasApifyToken = !!process.env.APIFY_API_TOKEN;
    
    if (hasApifyToken) {
      console.log(`Attempting to fetch ${limit} real videos from Apify`);
      try {
        // Try to get real data from Apify
        const videos = await apifyService.scrapeTrending({ maxItems: limit });
        
        console.log(`Successfully fetched ${videos.length} videos from Apify`);
        return NextResponse.json({
          status: 'success',
          videos,
          source: 'apify'
        });
      } catch (apifyError) {
        console.error('Error accessing Apify:', apifyError);
        
        // In development, fall back to mock data
        if (isDev) {
          console.log('Using mock data due to Apify error');
          return NextResponse.json({
            status: 'success',
            videos: MOCK_VIDEOS.slice(0, limit),
            source: 'mock',
            note: 'Using mock data due to Apify error'
          });
        } else {
          throw apifyError; // In production, propagate the error
        }
      }
    } else {
      // No Apify token, use mock data
      console.log(`No Apify token, using ${limit} mock videos`);
      return NextResponse.json({
        status: 'success',
        videos: MOCK_VIDEOS.slice(0, limit),
        source: 'mock',
        note: 'Using mock data because APIFY_API_TOKEN is not set'
      });
    }
  } catch (error) {
    console.error('Error in fetch-videos API:', error);
    
    // In development, always return mock data on any error
    if (isDev) {
      console.log('Returning mock data due to error');
      return NextResponse.json({
        status: 'success',
        videos: MOCK_VIDEOS,
        source: 'mock',
        note: 'Using mock data due to error'
      });
    }
    
    // In production, return proper error
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to fetch videos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 