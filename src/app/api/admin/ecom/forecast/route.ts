import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { isEcomForecastEnabled } from "@/lib/feature-flags";

const RowSchema = z.object({
  id: z.string(),
  name: z.string(),
  conversion_rate: z.coerce.number().default(0),
  margin_rate: z.coerce.number().default(0),
  weekly_traffic: z.coerce.number().default(0),
  trend_velocity: z.coerce.number().default(0),
});

function scoreRow(r: z.infer<typeof RowSchema>) {
  const score =
    r.conversion_rate * 1000 * 0.35 +
    r.margin_rate * 100 * 0.25 +
    Math.min(r.weekly_traffic / 1000, 100) * 0.2 +
    r.trend_velocity * 100 * 0.2;

  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  const reasons: string[] = [];
  if (r.trend_velocity >= 0.6) reasons.push("High trend velocity");
  if (r.weekly_traffic >= 8000) reasons.push("Strong weekly traffic");
  if (r.conversion_rate >= 0.03) reasons.push("Above-average conversion rate");
  if (r.margin_rate >= 0.35) reasons.push("Healthy margin rate");
  while (reasons.length < 3)
    reasons.push("Insufficient signals; using baseline heuristics");

  return { score: clamped, reasons: reasons.slice(0, 5) };
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

const DEMO_ROWS = [
  {
    id: "demo-1",
    name: "[DEMO] Viral Planner Notebook",
    conversion_rate: 0.035,
    margin_rate: 0.42,
    weekly_traffic: 12000,
    trend_velocity: 0.78,
  },
  {
    id: "demo-2",
    name: "[DEMO] LED Ring Light",
    conversion_rate: 0.022,
    margin_rate: 0.31,
    weekly_traffic: 5400,
    trend_velocity: 0.63,
  },
];

export async function GET() {
  noStore();

  if (!isEcomForecastEnabled()) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 404 });
  }

  const supabase = getServiceSupabase();

  if (!supabase) {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 },
      );
    }

    const items = DEMO_ROWS.map((r) => ({ ...r, ...scoreRow(r) }));
    return NextResponse.json({ items, source: "demo" });
  }

  const { data, error } = await supabase
    .from("ecom_products")
    .select("id,name,conversion_rate,margin_rate,weekly_traffic,trend_velocity")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []).map((r) => RowSchema.parse(r));

  const items = rows
    .map((r) => ({ ...r, ...scoreRow(r) }))
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({ items, source: "supabase" });
}
