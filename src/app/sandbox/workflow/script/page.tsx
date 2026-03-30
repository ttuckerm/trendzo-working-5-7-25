"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SandboxWorkflowProvider, useSandboxWorkflow } from "../_context/SandboxWorkflowContext";
import presets from "../_fixtures/script-presets.json";
import type { ScriptDoc } from "../_types";
import { exportSRT } from "../_services/exports";
import { Dialog, DialogContent } from "@/components/ui/dialog";

function Teleprompter({ open, onClose, text }: { open: boolean; onClose: () => void; text: string }) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[700px]">
        <div className="h-[60vh] relative overflow-hidden bg-black text-white flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="relative px-6 py-8 text-center leading-8 animate-[scroll_linear_20s] [animation-play-state:running]">
            {text || "Your script will scroll here."}
          </div>
        </div>
        <div className="flex justify-end pt-3">
          <button onClick={onClose} className="rounded bg-black text-white px-3 py-2">Close</button>
        </div>
        <style>{`@keyframes scroll { from { transform: translateY(40%);} to { transform: translateY(-80%);} }`}</style>
      </DialogContent>
    </Dialog>
  );
}

function ScriptInner() {
  const router = useRouter();
  const { state, setScript, emit } = useSandboxWorkflow();
  const [doc, setDoc] = useState<ScriptDoc>(() => (
    state.script || { hooks: [], beats: presets.beats as string[], tone: presets.toneRange?.default || 60, cta: presets.ctaPresets?.[0], body: "" }
  ));
  const [openTele, setOpenTele] = useState(false);

  useEffect(() => {
    if (!doc.hooks?.length) {
      setDoc((d) => ({ ...d, hooks: [
        { id: "h1", text: "What if 10 minutes changed your channel?" },
        { id: "h2", text: "The mistake costing you 80% of views" },
        { id: "h3", text: "Try this before your next post" },
      ] }));
    }
  }, []);

  const onGenerateHooks = () => {
    setDoc((d) => ({ ...d, hooks: [
      { id: "h1", text: "Stop scrolling — watch this grow" },
      { id: "h2", text: "3 moves to double engagement" },
      { id: "h3", text: "I tested this 100 times" },
    ] }));
    emit({ type: "script.generated" });
  };

  const onExportSRT = () => {
    const lines = (doc.body || "").split(/\n+/).filter(Boolean);
    const srt = lines.map((text, i) => ({ start: i * 3, end: i * 3 + 3, text }));
    exportSRT(srt);
  };

  const onSaveAnalyze = () => {
    setScript(doc);
    router.push("/sandbox/workflow/analysis");
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Script Workbench</h1>
          <div className="text-sm text-gray-500">Template: {state.templateId || "none"}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Hooks</div>
                <button data-testid="hook-generate" className="rounded bg-black text-white px-3 py-1.5" onClick={onGenerateHooks}>Generate</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {doc.hooks?.map((h) => (
                  <button key={h.id} onClick={() => setDoc((d) => ({ ...d, body: `${h.text}\n${d.body || ""}` }))} className="rounded border px-3 py-2 text-left">
                    {h.text}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Script</label>
              <textarea className="w-full h-48 rounded border p-3" value={doc.body || ""} onChange={(e) => setDoc((d) => ({ ...d, body: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Tone: {doc.tone}</label>
              <input type="range" min={0} max={100} value={doc.tone || 0} onChange={(e) => setDoc((d) => ({ ...d, tone: Number(e.target.value) }))} className="w-full" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">CTA Presets</label>
              <select value={doc.cta || ""} onChange={(e) => setDoc((d) => ({ ...d, cta: e.target.value }))} className="w-full rounded border p-2">
                {(presets.ctaPresets as string[]).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button className="rounded border px-3 py-2" onClick={() => setOpenTele(true)}>Teleprompter</button>
              <button className="rounded border px-3 py-2" onClick={onExportSRT}>Export SRT</button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button data-testid="save-and-analyze" className="rounded bg-black text-white px-4 py-2" onClick={onSaveAnalyze}>Save draft & Analyze</button>
        </div>
      </div>

      <Teleprompter open={openTele} onClose={() => setOpenTele(false)} text={doc.body || ""} />
    </div>
  );
}

export default function ScriptPage() {
  return (
    <SandboxWorkflowProvider>
      <ScriptInner />
    </SandboxWorkflowProvider>
  );
}


