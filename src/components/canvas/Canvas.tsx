"use client";

import React, { PropsWithChildren } from 'react';

export function CanvasRoot({ children }: PropsWithChildren) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      {/* Subtle aurora */}
      <div className="pointer-events-none absolute -top-40 right-0 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      {children}
    </div>
  );
}


