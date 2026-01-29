// Test script for /api/sounds/categories endpoint
import fetch from 'node-fetch';

async function testCategoriesEndpoint() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  
  // Test cases
  const testCases = [
    // Basic test - default parameters
    { 
      name: 'Default parameters',
      url: `${baseUrl}/api/sounds/categories`
    },
    // Test with includeStats parameter
    { 
      name: 'Include stats',
      url: `${baseUrl}/api/sounds/categories?includeStats=true`
    },
    // Test excluding genres
    { 
      name: 'Exclude genres',
      url: `${baseUrl}/api/sounds/categories?includeGenres=false`
    },
    // Test excluding moods
    { 
      name: 'Exclude moods',
      url: `${baseUrl}/api/sounds/categories?includeMoods=false`
    },
    // Test excluding tempos
    { 
      name: 'Exclude tempos',
      url: `${baseUrl}/api/sounds/categories?includeTempos=false`
    },
    // Test with multiple parameters
    { 
      name: 'Combined parameters',
      url: `${baseUrl}/api/sounds/categories?includeStats=true&includeGenres=true&includeMoods=false`
    }
  ];

  console.log('🧪 Testing /api/sounds/categories endpoint...');
  
  for (const test of testCases) {
    try {
      console.log(`\n📝 Test: ${test.name}`);
      console.log(`📡 URL: ${test.url}`);
      
      const response = await fetch(test.url);
      const data = await response.json();
      
      console.log(`🔍 Status: ${response.status}`);
      
      if (!response.ok) {
        console.log('❌ Error:', data.error);
        continue;
      }
      
      // Validate structure
      console.log('✅ Response structure:');
      console.log(`  - success: ${data.success}`);
      
      // Check categories structure
      if (data.categories) {
        console.log('📊 Categories:');
        console.log(`  - soundCategories: ${data.categories.soundCategories ? `Array with ${data.categories.soundCategories.length} items` : 'Missing'}`);
        
        // Check if genres should be included based on URL
        const shouldIncludeGenres = !test.url.includes('includeGenres=false');
        if (shouldIncludeGenres) {
          console.log(`  - genres: ${data.categories.genres ? `Array with ${data.categories.genres.length} items` : 'Missing or empty'}`);
        } else {
          console.log(`  - genres: ${data.categories.genres ? 'Unexpectedly present' : 'Correctly excluded'}`);
        }
        
        // Check if moods should be included based on URL
        const shouldIncludeMoods = !test.url.includes('includeMoods=false');
        if (shouldIncludeMoods) {
          console.log(`  - moods: ${data.categories.moods ? `Array with ${data.categories.moods.length} items` : 'Missing or empty'}`);
        } else {
          console.log(`  - moods: ${data.categories.moods ? 'Unexpectedly present' : 'Correctly excluded'}`);
        }
        
        // Check if tempos should be included based on URL
        const shouldIncludeTempos = !test.url.includes('includeTempos=false');
        if (shouldIncludeTempos) {
          console.log(`  - tempos: ${data.categories.tempos ? `Array with ${data.categories.tempos.length} items` : 'Missing or empty'}`);
        } else {
          console.log(`  - tempos: ${data.categories.tempos ? 'Unexpectedly present' : 'Correctly excluded'}`);
        }
      } else {
        console.log('❌ Categories object missing in response');
      }
      
      // Check stats if requested
      if (test.url.includes('includeStats=true')) {
        if (data.stats) {
          console.log('📊 Stats included as requested');
          // Log some examples of stats if available
          if (data.stats.soundCategories) {
            const categories = Object.keys(data.stats.soundCategories);
            if (categories.length > 0) {
              console.log(`  - Sample category count: ${categories[0]} = ${data.stats.soundCategories[categories[0]]}`);
            }
          }
        } else {
          console.log('❌ Stats were requested but not included in response');
        }
      }
      
    } catch (error) {
      console.error('❌ Test error:', error);
    }
  }
  
  console.log('\n🏁 Categories endpoint tests completed');
}

// Run tests when executed directly
if (require.main === module) {
  testCategoriesEndpoint();
}

export default testCategoriesEndpoint; 