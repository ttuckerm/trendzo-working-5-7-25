const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function checkURLs() {
  const { data, error } = await supabase
    .from('scraped_videos')
    .select('video_id, url')
    .limit(3)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Sample URLs from database:')
  data.forEach((v, i) => {
    console.log(`\n${i + 1}. Video ID: ${v.video_id}`)
    console.log(`   URL: ${v.url}`)
  })
}

checkURLs()
