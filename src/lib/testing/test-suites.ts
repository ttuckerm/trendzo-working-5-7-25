/**
 * PRE-BUILT TEST SUITES FOR VIRAL PREDICTION ALGORITHMS
 * 
 * 🎯 COMPREHENSIVE TEST COVERAGE:
 * - Accuracy validation across niches and platforms
 * - Performance benchmarking under various loads
 * - Edge case testing and error handling
 * - Regression testing for optimization changes
 * - A/B testing for algorithm versions
 * 
 * SUITES:
 * - AccuracyTestSuite: Algorithm accuracy validation
 * - PerformanceTestSuite: Speed and efficiency testing
 * - LoadTestSuite: Stress testing and scalability
 * - RegressionTestSuite: Change impact validation
 * - EdgeCaseTestSuite: Boundary condition testing
 * - ABTestSuite: Algorithm version comparison
 */

import { testFrameworkCore } from './test-framework-core';

// ===== TEST DATA SETS =====

const FITNESS_TEST_CASES = [
  {
    name: "Fitness Transformation Hook",
    description: "Classic fitness transformation content with authority hook",
    content: "I lost 50 pounds in 90 days using this simple morning routine. Here's exactly what I did every single day to transform my body.",
    hashtags: ["fitness", "transformation", "weightloss", "morning", "routine"],
    platform: "tiktok" as const,
    creator_followers: 25000,
    niche: "fitness",
    video_length: 45,
    expected_viral_score_range: [75, 95],
    expected_confidence: 0.85
  },
  {
    name: "Quick Fitness Hack",
    description: "Short form fitness hack content",
    content: "This 30-second exercise burns more calories than 30 minutes on the treadmill. Fitness trainers hate this simple trick.",
    hashtags: ["fitness", "hack", "calories", "exercise", "quicktip"],
    platform: "instagram" as const,
    creator_followers: 45000,
    niche: "fitness",
    video_length: 30,
    expected_viral_score_range: [80, 95],
    expected_confidence: 0.88
  }
];

const BUSINESS_TEST_CASES = [
  {
    name: "Business Success Story",
    description: "Entrepreneurship success story with credible numbers",
    content: "How I built a $100k/month business in 6 months starting with $500. Here's my exact strategy and the 3 mistakes that almost killed it.",
    hashtags: ["business", "entrepreneur", "success", "strategy", "startup"],
    platform: "youtube" as const,
    creator_followers: 150000,
    niche: "business",
    video_length: 120,
    expected_viral_score_range: [70, 90],
    expected_confidence: 0.82
  },
  {
    name: "Quick Business Tip",
    description: "Short actionable business advice",
    content: "The one email template that increased my sales by 300%. I've used this exact script to generate over $2M in revenue.",
    hashtags: ["business", "sales", "email", "marketing", "revenue"],
    platform: "twitter" as const,
    creator_followers: 75000,
    niche: "business",
    video_length: 60,
    expected_viral_score_range: [75, 92],
    expected_confidence: 0.86
  }
];

const LIFESTYLE_TEST_CASES = [
  {
    name: "Life Hack Content",
    description: "Practical lifestyle improvement tip",
    content: "This simple morning habit changed my entire life. I've been doing it for 365 days and here's what happened to my productivity.",
    hashtags: ["lifestyle", "morning", "habit", "productivity", "selfcare"],
    platform: "tiktok" as const,
    creator_followers: 35000,
    niche: "lifestyle",
    video_length: 55,
    expected_viral_score_range: [68, 88],
    expected_confidence: 0.78
  }
];

const EDGE_CASE_TEST_CASES = [
  {
    name: "Empty Content",
    description: "Edge case: empty content string",
    content: "",
    hashtags: [],
    platform: "tiktok" as const,
    creator_followers: 1000,
    niche: "general",
    video_length: 30,
    expected_viral_score_range: [0, 30],
    expected_confidence: 0.2
  },
  {
    name: "Very Long Content",
    description: "Edge case: extremely long content",
    content: "This is an extremely long piece of content that goes on and on and on with way too much text that no one would realistically use in a short-form video. It's designed to test how the algorithm handles excessively verbose input that exceeds normal content length expectations. The content continues to ramble about nothing in particular, just adding more and more words to see if the system can handle it gracefully without breaking or producing unrealistic results. This type of edge case testing is important for ensuring robustness in production environments where users might input unexpected data.",
    hashtags: ["test", "long", "content", "edge", "case"],
    platform: "youtube" as const,
    creator_followers: 50000,
    niche: "testing",
    video_length: 300,
    expected_viral_score_range: [20, 60],
    expected_confidence: 0.4
  },
  {
    name: "Special Characters",
    description: "Edge case: content with special characters and emojis",
    content: "🔥💯 Test content with émojis and spëcial characters! Does the algorithm handle ñon-ASCII text? #test @mentions & more!!!",
    hashtags: ["special", "characters", "emoji", "test", "unicode"],
    platform: "instagram" as const,
    creator_followers: 25000,
    niche: "testing",
    video_length: 40,
    expected_viral_score_range: [40, 80],
    expected_confidence: 0.6
  }
];

