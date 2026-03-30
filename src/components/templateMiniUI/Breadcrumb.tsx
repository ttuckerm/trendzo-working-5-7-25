"use client";

import React from "react";
import { transitions, durations } from "@/styles/motion";
import { useTemplateMiniUI } from "./TemplateMiniUIProvider";
import { toHash, fromHash } from './router/urlState';
import { useToast } from "@/components/ui/use-toast";

export function MiniUIBreadcrumb({ templateName = "[Template]" }: { templateName?: string }) {
  const { mode, pulse, announce } = useTemplateMiniUI() as any;
  const { toast } = useToast();
  return (
    <nav aria-label="Breadcrumb" className="pointer-events-auto fixed left-4 top-4 z-[900]" style={transitions.fast}>
      <ol className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-200 backdrop-blur" style={{
        background: 'var(--panel-bg)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-chrome)'
      }}>
        <li className="opacity-90">Viral Recipe Book</li>
        <li className="opacity-50">→</li>
        <li className="font-medium">{templateName}</li>
        <li className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-100">
          {mode}
        </li>
        <li>
          <button
            className="ml-2 inline-flex items-center justify-center rounded border border-white/10 bg-white/10 px-1.5 py-0.5 text-[10px] text-zinc-100 hover:bg-white/20"
            onClick={async (e) => {
              e.preventDefault();
              try {
                const current = fromHash(window.location.hash);
                const url = new URL(window.location.href);
                url.hash = toHash(current);
                await navigator.clipboard.writeText(url.toString());
                toast({ title: 'Link copied', description: 'Current view URL copied to clipboard.' });
                announce?.('Link copied');
                (e.currentTarget as HTMLElement).focus();
              } catch {}
            }}
          >Copy Link</button>
        </li>
        {pulse && (
          <li aria-label="template update broadcasted" title="template updated recently">
            <span
              className="ml-2 inline-block h-2 w-2 rounded-full bg-emerald-400"
              style={transitions.fast}
            />
          </li>
        )}
      </ol>
    </nav>
  );
}


