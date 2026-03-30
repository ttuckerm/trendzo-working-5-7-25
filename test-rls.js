const { createClient } = require('@supabase/supabase-js')

// Test with ANON key (what UI uses)
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Test with SERVICE key (what API uses)
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function testRLS() {
  console.log('🔐 Testing Row Level Security (RLS) Permissions\n')

  // Test ANON key
  console.log('1️⃣ Testing ANON Key (used by UI):')
  try {
    const { count, error } = await supabaseAnon
      .from('scraped_videos')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.log(`   ❌ FAILED: ${error.message}`)
      console.log(`   👉 RLS is blocking the UI from reading data`)
    } else {
      console.log(`   ✅ SUCCESS: Can read ${count} videos`)
      console.log(`   👉 RLS fix was applied correctly!`)
    }
  } catch (e) {
    console.log(`   ❌ ERROR: ${e.message}`)
  }

  // Test SERVICE key
  console.log('\n2️⃣ Testing SERVICE Key (used by API):')
  try {
    const { count, error } = await supabaseService
      .from('scraped_videos')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.log(`   ❌ FAILED: ${error.message}`)
    } else {
      console.log(`   ✅ SUCCESS: Can read ${count} videos`)
    }
  } catch (e) {
    console.log(`   ❌ ERROR: ${e.message}`)
  }

  console.log('\n' + '─'.repeat(60))
  console.log('CONCLUSION:')
  console.log('If ANON key fails, you need to apply the RLS fix in Supabase')
  console.log('SQL query is in: fix-scraped-videos-rls.sql')
}

testRLS()