// ===== TEST SUITE DEFINITIONS =====

export class TestSuiteCollection {
  private static instance: TestSuiteCollection;
  private suiteIds: Map<string, string> = new Map();
  
  private constructor() {
    this.initializeTestSuites();
  }
  
  public static getInstance(): TestSuiteCollection {
    if (!TestSuiteCollection.instance) {
      TestSuiteCollection.instance = new TestSuiteCollection();
    }
    return TestSuiteCollection.instance;
  }
  
  private initializeTestSuites(): void {
    console.log('🧪 Initializing pre-built test suites...');
    
    // Create all test suites
    this.createAccuracyTestSuite();
    this.createPerformanceTestSuite();
    this.createLoadTestSuite();
    this.createRegressionTestSuite();
    this.createEdgeCaseTestSuite();
    this.createABTestSuite();
    
    console.log(`✅ Initialized ${this.suiteIds.size} test suites`);
  }
  
  private createAccuracyTestSuite(): void {
    const testCases = [
      ...this.buildTestCasesFromData(FITNESS_TEST_CASES, 'accuracy'),
      ...this.buildTestCasesFromData(BUSINESS_TEST_CASES, 'accuracy'),
      ...this.buildTestCasesFromData(LIFESTYLE_TEST_CASES, 'accuracy')
    ];
    
    const suiteId = testFrameworkCore.createTestSuite({
      name: "Algorithm Accuracy Validation",
      description: "Comprehensive accuracy testing across different niches and content types",
      test_cases: testCases,
      suite_config: {
        parallel_execution: true,
        fail_fast: false,
        retry_failed_tests: true,
        generate_report: true
      }
    });
    
    this.suiteIds.set('accuracy', suiteId);
    console.log(`✅ Created Accuracy Test Suite: ${testCases.length} test cases`);
  }
  
  private createPerformanceTestSuite(): void {
    const testCases = [
      ...this.buildPerformanceTestCases('speed_optimization'),
      ...this.buildPerformanceTestCases('memory_optimization'),
      ...this.buildPerformanceTestCases('cache_performance')
    ];
    
    const suiteId = testFrameworkCore.createTestSuite({
      name: "Performance Benchmarking",
      description: "Speed, memory, and resource utilization testing",
      test_cases: testCases,
      suite_config: {
        parallel_execution: true,
        fail_fast: false,
        retry_failed_tests: false,
        generate_report: true
      }
    });
    
    this.suiteIds.set('performance', suiteId);
    console.log(`✅ Created Performance Test Suite: ${testCases.length} test cases`);
  }
  
  private createLoadTestSuite(): void {
    const testCases = [
      ...this.buildLoadTestCases('concurrent_users'),
      ...this.buildLoadTestCases('high_throughput'),
      ...this.buildLoadTestCases('stress_testing')
    ];
    
    const suiteId = testFrameworkCore.createTestSuite({
      name: "Load Testing & Scalability",
      description: "System behavior under various load conditions",
      test_cases: testCases,
      suite_config: {
        parallel_execution: false, // Sequential for load testing
        fail_fast: false,
        retry_failed_tests: false,
        generate_report: true
      }
    });
    
    this.suiteIds.set('load', suiteId);
    console.log(`✅ Created Load Test Suite: ${testCases.length} test cases`);
  }
  
  private createRegressionTestSuite(): void {
    // Use a subset of known good test cases for regression testing
    const baselineCases = [
      ...this.buildTestCasesFromData(FITNESS_TEST_CASES.slice(0, 1), 'regression'),
      ...this.buildTestCasesFromData(BUSINESS_TEST_CASES.slice(0, 1), 'regression')
    ];
    
    const suiteId = testFrameworkCore.createTestSuite({
      name: "Regression Testing",
      description: "Validate that optimizations don't break existing functionality",
      test_cases: baselineCases,
      suite_config: {
        parallel_execution: true,
        fail_fast: true, // Fail fast for regression issues
        retry_failed_tests: true,
        generate_report: true
      }
    });
    
    this.suiteIds.set('regression', suiteId);
    console.log(`✅ Created Regression Test Suite: ${baselineCases.length} test cases`);
  }
  
