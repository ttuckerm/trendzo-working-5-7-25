"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ValidationEngine, ValidationResult } from "../validation/ValidationEngine";
import { useToast } from "@/components/ui/use-toast";
import { logTemplateEvent } from "../events";
import { transitions } from "@/styles/motion";
import { useSound } from "@/os/sound/useSound";

interface Props {
  templateId: string;
  getSlots: () => any;
  setSlots: (next: any) => void;
}

export function ValidatePanel({ templateId, getSlots, setSlots }: Props) {
  const engine = useMemo(() => new ValidationEngine(), []);
  const [results, setResults] = useState<ValidationResult<any>[]>([]);
  const [running, setRunning] = useState(false);
  const { toast } = useToast();
  const { play } = useSound();

  async function run() {
    setRunning(true);
    logTemplateEvent({ event_type: 'validation_started', template_id: templateId });
    const start = Date.now();
    try {
      const issues = await engine.run({ slots: getSlots() });
      setResults(issues);
      try { (window as any).__miniui_announce?.(`Validation found ${issues.length} issue${issues.length === 1 ? '' : 's'}`); } catch {}
      logTemplateEvent({ event_type: 'validation_completed', template_id: templateId, metrics_payload: { durationMs: Date.now() - start, count: issues.length } });
      if (issues.length === 0) { try { play('success'); } catch {} }
    } finally {
      setRunning(false);
    }
  }

  function applyFix(ix: number) {
    const item = results[ix];
    if (!item?.fix) return;
    const next = item.fix.apply(getSlots());
    setSlots(next);
    toast({ title: 'Fix applied', description: item.fix.label });
    logTemplateEvent({ event_type: 'fix_applied', template_id: templateId, metrics_payload: { id: item.id } });
    // re-run validation
    run();
  }

  useEffect(() => {
    // auto-run on mount
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3" role="region" aria-label="Validation results" style={transitions.fast}>
      <div className="flex items-center gap-2">
        <button
          className="inline-flex items-center justify-center rounded border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
          onClick={run}
          disabled={running}
          aria-busy={running}
        >
          {running ? 'Running…' : 'Run validation'}
        </button>
        <div className="text-xs text-zinc-400">Findings: {results.length}</div>
      </div>
      {results.length === 0 ? (
        <div className="text-sm text-emerald-300">No issues found</div>
      ) : (
        <ul className="space-y-2">
          {results.map((r, i) => (
            <li key={`${r.id}-${i}`} className="rounded border border-white/10 p-2" style={{ background: 'var(--panel-bg)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-chrome)' }}>
              <div className="flex items-center gap-2">
                <span className={`inline-block rounded px-2 py-0.5 text-[10px] uppercase tracking-wide ${r.severity === 'error' ? 'bg-rose-600/20 text-rose-300' : 'bg-amber-500/20 text-amber-200'}`}>{r.severity}</span>
                <span className="text-sm text-zinc-100">{r.message}</span>
                {r.fix && (
                  <button
                    className="ml-auto inline-flex items-center justify-center rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
                    onClick={() => applyFix(i)}
                  >Fix</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


