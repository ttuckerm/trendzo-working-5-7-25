import { createClient } from '@supabase/supabase-js';

// This script safely verifies the tables you're adding to Supabase

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySafeSchema() {
  console.log('🔍 Verifying Safe Schema Additions...\n');

  try {
    // 1. Check viral_templates table
    console.log('📊 Checking viral_templates table:');
    try {
      const { count, error } = await supabase
        .from('viral_templates')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log('❌ viral_templates table not found or error:', error.message);
      } else {
        console.log(`✅ viral_templates table exists (${count || 0} records)`);
      }
    } catch (e) {
      console.log('❌ Error checking viral_templates:', e);
    }

    // 2. Check module_health table and data
    console.log('\n📊 Checking module_health table:');
    try {
      const { data: modules, error } = await supabase
        .from('module_health')
        .select('module_name, status, processed_count')
        .order('module_name');

      if (error) {
        console.log('❌ module_health table not found or error:', error.message);
      } else {
        console.log(`✅ module_health table exists with ${modules?.length || 0} modules:`);
        
        // Expected modules
        const expectedModules = [
          'TikTok Scraper',
          'Viral Pattern Analyzer', 
          'Template Discovery Engine',
          'Draft Video Analyzer',
          'Script Intelligence Module',
          'Recipe Book Generator',
          'Prediction Engine',
          'Performance Validator',
          'Marketing Content Creator',
          'Dashboard Aggregator',
          'System Health Monitor'
        ];

        // Check which modules are present
        const foundModules = modules?.map(m => m.module_name) || [];
        
        expectedModules.forEach(moduleName => {
          const module = modules?.find(m => m.module_name === moduleName);
          if (module) {
            console.log(`   ✅ ${moduleName}: ${module.status} (${module.processed_count} processed)`);
          } else {
            console.log(`   ❌ ${moduleName}: NOT FOUND`);
          }
        });

        // Check for unexpected modules
        const unexpectedModules = foundModules.filter(m => !expectedModules.includes(m));
        if (unexpectedModules.length > 0) {
          console.log('\n   ⚠️  Unexpected modules found:', unexpectedModules);
        }
      }
    } catch (e) {
      console.log('❌ Error checking module_health:', e);
    }

    console.log('\n✨ Verification complete!');
    console.log('\n📝 Next steps:');
    console.log('1. If tables are missing, run the SQL commands in Supabase SQL Editor');
    console.log('2. If modules are missing, check if the INSERT statement ran successfully');
    console.log('3. Once these 2 tables work, we can safely add the remaining 3 tables');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run verification
verifySafeSchema();