  private createEdgeCaseTestSuite(): void {
    const testCases = this.buildTestCasesFromData(EDGE_CASE_TEST_CASES, 'edge_case');
    
    const suiteId = testFrameworkCore.createTestSuite({
      name: "Edge Case Testing",
      description: "Boundary conditions and error handling validation",
      test_cases: testCases,
      suite_config: {
        parallel_execution: true,
        fail_fast: false,
        retry_failed_tests: false,
        generate_report: true
      }
    });
    
    this.suiteIds.set('edge_cases', suiteId);
    console.log(`✅ Created Edge Case Test Suite: ${testCases.length} test cases`);
  }
  
  private createABTestSuite(): void {
    // Create A/B test cases comparing different optimization strategies
    const testCases = [
      ...this.buildABTestCases('speed_vs_accuracy'),
      ...this.buildABTestCases('cache_strategies'),
      ...this.buildABTestCases('algorithm_versions')
    ];
    
    const suiteId = testFrameworkCore.createTestSuite({
      name: "A/B Testing",
      description: "Compare different algorithm versions and optimization strategies",
      test_cases: testCases,
      suite_config: {
        parallel_execution: true,
        fail_fast: false,
        retry_failed_tests: false,
        generate_report: true
      }
    });
    
    this.suiteIds.set('ab_test', suiteId);
    console.log(`✅ Created A/B Test Suite: ${testCases.length} test cases`);
  }
  
  // ===== TEST CASE BUILDERS =====
  
  private buildTestCasesFromData(dataSet: any[], category: string): any[] {
    return dataSet.map((data, index) => ({
      id: `${category}_${index + 1}_${Date.now()}`,
      name: data.name,
      description: data.description,
      category: category as any,
      priority: 'high' as const,
      
      input: {
        content: data.content,
        hashtags: data.hashtags,
        platform: data.platform,
        creator_followers: data.creator_followers,
        niche: data.niche,
        video_length: data.video_length,
        visual_quality: 85,
        audio_quality: 80
      },
      
      expected: {
        viral_score_range: data.expected_viral_score_range as [number, number],
        confidence_threshold: data.expected_confidence,
        processing_time_max_ms: 2000
      },
      
      config: {
        timeout_ms: 10000,
        retry_count: 2,
        parallel_execution: true,
        validation_strict: category === 'regression'
      },
      
      tags: [category, data.niche, data.platform],
      created_at: new Date(),
      last_updated: new Date()
    }));
  }
  
  private buildPerformanceTestCases(testType: string): any[] {
    const baseCase = FITNESS_TEST_CASES[0];
    
    const cases = [];
    
    switch (testType) {
      case 'speed_optimization':
        cases.push({
          name: `Speed Test - ${testType}`,
          description: "Test prediction speed with optimization enabled",
          content: baseCase.content,
          hashtags: baseCase.hashtags,
          platform: baseCase.platform,
          creator_followers: baseCase.creator_followers,
          niche: baseCase.niche,
          video_length: baseCase.video_length,
          expected_viral_score_range: [60, 100],
          expected_confidence: 0.7,
          max_processing_time: 100 // <100ms target
        });
        break;
        
      case 'memory_optimization':
        cases.push({
          name: `Memory Test - ${testType}`,
          description: "Test memory usage during prediction",
          content: baseCase.content.repeat(5), // Larger content
          hashtags: baseCase.hashtags,
          platform: baseCase.platform,
          creator_followers: baseCase.creator_followers,
          niche: baseCase.niche,
          video_length: baseCase.video_length,
          expected_viral_score_range: [50, 100],
          expected_confidence: 0.6,
          max_processing_time: 500
        });
        break;
        
      case 'cache_performance':
        // Test cache hit rates
        cases.push({
          name: `Cache Test - ${testType}`,
          description: "Test cache performance with repeated requests",
          content: baseCase.content,
          hashtags: baseCase.hashtags,
          platform: baseCase.platform,
          creator_followers: baseCase.creator_followers,
          niche: baseCase.niche,
          video_length: baseCase.video_length,
          expected_viral_score_range: [70, 100],
          expected_confidence: 0.8,
          max_processing_time: 50 // Should be fast due to caching
        });
        break;
    }
    
    return this.buildTestCasesFromData(cases, 'performance');
  }
  
