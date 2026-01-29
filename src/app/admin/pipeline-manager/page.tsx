'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Video {
  video_id: string
  url: string
  creator_username: string | null
  creator_followers_count: number | null
  views_count: number | null
  likes_count: number | null
  caption: string | null
  transcript_text: string | null
  dps_score: number | null
  dps_classification: string | null
  scraped_at: string
  thumbnail_url: string | null
}

interface Pattern {
  id: string
  pattern_type: string
  pattern_description: string
  frequency_count: number
  success_rate: number
  avg_dps_score: number
  total_videos_analyzed: number
  viral_videos_count: number
}

interface Stats {
  total: number
  viral: number
  megaViral: number
  avgDpsScore: number
}

interface ExtractedKnowledge {
  id: string
  video_id: string
  consensus_insights: {
    viral_hooks?: string[]
    emotional_triggers?: string[]
    viral_coefficient_factors?: string[]
    pattern_match?: string
    confidence?: number
  }
  confidence_score: number
  created_at: string
}

interface TranscribeExtractProgress {
  phase: 'idle' | 'transcribing' | 'extracting' | 'complete' | 'error'
  transcriptionProgress: { current: number; total: number }
  extractionProgress: { current: number; total: number }
}

export default function ProvingGroundsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info' | 'loading'>('info')
  const [transcribing, setTranscribing] = useState(false)
  const [scrapingStatus, setScrapingStatus] = useState<string>('')
  const [runningFilter, setRunningFilter] = useState(false)

  // Viral breakdown modal state
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [videoPatterns, setVideoPatterns] = useState<Pattern[]>([])
  const [videoKnowledge, setVideoKnowledge] = useState<any>(null)
  const [modalLoading, setModalLoading] = useState(false)

  // View All Patterns modal state
  const [showAllPatterns, setShowAllPatterns] = useState(false)
  const [allPatterns, setAllPatterns] = useState<Pattern[]>([])

  // Pagination state
  const [videoOffset, setVideoOffset] = useState(0)
  const [hasMoreVideos, setHasMoreVideos] = useState(true)

  // Filter states
  const [selectedPattern, setSelectedPattern] = useState<string>('all')
  const [dpsRange, setDpsRange] = useState<string>('70-100')
  const [selectedCreator, setSelectedCreator] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('30')
  const [sortBy, setSortBy] = useState<string>('dps-desc')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [transcriptLimit, setTranscriptLimit] = useState(10)

  // Combined workflow state (UX-005 fix)
  const [combinedProgress, setCombinedProgress] = useState<TranscribeExtractProgress>({
    phase: 'idle',
    transcriptionProgress: { current: 0, total: 0 },
    extractionProgress: { current: 0, total: 0 }
  })
  const [extractedKnowledge, setExtractedKnowledge] = useState<ExtractedKnowledge[]>([])
  const [knowledgeExpanded, setKnowledgeExpanded] = useState(false)

  // Video count state (UX-003 fix)
  const [totalVideoCount, setTotalVideoCount] = useState<number | null>(null)
  const [loadingAll, setLoadingAll] = useState(false)
  const [allVideosLoaded, setAllVideosLoaded] = useState(false)

  // Fetch stats (FEAT-002: DPS Calculator)
  const fetchStats = async () => {
    try {
      const { count: total } = await supabase
        .from('scraped_videos')
        .select('*', { count: 'exact', head: true })
        .not('dps_score', 'is', null)

      const { count: viral } = await supabase
        .from('scraped_videos')
        .select('*', { count: 'exact', head: true })
        .gte('dps_score', 70)

      const { count: megaViral } = await supabase
        .from('scraped_videos')
        .select('*', { count: 'exact', head: true })
        .gte('dps_score', 80)

      const { data: avgData } = await supabase
        .from('scraped_videos')
        .select('dps_score')
        .gte('dps_score', 70)

      const avgDpsScore = avgData && avgData.length > 0
        ? avgData.reduce((sum, v) => sum + (v.dps_score || 0), 0) / avgData.length
        : 0

      setStats({
        total: total || 0,
        viral: viral || 0,
        megaViral: megaViral || 0,
        avgDpsScore: Math.round(avgDpsScore)
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  // Fetch patterns (FEAT-003: Pattern Extraction)
  const fetchPatterns = async () => {
    try {
      const { data, error } = await supabase
        .from('viral_patterns')
        .select('*')
        .order('success_rate', { ascending: false })
        .limit(8)

      if (error) throw error
      setPatterns(data || [])
    } catch (error) {
      console.error('Failed to fetch patterns:', error)
    }
  }

  // Fetch viral videos (FEAT-001 + FEAT-002)
  const fetchVideos = async (append = false) => {
    setLoading(true)
    try {
      let query = supabase
        .from('scraped_videos')
        .select('video_id, url, creator_username, creator_followers_count, views_count, likes_count, caption, transcript_text, dps_score, dps_classification, scraped_at, thumbnail_url')
        .gte('dps_score', 70)
        .not('dps_score', 'is', null)

      // Apply DPS filter
      if (dpsRange === '80-100') {
        query = query.gte('dps_score', 80)
      } else if (dpsRange === '70-79') {
        query = query.gte('dps_score', 70).lt('dps_score', 80)
      }

      // Apply date filter
      if (dateRange !== 'all') {
        const daysAgo = new Date()
        daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange))
        query = query.gte('scraped_at', daysAgo.toISOString())
      }

      // Apply search
      if (searchQuery) {
        query = query.or(`caption.ilike.%${searchQuery}%,creator_username.ilike.%${searchQuery}%`)
      }

      // Apply sorting
      if (sortBy === 'dps-desc') {
        query = query.order('dps_score', { ascending: false })
      } else if (sortBy === 'views-desc') {
        query = query.order('views_count', { ascending: false })
      } else if (sortBy === 'date-desc') {
        query = query.order('scraped_at', { ascending: false })
      }

      const offset = append ? videoOffset : 0
      query = query.range(offset, offset + 11) // Get 12 videos

      const { data, error } = await query

      if (error) throw error

      if (append) {
        setVideos(prev => [...prev, ...(data || [])])
        setVideoOffset(offset + 12)
      } else {
        setVideos(data || [])
        setVideoOffset(12)
      }

      setHasMoreVideos(data && data.length === 12)
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Trigger transcription (FEAT-001: Scraper integration)
  const handleTranscribe = async () => {
    setTranscribing(true)
    setMessageType('loading')
    setMessage(`Starting transcription of ${transcriptLimit} videos...`)

    try {
      const response = await fetch('/api/admin/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: transcriptLimit, batch: false })
      })

      const data = await response.json()

      if (response.ok) {
        setMessageType('success')
        setMessage(`Successfully transcribed ${transcriptLimit} videos! Video cards now show transcripts. Go to Script Intelligence → Run Knowledge Extraction to analyze them.`)
        await fetchStats()
        await fetchVideos()
      } else {
        setMessageType('error')
        setMessage(data.error || 'Transcription failed')
      }
    } catch (error: any) {
      setMessageType('error')
      setMessage(error.message || 'Network error during transcription')
    } finally {
      setTranscribing(false)
      setTimeout(() => setMessage(''), 8000)
    }
  }

  // UX-005 FIX: Combined Transcribe & Extract Knowledge workflow
  const handleTranscribeAndExtract = async () => {
    setLoading(true)
    setCombinedProgress({
      phase: 'transcribing',
      transcriptionProgress: { current: 0, total: transcriptLimit },
      extractionProgress: { current: 0, total: 0 }
    })

    try {
      // STEP 1: Transcription (FEAT-001)
      setMessageType('loading')
      setMessage(`Starting transcription of ${transcriptLimit} videos...`)

      const transcribeResponse = await fetch('/api/admin/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: transcriptLimit, batch: false })
      })

      const transcribeData = await transcribeResponse.json()

      if (!transcribeResponse.ok) {
        throw new Error(transcribeData.error || 'Transcription failed')
      }

      // Update progress
      setCombinedProgress(prev => ({
        ...prev,
        phase: 'extracting',
        transcriptionProgress: { current: transcriptLimit, total: transcriptLimit }
      }))

      setMessageType('success')
      setMessage(`Transcribed ${transcriptLimit} videos! Now extracting knowledge using GPT-4 + Claude + Gemini...`)

      // Refresh videos to show transcripts
      await fetchVideos()

      // STEP 2: Knowledge Extraction (FEAT-060)
      // Note: This assumes you have a batch extract endpoint
      // If not, we'll need to extract from individual videos
      const { data: videosWithTranscripts } = await supabase
        .from('scraped_videos')
        .select('video_id')
        .not('transcript_text', 'is', null)
        .is('extracted_knowledge', null)
        .limit(transcriptLimit)

      if (videosWithTranscripts && videosWithTranscripts.length > 0) {
        setMessage(`Extracting knowledge from ${videosWithTranscripts.length} videos...`)

        // Extract knowledge for each video
        let successCount = 0
        for (const video of videosWithTranscripts) {
          try {
            const extractResponse = await fetch('/api/knowledge/extract', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ video_id: video.video_id })
            })

            if (extractResponse.ok) successCount++
          } catch (err) {
            console.error(`Failed to extract knowledge for ${video.video_id}`, err)
          }
        }

        // Fetch extracted knowledge to display
        const { data: knowledgeData } = await supabase
          .from('extracted_knowledge')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)

        setExtractedKnowledge(knowledgeData || [])
        setKnowledgeExpanded(true) // Auto-expand results

        // Calculate totals for success message
        const totalHooks = knowledgeData?.reduce((sum: number, item: any) =>
          sum + (item.consensus_insights?.viral_hooks?.length || 0), 0) || 0
        const totalTriggers = knowledgeData?.reduce((sum: number, item: any) =>
          sum + (item.consensus_insights?.emotional_triggers?.length || 0), 0) || 0

        setCombinedProgress({
          phase: 'complete',
          transcriptionProgress: { current: transcriptLimit, total: transcriptLimit },
          extractionProgress: { current: successCount, total: videosWithTranscripts.length }
        })

        setMessageType('success')
        setMessage(
          `Knowledge extraction complete! ${successCount} videos processed successfully. ` +
          `Found ${totalHooks} viral hooks and ${totalTriggers} emotional triggers. ` +
          `Results appear in the expanded "Extracted Knowledge" section below.`
        )
      } else {
        setMessageType('info')
        setMessage('No videos with transcripts available for knowledge extraction.')
      }

    } catch (error: any) {
      setCombinedProgress(prev => ({ ...prev, phase: 'error' }))
      setMessageType('error')
      setMessage(`Error: ${error.message}. If this problem continues, try running Transcribe and Extract Knowledge separately.`)
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(''), 10000)
    }
  }

  // Helper function to get button text for combined workflow
  const getTranscribeExtractButtonText = () => {
    switch (combinedProgress.phase) {
      case 'transcribing':
        return `Transcribing... (${combinedProgress.transcriptionProgress.current}/${combinedProgress.transcriptionProgress.total})`
      case 'extracting':
        return 'Extracting knowledge...'
      case 'complete':
        return '✓ Transcribe & Extract Knowledge'
      default:
        return '🧬 Transcribe & Extract Knowledge'
    }
  }

  // UX-003 FIX: Fetch total video count
  const fetchTotalCount = async () => {
    try {
      const { count } = await supabase
        .from('scraped_videos')
        .select('*', { count: 'exact', head: true })
        .gte('dps_score', 70)

      setTotalVideoCount(count || 0)
    } catch (error) {
      console.error('Error fetching video count:', error)
      setTotalVideoCount(null)
    }
  }

  // UX-003 FIX: Load all videos at once
  const loadAllVideos = async () => {
    if (loadingAll || allVideosLoaded) return

    setLoadingAll(true)
    setMessageType('loading')
    setMessage(`Loading all ${totalVideoCount || '...'} videos...`)

    try {
      const { data, error } = await supabase
        .from('scraped_videos')
        .select('*')
        .gte('dps_score', 70)
        .order('dps_score', { ascending: false })

      if (error) throw error

      setVideos(data || [])
      setAllVideosLoaded(true)
      setHasMoreVideos(false)
      setVideoOffset(data?.length || 0)

      setMessageType('success')
      setMessage(
        `Loaded all ${data?.length || 0} videos successfully! ` +
        `You can now scroll through the complete dataset.`
      )
    } catch (error: any) {
      setMessageType('error')
      setMessage(
        `Error loading all videos: ${error.message}. ` +
        `Try using "Load More" to load videos incrementally, or refresh the page.`
      )
    } finally {
      setLoadingAll(false)
      setTimeout(() => setMessage(''), 8000)
    }
  }

  // UX-003 FIX: Get current video count text
  const getVideoCountText = () => {
    if (totalVideoCount === null) return 'Loading count...'
    if (allVideosLoaded) return `Showing all ${videos.length} videos`
    return `Showing ${videos.length} of ${totalVideoCount} videos`
  }

  // Trigger viral filter (FEAT-002: DPS Calculator + FEAT-003: Pattern Extraction)
  const handleRunViralFilter = async () => {
    setRunningFilter(true)
    setMessageType('loading')
    setMessage('Running viral filter and pattern extraction...')

    try {
      const response = await fetch('/api/admin/run-viral-filter', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        setMessageType('success')
        setMessage(`Processed ${data.processed || 0} videos! Found ${data.viralCount || 0} viral + ${data.negativeCount || 0} negative samples. Check stats cards and patterns section below.`)
        await fetchStats()
        await fetchPatterns()
        await fetchVideos()
      } else {
        setMessageType('error')
        setMessage(data.error || data.details || 'Viral filter failed')
      }
    } catch (error: any) {
      setMessageType('error')
      setMessage(error.message || 'Network error running viral filter')
    } finally {
      setRunningFilter(false)
      setTimeout(() => setMessage(''), 8000)
    }
  }

  // Open viral breakdown modal (FEAT-003 + FEAT-060)
  const openViralBreakdown = async (video: Video) => {
    setSelectedVideo(video)
    setModalLoading(true)

    try {
      // Fetch patterns for this video
      const { data: patterns } = await supabase
        .from('viral_patterns')
        .select('*')
        .eq('niche', 'general') // You can filter by niche if available
        .limit(5)

      setVideoPatterns(patterns || [])

      // Fetch FEAT-060 knowledge extraction data
      const { data: knowledge } = await supabase
        .from('extracted_knowledge')
        .select('*')
        .eq('video_id', video.video_id)
        .single()

      setVideoKnowledge(knowledge)
    } catch (error) {
      console.error('Error loading breakdown:', error)
    } finally {
      setModalLoading(false)
    }
  }

  const closeViralBreakdown = () => {
    setSelectedVideo(null)
    setVideoPatterns([])
    setVideoKnowledge(null)
  }

  // Fetch all patterns for modal
  const fetchAllPatterns = async () => {
    try {
      const { data, error } = await supabase
        .from('viral_patterns')
        .select('*')
        .order('success_rate', { ascending: false })

      if (error) throw error
      setAllPatterns(data || [])
      setShowAllPatterns(true)
    } catch (error) {
      console.error('Failed to fetch all patterns:', error)
    }
  }

  // Trigger scraping
  const handleScrape = async () => {
    setMessageType('loading')
    setMessage('Triggering Apify scraper... This may take 1-2 minutes.')
    setScrapingStatus('running')

    try {
      const response = await fetch('/api/admin/run-apify-scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: ['viral content', 'trending'], limit: 50 })
      })

      const data = await response.json()

      if (response.ok) {
        setMessageType('success')
        setMessage(data.message || 'Scraper started successfully! Videos will appear shortly.')
        setScrapingStatus('success')
        // Poll for new videos
        const pollInterval = setInterval(async () => {
          await fetchStats()
          await fetchVideos()
        }, 3000)
        setTimeout(() => {
          clearInterval(pollInterval)
          setScrapingStatus('')
        }, 30000) // Stop polling after 30 seconds
      } else {
        setMessageType('error')
        setMessage(data.error || 'Scraping failed to start')
        setScrapingStatus('error')
      }
    } catch (error: any) {
      setMessageType('error')
      setMessage(error.message || 'Network error starting scraper')
      setScrapingStatus('error')
    } finally {
      setTimeout(() => {
        setMessage('')
        if (scrapingStatus !== 'running') setScrapingStatus('')
      }, 8000)
    }
  }

  // Initial load
  useEffect(() => {
    fetchStats()
    fetchPatterns()
    fetchVideos()
    fetchTotalCount() // UX-003 FIX: Fetch total video count on mount
  }, [])

  // Refetch videos when filters change
  useEffect(() => {
    fetchVideos()
  }, [dpsRange, dateRange, sortBy, searchQuery])

  return (
    <div className="min-h-screen bg-[#0F0A1E] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-[#0F0A1E] to-[#1a0f2e]">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#C084FC] to-[#E879F9] bg-clip-text text-transparent mb-2">
                The Proving Grounds
              </h1>
              <div className="flex items-center gap-4 text-gray-400 text-sm">
                <span>Last updated: {new Date().toLocaleString()}</span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                  Up to date
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleScrape}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 font-semibold transition-all shadow-lg shadow-blue-500/30"
              >
                📥 Run Scraper
              </button>
              <button
                onClick={handleTranscribe}
                disabled={transcribing}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 font-semibold transition-all shadow-lg shadow-green-500/30"
              >
                {transcribing ? '⏳ Transcribing...' : '🎤 Transcribe Videos'}
              </button>
              <button
                onClick={handleRunViralFilter}
                disabled={runningFilter}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 font-semibold transition-all shadow-lg shadow-purple-500/30"
              >
                {runningFilter ? '⏳ Processing...' : '🧬 Run Viral Filter'}
              </button>
              {/* UX-005 FIX: Combined Transcribe & Extract Knowledge Button */}
              <button
                onClick={handleTranscribeAndExtract}
                disabled={loading || combinedProgress.phase === 'transcribing' || combinedProgress.phase === 'extracting'}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 font-semibold transition-all shadow-lg shadow-purple-500/30"
              >
                {getTranscribeExtractButtonText()}
              </button>
            </div>
          </div>

          {/* Pipeline Actions Panel */}
          <div className="backdrop-blur-xl bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400 font-semibold">PIPELINE ACTIONS:</div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={transcriptLimit}
                    onChange={(e) => setTranscriptLimit(parseInt(e.target.value) || 10)}
                    min="1"
                    max="100"
                    className="w-20 px-3 py-1 rounded bg-black/50 border border-white/20 text-white text-center"
                    disabled={transcribing}
                  />
                  <span className="text-gray-400">videos to transcribe</span>
                </div>
                <div className="h-4 w-px bg-white/20"></div>
                <span className="text-gray-400">FEAT-001 → FEAT-002 → FEAT-003 pipeline</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Data Source Label */}
        <div className="mb-6 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-sm">
          <span className="text-purple-400 font-mono">📊 DATA SOURCE: FEAT-002 DPS Calculator → Stats from scraped_videos table</span>
        </div>

        {/* Hero Stats - FEAT-002 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Viral Videos Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div className="relative backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent mb-2">
                {stats?.viral || 0}
              </div>
              <div className="text-xl font-semibold mb-1">VIRAL VIDEOS DISCOVERED</div>
              <div className="text-sm text-gray-400">
                (out of {stats?.total || 0} analyzed = {stats?.total ? ((stats.viral / stats.total) * 100).toFixed(1) : 0}%)
              </div>
              <div className="text-xs text-purple-400 mt-2 font-mono">
                FEAT-002: COUNT WHERE dps_score ≥ 70
              </div>
            </div>
          </div>

          {/* Mega-Viral Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div className="relative backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="text-5xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent mb-2">
                {stats?.megaViral || 0}
              </div>
              <div className="text-xl font-semibold mb-1">MEGA-VIRAL</div>
              <div className="text-sm text-gray-400">(DPS 80-100)</div>
              <div className="text-xs text-purple-400 mt-2 font-mono">
                FEAT-002: COUNT WHERE dps_score ≥ 80
              </div>
            </div>
          </div>

          {/* Avg Score Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div className="relative backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                {stats?.avgDpsScore || 0}
              </div>
              <div className="text-xl font-semibold mb-1">AVG VIRAL SCORE</div>
              <div className="text-xs text-purple-400 mt-2 font-mono">
                FEAT-002: AVG(dps_score) WHERE ≥ 70
              </div>
              <button
                onClick={() => {
                  fetchStats()
                  fetchPatterns()
                  fetchVideos()
                }}
                className="mt-4 w-full py-2 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-sm font-medium transition-all"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Viral Patterns Section - FEAT-003 */}
        <div className="mb-12">
          <div className="mb-6 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-sm">
            <span className="text-purple-400 font-mono">🧬 DATA SOURCE: FEAT-003 Pattern Extraction → viral_patterns table grouped by pattern_type</span>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">🧬 Viral Patterns Detected</h2>
            <button
              onClick={fetchAllPatterns}
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              → View All Patterns ({patterns.length})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {patterns.slice(0, 4).map((pattern, idx) => {
              const icons = ['⚠️', '🛡️', '🔒', '💰']
              const gradients = [
                'from-amber-500 to-orange-500',
                'from-purple-500 to-blue-500',
                'from-blue-500 to-cyan-500',
                'from-yellow-500 to-orange-500'
              ]

              return (
                <div key={pattern.id} className="relative group cursor-pointer">
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradients[idx]}/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all`}></div>
                  <div className="relative backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-white/30 transition-all">
                    <div className="text-4xl mb-4">{icons[idx]}</div>
                    <h3 className="text-xl font-bold mb-2">{pattern.pattern_description || pattern.pattern_type}</h3>
                    <div className="text-lg font-semibold mb-1">
                      Found in {pattern.viral_videos_count} videos
                    </div>
                    <div className="text-sm text-gray-400 mb-2">
                      {Math.round(pattern.success_rate * 100)}% success rate
                    </div>
                    <div className="text-xs text-gray-500">
                      ({pattern.viral_videos_count} videos / {pattern.total_videos_analyzed} total with DPS ≥ 70)
                    </div>
                    <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="w-full py-2 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium">
                        View Examples
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* UX-005 FIX: Extracted Knowledge Section */}
        {extractedKnowledge.length > 0 && (
          <div className="mb-12">
            <div
              className="flex items-center justify-between mb-4 cursor-pointer"
              onClick={() => setKnowledgeExpanded(!knowledgeExpanded)}
            >
              <h2 className="text-3xl font-bold">🧠 Extracted Knowledge</h2>
              <button className="text-purple-400 hover:text-purple-300 transition-colors">
                {knowledgeExpanded ? '▼ Collapse' : '▶ Expand'}
              </button>
            </div>

            {knowledgeExpanded && (
              <>
                {/* Data Source Label */}
                <div className="mb-6 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-sm">
                  <span className="text-purple-400 font-mono">
                    🧠 DATA SOURCE: FEAT-060 Knowledge Extraction → extracted_knowledge table
                  </span>
                </div>

                {/* Knowledge Display */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">

                  {/* Viral Hooks */}
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-purple-400 mb-3">
                      Viral Hooks ({extractedKnowledge.reduce((sum, item) => sum + (item.consensus_insights?.viral_hooks?.length || 0), 0)} found)
                    </h3>
                    <div className="space-y-2">
                      {extractedKnowledge.slice(0, 3).map((item, idx) => (
                        item.consensus_insights?.viral_hooks?.slice(0, 3).map((hook, hookIdx) => (
                          <div key={`${idx}-${hookIdx}`} className="bg-white/5 rounded-lg p-3 border border-white/10">
                            <p className="text-gray-300">• {hook}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Confidence: {Math.round(item.confidence_score * 100)}%
                            </p>
                          </div>
                        ))
                      ))}
                    </div>
                  </div>

                  {/* Emotional Triggers */}
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-pink-400 mb-3">
                      Emotional Triggers ({extractedKnowledge.reduce((sum, item) => sum + (item.consensus_insights?.emotional_triggers?.length || 0), 0)} found)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {extractedKnowledge.slice(0, 5).map((item, idx) => (
                        item.consensus_insights?.emotional_triggers?.slice(0, 5).map((trigger, triggerIdx) => (
                          <span
                            key={`${idx}-${triggerIdx}`}
                            className="bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full text-sm border border-pink-500/30"
                          >
                            {trigger}
                          </span>
                        ))
                      ))}
                    </div>
                  </div>

                  {/* Confidence Scores */}
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-cyan-400 mb-3">Confidence Scores</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <p className="text-sm text-gray-400 mb-1">Average Confidence</p>
                        <p className="text-2xl font-bold text-cyan-400">
                          {Math.round(extractedKnowledge.reduce((sum, item) => sum + item.confidence_score, 0) / extractedKnowledge.length * 100)}%
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <p className="text-sm text-gray-400 mb-1">Videos Analyzed</p>
                        <p className="text-2xl font-bold text-purple-400">
                          {extractedKnowledge.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <a
                      href="/admin/research-review"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg transition-all"
                    >
                      Use in Script Predictor (FEAT-070) →
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Viral Videos Section - FEAT-001 + FEAT-002 */}
        <div>
          <div className="mb-6 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-sm">
            <span className="text-purple-400 font-mono">🔥 DATA SOURCES: FEAT-001 (Scraper) metadata + FEAT-002 (DPS) scores</span>
          </div>

          {/* UX-003 FIX: Video Grid Header with Counter */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">🔥 Viral Videos ({stats?.viral || 0})</h2>

            {/* Video Counter */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg px-6 py-3">
              <p className="text-sm text-gray-400 mb-1">Video Count</p>
              <p className="text-xl font-bold text-cyan-400">
                {getVideoCountText()}
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <select
                value={selectedPattern}
                onChange={(e) => setSelectedPattern(e.target.value)}
                className="px-4 py-3 rounded-lg bg-white/5 border border-white/20 focus:border-purple-500 focus:outline-none text-white [&>option]:bg-gray-900 [&>option]:text-white"
              >
                <option value="all" className="bg-gray-900 text-white">Pattern: All</option>
                {patterns.length > 0 && Array.from(new Set(patterns.map(p => p.pattern_type))).map((type) => (
                  <option key={type} value={type} className="bg-gray-900 text-white">
                    Pattern: {type}
                  </option>
                ))}
              </select>

              <select
                value={dpsRange}
                onChange={(e) => setDpsRange(e.target.value)}
                className="px-4 py-3 rounded-lg bg-white/5 border border-white/20 focus:border-purple-500 focus:outline-none text-white [&>option]:bg-gray-900 [&>option]:text-white"
              >
                <option value="70-100" className="bg-gray-900 text-white">DPS: 70-100</option>
                <option value="80-100" className="bg-gray-900 text-white">DPS: 80-100 (Mega-Viral)</option>
                <option value="70-79" className="bg-gray-900 text-white">DPS: 70-79 (Viral)</option>
              </select>

              <select
                value={selectedCreator}
                onChange={(e) => setSelectedCreator(e.target.value)}
                className="px-4 py-3 rounded-lg bg-white/5 border border-white/20 focus:border-purple-500 focus:outline-none text-white [&>option]:bg-gray-900 [&>option]:text-white"
              >
                <option value="all" className="bg-gray-900 text-white">Creator: All</option>
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-3 rounded-lg bg-white/5 border border-white/20 focus:border-purple-500 focus:outline-none text-white [&>option]:bg-gray-900 [&>option]:text-white"
              >
                <option value="7" className="bg-gray-900 text-white">Last 7 days</option>
                <option value="30" className="bg-gray-900 text-white">Last 30 days</option>
                <option value="90" className="bg-gray-900 text-white">Last 90 days</option>
                <option value="all" className="bg-gray-900 text-white">All time</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 rounded-lg bg-white/5 border border-white/20 focus:border-purple-500 focus:outline-none text-white [&>option]:bg-gray-900 [&>option]:text-white"
              >
                <option value="dps-desc" className="bg-gray-900 text-white">Sort: DPS (High→Low)</option>
                <option value="views-desc" className="bg-gray-900 text-white">Sort: Views (High→Low)</option>
                <option value="date-desc" className="bg-gray-900 text-white">Sort: Date (Recent)</option>
              </select>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search hooks or creators... (FEAT-001 transcript/caption)"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 focus:border-purple-500 focus:outline-none text-white placeholder-gray-500"
            />
          </div>

          {/* Video Grid */}
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading videos...</div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No viral videos found</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                {videos.map((video) => (
                  <div key={video.video_id} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all"></div>
                    <div className="relative backdrop-blur-xl bg-white/5 rounded-2xl overflow-hidden border border-white/10 group-hover:border-purple-500/50 transition-all">
                      {/* Thumbnail */}
                      <div className="relative aspect-[9/16] bg-gradient-to-br from-purple-600 to-pink-600">
                        {video.thumbnail_url ? (
                          <img
                            src={video.thumbnail_url}
                            alt="Video thumbnail"
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                        {video.dps_score && video.dps_score >= 80 && (
                          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-xs font-bold">
                            MEGA-VIRAL
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <div className="text-sm font-medium mb-2 line-clamp-2">
                          {video.caption || 'No caption'}
                        </div>
                        <div className="text-xs text-gray-400 mb-3">
                          @{video.creator_username || 'unknown'}
                        </div>
                        <div className="flex items-center gap-3 text-xs mb-4">
                          <span className="flex items-center gap-1">
                            👁 {video.views_count?.toLocaleString() || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            💚 {video.likes_count?.toLocaleString() || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            🔥 {video.dps_score?.toFixed(0) || 0}
                          </span>
                        </div>
                        <button
                          onClick={() => openViralBreakdown(video)}
                          className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-semibold transition-all text-sm"
                        >
                          View Viral Breakdown
                        </button>
                        <div className="text-xs text-gray-500 mt-2 text-center">
                          Opens detail with FEAT-003 + FEAT-060 data
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* UX-003 FIX: Enhanced Loading Controls */}
              {!allVideosLoaded && (
                <div className="flex justify-center gap-4 mt-8">
                  {/* Existing Load More button */}
                  {hasMoreVideos && (
                    <button
                      onClick={() => fetchVideos(true)}
                      disabled={loading || loadingAll}
                      className="backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white px-8 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      {loading ? 'Loading...' : 'Load More (12 videos)'}
                    </button>
                  )}

                  {/* NEW: Load All Videos button */}
                  <button
                    onClick={loadAllVideos}
                    disabled={loading || loadingAll || allVideosLoaded}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
                  >
                    {loadingAll ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading all {totalVideoCount || '...'} videos...
                      </>
                    ) : (
                      `Load All Videos (${totalVideoCount || '...'})`
                    )}
                  </button>
                </div>
              )}

              {/* Show message when all videos loaded */}
              {allVideosLoaded && (
                <div className="text-center backdrop-blur-xl bg-green-500/10 border border-green-500/30 rounded-lg px-6 py-4 mt-8">
                  <p className="text-green-400 font-semibold">
                    ✓ All {videos.length} videos loaded
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    You're viewing the complete dataset
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Enhanced Toast Notification */}
        {message && (
          <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl backdrop-blur-xl border shadow-2xl max-w-md animate-in slide-in-from-right-full duration-300 ${
            messageType === 'success' ? 'bg-green-500/20 border-green-500/50' :
            messageType === 'error' ? 'bg-red-500/20 border-red-500/50' :
            messageType === 'loading' ? 'bg-blue-500/20 border-blue-500/50 animate-pulse' :
            'bg-white/10 border-white/20'
          }`}>
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">
                {messageType === 'success' ? '✅' :
                 messageType === 'error' ? '❌' :
                 messageType === 'loading' ? '⏳' : 'ℹ️'}
              </div>
              <div className="flex-1">
                <div className={`font-semibold text-sm mb-1 ${
                  messageType === 'success' ? 'text-green-300' :
                  messageType === 'error' ? 'text-red-300' :
                  messageType === 'loading' ? 'text-blue-300' :
                  'text-white'
                }`}>
                  {messageType === 'success' ? 'Success!' :
                   messageType === 'error' ? 'Error' :
                   messageType === 'loading' ? 'Processing...' : 'Info'}
                </div>
                <div className="text-white text-sm">{message}</div>
              </div>
              <button
                onClick={() => setMessage('')}
                className="text-white/60 hover:text-white transition-colors flex-shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Viral Breakdown Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8 overflow-y-auto">
          <div className="bg-gradient-to-br from-[#0F0A1E] to-[#1a0b2e] rounded-3xl border border-white/20 max-w-6xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-3xl flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold mb-2">🔥 Viral Breakdown</h2>
                <p className="text-sm opacity-90">FEAT-002 DPS + FEAT-003 Patterns + FEAT-060 Knowledge</p>
              </div>
              <button
                onClick={closeViralBreakdown}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {modalLoading ? (
              <div className="p-12 text-center text-gray-400">
                <div className="text-4xl mb-4">⏳</div>
                <div>Loading breakdown...</div>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Video Info Card */}
                <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xl font-bold mb-4 text-purple-300">📹 Video Info</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-gray-400">Creator:</span> <span className="font-semibold">@{selectedVideo.creator_username}</span></div>
                        <div><span className="text-gray-400">Views:</span> <span className="font-semibold">{selectedVideo.views_count?.toLocaleString()}</span></div>
                        <div><span className="text-gray-400">Likes:</span> <span className="font-semibold">{selectedVideo.likes_count?.toLocaleString()}</span></div>
                        <div><span className="text-gray-400">DPS Score:</span> <span className="font-bold text-2xl bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">{selectedVideo.dps_score?.toFixed(1)}</span></div>
                        <div><span className="text-gray-400">Classification:</span> <span className="font-semibold uppercase">{selectedVideo.dps_classification}</span></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-4 text-purple-300">📝 Caption</h3>
                      <p className="text-sm text-gray-300">{selectedVideo.caption || 'No caption'}</p>
                    </div>
                  </div>
                </div>

                {/* Transcript */}
                {selectedVideo.transcript_text && (
                  <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-xl font-bold mb-4 text-green-300">🎤 Transcript (FEAT-001)</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">{selectedVideo.transcript_text}</p>
                  </div>
                )}

                {/* Matched Patterns - FEAT-003 */}
                {videoPatterns.length > 0 && (
                  <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-xl font-bold mb-4 text-yellow-300">🧬 Detected Patterns (FEAT-003)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {videoPatterns.map((pattern, idx) => (
                        <div key={idx} className="bg-black/30 rounded-lg p-4 border border-white/10">
                          <div className="font-bold mb-2">{pattern.pattern_description || pattern.pattern_type}</div>
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>{Math.round(pattern.success_rate * 100)}% success rate</span>
                            <span>DPS: {pattern.avg_dps_score.toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Knowledge Extraction - FEAT-060 */}
                {videoKnowledge && (
                  <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-xl font-bold mb-4 text-pink-300">🧠 Extracted Knowledge (FEAT-060)</h3>
                    {videoKnowledge.consensus_insights && (
                      <div className="space-y-4">
                        {videoKnowledge.consensus_insights.hooks && (
                          <div>
                            <div className="text-sm font-semibold text-purple-300 mb-2">Hooks:</div>
                            <div className="flex flex-wrap gap-2">
                              {videoKnowledge.consensus_insights.hooks.map((hook: string, idx: number) => (
                                <span key={idx} className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-lg text-sm">
                                  {hook}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {videoKnowledge.consensus_insights.keywords && (
                          <div>
                            <div className="text-sm font-semibold text-cyan-300 mb-2">Keywords:</div>
                            <div className="flex flex-wrap gap-2">
                              {videoKnowledge.consensus_insights.keywords.map((keyword: string, idx: number) => (
                                <span key={idx} className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/50 rounded-lg text-sm">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {videoKnowledge.consensus_insights.triggers && (
                          <div>
                            <div className="text-sm font-semibold text-pink-300 mb-2">Triggers:</div>
                            <div className="flex flex-wrap gap-2">
                              {videoKnowledge.consensus_insights.triggers.map((trigger: string, idx: number) => (
                                <span key={idx} className="px-3 py-1 bg-pink-500/20 border border-pink-500/50 rounded-lg text-sm">
                                  {trigger}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="pt-4 border-t border-white/10 flex justify-between text-xs text-gray-400">
                          <span>Confidence: {(videoKnowledge.confidence_score * 100).toFixed(0)}%</span>
                          <span>Agreement: {(videoKnowledge.agreement_score * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                  <a
                    href={selectedVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 font-semibold text-center transition-all"
                  >
                    🔗 View Original Video
                  </a>
                  <button
                    onClick={closeViralBreakdown}
                    className="flex-1 py-3 px-6 rounded-xl bg-white/10 hover:bg-white/20 font-semibold transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View All Patterns Modal */}
      {showAllPatterns && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8 overflow-y-auto">
          <div className="bg-gradient-to-br from-[#0F0A1E] to-[#1a0b2e] rounded-3xl border border-white/20 max-w-6xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-3xl flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold mb-2">🧬 All Viral Patterns</h2>
                <p className="text-sm opacity-90">FEAT-003: Pattern Extraction from viral_patterns table</p>
              </div>
              <button
                onClick={() => setShowAllPatterns(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {allPatterns.map((pattern, idx) => (
                  <div key={pattern.id} className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all">
                    <h3 className="text-xl font-bold mb-3">{pattern.pattern_description || pattern.pattern_type}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Pattern Type:</span>
                        <span className="font-semibold">{pattern.pattern_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Frequency:</span>
                        <span className="font-semibold">{pattern.frequency_count} occurrences</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Success Rate:</span>
                        <span className="font-semibold text-green-400">{Math.round(pattern.success_rate * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg DPS Score:</span>
                        <span className="font-bold text-cyan-400">{pattern.avg_dps_score.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Viral Videos:</span>
                        <span className="font-semibold">{pattern.viral_videos_count} / {pattern.total_videos_analyzed}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
