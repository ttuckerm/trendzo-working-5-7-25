"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from 'react'
import type { AnalysisResult, Prediction, SchedulePlan, ScriptDoc } from "../_types";

type SandboxState = {
  niche?: string;
  goal?: string;
  templateId?: string;
  script?: ScriptDoc;
  analysis?: AnalysisResult;
  schedule?: SchedulePlan;
  receipts?: Prediction[];
};

type SandboxEvents =
  | { type: "onboarding.completed" }
  | { type: "template.selected"; templateId: string }
  | { type: "script.generated" }
  | { type: "analysis.passed" }
  | { type: "schedule.exported"; target: string }
  | { type: "receipt.saved" }
  | { type: "nav.explore_accuracy" };

type Ctx = {
  state: SandboxState;
  setNicheGoal: (niche: string, goal: string) => void;
  setTemplateId: (id: string) => void;
  setScript: (doc: ScriptDoc) => void;
  setAnalysis: (r: AnalysisResult) => void;
  setSchedule: (s: SchedulePlan) => void;
  addReceipt: (p: Prediction) => void;
  emit: (e: SandboxEvents) => void;
};

const KEY = "sandboxUser";

const SandboxWorkflowContext = createContext<Ctx | null>(null);

export function useSandboxWorkflow() {
  const ctx = useContext(SandboxWorkflowContext);
  if (!ctx) throw new Error("SandboxWorkflowContext missing");
  return ctx;
}

function load(): SandboxState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SandboxState) : {};
  } catch {
    return {};
  }
}

function save(next: SandboxState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
}

export function SandboxWorkflowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SandboxState>({});

  useEffect(() => {
    setState(load());
  }, []);

  useEffect(() => {
    save(state);
  }, [state]);

  const setNicheGoal = useCallback((niche: string, goal: string) => {
    setState((s) => ({ ...s, niche, goal }));
  }, []);
  const setTemplateId = useCallback((templateId: string) => {
    setState((s) => ({ ...s, templateId }));
  }, []);
  const setScript = useCallback((script: ScriptDoc) => {
    setState((s) => ({ ...s, script }));
  }, []);
  const setAnalysis = useCallback((analysis: AnalysisResult) => {
    setState((s) => ({ ...s, analysis }));
  }, []);
  const setSchedule = useCallback((schedule: SchedulePlan) => {
    setState((s) => ({ ...s, schedule }));
  }, []);
  const addReceipt = useCallback((p: Prediction) => {
    setState((s) => ({ ...s, receipts: [...(s.receipts || []), p] }));
  }, []);

  const emit = useCallback((e: SandboxEvents) => {
    // For future analytics; no-op with console for now
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.debug("[SANDBOX EVENT]", e);
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({ state, setNicheGoal, setTemplateId, setScript, setAnalysis, setSchedule, addReceipt, emit }),
    [state, setNicheGoal, setTemplateId, setScript, setAnalysis, setSchedule, addReceipt, emit]
  );

  return <SandboxWorkflowContext.Provider value={value}>{children}</SandboxWorkflowContext.Provider>;
}


