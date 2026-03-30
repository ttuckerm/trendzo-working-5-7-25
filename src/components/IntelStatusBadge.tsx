"use client";

import { useEffect, useState } from "react";

type IntelStatus = { flags:{FF_INTEL_ORCHESTRATOR:boolean}; providers_configured:string[] };

export default function IntelStatusBadge() {
  const [status, setStatus] = useState<IntelStatus|null>(null);
  useEffect(() => { fetch("/api/intel/status").then(r=>r.json()).then(setStatus).catch(()=>{}); }, []);

  const active = !!status?.flags?.FF_INTEL_ORCHESTRATOR && (status?.providers_configured?.length ?? 0) >= 2;
  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm
      ${active ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}
      title={status?.providers_configured?.length ? status.providers_configured.join(", ") : "Loading…"}>
      <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-green-500" : "bg-gray-400"}`} />
      <span className="font-medium">{active ? "Multi-LLM: ACTIVE" : "Multi-LLM: INACTIVE"}</span>
    </div>
  );
}
