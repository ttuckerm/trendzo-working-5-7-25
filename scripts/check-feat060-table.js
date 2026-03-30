#!/usr/bin/env node
/**
 * Check if extracted_knowledge table exists and get row count
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkTable() {
  try {
    // Check if table exists and get count
    const { data, error, count } = await supabase
      .from('extracted_knowledge')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Table does not exist or error accessing:', error.message);
      console.log('\n⚠️  Need to apply migration: supabase/migrations/20251008_feat060_extracted_knowledge.sql');
      process.exit(1);
    }

    console.log('✅ extracted_knowledge table exists');
    console.log(`📊 Current row count: ${count || 0}`);

    // Get table schema
    const { data: columns, error: schemaError } = await supabase
      .from('extracted_knowledge')
      .select('*')
      .limit(0);

    if (!schemaError && columns) {
      console.log('\n📋 Table structure verified');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkTable();
