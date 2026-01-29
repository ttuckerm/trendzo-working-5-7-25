const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function checkSubtitles() {
  // Check videos WITHOUT transcripts
  const { data, error } = await supabase
    .from('scraped_videos')
    .select('video_id, url, subtitles, raw_scraping_data')
    .is('transcript_text', null)
    .limit(10)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Checking ${data.length} videos without transcripts...\n`)

  let withSubtitles = 0
  let withoutSubtitles = 0

  data.forEach((v, i) => {
    console.log(`${i + 1}. Video: ${v.video_id}`)

    if (v.subtitles && (Array.isArray(v.subtitles) && v.subtitles.length > 0)) {
      console.log(`   ✅ HAS SUBTITLES (${v.subtitles.length} entries)`)
      console.log(`   Sample: ${v.subtitles[0]?.text?.substring(0, 50)}...`)
      withSubtitles++
    } else if (v.raw_scraping_data?.subtitles) {
      console.log(`   ✅ HAS SUBTITLES IN RAW DATA`)
      withSubtitles++
    } else {
      console.log(`   ❌ NO SUBTITLES`)
      withoutSubtitles++
    }
    console.log()
  })

  console.log(`\nSummary:`)
  console.log(`✅ With subtitles: ${withSubtitles}`)
  console.log(`❌ Without subtitles: ${withoutSubtitles}`)
  console.log(`\nIf most have subtitles, we can extract those for FREE!`)
}

checkSubtitles()
