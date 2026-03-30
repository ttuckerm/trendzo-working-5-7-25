import { NextRequest, NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { isEcomForecastEnabled } from "@/lib/feature-flags";

const ItemSchema = z.object({
  id: z.string().min(1, "id is required"),
  name: z.string().min(1, "name is required"),
  conversion_rate: z.number().min(0).max(1),
  margin_rate: z.number().min(0).max(1),
  weekly_traffic: z.number().int().min(0),
  trend_velocity: z.number().min(-1).max(1),
});

const PayloadSchema = z.object({
  items: z.array(ItemSchema).min(1).max(100),
});

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

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
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = PayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const rows = parsed.data.items.map((item) => ({
    id: item.id,
    name: item.name,
    conversion_rate: item.conversion_rate,
    margin_rate: item.margin_rate,
    weekly_traffic: item.weekly_traffic,
    trend_velocity: item.trend_velocity,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("ecom_products")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    upserted: rows.length,
  });
}
