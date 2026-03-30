import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';

export async function PATCH(request: NextRequest) {
  try {
    const { user_id, ...updates } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Add allowed fields to update
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.daily_analysis_limit !== undefined) updateData.daily_analysis_limit = updates.daily_analysis_limit;
    if (updates.access_expires_at !== undefined) updateData.access_expires_at = updates.access_expires_at;
    if (updates.features_enabled !== undefined) updateData.features_enabled = updates.features_enabled;
    if (updates.tiktok_username !== undefined) updateData.tiktok_username = updates.tiktok_username;

    const { data, error } = await supabaseClient
      .from('limited_users')
      .update(updateData)
      .eq('id', user_id)
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Log the update action
    await supabaseClient
      .from('user_analytics')
      .insert({
        user_id,
        action_type: 'admin_update',
        details: {
          updated_fields: Object.keys(updates),
          updated_by: 'admin',
          changes: updates
        },
        timestamp: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      user: data?.[0] || null
    });

  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}