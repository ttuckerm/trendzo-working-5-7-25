/**
 * Query Supabase to find the prediction_runs_status_check constraint definition
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://vyeiyccrageeckeehyhj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZWl5Y2NyYWdlZWNrZWVoeWhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkyMTYxMSwiZXhwIjoyMDYyNDk3NjExfQ.A-AngxU0Y6bEdTE-gDVoh9xRypol0C474LEgRKR8bE8";

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('=== Checking prediction_runs_status_check constraint ===\n');

  // Query 1: Get constraint definition from pg_constraint
  const { data: constraints, error: constraintError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'prediction_runs'::regclass
      AND contype = 'c'
    `
  });

  if (constraintError) {
    console.log('RPC exec_sql not available, trying direct query...\n');

    // Try alternative: query information_schema
    const { data: checkConstraints, error: checkError } = await supabase
      .from('information_schema.check_constraints')
      .select('*')
      .ilike('constraint_name', '%prediction_runs%');

    if (checkError) {
      console.log('information_schema query failed:', checkError.message);
      console.log('\nTrying raw SQL via REST...\n');
    } else {
      console.log('Check constraints:', checkConstraints);
    }
  } else {
    console.log('Constraints found:', constraints);
  }

  // Query 2: Get column info for status column
  console.log('\n=== Checking status column definition ===\n');

  const { data: columns, error: colError } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'prediction_runs' AND column_name = 'status'
      `
    });

  if (colError) {
    console.log('Could not query column info via RPC');
  } else {
    console.log('Status column:', columns);
  }

  // Query 3: Get distinct status values currently in use
  console.log('\n=== Distinct status values currently in use ===\n');

  const { data: statuses, error: statusError } = await supabase
    .from('prediction_runs')
    .select('status')
    .limit(1000);

  if (statusError) {
    console.log('Error querying statuses:', statusError.message);
  } else {
    const uniqueStatuses = [...new Set(statuses.map(r => r.status))];
    console.log('Unique statuses in use:', uniqueStatuses);

    // Count by status
    const statusCounts = {};
    statuses.forEach(r => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });
    console.log('Status counts:', statusCounts);
  }

  // Query 4: Check recent runs for the error pattern
  console.log('\n=== Recent runs (last 5) ===\n');

  const { data: recentRuns, error: recentError } = await supabase
    .from('prediction_runs')
    .select('id, status, error_message, created_at, completed_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (recentError) {
    console.log('Error:', recentError.message);
  } else {
    for (const run of recentRuns) {
      console.log(`  ${run.id.substring(0, 8)}... status=${run.status}, error=${run.error_message || 'none'}`);
    }
  }
}

main().catch(console.error);
