/**
 * Detailed Database Content Audit
 * 
 * This script examines the actual content of tables to understand data structures
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function examineScrapedData() {
  console.log('🔍 SCRAPED DATA ANALYSIS');
  console.log('='.repeat(50));
  
  const { data, error } = await supabase
    .from('scraped_data')
    .select('*')
    .limit(10);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Total rows examined: ${data.length}`);
  
  if (data.length > 0) {
    console.log('\nSample records:');
    data.forEach((row, index) => {
      console.log(`\n--- Record ${index + 1} ---`);
      console.log(`ID: ${row.id}`);
      console.log(`Run ID: ${row.run_id}`);
      console.log(`Actor: ${row.actor_name}`);
      console.log(`Data Type: ${row.data_type}`);
      console.log(`TikTok ID: ${row.tiktok_id}`);
      console.log(`URL: ${row.url}`);
      console.log(`Processed: ${row.processed}`);
      console.log(`Created: ${row.created_at}`);
      
      if (row.content) {
        try {
          const content = JSON.parse(row.content);
          console.log(`Content keys: ${Object.keys(content).join(', ')}`);
          
          // Show key metrics if available
          if (content.viewCount) console.log(`  Views: ${content.viewCount}`);
          if (content.likeCount) console.log(`  Likes: ${content.likeCount}`);
          if (content.shareCount) console.log(`  Shares: ${content.shareCount}`);
          if (content.commentCount) console.log(`  Comments: ${content.commentCount}`);
          if (content.text) console.log(`  Text: ${content.text.substring(0, 100)}...`);
        } catch (e) {
          console.log(`Content (raw): ${row.content.substring(0, 100)}...`);
        }
      }
    });
  }
}

async function examineApifyRuns() {
  console.log('\n🔍 APIFY RUNS ANALYSIS');
  console.log('='.repeat(50));
  
  const { data, error } = await supabase
    .from('apify_runs')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Total runs: ${data.length}`);
  
  data.forEach((run, index) => {
    console.log(`\n--- Run ${index + 1} ---`);
    console.log(`ID: ${run.id}`);
    console.log(`Run ID: ${run.run_id}`);
    console.log(`Actor: ${run.actor_name} (${run.actor_id})`);
    console.log(`Status: ${run.status}`);
    console.log(`Started: ${run.started_at}`);
    console.log(`Finished: ${run.finished_at}`);
    console.log(`Items: ${run.items_count}`);
    console.log(`Data Size: ${run.data_size_bytes} bytes`);
    console.log(`Created: ${run.created_at}`);
  });
}

async function examineHookFrameworks() {
  console.log('\n🔍 HOOK FRAMEWORKS ANALYSIS');
  console.log('='.repeat(50));
  
  const { data, error } = await supabase
    .from('hook_frameworks')
    .select('*')
    .limit(5);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Sample of ${data.length} hook frameworks:`);
  
  data.forEach((framework, index) => {
    console.log(`\n--- Framework ${index + 1} ---`);
    console.log(`ID: ${framework.id}`);
    console.log(`Name: ${framework.name}`);
    console.log(`Category: ${framework.category}`);
    console.log(`Description: ${framework.description}`);
    console.log(`Success Rate: ${framework.success_rate}%`);
    console.log(`Usage Count: ${framework.usage_count}`);
    
    if (framework.pattern_rules) {
      try {
        const rules = typeof framework.pattern_rules === 'string' 
          ? JSON.parse(framework.pattern_rules) 
          : framework.pattern_rules;
        console.log(`Pattern Rules: ${Object.keys(rules).join(', ')}`);
      } catch (e) {
        const rulesStr = typeof framework.pattern_rules === 'string' 
          ? framework.pattern_rules 
          : JSON.stringify(framework.pattern_rules);
        console.log(`Pattern Rules: ${rulesStr.substring(0, 100)}...`);
      }
    }
    
    if (framework.example_videos) {
      try {
        const examples = typeof framework.example_videos === 'string' 
          ? JSON.parse(framework.example_videos) 
          : framework.example_videos;
        console.log(`Example Videos: ${Array.isArray(examples) ? examples.length : 'N/A'} examples`);
      } catch (e) {
        const examplesStr = typeof framework.example_videos === 'string' 
          ? framework.example_videos 
          : JSON.stringify(framework.example_videos);
        console.log(`Example Videos: ${examplesStr.substring(0, 100)}...`);
      }
    }
  });
}

async function checkDataQuality() {
  console.log('\n🔍 DATA QUALITY ANALYSIS');
  console.log('='.repeat(50));
  
  // Check scraped data quality
  const { data: scrapedData } = await supabase
    .from('scraped_data')
    .select('*');
  
  if (scrapedData) {
    console.log(`Scraped Data Quality:`);
    console.log(`- Total records: ${scrapedData.length}`);
    console.log(`- Processed records: ${scrapedData.filter(r => r.processed).length}`);
    console.log(`- Unprocessed records: ${scrapedData.filter(r => !r.processed).length}`);
    console.log(`- Records with content: ${scrapedData.filter(r => r.content).length}`);
    console.log(`- Records with TikTok ID: ${scrapedData.filter(r => r.tiktok_id).length}`);
    console.log(`- Records with URL: ${scrapedData.filter(r => r.url).length}`);
    
    // Check content structure
    const contentStructures = {};
    scrapedData.forEach(row => {
      if (row.content) {
        try {
          const content = JSON.parse(row.content);
          const keys = Object.keys(content).sort().join(',');
          contentStructures[keys] = (contentStructures[keys] || 0) + 1;
        } catch (e) {
          contentStructures['invalid_json'] = (contentStructures['invalid_json'] || 0) + 1;
        }
      }
    });
    
    console.log(`\nContent structures:`);
    Object.entries(contentStructures).forEach(([structure, count]) => {
      console.log(`  ${structure}: ${count} records`);
    });
  }
  
  // Check apify runs success rate
  const { data: apifyData } = await supabase
    .from('apify_runs')
    .select('*');
  
  if (apifyData) {
    console.log(`\nApify Runs Quality:`);
    console.log(`- Total runs: ${apifyData.length}`);
    const statusCounts = {};
    apifyData.forEach(run => {
      statusCounts[run.status] = (statusCounts[run.status] || 0) + 1;
    });
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} runs`);
    });
    
    const totalItems = apifyData.reduce((sum, run) => sum + (run.items_count || 0), 0);
    console.log(`- Total items scraped: ${totalItems}`);
    console.log(`- Average items per run: ${totalItems / apifyData.length}`);
  }
}

async function checkWorkflowGaps() {
  console.log('\n🔍 WORKFLOW GAP ANALYSIS');
  console.log('='.repeat(50));
  
  // Check if scraped data can flow to predictions
  const { data: scrapedData } = await supabase
    .from('scraped_data')
    .select('id, tiktok_id, content, processed');
  
  const { data: predictions } = await supabase
    .from('viral_predictions')
    .select('*');
  
  console.log('Workflow Analysis:');
  console.log(`1. Data Input: ${scrapedData ? scrapedData.length : 0} scraped records`);
  console.log(`2. Predictions: ${predictions ? predictions.length : 0} prediction records`);
  
  if (scrapedData && scrapedData.length > 0) {
    const processableData = scrapedData.filter(row => 
      row.content && row.tiktok_id && row.processed
    );
    console.log(`3. Processable Data: ${processableData.length} records ready for prediction`);
    
    if (processableData.length > 0 && (!predictions || predictions.length === 0)) {
      console.log('⚠️  GAP IDENTIFIED: Data exists but no predictions generated');
      console.log('   This suggests the prediction pipeline is not running');
    }
  }
  
  // Check for missing tables that would break the workflow
  const criticalTables = [
    'viral_dna_sequences',
    'viral_filters',
    'template_generators',
    'evolution_engines'
  ];
  
  console.log('\nCritical Missing Tables:');
  for (const table of criticalTables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: Available`);
    }
  }
}

async function runDetailedAudit() {
  console.log('🔍 DETAILED DATABASE CONTENT AUDIT');
  console.log('='.repeat(50));
  console.log(`Timestamp: ${new Date().toISOString()}\n`);
  
  await examineScrapedData();
  await examineApifyRuns();
  await examineHookFrameworks();
  await checkDataQuality();
  await checkWorkflowGaps();
  
  console.log('\n🎯 AUDIT COMPLETE');
  console.log('='.repeat(50));
}

runDetailedAudit().catch(console.error);