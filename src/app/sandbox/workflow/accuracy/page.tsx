"use client";

import React, { useEffect, useState } from "react";
import { SandboxWorkflowProvider } from "../_context/SandboxWorkflowContext";
import { SandboxServices } from "../_services";
import type { ValidationMetrics } from "../_types";

function AccuracyInner() {
  const [m, setM] = useState<ValidationMetrics | null>(null);
  useEffect(() => { SandboxServices.getValidationMetrics().then(setM); }, []);
  if (!m) return <div className="p-6">Loading…</div>;
  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold mb-4">Prediction Validation</h1>
      <div className="mb-4">
        <div className="text-lg font-medium" data-testid="kpi">KPI: {(m.accuracyKPI.value * 100).toFixed(1)}% – {m.accuracyKPI.num}/{m.accuracyKPI.denom}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded border p-3">
          <div className="font-medium mb-2">Calibration</div>
          <div data-testid="calibration-plot" className="space-y-1">
            {m.calibration.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="w-24">{b.bin}</div>
                <div className="flex-1 bg-gray-100 h-2 rounded">
                  <div className="bg-blue-500 h-2 rounded" style={{ width: `${b.expected * 100}%` }} />
                </div>
                <div className="flex-1 bg-gray-100 h-2 rounded">
                  <div className="bg-emerald-500 h-2 rounded" style={{ width: `${b.actual * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded border p-3">
          <div className="font-medium mb-2">Confusion Matrix</div>
          <table className="w-full text-sm"><tbody>
            <tr><td></td><td>Pred +</td><td>Pred -</td></tr>
            <tr><td>Actual +</td><td>{m.confusion.tp}</td><td>{m.confusion.fn}</td></tr>
            <tr><td>Actual -</td><td>{m.confusion.fp}</td><td>{m.confusion.tn}</td></tr>
          </tbody></table>
        </div>
      </div>
    </div>
  );
}

export default function AccuracyPage() {
  return (
    <SandboxWorkflowProvider>
      <AccuracyInner />
    </SandboxWorkflowProvider>
  );
}


