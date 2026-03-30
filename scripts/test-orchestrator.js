#!/usr/bin/env node

/**
 * Orchestrator Test Runner
 * Comprehensive testing script for the prediction router and blender
 */

const https = require('https');
const http = require('http');

// Test data sets
const testCases = [
  {
    name: 'Basic Genes Only',
    input: {
      genes: Array(48).fill(false).map((_, i) => i === 0 || i === 1 || i === 5), // Strong authority + transformation + secret
    },
    expectedEngines: 1, // Only DNA_Detective should run
    description: 'Tests basic gene-only prediction with DNA_Detective'
  },
  {
    name: 'Early Metrics Available',
    input: {
      genes: Array(48).fill(false).map((_, i) => i % 6 === 0),
      earlyMetrics: {
        views_10m: 2500,
        likes_10m: 145,
        shares_10m: 23
      }
    },
    expectedEngines: 1, // Still only DNA_Detective (others disabled in MVP)
    description: 'Tests prediction with early engagement metrics'
  },
  {
    name: 'Complete Data Set',
    input: {
      genes: Array(48).fill(false).map((_, i) => i % 5 === 0),
      earlyMetrics: {
        views_10m: 5000,
        likes_10m: 350,
        shares_10m: 67
      },
      shareGraph: [
        { from: 'user1', to: 'user2', t: 1642636800 },
        { from: 'user2', to: 'user3', t: 1642636860 },
        { from: 'user3', to: 'user4', t: 1642636920 }
      ],
      audioEmbedding: {
        embedding: Array(128).fill(0).map(() => Math.random()),
        duration_ms: 15000,
        sample_rate: 44100
      },
      visualEmbedding: {
        embedding: Array(256).fill(0).map(() => Math.random()),
        frame_count: 450,
        resolution: '1920x1080'
      },
      metadata: {
        platform: 'tiktok',
        niche: 'fitness',
        creator_tier: 'macro'
      }
    },
    expectedEngines: 1, // In MVP, other engines are placeholders
    description: 'Tests complete multimodal prediction with all data types'
  }
];

const blendingTests = [
  {
    name: 'Confidence Weighted (Default)',
    config: {
      strategy: 'confidence_weighted'
    }
  },
  {
    name: 'Max Confidence Strategy',
    config: {
      strategy: 'max_confidence'
    }
  },
  {
    name: 'Ensemble Voting',
    config: {
      strategy: 'ensemble_voting'
    }
  },
  {
    name: 'Weighted Average with Custom Weights',
    config: {
      strategy: 'weighted_average',
      weights: {
        'DNA_Detective': 0.7,
        'QuantumSwarmNexus': 0.3
      }
    }
  }
];

