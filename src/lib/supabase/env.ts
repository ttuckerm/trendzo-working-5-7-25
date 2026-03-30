// Hard, explicit, correct project host. This stops the silent typo nonsense.
const FORCED_SUPABASE_HOST = "vyeiyccrageeckeehyhj.supabase.co";

// Read from env but fall back to the forced host (local-only safety rail)
const urlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const keyEnv = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const resolvedUrl =
  urlEnv && new URL(urlEnv).host.endsWith(".supabase.co")
    ? urlEnv
    : `https://${FORCED_SUPABASE_HOST}`;

(function assertEnv() {
  try {
    const u = new URL(resolvedUrl);
    if (u.host !== FORCED_SUPABASE_HOST) {
      // Fail loudly if we ever point at anything else
      throw new Error(
        `[FATAL] Wrong Supabase host. Got "${u.host}", expected "${FORCED_SUPABASE_HOST}".`
      );
    }
  } catch (e) {
    throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL: "${resolvedUrl}". ${String(e)}`);
  }
  if (!keyEnv || keyEnv.length < 40) {
    // If KEY is missing, we still boot — some pages may not need it.
    // But we log loudly so you know to fix .env.local later.
    if (typeof window !== "undefined") {
      console.error("[WARN] NEXT_PUBLIC_SUPABASE_ANON_KEY missing or short.");
    }
  }
})();

export const SUPABASE_URL = resolvedUrl;
export const SUPABASE_ANON_KEY = keyEnv;
