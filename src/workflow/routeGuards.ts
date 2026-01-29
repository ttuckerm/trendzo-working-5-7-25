// @ts-nocheck
export const STUDIO_ROUTE = "/admin/studio";

const ALLOWED_STARTER_FLOW_PREFIXES = [
  "/admin/studio",
  "/admin/studio/script",
  "/admin/studio/analysis",
  "/admin/studio/schedule",
  "/admin/studio/receipt",
  // Top-level convenience routes (explicit per spec)
  "/analysis",
  "/schedule",
  "/receipt",
];

// Explicit deny list: Admin/Recipe Book and analytics routes should never match starter surfaces
const DENY_PREFIXES = [
  "/admin/viral-recipe-book",
  "/admin/recipe-book",
  "/admin/prediction-validation",
  "/admin/accuracy",
  "/admin/analytics",
];

export function isStudioViralWorkflow(pathname, activeTopTab) {
  if (!pathname || typeof pathname !== "string") return false;
  if (DENY_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  const onStudio = pathname === STUDIO_ROUTE || pathname.startsWith(`${STUDIO_ROUTE}`);
  const isViralTab = String(activeTopTab).toLowerCase() === "viral-workflow";
  return onStudio && isViralTab;
}

export function isAllowedStarterFlowPath(pathname) {
  if (!pathname || typeof pathname !== "string") return false;
  if (DENY_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  return ALLOWED_STARTER_FLOW_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export const denyPrefixes = DENY_PREFIXES.slice();
export const allowedStarterFlowPrefixes = ALLOWED_STARTER_FLOW_PREFIXES.slice();


