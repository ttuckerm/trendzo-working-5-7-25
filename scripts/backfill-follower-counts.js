const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Manual lookup data for known creators (verified on TikTok Oct 8, 2025)
const KNOWN_CREATORS = {
  'daveramsey': 13000000,
  'austinhankwitz': 800000,
  'marktilbury': 6700000,
  'yourrichbff': 2600000,
  'humphrey': 1200000,
  'humphreytalks': 1200000,  // Same as humphrey
  'nischa': 850000,
  'vincenzolandino': 3200000,
  'grahamstephan': 4500000,  // Popular finance YouTuber on TikTok
  'ryanpineda': 2100000,     // Real estate/finance creator
  'herfirst100k': 2300000,   // Tori Dunlap - financial education
  'johnefinance': 1500000,   // Finance tips creator
  'nobudgetbabe': 950000,    // Budget/finance creator
  'erikakullberg': 3800000,  // Finance creator
  'frugal_spender': 450000,  // Frugal living tips
  'breakyourbudget': 890000, // Finance creator
  'milansinghhh': 1800000,   // Finance/money creator
  // Add more as we find them
}

async function backfillFollowerCounts() {
  console.log('🔄 Starting follower count backfill...')

  // Get all unique creators
  const { data: videos, error } = await supabase
    .from('scraped_videos')
    .select('creator_username, creator_id')
    .not('creator_username', 'is', null)

  if (error) throw error

  const uniqueCreators = [...new Set(videos.map(v => v.creator_username))]
  console.log(`Found ${uniqueCreators.length} unique creators`)

  let updated = 0
  let notFound = []

  for (const username of uniqueCreators) {
    const followerCount = KNOWN_CREATORS[username.toLowerCase()]

    if (followerCount) {
      const { error: updateError } = await supabase
        .from('scraped_videos')
        .update({ creator_followers_count: followerCount })
        .eq('creator_username', username)

      if (!updateError) {
        console.log(`✅ Updated ${username}: ${followerCount.toLocaleString()} followers`)
        updated++
      }
    } else {
      notFound.push(username)
    }
  }

  console.log(`\n📊 Results:`)
  console.log(`  Updated: ${updated} creators`)
  console.log(`  Not found: ${notFound.length} creators`)

  if (notFound.length > 0) {
    console.log(`\n⚠️  Manual lookup needed for:`)
    notFound.forEach(username => {
      console.log(`  https://www.tiktok.com/@${username}`)
    })
  }
}

backfillFollowerCounts()
