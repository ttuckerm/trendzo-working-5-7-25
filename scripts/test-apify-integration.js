/**
 * Test Apify Integration
 * Verifies that Apify scrapers are properly configured and working
 */

const { ApifyClient } = require('apify-client');
require('dotenv').config({ path: '.env.local' });

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testApifyIntegration() {
  console.log(`${colors.cyan}🧪 Testing Apify Integration...${colors.reset}\n`);

  // Check environment variables
  console.log(`${colors.blue}📋 Checking environment variables...${colors.reset}`);
  
  const requiredEnvVars = [
    'APIFY_API_TOKEN',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`${colors.red}❌ Missing required environment variables:${colors.reset}`);
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.log('\nPlease add these to your .env.local file');
    return;
  }
  
  console.log(`${colors.green}✅ All required environment variables found${colors.reset}\n`);

  // Test Apify client connection
  console.log(`${colors.blue}📡 Testing Apify API connection...${colors.reset}`);
  
  const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN
  });
  
  try {
    // Test API connection by getting user info
    const user = await client.user().get();
    console.log(`${colors.green}✅ Connected to Apify as: ${user.username}${colors.reset}`);
    console.log(`   Plan: ${user.plan?.name || 'Free'}`);
    console.log(`   Monthly usage: ${user.plan?.monthlyUsage || 0} CU\n`);

  } catch (error) {
    console.error(`${colors.red}❌ Failed to connect to Apify:${colors.reset}`, error.message);
    console.log('\nPlease check your APIFY_API_TOKEN');
    return;
  }

  // Test with a more recent TikTok URL that should be accessible
  const testUrl = 'https://www.tiktok.com/@charlidamelio/video/7429158394842377502';
  
  try {
    console.log('🎯 Testing URL:', testUrl);
    console.log('⏳ Starting Apify actor...');
    
    const run = await client.actor('clockworks/free-tiktok-scraper').call({
      postURLs: [testUrl],
      resultsLimit: 1
    });
    
    console.log('✅ Actor run created:', run.id);
    console.log('⏳ Waiting for results...');
    
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    if (items && items.length > 0) {
      const video = items[0];
      console.log('🎉 SUCCESS! Video data retrieved:');
      console.log('📦 RAW DATA STRUCTURE:');
      console.log(JSON.stringify(video, null, 2));
      
      console.log('\n📊 EXTRACTED DATA:');
      console.log('📊 Video ID:', video.id);
      console.log('📝 Caption:', video.text?.substring(0, 100) + '...');
      console.log('👤 Creator:', video.authorMeta?.nickName);
      console.log('📈 Stats:');
      console.log('  - Views:', video.stats?.playCount?.toLocaleString());
      console.log('  - Likes:', video.stats?.diggCount?.toLocaleString());
      console.log('  - Comments:', video.stats?.commentCount?.toLocaleString());
      console.log('  - Shares:', video.stats?.shareCount?.toLocaleString());
      
      console.log('\n✅ APIFY INTEGRATION WORKING!');
      console.log('💰 Usage cost: ~$0.10-0.25 (estimated)');
      
      return video;
    } else {
      console.log('❌ No data returned from Apify');
      return null;
    }
    
  } catch (error) {
    console.log('❌ APIFY TEST FAILED:');
    console.log('Error:', error.message);
    
    if (error.message.includes('Invalid token')) {
      console.log('🔑 Token issue - check APIFY_API_TOKEN');
    } else if (error.message.includes('insufficient funds')) {
      console.log('💳 Insufficient credits in Apify account');
    } else if (error.message.includes('Rate limit')) {
      console.log('⏱️ Rate limit exceeded');
    }
    
    return null;
  }
}

// Only run one test to preserve your $5 budget
testApifyIntegration()
  .then(result => {
    if (result) {
      console.log('\n🎯 READY FOR STEP 4: PREDICTION ENGINE');
    } else {
      console.log('\n❌ FIX APIFY BEFORE PROCEEDING');
    }
  })
  .catch(console.error);