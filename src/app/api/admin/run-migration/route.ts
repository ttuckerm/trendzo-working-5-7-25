/**
 * Admin Migration Status API
 * 
 * GET /api/admin/run-migration - Check migration status
 * POST /api/admin/run-migration - Get SQL for manual execution
 * 
 * Note: Due to security restrictions, SQL must be run via Supabase Dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

// Migration SQL for bulk download system
const BULK_DOWNLOAD_SQL = `
-- ==========================================
-- BULK DOWNLOAD SYSTEM MIGRATION
-- Run this in Supabase Dashboard SQL Editor
-- ==========================================

CREATE TABLE IF NOT EXISTS bulk_download_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT,
  total_urls INTEGER NOT NULL DEFAULT 0,
  processed_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_by TEXT,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bulk_jobs_status ON bulk_download_jobs(status);
CREATE INDEX IF NOT EXISTS idx_bulk_jobs_created ON bulk_download_jobs(created_at DESC);

CREATE TABLE IF NOT EXISTS bulk_download_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES bulk_download_jobs(id) ON DELETE CASCADE,
  tiktok_url TEXT NOT NULL,
  video_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'downloading', 'completed', 'failed', 'skipped')),
  local_path TEXT,
  file_size_bytes BIGINT,
  duration_seconds FLOAT,
  author_username TEXT,
  author_display_name TEXT,
  description TEXT,
  views INTEGER,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  prediction_id UUID,
  predicted_dps FLOAT,
  actual_dps FLOAT,
  downloaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_download_items_job ON bulk_download_items(job_id);
CREATE INDEX IF NOT EXISTS idx_download_items_status ON bulk_download_items(status);
CREATE INDEX IF NOT EXISTS idx_download_items_video ON bulk_download_items(video_id);

CREATE TABLE IF NOT EXISTS batch_test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES bulk_download_jobs(id),
  total_videos INTEGER NOT NULL DEFAULT 0,
  tested_count INTEGER NOT NULL DEFAULT 0,
  avg_predicted_dps FLOAT,
  avg_confidence FLOAT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  results_summary JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batch_runs_job ON batch_test_runs(job_id);

-- Enable RLS
ALTER TABLE bulk_download_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_download_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_test_runs ENABLE ROW LEVEL SECURITY;

-- Policies for service role access
DROP POLICY IF EXISTS "Service access bulk_download_jobs" ON bulk_download_jobs;
CREATE POLICY "Service access bulk_download_jobs" ON bulk_download_jobs FOR ALL USING (true);

DROP POLICY IF EXISTS "Service access bulk_download_items" ON bulk_download_items;
CREATE POLICY "Service access bulk_download_items" ON bulk_download_items FOR ALL USING (true);

DROP POLICY IF EXISTS "Service access batch_test_runs" ON batch_test_runs;
CREATE POLICY "Service access batch_test_runs" ON batch_test_runs FOR ALL USING (true);
`;

export async function POST(request: NextRequest) {
  try {
    const { migration } = await request.json();

    if (migration === 'bulk_download_system') {
      return NextResponse.json({
        success: true,
        message: 'Copy this SQL and run it in Supabase Dashboard > SQL Editor',
        sql: BULK_DOWNLOAD_SQL,
        instructions: [
          '1. Go to your Supabase Dashboard',
          '2. Navigate to SQL Editor',
          '3. Paste the SQL below',
          '4. Click "Run"',
          '5. Refresh this page to verify tables exist'
        ]
      });
    }

    return NextResponse.json(
      { success: false, error: 'Unknown migration' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[Migration] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Migration failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Check which tables exist
  const checks = await Promise.all([
    supabase.from('bulk_download_jobs').select('id').limit(1),
    supabase.from('bulk_download_items').select('id').limit(1),
    supabase.from('batch_test_runs').select('id').limit(1),
    supabase.from('algorithm_performance').select('id').limit(1),
    supabase.from('prediction_tracking').select('id').limit(1),
    supabase.from('component_reliability').select('id').limit(1)
  ]);

  const tables = [
    { name: 'bulk_download_jobs', required: 'Part 4: Bulk Downloader' },
    { name: 'bulk_download_items', required: 'Part 4: Bulk Downloader' },
    { name: 'batch_test_runs', required: 'Part 4: Bulk Downloader' },
    { name: 'algorithm_performance', required: 'Part 3: Algorithm IQ' },
    { name: 'prediction_tracking', required: 'Part 3: Algorithm IQ' },
    { name: 'component_reliability', required: 'Part 1: Learning Loop' }
  ];

  const status = tables.map((t, i) => ({
    table: t.name,
    exists: !checks[i].error || checks[i].error?.code !== '42P01',
    required: t.required,
    error: checks[i].error?.code
  }));

  const allExist = status.every(s => s.exists);
  const missingTables = status.filter(s => !s.exists);

  return NextResponse.json({
    success: true,
    allTablesExist: allExist,
    tables: status,
    missingCount: missingTables.length,
    message: allExist 
      ? 'All tables exist - system ready!'
      : `Missing ${missingTables.length} table(s). Run POST with { "migration": "bulk_download_system" } to get SQL.`
  });
}
