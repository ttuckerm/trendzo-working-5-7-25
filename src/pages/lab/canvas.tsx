"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Draggable from "react-draggable";

function IsolatedCanvasPortal({ children }: { children: React.ReactNode }) {
  const [rootEl, setRootEl] = useState<HTMLElement | null>(null);
  const createdRef = useRef(false);
  const prevOverflowRef = useRef<string | null>(null);

  useEffect(() => {
    const doc = document;
    let el = doc.getElementById("lab-canvas-root") as HTMLDivElement | null;
    const created = !el;
    if (!el) {
      el = doc.createElement("div");
      el.id = "lab-canvas-root";
      doc.body.appendChild(el);
    }
    createdRef.current = created;

    // Style root to cover everything
    try {
      el.style.position = "fixed";
      // @ts-ignore
      el.style.inset = "0";
      el.style.zIndex = String(2147483647);
      el.style.left = "0";
      el.style.top = "0";
      el.style.width = "100vw";
      el.style.height = "100vh";
      el.style.background =
        "linear-gradient(135deg, rgba(2,6,23,1) 0%, rgba(17,24,39,1) 40%, rgba(30,27,75,1) 100%)";
      el.style.pointerEvents = "auto";
    } catch {}

    // Body lock and app isolation
    try {
      prevOverflowRef.current = doc.body.style.overflow || null;
      doc.body.style.overflow = "hidden";
    } catch {}

    const appRoot = doc.getElementById("app-root");
    if (appRoot) {
      try { appRoot.setAttribute("inert", ""); } catch {}
      try { appRoot.setAttribute("aria-hidden", "true"); } catch {}
    }

    setRootEl(el);

    return () => {
      const wasCreated = createdRef.current;
      try { doc.body.style.overflow = prevOverflowRef.current ?? ""; } catch {}
      if (appRoot) {
        try { appRoot.removeAttribute("inert"); } catch {}
        try { appRoot.removeAttribute("aria-hidden"); } catch {}
      }
      if (el) {
        if (wasCreated) {
          try { el.parentNode?.removeChild(el); } catch {}
        } else {
          try { el.innerHTML = ""; } catch {}
        }
      }
    };
  }, []);

  if (!rootEl) return null;
  return createPortal(children, rootEl);
}

function TopBar({ templateId }: { templateId: string }) {
  const handleBack = () => {
    try { window.history.back(); } catch {}
  };
  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); } catch {}
  };
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        background: "rgba(10, 10, 20, 1)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        color: "#fff",
        userSelect: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={handleBack}
          style={{
            padding: "8px 12px",
            background: "#0f172a",
            border: "1px solid #334155",
            borderRadius: 8,
            color: "#e5e7eb",
          }}
        >
          Back
        </button>
        <div style={{ color: "#a3a3a3", fontSize: 14 }}>Template • <span style={{ color: "#fff" }}>{templateId}</span></div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={handleCopyLink}
          style={{
            padding: "8px 12px",
            background: "#0f172a",
            border: "1px solid #334155",
            borderRadius: 8,
            color: "#e5e7eb",
          }}
        >
          Copy Link
        </button>
        <button
          style={{
            padding: "8px 12px",
            background: "#0f172a",
            border: "1px solid #334155",
            borderRadius: 8,
            color: "#e5e7eb",
          }}
        >
          Shortcuts
        </button>
      </div>
    </div>
  );
}

function RightRail() {
  const buttons = ["Dashboard", "Scripts", "Optimize", "A/B", "Inception", "Validate", "Preview"];
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        right: 12,
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {buttons.map((label) => (
        <button
          key={label}
          style={{
            padding: "8px 10px",
            background: "#0f172a",
            border: "1px solid #334155",
            borderRadius: 8,
            color: "#e5e7eb",
            fontSize: 12,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function CenterWindow() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [defaultPos, setDefaultPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 420, height: 260 });
  const resizingRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  useEffect(() => {
    const x = Math.max(20, Math.round((window.innerWidth - size.width) / 2));
    const y = Math.max(80, Math.round((window.innerHeight - size.height) / 2));
    setDefaultPos({ x, y });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const { startX, startY, startW, startH } = resizingRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      setSize({ width: Math.max(260, startW + dx), height: Math.max(180, startH + dy) });
    };
    const onUp = () => {
      resizingRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    const enable = () => {
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    };
    if (resizingRef.current) enable();
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [resizingRef.current]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    resizingRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: rect ? rect.width : size.width,
      startH: rect ? rect.height : size.height,
    };
    // Trigger the effect to bind listeners
    setSize((s) => ({ ...s }));
  };

  return (
    <Draggable bounds="parent" handle=".window-title" defaultPosition={defaultPos} nodeRef={containerRef}>
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          width: size.width,
          height: size.height,
          background: "rgba(15,23,42,0.95)",
          border: "1px solid rgba(148,163,184,0.25)",
          borderRadius: 12,
          color: "#e5e7eb",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          overflow: "hidden",
        }}
      >
        <div
          className="window-title"
          style={{
            cursor: "move",
            padding: "10px 12px",
            borderBottom: "1px solid rgba(148,163,184,0.2)",
            background: "linear-gradient(180deg, rgba(2,6,23,0.9) 0%, rgba(2,6,23,0.6) 100%)",
            fontWeight: 600,
            letterSpacing: 0.3,
          }}
        >
          Dashboard
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: size.height - 48,
            fontSize: 28,
            fontWeight: 800,
            color: "#ffffff",
            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
            userSelect: "none",
          }}
        >
          IT WORKS (LAB)
        </div>
        <div
          onMouseDown={startResize}
          style={{
            position: "absolute",
            right: 6,
            bottom: 6,
            width: 14,
            height: 14,
            cursor: "nwse-resize",
            borderRight: "2px solid rgba(148,163,184,0.7)",
            borderBottom: "2px solid rgba(148,163,184,0.7)",
            borderRadius: 2,
          }}
          aria-label="Resize"
        />
      </div>
    </Draggable>
  );
}

export default function LabCanvasPage() {
  const templateId = useMemo(() => {
    if (typeof window === "undefined") return "sandbox-template";
    const q = new URLSearchParams(window.location.search);
    return q.get("templateId") || "sandbox-template";
  }, []);

  return (
    <IsolatedCanvasPortal>
      <div style={{ position: "absolute", inset: 0 }}>
        <TopBar templateId={templateId} />
        <RightRail />
        <div style={{ position: "absolute", inset: 0 }}>
          <CenterWindow />
        </div>
      </div>
    </IsolatedCanvasPortal>
  );
}


