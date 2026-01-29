import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get REAL prediction accuracy from videos table
    const { data: videos, count: totalVideos } = await supabase
      .from('videos')
      .select('*', { count: 'exact' });

    if (!videos || videos.length === 0) {
      return NextResponse.json({
        success: true,
        evidence: {
          actualAccuracy: '0%',
          proofOfConcept: {
            correctPredictions: 0,
            totalPredictions: 0,
            accuracyRate: 0
          }
        },
        accuracy: {
          overall: {
            totalPredictions: 0,
            correctPredictions: 0,
            accuracyRate: 0,
            meetsTarget: false,
            target: 90
          }
        }
      });
    }

    // Calculate accuracy based on viral score vs engagement performance
    let correctPredictions = 0;
    
    for (const video of videos) {
      const predictedViral = video.viral_score >= 70;
      
      // Calculate actual performance based on engagement metrics
      const engagementRate = video.view_count > 0 
        ? ((video.like_count + video.comment_count + video.share_count) / video.view_count) * 100 
        : 0;
      
      const actuallyViral = engagementRate > 5 || video.view_count > 500000;
      
      if (predictedViral === actuallyViral) {
        correctPredictions++;
      }
    }

    const actualAccuracy = (correctPredictions / totalVideos) * 100;

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      
      // Core accuracy metrics with REAL data
      accuracy: {
        overall: {
          totalPredictions: totalVideos,
          correctPredictions: correctPredictions,
          accuracyRate: actualAccuracy,
          meetsTarget: actualAccuracy >= 90,
          target: 90
        }
      },
      
      // REAL evidence for proof of concept
      evidence: {
        actualAccuracy: `${actualAccuracy.toFixed(1)}%`,
        proofOfConcept: {
          correctPredictions: correctPredictions,
          totalPredictions: totalVideos,
          accuracyRate: actualAccuracy
        }
      },

      // Video breakdown
      videoBreakdown: videos.map(video => ({
        tiktokId: video.tiktok_id,
        predictedViral: video.viral_score >= 70,
        viralScore: video.viral_score,
        viewCount: video.view_count,
        engagementRate: video.view_count > 0 
          ? ((video.like_count + video.comment_count + video.share_count) / video.view_count) * 100 
          : 0,
        creator: video.creator_username
      }))
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Real accuracy validation error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to validate prediction accuracy',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}