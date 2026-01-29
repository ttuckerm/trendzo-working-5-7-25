import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

interface Video {
  video_id: string
  url: string
  creator_username: string | null
}

interface TranscriptionResult {
  video_id: string
  success: boolean
  transcript?: string
  error?: string
}

/**
 * Get direct download URL from TikTok using tikwm.com API
 */
async function getTikTokDownloadURL(tiktokURL: string): Promise<string> {
  try {
    // Use tikwm.com API to get direct download URL
    const apiURL = `https://www.tikwm.com/api/?url=${encodeURIComponent(tiktokURL)}&hd=1`

    const response = await fetch(apiURL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`tikwm API returned ${response.status}`)
    }

    const data = await response.json()

    if (data.code !== 0 || !data.data) {
      throw new Error(`tikwm API error: ${data.msg || 'Unknown error'}`)
    }

    // Return HD video URL or fallback to regular
    return data.data.hdplay || data.data.play
  } catch (error: any) {
    throw new Error(`Failed to get download URL: ${error.message}`)
  }
}

/**
 * Download video audio from TikTok URL and transcribe using OpenAI Whisper
 * This bypasses the DNS issue by running in Next.js server context
 */
async function transcribeVideo(video: Video): Promise<TranscriptionResult> {
  try {
    console.log(`[Transcribe] Processing ${video.video_id} from @${video.creator_username}`)

    // Step 1: Get direct download URL
    console.log(`[Transcribe] Getting download URL...`)
    const downloadURL = await getTikTokDownloadURL(video.url)
    console.log(`[Transcribe] Download URL obtained`)

    // Step 2: Download video
    console.log(`[Transcribe] Downloading video...`)
    const response = await fetch(downloadURL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.tikwm.com/'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status}`)
    }

    // Get video data as buffer
    const videoBuffer = await response.arrayBuffer()
    const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' })
    const videoFile = new File([videoBlob], `${video.video_id}.mp4`, { type: 'video/mp4' })

    console.log(`[Transcribe] Downloaded ${(videoBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`)

    // Step 3: Transcribe using OpenAI Whisper
    console.log(`[Transcribe] Sending to Whisper API...`)
    const transcription = await openai.audio.transcriptions.create({
      file: videoFile,
      model: 'whisper-1',
      response_format: 'text'
    })

    const transcript = typeof transcription === 'string' ? transcription : transcription.toString()

    if (!transcript || transcript.length < 10) {
      throw new Error('Transcript too short or empty')
    }

    // Step 4: Update database
    await supabase
      .from('scraped_videos')
      .update({ transcript_text: transcript })
      .eq('video_id', video.video_id)

    console.log(`[Transcribe] ✅ Success for ${video.video_id}: ${transcript.substring(0, 100)}...`)

    return {
      video_id: video.video_id,
      success: true,
      transcript
    }

  } catch (error: any) {
    console.error(`[Transcribe] ❌ Failed for ${video.video_id}:`, error.message)
    return {
      video_id: video.video_id,
      success: false,
      error: error.message
    }
  }
}

/**
 * GET /api/admin/transcribe?limit=10
 * Returns videos that need transcription
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const { data: videos, error } = await supabase
      .from('scraped_videos')
      .select('video_id, url, creator_username')
      .is('transcript_text', null)
      .not('url', 'is', null)
      .order('scraped_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({
      videos,
      count: videos?.length || 0
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/transcribe
 * Body: { limit?: number, batch?: boolean }
 * Transcribes videos without transcripts
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const limit = body.limit || 10
    const batch = body.batch || false

    // Get videos without transcripts
    const { data: videos, error } = await supabase
      .from('scraped_videos')
      .select('video_id, url, creator_username')
      .is('transcript_text', null)
      .not('url', 'is', null)
      .order('scraped_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    if (!videos || videos.length === 0) {
      return NextResponse.json({
        message: 'No videos need transcription',
        results: []
      })
    }

    console.log(`[Transcribe API] Processing ${videos.length} videos...`)

    const results: TranscriptionResult[] = []

    if (batch) {
      // Process all in parallel (faster but may hit rate limits)
      results.push(...await Promise.all(videos.map(transcribeVideo)))
    } else {
      // Process sequentially (slower but safer)
      for (const video of videos) {
        const result = await transcribeVideo(video)
        results.push(result)

        // Rate limiting: wait 2 seconds between requests
        if (videos.indexOf(video) < videos.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    console.log(`[Transcribe API] Complete: ${successCount} success, ${failCount} failed`)

    return NextResponse.json({
      message: `Transcribed ${successCount}/${videos.length} videos`,
      successCount,
      failCount,
      results
    })

  } catch (error: any) {
    console.error('[Transcribe API] Error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
