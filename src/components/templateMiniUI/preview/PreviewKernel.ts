export type PreviewState = "idle" | "loading" | "ready" | "error";

export type PreviewCallbacks = {
  onProgress?: (state: PreviewState) => void;
  onResult?: (result: { html: string; meta: any }) => void;
  onError?: (err: any) => void;
};

export class PreviewKernel {
  private templateId: string;
  private abort?: AbortController;
  private debounceTimer?: ReturnType<typeof setTimeout>;
  private callbacks: PreviewCallbacks = {};
  private lastStartedAt: number = 0;

  constructor(templateId: string) {
    this.templateId = templateId;
  }

  onProgress(cb: (state: PreviewState) => void) {
    this.callbacks.onProgress = cb;
    return this;
  }

  onResult(cb: (result: { html: string; meta: any }) => void) {
    this.callbacks.onResult = cb;
    return this;
  }

  onError(cb: (err: any) => void) {
    this.callbacks.onError = cb;
    return this;
  }

  cancel(reason: string = "manual_cancel") {
    if (this.abort) {
      try { this.abort.abort(); } catch {}
      this.abort = undefined;
      // Return to idle within the close duration window
      const { durations } = require('@/styles/motion');
      const delay = durations?.medium || 160;
      setTimeout(() => this.callbacks.onProgress?.("idle"), delay);
    }
  }

  update(input: any, opts: { reason?: string } = {}) {
    // cancel pending debounce
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    try {
      const { signalBridge } = require('../realtime/SignalBridge');
      signalBridge.broadcast({ type: 'preview:queued', payload: { templateId: this.templateId } });
    } catch {}

    // schedule after fast duration to coalesce rapid updates
    const { durations } = require('@/styles/motion');
    const debounceMs = durations?.fast || 100;
    this.debounceTimer = setTimeout(() => {
      // cancel in-flight
      if (this.abort) {
        try { this.abort.abort(); } catch {}
        this.abort = undefined;
      }
      this.abort = new AbortController();
      const signal = this.abort.signal;
      this.lastStartedAt = Date.now();
      try {
        const { signalBridge } = require('../realtime/SignalBridge');
        signalBridge.broadcast({ type: 'preview:started', payload: { templateId: this.templateId } });
      } catch {}
      this.callbacks.onProgress?.("loading");

      fetch(`/api/preview`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ templateId: this.templateId, input, reason: opts.reason || "update" }),
        signal,
      })
        .then(async (r) => {
          if (!r.ok) throw new Error(`preview_bad_status_${r.status}`);
          return r.json();
        })
        .then((json) => {
          // ignore if canceled after completion
          if (signal.aborted) return;
          this.callbacks.onResult?.(json);
          this.callbacks.onProgress?.("ready");
        })
        .catch((err) => {
          if ((err && err.name === "AbortError") || signal.aborted) {
            // canceled -> idle within close duration
            const delay = durations?.medium || 160;
            setTimeout(() => this.callbacks.onProgress?.("idle"), delay);
            return;
          }
          this.callbacks.onProgress?.("error");
          this.callbacks.onError?.(err);
        });
    }, debounceMs);
  }
}
