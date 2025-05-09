// Test script for /api/sounds/recommendations endpoint
import fetch from 'node-fetch';

async function testRecommendationsEndpoint() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  
  // We need a valid template ID to test this endpoint
  // For testing purposes, you can replace this with a known valid template ID
  // or add logic to fetch a valid template ID first
  const sampleTemplateId = 'template123'; // Replace with actual template ID
  
  // Test cases
  const testCases = [
    // Basic test with template ID
    { 
      name: 'Basic template recommendations',
      url: `${baseUrl}/api/sounds/recommendations?templateId=${sampleTemplateId}`
    },
    // Test with limit parameter
    { 
      name: 'Limited results',
      url: `${baseUrl}/api/sounds/recommendations?templateId=${sampleTemplateId}&limit=5`
    },
    // Test with minimum score filter
    { 
      name: 'Minimum correlation score',
      url: `${baseUrl}/api/sounds/recommendations?templateId=${sampleTemplateId}&minScore=70`
    },
    // Test without detailed sound info
    { 
      name: 'Without detailed info',
      url: `${baseUrl}/api/sounds/recommendations?templateId=${sampleTemplateId}&includeDetails=false`
    },
    // Test with category filter
    { 
      name: 'Filter by category',
      url: `${baseUrl}/api/sounds/recommendations?templateId=${sampleTemplateId}&category=music`
    },
    // Test with multiple parameters
    { 
      name: 'Combined parameters',
      url: `${baseUrl}/api/sounds/recommendations?templateId=${sampleTemplateId}&limit=10&minScore=60&category=music`
    },
    // Test with missing template ID (should return 400)
    { 
      name: 'Missing template ID',
      url: `${baseUrl}/api/sounds/recommendations`,
      expectedError: true
    },
    // Test with invalid template ID
    { 
      name: 'Invalid template ID',
      url: `${baseUrl}/api/sounds/recommendations?templateId=invalid-id-123456`,
      expectedError: true
    }
  ];

  console.log('🧪 Testing /api/sounds/recommendations endpoint...');
  
  // Helper function to get a valid template ID if needed
  async function getValidTemplateId() {
    try {
      // In a real scenario, you would query your API to get a valid template ID
      // For example, you might have an endpoint like /api/templates that returns a list
      // of templates, and you could use the ID of the first one

      // This is a placeholder implementation
      const response = await fetch(`${baseUrl}/api/templates?limit=1`);
      if (response.ok) {
        const data = await response.json();
        if (data.templates && data.templates.length > 0) {
          return data.templates[0].id;
        }
      }
      
      // If we couldn't get a real ID, return the sample one
      return sampleTemplateId;
    } catch (error) {
      console.log('Could not retrieve a valid template ID:', error);
      return sampleTemplateId;
    }
  }
  
  // Get a valid template ID for testing
  const validTemplateId = await getValidTemplateId();
  console.log(`Using template ID: ${validTemplateId}`);
  
  // Update URLs to use the valid template ID
  if (validTemplateId !== sampleTemplateId) {
    testCases.forEach(test => {
      if (!test.expectedError || test.name !== 'Missing template ID') {
        test.url = test.url.replace(sampleTemplateId, validTemplateId);
      }
    });
  }
  
  for (const test of testCases) {
    try {
      console.log(`\n📝 Test: ${test.name}`);
      console.log(`📡 URL: ${test.url}`);
      
      const response = await fetch(test.url);
      const data = await response.json();
      
      console.log(`🔍 Status: ${response.status}`);
      
      if (!response.ok) {
        if (test.expectedError) {
          console.log('✅ Expected error received:', data.error);
        } else {
          console.log('❌ Unexpected error:', data.error);
        }
        continue;
      }
      
      if (test.expectedError) {
        console.log('❌ Expected an error but received success response');
        continue;
      }
      
      // Validate structure
      console.log('✅ Response structure:');
      console.log(`  - success: ${data.success}`);
      
      // Check template information
      if (data.template) {
        console.log('📊 Template info:');
        console.log(`  - id: ${data.template.id}`);
        console.log(`  - title: ${data.template.title || 'Not provided'}`);
        console.log(`  - category: ${data.template.category || 'Not provided'}`);
      } else {
        console.log('❌ Template information missing in response');
      }
      
      // Check recommendations
      console.log(`📊 Recommendations: ${data.recommendations ? `Array with ${data.recommendations.length} items` : 'Missing'}`);
      console.log(`  - Total count: ${data.count}`);
      
      // Analyze first recommendation if available
      if (data.recommendations && data.recommendations.length > 0) {
        const firstRec = data.recommendations[0];
        console.log('📊 Sample recommendation:');
        console.log(`  - Sound ID: ${firstRec.sound.id}`);
        console.log(`  - Recommendation source: ${firstRec.recommendationSource}`);
        console.log(`  - Recommendation strength: ${firstRec.recommendationStrength}`);
        
        // If it's a direct correlation, check correlation score
        if (firstRec.recommendationSource === 'correlation' && firstRec.correlationScore) {
          console.log(`  - Correlation score: ${firstRec.correlationScore}`);
        }
        
        // Check whether detailed sound info is included based on URL
        const shouldIncludeDetails = !test.url.includes('includeDetails=false');
        if (shouldIncludeDetails) {
          const hasDetails = firstRec.sound.soundCategory !== undefined && 
                            firstRec.sound.viralityScore !== undefined;
          console.log(`  - Detailed info: ${hasDetails ? 'Included as expected' : 'Missing but should be included'}`);
        } else {
          const hasMinimalInfo = Object.keys(firstRec.sound).length <= 5; // id, title, authorName, soundCategory, coverThumb
          console.log(`  - Minimal info: ${hasMinimalInfo ? 'Correctly limited' : 'Contains more fields than expected'}`);
        }
      } else {
        console.log('ℹ️ No recommendations returned in this response');
      }
      
    } catch (error) {
      console.error('❌ Test error:', error);
    }
  }
  
  console.log('\n🏁 Recommendations endpoint tests completed');
}

// Run tests when executed directly
if (require.main === module) {
  testRecommendationsEndpoint();
}

export default testRecommendationsEndpoint; 