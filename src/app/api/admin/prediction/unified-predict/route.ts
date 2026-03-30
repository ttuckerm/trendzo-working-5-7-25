import { NextRequest, NextResponse } from 'next/server';
import { UnifiedPredictionEngine } from '@/lib/services/viral-prediction/unified-prediction-engine';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, logSupabaseRuntimeEnv } from '@/lib/env';
import { scoreDual } from '@/lib/services/dual_runner'

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Starting unified viral prediction...');
    
    const input = await request.json();
    
    // Validate required fields
    if (!input.viewCount || !input.likeCount || !input.followerCount || !input.platform) {
      return NextResponse.json({
        success: false,
        error: 'Required fields: viewCount, likeCount, followerCount, platform',
        required_format: {
          viewCount: 'number',
          likeCount: 'number', 
          commentCount: 'number',
          shareCount: 'number',
          followerCount: 'number',
          platform: 'tiktok | instagram | youtube',
          hoursSinceUpload: 'number (optional, defaults to 1)'
        }
      }, { status: 400 });
    }

    // Initialize the unified prediction engine
    const engine = new UnifiedPredictionEngine();
    
    // Set defaults for optional fields
    const predictionInput = {
      viewCount: input.viewCount,
      likeCount: input.likeCount,
      commentCount: input.commentCount || 0,
      shareCount: input.shareCount || 0,
      followerCount: input.followerCount,
      platform: input.platform,
      hoursSinceUpload: input.hoursSinceUpload || 1,
      contentFeatures: input.contentFeatures || undefined,
      frameworkScores: input.frameworkScores || undefined
    };

    console.log(`🔍 Analyzing video with ${predictionInput.viewCount} views, ${predictionInput.likeCount} likes`);
    
    // Shadow mode: if header or query present, run dual evaluation (no user impact)
    const shadowHeader = request.headers.get('x-model-shadow') || ''
    const url = new URL(request.url)
    const shadowQuery = url.searchParams.get('shadow')
    const useShadow = !!(shadowHeader || shadowQuery)
    const result = useShadow ? await scoreDual(predictionInput, { shadowVersion: String(shadowHeader || shadowQuery || '') || undefined }) : await engine.predict(predictionInput as any);

    // Persist prediction with incubation label (best-effort, schema-agnostic)
    try {
      logSupabaseRuntimeEnv();
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const cohortVersion = (result as any)?.meta?.cohortVersion;
      // Ensure table exists (best-effort)
      try {
        const createSql = `
          create table if not exists viral_predictions (
            id uuid default gen_random_uuid() primary key,
            created_at timestamptz not null default now(),
            platform text,
            viral_probability double precision,
            viral_score double precision,
            confidence_score double precision,
            incubation_label text,
            model_version text,
            cohort_version text,
            prediction_method text,
            prediction_factors jsonb,
            telemetry_snapshot jsonb,
            predicted_views integer
          );
        `;
        await (db as any).rpc('exec_sql', { query: createSql });
      } catch {}
      // Try to detect table shape and only insert known columns
      const probe = await db.from('viral_predictions').select('*').limit(1);
      const columns = Array.isArray(probe?.data) && probe.data.length > 0 ? Object.keys(probe.data[0]) : [];
      const prodResult: any = (result as any)?.prod ? (result as any).prod : result
      const baseRow: any = {
        platform: predictionInput.platform,
        viral_probability: (prodResult as any)?.calibratedProbability || prodResult.viralProbability,
        viral_score: (prodResult as any)?.viralScore,
        prediction_method: 'unified_prediction_engine'
      };
      // Optional columns if present
      if (columns.includes('confidence_score')) baseRow.confidence_score = (prodResult as any).confidence;
      if (columns.includes('model_version')) baseRow.model_version = (prodResult as any).meta.modelVersion;
      if (columns.includes('cohort_version')) baseRow.cohort_version = cohortVersion;
      if (columns.includes('predicted_views')) baseRow.predicted_views = (prodResult as any).predictions?.predictedViews?.realistic;
      // Persist quality metadata when available
      if (columns.includes('prediction_factors')) {
        baseRow.prediction_factors = {
          ...(baseRow.prediction_factors || {}),
          quality: { flags: (prodResult as any)?.meta?.qualityFlags || [], factor: (prodResult as any)?.meta?.qualityFactor || 1.0 }
        }
      }
      if (columns.includes('quality_snapshot')) (baseRow as any).quality_snapshot = (prodResult as any)?.meta?.qualitySnapshot || null;
      if (columns.includes('incubation_label')) baseRow.incubation_label = (prodResult as any)?.incubationLabel;
      // Always try to include prediction_factors to carry incubation if column exists
      const factors: any = { input: predictionInput, breakdown: (prodResult as any).breakdown, incubation_label: (prodResult as any)?.incubationLabel, cohort_version: cohortVersion, simulator_snapshot: (prodResult as any)?.meta?.simulatorSnapshot, transcript_features: (prodResult as any)?.meta?.transcriptFeatures, completion_proxy: (prodResult as any)?.meta?.completion_proxy, completion_source: (prodResult as any)?.meta?.completion_source };
      if (columns.includes('prediction_factors')) baseRow.prediction_factors = factors;
      if (columns.includes('telemetry_snapshot')) baseRow.telemetry_snapshot = (prodResult as any)?.meta?.telemetrySnapshot || null;
      if (columns.includes('simulator_snapshot')) (baseRow as any).simulator_snapshot = (prodResult as any)?.meta?.simulatorSnapshot || null;
      // If no columns detected, insert a minimal flexible payload relying on JSON
      if (columns.length === 0) {
        await db.from('viral_predictions').insert({ prediction_method: 'unified_prediction_engine', prediction_factors: factors, incubation_label: (prodResult as any)?.incubationLabel });
      } else {
        await db.from('viral_predictions').insert(baseRow);
      }

      // Also persist a validation row carrying incubation_label for guaranteed verification
      try {
        await db.from('prediction_validation').insert({
          prediction_id: (prodResult as any)?.id || (globalThis as any).crypto?.randomUUID?.() || `${Date.now()}`,
          predicted_viral_score: (prodResult as any)?.viralScore,
          predicted_viral_probability: (prodResult as any)?.viralProbability,
          cohort_week: (prodResult as any)?.meta?.cohortVersion,
          prediction_factors: { incubation_label: (prodResult as any)?.incubationLabel },
          validation_status: 'pending',
          model_version: (prodResult as any)?.meta?.modelVersion,
          created_at: new Date().toISOString()
        } as any);
      } catch {}
    } catch (e) {
      console.warn('Failed to persist unified prediction:', e);
      // Fallback: write to prediction_validation with JSON factors including incubation_label
      try {
        const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        try {
          const createSql = `
            create table if not exists prediction_validation (
              id bigserial primary key,
              created_at timestamptz not null default now(),
              prediction_engine text,
              validation_status text,
              predicted_viral_probability double precision,
              prediction_factors jsonb
            );
          `;
          await (db as any).rpc('exec_sql', { query: createSql });
        } catch {}
        const probe = await db.from('prediction_validation').select('*').limit(1);
        const cols = Array.isArray(probe?.data) && probe.data.length > 0 ? Object.keys(probe.data[0]) : [];
        const prodResult: any = (result as any)?.prod ? (result as any).prod : result
        const factors = { incubation_label: (prodResult as any)?.incubationLabel, cohort_version: (prodResult as any)?.meta?.cohortVersion, transcript_features: (prodResult as any)?.meta?.transcriptFeatures, completion_proxy: (prodResult as any)?.meta?.completion_proxy, completion_source: (prodResult as any)?.meta?.completion_source } as any;
        const row: any = {};
        if (cols.includes('predicted_viral_probability')) row.predicted_viral_probability = (prodResult as any).viralProbability;
        if (cols.includes('validation_status')) row.validation_status = 'pending';
        if (cols.includes('prediction_engine')) row.prediction_engine = 'UnifiedPredictionEngine';
        if (cols.includes('created_at')) row.created_at = new Date().toISOString();
        if (cols.includes('prediction_factors')) row.prediction_factors = factors;
        // If no known columns, insert minimal row with JSON
        if (Object.keys(row).length === 0) {
          await db.from('prediction_validation').insert({ prediction_engine: 'UnifiedPredictionEngine', validation_status: 'pending', predicted_viral_probability: (prodResult as any).viralProbability, prediction_factors: factors });
        } else {
        if (Object.keys(row).length > 0) await db.from('prediction_validation').insert(row);
        }
      } catch (e2) {
        console.warn('Fallback persist failed:', e2);
      }
    }

    console.log('✅ Unified prediction completed successfully');
    
    return NextResponse.json({
      success: true,
      prediction: (result as any)?.prod ? (result as any).prod : result,
      shadow: (result as any)?.shadow || undefined,
      engine: 'UnifiedPredictionEngine',
      input: predictionInput,
      timestamp: new Date().toISOString(),
      dataSource: 'REAL_UNIFIED_ENGINE'
    });

  } catch (error) {
    console.error('❌ Unified prediction failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unified prediction failed',
      engine: 'UnifiedPredictionEngine',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Health check and capabilities
  try {
    const engine = new UnifiedPredictionEngine();
    
    return NextResponse.json({
      success: true,
      status: 'UnifiedPredictionEngine ready',
      engine: 'UnifiedPredictionEngine',
      timestamp: new Date().toISOString(),
      capabilities: [
        'Z-score statistical analysis',
        'Engagement score calculation',
        'Platform-specific weights',
        'Time decay factors',
        'God Mode enhancements (optional)',
        'Framework integration (optional)'
      ],
      example_input: {
        viewCount: 15000,
        likeCount: 1200,
        commentCount: 89,
        shareCount: 45,
        followerCount: 50000,
        platform: 'tiktok',
        hoursSinceUpload: 2
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Engine initialization failed'
    }, { status: 500 });
  }
} 