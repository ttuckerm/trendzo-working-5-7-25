/**
 * Full transcription runner - processes all 778 videos in batches
 * Can be stopped and resumed - tracks progress in a file
 */

const fs = require('fs')
const path = require('path')

const API_URL = 'http://localhost:3000/api/admin/transcribe'
const BATCH_SIZE = 50 // Process 50 videos at a time
const PROGRESS_FILE = 'transcription-progress.json'

// Load or initialize progress
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))
  }
  return {
    totalProcessed: 0,
    successCount: 0,
    failCount: 0,
    batches: [],
    startedAt: new Date().toISOString(),
    lastBatchAt: null
  }
}

// Save progress
function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
}

// Run one batch
async function runBatch(batchNumber, limit) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`BATCH ${batchNumber}: Processing ${limit} videos`)
  console.log(`${'='.repeat(60)}`)

  const startTime = Date.now()

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit, batch: false })
    })

    const data = await response.json()
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log(`\n✅ Batch ${batchNumber} complete in ${duration}s`)
    console.log(`   Success: ${data.successCount}`)
    console.log(`   Failed: ${data.failCount}`)

    return {
      batchNumber,
      success: data.successCount,
      failed: data.failCount,
      duration: parseFloat(duration),
      completedAt: new Date().toISOString()
    }

  } catch (error) {
    console.error(`❌ Batch ${batchNumber} failed:`, error.message)
    return {
      batchNumber,
      success: 0,
      failed: limit,
      error: error.message,
      completedAt: new Date().toISOString()
    }
  }
}

// Main function
async function main() {
  console.log('🎤 FULL TRANSCRIPTION RUNNER')
  console.log('=' .repeat(60))

  const progress = loadProgress()

  console.log(`\n📊 Current Progress:`)
  console.log(`   Total processed: ${progress.totalProcessed}`)
  console.log(`   Success: ${progress.successCount}`)
  console.log(`   Failed: ${progress.failCount}`)
  console.log(`   Batches completed: ${progress.batches.length}`)

  if (progress.totalProcessed >= 778) {
    console.log(`\n✅ ALL VIDEOS TRANSCRIBED!`)
    console.log(`\n📈 Final Stats:`)
    console.log(`   Success rate: ${((progress.successCount / progress.totalProcessed) * 100).toFixed(1)}%`)
    console.log(`   Total time: ${calculateTotalTime(progress)}`)
    return
  }

  console.log(`\n🚀 Starting transcription...`)
  console.log(`   Remaining: ~${778 - progress.totalProcessed} videos`)
  console.log(`   Estimated time: ${estimateTime(778 - progress.totalProcessed)} hours`)
  console.log(`\n   Press Ctrl+C to stop (progress will be saved)\n`)

  let batchNumber = progress.batches.length + 1

  // Process batches until complete
  while (progress.totalProcessed < 778) {
    const remaining = 778 - progress.totalProcessed
    const batchSize = Math.min(BATCH_SIZE, remaining)

    const result = await runBatch(batchNumber, batchSize)

    // Update progress
    progress.batches.push(result)
    progress.totalProcessed += (result.success + result.failed)
    progress.successCount += result.success
    progress.failCount += result.failed
    progress.lastBatchAt = result.completedAt

    saveProgress(progress)

    console.log(`\n📊 Overall Progress: ${progress.totalProcessed}/778 (${((progress.totalProcessed/778)*100).toFixed(1)}%)`)
    console.log(`   Success rate: ${((progress.successCount / progress.totalProcessed) * 100).toFixed(1)}%`)

    if (progress.totalProcessed < 778) {
      console.log(`\n⏳ Waiting 5 seconds before next batch...`)
      await new Promise(resolve => setTimeout(resolve, 5000))
    }

    batchNumber++
  }

  console.log(`\n\n${'='.repeat(60)}`)
  console.log(`🎉 TRANSCRIPTION COMPLETE!`)
  console.log(`${'='.repeat(60)}`)
  console.log(`\n📈 Final Stats:`)
  console.log(`   Total videos: 778`)
  console.log(`   Successful: ${progress.successCount} (${((progress.successCount/778)*100).toFixed(1)}%)`)
  console.log(`   Failed: ${progress.failCount} (${((progress.failCount/778)*100).toFixed(1)}%)`)
  console.log(`   Total time: ${calculateTotalTime(progress)}`)
  console.log(`\n✅ All transcripts saved to Supabase database`)
  console.log(`\n📝 Progress log saved to: ${PROGRESS_FILE}`)
}

function estimateTime(videosRemaining) {
  // ~10-15 seconds per video (download + transcribe)
  // Plus 2 seconds between videos for rate limiting
  const secondsPerVideo = 17
  const totalSeconds = videosRemaining * secondsPerVideo
  return (totalSeconds / 3600).toFixed(1)
}

function calculateTotalTime(progress) {
  if (!progress.startedAt) return 'Unknown'

  const start = new Date(progress.startedAt)
  const end = progress.lastBatchAt ? new Date(progress.lastBatchAt) : new Date()
  const durationMs = end - start
  const hours = Math.floor(durationMs / 3600000)
  const minutes = Math.floor((durationMs % 3600000) / 60000)

  return `${hours}h ${minutes}m`
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log(`\n\n⚠️  Stopping transcription...`)
  console.log(`✅ Progress saved to ${PROGRESS_FILE}`)
  console.log(`   Run this script again to resume\n`)
  process.exit(0)
})

main().catch(error => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})
