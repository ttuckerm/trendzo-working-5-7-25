"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isStudioViralWorkflow } from "./routeGuards";

/**
 * Safe, no-op mount check used ONLY by Studio/Viral Workflow gallery container.
 * Asserts that we are on /admin/studio and the active top tab is Viral Workflow.
 * No UI render, no side effects beyond debug logging.
 */
export function useStarterSurfaceCheck(getActiveTopTab: () => string): void {
  const pathname = usePathname();

  useEffect(() => {
    const activeTopTab = getActiveTopTab?.() ?? "";
    const ok = isStudioViralWorkflow(pathname || "", activeTopTab);
    if (!ok) {
      // log quietly for diagnostics without throwing or affecting UI
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.debug("StarterSurfaceCheck: not on Studio/Viral Workflow", { pathname, activeTopTab });
      }
    } else {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.debug("StarterSurfaceCheck: confirmed Studio/Viral Workflow", { pathname, activeTopTab });
      }
    }
  }, [pathname, getActiveTopTab]);
}


