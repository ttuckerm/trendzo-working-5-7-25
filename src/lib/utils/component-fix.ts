"use client";

/**
 * Component Fix Utility — DISABLED
 *
 * Previously this file monkey-patched Node.prototype.removeChild,
 * manipulated the DOM outside of React, and ran a MutationObserver
 * on every DOM change. All of this corrupted React's internal fiber
 * tree and broke event delegation (navigation clicks silently failed).
 *
 * The exports are kept as no-ops so existing call-sites don't break.
 */

export function forceReinitializeComponents() {
  return () => {};
}

export function useComponentFix() {
  return () => {};
} 