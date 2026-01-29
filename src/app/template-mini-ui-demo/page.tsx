"use client";

import React from "react";
import TemplateMiniUI from "@/components/templateMiniUI/TemplateMiniUI";

export default function Page() {
  return (
    <div className="p-4">
      <TemplateMiniUI templateId="demo-template" platform="tiktok" />
      <div className="mt-2 text-xs text-muted-foreground">
        Keyboard: D/S/O/B/I/V to open panels, E for editor, Esc to go back.
      </div>
    </div>
  );
}


