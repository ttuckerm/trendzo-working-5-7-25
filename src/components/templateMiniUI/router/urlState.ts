"use client";

export type MiniMode = "reader" | "editor";
export type MiniPanel = "dashboard" | "scripts" | "optimize" | "abtest" | "inception" | "validate" | null;

export interface UrlState {
  mode: MiniMode;
  panel: MiniPanel;
  templateId?: string | null;
  variantId?: string | null;
}

function encode(obj: Record<string, string | null | undefined>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === "") continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.join("&");
}

function normalizeHash(h: string): string {
  if (!h) return "#reader";
  return h.startsWith("#") ? h : `#${h}`;
}

export function toHash(state: UrlState): string {
  // Base segment
  let seg = state.mode === "editor" ? "editor" : state.panel || "reader";
  const params = encode({ t: state.templateId || undefined, v: state.variantId || undefined });
  return params ? `#${seg}?${params}` : `#${seg}`;
}

export function fromHash(hash: string): UrlState {
  const h = normalizeHash(hash);
  const raw = h.replace(/^#/, "");
  const [seg, qs] = raw.split("?");
  const url = new URL("http://x/x?" + (qs || ""));
  // Support both existing scheme (segment = panel|editor|reader) and new canvas scheme
  if (seg === "canvas") {
    const modeParam = (url.searchParams.get("mode") || "reader").toLowerCase() as MiniMode;
    const panelParam = (url.searchParams.get("panel") || "").toLowerCase();
    const t = url.searchParams.get("templateId") || url.searchParams.get("t");
    const v = url.searchParams.get("variantId") || url.searchParams.get("v");
    const validPanels = new Set(["dashboard", "scripts", "optimize", "abtest", "inception", "validate"]);
    const panel = validPanels.has(panelParam) ? (panelParam as UrlState["panel"]) : null;
    const mode: MiniMode = modeParam === "editor" ? "editor" : "reader";
    return { mode, panel, templateId: t, variantId: v };
  }
  const t = url.searchParams.get("t");
  const v = url.searchParams.get("v");
  if (seg === "editor") return { mode: "editor", panel: null, templateId: t, variantId: v };
  if (seg === "reader") return { mode: "reader", panel: null, templateId: t, variantId: v };
  const validPanels = new Set(["dashboard", "scripts", "optimize", "abtest", "inception", "validate"]);
  const panel = validPanels.has(seg) ? (seg as UrlState["panel"]) : null;
  return { mode: "reader", panel, templateId: t, variantId: v };
}

export function applyUrlState(state: UrlState) {
  const next = toHash(state);
  if (typeof window !== "undefined") window.location.hash = next;
}

// Canvas-style hash helpers for deep links like:
//   #canvas?templateId=...&panel=...&mode=reader|editor[&variantId=...]
export function toCanvasHash(state: UrlState): string {
  const mode = state.mode || "reader";
  const q = encode({
    templateId: state.templateId || undefined,
    variantId: state.variantId || undefined,
    panel: state.panel || undefined,
    mode,
  });
  return q ? `#canvas?${q}` : `#canvas`;
}