  private buildLoadTestCases(testType: string): any[] {
    const baseCase = BUSINESS_TEST_CASES[0];
    
    const cases = [];
    
    switch (testType) {
      case 'concurrent_users':
        for (let users = 5; users <= 20; users += 5) {
          cases.push({
            name: `Concurrent Users Test - ${users} users`,
            description: `Test system with ${users} concurrent users`,
            content: baseCase.content,
            hashtags: baseCase.hashtags,
            platform: baseCase.platform,
            creator_followers: baseCase.creator_followers,
            niche: baseCase.niche,
            video_length: baseCase.video_length,
            expected_viral_score_range: [50, 100],
            expected_confidence: 0.7,
            max_processing_time: 1000,
            concurrent_users: users
          });
        }
        break;
        
      case 'high_throughput':
        cases.push({
          name: "High Throughput Test",
          description: "Test maximum throughput capacity",
          content: baseCase.content,
          hashtags: baseCase.hashtags,
          platform: baseCase.platform,
          creator_followers: baseCase.creator_followers,
          niche: baseCase.niche,
          video_length: baseCase.video_length,
          expected_viral_score_range: [40, 100],
          expected_confidence: 0.6,
          max_processing_time: 2000,
          requests_per_second: 50
        });
        break;
        
      case 'stress_testing':
        cases.push({
          name: "Stress Test - Extended Load",
          description: "Extended load testing to find breaking points",
          content: baseCase.content,
          hashtags: baseCase.hashtags,
          platform: baseCase.platform,
          creator_followers: baseCase.creator_followers,
          niche: baseCase.niche,
          video_length: baseCase.video_length,
          expected_viral_score_range: [30, 100],
          expected_confidence: 0.5,
          max_processing_time: 5000,
          duration_minutes: 10
        });
        break;
    }
    
    return this.buildTestCasesFromData(cases, 'load');
  }
  
  private buildABTestCases(testType: string): any[] {
    const baseCase = FITNESS_TEST_CASES[0];
    
    const cases = [];
    
    switch (testType) {
      case 'speed_vs_accuracy':
        cases.push(
          {
            name: "A/B Test - Speed Optimized",
            description: "Test with speed-prioritized optimization",
            content: baseCase.content,
            hashtags: baseCase.hashtags,
            platform: baseCase.platform,
            creator_followers: baseCase.creator_followers,
            niche: baseCase.niche,
            video_length: baseCase.video_length,
            expected_viral_score_range: [70, 95],
            expected_confidence: 0.8,
            optimization_mode: 'speed'
          },
          {
            name: "A/B Test - Accuracy Optimized",
            description: "Test with accuracy-prioritized optimization",
            content: baseCase.content,
            hashtags: baseCase.hashtags,
            platform: baseCase.platform,
            creator_followers: baseCase.creator_followers,
            niche: baseCase.niche,
            video_length: baseCase.video_length,
            expected_viral_score_range: [75, 98],
            expected_confidence: 0.9,
            optimization_mode: 'accuracy'
          }
        );
        break;
        
      case 'cache_strategies':
        cases.push(
          {
            name: "A/B Test - Aggressive Caching",
            description: "Test with aggressive cache strategy",
            content: baseCase.content,
            hashtags: baseCase.hashtags,
            platform: baseCase.platform,
            creator_followers: baseCase.creator_followers,
            niche: baseCase.niche,
            video_length: baseCase.video_length,
            expected_viral_score_range: [65, 95],
            expected_confidence: 0.75,
            cache_strategy: 'aggressive'
          },
          {
            name: "A/B Test - Conservative Caching",
            description: "Test with conservative cache strategy",
            content: baseCase.content,
            hashtags: baseCase.hashtags,
            platform: baseCase.platform,
            creator_followers: baseCase.creator_followers,
            niche: baseCase.niche,
            video_length: baseCase.video_length,
            expected_viral_score_range: [70, 98],
            expected_confidence: 0.85,
            cache_strategy: 'conservative'
          }
        );
        break;
        
      case 'algorithm_versions':
        cases.push(
          {
            name: "A/B Test - Optimized Algorithm",
            description: "Test with optimized algorithm version",
            content: baseCase.content,
            hashtags: baseCase.hashtags,
            platform: baseCase.platform,
            creator_followers: baseCase.creator_followers,
            niche: baseCase.niche,
            video_length: baseCase.video_length,
            expected_viral_score_range: [75, 98],
            expected_confidence: 0.9,
            algorithm_version: 'optimized'
          },
          {
            name: "A/B Test - Standard Algorithm",
            description: "Test with standard algorithm version",
            content: baseCase.content,
            hashtags: baseCase.hashtags,
            platform: baseCase.platform,
            creator_followers: baseCase.creator_followers,
            niche: baseCase.niche,
            video_length: baseCase.video_length,
            expected_viral_score_range: [65, 90],
            expected_confidence: 0.8,
            algorithm_version: 'standard'
          }
        );
        break;
    }
    
    return this.buildTestCasesFromData(cases, 'ab_test');
  }
  
