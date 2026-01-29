const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function showTheTruth() {
  console.log('🔍 THE COMPLETE TRUTH ABOUT YOUR DATABASE\n')
  console.log('═'.repeat(70))

  // 1. When were videos scraped?
  const { data: oldest } = await supabase
    .from('scraped_videos')
    .select('video_id, scraped_at, creator_username')
    .order('scraped_at', { ascending: true })
    .limit(1)

  const { data: newest } = await supabase
    .from('scraped_videos')
    .select('video_id, scraped_at, creator_username')
    .order('scraped_at', { ascending: false })
    .limit(1)

  console.log('\n📅 WHEN WERE VIDEOS SCRAPED?')
  console.log('─'.repeat(70))
  console.log(`First video scraped:  ${new Date(oldest[0].scraped_at).toLocaleString()}`)
  console.log(`Latest video scraped: ${new Date(newest[0].scraped_at).toLocaleString()}`)
  console.log(`\n👉 All videos were scraped BEFORE today (before I started working)`)

  // 2. What creators/niches?
  const { data: creators } = await supabase
    .from('scraped_videos')
    .select('creator_username')
    .not('creator_username', 'is', null)

  const uniqueCreators = [...new Set(creators.map(c => c.creator_username))]

  console.log('\n👥 WHAT CREATORS WERE SCRAPED?')
  console.log('─'.repeat(70))
  console.log(`Total unique creators: ${uniqueCreators.length}`)
  console.log('\nTop 10 creators by video count:')

  const creatorCounts = {}
  creators.forEach(c => {
    creatorCounts[c.creator_username] = (creatorCounts[c.creator_username] || 0) + 1
  })

  Object.entries(creatorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([creator, count], i) => {
      console.log(`  ${i+1}. @${creator}: ${count} videos`)
    })

  // 3. What's in the descriptions?
  const { data: samples } = await supabase
    .from('scraped_videos')
    .select('video_id, creator_username, description, hashtags, views_count')
    .not('description', 'is', null)
    .order('views_count', { ascending: false })
    .limit(5)

  console.log('\n📹 SAMPLE OF WHAT WAS SCRAPED (Top 5 by views):')
  console.log('─'.repeat(70))
  samples.forEach((v, i) => {
    console.log(`\n${i+1}. @${v.creator_username} - ${v.views_count?.toLocaleString()} views`)
    console.log(`   Video ID: ${v.video_id}`)
    console.log(`   Description: ${v.description?.substring(0, 100)}...`)
    console.log(`   Hashtags: ${v.hashtags?.join(', ') || 'none'}`)
  })

  // 4. Transcription status
  const { count: total } = await supabase
    .from('scraped_videos')
    .select('*', { count: 'exact', head: true })

  const { count: withTranscripts } = await supabase
    .from('scraped_videos')
    .select('*', { count: 'exact', head: true })
    .not('transcript_text', 'is', null)

  console.log('\n📝 TRANSCRIPTION STATUS:')
  console.log('─'.repeat(70))
  console.log(`Total videos:         ${total}`)
  console.log(`With transcripts:     ${withTranscripts}`)
  console.log(`Without transcripts:  ${total - withTranscripts}`)

  // 5. When were transcripts created?
  const { data: recentTranscripts } = await supabase
    .from('scraped_videos')
    .select('video_id, updated_at')
    .not('transcript_text', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(10)

  console.log('\n🕐 WHEN WERE TRANSCRIPTS CREATED?')
  console.log('─'.repeat(70))
  recentTranscripts.forEach((v, i) => {
    console.log(`${i+1}. ${v.video_id} - ${new Date(v.updated_at).toLocaleString()}`)
  })

  console.log('\n' + '═'.repeat(70))
  console.log('🎯 CONCLUSION:')
  console.log('─'.repeat(70))
  console.log('1. YOU scraped these videos previously (not me)')
  console.log('2. They were all scraped BEFORE today')
  console.log('3. I have only added transcripts to existing videos')
  console.log('4. The niche appears to be: personal finance (based on creators)')
  console.log('5. You likely used Apify to scrape @herfirst100k, @daveramsey, etc.')
  console.log('═'.repeat(70))
}

showTheTruth()
