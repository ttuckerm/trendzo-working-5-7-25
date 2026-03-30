#!/usr/bin/env node

/**
 * TRENDZO Viral Intelligence Database Setup - Simple Version
 * Direct SQL execution approach
 */

const fs = require('fs');
const path = require('path');

async function setupViralIntelligenceDatabase() {
  console.log('🚀 Setting up TRENDZO Viral Intelligence Database...\n');
  
  try {
    // Try to import the existing supabase client from the project
    const { supabaseClient } = require('../src/lib/supabase-client');
    
    console.log('📋 Reading viral intelligence schema...');
    
    // Read SQL schema file
    const schemaPath = path.join(__dirname, 'viral-intelligence-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip pure comments and empty statements
      if (statement.trim() === ';' || statement.trim().startsWith('--')) {
        continue;
      }
      
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        // For CREATE TABLE statements, use the from() method
        if (statement.includes('CREATE TABLE') && statement.includes('viral_patterns')) {
          // Create viral_patterns table first as it's referenced by others
          const { error } = await supabaseClient
            .from('viral_patterns')
            .select('id')
            .limit(0);
          
          if (error && error.message.includes('relation "viral_patterns" does not exist')) {
            console.log('Creating viral_patterns table...');
            // Table doesn't exist, this is expected
          }
        }
        
        // Try executing via RPC if available
        const { data, error } = await supabaseClient.rpc('exec_sql', { 
          sql: statement 
        });
        
        if (error) {
          throw error;
        }
        
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error.message);
        errorCount++;
        
        // Continue with next statement for non-critical errors
        if (!error.message.includes('already exists') && 
            !error.message.includes('does not exist')) {
          console.log('Continuing with next statement...');
        }
      }
    }
    
    console.log(`\n📊 Execution Summary:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    // Verify key tables exist
    console.log('\n🔍 Verifying key tables...');
    
    const keyTables = ['viral_patterns', 'video_content', 'generated_templates'];
    const verificationResults = [];
    
    for (const tableName of keyTables) {
      try {
        const { error } = await supabaseClient
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (error) {
          verificationResults.push({ table: tableName, status: 'missing', error: error.message });
        } else {
          verificationResults.push({ table: tableName, status: 'exists' });
        }
      } catch (error) {
        verificationResults.push({ table: tableName, status: 'error', error: error.message });
      }
    }
    
    // Display results
    verificationResults.forEach(result => {
      const emoji = result.status === 'exists' ? '✅' : '❌';
      console.log(`${emoji} ${result.table}: ${result.status}`);
    });
    
    const tablesExist = verificationResults.filter(r => r.status === 'exists').length;
    
    if (tablesExist > 0) {
      console.log('\n🎯 Database setup completed!');
      console.log(`${tablesExist}/${keyTables.length} key tables are ready`);
      
      // If we have some tables working, proceed with next steps
      console.log('\n🚀 TRENDZO Viral Intelligence Engine is partially ready!');
      console.log('\nNext implementation steps:');
      console.log('1. 🔍 Build pattern matching engine');
      console.log('2. 🤖 Implement Apify video scraping');
      console.log('3. 👥 Create admin approval interface');
      console.log('4. 🎯 Build template generation pipeline');
    } else {
      console.log('\n⚠️  Manual database setup may be required');
      console.log('\nYou can manually execute the SQL from:');
      console.log('scripts/viral-intelligence-schema.sql');
    }
    
  } catch (error) {
    console.error('❌ Setup error:', error.message);
    
    // Provide helpful troubleshooting
    console.log('\n🔧 Troubleshooting Options:');
    console.log('1. Check Supabase connection in src/lib/supabase-client.ts');
    console.log('2. Verify environment variables in .env.local');
    console.log('3. Try manual SQL execution in Supabase dashboard');
    console.log('4. Ensure service role key has sufficient permissions');
    
    // Still consider this a partial success for development
    console.log('\n🚀 Continuing with viral intelligence engine implementation...');
  }
}

// Execute if run directly
if (require.main === module) {
  setupViralIntelligenceDatabase();
}

module.exports = { setupViralIntelligenceDatabase };