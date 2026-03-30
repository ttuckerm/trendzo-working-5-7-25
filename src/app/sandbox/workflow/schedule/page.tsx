"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SandboxWorkflowProvider, useSandboxWorkflow } from "../_context/SandboxWorkflowContext";
import { SandboxServices } from "../_services";
import { exportCSV, exportICS, exportTXT } from "../_services/exports";

function ScheduleInner() {
  const { state, setSchedule, emit } = useSandboxWorkflow();
  const [loading, setLoading] = useState(!state.schedule);
  const schedule = state.schedule;

  useEffect(() => {
    let mounted = true;
    if (!state.schedule) {
      setLoading(true);
      SandboxServices.getSchedulePlan().then((s) => { if (mounted) setSchedule(s); }).finally(() => setLoading(false));
    }
    return () => { mounted = false; };
  }, [setSchedule, state.schedule]);

  const now = new Date();
  const events = useMemo(() => (schedule?.items || []).map((it) => {
    const start = new Date(now);
    start.setDate(now.getDate() + it.dayOffset);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    return { title: `Post on ${it.platform.toUpperCase()}`, startISO: start.toISOString(), endISO: end.toISOString(), description: "Sandbox rollout" };
  }), [schedule, now]);

  const handleExportICS = () => {
    exportICS(events);
    emit({ type: "schedule.exported", target: "ics" });
  };
  const handleExportCaptions = () => {
    const rows = Object.entries(schedule?.captions || {}).map(([platform, caption]) => ({ platform, caption }));
    exportCSV("captions.csv", rows);
    emit({ type: "schedule.exported", target: "captions" });
  };
  const handleExportCutlist = () => {
    exportTXT("cutlist.txt", ["00:00 Hook", "00:03 Problem", "00:08 Solution", "00:14 Proof", "00:20 CTA"]);
    emit({ type: "schedule.exported", target: "cutlist" });
  };

  if (loading) return <div className="p-6">Loading schedule…</div>;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">Rollout Planner</h1>
        <div className="space-y-2">
          {(schedule?.items || []).map((it, i) => (
            <div key={i} className="rounded border px-3 py-2 flex items-center justify-between">
              <div className="font-medium">{it.platform.toUpperCase()}</div>
              <div>Day +{it.dayOffset}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button data-testid="export-ics" className="rounded border px-3 py-2" onClick={handleExportICS}>Add to Calendar (ICS)</button>
          <button data-testid="export-captions" className="rounded border px-3 py-2" onClick={handleExportCaptions}>Export Captions</button>
          <button data-testid="export-cutlist" className="rounded border px-3 py-2" onClick={handleExportCutlist}>Export Cut List</button>
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  return (
    <SandboxWorkflowProvider>
      <ScheduleInner />
    </SandboxWorkflowProvider>
  );
}


