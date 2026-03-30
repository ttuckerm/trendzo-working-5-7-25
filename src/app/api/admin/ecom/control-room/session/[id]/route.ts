import { NextRequest, NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { isEcomForecastEnabled } from "@/lib/feature-flags";
import { getServiceSupabase } from "@/lib/ecom/supabase";
import { computeHealth, type LiveEvent } from "@/lib/ecom/session-health";

export async function GET(
  _request: NextRequest,
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

  const { data: session, error: sessErr } = await supabase
    .from("ecom_live_sessions")
    .select("*")
    .eq("id", params.id)
    .single();

  if (sessErr || !session) {
    return NextResponse.json(
      { error: `Session '${params.id}' not found` },
      { status: 404 },
    );
  }

  const { data: events, error: evErr } = await supabase
    .from("ecom_live_events")
    .select("*")
    .eq("session_id", params.id)
    .order("ts", { ascending: true })
    .limit(120);

  if (evErr) {
    return NextResponse.json({ error: evErr.message }, { status: 500 });
  }

  const mapped: LiveEvent[] = (events ?? []).map((e) => ({
    ts: e.ts,
    viewers: Number(e.viewers),
    comments_per_min: Number(e.comments_per_min),
    shares_per_min: Number(e.shares_per_min),
    clicks_per_min: Number(e.clicks_per_min),
    carts_per_min: Number(e.carts_per_min),
    purchases_per_min: Number(e.purchases_per_min),
    revenue_per_min: Number(e.revenue_per_min),
    avg_watch_seconds: Number(e.avg_watch_seconds),
  }));

  const healthReport = computeHealth(mapped);

  let productName: string | null = null;
  if (session.product_id) {
    const { data: prod } = await supabase
      .from("ecom_products")
      .select("name")
      .eq("id", session.product_id)
      .single();
    productName = prod?.name ?? null;
  }

  return NextResponse.json({
    session: { ...session, product_name: productName },
    events: mapped,
    ...healthReport,
  });
}

export async function PATCH(
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

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    // empty
  }

  const updates: Record<string, unknown> = {};
  if (body.status === "ended") {
    updates.status = "ended";
    updates.ended_at = new Date().toISOString();
  } else if (body.status === "live") {
    updates.status = "live";
    updates.started_at = new Date().toISOString();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("ecom_live_sessions")
    .update(updates)
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
