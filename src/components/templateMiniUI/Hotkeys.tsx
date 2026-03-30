"use client";

import { useEffect } from "react";
import { useTemplateMiniUI } from "./TemplateMiniUIProvider";
import { useWindowsStore } from "@/lib/state/windowStore";
import { usePerfHudStore } from "@/lib/state/devHudStore";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - allow bundler to include external JSON
import reference from "../../../docs/reference/ryos-reference.json";

type ComboCheck = (e: KeyboardEvent) => boolean;

function normalizeKey(key: string): string {
  const k = key.toLowerCase();
  // browser reports "`" or "backquote" depending on layout
  if (k === "`" || k === "backquote") return "`";
  if (k.startsWith("arrow")) return k; // arrowleft, arrowright, etc.
  return k;
}

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  const editable = el.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  return editable;
}

function buildComboCheck(combo: string): ComboCheck {
  // Examples: "Ctrl/Cmd+J", "Alt+`", "Alt+Shift+Arrow"
  const parts = combo.split("+");
  const wantCtrlOrCmd = parts.some(p => p.toLowerCase() === "ctrl/cmd");
  const wantCtrl = parts.some(p => p.toLowerCase() === "ctrl");
  const wantMeta = parts.some(p => p.toLowerCase() === "cmd" || p.toLowerCase() === "meta");
  const wantAlt = parts.some(p => p.toLowerCase() === "alt");
  const wantShift = parts.some(p => p.toLowerCase() === "shift");
  const hasArrowWildcard = parts.some(p => p.toLowerCase() === "arrow");
  const keyPart = parts.find(p => !["ctrl/cmd","ctrl","cmd","meta","alt","shift","arrow"].includes(p.toLowerCase()));

  return (e: KeyboardEvent) => {
    const k = normalizeKey(e.key);
    const ctrlOk = wantCtrlOrCmd ? (e.ctrlKey || e.metaKey) : (wantCtrl ? e.ctrlKey : true);
    const metaOk = wantCtrlOrCmd ? (e.ctrlKey || e.metaKey) : (wantMeta ? e.metaKey : true);
    const altOk = wantAlt ? e.altKey : true;
    const shiftOk = wantShift ? e.shiftKey : (!wantShift ? !e.shiftKey || true : true);
    if (!(ctrlOk && metaOk && altOk && shiftOk)) return false;
    if (hasArrowWildcard) {
      return k === 'arrowleft' || k === 'arrowright' || k === 'arrowup' || k === 'arrowdown';
    }
    if (!keyPart) return true;
    const expected = normalizeKey(keyPart);
    return k === expected;
  };
}

function parseParityCombos(): Record<string, ComboCheck[]> {
  const combos: Record<string, ComboCheck[]> = {};
  try {
    const kb = (reference as any)?.keyboard as Array<{ name: string; keys?: string }>;
    const layoutKb = ((reference as any)?.layout || []) as Array<{ name: string; keyboard?: string[] }>;
    const add = (name: string, s?: string | string[]) => {
      if (!s) return;
      const arr = Array.isArray(s) ? s : [s];
      const checks = arr.filter(Boolean).map((c) => buildComboCheck(c));
      if (!combos[name]) combos[name] = [];
      combos[name].push(...checks);
    };
    if (Array.isArray(kb)) {
      for (const item of kb) {
        add(item.name, item.keys);
      }
    }
    if (Array.isArray(layoutKb)) {
      for (const item of layoutKb) {
        if (Array.isArray(item.keyboard)) add(item.name, item.keyboard);
      }
    }
  } catch {}
  return combos;
}

function topmostOpenWindowId(windows: ReturnType<typeof useWindowsStore.getState>["windows"]) {
  const open = Object.values(windows).filter(w => w.isOpen);
  if (open.length === 0) return null;
  open.sort((a,b) => b.z - a.z);
  return open[0].id;
}

