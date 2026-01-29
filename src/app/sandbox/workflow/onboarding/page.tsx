"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SandboxWorkflowProvider, useSandboxWorkflow } from "../_context/SandboxWorkflowContext";
import { useConfetti } from "@/lib/hooks/useConfetti";

function OnboardingInner() {
  const router = useRouter();
  const { setNicheGoal, emit } = useSandboxWorkflow();
  const { triggerConfetti } = useConfetti?.() || { triggerConfetti: () => {} };
  const [niche, setNiche] = useState("");
  const [goal, setGoal] = useState("");

  const canContinue = niche && goal;

  const onContinue = () => {
    setNicheGoal(niche, goal);
    emit({ type: "onboarding.completed" });
    triggerConfetti?.();
    router.push("/sandbox/workflow/gallery");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Let’s get a quick win</h1>
          <p className="text-gray-500">We’ll ship one video in 10 min.</p>
        </div>
        <div className="grid gap-4">
          <label className="block">
            <span className="text-sm text-gray-700">Select Niche</span>
            <input data-testid="onboarding-niche" className="mt-1 w-full rounded border px-3 py-2" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="e.g. fitness, cooking" />
          </label>
          <label className="block">
            <span className="text-sm text-gray-700">Select Goal</span>
            <input data-testid="onboarding-goal" className="mt-1 w-full rounded border px-3 py-2" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. sales, leadgen" />
          </label>
        </div>
        <div className="flex justify-end">
          <button data-testid="onboarding-continue" disabled={!canContinue} onClick={onContinue} className="rounded bg-black text-white px-4 py-2 disabled:opacity-50">
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <SandboxWorkflowProvider>
      <OnboardingInner />
    </SandboxWorkflowProvider>
  );
}


