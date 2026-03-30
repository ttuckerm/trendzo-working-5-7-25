"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = {
  id: string;
  name: string;
  score: number;
  reasons: string[];
  conversion_rate?: number;
  margin_rate?: number;
  weekly_traffic?: number;
  trend_velocity?: number;
};

type ForecastResponse = {
  items?: Item[];
  source?: "supabase" | "demo";
  error?: string;
};

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export default function ForecastTab() {
  const [json, setJson] = useState<ForecastResponse>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/admin/ecom/forecast`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setJson)
      .catch(() => setJson({ error: "Failed to reach forecast API" }))
      .finally(() => setLoading(false));
  }, []);

  const items: Item[] = json?.items ?? [];
  const source = json?.source ?? "unknown";
  const isDemo = source === "demo";

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted/40 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium ${
            isDemo
              ? "bg-amber-900/30 text-amber-400"
              : "bg-emerald-900/30 text-emerald-400"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isDemo ? "bg-amber-500" : "bg-emerald-500"
            }`}
          />
          Data source: {isDemo ? "Demo (dev only)" : "Supabase"}
        </span>
        {isDemo && (
          <span className="text-muted-foreground">
            Showing placeholder data — ingest real products below.
          </span>
        )}
      </div>

      {json.error && (
        <div className="rounded-lg border border-red-800 bg-red-950/30 p-4 text-sm text-red-400">
          {json.error}
        </div>
      )}

      <div className="rounded-lg border">
        <div className="p-3 border-b text-sm font-medium">
          Products ({items.length})
        </div>

        {items.length === 0 && !json.error ? (
          <div className="p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="text-3xl">📦</div>
              <div className="font-medium">No products yet</div>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Ingest product data via the API to start seeing forecasts. Use
                the curl command below to add your first products.
              </p>
            </div>
            <div className="rounded-md bg-muted/50 p-4 text-xs font-mono overflow-x-auto">
              <pre className="whitespace-pre-wrap break-all">{`curl -X POST http://localhost:3000/api/admin/ecom/ingest \\
  -H "Content-Type: application/json" \\
  -d '{"items":[{"id":"prod-001","name":"Example Product","conversion_rate":0.035,"margin_rate":0.42,"weekly_traffic":12000,"trend_velocity":0.78}]}'`}</pre>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((p) => (
              <div
                key={p.id}
                className="p-4 flex items-start justify-between gap-6"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                    {typeof p.trend_velocity === "number" && (
                      <span>Trend: {p.trend_velocity}</span>
                    )}
                    {typeof p.weekly_traffic === "number" && (
                      <span>Traffic: {p.weekly_traffic}</span>
                    )}
                    {typeof p.conversion_rate === "number" && (
                      <span>CR: {p.conversion_rate}</span>
                    )}
                    {typeof p.margin_rate === "number" && (
                      <span>Margin: {p.margin_rate}</span>
                    )}
                  </div>
                  {p.reasons?.length ? (
                    <ul className="mt-2 text-xs text-muted-foreground list-disc pl-4 space-y-1">
                      {p.reasons.slice(0, 4).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-sm tabular-nums">
                    Score: <span className="font-semibold">{p.score}</span>
                  </div>
                  <Link
                    className="underline text-sm"
                    href={`/admin/ecom/${p.id}`}
                  >
                    View rationale
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
