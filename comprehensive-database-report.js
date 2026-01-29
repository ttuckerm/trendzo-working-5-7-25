/**
 * Comprehensive Database Report Generator
 * 
 * This script generates a complete report comparing:
 * 1. What tables exist in the database
 * 2. What tables the code expects to exist
 * 3. Schema gaps and data flow issues
 * 4. Recommendations for fixing the viral prediction workflow
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Define expected tables based on code analysis
const expectedTables = {
  // Core viral prediction workflow
  core_workflow: [
    'scraped_data',
    'viral_predictions', 
    'apify_runs',
    'videos',
    'engagement_snapshots'
  ],
  
  // AI and ML analysis
  ai_analysis: [
    'video_genes',
    'viral_dna_sequences',
    'psychological_engagement',
    'production_quality',
    'perspective_analysis',
    'cultural_timing'
  ],
  
  // Template system
  template_system: [
    'viral_templates',
    'template_generators',
    'template_intelligence',
    'optimization_history'
  ],
  
  // Framework and pattern detection
  framework_system: [
    'hook_frameworks',
    'video_hooks',
    'pattern_matches'
  ],
  
  // Processing modules
  processing_modules: [
    'viral_filters',
    'evolution_engines',
    'feature_decomposers',
    'gene_taggers'
  ],
  
  // User and admin systems
  user_systems: [
    'users',
    'limited_users',
    'user_analytics',
    'success_stories'
  ],
  
  // Analytics and tracking
  analytics: [
    'analytics_events',
    'prediction_validation',
    'accuracy_metrics',
    'performance_metrics'
  ],
  
  // Content and recommendations
  content_systems: [
    'viral_approval_queue',
    'viral_recipe_book',
    'content_series',
    'series_episodes'
  ],
  
  // Advanced features
  advanced_features: [
    'cross_platform_signals',
    'comment_analysis',
    'ai_conversations',
    'system_learnings'
  ],
  
  // Marketing and inception
  marketing_systems: [
    'marketing_campaigns',
    'marketing_conversions',
    'marketing_templates',
    'inception_analytics'
  ],
  
  // System monitoring
  system_monitoring: [
    'module_status',
    'pipeline_flows',
    'api_performance',
    'security_events'
  ]
};

// API endpoints and their table dependencies
const apiTableDependencies = {
  '/api/viral-prediction/analyze': ['scraped_data', 'viral_predictions', 'videos'],
  '/api/admin/run-viral-filter': ['viral_filters', 'scraped_data'],
  '/api/admin/run-apify-scraper': ['apify_runs', 'scraped_data'],
  '/api/admin/template-generator': ['template_generators', 'viral_templates'],
  '/api/admin/evolution-engine': ['evolution_engines', 'viral_dna_sequences'],
  '/api/brain/route': ['ai_conversations', 'system_learnings'],
  '/api/dna-detective/predict': ['video_genes', 'viral_dna_sequences'],
  '/api/orchestrator/predict': ['viral_predictions', 'videos'],
  '/api/recipe-book/route': ['viral_recipe_book', 'viral_templates'],
  '/api/admin/viral-prediction': ['viral_predictions', 'videos', 'accuracy_metrics']
};

async function getExistingTables() {
  const existingTables = [];
  const allExpectedTables = Object.values(expectedTables).flat();
  
  for (const table of allExpectedTables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (!error) {
        existingTables.push(table);
      }
    } catch (e) {
      // Table doesn't exist
    }
  }
  
  return existingTables;
}

async function getTableDetails(tableName) {
  try {
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      return { exists: false, error: countError.message };
    }
    
    const { data: sampleData, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    let columns = [];
    if (sampleData && sampleData.length > 0) {
      columns = Object.keys(sampleData[0]);
    }
    
    return {
      exists: true,
      count: count || 0,
      columns,
      hasData: count > 0
    };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

async function analyzeWorkflowGaps() {
  const gaps = [];
  
  // Check core workflow
  const coreWorkflow = expectedTables.core_workflow;
  const workflowStatus = {};
  
  for (const table of coreWorkflow) {
    workflowStatus[table] = await getTableDetails(table);
  }
  
  // Identify gaps
  if (workflowStatus.scraped_data?.hasData && !workflowStatus.viral_predictions?.hasData) {
    gaps.push({
      type: 'data_flow',
      description: 'Data exists in scraped_data but viral_predictions is empty',
      impact: 'High - prediction pipeline not functioning',
      tables: ['scraped_data', 'viral_predictions']
    });
  }
  
  if (!workflowStatus.videos?.exists) {
    gaps.push({
      type: 'missing_table',
      description: 'Core videos table missing - many APIs will fail',
      impact: 'Critical - entire system dependent on videos table',
      tables: ['videos']
    });
  }
  
  // Check API dependencies
  for (const [endpoint, tables] of Object.entries(apiTableDependencies)) {
    const missingTables = [];
    for (const table of tables) {
      const details = await getTableDetails(table);
      if (!details.exists) {
        missingTables.push(table);
      }
    }
    
    if (missingTables.length > 0) {
      gaps.push({
        type: 'api_dependency',
        description: `${endpoint} missing required tables`,
        impact: 'High - API endpoint will fail',
        tables: missingTables,
        endpoint
      });
    }
  }
  
  return gaps;
}

async function generateRecommendations(existingTables, gaps) {
  const recommendations = [];
  
  // Schema deployment recommendations
  const missingCoreTables = expectedTables.core_workflow.filter(
    table => !existingTables.includes(table)
  );
  
  if (missingCoreTables.length > 0) {
    recommendations.push({
      priority: 'CRITICAL',
      category: 'Schema Deployment',
      title: 'Deploy Core Viral Prediction Schema',
      description: `Missing ${missingCoreTables.length} core tables needed for viral prediction workflow`,
      action: 'Run setup-viral-prediction-database.sql script',
      tables: missingCoreTables,
      impact: 'Fixes core workflow, enables viral prediction system'
    });
  }
  
  // Data flow recommendations
  const dataFlowGaps = gaps.filter(gap => gap.type === 'data_flow');
  if (dataFlowGaps.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Data Processing',
      title: 'Fix Data Pipeline Processing',
      description: 'Data exists but is not being processed through the pipeline',
      action: 'Run viral prediction analysis on existing scraped data',
      tables: ['scraped_data', 'viral_predictions'],
      impact: 'Generates predictions from existing data'
    });
  }
  
  // API functionality recommendations
  const apiGaps = gaps.filter(gap => gap.type === 'api_dependency');
  if (apiGaps.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'API Functionality',
      title: 'Fix API Dependencies',
      description: `${apiGaps.length} API endpoints will fail due to missing tables`,
      action: 'Deploy missing table schemas for API dependencies',
      tables: [...new Set(apiGaps.flatMap(gap => gap.tables))],
      impact: 'Restores API functionality'
    });
  }
  
  // Template system recommendations
  const templateTables = expectedTables.template_system.filter(
    table => !existingTables.includes(table)
  );
  
  if (templateTables.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Template System',
      title: 'Enable Template Generation',
      description: 'Template system tables missing - no template generation possible',
      action: 'Deploy template system schema',
      tables: templateTables,
      impact: 'Enables template creation and optimization features'
    });
  }
  
  // User system recommendations
  const userTables = expectedTables.user_systems.filter(
    table => !existingTables.includes(table)
  );
  
  if (userTables.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'User Management',
      title: 'Deploy User Management System',
      description: 'User tables missing - limited user features unavailable',
      action: 'Deploy user management schema',
      tables: userTables,
      impact: 'Enables user management and analytics tracking'
    });
  }
  
  return recommendations;
}

async function generateComprehensiveReport() {
  console.log('🔍 COMPREHENSIVE DATABASE ANALYSIS REPORT');
  console.log('=' .repeat(60));
  console.log(`Generated: ${new Date().toISOString()}`);
  console.log(`Database: ${supabaseUrl}\n`);
  
  // Get existing tables
  const existingTables = await getExistingTables();
  
  // Analyze each category
  const report = {
    summary: {
      totalExpected: Object.values(expectedTables).flat().length,
      totalExisting: existingTables.length,
      tablesWithData: 0,
      emptyTables: 0
    },
    categories: {},
    gaps: [],
    recommendations: []
  };
  
  // Analyze by category
  for (const [category, tables] of Object.entries(expectedTables)) {
    const categoryReport = {
      expected: tables.length,
      existing: 0,
      missing: 0,
      withData: 0,
      empty: 0,
      tables: {}
    };
    
    for (const table of tables) {
      const details = await getTableDetails(table);
      categoryReport.tables[table] = details;
      
      if (details.exists) {
        categoryReport.existing++;
        if (details.hasData) {
          categoryReport.withData++;
          report.summary.tablesWithData++;
        } else {
          categoryReport.empty++;
          report.summary.emptyTables++;
        }
      } else {
        categoryReport.missing++;
      }
    }
    
    report.categories[category] = categoryReport;
  }
  
  // Analyze workflow gaps
  report.gaps = await analyzeWorkflowGaps();
  
  // Generate recommendations
  report.recommendations = await generateRecommendations(existingTables, report.gaps);
  
  // Print report
  console.log('📊 EXECUTIVE SUMMARY');
  console.log('-'.repeat(40));
  console.log(`Total Expected Tables: ${report.summary.totalExpected}`);
  console.log(`Total Existing Tables: ${report.summary.totalExisting}`);
  console.log(`Tables with Data: ${report.summary.tablesWithData}`);
  console.log(`Empty Tables: ${report.summary.emptyTables}`);
  console.log(`Missing Tables: ${report.summary.totalExpected - report.summary.totalExisting}`);
  console.log(`Completion Rate: ${((report.summary.totalExisting / report.summary.totalExpected) * 100).toFixed(1)}%`);
  
  console.log('\n📋 CATEGORY ANALYSIS');
  console.log('-'.repeat(40));
  
  for (const [category, data] of Object.entries(report.categories)) {
    const completionRate = (data.existing / data.expected) * 100;
    const dataRate = data.existing > 0 ? (data.withData / data.existing) * 100 : 0;
    
    console.log(`\n${category.replace(/_/g, ' ').toUpperCase()}:`);
    console.log(`  Expected: ${data.expected}, Existing: ${data.existing}, Missing: ${data.missing}`);
    console.log(`  Completion: ${completionRate.toFixed(1)}%, Data Population: ${dataRate.toFixed(1)}%`);
    
    if (data.missing > 0) {
      const missingTables = Object.entries(data.tables)
        .filter(([table, details]) => !details.exists)
        .map(([table]) => table);
      console.log(`  Missing tables: ${missingTables.join(', ')}`);
    }
    
    if (data.withData > 0) {
      const tablesWithData = Object.entries(data.tables)
        .filter(([table, details]) => details.hasData)
        .map(([table, details]) => `${table} (${details.count} rows)`);
      console.log(`  Tables with data: ${tablesWithData.join(', ')}`);
    }
  }
  
  console.log('\n⚠️  WORKFLOW GAPS IDENTIFIED');
  console.log('-'.repeat(40));
  
  if (report.gaps.length === 0) {
    console.log('✅ No major workflow gaps detected');
  } else {
    report.gaps.forEach((gap, index) => {
      console.log(`\n${index + 1}. ${gap.type.toUpperCase()}: ${gap.description}`);
      console.log(`   Impact: ${gap.impact}`);
      console.log(`   Tables: ${gap.tables.join(', ')}`);
      if (gap.endpoint) {
        console.log(`   Endpoint: ${gap.endpoint}`);
      }
    });
  }
  
  console.log('\n🎯 RECOMMENDATIONS');
  console.log('-'.repeat(40));
  
  report.recommendations.forEach((rec, index) => {
    console.log(`\n${index + 1}. [${rec.priority}] ${rec.title}`);
    console.log(`   Category: ${rec.category}`);
    console.log(`   Description: ${rec.description}`);
    console.log(`   Action: ${rec.action}`);
    console.log(`   Tables: ${rec.tables.join(', ')}`);
    console.log(`   Impact: ${rec.impact}`);
  });
  
  console.log('\n🔧 IMMEDIATE NEXT STEPS');
  console.log('-'.repeat(40));
  
  const criticalRecs = report.recommendations.filter(r => r.priority === 'CRITICAL');
  const highRecs = report.recommendations.filter(r => r.priority === 'HIGH');
  
  if (criticalRecs.length > 0) {
    console.log('\n1. CRITICAL ACTIONS (Do immediately):');
    criticalRecs.forEach(rec => {
      console.log(`   • ${rec.action}`);
    });
  }
  
  if (highRecs.length > 0) {
    console.log('\n2. HIGH PRIORITY ACTIONS (Do next):');
    highRecs.forEach(rec => {
      console.log(`   • ${rec.action}`);
    });
  }
  
  console.log('\n📁 SCRIPT COMMANDS TO RUN');
  console.log('-'.repeat(40));
  console.log('1. Deploy core schema:');
  console.log('   node -e "const { createClient } = require(\'@supabase/supabase-js\'); const fs = require(\'fs\'); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); const sql = fs.readFileSync(\'./scripts/setup-viral-prediction-database.sql\', \'utf8\'); supabase.rpc(\'exec_sql\', { sql }).then(console.log);"');
  
  console.log('\n2. Process existing data:');
  console.log('   node -e "require(\'./scripts/test-viral-prediction-system.js\')"');
  
  console.log('\n3. Verify deployment:');
  console.log('   node database-audit.js');
  
  return report;
}

generateComprehensiveReport().catch(console.error);