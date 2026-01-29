"use client";

import React, { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import { useTemplateMiniUI } from "./TemplateMiniUIProvider";
import { usePreviewKernel as usePreviewKernelHook } from "./preview/usePreviewKernel";
import { ValidatePanel } from "./panels/ValidatePanel";
import { ABPanel } from "./panels/ABPanel";
import { createTemplateStore } from "./store";
import { transitions } from "@/styles/motion";
import { useSound } from "@/os/sound/useSound";

interface PanelMeta {
  title: string;
  description: string;
  primaryActionLabel: string;
  onPrimary?: () => void;
  deepLinkHref?: string;
}

const PANEL_CONTENT: Record<string, PanelMeta> = {
  dashboard: {
    title: "Dashboard",
    description: "Snapshot of template performance, accuracy and adoption.",
    primaryActionLabel: "Open Dashboard",
    deepLinkHref: "/admin/viral-recipe-book",
  },
  scripts: {
    title: "Scripts",
    description: "Top suggestions and quick-fix scripts for current template.",
    primaryActionLabel: "Open Studio",
    deepLinkHref: "/sandbox/viral-studio",
  },
  optimize: {
    title: "Optimize",
    description: "Model-guided tuning to hit your cohort’s 48h percentile.",
    primaryActionLabel: "Run Optimizer",
    deepLinkHref: "/admin/operations-center#optimize",
  },
  abtest: {
    title: "A/B Testing",
    description: "Configure variants, traffic splits, and significance bounds.",
    primaryActionLabel: "Create Test",
    deepLinkHref: "/admin/operations-center#ab",
  },
  inception: {
    title: "Inception",
    description: "Seed ideas and archetypes tuned to your audience and niche.",
    primaryActionLabel: "Open Inception",
    deepLinkHref: "/admin/operations-center#inception",
  },
  validate: {
    title: "Validate",
    description: "Platform, brand, and policy checks with 1‑click fixes.",
    primaryActionLabel: "Run Validation",
    deepLinkHref: "/admin/operations-center#validate",
  },
};

function FocusTrap({ children }: PropsWithChildren) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const focusablesRef = useRef<HTMLElement[]>([]);
  const lastActiveRef = useRef<Element | null>(null);

  useEffect(() => {
    lastActiveRef.current = document.activeElement;
    const container = containerRef.current;
    if (!container) return;
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    focusablesRef.current = Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
    const first = focusablesRef.current[0];
    if (first) first.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (focusablesRef.current.length === 0) return;
        const firstEl = focusablesRef.current[0];
        const lastEl = focusablesRef.current[focusablesRef.current.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };
    container.addEventListener('keydown', onKeyDown);
    return () => {
      container.removeEventListener('keydown', onKeyDown);
      if (lastActiveRef.current instanceof HTMLElement) {
        try { (lastActiveRef.current as HTMLElement).focus(); } catch {}
      }
    };
  }, []);

  return <div ref={containerRef}>{children}</div>;
}

