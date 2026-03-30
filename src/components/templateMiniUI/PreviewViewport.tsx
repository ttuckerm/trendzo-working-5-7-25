"use client";

import React, { useEffect, useMemo } from "react";
import { transitions } from "@/styles/motion";
import { useTemplateMiniUI } from "./TemplateMiniUIProvider";
import { usePreviewKernel as useNewPreviewKernel } from "./preview/usePreviewKernel";
import { useSound } from "@/os/sound/useSound";

export function PreviewViewport() {
  const { mode, panel } = useTemplateMiniUI();
  const kernel = useNewPreviewKernel('sandbox-template');
  const { play } = useSound();

  const renderReason = useMemo(() => `${mode}:${panel || 'none'}`, [mode, panel]);

  useEffect(() => {
    kernel.cancel('route-change');
    kernel.update({ mode, panel }, { reason: `route:${renderReason}` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderReason]);

  useEffect(() => {
    // Sound cue when preview completes
    if (kernel.state === 'idle' && kernel.html) {
      try { play('confirm_soft'); } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kernel.state, kernel.html]);

  // Expose a minimal global hook to allow panels to request preview renders
  useEffect(() => {
    (window as any).__miniui_preview = (evt: { payload?: any; reason?: string } = {}) => {
      try { kernel.cancel('external'); } catch {}
      kernel.update(evt.payload || {}, { reason: evt.reason || 'external' });
    };
    return () => { try { delete (window as any).__miniui_preview; } catch {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={transitions.medium}>
      <div className="pointer-events-auto relative w-[1000px] max-w-[96vw] h-[86vh] overflow-hidden bg-white">
        {/* Loading veil */}
        {kernel.state === 'loading' && (
          <div className="absolute inset-0 z-10" style={{ background: 'rgba(0,0,0,0.05)' }} aria-live="polite" aria-busy="true" />
        )}

        {/* Render fetched HTML when available; sandboxed iframe via srcDoc */}
        {kernel.html ? (
          <iframe
            title="Sandbox Preview"
            className="absolute inset-0 w-full h-full border-0"
            sandbox="allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-pointer-lock allow-downloads"
            srcDoc={kernel.html}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-zinc-600">
            <div className="text-center">
              <div className="text-sm uppercase tracking-wide text-zinc-500">Preview idle</div>
              <div className="mt-1 text-xs text-zinc-500">Reason: {renderReason}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


