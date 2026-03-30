import { NextRequest, NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { isEcomForecastEnabled } from "@/lib/feature-flags";
import {
  generateLiveRecipe,
  type ProductMetrics,
} from "@/lib/ecom/live-recipe-generator";

const InputSchema = z.object({
  targetBuyer: z.string().optional(),
  pricePoint: z.string().optional(),
  creatorStyle: z.string().optional(),
});

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

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

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine — all fields are optional
  }

  const parsed = InputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data: product, error: fetchErr } = await supabase
    .from("ecom_products")
    .select(
      "id,name,conversion_rate,margin_rate,weekly_traffic,trend_velocity",
    )
    .eq("id", params.id)
    .single();

  if (fetchErr || !product) {
    return NextResponse.json(
      { error: `Product '${params.id}' not found` },
      { status: 404 },
    );
  }

  const metrics: ProductMetrics = {
    id: product.id,
    name: product.name,
    conversion_rate: Number(product.conversion_rate),
    margin_rate: Number(product.margin_rate),
    weekly_traffic: Number(product.weekly_traffic),
    trend_velocity: Number(product.trend_velocity),
  };

  const recipe = generateLiveRecipe(metrics, parsed.data);

  const { data: saved, error: saveErr } = await supabase
    .from("ecom_live_recipes")
    .insert({
      product_id: params.id,
      target_buyer: parsed.data.targetBuyer ?? null,
      price_point: parsed.data.pricePoint ?? null,
      creator_style: parsed.data.creatorStyle ?? null,
      recipe,
    })
    .select("id,created_at")
    .single();

  if (saveErr) {
    return NextResponse.json(
      { error: `Recipe generated but failed to persist: ${saveErr.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    recipeId: saved.id,
    createdAt: saved.created_at,
    recipe,
  });
}

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

  const { data, error } = await supabase
    .from("ecom_live_recipes")
    .select("id,product_id,target_buyer,price_point,creator_style,recipe,created_at")
    .eq("product_id", params.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ recipe: null });
  }

  return NextResponse.json({
    recipeId: data.id,
    createdAt: data.created_at,
    recipe: data.recipe,
  });
}
