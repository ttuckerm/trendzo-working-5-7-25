"use client";

import React, { useMemo, useRef, useState } from "react";
import { ABEngine } from "../ab/ABEngine";
import { useTemplateMiniUI } from "../TemplateMiniUIProvider";
import { toHash, fromHash } from "../router/urlState";

interface ABPanelProps<T extends object> {
  templateId: string;
  getBase: () => T;
  getCurrent: () => T;
  onRenderPreview: (materialized: T) => void;
}

export function ABPanel<T extends object>({ templateId, getBase, getCurrent, onRenderPreview }: ABPanelProps<T>) {
  const [name, setName] = useState("");
  const [, setTick] = useState(0);
  const engineRef = useRef<ABEngine<T> | null>(null);
  const { variantId } = useTemplateMiniUI() as any;

  const engine = useMemo(() => {
    const base = getBase();
    if (!engineRef.current) {
      engineRef.current = new ABEngine<T>({ templateId, base, onChange: () => setTick((n) => n + 1) });
    } else {
      engineRef.current.setBase(base);
    }
    return engineRef.current;
  }, [templateId, getBase]);

  // On mount or when URL variantId changes, adopt it
  useMemo(() => {
    if (!engineRef.current) return;
    if (variantId) {
      // if variant exists, activate; if not, ignore
      const exists = engineRef.current.listVariants().some(v => v.id === variantId);
      if (exists) {
        engineRef.current.setActiveVariant(variantId);
        onRenderPreview(engineRef.current.materialize());
      }
    } else {
      engineRef.current.setActiveVariant(null);
      onRenderPreview(engineRef.current.materialize());
    }
  }, [variantId]);

  const variants = engine.listVariants();
  const activeId = engine.getState().activeVariantId;

  function updateHash(nextVariantId: string | null) {
    const current = fromHash(window.location.hash);
    const h = toHash({ ...current, variantId: nextVariantId });
    if (window.location.hash !== h) window.location.hash = h;
  }

  function createVariant() {
    const from = getCurrent();
    const v = engine.createVariant(from, name.trim() || "Variant B");
    setName("");
    const mat = engine.materialize();
    onRenderPreview(mat);
    updateHash(v.id);
  }

  function activate(id: string) {
    engine.setActiveVariant(id);
    onRenderPreview(engine.materialize());
    updateHash(id);
  }

  function clearActive() {
    engine.setActiveVariant(null);
    onRenderPreview(engine.materialize());
    updateHash(null);
  }

  function del(id: string) {
    engine.deleteVariant(id);
    onRenderPreview(engine.materialize());
    const active = engine.getState().activeVariantId;
    updateHash(active);
  }

  return (
    <div>
      <div className="text-sm text-zinc-300">Create and manage A/B variants.</div>
      <div className="mt-3 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Variant name (e.g., Variant B)"
          className="w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white placeholder:text-zinc-500"
        />
        <button
          className="rounded border border-white/10 bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20"
          onClick={createVariant}
        >New Variant</button>
      </div>
      <div className="mt-4">
        {variants.length === 0 ? (
          <div className="text-xs text-zinc-400">No variants yet.</div>
        ) : (
          <ul className="space-y-2">
            {variants.map((v) => (
              <li key={v.id} className="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-2 py-2">
                <div className="text-xs text-zinc-200">{v.name}</div>
                {activeId === v.id ? (
                  <span className="ml-2 rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200">Active</span>
                ) : null}
                <div className="ml-auto flex gap-2">
                  <button className="rounded border border-white/10 bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20" onClick={() => activate(v.id)}>Set Active</button>
                  <button className="rounded border border-white/10 bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20" onClick={() => del(v.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {activeId && (
        <div className="mt-3">
          <button className="rounded border border-white/10 bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20" onClick={clearActive}>Clear Active</button>
        </div>
      )}
    </div>
  );
}

export default ABPanel;


