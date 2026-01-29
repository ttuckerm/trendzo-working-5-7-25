"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = { children: React.ReactNode };

/**
 * CanvasPortal
 * - Appends a #canvas-root element as a direct child of <body>
 * - Locks body scroll and isolates the app via inert + aria-hidden
 * - Shows a magenta flash for ~800ms, then switches to a gradient to prove full-screen cover
 */
export default function CanvasPortal({ children }: Props) {
  const [rootEl, setRootEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const doc = document;
    const id = "canvas-root";
    let el = doc.getElementById(id) as HTMLDivElement | null;
    const created = !el;
    if (!el) {
      el = doc.createElement("div");
      el.id = id;
      doc.body.appendChild(el);
    }

    // Body lock and app isolation
    doc.body.classList.add("canvas-open");
    const appRoot = doc.getElementById("app-root");
    if (appRoot) {
      try { appRoot.setAttribute("inert", ""); } catch {}
      try { appRoot.setAttribute("aria-hidden", "true"); } catch {}
    }

    // Configure root element styling and classes
    try {
      el.style.position = "fixed";
      // @ts-ignore: style.inset is supported in modern browsers
      el.style.inset = "0";
      el.style.zIndex = String(2147483647);
      el.style.left = "0";
      el.style.top = "0";
      el.style.width = "100vw";
      el.style.height = "100vh";
    } catch {}
    el.classList.add("sandbox-canvas", "trendzo-theme", "ryos-parity");

    // Magenta flash then gradient
    const gradient = "linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 50%, #ec4899 100%)";
    el.style.background = "#ff00ff";
    const t = setTimeout(() => {
      try { el!.style.background = gradient; } catch {}
    }, 800);

    setRootEl(el);

    return () => {
      clearTimeout(t);
      try { el!.style.background = ""; } catch {}
      try { el!.classList.remove("sandbox-canvas", "trendzo-theme", "ryos-parity"); } catch {}
      doc.body.classList.remove("canvas-open");
      if (appRoot) {
        try { appRoot.removeAttribute("inert"); } catch {}
        try { appRoot.removeAttribute("aria-hidden"); } catch {}
      }
      if (created) {
        try { el?.parentNode?.removeChild(el); } catch {}
      } else {
        try { el!.innerHTML = ""; } catch {}
      }
    };
  }, []);

  if (!rootEl) return null;

  // Children manage their own pointer-events/z-index; render directly into the body-level root
  return createPortal(children, rootEl);
}


