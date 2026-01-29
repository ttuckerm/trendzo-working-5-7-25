/**
 * Comprehensive Supabase Database Audit
 * 
 * This script examines the entire Supabase database to determine:
 * 1. What tables actually exist vs what the code references
 * 2. Which tables have real data vs are empty
 * 3. If the schema supports the viral prediction workflow
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tables we expect to exist based on the codebase
const expectedTables = [
  'scraped_data',
  'viral_predictions',
  'apify_runs',
  'video_genes',
  'viral_dna_sequences',
  'viral_filters',
  'template_generators',
  'evolution_engines',
  'feature_decomposers',
  'gene_taggers',
  'hook_frameworks',
  'viral_approval_queue',
  'viral_recipe_book',
  'users',
  'user_templates',
  'sounds',
  'templates',
  'analytics_events',
  'feedback_data',
  'advisor_sessions',
  'orchestrator_runs',
  'dna_detective_results',
  'script_intelligence_data',
  'ab_testing_results',
  'validation_results',
  'success_tracking',
  'prediction_validation'
];

async function getAllTables() {
  console.log('🔍 Discovering all tables in database...\n');
  
  try {
    // Query information_schema to get all tables
    const { data, error } = await supabase.rpc('get_all_tables');
    
    if (error) {
      // If the RPC doesn't exist, try direct query
      const { data: tablesData, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .order('table_name');
      
      if (tablesError) {
        console.log('⚠️  Cannot query information_schema directly, trying alternative approach...');
        
        // Try querying each expected table to see which ones exist
        const existingTables = [];
        for (const table of expectedTables) {
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
      
      return tablesData?.map(t => t.table_name) || [];
    }
    
    return data?.map(t => t.table_name) || [];
  } catch (error) {
    console.error('❌ Error discovering tables:', error.message);
    return [];
  }
}

async function getTableInfo(tableName) {
  try {
    // Get row count
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      return { exists: false, error: countError.message };
    }
    
    // Get sample data (first 3 rows)
    const { data: sampleData, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(3);
    
    if (sampleError) {
      return { exists: true, count, error: sampleError.message };
    }
    
    // Get column information
    let columns = [];
    if (sampleData && sampleData.length > 0) {
      columns = Object.keys(sampleData[0]);
    }
    
    return {
      exists: true,
      count: count || 0,
      columns,
      sampleData: sampleData || [],
      error: null
    };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

async function auditViralPredictionWorkflow() {
  console.log('\n📊 VIRAL PREDICTION WORKFLOW AUDIT');
  console.log('='.repeat(50));
  
  const workflowTables = [
    'scraped_data',
    'viral_predictions', 
    'apify_runs',
    'video_genes',
    'viral_dna_sequences',
    'viral_filters',
    'viral_approval_queue',
    'viral_recipe_book'
  ];
  
  const workflowStatus = {};
  
  for (const table of workflowTables) {
    const info = await getTableInfo(table);
    workflowStatus[table] = info;
    
    if (info.exists) {
      console.log(`✅ ${table}: ${info.count} rows`);
      if (info.count > 0) {
        console.log(`   Sample columns: ${info.columns.join(', ')}`);
      }
    } else {
      console.log(`❌ ${table}: Missing`);
    }
  }
  
  return workflowStatus;
}

async function checkDataFlow() {
  console.log('\n🔄 DATA FLOW ANALYSIS');
  console.log('='.repeat(50));
  
  // Check if we have the chain: scraped_data → viral_predictions → viral_filters
  const flowCheck = {
    scraped_data: await getTableInfo('scraped_data'),
    viral_predictions: await getTableInfo('viral_predictions'),
    viral_filters: await getTableInfo('viral_filters'),
    apify_runs: await getTableInfo('apify_runs')
  };
  
  console.log('Data Flow Chain:');
  console.log(`1. Scraped Data: ${flowCheck.scraped_data.exists ? `✅ ${flowCheck.scraped_data.count} rows` : '❌ Missing'}`);
  console.log(`2. Viral Predictions: ${flowCheck.viral_predictions.exists ? `✅ ${flowCheck.viral_predictions.count} rows` : '❌ Missing'}`);
  console.log(`3. Viral Filters: ${flowCheck.viral_filters.exists ? `✅ ${flowCheck.viral_filters.count} rows` : '❌ Missing'}`);
  console.log(`4. Apify Runs: ${flowCheck.apify_runs.exists ? `✅ ${flowCheck.apify_runs.count} rows` : '❌ Missing'}`);
  
  // Check for recent data
  if (flowCheck.scraped_data.exists && flowCheck.scraped_data.count > 0) {
    const { data: recentData } = await supabase
      .from('scraped_data')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentData && recentData.length > 0) {
      console.log('\nRecent scraped data:');
      recentData.forEach(row => {
        console.log(`  - ${row.created_at}`);
      });
    }
  }
  
  return flowCheck;
}

async function generateReport() {
  console.log('🔍 SUPABASE DATABASE AUDIT REPORT');
  console.log('='.repeat(50));
  console.log(`Database URL: ${supabaseUrl}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);
  
  // Get all tables
  const allTables = await getAllTables();
  console.log(`📋 Total tables found: ${allTables.length}`);
  
  if (allTables.length === 0) {
    console.log('⚠️  No tables found - this might indicate a permission issue or empty database');
    return;
  }
  
  // Check each table
  const tableReport = {};
  
  console.log('\n📊 TABLE ANALYSIS');
  console.log('='.repeat(50));
  
  for (const table of allTables) {
    const info = await getTableInfo(table);
    tableReport[table] = info;
    
    const status = info.exists ? 
      (info.count > 0 ? `✅ ${info.count} rows` : '⚠️  Empty') : 
      '❌ Error';
    
    console.log(`${table}: ${status}`);
    
    if (info.exists && info.count > 0 && info.columns.length > 0) {
      console.log(`  Columns: ${info.columns.join(', ')}`);
    }
    
    if (info.error) {
      console.log(`  Error: ${info.error}`);
    }
  }
  
  // Check expected vs actual tables
  console.log('\n🎯 EXPECTED vs ACTUAL TABLES');
  console.log('='.repeat(50));
  
  const missingTables = expectedTables.filter(table => !allTables.includes(table));
  const unexpectedTables = allTables.filter(table => !expectedTables.includes(table));
  
  if (missingTables.length > 0) {
    console.log('❌ Missing expected tables:');
    missingTables.forEach(table => console.log(`  - ${table}`));
  }
  
  if (unexpectedTables.length > 0) {
    console.log('\n✨ Additional tables found:');
    unexpectedTables.forEach(table => console.log(`  - ${table}`));
  }
  
  // Audit viral prediction workflow
  await auditViralPredictionWorkflow();
  
  // Check data flow
  await checkDataFlow();
  
  // Summary
  console.log('\n📈 SUMMARY');
  console.log('='.repeat(50));
  
  const tablesWithData = Object.entries(tableReport).filter(([name, info]) => info.exists && info.count > 0);
  const emptyTables = Object.entries(tableReport).filter(([name, info]) => info.exists && info.count === 0);
  
  console.log(`Total tables: ${allTables.length}`);
  console.log(`Tables with data: ${tablesWithData.length}`);
  console.log(`Empty tables: ${emptyTables.length}`);
  console.log(`Missing expected tables: ${missingTables.length}`);
  
  if (tablesWithData.length > 0) {
    console.log('\nTables with data:');
    tablesWithData.forEach(([name, info]) => {
      console.log(`  - ${name}: ${info.count} rows`);
    });
  }
  
  return {
    totalTables: allTables.length,
    tablesWithData: tablesWithData.length,
    emptyTables: emptyTables.length,
    missingTables: missingTables.length,
    tableReport,
    allTables
  };
}

// Run the audit
generateReport().catch(error => {
  console.error('❌ Audit failed:', error);
  process.exit(1);
});