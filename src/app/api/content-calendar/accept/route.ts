/**
 * Content Calendar Accept API
 *
 * POST /api/content-calendar/accept
 *
 * Accepts a brief from the content calendar, creating a content_brief entry
 * and marking the calendar slot as accepted.
 *
 * Body: { calendar_id, day, pattern_id }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { CalendarBrief } from '@/lib/content/content-calendar';

export const dynamic = 'force-dynamic';

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { db: { schema: 'public' }, auth: { persistSession: false } },
);

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const authSupabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { calendar_id, day, pattern_id } = body;

    if (!calendar_id || day == null || !pattern_id) {
      return NextResponse.json(
        { success: false, error: 'calendar_id, day, and pattern_id are required' },
        { status: 400 },
      );
    }

    // ── Verify calendar ownership ────────────────────────────────────────
    const { data: calendar, error: calError } = await serviceClient
      .from('content_calendars')
      .select('id, user_id, calendar_data')
      .eq('id', calendar_id)
      .single();

    if (calError || !calendar) {
      return NextResponse.json(
        { success: false, error: 'Calendar not found' },
        { status: 404 },
      );
    }

    if (calendar.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 },
      );
    }

    // ── Find the brief in calendar_data ──────────────────────────────────
    const calendarBriefs = (calendar.calendar_data || []) as CalendarBrief[];
    const briefIndex = calendarBriefs.findIndex(
      b => b.day === day && b.pattern_id === pattern_id,
    );

    if (briefIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Brief not found in calendar' },
        { status: 404 },
      );
    }

    const calendarBrief = calendarBriefs[briefIndex];

    if (calendarBrief.status === 'accepted' || calendarBrief.status === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Brief already accepted' },
        { status: 409 },
      );
    }

    // ── Create content_brief entry ───────────────────────────────────────
    const { data: newBrief, error: briefError } = await serviceClient
      .from('content_briefs')
      .insert({
        user_id: user.id,
        source_video_id: null,
        pattern_id,
        brief_content: {
          topic_angle: calendarBrief.topic_angle,
          hook_text: calendarBrief.hook_text,
          format_suggestion: calendarBrief.format_suggestion,
          calendar_day: calendarBrief.day,
          narrative_arc: calendarBrief.narrative_arc,
          pattern_name: calendarBrief.pattern_name,
        },
        predicted_vps: calendarBrief.predicted_vps,
        status: 'accepted',
      })
      .select('id')
      .single();

    if (briefError || !newBrief) {
      console.error(`[CalendarAccept] Brief creation failed: ${briefError?.message}`);
      return NextResponse.json(
        { success: false, error: 'Failed to create brief' },
        { status: 500 },
      );
    }

    // ── Update calendar_data to mark as accepted ─────────────────────────
    const updatedBriefs = [...calendarBriefs];
    updatedBriefs[briefIndex] = {
      ...calendarBrief,
      status: 'accepted',
      brief_id: newBrief.id,
    };

    const { error: updateError } = await serviceClient
      .from('content_calendars')
      .update({ calendar_data: updatedBriefs })
      .eq('id', calendar_id);

    if (updateError) {
      console.error(`[CalendarAccept] Calendar update failed: ${updateError.message}`);
      // Non-fatal — the brief was created successfully
    }

    return NextResponse.json({
      success: true,
      brief_id: newBrief.id,
      elapsed_ms: Date.now() - startTime,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[CalendarAccept] Error: ${msg}`);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
