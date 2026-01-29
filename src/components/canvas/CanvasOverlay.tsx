"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CanvasRoot } from './Canvas';
import { Dock } from '@/components/dock/Dock';
import { RightRailShell } from '@/components/templateMiniUI/RightRailShell';
import { PreviewViewport } from '@/components/templateMiniUI/PreviewViewport';
import { TemplateMiniUIProvider, useTemplateMiniUI } from '@/components/templateMiniUI/TemplateMiniUIProvider';
import { toCanvasHash, fromHash } from '@/components/templateMiniUI/router/urlState';
import { transitions } from '@/styles/motion';
import { Clipboard, ArrowLeft, HelpCircle, ExternalLink, LayoutDashboard, FileText, Sparkles, Split, Brain, ShieldCheck, PlayCircle } from 'lucide-react';
import clsx from 'clsx';
import { useWindowsStore } from '@/lib/state/windowStore';
import { WindowShell } from '@/components/windows/WindowShell';
import { ValidatePanel } from '@/components/templateMiniUI/panels/ValidatePanel';
import { ABPanel } from '@/components/templateMiniUI/panels/ABPanel';
import { DashboardWindow } from '@/components/windows/DashboardWindow';
import { ScriptsWindow } from '@/components/windows/ScriptsWindow';
import { OptimizeWindow } from '@/components/windows/OptimizeWindow';
import { InceptionWindow } from '@/components/windows/InceptionWindow';
import { PreviewWindow } from '@/components/windows/PreviewWindow';
import { createTemplateStore } from '@/components/templateMiniUI/store';
import { logTemplateEvent } from '@/components/templateMiniUI/events';
import { useSound } from '@/os/sound/useSound';
import { soundManager } from '@/os/sound/SoundManager';
import { eventToSoundKey } from '@/os/sound/eventMap';
import InteractiveGridPattern from '@/components/backgrounds/InteractiveGridPattern';

type Props = {
  templateId: string;
  onExit: () => void;
};

