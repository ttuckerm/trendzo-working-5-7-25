"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Product = {
  id: string;
  name: string;
  score: number;
  reasons: string[];
  conversion_rate: number;
  margin_rate: number;
  weekly_traffic: number;
  trend_velocity: number;
};

type RunOfShowEntry = { minute: number; segment: string; notes: string };
type Objection = { objection: string; reframe: string };
type OfferTier = { tier: string; description: string; anchor: string };
type CtaMoment = { timestamp: string; trigger: string; script: string };
type PivotTrigger = { signal: string; action: string };

type LiveRecipe = {
  hookOptions: string[];
  runOfShow: RunOfShowEntry[];
  objections: Objection[];
  offerStack: OfferTier[];
  ctaMoments: CtaMoment[];
  pivotTriggers: PivotTrigger[];
  meta: {
    generatedFor: string;
    targetBuyer: string;
    pricePoint: string;
    creatorStyle: string;
    metricsSnapshot: Record<string, number>;
  };
};

type RecipeResponse = {
  recipeId?: string;
  createdAt?: string;
  recipe: LiveRecipe | null;
};

export default function EcomProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [recipe, setRecipe] = useState<LiveRecipe | null>(null);
  const [recipeCreatedAt, setRecipeCreatedAt] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [recipeError, setRecipeError] = useState<string | null>(null);

  const [targetBuyer, setTargetBuyer] = useState("");
  const [pricePoint, setPricePoint] = useState("");
  const [creatorStyle, setCreatorStyle] = useState("");

  const base =
    process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${base}/api/admin/ecom/forecast`, {
          cache: "no-store",
        });
        const json = await res.json();
        const items = json?.items ?? [];
        const found = items.find((x: Product) => x.id === productId);
        setProduct(found ?? null);
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId, base]);

  useEffect(() => {
    async function loadRecipe() {
      try {
        const res = await fetch(
          `${base}/api/admin/ecom/products/${productId}/live-recipe`,
        );
        if (!res.ok) return;
        const data: RecipeResponse = await res.json();
        if (data.recipe) {
          setRecipe(data.recipe);
          setRecipeCreatedAt(data.createdAt ?? null);
        }
      } catch {
        // no persisted recipe — that's fine
      }
    }
    loadRecipe();
  }, [productId, base]);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setRecipeError(null);
    try {
      const body: Record<string, string> = {};
      if (targetBuyer.trim()) body.targetBuyer = targetBuyer.trim();
      if (pricePoint.trim()) body.pricePoint = pricePoint.trim();
      if (creatorStyle.trim()) body.creatorStyle = creatorStyle.trim();

      const res = await fetch(
        `${base}/api/admin/ecom/products/${productId}/live-recipe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setRecipeError(data.error ?? "Failed to generate recipe");
        return;
      }
      setRecipe(data.recipe);
      setRecipeCreatedAt(data.createdAt ?? null);
    } catch (err) {
      setRecipeError(err instanceof Error ? err.message : "Network error");
    } finally {
      setGenerating(false);
    }
  }, [productId, targetBuyer, pricePoint, creatorStyle, base]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-6 w-48 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Product Detail</h1>
        <Link className="underline text-sm" href="/admin/ecom">
          Back to list
        </Link>
      </div>

      {!product ? (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          No product found for <code>{productId}</code>
        </div>
      ) : (
        <>
          {/* Product card */}
          <div className="rounded-lg border p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-medium">{product.name}</div>
                <div className="text-sm text-muted-foreground">
                  Forecast Score:{" "}
                  <span className="font-semibold">{product.score}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <Metric label="Trend Velocity" value={product.trend_velocity} />
              <Metric
                label="Weekly Traffic"
                value={product.weekly_traffic.toLocaleString()}
              />
              <Metric
                label="Conversion"
                value={`${(product.conversion_rate * 100).toFixed(1)}%`}
              />
              <Metric
                label="Margin"
                value={`${(product.margin_rate * 100).toFixed(0)}%`}
              />
            </div>

            {product.reasons?.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-1">Score Signals</div>
                <ul className="text-sm list-disc pl-5 space-y-0.5 text-muted-foreground">
                  {product.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recipe generator */}
          <div className="rounded-lg border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Live Recipe Builder</div>
                <div className="text-xs text-muted-foreground">
                  Generate a product-aware live selling script with hooks,
                  run-of-show, objections, offers, CTAs, and pivot triggers.
                </div>
              </div>
              {recipeCreatedAt && (
                <span className="text-xs text-muted-foreground shrink-0">
                  Last generated:{" "}
                  {new Date(recipeCreatedAt).toLocaleString()}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <InputField
                label="Target Buyer"
                placeholder="e.g. impulse buyer, 18-34"
                value={targetBuyer}
                onChange={setTargetBuyer}
              />
              <InputField
                label="Price Point"
                placeholder="e.g. under $50"
                value={pricePoint}
                onChange={setPricePoint}
              />
              <InputField
                label="Creator Style"
                placeholder="e.g. authentic, direct-to-camera"
                value={creatorStyle}
                onChange={setCreatorStyle}
              />
            </div>

            {recipeError && (
              <div className="text-sm text-red-400 bg-red-950/30 border border-red-800 rounded-md px-3 py-2">
                {recipeError}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-md bg-[#e50914] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#c4070f] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Spinner /> Generating...
                </>
              ) : recipe ? (
                "Regenerate Recipe"
              ) : (
                "Generate Live Recipe"
              )}
            </button>
          </div>

          {/* Recipe display */}
          {recipe && <RecipeDisplay recipe={recipe} />}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1">
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#e50914]/30 focus:border-[#e50914]"
      />
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function RecipeDisplay({ recipe }: { recipe: LiveRecipe }) {
  return (
    <div className="space-y-4">
      {/* Hooks */}
      <RecipeSection title="Hook Options" count={recipe.hookOptions.length}>
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          {recipe.hookOptions.map((h, i) => (
            <li key={i} className="leading-relaxed">
              {h}
            </li>
          ))}
        </ol>
      </RecipeSection>

      {/* Run of Show */}
      <RecipeSection title="Run of Show" count={recipe.runOfShow.length}>
        <div className="space-y-3">
          {recipe.runOfShow.map((seg) => (
            <div key={seg.minute} className="flex gap-3 text-sm">
              <div className="shrink-0 w-16 font-mono text-xs bg-muted/60 rounded px-2 py-1 text-center">
                {seg.minute}:00
              </div>
              <div>
                <div className="font-medium">{seg.segment}</div>
                <div className="text-muted-foreground text-xs mt-0.5">
                  {seg.notes}
                </div>
              </div>
            </div>
          ))}
        </div>
      </RecipeSection>

      {/* Objections */}
      <RecipeSection title="Objection Handling" count={recipe.objections.length}>
        <div className="space-y-3">
          {recipe.objections.map((o, i) => (
            <div key={i} className="text-sm space-y-1">
              <div className="font-medium text-red-600 dark:text-red-400">
                {o.objection}
              </div>
              <div className="text-muted-foreground pl-3 border-l-2 border-emerald-500">
                {o.reframe}
              </div>
            </div>
          ))}
        </div>
      </RecipeSection>

      {/* Offer Stack */}
      <RecipeSection title="Offer Stack" count={recipe.offerStack.length}>
        <div className="grid gap-3">
          {recipe.offerStack.map((o, i) => (
            <div
              key={i}
              className="rounded-md border p-3 text-sm space-y-1"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                  {o.tier}
                </span>
              </div>
              <div>{o.description}</div>
              <div className="text-xs text-muted-foreground italic">
                {o.anchor}
              </div>
            </div>
          ))}
        </div>
      </RecipeSection>

      {/* CTA Moments */}
      <RecipeSection title="CTA Moments" count={recipe.ctaMoments.length}>
        <div className="space-y-3">
          {recipe.ctaMoments.map((c, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <div className="shrink-0 w-12 font-mono text-xs bg-muted/60 rounded px-2 py-1 text-center">
                {c.timestamp}
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  {c.trigger}
                </div>
                <div className="mt-0.5">{c.script}</div>
              </div>
            </div>
          ))}
        </div>
      </RecipeSection>

      {/* Pivot Triggers */}
      <RecipeSection
        title="Pivot Triggers"
        count={recipe.pivotTriggers.length}
      >
        <div className="space-y-3">
          {recipe.pivotTriggers.map((p, i) => (
            <div key={i} className="text-sm space-y-1">
              <div className="font-medium text-amber-600 dark:text-amber-400">
                {p.signal}
              </div>
              <div className="text-muted-foreground pl-3 border-l-2 border-amber-500">
                {p.action}
              </div>
            </div>
          ))}
        </div>
      </RecipeSection>

      {/* Meta */}
      <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground space-y-1">
        <div className="font-medium text-foreground text-sm mb-1">
          Generation Context
        </div>
        <div>Target buyer: {recipe.meta.targetBuyer}</div>
        <div>Price point: {recipe.meta.pricePoint}</div>
        <div>Creator style: {recipe.meta.creatorStyle}</div>
        <div className="pt-1 font-mono">
          Metrics: CR {recipe.meta.metricsSnapshot.conversion_rate} | Margin{" "}
          {recipe.meta.metricsSnapshot.margin_rate} | Traffic{" "}
          {recipe.meta.metricsSnapshot.weekly_traffic} | Trend{" "}
          {recipe.meta.metricsSnapshot.trend_velocity}
        </div>
      </div>
    </div>
  );
}

function RecipeSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="font-medium">{title}</div>
        <span className="text-xs bg-muted rounded-full px-2 py-0.5">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}
