"use client";

// Mini-router that maps URL hash to mode/panel and maintains a simple back stack

export type MiniPanel =
  | "dashboard"
  | "scripts"
  | "optimize"
  | "abtest"
  | "inception"
  | "validate";

export type MiniMode = "reader" | "editor";

export interface MiniRouteState {
  mode: MiniMode;
  panel: MiniPanel | null; // only relevant in reader mode
}

type Listener = (state: MiniRouteState) => void;

function normalizeHash(rawHash: string): string {
  if (!rawHash) return "#reader";
  return rawHash.startsWith("#") ? rawHash : `#${rawHash}`;
}

function stateFromHash(hash: string): MiniRouteState {
  const h = normalizeHash(hash).toLowerCase();
  if (h === "#editor") return { mode: "editor", panel: null };
  if (h === "#reader") return { mode: "reader", panel: null };

  const panel = h.replace(/^#/, "") as MiniPanel;
  const validPanels: MiniPanel[] = [
    "dashboard",
    "scripts",
    "optimize",
    "abtest",
    "inception",
    "validate",
  ];
  if ((validPanels as string[]).includes(panel)) {
    return { mode: "reader", panel };
  }
  return { mode: "reader", panel: null };
}

function hashFromState(state: MiniRouteState): string {
  if (state.mode === "editor") return "#editor";
  if (!state.panel) return "#reader";
  return `#${state.panel}`;
}

class MiniRouter {
  private listeners: Set<Listener> = new Set();
  private backStack: string[] = [];
  private current: MiniRouteState;
  private isInitialized = false;

  constructor() {
    this.current = stateFromHash(typeof window !== "undefined" ? window.location.hash : "#reader");
    if (typeof window !== "undefined") {
      window.addEventListener("hashchange", this.onHashChange);
      this.isInitialized = true;
    }
  }

  private onHashChange = () => {
    const next = stateFromHash(window.location.hash);
    const prevHash = hashFromState(this.current);
    const nextHash = hashFromState(next);
    if (prevHash !== nextHash) {
      this.backStack.push(prevHash);
    }
    this.current = next;
    this.emit();
  };

  private emit() {
    for (const l of this.listeners) l(this.current);
  }

  getState(): MiniRouteState {
    return this.current;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // emit initial state
    listener(this.current);
    return () => {
      this.listeners.delete(listener);
    };
  }

  set(state: MiniRouteState) {
    const targetHash = hashFromState(state);
    if (typeof window === "undefined") return;
    if (!this.isInitialized) return;
    const prevHash = hashFromState(this.current);
    if (prevHash !== targetHash) this.backStack.push(prevHash);
    this.current = state;
    window.location.hash = targetHash;
  }

  setMode(mode: MiniMode) {
    const next: MiniRouteState = { ...this.current, mode, panel: mode === "reader" ? this.current.panel : null };
    this.set(next);
  }

  setPanel(panel: MiniPanel | null) {
    const next: MiniRouteState = { mode: "reader", panel };
    this.set(next);
  }

  goBack() {
    if (typeof window === "undefined") return;
    const prev = this.backStack.pop();
    if (prev) {
      window.location.hash = prev;
      this.current = stateFromHash(prev);
      this.emit();
    } else {
      // default fallback
      window.location.hash = "#reader";
      this.current = { mode: "reader", panel: null };
      this.emit();
    }
  }
}

export const miniRouter = new MiniRouter();

export function installMiniRouterShortcuts() {
  if (typeof window === "undefined") return () => {};
  const handler = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return; // avoid conflicts
    const key = e.key.toLowerCase();
    if (key === "escape") {
      e.preventDefault();
      miniRouter.goBack();
      return;
    }
    const map: Record<string, MiniPanel | "editor" | "reader"> = {
      d: "dashboard",
      s: "scripts",
      o: "optimize",
      b: "abtest",
      i: "inception",
      v: "validate",
      e: "editor",
    };
    const target = map[key];
    if (!target) return;
    e.preventDefault();
    if (target === "editor") {
      miniRouter.setMode("editor");
    } else if (target === "reader") {
      miniRouter.set({ mode: "reader", panel: null });
    } else {
      miniRouter.setPanel(target);
    }
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}


