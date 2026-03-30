"use client";

import { applyPatch, compare, Operation } from "fast-json-patch";
import { logTemplateEvent } from "../events";

export interface Variant {
  id: string;
  name: string;
  fromId: string | null;
  createdAt: number;
  diff: Operation[];
}

export interface ABState<T> {
  base: T;
  variants: Record<string, Variant>;
  activeVariantId: string | null;
}

export class ABEngine<T extends object> {
  private state: ABState<T>;
  private templateId: string;
  private onChange?: (state: ABState<T>) => void;
  private storageKey: string;

  constructor(params: { templateId: string; base: T; onChange?: (state: ABState<T>) => void }) {
    this.templateId = params.templateId;
    this.state = { base: structuredClone(params.base), variants: {}, activeVariantId: null };
    this.onChange = params.onChange;
    this.storageKey = `__miniui_ab_${this.templateId}`;
    this.load();
  }

  getState(): ABState<T> {
    return this.state;
  }

  setBase(nextBase: T) {
    this.state.base = structuredClone(nextBase);
    this.emit();
  }

  listVariants(): Variant[] {
    return Object.values(this.state.variants);
  }

  createVariant(from: T, name: string): Variant {
    const id = `v_${Math.random().toString(36).slice(2, 10)}`;
    const base = this.state.base;
    const diff = compare(base, from);
    const variant: Variant = {
      id,
      name: name || id,
      fromId: null,
      createdAt: Date.now(),
      diff,
    };
    this.state.variants[id] = variant;
    this.state.activeVariantId = id;
    this.save();
    this.emit();
    // Telemetry
    logTemplateEvent({ event_type: 'variant', template_id: this.templateId, variant_id: id, metrics_payload: { action: 'ab_variant_created', name, diffSize: diff.length } }).catch(()=>{});
    return variant;
  }

  setActiveVariant(id: string | null) {
    if (id && !this.state.variants[id]) return;
    this.state.activeVariantId = id;
    this.save();
    this.emit();
    logTemplateEvent({ event_type: 'variant', template_id: this.templateId, variant_id: id || null, metrics_payload: { action: id ? 'ab_variant_activated' : 'ab_variant_cleared' } }).catch(()=>{});
  }

  deleteVariant(id: string) {
    if (!this.state.variants[id]) return;
    const wasActive = this.state.activeVariantId === id;
    delete this.state.variants[id];
    if (wasActive) this.state.activeVariantId = null;
    this.save();
    this.emit();
    logTemplateEvent({ event_type: 'variant', template_id: this.templateId, variant_id: id, metrics_payload: { action: 'ab_variant_deleted' } }).catch(()=>{});
  }

  materialize(): T {
    const { base, activeVariantId, variants } = this.state;
    if (!activeVariantId) return structuredClone(base);
    const v = variants[activeVariantId];
    if (!v) return structuredClone(base);
    const copy = structuredClone(base);
    applyPatch(copy as any, v.diff, true, true);
    return copy;
  }

  private emit() {
    try {
      this.onChange && this.onChange(this.state);
    } catch {}
  }

  private save() {
    try {
      if (typeof window === 'undefined') return;
      const payload = {
        variants: this.state.variants,
        activeVariantId: this.state.activeVariantId,
      };
      window.localStorage.setItem(this.storageKey, JSON.stringify(payload));
    } catch {}
  }

  private load() {
    try {
      if (typeof window === 'undefined') return;
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        this.state.variants = parsed.variants || {};
        this.state.activeVariantId = parsed.activeVariantId || null;
      }
    } catch {}
  }
}


