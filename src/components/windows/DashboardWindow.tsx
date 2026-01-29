"use client";

import React from 'react';

export function DashboardWindow() {
  return (
    <div className="h-full w-full overflow-auto p-4 text-zinc-200">
      <div className="text-sm uppercase tracking-wide text-zinc-400">Dashboard</div>
      <div className="mt-2 text-lg font-semibold">Template Insights</div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-zinc-400">48h Accuracy</div>
          <div className="mt-1 text-2xl font-bold">92%</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-zinc-400">Adoption</div>
          <div className="mt-1 text-2xl font-bold">1,204</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-zinc-400">Lift</div>
          <div className="mt-1 text-2xl font-bold">+24%</div>
        </div>
      </div>
      <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
        Branded dashboard window (sandbox). Drag/resize the window. Press Esc to close.
      </div>
    </div>
  );
}


