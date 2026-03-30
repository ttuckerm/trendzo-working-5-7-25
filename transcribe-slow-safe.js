/**
 * SLOW & SAFE Transcription Script
 *
 * Features:
 * - Processes ONE video at a time (respects rate limits)
 * - 2-second delay between videos
 * - Skips videos >20MB (usually longer than 60 seconds)
 * - Resumable (tracks progress)
 * - Shows real-time progress
 */

const fs = require('fs')

const API_URL = 'http://localhost:3000/api/admin/transcribe'
const PROGRESS_FILE = 'transcription-progress-slow.json'
const DELAY_MS = 2000 // 2 seconds between requests

// Load progress
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))
  }
  return {
    processed: [],
    successCount: 0,
    failCount: 0,
    skippedCount: 0,
    startedAt: new Date().toISOString(),
    lastUpdate: null
  }
}

// Save progress
function saveProgress(progress) {
  progress.lastUpdate = new Date().toISOString()
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
}

// Transcribe one video
async function transcribeOne(videoId, retryCount = 0) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 1, batch: false })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    if (data.results && data.results.length > 0) {
      return data.results[0]
    }

    return { success: false, error: 'No results returned' }

  } catch (error) {
    // Retry once on network errors
    if (retryCount === 0) {
      console.log(`   ⚠️  Network error, retrying...`)
      await new Promise(resolve => setTimeout(resolve, 3000))
      return transcribeOne(videoId, 1)
    }

    return { success: false, error: error.message }
  }
}

// Format time remaining
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

// Main function
async function main() {
  console.log('🐌 SLOW & SAFE TRANSCRIPTION')
  console.log('═'.repeat(70))
  console.log('Strategy: One video every 2 seconds (respects rate limits)')
  console.log('Press Ctrl+C to stop (progress is saved)\n')

  const progress = loadProgress()

  // Get total count from API
  const checkResponse = await fetch(`${API_URL}?limit=1`)
  const checkData = await checkResponse.json()
  const remaining = checkData.count || 0

  if (remaining === 0) {
    console.log('✅ All videos already have transcripts!')
    return
  }

  console.log(`📊 Status:`)
  console.log(`   Already processed: ${progress.processed.length}`)
  console.log(`   Remaining: ~${remaining}`)
  console.log(`   Success rate: ${progress.successCount > 0 ? ((progress.successCount / (progress.successCount + progress.failCount)) * 100).toFixed(1) : 0}%`)
  console.log(`   Estimated time: ${formatTime(remaining * 2)}\n`)

  console.log('🚀 Starting transcription...\n')

  let consecutiveFailures = 0
  const MAX_CONSECUTIVE_FAILURES = 10

  while (true) {
    // Check if more videos need transcription
    const statusResponse = await fetch(`${API_URL}?limit=1`)
    const statusData = await statusResponse.json()

    if (statusData.count === 0) {
      console.log('\n✅ All videos transcribed!')
      break
    }

    // Transcribe next video
    const result = await transcribeOne()

    if (result.success) {
      progress.successCount++
      progress.processed.push(result.video_id)
      consecutiveFailures = 0

      console.log(`✅ ${progress.successCount}. ${result.video_id}`)
      console.log(`   Preview: ${result.transcript?.substring(0, 60)}...`)

    } else {
      progress.failCount++
      consecutiveFailures++

      // Check for specific errors
      if (result.error?.includes('rate limit') || result.error?.includes('Free Api Limit')) {
        console.log(`⏸️  Rate limit hit, waiting 5 seconds...`)
        await new Promise(resolve => setTimeout(resolve, 5000))
        consecutiveFailures = 0 // Don't count rate limits as failures
      } else if (result.error?.includes('Maximum content size')) {
        progress.skippedCount++
        console.log(`⏭️  ${progress.processed.length + 1}. Video too large (>25MB), skipping...`)
      } else if (result.error?.includes('too short or empty')) {
        progress.skippedCount++
        console.log(`⏭️  ${progress.processed.length + 1}. No speech detected, skipping...`)
      } else {
        console.log(`❌ ${progress.failCount}. Failed: ${result.error}`)
      }
    }

    // Save progress
    saveProgress(progress)

    // Show periodic stats
    if ((progress.successCount + progress.failCount) % 10 === 0) {
      const total = progress.successCount + progress.failCount
      const successRate = ((progress.successCount / total) * 100).toFixed(1)
      console.log(`\n📊 Progress: ${total} processed | ${successRate}% success | ${progress.skippedCount} skipped\n`)
    }

    // Stop if too many consecutive failures
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.log(`\n⚠️  ${MAX_CONSECUTIVE_FAILURES} consecutive failures. Stopping.`)
      console.log(`   Check API status or run again later.`)
      break
    }

    // Wait before next request (rate limiting)
    await new Promise(resolve => setTimeout(resolve, DELAY_MS))
  }

  // Final summary
  console.log('\n' + '═'.repeat(70))
  console.log('📊 FINAL SUMMARY')
  console.log('═'.repeat(70))
  console.log(`✅ Successful: ${progress.successCount}`)
  console.log(`❌ Failed: ${progress.failCount}`)
  console.log(`⏭️  Skipped: ${progress.skippedCount}`)
  console.log(`📈 Success rate: ${((progress.successCount / (progress.successCount + progress.failCount)) * 100).toFixed(1)}%`)
  console.log(`\n💾 Progress saved to: ${PROGRESS_FILE}`)
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n\n⚠️  Stopping...`)
  console.log(`✅ Progress saved to ${PROGRESS_FILE}`)
  console.log(`   Run this script again to resume\n`)
  process.exit(0)
})

main().catch(error => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})
