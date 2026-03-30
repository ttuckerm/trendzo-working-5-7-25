#!/usr/bin/env node

/**
 * TRENDZO Viral Intelligence Database Setup
 * 
 * This script creates the complete database schema for the Viral Intelligence Engine
 * based on the comprehensive blueprint for functioning viral video template system.
 */

const fs = require('fs');
const path = require('path');

async function setupViralIntelligenceDatabase() {
  console.log('🚀 Setting up TRENDZO Viral Intelligence Database...\n');
  
  try {
    // Load environment variables
    require('dotenv').config({ path: '.env.local' });
    
    // Import Supabase client
    const { createClient } = require('@supabase/supabase-js');
    
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables');
      console.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY');
      process.exit(1);
    }
    
    // Create Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Read SQL schema file
    const schemaPath = path.join(__dirname, 'viral-intelligence-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Executing viral intelligence schema...');
    
    // Execute the schema
    const { data, error } = await supabase.rpc('exec_sql', { sql: schemaSql });
    
    if (error) {
      console.error('❌ Error executing schema:', error);
      
      // Try alternative approach - split into smaller chunks
      console.log('🔄 Trying alternative approach - executing in chunks...');
      
      // Split SQL by double newlines to separate major sections
      const sqlChunks = schemaSql.split('\n\n-- =====').filter(chunk => chunk.trim());
      
      for (let i = 0; i < sqlChunks.length; i++) {
        const chunk = sqlChunks[i];
        if (chunk.trim()) {
          console.log(`Executing chunk ${i + 1}/${sqlChunks.length}...`);
          
          const { error: chunkError } = await supabase.rpc('exec_sql', { 
            sql: chunk.startsWith('-- =====') ? chunk : `-- ===== ${chunk}`
          });
          
          if (chunkError) {
            console.error(`❌ Error in chunk ${i + 1}:`, chunkError);
          } else {
            console.log(`✅ Chunk ${i + 1} executed successfully`);
          }
        }
      }
    } else {
      console.log('✅ Schema executed successfully');
    }
    
    // Verify tables were created
    console.log('\n🔍 Verifying database setup...');
    
    const expectedTables = [
      'viral_patterns',
      'video_content', 
      'pattern_matches',
      'approval_queue',
      'generated_templates',
      'template_usage',
      'newsletter_links',
      'viral_intelligence_jobs'
    ];
    
    const verificationResults = [];
    
    for (const tableName of expectedTables) {
      const { data: tableData, error: tableError } = await supabase
        .from(tableName)
        .select('count')
        .limit(0);
        
      if (tableError) {
        verificationResults.push({ table: tableName, status: 'missing', error: tableError.message });
      } else {
        verificationResults.push({ table: tableName, status: 'created' });
      }
    }
    
    // Display verification results
    console.log('\n📊 Database Setup Results:');
    verificationResults.forEach(result => {
      const emoji = result.status === 'created' ? '✅' : '❌';
      console.log(`${emoji} ${result.table}: ${result.status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    const successCount = verificationResults.filter(r => r.status === 'created').length;
    const totalCount = verificationResults.length;
    
    console.log(`\n🎯 Setup Complete: ${successCount}/${totalCount} tables created successfully`);
    
    if (successCount === totalCount) {
      console.log('\n🚀 TRENDZO Viral Intelligence Database is ready!');
      console.log('\nNext steps:');
      console.log('1. 🔍 Implement pattern matching engine');
      console.log('2. 🤖 Set up Apify integration for video scraping');
      console.log('3. 👥 Build admin approval queue interface');
      console.log('4. 🎯 Create template generation pipeline');
      console.log('5. 📊 Set up newsletter tracking system');
    } else {
      console.log('\n⚠️  Some tables failed to create. Check the errors above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Fatal error setting up database:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Check your .env.local file has the correct Supabase credentials');
    console.log('2. Ensure SUPABASE_SERVICE_ROLE_KEY (not anon key) is set');
    console.log('3. Verify your Supabase project is accessible');
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  setupViralIntelligenceDatabase();
}

module.exports = { setupViralIntelligenceDatabase };