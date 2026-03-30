"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SandboxWorkflowProvider, useSandboxWorkflow } from "../_context/SandboxWorkflowContext";
import { SandboxServices } from "../_services";
import type { Template } from "../_types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function GalleryInner() {
  const router = useRouter();
  const { state, setTemplateId, emit } = useSandboxWorkflow();
  const [items, setItems] = useState<Template[]>([]);

  useEffect(() => {
    SandboxServices.listTemplates(state.niche, state.goal).then((list) => setItems(list.slice(0, 3)));
  }, [state.niche, state.goal]);

  const onUseTemplate = (id: string) => {
    setTemplateId(id);
    emit({ type: "template.selected", templateId: id });
    router.push("/sandbox/workflow/script");
  };

  return (
    <div className="min-h-screen p-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Starter Pack</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((t) => (
            <Card key={t.id} data-testid={`gallery-card-${t.id}`} className="relative">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span>{t.title}</span>
                  {t.recommended && <Badge className="ml-2">RECOMMENDED</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-gray-600 flex items-center gap-3">
                  <span>Success {(Math.round((t.successRate || 0) * 1000) / 10).toFixed(1)}%</span>
                  <span>7d Δ {t.delta7d! > 0 ? "+" : ""}{t.delta7d}%</span>
                  <span>{t.uses} uses</span>
                </div>
                <button data-testid="use-template" onClick={() => onUseTemplate(t.id)} className="mt-2 rounded bg-black text-white px-3 py-2 w-full">
                  Use this template
                </button>
              </CardContent>
              <div className="absolute -top-2 -left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded">Starter Pack</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GalleryPage() {
  return (
    <SandboxWorkflowProvider>
      <GalleryInner />
    </SandboxWorkflowProvider>
  );
}


