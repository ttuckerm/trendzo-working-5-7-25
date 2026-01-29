"use client";

import { useEffect } from "react";

export default function SupabaseUrlShim() {
  useEffect(() => {
    const BAD_HOSTS = new Set([
      "yvylyccragcekeebvhj.supabase.co", // the typo you saw
      "vyeiyccrageckeehyhj.supabase.co", // any other corrupted variant
    ]);
    const GOOD_HOST = "vyeiyccrageeckeehyhj.supabase.co";

    const origFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const url = new URL(String(input));
        if (url.host.endsWith(".supabase.co") && url.host !== GOOD_HOST) {
          console.warn("[shim] rewriting Supabase host:", url.host, "→", GOOD_HOST);
          url.host = GOOD_HOST;
          return origFetch(url.toString(), init);
        }
      } catch {
        // ignore non-URL inputs
      }
      return origFetch(input, init);
    };

    return () => {
      window.fetch = origFetch;
    };
  }, []);

  return null;
}
