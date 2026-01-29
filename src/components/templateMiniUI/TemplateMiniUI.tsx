"use client";

import React, { useEffect, useMemo, useState } from "react";
import { miniRouter, MiniPanel } from "./miniRouter";
import { createTemplateStore } from "./store";
import { bindTemplateSignals, publishSlotUpdate, SuggestionUpdateSignal, ValidationHintSignal } from "./signalBridge";
import { usePreviewKernel, RenderPerfMetrics } from "./previewKernel";
import { validateTemplate } from "./validation";
import { logTemplateEvent } from "./events";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DashboardPanel } from "./panels/DashboardPanel";
import { ScriptsPanel } from "./panels/ScriptsPanel";
import { OptimizePanel } from "./panels/OptimizePanel";
import { ABTestPanel } from "./panels/ABTestPanel";
import { InceptionPanel } from "./panels/InceptionPanel";
import { EnhancedValidatePanel } from "./panels/EnhancedValidatePanel";
import { installMiniRouterShortcuts } from "./miniRouter";
import { isTemplateMiniUIEnabled } from "@/config/flags";
import useSWR from 'swr';

type Props = {
  templateId: string;
  platform: "tiktok" | "instagram" | "youtube" | string;
  userId?: string;
};

export default function TemplateMiniUI({ templateId, platform, userId }: Props) {
  // Check feature flag
  if (!isTemplateMiniUIEnabled()) {
    return null;
  }

  const store = useMemo(() => createTemplateStore({ templateId, platform }), [templateId, platform]);
  const [panel, setPanel] = useState<MiniPanel | null>(null);
  const [mode, setMode] = useState<"reader" | "editor">("reader");
  const [suggestions, setSuggestions] = useState<SuggestionUpdateSignal[]>([]);
  const [validationHints, setValidationHints] = useState<ValidationHintSignal[]>([]);
  
  // Enhanced preview kernel with performance hooks
  const { render, cancelInFlight, isRendering, showSkeleton, renderTarget, getPerformanceStats } = usePreviewKernel({
    onRenderStart: (target, reason) => {
      logTemplateEvent({
        event_type: "preview_started",
        template_id: templateId,
        platform,
        user_id: userId,
        metrics_payload: { target, reason }
      });
    },
    onRenderComplete: (metrics: RenderPerfMetrics) => {
      logTemplateEvent({
        event_type: "preview_completed",
        template_id: templateId,
        platform,
        user_id: userId,
        metrics_payload: {
          duration: metrics.duration,
          target: metrics.target,
          reason: metrics.reason,
          was_interrupted: metrics.wasInterrupted
        }
      });
    },
    onRenderError: (error, target) => {
      logTemplateEvent({
        event_type: "preview_failed",
        template_id: templateId,
        platform,
        user_id: userId,
        metrics_payload: { target, error: error.message }
      });
    }
  });

  // Router binding with keyboard shortcuts
  useEffect(() => {
    const unsubRouter = miniRouter.subscribe((st) => {
      setMode(st.mode);
      setPanel(st.panel);
    });
    
    const unsubShortcuts = installMiniRouterShortcuts();
    
    return () => { 
      unsubRouter(); 
      unsubShortcuts();
    };
  }, []);

  // Telemetry on open
  useEffect(() => {
    logTemplateEvent({ event_type: "open", template_id: templateId, platform, user_id: userId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Enhanced realtime signal binding with suggestion and validation hint support
  useEffect(() => {
    const unsubscribe = bindTemplateSignals(
      templateId, 
      // Slot updates
      (sig) => {
        store.getState().setSlot(sig.slot, sig.value);
        cancelInFlight();
        render({ reason: `signal:${sig.slot}`, payload: sig, target: sig.slot });
      },
      // Suggestion updates
      (sig) => {
        setSuggestions(prev => [...prev.slice(-4), sig]); // Keep last 5 suggestions
        // Emit event for preview kernel to refresh if needed
        render({ reason: `suggestion:${sig.slot}`, payload: sig, target: sig.slot });
      },
      // Validation hints
      (sig) => {
        setValidationHints(prev => [...prev.slice(-2), sig]); // Keep last 3 hints
      }
    );
    return () => unsubscribe();
  }, [templateId, store, render, cancelInFlight]);

  // Validation on changes
  const issues = useMemo(() => {
    const s = store.getState();
    return validateTemplate({ platform, slots: s.slots });
  }, [store, platform]);

  // Handle slot updates from panels
  // NOTE: Avoid `typeof store.getState().slots` in a type position; SWC chokes on call expressions there.
  // Use ReturnType<typeof store.getState> and index to 'slots' instead.
  type StoreState = ReturnType<typeof store.getState>;
  type SlotsState = StoreState['slots'];
  const handleSlotsUpdate = (updates: Partial<SlotsState>) => {
    const currentState = store.getState();
    store.setState({ 
      slots: { ...currentState.slots, ...updates }, 
      isDirty: true 
    });
    
    // Trigger preview refresh
    cancelInFlight();
    render({ reason: "manual_update", payload: updates, target: "all" });
  };

  // Handle panel actions
  const handlePanelAction = (action: string) => {
    logTemplateEvent({
      event_type: "panel_opened",
      template_id: templateId,
      platform,
      user_id: userId,
      metrics_payload: { action, panel }
    });
  };

  const showRightRail = mode === "reader" && panel != null;
  const s = store.getState();

  return (
    <div className="relative w-full h-full">
      {/* Header with navigation */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="text-sm text-muted-foreground">Viral Recipe Book → [Template]</div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant={panel === "dashboard" ? "default" : "ghost"}
            onClick={() => miniRouter.set({ mode: "reader", panel: "dashboard" })} 
            aria-label="Open dashboard panel (D)"
          >
            Dashboard
          </Button>
          <Button 
            size="sm" 
            variant={panel === "scripts" ? "default" : "ghost"}
            onClick={() => miniRouter.set({ mode: "reader", panel: "scripts" })} 
            aria-label="Open scripts panel (S)"
          >
            Scripts
          </Button>
          <Button 
            size="sm" 
            variant={panel === "optimize" ? "default" : "ghost"}
            onClick={() => miniRouter.set({ mode: "reader", panel: "optimize" })} 
            aria-label="Open optimize panel (O)"
          >
            Optimize
          </Button>
          <Button 
            size="sm" 
            variant={panel === "abtest" ? "default" : "ghost"}
            onClick={() => miniRouter.set({ mode: "reader", panel: "abtest" })} 
            aria-label="Open A/B test panel (B)"
          >
            A/B Test
          </Button>
          <Button 
            size="sm" 
            variant={panel === "inception" ? "default" : "ghost"}
            onClick={() => miniRouter.set({ mode: "reader", panel: "inception" })} 
            aria-label="Open inception panel (I)"
          >
            Inception
          </Button>
          <Button 
            size="sm" 
            variant={panel === "validate" ? "default" : "ghost"}
            onClick={() => miniRouter.set({ mode: "reader", panel: "validate" })} 
            aria-label="Open validate panel (V)"
          >
            Validate
          </Button>
          <Button 
            size="sm" 
            variant={mode === "editor" ? "default" : "outline"}
            onClick={() => miniRouter.setMode(mode === "editor" ? "reader" : "editor")} 
            aria-label="Toggle editor mode (E)"
          >
            {mode === "editor" ? "Reader" : "Editor"}
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="p-4">
        <div className="rounded border h-64 flex items-center justify-center relative">
          {showSkeleton && (
            <div className="absolute inset-0 animate-pulse bg-muted/40" aria-live="polite" aria-busy="true" />
          )}
          <div className="text-sm">
            <div className="text-center mb-4">
              <div className="font-medium">Preview ({platform})</div>
              {renderTarget && (
                <div className="text-xs text-muted-foreground">Rendering: {renderTarget}</div>
              )}
            </div>
            
            <div className="space-y-2 max-w-md">
              <div className="p-2 rounded border bg-muted/20">
                <div className="text-xs font-medium">Hook:</div>
                <div className="text-muted-foreground">{s.slots.hook || "(empty)"}</div>
              </div>
              
              <div className="p-2 rounded border bg-muted/20">
                <div className="text-xs font-medium">First 3s Cue:</div>
                <div className="text-muted-foreground">{s.slots.first3sCue || "(empty)"}</div>
              </div>
              
              <div className="p-2 rounded border bg-muted/20">
                <div className="text-xs font-medium">Hashtags:</div>
                <div className="text-muted-foreground">
                  {s.slots.hashtags.length > 0 ? s.slots.hashtags.join(", ") : "(empty)"}
                </div>
              </div>

              {isRendering && (
                <div className="text-xs text-center text-muted-foreground animate-pulse">
                  Updating preview...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance stats (dev only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-2 rounded border bg-muted/10 text-xs">
            <div className="font-medium mb-1">Performance Stats:</div>
            <div>Slot Edit P95: {getPerformanceStats().slotEditP95}ms</div>
            <div>Full Refresh P95: {getPerformanceStats().fullRefreshP95}ms</div>
          </div>
        )}
      </div>

      {/* Right rail panels */}
      <Dialog open={showRightRail} onOpenChange={() => miniRouter.goBack()}>
        <DialogContent className="fixed right-0 top-0 bottom-0 h-full w-[400px] max-w-[85vw] translate-x-0 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right outline-none focus-trap">
          {panel === "dashboard" && (
            <DashboardPanel templateId={templateId} onAction={handlePanelAction} />
          )}
          {panel === "scripts" && (
            <ScriptsPanel 
              templateId={templateId} 
              platform={platform} 
              userId={userId}
              onAction={handlePanelAction} 
            />
          )}
          {panel === "optimize" && (
            <OptimizePanel 
              templateId={templateId} 
              platform={platform} 
              slots={s.slots}
              userId={userId}
              onSlotsUpdate={handleSlotsUpdate}
              onAction={handlePanelAction} 
            />
          )}
          {panel === "abtest" && (
            <ABTestPanel 
              templateId={templateId} 
              platform={platform} 
              userId={userId}
              onAction={handlePanelAction} 
            />
          )}
          {panel === "inception" && (
            <InceptionPanel 
              templateId={templateId} 
              platform={platform} 
              userId={userId}
              onAction={handlePanelAction} 
            />
          )}
          {panel === "validate" && (
            <EnhancedValidatePanel 
              templateId={templateId} 
              platform={platform} 
              slots={s.slots}
              userId={userId}
              onAction={handlePanelAction} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Keyboard shortcuts hint */}
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
        Press D/S/O/B/I/V for panels, E for editor, Esc to close
      </div>
    </div>
  );
}



