import { NextRequest, NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { z } from "zod";
import { isEcomForecastEnabled } from "@/lib/feature-flags";
import { getServiceSupabase } from "@/lib/ecom/supabase";

const CreateSchema = z.object({
  product_id: z.string().min(1),
  title: z.string().optional(),
  notes: z.string().optional(),
  target_buyer: z.string().optional(),
  creator_style: z.string().optional(),
});

export async function POST(request: NextRequest) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data: session, error } = await supabase
    .from("ecom_live_sessions")
    .insert({
      product_id: parsed.data.product_id,
      title: parsed.data.title ?? null,
      notes: parsed.data.notes ?? null,
      target_buyer: parsed.data.target_buyer ?? null,
      creator_style: parsed.data.creator_style ?? null,
      status: "draft",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session });
}

export async function GET() {
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

  const { data, error } = await supabase
    .from("ecom_live_sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessions: data ?? [] });
}
