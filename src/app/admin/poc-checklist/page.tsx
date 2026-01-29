"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadObjectivesMatrix } from "@/lib/qa/qa-mode";

type StepStatus = "pending" | "done" | "skipped";

type ChecklistItem = { step: string; label: string; href: string; note?: string };
const DEFAULT_ITEMS: Array<ChecklistItem> = [];
const STORAGE_KEY = "pocChecklistStatus";

export default function POCChecklistPage() {
  const [checklistItems, setChecklistItems] = useState<Array<ChecklistItem>>(DEFAULT_ITEMS);
  const [lastStatuses, setLastStatuses] = useState<Record<string, { status: string; ts: string }>>({});
  const [statusMap, setStatusMap] = useState<Record<string, StepStatus>>({});
  const [activeIdx, setActiveIdx] = useState(0);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    // Load objectives matrix to populate checklist in exact order
    (async () => {
      try {
        const matrix = await loadObjectivesMatrix();
        const loaded = matrix.objectives.map((o, idx) => ({
          step: String(idx + 1),
          label: o.title,
          href: o.route + (o.anchor ? o.anchor : "")
        }));
        setChecklistItems(loaded);
        setActiveIdx(0);
        // Load last results for each objective
        const statuses: Record<string, { status: string; ts: string }> = {};
        for (const it of loaded) {
          const id = matrix.objectives[Number(it.step) - 1]?.id;
          if (!id) continue;
          try {
            const res = await fetch(`/api/qa/results?objective_id=${encodeURIComponent(id)}`, { cache: 'no-store' });
            const json = await res.json();
            const entry = json.results?.[0];
            if (entry) statuses[it.step] = { status: entry.status, ts: entry.created_at };
          } catch {}
        }
        setLastStatuses(statuses);
      } catch {}
    })();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setStatusMap(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(statusMap));
    } catch {}
  }, [statusMap]);

  const nextPendingIndex = useMemo(() => {
    for (let i = 0; i < checklistItems.length; i++) {
      if ((statusMap[checklistItems[i].step] || "pending") === "pending") return i;
    }
    return Math.max(0, checklistItems.length - 1);
  }, [statusMap, checklistItems]);

  useEffect(() => {
    setActiveIdx(nextPendingIndex);
  }, [nextPendingIndex]);

  const mark = (idx: number, val: StepStatus) => {
    const step = checklistItems[idx].step;
    setStatusMap((prev) => ({ ...prev, [step]: val }));
    const next = Math.min(idx + 1, Math.max(0, checklistItems.length - 1));
    setActiveIdx(next);
    // Auto-scroll to next
    setTimeout(() => {
      itemRefs.current[next]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const reset = () => {
    setStatusMap({});
    setActiveIdx(0);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">POC Checklist</h1>
        <button onClick={reset} className="px-3 py-1 rounded-md border border-white/20 text-xs hover:bg-white/10">Reset</button>
      </div>
      <ol className="space-y-3">
        {checklistItems.map((i, idx) => {
          const recorded = lastStatuses[i.step]?.status;
          const st = recorded ? recorded.toLowerCase() as StepStatus : (statusMap[i.step] || "pending");
          const isActive = idx === activeIdx;
          return (
            <li
              key={i.step}
              ref={(el) => (itemRefs.current[idx] = el)}
              className={`p-3 rounded-md border flex flex-col gap-2 ${
                isActive ? "border-blue-400/60 bg-blue-950/20" : "border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 text-sm">
                  {i.step}
                </span>
                <Link
                  className="text-blue-300 hover:underline"
                  href={i.href}
                  target={i.href.startsWith("/api/") ? "_blank" : undefined}
                >
                  {i.label}
                </Link>
                {i.note && <span className="text-xs text-white/60">– {i.note}</span>}
                <span className={`ml-auto text-xs ${st === "done" || st === 'pass' ? "text-green-400" : (st === "skipped" ? "text-yellow-400" : (st === 'fail' ? 'text-red-400' : 'text-white/40'))}`}>
                  {(st === 'pass' ? 'DONE' : st).toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2 pl-9">
                <a
                  className="px-2 py-1 text-xs rounded-md border border-white/15 hover:bg-white/10"
                  href={i.href}
                  target={i.href.startsWith("/api/") ? "_blank" : undefined}
                  rel="noreferrer"
                >
                  Open
                </a>
                <button
                  onClick={() => mark(idx, "done")}
                  className="px-2 py-1 text-xs rounded-md border border-green-500/40 text-green-300 hover:bg-green-600/10"
                >
                  Done (auto‑advance)
                </button>
                <button
                  onClick={() => mark(idx, "skipped")}
                  className="px-2 py-1 text-xs rounded-md border border-yellow-500/40 text-yellow-300 hover:bg-yellow-600/10"
                >
                  Skip (auto‑advance)
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}