  // ===== PUBLIC API =====
  
  /**
   * Get all available test suites
   */
  getAvailableTestSuites(): Array<{ name: string; id: string; description: string }> {
    const suites = testFrameworkCore.getTestSuites();
    
    return suites.map(suite => ({
      name: suite.name,
      id: suite.id,
      description: suite.description
    }));
  }
  
  /**
   * Get test suite by name
   */
  getTestSuiteId(suiteName: string): string | undefined {
    return this.suiteIds.get(suiteName);
  }
  
  /**
   * Run quick validation test
   */
  async runQuickValidation(): Promise<any> {
    const accuracySuiteId = this.suiteIds.get('accuracy');
    if (!accuracySuiteId) {
      throw new Error('Accuracy test suite not found');
    }
    
    console.log('🚀 Running quick algorithm validation...');
    
    const result = await testFrameworkCore.executeTestSuite(accuracySuiteId, {
      parallel: true,
      fail_fast: false,
      include_benchmarks: false,
      generate_report: true
    });
    
    return {
      success_rate: result.summary.success_rate,
      average_accuracy: result.summary.average_accuracy,
      average_response_time: result.summary.average_response_time,
      total_tests: result.summary.total_tests,
      passed_tests: result.summary.passed_tests,
      failed_tests: result.summary.failed_tests
    };
  }
  
  /**
   * Run comprehensive testing
   */
  async runComprehensiveTest(): Promise<any> {
    console.log('🧪 Running comprehensive algorithm testing...');
    
    const results = [];
    
    // Run all test suites
    for (const [suiteName, suiteId] of this.suiteIds.entries()) {
      try {
        console.log(`📋 Running ${suiteName} test suite...`);
        
        const result = await testFrameworkCore.executeTestSuite(suiteId, {
          parallel: true,
          fail_fast: false,
          include_benchmarks: suiteName === 'performance',
          generate_report: true
        });
        
        results.push({
          suite_name: suiteName,
          suite_id: suiteId,
          success_rate: result.summary.success_rate,
          test_count: result.summary.total_tests,
          average_response_time: result.summary.average_response_time,
          status: result.status
        });
        
      } catch (error) {
        console.error(`❌ Failed to run ${suiteName} test suite:`, error);
        results.push({
          suite_name: suiteName,
          suite_id: suiteId,
          success_rate: 0,
          test_count: 0,
          average_response_time: 0,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    // Calculate overall statistics
    const totalTests = results.reduce((sum, r) => sum + r.test_count, 0);
    const weightedSuccessRate = results.reduce((sum, r) => sum + (r.success_rate * r.test_count), 0) / totalTests;
    const averageResponseTime = results.reduce((sum, r) => sum + r.average_response_time, 0) / results.length;
    
    console.log('✅ Comprehensive testing completed');
    console.log(`📊 Overall Success Rate: ${weightedSuccessRate.toFixed(1)}%`);
    console.log(`⚡ Average Response Time: ${averageResponseTime.toFixed(1)}ms`);
    
    return {
      overall_success_rate: weightedSuccessRate,
      average_response_time: averageResponseTime,
      total_tests: totalTests,
      suite_results: results,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Create custom test suite
   */
  createCustomTestSuite(name: string, description: string, testData: any[]): string {
    const testCases = this.buildTestCasesFromData(testData, 'custom');
    
    const suiteId = testFrameworkCore.createTestSuite({
      name,
      description,
      test_cases: testCases,
      suite_config: {
        parallel_execution: true,
        fail_fast: false,
        retry_failed_tests: true,
        generate_report: true
      }
    });
    
    this.suiteIds.set(`custom_${Date.now()}`, suiteId);
    
    return suiteId;
  }
}

// Export singleton instance
export const testSuiteCollection = TestSuiteCollection.getInstance();