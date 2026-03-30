"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Session {
  id: string;
  product_id: string | null;
  product_name?: string | null;
  status: string;
  title: string | null;
  notes: string | null;
  target_buyer: string | null;
  creator_style: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

interface LiveEvent {
  ts: string;
  viewers: number;
  comments_per_min: number;
  shares_per_min: number;
  clicks_per_min: number;
  carts_per_min: number;
  purchases_per_min: number;
  revenue_per_min: number;
  avg_watch_seconds: number;
}

interface RecommendedAction {
  title: string;
  why: string;
  scriptLines: string[];
}

interface SessionDetail {
  session: Session;
  events: LiveEvent[];
  health: "green" | "yellow" | "red";
  reasons: string[];
  recommendedActions: RecommendedAction[];
}

interface Product {
  id: string;
  name: string;
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function ControlRoomTab() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // New session form
  const [newProductId, setNewProductId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  // Manual event form
  const [eventForm, setEventForm] = useState<Record<string, string>>({
    viewers: "",
    comments_per_min: "",
    shares_per_min: "",
    clicks_per_min: "",
    carts_per_min: "",
    purchases_per_min: "",
    revenue_per_min: "",
    avg_watch_seconds: "",
  });
  const [submittingEvent, setSubmittingEvent] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/admin/ecom/control-room/session`);
      const data = await res.json();
      setSessions(data.sessions ?? []);
    } catch {
      // silent
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/admin/ecom/forecast`);
      const data = await res.json();
      setProducts(
        (data.items ?? []).map((p: Product) => ({ id: p.id, name: p.name })),
      );
    } catch {
      // silent
    }
  }, []);

  const fetchDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(
        `${BASE}/api/admin/ecom/control-room/session/${id}`,
      );
      const data: SessionDetail = await res.json();
      setDetail(data);
    } catch {
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchProducts();
  }, [fetchSessions, fetchProducts]);

  useEffect(() => {
    if (activeSessionId) fetchDetail(activeSessionId);
  }, [activeSessionId, fetchDetail]);

  const handleCreateSession = async () => {
    if (!newProductId) return;
    setCreating(true);
    try {
      const res = await fetch(`${BASE}/api/admin/ecom/control-room/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: newProductId,
          title: newTitle || undefined,
        }),
      });
      const data = await res.json();
      if (data.session) {
        setActiveSessionId(data.session.id);
        setNewTitle("");
        await fetchSessions();
      }
    } catch {
      // silent
    } finally {
      setCreating(false);
    }
  };

  const handlePostEvent = async () => {
    if (!activeSessionId) return;
    setSubmittingEvent(true);
    try {
      const payload = {
        viewers: Number(eventForm.viewers) || 0,
        comments_per_min: Number(eventForm.comments_per_min) || 0,
        shares_per_min: Number(eventForm.shares_per_min) || 0,
        clicks_per_min: Number(eventForm.clicks_per_min) || 0,
        carts_per_min: Number(eventForm.carts_per_min) || 0,
        purchases_per_min: Number(eventForm.purchases_per_min) || 0,
        revenue_per_min: Number(eventForm.revenue_per_min) || 0,
        avg_watch_seconds: Number(eventForm.avg_watch_seconds) || 0,
      };
      await fetch(
        `${BASE}/api/admin/ecom/control-room/session/${activeSessionId}/event`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      await fetchDetail(activeSessionId);
      await fetchSessions();
    } catch {
      // silent
    } finally {
      setSubmittingEvent(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSessionId) return;
    await fetch(
      `${BASE}/api/admin/ecom/control-room/session/${activeSessionId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ended" }),
      },
    );
    await fetchDetail(activeSessionId);
    await fetchSessions();
  };

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Create session */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="font-medium">Start New Session</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Product
            </label>
            <select
              value={newProductId}
              onChange={(e) => setNewProductId(e.target.value)}
              className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm"
            >
              <option value="">Select a product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Session Title (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Friday Night Live"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleCreateSession}
              disabled={creating || !newProductId}
              className="rounded-md bg-[#e50914] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#c4070f] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? "Creating…" : "Create Session"}
            </button>
          </div>
        </div>
      </div>

      {/* Session list */}
      <div className="rounded-lg border">
        <div className="p-3 border-b text-sm font-medium">
          Recent Sessions ({sessions.length})
        </div>
        {loadingSessions ? (
          <div className="p-4">
            <div className="h-8 bg-muted/40 rounded animate-pulse" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No sessions yet. Create one above.
          </div>
        ) : (
          <div className="divide-y max-h-60 overflow-y-auto">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={`w-full text-left p-3 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors ${
                  activeSessionId === s.id ? "bg-muted/50" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {s.title || s.product_id || "Untitled"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleString()}
                  </div>
                </div>
                <StatusBadge status={s.status} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Session detail */}
      {activeSessionId && (
        <>
          {loadingDetail ? (
            <div className="rounded-lg border p-6">
              <div className="h-48 bg-muted/40 rounded animate-pulse" />
            </div>
          ) : detail ? (
            <SessionDetailPanel
              detail={detail}
              eventForm={eventForm}
              setEventForm={setEventForm}
              submittingEvent={submittingEvent}
              onPostEvent={handlePostEvent}
              onEndSession={handleEndSession}
            />
          ) : (
            <div className="rounded-lg border p-4 text-sm text-muted-foreground">
              Failed to load session detail.
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Session Detail Panel                                                */
/* ------------------------------------------------------------------ */

function SessionDetailPanel({
  detail,
  eventForm,
  setEventForm,
  submittingEvent,
  onPostEvent,
  onEndSession,
}: {
  detail: SessionDetail;
  eventForm: Record<string, string>;
  setEventForm: (v: Record<string, string>) => void;
  submittingEvent: boolean;
  onPostEvent: () => void;
  onEndSession: () => void;
}) {
  const { session, events, health, reasons, recommendedActions } = detail;
  const isEnded = session.status === "ended";

  const chartData = events.map((e, i) => ({
    label: `T${i + 1}`,
    viewers: e.viewers,
    purchases: e.purchases_per_min,
    comments: e.comments_per_min,
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg border p-4 flex items-center justify-between">
        <div>
          <div className="font-medium">
            {session.title || session.product_name || session.product_id}
          </div>
          <div className="text-xs text-muted-foreground">
            {session.status.toUpperCase()} · {events.length} events
            {session.started_at &&
              ` · Started ${new Date(session.started_at).toLocaleTimeString()}`}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <HealthBadge health={health} />
          {!isEnded && (
            <button
              onClick={onEndSession}
              className="rounded-md border border-red-800 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-950/30"
            >
              End Session
            </button>
          )}
        </div>
      </div>

      {/* Health reasons */}
      {reasons.length > 0 && (
        <div
          className={`rounded-lg border p-3 text-sm space-y-1 ${
            health === "red"
              ? "border-red-800 bg-red-950/40 text-red-300"
              : health === "yellow"
                ? "border-amber-800 bg-amber-950/40 text-amber-300"
                : "border-emerald-800 bg-emerald-950/40 text-emerald-300"
          }`}
        >
          {reasons.map((r, i) => (
            <div key={i}>{r}</div>
          ))}
        </div>
      )}

      {/* Chart */}
      {events.length > 0 && (
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium mb-3">Metric Trends</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="viewers"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Viewers"
              />
              <Line
                type="monotone"
                dataKey="purchases"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Purchases/min"
              />
              <Line
                type="monotone"
                dataKey="comments"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Comments/min"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recommended Actions */}
      {recommendedActions.length > 0 && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="text-sm font-medium">Recommended Actions</div>
          {recommendedActions.map((a, i) => (
            <ActionCard key={i} action={a} />
          ))}
        </div>
      )}

      {/* Manual event input */}
      {!isEnded && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="text-sm font-medium">Post Manual Event</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                ["viewers", "Viewers"],
                ["comments_per_min", "Comments/min"],
                ["shares_per_min", "Shares/min"],
                ["clicks_per_min", "Clicks/min"],
                ["carts_per_min", "Carts/min"],
                ["purchases_per_min", "Purchases/min"],
                ["revenue_per_min", "Revenue/min"],
                ["avg_watch_seconds", "Avg Watch (s)"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground block mb-0.5">
                  {label}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={eventForm[key]}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, [key]: e.target.value })
                  }
                  className="w-full rounded-md border bg-transparent px-2 py-1 text-sm outline-none tabular-nums"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          <button
            onClick={onPostEvent}
            disabled={submittingEvent}
            className="rounded-md bg-[#e50914] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#c4070f] disabled:opacity-50"
          >
            {submittingEvent ? "Posting…" : "Post Event"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small components                                                    */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "live"
      ? "bg-emerald-900/30 text-emerald-400"
      : status === "ended"
        ? "bg-zinc-800/50 text-zinc-400"
        : "bg-blue-900/30 text-blue-400";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {status === "live" && (
        <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
      )}
      {status}
    </span>
  );
}

function HealthBadge({ health }: { health: "green" | "yellow" | "red" }) {
  const cfg = {
    green: {
      bg: "bg-emerald-900/30",
      text: "text-emerald-400",
      dot: "bg-emerald-500",
      label: "Healthy",
    },
    yellow: {
      bg: "bg-amber-900/30",
      text: "text-amber-400",
      dot: "bg-amber-500",
      label: "Warning",
    },
    red: {
      bg: "bg-red-900/30",
      text: "text-red-400",
      dot: "bg-red-500",
      label: "Critical",
    },
  }[health];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function ActionCard({ action }: { action: RecommendedAction }) {
  const [copied, setCopied] = useState<number | null>(null);

  const copy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(idx);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="font-medium text-sm">{action.title}</div>
      <div className="text-xs text-muted-foreground">{action.why}</div>
      <div className="space-y-1.5">
        {action.scriptLines.map((line, i) => (
          <div
            key={i}
            className="flex items-start gap-2 text-sm bg-muted/30 rounded px-2 py-1.5"
          >
            <span className="flex-1 font-mono text-xs leading-relaxed">
              {line}
            </span>
            <button
              onClick={() => copy(line, i)}
              className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
            >
              {copied === i ? "Copied!" : "Copy"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
