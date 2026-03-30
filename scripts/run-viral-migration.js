const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vyyeiyccrageckeehyhoj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running viral columns migration...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add-viral-columns.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      // If RPC doesn't exist, try running statements individually
      console.log('exec_sql RPC not available, running statements individually...');
      
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        
        // For now, we'll need to run these manually through Supabase dashboard
        console.log('Please run the following SQL in your Supabase SQL editor:');
        console.log(statement + ';');
        console.log('---');
      }
      
      console.log('\nMigration SQL has been output above. Please run it in your Supabase SQL editor.');
      return;
    }
    
    console.log('Migration completed successfully!');
    
    // Test the view
    const { data: templates, error: viewError } = await supabase
      .from('templates')
      .select('*')
      .limit(1);
    
    if (viewError) {
      console.error('Error testing templates view:', viewError);
    } else {
      console.log('Templates view is working correctly');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration(); 