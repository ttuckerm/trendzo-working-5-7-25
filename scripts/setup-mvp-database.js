// Script to set up the MVP database schema in Supabase
// Run with: node scripts/setup-mvp-database.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Use environment variables or fallback values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vyeiyccrageckeehyhj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required');
  console.log('Please set it in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSchema() {
  try {
    console.log('🚀 Setting up TRENDZO MVP database schema...');
    console.log('📍 Supabase URL:', supabaseUrl);
    
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'create-mvp-schema.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf8');
    
    // Split SQL into individual statements (Supabase doesn't handle multiple statements well)
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip if it's just a comment
      if (statement.trim().startsWith('--') || statement.trim().length < 5) {
        continue;
      }
      
      try {
        console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`);
        
        // For complex statements, we'll use the Supabase SQL editor approach
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        }).single();
        
        if (error) {
          // If RPC doesn't exist, try direct approach (this will work for simple queries)
          if (error.message.includes('exec_sql')) {
            console.log('⚠️  RPC function not available, statement needs to be run in Supabase SQL editor');
            console.log('📝 Statement:', statement.substring(0, 50) + '...');
            errorCount++;
          } else {
            throw error;
          }
        } else {
          console.log('✅ Success');
          successCount++;
        }
      } catch (error) {
        console.error('❌ Error executing statement:', error.message);
        console.error('📝 Failed statement:', statement.substring(0, 100) + '...');
        errorCount++;
      }
    }
    
    console.log('\n📊 Schema setup summary:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. This is expected for the initial setup.');
      console.log('📌 Please run the schema SQL directly in the Supabase SQL editor:');
      console.log('   1. Go to your Supabase dashboard');
      console.log('   2. Navigate to SQL Editor');
      console.log('   3. Copy the contents of scripts/create-mvp-schema.sql');
      console.log('   4. Paste and run in the SQL editor');
    }
    
    // Test connection to verify tables exist
    console.log('\n🧪 Testing database connection...');
    const { data: templates, error: testError } = await supabase
      .from('templates')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('⚠️  Could not query templates table:', testError.message);
      console.log('📌 Please ensure the schema is created in Supabase SQL editor');
    } else {
      console.log('✅ Database connection successful!');
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Alternative: Generate types after schema creation
async function generateTypes() {
  console.log('\n🔧 Generating TypeScript types...');
  console.log('📌 To generate types, run:');
  console.log('   npx supabase gen types typescript --project-id vyeiyccrageckeehyhj > src/lib/types/supabase.ts');
  console.log('\n   Or if you have Supabase CLI configured:');
  console.log('   supabase gen types typescript --linked > src/lib/types/supabase.ts');
}

// Main execution
async function main() {
  await runSchema();
  await generateTypes();
  
  console.log('\n✨ Setup complete!');
  console.log('\n📚 Next steps:');
  console.log('1. Run the schema SQL in Supabase SQL editor if needed');
  console.log('2. Generate types using the Supabase CLI');
  console.log('3. Start implementing the Content Generator Service');
}

main().catch(console.error);