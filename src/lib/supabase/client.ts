"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./env";

let _client: SupabaseClient | null = null;

// Global safety: log the URL actually used by the browser
function logUrlOnce() {
  if (typeof window === "undefined") return;
  if (!(window as any).__SB_URL_LOGGED__) {
    console.log("[supabase] using", SUPABASE_URL);
    (window as any).__SB_URL_LOGGED__ = true;
  }
}

export function getSupabaseClient() {
  if (_client) return _client;
  _client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { fetch: typeof window !== "undefined" ? window.fetch.bind(window) : fetch },
  });
  logUrlOnce();
  return _client;
}

// Alias for compatibility with common naming patterns
export const createClient = getSupabaseClient;