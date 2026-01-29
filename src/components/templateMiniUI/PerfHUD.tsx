"use client";

import React, { useEffect, useRef, useState } from 'react';
import { signalBridge } from './realtime/SignalBridge';
import { transitions } from '@/styles/motion';
import { usePerfHudStore } from '@/lib/state/devHudStore';

function PerfHudBody() {
  const [lastTookMs, setLastTookMs] = useState<number>(0);
  const [queueDepth, setQueueDepth] = useState<number>(0);
  const [canceledCount, setCanceledCount] = useState<number>(0);
  const queuedRef = useRef(0);

  useEffect(() => {
    const unsub = signalBridge.subscribe((evt) => {
      if (evt.type === 'preview:queued') {
        queuedRef.current += 1;
        setQueueDepth(queuedRef.current);
      }
      if (evt.type === 'preview:started') {
        queuedRef.current = Math.max(0, queuedRef.current - 1);
        setQueueDepth(queuedRef.current);
      }
      if (evt.type === 'preview:canceled') {
        setCanceledCount((n) => n + 1);
        if (typeof (evt as any).tookMs === 'number') setLastTookMs((evt as any).tookMs);
      }
      if (evt.type === 'preview:completed') {
        if (typeof (evt as any).tookMs === 'number') setLastTookMs((evt as any).tookMs);
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[1400]" style={transitions.fast}>
      <div className="pointer-events-auto rounded-md border border-white/10 px-3 py-2 text-xs text-zinc-100"
        style={{ background: 'var(--panel-bg)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-chrome)' }}>
        <div className="font-medium">Perf HUD</div>
        <div className="opacity-80">last preview: {lastTookMs}ms</div>
        <div className="opacity-80">queue: {queueDepth}</div>
        <div className="opacity-80">canceled: {canceledCount}</div>
      </div>
    </div>
  );
}

export function PerfHUD() {
  // Hash-gated visibility: show only when URL hash contains debug=hud
  const [show, setShow] = useState<boolean>(false);
  useEffect(() => {
    const check = () => {
      try { setShow(typeof window !== 'undefined' && window.location.hash.includes('debug=hud')); } catch { setShow(false); }
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, []);
  return show ? <PerfHudBody /> : null;
}


