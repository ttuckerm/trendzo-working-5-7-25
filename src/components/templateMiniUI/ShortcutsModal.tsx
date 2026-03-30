"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useTemplateMiniUI } from "./TemplateMiniUIProvider";
import { X } from "lucide-react";
import { transitions } from "@/styles/motion";
// Import parity reference keyboard map
// The JSON is used as a data source only (no external assets)
// Relative path from this file to the project docs JSON
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - allow bundler to include external JSON
import reference from "../../../docs/reference/ryos-reference.json";

type KeyboardItem = { name: string; keys?: string; parityDecision?: string; rationale?: string };

function getKeyboardItems(): KeyboardItem[] {
  try {
    const kb = (reference as any)?.keyboard as KeyboardItem[];
    if (Array.isArray(kb)) return kb;
  } catch {}
  return [];
}

function FocusTrap({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const focusablesRef = useRef<HTMLElement[]>([]);
  const openerRef = useRef<Element | null>(null);

  useEffect(() => {
    openerRef.current = document.activeElement;
    const container = containerRef.current;
    if (!container) return;
    const sel = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    focusablesRef.current = Array.from(container.querySelectorAll<HTMLElement>(sel));
    const first = focusablesRef.current[0];
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
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
    container.addEventListener('keydown', onKey);
    return () => {
      container.removeEventListener('keydown', onKey);
      if (openerRef.current instanceof HTMLElement) {
        try { (openerRef.current as HTMLElement).focus(); } catch {}
      }
    };
  }, [onClose]);

  return <div ref={containerRef}>{children}</div>;
}

export function ShortcutsModal() {
  const { shortcutsOpen, closeShortcuts, announce } = useTemplateMiniUI() as any;
  const kb = useMemo(() => getKeyboardItems(), []);

  useEffect(() => {
    if (shortcutsOpen) announce?.('Shortcuts opened'); else announce?.('Shortcuts closed');
  }, [shortcutsOpen, announce]);

  if (!shortcutsOpen) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[1200]">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div className="pointer-events-auto absolute inset-0 grid place-items-center" style={transitions.medium}>
        <FocusTrap onClose={closeShortcuts}>
          <div role="dialog" aria-modal="true" aria-labelledby="shortcuts-title"
            className="w-[720px] max-w-[95vw]"
            style={{
              background: 'var(--panel-bg)',
              backdropFilter: `blur(var(--blur))`,
              WebkitBackdropFilter: `blur(var(--blur))`,
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-chrome)'
            }}
          >
            <header className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <h2 id="shortcuts-title" className="text-sm font-semibold text-white">Keyboard Shortcuts</h2>
              <button aria-label="Close" onClick={closeShortcuts}
                className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="max-h-[60vh] overflow-auto p-4 text-sm text-zinc-200">
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {kb.map((item, i) => (
                  <li key={`${item.name}-${i}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-white">{item.name}</div>
                        {item.parityDecision && (
                          <div className="mt-0.5 text-xs text-zinc-400">{item.parityDecision}</div>
                        )}
                      </div>
                      <div className="rounded bg-white/10 px-2 py-1 text-xs text-zinc-100">{item.keys || ''}</div>
                    </div>
                    {item.rationale && (
                      <div className="mt-1 text-xs text-zinc-400">{item.rationale}</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </FocusTrap>
      </div>
    </div>
  );
}