function TopBar({ templateId, onExit }: { templateId: string; onExit: () => void }) {
  const { mode, panel, openShortcuts } = useTemplateMiniUI() as any;
  const [copied, setCopied] = useState(false);
  const { enabled, setEnabled, volume, setVolume, loadPack, play } = useSound();
  // Load preferred sound pack on mount (avoid depending on function identity)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { try { loadPack((localStorage.getItem('trendzo.sound.pack') || 'trendzo-default')); } catch {} }, []);
  const copy = async () => {
    const current = fromHash(window.location.hash);
    const link = `${location.origin}${location.pathname}${toCanvasHash({ ...current, templateId })}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="pointer-events-auto absolute left-0 right-0 top-0 z-[1000]">
      <div className="mx-auto flex max-w-[1600px] items-center gap-2 px-4 py-3">
        <button
          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white hover:bg-white/10"
          onClick={onExit}
          aria-label="Back to Grid"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Grid
        </button>
        <div className="ml-2 text-sm text-zinc-200">Template • {templateId}</div>
        <div className="ml-auto flex items-center gap-2">
          {/* Sound toggle */}
          <div className="relative">
            <details className="group inline-block">
              <summary className="list-none">
                <button
                  className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white hover:bg-white/10"
                  aria-label="Sound settings"
                >
                  <span className="inline-block h-4 w-4" aria-hidden="true">{enabled ? '🔊' : '🔈'}</span>
                  <span className="hidden sm:inline">Sound</span>
                </button>
              </summary>
              <div className="absolute right-0 z-[1201] mt-2 w-60 rounded-lg border border-white/10 bg-white/10 p-3 text-sm text-white shadow-xl backdrop-blur" style={{
                borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-chrome)'
              }}>
                <div className="flex items-center justify-between">
                  <span>Sound</span>
                  <button className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-xs hover:bg-white/10" onClick={() => setEnabled(!enabled)} aria-pressed={enabled}>{enabled ? 'On' : 'Off'}</button>
                </div>
                <div className="mt-3">
                  <label className="mb-1 block text-xs text-zinc-300">Volume: {Math.round(volume * 100)}%</label>
                  <input type="range" min={0} max={100} value={Math.round(volume * 100)} onChange={(e) => setVolume(Number(e.target.value) / 100)} className="w-full" />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-zinc-300">
                  <span>Pack</span>
                  <select className="rounded bg-white/10 px-2 py-1" defaultValue={(localStorage.getItem('trendzo.sound.pack') || 'trendzo-default')} onChange={(e) => { localStorage.setItem('trendzo.sound.pack', e.target.value); loadPack(e.target.value); }}>
                    <option value="trendzo-default">Trendzo default</option>
                    <option value="ryos-like">ryOS-like</option>
                  </select>
                </div>
              </div>
            </details>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white hover:bg-white/10"
            onClick={copy}
            aria-label="Copy Link"
          >
            <Clipboard className="h-4 w-4" /> {copied ? 'Copied' : 'Copy Link'}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white hover:bg-white/10"
            onClick={() => openShortcuts?.()}
            aria-label="Keyboard Shortcuts"
          >
            <HelpCircle className="h-4 w-4" /> Shortcuts
          </button>
          <a
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white hover:bg-white/10"
            href={`/studio/export?templateId=${encodeURIComponent(templateId)}`}
          >
            Export to Studio <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

function RightToolStrip({ templateId }: { templateId: string }) {
  const state = useWindowsStore();
  const { mode } = useTemplateMiniUI();
  const { play } = useSound();
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scripts', label: 'Scripts', icon: FileText },
    { id: 'optimize', label: 'Optimize', icon: Sparkles },
    { id: 'abtest', label: 'A/B', icon: Split },
    { id: 'inception', label: 'Inception', icon: Brain },
    { id: 'validate', label: 'Validate', icon: ShieldCheck },
    { id: 'preview', label: 'Preview', icon: PlayCircle },
  ] as const;
  return (
    <div className="pointer-events-auto absolute right-3 top-1/2 z-[1000] -translate-y-1/2">
      <div className="flex flex-col gap-2">
        {items.map((it) => (
          <button
            key={it.id}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-white hover:bg-white/10"
            onMouseEnter={() => { play('hover_soft'); }}
            onClick={async () => {
              state.open(it.id as any);
              // update hash for deep-linking
              const q = new URLSearchParams();
              q.set('templateId', templateId);
              q.set('mode', mode);
              if (it.id !== 'preview') q.set('panel', it.id);
              const next = `#canvas?${q.toString()}`;
              if (window.location.hash !== next) window.location.hash = next;
              // Emit panel_opened via API schema
              try {
                await fetch('/api/telemetry/template-event', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'panel_opened', templateId, ts: new Date().toISOString() }) });
              } catch {}
              play('panel_open');
            }}
            aria-label={it.label}
          >
            {React.createElement(it.icon, { className: 'h-4 w-4' })}
            <span className="hidden sm:inline">{it.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function WindowsArea({ templateId }: { templateId: string }) {
  const storeRef = useRef<any>(null);
  if (!storeRef.current) {
    storeRef.current = createTemplateStore({ templateId, platform: 'tiktok' as any });
  }
  const getSlots = () => storeRef.current.getState().slots;
  const setSlots = (next: any) => storeRef.current.setState({ slots: next, isDirty: true });
  return (
    <>
      <WindowShell id="dashboard" title="Dashboard" minWidth={600} minHeight={420}>
        <DashboardWindow />
      </WindowShell>
      <WindowShell id="scripts" title="Scripts" minWidth={560} minHeight={420}>
        <ScriptsWindow />
      </WindowShell>
      <WindowShell id="optimize" title="Optimize" minWidth={560} minHeight={420}>
        <OptimizeWindow />
      </WindowShell>
      <WindowShell id="inception" title="Inception" minWidth={560} minHeight={420}>
        <InceptionWindow />
      </WindowShell>
      <WindowShell id="preview" title="Preview" minWidth={600} minHeight={480}>
        <PreviewWindow />
      </WindowShell>
      <WindowShell id="validate" title="Validate" minWidth={420} minHeight={360} onClose={async () => { try { await fetch('/api/telemetry/template-event', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'panel_closed', templateId, ts: new Date().toISOString() }) }); } catch {} }}>
        <ValidatePanel templateId={templateId} getSlots={getSlots} setSlots={setSlots} />
      </WindowShell>
      <WindowShell id="abtest" title="A/B" onClose={async () => { try { await fetch('/api/telemetry/template-event', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'panel_closed', templateId, ts: new Date().toISOString() }) }); } catch {} }}>
        <ABPanel<any>
          templateId={templateId}
          getBase={() => getSlots()}
          getCurrent={() => getSlots()}
          onRenderPreview={(mat) => { try { (window as any).__miniui_preview?.({ payload: { materialized: mat }, reason: 'abtest' }); } catch {} }}
        />
      </WindowShell>
      {/* Additional panels can be added similarly: scripts, optimize, inception, dashboard */}
    </>
  );
}

