import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const { data: campaigns, error } = await supabaseClient
      .from('marketing_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch campaigns' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      campaigns: campaigns || []
    });

  } catch (error) {
    console.error('Inception Studio campaigns API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const campaignData = await request.json();

    if (!campaignData.campaign_name || !campaignData.viral_prediction) {
      return NextResponse.json(
        { success: false, error: 'Campaign name and viral prediction are required' },
        { status: 400 }
      );
    }

    // Calculate estimated conversion rate based on viral prediction
    const estimatedConversionRate = campaignData.viral_prediction * 0.002; // 0.2% for high viral content
    const estimatedROI = campaignData.viral_prediction * 5; // 5x ROI for viral content

    const { data, error } = await supabaseClient
      .from('marketing_campaigns')
      .insert({
        campaign_name: campaignData.campaign_name,
        video_title: campaignData.video_title,
        video_description: campaignData.video_description,
        platform: campaignData.platform || 'tiktok',
        viral_prediction: campaignData.viral_prediction,
        conversion_rate: estimatedConversionRate,
        roi_estimate: estimatedROI,
        status: 'active'
      })
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create campaign' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      campaign: data?.[0] || null
    });

  } catch (error) {
    console.error('Inception Studio campaign creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update campaign metrics (for tracking actual performance)
export async function PATCH(request: NextRequest) {
  try {
    const { campaign_id, metrics } = await request.json();

    if (!campaign_id) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (metrics.actual_views !== undefined) updateData.actual_views = metrics.actual_views;
    if (metrics.actual_likes !== undefined) updateData.actual_likes = metrics.actual_likes;
    if (metrics.comments_received !== undefined) updateData.comments_received = metrics.comments_received;
    if (metrics.shares_received !== undefined) updateData.shares_received = metrics.shares_received;
    if (metrics.conversions !== undefined) updateData.conversions = metrics.conversions;

    // Recalculate conversion rate if we have new data
    if (metrics.conversions !== undefined && metrics.actual_views !== undefined && metrics.actual_views > 0) {
      updateData.conversion_rate = metrics.conversions / metrics.actual_views;
    }

    const { data, error } = await supabaseClient
      .from('marketing_campaigns')
      .update(updateData)
      .eq('id', campaign_id)
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update campaign' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      campaign: data?.[0] || null
    });

  } catch (error) {
    console.error('Inception Studio campaign update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}