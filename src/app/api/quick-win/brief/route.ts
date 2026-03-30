/**
 * Content Brief API
 *
 * POST  /api/quick-win/brief — Create a new brief
 * PATCH /api/quick-win/brief — Update brief status / actual_vps
 *
 * Tracks creator progress through the Quick Win workflow.
 * Each completed brief becomes a labeled training data point.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { db: { schema: 'public' }, auth: { persistSession: false } },
);

// ── POST: Create brief ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
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
    const { source_video_id, pattern_id, brief_content, predicted_vps } = body;

    const { data, error } = await serviceClient
      .from('content_briefs')
      .insert({
        user_id: user.id,
        source_video_id: source_video_id || null,
        pattern_id: pattern_id || null,
        brief_content: brief_content || {},
        predicted_vps: predicted_vps || null,
        status: 'generated',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Brief] Insert failed:', error.message);
      return NextResponse.json(
        { success: false, error: 'Failed to create brief' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, brief_id: data.id });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Brief] POST error:', msg);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// ── PATCH: Update brief status ───────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
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
    const { brief_id, status, predicted_vps, actual_vps } = body;

    if (!brief_id || !status) {
      return NextResponse.json(
        { success: false, error: 'brief_id and status are required' },
        { status: 400 },
      );
    }

    // Build update payload
    const updatePayload: Record<string, any> = { status };
    if (predicted_vps != null) updatePayload.predicted_vps = predicted_vps;
    if (actual_vps != null) updatePayload.actual_vps = actual_vps;

    const { error: updateError } = await serviceClient
      .from('content_briefs')
      .update(updatePayload)
      .eq('id', brief_id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[Brief] Update failed:', updateError.message);
      return NextResponse.json(
        { success: false, error: 'Failed to update brief' },
        { status: 500 },
      );
    }

    // ── First-win detection (after 'analyzed' or 'published') ────────────
    let firstWin = false;

    if (status === 'analyzed' || status === 'published') {
      const checkVps = predicted_vps ?? actual_vps;

      if (checkVps != null) {
        // Get historical average (excluding current brief)
        const { data: history } = await serviceClient
          .from('content_briefs')
          .select('predicted_vps, actual_vps')
          .eq('user_id', user.id)
          .neq('id', brief_id)
          .not('predicted_vps', 'is', null);

        if (!history || history.length === 0) {
          // New creator: first win if VPS >= 65
          firstWin = checkVps >= 65;
        } else {
          const vpsValues = history
            .map((b: any) => b.actual_vps ?? b.predicted_vps)
            .filter((v: any) => v != null);
          if (vpsValues.length > 0) {
            const avg =
              vpsValues.reduce((sum: number, v: number) => sum + v, 0) /
              vpsValues.length;
            firstWin = checkVps > avg * 1.4;
          }
        }

        if (firstWin) {
          await serviceClient
            .from('content_briefs')
            .update({ first_win: true })
            .eq('id', brief_id)
            .eq('user_id', user.id);
        }
      }
    }

    // ── Pattern performance tracking (when brief reaches 'measured') ────
    if (status === 'measured' && actual_vps != null) {
      try {
        const { trackPatternPerformance } = await import(
          '@/lib/content/pattern-performance-tracker'
        );
        const perfResult = await trackPatternPerformance(
          serviceClient,
          brief_id,
          user.id,
        );
        if (perfResult) {
          console.log(
            `[Brief] Pattern performance tracked: delta=${perfResult.delta}, ` +
              `overperformed=${perfResult.overperformed}, underperformed=${perfResult.underperformed}`,
          );
        }
      } catch (perfErr: any) {
        // Non-fatal — don't break the brief update
        console.error(
          `[Brief] Pattern performance tracking failed: ${perfErr.message}`,
        );
      }
    }

    return NextResponse.json({ success: true, firstWin });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Brief] PATCH error:', msg);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
