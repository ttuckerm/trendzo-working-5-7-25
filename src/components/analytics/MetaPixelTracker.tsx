'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView, trackLead } from '@/lib/analytics/meta-pixel';

interface EmailCapturedDetail {
  assessmentId: string;
  source: 'hud_panel' | 'agent_conversation';
}

export default function MetaPixelTracker() {
  const pathname = usePathname();
  const firstRender = useRef(true);

  // SPA navigation PageView. Skip the very first render — the inline snippet
  // in app/layout.tsx already fires the initial PageView.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    trackPageView();
  }, [pathname]);

  // Email-capture Lead — listen for the existing window-level CustomEvent
  // dispatched by EmailCapturePanel.tsx, AgentRail.tsx, and AgentGate.tsx.
  // Dedup is keyed by (source, assessmentId) so the same form can't
  // double-fire if the user submits twice in one session.
  useEffect(() => {
    function onCaptured(e: Event) {
      const detail = (e as CustomEvent<EmailCapturedDetail>).detail;
      if (!detail?.source || !detail?.assessmentId) return;
      const key = `meta_pixel:lead:email:${detail.source}:${detail.assessmentId}`;
      if (typeof sessionStorage !== 'undefined') {
        if (sessionStorage.getItem(key) === '1') return;
        try { sessionStorage.setItem(key, '1'); } catch { /* ignore */ }
      }
      trackLead({ content_name: detail.source });
    }
    window.addEventListener('assessment:email-captured', onCaptured as EventListener);
    return () => {
      window.removeEventListener('assessment:email-captured', onCaptured as EventListener);
    };
  }, []);

  return null;
}
