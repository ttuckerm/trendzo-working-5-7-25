/**
 * API Route: Export Training Data
 * 
 * GET /api/training/export
 * GET /api/training/export?split=train
 * 
 * Exports training data in JSON format for ML model training.
 */

import { NextRequest, NextResponse } from 'next/server';
import { exportTrainingData } from '@/lib/services/training';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const split = searchParams.get('split') as 'train' | 'validation' | 'test' | null;
    const format = searchParams.get('format') || 'json';

    console.log(`📤 Exporting training data${split ? ` (${split} split)` : ''}`);

    const data = await exportTrainingData(split || undefined);

    if (data.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No training data found',
        data: [],
        count: 0
      });
    }

    // Transform for ML training
    const trainingData = data.map(row => ({
      video_id: row.video_id,
      
      // Target variable
      dps_score: row.actual_dps_score,
      performance_tier: row.performance_tier,
      
      // Features
      features: row.features,
      
      // Metadata
      quality_score: row.quality_score,
      feature_coverage: row.feature_coverage,
      data_split: row.data_split,
      
      // Ground truth metrics
      views: row.actual_views,
      likes: row.actual_likes,
      comments: row.actual_comments,
      shares: row.actual_shares,
      saves: row.actual_saves,
      engagement_rate: row.actual_engagement_rate
    }));

    // Return based on format
    if (format === 'csv') {
      // Convert to CSV (simplified - features as JSON string)
      const headers = [
        'video_id', 'dps_score', 'performance_tier', 'views', 'likes', 
        'comments', 'shares', 'saves', 'engagement_rate', 'quality_score',
        'feature_coverage', 'data_split', 'features'
      ];
      
      const csvRows = [headers.join(',')];
      
      for (const row of trainingData) {
        csvRows.push([
          row.video_id,
          row.dps_score,
          row.performance_tier,
          row.views,
          row.likes,
          row.comments,
          row.shares,
          row.saves,
          row.engagement_rate,
          row.quality_score,
          row.feature_coverage,
          row.data_split,
          `"${JSON.stringify(row.features).replace(/"/g, '""')}"`
        ].join(','));
      }

      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="training_data_${split || 'all'}_${Date.now()}.csv"`
        }
      });
    }

    // Default: JSON format
    return NextResponse.json({
      success: true,
      count: trainingData.length,
      split: split || 'all',
      exportedAt: new Date().toISOString(),
      data: trainingData
    });

  } catch (error: any) {
    console.error('Training export error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message 
      },
      { status: 500 }
    );
  }
}























































































