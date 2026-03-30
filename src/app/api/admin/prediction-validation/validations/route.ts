import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const engine = searchParams.get('engine') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const niche = searchParams.get('niche');

    let query = supabaseClient
      .from('prediction_validation')
      .select('*')
      .order('prediction_timestamp', { ascending: false })
      .limit(limit);

    if (engine !== 'all') {
      query = query.eq('prediction_engine', engine);
    }

    if (niche) {
      query = query.eq('niche', niche);
    }

    const { data: validations, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch validation records' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      validations: validations || []
    });

  } catch (error) {
    console.error('Prediction validation API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create new prediction validation record
export async function POST(request: NextRequest) {
  try {
    const validationData = await request.json();

    const { data, error } = await supabaseClient
      .from('prediction_validation')
      .insert({
        video_id: validationData.video_id,
        predicted_probability: validationData.predicted_probability,
        prediction_engine: validationData.prediction_engine,
        prediction_timestamp: validationData.prediction_timestamp || new Date().toISOString(),
        niche: validationData.niche || 'general',
        platform: validationData.platform || 'tiktok'
      })
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create validation record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      validation: data?.[0] || null
    });

  } catch (error) {
    console.error('Prediction validation creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}