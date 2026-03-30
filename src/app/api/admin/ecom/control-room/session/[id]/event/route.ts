import { NextRequest, NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { z } from "zod";
import { isEcomForecastEnabled } from "@/lib/feature-flags";
import { getServiceSupabase } from "@/lib/ecom/supabase";

const EventSchema = z.object({
  viewers: z.number().int().min(0),
  comments_per_min: z.number().min(0),
  shares_per_min: z.number().min(0),
  clicks_per_min: z.number().min(0),
  carts_per_min: z.number().min(0),
  purchases_per_min: z.number().min(0),
  revenue_per_min: z.number().min(0).default(0),
  avg_watch_seconds: z.number().min(0).default(0),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  noStore();

  if (!isEcomForecastEnabled()) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 404 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 },
    );
  }

  const { data: session } = await supabase
    .from("ecom_live_sessions")
    .select("id,status")
    .eq("id", params.id)
    .single();

  if (!session) {
    return NextResponse.json(
      { error: `Session '${params.id}' not found` },
      { status: 404 },
    );
  }

  if (session.status === "draft") {
    await supabase
      .from("ecom_live_sessions")
      .update({ status: "live", started_at: new Date().toISOString() })
      .eq("id", params.id);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = EventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data: event, error } = await supabase
    .from("ecom_live_events")
    .insert({
      session_id: params.id,
      viewers: parsed.data.viewers,
      comments_per_min: parsed.data.comments_per_min,
      shares_per_min: parsed.data.shares_per_min,
      clicks_per_min: parsed.data.clicks_per_min,
      carts_per_min: parsed.data.carts_per_min,
      purchases_per_min: parsed.data.purchases_per_min,
      revenue_per_min: parsed.data.revenue_per_min,
      avg_watch_seconds: parsed.data.avg_watch_seconds,
      metadata: parsed.data.metadata ?? null,
    })
    .select("id,ts")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event });
}
