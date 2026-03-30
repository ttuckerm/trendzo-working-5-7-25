"use client";

import { supabaseClient } from "@/lib/supabase-client";
import type { TemplateSlotName } from "./store";

export interface SlotUpdateSignal {
  templateId: string;
  slot: TemplateSlotName;
  value: string | string[];
  ts: number;
  source?: string; // e.g., "optimizer", "validate", etc.
}

export interface SuggestionUpdateSignal {
  templateId: string;
  slot: TemplateSlotName;
  suggestion: string | string[];
  confidence: number;
  source: string;
  ts: number;
}

export interface ValidationHintSignal {
  templateId: string;
  hint_type: "warning" | "error" | "info";
  message: string;
  slot?: TemplateSlotName;
  suggestion?: string;
  ts: number;
}

export type Unsubscribe = () => void;

// Debounce utility for 100ms
function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  }) as T;
}

export function bindTemplateSignals(
  templateId: string,
  onUpdate: (sig: SlotUpdateSignal) => void,
  onSuggestion?: (sig: SuggestionUpdateSignal) => void,
  onValidationHint?: (sig: ValidationHintSignal) => void
): Unsubscribe {
  // Debounced handlers
  const debouncedUpdate = debounce(onUpdate, 100);
  const debouncedSuggestion = onSuggestion ? debounce(onSuggestion, 100) : undefined;
  const debouncedValidationHint = onValidationHint ? debounce(onValidationHint, 100) : undefined;

  // Use broadcast channel to avoid reliance on DB triggers
  const channelName = `template:${templateId}`;
  const channel = supabaseClient
    .channel(channelName)
    .on("broadcast", { event: "slot_update" }, ({ payload }) => {
      const msg = payload as SlotUpdateSignal;
      if (!msg || msg.templateId !== templateId) return;
      debouncedUpdate(msg);
    })
    .on("broadcast", { event: "suggestion_update" }, ({ payload }) => {
      const msg = payload as SuggestionUpdateSignal;
      if (!msg || msg.templateId !== templateId || !debouncedSuggestion) return;
      debouncedSuggestion(msg);
    })
    .on("broadcast", { event: "validation_hint" }, ({ payload }) => {
      const msg = payload as ValidationHintSignal;
      if (!msg || msg.templateId !== templateId || !debouncedValidationHint) return;
      debouncedValidationHint(msg);
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log(`✅ Signal bridge connected: ${channelName}`);
      }
    });

  return () => {
    try {
      channel.unsubscribe();
    } catch {}
  };
}

export async function publishSlotUpdate(signal: SlotUpdateSignal) {
  const channelName = `template:${signal.templateId}`;
  await supabaseClient.channel(channelName).send({
    type: "broadcast",
    event: "slot_update",
    payload: signal,
  });
}

export async function publishSuggestionUpdate(signal: SuggestionUpdateSignal) {
  const channelName = `template:${signal.templateId}`;
  await supabaseClient.channel(channelName).send({
    type: "broadcast",
    event: "suggestion_update",
    payload: signal,
  });
}

export async function publishValidationHint(signal: ValidationHintSignal) {
  const channelName = `template:${signal.templateId}`;
  await supabaseClient.channel(channelName).send({
    type: "broadcast",
    event: "validation_hint",
    payload: signal,
  });
}