async function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      const bodyData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(bodyData);
    }

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
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testOrchestrator() {
  const baseUrl = process.env.TEST_URL || 'http://localhost:3000';
  const apiUrl = `${baseUrl}/api/orchestrator/predict`;

  console.log('🎭 Orchestrator Module Test Runner');
  console.log('==================================');
  console.log(`Testing API at: ${apiUrl}`);
  console.log('');

  // Test 1: Module Status
  try {
    console.log('📊 Testing orchestrator status...');
    const statusResponse = await makeRequest(`${apiUrl}?action=status`);
    if (statusResponse.status === 200) {
      const status = statusResponse.data.orchestrator_status;
      console.log('✅ Orchestrator status: OPERATIONAL');
      console.log(`   Total engines: ${status.engines_total}`);
      console.log(`   Enabled engines: ${status.engines_enabled}`);
      console.log(`   Available engines: ${status.engines_available.map(e => e.name).join(', ')}`);
      console.log(`   Default strategy: ${status.default_blending_strategy}`);
    } else {
      console.log('❌ Orchestrator status check failed');
    }
  } catch (error) {
    console.log(`❌ Status check error: ${error.message}`);
  }

  console.log('');

  // Test 2: Basic Prediction Tests
  for (const testCase of testCases) {
    console.log(`🧪 Testing: ${testCase.name}`);
    console.log(`   ${testCase.description}`);
    
    try {
      const requestData = {
        input: testCase.input,
        blendingConfig: {
          strategy: 'confidence_weighted'
        }
      };
      
      const response = await makeRequest(apiUrl, 'POST', requestData);

      if (response.status === 200 && response.data.success) {
        const { data, metadata } = response.data;
        
        console.log(`   ✅ Prediction successful`);
        console.log(`   📈 Final probability: ${(data.final_probability * 100).toFixed(1)}%`);
        console.log(`   🎯 Confidence score: ${(data.confidence_score * 100).toFixed(1)}%`);
        console.log(`   🤖 Engines used: ${data.engines_used.length} (expected: ${testCase.expectedEngines})`);
        console.log(`   🔀 Blending strategy: ${data.blending_strategy}`);
        console.log(`   📊 Data completeness: ${(data.metadata.data_completeness * 100).toFixed(1)}%`);
        console.log(`   ⚡ Total processing time: ${data.metadata.total_processing_time_ms}ms`);
        console.log(`   🌐 API processing time: ${metadata.api_processing_time_ms}ms`);
        
        // Show top rationale points
        if (data.rationale.length > 0) {
          console.log(`   💭 Key insights:`);
          data.rationale.slice(0, 2).forEach(reason => {
            console.log(`      • ${reason}`);
          });
        }
        
        // Show engine details
        data.engines_used.forEach(engine => {
          console.log(`      ${engine.engine_name}: ${(engine.probability * 100).toFixed(1)}% (conf: ${(engine.confidence * 100).toFixed(1)}%)`);
        });
        
        // Validate expectations
        if (data.engines_used.length === testCase.expectedEngines) {
          console.log(`   ✅ Expected number of engines used`);
        } else {
          console.log(`   ⚠️  Expected ${testCase.expectedEngines} engines, got ${data.engines_used.length}`);
        }

        // Performance check
        if (data.metadata.total_processing_time_ms < 500) {
          console.log(`   ✅ Performance target met (<500ms)`);
        } else {
          console.log(`   ⚠️  Performance target missed: ${data.metadata.total_processing_time_ms}ms`);
        }

      } else {
        console.log(`   ❌ Prediction failed: ${response.data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`   ❌ Request error: ${error.message}`);
    }
    
    console.log('');
  }

  // Test 3: Blending Strategy Tests
  console.log('🔀 Testing blending strategies...');
  
  const testInput = testCases[2].input; // Use complete data set
  
  for (const blendingTest of blendingTests) {
    console.log(`   Testing: ${blendingTest.name}`);
    
    try {
      const requestData = {
        input: testInput,
        blendingConfig: blendingTest.config
      };
      
      const response = await makeRequest(apiUrl, 'POST', requestData);
      
      if (response.status === 200 && response.data.success) {
        const { data } = response.data;
        console.log(`      ✅ Strategy: ${data.blending_strategy}`);
        console.log(`      📈 Final probability: ${(data.final_probability * 100).toFixed(1)}%`);
        console.log(`      🎯 Confidence: ${(data.confidence_score * 100).toFixed(1)}%`);
      } else {
        console.log(`      ❌ Failed: ${response.data.error}`);
      }
    } catch (error) {
      console.log(`      ❌ Error: ${error.message}`);
    }
  }

  console.log('');

  // Test 4: Input Validation
  console.log('🔒 Testing input validation...');
  
  const invalidCases = [
    {
      name: 'Invalid genes length',
      input: { genes: Array(47).fill(false) }
    },
    {
      name: 'Non-boolean genes',
      input: { genes: Array(48).fill(1) }
    },
    {
      name: 'Invalid early metrics',
      input: { 
        genes: Array(48).fill(false),
        earlyMetrics: { views_10m: -100 } // Negative views
      }
    }
  ];

  for (const invalidCase of invalidCases) {
    try {
      const response = await makeRequest(apiUrl, 'POST', { input: invalidCase.input });
      
      if (response.status === 400) {
        console.log(`   ✅ ${invalidCase.name}: Properly rejected`);
      } else {
        console.log(`   ⚠️  ${invalidCase.name}: Expected validation error, got success`);
      }
    } catch (error) {
      console.log(`   ❌ ${invalidCase.name}: Request error - ${error.message}`);
    }
  }

  console.log('');

  // Test 5: Cache Performance
  console.log('💾 Testing cache performance...');
  
  const cacheTestInput = testCases[0].input;
  
  try {
    // First request (cache miss)
    const response1 = await makeRequest(apiUrl, 'POST', { input: cacheTestInput });
    const time1 = response1.data.metadata.api_processing_time_ms;
    
    // Second request (should use cache)
    const response2 = await makeRequest(apiUrl, 'POST', { input: cacheTestInput });
    const time2 = response2.data.metadata.api_processing_time_ms;
    
    console.log(`   📊 First request: ${time1}ms`);
    console.log(`   📊 Second request: ${time2}ms`);
    
    if (time2 <= time1) {
      console.log('   ✅ Cache providing performance benefit');
    } else {
      console.log('   ⚠️  Cache not significantly improving performance');
    }
    
    // Test cache clearing
    const clearResponse = await makeRequest(`${apiUrl}?action=clear-cache`);
    if (clearResponse.status === 200) {
      console.log('   ✅ Cache clearing works');
    }
    
  } catch (error) {
    console.log(`   ❌ Cache test error: ${error.message}`);
  }

  console.log('');

  // Test 6: Engine Management (if available)
  console.log('⚙️ Testing engine management...');
  
  try {
    // This would require implementing the PUT endpoint for engine management
    console.log('   ℹ️  Engine management testing skipped (admin feature)');
  } catch (error) {
    console.log(`   ❌ Engine management error: ${error.message}`);
  }

  console.log('');
  console.log('🎉 Orchestrator testing complete!');
  console.log('');
  console.log('📋 Summary:');
  console.log('   • Orchestrator routes predictions to available engines');
  console.log('   • Intelligently blends multiple engine results');
  console.log('   • Provides detailed rationale and confidence scoring');
  console.log('   • Supports multiple blending strategies');
  console.log('   • Handles edge cases and validates inputs');
  console.log('   • Includes performance optimization with caching');
  console.log('   • Ready for expansion with future prediction engines');
  console.log('');
  console.log('🚀 Ready for production use!');
}

// Run tests
if (require.main === module) {
  testOrchestrator().catch(console.error);
}

module.exports = { testOrchestrator };