/**
 * Edge Function: run-trainer-experiment
 *
 * Triggered by:
 * - Chairman dashboard button (on-demand)
 * - Nightly cron (auto-checks if conditions are met)
 *
 * Calls the Next.js API route /api/admin/trainer to run the experiment.
 * This edge function acts as a thin proxy that can be invoked by
 * Supabase cron or external triggers without CORS issues.
 */

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const appUrl = Deno.env.get("APP_URL") ?? Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "";

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase env vars" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const db = createClient(supabaseUrl, supabaseKey);

    // Parse request body for optional parameters
    let body: Record<string, any> = {};
    try {
      body = await req.json();
    } catch {
      // No body — that's fine for cron triggers
    }

    const action = body.action ?? "run"; // 'run' or 'promote'
    const variantId = body.variant_id;

    // If app URL is available, proxy to the Next.js API
    if (appUrl) {
      let url = `${appUrl}/api/admin/trainer`;
      if (action === "promote" && variantId) {
        url += `?action=promote&variant_id=${variantId}`;
      } else if (action === "launch") {
        url += "?action=launch";
      } else if (action === "promote_sandbox" && body.experiment_id) {
        url += `?action=promote_sandbox&experiment_id=${body.experiment_id}`;
      } else if (action === "rollback") {
        const nicheParam = body.niche != null ? `&niche=${encodeURIComponent(body.niche)}` : "&niche=";
        url += `?action=rollback${nicheParam}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      return new Response(JSON.stringify(result), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fallback: run directly via Supabase queries (minimal version)
    // This handles the case where the Next.js app isn't available
    // (e.g., edge function invoked during deployment)

    // Check for active program
    const { data: programs } = await db
      .from("trainer_programs")
      .select("id, program_name, is_active")
      .eq("is_active", true)
      .limit(1);

    if (!programs || programs.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No active training program found",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Check feedback data availability
    const { count } = await db
      .from("prediction_runs")
      .select("id", { count: "exact", head: true })
      .not("actual_dps", "is", null)
      .not("predicted_dps_7d", "is", null);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Training program "${programs[0].program_name}" is active. ${count ?? 0} feedback rows available. Use the API route /api/admin/trainer for full training execution.`,
        feedback_rows: count ?? 0,
        program: programs[0].program_name,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("[run-trainer-experiment] Error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
