#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function applyMigration() {
  console.log('\n📋 Applying enhanced video patterns migration...\n');
  
  const migrationPath = 'supabase/migrations/20251006_enhanced_video_patterns.sql';
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  // Split into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Found ${statements.length} SQL statements to execute\n`);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (stmt.length < 10) continue;  // Skip very short statements
    
    try {
      const preview = stmt.substring(0, 60).replace(/\s+/g, ' ');
      process.stdout.write(`${i + 1}. ${preview}...`);
      
      const { error } = await supabase.rpc('exec', { sql: stmt + ';' });
      
      if (error) {
        console.log(' ❌');
        console.error('   Error:', error.message);
      } else {
        console.log(' ✅');
      }
    } catch (err) {
      console.log(' ❌');
      console.error('   Exception:', err.message);
    }
  }
  
  console.log('\n✅ Migration application complete!\n');
}

applyMigration().catch(err => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});

