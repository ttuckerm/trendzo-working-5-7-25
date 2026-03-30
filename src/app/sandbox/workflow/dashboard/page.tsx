"use client";

import React from "react";

export default function SandboxDashboardPage() {
  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold mb-4">Command Dashboard (Sandbox)</h1>
      <div className="mb-4">
        <a
          href="/lab/canvas?templateId=sandbox-template"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded border px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Open Clean-Room Canvas (new tab)
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" data-testid="system-health-tiles">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded border px-3 py-4 text-center">
            <div className="text-sm text-gray-500">Service {i + 1}</div>
            <div className="text-emerald-600 font-semibold">OK</div>
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 rounded border flex items-center justify-between" data-testid="algo-weather-banner">
        <div>
          <div className="font-medium">Algorithm Weather</div>
          <div className="text-sm text-amber-600">Shift detected — thresholds changed in sandbox.</div>
        </div>
        <button className="rounded border px-3 py-1.5">View diff</button>
      </div>
    </div>
  );
}


