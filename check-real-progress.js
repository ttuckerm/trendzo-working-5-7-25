const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function checkRealProgress() {
  console.log('📊 CHECKING ACTUAL DATABASE STATE\n')

  // Total videos
  const { count: total } = await supabase
    .from('scraped_videos')
    .select('*', { count: 'exact', head: true })

  // Videos with transcripts
  const { count: withTranscripts } = await supabase
    .from('scraped_videos')
    .select('*', { count: 'exact', head: true })
    .not('transcript_text', 'is', null)

  // Videos without transcripts
  const withoutTranscripts = total - withTranscripts

  console.log('DATABASE REALITY:')
  console.log('━'.repeat(50))
  console.log(`Total videos:          ${total}`)
  console.log(`With transcripts:      ${withTranscripts}`)
  console.log(`Without transcripts:   ${withoutTranscripts}`)
  console.log(`Progress:              ${((withTranscripts/total)*100).toFixed(1)}%`)
  console.log('━'.repeat(50))

  // Get sample of recent transcripts
  const { data: recent } = await supabase
    .from('scraped_videos')
    .select('video_id, creator_username, transcript_text, updated_at')
    .not('transcript_text', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(5)

  console.log('\n📝 Most Recent Transcripts:')
  recent?.forEach((v, i) => {
    console.log(`\n${i+1}. ${v.video_id} (@${v.creator_username})`)
    console.log(`   Updated: ${new Date(v.updated_at).toLocaleString()}`)
    console.log(`   Preview: ${v.transcript_text.substring(0, 60)}...`)
  })
}

checkRealProgress()
