"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PreviewKernel, PreviewState } from "./PreviewKernel";
import { logTemplateEvent } from "../events";
import { signalBridge } from "../realtime/SignalBridge";

export function usePreviewKernel(templateId: string) {
  const kernelRef = useRef<PreviewKernel | null>(null);
  const templateIdRef = useRef<string | null>(null);
  const [state, setState] = useState<PreviewState>("idle");
  const [html, setHtml] = useState<string>("");
  const [meta, setMeta] = useState<any>(null);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    // Ensure kernel instance exists and matches templateId
    if (!kernelRef.current || templateIdRef.current !== templateId) {
      kernelRef.current = new PreviewKernel(templateId);
      templateIdRef.current = templateId;
    }
    const kernel = kernelRef.current!;
    kernel
      .onProgress((s) => {
        if (s === "loading") {
          startedAtRef.current = Date.now();
          logTemplateEvent({ event_type: 'preview_started', template_id: templateId });
        }
        setState(s);
        if (s === "idle") {
          // cancellation path
          if (startedAtRef.current) {
            const tookMs = Date.now() - startedAtRef.current;
            logTemplateEvent({ event_type: 'preview_canceled', template_id: templateId, metrics_payload: { durationMs: tookMs } });
            signalBridge.broadcast({ type: 'preview:canceled', payload: { templateId }, tookMs });
            startedAtRef.current = 0;
          }
        }
      })
      .onResult((res) => {
        setHtml(String(res.html || ""));
        setMeta(res.meta || null);
        if (startedAtRef.current) {
          const tookMs = Date.now() - startedAtRef.current;
          logTemplateEvent({ event_type: 'preview_completed', template_id: templateId, metrics_payload: { durationMs: tookMs, meta: res.meta } });
          signalBridge.broadcast({ type: 'preview:completed', payload: { templateId }, tookMs });
          startedAtRef.current = 0;
        }
        try { (window as any).__miniui_announce?.('Preview ready'); } catch {}
      })
      .onError((err) => {
        if (startedAtRef.current) {
          logTemplateEvent({ event_type: 'preview_failed', template_id: templateId, metrics_payload: { durationMs: Date.now() - startedAtRef.current, error: String(err?.message || err) } });
          startedAtRef.current = 0;
        }
      });

    return () => {
      // Keep instance to avoid StrictMode double-effect null races; just cancel and detach callbacks
      try { kernel.cancel("unmount"); } catch {}
      kernel.onProgress(() => {});
      kernel.onResult(() => {});
      kernel.onError(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  const api = useMemo(() => ({
    state,
    html,
    meta,
    update: (input: any, opts?: { reason?: string }) => kernelRef.current?.update(input, opts),
    cancel: (reason?: string) => kernelRef.current?.cancel(reason),
  }), [state, html, meta]);

  return api;
}
