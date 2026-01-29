"use client";

import React from "react";
import type { ReactNode } from 'react'

export default function SandboxWorkflowLayout({ children }: { children: ReactNode }) {
  const enabled = process.env.NEXT_PUBLIC_SANDBOX_WORKFLOW === "1";
  if (!enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg text-center space-y-3">
          <div className="text-xl font-semibold">Sandbox disabled</div>
          <p className="text-gray-600">Set <code>NEXT_PUBLIC_SANDBOX_WORKFLOW=1</code> and restart dev server.</p>
          <p className="text-gray-500">See <code>README_SANDBOX_WORKFLOW.md</code> for details.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}


