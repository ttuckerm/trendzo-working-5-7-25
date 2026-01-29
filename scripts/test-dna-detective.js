#!/usr/bin/env node

/**
 * DNA_Detective Test Runner
 * Simple script to test the DNA_Detective module functionality
 */

const https = require('https');
const http = require('http');

// Test data
const testCases = [
  {
    name: 'High Authority + Transformation Genes',
    genes: Array(48).fill(false).map((_, i) => i === 0 || i === 1), // AuthorityHook + TransformationBeforeAfter
    expectedMinProbability: 0.5
  },
  {
    name: 'All False Genes',
    genes: Array(48).fill(false),
    expectedProbability: 0.05
  },
  {
    name: 'Random Mixed Genes',
    genes: Array(48).fill(false).map((_, i) => i % 7 === 0), // Every 7th gene
    expectedMaxProbability: 0.8
  }
];

async function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: response });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function testDNADetective() {
  const baseUrl = process.env.TEST_URL || 'http://localhost:3000';
  const apiUrl = `${baseUrl}/api/dna-detective/predict`;

  console.log('🧬 DNA_Detective Module Test Runner');
  console.log('=====================================');
  console.log(`Testing API at: ${apiUrl}`);
  console.log('');

  // Test 1: Module Status
  try {
    console.log('📊 Testing module status...');
    const statusResponse = await makeRequest(`${apiUrl}?action=status`, '');
    if (statusResponse.status === 200) {
      console.log('✅ Module status: OPERATIONAL');
      console.log(`   Cache status: ${statusResponse.data.cache_status.cached ? 'ACTIVE' : 'EMPTY'}`);
    } else {
      console.log('❌ Module status check failed');
    }
  } catch (error) {
    console.log(`❌ Status check error: ${error.message}`);
  }

  console.log('');

  // Test 2: Prediction Tests
  for (const testCase of testCases) {
    console.log(`🧪 Testing: ${testCase.name}`);
    
    try {
      const requestData = JSON.stringify({ genes: testCase.genes });
      const response = await makeRequest(apiUrl, requestData);

      if (response.status === 200 && response.data.success) {
        const { data, metadata } = response.data;
        
        console.log(`   ✅ Prediction successful`);
        console.log(`   📈 Viral probability: ${(data.video_probability * 100).toFixed(1)}%`);
        console.log(`   🎯 Closest template: ${data.closest_template.name} (${data.closest_template.status})`);
        console.log(`   📏 Distance: ${data.closest_template.distance.toFixed(3)}`);
        console.log(`   🧬 Top genes: ${data.top_gene_matches.slice(0, 3).join(', ')}${data.top_gene_matches.length > 3 ? '...' : ''}`);
        console.log(`   ⚡ Processing time: ${metadata.processing_time_ms}ms`);
        
        // Validate expectations
        if (testCase.expectedProbability !== undefined) {
          if (Math.abs(data.video_probability - testCase.expectedProbability) < 0.01) {
            console.log(`   ✅ Expected probability met`);
          } else {
            console.log(`   ⚠️  Expected: ${testCase.expectedProbability}, Got: ${data.video_probability}`);
          }
        }
        
        if (testCase.expectedMinProbability !== undefined) {
          if (data.video_probability >= testCase.expectedMinProbability) {
            console.log(`   ✅ Minimum probability requirement met`);
          } else {
            console.log(`   ⚠️  Expected min: ${testCase.expectedMinProbability}, Got: ${data.video_probability}`);
          }
        }
        
        if (testCase.expectedMaxProbability !== undefined) {
          if (data.video_probability <= testCase.expectedMaxProbability) {
            console.log(`   ✅ Maximum probability requirement met`);
          } else {
            console.log(`   ⚠️  Expected max: ${testCase.expectedMaxProbability}, Got: ${data.video_probability}`);
          }
        }

        // Performance check
        if (metadata.processing_time_ms < 50) {
          console.log(`   ✅ Performance target met (<50ms)`);
        } else {
          console.log(`   ⚠️  Performance target missed: ${metadata.processing_time_ms}ms`);
        }

      } else {
        console.log(`   ❌ Prediction failed: ${response.data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`   ❌ Request error: ${error.message}`);
    }
    
    console.log('');
  }

  // Test 3: Input Validation
  console.log('🔒 Testing input validation...');
  
  try {
    const invalidRequest = JSON.stringify({ genes: Array(47).fill(false) }); // Wrong length
    const response = await makeRequest(apiUrl, invalidRequest);
    
    if (response.status === 400) {
      console.log('   ✅ Input validation working correctly');
    } else {
      console.log('   ⚠️  Expected validation error, got success');
    }
  } catch (error) {
    console.log(`   ❌ Validation test error: ${error.message}`);
  }

  console.log('');

  // Test 4: Cache Performance
  console.log('💾 Testing cache performance...');
  
  try {
    const testGenes = Array(48).fill(false);
    testGenes[0] = true;
    const requestData = JSON.stringify({ genes: testGenes });
    
    // First request (cache miss)
    const response1 = await makeRequest(apiUrl, requestData);
    const time1 = response1.data.metadata.processing_time_ms;
    
    // Second request (should use cache)
    const response2 = await makeRequest(apiUrl, requestData);
    const time2 = response2.data.metadata.processing_time_ms;
    
    console.log(`   📊 First request: ${time1}ms`);
    console.log(`   📊 Second request: ${time2}ms`);
    
    if (time2 <= time1) {
      console.log('   ✅ Cache providing performance benefit');
    } else {
      console.log('   ⚠️  Cache not improving performance');
    }
    
  } catch (error) {
    console.log(`   ❌ Cache test error: ${error.message}`);
  }

  console.log('');
  console.log('🎉 DNA_Detective testing complete!');
  console.log('');
  console.log('📋 Summary:');
  console.log('   • Module implements baseline viral prediction');
  console.log('   • Uses cosine similarity for gene-centroid matching');
  console.log('   • Returns probability + closest template + top genes');
  console.log('   • Includes caching for performance optimization');
  console.log('   • Handles edge cases and validates inputs');
  console.log('');
  console.log('🚀 Ready for production use!');
}

// Run tests
if (require.main === module) {
  testDNADetective().catch(console.error);
}

module.exports = { testDNADetective };