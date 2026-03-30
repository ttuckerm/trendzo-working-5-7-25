/**
 * Creator Prediction History API
 *
 * GET /api/creator/predictions?username=X - Get prediction history for creator
 * POST /api/creator/predictions - Save a new prediction with creator context
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json(
      { success: false, error: 'username parameter required' },
      { status: 400 }
    );
  }

  try {
    // Get creator profile
    const { data: profile } = await supabase
      .from('creator_profiles')
      .select('id')
      .eq('tiktok_username', username)
      .single();

    if (!profile) {
      return NextResponse.json({
        success: true,
        predictions: []
      });
    }

    // Get predictions for this creator
    const { data: predictions, error } = await supabase
      .from('creator_predictions')
      .select('*')
      .eq('creator_profile_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      predictions: predictions || []
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      creator_username,
      prediction_id,
      video_id,
      predicted_dps,
      relative_score,
      improvement_factor,
      percentile_rank,
      adjusted_dps,
      contextualized_message
    } = body;

    // Get creator profile ID
    const { data: profile } = await supabase
      .from('creator_profiles')
      .select('id')
      .eq('tiktok_username', creator_username)
      .single();

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Creator profile not found' },
        { status: 404 }
      );
    }

    // Insert prediction record
    const { data, error } = await supabase
      .from('creator_predictions')
      .insert({
        creator_profile_id: profile.id,
        prediction_id,
        video_id,
        predicted_dps,
        relative_score,
        improvement_factor,
        percentile_rank,
        adjusted_dps,
        contextualized_message
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      prediction: data
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
