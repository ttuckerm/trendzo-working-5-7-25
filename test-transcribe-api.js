/**
 * Quick test script to verify the transcription API works
 * This bypasses the DNS issue by using Node.js/Next.js instead of Python
 */

async function testTranscribeAPI() {
  console.log('Testing Transcription API...\n')

  // Test 1: Check for videos without transcripts
  console.log('1. Checking for videos without transcripts...')
  const checkResponse = await fetch('http://localhost:3000/api/admin/transcribe?limit=5')
  const checkData = await checkResponse.json()

  if (!checkResponse.ok) {
    console.error('❌ Failed to check videos:', checkData.error)
    process.exit(1)
  }

  console.log(`✅ Found ${checkData.count} videos without transcripts`)
  console.log(`   Sample: ${checkData.videos.slice(0, 2).map(v => `${v.video_id} (@${v.creator_username})`).join(', ')}\n`)

  if (checkData.count === 0) {
    console.log('✅ All videos already have transcripts!')
    return
  }

  // Test 2: Transcribe one video (dry run)
  console.log('2. Ready to transcribe videos')
  console.log('   Run this to transcribe 5 videos:')
  console.log('   curl -X POST http://localhost:3000/api/admin/transcribe -H "Content-Type: application/json" -d \'{"limit": 5}\'')
  console.log('')
  console.log('   Or visit: http://localhost:3000/admin/pipeline-manager')
  console.log('')
}

testTranscribeAPI().catch(console.error)
