import { config } from 'dotenv';
config({ path: '.env.local' });

async function test() {
  try {
    console.log('Testing pattern extraction...\n');
    
    // Import and test
    const { extractPatterns } = await import('./src/lib/services/pattern-extraction/pattern-extraction-service.ts');
    
    const result = await extractPatterns({
      niche: 'personal-finance',
      minDPSScore: 80,
      dateRange: '30d',
      limit: 10,
    });
    
    console.log('SUCCESS:', result);
  } catch (error) {
    console.error('\n❌ ACTUAL ERROR:');
    console.error(error);
    console.error('\nSTACK:');
    console.error(error.stack);
  }
}

test();

