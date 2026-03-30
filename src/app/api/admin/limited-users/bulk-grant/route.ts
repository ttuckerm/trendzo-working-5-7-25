import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { 
      emails, 
      access_duration_days, 
      daily_limit, 
      referral_source, 
      features_enabled 
    } = await request.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Email list is required' },
        { status: 400 }
      );
    }

    const accessGrantedAt = new Date();
    const accessExpiresAt = access_duration_days 
      ? new Date(accessGrantedAt.getTime() + (access_duration_days * 24 * 60 * 60 * 1000))
      : null;

    const usersToCreate = emails.map(email => ({
      email: email.trim(),
      access_granted_at: accessGrantedAt.toISOString(),
      access_expires_at: accessExpiresAt?.toISOString() || null,
      daily_analysis_limit: daily_limit || 3,
      analyses_used_today: 0,
      last_analysis_reset: new Date().toISOString().split('T')[0],
      referral_source: referral_source || null,
      features_enabled: features_enabled || {
        video_analysis: true,
        template_access: 'top5',
        optimization_suggestions: 'basic'
      },
      status: 'active'
    }));

    // Use upsert to handle duplicate emails
    const { data, error } = await supabaseClient
      .from('limited_users')
      .upsert(usersToCreate, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to grant access' },
        { status: 500 }
      );
    }

    // Log the bulk access grant
    for (const user of data || []) {
      await supabaseClient
        .from('user_analytics')
        .insert({
          user_id: user.id,
          action_type: 'access_granted',
          details: {
            granted_by: 'admin',
            access_duration_days,
            daily_limit,
            referral_source,
            features_enabled
          },
          timestamp: new Date().toISOString()
        });
    }

    return NextResponse.json({
      success: true,
      users_created: data?.length || 0,
      message: `Successfully granted access to ${data?.length || 0} users`
    });

  } catch (error) {
    console.error('Bulk grant access error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}