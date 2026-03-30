#!/usr/bin/env node

/**
 * Deploy Missing Viral Prediction Tables
 * 
 * This script deploys the missing tables needed for the 12-module system
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployMissingTables() {
  console.log('🚀 Deploying Missing Viral Prediction Tables...\n');

  try {
    // Read the manual setup SQL
    const sqlPath = path.join(__dirname, 'manual-database-setup.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Manual setup SQL loaded');
    console.log('📊 SQL size:', (sqlContent.length / 1024).toFixed(2), 'KB');

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));

    console.log('🔧 Found', statements.length, 'SQL statements to execute\n');

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (!statement) continue;

      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        });

        if (error) {
          // Some errors are expected (like "already exists")
          if (error.message.includes('already exists')) {
            console.log('  ✅ Table already exists (skipping)');
          } else {
            console.log('  ❌ Error:', error.message);
            errorCount++;
          }
        } else {
          console.log('  ✅ Success');
          successCount++;
        }
      } catch (err) {
        console.log('  ❌ Error:', err.message);
        errorCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 Deployment Summary:');
    console.log('✅ Successful statements:', successCount);
    console.log('❌ Failed statements:', errorCount);

    // Verify deployment
    console.log('\n🔍 Verifying deployment...');
    await verifyTables();

  } catch (error) {
    console.error('💥 Deployment failed:', error.message);
    process.exit(1);
  }
}

async function verifyTables() {
  const expectedTables = [
    'viral_predictions',
    'viral_dna_sequences', 
    'viral_filters',
    'template_generators',
    'evolution_engines',
    'feature_decomposers',
    'gene_taggers',
    'viral_approval_queue',
    'viral_recipe_book'
  ];

  console.log('Checking for expected tables...');

  for (const tableName of expectedTables) {
    try {
      const { error } = await supabase.from(tableName).select('count').limit(1);
      
      if (error) {
        console.log(`❌ ${tableName}: NOT FOUND`);
      } else {
        console.log(`✅ ${tableName}: EXISTS`);
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ERROR -`, err.message);
    }
  }
}

// Run deployment
deployMissingTables().catch(console.error); 