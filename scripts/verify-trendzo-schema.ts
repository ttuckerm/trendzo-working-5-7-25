import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase project details
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
  console.log('🔍 Verifying Trendzo Database Schema...\n');

  try {
    // 1. Check module_health table
    console.log('📊 Checking module_health table:');
    const { data: modules, error: modulesError } = await supabase
      .from('module_health')
      .select('*')
      .order('module_name');

    if (modulesError) {
      console.error('❌ Error querying module_health:', modulesError);
    } else {
      console.log(`✅ Found ${modules?.length || 0} modules`);
      modules?.forEach(module => {
        console.log(`   - ${module.module_name}: ${module.status} (${module.processed_count} processed)`);
      });
    }

    // 2. Check viral_templates table
    console.log('\n📊 Checking viral_templates table:');
    const { count: templatesCount, error: templatesError } = await supabase
      .from('viral_templates')
      .select('*', { count: 'exact', head: true });

    if (templatesError) {
      console.error('❌ Error querying viral_templates:', templatesError);
    } else {
      console.log(`✅ viral_templates table exists (${templatesCount || 0} records)`);
    }

    // 3. Check video_predictions table (should exist already)
    console.log('\n📊 Checking video_predictions table:');
    const { count: predictionsCount, error: predictionsError } = await supabase
      .from('video_predictions')
      .select('*', { count: 'exact', head: true });

    if (predictionsError) {
      console.error('❌ Error querying video_predictions:', predictionsError);
      console.log('   Note: This table should already exist in your database');
    } else {
      console.log(`✅ video_predictions table exists (${predictionsCount || 0} records)`);
    }

    // 4. Check all new tables
    console.log('\n📊 Checking all Trendzo tables:');
    const tables = [
      'viral_templates',
      'prediction_accuracy',
      'module_health',
      'script_patterns',
      'recipe_book_daily'
    ];

    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error && error.code === '42P01') {
        console.log(`❌ Table '${table}' does not exist`);
      } else if (error) {
        console.log(`⚠️  Table '${table}' exists but has error: ${error.message}`);
      } else {
        console.log(`✅ Table '${table}' exists and is accessible`);
      }
    }

    console.log('\n✨ Schema verification complete!');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run verification
verifySchema();