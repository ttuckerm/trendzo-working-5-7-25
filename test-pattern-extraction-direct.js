// Direct test of pattern extraction service (bypass API)
require('dotenv').config({ path: '.env.local' });

async function testDirectly() {
  try {
    console.log('🧪 Testing pattern extraction service directly...\n');

    // Test if we can import the service
    console.log('1️⃣ Importing service...');
    const { extractPatterns } = require('./src/lib/services/pattern-extraction/pattern-extraction-service.ts');
    console.log('✅ Service imported successfully\n');

    // Test extraction
    console.log('2️⃣ Running extraction...');
    const result = await extractPatterns({
      niche: 'personal-finance',
      minDPSScore: 80,
      dateRange: '30d',
      limit: 10,
    });

    console.log('✅ Extraction completed!\n');
    console.log('Results:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    
    // Check for specific error types
    if (error.message.includes('Cannot find module')) {
      console.error('\n💡 Tip: TypeScript files might not be compiled yet');
      console.error('   Try: npm run build or restart dev server');
    } else if (error.message.includes('OPENAI_API_KEY')) {
      console.error('\n💡 Tip: OpenAI API key is missing');
      console.error('   Add OPENAI_API_KEY to .env.local');
    } else if (error.message.includes('Supabase')) {
      console.error('\n💡 Tip: Supabase configuration issue');
      console.error('   Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY');
    }
  }
}

testDirectly();

