"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SandboxWorkflowProvider, useSandboxWorkflow } from "../_context/SandboxWorkflowContext";
import type { Prediction } from "../_types";
import { SandboxServices } from "../_services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

function ReceiptInner() {
  const router = useRouter();
  const { state, addReceipt, emit } = useSandboxWorkflow();
  const nowISO = useMemo(() => new Date().toISOString(), []);
  const { toast } = useToast();

  useEffect(() => {
    const pred: Prediction = {
      id: `pred_${Date.now()}`,
      score: state.analysis?.score || 0.84,
      platformPlan: (state.schedule?.items || []).map((it) => ({ platform: it.platform, dayOffset: it.dayOffset })),
      madeAtISO: nowISO,
    };
    addReceipt(pred);
    SandboxServices.savePredictionReceipt(pred).then(() => emit({ type: "receipt.saved" }));
    toast?.({ title: "We’ll check back in 48h.", description: "Meanwhile, explore Accuracy & Learning.", duration: 3000 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-xl mx-auto">
        <Card data-testid="prediction-receipt">
          <CardHeader>
            <CardTitle>Prediction Receipt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>ID: {state.receipts?.[state.receipts.length - 1]?.id}</div>
            <div>Timestamp: {state.receipts?.[state.receipts.length - 1]?.madeAtISO}</div>
            <div>Score: {Math.round((state.receipts?.[state.receipts.length - 1]?.score || 0) * 100)}%</div>
            <div>Plan: {(state.receipts?.[state.receipts.length - 1]?.platformPlan || []).map((p) => `${p.platform}(+${p.dayOffset})`).join(", ")}</div>
            <button className="rounded border px-3 py-2" onClick={() => router.push("/sandbox/workflow/accuracy")} data-testid="view-in-accuracy">Validate in 48h</button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <SandboxWorkflowProvider>
      <ReceiptInner />
    </SandboxWorkflowProvider>
  );
}


