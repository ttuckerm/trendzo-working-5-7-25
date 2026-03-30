"use client";

import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from "react";
import { fromHash, toHash } from './router/urlState';
import { PreviewKernel } from './preview/PreviewKernel';
import { signalBridge } from './realtime/SignalBridge';
import { logTemplateEvent } from './events';

export type MiniMode = "reader" | "editor";
export type MiniPanel = "dashboard" | "scripts" | "optimize" | "abtest" | "inception" | "validate" | null;

export interface TemplateMiniUIState {
  mode: MiniMode;
  panel: MiniPanel;
  variantId?: string | null;
  previousHash: string | null;
  setHash: (hash: string) => void;
  setUrlState?: (next: { mode?: MiniMode; panel?: MiniPanel; variantId?: string | null; templateId?: string | null }) => void;
  goBack: () => void;
  getKernel: (templateId: string) => PreviewKernel;
  pulse: boolean;
  shortcutsOpen?: boolean;
  openShortcuts?: () => void;
  closeShortcuts?: () => void;
  announce?: (msg: string) => void;
}

const TemplateMiniUIContext = createContext<TemplateMiniUIState | null>(null);

function parseHash(hash: string): { mode: MiniMode; panel: MiniPanel } {
  const value = (hash || "").replace(/^#/, "").trim().toLowerCase();
  if (!value) return { mode: "reader", panel: null };
  if (value === "editor") return { mode: "editor", panel: null };
  if (value === "reader") return { mode: "reader", panel: null };
  const panels = new Set(["dashboard", "scripts", "optimize", "abtest", "inception", "validate"]);
  if (panels.has(value)) return { mode: "reader", panel: value as MiniPanel };
  return { mode: "reader", panel: null };
}

export function TemplateMiniUIProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<MiniMode>("reader");
  const [panel, setPanel] = useState<MiniPanel>(null);
  const previousHashRef = useRef<string | null>(null);
  const kernelMapRef = useRef<Map<string, PreviewKernel>>(new Map());
  const [pulse, setPulse] = useState(false);
  const pulseTimerRef = useRef<any>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const liveRef = useRef<HTMLDivElement | null>(null);
  const [variantId, setVariantId] = useState<string | null>(null);

  // Initialize from current hash (includes template and variant)
  useEffect(() => {
    const url = fromHash(window.location.hash);
    setMode(url.mode);
    setPanel(url.panel);
    setVariantId(url.variantId || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const next = fromHash(window.location.hash);
      setMode(next.mode);
      setPanel(next.panel);
      setVariantId(next.variantId || null);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const setHash = (hash: string) => {
    const normalized = hash.startsWith("#") ? hash : `#${hash}`;
    if (window.location.hash !== normalized) {
      previousHashRef.current = window.location.hash || "";
      window.location.hash = normalized;
    }
  };

  // Helper to set URL state with variant id
  function setUrlState(next: { mode?: MiniMode; panel?: MiniPanel; variantId?: string | null; templateId?: string | null }) {
    const current = fromHash(window.location.hash);
    const merged = {
      mode: next.mode ?? current.mode,
      panel: next.panel ?? current.panel,
      templateId: next.templateId ?? current.templateId ?? 'sandbox-template',
      variantId: next.variantId === undefined ? current.variantId ?? null : next.variantId,
    } as const;
    const h = toHash(merged);
    if (window.location.hash !== h) {
      previousHashRef.current = window.location.hash || "";
      window.location.hash = h;
    }
  }

  const goBack = () => {
    const prev = previousHashRef.current;
    previousHashRef.current = null;
    if (prev !== null && prev !== undefined) {
      window.location.hash = prev;
      return;
    }
    // Default fallback clears hash
    if (window.location.hash) {
      window.location.hash = "";
    }
  };

  const getKernel = (templateId: string) => {
    const map = kernelMapRef.current;
    let k = map.get(templateId);
    if (!k) {
      k = new PreviewKernel(templateId);
      map.set(templateId, k);
    }
    // Connect realtime channel once for this template
    try { signalBridge.connect(templateId); } catch {}
    return k;
  };

  // Broadcast helper when template changes
  function broadcastTemplateChanged(field: string, version: number) {
    try {
      signalBridge.broadcast({ type: 'template_changed', payload: { field, version } });
      logTemplateEvent({ event_type: 'variant', template_id: 'sandbox-template', metrics_payload: { type: 'template_changed', field, version } });
    } catch {}
    // trigger pulse for 1s
    setPulse(true);
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current = setTimeout(() => setPulse(false), 1000);
  }

  const value = useMemo<TemplateMiniUIState>(() => ({
    mode,
    panel,
    variantId,
    previousHash: previousHashRef.current,
    setHash,
    setUrlState: (next: any) => setUrlState(next),
    goBack,
    getKernel,
    pulse,
    shortcutsOpen,
    openShortcuts: () => setShortcutsOpen(true),
    closeShortcuts: () => setShortcutsOpen(false),
    announce: (msg: string) => {
      const el = liveRef.current;
      if (el) {
        el.textContent = msg;
      }
    },
  }), [mode, panel, pulse]);

  return (
    <TemplateMiniUIContext.Provider value={value}>
      {/* live region for announcements */}
      <div ref={liveRef} aria-live="polite" aria-atomic="true" className="sr-only" />
      {/* global announce shim for places without hook access */}
      <script
        dangerouslySetInnerHTML={{ __html: `window.__miniui_announce = (msg) => { try { var el = document.querySelector('[aria-live="polite"]'); if (el) el.textContent = msg; } catch(e){} }` }}
      />
      {children}
    </TemplateMiniUIContext.Provider>
  );
}

export function useTemplateMiniUI(): TemplateMiniUIState {
  const ctx = useContext(TemplateMiniUIContext);
  if (!ctx) throw new Error("useTemplateMiniUI must be used within TemplateMiniUIProvider");
  return ctx;
}