export function useGlobalHotkeys() {
  const ui = useTemplateMiniUI() as any;

  useEffect(() => {
    const combos = parseParityCombos();

    const isCombo = (name: string, e: KeyboardEvent) => {
      const arr = combos[name] || [];
      return arr.some(fn => fn(e));
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const editable = isEditableTarget(e.target);
      const k = normalizeKey(e.key);
      const hasModifier = e.ctrlKey || e.metaKey || e.altKey;

      // Toggle Perf HUD with Ctrl+Shift+P (development only)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && normalizeKey(e.key) === 'p') {
        e.preventDefault();
        e.stopPropagation();
        try {
          if (process.env.NODE_ENV === 'development') {
            usePerfHudStore.getState().toggle();
          }
        } catch {}
        return;
      }

      // Shortcuts modal toggle with '?'
      if (k === '?' || (k === '/' && e.shiftKey)) {
        if (!editable) {
          e.preventDefault();
          e.stopPropagation();
          ui.openShortcuts?.();
        }
        return;
      }

      // Close contexts on Esc (from layout.window-close)
      if (k === 'escape') {
        e.preventDefault();
        e.stopPropagation();
        if (ui.shortcutsOpen) { ui.closeShortcuts?.(); return; }
        if (ui.panel) { ui.goBack(); return; }
        if (ui.mode === 'editor') {
          try { ui.getKernel?.('sandbox-template')?.cancel('esc'); } catch {}
        }
        const id = topmostOpenWindowId(store.windows);
        if (id) { store.close(id); return; }
        return;
      }

      // For non-Esc keys: allow global combos with modifiers even inside inputs; ignore plain typing
      if (editable && !hasModifier) return;

      // Toggle Recipe Book window
      if (isCombo('toggle-recipe-book', e)) {
        e.preventDefault();
        e.stopPropagation();
        const st = useWindowsStore.getState();
        const wnd = st.windows.recipeBook;
        if (wnd?.isOpen) st.bringToFront('recipeBook' as any); else st.open('recipeBook' as any);
        return;
      }

      // Cycle windows next/prev
      if (isCombo('cycle-windows-next', e) || isCombo('cycle-windows-prev', e)) {
        e.preventDefault();
        e.stopPropagation();
        const st = useWindowsStore.getState();
        const all = Object.values(st.windows).filter(w => (w as any).isOpen);
        if (all.length === 0) return;
        all.sort((a,b) => b.z - a.z);
        const ids = all.map(w => w.id);
        const currentTop = ids[0];
        const dir = isCombo('cycle-windows-prev', e) ? -1 : 1;
        const idx = (ids.indexOf(currentTop) + dir + ids.length) % ids.length;
        const nextId = ids[idx];
        st.bringToFront(nextId as any);
        return;
      }

      // Move or resize topmost window in 10px increments
      const st = useWindowsStore.getState();
      const id = topmostOpenWindowId(st.windows as any);
      if (id) {
        const step = 10;
        const isMove = isCombo('move-window', e);
        const isResize = isCombo('resize-window', e);
        if (isMove || isResize) {
          e.preventDefault();
          e.stopPropagation();
          const w = (st.windows as any)[id];
          if (normalizeKey(e.key) === 'arrowleft') {
            isMove ? st.move(id as any, w.x - step, w.y) : st.resize(id as any, Math.max(320, w.width - step), w.height);
          } else if (normalizeKey(e.key) === 'arrowright') {
            isMove ? st.move(id as any, w.x + step, w.y) : st.resize(id as any, w.width + step, w.height);
          } else if (normalizeKey(e.key) === 'arrowup') {
            isMove ? st.move(id as any, w.x, w.y - step) : st.resize(id as any, w.width, Math.max(240, w.height - step));
          } else if (normalizeKey(e.key) === 'arrowdown') {
            isMove ? st.move(id as any, w.x, w.y + step) : st.resize(id as any, w.width, w.height + step);
          }
          return;
        }
      }
    };

    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true } as any);
  }, [ui.mode, ui.panel, ui.shortcutsOpen]);
}

export function MiniUIHotkeys() {
  useGlobalHotkeys();
  return null;
}

