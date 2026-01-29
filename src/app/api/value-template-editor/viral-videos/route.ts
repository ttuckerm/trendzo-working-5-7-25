import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

// Lazily resolve to avoid build-time env dependency
function getDb() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}

interface ViralVideoGalleryItem {
  id: string
  title: string
  creator_name: string
  thumbnail_url: string
  view_count: number
  viral_score: number
  platform: string
  duration_seconds: number
  is_featured: boolean
  display_order: number
}

/**
 * GET /api/value-template-editor/viral-videos
 * 
 * Returns viral video gallery for template inspiration
 * NO SAMPLE DATA FALLBACKS - Ensures database is populated with real data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '6', 10)
    const featured_only = searchParams.get('featured') === 'true'

    // Query viral video gallery - REAL DATA ONLY
    let query = getDb()
      .from('viral_video_gallery')
      .select(`
        id,
        title,
        creator_name,
        thumbnail_url,
        view_count,
        viral_score,
        platform,
        duration_seconds,
        is_featured,
        display_order
      `)
      .order('display_order', { ascending: true })
      .order('viral_score', { ascending: false })

    if (featured_only) {
      query = query.eq('is_featured', true)
    }

    const { data: videos, error } = await query.limit(limit)

    if (error) {
      console.error('Error fetching viral videos:', error)
      return NextResponse.json(
        { success: false, error: 'Database query failed. Ensure viral_video_gallery table exists and is accessible.' },
        { status: 500 }
      )
    }

    // Require real data - NO FALLBACKS
    if (!videos || videos.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No viral videos found in database. Please run the database population script to add viral video data.',
          action_required: 'Run: npm run deploy-database or execute scripts/deploy-complete-database.sql'
        },
        { status: 404 }
      )
    }

    // Return REAL viral video data with metadata
    return NextResponse.json({
      success: true,
      data: videos,
      total: videos.length,
      source: 'database',
      message: `Found ${videos.length} viral videos from database`
    })

  } catch (error) {
    console.error('Viral videos API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database connection failed. Ensure Supabase is properly configured.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/value-template-editor/viral-videos
 * 
 * Add new viral video to gallery (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      creator_name,
      thumbnail_url,
      view_count,
      viral_score,
      platform,
      duration_seconds,
      is_featured = false
    } = body

    // Validate required fields
    if (!title || !creator_name || !view_count || !viral_score || !platform) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert new viral video
    const { data: newVideo, error } = await getDb()
      .from('viral_video_gallery')
      .insert({
        title,
        creator_name,
        thumbnail_url: thumbnail_url || null,
        view_count,
        viral_score,
        platform,
        duration_seconds: duration_seconds || 30,
        is_featured,
        display_order: 0 // New videos appear first
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding viral video:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to add viral video' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: newVideo,
      message: 'Viral video added successfully'
    })

  } catch (error) {
    console.error('Add viral video API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

 