export function RightRailShell() {
  // 1) HOOKS FIRST, UNCONDITIONAL
  const { panel, goBack, mode, announce, setUrlState } = useTemplateMiniUI() as any;
  const { play } = useSound();
  const templateId = 'sandbox-template';
  const kernel = usePreviewKernelHook(templateId);
  const meta: PanelMeta | undefined = useMemo(() => (panel ? PANEL_CONTENT[panel] : undefined), [panel]);

  // 2) EFFECTS SHOULD DEPEND ON PRIMITIVES, NOT FUNCTION IDENTITIES
  useEffect(() => {
    if (mode === 'editor') {
      try { kernel.update({ panel: 'editor-enter' }, { reason: 'editor_enter' }); } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Panel open/close announce with stable sound call; depend only on primitives
  useEffect(() => {
    if (!panel) return;
    announce?.('Panel opened');
    try { play('panel_open'); } catch {}
    return () => { announce?.('Panel closed'); try { play('panel_close'); } catch {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel]);

  // 3) EARLY RETURNS AFTER HOOKS
  if (mode === 'editor') {
    return (
      <div className="pointer-events-none fixed inset-0 z-[950]">
        <aside
          role="region"
          aria-label="Editor Preview"
          className={clsx(
            "pointer-events-auto absolute right-0 top-0 h-full w-[520px] max-w-[95vw]",
            "bg-zinc-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl"
          )}
        >
          <div className="flex h-full flex-col">
            <header className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <h2 className="text-sm font-semibold text-white">Editor Preview</h2>
              <button
                aria-label="Close editor"
                className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                onClick={goBack}
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="flex-1 overflow-auto p-4">
              <div className="relative h-64 rounded-lg border border-white/10 bg-black/30">
                {kernel.state === 'loading' && (
                  <div className="absolute inset-0 animate-pulse bg-white/10" aria-live="polite" aria-busy="true" />
                )}
                {kernel.state === 'error' && (
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="text-sm text-rose-300">Preview failed</div>
                    <button
                      className="mt-2 inline-flex items-center justify-center rounded border border-white/10 bg-white/10 px-2 py-1 text-xs text-white"
                      onClick={() => kernel.update({ retry: true }, { reason: 'retry' })}
                    >Retry</button>
                  </div>
                )}
                {kernel.state !== 'error' && (
                  <div className="absolute inset-0 overflow-auto p-2 text-xs text-zinc-200" dangerouslySetInnerHTML={{ __html: kernel.html || '<div class=\"text-zinc-400\">Idle</div>' }} />
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <button className="inline-flex items-center justify-center rounded border border-white/10 bg-white/10 px-2 py-1 text-xs text-white" onClick={() => kernel.update({ tweak: 'fast' }, { reason: 'tweak_fast' })}>Fast Tweak</button>
                <button className="inline-flex items-center justify-center rounded border border-white/10 bg-white/10 px-2 py-1 text-xs text-white" onClick={() => kernel.cancel('user_cancel')}>Cancel</button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    );
  }

  if (!panel || !meta) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[950]">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="miniui-panel-title"
        className={clsx(
          "pointer-events-auto absolute right-0 top-0 h-full w-[420px] max-w-[90vw]"
        )}
        style={{
          ...transitions.medium,
          background: 'var(--panel-bg)',
          backdropFilter: `blur(var(--blur))`,
          WebkitBackdropFilter: `blur(var(--blur))`,
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          boxShadow: 'var(--shadow-chrome)'
        }}
      >
        <FocusTrap>
          <div className="flex h-full flex-col">
            <header className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <h2 id="miniui-panel-title" className="text-sm font-semibold text-white">
                {meta.title}
              </h2>
              <button
                aria-label="Close panel"
                className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                onClick={() => {
                  announce?.('Panel closed');
                  try { setUrlState?.({ panel: null }); } catch {}
                  goBack();
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="flex-1 overflow-auto p-4">
              <p className="text-sm text-zinc-300">{meta.description}</p>
              <div className="mt-4 grid gap-3">
                <button
                  className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20"
                  onClick={meta.onPrimary}
                >
                  {meta.primaryActionLabel}
                </button>
                {meta.deepLinkHref && (
                  <a
                    className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
                    href={meta.deepLinkHref}
                  >
                    Deep link
                  </a>
                )}
              </div>
              <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-xs font-medium text-zinc-400">Summary</div>
                <ul className="mt-2 list-disc pl-5 text-xs text-zinc-300">
                  <li>Key metrics and primary action entry point.</li>
                  <li>Press Esc to close panels/windows or cancel editor preview.</li>
                  <li>Ctrl/Cmd+J toggles Recipe Book; Alt+` cycles windows; Alt+Shift+Arrows resize.</li>
                </ul>
              </div>
              {panel === 'validate' && (
                <div className="mt-6">
                  <ValidatePanel
                    templateId={'sandbox-template'}
                    getSlots={() => {
                      if (!(window as any).__mini_tmp_store) {
                        (window as any).__mini_tmp_store = createTemplateStore({ templateId: 'sandbox-template', platform: 'tiktok' });
                      }
                      return (window as any).__mini_tmp_store.getState().slots;
                    }}
                    setSlots={(next) => {
                      if ((window as any).__mini_tmp_store) {
                        (window as any).__mini_tmp_store.setState({ slots: next, isDirty: true });
                      }
                    }}
                  />
                </div>
              )}
              {panel === 'abtest' && (
                <div className="mt-6">
                  <ABPanel
                    templateId={'sandbox-template'}
                    getBase={() => {
                      if (!(window as any).__mini_tmp_store) {
                        (window as any).__mini_tmp_store = createTemplateStore({ templateId: 'sandbox-template', platform: 'tiktok' });
                      }
                      return (window as any).__mini_tmp_store.getState().slots;
                    }}
                    getCurrent={() => {
                      if (!(window as any).__mini_tmp_store) {
                        (window as any).__mini_tmp_store = createTemplateStore({ templateId: 'sandbox-template', platform: 'tiktok' });
                      }
                      return (window as any).__mini_tmp_store.getState().slots;
                    }}
                    onRenderPreview={(materialized) => {
                      try {
                        (window as any).__miniui_preview?.({ reason: 'ab_variant_preview', payload: { slots: materialized, source: 'abpanel' } });
                      } catch {}
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </FocusTrap>
      </aside>
    </div>
  );
}


