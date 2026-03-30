"use client";

/**
 * DOM Patches — DISABLED
 *
 * Previously this file monkey-patched Node.prototype.insertBefore and
 * removeChild to silently swallow errors. This caused React's virtual DOM
 * to diverge from the real DOM, which broke event delegation and made
 * navigation clicks silently fail.
 *
 * The functions are kept as no-ops so existing call-sites don't break.
 */

export function applyDOMPatches() {
  return () => {};
}

export function useDOMPatches() {
  return () => {};
} 