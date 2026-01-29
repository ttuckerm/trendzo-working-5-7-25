/**
 * Test script to verify API endpoints and template functionality
 * This can be run client-side to validate our endpoints
 */

// 1. API Endpoint testing
export async function testApiEndpoints() {
  console.log('\n========== Testing API Endpoints ==========\n');
  
  // 1.1 Test fetch-videos endpoint
  try {
    console.log('Testing /api/etl/fetch-videos endpoint...');
    const fetchResponse = await fetch('/api/etl/fetch-videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxItems: 3 })
    });
    
    if (!fetchResponse.ok) {
      throw new Error(`Failed with status ${fetchResponse.status}`);
    }
    
    const fetchData = await fetchResponse.json();
    console.log(`✅ Success! Returned ${fetchData.videos?.length || 0} videos`);
    console.log(`Source: ${fetchData.source}`);
    return { fetchVideosSuccess: true, fetchData };
  } catch (error) {
    console.error('❌ Error testing fetch-videos:', error);
    return { fetchVideosSuccess: false, error };
  }
}

// 2. Test template analysis endpoint
export async function testAnalyzeVideo(video: any) {
  try {
    console.log('\nTesting /api/etl/analyze-video endpoint...');
    
    if (!video) {
      throw new Error('No video provided for analysis');
    }
    
    const analyzeResponse = await fetch('/api/etl/analyze-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video })
    });
    
    if (!analyzeResponse.ok) {
      throw new Error(`Failed with status ${analyzeResponse.status}`);
    }
    
    const analyzeData = await analyzeResponse.json();
    console.log('✅ Analysis success!');
    console.log(`Source: ${analyzeData.source}`);
    return { analyzeSuccess: true, analyzeData };
  } catch (error) {
    console.error('❌ Error testing analyze-video:', error);
    return { analyzeSuccess: false, error };
  }
}

// 3. Test trending templates endpoint
export async function testTrendingTemplates() {
  try {
    console.log('\nTesting /api/templates/trending endpoint...');
    
    const trendingResponse = await fetch('/api/templates/trending?limit=5');
    
    if (!trendingResponse.ok) {
      throw new Error(`Failed with status ${trendingResponse.status}`);
    }
    
    const trendingData = await trendingResponse.json();
    console.log(`✅ Success! Returned ${trendingData.templates?.length || 0} trending templates`);
    return { trendingSuccess: true, trendingData };
  } catch (error) {
    console.error('❌ Error testing trending templates:', error);
    return { trendingSuccess: false, error };
  }
}

// 4. Test template filtering by category
export async function testTemplateFiltering(category: string) {
  try {
    console.log(`\nTesting template filtering for category: ${category}...`);
    
    const filterResponse = await fetch(`/api/templates/trending?category=${encodeURIComponent(category)}&limit=5`);
    
    if (!filterResponse.ok) {
      throw new Error(`Failed with status ${filterResponse.status}`);
    }
    
    const filterData = await filterResponse.json();
    console.log(`✅ Success! Returned ${filterData.templates?.length || 0} templates for category ${category}`);
    return { filterSuccess: true, filterData };
  } catch (error) {
    console.error('❌ Error testing template filtering:', error);
    return { filterSuccess: false, error };
  }
}

// Run all tests
export async function runAllTests() {
  console.log('Starting API endpoint tests...');
  
  // First fetch videos
  const fetchResult = await testApiEndpoints();
  
  // Then test analyze with first video if available
  let analyzeResult: { 
    analyzeSuccess: boolean; 
    analyzeData?: any; 
    error?: any;
  } = { analyzeSuccess: false, error: 'No videos to analyze' };
  
  if (fetchResult.fetchVideosSuccess && fetchResult.fetchData?.videos?.length > 0) {
    analyzeResult = await testAnalyzeVideo(fetchResult.fetchData.videos[0]);
  }
  
  // Test trending templates
  const trendingResult = await testTrendingTemplates();
  
  // Test filtering (use the category from first trending template or default to 'Comedy')
  const category = trendingResult.trendingSuccess && 
    trendingResult.trendingData?.templates?.length > 0 ? 
    trendingResult.trendingData.templates[0].category : 'Comedy';
  
  const filterResult = await testTemplateFiltering(category);
  
  // Return combined results
  return {
    fetchResult,
    analyzeResult,
    trendingResult,
    filterResult
  };
} 