function DebugStress({ templateId }: { templateId: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const check = () => {
      try { setShow(typeof window !== 'undefined' && window.location.hash.includes('debug=stress')); } catch { setShow(false); }
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, []);
  if (!show) return null;
  return (
    <div className="pointer-events-auto absolute left-3 top-14 z-[1201]">
      <button
        className="rounded-md border border-white/10 bg-rose-600/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600"
        onClick={() => {
          try {
            for (let i = 0; i < 20; i++) {
              setTimeout(() => {
                const open = i % 2 === 0;
                const q = new URLSearchParams();
                q.set('templateId', templateId);
                q.set('mode', 'reader');
                if (open) q.set('panel', 'dashboard');
                const next = `#canvas?${q.toString()}`;
                if (window.location.hash !== next) window.location.hash = next;
              }, i * 25);
            }
          } catch {}
        }}
      >Stress Toggle x20</button>
    </div>
  );
}

export function CanvasOverlayInner({ templateId, onExit }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(document.activeElement as HTMLElement | null);
  const store = useWindowsStore();
  const { mode, panel } = useTemplateMiniUI();
  const { play, loadPack } = useSound();
  const openedOnce = useRef(false);

  // Initial mount side effects
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Move focus into overlay
    const firstButton = containerRef.current?.querySelector('button') as HTMLElement | null;
    firstButton?.focus();
    try { (window as any).__miniui_announce?.('Canvas opened'); } catch {}
    // Preload sound pack after user interaction
    try { loadPack((localStorage.getItem('trendzo.sound.pack') || 'trendzo-default')); } catch {}
    try { play('canvas_open'); } catch {}
    return () => { try { (window as any).__miniui_announce?.('Canvas closed'); } catch {} };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'escape') {
        e.preventDefault();
        e.stopPropagation();
        // Close topmost window if any
        const open = Object.values(store.windows).filter(w => w.isOpen).sort((a, b) => b.z - a.z);
        if (open.length > 0) {
          useWindowsStore.getState().close(open[0].id);
          return;
        }
        play('canvas_close');
        onExit();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (['e','d','s','o','b','i','v','/','?'].includes(k)) {
        e.preventDefault();
        e.stopPropagation();
      }
      // E toggles reader/editor
      if (k === 'e') {
        const nextMode = mode === 'editor' ? 'reader' : 'editor';
        const q = new URLSearchParams(location.hash.replace(/^#canvas\?/, ''));
        q.set('mode', nextMode);
        q.set('templateId', templateId);
        const next = `#canvas?${q.toString()}`;
        if (location.hash !== next) location.hash = next;
        return;
      }
      const map: Record<string, string> = { d: 'dashboard', s: 'scripts', o: 'optimize', b: 'abtest', i: 'inception', v: 'validate' };
      const p = map[k];
      if (p) {
        useWindowsStore.getState().open(p as any);
        const q = new URLSearchParams();
        q.set('templateId', templateId);
        q.set('mode', mode);
        q.set('panel', p);
        const next = `#canvas?${q.toString()}`;
        if (location.hash !== next) location.hash = next;
        return;
      }
      if (k === '?' || (k === '/' && e.shiftKey)) {
        try { (document.querySelector('[aria-label="Keyboard Shortcuts"]') as HTMLElement)?.click(); } catch {}
        return;
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true } as any);
  }, [onExit]);

  // Persist/restore last canvas state per template
  useEffect(() => {
    const persist = () => {
      if (!location.hash.startsWith('#canvas')) return;
      const st = fromHash(location.hash);
      if (!st.templateId) return;
      try { localStorage.setItem(`trendzo.canvasState.${st.templateId}`, JSON.stringify(st)); } catch {}
    };
    const restoreIfMissing = () => {
      if (!location.hash.startsWith('#canvas')) return;
      const st = fromHash(location.hash);
      if (!st.templateId) return;
      const raw = localStorage.getItem(`trendzo.canvasState.${st.templateId}`);
      if (raw) {
        try {
          const prev = JSON.parse(raw);
          const q = new URLSearchParams();
          q.set('templateId', st.templateId || '');
          if (prev.panel) q.set('panel', prev.panel);
          q.set('mode', prev.mode || 'reader');
          if (prev.variantId) q.set('variantId', prev.variantId);
          const next = `#canvas?${q.toString()}`;
          if (location.hash !== next) location.hash = next;
        } catch {}
      }
    };
    restoreIfMissing();
    window.addEventListener('hashchange', persist);
    return () => window.removeEventListener('hashchange', persist);
  }, []);

  // Open default Dashboard once-only on first load
  useEffect(() => {
    if (openedOnce.current) return;
    openedOnce.current = true;
    try {
      const hasPanel = typeof window !== 'undefined' && window.location.hash.includes('panel=');
      const w = useWindowsStore.getState().windows;
      const anyOpen = Object.values(w).some((win: any) => win.isOpen);
      if (!hasPanel && !anyOpen) {
        useWindowsStore.getState().open('dashboard' as any);
        const dash = useWindowsStore.getState().windows.dashboard as any;
        const ww = (typeof window !== 'undefined' ? window.innerWidth : 1280);
        const wh = (typeof window !== 'undefined' ? window.innerHeight : 800);
        const cx = Math.max(24, Math.round((ww - (dash?.width || 720)) / 2));
        const cy = Math.max(24, Math.round((wh - (dash?.height || 500)) / 2));
        useWindowsStore.getState().move('dashboard' as any, cx, cy);
        const q = new URLSearchParams();
        q.set('templateId', templateId);
        q.set('mode', 'reader');
        q.set('panel', 'dashboard');
        const next = `#canvas?${q.toString()}`;
        if (window.location.hash !== next) window.location.hash = next;
      }
    } catch {}
  }, [templateId]);

  return (
    <div ref={containerRef} className="sandbox-canvas trendzo-theme ryos-parity z-[9999] pointer-events-none fixed inset-0" aria-live="polite">
      <div className="absolute inset-0 backdrop-blur-md bg-black/50" aria-hidden="true" />
      {/* Decorative background grid (no pointer events) */}
      <InteractiveGridPattern width={40} height={40} squares={[36, 24]} className="z-[0] opacity-50" squaresClassName="opacity-70" />
      <TopBar templateId={templateId} onExit={() => { onExit(); try { (lastFocusRef.current as any)?.focus?.(); } catch {} }} />
      <RightToolStrip templateId={templateId} />
      {/* Center preview */}
      <PreviewViewport />
      {/* Windows */}
      <DebugStress templateId={templateId} />
      <WindowsArea templateId={templateId} />
    </div>
  );
}

export default function CanvasOverlay({ templateId, onExit }: Props) {
  // Provide miniUI to leverage preview kernel and announcements
  return (
    <CanvasRoot>
      <TemplateMiniUIProvider>
        <div className="relative">
          <CanvasOverlayInner templateId={templateId} onExit={onExit} />
          {/* Right rail is available if needed; hash panel updates will reveal it */}
          <RightRailShell />
        </div>
      </TemplateMiniUIProvider>
    </CanvasRoot>
  );
}


