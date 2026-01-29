"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SandboxWorkflowProvider, useSandboxWorkflow } from "../_context/SandboxWorkflowContext";
import { SandboxServices } from "../_services";
import type { AnalysisResult } from "../_types";
import { exportPDFStub } from "../_services/exports";
import { Badge } from "@/components/ui/badge";

function AnalysisInner() {
  const router = useRouter();
  const { state, setAnalysis, emit, setScript } = useSandboxWorkflow();
  const [result, setResult] = useState<AnalysisResult | null>(state.analysis || null);
  const [loading, setLoading] = useState(!state.analysis);

  useEffect(() => {
    let mounted = true;
    if (!state.analysis && state.script) {
      setLoading(true);
      SandboxServices.getAnalysis(state.script).then((r) => {
        if (!mounted) return;
        setResult(r);
        setAnalysis(r);
      }).finally(() => setLoading(false));
    }
    return () => { mounted = false; };
  }, [state.script, state.analysis, setAnalysis]);

  const applyAll = async () => {
    if (!state.script) return;
    const updated = await SandboxServices.mutateScriptApplyAllFixes(state.script);
    setScript(updated);
    const r = await SandboxServices.getAnalysis(updated);
    setAnalysis(r);
    setResult(r);
    if (r.passed) {
      emit({ type: "analysis.passed" });
    }
  };

  if (loading) return <div className="p-6">Analyzing…</div>;

  return (
    <div className="min-h-screen p-6 bg-white">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Instant Analysis</h1>
          {result?.passed && <Badge data-testid="ready-to-post" className="bg-emerald-600 text-white">Ready to Post</Badge>}
        </div>
        <div className="space-y-2">
          <div data-testid="viral-score" className="text-3xl font-bold">Viral Score: {Math.round((result?.score || 0) * 100)}%</div>
          <div className="text-gray-600">Confidence: {(result?.confidenceBands?.[0] || 0) * 100}% – {(result?.confidenceBands?.[1] || 0) * 100}%</div>
        </div>
        <div>
          <div className="font-medium mb-2">Top Fixes</div>
          <ul className="list-disc pl-5 space-y-1">
            {result?.fixes?.slice(0, 3).map((f, i) => (
              <li key={i}>{f.text} <span className="text-xs text-gray-500">(impact +{Math.round(f.impact * 100)}%)</span></li>
            ))}
          </ul>
        </div>
        <div className="flex gap-2">
          <button data-testid="fix-apply-all" className="rounded bg-black text-white px-4 py-2" onClick={applyAll}>Apply All Fixes</button>
          <button className="rounded border px-4 py-2" onClick={() => exportPDFStub("analysis-report.pdf")}>View Report (PDF)</button>
        </div>
        <div className="flex justify-end">
          <button className="rounded bg-black text-white px-4 py-2" onClick={() => router.push("/sandbox/workflow/schedule")}>Continue</button>
        </div>
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <SandboxWorkflowProvider>
      <AnalysisInner />
    </SandboxWorkflowProvider>
  );
}


