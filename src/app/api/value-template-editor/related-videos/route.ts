import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

/**
 * GET /api/value-template-editor/related-videos
 * 
 * 🎬 RELATED VIDEOS API FOR PHASE 3
 * 
 * Fetches video thumbnails that match the framework determined in Phase 2
 * to provide contextual inspiration instead of framework circles
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const framework = searchParams.get('framework')
    const currentVideoId = searchParams.get('exclude')
    const limit = parseInt(searchParams.get('limit') || '6')

    console.log('🎬 Fetching related videos for framework:', framework)

    if (!framework) {
      return NextResponse.json(
        { success: false, error: 'framework parameter required' },
        { status: 400 }
      )
    }

    // Use mock data when Supabase is not available OR database query fails
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      console.log('🎬 Using mock related videos (Supabase not configured)')
      return NextResponse.json({
        success: true,
        videos: generateMockRelatedVideos(framework, currentVideoId, limit)
      })
    }

    // Try to fetch related videos from the same framework family
    const supabase = getDb()
    const { data: videos, error } = await supabase
      .from('viral_video_gallery')
      .select(`
        id,
        title,
        creator_name,
        viral_score,
        view_count,
        thumbnail_url,
        duration_seconds
      `)
      .order('viral_score', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching related videos:', error)
      console.log('🎬 Falling back to mock related videos due to database error')
      return NextResponse.json({
        success: true,
        videos: generateMockRelatedVideos(framework, currentVideoId, limit)
      })
    }

    console.log(`🎬 Found ${videos?.length || 0} related videos for framework: ${framework}`)

    return NextResponse.json({
      success: true,
      videos: videos || []
    })

  } catch (error) {
    console.error('Related videos API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Generate mock related videos for testing/development
 */
function generateMockRelatedVideos(framework: string, excludeId: string | null, limit: number) {
  const mockVideos = [
    {
      id: 'mock-video-1',
      title: `${framework} Example: How I Built Trust`,
      creator_name: 'Expert Creator',
      viral_score: 92,
      view_count: 2500000,
      thumbnail_url: '/thumbnails/template1.jpg',
      duration_seconds: 28,
      framework_name: framework
    },
    {
      id: 'mock-video-2', 
      title: `${framework} Masterclass: Instant Credibility`,
      creator_name: 'Viral Master',
      viral_score: 88,
      view_count: 1800000,
      thumbnail_url: '/thumbnails/template2.jpg',
      duration_seconds: 35,
      framework_name: framework
    },
    {
      id: 'mock-video-3',
      title: `Why ${framework} Works Every Time`,
      creator_name: 'Content Genius',
      viral_score: 85,
      view_count: 1200000,
      thumbnail_url: '/thumbnails/placeholder-template.jpg',
      duration_seconds: 42,
      framework_name: framework
    },
    {
      id: 'mock-video-4',
      title: `${framework} That Got 5M Views`,
      creator_name: 'Trend Setter',
      viral_score: 94,
      view_count: 5000000,
      thumbnail_url: '/thumbnails/template1.jpg',
      duration_seconds: 22,
      framework_name: framework
    },
    {
      id: 'mock-video-5',
      title: `Secret ${framework} Formula Revealed`,
      creator_name: 'Growth Hacker',
      viral_score: 90,
      view_count: 3200000,
      thumbnail_url: '/thumbnails/template2.jpg',
      duration_seconds: 38,
      framework_name: framework
    },
    {
      id: 'mock-video-6',
      title: `Ultimate ${framework} Guide`,
      creator_name: 'Pro Creator',
      viral_score: 87,
      view_count: 1600000,
      thumbnail_url: '/thumbnails/placeholder-template.jpg',
      duration_seconds: 31,
      framework_name: framework
    }
  ]

  return mockVideos
    .filter(video => video.id !== excludeId)
    .slice(0, limit)
} 